"use client"

import { useState, useEffect } from "react"
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Dropdown,
  Modal,
  Typography,
  Row,
  Col,
  Statistic,
  Badge,
  Empty,
  message,
  Tabs,
  Avatar,
  Progress,
  Alert,
} from "antd"
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  BarChartOutlined,
  ExportOutlined,
  ReloadOutlined,
  MessageOutlined,
  GithubOutlined,
  SettingOutlined,
} from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import CreateTicketModal from "../components/support/CreateTicketModal"
import KnowledgeBaseModal from "../components/support/KnowledgeBaseModal"
import GitHubSettingsModal from "../components/support/GitHubSettingsModal"
import "../styles/support.css"

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select
const { TabPane } = Tabs

const SupportPage = () => {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [searchText, setSearchText] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [knowledgeBaseVisible, setKnowledgeBaseVisible] = useState(false)
  const [githubSettingsVisible, setGithubSettingsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState("my-tickets")

  // Mock user role - in real app this would come from auth context
  const [userRole] = useState("admin") // user, admin, super-admin

  // Mock data for tickets
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setTickets([
        {
          id: "TKT-001",
          title: "Device connectivity issues with Sensor-A",
          description: "Temperature sensor is not sending data to the platform",
          category: "connectivity",
          priority: "high",
          status: "open",
          reporter: "John Doe",
          reporterEmail: "john.doe@company.com",
          assignee: "Support Agent",
          tenant: "Acme Corp",
          createdAt: "2024-01-15 09:30:00",
          updatedAt: "2024-01-15 14:20:00",
          tags: ["sensor", "connectivity", "urgent"],
          attachments: ["device-logs.txt", "network-config.json"],
          comments: 3,
          estimatedResolution: "2024-01-16 09:00:00",
          githubIssue: null,
        },
        {
          id: "TKT-002",
          title: "Dashboard widget not displaying data",
          description: "Line chart widget shows no data despite devices being active",
          category: "data-analytics",
          priority: "medium",
          status: "in-progress",
          reporter: "Jane Smith",
          reporterEmail: "jane.smith@company.com",
          assignee: "Tech Support",
          tenant: "Global Innovations",
          createdAt: "2024-01-14 16:45:00",
          updatedAt: "2024-01-15 10:15:00",
          tags: ["dashboard", "widget", "data"],
          attachments: ["screenshot.png"],
          comments: 5,
          estimatedResolution: "2024-01-17 12:00:00",
          githubIssue: {
            number: 123,
            url: "https://github.com/company/iot-platform/issues/123",
            status: "open",
          },
        },
        {
          id: "TKT-003",
          title: "Rule chain not triggering alerts",
          description: "Temperature threshold rule chain is not sending email notifications",
          category: "rule-chains",
          priority: "high",
          status: "resolved",
          reporter: "Mike Johnson",
          reporterEmail: "mike.j@company.com",
          assignee: "Senior Engineer",
          tenant: "Future Systems Ltd",
          createdAt: "2024-01-13 11:20:00",
          updatedAt: "2024-01-15 09:45:00",
          tags: ["rule-chain", "alerts", "email"],
          attachments: ["rule-config.json", "error-logs.txt"],
          comments: 8,
          resolvedAt: "2024-01-15 09:45:00",
          githubIssue: {
            number: 124,
            url: "https://github.com/company/iot-platform/issues/124",
            status: "closed",
          },
        },
        {
          id: "TKT-004",
          title: "Security certificate expiring soon",
          description: "SSL certificate for device communication will expire in 7 days",
          category: "security",
          priority: "critical",
          status: "open",
          reporter: "Security Team",
          reporterEmail: "security@company.com",
          assignee: "Security Specialist",
          tenant: "Acme Corp",
          createdAt: "2024-01-15 08:00:00",
          updatedAt: "2024-01-15 08:00:00",
          tags: ["security", "certificate", "ssl"],
          attachments: ["cert-details.pdf"],
          comments: 1,
          estimatedResolution: "2024-01-16 17:00:00",
          githubIssue: null,
        },
        {
          id: "TKT-005",
          title: "Performance optimization request",
          description: "Dashboard loading time is slow with large datasets",
          category: "performance",
          priority: "low",
          status: "closed",
          reporter: "Admin User",
          reporterEmail: "admin@company.com",
          assignee: "Performance Team",
          tenant: "Global Innovations",
          createdAt: "2024-01-10 14:30:00",
          updatedAt: "2024-01-14 16:20:00",
          tags: ["performance", "dashboard", "optimization"],
          attachments: ["performance-report.pdf"],
          comments: 12,
          resolvedAt: "2024-01-14 16:20:00",
          closedAt: "2024-01-14 16:20:00",
          githubIssue: null,
        },
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "red"
      case "high":
        return "orange"
      case "medium":
        return "blue"
      case "low":
        return "green"
      default:
        return "default"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "red"
      case "in-progress":
        return "orange"
      case "resolved":
        return "green"
      case "closed":
        return "default"
      default:
        return "default"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "open":
        return <ExclamationCircleOutlined />
      case "in-progress":
        return <ClockCircleOutlined />
      case "resolved":
        return <CheckCircleOutlined />
      case "closed":
        return <CheckCircleOutlined />
      default:
        return <QuestionCircleOutlined />
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case "connectivity":
        return "🌐"
      case "device-issues":
        return "🔧"
      case "rule-chains":
        return "⚙️"
      case "security":
        return "🔒"
      case "data-analytics":
        return "📈"
      case "performance":
        return "⚡"
      default:
        return "❓"
    }
  }

  const handleCreateTicket = () => {
    setCreateModalVisible(true)
  }

  const handleViewTicket = (ticket) => {
    navigate(`/support/ticket/${ticket.id}`, { state: { ticket } })
  }

  const handleTicketCreated = (newTicket) => {
    setTickets([newTicket, ...tickets])
    setCreateModalVisible(false)
    message.success("Support ticket created successfully!")
  }

  const handleGithubSettingsSaved = () => {
    setGithubSettingsVisible(false)
    message.success("GitHub settings saved successfully!")
  }

  const getActionMenu = (record) => ({
    items: [
      {
        key: "view",
        icon: <MessageOutlined />,
        label: "Open Chat",
        onClick: () => handleViewTicket(record),
      },
      ...(userRole !== "user"
        ? [
            {
              key: "edit",
              icon: <EditOutlined />,
              label: "Edit Ticket",
              onClick: () => {
                setCreateModalVisible(true)
              },
            },
            {
              key: "assign",
              icon: <UserOutlined />,
              label: "Assign Agent",
              onClick: () => message.info("Assign agent functionality"),
            },
          ]
        : []),
      {
        key: "export",
        icon: <ExportOutlined />,
        label: "Export Details",
        onClick: () => message.success("Exporting ticket details"),
      },
      ...(userRole === "super-admin"
        ? [
            {
              type: "divider",
            },
            {
              key: "delete",
              icon: <DeleteOutlined />,
              label: "Delete Ticket",
              danger: true,
              onClick: () => handleDeleteTicket(record.id),
            },
          ]
        : []),
    ],
  })

  const handleDeleteTicket = (ticketId) => {
    Modal.confirm({
      title: "Delete Ticket",
      content: "Are you sure you want to delete this ticket? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        setTickets(tickets.filter((ticket) => ticket.id !== ticketId))
        message.success("Ticket deleted successfully")
      },
    })
  }

  const columns = [
    {
      title: "Ticket ID",
      dataIndex: "id",
      key: "id",
      width: 120,
      render: (text, record) => (
        <div>
          <Button type="link" onClick={() => handleViewTicket(record)}>
            {text}
          </Button>
          {record.githubIssue && (
            <div style={{ marginTop: 4 }}>
              <Tag color="purple" size="small" icon={<GithubOutlined />} style={{ fontSize: 10 }}>
                #{record.githubIssue.number}
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text strong>{text}</Text>
            {record.githubIssue && (
              <a href={record.githubIssue.url} target="_blank" rel="noopener noreferrer" title="View GitHub Issue">
                <GithubOutlined style={{ color: "#1890ff" }} />
              </a>
            )}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {getCategoryIcon(record.category)} {record.category.replace("-", " ")}
          </Text>
        </div>
      ),
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority) => (
        <Tag color={getPriorityColor(priority)} style={{ textTransform: "uppercase" }}>
          {priority}
        </Tag>
      ),
      filters: [
        { text: "Critical", value: "critical" },
        { text: "High", value: "high" },
        { text: "Medium", value: "medium" },
        { text: "Low", value: "low" },
      ],
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.replace("-", " ").toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: "Open", value: "open" },
        { text: "In Progress", value: "in-progress" },
        { text: "Resolved", value: "resolved" },
        { text: "Closed", value: "closed" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Reporter",
      dataIndex: "reporter",
      key: "reporter",
      width: 150,
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <Text>{text}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.tenant}
            </Text>
          </div>
        </div>
      ),
    },
    ...(userRole !== "user"
      ? [
          {
            title: "Assignee",
            dataIndex: "assignee",
            key: "assignee",
            width: 120,
            render: (text) => (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar size="small" icon={<TeamOutlined />} />
                <Text>{text}</Text>
              </div>
            ),
          },
        ]
      : []),
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date) => <Text type="secondary">{date.split(" ")[0]}</Text>,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: "Comments",
      dataIndex: "comments",
      key: "comments",
      width: 80,
      render: (count) => (
        <Badge count={count} showZero>
          <Button type="text" icon={<FileTextOutlined />} />
        </Badge>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_, record) => (
        <Dropdown menu={getActionMenu(record)} trigger={["click"]}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ]

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchText.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchText.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchText.toLowerCase())
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus
    const matchesPriority = filterPriority === "all" || ticket.priority === filterPriority
    const matchesCategory = filterCategory === "all" || ticket.category === filterCategory

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory
  })

  const getTicketStats = () => {
    const total = tickets.length
    const open = tickets.filter((t) => t.status === "open").length
    const inProgress = tickets.filter((t) => t.status === "in-progress").length
    const resolved = tickets.filter((t) => t.status === "resolved").length
    const critical = tickets.filter((t) => t.priority === "critical").length
    const withGithubIssues = tickets.filter((t) => t.githubIssue).length

    return { total, open, inProgress, resolved, critical, withGithubIssues }
  }

  const stats = getTicketStats()

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
  }

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Title level={2}>
              <QuestionCircleOutlined /> Support Center
            </Title>
            <Text type="secondary">
              {userRole === "user"
                ? "Create and track your support tickets"
                : userRole === "admin"
                  ? "Manage support tickets and assist users"
                  : "Full support system administration"}
            </Text>
          </div>
          <Space>
            <Button icon={<BookOutlined />} onClick={() => setKnowledgeBaseVisible(true)}>
              Knowledge Base
            </Button>
            {(userRole === "admin" || userRole === "super-admin") && (
              <Button
                icon={<GithubOutlined />}
                onClick={() => setGithubSettingsVisible(true)}
                title="GitHub Integration Settings"
              >
                GitHub Settings
              </Button>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateTicket}>
              Create Ticket
            </Button>
          </Space>
        </div>
      </div>

      {/* Role-based Alert */}
      {userRole !== "user" && (
        <Alert
          message={`${userRole === "admin" ? "Admin" : "Super Admin"} Access`}
          description={`You have ${
            userRole === "admin" ? "administrative" : "full administrative"
          } access to the support system. You can manage tickets, assign agents, access analytics, and create GitHub issues.`}
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
          closable
        />
      )}

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Total Tickets"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Open Tickets"
              value={stats.open}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="In Progress"
              value={stats.inProgress}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Critical Issues"
              value={stats.critical}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: "#f5222d" }}
            />
            <Progress
              percent={stats.total > 0 ? (stats.critical / stats.total) * 100 : 0}
              showInfo={false}
              size="small"
              strokeColor="#f5222d"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="GitHub Issues"
              value={stats.withGithubIssues}
              prefix={<GithubOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
            <Progress
              percent={stats.total > 0 ? (stats.withGithubIssues / stats.total) * 100 : 0}
              showInfo={false}
              size="small"
              strokeColor="#722ed1"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Resolved"
              value={stats.resolved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="My Tickets" key="my-tickets">
            {/* Toolbar */}
            <div style={{ marginBottom: 16 }}>
              <Row gutter={16} align="middle">
                <Col flex="auto">
                  <Space wrap>
                    <Search
                      placeholder="Search tickets..."
                      allowClear
                      style={{ width: 300 }}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      prefix={<SearchOutlined />}
                    />
                    <Select
                      placeholder="Status"
                      style={{ width: 120 }}
                      value={filterStatus}
                      onChange={setFilterStatus}
                      allowClear
                    >
                      <Option value="all">All Status</Option>
                      <Option value="open">Open</Option>
                      <Option value="in-progress">In Progress</Option>
                      <Option value="resolved">Resolved</Option>
                      <Option value="closed">Closed</Option>
                    </Select>
                    <Select
                      placeholder="Priority"
                      style={{ width: 120 }}
                      value={filterPriority}
                      onChange={setFilterPriority}
                      allowClear
                    >
                      <Option value="all">All Priority</Option>
                      <Option value="critical">Critical</Option>
                      <Option value="high">High</Option>
                      <Option value="medium">Medium</Option>
                      <Option value="low">Low</Option>
                    </Select>
                    <Select
                      placeholder="Category"
                      style={{ width: 150 }}
                      value={filterCategory}
                      onChange={setFilterCategory}
                      allowClear
                    >
                      <Option value="all">All Categories</Option>
                      <Option value="connectivity">Connectivity</Option>
                      <Option value="device-issues">Device Issues</Option>
                      <Option value="rule-chains">Rule Chains</Option>
                      <Option value="security">Security</Option>
                      <Option value="data-analytics">Data Analytics</Option>
                      <Option value="performance">Performance</Option>
                    </Select>
                  </Space>
                </Col>
                <Col>
                  <Space>
                    <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
                      Refresh
                    </Button>
                    {userRole !== "user" && <Button icon={<BarChartOutlined />}>Analytics</Button>}
                  </Space>
                </Col>
              </Row>
            </div>

            {/* Table */}
            <Table
              columns={columns}
              dataSource={filteredTickets}
              rowKey="id"
              loading={loading}
              rowSelection={userRole !== "user" ? rowSelection : undefined}
              pagination={{
                total: filteredTickets.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} tickets`,
              }}
              scroll={{ x: 1200 }}
              locale={{
                emptyText: (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No tickets found">
                    <Button type="primary" onClick={handleCreateTicket}>
                      Create Your First Ticket
                    </Button>
                  </Empty>
                ),
              }}
            />
          </TabPane>

          {userRole !== "user" && (
            <TabPane tab="All Tickets" key="all-tickets">
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <FileTextOutlined style={{ fontSize: 48, color: "#d9d9d9", marginBottom: 16 }} />
                <div>
                  <Text type="secondary">All tickets across all tenants will be displayed here</Text>
                </div>
              </div>
            </TabPane>
          )}

          {userRole === "super-admin" && (
            <TabPane tab="System Analytics" key="analytics">
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <BarChartOutlined style={{ fontSize: 48, color: "#d9d9d9", marginBottom: 16 }} />
                <div>
                  <Text type="secondary">Advanced support analytics and reporting will be displayed here</Text>
                </div>
              </div>
            </TabPane>
          )}

          {(userRole === "admin" || userRole === "super-admin") && (
            <TabPane tab="GitHub Integration" key="github-integration">
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <GithubOutlined style={{ fontSize: 48, color: "#d9d9d9", marginBottom: 16 }} />
                <div>
                  <Title level={4}>GitHub Integration</Title>
                  <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
                    Manage GitHub integration settings and view connected repositories
                  </Text>
                  <Button type="primary" icon={<SettingOutlined />} onClick={() => setGithubSettingsVisible(true)}>
                    Configure GitHub Settings
                  </Button>
                </div>
              </div>
            </TabPane>
          )}
        </Tabs>
      </Card>

      {/* Modals */}
      <CreateTicketModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleTicketCreated}
        userRole={userRole}
      />

      <KnowledgeBaseModal visible={knowledgeBaseVisible} onCancel={() => setKnowledgeBaseVisible(false)} />

      <GitHubSettingsModal
        visible={githubSettingsVisible}
        onCancel={() => setGithubSettingsVisible(false)}
        onSuccess={handleGithubSettingsSaved}
        userRole={userRole}
      />
    </div>
  )
}

export default SupportPage