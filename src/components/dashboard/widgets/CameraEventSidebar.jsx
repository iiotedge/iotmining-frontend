"use client"

import React, { useState, useEffect } from "react"
import {
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Button,
  Divider,
} from "@mui/material"
import {
  Search,
  FilterList,
  MotionPhotosAuto,
  Person,
  DirectionsCar,
  Warning,
  Videocam,
  PlayArrow,
  Download,
  Share,
} from "@mui/icons-material"
import { useTheme } from "../../theme/ThemeProvider"

const CameraEventSidebar = ({
  isLive,
  currentTime,
  cameras = [],
  selectedCameraIndex = null,
}) => {
  const { theme } = useTheme()  // get current theme: 'light' or 'dark'

  const [searchTerm, setSearchTerm] = useState("")
  const [eventFilter, setEventFilter] = useState("all")
  const [events, setEvents] = useState([])

  useEffect(() => {
    const generateEvents = () => {
      if (!Array.isArray(cameras)) {
        setEvents([])
        return
      }

      const eventTypes = [
        { type: "motion", icon: MotionPhotosAuto, color: "#ff9800", label: "Motion" },
        { type: "person", icon: Person, color: "#2196f3", label: "Person" },
        { type: "vehicle", icon: DirectionsCar, color: "#4caf50", label: "Vehicle" },
        { type: "alert", icon: Warning, color: "#f44336", label: "Alert" },
      ]

      const mockEvents = []
      const now = new Date()

      cameras.forEach((camera, cameraIndex) => {
        const eventCount = Math.floor(Math.random() * 6) + 5
        for (let i = 0; i < eventCount; i++) {
          const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
          const timestamp = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000)

          mockEvents.push({
            id: `${camera.id}_${i}_${Date.now()}`,
            cameraId: camera.id,
            cameraIndex,
            cameraName: camera.title,
            type: eventType.type,
            icon: eventType.icon,
            color: eventType.color,
            label: eventType.label,
            timestamp,
            description: `${eventType.label} detected on ${camera.title}`,
            confidence: Math.floor(Math.random() * 40) + 60,
            duration: Math.floor(Math.random() * 30) + 5,
            hasRecording: Math.random() > 0.3,
            thumbnailUrl: `/placeholder.svg?height=60&width=80`,
          })
        }
      })

      mockEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      setEvents(mockEvents)
    }

    generateEvents()
  }, [cameras])

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.cameraName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = eventFilter === "all" || event.type === eventFilter

    const matchesCamera = selectedCameraIndex === null || event.cameraIndex === selectedCameraIndex

    return matchesSearch && matchesFilter && matchesCamera
  })

  const handleEventClick = (event) => {
    console.log("Event clicked:", event)
  }

  const handlePlayRecording = (event) => {
    console.log("Play recording for event:", event)
  }

  const handleDownloadRecording = (event) => {
    console.log("Download recording for event:", event)
  }

  const handleShareEvent = (event) => {
    console.log("Share event:", event)
  }

  const formatTimestamp = (timestamp) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  // Colors and styles depending on theme
  const backgroundColor = theme === "dark" ? "#121212" : "#fff"
  const borderColor = theme === "dark" ? "#333" : "#ddd"
  const sectionBackground = theme === "dark" ? "#1e1e1e" : "#fafafa"
  const textPrimary = theme === "dark" ? "#eee" : "#000"
  const textSecondary = theme === "dark" ? "#999" : "#666"
  const chipBorderColor = theme === "dark" ? "#666" : undefined
  const chipTextColor = theme === "dark" ? "#eee" : undefined
  const listItemHover = theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor,
        color: textPrimary,
        borderLeft: `1px solid ${borderColor}`,
      }}
    >
      {/* Search and Filter Controls */}
      <div
        style={{
          padding: 12,
          borderBottom: `1px solid ${borderColor}`,
          backgroundColor: sectionBackground,
        }}
      >
        <TextField
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: <Search fontSize="small" style={{ marginRight: 8, color: textSecondary }} />,
            style: {
              backgroundColor,
              color: textPrimary,
              borderRadius: 4,
            },
          }}
          style={{ marginBottom: 8 }}
        />

        <FormControl size="small" fullWidth>
          <InputLabel style={{ color: textSecondary }}>Filter by type</InputLabel>
          <Select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            label="Filter by type"
            startAdornment={<FilterList fontSize="small" style={{ marginRight: 8 }} />}
            style={{
              backgroundColor,
              color: textPrimary,
              borderRadius: 4,
            }}
            MenuProps={{
              PaperProps: {
                style: {
                  backgroundColor,
                  color: textPrimary,
                },
              },
            }}
          >
            <MenuItem value="all">All Events</MenuItem>
            <MenuItem value="motion">Motion</MenuItem>
            <MenuItem value="person">Person</MenuItem>
            <MenuItem value="vehicle">Vehicle</MenuItem>
            <MenuItem value="alert">Alert</MenuItem>
          </Select>
        </FormControl>
      </div>

      {/* Event Statistics */}
      <div
        style={{
          padding: 12,
          borderBottom: `1px solid ${borderColor}`,
          backgroundColor: sectionBackground,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <Typography variant="caption" style={{ color: textSecondary }}>
            {isLive ? "Live Events" : "Recorded Events"}
          </Typography>
          <Typography variant="caption" style={{ color: textSecondary }}>
            {filteredEvents.length} events
          </Typography>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <Chip
            icon={<MotionPhotosAuto />}
            label={events.filter((e) => e.type === "motion").length}
            size="small"
            variant="outlined"
            style={{ fontSize: 10, borderColor: chipBorderColor, color: chipTextColor }}
          />
          <Chip
            icon={<Person />}
            label={events.filter((e) => e.type === "person").length}
            size="small"
            variant="outlined"
            style={{ fontSize: 10, borderColor: chipBorderColor, color: chipTextColor }}
          />
          <Chip
            icon={<DirectionsCar />}
            label={events.filter((e) => e.type === "vehicle").length}
            size="small"
            variant="outlined"
            style={{ fontSize: 10, borderColor: chipBorderColor, color: chipTextColor }}
          />
          <Chip
            icon={<Warning />}
            label={events.filter((e) => e.type === "alert").length}
            size="small"
            variant="outlined"
            style={{ fontSize: 10, borderColor: chipBorderColor, color: chipTextColor }}
          />
        </div>
      </div>

      {/* Events List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          backgroundColor,
        }}
      >
        {filteredEvents.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: textSecondary }}>
            <Typography variant="body2">No events found</Typography>
          </div>
        ) : (
          <List dense>
            {filteredEvents.map((event, index) => {
              const IconComponent = event.icon

              return (
                <div key={event.id}>
                  <ListItem
                    button
                    onClick={() => handleEventClick(event)}
                    style={{
                      paddingTop: 8,
                      paddingBottom: 8,
                      paddingLeft: 16,
                      paddingRight: 16,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent"
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={event.thumbnailUrl}
                        variant="rounded"
                        style={{
                          width: 48,
                          height: 36,
                          backgroundColor: theme === "dark" ? "#222" : undefined,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconComponent fontSize="small" style={{ color: event.color }} />
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <IconComponent fontSize="small" style={{ color: event.color }} />
                          <Typography variant="body2" style={{ fontSize: 13, color: textPrimary }}>
                            {event.label}
                          </Typography>
                          <Chip
                            label={`${event.confidence}%`}
                            size="small"
                            variant="outlined"
                            style={{
                              fontSize: 9,
                              height: 20,
                              borderColor: chipBorderColor,
                              color: chipTextColor,
                            }}
                          />
                        </div>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" style={{ fontSize: 11, color: textSecondary }}>
                            {event.cameraName}
                          </Typography>
                          <br />
                          <Typography variant="caption" style={{ fontSize: 11, color: textSecondary }}>
                            {formatTimestamp(event.timestamp)} • {event.duration}s
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>

                  {event.hasRecording && (
                    <div
                      style={{
                        paddingLeft: 64,
                        paddingRight: 16,
                        paddingBottom: 8,
                        display: "flex",
                        gap: 6,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePlayRecording(event)
                        }}
                        title="Play Recording"
                        style={{ color: theme === "dark" ? "#eee" : undefined }}
                      >
                        <PlayArrow fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownloadRecording(event)
                        }}
                        title="Download"
                        style={{ color: theme === "dark" ? "#eee" : undefined }}
                      >
                        <Download fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleShareEvent(event)
                        }}
                        title="Share"
                        style={{ color: theme === "dark" ? "#eee" : undefined }}
                      >
                        <Share fontSize="small" />
                      </IconButton>
                    </div>
                  )}

                  {index < filteredEvents.length - 1 && (
                    <Divider
                      style={{
                        backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)",
                        margin: 0,
                      }}
                    />
                  )}
                </div>
              )
            })}
          </List>
        )}
      </div>

      {/* Footer Actions */}
      <div
        style={{
          padding: 12,
          borderTop: `1px solid ${theme === "dark" ? "#333" : "#ddd"}`,
          backgroundColor: theme === "dark" ? "#1e1e1e" : "#fafafa",
        }}
      >
        <Button
          variant="outlined"
          size="small"
          fullWidth
          startIcon={<Videocam />}
          onClick={() => console.log("View all recordings")}
          style={{
            color: theme === "dark" ? "#eee" : undefined,
            borderColor: theme === "dark" ? "#555" : undefined,
            textTransform: "none",
          }}
          onMouseEnter={e => {
            if (theme === "dark") e.currentTarget.style.borderColor = "#888"
          }}
          onMouseLeave={e => {
            if (theme === "dark") e.currentTarget.style.borderColor = "#555"
          }}
        >
          View All Recordings
        </Button>
      </div>
    </div>
  )
}

