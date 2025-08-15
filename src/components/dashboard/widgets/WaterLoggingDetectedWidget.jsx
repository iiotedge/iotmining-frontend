"use client"
import { useEffect, useState } from "react"
import { Card, Typography, Tag } from "antd"
import {
  CloudOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
} from "@ant-design/icons"
import moment from "moment"
import { getByDotPath } from "../../../utils/dotPath"
import { useTheme } from "../../theme/ThemeProvider"   // <- NEW LINE
import "../../../styles/widget/water-logging-detected-widget.css"

const { Title, Text } = Typography

const WaterLoggingDetectedWidget = (props) => {
  const {
    data = [],
    dataKeys = [],
    title = "Water Logging",
    showTitle = true,
    showLastDetectedTime = true,
    showLocation = false,
    locationLabel = "Area",
    showSensorId = false,
    sensorIdLabel = "Sensor ID",
    refreshInterval = 10,
    dropShadow = true,
    borderRadius = 14,
    ...rest
  } = props.commonProps || props

  // Use global theme and tokens!
  const { theme, isDarkMode, tokens } = useTheme()

  const latest = Array.isArray(data) && data.length ? data[data.length - 1] : data || {}

  const waterDetectedKey = dataKeys[0] || "water_logging"
  const lastDetectedTimeKey = dataKeys[1] || "time"
  const locationKey = dataKeys[2] || "location"
  const sensorIdKey = dataKeys[3] || "sensor_id"

  const [fields, setFields] = useState({
    isDetected: false,
    lastDetectedTime: null,
    location: "",
    sensorId: "",
  })

  useEffect(() => {
    setFields({
      isDetected: !!getByDotPath(latest, waterDetectedKey),
      lastDetectedTime: getByDotPath(latest, lastDetectedTimeKey) || null,
      location: getByDotPath(latest, locationKey) || "Basement Level 1",
      sensorId: getByDotPath(latest, sensorIdKey) || "WL-S001",
    })
  }, [latest, waterDetectedKey, lastDetectedTimeKey, locationKey, sensorIdKey])

  useEffect(() => {
    if (
      latest && Object.keys(latest).length &&
      getByDotPath(latest, waterDetectedKey) !== undefined
    ) return

    const mock = () => {
      setFields({
        isDetected: Math.random() < 0.3,
        lastDetectedTime: moment().valueOf(),
        location: rest.location || "Basement Level 1",
        sensorId: rest.sensorId || "WL-S001",
      })
    }
    mock()
    const interval = setInterval(mock, (refreshInterval || 10) * 1000)
    return () => clearInterval(interval)
  }, [latest, waterDetectedKey, lastDetectedTimeKey, locationKey, sensorIdKey, rest.location, rest.sensorId, refreshInterval])

  const { isDetected, lastDetectedTime, location, sensorId } = fields

  const statusText = isDetected ? "Water Detected" : "No Water Logging"
  const statusColor = isDetected ? tokens.err : tokens.ok // Use palette from theme!
  const statusIcon = isDetected ? <CloudOutlined /> : <CheckCircleOutlined />

  return (
    <Card
      className={`water-logging-widget-compact${isDarkMode ? " dark-mode" : ""} ${isDetected ? "water-detected" : ""}`}
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
        width: "100%",
        margin: 0,
        padding: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}
      bodyStyle={{ padding: "20px 18px 14px 18px" }}
    >
      <div className="water-icon-outer">
        <span className="icon-wrapper">
          <CloudOutlined className="water-drop-icon" />
          {isDetected && <span className="water-ripple"></span>}
        </span>
      </div>
      <div className="status-display">
        <Tag
          icon={statusIcon}
          style={{
            background: statusColor + "22",
            color: statusColor,
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
          {statusText}
        </Tag>
      </div>
      <div className="metadata-list">
        {showLastDetectedTime && lastDetectedTime && (
          <div className="meta-row">
            <ClockCircleOutlined className="meta-icon" />
            <span className="meta-label">Last Update</span>
            <span className="meta-value">{moment(lastDetectedTime).format("YYYY-MM-DD HH:mm:ss")}</span>
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

export default WaterLoggingDetectedWidget

// "use client"

// import { useEffect, useState } from "react"
// import { Card, Typography, Tag, Spin } from "antd"
// import {
//   CloudOutlined,
//   CheckCircleOutlined,
//   ClockCircleOutlined,
//   EnvironmentOutlined,
//   IdcardOutlined,
// } from "@ant-design/icons"
// import moment from "moment"
// import { getByDotPath } from "../../../utils/dotPath"
// import "../../../styles/water-logging-detected-widget.css"

// const { Title, Text } = Typography

// /**
//  * WaterLoggingDetectedWidget - ValueCard-style, dynamic dataKeys, dot-path enabled, commonProps-driven.
//  *
//  * Expects: {...commonProps, data, dataKeys, theme, config ...}
//  *   - data: Array (time series) or Object (latest)
//  *   - dataKeys: [waterDetected, lastDetectedTime, location, sensorId] (all dot-paths, order matters!)
//  */
// const WaterLoggingDetectedWidget = (props) => {
//   // Accept everything via commonProps (as in all new widgets)
//   const {
//     data = [],
//     dataKeys = [],
//     theme = "light",
//     title = "Water Logging",
//     showTitle = true,
//     showLastDetectedTime = true,
//     showLocation = true,
//     locationLabel = "Area",
//     showSensorId = true,
//     sensorIdLabel = "Sensor ID",
//     refreshInterval = 10,
//     backgroundColor = theme === "dark" ? "#222" : "#fff",
//     titleColor = theme === "dark" ? "#fff" : "#222",
//     dropShadow = true,
//     borderRadius = 12,
//     ...rest
//   } = props.commonProps || props

//   // Always use array last entry, else fallback to object (for MQTT/stream)
//   const latest = Array.isArray(data) && data.length ? data[data.length - 1] : data || {}

//   // dot-paths: order is [isDetected, lastDetectedTime, location, sensorId]
//   const waterDetectedKey = dataKeys[0] || "water_logging"
//   const lastDetectedTimeKey = dataKeys[1] || "time"
//   const locationKey = dataKeys[2] || "location"
//   const sensorIdKey = dataKeys[3] || "sensor_id"

//   // Dynamic extracted fields (reactive to data & keys)
//   const [fields, setFields] = useState({
//     isDetected: false,
//     lastDetectedTime: null,
//     location: "",
//     sensorId: "",
//   })

//   // Extract on data change (real-time/telemetry)
//   useEffect(() => {
//     setFields({
//       isDetected: !!getByDotPath(latest, waterDetectedKey),
//       lastDetectedTime: getByDotPath(latest, lastDetectedTimeKey) || null,
//       location: getByDotPath(latest, locationKey) || "Basement Level 1",
//       sensorId: getByDotPath(latest, sensorIdKey) || "WL-S001",
//     })
//   }, [
//     latest,
//     waterDetectedKey,
//     lastDetectedTimeKey,
//     locationKey,
//     sensorIdKey,
//   ])

//   // Optional: for mock/demo, simulate random changes if no data
//   useEffect(() => {
//     if (
//       latest && Object.keys(latest).length &&
//       getByDotPath(latest, waterDetectedKey) !== undefined
//     ) return

//     const mock = () => {
//       setFields({
//         isDetected: Math.random() < 0.3,
//         lastDetectedTime: moment().valueOf(),
//         location: rest.location || "Basement Level 1",
//         sensorId: rest.sensorId || "WL-S001",
//       })
//     }
//     mock()
//     const interval = setInterval(mock, (refreshInterval || 10) * 1000)
//     return () => clearInterval(interval)
//     // eslint-disable-next-line
//   }, [
//     latest,
//     waterDetectedKey,
//     lastDetectedTimeKey,
//     locationKey,
//     sensorIdKey,
//     rest.location,
//     rest.sensorId,
//     refreshInterval,
//   ])

//   const { isDetected, lastDetectedTime, location, sensorId } = fields

//   // --- Status Display ---
//   const statusText = isDetected ? "Water Detected" : "No Water Logging"
//   const statusColor = isDetected ? "red" : "green"
//   const statusIcon = isDetected ? <CloudOutlined /> : <CheckCircleOutlined />

//   return (
//     <Card
//       className={`water-logging-widget ${theme === "dark" ? "dark-mode" : ""} ${
//         isDetected ? "water-detected" : ""
//       }`}
//       title={
//         showTitle ? (
//           <Title level={4} className="widget-title" style={{ color: titleColor, margin: 0 }}>
//             {title}
//           </Title>
//         ) : null
//       }
//       style={{
//         backgroundColor,
//         color: titleColor,
//         boxShadow: dropShadow ? "0 4px 16px rgba(0,0,0,0.09)" : "none",
//         borderRadius,
//         minWidth: 260,
//         maxWidth: 380,
//         margin: "auto",
//         padding: 0,
//       }}
//       bodyStyle={{ padding: 16, paddingBottom: 10 }}
//     >
//       {/* Icon and ripple */}
//       <div className="water-icon-container" style={{ textAlign: "center", marginBottom: 18 }}>
//         <CloudOutlined className="water-drop-icon" style={{ fontSize: 44, color: "#1890ff" }} />
//         {isDetected && <div className="water-ripple"></div>}
//       </div>
//       <div className="status-display" style={{ textAlign: "center", marginBottom: 12 }}>
//         <Text className="status-label" style={{ fontWeight: 500 }}>
//           Status:
//         </Text>
//         <Tag icon={statusIcon} color={statusColor} className="status-tag" style={{ fontSize: 16, marginLeft: 8 }}>
//           {statusText}
//         </Tag>
//       </div>
//       <div className="metadata-grid" style={{ display: "grid", gap: 8 }}>
//         {showLastDetectedTime && lastDetectedTime && (
//           <div className="metadata-item">
//             <Text className="metadata-label">
//               <ClockCircleOutlined /> Last Update:
//             </Text>
//             <Text className="metadata-value" style={{ marginLeft: 4 }}>
//               {moment(lastDetectedTime).format("YYYY-MM-DD HH:mm:ss")}
//             </Text>
//           </div>
//         )}
//         {showLocation && (
//           <div className="metadata-item">
//             <Text className="metadata-label">
//               <EnvironmentOutlined /> {locationLabel}:
//             </Text>
//             <Text className="metadata-value" style={{ marginLeft: 4 }}>
//               {location}
//             </Text>
//           </div>
//         )}
//         {showSensorId && (
//           <div className="metadata-item">
//             <Text className="metadata-label">
//               <IdcardOutlined /> {sensorIdLabel}:
//             </Text>
//             <Text className="metadata-value" style={{ marginLeft: 4 }}>
//               {sensorId}
//             </Text>
//           </div>
//         )}
//       </div>
//     </Card>
//   )
// }

// export default WaterLoggingDetectedWidget
