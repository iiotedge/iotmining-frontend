// "use client"

// import { useState, useEffect, useRef } from "react"
// import {
//   Card,
//   Select,
//   Input,
//   Button,
//   Space,
//   Slider,
//   Switch,
//   Tabs,
//   Badge,
//   Modal,
//   Form,
//   InputNumber,
//   Radio,
//   Divider,
//   Typography,
//   notification,
//   Spin,
// } from "antd"
// import {
//   PlayCircleOutlined,
//   PauseCircleOutlined,
//   FullscreenOutlined,
//   SettingOutlined,
//   ReloadOutlined,
//   LeftOutlined,
//   RightOutlined,
//   SyncOutlined,
//   BellOutlined,
//   WarningOutlined,
//   DownloadOutlined,
//   CameraOutlined,
//   EyeOutlined,
//   ClockCircleOutlined,
//   CalendarOutlined,
//   LockOutlined,
//   UnlockOutlined,
//   ZoomInOutlined,
//   ZoomOutOutlined,
//   AudioMutedOutlined,
//   AudioOutlined,
//   VideoCameraOutlined,
//   UpOutlined,
//   DownOutlined,
// } from "@ant-design/icons"
// import dayjs from "dayjs"
// import Hls from "hls.js"
// import CameraAlertConfig from "./CameraAlertConfig"

// const { TabPane } = Tabs
// const { Option } = Select
// const { Title, Text } = Typography

// const CameraWidget = ({ config, theme = "light" }) => {
//   const videoRef = useRef(null)
//   const hlsRef = useRef(null)
//   const canvasRef = useRef(null)
//   const [isPlaying, setIsPlaying] = useState(true)
//   const [isFullscreen, setIsFullscreen] = useState(false)
//   const [volume, setVolume] = useState(50)
//   const [isMuted, setIsMuted] = useState(true)
//   const [currentTime, setCurrentTime] = useState(0)
//   const [duration, setDuration] = useState(0)
//   const [isLive, setIsLive] = useState(true)
//   const [isLoading, setIsLoading] = useState(true)
//   const [isSettingsVisible, setIsSettingsVisible] = useState(false)
//   const [isAlertConfigVisible, setIsAlertConfigVisible] = useState(false)
//   const [activeTab, setActiveTab] = useState("live")
//   const [zoomLevel, setZoomLevel] = useState(1)
//   const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
//   const [isRecording, setIsRecording] = useState(false)
//   const [recordingTime, setRecordingTime] = useState(0)
//   const [recordingInterval, setRecordingInterval] = useState(null)
//   const [snapshotData, setSnapshotData] = useState(null)
//   const [isSnapshotModalVisible, setIsSnapshotModalVisible] = useState(false)
//   const [alertStatus, setAlertStatus] = useState({
//     motion: false,
//     object: false,
//     custom: false,
//   })
//   const [alertHistory, setAlertHistory] = useState([])
//   const [selectedDate, setSelectedDate] = useState(dayjs())
//   const [timelineData, setTimelineData] = useState([])
//   const [selectedProtocol, setSelectedProtocol] = useState(config?.protocol || "hls")
//   const [streamUrl, setStreamUrl] = useState(config?.streamUrl || "")
//   const [deviceId, setDeviceId] = useState(config?.deviceId || "")
//   const [isConnected, setIsConnected] = useState(false)
//   const [ptzEnabled, setPtzEnabled] = useState(config?.ptzEnabled || false)
//   const [isControlLocked, setIsControlLocked] = useState(false)
//   const [activeAlerts, setActiveAlerts] = useState([])

//   // Initialize camera stream
//   useEffect(() => {
//     if (!streamUrl && !deviceId) return

//     setIsLoading(true)
//     connectToStream()

//     return () => {
//       disconnectStream()
//     }
//   }, [streamUrl, deviceId, selectedProtocol])

//   // Generate mock timeline data
//   useEffect(() => {
//     const generateMockTimelineData = () => {
//       const data = []
//       const now = dayjs()
//       const startOfDay = now.startOf("day")