export default CameraEventSidebar




// "use client"

// import { useState, useEffect } from "react"
// import {
//   Typography,
//   ListItemIcon,
//   Chip,
//   Button,
//   Tabs,
//   Tab,
//   Box,
//   IconButton,
//   Accordion,
//   AccordionSummary,
//   AccordionDetails,
// } from "@mui/material"
// import {
//   Videocam,
//   MotionPhotosAuto,
//   Warning,
//   Person,
//   DirectionsCar,
//   Pets,
//   ExpandMore,
//   PlayArrow,
//   Delete,
// } from "@mui/icons-material"

// const CameraEventSidebar = ({ isLive, currentTime, cameras = [], selectedCameraIndex = null }) => {
//   const [activeTab, setActiveTab] = useState(0)
//   const [events, setEvents] = useState([])
//   const [filteredEvents, setFilteredEvents] = useState([])

//   // Generate mock events for demonstration
//   useEffect(() => {
//     const generateMockEvents = () => {
//       const eventTypes = [
//         { type: "motion", icon: MotionPhotosAuto, color: "warning", label: "Motion" },
//         { type: "person", icon: Person, color: "info", label: "Person" },
//         { type: "vehicle", icon: DirectionsCar, color: "primary", label: "Vehicle" },
//         { type: "animal", icon: Pets, color: "success", label: "Animal" },
//         { type: "alert", icon: Warning, color: "error", label: "Alert" },
//       ]

