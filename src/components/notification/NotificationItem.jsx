"use client"
import { List, Avatar, Button, Typography, Space, Tag } from "antd"
import { InfoCircleOutlined, BellOutlined, WarningOutlined, CheckCircleOutlined } from "@ant-design/icons"
import { formatDistanceToNow } from "date-fns"
import { useTheme } from "../theme/ThemeProvider"

const { Text, Paragraph } = Typography

const NotificationItem = ({ notification, onClick }) => {
  const { theme } = useTheme()

  const getIcon = () => {
    switch (notification.type) {
      case "DEVICE_ADDED":
        return <InfoCircleOutlined style={{ color: "#1890ff" }} />
      case "ALARM":
        return <WarningOutlined style={{ color: "#f5222d" }} />
      case "SUCCESS":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />
      default:
        return <BellOutlined />
    }
  }

  const getTimeAgo = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch (e) {
      return "unknown time"
    }
  }

  const getTypeTag = (type) => {
    let color = "default"
    let label = type

    switch (type) {
      case "DEVICE_ADDED":
        color = "blue"
        label = "Device"
        break
      case "ALARM":
        color = "red"
        label = "Alarm"
        break
      case "SUCCESS":
        color = "green"
        label = "Success"
        break
      default:
        color = "default"
        label = type
    }

    return (
      <Tag color={color} style={{ fontSize: "0.7rem", padding: "0 4px" }}>
        {label}
      </Tag>
    )
  }

  const renderActionButton = () => {
    switch (notification.type) {
      case "DEVICE_ADDED":
        return (
          <Button
            size="small"
            type="primary"
            onClick={(e) => {
              e.stopPropagation()
              window.location.href = `/devices/${notification.entityId}`
            }}
          >
            View device
          </Button>
        )
      case "ALARM":
        return (
          <Button
            size="small"
            danger
            onClick={(e) => {
              e.stopPropagation()
              window.location.href = `/alarms/${notification.entityId}`
            }}
          >
            View alarm
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <List.Item
      className={`notification-item ${notification.read ? "" : "unread"}`}
      onClick={() => onClick(notification)}
      style={{ cursor: "pointer" }}
    >
      <List.Item.Meta
        avatar={<Avatar icon={getIcon()} />}
        title={
          <Space size={4} align="center">
            <Text strong>{notification.title}</Text>
            {getTypeTag(notification.type)}
          </Space>
        }
        description={
          <Space direction="vertical" size={2} style={{ width: "100%" }}>
            <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
              {notification.message}
            </Paragraph>
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {getTimeAgo(notification.createdTime)}
              </Text>
              {renderActionButton()}
            </Space>
          </Space>
        }
      />
      {!notification.read && (
        <div
          className="notification-unread-indicator"
          style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#1890ff" }}
        />
      )}
    </List.Item>
  )
}

export default NotificationItem
