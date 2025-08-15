"use client"

import { useState, useEffect } from "react"
import { Card, Typography, Spin, Descriptions, Tag, Button, Alert } from "antd"
import {
  LockOutlined,
  UnlockOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  KeyOutlined,
} from "@ant-design/icons"
import moment from "moment"
import "../../../styles/widget/door-status-card-widget.css"

const { Text } = Typography

const DoorStatusCardWidget = ({ config = {}, darkMode, data = {} }) => {
  const {
    title = "Door Status",
    refreshInterval = 10,
    showLastUpdateTime = true,
    showFailedAttempts = false,
    showUnauthorizedAccess = true,
    showLastAccess = true,
    doorIdLabel = "Door ID",
    locationLabel = "Location",
    doorId = "RACK-001",
    location = "Cabinet Gate",
  } = config

  const [isLoading, setIsLoading] = useState(false)

  // Log data for debugging
  useEffect(() => {
    console.log("[DoorStatusCardWidget] Received new data:", data)
  }, [data])

  const doorLocked = data.door_locked ?? false
  const doorStatusRaw = data.door_status ?? "unknown"
  const failedAttempts = data.failed_attempts ?? 0
  const lastAccess = data.last_access || {}
  const unauthorizedAccess = data.unauthorized_access ?? false

  const mapStatus = (statusStr, locked) => {
    switch (statusStr.toLowerCase()) {
      case "closed":
      case "locked":
        return 0
      case "open":
      case "unlocked":
        return 1
      case "tampered":
        return 2
      case "permanent_locked":
        return 3
      default:
        return locked ? 0 : 1
    }
  }
  const doorStatus = mapStatus(doorStatusRaw, doorLocked)

  const getStatusText = (status) => {
    switch (status) {
      case 0: return "Locked"
      case 1: return "Open"
      case 2: return "Tampered"
      case 3: return "Permanently Locked"
      default: return "Unknown"
    }
  }
  const getStatusColor = (status) => {
    switch (status) {
      case 0: return "success"
      case 1: return "warning"
      case 2: return "error"
      case 3: return "volcano"
      default: return "default"
    }
  }
  const getStatusIcon = (status) => {
    switch (status) {
      case 0: return <LockOutlined />
      case 1: return <UnlockOutlined />
      case 2: return <WarningOutlined />
      case 3: return <ExclamationCircleOutlined />
      default: return <KeyOutlined />
    }
  }

  const formattedLastAccessTime = lastAccess.timestamp
    ? moment(lastAccess.timestamp).format("YYYY-MM-DD HH:mm:ss")
    : "N/A"

  useEffect(() => {
    if (data) setIsLoading(false)
  }, [data])

  return (
    <Card
      title={
        <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: 0.2 }}>{title}</span>
      }
      className={`door-status-card-widget compact ${darkMode ? "dark-mode" : ""}`}
      extra={
        <Button icon={<ReloadOutlined />} loading={isLoading} size="small" type="text" style={{ marginRight: -6 }} />
      }
      bodyStyle={{ padding: "14px 10px 8px 10px" }}
      headStyle={{ padding: "8px 10px", minHeight: 38 }}
    >
      {isLoading ? (
        <div className="door-status-loading">
          <Spin size="small" tip="Loading..." />
        </div>
      ) : (
        <div className="door-content" style={{ padding: 0 }}>
          {/* Door Animation */}
          <div className="door-animation-container" style={{ marginBottom: 10 }}>
            <div className="door-frame">
              <div className={`door-panel ${doorStatus === 1 ? "open" : ""} ${doorStatus === 0 ? "closed" : ""}`}>
                <div className="door-handle"></div>
              </div>
            </div>
          </div>

          {/* Status Tag */}
          <div className="status-display" style={{ marginBottom: 7 }}>
            <Tag icon={getStatusIcon(doorStatus)} color={getStatusColor(doorStatus)} className="status-tag" style={{
              fontSize: 13, padding: "2px 10px", borderRadius: 6, fontWeight: 600
            }}>
              {getStatusText(doorStatus)}
            </Tag>
          </div>

          {/* Compact Descriptions */}
          <Descriptions
            column={1}
            size="small"
            bordered={false}
            className={darkMode ? "dark-mode-descriptions" : ""}
            style={{ marginBottom: 0 }}
            labelStyle={{ fontSize: 12, fontWeight: 500, color: darkMode ? "#bbb" : "#666", padding: "2px 0" }}
            contentStyle={{ fontSize: 13, fontWeight: 600, padding: "2px 0" }}
          >
            <Descriptions.Item label={doorIdLabel}>
              <Text strong style={{ fontSize: 13 }}>{doorId}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={locationLabel}>
              <Text strong style={{ fontSize: 13 }}>{location}</Text>
            </Descriptions.Item>
            {showFailedAttempts && (
              <Descriptions.Item label="Failed Attempts">
                <Text strong style={{ fontSize: 13 }}>{failedAttempts}</Text>
              </Descriptions.Item>
            )}
            {showUnauthorizedAccess && unauthorizedAccess && (
              <Descriptions.Item label="Unauthorized Access">
                <Alert
                  message="Unauthorized Access!"
                  type="error"
                  showIcon
                  style={{ margin: 0, padding: "2px 4px" }}
                />
              </Descriptions.Item>
            )}
            {showLastAccess && lastAccess.timestamp && (
              <>
                <Descriptions.Item label="Last Access Time">
                  <Text style={{ fontSize: 12 }}>{formattedLastAccessTime}</Text>
                </Descriptions.Item>
                {/* <Descriptions.Item label="Last Access Method">
                  <Text style={{ fontSize: 12 }}>{lastAccess.method || "N/A"}</Text>
                </Descriptions.Item> */}
                <Descriptions.Item label="Last Access Result">
                  <Text style={{ fontSize: 12 }}>{lastAccess.result || "N/A"}</Text>
                </Descriptions.Item>
                {/* <Descriptions.Item label="Last Access User">
                  <Text style={{ fontSize: 12 }}>{lastAccess.user || "N/A"}</Text>
                </Descriptions.Item> */}
              </>
            )}
            {showLastUpdateTime && (
              <Descriptions.Item label="Last Update">
                <Text style={{ fontSize: 12 }}>{moment().format("YYYY-MM-DD HH:mm:ss")}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>
      )}
    </Card>
  )
}

