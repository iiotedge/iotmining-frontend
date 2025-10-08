"use client"

import { useState } from "react"
import { Modal, Card, Row, Col, Typography, Space, Tag, Button, Input, Select, Empty, Tooltip, Badge } from "antd"
import {
  FileTextOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TableOutlined,
  StarOutlined,
  StarFilled,
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
} from "@ant-design/icons"

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

const ReportTemplatesModal = ({ visible, onCancel, onSelectTemplate }) => {
  const [searchText, setSearchText] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [favorites, setFavorites] = useState(["template-1", "template-3"])

  const templates = [
    {
      id: "template-1",
      name: "Daily Device Performance",
      description: "Comprehensive daily performance metrics for all connected devices",
      category: "performance",
      icon: <BarChartOutlined />,
      color: "#1890ff",
      metrics: ["Uptime", "Response Time", "Error Rate", "Throughput"],
      format: "PDF",
      schedule: "Daily",
      popular: true,
      downloads: 1250,
    },
    {
      id: "template-2",
      name: "Weekly Energy Analysis",
      description: "Energy consumption patterns and optimization recommendations",
      category: "energy",
      icon: <LineChartOutlined />,
      color: "#52c41a",
      metrics: ["Power Consumption", "Peak Usage", "Efficiency", "Cost Analysis"],
      format: "Excel",
      schedule: "Weekly",
      popular: false,
      downloads: 890,
    },
    {
      id: "template-3",
      name: "Monthly Alarm Summary",
      description: "Complete alarm analysis with resolution times and trends",
      category: "alarms",
      icon: <FileTextOutlined />,
      color: "#faad14",
      metrics: ["Alarm Count", "Resolution Time", "Severity Distribution", "Trends"],
      format: "PDF",
      schedule: "Monthly",
      popular: true,
      downloads: 2100,
    },
    {
      id: "template-4",
      name: "Production Efficiency Dashboard",
      description: "Real-time production metrics and efficiency indicators",
      category: "production",
      icon: <PieChartOutlined />,
      color: "#722ed1",
      metrics: ["Output Rate", "Quality Score", "Downtime", "OEE"],
      format: "PDF",
      schedule: "Daily",
      popular: false,
      downloads: 650,
    },
    {
      id: "template-5",
      name: "Asset Utilization Report",
      description: "Asset usage statistics and maintenance scheduling",
      category: "assets",
      icon: <TableOutlined />,
      color: "#eb2f96",
      metrics: ["Utilization Rate", "Maintenance Schedule", "Lifecycle Status", "ROI"],
      format: "Excel",
      schedule: "Weekly",
      popular: false,
      downloads: 420,
    },
    {
      id: "template-6",
      name: "Compliance Audit Report",
      description: "Regulatory compliance status and audit trail documentation",
      category: "compliance",
      icon: <FileTextOutlined />,
      color: "#13c2c2",
      metrics: ["Compliance Score", "Violations", "Audit Trail", "Corrective Actions"],
      format: "PDF",
      schedule: "Monthly",
      popular: false,
      downloads: 320,
    },
    {
      id: "template-7",
      name: "Predictive Maintenance",
      description: "Predictive maintenance insights and recommendations",
      category: "maintenance",
      icon: <BarChartOutlined />,
      color: "#fa8c16",
      metrics: ["Health Score", "Failure Prediction", "Maintenance Cost", "Recommendations"],
      format: "PDF",
      schedule: "Weekly",
      popular: true,
      downloads: 980,
    },
    {
      id: "template-8",
      name: "Executive Summary",
      description: "High-level overview for executive reporting",
      category: "executive",
      icon: <PieChartOutlined />,
      color: "#595959",
      metrics: ["KPIs", "Trends", "Alerts", "Recommendations"],
      format: "PDF",
      schedule: "Monthly",
      popular: false,
      downloads: 750,
    },
  ]

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "performance", label: "Performance" },
    { value: "energy", label: "Energy" },
    { value: "alarms", label: "Alarms" },
    { value: "production", label: "Production" },
    { value: "assets", label: "Assets" },
    { value: "compliance", label: "Compliance" },
    { value: "maintenance", label: "Maintenance" },
    { value: "executive", label: "Executive" },
  ]

  const toggleFavorite = (templateId) => {
    setFavorites((prev) => (prev.includes(templateId) ? prev.filter((id) => id !== templateId) : [...prev, templateId]))
  }

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchText.toLowerCase()) ||
      template.description.toLowerCase().includes(searchText.toLowerCase())
    const matchesCategory = filterCategory === "all" || template.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const popularTemplates = filteredTemplates.filter((t) => t.popular)
  const otherTemplates = filteredTemplates.filter((t) => !t.popular)

  const renderTemplateCard = (template) => (
    <Card
      key={template.id}
      hoverable
      style={{ height: "100%" }}
      actions={[
        <Tooltip key="preview" title="Preview">
          <Button type="text" icon={<EyeOutlined />} />
        </Tooltip>,
        <Tooltip key="use-template" title="Use Template">
          <Button type="text" onClick={() => onSelectTemplate(template)}>
            Use Template
          </Button>
        </Tooltip>,
        <Tooltip key="favorite" title={favorites.includes(template.id) ? "Remove from favorites" : "Add to favorites"}>
          <Button
            type="text"
            icon={favorites.includes(template.id) ? <StarFilled /> : <StarOutlined />}
            onClick={() => toggleFavorite(template.id)}
            style={{ color: favorites.includes(template.id) ? "#faad14" : undefined }}
          />
        </Tooltip>,
      ]}
    >
      <Card.Meta
        avatar={
          <div
            style={{
              color: template.color,
              fontSize: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: `${template.color}15`,
            }}
          >
            {template.icon}
          </div>
        }
        title={
          <Space>
            {template.name}
            {template.popular && (
              <Badge.Ribbon text="Popular" color="red">
                <div />
              </Badge.Ribbon>
            )}
          </Space>
        }
        description={
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {template.description}
            </Text>
            <div>
              <Tag color={template.color} style={{ fontSize: 10 }}>
                {template.category.toUpperCase()}
              </Tag>
              <Tag>{template.format}</Tag>
              <Tag>{template.schedule}</Tag>
            </div>
            <div style={{ fontSize: 11, color: "#999" }}>
              <DownloadOutlined /> {template.downloads} downloads
            </div>
            <div style={{ marginTop: 8 }}>
              <Text strong style={{ fontSize: 11 }}>
                Metrics:
              </Text>
              <div style={{ marginTop: 4 }}>
                {template.metrics.slice(0, 2).map((metric) => (
                  <Tag key={metric} size="small" style={{ fontSize: 10, margin: "1px" }}>
                    {metric}
                  </Tag>
                ))}
                {template.metrics.length > 2 && (
                  <Tag size="small" style={{ fontSize: 10, margin: "1px" }}>
                    +{template.metrics.length - 2} more
                  </Tag>
                )}
              </div>
            </div>
          </Space>
        }
      />
    </Card>
  )

  return (
    <Modal
      title="Report Templates"
      open={visible}
      onCancel={onCancel}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Close
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">Choose from our pre-built report templates to get started quickly</Text>
      </div>

      {/* Filters */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} md={16}>
          <Search
            placeholder="Search templates..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
        </Col>
        <Col xs={24} md={8}>
          <Select
            placeholder="Filter by category"
            style={{ width: "100%" }}
            value={filterCategory}
            onChange={setFilterCategory}
          >
            {categories.map((cat) => (
              <Option key={cat.value} value={cat.value}>
                {cat.label}
              </Option>
            ))}
          </Select>
        </Col>
      </Row>

      {filteredTemplates.length === 0 ? (
        <Empty description="No templates found" />
      ) : (
        <>
          {/* Popular Templates */}
          {popularTemplates.length > 0 && (
            <>
              <Title level={5}>Popular Templates</Title>
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {popularTemplates.map((template) => (
                  <Col xs={24} sm={12} md={8} key={template.id}>
                    {renderTemplateCard(template)}
                  </Col>
                ))}
              </Row>
            </>
          )}

          {/* Other Templates */}
          {otherTemplates.length > 0 && (
            <>
              <Title level={5}>All Templates</Title>
              <Row gutter={[16, 16]}>
                {otherTemplates.map((template) => (
                  <Col xs={24} sm={12} md={8} key={template.id}>
                    {renderTemplateCard(template)}
                  </Col>
                ))}
              </Row>
            </>
          )}
        </>
      )}
    </Modal>
  )
}

export default ReportTemplatesModal
