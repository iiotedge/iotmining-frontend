"use client"
import { Slider, TreeSelect, Switch as AntdSwitch, Segmented } from "antd"
import { useState, useEffect, useCallback } from "react"
import {
  Modal, Form, Input, Select, Tabs, Button, Divider, InputNumber, message, Spin, Alert,
} from "antd"
import { useMediaQuery } from "../../hooks/useMediaQuery"
import { listDevices, getDeviceById } from "../../api/deviceApi"
import { useMqttPreview } from "../../hooks/useMqttPreview"
import { widgetSchemas } from "./widgets/widgetSchemas"
import "../../styles/widget-modal.css"

const { TabPane } = Tabs
const { Option } = Select

const CONTROL_WIDGET_TYPES = ["slider-control", "fan-control", "switch-control"]

function extractStreamOutputs(profile) {
  if (!profile?.outputs || !Array.isArray(profile.outputs)) return []
  return profile.outputs
    .filter(out => out.key)
    .map(out => ({
      label: out.key,
      value: out.key,
      type: out.dataType?.toUpperCase() || "",
      kind: "output",
      raw: out,
      description: out.description,
      isBackend: true,
    }))
}

function extractTelemetryInputs(profile) {
  let inputs = []
  if (Array.isArray(profile?.inputs)) {
    inputs = profile.inputs
  } else if (Array.isArray(profile?.metadata?.inputs)) {
    inputs = profile.metadata.inputs
  }
  return (inputs || []).map(input => ({
    label: (input.description || (input.key?.charAt(0).toUpperCase() + input.key?.slice(1))) + " (Control)",
    value: input.key,
    type: input.dataType?.toLowerCase() === "float" || input.dataType?.toLowerCase() === "int" ? "timeseries" : "attribute",
    kind: "input",
    raw: input,
  }))
}

// All nodes are selectable (object or primitive)
function buildTreeFromSample(obj, prefix = "") {
  if (!obj || typeof obj !== "object") return []
  return Object.keys(obj).map(key => {
    const path = prefix ? `${prefix}.${key}` : key
    const value = obj[key]
    const isObject = typeof value === "object" && value !== null && !Array.isArray(value)
    return {
      title: key,
      value: path,
      key: path,
      selectable: true,
      children: isObject ? buildTreeFromSample(value, path) : undefined,
    }
  })
}

function buildBackendTree(outputs) {
  if (!Array.isArray(outputs)) return []
  return outputs
    .filter(out => out.key)
    .map(out => ({
      title: out.key,
      value: out.key,
      key: out.key,
      selectable: true,
      description: out.description,
      isBackend: true,
    }))
}

function mergeTreeData(backendTree, discoveredTree) {
  const backendRootKeys = new Set(backendTree.map(n => n.key))
  return [
    ...backendTree,
    ...discoveredTree.filter(n => !backendRootKeys.has(n.key)),
  ]
}

function renderSettingsField(field, settingsForm) {
  const val = settingsForm.getFieldValue(field.name)
  if (field.type === "list" && (!field.default || typeof field.default[0] !== "object")) {
    return (
      <Select
        mode="tags"
        tokenSeparators={[","]}
        style={{ width: "100%" }}
        placeholder={`Enter multiple values (comma or enter)`}
        value={Array.isArray(val) ? val : field.default}
      />
    )
  }
  if (field.type === "list" && field.default && typeof field.default[0] === "object") {
    return (
      <Select
        mode="tags"
        style={{ width: "100%" }}
        placeholder="Enter as JSON, or use default"
        value={
          Array.isArray(val)
            ? val.map(item =>
              typeof item === "object" && item !== null
                ? JSON.stringify(item)
                : item
            )
            : field.default.map(item => JSON.stringify(item))
        }
        onChange={arr => {
          const objs = arr.map(str => {
            try {
              return JSON.parse(str)
            } catch {
              return str
            }
          })
          settingsForm.setFieldsValue({ [field.name]: objs })
        }}
      >
        {field.default.map(item => (
          <Select.Option key={JSON.stringify(item)} value={JSON.stringify(item)}>
            {item.label || JSON.stringify(item)}
          </Select.Option>
        ))}
      </Select>
    )
  }
  if (field.type === "select" && Array.isArray(field.options)) {
    return (
      <Select>
        {field.options.map(opt =>
          <Option key={opt} value={opt}>{opt}</Option>
        )}
      </Select>
    )
  }
  switch (field.type) {
    case "input": return <Input />
    case "password": return <Input.Password />
    case "number": return <InputNumber min={field.min} max={field.max} style={{ width: "100%" }} />
    case "switch": return <AntdSwitch />
    case "slider": return <Slider min={field.min ?? 0} max={field.max ?? 100} />
    default: return <Input />
  }
}

// Get value from object by dot-path (e.g., "a.b.c")
function getValueByPath(obj, path) {
  if (!obj || !path) return undefined
  if (path === "ROOT") return obj
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj)
}

