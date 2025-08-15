"use client"

import { Modal, Form, Input, Select } from "antd"

const EdgeLabelModal = ({ visible, onCancel, onSave, edge }) => {
  const [form] = Form.useForm()

  const handleSave = () => {
    form.validateFields().then((values) => {
      onSave(values)
      form.resetFields()
    })
  }

  return (
    <Modal title="Edit connection" open={visible} onCancel={onCancel} onOk={handleSave} width={500}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          label: edge?.label || "",
          type: edge?.sourceHandle || "success",
        }}
      >
        <Form.Item
          name="label"
          label="Label"
          rules={[{ required: true, message: "Please input the connection label!" }]}
        >
          <Input placeholder="Enter connection label" />
        </Form.Item>

        <Form.Item name="type" label="Connection type">
          <Select>
            <Select.Option value="success">Success</Select.Option>
            <Select.Option value="failure">Failure</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default EdgeLabelModal

