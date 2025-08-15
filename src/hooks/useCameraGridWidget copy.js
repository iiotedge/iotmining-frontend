"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Hls from "hls.js"
import { useMemo } from "react" // already imported above

const defaultConfig = {
  title: "Camera Grid",
  cameras: [
    {
      id: "cam1",
      title: "Front Door Camera",
      streamUrl: "http://192.168.1.11:8086/onvif_cam_192_168_1_2/index.m3u8",
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
    },
    {
      id: "cam2",
      title: "Parking Lot Camera",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
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
    },
    {
      id: "cam3",
      title: "Back Yard Camera",
      streamUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
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
    },
    {
      id: "cam4",
      title: "Side Entrance Camera",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
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
    },
  ],
  gridLayout: "free-form",
  showCameraLabels: true,
  autoRotate: false,
  rotationInterval: 10,
  resizable: true,
  draggable: true,
}

export const gridLayouts = {
  "free-form": { cols: 0, rows: 0, maxCameras: 16, description: "Free-form (Resizable & Draggable)" },
  "1x1": { cols: 1, rows: 1, maxCameras: 1, description: "Single Camera" },
  "2x2": { cols: 2, rows: 2, maxCameras: 4, description: "2x2 Grid" },
  "3x3": { cols: 3, rows: 3, maxCameras: 9, description: "3x3 Grid" },
  "4x4": { cols: 4, rows: 4, maxCameras: 16, description: "4x4 Grid" },
  "2x3": { cols: 2, rows: 3, maxCameras: 6, description: "2x3 Grid" },
  "3x2": { cols: 3, rows: 2, maxCameras: 6, description: "3x2 Grid" },
}

export const useCameraGridWidget = (config, onConfigChange) => {
  // const mergedConfig = { ...defaultConfig, ...config }


  const mergedConfig = useMemo(() => {
    return { ...defaultConfig, ...config }
  }, [config])

  const [anchorEl, setAnchorEl] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSettingsVisible, setIsSettingsVisible] = useState(false)
  const [selectedCameraIndex, setSelectedCameraIndex] = useState(null)
  const [gridLayout, setGridLayout] = useState(mergedConfig.gridLayout || "free-form")
  const [isSidebarVisible, setIsSidebarVisible] = useState(false)
  const [isAddCameraDialogOpen, setIsAddCameraDialogOpen] = useState(false)
  const [editingCameraIndex, setEditingCameraIndex] = useState(null)
  const [showPassword, setShowPassword] = useState({})
  const [isLive, setIsLive] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [timeRange, setTimeRange] = useState([0, 24])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isResizable, setIsResizable] = useState(mergedConfig.resizable !== false)
  const [isDraggable, setIsDraggable] = useState(mergedConfig.draggable !== false)

  const [cameras, setCameras] = useState(mergedConfig.cameras)
  const [editedConfig, setEditedConfig] = useState(mergedConfig)
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

  const updateCameraState = useCallback((cameraIndex, updates) => {
    setCameras((prev) =>
      prev.map((camera, index) => (index === cameraIndex ? { ...camera, ...updates } : camera))
    )
  }, [])

  const addCameraAlert = useCallback((cameraIndex, message) => {
    const newAlert = {
      id: Date.now(),
      message,
      timestamp: new Date(),
    }
    setCameras((prev) =>
      prev.map((camera, index) =>
        index === cameraIndex
          ? { ...camera, alerts: [...(camera.alerts || []), newAlert].slice(0, 50) }
          : camera
      )
    )
  }, [])

  // const initializeCameraStream = useCallback(
  //   (cameraIndex) => {
  //     const camera = cameras[cameraIndex];
  //     if (!camera || !camera.streamUrl) return;

  //     updateCameraState(cameraIndex, { isLoading: true });

  //     setTimeout(() => {
  //       const video = document.getElementById(`video-${camera.id}`);
  //       if (!video) return;

  //       // Cleanup previous HLS instance
  //       if (video.hlsInstance) {
  //         video.hlsInstance.destroy();
  //         video.hlsInstance = null;
  //       }

  //       if (Hls.isSupported()) {
  //         const hls = new Hls();
  //         hls.attachMedia(video);
  //         hls.loadSource(camera.streamUrl);
  //         hls.on(Hls.Events.MANIFEST_PARSED, () => {
  //           video.play().catch((e) => console.error("HLS Play Error:", e));
  //         });
  //         video.hlsInstance = hls;
  //       } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
  //         video.src = camera.streamUrl;
  //         video.addEventListener("loadedmetadata", () => {
  //           video.play().catch((e) => console.error("Native HLS Play Error:", e));
  //         });
  //       } else {
  //         addCameraAlert(cameraIndex, "HLS not supported in this browser.");
  //       }

  //       updateCameraState(cameraIndex, {
  //         isLoading: false,
  //         isConnected: true,
  //       });
  //     }, 500);
  //   },
  //   [cameras, updateCameraState, addCameraAlert]
  // );
