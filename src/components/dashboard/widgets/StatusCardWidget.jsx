import React, { useEffect, useState } from "react"
import { Card, Typography, Badge, Space, theme as antdTheme } from "antd"
import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled } from "@ant-design/icons"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { getByDotPath } from "../../../utils/dotPath"

dayjs.extend(relativeTime)

const { Title, Text } = Typography

const defaultColors = {
  success: "#52c41a",
  error: "#f5222d",
  warning: "#faad14",
  processing: undefined, // uses Badge processing style
}

// Safe string capitalizer
function capitalizeFirst(str) {
  if (!str || typeof str !== "string") return ""
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const StatusCardWidget = ({
  title = "Status Card",
  status = "success", // success, error, warning, processing
  description = "System is running normally",
  lastUpdated = "2 minutes ago",
  customStatusText = "",      // Optional override of status text
  customStatusColor = "",     // Optional override of icon color
  cardBackgroundColor = "",   // Optional background color for card
  customIcon = null,          // Optional custom icon component to override default
  data = [],
  dataKeys = ["status"],      // telemetry keys (dot-paths)
  statusMapping = {},         // mapping telemetry values to status strings
  theme = "light",
}) => {
  const {
    token: {
      colorText,
      colorTextSecondary,
      colorTextTertiary,
      colorBgContainer,
      colorBorder,
      colorPrimary,
    },
  } = antdTheme.useToken()

  const [currentStatus, setCurrentStatus] = useState(status)
  const [currentDescription, setCurrentDescription] = useState(description)
  const [currentLastUpdated, setCurrentLastUpdated] = useState(lastUpdated)
  const [currentCustomStatusText, setCurrentCustomStatusText] = useState(customStatusText)

  useEffect(() => {
    if (!data || data.length === 0 || !dataKeys || dataKeys.length === 0) {
      setCurrentStatus(status)
      setCurrentDescription(description)
      setCurrentLastUpdated(lastUpdated)
      setCurrentCustomStatusText(customStatusText)
      return
    }

    const latest = data[data.length - 1]

    // --- Dot-path status extraction ---
    let latestStatusValue = null
    for (const key of dataKeys) {
      const val = getByDotPath(latest, key)
      if (val !== undefined && val !== null) {
        latestStatusValue = val
        break
      }
    }

    if (latestStatusValue === null) {
      setCurrentStatus(status)
      setCurrentDescription(description)
      setCurrentLastUpdated(lastUpdated)
      setCurrentCustomStatusText(customStatusText)
      return
    }

    // Map telemetry value to display status
    const mappedStatus = statusMapping[latestStatusValue] || latestStatusValue || status
    setCurrentStatus(mappedStatus)

    // --- Dot-path description extraction: try "foo.bar.description" if you have dot-path key
    let foundDescription = null
    for (const key of dataKeys) {
      // swap last part for "description"
      const descPath = key.includes(".")
        ? key.split(".").slice(0, -1).concat("description").join(".")
        : "description"
      foundDescription = getByDotPath(latest, descPath)
      if (foundDescription) break
    }
    setCurrentDescription(foundDescription || latest.description || description)

    // Timestamp parsing
    if (latest.timestamp) {
      const ts = new Date(latest.timestamp)
      if (!isNaN(ts)) setCurrentLastUpdated(dayjs(ts).fromNow())
      else setCurrentLastUpdated(lastUpdated)
    } else {
      setCurrentLastUpdated(dayjs().fromNow())
    }

    setCurrentCustomStatusText(latest.statusText || customStatusText)
  }, [data, dataKeys, status, description, lastUpdated, customStatusText, statusMapping])

  const getDefaultIcon = () => {
    const iconStyle = { fontSize: 28, color: customStatusColor || defaultColors[currentStatus] || colorPrimary }
    switch (currentStatus) {
      case "success":
        return <CheckCircleFilled style={iconStyle} />
      case "error":
        return <CloseCircleFilled style={iconStyle} />
      case "warning":
        return <ExclamationCircleFilled style={iconStyle} />
      case "processing":
        return <Badge status="processing" style={{ fontSize: 28 }} />
      default:
        return <CheckCircleFilled style={iconStyle} />
    }
  }

  return (
    <Card
      bordered
      style={{
        height: "100%",
        backgroundColor: cardBackgroundColor || colorBgContainer,
        transition: "background-color 0.3s ease",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        borderColor: colorBorder,
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Title level={4} style={{ marginBottom: 12, color: colorText }}>
          {title}
        </Title>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {customIcon ? (
            React.cloneElement(customIcon, { style: { fontSize: 28, color: customStatusColor || colorPrimary } })
          ) : (
            getDefaultIcon()
          )}
          <div style={{ flex: 1 }}>
            <Text
              strong
              style={{
                fontSize: 18,
                display: "block",
                marginBottom: 4,
                color: colorText,
                userSelect: "none",
              }}
            >
              {currentCustomStatusText || capitalizeFirst(String(currentStatus))}
            </Text>
            <Text
              style={{
                color: colorTextSecondary,
                fontSize: 14,
                lineHeight: 1.4,
                whiteSpace: "pre-wrap",
              }}
            >
              {currentDescription}
            </Text>
          </div>
        </div>
        <Text
          type="secondary"
          style={{
            textAlign: "right",
            marginTop: 16,
            fontSize: 12,
            color: colorTextTertiary,
            userSelect: "none",
          }}
        >
          Last updated: {currentLastUpdated}
        </Text>
      </Space>
    </Card>
  )
}

export default StatusCardWidget


// import React, { useEffect, useState } from "react"
// import { Card, Typography, Badge, Space, theme as antdTheme } from "antd"
// import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled } from "@ant-design/icons"
// import dayjs from "dayjs"
// import relativeTime from "dayjs/plugin/relativeTime"

// dayjs.extend(relativeTime)

// const { Title, Text } = Typography

// const defaultColors = {
//   success: "#52c41a",
//   error: "#f5222d",
//   warning: "#faad14",
//   processing: undefined, // uses Badge processing style
// }

// const StatusCardWidget = ({
//   title = "Status Card",
//   status = "success", // success, error, warning, processing
//   description = "System is running normally",
//   lastUpdated = "2 minutes ago",
//   customStatusText = "",      // Optional override of status text
//   customStatusColor = "",     // Optional override of icon color
//   cardBackgroundColor = "",   // Optional background color for card
//   customIcon = null,          // Optional custom icon component to override default
//   data = [],
//   dataKeys = ["status"],      // telemetry keys to extract status info from, defaults to "status"
//   statusMapping = {},         // optional mapping telemetry values to status strings: { "ok": "success", "fail": "error" }
//   theme = "light",
// }) => {
//   const {
//     token: {
//       colorText,
//       colorTextSecondary,
//       colorTextTertiary,
//       colorBgContainer,
//       colorBorder,
//       colorPrimary,
//     },
//     algorithm,
//   } = antdTheme.useToken()

//   const [currentStatus, setCurrentStatus] = useState(status)
//   const [currentDescription, setCurrentDescription] = useState(description)
//   const [currentLastUpdated, setCurrentLastUpdated] = useState(lastUpdated)
//   const [currentCustomStatusText, setCurrentCustomStatusText] = useState(customStatusText)

//   useEffect(() => {
//     if (!data || data.length === 0 || !dataKeys || dataKeys.length === 0) {
//       setCurrentStatus(status)
//       setCurrentDescription(description)
//       setCurrentLastUpdated(lastUpdated)
//       setCurrentCustomStatusText(customStatusText)
//       return
//     }

//     const latest = data[data.length - 1]

//     let latestStatusValue = null
//     for (const key of dataKeys) {
//       if (latest && latest[key] !== undefined) {
//         latestStatusValue = latest[key]
//         break
//       }
//     }

//     if (latestStatusValue === null) {
//       setCurrentStatus(status)
//       setCurrentDescription(description)
//       setCurrentLastUpdated(lastUpdated)
//       setCurrentCustomStatusText(customStatusText)
//       return
//     }

//     const mappedStatus = statusMapping[latestStatusValue] || latestStatusValue || status
//     setCurrentStatus(mappedStatus)

//     setCurrentDescription(latest.description || description)

//     if (latest.timestamp) {
//       const ts = new Date(latest.timestamp)
//       if (!isNaN(ts)) setCurrentLastUpdated(dayjs(ts).fromNow())
//       else setCurrentLastUpdated(lastUpdated)
//     } else {
//       setCurrentLastUpdated(dayjs().fromNow())
//     }

//     setCurrentCustomStatusText(latest.statusText || customStatusText)
//   }, [data, dataKeys, status, description, lastUpdated, customStatusText, statusMapping])

//   const getDefaultIcon = () => {
//     const iconStyle = { fontSize: 28, color: customStatusColor || defaultColors[currentStatus] || colorPrimary }
//     switch (currentStatus) {
//       case "success":
//         return <CheckCircleFilled style={iconStyle} />
//       case "error":
//         return <CloseCircleFilled style={iconStyle} />
//       case "warning":
//         return <ExclamationCircleFilled style={iconStyle} />
//       case "processing":
//         return <Badge status="processing" style={{ fontSize: 28 }} />
//       default:
//         return <CheckCircleFilled style={iconStyle} />
//     }
//   }

//   return (
//     <Card
//       bordered
//       style={{
//         height: "100%",
//         backgroundColor: cardBackgroundColor || colorBgContainer,
//         transition: "background-color 0.3s ease",
//         padding: 24,
//         display: "flex",
//         flexDirection: "column",
//         justifyContent: "center",
//         borderColor: colorBorder,
//       }}
//     >
//       <Space direction="vertical" size="middle" style={{ width: "100%" }}>
//         <Title level={4} style={{ marginBottom: 12, color: colorText }}>
//           {title}
//         </Title>
//         <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
//           {customIcon ? (
//             React.cloneElement(customIcon, { style: { fontSize: 28, color: customStatusColor || colorPrimary } })
//           ) : (
//             getDefaultIcon()
//           )}
//           <div style={{ flex: 1 }}>
//             <Text
//               strong
//               style={{
//                 fontSize: 18,
//                 display: "block",
//                 marginBottom: 4,
//                 color: colorText,
//                 userSelect: "none",
//               }}
//             >
//               {currentCustomStatusText || (currentStatus ? currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1) : "")}
//             </Text>
//             <Text
//               style={{
//                 color: colorTextSecondary,
//                 fontSize: 14,
//                 lineHeight: 1.4,
//                 whiteSpace: "pre-wrap",
//               }}
//             >
//               {currentDescription}
//             </Text>
//           </div>
//         </div>
//         <Text
//           type="secondary"
//           style={{
//             textAlign: "right",
//             marginTop: 16,
//             fontSize: 12,
//             color: colorTextTertiary,
//             userSelect: "none",
//           }}
//         >
//           Last updated: {currentLastUpdated}
//         </Text>
//       </Space>
//     </Card>
//   )
// }

// export default StatusCardWidget
