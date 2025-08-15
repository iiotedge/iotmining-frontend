"use client"

import { useState, useEffect } from "react"
import { Card, Typography, Tag, Spin, List, Button, Empty, Badge } from "antd"
import {
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  BellOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons"
import moment from "moment"
import "../../../styles/widget/alert-system-card-widget.css"

const { Title, Text } = Typography

const AlertSystemCardWidget = ({
  data = [],
  theme = "light",
  title = "Alerts",
  maxAlerts = 5,
  showClearAllButton = true,
  ...restProps
}) => {
  const darkMode = restProps.darkMode ?? (theme === "dark")
  const [alerts, setAlerts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  // Severity color/icon mapping
  const getSeverityColor = severity => {
    switch ((severity || "").toLowerCase()) {
      case "critical": return "red"
      case "major": return "orange"
      case "warning": return "gold"
      case "info": return "blue"
      default: return "default"
    }
  }
  const getSeverityIcon = severity => {
    switch ((severity || "").toLowerCase()) {
      case "critical": return <ExclamationCircleOutlined />
      case "major": return <WarningOutlined />
      case "warning": return <InfoCircleOutlined />
      case "info": return <InfoCircleOutlined />
      default: return null
    }
  }

  // Data parser: trims, reverses for newest first
  useEffect(() => {
    setIsLoading(true)
    let alertsList = Array.isArray(data)
      ? data.slice(-maxAlerts).reverse()
      : []
    setAlerts(alertsList)
    setUnreadCount(alertsList.filter(a => !a.isRead).length)
    setTimeout(() => setIsLoading(false), 200)
  }, [data, maxAlerts])

  const handleClearAll = () => {
    setAlerts([])
    setUnreadCount(0)
  }
  const handleAcknowledge = idx => {
    setAlerts(prev => {
      const next = [...prev]
      if (!next[idx].isRead) {
        next[idx].isRead = true
        setUnreadCount(c => Math.max(0, c - 1))
      }
      return next
    })
  }

  const cardClassName = `alert-system-card-widget${darkMode ? " dark-mode" : ""}`

  return (
    <Card
      title={
        <div className="alert-card-header" style={{ display: "flex", alignItems: "center" }}>
          <Title level={4} className="alert-card-title" style={{ flex: 1, margin: 0 }}>
            {title}
          </Title>
          {unreadCount > 0 && (
            <Badge count={unreadCount} offset={[10, 0]} className="alert-badge">
              <BellOutlined className="alert-bell-icon" />
            </Badge>
          )}
        </div>
      }
      bordered
      className={cardClassName}
    >
      {isLoading ? (
        <div className="alert-system-loading">
          <Spin size="large" tip="Loading alerts..." />
        </div>
      ) : (
        <div className="alert-system-content">
          {alerts.length === 0 ? (
            <Empty
              image={<CheckCircleOutlined style={{ fontSize: 48, color: "#52c41a" }} />}
              description={<Text type="secondary">No active alerts</Text>}
              className="no-alerts-empty"
            />
          ) : (
            <List
              itemLayout="vertical"
              dataSource={alerts}
              renderItem={(item, index) => (
                <List.Item
                  className={`alert-list-item ${item.isRead ? "read" : "unread"}`}
                  actions={[
                    <Button
                      key="acknowledge"
                      type="link"
                      onClick={() => handleAcknowledge(index)}
                      disabled={item.isRead}
                      className={darkMode ? "dark-mode-link-button" : ""}
                    >
                      {item.isRead ? "Acknowledged" : "Acknowledge"}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div className={`alert-icon-wrapper ${getSeverityColor(item.severity)}`}>
                        {getSeverityIcon(item.severity)}
                      </div>
                    }
                    title={
                      <Text strong className={item.isRead ? "read-text" : ""}>
                        {item.description}
                      </Text>
                    }
                    description={
                      <div className="alert-meta-details">
                        <div style={{ marginBottom: 4 }}>
                          <Tag color={getSeverityColor(item.severity)} size="small">
                            {(item.severity || "").toUpperCase()}
                          </Tag>
                          <Text type="secondary" style={{ marginLeft: 12 }}>
                            {moment(item.timestamp).format("YYYY-MM-DD HH:mm:ss")}
                          </Text>
                        </div>
                        <div>
                          <Text type="secondary">
                            <b>Type:</b> {item.type}
                          </Text>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
          {showClearAllButton && alerts.length > 0 && (
            <div className="alert-actions" style={{ textAlign: "right", marginTop: 12 }}>
              <Button
                type="primary"
                danger
                onClick={handleClearAll}
                icon={<CloseCircleOutlined />}
                className={darkMode ? "dark-mode-danger-button" : ""}
              >
                Clear All Alerts
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default AlertSystemCardWidget
