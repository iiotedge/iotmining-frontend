"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Card,
  Progress,
  Row,
  Col,
  Statistic,
  Badge,
  Alert,
  Button,
  Tooltip,
  Segmented,
  Select,
  Tag,
  Space,
  Typography,
  Table,
  Divider,
} from "antd"
import {
  DatabaseOutlined,
  CloudServerOutlined,
  GlobalOutlined,
  MonitorOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  ApiOutlined,
  ClusterOutlined,
  DeploymentUnitOutlined,
  LineChartOutlined,
} from "@ant-design/icons"

const { Option } = Select
const { Text } = Typography

/**
 * SystemHealthWidget
 * - Shows overall infrastructure health (CPU / Memory / Disk / Network / DB / Services)
 * - Shows per-service health cards & a compact table
 * - Works for microservices AND monolith. If services.length === 1, it's treated like monolith.
 *
 * Props:
 *  - refreshInterval?: number (ms)
 *  - initialServices?: ServiceHealth[] (optional external data injection)
 *
 * ServiceHealth shape:
 * {
 *   name: string,
 *   type: 'microservice' | 'monolith',
 *   version: string,
 *   region: string,
 *   instances: number,
 *   status: 'healthy' | 'degraded' | 'down',
 *   cpu: number,        // %
 *   memory: number,     // %
 *   disk: number,       // %
 *   network: number,    // %
 *   rpm: number,        // requests per minute (used for weighted rollups)
 *   latencyP50: number, // ms
 *   latencyP95: number, // ms
 *   errorRate: number,  // %
 *   uptime: number,     // %
 *   dependencies: string[]
 * }
 */