//       // Generate 5-10 recording segments
//       const numSegments = Math.floor(Math.random() * 6) + 5

//       for (let i = 0; i < numSegments; i++) {
//         const startHour = Math.floor(Math.random() * 24)
//         const startMinute = Math.floor(Math.random() * 60)
//         const durationMinutes = Math.floor(Math.random() * 30) + 10

//         const start = startOfDay.add(startHour, "hour").add(startMinute, "minute")
//         const end = start.add(durationMinutes, "minute")

//         // Add some motion events within the recording
//         const hasMotion = Math.random() > 0.3
//         const hasObject = Math.random() > 0.7

//         data.push({
//           id: `rec-${i}`,
//           type: "recording",
//           start: start.valueOf(),
//           end: end.valueOf(),
//           events: {
//             motion: hasMotion,
//             object: hasObject,
//           },
//         })

//         // Add some individual events
//         if (hasMotion) {
//           const motionTime = start.add(Math.floor(Math.random() * durationMinutes), "minute")
//           data.push({
//             id: `motion-${i}`,
//             type: "motion",
//             time: motionTime.valueOf(),
//           })
//         }

//         if (hasObject) {
//           const objectTime = start.add(Math.floor(Math.random() * durationMinutes), "minute")
//           data.push({
//             id: `object-${i}`,
//             type: "object",
//             time: objectTime.valueOf(),
//             objectType: Math.random() > 0.5 ? "person" : "vehicle",
//           })
//         }
//       }

//       return data.sort((a, b) => {
//         const timeA = a.time || a.start
//         const timeB = b.time || b.start
//         return timeA - timeB
//       })
//     }

//     setTimelineData(generateMockTimelineData())

//     // Generate some mock alerts
//     const mockAlerts = [
//       {
//         id: "alert-1",
//         type: "motion",
//         time: dayjs().subtract(5, "minute").valueOf(),
//         message: "Motion detected in entrance area",
//         severity: "medium",
//         acknowledged: false,
//       },
//       {
//         id: "alert-2",
//         type: "object",
//         time: dayjs().subtract(20, "minute").valueOf(),
//         message: "Person detected in restricted area",
//         severity: "high",
//         acknowledged: true,
//       },
//       {
//         id: "alert-3",
//         type: "custom",
//         time: dayjs().subtract(2, "hour").valueOf(),
//         message: "Camera connection lost",
//         severity: "critical",
//         acknowledged: true,
//       },
//     ]

//     setAlertHistory(mockAlerts)

//     // Set some active alerts
//     setActiveAlerts([mockAlerts[0]])
//   }, [selectedDate])

//   // Connect to camera stream
//   const connectToStream = () => {
//     if (!videoRef.current) return

//     // Simulate connection delay
//     setTimeout(() => {
//       // For demo purposes, we'll just show a static image or demo video
//       if (selectedProtocol === "hls" && Hls.isSupported()) {
//         // Use HLS.js for HLS streams
//         if (hlsRef.current) {
//           hlsRef.current.destroy()
//         }

//         const hls = new Hls({
//           debug: false,
//           enableWorker: true,
//         })

//         // For demo, use a sample HLS stream
//         // In production, this would be the actual stream URL
//         const demoHlsUrl = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"

//         hls.loadSource(demoHlsUrl)
//         hls.attachMedia(videoRef.current)

//         hls.on(Hls.Events.MANIFEST_PARSED, () => {
//           if (isPlaying) {
//             videoRef.current.play().catch((error) => {
//               console.error("Error playing video:", error)
//             })
//           }
//           setIsLoading(false)
//           setIsConnected(true)
//         })

//         hls.on(Hls.Events.ERROR, (event, data) => {
//           console.error("HLS error:", data)
//           if (data.fatal) {
//             switch (data.type) {
//               case Hls.ErrorTypes.NETWORK_ERROR:
//                 hls.startLoad()
//                 break
//               case Hls.ErrorTypes.MEDIA_ERROR:
//                 hls.recoverMediaError()
//                 break
//               default:
//                 disconnectStream()
//                 break
//             }
//           }
//         })

