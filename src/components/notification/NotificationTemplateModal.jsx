"use client"

import { useState } from "react"
import { Modal, Form, Input, Select, Checkbox, Tabs, Button, Space } from "antd"

const { TabPane } = Tabs
const { Option } = Select

const NotificationTemplateModal = ({ visible, onCancel, onSave }) => {
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState("setup")

  const handleTypeChange = (value) => {
    // We'll keep the function but remove the unused variable
    // This function might be useful in the future
    console.log("Template type changed:", value)
  }

  const handleDeliveryMethodChange = (checkedValues) => {
    // We'll keep the function but remove the unused variable
    // This function might be useful in the future
    console.log("Delivery methods changed:", checkedValues)
  }

  const handleNext = () => {
    form
      .validateFields(["name", "type", "deliveryMethods"])
      .then(() => {
        setCurrentStep("compose")
      })
      .catch((error) => {
        console.error("Validation failed:", error)
      })
  }

  const handleSave = () => {
    form
      .validateFields()
      .then((values) => {
        onSave({
          name: values.name,
          type: values.type,
          deliveryMethods: values.deliveryMethods,
          subject: values.subject,
          body: values.body,
        })
        form.resetFields()
        setCurrentStep("setup")
      })
      .catch((error) => {
        console.error("Validation failed:", error)
      })
  }

  const handleCancel = () => {
    form.resetFields()
    setCurrentStep("setup")
    onCancel()
  }

  const typeOptions = [
    { label: "General", value: "General" },
    { label: "Alarm", value: "Alarm" },
    { label: "Device activity", value: "Device activity" },
    { label: "Entity action", value: "Entity action" },
    { label: "Alarm comment", value: "Alarm comment" },
    { label: "Alarm assignment", value: "Alarm assignment" },
    { label: "Rule engine lifecycle event", value: "Rule engine lifecycle event" },
    { label: "Rule node", value: "Rule node" },
    { label: "Edge connection", value: "Edge connection" },
    { label: "Edge communication failure", value: "Edge communication failure" },
  ]

  const deliveryMethodOptions = [
    { label: "Web", value: "Web" },
    { label: "Mobile app", value: "Mobile app" },
    { label: "SMS", value: "SMS" },
    { label: "Email", value: "Email" },
    { label: "Slack", value: "Slack" },
    { label: "Microsoft Teams", value: "Microsoft Teams" },
  ]

  return (
    <Modal title="Add notification template" open={visible} onCancel={handleCancel} footer={null} width={800}>
      <Tabs activeKey={currentStep} onChange={setCurrentStep}>
        <TabPane tab="1 Setup" key="setup" disabled={currentStep !== "setup"}>
          <Form form={form} layout="vertical" initialValues={{ deliveryMethods: ["Web"] }}>
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: "Please input the template name!" }]}
            >
              <Input placeholder="Enter template name" />
            </Form.Item>

            <Form.Item
              name="type"
              label="Type"
              rules={[{ required: true, message: "Please select the template type!" }]}
            >
              <Select
                placeholder="Select template type"
                onChange={handleTypeChange}
                dropdownRender={(menu) => <div>{menu}</div>}
              >
                {typeOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="deliveryMethods"
              label="Delivery methods"
              rules={[{ required: true, message: "Please select at least one delivery method!" }]}
              extra="At least one should be selected"
            >
              <Checkbox.Group options={deliveryMethodOptions} onChange={handleDeliveryMethodChange} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" onClick={handleNext}>
                Next
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
        <TabPane tab="2 Compose" key="compose" disabled={currentStep !== "compose"}>
          <Form form={form} layout="vertical">
            <Form.Item
              name="subject"
              label="Subject"
              rules={[{ required: true, message: "Please input the subject!" }]}
            >
              <Input placeholder="Enter subject" />
            </Form.Item>

            <Form.Item name="body" label="Body" rules={[{ required: true, message: "Please input the body!" }]}>
              <Input.TextArea rows={6} placeholder="Enter notification body" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button onClick={() => setCurrentStep("setup")}>Previous</Button>
                <Button type="primary" onClick={handleSave}>
                  Save
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </TabPane>
      </Tabs>
    </Modal>
  )
}

export default NotificationTemplateModal
