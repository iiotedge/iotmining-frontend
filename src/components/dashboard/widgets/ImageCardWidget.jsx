"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Card, Button, Segmented, Descriptions, Typography, DatePicker, TimePicker, Image, Tag, Tooltip
} from "antd"
import moment from "moment"
import {
  LeftOutlined,
  RightOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  InfoCircleOutlined,
} from "@ant-design/icons"
import { useTheme } from "../../theme/ThemeProvider"
import { getDeviceObjectHistory } from "../../../api/objectApi"
import "../../../styles/widget/image-card-widget.css"

const { Text } = Typography
const MAX_HISTORY = 6

const formatTime = ts => ts ? moment(ts).format("YYYY-MM-DD HH:mm:ss") : "--"

const statusColor = (status, tokens) =>
  status === "success"
    ? tokens.ok || "success"
    : status === "fail"
      ? tokens.err || "error"
      : tokens.gray || "default"

const statusIcon = status =>
  status === "success"
    ? <CheckCircleFilled style={{ color: "#52c41a" }} />
    : status === "fail"
      ? <CloseCircleFilled style={{ color: "#f5222d" }} />
      : null

function getTenantId() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("tenantId") || ""
  }
  return ""
}

const ImageCardWidget = ({
  config = {},
  liveData,
  tenantId: propTenantId,
  deviceId: propDeviceId,
}) => {
  const {
    title,
    defaultViewMode,
    showDateSelection,
    showTimeSelection,
    showEventType,
    showCustomMetadata1,
    customMetadata1Label,
    showCustomMetadata2,
    customMetadata2Label,
    category = "CAMERA",
    objectType = "snapshot",
  } = config

  const { isDarkMode, tokens } = useTheme()
  const tenantId = propTenantId || getTenantId()
  const deviceId =
    propDeviceId ||
    config?.deviceId ||
    config?.dataSource?.deviceId

  const [snapshots, setSnapshots] = useState([])
  const [currentSnapshotIndex, setCurrentSnapshotIndex] = useState(0)
  const [selectedDate, setSelectedDate] = useState(moment())
  const [selectedTime, setSelectedTime] = useState(moment())
  const [viewMode, setViewMode] = useState(defaultViewMode || "live")
  const [preview, setPreview] = useState({ visible: false, index: 0 })
  const prevKeyRef = useRef("")

  // Live View: keep latest from MQTT/liveData
  useEffect(() => {
    if (!liveData) return
    if (!liveData.url || liveData.door_event_snapshot === "fail") return

    const key = (liveData.url || "") + "::" + (liveData.timestamp || "")
    if (key !== prevKeyRef.current) {
      prevKeyRef.current = key
      const newSnap = {
        id:
          (liveData.snap_id || liveData.filename || liveData.url || key) +
          "::" +
          (liveData.timestamp || Date.now()),
        url: liveData.url,
        timestamp: liveData.timestamp,
        filename: liveData.filename,
        snap_id: liveData.snap_id,
        snapshots_stored: liveData.snapshots_stored,
        eventType: liveData.eventType,
        customMetadata1: liveData.customMetadata1,
        customMetadata2: liveData.customMetadata2,
        door_event_snapshot: liveData.door_event_snapshot,
      }
      setSnapshots(prev => {
        const filtered = prev.filter(
          s => s.url !== newSnap.url || s.timestamp !== newSnap.timestamp
        )
        return [newSnap, ...filtered].slice(0, MAX_HISTORY)
      })
      setCurrentSnapshotIndex(0)
    }
  }, [liveData])

  // Multi View: always fetch history on every switch to "history" view.
  useEffect(() => {
    if (
      viewMode === "history" &&
      tenantId &&
      deviceId
    ) {
      getDeviceObjectHistory({
        tenantId,
        deviceId,
        category,
        objectType,
        page: 0,
        size: MAX_HISTORY,
      }).then(data => {
        const apiData = Array.isArray(data.data) ? data.data : []
        if (apiData.length > 0) {
          const mapped = apiData.map((item, idx) => ({
            id: item.object?.id || item.object?.objectUrl || item.object?.filename || idx,
            url: item.presignedUrl,
            timestamp: item.object?.uploadedAt,
            filename: item.object?.filename,
            door_event_snapshot: "success",
            ...(item.object || {}),
          }))
          .filter(s => !!s.url)
          .slice(0, MAX_HISTORY)

          setSnapshots(mapped)
          setCurrentSnapshotIndex(0)
        } else {
          setSnapshots([])
        }
      }).catch(() => {
        setSnapshots([])
      })
    }
    // eslint-disable-next-line
  }, [viewMode, tenantId, deviceId, category, objectType])

  // Navigation
  const handlePrev = () => setCurrentSnapshotIndex(i => (i === 0 ? snapshots.length - 1 : i - 1))
  const handleNext = () => setCurrentSnapshotIndex(i => (i === snapshots.length - 1 ? 0 : i + 1))
  const currentSnapshot = snapshots[currentSnapshotIndex] || {}

  // Preview modal
  const openPreviewAt = idx => setPreview({ visible: true, index: idx })
  const closePreview = () => setPreview({ visible: false, index: 0 })

  const showNoCurrentSnapshot =
    (viewMode === "live") &&
    (!currentSnapshot.url || currentSnapshot.door_event_snapshot === "fail")

  // --- Live preview list logic ---
  const singlePreviewImages = currentSnapshot.url ? [currentSnapshot.url] : []

  return (
    <Card
      title={title}
      className="image-card-widget"
      bodyStyle={{
        height: "calc(100% - 56px)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        background: tokens.colorBgContainer,
        padding: "10px 8px 6px 8px",
      }}
      style={{
        background: tokens.colorBgContainer,
        borderColor: tokens.colorBorder,
        boxShadow: tokens.boxShadow,
        borderRadius: 12,
        minHeight: 250,
      }}
    >
      <div
        className="image-card-controls"
        style={{
          marginBottom: 8,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {showDateSelection && (
          <DatePicker size="small" value={selectedDate} onChange={setSelectedDate} format="YYYY-MM-DD" />
        )}
        {showTimeSelection && (
          <TimePicker size="small" value={selectedTime} onChange={setSelectedTime} format="HH:mm" />
        )}
        <Segmented
          size="small"
          options={["Live", "History"]}
          value={viewMode === "live" ? "Live" : "History"}
          onChange={val => setViewMode(val.toLowerCase())}
        />
      </div>

      {/* Use separate preview group for live and history view */}
      {viewMode === "history" ? (
        <Image.PreviewGroup
          preview={{
            visible: preview.visible,
            current: preview.index,
            onVisibleChange: vis => !vis && closePreview(),
            mask: <span style={{ color: "#fff", fontWeight: 600 }}>Click to Preview</span>,
            transitionName: "ant-fade",
          }}
        >
          <div className="image-card-multiple-view" style={{ flexGrow: 1, width: "100%" }}>
            <div
              className="image-card-multi-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 8,
                width: "100%",
                height: "100%",
                alignItems: "stretch"
              }}
            >
              {snapshots.length === 0 ? (
                <div style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  color: tokens.disabledText,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 90,
                  fontSize: 15
                }}>
                  <InfoCircleOutlined style={{ fontSize: 19, marginRight: 7 }} />
                  No snapshot history available.
                </div>
              ) : (
                snapshots.map((snapshot, index) => (
                  <div
                    key={snapshot.id || index}
                    style={{
                      width: "100%",
                      aspectRatio: "4 / 3",
                      position: "relative",
                      overflow: "hidden",
                      borderRadius: 10,
                      boxShadow: tokens.boxShadow,
                      background: tokens.colorBgElevated,
                      cursor: "pointer",
                      transition: "box-shadow .15s,transform .15s",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    onClick={() => openPreviewAt(index)}
                    tabIndex={0}
                    className="image-card-thumb-outer"
                  >
                    <Image
                      src={snapshot.url}
                      alt={`Snapshot ${index + 1}`}
                      preview={false}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 10,
                        transition: "transform 0.22s cubic-bezier(.33,1.02,.55,.99)",
                        background: tokens.colorBgElevated,
                        display: "block"
                      }}
                    />
                    {/* Overlay */}
                    <div
                      className="image-card-thumbnail-overlay"
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        width: "100%",
                        background: isDarkMode
                          ? "rgba(16,16,16,0.72)"
                          : "rgba(255,255,255,0.83)",
                        color: isDarkMode ? "#fff" : "#222",
                        padding: "3px 9px 3px 8px",
                        fontSize: 12.5,
                        fontWeight: 500,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottomLeftRadius: 10,
                        borderBottomRightRadius: 10,
                        minHeight: 22,
                        zIndex: 2,
                        boxSizing: "border-box"
                      }}
                    >
                      <Tooltip title={formatTime(snapshot.timestamp)}>
                        {snapshot.timestamp ? moment(snapshot.timestamp).format("HH:mm") : "--"}
                      </Tooltip>
                      <Tag
                        color={statusColor(snapshot.door_event_snapshot, tokens)}
                        icon={statusIcon(snapshot.door_event_snapshot)}
                        style={{
                          fontWeight: 600,
                          borderRadius: 5,
                          fontSize: 12,
                          marginRight: 0,
                          padding: "1px 7px",
                          minWidth: 60,
                          textAlign: "center"
                        }}
                      >
                        {snapshot.door_event_snapshot?.toUpperCase() || "?"}
                      </Tag>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Image.PreviewGroup>
      ) : (
        // Live view: show only current image in the preview modal
        <Image.PreviewGroup
          preview={{
            visible: preview.visible,
            current: preview.index,
            onVisibleChange: vis => !vis && closePreview(),
            mask: <span style={{ color: "#fff", fontWeight: 600 }}>Click to Preview</span>,
            transitionName: "ant-fade",
          }}
        >
          {showNoCurrentSnapshot ? (
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: tokens.disabledText,
              minHeight: 120,
              textAlign: "center"
            }}>
              <InfoCircleOutlined style={{ fontSize: 28, marginBottom: 8, color: tokens.disabledText }} />
              <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 2 }}>
                No current snapshot. Door is closed or no event detected.
              </div>
              <div style={{ fontSize: 13, color: tokens.gray }}>
                Latest {MAX_HISTORY} snapshots remain in history.
              </div>
            </div>
          ) : (
            currentSnapshot && (
              <div className="image-card-single-view"
                style={{
                  flexGrow: 1,
                  width: "100%",
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <div className="image-card-image-wrapper"
                  style={{
                    width: "100%",
                    height: "auto",
                    maxWidth: "100%",
                    aspectRatio: "4 / 3",
                    margin: "0 auto 10px auto",
                    boxShadow: tokens.boxShadow,
                    background: tokens.colorBgElevated,
                    borderRadius: 12,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Image
                    src={currentSnapshot.url || "/placeholder.svg"}
                    alt={currentSnapshot.filename || "Snapshot"}
                    className="image-card-main-image"
                    preview={{
                      visible: false, // disables default single image preview modal
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      borderRadius: 12,
                      border: `1.5px solid ${tokens.colorBorder}`,
                      background: tokens.colorBgElevated,
                      cursor: currentSnapshot.url ? "pointer" : "default",
                      transition: "box-shadow 0.22s cubic-bezier(.33,1.02,.55,.99), transform 0.18s cubic-bezier(.33,1.02,.55,.99)"
                    }}
                    onClick={() => {
                      if (currentSnapshot.url) setPreview({ visible: true, index: 0 })
                    }}
                  />
                  {currentSnapshot.url && preview.visible && (
                    <Image
                      // This image is only for preview modal, will be opened if preview.visible is true
                      style={{ display: "none" }}
                      src={currentSnapshot.url}
                      alt={currentSnapshot.filename || "Snapshot"}
                    />
                  )}
                  {snapshots.length > 1 && (
                    <div className="image-card-navigation" style={{
                      position: "absolute",
                      top: "50%",
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      zIndex: 3
                    }}>
                      <Button icon={<LeftOutlined />} onClick={handlePrev} shape="circle" size="small" />
                      <Button icon={<RightOutlined />} onClick={handleNext} shape="circle" size="small" />
                    </div>
                  )}
                  {currentSnapshot.door_event_snapshot && (
                    <Tag
                      color={statusColor(currentSnapshot.door_event_snapshot, tokens)}
                      icon={statusIcon(currentSnapshot.door_event_snapshot)}
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 18,
                        zIndex: 3,
                        fontWeight: 600,
                        borderRadius: 6,
                        fontSize: 13,
                        padding: "2.5px 10px"
                      }}
                    >
                      {currentSnapshot.door_event_snapshot?.toUpperCase()}
                    </Tag>
                  )}
                </div>
                {/* Metadata */}
                <Descriptions
                  column={{ xs: 1, sm: 2, md: 2, lg: 3 }}
                  size="small"
                  className="image-card-metadata"
                  style={{
                    marginTop: 7,
                    width: "100%",
                    maxWidth: 540,
                    padding: "7px 10px",
                    background: tokens.colorBgElevated,
                    borderRadius: 8,
                    color: tokens.colorText,
                    fontSize: "0.97em"
                  }}
                  labelStyle={{
                    color: tokens.colorTextSecondary,
                    fontWeight: 500
                  }}
                  contentStyle={{
                    color: tokens.colorText
                  }}
                >
                  <Descriptions.Item label="Date">{currentSnapshot.timestamp ? moment(currentSnapshot.timestamp).format("YYYY-MM-DD") : "--"}</Descriptions.Item>
                  <Descriptions.Item label="Time">{currentSnapshot.timestamp ? moment(currentSnapshot.timestamp).format("HH:mm:ss") : "--"}</Descriptions.Item>
                  {showEventType && currentSnapshot.eventType && (
                    <Descriptions.Item label="Event Type"><Text strong>{currentSnapshot.eventType}</Text></Descriptions.Item>
                  )}
                  {showCustomMetadata1 && customMetadata1Label && currentSnapshot.customMetadata1 && (
                    <Descriptions.Item label={customMetadata1Label}>{currentSnapshot.customMetadata1}</Descriptions.Item>
                  )}
                  {showCustomMetadata2 && customMetadata2Label && currentSnapshot.customMetadata2 && (
                    <Descriptions.Item label={customMetadata2Label}>{currentSnapshot.customMetadata2}</Descriptions.Item>
                  )}
                </Descriptions>
              </div>
            )
          )}
        </Image.PreviewGroup>
      )}
    </Card>
  )
}