//       const mockEvents = []
//       const now = new Date()

//       // Generate events for each camera
//       cameras.forEach((camera, cameraIndex) => {
//         for (let i = 0; i < 10; i++) {
//           const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
//           const timestamp = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000) // Last 24 hours

//           mockEvents.push({
//             id: `${cameraIndex}-${i}`,
//             cameraId: camera.id,
//             cameraIndex,
//             cameraName: camera.title,
//             type: eventType.type,
//             icon: eventType.icon,
//             color: eventType.color,
//             label: eventType.label,
//             timestamp,
//             description: `${eventType.label} detected on ${camera.title}`,
//             thumbnail: `/placeholder.svg?height=60&width=80&text=${eventType.label}`,
//             duration: Math.floor(Math.random() * 30) + 5, // 5-35 seconds
//             confidence: Math.floor(Math.random() * 40) + 60, // 60-100%
//           })
//         }
//       })

//       // Sort by timestamp (newest first)
//       return mockEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
//     }

//     if (cameras.length > 0) {
//       const generatedEvents = generateMockEvents()
//       setEvents(generatedEvents)
//     }
//   }, [cameras])

//   // Filter events based on active tab and selected camera
//   useEffect(() => {
//     let filtered = events

//     // Filter by selected camera if one is selected
//     if (selectedCameraIndex !== null) {
//       filtered = filtered.filter((event) => event.cameraIndex === selectedCameraIndex)
//     }

//     // Filter by event type based on active tab
//     switch (activeTab) {
//       case 0: // All events
//         break
//       case 1: // Motion only
//         filtered = filtered.filter((event) => event.type === "motion")
//         break
//       case 2: // People only
//         filtered = filtered.filter((event) => event.type === "person")
//         break
//       case 3: // Alerts only
//         filtered = filtered.filter((event) => event.type === "alert")
//         break
//       default:
//         break
//     }

//     setFilteredEvents(filtered)
//   }, [events, activeTab, selectedCameraIndex])

//   const handleTabChange = (event, newValue) => {
//     setActiveTab(newValue)
//   }

//   const formatTimeAgo = (timestamp) => {
//     const now = new Date()
//     const diff = now.getTime() - timestamp.getTime()
//     const minutes = Math.floor(diff / (1000 * 60))
//     const hours = Math.floor(diff / (1000 * 60 * 60))

