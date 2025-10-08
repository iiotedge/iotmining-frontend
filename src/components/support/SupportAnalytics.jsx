"use client"

import { useState } from "react"
import { Card, Row, Col, Statistic, Progress, Table, Typography, Space, Tag, Select, DatePicker, Button } from "antd"
import {
  TrophyOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  PieChartOutlined,
  DownloadOutlined,
} from "@ant-design/icons"

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const SupportAnalytics = () => {
  const [timeRange, setTimeRange] = useState("7d")
  const [selectedAgent, setSelectedAgent] = useState("all")

  // Mock analytics data
  const analyticsData = {
    totalTickets: 156,
    resolvedTickets: 128,
    avgResolutionTime: 4.2,
    customerSatisfaction: 4.6,
    responseTime: 1.8,
    escalationRate: 8.5,
    firstContactResolution: 72,
    agentUtilization: 85,
  }

  const categoryData = [
    { category: "Connectivity", count: 45, percentage: 28.8, trend: "+12%" },
    { category: "Device Issues", count: 38, percentage: 24.4, trend: "-5%" },
    { category: "Rule Chains", count: 28, percentage: 17.9, trend: "+8%" },
    { category: "Security", count: 22, percentage: 14.1, trend: "+15%" },
    { category: "Data Analytics", count: 15, percentage: 9.6, trend: "-2%" },
    { category: "Performance", count: 8, percentage: 5.1, trend: "+3%" },
  ]

  const agentPerformance = [
    {
      key: "1",
      agent: "Sarah Johnson",
      ticketsResolved: 45,
      avgResolutionTime: 3.2,
      customerRating: 4.8,
      responseTime: 1.2,
      status: "online",
    },
    {
      key: "2",
      agent: "Mike Chen",
      ticketsResolved: 38,
      avgResolutionTime: 4.1,
      customerRating: 4.6,
      responseTime: 1.5,
      status: "online",
    },
    {
      key: "3",
      agent: "Emily Davis",
      ticketsResolved: 32,
      avgResolutionTime: 3.8,
      customerRating: 4.7,
      responseTime: 1.8,
      status: "away",
    },
    {
      key: "4",
      agent: "Alex Rodriguez",
      ticketsResolved: 28,
      avgResolutionTime: 5.2,
      customerRating: 4.3,
      responseTime: 2.1,
      status: "offline",
    },
  ]

  const columns = [
    {
      title: "Agent",
      dataIndex: "agent",
      key: "agent",
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor:
                record.status === "online" ? "#52c41a" : record.status === "away" ? "#faad14" : "#d9d9d9",
            }}
          />
          <Text strong>{text}</Text>
        </div>
      ),
    },
    {
      title: "Tickets Resolved",
      dataIndex: "ticketsResolved",
      key: "ticketsResolved",
      sorter: (a, b) => a.ticketsResolved - b.ticketsResolved,
    },
    {
      title: "Avg Resolution Time",
      dataIndex: "avgResolutionTime",
      key: "avgResolutionTime",
      render: (time) => `${time}h`,
      sorter: (a, b) => a.avgResolutionTime - b.avgResolutionTime,
    },
    {
      title: "Customer Rating",
      dataIndex: "customerRating",
      key: "customerRating",
      render: (rating) => (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Text>{rating}</Text>
          <Text type="secondary">⭐</Text>
        </div>
      ),
      sorter: (a, b) => a.customerRating - b.customerRating,
    },
    {
      title: "Response Time",
      dataIndex: "responseTime",
      key: "responseTime",
      render: (time) => `${time}h`,
      sorter: (a, b) => a.responseTime - b.responseTime,
    },
  ]

  // Simple SVG Chart Components
  const SimpleBarChart = ({ data, width = 300, height = 200 }) => {
    const maxValue = Math.max(...data.map((d) => d.count))
    const barWidth = (width - 60) / data.length

    return (
      <svg width={width} height={height} style={{ overflow: "visible" }}>
        {data.map((item, index) => {
          const barHeight = (item.count / maxValue) * (height - 60)
          const x = 30 + index * barWidth + barWidth * 0.1
          const y = height - 30 - barHeight

          return (
            <g key={index}>
              <rect x={x} y={y} width={barWidth * 0.8} height={barHeight} fill="#1890ff" rx={2} />
              <text x={x + barWidth * 0.4} y={height - 10} textAnchor="middle" fontSize="10" fill="#666">
                {item.category.slice(0, 8)}
              </text>
              <text x={x + barWidth * 0.4} y={y - 5} textAnchor="middle" fontSize="10" fill="#333">
                {item.count}
              </text>
            </g>
          )
        })}
      </svg>
    )
  }

  const SimplePieChart = ({ data, width = 200, height = 200 }) => {
    const total = data.reduce((sum, item) => sum + item.count, 0)
    let currentAngle = 0
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2 - 20

    const colors = ["#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1", "#13c2c2"]

    return (
      <svg width={width} height={height}>
        {data.map((item, index) => {
          const angle = (item.count / total) * 360
          const startAngle = currentAngle
          const endAngle = currentAngle + angle
          currentAngle += angle

          const startAngleRad = (startAngle * Math.PI) / 180
          const endAngleRad = (endAngle * Math.PI) / 180

          const x1 = centerX + radius * Math.cos(startAngleRad)
          const y1 = centerY + radius * Math.sin(startAngleRad)
          const x2 = centerX + radius * Math.cos(endAngleRad)
          const y2 = centerY + radius * Math.sin(endAngleRad)

          const largeArcFlag = angle > 180 ? 1 : 0

          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            "Z",
          ].join(" ")

          return <path key={index} d={pathData} fill={colors[index % colors.length]} stroke="#fff" strokeWidth="2" />
        })}
      </svg>
    )
  }

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Title level={3}>Support Analytics</Title>
          <Space>
            <Select value={timeRange} onChange={setTimeRange} style={{ width: 120 }}>
              <Option value="7d">Last 7 days</Option>
              <Option value="30d">Last 30 days</Option>
              <Option value="90d">Last 90 days</Option>
            </Select>
            <Select value={selectedAgent} onChange={setSelectedAgent} style={{ width: 150 }}>
              <Option value="all">All Agents</Option>
              <Option value="sarah">Sarah Johnson</Option>
              <Option value="mike">Mike Chen</Option>
              <Option value="emily">Emily Davis</Option>
            </Select>
            <Button icon={<DownloadOutlined />}>Export Report</Button>
          </Space>
        </div>
      </div>

      {/* Key Metrics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Tickets"
              value={analyticsData.totalTickets}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Resolution Rate"
              value={((analyticsData.resolvedTickets / analyticsData.totalTickets) * 100).toFixed(1)}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
            <Progress
              percent={(analyticsData.resolvedTickets / analyticsData.totalTickets) * 100}
              showInfo={false}
              size="small"
              strokeColor="#52c41a"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg Resolution Time"
              value={analyticsData.avgResolutionTime}
              suffix="hours"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Customer Satisfaction"
              value={analyticsData.customerSatisfaction}
              suffix="/5.0"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg Response Time"
              value={analyticsData.responseTime}
              suffix="hours"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Escalation Rate"
              value={analyticsData.escalationRate}
              suffix="%"
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="First Contact Resolution"
              value={analyticsData.firstContactResolution}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Agent Utilization"
              value={analyticsData.agentUtilization}
              suffix="%"
              prefix={<UserOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card
            title={
              <>
                <BarChartOutlined /> Tickets by Category
              </>
            }
          >
            <SimpleBarChart data={categoryData} width={400} height={250} />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title={
              <>
                <PieChartOutlined /> Category Distribution
              </>
            }
          >
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <SimplePieChart data={categoryData} width={200} height={200} />
              <div>
                {categoryData.map((item, index) => {
                  const colors = ["#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1", "#13c2c2"]
                  return (
                    <div key={index} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          backgroundColor: colors[index % colors.length],
                          borderRadius: 2,
                        }}
                      />
                      <Text style={{ fontSize: 12 }}>
                        {item.category}: {item.percentage}%
                      </Text>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Category Breakdown */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="Category Performance">
            <Row gutter={16}>
              {categoryData.map((category, index) => (
                <Col span={4} key={index}>
                  <Card size="small">
                    <Statistic title={category.category} value={category.count} valueStyle={{ fontSize: 20 }} />
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {category.percentage}% of total
                      </Text>
                      <br />
                      <Tag color={category.trend.startsWith("+") ? "green" : "red"} size="small">
                        {category.trend}
                      </Tag>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Agent Performance */}
      <Row gutter={16}>
        <Col span={24}>
          <Card
            title={
              <>
                <UserOutlined /> Agent Performance
              </>
            }
          >
            <Table columns={columns} dataSource={agentPerformance} pagination={false} size="small" />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default SupportAnalytics