const WidgetConfigModal = ({
  visible, onCancel, onSave, widget, tenantId: propTenantId,
}) => {
  const tenantId = propTenantId || localStorage.getItem("tenantId")
  const [form] = Form.useForm()
  const [settingsForm] = Form.useForm()
  const [activeTab, setActiveTab] = useState("general")
  const [selectedDataSource, setSelectedDataSource] = useState(widget?.config?.dataSource?.type || "device")
  const [selectedDeviceId, setSelectedDeviceId] = useState(widget?.config?.dataSource?.deviceId || null)
  const [availableTelemetry, setAvailableTelemetry] = useState([])
  const [selectedTelemetry, setSelectedTelemetry] = useState(widget?.config?.dataSource?.telemetry || [])
  const [primaryTelemetryKey, setPrimaryTelemetryKey] = useState(
    widget?.config?.dataSource?.displayKey ||
    (widget?.config?.dataSource?.telemetry?.length ? widget.config.dataSource.telemetry[0] : undefined)
  )
  const [availableTelemetryOut, setAvailableTelemetryOut] = useState([])
  const [selectedTelemetryOut, setSelectedTelemetryOut] = useState(widget?.config?.dataSource?.telemetryOut || [])
  const [deviceList, setDeviceList] = useState([])
  const [loadingDevices, setLoadingDevices] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [mqttTopic, setMqttTopic] = useState("")
  const [protocol, setProtocol] = useState(widget?.config?.dataSource?.protocol || "MQTT")
  const [streamUrl, setStreamUrl] = useState(widget?.config?.dataSource?.streamUrl || "")
  const [lastSampleData, setLastSampleData] = useState({})
  const [selectionMode, setSelectionMode] = useState("telemetry")
  const [selectedObjectPath, setSelectedObjectPath] = useState("")
  const [selectedObjectValue, setSelectedObjectValue] = useState(undefined)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const widgetType = widget?.type
  const settingsSchema = widgetSchemas?.[widgetType] || []
  const isControlWidget = CONTROL_WIDGET_TYPES.includes(widgetType)

  // MQTT sample preview & log for discovering fields
  const [lastMqttData, mqttLog] = useMqttPreview(mqttTopic, visible, useCallback((data) => {
    if (typeof data === "object" && data !== null) {
      setLastSampleData(data)
    }
  }, []))

  const handleDataSourceChange = (value) => {
    setSelectedDataSource(value)
    form.setFieldsValue({ deviceId: null, telemetry: [], telemetryOut: [], displayKey: undefined })
    setSelectedDeviceId(null)
    setSelectedTelemetry([])
    setPrimaryTelemetryKey(undefined)
    setSelectedTelemetryOut([])
    setAvailableTelemetry([])
    setAvailableTelemetryOut([])
    setLastSampleData({})
    setProtocol("MQTT")
    setStreamUrl("")
    setSelectedObjectPath("")
    setSelectedObjectValue(undefined)
  }
  const handleDeviceChange = (value) => {
    setSelectedDeviceId(value)
    form.setFieldsValue({ telemetry: [], telemetryOut: [], displayKey: undefined })
    setSelectedTelemetry([])
    setPrimaryTelemetryKey(undefined)
    setSelectedTelemetryOut([])
    setAvailableTelemetry([])
    setAvailableTelemetryOut([])
    setLastSampleData({})
    setSelectedObjectPath("")
    setSelectedObjectValue(undefined)
  }

  // Reset modal state
  useEffect(() => {
    if (visible && widget) {
      const telemetryKeys = widget?.config?.dataSource?.telemetry || []
      form.setFieldsValue({
        title: widget.title || "",
        dataSource: widget.config?.dataSource?.type || "device",
        deviceId: widget.config?.dataSource?.deviceId || null,
        telemetry: telemetryKeys,
        telemetryOut: widget.config?.dataSource?.telemetryOut || [],
        displayKey: widget.config?.dataSource?.displayKey || (telemetryKeys.length > 0 ? telemetryKeys[0] : undefined),
        ...widget.config,
      })
      settingsForm.setFieldsValue({ ...(widget.config || {}) })
      setActiveTab("general")
      setSelectedDataSource(widget.config?.dataSource?.type || "device")
      setSelectedDeviceId(widget.config?.dataSource?.deviceId || null)
      setSelectedTelemetry(telemetryKeys)
      setPrimaryTelemetryKey(widget.config?.dataSource?.displayKey || (telemetryKeys.length > 0 ? telemetryKeys[0] : undefined))
      setSelectedTelemetryOut(widget?.config?.dataSource?.telemetryOut || [])
      setAvailableTelemetry([])
      setAvailableTelemetryOut([])
      setLastSampleData({})
      setProtocol(widget?.config?.dataSource?.protocol || "MQTT")
      setStreamUrl(widget?.config?.dataSource?.streamUrl || "")
      setSelectionMode("telemetry")
      setSelectedObjectPath("")
      setSelectedObjectValue(undefined)
    }
  }, [visible, widget, form, settingsForm])

  // Persist Full Object selection when new data arrives
  useEffect(() => {
    if (!selectedObjectPath) return
    // Try to resolve and persist selection
    const value = getValueByPath(lastSampleData, selectedObjectPath)
    if (value !== undefined) {
      setSelectedObjectValue(value)
    } else {
      setSelectedObjectPath("")
      setSelectedObjectValue(undefined)
    }
    // eslint-disable-next-line
  }, [lastSampleData])

  useEffect(() => {
    setSelectedObjectPath("")
    setSelectedObjectValue(undefined)
  }, [selectionMode, visible])

  // Fetch devices for dropdown
  useEffect(() => {
    if (visible && selectedDataSource === "device" && tenantId) {
      setLoadingDevices(true)
      listDevices({ tenantId, page: 0, size: 100 })
        .then((data) => {
          const mapped = (data.content || []).map(d => ({
            ...d,
            id: d.deviceId,
            name: d.deviceName,
            profile: d.profile,
          }))
          setDeviceList(mapped)
        })
        .catch((e) => {
          setDeviceList([])
          message.error(e.message || "Failed to load devices")
        })
        .finally(() => setLoadingDevices(false))
    } else if (selectedDataSource !== "device") {
      setDeviceList([])
      setSelectedDeviceId(null)
      setAvailableTelemetry([])
      setAvailableTelemetryOut([])
      setProtocol("MQTT")
      setStreamUrl("")
    }
  }, [selectedDataSource, visible, tenantId])

  // Fetch device profile for outputs/inputs/metadata for telemetry and protocol/url
  useEffect(() => {
    if (visible && selectedDeviceId) {
      setLoadingProfile(true)
      getDeviceById(selectedDeviceId, { withProfile: true })
        .then((data) => {
          const profile =
            data.profile ||
            data.device?.profile ||
            data.device?.deviceProfile || {}

          const outputs = extractStreamOutputs(profile)
          setAvailableTelemetry(outputs)
          if (CONTROL_WIDGET_TYPES.includes(widgetType)) {
            setAvailableTelemetryOut(extractTelemetryInputs(profile))
          }
          let meta = profile?.metadata || {}
          const metaTopic = meta.mqtt_topic
          setMqttTopic(
            metaTopic && selectedDeviceId
              ? `${metaTopic}/${selectedDeviceId}/up/data`
              : ""
          )
          let streamInfo = outputs[0]
          let detectedProtocol = streamInfo?.type || (profile?.protocol || "MQTT").toUpperCase()
          let detectedStreamUrl = streamInfo?.value || ""
          setProtocol(detectedProtocol)
          setStreamUrl(detectedStreamUrl)
        })
        .catch((e) => {
          setAvailableTelemetry([])
          setAvailableTelemetryOut([])
          setMqttTopic("")
          setProtocol("MQTT")
          setStreamUrl("")
          message.error(e.message || "Failed to fetch device telemetry info")
        })
        .finally(() => setLoadingProfile(false))
    } else {
      setAvailableTelemetry([])
      setAvailableTelemetryOut([])
      setMqttTopic("")
      setProtocol("MQTT")
      setStreamUrl("")
    }
  }, [selectedDeviceId, visible, widgetType])

  // --- Build merged telemetry tree for TreeSelect ---
  let outputs = []
  if (selectedDeviceId) {
    const deviceProfile = deviceList.find(d => d.id === selectedDeviceId)?.profile
    outputs = (deviceProfile?.outputs) ? deviceProfile.outputs : []
  }

  // UPDATED: Discovered tree with root node
  const discoveredTree = lastSampleData && Object.keys(lastSampleData).length > 0
    ? [{
        title: "(Full JSON Object)",
        value: "ROOT",
        key: "ROOT",
        selectable: true,
        children: buildTreeFromSample(lastSampleData, ""),
      }]
    : []

  const backendTree = buildBackendTree(outputs)
  const telemetryTreeData = mergeTreeData(backendTree, discoveredTree)
  const safeTreeData = telemetryTreeData.length
    ? telemetryTreeData
    : [{ title: "(No telemetry keys yet)", value: "none", key: "none", disabled: true }]

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const settingsValues = await settingsForm.validateFields().catch(() => ({}))
      let fans = widget.config?.fans
      if (widgetType === "fan-control") {
        const {
          numFans = 2,
          speedUnit = "%",
          tempUnit = "°C",
          maintenanceHours = 8760,
          runtime = 0,
        } = settingsValues
        fans = Array.from({ length: numFans }, (_, idx) => ({
          id: `FAN${idx + 1}`,
          name: `Fan ${idx + 1}`,
          speedUnit,
          tempUnit,
          maintenanceHours,
          runtime,
        }))
      }
      let dataSourceConfig = {
        ...widget.config?.dataSource,
        type: values.dataSource,
        deviceId: values.deviceId,
        topic: mqttTopic,
        protocol,
        streamUrl,
      }
      if (selectionMode === "telemetry") {
        dataSourceConfig.telemetry = values.telemetry || []
        dataSourceConfig.displayKey = values.displayKey || (values.telemetry?.[0])
        dataSourceConfig.isJsonObject = false
        delete dataSourceConfig.jsonObjectPath
        delete dataSourceConfig.jsonObjectValue
      } else if (selectionMode === "object") {
        dataSourceConfig.isJsonObject = true
        dataSourceConfig.jsonObjectPath = selectedObjectPath
        dataSourceConfig.jsonObjectValue = selectedObjectPath === "ROOT" ? lastSampleData : selectedObjectValue
        delete dataSourceConfig.telemetry
        delete dataSourceConfig.displayKey
      }
      if (CONTROL_WIDGET_TYPES.includes(widgetType)) {
        dataSourceConfig.telemetryOut = values.telemetryOut
      }
      const updatedWidget = {
        ...widget,
        title: values.title,
        config: {
          ...widget.config,
          ...settingsValues,
          fans,
          title: values.title,
          dataSource: dataSourceConfig,
        },
      }
      if (values.dataSource === "device" && values.deviceId) {
        const selectedDevice = deviceList.find((d) => d.id === values.deviceId)
        updatedWidget.deviceId = values.deviceId
        updatedWidget.deviceName = selectedDevice?.name || "Unknown Device"
      }
      onSave(updatedWidget)
    } catch (e) {
      console.warn("[WidgetConfigModal] Save error:", e)
    }
  }

  useEffect(() => {
    if (selectedTelemetry.length > 0) {
      setPrimaryTelemetryKey(selectedTelemetry.includes(primaryTelemetryKey) ? primaryTelemetryKey : selectedTelemetry[0])
      form.setFieldsValue({ displayKey: selectedTelemetry.includes(primaryTelemetryKey) ? primaryTelemetryKey : selectedTelemetry[0] })
    } else {
      setPrimaryTelemetryKey(undefined)
      form.setFieldsValue({ displayKey: undefined })
    }
  }, [selectedTelemetry])

  function collectLeafDotPaths(treeData, selectedKeys) {
    const keySet = new Set(selectedKeys)
    const leaves = []

    function traverse(nodes, parentSelected) {
      if (!Array.isArray(nodes)) return
      for (const node of nodes) {
        const isLeaf = !node.children || node.children.length === 0
        const isSelected = keySet.has(node.key)
        if (isLeaf && (isSelected || parentSelected)) {
          leaves.push(node.key)
        } else if (node.children && node.children.length) {
          traverse(node.children, isSelected || parentSelected)
        }
      }
    }

    traverse(treeData, false)
    return Array.from(new Set(leaves))
  }

  return (
    <Modal
      title={`Configure Widget: ${widget?.title || ""}`}
      open={visible}
      onCancel={onCancel}
      width={isMobile ? "100%" : 800}
      className="widget-config-modal"
      footer={[
        <Button key="cancel" onClick={onCancel}>Cancel</Button>,
        <Button key="save" type="primary" onClick={handleSave}>Save</Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="General" key="general">
            <Form.Item
              name="title"
              label="Widget Title"
              rules={[{ required: true, message: "Please enter a title" }]}
            >
              <Input />
            </Form.Item>
            <Divider orientation="left">Data Source</Divider>
            <Form.Item name="dataSource" label="Data Source Type">
              <Select onChange={handleDataSourceChange} value={selectedDataSource}>
                <Option value="device">Device</Option>
                <Option value="asset">Asset</Option>
                <Option value="entity">Entity</Option>
                <Option value="static">Static Data</Option>
              </Select>
            </Form.Item>
            {selectedDataSource === "device" && (
              <>
                <Form.Item
                  name="deviceId"
                  label="Device"
                  rules={[{ required: true, message: "Please select a device" }]}
                >
                  <Select
                    onChange={handleDeviceChange}
                    placeholder={loadingDevices ? "Loading devices..." : "Select device"}
                    loading={loadingDevices}
                    showSearch
                    filterOption={(input, option) =>
                      option.children && option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    value={selectedDeviceId}
                    notFoundContent={loadingDevices ? <Spin size="small" /> : "No devices found"}
                  >
                    {(deviceList || []).map((device) => (
                      <Option key={device.id} value={device.id}>
                        {device.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                {/* Show protocol/URL info */}
                {selectedDeviceId && (
                  <Alert
                    message={`Detected Protocol: ${protocol}${streamUrl ? ` (${streamUrl})` : ""}`}
                    type={protocol && protocol !== "MQTT" ? "success" : "info"}
                    showIcon
                    style={{ marginBottom: 8 }}
                  />
                )}
                {selectedDeviceId && !mqttTopic && protocol === "MQTT" && (
                  <Alert
                    message="No MQTT topic found for this device. Please check device profile metadata."
                    type="warning"
                    showIcon
                  />
                )}
                {/* --- Selection Mode Switch --- */}
                <div style={{ marginBottom: 8 }}>
                  <Segmented
                    options={[
                      { label: "Telemetry", value: "telemetry" },
                      { label: "Full Object", value: "object" },
                    ]}
                    value={selectionMode}
                    onChange={setSelectionMode}
                    block
                  />
                </div>
                {/* --- Telemetry OR Full Object --- */}
                {selectionMode === "telemetry" ? (
                  <Form.Item
                    name="telemetry"
                    label="Streams / Telemetry (Live Value)"
                    rules={[{ required: true, message: "Please select at least one telemetry/output" }]}
                  >
                    <TreeSelect
                      treeData={safeTreeData}
                      value={selectedTelemetry}
                      onChange={v => {
                        const leaves = collectLeafDotPaths(safeTreeData, v)
                        setSelectedTelemetry(leaves)
                        form.setFieldsValue({ telemetry: leaves })
                      }}
                      treeCheckable
                      showCheckedStrategy={TreeSelect.SHOW_PARENT}
                      multiple
                      style={{ width: "100%" }}
                      placeholder="Select telemetry/output (including child/nested fields)"
                      allowClear
                      treeDefaultExpandAll
                      dropdownStyle={{ maxHeight: 300, overflow: "auto" }}
                    />
                  </Form.Item>
                ) : (
                  <Form.Item label="Select JSON Node">
                    <TreeSelect
                      treeData={safeTreeData}
                      value={selectedObjectPath}
                      onChange={path => {
                        setSelectedObjectPath(path)
                        setSelectedObjectValue(getValueByPath(lastSampleData, path))
                      }}
                      multiple={false}
                      showSearch
                      treeDefaultExpandAll
                      allowClear
                      style={{ width: "100%" }}
                      placeholder="Select any node from latest JSON object"
                      dropdownStyle={{ maxHeight: 300, overflow: "auto" }}
                    />
                    {selectedObjectPath && (
                      <Alert
                        message={<span>
                          Selected Node: <b>{selectedObjectPath === "ROOT" ? "(Full JSON Object)" : selectedObjectPath}</b>
                        </span>}
                        description={
                          <pre style={{ fontSize: 12, margin: 0, background: "#fafafa" }}>
                            {JSON.stringify(selectedObjectPath === "ROOT" ? lastSampleData : selectedObjectValue, null, 2)}
                          </pre>
                        }
                        type="info"
                        showIcon
                        style={{ marginTop: 8 }}
                      />
                    )}
                  </Form.Item>
                )}
                {/* DisplayKey select */}
                {selectionMode === "telemetry" && selectedTelemetry.length > 0 && (
                  <Form.Item
                    name="displayKey"
                    label="Primary Telemetry Key"
                    rules={[{ required: true, message: "Please select a primary key to display" }]}
                    initialValue={primaryTelemetryKey || selectedTelemetry[0]}
                  >
                    <Select
                      value={form.getFieldValue("displayKey") || selectedTelemetry[0]}
                      onChange={value => { setPrimaryTelemetryKey(value); form.setFieldsValue({ displayKey: value }) }}
                      style={{ width: "100%" }}
                    >
                      {selectedTelemetry.map(key => (
                        <Option key={key} value={key}>{key}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}
                {/* Only for control widgets: telemetryOut select (from inputs) */}
                {selectedDeviceId && isControlWidget && !!availableTelemetryOut.length && (
                  <Form.Item
                    name="telemetryOut"
                    label="Telemetry Out (for control/command)"
                    rules={[{ required: true, message: "Please select at least one telemetry output (input field)" }]}
                    initialValue={selectedTelemetryOut}
                  >
                    <Select
                      mode="multiple"
                      value={selectedTelemetryOut}
                      onChange={setSelectedTelemetryOut}
                      placeholder={loadingProfile ? "Loading inputs..." : "Select input(s) for control"}
                      optionLabelProp="label"
                      notFoundContent={loadingProfile ? <Spin size="small" /> : "No inputs"}
                    >
                      {(availableTelemetryOut || []).map((key) =>
                        key.disabled ? (
                          <Option key={key.value} value={key.value} disabled>
                            <span style={{ fontWeight: "bold", color: "#aaa" }}>{key.label}</span>
                          </Option>
                        ) : (
                          <Option key={key.value} value={key.value} label={key.label}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>{key.label}</span>
                              <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>{key.type}</span>
                            </div>
                          </Option>
                        )
                      )}
                    </Select>
                  </Form.Item>
                )}
                {/* MQTT preview and logs */}
                {selectedDeviceId && lastMqttData && (
                  <Alert
                    message="Last MQTT Data (debug)"
                    description={<pre style={{ fontSize: 12, margin: 0 }}>{JSON.stringify(lastMqttData, null, 2)}</pre>}
                    type="info"
                    showIcon
                  />
                )}
                {selectedDeviceId && (
                  <Button
                    size="small"
                    onClick={() => { /* If you want to clear log, manage in useMqttPreview */ }}
                    style={{ marginTop: 8, marginBottom: 8 }}
                  >
                    Clear MQTT Logs
                  </Button>
                )}
                {selectedDeviceId && mqttLog.length > 0 && (
                  <div style={{ maxHeight: 80, overflow: "auto", background: "#fafafa", fontSize: 12, marginBottom: 8, border: "1px solid #eee" }}>
                    {mqttLog.map((line, i) => <div key={i}>{line}</div>)}
                  </div>
                )}
              </>
            )}
            {selectedDataSource === "static" && (
              <Form.Item name="staticData" label="Static Data">
                <Input.TextArea rows={4} placeholder="Enter JSON data" />
              </Form.Item>
            )}
          </TabPane>
          <TabPane tab="Settings" key="settings">
            <Form form={settingsForm} layout="vertical">
              {settingsSchema.length === 0 ? (
                <div style={{ color: "#999" }}>No extra settings for this widget.</div>
              ) : (
                settingsSchema.map(field => {
                  const formValues = settingsForm.getFieldsValue()
                  if (field.showIf && !field.showIf(formValues)) return null
                  return (
                    <Form.Item
                      key={field.name}
                      name={field.name}
                      label={field.label}
                      tooltip={field.description || field.tooltip}
                      rules={field.required ? [{ required: true, message: `Required: ${field.label}` }] : undefined}
                      initialValue={widget.config?.[field.name] ?? field.default}
                      valuePropName={field.type === "switch" ? "checked" : "value"}
                    >
                      {renderSettingsField(field, settingsForm)}
                    </Form.Item>
                  )
                })
              )}
            </Form>
          </TabPane>
          <TabPane tab="Advanced" key="advanced">
            <Form.Item name="refreshInterval" label="Refresh Interval (seconds)">
              <InputNumber min={1} max={3600} />
            </Form.Item>
            <Form.Item name="backgroundColor" label="Background Color">
              <Input type="color" />
            </Form.Item>
            <Form.Item name="titleColor" label="Title Color">
              <Input type="color" />
            </Form.Item>
            <Form.Item name="showTitle" label="Show Title" valuePropName="checked">
              <AntdSwitch />
            </Form.Item>
            <Form.Item name="dropShadow" label="Drop Shadow" valuePropName="checked">
              <AntdSwitch />
            </Form.Item>
            <Form.Item name="borderRadius" label="Border Radius (px)">
              <InputNumber min={0} max={24} />
            </Form.Item>
          </TabPane>
        </Tabs>
      </Form>
    </Modal>
  )
}

export default WidgetConfigModal

// "use client"
// import { Slider, TreeSelect, Switch as AntdSwitch, Segmented } from "antd"
// import { useState, useEffect, useCallback } from "react"
// import {
//   Modal, Form, Input, Select, Tabs, Button, Divider, InputNumber, message, Spin, Alert,
// } from "antd"
// import { useMediaQuery } from "../../hooks/useMediaQuery"
// import { listDevices, getDeviceById } from "../../api/deviceApi"
// import { useMqttPreview } from "../../hooks/useMqttPreview"
// import { widgetSchemas } from "./widgets/widgetSchemas"
// import "../../styles/widget-modal.css"

// const { TabPane } = Tabs
// const { Option } = Select

// const CONTROL_WIDGET_TYPES = ["slider-control", "fan-control", "switch-control"]

// function extractStreamOutputs(profile) {
//   if (!profile?.outputs || !Array.isArray(profile.outputs)) return []
//   return profile.outputs
//     .filter(out => out.key)
//     .map(out => ({
//       label: out.key,
//       value: out.key,
//       type: out.dataType?.toUpperCase() || "",
//       kind: "output",
//       raw: out,
//       description: out.description,
//       isBackend: true,
//     }))
// }

// function extractTelemetryInputs(profile) {
//   let inputs = []
//   if (Array.isArray(profile?.inputs)) {
//     inputs = profile.inputs
//   } else if (Array.isArray(profile?.metadata?.inputs)) {
//     inputs = profile.metadata.inputs
//   }
//   return (inputs || []).map(input => ({
//     label: (input.description || (input.key?.charAt(0).toUpperCase() + input.key?.slice(1))) + " (Control)",
//     value: input.key,
//     type: input.dataType?.toLowerCase() === "float" || input.dataType?.toLowerCase() === "int" ? "timeseries" : "attribute",
//     kind: "input",
//     raw: input,
//   }))
// }

// // All nodes are selectable (object or primitive)
// function buildTreeFromSample(obj, prefix = "") {
//   if (!obj || typeof obj !== "object") return []
//   return Object.keys(obj).map(key => {
//     const path = prefix ? `${prefix}.${key}` : key
//     const value = obj[key]
//     const isObject = typeof value === "object" && value !== null && !Array.isArray(value)
//     return {
//       title: key,
//       value: path,
//       key: path,
//       selectable: true,
//       children: isObject ? buildTreeFromSample(value, path) : undefined,
//     }
//   })
// }

// function buildBackendTree(outputs) {
//   if (!Array.isArray(outputs)) return []
//   return outputs
//     .filter(out => out.key)
//     .map(out => ({
//       title: out.key,
//       value: out.key,
//       key: out.key,
//       selectable: true,
//       description: out.description,
//       isBackend: true,
//     }))
// }

// function mergeTreeData(backendTree, discoveredTree) {
//   const backendRootKeys = new Set(backendTree.map(n => n.key))
//   return [
//     ...backendTree,
//     ...discoveredTree.filter(n => !backendRootKeys.has(n.key)),
//   ]
// }

// function renderSettingsField(field, settingsForm) {
//   const val = settingsForm.getFieldValue(field.name)
//   if (field.type === "list" && (!field.default || typeof field.default[0] !== "object")) {
//     return (
//       <Select
//         mode="tags"
//         tokenSeparators={[","]}
//         style={{ width: "100%" }}
//         placeholder={`Enter multiple values (comma or enter)`}
//         value={Array.isArray(val) ? val : field.default}
//       />
//     )
//   }
//   if (field.type === "list" && field.default && typeof field.default[0] === "object") {
//     return (
//       <Select
//         mode="tags"
//         style={{ width: "100%" }}
//         placeholder="Enter as JSON, or use default"
//         value={
//           Array.isArray(val)
//             ? val.map(item =>
//               typeof item === "object" && item !== null
//                 ? JSON.stringify(item)
//                 : item
//             )
//             : field.default.map(item => JSON.stringify(item))
//         }
//         onChange={arr => {
//           const objs = arr.map(str => {
//             try {
//               return JSON.parse(str)
//             } catch {
//               return str
//             }
//           })
//           settingsForm.setFieldsValue({ [field.name]: objs })
//         }}
//       >
//         {field.default.map(item => (
//           <Select.Option key={JSON.stringify(item)} value={JSON.stringify(item)}>
//             {item.label || JSON.stringify(item)}
//           </Select.Option>
//         ))}
//       </Select>
//     )
//   }
//   if (field.type === "select" && Array.isArray(field.options)) {
//     return (
//       <Select>
//         {field.options.map(opt =>
//           <Option key={opt} value={opt}>{opt}</Option>
//         )}
//       </Select>
//     )
//   }
//   switch (field.type) {
//     case "input": return <Input />
//     case "password": return <Input.Password />
//     case "number": return <InputNumber min={field.min} max={field.max} style={{ width: "100%" }} />
//     case "switch": return <AntdSwitch />
//     case "slider": return <Slider min={field.min ?? 0} max={field.max ?? 100} />
//     default: return <Input />
//   }
// }

// // Get value from object by dot-path (e.g., "a.b.c")
// function getValueByPath(obj, path) {
//   if (!obj || !path) return undefined
//   return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj)
// }

// const WidgetConfigModal = ({
//   visible, onCancel, onSave, widget, tenantId: propTenantId,
// }) => {
//   const tenantId = propTenantId || localStorage.getItem("tenantId")
//   const [form] = Form.useForm()
//   const [settingsForm] = Form.useForm()
//   const [activeTab, setActiveTab] = useState("general")
//   const [selectedDataSource, setSelectedDataSource] = useState(widget?.config?.dataSource?.type || "device")
//   const [selectedDeviceId, setSelectedDeviceId] = useState(widget?.config?.dataSource?.deviceId || null)
//   const [availableTelemetry, setAvailableTelemetry] = useState([])
//   const [selectedTelemetry, setSelectedTelemetry] = useState(widget?.config?.dataSource?.telemetry || [])
//   const [primaryTelemetryKey, setPrimaryTelemetryKey] = useState(
//     widget?.config?.dataSource?.displayKey ||
//     (widget?.config?.dataSource?.telemetry?.length ? widget.config.dataSource.telemetry[0] : undefined)
//   )
//   const [availableTelemetryOut, setAvailableTelemetryOut] = useState([])
//   const [selectedTelemetryOut, setSelectedTelemetryOut] = useState(widget?.config?.dataSource?.telemetryOut || [])
//   const [deviceList, setDeviceList] = useState([])
//   const [loadingDevices, setLoadingDevices] = useState(false)
//   const [loadingProfile, setLoadingProfile] = useState(false)
//   const [mqttTopic, setMqttTopic] = useState("")
//   const [protocol, setProtocol] = useState(widget?.config?.dataSource?.protocol || "MQTT")
//   const [streamUrl, setStreamUrl] = useState(widget?.config?.dataSource?.streamUrl || "")
//   const [lastSampleData, setLastSampleData] = useState({})
//   const [selectionMode, setSelectionMode] = useState("telemetry")
//   const [selectedObjectPath, setSelectedObjectPath] = useState("")
//   const [selectedObjectValue, setSelectedObjectValue] = useState(undefined)
//   const isMobile = useMediaQuery("(max-width: 768px)")
//   const widgetType = widget?.type
//   const settingsSchema = widgetSchemas?.[widgetType] || []
//   const isControlWidget = CONTROL_WIDGET_TYPES.includes(widgetType)

//   // MQTT sample preview & log for discovering fields
//   const [lastMqttData, mqttLog] = useMqttPreview(mqttTopic, visible, useCallback((data) => {
//     if (typeof data === "object" && data !== null) {
//       setLastSampleData(data)
//     }
//   }, []))

//   const handleDataSourceChange = (value) => {
//     setSelectedDataSource(value)
//     form.setFieldsValue({ deviceId: null, telemetry: [], telemetryOut: [], displayKey: undefined })
//     setSelectedDeviceId(null)
//     setSelectedTelemetry([])
//     setPrimaryTelemetryKey(undefined)
//     setSelectedTelemetryOut([])
//     setAvailableTelemetry([])
//     setAvailableTelemetryOut([])
//     setLastSampleData({})
//     setProtocol("MQTT")
//     setStreamUrl("")
//     setSelectedObjectPath("")
//     setSelectedObjectValue(undefined)
//   }
//   const handleDeviceChange = (value) => {
//     setSelectedDeviceId(value)
//     form.setFieldsValue({ telemetry: [], telemetryOut: [], displayKey: undefined })
//     setSelectedTelemetry([])
//     setPrimaryTelemetryKey(undefined)
//     setSelectedTelemetryOut([])
//     setAvailableTelemetry([])
//     setAvailableTelemetryOut([])
//     setLastSampleData({})
//     setSelectedObjectPath("")
//     setSelectedObjectValue(undefined)
//   }

//   // Reset modal state
//   useEffect(() => {
//     if (visible && widget) {
//       const telemetryKeys = widget?.config?.dataSource?.telemetry || []
//       form.setFieldsValue({
//         title: widget.title || "",
//         dataSource: widget.config?.dataSource?.type || "device",
//         deviceId: widget.config?.dataSource?.deviceId || null,
//         telemetry: telemetryKeys,
//         telemetryOut: widget.config?.dataSource?.telemetryOut || [],
//         displayKey: widget.config?.dataSource?.displayKey || (telemetryKeys.length > 0 ? telemetryKeys[0] : undefined),
//         ...widget.config,
//       })
//       settingsForm.setFieldsValue({ ...(widget.config || {}) })
//       setActiveTab("general")
//       setSelectedDataSource(widget.config?.dataSource?.type || "device")
//       setSelectedDeviceId(widget.config?.dataSource?.deviceId || null)
//       setSelectedTelemetry(telemetryKeys)
//       setPrimaryTelemetryKey(widget.config?.dataSource?.displayKey || (telemetryKeys.length > 0 ? telemetryKeys[0] : undefined))
//       setSelectedTelemetryOut(widget?.config?.dataSource?.telemetryOut || [])
//       setAvailableTelemetry([])
//       setAvailableTelemetryOut([])
//       setLastSampleData({})
//       setProtocol(widget?.config?.dataSource?.protocol || "MQTT")
//       setStreamUrl(widget?.config?.dataSource?.streamUrl || "")
//       setSelectionMode("telemetry")
//       setSelectedObjectPath("")
//       setSelectedObjectValue(undefined)
//     }
//   }, [visible, widget, form, settingsForm])

//   // Persist Full Object selection when new data arrives
//   useEffect(() => {
//     if (!selectedObjectPath) return
//     // Try to resolve and persist selection
//     const value = getValueByPath(lastSampleData, selectedObjectPath)
//     if (value !== undefined) {
//       setSelectedObjectValue(value)
//     } else {
//       setSelectedObjectPath("")
//       setSelectedObjectValue(undefined)
//     }
//     // eslint-disable-next-line
//   }, [lastSampleData])

//   useEffect(() => {
//     setSelectedObjectPath("")
//     setSelectedObjectValue(undefined)
//   }, [selectionMode, visible])

//   // Fetch devices for dropdown
//   useEffect(() => {
//     if (visible && selectedDataSource === "device" && tenantId) {
//       setLoadingDevices(true)
//       listDevices({ tenantId, page: 0, size: 100 })
//         .then((data) => {
//           const mapped = (data.content || []).map(d => ({
//             ...d,
//             id: d.deviceId,
//             name: d.deviceName,
//             profile: d.profile,
//           }))
//           setDeviceList(mapped)
//         })
//         .catch((e) => {
//           setDeviceList([])
//           message.error(e.message || "Failed to load devices")
//         })
//         .finally(() => setLoadingDevices(false))
//     } else if (selectedDataSource !== "device") {
//       setDeviceList([])
//       setSelectedDeviceId(null)
//       setAvailableTelemetry([])
//       setAvailableTelemetryOut([])
//       setProtocol("MQTT")
//       setStreamUrl("")
//     }
//   }, [selectedDataSource, visible, tenantId])

//   // Fetch device profile for outputs/inputs/metadata for telemetry and protocol/url
//   useEffect(() => {
//     if (visible && selectedDeviceId) {
//       setLoadingProfile(true)
//       getDeviceById(selectedDeviceId, { withProfile: true })
//         .then((data) => {
//           const profile =
//             data.profile ||
//             data.device?.profile ||
//             data.device?.deviceProfile || {}

//           const outputs = extractStreamOutputs(profile)
//           setAvailableTelemetry(outputs)
//           if (CONTROL_WIDGET_TYPES.includes(widgetType)) {
//             setAvailableTelemetryOut(extractTelemetryInputs(profile))
//           }
//           let meta = profile?.metadata || {}
//           const metaTopic = meta.mqtt_topic
//           setMqttTopic(
//             metaTopic && selectedDeviceId
//               ? `${metaTopic}/${selectedDeviceId}/up/data`
//               : ""
//           )
//           let streamInfo = outputs[0]
//           let detectedProtocol = streamInfo?.type || (profile?.protocol || "MQTT").toUpperCase()
//           let detectedStreamUrl = streamInfo?.value || ""
//           setProtocol(detectedProtocol)
//           setStreamUrl(detectedStreamUrl)
//         })
//         .catch((e) => {
//           setAvailableTelemetry([])
//           setAvailableTelemetryOut([])
//           setMqttTopic("")
//           setProtocol("MQTT")
//           setStreamUrl("")
//           message.error(e.message || "Failed to fetch device telemetry info")
//         })
//         .finally(() => setLoadingProfile(false))
//     } else {
//       setAvailableTelemetry([])
//       setAvailableTelemetryOut([])
//       setMqttTopic("")
//       setProtocol("MQTT")
//       setStreamUrl("")
//     }
//   }, [selectedDeviceId, visible, widgetType])

//   // --- Build merged telemetry tree for TreeSelect ---
//   let outputs = []
//   if (selectedDeviceId) {
//     const deviceProfile = deviceList.find(d => d.id === selectedDeviceId)?.profile
//     outputs = (deviceProfile?.outputs) ? deviceProfile.outputs : []
//   }
//   const backendTree = buildBackendTree(outputs)
//   const discoveredTree = lastSampleData && Object.keys(lastSampleData).length > 0
//     ? buildTreeFromSample(lastSampleData, "")
//     : []
//   const telemetryTreeData = mergeTreeData(backendTree, discoveredTree)
//   const safeTreeData = telemetryTreeData.length
//     ? telemetryTreeData
//     : [{ title: "(No telemetry keys yet)", value: "none", key: "none", disabled: true }]

//   const handleSave = async () => {
//     try {
//       const values = await form.validateFields()
//       const settingsValues = await settingsForm.validateFields().catch(() => ({}))
//       // console.log("====================>",settingsValues)
//       let fans = widget.config?.fans
//       if (widgetType === "fan-control") {
//         const {
//           numFans = 2,
//           speedUnit = "%",
//           tempUnit = "°C",
//           maintenanceHours = 8760,
//           runtime = 0,
//         } = settingsValues
//         fans = Array.from({ length: numFans }, (_, idx) => ({
//           id: `FAN${idx + 1}`,
//           name: `Fan ${idx + 1}`,
//           speedUnit,
//           tempUnit,
//           maintenanceHours,
//           runtime,
//         }))
//       }
//       let dataSourceConfig = {
//         ...widget.config?.dataSource,
//         type: values.dataSource,
//         deviceId: values.deviceId,
//         topic: mqttTopic,
//         protocol,
//         streamUrl,
//       }
//       if (selectionMode === "telemetry") {
//         dataSourceConfig.telemetry = values.telemetry || []
//         dataSourceConfig.displayKey = values.displayKey || (values.telemetry?.[0])
//         dataSourceConfig.isJsonObject = false
//         delete dataSourceConfig.jsonObjectPath
//         delete dataSourceConfig.jsonObjectValue
//       } else if (selectionMode === "object") {
//         dataSourceConfig.isJsonObject = true
//         dataSourceConfig.jsonObjectPath = selectedObjectPath
//         dataSourceConfig.jsonObjectValue = selectedObjectValue
//         delete dataSourceConfig.telemetry
//         delete dataSourceConfig.displayKey
//       }
//       if (CONTROL_WIDGET_TYPES.includes(widgetType)) {
//         dataSourceConfig.telemetryOut = values.telemetryOut
//       }
//       const updatedWidget = {
//         ...widget,
//         title: values.title,
//         config: {
//           ...widget.config,
//           ...settingsValues,
//           fans,
//           title: values.title,
//           dataSource: dataSourceConfig,
//         },
//       }
//       if (values.dataSource === "device" && values.deviceId) {
//         const selectedDevice = deviceList.find((d) => d.id === values.deviceId)
//         updatedWidget.deviceId = values.deviceId
//         updatedWidget.deviceName = selectedDevice?.name || "Unknown Device"
//       }
//       onSave(updatedWidget)
//     } catch (e) {
//       console.warn("[WidgetConfigModal] Save error:", e)
//     }
//   }

//   useEffect(() => {
//     if (selectedTelemetry.length > 0) {
//       setPrimaryTelemetryKey(selectedTelemetry.includes(primaryTelemetryKey) ? primaryTelemetryKey : selectedTelemetry[0])
//       form.setFieldsValue({ displayKey: selectedTelemetry.includes(primaryTelemetryKey) ? primaryTelemetryKey : selectedTelemetry[0] })
//     } else {
//       setPrimaryTelemetryKey(undefined)
//       form.setFieldsValue({ displayKey: undefined })
//     }
//   }, [selectedTelemetry])
  
//   function collectLeafDotPaths(treeData, selectedKeys) {
//     const keySet = new Set(selectedKeys)
//     const leaves = []

//     function traverse(nodes, parentSelected) {
//       if (!Array.isArray(nodes)) return
//       for (const node of nodes) {
//         const isLeaf = !node.children || node.children.length === 0
//         const isSelected = keySet.has(node.key)
//         if (isLeaf && (isSelected || parentSelected)) {
//           leaves.push(node.key)
//         } else if (node.children && node.children.length) {
//           traverse(node.children, isSelected || parentSelected)
//         }
//       }
//     }

//     traverse(treeData, false)
//     return Array.from(new Set(leaves))
//   }
//   return (
//     <Modal
//       title={`Configure Widget: ${widget?.title || ""}`}
//       open={visible}
//       onCancel={onCancel}
//       width={isMobile ? "100%" : 800}
//       className="widget-config-modal"
//       footer={[
//         <Button key="cancel" onClick={onCancel}>Cancel</Button>,
//         <Button key="save" type="primary" onClick={handleSave}>Save</Button>,
//       ]}
//     >
//       <Form form={form} layout="vertical">
//         <Tabs activeKey={activeTab} onChange={setActiveTab}>
//           <TabPane tab="General" key="general">
//             <Form.Item
//               name="title"
//               label="Widget Title"
//               rules={[{ required: true, message: "Please enter a title" }]}
//             >
//               <Input />
//             </Form.Item>
//             <Divider orientation="left">Data Source</Divider>
//             <Form.Item name="dataSource" label="Data Source Type">
//               <Select onChange={handleDataSourceChange} value={selectedDataSource}>
//                 <Option value="device">Device</Option>
//                 <Option value="asset">Asset</Option>
//                 <Option value="entity">Entity</Option>
//                 <Option value="static">Static Data</Option>
//               </Select>
//             </Form.Item>
//             {selectedDataSource === "device" && (
//               <>
//                 <Form.Item
//                   name="deviceId"
//                   label="Device"
//                   rules={[{ required: true, message: "Please select a device" }]}
//                 >
//                   <Select
//                     onChange={handleDeviceChange}
//                     placeholder={loadingDevices ? "Loading devices..." : "Select device"}
//                     loading={loadingDevices}
//                     showSearch
//                     filterOption={(input, option) =>
//                       option.children && option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
//                     }
//                     value={selectedDeviceId}
//                     notFoundContent={loadingDevices ? <Spin size="small" /> : "No devices found"}
//                   >
//                     {(deviceList || []).map((device) => (
//                       <Option key={device.id} value={device.id}>
//                         {device.name}
//                       </Option>
//                     ))}
//                   </Select>
//                 </Form.Item>
//                 {/* Show protocol/URL info */}
//                 {selectedDeviceId && (
//                   <Alert
//                     message={`Detected Protocol: ${protocol}${streamUrl ? ` (${streamUrl})` : ""}`}
//                     type={protocol && protocol !== "MQTT" ? "success" : "info"}
//                     showIcon
//                     style={{ marginBottom: 8 }}
//                   />
//                 )}
//                 {selectedDeviceId && !mqttTopic && protocol === "MQTT" && (
//                   <Alert
//                     message="No MQTT topic found for this device. Please check device profile metadata."
//                     type="warning"
//                     showIcon
//                   />
//                 )}
//                 {/* --- Selection Mode Switch --- */}
//                 <div style={{ marginBottom: 8 }}>
//                   <Segmented
//                     options={[
//                       { label: "Telemetry", value: "telemetry" },
//                       { label: "Full Object", value: "object" },
//                     ]}
//                     value={selectionMode}
//                     onChange={setSelectionMode}
//                     block
//                   />
//                 </div>
//                 {/* --- Telemetry OR Full Object --- */}
//                 {selectionMode === "telemetry" ? (
//                   <Form.Item
//                     name="telemetry"
//                     label="Streams / Telemetry (Live Value)"
//                     rules={[{ required: true, message: "Please select at least one telemetry/output" }]}
//                   >
//                     <TreeSelect
//                       treeData={safeTreeData}
//                       value={selectedTelemetry}
//                       onChange={v => {
//                         const leaves = collectLeafDotPaths(safeTreeData, v)
//                         setSelectedTelemetry(leaves)
//                         form.setFieldsValue({ telemetry: leaves })
//                       }}
//                       treeCheckable
//                       showCheckedStrategy={TreeSelect.SHOW_PARENT}
//                       multiple
//                       style={{ width: "100%" }}
//                       placeholder="Select telemetry/output (including child/nested fields)"
//                       allowClear
//                       treeDefaultExpandAll
//                       dropdownStyle={{ maxHeight: 300, overflow: "auto" }}
//                     />
//                   </Form.Item>
//                 ) : (
//                   <Form.Item label="Select JSON Node">
//                     <TreeSelect
//                       treeData={safeTreeData}
//                       value={selectedObjectPath}
//                       onChange={path => {
//                         setSelectedObjectPath(path)
//                         setSelectedObjectValue(getValueByPath(lastSampleData, path))
//                       }}
//                       multiple={false}
//                       showSearch
//                       treeDefaultExpandAll
//                       allowClear
//                       style={{ width: "100%" }}
//                       placeholder="Select any node from latest JSON object"
//                       dropdownStyle={{ maxHeight: 300, overflow: "auto" }}
//                     />
//                     {selectedObjectPath && (
//                       <Alert
//                         message={<span>
//                           Selected Node: <b>{selectedObjectPath}</b>
//                         </span>}
//                         description={
//                           <pre style={{ fontSize: 12, margin: 0, background: "#fafafa" }}>
//                             {JSON.stringify(selectedObjectValue, null, 2)}
//                           </pre>
//                         }
//                         type="info"
//                         showIcon
//                         style={{ marginTop: 8 }}
//                       />
//                     )}
//                   </Form.Item>
//                 )}
//                 {/* DisplayKey select */}
//                 {selectionMode === "telemetry" && selectedTelemetry.length > 0 && (
//                   <Form.Item
//                     name="displayKey"
//                     label="Primary Telemetry Key"
//                     rules={[{ required: true, message: "Please select a primary key to display" }]}
//                     initialValue={primaryTelemetryKey || selectedTelemetry[0]}
//                   >
//                     <Select
//                       value={form.getFieldValue("displayKey") || selectedTelemetry[0]}
//                       onChange={value => { setPrimaryTelemetryKey(value); form.setFieldsValue({ displayKey: value }) }}
//                       style={{ width: "100%" }}
//                     >
//                       {selectedTelemetry.map(key => (
//                         <Option key={key} value={key}>{key}</Option>
//                       ))}
//                     </Select>
//                   </Form.Item>
//                 )}
//                 {/* Only for control widgets: telemetryOut select (from inputs) */}
//                 {selectedDeviceId && isControlWidget && !!availableTelemetryOut.length && (
//                   <Form.Item
//                     name="telemetryOut"
//                     label="Telemetry Out (for control/command)"
//                     rules={[{ required: true, message: "Please select at least one telemetry output (input field)" }]}
//                     initialValue={selectedTelemetryOut}
//                   >
//                     <Select
//                       mode="multiple"
//                       value={selectedTelemetryOut}
//                       onChange={setSelectedTelemetryOut}
//                       placeholder={loadingProfile ? "Loading inputs..." : "Select input(s) for control"}
//                       optionLabelProp="label"
//                       notFoundContent={loadingProfile ? <Spin size="small" /> : "No inputs"}
//                     >
//                       {(availableTelemetryOut || []).map((key) =>
//                         key.disabled ? (
//                           <Option key={key.value} value={key.value} disabled>
//                             <span style={{ fontWeight: "bold", color: "#aaa" }}>{key.label}</span>
//                           </Option>
//                         ) : (
//                           <Option key={key.value} value={key.value} label={key.label}>
//                             <div style={{ display: "flex", justifyContent: "space-between" }}>
//                               <span>{key.label}</span>
//                               <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>{key.type}</span>
//                             </div>
//                           </Option>
//                         )
//                       )}
//                     </Select>
//                   </Form.Item>
//                 )}
//                 {/* MQTT preview and logs */}
//                 {selectedDeviceId && lastMqttData && (
//                   <Alert
//                     message="Last MQTT Data (debug)"
//                     description={<pre style={{ fontSize: 12, margin: 0 }}>{JSON.stringify(lastMqttData, null, 2)}</pre>}
//                     type="info"
//                     showIcon
//                   />
//                 )}
//                 {selectedDeviceId && (
//                   <Button
//                     size="small"
//                     onClick={() => { /* If you want to clear log, manage in useMqttPreview */ }}
//                     style={{ marginTop: 8, marginBottom: 8 }}
//                   >
//                     Clear MQTT Logs
//                   </Button>
//                 )}
//                 {selectedDeviceId && mqttLog.length > 0 && (
//                   <div style={{ maxHeight: 80, overflow: "auto", background: "#fafafa", fontSize: 12, marginBottom: 8, border: "1px solid #eee" }}>
//                     {mqttLog.map((line, i) => <div key={i}>{line}</div>)}
//                   </div>
//                 )}
//               </>
//             )}
//             {selectedDataSource === "static" && (
//               <Form.Item name="staticData" label="Static Data">
//                 <Input.TextArea rows={4} placeholder="Enter JSON data" />
//               </Form.Item>
//             )}
//           </TabPane>
//           <TabPane tab="Settings" key="settings">
//             <Form form={settingsForm} layout="vertical">
//               {settingsSchema.length === 0 ? (
//                 <div style={{ color: "#999" }}>No extra settings for this widget.</div>
//               ) : (
//                 settingsSchema.map(field => {
//                   const formValues = settingsForm.getFieldsValue()
//                   if (field.showIf && !field.showIf(formValues)) return null
//                   return (
//                     <Form.Item
//                       key={field.name}
//                       name={field.name}
//                       label={field.label}
//                       tooltip={field.description || field.tooltip}
//                       rules={field.required ? [{ required: true, message: `Required: ${field.label}` }] : undefined}
//                       initialValue={widget.config?.[field.name] ?? field.default}
//                       valuePropName={field.type === "switch" ? "checked" : "value"}
//                     >
//                       {renderSettingsField(field, settingsForm)}
//                     </Form.Item>
//                   )
//                 })
//               )}
//             </Form>
//           </TabPane>
//           <TabPane tab="Advanced" key="advanced">
//             <Form.Item name="refreshInterval" label="Refresh Interval (seconds)">
//               <InputNumber min={1} max={3600} />
//             </Form.Item>
//             <Form.Item name="backgroundColor" label="Background Color">
//               <Input type="color" />
//             </Form.Item>
//             <Form.Item name="titleColor" label="Title Color">
//               <Input type="color" />
//             </Form.Item>
//             <Form.Item name="showTitle" label="Show Title" valuePropName="checked">
//               <AntdSwitch />
//             </Form.Item>
//             <Form.Item name="dropShadow" label="Drop Shadow" valuePropName="checked">
//               <AntdSwitch />
//             </Form.Item>
//             <Form.Item name="borderRadius" label="Border Radius (px)">
//               <InputNumber min={0} max={24} />
//             </Form.Item>
//           </TabPane>
//         </Tabs>
//       </Form>
//     </Modal>
//   )
// }

// export default WidgetConfigModal




// // "use client"
// // import { Slider, TreeSelect } from "antd"
// // import { useState, useEffect, useCallback } from "react"
// // import {
// //   Modal, Form, Input, Select, Tabs, Button, Divider, Switch, InputNumber, message, Spin, Alert,
// // } from "antd"
// // import { useMediaQuery } from "../../hooks/useMediaQuery"
// // import { listDevices, getDeviceById } from "../../api/deviceApi"
// // import { useMqttPreview } from "../../hooks/useMqttPreview"
// // import { widgetSchemas } from "./widgets/widgetSchemas"
// // import "../../styles/widget-modal.css"

// // const { TabPane } = Tabs
// // const { Option } = Select

// // const CONTROL_WIDGET_TYPES = ["slider-control", "fan-control", "switch-control"]

// // function extractStreamOutputs(profile) {
// //   if (!profile?.outputs || !Array.isArray(profile.outputs)) return []
// //   return profile.outputs
// //     .filter(o => o.key)
// //     .map(out => ({
// //       label: out.key,
// //       value: out.key,
// //       type: out.dataType?.toUpperCase() || "",
// //       kind: "output",
// //       raw: out,
// //       description: out.description,
// //       isBackend: true,
// //     }))
// // }

// // function extractTelemetryInputs(profile) {
// //   let inputs = []
// //   if (Array.isArray(profile?.inputs)) {
// //     inputs = profile.inputs
// //   } else if (Array.isArray(profile?.metadata?.inputs)) {
// //     inputs = profile.metadata.inputs
// //   }
// //   return (inputs || []).map(input => ({
// //     label: (input.description || (input.key?.charAt(0).toUpperCase() + input.key?.slice(1))) + " (Control)",
// //     value: input.key,
// //     type: input.dataType?.toLowerCase() === "float" || input.dataType?.toLowerCase() === "int" ? "timeseries" : "attribute",
// //     kind: "input",
// //     raw: input,
// //   }))
// // }

// // // Build a tree from a sample JSON (for MQTT preview/discovery)
// // function buildTreeFromSample(obj, prefix = "") {
// //   if (!obj || typeof obj !== "object") return []
// //   return Object.keys(obj).map(key => {
// //     const path = prefix ? `${prefix}.${key}` : key
// //     if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
// //       // Recursive for children
// //       const children = buildTreeFromSample(obj[key], path)
// //       return {
// //         title: key,
// //         value: path,
// //         key: path,
// //         selectable: false,  // parent not selectable by default
// //         children,
// //       }
// //     }
// //     // Only select leaf nodes (primitive fields)
// //     return {
// //       title: key,
// //       value: path,
// //       key: path,
// //       selectable: true,
// //     }
// //   })
// // }

// // // Build backend output tree (flat)
// // function buildBackendTree(outputs) {
// //   if (!Array.isArray(outputs)) return []
// //   return outputs
// //     .filter(o => o.key)
// //     .map(o => ({
// //       title: o.key,
// //       value: o.key,
// //       key: o.key,
// //       selectable: true,
// //       description: o.description,
// //       isBackend: true,
// //     }))
// // }

// // // Utility to merge backend outputs and sample/discovered JSON for TreeSelect
// // function mergeTreeData(backendTree, discoveredTree) {
// //   // Avoid duplicate root keys
// //   const backendRootKeys = new Set(backendTree.map(n => n.key))
// //   // If discoveredTree has root-level keys that are already in backendTree, skip those
// //   return [
// //     ...backendTree,
// //     ...discoveredTree.filter(n => !backendRootKeys.has(n.key)),
// //   ]
// // }

// // function renderSettingsField(field, settingsForm) {
// //   const val = settingsForm.getFieldValue(field.name)
// //   if (field.type === "list" && (!field.default || typeof field.default[0] !== "object")) {
// //     return (
// //       <Select
// //         mode="tags"
// //         tokenSeparators={[","]}
// //         style={{ width: "100%" }}
// //         placeholder={`Enter multiple values (comma or enter)`}
// //         value={Array.isArray(val) ? val : field.default}
// //       />
// //     )
// //   }
// //   if (field.type === "list" && field.default && typeof field.default[0] === "object") {
// //     return (
// //       <Select
// //         mode="tags"
// //         style={{ width: "100%" }}
// //         placeholder="Enter as JSON, or use default"
// //         value={
// //           Array.isArray(val)
// //             ? val.map(item =>
// //                 typeof item === "object" && item !== null
// //                   ? JSON.stringify(item)
// //                   : item
// //               )
// //             : field.default.map(item => JSON.stringify(item))
// //         }
// //         onChange={arr => {
// //           const objs = arr.map(str => {
// //             try {
// //               return JSON.parse(str)
// //             } catch {
// //               return str
// //             }
// //           })
// //           settingsForm.setFieldsValue({ [field.name]: objs })
// //         }}
// //       >
// //         {field.default.map(item => (
// //           <Select.Option key={JSON.stringify(item)} value={JSON.stringify(item)}>
// //             {item.label || JSON.stringify(item)}
// //           </Select.Option>
// //         ))}
// //       </Select>
// //     )
// //   }
// //   if (field.type === "select" && Array.isArray(field.options)) {
// //     return (
// //       <Select>
// //         {field.options.map(opt =>
// //           <Option key={opt} value={opt}>{opt}</Option>
// //         )}
// //       </Select>
// //     )
// //   }
// //   switch (field.type) {
// //     case "input": return <Input />
// //     case "password": return <Input.Password />
// //     case "number": return <InputNumber min={field.min} max={field.max} style={{ width: "100%" }} />
// //     case "switch": return <Switch />
// //     case "slider": return <Slider min={field.min ?? 0} max={field.max ?? 100} />
// //     default: return <Input />
// //   }
// // }

// // const WidgetConfigModal = ({
// //   visible, onCancel, onSave, widget, tenantId: propTenantId,
// // }) => {
// //   const tenantId = propTenantId || localStorage.getItem("tenantId")
// //   const [form] = Form.useForm()
// //   const [settingsForm] = Form.useForm()
// //   const [activeTab, setActiveTab] = useState("general")
// //   const [selectedDataSource, setSelectedDataSource] = useState(widget?.config?.dataSource?.type || "device")
// //   const [selectedDeviceId, setSelectedDeviceId] = useState(widget?.config?.dataSource?.deviceId || null)
// //   const [availableTelemetry, setAvailableTelemetry] = useState([])
// //   const [selectedTelemetry, setSelectedTelemetry] = useState(widget?.config?.dataSource?.telemetry || [])
// //   const [primaryTelemetryKey, setPrimaryTelemetryKey] = useState(
// //     widget?.config?.dataSource?.displayKey ||
// //     (widget?.config?.dataSource?.telemetry?.length ? widget.config.dataSource.telemetry[0] : undefined)
// //   )
// //   const [availableTelemetryOut, setAvailableTelemetryOut] = useState([])
// //   const [selectedTelemetryOut, setSelectedTelemetryOut] = useState(widget?.config?.dataSource?.telemetryOut || [])
// //   const [deviceList, setDeviceList] = useState([])
// //   const [loadingDevices, setLoadingDevices] = useState(false)
// //   const [loadingProfile, setLoadingProfile] = useState(false)
// //   const [mqttTopic, setMqttTopic] = useState("")
// //   const [protocol, setProtocol] = useState(widget?.config?.dataSource?.protocol || "MQTT")
// //   const [streamUrl, setStreamUrl] = useState(widget?.config?.dataSource?.streamUrl || "")
// //   const [lastSampleData, setLastSampleData] = useState({})
// //   const isMobile = useMediaQuery("(max-width: 768px)")
// //   const widgetType = widget?.type
// //   const settingsSchema = widgetSchemas?.[widgetType] || []
// //   const isControlWidget = CONTROL_WIDGET_TYPES.includes(widgetType)

// //   // MQTT sample preview & log for discovering fields
// //   const [lastMqttData, mqttLog] = useMqttPreview(mqttTopic, visible, useCallback((data) => {
// //     if (typeof data === "object" && data !== null) {
// //       setLastSampleData(data)
// //     }
// //   }, []))

// //   // --- handler functions ---
// //   const handleDataSourceChange = (value) => {
// //     setSelectedDataSource(value)
// //     form.setFieldsValue({ deviceId: null, telemetry: [], telemetryOut: [], displayKey: undefined })
// //     setSelectedDeviceId(null)
// //     setSelectedTelemetry([])
// //     setPrimaryTelemetryKey(undefined)
// //     setSelectedTelemetryOut([])
// //     setAvailableTelemetry([])
// //     setAvailableTelemetryOut([])
// //     setLastSampleData({})
// //     setProtocol("MQTT")
// //     setStreamUrl("")
// //   }
// //   const handleDeviceChange = (value) => {
// //     setSelectedDeviceId(value)
// //     form.setFieldsValue({ telemetry: [], telemetryOut: [], displayKey: undefined })
// //     setSelectedTelemetry([])
// //     setPrimaryTelemetryKey(undefined)
// //     setSelectedTelemetryOut([])
// //     setAvailableTelemetry([])
// //     setAvailableTelemetryOut([])
// //     setLastSampleData({})
// //   }

// //   // Reset modal state
// //   useEffect(() => {
// //     if (visible && widget) {
// //       const telemetryKeys = widget?.config?.dataSource?.telemetry || []
// //       form.setFieldsValue({
// //         title: widget.title || "",
// //         dataSource: widget.config?.dataSource?.type || "device",
// //         deviceId: widget.config?.dataSource?.deviceId || null,
// //         telemetry: telemetryKeys,
// //         telemetryOut: widget.config?.dataSource?.telemetryOut || [],
// //         displayKey: widget.config?.dataSource?.displayKey || (telemetryKeys.length > 0 ? telemetryKeys[0] : undefined),
// //         ...widget.config,
// //       })
// //       settingsForm.setFieldsValue({ ...(widget.config || {}) })
// //       setActiveTab("general")
// //       setSelectedDataSource(widget.config?.dataSource?.type || "device")
// //       setSelectedDeviceId(widget.config?.dataSource?.deviceId || null)
// //       setSelectedTelemetry(telemetryKeys)
// //       setPrimaryTelemetryKey(widget.config?.dataSource?.displayKey || (telemetryKeys.length > 0 ? telemetryKeys[0] : undefined))
// //       setSelectedTelemetryOut(widget?.config?.dataSource?.telemetryOut || [])
// //       setAvailableTelemetry([])
// //       setAvailableTelemetryOut([])
// //       setLastSampleData({})
// //       setProtocol(widget?.config?.dataSource?.protocol || "MQTT")
// //       setStreamUrl(widget?.config?.dataSource?.streamUrl || "")
// //     }
// //   }, [visible, widget, form, settingsForm])

// //   // Fetch devices for dropdown
// //   useEffect(() => {
// //     if (visible && selectedDataSource === "device" && tenantId) {
// //       setLoadingDevices(true)
// //       listDevices({ tenantId, page: 0, size: 100 })
// //         .then((data) => {
// //           const mapped = (data.content || []).map(d => ({
// //             ...d,
// //             id: d.deviceId,
// //             name: d.deviceName,
// //             profile: d.profile,
// //           }))
// //           setDeviceList(mapped)
// //         })
// //         .catch((e) => {
// //           setDeviceList([])
// //           message.error(e.message || "Failed to load devices")
// //         })
// //         .finally(() => setLoadingDevices(false))
// //     } else if (selectedDataSource !== "device") {
// //       setDeviceList([])
// //       setSelectedDeviceId(null)
// //       setAvailableTelemetry([])
// //       setAvailableTelemetryOut([])
// //       setProtocol("MQTT")
// //       setStreamUrl("")
// //     }
// //   }, [selectedDataSource, visible, tenantId])

// //   // Fetch device profile for outputs/inputs/metadata for telemetry and protocol/url
// //   useEffect(() => {
// //     if (visible && selectedDeviceId) {
// //       setLoadingProfile(true)
// //       getDeviceById(selectedDeviceId, { withProfile: true })
// //         .then((data) => {
// //           const profile =
// //             data.profile ||
// //             data.device?.profile ||
// //             data.device?.deviceProfile || {}

// //           const outputs = extractStreamOutputs(profile)
// //           setAvailableTelemetry(outputs)
// //           if (CONTROL_WIDGET_TYPES.includes(widgetType)) {
// //             setAvailableTelemetryOut(extractTelemetryInputs(profile))
// //           }
// //           let meta = profile?.metadata || {}
// //           const metaTopic = meta.mqtt_topic
// //           setMqttTopic(
// //             metaTopic && selectedDeviceId
// //               ? `${metaTopic}/${selectedDeviceId}/up/data`
// //               : ""
// //           )
// //           let streamInfo = outputs[0]
// //           let detectedProtocol = streamInfo?.type || (profile?.protocol || "MQTT").toUpperCase()
// //           let detectedStreamUrl = streamInfo?.value || ""
// //           setProtocol(detectedProtocol)
// //           setStreamUrl(detectedStreamUrl)
// //         })
// //         .catch((e) => {
// //           setAvailableTelemetry([])
// //           setAvailableTelemetryOut([])
// //           setMqttTopic("")
// //           setProtocol("MQTT")
// //           setStreamUrl("")
// //           message.error(e.message || "Failed to fetch device telemetry info")
// //         })
// //         .finally(() => setLoadingProfile(false))
// //     } else {
// //       setAvailableTelemetry([])
// //       setAvailableTelemetryOut([])
// //       setMqttTopic("")
// //       setProtocol("MQTT")
// //       setStreamUrl("")
// //     }
// //   }, [selectedDeviceId, visible, widgetType])

// //   // --- Build merged telemetry tree for TreeSelect ---
// //   let outputs = []
// //   if (selectedDeviceId) {
// //     const deviceProfile = deviceList.find(d => d.id === selectedDeviceId)?.profile
// //     outputs = (deviceProfile?.outputs) ? deviceProfile.outputs : []
// //   }
// //   const backendTree = buildBackendTree(outputs)
// //   const discoveredTree = lastSampleData && Object.keys(lastSampleData).length > 0
// //     ? buildTreeFromSample(lastSampleData)
// //     : []
// //   const telemetryTreeData = mergeTreeData(backendTree, discoveredTree)
// //   // fallback for empty state
// //   const safeTreeData = telemetryTreeData.length
// //     ? telemetryTreeData
// //     : [{ title: "(No telemetry keys yet)", value: "none", key: "none", disabled: true }]

// //   // -- Save dot-paths only! --
// //   const handleSave = async () => {
// //     try {
// //       const values = await form.validateFields()
// //       const settingsValues = await settingsForm.validateFields().catch(() => ({}))

// //       let fans = widget.config?.fans
// //       if (widgetType === "fan-control") {
// //         // ... your fan-control logic here
// //       }

// //       let selectedTelemetryKeys = values.telemetry || []

// //       const updatedWidget = {
// //         ...widget,
// //         title: values.title,
// //         config: {
// //           ...widget.config,
// //           ...settingsValues,
// //           fans,
// //           title: values.title,
// //           dataSource: {
// //             type: values.dataSource,
// //             deviceId: values.deviceId,
// //             telemetry: selectedTelemetryKeys, // <--- ONLY DOT-PATHS!
// //             displayKey: values.displayKey || selectedTelemetryKeys[0],
// //             ...(CONTROL_WIDGET_TYPES.includes(widgetType) && {
// //               telemetryOut: values.telemetryOut,
// //             }),
// //             topic: mqttTopic,
// //             protocol,
// //             streamUrl,
// //           },
// //         },
// //       }
// //       if (values.dataSource === "device" && values.deviceId) {
// //         const selectedDevice = deviceList.find((d) => d.id === values.deviceId)
// //         updatedWidget.deviceId = values.deviceId
// //         updatedWidget.deviceName = selectedDevice?.name || "Unknown Device"
// //       }
// //       onSave(updatedWidget)
// //     } catch (e) {
// //       console.warn("[WidgetConfigModal] Save error:", e)
// //     }
// //   }

// //   // Keep primaryTelemetryKey in sync with selectedTelemetry
// //   useEffect(() => {
// //     if (selectedTelemetry.length > 0) {
// //       setPrimaryTelemetryKey(selectedTelemetry.includes(primaryTelemetryKey) ? primaryTelemetryKey : selectedTelemetry[0])
// //       form.setFieldsValue({ displayKey: selectedTelemetry.includes(primaryTelemetryKey) ? primaryTelemetryKey : selectedTelemetry[0] })
// //     } else {
// //       setPrimaryTelemetryKey(undefined)
// //       form.setFieldsValue({ displayKey: undefined })
// //     }
// //   }, [selectedTelemetry])

// //   return (
// //     <Modal
// //       title={`Configure Widget: ${widget?.title || ""}`}
// //       open={visible}
// //       onCancel={onCancel}
// //       width={isMobile ? "100%" : 800}
// //       className="widget-config-modal"
// //       footer={[
// //         <Button key="cancel" onClick={onCancel}>Cancel</Button>,
// //         <Button key="save" type="primary" onClick={handleSave}>Save</Button>,
// //       ]}
// //     >
// //       <Form form={form} layout="vertical">
// //         <Tabs activeKey={activeTab} onChange={setActiveTab}>
// //           <TabPane tab="General" key="general">
// //             <Form.Item
// //               name="title"
// //               label="Widget Title"
// //               rules={[{ required: true, message: "Please enter a title" }]}
// //             >
// //               <Input />
// //             </Form.Item>
// //             <Divider orientation="left">Data Source</Divider>
// //             <Form.Item name="dataSource" label="Data Source Type">
// //               <Select onChange={handleDataSourceChange} value={selectedDataSource}>
// //                 <Option value="device">Device</Option>
// //                 <Option value="asset">Asset</Option>
// //                 <Option value="entity">Entity</Option>
// //                 <Option value="static">Static Data</Option>
// //               </Select>
// //             </Form.Item>
// //             {selectedDataSource === "device" && (
// //               <>
// //                 <Form.Item
// //                   name="deviceId"
// //                   label="Device"
// //                   rules={[{ required: true, message: "Please select a device" }]}
// //                 >
// //                   <Select
// //                     onChange={handleDeviceChange}
// //                     placeholder={loadingDevices ? "Loading devices..." : "Select device"}
// //                     loading={loadingDevices}
// //                     showSearch
// //                     filterOption={(input, option) =>
// //                       option.children && option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
// //                     }
// //                     value={selectedDeviceId}
// //                     notFoundContent={loadingDevices ? <Spin size="small" /> : "No devices found"}
// //                   >
// //                     {(deviceList || []).map((device) => (
// //                       <Option key={device.id} value={device.id}>
// //                         {device.name}
// //                       </Option>
// //                     ))}
// //                   </Select>
// //                 </Form.Item>
// //                 {/* Show protocol/URL info */}
// //                 {selectedDeviceId && (
// //                   <Alert
// //                     message={`Detected Protocol: ${protocol}${streamUrl ? ` (${streamUrl})` : ""}`}
// //                     type={protocol && protocol !== "MQTT" ? "success" : "info"}
// //                     showIcon
// //                     style={{ marginBottom: 8 }}
// //                   />
// //                 )}
// //                 {selectedDeviceId && !mqttTopic && protocol === "MQTT" && (
// //                   <Alert
// //                     message="No MQTT topic found for this device. Please check device profile metadata."
// //                     type="warning"
// //                     showIcon
// //                   />
// //                 )}
// //                 {/* Telemetry TreeSelect with nested support */}
// //                 {selectedDeviceId && (
// //                   <Form.Item
// //                     name="telemetry"
// //                     label="Streams / Telemetry (Live Value)"
// //                     rules={[{ required: true, message: "Please select at least one telemetry/output" }]}
// //                   >
// //                     <TreeSelect
// //                       treeData={safeTreeData}
// //                       value={selectedTelemetry}
// //                       onChange={v => setSelectedTelemetry(v)}
// //                       treeCheckable
// //                       showCheckedStrategy={TreeSelect.SHOW_PARENT}
// //                       multiple
// //                       style={{ width: "100%" }}
// //                       placeholder="Select telemetry/output (including child/nested fields)"
// //                       allowClear
// //                       treeDefaultExpandAll
// //                       dropdownStyle={{ maxHeight: 300, overflow: "auto" }}
// //                     />
// //                   </Form.Item>
// //                 )}
// //                 {/* DisplayKey select */}
// //                 {selectedDeviceId && selectedTelemetry.length > 0 && (
// //                   <Form.Item
// //                     name="displayKey"
// //                     label="Primary Telemetry Key"
// //                     rules={[{ required: true, message: "Please select a primary key to display" }]}
// //                     initialValue={primaryTelemetryKey || selectedTelemetry[0]}
// //                   >
// //                     <Select
// //                       value={form.getFieldValue("displayKey") || selectedTelemetry[0]}
// //                       onChange={value => { setPrimaryTelemetryKey(value); form.setFieldsValue({ displayKey: value }) }}
// //                       style={{ width: "100%" }}
// //                     >
// //                       {selectedTelemetry.map(key => (
// //                         <Option key={key} value={key}>{key}</Option>
// //                       ))}
// //                     </Select>
// //                   </Form.Item>
// //                 )}
// //                 {/* Only for control widgets: telemetryOut select (from inputs) */}
// //                 {selectedDeviceId && isControlWidget && !!availableTelemetryOut.length && (
// //                   <Form.Item
// //                     name="telemetryOut"
// //                     label="Telemetry Out (for control/command)"
// //                     rules={[{ required: true, message: "Please select at least one telemetry output (input field)" }]}
// //                     initialValue={selectedTelemetryOut}
// //                   >
// //                     <Select
// //                       mode="multiple"
// //                       value={selectedTelemetryOut}
// //                       onChange={setSelectedTelemetryOut}
// //                       placeholder={loadingProfile ? "Loading inputs..." : "Select input(s) for control"}
// //                       optionLabelProp="label"
// //                       notFoundContent={loadingProfile ? <Spin size="small" /> : "No inputs"}
// //                     >
// //                       {(availableTelemetryOut || []).map((key) =>
// //                         key.disabled ? (
// //                           <Option key={key.value} value={key.value} disabled>
// //                             <span style={{ fontWeight: "bold", color: "#aaa" }}>{key.label}</span>
// //                           </Option>
// //                         ) : (
// //                           <Option key={key.value} value={key.value} label={key.label}>
// //                             <div style={{ display: "flex", justifyContent: "space-between" }}>
// //                               <span>{key.label}</span>
// //                               <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>{key.type}</span>
// //                             </div>
// //                           </Option>
// //                         )
// //                       )}
// //                     </Select>
// //                   </Form.Item>
// //                 )}
// //                 {/* MQTT preview and logs */}
// //                 {selectedDeviceId && lastMqttData && (
// //                   <Alert
// //                     message="Last MQTT Data (debug)"
// //                     description={<pre style={{ fontSize: 12, margin: 0 }}>{JSON.stringify(lastMqttData, null, 2)}</pre>}
// //                     type="info"
// //                     showIcon
// //                   />
// //                 )}
// //                 {selectedDeviceId && (
// //                   <Button
// //                     size="small"
// //                     onClick={() => { /* If you want to clear log, manage in useMqttPreview */ }}
// //                     style={{ marginTop: 8, marginBottom: 8 }}
// //                   >
// //                     Clear MQTT Logs
// //                   </Button>
// //                 )}
// //                 {selectedDeviceId && mqttLog.length > 0 && (
// //                   <div style={{ maxHeight: 80, overflow: "auto", background: "#fafafa", fontSize: 12, marginBottom: 8, border: "1px solid #eee" }}>
// //                     {mqttLog.map((line, i) => <div key={i}>{line}</div>)}
// //                   </div>
// //                 )}
// //               </>
// //             )}
// //             {selectedDataSource === "static" && (
// //               <Form.Item name="staticData" label="Static Data">
// //                 <Input.TextArea rows={4} placeholder="Enter JSON data" />
// //               </Form.Item>
// //             )}
// //           </TabPane>
// //           <TabPane tab="Settings" key="settings">
// //             <Form form={settingsForm} layout="vertical">
// //               {settingsSchema.length === 0 ? (
// //                 <div style={{ color: "#999" }}>No extra settings for this widget.</div>
// //               ) : (
// //                 settingsSchema.map(field => {
// //                   const formValues = settingsForm.getFieldsValue()
// //                   if (field.showIf && !field.showIf(formValues)) return null
// //                   return (
// //                     <Form.Item
// //                       key={field.name}
// //                       name={field.name}
// //                       label={field.label}
// //                       tooltip={field.description || field.tooltip}
// //                       rules={field.required ? [{ required: true, message: `Required: ${field.label}` }] : undefined}
// //                       initialValue={widget.config?.[field.name] ?? field.default}
// //                       valuePropName={field.type === "switch" ? "checked" : "value"}
// //                     >
// //                       {renderSettingsField(field, settingsForm)}
// //                     </Form.Item>
// //                   )
// //                 })
// //               )}
// //             </Form>
// //           </TabPane>
// //           <TabPane tab="Advanced" key="advanced">
// //             <Form.Item name="refreshInterval" label="Refresh Interval (seconds)">
// //               <InputNumber min={1} max={3600} />
// //             </Form.Item>
// //             <Form.Item name="backgroundColor" label="Background Color">
// //               <Input type="color" />
// //             </Form.Item>
// //             <Form.Item name="titleColor" label="Title Color">
// //               <Input type="color" />
// //             </Form.Item>
// //             <Form.Item name="showTitle" label="Show Title" valuePropName="checked">
// //               <Switch />
// //             </Form.Item>
// //             <Form.Item name="dropShadow" label="Drop Shadow" valuePropName="checked">
// //               <Switch />
// //             </Form.Item>
// //             <Form.Item name="borderRadius" label="Border Radius (px)">
// //               <InputNumber min={0} max={24} />
// //             </Form.Item>
// //           </TabPane>
// //         </Tabs>
// //       </Form>
// //     </Modal>
// //   )
// // }

// // export default WidgetConfigModal





// // // "use client"
// // // import { Slider } from "antd"
// // // import { useState, useEffect, useCallback } from "react"
// // // import {
// // //   Modal, Form, Input, Select, Tabs, Button, Divider, Switch, InputNumber, message, Spin, Alert,
// // // } from "antd"
// // // import { useMediaQuery } from "../../hooks/useMediaQuery"
// // // import { listDevices, getDeviceById } from "../../api/deviceApi"
// // // import { useMqttPreview } from "../../hooks/useMqttPreview"
// // // import { widgetSchemas } from "./widgets/widgetSchemas"
// // // import "../../styles/widget-modal.css"

// // // const { TabPane } = Tabs
// // // const { Option } = Select

// // // const CONTROL_WIDGET_TYPES = ["slider-control", "fan-control", "switch-control"]

// // // function extractStreamOutputs(profile) {
// // //   if (!profile?.outputs || !Array.isArray(profile.outputs)) return []
// // //   const typePriority = { "HLS": 0, "RTSP": 1, "RTMP": 2, "FLV": 3, "HTTP": 4 }
// // //   return [...profile.outputs]
// // //     .sort(
// // //       (a, b) =>
// // //         (typePriority[(a.targetType || "").toUpperCase()] ?? 99) -
// // //         (typePriority[(b.targetType || "").toUpperCase()] ?? 99)
// // //     )
// // //     .map(out => ({
// // //       label:
// // //         `${out.action?.toUpperCase() || "STREAM"} - ${out.targetType || ""}` +
// // //         (out.description ? ` (${out.description})` : ""),
// // //       value: out.destination,
// // //       type: (out.targetType || "").toUpperCase(),
// // //       kind: "output",
// // //       raw: out,
// // //     }))
// // // }

// // // function extractTelemetryInputs(profile) {
// // //   let inputs = []
// // //   if (Array.isArray(profile?.inputs)) {
// // //     inputs = profile.inputs
// // //   } else if (Array.isArray(profile?.metadata?.inputs)) {
// // //     inputs = profile.metadata.inputs
// // //   }
// // //   return (inputs || []).map(input => ({
// // //     label: (input.description || (input.key?.charAt(0).toUpperCase() + input.key?.slice(1))) + " (Control)",
// // //     value: input.key,
// // //     type: input.dataType?.toLowerCase() === "float" || input.dataType?.toLowerCase() === "int" ? "timeseries" : "attribute",
// // //     kind: "input",
// // //     raw: input,
// // //   }))
// // // }

// // // // Improved rendering for "list", "select", and array/object fields
// // // function renderSettingsField(field, settingsForm) {
// // //   const val = settingsForm.getFieldValue(field.name)
// // //   // List of primitives
// // //   if (field.type === "list" && (!field.default || typeof field.default[0] !== "object")) {
// // //     return (
// // //       <Select
// // //         mode="tags"
// // //         tokenSeparators={[","]}
// // //         style={{ width: "100%" }}
// // //         placeholder={`Enter multiple values (comma or enter)`}
// // //         value={Array.isArray(val) ? val : field.default}
// // //       />
// // //     )
// // //   }
// // //   // List of objects (for speedUnits/tempUnits) -- render as JSON or as labels
// // //   if (field.type === "list" && field.default && typeof field.default[0] === "object") {
// // //     return (
// // //       <Select
// // //         mode="tags"
// // //         style={{ width: "100%" }}
// // //         placeholder="Enter as JSON, or use default"
// // //         value={
// // //           Array.isArray(val)
// // //             ? val.map(item =>
// // //                 typeof item === "object" && item !== null
// // //                   ? JSON.stringify(item)
// // //                   : item
// // //               )
// // //             : field.default.map(item => JSON.stringify(item))
// // //         }
// // //         onChange={arr => {
// // //           // Parse input tags as objects if possible
// // //           const objs = arr.map(str => {
// // //             try {
// // //               return JSON.parse(str)
// // //             } catch {
// // //               return str
// // //             }
// // //           })
// // //           settingsForm.setFieldsValue({ [field.name]: objs })
// // //         }}
// // //         // Accept custom input as JSON
// // //       >
// // //         {field.default.map(item => (
// // //           <Select.Option key={JSON.stringify(item)} value={JSON.stringify(item)}>
// // //             {item.label || JSON.stringify(item)}
// // //           </Select.Option>
// // //         ))}
// // //       </Select>
// // //     )
// // //   }
// // //   // Select for enums
// // //   if (field.type === "select" && Array.isArray(field.options)) {
// // //     return (
// // //       <Select>
// // //         {field.options.map(opt =>
// // //           <Option key={opt} value={opt}>{opt}</Option>
// // //         )}
// // //       </Select>
// // //     )
// // //   }
// // //   switch (field.type) {
// // //     case "input": return <Input />
// // //     case "password": return <Input.Password />
// // //     case "number": return <InputNumber min={field.min} max={field.max} style={{ width: "100%" }} />
// // //     case "switch": return <Switch />
// // //     case "slider": return <Slider min={field.min ?? 0} max={field.max ?? 100} />
// // //     // Default fallback
// // //     default: return <Input />
// // //   }
// // // }

// // // const WidgetConfigModal = ({
// // //   visible, onCancel, onSave, widget, tenantId: propTenantId,
// // // }) => {
// // //   const tenantId = propTenantId || localStorage.getItem("tenantId")
// // //   const [form] = Form.useForm()
// // //   const [settingsForm] = Form.useForm()
// // //   const [activeTab, setActiveTab] = useState("general")
// // //   const [selectedDataSource, setSelectedDataSource] = useState(widget?.config?.dataSource?.type || "device")
// // //   const [selectedDeviceId, setSelectedDeviceId] = useState(widget?.config?.dataSource?.deviceId || null)
// // //   const [availableTelemetry, setAvailableTelemetry] = useState([])
// // //   const [selectedTelemetry, setSelectedTelemetry] = useState(widget?.config?.dataSource?.telemetry || [])
// // //   const [availableTelemetryOut, setAvailableTelemetryOut] = useState([])
// // //   const [selectedTelemetryOut, setSelectedTelemetryOut] = useState(widget?.config?.dataSource?.telemetryOut || [])
// // //   const [deviceList, setDeviceList] = useState([])
// // //   const [loadingDevices, setLoadingDevices] = useState(false)
// // //   const [loadingProfile, setLoadingProfile] = useState(false)
// // //   const [mqttTopic, setMqttTopic] = useState("")
// // //   const [protocol, setProtocol] = useState(widget?.config?.dataSource?.protocol || "MQTT")
// // //   const [streamUrl, setStreamUrl] = useState(widget?.config?.dataSource?.streamUrl || "")
// // //   const isMobile = useMediaQuery("(max-width: 768px)")
// // //   const widgetType = widget?.type
// // //   const settingsSchema = widgetSchemas?.[widgetType] || []

// // //   // --- handler functions ---
// // //   const handleDataSourceChange = (value) => {
// // //     setSelectedDataSource(value)
// // //     form.setFieldsValue({ deviceId: null, telemetry: [], telemetryOut: [] })
// // //     setSelectedDeviceId(null)
// // //     setSelectedTelemetry([])
// // //     setSelectedTelemetryOut([])
// // //     setAvailableTelemetry([])
// // //     setAvailableTelemetryOut([])
// // //     setProtocol("MQTT")
// // //     setStreamUrl("")
// // //   }
// // //   const handleDeviceChange = (value) => {
// // //     setSelectedDeviceId(value)
// // //     form.setFieldsValue({ telemetry: [], telemetryOut: [] })
// // //     setSelectedTelemetry([])
// // //     setSelectedTelemetryOut([])
// // //     setAvailableTelemetry([])
// // //     setAvailableTelemetryOut([])
// // //   }
// // //   // Reset modal state
// // //   useEffect(() => {
// // //     if (visible && widget) {
// // //       form.setFieldsValue({
// // //         title: widget.title || "",
// // //         dataSource: widget.config?.dataSource?.type || "device",
// // //         deviceId: widget.config?.dataSource?.deviceId || null,
// // //         telemetry: widget.config?.dataSource?.telemetry || [],
// // //         telemetryOut: widget.config?.dataSource?.telemetryOut || [],
// // //         ...widget.config,
// // //       })
// // //       settingsForm.setFieldsValue({ ...(widget.config || {}) })
// // //       setActiveTab("general")
// // //       setSelectedDataSource(widget.config?.dataSource?.type || "device")
// // //       setSelectedDeviceId(widget.config?.dataSource?.deviceId || null)
// // //       setSelectedTelemetry(widget?.config?.dataSource?.telemetry || [])
// // //       setSelectedTelemetryOut(widget?.config?.dataSource?.telemetryOut || [])
// // //       setAvailableTelemetry([])
// // //       setAvailableTelemetryOut([])
// // //       setProtocol(widget?.config?.dataSource?.protocol || "MQTT")
// // //       setStreamUrl(widget?.config?.dataSource?.streamUrl || "")
// // //     }
// // //   }, [visible, widget, form, settingsForm])

// // //   // Fetch devices for dropdown
// // //   useEffect(() => {
// // //     if (visible && selectedDataSource === "device" && tenantId) {
// // //       setLoadingDevices(true)
// // //       listDevices({ tenantId, page: 0, size: 100 })
// // //         .then((data) => {
// // //           const mapped = (data.content || []).map(d => ({
// // //             ...d,
// // //             id: d.deviceId,
// // //             name: d.deviceName,
// // //             profile: d.profile,
// // //           }))
// // //           setDeviceList(mapped)
// // //         })
// // //         .catch((e) => {
// // //           setDeviceList([])
// // //           message.error(e.message || "Failed to load devices")
// // //         })
// // //         .finally(() => setLoadingDevices(false))
// // //     } else if (selectedDataSource !== "device") {
// // //       setDeviceList([])
// // //       setSelectedDeviceId(null)
// // //       setAvailableTelemetry([])
// // //       setAvailableTelemetryOut([])
// // //       setProtocol("MQTT")
// // //       setStreamUrl("")
// // //     }
// // //   }, [selectedDataSource, visible, tenantId])

// // //   // Fetch device profile + topic/outputs/inputs/protocol/url
// // //   useEffect(() => {
// // //     if (visible && selectedDeviceId) {
// // //       setLoadingProfile(true)
// // //       getDeviceById(selectedDeviceId, { withProfile: true })
// // //         .then((data) => {
// // //           const profile =
// // //             data.profile ||
// // //             data.device?.profile ||
// // //             data.device?.deviceProfile || {}

// // //           // Outputs for all widgets (including display, monitoring, control live value)
// // //           const outputs = extractStreamOutputs(profile)
// // //           setAvailableTelemetry(outputs)
// // //           // Inputs only for control widgets
// // //           if (CONTROL_WIDGET_TYPES.includes(widgetType)) {
// // //             setAvailableTelemetryOut(extractTelemetryInputs(profile))
// // //           }
// // //           // MQTT topic (for preview)
// // //           let meta = profile?.metadata || {}
// // //           const metaTopic = meta.mqtt_topic
// // //           setMqttTopic(
// // //             metaTopic && selectedDeviceId
// // //               ? `${metaTopic}/${selectedDeviceId}/up/data`
// // //               : ""
// // //           )
// // //           // Protocol/URL detection for display
// // //           let streamInfo = outputs[0]
// // //           let detectedProtocol = streamInfo?.type || (profile?.protocol || "MQTT").toUpperCase()
// // //           let detectedStreamUrl = streamInfo?.value || ""
// // //           setProtocol(detectedProtocol)
// // //           setStreamUrl(detectedStreamUrl)
// // //         })
// // //         .catch((e) => {
// // //           setAvailableTelemetry([])
// // //           setAvailableTelemetryOut([])
// // //           setMqttTopic("")
// // //           setProtocol("MQTT")
// // //           setStreamUrl("")
// // //           message.error(e.message || "Failed to fetch device telemetry info")
// // //         })
// // //         .finally(() => setLoadingProfile(false))
// // //     } else {
// // //       setAvailableTelemetry([])
// // //       setAvailableTelemetryOut([])
// // //       setMqttTopic("")
// // //       setProtocol("MQTT")
// // //       setStreamUrl("")
// // //     }
// // //   }, [selectedDeviceId, visible, widgetType])

// // //   // MQTT telemetry discovery (append discovered telemetry keys)
// // //   const handlePreviewKeys = useCallback((data) => {
// // //     if (typeof data === "object" && data !== null) {
// // //       let newKeys = Object.keys(data).filter(
// // //         key =>
// // //           key !== "__sep__" &&
// // //           !availableTelemetry.find(opt => opt.value === key)
// // //       )
// // //       if (newKeys.length) {
// // //         const newTelemetryOptions = newKeys.map(key => ({
// // //           label: `${key.charAt(0).toUpperCase() + key.slice(1)} (Discovered)`,
// // //           value: key,
// // //           type: typeof data[key],
// // //           kind: "output",
// // //         }))
// // //         setAvailableTelemetry(prev => [...prev, ...newTelemetryOptions])
// // //       }
// // //     }
// // //   }, [availableTelemetry])

// // //   const [lastMqttData, mqttLog] = useMqttPreview(mqttTopic, visible, handlePreviewKeys)

// // //   // --- handleSave: Auto-generate fans array for fan-control
// // //   const handleSave = async () => {
// // //     try {
// // //       const values = await form.validateFields()
// // //       const settingsValues = await settingsForm.validateFields().catch(() => ({}))

// // //       let fans = widget.config?.fans
// // //       if (widgetType === "fan-control") {
// // //         const {
// // //           numFans = 2,
// // //           speedUnit = "%",
// // //           tempUnit = "°C",
// // //           maintenanceHours = 8760,
// // //           runtime = 0,
// // //         } = settingsValues
// // //         fans = Array.from({ length: numFans }, (_, idx) => ({
// // //           id: `FAN${idx + 1}`,
// // //           name: `Fan ${idx + 1}`,
// // //           speedUnit,
// // //           tempUnit,
// // //           maintenanceHours,
// // //           runtime,
// // //         }))
// // //       }

// // //       const updatedWidget = {
// // //         ...widget,
// // //         title: values.title,
// // //         config: {
// // //           ...widget.config,
// // //           ...settingsValues,
// // //           fans, // Updated for fan-control!
// // //           title: values.title,
// // //           dataSource: {
// // //             type: values.dataSource,
// // //             deviceId: values.deviceId,
// // //             telemetry: values.telemetry,
// // //             ...(CONTROL_WIDGET_TYPES.includes(widgetType) && {
// // //               telemetryOut: values.telemetryOut,
// // //             }),
// // //             topic: mqttTopic,
// // //             protocol,
// // //             streamUrl,
// // //           },
// // //         },
// // //       }
// // //       if (values.dataSource === "device" && values.deviceId) {
// // //         const selectedDevice = deviceList.find((d) => d.id === values.deviceId)
// // //         updatedWidget.deviceId = values.deviceId
// // //         updatedWidget.deviceName = selectedDevice?.name || "Unknown Device"
// // //       }
// // //       onSave(updatedWidget)
// // //     } catch (e) {
// // //       console.warn("[WidgetConfigModal] Save error:", e)
// // //     }
// // //   }

// // //   const isControlWidget = CONTROL_WIDGET_TYPES.includes(widgetType)

// // //   return (
// // //     <Modal
// // //       title={`Configure Widget: ${widget?.title || ""}`}
// // //       open={visible}
// // //       onCancel={onCancel}
// // //       width={isMobile ? "100%" : 800}
// // //       className="widget-config-modal"
// // //       footer={[
// // //         <Button key="cancel" onClick={onCancel}>Cancel</Button>,
// // //         <Button key="save" type="primary" onClick={handleSave}>Save</Button>,
// // //       ]}
// // //     >
// // //       <Form form={form} layout="vertical">
// // //         <Tabs activeKey={activeTab} onChange={setActiveTab}>
// // //           <TabPane tab="General" key="general">
// // //             <Form.Item
// // //               name="title"
// // //               label="Widget Title"
// // //               rules={[{ required: true, message: "Please enter a title" }]}
// // //             >
// // //               <Input />
// // //             </Form.Item>
// // //             <Divider orientation="left">Data Source</Divider>
// // //             <Form.Item name="dataSource" label="Data Source Type">
// // //               <Select onChange={handleDataSourceChange} value={selectedDataSource}>
// // //                 <Option value="device">Device</Option>
// // //                 <Option value="asset">Asset</Option>
// // //                 <Option value="entity">Entity</Option>
// // //                 <Option value="static">Static Data</Option>
// // //               </Select>
// // //             </Form.Item>
// // //             {selectedDataSource === "device" && (
// // //               <>
// // //                 <Form.Item
// // //                   name="deviceId"
// // //                   label="Device"
// // //                   rules={[{ required: true, message: "Please select a device" }]}
// // //                 >
// // //                   <Select
// // //                     onChange={handleDeviceChange}
// // //                     placeholder={loadingDevices ? "Loading devices..." : "Select device"}
// // //                     loading={loadingDevices}
// // //                     showSearch
// // //                     filterOption={(input, option) =>
// // //                       option.children && option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
// // //                     }
// // //                     value={selectedDeviceId}
// // //                     notFoundContent={loadingDevices ? <Spin size="small" /> : "No devices found"}
// // //                   >
// // //                     {(deviceList || []).map((device) => (
// // //                       <Option key={device.id} value={device.id}>
// // //                         {device.name}
// // //                       </Option>
// // //                     ))}
// // //                   </Select>
// // //                 </Form.Item>
// // //                 {/* Show protocol/URL info */}
// // //                 {selectedDeviceId && (
// // //                   <Alert
// // //                     message={`Detected Protocol: ${protocol}${streamUrl ? ` (${streamUrl})` : ""}`}
// // //                     type={protocol && protocol !== "MQTT" ? "success" : "info"}
// // //                     showIcon
// // //                     style={{ marginBottom: 8 }}
// // //                   />
// // //                 )}
// // //                 {selectedDeviceId && !mqttTopic && protocol === "MQTT" && (
// // //                   <Alert
// // //                     message="No MQTT topic found for this device. Please check device profile metadata."
// // //                     type="warning"
// // //                     showIcon
// // //                   />
// // //                 )}
// // //                 {/* Universal telemetry select (outputs + MQTT discovered) */}
// // //                 {selectedDeviceId && !!availableTelemetry.length && (
// // //                   <Form.Item
// // //                     name="telemetry"
// // //                     label="Streams / Telemetry (Live Value)"
// // //                     rules={[{ required: true, message: "Please select at least one telemetry/output" }]}
// // //                   >
// // //                     <Select
// // //                       mode="multiple"
// // //                       value={selectedTelemetry}
// // //                       onChange={setSelectedTelemetry}
// // //                       placeholder={loadingProfile ? "Loading outputs..." : "Select telemetry/output"}
// // //                       optionLabelProp="label"
// // //                       notFoundContent={loadingProfile ? <Spin size="small" /> : "No outputs"}
// // //                     >
// // //                       {(availableTelemetry || []).map((key) =>
// // //                         key.disabled ? (
// // //                           <Option key={key.value} value={key.value} disabled>
// // //                             <span style={{ fontWeight: "bold", color: "#aaa" }}>{key.label}</span>
// // //                           </Option>
// // //                         ) : (
// // //                           <Option key={key.value} value={key.value} label={key.label}>
// // //                             <div style={{ display: "flex", justifyContent: "space-between" }}>
// // //                               <span>{key.label}</span>
// // //                               <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>{key.type}</span>
// // //                             </div>
// // //                           </Option>
// // //                         )
// // //                       )}
// // //                     </Select>
// // //                   </Form.Item>
// // //                 )}
// // //                 {/* Only for control widgets: telemetryOut select (from inputs) */}
// // //                 {selectedDeviceId && isControlWidget && !!availableTelemetryOut.length && (
// // //                   <Form.Item
// // //                     name="telemetryOut"
// // //                     label="Telemetry Out (for control/command)"
// // //                     rules={[{ required: true, message: "Please select at least one telemetry output (input field)" }]}
// // //                     initialValue={selectedTelemetryOut}
// // //                   >
// // //                     <Select
// // //                       mode="multiple"
// // //                       value={selectedTelemetryOut}
// // //                       onChange={setSelectedTelemetryOut}
// // //                       placeholder={loadingProfile ? "Loading inputs..." : "Select input(s) for control"}
// // //                       optionLabelProp="label"
// // //                       notFoundContent={loadingProfile ? <Spin size="small" /> : "No inputs"}
// // //                     >
// // //                       {(availableTelemetryOut || []).map((key) =>
// // //                         key.disabled ? (
// // //                           <Option key={key.value} value={key.value} disabled>
// // //                             <span style={{ fontWeight: "bold", color: "#aaa" }}>{key.label}</span>
// // //                           </Option>
// // //                         ) : (
// // //                           <Option key={key.value} value={key.value} label={key.label}>
// // //                             <div style={{ display: "flex", justifyContent: "space-between" }}>
// // //                               <span>{key.label}</span>
// // //                               <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>{key.type}</span>
// // //                             </div>
// // //                           </Option>
// // //                         )
// // //                       )}
// // //                     </Select>
// // //                   </Form.Item>
// // //                 )}
// // //                 {/* MQTT preview and logs */}
// // //                 {selectedDeviceId && lastMqttData && (
// // //                   <Alert
// // //                     message="Last MQTT Data (debug)"
// // //                     description={<pre style={{ fontSize: 12, margin: 0 }}>{JSON.stringify(lastMqttData, null, 2)}</pre>}
// // //                     type="info"
// // //                     showIcon
// // //                   />
// // //                 )}
// // //                 {selectedDeviceId && (
// // //                   <Button
// // //                     size="small"
// // //                     onClick={() => { /* If you want to clear log, manage in useMqttPreview */ }}
// // //                     style={{ marginTop: 8, marginBottom: 8 }}
// // //                   >
// // //                     Clear MQTT Logs
// // //                   </Button>
// // //                 )}
// // //                 {selectedDeviceId && mqttLog.length > 0 && (
// // //                   <div style={{ maxHeight: 80, overflow: "auto", background: "#fafafa", fontSize: 12, marginBottom: 8, border: "1px solid #eee" }}>
// // //                     {mqttLog.map((line, i) => <div key={i}>{line}</div>)}
// // //                   </div>
// // //                 )}
// // //               </>
// // //             )}
// // //             {selectedDataSource === "static" && (
// // //               <Form.Item name="staticData" label="Static Data">
// // //                 <Input.TextArea rows={4} placeholder="Enter JSON data" />
// // //               </Form.Item>
// // //             )}
// // //           </TabPane>
// // //           <TabPane tab="Settings" key="settings">
// // //             <Form form={settingsForm} layout="vertical">
// // //               {settingsSchema.length === 0 ? (
// // //                 <div style={{ color: "#999" }}>No extra settings for this widget.</div>
// // //               ) : (
// // //                 settingsSchema.map(field => {
// // //                   const formValues = settingsForm.getFieldsValue()
// // //                   if (field.showIf && !field.showIf(formValues)) return null
// // //                   return (
// // //                     <Form.Item
// // //                       key={field.name}
// // //                       name={field.name}
// // //                       label={field.label}
// // //                       tooltip={field.description || field.tooltip}
// // //                       rules={field.required ? [{ required: true, message: `Required: ${field.label}` }] : undefined}
// // //                       initialValue={widget.config?.[field.name] ?? field.default}
// // //                       valuePropName={field.type === "switch" ? "checked" : "value"}
// // //                     >
// // //                       {renderSettingsField(field, settingsForm)}
// // //                     </Form.Item>
// // //                   )
// // //                 })
// // //               )}
// // //             </Form>
// // //           </TabPane>
// // //           <TabPane tab="Advanced" key="advanced">
// // //             <Form.Item name="refreshInterval" label="Refresh Interval (seconds)">
// // //               <InputNumber min={1} max={3600} />
// // //             </Form.Item>
// // //             <Form.Item name="backgroundColor" label="Background Color">
// // //               <Input type="color" />
// // //             </Form.Item>
// // //             <Form.Item name="titleColor" label="Title Color">
// // //               <Input type="color" />
// // //             </Form.Item>
// // //             <Form.Item name="showTitle" label="Show Title" valuePropName="checked">
// // //               <Switch />
// // //             </Form.Item>
// // //             <Form.Item name="dropShadow" label="Drop Shadow" valuePropName="checked">
// // //               <Switch />
// // //             </Form.Item>
// // //             <Form.Item name="borderRadius" label="Border Radius (px)">
// // //               <InputNumber min={0} max={24} />
// // //             </Form.Item>
// // //           </TabPane>
// // //         </Tabs>
// // //       </Form>
// // //     </Modal>
// // //   )
// // // }

// // // export default WidgetConfigModal

// // // // "use client"
// // // // import { Slider } from "antd"
// // // // import { useState, useEffect, useCallback } from "react"
// // // // import {
// // // //   Modal, Form, Input, Select, Tabs, Button, Divider, Switch, InputNumber, message, Spin, Alert,
// // // // } from "antd"
// // // // import { useMediaQuery } from "../../hooks/useMediaQuery"
// // // // import { listDevices, getDeviceById } from "../../api/deviceApi"
// // // // import { useMqttPreview } from "../../hooks/useMqttPreview"
// // // // import { widgetSchemas } from "./widgets/widgetSchemas"
// // // // import "../../styles/widget-modal.css"

// // // // const { TabPane } = Tabs
// // // // const { Option } = Select

// // // // // Add all your control widget types here
// // // // const CONTROL_WIDGET_TYPES = ["slider-control", "fan-control", "switch-control"]

// // // // function extractStreamOutputs(profile) {
// // // //   if (!profile?.outputs || !Array.isArray(profile.outputs)) return []
// // // //   const typePriority = { "HLS": 0, "RTSP": 1, "RTMP": 2, "FLV": 3, "HTTP": 4 }
// // // //   return [...profile.outputs]
// // // //     .sort(
// // // //       (a, b) =>
// // // //         (typePriority[(a.targetType || "").toUpperCase()] ?? 99) -
// // // //         (typePriority[(b.targetType || "").toUpperCase()] ?? 99)
// // // //     )
// // // //     .map(out => ({
// // // //       label:
// // // //         `${out.action?.toUpperCase() || "STREAM"} - ${out.targetType || ""}` +
// // // //         (out.description ? ` (${out.description})` : ""),
// // // //       value: out.destination,
// // // //       type: (out.targetType || "").toUpperCase(),
// // // //       kind: "output",
// // // //       raw: out,
// // // //     }))
// // // // }

// // // // function extractTelemetryInputs(profile) {
// // // //   let inputs = []
// // // //   if (Array.isArray(profile?.inputs)) {
// // // //     inputs = profile.inputs
// // // //   } else if (Array.isArray(profile?.metadata?.inputs)) {
// // // //     inputs = profile.metadata.inputs
// // // //   }
// // // //   return (inputs || []).map(input => ({
// // // //     label: (input.description || (input.key?.charAt(0).toUpperCase() + input.key?.slice(1))) + " (Control)",
// // // //     value: input.key,
// // // //     type: input.dataType?.toLowerCase() === "float" || input.dataType?.toLowerCase() === "int" ? "timeseries" : "attribute",
// // // //     kind: "input",
// // // //     raw: input,
// // // //   }))
// // // // }

// // // // function renderSettingsField(field) {
// // // //   switch (field.type) {
// // // //     case "input": return <Input />
// // // //     case "password": return <Input.Password />
// // // //     case "number": return <InputNumber min={field.min} max={field.max} style={{ width: "100%" }} />
// // // //     case "switch": return <Switch />
// // // //     case "slider": return <Slider min={field.min ?? 0} max={field.max ?? 100} />
// // // //     default: return <Input />
// // // //   }
// // // // }

// // // // const WidgetConfigModal = ({
// // // //   visible, onCancel, onSave, widget, tenantId: propTenantId,
// // // // }) => {
// // // //   const tenantId = propTenantId || localStorage.getItem("tenantId")
// // // //   const [form] = Form.useForm()
// // // //   const [settingsForm] = Form.useForm()
// // // //   const [activeTab, setActiveTab] = useState("general")
// // // //   const [selectedDataSource, setSelectedDataSource] = useState(widget?.config?.dataSource?.type || "device")
// // // //   const [selectedDeviceId, setSelectedDeviceId] = useState(widget?.config?.dataSource?.deviceId || null)
// // // //   const [availableTelemetry, setAvailableTelemetry] = useState([]) // all outputs + mqtt discovered
// // // //   const [selectedTelemetry, setSelectedTelemetry] = useState(widget?.config?.dataSource?.telemetry || [])

// // // //   // Only for control widgets
// // // //   const [availableTelemetryOut, setAvailableTelemetryOut] = useState([])
// // // //   const [selectedTelemetryOut, setSelectedTelemetryOut] = useState(widget?.config?.dataSource?.telemetryOut || [])

// // // //   const [deviceList, setDeviceList] = useState([])
// // // //   const [loadingDevices, setLoadingDevices] = useState(false)
// // // //   const [loadingProfile, setLoadingProfile] = useState(false)
// // // //   const [mqttTopic, setMqttTopic] = useState("")
// // // //   const [protocol, setProtocol] = useState(widget?.config?.dataSource?.protocol || "MQTT")
// // // //   const [streamUrl, setStreamUrl] = useState(widget?.config?.dataSource?.streamUrl || "")
// // // //   const isMobile = useMediaQuery("(max-width: 768px)")
// // // //   const widgetType = widget?.type
// // // //   const settingsSchema = widgetSchemas?.[widgetType] || []

// // // //   // Handler Functions
// // // //   const handleDataSourceChange = (value) => {
// // // //     setSelectedDataSource(value)
// // // //     form.setFieldsValue({ deviceId: null, telemetry: [], telemetryOut: [] })
// // // //     setSelectedDeviceId(null)
// // // //     setSelectedTelemetry([])
// // // //     setSelectedTelemetryOut([])
// // // //     setAvailableTelemetry([])
// // // //     setAvailableTelemetryOut([])
// // // //     setProtocol("MQTT")
// // // //     setStreamUrl("")
// // // //   }

// // // //   const handleDeviceChange = (value) => {
// // // //     setSelectedDeviceId(value)
// // // //     form.setFieldsValue({ telemetry: [], telemetryOut: [] })
// // // //     setSelectedTelemetry([])
// // // //     setSelectedTelemetryOut([])
// // // //     setAvailableTelemetry([])
// // // //     setAvailableTelemetryOut([])
// // // //   }

// // // //   // Reset modal state
// // // //   useEffect(() => {
// // // //     if (visible && widget) {
// // // //       form.setFieldsValue({
// // // //         title: widget.title || "",
// // // //         dataSource: widget.config?.dataSource?.type || "device",
// // // //         deviceId: widget.config?.dataSource?.deviceId || null,
// // // //         telemetry: widget.config?.dataSource?.telemetry || [],
// // // //         telemetryOut: widget.config?.dataSource?.telemetryOut || [],
// // // //         ...widget.config,
// // // //       })
// // // //       settingsForm.setFieldsValue({ ...(widget.config || {}) })
// // // //       setActiveTab("general")
// // // //       setSelectedDataSource(widget.config?.dataSource?.type || "device")
// // // //       setSelectedDeviceId(widget.config?.dataSource?.deviceId || null)
// // // //       setSelectedTelemetry(widget?.config?.dataSource?.telemetry || [])
// // // //       setSelectedTelemetryOut(widget?.config?.dataSource?.telemetryOut || [])
// // // //       setAvailableTelemetry([])
// // // //       setAvailableTelemetryOut([])
// // // //       setProtocol(widget?.config?.dataSource?.protocol || "MQTT")
// // // //       setStreamUrl(widget?.config?.dataSource?.streamUrl || "")
// // // //     }
// // // //   }, [visible, widget, form, settingsForm])

// // // //   // Fetch devices for dropdown
// // // //   useEffect(() => {
// // // //     if (visible && selectedDataSource === "device" && tenantId) {
// // // //       setLoadingDevices(true)
// // // //       listDevices({ tenantId, page: 0, size: 100 })
// // // //         .then((data) => {
// // // //           const mapped = (data.content || []).map(d => ({
// // // //             ...d,
// // // //             id: d.deviceId,
// // // //             name: d.deviceName,
// // // //             profile: d.profile,
// // // //           }))
// // // //           setDeviceList(mapped)
// // // //         })
// // // //         .catch((e) => {
// // // //           setDeviceList([])
// // // //           message.error(e.message || "Failed to load devices")
// // // //         })
// // // //         .finally(() => setLoadingDevices(false))
// // // //     } else if (selectedDataSource !== "device") {
// // // //       setDeviceList([])
// // // //       setSelectedDeviceId(null)
// // // //       setAvailableTelemetry([])
// // // //       setAvailableTelemetryOut([])
// // // //       setProtocol("MQTT")
// // // //       setStreamUrl("")
// // // //     }
// // // //   }, [selectedDataSource, visible, tenantId])

// // // //   // Fetch device profile + topic/outputs/inputs/protocol/url
// // // //   useEffect(() => {
// // // //     if (visible && selectedDeviceId) {
// // // //       setLoadingProfile(true)
// // // //       getDeviceById(selectedDeviceId, { withProfile: true })
// // // //         .then((data) => {
// // // //           const profile =
// // // //             data.profile ||
// // // //             data.device?.profile ||
// // // //             data.device?.deviceProfile || {}

// // // //           // Outputs for all widgets (including display, monitoring, control live value)
// // // //           const outputs = extractStreamOutputs(profile)
// // // //           setAvailableTelemetry(outputs) // + MQTT discovered later

// // // //           // Inputs only for control widgets
// // // //           if (CONTROL_WIDGET_TYPES.includes(widgetType)) {
// // // //             setAvailableTelemetryOut(extractTelemetryInputs(profile))
// // // //           }

// // // //           // MQTT topic (for preview)
// // // //           let meta = profile?.metadata || {}
// // // //           const metaTopic = meta.mqtt_topic
// // // //           setMqttTopic(
// // // //             metaTopic && selectedDeviceId
// // // //               ? `${metaTopic}/${selectedDeviceId}/up/data`
// // // //               : ""
// // // //           )

// // // //           // Protocol/URL detection for display
// // // //           let streamInfo = outputs[0]
// // // //           let detectedProtocol = streamInfo?.type || (profile?.protocol || "MQTT").toUpperCase()
// // // //           let detectedStreamUrl = streamInfo?.value || ""
// // // //           setProtocol(detectedProtocol)
// // // //           setStreamUrl(detectedStreamUrl)
// // // //         })
// // // //         .catch((e) => {
// // // //           setAvailableTelemetry([])
// // // //           setAvailableTelemetryOut([])
// // // //           setMqttTopic("")
// // // //           setProtocol("MQTT")
// // // //           setStreamUrl("")
// // // //           message.error(e.message || "Failed to fetch device telemetry info")
// // // //         })
// // // //         .finally(() => setLoadingProfile(false))
// // // //     } else {
// // // //       setAvailableTelemetry([])
// // // //       setAvailableTelemetryOut([])
// // // //       setMqttTopic("")
// // // //       setProtocol("MQTT")
// // // //       setStreamUrl("")
// // // //     }
// // // //   }, [selectedDeviceId, visible, widgetType])

// // // //   // MQTT telemetry discovery (append discovered telemetry keys)
// // // //   const handlePreviewKeys = useCallback((data) => {
// // // //     if (typeof data === "object" && data !== null) {
// // // //       let newKeys = Object.keys(data).filter(
// // // //         key =>
// // // //           key !== "__sep__" &&
// // // //           !availableTelemetry.find(opt => opt.value === key)
// // // //       )
// // // //       if (newKeys.length) {
// // // //         const newTelemetryOptions = newKeys.map(key => ({
// // // //           label: `${key.charAt(0).toUpperCase() + key.slice(1)} (Discovered)`,
// // // //           value: key,
// // // //           type: typeof data[key],
// // // //           kind: "output",
// // // //         }))
// // // //         setAvailableTelemetry(prev => [...prev, ...newTelemetryOptions])
// // // //       }
// // // //     }
// // // //   }, [availableTelemetry])

// // // //   const [lastMqttData, mqttLog] = useMqttPreview(mqttTopic, visible, handlePreviewKeys)

// // // //   // Save Handler: only save what is selected
// // // //   const handleSave = async () => {
// // // //     try {
// // // //       const values = await form.validateFields()
// // // //       const settingsValues = await settingsForm.validateFields().catch(() => ({}))
// // // //       const updatedWidget = {
// // // //         ...widget,
// // // //         title: values.title,
// // // //         config: {
// // // //           ...widget.config,
// // // //           ...settingsValues, // widget-specific settings!
// // // //           title: values.title,
// // // //           dataSource: {
// // // //             type: values.dataSource,
// // // //             deviceId: values.deviceId,
// // // //             telemetry: values.telemetry,
// // // //             ...(CONTROL_WIDGET_TYPES.includes(widgetType) && {
// // // //               telemetryOut: values.telemetryOut,
// // // //             }),
// // // //             topic: mqttTopic,
// // // //             protocol,
// // // //             streamUrl,
// // // //           },
// // // //         },
// // // //       }
// // // //       if (values.dataSource === "device" && values.deviceId) {
// // // //         const selectedDevice = deviceList.find((d) => d.id === values.deviceId)
// // // //         updatedWidget.deviceId = values.deviceId
// // // //         updatedWidget.deviceName = selectedDevice?.name || "Unknown Device"
// // // //       }
// // // //       console.log("[WidgetConfigModal] Saving config for widget", widget.id, ":", updatedWidget)
// // // //       onSave(updatedWidget)
// // // //     } catch (e) {
// // // //       console.warn("[WidgetConfigModal] Save error:", e)
// // // //     }
// // // //   }

// // // //   // --- Render Form Items ---
// // // //   const isControlWidget = CONTROL_WIDGET_TYPES.includes(widgetType)

// // // //   return (
// // // //     <Modal
// // // //       title={`Configure Widget: ${widget?.title || ""}`}
// // // //       open={visible}
// // // //       onCancel={onCancel}
// // // //       width={isMobile ? "100%" : 800}
// // // //       className="widget-config-modal"
// // // //       footer={[
// // // //         <Button key="cancel" onClick={onCancel}>Cancel</Button>,
// // // //         <Button key="save" type="primary" onClick={handleSave}>Save</Button>,
// // // //       ]}
// // // //     >
// // // //       <Form form={form} layout="vertical">
// // // //         <Tabs activeKey={activeTab} onChange={setActiveTab}>
// // // //           <TabPane tab="General" key="general">
// // // //             <Form.Item
// // // //               name="title"
// // // //               label="Widget Title"
// // // //               rules={[{ required: true, message: "Please enter a title" }]}
// // // //             >
// // // //               <Input />
// // // //             </Form.Item>
// // // //             <Divider orientation="left">Data Source</Divider>
// // // //             <Form.Item name="dataSource" label="Data Source Type">
// // // //               <Select onChange={handleDataSourceChange} value={selectedDataSource}>
// // // //                 <Option value="device">Device</Option>
// // // //                 <Option value="asset">Asset</Option>
// // // //                 <Option value="entity">Entity</Option>
// // // //                 <Option value="static">Static Data</Option>
// // // //               </Select>
// // // //             </Form.Item>
// // // //             {selectedDataSource === "device" && (
// // // //               <>
// // // //                 <Form.Item
// // // //                   name="deviceId"
// // // //                   label="Device"
// // // //                   rules={[{ required: true, message: "Please select a device" }]}
// // // //                 >
// // // //                   <Select
// // // //                     onChange={handleDeviceChange}
// // // //                     placeholder={loadingDevices ? "Loading devices..." : "Select device"}
// // // //                     loading={loadingDevices}
// // // //                     showSearch
// // // //                     filterOption={(input, option) =>
// // // //                       option.children && option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
// // // //                     }
// // // //                     value={selectedDeviceId}
// // // //                     notFoundContent={loadingDevices ? <Spin size="small" /> : "No devices found"}
// // // //                   >
// // // //                     {(deviceList || []).map((device) => (
// // // //                       <Option key={device.id} value={device.id}>
// // // //                         {device.name}
// // // //                       </Option>
// // // //                     ))}
// // // //                   </Select>
// // // //                 </Form.Item>
// // // //                 {/* Show protocol/URL info */}
// // // //                 {selectedDeviceId && (
// // // //                   <Alert
// // // //                     message={`Detected Protocol: ${protocol}${streamUrl ? ` (${streamUrl})` : ""}`}
// // // //                     type={protocol && protocol !== "MQTT" ? "success" : "info"}
// // // //                     showIcon
// // // //                     style={{ marginBottom: 8 }}
// // // //                   />
// // // //                 )}
// // // //                 {selectedDeviceId && !mqttTopic && protocol === "MQTT" && (
// // // //                   <Alert
// // // //                     message="No MQTT topic found for this device. Please check device profile metadata."
// // // //                     type="warning"
// // // //                     showIcon
// // // //                   />
// // // //                 )}
// // // //                 {/* Universal telemetry select (outputs + MQTT discovered) */}
// // // //                 {selectedDeviceId && !!availableTelemetry.length && (
// // // //                   <Form.Item
// // // //                     name="telemetry"
// // // //                     label="Streams / Telemetry (Live Value)"
// // // //                     rules={[{ required: true, message: "Please select at least one telemetry/output" }]}
// // // //                   >
// // // //                     <Select
// // // //                       mode="multiple"
// // // //                       value={selectedTelemetry}
// // // //                       onChange={setSelectedTelemetry}
// // // //                       placeholder={loadingProfile ? "Loading outputs..." : "Select telemetry/output"}
// // // //                       optionLabelProp="label"
// // // //                       notFoundContent={loadingProfile ? <Spin size="small" /> : "No outputs"}
// // // //                     >
// // // //                       {(availableTelemetry || []).map((key) =>
// // // //                         key.disabled ? (
// // // //                           <Option key={key.value} value={key.value} disabled>
// // // //                             <span style={{ fontWeight: "bold", color: "#aaa" }}>{key.label}</span>
// // // //                           </Option>
// // // //                         ) : (
// // // //                           <Option key={key.value} value={key.value} label={key.label}>
// // // //                             <div style={{ display: "flex", justifyContent: "space-between" }}>
// // // //                               <span>{key.label}</span>
// // // //                               <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>{key.type}</span>
// // // //                             </div>
// // // //                           </Option>
// // // //                         )
// // // //                       )}
// // // //                     </Select>
// // // //                   </Form.Item>
// // // //                 )}
// // // //                 {/* Only for control widgets: telemetryOut select (from inputs) */}
// // // //                 {selectedDeviceId && isControlWidget && !!availableTelemetryOut.length && (
// // // //                   <Form.Item
// // // //                     name="telemetryOut"
// // // //                     label="Telemetry Out (for control/command)"
// // // //                     rules={[{ required: true, message: "Please select at least one telemetry output (input field)" }]}
// // // //                     initialValue={selectedTelemetryOut}
// // // //                   >
// // // //                     <Select
// // // //                       mode="multiple"
// // // //                       value={selectedTelemetryOut}
// // // //                       onChange={setSelectedTelemetryOut}
// // // //                       placeholder={loadingProfile ? "Loading inputs..." : "Select input(s) for control"}
// // // //                       optionLabelProp="label"
// // // //                       notFoundContent={loadingProfile ? <Spin size="small" /> : "No inputs"}
// // // //                     >
// // // //                       {(availableTelemetryOut || []).map((key) =>
// // // //                         key.disabled ? (
// // // //                           <Option key={key.value} value={key.value} disabled>
// // // //                             <span style={{ fontWeight: "bold", color: "#aaa" }}>{key.label}</span>
// // // //                           </Option>
// // // //                         ) : (
// // // //                           <Option key={key.value} value={key.value} label={key.label}>
// // // //                             <div style={{ display: "flex", justifyContent: "space-between" }}>
// // // //                               <span>{key.label}</span>
// // // //                               <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>{key.type}</span>
// // // //                             </div>
// // // //                           </Option>
// // // //                         )
// // // //                       )}
// // // //                     </Select>
// // // //                   </Form.Item>
// // // //                 )}
// // // //                 {/* MQTT preview and logs */}
// // // //                 {selectedDeviceId && lastMqttData && (
// // // //                   <Alert
// // // //                     message="Last MQTT Data (debug)"
// // // //                     description={<pre style={{ fontSize: 12, margin: 0 }}>{JSON.stringify(lastMqttData, null, 2)}</pre>}
// // // //                     type="info"
// // // //                     showIcon
// // // //                   />
// // // //                 )}
// // // //                 {selectedDeviceId && (
// // // //                   <Button
// // // //                     size="small"
// // // //                     onClick={() => { /* If you want to clear log, manage in useMqttPreview */ }}
// // // //                     style={{ marginTop: 8, marginBottom: 8 }}
// // // //                   >
// // // //                     Clear MQTT Logs
// // // //                   </Button>
// // // //                 )}
// // // //                 {selectedDeviceId && mqttLog.length > 0 && (
// // // //                   <div style={{ maxHeight: 80, overflow: "auto", background: "#fafafa", fontSize: 12, marginBottom: 8, border: "1px solid #eee" }}>
// // // //                     {mqttLog.map((line, i) => <div key={i}>{line}</div>)}
// // // //                   </div>
// // // //                 )}
// // // //               </>
// // // //             )}
// // // //             {selectedDataSource === "static" && (
// // // //               <Form.Item name="staticData" label="Static Data">
// // // //                 <Input.TextArea rows={4} placeholder="Enter JSON data" />
// // // //               </Form.Item>
// // // //             )}
// // // //           </TabPane>
// // // //           <TabPane tab="Settings" key="settings">
// // // //             <Form form={settingsForm} layout="vertical">
// // // //               {settingsSchema.length === 0 ? (
// // // //                 <div style={{ color: "#999" }}>No extra settings for this widget.</div>
// // // //               ) : (
// // // //                 settingsSchema.map(field => {
// // // //                   const formValues = settingsForm.getFieldsValue()
// // // //                   if (field.showIf && !field.showIf(formValues)) return null
// // // //                   return (
// // // //                     <Form.Item
// // // //                       key={field.name}
// // // //                       name={field.name}
// // // //                       label={field.label}
// // // //                       rules={field.required ? [{ required: true, message: `Required: ${field.label}` }] : undefined}
// // // //                       initialValue={widget.config?.[field.name] ?? field.default}
// // // //                       valuePropName={field.type === "switch" ? "checked" : "value"}
// // // //                     >
// // // //                       {renderSettingsField(field)}
// // // //                     </Form.Item>
// // // //                   )
// // // //                 })
// // // //               )}
// // // //             </Form>
// // // //           </TabPane>
// // // //           <TabPane tab="Advanced" key="advanced">
// // // //             <Form.Item name="refreshInterval" label="Refresh Interval (seconds)">
// // // //               <InputNumber min={1} max={3600} />
// // // //             </Form.Item>
// // // //             <Form.Item name="backgroundColor" label="Background Color">
// // // //               <Input type="color" />
// // // //             </Form.Item>
// // // //             <Form.Item name="titleColor" label="Title Color">
// // // //               <Input type="color" />
// // // //             </Form.Item>
// // // //             <Form.Item name="showTitle" label="Show Title" valuePropName="checked">
// // // //               <Switch />
// // // //             </Form.Item>
// // // //             <Form.Item name="dropShadow" label="Drop Shadow" valuePropName="checked">
// // // //               <Switch />
// // // //             </Form.Item>
// // // //             <Form.Item name="borderRadius" label="Border Radius (px)">
// // // //               <InputNumber min={0} max={24} />
// // // //             </Form.Item>
// // // //           </TabPane>
// // // //         </Tabs>
// // // //       </Form>
// // // //     </Modal>
// // // //   )
// // // // }

// // // // export default WidgetConfigModal


// // // // // "use client"
// // // // // import { Slider } from "antd"
// // // // // import { useState, useEffect, useCallback } from "react"
// // // // // import {
// // // // //   Modal, Form, Input, Select, Tabs, Button, Divider, Switch, InputNumber, message, Spin, Alert,
// // // // // } from "antd"
// // // // // import { useMediaQuery } from "../../hooks/useMediaQuery"
// // // // // import { listDevices, getDeviceById } from "../../api/deviceApi"
// // // // // import { useMqttPreview } from "../../hooks/useMqttPreview"
// // // // // import { widgetSchemas } from "./widgets/widgetSchemas"
// // // // // import "../../styles/widget-modal.css"

// // // // // const { TabPane } = Tabs
// // // // // const { Option } = Select

// // // // // function extractStreamOutputs(profile) {
// // // // //   if (!profile?.outputs || !Array.isArray(profile.outputs)) return []
// // // // //   const typePriority = { "HLS": 0, "RTSP": 1, "RTMP": 2, "FLV": 3, "HTTP": 4 }
// // // // //   return [...profile.outputs]
// // // // //     .sort(
// // // // //       (a, b) =>
// // // // //         (typePriority[(a.targetType || "").toUpperCase()] ?? 99) -
// // // // //         (typePriority[(b.targetType || "").toUpperCase()] ?? 99)
// // // // //     )
// // // // //     .map(out => ({
// // // // //       label:
// // // // //         `${out.action?.toUpperCase() || "STREAM"} - ${out.targetType || ""}` +
// // // // //         (out.description ? ` (${out.description})` : ""),
// // // // //       value: out.destination,
// // // // //       type: (out.targetType || "").toUpperCase(),
// // // // //       kind: "output",
// // // // //       raw: out,
// // // // //     }))
// // // // // }
// // // // // function extractTelemetryInputs(profile) {
// // // // //   let inputs = []
// // // // //   if (Array.isArray(profile?.inputs)) {
// // // // //     inputs = profile.inputs
// // // // //   } else if (Array.isArray(profile?.metadata?.inputs)) {
// // // // //     inputs = profile.metadata.inputs
// // // // //   }
// // // // //   return (inputs || []).map(input => ({
// // // // //     label: (input.description || (input.key?.charAt(0).toUpperCase() + input.key?.slice(1))) + " (Telemetry)",
// // // // //     value: input.key,
// // // // //     type: input.dataType?.toLowerCase() === "float" || input.dataType?.toLowerCase() === "int" ? "timeseries" : "attribute",
// // // // //     kind: "telemetry",
// // // // //     raw: input,
// // // // //   }))
// // // // // }

// // // // // function renderSettingsField(field) {
// // // // //   switch (field.type) {
// // // // //     case "input":      
// // // // //       return <Input />;
// // // // //     case "password":   
// // // // //       return <Input.Password />;
// // // // //     case "number":     
// // // // //       return <InputNumber min={field.min} max={field.max} style={{ width: "100%" }} />;
// // // // //     case "switch":     
// // // // //       return <Switch />;
// // // // //     case "slider":
// // // // //       return <Slider min={field.min ?? 0} max={field.max ?? 100} />;
// // // // //     default:           
// // // // //       return <Input />;
// // // // //   }
// // // // // }

// // // // // const WidgetConfigModal = ({
// // // // //   visible, onCancel, onSave, widget, tenantId: propTenantId,
// // // // // }) => {
// // // // //   const tenantId = propTenantId || localStorage.getItem("tenantId")
// // // // //   const [form] = Form.useForm()
// // // // //   const [settingsForm] = Form.useForm()
// // // // //   const [activeTab, setActiveTab] = useState("general")
// // // // //   const [selectedDataSource, setSelectedDataSource] = useState(widget?.config?.dataSource?.type || "device")
// // // // //   const [selectedDeviceId, setSelectedDeviceId] = useState(widget?.config?.dataSource?.deviceId || null)
// // // // //   const [availableDataKeys, setAvailableDataKeys] = useState([])
// // // // //   const [selectedDataKeys, setSelectedDataKeys] = useState(widget?.config?.dataSource?.telemetry || [])
// // // // //   const [deviceList, setDeviceList] = useState([])
// // // // //   const [loadingDevices, setLoadingDevices] = useState(false)
// // // // //   const [loadingProfile, setLoadingProfile] = useState(false)
// // // // //   const [mqttTopic, setMqttTopic] = useState("")
// // // // //   const [protocol, setProtocol] = useState(widget?.config?.dataSource?.protocol || "MQTT")
// // // // //   const [streamUrl, setStreamUrl] = useState(widget?.config?.dataSource?.streamUrl || "")
// // // // //   const isMobile = useMediaQuery("(max-width: 768px)")
// // // // //   const [baseOutputs, setBaseOutputs] = useState([])
// // // // //   const [baseTelemetry, setBaseTelemetry] = useState([])
// // // // //   const widgetType = widget?.type
// // // // //   const settingsSchema = widgetSchemas?.[widgetType] || []

// // // // //   // Handler Functions
// // // // //   const handleDataSourceChange = (value) => {
// // // // //     setSelectedDataSource(value)
// // // // //     form.setFieldsValue({ deviceId: null, telemetry: [] })
// // // // //     setSelectedDeviceId(null)
// // // // //     setSelectedDataKeys([])
// // // // //     setBaseOutputs([])
// // // // //     setBaseTelemetry([])
// // // // //     setAvailableDataKeys([])
// // // // //     setProtocol("MQTT")
// // // // //     setStreamUrl("")
// // // // //   }

// // // // //   const handleDeviceChange = (value) => {
// // // // //     setSelectedDeviceId(value)
// // // // //     form.setFieldsValue({ telemetry: [] })
// // // // //     setSelectedDataKeys([])
// // // // //     setBaseOutputs([])
// // // // //     setBaseTelemetry([])
// // // // //     setAvailableDataKeys([])
// // // // //   }

// // // // //   const handleDataKeysChange = (values) => setSelectedDataKeys(values)

// // // // //   // Reset modal state
// // // // //   useEffect(() => {
// // // // //     if (visible && widget) {
// // // // //       console.log("[WidgetConfigModal] Opened for widget", widget.id, "config:", widget.config)
// // // // //       form.setFieldsValue({
// // // // //         title: widget.title || "",
// // // // //         dataSource: widget.config?.dataSource?.type || "device",
// // // // //         deviceId: widget.config?.dataSource?.deviceId || null,
// // // // //         telemetry: widget.config?.dataSource?.telemetry || [],
// // // // //         ...widget.config,
// // // // //       })
// // // // //       settingsForm.setFieldsValue({ ...(widget.config || {}) })
// // // // //       setActiveTab("general")
// // // // //       setSelectedDataSource(widget.config?.dataSource?.type || "device")
// // // // //       setSelectedDeviceId(widget.config?.dataSource?.deviceId || null)
// // // // //       setSelectedDataKeys(widget?.config?.dataSource?.telemetry || [])
// // // // //       setBaseOutputs([])
// // // // //       setBaseTelemetry([])
// // // // //       setAvailableDataKeys([])
// // // // //       setProtocol(widget?.config?.dataSource?.protocol || "MQTT")
// // // // //       setStreamUrl(widget?.config?.dataSource?.streamUrl || "")
// // // // //     }
// // // // //   }, [visible, widget, form, settingsForm])

// // // // //   // Fetch devices for dropdown
// // // // //   useEffect(() => {
// // // // //     if (visible && selectedDataSource === "device" && tenantId) {
// // // // //       setLoadingDevices(true)
// // // // //       listDevices({ tenantId, page: 0, size: 100 })
// // // // //         .then((data) => {
// // // // //           const mapped = (data.content || []).map(d => ({
// // // // //             ...d,
// // // // //             id: d.deviceId,
// // // // //             name: d.deviceName,
// // // // //             profile: d.profile,
// // // // //           }))
// // // // //           setDeviceList(mapped)
// // // // //         })
// // // // //         .catch((e) => {
// // // // //           setDeviceList([])
// // // // //           message.error(e.message || "Failed to load devices")
// // // // //         })
// // // // //         .finally(() => setLoadingDevices(false))
// // // // //     } else if (selectedDataSource !== "device") {
// // // // //       setDeviceList([])
// // // // //       setSelectedDeviceId(null)
// // // // //       setBaseOutputs([])
// // // // //       setBaseTelemetry([])
// // // // //       setAvailableDataKeys([])
// // // // //       setProtocol("MQTT")
// // // // //       setStreamUrl("")
// // // // //     }
// // // // //   }, [selectedDataSource, visible, tenantId])

// // // // //   // Fetch device profile + topic/outputs/telemetry/protocol/url
// // // // //   useEffect(() => {
// // // // //     if (visible && selectedDeviceId) {
// // // // //       setLoadingProfile(true)
// // // // //       getDeviceById(selectedDeviceId, { withProfile: true })
// // // // //         .then((data) => {
// // // // //           const profile =
// // // // //             data.profile ||
// // // // //             data.device?.profile ||
// // // // //             data.device?.deviceProfile || {}

// // // // //           const outputs = extractStreamOutputs(profile)
// // // // //           const telemetry = extractTelemetryInputs(profile)
// // // // //           setBaseOutputs(outputs)
// // // // //           setBaseTelemetry(telemetry)

// // // // //           // MQTT topic (for preview)
// // // // //           let meta = profile?.metadata || {}
// // // // //           const metaTopic = meta.mqtt_topic
// // // // //           setMqttTopic(
// // // // //             metaTopic && selectedDeviceId
// // // // //               ? `${metaTopic}/${selectedDeviceId}/up/data`
// // // // //               : ""
// // // // //           )

// // // // //           // Protocol/URL detection for display
// // // // //           let streamInfo = outputs[0]
// // // // //           let detectedProtocol = streamInfo?.type || (profile?.protocol || "MQTT").toUpperCase()
// // // // //           let detectedStreamUrl = streamInfo?.value || ""
// // // // //           setProtocol(detectedProtocol)
// // // // //           setStreamUrl(detectedStreamUrl)

// // // // //           // Compose keys for select
// // // // //           if (outputs.length || telemetry.length) {
// // // // //             setAvailableDataKeys([
// // // // //               ...outputs,
// // // // //               ...(telemetry.length ? [{ label: "--- Telemetry ---", value: "__sep__", disabled: true }] : []),
// // // // //               ...telemetry,
// // // // //             ])
// // // // //           } else {
// // // // //             setAvailableDataKeys([])
// // // // //           }
// // // // //         })
// // // // //         .catch((e) => {
// // // // //           setBaseOutputs([])
// // // // //           setBaseTelemetry([])
// // // // //           setAvailableDataKeys([])
// // // // //           setMqttTopic("")
// // // // //           setProtocol("MQTT")
// // // // //           setStreamUrl("")
// // // // //           message.error(e.message || "Failed to fetch device telemetry info")
// // // // //         })
// // // // //         .finally(() => setLoadingProfile(false))
// // // // //     } else {
// // // // //       setBaseOutputs([])
// // // // //       setBaseTelemetry([])
// // // // //       setAvailableDataKeys([])
// // // // //       setMqttTopic("")
// // // // //       setProtocol("MQTT")
// // // // //       setStreamUrl("")
// // // // //     }
// // // // //   }, [selectedDeviceId, visible])

// // // // //   // MQTT telemetry discovery (append discovered telemetry keys)
// // // // //   const handlePreviewKeys = useCallback((data) => {
// // // // //     if (typeof data === "object" && data !== null) {
// // // // //       let baseTelemetryKeys = new Set(baseTelemetry.map(k => k.value))
// // // // //       let newKeys = Object.keys(data).filter(
// // // // //         key =>
// // // // //           key !== "__sep__" &&
// // // // //           !baseTelemetryKeys.has(key) &&
// // // // //           !availableDataKeys.find(opt => opt.value === key)
// // // // //       )
// // // // //       if (newKeys.length) {
// // // // //         const newTelemetryOptions = newKeys.map(key => ({
// // // // //           label: `${key.charAt(0).toUpperCase() + key.slice(1)} (Discovered)`,
// // // // //           value: key,
// // // // //           type: typeof data[key],
// // // // //           kind: "telemetry",
// // // // //           raw: { key },
// // // // //         }))
// // // // //         setAvailableDataKeys(prev => {
// // // // //           let idx = prev.findIndex(opt => opt.value === "__sep__")
// // // // //           if (idx === -1) return [...prev, ...newTelemetryOptions]
// // // // //           let arr = [...prev]
// // // // //           arr.splice(idx + 1, 0, ...newTelemetryOptions)
// // // // //           return arr
// // // // //         })
// // // // //       }
// // // // //     }
// // // // //   }, [baseTelemetry, availableDataKeys])

// // // // //   const [lastMqttData, mqttLog] = useMqttPreview(mqttTopic, visible, handlePreviewKeys)

// // // // //   // Save Handler: only save what is selected
// // // // //   const handleSave = async () => {
// // // // //     try {
// // // // //       const values = await form.validateFields()
// // // // //       const settingsValues = await settingsForm.validateFields().catch(() => ({}))
// // // // //       const updatedWidget = {
// // // // //         ...widget,
// // // // //         title: values.title,
// // // // //         config: {
// // // // //           ...widget.config,
// // // // //           ...settingsValues, // widget-specific settings!
// // // // //           title: values.title,
// // // // //           dataSource: {
// // // // //             type: values.dataSource,
// // // // //             deviceId: values.deviceId,
// // // // //             telemetry: values.telemetry,
// // // // //             topic: mqttTopic,
// // // // //             protocol,
// // // // //             streamUrl,
// // // // //           },
// // // // //         },
// // // // //       }
// // // // //       if (values.dataSource === "device" && values.deviceId) {
// // // // //         const selectedDevice = deviceList.find((d) => d.id === values.deviceId)
// // // // //         updatedWidget.deviceId = values.deviceId
// // // // //         updatedWidget.deviceName = selectedDevice?.name || "Unknown Device"
// // // // //       }
// // // // //       console.log("[WidgetConfigModal] Saving config for widget", widget.id, ":", updatedWidget)      
// // // // //       onSave(updatedWidget)
// // // // //     } catch (e) {
// // // // //         console.warn("[WidgetConfigModal] Save error:", e)
// // // // //     }
// // // // //   }

// // // // //   // ---------------- JSX --------------------
// // // // //   return (
// // // // //     <Modal
// // // // //       title={`Configure Widget: ${widget?.title || ""}`}
// // // // //       open={visible}
// // // // //       onCancel={onCancel}
// // // // //       width={isMobile ? "100%" : 800}
// // // // //       className="widget-config-modal"
// // // // //       footer={[
// // // // //         <Button key="cancel" onClick={onCancel}>Cancel</Button>,
// // // // //         <Button key="save" type="primary" onClick={handleSave}>Save</Button>,
// // // // //       ]}
// // // // //     >
// // // // //       <Form form={form} layout="vertical">
// // // // //         <Tabs activeKey={activeTab} onChange={setActiveTab}>
// // // // //           <TabPane tab="General" key="general">
// // // // //             <Form.Item
// // // // //               name="title"
// // // // //               label="Widget Title"
// // // // //               rules={[{ required: true, message: "Please enter a title" }]}
// // // // //             >
// // // // //               <Input />
// // // // //             </Form.Item>
// // // // //             <Divider orientation="left">Data Source</Divider>
// // // // //             <Form.Item name="dataSource" label="Data Source Type">
// // // // //               <Select onChange={handleDataSourceChange} value={selectedDataSource}>
// // // // //                 <Option value="device">Device</Option>
// // // // //                 <Option value="asset">Asset</Option>
// // // // //                 <Option value="entity">Entity</Option>
// // // // //                 <Option value="static">Static Data</Option>
// // // // //               </Select>
// // // // //             </Form.Item>
// // // // //             {selectedDataSource === "device" && (
// // // // //               <>
// // // // //                 <Form.Item
// // // // //                   name="deviceId"
// // // // //                   label="Device"
// // // // //                   rules={[{ required: true, message: "Please select a device" }]}
// // // // //                 >
// // // // //                   <Select
// // // // //                     onChange={handleDeviceChange}
// // // // //                     placeholder={loadingDevices ? "Loading devices..." : "Select device"}
// // // // //                     loading={loadingDevices}
// // // // //                     showSearch
// // // // //                     filterOption={(input, option) =>
// // // // //                       option.children && option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
// // // // //                     }
// // // // //                     value={selectedDeviceId}
// // // // //                     notFoundContent={loadingDevices ? <Spin size="small" /> : "No devices found"}
// // // // //                   >
// // // // //                     {(deviceList || []).map((device) => (
// // // // //                       <Option key={device.id} value={device.id}>
// // // // //                         {device.name}
// // // // //                       </Option>
// // // // //                     ))}
// // // // //                   </Select>
// // // // //                 </Form.Item>
// // // // //                 {/* Show protocol/URL info */}
// // // // //                 {selectedDeviceId && (
// // // // //                   <Alert
// // // // //                     message={`Detected Protocol: ${protocol}${streamUrl ? ` (${streamUrl})` : ""}`}
// // // // //                     type={protocol && protocol !== "MQTT" ? "success" : "info"}
// // // // //                     showIcon
// // // // //                     style={{ marginBottom: 8 }}
// // // // //                   />
// // // // //                 )}
// // // // //                 {selectedDeviceId && !mqttTopic && protocol === "MQTT" && (
// // // // //                   <Alert
// // // // //                     message="No MQTT topic found for this device. Please check device profile metadata."
// // // // //                     type="warning"
// // // // //                     showIcon
// // // // //                   />
// // // // //                 )}
// // // // //                 {/* Show combined outputs + telemetry */}
// // // // //                 {selectedDeviceId && !!availableDataKeys.length && (
// // // // //                   <Form.Item
// // // // //                     name="telemetry"
// // // // //                     label="Streams / Data Keys"
// // // // //                     rules={[{ required: true, message: "Please select at least one stream or data key" }]}
// // // // //                   >
// // // // //                     <Select
// // // // //                       mode="multiple"
// // // // //                       placeholder={loadingProfile ? "Loading outputs..." : "Select streams and/or telemetry"}
// // // // //                       onChange={handleDataKeysChange}
// // // // //                       optionLabelProp="label"
// // // // //                       notFoundContent={loadingProfile ? <Spin size="small" /> : "No keys"}
// // // // //                       value={selectedDataKeys}
// // // // //                     >
// // // // //                       {availableDataKeys.map((key) =>
// // // // //                         key.disabled ? (
// // // // //                           <Option key={key.value} value={key.value} disabled>
// // // // //                             <span style={{ fontWeight: "bold", color: "#aaa" }}>{key.label}</span>
// // // // //                           </Option>
// // // // //                         ) : (
// // // // //                           <Option key={key.value} value={key.value} label={key.label}>
// // // // //                             <div style={{ display: "flex", justifyContent: "space-between" }}>
// // // // //                               <span>{key.label}</span>
// // // // //                               <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>{key.type}</span>
// // // // //                             </div>
// // // // //                           </Option>
// // // // //                         )
// // // // //                       )}
// // // // //                     </Select>
// // // // //                   </Form.Item>
// // // // //                 )}
// // // // //                 {/* MQTT preview and logs */}
// // // // //                 {selectedDeviceId && lastMqttData && (
// // // // //                   <Alert
// // // // //                     message="Last MQTT Data (debug)"
// // // // //                     description={<pre style={{ fontSize: 12, margin: 0 }}>{JSON.stringify(lastMqttData, null, 2)}</pre>}
// // // // //                     type="info"
// // // // //                     showIcon
// // // // //                   />
// // // // //                 )}
// // // // //                 {selectedDeviceId && (
// // // // //                   <Button
// // // // //                     size="small"
// // // // //                     onClick={() => { /* If you want to clear log, manage in useMqttPreview */ }}
// // // // //                     style={{ marginTop: 8, marginBottom: 8 }}
// // // // //                   >
// // // // //                     Clear MQTT Logs
// // // // //                   </Button>
// // // // //                 )}
// // // // //                 {selectedDeviceId && mqttLog.length > 0 && (
// // // // //                   <div style={{ maxHeight: 80, overflow: "auto", background: "#fafafa", fontSize: 12, marginBottom: 8, border: "1px solid #eee" }}>
// // // // //                     {mqttLog.map((line, i) => <div key={i}>{line}</div>)}
// // // // //                   </div>
// // // // //                 )}
// // // // //               </>
// // // // //             )}
// // // // //             {selectedDataSource === "static" && (
// // // // //               <Form.Item name="staticData" label="Static Data">
// // // // //                 <Input.TextArea rows={4} placeholder="Enter JSON data" />
// // // // //               </Form.Item>
// // // // //             )}
// // // // //           </TabPane>
// // // // //           <TabPane tab="Settings" key="settings">
// // // // //             <Form form={settingsForm} layout="vertical">
// // // // //               {settingsSchema.length === 0 ? (
// // // // //                 <div style={{ color: "#999" }}>No extra settings for this widget.</div>
// // // // //               ) : (
// // // // //                 settingsSchema.map(field => {
// // // // //                   const formValues = settingsForm.getFieldsValue()
// // // // //                   if (field.showIf && !field.showIf(formValues)) return null
// // // // //                   return (
// // // // //                     <Form.Item
// // // // //                       key={field.name}
// // // // //                       name={field.name}
// // // // //                       label={field.label}
// // // // //                       rules={field.required ? [{ required: true, message: `Required: ${field.label}` }] : undefined}
// // // // //                       initialValue={widget.config?.[field.name] ?? field.default}
// // // // //                       valuePropName={field.type === "switch" ? "checked" : "value"}
// // // // //                     >
// // // // //                       {renderSettingsField(field)}
// // // // //                     </Form.Item>
// // // // //                   )
// // // // //                 })
// // // // //               )}
// // // // //             </Form>
// // // // //           </TabPane>
// // // // //           <TabPane tab="Advanced" key="advanced">
// // // // //             <Form.Item name="refreshInterval" label="Refresh Interval (seconds)">
// // // // //               <InputNumber min={1} max={3600} />
// // // // //             </Form.Item>
// // // // //             <Form.Item name="backgroundColor" label="Background Color">
// // // // //               <Input type="color" />
// // // // //             </Form.Item>
// // // // //             <Form.Item name="titleColor" label="Title Color">
// // // // //               <Input type="color" />
// // // // //             </Form.Item>
// // // // //             <Form.Item name="showTitle" label="Show Title" valuePropName="checked">
// // // // //               <Switch />
// // // // //             </Form.Item>
// // // // //             <Form.Item name="dropShadow" label="Drop Shadow" valuePropName="checked">
// // // // //               <Switch />
// // // // //             </Form.Item>
// // // // //             <Form.Item name="borderRadius" label="Border Radius (px)">
// // // // //               <InputNumber min={0} max={24} />
// // // // //             </Form.Item>
// // // // //           </TabPane>
// // // // //         </Tabs>
// // // // //       </Form>
// // // // //     </Modal>
// // // // //   )
// // // // // }

// // // // // export default WidgetConfigModal


// // // // // // "use client"

// // // // // // import { useState, useEffect, useCallback } from "react"
// // // // // // import {
// // // // // //   Modal, Form, Input, Select, Tabs, Button, Divider, Switch, InputNumber, message, Spin, Alert,
// // // // // // } from "antd"
// // // // // // import { useMediaQuery } from "../../hooks/useMediaQuery"
// // // // // // import { listDevices, getDeviceById } from "../../api/deviceApi"
// // // // // // import { useMqttPreview } from "../../hooks/useMqttPreview"
// // // // // // import "../../styles/widget-modal.css"

// // // // // // const { TabPane } = Tabs
// // // // // // const { Option } = Select

// // // // // // // --------- Helpers to extract outputs & telemetry ----------
// // // // // // function extractStreamOutputs(profile) {
// // // // // //   if (!profile?.outputs || !Array.isArray(profile.outputs)) return []
// // // // // //   const typePriority = { "HLS": 0, "RTSP": 1, "RTMP": 2, "FLV": 3, "HTTP": 4 }
// // // // // //   return [...profile.outputs]
// // // // // //     .sort(
// // // // // //       (a, b) =>
// // // // // //         (typePriority[(a.targetType || "").toUpperCase()] ?? 99) -
// // // // // //         (typePriority[(b.targetType || "").toUpperCase()] ?? 99)
// // // // // //     )
// // // // // //     .map(out => ({
// // // // // //       label:
// // // // // //         `${out.action?.toUpperCase() || "STREAM"} - ${out.targetType || ""}` +
// // // // // //         (out.description ? ` (${out.description})` : ""),
// // // // // //       value: out.destination,
// // // // // //       type: (out.targetType || "").toUpperCase(),
// // // // // //       kind: "output",
// // // // // //       raw: out,
// // // // // //     }))
// // // // // // }

// // // // // // function extractTelemetryInputs(profile) {
// // // // // //   let inputs = []
// // // // // //   if (Array.isArray(profile?.inputs)) {
// // // // // //     inputs = profile.inputs
// // // // // //   } else if (Array.isArray(profile?.metadata?.inputs)) {
// // // // // //     inputs = profile.metadata.inputs
// // // // // //   }
// // // // // //   return (inputs || []).map(input => ({
// // // // // //     label: (input.description || (input.key?.charAt(0).toUpperCase() + input.key?.slice(1))) + " (Telemetry)",
// // // // // //     value: input.key,
// // // // // //     type: input.dataType?.toLowerCase() === "float" || input.dataType?.toLowerCase() === "int" ? "timeseries" : "attribute",
// // // // // //     kind: "telemetry",
// // // // // //     raw: input,
// // // // // //   }))
// // // // // // }


// // // // // // const WidgetConfigModal = ({
// // // // // //   visible, onCancel, onSave, widget, tenantId: propTenantId,
// // // // // // }) => {
// // // // // //   const tenantId = propTenantId || localStorage.getItem("tenantId")
// // // // // //   const [form] = Form.useForm()
// // // // // //   const [activeTab, setActiveTab] = useState("general")
// // // // // //   const [selectedDataSource, setSelectedDataSource] = useState(widget?.config?.dataSource?.type || "device")
// // // // // //   const [selectedDeviceId, setSelectedDeviceId] = useState(widget?.config?.dataSource?.deviceId || null)
// // // // // //   const [availableDataKeys, setAvailableDataKeys] = useState([])
// // // // // //   const [selectedDataKeys, setSelectedDataKeys] = useState(widget?.config?.dataSource?.telemetry || [])
// // // // // //   const [deviceList, setDeviceList] = useState([])
// // // // // //   const [loadingDevices, setLoadingDevices] = useState(false)
// // // // // //   const [loadingProfile, setLoadingProfile] = useState(false)
// // // // // //   const [mqttTopic, setMqttTopic] = useState("")
// // // // // //   const [protocol, setProtocol] = useState(widget?.config?.dataSource?.protocol || "MQTT")
// // // // // //   const [streamUrl, setStreamUrl] = useState(widget?.config?.dataSource?.streamUrl || "")
// // // // // //   const isMobile = useMediaQuery("(max-width: 768px)")

// // // // // //   // Keep outputs/telemetry for logic and MQTT discovery
// // // // // //   const [baseOutputs, setBaseOutputs] = useState([])
// // // // // //   const [baseTelemetry, setBaseTelemetry] = useState([])

// // // // // //   // ----------- Handler Functions (NO ESLINT ERRORS) -----------------
// // // // // //   const handleDataSourceChange = (value) => {
// // // // // //     setSelectedDataSource(value)
// // // // // //     form.setFieldsValue({ deviceId: null, telemetry: [] })
// // // // // //     setSelectedDeviceId(null)
// // // // // //     setSelectedDataKeys([])
// // // // // //     setBaseOutputs([])
// // // // // //     setBaseTelemetry([])
// // // // // //     setAvailableDataKeys([])
// // // // // //     setProtocol("MQTT")
// // // // // //     setStreamUrl("")
// // // // // //   }

// // // // // //   const handleDeviceChange = (value) => {
// // // // // //     setSelectedDeviceId(value)
// // // // // //     form.setFieldsValue({ telemetry: [] })
// // // // // //     setSelectedDataKeys([])
// // // // // //     setBaseOutputs([])
// // // // // //     setBaseTelemetry([])
// // // // // //     setAvailableDataKeys([])
// // // // // //   }

// // // // // //   const handleDataKeysChange = (values) => setSelectedDataKeys(values)

// // // // // //   // ----------- Effect: Reset modal state on open/change ---------------
// // // // // //   useEffect(() => {
// // // // // //     if (visible && widget) {
// // // // // //       form.setFieldsValue({
// // // // // //         title: widget.title || "",
// // // // // //         dataSource: widget.config?.dataSource?.type || "device",
// // // // // //         deviceId: widget.config?.dataSource?.deviceId || null,
// // // // // //         telemetry: widget.config?.dataSource?.telemetry || [],
// // // // // //         ...widget.config,
// // // // // //       })
// // // // // //       setActiveTab("general")
// // // // // //       setSelectedDataSource(widget.config?.dataSource?.type || "device")
// // // // // //       setSelectedDeviceId(widget.config?.dataSource?.deviceId || null)
// // // // // //       setSelectedDataKeys(widget?.config?.dataSource?.telemetry || [])
// // // // // //       setBaseOutputs([])
// // // // // //       setBaseTelemetry([])
// // // // // //       setAvailableDataKeys([])
// // // // // //       setProtocol(widget?.config?.dataSource?.protocol || "MQTT")
// // // // // //       setStreamUrl(widget?.config?.dataSource?.streamUrl || "")
// // // // // //     }
// // // // // //   }, [visible, widget, form])

// // // // // //   // ----------- Effect: Fetch devices for dropdown ---------------------
// // // // // //   useEffect(() => {
// // // // // //     if (visible && selectedDataSource === "device" && tenantId) {
// // // // // //       setLoadingDevices(true)
// // // // // //       listDevices({ tenantId, page: 0, size: 100 })
// // // // // //         .then((data) => {
// // // // // //           const mapped = (data.content || []).map(d => ({
// // // // // //             ...d,
// // // // // //             id: d.deviceId,
// // // // // //             name: d.deviceName,
// // // // // //             profile: d.profile,
// // // // // //           }))
// // // // // //           setDeviceList(mapped)
// // // // // //         })
// // // // // //         .catch((e) => {
// // // // // //           setDeviceList([])
// // // // // //           message.error(e.message || "Failed to load devices")
// // // // // //         })
// // // // // //         .finally(() => setLoadingDevices(false))
// // // // // //     } else if (selectedDataSource !== "device") {
// // // // // //       setDeviceList([])
// // // // // //       setSelectedDeviceId(null)
// // // // // //       setBaseOutputs([])
// // // // // //       setBaseTelemetry([])
// // // // // //       setAvailableDataKeys([])
// // // // // //       setProtocol("MQTT")
// // // // // //       setStreamUrl("")
// // // // // //     }
// // // // // //   }, [selectedDataSource, visible, tenantId])

// // // // // //   // ----------- Effect: Fetch device profile + topic/outputs/telemetry/protocol/url -------
// // // // // //   useEffect(() => {
// // // // // //     if (visible && selectedDeviceId) {
// // // // // //       setLoadingProfile(true)
// // // // // //       getDeviceById(selectedDeviceId, { withProfile: true })
// // // // // //         .then((data) => {
// // // // // //           const profile =
// // // // // //             data.profile ||
// // // // // //             data.device?.profile ||
// // // // // //             data.device?.deviceProfile || {}

// // // // // //           const outputs = extractStreamOutputs(profile)
// // // // // //           const telemetry = extractTelemetryInputs(profile)
// // // // // //           setBaseOutputs(outputs)
// // // // // //           setBaseTelemetry(telemetry)

// // // // // //           // MQTT topic (for preview)
// // // // // //           let meta = profile?.metadata || {}
// // // // // //           const metaTopic = meta.mqtt_topic
// // // // // //           // --- MODIFIED HERE ---
// // // // // //           // If metaTopic and selectedDeviceId are present, use topic:<metaTopic>/<deviceID>/up/data
// // // // // //           setMqttTopic(
// // // // // //             metaTopic && selectedDeviceId
// // // // // //               ? `${metaTopic}/${selectedDeviceId}/up/data`
// // // // // //               : ""
// // // // // //           )

// // // // // //           // Protocol/URL detection for display
// // // // // //           let streamInfo = outputs[0]
// // // // // //           let detectedProtocol = streamInfo?.type || (profile?.protocol || "MQTT").toUpperCase()
// // // // // //           let detectedStreamUrl = streamInfo?.value || ""
// // // // // //           setProtocol(detectedProtocol)
// // // // // //           setStreamUrl(detectedStreamUrl)

// // // // // //           // Compose keys for select
// // // // // //           if (outputs.length || telemetry.length) {
// // // // // //             setAvailableDataKeys([
// // // // // //               ...outputs,
// // // // // //               ...(telemetry.length ? [{ label: "--- Telemetry ---", value: "__sep__", disabled: true }] : []),
// // // // // //               ...telemetry,
// // // // // //             ])
// // // // // //           } else {
// // // // // //             setAvailableDataKeys([])
// // // // // //           }
// // // // // //         })
// // // // // //         .catch((e) => {
// // // // // //           setBaseOutputs([])
// // // // // //           setBaseTelemetry([])
// // // // // //           setAvailableDataKeys([])
// // // // // //           setMqttTopic("")
// // // // // //           setProtocol("MQTT")
// // // // // //           setStreamUrl("")
// // // // // //           message.error(e.message || "Failed to fetch device telemetry info")
// // // // // //         })
// // // // // //         .finally(() => setLoadingProfile(false))
// // // // // //     } else {
// // // // // //       setBaseOutputs([])
// // // // // //       setBaseTelemetry([])
// // // // // //       setAvailableDataKeys([])
// // // // // //       setMqttTopic("")
// // // // // //       setProtocol("MQTT")
// // // // // //       setStreamUrl("")
// // // // // //     }
// // // // // //   }, [selectedDeviceId, visible])

// // // // // //   // ----------- MQTT telemetry discovery (append discovered telemetry keys) -------------
// // // // // //   const handlePreviewKeys = useCallback((data) => {
// // // // // //     if (typeof data === "object" && data !== null) {
// // // // // //       let baseTelemetryKeys = new Set(baseTelemetry.map(k => k.value))
// // // // // //       let newKeys = Object.keys(data).filter(
// // // // // //         key =>
// // // // // //           key !== "__sep__" &&
// // // // // //           !baseTelemetryKeys.has(key) &&
// // // // // //           !availableDataKeys.find(opt => opt.value === key)
// // // // // //       )
// // // // // //       if (newKeys.length) {
// // // // // //         const newTelemetryOptions = newKeys.map(key => ({
// // // // // //           label: `${key.charAt(0).toUpperCase() + key.slice(1)} (Discovered)`,
// // // // // //           value: key,
// // // // // //           type: typeof data[key],
// // // // // //           kind: "telemetry",
// // // // // //           raw: { key },
// // // // // //         }))
// // // // // //         setAvailableDataKeys(prev => {
// // // // // //           let idx = prev.findIndex(opt => opt.value === "__sep__")
// // // // // //           if (idx === -1) return [...prev, ...newTelemetryOptions]
// // // // // //           let arr = [...prev]
// // // // // //           arr.splice(idx + 1, 0, ...newTelemetryOptions)
// // // // // //           return arr
// // // // // //         })
// // // // // //       }
// // // // // //     }
// // // // // //   }, [baseTelemetry, availableDataKeys])

// // // // // //   const [lastMqttData, mqttLog] = useMqttPreview(mqttTopic, visible, handlePreviewKeys)

// // // // // //   // ----------- Debug: baseOutputs used, to avoid no-unused-vars -----------
// // // // // //   useEffect(() => {
// // // // // //     if (baseOutputs.length) {
// // // // // //       // Uncomment for debug:
// // // // // //       // console.log("[WidgetConfigModal] Device outputs:", baseOutputs)
// // // // // //     }
// // // // // //   }, [baseOutputs])

// // // // // //   // ----------- Save Handler: only save what is selected ------------------
// // // // // //   const handleSave = () => {
// // // // // //     form.validateFields().then((values) => {
// // // // // //       const updatedWidget = {
// // // // // //         ...widget,
// // // // // //         title: values.title,
// // // // // //         config: {
// // // // // //           ...widget.config,
// // // // // //           title: values.title,
// // // // // //           dataSource: {
// // // // // //             type: values.dataSource,
// // // // // //             deviceId: values.deviceId,
// // // // // //             telemetry: values.telemetry,
// // // // // //             topic: mqttTopic,
// // // // // //             protocol,
// // // // // //             streamUrl,
// // // // // //           },
// // // // // //         },
// // // // // //       }
// // // // // //       if (values.dataSource === "device" && values.deviceId) {
// // // // // //         const selectedDevice = deviceList.find((d) => d.id === values.deviceId)
// // // // // //         updatedWidget.deviceId = values.deviceId
// // // // // //         updatedWidget.deviceName = selectedDevice?.name || "Unknown Device"
// // // // // //       }
// // // // // //       onSave(updatedWidget)
// // // // // //     })
// // // // // //   }

// // // // // //   // ----------- JSX -------------------------------------------------------
// // // // // //   return (
// // // // // //     <Modal
// // // // // //       title={`Configure Widget: ${widget?.title || ""}`}
// // // // // //       open={visible}
// // // // // //       onCancel={onCancel}
// // // // // //       width={isMobile ? "100%" : 800}
// // // // // //       className="widget-config-modal"
// // // // // //       footer={[
// // // // // //         <Button key="cancel" onClick={onCancel}>Cancel</Button>,
// // // // // //         <Button key="save" type="primary" onClick={handleSave}>Save</Button>,
// // // // // //       ]}
// // // // // //     >
// // // // // //       <Form form={form} layout="vertical">
// // // // // //         <Tabs activeKey={activeTab} onChange={setActiveTab}>
// // // // // //           <TabPane tab="General" key="general">
// // // // // //             <Form.Item
// // // // // //               name="title"
// // // // // //               label="Widget Title"
// // // // // //               rules={[{ required: true, message: "Please enter a title" }]}
// // // // // //             >
// // // // // //               <Input />
// // // // // //             </Form.Item>

// // // // // //             <Divider orientation="left">Data Source</Divider>
// // // // // //             <Form.Item name="dataSource" label="Data Source Type">
// // // // // //               <Select onChange={handleDataSourceChange} value={selectedDataSource}>
// // // // // //                 <Option value="device">Device</Option>
// // // // // //                 <Option value="asset">Asset</Option>
// // // // // //                 <Option value="entity">Entity</Option>
// // // // // //                 <Option value="static">Static Data</Option>
// // // // // //               </Select>
// // // // // //             </Form.Item>

// // // // // //             {selectedDataSource === "device" && (
// // // // // //               <>
// // // // // //                 <Form.Item
// // // // // //                   name="deviceId"
// // // // // //                   label="Device"
// // // // // //                   rules={[{ required: true, message: "Please select a device" }]}
// // // // // //                 >
// // // // // //                   <Select
// // // // // //                     onChange={handleDeviceChange}
// // // // // //                     placeholder={loadingDevices ? "Loading devices..." : "Select device"}
// // // // // //                     loading={loadingDevices}
// // // // // //                     showSearch
// // // // // //                     filterOption={(input, option) =>
// // // // // //                       option.children && option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
// // // // // //                     }
// // // // // //                     value={selectedDeviceId}
// // // // // //                     notFoundContent={loadingDevices ? <Spin size="small" /> : "No devices found"}
// // // // // //                   >
// // // // // //                     {(deviceList || []).map((device) => (
// // // // // //                       <Option key={device.id} value={device.id}>
// // // // // //                         {device.name}
// // // // // //                       </Option>
// // // // // //                     ))}
// // // // // //                   </Select>
// // // // // //                 </Form.Item>

// // // // // //                 {/* Show protocol/URL info */}
// // // // // //                 {selectedDeviceId && (
// // // // // //                   <Alert
// // // // // //                     message={`Detected Protocol: ${protocol}${streamUrl ? ` (${streamUrl})` : ""}`}
// // // // // //                     type={protocol && protocol !== "MQTT" ? "success" : "info"}
// // // // // //                     showIcon
// // // // // //                     style={{ marginBottom: 8 }}
// // // // // //                   />
// // // // // //                 )}

// // // // // //                 {selectedDeviceId && !mqttTopic && protocol === "MQTT" && (
// // // // // //                   <Alert
// // // // // //                     message="No MQTT topic found for this device. Please check device profile metadata."
// // // // // //                     type="warning"
// // // // // //                     showIcon
// // // // // //                   />
// // // // // //                 )}

// // // // // //                 {/* Show combined outputs + telemetry */}
// // // // // //                 {selectedDeviceId && !!availableDataKeys.length && (
// // // // // //                   <Form.Item
// // // // // //                     name="telemetry"
// // // // // //                     label="Streams / Data Keys"
// // // // // //                     rules={[{ required: true, message: "Please select at least one stream or data key" }]}
// // // // // //                   >
// // // // // //                     <Select
// // // // // //                       mode="multiple"
// // // // // //                       placeholder={loadingProfile ? "Loading outputs..." : "Select streams and/or telemetry"}
// // // // // //                       onChange={handleDataKeysChange}
// // // // // //                       optionLabelProp="label"
// // // // // //                       notFoundContent={loadingProfile ? <Spin size="small" /> : "No keys"}
// // // // // //                       value={selectedDataKeys}
// // // // // //                     >
// // // // // //                       {availableDataKeys.map((key) =>
// // // // // //                         key.disabled ? (
// // // // // //                           <Option key={key.value} value={key.value} disabled>
// // // // // //                             <span style={{ fontWeight: "bold", color: "#aaa" }}>{key.label}</span>
// // // // // //                           </Option>
// // // // // //                         ) : (
// // // // // //                           <Option key={key.value} value={key.value} label={key.label}>
// // // // // //                             <div style={{ display: "flex", justifyContent: "space-between" }}>
// // // // // //                               <span>{key.label}</span>
// // // // // //                               <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>{key.type}</span>
// // // // // //                             </div>
// // // // // //                           </Option>
// // // // // //                         )
// // // // // //                       )}
// // // // // //                     </Select>
// // // // // //                   </Form.Item>
// // // // // //                 )}

// // // // // //                 {selectedDeviceId && lastMqttData && (
// // // // // //                   <Alert
// // // // // //                     message="Last MQTT Data (debug)"
// // // // // //                     description={<pre style={{ fontSize: 12, margin: 0 }}>{JSON.stringify(lastMqttData, null, 2)}</pre>}
// // // // // //                     type="info"
// // // // // //                     showIcon
// // // // // //                   />
// // // // // //                 )}

// // // // // //                 {selectedDeviceId && (
// // // // // //                   <Button
// // // // // //                     size="small"
// // // // // //                     onClick={() => { /* If you want to clear log, manage in useMqttPreview */ }}
// // // // // //                     style={{ marginTop: 8, marginBottom: 8 }}
// // // // // //                   >
// // // // // //                     Clear MQTT Logs
// // // // // //                   </Button>
// // // // // //                 )}
// // // // // //                 {selectedDeviceId && mqttLog.length > 0 && (
// // // // // //                   <div style={{ maxHeight: 80, overflow: "auto", background: "#fafafa", fontSize: 12, marginBottom: 8, border: "1px solid #eee" }}>
// // // // // //                     {mqttLog.map((line, i) => <div key={i}>{line}</div>)}
// // // // // //                   </div>
// // // // // //                 )}
// // // // // //               </>
// // // // // //             )}

// // // // // //             {selectedDataSource === "static" && (
// // // // // //               <Form.Item name="staticData" label="Static Data">
// // // // // //                 <Input.TextArea rows={4} placeholder="Enter JSON data" />
// // // // // //               </Form.Item>
// // // // // //             )}
// // // // // //           </TabPane>

// // // // // //           <TabPane tab="Settings" key="settings">
// // // // // //             {/* Widget-specific config if any */}
// // // // // //           </TabPane>

// // // // // //           <TabPane tab="Advanced" key="advanced">
// // // // // //             <Form.Item name="refreshInterval" label="Refresh Interval (seconds)">
// // // // // //               <InputNumber min={1} max={3600} />
// // // // // //             </Form.Item>
// // // // // //             <Form.Item name="backgroundColor" label="Background Color">
// // // // // //               <Input type="color" />
// // // // // //             </Form.Item>
// // // // // //             <Form.Item name="titleColor" label="Title Color">
// // // // // //               <Input type="color" />
// // // // // //             </Form.Item>
// // // // // //             <Form.Item name="showTitle" label="Show Title" valuePropName="checked">
// // // // // //               <Switch />
// // // // // //             </Form.Item>
// // // // // //             <Form.Item name="dropShadow" label="Drop Shadow" valuePropName="checked">
// // // // // //               <Switch />
// // // // // //             </Form.Item>
// // // // // //             <Form.Item name="borderRadius" label="Border Radius (px)">
// // // // // //               <InputNumber min={0} max={24} />
// // // // // //             </Form.Item>
// // // // // //           </TabPane>
// // // // // //         </Tabs>
// // // // // //       </Form>
// // // // // //     </Modal>
// // // // // //   )
// // // // // // }