//     if (minutes < 1) return "Just now"
//     if (minutes < 60) return `${minutes}m ago`
//     if (hours < 24) return `${hours}h ago`
//     return timestamp.toLocaleDateString()
//   }

//   const getEventIcon = (event) => {
//     const IconComponent = event.icon
//     return <IconComponent fontSize="small" />
//   }

//   const renderEventItem = (event) => (
//     <Accordion key={event.id} sx={{ boxShadow: "none", border: "1px solid #e0e0e0", mb: 1 }}>
//       <AccordionSummary expandIcon={<ExpandMore />} sx={{ minHeight: "48px" }}>
//         <Box display="flex" alignItems="center" width="100%">
//           <ListItemIcon sx={{ minWidth: "32px" }}>{getEventIcon(event)}</ListItemIcon>
//           <Box flex={1}>
//             <Typography variant="body2" noWrap>
//               {event.description}
//             </Typography>
//             <Typography variant="caption" color="textSecondary">
//               {formatTimeAgo(event.timestamp)}
//             </Typography>
//           </Box>
//           <Chip label={event.label} size="small" color={event.color} variant="outlined" sx={{ ml: 1 }} />
//         </Box>
//       </AccordionSummary>
//       <AccordionDetails sx={{ pt: 0 }}>
//         <Box>
//           {/* Event thumbnail */}
//           <Box
//             component="img"
//             src={event.thumbnail}
//             alt={event.description}
//             sx={{
//               width: "100%",
//               height: "60px",
//               objectFit: "cover",
//               borderRadius: 1,
//               mb: 1,
//               backgroundColor: "#f5f5f5",
//             }}
//           />

//           {/* Event details */}
//           <Typography variant="caption" display="block">
//             <strong>Camera:</strong> {event.cameraName}
//           </Typography>
//           <Typography variant="caption" display="block">
//             <strong>Time:</strong> {event.timestamp.toLocaleString()}
//           </Typography>
//           <Typography variant="caption" display="block">
//             <strong>Duration:</strong> {event.duration}s
//           </Typography>
//           <Typography variant="caption" display="block">
//             <strong>Confidence:</strong> {event.confidence}%
//           </Typography>

//           {/* Action buttons */}
//           <Box display="flex" gap={1} mt={1}>
//             <Button size="small" startIcon={<PlayArrow />} variant="outlined">
//               Play
//             </Button>
//             <Button size="small" startIcon={<Videocam />} variant="outlined">
//               View
//             </Button>
//             <IconButton size="small" color="error">
//               <Delete fontSize="small" />
//             </IconButton>
//           </Box>
//         </Box>
//       </AccordionDetails>
//     </Accordion>
//   )

//   return (
//     <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
//       {/* Header */}
//       <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0" }}>
//         <Typography variant="h6" gutterBottom>
//           Camera Events
//         </Typography>
//         {selectedCameraIndex !== null && cameras[selectedCameraIndex] && (
//           <Typography variant="caption" color="textSecondary">
//             Showing events for: {cameras[selectedCameraIndex].title}
//           </Typography>
//         )}
//       </Box>

//       {/* Tabs */}
//       <Tabs
//         value={activeTab}
//         onChange={handleTabChange}
//         variant="scrollable"
//         scrollButtons="auto"
//         sx={{ borderBottom: "1px solid #e0e0e0" }}
//       >
//         <Tab label="All" sx={{ minWidth: "auto", fontSize: "0.75rem" }} />
//         <Tab label="Motion" sx={{ minWidth: "auto", fontSize: "0.75rem" }} />
//         <Tab label="People" sx={{ minWidth: "auto", fontSize: "0.75rem" }} />
//         <Tab label="Alerts" sx={{ minWidth: "auto", fontSize: "0.75rem" }} />
//       </Tabs>

//       {/* Events List */}
//       <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
//         {filteredEvents.length === 0 ? (
//           <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="200px">
//             <Videocam sx={{ fontSize: 48, color: "#ccc", mb: 1 }} />
//             <Typography variant="body2" color="textSecondary" textAlign="center">
//               No events to display
//             </Typography>
//           </Box>
//         ) : (
//           <Box>{filteredEvents.map(renderEventItem)}</Box>
//         )}
//       </Box>

//       {/* Footer */}
//       <Box sx={{ p: 1, borderTop: "1px solid #e0e0e0" }}>
//         <Typography variant="caption" color="textSecondary">
//           {filteredEvents.length} events
//           {isLive && (
//             <>
//               {" • "}
//               <Chip label="LIVE" size="small" color="error" variant="outlined" />
//             </>
//           )}
//         </Typography>
//       </Box>
//     </Box>
//   )
// }

