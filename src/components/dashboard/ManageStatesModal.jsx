"use client"

import { Modal, Button, Table, Input, Space } from "antd"
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons"
import { useState } from "react"

const ManageStatesModal = ({ visible, onClose }) => {
  const [states, setStates] = useState([
    {
      key: "default",
      name: "wetet",
      stateId: "default",
      rootState: true,
    },
  ])

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "State Id",
      dataIndex: "stateId",
      key: "stateId",
    },
    {
      title: "Root state",
      dataIndex: "rootState",
      key: "rootState",
      render: (rootState) => (rootState ? "✓" : ""),
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} />
          <Button type="text" icon={<DeleteOutlined />} />
        </Space>
      ),
    },
  ]

  return (
    <Modal
      title="Manage dashboard states"
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
        <Space>
          <Button type="primary" icon={<PlusOutlined />}>
            Add state
          </Button>
          <Input placeholder="Search states" prefix={<SearchOutlined />} style={{ width: 200 }} />
        </Space>

        <Table
          columns={columns}
          dataSource={states}
          pagination={{
            pageSize: 5,
            total: states.length,
            showSizeChanger: false,
          }}
        />
      </Space>
    </Modal>
  )
}

export default ManageStatesModal