//         hlsRef.current = hls
//       } else if (selectedProtocol === "webrtc") {
//         // WebRTC would be implemented here
//         // For demo, we'll use a video element with a sample video
//         videoRef.current.src = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
//         videoRef.current.play().catch((error) => {
//           console.error("Error playing video:", error)
//         })
//         setIsLoading(false)
//         setIsConnected(true)
//       } else if (selectedProtocol === "rtsp") {
//         // RTSP would typically require a proxy server
//         // For demo, we'll use a video element with a sample video
//         videoRef.current.src = "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
//         videoRef.current.play().catch((error) => {
//           console.error("Error playing video:", error)
//         })
//         setIsLoading(false)
//         setIsConnected(true)
//       } else if (selectedProtocol === "mjpeg") {
//         // MJPEG would typically use an img tag with a constantly refreshing src
//         // For demo, we'll use a video element with a sample video
//         videoRef.current.src = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
//         videoRef.current.play().catch((error) => {
//           console.error("Error playing video:", error)
//         })
//         setIsLoading(false)
//         setIsConnected(true)
//       }
//     }, 1500)
//   }

//   // Disconnect from camera stream
//   const disconnectStream = () => {
//     if (hlsRef.current) {
//       hlsRef.current.destroy()
//       hlsRef.current = null
//     }

//     if (videoRef.current) {
//       videoRef.current.pause()
//       videoRef.current.src = ""
//       videoRef.current.load()
//     }

//     setIsConnected(false)
//   }

//   // Handle play/pause
//   const togglePlay = () => {
//     if (!videoRef.current) return

//     if (isPlaying) {
//       videoRef.current.pause()
//     } else {
//       videoRef.current.play().catch((error) => {
//         console.error("Error playing video:", error)
//       })
//     }

//     setIsPlaying(!isPlaying)
//   }

//   // Handle fullscreen
//   const toggleFullscreen = () => {
//     if (!videoRef.current) return

//     if (!isFullscreen) {
//       if (videoRef.current.requestFullscreen) {
//         videoRef.current.requestFullscreen()
//       } else if (videoRef.current.webkitRequestFullscreen) {
//         videoRef.current.webkitRequestFullscreen()
//       } else if (videoRef.current.msRequestFullscreen) {
//         videoRef.current.msRequestFullscreen()
//       }
//     } else {
//       if (document.exitFullscreen) {
//         document.exitFullscreen()
//       } else if (document.webkitExitFullscreen) {
//         document.webkitExitFullscreen()
//       } else if (document.msExitFullscreen) {
//         document.msExitFullscreen()
//       }
//     }

//     setIsFullscreen(!isFullscreen)
//   }

//   // Handle volume change
//   const handleVolumeChange = (value) => {
//     if (!videoRef.current) return

//     setVolume(value)
//     videoRef.current.volume = value / 100

//     if (value === 0) {
//       setIsMuted(true)
//     } else if (isMuted) {
//       setIsMuted(false)
//     }
//   }

//   // Handle mute toggle
//   const toggleMute = () => {
//     if (!videoRef.current) return

//     videoRef.current.muted = !isMuted
//     setIsMuted(!isMuted)
//   }

//   // Handle time update
//   const handleTimeUpdate = () => {
//     if (!videoRef.current) return

//     setCurrentTime(videoRef.current.currentTime)

//     if (isLive && !isPlaying) {
//       setIsLive(false)
//     }
//   }

//   // Handle duration change
//   const handleDurationChange = () => {
//     if (!videoRef.current) return

//     setDuration(videoRef.current.duration)
//   }

//   // Handle seeking
//   const handleSeek = (value) => {
//     if (!videoRef.current) return

//     videoRef.current.currentTime = value
//     setCurrentTime(value)

//     if (value < duration - 5) {
//       setIsLive(false)
//     } else {
//       setIsLive(true)
//     }
//   }

//   // Go to live
//   const goToLive = () => {
//     if (!videoRef.current || !duration) return

//     videoRef.current.currentTime = duration
//     setCurrentTime(duration)
//     setIsLive(true)