export default DoorStatusCardWidget

// "use client"

// import { useState, useEffect } from "react"
// import { Card, Typography, Spin, Descriptions, Tag, Button, Alert } from "antd"
// import {
//   LockOutlined,
//   UnlockOutlined,
//   WarningOutlined,
//   ExclamationCircleOutlined,
//   ReloadOutlined,
//   KeyOutlined,
// } from "@ant-design/icons"
// import moment from "moment"
// import "../../../styles/door-status-card-widget.css"

// const { Text } = Typography

// /**
//  * Generic Door Status Card Widget supporting flexible door data shape.
//  * Props:
//  * - config: widget configuration with title, refreshInterval, etc.
//  * - darkMode: boolean for dark theme
//  * - data: live door data object containing fields like door_locked, door_status, failed_attempts, last_access, unauthorized_access
//  */
// const DoorStatusCardWidget = ({ config = {}, darkMode, data = {} }) => {
//   const {
//     title = "Door Status",
//     refreshInterval = 10,
//     showLastUpdateTime = true,
//     showFailedAttempts = true,
//     showUnauthorizedAccess = true,
//     showLastAccess = true,
//     doorIdLabel = "Door ID",
//     locationLabel = "Location",
//     doorId = "RACK-001", // Could be passed in config or data
//     location = "Main Gate", // Could be passed in config or data
//   } = config

//   const [isLoading, setIsLoading] = useState(false)
//   const [lastUpdateTime, setLastUpdateTime] = useState(null)

//   // Log data for debugging
//   useEffect(() => {
//     console.log("[DoorStatusCardWidget] Received new data:", data)
//   }, [data])

//   // Extract relevant fields from data (handle flexible shape)
//   const doorLocked = data.door_locked ?? false
//   const doorStatusRaw = data.door_status ?? "unknown"
//   const failedAttempts = data.failed_attempts ?? 0
//   const lastAccess = data.last_access || {}
//   const unauthorizedAccess = data.unauthorized_access ?? false

//   // Map raw door_status strings to numeric status codes and friendly text
//   // Status codes: 0 = Locked, 1 = Open, 2 = Tampered, 3 = Permanently Locked, 4 = Unknown
//   const mapStatus = (statusStr, locked) => {
//     switch (statusStr.toLowerCase()) {
//       case "closed":
//       case "locked":
//         return 0
//       case "open":
//       case "unlocked":
//         return 1
//       case "tampered":
//         return 2
//       case "permanent_locked":
//         return 3
//       default:
//         // fallback based on door_locked boolean
//         return locked ? 0 : 1
//     }
//   }

//   const doorStatus = mapStatus(doorStatusRaw, doorLocked)

