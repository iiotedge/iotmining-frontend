"use client"

import { useState, useEffect } from "react"
import {
  Modal,
  Spin,
  Card,
  Typography,
  Space,
  Tag,
  Button,
  Row,
  Col,
  Statistic,
  Table,
  Progress,
  Alert,
  Tabs,
  Empty,
} from "antd"
import {
  DownloadOutlined,
  MailOutlined,
  ShareAltOutlined,
  PrinterOutlined,
  BarChartOutlined,
  TableOutlined,
  FileTextOutlined,
} from "@ant-design/icons"
import { Line, Bar, Pie } from "@ant-design/charts"

const { Title, Text } = Typography
const { TabPane } = Tabs

const ReportPreviewModal = ({ visible, report, onCancel }) => {
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState(null)

  useEffect(() => {
    if (visible && report) {
      setLoading(true)
      // Simulate loading report data
      setTimeout(() => {
        setReportData(generateMockReportData(report.type))
        setLoading(false)
      }, 1500)
    }
  }, [visible, report])

  const generateMockReportData = (type) => {
    const baseData = {
      generatedAt: new Date().toISOString(),
      period: "2024-01-01 to 2024-01-15",
      totalDevices: 45,
      activeDevices: 42,
      alerts: 12,
      uptime: 98.5,
    }

    switch (type) {
      case "performance":
        return {
          ...baseData,
          metrics: {
            avgResponseTime: 125,
            throughput: 1250,
            errorRate: 0.02,
            availability: 99.8,
          },
          chartData: [
            { date: "2024-01-01", value: 95.2 },
            { date: "2024-01-02", value: 96.8 },
            { date: "2024-01-03", value: 94.5 },
            { date: "2024-01-04", value: 97.2 },
            { date: "2024-01-05", value: 98.1 },
            { date: "2024-01-06", value: 96.9 },
            { date: "2024-01-07", value: 99.2 },
          ],
          deviceData: [
            { device: "Sensor-001", uptime: 99.5, responseTime: 120, errors: 2 },
            { device: "Sensor-002", uptime: 98.2, responseTime: 135, errors: 5 },
            { device: "Motor-001", uptime: 97.8, responseTime: 110, errors: 3 },
            { device: "HVAC-001", uptime: 99.9, responseTime: 95, errors: 0 },
          ],
        }
      case "energy":
        return {
          ...baseData,
          metrics: {
            totalConsumption: 15420,
            peakUsage: 2850,
            avgEfficiency: 87.5,
            costSavings: 1250,
          },
          chartData: [
            { hour: "00:00", consumption: 1200 },
            { hour: "06:00", consumption: 1800 },
            { hour: "12:00", consumption: 2400 },
            { hour: "18:00", consumption: 2100 },
            { hour: "24:00", consumption: 1500 },
          ],
          distributionData: [
            { type: "HVAC", value: 45, consumption: 6939 },
            { type: "Lighting", value: 25, consumption: 3855 },
            { type: "Motors", value: 20, consumption: 3084 },
            { type: "Others", value: 10, consumption: 1542 },
          ],
        }
      default:
        return baseData
    }
  }

  const renderPerformanceReport = () => {
    if (!reportData) return null

    const lineConfig = {
      data: reportData.chartData,
      xField: "date",
      yField: "value",
      smooth: true,
      color: "#1890ff",
    }

    const deviceColumns = [
      {
        title: "Device",
        dataIndex: "device",
        key: "device",
      },
      {
        title: "Uptime (%)",
        dataIndex: "uptime",
        key: "uptime",
        render: (value) => (
          <Space>
            <Progress
              percent={value}
              size="small"
              status={value > 98 ? "success" : value > 95 ? "normal" : "exception"}
            />
            <Text>{value}%</Text>
          </Space>
        ),
      },
      {
        title: "Response Time (ms)",
        dataIndex: "responseTime",
        key: "responseTime",
      },
      {
        title: "Errors",
        dataIndex: "errors",
        key: "errors",
        render: (value) => <Tag color={value === 0 ? "green" : value < 5 ? "orange" : "red"}>{value}</Tag>,
      },
    ]

    return (
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Statistic
              title="Avg Response Time"
              value={reportData.metrics.avgResponseTime}
              suffix="ms"
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Throughput"
              value={reportData.metrics.throughput}
              suffix="req/s"
              valueStyle={{ color: "#52c41a" }}
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Error Rate"
              value={reportData.metrics.errorRate}
              suffix="%"
              precision={2}
              valueStyle={{ color: "#faad14" }}
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Availability"
              value={reportData.metrics.availability}
              suffix="%"
              precision={1}
              valueStyle={{ color: "#52c41a" }}
            />
          </Col>
        </Row>

        <Card title="Performance Trend" size="small">
          <Line {...lineConfig} height={200} />
        </Card>

        <Card title="Device Performance Details" size="small">
          <Table columns={deviceColumns} dataSource={reportData.deviceData} pagination={false} size="small" />
        </Card>
      </Space>
    )
  }

  const renderEnergyReport = () => {
    if (!reportData) return null

    const barConfig = {
      data: reportData.chartData,
      xField: "hour",
      yField: "consumption",
      color: "#52c41a",
    }

    const pieConfig = {
      data: reportData.distributionData,
      angleField: "value",
      colorField: "type",
      radius: 0.8,
      label: {
        type: "outer",
        content: "{name} {percentage}",
      },
    }

    return (
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Statistic
              title="Total Consumption"
              value={reportData.metrics.totalConsumption}
              suffix="kWh"
              valueStyle={{ color: "#52c41a" }}
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Peak Usage"
              value={reportData.metrics.peakUsage}
              suffix="kW"
              valueStyle={{ color: "#faad14" }}
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Avg Efficiency"
              value={reportData.metrics.avgEfficiency}
              suffix="%"
              precision={1}
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Cost Savings"
              value={reportData.metrics.costSavings}
              prefix="$"
              valueStyle={{ color: "#52c41a" }}
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Card title="Hourly Consumption" size="small">
              <Bar {...barConfig} height={200} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Consumption by Type" size="small">
              <Pie {...pieConfig} height={200} />
            </Card>
          </Col>
        </Row>
      </Space>
    )
  }

  const renderGenericReport = () => (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Statistic title="Total Devices" value={reportData?.totalDevices || 0} valueStyle={{ color: "#1890ff" }} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="Active Devices" value={reportData?.activeDevices || 0} valueStyle={{ color: "#52c41a" }} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="Alerts" value={reportData?.alerts || 0} valueStyle={{ color: "#faad14" }} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic
            title="Uptime"
            value={reportData?.uptime || 0}
            suffix="%"
            precision={1}
            valueStyle={{ color: "#52c41a" }}
          />
        </Col>
      </Row>

      <Alert
        message="Report Preview"
        description="This is a preview of your report. The actual report will contain more detailed data and analysis."
        type="info"
        showIcon
      />
    </Space>
  )

  const renderReportContent = () => {
    if (!reportData) return null

    switch (report?.type) {
      case "performance":
        return renderPerformanceReport()
      case "energy":
        return renderEnergyReport()
      default:
        return renderGenericReport()
    }
  }

  return (
    <Modal
      title={`Report Preview: ${report?.name}`}
      open={visible}
      onCancel={onCancel}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Close
        </Button>,
        <Button key="print" icon={<PrinterOutlined />}>
          Print
        </Button>,
        <Button key="share" icon={<ShareAltOutlined />}>
          Share
        </Button>,
        <Button key="email" icon={<MailOutlined />}>
          Email
        </Button>,
        <Button key="download" type="primary" icon={<DownloadOutlined />}>
          Download
        </Button>,
      ]}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Generating report preview...</Text>
          </div>
        </div>
      ) : (
        <div>
          {/* Report Header */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space direction="vertical" size="small">
                  <Title level={4} style={{ margin: 0 }}>
                    {report?.name}
                  </Title>
                  <Space>
                    <Tag color="blue">{report?.type?.toUpperCase()}</Tag>
                    <Tag>{report?.format}</Tag>
                    <Text type="secondary">Generated: {new Date(reportData?.generatedAt).toLocaleString()}</Text>
                  </Space>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Text type="secondary">Period:</Text>
                  <Text strong>{reportData?.period}</Text>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Report Content */}
          <Tabs defaultActiveKey="overview">
            <TabPane
              tab={
                <span>
                  <BarChartOutlined />
                  Overview
                </span>
              }
              key="overview"
            >
              {renderReportContent()}
            </TabPane>
            <TabPane
              tab={
                <span>
                  <TableOutlined />
                  Raw Data
                </span>
              }
              key="data"
            >
              <Empty description="Raw data view will be available in the full report" />
            </TabPane>
            <TabPane
              tab={
                <span>
                  <FileTextOutlined />
                  Summary
                </span>
              }
              key="summary"
            >
              <Card>
                <Space direction="vertical" size="middle">
                  <Title level={5}>Executive Summary</Title>
                  <Text>
                    This report provides a comprehensive analysis of {report?.type} metrics for the selected time
                    period. Key findings include improved performance across most devices with minimal downtime
                    recorded.
                  </Text>
                  <Title level={5}>Key Insights</Title>
                  <ul>
                    <li>Overall system performance is within acceptable parameters</li>
                    <li>No critical issues detected during the reporting period</li>
                    <li>Recommended actions have been identified for optimization</li>
                  </ul>
                  <Title level={5}>Recommendations</Title>
                  <ul>
                    <li>Continue monitoring current performance levels</li>
                    <li>Schedule preventive maintenance for identified devices</li>
                    <li>Consider capacity planning for future growth</li>
                  </ul>
                </Space>
              </Card>
            </TabPane>
          </Tabs>
        </div>
      )}
    </Modal>
  )
}

export default ReportPreviewModal