export default ImageCardWidget

// "use client"

// import React, { useState, useEffect, useRef } from "react"
// import {
//   Card, Button, Segmented, Descriptions, Typography, DatePicker, TimePicker, Image, Tag, Tooltip
// } from "antd"
// import moment from "moment"
// import {
//   LeftOutlined,
//   RightOutlined,
//   CheckCircleFilled,
//   CloseCircleFilled,
//   InfoCircleOutlined,
// } from "@ant-design/icons"
// import { useTheme } from "../../theme/ThemeProvider"
// import { getDeviceObjectHistory } from "../../../api/objectApi"
// import "../../../styles/image-card-widget.css"

// const { Text } = Typography
// const MAX_HISTORY = 6

// const formatTime = ts => ts ? moment(ts).format("YYYY-MM-DD HH:mm:ss") : "--"

// const statusColor = (status, tokens) =>
//   status === "success"
//     ? tokens.ok || "success"
//     : status === "fail"
//       ? tokens.err || "error"
//       : tokens.gray || "default"

// const statusIcon = status =>
//   status === "success"
//     ? <CheckCircleFilled style={{ color: "#52c41a" }} />
//     : status === "fail"
//       ? <CloseCircleFilled style={{ color: "#f5222d" }} />
//       : null

// function getTenantId() {
//   if (typeof window !== "undefined") {
//     return localStorage.getItem("tenantId") || ""
//   }
//   return ""
// }

// const ImageCardWidget = ({
//   config = {},
//   liveData,
//   tenantId: propTenantId,
//   deviceId: propDeviceId,
// }) => {
//   const {
//     title,
//     defaultViewMode,
//     showDateSelection,
//     showTimeSelection,
//     showEventType,
//     showCustomMetadata1,
//     customMetadata1Label,
//     showCustomMetadata2,
//     customMetadata2Label,
//     category = "CAMERA",
//     objectType = "snapshot",
//   } = config

//   const { isDarkMode, tokens } = useTheme()
//   const tenantId = propTenantId || getTenantId()
//   // Try all the ways user could pass deviceId:
//   const deviceId =
//     propDeviceId ||
//     config?.deviceId ||
//     config?.dataSource?.deviceId

//   const [snapshots, setSnapshots] = useState([])
//   const [currentSnapshotIndex, setCurrentSnapshotIndex] = useState(0)
//   const [selectedDate, setSelectedDate] = useState(moment())
//   const [selectedTime, setSelectedTime] = useState(moment())
//   const [viewMode, setViewMode] = useState(defaultViewMode || "single")
//   const [preview, setPreview] = useState({ visible: false, index: 0 })
//   const prevKeyRef = useRef("")

//   // Single View: keep latest from MQTT/liveData, do not clear history on door close.
//   useEffect(() => {
//     if (!liveData) return
//     if (!liveData.url || liveData.door_event_snapshot === "fail") return

//     const key = (liveData.url || "") + "::" + (liveData.timestamp || "")
//     if (key !== prevKeyRef.current) {
//       prevKeyRef.current = key
//       const newSnap = {
//         id:
//           (liveData.snap_id || liveData.filename || liveData.url || key) +
//           "::" +
//           (liveData.timestamp || Date.now()),
//         url: liveData.url,
//         timestamp: liveData.timestamp,
//         filename: liveData.filename,
//         snap_id: liveData.snap_id,
//         snapshots_stored: liveData.snapshots_stored,
//         eventType: liveData.eventType,
//         customMetadata1: liveData.customMetadata1,
//         customMetadata2: liveData.customMetadata2,
//         door_event_snapshot: liveData.door_event_snapshot,
//       }
//       setSnapshots(prev => {
//         const filtered = prev.filter(
//           s => s.url !== newSnap.url || s.timestamp !== newSnap.timestamp
//         )
//         return [newSnap, ...filtered].slice(0, MAX_HISTORY)
//       })
//       setCurrentSnapshotIndex(0)
//     }
//   }, [liveData])

//   // console.log(tenantId, deviceId)
//   // Multi View: always fetch history on every switch to "multiple" view.
//   // useEffect(() => {
//   //   let isActive = true
//   //   async function loadHistory() {
//   //     if (
//   //       viewMode === "multiple" &&
//   //       tenantId &&
//   //       deviceId
//   //     ) {
//   //       const res = await getDeviceObjectHistory({
//   //         tenantId,
//   //         deviceId,
//   //         category,
//   //         objectType,
//   //         page: 0,
//   //         size: MAX_HISTORY,
//   //       })
//   //       if (!isActive) return
//   //       if (Array.isArray(res.content) && res.content.length > 0) {
//   //         // Map backend object to {url, timestamp, ...}
//   //         const mapped = res.content
//   //           .map(row => ({
//   //             id:
//   //               row.snap_id ||
//   //               row.id ||
//   //               row.objectUrl ||
//   //               row.filename,
//   //             url: row.objectUrl || row.url, // backend should return full url
//   //             timestamp: row.uploadedAt || row.timestamp,
//   //             filename: row.filename,
//   //             door_event_snapshot: row.door_event_snapshot || "success",
//   //             ...row,
//   //           }))
//   //           .filter(s => !!s.url)
//   //           .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
//   //           .slice(0, MAX_HISTORY)
//   //         setSnapshots(mapped)
//   //         setCurrentSnapshotIndex(0)
//   //       } else {
//   //         setSnapshots([])
//   //       }
//   //     }
//   //   }
//   //   loadHistory()
//   //   return () => { isActive = false }
//   //   // eslint-disable-next-line
//   // }, [viewMode, tenantId, deviceId, category, objectType])
//     useEffect(() => {
//       if (
//         viewMode === "multiple" &&
//         tenantId &&
//         deviceId
//       ) {

//         getDeviceObjectHistory({
//           tenantId,
//           deviceId,
//           category,
//           objectType,
//           page: 0,
//           size: MAX_HISTORY,
//         }).then(data => {

//           // data.data is always the array!
//           const apiData = Array.isArray(data.data) ? data.data : [];
//           if (apiData.length > 0) {
//             const mapped = apiData.map((item, idx) => ({
//               id: item.object?.id || item.object?.objectUrl || item.object?.filename || idx,
//               url: item.presignedUrl,
//               timestamp: item.object?.uploadedAt,
//               filename: item.object?.filename,
//               door_event_snapshot: "success",
//               ...(item.object || {}),
//             }))
//             .filter(s => !!s.url)
//             .slice(0, MAX_HISTORY);

//             setSnapshots(mapped)
//             setCurrentSnapshotIndex(0)
//           } else {

//             setSnapshots([])
//           }
//         }).catch(e => {

//           setSnapshots([])
//         })
//       }
//       // eslint-disable-next-line
//     }, [viewMode, tenantId, deviceId, category, objectType])



//   // Navigation
//   const handlePrev = () => setCurrentSnapshotIndex(i => (i === 0 ? snapshots.length - 1 : i - 1))
//   const handleNext = () => setCurrentSnapshotIndex(i => (i === snapshots.length - 1 ? 0 : i + 1))
//   const currentSnapshot = snapshots[currentSnapshotIndex] || {}

//   // Preview modal
//   const openPreviewAt = idx => setPreview({ visible: true, index: idx })
//   const closePreview = () => setPreview({ visible: false, index: 0 })

//   const showNoCurrentSnapshot =
//     (viewMode === "single") &&
//     (!currentSnapshot.url || currentSnapshot.door_event_snapshot === "fail")

//   return (
//     <Card
//       title={title}
//       className="image-card-widget"
//       bodyStyle={{
//         height: "calc(100% - 56px)",
//         overflowY: "auto",
//         display: "flex",
//         flexDirection: "column",
//         background: tokens.colorBgContainer,
//         padding: "10px 8px 6px 8px",
//       }}
//       style={{
//         background: tokens.colorBgContainer,
//         borderColor: tokens.colorBorder,
//         boxShadow: tokens.boxShadow,
//         borderRadius: 12,
//         minHeight: 250,
//       }}
//     >
//       <div
//         className="image-card-controls"
//         style={{
//           marginBottom: 8,
//           display: "flex",
//           gap: 8,
//           flexWrap: "wrap",
//           alignItems: "center",
//         }}
//       >
//         {showDateSelection && (
//           <DatePicker size="small" value={selectedDate} onChange={setSelectedDate} format="YYYY-MM-DD" />
//         )}
//         {showTimeSelection && (
//           <TimePicker size="small" value={selectedTime} onChange={setSelectedTime} format="HH:mm" />
//         )}
//         <Segmented
//           size="small"
//           options={["Single", "Multiple"]}
//           value={viewMode === "single" ? "Single" : "Multiple"}
//           onChange={val => setViewMode(val.toLowerCase())}
//         />
//       </div>

//       <Image.PreviewGroup
//         preview={{
//           visible: preview.visible,
//           current: preview.index,
//           onVisibleChange: vis => !vis && closePreview(),
//           mask: <span style={{ color: "#fff", fontWeight: 600 }}>Click to Preview</span>,
//           transitionName: "ant-fade",
//         }}
//       >
//         {/* ---- MULTI-VIEW: Always show history thumbnails ---- */}
//         {viewMode === "multiple" && (
//           <div className="image-card-multiple-view" style={{ flexGrow: 1, width: "100%" }}>
//             <div
//               className="image-card-multi-grid"
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
//                 gap: 8,
//                 width: "100%",
//                 height: "100%",
//                 alignItems: "stretch"
//               }}
//             >
//               {snapshots.length === 0 ? (
//                 <div style={{
//                   gridColumn: "1 / -1",
//                   textAlign: "center",
//                   color: tokens.disabledText,
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   height: 90,
//                   fontSize: 15
//                 }}>
//                   <InfoCircleOutlined style={{ fontSize: 19, marginRight: 7 }} />
//                   No snapshot history available.
//                 </div>
//               ) : (
//                 snapshots.map((snapshot, index) => (
//                   <div
//                     key={snapshot.id || index}
//                     style={{
//                       width: "100%",
//                       aspectRatio: "4 / 3",
//                       position: "relative",
//                       overflow: "hidden",
//                       borderRadius: 10,
//                       boxShadow: tokens.boxShadow,
//                       background: tokens.colorBgElevated,
//                       cursor: "pointer",
//                       transition: "box-shadow .15s,transform .15s",
//                       display: "flex",
//                       flexDirection: "column",
//                     }}
//                     onClick={() => openPreviewAt(index)}
//                     tabIndex={0}
//                     className="image-card-thumb-outer"
//                   >
//                     <Image
//                       src={snapshot.url}
//                       alt={`Snapshot ${index + 1}`}
//                       preview={false}
//                       style={{
//                         width: "100%",
//                         height: "100%",
//                         objectFit: "cover",
//                         borderRadius: 10,
//                         transition: "transform 0.22s cubic-bezier(.33,1.02,.55,.99)",
//                         background: tokens.colorBgElevated,
//                         display: "block"
//                       }}
//                     />
//                     {/* Overlay */}
//                     <div
//                       className="image-card-thumbnail-overlay"
//                       style={{
//                         position: "absolute",
//                         bottom: 0,
//                         left: 0,
//                         width: "100%",
//                         background: isDarkMode
//                           ? "rgba(16,16,16,0.72)"
//                           : "rgba(255,255,255,0.83)",
//                         color: isDarkMode ? "#fff" : "#222",
//                         padding: "3px 9px 3px 8px",
//                         fontSize: 12.5,
//                         fontWeight: 500,
//                         display: "flex",
//                         justifyContent: "space-between",
//                         alignItems: "center",
//                         borderBottomLeftRadius: 10,
//                         borderBottomRightRadius: 10,
//                         minHeight: 22,
//                         zIndex: 2,
//                         boxSizing: "border-box"
//                       }}
//                     >
//                       <Tooltip title={formatTime(snapshot.timestamp)}>
//                         {snapshot.timestamp ? moment(snapshot.timestamp).format("HH:mm") : "--"}
//                       </Tooltip>
//                       <Tag
//                         color={statusColor(snapshot.door_event_snapshot, tokens)}
//                         icon={statusIcon(snapshot.door_event_snapshot)}
//                         style={{
//                           fontWeight: 600,
//                           borderRadius: 5,
//                           fontSize: 12,
//                           marginRight: 0,
//                           padding: "1px 7px",
//                           minWidth: 60,
//                           textAlign: "center"
//                         }}
//                       >
//                         {snapshot.door_event_snapshot?.toUpperCase() || "?"}
//                       </Tag>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         )}

