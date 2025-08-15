"use client"
import { Modal, Form, Select, Input, Button, Space, Tag, Divider } from "antd"
import { useState } from "react"

const { Option } = Select

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
]

const NOTIFICATION_TYPE_OPTIONS = [
  { value: "INFO", label: "Information" },
  { value: "ALERT", label: "Alert" },
  { value: "WARNING", label: "Warning" },
  { value: "ERROR", label: "Error" },
]

const NotificationSendModal = ({
  visible,
  onCancel,
  onSend,
  templates = [],
  recipients = [],
  defaultSourceApp = "iot-dashboard",
}) => {
  const [form] = Form.useForm()
  const [metadata, setMetadata] = useState([{ key: "deviceId", value: "" }, { key: "severity", value: "ALERT" }])

  const handleTemplateChange = (templateId) => {
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      form.setFieldsValue({
        subject: template.subject || "",
        body: template.body || "",
      })
    }
  }

  const handleAddMetadata = () => {
    setMetadata([...metadata, { key: "", value: "" }])
  }

  const handleMetaChange = (idx, type, value) => {
    const updated = metadata.map((item, i) => i === idx ? { ...item, [type]: value } : item)
    setMetadata(updated)
  }

  const handleRemoveMeta = (idx) => {
    setMetadata(metadata.filter((_, i) => i !== idx))
  }

  const handleSend = () => {
    form
      .validateFields()
      .then((values) => {
        const selectedRecipient = recipients.find(r => r.id === values.recipientId[0])
        // Build metadata object from array
        const metadataObj = {}
        metadata.forEach(({ key, value }) => { if (key) metadataObj[key] = value })

        // Final message format
        const message = {
          type: values.deliveryType || "WEB",
          userId: selectedRecipient?.id || "",
          sourceApp: defaultSourceApp,
          priority: values.priority || "MEDIUM",
          retryCount: 0,
          payload: {
            title: values.subject,
            message: values.body,
            type: values.notificationType || "INFO",
            url: values.url || "",
            metadata: metadataObj,
          },
        }

        onSend(message)
        form.resetFields()
        setMetadata([{ key: "deviceId", value: "" }, { key: "severity", value: "ALERT" }])
      })
      .catch((error) => {
        console.error("Validation failed:", error)
      })
  }

  return (
    <Modal
      title="Send Notification"
      open={visible}
      onCancel={onCancel}
      onOk={handleSend}
      okText="Send"
      width={750}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item name="templateId" label="Template">
          <Select placeholder="Select template" allowClear onChange={handleTemplateChange}>
            {templates.map((template) => (
              <Option key={template.id} value={template.id}>{template.name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="recipientId"
          label="Recipients"
          rules={[{ required: true, message: "Please select recipients!" }]}
        >
          <Select placeholder="Select recipients" mode="multiple" maxTagCount={1}>
            {recipients.map((recipient) => (
              <Option key={recipient.id} value={recipient.id}>{recipient.name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="deliveryType" label="Delivery Type" initialValue="WEB">
          <Select>
            <Option value="WEB">WEB</Option>
            <Option value="EMAIL">EMAIL</Option>
            {/* Add more if needed */}
          </Select>
        </Form.Item>

        <Form.Item name="priority" label="Priority" initialValue="MEDIUM">
          <Select>
            {PRIORITY_OPTIONS.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
          </Select>
        </Form.Item>

        <Form.Item name="notificationType" label="Notification Type" initialValue="INFO">
          <Select>
            {NOTIFICATION_TYPE_OPTIONS.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
          </Select>
        </Form.Item>

        <Form.Item name="subject" label="Title" rules={[{ required: true, message: "Please input the title!" }]}>
          <Input placeholder="Notification title" />
        </Form.Item>

        <Form.Item name="body" label="Message" rules={[{ required: true, message: "Please input the message!" }]}>
          <Input.TextArea rows={4} placeholder="Notification message body" />
        </Form.Item>

        <Form.Item name="url" label="URL (optional)">
          <Input placeholder="/devices/1001" />
        </Form.Item>

        <Divider orientation="left">Metadata</Divider>
        {metadata.map((meta, idx) => (
          <Space key={idx} style={{ display: "flex", marginBottom: 8 }} align="start">
            <Input
              placeholder="Key"
              style={{ width: 140 }}
              value={meta.key}
              onChange={e => handleMetaChange(idx, "key", e.target.value)}
              allowClear
            />
            <Input
              placeholder="Value"
              style={{ width: 180 }}
              value={meta.value}
              onChange={e => handleMetaChange(idx, "value", e.target.value)}
              allowClear
            />
            {metadata.length > 1 &&
              <Button type="link" danger onClick={() => handleRemoveMeta(idx)}>Remove</Button>
            }
          </Space>
        ))}
        <Button type="dashed" onClick={handleAddMetadata}>Add Metadata</Button>
      </Form>
    </Modal>
  )
}

export default NotificationSendModal

// "use client"
// import { Modal, Form, Select, Input } from "antd"

// const { Option } = Select

// const NotificationSendModal = ({ visible, onCancel, onSend, templates, recipients }) => {
//   const [form] = Form.useForm()

//   const handleTemplateChange = (templateId) => {
//     const template = templates.find((t) => t.id === templateId)

//     if (template) {
//       form.setFieldsValue({
//         subject: template.subject || "",
//         body: template.body || "",
//       })
//     }
//   }

//   const handleSend = () => {
//     form
//       .validateFields()
//       .then((values) => {
//         onSend({
//           templateId: values.templateId,
//           recipientId: values.recipientId,
//           subject: values.subject,
//           body: values.body,
//         })
//         form.resetFields()
//       })
//       .catch((error) => {
//         console.error("Validation failed:", error)
//       })
//   }

//   return (
//     <Modal title="Send notification" open={visible} onCancel={onCancel} onOk={handleSend} okText="Send" width={700}>
//       <Form form={form} layout="vertical">
//         <Form.Item
//           name="templateId"
//           label="Template"
//           rules={[{ required: true, message: "Please select a template!" }]}
//         >
//           <Select placeholder="Select template" onChange={handleTemplateChange}>
//             {templates.map((template) => (
//               <Option key={template.id} value={template.id}>
//                 {template.name}
//               </Option>
//             ))}
//           </Select>
//         </Form.Item>

//         <Form.Item
//           name="recipientId"
//           label="Recipients"
//           rules={[{ required: true, message: "Please select recipients!" }]}
//         >
//           <Select placeholder="Select recipients" mode="multiple">
//             {recipients.map((recipient) => (
//               <Option key={recipient.id} value={recipient.id}>
//                 {recipient.name}
//               </Option>
//             ))}
//           </Select>
//         </Form.Item>

//         <Form.Item name="subject" label="Subject" rules={[{ required: true, message: "Please input the subject!" }]}>
//           <Input placeholder="Enter subject" />
//         </Form.Item>

//         <Form.Item name="body" label="Body" rules={[{ required: true, message: "Please input the body!" }]}>
//           <Input.TextArea rows={6} placeholder="Enter notification body" />
//         </Form.Item>
//       </Form>
//     </Modal>
//   )
// }

// export default NotificationSendModal
