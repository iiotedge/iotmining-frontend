"use client"

import { useState } from "react"
import {
  Modal,
  Steps,
  Card,
  Form,
  Input,
  Select,
  TreeSelect,
  DatePicker,
  Checkbox,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  Divider,
  Alert,
  Transfer,
  Table,
  Switch,
} from "antd"
import { DatabaseOutlined, BarChartOutlined, SettingOutlined, EyeOutlined, SaveOutlined } from "@ant-design/icons"

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select
const { RangePicker } = DatePicker
const { Step } = Steps

const ReportBuilderModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedMetrics, setSelectedMetrics] = useState([])
  const [selectedDevices, setSelectedDevices] = useState([])

  const steps = [
    {
      title: "Data Sources",
      icon: <DatabaseOutlined />,
      description: "Select devices and data sources",
    },
    {
      title: "Metrics",
      icon: <BarChartOutlined />,
      description: "Choose metrics and calculations",
    },
    {
      title: "Configuration",
      icon: <SettingOutlined />,
      description: "Configure report settings",
    },
    {
      title: "Preview",
      icon: <EyeOutlined />,
      description: "Preview and save report",
    },
  ]

  const availableMetrics = [
    { key: "temperature", title: "Temperature", category: "Environmental" },
    { key: "humidity", title: "Humidity", category: "Environmental" },
    { key: "pressure", title: "Pressure", category: "Environmental" },
    { key: "energy", title: "Energy Consumption", category: "Power" },
    { key: "voltage", title: "Voltage", category: "Power" },
    { key: "current", title: "Current", category: "Power" },
    { key: "uptime", title: "Uptime", category: "Performance" },
    { key: "responseTime", title: "Response Time", category: "Performance" },
    { key: "throughput", title: "Throughput", category: "Performance" },
    { key: "errorRate", title: "Error Rate", category: "Performance" },
    { key: "alarmCount", title: "Alarm Count", category: "Alerts" },
    { key: "warningCount", title: "Warning Count", category: "Alerts" },
  ]

  const deviceTreeData = [
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
            { title: "Temperature Sensor 001", value: "temp-001", key: "temp-001" },
            { title: "Pressure Sensor 001", value: "press-001", key: "press-001" },
            { title: "Motor Controller 001", value: "motor-001", key: "motor-001" },
          ],
        },
        {
          title: "Production Line B",
          value: "line-b",
          key: "line-b",
          children: [
            { title: "Temperature Sensor 002", value: "temp-002", key: "temp-002" },
            { title: "Pressure Sensor 002", value: "press-002", key: "press-002" },
            { title: "Motor Controller 002", value: "motor-002", key: "motor-002" },
          ],
        },
        {
          title: "HVAC System",
          value: "hvac",
          key: "hvac",
          children: [
            { title: "Air Temperature Sensor", value: "air-temp", key: "air-temp" },
            { title: "Humidity Sensor", value: "humidity", key: "humidity" },
            { title: "Air Quality Sensor", value: "air-quality", key: "air-quality" },
          ],
        },
      ],
    },
  ]

  const handleNext = () => {
    setCurrentStep(currentStep + 1)
  }

  const handlePrev = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      const newReport = {
        id: Date.now().toString(),
        name: values.name,
        type: "custom",
        status: "scheduled",
        devices: selectedDevices,
        metrics: selectedMetrics,
        createdBy: "Current User",
        createdAt: new Date().toISOString(),
        ...values,
      }

      setTimeout(() => {
        onSuccess(newReport)
        form.resetFields()
        setCurrentStep(0)
        setSelectedMetrics([])
        setSelectedDevices([])
        setLoading(false)
      }, 1000)
    } catch (error) {
      setLoading(false)
    }
  }

  const renderDataSourcesStep = () => (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Alert
        message="Select Data Sources"
        description="Choose the devices and systems you want to include in your report."
        type="info"
        showIcon
      />

      <Form.Item
        name="devices"
        label="Select Devices"
        rules={[{ required: true, message: "Please select at least one device" }]}
      >
        <TreeSelect
          treeData={deviceTreeData}
          placeholder="Select devices and systems"
          treeCheckable
          showCheckedStrategy={TreeSelect.SHOW_PARENT}
          style={{ width: "100%" }}
          onChange={setSelectedDevices}
        />
      </Form.Item>

      <Form.Item
        name="dateRange"
        label="Data Time Range"
        rules={[{ required: true, message: "Please select date range" }]}
      >
        <RangePicker style={{ width: "100%" }} showTime />
      </Form.Item>

      <Form.Item name="dataResolution" label="Data Resolution">
        <Select placeholder="Select data resolution">
          <Option value="1m">1 Minute</Option>
          <Option value="5m">5 Minutes</Option>
          <Option value="15m">15 Minutes</Option>
          <Option value="1h">1 Hour</Option>
          <Option value="1d">1 Day</Option>
        </Select>
      </Form.Item>
    </Space>
  )

  const renderMetricsStep = () => {
    const metricsTransferData = availableMetrics.map((metric) => ({
      key: metric.key,
      title: metric.title,
      description: metric.category,
    }))

    return (
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Alert
          message="Select Metrics"
          description="Choose the metrics and calculations you want to include in your report."
          type="info"
          showIcon
        />

        <Transfer
          dataSource={metricsTransferData}
          targetKeys={selectedMetrics}
          onChange={setSelectedMetrics}
          render={(item) => `${item.title} (${item.description})`}
          titles={["Available Metrics", "Selected Metrics"]}
          style={{ width: "100%" }}
        />

        <Form.Item name="aggregations" label="Aggregation Functions">
          <Checkbox.Group>
            <Row>
              <Col span={8}>
                <Checkbox value="avg">Average</Checkbox>
              </Col>
              <Col span={8}>
                <Checkbox value="min">Minimum</Checkbox>
              </Col>
              <Col span={8}>
                <Checkbox value="max">Maximum</Checkbox>
              </Col>
              <Col span={8}>
                <Checkbox value="sum">Sum</Checkbox>
              </Col>
              <Col span={8}>
                <Checkbox value="count">Count</Checkbox>
              </Col>
              <Col span={8}>
                <Checkbox value="stddev">Std Deviation</Checkbox>
              </Col>
            </Row>
          </Checkbox.Group>
        </Form.Item>

        <Form.Item name="groupBy" label="Group By">
          <Select mode="multiple" placeholder="Group data by">
            <Option value="device">Device</Option>
            <Option value="location">Location</Option>
            <Option value="type">Device Type</Option>
            <Option value="hour">Hour</Option>
            <Option value="day">Day</Option>
            <Option value="week">Week</Option>
          </Select>
        </Form.Item>
      </Space>
    )
  }

  const renderConfigurationStep = () => (
    <Form form={form} layout="vertical">
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Alert
          message="Report Configuration"
          description="Configure the report format, scheduling, and delivery options."
          type="info"
          showIcon
        />

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="name"
              label="Report Name"
              rules={[{ required: true, message: "Please enter report name" }]}
            >
              <Input placeholder="Enter report name" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="format"
              label="Output Format"
              rules={[{ required: true, message: "Please select format" }]}
            >
              <Select placeholder="Select format">
                <Option value="PDF">PDF</Option>
                <Option value="Excel">Excel</Option>
                <Option value="CSV">CSV</Option>
                <Option value="JSON">JSON</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="Description">
          <TextArea rows={3} placeholder="Enter report description" />
        </Form.Item>

        <Divider>Visualization Options</Divider>

        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Form.Item name="includeCharts" label="Include Charts" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="includeTables" label="Include Tables" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="includeStatistics" label="Include Statistics" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="includeRawData" label="Include Raw Data" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="chartTypes" label="Chart Types">
          <Checkbox.Group>
            <Row>
              <Col span={8}>
                <Checkbox value="line">Line Charts</Checkbox>
              </Col>
              <Col span={8}>
                <Checkbox value="bar">Bar Charts</Checkbox>
              </Col>
              <Col span={8}>
                <Checkbox value="pie">Pie Charts</Checkbox>
              </Col>
              <Col span={8}>
                <Checkbox value="scatter">Scatter Plots</Checkbox>
              </Col>
              <Col span={8}>
                <Checkbox value="heatmap">Heat Maps</Checkbox>
              </Col>
              <Col span={8}>
                <Checkbox value="gauge">Gauges</Checkbox>
              </Col>
            </Row>
          </Checkbox.Group>
        </Form.Item>

        <Divider>Delivery Options</Divider>

        <Form.Item name="recipients" label="Email Recipients">
          <Select mode="tags" placeholder="Enter email addresses" style={{ width: "100%" }} />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="schedule" label="Schedule">
              <Select placeholder="Select schedule">
                <Option value="manual">Manual</Option>
                <Option value="daily">Daily</Option>
                <Option value="weekly">Weekly</Option>
                <Option value="monthly">Monthly</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="timezone" label="Timezone">
              <Select placeholder="Select timezone">
                <Option value="UTC">UTC</Option>
                <Option value="America/New_York">Eastern Time</Option>
                <Option value="America/Los_Angeles">Pacific Time</Option>
                <Option value="Europe/London">London</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Space>
    </Form>
  )

  const renderPreviewStep = () => (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Alert
        message="Report Preview"
        description="Review your report configuration before saving."
        type="success"
        showIcon
      />

      <Card title="Report Summary" size="small">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Space direction="vertical" size="small">
              <Text strong>Selected Devices:</Text>
              <div>
                {selectedDevices.slice(0, 3).map((device) => (
                  <Tag key={device}>{device}</Tag>
                ))}
                {selectedDevices.length > 3 && <Tag>+{selectedDevices.length - 3} more</Tag>}
              </div>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" size="small">
              <Text strong>Selected Metrics:</Text>
              <div>
                {selectedMetrics.slice(0, 3).map((metric) => (
                  <Tag key={metric} color="blue">
                    {metric}
                  </Tag>
                ))}
                {selectedMetrics.length > 3 && <Tag color="blue">+{selectedMetrics.length - 3} more</Tag>}
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title="Configuration" size="small">
        <Table
          size="small"
          pagination={false}
          showHeader={false}
          dataSource={[
            { key: "Format", value: form.getFieldValue("format") || "Not specified" },
            { key: "Schedule", value: form.getFieldValue("schedule") || "Manual" },
            { key: "Charts", value: form.getFieldValue("includeCharts") ? "Yes" : "No" },
            { key: "Recipients", value: form.getFieldValue("recipients")?.length || 0 },
          ]}
          columns={[
            { dataIndex: "key", width: 120, render: (text) => <Text strong>{text}:</Text> },
            { dataIndex: "value" },
          ]}
        />
      </Card>
    </Space>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderDataSourcesStep()
      case 1:
        return renderMetricsStep()
      case 2:
        return renderConfigurationStep()
      case 3:
        return renderPreviewStep()
      default:
        return null
    }
  }

  return (
    <Modal
      title="Report Builder"
      open={visible}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        currentStep > 0 && (
          <Button key="prev" onClick={handlePrev}>
            Previous
          </Button>
        ),
        currentStep < steps.length - 1 ? (
          <Button key="next" type="primary" onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button key="save" type="primary" loading={loading} onClick={handleSubmit} icon={<SaveOutlined />}>
            Save Report
          </Button>
        ),
      ]}
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map((step) => (
          <Step key={step.title} title={step.title} description={step.description} icon={step.icon} />
        ))}
      </Steps>

      {renderStepContent()}
    </Modal>
  )
}

export default ReportBuilderModal