//         {/* ---- SINGLE VIEW ---- */}
//         {viewMode === "single" && (
//           showNoCurrentSnapshot ? (
//             <div style={{
//               flex: 1,
//               display: "flex",
//               flexDirection: "column",
//               alignItems: "center",
//               justifyContent: "center",
//               color: tokens.disabledText,
//               minHeight: 120,
//               textAlign: "center"
//             }}>
//               <InfoCircleOutlined style={{ fontSize: 28, marginBottom: 8, color: tokens.disabledText }} />
//               <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 2 }}>
//                 No current snapshot. Door is closed or no event detected.
//               </div>
//               <div style={{ fontSize: 13, color: tokens.gray }}>
//                 Latest 10 snapshots remain in history.
//               </div>
//             </div>
//           ) : (
//             currentSnapshot && (
//               <div className="image-card-single-view"
//                 style={{
//                   flexGrow: 1,
//                   width: "100%",
//                   minHeight: 0,
//                   display: "flex",
//                   flexDirection: "column",
//                   alignItems: "center",
//                   justifyContent: "center"
//                 }}
//               >
//                 <div className="image-card-image-wrapper"
//                   style={{
//                     width: "100%",
//                     height: "auto",
//                     maxWidth: "100%",
//                     aspectRatio: "4 / 3",
//                     margin: "0 auto 10px auto",
//                     boxShadow: tokens.boxShadow,
//                     background: tokens.colorBgElevated,
//                     borderRadius: 12,
//                     position: "relative",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center"
//                   }}
//                 >
//                   <Image
//                     src={currentSnapshot.url || "/placeholder.svg"}
//                     alt={currentSnapshot.filename || "Snapshot"}
//                     className="image-card-main-image"
//                     preview={false}
//                     style={{
//                       width: "100%",
//                       height: "100%",
//                       objectFit: "contain",
//                       borderRadius: 12,
//                       border: `1.5px solid ${tokens.colorBorder}`,
//                       background: tokens.colorBgElevated,
//                       cursor: "pointer",
//                       transition: "box-shadow 0.22s cubic-bezier(.33,1.02,.55,.99), transform 0.18s cubic-bezier(.33,1.02,.55,.99)"
//                     }}
//                     onClick={() => openPreviewAt(currentSnapshotIndex)}
//                   />
//                   {snapshots.length > 1 && (
//                     <div className="image-card-navigation" style={{
//                       position: "absolute",
//                       top: "50%",
//                       width: "100%",
//                       display: "flex",
//                       justifyContent: "space-between",
//                       zIndex: 3
//                     }}>
//                       <Button icon={<LeftOutlined />} onClick={handlePrev} shape="circle" size="small" />
//                       <Button icon={<RightOutlined />} onClick={handleNext} shape="circle" size="small" />
//                     </div>
//                   )}
//                   {currentSnapshot.door_event_snapshot && (
//                     <Tag
//                       color={statusColor(currentSnapshot.door_event_snapshot, tokens)}
//                       icon={statusIcon(currentSnapshot.door_event_snapshot)}
//                       style={{
//                         position: "absolute",
//                         top: 10,
//                         left: 18,
//                         zIndex: 3,
//                         fontWeight: 600,
//                         borderRadius: 6,
//                         fontSize: 13,
//                         padding: "2.5px 10px"
//                       }}
//                     >
//                       {currentSnapshot.door_event_snapshot?.toUpperCase()}
//                     </Tag>
//                   )}
//                 </div>
//                 {/* Metadata */}
//                 <Descriptions
//                   column={{ xs: 1, sm: 2, md: 2, lg: 3 }}
//                   size="small"
//                   className="image-card-metadata"
//                   style={{
//                     marginTop: 7,
//                     width: "100%",
//                     maxWidth: 540,
//                     padding: "7px 10px",
//                     background: tokens.colorBgElevated,
//                     borderRadius: 8,
//                     color: tokens.colorText,
//                     fontSize: "0.97em"
//                   }}
//                   labelStyle={{
//                     color: tokens.colorTextSecondary,
//                     fontWeight: 500
//                   }}
//                   contentStyle={{
//                     color: tokens.colorText
//                   }}
//                 >
//                   <Descriptions.Item label="Date">{currentSnapshot.timestamp ? moment(currentSnapshot.timestamp).format("YYYY-MM-DD") : "--"}</Descriptions.Item>
//                   <Descriptions.Item label="Time">{currentSnapshot.timestamp ? moment(currentSnapshot.timestamp).format("HH:mm:ss") : "--"}</Descriptions.Item>
//                   {showEventType && currentSnapshot.eventType && (
//                     <Descriptions.Item label="Event Type"><Text strong>{currentSnapshot.eventType}</Text></Descriptions.Item>
//                   )}
//                   {showCustomMetadata1 && customMetadata1Label && currentSnapshot.customMetadata1 && (
//                     <Descriptions.Item label={customMetadata1Label}>{currentSnapshot.customMetadata1}</Descriptions.Item>
//                   )}
//                   {showCustomMetadata2 && customMetadata2Label && currentSnapshot.customMetadata2 && (
//                     <Descriptions.Item label={customMetadata2Label}>{currentSnapshot.customMetadata2}</Descriptions.Item>
//                   )}
//                 </Descriptions>
//               </div>
//             )
//           )
//         )}
//       </Image.PreviewGroup>
//     </Card>
//   )
// }

// export default ImageCardWidget

// // "use client"

// // import React, { useState, useEffect, useRef } from "react"
// // import {
// //   Card, Button, Segmented, Descriptions, Typography, DatePicker, TimePicker, Image, Tag, Tooltip
// // } from "antd"
// // import moment from "moment"
// // import { LeftOutlined, RightOutlined, CheckCircleFilled, CloseCircleFilled, InfoCircleOutlined } from "@ant-design/icons"
// // import { useTheme } from "../../theme/ThemeProvider"
// // import { getDeviceObjectHistory } from "../../../api/objectApi" // You must provide this API
// // import "../../../styles/image-card-widget.css"

// // const { Text } = Typography
// // const MAX_HISTORY = 10

// // const formatTime = ts => ts ? moment(ts).format("YYYY-MM-DD HH:mm:ss") : "--"

// // const statusColor = (status, tokens) =>
// //   status === "success"
// //     ? tokens.ok || "success"
// //     : status === "fail"
// //       ? tokens.err || "error"
// //       : tokens.gray || "default"

// // const statusIcon = status =>
// //   status === "success"
// //     ? <CheckCircleFilled style={{ color: "#52c41a" }} />
// //     : status === "fail"
// //       ? <CloseCircleFilled style={{ color: "#f5222d" }} />
// //       : null

// // function getTenantId() {
// //   if (typeof window !== "undefined") {
// //     return localStorage.getItem("tenantId") || ""
// //   }
// //   return ""
// // }

// // const ImageCardWidget = ({
// //   config = {},
// //   liveData,
// //   tenantId: propTenantId,
// //   deviceId: propDeviceId,
// // }) => {
// //   const {
// //     title,
// //     defaultViewMode,
// //     showDateSelection,
// //     showTimeSelection,
// //     showEventType,
// //     showCustomMetadata1,
// //     customMetadata1Label,
// //     showCustomMetadata2,
// //     customMetadata2Label,
// //     category = "CAMERA",
// //     objectType = "snapshot",
// //   } = config

// //   const { isDarkMode, tokens } = useTheme()

// //   // Resolve tenantId and deviceId (props override localStorage/context)
// //   const tenantId = propTenantId || getTenantId()
// //   const deviceId = propDeviceId || config.deviceId

// //   const [snapshots, setSnapshots] = useState([])
// //   const [currentSnapshotIndex, setCurrentSnapshotIndex] = useState(0)
// //   const [selectedDate, setSelectedDate] = useState(moment())
// //   const [selectedTime, setSelectedTime] = useState(moment())
// //   const [viewMode, setViewMode] = useState(defaultViewMode || "single")
// //   const [preview, setPreview] = useState({ visible: false, index: 0 })
// //   const prevKeyRef = useRef("")

// //   // ---- 1. Live updates: add to history (do not clear if door closed) ----
// //   useEffect(() => {
// //     if (!liveData) return
// //     if (!liveData.url || liveData.door_event_snapshot === "fail") return

// //     const key = (liveData.url || "") + "::" + (liveData.timestamp || "")
// //     if (key !== prevKeyRef.current) {
// //       prevKeyRef.current = key
// //       const newSnap = {
// //         id: (liveData.snap_id || liveData.filename || liveData.url || key) + "::" + (liveData.timestamp || Date.now()),
// //         url: liveData.url,
// //         timestamp: liveData.timestamp,
// //         filename: liveData.filename,
// //         snap_id: liveData.snap_id,
// //         snapshots_stored: liveData.snapshots_stored,
// //         eventType: liveData.eventType,
// //         customMetadata1: liveData.customMetadata1,
// //         customMetadata2: liveData.customMetadata2,
// //         door_event_snapshot: liveData.door_event_snapshot,
// //       }
// //       setSnapshots(prev => {
// //         const filtered = prev.filter(s => s.url !== newSnap.url || s.timestamp !== newSnap.timestamp)
// //         return [newSnap, ...filtered].slice(0, MAX_HISTORY)
// //       })
// //       setCurrentSnapshotIndex(0)
// //     }
// //   }, [liveData])

// //   // ---- 2. On mount or door closed, load history if needed (for "multiple" view and no valid current) ----
// //   useEffect(() => {
// //     // Only load if: MULTIPLE view, no images, and tenantId/deviceId known
// //     if (
// //       viewMode === "multiple" &&
// //       (!snapshots.length || (!liveData?.url && !snapshots[0]?.url)) &&
// //       tenantId && deviceId
// //     ) {
// //       getDeviceObjectHistory({
// //         tenantId,
// //         deviceId,
// //         category,
// //         objectType,
// //         page: 0,
// //         size: MAX_HISTORY,
// //       }).then(data => {
// //         if (Array.isArray(data.content) && data.content.length > 0) {
// //           setSnapshots(
// //             data.content
// //               .map(snap => ({
// //                 id: snap.snap_id || snap.id || snap.url || snap.filename,
// //                 ...snap,
// //               }))
// //               .slice(0, MAX_HISTORY)
// //           )
// //           setCurrentSnapshotIndex(0)
// //         }
// //       }).catch(() => {/* silent */})
// //     }
// //     // eslint-disable-next-line
// //   }, [viewMode, tenantId, deviceId])

// //   // Navigation
// //   const handlePrev = () => setCurrentSnapshotIndex(i => (i === 0 ? snapshots.length - 1 : i - 1))
// //   const handleNext = () => setCurrentSnapshotIndex(i => (i === snapshots.length - 1 ? 0 : i + 1))
// //   const currentSnapshot = snapshots[currentSnapshotIndex] || {}

// //   // Preview modal
// //   const openPreviewAt = idx => setPreview({ visible: true, index: idx })
// //   const closePreview = () => setPreview({ visible: false, index: 0 })

// //   // Industry message if no current snapshot
// //   const showNoCurrentSnapshot =
// //     (viewMode === "single") &&
// //     (!currentSnapshot.url || currentSnapshot.door_event_snapshot === "fail")

// //   return (
// //     <Card
// //       title={title}
// //       className="image-card-widget"
// //       bodyStyle={{
// //         height: "calc(100% - 56px)",
// //         overflowY: "auto",
// //         display: "flex",
// //         flexDirection: "column",
// //         background: tokens.colorBgContainer,
// //         padding: "10px 8px 6px 8px",
// //       }}
// //       style={{
// //         background: tokens.colorBgContainer,
// //         borderColor: tokens.colorBorder,
// //         boxShadow: tokens.boxShadow,
// //         borderRadius: 12,
// //         minHeight: 250,
// //       }}
// //     >
// //       <div
// //         className="image-card-controls"
// //         style={{
// //           marginBottom: 8,
// //           display: "flex",
// //           gap: 8,
// //           flexWrap: "wrap",
// //           alignItems: "center",
// //         }}
// //       >
// //         {showDateSelection && (
// //           <DatePicker size="small" value={selectedDate} onChange={setSelectedDate} format="YYYY-MM-DD" />
// //         )}
// //         {showTimeSelection && (
// //           <TimePicker size="small" value={selectedTime} onChange={setSelectedTime} format="HH:mm" />
// //         )}
// //         <Segmented
// //           size="small"
// //           options={["Single", "Multiple"]}
// //           value={viewMode === "single" ? "Single" : "Multiple"}
// //           onChange={val => setViewMode(val.toLowerCase())}
// //         />
// //       </div>

