"use client"

import { useState, useEffect } from "react"
import { Modal, Form, Input, Select, Tabs, Button, Space, Divider, Switch, InputNumber, Radio, Checkbox } from "antd"
import { useMediaQuery } from "../../hooks/useMediaQuery"

const { TabPane } = Tabs
const { Option } = Select

const WidgetConfigModal = ({ visible, onCancel, onSave, widget, devices = [] }) => {
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState("general")
  const [selectedDataSource, setSelectedDataSource] = useState("device")
  const [selectedDeviceId, setSelectedDeviceId] = useState(null)
  const [availableDataKeys, setAvailableDataKeys] = useState([])
  const [selectedDataKeys, setSelectedDataKeys] = useState([])
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Initialize form with widget data when modal opens
  useEffect(() => {
    if (visible && widget) {
      // Set form values based on widget config
      form.setFieldsValue({
        title: widget.title || "",
        dataSource: widget.config?.dataSource?.type || "device",
        deviceId: widget.config?.dataSource?.deviceId || null,
        dataKeys: widget.config?.dataSource?.dataKeys || [],
        ...widget.config,
      })

      // Set state variables
      setSelectedDataSource(widget.config?.dataSource?.type || "device")
      setSelectedDeviceId(widget.config?.dataSource?.deviceId || null)
      setSelectedDataKeys(widget.config?.dataSource?.dataKeys || [])

      // Load available data keys for the selected device
      if (widget.config?.dataSource?.deviceId) {
        loadDataKeysForDevice(widget.config.dataSource.deviceId)
      }
    }
  }, [visible, widget, form])

  // Load data keys when device selection changes
  useEffect(() => {
    if (selectedDeviceId) {
      loadDataKeysForDevice(selectedDeviceId)
    }
  }, [selectedDeviceId])

  // Mock function to load data keys for a device
  const loadDataKeysForDevice = (deviceId) => {
    // In a real app, you would fetch this from an API
    // For now, we'll use mock data
    const mockDataKeys = {
      device1: [
        { label: "Temperature", value: "temperature", type: "timeseries" },
        { label: "Humidity", value: "humidity", type: "timeseries" },
        { label: "Battery Level", value: "batteryLevel", type: "timeseries" },
        { label: "Signal Strength", value: "signalStrength", type: "timeseries" },
        { label: "Status", value: "status", type: "attribute" },
      ],
      device2: [
        { label: "Pressure", value: "pressure", type: "timeseries" },
        { label: "Flow Rate", value: "flowRate", type: "timeseries" },
        { label: "Valve Position", value: "valvePosition", type: "timeseries" },
        { label: "Status", value: "status", type: "attribute" },
      ],
      device3: [
        { label: "Power", value: "power", type: "timeseries" },
        { label: "Energy", value: "energy", type: "timeseries" },
        { label: "Voltage", value: "voltage", type: "timeseries" },
        { label: "Current", value: "current", type: "timeseries" },
        { label: "Status", value: "status", type: "attribute" },
      ],
    }

    setAvailableDataKeys(mockDataKeys[deviceId] || [])
  }

  const handleDataSourceChange = (value) => {
    setSelectedDataSource(value)
    form.setFieldsValue({ deviceId: null, dataKeys: [] })
    setSelectedDeviceId(null)
    setSelectedDataKeys([])
  }

  const handleDeviceChange = (value) => {
    setSelectedDeviceId(value)
    form.setFieldsValue({ dataKeys: [] })
    setSelectedDataKeys([])
  }

  const handleDataKeysChange = (values) => {
    setSelectedDataKeys(values)
  }

  const handleSave = () => {
    form.validateFields().then((values) => {
      // Prepare the updated widget configuration
      const updatedWidget = {
        ...widget,
        title: values.title,
        config: {
          ...widget.config,
          title: values.title,
          dataSource: {
            type: values.dataSource,
            deviceId: values.deviceId,
            dataKeys: values.dataKeys,
          },
        },
      }

      // If it's a device-specific widget, add device info
      if (values.dataSource === "device" && values.deviceId) {
        const selectedDevice = devices.find((d) => d.id === values.deviceId)
        updatedWidget.deviceId = values.deviceId
        updatedWidget.deviceName = selectedDevice?.name || "Unknown Device"
      }

      onSave(updatedWidget)
    })
  }

  // Render different configuration options based on widget type
  const renderWidgetSpecificConfig = () => {
    if (!widget) return null

    switch (widget.type) {
      case "line-chart":
      case "bar-chart":
      case "time-series-chart":
        return (
          <>
            <Form.Item name="showLegend" label="Show Legend" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="showPoints" label="Show Points" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="height" label="Chart Height (px)">
              <InputNumber min={100} max={1000} />
            </Form.Item>
            <Form.Item name="yAxisLabel" label="Y-Axis Label">
              <Input />
            </Form.Item>
            <Form.Item name="xAxisLabel" label="X-Axis Label">
              <Input />
            </Form.Item>
          </>
        )

      case "gauge":
      case "radial-gauge":
        return (
          <>
            <Form.Item name="min" label="Minimum Value">
              <InputNumber />
            </Form.Item>
            <Form.Item name="max" label="Maximum Value">
              <InputNumber />
            </Form.Item>
            <Form.Item name="units" label="Units">
              <Input />
            </Form.Item>
            <Form.Item name="colorRanges" label="Color Ranges">
              <Checkbox.Group>
                <Checkbox value="low">Low (Red)</Checkbox>
                <Checkbox value="medium">Medium (Yellow)</Checkbox>
                <Checkbox value="high">High (Green)</Checkbox>
              </Checkbox.Group>
            </Form.Item>
          </>
        )

      case "status-card":
        return (
          <>
            <Form.Item name="showLastUpdateTime" label="Show Last Update Time" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="statusMapping" label="Status Mapping">
              <Radio.Group>
                <Space direction="vertical">
                  <Radio value="default">Default (Online/Offline)</Radio>
                  <Radio value="custom">Custom</Radio>
                </Space>
              </Radio.Group>
            </Form.Item>
          </>
        )

      case "value-card":
        return (
          <>
            <Form.Item name="units" label="Units">
              <Input />
            </Form.Item>
            <Form.Item name="decimals" label="Decimal Places">
              <InputNumber min={0} max={5} />
            </Form.Item>
            <Form.Item name="showTrend" label="Show Trend" valuePropName="checked">
              <Switch />
            </Form.Item>
          </>
        )

      case "battery-level":
      case "signal-strength":
      case "progress-bar":
        return (
          <>
            <Form.Item name="showValue" label="Show Value" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="colorRanges" label="Color Ranges">
              <Checkbox.Group>
                <Checkbox value="low">Low (Red)</Checkbox>
                <Checkbox value="medium">Medium (Yellow)</Checkbox>
                <Checkbox value="high">High (Green)</Checkbox>
              </Checkbox.Group>
            </Form.Item>
          </>
        )

      default:
        return null
    }
  }

  return (
    <Modal
      title={`Configure Widget: ${widget?.title || ""}`}
      open={visible}
      onCancel={onCancel}
      width={isMobile ? "100%" : 800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          Save
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="General" key="general">
            <Form.Item name="title" label="Widget Title" rules={[{ required: true, message: "Please enter a title" }]}>
              <Input />
            </Form.Item>

            <Divider orientation="left">Data Source</Divider>

            <Form.Item name="dataSource" label="Data Source Type">
              <Select onChange={handleDataSourceChange}>
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
                  <Select onChange={handleDeviceChange} placeholder="Select device">
                    {devices.map((device) => (
                      <Option key={device.id} value={device.id}>
                        {device.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {selectedDeviceId && (
                  <Form.Item
                    name="dataKeys"
                    label="Data Keys"
                    rules={[{ required: true, message: "Please select at least one data key" }]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="Select data keys"
                      onChange={handleDataKeysChange}
                      optionLabelProp="label"
                    >
                      {availableDataKeys.map((key) => (
                        <Option key={key.value} value={key.value} label={key.label}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>{key.label}</span>
                            <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>{key.type}</span>
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
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
            {renderWidgetSpecificConfig()}
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
              <Switch />
            </Form.Item>

            <Form.Item name="dropShadow" label="Drop Shadow" valuePropName="checked">
              <Switch />
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
