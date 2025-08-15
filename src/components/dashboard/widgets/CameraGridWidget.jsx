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
  CircularProgress,
  Tabs,
  Tab,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Slider,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
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
  MotionPhotosAuto,
  Visibility,
  VisibilityOff,
  ArrowUpward,
  ArrowDownward,
  ArrowBack,
  ArrowForward,
  Home,
  Add,
  Refresh,
  Delete,
  CalendarToday,
  ZoomIn,
  ZoomOut,
  CameraAlt,
  DragIndicator,
  AspectRatio,
  VolumeUp,
  VolumeOff,
} from "@mui/icons-material"
import { Rnd } from "react-rnd"
import Hls from "hls.js"
import "../../../styles/widget/camera-grid-widget.css"

const CameraEventSidebar = ({ isLive, currentTime, cameras, selectedCameraIndex }) => {
  const [events, setEvents] = useState([])

  useEffect(() => {
    // Generate mock events for demonstration
    const mockEvents = []
    cameras.forEach((camera, index) => {
      if (camera.alerts && camera.alerts.length > 0) {
        camera.alerts.forEach((alert) => {
          mockEvents.push({
            id: `${camera.id}-${alert.id}`,
            cameraId: camera.id,
            cameraName: camera.title,
            type: alert.message.includes("Motion") ? "motion" : "alert",
            message: alert.message,
            timestamp: alert.timestamp,
            isSelected: selectedCameraIndex === index,
          })
        })
      }
    })

    // Sort by timestamp (newest first)
    mockEvents.sort((a, b) => b.timestamp - a.timestamp)
    setEvents(mockEvents.slice(0, 20)) // Show only last 20 events
  }, [cameras, selectedCameraIndex])

  return (
    <div className="camera-events-list">
      {events.length === 0 ? (
        <Typography variant="body2" color="textSecondary" style={{ padding: "16px", textAlign: "center" }}>
          No recent events
        </Typography>
      ) : (
        events.map((event) => (
          <div key={event.id} className={`camera-event-item ${event.isSelected ? "selected" : ""}`}>
            <div className="camera-event-header">
              <Typography variant="body2" className="camera-event-camera">
                {event.cameraName}
              </Typography>
              <Typography variant="caption" className="camera-event-time">
                {event.timestamp.toLocaleTimeString()}
              </Typography>
            </div>
            <div className="camera-event-content">
              <div className={`camera-event-type ${event.type}`}>
                {event.type === "motion" ? <MotionPhotosAuto fontSize="small" /> : <Videocam fontSize="small" />}
              </div>
              <Typography variant="body2" className="camera-event-message">
                {event.message}
              </Typography>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

const CameraGridWidget = ({ config, onConfigChange }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSettingsVisible, setIsSettingsVisible] = useState(false)
  const [selectedCameraIndex, setSelectedCameraIndex] = useState(null)
  const [gridLayout, setGridLayout] = useState("2x2")
  const [isSidebarVisible, setIsSidebarVisible] = useState(false)
  const [isAddCameraDialogOpen, setIsAddCameraDialogOpen] = useState(false)
  const [editingCameraIndex, setEditingCameraIndex] = useState(null)
  const [showPassword, setShowPassword] = useState({})
  const [isLive, setIsLive] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [timeRange, setTimeRange] = useState([0, 24])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isResizable, setIsResizable] = useState(false)
  const [isDraggable, setIsDraggable] = useState(false)
  const [cameraPositions, setCameraPositions] = useState({})
  const [cameraSizes, setCameraSizes] = useState({})

  const [newCameraConfig, setNewCameraConfig] = useState({
    title: "",
    streamUrl: "",
    username: "",
    password: "",
    refreshInterval: 30,
    motionDetection: false,
    motionSensitivity: 50,
    notifications: true,
    recordingEnabled: false,
    storageRetention: 7,
    ptz: false,
  })

  const containerRef = useRef(null)
  const videoRefs = useRef({})
  const hlsInstances = useRef({})

  // Default configuration
  const defaultConfig = {
    title: "Camera Grid",
    cameras: [
      {
        id: "cam1",
        title: "Front Door Camera",
        streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        username: "",
        password: "",
        refreshInterval: 30,
        motionDetection: true,
        motionSensitivity: 50,
        notifications: true,
        recordingEnabled: false,
        storageRetention: 7,
        ptz: false,
        isPlaying: true,
        isConnected: false,
        isLoading: true,
        alerts: [],
        motionDetected: false,
        volume: 50,
        muted: true,
      },
      {
        id: "cam2",
        title: "Parking Lot Camera",
        streamUrl: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
        username: "",
        password: "",
        refreshInterval: 30,
        motionDetection: true,
        motionSensitivity: 70,
        notifications: true,
        recordingEnabled: false,
        storageRetention: 7,
        ptz: true,
        isPlaying: true,
        isConnected: false,
        isLoading: true,
        alerts: [],
        motionDetected: false,
        volume: 50,
        muted: true,
      },
      {
        id: "cam3",
        title: "Back Yard Camera",
        streamUrl:
          "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
        username: "",
        password: "",
        refreshInterval: 30,
        motionDetection: false,
        motionSensitivity: 60,
        notifications: true,
        recordingEnabled: true,
        storageRetention: 14,
        ptz: false,
        isPlaying: true,
        isConnected: false,
        isLoading: true,
        alerts: [],
        motionDetected: false,
        volume: 50,
        muted: true,
      },
      {
        id: "cam4",
        title: "Side Entrance Camera",
        streamUrl:
          "https://multiplatform-f.akamaihd.net/i/multi/april11/sintel/sintel-hd_,512x288_450_b,640x360_700_b,768x432_1000_b,1024x576_1400_m,.mp4.csmil/master.m3u8",
        username: "",
        password: "",
        refreshInterval: 30,
        motionDetection: true,
        motionSensitivity: 55,
        notifications: true,
        recordingEnabled: false,
        storageRetention: 7,
        ptz: false,
        isPlaying: true,
        isConnected: false,
        isLoading: true,
        alerts: [],
        motionDetected: false,
        volume: 50,
        muted: true,
      },
    ],
    gridLayout: "free-form",
    showCameraLabels: true,
    autoRotate: false,
    rotationInterval: 10,
    resizable: true,
    draggable: true,
  }

  const mergedConfig = { ...defaultConfig, ...config }
  const [cameras, setCameras] = useState(mergedConfig.cameras)
  const [editedConfig, setEditedConfig] = useState(mergedConfig)

  // Grid layout options
  const gridLayouts = {
    "free-form": { cols: 0, rows: 0, maxCameras: 16, description: "Free-form (Resizable & Draggable)" },
    "1x1": { cols: 1, rows: 1, maxCameras: 1, description: "Single Camera" },
    "2x2": { cols: 2, rows: 2, maxCameras: 4, description: "2x2 Grid" },
    "3x3": { cols: 3, rows: 3, maxCameras: 9, description: "3x3 Grid" },
    "4x4": { cols: 4, rows: 4, maxCameras: 16, description: "4x4 Grid" },
    "2x3": { cols: 2, rows: 3, maxCameras: 6, description: "2x3 Grid" },
    "3x2": { cols: 3, rows: 2, maxCameras: 6, description: "3x2 Grid" },
  }

  useEffect(() => {
    setEditedConfig(mergedConfig)
    setCameras(mergedConfig.cameras)
    setGridLayout(mergedConfig.gridLayout || "free-form")
    setIsResizable(mergedConfig.resizable !== false)
    setIsDraggable(mergedConfig.draggable !== false)

    // Initialize default positions and sizes for cameras
    const defaultPositions = {}
    const defaultSizes = {}

    mergedConfig.cameras.forEach((camera, index) => {
      const row = Math.floor(index / 2)
      const col = index % 2
      defaultPositions[camera.id] = {
        x: col * 320 + 10,
        y: row * 240 + 10,
      }
      defaultSizes[camera.id] = {
        width: 300,
        height: 225,
      }
    })

    setCameraPositions(defaultPositions)
    setCameraSizes(defaultSizes)
  }, [config])

  // Update current time every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timeInterval)
  }, [])

  // Motion detection simulation
  useEffect(() => {
    const intervals = cameras.map((camera, index) => {
      if (camera.motionDetection) {
        return setInterval(() => {
          const detected = Math.random() > 0.85
          if (detected) {
            updateCameraState(index, { motionDetected: true })
            if (camera.notifications) {
              addCameraAlert(index, "Motion detected")
            }
            setTimeout(() => {
              updateCameraState(index, { motionDetected: false })
            }, 3000)
          }
        }, 15000)
      }
      return null
    })

    return () => {
      intervals.forEach((interval) => {
        if (interval) clearInterval(interval)
      })
    }
  }, [cameras])

  // const initializeCameraStream = (cameraIndex) => {
  //   const camera = cameras[cameraIndex]
  //   if (!camera || !camera.streamUrl) return

  //   updateCameraState(cameraIndex, { isLoading: true, isConnected: false })

  //   // Wait for video element to be available
  //   setTimeout(() => {
  //     const videoElement = videoRefs.current[camera.id]
  //     if (!videoElement) {
  //       updateCameraState(cameraIndex, { isLoading: false, isConnected: false })
  //       addCameraAlert(cameraIndex, "Video element not found")
  //       return
  //     }

  //     // Destroy existing HLS instance
  //     if (hlsInstances.current[camera.id]) {
  //       hlsInstances.current[camera.id].destroy()
  //       delete hlsInstances.current[camera.id]
  //     }

  //     if (Hls.isSupported()) {
  //       const hls = new Hls({
  //         debug: false,
  //         enableWorker: true,
  //         lowLatencyMode: true,
  //         backBufferLength: 90,
  //         maxBufferLength: 30,
  //         maxMaxBufferLength: 600,
  //         maxBufferSize: 60 * 1000 * 1000,
  //         maxBufferHole: 0.5,
  //       })

  //       hls.loadSource(camera.streamUrl)
  //       hls.attachMedia(videoElement)

  //       hls.on(Hls.Events.MANIFEST_PARSED, () => {
  //         console.log(`HLS manifest parsed for camera ${camera.id}`)
  //         updateCameraState(cameraIndex, { isLoading: false, isConnected: true })
  //         if (camera.isPlaying) {
  //           videoElement.play().catch((error) => {
  //             console.error(`Error playing video for camera ${camera.id}:`, error)
  //             // Try to play muted if autoplay failed
  //             videoElement.muted = true
  //             videoElement.play().catch((e) => {
  //               console.error(`Error playing muted video for camera ${camera.id}:`, e)
  //             })
  //           })
  //         }
  //       })

  //       hls.on(Hls.Events.ERROR, (event, data) => {
  //         console.error(`HLS error for camera ${camera.id}:`, data)
  //         if (data.fatal) {
  //           switch (data.type) {
  //             case Hls.ErrorTypes.NETWORK_ERROR:
  //               console.log("Network error, trying to recover...")
  //               hls.startLoad()
  //               setTimeout(() => {
  //                 if (!cameras[cameraIndex]?.isConnected) {
  //                   updateCameraState(cameraIndex, { isConnected: false, isLoading: false })
  //                   addCameraAlert(cameraIndex, "Network connection failed")
  //                 }
  //               }, 5000)
  //               break
  //             case Hls.ErrorTypes.MEDIA_ERROR:
  //               console.log("Media error, trying to recover...")
  //               hls.recoverMediaError()
  //               setTimeout(() => {
  //                 if (!cameras[cameraIndex]?.isConnected) {
  //                   updateCameraState(cameraIndex, { isConnected: false, isLoading: false })
  //                   addCameraAlert(cameraIndex, "Media playback error")
  //                 }
  //               }, 3000)
  //               break
  //             default:
  //               updateCameraState(cameraIndex, { isConnected: false, isLoading: false })
  //               addCameraAlert(cameraIndex, "Fatal streaming error")
  //               hls.destroy()
  //               delete hlsInstances.current[camera.id]
  //               break
  //           }
  //         }
  //       })

  //       hls.on(Hls.Events.FRAG_LOADED, () => {
  //         if (!cameras[cameraIndex]?.isConnected) {
  //           updateCameraState(cameraIndex, { isConnected: true, isLoading: false })
  //         }
  //       })

  //       hlsInstances.current[camera.id] = hls
  //     } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
  //       // For Safari
  //       videoElement.src = camera.streamUrl

  //       const handleLoadedMetadata = () => {
  //         console.log(`Safari HLS loaded for camera ${camera.id}`)
  //         updateCameraState(cameraIndex, { isLoading: false, isConnected: true })
  //         if (camera.isPlaying) {
  //           videoElement.play().catch((error) => {
  //             console.error(`Error playing video for camera ${camera.id}:`, error)
  //             videoElement.muted = true
  //             videoElement.play().catch((e) => {
  //               console.error(`Error playing muted video for camera ${camera.id}:`, e)
  //             })
  //           })
  //         }
  //       }

  //       const handleError = (e) => {
  //         console.error(`Video error for camera ${camera.id}:`, e)
  //         updateCameraState(cameraIndex, { isConnected: false, isLoading: false })
  //         addCameraAlert(cameraIndex, "Error loading video stream")
  //       }

  //       const handleCanPlay = () => {
  //         updateCameraState(cameraIndex, { isLoading: false, isConnected: true })
  //       }

  //       videoElement.addEventListener("loadedmetadata", handleLoadedMetadata)
  //       videoElement.addEventListener("error", handleError)
  //       videoElement.addEventListener("canplay", handleCanPlay)

  //       // Cleanup function
  //       videoElement._cleanup = () => {
  //         videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata)
  //         videoElement.removeEventListener("error", handleError)
  //         videoElement.removeEventListener("canplay", handleCanPlay)
  //       }
  //     } else {
  //       updateCameraState(cameraIndex, { isLoading: false, isConnected: false })
  //       addCameraAlert(cameraIndex, "HLS not supported in this browser")
  //     }
  //   }, 100)
  // }
// Max retries per camera instance
const MAX_HLS_RETRIES = 2
const hlsRetryCount = useRef({})

const initializeCameraStream = (cameraIndex) => {
  const camera = cameras[cameraIndex]
  if (!camera || !camera.streamUrl) return

  updateCameraState(cameraIndex, { isLoading: true, isConnected: false })
  hlsRetryCount.current[camera.id] = 0

  setTimeout(() => {
    const videoElement = videoRefs.current[camera.id]
    if (!videoElement) {
      updateCameraState(cameraIndex, { isLoading: false, isConnected: false })
      addCameraAlert(cameraIndex, "Video element not found")
      return
    }

    // --- Clean up previous HLS instance & events ---
    if (hlsInstances.current[camera.id]) {
      hlsInstances.current[camera.id].destroy()
      delete hlsInstances.current[camera.id]
    }
    if (videoElement._cleanup) {
      videoElement._cleanup()
      delete videoElement._cleanup
    }
    videoElement.pause()
    videoElement.removeAttribute("src")
    videoElement.load()

    // --- HLS supported ---
    if (Hls.isSupported()) {
      const hls = new Hls({ debug: false, enableWorker: true })
      hlsInstances.current[camera.id] = hls

      hls.attachMedia(videoElement)
      hls.loadSource(camera.streamUrl)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        updateCameraState(cameraIndex, { isLoading: false, isConnected: true })
        hlsRetryCount.current[camera.id] = 0

        if (camera.isPlaying) {
          videoElement.play().catch((error) => {
            // Fallback: try muted play
            videoElement.muted = true
            videoElement.play().catch((e) => {
              addCameraAlert(cameraIndex, "Autoplay failed")
              console.error(`Video play error for camera ${camera.id}:`, e)
            })
          })
        }
      })

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error(`HLS error for camera ${camera.id}:`, data)
        if (data.fatal) {
          let retry = hlsRetryCount.current[camera.id] ?? 0
          if ((data.type === Hls.ErrorTypes.NETWORK_ERROR || data.type === Hls.ErrorTypes.MEDIA_ERROR) && retry < MAX_HLS_RETRIES) {
            hlsRetryCount.current[camera.id] = retry + 1
            setTimeout(() => {
              hls.startLoad()
            }, 1000)
            addCameraAlert(cameraIndex, `Retrying stream... (${retry + 1})`)
          } else {
            updateCameraState(cameraIndex, { isConnected: false, isLoading: false })
            addCameraAlert(cameraIndex, "Stream error: " + data.details)
            hls.destroy()
            delete hlsInstances.current[camera.id]
          }
        }
      })

      // Recover if fragment loaded (sometimes not connected on slow network)
      hls.on(Hls.Events.FRAG_LOADED, () => {
        updateCameraState(cameraIndex, { isConnected: true, isLoading: false })
      })
    }
    // --- Safari Native HLS ---
    else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
      videoElement.src = camera.streamUrl
      const handleLoaded = () => {
        updateCameraState(cameraIndex, { isLoading: false, isConnected: true })
        if (camera.isPlaying) {
          videoElement.play().catch((e) => {
            videoElement.muted = true
            videoElement.play().catch((err) => {
              addCameraAlert(cameraIndex, "Safari autoplay failed")
            })
          })
        }
      }
      const handleError = () => {
        updateCameraState(cameraIndex, { isLoading: false, isConnected: false })
        addCameraAlert(cameraIndex, "Safari failed to load stream")
      }
      videoElement.addEventListener("loadedmetadata", handleLoaded)
      videoElement.addEventListener("error", handleError)
      videoElement._cleanup = () => {
        videoElement.removeEventListener("loadedmetadata", handleLoaded)
        videoElement.removeEventListener("error", handleError)
      }
    }
    // --- Not supported ---
    else {
      updateCameraState(cameraIndex, { isLoading: false, isConnected: false })
      addCameraAlert(cameraIndex, "HLS not supported in this browser")
    }
  }, 100)
}


  const destroyCameraStream = (cameraIndex) => {
    const camera = cameras[cameraIndex]
    if (!camera) return

    const videoElement = videoRefs.current[camera.id]
    if (videoElement) {
      videoElement.pause()
      videoElement.removeAttribute("src")
      videoElement.load()

      // Clean up Safari event listeners
      if (videoElement._cleanup) {
        videoElement._cleanup()
        delete videoElement._cleanup
      }
    }

    if (hlsInstances.current[camera.id]) {
      hlsInstances.current[camera.id].destroy()
      delete hlsInstances.current[camera.id]
    }

    updateCameraState(cameraIndex, { isConnected: false })
  }

  const updateCameraState = (cameraIndex, updates) => {
    setCameras((prev) => prev.map((camera, index) => (index === cameraIndex ? { ...camera, ...updates } : camera)))
  }

  const addCameraAlert = (cameraIndex, message) => {
    const newAlert = {
      id: Date.now(),
      message,
      timestamp: new Date(),
    }

    updateCameraState(cameraIndex, {
      alerts: [...(cameras[cameraIndex]?.alerts || []), newAlert].slice(0, 50),
    })
  }

  const deleteAlert = (cameraIndex, alertId) => {
    const camera = cameras[cameraIndex]
    if (camera) {
      const updatedAlerts = camera.alerts.filter((alert) => alert.id !== alertId)
      updateCameraState(cameraIndex, { alerts: updatedAlerts })
    }
  }

  const clearAllAlerts = (cameraIndex) => {
    updateCameraState(cameraIndex, { alerts: [] })
  }

  const toggleCameraPlayPause = (cameraIndex) => {
    const camera = cameras[cameraIndex]
    const videoElement = videoRefs.current[camera.id]

    if (videoElement) {
      if (camera.isPlaying) {
        videoElement.pause()
      } else {
        videoElement.play().catch((error) => {
          console.error(`Error playing video for camera ${camera.id}:`, error)
        })
      }
      updateCameraState(cameraIndex, { isPlaying: !camera.isPlaying })
    }
  }

  const toggleCameraMute = (cameraIndex) => {
    const camera = cameras[cameraIndex]
    const videoElement = videoRefs.current[camera.id]

    if (videoElement) {
      videoElement.muted = !camera.muted
      updateCameraState(cameraIndex, { muted: !camera.muted })
    }
  }

  const handleVolumeChange = (cameraIndex, volume) => {
    const camera = cameras[cameraIndex]
    const videoElement = videoRefs.current[camera.id]

    if (videoElement) {
      videoElement.volume = volume / 100
      updateCameraState(cameraIndex, { volume })
    }
  }

  const handleCameraClick = (cameraIndex) => {
    setSelectedCameraIndex(selectedCameraIndex === cameraIndex ? null : cameraIndex)
  }

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const toggleSettings = () => {
    setIsSettingsVisible(!isSettingsVisible)
    handleMenuClose()
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err)
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleGridLayoutChange = (newLayout) => {
    setGridLayout(newLayout)
    setEditedConfig((prev) => ({ ...prev, gridLayout: newLayout }))

    // Reset positions and sizes when switching to/from free-form
    if (newLayout === "free-form" || gridLayout === "free-form") {
      const newPositions = {}
      const newSizes = {}

      cameras.forEach((camera, index) => {
        if (newLayout === "free-form") {
          // Set default free-form positions
          const row = Math.floor(index / 2)
          const col = index % 2
          newPositions[camera.id] = {
            x: col * 320 + 10,
            y: row * 240 + 10,
          }
          newSizes[camera.id] = {
            width: 300,
            height: 225,
          }
        }
      })

      if (newLayout === "free-form") {
        setCameraPositions(newPositions)
        setCameraSizes(newSizes)
      }
    }
  }

  const handleCameraResize = (cameraId, size) => {
    setCameraSizes((prev) => ({
      ...prev,
      [cameraId]: size,
    }))
  }

  const handleCameraDrag = (cameraId, position) => {
    setCameraPositions((prev) => ({
      ...prev,
      [cameraId]: position,
    }))
  }

  const handleAddCamera = () => {
    const newCamera = {
      id: `cam${Date.now()}`,
      ...newCameraConfig,
      isPlaying: true,
      isConnected: false,
      isLoading: false,
      alerts: [],
      motionDetected: false,
      volume: 0,
      muted: true,
    }

    const updatedCameras = [...cameras, newCamera]
    setCameras(updatedCameras)
    setEditedConfig((prev) => ({ ...prev, cameras: updatedCameras }))

    // Set default position and size for new camera
    const newIndex = cameras.length
    const row = Math.floor(newIndex / 2)
    const col = newIndex % 2

    setCameraPositions((prev) => ({
      ...prev,
      [newCamera.id]: {
        x: col * 320 + 10,
        y: row * 240 + 10,
      },
    }))

    setCameraSizes((prev) => ({
      ...prev,
      [newCamera.id]: {
        width: 300,
        height: 225,
      },
    }))

    setIsAddCameraDialogOpen(false)
    setNewCameraConfig({
      title: "",
      streamUrl: "",
      username: "",
      password: "",
      refreshInterval: 30,
      motionDetection: false,
      motionSensitivity: 50,
      notifications: true,
      recordingEnabled: false,
      storageRetention: 7,
      ptz: false,
    })
  }

  const handleRemoveCamera = (cameraIndex) => {
    const cameraToRemove = cameras[cameraIndex]

    // Destroy stream before removing
    destroyCameraStream(cameraIndex)

    const updatedCameras = cameras.filter((_, index) => index !== cameraIndex)
    setCameras(updatedCameras)
    setEditedConfig((prev) => ({ ...prev, cameras: updatedCameras }))

    // Remove position and size data
    setCameraPositions((prev) => {
      const newPositions = { ...prev }
      delete newPositions[cameraToRemove.id]
      return newPositions
    })

    setCameraSizes((prev) => {
      const newSizes = { ...prev }
      delete newSizes[cameraToRemove.id]
      return newSizes
    })

    if (selectedCameraIndex === cameraIndex) {
      setSelectedCameraIndex(null)
    }
    if (editingCameraIndex === cameraIndex) {
      setEditingCameraIndex(null)
    }
  }

  const handleCameraConfigChange = (cameraIndex, field, value) => {
    const updatedCameras = cameras.map((camera, index) =>
      index === cameraIndex ? { ...camera, [field]: value } : camera,
    )
    setCameras(updatedCameras)
    setEditedConfig((prev) => ({ ...prev, cameras: updatedCameras }))

    // If stream URL changed, reinitialize the stream
    if (field === "streamUrl") {
      setTimeout(() => {
        destroyCameraStream(cameraIndex)
        initializeCameraStream(cameraIndex)
      }, 100)
    }
  }

  const saveSettings = () => {
    const configToSave = {
      ...editedConfig,
      cameraPositions,
      cameraSizes,
      resizable: isResizable,
      draggable: isDraggable,
    }
    onConfigChange?.(configToSave)
    setIsSettingsVisible(false)
    setEditingCameraIndex(null)
  }

  const cancelSettings = () => {
    setEditedConfig(mergedConfig)
    setCameras(mergedConfig.cameras)
    setGridLayout(mergedConfig.gridLayout || "free-form")
    setIsResizable(mergedConfig.resizable !== false)
    setIsDraggable(mergedConfig.draggable !== false)
    setIsSettingsVisible(false)
    setEditingCameraIndex(null)
  }

  const handlePtzControl = (cameraIndex, direction) => {
    const camera = cameras[cameraIndex]
    if (camera?.ptz) {
      addCameraAlert(cameraIndex, `PTZ Command: ${direction}`)
    }
  }

  const toggleLiveMode = () => {
    setIsLive(!isLive)
    if (!isLive) {
      // Reinitialize streams when switching back to live
      cameras.forEach((_, index) => {
        destroyCameraStream(index)
        initializeCameraStream(index)
      })
    }
  }

  const loadRecordingForDate = (cameraIndex, date, timeRange) => {
    updateCameraState(cameraIndex, { isLoading: true })
    setTimeout(() => {
      updateCameraState(cameraIndex, { isLoading: false, isConnected: true })
      addCameraAlert(
        cameraIndex,
        `Loaded recording for ${date.toLocaleDateString()} from ${timeRange[0]}:00 to ${timeRange[1]}:00`,
      )
    }, 1500)
  }

  const formatTimeRange = (range) => {
    return `${range[0]}:00 - ${range[1]}:00`
  }

  const resetCameraLayout = () => {
    const defaultPositions = {}
    const defaultSizes = {}

    cameras.forEach((camera, index) => {
      const row = Math.floor(index / 2)
      const col = index % 2
      defaultPositions[camera.id] = {
        x: col * 320 + 10,
        y: row * 240 + 10,
      }
      defaultSizes[camera.id] = {
        width: 300,
        height: 225,
      }
    })

    setCameraPositions(defaultPositions)
    setCameraSizes(defaultSizes)
  }

  const renderVideoElement = (camera, index) => {
    return (
      <video
        ref={(el) => {
          if (el) {
            videoRefs.current[camera.id] = el
          }
        }}
        className="camera-video"
        playsInline
        muted={camera.muted !== false} // Default to muted for autoplay
        controls={false}
        preload="metadata"
        crossOrigin="anonymous"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          backgroundColor: "#000",
        }}
        onLoadStart={() => {
          console.log(`Video load started for camera ${camera.id}`)
        }}
        onCanPlay={() => {
          console.log(`Video can play for camera ${camera.id}`)
          if (!camera.isConnected) {
            updateCameraState(index, { isLoading: false, isConnected: true })
          }
        }}
        onError={(e) => {
          console.error(`Video error for camera ${camera.id}:`, e)
          updateCameraState(index, { isLoading: false, isConnected: false })
          addCameraAlert(index, "Video playback error")
        }}
        onPlay={() => {
          console.log(`Video playing for camera ${camera.id}`)
          updateCameraState(index, { isPlaying: true })
        }}
        onPause={() => {
          console.log(`Video paused for camera ${camera.id}`)
          updateCameraState(index, { isPlaying: false })
        }}
      />
    )
  }

  const renderCameraGrid = () => {
    const layout = gridLayouts[gridLayout]
    const visibleCameras = cameras.slice(0, layout.maxCameras)

    if (gridLayout === "free-form") {
      return (
        <div className="camera-free-form-container">
          {visibleCameras.map((camera, index) => {
            const isSelected = selectedCameraIndex === index
            const position = cameraPositions[camera.id] || { x: 10, y: 10 }
            const size = cameraSizes[camera.id] || { width: 300, height: 225 }

            return (
              <Rnd
                key={camera.id}
                size={size}
                position={position}
                onDragStop={(e, d) => handleCameraDrag(camera.id, { x: d.x, y: d.y })}
                onResizeStop={(e, direction, ref, delta, position) => {
                  handleCameraResize(camera.id, {
                    width: ref.offsetWidth,
                    height: ref.offsetHeight,
                  })
                  handleCameraDrag(camera.id, position)
                }}
                minWidth={200}
                minHeight={150}
                maxWidth={800}
                maxHeight={600}
                disableDragging={!isDraggable}
                enableResizing={
                  isResizable
                    ? {
                        top: true,
                        right: true,
                        bottom: true,
                        left: true,
                        topRight: true,
                        bottomRight: true,
                        bottomLeft: true,
                        topLeft: true,
                      }
                    : false
                }
                className={`camera-rnd-item ${isSelected ? "selected" : ""}`}
                dragHandleClassName="camera-drag-handle"
              >
                <div
                  className={`camera-grid-item ${isSelected ? "selected" : ""}`}
                  onClick={() => handleCameraClick(index)}
                >
                  {/* Drag Handle */}
                  {isDraggable && (
                    <div className="camera-drag-handle">
                      <DragIndicator fontSize="small" />
                    </div>
                  )}

                  {/* Resize Handle */}
                  {isResizable && (
                    <div className="camera-resize-handle">
                      <AspectRatio fontSize="small" />
                    </div>
                  )}

                  <div className="camera-video-container">
                    {camera.isLoading && (
                      <div className="camera-loading-overlay">
                        <CircularProgress size={24} />
                        <Typography variant="caption" style={{ color: "white" }}>
                          {isLive ? "Connecting..." : "Loading Recording..."}
                        </Typography>
                      </div>
                    )}

                    {!camera.isConnected && !camera.isLoading && (
                      <div className="camera-error-overlay">
                        <Typography variant="caption">Connection Failed</Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Refresh />}
                          onClick={(e) => {
                            e.stopPropagation()
                            initializeCameraStream(index)
                          }}
                          style={{ marginTop: 8 }}
                        >
                          Retry
                        </Button>
                      </div>
                    )}

                    {camera.isConnected && renderVideoElement(camera, index)}
                  </div>

                  {/* Camera Label */}
                  {editedConfig.showCameraLabels && (
                    <div className="camera-label">
                      <Typography className="camera-label-text">{camera.title}</Typography>
                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        {camera.motionDetected && (
                          <Chip
                            icon={<MotionPhotosAuto />}
                            label="Motion"
                            size="small"
                            color="error"
                            className="camera-motion-chip"
                          />
                        )}
                        {camera.recordingEnabled && (
                          <Chip label="REC" size="small" color="error" className="camera-motion-chip" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Live/Recording Indicator */}
                  {camera.isConnected && (
                    <div className="camera-live-indicator">
                      <div className="camera-live-dot"></div>
                      {isLive ? "LIVE" : "PLAYBACK"}
                    </div>
                  )}

                  {/* Play/Pause Control */}
                  <div className="camera-play-control">
                    <IconButton
                      size="small"
                      className="camera-control-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCameraPlayPause(index)
                      }}
                    >
                      {camera.isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
                    </IconButton>
                  </div>

                  {/* Volume Control */}
                  <div className="camera-volume-control">
                    <IconButton
                      size="small"
                      className="camera-control-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCameraMute(index)
                      }}
                    >
                      {camera.muted ? <VolumeOff fontSize="small" /> : <VolumeUp fontSize="small" />}
                    </IconButton>
                  </div>

                  {/* PTZ Controls */}
                  {isSelected && camera.ptz && (
                    <div className="camera-ptz-controls">
                      <div className="ptz-row">
                        <IconButton
                          size="small"
                          className="ptz-control-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePtzControl(index, "up")
                          }}
                        >
                          <ArrowUpward fontSize="small" />
                        </IconButton>
                      </div>
                      <div className="ptz-row">
                        <IconButton
                          size="small"
                          className="ptz-control-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePtzControl(index, "left")
                          }}
                        >
                          <ArrowBack fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          className="ptz-control-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePtzControl(index, "home")
                          }}
                        >
                          <Home fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          className="ptz-control-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePtzControl(index, "right")
                          }}
                        >
                          <ArrowForward fontSize="small" />
                        </IconButton>
                      </div>
                      <div className="ptz-row">
                        <IconButton
                          size="small"
                          className="ptz-control-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePtzControl(index, "down")
                          }}
                        >
                          <ArrowDownward fontSize="small" />
                        </IconButton>
                      </div>
                      <div className="ptz-row">
                        <IconButton
                          size="small"
                          className="ptz-control-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePtzControl(index, "zoom_in")
                          }}
                        >
                          <ZoomIn fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          className="ptz-control-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePtzControl(index, "zoom_out")
                          }}
                        >
                          <ZoomOut fontSize="small" />
                        </IconButton>
                      </div>
                    </div>
                  )}

                  {/* Camera Info */}
                  <div className="camera-info">
                    <Typography variant="caption" className="timestamp">
                      {currentTime.toLocaleTimeString()}
                    </Typography>
                  </div>
                </div>
              </Rnd>
            )
          })}
        </div>
      )
    }

    // Regular grid layout
    return (
      <div className={`camera-grid-container layout-${gridLayout}`}>
        {Array.from({ length: layout.maxCameras }).map((_, index) => {
          const camera = visibleCameras[index]
          const isSelected = selectedCameraIndex === index
          const isEmpty = !camera

          return (
            <div
              key={index}
              className={`camera-grid-item ${isSelected ? "selected" : ""} ${isEmpty ? "empty" : ""}`}
              onClick={() => !isEmpty && handleCameraClick(index)}
            >
              {isEmpty ? (
                <div className="camera-empty-slot">
                  <Videocam className="camera-empty-icon" />
                  <Typography className="camera-empty-text">Empty Slot</Typography>
                </div>
              ) : (
                <>
                  <div className="camera-video-container">
                    {camera.isLoading && (
                      <div className="camera-loading-overlay">
                        <CircularProgress size={24} />
                        <Typography variant="caption" style={{ color: "white" }}>
                          {isLive ? "Connecting..." : "Loading Recording..."}
                        </Typography>
                      </div>
                    )}

                    {!camera.isConnected && !camera.isLoading && (
                      <div className="camera-error-overlay">
                        <Typography variant="caption">Connection Failed</Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Refresh />}
                          onClick={(e) => {
                            e.stopPropagation()
                            initializeCameraStream(index)
                          }}
                          style={{ marginTop: 8 }}
                        >
                          Retry
                        </Button>
                      </div>
                    )}

                    {camera.isConnected && renderVideoElement(camera, index)}
                  </div>

                  {/* Camera Label */}
                  {editedConfig.showCameraLabels && (
                    <div className="camera-label">
                      <Typography className="camera-label-text">{camera.title}</Typography>
                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        {camera.motionDetected && (
                          <Chip
                            icon={<MotionPhotosAuto />}
                            label="Motion"
                            size="small"
                            color="error"
                            className="camera-motion-chip"
                          />
                        )}
                        {camera.recordingEnabled && (
                          <Chip label="REC" size="small" color="error" className="camera-motion-chip" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Live/Recording Indicator */}
                  {camera.isConnected && (
                    <div className="camera-live-indicator">
                      <div className="camera-live-dot"></div>
                      {isLive ? "LIVE" : "PLAYBACK"}
                    </div>
                  )}

                  {/* Play/Pause Control */}
                  <div className="camera-play-control">
                    <IconButton
                      size="small"
                      className="camera-control-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCameraPlayPause(index)
                      }}
                    >
                      {camera.isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
                    </IconButton>
                  </div>

                  {/* Volume Control */}
                  <div className="camera-volume-control">
                    <IconButton
                      size="small"
                      className="camera-control-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCameraMute(index)
                      }}
                    >
                      {camera.muted ? <VolumeOff fontSize="small" /> : <VolumeUp fontSize="small" />}
                    </IconButton>
                  </div>

                  {/* PTZ Controls */}
                  {isSelected && camera.ptz && (
                    <div className="camera-ptz-controls">
                      <div className="ptz-row">
                        <IconButton
                          size="small"
                          className="ptz-control-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePtzControl(index, "up")
                          }}
                        >
                          <ArrowUpward fontSize="small" />
                        </IconButton>
                      </div>
                      <div className="ptz-row">
                        <IconButton
                          size="small"
                          className="ptz-control-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePtzControl(index, "left")
                          }}
                        >
                          <ArrowBack fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          className="ptz-control-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePtzControl(index, "home")
                          }}
                        >
                          <Home fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          className="ptz-control-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePtzControl(index, "right")
                          }}
                        >
                          <ArrowForward fontSize="small" />
                        </IconButton>
                      </div>
                      <div className="ptz-row">
                        <IconButton
                          size="small"
                          className="ptz-control-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePtzControl(index, "down")
                          }}
                        >
                          <ArrowDownward fontSize="small" />
                        </IconButton>
                      </div>
                      <div className="ptz-row">
                        <IconButton
                          size="small"
                          className="ptz-control-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePtzControl(index, "zoom_in")
                          }}
                        >
                          <ZoomIn fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          className="ptz-control-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePtzControl(index, "zoom_out")
                          }}
                        >
                          <ZoomOut fontSize="small" />
                        </IconButton>
                      </div>
                    </div>
                  )}

                  {/* Camera Info */}
                  <div className="camera-info">
                    <Typography variant="caption" className="timestamp">
                      {currentTime.toLocaleTimeString()}
                    </Typography>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderSelectedCameraDetails = () => {
    if (selectedCameraIndex === null || !cameras[selectedCameraIndex]) return null

    const camera = cameras[selectedCameraIndex]

    return (
      <div className="selected-camera-details">
        <Typography variant="h6" gutterBottom>
          {camera.title} - Details
        </Typography>

        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="fullWidth">
          <Tab label={isLive ? "Live" : "Playback"} />
          <Tab label="Alerts" />
          <Tab label="Settings" />
        </Tabs>

        <div className="selected-camera-tab-content">
          {activeTab === 0 && (
            <div>
              {isLive ? (
                <div>
                  <div className="camera-status-item">
                    <Typography variant="body2">Status:</Typography>
                    <Typography variant="body2" color={camera.isConnected ? "success.main" : "error.main"}>
                      {camera.isConnected ? "Connected" : "Disconnected"}
                    </Typography>
                  </div>
                  <div className="camera-status-item">
                    <Typography variant="body2">Motion Detection:</Typography>
                    <Typography variant="body2">{camera.motionDetection ? "Enabled" : "Disabled"}</Typography>
                  </div>
                  <div className="camera-status-item">
                    <Typography variant="body2">PTZ Controls:</Typography>
                    <Typography variant="body2">{camera.ptz ? "Available" : "Not Available"}</Typography>
                  </div>
                  <div className="camera-status-item">
                    <Typography variant="body2">Recording:</Typography>
                    <Typography variant="body2">{camera.recordingEnabled ? "Enabled" : "Disabled"}</Typography>
                  </div>
                  {gridLayout === "free-form" && (
                    <div className="camera-status-item">
                      <Typography variant="body2">Size:</Typography>
                      <Typography variant="body2">
                        {Math.round(cameraSizes[camera.id]?.width || 300)} x{" "}
                        {Math.round(cameraSizes[camera.id]?.height || 225)}
                      </Typography>
                    </div>
                  )}
                  <div className="camera-status-item">
                    <Typography variant="body2">Volume:</Typography>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                      <IconButton size="small" onClick={() => toggleCameraMute(selectedCameraIndex)}>
                        {camera.muted ? <VolumeOff fontSize="small" /> : <VolumeUp fontSize="small" />}
                      </IconButton>
                      <Slider
                        size="small"
                        value={camera.volume}
                        onChange={(e, value) => handleVolumeChange(selectedCameraIndex, value)}
                        disabled={camera.muted}
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={toggleLiveMode}
                    fullWidth
                    style={{ marginTop: "16px" }}
                    startIcon={<CalendarToday />}
                  >
                    Switch to Playback
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="date-selector">
                    <Typography variant="body2">Select Date:</Typography>
                    <input
                      type="date"
                      value={selectedDate.toISOString().split("T")[0]}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      className="date-input"
                    />
                  </div>
                  <div className="time-selector">
                    <Typography variant="body2">Time Range: {formatTimeRange(timeRange)}</Typography>
                    <Slider
                      value={timeRange}
                      onChange={(e, newValue) => setTimeRange(newValue)}
                      valueLabelDisplay="auto"
                      min={0}
                      max={24}
                      step={1}
                      size="small"
                    />
                  </div>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => loadRecordingForDate(selectedCameraIndex, selectedDate, timeRange)}
                    fullWidth
                    size="small"
                    style={{ marginBottom: "8px" }}
                  >
                    Load Recording
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={toggleLiveMode}
                    fullWidth
                    size="small"
                    startIcon={<Videocam />}
                  >
                    Switch to Live
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 1 && (
            <div>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}
              >
                <Typography variant="subtitle2">Recent Alerts ({camera.alerts?.length || 0})</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => clearAllAlerts(selectedCameraIndex)}
                  disabled={!camera.alerts?.length}
                >
                  Clear All
                </Button>
              </div>
              {camera.alerts?.length > 0 ? (
                <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {camera.alerts.map((alert) => (
                    <div key={alert.id} className="camera-alert-item">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <Typography className="camera-alert-message">{alert.message}</Typography>
                          <Typography className="camera-alert-time">{alert.timestamp.toLocaleTimeString()}</Typography>
                        </div>
                        <IconButton size="small" onClick={() => deleteAlert(selectedCameraIndex, alert.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No recent alerts
                </Typography>
              )}
            </div>
          )}

          {activeTab === 2 && (
            <div>
              <TextField
                label="Camera Name"
                value={camera.title}
                onChange={(e) => handleCameraConfigChange(selectedCameraIndex, "title", e.target.value)}
                fullWidth
                margin="normal"
                size="small"
              />
              <TextField
                label="Stream URL"
                value={camera.streamUrl}
                onChange={(e) => handleCameraConfigChange(selectedCameraIndex, "streamUrl", e.target.value)}
                fullWidth
                margin="normal"
                size="small"
              />
              <TextField
                label="Username"
                value={camera.username}
                onChange={(e) => handleCameraConfigChange(selectedCameraIndex, "username", e.target.value)}
                fullWidth
                margin="normal"
                size="small"
              />
              <TextField
                label="Password"
                type={showPassword[selectedCameraIndex] ? "text" : "password"}
                value={camera.password}
                onChange={(e) => handleCameraConfigChange(selectedCameraIndex, "password", e.target.value)}
                fullWidth
                margin="normal"
                size="small"
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() =>
                        setShowPassword((prev) => ({
                          ...prev,
                          [selectedCameraIndex]: !prev[selectedCameraIndex],
                        }))
                      }
                      size="small"
                    >
                      {showPassword[selectedCameraIndex] ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  ),
                }}
              />
              <TextField
                label="Refresh Interval (seconds)"
                type="number"
                value={camera.refreshInterval}
                onChange={(e) =>
                  handleCameraConfigChange(selectedCameraIndex, "refreshInterval", Number.parseInt(e.target.value))
                }
                fullWidth
                margin="normal"
                size="small"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={camera.motionDetection}
                    onChange={(e) => handleCameraConfigChange(selectedCameraIndex, "motionDetection", e.target.checked)}
                  />
                }
                label="Motion Detection"
              />
              {camera.motionDetection && (
                <div style={{ marginLeft: "16px", marginBottom: "16px" }}>
                  <Typography variant="body2">Motion Sensitivity: {camera.motionSensitivity}%</Typography>
                  <Slider
                    value={camera.motionSensitivity}
                    onChange={(e, value) => handleCameraConfigChange(selectedCameraIndex, "motionSensitivity", value)}
                    min={0}
                    max={100}
                    size="small"
                  />
                </div>
              )}
              <FormControlLabel
                control={
                  <Switch
                    checked={camera.notifications}
                    onChange={(e) => handleCameraConfigChange(selectedCameraIndex, "notifications", e.target.checked)}
                  />
                }
                label="Enable Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={camera.recordingEnabled}
                    onChange={(e) =>
                      handleCameraConfigChange(selectedCameraIndex, "recordingEnabled", e.target.checked)
                    }
                  />
                }
                label="Enable Recording"
              />
              {camera.recordingEnabled && (
                <TextField
                  label="Storage Retention (days)"
                  type="number"
                  value={camera.storageRetention}
                  onChange={(e) =>
                    handleCameraConfigChange(selectedCameraIndex, "storageRetention", Number.parseInt(e.target.value))
                  }
                  fullWidth
                  margin="normal"
                  size="small"
                />
              )}
              <FormControlLabel
                control={
                  <Switch
                    checked={camera.ptz}
                    onChange={(e) => handleCameraConfigChange(selectedCameraIndex, "ptz", e.target.checked)}
                  />
                }
                label="PTZ Controls"
              />
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleRemoveCamera(selectedCameraIndex)}
                style={{ marginTop: "16px" }}
                fullWidth
              >
                Remove Camera
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderCameraSettings = () => {
    if (editingCameraIndex === null) {
      return (
        <div className="camera-grid-settings">
          <Typography variant="h6" gutterBottom>
            Grid Settings
          </Typography>

          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>Grid Layout</InputLabel>
            <Select value={gridLayout} onChange={(e) => handleGridLayoutChange(e.target.value)} label="Grid Layout">
              {Object.keys(gridLayouts).map((layout) => (
                <MenuItem key={layout} value={layout}>
                  {gridLayouts[layout].description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={editedConfig.showCameraLabels}
                onChange={(e) =>
                  setEditedConfig((prev) => ({
                    ...prev,
                    showCameraLabels: e.target.checked,
                  }))
                }
              />
            }
            label="Show Camera Labels"
          />

          {gridLayout === "free-form" && (
            <>
              <FormControlLabel
                control={<Switch checked={isDraggable} onChange={(e) => setIsDraggable(e.target.checked)} />}
                label="Enable Dragging"
              />

              <FormControlLabel
                control={<Switch checked={isResizable} onChange={(e) => setIsResizable(e.target.checked)} />}
                label="Enable Resizing"
              />

              <Button variant="outlined" onClick={resetCameraLayout} fullWidth style={{ marginTop: "16px" }}>
                Reset Layout
              </Button>
            </>
          )}

          <Divider style={{ margin: "16px 0" }} />

          <Typography variant="h6" gutterBottom>
            Camera Management
          </Typography>

          <List>
            {cameras.map((camera, index) => (
              <ListItem key={camera.id}>
                <ListItemText
                  primary={camera.title}
                  secondary={`${camera.streamUrl} - ${camera.isConnected ? "Connected" : "Disconnected"}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => setEditingCameraIndex(index)}
                    size="small"
                    style={{ marginRight: 8 }}
                  >
                    <Settings fontSize="small" />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleRemoveCamera(index)} size="small">
                    <Delete fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setIsAddCameraDialogOpen(true)}
            fullWidth
            style={{ marginTop: "16px" }}
          >
            Add New Camera
          </Button>

          <div className="settings-actions">
            <Button variant="outlined" color="secondary" startIcon={<Cancel />} onClick={cancelSettings} size="small">
              Cancel
            </Button>
            <Button variant="contained" color="primary" startIcon={<Save />} onClick={saveSettings} size="small">
              Save
            </Button>
          </div>
        </div>
      )
    }

    // Individual camera settings
    const camera = cameras[editingCameraIndex]
    return (
      <div className="camera-grid-settings">
        <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
          <IconButton onClick={() => setEditingCameraIndex(null)} size="small">
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" style={{ marginLeft: "8px" }}>
            {camera.title} Settings
          </Typography>
        </div>

        <TextField
          label="Camera Name"
          value={camera.title}
          onChange={(e) => handleCameraConfigChange(editingCameraIndex, "title", e.target.value)}
          fullWidth
          margin="normal"
          size="small"
        />

        <TextField
          label="Stream URL"
          value={camera.streamUrl}
          onChange={(e) => handleCameraConfigChange(editingCameraIndex, "streamUrl", e.target.value)}
          fullWidth
          margin="normal"
          size="small"
        />

        <TextField
          label="Username"
          value={camera.username}
          onChange={(e) => handleCameraConfigChange(editingCameraIndex, "username", e.target.value)}
          fullWidth
          margin="normal"
          size="small"
        />

        <TextField
          label="Password"
          type={showPassword[editingCameraIndex] ? "text" : "password"}
          value={camera.password}
          onChange={(e) => handleCameraConfigChange(editingCameraIndex, "password", e.target.value)}
          fullWidth
          margin="normal"
          size="small"
          InputProps={{
            endAdornment: (
              <IconButton
                onClick={() =>
                  setShowPassword((prev) => ({
                    ...prev,
                    [editingCameraIndex]: !prev[editingCameraIndex],
                  }))
                }
                size="small"
              >
                {showPassword[editingCameraIndex] ? (
                  <VisibilityOff fontSize="small" />
                ) : (
                  <Visibility fontSize="small" />
                )}
              </IconButton>
            ),
          }}
        />

        <TextField
          label="Refresh Interval (seconds)"
          type="number"
          value={camera.refreshInterval}
          onChange={(e) =>
            handleCameraConfigChange(editingCameraIndex, "refreshInterval", Number.parseInt(e.target.value))
          }
          fullWidth
          margin="normal"
          size="small"
        />

        <FormControlLabel
          control={
            <Switch
              checked={camera.motionDetection}
              onChange={(e) => handleCameraConfigChange(editingCameraIndex, "motionDetection", e.target.checked)}
            />
          }
          label="Motion Detection"
        />

        {camera.motionDetection && (
          <div style={{ marginLeft: "16px", marginBottom: "16px" }}>
            <Typography variant="body2">Motion Sensitivity: {camera.motionSensitivity}%</Typography>
            <Slider
              value={camera.motionSensitivity}
              onChange={(e, value) => handleCameraConfigChange(editingCameraIndex, "motionSensitivity", value)}
              min={0}
              max={100}
              size="small"
            />
          </div>
        )}

        <FormControlLabel
          control={
            <Switch
              checked={camera.notifications}
              onChange={(e) => handleCameraConfigChange(editingCameraIndex, "notifications", e.target.checked)}
            />
          }
          label="Enable Notifications"
        />

        <FormControlLabel
          control={
            <Switch
              checked={camera.recordingEnabled}
              onChange={(e) => handleCameraConfigChange(editingCameraIndex, "recordingEnabled", e.target.checked)}
            />
          }
          label="Enable Recording"
        />

        {camera.recordingEnabled && (
          <TextField
            label="Storage Retention (days)"
            type="number"
            value={camera.storageRetention}
            onChange={(e) =>
              handleCameraConfigChange(editingCameraIndex, "storageRetention", Number.parseInt(e.target.value))
            }
            fullWidth
            margin="normal"
            size="small"
          />
        )}

        <FormControlLabel
          control={
            <Switch
              checked={camera.ptz}
              onChange={(e) => handleCameraConfigChange(editingCameraIndex, "ptz", e.target.checked)}
            />
          }
          label="PTZ Controls"
        />

        <div className="settings-actions">
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ArrowBack />}
            onClick={() => setEditingCameraIndex(null)}
            size="small"
          >
            Back
          </Button>
          <Button variant="contained" color="primary" startIcon={<Save />} onClick={saveSettings} size="small">
            Save
          </Button>
        </div>
      </div>
    )
  }

  // Initialize all camera streams
  useEffect(() => {
    const initTimer = setTimeout(() => {
      cameras.forEach((camera, index) => {
        if (camera.streamUrl && videoRefs.current[camera.id]) {
          console.log(`Initializing stream for camera ${camera.id}`)
          initializeCameraStream(index)
        }
      })
    }, 500) // Give time for video elements to mount

    return () => {
      clearTimeout(initTimer)
      cameras.forEach((_, index) => {
        destroyCameraStream(index)
      })
    }
  }, [cameras.length])

  return (
    <Card ref={containerRef} className="camera-grid-widget">
      <CardHeader
        title={editedConfig.title}
        titleTypographyProps={{ variant: "subtitle1" }}
        action={
          <>
            <IconButton onClick={() => setIsAddCameraDialogOpen(true)} size="small">
              <Add fontSize="small" />
            </IconButton>
            <IconButton onClick={handleMenuOpen} size="small">
              <MoreVert fontSize="small" />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              <MenuItem onClick={toggleSettings}>
                <Settings fontSize="small" style={{ marginRight: 8 }} />
                Settings
              </MenuItem>
              <MenuItem onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <>
                    <FullscreenExit fontSize="small" style={{ marginRight: 8 }} />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Fullscreen fontSize="small" style={{ marginRight: 8 }} />
                    Fullscreen
                  </>
                )}
              </MenuItem>
              <MenuItem onClick={toggleLiveMode}>
                {isLive ? (
                  <>
                    <CalendarToday fontSize="small" style={{ marginRight: 8 }} />
                    View Recordings
                  </>
                ) : (
                  <>
                    <Videocam fontSize="small" style={{ marginRight: 8 }} />
                    Live View
                  </>
                )}
              </MenuItem>
              <MenuItem onClick={() => setIsSidebarVisible(!isSidebarVisible)}>
                {isSidebarVisible ? (
                  <>
                    <VisibilityOff fontSize="small" style={{ marginRight: 8 }} />
                    Hide Events
                  </>
                ) : (
                  <>
                    <Visibility fontSize="small" style={{ marginRight: 8 }} />
                    Show Events
                  </>
                )}
              </MenuItem>
              <MenuItem onClick={() => cameras.forEach((_, index) => addCameraAlert(index, "Screenshot taken"))}>
                <CameraAlt fontSize="small" style={{ marginRight: 8 }} />
                Take Screenshots
              </MenuItem>
              {gridLayout === "free-form" && (
                <MenuItem onClick={resetCameraLayout}>
                  <AspectRatio fontSize="small" style={{ marginRight: 8 }} />
                  Reset Layout
                </MenuItem>
              )}
            </Menu>
          </>
        }
      />

      <CardContent>
        {isSettingsVisible ? (
          renderCameraSettings()
        ) : (
          <div className="camera-grid-main">
            <div className="camera-grid-content">
              {/* Grid Layout Controls */}
              <div className="grid-layout-controls">
                <Typography className="layout-label">Layout:</Typography>
                {Object.keys(gridLayouts).map((layout) => (
                  <Button
                    key={layout}
                    size="small"
                    variant={gridLayout === layout ? "contained" : "outlined"}
                    onClick={() => handleGridLayoutChange(layout)}
                    className={`grid-layout-button ${gridLayout === layout ? "active" : ""}`}
                  >
                    {layout === "free-form" ? "Free" : layout}
                  </Button>
                ))}
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
                  {gridLayout === "free-form" && (
                    <>
                      <Typography variant="caption">
                        Drag: {isDraggable ? "ON" : "OFF"} | Resize: {isResizable ? "ON" : "OFF"}
                      </Typography>
                    </>
                  )}
                  <Typography variant="caption">{isLive ? "LIVE MODE" : "PLAYBACK MODE"}</Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={toggleLiveMode}
                    startIcon={isLive ? <CalendarToday /> : <Videocam />}
                  >
                    {isLive ? "Playback" : "Live"}
                  </Button>
                </div>
              </div>

              {/* Camera Grid */}
              {renderCameraGrid()}

              {/* Selected Camera Details */}
              {selectedCameraIndex !== null && renderSelectedCameraDetails()}
            </div>

            {/* Events Sidebar */}
            {isSidebarVisible && (
              <div className="camera-events-sidebar">
                <div className="camera-events-header">
                  <Typography variant="h6">Events</Typography>
                </div>
                <div className="camera-events-content">
                  <CameraEventSidebar
                    isLive={isLive}
                    currentTime={0}
                    cameras={cameras}
                    selectedCameraIndex={selectedCameraIndex}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Add Camera Dialog */}
      <Dialog
        open={isAddCameraDialogOpen}
        onClose={() => setIsAddCameraDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        className="add-camera-dialog"
      >
        <DialogTitle>Add New Camera</DialogTitle>
        <DialogContent>
          <TextField
            label="Camera Name"
            value={newCameraConfig.title}
            onChange={(e) => setNewCameraConfig((prev) => ({ ...prev, title: e.target.value }))}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Stream URL"
            value={newCameraConfig.streamUrl}
            onChange={(e) => setNewCameraConfig((prev) => ({ ...prev, streamUrl: e.target.value }))}
            fullWidth
            margin="normal"
            placeholder="https://example.com/stream.m3u8"
          />
          <TextField
            label="Username"
            value={newCameraConfig.username}
            onChange={(e) => setNewCameraConfig((prev) => ({ ...prev, username: e.target.value }))}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Password"
            type="password"
            value={newCameraConfig.password}
            onChange={(e) => setNewCameraConfig((prev) => ({ ...prev, password: e.target.value }))}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Refresh Interval (seconds)"
            type="number"
            value={newCameraConfig.refreshInterval}
            onChange={(e) =>
              setNewCameraConfig((prev) => ({ ...prev, refreshInterval: Number.parseInt(e.target.value) }))
            }
            fullWidth
            margin="normal"
          />
          <FormControlLabel
            control={
              <Switch
                checked={newCameraConfig.motionDetection}
                onChange={(e) => setNewCameraConfig((prev) => ({ ...prev, motionDetection: e.target.checked }))}
              />
            }
            label="Motion Detection"
          />
          {newCameraConfig.motionDetection && (
            <div style={{ marginLeft: "16px", marginBottom: "16px" }}>
              <Typography variant="body2">Motion Sensitivity: {newCameraConfig.motionSensitivity}%</Typography>
              <Slider
                value={newCameraConfig.motionSensitivity}
                onChange={(e, value) => setNewCameraConfig((prev) => ({ ...prev, motionSensitivity: value }))}
                min={0}
                max={100}
                size="small"
              />
            </div>
          )}
          <FormControlLabel
            control={
              <Switch
                checked={newCameraConfig.notifications}
                onChange={(e) => setNewCameraConfig((prev) => ({ ...prev, notifications: e.target.checked }))}
              />
            }
            label="Enable Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={newCameraConfig.recordingEnabled}
                onChange={(e) => setNewCameraConfig((prev) => ({ ...prev, recordingEnabled: e.target.checked }))}
              />
            }
            label="Enable Recording"
          />
          {newCameraConfig.recordingEnabled && (
            <TextField
              label="Storage Retention (days)"
              type="number"
              value={newCameraConfig.storageRetention}
              onChange={(e) =>
                setNewCameraConfig((prev) => ({ ...prev, storageRetention: Number.parseInt(e.target.value) }))
              }
              fullWidth
              margin="normal"
            />
          )}
          <FormControlLabel
            control={
              <Switch
                checked={newCameraConfig.ptz}
                onChange={(e) => setNewCameraConfig((prev) => ({ ...prev, ptz: e.target.checked }))}
              />
            }
            label="PTZ Controls"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddCameraDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddCamera}
            variant="contained"
            disabled={!newCameraConfig.title || !newCameraConfig.streamUrl}
          >
            Add Camera
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default CameraGridWidget


// // CameraGridWidget.jsx
// "use client"

// import React from "react"
// import { useCameraGridWidget } from "../../../hooks/cameraStream" // Corrected import path
// import CameraGridWidgetUI from "./ui/CameraGridWidgetUI" // Adjust path as needed

// const CameraGridWidget = ({ config, onConfigChange }) => {
//   const widgetProps = useCameraGridWidget(config, onConfigChange)

//   return <CameraGridWidgetUI {...widgetProps} />
// }

// export default CameraGridWidget

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
//   CircularProgress,
//   Tabs,
//   Tab,
//   Button,
//   TextField,
//   Switch,
//   FormControlLabel,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Select,
//   FormControl,
//   InputLabel,
//   Chip,
//   Slider,
//   Divider,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemSecondaryAction,
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
//   MotionPhotosAuto,
//   Visibility,
//   VisibilityOff,
//   ArrowUpward,
//   ArrowDownward,
//   ArrowBack,
//   ArrowForward,
//   Home,
//   Add,
//   Refresh,
//   Delete,
//   CalendarToday,
//   ZoomIn,
//   ZoomOut,
//   CameraAlt,
//   DragIndicator,
//   AspectRatio,
// } from "@mui/icons-material"
// import { Rnd } from "react-rnd"
// import Hls from "hls.js"
// import "../../../styles/camera-grid-widget.css"
// import CameraEventSidebar from "./CameraEventSidebar"


// const CameraGridWidget = ({ config, onConfigChange }) => {
//   const [anchorEl, setAnchorEl] = useState(null)
//   const [activeTab, setActiveTab] = useState(0)
//   const [isFullscreen, setIsFullscreen] = useState(false)
//   const [isSettingsVisible, setIsSettingsVisible] = useState(false)
//   const [selectedCameraIndex, setSelectedCameraIndex] = useState(null)
//   const [gridLayout, setGridLayout] = useState("2x2")
//   const [isSidebarVisible, setIsSidebarVisible] = useState(false)
//   const [isAddCameraDialogOpen, setIsAddCameraDialogOpen] = useState(false)
//   const [editingCameraIndex, setEditingCameraIndex] = useState(null)
//   const [showPassword, setShowPassword] = useState({})
//   const [isLive, setIsLive] = useState(true)
//   const [selectedDate, setSelectedDate] = useState(new Date())
//   const [timeRange, setTimeRange] = useState([0, 24])
//   const [currentTime, setCurrentTime] = useState(new Date())
//   const [isResizable, setIsResizable] = useState(false)
//   const [isDraggable, setIsDraggable] = useState(false)
//   const [cameraPositions, setCameraPositions] = useState({})
//   const [cameraSizes, setCameraSizes] = useState({})

//   const [newCameraConfig, setNewCameraConfig] = useState({
//     title: "",
//     streamUrl: "",
//     username: "",
//     password: "",
//     refreshInterval: 30,
//     motionDetection: false,
//     motionSensitivity: 50,
//     notifications: true,
//     recordingEnabled: false,
//     storageRetention: 7,
//     ptz: false,
//   })

//   const containerRef = useRef(null)

//   // Default configuration
//   const defaultConfig = {
//     title: "Camera Grid",
//     cameras: [
//       {
//         id: "cam1",
//         title: "Front Door Camera",
//         streamUrl: "http://192.168.1.11:8086/onvif_cam_192_168_1_2/index.m3u8",
//         username: "",
//         password: "",
//         refreshInterval: 30,
//         motionDetection: true,
//         motionSensitivity: 50,
//         notifications: true,
//         recordingEnabled: false,
//         storageRetention: 7,
//         ptz: false,
//         isPlaying: true,
//         isConnected: false,
//         isLoading: true,
//         alerts: [],
//         motionDetected: false,
//       },
//       {
//         id: "cam2",
//         title: "Parking Lot Camera",
//         streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
//         username: "",
//         password: "",
//         refreshInterval: 30,
//         motionDetection: true,
//         motionSensitivity: 70,
//         notifications: true,
//         recordingEnabled: false,
//         storageRetention: 7,
//         ptz: true,
//         isPlaying: true,
//         isConnected: false,
//         isLoading: true,
//         alerts: [],
//         motionDetected: false,
//       },
//       {
//         id: "cam3",
//         title: "Back Yard Camera",
//         streamUrl:
//           "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
//         username: "",
//         password: "",
//         refreshInterval: 30,
//         motionDetection: false,
//         motionSensitivity: 60,
//         notifications: true,
//         recordingEnabled: true,
//         storageRetention: 14,
//         ptz: false,
//         isPlaying: true,
//         isConnected: false,
//         isLoading: true,
//         alerts: [],
//         motionDetected: false,
//       },
//       {
//         id: "cam4",
//         title: "Side Entrance Camera",
//         streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
//         username: "",
//         password: "",
//         refreshInterval: 30,
//         motionDetection: true,
//         motionSensitivity: 55,
//         notifications: true,
//         recordingEnabled: false,
//         storageRetention: 7,
//         ptz: false,
//         isPlaying: true,
//         isConnected: false,
//         isLoading: true,
//         alerts: [],
//         motionDetected: false,
//       },
//     ],
//     gridLayout: "free-form",
//     showCameraLabels: true,
//     autoRotate: false,
//     rotationInterval: 10,
//     resizable: true,
//     draggable: true,
//   }

//   const mergedConfig = { ...defaultConfig, ...config }
//   const [cameras, setCameras] = useState(mergedConfig.cameras)
//   const [editedConfig, setEditedConfig] = useState(mergedConfig)

//   // Grid layout options
//   const gridLayouts = {
//     "free-form": { cols: 0, rows: 0, maxCameras: 16, description: "Free-form (Resizable & Draggable)" },
//     "1x1": { cols: 1, rows: 1, maxCameras: 1, description: "Single Camera" },
//     "2x2": { cols: 2, rows: 2, maxCameras: 4, description: "2x2 Grid" },
//     "3x3": { cols: 3, rows: 3, maxCameras: 9, description: "3x3 Grid" },
//     "4x4": { cols: 4, rows: 4, maxCameras: 16, description: "4x4 Grid" },
//     "2x3": { cols: 2, rows: 3, maxCameras: 6, description: "2x3 Grid" },
//     "3x2": { cols: 3, rows: 2, maxCameras: 6, description: "3x2 Grid" },
//   }

//   useEffect(() => {
//     setEditedConfig(mergedConfig)
//     setCameras(mergedConfig.cameras)
//     setGridLayout(mergedConfig.gridLayout || "free-form")
//     setIsResizable(mergedConfig.resizable !== false)
//     setIsDraggable(mergedConfig.draggable !== false)

//     // Initialize default positions and sizes for cameras
//     const defaultPositions = {}
//     const defaultSizes = {}

//     mergedConfig.cameras.forEach((camera, index) => {
//       const row = Math.floor(index / 2)
//       const col = index % 2
//       defaultPositions[camera.id] = {
//         x: col * 320 + 10,
//         y: row * 240 + 10,
//       }
//       defaultSizes[camera.id] = {
//         width: 300,
//         height: 225,
//       }
//     })

//     setCameraPositions(defaultPositions)
//     setCameraSizes(defaultSizes)
//   }, [config])

//   // Update current time every second
//   useEffect(() => {
//     const timeInterval = setInterval(() => {
//       setCurrentTime(new Date())
//     }, 1000)

//     return () => clearInterval(timeInterval)
//   }, [])

//   // Initialize all camera streams
//   useEffect(() => {
//     cameras.forEach((camera, index) => {
//       if (camera.streamUrl) {
//         initializeCameraStream(index)
//       }
//     })

//     return () => {
//       cameras.forEach((_, index) => {
//         destroyCameraStream(index)
//       })
//     }
//   }, [cameras.length])

//   // Motion detection simulation
//   useEffect(() => {
//     const intervals = cameras.map((camera, index) => {
//       if (camera.motionDetection) {
//         return setInterval(() => {
//           const detected = Math.random() > 0.85
//           if (detected) {
//             updateCameraState(index, { motionDetected: true })
//             if (camera.notifications) {
//               addCameraAlert(index, "Motion detected")
//             }
//             setTimeout(() => {
//               updateCameraState(index, { motionDetected: false })
//             }, 3000)
//           }
//         }, 15000)
//       }
//       return null
//     })

//     return () => {
//       intervals.forEach((interval) => {
//         if (interval) clearInterval(interval)
//       })
//     }
//   }, [cameras])

//   // const initializeCameraStream = (cameraIndex) => {
//   //   const camera = cameras[cameraIndex]
//   //   if (!camera || !camera.streamUrl) return

//   //   updateCameraState(cameraIndex, { isLoading: true, isConnected: false })

//   //   setTimeout(
//   //     () => {
//   //       const success = Math.random() > 0.15 // 85% success rate
//   //       updateCameraState(cameraIndex, {
//   //         isLoading: false,
//   //         isConnected: success,
//   //       })

//   //       if (!success) {
//   //         addCameraAlert(cameraIndex, "Failed to connect to camera stream")
//   //       }
//   //     },
//   //     1000 + Math.random() * 2000,
//   //   )
//   // }
//   const initializeCameraStream = (cameraIndex) => {
//     const camera = cameras[cameraIndex]
//     if (!camera || !camera.streamUrl) return

//     updateCameraState(cameraIndex, { isLoading: true, isConnected: false })

//     setTimeout(() => {
//       const video = document.getElementById(`video-${camera.id}`)
//       if (!video) return

//       if (Hls.isSupported()) {
//         const hls = new Hls()
//         hls.loadSource(camera.streamUrl)
//         hls.attachMedia(video)
//         hls.on(Hls.Events.MANIFEST_PARSED, () => {
//           video.play()
//         })
//       } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
//         video.src = camera.streamUrl
//         video.addEventListener("loadedmetadata", () => {
//           video.play()
//         })
//       } else {
//         addCameraAlert(cameraIndex, "HLS not supported in this browser")
//       }

//       updateCameraState(cameraIndex, {
//         isLoading: false,
//         isConnected: true,
//       })
//     }, 1000 + Math.random() * 2000)
//   }
//   const destroyCameraStream = (cameraIndex) => {
//     updateCameraState(cameraIndex, { isConnected: false })
//   }

//   const updateCameraState = (cameraIndex, updates) => {
//   console.log("Updating camera", cameraIndex, updates)
//   setCameras((prev) =>
//     prev.map((camera, index) => (index === cameraIndex ? { ...camera, ...updates } : camera))
//     )
//   }

//   const addCameraAlert = (cameraIndex, message) => {
//     const newAlert = {
//       id: Date.now(),
//       message,
//       timestamp: new Date(),
//     }

//     updateCameraState(cameraIndex, {
//       alerts: [...(cameras[cameraIndex]?.alerts || []), newAlert].slice(0, 50),
//     })
//   }

//   const deleteAlert = (cameraIndex, alertId) => {
//     const camera = cameras[cameraIndex]
//     if (camera) {
//       const updatedAlerts = camera.alerts.filter((alert) => alert.id !== alertId)
//       updateCameraState(cameraIndex, { alerts: updatedAlerts })
//     }
//   }

//   const clearAllAlerts = (cameraIndex) => {
//     updateCameraState(cameraIndex, { alerts: [] })
//   }

//   const toggleCameraPlayPause = (cameraIndex) => {
//     const camera = cameras[cameraIndex]
//     updateCameraState(cameraIndex, { isPlaying: !camera.isPlaying })
//   }

//   const handleCameraClick = (cameraIndex) => {
//     setSelectedCameraIndex(selectedCameraIndex === cameraIndex ? null : cameraIndex)
//   }

//   const handleMenuOpen = (event) => {
//     setAnchorEl(event.currentTarget)
//   }

//   const handleMenuClose = () => {
//     setAnchorEl(null)
//   }

//   const toggleSettings = () => {
//     setIsSettingsVisible(!isSettingsVisible)
//     handleMenuClose()
//   }

//   const toggleFullscreen = () => {
//     if (!document.fullscreenElement) {
//       containerRef.current?.requestFullscreen().catch((err) => {
//         console.error("Error attempting to enable fullscreen:", err)
//       })
//       setIsFullscreen(true)
//     } else {
//       document.exitFullscreen()
//       setIsFullscreen(false)
//     }
//   }

//   const handleGridLayoutChange = (newLayout) => {
//     setGridLayout(newLayout)
//     setEditedConfig((prev) => ({ ...prev, gridLayout: newLayout }))

//     // Reset positions and sizes when switching to/from free-form
//     if (newLayout === "free-form" || gridLayout === "free-form") {
//       const newPositions = {}
//       const newSizes = {}

//       cameras.forEach((camera, index) => {
//         if (newLayout === "free-form") {
//           // Set default free-form positions
//           const row = Math.floor(index / 2)
//           const col = index % 2
//           newPositions[camera.id] = {
//             x: col * 320 + 10,
//             y: row * 240 + 10,
//           }
//           newSizes[camera.id] = {
//             width: 300,
//             height: 225,
//           }
//         }
//       })

//       if (newLayout === "free-form") {
//         setCameraPositions(newPositions)
//         setCameraSizes(newSizes)
//       }
//     }
//   }

//   const handleCameraResize = (cameraId, size) => {
//     setCameraSizes((prev) => ({
//       ...prev,
//       [cameraId]: size,
//     }))
//   }

//   const handleCameraDrag = (cameraId, position) => {
//     setCameraPositions((prev) => ({
//       ...prev,
//       [cameraId]: position,
//     }))
//   }

//   const handleAddCamera = () => {
//     const newCamera = {
//       id: `cam${Date.now()}`,
//       ...newCameraConfig,
//       isPlaying: true,
//       isConnected: false,
//       isLoading: false,
//       alerts: [],
//       motionDetected: false,
//     }

//     const updatedCameras = [...cameras, newCamera]
//     setCameras(updatedCameras)
//     setEditedConfig((prev) => ({ ...prev, cameras: updatedCameras }))

//     // Set default position and size for new camera
//     const newIndex = cameras.length
//     const row = Math.floor(newIndex / 2)
//     const col = newIndex % 2

//     setCameraPositions((prev) => ({
//       ...prev,
//       [newCamera.id]: {
//         x: col * 320 + 10,
//         y: row * 240 + 10,
//       },
//     }))

//     setCameraSizes((prev) => ({
//       ...prev,
//       [newCamera.id]: {
//         width: 300,
//         height: 225,
//       },
//     }))

//     setIsAddCameraDialogOpen(false)
//     setNewCameraConfig({
//       title: "",
//       streamUrl: "",
//       username: "",
//       password: "",
//       refreshInterval: 30,
//       motionDetection: false,
//       motionSensitivity: 50,
//       notifications: true,
//       recordingEnabled: false,
//       storageRetention: 7,
//       ptz: false,
//     })
//   }

//   const handleRemoveCamera = (cameraIndex) => {
//     const cameraToRemove = cameras[cameraIndex]
//     const updatedCameras = cameras.filter((_, index) => index !== cameraIndex)
//     setCameras(updatedCameras)
//     setEditedConfig((prev) => ({ ...prev, cameras: updatedCameras }))

//     // Remove position and size data
//     setCameraPositions((prev) => {
//       const newPositions = { ...prev }
//       delete newPositions[cameraToRemove.id]
//       return newPositions
//     })

//     setCameraSizes((prev) => {
//       const newSizes = { ...prev }
//       delete newSizes[cameraToRemove.id]
//       return newSizes
//     })

//     if (selectedCameraIndex === cameraIndex) {
//       setSelectedCameraIndex(null)
//     }
//     if (editingCameraIndex === cameraIndex) {
//       setEditingCameraIndex(null)
//     }
//   }

//   const handleCameraConfigChange = (cameraIndex, field, value) => {
//     const updatedCameras = cameras.map((camera, index) =>
//       index === cameraIndex ? { ...camera, [field]: value } : camera,
//     )
//     setCameras(updatedCameras)
//     setEditedConfig((prev) => ({ ...prev, cameras: updatedCameras }))
//   }

//   const saveSettings = () => {
//     const configToSave = {
//       ...editedConfig,
//       cameraPositions,
//       cameraSizes,
//       resizable: isResizable,
//       draggable: isDraggable,
//     }
//     onConfigChange?.(configToSave)
//     setIsSettingsVisible(false)
//     setEditingCameraIndex(null)
//   }

//   const cancelSettings = () => {
//     setEditedConfig(mergedConfig)
//     setCameras(mergedConfig.cameras)
//     setGridLayout(mergedConfig.gridLayout || "free-form")
//     setIsResizable(mergedConfig.resizable !== false)
//     setIsDraggable(mergedConfig.draggable !== false)
//     setIsSettingsVisible(false)
//     setEditingCameraIndex(null)
//   }

//   const handlePtzControl = (cameraIndex, direction) => {
//     const camera = cameras[cameraIndex]
//     if (camera?.ptz) {
//       addCameraAlert(cameraIndex, `PTZ Command: ${direction}`)
//     }
//   }

//   const toggleLiveMode = () => {
//     setIsLive(!isLive)
//     if (!isLive) {
//       // Reinitialize streams when switching back to live
//       cameras.forEach((_, index) => {
//         destroyCameraStream(index)
//         initializeCameraStream(index)
//       })
//     }
//   }

//   const loadRecordingForDate = (cameraIndex, date, timeRange) => {
//     updateCameraState(cameraIndex, { isLoading: true, isConnected: false })
//     setTimeout(() => {
//       updateCameraState(cameraIndex, {
//         isLoading: false,
//         isConnected: true,
//       })
//       addCameraAlert(
//         cameraIndex,
//         `Loaded recording for ${date.toLocaleDateString()} from ${timeRange[0]}:00 to ${timeRange[1]}:00`,
//       )
//     }, 1000 + Math.random() * 2000)
//   }

//   const formatTimeRange = (range) => {
//     return `${range[0]}:00 - ${range[1]}:00`
//   }

//   const resetCameraLayout = () => {
//     const defaultPositions = {}
//     const defaultSizes = {}

//     cameras.forEach((camera, index) => {
//       const row = Math.floor(index / 2)
//       const col = index % 2
//       defaultPositions[camera.id] = {
//         x: col * 320 + 10,
//         y: row * 240 + 10,
//       }
//       defaultSizes[camera.id] = {
//         width: 300,
//         height: 225,
//       }
//     })

//     setCameraPositions(defaultPositions)
//     setCameraSizes(defaultSizes)
//   }

//   const renderCameraGrid = () => {
//     const layout = gridLayouts[gridLayout]
//     const visibleCameras = cameras.slice(0, layout.maxCameras)

//     if (gridLayout === "free-form") {
//       return (
//         <div className="camera-free-form-container">
//           {visibleCameras.map((camera, index) => {
//             const isSelected = selectedCameraIndex === index
//             const position = cameraPositions[camera.id] || { x: 10, y: 10 }
//             const size = cameraSizes[camera.id] || { width: 300, height: 225 }

//             return (
//               <Rnd
//                 key={camera.id}
//                 size={size}
//                 position={position}
//                 onDragStop={(e, d) => handleCameraDrag(camera.id, { x: d.x, y: d.y })}
//                 onResizeStop={(e, direction, ref, delta, position) => {
//                   handleCameraResize(camera.id, {
//                     width: ref.offsetWidth,
//                     height: ref.offsetHeight,
//                   })
//                   handleCameraDrag(camera.id, position)
//                 }}
//                 minWidth={200}
//                 minHeight={150}
//                 maxWidth={800}
//                 maxHeight={600}
//                 disableDragging={!isDraggable}
//                 enableResizing={
//                   isResizable
//                     ? {
//                         top: true,
//                         right: true,
//                         bottom: true,
//                         left: true,
//                         topRight: true,
//                         bottomRight: true,
//                         bottomLeft: true,
//                         topLeft: true,
//                       }
//                     : false
//                 }
//                 className={`camera-rnd-item ${isSelected ? "selected" : ""}`}
//                 dragHandleClassName="camera-drag-handle"
//               >
//                 <div
//                   className={`camera-grid-item ${isSelected ? "selected" : ""}`}
//                   onClick={() => handleCameraClick(index)}
//                 >
//                   {/* Drag Handle */}
//                   {isDraggable && (
//                     <div className="camera-drag-handle">
//                       <DragIndicator fontSize="small" />
//                     </div>
//                   )}

//                   {/* Resize Handle */}
//                   {isResizable && (
//                     <div className="camera-resize-handle">
//                       <AspectRatio fontSize="small" />
//                     </div>
//                   )}

//                   <div className="camera-video-container">
//                     {camera.isLoading && (
//                       <div className="camera-loading-overlay">
//                         <CircularProgress size={24} />
//                         <Typography variant="caption" style={{ color: "white" }}>
//                           {isLive ? "Connecting..." : "Loading Recording..."}
//                         </Typography>
//                       </div>
//                     )}

//                     {!camera.isConnected && !camera.isLoading && (
//                       <div className="camera-error-overlay">
//                         <Typography variant="caption">Connection Failed</Typography>
//                         <Button
//                           size="small"
//                           variant="outlined"
//                           startIcon={<Refresh />}
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             initializeCameraStream(index)
//                           }}
//                           style={{ marginTop: 8 }}
//                         >
//                           Retry
//                         </Button>
//                       </div>
//                     )}

//                     {/* {camera.isConnected && (
//                       <div className="camera-video-placeholder">
//                         <Typography variant="body2">{isLive ? "Live Stream Active" : "Recording Playback"}</Typography>
//                         <Typography variant="caption">{camera.streamUrl.split("/").pop()}</Typography>
//                       </div>
//                     )} */}
//                     {camera.isConnected && (
//                       <div className="camera-video-placeholder">
//                         <video
//                           id={`video-${camera.id}`}
//                           className="camera-video-element"
//                           autoPlay
//                           muted
//                           controls
//                           playsInline
//                           style={{ width: "100%", height: "100%" }}
//                         />
//                       </div>
//                     )}

//                   </div>

//                   {/* Camera Label */}
//                   {editedConfig.showCameraLabels && (
//                     <div className="camera-label">
//                       <Typography className="camera-label-text">{camera.title}</Typography>
//                       <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
//                         {camera.motionDetected && (
//                           <Chip
//                             icon={<MotionPhotosAuto />}
//                             label="Motion"
//                             size="small"
//                             color="error"
//                             className="camera-motion-chip"
//                           />
//                         )}
//                         {camera.recordingEnabled && (
//                           <Chip label="REC" size="small" color="error" className="camera-motion-chip" />
//                         )}
//                       </div>
//                     </div>
//                   )}

//                   {/* Live/Recording Indicator */}
//                   {camera.isConnected && (
//                     <div className="camera-live-indicator">
//                       <div className="camera-live-dot"></div>
//                       {isLive ? "LIVE" : "PLAYBACK"}
//                     </div>
//                   )}

//                   {/* Play/Pause Control */}
//                   <div className="camera-play-control">
//                     <IconButton
//                       size="small"
//                       className="camera-control-button"
//                       onClick={(e) => {
//                         e.stopPropagation()
//                         toggleCameraPlayPause(index)
//                       }}
//                     >
//                       {camera.isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
//                     </IconButton>
//                   </div>

//                   {/* PTZ Controls */}
//                   {isSelected && camera.ptz && (
//                     <div className="camera-ptz-controls">
//                       <div className="ptz-row">
//                         <IconButton
//                           size="small"
//                           className="ptz-control-button"
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             handlePtzControl(index, "up")
//                           }}
//                         >
//                           <ArrowUpward fontSize="small" />
//                         </IconButton>
//                       </div>
//                       <div className="ptz-row">
//                         <IconButton
//                           size="small"
//                           className="ptz-control-button"
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             handlePtzControl(index, "left")
//                           }}
//                         >
//                           <ArrowBack fontSize="small" />
//                         </IconButton>
//                         <IconButton
//                           size="small"
//                           className="ptz-control-button"
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             handlePtzControl(index, "home")
//                           }}
//                         >
//                           <Home fontSize="small" />
//                         </IconButton>
//                         <IconButton
//                           size="small"
//                           className="ptz-control-button"
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             handlePtzControl(index, "right")
//                           }}
//                         >
//                           <ArrowForward fontSize="small" />
//                         </IconButton>
//                       </div>
//                       <div className="ptz-row">
//                         <IconButton
//                           size="small"
//                           className="ptz-control-button"
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             handlePtzControl(index, "down")
//                           }}
//                         >
//                           <ArrowDownward fontSize="small" />
//                         </IconButton>
//                       </div>
//                       <div className="ptz-row">
//                         <IconButton
//                           size="small"
//                           className="ptz-control-button"
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             handlePtzControl(index, "zoom_in")
//                           }}
//                         >
//                           <ZoomIn fontSize="small" />
//                         </IconButton>
//                         <IconButton
//                           size="small"
//                           className="ptz-control-button"
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             handlePtzControl(index, "zoom_out")
//                           }}
//                         >
//                           <ZoomOut fontSize="small" />
//                         </IconButton>
//                       </div>
//                     </div>
//                   )}

//                   {/* Camera Info */}
//                   <div className="camera-info">
//                     <Typography variant="caption" className="timestamp">
//                       {currentTime.toLocaleTimeString()}
//                     </Typography>
//                   </div>
//                 </div>
//               </Rnd>
//             )
//           })}
//         </div>
//       )
//     }

//     // Regular grid layout
//     return (
//       <div className={`camera-grid-container layout-${gridLayout}`}>
//         {Array.from({ length: layout.maxCameras }).map((_, index) => {
//           const camera = visibleCameras[index]
//           const isSelected = selectedCameraIndex === index
//           const isEmpty = !camera

//           return (
//             <div
//               key={index}
//               className={`camera-grid-item ${isSelected ? "selected" : ""} ${isEmpty ? "empty" : ""}`}
//               onClick={() => !isEmpty && handleCameraClick(index)}
//             >
//               {isEmpty ? (
//                 <div className="camera-empty-slot">
//                   <Videocam className="camera-empty-icon" />
//                   <Typography className="camera-empty-text">Empty Slot</Typography>
//                 </div>
//               ) : (
//                 <>
//                   <div className="camera-video-container">
//                     {camera.isLoading && (
//                       <div className="camera-loading-overlay">
//                         <CircularProgress size={24} />
//                         <Typography variant="caption" style={{ color: "white" }}>
//                           {isLive ? "Connecting..." : "Loading Recording..."}
//                         </Typography>
//                       </div>
//                     )}

//                     {!camera.isConnected && !camera.isLoading && (
//                       <div className="camera-error-overlay">
//                         <Typography variant="caption">Connection Failed</Typography>
//                         <Button
//                           size="small"
//                           variant="outlined"
//                           startIcon={<Refresh />}
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             initializeCameraStream(index)
//                           }}
//                           style={{ marginTop: 8 }}
//                         >
//                           Retry
//                         </Button>
//                       </div>
//                     )}

//                     {camera.isConnected && (
//                       <div className="camera-video-placeholder">
//                         <Typography variant="body2">{isLive ? "Live Stream Active" : "Recording Playback"}</Typography>
//                         <Typography variant="caption">{camera.streamUrl.split("/").pop()}</Typography>
//                       </div>
//                     )}
//                   </div>

//                   {/* Camera Label */}
//                   {editedConfig.showCameraLabels && (
//                     <div className="camera-label">
//                       <Typography className="camera-label-text">{camera.title}</Typography>
//                       <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
//                         {camera.motionDetected && (
//                           <Chip
//                             icon={<MotionPhotosAuto />}
//                             label="Motion"
//                             size="small"
//                             color="error"
//                             className="camera-motion-chip"
//                           />
//                         )}
//                         {camera.recordingEnabled && (
//                           <Chip label="REC" size="small" color="error" className="camera-motion-chip" />
//                         )}
//                       </div>
//                     </div>
//                   )}

//                   {/* Live/Recording Indicator */}
//                   {camera.isConnected && (
//                     <div className="camera-live-indicator">
//                       <div className="camera-live-dot"></div>
//                       {isLive ? "LIVE" : "PLAYBACK"}
//                     </div>
//                   )}

//                   {/* Play/Pause Control */}
//                   <div className="camera-play-control">
//                     <IconButton
//                       size="small"
//                       className="camera-control-button"
//                       onClick={(e) => {
//                         e.stopPropagation()
//                         toggleCameraPlayPause(index)
//                       }}
//                     >
//                       {camera.isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
//                     </IconButton>
//                   </div>

//                   {/* PTZ Controls */}
//                   {isSelected && camera.ptz && (
//                     <div className="camera-ptz-controls">
//                       <div className="ptz-row">
//                         <IconButton
//                           size="small"
//                           className="ptz-control-button"
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             handlePtzControl(index, "up")
//                           }}
//                         >
//                           <ArrowUpward fontSize="small" />
//                         </IconButton>
//                       </div>
//                       <div className="ptz-row">
//                         <IconButton
//                           size="small"
//                           className="ptz-control-button"
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             handlePtzControl(index, "left")
//                           }}
//                         >
//                           <ArrowBack fontSize="small" />
//                         </IconButton>
//                         <IconButton
//                           size="small"
//                           className="ptz-control-button"
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             handlePtzControl(index, "home")
//                           }}
//                         >
//                           <Home fontSize="small" />
//                         </IconButton>
//                         <IconButton
//                           size="small"
//                           className="ptz-control-button"
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             handlePtzControl(index, "right")
//                           }}
//                         >
//                           <ArrowForward fontSize="small" />
//                         </IconButton>
//                       </div>
//                       <div className="ptz-row">
//                         <IconButton
//                           size="small"
//                           className="ptz-control-button"
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             handlePtzControl(index, "down")
//                           }}
//                         >
//                           <ArrowDownward fontSize="small" />
//                         </IconButton>
//                       </div>
//                       <div className="ptz-row">
//                         <IconButton
//                           size="small"
//                           className="ptz-control-button"
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             handlePtzControl(index, "zoom_in")
//                           }}
//                         >
//                           <ZoomIn fontSize="small" />
//                         </IconButton>
//                         <IconButton
//                           size="small"
//                           className="ptz-control-button"
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             handlePtzControl(index, "zoom_out")
//                           }}
//                         >
//                           <ZoomOut fontSize="small" />
//                         </IconButton>
//                       </div>
//                     </div>
//                   )}

//                   {/* Camera Info */}
//                   <div className="camera-info">
//                     <Typography variant="caption" className="timestamp">
//                       {currentTime.toLocaleTimeString()}
//                     </Typography>
//                   </div>
//                 </>
//               )}
//             </div>
//           )
//         })}
//       </div>
//     )
//   }

//   const renderSelectedCameraDetails = () => {
//     if (selectedCameraIndex === null || !cameras[selectedCameraIndex]) return null

//     const camera = cameras[selectedCameraIndex]

//     return (
//       <div className="selected-camera-details">
//         <Typography variant="h6" gutterBottom>
//           {camera.title} - Details
//         </Typography>

//         <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="fullWidth">
//           <Tab label={isLive ? "Live" : "Playback"} />
//           <Tab label="Alerts" />
//           <Tab label="Settings" />
//         </Tabs>

//         <div className="selected-camera-tab-content">
//           {activeTab === 0 && (
//             <div>
//               {isLive ? (
//                 <div>
//                   <div className="camera-status-item">
//                     <Typography variant="body2">Status:</Typography>
//                     <Typography variant="body2" color={camera.isConnected ? "success.main" : "error.main"}>
//                       {camera.isConnected ? "Connected" : "Disconnected"}
//                     </Typography>
//                   </div>
//                   <div className="camera-status-item">
//                     <Typography variant="body2">Motion Detection:</Typography>
//                     <Typography variant="body2">{camera.motionDetection ? "Enabled" : "Disabled"}</Typography>
//                   </div>
//                   <div className="camera-status-item">
//                     <Typography variant="body2">PTZ Controls:</Typography>
//                     <Typography variant="body2">{camera.ptz ? "Available" : "Not Available"}</Typography>
//                   </div>
//                   <div className="camera-status-item">
//                     <Typography variant="body2">Recording:</Typography>
//                     <Typography variant="body2">{camera.recordingEnabled ? "Enabled" : "Disabled"}</Typography>
//                   </div>
//                   {gridLayout === "free-form" && (
//                     <div className="camera-status-item">
//                       <Typography variant="body2">Size:</Typography>
//                       <Typography variant="body2">
//                         {Math.round(cameraSizes[camera.id]?.width || 300)} x{" "}
//                         {Math.round(cameraSizes[camera.id]?.height || 225)}
//                       </Typography>
//                     </div>
//                   )}
//                   <Button
//                     variant="outlined"
//                     color="primary"
//                     onClick={toggleLiveMode}
//                     fullWidth
//                     style={{ marginTop: "16px" }}
//                     startIcon={<CalendarToday />}
//                   >
//                     Switch to Playback
//                   </Button>
//                 </div>
//               ) : (
//                 <div>
//                   <div className="date-selector">
//                     <Typography variant="body2">Select Date:</Typography>
//                     <input
//                       type="date"
//                       value={selectedDate.toISOString().split("T")[0]}
//                       onChange={(e) => setSelectedDate(new Date(e.target.value))}
//                       className="date-input"
//                     />
//                   </div>
//                   <div className="time-selector">
//                     <Typography variant="body2">Time Range: {formatTimeRange(timeRange)}</Typography>
//                     <Slider
//                       value={timeRange}
//                       onChange={(e, newValue) => setTimeRange(newValue)}
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
//                     onClick={() => loadRecordingForDate(selectedCameraIndex, selectedDate, timeRange)}
//                     fullWidth
//                     size="small"
//                     style={{ marginBottom: "8px" }}
//                   >
//                     Load Recording
//                   </Button>
//                   <Button
//                     variant="outlined"
//                     color="primary"
//                     onClick={toggleLiveMode}
//                     fullWidth
//                     size="small"
//                     startIcon={<Videocam />}
//                   >
//                     Switch to Live
//                   </Button>
//                 </div>
//               )}
//             </div>
//           )}

//           {activeTab === 1 && (
//             <div>
//               <div
//                 style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}
//               >
//                 <Typography variant="subtitle2">Recent Alerts ({camera.alerts?.length || 0})</Typography>
//                 <Button
//                   variant="outlined"
//                   size="small"
//                   onClick={() => clearAllAlerts(selectedCameraIndex)}
//                   disabled={!camera.alerts?.length}
//                 >
//                   Clear All
//                 </Button>
//               </div>
//               {camera.alerts?.length > 0 ? (
//                 <div style={{ maxHeight: "200px", overflowY: "auto" }}>
//                   {camera.alerts.map((alert) => (
//                     <div key={alert.id} className="camera-alert-item">
//                       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                         <div>
//                           <Typography className="camera-alert-message">{alert.message}</Typography>
//                           <Typography className="camera-alert-time">{alert.timestamp.toLocaleTimeString()}</Typography>
//                         </div>
//                         <IconButton size="small" onClick={() => deleteAlert(selectedCameraIndex, alert.id)}>
//                           <Delete fontSize="small" />
//                         </IconButton>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <Typography variant="body2" color="textSecondary">
//                   No recent alerts
//                 </Typography>
//               )}
//             </div>
//           )}

//           {activeTab === 2 && (
//             <div>
//               <TextField
//                 label="Camera Name"
//                 value={camera.title}
//                 onChange={(e) => handleCameraConfigChange(selectedCameraIndex, "title", e.target.value)}
//                 fullWidth
//                 margin="normal"
//                 size="small"
//               />
//               <TextField
//                 label="Stream URL"
//                 value={camera.streamUrl}
//                 onChange={(e) => handleCameraConfigChange(selectedCameraIndex, "streamUrl", e.target.value)}
//                 fullWidth
//                 margin="normal"
//                 size="small"
//               />
//               <TextField
//                 label="Username"
//                 value={camera.username}
//                 onChange={(e) => handleCameraConfigChange(selectedCameraIndex, "username", e.target.value)}
//                 fullWidth
//                 margin="normal"
//                 size="small"
//               />
//               <TextField
//                 label="Password"
//                 type={showPassword[selectedCameraIndex] ? "text" : "password"}
//                 value={camera.password}
//                 onChange={(e) => handleCameraConfigChange(selectedCameraIndex, "password", e.target.value)}
//                 fullWidth
//                 margin="normal"
//                 size="small"
//                 InputProps={{
//                   endAdornment: (
//                     <IconButton
//                       onClick={() =>
//                         setShowPassword((prev) => ({
//                           ...prev,
//                           [selectedCameraIndex]: !prev[selectedCameraIndex],
//                         }))
//                       }
//                       size="small"
//                     >
//                       {showPassword[selectedCameraIndex] ? (
//                         <VisibilityOff fontSize="small" />
//                       ) : (
//                         <Visibility fontSize="small" />
//                       )}
//                     </IconButton>
//                   ),
//                 }}
//               />
//               <TextField
//                 label="Refresh Interval (seconds)"
//                 type="number"
//                 value={camera.refreshInterval}
//                 onChange={(e) =>
//                   handleCameraConfigChange(selectedCameraIndex, "refreshInterval", Number.parseInt(e.target.value))
//                 }
//                 fullWidth
//                 margin="normal"
//                 size="small"
//               />
//               <FormControlLabel
//                 control={
//                   <Switch
//                     checked={camera.motionDetection}
//                     onChange={(e) => handleCameraConfigChange(selectedCameraIndex, "motionDetection", e.target.checked)}
//                   />
//                 }
//                 label="Motion Detection"
//               />
//               {camera.motionDetection && (
//                 <div style={{ marginLeft: "16px", marginBottom: "16px" }}>
//                   <Typography variant="body2">Motion Sensitivity: {camera.motionSensitivity}%</Typography>
//                   <Slider
//                     value={camera.motionSensitivity}
//                     onChange={(e, value) => handleCameraConfigChange(selectedCameraIndex, "motionSensitivity", value)}
//                     min={0}
//                     max={100}
//                     size="small"
//                   />
//                 </div>
//               )}
//               <FormControlLabel
//                 control={
//                   <Switch
//                     checked={camera.notifications}
//                     onChange={(e) => handleCameraConfigChange(selectedCameraIndex, "notifications", e.target.checked)}
//                   />
//                 }
//                 label="Enable Notifications"
//               />
//               <FormControlLabel
//                 control={
//                   <Switch
//                     checked={camera.recordingEnabled}
//                     onChange={(e) =>
//                       handleCameraConfigChange(selectedCameraIndex, "recordingEnabled", e.target.checked)
//                     }
//                   />
//                 }
//                 label="Enable Recording"
//               />
//               {camera.recordingEnabled && (
//                 <TextField
//                   label="Storage Retention (days)"
//                   type="number"
//                   value={camera.storageRetention}
//                   onChange={(e) =>
//                     handleCameraConfigChange(selectedCameraIndex, "storageRetention", Number.parseInt(e.target.value))
//                   }
//                   fullWidth
//                   margin="normal"
//                   size="small"
//                 />
//               )}
//               <FormControlLabel
//                 control={
//                   <Switch
//                     checked={camera.ptz}
//                     onChange={(e) => handleCameraConfigChange(selectedCameraIndex, "ptz", e.target.checked)}
//                   />
//                 }
//                 label="PTZ Controls"
//               />
//               <Button
//                 variant="outlined"
//                 color="error"
//                 onClick={() => handleRemoveCamera(selectedCameraIndex)}
//                 style={{ marginTop: "16px" }}
//                 fullWidth
//               >
//                 Remove Camera
//               </Button>
//             </div>
//           )}
//         </div>
//       </div>
//     )
//   }

//   const renderCameraSettings = () => {
//     if (editingCameraIndex === null) {
//       return (
//         <div className="camera-grid-settings">
//           <Typography variant="h6" gutterBottom>
//             Grid Settings
//           </Typography>

//           <FormControl fullWidth margin="normal" size="small">
//             <InputLabel>Grid Layout</InputLabel>
//             <Select value={gridLayout} onChange={(e) => handleGridLayoutChange(e.target.value)} label="Grid Layout">
//               {Object.keys(gridLayouts).map((layout) => (
//                 <MenuItem key={layout} value={layout}>
//                   {gridLayouts[layout].description}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>

//           <FormControlLabel
//             control={
//               <Switch
//                 checked={editedConfig.showCameraLabels}
//                 onChange={(e) =>
//                   setEditedConfig((prev) => ({
//                     ...prev,
//                     showCameraLabels: e.target.checked,
//                   }))
//                 }
//               />
//             }
//             label="Show Camera Labels"
//           />

//           {gridLayout === "free-form" && (
//             <>
//               <FormControlLabel
//                 control={<Switch checked={isDraggable} onChange={(e) => setIsDraggable(e.target.checked)} />}
//                 label="Enable Dragging"
//               />

//               <FormControlLabel
//                 control={<Switch checked={isResizable} onChange={(e) => setIsResizable(e.target.checked)} />}
//                 label="Enable Resizing"
//               />

//               <Button variant="outlined" onClick={resetCameraLayout} fullWidth style={{ marginTop: "16px" }}>
//                 Reset Layout
//               </Button>
//             </>
//           )}

//           <Divider style={{ margin: "16px 0" }} />

//           <Typography variant="h6" gutterBottom>
//             Camera Management
//           </Typography>

//           <List>
//             {cameras.map((camera, index) => (
//               <ListItem key={camera.id}>
//                 <ListItemText
//                   primary={camera.title}
//                   secondary={`${camera.streamUrl} - ${camera.isConnected ? "Connected" : "Disconnected"}`}
//                 />
//                 <ListItemSecondaryAction>
//                   <IconButton
//                     edge="end"
//                     onClick={() => setEditingCameraIndex(index)}
//                     size="small"
//                     style={{ marginRight: 8 }}
//                   >
//                     <Settings fontSize="small" />
//                   </IconButton>
//                   <IconButton edge="end" onClick={() => handleRemoveCamera(index)} size="small">
//                     <Delete fontSize="small" />
//                   </IconButton>
//                 </ListItemSecondaryAction>
//               </ListItem>
//             ))}
//           </List>

//           <Button
//             variant="outlined"
//             startIcon={<Add />}
//             onClick={() => setIsAddCameraDialogOpen(true)}
//             fullWidth
//             style={{ marginTop: "16px" }}
//           >
//             Add New Camera
//           </Button>

//           <div className="settings-actions">
//             <Button variant="outlined" color="secondary" startIcon={<Cancel />} onClick={cancelSettings} size="small">
//               Cancel
//             </Button>
//             <Button variant="contained" color="primary" startIcon={<Save />} onClick={saveSettings} size="small">
//               Save
//             </Button>
//           </div>
//         </div>
//       )
//     }

//     // Individual camera settings
//     const camera = cameras[editingCameraIndex]
//     return (
//       <div className="camera-grid-settings">
//         <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
//           <IconButton onClick={() => setEditingCameraIndex(null)} size="small">
//             <ArrowBack />
//           </IconButton>
//           <Typography variant="h6" style={{ marginLeft: "8px" }}>
//             {camera.title} Settings
//           </Typography>
//         </div>

//         <TextField
//           label="Camera Name"
//           value={camera.title}
//           onChange={(e) => handleCameraConfigChange(editingCameraIndex, "title", e.target.value)}
//           fullWidth
//           margin="normal"
//           size="small"
//         />

//         <TextField
//           label="Stream URL"
//           value={camera.streamUrl}
//           onChange={(e) => handleCameraConfigChange(editingCameraIndex, "streamUrl", e.target.value)}
//           fullWidth
//           margin="normal"
//           size="small"
//         />

//         <TextField
//           label="Username"
//           value={camera.username}
//           onChange={(e) => handleCameraConfigChange(editingCameraIndex, "username", e.target.value)}
//           fullWidth
//           margin="normal"
//           size="small"
//         />

//         <TextField
//           label="Password"
//           type={showPassword[editingCameraIndex] ? "text" : "password"}
//           value={camera.password}
//           onChange={(e) => handleCameraConfigChange(editingCameraIndex, "password", e.target.value)}
//           fullWidth
//           margin="normal"
//           size="small"
//           InputProps={{
//             endAdornment: (
//               <IconButton
//                 onClick={() =>
//                   setShowPassword((prev) => ({
//                     ...prev,
//                     [editingCameraIndex]: !prev[editingCameraIndex],
//                   }))
//                 }
//                 size="small"
//               >
//                 {showPassword[editingCameraIndex] ? (
//                   <VisibilityOff fontSize="small" />
//                 ) : (
//                   <Visibility fontSize="small" />
//                 )}
//               </IconButton>
//             ),
//           }}
//         />

//         <TextField
//           label="Refresh Interval (seconds)"
//           type="number"
//           value={camera.refreshInterval}
//           onChange={(e) =>
//             handleCameraConfigChange(editingCameraIndex, "refreshInterval", Number.parseInt(e.target.value))
//           }
//           fullWidth
//           margin="normal"
//           size="small"
//         />

//         <FormControlLabel
//           control={
//             <Switch
//               checked={camera.motionDetection}
//               onChange={(e) => handleCameraConfigChange(editingCameraIndex, "motionDetection", e.target.checked)}
//             />
//           }
//           label="Motion Detection"
//         />

//         {camera.motionDetection && (
//           <div style={{ marginLeft: "16px", marginBottom: "16px" }}>
//             <Typography variant="body2">Motion Sensitivity: {camera.motionSensitivity}%</Typography>
//             <Slider
//               value={camera.motionSensitivity}
//               onChange={(e, value) => handleCameraConfigChange(editingCameraIndex, "motionSensitivity", value)}
//               min={0}
//               max={100}
//               size="small"
//             />
//           </div>
//         )}

//         <FormControlLabel
//           control={
//             <Switch
//               checked={camera.notifications}
//               onChange={(e) => handleCameraConfigChange(editingCameraIndex, "notifications", e.target.checked)}
//             />
//           }
//           label="Enable Notifications"
//         />

//         <FormControlLabel
//           control={
//             <Switch
//               checked={camera.recordingEnabled}
//               onChange={(e) => handleCameraConfigChange(editingCameraIndex, "recordingEnabled", e.target.checked)}
//             />
//           }
//           label="Enable Recording"
//         />

//         {camera.recordingEnabled && (
//           <TextField
//             label="Storage Retention (days)"
//             type="number"
//             value={camera.storageRetention}
//             onChange={(e) =>
//               handleCameraConfigChange(editingCameraIndex, "storageRetention", Number.parseInt(e.target.value))
//             }
//             fullWidth
//             margin="normal"
//             size="small"
//           />
//         )}

//         <FormControlLabel
//           control={
//             <Switch
//               checked={camera.ptz}
//               onChange={(e) => handleCameraConfigChange(editingCameraIndex, "ptz", e.target.checked)}
//             />
//           }
//           label="PTZ Controls"
//         />

//         <div className="settings-actions">
//           <Button
//             variant="outlined"
//             color="secondary"
//             startIcon={<ArrowBack />}
//             onClick={() => setEditingCameraIndex(null)}
//             size="small"
//           >
//             Back
//           </Button>
//           <Button variant="contained" color="primary" startIcon={<Save />} onClick={saveSettings} size="small">
//             Save
//           </Button>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <Card ref={containerRef} className="camera-grid-widget">
//       <CardHeader
//         title={editedConfig.title}
//         titleTypographyProps={{ variant: "subtitle1" }}
//         action={
//           <>
//             <IconButton onClick={() => setIsAddCameraDialogOpen(true)} size="small">
//               <Add fontSize="small" />
//             </IconButton>
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
//               <MenuItem onClick={() => setIsSidebarVisible(!isSidebarVisible)}>
//                 {isSidebarVisible ? (
//                   <>
//                     <VisibilityOff fontSize="small" style={{ marginRight: 8 }} />
//                     Hide Events
//                   </>
//                 ) : (
//                   <>
//                     <Visibility fontSize="small" style={{ marginRight: 8 }} />
//                     Show Events
//                   </>
//                 )}
//               </MenuItem>
//               <MenuItem onClick={() => cameras.forEach((_, index) => addCameraAlert(index, "Screenshot taken"))}>
//                 <CameraAlt fontSize="small" style={{ marginRight: 8 }} />
//                 Take Screenshots
//               </MenuItem>
//               {gridLayout === "free-form" && (
//                 <MenuItem onClick={resetCameraLayout}>
//                   <AspectRatio fontSize="small" style={{ marginRight: 8 }} />
//                   Reset Layout
//                 </MenuItem>
//               )}
//             </Menu>
//           </>
//         }
//       />

//       <CardContent>
//         {isSettingsVisible ? (
//           renderCameraSettings()
//         ) : (
//           <div className="camera-grid-main">
//             <div className="camera-grid-content">
//               {/* Grid Layout Controls */}
//               <div className="grid-layout-controls">
//                 <Typography className="layout-label">Layout:</Typography>
//                 {Object.keys(gridLayouts).map((layout) => (
//                   <Button
//                     key={layout}
//                     size="small"
//                     variant={gridLayout === layout ? "contained" : "outlined"}
//                     onClick={() => handleGridLayoutChange(layout)}
//                     className={`grid-layout-button ${gridLayout === layout ? "active" : ""}`}
//                   >
//                     {layout === "free-form" ? "Free" : layout}
//                   </Button>
//                 ))}
//                 <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
//                   {gridLayout === "free-form" && (
//                     <>
//                       <Typography variant="caption">
//                         Drag: {isDraggable ? "ON" : "OFF"} | Resize: {isResizable ? "ON" : "OFF"}
//                       </Typography>
//                     </>
//                   )}
//                   <Typography variant="caption">{isLive ? "LIVE MODE" : "PLAYBACK MODE"}</Typography>
//                   <Button
//                     size="small"
//                     variant="outlined"
//                     onClick={toggleLiveMode}
//                     startIcon={isLive ? <CalendarToday /> : <Videocam />}
//                   >
//                     {isLive ? "Playback" : "Live"}
//                   </Button>
//                 </div>
//               </div>

//               {/* Camera Grid */}
//               {renderCameraGrid()}

//               {/* Selected Camera Details */}
//               {selectedCameraIndex !== null && renderSelectedCameraDetails()}
//             </div>

//             {/* Events Sidebar */}
//             {isSidebarVisible && (
//               <div className="camera-events-sidebar">
//                 <div className="camera-events-header">
//                   <Typography variant="h6">Events</Typography>
//                 </div>
//                 <div className="camera-events-content">
//                   <CameraEventSidebar
//                     isLive={isLive}
//                     currentTime={0}
//                     cameras={cameras}
//                     selectedCameraIndex={selectedCameraIndex}
//                   />
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </CardContent>

//       {/* Add Camera Dialog */}
//       <Dialog
//         open={isAddCameraDialogOpen}
//         onClose={() => setIsAddCameraDialogOpen(false)}
//         maxWidth="sm"
//         fullWidth
//         className="add-camera-dialog"
//       >
//         <DialogTitle>Add New Camera</DialogTitle>
//         <DialogContent>
//           <TextField
//             label="Camera Name"
//             value={newCameraConfig.title}
//             onChange={(e) => setNewCameraConfig((prev) => ({ ...prev, title: e.target.value }))}
//             fullWidth
//             margin="normal"
//           />
//           <TextField
//             label="Stream URL"
//             value={newCameraConfig.streamUrl}
//             onChange={(e) => setNewCameraConfig((prev) => ({ ...prev, streamUrl: e.target.value }))}
//             fullWidth
//             margin="normal"
//           />
//           <TextField
//             label="Username"
//             value={newCameraConfig.username}
//             onChange={(e) => setNewCameraConfig((prev) => ({ ...prev, username: e.target.value }))}
//             fullWidth
//             margin="normal"
//           />
//           <TextField
//             label="Password"
//             type="password"
//             value={newCameraConfig.password}
//             onChange={(e) => setNewCameraConfig((prev) => ({ ...prev, password: e.target.value }))}
//             fullWidth
//             margin="normal"
//           />
//           <TextField
//             label="Refresh Interval (seconds)"
//             type="number"
//             value={newCameraConfig.refreshInterval}
//             onChange={(e) =>
//               setNewCameraConfig((prev) => ({ ...prev, refreshInterval: Number.parseInt(e.target.value) }))
//             }
//             fullWidth
//             margin="normal"
//           />
//           <FormControlLabel
//             control={
//               <Switch
//                 checked={newCameraConfig.motionDetection}
//                 onChange={(e) => setNewCameraConfig((prev) => ({ ...prev, motionDetection: e.target.checked }))}
//               />
//             }
//             label="Motion Detection"
//           />
//           {newCameraConfig.motionDetection && (
//             <div style={{ marginLeft: "16px", marginBottom: "16px" }}>
//               <Typography variant="body2">Motion Sensitivity: {newCameraConfig.motionSensitivity}%</Typography>
//               <Slider
//                 value={newCameraConfig.motionSensitivity}
//                 onChange={(e, value) => setNewCameraConfig((prev) => ({ ...prev, motionSensitivity: value }))}
//                 min={0}
//                 max={100}
//                 size="small"
//               />
//             </div>
//           )}
//           <FormControlLabel
//             control={
//               <Switch
//                 checked={newCameraConfig.notifications}
//                 onChange={(e) => setNewCameraConfig((prev) => ({ ...prev, notifications: e.target.checked }))}
//               />
//             }
//             label="Enable Notifications"
//           />
//           <FormControlLabel
//             control={
//               <Switch
//                 checked={newCameraConfig.recordingEnabled}
//                 onChange={(e) => setNewCameraConfig((prev) => ({ ...prev, recordingEnabled: e.target.checked }))}
//               />
//             }
//             label="Enable Recording"
//           />
//           {newCameraConfig.recordingEnabled && (
//             <TextField
//               label="Storage Retention (days)"
//               type="number"
//               value={newCameraConfig.storageRetention}
//               onChange={(e) =>
//                 setNewCameraConfig((prev) => ({ ...prev, storageRetention: Number.parseInt(e.target.value) }))
//               }
//               fullWidth
//               margin="normal"
//             />
//           )}
//           <FormControlLabel
//             control={
//               <Switch
//                 checked={newCameraConfig.ptz}
//                 onChange={(e) => setNewCameraConfig((prev) => ({ ...prev, ptz: e.target.checked }))}
//               />
//             }
//             label="PTZ Controls"
//           />
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setIsAddCameraDialogOpen(false)}>Cancel</Button>
//           <Button
//             onClick={handleAddCamera}
//             variant="contained"
//             disabled={!newCameraConfig.title || !newCameraConfig.streamUrl}
//           >
//             Add Camera
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Card>
//   )
// }

// export default CameraGridWidget
