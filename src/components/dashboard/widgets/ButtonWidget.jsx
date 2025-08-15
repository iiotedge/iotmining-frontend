"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Grid,
  Paper,
  LinearProgress,
  Divider,
  FormControlLabel,
  Switch,
} from "@mui/material"
import {
  PlayArrow,
  Stop,
  Pause,
  Refresh,
  Warning,
  CheckCircle,
  Error,
  Lock,
  LockOpen,
  Settings,
  PowerSettingsNew,
  Timer,
  Speed,
  Security,
} from "@mui/icons-material"
// import "../../styles/camera-grid-widget.css"

const ButtonWidget = ({
  config = {
    title: "Motor Controller",
    buttonText: "Click Me",
    buttonColor: "primary",
    deviceId: "MOTOR_001",
    buttons: [
      { id: "start", label: "Start", icon: "play", color: "success", critical: false },
      { id: "stop", label: "Stop", icon: "stop", color: "error", critical: true },
      { id: "pause", label: "Pause", icon: "pause", color: "warning", critical: false },
      { id: "reset", label: "Reset", icon: "refresh", color: "primary", critical: false },
    ],
    requireConfirmation: true,
    lockable: true,
    timedOperations: true,
  },
}) => {
  const [isConnected, setIsConnected] = useState(true)
  const [isLocked, setIsLocked] = useState(false)
  const [deviceStatus, setDeviceStatus] = useState("stopped") // stopped, running, paused, error
  const [lastAction, setLastAction] = useState(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [operationProgress, setOperationProgress] = useState(0)
  const [isOperating, setIsOperating] = useState(false)
  const [operationTimer, setOperationTimer] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [actionHistory, setActionHistory] = useState([])
  const [autoMode, setAutoMode] = useState(false)
  const [safetyMode, setSafetyMode] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [clickCount, setClickCount] = useState(0)
  const [lastClicked, setLastClicked] = useState(null)
  const [isPressed, setIsPressed] = useState(false)

  // Icon mapping
  const iconMap = {
    play: PlayArrow,
    stop: Stop,
    pause: Pause,
    refresh: Refresh,
    power: PowerSettingsNew,
    timer: Timer,
    speed: Speed,
  }

  // Simulate device connection and status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(Math.random() > 0.05) // 95% uptime
      setLastUpdate(new Date())

      // Update operation timer if running
      if (deviceStatus === "running" && config.timedOperations) {
        setOperationTimer((prev) => prev + 1)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [deviceStatus, config.timedOperations])

  // Handle operation progress simulation
  useEffect(() => {
    if (isOperating) {
      const interval = setInterval(() => {
        setOperationProgress((prev) => {
          if (prev >= 100) {
            setIsOperating(false)
            return 0
          }
          return prev + 2
        })
      }, 100)

      return () => clearInterval(interval)
    }
  }, [isOperating])

  const addToHistory = (action, status = "success") => {
    const entry = {
      id: Date.now(),
      timestamp: new Date(),
      action: action.label,
      buttonId: action.id,
      status,
      user: "Operator",
      deviceStatus: deviceStatus,
    }
    setActionHistory((prev) => [entry, ...prev.slice(0, 19)]) // Keep last 20 entries
  }

  const handleButtonClick = (button) => {
    if (isLocked || !isConnected) return

    // Check if confirmation is required
    if ((config.requireConfirmation && button.critical) || (safetyMode && button.color === "error")) {
      setPendingAction(button)
      setShowConfirmDialog(true)
      return
    }

    executeAction(button)
  }

  const executeAction = (button) => {
    setLastAction(button)
    setIsOperating(true)
    setOperationProgress(0)

    // Simulate different device responses based on button action
    switch (button.id) {
      case "start":
        setDeviceStatus("running")
        setOperationTimer(0)
        addToHistory(button, "success")
        break
      case "stop":
        setDeviceStatus("stopped")
        setOperationTimer(0)
        addToHistory(button, "success")
        break
      case "pause":
        setDeviceStatus("paused")
        addToHistory(button, "success")
        break
      case "reset":
        setDeviceStatus("stopped")
        setOperationTimer(0)
        addToHistory(button, "success")
        break
      default:
        addToHistory(button, "success")
    }

    // Simulate operation completion
    setTimeout(() => {
      setIsOperating(false)
      setOperationProgress(0)
    }, 2000)
  }

  const handleConfirmAction = () => {
    if (pendingAction) {
      executeAction(pendingAction)
      setShowConfirmDialog(false)
      setPendingAction(null)
    }
  }

  const getStatusColor = () => {
    if (!isConnected) return "error"
    switch (deviceStatus) {
      case "running":
        return "success"
      case "paused":
        return "warning"
      case "error":
        return "error"
      default:
        return "default"
    }
  }

  const getStatusIcon = () => {
    if (!isConnected) return <Error />
    switch (deviceStatus) {
      case "running":
        return <PlayArrow />
      case "paused":
        return <Pause />
      case "error":
        return <Error />
      default:
        return <Stop />
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getButtonIcon = (iconName) => {
    const IconComponent = iconMap[iconName] || PlayArrow
    return <IconComponent />
  }

  const handleMainButtonClick = () => {
    setClickCount(prev => prev + 1)
    setLastClicked(new Date())
    setIsPressed(true)
    
    // Reset pressed state after animation
    setTimeout(() => setIsPressed(false), 200)
  }

  return (
    <Card className="camera-grid-widget" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2">
            {config.title}
          </Typography>
          <Box display="flex" gap={1}>
            <Chip icon={getStatusIcon()} label={deviceStatus.toUpperCase()} color={getStatusColor()} size="small" />
            <Chip
              icon={isConnected ? <CheckCircle /> : <Error />}
              label={isConnected ? "ONLINE" : "OFFLINE"}
              color={isConnected ? "success" : "error"}
              size="small"
            />
            {isLocked && <Chip icon={<Lock />} label="LOCKED" color="warning" size="small" />}
          </Box>
        </Box>

        {/* Main Button */}
        <Box my={4} textAlign="center">
          <Button
            variant="contained"
            color={config.buttonColor}
            size="large"
            onClick={handleMainButtonClick}
            sx={{
              minWidth: 120,
              minHeight: 60,
              fontSize: "1.1rem",
              transform: isPressed ? "scale(0.95)" : "scale(1)",
              transition: "transform 0.1s ease-in-out",
            }}
          >
            {config.buttonText}
          </Button>
        </Box>

        {/* Status Display */}
        <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: "background.default" }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Device Status
              </Typography>
              <Typography variant="h6" color="primary">
                {deviceStatus.charAt(0).toUpperCase() + deviceStatus.slice(1)}
              </Typography>
            </Grid>
            {config.timedOperations && (
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Runtime
                </Typography>
                <Typography variant="h6" color="primary">
                  {formatTime(operationTimer)}
                </Typography>
              </Grid>
            )}
          </Grid>

          {isOperating && (
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Operation in Progress...
              </Typography>
              <LinearProgress variant="determinate" value={operationProgress} />
            </Box>
          )}
        </Paper>

        {/* Control Buttons */}
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Controls
          </Typography>
          <Grid container spacing={1}>
            {config.buttons.map((button, index) => (
              <Grid item xs={6} sm={3} key={button.id}>
                <Tooltip title={`${button.label} - ${button.id}`}>
                  <Button
                    fullWidth
                    variant="contained"
                    color={button.color}
                    startIcon={getButtonIcon(button.icon)}
                    onClick={() => handleButtonClick(button)}
                    disabled={isLocked || !isConnected || (isOperating && button.id !== "stop")}
                    sx={{
                      minHeight: 56,
                      fontSize: "0.875rem",
                      "&:hover": {
                        transform: "translateY(-1px)",
                        boxShadow: 3,
                      },
                      transition: "all 0.2s ease-in-out",
                    }}
                  >
                    {button.label}
                  </Button>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Safety Controls */}
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Safety & Mode
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={isLocked ? <Lock /> : <LockOpen />}
                onClick={() => setIsLocked(!isLocked)}
                color={isLocked ? "warning" : "primary"}
                size="small"
              >
                {isLocked ? "Unlock" : "Lock"}
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Security />}
                color={safetyMode ? "success" : "default"}
                onClick={() => setSafetyMode(!safetyMode)}
                size="small"
              >
                Safety: {safetyMode ? "ON" : "OFF"}
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Mode Toggles */}
        <Box mb={2}>
          <FormControlLabel
            control={
              <Switch
                checked={autoMode}
                onChange={(e) => setAutoMode(e.target.checked)}
                disabled={isLocked || !isConnected}
              />
            }
            label="Auto Mode"
          />
        </Box>

        {/* Last Action Info */}
        {lastAction && (
          <Paper elevation={1} sx={{ p: 1, mb: 2, bgcolor: "action.hover" }}>
            <Typography variant="body2" color="text.secondary">
              Last Action: <strong>{lastAction.label}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {lastUpdate.toLocaleTimeString()}
            </Typography>
          </Paper>
        )}

        {/* Device Information */}
        <Divider sx={{ my: 2 }} />
        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Device: {config.deviceId}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Last Update: {lastUpdate.toLocaleTimeString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Safety Mode: {safetyMode ? "Enabled" : "Disabled"}
          </Typography>
        </Box>

        {/* Click Count */}
        <Box display="flex" justifyContent="center" gap={1} mb={2}>
          <Chip 
            label={`Clicks: ${clickCount}`} 
            color="primary" 
            size="small" 
          />
        </Box>

        {/* Last Clicked */}
        {lastClicked && (
          <Typography variant="body2" color="text.secondary">
            Last clicked: {lastClicked.toLocaleTimeString()}
          </Typography>
        )}
      </CardContent>

      {/* Settings Button */}
      <Box p={1} borderTop={1} borderColor="divider">
        <Button fullWidth startIcon={<Settings />} onClick={() => setShowSettings(true)} size="small">
          Settings & History
        </Button>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Warning color="warning" />
            Confirm Action
          </Box>
        </DialogTitle>
        <DialogContent>
          {pendingAction && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                {pendingAction.critical
                  ? "This is a critical operation that may affect system safety."
                  : "Please confirm this action."}
              </Alert>
              <Typography>
                Action: <strong>{pendingAction.label}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Device: {config.deviceId}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current Status: {deviceStatus}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmAction} color={pendingAction?.color || "primary"} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="md" fullWidth>
        <DialogTitle>Button Control Settings & History</DialogTitle>
        <DialogContent>
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Action History
            </Typography>
            {actionHistory.length === 0 ? (
              <Typography color="text.secondary">No recent activity</Typography>
            ) : (
              actionHistory.map((entry) => (
                <Box key={entry.id} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                  <Box>
                    <Typography variant="body2">{entry.action}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {entry.timestamp.toLocaleString()} - {entry.user}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Chip label={entry.status} color={entry.status === "success" ? "success" : "error"} size="small" />
                    <Typography variant="caption" display="block" color="text.secondary">
                      {entry.deviceStatus}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="h6" gutterBottom>
              Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Confirmation Required: {config.requireConfirmation ? "Yes" : "No"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lockable: {config.lockable ? "Yes" : "No"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Timed Operations: {config.timedOperations ? "Yes" : "No"}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default ButtonWidget
