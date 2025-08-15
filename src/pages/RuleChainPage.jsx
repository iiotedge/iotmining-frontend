"use client"

import { useState } from "react"
import { Card, Table, Button, Space, Typography, Input, Modal, Form, Upload, message } from "antd"
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  DownloadOutlined,
  FlagOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons"
import { Link, useNavigate } from "react-router-dom"

const { Dragger } = Upload

const RuleChainPage = () => {
  const navigate = useNavigate()
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isImportModalVisible, setIsImportModalVisible] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [form] = Form.useForm()
  const [ruleChains, setRuleChains] = useState([
    {
      key: "1",
      id: "iotm",
      createdTime: "2025-03-01 18:41:35",
      name: "IoTM",
      description: "",
      root: false,
    },
    {
      key: "2",
      id: "swimming-pool",
      createdTime: "2025-01-27 15:01:26",
      name: "Swimming Pool Device Rule Chain",
      description: "",
      root: false,
    },
    {
      key: "3",
      id: "charging-stations",
      createdTime: "2025-01-27 15:01:25",
      name: "Charging Stations",
      description: "",
      root: false,
    },
    {
      key: "4",
      id: "air-quality",
      createdTime: "2025-01-27 15:01:25",
      name: "Air Quality Sensors",
      description: "",
      root: false,
    },
    {
      key: "5",
      id: "temperature-humidity",
      createdTime: "2025-01-27 15:01:24",
      name: "Temperature & Humidity Sensors",
      description: "",
      root: false,
    },
    {
      key: "6",
      id: "root",
      createdTime: "2025-01-27 15:01:12",
      name: "Root Rule Chain",
      description: "",
      root: true,
    },
  ])

  const columns = [
    {
      title: "Created time",
      dataIndex: "createdTime",
      key: "createdTime",
      sorter: true,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => <Link to={`/rule-chains/${record.id}`}>{text}</Link>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Root",
      dataIndex: "root",
      key: "root",
      render: (isRoot) => isRoot && <FlagOutlined style={{ color: "#1890ff" }} />,
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<DownloadOutlined />}
            title="Export rule chain"
            onClick={() => exportRuleChain(record)}
          />
          <Button
            type="text"
            icon={<FlagOutlined />}
            title="Make rule chain root"
            disabled={record.root}
            onClick={() => makeRuleChainRoot(record.key)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            title="Edit rule chain"
            onClick={() => navigate(`/rule-chains/${record.id}`)}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            title="Delete rule chain"
            disabled={record.root}
            onClick={() => showDeleteConfirm(record)}
          />
        </Space>
      ),
    },
  ]

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys)
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  }

  const showAddModal = () => {
    setIsAddModalVisible(true)
  }

  const handleAddCancel = () => {
    setIsAddModalVisible(false)
    form.resetFields()
  }

  const handleAddSubmit = () => {
    form.validateFields().then((values) => {
      // Add new rule chain
      const id = values.name.toLowerCase().replace(/\s+/g, "-")
      const newRuleChain = {
        key: String(ruleChains.length + 1),
        id,
        createdTime: new Date().toISOString().replace("T", " ").substring(0, 19),
        name: values.name,
        description: values.description || "",
        root: false,
      }

      setRuleChains([...ruleChains, newRuleChain])

      // Navigate to the new rule chain editor
      navigate(`/rule-chains/${id}`)

      setIsAddModalVisible(false)
      form.resetFields()
    })
  }

  const showImportModal = () => {
    setIsImportModalVisible(true)
  }

  const handleImportCancel = () => {
    setIsImportModalVisible(false)
    setImportFile(null)
  }

  const handleImportFileChange = (info) => {
    const { status, originFileObj } = info.file
    if (status !== "uploading") {
      setImportFile(originFileObj)
    }
    if (status === "error") {
      message.error(`${info.file.name} file upload failed.`)
    }
  }

  const handleImportSubmit = () => {
    if (!importFile) {
      message.warning("Please select a file to import")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const ruleChain = JSON.parse(e.target.result)

        // Create a new rule chain entry
        const id = ruleChain.name.toLowerCase().replace(/\s+/g, "-")
        const newRuleChain = {
          key: String(ruleChains.length + 1),
          id,
          createdTime: new Date().toISOString().replace("T", " ").substring(0, 19),
          name: ruleChain.name,
          description: ruleChain.additionalInfo?.description || "",
          root: false,
        }

        setRuleChains([...ruleChains, newRuleChain])

        message.success("Rule chain imported successfully")
        setIsImportModalVisible(false)

        // Navigate to the new rule chain
        navigate(`/rule-chains/${id}`)
      } catch (error) {
        console.error("Error importing rule chain:", error)
        message.error("Failed to import rule chain. Invalid file format.")
      }
    }
    reader.readAsText(importFile)
  }

  const exportRuleChain = (record) => {
    // Create a sample rule chain JSON
    const ruleChain = {
      name: record.name,
      firstRuleNodeId: "input-1",
      nodes: [
        {
          id: "input-1",
          type: "Input",
          name: "Input",
          configuration: {
            description: "",
          },
          position: { x: 100, y: 100 },
          category: "input",
          icon: "📥",
        },
        {
          id: "switch-1",
          type: "message type switch",
          name: "Message Type Switch",
          configuration: {
            description: "",
          },
          position: { x: 300, y: 250 },
          category: "switch",
          icon: "🔀",
        },
      ],
      connections: [
        {
          fromId: "input-1",
          toId: "switch-1",
          type: "success",
          label: "Success",
        },
      ],
      createdTime: record.createdTime,
      additionalInfo: {
        description: record.description,
      },
    }

    // Convert to JSON and download
    const dataStr = JSON.stringify(ruleChain, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `${record.id}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const makeRuleChainRoot = (key) => {
    // Update rule chains to make the selected one root
    setRuleChains(
      ruleChains.map((chain) => ({
        ...chain,
        root: chain.key === key,
      })),
    )

    message.success("Rule chain set as root")
  }

  const showDeleteConfirm = (record) => {
    Modal.confirm({
      title: "Are you sure you want to delete this rule chain?",
      content: `Rule chain "${record.name}" will be permanently deleted.`,
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        // Remove the rule chain
        setRuleChains(ruleChains.filter((chain) => chain.key !== record.key))
        message.success("Rule chain deleted successfully")
      },
    })
  }

  return (
    <>
      <Card
        title={<Typography.Title level={4}>Rule chains</Typography.Title>}
        extra={
          <Space>
            <Button icon={<PlusOutlined />} type="primary" onClick={showAddModal}>
              Add rule chain
            </Button>
            <Button icon={<UploadOutlined />} onClick={showImportModal}>
              Import rule chain
            </Button>
            <Button icon={<ReloadOutlined />} />
            <Button icon={<SearchOutlined />} />
          </Space>
        }
      >
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={ruleChains}
          pagination={{
            total: ruleChains.length,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
          }}
        />
      </Card>

      {/* Add Rule Chain Modal */}
      <Modal
        title="Add rule chain"
        open={isAddModalVisible}
        onCancel={handleAddCancel}
        onOk={handleAddSubmit}
        okText="Add"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please input the rule chain name!" }]}
          >
            <Input placeholder="Enter rule chain name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={4} placeholder="Enter description" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Import Rule Chain Modal */}
      <Modal
        title="Import rule chain"
        open={isImportModalVisible}
        onCancel={handleImportCancel}
        onOk={handleImportSubmit}
        okText="Import"
      >
        <Dragger
          name="file"
          multiple={false}
          accept=".json"
          showUploadList={true}
          beforeUpload={() => false}
          onChange={handleImportFileChange}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for a single JSON file upload. The file should contain a valid rule chain configuration.
          </p>
        </Dragger>
      </Modal>
    </>
  )
}

export default RuleChainPage