const initializeCameraStream = useCallback(
  (cameraIndex) => {
    const camera = cameras[cameraIndex];
    if (!camera || !camera.streamUrl) return;

    updateCameraState(cameraIndex, { isLoading: true });

    // Wait until DOM has updated
    setTimeout(() => {
      const video = document.querySelector(`#video-${camera.id}`);
      if (!video) {
        addCameraAlert(cameraIndex, "Video element not found.");
        updateCameraState(cameraIndex, { isLoading: false, isConnected: false });
        return;
      }

      // Cleanup previous HLS instance
      if (video.hlsInstance) {
        video.hlsInstance.destroy();
        video.hlsInstance = null;
      }

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(camera.streamUrl);
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch((e) => {
            console.error("HLS Play Error:", e);
            addCameraAlert(cameraIndex, "Unable to play stream.");
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error("HLS.js error:", data);
          addCameraAlert(cameraIndex, `Stream error: ${data?.details || "Unknown error"}`);
        });

        video.hlsInstance = hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = camera.streamUrl;
        video.addEventListener("loadedmetadata", () => {
          video.play().catch((e) => {
            console.error("Native HLS Play Error:", e);
            addCameraAlert(cameraIndex, "Unable to play stream.");
          });
        });
      } else {
        addCameraAlert(cameraIndex, "HLS not supported in this browser.");
      }

      updateCameraState(cameraIndex, {
        isLoading: false,
        isConnected: true,
      });
    }, 500);
  },
  [cameras, updateCameraState, addCameraAlert]
);

