"use client"

import { useState, useEffect } from "react"
import { Card, Row, Col, Statistic, Button, Space, Tabs, Badge, Typography, Alert, Divider } from "antd"
import {
  ReloadOutlined,
  DownloadOutlined,
  CrownOutlined,
  MonitorOutlined,
  DatabaseOutlined,
  BellOutlined,
  UserOutlined,
  ApiOutlined,
  BugOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons"
import SystemHealthWidget from "../components/admin/SystemHealthWidget"
import LogViewerWidget from "../components/admin/LogViewerWidget"
import KibanaLogViewer from "../components/admin/KibanaLogViewer"
import ServiceAlertConfig from "../components/admin/ServiceAlertConfig"
import "../styles/super-admin.css"

const { TabPane } = Tabs
const { Title, Text } = Typography

const SuperAdminPage = () => {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [alertConfigVisible, setAlertConfigVisible] = useState(false)
  const [systemMetrics, setSystemMetrics] = useState({})
  const [activeUsers, setActiveUsers] = useState([])

  useEffect(() => {
    fetchSystemData()
    const interval = setInterval(fetchSystemData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchSystemData = async () => {
    setLoading(true)
    try {
      // Mock system metrics
      setSystemMetrics({
        totalRequests: 1250000,
        errorRate: 0.02,
        avgResponseTime: 145,
        activeConnections: 3420,
        dataProcessed: 2.4,
        uptime: 99.97,
        servicesRunning: 12,
        servicesStopped: 2,
        servicesError: 1,
      })

      // Mock active users
      setActiveUsers([
        {
          id: 1,
          name: "John Doe",
          email: "john.doe@company.com",
          role: "Admin",
          lastActive: "2 min ago",
          status: "online",
        },
        {
          id: 2,
          name: "Jane Smith",
          email: "jane.smith@company.com",
          role: "Operator",
          lastActive: "5 min ago",
          status: "online",
        },
        {
          id: 3,
          name: "Mike Johnson",
          email: "mike.j@company.com",
          role: "Viewer",
          lastActive: "1 hour ago",
          status: "away",
        },
      ])
    } catch (error) {
      console.error("Failed to fetch system data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAlertConfig = (alertConfig) => {
    console.log("Saving alert configuration:", alertConfig)
    setAlertConfigVisible(false)
    // Here you would save the alert configuration to your backend
  }

  const exportSystemReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      systemMetrics,
      activeUsers,
      // Add more system data as needed
    }

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `system-report-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="super-admin-page">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CrownOutlined style={{ fontSize: 24, color: "#722ed1" }} />
          <Title level={2} style={{ margin: 0, color: "#722ed1" }}>
            Super Admin Dashboard
          </Title>
          <Badge status="processing" text="Live Monitoring" />
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchSystemData} loading={loading}>
            Refresh
          </Button>
          <Button icon={<BellOutlined />} onClick={() => setAlertConfigVisible(true)}>
            Alert Config
          </Button>
          <Button icon={<DownloadOutlined />} onClick={exportSystemReport}>
            Export Report
          </Button>
        </Space>
      </div>

      <Alert
        message="Super Admin Access"
        description="You have full administrative access to system monitoring, logs, alerts, and user management. All actions are logged for security audit purposes."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
        closable
      />

      {/* System Health Overview */}
      <Row gutter={[16, 16]} className="metrics-row">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Requests"
              value={systemMetrics.totalRequests}
              precision={0}
              valueStyle={{ color: "#1890ff" }}
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Error Rate"
              value={systemMetrics.errorRate}
              precision={2}
              suffix="%"
              valueStyle={{ color: systemMetrics.errorRate > 1 ? "#cf1322" : "#3f8600" }}
              prefix={<BugOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg Response Time"
              value={systemMetrics.avgResponseTime}
              suffix="ms"
              valueStyle={{ color: systemMetrics.avgResponseTime > 200 ? "#cf1322" : "#3f8600" }}
              prefix={<MonitorOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="System Uptime"
              value={systemMetrics.uptime}
              precision={2}
              suffix="%"
              valueStyle={{ color: "#3f8600" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Main Content Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
        <TabPane
          tab={
            <>
              <MonitorOutlined /> System Health
            </>
          }
          key="overview"
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <SystemHealthWidget refreshInterval={30000} />
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <>
              <DatabaseOutlined /> System Logs
            </>
          }
          key="logs"
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <LogViewerWidget height={500} autoRefresh={true} refreshInterval={10000} maxLogs={2000} />
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <>
              <ApiOutlined /> Advanced Analytics
            </>
          }
          key="analytics"
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <KibanaLogViewer height={600} />
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <>
              <UserOutlined /> User Management
            </>
          }
          key="users"
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="Active Users" extra={<Text type="secondary">{activeUsers.length} users online</Text>}>
                <div style={{ minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Text type="secondary">User management interface will be implemented here</Text>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <>
              <BellOutlined /> Alert Management
            </>
          }
          key="alerts"
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card
                title="Alert Configuration"
                extra={
                  <Button type="primary" onClick={() => setAlertConfigVisible(true)}>
                    Configure Alerts
                  </Button>
                }
              >
                <div style={{ minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <BellOutlined style={{ fontSize: 48, color: "#d9d9d9", marginBottom: 16 }} />
                    <div>
                      <Text type="secondary">Configure service-specific and global system alerts</Text>
                    </div>
                    <Button type="primary" style={{ marginTop: 16 }} onClick={() => setAlertConfigVisible(true)}>
                      Open Alert Configuration
                    </Button>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Service Alert Configuration Modal */}
      <ServiceAlertConfig
        visible={alertConfigVisible}
        onCancel={() => setAlertConfigVisible(false)}
        onSave={handleSaveAlertConfig}
      />
    </div>
  )
}

export default SuperAdminPage