//     if (!isPlaying) {
//       videoRef.current.play().catch((error) => {
//         console.error("Error playing video:", error)
//       })
//       setIsPlaying(true)
//     }
//   }

//   // Handle zoom
//   const handleZoom = (direction) => {
//     if (direction === "in") {
//       setZoomLevel(Math.min(zoomLevel + 0.1, 3))
//     } else {
//       setZoomLevel(Math.max(zoomLevel - 0.1, 1))
//     }
//   }

//   // Handle pan
//   const handlePan = (direction) => {
//     const step = 10

//     switch (direction) {
//       case "up":
//         setPanPosition({ ...panPosition, y: panPosition.y + step })
//         break
//       case "down":
//         setPanPosition({ ...panPosition, y: panPosition.y - step })
//         break
//       case "left":
//         setPanPosition({ ...panPosition, x: panPosition.x + step })
//         break
//       case "right":
//         setPanPosition({ ...panPosition, x: panPosition.x - step })
//         break
//       default:
//         break
//     }
//   }

//   // Reset pan and zoom
//   const resetView = () => {
//     setZoomLevel(1)
//     setPanPosition({ x: 0, y: 0 })
//   }

//   // Take snapshot
//   const takeSnapshot = () => {
//     if (!videoRef.current || !canvasRef.current) return

//     const video = videoRef.current
//     const canvas = canvasRef.current

//     canvas.width = video.videoWidth
//     canvas.height = video.videoHeight

//     const ctx = canvas.getContext("2d")
//     ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

//     const dataUrl = canvas.toDataURL("image/png")
//     setSnapshotData(dataUrl)
//     setIsSnapshotModalVisible(true)
//   }

//   // Download snapshot
//   const downloadSnapshot = () => {
//     if (!snapshotData) return

//     const link = document.createElement("a")
//     link.href = snapshotData
//     link.download = `camera-snapshot-${dayjs().format("YYYY-MM-DD-HH-mm-ss")}.png`
//     link.click()
//   }

//   // Toggle recording
//   const toggleRecording = () => {
//     if (isRecording) {
//       // Stop recording
//       if (recordingInterval) {
//         clearInterval(recordingInterval)
//         setRecordingInterval(null)
//       }

//       notification.success({
//         message: "Recording Stopped",
//         description: `Recording saved (${formatTime(recordingTime)})`,
//         placement: "bottomRight",
//       })

//       setIsRecording(false)
//       setRecordingTime(0)
//     } else {
//       // Start recording
//       setIsRecording(true)
//       setRecordingTime(0)

//       const interval = setInterval(() => {
//         setRecordingTime((prev) => prev + 1)
//       }, 1000)

//       setRecordingInterval(interval)

//       notification.info({
//         message: "Recording Started",
//         description: "Camera recording in progress",
//         placement: "bottomRight",
//         duration: 3,
//       })
//     }
//   }

//   // Format time (seconds to MM:SS)
//   const formatTime = (seconds) => {
//     const minutes = Math.floor(seconds / 60)
//     const remainingSeconds = Math.floor(seconds % 60)
//     return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
//   }

//   // Handle PTZ control
//   const handlePtzControl = (direction) => {
//     if (!ptzEnabled || isControlLocked) return

//     // In a real implementation, this would send commands to the camera
//     console.log(`PTZ control: ${direction}`)

//     notification.info({
//       message: "Camera Movement",
//       description: `Moving camera ${direction}`,
//       placement: "bottomRight",
//       duration: 1,
//     })
//   }

//   // Toggle control lock
//   const toggleControlLock = () => {
//     setIsControlLocked(!isControlLocked)

//     notification.info({
//       message: isControlLocked ? "Controls Unlocked" : "Controls Locked",
//       placement: "bottomRight",
//       duration: 2,
//     })
//   }

//   // Handle alert configuration
//   const handleAlertConfigSave = (config) => {
//     // In a real implementation, this would save the alert configuration
//     console.log("Alert configuration saved:", config)

//     notification.success({
//       message: "Alert Configuration Saved",
//       description: "Camera alert settings have been updated",
//       placement: "bottomRight",
//     })

