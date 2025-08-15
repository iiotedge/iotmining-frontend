"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  Typography,
  Switch,
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
  Divider,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material"
import {
  Power,
  Lock,
  LockOpen,
  Settings,
  Warning,
  CheckCircle,
  Error,
  Info,
  Schedule,
  Security,
} from "@mui/icons-material"

const SwitchControlWidget = ({
  config = {
    title: "Switch Control",
    switchLabel: "Power",
    deviceId: "SW_001",
    switches: [
      {
        id: "main_power",
        label: "Main Power",
        critical: true,
        requireConfirmation: true,
        description: "Controls main system power",
      },
      {
        id: "cooling_fan",
        label: "Cooling Fan",
        critical: false,
        requireConfirmation: false,
        description: "Controls cooling system fan",
      },
      {
        id: "alarm_system",
        label: "Alarm System",
        critical: true,
        requireConfirmation: true,
        description: "Controls security alarm system",
      },
      {
        id: "backup_power",
        label: "Backup Power",
        critical: false,
        requireConfirmation: false,
        description: "Controls backup power system",
      },
    ],
    allowScheduling: true,
    lockable: true,
    groupControl: true,
  },
}) => {
  const [switchStates, setSwitchStates] = useState(
    config.switches.reduce((acc, sw) => ({ ...acc, [sw.id]: false }), {}),
  )
  const [isConnected, setIsConnected] = useState(true)
  const [isLocked, setIsLocked] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingSwitch, setPendingSwitch] = useState(null)
  const [pendingState, setPendingState] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [actionHistory, setActionHistory] = useState([])
  const [safetyMode, setSafetyMode] = useState(true)
  const [groupMode, setGroupMode] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [scheduledActions, setScheduledActions] = useState([])
  const [showScheduler, setShowScheduler] = useState(false)
  const [isOn, setIsOn] = useState(false)
  const [switchCount, setSwitchCount] = useState(0)
  const [lastToggled, setLastToggled] = useState(null)

  // Simulate device connection and status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(Math.random() > 0.05) // 95% uptime
      setLastUpdate(new Date())
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const addToHistory = (switchId, newState, method = "manual") => {
    const switchConfig = config.switches.find((sw) => sw.id === switchId)
    const entry = {
      id: Date.now(),
      timestamp: new Date(),
      switchId,
      switchLabel: switchConfig?.label || switchId,
      previousState: switchStates[switchId],
      newState,
      method, // manual, scheduled, group
      user: "Operator",
      success: true,
    }
    setActionHistory((prev) => [entry, ...prev.slice(0, 19)]) // Keep last 20 entries
  }

  const handleSwitchChange = (switchId, newState) => {
    if (isLocked || !isConnected) return

    const switchConfig = config.switches.find((sw) => sw.id === switchId)

    // Check if confirmation is required
    if (switchConfig?.requireConfirmation || (safetyMode && switchConfig?.critical)) {
      setPendingSwitch(switchConfig)
      setPendingState(newState)
      setShowConfirmDialog(true)
      return
    }

    executeSwitch(switchId, newState)
  }

  const executeSwitch = (switchId, newState, method = "manual") => {
    setSwitchStates((prev) => ({
      ...prev,
      [switchId]: newState,
    }))

    addToHistory(switchId, newState, method)
  }

  const handleConfirmSwitch = () => {
    if (pendingSwitch) {
      executeSwitch(pendingSwitch.id, pendingState)
      setShowConfirmDialog(false)
      setPendingSwitch(null)
      setPendingState(false)
    }
  }

  const handleGroupControl = (newState) => {
    if (isLocked || !isConnected) return

    config.switches.forEach((switchConfig) => {
      if (!switchConfig.critical || !safetyMode) {
        executeSwitch(switchConfig.id, newState, "group")
      }
    })
  }

  const getActiveSwitchCount = () => {
    return Object.values(switchStates).filter((state) => state).length
  }

  const getTotalPowerConsumption = () => {
    // Simulate power consumption calculation
    const activeSwitches = getActiveSwitchCount()
    return activeSwitches * 150 + Math.random() * 50 // Watts
  }

  const getSwitchIcon = (switchConfig) => {
    const isActive = switchStates[switchConfig.id]

    if (switchConfig.id.includes("power")) {
      return <Power color={isActive ? "success" : "disabled"} />
    } else if (switchConfig.id.includes("alarm")) {
      return <Security color={isActive ? "error" : "disabled"} />
    } else if (switchConfig.id.includes("fan") || switchConfig.id.includes("cooling")) {
      return <Schedule color={isActive ? "primary" : "disabled"} />
    }

    return <Power color={isActive ? "success" : "disabled"} />
  }

  const getSystemStatus = () => {
    const activeCount = getActiveSwitchCount()
    const totalCount = config.switches.length

    if (!isConnected) return { status: "offline", color: "error" }
    if (activeCount === 0) return { status: "standby", color: "default" }
    if (activeCount === totalCount) return { status: "full operation", color: "success" }
    return { status: "partial operation", color: "warning" }
  }

  const systemStatus = getSystemStatus()

  const handleMainSwitchChange = (event) => {
    const newState = event.target.checked
    setIsOn(newState)
    setSwitchCount((prev) => prev + 1)
    setLastToggled(new Date())
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
            <Chip icon={<Info />} label={systemStatus.status.toUpperCase()} color={systemStatus.color} size="small" />
            <Chip
              icon={isConnected ? <CheckCircle /> : <Error />}
              label={isConnected ? "ONLINE" : "OFFLINE"}
              color={isConnected ? "success" : "error"}
              size="small"
            />
            {isLocked && <Chip icon={<Lock />} label="LOCKED" color="warning" size="small" />}
          </Box>
        </Box>

        {/* Main Switch */}
        <Box my={4}>
          <FormControlLabel
            control={<Switch checked={isOn} onChange={handleMainSwitchChange} size="large" color="primary" />}
            label={<Typography variant="h6">{config.switchLabel}</Typography>}
            labelPlacement="top"
          />
        </Box>

        {/* Status */}
        <Box display="flex" justifyContent="center" gap={1} mb={2}>
          <Chip label={isOn ? "ON" : "OFF"} color={isOn ? "success" : "default"} size="small" />
          <Chip label={`Toggles: ${switchCount}`} color="primary" size="small" />
        </Box>

        {/* Last Toggled */}
        {lastToggled && (
          <Typography variant="body2" color="text.secondary">
            Last toggled: {lastToggled.toLocaleTimeString()}
          </Typography>
        )}

        {/* System Overview */}
        <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: "background.default" }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                Active Switches
              </Typography>
              <Typography variant="h6" color="primary">
                {getActiveSwitchCount()}/{config.switches.length}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                Power Draw
              </Typography>
              <Typography variant="h6" color="primary">
                {getTotalPowerConsumption().toFixed(0)}W
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                System Status
              </Typography>
              <Typography variant="h6" color={systemStatus.color}>
                {systemStatus.status}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Switch Controls */}
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Individual Controls
          </Typography>
          <List dense>
            {config.switches.map((switchConfig) => (
              <ListItem key={switchConfig.id} divider>
                <Box display="flex" alignItems="center" mr={2}>
                  {getSwitchIcon(switchConfig)}
                </Box>
                <ListItemText primary={switchConfig.label} secondary={switchConfig.description} />
                <ListItemSecondaryAction>
                  <Box display="flex" alignItems="center" gap={1}>
                    {switchConfig.critical && (
                      <Tooltip title="Critical System">
                        <Warning color="warning" fontSize="small" />
                      </Tooltip>
                    )}
                    <Switch
                      checked={switchStates[switchConfig.id]}
                      onChange={(e) => handleSwitchChange(switchConfig.id, e.target.checked)}
                      disabled={isLocked || !isConnected}
                      color={switchConfig.critical ? "warning" : "primary"}
                    />
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Group Controls */}
        {config.groupControl && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Group Controls
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="success"
                  onClick={() => handleGroupControl(true)}
                  disabled={isLocked || !isConnected}
                  size="small"
                >
                  All ON
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  onClick={() => handleGroupControl(false)}
                  disabled={isLocked || !isConnected}
                  size="small"
                >
                  All OFF
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Safety Controls */}
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Safety & Security
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
                checked={groupMode}
                onChange={(e) => setGroupMode(e.target.checked)}
                disabled={isLocked || !isConnected}
              />
            }
            label="Group Mode"
          />
        </Box>

        {/* Device Information */}
        <Divider sx={{ my: 2 }} />
        <Box>
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
            Confirm Switch Action
          </Box>
        </DialogTitle>
        <DialogContent>
          {pendingSwitch && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                {pendingSwitch.critical
                  ? "This is a critical system component. Changing its state may affect system operation."
                  : "Please confirm this switch action."}
              </Alert>
              <Typography>
                Switch: <strong>{pendingSwitch.label}</strong>
              </Typography>
              <Typography>
                Action: <strong>Turn {pendingState ? "ON" : "OFF"}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pendingSwitch.description}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmSwitch} color={pendingState ? "success" : "error"} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="md" fullWidth>
        <DialogTitle>Switch Control Settings & History</DialogTitle>
        <DialogContent>
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Switch History
            </Typography>
            {actionHistory.length === 0 ? (
              <Typography color="text.secondary">No recent activity</Typography>
            ) : (
              actionHistory.map((entry) => (
                <Box key={entry.id} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                  <Box>
                    <Typography variant="body2">
                      {entry.switchLabel}: {entry.previousState ? "ON" : "OFF"} → {entry.newState ? "ON" : "OFF"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {entry.timestamp.toLocaleString()} - {entry.method} - {entry.user}
                    </Typography>
                  </Box>
                  <Chip
                    label={entry.success ? "Success" : "Failed"}
                    color={entry.success ? "success" : "error"}
                    size="small"
                  />
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
              Lockable: {config.lockable ? "Yes" : "No"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Group Control: {config.groupControl ? "Yes" : "No"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Scheduling: {config.allowScheduling ? "Yes" : "No"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Switches: {config.switches.length}
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

export default SwitchControlWidget
