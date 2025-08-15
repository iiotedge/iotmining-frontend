"use client"

import { useState } from "react"
import { Modal, Form, Input, Radio, Select, Checkbox } from "antd"

const NotificationRecipientsModal = ({ visible, onCancel, onSave }) => {
  const [form] = Form.useForm()
  const [recipientType, setRecipientType] = useState("Platform users")

  const handleTypeChange = (e) => {
    setRecipientType(e.target.value)
  }

  const handleSave = () => {
    form
      .validateFields()
      .then((values) => {
        onSave({
          name: values.name,
          type: values.type,
          description: values.description,
          config: {
            userFilter: values.userFilter,
            slackConfig:
              values.type === "Slack"
                ? {
                    channelType: values.channelType,
                    conversation: values.conversation,
                  }
                : undefined,
            teamsConfig:
              values.type === "Microsoft Teams"
                ? {
                    useOldApi: values.useOldApi,
                    workflowUrl: values.workflowUrl,
                    channelName: values.channelName,
                  }
                : undefined,
          },
        })
        form.resetFields()
      })
      .catch((error) => {
        console.error("Validation failed:", error)
      })
  }

  return (
    <Modal
      title="Add notification recipients group"
      open={visible}
      onCancel={onCancel}
      onOk={handleSave}
      okText="Add"
      width={700}
    >
      <Form form={form} layout="vertical" initialValues={{ type: "Platform users", userFilter: "All users" }}>
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: "Please input the recipient group name!" }]}
        >
          <Input placeholder="Enter name" />
        </Form.Item>

        <Form.Item name="type" label="Type">
          <Radio.Group onChange={handleTypeChange}>
            <Radio value="Platform users">Platform users</Radio>
            <Radio value="Slack">Slack</Radio>
            <Radio value="Microsoft Teams">Microsoft Teams</Radio>
          </Radio.Group>
        </Form.Item>

        {recipientType === "Platform users" && (
          <Form.Item name="userFilter" label="User filter">
            <Select>
              <Select.Option value="All users">All users</Select.Option>
              <Select.Option value="Tenant administrators">Tenant administrators</Select.Option>
              <Select.Option value="Customer users">Customer users</Select.Option>
            </Select>
          </Form.Item>
        )}

        {recipientType === "Slack" && (
          <>
            <Form.Item name="channelType" label="Slack channel type">
              <Radio.Group>
                <Radio value="Public channel">Public channel</Radio>
                <Radio value="Private channel">Private channel</Radio>
                <Radio value="Direct message">Direct message</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              name="conversation"
              label="Conversation"
              rules={[{ required: true, message: "Please input the conversation ID!" }]}
            >
              <Input placeholder="Enter conversation ID" />
            </Form.Item>
          </>
        )}

        {recipientType === "Microsoft Teams" && (
          <>
            <Form.Item name="useOldApi" valuePropName="checked">
              <Checkbox>Use old API</Checkbox>
            </Form.Item>
            <Form.Item
              name="workflowUrl"
              label="Workflow URL"
              rules={[{ required: true, message: "Please input the workflow URL!" }]}
            >
              <Input placeholder="Enter workflow URL" />
            </Form.Item>
            <Form.Item
              name="channelName"
              label="Channel name"
              rules={[{ required: true, message: "Please input the channel name!" }]}
            >
              <Input placeholder="Enter channel name" />
            </Form.Item>
          </>
        )}

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={4} placeholder="Enter description" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default NotificationRecipientsModal