// //       <Image.PreviewGroup
// //         preview={{
// //           visible: preview.visible,
// //           current: preview.index,
// //           onVisibleChange: vis => !vis && closePreview(),
// //           mask: <span style={{ color: "#fff", fontWeight: 600 }}>Click to Preview</span>,
// //           transitionName: "ant-fade",
// //         }}
// //       >
// //         {/* ---- MULTI-VIEW: Always show history thumbnails ---- */}
// //         {viewMode === "multiple" && (
// //           <div className="image-card-multiple-view" style={{ flexGrow: 1, width: "100%" }}>
// //             <div
// //               className="image-card-multi-grid"
// //               style={{
// //                 display: "grid",
// //                 gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
// //                 gap: 8,
// //                 width: "100%",
// //                 height: "100%",
// //                 alignItems: "stretch"
// //               }}
// //             >
// //               {snapshots.length === 0 ? (
// //                 <div style={{
// //                   gridColumn: "1 / -1",
// //                   textAlign: "center",
// //                   color: tokens.disabledText,
// //                   display: "flex",
// //                   alignItems: "center",
// //                   justifyContent: "center",
// //                   height: 90,
// //                   fontSize: 15
// //                 }}>
// //                   <InfoCircleOutlined style={{ fontSize: 19, marginRight: 7 }} />
// //                   No snapshot history available.
// //                 </div>
// //               ) : (
// //                 snapshots.map((snapshot, index) => (
// //                   <div
// //                     key={snapshot.id || index}
// //                     style={{
// //                       width: "100%",
// //                       aspectRatio: "4 / 3",
// //                       position: "relative",
// //                       overflow: "hidden",
// //                       borderRadius: 10,
// //                       boxShadow: tokens.boxShadow,
// //                       background: tokens.colorBgElevated,
// //                       cursor: "pointer",
// //                       transition: "box-shadow .15s,transform .15s",
// //                       display: "flex",
// //                       flexDirection: "column",
// //                     }}
// //                     onClick={() => openPreviewAt(index)}
// //                     tabIndex={0}
// //                     className="image-card-thumb-outer"
// //                   >
// //                     <Image
// //                       src={snapshot.url}
// //                       alt={`Snapshot ${index + 1}`}
// //                       preview={false}
// //                       style={{
// //                         width: "100%",
// //                         height: "100%",
// //                         objectFit: "cover",
// //                         borderRadius: 10,
// //                         transition: "transform 0.22s cubic-bezier(.33,1.02,.55,.99)",
// //                         background: tokens.colorBgElevated,
// //                         display: "block"
// //                       }}
// //                     />
// //                     {/* Overlay */}
// //                     <div
// //                       className="image-card-thumbnail-overlay"
// //                       style={{
// //                         position: "absolute",
// //                         bottom: 0,
// //                         left: 0,
// //                         width: "100%",
// //                         background: isDarkMode
// //                           ? "rgba(16,16,16,0.72)"
// //                           : "rgba(255,255,255,0.83)",
// //                         color: isDarkMode ? "#fff" : "#222",
// //                         padding: "3px 9px 3px 8px",
// //                         fontSize: 12.5,
// //                         fontWeight: 500,
// //                         display: "flex",
// //                         justifyContent: "space-between",
// //                         alignItems: "center",
// //                         borderBottomLeftRadius: 10,
// //                         borderBottomRightRadius: 10,
// //                         minHeight: 22,
// //                         zIndex: 2,
// //                         boxSizing: "border-box"
// //                       }}
// //                     >
// //                       <Tooltip title={formatTime(snapshot.timestamp)}>
// //                         {snapshot.timestamp ? moment(snapshot.timestamp).format("HH:mm") : "--"}
// //                       </Tooltip>
// //                       <Tag
// //                         color={statusColor(snapshot.door_event_snapshot, tokens)}
// //                         icon={statusIcon(snapshot.door_event_snapshot)}
// //                         style={{
// //                           fontWeight: 600,
// //                           borderRadius: 5,
// //                           fontSize: 12,
// //                           marginRight: 0,
// //                           padding: "1px 7px",
// //                           minWidth: 60,
// //                           textAlign: "center"
// //                         }}
// //                       >
// //                         {snapshot.door_event_snapshot?.toUpperCase() || "?"}
// //                       </Tag>
// //                     </div>
// //                   </div>
// //                 ))
// //               )}
// //             </div>
// //           </div>
// //         )}

// //         {/* ---- SINGLE VIEW ---- */}
// //         {viewMode === "single" && (
// //           showNoCurrentSnapshot ? (
// //             <div style={{
// //               flex: 1,
// //               display: "flex",
// //               flexDirection: "column",
// //               alignItems: "center",
// //               justifyContent: "center",
// //               color: tokens.disabledText,
// //               minHeight: 120,
// //               textAlign: "center"
// //             }}>
// //               <InfoCircleOutlined style={{ fontSize: 28, marginBottom: 8, color: tokens.disabledText }} />
// //               <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 2 }}>
// //                 No current snapshot. Door is closed or no event detected.
// //               </div>
// //               <div style={{ fontSize: 13, color: tokens.gray }}>
// //                 Latest 10 snapshots remain in history.
// //               </div>
// //             </div>
// //           ) : (
// //             currentSnapshot && (
// //               <div className="image-card-single-view"
// //                 style={{
// //                   flexGrow: 1,
// //                   width: "100%",
// //                   minHeight: 0,
// //                   display: "flex",
// //                   flexDirection: "column",
// //                   alignItems: "center",
// //                   justifyContent: "center"
// //                 }}
// //               >
// //                 <div className="image-card-image-wrapper"
// //                   style={{
// //                     width: "100%",
// //                     height: "auto",
// //                     maxWidth: "100%",
// //                     aspectRatio: "4 / 3",
// //                     margin: "0 auto 10px auto",
// //                     boxShadow: tokens.boxShadow,
// //                     background: tokens.colorBgElevated,
// //                     borderRadius: 12,
// //                     position: "relative",
// //                     display: "flex",
// //                     alignItems: "center",
// //                     justifyContent: "center"
// //                   }}
// //                 >
// //                   <Image
// //                     src={currentSnapshot.url || "/placeholder.svg"}
// //                     alt={currentSnapshot.filename || "Snapshot"}
// //                     className="image-card-main-image"
// //                     preview={false}
// //                     style={{
// //                       width: "100%",
// //                       height: "100%",
// //                       objectFit: "contain",
// //                       borderRadius: 12,
// //                       border: `1.5px solid ${tokens.colorBorder}`,
// //                       background: tokens.colorBgElevated,
// //                       cursor: "pointer",
// //                       transition: "box-shadow 0.22s cubic-bezier(.33,1.02,.55,.99), transform 0.18s cubic-bezier(.33,1.02,.55,.99)"
// //                     }}
// //                     onClick={() => openPreviewAt(currentSnapshotIndex)}
// //                   />
// //                   {snapshots.length > 1 && (
// //                     <div className="image-card-navigation" style={{
// //                       position: "absolute",
// //                       top: "50%",
// //                       width: "100%",
// //                       display: "flex",
// //                       justifyContent: "space-between",
// //                       zIndex: 3
// //                     }}>
// //                       <Button icon={<LeftOutlined />} onClick={handlePrev} shape="circle" size="small" />
// //                       <Button icon={<RightOutlined />} onClick={handleNext} shape="circle" size="small" />
// //                     </div>
// //                   )}
// //                   {currentSnapshot.door_event_snapshot && (
// //                     <Tag
// //                       color={statusColor(currentSnapshot.door_event_snapshot, tokens)}
// //                       icon={statusIcon(currentSnapshot.door_event_snapshot)}
// //                       style={{
// //                         position: "absolute",
// //                         top: 10,
// //                         left: 18,
// //                         zIndex: 3,
// //                         fontWeight: 600,
// //                         borderRadius: 6,
// //                         fontSize: 13,
// //                         padding: "2.5px 10px"
// //                       }}
// //                     >
// //                       {currentSnapshot.door_event_snapshot?.toUpperCase()}
// //                     </Tag>
// //                   )}
// //                 </div>
// //                 {/* Metadata */}
// //                 <Descriptions
// //                   column={{ xs: 1, sm: 2, md: 2, lg: 3 }}
// //                   size="small"
// //                   className="image-card-metadata"
// //                   style={{
// //                     marginTop: 7,
// //                     width: "100%",
// //                     maxWidth: 540,
// //                     padding: "7px 10px",
// //                     background: tokens.colorBgElevated,
// //                     borderRadius: 8,
// //                     color: tokens.colorText,
// //                     fontSize: "0.97em"
// //                   }}
// //                   labelStyle={{
// //                     color: tokens.colorTextSecondary,
// //                     fontWeight: 500
// //                   }}
// //                   contentStyle={{
// //                     color: tokens.colorText
// //                   }}
// //                 >
// //                   <Descriptions.Item label="Date">{currentSnapshot.timestamp ? moment(currentSnapshot.timestamp).format("YYYY-MM-DD") : "--"}</Descriptions.Item>
// //                   <Descriptions.Item label="Time">{currentSnapshot.timestamp ? moment(currentSnapshot.timestamp).format("HH:mm:ss") : "--"}</Descriptions.Item>
// //                   {showEventType && currentSnapshot.eventType && (
// //                     <Descriptions.Item label="Event Type"><Text strong>{currentSnapshot.eventType}</Text></Descriptions.Item>
// //                   )}
// //                   {showCustomMetadata1 && customMetadata1Label && currentSnapshot.customMetadata1 && (
// //                     <Descriptions.Item label={customMetadata1Label}>{currentSnapshot.customMetadata1}</Descriptions.Item>
// //                   )}
// //                   {showCustomMetadata2 && customMetadata2Label && currentSnapshot.customMetadata2 && (
// //                     <Descriptions.Item label={customMetadata2Label}>{currentSnapshot.customMetadata2}</Descriptions.Item>
// //                   )}
// //                 </Descriptions>
// //               </div>
// //             )
// //           )
// //         )}
// //       </Image.PreviewGroup>
// //     </Card>
// //   )
// // }

// // export default ImageCardWidget

// // // "use client"

// // // import React, { useState, useEffect, useRef } from "react"
// // // import {
// // //   Card, Button, Segmented, Descriptions, Typography, DatePicker, TimePicker, Image, Tag, Tooltip, Row, Col
// // // } from "antd"
// // // import moment from "moment"
// // // import { LeftOutlined, RightOutlined, CheckCircleFilled, CloseCircleFilled, InfoCircleOutlined } from "@ant-design/icons"
// // // import { useTheme } from "../../theme/ThemeProvider"
// // // import "../../../styles/image-card-widget.css"

// // // const { Text } = Typography
// // // const MAX_HISTORY = 10

// // // const formatTime = ts => ts ? moment(ts).format("YYYY-MM-DD HH:mm:ss") : "--"

// // // const statusColor = (status, tokens) =>
// // //   status === "success"
// // //     ? tokens.ok || "success"
// // //     : status === "fail"
// // //       ? tokens.err || "error"
// // //       : tokens.gray || "default"

// // // const statusIcon = status =>
// // //   status === "success"
// // //     ? <CheckCircleFilled style={{ color: "#52c41a" }} />
// // //     : status === "fail"
// // //       ? <CloseCircleFilled style={{ color: "#f5222d" }} />
// // //       : null

// // // const ImageCardWidget = ({
// // //   config = {},
// // //   liveData,
// // // }) => {
// // //   const {
// // //     title,
// // //     defaultViewMode,
// // //     showDateSelection,
// // //     showTimeSelection,
// // //     showEventType,
// // //     showCustomMetadata1,
// // //     customMetadata1Label,
// // //     showCustomMetadata2,
// // //     customMetadata2Label,
// // //   } = config

// // //   const { isDarkMode, tokens } = useTheme()

// // //   const [snapshots, setSnapshots] = useState([])
// // //   const [currentSnapshotIndex, setCurrentSnapshotIndex] = useState(0)
// // //   const [selectedDate, setSelectedDate] = useState(moment())
// // //   const [selectedTime, setSelectedTime] = useState(moment())
// // //   const [viewMode, setViewMode] = useState(defaultViewMode || "single")
// // //   const [preview, setPreview] = useState({ visible: false, index: 0 })
// // //   const prevKeyRef = useRef("")