//     setIsAlertConfigVisible(false)
//   }

//   // Acknowledge alert
//   const acknowledgeAlert = (alertId) => {
//     setAlertHistory((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert)))

//     setActiveAlerts((prev) => prev.filter((alert) => alert.id !== alertId))

//     notification.success({
//       message: "Alert Acknowledged",
//       description: "The alert has been acknowledged",
//       placement: "bottomRight",
//     })
//   }

//   // Render timeline
//   const renderTimeline = () => {
//     const hoursInDay = 24
//     const hourWidth = 100
//     const totalWidth = hoursInDay * hourWidth

//     return (
//       <div className="camera-timeline">
//         <div className="timeline-header">
//           {Array.from({ length: hoursInDay }).map((_, i) => (
//             <div key={i} className="timeline-hour" style={{ width: hourWidth }}>
//               {i.toString().padStart(2, "0")}:00
//             </div>
//           ))}
//         </div>

//         <div className="timeline-content" style={{ width: totalWidth }}>
//           {timelineData
//             .filter((item) => item.type === "recording")
//             .map((recording) => {
//               const startHour = dayjs(recording.start).hour() + dayjs(recording.start).minute() / 60
//               const endHour = dayjs(recording.end).hour() + dayjs(recording.end).minute() / 60
//               const durationHours = endHour - startHour

//               return (
//                 <div
//                   key={recording.id}
//                   className="timeline-recording"
//                   style={{
//                     left: `${startHour * hourWidth}px`,
//                     width: `${durationHours * hourWidth}px`,
//                   }}
//                   onClick={() => {
//                     // In a real implementation, this would seek to the recording
//                     notification.info({
//                       message: "Playback",
//                       description: `Playing recording from ${dayjs(recording.start).format("HH:mm")}`,
//                       placement: "bottomRight",
//                     })
//                   }}
//                 >
//                   {recording.events.motion && <div className="timeline-event motion"></div>}
//                   {recording.events.object && <div className="timeline-event object"></div>}
//                 </div>
//               )
//             })}

//           {timelineData
//             .filter((item) => item.type === "motion" || item.type === "object")
//             .map((event) => {
//               const eventHour = dayjs(event.time).hour() + dayjs(event.time).minute() / 60

//               return (
//                 <div
//                   key={event.id}
//                   className={`timeline-event-marker ${event.type}`}
//                   style={{
//                     left: `${eventHour * hourWidth}px`,
//                   }}
//                   title={`${event.type} at ${dayjs(event.time).format("HH:mm")}`}
//                 />
//               )
//             })}

//           <div
//             className="timeline-current-time"
//             style={{
//               left: `${(dayjs().hour() + dayjs().minute() / 60) * hourWidth}px`,
//             }}
//           />
//         </div>

//         <div className="timeline-scroll">
//           <Slider
//             min={0}
//             max={24}
//             step={0.25}
//             defaultValue={dayjs().hour()}
//             tooltipVisible={false}
//             onChange={(value) => {
//               // In a real implementation, this would scroll the timeline
//               console.log(`Scrolling to hour: ${value}`)
//             }}
//           />
//         </div>
//       </div>
//     )
//   }

//   // Render alerts tab
//   const renderAlertsTab = () => {
//     return (
//       <div className="camera-alerts-tab">
//         <div className="alerts-header">
//           <Title level={5}>Alert History</Title>
//           <Button type="primary" icon={<SettingOutlined />} onClick={() => setIsAlertConfigVisible(true)}>
//             Configure Alerts
//           </Button>
//         </div>

//         {activeAlerts.length > 0 && (
//           <div className="active-alerts">
//             <Title level={5}>Active Alerts</Title>
//             {activeAlerts.map((alert) => (
//               <div key={alert.id} className={`alert-item active ${alert.severity}`}>
//                 <div className="alert-icon">
//                   {alert.type === "motion" ? (
//                     <VideoCameraOutlined />
//                   ) : alert.type === "object" ? (
//                     <EyeOutlined />
//                   ) : (
//                     <WarningOutlined />
//                   )}
//                 </div>
//                 <div className="alert-content">
//                   <div className="alert-message">{alert.message}</div>
//                   <div className="alert-time">{dayjs(alert.time).format("HH:mm:ss")}</div>
//                 </div>
//                 <Button size="small" onClick={() => acknowledgeAlert(alert.id)}>
//                   Acknowledge
//                 </Button>
//               </div>
//             ))}
//           </div>
//         )}

