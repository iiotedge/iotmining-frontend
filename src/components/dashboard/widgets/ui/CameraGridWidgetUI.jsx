"use client"

import React from "react"
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
} from "@mui/icons-material"
import { Rnd } from "react-rnd"
import "../../../../styles/camera-grid-widget.css" // Keep styles in the UI part
import CameraEventSidebar from "../CameraEventSidebar" // Assuming this is also a UI component

const CameraGridWidgetUI = ({
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

  // Setters (passed from hook for controlled components)
  setActiveTab,
  setSelectedDate,
  setTimeRange,
  setNewCameraConfig,
  setIsAddCameraDialogOpen,
  setShowPassword,
  setEditingCameraIndex,
  setIsSidebarVisible,
  setEditedConfig,
  setIsDraggable,
  setIsResizable,

  // Handlers & Functions
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
  initializeCameraStream, // For retry button
}) => {
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

                    {camera.isConnected && (
                      <div className="camera-video-placeholder">
                        <video
                          id={`video-${camera.id}`}
                          className="camera-video-element"
                          autoPlay
                          muted
                          controls // Added controls for user interaction
                          playsInline
                          style={{ width: "100%", height: "100%" }}
                        />
                      </div>
                    )}
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

                    {camera.isConnected && (
                      <div className="camera-video-placeholder">
                        {/* Ensure video element is always here when connected */}
                        <video
                          id={`video-${camera.id}`}
                          className="camera-video-element"
                          autoPlay
                          muted
                          controls // Added controls for user interaction
                          playsInline
                          style={{ width: "100%", height: "100%" }}
                        />
                      </div>
                    )}
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
              <MenuItem onClick={() => cameras.forEach((_, index) => alert(`Screenshot taken for ${cameras[index].title}`))}>
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

export default CameraGridWidgetUI