import { Form, Input, Modal, Select } from "antd"
import { PhoneOutlined } from "@ant-design/icons"
import countryList from "react-select-country-list"
import { useMemo } from "react"

const AddCustomerModal = ({ visible, onCancel, onAdd }) => {
  const [form] = Form.useForm()
  const countries = useMemo(() => countryList().getData(), [])

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onAdd(values)
      form.resetFields()
    })
  }

  return (
    <Modal title="Add customer" open={visible} onCancel={onCancel} onOk={handleSubmit} width={700}>
      <Form form={form} layout="vertical">
        <Form.Item name="title" label="Title" rules={[{ required: true, message: "Please input the title!" }]}>
          <Input placeholder="Enter title" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={4} placeholder="Enter description" />
        </Form.Item>

        <Form.Item name="country" label="Country">
          <Select
            showSearch
            placeholder="Select country"
            options={countries.map((country) => ({
              label: country.label,
              value: country.label,
            }))}
            filterOption={(input, option) => option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0}
          />
        </Form.Item>

        <div style={{ display: "flex", gap: "16px" }}>
          <Form.Item name="city" label="City" style={{ flex: 1 }}>
            <Input placeholder="Enter city" />
          </Form.Item>

          <Form.Item name="state" label="State / Province" style={{ flex: 1 }}>
            <Input placeholder="Enter state/province" />
          </Form.Item>

          <Form.Item name="zip" label="Zip / Postal Code" style={{ flex: 1 }}>
            <Input placeholder="Enter zip/postal code" />
          </Form.Item>
        </div>

        <Form.Item name="address" label="Address">
          <Input placeholder="Enter address" />
        </Form.Item>

        <Form.Item name="address2" label="Address 2">
          <Input placeholder="Enter additional address info" />
        </Form.Item>

        <Form.Item name="phone" label="Phone">
          <Input addonBefore={<PhoneOutlined />} placeholder="Phone Number in E.164 format, ex: +12015550123" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            {
              type: "email",
              message: "Please enter a valid email!",
            },
          ]}
        >
          <Input placeholder="Enter email" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default AddCustomerModal

