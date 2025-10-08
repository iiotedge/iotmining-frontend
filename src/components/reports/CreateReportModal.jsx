"use client"

import { useMemo, useState } from "react"
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Switch,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  Checkbox,
  Radio,
  TreeSelect,
  Button,
  Upload,
  message,
  theme as antdTheme,
} from "antd"
import {
  FileTextOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TableOutlined,
  UploadOutlined,
} from "@ant-design/icons"

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select
const { RangePicker } = DatePicker

const CreateReportModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [reportType, setReportType] = useState("")
  const [loading, setLoading] = useState(false)
  const { token } = antdTheme.useToken()

  // ---- DATA ----
  const reportTypes = useMemo(() => ([
    {
      key: "performance",
      title: "Device Performance Report",
      description: "Analyze device performance metrics, uptime, and efficiency",
      icon: <BarChartOutlined />,
      color: "#1890ff",
    },
    {
      key: "energy",
      title: "Energy Consumption Report",
      description: "Track energy usage patterns and optimization opportunities",
      icon: <LineChartOutlined />,
      color: "#52c41a",
    },
    {
      key: "alarms",
      title: "Alarm & Alert Report",
      description: "Summary of system alarms, alerts, and their resolution status",
      icon: <FileTextOutlined />,
      color: "#faad14",
    },
    {
      key: "production",
      title: "Production Efficiency Report",
      description: "Production metrics, throughput, and efficiency analysis",
      icon: <PieChartOutlined />,
      color: "#722ed1",
    },
    {
      key: "assets",
      title: "Asset Utilization Report",
      description: "Asset usage, maintenance schedules, and lifecycle analysis",
      icon: <TableOutlined />,
      color: "#eb2f96",
    },
    {
      key: "compliance",
      title: "Compliance Report",
      description: "Regulatory compliance status and audit trails",
      icon: <FileTextOutlined />,
      color: "#13c2c2",
    },
    {
      key: "maintenance",
      title: "Maintenance Report",
      description: "Maintenance activities, schedules, and equipment health",
      icon: <BarChartOutlined />,
      color: "#fa8c16",
    },
    {
      key: "custom",
      title: "Custom Report",
      description: "Build a custom report with specific data sources and metrics",
      icon: <TableOutlined />,
      color: "#595959",
    },
  ]), [])

  const deviceTreeData = useMemo(() => ([
    {
      title: "All Devices",
      value: "all",
      key: "all",
      children: [
        {
          title: "Production Line A",
          value: "line-a",
          key: "line-a",
          children: [
            { title: "Sensor 001", value: "sensor-001", key: "sensor-001" },
            { title: "Sensor 002", value: "sensor-002", key: "sensor-002" },
            { title: "Motor 001", value: "motor-001", key: "motor-001" },
          ],
        },
        {
          title: "Production Line B",
          value: "line-b",
          key: "line-b",
          children: [
            { title: "Sensor 003", value: "sensor-003", key: "sensor-003" },
            { title: "Sensor 004", value: "sensor-004", key: "sensor-004" },
            { title: "Motor 002", value: "motor-002", key: "motor-002" },
          ],
        },
        {
          title: "HVAC System",
          value: "hvac",
          key: "hvac",
          children: [
            { title: "Temperature Sensor", value: "temp-001", key: "temp-001" },
            { title: "Humidity Sensor", value: "hum-001", key: "hum-001" },
            { title: "Air Quality Sensor", value: "air-001", key: "air-001" },
          ],
        },
      ],
    },
  ]), [])

  // ---- ACTIONS ----
  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      const newReport = {
        id: Date.now().toString(),
        name: values.name,
        type: reportType,
        status: "scheduled",
        schedule: values.schedule || "manual",
        format: values.format,
        recipients: values.recipients || [],
        createdBy: "Current User",
        createdAt: new Date().toISOString(),
        description: values.description,
        ...values,
      }

      setTimeout(() => {
        onSuccess(newReport)
        form.resetFields()
        setCurrentStep(0)
        setReportType("")
        setLoading(false)
      }, 600)
    } catch {
      setLoading(false)
      message.error("Please fill in all required fields")
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setCurrentStep(0)
    setReportType("")
    onCancel()
  }

  // ---- UI HELPERS ----
  const SelectedCard = ({ active, color, children, onClick }) => (
    <Card
      hoverable
      onClick={onClick}
      role="button"
      aria-pressed={active}
      style={{
        height: "100%",
        borderRadius: 12,
        padding: 8,
        border: active ? `2px solid ${color}` : `1px solid ${token.colorBorder}`,
        boxShadow: active ? token.boxShadowSecondary : "none",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
      }}
      bodyStyle={{ padding: 16 }}
    >
      {children}
    </Card>
  )

  // ---- STEPS CONTENT ----
  const renderReportTypeSelection = () => (
    <Space direction="vertical" size="small" style={{ width: "100%" }}>
      <div>
        <Title level={4} style={{ marginBottom: 4 }}>Select Report Type</Title>
        <Text type="secondary">Choose the type of report you want to create</Text>
      </div>
      <Divider style={{ margin: "12px 0" }} />
      <Row gutter={[16, 16]}>
        {reportTypes.map((type) => (
          <Col xs={24} sm={12} md={12} lg={8} key={type.key}>
            <SelectedCard
              active={reportType === type.key}
              color={type.color}
              onClick={() => setReportType(type.key)}
            >
              <Space direction="vertical" size={8} style={{ display: "flex" }}>
                <div style={{ fontSize: 28, lineHeight: 1, color: type.color }}>
                  {type.icon}
                </div>
                <Title level={5} style={{ margin: 0 }}>{type.title}</Title>
                <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                  {type.description}
                </Text>
              </Space>
            </SelectedCard>
          </Col>
        ))}
      </Row>
    </Space>
  )

  const renderReportConfiguration = () => (
    <Form
      form={form}
      layout="vertical"
      requiredMark="optional"
      colon={false}
      initialValues={{
        schedule: "manual",
        includeCharts: true,
        includeRawData: false,
      }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="name"
            label="Report Name"
            rules={[{ required: true, message: "Please enter report name" }]}
          >
            <Input placeholder="Enter report name" allowClear />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="format"
            label="Output Format"
            rules={[{ required: true, message: "Please select output format" }]}
          >
            <Select placeholder="Select format" allowClear>
              <Option value="PDF">PDF</Option>
              <Option value="Excel">Excel</Option>
              <Option value="CSV">CSV</Option>
              <Option value="JSON">JSON</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Enter report description" />
          </Form.Item>
        </Col>
      </Row>

      <Divider style={{ margin: "8px 0 16px" }}>Data Sources</Divider>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="devices"
            label="Select Devices"
            rules={[{ required: true, message: "Please select devices" }]}
          >
            <TreeSelect
              treeData={deviceTreeData}
              placeholder="Select devices"
              treeCheckable
              showCheckedStrategy={TreeSelect.SHOW_PARENT}
              allowClear
              style={{ width: "100%" }}
              maxTagCount="responsive"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="dateRange"
            label="Date Range"
            rules={[{ required: true, message: "Please select date range" }]}
          >
            <RangePicker style={{ width: "100%" }} allowClear />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="metrics"
            label="Metrics to Include"
            rules={[{ required: true, message: "Please select metrics" }]}
          >
            <Checkbox.Group style={{ width: "100%" }}>
              <Row gutter={[12, 8]}>
                {[
                  ["temperature", "Temperature"],
                  ["humidity", "Humidity"],
                  ["pressure", "Pressure"],
                  ["energy", "Energy Consumption"],
                  ["uptime", "Uptime"],
                  ["alarms", "Alarms"],
                  ["performance", "Performance"],
                  ["efficiency", "Efficiency"],
                ].map(([value, label]) => (
                  <Col xs={12} md={8} key={value}>
                    <Checkbox value={value}>{label}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
        </Col>
      </Row>

      <Divider style={{ margin: "8px 0 16px" }}>Scheduling & Delivery</Divider>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item name="schedule" label="Schedule">
            <Radio.Group>
              <Space direction="vertical" size={8}>
                <Radio value="manual">Manual</Radio>
                <Radio value="daily">Daily</Radio>
                <Radio value="weekly">Weekly</Radio>
                <Radio value="monthly">Monthly</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="time" label="Execution Time">
            <TimePicker style={{ width: "100%" }} allowClear />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item name="recipients" label="Email Recipients">
            <Select
              mode="tags"
              placeholder="Enter email addresses"
              style={{ width: "100%" }}
              tokenSeparators={[",", " "]}
              allowClear
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="includeCharts" label="Include Charts" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="includeRawData" label="Include Raw Data" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item name="template" label="Custom Template">
            <Upload>
              <Button icon={<UploadOutlined />}>Upload Template</Button>
            </Upload>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  )

  const steps = [
    { title: "Select Type", content: renderReportTypeSelection() },
    { title: "Configure", content: renderReportConfiguration() },
  ]

  return (
    <Modal
      title="Create New Report"
      open={visible}
      onCancel={handleCancel}
      centered
      destroyOnClose
      maskClosable={false}
      width={860}
      styles={{
        header: { margin: 0, padding: "12px 16px" },
        body: { padding: 16 },
        footer: { padding: "12px 16px" },
      }}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        currentStep > 0 && (
          <Button key="back" onClick={() => setCurrentStep(0)}>
            Back
          </Button>
        ),
        currentStep === 0 ? (
          <Button
            key="next"
            type="primary"
            disabled={!reportType}
            onClick={() => setCurrentStep(1)}
          >
            Next
          </Button>
        ) : (
          <Button key="create" type="primary" loading={loading} onClick={handleSubmit}>
            Create Report
          </Button>
        ),
      ].filter(Boolean)}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {steps[currentStep].content}
      </div>
    </Modal>
  )
}

export default CreateReportModal