const destroyCameraStream = useCallback(
  (cameraIndex) => {
    const camera = cameras[cameraIndex];
    const video = document.querySelector(`#video-${camera?.id}`);
    if (video?.hlsInstance) {
      video.hlsInstance.destroy();
      video.hlsInstance = null;
    }

    updateCameraState(cameraIndex, { isConnected: false });
  },
  [cameras, updateCameraState]
);



  useEffect(() => {
    setEditedConfig(mergedConfig)
    setCameras(mergedConfig.cameras)
    setGridLayout(mergedConfig.gridLayout || "free-form")
    setIsResizable(mergedConfig.resizable !== false)
    setIsDraggable(mergedConfig.draggable !== false)

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

    setCameraPositions(mergedConfig.cameraPositions || defaultPositions)
    setCameraSizes(mergedConfig.cameraSizes || defaultSizes)
  }, [config])

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timeInterval)
  }, [])

  useEffect(() => {
    cameras.forEach((camera, index) => {
      if (camera.streamUrl && camera.isPlaying) {
        initializeCameraStream(index)
      }
    })

    return () => {
      cameras.forEach((_, index) => destroyCameraStream(index))
    }
  }, [cameras, initializeCameraStream, destroyCameraStream])


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
  }, [cameras, updateCameraState, addCameraAlert])

  const deleteAlert = useCallback(
    (cameraIndex, alertId) => {
      const camera = cameras[cameraIndex]
      if (camera) {
        const updatedAlerts = camera.alerts.filter((alert) => alert.id !== alertId)
        updateCameraState(cameraIndex, { alerts: updatedAlerts })
      }
    },
    [cameras, updateCameraState]
  )

  const clearAllAlerts = useCallback(
    (cameraIndex) => {
      updateCameraState(cameraIndex, { alerts: [] })
    },
    [updateCameraState]
  )

  const toggleCameraPlayPause = useCallback(
    (cameraIndex) => {
      const camera = cameras[cameraIndex]
      updateCameraState(cameraIndex, { isPlaying: !camera.isPlaying })
    },
    [cameras, updateCameraState]
  )

  const handleCameraClick = useCallback(
    (cameraIndex) => {
      setSelectedCameraIndex(selectedCameraIndex === cameraIndex ? null : cameraIndex)
    },
    [selectedCameraIndex]
  )

  const handleMenuOpen = useCallback((event) => {
    setAnchorEl(event.currentTarget)
  }, [])

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  const toggleSettings = useCallback(() => {
    setIsSettingsVisible(!isSettingsVisible)
    handleMenuClose()
  }, [isSettingsVisible, handleMenuClose])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err)
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const handleGridLayoutChange = useCallback(
    (newLayout) => {
      setGridLayout(newLayout)
      setEditedConfig((prev) => ({ ...prev, gridLayout: newLayout }))

      if (newLayout === "free-form" || gridLayout === "free-form") {
        const newPositions = {}
        const newSizes = {}

        cameras.forEach((camera, index) => {
          if (newLayout === "free-form") {
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
        } else {
          setCameraPositions({});
          setCameraSizes({});
        }
      }
    },
    [gridLayout, cameras]
  )

  const handleCameraResize = useCallback((cameraId, size) => {
    setCameraSizes((prev) => ({
      ...prev,
      [cameraId]: size,
    }))
  }, [])

  const handleCameraDrag = useCallback((cameraId, position) => {
    setCameraPositions((prev) => ({
      ...prev,
      [cameraId]: position,
    }))
  }, [])

  const handleAddCamera = useCallback(() => {
    const newCamera = {
      id: `cam${Date.now()}`,
      ...newCameraConfig,
      isPlaying: true,
      isConnected: false,
      isLoading: false,
      alerts: [],
      motionDetected: false,
    }

    const updatedCameras = [...cameras, newCamera]
    setCameras(updatedCameras)
    setEditedConfig((prev) => ({ ...prev, cameras: updatedCameras }))

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
  }, [cameras, newCameraConfig])

  const handleRemoveCamera = useCallback(
    (cameraIndex) => {
      const cameraToRemove = cameras[cameraIndex]
      const updatedCameras = cameras.filter((_, index) => index !== cameraIndex)
      setCameras(updatedCameras)
      setEditedConfig((prev) => ({ ...prev, cameras: updatedCameras }))

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
    },
    [cameras, selectedCameraIndex, editingCameraIndex]
  )

  const handleCameraConfigChange = useCallback(
    (cameraIndex, field, value) => {
      const updatedCameras = cameras.map((camera, index) =>
        index === cameraIndex ? { ...camera, [field]: value } : camera
      )
      setCameras(updatedCameras)
      setEditedConfig((prev) => ({ ...prev, cameras: updatedCameras }))
    },
    [cameras]
  )

  const saveSettings = useCallback(() => {
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
  }, [editedConfig, cameraPositions, cameraSizes, isResizable, isDraggable, onConfigChange])

  const cancelSettings = useCallback(() => {
    setEditedConfig(mergedConfig)
    setCameras(mergedConfig.cameras)
    setGridLayout(mergedConfig.gridLayout || "free-form")
    setIsResizable(mergedConfig.resizable !== false)
    setIsDraggable(mergedConfig.draggable !== false)
    setCameraPositions(mergedConfig.cameraPositions || {});
    setCameraSizes(mergedConfig.cameraSizes || {});
    setIsSettingsVisible(false)
    setEditingCameraIndex(null)
  }, [mergedConfig])

  const handlePtzControl = useCallback(
    (cameraIndex, direction) => {
      const camera = cameras[cameraIndex]
      if (camera?.ptz) {
        addCameraAlert(cameraIndex, `PTZ Command: ${direction}`)
      }
    },
    [cameras, addCameraAlert]
  )

  const toggleLiveMode = useCallback(() => {
    setIsLive((prev) => {
      const newIsLive = !prev
      if (!newIsLive) {
        // Switching to Playback
        cameras.forEach((_, index) => {
          destroyCameraStream(index) // Disconnect live streams
        })
      } else {
        // Switching back to Live
        cameras.forEach((_, index) => {
          initializeCameraStream(index) // Reinitialize streams
        })
      }
      return newIsLive
    })
  }, [cameras, initializeCameraStream, destroyCameraStream])

  const loadRecordingForDate = useCallback(
    (cameraIndex, date, range) => {
      updateCameraState(cameraIndex, { isLoading: true, isConnected: false })
      setTimeout(() => {
        updateCameraState(cameraIndex, {
          isLoading: false,
          isConnected: true,
        })
        addCameraAlert(
          cameraIndex,
          `Loaded recording for ${date.toLocaleDateString()} from ${range[0]}:00 to ${range[1]}:00`
        )
      }, 1000 + Math.random() * 2000)
    },
    [updateCameraState, addCameraAlert]
  )

  const formatTimeRange = useCallback((range) => {
    return `${range[0]}:00 - ${range[1]}:00`
  }, [])

  const resetCameraLayout = useCallback(() => {
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
  }, [cameras])

  return {
    // State
    anchorEl,
    activeTab,
    isFullscreen,
    isSettingsVisible,
    selectedCameraIndex,
    gridLayout,
    isSidebarVisible,
    isAddCameraDialogOpen,
    editingCameraIndex,
    showPassword,
    isLive,
    selectedDate,
    timeRange,
    currentTime,
    isResizable,
    isDraggable,
    cameras,
    editedConfig,
    cameraPositions,
    cameraSizes,
    newCameraConfig,
    containerRef,
    gridLayouts,

    // Setters
    setAnchorEl,
    setActiveTab,
    setIsFullscreen,
    setIsSettingsVisible,
    setSelectedCameraIndex,
    setGridLayout,
    setIsSidebarVisible,
    setIsAddCameraDialogOpen,
    setEditingCameraIndex,
    setShowPassword,
    setIsLive,
    setSelectedDate,
    setTimeRange,
    setCurrentTime,
    setIsResizable,
    setIsDraggable,
    setCameras,
    setEditedConfig,
    setCameraPositions,
    setCameraSizes,
    setNewCameraConfig,

    // Handlers & Functions
    updateCameraState,
    addCameraAlert,
    deleteAlert,
    clearAllAlerts,
    toggleCameraPlayPause,
    handleCameraClick,
    handleMenuOpen,
    handleMenuClose,
    toggleSettings,
    toggleFullscreen,
    handleGridLayoutChange,
    handleCameraResize,
    handleCameraDrag,
    handleAddCamera,
    handleRemoveCamera,
    handleCameraConfigChange,
    saveSettings,
    cancelSettings,
    handlePtzControl,
    toggleLiveMode,
    loadRecordingForDate,
    formatTimeRange,
    resetCameraLayout,
    initializeCameraStream, // Expose if needed for retry button
  }
}