//         <div className="alert-history">
//           {alertHistory.map((alert) => (
//             <div key={alert.id} className={`alert-item ${alert.severity} ${alert.acknowledged ? "acknowledged" : ""}`}>
//               <div className="alert-icon">
//                 {alert.type === "motion" ? (
//                   <VideoCameraOutlined />
//                 ) : alert.type === "object" ? (
//                   <EyeOutlined />
//                 ) : (
//                   <WarningOutlined />
//                 )}
//               </div>
//               <div className="alert-content">
//                 <div className="alert-message">{alert.message}</div>
//                 <div className="alert-time">{dayjs(alert.time).format("MM/DD HH:mm")}</div>
//               </div>
//               {!alert.acknowledged && (
//                 <Button size="small" onClick={() => acknowledgeAlert(alert.id)}>
//                   Acknowledge
//                 </Button>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>
//     )
//   }

//   // Render settings tab
//   const renderSettingsTab = () => {
//     return (
//       <div className="camera-settings-tab">
//         <Form layout="vertical">
//           <Form.Item label="Protocol">
//             <Select value={selectedProtocol} onChange={setSelectedProtocol}>
//               <Option value="hls">HLS</Option>
//               <Option value="webrtc">WebRTC</Option>
//               <Option value="rtsp">RTSP</Option>
//               <Option value="mjpeg">MJPEG</Option>
//             </Select>
//           </Form.Item>

//           <Form.Item label="Connection Method">
//             <Radio.Group
//               defaultValue={streamUrl ? "url" : "device"}
//               onChange={(e) => {
//                 if (e.target.value === "url") {
//                   setDeviceId("")
//                 } else {
//                   setStreamUrl("")
//                 }
//               }}
//             >
//               <Radio value="url">Stream URL</Radio>
//               <Radio value="device">Device ID</Radio>
//             </Radio.Group>
//           </Form.Item>

//           {!deviceId && (
//             <Form.Item label="Stream URL">
//               <Input
//                 value={streamUrl}
//                 onChange={(e) => setStreamUrl(e.target.value)}
//                 placeholder="rtsp:// or http:// stream URL"
//               />
//             </Form.Item>
//           )}

//           {!streamUrl && (
//             <Form.Item label="Device ID">
//               <Select value={deviceId} onChange={setDeviceId} placeholder="Select device">
//                 <Option value="device1">Temperature Sensor (with camera)</Option>
//                 <Option value="device2">Entrance Camera</Option>
//                 <Option value="device3">Warehouse Camera</Option>
//               </Select>
//             </Form.Item>
//           )}

//           <Divider />

//           <Form.Item label="PTZ Controls">
//             <Switch checked={ptzEnabled} onChange={setPtzEnabled} />
//           </Form.Item>

//           <Form.Item label="Video Quality">
//             <Select defaultValue="auto">
//               <Option value="auto">Auto</Option>
//               <Option value="high">High (1080p)</Option>
//               <Option value="medium">Medium (720p)</Option>
//               <Option value="low">Low (480p)</Option>
//             </Select>
//           </Form.Item>

//           <Form.Item label="Buffer Size (seconds)">
//             <InputNumber min={1} max={10} defaultValue={3} />
//           </Form.Item>

//           <Form.Item label="Auto Reconnect">
//             <Switch defaultChecked />
//           </Form.Item>

//           <Button
//             type="primary"
//             onClick={() => {
//               disconnectStream()
//               connectToStream()
//               setIsSettingsVisible(false)

//               notification.success({
//                 message: "Settings Applied",
//                 description: "Camera settings have been updated",
//                 placement: "bottomRight",
//               })
//             }}
//           >
//             Apply Settings
//           </Button>
//         </Form>
//       </div>
//     )
//   }

