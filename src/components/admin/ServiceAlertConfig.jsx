"use client"

import { useState, useEffect } from "react"
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Tag,
  Space,
  Alert,
  Tabs,
  Table,
  Tooltip,
  Badge,
  Typography,
  Collapse,
} from "antd"
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SettingOutlined,
  SaveOutlined,
} from "@ant-design/icons"

const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs
const { Text, Title } = Typography
const { Panel } = Collapse

const ServiceAlertConfig = ({ visible, onCancel, onSave }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("services")
  const [serviceAlerts, setServiceAlerts] = useState([])
  const [globalAlerts, setGlobalAlerts] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [alertRuleVisible, setAlertRuleVisible] = useState(false)
  const [editingAlert, setEditingAlert] = useState(null)

  // Mock services data
  const services = [
    {
      id: "device-service",
      name: "Device Service",
      status: "running",
      health: "healthy",
      instances: 3,
      version: "1.2.3",
    },
    {
      id: "rule-engine",
      name: "Rule Engine",
      status: "running",
      health: "warning",
      instances: 2,
      version: "1.2.1",
    },
    {
      id: "auth-service",
      name: "Authentication Service",
      status: "running",
      health: "healthy",
      instances: 2,
      version: "1.1.8",
    },
    {
      id: "data-processor",
      name: "Data Processor",
      status: "running",
      health: "healthy",
      instances: 4,
      version: "2.0.1",
    },
    {
      id: "notification-service",
      name: "Notification Service",
      status: "stopped",
      health: "critical",
      instances: 0,
      version: "1.0.5",
    },
    {
      id: "api-gateway",
      name: "API Gateway",
      status: "running",
      health: "healthy",
      instances: 2,
      version: "1.3.0",
    },
  ]

  // Alert condition types
  const alertConditions = [
    { value: "cpu_usage", label: "CPU Usage", unit: "%" },
    { value: "memory_usage", label: "Memory Usage", unit: "%" },
    { value: "disk_usage", label: "Disk Usage", unit: "%" },
    { value: "response_time", label: "Response Time", unit: "ms" },
    { value: "error_rate", label: "Error Rate", unit: "%" },
    { value: "request_count", label: "Request Count", unit: "req/min" },
    { value: "service_down", label: "Service Down", unit: "boolean" },
    { value: "instance_count", label: "Instance Count", unit: "count" },
    { value: "queue_size", label: "Queue Size", unit: "items" },
    { value: "connection_count", label: "Connection Count", unit: "connections" },
  ]

  // Alert operators
  const operators = [
    { value: "gt", label: "Greater than (>)" },
    { value: "gte", label: "Greater than or equal (>=)" },
    { value: "lt", label: "Less than (<)" },
    { value: "lte", label: "Less than or equal (<=)" },
    { value: "eq", label: "Equal to (=)" },
    { value: "neq", label: "Not equal to (!=)" },
  ]

  // Alert severities
  const severities = [
    { value: "critical", label: "Critical", color: "#ff4d4f" },
    { value: "warning", label: "Warning", color: "#faad14" },
    { value: "info", label: "Info", color: "#1890ff" },
  ]

  // Notification channels
  const notificationChannels = [
    { value: "email", label: "Email", icon: "📧" },
    { value: "slack", label: "Slack", icon: "💬" },
    { value: "webhook", label: "Webhook", icon: "🔗" },
    { value: "sms", label: "SMS", icon: "📱" },
    { value: "dashboard", label: "Dashboard", icon: "📊" },
  ]

  useEffect(() => {
    if (visible) {
      loadAlertConfigurations()
    }
  }, [visible])

  const loadAlertConfigurations = async () => {
    setLoading(true)
    try {
      // Mock API call - replace with actual endpoint
      const mockServiceAlerts = [
        {
          id: "1",
          serviceId: "device-service",
          serviceName: "Device Service",
          name: "High CPU Usage",
          condition: "cpu_usage",
          operator: "gt",
          threshold: 80,
          severity: "warning",
          enabled: true,
          channels: ["email", "dashboard"],
          description: "Alert when CPU usage exceeds 80%",
        },
        {
          id: "2",
          serviceId: "rule-engine",
          serviceName: "Rule Engine",
          name: "Memory Usage Critical",
          condition: "memory_usage",
          operator: "gt",
          threshold: 90,
          severity: "critical",
          enabled: true,
          channels: ["email", "slack", "dashboard"],
          description: "Critical alert when memory usage exceeds 90%",
        },
        {
          id: "3",
          serviceId: "notification-service",
          serviceName: "Notification Service",
          name: "Service Down",
          condition: "service_down",
          operator: "eq",
          threshold: true,
          severity: "critical",
          enabled: true,
          channels: ["email", "sms", "dashboard"],
          description: "Alert when notification service is down",
        },
      ]

      const mockGlobalAlerts = [
        {
          id: "g1",
          name: "System-wide High Error Rate",
          condition: "error_rate",
          operator: "gt",
          threshold: 5,
          severity: "critical",
          enabled: true,
          channels: ["email", "slack"],
          description: "Alert when system-wide error rate exceeds 5%",
          scope: "global",
        },
        {
          id: "g2",
          name: "Low Disk Space",
          condition: "disk_usage",
          operator: "gt",
          threshold: 85,
          severity: "warning",
          enabled: true,
          channels: ["email", "dashboard"],
          description: "Alert when disk usage exceeds 85%",
          scope: "global",
        },
      ]

      setServiceAlerts(mockServiceAlerts)
      setGlobalAlerts(mockGlobalAlerts)
    } catch (error) {
      console.error("Failed to load alert configurations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAlert = async (values) => {
    try {
      const alertData = {
        ...values,
        id: editingAlert?.id || Date.now().toString(),
        serviceId: selectedService?.id,
        serviceName: selectedService?.name,
      }

      if (editingAlert) {
        // Update existing alert
        if (activeTab === "services") {
          setServiceAlerts((prev) => prev.map((alert) => (alert.id === editingAlert.id ? alertData : alert)))
        } else {
          setGlobalAlerts((prev) => prev.map((alert) => (alert.id === editingAlert.id ? alertData : alert)))
        }
      } else {
        // Add new alert
        if (activeTab === "services") {
          setServiceAlerts((prev) => [...prev, alertData])
        } else {
          setGlobalAlerts((prev) => [...prev, { ...alertData, scope: "global" }])
        }
      }

      setAlertRuleVisible(false)
      setEditingAlert(null)
      form.resetFields()
    } catch (error) {
      console.error("Failed to save alert:", error)
    }
  }

  const handleDeleteAlert = (alertId) => {
    Modal.confirm({
      title: "Delete Alert Rule",
      content: "Are you sure you want to delete this alert rule?",
      onOk: () => {
        if (activeTab === "services") {
          setServiceAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
        } else {
          setGlobalAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
        }
      },
    })
  }

  const handleEditAlert = (alert) => {
    setEditingAlert(alert)
    form.setFieldsValue(alert)
    setAlertRuleVisible(true)
  }

  const handleToggleAlert = (alertId, enabled) => {
    if (activeTab === "services") {
      setServiceAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, enabled } : alert)))
    } else {
      setGlobalAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, enabled } : alert)))
    }
  }

  const serviceColumns = [
    {
      title: "Service",
      key: "service",
      render: (_, record) => (
        <Space>
          <Badge
            status={record.status === "running" ? "processing" : "error"}
            text={record.name}
            style={{ fontWeight: 500 }}
          />
          <Tag color={record.health === "healthy" ? "green" : record.health === "warning" ? "orange" : "red"}>
            {record.health}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Instances",
      dataIndex: "instances",
      key: "instances",
      width: 100,
      render: (instances) => <Badge count={instances} style={{ backgroundColor: "#52c41a" }} />,
    },
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
      width: 100,
    },
    {
      title: "Alert Rules",
      key: "alertCount",
      width: 120,
      render: (_, record) => {
        const count = serviceAlerts.filter((alert) => alert.serviceId === record.id).length
        return <Badge count={count} style={{ backgroundColor: "#1890ff" }} />
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Configure Alerts">
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => {
                setSelectedService(record)
                setEditingAlert(null)
                form.resetFields()
                setAlertRuleVisible(true)
              }}
            />
          </Tooltip>
          <Tooltip title="View Alerts">
            <Button
              type="text"
              icon={<BellOutlined />}
              onClick={() => {
                // Show service-specific alerts
                console.log("View alerts for", record.name)
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  const alertColumns = [
    {
      title: "Alert Rule",
      key: "rule",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{record.name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.description}
          </Text>
        </div>
      ),
    },
    {
      title: "Condition",
      key: "condition",
      width: 200,
      render: (_, record) => {
        const condition = alertConditions.find((c) => c.value === record.condition)
        return (
          <div>
            <Tag>{condition?.label}</Tag>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {operators.find((op) => op.value === record.operator)?.label} {record.threshold}
              {condition?.unit}
            </div>
          </div>
        )
      },
    },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      width: 100,
      render: (severity) => {
        const sev = severities.find((s) => s.value === severity)
        return <Tag color={sev?.color}>{sev?.label}</Tag>
      },
    },
    {
      title: "Channels",
      dataIndex: "channels",
      key: "channels",
      width: 150,
      render: (channels) => (
        <Space wrap>
          {channels.map((channel) => {
            const ch = notificationChannels.find((c) => c.value === channel)
            return (
              <Tooltip key={channel} title={ch?.label}>
                <span style={{ fontSize: 16 }}>{ch?.icon}</span>
              </Tooltip>
            )
          })}
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "enabled",
      key: "enabled",
      width: 80,
      render: (enabled, record) => (
        <Switch
          size="small"
          checked={enabled}
          onChange={(checked) => handleToggleAlert(record.id, checked)}
          checkedChildren={<CheckCircleOutlined />}
          unCheckedChildren={<CloseCircleOutlined />}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditAlert(record)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDeleteAlert(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Modal
        title="Service Alert Configuration"
        open={visible}
        onCancel={onCancel}
        footer={[
          <Button key="cancel" onClick={onCancel}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => onSave({ serviceAlerts, globalAlerts })}
          >
            Save All Configurations
          </Button>,
        ]}
        width={1200}
        style={{ top: 20 }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Service-Specific Alerts" key="services">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Alert
                  message="Service Alert Configuration"
                  description="Configure custom alert rules for individual microservices. Each service can have multiple alert conditions with different thresholds and notification channels."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              </Col>
              <Col span={24}>
                <Card title="Services Overview" size="small">
                  <Table
                    dataSource={services}
                    columns={serviceColumns}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    scroll={{ y: 200 }}
                  />
                </Card>
              </Col>
              <Col span={24}>
                <Card
                  title="Service Alert Rules"
                  size="small"
                  extra={
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setSelectedService(null)
                        setEditingAlert(null)
                        form.resetFields()
                        setAlertRuleVisible(true)
                      }}
                    >
                      Add Global Alert
                    </Button>
                  }
                >
                  <Table
                    dataSource={serviceAlerts}
                    columns={alertColumns}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 10 }}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Global System Alerts" key="global">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Alert
                  message="Global System Alerts"
                  description="Configure system-wide alert rules that monitor overall system health, performance metrics, and cross-service conditions."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              </Col>
              <Col span={24}>
                <Card
                  title="Global Alert Rules"
                  size="small"
                  extra={
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setSelectedService(null)
                        setEditingAlert(null)
                        form.resetFields()
                        setAlertRuleVisible(true)
                      }}
                    >
                      Add Global Alert
                    </Button>
                  }
                >
                  <Table
                    dataSource={globalAlerts}
                    columns={alertColumns}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 10 }}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Notification Settings" key="notifications">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Alert
                  message="Notification Channel Configuration"
                  description="Configure notification channels and delivery settings for alert notifications."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              </Col>
              <Col span={12}>
                <Card title="Email Settings" size="small">
                  <Form layout="vertical" size="small">
                    <Form.Item label="SMTP Server">
                      <Input placeholder="smtp.company.com" />
                    </Form.Item>
                    <Form.Item label="Port">
                      <InputNumber placeholder="587" style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item label="Username">
                      <Input placeholder="alerts@company.com" />
                    </Form.Item>
                    <Form.Item label="Recipients">
                      <Select mode="tags" placeholder="Add email addresses">
                        <Option value="admin@company.com">admin@company.com</Option>
                        <Option value="ops@company.com">ops@company.com</Option>
                      </Select>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Slack Settings" size="small">
                  <Form layout="vertical" size="small">
                    <Form.Item label="Webhook URL">
                      <Input.Password placeholder="https://hooks.slack.com/..." />
                    </Form.Item>
                    <Form.Item label="Channel">
                      <Input placeholder="#alerts" />
                    </Form.Item>
                    <Form.Item label="Username">
                      <Input placeholder="ThingsBoard Alerts" />
                    </Form.Item>
                    <Form.Item label="Test Connection">
                      <Button type="dashed" block>
                        Send Test Message
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Modal>

      {/* Alert Rule Configuration Modal */}
      <Modal
        title={`${editingAlert ? "Edit" : "Create"} Alert Rule${selectedService ? ` - ${selectedService.name}` : ""}`}
        open={alertRuleVisible}
        onCancel={() => {
          setAlertRuleVisible(false)
          setEditingAlert(null)
          form.resetFields()
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setAlertRuleVisible(false)
              setEditingAlert(null)
              form.resetFields()
            }}
          >
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={() => form.submit()}>
            {editingAlert ? "Update" : "Create"} Alert
          </Button>,
        ]}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveAlert}>
          <Form.Item name="name" label="Alert Name" rules={[{ required: true, message: "Please enter alert name" }]}>
            <Input placeholder="e.g., High CPU Usage Alert" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="Describe when this alert should trigger" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="condition"
                label="Condition"
                rules={[{ required: true, message: "Please select condition" }]}
              >
                <Select placeholder="Select condition">
                  {alertConditions.map((condition) => (
                    <Option key={condition.value} value={condition.value}>
                      {condition.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="operator"
                label="Operator"
                rules={[{ required: true, message: "Please select operator" }]}
              >
                <Select placeholder="Select operator">
                  {operators.map((op) => (
                    <Option key={op.value} value={op.value}>
                      {op.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="threshold"
                label="Threshold"
                rules={[{ required: true, message: "Please enter threshold" }]}
              >
                <InputNumber placeholder="80" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="severity" label="Severity" rules={[{ required: true, message: "Please select severity" }]}>
            <Select placeholder="Select severity">
              {severities.map((sev) => (
                <Option key={sev.value} value={sev.value}>
                  <Tag color={sev.color}>{sev.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="channels"
            label="Notification Channels"
            rules={[{ required: true, message: "Please select at least one channel" }]}
          >
            <Select mode="multiple" placeholder="Select notification channels">
              {notificationChannels.map((channel) => (
                <Option key={channel.value} value={channel.value}>
                  {channel.icon} {channel.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="enabled" label="Enable Alert" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default ServiceAlertConfig