const SystemHealthWidget = ({ refreshInterval = 30000, initialServices }) => {
  const [services, setServices] = useState(initialServices || [])
  const [db, setDb] = useState({ status: "connected", responseTime: 18 }) // DB health
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [view, setView] = useState("Overview") // Overview | Services
  const [regionFilter, setRegionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // --- Mock fetch (replace with your real health endpoints) ---
  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, refreshInterval)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshInterval])

  const fetchAll = async () => {
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 600))

      // If external data is not provided, build mock
      if (!initialServices) {
        const regions = ["us-east-1", "eu-west-1", "ap-south-1"]
        const names = [
          "api-gateway",
          "auth-service",
          "device-service",
          "rule-engine",
          "data-processor",
          "notifications",
        ]
        const mock = names.map((name, i) => ({
          name,
          type: "microservice",
          version: `v${1 + (i % 2)}.${(3 + i) % 10}.${(7 + i) % 10}`,
          region: regions[i % regions.length],
          instances: Math.floor(Math.random() * 3) + 2,
          status: Math.random() > 0.95 ? "down" : Math.random() > 0.85 ? "degraded" : "healthy",
          cpu: Math.floor(Math.random() * 40) + 30,
          memory: Math.floor(Math.random() * 35) + 40,
          disk: Math.floor(Math.random() * 25) + 35,
          network: Math.floor(Math.random() * 45) + 25,
          rpm: Math.floor(Math.random() * 900) + 100,
          latencyP50: Math.floor(Math.random() * 80) + 30,
          latencyP95: Math.floor(Math.random() * 200) + 90,
          errorRate: Math.random() > 0.9 ? Math.random() * 8 + 2 : Math.random() * 2, // spikes sometimes
          uptime: Math.floor(Math.random() * 2) + 98, // 98-100%
          dependencies: ["redis-cache", "postgres-db"].filter(() => Math.random() > 0.2),
        }))
        setServices(mock)
      }

      // DB mock
      const dbDown = Math.random() > 0.97
      setDb({
        status: dbDown ? "disconnected" : "connected",
        responseTime: dbDown ? 0 : Math.floor(Math.random() * 60) + 12,
      })

      setLastUpdate(new Date())
    } catch (e) {
      // Handle
    } finally {
      setLoading(false)
    }
  }

  // Helpers
  const statusColor = (s) => (s === "down" ? "#ff4d4f" : s === "degraded" ? "#faad14" : "#52c41a")
  const usageColor = (value) => (value > 90 ? "#ff4d4f" : value > 75 ? "#faad14" : "#52c41a")

  // Filtered services for "Services" view and for rollups
  const filteredServices = useMemo(() => {
    return services.filter((svc) => {
      const regionOk = regionFilter === "all" || svc.region === regionFilter
      const statusOk = statusFilter === "all" || svc.status === statusFilter
      return regionOk && statusOk
    })
  }, [services, regionFilter, statusFilter])

  // Overall/rollup metrics (weighted by rpm)
  const overall = useMemo(() => {
    const list = filteredServices.length ? filteredServices : services
    if (!list.length) {
      return {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0,
        latencyP50: 0,
        latencyP95: 0,
        errorRate: 0,
        rpm: 0,
        healthy: 0,
        total: 0,
      }
    }
    const totalLoad = list.reduce((sum, s) => sum + (s.rpm || 1), 0)

    const wAvg = (key) =>
      Math.round(list.reduce((sum, s) => sum + (s[key] || 0) * (s.rpm || 1), 0) / (totalLoad || 1))

    const healthy = list.filter((s) => s.status === "healthy").length
    return {
      cpu: wAvg("cpu"),
      memory: wAvg("memory"),
      disk: wAvg("disk"),
      network: wAvg("network"),
      latencyP50: wAvg("latencyP50"),
      latencyP95: wAvg("latencyP95"),
      errorRate: Number((list.reduce((sum, s) => sum + (s.errorRate || 0) * (s.rpm || 1), 0) / (totalLoad || 1)).toFixed(2)),
      rpm: list.reduce((sum, s) => sum + (s.rpm || 0), 0),
      healthy,
      total: list.length,
    }
  }, [filteredServices, services])

  const isMonolith = services.length <= 1 || services.some((s) => s.type === "monolith")

  // Critical issues alert detection
  const criticalIssues = useMemo(() => {
    const downs = services.filter((s) => s.status === "down")
    const hot = services.filter((s) => s.cpu > 90 || s.memory > 90 || s.errorRate > 5)
    const dbDown = db.status === "disconnected"
    return downs.length + hot.length + (dbDown ? 1 : 0)
  }, [services, db])

  // Table columns for service list
  const columns = [
    {
      title: "Service",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <DeploymentUnitOutlined />
          <span style={{ fontWeight: 600 }}>{text}</span>
          <Tag color="default">{record.version}</Tag>
          <Tag icon={<GlobalOutlined />} color="blue">
            {record.region}
          </Tag>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (s) => <Tag color={statusColor(s)}>{s.toUpperCase()}</Tag>,
      filters: [
        { text: "Healthy", value: "healthy" },
        { text: "Degraded", value: "degraded" },
        { text: "Down", value: "down" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "CPU",
      dataIndex: "cpu",
      key: "cpu",
      width: 120,
      render: (v) => <Progress percent={v} size="small" strokeColor={usageColor(v)} />,
      sorter: (a, b) => a.cpu - b.cpu,
    },
    {
      title: "Memory",
      dataIndex: "memory",
      key: "memory",
      width: 120,
      render: (v) => <Progress percent={v} size="small" strokeColor={usageColor(v)} />,
      sorter: (a, b) => a.memory - b.memory,
    },
    {
      title: "Err %",
      dataIndex: "errorRate",
      key: "errorRate",
      width: 90,
      render: (v) => (
        <Tag color={v > 5 ? "red" : v > 1 ? "orange" : "green"}>{v.toFixed(2)}%</Tag>
      ),
      sorter: (a, b) => a.errorRate - b.errorRate,
    },
    {
      title: "Latency (P50/P95)",
      key: "latency",
      width: 150,
      render: (_, r) => (
        <Text style={{ fontFamily: "monospace" }}>
          {r.latencyP50} / {r.latencyP95} ms
        </Text>
      ),
      sorter: (a, b) => a.latencyP95 - b.latencyP95,
    },
    {
      title: "RPM",
      dataIndex: "rpm",
      key: "rpm",
      width: 100,
      render: (v) => <Text>{v.toLocaleString()}</Text>,
      sorter: (a, b) => a.rpm - b.rpm,
    },
  ]

  // Regions for filter
  const regions = Array.from(new Set(services.map((s) => s.region))).sort()

  return (
    <Card
      title={
        <Space>
          {isMonolith ? <ApiOutlined /> : <ClusterOutlined />}
          <span>{isMonolith ? "Application Health (Monolith)" : "System Health (Microservices)"}</span>
          <Badge status="processing" text="Live" />
        </Space>
      }
      extra={
        <Space>
          <Segmented
            options={["Overview", "Services"]}
            value={view}
            onChange={setView}
          />
          <Tooltip title="Refresh">
            <Button type="text" icon={<ReloadOutlined />} loading={loading} onClick={fetchAll} />
          </Tooltip>
        </Space>
      }
    >
      {/* Alert bar */}
      {criticalIssues > 0 && (
        <Alert
          message={`${criticalIssues} Issue${criticalIssues > 1 ? "s" : ""} Detected`}
          description="Some services are down, hot, or database is disconnected. Investigate details below."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" danger onClick={() => setView("Services")}>
              View Services
            </Button>
          }
        />
      )}

      {/* Filters */}
      <Row gutter={[12, 12]} style={{ marginBottom: 8 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Space size="small">
            <Text type="secondary">Region:</Text>
            <Select
              size="small"
              style={{ minWidth: 160 }}
              value={regionFilter}
              onChange={setRegionFilter}
              allowClear={false}
            >
              <Option value="all">All regions</Option>
              {regions.map((r) => (
                <Option key={r} value={r}>
                  {r}
                </Option>
              ))}
            </Select>
          </Space>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Space size="small">
            <Text type="secondary">Status:</Text>
            <Select
              size="small"
              style={{ minWidth: 160 }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear={false}
            >
              <Option value="all">All status</Option>
              <Option value="healthy">Healthy</Option>
              <Option value="degraded">Degraded</Option>
              <Option value="down">Down</Option>
            </Select>
          </Space>
        </Col>
      </Row>

      {/* Overview */}
      {view === "Overview" && (
        <>
          {/* Overall KPI strip */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Throughput (RPM)"
                  value={overall.rpm}
                  precision={0}
                  prefix={<LineChartOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Error Rate"
                  value={overall.errorRate}
                  suffix="%"
                  precision={2}
                  valueStyle={{ color: overall.errorRate > 5 ? "#cf1322" : overall.errorRate > 1 ? "#fa8c16" : "#3f8600" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Latency P50"
                  value={overall.latencyP50}
                  suffix="ms"
                  valueStyle={{ color: overall.latencyP50 > 150 ? "#cf1322" : overall.latencyP50 > 80 ? "#fa8c16" : "#3f8600" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Latency P95"
                  value={overall.latencyP95}
                  suffix="ms"
                  valueStyle={{ color: overall.latencyP95 > 300 ? "#cf1322" : overall.latencyP95 > 200 ? "#fa8c16" : "#3f8600" }}
                />
              </Card>
            </Col>
          </Row>

          {/* Resource gauges */}
          <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" bordered>
                <Space align="center" style={{ marginBottom: 8 }}>
                  <MonitorOutlined style={{ color: "#1890ff" }} />
                  <Text strong>CPU</Text>
                </Space>
                <Progress percent={overall.cpu} strokeColor={usageColor(overall.cpu)} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" bordered>
                <Space align="center" style={{ marginBottom: 8 }}>
                  <DatabaseOutlined style={{ color: "#52c41a" }} />
                  <Text strong>Memory</Text>
                </Space>
                <Progress percent={overall.memory} strokeColor={usageColor(overall.memory)} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" bordered>
                <Space align="center" style={{ marginBottom: 8 }}>
                  <CloudServerOutlined style={{ color: "#722ed1" }} />
                  <Text strong>Disk</Text>
                </Space>
                <Progress percent={overall.disk} strokeColor={usageColor(overall.disk)} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" bordered>
                <Space align="center" style={{ marginBottom: 8 }}>
                  <GlobalOutlined style={{ color: "#fa8c16" }} />
                  <Text strong>Network</Text>
                </Space>
                <Progress percent={overall.network} strokeColor={usageColor(overall.network)} />
              </Card>
            </Col>
          </Row>

          {/* DB + Service availability */}
          <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
            <Col xs={24} md={12}>
              <Card size="small">
                <Statistic
                  title="Database"
                  value={db.status}
                  valueStyle={{
                    color: db.status === "connected" ? "#3f8600" : "#cf1322",
                    textTransform: "capitalize",
                  }}
                  prefix={db.status === "connected" ? <CheckCircleOutlined /> : <WarningOutlined />}
                  suffix={db.status === "connected" ? `(${db.responseTime}ms)` : ""}
                />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small">
                <Statistic
                  title="Services Healthy"
                  value={`${overall.healthy}/${overall.total}`}
                  valueStyle={{ color: overall.healthy === overall.total ? "#3f8600" : "#faad14" }}
                  prefix={overall.healthy === overall.total ? <CheckCircleOutlined /> : <WarningOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* Compact services table (top offenders) */}
          <Divider style={{ margin: "16px 0" }} />
          <Text strong>Top Risky Services</Text>
          <Table
            style={{ marginTop: 8 }}
            dataSource={[...filteredServices]
              .sort((a, b) => b.errorRate - a.errorRate || b.latencyP95 - a.latencyP95)
              .slice(0, 5)}
            columns={columns}
            rowKey={(r) => r.name}
            size="small"
            pagination={false}
            scroll={{ x: 900 }}
          />
        </>
      )}

      {/* Per-service view */}
      {view === "Services" && (
        <>
          <Row gutter={[16, 16]}>
            {filteredServices.map((svc) => (
              <Col xs={24} md={12} lg={8} key={`${svc.name}-${svc.region}`}>
                <Card
                  size="small"
                  title={
                    <Space wrap>
                      <DeploymentUnitOutlined />
                      <Text strong>{svc.name}</Text>
                      <Tag color="default">{svc.version}</Tag>
                      <Tag icon={<GlobalOutlined />} color="blue">
                        {svc.region}
                      </Tag>
                      <Tag color={statusColor(svc.status)}>{svc.status.toUpperCase()}</Tag>
                    </Space>
                  }
                  extra={<Tag>{svc.instances} inst</Tag>}
                >
                  <Row gutter={[8, 8]}>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        CPU
                      </Text>
                      <Progress percent={svc.cpu} size="small" strokeColor={usageColor(svc.cpu)} />
                    </Col>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Memory
                      </Text>
                      <Progress percent={svc.memory} size="small" strokeColor={usageColor(svc.memory)} />
                    </Col>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Disk
                      </Text>
                      <Progress percent={svc.disk} size="small" strokeColor={usageColor(svc.disk)} />
                    </Col>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Network
                      </Text>
                      <Progress percent={svc.network} size="small" strokeColor={usageColor(svc.network)} />
                    </Col>
                  </Row>

                  <Divider style={{ margin: "10px 0" }} />

                  <Row gutter={[8, 8]}>
                    <Col span={12}>
                      <Statistic title="RPM" value={svc.rpm} valueStyle={{ fontSize: 16 }} />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Error Rate"
                        value={svc.errorRate}
                        suffix="%"
                        precision={2}
                        valueStyle={{ color: svc.errorRate > 5 ? "#cf1322" : svc.errorRate > 1 ? "#fa8c16" : "#3f8600" }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Latency P50" value={svc.latencyP50} suffix="ms" valueStyle={{ fontSize: 16 }} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Latency P95" value={svc.latencyP95} suffix="ms" valueStyle={{ fontSize: 16 }} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Uptime" value={svc.uptime} suffix="%" valueStyle={{ fontSize: 16 }} />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Dependencies"
                        value={svc.dependencies.length}
                        prefix={<DatabaseOutlined />}
                        valueStyle={{ fontSize: 16 }}
                      />
                    </Col>
                  </Row>

                  {svc.dependencies?.length > 0 && (
                    <>
                      <Divider style={{ margin: "10px 0" }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Depends on:
                      </Text>
                      <div style={{ marginTop: 6 }}>
                        <Space wrap>
                          {svc.dependencies.map((d) => (
                            <Tag key={d}>{d}</Tag>
                          ))}
                        </Space>
                      </div>
                    </>
                  )}
                </Card>
              </Col>
            ))}
          </Row>

          <Divider style={{ margin: "16px 0" }} />
          <Text strong>All Services</Text>
          <Table
            style={{ marginTop: 8 }}
            dataSource={filteredServices}
            columns={columns}
            rowKey={(r) => `${r.name}-${r.region}`}
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 900 }}
          />
        </>
      )}

      <div
        style={{
          fontSize: 12,
          color: "#8c8c8c",
          textAlign: "right",
          marginTop: 12,
          borderTop: "1px solid #f0f0f0",
          paddingTop: 8,
        }}
      >
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>
    </Card>
  )
}

export default SystemHealthWidget