//   // Status text & icon mapping
//   const getStatusText = (status) => {
//     switch (status) {
//       case 0:
//         return "Locked"
//       case 1:
//         return "Open"
//       case 2:
//         return "Tampered"
//       case 3:
//         return "Permanently Locked"
//       default:
//         return "Unknown"
//     }
//   }

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 0:
//         return "success" // Green
//       case 1:
//         return "warning" // Orange
//       case 2:
//         return "error" // Red
//       case 3:
//         return "volcano" // Darker red/orange
//       default:
//         return "default"
//     }
//   }

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case 0:
//         return <LockOutlined />
//       case 1:
//         return <UnlockOutlined />
//       case 2:
//         return <WarningOutlined />
//       case 3:
//         return <ExclamationCircleOutlined />
//       default:
//         return <KeyOutlined />
//     }
//   }

//   // Format last access time if available
//   const formattedLastAccessTime = lastAccess.timestamp
//     ? moment(lastAccess.timestamp).format("YYYY-MM-DD HH:mm:ss")
//     : "N/A"

//   // Set loading false when data changes (for simulation)
//   useEffect(() => {
//     if (data) setIsLoading(false)
//   }, [data])

//   return (
//     <Card
//       title={title}
//       className={`door-status-card-widget ${darkMode ? "dark-mode" : ""}`}
//       extra={<Button icon={<ReloadOutlined />} loading={isLoading} />}
//     >
//       {isLoading ? (
//         <div className="door-status-loading">
//           <Spin size="large" tip="Loading status..." />
//         </div>
//       ) : (
//         <div className="door-content">
//           <div className="door-animation-container">
//             <div className="door-frame">
//               <div className={`door-panel ${doorStatus === 1 ? "open" : ""} ${doorStatus === 0 ? "closed" : ""}`}>
//                 <div className="door-handle"></div>
//               </div>
//             </div>
//           </div>

//           <div className="status-display">
//             <Tag icon={getStatusIcon(doorStatus)} color={getStatusColor(doorStatus)} className="status-tag">
//               {getStatusText(doorStatus)}
//             </Tag>
//           </div>

//           <Descriptions
//             column={1}
//             size="small"
//             bordered={false}
//             className={darkMode ? "dark-mode-descriptions" : ""}
//           >
//             <Descriptions.Item label={doorIdLabel}>
//               <Text strong>{doorId}</Text>
//             </Descriptions.Item>
//             <Descriptions.Item label={locationLabel}>
//               <Text strong>{location}</Text>
//             </Descriptions.Item>

//             {showFailedAttempts && (
//               <Descriptions.Item label="Failed Attempts">
//                 <Text strong>{failedAttempts}</Text>
//               </Descriptions.Item>
//             )}

//             {showUnauthorizedAccess && unauthorizedAccess && (
//               <Descriptions.Item label="Unauthorized Access">
//                 <Alert
//                   message="Unauthorized Access Detected!"
//                   type="error"
//                   showIcon
//                   style={{ margin: 0, padding: 0 }}
//                 />
//               </Descriptions.Item>
//             )}

//             {showLastAccess && lastAccess.timestamp && (
//               <>
//                 <Descriptions.Item label="Last Access Time">
//                   {formattedLastAccessTime}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Last Access Method">
//                   <Text>{lastAccess.method || "N/A"}</Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Last Access Result">
//                   <Text>{lastAccess.result || "N/A"}</Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Last Access User">
//                   <Text>{lastAccess.user || "N/A"}</Text>
//                 </Descriptions.Item>
//               </>
//             )}

//             {showLastUpdateTime && (
//               <Descriptions.Item label="Last Update">
//                 <Text>{moment().format("YYYY-MM-DD HH:mm:ss")}</Text> {/* Could be real last update */}
//               </Descriptions.Item>
//             )}
//           </Descriptions>
//         </div>
//       )}
//     </Card>
//   )
// }

// export default DoorStatusCardWidget

// // "use client"

// // import { useState, useEffect } from "react"
// // import { Card, Typography, Spin, Descriptions, Tag, Button } from "antd"
// // import {
// //   LockOutlined,
// //   UnlockOutlined,
// //   WarningOutlined,
// //   ExclamationCircleOutlined,
// //   ReloadOutlined,
// // } from "@ant-design/icons"
// // import moment from "moment"
// // import "../../../styles/door-status-card-widget.css"

// // const { Text } = Typography

// // const DoorStatusCardWidget = ({ config = {}, darkMode, data }) => {
// //   const {
// //     title = "Door Status",
// //     statusMapping = {},
// //     showLastUpdateTime = true,
// //     showDoorId = true,
// //     doorIdLabel = "Door ID",
// //     showLocation = true,
// //     locationLabel = "Location",
// //     refreshInterval = 10, // not used internally, assumed external live update
// //   } = config

