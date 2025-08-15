"use client"

import { useState, useEffect, useRef } from "react"
import {
  Badge,
  Dropdown,
  Button,
  Typography,
  List,
  Empty,
  Spin,
  Divider,
} from "antd"
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  SettingOutlined,
} from "@ant-design/icons"
import notificationService from "../../services/NotificationService"
import NotificationItem from "./NotificationItem"
import "./NotificationBell.css"
import { useTheme } from "../theme/ThemeProvider"

const { Text, Title } = Typography

const NotificationBell = ({ token }) => {
  const { theme } = useTheme()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    try {
      notificationService.connect(token)
    } catch (error) {
      console.error("Failed to connect to notification service:", error)
    }

    setLoading(true)
    notificationService.fetchNotifications().then(() => {
      setNotifications(notificationService.getNotifications())
      setUnreadCount(notificationService.getUnreadCount())
      setLoading(false)
    })

    const unsubscribeNotification = notificationService.subscribe("notification", (notification) => {
      if (!notification || !notification.id) return
      setNotifications((prev) => {
        const alreadyExists = prev.some((n) => n.id === notification.id)
        if (alreadyExists) return prev
        return [notification, ...prev]
      })
    })

    const unsubscribeUnreadCount = notificationService.subscribe("unreadCountChanged", (count) => {
      setUnreadCount(count)
    })

    const unsubscribeList = notificationService.subscribe("notificationsChanged", (list) => {
      setNotifications([...list]) // 🔄 sync notification list
    })

    return () => {
      unsubscribeNotification()
      unsubscribeUnreadCount()
      unsubscribeList()
      notificationService.disconnect()
    }
  }, [token])

  const handleVisibleChange = (flag) => {
    setVisible(flag)
    if (flag) {
      const unreadNotifications = notifications.filter((n) => !n.read)
      if (unreadNotifications.length > 0) {
        setTimeout(() => {
          notificationService.markAllAsRead()
        }, 3000)
      }
    }
  }

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead()
  }

  const handleClearAll = () => {
    notificationService.clearAllNotifications()
  }

  const handleNotificationClick = (notification) => {
    notificationService.markAsRead(notification.id)

    if (notification.type === "DEVICE_ADDED") {
      window.location.href = `/devices/${notification.entityId}`
    }
  }

  const menu = (
    <div className={`notification-dropdown ${theme === "dark" ? "dark" : ""}`}>
      <div className="notification-header">
        <Title level={5} style={{ margin: 0 }}>Notifications</Title>
        <div>
          <Button
            type="text"
            size="small"
            icon={<CheckOutlined />}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all read
          </Button>
          {/* <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={handleClearAll}
            disabled={notifications.length === 0}
          >
            Clear all
          </Button>
           */}
           <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            title="Move all to Trash"
          >
            Clear all
          </Button>

          <Button type="text" size="small" icon={<SettingOutlined />}>
            Settings
          </Button>
          
        </div>
      </div>
      <Divider style={{ margin: "0 0 8px 0" }} />
      <div className="notification-content">
        {loading ? (
          <div className="notification-loading">
            <Spin size="small" />
            <Text type="secondary">Loading notifications...</Text>
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No notifications"
            style={{ margin: "20px 0" }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <NotificationItem
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
              />
            )}
          />
        )}
      </div>
      <Divider style={{ margin: "8px 0 0 0" }} />
      <div className="notification-footer">
        <Button type="link" onClick={() => (window.location.href = "/notification-center")}>
          View all notifications
        </Button>
      </div>
    </div>
  )

  return (
    <Dropdown
      overlay={menu}
      trigger={["click"]}
      open={visible}
      onOpenChange={handleVisibleChange}
      getPopupContainer={(trigger) => trigger.parentNode}
      overlayClassName="notification-dropdown-overlay"
      placement="bottomRight"
      arrow={{ pointAtCenter: true }}
    >
      <Badge count={unreadCount} overflowCount={99} size="small">
        <Button type="text" icon={<BellOutlined />} className="header-icon-button" />
      </Badge>
    </Dropdown>
  )
}

export default NotificationBell
