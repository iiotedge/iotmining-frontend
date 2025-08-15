"use client"

import { Modal, Select, Table, Button, Space } from "antd"
import { PlusOutlined, SettingOutlined } from "@ant-design/icons"
import { useState } from "react"

const ManageLayoutsModal = ({ visible, onClose }) => {
  const [layouts, setLayouts] = useState([
    {
      key: "default",
      breakpoint: "Default",
      size: "24 columns",
    },
  ])

  const columns = [
    {
      title: "Breakpoints",
      dataIndex: "breakpoint",
      key: "breakpoint",
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Button type="text" icon={<SettingOutlined />} onClick={() => handleEditBreakpoint(record)} />
      ),
    },
  ]

  const handleEditBreakpoint = (breakpoint) => {
    // Implement breakpoint editing
  }

  const handleAddBreakpoint = () => {
    // Implement adding new breakpoint
  }

  return (
    <Modal
      title="Manage layouts"
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={onClose}>
          Save
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Select defaultValue="default" style={{ width: "100%" }} options={[{ label: "Default", value: "default" }]} />

        <Table columns={columns} dataSource={layouts} pagination={false} size="small" />

        <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddBreakpoint} style={{ width: "100%" }}>
          Add breakpoint
        </Button>
      </Space>
    </Modal>
  )
}

export default ManageLayoutsModal