// // //   // Only update snapshots if there is a valid image (do not reset history on door close)
// // //   useEffect(() => {
// // //     if (!liveData) return
// // //     if (!liveData.url || liveData.door_event_snapshot === "fail") return

// // //     const key = (liveData.url || "") + "::" + (liveData.timestamp || "")
// // //     if (key !== prevKeyRef.current) {
// // //       prevKeyRef.current = key
// // //       const newSnap = {
// // //         id: (liveData.snap_id || liveData.filename || liveData.url || key) + "::" + (liveData.timestamp || Date.now()),
// // //         url: liveData.url,
// // //         timestamp: liveData.timestamp,
// // //         filename: liveData.filename,
// // //         snap_id: liveData.snap_id,
// // //         snapshots_stored: liveData.snapshots_stored,
// // //         eventType: liveData.eventType,
// // //         customMetadata1: liveData.customMetadata1,
// // //         customMetadata2: liveData.customMetadata2,
// // //         door_event_snapshot: liveData.door_event_snapshot,
// // //       }
// // //       setSnapshots(prev => {
// // //         const filtered = prev.filter(s => s.url !== newSnap.url || s.timestamp !== newSnap.timestamp)
// // //         return [newSnap, ...filtered].slice(0, MAX_HISTORY)
// // //       })
// // //       setCurrentSnapshotIndex(0)
// // //     }
// // //   }, [liveData])

// // //   // Navigation
// // //   const handlePrev = () => setCurrentSnapshotIndex(i => (i === 0 ? snapshots.length - 1 : i - 1))
// // //   const handleNext = () => setCurrentSnapshotIndex(i => (i === snapshots.length - 1 ? 0 : i + 1))
// // //   const currentSnapshot = snapshots[currentSnapshotIndex] || {}

// // //   // Preview modal
// // //   const openPreviewAt = idx => setPreview({ visible: true, index: idx })
// // //   const closePreview = () => setPreview({ visible: false, index: 0 })

// // //   // Show special industry message if there is **no current snapshot** (door is closed or no event)
// // //   const showNoCurrentSnapshot =
// // //     (viewMode === "single") &&
// // //     (!currentSnapshot.url || currentSnapshot.door_event_snapshot === "fail")

// // //   return (
// // //     <Card
// // //       title={title}
// // //       className="image-card-widget"
// // //       bodyStyle={{
// // //         height: "calc(100% - 56px)",
// // //         overflowY: "auto",
// // //         display: "flex",
// // //         flexDirection: "column",
// // //         background: tokens.colorBgContainer,
// // //         padding: "10px 8px 6px 8px",
// // //       }}
// // //       style={{
// // //         background: tokens.colorBgContainer,
// // //         borderColor: tokens.colorBorder,
// // //         boxShadow: tokens.boxShadow,
// // //         borderRadius: 12,
// // //         minHeight: 250,
// // //       }}
// // //     >
// // //       <div
// // //         className="image-card-controls"
// // //         style={{
// // //           marginBottom: 8,
// // //           display: "flex",
// // //           gap: 8,
// // //           flexWrap: "wrap",
// // //           alignItems: "center",
// // //         }}
// // //       >
// // //         {showDateSelection && (
// // //           <DatePicker size="small" value={selectedDate} onChange={setSelectedDate} format="YYYY-MM-DD" />
// // //         )}
// // //         {showTimeSelection && (
// // //           <TimePicker size="small" value={selectedTime} onChange={setSelectedTime} format="HH:mm" />
// // //         )}
// // //         <Segmented
// // //           size="small"
// // //           options={["Single", "Multiple"]}
// // //           value={viewMode === "single" ? "Single" : "Multiple"}
// // //           onChange={val => setViewMode(val.toLowerCase())}
// // //         />
// // //       </div>

// // //       <Image.PreviewGroup
// // //         preview={{
// // //           visible: preview.visible,
// // //           current: preview.index,
// // //           onVisibleChange: vis => !vis && closePreview(),
// // //           mask: <span style={{ color: "#fff", fontWeight: 600 }}>Click to Preview</span>,
// // //           transitionName: "ant-fade",
// // //         }}
// // //       >
// // //         {/* ---- MULTI-VIEW: Always show history thumbnails ---- */}
// // //         {viewMode === "multiple" && (
// // //           <div className="image-card-multiple-view" style={{ flexGrow: 1, width: "100%" }}>
// // //             <div
// // //               className="image-card-multi-grid"
// // //               style={{
// // //                 display: "grid",
// // //                 gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
// // //                 gap: 8,
// // //                 width: "100%",
// // //                 height: "100%",
// // //                 alignItems: "stretch"
// // //               }}
// // //             >
// // //               {snapshots.length === 0 ? (
// // //                 <div style={{
// // //                   gridColumn: "1 / -1",
// // //                   textAlign: "center",
// // //                   color: tokens.disabledText,
// // //                   display: "flex",
// // //                   alignItems: "center",
// // //                   justifyContent: "center",
// // //                   height: 90,
// // //                   fontSize: 15
// // //                 }}>
// // //                   <InfoCircleOutlined style={{ fontSize: 19, marginRight: 7 }} />
// // //                   No snapshot history available.
// // //                 </div>
// // //               ) : (
// // //                 snapshots.map((snapshot, index) => (
// // //                   <div
// // //                     key={snapshot.id || index}
// // //                     style={{
// // //                       width: "100%",
// // //                       aspectRatio: "4 / 3",
// // //                       position: "relative",
// // //                       overflow: "hidden",
// // //                       borderRadius: 10,
// // //                       boxShadow: tokens.boxShadow,
// // //                       background: tokens.colorBgElevated,
// // //                       cursor: "pointer",
// // //                       transition: "box-shadow .15s,transform .15s",
// // //                       display: "flex",
// // //                       flexDirection: "column",
// // //                     }}
// // //                     onClick={() => openPreviewAt(index)}
// // //                     tabIndex={0}
// // //                     className="image-card-thumb-outer"
// // //                   >
// // //                     <Image
// // //                       src={snapshot.url}
// // //                       alt={`Snapshot ${index + 1}`}
// // //                       preview={false}
// // //                       style={{
// // //                         width: "100%",
// // //                         height: "100%",
// // //                         objectFit: "cover",
// // //                         borderRadius: 10,
// // //                         transition: "transform 0.22s cubic-bezier(.33,1.02,.55,.99)",
// // //                         background: tokens.colorBgElevated,
// // //                         display: "block"
// // //                       }}
// // //                     />
// // //                     {/* Overlay */}
// // //                     <div
// // //                       className="image-card-thumbnail-overlay"
// // //                       style={{
// // //                         position: "absolute",
// // //                         bottom: 0,
// // //                         left: 0,
// // //                         width: "100%",
// // //                         background: isDarkMode
// // //                           ? "rgba(16,16,16,0.72)"
// // //                           : "rgba(255,255,255,0.83)",
// // //                         color: isDarkMode ? "#fff" : "#222",
// // //                         padding: "3px 9px 3px 8px",
// // //                         fontSize: 12.5,
// // //                         fontWeight: 500,
// // //                         display: "flex",
// // //                         justifyContent: "space-between",
// // //                         alignItems: "center",
// // //                         borderBottomLeftRadius: 10,
// // //                         borderBottomRightRadius: 10,
// // //                         minHeight: 22,
// // //                         zIndex: 2,
// // //                         boxSizing: "border-box"
// // //                       }}
// // //                     >
// // //                       <Tooltip title={formatTime(snapshot.timestamp)}>
// // //                         {snapshot.timestamp ? moment(snapshot.timestamp).format("HH:mm") : "--"}
// // //                       </Tooltip>
// // //                       <Tag
// // //                         color={statusColor(snapshot.door_event_snapshot, tokens)}
// // //                         icon={statusIcon(snapshot.door_event_snapshot)}
// // //                         style={{
// // //                           fontWeight: 600,
// // //                           borderRadius: 5,
// // //                           fontSize: 12,
// // //                           marginRight: 0,
// // //                           padding: "1px 7px",
// // //                           minWidth: 60,
// // //                           textAlign: "center"
// // //                         }}
// // //                       >
// // //                         {snapshot.door_event_snapshot?.toUpperCase() || "?"}
// // //                       </Tag>
// // //                     </div>
// // //                   </div>
// // //                 ))
// // //               )}
// // //             </div>
// // //           </div>
// // //         )}

// // //         {/* ---- SINGLE VIEW ---- */}
// // //         {viewMode === "single" && (
// // //           showNoCurrentSnapshot ? (
// // //             <div style={{
// // //               flex: 1,
// // //               display: "flex",
// // //               flexDirection: "column",
// // //               alignItems: "center",
// // //               justifyContent: "center",
// // //               color: tokens.disabledText,
// // //               minHeight: 120,
// // //               textAlign: "center"
// // //             }}>
// // //               <InfoCircleOutlined style={{ fontSize: 28, marginBottom: 8, color: tokens.disabledText }} />
// // //               <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 2 }}>
// // //                 No current snapshot. Door is closed or no event detected.
// // //               </div>
// // //               <div style={{ fontSize: 13, color: tokens.gray }}>
// // //                 Latest 10 snapshots remain in history.
// // //               </div>
// // //             </div>
// // //           ) : (
// // //             currentSnapshot && (
// // //               <div className="image-card-single-view"
// // //                 style={{
// // //                   flexGrow: 1,
// // //                   width: "100%",
// // //                   minHeight: 0,
// // //                   display: "flex",
// // //                   flexDirection: "column",
// // //                   alignItems: "center",
// // //                   justifyContent: "center"
// // //                 }}
// // //               >
// // //                 <div className="image-card-image-wrapper"
// // //                   style={{
// // //                     width: "100%",
// // //                     height: "auto",
// // //                     maxWidth: "100%",
// // //                     aspectRatio: "4 / 3",
// // //                     margin: "0 auto 10px auto",
// // //                     boxShadow: tokens.boxShadow,
// // //                     background: tokens.colorBgElevated,
// // //                     borderRadius: 12,
// // //                     position: "relative",
// // //                     display: "flex",
// // //                     alignItems: "center",
// // //                     justifyContent: "center"
// // //                   }}
// // //                 >
// // //                   <Image
// // //                     src={currentSnapshot.url || "/placeholder.svg"}
// // //                     alt={currentSnapshot.filename || "Snapshot"}
// // //                     className="image-card-main-image"
// // //                     preview={false}
// // //                     style={{
// // //                       width: "100%",
// // //                       height: "100%",
// // //                       objectFit: "contain",
// // //                       borderRadius: 12,
// // //                       border: `1.5px solid ${tokens.colorBorder}`,
// // //                       background: tokens.colorBgElevated,
// // //                       cursor: "pointer",
// // //                       transition: "box-shadow 0.22s cubic-bezier(.33,1.02,.55,.99), transform 0.18s cubic-bezier(.33,1.02,.55,.99)"
// // //                     }}
// // //                     onClick={() => openPreviewAt(currentSnapshotIndex)}
// // //                   />
// // //                   {snapshots.length > 1 && (
// // //                     <div className="image-card-navigation" style={{
// // //                       position: "absolute",
// // //                       top: "50%",
// // //                       width: "100%",
// // //                       display: "flex",
// // //                       justifyContent: "space-between",
// // //                       zIndex: 3
// // //                     }}>
// // //                       <Button icon={<LeftOutlined />} onClick={handlePrev} shape="circle" size="small" />
// // //                       <Button icon={<RightOutlined />} onClick={handleNext} shape="circle" size="small" />
// // //                     </div>
// // //                   )}
// // //                   {currentSnapshot.door_event_snapshot && (
// // //                     <Tag
// // //                       color={statusColor(currentSnapshot.door_event_snapshot, tokens)}
// // //                       icon={statusIcon(currentSnapshot.door_event_snapshot)}
// // //                       style={{
// // //                         position: "absolute",
// // //                         top: 10,
// // //                         left: 18,
// // //                         zIndex: 3,
// // //                         fontWeight: 600,
// // //                         borderRadius: 6,
// // //                         fontSize: 13,
// // //                         padding: "2.5px 10px"
// // //                       }}
// // //                     >
// // //                       {currentSnapshot.door_event_snapshot?.toUpperCase()}
// // //                     </Tag>
// // //                   )}
// // //                 </div>
// // //                 {/* Metadata */}
// // //                 <Descriptions
// // //                   column={{ xs: 1, sm: 2, md: 2, lg: 3 }}
// // //                   size="small"
// // //                   className="image-card-metadata"
// // //                   style={{
// // //                     marginTop: 7,
// // //                     width: "100%",
// // //                     maxWidth: 540,
// // //                     padding: "7px 10px",
// // //                     background: tokens.colorBgElevated,
// // //                     borderRadius: 8,
// // //                     color: tokens.colorText,
// // //                     fontSize: "0.97em"
// // //                   }}
// // //                   labelStyle={{
// // //                     color: tokens.colorTextSecondary,
// // //                     fontWeight: 500
// // //                   }}
// // //                   contentStyle={{
// // //                     color: tokens.colorText
// // //                   }}
// // //                 >
// // //                   <Descriptions.Item label="Date">{currentSnapshot.timestamp ? moment(currentSnapshot.timestamp).format("YYYY-MM-DD") : "--"}</Descriptions.Item>
// // //                   <Descriptions.Item label="Time">{currentSnapshot.timestamp ? moment(currentSnapshot.timestamp).format("HH:mm:ss") : "--"}</Descriptions.Item>
// // //                   {showEventType && currentSnapshot.eventType && (
// // //                     <Descriptions.Item label="Event Type"><Text strong>{currentSnapshot.eventType}</Text></Descriptions.Item>
// // //                   )}
// // //                   {showCustomMetadata1 && customMetadata1Label && currentSnapshot.customMetadata1 && (
// // //                     <Descriptions.Item label={customMetadata1Label}>{currentSnapshot.customMetadata1}</Descriptions.Item>
// // //                   )}
// // //                   {showCustomMetadata2 && customMetadata2Label && currentSnapshot.customMetadata2 && (
// // //                     <Descriptions.Item label={customMetadata2Label}>{currentSnapshot.customMetadata2}</Descriptions.Item>
// // //                   )}
// // //                 </Descriptions>
// // //               </div>
// // //             )
// // //           )
// // //         )}
// // //       </Image.PreviewGroup>
// // //     </Card>
// // //   )
// // // }

