"use client"

import { useState, useEffect } from "react"
import {
  Tabs,
  Button,
  Table,
  Space,
  Typography,
  Tag,
} from "antd"
import {
  SearchOutlined,
  ReloadOutlined,
  SendOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  RollbackOutlined,
} from "@ant-design/icons"
import notificationService from "../../services/NotificationService"
import NotificationTemplateModal from "./NotificationTemplateModal"
import NotificationRecipientsModal from "./NotificationRecipientsModal"
import NotificationSendModal from "./NotificationSendModal"

const { TabPane } = Tabs
const { Title } = Typography

const severityColors = {
  CRITICAL: "red",
  HIGH: "volcano",
  MEDIUM: "gold",
  LOW: "geekblue",
  INFO: "gray",
  UNKNOWN: "purple", // fallback
}

const formatSeverity = (s) => {
  if (!s || typeof s !== "string") return "Unknown"
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

const NotificationCenter = () => {
  const [activeTab, setActiveTab] = useState("inbox")
  const [notifications, setNotifications] = useState([])
  const [trash, setTrash] = useState([])
  const [templates, setTemplates] = useState([])
  const [recipients, setRecipients] = useState([])
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(false)
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false)
  const [isRecipientsModalVisible, setIsRecipientsModalVisible] = useState(false)
  const [isSendModalVisible, setIsSendModalVisible] = useState(false)
  const [filterType, setFilterType] = useState("all")

  useEffect(() => {
    fetchNotifications()

    const unsub1 = notificationService.subscribe("notificationsChanged", (list) => {
      setNotifications(list)
      setTrash(notificationService.getDeletedNotifications())
    })

    return () => {
      unsub1()
    }
  }, [activeTab])

  const fetchNotifications = async () => {
    setLoading(true)
    await notificationService.fetchNotifications()
    setNotifications(notificationService.getNotifications())
    setTrash(notificationService.getDeletedNotifications())
    setLoading(false)
  }

  const handleTabChange = (key) => setActiveTab(key)
  const handleFilterChange = (value) => setFilterType(value)

  const markAsRead = (id) => notificationService.markAsRead(id)
  const deleteNotification = (id) => notificationService.deleteNotification(id)
  const restoreNotification = (id) => notificationService.restoreNotification(id)

  const inboxColumns = [
    {
      title: "Created",
      dataIndex: "createdTime",
      key: "createdTime",
      sorter: (a, b) => new Date(a.createdTime) - new Date(b.createdTime),
    },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      filters: Object.keys(severityColors).map((key) => ({
        text: formatSeverity(key),
        value: key,
      })),
      onFilter: (value, record) => record.severity === value,
      sorter: (a, b) => {
        const order = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4, INFO: 5 }
        return (order[a.severity] || 999) - (order[b.severity] || 999)
      },
      render: (severityRaw) => {
        const severity = severityRaw || "UNKNOWN"
        return (
          <Tag color={severityColors[severity] || severityColors.UNKNOWN}>
            {formatSeverity(severity)}
          </Tag>
        )
      },
    },
    { title: "Type", dataIndex: "type", key: "type" },
    { title: "Title", dataIndex: "title", key: "title" },
    { title: "Message", dataIndex: "message", key: "message" },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<CheckCircleOutlined />} onClick={() => markAsRead(record.id)} />
          <Button icon={<DeleteOutlined />} onClick={() => deleteNotification(record.id)} />
        </Space>
      ),
    },
  ]

  const trashColumns = [
    {
      title: "Deleted",
      dataIndex: "createdTime",
      key: "createdTime",
      sorter: (a, b) => new Date(a.createdTime) - new Date(b.createdTime),
    },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      render: (severityRaw) => {
        const severity = severityRaw || "UNKNOWN"
        return (
          <Tag color={severityColors[severity] || severityColors.UNKNOWN}>
            {formatSeverity(severity)}
          </Tag>
        )
      },
    },
    { title: "Title", dataIndex: "title", key: "title" },
    { title: "Message", dataIndex: "message", key: "message" },
    {
      title: "",
      key: "restore",
      render: (_, record) => (
        <Button icon={<RollbackOutlined />} onClick={() => restoreNotification(record.id)} />
      ),
    },
  ]

  const renderInboxTab = () => (
    <>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <Space>
          <Button type={filterType === "unread" ? "primary" : "default"} onClick={() => handleFilterChange("unread")}>
            Unread
          </Button>
          <Button type={filterType === "all" ? "primary" : "default"} onClick={() => handleFilterChange("all")}>
            All
          </Button>
        </Space>
        <Space>
          <Button icon={<CheckCircleOutlined />} onClick={() => notificationService.markAllAsRead()}>
            Mark all as read
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchNotifications} />
          <Button icon={<SearchOutlined />} />
        </Space>
      </div>
      <Table
        columns={inboxColumns}
        dataSource={
          filterType === "unread" ? notifications.filter((n) => !n.read) : notifications
        }
        loading={loading}
        rowKey="id"
        rowClassName={(record) => (!record.read ? "unread-row" : "")}
        pagination={{ pageSize: 10 }}
      />
    </>
  )

  return (
    <div className="notification-center">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={4}>Notification Center</Title>
        <Button type="primary" icon={<SendOutlined />} onClick={() => setIsSendModalVisible(true)}>
          Send notification
        </Button>
      </div>
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="Inbox" key="inbox">{renderInboxTab()}</TabPane>
        <TabPane tab="Trash" key="trash">
          <Table
            columns={trashColumns}
            dataSource={trash}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </TabPane>
        <TabPane tab="Sent" key="sent">
          <div style={{ padding: 20, textAlign: "center" }}>
            <Typography.Text type="secondary">Sent notifications will appear here</Typography.Text>
          </div>
        </TabPane>
        <TabPane tab="Recipients" key="recipients" />
        <TabPane tab="Templates" key="templates" />
        <TabPane tab="Rules" key="rules" />
      </Tabs>

      <NotificationTemplateModal
        visible={isTemplateModalVisible}
        onCancel={() => setIsTemplateModalVisible(false)}
        onSave={(template) => {
          setTemplates([...templates, {
            ...template,
            id: Date.now().toString(),
            createdTime: new Date().toISOString()
          }])
          setIsTemplateModalVisible(false)
        }}
      />

      <NotificationRecipientsModal
        visible={isRecipientsModalVisible}
        onCancel={() => setIsRecipientsModalVisible(false)}
        onSave={(recipient) => {
          setRecipients([...recipients, {
            ...recipient,
            id: Date.now().toString(),
            createdTime: new Date().toISOString()
          }])
          setIsRecipientsModalVisible(false)
        }}
      />

      <NotificationSendModal
        visible={isSendModalVisible}
        onCancel={() => setIsSendModalVisible(false)}
        onSend={() => setIsSendModalVisible(false)}
        templates={templates}
        recipients={recipients}
      />
    </div>
  )
}

export default NotificationCenter
