"use client"

import { useState, useEffect } from "react"
import {
  Modal,
  Card,
  Typography,
  Tag,
  Space,
  Button,
  Input,
  Upload,
  List,
  Avatar,
  Divider,
  Select,
  Row,
  Col,
  Badge,
  message,
  Timeline,
} from "antd"
import {
  CloseOutlined,
  EditOutlined,
  SendOutlined,
  PaperClipOutlined,
  DownloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  TagOutlined,
  TeamOutlined,
  CalendarOutlined,
} from "@ant-design/icons"

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select

const TicketDetailsModal = ({ visible, ticket, onCancel, onUpdate, userRole }) => {
  const [loading, setLoading] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [commentFiles, setCommentFiles] = useState([])
  const [comments, setComments] = useState([])
  const [editingStatus, setEditingStatus] = useState(false)
  const [editingPriority, setEditingPriority] = useState(false)
  const [editingAssignee, setEditingAssignee] = useState(false)

  // Mock comments data
  useEffect(() => {
    if (ticket) {
      setComments([
        {
          id: 1,
          author: "John Doe",
          authorRole: "Reporter",
          content:
            "I've tried restarting the device multiple times but the issue persists. The sensor was working fine until yesterday evening.",
          timestamp: "2024-01-15 10:30:00",
          attachments: ["device-restart-log.txt"],
          type: "comment",
        },
        {
          id: 2,
          author: "Support Agent",
          authorRole: "Agent",
          content:
            "Thank you for the additional information. I can see from the logs that there's a connectivity issue. Let me escalate this to our technical team.",
          timestamp: "2024-01-15 11:45:00",
          attachments: [],
          type: "comment",
        },
        {
          id: 3,
          author: "System",
          authorRole: "System",
          content: "Ticket status changed from 'Open' to 'In Progress'",
          timestamp: "2024-01-15 11:46:00",
          attachments: [],
          type: "system",
        },
        {
          id: 4,
          author: "Tech Support",
          authorRole: "Agent",
          content:
            "I've identified the root cause. The device's SSL certificate expired. I'm updating the certificate now and will test the connection.",
          timestamp: "2024-01-15 14:20:00",
          attachments: ["certificate-update-procedure.pdf"],
          type: "comment",
        },
      ])
    }
  }, [ticket])

  if (!ticket) return null

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      message.warning("Please enter a comment")
      return
    }

    setLoading(true)
    try {
      const newComment = {
        id: comments.length + 1,
        author: userRole === "user" ? ticket.reporter : "Support Agent",
        authorRole: userRole === "user" ? "Reporter" : "Agent",
        content: commentText,
        timestamp: new Date().toLocaleString(),
        attachments: commentFiles.map((file) => file.name),
        type: "comment",
      }

      setComments([...comments, newComment])
      setCommentText("")
      setCommentFiles([])
      message.success("Comment added successfully")
    } catch (error) {
      message.error("Failed to add comment")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      const updatedTicket = { ...ticket, status: newStatus, updatedAt: new Date().toLocaleString() }

      // Add system comment
      const systemComment = {
        id: comments.length + 1,
        author: "System",
        authorRole: "System",
        content: `Ticket status changed from '${ticket.status}' to '${newStatus}'`,
        timestamp: new Date().toLocaleString(),
        attachments: [],
        type: "system",
      }

      setComments([...comments, systemComment])
      onUpdate(updatedTicket)
      setEditingStatus(false)
      message.success("Status updated successfully")
    } catch (error) {
      message.error("Failed to update status")
    }
  }

  const handlePriorityChange = async (newPriority) => {
    try {
      const updatedTicket = { ...ticket, priority: newPriority, updatedAt: new Date().toLocaleString() }
      onUpdate(updatedTicket)
      setEditingPriority(false)
      message.success("Priority updated successfully")
    } catch (error) {
      message.error("Failed to update priority")
    }
  }

  const handleAssigneeChange = async (newAssignee) => {
    try {
      const updatedTicket = { ...ticket, assignee: newAssignee, updatedAt: new Date().toLocaleString() }
      onUpdate(updatedTicket)
      setEditingAssignee(false)
      message.success("Assignee updated successfully")
    } catch (error) {
      message.error("Failed to update assignee")
    }
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
    fileList: commentFiles,
    onChange: ({ fileList }) => setCommentFiles(fileList),
    beforeUpload: () => false,
    multiple: true,
  }

  return (
    <Modal
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Text strong>{ticket.id}</Text>
            <Text type="secondary" style={{ marginLeft: 8 }}>
              • Created {ticket.createdAt}
            </Text>
          </div>
          <Button type="text" icon={<CloseOutlined />} onClick={onCancel} />
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
      destroyOnClose
    >
      <Row gutter={24}>
        {/* Left Column - Ticket Details */}
        <Col span={16}>
          <Card title={ticket.title} size="small" style={{ marginBottom: 16 }}>
            <Paragraph>{ticket.description}</Paragraph>

            {ticket.attachments && ticket.attachments.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Attachments:</Text>
                <div style={{ marginTop: 8 }}>
                  {ticket.attachments.map((file, index) => (
                    <Tag key={index} icon={<PaperClipOutlined />} style={{ marginBottom: 4 }}>
                      {file}
                      <Button
                        type="text"
                        size="small"
                        icon={<DownloadOutlined />}
                        style={{ marginLeft: 4, padding: 0 }}
                      />
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {ticket.tags && ticket.tags.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Tags:</Text>
                <div style={{ marginTop: 8 }}>
                  {ticket.tags.map((tag) => (
                    <Tag key={tag} icon={<TagOutlined />}>
                      {tag}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Comments Section */}
          <Card title={`Comments (${comments.length})`} size="small">
            <List
              dataSource={comments}
              renderItem={(comment) => (
                <List.Item style={{ padding: "12px 0" }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={comment.type === "system" ? <FileTextOutlined /> : <UserOutlined />}
                        style={{
                          backgroundColor:
                            comment.type === "system"
                              ? "#1890ff"
                              : comment.authorRole === "Agent"
                                ? "#52c41a"
                                : "#fa8c16",
                        }}
                      />
                    }
                    title={
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Text strong>{comment.author}</Text>
                        <Tag
                          size="small"
                          color={
                            comment.authorRole === "System"
                              ? "blue"
                              : comment.authorRole === "Agent"
                                ? "green"
                                : "orange"
                          }
                        >
                          {comment.authorRole}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {comment.timestamp}
                        </Text>
                      </div>
                    }
                    description={
                      <div>
                        <Paragraph style={{ marginBottom: 8 }}>{comment.content}</Paragraph>
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div>
                            {comment.attachments.map((file, index) => (
                              <Tag key={index} icon={<PaperClipOutlined />} size="small">
                                {file}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />

            <Divider />

            {/* Add Comment */}
            <div>
              <TextArea
                rows={3}
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                style={{ marginBottom: 8 }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Upload {...uploadProps}>
                  <Button icon={<PaperClipOutlined />} size="small">
                    Attach Files
                  </Button>
                </Upload>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleAddComment}
                  loading={loading}
                  disabled={!commentText.trim()}
                >
                  Add Comment
                </Button>
              </div>
            </div>
          </Card>
        </Col>

        {/* Right Column - Ticket Properties */}
        <Col span={8}>
          <Card title="Ticket Information" size="small">
            <Space direction="vertical" style={{ width: "100%" }}>
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

              {/* Tenant */}
              <div>
                <Text strong>Organization:</Text>
                <div style={{ marginTop: 4 }}>
                  <Text>{ticket.tenant}</Text>
                </div>
              </div>

              {/* Timestamps */}
              <Divider style={{ margin: "12px 0" }} />

              <div>
                <Text strong>Timeline:</Text>
                <Timeline size="small" style={{ marginTop: 8 }}>
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
              </div>
            </Space>
          </Card>

          {/* SLA Information */}
          {userRole !== "user" && (
            <Card title="SLA Information" size="small" style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <div>
                  <Text strong>Response Time:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Badge status="success" text="Met (2.5 hours)" />
                  </div>
                </div>
                <div>
                  <Text strong>Resolution Time:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Badge status="processing" text="In Progress" />
                  </div>
                </div>
              </Space>
            </Card>
          )}
        </Col>
      </Row>
    </Modal>
  )
}

export default TicketDetailsModal