//   return (
//     <Card
//       title={config?.title || "Camera Feed"}
//       className={`camera-widget ${theme === "dark" ? "dark-theme" : ""}`}
//       extra={
//         <Space>
//           {activeAlerts.length > 0 && (
//             <Badge count={activeAlerts.length} overflowCount={9}>
//               <Button icon={<BellOutlined />} type="text" onClick={() => setActiveTab("alerts")} />
//             </Badge>
//           )}
//           <Button icon={<SettingOutlined />} type="text" onClick={() => setIsSettingsVisible(true)} />
//         </Space>
//       }
//       bodyStyle={{ padding: 0 }}
//     >
//       <div className="camera-content">
//         <div className="camera-main">
//           <div
//             className="video-container"
//             style={{
//               transform: `scale(${zoomLevel}) translate(${panPosition.x}px, ${panPosition.y}px)`,
//             }}
//           >
//             {isLoading && (
//               <div className="video-loading">
//                 <Spin size="large" />
//                 <div>Connecting to camera...</div>
//               </div>
//             )}

//             <video
//               ref={videoRef}
//               className="camera-video"
//               autoPlay
//               playsInline
//               muted={isMuted}
//               onTimeUpdate={handleTimeUpdate}
//               onDurationChange={handleDurationChange}
//             />

//             <canvas ref={canvasRef} style={{ display: "none" }} />
//           </div>

//           <div className="camera-controls">
//             <div className="primary-controls">
//               <Button icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />} onClick={togglePlay} />

//               <Button icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />} onClick={toggleMute} />

//               <div className="volume-slider">
//                 <Slider min={0} max={100} value={volume} onChange={handleVolumeChange} disabled={isMuted} />
//               </div>

//               {!isLive && (
//                 <Button type="primary" danger icon={<SyncOutlined />} onClick={goToLive}>
//                   Live
//                 </Button>
//               )}

//               <Button icon={<FullscreenOutlined />} onClick={toggleFullscreen} />
//             </div>

//             {!isLive && (
//               <div className="timeline-controls">
//                 <div className="time-display">
//                   {formatTime(currentTime)} / {formatTime(duration)}
//                 </div>

//                 <Slider
//                   min={0}
//                   max={duration}
//                   value={currentTime}
//                   onChange={handleSeek}
//                   step={0.1}
//                   tooltipVisible={false}
//                 />
//               </div>
//             )}

//             <div className="secondary-controls">
//               <Button icon={<CameraOutlined />} onClick={takeSnapshot} title="Take Snapshot" />

//               <Button
//                 icon={isRecording ? <ClockCircleOutlined /> : <VideoCameraOutlined />}
//                 onClick={toggleRecording}
//                 danger={isRecording}
//                 title={isRecording ? "Stop Recording" : "Start Recording"}
//               >
//                 {isRecording && formatTime(recordingTime)}
//               </Button>

//               {ptzEnabled && (
//                 <Button
//                   icon={isControlLocked ? <LockOutlined /> : <UnlockOutlined />}
//                   onClick={toggleControlLock}
//                   title={isControlLocked ? "Unlock Controls" : "Lock Controls"}
//                 />
//               )}
//             </div>
//           </div>

//           {ptzEnabled && (
//             <div className={`ptz-controls ${isControlLocked ? "locked" : ""}`}>
//               <div className="ptz-buttons">
//                 <Button icon={<ZoomInOutlined />} onClick={() => handleZoom("in")} disabled={isControlLocked} />
//                 <Button icon={<ZoomOutOutlined />} onClick={() => handleZoom("out")} disabled={isControlLocked} />
//                 <Button icon={<ReloadOutlined />} onClick={resetView} disabled={isControlLocked} />
//               </div>

