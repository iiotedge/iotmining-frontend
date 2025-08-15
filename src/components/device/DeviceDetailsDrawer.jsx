// src/components/device/DeviceDetailsDrawer.jsx
"use client"

import { useState, useEffect } from "react"
import {
  Drawer,
  Tabs,
  Button,
  Space,
  Typography,
  Form,
  Input,
  Select,
  Checkbox,
  Divider,
  Table,
  Tag,
  Radio,
  Card,
  Switch,
} from "antd"
import {
  QuestionCircleOutlined,
  EditOutlined,
  CopyOutlined,
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons"
import { useMqttPreview } from "../../hooks/useMqttPreview"

const DeviceDetailsDrawer = ({ visible, onClose, device }) => {
  // UI State
  const [attributeScope, setAttributeScope] = useState("client")
  const [eventType, setEventType] = useState("Error")
  const [alarmFilter, setAlarmFilter] = useState("active")
  const [activeTab, setActiveTab] = useState("details")
  const [showTelemetryJson, setShowTelemetryJson] = useState(false)

  // For Telemetry Table
  const [telemetryRows, setTelemetryRows] = useState([])
  const [telemetryRaw, setTelemetryRaw] = useState(null)

  // Prepare attribute rows from device.attributes object
  const attributeRows = device?.attributes
    ? Object.entries(device.attributes).map(([key, value], idx) => ({
        key,
        lastUpdateTime: device.updatedAt ? new Date(device.updatedAt).toLocaleString() : "-",
        value,
      }))
    : []

  // Columns
  const attributeColumns = [
    { title: "Last update time", dataIndex: "lastUpdateTime", width: "200px" },
    { title: "Key", dataIndex: "key", sorter: true },
    { title: "Value", dataIndex: "value" },
  ]
  const telemetryColumns = [
    { title: "Last update time", dataIndex: "lastUpdateTime", width: "200px" },
    { title: "Key", dataIndex: "key", sorter: true },
    { title: "Value", dataIndex: "value" },
  ]
  const alarmColumns = [
    { title: "Created time", dataIndex: "createdTime", sorter: true },
    { title: "Originator", dataIndex: "originator" },
    { title: "Type", dataIndex: "type" },
    { title: "Severity", dataIndex: "severity", render: (severity) => <Tag color={severity === "Critical" ? "red" : "orange"}>{severity}</Tag> },
    { title: "Assignee", dataIndex: "assignee" },
    { title: "Status", dataIndex: "status", render: (status) => <Tag color={status === "Active" ? "red" : "green"}>{status}</Tag> },
    { title: "Details", dataIndex: "details", render: () => <Button type="text">...</Button> },
  ]
  const eventColumns = [
    { title: "Event time", dataIndex: "eventTime", sorter: true },
    { title: "Server", dataIndex: "server" },
    { title: "Method", dataIndex: "method" },
    { title: "Error", dataIndex: "error" },
  ]
  const relationColumns = [
    { title: "Type", dataIndex: "type", sorter: true },
    { title: "To entity type", dataIndex: "toEntityType" },
    { title: "To entity name", dataIndex: "toEntityName" },
  ]
  const auditColumns = [
    { title: "Timestamp", dataIndex: "timestamp", sorter: true },
    { title: "User", dataIndex: "user" },
    { title: "Type", dataIndex: "type" },
    { title: "Status", dataIndex: "status", render: (status) => <Tag color={status === "Success" ? "green" : "red"}>{status}</Tag> },
    { title: "Details", dataIndex: "details", render: () => <Button type="text">...</Button> },
  ]
  const auditData = [
    { key: "1", timestamp: "2025-03-05 13:18:42", user: "santoshgndp@gmail.com", type: "Assigned to Customer", status: "Success" },
  ]

  // --- MQTT: Build topic for preview ---
  const topic = device?.profile?.metadata?.mqtt_topic
    ? `${device.profile.metadata.mqtt_topic}/up/data`
    : null

  // --- Use shared preview hook (only when drawer, tab, topic valid) ---
  const [lastMqttData, mqttLog] = useMqttPreview(
    topic,
    !!(visible && activeTab === "telemetry" && topic)
  )

  // Reset table/JSON on device change or tab change or drawer close/open
  useEffect(() => {
    setTelemetryRows([])
    setTelemetryRaw(null)
  }, [device?.deviceId, topic, visible, activeTab])

  // Patch new data from hook into state for table/json
  useEffect(() => {
    if (lastMqttData && typeof lastMqttData === "object") {
      setTelemetryRaw(lastMqttData)
      setTelemetryRows(
        Object.keys(lastMqttData).map((key) => ({
          key,
          lastUpdateTime: new Date().toLocaleString(),
          value: String(lastMqttData[key]),
        }))
      )
    }
  }, [lastMqttData])

  if (!device) return null

  return (
    <Drawer
      title={
        <div className="device-details-header">
          <Typography.Title level={4}>{device.deviceName || device.name}</Typography.Title>
          <Typography.Text>Device details</Typography.Text>
          <Button type="text" icon={<QuestionCircleOutlined />} className="help-button" />
        </div>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={800}
      extra={
        <Button type="primary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="Details" key="details">
          {/* ... (unchanged details view) ... */}
          <div className="device-details-content">
            <div className="device-actions">
              <Space>
                <Button type="primary">Open details page</Button>
                <Button>Make device public</Button>
                <Button>Assign to customer</Button>
                <Button>Manage credentials</Button>
                <Button>Check connectivity</Button>
                <Button danger>Delete device</Button>
              </Space>
              <Divider />
              <Space>
                <Button icon={<CopyOutlined />}>Copy device Id</Button>
                <Button icon={<CopyOutlined />}>Copy access token</Button>
              </Space>
            </div>
            <Form layout="vertical" className="device-form">
              <Form.Item label="Name" required>
                <Input value={device.deviceName || device.name} readOnly />
              </Form.Item>
              <Form.Item label="Device profile">
                <div className="editable-field">
                  <span>{device.profile?.name || device.deviceProfile}</span>
                  <Button type="text" icon={<EditOutlined />} size="small" />
                </div>
              </Form.Item>
              <Form.Item label="Label">
                <div className="editable-field">
                  <span>{device.label || "No label"}</span>
                  <Button type="text" icon={<EditOutlined />} size="small" />
                </div>
              </Form.Item>
              <Form.Item label="Assigned firmware">
                <div className="empty-field">
                  <span>{device.firmware || "No firmware assigned"}</span>
                </div>
              </Form.Item>
              <Form.Item label="Assigned software">
                <div className="empty-field">
                  <span>{device.software || "No software assigned"}</span>
                </div>
              </Form.Item>
              <Form.Item>
                <Checkbox checked={device.isGateway} disabled>
                  Is gateway
                </Checkbox>
              </Form.Item>
              <Form.Item label="Description">
                <Input.TextArea rows={4} value={device.description || ""} placeholder="No description" readOnly />
              </Form.Item>
            </Form>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Attributes" key="attributes">
          <div className="attributes-content">
            <Space className="table-controls" style={{ marginBottom: 16 }}>
              <Select value={attributeScope} onChange={setAttributeScope} style={{ width: 200 }}>
                <Select.Option value="client">Client attributes</Select.Option>
                <Select.Option value="server">Server attributes</Select.Option>
                <Select.Option value="shared">Shared attributes</Select.Option>
              </Select>
              <Button icon={<SearchOutlined />} />
              <Button icon={<ReloadOutlined />} />
            </Space>
            <Table
              columns={attributeColumns}
              dataSource={attributeRows}
              pagination={{
                total: attributeRows.length,
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
              }}
            />
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Latest telemetry" key="telemetry">
          <div className="telemetry-content">
            <Space className="table-controls" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
              <span>
                <Button icon={<PlusOutlined />}>Add telemetry</Button>
                <Button icon={<SearchOutlined />} />
                <Button icon={<ReloadOutlined />} />
              </span>
              <span>
                <Switch
                  checked={showTelemetryJson}
                  onChange={setShowTelemetryJson}
                  checkedChildren="JSON"
                  unCheckedChildren="Table"
                  style={{ marginLeft: 8 }}
                />
                <span style={{ marginLeft: 8 }}>Raw view</span>
              </span>
            </Space>
            {!showTelemetryJson ? (
              <Table
                columns={telemetryColumns}
                dataSource={telemetryRows}
                pagination={{
                  total: telemetryRows.length,
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                }}
              />
            ) : (
              <Card style={{ marginTop: 16, background: "#191919", color: "#fff" }}>
                <pre style={{ color: "#66ffcc", fontSize: 15, marginBottom: 0 }}>
                  {telemetryRaw ? JSON.stringify(telemetryRaw, null, 2) : "// No telemetry yet"}
                </pre>
              </Card>
            )}
            {mqttLog.length > 0 && (
              <div style={{
                maxHeight: 100, overflow: "auto", background: "#fafafa", fontSize: 12,
                border: "1px solid #eee", marginTop: 8
              }}>
                {mqttLog.map((line, i) => <div key={i}>{line}</div>)}
              </div>
            )}
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Alarms" key="alarms">
          <div className="alarms-content">
            <Space className="table-controls" style={{ marginBottom: 16 }}>
              <Radio.Group value={alarmFilter} onChange={(e) => setAlarmFilter(e.target.value)}>
                <Radio.Button value="active">Filter: Active</Radio.Button>
              </Radio.Group>
              <Button>For all time</Button>
              <Button icon={<SearchOutlined />} />
              <Button icon={<ReloadOutlined />} />
            </Space>
            <Table
              columns={alarmColumns}
              dataSource={[]}
              pagination={{
                total: 0,
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
              }}
            />
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Events" key="events">
          <div className="events-content">
            <Space className="table-controls" style={{ marginBottom: 16 }}>
              <Select value={eventType} onChange={setEventType} style={{ width: 200 }}>
                <Select.Option value="Error">Error</Select.Option>
                <Select.Option value="Lifecycle">Lifecycle</Select.Option>
                <Select.Option value="Stats">Stats</Select.Option>
              </Select>
              <Button>last 15 minutes</Button>
              <Button icon={<SearchOutlined />} />
              <Button icon={<ReloadOutlined />} />
            </Space>
            <Table
              columns={eventColumns}
              dataSource={[]}
              pagination={{
                total: 0,
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
              }}
            />
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Relations" key="relations">
          <div className="relations-content">
            <Space className="table-controls" style={{ marginBottom: 16 }}>
              <Typography.Text>Direction</Typography.Text>
              <Select defaultValue="from" style={{ width: 120 }}>
                <Select.Option value="from">From</Select.Option>
                <Select.Option value="to">To</Select.Option>
              </Select>
              <Button icon={<PlusOutlined />} />
              <Button icon={<SearchOutlined />} />
              <Button icon={<ReloadOutlined />} />
            </Space>
            <Table
              columns={relationColumns}
              dataSource={[]}
              pagination={{
                total: 0,
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
              }}
            />
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Audit logs" key="audit">
          <div className="audit-content">
            <Space className="table-controls" style={{ marginBottom: 16 }}>
              <Button>last day</Button>
              <Button icon={<SearchOutlined />} />
              <Button icon={<ReloadOutlined />} />
            </Space>
            <Table
              columns={auditColumns}
              dataSource={auditData}
              pagination={{
                total: auditData.length,
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
              }}
            />
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Version control" key="version">
          <div className="version-control-content">
            <Card title="Repository settings" extra={<QuestionCircleOutlined />}>
              <Form layout="vertical">
                <Form.Item label="Repository URL" required tooltip="The URL of your Git repository">
                  <Input placeholder="Enter repository URL" />
                </Form.Item>
                <Form.Item label="Default branch name">
                  <Input defaultValue="main" />
                </Form.Item>
                <Form.Item>
                  <Checkbox>Read-only</Checkbox>
                </Form.Item>
                <Form.Item>
                  <Checkbox>Show merge commits</Checkbox>
                </Form.Item>
                <Typography.Title level={5}>Authentication settings</Typography.Title>
                <Form.Item label="Authentication method" required>
                  <Select defaultValue="password">
                    <Select.Option value="password">Password / access token</Select.Option>
                    <Select.Option value="ssh">SSH key</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label="Username">
                  <Input />
                </Form.Item>
                <Form.Item label="Password / access token">
                  <Input.Password
                    iconRender={(visible) => (visible ? <EyeInvisibleOutlined /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>
                <Typography.Text type="secondary">
                  GitHub users must use access tokens with write permissions to the repository.
                </Typography.Text>
                <div style={{ marginTop: 24 }}>
                  <Space>
                    <Button>Check access</Button>
                    <Button type="primary">Save</Button>
                  </Space>
                </div>
              </Form>
            </Card>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </Drawer>
  )
}

export default DeviceDetailsDrawer

// "use client"

// import { useEffect, useRef, useState } from "react"
// import { connectAndSubscribe, disconnect } from "../../services/mqttClient"
// import {
//   Drawer,
//   Tabs,
//   Button,
//   Space,
//   Typography,
//   Form,
//   Input,
//   Select,
//   Checkbox,
//   Divider,
//   Table,
//   Tag,
//   Radio,
//   Card,
//   Switch,
// } from "antd"
// import {
//   QuestionCircleOutlined,
//   EditOutlined,
//   CopyOutlined,
//   SearchOutlined,
//   ReloadOutlined,
//   PlusOutlined,
//   EyeInvisibleOutlined,
// } from "@ant-design/icons"

// const DeviceDetailsDrawer = ({ visible, onClose, device }) => {
//   const [attributeScope, setAttributeScope] = useState("client")
//   const [eventType, setEventType] = useState("Error")
//   const [alarmFilter, setAlarmFilter] = useState("active")
//   const [activeTab, setActiveTab] = useState("details")
//   const [telemetry, setTelemetry] = useState([])
//   const [telemetryRaw, setTelemetryRaw] = useState(null)
//   const [showTelemetryJson, setShowTelemetryJson] = useState(false)
//   const mqttClientRef = useRef(null)

//   // Prepare attribute rows from device.attributes object
//   const attributeRows = device?.attributes
//     ? Object.entries(device.attributes).map(([key, value], idx) => ({
//         key,
//         lastUpdateTime: device.updatedAt ? new Date(device.updatedAt).toLocaleString() : "-",
//         value,
//       }))
//     : []

//   // Columns
//   const attributeColumns = [
//     { title: "Last update time", dataIndex: "lastUpdateTime", width: "200px" },
//     { title: "Key", dataIndex: "key", sorter: true },
//     { title: "Value", dataIndex: "value" },
//   ]
//   const telemetryColumns = [
//     { title: "Last update time", dataIndex: "lastUpdateTime", width: "200px" },
//     { title: "Key", dataIndex: "key", sorter: true },
//     { title: "Value", dataIndex: "value" },
//   ]
//   // Other columns unchanged...
//   const alarmColumns = [
//     { title: "Created time", dataIndex: "createdTime", sorter: true },
//     { title: "Originator", dataIndex: "originator" },
//     { title: "Type", dataIndex: "type" },
//     { title: "Severity", dataIndex: "severity", render: (severity) => <Tag color={severity === "Critical" ? "red" : "orange"}>{severity}</Tag> },
//     { title: "Assignee", dataIndex: "assignee" },
//     { title: "Status", dataIndex: "status", render: (status) => <Tag color={status === "Active" ? "red" : "green"}>{status}</Tag> },
//     { title: "Details", dataIndex: "details", render: () => <Button type="text">...</Button> },
//   ]
//   const eventColumns = [
//     { title: "Event time", dataIndex: "eventTime", sorter: true },
//     { title: "Server", dataIndex: "server" },
//     { title: "Method", dataIndex: "method" },
//     { title: "Error", dataIndex: "error" },
//   ]
//   const relationColumns = [
//     { title: "Type", dataIndex: "type", sorter: true },
//     { title: "To entity type", dataIndex: "toEntityType" },
//     { title: "To entity name", dataIndex: "toEntityName" },
//   ]
//   const auditColumns = [
//     { title: "Timestamp", dataIndex: "timestamp", sorter: true },
//     { title: "User", dataIndex: "user" },
//     { title: "Type", dataIndex: "type" },
//     { title: "Status", dataIndex: "status", render: (status) => <Tag color={status === "Success" ? "green" : "red"}>{status}</Tag> },
//     { title: "Details", dataIndex: "details", render: () => <Button type="text">...</Button> },
//   ]
//   const auditData = [
//     { key: "1", timestamp: "2025-03-05 13:18:42", user: "santoshgndp@gmail.com", type: "Assigned to Customer", status: "Success" },
//   ]

//   // Log device prop on each open/change
//   useEffect(() => {
//     if (visible && device) {
//       console.log("[Drawer Opened] Device:", device)
//     }
//     if (!visible) {
//       console.log("[Drawer Closed]")
//     }
//   }, [visible, device])

//   // Reset telemetry on device/profile change
//   useEffect(() => {
//     console.log("[Device/Profile Changed] Reset telemetry", device)
//     setTelemetry([])
//     setTelemetryRaw(null)
//     // eslint-disable-next-line
//   }, [device?.deviceId, device?.profile?.id])

//   // --- MQTT: subscribe/unsubscribe on telemetry tab activation ---
//   useEffect(() => {
//     if (
//       visible &&
//       activeTab === "telemetry" &&
//       device &&
//       device.profile &&
//       device.profile.metadata &&
//       device.profile.metadata.mqtt_topic
//     ) {
//       const topic = `${device.profile.metadata.mqtt_topic}/up/data`
//       console.log("[MQTT] Connecting to topic:", topic, "for device", device.deviceId)
//       mqttClientRef.current = connectAndSubscribe({
//         topic,
//         onMessage: (receivedTopic, data) => {
//           console.log("[MQTT] Message received on", receivedTopic, ":", data)
//           setTelemetryRaw(data)
//           if (typeof data === "object" && data !== null) {
//             const now = new Date()
//             const newRows = Object.keys(data).map((key) => ({
//               key,
//               lastUpdateTime: now.toLocaleString(),
//               value: String(data[key]),
//             }))
//             setTelemetry(newRows)
//           }
//         },
//         clientId: `device-details-${device.deviceId}`,
//       })
//       return () => {
//         console.log("[MQTT] Disconnecting from topic:", topic)
//         disconnect()
//       }
//     } else {
//       disconnect()
//     }
//     // eslint-disable-next-line
//   }, [
//     visible,
//     activeTab,
//     device?.profile?.metadata?.mqtt_topic,
//     device?.deviceId,
//   ])

//   // --- Cleanup on drawer close or device change ---
//   useEffect(() => {
//     if (!visible) {
//       setTelemetry([])
//       setTelemetryRaw(null)
//       disconnect()
//       console.log("[Drawer Closed] Telemetry cleared and MQTT disconnected")
//     }
//   }, [visible, device?.deviceId])

//   if (!device) return null

//   return (
//     <Drawer
//       title={
//         <div className="device-details-header">
//           <Typography.Title level={4}>{device.deviceName || device.name}</Typography.Title>
//           <Typography.Text>Device details</Typography.Text>
//           <Button type="text" icon={<QuestionCircleOutlined />} className="help-button" />
//         </div>
//       }
//       placement="right"
//       onClose={onClose}
//       open={visible}
//       width={800}
//       extra={
//         <Button type="primary" onClick={onClose}>
//           Close
//         </Button>
//       }
//     >
//       <Tabs activeKey={activeTab} onChange={setActiveTab}>
//         <Tabs.TabPane tab="Details" key="details">
//           {/* ... (unchanged details view) ... */}
//           <div className="device-details-content">
//             <div className="device-actions">
//               <Space>
//                 <Button type="primary">Open details page</Button>
//                 <Button>Make device public</Button>
//                 <Button>Assign to customer</Button>
//                 <Button>Manage credentials</Button>
//                 <Button>Check connectivity</Button>
//                 <Button danger>Delete device</Button>
//               </Space>
//               <Divider />
//               <Space>
//                 <Button icon={<CopyOutlined />}>Copy device Id</Button>
//                 <Button icon={<CopyOutlined />}>Copy access token</Button>
//               </Space>
//             </div>
//             <Form layout="vertical" className="device-form">
//               <Form.Item label="Name" required>
//                 <Input value={device.deviceName || device.name} readOnly />
//               </Form.Item>
//               <Form.Item label="Device profile">
//                 <div className="editable-field">
//                   <span>{device.profile?.name || device.deviceProfile}</span>
//                   <Button type="text" icon={<EditOutlined />} size="small" />
//                 </div>
//               </Form.Item>
//               <Form.Item label="Label">
//                 <div className="editable-field">
//                   <span>{device.label || "No label"}</span>
//                   <Button type="text" icon={<EditOutlined />} size="small" />
//                 </div>
//               </Form.Item>
//               <Form.Item label="Assigned firmware">
//                 <div className="empty-field">
//                   <span>{device.firmware || "No firmware assigned"}</span>
//                 </div>
//               </Form.Item>
//               <Form.Item label="Assigned software">
//                 <div className="empty-field">
//                   <span>{device.software || "No software assigned"}</span>
//                 </div>
//               </Form.Item>
//               <Form.Item>
//                 <Checkbox checked={device.isGateway} disabled>
//                   Is gateway
//                 </Checkbox>
//               </Form.Item>
//               <Form.Item label="Description">
//                 <Input.TextArea rows={4} value={device.description || ""} placeholder="No description" readOnly />
//               </Form.Item>
//             </Form>
//           </div>
//         </Tabs.TabPane>

//         <Tabs.TabPane tab="Attributes" key="attributes">
//           {/* ... (unchanged attributes view) ... */}
//           <div className="attributes-content">
//             <Space className="table-controls" style={{ marginBottom: 16 }}>
//               <Select value={attributeScope} onChange={setAttributeScope} style={{ width: 200 }}>
//                 <Select.Option value="client">Client attributes</Select.Option>
//                 <Select.Option value="server">Server attributes</Select.Option>
//                 <Select.Option value="shared">Shared attributes</Select.Option>
//               </Select>
//               <Button icon={<SearchOutlined />} />
//               <Button icon={<ReloadOutlined />} />
//             </Space>
//             <Table
//               columns={attributeColumns}
//               dataSource={attributeRows}
//               pagination={{
//                 total: attributeRows.length,
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
//               }}
//             />
//           </div>
//         </Tabs.TabPane>

//         <Tabs.TabPane tab="Latest telemetry" key="telemetry">
//           <div className="telemetry-content">
//             <Space className="table-controls" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
//               <span>
//                 <Button icon={<PlusOutlined />}>Add telemetry</Button>
//                 <Button icon={<SearchOutlined />} />
//                 <Button icon={<ReloadOutlined />} />
//               </span>
//               <span>
//                 <Switch
//                   checked={showTelemetryJson}
//                   onChange={setShowTelemetryJson}
//                   checkedChildren="JSON"
//                   unCheckedChildren="Table"
//                   style={{ marginLeft: 8 }}
//                 />
//                 <span style={{ marginLeft: 8 }}>Raw view</span>
//               </span>
//             </Space>
//             {!showTelemetryJson ? (
//               <Table
//                 columns={telemetryColumns}
//                 dataSource={telemetry}
//                 pagination={{
//                   total: telemetry.length,
//                   pageSize: 10,
//                   showSizeChanger: true,
//                   showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
//                 }}
//               />
//             ) : (
//               <Card style={{ marginTop: 16, background: "#191919", color: "#fff" }}>
//                 <pre style={{ color: "#66ffcc", fontSize: 15, marginBottom: 0 }}>
//                   {telemetryRaw ? JSON.stringify(telemetryRaw, null, 2) : "// No telemetry yet"}
//                 </pre>
//               </Card>
//             )}
//           </div>
//         </Tabs.TabPane>

//         {/* ... rest unchanged ... */}
//         <Tabs.TabPane tab="Alarms" key="alarms">
//           <div className="alarms-content">
//             <Space className="table-controls" style={{ marginBottom: 16 }}>
//               <Radio.Group value={alarmFilter} onChange={(e) => setAlarmFilter(e.target.value)}>
//                 <Radio.Button value="active">Filter: Active</Radio.Button>
//               </Radio.Group>
//               <Button>For all time</Button>
//               <Button icon={<SearchOutlined />} />
//               <Button icon={<ReloadOutlined />} />
//             </Space>
//             <Table
//               columns={alarmColumns}
//               dataSource={[]}
//               pagination={{
//                 total: 0,
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
//               }}
//             />
//           </div>
//         </Tabs.TabPane>

//         <Tabs.TabPane tab="Events" key="events">
//           <div className="events-content">
//             <Space className="table-controls" style={{ marginBottom: 16 }}>
//               <Select value={eventType} onChange={setEventType} style={{ width: 200 }}>
//                 <Select.Option value="Error">Error</Select.Option>
//                 <Select.Option value="Lifecycle">Lifecycle</Select.Option>
//                 <Select.Option value="Stats">Stats</Select.Option>
//               </Select>
//               <Button>last 15 minutes</Button>
//               <Button icon={<SearchOutlined />} />
//               <Button icon={<ReloadOutlined />} />
//             </Space>
//             <Table
//               columns={eventColumns}
//               dataSource={[]}
//               pagination={{
//                 total: 0,
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
//               }}
//             />
//           </div>
//         </Tabs.TabPane>

//         <Tabs.TabPane tab="Relations" key="relations">
//           <div className="relations-content">
//             <Space className="table-controls" style={{ marginBottom: 16 }}>
//               <Typography.Text>Direction</Typography.Text>
//               <Select defaultValue="from" style={{ width: 120 }}>
//                 <Select.Option value="from">From</Select.Option>
//                 <Select.Option value="to">To</Select.Option>
//               </Select>
//               <Button icon={<PlusOutlined />} />
//               <Button icon={<SearchOutlined />} />
//               <Button icon={<ReloadOutlined />} />
//             </Space>
//             <Table
//               columns={relationColumns}
//               dataSource={[]}
//               pagination={{
//                 total: 0,
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
//               }}
//             />
//           </div>
//         </Tabs.TabPane>

//         <Tabs.TabPane tab="Audit logs" key="audit">
//           <div className="audit-content">
//             <Space className="table-controls" style={{ marginBottom: 16 }}>
//               <Button>last day</Button>
//               <Button icon={<SearchOutlined />} />
//               <Button icon={<ReloadOutlined />} />
//             </Space>
//             <Table
//               columns={auditColumns}
//               dataSource={auditData}
//               pagination={{
//                 total: auditData.length,
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
//               }}
//             />
//           </div>
//         </Tabs.TabPane>

//         <Tabs.TabPane tab="Version control" key="version">
//           <div className="version-control-content">
//             <Card title="Repository settings" extra={<QuestionCircleOutlined />}>
//               <Form layout="vertical">
//                 <Form.Item label="Repository URL" required tooltip="The URL of your Git repository">
//                   <Input placeholder="Enter repository URL" />
//                 </Form.Item>
//                 <Form.Item label="Default branch name">
//                   <Input defaultValue="main" />
//                 </Form.Item>
//                 <Form.Item>
//                   <Checkbox>Read-only</Checkbox>
//                 </Form.Item>
//                 <Form.Item>
//                   <Checkbox>Show merge commits</Checkbox>
//                 </Form.Item>
//                 <Typography.Title level={5}>Authentication settings</Typography.Title>
//                 <Form.Item label="Authentication method" required>
//                   <Select defaultValue="password">
//                     <Select.Option value="password">Password / access token</Select.Option>
//                     <Select.Option value="ssh">SSH key</Select.Option>
//                   </Select>
//                 </Form.Item>
//                 <Form.Item label="Username">
//                   <Input />
//                 </Form.Item>
//                 <Form.Item label="Password / access token">
//                   <Input.Password
//                     iconRender={(visible) => (visible ? <EyeInvisibleOutlined /> : <EyeInvisibleOutlined />)}
//                   />
//                 </Form.Item>
//                 <Typography.Text type="secondary">
//                   GitHub users must use access tokens with write permissions to the repository.
//                 </Typography.Text>
//                 <div style={{ marginTop: 24 }}>
//                   <Space>
//                     <Button>Check access</Button>
//                     <Button type="primary">Save</Button>
//                   </Space>
//                 </div>
//               </Form>
//             </Card>
//           </div>
//         </Tabs.TabPane>
//       </Tabs>
//     </Drawer>
//   )
// }

// export default DeviceDetailsDrawer

// // "use client"

// // import { useEffect, useRef, useState } from "react"
// // import { connectAndSubscribe, disconnect } from "../../services/mqttClient"
// // import {
// //   Drawer,
// //   Tabs,
// //   Button,
// //   Space,
// //   Typography,
// //   Form,
// //   Input,
// //   Select,
// //   Checkbox,
// //   Divider,
// //   Table,
// //   Tag,
// //   Radio,
// //   Card,
// // } from "antd"
// // import {
// //   QuestionCircleOutlined,
// //   EditOutlined,
// //   CopyOutlined,
// //   SearchOutlined,
// //   ReloadOutlined,
// //   PlusOutlined,
// //   EyeInvisibleOutlined,
// // } from "@ant-design/icons"
// // import api from "../../services/api"

// // const DeviceDetailsDrawer = ({ visible, onClose, device }) => {
// //   const [attributeScope, setAttributeScope] = useState("client")
// //   const [eventType, setEventType] = useState("Error")
// //   const [timeRange, setTimeRange] = useState("last_day")
// //   const [alarmFilter, setAlarmFilter] = useState("active")
// //   const [form] = Form.useForm()
// //   const [attributes, setAttributes] = useState([])
// //   const [telemetry, setTelemetry] = useState([])
// //   const [activeTab, setActiveTab] = useState("details")
// //   const mqttClientRef = useRef(null)

// //   // Columns: unchanged...
// //   const attributeColumns = [
// //     { title: "Last update time", dataIndex: "lastUpdateTime", width: "200px" },
// //     { title: "Key", dataIndex: "key", sorter: true },
// //     { title: "Value", dataIndex: "value" },
// //   ]
// //   const telemetryColumns = [
// //     { title: "Last update time", dataIndex: "lastUpdateTime", width: "200px" },
// //     { title: "Key", dataIndex: "key", sorter: true },
// //     { title: "Value", dataIndex: "value" },
// //   ]
// //   // ... alarms, events, etc., columns remain untouched ...

// //   const alarmColumns = [
// //     { title: "Created time", dataIndex: "createdTime", sorter: true },
// //     { title: "Originator", dataIndex: "originator" },
// //     { title: "Type", dataIndex: "type" },
// //     { title: "Severity", dataIndex: "severity", render: (severity) => <Tag color={severity === "Critical" ? "red" : "orange"}>{severity}</Tag> },
// //     { title: "Assignee", dataIndex: "assignee" },
// //     { title: "Status", dataIndex: "status", render: (status) => <Tag color={status === "Active" ? "red" : "green"}>{status}</Tag> },
// //     { title: "Details", dataIndex: "details", render: () => <Button type="text">...</Button> },
// //   ]
// //   const eventColumns = [
// //     { title: "Event time", dataIndex: "eventTime", sorter: true },
// //     { title: "Server", dataIndex: "server" },
// //     { title: "Method", dataIndex: "method" },
// //     { title: "Error", dataIndex: "error" },
// //   ]
// //   const relationColumns = [
// //     { title: "Type", dataIndex: "type", sorter: true },
// //     { title: "To entity type", dataIndex: "toEntityType" },
// //     { title: "To entity name", dataIndex: "toEntityName" },
// //   ]
// //   const auditColumns = [
// //     { title: "Timestamp", dataIndex: "timestamp", sorter: true },
// //     { title: "User", dataIndex: "user" },
// //     { title: "Type", dataIndex: "type" },
// //     { title: "Status", dataIndex: "status", render: (status) => <Tag color={status === "Success" ? "green" : "red"}>{status}</Tag> },
// //     { title: "Details", dataIndex: "details", render: () => <Button type="text">...</Button> },
// //   ]
// //   const auditData = [
// //     { key: "1", timestamp: "2025-03-05 13:18:42", user: "santoshgndp@gmail.com", type: "Assigned to Customer", status: "Success" },
// //   ]

// //   // --- Fetch REST API data on device change ---
// //   useEffect(() => {
// //     const fetchDeviceDetails = async () => {
// //       if (!device) return
// //       try {
// //         const attrRes = await api.get(`/api/v1/devices/${device.key}/attributes`)
// //         const teleRes = await api.get(`/api/v1/devices/${device.key}/telemetry`)
// //         const attrMapped = (attrRes.data || []).map((item, idx) => ({
// //           key: idx,
// //           lastUpdateTime: new Date(item.ts).toLocaleString(),
// //           ...item,
// //         }))
// //         const teleMapped = (teleRes.data || []).map((item, idx) => ({
// //           key: idx,
// //           lastUpdateTime: new Date(item.ts).toLocaleString(),
// //           ...item,
// //         }))
// //         setAttributes(attrMapped)
// //         setTelemetry(teleMapped)
// //       } catch (error) {
// //         setAttributes([])
// //         setTelemetry([])
// //         console.error("Failed to fetch device details:", error)
// //       }
// //     }
// //     fetchDeviceDetails()
// //   }, [device])

// //   // --- MQTT: subscribe/unsubscribe on telemetry tab activation ---
// //   useEffect(() => {
// //     // Only subscribe on the "telemetry" tab, device present, and valid topic
// //     if (
// //       visible &&
// //       activeTab === "telemetry" &&
// //       device &&
// //       device.deviceProfile &&
// //       device.deviceProfile.metadata &&
// //       device.deviceProfile.metadata.mqtt_topic
// //     ) {
// //       const topic = `${device.deviceProfile.metadata.mqtt_topic}/up/`
// //       mqttClientRef.current = connectAndSubscribe({
// //         topic,
// //         onMessage: (receivedTopic, data) => {
// //           if (typeof data === "object" && data !== null) {
// //             const now = new Date()
// //             const newRows = Object.keys(data).map((key) => ({
// //               key,
// //               lastUpdateTime: now.toLocaleString(),
// //               value: String(data[key]),
// //             }))
// //             setTelemetry((prev) => {
// //               // Overwrite if key exists, else append (latest on top)
// //               const map = {}
// //               ;[...prev, ...newRows].forEach((row) => (map[row.key] = row))
// //               return Object.values(map)
// //             })
// //           }
// //         },
// //         clientId: `device-details-${device.key}`,
// //       })
// //       return () => {
// //         disconnect()
// //       }
// //     } else {
// //       // Not on telemetry tab, cleanup
// //       disconnect()
// //     }
// //     // eslint-disable-next-line
// //   }, [
// //     visible,
// //     activeTab,
// //     device?.deviceProfile?.metadata?.mqtt_topic,
// //     device?.key,
// //   ])

// //   // --- Cleanup on drawer close or device change ---
// //   useEffect(() => {
// //     if (!visible) {
// //       setTelemetry([])
// //       disconnect()
// //     }
// //   }, [visible, device?.key])

// //   if (!device) return null

// //   return (
// //     <Drawer
// //       title={
// //         <div className="device-details-header">
// //           <Typography.Title level={4}>{device.name}</Typography.Title>
// //           <Typography.Text>Device details</Typography.Text>
// //           <Button type="text" icon={<QuestionCircleOutlined />} className="help-button" />
// //         </div>
// //       }
// //       placement="right"
// //       onClose={onClose}
// //       open={visible}
// //       width={800}
// //       extra={
// //         <Button type="primary" onClick={onClose}>
// //           Close
// //         </Button>
// //       }
// //     >
// //       <Tabs activeKey={activeTab} onChange={setActiveTab}>
// //         <Tabs.TabPane tab="Details" key="details">
// //           <div className="device-details-content">
// //             <div className="device-actions">
// //               <Space>
// //                 <Button type="primary">Open details page</Button>
// //                 <Button>Make device public</Button>
// //                 <Button>Assign to customer</Button>
// //                 <Button>Manage credentials</Button>
// //                 <Button>Check connectivity</Button>
// //                 <Button danger>Delete device</Button>
// //               </Space>
// //               <Divider />
// //               <Space>
// //                 <Button icon={<CopyOutlined />}>Copy device Id</Button>
// //                 <Button icon={<CopyOutlined />}>Copy access token</Button>
// //               </Space>
// //             </div>

// //             <Form layout="vertical" className="device-form">
// //               <Form.Item label="Name" required>
// //                 <Input value={device.name} readOnly />
// //               </Form.Item>

// //               <Form.Item label="Device profile">
// //                 <div className="editable-field">
// //                   <span>{device.deviceProfile}</span>
// //                   <Button type="text" icon={<EditOutlined />} size="small" />
// //                 </div>
// //               </Form.Item>

// //               <Form.Item label="Label">
// //                 <div className="editable-field">
// //                   <span>{device.label || "No label"}</span>
// //                   <Button type="text" icon={<EditOutlined />} size="small" />
// //                 </div>
// //               </Form.Item>

// //               <Form.Item label="Assigned firmware">
// //                 <div className="empty-field">
// //                   <span>No firmware assigned</span>
// //                 </div>
// //               </Form.Item>

// //               <Form.Item label="Assigned software">
// //                 <div className="empty-field">
// //                   <span>No software assigned</span>
// //                 </div>
// //               </Form.Item>

// //               <Form.Item>
// //                 <Checkbox checked={device.isGateway} disabled>
// //                   Is gateway
// //                 </Checkbox>
// //               </Form.Item>

// //               <Form.Item label="Description">
// //                 <Input.TextArea rows={4} placeholder="No description" />
// //               </Form.Item>
// //             </Form>
// //           </div>
// //         </Tabs.TabPane>

// //         <Tabs.TabPane tab="Attributes" key="attributes">
// //           <div className="attributes-content">
// //             <Space className="table-controls" style={{ marginBottom: 16 }}>
// //               <Select value={attributeScope} onChange={setAttributeScope} style={{ width: 200 }}>
// //                 <Select.Option value="client">Client attributes</Select.Option>
// //                 <Select.Option value="server">Server attributes</Select.Option>
// //                 <Select.Option value="shared">Shared attributes</Select.Option>
// //               </Select>
// //               <Button icon={<SearchOutlined />} />
// //               <Button icon={<ReloadOutlined />} />
// //             </Space>
// //             <Table
// //               columns={attributeColumns}
// //               dataSource={attributes}
// //               pagination={{
// //                 total: attributes.length,
// //                 pageSize: 10,
// //                 showSizeChanger: true,
// //                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
// //               }}
// //             />
// //           </div>
// //         </Tabs.TabPane>

// //         <Tabs.TabPane tab="Latest telemetry" key="telemetry">
// //           <div className="telemetry-content">
// //             <Space className="table-controls" style={{ marginBottom: 16 }}>
// //               <Button icon={<PlusOutlined />}>Add telemetry</Button>
// //               <Button icon={<SearchOutlined />} />
// //               <Button icon={<ReloadOutlined />} />
// //             </Space>
// //             <Table
// //               columns={telemetryColumns}
// //               dataSource={telemetry}
// //               pagination={{
// //                 total: telemetry.length,
// //                 pageSize: 10,
// //                 showSizeChanger: true,
// //                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
// //               }}
// //             />
// //           </div>
// //         </Tabs.TabPane>

// //         <Tabs.TabPane tab="Alarms" key="alarms">
// //           <div className="alarms-content">
// //             <Space className="table-controls" style={{ marginBottom: 16 }}>
// //               <Radio.Group value={alarmFilter} onChange={(e) => setAlarmFilter(e.target.value)}>
// //                 <Radio.Button value="active">Filter: Active</Radio.Button>
// //               </Radio.Group>
// //               <Button>For all time</Button>
// //               <Button icon={<SearchOutlined />} />
// //               <Button icon={<ReloadOutlined />} />
// //             </Space>
// //             <Table
// //               columns={alarmColumns}
// //               dataSource={[]}
// //               pagination={{
// //                 total: 0,
// //                 pageSize: 10,
// //                 showSizeChanger: true,
// //                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
// //               }}
// //             />
// //           </div>
// //         </Tabs.TabPane>

// //         <Tabs.TabPane tab="Events" key="events">
// //           <div className="events-content">
// //             <Space className="table-controls" style={{ marginBottom: 16 }}>
// //               <Select value={eventType} onChange={setEventType} style={{ width: 200 }}>
// //                 <Select.Option value="Error">Error</Select.Option>
// //                 <Select.Option value="Lifecycle">Lifecycle</Select.Option>
// //                 <Select.Option value="Stats">Stats</Select.Option>
// //               </Select>
// //               <Button>last 15 minutes</Button>
// //               <Button icon={<SearchOutlined />} />
// //               <Button icon={<ReloadOutlined />} />
// //             </Space>
// //             <Table
// //               columns={eventColumns}
// //               dataSource={[]}
// //               pagination={{
// //                 total: 0,
// //                 pageSize: 10,
// //                 showSizeChanger: true,
// //                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
// //               }}
// //             />
// //           </div>
// //         </Tabs.TabPane>

// //         <Tabs.TabPane tab="Relations" key="relations">
// //           <div className="relations-content">
// //             <Space className="table-controls" style={{ marginBottom: 16 }}>
// //               <Typography.Text>Direction</Typography.Text>
// //               <Select defaultValue="from" style={{ width: 120 }}>
// //                 <Select.Option value="from">From</Select.Option>
// //                 <Select.Option value="to">To</Select.Option>
// //               </Select>
// //               <Button icon={<PlusOutlined />} />
// //               <Button icon={<SearchOutlined />} />
// //               <Button icon={<ReloadOutlined />} />
// //             </Space>
// //             <Table
// //               columns={relationColumns}
// //               dataSource={[]}
// //               pagination={{
// //                 total: 0,
// //                 pageSize: 10,
// //                 showSizeChanger: true,
// //                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
// //               }}
// //             />
// //           </div>
// //         </Tabs.TabPane>

// //         <Tabs.TabPane tab="Audit logs" key="audit">
// //           <div className="audit-content">
// //             <Space className="table-controls" style={{ marginBottom: 16 }}>
// //               <Button>last day</Button>
// //               <Button icon={<SearchOutlined />} />
// //               <Button icon={<ReloadOutlined />} />
// //             </Space>
// //             <Table
// //               columns={auditColumns}
// //               dataSource={auditData}
// //               pagination={{
// //                 total: auditData.length,
// //                 pageSize: 10,
// //                 showSizeChanger: true,
// //                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
// //               }}
// //             />
// //           </div>
// //         </Tabs.TabPane>

// //         <Tabs.TabPane tab="Version control" key="version">
// //           <div className="version-control-content">
// //             <Card title="Repository settings" extra={<QuestionCircleOutlined />}>
// //               <Form layout="vertical">
// //                 <Form.Item label="Repository URL" required tooltip="The URL of your Git repository">
// //                   <Input placeholder="Enter repository URL" />
// //                 </Form.Item>
// //                 <Form.Item label="Default branch name">
// //                   <Input defaultValue="main" />
// //                 </Form.Item>
// //                 <Form.Item>
// //                   <Checkbox>Read-only</Checkbox>
// //                 </Form.Item>
// //                 <Form.Item>
// //                   <Checkbox>Show merge commits</Checkbox>
// //                 </Form.Item>
// //                 <Typography.Title level={5}>Authentication settings</Typography.Title>
// //                 <Form.Item label="Authentication method" required>
// //                   <Select defaultValue="password">
// //                     <Select.Option value="password">Password / access token</Select.Option>
// //                     <Select.Option value="ssh">SSH key</Select.Option>
// //                   </Select>
// //                 </Form.Item>
// //                 <Form.Item label="Username">
// //                   <Input />
// //                 </Form.Item>
// //                 <Form.Item label="Password / access token">
// //                   <Input.Password
// //                     iconRender={(visible) => (visible ? <EyeInvisibleOutlined /> : <EyeInvisibleOutlined />)}
// //                   />
// //                 </Form.Item>
// //                 <Typography.Text type="secondary">
// //                   GitHub users must use access tokens with write permissions to the repository.
// //                 </Typography.Text>
// //                 <div style={{ marginTop: 24 }}>
// //                   <Space>
// //                     <Button>Check access</Button>
// //                     <Button type="primary">Save</Button>
// //                   </Space>
// //                 </div>
// //               </Form>
// //             </Card>
// //           </div>
// //         </Tabs.TabPane>
// //       </Tabs>
// //     </Drawer>
// //   )
// // }

// // export default DeviceDetailsDrawer

// // // "use client"

// // // import { useEffect, useRef, useState } from "react"
// // // import { connectAndSubscribe, disconnect } from "../../services/mqttClient"
// // // import {
// // //   Drawer,
// // //   Tabs,
// // //   Button,
// // //   Space,
// // //   Typography,
// // //   Form,
// // //   Input,
// // //   Select,
// // //   Checkbox,
// // //   Divider,
// // //   Table,
// // //   Tag,
// // //   Radio,
// // //   Card,
// // // } from "antd"
// // // import {
// // //   QuestionCircleOutlined,
// // //   EditOutlined,
// // //   CopyOutlined,
// // //   SearchOutlined,
// // //   ReloadOutlined,
// // //   PlusOutlined,
// // //   EyeInvisibleOutlined,
// // // } from "@ant-design/icons"
// // // import { useEffect } from "react"
// // // import api from "../../services/api"

// // // const DeviceDetailsDrawer = ({ visible, onClose, device }) => {
// // //   const [attributeScope, setAttributeScope] = useState("client")
// // //   const [eventType, setEventType] = useState("Error")
// // //   const [timeRange, setTimeRange] = useState("last_day")
// // //   const [alarmFilter, setAlarmFilter] = useState("active")
// // //   const [form] = Form.useForm()
// // //   const [attributes, setAttributes] = useState([]);
// // //   const [telemetry, setTelemetry] = useState([]);
  
// // //   // Attributes Tab columns
// // //   const attributeColumns = [
// // //     {
// // //       title: "Last update time",
// // //       dataIndex: "lastUpdateTime",
// // //       width: "200px",
// // //     },
// // //     {
// // //       title: "Key",
// // //       dataIndex: "key",
// // //       sorter: true,
// // //     },
// // //     {
// // //       title: "Value",
// // //       dataIndex: "value",
// // //     },
// // //   ]

// // //   // Telemetry Tab columns
// // //   const telemetryColumns = [
// // //     {
// // //       title: "Last update time",
// // //       dataIndex: "lastUpdateTime",
// // //       width: "200px",
// // //     },
// // //     {
// // //       title: "Key",
// // //       dataIndex: "key",
// // //       sorter: true,
// // //     },
// // //     {
// // //       title: "Value",
// // //       dataIndex: "value",
// // //     },
// // //   ]

// // //   // Alarms Tab columns
// // //   const alarmColumns = [
// // //     {
// // //       title: "Created time",
// // //       dataIndex: "createdTime",
// // //       sorter: true,
// // //     },
// // //     {
// // //       title: "Originator",
// // //       dataIndex: "originator",
// // //     },
// // //     {
// // //       title: "Type",
// // //       dataIndex: "type",
// // //     },
// // //     {
// // //       title: "Severity",
// // //       dataIndex: "severity",
// // //       render: (severity) => <Tag color={severity === "Critical" ? "red" : "orange"}>{severity}</Tag>,
// // //     },
// // //     {
// // //       title: "Assignee",
// // //       dataIndex: "assignee",
// // //     },
// // //     {
// // //       title: "Status",
// // //       dataIndex: "status",
// // //       render: (status) => <Tag color={status === "Active" ? "red" : "green"}>{status}</Tag>,
// // //     },
// // //     {
// // //       title: "Details",
// // //       dataIndex: "details",
// // //       render: () => <Button type="text">...</Button>,
// // //     },
// // //   ]

// // //   // Events Tab columns
// // //   const eventColumns = [
// // //     {
// // //       title: "Event time",
// // //       dataIndex: "eventTime",
// // //       sorter: true,
// // //     },
// // //     {
// // //       title: "Server",
// // //       dataIndex: "server",
// // //     },
// // //     {
// // //       title: "Method",
// // //       dataIndex: "method",
// // //     },
// // //     {
// // //       title: "Error",
// // //       dataIndex: "error",
// // //     },
// // //   ]

// // //   // Relations Tab columns
// // //   const relationColumns = [
// // //     {
// // //       title: "Type",
// // //       dataIndex: "type",
// // //       sorter: true,
// // //     },
// // //     {
// // //       title: "To entity type",
// // //       dataIndex: "toEntityType",
// // //     },
// // //     {
// // //       title: "To entity name",
// // //       dataIndex: "toEntityName",
// // //     },
// // //   ]

// // //   // Audit Logs Tab columns
// // //   const auditColumns = [
// // //     {
// // //       title: "Timestamp",
// // //       dataIndex: "timestamp",
// // //       sorter: true,
// // //     },
// // //     {
// // //       title: "User",
// // //       dataIndex: "user",
// // //     },
// // //     {
// // //       title: "Type",
// // //       dataIndex: "type",
// // //     },
// // //     {
// // //       title: "Status",
// // //       dataIndex: "status",
// // //       render: (status) => <Tag color={status === "Success" ? "green" : "red"}>{status}</Tag>,
// // //     },
// // //     {
// // //       title: "Details",
// // //       dataIndex: "details",
// // //       render: () => <Button type="text">...</Button>,
// // //     },
// // //   ]

// // //   // Sample telemetry data
// // //   const telemetryData = [
// // //     {
// // //       key: "1",
// // //       lastUpdateTime: "2025-03-04 12:30:22",
// // //       key: "temperature",
// // //       value: "28",
// // //     },
// // //   ]

// // //   // Sample audit data
// // //   const auditData = [
// // //     {
// // //       key: "1",
// // //       timestamp: "2025-03-05 13:18:42",
// // //       user: "santoshgndp@gmail.com",
// // //       type: "Assigned to Customer",
// // //       status: "Success",
// // //     },
// // //   ]

  

// // //   useEffect(() => {
// // //     const fetchDeviceDetails = async () => {
// // //       if (!device) return;
  
// // //       try {
// // //         // Replace with your actual API calls
// // //         const attrRes = await api.get(`/api/v1/devices/${device.key}/attributes`);
// // //         const teleRes = await api.get(`/api/v1/devices/${device.key}/telemetry`);
  
// // //         const attrMapped = (attrRes.data || []).map((item, idx) => ({
// // //           key: idx,
// // //           lastUpdateTime: new Date(item.ts).toLocaleString(),
// // //           ...item,
// // //         }));
// // //         const teleMapped = (teleRes.data || []).map((item, idx) => ({
// // //           key: idx,
// // //           lastUpdateTime: new Date(item.ts).toLocaleString(),
// // //           ...item,
// // //         }));
  
// // //         setAttributes(attrMapped);
// // //         setTelemetry(teleMapped);
// // //       } catch (error) {
// // //         console.error("Failed to fetch device details:", error);
// // //       }
// // //     };
  
// // //     fetchDeviceDetails();
// // //   }, [device]);

// // //   if (!device) return null
// // //   return (
// // //     <Drawer
// // //       title={
// // //         <div className="device-details-header">
// // //           <Typography.Title level={4}>{device.name}</Typography.Title>
// // //           <Typography.Text>Device details</Typography.Text>
// // //           <Button type="text" icon={<QuestionCircleOutlined />} className="help-button" />
// // //         </div>
// // //       }
// // //       placement="right"
// // //       onClose={onClose}
// // //       open={visible}
// // //       width={800}
// // //       extra={
// // //         <Button type="primary" onClick={onClose}>
// // //           Close
// // //         </Button>
// // //       }
// // //     >
// // //       <Tabs defaultActiveKey="details">
// // //         <Tabs.TabPane tab="Details" key="details">
// // //           <div className="device-details-content">
// // //             <div className="device-actions">
// // //               <Space>
// // //                 <Button type="primary">Open details page</Button>
// // //                 <Button>Make device public</Button>
// // //                 <Button>Assign to customer</Button>
// // //                 <Button>Manage credentials</Button>
// // //                 <Button>Check connectivity</Button>
// // //                 <Button danger>Delete device</Button>
// // //               </Space>
// // //               <Divider />
// // //               <Space>
// // //                 <Button icon={<CopyOutlined />}>Copy device Id</Button>
// // //                 <Button icon={<CopyOutlined />}>Copy access token</Button>
// // //               </Space>
// // //             </div>

// // //             <Form layout="vertical" className="device-form">
// // //               <Form.Item label="Name" required>
// // //                 <Input value={device.name} readOnly />
// // //               </Form.Item>

// // //               <Form.Item label="Device profile">
// // //                 <div className="editable-field">
// // //                   <span>{device.deviceProfile}</span>
// // //                   <Button type="text" icon={<EditOutlined />} size="small" />
// // //                 </div>
// // //               </Form.Item>

// // //               <Form.Item label="Label">
// // //                 <div className="editable-field">
// // //                   <span>{device.label || "No label"}</span>
// // //                   <Button type="text" icon={<EditOutlined />} size="small" />
// // //                 </div>
// // //               </Form.Item>

// // //               <Form.Item label="Assigned firmware">
// // //                 <div className="empty-field">
// // //                   <span>No firmware assigned</span>
// // //                 </div>
// // //               </Form.Item>

// // //               <Form.Item label="Assigned software">
// // //                 <div className="empty-field">
// // //                   <span>No software assigned</span>
// // //                 </div>
// // //               </Form.Item>

// // //               <Form.Item>
// // //                 <Checkbox checked={device.isGateway} disabled>
// // //                   Is gateway
// // //                 </Checkbox>
// // //               </Form.Item>

// // //               <Form.Item label="Description">
// // //                 <Input.TextArea rows={4} placeholder="No description" />
// // //               </Form.Item>
// // //             </Form>
// // //           </div>
// // //         </Tabs.TabPane>

// // //         <Tabs.TabPane tab="Attributes" key="attributes">
// // //           <div className="attributes-content">
// // //             <Space className="table-controls" style={{ marginBottom: 16 }}>
// // //               <Select value={attributeScope} onChange={setAttributeScope} style={{ width: 200 }}>
// // //                 <Select.Option value="client">Client attributes</Select.Option>
// // //                 <Select.Option value="server">Server attributes</Select.Option>
// // //                 <Select.Option value="shared">Shared attributes</Select.Option>
// // //               </Select>
// // //               <Button icon={<SearchOutlined />} />
// // //               <Button icon={<ReloadOutlined />} />
// // //             </Space>
// // //             <Table
// // //               columns={attributeColumns}
// // //               dataSource={attributes}
// // //               pagination={{
// // //                 total: 0,
// // //                 pageSize: 10,
// // //                 showSizeChanger: true,
// // //                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
// // //               }}
// // //             />
// // //           </div>
// // //         </Tabs.TabPane>

// // //         <Tabs.TabPane tab="Latest telemetry" key="telemetry">
// // //           <div className="telemetry-content">
// // //             <Space className="table-controls" style={{ marginBottom: 16 }}>
// // //               <Button icon={<PlusOutlined />}>Add telemetry</Button>
// // //               <Button icon={<SearchOutlined />} />
// // //               <Button icon={<ReloadOutlined />} />
// // //             </Space>
// // //             <Table
// // //               columns={telemetryColumns}
// // //               dataSource={telemetry}
// // //               pagination={{
// // //                 total: 1,
// // //                 pageSize: 10,
// // //                 showSizeChanger: true,
// // //                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
// // //               }}
// // //             />
// // //           </div>
// // //         </Tabs.TabPane>

// // //         <Tabs.TabPane tab="Alarms" key="alarms">
// // //           <div className="alarms-content">
// // //             <Space className="table-controls" style={{ marginBottom: 16 }}>
// // //               <Radio.Group value={alarmFilter} onChange={(e) => setAlarmFilter(e.target.value)}>
// // //                 <Radio.Button value="active">Filter: Active</Radio.Button>
// // //               </Radio.Group>
// // //               <Button>For all time</Button>
// // //               <Button icon={<SearchOutlined />} />
// // //               <Button icon={<ReloadOutlined />} />
// // //             </Space>
// // //             <Table
// // //               columns={alarmColumns}
// // //               dataSource={[]}
// // //               pagination={{
// // //                 total: 0,
// // //                 pageSize: 10,
// // //                 showSizeChanger: true,
// // //                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
// // //               }}
// // //             />
// // //           </div>
// // //         </Tabs.TabPane>

// // //         <Tabs.TabPane tab="Events" key="events">
// // //           <div className="events-content">
// // //             <Space className="table-controls" style={{ marginBottom: 16 }}>
// // //               <Select value={eventType} onChange={setEventType} style={{ width: 200 }}>
// // //                 <Select.Option value="Error">Error</Select.Option>
// // //                 <Select.Option value="Lifecycle">Lifecycle</Select.Option>
// // //                 <Select.Option value="Stats">Stats</Select.Option>
// // //               </Select>
// // //               <Button>last 15 minutes</Button>
// // //               <Button icon={<SearchOutlined />} />
// // //               <Button icon={<ReloadOutlined />} />
// // //             </Space>
// // //             <Table
// // //               columns={eventColumns}
// // //               dataSource={[]}
// // //               pagination={{
// // //                 total: 0,
// // //                 pageSize: 10,
// // //                 showSizeChanger: true,
// // //                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
// // //               }}
// // //             />
// // //           </div>
// // //         </Tabs.TabPane>

// // //         <Tabs.TabPane tab="Relations" key="relations">
// // //           <div className="relations-content">
// // //             <Space className="table-controls" style={{ marginBottom: 16 }}>
// // //               <Typography.Text>Direction</Typography.Text>
// // //               <Select defaultValue="from" style={{ width: 120 }}>
// // //                 <Select.Option value="from">From</Select.Option>
// // //                 <Select.Option value="to">To</Select.Option>
// // //               </Select>
// // //               <Button icon={<PlusOutlined />} />
// // //               <Button icon={<SearchOutlined />} />
// // //               <Button icon={<ReloadOutlined />} />
// // //             </Space>
// // //             <Table
// // //               columns={relationColumns}
// // //               dataSource={[]}
// // //               pagination={{
// // //                 total: 0,
// // //                 pageSize: 10,
// // //                 showSizeChanger: true,
// // //                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
// // //               }}
// // //             />
// // //           </div>
// // //         </Tabs.TabPane>

// // //         <Tabs.TabPane tab="Audit logs" key="audit">
// // //           <div className="audit-content">
// // //             <Space className="table-controls" style={{ marginBottom: 16 }}>
// // //               <Button>last day</Button>
// // //               <Button icon={<SearchOutlined />} />
// // //               <Button icon={<ReloadOutlined />} />
// // //             </Space>
// // //             <Table
// // //               columns={auditColumns}
// // //               dataSource={auditData}
// // //               pagination={{
// // //                 total: 1,
// // //                 pageSize: 10,
// // //                 showSizeChanger: true,
// // //                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
// // //               }}
// // //             />
// // //           </div>
// // //         </Tabs.TabPane>

// // //         <Tabs.TabPane tab="Version control" key="version">
// // //           <div className="version-control-content">
// // //             <Card title="Repository settings" extra={<QuestionCircleOutlined />}>
// // //               <Form layout="vertical">
// // //                 <Form.Item label="Repository URL" required tooltip="The URL of your Git repository">
// // //                   <Input placeholder="Enter repository URL" />
// // //                 </Form.Item>

// // //                 <Form.Item label="Default branch name">
// // //                   <Input defaultValue="main" />
// // //                 </Form.Item>

// // //                 <Form.Item>
// // //                   <Checkbox>Read-only</Checkbox>
// // //                 </Form.Item>

// // //                 <Form.Item>
// // //                   <Checkbox>Show merge commits</Checkbox>
// // //                 </Form.Item>

// // //                 <Typography.Title level={5}>Authentication settings</Typography.Title>

// // //                 <Form.Item label="Authentication method" required>
// // //                   <Select defaultValue="password">
// // //                     <Select.Option value="password">Password / access token</Select.Option>
// // //                     <Select.Option value="ssh">SSH key</Select.Option>
// // //                   </Select>
// // //                 </Form.Item>

// // //                 <Form.Item label="Username">
// // //                   <Input />
// // //                 </Form.Item>

// // //                 <Form.Item label="Password / access token">
// // //                   <Input.Password
// // //                     iconRender={(visible) => (visible ? <EyeInvisibleOutlined /> : <EyeInvisibleOutlined />)}
// // //                   />
// // //                 </Form.Item>

// // //                 <Typography.Text type="secondary">
// // //                   GitHub users must use access tokens with write permissions to the repository.
// // //                 </Typography.Text>

// // //                 <div style={{ marginTop: 24 }}>
// // //                   <Space>
// // //                     <Button>Check access</Button>
// // //                     <Button type="primary">Save</Button>
// // //                   </Space>
// // //                 </div>
// // //               </Form>
// // //             </Card>
// // //           </div>
// // //         </Tabs.TabPane>
// // //       </Tabs>
// // //     </Drawer>
// // //   )
// // // }

// // // export default DeviceDetailsDrawer

