"use client"

import { useState, useEffect, useRef } from "react"
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  DatePicker,
  Button,
  Table,
  Tag,
  Space,
  Tooltip,
  Modal,
  Typography,
  Tabs,
  Statistic,
  Progress,
  Badge,
  Divider,
  Collapse,
  Switch,
  Slider,
  AutoComplete,
  Form, // <-- use Ant Design's Form
} from "antd"
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FullscreenOutlined,
  FilterOutlined,
  BarChartOutlined,
  TableOutlined,
  EyeOutlined,
  SaveOutlined,
  BugOutlined,
  DatabaseOutlined,
} from "@ant-design/icons"
import { Line, Pie } from "@ant-design/charts"
import dayjs from "dayjs"

const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs
const { Text, Title } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const KibanaLogViewer = ({ height = 600 }) => {
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState("table") // table, chart, analytics
  const [selectedLog, setSelectedLog] = useState(null)
  const [logDetailVisible, setLogDetailVisible] = useState(false)
  const [savedSearchVisible, setSavedSearchVisible] = useState(false)
  const [queryHistory, setQueryHistory] = useState([])
  const [logAnalytics, setLogAnalytics] = useState({})
  const [fieldStats, setFieldStats] = useState({})

  // Advanced search and filtering
  const [searchQuery, setSearchQuery] = useState("")
  const [timeRange, setTimeRange] = useState([dayjs().subtract(1, "hour"), dayjs()])
  const [filters, setFilters] = useState({
    level: [],
    service: [],
    userId: [],
    ip: [],
  })
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30)

  // Query suggestions for autocomplete
  const [querySuggestions, setQuerySuggestions] = useState([])

  const intervalRef = useRef(null)

  // Mock services and log levels for filtering
  const services = [
    "device-service",
    "rule-engine",
    "auth-service",
    "data-processor",
    "notification-service",
    "api-gateway",
    "database-service",
    "mqtt-broker",
  ]

  const logLevels = ["ERROR", "WARN", "INFO", "DEBUG", "TRACE"]

  // Common query patterns for suggestions
  const commonQueries = [
    "level:ERROR",
    'service:"device-service"',
    'message:"connection timeout"',
    "userId:admin",
    'level:ERROR AND service:"auth-service"',
    "response_time:>500",
    "timestamp:[now-1h TO now]",
    "NOT level:DEBUG",
    'service:("device-service" OR "rule-engine")',
    "message:/.*timeout.*/",
  ]

  useEffect(() => {
    fetchLogs()
    generateAnalytics()

    if (autoRefresh) {
      startAutoRefresh()
    }

    return () => stopAutoRefresh()
  }, [timeRange, filters, autoRefresh, refreshInterval])

  useEffect(() => {
    applySearchAndFilters()
  }, [logs, searchQuery, filters])

  const startAutoRefresh = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(fetchLogs, refreshInterval * 1000)
  }

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const fetchLogs = async () => {
    setLoading(true)
    try {
      // Mock API call with time range
      const mockLogs = generateMockLogs(1000)
      setLogs(mockLogs)
      generateFieldStats(mockLogs)
    } catch (error) {
      console.error("Failed to fetch logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateMockLogs = (count) => {
    const logs = []
    const startTime = timeRange[0].valueOf()
    const endTime = timeRange[1].valueOf()

    for (let i = 0; i < count; i++) {
      const timestamp = new Date(startTime + Math.random() * (endTime - startTime))
      const level = logLevels[Math.floor(Math.random() * logLevels.length)]
      const service = services[Math.floor(Math.random() * services.length)]

      logs.push({
        id: `log-${i}`,
        timestamp: timestamp.toISOString(),
        level,
        service,
        message: generateLogMessage(level, service),
        userId: Math.random() > 0.3 ? `user${Math.floor(Math.random() * 50)}` : "system",
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        responseTime: Math.floor(Math.random() * 2000) + 50,
        statusCode: Math.random() > 0.1 ? 200 : Math.random() > 0.5 ? 404 : 500,
        userAgent: "Mozilla/5.0 (compatible; IoT-Device/1.0)",
        requestId: `req-${Math.random().toString(36).substr(2, 9)}`,
        sessionId: `sess-${Math.random().toString(36).substr(2, 9)}`,
        tags: generateTags(service, level),
        fields: generateCustomFields(service),
      })
    }

    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  const generateLogMessage = (level, service) => {
    const messages = {
      ERROR: [
        "Database connection failed",
        "Authentication timeout",
        "Service unavailable",
        "Invalid request format",
        "Memory allocation failed",
        "Network unreachable",
      ],
      WARN: [
        "High memory usage detected",
        "Slow query performance",
        "Rate limit approaching",
        "Deprecated API usage",
        "Configuration mismatch",
        "Cache miss ratio high",
      ],
      INFO: [
        "User login successful",
        "Data processing completed",
        "Service started",
        "Configuration updated",
        "Backup completed",
        "Health check passed",
      ],
      DEBUG: [
        "Processing telemetry batch",
        "Cache hit for key",
        "Executing query",
        "Validating permissions",
        "Parsing message",
        "Method execution",
      ],
      TRACE: [
        "Method entry",
        "Variable assignment",
        "Loop iteration",
        "Condition evaluation",
        "Function return",
        "State transition",
      ],
    }

    const levelMessages = messages[level] || messages.INFO
    return levelMessages[Math.floor(Math.random() * levelMessages.length)]
  }

  const generateTags = (service, level) => {
    const baseTags = [service, level.toLowerCase()]
    const additionalTags = ["production", "microservice", "iot", "telemetry"]
    return [...baseTags, ...additionalTags.slice(0, Math.floor(Math.random() * 3))]
  }

  const generateCustomFields = (service) => {
    const baseFields = {
      environment: "production",
      region: "us-east-1",
      version: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(
        Math.random() * 10
      )}`,
    }

    if (service === "device-service") {
      return { ...baseFields, deviceType: "sensor", protocol: "mqtt" }
    } else if (service === "api-gateway") {
      return { ...baseFields, endpoint: "/api/v1/devices", method: "GET" }
    }

    return baseFields
  }

  const generateFieldStats = (logs) => {
    const stats = {
      levels: {},
      services: {},
      users: {},
      statusCodes: {},
      responseTimeStats: {
        min: Math.min(...logs.map((l) => l.responseTime)),
        max: Math.max(...logs.map((l) => l.responseTime)),
        avg: logs.reduce((sum, l) => sum + l.responseTime, 0) / logs.length,
      },
    }

    logs.forEach((log) => {
      stats.levels[log.level] = (stats.levels[log.level] || 0) + 1
      stats.services[log.service] = (stats.services[log.service] || 0) + 1
      stats.users[log.userId] = (stats.users[log.userId] || 0) + 1
      stats.statusCodes[log.statusCode] = (stats.statusCodes[log.statusCode] || 0) + 1
    })

    setFieldStats(stats)
  }

  const generateAnalytics = () => {
    // Mock analytics data
    setLogAnalytics({
      totalLogs: 125000,
      errorRate: 2.3,
      avgResponseTime: 245,
      topErrors: [
        { message: "Database connection failed", count: 45 },
        { message: "Authentication timeout", count: 32 },
        { message: "Service unavailable", count: 28 },
      ],
      logTrends: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: Math.floor(Math.random() * 1000) + 500,
        errors: Math.floor(Math.random() * 50) + 10,
      })),
    })
  }

  const applySearchAndFilters = () => {
    let filtered = [...logs]

    // Apply search query (simplified Lucene-like syntax)
    if (searchQuery) {
      filtered = filtered.filter((log) => {
        const query = searchQuery.toLowerCase()

        // Handle field-specific searches like "level:ERROR"
        if (query.includes(":")) {
          const [field, value] = query.split(":")
          const cleanValue = value.replace(/['"]/g, "")
          return log[field]?.toString().toLowerCase().includes(cleanValue)
        }

        // General text search
        return (
          log.message.toLowerCase().includes(query) ||
          log.service.toLowerCase().includes(query) ||
          log.userId.toLowerCase().includes(query) ||
          log.level.toLowerCase().includes(query)
        )
      })
    }

    // Apply filters
    if (filters.level.length > 0) {
      filtered = filtered.filter((log) => filters.level.includes(log.level))
    }
    if (filters.service.length > 0) {
      filtered = filtered.filter((log) => filters.service.includes(log.service))
    }
    if (filters.userId.length > 0) {
      filtered = filtered.filter((log) => filters.userId.includes(log.userId))
    }

    setFilteredLogs(filtered)
  }

  const handleSearch = (value) => {
    setSearchQuery(value)
    if (value && !queryHistory.includes(value)) {
      setQueryHistory((prev) => [value, ...prev.slice(0, 9)]) // Keep last 10 queries
    }
  }

  const saveSearch = () => {
    setSavedSearchVisible(true)
  }

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `logs-${dayjs().format("YYYY-MM-DD-HH-mm")}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const logColumns = [
    {
      title: "Time",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 160,
      render: (timestamp) => (
        <Text style={{ fontSize: 12, fontFamily: "monospace" }}>{dayjs(timestamp).format("MM-DD HH:mm:ss.SSS")}</Text>
      ),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
    },
    {
      title: "Level",
      dataIndex: "level",
      key: "level",
      width: 80,
      render: (level) => {
        const colors = {
          ERROR: "red",
          WARN: "orange",
          INFO: "blue",
          DEBUG: "green",
          TRACE: "purple",
        }
        return (
          <Tag color={colors[level]} style={{ fontSize: 11 }}>
            {level}
          </Tag>
        )
      },
    },
    {
      title: "Service",
      dataIndex: "service",
      key: "service",
      width: 120,
      render: (service) => <Tag style={{ fontSize: 11 }}>{service}</Tag>,
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
      render: (message) => <Text style={{ fontSize: 12, fontFamily: "monospace" }}>{message}</Text>,
    },
    {
      title: "User",
      dataIndex: "userId",
      key: "userId",
      width: 100,
      render: (userId) => <Text style={{ fontSize: 12 }}>{userId}</Text>,
    },
    {
      title: "Response",
      dataIndex: "responseTime",
      key: "responseTime",
      width: 100,
      render: (time, record) => (
        <div>
          <Text style={{ fontSize: 11 }}>{time}ms</Text>
          <br />
          <Tag color={record.statusCode === 200 ? "green" : "red"} style={{ fontSize: 10 }}>
            {record.statusCode}
          </Tag>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 60,
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedLog(record)
              setLogDetailVisible(true)
            }}
          />
        </Tooltip>
      ),
    },
  ]

  const renderAnalyticsView = () => (
    <Row gutter={[16, 16]}>
      <Col span={6}>
        <Card size="small">
          <Statistic title="Total Logs" value={logAnalytics.totalLogs} prefix={<DatabaseOutlined />} />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="Error Rate"
            value={logAnalytics.errorRate}
            suffix="%"
            precision={1}
            valueStyle={{ color: logAnalytics.errorRate > 5 ? "#cf1322" : "#3f8600" }}
            prefix={<BugOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic title="Avg Response Time" value={logAnalytics.avgResponseTime} suffix="ms" prefix={<BarChartOutlined />} />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic title="Active Services" value={services.length} prefix={<DatabaseOutlined />} />
        </Card>
      </Col>

      <Col span={12}>
        <Card title="Log Volume Trends" size="small">
          <Line
            data={logAnalytics.logTrends || []}
            xField="hour"
            yField="count"
            height={200}
            smooth={true}
            color="#1890ff"
          />
        </Card>
      </Col>

      <Col span={12}>
        <Card title="Log Levels Distribution" size="small">
          <Pie
            data={Object.entries(fieldStats.levels || {}).map(([level, count]) => ({
              type: level,
              value: count,
            }))}
            angleField="value"
            colorField="type"
            radius={0.8}
            height={200}
          />
        </Card>
      </Col>

      <Col span={24}>
        <Card title="Service Performance Heatmap" size="small">
          <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Text type="secondary">Service performance heatmap visualization</Text>
          </div>
        </Card>
      </Col>
    </Row>
  )

  const renderFieldAnalysis = () => (
    <Row gutter={[16, 16]}>
      <Col span={8}>
        <Card title="Log Levels" size="small">
          {Object.entries(fieldStats.levels || {}).map(([level, count]) => (
            <div key={level} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Tag color={level === "ERROR" ? "red" : level === "WARN" ? "orange" : "blue"}>{level}</Tag>
                <Text>{count}</Text>
              </div>
              <Progress percent={(count / filteredLogs.length) * 100} size="small" showInfo={false} />
            </div>
          ))}
        </Card>
      </Col>

      <Col span={8}>
        <Card title="Top Services" size="small">
          {Object.entries(fieldStats.services || {})
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([service, count]) => (
              <div key={service} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text>{service}</Text>
                  <Text>{count}</Text>
                </div>
                <Progress percent={(count / filteredLogs.length) * 100} size="small" showInfo={false} />
              </div>
            ))}
        </Card>
      </Col>

      <Col span={8}>
        <Card title="Response Time Stats" size="small">
          <Statistic title="Average" value={fieldStats.responseTimeStats?.avg || 0} suffix="ms" precision={0} />
          <Divider />
          <Statistic title="Min" value={fieldStats.responseTimeStats?.min || 0} suffix="ms" />
          <Divider />
          <Statistic title="Max" value={fieldStats.responseTimeStats?.max || 0} suffix="ms" />
        </Card>
      </Col>
    </Row>
  )

  return (
    <>
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <DatabaseOutlined />
            <span>Advanced Log Analytics</span>
            <Badge count={filteredLogs.length} style={{ backgroundColor: "#52c41a" }} />
            {autoRefresh && <Badge status="processing" text="Auto-refresh" />}
          </div>
        }
        extra={
          <Space>
            <Tooltip title="Save Search">
              <Button type="text" icon={<SaveOutlined />} onClick={saveSearch} />
            </Tooltip>
            <Tooltip title="Export Logs">
              <Button type="text" icon={<DownloadOutlined />} onClick={exportLogs} />
            </Tooltip>
            <Tooltip title="Refresh">
              <Button type="text" icon={<ReloadOutlined />} loading={loading} onClick={fetchLogs} />
            </Tooltip>
            <Tooltip title="Fullscreen">
              <Button type="text" icon={<FullscreenOutlined />} />
            </Tooltip>
          </Space>
        }
      >
        {/* Search and Filter Bar */}
        <div style={{ marginBottom: 16, padding: 16, background: "#fafafa", borderRadius: 6 }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <AutoComplete
                style={{ width: "100%" }}
                options={[...commonQueries.map((q) => ({ value: q })), ...queryHistory.map((q) => ({ value: q }))]}
                onSelect={handleSearch}
                onSearch={setSearchQuery}
                placeholder='Search logs (e.g., level:ERROR, service:"device-service", message:timeout)'
              >
                <Input
                  prefix={<SearchOutlined />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onPressEnter={(e) => handleSearch(e.target.value)}
                />
              </AutoComplete>
            </Col>
            <Col span={8}>
              <RangePicker
                value={timeRange}
                onChange={setTimeRange}
                showTime
                style={{ width: "100%" }}
                ranges={{
                  "Last 15 minutes": [dayjs().subtract(15, "minute"), dayjs()],
                  "Last hour": [dayjs().subtract(1, "hour"), dayjs()],
                  "Last 4 hours": [dayjs().subtract(4, "hour"), dayjs()],
                  "Last 24 hours": [dayjs().subtract(1, "day"), dayjs()],
                }}
              />
            </Col>
            <Col span={4}>
              <Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Auto-refresh:
                </Text>
                <Switch size="small" checked={autoRefresh} onChange={setAutoRefresh} />
                {autoRefresh && (
                  <Select size="small" value={refreshInterval} onChange={setRefreshInterval} style={{ width: 80 }}>
                    <Option value={10}>10s</Option>
                    <Option value={30}>30s</Option>
                    <Option value={60}>1m</Option>
                  </Select>
                )}
              </Space>
            </Col>
          </Row>

          {/* Advanced Filters */}
          <Collapse ghost style={{ marginTop: 8 }}>
            <Panel header="Advanced Filters" key="filters">
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Text strong>Log Level:</Text>
                  <Select
                    mode="multiple"
                    style={{ width: "100%", marginTop: 4 }}
                    placeholder="Select levels"
                    value={filters.level}
                    onChange={(value) => setFilters({ ...filters, level: value })}
                  >
                    {logLevels.map((level) => (
                      <Option key={level} value={level}>
                        {level}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={6}>
                  <Text strong>Service:</Text>
                  <Select
                    mode="multiple"
                    style={{ width: "100%", marginTop: 4 }}
                    placeholder="Select services"
                    value={filters.service}
                    onChange={(value) => setFilters({ ...filters, service: value })}
                  >
                    {services.map((service) => (
                      <Option key={service} value={service}>
                        {service}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={6}>
                  <Text strong>Response Time:</Text>
                  <Slider
                    range
                    min={0}
                    max={2000}
                    defaultValue={[0, 2000]}
                    style={{ marginTop: 8 }}
                    tooltip={{ formatter: (value) => `${value}ms` }}
                  />
                </Col>
                <Col span={6}>
                  <Text strong>Status Code:</Text>
                  <Select mode="multiple" style={{ width: "100%", marginTop: 4 }} placeholder="Select status codes">
                    <Option value={200}>200 - OK</Option>
                    <Option value={404}>404 - Not Found</Option>
                    <Option value={500}>500 - Server Error</Option>
                  </Select>
                </Col>
              </Row>
            </Panel>
          </Collapse>
        </div>

        {/* View Mode Tabs */}
        <Tabs
          activeKey={viewMode}
          onChange={setViewMode}
          tabBarExtraContent={
            <Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {filteredLogs.length} of {logs.length} logs
              </Text>
            </Space>
          }
        >
          <TabPane
            tab={
              <>
                <TableOutlined /> Logs
              </>
            }
            key="table"
          >
            <Table
              dataSource={filteredLogs}
              columns={logColumns}
              loading={loading}
              size="small"
              pagination={{
                pageSize: 50,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} logs`,
              }}
              scroll={{ y: height - 200, x: 1000 }}
              rowKey="id"
            />
          </TabPane>

          <TabPane
            tab={
              <>
                <BarChartOutlined /> Analytics
              </>
            }
            key="analytics"
          >
            {renderAnalyticsView()}
          </TabPane>

          <TabPane
            tab={
              <>
                <FilterOutlined /> Field Analysis
              </>
            }
            key="fields"
          >
            {renderFieldAnalysis()}
          </TabPane>
        </Tabs>
      </Card>

      {/* Log Detail Modal */}
      <Modal
        title="Log Details"
        open={logDetailVisible}
        onCancel={() => setLogDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setLogDetailVisible(false)}>
            Close
          </Button>,
        ]}
        width={900}
      >
        {selectedLog && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Timestamp:</Text>
                <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                  {dayjs(selectedLog.timestamp).format("YYYY-MM-DD HH:mm:ss.SSS")}
                </div>
              </Col>
              <Col span={12}>
                <Text strong>Level:</Text>
                <div>
                  <Tag color={selectedLog.level === "ERROR" ? "red" : selectedLog.level === "WARN" ? "orange" : "blue"}>
                    {selectedLog.level}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <Text strong>Service:</Text>
                <div>{selectedLog.service}</div>
              </Col>
              <Col span={12}>
                <Text strong>User:</Text>
                <div>{selectedLog.userId}</div>
              </Col>
              <Col span={12}>
                <Text strong>IP Address:</Text>
                <div>{selectedLog.ip}</div>
              </Col>
              <Col span={12}>
                <Text strong>Response Time:</Text>
                <div>{selectedLog.responseTime}ms</div>
              </Col>
              <Col span={12}>
                <Text strong>Status Code:</Text>
                <div>
                  <Tag color={selectedLog.statusCode === 200 ? "green" : "red"}>{selectedLog.statusCode}</Tag>
                </div>
              </Col>
              <Col span={12}>
                <Text strong>Request ID:</Text>
                <div style={{ fontFamily: "monospace", fontSize: 12 }}>{selectedLog.requestId}</div>
              </Col>
            </Row>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <Text strong>Message:</Text>
              <div
                style={{
                  marginTop: 8,
                  padding: 12,
                  background: "#f5f5f5",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 12,
                }}
              >
                {selectedLog.message}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Tags:</Text>
              <div style={{ marginTop: 8 }}>
                <Space wrap>
                  {selectedLog.tags?.map((tag, index) => (
                    <Tag key={index}>{tag}</Tag>
                  ))}
                </Space>
              </div>
            </div>

            <div>
              <Text strong>Custom Fields:</Text>
              <div
                style={{
                  marginTop: 8,
                  padding: 12,
                  background: "#f5f5f5",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 12,
                }}
              >
                <pre>{JSON.stringify(selectedLog.fields, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Saved Search Modal */}
      <Modal
        title="Save Search Query"
        open={savedSearchVisible}
        onCancel={() => setSavedSearchVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setSavedSearchVisible(false)}>
            Cancel
          </Button>,
          <Button key="save" type="primary">
            Save Search
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Search Name" required>
            <Input placeholder="e.g., Critical Errors in Device Service" />
          </Form.Item>
          <Form.Item label="Query">
            <TextArea value={searchQuery} rows={3} readOnly />
          </Form.Item>
          <Form.Item label="Description">
            <TextArea placeholder="Describe what this search is for..." rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default KibanaLogViewer