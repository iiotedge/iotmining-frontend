"use client"

import { Modal, Button, Table, Space } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import { useState } from "react"

const EntityAliasesModal = ({ visible, onClose }) => {
  const [aliases, setAliases] = useState([])

  const columns = [
    {
      title: "Alias name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Entity filter",
      dataIndex: "filter",
      key: "filter",
    },
    {
      title: "Resolve as multiple entities",
      dataIndex: "multiple",
      key: "multiple",
      render: (multiple) => (multiple ? "✓" : ""),
    },
  ]

  const handleAddAlias = () => {
    // Implement adding new alias
  }

  return (
    <Modal
      title="Entity aliases"
      open={visible}
      onCancel={onClose}
      width={800}
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
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAlias}>
          Add alias
        </Button>

        <Table columns={columns} dataSource={aliases} pagination={false} />
      </Space>
    </Modal>
  )
}

export default EntityAliasesModal