// // // export default ImageCardWidget

// // // // "use client"

// // // // import React, { useState, useEffect, useRef } from "react"
// // // // import {
// // // //   Card, Button, Segmented, Row, Col, Descriptions, Typography, DatePicker, TimePicker, Image, Tag, Tooltip
// // // // } from "antd"
// // // // import moment from "moment"
// // // // import { LeftOutlined, RightOutlined, CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons"
// // // // import { useTheme } from "../../theme/ThemeProvider"
// // // // import "../../../styles/image-card-widget.css"

// // // // const { Text } = Typography
// // // // const MAX_HISTORY = 10

// // // // const formatTime = ts => ts ? moment(ts).format("YYYY-MM-DD HH:mm:ss") : "--"

// // // // const statusColor = (status, tokens) =>
// // // //   status === "success"
// // // //     ? tokens.ok || "success"
// // // //     : status === "fail"
// // // //       ? tokens.err || "error"
// // // //       : tokens.gray || "default"

// // // // const statusIcon = status =>
// // // //   status === "success"
// // // //     ? <CheckCircleFilled style={{ color: "#52c41a" }} />
// // // //     : status === "fail"
// // // //       ? <CloseCircleFilled style={{ color: "#f5222d" }} />
// // // //       : null

// // // // const ImageCardWidget = ({
// // // //   config = {},
// // // //   liveData,
// // // // }) => {
// // // //   const {
// // // //     title,
// // // //     defaultViewMode,
// // // //     showDateSelection,
// // // //     showTimeSelection,
// // // //     showEventType,
// // // //     showCustomMetadata1,
// // // //     customMetadata1Label,
// // // //     showCustomMetadata2,
// // // //     customMetadata2Label,
// // // //   } = config

// // // //   const { isDarkMode, tokens } = useTheme()

// // // //   const [snapshots, setSnapshots] = useState([])
// // // //   const [currentSnapshotIndex, setCurrentSnapshotIndex] = useState(0)
// // // //   const [selectedDate, setSelectedDate] = useState(moment())
// // // //   const [selectedTime, setSelectedTime] = useState(moment())
// // // //   const [viewMode, setViewMode] = useState(defaultViewMode || "single")
// // // //   const [preview, setPreview] = useState({ visible: false, index: 0 })
// // // //   const prevKeyRef = useRef("")

// // // //   // Add new snapshot to history if unique
// // // //   useEffect(() => {
// // // //     if (!liveData) return
// // // //     if (!liveData.url || liveData.door_event_snapshot === "fail") return

// // // //     const key = (liveData.url || "") + "::" + (liveData.timestamp || "")
// // // //     if (key !== prevKeyRef.current) {
// // // //       prevKeyRef.current = key
// // // //       const newSnap = {
// // // //         id: (liveData.snap_id || liveData.filename || liveData.url || key) + "::" + (liveData.timestamp || Date.now()),
// // // //         url: liveData.url,
// // // //         timestamp: liveData.timestamp,
// // // //         filename: liveData.filename,
// // // //         snap_id: liveData.snap_id,
// // // //         snapshots_stored: liveData.snapshots_stored,
// // // //         eventType: liveData.eventType,
// // // //         customMetadata1: liveData.customMetadata1,
// // // //         customMetadata2: liveData.customMetadata2,
// // // //         door_event_snapshot: liveData.door_event_snapshot,
// // // //       }
// // // //       setSnapshots(prev => {
// // // //         const filtered = prev.filter(s => s.url !== newSnap.url || s.timestamp !== newSnap.timestamp)
// // // //         return [newSnap, ...filtered].slice(0, MAX_HISTORY)
// // // //       })
// // // //       setCurrentSnapshotIndex(0)
// // // //     }
// // // //   }, [liveData])

// // // //   // Navigation
// // // //   const handlePrev = () => setCurrentSnapshotIndex(i => (i === 0 ? snapshots.length - 1 : i - 1))
// // // //   const handleNext = () => setCurrentSnapshotIndex(i => (i === snapshots.length - 1 ? 0 : i + 1))
// // // //   const currentSnapshot = snapshots[currentSnapshotIndex] || {}

// // // //   // Preview modal
// // // //   const openPreviewAt = idx => setPreview({ visible: true, index: idx })
// // // //   const closePreview = () => setPreview({ visible: false, index: 0 })

// // // //   // DENSE, RESPONSIVE GRID LOGIC:
// // // //   // - Always fill available width
// // // //   // - Use aspect ratio for thumb/single image (not fixed px)
// // // //   // - On multi, use CSS to create responsive grid that grows/shrinks smoothly

// // // //   return (
// // // //     <Card
// // // //       title={title}
// // // //       className="image-card-widget"
// // // //       bodyStyle={{
// // // //         height: "calc(100% - 56px)",
// // // //         overflowY: "auto",
// // // //         display: "flex",
// // // //         flexDirection: "column",
// // // //         background: tokens.colorBgContainer,
// // // //         padding: "10px 8px 6px 8px",
// // // //       }}
// // // //       style={{
// // // //         background: tokens.colorBgContainer,
// // // //         borderColor: tokens.colorBorder,
// // // //         boxShadow: tokens.boxShadow,
// // // //         borderRadius: 12,
// // // //         minHeight: 250,
// // // //       }}
// // // //     >
// // // //       <div
// // // //         className="image-card-controls"
// // // //         style={{
// // // //           marginBottom: 8,
// // // //           display: "flex",
// // // //           gap: 8,
// // // //           flexWrap: "wrap",
// // // //           alignItems: "center",
// // // //         }}
// // // //       >
// // // //         {showDateSelection && (
// // // //           <DatePicker size="small" value={selectedDate} onChange={setSelectedDate} format="YYYY-MM-DD" />
// // // //         )}
// // // //         {showTimeSelection && (
// // // //           <TimePicker size="small" value={selectedTime} onChange={setSelectedTime} format="HH:mm" />
// // // //         )}
// // // //         <Segmented
// // // //           size="small"
// // // //           options={["Single", "Multiple"]}
// // // //           value={viewMode === "single" ? "Single" : "Multiple"}
// // // //           onChange={val => setViewMode(val.toLowerCase())}
// // // //         />
// // // //       </div>

// // // //       <Image.PreviewGroup
// // // //         preview={{
// // // //           visible: preview.visible,
// // // //           current: preview.index,
// // // //           onVisibleChange: vis => !vis && closePreview(),
// // // //           mask: <span style={{ color: "#fff", fontWeight: 600 }}>Click to Preview</span>,
// // // //           transitionName: "ant-fade",
// // // //         }}
// // // //       >
// // // //         {/* ---- MULTI-VIEW: Responsive Grid with Auto-Sized Thumbnails ---- */}
// // // //         {viewMode === "multiple" && (
// // // //           <div className="image-card-multiple-view" style={{ flexGrow: 1, width: "100%" }}>
// // // //             <div
// // // //               className="image-card-multi-grid"
// // // //               style={{
// // // //                 display: "grid",
// // // //                 gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
// // // //                 gap: 8,
// // // //                 width: "100%",
// // // //                 height: "100%",
// // // //                 alignItems: "stretch"
// // // //               }}
// // // //             >
// // // //               {snapshots.map((snapshot, index) => (
// // // //                 <div
// // // //                   key={snapshot.id || index}
// // // //                   style={{
// // // //                     width: "100%",
// // // //                     aspectRatio: "4 / 3",
// // // //                     position: "relative",
// // // //                     overflow: "hidden",
// // // //                     borderRadius: 10,
// // // //                     boxShadow: tokens.boxShadow,
// // // //                     background: tokens.colorBgElevated,
// // // //                     cursor: "pointer",
// // // //                     transition: "box-shadow .15s,transform .15s",
// // // //                     display: "flex",
// // // //                     flexDirection: "column",
// // // //                   }}
// // // //                   onClick={() => openPreviewAt(index)}
// // // //                   tabIndex={0}
// // // //                   className="image-card-thumb-outer"
// // // //                 >
// // // //                   <Image
// // // //                     src={snapshot.url}
// // // //                     alt={`Snapshot ${index + 1}`}
// // // //                     preview={false}
// // // //                     style={{
// // // //                       width: "100%",
// // // //                       height: "100%",
// // // //                       objectFit: "cover",
// // // //                       borderRadius: 10,
// // // //                       transition: "transform 0.22s cubic-bezier(.33,1.02,.55,.99)",
// // // //                       background: tokens.colorBgElevated,
// // // //                       display: "block"
// // // //                     }}
// // // //                   />
// // // //                   {/* Overlay */}
// // // //                   <div
// // // //                     className="image-card-thumbnail-overlay"
// // // //                     style={{
// // // //                       position: "absolute",
// // // //                       bottom: 0,
// // // //                       left: 0,
// // // //                       width: "100%",
// // // //                       background: isDarkMode
// // // //                         ? "rgba(16,16,16,0.72)"
// // // //                         : "rgba(255,255,255,0.83)",
// // // //                       color: isDarkMode ? "#fff" : "#222",
// // // //                       padding: "3px 9px 3px 8px",
// // // //                       fontSize: 12.5,
// // // //                       fontWeight: 500,
// // // //                       display: "flex",
// // // //                       justifyContent: "space-between",
// // // //                       alignItems: "center",
// // // //                       borderBottomLeftRadius: 10,
// // // //                       borderBottomRightRadius: 10,
// // // //                       minHeight: 22,
// // // //                       zIndex: 2,
// // // //                       boxSizing: "border-box"
// // // //                     }}
// // // //                   >
// // // //                     <Tooltip title={formatTime(snapshot.timestamp)}>
// // // //                       {snapshot.timestamp ? moment(snapshot.timestamp).format("HH:mm") : "--"}
// // // //                     </Tooltip>
// // // //                     <Tag
// // // //                       color={statusColor(snapshot.door_event_snapshot, tokens)}
// // // //                       icon={statusIcon(snapshot.door_event_snapshot)}
// // // //                       style={{
// // // //                         fontWeight: 600,
// // // //                         borderRadius: 5,
// // // //                         fontSize: 12,
// // // //                         marginRight: 0,
// // // //                         padding: "1px 7px",
// // // //                         minWidth: 60,
// // // //                         textAlign: "center"
// // // //                       }}
// // // //                     >
// // // //                       {snapshot.door_event_snapshot?.toUpperCase() || "?"}
// // // //                     </Tag>
// // // //                   </div>
// // // //                 </div>
// // // //               ))}
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {/* ---- SINGLE VIEW: Image Auto-Scales to Widget ---- */}
// // // //         {viewMode === "single" && currentSnapshot && (
// // // //           <div className="image-card-single-view"
// // // //             style={{
// // // //               flexGrow: 1,
// // // //               width: "100%",
// // // //               minHeight: 0,
// // // //               display: "flex",
// // // //               flexDirection: "column",
// // // //               alignItems: "center",
// // // //               justifyContent: "center"
// // // //             }}
// // // //           >
// // // //             <div className="image-card-image-wrapper"
// // // //               style={{
// // // //                 width: "100%",
// // // //                 height: "auto",
// // // //                 maxWidth: "100%",
// // // //                 aspectRatio: "4 / 3",
// // // //                 margin: "0 auto 10px auto",
// // // //                 boxShadow: tokens.boxShadow,
// // // //                 background: tokens.colorBgElevated,
// // // //                 borderRadius: 12,
// // // //                 position: "relative",
// // // //                 display: "flex",
// // // //                 alignItems: "center",
// // // //                 justifyContent: "center"
// // // //               }}
// // // //             >
// // // //               <Image
// // // //                 src={currentSnapshot.url || "/placeholder.svg"}
// // // //                 alt={currentSnapshot.filename || "Snapshot"}
// // // //                 className="image-card-main-image"
// // // //                 preview={false}
// // // //                 style={{
// // // //                   width: "100%",
// // // //                   height: "100%",
// // // //                   objectFit: "contain",
// // // //                   borderRadius: 12,
// // // //                   border: `1.5px solid ${tokens.colorBorder}`,
// // // //                   background: tokens.colorBgElevated,
// // // //                   cursor: "pointer",
// // // //                   transition: "box-shadow 0.22s cubic-bezier(.33,1.02,.55,.99), transform 0.18s cubic-bezier(.33,1.02,.55,.99)"
// // // //                 }}
// // // //                 onClick={() => openPreviewAt(currentSnapshotIndex)}
// // // //               />
// // // //               {snapshots.length > 1 && (
// // // //                 <div className="image-card-navigation" style={{
// // // //                   position: "absolute",
// // // //                   top: "50%",
// // // //                   width: "100%",
// // // //                   display: "flex",
// // // //                   justifyContent: "space-between",
// // // //                   zIndex: 3
// // // //                 }}>
// // // //                   <Button icon={<LeftOutlined />} onClick={handlePrev} shape="circle" size="small" />
// // // //                   <Button icon={<RightOutlined />} onClick={handleNext} shape="circle" size="small" />
// // // //                 </div>
// // // //               )}
// // // //               {currentSnapshot.door_event_snapshot && (
// // // //                 <Tag
// // // //                   color={statusColor(currentSnapshot.door_event_snapshot, tokens)}
// // // //                   icon={statusIcon(currentSnapshot.door_event_snapshot)}
// // // //                   style={{
// // // //                     position: "absolute",
// // // //                     top: 10,
// // // //                     left: 18,
// // // //                     zIndex: 3,
// // // //                     fontWeight: 600,
// // // //                     borderRadius: 6,
// // // //                     fontSize: 13,
// // // //                     padding: "2.5px 10px"
// // // //                   }}
// // // //                 >
// // // //                   {currentSnapshot.door_event_snapshot?.toUpperCase()}
// // // //                 </Tag>
// // // //               )}
// // // //             </div>
// // // //             {/* Metadata */}
// // // //             <Descriptions
// // // //               column={{ xs: 1, sm: 2, md: 2, lg: 3 }}
// // // //               size="small"
// // // //               className="image-card-metadata"
// // // //               style={{
// // // //                 marginTop: 7,
// // // //                 width: "100%",
// // // //                 maxWidth: 540,
// // // //                 padding: "7px 10px",
// // // //                 background: tokens.colorBgElevated,
// // // //                 borderRadius: 8,
// // // //                 color: tokens.colorText,
// // // //                 fontSize: "0.97em"
// // // //               }}
// // // //               labelStyle={{
// // // //                 color: tokens.colorTextSecondary,
// // // //                 fontWeight: 500
// // // //               }}
// // // //               contentStyle={{
// // // //                 color: tokens.colorText
// // // //               }}
// // // //             >
// // // //               <Descriptions.Item label="Date">{currentSnapshot.timestamp ? moment(currentSnapshot.timestamp).format("YYYY-MM-DD") : "--"}</Descriptions.Item>
// // // //               <Descriptions.Item label="Time">{currentSnapshot.timestamp ? moment(currentSnapshot.timestamp).format("HH:mm:ss") : "--"}</Descriptions.Item>
// // // //               {showEventType && currentSnapshot.eventType && (
// // // //                 <Descriptions.Item label="Event Type"><Text strong>{currentSnapshot.eventType}</Text></Descriptions.Item>
// // // //               )}
// // // //               {showCustomMetadata1 && customMetadata1Label && currentSnapshot.customMetadata1 && (
// // // //                 <Descriptions.Item label={customMetadata1Label}>{currentSnapshot.customMetadata1}</Descriptions.Item>
// // // //               )}
// // // //               {showCustomMetadata2 && customMetadata2Label && currentSnapshot.customMetadata2 && (
// // // //                 <Descriptions.Item label={customMetadata2Label}>{currentSnapshot.customMetadata2}</Descriptions.Item>
// // // //               )}
// // // //             </Descriptions>
// // // //           </div>
// // // //         )}
// // // //       </Image.PreviewGroup>

