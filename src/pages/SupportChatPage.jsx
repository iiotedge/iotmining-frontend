"use client"

import { useState, useEffect, useRef } from "react"
import {
  Layout,
  Card,
  Typography,
  Tag,
  Space,
  Button,
  Input,
  Upload,
  Avatar,
  Divider,
  Select,
  Row,
  Col,
  Badge,
  message,
  Timeline,
  List,
  Affix,
  BackTop,
  Modal,
  Rate,
  Dropdown,
} from "antd"
import {
  ArrowLeftOutlined,
  SendOutlined,
  PaperClipOutlined,
  DownloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TagOutlined,
  TeamOutlined,
  CalendarOutlined,
  EditOutlined,
  HistoryOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  EyeOutlined,
  StarOutlined,
  StarFilled,
  GithubOutlined,
  MoreOutlined,
} from "@ant-design/icons"
import { useNavigate, useLocation, useParams } from "react-router-dom"
import { useTheme } from "../components/theme/ThemeProvider"
import GitHubIssueModal from "../components/support/GitHubIssueModal"
import "../styles/support-chat.css"

const { Content, Sider } = Layout
const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select

const SupportChatPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { ticketId } = useParams()
  const { theme } = useTheme()
  const messagesEndRef = useRef(null)

  const [ticket, setTicket] = useState(location.state?.ticket || null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingStatus, setEditingStatus] = useState(false)
  const [editingPriority, setEditingPriority] = useState(false)
  const [editingAssignee, setEditingAssignee] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [ticketRating, setTicketRating] = useState(0)
  const [showGithubModal, setShowGithubModal] = useState(false)
  const [githubIssueUrl, setGithubIssueUrl] = useState(null)
  const [creatingGithubIssue, setCreatingGithubIssue] = useState(false)
  const [ratingModalVisible, setRatingModalVisible] = useState(false)
  const [feedback, setFeedback] = useState("")

  // Mock user role - change this to test different roles
  const [userRole] = useState("admin") // user, admin, super-admin
  const [currentUser] = useState({
    name: userRole === "user" ? "John Doe" : "Support Agent",
    role: userRole === "user" ? "Customer" : "Agent",
    avatar: null,
    isOnline: true,
  })

  // Load ticket data if not passed via state
  useEffect(() => {
    if (!ticket && ticketId) {
      // In real app, fetch ticket data from API
      setTicket({
        id: ticketId,
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
        estimatedResolution: "2024-01-16 09:00:00",
        githubIssue: null,
      })
    }
  }, [ticketId, ticket])

  // Load messages
  useEffect(() => {
    if (ticket) {
      loadMessages()
      loadOnlineUsers()
    }
  }, [ticket])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = () => {
    // Mock messages data
    const mockMessages = [
      {
        id: 1,
        sender: "John Doe",
        senderRole: "Customer",
        content:
          "Hi, I'm having issues with my temperature sensor. It stopped sending data yesterday evening around 8 PM.",
        timestamp: "2024-01-15 09:35:00",
        attachments: [],
        type: "message",
        isOwn: userRole === "user",
      },
      {
        id: 2,
        sender: "Support Agent",
        senderRole: "Agent",
        content:
          "Hello John! Thank you for contacting us. I can see your ticket regarding the temperature sensor connectivity issue. Let me help you troubleshoot this.",
        timestamp: "2024-01-15 09:42:00",
        attachments: [],
        type: "message",
        isOwn: userRole !== "user",
      },
      {
        id: 3,
        sender: "Support Agent",
        senderRole: "Agent",
        content:
          "Can you please check if the sensor's LED indicator is showing any specific color or pattern? Also, could you try restarting the device?",
        timestamp: "2024-01-15 09:43:00",
        attachments: [],
        type: "message",
        isOwn: userRole !== "user",
      },
      {
        id: 4,
        sender: "John Doe",
        senderRole: "Customer",
        content:
          "I've tried restarting it multiple times. The LED is blinking red, which usually indicates a connection error. I've attached the device logs from the past 24 hours.",
        timestamp: "2024-01-15 10:15:00",
        attachments: [
          { name: "device-logs-24h.txt", size: "15.2 KB", type: "text/plain" },
          { name: "error-screenshot.png", size: "234 KB", type: "image/png" },
        ],
        type: "message",
        isOwn: userRole === "user",
      },
      {
        id: 5,
        sender: "System",
        senderRole: "System",
        content: "Ticket status changed from 'Open' to 'In Progress'",
        timestamp: "2024-01-15 10:20:00",
        attachments: [],
        type: "system",
        isOwn: false,
      },
      {
        id: 6,
        sender: "Support Agent",
        senderRole: "Agent",
        content:
          "Thank you for the logs! I can see the issue now. The device is failing to establish an SSL connection with our servers. This appears to be related to an expired certificate on the device.",
        timestamp: "2024-01-15 11:30:00",
        attachments: [],
        type: "message",
        isOwn: userRole !== "user",
      },
      {
        id: 7,
        sender: "Support Agent",
        senderRole: "Agent",
        content:
          "I'm going to push a certificate update to your device remotely. This should resolve the connectivity issue. The process will take about 5-10 minutes.",
        timestamp: "2024-01-15 11:32:00",
        attachments: [{ name: "certificate-update-guide.pdf", size: "1.2 MB", type: "application/pdf" }],
        type: "message",
        isOwn: userRole !== "user",
      },
      {
        id: 8,
        sender: "John Doe",
        senderRole: "Customer",
        content: "That sounds great! Should I do anything on my end during the update process?",
        timestamp: "2024-01-15 11:35:00",
        attachments: [],
        type: "message",
        isOwn: userRole === "user",
      },
      {
        id: 9,
        sender: "Support Agent",
        senderRole: "Agent",
        content:
          "No action needed from your side. Just keep the device powered on and connected to the network. I'll monitor the update process and let you know once it's complete.",
        timestamp: "2024-01-15 11:37:00",
        attachments: [],
        type: "message",
        isOwn: userRole !== "user",
      },
    ]
    setMessages(mockMessages)
  }

  const loadOnlineUsers = () => {
    setOnlineUsers([
      { name: "John Doe", role: "Customer", isOnline: true },
      { name: "Support Agent", role: "Agent", isOnline: true },
      { name: "Tech Specialist", role: "Agent", isOnline: false },
    ])
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() && attachments.length === 0) {
      message.warning("Please enter a message or attach a file")
      return
    }

    setLoading(true)

    // Simulate typing indicator
    setIsTyping(true)
    setTimeout(() => setIsTyping(false), 2000)

    const messageData = {
      id: messages.length + 1,
      sender: currentUser.name,
      senderRole: currentUser.role,
      content: newMessage,
      timestamp: new Date().toLocaleString(),
      attachments: attachments.map((file) => ({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type,
      })),
      type: "message",
      isOwn: true,
    }

    setMessages([...messages, messageData])
    setNewMessage("")
    setAttachments([])
    setLoading(false)
    message.success("Message sent successfully")

    // Simulate agent response (for demo purposes)
    if (userRole === "user") {
      setTimeout(() => {
        const agentResponse = {
          id: messages.length + 2,
          sender: "Support Agent",
          senderRole: "Agent",
          content: "Thank you for your message. I'm looking into this right now and will get back to you shortly.",
          timestamp: new Date().toLocaleString(),
          attachments: [],
          type: "message",
          isOwn: false,
        }
        setMessages((prev) => [...prev, agentResponse])
      }, 3000)
    }
  }

  const handleStatusChange = (newStatus) => {
    const updatedTicket = { ...ticket, status: newStatus, updatedAt: new Date().toLocaleString() }
    setTicket(updatedTicket)

    // Add system message
    const systemMessage = {
      id: messages.length + 1,
      sender: "System",
      senderRole: "System",
      content: `Ticket status changed from '${ticket.status}' to '${newStatus}'`,
      timestamp: new Date().toLocaleString(),
      attachments: [],
      type: "system",
      isOwn: false,
    }
    setMessages([...messages, systemMessage])
    setEditingStatus(false)
    message.success("Status updated successfully")
  }

  const handlePriorityChange = (newPriority) => {
    const updatedTicket = { ...ticket, priority: newPriority, updatedAt: new Date().toLocaleString() }
    setTicket(updatedTicket)
    setEditingPriority(false)
    message.success("Priority updated successfully")
  }

  const handleAssigneeChange = (newAssignee) => {
    const updatedTicket = { ...ticket, assignee: newAssignee, updatedAt: new Date().toLocaleString() }
    setTicket(updatedTicket)
    setEditingAssignee(false)
    message.success("Assignee updated successfully")
  }

  const handleRateTicket = (rating) => {
    setTicketRating(rating)
    message.success(`Thank you for rating this support experience: ${rating} stars`)
  }

  const handleCreateGithubIssue = async (issueData) => {
    setCreatingGithubIssue(true)
    try {
      // Simulate GitHub API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockIssueUrl = `https://github.com/thingsboard/thingsboard/issues/${Math.floor(Math.random() * 1000) + 1}`
      const mockIssueNumber = Math.floor(Math.random() * 1000) + 1

      // Update ticket with GitHub issue info
      const updatedTicket = {
        ...ticket,
        githubIssue: {
          number: mockIssueNumber,
          url: mockIssueUrl,
          title: issueData.title,
          status: "open",
          repository: issueData.repository,
        },
      }
      setTicket(updatedTicket)

      // Add system message about GitHub issue creation
      const systemMessage = {
        id: messages.length + 1,
        sender: "System",
        senderRole: "System",
        content: `GitHub issue created: #${mockIssueNumber} - ${issueData.title}`,
        timestamp: new Date().toLocaleString(),
        attachments: [{ name: "GitHub Issue", url: mockIssueUrl, type: "link" }],
        type: "system",
        isOwn: false,
        githubIssue: {
          number: mockIssueNumber,
          url: mockIssueUrl,
          title: issueData.title,
        },
      }

      setMessages([...messages, systemMessage])
      setShowGithubModal(false)
      message.success("GitHub issue created successfully!")
    } catch (error) {
      message.error("Failed to create GitHub issue")
    } finally {
      setCreatingGithubIssue(false)
    }
  }

  const handleRatingSubmit = () => {
    const systemMessage = {
      id: messages.length + 1,
      sender: "System",
      senderRole: "System",
      content: `Customer rated this support: ${ticketRating} stars${feedback ? ` - "${feedback}"` : ""}`,
      timestamp: new Date().toLocaleString(),
      attachments: [],
      type: "system",
      isOwn: false,
    }
    setMessages([...messages, systemMessage])
    setRatingModalVisible(false)
    setTicketRating(0)
    setFeedback("")
    message.success("Thank you for your feedback!")
  }

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
        return <ExclamationCircleOutlined />
    }
  }

  const uploadProps = {
    fileList: attachments,
    onChange: ({ fileList }) => setAttachments(fileList),
    beforeUpload: () => false,
    multiple: true,
    showUploadList: {
      showDownloadIcon: false,
      showPreviewIcon: true,
    },
  }

  const actionMenu = {
    items: [
      ...(userRole !== "user"
        ? [
            {
              key: "status",
              label: "Change Status",
              icon: <EditOutlined />,
              children: [
                { key: "open", label: "Open", onClick: () => handleStatusChange("open") },
                { key: "in-progress", label: "In Progress", onClick: () => handleStatusChange("in-progress") },
                { key: "resolved", label: "Resolved", onClick: () => handleStatusChange("resolved") },
                { key: "closed", label: "Closed", onClick: () => handleStatusChange("closed") },
              ],
            },
            {
              key: "priority",
              label: "Change Priority",
              icon: <TagOutlined />,
              children: [
                { key: "critical", label: "Critical", onClick: () => handlePriorityChange("critical") },
                { key: "high", label: "High", onClick: () => handlePriorityChange("high") },
                { key: "medium", label: "Medium", onClick: () => handlePriorityChange("medium") },
                { key: "low", label: "Low", onClick: () => handlePriorityChange("low") },
              ],
            },
          ]
        : []),
      {
        key: "rate",
        label: "Rate Support",
        icon: <StarOutlined />,
        onClick: () => setRatingModalVisible(true),
      },
    ],
  }

  if (!ticket) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <Title level={3}>Ticket not found</Title>
        <Button type="primary" onClick={() => navigate("/support")}>
          Back to Support
        </Button>
      </div>
    )
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <Affix offsetTop={0}>
          <Card
            size="small"
            style={{
              borderRadius: 0,
              borderBottom: "1px solid #f0f0f0",
              background: theme === "dark" ? "#1f1f1f" : "#fff",
            }}
          >
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate("/support")}>
                    Back to Support
                  </Button>
                  <Divider type="vertical" />
                  <div>
                    <Text strong style={{ fontSize: 16 }}>
                      {ticket.id}
                    </Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      • {ticket.title}
                    </Text>
                  </div>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Tag color={getStatusColor(ticket.status)} icon={getStatusIcon(ticket.status)}>
                    {ticket.status.replace("-", " ").toUpperCase()}
                  </Tag>
                  <Tag color={getPriorityColor(ticket.priority)}>{ticket.priority.toUpperCase()}</Tag>
                  {ticket.githubIssue && (
                    <Tag color="purple" icon={<GithubOutlined />}>
                      <a href={ticket.githubIssue.url} target="_blank" rel="noopener noreferrer">
                        #{ticket.githubIssue.number}
                      </a>
                    </Tag>
                  )}
                  {(userRole === "admin" || userRole === "super-admin") && !ticket.githubIssue && (
                    <Button
                      type="text"
                      icon={<GithubOutlined />}
                      onClick={() => setShowGithubModal(true)}
                      title="Create GitHub Issue"
                    >
                      GitHub
                    </Button>
                  )}
                  <Button type="text" icon={<PhoneOutlined />} />
                  <Button type="text" icon={<VideoCameraOutlined />} />
                  <Button type="text" icon={<EyeOutlined />} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                    {sidebarCollapsed ? "Show" : "Hide"} Details
                  </Button>
                  <Dropdown menu={actionMenu} trigger={["click"]}>
                    <Button type="text" icon={<MoreOutlined />} />
                  </Dropdown>
                </Space>
              </Col>
            </Row>
          </Card>
        </Affix>

        <Layout style={{ flex: 1 }}>
          {/* Chat Area */}
          <Content style={{ display: "flex", flexDirection: "column", padding: 0 }}>
            {/* Messages */}
            <div
              style={{
                flex: 1,
                padding: "16px",
                overflowY: "auto",
                background: theme === "dark" ? "#141414" : "#fafafa",
              }}
            >
              <List
                dataSource={messages}
                renderItem={(message) => (
                  <List.Item style={{ border: "none", padding: "8px 0" }}>
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: message.isOwn ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "70%",
                          display: "flex",
                          flexDirection: message.isOwn ? "row-reverse" : "row",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <Avatar
                          size="small"
                          icon={message.type === "system" ? <HistoryOutlined /> : <UserOutlined />}
                          style={{
                            backgroundColor:
                              message.type === "system" ? "#1890ff" : message.isOwn ? "#52c41a" : "#fa8c16",
                          }}
                        />
                        <div>
                          <Card
                            size="small"
                            style={{
                              backgroundColor:
                                message.type === "system" ? "#f6ffed" : message.isOwn ? "#e6f7ff" : "#fff",
                              border:
                                message.type === "system"
                                  ? "1px solid #b7eb8f"
                                  : message.isOwn
                                    ? "1px solid #91d5ff"
                                    : "1px solid #d9d9d9",
                              marginBottom: 4,
                            }}
                          >
                            <div style={{ marginBottom: 4 }}>
                              <Text strong style={{ fontSize: 12 }}>
                                {message.sender}
                              </Text>
                              <Tag
                                size="small"
                                color={
                                  message.senderRole === "System"
                                    ? "blue"
                                    : message.senderRole === "Agent"
                                      ? "green"
                                      : "orange"
                                }
                                style={{ marginLeft: 4 }}
                              >
                                {message.senderRole}
                              </Tag>
                            </div>
                            <Paragraph style={{ margin: 0, fontSize: 14 }}>{message.content}</Paragraph>
                            {message.attachments && message.attachments.length > 0 && (
                              <div style={{ marginTop: 8 }}>
                                {message.attachments.map((file, index) => (
                                  <Tag key={index} icon={<PaperClipOutlined />} style={{ marginBottom: 4 }}>
                                    {file.name} {file.size && `(${file.size})`}
                                    {file.type !== "link" && (
                                      <Button
                                        type="text"
                                        size="small"
                                        icon={<DownloadOutlined />}
                                        style={{ marginLeft: 4, padding: 0 }}
                                      />
                                    )}
                                    {file.url && (
                                      <Button
                                        type="link"
                                        size="small"
                                        href={file.url}
                                        target="_blank"
                                        style={{ marginLeft: 4, padding: 0 }}
                                      >
                                        View
                                      </Button>
                                    )}
                                  </Tag>
                                ))}
                              </div>
                            )}
                            {message.githubIssue && (
                              <div style={{ marginTop: 8 }}>
                                <a
                                  href={message.githubIssue.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                                >
                                  <GithubOutlined />
                                  View GitHub Issue #{message.githubIssue.number}
                                </a>
                              </div>
                            )}
                          </Card>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {message.timestamp}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />

              {/* Typing Indicator */}
              {isTyping && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
                  <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: "#fa8c16" }} />
                  <Text type="secondary" style={{ fontStyle: "italic" }}>
                    Support Agent is typing...
                  </Text>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <Card size="small" style={{ borderRadius: 0, borderTop: "1px solid #f0f0f0" }}>
              <div style={{ marginBottom: 8 }}>
                <Upload {...uploadProps}>
                  <Button icon={<PaperClipOutlined />} size="small">
                    Attach Files
                  </Button>
                </Upload>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <TextArea
                  rows={3}
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onPressEnter={(e) => {
                    if (e.shiftKey) return
                    e.preventDefault()
                    handleSendMessage()
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  loading={loading}
                  disabled={!newMessage.trim() && attachments.length === 0}
                  style={{ alignSelf: "flex-end" }}
                >
                  Send
                </Button>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
                Press Enter to send, Shift+Enter for new line
              </div>
            </Card>
          </Content>

          {/* Sidebar */}
          {!sidebarCollapsed && (
            <Sider
              width={350}
              style={{
                background: theme === "dark" ? "#1f1f1f" : "#fff",
                borderLeft: "1px solid #f0f0f0",
              }}
            >
              <div style={{ padding: "16px", height: "100%", overflowY: "auto" }}>
                {/* Ticket Information */}
                <Card title="Ticket Information" size="small" style={{ marginBottom: 16 }}>
                  <Space direction="vertical" style={{ width: "100%" }} size="small">
                    {/* Status */}
                    <div>
                      <Text strong>Status:</Text>
                      <div style={{ marginTop: 4 }}>
                        {editingStatus && userRole !== "user" ? (
                          <Space>
                            <Select
                              size="small"
                              defaultValue={ticket.status}
                              style={{ width: 120 }}
                              onSelect={handleStatusChange}
                            >
                              <Option value="open">Open</Option>
                              <Option value="in-progress">In Progress</Option>
                              <Option value="resolved">Resolved</Option>
                              <Option value="closed">Closed</Option>
                            </Select>
                            <Button size="small" onClick={() => setEditingStatus(false)}>
                              Cancel
                            </Button>
                          </Space>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Tag color={getStatusColor(ticket.status)} icon={getStatusIcon(ticket.status)}>
                              {ticket.status.replace("-", " ").toUpperCase()}
                            </Tag>
                            {userRole !== "user" && (
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => setEditingStatus(true)}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Priority */}
                    <div>
                      <Text strong>Priority:</Text>
                      <div style={{ marginTop: 4 }}>
                        {editingPriority && userRole !== "user" ? (
                          <Space>
                            <Select
                              size="small"
                              defaultValue={ticket.priority}
                              style={{ width: 120 }}
                              onSelect={handlePriorityChange}
                            >
                              <Option value="critical">Critical</Option>
                              <Option value="high">High</Option>
                              <Option value="medium">Medium</Option>
                              <Option value="low">Low</Option>
                            </Select>
                            <Button size="small" onClick={() => setEditingPriority(false)}>
                              Cancel
                            </Button>
                          </Space>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Tag color={getPriorityColor(ticket.priority)}>{ticket.priority.toUpperCase()}</Tag>
                            {userRole !== "user" && (
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => setEditingPriority(true)}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <Divider style={{ margin: "8px 0" }} />

                    {/* Reporter */}
                    <div>
                      <Text strong>Reporter:</Text>
                      <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar size="small" icon={<UserOutlined />} />
                        <div>
                          <Text>{ticket.reporter}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {ticket.reporterEmail}
                          </Text>
                        </div>
                      </div>
                    </div>

                    {/* Assignee */}
                    {userRole !== "user" && (
                      <div>
                        <Text strong>Assignee:</Text>
                        <div style={{ marginTop: 4 }}>
                          {editingAssignee ? (
                            <Space>
                              <Select
                                size="small"
                                defaultValue={ticket.assignee}
                                style={{ width: 140 }}
                                onSelect={handleAssigneeChange}
                              >
                                <Option value="Support Team">Support Team</Option>
                                <Option value="Tech Support">Tech Support</Option>
                                <Option value="Senior Engineer">Senior Engineer</Option>
                                <Option value="Security Specialist">Security Specialist</Option>
                              </Select>
                              <Button size="small" onClick={() => setEditingAssignee(false)}>
                                Cancel
                              </Button>
                            </Space>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Avatar size="small" icon={<TeamOutlined />} />
                              <Text>{ticket.assignee}</Text>
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => setEditingAssignee(true)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Organization */}
                    <div>
                      <Text strong>Organization:</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text>{ticket.tenant}</Text>
                      </div>
                    </div>

                    {/* Tags */}
                    {ticket.tags && ticket.tags.length > 0 && (
                      <div>
                        <Text strong>Tags:</Text>
                        <div style={{ marginTop: 4 }}>
                          {ticket.tags.map((tag) => (
                            <Tag key={tag} icon={<TagOutlined />} size="small">
                              {tag}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}
                  </Space>
                </Card>

                {/* Timeline */}
                <Card title="Timeline" size="small" style={{ marginBottom: 16 }}>
                  <Timeline size="small">
                    <Timeline.Item color="blue" dot={<CalendarOutlined />}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Created: {ticket.createdAt}
                      </Text>
                    </Timeline.Item>
                    <Timeline.Item color="orange" dot={<ClockCircleOutlined />}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Updated: {ticket.updatedAt}
                      </Text>
                    </Timeline.Item>
                    {ticket.estimatedResolution && (
                      <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Est. Resolution: {ticket.estimatedResolution}
                        </Text>
                      </Timeline.Item>
                    )}
                  </Timeline>
                </Card>

                {/* GitHub Issue */}
                {ticket.githubIssue && (
                  <Card title="GitHub Issue" size="small" style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <GithubOutlined />
                      <Text strong>#{ticket.githubIssue.number}</Text>
                      <Tag color={ticket.githubIssue.status === "open" ? "green" : "default"}>
                        {ticket.githubIssue.status}
                      </Tag>
                    </div>
                    <Text style={{ fontSize: 12, display: "block", marginBottom: 8 }}>{ticket.githubIssue.title}</Text>
                    <Button type="link" href={ticket.githubIssue.url} target="_blank" style={{ padding: 0 }}>
                      View on GitHub
                    </Button>
                  </Card>
                )}

                {/* Online Users */}
                <Card title="Participants" size="small" style={{ marginBottom: 16 }}>
                  <List
                    size="small"
                    dataSource={onlineUsers}
                    renderItem={(user) => (
                      <List.Item style={{ padding: "4px 0" }}>
                        <List.Item.Meta
                          avatar={
                            <Badge dot={user.isOnline} color={user.isOnline ? "green" : "gray"}>
                              <Avatar size="small" icon={<UserOutlined />} />
                            </Badge>
                          }
                          title={<Text style={{ fontSize: 12 }}>{user.name}</Text>}
                          description={
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {user.role} • {user.isOnline ? "Online" : "Offline"}
                            </Text>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>

                {/* Rating */}
                {userRole === "user" && ticket.status === "resolved" && (
                  <Card title="Rate Support" size="small">
                    <div style={{ textAlign: "center" }}>
                      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                        How was your support experience?
                      </Text>
                      <Space>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Button
                            key={star}
                            type="text"
                            icon={ticketRating >= star ? <StarFilled /> : <StarOutlined />}
                            onClick={() => handleRateTicket(star)}
                            style={{
                              color: ticketRating >= star ? "#faad14" : "#d9d9d9",
                              padding: 0,
                            }}
                          />
                        ))}
                      </Space>
                      {ticketRating > 0 && (
                        <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
                          Thank you for your feedback!
                        </Text>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </Sider>
          )}
        </Layout>
      </Content>

      <BackTop />

      {/* GitHub Issue Modal */}
      <GitHubIssueModal
        visible={showGithubModal}
        onCancel={() => setShowGithubModal(false)}
        onSubmit={handleCreateGithubIssue}
        ticket={ticket}
        loading={creatingGithubIssue}
      />

      {/* Rating Modal */}
      <Modal
        title="Rate Support Experience"
        open={ratingModalVisible}
        onOk={handleRatingSubmit}
        onCancel={() => {
          setRatingModalVisible(false)
          setTicketRating(0)
          setFeedback("")
        }}
        okText="Submit Rating"
        okButtonProps={{ disabled: ticketRating === 0 }}
      >
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <Text>How would you rate your support experience?</Text>
        </div>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <Rate value={ticketRating} onChange={setTicketRating} />
        </div>
        <TextArea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Optional feedback..."
          rows={3}
        />
      </Modal>
    </Layout>
  )
}

export default SupportChatPage