// export default CameraEventSidebar


// // import { useEffect, useState } from "react"
// // import dayjs from "dayjs"
// // import axios from "axios"
// // import { Input, Tabs, List, Tag, Select } from "antd"

// // const { TabPane } = Tabs
// // const { Option } = Select

// // const CameraEventSidebar = ({ isLive, currentTime }) => {
// //   const [liveEvents, setLiveEvents] = useState([])
// //   const [recordedEvents, setRecordedEvents] = useState([])
// //   const [filteredEvents, setFilteredEvents] = useState([])
// //   const [searchText, setSearchText] = useState("")
// //   const [filterType, setFilterType] = useState("all")

// //   // Simulate Live Feed
// //   useEffect(() => {
// //     if (!isLive) return
// //     const interval = setInterval(() => {
// //       const now = dayjs()
// //       setLiveEvents((prev) => [
// //         ...prev.slice(-50),
// //         {
// //           id: now.valueOf(),
// //           time: now.format("HH:mm:ss"),
// //           user: "User" + Math.floor(Math.random() * 100),
// //           type: "motion",
// //           message: "Live motion detected",
// //         },
// //       ])
// //     }, 4000)
// //     return () => clearInterval(interval)
// //   }, [isLive])

// //   // Fetch Recorded Events
// //   useEffect(() => {
// //     if (isLive) return
// //     const fetchLogs = async () => {
// //       try {
// //         const response = await axios.get("/api/log-events")
// //         setRecordedEvents(response.data)
// //       } catch {
// //         const mock = []
// //         for (let i = 1; i <= 20; i++) {
// //           mock.push({
// //             id: i,
// //             time: i * 10,
// //             user: "Logger",
// //             type: i % 2 === 0 ? "motion" : "object",
// //             message: `Event at ${i * 10}s`,
// //           })
// //         }
// //         setRecordedEvents(mock)
// //       }
// //     }
// //     fetchLogs()
// //   }, [isLive])

// //   // Filter Playback Events based on currentTime, search, type
// //   useEffect(() => {
// //     if (isLive) return

// //     let events = recordedEvents.filter(
// //       (e) => Math.abs(e.time - currentTime) < 5
// //     )

// //     if (filterType !== "all") {
// //       events = events.filter((e) => e.type === filterType)
// //     }

// //     if (searchText) {
// //       events = events.filter((e) =>
// //         e.message.toLowerCase().includes(searchText.toLowerCase())
// //       )
// //     }

// //     setFilteredEvents(events)
// //   }, [currentTime, recordedEvents, searchText, filterType, isLive])

// //   const renderItem = (item) => (
// //     <List.Item>
// //       <List.Item.Meta
// //         title={
// //           <span>
// //             {item.time}{" "}
// //             <Tag color={item.type === "motion" ? "green" : "blue"}>
// //               {item.type.toUpperCase()}
// //             </Tag>
// //           </span>
// //         }
// //         description={
// //           <>
// //             <strong>{item.user}</strong>: {item.message}
// //           </>
// //         }
// //       />
// //     </List.Item>
// //   )

// //   return (
// //     <div className="event-sidebar">
// //       <Tabs defaultActiveKey="1">
// //         <TabPane tab="Live Events" key="1" disabled={!isLive}>
// //           <List
// //             size="small"
// //             dataSource={liveEvents.slice().reverse()}
// //             renderItem={renderItem}
// //           />
// //         </TabPane>
// //         <TabPane tab="Playback Events" key="2" disabled={isLive}>
// //           <div style={{ marginBottom: 8 }}>
// //             <Input
// //               placeholder="Search events"
// //               value={searchText}
// //               onChange={(e) => setSearchText(e.target.value)}
// //               allowClear
// //             />
// //             <Select
// //               value={filterType}
// //               onChange={setFilterType}
// //               style={{ marginTop: 8, width: "100%" }}
// //             >
// //               <Option value="all">All</Option>
// //               <Option value="motion">Motion</Option>
// //               <Option value="object">Object</Option>
// //               <Option value="custom">Custom</Option>
// //             </Select>
// //           </div>
// //           <List
// //             size="small"
// //             dataSource={filteredEvents}
// //             renderItem={renderItem}
// //           />
// //         </TabPane>
// //       </Tabs>
// //     </div>
// //   )
// // }

// // export default CameraEventSidebar