// //   const [doorStatus, setDoorStatus] = useState(null)
// //   const [lastUpdateTime, setLastUpdateTime] = useState(null)
// //   const [isLoading, setIsLoading] = useState(true)
// //   const [isAnimating, setIsAnimating] = useState(false)
// //   const [prevStatus, setPrevStatus] = useState(null)

// //   // Map live data prop to internal doorStatus and lastUpdateTime
// //   useEffect(() => {
// //     console.log("[DoorStatusCardWidget] Received new data:", data)

// //     if (!data) {
// //       setIsLoading(true)
// //       return
// //     }

// //     // Map door_locked boolean to status code
// //     // 0 = Locked, 1 = Open
// //     const locked = data.door_locked
// //     const newStatus = locked ? 0 : 1

// //     setIsLoading(false)

// //     // Animate only if status changed
// //     setPrevStatus((prev) => {
// //       if ((prev === 0 && newStatus === 1) || (prev === 1 && newStatus === 0)) {
// //         setIsAnimating(true)
// //         setTimeout(() => setIsAnimating(false), 1000)
// //       }
// //       return newStatus
// //     })
// //     setDoorStatus(newStatus)

// //     // Parse timestamp if available
// //     if (data.last_access?.timestamp) {
// //       setLastUpdateTime(moment(data.last_access.timestamp))
// //     } else {
// //       setLastUpdateTime(moment())
// //     }
// //   }, [data])

// //   const getStatusText = (status) => {
// //     return (
// //       statusMapping[status] ||
// //       (status === 0
// //         ? "Locked"
// //         : status === 1
// //         ? "Open"
// //         : status === 2
// //         ? "Tampered"
// //         : status === 3
// //         ? "Permanently Locked"
// //         : "Unknown")
// //     )
// //   }

// //   const getStatusColor = (status) => {
// //     switch (status) {
// //       case 0:
// //         return "success"
// //       case 1:
// //         return "warning"
// //       case 2:
// //         return "error"
// //       case 3:
// //         return "volcano"
// //       default:
// //         return "default"
// //     }
// //   }

// //   const getStatusIcon = (status) => {
// //     switch (status) {
// //       case 0:
// //         return <LockOutlined />
// //       case 1:
// //         return <UnlockOutlined />
// //       case 2:
// //         return <WarningOutlined />
// //       case 3:
// //         return <ExclamationCircleOutlined />
// //       default:
// //         return null
// //     }
// //   }

// //   const currentStatusText = getStatusText(doorStatus)
// //   const isDoorOpen = doorStatus === 1
// //   const isDoorLocked = doorStatus === 0

// //   return (
// //     <Card
// //       title={title}
// //       className={`door-status-card-widget ${darkMode ? "dark-mode" : ""}`}
// //       extra={<Button icon={<ReloadOutlined />} loading={isLoading} disabled />}
// //     >
// //       {isLoading ? (
// //         <div className="door-status-loading">
// //           <Spin size="large" tip="Loading status..." />
// //         </div>
// //       ) : (
// //         <div className="door-content">
// //           <div className="door-animation-container">
// //             <div className={`door-frame ${isAnimating ? "animating" : ""}`}>
// //               <div className={`door-panel ${isDoorOpen ? "open" : ""} ${isDoorLocked ? "closed" : ""}`}>
// //                 <div className="door-handle"></div>
// //               </div>
// //             </div>
// //           </div>

// //           <div className="status-display">
// //             <Tag icon={getStatusIcon(doorStatus)} color={getStatusColor(doorStatus)} className="status-tag">
// //               {currentStatusText}
// //             </Tag>
// //           </div>

// //           <Descriptions column={1} size="small" bordered={false} className={darkMode ? "dark-mode-descriptions" : ""}>
// //             {showDoorId && (
// //               <Descriptions.Item label={doorIdLabel}>
// //                 <Text strong>DOOR-001</Text> {/* Mock or static placeholder */}
// //               </Descriptions.Item>
// //             )}
// //             {showLocation && (
// //               <Descriptions.Item label={locationLabel}>
// //                 <Text strong>Main Entrance</Text> {/* Mock or static placeholder */}
// //               </Descriptions.Item>
// //             )}
// //             {showLastUpdateTime && (
// //               <Descriptions.Item label="Last Update">
// //                 {lastUpdateTime ? lastUpdateTime.format("YYYY-MM-DD HH:mm:ss") : "N/A"}
// //               </Descriptions.Item>
// //             )}
// //           </Descriptions>
// //         </div>
// //       )}
// //     </Card>
// //   )
// // }

// // export default DoorStatusCardWidget