// // // //       {snapshots.length === 0 && (
// // // //         <div className="image-card-empty" style={{
// // // //           textAlign: "center",
// // // //           marginTop: 24,
// // // //           color: tokens.disabledText
// // // //         }}>
// // // //           <Text type="secondary">No snapshots available.</Text>
// // // //         </div>
// // // //       )}
// // // //     </Card>
// // // //   )
// // // // }

// // // // export default ImageCardWidget






// // // // // "use client"

// // // // // import React, { useState, useEffect, useRef } from "react"
// // // // // import { Card, Button, Segmented, Image, Row, Col, Descriptions, Typography, DatePicker, TimePicker, Spin } from "antd"
// // // // // import moment from "moment"
// // // // // import { LeftOutlined, RightOutlined } from "@ant-design/icons"
// // // // // import "../../../styles/image-card-widget.css"

// // // // // const { Text } = Typography

// // // // // const MAX_HISTORY = 10

// // // // // const ImageCardWidget = ({
// // // // //   config = {},
// // // // //   darkMode,
// // // // //   liveData, // expects a single JSON object, not array!
// // // // // }) => {
// // // // //   const {
// // // // //     title,
// // // // //     defaultViewMode,
// // // // //     showDateSelection,
// // // // //     showTimeSelection,
// // // // //     showEventType,
// // // // //     showCustomMetadata1,
// // // // //     customMetadata1Label,
// // // // //     showCustomMetadata2,
// // // // //     customMetadata2Label,
// // // // //     refreshInterval = 10,
// // // // //   } = config


// // // // //   // Keep up to last 10 images
// // // // //   const [snapshots, setSnapshots] = useState([])
// // // // //   const [currentSnapshotIndex, setCurrentSnapshotIndex] = useState(0)
// // // // //   const [selectedDate, setSelectedDate] = useState(moment())
// // // // //   const [selectedTime, setSelectedTime] = useState(moment())
// // // // //   const [viewMode, setViewMode] = useState(defaultViewMode || "single")
// // // // //   const prevKeyRef = useRef("")

// // // // //   // Add each new unique image to history
// // // // //   useEffect(() => {
// // // // //     if (!liveData) return

// // // // //     // unique key: url+timestamp, fallback to Date.now
// // // // //     const key =
// // // // //       (liveData.url || "") + "::" + (liveData.timestamp || "")

// // // // //     // If empty/fail, ignore
// // // // //     if (!liveData.url || liveData.door_event_snapshot === "fail") return

// // // // //     if (key !== prevKeyRef.current) {
// // // // //       prevKeyRef.current = key
// // // // //       const newSnap = {
// // // // //         id:
// // // // //           (liveData.snap_id || liveData.filename || liveData.url || key) +
// // // // //           "::" +
// // // // //           (liveData.timestamp || Date.now()),
// // // // //         url: liveData.url,
// // // // //         timestamp: liveData.timestamp,
// // // // //         filename: liveData.filename,
// // // // //         snap_id: liveData.snap_id,
// // // // //         snapshots_stored: liveData.snapshots_stored,
// // // // //         eventType: liveData.eventType,
// // // // //         customMetadata1: liveData.customMetadata1,
// // // // //         customMetadata2: liveData.customMetadata2,
// // // // //       }
// // // // //       setSnapshots((prev) => {
// // // // //         // No dups, always newest first
// // // // //         if (prev.length > 0 && prev[0].url === newSnap.url && prev[0].timestamp === newSnap.timestamp) return prev
// // // // //         return [newSnap, ...prev].slice(0, MAX_HISTORY)
// // // // //       })
// // // // //       setCurrentSnapshotIndex(0)
// // // // //     }
// // // // //     // eslint-disable-next-line
// // // // //   }, [liveData])

// // // // //   // Nav
// // // // //   const handlePrev = () => setCurrentSnapshotIndex((i) => (i === 0 ? snapshots.length - 1 : i - 1))
// // // // //   const handleNext = () => setCurrentSnapshotIndex((i) => (i === snapshots.length - 1 ? 0 : i + 1))

// // // // //   const currentSnapshot = snapshots[currentSnapshotIndex] || {}

// // // // //   return (
// // // // //     <Card
// // // // //       title={title}
// // // // //       className={`image-card-widget ${darkMode ? "dark-theme" : ""}`}
// // // // //       bodyStyle={{
// // // // //         height: "calc(100% - 56px)",
// // // // //         overflowY: "auto",
// // // // //         display: "flex",
// // // // //         flexDirection: "column",
// // // // //       }}
// // // // //     >
// // // // //       <div
// // // // //         className="image-card-controls"
// // // // //         style={{
// // // // //           marginBottom: 12,
// // // // //           display: "flex",
// // // // //           gap: 12,
// // // // //           flexWrap: "wrap",
// // // // //         }}
// // // // //       >
// // // // //         {showDateSelection && (
// // // // //           <DatePicker value={selectedDate} onChange={setSelectedDate} format="YYYY-MM-DD" />
// // // // //         )}
// // // // //         {showTimeSelection && (
// // // // //           <TimePicker value={selectedTime} onChange={setSelectedTime} format="HH:mm" />
// // // // //         )}
// // // // //         <Segmented
// // // // //           options={["Single", "Multiple"]}
// // // // //           value={viewMode === "single" ? "Single" : "Multiple"}
// // // // //           onChange={(value) => setViewMode(value.toLowerCase())}
// // // // //         />
// // // // //       </div>

// // // // //       {snapshots.length === 0 ? (
// // // // //         <div className="image-card-empty" style={{ textAlign: "center", marginTop: 40 }}>
// // // // //           <Text type="secondary">No snapshots available.</Text>
// // // // //         </div>
// // // // //       ) : (
// // // // //         <>
// // // // //           {/* Single Image View */}
// // // // //           {viewMode === "single" && currentSnapshot && (
// // // // //             <div className="image-card-single-view" style={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
// // // // //               <div className="image-card-image-wrapper" style={{ position: "relative" }}>
// // // // //                 <Image
// // // // //                   src={currentSnapshot.url || "/placeholder.svg"}
// // // // //                   alt={currentSnapshot.filename || "Snapshot"}
// // // // //                   className="image-card-main-image"
// // // // //                   preview={!!currentSnapshot.url}
// // // // //                   style={{ maxHeight: 360, objectFit: "contain" }}
// // // // //                 />
// // // // //                 {snapshots.length > 1 && (
// // // // //                   <div className="image-card-navigation" style={{ position: "absolute", top: "50%", width: "100%", display: "flex", justifyContent: "space-between" }}>
// // // // //                     <Button icon={<LeftOutlined />} onClick={handlePrev} shape="circle" />
// // // // //                     <Button icon={<RightOutlined />} onClick={handleNext} shape="circle" />
// // // // //                   </div>
// // // // //                 )}
// // // // //               </div>
// // // // //               <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 3 }} size="small" className="image-card-metadata" style={{ marginTop: 12, width: "100%" }}>
// // // // //                 <Descriptions.Item label="Date">{currentSnapshot.timestamp ? moment(currentSnapshot.timestamp).format("YYYY-MM-DD") : "--"}</Descriptions.Item>
// // // // //                 <Descriptions.Item label="Time">{currentSnapshot.timestamp ? moment(currentSnapshot.timestamp).format("HH:mm:ss") : "--"}</Descriptions.Item>
// // // // //                 {showEventType && currentSnapshot.eventType && (
// // // // //                   <Descriptions.Item label="Event Type"><Text strong>{currentSnapshot.eventType}</Text></Descriptions.Item>
// // // // //                 )}
// // // // //                 {showCustomMetadata1 && customMetadata1Label && currentSnapshot.customMetadata1 && (
// // // // //                   <Descriptions.Item label={customMetadata1Label}>{currentSnapshot.customMetadata1}</Descriptions.Item>
// // // // //                 )}
// // // // //                 {showCustomMetadata2 && customMetadata2Label && currentSnapshot.customMetadata2 && (
// // // // //                   <Descriptions.Item label={customMetadata2Label}>{currentSnapshot.customMetadata2}</Descriptions.Item>
// // // // //                 )}
// // // // //               </Descriptions>
// // // // //             </div>
// // // // //           )}

