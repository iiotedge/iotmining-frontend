"use client"

import { useState, useEffect } from "react"
import { Card, Typography, Tag, Spin } from "antd"
import {
  FireOutlined,
  CheckCircleOutlined,
  BellOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
} from "@ant-design/icons"
import moment from "moment"
import { getByDotPath } from "../../../utils/dotPath"
import { useTheme } from "../../theme/ThemeProvider"
import "../../../styles/widget/fire-detection-widget.css"

const { Title, Text } = Typography

const FireDetectionWidget = (props) => {
  const {
    data = [],
    dataKeys = [],
    title = "Fire Detection",
    showTitle = true,
    showLastDetectedTime = true,
    showLocation = false,
    locationLabel = "Zone",
    showSensorId = false,
    sensorIdLabel = "Detector ID",
    refreshInterval = 8,
    dropShadow = true,
    borderRadius = 14,
    ...rest
  } = props.commonProps || props

  // Theme support
  const { isDarkMode, tokens } = useTheme()

  // --- Data keys: flexible mapping, fallback if empty ---
  // 0: fire_detected, 1: alarm_triggered, 2: lastDetectedTime, 3: location, 4: sensorId
  const fireDetectedKey     = dataKeys[0] || "fire_detected"
  const alarmTriggeredKey   = dataKeys[1] || "alarm_triggered"
  const lastDetectedTimeKey = dataKeys[2] || "lastDetectedTime"
  const locationKey         = dataKeys[3] || "location"
  const sensorIdKey         = dataKeys[4] || "sensorId"

  // Always get the *latest* record (supports array or single object)
  const latest = Array.isArray(data) && data.length ? data[data.length - 1] : data || {}

  // State for widget fields
  const [fields, setFields] = useState({
    isFireDetected: false,
    isAlarmTriggered: false,
    lastDetectedTime: null,
    location: "",
    sensorId: "",
  })

  // --- Use realtime data (mapped via dataKeys) ---
  useEffect(() => {
    setFields({
      isFireDetected: !!getByDotPath(latest, fireDetectedKey),
      isAlarmTriggered: !!getByDotPath(latest, alarmTriggeredKey),
      lastDetectedTime: getByDotPath(latest, lastDetectedTimeKey) || null,
      location: getByDotPath(latest, locationKey) || "Server Room A",
      sensorId: getByDotPath(latest, sensorIdKey) || "FD-D001",
    })
  }, [
    latest,
    fireDetectedKey,
    alarmTriggeredKey,
    lastDetectedTimeKey,
    locationKey,
    sensorIdKey,
  ])

  // --- Fallback demo/mock data if nothing is present ---
  useEffect(() => {
    if (
      latest && Object.keys(latest).length &&
      (getByDotPath(latest, fireDetectedKey) !== undefined ||
      getByDotPath(latest, alarmTriggeredKey) !== undefined)
    ) return

    const mock = () => {
      const detected = Math.random() < 0.22
      const alarmed = detected && Math.random() < 0.4
      setFields({
        isFireDetected: detected,
        isAlarmTriggered: alarmed,
        lastDetectedTime: moment().valueOf(),
        location: rest.location || "Server Room A",
        sensorId: rest.sensorId || "FD-D001",
      })
    }
    mock()
    const interval = setInterval(mock, (refreshInterval || 8) * 1000)
    return () => clearInterval(interval)
  }, [
    latest,
    fireDetectedKey,
    alarmTriggeredKey,
    lastDetectedTimeKey,
    locationKey,
    sensorIdKey,
    rest.location,
    rest.sensorId,
    refreshInterval,
  ])

  const { isFireDetected, isAlarmTriggered, lastDetectedTime, location, sensorId } = fields

  // --- UI Logic, use theme tokens ---
  const getStatusText = () => {
    if (isAlarmTriggered) return "Alarm Triggered"
    if (isFireDetected) return "Fire Detected"
    return "No Fire Detected"
  }
  const getStatusColor = () => {
    if (isAlarmTriggered) return tokens.err
    if (isFireDetected) return tokens.warn
    return tokens.ok
  }
  const getStatusIcon = () => {
    if (isAlarmTriggered) return <BellOutlined />
    if (isFireDetected) return <FireOutlined />
    return <CheckCircleOutlined />
  }

  // --- Render ---
  return (
    <Card
      className={`fire-detection-widget${isDarkMode ? " dark-mode" : ""} ${isFireDetected ? "fire-detected" : ""} ${isAlarmTriggered ? "alarm-triggered" : ""}`}
      title={
        showTitle ? (
          <Title level={5} className="widget-title" style={{ color: tokens.colorText }}>
            {title}
          </Title>
        ) : null
      }
      style={{
        background: tokens.colorBgContainer,
        color: tokens.colorText,
        boxShadow: dropShadow ? tokens.boxShadow : "none",
        borderRadius,
        minWidth: 220,
        maxWidth: 420,
        margin: "auto",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}
      bodyStyle={{ padding: "20px 18px 14px 18px" }}
    >
      <div className="fire-icon-container" style={{ textAlign: "center", marginBottom: 18 }}>
        <FireOutlined className="fire-icon" />
        {isFireDetected && <div className="fire-animation"></div>}
        {isAlarmTriggered && <div className="alarm-pulse"></div>}
      </div>
      <div className="status-display" style={{ textAlign: "center", marginBottom: 12 }}>
        <Tag
          icon={getStatusIcon()}
          style={{
            background: getStatusColor() + "22",
            color: getStatusColor(),
            fontSize: 15,
            fontWeight: 700,
            borderRadius: 8,
            border: "none",
            margin: "0 auto",
            padding: "4px 16px",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            minWidth: 140,
            justifyContent: "center",
          }}
        >
          {getStatusText()}
        </Tag>
      </div>
      <div className="metadata-list">
        {showLastDetectedTime && lastDetectedTime && (
          <div className="meta-row">
            <ClockCircleOutlined className="meta-icon" />
            <span className="meta-label">Last Update</span>
            <span className="meta-value">
              {moment(lastDetectedTime).format("YYYY-MM-DD HH:mm:ss")}
            </span>
          </div>
        )}
        {showLocation && (
          <div className="meta-row">
            <EnvironmentOutlined className="meta-icon" />
            <span className="meta-label">{locationLabel}</span>
            <span className="meta-value">{location}</span>
          </div>
        )}
        {showSensorId && (
          <div className="meta-row">
            <IdcardOutlined className="meta-icon" />
            <span className="meta-label">{sensorIdLabel}</span>
            <span className="meta-value">{sensorId}</span>
          </div>
        )}
      </div>
    </Card>
  )
}

export default FireDetectionWidget
