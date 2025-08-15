"use client"

import { useState, useEffect, useRef } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
  Tabs,
  Tab,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Slider,
  Tooltip,
  useTheme,
} from "@mui/material"
import {
  MoreVert,
  Videocam,
  Pause,
  PlayArrow,
  Settings,
  Fullscreen,
  FullscreenExit,
  Save,
  Cancel,
  CalendarToday,
  MotionPhotosAuto,
  Visibility,
  VisibilityOff,
  Delete,
  ArrowUpward,
  ArrowDownward,
  ArrowBack,
  ArrowForward,
  Home,
  ZoomIn,
  ZoomOut,
} from "@mui/icons-material"
import Hls from "hls.js"
import "../../../styles/widget/camera-widget.css"
import CameraEventSidebar from "./CameraEventSidebar"

const CameraWidget = ({ config, onConfigChange }) => {
  const theme = useTheme()

  // States
  const [anchorEl, setAnchorEl] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSettingsVisible, setIsSettingsVisible] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [isLive, setIsLive] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [alerts, setAlerts] = useState([])
  const [motionDetected, setMotionDetected] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [settingsDraft, setSettingsDraft] = useState({ ...(config || {}) })
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [timeRange, setTimeRange] = useState([0, 24])
  const [isSidebarVisible, setIsSidebarVisible] = useState(false)
  const [showBottomOptions, setShowBottomOptions] = useState(true)

  const videoRef = useRef(null)
  const hlsRef = useRef(null)
  const containerRef = useRef(null)
  const retryCountRef = useRef(0)
  const MAX_RETRIES = 2

  const dataSource = settingsDraft.dataSource || {}
  const streamUrl = dataSource.streamUrl || ""

  // Logger utility
  const log = (...args) => {
    console.groupCollapsed("[CameraWidget]")
    console.log(...args)
    console.groupEnd()
  }

  // Sync settingsDraft when config prop changes
  useEffect(() => {
    log("Config prop changed:", config)
    setSettingsDraft({ ...(config || {}) })
  }, [config])

  // Main streaming and periodic effects
  useEffect(() => {
    log("Effect triggered: isLive, selectedDate, timeRange, motionDetection, notifications, streamUrl, isSettingsVisible", {
      isLive,
      selectedDate,
      timeRange,
      motionDetection: settingsDraft.motionDetection,
      notifications: settingsDraft.notifications,
      streamUrl,
      isSettingsVisible,
    })

    if (!streamUrl || !streamUrl.trim().startsWith("http")) {
      log("Invalid stream URL:", streamUrl)
      setIsLoading(false)
      setIsConnected(false)
      destroyStream()
      return
    }
    if (isLive) {
      log("Initializing live stream:", streamUrl)
      initializeStream(streamUrl)
    } else {
      log("Loading recording for date:", selectedDate, "timeRange:", timeRange)
      loadRecordingForDate(selectedDate, timeRange, streamUrl)
    }

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    const motionInterval = setInterval(() => {
      if (settingsDraft.motionDetection) {
        const detected = Math.random() > 0.7
        log("Motion detection check, detected:", detected)
        setMotionDetected(detected)
        if (detected && settingsDraft.notifications) {
          log("Motion detected - sending alert")
          addAlert("Motion detected")
        }
      }
    }, 10000)

    return () => {
      log("Cleanup: destroying stream and clearing intervals")
      destroyStream()
      clearInterval(timeInterval)
      clearInterval(motionInterval)
    }
  }, [
    isLive,
    selectedDate,
    timeRange,
    settingsDraft.motionDetection,
    settingsDraft.notifications,
    streamUrl,
    isSettingsVisible,
  ])

  // STREAM HANDLERS
  const initializeStream = (url = streamUrl) => {
    log("initializeStream called with URL:", url)
    const safeUrl = typeof url === "string" ? url.trim() : ""
    if (!safeUrl || !safeUrl.startsWith("http")) {
      log("Invalid stream URL in initializeStream:", safeUrl)
      addAlert("Invalid stream URL")
      setIsLoading(false)
      setIsConnected(false)
      return
    }
    setIsLoading(true)
    setIsConnected(false)
    destroyStream()

    if (Hls.isSupported() && videoRef.current) {
      log("Using HLS.js for streaming")
      const hls = new Hls({ debug: true, enableWorker: true })
      hlsRef.current = hls
      hls.attachMedia(videoRef.current)
      hls.loadSource(safeUrl)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        log("HLS MANIFEST_PARSED event")
        setIsLoading(false)
        setIsConnected(true)
        retryCountRef.current = 0
        if (isPlaying) {
          videoRef.current.play().catch((e) => log("Video play error:", e))
        }
      })
      hls.on(Hls.Events.ERROR, (event, data) => {
        log("HLS error event:", data)
        if (data.fatal) {
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++
            log(`Retrying stream... attempt ${retryCountRef.current}`)
            hls.startLoad()
          } else {
            log("Max retries reached, destroying stream")
            setIsConnected(false)
            setIsLoading(false)
            addAlert(`Stream error: ${data.details}`)
            destroyStream()
          }
        }
      })
    } else if (videoRef.current?.canPlayType("application/vnd.apple.mpegurl")) {
      log("Using native HLS playback")
      videoRef.current.src = safeUrl
      videoRef.current.addEventListener("loadedmetadata", () => {
        log("Native player loadedmetadata event")
        setIsLoading(false)
        setIsConnected(true)
        if (isPlaying) videoRef.current.play().catch((e) => log("Video play error:", e))
      })
      videoRef.current.addEventListener("error", () => {
        log("Native player error event")
        setIsConnected(false)
        setIsLoading(false)
        addAlert("Safari player failed to load stream.")
      })
    } else {
      log("HLS not supported in this browser")
      setIsConnected(false)
      setIsLoading(false)
      addAlert("HLS not supported in this browser")
    }
  }

  const destroyStream = () => {
    log("destroyStream called")
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy()
        log("HLS instance destroyed")
      } catch (e) {
        log("Error destroying HLS instance:", e)
      }
      hlsRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.removeAttribute("src")
      try {
        videoRef.current.load()
        log("Video element source cleared and reloaded")
      } catch (e) {
        log("Error reloading video element:", e)
      }
    }
  }

  // UI Handlers
  const togglePlayPause = () => {
    log("togglePlayPause called, current state:", isPlaying)
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        log("Video paused")
      } else {
        videoRef.current.play().catch((e) => log("Error playing video:", e))
        log("Video play triggered")
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleFullscreen = () => {
    log("toggleFullscreen called, current fullscreen:", isFullscreen)
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((e) => log("Fullscreen request error:", e))
      setIsFullscreen(true)
      log("Entered fullscreen mode")
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
      log("Exited fullscreen mode")
    }
  }

  const handleMenuOpen = (event) => {
    log("handleMenuOpen called")
    setAnchorEl(event.currentTarget)
  }
  const handleMenuClose = () => {
    log("handleMenuClose called")
    setAnchorEl(null)
  }
  const handleTabChange = (event, newValue) => {
    log("handleTabChange called, new tab:", newValue)
    setActiveTab(newValue)
  }
  const toggleSettings = () => {
    log("toggleSettings called, current state:", isSettingsVisible)
    setIsSettingsVisible(!isSettingsVisible)
    handleMenuClose()
  }

  const handleConfigChange = (field, value) => {
    log(`handleConfigChange called for field '${field}' with value:`, value)
    setSettingsDraft((prev) => ({ ...prev, [field]: value }))
  }

  const handleDataSourceChange = (field, value) => {
    log(`handleDataSourceChange called for field '${field}' with value:`, value)
    setSettingsDraft((prev) => ({
      ...prev,
      dataSource: {
        ...prev.dataSource,
        [field]: value,
      },
    }))
  }

  const saveSettings = () => {
    log("saveSettings called, saving draft:", settingsDraft)
    onConfigChange?.(settingsDraft)
    setIsSettingsVisible(false)
    setIsPlaying(true)
    // Force re-initialize stream on save
    if (settingsDraft.dataSource?.streamUrl) {
      log("Reinitializing stream after settings save")
      initializeStream(settingsDraft.dataSource.streamUrl)
    }
  }

  const cancelSettings = () => {
    log("cancelSettings called, resetting draft to config")
    setSettingsDraft({ ...(config || {}) })
    setIsSettingsVisible(false)
  }

  const addAlert = (message) => {
    log("addAlert called with message:", message)
    const newAlert = { id: Date.now(), message, timestamp: new Date() }
    setAlerts((prev) => [newAlert, ...prev].slice(0, 50))
  }
  const deleteAlert = (alertId) => {
    log("deleteAlert called for alertId:", alertId)
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
  }
  const clearAllAlerts = () => {
    log("clearAllAlerts called")
    setAlerts([])
  }

  const loadRecordingForDate = (date, timeRange, url = streamUrl) => {
    log("loadRecordingForDate called with date:", date, "timeRange:", timeRange, "url:", url)
    const safeUrl = typeof url === "string" ? url.trim() : ""
    if (!safeUrl || !safeUrl.startsWith("http")) {
      log("Invalid playback stream URL in loadRecordingForDate:", safeUrl)
      addAlert("Invalid playback stream URL")
      setIsLoading(false)
      setIsConnected(false)
      return
    }
    setIsLoading(true)
    setIsConnected(false)
    destroyStream()

    if (Hls.isSupported() && videoRef.current) {
      const hls = new Hls()
      hlsRef.current = hls
      hls.loadSource(safeUrl)
      hls.attachMedia(videoRef.current)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        log("HLS MANIFEST_PARSED for playback")
        videoRef.current.play().catch((e) => log("Playback video play error:", e))
        setIsLoading(false)
        setIsConnected(true)
        const dateStr = date.toISOString().split("T")[0]
        const start = timeRange[0].toString().padStart(2, "0")
        const end = timeRange[1].toString().padStart(2, "0")
        addAlert(`Loaded recording for ${dateStr} ${start}:00–${end}:00`)
      })
    } else if (videoRef.current?.canPlayType("application/vnd.apple.mpegurl")) {
      log("Using native playback for recording")
      videoRef.current.src = safeUrl
      videoRef.current.addEventListener("loadedmetadata", () => {
        log("Native playback loadedmetadata event")
        videoRef.current.play().catch((e) => log("Playback video play error:", e))
        setIsLoading(false)
        setIsConnected(true)
      })
    } else {
      log("Playback stream not supported")
      setIsConnected(false)
      setIsLoading(false)
      addAlert("Playback stream not supported")
    }
  }

  const toggleLiveMode = () => {
    log("toggleLiveMode called, current isLive:", isLive)
    setIsLive((prev) => !prev)
    if (!isLive) {
      log("Switching to live mode, reinitializing stream")
      destroyStream()
      initializeStream()
    }
  }

  // PTZ Controls (simulated)
  const handlePtzControl = (direction) => {
    log("handlePtzControl called with direction:", direction)
    if (settingsDraft.ptz) addAlert(`PTZ Command: ${direction}`)
  }

  const handleDateChange = (date) => {
    log("handleDateChange called with date:", date)
    setSelectedDate(date)
  }
  const handleTimeRangeChange = (event, newValue) => {
    log("handleTimeRangeChange called with value:", newValue)
    setTimeRange(newValue)
  }
  const formatTimeRange = (range) => `${range[0]}:00 - ${range[1]}:00`

  return (
    <Card
      ref={containerRef}
      className="camera-widget"
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <CardHeader
        title={
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: "bold",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              overflow: "hidden",
              maxWidth: 200,
              userSelect: "text",
            }}
            title={settingsDraft.title}
          >
            {settingsDraft.title}
          </Typography>
        }
        className="camera-header"
        sx={{
          background: "rgba(0, 0, 0, 0.7)",
          borderBottom: "none",
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
          py: 0.5,
          color: "#fff",
          userSelect: "none",
        }}
        action={
          <>
            <Tooltip title={showBottomOptions ? "Hide Options" : "Show Options"}>
              <IconButton
                onClick={() => setShowBottomOptions((prev) => !prev)}
                size="small"
                sx={{ mr: 1, color: "#fff" }}
                color="inherit"
              >
                {showBottomOptions ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </Tooltip>

            {!isSidebarVisible ? (
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => setIsSidebarVisible(true)}
                startIcon={<Visibility fontSize="small" />}
                sx={{ minWidth: 90, mr: 1 }}
              >
                Events
              </Button>
            ) : (
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => setIsSidebarVisible(false)}
                startIcon={<VisibilityOff fontSize="small" />}
                sx={{ minWidth: 90, mr: 1 }}
              >
                Hide
              </Button>
            )}

            <IconButton onClick={handleMenuOpen} size="small" sx={{ color: "#fff" }}>
              <MoreVert fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  bgcolor: "rgba(0,0,0,0.8)",
                  color: "#fff",
                },
              }}
            >
              <MenuItem onClick={toggleSettings}>
                <Settings fontSize="small" sx={{ mr: 1, color: "#fff" }} />
                Settings
              </MenuItem>
              <MenuItem onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <>
                    <FullscreenExit fontSize="small" sx={{ mr: 1, color: "#fff" }} />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Fullscreen fontSize="small" sx={{ mr: 1, color: "#fff" }} />
                    Fullscreen
                  </>
                )}
              </MenuItem>
              <MenuItem onClick={toggleLiveMode}>
                {isLive ? (
                  <>
                    <CalendarToday fontSize="small" sx={{ mr: 1, color: "#fff" }} />
                    View Recordings
                  </>
                ) : (
                  <>
                    <Videocam fontSize="small" sx={{ mr: 1, color: "#fff" }} />
                    Live View
                  </>
                )}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  addAlert("Screenshot taken")
                }}
              >
                <Videocam fontSize="small" sx={{ mr: 1, color: "#fff" }} />
                Take Screenshot
              </MenuItem>
            </Menu>
          </>
        }
      />

      <CardContent
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          p: 0,
          bgcolor: theme.palette.background.default,
          color: theme.palette.text.primary,
        }}
      >
        {isSettingsVisible ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Camera Settings
            </Typography>
            <TextField
              label="Camera Name"
              value={settingsDraft.title || ""}
              onChange={(e) => handleConfigChange("title", e.target.value)}
              fullWidth
              margin="normal"
              size="small"
            />
            <TextField
              label="Stream URL"
              value={settingsDraft.dataSource?.streamUrl || ""}
              onChange={(e) => handleDataSourceChange("streamUrl", e.target.value)}
              fullWidth
              margin="normal"
              size="small"
            />
            <TextField
              label="Username"
              value={settingsDraft.username || ""}
              onChange={(e) => handleConfigChange("username", e.target.value)}
              fullWidth
              margin="normal"
              size="small"
            />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={settingsDraft.password || ""}
              onChange={(e) => handleConfigChange("password", e.target.value)}
              fullWidth
              margin="normal"
              size="small"
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                ),
              }}
            />
            <TextField
              label="Refresh Interval (seconds)"
              type="number"
              value={settingsDraft.refreshInterval || 30}
              onChange={(e) => handleConfigChange("refreshInterval", Number.parseInt(e.target.value))}
              fullWidth
              margin="normal"
              size="small"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settingsDraft.motionDetection || false}
                  onChange={(e) => handleConfigChange("motionDetection", e.target.checked)}
                  size="small"
                />
              }
              label={<Typography variant="body2">Motion Detection</Typography>}
            />
            {settingsDraft.motionDetection && (
              <Box sx={{ mb: 2 }}>
                <Typography id="motion-sensitivity-slider" variant="body2">
                  Motion Sensitivity: {settingsDraft.motionSensitivity || 50}%
                </Typography>
                <Slider
                  value={settingsDraft.motionSensitivity || 50}
                  onChange={(e, value) => handleConfigChange("motionSensitivity", value)}
                  aria-labelledby="motion-sensitivity-slider"
                  min={0}
                  max={100}
                  size="small"
                />
              </Box>
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={settingsDraft.notifications || false}
                  onChange={(e) => handleConfigChange("notifications", e.target.checked)}
                  size="small"
                />
              }
              label={<Typography variant="body2">Enable Notifications</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settingsDraft.recordingEnabled || false}
                  onChange={(e) => handleConfigChange("recordingEnabled", e.target.checked)}
                  size="small"
                />
              }
              label={<Typography variant="body2">Enable Recording</Typography>}
            />
            {settingsDraft.recordingEnabled && (
              <TextField
                label="Storage Retention (days)"
                type="number"
                value={settingsDraft.storageRetention || 7}
                onChange={(e) => handleConfigChange("storageRetention", Number.parseInt(e.target.value))}
                fullWidth
                margin="normal"
                size="small"
              />
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={settingsDraft.ptz || false}
                  onChange={(e) => handleConfigChange("ptz", e.target.checked)}
                  size="small"
                />
              }
              label={<Typography variant="body2">PTZ Controls</Typography>}
            />
            <Box mt={2} display="flex" justifyContent="flex-end">
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<Cancel />}
                onClick={cancelSettings}
                sx={{ mr: 1 }}
                size="small"
              >
                Cancel
              </Button>
              <Button variant="contained" color="primary" startIcon={<Save />} onClick={saveSettings} size="small">
                Save
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Box sx={{ display: "flex", flex: 1, height: "100%", overflow: "hidden", position: "relative" }}>
              {/* LIVE badge + time top-left with solid background */}
              {isLive && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    zIndex: 1100,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    userSelect: "none",
                    fontWeight: "bold",
                    color: "#fff",
                    fontSize: "0.75rem",
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#fff",
                      animation: "pulse-red 1.5s infinite",
                    }}
                  />
                  <Box
                    sx={{
                      bgcolor: "rgba(255, 0, 0, 0.75)", // red background ONLY behind LIVE text
                      borderRadius: 1,
                      px: 1,
                      py: 0.25,
                      userSelect: "none",
                    }}
                  >
                    LIVE
                  </Box>
                  <Typography
                    sx={{
                      ml: 2,
                      userSelect: "none",
                      fontWeight: "normal",
                      fontSize: "0.75rem",
                      color: "#fff",
                      fontFamily: "monospace",
                      bgcolor: "rgba(0, 0, 0, 0.7)", // original timer background (no red)
                      px: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    {currentTime.toLocaleTimeString()}
                  </Typography>
                </Box>
              )}

              <Box
                className="video-container"
                sx={{
                  flex: 1,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  p: 0,
                }}
              >
                {isLoading && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      zIndex: 1000,
                    }}
                  >
                    <CircularProgress size={30} />
                    <Typography variant="caption" sx={{ mt: 1 }}>
                      Connecting...
                    </Typography>
                  </Box>
                )}

                {!isConnected && !isLoading && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      zIndex: 1000,
                    }}
                  >
                    <Typography variant="body2" color="error">
                      Could not connect to camera
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => initializeStream()}
                      sx={{ mt: 2 }}
                      size="small"
                    >
                      Retry
                    </Button>
                  </Box>
                )}

                <video
                  key={streamUrl} // force reload on URL change
                  ref={videoRef}
                  className="camera-video"
                  playsInline
                  muted
                  controls={false}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />

                {motionDetected && settingsDraft.motionDetection && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 48,
                      left: 8,
                      display: "flex",
                      alignItems: "center",
                      color: theme.palette.error.main,
                      bgcolor: "rgba(255, 0, 0, 0.15)",
                      borderRadius: 1,
                      px: 1,
                      py: 0.25,
                      fontSize: "0.75rem",
                    }}
                  >
                    <MotionPhotosAuto fontSize="small" />
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      Motion
                    </Typography>
                  </Box>
                )}

                {/* Video controls + PTZ if enabled */}
                <Box
                  className="video-controls"
                  sx={{
                    position: "absolute",
                    bottom: 8,
                    left: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    bgcolor: "rgba(0, 0, 0, 0.3)",
                    borderRadius: 1,
                    px: 1,
                    py: 0.25,
                    userSelect: "none",
                    zIndex: 1200,
                  }}
                >
                  <Tooltip title={isPlaying ? "Pause" : "Play"}>
                    <IconButton onClick={togglePlayPause} size="small" sx={{ color: "#fff" }}>
                      {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
                    </IconButton>
                  </Tooltip>

                  {/* PTZ Controls */}
                  {settingsDraft.ptz && (
                    <Box
                      className="ptz-controls"
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        ml: 1,
                        gap: 0.5,
                      }}
                    >
                      <IconButton onClick={() => handlePtzControl("up")} size="small" sx={{ color: "#fff" }}>
                        <ArrowUpward fontSize="small" />
                      </IconButton>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton onClick={() => handlePtzControl("left")} size="small" sx={{ color: "#fff" }}>
                          <ArrowBack fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => handlePtzControl("home")} size="small" sx={{ color: "#fff" }}>
                          <Home fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => handlePtzControl("right")} size="small" sx={{ color: "#fff" }}>
                          <ArrowForward fontSize="small" />
                        </IconButton>
                      </Box>
                      <IconButton onClick={() => handlePtzControl("down")} size="small" sx={{ color: "#fff" }}>
                        <ArrowDownward fontSize="small" />
                      </IconButton>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton onClick={() => handlePtzControl("zoom_in")} size="small" sx={{ color: "#fff" }}>
                          <ZoomIn fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => handlePtzControl("zoom_out")} size="small" sx={{ color: "#fff" }}>
                          <ZoomOut fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  )}

                  <Box
                    className="camera-info"
                    sx={{
                      ml: "auto",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      color: "#fff",
                      fontSize: "0.75rem",
                      userSelect: "none",
                      fontFamily: "monospace",
                    }}
                  >
                    <Typography className="timestamp">{currentTime.toLocaleTimeString()}</Typography>
                    {isLive && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          bgcolor: "rgba(255, 0, 0, 0.75)",
                          borderRadius: 1,
                          px: 1,
                          py: 0.25,
                          fontWeight: "bold",
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: "#fff",
                            animation: "pulse-red 1.5s infinite",
                          }}
                        />
                        LIVE
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Sidebar Events */}
              {isSidebarVisible && (
                <Box
                  sx={{
                    width: 280,
                    borderLeft: `1px solid ${theme.palette.divider}`,
                    height: "100%",
                    position: "relative",
                    bgcolor: theme.palette.background.paper,
                    boxShadow: theme.shadows[1],
                    userSelect: "none",
                  }}
                >
                  <CameraEventSidebar isLive={isLive} currentTime={videoRef.current?.currentTime || 0} />
                </Box>
              )}
            </Box>

            {/* Tabs at bottom */}
            {showBottomOptions && (
              <>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="fullWidth"
                  className="camera-tabs"
                  TabIndicatorProps={{ style: { height: 2 } }}
                  sx={{ minHeight: "32px" }}
                >
                  <Tab label="Live" disabled={!isLive} sx={{ minHeight: "32px", fontSize: "0.75rem" }} />
                  <Tab label="Playback" sx={{ minHeight: "32px", fontSize: "0.75rem" }} />
                  <Tab label="Alerts" sx={{ minHeight: "32px", fontSize: "0.75rem" }} />
                </Tabs>

                <Box sx={{ flex: 1, overflowY: "auto", pt: 1 }}>
                  {activeTab === 0 && isLive && (
                    <Box sx={{ px: 2 }}>
                      <Typography variant="body2">Stream Status: {isConnected ? "Connected" : "Disconnected"}</Typography>
                      <Typography variant="body2">Motion Detection: {settingsDraft.motionDetection ? "Enabled" : "Disabled"}</Typography>
                      <Typography variant="body2">Notifications: {settingsDraft.notifications ? "Enabled" : "Disabled"}</Typography>
                    </Box>
                  )}

                  {activeTab === 1 && (
                    <Box sx={{ px: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Select Date:
                      </Typography>
                      <input
                        type="date"
                        value={selectedDate.toISOString().split("T")[0]}
                        onChange={(e) => handleDateChange(new Date(e.target.value))}
                        className="date-input"
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          fontSize: "0.875rem",
                          borderRadius: 4,
                          borderColor: theme.palette.divider,
                        }}
                      />
                      <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
                        Time Range: {formatTimeRange(timeRange)}
                      </Typography>
                      <Slider
                        value={timeRange}
                        onChange={handleTimeRangeChange}
                        valueLabelDisplay="auto"
                        min={0}
                        max={24}
                        step={1}
                        size="small"
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => loadRecordingForDate(selectedDate, timeRange)}
                        fullWidth
                        sx={{ mt: 2 }}
                        size="small"
                      >
                        Load Recording
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={toggleLiveMode}
                        fullWidth
                        sx={{ mt: 1 }}
                        size="small"
                      >
                        {isLive ? "Switch to Playback" : "Switch to Live"}
                      </Button>
                    </Box>
                  )}

                  {activeTab === 2 && (
                    <Box sx={{ px: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Typography variant="subtitle2">Recent Alerts ({alerts.length})</Typography>
                        <Button variant="outlined" size="small" onClick={clearAllAlerts} disabled={alerts.length === 0}>
                          Clear All
                        </Button>
                      </Box>
                      <Box>
                        {alerts.length === 0 ? (
                          <Typography variant="body2" color="textSecondary" sx={{ textAlign: "center", py: 2 }}>
                            No alerts to display
                          </Typography>
                        ) : (
                          alerts.map((alert) => (
                            <Box
                              key={alert.id}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                py: 1,
                                borderBottom: `1px solid ${theme.palette.divider}`,
                              }}
                            >
                              <Box>
                                <Typography variant="body2">{alert.message}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {alert.timestamp.toLocaleTimeString()}
                                </Typography>
                              </Box>
                              <IconButton size="small" onClick={() => deleteAlert(alert.id)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          ))
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default CameraWidget







// "use client"

// import { useState, useEffect, useRef } from "react"
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   IconButton,
//   Menu,
//   MenuItem,
//   Typography,
//   Box,
//   CircularProgress,
//   Tabs,
//   Tab,
//   Button,
//   TextField,
//   Slider,
//   useTheme,
// } from "@mui/material"
// import {
//   MoreVert,
//   Videocam,
//   Pause,
//   PlayArrow,
//   Settings,
//   Fullscreen,
//   FullscreenExit,
//   Save,
//   Cancel,
//   CalendarToday,
//   MotionPhotosAuto,
//   Visibility,
//   VisibilityOff,
//   Delete,
//   ArrowUpward,
//   ArrowDownward,
//   ArrowBack,
//   ArrowForward,
//   Home,
//   ZoomIn,
//   ZoomOut,
// } from "@mui/icons-material"
// import Hls from "hls.js"
// import "../../../styles/camera-widget.css"
// import CameraEventSidebar from "./CameraEventSidebar"

// const LOG_PREFIX = "[CameraWidget]"

// const CameraWidget = ({ config, onConfigChange }) => {
//   const theme = useTheme()

//   // --- State
//   const [anchorEl, setAnchorEl] = useState(null)
//   const [activeTab, setActiveTab] = useState(0)
//   const [isFullscreen, setIsFullscreen] = useState(false)
//   const [isSettingsVisible, setIsSettingsVisible] = useState(false)
//   const [isPlaying, setIsPlaying] = useState(true)
//   const [isLoading, setIsLoading] = useState(true)
//   const [isConnected, setIsConnected] = useState(false)
//   const [isLive, setIsLive] = useState(true)
//   const [currentTime, setCurrentTime] = useState(new Date())
//   const [alerts, setAlerts] = useState([])
//   const [motionDetected, setMotionDetected] = useState(false)
//   const [settingsDraft, setSettingsDraft] = useState({ ...(config || {}) })
//   const [selectedDate, setSelectedDate] = useState(new Date())
//   const [timeRange, setTimeRange] = useState([0, 24])
//   const [isSidebarVisible, setIsSidebarVisible] = useState(false)

//   const videoRef = useRef(null)
//   const hlsRef = useRef(null)
//   const containerRef = useRef(null)
//   const retryCountRef = useRef(0)
//   const MAX_RETRIES = 2

//   const dataSource = config?.dataSource || {}
//   const streamUrl = dataSource.streamUrl || ""

//   useEffect(() => {
//     setSettingsDraft({ ...(config || {}) })
//   }, [config])

//   useEffect(() => {
//     if (!streamUrl || !streamUrl.trim().startsWith("http")) {
//       setIsLoading(false)
//       setIsConnected(false)
//       destroyStream()
//       return
//     }
//     if (isLive) initializeStream(streamUrl)
//     else loadRecordingForDate(selectedDate, timeRange, streamUrl)

//     const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)
//     const motionInterval = setInterval(() => {
//       if (config.motionDetection) {
//         const detected = Math.random() > 0.7
//         setMotionDetected(detected)
//         if (detected && config.notifications) addAlert("Motion detected")
//       }
//     }, 10000)

//     return () => {
//       destroyStream()
//       clearInterval(timeInterval)
//       clearInterval(motionInterval)
//     }
//   }, [
//     isLive,
//     selectedDate,
//     timeRange,
//     config.motionDetection,
//     config.notifications,
//     streamUrl,
//     isSettingsVisible,
//   ])

//   // STREAM HANDLERS
//   const initializeStream = (url = streamUrl) => {
//     const safeUrl = typeof url === "string" ? url.trim() : ""
//     if (!safeUrl || !safeUrl.startsWith("http")) {
//       addAlert("Invalid stream URL")
//       setIsLoading(false)
//       setIsConnected(false)
//       return
//     }
//     setIsLoading(true)
//     setIsConnected(false)
//     destroyStream()

//     if (Hls.isSupported() && videoRef.current) {
//       const hls = new Hls({ debug: false, enableWorker: true })
//       hlsRef.current = hls
//       hls.attachMedia(videoRef.current)
//       hls.loadSource(safeUrl)
//       hls.on(Hls.Events.MANIFEST_PARSED, () => {
//         setIsLoading(false)
//         setIsConnected(true)
//         retryCountRef.current = 0
//         if (isPlaying) videoRef.current.play().catch(() => {})
//       })
//       hls.on(Hls.Events.ERROR, (event, data) => {
//         if (data.fatal) {
//           if (retryCountRef.current < MAX_RETRIES) {
//             retryCountRef.current++
//             hls.startLoad()
//           } else {
//             setIsConnected(false)
//             setIsLoading(false)
//             addAlert(`Stream error: ${data.details}`)
//             destroyStream()
//           }
//         }
//       })
//     } else if (videoRef.current?.canPlayType("application/vnd.apple.mpegurl")) {
//       videoRef.current.src = safeUrl
//       videoRef.current.addEventListener("loadedmetadata", () => {
//         setIsLoading(false)
//         setIsConnected(true)
//         if (isPlaying) videoRef.current.play().catch(() => {})
//       })
//       videoRef.current.addEventListener("error", () => {
//         setIsConnected(false)
//         setIsLoading(false)
//         addAlert("Safari player failed to load stream.")
//       })
//     } else {
//       setIsConnected(false)
//       setIsLoading(false)
//       addAlert("HLS not supported in this browser")
//     }
//   }

//   const destroyStream = () => {
//     if (hlsRef.current) {
//       try {
//         hlsRef.current.destroy()
//       } catch {}
//       hlsRef.current = null
//     }
//     if (videoRef.current) {
//       videoRef.current.pause()
//       videoRef.current.removeAttribute("src")
//       try {
//         videoRef.current.load()
//       } catch {}
//     }
//   }

//   // UI Handlers
//   const togglePlayPause = () => {
//     if (videoRef.current) {
//       if (isPlaying) videoRef.current.pause()
//       else videoRef.current.play().catch(() => {})
//       setIsPlaying(!isPlaying)
//     }
//   }

//   const toggleFullscreen = () => {
//     if (!document.fullscreenElement) {
//       containerRef.current.requestFullscreen().catch(() => {})
//       setIsFullscreen(true)
//     } else {
//       document.exitFullscreen()
//       setIsFullscreen(false)
//     }
//   }

//   const handleMenuOpen = (event) => setAnchorEl(event.currentTarget)
//   const handleMenuClose = () => setAnchorEl(null)
//   const handleTabChange = (event, newValue) => setActiveTab(newValue)
//   const toggleSettings = () => {
//     setIsSettingsVisible(!isSettingsVisible)
//     handleMenuClose()
//   }

//   const handleConfigChange = (field, value) => {
//     setSettingsDraft((prev) => {
//       const updated = { ...prev, [field]: value }
//       return updated
//     })
//   }

//   const saveSettings = () => {
//     const updatedConfig = {
//       ...settingsDraft,
//       dataSource: {
//         ...settingsDraft.dataSource,
//         streamUrl: settingsDraft.dataSource?.streamUrl,
//       },
//     }
//     onConfigChange?.(updatedConfig)
//     setIsSettingsVisible(false)
//     setIsPlaying(true)
//   }

//   const cancelSettings = () => {
//     setSettingsDraft({ ...(config || {}) })
//     setIsSettingsVisible(false)
//   }

//   const addAlert = (message) => {
//     const newAlert = {
//       id: Date.now(),
//       message,
//       timestamp: new Date(),
//     }
//     setAlerts((prev) => [newAlert, ...prev].slice(0, 50))
//   }
//   const deleteAlert = (alertId) => {
//     setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
//   }
//   const clearAllAlerts = () => setAlerts([])

//   const loadRecordingForDate = (date, timeRange, url = streamUrl) => {
//     const safeUrl = typeof url === "string" ? url.trim() : ""
//     if (!safeUrl || !safeUrl.startsWith("http")) {
//       addAlert("Invalid playback stream URL")
//       setIsLoading(false)
//       setIsConnected(false)
//       return
//     }
//     setIsLoading(true)
//     setIsConnected(false)
//     destroyStream()

//     if (Hls.isSupported() && videoRef.current) {
//       const hls = new Hls()
//       hlsRef.current = hls
//       hls.loadSource(safeUrl)
//       hls.attachMedia(videoRef.current)
//       hls.on(Hls.Events.MANIFEST_PARSED, () => {
//         videoRef.current.play().catch(() => {})
//         setIsLoading(false)
//         setIsConnected(true)
//         const dateStr = date.toISOString().split("T")[0]
//         const start = timeRange[0].toString().padStart(2, "0")
//         const end = timeRange[1].toString().padStart(2, "0")
//         addAlert(`Loaded recording for ${dateStr} ${start}:00–${end}:00`)
//       })
//     } else if (videoRef.current?.canPlayType("application/vnd.apple.mpegurl")) {
//       videoRef.current.src = safeUrl
//       videoRef.current.addEventListener("loadedmetadata", () => {
//         videoRef.current.play().catch(() => {})
//         setIsLoading(false)
//         setIsConnected(true)
//       })
//     } else {
//       setIsConnected(false)
//       setIsLoading(false)
//       addAlert("Playback stream not supported")
//     }
//   }

//   const toggleLiveMode = () => {
//     setIsLive((prev) => !prev)
//     if (!isLive) {
//       destroyStream()
//       initializeStream()
//     }
//   }

//   const handleDateChange = (date) => setSelectedDate(date)
//   const handleTimeRangeChange = (event, newValue) => setTimeRange(newValue)
//   const formatTimeRange = (range) => `${range[0]}:00 - ${range[1]}:00`

//   // PTZ Controls (simulated)
//   const handlePtzControl = (direction) => {
//     if (config.ptz) {
//       addAlert(`PTZ Command: ${direction}`)
//     }
//   }

//   // --- JSX ---
//   return (
//     <Card ref={containerRef} className="camera-widget" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
//       <CardHeader
//         title={config.title}
//         className="camera-header"
//         titleTypographyProps={{ variant: "subtitle2" }}
//         action={
//           <>
//             <IconButton onClick={handleMenuOpen} size="small">
//               <MoreVert fontSize="small" />
//             </IconButton>
//             <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
//               <MenuItem onClick={toggleSettings}>
//                 <Settings fontSize="small" sx={{ mr: 1 }} />
//                 Settings
//               </MenuItem>
//               <MenuItem onClick={toggleFullscreen}>
//                 {isFullscreen ? (
//                   <>
//                     <FullscreenExit fontSize="small" sx={{ mr: 1 }} />
//                     Exit Fullscreen
//                   </>
//                 ) : (
//                   <>
//                     <Fullscreen fontSize="small" sx={{ mr: 1 }} />
//                     Fullscreen
//                   </>
//                 )}
//               </MenuItem>
//               <MenuItem onClick={toggleLiveMode}>
//                 {isLive ? (
//                   <>
//                     <CalendarToday fontSize="small" sx={{ mr: 1 }} />
//                     View Recordings
//                   </>
//                 ) : (
//                   <>
//                     <Videocam fontSize="small" sx={{ mr: 1 }} />
//                     Live View
//                   </>
//                 )}
//               </MenuItem>
//               <MenuItem onClick={() => addAlert("Screenshot taken")}>
//                 <Videocam fontSize="small" sx={{ mr: 1 }} />
//                 Take Screenshot
//               </MenuItem>
//             </Menu>
//           </>
//         }
//       />

//       <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", p: 0 }}>
//         {isSettingsVisible ? (
//           <Box sx={{ p: 2 }}>
//             <Typography variant="h6" gutterBottom>
//               Camera Settings
//             </Typography>
//             <TextField
//               label="Camera Name"
//               value={settingsDraft.title}
//               onChange={(e) => handleConfigChange("title", e.target.value)}
//               fullWidth
//               margin="normal"
//               size="small"
//             />
//             {settingsDraft.dataSource && (
//               <TextField
//                 label="Stream URL"
//                 value={settingsDraft.dataSource.streamUrl}
//                 onChange={(e) =>
//                   handleConfigChange("dataSource", {
//                     ...settingsDraft.dataSource,
//                     streamUrl: e.target.value,
//                   })
//                 }
//                 fullWidth
//                 margin="normal"
//                 size="small"
//               />
//             )}
//             <Box mt={2} display="flex" justifyContent="flex-end">
//               <Button
//                 variant="outlined"
//                 color="secondary"
//                 startIcon={<Cancel />}
//                 onClick={cancelSettings}
//                 sx={{ mr: 1 }}
//                 size="small"
//               >
//                 Cancel
//               </Button>
//               <Button variant="contained" color="primary" startIcon={<Save />} onClick={saveSettings} size="small">
//                 Save
//               </Button>
//             </Box>
//           </Box>
//         ) : (
//           <>
//             {!isSidebarVisible ? (
//               <Box
//                 sx={{
//                   position: "absolute",
//                   top: 10,
//                   right: 40,
//                   zIndex: 1000,
//                 }}
//               >
//                 <Button
//                   size="small"
//                   variant="contained"
//                   color="primary"
//                   onClick={() => setIsSidebarVisible(true)}
//                   startIcon={<Visibility fontSize="small" />}
//                   sx={{ minWidth: 90 }}
//                 >
//                   Events
//                 </Button>
//               </Box>
//             ) : (
//               <Box
//                 sx={{
//                   position: "absolute",
//                   top: 10,
//                   right: 40,
//                   zIndex: 1000,
//                 }}
//               >
//                 <Button
//                   size="small"
//                   variant="contained"
//                   color="primary"
//                   onClick={() => setIsSidebarVisible(false)}
//                   startIcon={<VisibilityOff fontSize="small" />}
//                   sx={{ minWidth: 90 }}
//                 >
//                   Hide
//                 </Button>
//               </Box>
//             )}

//             <Box sx={{ display: "flex", flex: 1, height: "100%", overflow: "hidden", position: "relative" }}>
//               <Box
//                 className="video-container"
//                 sx={{
//                   flex: 1,
//                   position: "relative",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   overflow: "hidden",
//                   p: 0,
//                 }}
//               >
//                 {isLoading && (
//                   <Box
//                     sx={{
//                       position: "absolute",
//                       top: "50%",
//                       left: "50%",
//                       transform: "translate(-50%, -50%)",
//                       display: "flex",
//                       flexDirection: "column",
//                       alignItems: "center",
//                       zIndex: 1000,
//                     }}
//                   >
//                     <CircularProgress size={30} />
//                     <Typography variant="caption" sx={{ mt: 1 }}>
//                       Connecting...
//                     </Typography>
//                   </Box>
//                 )}

//                 {!isConnected && !isLoading && (
//                   <Box
//                     sx={{
//                       position: "absolute",
//                       top: "50%",
//                       left: "50%",
//                       transform: "translate(-50%, -50%)",
//                       display: "flex",
//                       flexDirection: "column",
//                       alignItems: "center",
//                       zIndex: 1000,
//                     }}
//                   >
//                     <Typography variant="body2" color="error">
//                       Could not connect to camera
//                     </Typography>
//                     <Button
//                       variant="contained"
//                       color="primary"
//                       onClick={() => initializeStream()}
//                       sx={{ mt: 2 }}
//                       size="small"
//                     >
//                       Retry
//                     </Button>
//                   </Box>
//                 )}

//                 <video
//                   key={streamUrl} // force reload on URL change
//                   ref={videoRef}
//                   className="camera-video"
//                   playsInline
//                   muted
//                   controls={false}
//                   style={{ width: "100%", height: "100%", objectFit: "contain" }}
//                 />

//                 {motionDetected && config.motionDetection && (
//                   <Box
//                     sx={{
//                       position: "absolute",
//                       top: 8,
//                       left: 8,
//                       display: "flex",
//                       alignItems: "center",
//                       color: theme.palette.error.main,
//                       bgcolor: "rgba(255, 0, 0, 0.15)",
//                       borderRadius: 1,
//                       px: 1,
//                       py: 0.25,
//                       fontSize: "0.75rem",
//                     }}
//                   >
//                     <MotionPhotosAuto fontSize="small" />
//                     <Typography variant="caption" sx={{ ml: 0.5 }}>
//                       Motion
//                     </Typography>
//                   </Box>
//                 )}

//                 <Box
//                   className="video-controls"
//                   sx={{
//                     position: "absolute",
//                     bottom: 8,
//                     left: 8,
//                     display: "flex",
//                     alignItems: "center",
//                     gap: 1,
//                     bgcolor: "rgba(0, 0, 0, 0.3)",
//                     borderRadius: 1,
//                     px: 1,
//                     py: 0.25,
//                   }}
//                 >
//                   <IconButton onClick={togglePlayPause} size="small" sx={{ color: "#fff" }}>
//                     {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
//                   </IconButton>

//                   {config.ptz && (
//                     <Box className="ptz-controls" sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
//                       <IconButton onClick={() => handlePtzControl("up")} size="small" sx={{ color: "#fff" }}>
//                         <ArrowUpward fontSize="small" />
//                       </IconButton>
//                       <Box sx={{ display: "flex", gap: 0.5 }}>
//                         <IconButton onClick={() => handlePtzControl("left")} size="small" sx={{ color: "#fff" }}>
//                           <ArrowBack fontSize="small" />
//                         </IconButton>
//                         <IconButton onClick={() => handlePtzControl("home")} size="small" sx={{ color: "#fff" }}>
//                           <Home fontSize="small" />
//                         </IconButton>
//                         <IconButton onClick={() => handlePtzControl("right")} size="small" sx={{ color: "#fff" }}>
//                           <ArrowForward fontSize="small" />
//                         </IconButton>
//                       </Box>
//                       <IconButton onClick={() => handlePtzControl("down")} size="small" sx={{ color: "#fff" }}>
//                         <ArrowDownward fontSize="small" />
//                       </IconButton>
//                       <Box sx={{ display: "flex", gap: 0.5 }}>
//                         <IconButton onClick={() => handlePtzControl("zoom_in")} size="small" sx={{ color: "#fff" }}>
//                           <ZoomIn fontSize="small" />
//                         </IconButton>
//                         <IconButton onClick={() => handlePtzControl("zoom_out")} size="small" sx={{ color: "#fff" }}>
//                           <ZoomOut fontSize="small" />
//                         </IconButton>
//                       </Box>
//                     </Box>
//                   )}

//                   <Box className="camera-info" sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1, color: "#fff" }}>
//                     <Typography variant="caption" className="timestamp">
//                       {currentTime.toLocaleTimeString()}
//                     </Typography>
//                     {isLive && (
//                       <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
//                         <Box
//                           className="live-dot"
//                           sx={{
//                             width: 8,
//                             height: 8,
//                             borderRadius: "50%",
//                             bgcolor: "red",
//                           }}
//                         />
//                         <Typography variant="caption">LIVE</Typography>
//                       </Box>
//                     )}
//                   </Box>
//                 </Box>
//               </Box>

//               {isSidebarVisible && (
//                 <Box
//                   sx={{
//                     width: 280,
//                     borderLeft: `1px solid ${theme.palette.divider}`,
//                     height: "100%",
//                     position: "relative",
//                     bgcolor: theme.palette.background.paper,
//                     boxShadow: theme.shadows[1],
//                   }}
//                 >
//                   <CameraEventSidebar isLive={isLive} currentTime={videoRef.current?.currentTime || 0} />
//                 </Box>
//               )}
//             </Box>

//             <Tabs
//               value={activeTab}
//               onChange={handleTabChange}
//               variant="fullWidth"
//               className="camera-tabs"
//               TabIndicatorProps={{ style: { height: 2 } }}
//               sx={{ minHeight: "32px" }}
//             >
//               <Tab label="Live" disabled={!isLive} sx={{ minHeight: "32px", fontSize: "0.75rem" }} />
//               <Tab label="Playback" sx={{ minHeight: "32px", fontSize: "0.75rem" }} />
//               <Tab label="Alerts" sx={{ minHeight: "32px", fontSize: "0.75rem" }} />
//             </Tabs>

//             <Box sx={{ flex: 1, overflowY: "auto", pt: 1 }}>
//               {activeTab === 0 && isLive && (
//                 <Box sx={{ px: 2 }}>
//                   <Typography variant="body2">Stream Status: {isConnected ? "Connected" : "Disconnected"}</Typography>
//                   <Typography variant="body2">Motion Detection: {config.motionDetection ? "Enabled" : "Disabled"}</Typography>
//                   <Typography variant="body2">Notifications: {config.notifications ? "Enabled" : "Disabled"}</Typography>
//                 </Box>
//               )}

//               {activeTab === 1 && (
//                 <Box sx={{ px: 2 }}>
//                   <Box sx={{ mb: 1 }}>
//                     <Typography variant="body2" gutterBottom>
//                       Select Date:
//                     </Typography>
//                     <input
//                       type="date"
//                       value={selectedDate.toISOString().split("T")[0]}
//                       onChange={(e) => handleDateChange(new Date(e.target.value))}
//                       className="date-input"
//                       style={{ width: "100%", padding: "6px 8px", fontSize: "0.875rem", borderRadius: 4, borderColor: theme.palette.divider }}
//                     />
//                   </Box>
//                   <Box sx={{ mb: 2 }}>
//                     <Typography variant="body2">Time Range: {formatTimeRange(timeRange)}</Typography>
//                     <Slider
//                       value={timeRange}
//                       onChange={handleTimeRangeChange}
//                       valueLabelDisplay="auto"
//                       min={0}
//                       max={24}
//                       step={1}
//                       size="small"
//                     />
//                   </Box>
//                   <Button variant="contained" color="primary" onClick={() => loadRecordingForDate(selectedDate, timeRange)} fullWidth size="small">
//                     Load Recording
//                   </Button>
//                   <Button
//                     variant="outlined"
//                     color="primary"
//                     onClick={toggleLiveMode}
//                     fullWidth
//                     sx={{ mt: 1 }}
//                     size="small"
//                   >
//                     {isLive ? "Switch to Playback" : "Switch to Live"}
//                   </Button>
//                 </Box>
//               )}

//               {activeTab === 2 && (
//                 <Box sx={{ px: 2 }}>
//                   <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
//                     <Typography variant="subtitle2">Recent Alerts ({alerts.length})</Typography>
//                     <Button variant="outlined" size="small" onClick={clearAllAlerts} disabled={alerts.length === 0}>
//                       Clear All
//                     </Button>
//                   </Box>
//                   <Box>
//                     {alerts.length === 0 ? (
//                       <Typography variant="body2" color="textSecondary" sx={{ textAlign: "center", py: 2 }}>
//                         No alerts to display
//                       </Typography>
//                     ) : (
//                       alerts.map((alert) => (
//                         <Box
//                           key={alert.id}
//                           sx={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                             alignItems: "center",
//                             py: 1,
//                             borderBottom: `1px solid ${theme.palette.divider}`,
//                           }}
//                         >
//                           <Box>
//                             <Typography variant="body2">{alert.message}</Typography>
//                             <Typography variant="caption" color="textSecondary">
//                               {alert.timestamp.toLocaleTimeString()}
//                             </Typography>
//                           </Box>
//                           <IconButton size="small" onClick={() => deleteAlert(alert.id)}>
//                             <Delete fontSize="small" />
//                           </IconButton>
//                         </Box>
//                       ))
//                     )}
//                   </Box>
//                 </Box>
//               )}
//             </Box>
//           </>
//         )}
//       </CardContent>
//     </Card>
//   )
// }

// export default CameraWidget


// "use client"

// import { useState, useEffect, useRef } from "react"
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   IconButton,
//   Menu,
//   MenuItem,
//   Typography,
//   Box,
//   CircularProgress,
//   Tabs,
//   Tab,
//   Button,
//   TextField,
//   Switch,
//   FormControlLabel,
//   Slider,
// } from "@mui/material"
// import {
//   MoreVert,
//   Videocam,
//   Pause,
//   PlayArrow,
//   Settings,
//   Fullscreen,
//   FullscreenExit,
//   Save,
//   Cancel,
//   CalendarToday,
//   MotionPhotosAuto,
//   Visibility,
//   VisibilityOff,
//   Delete,
//   ArrowUpward,
//   ArrowDownward,
//   ArrowBack,
//   ArrowForward,
//   Home,
//   ZoomIn,
//   ZoomOut,
// } from "@mui/icons-material"
// import Hls from "hls.js"
// import "../../../styles/camera-widget.css"
// import CameraEventSidebar from "./CameraEventSidebar"

// const LOG_PREFIX = "[CameraWidget]"

// const CameraWidget = ({ config, onConfigChange }) => {
//   // --- State
//   const [anchorEl, setAnchorEl] = useState(null)
//   const [activeTab, setActiveTab] = useState(0)
//   const [isFullscreen, setIsFullscreen] = useState(false)
//   const [isSettingsVisible, setIsSettingsVisible] = useState(false)
//   const [isPlaying, setIsPlaying] = useState(true)
//   const [isLoading, setIsLoading] = useState(true)
//   const [isConnected, setIsConnected] = useState(false)
//   const [isLive, setIsLive] = useState(true)
//   const [currentTime, setCurrentTime] = useState(new Date())
//   const [alerts, setAlerts] = useState([])
//   const [motionDetected, setMotionDetected] = useState(false)
//   const [showPassword, setShowPassword] = useState(false)
//   const [settingsDraft, setSettingsDraft] = useState({ ...config })
//   const [selectedDate, setSelectedDate] = useState(new Date())
//   const [timeRange, setTimeRange] = useState([0, 24])
//   const [isSidebarVisible, setIsSidebarVisible] = useState(false)

//   const videoRef = useRef(null)
//   const hlsRef = useRef(null)
//   const containerRef = useRef(null)
//   const retryCountRef = useRef(0)
//   const MAX_RETRIES = 2

//   // --- Always resolve the correct streamUrl
//   const resolvedStreamUrl =
//     config?.dataSource?.streamUrl ||
//     config?.streamUrl ||
//     ""
//   const mergedConfig = { ...config, streamUrl: resolvedStreamUrl }
//   const [currentStreamUrl, setCurrentStreamUrl] = useState(resolvedStreamUrl)

//   // Sync on config change
//   useEffect(() => {
//     setSettingsDraft({ ...mergedConfig })
//     setCurrentStreamUrl(mergedConfig.streamUrl)
//     // eslint-disable-next-line
//   }, [config])

//   // --- Main effect for live/playback
//   useEffect(() => {
//     if (!currentStreamUrl || !currentStreamUrl.trim().startsWith("http")) {
//       setIsLoading(false)
//       setIsConnected(false)
//       destroyStream()
//       return
//     }
//     if (isLive) {
//       initializeStream(currentStreamUrl)
//     } else {
//       loadRecordingForDate(selectedDate, timeRange, currentStreamUrl)
//     }

//     const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)
//     const motionInterval = setInterval(() => {
//       if (mergedConfig.motionDetection) {
//         const detected = Math.random() > 0.7
//         setMotionDetected(detected)
//         if (detected && mergedConfig.notifications) addAlert("Motion detected")
//       }
//     }, 10000)

//     return () => {
//       destroyStream()
//       clearInterval(timeInterval)
//       clearInterval(motionInterval)
//     }
//     // eslint-disable-next-line
//   }, [
//     isLive,
//     selectedDate,
//     timeRange,
//     mergedConfig.motionDetection,
//     mergedConfig.notifications,
//     currentStreamUrl,
//   ])

//   // --- STREAM HANDLERS ---

//   const initializeStream = (url = currentStreamUrl) => {
//     const safeUrl = typeof url === 'string' ? url.trim() : ''
//     if (!safeUrl || !safeUrl.startsWith('http')) {
//       addAlert("Invalid stream URL")
//       setIsLoading(false)
//       setIsConnected(false)
//       return
//     }
//     setIsLoading(true)
//     setIsConnected(false)
//     destroyStream()

//     if (Hls.isSupported() && videoRef.current) {
//       const hls = new Hls({ debug: false, enableWorker: true })
//       hlsRef.current = hls
//       hls.attachMedia(videoRef.current)
//       hls.loadSource(safeUrl)
//       hls.on(Hls.Events.MANIFEST_PARSED, () => {
//         setIsLoading(false)
//         setIsConnected(true)
//         retryCountRef.current = 0
//         if (isPlaying) {
//           videoRef.current.play().catch(() => {})
//         }
//       })
//       hls.on(Hls.Events.ERROR, (event, data) => {
//         if (data.fatal) {
//           if (retryCountRef.current < MAX_RETRIES) {
//             retryCountRef.current++
//             hls.startLoad()
//           } else {
//             setIsConnected(false)
//             setIsLoading(false)
//             addAlert(`Stream error: ${data.details}`)
//             destroyStream()
//           }
//         }
//       })
//     } else if (videoRef.current?.canPlayType("application/vnd.apple.mpegurl")) {
//       videoRef.current.src = safeUrl
//       videoRef.current.addEventListener("loadedmetadata", () => {
//         setIsLoading(false)
//         setIsConnected(true)
//         if (isPlaying) videoRef.current.play().catch(() => {})
//       })
//       videoRef.current.addEventListener("error", () => {
//         setIsConnected(false)
//         setIsLoading(false)
//         addAlert("Safari player failed to load stream.")
//       })
//     } else {
//       setIsConnected(false)
//       setIsLoading(false)
//       addAlert("HLS not supported in this browser")
//     }
//   }

//   const destroyStream = () => {
//     if (hlsRef.current) {
//       hlsRef.current.destroy()
//       hlsRef.current = null
//     }
//     if (videoRef.current) {
//       videoRef.current.pause()
//       videoRef.current.removeAttribute("src")
//       videoRef.current.load()
//     }
//   }

//   // -- UI Handlers --

//   const togglePlayPause = () => {
//     if (videoRef.current) {
//       if (isPlaying) videoRef.current.pause()
//       else videoRef.current.play().catch(() => {})
//       setIsPlaying(!isPlaying)
//     }
//   }

//   const toggleFullscreen = () => {
//     if (!document.fullscreenElement) {
//       containerRef.current.requestFullscreen().catch(() => {})
//       setIsFullscreen(true)
//     } else {
//       document.exitFullscreen()
//       setIsFullscreen(false)
//     }
//   }

//   const handleMenuOpen = (event) => setAnchorEl(event.currentTarget)
//   const handleMenuClose = () => setAnchorEl(null)
//   const handleTabChange = (event, newValue) => setActiveTab(newValue)
//   const toggleSettings = () => {
//     setIsSettingsVisible(!isSettingsVisible)
//     handleMenuClose()
//   }

//   // Settings (draft state only for panel)
//   const handleConfigChange = (field, value) => {
//     setSettingsDraft((prev) => ({
//       ...prev,
//       [field]: value,
//     }))
//   }

//   const saveSettings = () => {
//     onConfigChange?.(settingsDraft)
//     setIsSettingsVisible(false)
//     setIsPlaying(true)
//     setCurrentStreamUrl(settingsDraft.streamUrl)
//   }

//   const cancelSettings = () => {
//     setSettingsDraft({ ...mergedConfig })
//     setIsSettingsVisible(false)
//   }

//   const addAlert = (message) => {
//     const newAlert = {
//       id: Date.now(),
//       message,
//       timestamp: new Date(),
//     }
//     setAlerts((prev) => [newAlert, ...prev].slice(0, 50))
//   }
//   const deleteAlert = (alertId) => {
//     setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
//   }
//   const clearAllAlerts = () => setAlerts([])

//   // -- Playback logic --
//   const loadRecordingForDate = (date, timeRange, streamUrl = currentStreamUrl) => {
//     const safeUrl = typeof streamUrl === 'string' ? streamUrl.trim() : ''
//     if (!safeUrl || !safeUrl.startsWith("http")) {
//       addAlert("Invalid playback stream URL")
//       setIsLoading(false)
//       setIsConnected(false)
//       return
//     }
//     setIsLoading(true)
//     setIsConnected(false)
//     destroyStream()

//     if (Hls.isSupported() && videoRef.current) {
//       const hls = new Hls()
//       hlsRef.current = hls
//       hls.loadSource(safeUrl)
//       hls.attachMedia(videoRef.current)
//       hls.on(Hls.Events.MANIFEST_PARSED, () => {
//         videoRef.current.play().catch(() => {})
//         setIsLoading(false)
//         setIsConnected(true)
//         const dateStr = date.toISOString().split("T")[0]
//         const start = timeRange[0].toString().padStart(2, "0")
//         const end = timeRange[1].toString().padStart(2, "0")
//         addAlert(`Loaded recording for ${dateStr} ${start}:00–${end}:00`)
//       })
//     } else if (videoRef.current?.canPlayType("application/vnd.apple.mpegurl")) {
//       videoRef.current.src = safeUrl
//       videoRef.current.addEventListener("loadedmetadata", () => {
//         videoRef.current.play().catch(() => {})
//         setIsLoading(false)
//         setIsConnected(true)
//       })
//     } else {
//       setIsConnected(false)
//       setIsLoading(false)
//       addAlert("Playback stream not supported")
//     }
//   }

//   const toggleLiveMode = () => {
//     setIsLive((prev) => !prev)
//     if (!isLive) {
//       destroyStream()
//       initializeStream()
//     }
//   }

//   const handleDateChange = (date) => setSelectedDate(date)
//   const handleTimeRangeChange = (event, newValue) => setTimeRange(newValue)
//   const formatTimeRange = (range) => `${range[0]}:00 - ${range[1]}:00`

//   // PTZ Controls (simulated)
//   const handlePtzControl = (direction) => {
//     if (mergedConfig.ptz) {
//       addAlert(`PTZ Command: ${direction}`)
//     }
//   }

//   // --- JSX ---
//   return (
//     <Card ref={containerRef} className="camera-widget">
//       <CardHeader
//         title={mergedConfig.title}
//         className="camera-header"
//         titleTypographyProps={{ variant: "subtitle2" }}
//         action={
//           <>
//             <IconButton onClick={handleMenuOpen} size="small">
//               <MoreVert fontSize="small" />
//             </IconButton>
//             <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
//               <MenuItem onClick={toggleSettings}>
//                 <Settings fontSize="small" style={{ marginRight: 8 }} />
//                 Settings
//               </MenuItem>
//               <MenuItem onClick={toggleFullscreen}>
//                 {isFullscreen ? (
//                   <>
//                     <FullscreenExit fontSize="small" style={{ marginRight: 8 }} />
//                     Exit Fullscreen
//                   </>
//                 ) : (
//                   <>
//                     <Fullscreen fontSize="small" style={{ marginRight: 8 }} />
//                     Fullscreen
//                   </>
//                 )}
//               </MenuItem>
//               <MenuItem onClick={toggleLiveMode}>
//                 {isLive ? (
//                   <>
//                     <CalendarToday fontSize="small" style={{ marginRight: 8 }} />
//                     View Recordings
//                   </>
//                 ) : (
//                   <>
//                     <Videocam fontSize="small" style={{ marginRight: 8 }} />
//                     Live View
//                   </>
//                 )}
//               </MenuItem>
//               <MenuItem onClick={() => addAlert("Screenshot taken")}>
//                 <Videocam fontSize="small" style={{ marginRight: 8 }} />
//                 Take Screenshot
//               </MenuItem>
//             </Menu>
//           </>
//         }
//       />

//       <CardContent className="camera-content">
//         {isSettingsVisible ? (
//           <div className="camera-settings">
//             <Typography variant="h6">Camera Settings</Typography>
//             <TextField
//               label="Camera Name"
//               value={settingsDraft.title}
//               onChange={(e) => handleConfigChange("title", e.target.value)}
//               fullWidth
//               margin="normal"
//               size="small"
//             />
//             <TextField
//               label="Stream URL"
//               value={settingsDraft.streamUrl}
//               onChange={(e) => handleConfigChange("streamUrl", e.target.value)}
//               fullWidth
//               margin="normal"
//               size="small"
//             />
//             <TextField
//               label="Username"
//               value={settingsDraft.username}
//               onChange={(e) => handleConfigChange("username", e.target.value)}
//               fullWidth
//               margin="normal"
//               size="small"
//             />
//             <TextField
//               label="Password"
//               type={showPassword ? "text" : "password"}
//               value={settingsDraft.password}
//               onChange={(e) => handleConfigChange("password", e.target.value)}
//               fullWidth
//               margin="normal"
//               size="small"
//               InputProps={{
//                 endAdornment: (
//                   <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
//                     {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
//                   </IconButton>
//                 ),
//               }}
//             />
//             <TextField
//               label="Refresh Interval (seconds)"
//               type="number"
//               value={settingsDraft.refreshInterval}
//               onChange={(e) => handleConfigChange("refreshInterval", Number.parseInt(e.target.value))}
//               fullWidth
//               margin="normal"
//               size="small"
//             />
//             <FormControlLabel
//               control={
//                 <Switch
//                   checked={settingsDraft.motionDetection}
//                   onChange={(e) => handleConfigChange("motionDetection", e.target.checked)}
//                   size="small"
//                 />
//               }
//               label={<Typography variant="body2">Motion Detection</Typography>}
//             />
//             {settingsDraft.motionDetection && (
//               <div className="setting-group">
//                 <Typography id="motion-sensitivity-slider" variant="body2">
//                   Motion Sensitivity: {settingsDraft.motionSensitivity}%
//                 </Typography>
//                 <Slider
//                   value={settingsDraft.motionSensitivity}
//                   onChange={(e, value) => handleConfigChange("motionSensitivity", value)}
//                   aria-labelledby="motion-sensitivity-slider"
//                   min={0}
//                   max={100}
//                   size="small"
//                 />
//               </div>
//             )}
//             <FormControlLabel
//               control={
//                 <Switch
//                   checked={settingsDraft.notifications}
//                   onChange={(e) => handleConfigChange("notifications", e.target.checked)}
//                   size="small"
//                 />
//               }
//               label={<Typography variant="body2">Enable Notifications</Typography>}
//             />
//             <FormControlLabel
//               control={
//                 <Switch
//                   checked={settingsDraft.recordingEnabled}
//                   onChange={(e) => handleConfigChange("recordingEnabled", e.target.checked)}
//                   size="small"
//                 />
//               }
//               label={<Typography variant="body2">Enable Recording</Typography>}
//             />
//             {settingsDraft.recordingEnabled && (
//               <TextField
//                 label="Storage Retention (days)"
//                 type="number"
//                 value={settingsDraft.storageRetention}
//                 onChange={(e) => handleConfigChange("storageRetention", Number.parseInt(e.target.value))}
//                 fullWidth
//                 margin="normal"
//                 size="small"
//               />
//             )}
//             <FormControlLabel
//               control={
//                 <Switch
//                   checked={settingsDraft.ptz}
//                   onChange={(e) => handleConfigChange("ptz", e.target.checked)}
//                   size="small"
//                 />
//               }
//               label={<Typography variant="body2">PTZ Controls</Typography>}
//             />
//             <Box mt={2} display="flex" justifyContent="flex-end">
//               <Button
//                 variant="outlined"
//                 color="secondary"
//                 startIcon={<Cancel />}
//                 onClick={cancelSettings}
//                 style={{ marginRight: 8 }}
//                 size="small"
//               >
//                 Cancel
//               </Button>
//               <Button variant="contained" color="primary" startIcon={<Save />} onClick={saveSettings} size="small">
//                 Save
//               </Button>
//             </Box>
//           </div>
//         ) : (
//           <>
//             {!isSidebarVisible && (
//               <div style={{ position: "absolute", top: 10, right: 40, zIndex: 1000 }}>
//                 <Button
//                   size="small"
//                   variant="contained"
//                   color="primary"
//                   onClick={() => setIsSidebarVisible(true)}
//                   startIcon={<Visibility fontSize="small" />}
//                 >
//                   Events
//                 </Button>
//               </div>
//             )}
//             {isSidebarVisible && (
//               <div style={{ position: "absolute", top: 10, right: 40, zIndex: 1000 }}>
//                 <Button
//                   size="small"
//                   variant="contained"
//                   color="primary"
//                   onClick={() => setIsSidebarVisible(false)}
//                   startIcon={<VisibilityOff fontSize="small" />}
//                 >
//                   Hide
//                 </Button>
//               </div>
//             )}
//             <div
//               className="camera-left-panel"
//               style={{ display: "flex", flexDirection: "row", padding: 0, position: "relative" }}
//             >
//               <div
//                 className="video-container"
//                 style={{ display: "flex", flexDirection: "row", padding: 0, position: "relative", overflow: "hidden" }}
//               >
//                 {isLoading && (
//                   <div className="loading-overlay">
//                     <CircularProgress size={30} />
//                     <Typography variant="caption" style={{ marginTop: 8 }}>
//                       Connecting...
//                     </Typography>
//                   </div>
//                 )}

//                 {!isConnected && !isLoading && (
//                   <div className="error-overlay">
//                     <Typography variant="body2" color="error">
//                       Could not connect to camera
//                     </Typography>
//                     <Button
//                       variant="contained"
//                       color="primary"
//                       onClick={() => initializeStream()}
//                       style={{ marginTop: 16 }}
//                       size="small"
//                     >
//                       Retry
//                     </Button>
//                   </div>
//                 )}

//                 <video ref={videoRef} className="camera-video" playsInline muted controls={false} />

//                 {motionDetected && mergedConfig.motionDetection && (
//                   <div className="motion-indicator">
//                     <MotionPhotosAuto color="error" fontSize="small" />
//                     <Typography variant="caption" color="error">
//                       Motion
//                     </Typography>
//                   </div>
//                 )}

//                 <div className="video-controls">
//                   <IconButton onClick={togglePlayPause} size="small">
//                     {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
//                   </IconButton>

//                   {mergedConfig.ptz && (
//                     <div className="ptz-controls">
//                       <div className="ptz-row">
//                         <IconButton onClick={() => handlePtzControl("up")} size="small">
//                           <ArrowUpward fontSize="small" />
//                         </IconButton>
//                       </div>
//                       <div className="ptz-row">
//                         <IconButton onClick={() => handlePtzControl("left")} size="small">
//                           <ArrowBack fontSize="small" />
//                         </IconButton>
//                         <IconButton onClick={() => handlePtzControl("home")} size="small">
//                           <Home fontSize="small" />
//                         </IconButton>
//                         <IconButton onClick={() => handlePtzControl("right")} size="small">
//                           <ArrowForward fontSize="small" />
//                         </IconButton>
//                       </div>
//                       <div className="ptz-row">
//                         <IconButton onClick={() => handlePtzControl("down")} size="small">
//                           <ArrowDownward fontSize="small" />
//                         </IconButton>
//                       </div>
//                       <div className="ptz-row">
//                         <IconButton onClick={() => handlePtzControl("zoom_in")} size="small">
//                           <ZoomIn fontSize="small" />
//                         </IconButton>
//                         <IconButton onClick={() => handlePtzControl("zoom_out")} size="small">
//                           <ZoomOut fontSize="small" />
//                         </IconButton>
//                       </div>
//                     </div>
//                   )}

//                   <div className="camera-info">
//                     <Typography variant="caption" className="timestamp">
//                       {currentTime.toLocaleTimeString()}
//                     </Typography>
//                     {isLive && (
//                       <div className="live-indicator">
//                         <span className="live-dot"></span>
//                         <Typography variant="caption">LIVE</Typography>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//               {isSidebarVisible && (
//                 <div style={{ width: "250px", borderLeft: "1px solid #ddd", position: "relative" }}>
//                   <CameraEventSidebar isLive={isLive} currentTime={videoRef.current?.currentTime || 0} />
//                 </div>
//               )}
//             </div>

//             <Tabs
//               value={activeTab}
//               onChange={handleTabChange}
//               variant="fullWidth"
//               className="camera-tabs"
//               TabIndicatorProps={{ style: { height: 2 } }}
//               sx={{ minHeight: "32px" }}
//             >
//               <Tab label="Live" disabled={!isLive} sx={{ minHeight: "32px", fontSize: "0.75rem" }} />
//               <Tab label="Playback" sx={{ minHeight: "32px", fontSize: "0.75rem" }} />
//               <Tab label="Alerts" sx={{ minHeight: "32px", fontSize: "0.75rem" }} />
//             </Tabs>

//             <div className="tab-content">
//               {activeTab === 0 && isLive && (
//                 <div className="live-tab">
//                   <Typography variant="body2">Stream Status: {isConnected ? "Connected" : "Disconnected"}</Typography>
//                   <Typography variant="body2">
//                     Motion Detection: {mergedConfig.motionDetection ? "Enabled" : "Disabled"}
//                   </Typography>
//                   <Typography variant="body2">
//                     Notifications: {mergedConfig.notifications ? "Enabled" : "Disabled"}
//                   </Typography>
//                 </div>
//               )}

//               {activeTab === 1 && (
//                 <div className="playback-tab">
//                   <div className="date-selector">
//                     <Typography variant="body2">Select Date:</Typography>
//                     <input
//                       type="date"
//                       value={selectedDate.toISOString().split("T")[0]}
//                       onChange={(e) => handleDateChange(new Date(e.target.value))}
//                       className="date-input"
//                     />
//                   </div>

//                   <div className="time-selector">
//                     <Typography variant="body2">Time Range: {formatTimeRange(timeRange)}</Typography>
//                     <Slider
//                       value={timeRange}
//                       onChange={handleTimeRangeChange}
//                       valueLabelDisplay="auto"
//                       min={0}
//                       max={24}
//                       step={1}
//                       size="small"
//                     />
//                   </div>

//                   <Button
//                     variant="contained"
//                     color="primary"
//                     onClick={() => loadRecordingForDate(selectedDate, timeRange)}
//                     fullWidth
//                     size="small"
//                   >
//                     Load Recording
//                   </Button>

//                   <Button
//                     variant="outlined"
//                     color="primary"
//                     onClick={toggleLiveMode}
//                     fullWidth
//                     style={{ marginTop: 8 }}
//                     size="small"
//                   >
//                     {isLive ? "Switch to Playback" : "Switch to Live"}
//                   </Button>
//                 </div>
//               )}

//               {activeTab === 2 && (
//                 <div className="alerts-tab">
//                   <div className="alerts-header">
//                     <Typography variant="subtitle2">Recent Alerts ({alerts.length})</Typography>
//                     <Button variant="outlined" size="small" onClick={clearAllAlerts} disabled={alerts.length === 0}>
//                       Clear All
//                     </Button>
//                   </div>

//                   <div className="alerts-list">
//                     {alerts.length === 0 ? (
//                       <Typography variant="body2" className="no-alerts">
//                         No alerts to display
//                       </Typography>
//                     ) : (
//                       alerts.map((alert) => (
//                         <div key={alert.id} className="alert-item">
//                           <div className="alert-content">
//                             <Typography variant="body2">{alert.message}</Typography>
//                             <Typography variant="caption" color="textSecondary">
//                               {alert.timestamp.toLocaleTimeString()}
//                             </Typography>
//                           </div>
//                           <IconButton size="small" onClick={() => deleteAlert(alert.id)}>
//                             <Delete fontSize="small" />
//                           </IconButton>
//                         </div>
//                       ))
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </>
//         )}
//       </CardContent>
//     </Card>
//   )
// }

// export default CameraWidget

// "use client"

// import { useState, useEffect, useRef } from "react"
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   IconButton,
//   Menu,
//   MenuItem,
//   Typography,
//   Box,
//   CircularProgress,
//   Tabs,
//   Tab,
//   Button,
//   TextField,
//   Switch,
//   FormControlLabel,
//   Slider,
// } from "@mui/material"
// import {
//   MoreVert,
//   Videocam,
//   Pause,
//   PlayArrow,
//   Settings,
//   Fullscreen,
//   FullscreenExit,
//   Save,
//   Cancel,
//   CalendarToday,
//   MotionPhotosAuto,
//   Visibility,
//   VisibilityOff,
//   Delete,
//   ArrowUpward,
//   ArrowDownward,
//   ArrowBack,
//   ArrowForward,
//   Home,
//   ZoomIn,
//   ZoomOut,
// } from "@mui/icons-material"
// import Hls from "hls.js"
// import "../../../styles/camera-widget.css"
// import CameraEventSidebar from "./CameraEventSidebar"

// const LOG_PREFIX = "[CameraWidget]"

// const CameraWidget = ({ config, onConfigChange }) => {
//   console.log("[CameraWidget] config received:", config) 
//   const [anchorEl, setAnchorEl] = useState(null)
//   const [activeTab, setActiveTab] = useState(0)
//   const [isFullscreen, setIsFullscreen] = useState(false)
//   const [isSettingsVisible, setIsSettingsVisible] = useState(false)
//   const [isPlaying, setIsPlaying] = useState(true)
//   const [isLoading, setIsLoading] = useState(true)
//   const [isConnected, setIsConnected] = useState(false)
//   const [isLive, setIsLive] = useState(true)
//   const [currentTime, setCurrentTime] = useState(new Date())
//   const [alerts, setAlerts] = useState([])
//   const [motionDetected, setMotionDetected] = useState(false)
//   const [showPassword, setShowPassword] = useState(false)
//   const [editedConfig, setEditedConfig] = useState({ ...config })
//   const [selectedDate, setSelectedDate] = useState(new Date())
//   const [timeRange, setTimeRange] = useState([0, 24])
//   const [isSidebarVisible, setIsSidebarVisible] = useState(false)

//   const videoRef = useRef(null)
//   const hlsRef = useRef(null)
//   const containerRef = useRef(null)
//   const retryCountRef = useRef(0)
//   const MAX_RETRIES = 2

// //   // Default demo config
// //   const defaultConfig = {
// //     title: "Camera Feed",
// //     streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
// //     username: "",
// //     password: "",
// //     refreshInterval: 30,
// //     motionDetection: false,
// //     motionSensitivity: 50,
// //     notifications: true,
// //     recordingEnabled: false,
// //     storageRetention: 7,
// //     ptz: false,
// //   }
// //   const mergedConfig = { ...defaultConfig, ...config }
// //   const [currentStreamUrl, setCurrentStreamUrl] = useState(mergedConfig.streamUrl)

//     // CameraWidget.jsx (top of function)
//     const resolvedStreamUrl =
//     config?.dataSource?.streamUrl ||
//     config?.streamUrl ||
//     ""; // fallback to "" if nothing

//     const mergedConfig = { ...config, streamUrl: resolvedStreamUrl }; // always sets streamUrl
//     const [currentStreamUrl, setCurrentStreamUrl] = useState(resolvedStreamUrl);

//     useEffect(() => {
//     setEditedConfig({ ...mergedConfig });
//     setCurrentStreamUrl(mergedConfig.streamUrl);
//     console.info(`${LOG_PREFIX} Config updated from parent:`, mergedConfig);
//     }, [config]);


//   // Main effect for stream + periodic demo logic
//     useEffect(() => {
//     if (!currentStreamUrl || !currentStreamUrl.trim().startsWith("http")) {
//         setIsLoading(false)
//         setIsConnected(false)
//         destroyStream()
//         return
//     }
//     if (isLive) {
//       console.info(`${LOG_PREFIX} Initializing live stream...`, +currentStreamUrl)
//       initializeStream(currentStreamUrl)
//     } else {
//       console.info(`${LOG_PREFIX} Loading recording for date`, selectedDate, "range", timeRange)
//       loadRecordingForDate(selectedDate, timeRange, currentStreamUrl)
//     }

//     const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)
//     const motionInterval = setInterval(() => {
//       if (mergedConfig.motionDetection) {
//         const detected = Math.random() > 0.7
//         setMotionDetected(detected)
//         if (detected && mergedConfig.notifications) addAlert("Motion detected")
//         if (detected) {
//           console.info(`${LOG_PREFIX} Motion detected!`)
//         }
//       }
//     }, 10000)

//     return () => {
//       destroyStream()
//       clearInterval(timeInterval)
//       clearInterval(motionInterval)
//       console.info(`${LOG_PREFIX} Component unmount: cleaned up stream, timers.`)
//     }
//     // eslint-disable-next-line
//   }, [
//     isLive,
//     selectedDate,
//     timeRange,
//     mergedConfig.motionDetection,
//     mergedConfig.notifications,
//     currentStreamUrl,
//   ])

//   // --- STREAM HANDLERS ---

//   const initializeStream = (url = currentStreamUrl) => {
//     const safeUrl = typeof url === 'string' ? url.trim() : ''
//     if (!safeUrl || !safeUrl.startsWith('http')) {
//       addAlert("Invalid stream URL")
//       setIsLoading(false)
//       setIsConnected(false)
//       console.warn(`${LOG_PREFIX} Stream initialization failed: Invalid URL`, safeUrl)
//       return
//     }
//     setIsLoading(true)
//     setIsConnected(false)
//     destroyStream()
//     console.info(`${LOG_PREFIX} Attempting to start stream: ${safeUrl}`)

//     if (Hls.isSupported() && videoRef.current) {
//       const hls = new Hls({ debug: false, enableWorker: true })
//       hlsRef.current = hls
//       hls.attachMedia(videoRef.current)
//       hls.loadSource(safeUrl)
//       hls.on(Hls.Events.MANIFEST_PARSED, () => {
//         setIsLoading(false)
//         setIsConnected(true)
//         retryCountRef.current = 0
//         console.info(`${LOG_PREFIX} Stream loaded successfully.`)
//         if (isPlaying) {
//           videoRef.current.play().catch((err) => {
//             console.error(`${LOG_PREFIX} Video play error:`, err)
//           })
//         }
//       })
//       hls.on(Hls.Events.ERROR, (event, data) => {
//         console.error(`${LOG_PREFIX} HLS.js error:`, data)
//         if (data.fatal) {
//           if (retryCountRef.current < MAX_RETRIES) {
//             retryCountRef.current++
//             console.warn(`${LOG_PREFIX} Fatal error, retrying stream... attempt`, retryCountRef.current)
//             hls.startLoad()
//           } else {
//             setIsConnected(false)
//             setIsLoading(false)
//             addAlert(`Stream error: ${data.details}`)
//             destroyStream()
//             console.error(`${LOG_PREFIX} Fatal stream error. Giving up after retries.`)
//           }
//         }
//       })
//     } else if (videoRef.current?.canPlayType("application/vnd.apple.mpegurl")) {
//       videoRef.current.src = safeUrl
//       videoRef.current.addEventListener("loadedmetadata", () => {
//         setIsLoading(false)
//         setIsConnected(true)
//         if (isPlaying) videoRef.current.play().catch((err) => {
//           console.error(`${LOG_PREFIX} Safari play error:`, err)
//         })
//         console.info(`${LOG_PREFIX} Native HLS playback loaded (Safari).`)
//       })
//       videoRef.current.addEventListener("error", () => {
//         setIsConnected(false)
//         setIsLoading(false)
//         addAlert("Safari player failed to load stream.")
//         console.error(`${LOG_PREFIX} Safari native HLS failed to load.`)
//       })
//     } else {
//       setIsConnected(false)
//       setIsLoading(false)
//       addAlert("HLS not supported in this browser")
//       console.error(`${LOG_PREFIX} HLS not supported in browser.`)
//     }
//   }

//   const destroyStream = () => {
//     if (hlsRef.current) {
//       hlsRef.current.destroy()
//       hlsRef.current = null
//       console.info(`${LOG_PREFIX} Destroyed previous HLS instance.`)
//     }
//     if (videoRef.current) {
//       videoRef.current.pause()
//       videoRef.current.removeAttribute("src")
//       videoRef.current.load()
//       console.info(`${LOG_PREFIX} Reset video element.`)
//     }
//   }

//   // -- UI Handlers --

//   const togglePlayPause = () => {
//     if (videoRef.current) {
//       if (isPlaying) {
//         videoRef.current.pause()
//         console.info(`${LOG_PREFIX} Video paused by user.`)
//       }
//       else {
//         videoRef.current.play().catch((error) => {
//           console.error(`${LOG_PREFIX} Error playing video:`, error)
//         })
//         console.info(`${LOG_PREFIX} Video play requested by user.`)
//       }
//       setIsPlaying(!isPlaying)
//     }
//   }

//   const toggleFullscreen = () => {
//     if (!document.fullscreenElement) {
//       containerRef.current.requestFullscreen().catch((err) => {
//         addAlert(`Error attempting to enable fullscreen: ${err.message}`)
//         console.error(`${LOG_PREFIX} Fullscreen request failed:`, err)
//       })
//       setIsFullscreen(true)
//       console.info(`${LOG_PREFIX} Fullscreen mode enabled.`)
//     } else {
//       document.exitFullscreen()
//       setIsFullscreen(false)
//       console.info(`${LOG_PREFIX} Fullscreen mode disabled.`)
//     }
//   }

//   const handleMenuOpen = (event) => setAnchorEl(event.currentTarget)
//   const handleMenuClose = () => setAnchorEl(null)
//   const handleTabChange = (event, newValue) => {
//     setActiveTab(newValue)
//     console.info(`${LOG_PREFIX} Tab changed to`, newValue)
//   }
//   const toggleSettings = () => {
//     setIsSettingsVisible(!isSettingsVisible)
//     handleMenuClose()
//     console.info(`${LOG_PREFIX} Settings panel toggled.`)
//   }

//   const handleConfigChange = (field, value) => {
//     setEditedConfig((prev) => ({
//       ...prev,
//       [field]: value,
//     }))
//     console.info(`${LOG_PREFIX} Config changed:`, field, value)
//   }

// //   const saveSettings = () => {
// //     onConfigChange?.(editedConfig)
// //     setCurrentStreamUrl(editedConfig.streamUrl)
// //     setIsSettingsVisible(false)
// //     setTimeout(() => {
// //       destroyStream()
// //       if (isLive) {
// //         initializeStream(editedConfig.streamUrl)
// //       } else {
// //         loadRecordingForDate(selectedDate, timeRange, editedConfig.streamUrl)
// //       }
// //     }, 100)
// //     console.info(`${LOG_PREFIX} Camera settings saved and applied.`, editedConfig)
// //   }
//     const saveSettings = () => {
//         onConfigChange?.(editedConfig)
//         setIsSettingsVisible(false)
//         setIsPlaying(true)
//         setCurrentStreamUrl(editedConfig.streamUrl) // this will trigger useEffect below!
//         console.info(`${LOG_PREFIX} Camera settings saved and applied.`, editedConfig)
//     }

//   const cancelSettings = () => {
//     setEditedConfig({ ...mergedConfig })
//     setIsSettingsVisible(false)
//     console.info(`${LOG_PREFIX} Camera settings change cancelled.`)
//   }

//   const addAlert = (message) => {
//     const newAlert = {
//       id: Date.now(),
//       message,
//       timestamp: new Date(),
//     }
//     setAlerts((prev) => [newAlert, ...prev].slice(0, 50))
//     console.warn(`${LOG_PREFIX} ALERT: ${message}`)
//   }
//   const deleteAlert = (alertId) => {
//     setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
//     console.info(`${LOG_PREFIX} Alert deleted:`, alertId)
//   }
//   const clearAllAlerts = () => {
//     setAlerts([])
//     console.info(`${LOG_PREFIX} All alerts cleared.`)
//   }

//   // -- Playback logic (same as live, can be extended for backend recordings) --
//   const loadRecordingForDate = (date, timeRange, streamUrl = currentStreamUrl) => {
//     const safeUrl = typeof streamUrl === 'string' ? streamUrl.trim() : ''
//     if (!safeUrl || !safeUrl.startsWith("http")) {
//       addAlert("Invalid playback stream URL")
//       setIsLoading(false)
//       setIsConnected(false)
//       console.warn(`${LOG_PREFIX} Playback failed: Invalid URL`, safeUrl)
//       return
//     }
//     setIsLoading(true)
//     setIsConnected(false)
//     destroyStream()
//     console.info(`${LOG_PREFIX} Loading recording:`, safeUrl, date, timeRange)

//     if (Hls.isSupported() && videoRef.current) {
//       const hls = new Hls()
//       hlsRef.current = hls
//       hls.loadSource(safeUrl)
//       hls.attachMedia(videoRef.current)
//       hls.on(Hls.Events.MANIFEST_PARSED, () => {
//         videoRef.current.play().catch((e) => {
//           console.error(`${LOG_PREFIX} Playback error:`, e)
//         })
//         setIsLoading(false)
//         setIsConnected(true)
//         const dateStr = date.toISOString().split("T")[0]
//         const start = timeRange[0].toString().padStart(2, "0")
//         const end = timeRange[1].toString().padStart(2, "0")
//         addAlert(`Loaded recording for ${dateStr} ${start}:00–${end}:00`)
//         console.info(`${LOG_PREFIX} Recording loaded for ${dateStr} ${start}:00–${end}:00`)
//       })
//     } else if (videoRef.current?.canPlayType("application/vnd.apple.mpegurl")) {
//       videoRef.current.src = safeUrl
//       videoRef.current.addEventListener("loadedmetadata", () => {
//         videoRef.current.play().catch((e) => {
//           console.error(`${LOG_PREFIX} Playback error:`, e)
//         })
//         setIsLoading(false)
//         setIsConnected(true)
//         console.info(`${LOG_PREFIX} Native playback loaded (Safari).`)
//       })
//     } else {
//       setIsConnected(false)
//       setIsLoading(false)
//       addAlert("Playback stream not supported")
//       console.error(`${LOG_PREFIX} Playback stream not supported.`)
//     }
//   }

//   const toggleLiveMode = () => {
//     setIsLive((prev) => !prev)
//     if (!isLive) {
//       destroyStream()
//       initializeStream()
//       console.info(`${LOG_PREFIX} Switched to live mode.`)
//     } else {
//       console.info(`${LOG_PREFIX} Switched to playback mode.`)
//     }
//   }

//   const handleDateChange = (date) => {
//     setSelectedDate(date)
//     console.info(`${LOG_PREFIX} Playback date changed:`, date)
//   }
//   const handleTimeRangeChange = (event, newValue) => {
//     setTimeRange(newValue)
//     console.info(`${LOG_PREFIX} Playback time range changed:`, newValue)
//   }
//   const formatTimeRange = (range) => `${range[0]}:00 - ${range[1]}:00`

//   // PTZ Controls (simulated)
//   const handlePtzControl = (direction) => {
//     if (mergedConfig.ptz) {
//       addAlert(`PTZ Command: ${direction}`)
//       console.info(`${LOG_PREFIX} PTZ command issued:`, direction)
//     }
//   }

//   // --- JSX ---
//   return (
//     <Card ref={containerRef} className="camera-widget">
//       <CardHeader
//         title={mergedConfig.title}
//         className="camera-header"
//         titleTypographyProps={{ variant: "subtitle2" }}
//         action={
//           <>
//             <IconButton onClick={handleMenuOpen} size="small">
//               <MoreVert fontSize="small" />
//             </IconButton>
//             <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
//               <MenuItem onClick={toggleSettings}>
//                 <Settings fontSize="small" style={{ marginRight: 8 }} />
//                 Settings
//               </MenuItem>
//               <MenuItem onClick={toggleFullscreen}>
//                 {isFullscreen ? (
//                   <>
//                     <FullscreenExit fontSize="small" style={{ marginRight: 8 }} />
//                     Exit Fullscreen
//                   </>
//                 ) : (
//                   <>
//                     <Fullscreen fontSize="small" style={{ marginRight: 8 }} />
//                     Fullscreen
//                   </>
//                 )}
//               </MenuItem>
//               <MenuItem onClick={toggleLiveMode}>
//                 {isLive ? (
//                   <>
//                     <CalendarToday fontSize="small" style={{ marginRight: 8 }} />
//                     View Recordings
//                   </>
//                 ) : (
//                   <>
//                     <Videocam fontSize="small" style={{ marginRight: 8 }} />
//                     Live View
//                   </>
//                 )}
//               </MenuItem>
//               <MenuItem onClick={() => addAlert("Screenshot taken")}>
//                 <Videocam fontSize="small" style={{ marginRight: 8 }} />
//                 Take Screenshot
//               </MenuItem>
//             </Menu>
//           </>
//         }
//       />

//       <CardContent className="camera-content">
//         {isSettingsVisible ? (
//           <div className="camera-settings">
//             <Typography variant="h6">Camera Settings</Typography>
//             <TextField
//               label="Camera Name"
//               value={editedConfig.title}
//               onChange={(e) => handleConfigChange("title", e.target.value)}
//               fullWidth
//               margin="normal"
//               size="small"
//             />
//             <TextField
//               label="Stream URL"
//               value={editedConfig.streamUrl}
//               onChange={(e) => handleConfigChange("streamUrl", e.target.value)}
//               fullWidth
//               margin="normal"
//               size="small"
//             />
//             <TextField
//               label="Username"
//               value={editedConfig.username}
//               onChange={(e) => handleConfigChange("username", e.target.value)}
//               fullWidth
//               margin="normal"
//               size="small"
//             />
//             <TextField
//               label="Password"
//               type={showPassword ? "text" : "password"}
//               value={editedConfig.password}
//               onChange={(e) => handleConfigChange("password", e.target.value)}
//               fullWidth
//               margin="normal"
//               size="small"
//               InputProps={{
//                 endAdornment: (
//                   <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
//                     {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
//                   </IconButton>
//                 ),
//               }}
//             />
//             <TextField
//               label="Refresh Interval (seconds)"
//               type="number"
//               value={editedConfig.refreshInterval}
//               onChange={(e) => handleConfigChange("refreshInterval", Number.parseInt(e.target.value))}
//               fullWidth
//               margin="normal"
//               size="small"
//             />
//             <FormControlLabel
//               control={
//                 <Switch
//                   checked={editedConfig.motionDetection}
//                   onChange={(e) => handleConfigChange("motionDetection", e.target.checked)}
//                   size="small"
//                 />
//               }
//               label={<Typography variant="body2">Motion Detection</Typography>}
//             />
//             {editedConfig.motionDetection && (
//               <div className="setting-group">
//                 <Typography id="motion-sensitivity-slider" variant="body2">
//                   Motion Sensitivity: {editedConfig.motionSensitivity}%
//                 </Typography>
//                 <Slider
//                   value={editedConfig.motionSensitivity}
//                   onChange={(e, value) => handleConfigChange("motionSensitivity", value)}
//                   aria-labelledby="motion-sensitivity-slider"
//                   min={0}
//                   max={100}
//                   size="small"
//                 />
//               </div>
//             )}
//             <FormControlLabel
//               control={
//                 <Switch
//                   checked={editedConfig.notifications}
//                   onChange={(e) => handleConfigChange("notifications", e.target.checked)}
//                   size="small"
//                 />
//               }
//               label={<Typography variant="body2">Enable Notifications</Typography>}
//             />
//             <FormControlLabel
//               control={
//                 <Switch
//                   checked={editedConfig.recordingEnabled}
//                   onChange={(e) => handleConfigChange("recordingEnabled", e.target.checked)}
//                   size="small"
//                 />
//               }
//               label={<Typography variant="body2">Enable Recording</Typography>}
//             />
//             {editedConfig.recordingEnabled && (
//               <TextField
//                 label="Storage Retention (days)"
//                 type="number"
//                 value={editedConfig.storageRetention}
//                 onChange={(e) => handleConfigChange("storageRetention", Number.parseInt(e.target.value))}
//                 fullWidth
//                 margin="normal"
//                 size="small"
//               />
//             )}
//             <FormControlLabel
//               control={
//                 <Switch
//                   checked={editedConfig.ptz}
//                   onChange={(e) => handleConfigChange("ptz", e.target.checked)}
//                   size="small"
//                 />
//               }
//               label={<Typography variant="body2">PTZ Controls</Typography>}
//             />
//             <Box mt={2} display="flex" justifyContent="flex-end">
//               <Button
//                 variant="outlined"
//                 color="secondary"
//                 startIcon={<Cancel />}
//                 onClick={cancelSettings}
//                 style={{ marginRight: 8 }}
//                 size="small"
//               >
//                 Cancel
//               </Button>
//               <Button variant="contained" color="primary" startIcon={<Save />} onClick={saveSettings} size="small">
//                 Save
//               </Button>
//             </Box>
//           </div>
//         ) : (
//           <>
//             {!isSidebarVisible && (
//               <div style={{ position: "absolute", top: 10, right: 40, zIndex: 1000 }}>
//                 <Button
//                   size="small"
//                   variant="contained"
//                   color="primary"
//                   onClick={() => setIsSidebarVisible(true)}
//                   startIcon={<Visibility fontSize="small" />}
//                 >
//                   Events
//                 </Button>
//               </div>
//             )}
//             {isSidebarVisible && (
//               <div style={{ position: "absolute", top: 10, right: 40, zIndex: 1000 }}>
//                 <Button
//                   size="small"
//                   variant="contained"
//                   color="primary"
//                   onClick={() => setIsSidebarVisible(false)}
//                   startIcon={<VisibilityOff fontSize="small" />}
//                 >
//                   Hide
//                 </Button>
//               </div>
//             )}
//             <div
//               className="camera-left-panel"
//               style={{ display: "flex", flexDirection: "row", padding: 0, position: "relative" }}
//             >
//               <div
//                 className="video-container"
//                 style={{ display: "flex", flexDirection: "row", padding: 0, position: "relative", overflow: "hidden" }}
//               >
//                 {isLoading && (
//                   <div className="loading-overlay">
//                     <CircularProgress size={30} />
//                     <Typography variant="caption" style={{ marginTop: 8 }}>
//                       Connecting...
//                     </Typography>
//                   </div>
//                 )}

//                 {!isConnected && !isLoading && (
//                   <div className="error-overlay">
//                     <Typography variant="body2" color="error">
//                       Could not connect to camera
//                     </Typography>
//                     <Button
//                       variant="contained"
//                       color="primary"
//                       onClick={() => initializeStream()}
//                       style={{ marginTop: 16 }}
//                       size="small"
//                     >
//                       Retry
//                     </Button>
//                   </div>
//                 )}

//                 <video ref={videoRef} className="camera-video" playsInline muted controls={false} />

//                 {motionDetected && mergedConfig.motionDetection && (
//                   <div className="motion-indicator">
//                     <MotionPhotosAuto color="error" fontSize="small" />
//                     <Typography variant="caption" color="error">
//                       Motion
//                     </Typography>
//                   </div>
//                 )}

//                 <div className="video-controls">
//                   <IconButton onClick={togglePlayPause} size="small">
//                     {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
//                   </IconButton>

//                   {editedConfig.ptz && (
//                     <div className="ptz-controls">
//                       <div className="ptz-row">
//                         <IconButton onClick={() => handlePtzControl("up")} size="small">
//                           <ArrowUpward fontSize="small" />
//                         </IconButton>
//                       </div>
//                       <div className="ptz-row">
//                         <IconButton onClick={() => handlePtzControl("left")} size="small">
//                           <ArrowBack fontSize="small" />
//                         </IconButton>
//                         <IconButton onClick={() => handlePtzControl("home")} size="small">
//                           <Home fontSize="small" />
//                         </IconButton>
//                         <IconButton onClick={() => handlePtzControl("right")} size="small">
//                           <ArrowForward fontSize="small" />
//                         </IconButton>
//                       </div>
//                       <div className="ptz-row">
//                         <IconButton onClick={() => handlePtzControl("down")} size="small">
//                           <ArrowDownward fontSize="small" />
//                         </IconButton>
//                       </div>
//                       <div className="ptz-row">
//                         <IconButton onClick={() => handlePtzControl("zoom_in")} size="small">
//                           <ZoomIn fontSize="small" />
//                         </IconButton>
//                         <IconButton onClick={() => handlePtzControl("zoom_out")} size="small">
//                           <ZoomOut fontSize="small" />
//                         </IconButton>
//                       </div>
//                     </div>
//                   )}

//                   <div className="camera-info">
//                     <Typography variant="caption" className="timestamp">
//                       {currentTime.toLocaleTimeString()}
//                     </Typography>
//                     {isLive && (
//                       <div className="live-indicator">
//                         <span className="live-dot"></span>
//                         <Typography variant="caption">LIVE</Typography>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//               {isSidebarVisible && (
//                 <div style={{ width: "250px", borderLeft: "1px solid #ddd", position: "relative" }}>
//                   <CameraEventSidebar isLive={isLive} currentTime={videoRef.current?.currentTime || 0} />
//                 </div>
//               )}
//             </div>

//             <Tabs
//               value={activeTab}
//               onChange={handleTabChange}
//               variant="fullWidth"
//               className="camera-tabs"
//               TabIndicatorProps={{ style: { height: 2 } }}
//               sx={{ minHeight: "32px" }}
//             >
//               <Tab label="Live" disabled={!isLive} sx={{ minHeight: "32px", fontSize: "0.75rem" }} />
//               <Tab label="Playback" sx={{ minHeight: "32px", fontSize: "0.75rem" }} />
//               <Tab label="Alerts" sx={{ minHeight: "32px", fontSize: "0.75rem" }} />
//             </Tabs>

//             <div className="tab-content">
//               {activeTab === 0 && isLive && (
//                 <div className="live-tab">
//                   <Typography variant="body2">Stream Status: {isConnected ? "Connected" : "Disconnected"}</Typography>
//                   <Typography variant="body2">
//                     Motion Detection: {mergedConfig.motionDetection ? "Enabled" : "Disabled"}
//                   </Typography>
//                   <Typography variant="body2">
//                     Notifications: {mergedConfig.notifications ? "Enabled" : "Disabled"}
//                   </Typography>
//                 </div>
//               )}

//               {activeTab === 1 && (
//                 <div className="playback-tab">
//                   <div className="date-selector">
//                     <Typography variant="body2">Select Date:</Typography>
//                     <input
//                       type="date"
//                       value={selectedDate.toISOString().split("T")[0]}
//                       onChange={(e) => handleDateChange(new Date(e.target.value))}
//                       className="date-input"
//                     />
//                   </div>

//                   <div className="time-selector">
//                     <Typography variant="body2">Time Range: {formatTimeRange(timeRange)}</Typography>
//                     <Slider
//                       value={timeRange}
//                       onChange={handleTimeRangeChange}
//                       valueLabelDisplay="auto"
//                       min={0}
//                       max={24}
//                       step={1}
//                       size="small"
//                     />
//                   </div>

//                   <Button
//                     variant="contained"
//                     color="primary"
//                     onClick={() => loadRecordingForDate(selectedDate, timeRange)}
//                     fullWidth
//                     size="small"
//                   >
//                     Load Recording
//                   </Button>

//                   <Button
//                     variant="outlined"
//                     color="primary"
//                     onClick={toggleLiveMode}
//                     fullWidth
//                     style={{ marginTop: 8 }}
//                     size="small"
//                   >
//                     {isLive ? "Switch to Playback" : "Switch to Live"}
//                   </Button>
//                 </div>
//               )}

//               {activeTab === 2 && (
//                 <div className="alerts-tab">
//                   <div className="alerts-header">
//                     <Typography variant="subtitle2">Recent Alerts ({alerts.length})</Typography>
//                     <Button variant="outlined" size="small" onClick={clearAllAlerts} disabled={alerts.length === 0}>
//                       Clear All
//                     </Button>
//                   </div>

//                   <div className="alerts-list">
//                     {alerts.length === 0 ? (
//                       <Typography variant="body2" className="no-alerts">
//                         No alerts to display
//                       </Typography>
//                     ) : (
//                       alerts.map((alert) => (
//                         <div key={alert.id} className="alert-item">
//                           <div className="alert-content">
//                             <Typography variant="body2">{alert.message}</Typography>
//                             <Typography variant="caption" color="textSecondary">
//                               {alert.timestamp.toLocaleTimeString()}
//                             </Typography>
//                           </div>
//                           <IconButton size="small" onClick={() => deleteAlert(alert.id)}>
//                             <Delete fontSize="small" />
//                           </IconButton>
//                         </div>
//                       ))
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </>
//         )}
//       </CardContent>
//     </Card>
//   )
// }

// export default CameraWidget


// // "use client"

// // import { useState, useEffect, useRef } from "react"
// // import {
// //   Card,
// //   CardContent,
// //   CardHeader,
// //   IconButton,
// //   Menu,
// //   MenuItem,
// //   Typography,
// //   Box,
// //   CircularProgress,
// //   Tabs,
// //   Tab,
// //   Button,
// //   TextField,
// //   Switch,
// //   FormControlLabel,
// //   Slider,
// // } from "@mui/material"
// // import {
// //   MoreVert,
// //   Videocam,
// //   Pause,
// //   PlayArrow,
// //   Settings,
// //   Fullscreen,
// //   FullscreenExit,
// //   Save,
// //   Cancel,
// //   CalendarToday,
// //   MotionPhotosAuto,
// //   Visibility,
// //   VisibilityOff,
// //   Delete,
// //   ArrowUpward,
// //   ArrowDownward,
// //   ArrowBack,
// //   ArrowForward,
// //   Home,
// //   ZoomIn,
// //   ZoomOut,
// // } from "@mui/icons-material"
// // import Hls from "hls.js"
// // import "../../../styles/camera-widget.css"
// // import CameraEventSidebar from "./CameraEventSidebar"

// // const CameraWidget = ({ config, onConfigChange }) => {
// //   const [anchorEl, setAnchorEl] = useState(null)
// //   const [activeTab, setActiveTab] = useState(0)
// //   const [isFullscreen, setIsFullscreen] = useState(false)
// //   const [isSettingsVisible, setIsSettingsVisible] = useState(false)
// //   const [isPlaying, setIsPlaying] = useState(true)
// //   const [isLoading, setIsLoading] = useState(true)
// //   const [isConnected, setIsConnected] = useState(false)
// //   const [isLive, setIsLive] = useState(true)
// //   const [currentTime, setCurrentTime] = useState(new Date())
// //   const [alerts, setAlerts] = useState([])
// //   const [motionDetected, setMotionDetected] = useState(false)
// //   const [showPassword, setShowPassword] = useState(false)
// //   const [editedConfig, setEditedConfig] = useState({ ...config })
// //   const [selectedDate, setSelectedDate] = useState(new Date())
// //   const [timeRange, setTimeRange] = useState([0, 24])
// //   const [isSidebarVisible, setIsSidebarVisible] = useState(false)

// //   const videoRef = useRef(null)
// //   const hlsRef = useRef(null)
// //   const containerRef = useRef(null)

// //   // Default configuration if none is provided
// //   const defaultConfig = {
// //     title: "Camera Feed",
// //     streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
// //     username: "",
// //     password: "",
// //     refreshInterval: 30,
// //     motionDetection: false,
// //     motionSensitivity: 50,
// //     notifications: true,
// //     recordingEnabled: false,
// //     storageRetention: 7,
// //     ptz: false,
// //   }
// //   const mergedConfig = { ...defaultConfig, ...config }
// //   const [currentStreamUrl, setCurrentStreamUrl] = useState(mergedConfig.streamUrl)

// //   useEffect(() => {
// //     setEditedConfig(mergedConfig)
// //   }, [config])

// //   useEffect(() => {
// //     if (isLive) {
// //       initializeStream()
// //     } else {
// //       // Handle playback mode
// //       loadRecordingForDate(selectedDate, timeRange)
// //     }

// //     // Update current time every second
// //     const timeInterval = setInterval(() => {
// //       setCurrentTime(new Date())
// //     }, 1000)

// //     // Simulate motion detection for demo purposes
// //     const motionInterval = setInterval(() => {
// //       if (mergedConfig.motionDetection) {
// //         const detected = Math.random() > 0.7
// //         setMotionDetected(detected)

// //         if (detected && mergedConfig.notifications) {
// //           addAlert("Motion detected")
// //         }
// //       }
// //     }, 10000)

// //     return () => {
// //       destroyStream()
// //       clearInterval(timeInterval)
// //       clearInterval(motionInterval)
// //     }
// //   }, [isLive, selectedDate, timeRange, mergedConfig.motionDetection, mergedConfig.notifications])

// //   // const initializeStream = () => {
// //   //   setIsLoading(true)
// //   //   setIsConnected(false)

// //   //   if (Hls.isSupported() && videoRef.current) {
// //   //     if (hlsRef.current) {
// //   //       hlsRef.current.destroy()
// //   //     }

// //   //     const hls = new Hls({
// //   //       debug: false,
// //   //       enableWorker: true,
// //   //     })

// //   //     // hls.loadSource(mergedConfig.streamUrl)
// //   //     hls.loadSource(currentStreamUrl)
// //   //     hls.attachMedia(videoRef.current)

// //   //     hls.on(Hls.Events.MANIFEST_PARSED, () => {
// //   //       if (isPlaying) {
// //   //         videoRef.current.play().catch((error) => {
// //   //           console.error("Error playing video:", error)
// //   //         })
// //   //       }
// //   //       setIsLoading(false)
// //   //       setIsConnected(true)
// //   //     })

// //   //     hls.on(Hls.Events.ERROR, (event, data) => {
// //   //       if (data.fatal) {
// //   //         switch (data.type) {
// //   //           case Hls.ErrorTypes.NETWORK_ERROR:
// //   //             console.error("Network error:", data)
// //   //             hls.startLoad()
// //   //             break
// //   //           case Hls.ErrorTypes.MEDIA_ERROR:
// //   //             console.error("Media error:", data)
// //   //             hls.recoverMediaError()
// //   //             break
// //   //           default:
// //   //             destroyStream()
// //   //             break
// //   //         }
// //   //         setIsConnected(false)
// //   //       }
// //   //     })

// //   //     hlsRef.current = hls
// //   //   } else if (videoRef.current && videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
// //   //     // For Safari
// //   //     // videoRef.current.src = mergedConfig.streamUrl
// //   //     videoRef.current.src = currentStreamUrl
// //   //     videoRef.current.addEventListener("loadedmetadata", () => {
// //   //       if (isPlaying) {
// //   //         videoRef.current.play().catch((error) => {
// //   //           console.error("Error playing video:", error)
// //   //         })
// //   //       }
// //   //       setIsLoading(false)
// //   //       setIsConnected(true)
// //   //     })

// //   //     videoRef.current.addEventListener("error", () => {
// //   //       setIsConnected(false)
// //   //       setIsLoading(false)
// //   //       addAlert("Error connecting to camera stream")
// //   //     })
// //   //   } else {
// //   //     setIsLoading(false)
// //   //     setIsConnected(false)
// //   //     addAlert("HLS is not supported in this browser")
// //   //   }
// //   // }
// //   const retryCountRef = useRef(0)
// //   const MAX_RETRIES = 2

// //   // const initializeStream = () => {
// //   //   if (!videoRef.current) return

// //   //   setIsLoading(true)
// //   //   setIsConnected(false)

// //   //   destroyStream() // Ensure previous is cleaned up

// //   //   if (Hls.isSupported()) {
// //   //     const hls = new Hls({
// //   //       debug: false,
// //   //       enableWorker: true,
// //   //     })

// //   //     hlsRef.current = hls

// //   //     hls.attachMedia(videoRef.current)
// //   //     hls.loadSource(currentStreamUrl)

// //   //     hls.on(Hls.Events.MANIFEST_PARSED, () => {
// //   //       setIsLoading(false)
// //   //       setIsConnected(true)
// //   //       retryCountRef.current = 0

// //   //       if (isPlaying) {
// //   //         videoRef.current
// //   //           .play()
// //   //           .catch((err) => console.error("Video play error:", err))
// //   //       }
// //   //     })

// //   //     hls.on(Hls.Events.ERROR, (event, data) => {
// //   //       console.error("HLS error:", data)
// //   //       if (data.fatal) {
// //   //         switch (data.type) {
// //   //           case Hls.ErrorTypes.NETWORK_ERROR:
// //   //           case Hls.ErrorTypes.MEDIA_ERROR:
// //   //             if (retryCountRef.current < MAX_RETRIES) {
// //   //               retryCountRef.current++
// //   //               console.warn(`Retrying stream... (${retryCountRef.current})`)
// //   //               setTimeout(() => {
// //   //                 hls.startLoad()
// //   //               }, 1000)
// //   //             } else {
// //   //               setIsConnected(false)
// //   //               setIsLoading(false)
// //   //               addAlert("Max retries reached. Stream failed.")
// //   //               destroyStream()
// //   //             }
// //   //             break
// //   //           default:
// //   //             destroyStream()
// //   //             setIsConnected(false)
// //   //             setIsLoading(false)
// //   //             addAlert("Stream error occurred")
// //   //             break
// //   //         }
// //   //       }
// //   //     })
// //   //   } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
// //   //     videoRef.current.src = currentStreamUrl
// //   //     videoRef.current.addEventListener("loadedmetadata", () => {
// //   //       setIsLoading(false)
// //   //       setIsConnected(true)
// //   //       if (isPlaying) {
// //   //         videoRef.current.play().catch((err) => {
// //   //           console.error("Safari play error:", err)
// //   //         })
// //   //       }
// //   //     })
// //   //     videoRef.current.addEventListener("error", () => {
// //   //       setIsConnected(false)
// //   //       setIsLoading(false)
// //   //       addAlert("Safari player failed to load stream.")
// //   //     })
// //   //   } else {
// //   //     setIsConnected(false)
// //   //     setIsLoading(false)
// //   //     addAlert("HLS not supported in this browser.")
// //   //   }
// //   // }
// //   const initializeStream = (url = currentStreamUrl) => {
// //     const safeUrl = typeof url === 'string' ? url.trim() : ''
// //     if (!safeUrl || !safeUrl.startsWith('http')) {
// //       addAlert("Invalid stream URL")
// //       setIsLoading(false)
// //       setIsConnected(false)
// //       return
// //     }

// //     setIsLoading(true)
// //     setIsConnected(false)
// //     destroyStream()

// //     if (Hls.isSupported() && videoRef.current) {
// //       const hls = new Hls({ debug: false, enableWorker: true })
// //       hlsRef.current = hls
// //       hls.attachMedia(videoRef.current)
// //       hls.loadSource(safeUrl)

// //       hls.on(Hls.Events.MANIFEST_PARSED, () => {
// //         setIsLoading(false)
// //         setIsConnected(true)
// //         retryCountRef.current = 0
// //         if (isPlaying) {
// //           videoRef.current.play().catch((err) => console.error("Video play error:", err))
// //         }
// //       })

// //       hls.on(Hls.Events.ERROR, (event, data) => {
// //         if (data.fatal) {
// //           setIsConnected(false)
// //           setIsLoading(false)
// //           addAlert(`Stream error: ${data.details}`)
// //           destroyStream()
// //         }
// //       })
// //     } else if (videoRef.current?.canPlayType("application/vnd.apple.mpegurl")) {
// //       videoRef.current.src = safeUrl
// //       videoRef.current.addEventListener("loadedmetadata", () => {
// //         setIsLoading(false)
// //         setIsConnected(true)
// //         if (isPlaying) videoRef.current.play().catch((err) => console.error("Safari play error:", err))
// //       })
// //     } else {
// //       setIsConnected(false)
// //       setIsLoading(false)
// //       addAlert("HLS not supported in this browser")
// //     }
// //   }

// //   // const destroyStream = () => {
// //   //   if (hlsRef.current) {
// //   //     hlsRef.current.destroy()
// //   //     hlsRef.current = null
// //   //   }

// //   //   if (videoRef.current) {
// //   //     videoRef.current.removeAttribute("src")
// //   //     videoRef.current.load()
// //   //   }
// //   // }
// //   const destroyStream = () => {
// //     if (hlsRef.current) {
// //       hlsRef.current.destroy()
// //       hlsRef.current = null
// //     }
// //     if (videoRef.current) {
// //       videoRef.current.pause()
// //       videoRef.current.removeAttribute("src")
// //       videoRef.current.load()
// //     }
// //   }
// //   const togglePlayPause = () => {
// //     if (videoRef.current) {
// //       if (isPlaying) {
// //         videoRef.current.pause()
// //       } else {
// //         videoRef.current.play().catch((error) => {
// //           console.error("Error playing video:", error)
// //         })
// //       }
// //       setIsPlaying(!isPlaying)
// //     }
// //   }

// //   const toggleFullscreen = () => {
// //     if (!document.fullscreenElement) {
// //       containerRef.current.requestFullscreen().catch((err) => {
// //         addAlert(`Error attempting to enable fullscreen: ${err.message}`)
// //       })
// //       setIsFullscreen(true)
// //     } else {
// //       document.exitFullscreen()
// //       setIsFullscreen(false)
// //     }
// //   }

// //   const handleMenuOpen = (event) => {
// //     setAnchorEl(event.currentTarget)
// //   }

// //   const handleMenuClose = () => {
// //     setAnchorEl(null)
// //   }

// //   const handleTabChange = (event, newValue) => {
// //     setActiveTab(newValue)
// //   }

// //   const toggleSettings = () => {
// //     setIsSettingsVisible(!isSettingsVisible)
// //     handleMenuClose()
// //   }

// //   const handleConfigChange = (field, value) => {
// //     setEditedConfig((prev) => ({
// //       ...prev,
// //       [field]: value,
// //     }))
// //   }

// //   // const saveSettings = () => {
// //   //   // onConfigChange(editedConfig)
// //   //   onConfigChange?.(editedConfig)
// //   //   setCurrentStreamUrl(editedConfig.streamUrl)

// //   //   setIsSettingsVisible(false)
// //   //   // Reinitialize stream with new settings
// //   //   destroyStream()
// //   //   initializeStream()
// //   // }
// // const saveSettings = () => {
// //   onConfigChange?.(editedConfig)
// //   setCurrentStreamUrl(editedConfig.streamUrl)
// //   setIsSettingsVisible(false)

// //   setTimeout(() => {
// //     destroyStream()
// //     if (isLive) {
// //       initializeStream(editedConfig.streamUrl)
// //     } else {
// //       loadRecordingForDate(selectedDate, timeRange, editedConfig.streamUrl)
// //     }
// //   }, 100)
// // }

// //   const cancelSettings = () => {
// //     setEditedConfig({ ...mergedConfig })
// //     setIsSettingsVisible(false)
// //   }

// //   const addAlert = (message) => {
// //     const newAlert = {
// //       id: Date.now(),
// //       message,
// //       timestamp: new Date(),
// //     }
// //     setAlerts((prev) => [newAlert, ...prev].slice(0, 50)) // Keep only the last 50 alerts
// //   }

// //   const deleteAlert = (alertId) => {
// //     setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
// //   }

// //   const clearAllAlerts = () => {
// //     setAlerts([])
// //   }

// //   const loadRecordingForDate = (date, timeRange, streamUrl = currentStreamUrl) => {
// //   const safeUrl = typeof streamUrl === 'string' ? streamUrl.trim() : ''
// //   if (!safeUrl || !safeUrl.startsWith("http")) {
// //     addAlert("Invalid playback stream URL")
// //     setIsLoading(false)
// //     setIsConnected(false)
// //     return
// //   }

// //   setIsLoading(true)
// //   setIsConnected(false)
// //   destroyStream()

// //   if (Hls.isSupported() && videoRef.current) {
// //     const hls = new Hls()
// //     hlsRef.current = hls
// //     hls.loadSource(safeUrl)
// //     hls.attachMedia(videoRef.current)

// //     hls.on(Hls.Events.MANIFEST_PARSED, () => {
// //       videoRef.current.play().catch((e) => console.error("Playback error:", e))
// //       setIsLoading(false)
// //       setIsConnected(true)
// //       const dateStr = date.toISOString().split("T")[0]
// //       const start = timeRange[0].toString().padStart(2, "0")
// //       const end = timeRange[1].toString().padStart(2, "0")
// //       addAlert(`Loaded recording for ${dateStr} ${start}:00–${end}:00`)
// //     })
// //   } else if (videoRef.current?.canPlayType("application/vnd.apple.mpegurl")) {
// //     videoRef.current.src = safeUrl
// //     videoRef.current.addEventListener("loadedmetadata", () => {
// //       videoRef.current.play().catch((e) => console.error("Playback error:", e))
// //       setIsLoading(false)
// //       setIsConnected(true)
// //     })
// //   } else {
// //     setIsConnected(false)
// //     setIsLoading(false)
// //     addAlert("Playback stream not supported")
// //   }
// // }

// //   // const loadRecordingForDate = (date, timeRange) => {
// //   //   setIsLoading(true)
// //   //   // Simulate loading recording data
// //   //   setTimeout(() => {
// //   //     // In a real implementation, this would fetch the recording URL for the selected date and time
// //   //     setIsLoading(false)
// //   //     setIsConnected(true)
// //   //     addAlert(`Loaded recording for ${date.toLocaleDateString()} from ${timeRange[0]}:00 to ${timeRange[1]}:00`)
// //   //   }, 1500)
// //   // }

// //   const toggleLiveMode = () => {
// //     setIsLive(!isLive)
// //     if (!isLive) {
// //       destroyStream()
// //       initializeStream()
// //     }
// //   }

// //   const handleDateChange = (date) => {
// //     setSelectedDate(date)
// //   }

// //   const handleTimeRangeChange = (event, newValue) => {
// //     setTimeRange(newValue)
// //   }

// //   const formatTimeRange = (range) => {
// //     return `${range[0]}:00 - ${range[1]}:00`
// //   }

// //   // PTZ Controls (simulated)
// //   const handlePtzControl = (direction) => {
// //     if (mergedConfig.ptz) {
// //       addAlert(`PTZ Command: ${direction}`)
// //       // In a real implementation, this would send commands to the camera
// //     }
// //   }

// //   return (
// //     <Card ref={containerRef} className="camera-widget">
// //       <CardHeader
// //         title={mergedConfig.title}
// //         className="camera-header"
// //         titleTypographyProps={{ variant: "subtitle2" }}
// //         action={
// //           <>
// //             <IconButton onClick={handleMenuOpen} size="small">
// //               <MoreVert fontSize="small" />
// //             </IconButton>
// //             <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
// //               <MenuItem onClick={toggleSettings}>
// //                 <Settings fontSize="small" style={{ marginRight: 8 }} />
// //                 Settings
// //               </MenuItem>
// //               <MenuItem onClick={toggleFullscreen}>
// //                 {isFullscreen ? (
// //                   <>
// //                     <FullscreenExit fontSize="small" style={{ marginRight: 8 }} />
// //                     Exit Fullscreen
// //                   </>
// //                 ) : (
// //                   <>
// //                     <Fullscreen fontSize="small" style={{ marginRight: 8 }} />
// //                     Fullscreen
// //                   </>
// //                 )}
// //               </MenuItem>
// //               <MenuItem onClick={toggleLiveMode}>
// //                 {isLive ? (
// //                   <>
// //                     <CalendarToday fontSize="small" style={{ marginRight: 8 }} />
// //                     View Recordings
// //                   </>
// //                 ) : (
// //                   <>
// //                     <Videocam fontSize="small" style={{ marginRight: 8 }} />
// //                     Live View
// //                   </>
// //                 )}
// //               </MenuItem>
// //               <MenuItem onClick={() => addAlert("Screenshot taken")}>
// //                 <Videocam fontSize="small" style={{ marginRight: 8 }} />
// //                 Take Screenshot
// //               </MenuItem>
// //             </Menu>
// //           </>
// //         }
// //       />

// //       <CardContent className="camera-content">
// //         {isSettingsVisible ? (
// //           <div className="camera-settings">
// //             <Typography variant="h6">Camera Settings</Typography>
// //             <TextField
// //               label="Camera Name"
// //               value={editedConfig.title}
// //               onChange={(e) => handleConfigChange("title", e.target.value)}
// //               fullWidth
// //               margin="normal"
// //               size="small"
// //             />
// //             <TextField
// //               label="Stream URL"
// //               value={editedConfig.streamUrl}
// //               onChange={(e) => handleConfigChange("streamUrl", e.target.value)}
// //               fullWidth
// //               margin="normal"
// //               size="small"
// //             />
// //             <TextField
// //               label="Username"
// //               value={editedConfig.username}
// //               onChange={(e) => handleConfigChange("username", e.target.value)}
// //               fullWidth
// //               margin="normal"
// //               size="small"
// //             />
// //             <TextField
// //               label="Password"
// //               type={showPassword ? "text" : "password"}
// //               value={editedConfig.password}
// //               onChange={(e) => handleConfigChange("password", e.target.value)}
// //               fullWidth
// //               margin="normal"
// //               size="small"
// //               InputProps={{
// //                 endAdornment: (
// //                   <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
// //                     {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
// //                   </IconButton>
// //                 ),
// //               }}
// //             />
// //             <TextField
// //               label="Refresh Interval (seconds)"
// //               type="number"
// //               value={editedConfig.refreshInterval}
// //               onChange={(e) => handleConfigChange("refreshInterval", Number.parseInt(e.target.value))}
// //               fullWidth
// //               margin="normal"
// //               size="small"
// //             />
// //             <FormControlLabel
// //               control={
// //                 <Switch
// //                   checked={editedConfig.motionDetection}
// //                   onChange={(e) => handleConfigChange("motionDetection", e.target.checked)}
// //                   size="small"
// //                 />
// //               }
// //               label={<Typography variant="body2">Motion Detection</Typography>}
// //             />
// //             {editedConfig.motionDetection && (
// //               <div className="setting-group">
// //                 <Typography id="motion-sensitivity-slider" variant="body2">
// //                   Motion Sensitivity: {editedConfig.motionSensitivity}%
// //                 </Typography>
// //                 <Slider
// //                   value={editedConfig.motionSensitivity}
// //                   onChange={(e, value) => handleConfigChange("motionSensitivity", value)}
// //                   aria-labelledby="motion-sensitivity-slider"
// //                   min={0}
// //                   max={100}
// //                   size="small"
// //                 />
// //               </div>
// //             )}
// //             <FormControlLabel
// //               control={
// //                 <Switch
// //                   checked={editedConfig.notifications}
// //                   onChange={(e) => handleConfigChange("notifications", e.target.checked)}
// //                   size="small"
// //                 />
// //               }
// //               label={<Typography variant="body2">Enable Notifications</Typography>}
// //             />
// //             <FormControlLabel
// //               control={
// //                 <Switch
// //                   checked={editedConfig.recordingEnabled}
// //                   onChange={(e) => handleConfigChange("recordingEnabled", e.target.checked)}
// //                   size="small"
// //                 />
// //               }
// //               label={<Typography variant="body2">Enable Recording</Typography>}
// //             />
// //             {editedConfig.recordingEnabled && (
// //               <TextField
// //                 label="Storage Retention (days)"
// //                 type="number"
// //                 value={editedConfig.storageRetention}
// //                 onChange={(e) => handleConfigChange("storageRetention", Number.parseInt(e.target.value))}
// //                 fullWidth
// //                 margin="normal"
// //                 size="small"
// //               />
// //             )}
// //             <FormControlLabel
// //               control={
// //                 <Switch
// //                   checked={editedConfig.ptz}
// //                   onChange={(e) => handleConfigChange("ptz", e.target.checked)}
// //                   size="small"
// //                 />
// //               }
// //               label={<Typography variant="body2">PTZ Controls</Typography>}
// //             />
// //             <Box mt={2} display="flex" justifyContent="flex-end">
// //               <Button
// //                 variant="outlined"
// //                 color="secondary"
// //                 startIcon={<Cancel />}
// //                 onClick={cancelSettings}
// //                 style={{ marginRight: 8 }}
// //                 size="small"
// //               >
// //                 Cancel
// //               </Button>
// //               <Button variant="contained" color="primary" startIcon={<Save />} onClick={saveSettings} size="small">
// //                 Save
// //               </Button>
// //             </Box>
// //           </div>
// //         ) : (
// //           <>
// //             {!isSidebarVisible && (
// //               <div
// //                 style={{
// //                   position: "absolute",
// //                   top: 10,
// //                   right: 40,
// //                   zIndex: 1000,
// //                 }}
// //               >
// //                 <Button
// //                   size="small"
// //                   variant="contained"
// //                   color="primary"
// //                   onClick={() => setIsSidebarVisible(true)}
// //                   startIcon={<Visibility fontSize="small" />}
// //                 >
// //                   Events
// //                 </Button>
// //               </div>
// //             )}
// //             {isSidebarVisible && (
// //               <div
// //                 style={{
// //                   position: "absolute",
// //                   top: 10,
// //                   right: 40,
// //                   zIndex: 1000,
// //                 }}
// //               >
// //                 <Button
// //                   size="small"
// //                   variant="contained"
// //                   color="primary"
// //                   onClick={() => setIsSidebarVisible(false)}
// //                   startIcon={<VisibilityOff fontSize="small" />}
// //                 >
// //                   Hide
// //                 </Button>
// //               </div>
// //             )}
// //             <div
// //               className="camera-left-panel"
// //               style={{ display: "flex", flexDirection: "row", padding: 0, position: "relative" }}
// //             >
// //               <div
// //                 className="video-container"
// //                 style={{ display: "flex", flexDirection: "row", padding: 0, position: "relative", overflow: "hidden" }}
// //               >
// //                 {isLoading && (
// //                   <div className="loading-overlay">
// //                     <CircularProgress size={30} />
// //                     <Typography variant="caption" style={{ marginTop: 8 }}>
// //                       Connecting...
// //                     </Typography>
// //                   </div>
// //                 )}

// //                 {!isConnected && !isLoading && (
// //                   <div className="error-overlay">
// //                     <Typography variant="body2" color="error">
// //                       Could not connect to camera
// //                     </Typography>
// //                     <Button
// //                       variant="contained"
// //                       color="primary"
// //                       onClick={initializeStream}
// //                       style={{ marginTop: 16 }}
// //                       size="small"
// //                     >
// //                       Retry
// //                     </Button>
// //                   </div>
// //                 )}

// //                 <video ref={videoRef} className="camera-video" playsInline muted controls={false} />

// //                 {motionDetected && mergedConfig.motionDetection && (
// //                   <div className="motion-indicator">
// //                     <MotionPhotosAuto color="error" fontSize="small" />
// //                     <Typography variant="caption" color="error">
// //                       Motion
// //                     </Typography>
// //                   </div>
// //                 )}

// //                 <div className="video-controls">
// //                   <IconButton onClick={togglePlayPause} size="small">
// //                     {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
// //                   </IconButton>

// //                   {/* {mergedConfig.ptz && ( */}
// //                   {editedConfig.ptz && (
// //                     <div className="ptz-controls">
// //                       <div className="ptz-row">
// //                         <IconButton onClick={() => handlePtzControl("up")} size="small">
// //                           <ArrowUpward fontSize="small" />
// //                         </IconButton>
// //                       </div>
// //                       <div className="ptz-row">
// //                         <IconButton onClick={() => handlePtzControl("left")} size="small">
// //                           <ArrowBack fontSize="small" />
// //                         </IconButton>
// //                         <IconButton onClick={() => handlePtzControl("home")} size="small">
// //                           <Home fontSize="small" />
// //                         </IconButton>
// //                         <IconButton onClick={() => handlePtzControl("right")} size="small">
// //                           <ArrowForward fontSize="small" />
// //                         </IconButton>
// //                       </div>
// //                       <div className="ptz-row">
// //                         <IconButton onClick={() => handlePtzControl("down")} size="small">
// //                           <ArrowDownward fontSize="small" />
// //                         </IconButton>
// //                       </div>
// //                       <div className="ptz-row">
// //                         <IconButton onClick={() => handlePtzControl("zoom_in")} size="small">
// //                           <ZoomIn fontSize="small" />
// //                         </IconButton>
// //                         <IconButton onClick={() => handlePtzControl("zoom_out")} size="small">
// //                           <ZoomOut fontSize="small" />
// //                         </IconButton>
// //                       </div>
// //                     </div>
// //                   )}

// //                   <div className="camera-info">
// //                     <Typography variant="caption" className="timestamp">
// //                       {currentTime.toLocaleTimeString()}
// //                     </Typography>
// //                     {isLive && (
// //                       <div className="live-indicator">
// //                         <span className="live-dot"></span>
// //                         <Typography variant="caption">LIVE</Typography>
// //                       </div>
// //                     )}
// //                   </div>
// //                 </div>
// //               </div>
// //               {isSidebarVisible && (
// //                 <div style={{ width: "250px", borderLeft: "1px solid #ddd", position: "relative" }}>
// //                   <CameraEventSidebar isLive={isLive} currentTime={videoRef.current?.currentTime || 0} />
// //                 </div>
// //               )}
// //             </div>

// //             <Tabs
// //               value={activeTab}
// //               onChange={handleTabChange}
// //               variant="fullWidth"
// //               className="camera-tabs"
// //               TabIndicatorProps={{ style: { height: 2 } }}
// //               sx={{ minHeight: "32px" }}
// //             >
// //               <Tab label="Live" disabled={!isLive} sx={{ minHeight: "32px", fontSize: "0.75rem" }} />
// //               <Tab label="Playback" sx={{ minHeight: "32px", fontSize: "0.75rem" }} />
// //               <Tab label="Alerts" sx={{ minHeight: "32px", fontSize: "0.75rem" }} />
// //             </Tabs>

// //             <div className="tab-content">
// //               {activeTab === 0 && isLive && (
// //                 <div className="live-tab">
// //                   <Typography variant="body2">Stream Status: {isConnected ? "Connected" : "Disconnected"}</Typography>
// //                   <Typography variant="body2">
// //                     Motion Detection: {mergedConfig.motionDetection ? "Enabled" : "Disabled"}
// //                   </Typography>
// //                   <Typography variant="body2">
// //                     Notifications: {mergedConfig.notifications ? "Enabled" : "Disabled"}
// //                   </Typography>
// //                 </div>
// //               )}

// //               {activeTab === 1 && (
// //                 <div className="playback-tab">
// //                   <div className="date-selector">
// //                     <Typography variant="body2">Select Date:</Typography>
// //                     <input
// //                       type="date"
// //                       value={selectedDate.toISOString().split("T")[0]}
// //                       onChange={(e) => handleDateChange(new Date(e.target.value))}
// //                       className="date-input"
// //                     />
// //                   </div>

// //                   <div className="time-selector">
// //                     <Typography variant="body2">Time Range: {formatTimeRange(timeRange)}</Typography>
// //                     <Slider
// //                       value={timeRange}
// //                       onChange={handleTimeRangeChange}
// //                       valueLabelDisplay="auto"
// //                       min={0}
// //                       max={24}
// //                       step={1}
// //                       size="small"
// //                     />
// //                   </div>

// //                   <Button
// //                     variant="contained"
// //                     color="primary"
// //                     onClick={() => loadRecordingForDate(selectedDate, timeRange)}
// //                     fullWidth
// //                     size="small"
// //                   >
// //                     Load Recording
// //                   </Button>

// //                   <Button
// //                     variant="outlined"
// //                     color="primary"
// //                     onClick={toggleLiveMode}
// //                     fullWidth
// //                     style={{ marginTop: 8 }}
// //                     size="small"
// //                   >
// //                     {isLive ? "Switch to Playback" : "Switch to Live"}
// //                   </Button>
// //                 </div>
// //               )}

// //               {activeTab === 2 && (
// //                 <div className="alerts-tab">
// //                   <div className="alerts-header">
// //                     <Typography variant="subtitle2">Recent Alerts ({alerts.length})</Typography>
// //                     <Button variant="outlined" size="small" onClick={clearAllAlerts} disabled={alerts.length === 0}>
// //                       Clear All
// //                     </Button>
// //                   </div>

// //                   <div className="alerts-list">
// //                     {alerts.length === 0 ? (
// //                       <Typography variant="body2" className="no-alerts">
// //                         No alerts to display
// //                       </Typography>
// //                     ) : (
// //                       alerts.map((alert) => (
// //                         <div key={alert.id} className="alert-item">
// //                           <div className="alert-content">
// //                             <Typography variant="body2">{alert.message}</Typography>
// //                             <Typography variant="caption" color="textSecondary">
// //                               {alert.timestamp.toLocaleTimeString()}
// //                             </Typography>
// //                           </div>
// //                           <IconButton size="small" onClick={() => deleteAlert(alert.id)}>
// //                             <Delete fontSize="small" />
// //                           </IconButton>
// //                         </div>
// //                       ))
// //                     )}
// //                   </div>
// //                 </div>
// //               )}
// //             </div>
// //           </>
// //         )}
// //       </CardContent>
// //     </Card>
// //   )
// // }

// // export default CameraWidget
