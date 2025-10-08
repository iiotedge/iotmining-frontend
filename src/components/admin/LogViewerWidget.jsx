"use client"

import { useState, useEffect, useRef } from "react"
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Tooltip,
  Modal,
  Typography,
  Switch,
  Badge,
  Divider,
} from "antd"
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  EyeOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  ClearOutlined,
} from "@ant-design/icons"

const { Option } = Select
const { Text } = Typography
const { TextArea } = Input

const LogViewerWidget = ({ height = 400, autoRefresh = true, refreshInterval = 5000, maxLogs = 1000 }) => {
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const [logDetailVisible, setLogDetailVisible] = useState(false)
  const [isStreaming, setIsStreaming] = useState(autoRefresh)
  const [filters, setFilters] = useState({
    search: "",
    level: "all",
    service: "all",
    timeRange: "all",
  })

  const intervalRef = useRef(null)
  const tableRef = useRef(null)

  // Mock log levels and services
  const logLevels = ["ERROR", "WARN", "INFO", "DEBUG", "TRACE"]
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

  useEffect(() => {
    fetchLogs()
    if (isStreaming) {
      startStreaming()
    }
    return () => stopStreaming()
  }, [isStreaming])

  useEffect(() => {
    applyFilters()
  }, [logs, filters])

  const startStreaming = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(fetchNewLogs, refreshInterval)
  }

  const stopStreaming = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const fetchLogs = async () => {
    setLoading(true)
    try {
      // Mock API call - replace with actual log endpoint
      const mockLogs = generateMockLogs(50)
      setLogs(mockLogs)
    } catch (error) {
      console.error("Failed to fetch logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNewLogs = async () => {
    try {
      // Simulate new logs coming in
      const newLogs = generateMockLogs(Math.floor(Math.random() * 5) + 1)
      setLogs((prevLogs) => {
        const combined = [...newLogs, ...prevLogs]
        return combined.slice(0, maxLogs) // Keep only the latest logs
      })
    } catch (error) {
      console.error("Failed to fetch new logs:", error)
    }
  }

  const generateMockLogs = (count) => {
    const logs = []
    for (let i = 0; i < count; i++) {
      const level = logLevels[Math.floor(Math.random() * logLevels.length)]
      const service = services[Math.floor(Math.random() * services.length)]
      const timestamp = new Date(Date.now() - Math.random() * 3600000) // Random time within last hour

      logs.push({
        id: Date.now() + Math.random(),
        timestamp: timestamp.toISOString(),
        level,
        service,
        message: generateLogMessage(level, service),
        details: generateLogDetails(level, service),
        userId: Math.random() > 0.5 ? "system" : `user${Math.floor(Math.random() * 100)}`,
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        traceId: `trace-${Math.random().toString(36).substr(2, 9)}`,
        spanId: `span-${Math.random().toString(36).substr(2, 9)}`,
      })
    }
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  const generateLogMessage = (level, service) => {
    const messages = {
      ERROR: [
        "Connection timeout occurred",
        "Database query failed",
        "Authentication failed",
        "Service unavailable",
        "Invalid request format",
      ],
      WARN: [
        "High memory usage detected",
        "Slow query performance",
        "Rate limit approaching",
        "Deprecated API usage",
        "Configuration mismatch",
      ],
      INFO: [
        "User login successful",
        "Data processing completed",
        "Service started successfully",
        "Configuration updated",
        "Backup completed",
      ],
      DEBUG: [
        "Processing telemetry batch",
        "Cache hit for key",
        "Executing database query",
        "Validating user permissions",
        "Parsing incoming message",
      ],
      TRACE: ["Method entry", "Variable state change", "Loop iteration", "Condition evaluation", "Function return"],
    }

    const levelMessages = messages[level] || messages.INFO
    return levelMessages[Math.floor(Math.random() * levelMessages.length)]
  }

  const generateLogDetails = (level, service) => {
    const details = {
      ERROR: `Stack trace: ${service}.processRequest() at line ${Math.floor(Math.random() * 1000)}`,
      WARN: `Threshold: ${Math.floor(Math.random() * 100)}%, Current: ${Math.floor(Math.random() * 100)}%`,
      INFO: `Duration: ${Math.floor(Math.random() * 1000)}ms, Status: Success`,
      DEBUG: `Batch size: ${Math.floor(Math.random() * 1000)} records`,
      TRACE: `Thread: ${Math.floor(Math.random() * 10)}, Memory: ${Math.floor(Math.random() * 1000)}MB`,
    }
    return details[level] || "No additional details"
  }

  const applyFilters = () => {
    let filtered = [...logs]

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        (log) =>
          log.message.toLowerCase().includes(filters.search.toLowerCase()) ||
          log.service.toLowerCase().includes(filters.search.toLowerCase()) ||
          log.userId.toLowerCase().includes(filters.search.toLowerCase()),
      )
    }

    // Level filter
    if (filters.level !== "all") {
      filtered = filtered.filter((log) => log.level === filters.level)
    }

    // Service filter
    if (filters.service !== "all") {
      filtered = filtered.filter((log) => log.service === filters.service)
    }

    setFilteredLogs(filtered)
  }

  const clearLogs = () => {
    Modal.confirm({
      title: "Clear All Logs",
      content: "Are you sure you want to clear all logs? This action cannot be undone.",
      onOk: () => {
        setLogs([])
        setFilteredLogs([])
      },
    })
  }

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `logs-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 160,
      render: (timestamp) => <Text style={{ fontSize: 12 }}>{new Date(timestamp).toLocaleString()}</Text>,
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
      filters: logLevels.map((level) => ({ text: level, value: level })),
      onFilter: (value, record) => record.level === value,
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
      render: (message) => <Text style={{ fontSize: 12 }}>{message}</Text>,
    },
    {
      title: "User",
      dataIndex: "userId",
      key: "userId",
      width: 100,
      render: (userId) => <Text style={{ fontSize: 12 }}>{userId}</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_, record) => (
        <Space>
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
        </Space>
      ),
    },
  ]

  return (
    <>
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>System Logs</span>
            <Badge count={filteredLogs.length} style={{ backgroundColor: "#52c41a" }} />
            {isStreaming && <Badge status="processing" text="Live" />}
          </div>
        }
        extra={
          <Space>
            <Tooltip title={isStreaming ? "Pause Streaming" : "Start Streaming"}>
              <Button
                type="text"
                icon={isStreaming ? <PauseOutlined /> : <PlayCircleOutlined />}
                onClick={() => setIsStreaming(!isStreaming)}
              />
            </Tooltip>
            <Tooltip title="Refresh">
              <Button type="text" icon={<ReloadOutlined />} loading={loading} onClick={fetchLogs} />
            </Tooltip>
            <Tooltip title="Export Logs">
              <Button type="text" icon={<DownloadOutlined />} onClick={exportLogs} />
            </Tooltip>
            <Tooltip title="Clear Logs">
              <Button type="text" icon={<ClearOutlined />} onClick={clearLogs} />
            </Tooltip>
          </Space>
        }
      >
        {/* Filters */}
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "#fafafa",
            borderRadius: 6,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          <Input
            placeholder="Search logs..."
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            value={filters.level}
            onChange={(value) => setFilters({ ...filters, level: value })}
            style={{ width: 120 }}
          >
            <Option value="all">All Levels</Option>
            {logLevels.map((level) => (
              <Option key={level} value={level}>
                {level}
              </Option>
            ))}
          </Select>
          <Select
            value={filters.service}
            onChange={(value) => setFilters({ ...filters, service: value })}
            style={{ width: 150 }}
          >
            <Option value="all">All Services</Option>
            {services.map((service) => (
              <Option key={service} value={service}>
                {service}
              </Option>
            ))}
          </Select>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Auto-refresh:
            </Text>
            <Switch size="small" checked={isStreaming} onChange={setIsStreaming} />
          </div>
        </div>

        {/* Logs Table */}
        <Table
          ref={tableRef}
          dataSource={filteredLogs}
          columns={columns}
          loading={loading}
          size="small"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} logs`,
          }}
          scroll={{ y: height, x: 800 }}
          rowKey="id"
        />
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
        width={800}
      >
        {selectedLog && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <Text strong>Timestamp:</Text>
                <div>{new Date(selectedLog.timestamp).toLocaleString()}</div>
              </div>
              <div>
                <Text strong>Level:</Text>
                <div>
                  <Tag
                    color={
                      selectedLog.level === "ERROR"
                        ? "red"
                        : selectedLog.level === "WARN"
                          ? "orange"
                          : selectedLog.level === "INFO"
                            ? "blue"
                            : "green"
                    }
                  >
                    {selectedLog.level}
                  </Tag>
                </div>
              </div>
              <div>
                <Text strong>Service:</Text>
                <div>{selectedLog.service}</div>
              </div>
              <div>
                <Text strong>User:</Text>
                <div>{selectedLog.userId}</div>
              </div>
              <div>
                <Text strong>IP Address:</Text>
                <div>{selectedLog.ip}</div>
              </div>
              <div>
                <Text strong>Trace ID:</Text>
                <div style={{ fontFamily: "monospace", fontSize: 12 }}>{selectedLog.traceId}</div>
              </div>
            </div>

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
                }}
              >
                {selectedLog.message}
              </div>
            </div>

            <div>
              <Text strong>Details:</Text>
              <TextArea
                value={selectedLog.details}
                rows={4}
                readOnly
                style={{
                  marginTop: 8,
                  fontFamily: "monospace",
                  fontSize: 12,
                }}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export default LogViewerWidget
