"use client"

import { useState, useEffect } from "react"
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Tag,
  Dropdown,
  Modal,
  Typography,
  Row,
  Col,
  Statistic,
  Progress,
  Tooltip,
  Badge,
  Empty,
  message,
} from "antd"
import {
  PlusOutlined,
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TableOutlined,
  MailOutlined,
  ShareAltOutlined,
  CopyOutlined,
  ScheduleOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import CreateReportModal from "../components/reports/CreateReportModal"
import ReportTemplatesModal from "../components/reports/ReportTemplatesModal"
import ScheduleReportModal from "../components/reports/ScheduleReportModal"
import ReportPreviewModal from "../components/reports/ReportPreviewModal"

const { Title, Text } = Typography
const { Search } = Input
const { RangePicker } = DatePicker
const { Option } = Select

const ReportsPage = () => {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [searchText, setSearchText] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [dateRange, setDateRange] = useState(null)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [templatesModalVisible, setTemplatesModalVisible] = useState(false)
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false)
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)

  // Mock data for reports
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setReports([
        {
          id: "1",
          name: "Device Performance Report",
          type: "performance",
          status: "completed",
          schedule: "daily",
          lastRun: "2024-01-15 09:00:00",
          nextRun: "2024-01-16 09:00:00",
          format: "PDF",
          size: "2.5 MB",
          recipients: ["admin@company.com", "manager@company.com"],
          createdBy: "Admin User",
          createdAt: "2024-01-10 14:30:00",
          description: "Daily performance metrics for all connected devices",
        },
        {
          id: "2",
          name: "Energy Consumption Analysis",
          type: "energy",
          status: "running",
          schedule: "weekly",
          lastRun: "2024-01-14 08:00:00",
          nextRun: "2024-01-21 08:00:00",
          format: "Excel",
          size: "5.2 MB",
          recipients: ["energy@company.com"],
          createdBy: "Energy Manager",
          createdAt: "2024-01-08 10:15:00",
          description: "Weekly energy consumption patterns and optimization recommendations",
        },
        {
          id: "3",
          name: "Alarm Summary Report",
          type: "alarms",
          status: "scheduled",
          schedule: "monthly",
          lastRun: "2024-01-01 00:00:00",
          nextRun: "2024-02-01 00:00:00",
          format: "PDF",
          size: "1.8 MB",
          recipients: ["alerts@company.com", "maintenance@company.com"],
          createdBy: "System Admin",
          createdAt: "2024-01-05 16:45:00",
          description: "Monthly summary of all system alarms and their resolution status",
        },
        {
          id: "4",
          name: "Production Efficiency Report",
          type: "production",
          status: "failed",
          schedule: "daily",
          lastRun: "2024-01-15 06:00:00",
          nextRun: "2024-01-16 06:00:00",
          format: "CSV",
          size: "3.1 MB",
          recipients: ["production@company.com"],
          createdBy: "Production Manager",
          createdAt: "2024-01-12 11:20:00",
          description: "Daily production metrics and efficiency analysis",
        },
        {
          id: "5",
          name: "Asset Utilization Report",
          type: "assets",
          status: "completed",
          schedule: "weekly",
          lastRun: "2024-01-14 10:00:00",
          nextRun: "2024-01-21 10:00:00",
          format: "PDF",
          size: "4.7 MB",
          recipients: ["assets@company.com", "finance@company.com"],
          createdBy: "Asset Manager",
          createdAt: "2024-01-09 13:10:00",
          description: "Weekly asset utilization rates and maintenance schedules",
        },
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success"
      case "running":
        return "processing"
      case "scheduled":
        return "default"
      case "failed":
        return "error"
      default:
        return "default"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <PlayCircleOutlined />
      case "running":
        return <ClockCircleOutlined />
      case "scheduled":
        return <ScheduleOutlined />
      case "failed":
        return <StopOutlined />
      default:
        return <ClockCircleOutlined />
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case "performance":
        return <BarChartOutlined />
      case "energy":
        return <LineChartOutlined />
      case "alarms":
        return <FileTextOutlined />
      case "production":
        return <PieChartOutlined />
      case "assets":
        return <TableOutlined />
      default:
        return <FileTextOutlined />
    }
  }

  const handleCreateReport = () => {
    setCreateModalVisible(true)
  }

  const handleViewTemplates = () => {
    setTemplatesModalVisible(true)
  }

  const handleScheduleReport = (report) => {
    setSelectedReport(report)
    setScheduleModalVisible(true)
  }

  const handlePreviewReport = (report) => {
    setSelectedReport(report)
    setPreviewModalVisible(true)
  }

  const handleRunReport = (reportId) => {
    message.success("Report execution started")
    // Update report status to running
    setReports((prev) => prev.map((report) => (report.id === reportId ? { ...report, status: "running" } : report)))
  }

  const handleDownloadReport = (report) => {
    message.success(`Downloading ${report.name}`)
  }

  const handleDeleteReport = (reportId) => {
    Modal.confirm({
      title: "Delete Report",
      content: "Are you sure you want to delete this report? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        setReports((prev) => prev.filter((report) => report.id !== reportId))
        message.success("Report deleted successfully")
      },
    })
  }

  const getActionMenu = (record) => ({
    items: [
      {
        key: "preview",
        icon: <EyeOutlined />,
        label: "Preview",
        onClick: () => handlePreviewReport(record),
      },
      {
        key: "run",
        icon: <PlayCircleOutlined />,
        label: "Run Now",
        onClick: () => handleRunReport(record.id),
      },
      {
        key: "schedule",
        icon: <ScheduleOutlined />,
        label: "Schedule",
        onClick: () => handleScheduleReport(record),
      },
      {
        key: "download",
        icon: <DownloadOutlined />,
        label: "Download",
        onClick: () => handleDownloadReport(record),
      },
      {
        key: "share",
        icon: <ShareAltOutlined />,
        label: "Share",
        onClick: () => message.info("Share functionality coming soon"),
      },
      {
        key: "duplicate",
        icon: <CopyOutlined />,
        label: "Duplicate",
        onClick: () => message.info("Report duplicated"),
      },
      {
        type: "divider",
      },
      {
        key: "edit",
        icon: <EditOutlined />,
        label: "Edit",
        onClick: () => navigate(`/reports/edit/${record.id}`),
      },
      {
        key: "delete",
        icon: <DeleteOutlined />,
        label: "Delete",
        danger: true,
        onClick: () => handleDeleteReport(record.id),
      },
    ],
  })

  const columns = [
    {
      title: "Report Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          {getTypeIcon(record.type)}
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Text>
          </div>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <Tag color="blue" style={{ textTransform: "capitalize" }}>
          {type}
        </Tag>
      ),
      filters: [
        { text: "Performance", value: "performance" },
        { text: "Energy", value: "energy" },
        { text: "Alarms", value: "alarms" },
        { text: "Production", value: "production" },
        { text: "Assets", value: "assets" },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: "Completed", value: "completed" },
        { text: "Running", value: "running" },
        { text: "Scheduled", value: "scheduled" },
        { text: "Failed", value: "failed" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Schedule",
      dataIndex: "schedule",
      key: "schedule",
      render: (schedule) => (
        <Tag icon={<CalendarOutlined />} style={{ textTransform: "capitalize" }}>
          {schedule}
        </Tag>
      ),
    },
    {
      title: "Last Run",
      dataIndex: "lastRun",
      key: "lastRun",
      render: (date) => <Text type="secondary">{date}</Text>,
      sorter: (a, b) => new Date(a.lastRun) - new Date(b.lastRun),
    },
    {
      title: "Next Run",
      dataIndex: "nextRun",
      key: "nextRun",
      render: (date) => <Text>{date}</Text>,
      sorter: (a, b) => new Date(a.nextRun) - new Date(b.nextRun),
    },
    {
      title: "Format",
      dataIndex: "format",
      key: "format",
      render: (format) => <Tag>{format}</Tag>,
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      render: (size) => <Text type="secondary">{size}</Text>,
    },
    {
      title: "Recipients",
      dataIndex: "recipients",
      key: "recipients",
      render: (recipients) => (
        <Tooltip title={recipients.join(", ")}>
          <Badge count={recipients.length} showZero>
            <MailOutlined />
          </Badge>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Preview">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handlePreviewReport(record)} />
          </Tooltip>
          <Tooltip title="Run Now">
            <Button type="text" icon={<PlayCircleOutlined />} onClick={() => handleRunReport(record.id)} />
          </Tooltip>
          <Dropdown menu={getActionMenu(record)} trigger={["click"]}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ]

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.name.toLowerCase().includes(searchText.toLowerCase()) ||
      report.description.toLowerCase().includes(searchText.toLowerCase())
    const matchesStatus = filterStatus === "all" || report.status === filterStatus
    const matchesType = filterType === "all" || report.type === filterType
    return matchesSearch && matchesStatus && matchesType
  })

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
  }

  const handleBulkAction = (action) => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select at least one report")
      return
    }

    switch (action) {
      case "run":
        message.success(`Running ${selectedRowKeys.length} reports`)
        break
      case "download":
        message.success(`Downloading ${selectedRowKeys.length} reports`)
        break
      case "delete":
        Modal.confirm({
          title: "Delete Reports",
          content: `Are you sure you want to delete ${selectedRowKeys.length} reports?`,
          okText: "Delete",
          okType: "danger",
          onOk: () => {
            setReports((prev) => prev.filter((report) => !selectedRowKeys.includes(report.id)))
            setSelectedRowKeys([])
            message.success("Reports deleted successfully")
          },
        })
        break
      default:
        break
    }
  }

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Reports</Title>
        <Text type="secondary">Generate, schedule, and manage comprehensive reports for your IoT infrastructure</Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Reports"
              value={reports.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Schedules"
              value={reports.filter((r) => r.status !== "failed").length}
              prefix={<ScheduleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Running Now"
              value={reports.filter((r) => r.status === "running").length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={85}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
            <Progress percent={85} showInfo={false} size="small" />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        {/* Toolbar */}
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Space wrap>
                <Search
                  placeholder="Search reports..."
                  allowClear
                  style={{ width: 300 }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  prefix={<SearchOutlined />}
                />
                <Select
                  placeholder="Filter by status"
                  style={{ width: 150 }}
                  value={filterStatus}
                  onChange={setFilterStatus}
                  allowClear
                >
                  <Option value="all">All Status</Option>
                  <Option value="completed">Completed</Option>
                  <Option value="running">Running</Option>
                  <Option value="scheduled">Scheduled</Option>
                  <Option value="failed">Failed</Option>
                </Select>
                <Select
                  placeholder="Filter by type"
                  style={{ width: 150 }}
                  value={filterType}
                  onChange={setFilterType}
                  allowClear
                >
                  <Option value="all">All Types</Option>
                  <Option value="performance">Performance</Option>
                  <Option value="energy">Energy</Option>
                  <Option value="alarms">Alarms</Option>
                  <Option value="production">Production</Option>
                  <Option value="assets">Assets</Option>
                </Select>
                <RangePicker placeholder={["Start Date", "End Date"]} value={dateRange} onChange={setDateRange} />
              </Space>
            </Col>
            <Col>
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateReport}>
                  Create Report
                </Button>
                <Button icon={<FileTextOutlined />} onClick={handleViewTemplates}>
                  Templates
                </Button>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "run",
                        icon: <PlayCircleOutlined />,
                        label: "Run Selected",
                        onClick: () => handleBulkAction("run"),
                      },
                      {
                        key: "download",
                        icon: <DownloadOutlined />,
                        label: "Download Selected",
                        onClick: () => handleBulkAction("download"),
                      },
                      {
                        type: "divider",
                      },
                      {
                        key: "delete",
                        icon: <DeleteOutlined />,
                        label: "Delete Selected",
                        danger: true,
                        onClick: () => handleBulkAction("delete"),
                      },
                    ],
                  }}
                  disabled={selectedRowKeys.length === 0}
                >
                  <Button icon={<MoreOutlined />}>Bulk Actions ({selectedRowKeys.length})</Button>
                </Dropdown>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredReports}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            total: filteredReports.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} reports`,
          }}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No reports found">
                <Button type="primary" onClick={handleCreateReport}>
                  Create Your First Report
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      {/* Modals */}
      <CreateReportModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={(newReport) => {
          setReports((prev) => [...prev, newReport])
          setCreateModalVisible(false)
          message.success("Report created successfully")
        }}
      />

      <ReportTemplatesModal
        visible={templatesModalVisible}
        onCancel={() => setTemplatesModalVisible(false)}
        onSelectTemplate={(template) => {
          setTemplatesModalVisible(false)
          setCreateModalVisible(true)
        }}
      />

      <ScheduleReportModal
        visible={scheduleModalVisible}
        report={selectedReport}
        onCancel={() => {
          setScheduleModalVisible(false)
          setSelectedReport(null)
        }}
        onSuccess={() => {
          setScheduleModalVisible(false)
          setSelectedReport(null)
          message.success("Report schedule updated")
        }}
      />

      <ReportPreviewModal
        visible={previewModalVisible}
        report={selectedReport}
        onCancel={() => {
          setPreviewModalVisible(false)
          setSelectedReport(null)
        }}
      />
    </div>
  )
}

export default ReportsPage