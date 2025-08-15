"use client"

import { Form, Input, Modal, Select, Checkbox, Upload, Button } from "antd"
import { PictureOutlined, LinkOutlined } from "@ant-design/icons"

const AddDashboardModal = ({ visible, onCancel, onAdd }) => {
  const [form] = Form.useForm()

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onAdd(values)
      form.resetFields()
    })
  }

  return (
    <Modal title="Add dashboard" open={visible} onCancel={onCancel} onOk={handleSubmit} width={700} okText="Create">
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: "Please input the dashboard title!" }]}
        >
          <Input placeholder="Enter title" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={4} placeholder="Enter description" />
        </Form.Item>

        <Form.Item name="assignedCustomers" label="Assigned customers">
          <Select
            mode="multiple"
            placeholder="Select customers"
            options={[
              { label: "Demo Customer", value: "demo" },
              { label: "Device Claiming Customer", value: "claiming" },
            ]}
          />
        </Form.Item>

        <Form.Item label="Mobile application settings">
          <Form.Item name="hideMobile" valuePropName="checked" noStyle>
            <Checkbox>Hide dashboard in mobile application</Checkbox>
          </Form.Item>
        </Form.Item>

        <Form.Item name="mobileOrder" label="Dashboard order in mobile application">
          <Input type="number" min={0} />
        </Form.Item>

        <Form.Item label="Dashboard image">
          <div style={{ display: "flex", gap: "16px" }}>
            <Upload accept="image/*" showUploadList={false}>
              <Button icon={<PictureOutlined />}>Browse from gallery</Button>
            </Upload>
            <Button icon={<LinkOutlined />}>Set link</Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default AddDashboardModal