//               <div className="ptz-directions">
//                 <Button icon={<UpOutlined />} onClick={() => handlePtzControl("up")} disabled={isControlLocked} />
//                 <div className="ptz-middle-row">
//                   <Button icon={<LeftOutlined />} onClick={() => handlePtzControl("left")} disabled={isControlLocked} />
//                   <Button
//                     icon={<RightOutlined />}
//                     onClick={() => handlePtzControl("right")}
//                     disabled={isControlLocked}
//                   />
//                 </div>
//                 <Button icon={<DownOutlined />} onClick={() => handlePtzControl("down")} disabled={isControlLocked} />
//               </div>
//             </div>
//           )}
//         </div>

//         <Tabs activeKey={activeTab} onChange={setActiveTab} className="camera-tabs">
//           <TabPane tab="Live" key="live" />
//           <TabPane tab="Playback" key="playback" />
//           <TabPane tab="Alerts" key="alerts" />
//         </Tabs>

//         <div className="camera-tab-content">
//           {activeTab === "live" && (
//             <div className="camera-live-tab">
//               <div className="camera-info">
//                 <div className="info-item">
//                   <span className="info-label">Status:</span>
//                   <span className={`info-value ${isConnected ? "connected" : "disconnected"}`}>
//                     {isConnected ? "Connected" : "Disconnected"}
//                   </span>
//                 </div>
//                 <div className="info-item">
//                   <span className="info-label">Protocol:</span>
//                   <span className="info-value">{selectedProtocol.toUpperCase()}</span>
//                 </div>
//                 <div className="info-item">
//                   <span className="info-label">Resolution:</span>
//                   <span className="info-value">1080p</span>
//                 </div>
//                 <div className="info-item">
//                   <span className="info-label">Bitrate:</span>
//                   <span className="info-value">2.5 Mbps</span>
//                 </div>
//               </div>
//             </div>
//           )}

//           {activeTab === "playback" && (
//             <div className="camera-playback-tab">
//               <div className="playback-header">
//                 <Button icon={<CalendarOutlined />}>{selectedDate.format("YYYY-MM-DD")}</Button>
//                 <div className="playback-navigation">
//                   <Button icon={<LeftOutlined />} onClick={() => setSelectedDate(selectedDate.subtract(1, "day"))} />
//                   <Button onClick={() => setSelectedDate(dayjs())}>Today</Button>
//                   <Button icon={<RightOutlined />} onClick={() => setSelectedDate(selectedDate.add(1, "day"))} />
//                 </div>
//               </div>

//               <div className="playback-timeline-container">{renderTimeline()}</div>
//             </div>
//           )}

//           {activeTab === "alerts" && renderAlertsTab()}
//         </div>
//       </div>

//       <Modal
//         title="Camera Settings"
//         open={isSettingsVisible}
//         onCancel={() => setIsSettingsVisible(false)}
//         footer={null}
//         width={500}
//       >
//         {renderSettingsTab()}
//       </Modal>

//       <Modal
//         title="Camera Snapshot"
//         open={isSnapshotModalVisible}
//         onCancel={() => setIsSnapshotModalVisible(false)}
//         footer={[
//           <Button key="close" onClick={() => setIsSnapshotModalVisible(false)}>
//             Close
//           </Button>,
//           <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={downloadSnapshot}>
//             Download
//           </Button>,
//         ]}
//         width={700}
//       >
//         {snapshotData && (
//           <div className="snapshot-preview">
//             <img src={snapshotData || "/placeholder.svg"} alt="Camera snapshot" style={{ maxWidth: "100%" }} />
//             <div className="snapshot-info">
//               <div>Taken at: {dayjs().format("YYYY-MM-DD HH:mm:ss")}</div>
//               <div>Camera: {config?.title || "Camera Feed"}</div>
//             </div>
//           </div>
//         )}
//       </Modal>

//       <CameraAlertConfig
//         visible={isAlertConfigVisible}
//         onCancel={() => setIsAlertConfigVisible(false)}
//         onSave={handleAlertConfigSave}
//         initialValues={{
//           motionDetection: true,
//           motionSensitivity: 70,
//           objectDetection: true,
//           detectPeople: true,
//           detectVehicles: false,
//           restrictedArea: false,
//           alertSound: true,
//           alertEmail: true,
//           alertSms: false,
//         }}
//       />
//     </Card>
//   )
// }

// export default CameraWidget
