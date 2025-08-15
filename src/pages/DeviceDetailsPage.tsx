// import type React from "react"
// import { Card, Tabs, Button, Space, Typography, Form, Input, Checkbox, Divider } from "antd"
// import { CloseOutlined, QuestionCircleOutlined, EditOutlined, CopyOutlined } from "@ant-design/icons"
// import { useNavigate } from "react-router-dom"

// const { TabPane } = Tabs

// const DeviceDetailsPage: React.FC = () => {
//   const navigate = useNavigate()

//   const handleClose = () => {
//     navigate("/devices")
//   }

//   return (
//     <div className="device-details-page">
//       <Card
//         title={
//           <div className="device-details-header">
//             <Typography.Title level={4}>Air Filter</Typography.Title>
//             <Typography.Text>Device details</Typography.Text>
//             <Button type="text" icon={<CloseOutlined />} onClick={handleClose} className="close-button" />
//           </div>
//         }
//         extra={<Button icon={<QuestionCircleOutlined />} type="text" />}
//         bordered={false}
//       >
//         <Tabs defaultActiveKey="details">
//           <TabPane tab="Details" key="details">
//             <div className="device-details-content">
//               <div className="device-actions">
//                 <Space>
//                   <Button type="primary">Open details page</Button>
//                   <Button>Make device public</Button>
//                   <Button>Assign to customer</Button>
//                   <Button>Manage credentials</Button>
//                   <Button>Check connectivity</Button>
//                   <Button danger>Delete device</Button>
//                 </Space>
//                 <Divider />
//                 <Space>
//                   <Button icon={<CopyOutlined />}>Copy device Id</Button>
//                   <Button icon={<CopyOutlined />}>Copy access token</Button>
//                 </Space>
//               </div>

//               <Form layout="vertical" className="device-form">
//                 <Form.Item label="Name" required>
//                   <Input value="Air Filter" readOnly />
//                 </Form.Item>

//                 <Form.Item label="Device profile">
//                   <div className="editable-field">
//                     <span>default</span>
//                     <Button type="text" icon={<EditOutlined />} size="small" />
//                   </div>
//                 </Form.Item>

//                 <Form.Item label="Label">
//                   <div className="editable-field">
//                     <span>filter</span>
//                     <Button type="text" icon={<EditOutlined />} size="small" />
//                   </div>
//                 </Form.Item>

//                 <Form.Item label="Assigned firmware">
//                   <div className="empty-field">
//                     <span>No firmware assigned</span>
//                   </div>
//                 </Form.Item>

//                 <Form.Item label="Assigned software">
//                   <div className="empty-field">
//                     <span>No software assigned</span>
//                   </div>
//                 </Form.Item>

//                 <Form.Item>
//                   <Checkbox disabled>Is gateway</Checkbox>
//                 </Form.Item>

//                 <Form.Item label="Description">
//                   <Input.TextArea rows={4} placeholder="No description" />
//                 </Form.Item>
//               </Form>
//             </div>
//           </TabPane>
//           <TabPane tab="Attributes" key="attributes">
//             Attributes content
//           </TabPane>
//           <TabPane tab="Latest telemetry" key="telemetry">
//             Latest telemetry content
//           </TabPane>
//           <TabPane tab="Alarms" key="alarms">
//             Alarms content
//           </TabPane>
//           <TabPane tab="Events" key="events">
//             Events content
//           </TabPane>
//           <TabPane tab="Relations" key="relations">
//             Relations content
//           </TabPane>
//           <TabPane tab="Audit logs" key="audit">
//             Audit logs content
//           </TabPane>
//           <TabPane tab="Version control" key="version">
//             Version control content
//           </TabPane>
//         </Tabs>
//       </Card>
//     </div>
//   )
// }

// export default DeviceDetailsPage