// // // // //           {/* Multiple Images/Thumbnails */}
// // // // //           {viewMode === "multiple" && (
// // // // //             <div className="image-card-multiple-view" style={{ flexGrow: 1 }}>
// // // // //               <Row gutter={[16, 16]}>
// // // // //                 {snapshots.map((snapshot, index) => (
// // // // //                   <Col xs={24} sm={12} md={8} lg={6} key={snapshot.id || index}>
// // // // //                     <div className="image-card-thumbnail-wrapper" style={{ position: "relative" }}>
// // // // //                       <Image
// // // // //                         src={snapshot.url || "/placeholder.svg"}
// // // // //                         alt={`Snapshot ${index + 1}`}
// // // // //                         className="image-card-thumbnail-image"
// // // // //                         preview={!!snapshot.url}
// // // // //                         style={{ maxHeight: 140, objectFit: "cover", width: "100%" }}
// // // // //                       />
// // // // //                       <div
// // // // //                         className="image-card-thumbnail-overlay"
// // // // //                         style={{
// // // // //                           position: "absolute",
// // // // //                           bottom: 0,
// // // // //                           left: 0,
// // // // //                           width: "100%",
// // // // //                           background: darkMode ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)",
// // // // //                           color: darkMode ? "#fff" : "#000",
// // // // //                           padding: "4px 8px",
// // // // //                           fontSize: 12,
// // // // //                           fontWeight: "bold",
// // // // //                           display: "flex",
// // // // //                           justifyContent: "space-between",
// // // // //                         }}
// // // // //                       >
// // // // //                         <Text>
// // // // //                           {snapshot.timestamp ? moment(snapshot.timestamp).format("HH:mm") : "--"}
// // // // //                         </Text>
// // // // //                         {showEventType && snapshot.eventType && <Text>{snapshot.eventType}</Text>}
// // // // //                       </div>
// // // // //                     </div>
// // // // //                   </Col>
// // // // //                 ))}
// // // // //               </Row>
// // // // //             </div>
// // // // //           )}
// // // // //         </>
// // // // //       )}
// // // // //     </Card>
// // // // //   )
// // // // // }

// // // // // export default ImageCardWidget


// // // // // "use client"

// // // // // import { useState, useEffect, useCallback } from "react"
// // // // // import { Card, Spin, Typography, DatePicker, TimePicker, Button, Segmented, Image, Row, Col, Descriptions } from "antd"
// // // // // import moment from "moment"
// // // // // import { LeftOutlined, RightOutlined } from "@ant-design/icons"
// // // // // import "../../../styles/image-card-widget.css"

// // // // // const { Title, Text } = Typography

// // // // // const ImageCardWidget = ({
// // // // //   config,
// // // // //   darkMode,
// // // // //   liveData, // Optional: pass live snapshots data to update real-time
// // // // // }) => {
// // // // //   const {
// // // // //     title,
// // // // //     snapshotBaseUrl,
// // // // //     defaultViewMode,
// // // // //     showDateSelection,
// // // // //     showTimeSelection,
// // // // //     showEventType,
// // // // //     showCustomMetadata1,
// // // // //     customMetadata1Label,
// // // // //     showCustomMetadata2,
// // // // //     customMetadata2Label,
// // // // //     refreshInterval = 10,
// // // // //   } = config

// // // // //   const [currentSnapshots, setCurrentSnapshots] = useState([])
// // // // //   const [currentSnapshotIndex, setCurrentSnapshotIndex] = useState(0)
// // // // //   const [selectedDate, setSelectedDate] = useState(moment())
// // // // //   const [selectedTime, setSelectedTime] = useState(moment())
// // // // //   const [viewMode, setViewMode] = useState(defaultViewMode || "single")
// // // // //   const [isLoading, setIsLoading] = useState(false)

// // // // //   // Generate mock snapshots with real JPG URLs from Unsplash (or use snapshotBaseUrl param)
// // // // //   const generateMockSnapshots = useCallback(
// // // // //     (date, time, count = 5) => {
// // // // //       const snapshots = []
// // // // //       const baseTimestamp = date.clone().hour(time.hour()).minute(time.minute()).second(time.second())

// // // // //       // Sample event types and metadata
// // // // //       const eventTypes = ["Motion Detected", "Door Opened", "Temperature Anomaly", "System Alert", "Manual Capture"]
// // // // //       const locations = ["Main Entrance", "Server Room", "Warehouse A", "Loading Dock", "Office Area"]
// // // // //       const sensorIds = ["SNSR-001", "SNSR-002", "SNSR-003", "SNSR-004", "SNSR-005"]

// // // // //       // A small pool of public image URLs from Unsplash as placeholders
// // // // //       const unsplashImages = [
// // // // //         "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
// // // // //         "https://images.unsplash.com/photo-1516116216624-53e697fedbe2?auto=format&fit=crop&w=600&q=80",
// // // // //         "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=600&q=80",
// // // // //         "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=600&q=80",
// // // // //         "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=600&q=80"
// // // // //       ]

// // // // //       for (let i = 0; i < count; i++) {
// // // // //         const timestamp = baseTimestamp.clone().subtract(i * 5, "minutes") // Snapshots every 5 minutes

// // // // //         // Use snapshotBaseUrl if provided, else pick from Unsplash pool
// // // // //         const url = snapshotBaseUrl
// // // // //           ? `${snapshotBaseUrl}?height=200&width=300&text=Snap%20${i + 1}%20${timestamp.format("HH:mm")}&r=${Math.random()}`
// // // // //           : unsplashImages[i % unsplashImages.length] + `&r=${Math.random()}`

// // // // //         snapshots.push({
// // // // //           id: `snap_${timestamp.valueOf()}_${i}`,
// // // // //           url,
// // // // //           timestamp: timestamp.toDate(),
// // // // //           eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
// // // // //           customMetadata1: locations[Math.floor(Math.random() * locations.length)],
// // // // //           customMetadata2: sensorIds[Math.floor(Math.random() * sensorIds.length)],
// // // // //         })
// // // // //       }
// // // // //       // Sort newest first
// // // // //       return snapshots.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
// // // // //     },
// // // // //     [snapshotBaseUrl],
// // // // //   )

// // // // //   // Fetch snapshots from mock or use live data
// // // // //   const fetchSnapshots = useCallback(async () => {
// // // // //     setIsLoading(true)

// // // // //     if (liveData && Array.isArray(liveData) && liveData.length > 0) {
// // // // //       // If live data is provided as prop, update snapshots directly
// // // // //       setCurrentSnapshots(liveData)
// // // // //       setCurrentSnapshotIndex(0)
// // // // //       setIsLoading(false)
// // // // //       return
// // // // //     }

// // // // //     // Simulate API delay
// // // // //     await new Promise((resolve) => setTimeout(resolve, 800))

// // // // //     // Otherwise generate mock snapshots
// // // // //     const snapshots = generateMockSnapshots(selectedDate, selectedTime, viewMode === "single" ? 1 : 5)
// // // // //     setCurrentSnapshots(snapshots)
// // // // //     setCurrentSnapshotIndex(0)
// // // // //     setIsLoading(false)
// // // // //   }, [selectedDate, selectedTime, viewMode, generateMockSnapshots, liveData])

// // // // //   // Fetch snapshots on mount and when dependencies change
// // // // //   useEffect(() => {
// // // // //     fetchSnapshots()
// // // // //     const interval = setInterval(fetchSnapshots, refreshInterval * 1000)
// // // // //     return () => clearInterval(interval)
// // // // //   }, [fetchSnapshots, refreshInterval])

// // // // //   const handleDateChange = (date) => setSelectedDate(date)
// // // // //   const handleTimeChange = (time) => setSelectedTime(time)
// // // // //   const handlePrev = () => setCurrentSnapshotIndex((prev) => (prev === 0 ? currentSnapshots.length - 1 : prev - 1))
// // // // //   const handleNext = () => setCurrentSnapshotIndex((prev) => (prev === currentSnapshots.length - 1 ? 0 : prev + 1))

// // // // //   const currentSnapshot = currentSnapshots[currentSnapshotIndex]

// // // // //   return (
// // // // //     <Card
// // // // //       title={title}
// // // // //       className={`image-card-widget ${darkMode ? "dark-theme" : ""}`}
// // // // //       bodyStyle={{ height: "calc(100% - 56px)", overflowY: "auto", display: "flex", flexDirection: "column" }}
// // // // //     >
// // // // //       <div className="image-card-controls" style={{ marginBottom: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
// // // // //         {showDateSelection && (
// // // // //           <DatePicker value={selectedDate} onChange={handleDateChange} format="YYYY-MM-DD" />
// // // // //         )}
// // // // //         {showTimeSelection && (
// // // // //           <TimePicker value={selectedTime} onChange={handleTimeChange} format="HH:mm" />
// // // // //         )}
// // // // //         <Segmented
// // // // //           options={["Single", "Multiple"]}
// // // // //           value={viewMode === "single" ? "Single" : "Multiple"}
// // // // //           onChange={(value) => setViewMode(value.toLowerCase())}
// // // // //         />
// // // // //       </div>

// // // // //       {isLoading ? (
// // // // //         <div className="image-card-loading" style={{ flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
// // // // //           <Spin size="large" tip="Loading snapshots..." />
// // // // //         </div>
// // // // //       ) : currentSnapshots.length === 0 ? (
// // // // //         <div className="image-card-empty" style={{ textAlign: "center", marginTop: 40 }}>
// // // // //           <Text type="secondary">No snapshots available for the selected time.</Text>
// // // // //         </div>
// // // // //       ) : (
// // // // //         <>
// // // // //           {viewMode === "single" && currentSnapshot && (
// // // // //             <div className="image-card-single-view" style={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
// // // // //               <div className="image-card-image-wrapper" style={{ position: "relative" }}>
// // // // //                 <Image
// // // // //                   src={currentSnapshot.url || "/placeholder.svg"}
// // // // //                   alt="Snapshot"
// // // // //                   className="image-card-main-image"
// // // // //                   preview={false}
// // // // //                   style={{ maxHeight: 360, objectFit: "contain" }}
// // // // //                 />
// // // // //                 {currentSnapshots.length > 1 && (
// // // // //                   <div className="image-card-navigation" style={{ position: "absolute", top: "50%", width: "100%", display: "flex", justifyContent: "space-between" }}>
// // // // //                     <Button icon={<LeftOutlined />} onClick={handlePrev} shape="circle" />
// // // // //                     <Button icon={<RightOutlined />} onClick={handleNext} shape="circle" />
// // // // //                   </div>
// // // // //                 )}
// // // // //               </div>
// // // // //               <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 3 }} size="small" className="image-card-metadata" style={{ marginTop: 12, width: "100%" }}>
// // // // //                 <Descriptions.Item label="Date">{moment(currentSnapshot.timestamp).format("YYYY-MM-DD")}</Descriptions.Item>
// // // // //                 <Descriptions.Item label="Time">{moment(currentSnapshot.timestamp).format("HH:mm:ss")}</Descriptions.Item>
// // // // //                 {showEventType && <Descriptions.Item label="Event Type"><Text strong>{currentSnapshot.eventType}</Text></Descriptions.Item>}
// // // // //                 {showCustomMetadata1 && customMetadata1Label && <Descriptions.Item label={customMetadata1Label}>{currentSnapshot.customMetadata1}</Descriptions.Item>}
// // // // //                 {showCustomMetadata2 && customMetadata2Label && <Descriptions.Item label={customMetadata2Label}>{currentSnapshot.customMetadata2}</Descriptions.Item>}
// // // // //               </Descriptions>
// // // // //             </div>
// // // // //           )}

// // // // //           {viewMode === "multiple" && (
// // // // //             <div className="image-card-multiple-view" style={{ flexGrow: 1 }}>
// // // // //               <Row gutter={[16, 16]}>
// // // // //                 {currentSnapshots.map((snapshot, index) => (
// // // // //                   <Col xs={24} sm={12} md={8} lg={6} key={snapshot.id}>
// // // // //                     <div className="image-card-thumbnail-wrapper" style={{ position: "relative" }}>
// // // // //                       <Image
// // // // //                         src={snapshot.url || "/placeholder.svg"}
// // // // //                         alt={`Snapshot ${index + 1}`}
// // // // //                         className="image-card-thumbnail-image"
// // // // //                         preview={false}
// // // // //                         style={{ maxHeight: 140, objectFit: "cover", width: "100%" }}
// // // // //                       />
// // // // //                       <div className="image-card-thumbnail-overlay" style={{
// // // // //                         position: "absolute",
// // // // //                         bottom: 0,
// // // // //                         left: 0,
// // // // //                         width: "100%",
// // // // //                         background: darkMode ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)",
// // // // //                         color: darkMode ? "#fff" : "#000",
// // // // //                         padding: "4px 8px",
// // // // //                         fontSize: 12,
// // // // //                         fontWeight: "bold",
// // // // //                         display: "flex",
// // // // //                         justifyContent: "space-between",
// // // // //                       }}>
// // // // //                         <Text>{moment(snapshot.timestamp).format("HH:mm")}</Text>
// // // // //                         {showEventType && <Text>{snapshot.eventType}</Text>}
// // // // //                       </div>
// // // // //                     </div>
// // // // //                   </Col>
// // // // //                 ))}
// // // // //               </Row>
// // // // //             </div>
// // // // //           )}
// // // // //         </>
// // // // //       )}
// // // // //     </Card>
// // // // //   )
// // // // // }

// // // // // export default ImageCardWidget
