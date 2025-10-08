"use client"

import { useState } from "react"
import {
  Modal,
  Form,
  Input,
  Select,
  Upload,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Card,
  Tag,
  message,
  Divider,
} from "antd"
import {
  PlusOutlined,
  InboxOutlined,
  FileTextOutlined,
  BugOutlined,
  WifiOutlined,
  SettingOutlined,
  SecurityScanOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons"

const { TextArea } = Input
const { Option } = Select
const { Title, Text } = Typography
const { Dragger } = Upload

const CreateTicketModal = ({ visible, onCancel, onSuccess, userRole }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("")

  const categories = [
    {
      key: "connectivity",
      label: "Connectivity Issues",
      icon: <WifiOutlined />,
      description: "Network, WiFi, cellular connection problems",
      color: "blue",
    },
    {
      key: "device-issues",
      label: "Device Issues",
      icon: <BugOutlined />,
      description: "Hardware malfunctions, sensor problems",
      color: "red",
    },
    {
      key: "rule-chains",
      label: "Rule Chains",
      icon: <SettingOutlined />,
      description: "Automation rules, triggers, actions",
      color: "orange",
    },
    {
      key: "security",
      label: "Security",
      icon: <SecurityScanOutlined />,
      description: "Authentication, vulnerabilities, certificates",
      color: "purple",
    },
    {
      key: "data-analytics",
      label: "Data Analytics",
      icon: <BarChartOutlined />,
      description: "Reports, dashboards, data processing",
      color: "green",
    },
    {
      key: "performance",
      label: "Performance",
      icon: <ThunderboltOutlined />,
      description: "Optimization, timeouts, slow loading",
      color: "gold",
    },
    {
      key: "general",
      label: "General Support",
      icon: <QuestionCircleOutlined />,
      description: "Other questions and requests",
      color: "default",
    },
  ]

  const priorityOptions = [
    {
      value: "low",
      label: "Low",
      description: "Enhancement requests, minor issues",
      color: "green",
      sla: "3-5 business days",
    },
    {
      value: "medium",
      label: "Medium",
      description: "Standard functionality issues",
      color: "blue",
      sla: "1-2 business days",
    },
    {
      value: "high",
      label: "High",
      description: "Major functionality affected",
      color: "orange",
      sla: "4-8 hours",
    },
    {
      value: "critical",
      label: "Critical",
      description: "System down, security breach",
      color: "red",
      sla: "1-2 hours",
    },
  ]

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const ticketData = {
        ...values,
        id: `TKT-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
        status: "open",
        reporter: userRole === "user" ? "Current User" : values.reporter,
        reporterEmail: userRole === "user" ? "user@company.com" : values.reporterEmail,
        assignee: userRole === "user" ? "Support Team" : values.assignee || "Unassigned",
        tenant: userRole === "user" ? "Current Organization" : values.tenant,
        createdAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString(),
        attachments: fileList.map((file) => file.name),
        comments: 0,
        tags: values.tags || [],
      }

      onSuccess(ticketData)
      form.resetFields()
      setFileList([])
      setSelectedCategory("")
    } catch (error) {
      message.error("Failed to create ticket")
    } finally {
      setLoading(false)
    }
  }

  const uploadProps = {
    fileList,
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    beforeUpload: () => false,
    multiple: true,
    accept: ".txt,.log,.json,.pdf,.png,.jpg,.jpeg,.zip",
  }

  const handleCategorySelect = (categoryKey) => {
    setSelectedCategory(categoryKey)
    form.setFieldsValue({ category: categoryKey })
  }

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FileTextOutlined />
          <span>Create Support Ticket</span>
        </div>
      }
      open={visible}
      onCancel={() => {
        onCancel()
        form.resetFields()
        setFileList([])
        setSelectedCategory("")
      }}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="title"
              label="Ticket Title"
              rules={[{ required: true, message: "Please enter a ticket title" }]}
            >
              <Input placeholder="Brief description of the issue" size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: "Please select a category" }]}
            >
              <div>
                <Text type="secondary" style={{ marginBottom: 12, display: "block" }}>
                  Select the category that best describes your issue:
                </Text>
                <Row gutter={[12, 12]}>
                  {categories.map((category) => (
                    <Col xs={24} sm={12} md={8} key={category.key}>
                      <Card
                        size="small"
                        hoverable
                        onClick={() => handleCategorySelect(category.key)}
                        style={{
                          cursor: "pointer",
                          border: selectedCategory === category.key ? `2px solid #1890ff` : "1px solid #d9d9d9",
                          backgroundColor: selectedCategory === category.key ? "#f6ffed" : "transparent",
                        }}
                      >
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 24, marginBottom: 8, color: `var(--ant-${category.color})` }}>
                            {category.icon}
                          </div>
                          <Text strong style={{ fontSize: 12 }}>
                            {category.label}
                          </Text>
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {category.description}
                            </Text>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="priority" label="Priority" rules={[{ required: true, message: "Please select priority" }]}>
              <Select placeholder="Select priority level" size="large">
                {priorityOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <Tag color={option.color} style={{ marginRight: 8 }}>
                          {option.label.toUpperCase()}
                        </Tag>
                        <Text>{option.description}</Text>
                      </div>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        SLA: {option.sla}
                      </Text>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="tags" label="Tags (Optional)">
              <Select
                mode="tags"
                placeholder="Add relevant tags"
                size="large"
                tokenSeparators={[","]}
                options={[
                  { value: "urgent", label: "urgent" },
                  { value: "sensor", label: "sensor" },
                  { value: "connectivity", label: "connectivity" },
                  { value: "dashboard", label: "dashboard" },
                  { value: "performance", label: "performance" },
                  { value: "security", label: "security" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Admin/Super Admin specific fields */}
        {userRole !== "user" && (
          <>
            <Divider>Administrative Fields</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="reporter" label="Reporter Name">
                  <Input placeholder="Customer name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="reporterEmail" label="Reporter Email">
                  <Input placeholder="customer@company.com" type="email" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="tenant" label="Organization">
                  <Input placeholder="Customer organization" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="assignee" label="Assign To">
                  <Select placeholder="Select assignee">
                    <Option value="Support Team">Support Team</Option>
                    <Option value="Tech Support">Tech Support</Option>
                    <Option value="Senior Engineer">Senior Engineer</Option>
                    <Option value="Security Specialist">Security Specialist</Option>
                    <Option value="Performance Team">Performance Team</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: "Please provide a detailed description" }]}
            >
              <TextArea
                rows={6}
                placeholder="Please provide a detailed description of the issue, including:
• What you were trying to do
• What happened instead
• When the issue started
• Any error messages you received
• Steps to reproduce the problem"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="attachments" label="Attachments (Optional)">
              <Dragger {...uploadProps} style={{ padding: "20px" }}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ fontSize: 48, color: "#1890ff" }} />
                </p>
                <p className="ant-upload-text">Click or drag files to upload</p>
                <p className="ant-upload-hint">
                  Support for logs, screenshots, configuration files, etc.
                  <br />
                  Accepted formats: .txt, .log, .json, .pdf, .png, .jpg, .zip
                </p>
              </Dragger>
              {fileList.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Text strong>Attached Files:</Text>
                  <div style={{ marginTop: 8 }}>
                    {fileList.map((file, index) => (
                      <Tag
                        key={index}
                        closable
                        onClose={() => {
                          const newFileList = fileList.filter((_, i) => i !== index)
                          setFileList(newFileList)
                        }}
                        style={{ marginBottom: 4 }}
                      >
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <div style={{ textAlign: "right" }}>
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}>
              Create Ticket
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  )
}

export default CreateTicketModal