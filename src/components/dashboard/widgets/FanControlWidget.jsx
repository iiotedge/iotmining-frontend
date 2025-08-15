"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Card, CardContent, Typography, Button, Slider, Switch, Chip, Grid, Box, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert, Badge, MenuItem, Select, InputLabel, FormControl, Tooltip
} from "@mui/material"
import {
  PlayArrow, Stop, Settings, Warning, Error, CheckCircle, Thermostat, ElectricBolt, Schedule, Build,
  Add, Delete, Tune, Percent, RotateRight, Opacity, Star, StarBorder, ArrowUpward, ArrowDownward
} from "@mui/icons-material"
import { useTheme } from "../../theme/ThemeProvider"
import "../../../styles/widget/fan-control-widget.css"

const DEFAULT_SPEED_UNITS = [
  { value: "%", label: "Percentage (%)", icon: <Percent fontSize="small" /> },
  { value: "RPM", label: "Rotation (RPM)", icon: <RotateRight fontSize="small" /> },
]
const DEFAULT_TEMP_UNITS = [
  { value: "°C", label: "Celsius (°C)", icon: <Thermostat fontSize="small" /> },
  { value: "°F", label: "Fahrenheit (°F)", icon: <Thermostat fontSize="small" /> },
  { value: "K", label: "Kelvin (K)", icon: <Opacity fontSize="small" /> },
]

const IMPORTANT_COLOR = "#bb9500"
const TREND_UP_COLOR = "#539150"
const TREND_DOWN_COLOR = "#bc3d3d"

const safe = (v, suffix = "") =>
  v === undefined || v === null || Number.isNaN(v) ? <span title="No data">--</span> : v + suffix

function buildFanCommandPayload(fanId, command, value) {
  return { fanId, command, ...(value !== undefined ? { value } : {}), ts: Date.now() }
}
function getTrend(prev, curr) {
  if (typeof prev !== "number" || typeof curr !== "number") return { trend: 0, delta: 0 }
  const trend = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0
  const delta = curr - prev
  return { trend, delta }
}

// Compare two fan lists shallowly by id, speed, status (to avoid infinite loops)
function fansAreEqual(a = [], b = []) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].id !== b[i].id ||
      a[i].speed !== b[i].speed ||
      a[i].status !== b[i].status
    ) return false
  }
  return true
}

// Extract system-level info from data prop
function extractSystemAndFanData(data) {
  if (!data || typeof data !== "object") {
    return {
      mode: "--",
      total_fans: 0,
      operating_fans: 0,
      alarms: [],
      fan_fail_alarm: false,
      standby_fan_on: false,
    }
  }

  return {
    mode: data.mode ?? "--",
    total_fans: data.total_fans ?? 0,
    operating_fans: data.operating_fans ?? 0,
    alarms: data.alarms ?? [],
    fan_fail_alarm: data.fan_fail_alarm ?? false,
    standby_fan_on: data.standby_fan_on ?? false,
  }
}

const FanControlWidget = ({
  data = {},
  fans = [], // Explicit fans array passed as prop
  onConfigChange,
  onControlChange,
  sendMqttCommand,

  showStats = false,
  showAlarms = false,
  showAddFan = false,
  showDeleteFan = false,
  showEditFan = false,
  showFanConfigDialog = false,
  showAddFanDialog = false,
  showStartStop = false,
  showAllControl = false,
  showSpeedSet = false,
  showReset = false,
  showAutoMode = false,
  enableImportantFan = true,

  showTemperature = false,
  showPower = false,
  showRuntime = false,
  showMaintenance = false,

  minSpeed = 0,
  maxSpeedPercent = 100,
  maxSpeedRpm = 1800,
  speedUnits = DEFAULT_SPEED_UNITS,
  tempUnits = DEFAULT_TEMP_UNITS,

  ...props
}) => {
  const { isDarkMode, primaryColor } = useTheme()

  // Extract system-level info from data prop
  const {
    mode,
    total_fans,
    operating_fans,
    alarms,
    fan_fail_alarm,
    standby_fan_on,
  } = extractSystemAndFanData(data)

  // Use fans prop as the primary fan list
  const allFans = fans || []
  console.log("Fans prop", allFans)

  // Local state for fan list and related UI states
  const [fanList, setFanList] = useState(allFans)
  const [selectedFan, setSelectedFan] = useState(null)
  const [addFanDialog, setAddFanDialog] = useState(false)
  const [newFanName, setNewFanName] = useState("")
  const [importantMap, setImportantMap] = useState({})
  const [speedHistory, setSpeedHistory] = useState({})

  // Ref to previous fans for comparison to avoid infinite update loops
  const prevFansRef = useRef([])

  // Update fanList if fans prop changes (avoid infinite loops)
  useEffect(() => {
    if (!fansAreEqual(prevFansRef.current, allFans)) {
      setFanList(allFans)
      prevFansRef.current = allFans

      // Update important map for star toggles
      const newMap = {}
      allFans.forEach(fan => { if (fan.important) newMap[fan.id] = true })
      setImportantMap(newMap)
    }
  }, [allFans])

  // Live update fanList from data.fans_status (merge live data)
  useEffect(() => {
    if (data && data.fans_status) {
      const fansStatusKeys = Object.keys(data.fans_status)
      if (fansStatusKeys.length === 0) {
        // fans_status is empty object: mark all fans as stopped/off
        setFanList(currentList => 
          currentList.map(fan => ({
            ...fan,
            status: "off",
            speed: 0,
          }))
        )
        return
      }

      setFanList(currentList => {
        if (currentList.length === 0) return currentList

        const updatedFans = currentList.map(fan => {
          const live = data.fans_status[fan.id]
          if (live) {
            return {
              ...fan,
              speed: live.speed ?? fan.speed,
              status: live.status ?? fan.status,
              temperature: live.temperature ?? fan.temperature,
              power: live.power ?? fan.power,
              runtime: live.runtime ?? fan.runtime,
              alarms: live.alarms ?? fan.alarms,
              autoMode: live.autoMode ?? fan.autoMode,
            }
          }
          return fan
        })

        if (!fansAreEqual(currentList, updatedFans)) {
          return updatedFans
        }
        return currentList
      })
    }
  }, [data.fans_status])

  // Track speed history for trend display
  useEffect(() => {
    setSpeedHistory(prevHist => {
      const updated = { ...prevHist }
      fanList.forEach(fan => {
        const curr = fan.speed ?? 0
        if (!updated[fan.id]) updated[fan.id] = [curr, curr]
        else if (updated[fan.id][1] !== curr) updated[fan.id] = [updated[fan.id][1], curr]
      })
      return updated
    })
  }, [fanList])

  // Command handlers
  const addNewFan = () => {
    if (!newFanName.trim()) return
    const newFan = {
      id: `fan${Date.now()}`,
      name: newFanName,
      status: "stopped",
      speed: 0,
      targetSpeed: 0,
      speedUnit: "%",
      temperature: 25,
      tempUnit: "°C",
      power: 0,
      runtime: 0,
      maintenanceHours: 8760,
      lastMaintenance: new Date().toISOString().split("T")[0],
      autoMode: false,
      alarms: [],
      important: false,
    }
    setFanList(prev => [...prev, newFan])
    setImportantMap(prev => ({ ...prev, [newFan.id]: false }))
    setNewFanName("")
    setAddFanDialog(false)
    if (onConfigChange) onConfigChange([...fanList, newFan])
  }

  const deleteFan = (fanId) => {
    setFanList(prev => prev.filter(f => f.id !== fanId))
    setImportantMap(prev => {
      const next = { ...prev }
      delete next[fanId]
      return next
    })
    setSpeedHistory(prev => {
      const next = { ...prev }
      delete next[fanId]
      return next
    })
    if (onConfigChange) onConfigChange(fanList.filter(f => f.id !== fanId))
  }

  const handleToggleImportant = (fanId) => {
    setImportantMap(prev => {
      const updated = { ...prev, [fanId]: !prev[fanId] }
      setFanList(list =>
        list.map(fan => fan.id === fanId ? { ...fan, important: !prev[fanId] } : fan)
      )
      return updated
    })
  }

  const handleFanControl = (fanId, action) => {
    if (onControlChange) onControlChange(fanId, "action", action)
    if (typeof sendMqttCommand === "function") {
      sendMqttCommand(buildFanCommandPayload(fanId, action))
    }
  }
  const handleSpeedChange = (fanId, value) => {
    if (onControlChange) onControlChange(fanId, "targetSpeed", value)
    if (typeof sendMqttCommand === "function") {
      sendMqttCommand(buildFanCommandPayload(fanId, "set_speed", value))
    }
  }
  const handleAutoModeToggle = (fanId, current) => {
    if (onControlChange) onControlChange(fanId, "autoMode", !current)
    if (typeof sendMqttCommand === "function") {
      sendMqttCommand(buildFanCommandPayload(fanId, "auto_mode", !current))
    }
  }
  const handleAllFans = (action) => {
    fanList.forEach(fan => handleFanControl(fan.id, action))
  }

  // UI colors
  const themeColors = {
    light: {
      bg: "#fff",
      bgElevated: "#fafbfc",
      text: "#222",
      textSecondary: "#444",
      surface: "#f6f8fa",
      accent: "#1667ff",
      ok: "#4caf50",
      warn: "#ff9800",
      err: "#f44336",
    },
    dark: {
      bg: "#141414",
      bgElevated: "#000000",
      text: "#fff",
      textSecondary: "#bdbdbd",
      surface: "#181818",
      accent: "var(--primary-color, #1667ff)",
      ok: "#4caf50",
      warn: "#ff9800",
      err: "#f44336",
    }
  }
  const colors = themeColors[isDarkMode ? "dark" : "light"]

  // Derived values
  const runningFans = fanList.filter(fan => (fan.status === "on" || fan.status === true)).length
  const totalAlarms = fanList.reduce((sum, fan) => sum + (fan.alarms?.length || 0), 0) + (alarms?.length || 0)

  return (
    <Card
      className={`fan-control-widget ${isDarkMode ? "fan-widget-dark" : ""}`}
      style={{
        color: colors.text,
        minWidth: 340,
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
      elevation={0}
    >
      <CardContent style={{ background: colors.bg }}>
        {/* System summary */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography variant="h6" sx={{
              color: primaryColor, fontWeight: 700, letterSpacing: 0.2
            }}>
              {props.title || "Fans"}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 500 }}>
              Mode: <b>{mode}</b>
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary, display: "block" }}>
              Fans Running: <b style={{ color: runningFans === total_fans ? "#388e3c" : runningFans > 0 ? "#fa8c16" : "#d32f2f" }}>
                {operating_fans}/{total_fans}
              </b>
              {fan_fail_alarm && <Chip color="error" size="small" label="Fan Fail!" sx={{ ml: 2 }} />}
              {standby_fan_on && <Chip color="info" size="small" label="Standby Fan On" sx={{ ml: 2 }} />}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            {showStats && (
              <Chip label={`${runningFans}/${total_fans} Running`} color={runningFans > 0 ? "success" : "default"} size="small" />
            )}
            {showAlarms && totalAlarms > 0 && (
              <Badge badgeContent={totalAlarms} color="error">
                <Warning color="warning" />
              </Badge>
            )}
            {showAddFan && (
              <IconButton size="small" onClick={() => setAddFanDialog(true)} style={{ color: primaryColor }}>
                <Add />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* System alarms */}
        {alarms && alarms.length > 0 && (
          <Box mb={1}>
            {alarms.map((alarm, idx) =>
              <Alert key={idx} severity={alarm.type || "warning"} style={{ marginBottom: 4 }}>
                {alarm.message}
                {alarm.timestamp && <span style={{ float: "right", color: "#999", fontSize: 11 }}>{alarm.timestamp}</span>}
              </Alert>
            )}
          </Box>
        )}

        {/* All control buttons */}
        {showAllControl && (
          <Box mb={2} display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="outlined"
              sx={{
                borderColor: "#539150",
                color: "#539150",
              }}
              startIcon={<PlayArrow />}
              size="small"
              onClick={() => handleAllFans("start")}
            >
              Start All
            </Button>
            <Button
              variant="outlined"
              sx={{
                borderColor: "#bc3d3d",
                color: "#bc3d3d",
              }}
              startIcon={<Stop />}
              size="small"
              onClick={() => handleAllFans("stop")}
            >
              Stop All
            </Button>
          </Box>
        )}

        {/* Fans grid */}
        <Grid container spacing={1} alignItems="stretch" sx={{ flexGrow: 1 }}> 
          {fanList.map(fan => {
            const isSpinning = (fan.status === "on" || fan.status === true) && fan.speed > 0
            const important = !!(fan.important || importantMap[fan.id])
            const [prevSpeed, currSpeed] = speedHistory[fan.id] || [fan.speed, fan.speed]
            const { trend, delta } = getTrend(prevSpeed, currSpeed)
            const speedUnit = fan.speed_unit || fan.speedUnit || "%"
            const tempUnit = fan.temp_unit || fan.tempUnit || "°C"

            const status = fan.status === true ? "Running" : fan.status === false ? "Stopped" : (typeof fan.status === "string" ? fan.status.charAt(0).toUpperCase() + fan.status.slice(1) : "Unknown")
            const showControls = showStartStop || showAutoMode || showReset || showSpeedSet

            return (
              <Grid
                item
                xs={3} // On extra-small screens (mobile), take 12 of 12 columns = 100% width (1 fan per row)
                sm={6}  // On small screens (tablet), take 6 of 12 columns = 50% width (2 fans per row)
                md={6}  // On medium screens, take 6 of 12 columns = 50% width (2 fans per row)
                lg={4}  // On large screens, take 4 of 12 columns = 33.3% width (3 fans per row, common for dashboards)
                xl={3}  // On extra-large screens, take 3 of 12 columns = 25% width (4 fans per row)
                key={fan.id}
                sx={{ height: '100%' }} 
              >
                <Card
                  variant="outlined"
                  className={`fan-card ${status.toLowerCase()} ${isSpinning ? "spinning" : ""} ${important ? "important-fan" : ""} ${isDarkMode ? "fan-card-dark" : ""}`}
                  style={{
                    background: colors.bgElevated,
                    color: colors.text,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "stretch",
                  }}
                >
                  <CardContent style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* Header */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {enableImportantFan && (
                          <Tooltip title={important ? "Important Fan" : "Mark as Important"}>
                            <IconButton
                              size="small"
                              aria-label={important ? "Unmark important" : "Mark important"}
                              onClick={() => handleToggleImportant(fan.id)}
                              style={{ color: important ? IMPORTANT_COLOR : "#bbb", marginRight: 2 }}>
                              {important ? <Star /> : <StarBorder />}
                            </IconButton>
                          </Tooltip>
                        )}
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.text, maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {fan.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                            Fan ID: <b>{fan.id}</b>
                            {" | Status: "}
                            <b style={{
                              color:
                                status === "Running"
                                  ? "#2e7d32"
                                  : status === "Stopped"
                                    ? "#d32f2f"
                                    : status === "Failed"
                                      ? "#f44336"
                                      : colors.textSecondary,
                            }}>
                              {status}
                            </b>
                            {important && (
                              <span style={{
                                background: IMPORTANT_COLOR,
                                color: "#fff",
                                fontWeight: 600,
                                borderRadius: 6,
                                fontSize: 11,
                                padding: "2px 7px",
                                marginLeft: 7
                              }}>
                                Important
                              </span>
                            )}
                          </Typography>
                        </Box>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        {status === "Running"
                          ? <CheckCircle style={{ color: "#4caf50" }} />
                          : status === "Failed"
                            ? <Error style={{ color: "#f44336" }} />
                            : <Stop style={{ color: colors.textSecondary }} />}
                        {showEditFan && (
                          <IconButton size="small" onClick={() => setSelectedFan(fan)} style={{ color: primaryColor }}>
                            <Settings />
                          </IconButton>
                        )}
                        {showDeleteFan && (
                          <IconButton size="small" onClick={() => deleteFan(fan.id)} color="error">
                            <Delete />
                          </IconButton>
                        )}
                      </Box>
                    </Box>

                    {/* Trend/RPM info */}
                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text }}>
                        Live Speed: {safe(fan.speed, " " + speedUnit)}
                      </Typography>
                      {trend !== 0 && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {trend > 0 ? (
                            <span style={{ color: TREND_UP_COLOR, fontWeight: 600 }}>
                              <ArrowUpward fontSize="small" /> +{trend.toFixed(1)}%
                            </span>
                          ) : (
                            <span style={{ color: TREND_DOWN_COLOR, fontWeight: 600 }}>
                              <ArrowDownward fontSize="small" /> {trend.toFixed(1)}%
                            </span>
                          )}
                        </Box>
                      )}
                      {delta !== 0 && (
                        <Typography variant="caption" sx={{ color: "#aaa" }}>
                          Δ {delta > 0 ? "+" : ""}{delta.toFixed(1)} {speedUnit}
                        </Typography>
                      )}
                    </Box>

                    {/* Fan Animation */}
                    <Box display="flex" justifyContent="center" mb={showControls ? 2 : 1}>
                      <div
                        className={`fan-blade ${isSpinning ? "spinning" : ""} ${isDarkMode ? "blade-dark" : ""}`}
                        style={{ animationDuration: isSpinning ? `${2 - Math.min(1.99, fan.speed / 50)}s` : "0s" }}
                      >
                        <div className="fan-center"></div>
                        <div className="blade" style={{ transform: "rotate(0deg)" }}></div>
                        <div className="blade" style={{ transform: "rotate(90deg)" }}></div>
                        <div className="blade" style={{ transform: "rotate(180deg)" }}></div>
                        <div className="blade" style={{ transform: "rotate(270deg)" }}></div>
                      </div>
                    </Box>

                    {/* Controls */}
                    {showControls && (
                      <>
                        {(showStartStop || showAutoMode || showReset) && (
                          <Box mb={2}>
                            {showStartStop && (
                              <Box display="flex" gap={1} mb={1}>
                                <Button
                                  size="small"
                                  startIcon={<PlayArrow />}
                                  onClick={() => handleFanControl(fan.id, "start")}
                                  disabled={status === "Failed"}
                                  variant="outlined"
                                  color="success"
                                >
                                  Start
                                </Button>
                                <Button
                                  size="small"
                                  startIcon={<Stop />}
                                  onClick={() => handleFanControl(fan.id, "stop")}
                                  variant="outlined"
                                  color="error"
                                >
                                  Stop
                                </Button>
                                {showReset && status === "Failed" && (
                                  <Button size="small" onClick={() => handleFanControl(fan.id, "reset")} variant="outlined">
                                    Reset
                                  </Button>
                                )}
                              </Box>
                            )}
                            {showAutoMode && (
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Typography variant="caption" style={{ color: colors.textSecondary }}>
                                  Auto Mode:
                                </Typography>
                                <Switch size="small" checked={fan.autoMode} onChange={() => handleAutoModeToggle(fan.id, fan.autoMode)} />
                              </Box>
                            )}
                          </Box>
                        )}
                        {showSpeedSet && (
                          <Box mb={2}>
                            <Typography variant="caption" gutterBottom style={{ color: colors.textSecondary }}>
                              Speed: {safe(fan.speed, " " + speedUnit)}
                            </Typography>
                            <Slider
                              value={Number.isFinite(fan.speed) ? fan.speed : 0}
                              onChange={(e, value) => handleSpeedChange(fan.id, value)}
                              disabled={status === "Failed"}
                              min={minSpeed}
                              max={speedUnit === "RPM" ? maxSpeedRpm : maxSpeedPercent}
                              size="small"
                              sx={{
                                color: primaryColor,
                                "& .MuiSlider-rail": { backgroundColor: isDarkMode ? "#222" : "#eee" },
                              }}
                            />
                          </Box>
                        )}
                      </>
                    )}

                    {/* Details grid */}
                    <Grid container spacing={1} sx={{ mt: 1 }}>
                      {(showTemperature || fan.temperature !== undefined) && (
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Thermostat fontSize="small" />
                            <Typography variant="caption" style={{ color: colors.textSecondary }}>
                              {safe(fan.temperature, " " + tempUnit)}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      {(showPower || fan.power !== undefined) && (
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <ElectricBolt fontSize="small" />
                            <Typography variant="caption" style={{ color: colors.textSecondary }}>
                              {safe(fan.power, " W")}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      {(showRuntime || fan.runtime !== undefined) && (
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Schedule fontSize="small" />
                            <Typography variant="caption" style={{ color: colors.textSecondary }}>
                              {safe((fan.runtime ?? 0).toFixed(1), "h")}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      {(showMaintenance || fan.maintenanceHours !== undefined) && (
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Build fontSize="small" />
                            <Typography variant="caption" style={{ color: colors.textSecondary }}>
                              {safe(Math.max(0, (fan.maintenanceHours ?? 0) - (fan.runtime ?? 0)).toFixed(0), "h")}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>

                    {showAlarms && fan.alarms && fan.alarms.length > 0 && (
                      <Box mt={1}>
                        {fan.alarms.map((alarm, i) => (
                          <Alert key={i} severity={alarm.type || "error"} size="small" style={{ marginBottom: 4 }}>
                            {alarm.message}
                            {alarm.timestamp && (
                              <span style={{ float: "right", color: "#999", fontSize: 11 }}>{alarm.timestamp}</span>
                            )}
                          </Alert>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>

        {/* Add Fan Dialog */}
        {showAddFanDialog && (
          <Dialog open={addFanDialog} onClose={() => setAddFanDialog(false)}>
            <DialogTitle style={{ background: colors.surface, color: colors.text }}>Add New Fan</DialogTitle>
            <DialogContent style={{ background: colors.bg, color: colors.text }}>
              <TextField
                autoFocus
                margin="dense"
                label="Fan Name"
                fullWidth
                variant="outlined"
                value={newFanName}
                onChange={(e) => setNewFanName(e.target.value)}
              />
            </DialogContent>
            <DialogActions style={{ background: colors.surface }}>
              <Button onClick={() => setAddFanDialog(false)}>Cancel</Button>
              <Button
                onClick={addNewFan}
                variant="contained"
                style={{ background: primaryColor, color: "#fff" }}
              >
                Add Fan
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Fan Config Dialog */}
        {showFanConfigDialog && selectedFan && (
          <Dialog open={!!selectedFan} onClose={() => setSelectedFan(null)} maxWidth="sm" fullWidth>
            <DialogTitle style={{ background: colors.surface, color: colors.text }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Tune fontSize="small" />
                Configure {selectedFan.name}
              </Box>
            </DialogTitle>
            <DialogContent style={{ background: colors.bg, color: colors.text }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Fan Name"
                    fullWidth
                    value={selectedFan.name}
                    onChange={(e) => setSelectedFan({ ...selectedFan, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Maintenance Hours"
                    type="number"
                    fullWidth
                    value={selectedFan.maintenanceHours}
                    onChange={(e) =>
                      setSelectedFan({ ...selectedFan, maintenanceHours: Number.parseInt(e.target.value) })
                    }
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Last Maintenance"
                    type="date"
                    fullWidth
                    value={selectedFan.lastMaintenance}
                    onChange={(e) => setSelectedFan({ ...selectedFan, lastMaintenance: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Speed Unit</InputLabel>
                    <Select
                      value={selectedFan.speedUnit}
                      label="Speed Unit"
                      onChange={(e) => setSelectedFan({ ...selectedFan, speedUnit: e.target.value })}
                    >
                      {(speedUnits || DEFAULT_SPEED_UNITS).map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          <Box display="flex" alignItems="center" gap={1}>
                            {opt.icon}
                            {opt.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Temperature Unit</InputLabel>
                    <Select
                      value={selectedFan.tempUnit}
                      label="Temperature Unit"
                      onChange={(e) => setSelectedFan({ ...selectedFan, tempUnit: e.target.value })}
                    >
                      {(tempUnits || DEFAULT_TEMP_UNITS).map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          <Box display="flex" alignItems="center" gap={1}>
                            {opt.icon}
                            {opt.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions style={{ background: colors.surface }}>
              <Button onClick={() => setSelectedFan(null)} style={{ color: primaryColor }}>
                Close
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}

export default FanControlWidget

// "use client"

// import React, { useState, useEffect, useRef } from "react"
// import {
//   Card, CardContent, Typography, Button, Slider, Switch, Chip, Grid, Box, IconButton, Dialog, DialogTitle,
//   DialogContent, DialogActions, TextField, Alert, Badge, MenuItem, Select, InputLabel, FormControl, Tooltip
// } from "@mui/material"
// import {
//   PlayArrow, Stop, Settings, Warning, Error, CheckCircle, Thermostat, ElectricBolt, Schedule, Build,
//   Add, Delete, Tune, Percent, RotateRight, Opacity, Star, StarBorder, ArrowUpward, ArrowDownward
// } from "@mui/icons-material"
// import { useTheme } from "../../theme/ThemeProvider"
// import "../../../styles/fan-control-widget.css"

// const DEFAULT_SPEED_UNITS = [
//   { value: "%", label: "Percentage (%)", icon: <Percent fontSize="small" /> },
//   { value: "RPM", label: "Rotation (RPM)", icon: <RotateRight fontSize="small" /> },
// ]
// const DEFAULT_TEMP_UNITS = [
//   { value: "°C", label: "Celsius (°C)", icon: <Thermostat fontSize="small" /> },
//   { value: "°F", label: "Fahrenheit (°F)", icon: <Thermostat fontSize="small" /> },
//   { value: "K", label: "Kelvin (K)", icon: <Opacity fontSize="small" /> },
// ]

// const IMPORTANT_COLOR = "#bb9500"
// const TREND_UP_COLOR = "#539150"
// const TREND_DOWN_COLOR = "#bc3d3d"

// const safe = (v, suffix = "") =>
//   v === undefined || v === null || Number.isNaN(v) ? <span title="No data">--</span> : v + suffix

// function buildFanCommandPayload(fanId, command, value) {
//   return { fanId, command, ...(value !== undefined ? { value } : {}), ts: Date.now() }
// }
// function getTrend(prev, curr) {
//   if (typeof prev !== "number" || typeof curr !== "number") return { trend: 0, delta: 0 }
//   const trend = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0
//   const delta = curr - prev
//   return { trend, delta }
// }

// // Compare two fan lists shallowly by id, speed, status (to avoid infinite loops)
// function fansAreEqual(a = [], b = []) {
//   if (a.length !== b.length) return false
//   for (let i = 0; i < a.length; i++) {
//     if (
//       a[i].id !== b[i].id ||
//       a[i].speed !== b[i].speed ||
//       a[i].status !== b[i].status
//     ) return false
//   }
//   return true
// }

// // Extract system-level info from data prop
// function extractSystemAndFanData(data) {
//   if (!data || typeof data !== "object") {
//     return {
//       mode: "--",
//       total_fans: 0,
//       operating_fans: 0,
//       alarms: [],
//       fan_fail_alarm: false,
//       standby_fan_on: false,
//     }
//   }

//   return {
//     mode: data.mode ?? "--",
//     total_fans: data.total_fans ?? 0,
//     operating_fans: data.operating_fans ?? 0,
//     alarms: data.alarms ?? [],
//     fan_fail_alarm: data.fan_fail_alarm ?? false,
//     standby_fan_on: data.standby_fan_on ?? false,
//   }
// }

// const FanControlWidget = ({
//   data = {},
//   fans = [], // Explicit fans array passed as prop
//   onConfigChange,
//   onControlChange,
//   sendMqttCommand,

//   showStats = false,
//   showAlarms = false,
//   showAddFan = false,
//   showDeleteFan = false,
//   showEditFan = false,
//   showFanConfigDialog = false,
//   showAddFanDialog = false,
//   showStartStop = false,
//   showAllControl = false,
//   showSpeedSet = false,
//   showReset = false,
//   showAutoMode = false,
//   enableImportantFan = true,

//   showTemperature = false,
//   showPower = false,
//   showRuntime = false,
//   showMaintenance = false,

//   minSpeed = 0,
//   maxSpeedPercent = 100,
//   maxSpeedRpm = 1800,
//   speedUnits = DEFAULT_SPEED_UNITS,
//   tempUnits = DEFAULT_TEMP_UNITS,

//   ...props
// }) => {
//   const { isDarkMode, primaryColor } = useTheme()

//   // Extract system-level info from data prop
//   const {
//     mode,
//     total_fans,
//     operating_fans,
//     alarms,
//     fan_fail_alarm,
//     standby_fan_on,
//   } = extractSystemAndFanData(data)

//   // Use fans prop as the primary fan list
//   const allFans = fans || []
//   // console.log("------------------------------__>", allFans)
//   // Local state for fan list and related UI states
//   const [fanList, setFanList] = useState(allFans)
//   const [selectedFan, setSelectedFan] = useState(null)
//   const [addFanDialog, setAddFanDialog] = useState(false)
//   const [newFanName, setNewFanName] = useState("")
//   const [importantMap, setImportantMap] = useState({})
//   const [speedHistory, setSpeedHistory] = useState({})

//   // Ref to previous fans for comparison to avoid infinite update loops
//   const prevFansRef = useRef([])

//   // Update fanList if fans prop changes (avoid infinite loops)
//   useEffect(() => {
//     if (!fansAreEqual(prevFansRef.current, allFans)) {
//       setFanList(allFans)
//       prevFansRef.current = allFans

//       // Update important map for star toggles
//       const newMap = {}
//       allFans.forEach(fan => { if (fan.important) newMap[fan.id] = true })
//       setImportantMap(newMap)
//     }
//   }, [allFans])

//   // Track speed history for trend display
//   useEffect(() => {
//     setSpeedHistory(prevHist => {
//       const updated = { ...prevHist }
//       fanList.forEach(fan => {
//         const curr = fan.speed ?? 0
//         if (!updated[fan.id]) updated[fan.id] = [curr, curr]
//         else if (updated[fan.id][1] !== curr) updated[fan.id] = [updated[fan.id][1], curr]
//       })
//       return updated
//     })
//   }, [fanList])

//   // Command handlers
//   const addNewFan = () => {
//     if (!newFanName.trim()) return
//     const newFan = {
//       id: `fan${Date.now()}`,
//       name: newFanName,
//       status: "stopped",
//       speed: 0,
//       targetSpeed: 0,
//       speedUnit: "%",
//       temperature: 25,
//       tempUnit: "°C",
//       power: 0,
//       runtime: 0,
//       maintenanceHours: 8760,
//       lastMaintenance: new Date().toISOString().split("T")[0],
//       autoMode: false,
//       alarms: [],
//       important: false,
//     }
//     setFanList(prev => [...prev, newFan])
//     setImportantMap(prev => ({ ...prev, [newFan.id]: false }))
//     setNewFanName("")
//     setAddFanDialog(false)
//     if (onConfigChange) onConfigChange([...fanList, newFan])
//   }

//   const deleteFan = (fanId) => {
//     setFanList(prev => prev.filter(f => f.id !== fanId))
//     setImportantMap(prev => {
//       const next = { ...prev }
//       delete next[fanId]
//       return next
//     })
//     setSpeedHistory(prev => {
//       const next = { ...prev }
//       delete next[fanId]
//       return next
//     })
//     if (onConfigChange) onConfigChange(fanList.filter(f => f.id !== fanId))
//   }

//   const handleToggleImportant = (fanId) => {
//     setImportantMap(prev => {
//       const updated = { ...prev, [fanId]: !prev[fanId] }
//       setFanList(list =>
//         list.map(fan => fan.id === fanId ? { ...fan, important: !prev[fanId] } : fan)
//       )
//       return updated
//     })
//   }

//   const handleFanControl = (fanId, action) => {
//     if (onControlChange) onControlChange(fanId, "action", action)
//     if (typeof sendMqttCommand === "function") {
//       sendMqttCommand(buildFanCommandPayload(fanId, action))
//     }
//   }
//   const handleSpeedChange = (fanId, value) => {
//     if (onControlChange) onControlChange(fanId, "targetSpeed", value)
//     if (typeof sendMqttCommand === "function") {
//       sendMqttCommand(buildFanCommandPayload(fanId, "set_speed", value))
//     }
//   }
//   const handleAutoModeToggle = (fanId, current) => {
//     if (onControlChange) onControlChange(fanId, "autoMode", !current)
//     if (typeof sendMqttCommand === "function") {
//       sendMqttCommand(buildFanCommandPayload(fanId, "auto_mode", !current))
//     }
//   }
//   const handleAllFans = (action) => {
//     fanList.forEach(fan => handleFanControl(fan.id, action))
//   }

//   // UI colors
//   const themeColors = {
//     light: {
//       bg: "#fff",
//       bgElevated: "#fafbfc",
//       text: "#222",
//       textSecondary: "#444",
//       surface: "#f6f8fa",
//       accent: "#1667ff",
//       ok: "#4caf50",
//       warn: "#ff9800",
//       err: "#f44336",
//     },
//     dark: {
//       bg: "#141414",
//       bgElevated: "#000000",
//       text: "#fff",
//       textSecondary: "#bdbdbd",
//       surface: "#181818",
//       accent: "var(--primary-color, #1667ff)",
//       ok: "#4caf50",
//       warn: "#ff9800",
//       err: "#f44336",
//     }
//   }
//   const colors = themeColors[isDarkMode ? "dark" : "light"]

//   // Derived values
//   const runningFans = allFans.filter(fan => (fan.status === "on" || fan.status === true)).length
//   const totalAlarms = allFans.reduce((sum, fan) => sum + (fan.alarms?.length || 0), 0) + (alarms?.length || 0)

//   return (
//     <Card
//       className={`fan-control-widget ${isDarkMode ? "fan-widget-dark" : ""}`}
//       style={{
//         color: colors.text,
//         minWidth: 340,
//         maxWidth: "100%",
//         boxSizing: "border-box",
//       }}
//       elevation={0}
//     >
//       <CardContent style={{ background: colors.bg }}>
//         {/* System summary */}
//         <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
//           <Box>
//             <Typography variant="h6" sx={{
//               color: primaryColor, fontWeight: 700, letterSpacing: 0.2
//             }}>
//               {props.title || "Fans"}
//             </Typography>
//             <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 500 }}>
//               Mode: <b>{mode}</b>
//             </Typography>
//             <Typography variant="caption" sx={{ color: colors.textSecondary, display: "block" }}>
//               Fans Running: <b style={{ color: runningFans === total_fans ? "#388e3c" : runningFans > 0 ? "#fa8c16" : "#d32f2f" }}>
//                 {operating_fans}/{total_fans}
//               </b>
//               {fan_fail_alarm && <Chip color="error" size="small" label="Fan Fail!" sx={{ ml: 2 }} />}
//               {standby_fan_on && <Chip color="info" size="small" label="Standby Fan On" sx={{ ml: 2 }} />}
//             </Typography>
//           </Box>
//           <Box display="flex" gap={1}>
//             {showStats && (
//               <Chip label={`${runningFans}/${total_fans} Running`} color={runningFans > 0 ? "success" : "default"} size="small" />
//             )}
//             {showAlarms && totalAlarms > 0 && (
//               <Badge badgeContent={totalAlarms} color="error">
//                 <Warning color="warning" />
//               </Badge>
//             )}
//             {showAddFan && (
//               <IconButton size="small" onClick={() => setAddFanDialog(true)} style={{ color: primaryColor }}>
//                 <Add />
//               </IconButton>
//             )}
//           </Box>
//         </Box>

//         {/* System alarms */}
//         {alarms && alarms.length > 0 && (
//           <Box mb={1}>
//             {alarms.map((alarm, idx) =>
//               <Alert key={idx} severity={alarm.type || "warning"} style={{ marginBottom: 4 }}>
//                 {alarm.message}
//                 {alarm.timestamp && <span style={{ float: "right", color: "#999", fontSize: 11 }}>{alarm.timestamp}</span>}
//               </Alert>
//             )}
//           </Box>
//         )}

//         {/* All control buttons */}
//         {showAllControl && (
//           <Box mb={2} display="flex" gap={2} flexWrap="wrap">
//             <Button
//               variant="outlined"
//               sx={{
//                 borderColor: "#539150",
//                 color: "#539150",
//               }}
//               startIcon={<PlayArrow />}
//               size="small"
//               onClick={() => handleAllFans("start")}
//             >
//               Start All
//             </Button>
//             <Button
//               variant="outlined"
//               sx={{
//                 borderColor: "#bc3d3d",
//                 color: "#bc3d3d",
//               }}
//               startIcon={<Stop />}
//               size="small"
//               onClick={() => handleAllFans("stop")}
//             >
//               Stop All
//             </Button>
//           </Box>
//         )}

//         {/* Fans grid */}
//         <Grid container spacing={2} alignItems="stretch">
//           {fanList.map(fan => {
//             const isSpinning = (fan.status === "on" || fan.status === true) && fan.speed > 0
//             const important = !!(fan.important || importantMap[fan.id])
//             const [prevSpeed, currSpeed] = speedHistory[fan.id] || [fan.speed, fan.speed]
//             const { trend, delta } = getTrend(prevSpeed, currSpeed)
//             const speedUnit = fan.speed_unit || fan.speedUnit || "%"
//             const tempUnit = fan.temp_unit || fan.tempUnit || "°C"

//             const status = fan.status === true ? "Running" : fan.status === false ? "Stopped" : (typeof fan.status === "string" ? fan.status.charAt(0).toUpperCase() + fan.status.slice(1) : "Unknown")
//             const showControls = showStartStop || showAutoMode || showReset || showSpeedSet

//             return (
//               <Grid item xs={12} sm={12} md={6} lg={6} xl={6} key={fan.id}>
//                 <Card
//                   variant="outlined"
//                   className={`fan-card ${status.toLowerCase()} ${isSpinning ? "spinning" : ""} ${important ? "important-fan" : ""} ${isDarkMode ? "fan-card-dark" : ""}`}
//                   style={{
//                     background: colors.bgElevated,
//                     color: colors.text,
//                     display: "flex",
//                     flexDirection: "column",
//                     justifyContent: "stretch",
//                   }}
//                 >
//                   <CardContent style={{ flex: 1, display: "flex", flexDirection: "column" }}>
//                     {/* Header */}
//                     <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
//                       <Box display="flex" alignItems="center" gap={1}>
//                         {enableImportantFan && (
//                           <Tooltip title={important ? "Important Fan" : "Mark as Important"}>
//                             <IconButton
//                               size="small"
//                               aria-label={important ? "Unmark important" : "Mark important"}
//                               onClick={() => handleToggleImportant(fan.id)}
//                               style={{ color: important ? IMPORTANT_COLOR : "#bbb", marginRight: 2 }}>
//                               {important ? <Star /> : <StarBorder />}
//                             </IconButton>
//                           </Tooltip>
//                         )}
//                         <Box>
//                           <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.text, maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
//                             {fan.name}
//                           </Typography>
//                           <Typography variant="caption" sx={{ color: colors.textSecondary }}>
//                             Fan ID: <b>{fan.id}</b>
//                             {" | Status: "}
//                             <b style={{
//                               color:
//                                 status === "Running"
//                                   ? "#2e7d32"
//                                   : status === "Stopped"
//                                     ? "#d32f2f"
//                                     : status === "Failed"
//                                       ? "#f44336"
//                                       : colors.textSecondary,
//                             }}>
//                               {status}
//                             </b>
//                             {important && (
//                               <span style={{
//                                 background: IMPORTANT_COLOR,
//                                 color: "#fff",
//                                 fontWeight: 600,
//                                 borderRadius: 6,
//                                 fontSize: 11,
//                                 padding: "2px 7px",
//                                 marginLeft: 7
//                               }}>
//                                 Important
//                               </span>
//                             )}
//                           </Typography>
//                         </Box>
//                       </Box>
//                       <Box display="flex" alignItems="center" gap={1}>
//                         {status === "Running"
//                           ? <CheckCircle style={{ color: "#4caf50" }} />
//                           : status === "Failed"
//                             ? <Error style={{ color: "#f44336" }} />
//                             : <Stop style={{ color: colors.textSecondary }} />}
//                         {showEditFan && (
//                           <IconButton size="small" onClick={() => setSelectedFan(fan)} style={{ color: primaryColor }}>
//                             <Settings />
//                           </IconButton>
//                         )}
//                         {showDeleteFan && (
//                           <IconButton size="small" onClick={() => deleteFan(fan.id)} color="error">
//                             <Delete />
//                           </IconButton>
//                         )}
//                       </Box>
//                     </Box>

//                     {/* Trend/RPM info */}
//                     <Box display="flex" alignItems="center" gap={2} mb={1}>
//                       <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text }}>
//                         Live Speed: {safe(fan.speed, " " + speedUnit)}
//                       </Typography>
//                       {trend !== 0 && (
//                         <Box display="flex" alignItems="center" gap={0.5}>
//                           {trend > 0 ? (
//                             <span style={{ color: TREND_UP_COLOR, fontWeight: 600 }}>
//                               <ArrowUpward fontSize="small" /> +{trend.toFixed(1)}%
//                             </span>
//                           ) : (
//                             <span style={{ color: TREND_DOWN_COLOR, fontWeight: 600 }}>
//                               <ArrowDownward fontSize="small" /> {trend.toFixed(1)}%
//                             </span>
//                           )}
//                         </Box>
//                       )}
//                       {delta !== 0 && (
//                         <Typography variant="caption" sx={{ color: "#aaa" }}>
//                           Δ {delta > 0 ? "+" : ""}{delta.toFixed(1)} {speedUnit}
//                         </Typography>
//                       )}
//                     </Box>

//                     {/* Fan Animation */}
//                     <Box display="flex" justifyContent="center" mb={showControls ? 2 : 1}>
//                       <div
//                         className={`fan-blade ${isSpinning ? "spinning" : ""} ${isDarkMode ? "blade-dark" : ""}`}
//                         style={{ animationDuration: isSpinning ? `${2 - Math.min(1.99, fan.speed / 50)}s` : "0s" }}
//                       >
//                         <div className="fan-center"></div>
//                         <div className="blade" style={{ transform: "rotate(0deg)" }}></div>
//                         <div className="blade" style={{ transform: "rotate(90deg)" }}></div>
//                         <div className="blade" style={{ transform: "rotate(180deg)" }}></div>
//                         <div className="blade" style={{ transform: "rotate(270deg)" }}></div>
//                       </div>
//                     </Box>

//                     {/* Controls */}
//                     {showControls && (
//                       <>
//                         {(showStartStop || showAutoMode || showReset) && (
//                           <Box mb={2}>
//                             {showStartStop && (
//                               <Box display="flex" gap={1} mb={1}>
//                                 <Button
//                                   size="small"
//                                   startIcon={<PlayArrow />}
//                                   onClick={() => handleFanControl(fan.id, "start")}
//                                   disabled={status === "Failed"}
//                                   variant="outlined"
//                                   color="success"
//                                 >
//                                   Start
//                                 </Button>
//                                 <Button
//                                   size="small"
//                                   startIcon={<Stop />}
//                                   onClick={() => handleFanControl(fan.id, "stop")}
//                                   variant="outlined"
//                                   color="error"
//                                 >
//                                   Stop
//                                 </Button>
//                                 {showReset && status === "Failed" && (
//                                   <Button size="small" onClick={() => handleFanControl(fan.id, "reset")} variant="outlined">
//                                     Reset
//                                   </Button>
//                                 )}
//                               </Box>
//                             )}
//                             {showAutoMode && (
//                               <Box display="flex" alignItems="center" gap={1} mb={1}>
//                                 <Typography variant="caption" style={{ color: colors.textSecondary }}>
//                                   Auto Mode:
//                                 </Typography>
//                                 <Switch size="small" checked={fan.autoMode} onChange={() => handleAutoModeToggle(fan.id, fan.autoMode)} />
//                               </Box>
//                             )}
//                           </Box>
//                         )}
//                         {showSpeedSet && (
//                           <Box mb={2}>
//                             <Typography variant="caption" gutterBottom style={{ color: colors.textSecondary }}>
//                               Speed: {safe(fan.speed, " " + speedUnit)}
//                             </Typography>
//                             <Slider
//                               value={Number.isFinite(fan.speed) ? fan.speed : 0}
//                               onChange={(e, value) => handleSpeedChange(fan.id, value)}
//                               disabled={status === "Failed"}
//                               min={minSpeed}
//                               max={speedUnit === "RPM" ? maxSpeedRpm : maxSpeedPercent}
//                               size="small"
//                               sx={{
//                                 color: primaryColor,
//                                 "& .MuiSlider-rail": { backgroundColor: isDarkMode ? "#222" : "#eee" },
//                               }}
//                             />
//                           </Box>
//                         )}
//                       </>
//                     )}

//                     {/* Details grid */}
//                     <Grid container spacing={1} sx={{ mt: 1 }}>
//                       {(showTemperature || fan.temperature !== undefined) && (
//                         <Grid item xs={6}>
//                           <Box display="flex" alignItems="center" gap={0.5}>
//                             <Thermostat fontSize="small" />
//                             <Typography variant="caption" style={{ color: colors.textSecondary }}>
//                               {safe(fan.temperature, " " + tempUnit)}
//                             </Typography>
//                           </Box>
//                         </Grid>
//                       )}
//                       {(showPower || fan.power !== undefined) && (
//                         <Grid item xs={6}>
//                           <Box display="flex" alignItems="center" gap={0.5}>
//                             <ElectricBolt fontSize="small" />
//                             <Typography variant="caption" style={{ color: colors.textSecondary }}>
//                               {safe(fan.power, " W")}
//                             </Typography>
//                           </Box>
//                         </Grid>
//                       )}
//                       {(showRuntime || fan.runtime !== undefined) && (
//                         <Grid item xs={6}>
//                           <Box display="flex" alignItems="center" gap={0.5}>
//                             <Schedule fontSize="small" />
//                             <Typography variant="caption" style={{ color: colors.textSecondary }}>
//                               {safe((fan.runtime ?? 0).toFixed(1), "h")}
//                             </Typography>
//                           </Box>
//                         </Grid>
//                       )}
//                       {(showMaintenance || fan.maintenanceHours !== undefined) && (
//                         <Grid item xs={6}>
//                           <Box display="flex" alignItems="center" gap={0.5}>
//                             <Build fontSize="small" />
//                             <Typography variant="caption" style={{ color: colors.textSecondary }}>
//                               {safe(Math.max(0, (fan.maintenanceHours ?? 0) - (fan.runtime ?? 0)).toFixed(0), "h")}
//                             </Typography>
//                           </Box>
//                         </Grid>
//                       )}
//                     </Grid>

//                     {showAlarms && fan.alarms && fan.alarms.length > 0 && (
//                       <Box mt={1}>
//                         {fan.alarms.map((alarm, i) => (
//                           <Alert key={i} severity={alarm.type || "error"} size="small" style={{ marginBottom: 4 }}>
//                             {alarm.message}
//                             {alarm.timestamp && (
//                               <span style={{ float: "right", color: "#999", fontSize: 11 }}>{alarm.timestamp}</span>
//                             )}
//                           </Alert>
//                         ))}
//                       </Box>
//                     )}
//                   </CardContent>
//                 </Card>
//               </Grid>
//             )
//           })}
//         </Grid>

//         {/* Add Fan Dialog */}
//         {showAddFanDialog && (
//           <Dialog open={addFanDialog} onClose={() => setAddFanDialog(false)}>
//             <DialogTitle style={{ background: colors.surface, color: colors.text }}>Add New Fan</DialogTitle>
//             <DialogContent style={{ background: colors.bg, color: colors.text }}>
//               <TextField
//                 autoFocus
//                 margin="dense"
//                 label="Fan Name"
//                 fullWidth
//                 variant="outlined"
//                 value={newFanName}
//                 onChange={(e) => setNewFanName(e.target.value)}
//               />
//             </DialogContent>
//             <DialogActions style={{ background: colors.surface }}>
//               <Button onClick={() => setAddFanDialog(false)}>Cancel</Button>
//               <Button
//                 onClick={addNewFan}
//                 variant="contained"
//                 style={{ background: primaryColor, color: "#fff" }}
//               >
//                 Add Fan
//               </Button>
//             </DialogActions>
//           </Dialog>
//         )}

//         {/* Fan Config Dialog */}
//         {showFanConfigDialog && selectedFan && (
//           <Dialog open={!!selectedFan} onClose={() => setSelectedFan(null)} maxWidth="sm" fullWidth>
//             <DialogTitle style={{ background: colors.surface, color: colors.text }}>
//               <Box display="flex" alignItems="center" gap={1}>
//                 <Tune fontSize="small" />
//                 Configure {selectedFan.name}
//               </Box>
//             </DialogTitle>
//             <DialogContent style={{ background: colors.bg, color: colors.text }}>
//               <Grid container spacing={2}>
//                 <Grid item xs={12}>
//                   <TextField
//                     label="Fan Name"
//                     fullWidth
//                     value={selectedFan.name}
//                     onChange={(e) => setSelectedFan({ ...selectedFan, name: e.target.value })}
//                   />
//                 </Grid>
//                 <Grid item xs={6}>
//                   <TextField
//                     label="Maintenance Hours"
//                     type="number"
//                     fullWidth
//                     value={selectedFan.maintenanceHours}
//                     onChange={(e) =>
//                       setSelectedFan({ ...selectedFan, maintenanceHours: Number.parseInt(e.target.value) })
//                     }
//                   />
//                 </Grid>
//                 <Grid item xs={6}>
//                   <TextField
//                     label="Last Maintenance"
//                     type="date"
//                     fullWidth
//                     value={selectedFan.lastMaintenance}
//                     onChange={(e) => setSelectedFan({ ...selectedFan, lastMaintenance: e.target.value })}
//                   />
//                 </Grid>
//                 <Grid item xs={6}>
//                   <FormControl fullWidth>
//                     <InputLabel>Speed Unit</InputLabel>
//                     <Select
//                       value={selectedFan.speedUnit}
//                       label="Speed Unit"
//                       onChange={(e) => setSelectedFan({ ...selectedFan, speedUnit: e.target.value })}
//                     >
//                       {(speedUnits || DEFAULT_SPEED_UNITS).map((opt) => (
//                         <MenuItem key={opt.value} value={opt.value}>
//                           <Box display="flex" alignItems="center" gap={1}>
//                             {opt.icon}
//                             {opt.label}
//                           </Box>
//                         </MenuItem>
//                       ))}
//                     </Select>
//                   </FormControl>
//                 </Grid>
//                 <Grid item xs={6}>
//                   <FormControl fullWidth>
//                     <InputLabel>Temperature Unit</InputLabel>
//                     <Select
//                       value={selectedFan.tempUnit}
//                       label="Temperature Unit"
//                       onChange={(e) => setSelectedFan({ ...selectedFan, tempUnit: e.target.value })}
//                     >
//                       {(tempUnits || DEFAULT_TEMP_UNITS).map((opt) => (
//                         <MenuItem key={opt.value} value={opt.value}>
//                           <Box display="flex" alignItems="center" gap={1}>
//                             {opt.icon}
//                             {opt.label}
//                           </Box>
//                         </MenuItem>
//                       ))}
//                     </Select>
//                   </FormControl>
//                 </Grid>
//               </Grid>
//             </DialogContent>
//             <DialogActions style={{ background: colors.surface }}>
//               <Button onClick={() => setSelectedFan(null)} style={{ color: primaryColor }}>
//                 Close
//               </Button>
//             </DialogActions>
//           </Dialog>
//         )}
//       </CardContent>
//     </Card>
//   )
// }

// export default FanControlWidget



// "use client"

// import React, { useState, useEffect } from "react"
// import {
//   Card, CardContent, Typography, Button, Slider, Switch, Chip, Grid, Box, IconButton, Dialog, DialogTitle,
//   DialogContent, DialogActions, TextField, Alert, Badge, MenuItem, Select, InputLabel, FormControl, Tooltip
// } from "@mui/material"
// import {
//   PlayArrow, Stop, Settings, Warning, Error, CheckCircle, Thermostat, ElectricBolt, Schedule, Build,
//   Add, Delete, Tune, Percent, RotateRight, Opacity, Star, StarBorder, ArrowUpward, ArrowDownward
// } from "@mui/icons-material"
// import { useTheme } from "../../theme/ThemeProvider"
// import "../../../styles/fan-control-widget.css"

// const DEFAULT_SPEED_UNITS = [
//   { value: "%", label: "Percentage (%)", icon: <Percent fontSize="small" /> },
//   { value: "RPM", label: "Rotation (RPM)", icon: <RotateRight fontSize="small" /> },
// ]
// const DEFAULT_TEMP_UNITS = [
//   { value: "°C", label: "Celsius (°C)", icon: <Thermostat fontSize="small" /> },
//   { value: "°F", label: "Fahrenheit (°F)", icon: <Thermostat fontSize="small" /> },
//   { value: "K", label: "Kelvin (K)", icon: <Opacity fontSize="small" /> },
// ]

// const IMPORTANT_COLOR = "#bb9500"
// const TREND_UP_COLOR = "#539150"
// const TREND_DOWN_COLOR = "#bc3d3d"

// const safe = (v, suffix = "") =>
//   v === undefined || v === null || Number.isNaN(v) ? <span title="No data">--</span> : v + suffix

// function buildFanCommandPayload(fanId, command, value) {
//   return { fanId, command, ...(value !== undefined ? { value } : {}), ts: Date.now() }
// }
// function getTrend(prev, curr) {
//   if (typeof prev !== "number" || typeof curr !== "number") return { trend: 0, delta: 0 }
//   const trend = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0
//   const delta = curr - prev
//   return { trend, delta }
// }

// // ---- Supports: top-level array, plain object, legacy RMS format ----
// function extractSystemAndFanData(data) {
//   // If data is an array, try to find a system object or treat as fans list
//   if (Array.isArray(data)) {
//     const systemCandidate = data.find(item =>
//       typeof item === "object" && (
//         item.fans_status || item.fans || item.mode || item.temperature
//       )
//     );
//     if (systemCandidate) {
//       return extractSystemAndFanData(systemCandidate)
//     }
//     // Assume all items are fans, minimal mode
//     const allFans = data.map((fan, idx) => ({
//       id: fan.id || `fan${idx + 1}`,
//       name: fan.name || `Fan ${idx + 1}`,
//       ...fan,
//     }));
//     return {
//       system: {},
//       fans_status: {},
//       allFans,
//       mode: "--",
//       temperature: undefined,
//       temperature_unit: "°C",
//       power: undefined,
//       total_fans: allFans.length,
//       operating_fans: allFans.filter(fan => fan.status === "on" || fan.status === true).length,
//       alarms: [],
//       fan_fail_alarm: false,
//       standby_fan_on: false,
//     }
//   }

//   // If primitive or null, fallback to defaults
//   if (!data || typeof data !== "object") return {
//     system: {},
//     fans_status: {},
//     allFans: [],
//     mode: "--",
//     temperature: undefined,
//     temperature_unit: "°C",
//     power: undefined,
//     total_fans: 0,
//     operating_fans: 0,
//     alarms: [],
//     fan_fail_alarm: false,
//     standby_fan_on: false,
//   }

//   // Try normal/legacy format:
//   const fansObj = data.fans_status || data.fans ? (data.fans || data) : data
//   const systemObj = data.fans || data

//   const fans_status = fansObj.fans_status || fansObj
//   const mode = systemObj.mode ?? "--"
//   const temperature = systemObj.temperature
//   const temperature_unit = systemObj.temperature_unit || "°C"
//   const power = systemObj.power
//   const total_fans = systemObj.total_fans !== undefined ? systemObj.total_fans : (fans_status ? Object.keys(fans_status).length : 0)
//   const operating_fans = systemObj.operating_fans !== undefined
//     ? systemObj.operating_fans
//     : (fans_status ? Object.values(fans_status).filter(f => f && (f.status === "on" || f.status === true)).length : 0)
//   const alarms = Array.isArray(systemObj.alarms) ? systemObj.alarms : []
//   const fan_fail_alarm = !!systemObj.fan_fail_alarm
//   const standby_fan_on = !!systemObj.standby_fan_on

//   // Return flat list of fans, add id fallback if not present
//   const allFans = fans_status && typeof fans_status === "object"
//     ? Object.entries(fans_status).map(([id, fan]) => ({
//         id,
//         name: fan.name || id,
//         ...fan,
//       }))
//     : []

//   return {
//     system: systemObj,
//     fans_status,
//     allFans,
//     mode,
//     temperature,
//     temperature_unit,
//     power,
//     total_fans,
//     operating_fans,
//     alarms,
//     fan_fail_alarm,
//     standby_fan_on,
//   }
// }

// const FanControlWidget = ({
//   fans = [],                // Only used for Add/Edit/Delete dialog, not for live data
//   data = {},
//   dataKeys = ["speed"],     // Not used, but kept for legacy compatibility

//   showStats = false,
//   showAlarms = false,
//   showAddFan = false,
//   showDeleteFan = false,
//   showEditFan = false,
//   showFanConfigDialog = false,
//   showAddFanDialog = false,
//   showStartStop = false,
//   showAllControl = false,
//   showSpeedSet = false,
//   showReset = false,
//   showAutoMode = false,
//   enableImportantFan = true,

//   showTemperature = false,
//   showPower = false,
//   showRuntime = false,
//   showMaintenance = false,

//   minSpeed = 0,
//   maxSpeedPercent = 100,
//   maxSpeedRpm = 1800,
//   speedUnits = DEFAULT_SPEED_UNITS,
//   tempUnits = DEFAULT_TEMP_UNITS,

//   onConfigChange,
//   onControlChange,
//   sendMqttCommand,
//   ...props
// }) => {
//   // Add a log for what data you get!
//   useEffect(() => {
//     console.log("[FanControlWidget] Data prop:", data)
//   }, [data])

//   const { isDarkMode, primaryColor } = useTheme()

//   // Extract system-level and fans data
//   const {
//     system,
//     fans_status,
//     allFans,
//     mode,
//     temperature,
//     temperature_unit,
//     power,
//     total_fans,
//     operating_fans,
//     alarms,
//     fan_fail_alarm,
//     standby_fan_on,
//   } = extractSystemAndFanData(data)

//   // For Add/Edit/Delete dialog, manage local fans state, but always render from live data
//   const [fanList, setFanList] = useState(allFans)
//   const [selectedFan, setSelectedFan] = useState(null)
//   const [addFanDialog, setAddFanDialog] = useState(false)
//   const [newFanName, setNewFanName] = useState("")
//   const [importantMap, setImportantMap] = useState({})
//   const [speedHistory, setSpeedHistory] = useState({})

//   // --- LOG rendered fanList for debugging
//   useEffect(() => {
//     setFanList(allFans)
//     const newMap = {}
//     allFans.forEach(fan => { if (fan.important) newMap[fan.id] = true })
//     setImportantMap(newMap)

//     // Log actual fans to be rendered
//     // eslint-disable-next-line
//     console.log("[FanControlWidget] Rendering fanList:", allFans)
//   }, [data])

//   useEffect(() => {
//     setSpeedHistory(prevHist => {
//       const updated = { ...prevHist }
//       allFans.forEach(fan => {
//         const curr = fan.speed ?? 0
//         if (!updated[fan.id]) updated[fan.id] = [curr, curr]
//         else if (updated[fan.id][1] !== curr) updated[fan.id] = [updated[fan.id][1], curr]
//       })
//       return updated
//     })
//   }, [allFans])

//   const addNewFan = () => {
//     if (!newFanName.trim()) return
//     const newFan = {
//       id: `fan${Date.now()}`,
//       name: newFanName,
//       status: "stopped",
//       speed: 0,
//       targetSpeed: 0,
//       speedUnit: "%",
//       temperature: 25,
//       tempUnit: "°C",
//       power: 0,
//       runtime: 0,
//       maintenanceHours: 8760,
//       lastMaintenance: new Date().toISOString().split("T")[0],
//       autoMode: false,
//       alarms: [],
//       important: false,
//     }
//     setFanList(prev => [...prev, newFan])
//     setImportantMap(prev => ({ ...prev, [newFan.id]: false }))
//     setNewFanName("")
//     setAddFanDialog(false)
//     if (onConfigChange) onConfigChange([...fanList, newFan])
//   }

//   const deleteFan = (fanId) => {
//     setFanList(prev => prev.filter(f => f.id !== fanId))
//     setImportantMap(prev => {
//       const next = { ...prev }
//       delete next[fanId]
//       return next
//     })
//     setSpeedHistory(prev => {
//       const next = { ...prev }
//       delete next[fanId]
//       return next
//     })
//     if (onConfigChange) onConfigChange(fanList.filter(f => f.id !== fanId))
//   }

//   const handleToggleImportant = (fanId) => {
//     setImportantMap(prev => {
//       const updated = { ...prev, [fanId]: !prev[fanId] }
//       setFanList(list =>
//         list.map(fan => fan.id === fanId ? { ...fan, important: !prev[fanId] } : fan)
//       )
//       return updated
//     })
//   }

//   const handleFanControl = (fanId, action) => {
//     if (onControlChange) onControlChange(fanId, "action", action)
//     if (typeof sendMqttCommand === "function") {
//       sendMqttCommand(buildFanCommandPayload(fanId, action))
//     }
//   }
//   const handleSpeedChange = (fanId, value) => {
//     if (onControlChange) onControlChange(fanId, "targetSpeed", value)
//     if (typeof sendMqttCommand === "function") {
//       sendMqttCommand(buildFanCommandPayload(fanId, "set_speed", value))
//     }
//   }
//   const handleAutoModeToggle = (fanId, current) => {
//     if (onControlChange) onControlChange(fanId, "autoMode", !current)
//     if (typeof sendMqttCommand === "function") {
//       sendMqttCommand(buildFanCommandPayload(fanId, "auto_mode", !current))
//     }
//   }
//   const handleAllFans = (action) => {
//     fanList.forEach(fan => handleFanControl(fan.id, action))
//   }

//   const themeColors = {
//     light: {
//       bg: "#fff",
//       bgElevated: "#fafbfc",
//       text: "#222",
//       textSecondary: "#444",
//       surface: "#f6f8fa",
//       accent: "#1667ff",
//       ok: "#4caf50",
//       warn: "#ff9800",
//       err: "#f44336",
//     },
//     dark: {
//       bg: "#141414",
//       bgElevated: "#000000",
//       text: "#fff",
//       textSecondary: "#bdbdbd",
//       surface: "#181818",
//       accent: "var(--primary-color, #1667ff)",
//       ok: "#4caf50",
//       warn: "#ff9800",
//       err: "#f44336",
//     }
//   }
//   const colors = themeColors[isDarkMode ? "dark" : "light"]

//   // Main system-level UI
//   const runningFans = allFans.filter(fan => (fan.status === "on" || fan.status === true)).length
//   const totalAlarms = allFans.reduce((sum, fan) => sum + (fan.alarms?.length || 0), 0) + (alarms?.length || 0)

//   return (
//     <Card
//       className={`fan-control-widget ${isDarkMode ? "fan-widget-dark" : ""}`}
//       style={{
//         color: colors.text,
//         minWidth: 340,
//         maxWidth: "100%",
//         boxSizing: "border-box",
//       }}
//       elevation={0}
//     >
//       <CardContent style={{ background: colors.bg }}>
//         {/* System-level summary */}
//         <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
//           <Box>
//             <Typography variant="h6" sx={{
//               color: primaryColor, fontWeight: 700, letterSpacing: 0.2
//             }}>
//               {props.title || "Fans"}
//             </Typography>
//             <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 500 }}>
//               Mode: <b>{mode}</b>
//             </Typography>
//             <Typography variant="caption" sx={{ color: colors.textSecondary, display: "block" }}>
//               Fans Running: <b style={{ color: runningFans === total_fans ? "#388e3c" : runningFans > 0 ? "#fa8c16" : "#d32f2f" }}>
//                 {operating_fans}/{total_fans}
//               </b>
//               {fan_fail_alarm && <Chip color="error" size="small" label="Fan Fail!" sx={{ ml: 2 }} />}
//               {standby_fan_on && <Chip color="info" size="small" label="Standby Fan On" sx={{ ml: 2 }} />}
//             </Typography>
//           </Box>
//           <Box display="flex" gap={1}>
//             {showStats && (
//               <Chip label={`${runningFans}/${total_fans} Running`} color={runningFans > 0 ? "success" : "default"} size="small" />
//             )}
//             {showAlarms && totalAlarms > 0 && (
//               <Badge badgeContent={totalAlarms} color="error">
//                 <Warning color="warning" />
//               </Badge>
//             )}
//             {showAddFan && (
//               <IconButton size="small" onClick={() => setAddFanDialog(true)} style={{ color: primaryColor }}>
//                 <Add />
//               </IconButton>
//             )}
//           </Box>
//         </Box>
//         {/* System-level alarms */}
//         {alarms && alarms.length > 0 && (
//           <Box mb={1}>
//             {alarms.map((alarm, idx) =>
//               <Alert key={idx} severity={alarm.type || "warning"} style={{ marginBottom: 4 }}>
//                 {alarm.message}
//                 {alarm.timestamp && <span style={{ float: "right", color: "#999", fontSize: 11 }}>{alarm.timestamp}</span>}
//               </Alert>
//             )}
//           </Box>
//         )}
//         {/* All control buttons */}
//         {showAllControl && (
//           <Box mb={2} display="flex" gap={2} flexWrap="wrap">
//             <Button
//               variant="outlined"
//               sx={{
//                 borderColor: "#539150",
//                 color: "#539150",
//               }}
//               startIcon={<PlayArrow />}
//               size="small"
//               onClick={() => handleAllFans("start")}
//             >
//               Start All
//             </Button>
//             <Button
//               variant="outlined"
//               sx={{
//                 borderColor: "#bc3d3d",
//                 color: "#bc3d3d",
//               }}
//               startIcon={<Stop />}
//               size="small"
//               onClick={() => handleAllFans("stop")}
//             >
//               Stop All
//             </Button>
//           </Box>
//         )}
//         {/* Fan cards */}
//         <Grid container spacing={2} alignItems="stretch">
//           {fanList.map((fan) => {
//             const isSpinning = (fan.status === "on" || fan.status === true) && fan.speed > 0
//             const important = !!(fan.important || importantMap[fan.id])
//             const [prevSpeed, currSpeed] = speedHistory[fan.id] || [fan.speed, fan.speed]
//             const { trend, delta } = getTrend(prevSpeed, currSpeed)
//             const speedUnit = fan.speed_unit || fan.speedUnit || "%"
//             const tempUnit = fan.temp_unit || fan.tempUnit || "°C"

//             const status = fan.status === true ? "Running" : fan.status === false ? "Stopped" : (typeof fan.status === "string" ? fan.status.charAt(0).toUpperCase() + fan.status.slice(1) : "Unknown")
//             const showControls = showStartStop || showAutoMode || showReset || showSpeedSet

//             return (
//               <Grid
//                 item
//                 xs={12}
//                 sm={12}
//                 md={6}
//                 lg={6}
//                 xl={6}
//                 key={fan.id}
//               >
//                 <Card
//                   variant="outlined"
//                   className={`fan-card ${status.toLowerCase()} ${isSpinning ? "spinning" : ""} ${important ? "important-fan" : ""} ${isDarkMode ? "fan-card-dark" : ""}`}
//                   style={{
//                     background: colors.bgElevated,
//                     color: colors.text,
//                     display: "flex",
//                     flexDirection: "column",
//                     justifyContent: "stretch",
//                   }}
//                 >
//                   <CardContent style={{ flex: 1, display: "flex", flexDirection: "column" }}>
//                     {/* Header */}
//                     <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
//                       <Box display="flex" alignItems="center" gap={1}>
//                         {enableImportantFan && (
//                           <Tooltip title={important ? "Important Fan" : "Mark as Important"}>
//                             <IconButton
//                               size="small"
//                               aria-label={important ? "Unmark important" : "Mark important"}
//                               onClick={() => handleToggleImportant(fan.id)}
//                               style={{ color: important ? IMPORTANT_COLOR : "#bbb", marginRight: 2 }}>
//                               {important ? <Star /> : <StarBorder />}
//                             </IconButton>
//                           </Tooltip>
//                         )}
//                         <Box>
//                           <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.text, maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
//                             {fan.name}
//                           </Typography>
//                           <Typography variant="caption" sx={{ color: colors.textSecondary }}>
//                             Fan ID: <b>{fan.id}</b>
//                             {" | Status: "}
//                             <b style={{
//                               color:
//                                 status === "Running"
//                                   ? "#2e7d32"
//                                   : status === "Stopped"
//                                     ? "#d32f2f"
//                                     : status === "Failed"
//                                       ? "#f44336"
//                                       : colors.textSecondary,
//                             }}>
//                               {status}
//                             </b>
//                             {important && (
//                               <span style={{
//                                 background: IMPORTANT_COLOR,
//                                 color: "#fff",
//                                 fontWeight: 600,
//                                 borderRadius: 6,
//                                 fontSize: 11,
//                                 padding: "2px 7px",
//                                 marginLeft: 7
//                               }}>
//                                 Important
//                               </span>
//                             )}
//                           </Typography>
//                         </Box>
//                       </Box>
//                       <Box display="flex" alignItems="center" gap={1}>
//                         {status === "Running"
//                           ? <CheckCircle style={{ color: "#4caf50" }} />
//                           : status === "Failed"
//                             ? <Error style={{ color: "#f44336" }} />
//                             : <Stop style={{ color: colors.textSecondary }} />}
//                         {showEditFan && (
//                           <IconButton size="small" onClick={() => setSelectedFan(fan)} style={{ color: primaryColor }}>
//                             <Settings />
//                           </IconButton>
//                         )}
//                         {showDeleteFan && (
//                           <IconButton size="small" onClick={() => deleteFan(fan.id)} color="error">
//                             <Delete />
//                           </IconButton>
//                         )}
//                       </Box>
//                     </Box>
//                     {/* Trend/RPM info */}
//                     <Box display="flex" alignItems="center" gap={2} mb={1}>
//                       <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text }}>
//                         Live Speed: {safe(fan.speed, " " + speedUnit)}
//                       </Typography>
//                       {trend !== 0 && (
//                         <Box display="flex" alignItems="center" gap={0.5}>
//                           {trend > 0 ? (
//                             <span style={{ color: TREND_UP_COLOR, fontWeight: 600 }}>
//                               <ArrowUpward fontSize="small" /> +{trend.toFixed(1)}%
//                             </span>
//                           ) : (
//                             <span style={{ color: TREND_DOWN_COLOR, fontWeight: 600 }}>
//                               <ArrowDownward fontSize="small" /> {trend.toFixed(1)}%
//                             </span>
//                           )}
//                         </Box>
//                       )}
//                       {delta !== 0 && (
//                         <Typography variant="caption" sx={{ color: "#aaa" }}>
//                           Δ {delta > 0 ? "+" : ""}{delta.toFixed(1)} {speedUnit}
//                         </Typography>
//                       )}
//                     </Box>
//                     {/* Fan Animation */}
//                     <Box display="flex" justifyContent="center" mb={showControls ? 2 : 1}>
//                       <div className={`fan-blade ${isSpinning ? "spinning" : ""} ${isDarkMode ? "blade-dark" : ""}`}
//                         style={{ animationDuration: isSpinning ? `${2 - Math.min(1.99, fan.speed / 50)}s` : "0s" }}>
//                         <div className="fan-center"></div>
//                         <div className="blade" style={{ transform: "rotate(0deg)" }}></div>
//                         <div className="blade" style={{ transform: "rotate(90deg)" }}></div>
//                         <div className="blade" style={{ transform: "rotate(180deg)" }}></div>
//                         <div className="blade" style={{ transform: "rotate(270deg)" }}></div>
//                       </div>
//                     </Box>
//                     {showControls && (
//                       <>
//                         {(showStartStop || showAutoMode || showReset) && (
//                           <Box mb={2}>
//                             {showStartStop && (
//                               <Box display="flex" gap={1} mb={1}>
//                                 <Button size="small" startIcon={<PlayArrow />} onClick={() => handleFanControl(fan.id, "start")} disabled={status === "Failed"} variant="outlined" color="success">Start</Button>
//                                 <Button size="small" startIcon={<Stop />} onClick={() => handleFanControl(fan.id, "stop")} variant="outlined" color="error">Stop</Button>
//                                 {showReset && status === "Failed" && (
//                                   <Button size="small" onClick={() => handleFanControl(fan.id, "reset")} variant="outlined">Reset</Button>
//                                 )}
//                               </Box>
//                             )}
//                             {showAutoMode && (
//                               <Box display="flex" alignItems="center" gap={1} mb={1}>
//                                 <Typography variant="caption" style={{ color: colors.textSecondary }}>Auto Mode:</Typography>
//                                 <Switch size="small" checked={fan.autoMode} onChange={() => handleAutoModeToggle(fan.id, fan.autoMode)} />
//                               </Box>
//                             )}
//                           </Box>
//                         )}
//                         {showSpeedSet && (
//                           <Box mb={2}>
//                             <Typography variant="caption" gutterBottom style={{ color: colors.textSecondary }}>
//                               Speed: {safe(fan.speed, " " + speedUnit)}
//                             </Typography>
//                             <Slider
//                               value={Number.isFinite(fan.speed) ? fan.speed : 0}
//                               onChange={(e, value) => handleSpeedChange(fan.id, value)}
//                               disabled={status === "Failed"}
//                               min={minSpeed}
//                               max={speedUnit === "RPM" ? maxSpeedRpm : maxSpeedPercent}
//                               size="small"
//                               sx={{
//                                 color: primaryColor,
//                                 '& .MuiSlider-rail': { backgroundColor: isDarkMode ? "#222" : "#eee" },
//                               }}
//                             />
//                           </Box>
//                         )}
//                       </>
//                     )}
//                     {/* Details grid */}
//                     <Grid container spacing={1} sx={{ mt: 1 }}>
//                       {(showTemperature || fan.temperature !== undefined) && (
//                         <Grid item xs={6}>
//                           <Box display="flex" alignItems="center" gap={0.5}>
//                             <Thermostat fontSize="small" />
//                             <Typography variant="caption" style={{ color: colors.textSecondary }}>
//                               {safe(fan.temperature, " " + tempUnit)}
//                             </Typography>
//                           </Box>
//                         </Grid>
//                       )}
//                       {(showPower || fan.power !== undefined) && (
//                         <Grid item xs={6}>
//                           <Box display="flex" alignItems="center" gap={0.5}>
//                             <ElectricBolt fontSize="small" />
//                             <Typography variant="caption" style={{ color: colors.textSecondary }}>
//                               {safe(fan.power, " W")}
//                             </Typography>
//                           </Box>
//                         </Grid>
//                       )}
//                       {(showRuntime || fan.runtime !== undefined) && (
//                         <Grid item xs={6}>
//                           <Box display="flex" alignItems="center" gap={0.5}>
//                             <Schedule fontSize="small" />
//                             <Typography variant="caption" style={{ color: colors.textSecondary }}>
//                               {safe((fan.runtime ?? 0).toFixed(1), "h")}
//                             </Typography>
//                           </Box>
//                         </Grid>
//                       )}
//                       {(showMaintenance || fan.maintenanceHours !== undefined) && (
//                         <Grid item xs={6}>
//                           <Box display="flex" alignItems="center" gap={0.5}>
//                             <Build fontSize="small" />
//                             <Typography variant="caption" style={{ color: colors.textSecondary }}>
//                               {safe(Math.max(0, (fan.maintenanceHours ?? 0) - (fan.runtime ?? 0)).toFixed(0), "h")}
//                             </Typography>
//                           </Box>
//                         </Grid>
//                       )}
//                     </Grid>
//                     {showAlarms && fan.alarms && fan.alarms.length > 0 && (
//                       <Box mt={1}>{fan.alarms.map((alarm, i) =>
//                         <Alert key={i} severity={alarm.type || "error"} size="small" style={{ marginBottom: 4 }}>
//                           {alarm.message}
//                           {alarm.timestamp && <span style={{ float: "right", color: "#999", fontSize: 11 }}>{alarm.timestamp}</span>}
//                         </Alert>
//                       )}</Box>
//                     )}
//                   </CardContent>
//                 </Card>
//               </Grid>
//             )
//           })}
//         </Grid>
//         {/* Add Fan Dialog */}
//         {showAddFanDialog && (
//           <Dialog open={addFanDialog} onClose={() => setAddFanDialog(false)}>
//             <DialogTitle style={{ background: colors.surface, color: colors.text }}>Add New Fan</DialogTitle>
//             <DialogContent style={{ background: colors.bg, color: colors.text }}>
//               <TextField autoFocus margin="dense" label="Fan Name" fullWidth variant="outlined" value={newFanName} onChange={e => setNewFanName(e.target.value)} />
//             </DialogContent>
//             <DialogActions style={{ background: colors.surface }}>
//               <Button onClick={() => setAddFanDialog(false)}>Cancel</Button>
//               <Button onClick={addNewFan} variant="contained" style={{ background: primaryColor, color: "#fff" }}>Add Fan</Button>
//             </DialogActions>
//           </Dialog>
//         )}
//         {/* Fan Config Dialog */}
//         {showFanConfigDialog && selectedFan && (
//           <Dialog open={!!selectedFan} onClose={() => setSelectedFan(null)} maxWidth="sm" fullWidth>
//             <DialogTitle style={{ background: colors.surface, color: colors.text }}>
//               <Box display="flex" alignItems="center" gap={1}><Tune fontSize="small" />Configure {selectedFan.name}</Box>
//             </DialogTitle>
//             <DialogContent style={{ background: colors.bg, color: colors.text }}>
//               <Grid container spacing={2}>
//                 <Grid item xs={12}><TextField label="Fan Name" fullWidth value={selectedFan.name} onChange={e => setSelectedFan({ ...selectedFan, name: e.target.value })} /></Grid>
//                 <Grid item xs={6}><TextField label="Maintenance Hours" type="number" fullWidth value={selectedFan.maintenanceHours} onChange={e => setSelectedFan({ ...selectedFan, maintenanceHours: Number.parseInt(e.target.value) })} /></Grid>
//                 <Grid item xs={6}><TextField label="Last Maintenance" type="date" fullWidth value={selectedFan.lastMaintenance} onChange={e => setSelectedFan({ ...selectedFan, lastMaintenance: e.target.value })} /></Grid>
//                 <Grid item xs={6}>
//                   <FormControl fullWidth>
//                     <InputLabel>Speed Unit</InputLabel>
//                     <Select value={selectedFan.speedUnit} label="Speed Unit" onChange={e => setSelectedFan({ ...selectedFan, speedUnit: e.target.value })}>
//                       {(speedUnits || DEFAULT_SPEED_UNITS).map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
//                     </Select>
//                   </FormControl>
//                 </Grid>
//                 <Grid item xs={6}>
//                   <FormControl fullWidth>
//                     <InputLabel>Temperature Unit</InputLabel>
//                     <Select value={selectedFan.tempUnit} label="Temperature Unit" onChange={e => setSelectedFan({ ...selectedFan, tempUnit: e.target.value })}>
//                       {(tempUnits || DEFAULT_TEMP_UNITS).map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
//                     </Select>
//                   </FormControl>
//                 </Grid>
//               </Grid>
//             </DialogContent>
//             <DialogActions style={{ background: colors.surface }}>
//               <Button onClick={() => setSelectedFan(null)} style={{ color: primaryColor }}>Close</Button>
//             </DialogActions>
//           </Dialog>
//         )}
//       </CardContent>
//     </Card>
//   )
// }

// export default FanControlWidget


// // "use client"

// // import React, { useState, useEffect } from "react"
// // import {
// //   Card, CardContent, Typography, Button, Slider, Switch, Chip, Grid, Box, IconButton, Dialog, DialogTitle,
// //   DialogContent, DialogActions, TextField, Alert, Badge, MenuItem, Select, InputLabel, FormControl, Tooltip
// // } from "@mui/material"
// // import {
// //   PlayArrow, Stop, Settings, Warning, Error, CheckCircle, Thermostat, ElectricBolt, Schedule, Build,
// //   Add, Delete, Tune, Percent, RotateRight, Opacity, Star, StarBorder, ArrowUpward, ArrowDownward
// // } from "@mui/icons-material"
// // import { useTheme } from "../../theme/ThemeProvider"
// // import "../../../styles/fan-control-widget.css"

// // const DEFAULT_SPEED_UNITS = [
// //   { value: "%", label: "Percentage (%)", icon: <Percent fontSize="small" /> },
// //   { value: "RPM", label: "Rotation (RPM)", icon: <RotateRight fontSize="small" /> },
// // ]
// // const DEFAULT_TEMP_UNITS = [
// //   { value: "°C", label: "Celsius (°C)", icon: <Thermostat fontSize="small" /> },
// //   { value: "°F", label: "Fahrenheit (°F)", icon: <Thermostat fontSize="small" /> },
// //   { value: "K", label: "Kelvin (K)", icon: <Opacity fontSize="small" /> },
// // ]

// // const IMPORTANT_COLOR = "#bb9500"
// // const TREND_UP_COLOR = "#539150"
// // const TREND_DOWN_COLOR = "#bc3d3d"

// // const safe = (v, suffix = "") =>
// //   v === undefined || v === null || Number.isNaN(v) ? <span title="No data">--</span> : v + suffix

// // function buildFanCommandPayload(fanId, command, value) {
// //   return { fanId, command, ...(value !== undefined ? { value } : {}), ts: Date.now() }
// // }
// // function getTrend(prev, curr) {
// //   if (typeof prev !== "number" || typeof curr !== "number") return { trend: 0, delta: 0 }
// //   const trend = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0
// //   const delta = curr - prev
// //   return { trend, delta }
// // }

// // // Extracts actual data structure for both legacy and new JSON
// // function extractSystemAndFanData(data) {
// //   if (!data || typeof data !== "object") return {
// //     system: {},
// //     fans_status: {},
// //     allFans: [],
// //     mode: "--",
// //     temperature: undefined,
// //     temperature_unit: "°C",
// //     power: undefined,
// //     total_fans: 0,
// //     operating_fans: 0,
// //     alarms: [],
// //     fan_fail_alarm: false,
// //     standby_fan_on: false,
// //   }
// //   // Accept top-level "fans" object or the object itself
// //   const fansObj = data.fans_status || data.fans ? (data.fans || data) : data
// //   const systemObj = data.fans || data

// //   const fans_status = fansObj.fans_status || fansObj
// //   const mode = systemObj.mode ?? "--"
// //   const temperature = systemObj.temperature
// //   const temperature_unit = systemObj.temperature_unit || "°C"
// //   const power = systemObj.power
// //   const total_fans = systemObj.total_fans !== undefined ? systemObj.total_fans : (fans_status ? Object.keys(fans_status).length : 0)
// //   const operating_fans = systemObj.operating_fans !== undefined
// //     ? systemObj.operating_fans
// //     : (fans_status ? Object.values(fans_status).filter(f => f && (f.status === "on" || f.status === true)).length : 0)
// //   const alarms = Array.isArray(systemObj.alarms) ? systemObj.alarms : []
// //   const fan_fail_alarm = !!systemObj.fan_fail_alarm
// //   const standby_fan_on = !!systemObj.standby_fan_on

// //   // Return flat list of fans, add id fallback if not present
// //   const allFans = fans_status && typeof fans_status === "object"
// //     ? Object.entries(fans_status).map(([id, fan]) => ({
// //         id,
// //         name: fan.name || id,
// //         ...fan,
// //       }))
// //     : []

// //   return {
// //     system: systemObj,
// //     fans_status,
// //     allFans,
// //     mode,
// //     temperature,
// //     temperature_unit,
// //     power,
// //     total_fans,
// //     operating_fans,
// //     alarms,
// //     fan_fail_alarm,
// //     standby_fan_on,
// //   }
// // }

// // const FanControlWidget = ({
// //   fans = [],                // Only used for Add/Edit/Delete dialog, not for live data
// //   data = {},
// //   dataKeys = ["speed"],     // Not used, but kept for legacy compatibility

// //   showStats = false,
// //   showAlarms = false,
// //   showAddFan = false,
// //   showDeleteFan = false,
// //   showEditFan = false,
// //   showFanConfigDialog = false,
// //   showAddFanDialog = false,
// //   showStartStop = false,
// //   showAllControl = false,
// //   showSpeedSet = false,
// //   showReset = false,
// //   showAutoMode = false,
// //   enableImportantFan = true,

// //   showTemperature = false,
// //   showPower = false,
// //   showRuntime = false,
// //   showMaintenance = false,

// //   minSpeed = 0,
// //   maxSpeedPercent = 100,
// //   maxSpeedRpm = 1800,
// //   speedUnits = DEFAULT_SPEED_UNITS,
// //   tempUnits = DEFAULT_TEMP_UNITS,

// //   onConfigChange,
// //   onControlChange,
// //   sendMqttCommand,
// //   ...props
// // }) => {
// //   const { isDarkMode, primaryColor } = useTheme()

// //   // Extract system-level and fans data
// //   const {
// //     system,
// //     fans_status,
// //     allFans,
// //     mode,
// //     temperature,
// //     temperature_unit,
// //     power,
// //     total_fans,
// //     operating_fans,
// //     alarms,
// //     fan_fail_alarm,
// //     standby_fan_on,
// //   } = extractSystemAndFanData(data)

// //   // For Add/Edit/Delete dialog, manage local fans state, but always render from live data
// //   const [fanList, setFanList] = useState(allFans)
// //   const [selectedFan, setSelectedFan] = useState(null)
// //   const [addFanDialog, setAddFanDialog] = useState(false)
// //   const [newFanName, setNewFanName] = useState("")
// //   const [importantMap, setImportantMap] = useState({})
// //   const [speedHistory, setSpeedHistory] = useState({})

// //   // If live data updates, update UI lists, maintain Add/Edit dialog
// //   useEffect(() => {
// //     setFanList(allFans)
// //     const newMap = {}
// //     allFans.forEach(fan => { if (fan.important) newMap[fan.id] = true })
// //     setImportantMap(newMap)
// //   }, [data])

// //   useEffect(() => {
// //     setSpeedHistory(prevHist => {
// //       const updated = { ...prevHist }
// //       allFans.forEach(fan => {
// //         const curr = fan.speed ?? 0
// //         if (!updated[fan.id]) updated[fan.id] = [curr, curr]
// //         else if (updated[fan.id][1] !== curr) updated[fan.id] = [updated[fan.id][1], curr]
// //       })
// //       return updated
// //     })
// //   }, [allFans])

// //   const addNewFan = () => {
// //     if (!newFanName.trim()) return
// //     const newFan = {
// //       id: `fan${Date.now()}`,
// //       name: newFanName,
// //       status: "stopped",
// //       speed: 0,
// //       targetSpeed: 0,
// //       speedUnit: "%",
// //       temperature: 25,
// //       tempUnit: "°C",
// //       power: 0,
// //       runtime: 0,
// //       maintenanceHours: 8760,
// //       lastMaintenance: new Date().toISOString().split("T")[0],
// //       autoMode: false,
// //       alarms: [],
// //       important: false,
// //     }
// //     setFanList(prev => [...prev, newFan])
// //     setImportantMap(prev => ({ ...prev, [newFan.id]: false }))
// //     setNewFanName("")
// //     setAddFanDialog(false)
// //     if (onConfigChange) onConfigChange([...fanList, newFan])
// //   }

// //   const deleteFan = (fanId) => {
// //     setFanList(prev => prev.filter(f => f.id !== fanId))
// //     setImportantMap(prev => {
// //       const next = { ...prev }
// //       delete next[fanId]
// //       return next
// //     })
// //     setSpeedHistory(prev => {
// //       const next = { ...prev }
// //       delete next[fanId]
// //       return next
// //     })
// //     if (onConfigChange) onConfigChange(fanList.filter(f => f.id !== fanId))
// //   }

// //   const handleToggleImportant = (fanId) => {
// //     setImportantMap(prev => {
// //       const updated = { ...prev, [fanId]: !prev[fanId] }
// //       setFanList(list =>
// //         list.map(fan => fan.id === fanId ? { ...fan, important: !prev[fanId] } : fan)
// //       )
// //       return updated
// //     })
// //   }

// //   const handleFanControl = (fanId, action) => {
// //     if (onControlChange) onControlChange(fanId, "action", action)
// //     if (typeof sendMqttCommand === "function") {
// //       sendMqttCommand(buildFanCommandPayload(fanId, action))
// //     }
// //   }
// //   const handleSpeedChange = (fanId, value) => {
// //     if (onControlChange) onControlChange(fanId, "targetSpeed", value)
// //     if (typeof sendMqttCommand === "function") {
// //       sendMqttCommand(buildFanCommandPayload(fanId, "set_speed", value))
// //     }
// //   }
// //   const handleAutoModeToggle = (fanId, current) => {
// //     if (onControlChange) onControlChange(fanId, "autoMode", !current)
// //     if (typeof sendMqttCommand === "function") {
// //       sendMqttCommand(buildFanCommandPayload(fanId, "auto_mode", !current))
// //     }
// //   }
// //   const handleAllFans = (action) => {
// //     fanList.forEach(fan => handleFanControl(fan.id, action))
// //   }

// //   const themeColors = {
// //     light: {
// //       bg: "#fff",
// //       bgElevated: "#fafbfc",
// //       text: "#222",
// //       textSecondary: "#444",
// //       surface: "#f6f8fa",
// //       accent: "#1667ff",
// //       ok: "#4caf50",
// //       warn: "#ff9800",
// //       err: "#f44336",
// //     },
// //     dark: {
// //       bg: "#141414",
// //       bgElevated: "#000000",
// //       text: "#fff",
// //       textSecondary: "#bdbdbd",
// //       surface: "#181818",
// //       accent: "var(--primary-color, #1667ff)",
// //       ok: "#4caf50",
// //       warn: "#ff9800",
// //       err: "#f44336",
// //     }
// //   }
// //   const colors = themeColors[isDarkMode ? "dark" : "light"]

// //   // Main system-level UI
// //   const runningFans = allFans.filter(fan => (fan.status === "on" || fan.status === true)).length
// //   const totalAlarms = allFans.reduce((sum, fan) => sum + (fan.alarms?.length || 0), 0) + (alarms?.length || 0)

// //   return (
// //     <Card
// //       className={`fan-control-widget ${isDarkMode ? "fan-widget-dark" : ""}`}
// //       style={{
// //         color: colors.text,
// //         minWidth: 340,
// //         maxWidth: "100%",
// //         boxSizing: "border-box",
// //       }}
// //       elevation={0}
// //     >
// //       <CardContent style={{ background: colors.bg }}>
// //         {/* System-level summary */}
// //         <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
// //           <Box>
// //             <Typography variant="h6" sx={{
// //               color: primaryColor, fontWeight: 700, letterSpacing: 0.2
// //             }}>
// //               {props.title || "Fans"}
// //             </Typography>
// //             <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 500 }}>
// //               Mode: <b>{mode}</b> | Temp: <b>{safe(temperature, " " + temperature_unit)}</b> | Power: <b>{power ? `${power} W` : "--"}</b>
// //             </Typography>
// //             <Typography variant="caption" sx={{ color: colors.textSecondary, display: "block" }}>
// //               Fans Running: <b style={{ color: runningFans === total_fans ? "#388e3c" : runningFans > 0 ? "#fa8c16" : "#d32f2f" }}>
// //                 {operating_fans}/{total_fans}
// //               </b>
// //               {fan_fail_alarm && <Chip color="error" size="small" label="Fan Fail!" sx={{ ml: 2 }} />}
// //               {standby_fan_on && <Chip color="info" size="small" label="Standby Fan On" sx={{ ml: 2 }} />}
// //             </Typography>
// //           </Box>
// //           <Box display="flex" gap={1}>
// //             {showStats && (
// //               <Chip label={`${runningFans}/${total_fans} Running`} color={runningFans > 0 ? "success" : "default"} size="small" />
// //             )}
// //             {showAlarms && totalAlarms > 0 && (
// //               <Badge badgeContent={totalAlarms} color="error">
// //                 <Warning color="warning" />
// //               </Badge>
// //             )}
// //             {showAddFan && (
// //               <IconButton size="small" onClick={() => setAddFanDialog(true)} style={{ color: primaryColor }}>
// //                 <Add />
// //               </IconButton>
// //             )}
// //           </Box>
// //         </Box>
// //         {/* System-level alarms */}
// //         {alarms && alarms.length > 0 && (
// //           <Box mb={1}>
// //             {alarms.map((alarm, idx) =>
// //               <Alert key={idx} severity={alarm.type || "warning"} style={{ marginBottom: 4 }}>
// //                 {alarm.message}
// //                 {alarm.timestamp && <span style={{ float: "right", color: "#999", fontSize: 11 }}>{alarm.timestamp}</span>}
// //               </Alert>
// //             )}
// //           </Box>
// //         )}
// //         {/* All control buttons */}
// //         {showAllControl && (
// //           <Box mb={2} display="flex" gap={2} flexWrap="wrap">
// //             <Button
// //               variant="outlined"
// //               sx={{
// //                 borderColor: "#539150",
// //                 color: "#539150",
// //               }}
// //               startIcon={<PlayArrow />}
// //               size="small"
// //               onClick={() => handleAllFans("start")}
// //             >
// //               Start All
// //             </Button>
// //             <Button
// //               variant="outlined"
// //               sx={{
// //                 borderColor: "#bc3d3d",
// //                 color: "#bc3d3d",
// //               }}
// //               startIcon={<Stop />}
// //               size="small"
// //               onClick={() => handleAllFans("stop")}
// //             >
// //               Stop All
// //             </Button>
// //           </Box>
// //         )}
// //         {/* Fan cards */}
// //         <Grid container spacing={2} alignItems="stretch">
// //           {fanList.map((fan) => {
// //             const isSpinning = (fan.status === "on" || fan.status === true) && fan.speed > 0
// //             const important = !!(fan.important || importantMap[fan.id])
// //             const [prevSpeed, currSpeed] = speedHistory[fan.id] || [fan.speed, fan.speed]
// //             const { trend, delta } = getTrend(prevSpeed, currSpeed)
// //             const speedUnit = fan.speed_unit || fan.speedUnit || "%"
// //             const tempUnit = fan.temp_unit || fan.tempUnit || temperature_unit

// //             const status = fan.status === true ? "Running" : fan.status === false ? "Stopped" : (typeof fan.status === "string" ? fan.status.charAt(0).toUpperCase() + fan.status.slice(1) : "Unknown")
// //             const showControls = showStartStop || showAutoMode || showReset || showSpeedSet

// //             return (
// //               <Grid
// //                 item
// //                 xs={12}
// //                 sm={12}
// //                 md={6}
// //                 lg={6}
// //                 xl={6}
// //                 key={fan.id}
// //               >
// //                 <Card
// //                   variant="outlined"
// //                   className={`fan-card ${status.toLowerCase()} ${isSpinning ? "spinning" : ""} ${important ? "important-fan" : ""} ${isDarkMode ? "fan-card-dark" : ""}`}
// //                   style={{
// //                     background: colors.bgElevated,
// //                     color: colors.text,
// //                     display: "flex",
// //                     flexDirection: "column",
// //                     justifyContent: "stretch",
// //                   }}
// //                 >
// //                   <CardContent style={{ flex: 1, display: "flex", flexDirection: "column" }}>
// //                     {/* Header */}
// //                     <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
// //                       <Box display="flex" alignItems="center" gap={1}>
// //                         {enableImportantFan && (
// //                           <Tooltip title={important ? "Important Fan" : "Mark as Important"}>
// //                             <IconButton
// //                               size="small"
// //                               aria-label={important ? "Unmark important" : "Mark important"}
// //                               onClick={() => handleToggleImportant(fan.id)}
// //                               style={{ color: important ? IMPORTANT_COLOR : "#bbb", marginRight: 2 }}>
// //                               {important ? <Star /> : <StarBorder />}
// //                             </IconButton>
// //                           </Tooltip>
// //                         )}
// //                         <Box>
// //                           <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.text, maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
// //                             {fan.name}
// //                           </Typography>
// //                           <Typography variant="caption" sx={{ color: colors.textSecondary }}>
// //                             Fan ID: <b>{fan.id}</b>
// //                             {" | Status: "}
// //                             <b style={{
// //                               color:
// //                                 status === "Running"
// //                                   ? "#2e7d32"
// //                                   : status === "Stopped"
// //                                     ? "#d32f2f"
// //                                     : status === "Failed"
// //                                       ? "#f44336"
// //                                       : colors.textSecondary,
// //                             }}>
// //                               {status}
// //                             </b>
// //                             {important && (
// //                               <span style={{
// //                                 background: IMPORTANT_COLOR,
// //                                 color: "#fff",
// //                                 fontWeight: 600,
// //                                 borderRadius: 6,
// //                                 fontSize: 11,
// //                                 padding: "2px 7px",
// //                                 marginLeft: 7
// //                               }}>
// //                                 Important
// //                               </span>
// //                             )}
// //                           </Typography>
// //                         </Box>
// //                       </Box>
// //                       <Box display="flex" alignItems="center" gap={1}>
// //                         {status === "Running"
// //                           ? <CheckCircle style={{ color: "#4caf50" }} />
// //                           : status === "Failed"
// //                             ? <Error style={{ color: "#f44336" }} />
// //                             : <Stop style={{ color: colors.textSecondary }} />}
// //                         {showEditFan && (
// //                           <IconButton size="small" onClick={() => setSelectedFan(fan)} style={{ color: primaryColor }}>
// //                             <Settings />
// //                           </IconButton>
// //                         )}
// //                         {showDeleteFan && (
// //                           <IconButton size="small" onClick={() => deleteFan(fan.id)} color="error">
// //                             <Delete />
// //                           </IconButton>
// //                         )}
// //                       </Box>
// //                     </Box>
// //                     {/* Trend/RPM info, always on top, industry format */}
// //                     <Box display="flex" alignItems="center" gap={2} mb={1}>
// //                       <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text }}>
// //                         Live Speed: {safe(fan.speed, " " + speedUnit)}
// //                       </Typography>
// //                       {trend !== 0 && (
// //                         <Box display="flex" alignItems="center" gap={0.5}>
// //                           {trend > 0 ? (
// //                             <span style={{ color: TREND_UP_COLOR, fontWeight: 600 }}>
// //                               <ArrowUpward fontSize="small" /> +{trend.toFixed(1)}%
// //                             </span>
// //                           ) : (
// //                             <span style={{ color: TREND_DOWN_COLOR, fontWeight: 600 }}>
// //                               <ArrowDownward fontSize="small" /> {trend.toFixed(1)}%
// //                             </span>
// //                           )}
// //                         </Box>
// //                       )}
// //                       {delta !== 0 && (
// //                         <Typography variant="caption" sx={{ color: "#aaa" }}>
// //                           Δ {delta > 0 ? "+" : ""}{delta.toFixed(1)} {speedUnit}
// //                         </Typography>
// //                       )}
// //                     </Box>
// //                     {/* Fan Animation */}
// //                     <Box display="flex" justifyContent="center" mb={showControls ? 2 : 1}>
// //                       <div className={`fan-blade ${isSpinning ? "spinning" : ""} ${isDarkMode ? "blade-dark" : ""}`}
// //                         style={{ animationDuration: isSpinning ? `${2 - Math.min(1.99, fan.speed / 50)}s` : "0s" }}>
// //                         <div className="fan-center"></div>
// //                         <div className="blade" style={{ transform: "rotate(0deg)" }}></div>
// //                         <div className="blade" style={{ transform: "rotate(90deg)" }}></div>
// //                         <div className="blade" style={{ transform: "rotate(180deg)" }}></div>
// //                         <div className="blade" style={{ transform: "rotate(270deg)" }}></div>
// //                       </div>
// //                     </Box>

// //                     {showControls && (
// //                       <>
// //                         {(showStartStop || showAutoMode || showReset) && (
// //                           <Box mb={2}>
// //                             {showStartStop && (
// //                               <Box display="flex" gap={1} mb={1}>
// //                                 <Button size="small" startIcon={<PlayArrow />} onClick={() => handleFanControl(fan.id, "start")} disabled={status === "Failed"} variant="outlined" color="success">Start</Button>
// //                                 <Button size="small" startIcon={<Stop />} onClick={() => handleFanControl(fan.id, "stop")} variant="outlined" color="error">Stop</Button>
// //                                 {showReset && status === "Failed" && (
// //                                   <Button size="small" onClick={() => handleFanControl(fan.id, "reset")} variant="outlined">Reset</Button>
// //                                 )}
// //                               </Box>
// //                             )}
// //                             {showAutoMode && (
// //                               <Box display="flex" alignItems="center" gap={1} mb={1}>
// //                                 <Typography variant="caption" style={{ color: colors.textSecondary }}>Auto Mode:</Typography>
// //                                 <Switch size="small" checked={fan.autoMode} onChange={() => handleAutoModeToggle(fan.id, fan.autoMode)} />
// //                               </Box>
// //                             )}
// //                           </Box>
// //                         )}
// //                         {showSpeedSet && (
// //                           <Box mb={2}>
// //                             <Typography variant="caption" gutterBottom style={{ color: colors.textSecondary }}>
// //                               Speed: {safe(fan.speed, " " + speedUnit)}
// //                             </Typography>
// //                             <Slider
// //                               value={Number.isFinite(fan.speed) ? fan.speed : 0}
// //                               onChange={(e, value) => handleSpeedChange(fan.id, value)}
// //                               disabled={status === "Failed"}
// //                               min={minSpeed}
// //                               max={speedUnit === "RPM" ? maxSpeedRpm : maxSpeedPercent}
// //                               size="small"
// //                               sx={{
// //                                 color: primaryColor,
// //                                 '& .MuiSlider-rail': { backgroundColor: isDarkMode ? "#222" : "#eee" },
// //                               }}
// //                             />
// //                           </Box>
// //                         )}
// //                       </>
// //                     )}

// //                     {/* Details grid */}
// //                     <Grid container spacing={1} sx={{ mt: 1 }}>
// //                       {(showTemperature || fan.temperature !== undefined) && (
// //                         <Grid item xs={6}>
// //                           <Box display="flex" alignItems="center" gap={0.5}>
// //                             <Thermostat fontSize="small" />
// //                             <Typography variant="caption" style={{ color: colors.textSecondary }}>
// //                               {safe(fan.temperature, " " + tempUnit)}
// //                             </Typography>
// //                           </Box>
// //                         </Grid>
// //                       )}
// //                       {(showPower || fan.power !== undefined) && (
// //                         <Grid item xs={6}>
// //                           <Box display="flex" alignItems="center" gap={0.5}>
// //                             <ElectricBolt fontSize="small" />
// //                             <Typography variant="caption" style={{ color: colors.textSecondary }}>
// //                               {safe(fan.power, " W")}
// //                             </Typography>
// //                           </Box>
// //                         </Grid>
// //                       )}
// //                       {(showRuntime || fan.runtime !== undefined) && (
// //                         <Grid item xs={6}>
// //                           <Box display="flex" alignItems="center" gap={0.5}>
// //                             <Schedule fontSize="small" />
// //                             <Typography variant="caption" style={{ color: colors.textSecondary }}>
// //                               {safe((fan.runtime ?? 0).toFixed(1), "h")}
// //                             </Typography>
// //                           </Box>
// //                         </Grid>
// //                       )}
// //                       {(showMaintenance || fan.maintenanceHours !== undefined) && (
// //                         <Grid item xs={6}>
// //                           <Box display="flex" alignItems="center" gap={0.5}>
// //                             <Build fontSize="small" />
// //                             <Typography variant="caption" style={{ color: colors.textSecondary }}>
// //                               {safe(Math.max(0, (fan.maintenanceHours ?? 0) - (fan.runtime ?? 0)).toFixed(0), "h")}
// //                             </Typography>
// //                           </Box>
// //                         </Grid>
// //                       )}
// //                     </Grid>
// //                     {showAlarms && fan.alarms && fan.alarms.length > 0 && (
// //                       <Box mt={1}>{fan.alarms.map((alarm, i) =>
// //                         <Alert key={i} severity={alarm.type || "error"} size="small" style={{ marginBottom: 4 }}>
// //                           {alarm.message}
// //                           {alarm.timestamp && <span style={{ float: "right", color: "#999", fontSize: 11 }}>{alarm.timestamp}</span>}
// //                         </Alert>
// //                       )}</Box>
// //                     )}
// //                   </CardContent>
// //                 </Card>
// //               </Grid>
// //             )
// //           })}
// //         </Grid>
// //         {/* Add Fan Dialog */}
// //         {showAddFanDialog && (
// //           <Dialog open={addFanDialog} onClose={() => setAddFanDialog(false)}>
// //             <DialogTitle style={{ background: colors.surface, color: colors.text }}>Add New Fan</DialogTitle>
// //             <DialogContent style={{ background: colors.bg, color: colors.text }}>
// //               <TextField autoFocus margin="dense" label="Fan Name" fullWidth variant="outlined" value={newFanName} onChange={e => setNewFanName(e.target.value)} />
// //             </DialogContent>
// //             <DialogActions style={{ background: colors.surface }}>
// //               <Button onClick={() => setAddFanDialog(false)}>Cancel</Button>
// //               <Button onClick={addNewFan} variant="contained" style={{ background: primaryColor, color: "#fff" }}>Add Fan</Button>
// //             </DialogActions>
// //           </Dialog>
// //         )}
// //         {/* Fan Config Dialog */}
// //         {showFanConfigDialog && selectedFan && (
// //           <Dialog open={!!selectedFan} onClose={() => setSelectedFan(null)} maxWidth="sm" fullWidth>
// //             <DialogTitle style={{ background: colors.surface, color: colors.text }}>
// //               <Box display="flex" alignItems="center" gap={1}><Tune fontSize="small" />Configure {selectedFan.name}</Box>
// //             </DialogTitle>
// //             <DialogContent style={{ background: colors.bg, color: colors.text }}>
// //               <Grid container spacing={2}>
// //                 <Grid item xs={12}><TextField label="Fan Name" fullWidth value={selectedFan.name} onChange={e => setSelectedFan({ ...selectedFan, name: e.target.value })} /></Grid>
// //                 <Grid item xs={6}><TextField label="Maintenance Hours" type="number" fullWidth value={selectedFan.maintenanceHours} onChange={e => setSelectedFan({ ...selectedFan, maintenanceHours: Number.parseInt(e.target.value) })} /></Grid>
// //                 <Grid item xs={6}><TextField label="Last Maintenance" type="date" fullWidth value={selectedFan.lastMaintenance} onChange={e => setSelectedFan({ ...selectedFan, lastMaintenance: e.target.value })} /></Grid>
// //                 <Grid item xs={6}>
// //                   <FormControl fullWidth>
// //                     <InputLabel>Speed Unit</InputLabel>
// //                     <Select value={selectedFan.speedUnit} label="Speed Unit" onChange={e => setSelectedFan({ ...selectedFan, speedUnit: e.target.value })}>
// //                       {(speedUnits || DEFAULT_SPEED_UNITS).map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
// //                     </Select>
// //                   </FormControl>
// //                 </Grid>
// //                 <Grid item xs={6}>
// //                   <FormControl fullWidth>
// //                     <InputLabel>Temperature Unit</InputLabel>
// //                     <Select value={selectedFan.tempUnit} label="Temperature Unit" onChange={e => setSelectedFan({ ...selectedFan, tempUnit: e.target.value })}>
// //                       {(tempUnits || DEFAULT_TEMP_UNITS).map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
// //                     </Select>
// //                   </FormControl>
// //                 </Grid>
// //               </Grid>
// //             </DialogContent>
// //             <DialogActions style={{ background: colors.surface }}>
// //               <Button onClick={() => setSelectedFan(null)} style={{ color: primaryColor }}>Close</Button>
// //             </DialogActions>
// //           </Dialog>
// //         )}
// //       </CardContent>
// //     </Card>
// //   )
// // }

// // export default FanControlWidget

// // // // "use client"

// // // // import React, { useState, useEffect } from "react"
// // // // import {
// // // //   Card, CardContent, Typography, Button, Slider, Switch, Chip, Grid, Box, IconButton, Dialog, DialogTitle,
// // // //   DialogContent, DialogActions, TextField, Alert, Badge, MenuItem, Select, InputLabel, FormControl, Tooltip
// // // // } from "@mui/material"
// // // // import {
// // // //   PlayArrow, Stop, Settings, Warning, Error, CheckCircle, Thermostat, ElectricBolt, Schedule, Build,
// // // //   Add, Delete, Tune, Percent, RotateRight, Opacity, Star, StarBorder, ArrowUpward, ArrowDownward
// // // // } from "@mui/icons-material"
// // // // import { useTheme } from "../../theme/ThemeProvider"
// // // // import "../../../styles/fan-control-widget.css"

// // // // const DEFAULT_SPEED_UNITS = [
// // // //   { value: "%", label: "Percentage (%)", icon: <Percent fontSize="small" /> },
// // // //   { value: "RPM", label: "Rotation (RPM)", icon: <RotateRight fontSize="small" /> },
// // // // ]
// // // // const DEFAULT_TEMP_UNITS = [
// // // //   { value: "°C", label: "Celsius (°C)", icon: <Thermostat fontSize="small" /> },
// // // //   { value: "°F", label: "Fahrenheit (°F)", icon: <Thermostat fontSize="small" /> },
// // // //   { value: "K", label: "Kelvin (K)", icon: <Opacity fontSize="small" /> },
// // // // ]

// // // // const IMPORTANT_COLOR = "#bb9500"
// // // // const TREND_UP_COLOR = "#539150"
// // // // const TREND_DOWN_COLOR = "#bc3d3d"

// // // // const safe = (v, suffix = "") =>
// // // //   v === undefined || v === null || Number.isNaN(v) ? <span title="No data">--</span> : v + suffix

// // // // function buildFanCommandPayload(fanId, command, value) {
// // // //   return { fanId, command, ...(value !== undefined ? { value } : {}), ts: Date.now() }
// // // // }
// // // // function getTrend(prev, curr) {
// // // //   if (typeof prev !== "number" || typeof curr !== "number") return { trend: 0, delta: 0 }
// // // //   const trend = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0
// // // //   const delta = curr - prev
// // // //   return { trend, delta }
// // // // }

// // // // const FanControlWidget = ({
// // // //   fans = [],
// // // //   data = {},
// // // //   dataKeys = ["speed"],

// // // //   showStats = false,
// // // //   showAlarms = false,
// // // //   showAddFan = false,
// // // //   showDeleteFan = false,
// // // //   showEditFan = false,
// // // //   showFanConfigDialog = false,
// // // //   showAddFanDialog = false,
// // // //   showStartStop = false,
// // // //   showAllControl = false,
// // // //   showSpeedSet = false,
// // // //   showReset = false,
// // // //   showAutoMode = false,
// // // //   enableImportantFan = true,

// // // //   showTemperature = false,
// // // //   showPower = false,
// // // //   showRuntime = false,
// // // //   showMaintenance = false,

// // // //   minSpeed = 0,
// // // //   maxSpeedPercent = 100,
// // // //   maxSpeedRpm = 1800,
// // // //   speedUnits = DEFAULT_SPEED_UNITS,
// // // //   tempUnits = DEFAULT_TEMP_UNITS,

// // // //   onConfigChange,
// // // //   onControlChange,
// // // //   sendMqttCommand,
// // // //   ...props
// // // // }) => {
// // // //   const { isDarkMode, primaryColor } = useTheme()
// // // //   const [fanList, setFanList] = useState(fans)
// // // //   const [selectedFan, setSelectedFan] = useState(null)
// // // //   const [addFanDialog, setAddFanDialog] = useState(false)
// // // //   const [newFanName, setNewFanName] = useState("")
// // // //   const [importantMap, setImportantMap] = useState({})
// // // //   const [speedHistory, setSpeedHistory] = useState({})

// // // //   // Log incoming raw data each render or update
// // // //   useEffect(() => {
// // // //     console.log("[FanControlWidget] Incoming data:", data)
// // // //   }, [data])

// // // //   useEffect(() => {
// // // //     setFanList(fans)
// // // //     const newMap = {}
// // // //     fans.forEach(fan => { if (fan.important) newMap[fan.id] = true })
// // // //     setImportantMap(newMap)
// // // //   }, [fans])

// // // //   useEffect(() => {
// // // //     setSpeedHistory(prevHist => {
// // // //       const updated = { ...prevHist }
// // // //       fanList.forEach(fan => {
// // // //         const fanData = data[fan.id] || {}
// // // //         // Log per fan extracted data
// // // //         console.log(`[FanControlWidget] Data for fan ${fan.id}:`, fanData)

// // // //         const curr = fanData.speed !== undefined ? fanData.speed : fan.targetSpeed ?? 0
// // // //         if (!updated[fan.id]) updated[fan.id] = [curr, curr]
// // // //         else if (updated[fan.id][1] !== curr) updated[fan.id] = [updated[fan.id][1], curr]
// // // //       })
// // // //       return updated
// // // //     })
// // // //   }, [data, fanList])
// // // "use client"

// // // import React, { useState, useEffect } from "react"
// // // import {
// // //   Card, CardContent, Typography, Button, Slider, Switch, Chip, Grid, Box, IconButton, Dialog, DialogTitle,
// // //   DialogContent, DialogActions, TextField, Alert, Badge, MenuItem, Select, InputLabel, FormControl, Tooltip
// // // } from "@mui/material"
// // // import {
// // //   PlayArrow, Stop, Settings, Warning, Error, CheckCircle, Thermostat, ElectricBolt, Schedule, Build,
// // //   Add, Delete, Tune, Percent, RotateRight, Opacity, Star, StarBorder, ArrowUpward, ArrowDownward
// // // } from "@mui/icons-material"
// // // import { useTheme } from "../../theme/ThemeProvider"
// // // import "../../../styles/fan-control-widget.css"

// // // const DEFAULT_SPEED_UNITS = [
// // //   { value: "%", label: "Percentage (%)", icon: <Percent fontSize="small" /> },
// // //   { value: "RPM", label: "Rotation (RPM)", icon: <RotateRight fontSize="small" /> },
// // // ]
// // // const DEFAULT_TEMP_UNITS = [
// // //   { value: "°C", label: "Celsius (°C)", icon: <Thermostat fontSize="small" /> },
// // //   { value: "°F", label: "Fahrenheit (°F)", icon: <Thermostat fontSize="small" /> },
// // //   { value: "K", label: "Kelvin (K)", icon: <Opacity fontSize="small" /> },
// // // ]

// // // const IMPORTANT_COLOR = "#bb9500"
// // // const TREND_UP_COLOR = "#539150"
// // // const TREND_DOWN_COLOR = "#bc3d3d"

// // // const safe = (v, suffix = "") =>
// // //   v === undefined || v === null || Number.isNaN(v) ? <span title="No data">--</span> : v + suffix

// // // function buildFanCommandPayload(fanId, command, value) {
// // //   return { fanId, command, ...(value !== undefined ? { value } : {}), ts: Date.now() }
// // // }
// // // function getTrend(prev, curr) {
// // //   if (typeof prev !== "number" || typeof curr !== "number") return { trend: 0, delta: 0 }
// // //   const trend = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0
// // //   const delta = curr - prev
// // //   return { trend, delta }
// // // }

// // // const FanControlWidget = ({
// // //   fans = [],
// // //   data = {},
// // //   dataKeys = ["speed"],

// // //   showStats = false,
// // //   showAlarms = false,
// // //   showAddFan = false,
// // //   showDeleteFan = false,
// // //   showEditFan = false,
// // //   showFanConfigDialog = false,
// // //   showAddFanDialog = false,
// // //   showStartStop = false,
// // //   showAllControl = false,
// // //   showSpeedSet = false,
// // //   showReset = false,
// // //   showAutoMode = false,
// // //   enableImportantFan = true,

// // //   showTemperature = false,
// // //   showPower = false,
// // //   showRuntime = false,
// // //   showMaintenance = false,

// // //   minSpeed = 0,
// // //   maxSpeedPercent = 100,
// // //   maxSpeedRpm = 1800,
// // //   speedUnits = DEFAULT_SPEED_UNITS,
// // //   tempUnits = DEFAULT_TEMP_UNITS,

// // //   onConfigChange,
// // //   onControlChange,
// // //   sendMqttCommand,
// // //   ...props
// // // }) => {
// // //   const actualFanData = data?.fans_status ? data.fans_status : data
// // //   const { isDarkMode, primaryColor } = useTheme()
// // //   const [fanList, setFanList] = useState(fans)
// // //   const [selectedFan, setSelectedFan] = useState(null)
// // //   const [addFanDialog, setAddFanDialog] = useState(false)
// // //   const [newFanName, setNewFanName] = useState("")
// // //   const [importantMap, setImportantMap] = useState({})
// // //   const [speedHistory, setSpeedHistory] = useState({})

// // //   // Log incoming raw data each render or update
// // //   useEffect(() => {
// // //     console.log("[FanControlWidget] Incoming data:", data)
// // //   }, [data])

// // //   useEffect(() => {
// // //     setFanList(fans)
// // //     const newMap = {}
// // //     fans.forEach(fan => { if (fan.important) newMap[fan.id] = true })
// // //     setImportantMap(newMap)
// // //   }, [fans])

// // //   useEffect(() => {
// // //     setSpeedHistory(prevHist => {
// // //       const updated = { ...prevHist }
// // //       fanList.forEach(fan => {
// // //         const fanData = data[fan.id] || {}
// // //         console.log(`[FanControlWidget] Data for fan ${fan.id}:`, fanData)

// // //         const curr = fanData.speed !== undefined ? fanData.speed : fan.targetSpeed ?? 0
// // //         if (!updated[fan.id]) updated[fan.id] = [curr, curr]
// // //         else if (updated[fan.id][1] !== curr) updated[fan.id] = [updated[fan.id][1], curr]
// // //       })
// // //       return updated
// // //     })
// // //   }, [data, fanList])
// // //   const addNewFan = () => {
// // //     if (!newFanName.trim()) return
// // //     const newFan = {
// // //       id: `fan${Date.now()}`,
// // //       name: newFanName,
// // //       status: "stopped",
// // //       speed: 0,
// // //       targetSpeed: 0,
// // //       speedUnit: "%",
// // //       temperature: 25,
// // //       tempUnit: "°C",
// // //       power: 0,
// // //       runtime: 0,
// // //       maintenanceHours: 8760,
// // //       lastMaintenance: new Date().toISOString().split("T")[0],
// // //       autoMode: false,
// // //       alarms: [],
// // //       important: false,
// // //     }
// // //     setFanList(prev => [...prev, newFan])
// // //     setImportantMap(prev => ({ ...prev, [newFan.id]: false }))
// // //     setNewFanName("")
// // //     setAddFanDialog(false)
// // //     if (onConfigChange) onConfigChange([...fanList, newFan])
// // //   }

// // //   const deleteFan = (fanId) => {
// // //     setFanList(prev => prev.filter(f => f.id !== fanId))
// // //     setImportantMap(prev => {
// // //       const next = { ...prev }
// // //       delete next[fanId]
// // //       return next
// // //     })
// // //     setSpeedHistory(prev => {
// // //       const next = { ...prev }
// // //       delete next[fanId]
// // //       return next
// // //     })
// // //     if (onConfigChange) onConfigChange(fanList.filter(f => f.id !== fanId))
// // //   }

// // //   const handleToggleImportant = (fanId) => {
// // //     setImportantMap(prev => {
// // //       const updated = { ...prev, [fanId]: !prev[fanId] }
// // //       setFanList(list =>
// // //         list.map(fan => fan.id === fanId ? { ...fan, important: !prev[fanId] } : fan)
// // //       )
// // //       return updated
// // //     })
// // //   }

// // //   const handleFanControl = (fanId, action) => {
// // //     if (onControlChange) onControlChange(fanId, "action", action)
// // //     if (typeof sendMqttCommand === "function") {
// // //       sendMqttCommand(buildFanCommandPayload(fanId, action))
// // //     }
// // //   }
// // //   const handleSpeedChange = (fanId, value) => {
// // //     if (onControlChange) onControlChange(fanId, "targetSpeed", value)
// // //     if (typeof sendMqttCommand === "function") {
// // //       sendMqttCommand(buildFanCommandPayload(fanId, "set_speed", value))
// // //     }
// // //   }
// // //   const handleAutoModeToggle = (fanId, current) => {
// // //     if (onControlChange) onControlChange(fanId, "autoMode", !current)
// // //     if (typeof sendMqttCommand === "function") {
// // //       sendMqttCommand(buildFanCommandPayload(fanId, "auto_mode", !current))
// // //     }
// // //   }
// // //   const handleAllFans = (action) => {
// // //     fanList.forEach(fan => handleFanControl(fan.id, action))
// // //   }

// // //   function getLatestSpeed(fanId, fallback) {
// // //     if (actualFanData && typeof actualFanData === "object" && actualFanData[fanId] && actualFanData[fanId].speed !== undefined)
// // //       return actualFanData[fanId].speed
// // //     return fallback
// // //   }
// // //   function getFanStatus(fanId, fallback) {
// // //     if (actualFanData && typeof actualFanData === "object" && actualFanData[fanId]) {
// // //       const raw = actualFanData[fanId].status
// // //       if (raw === "on" || raw === true) return "Running"
// // //       if (raw === "off" || raw === false) return "Stopped"
// // //       if (typeof raw === "string") return raw.charAt(0).toUpperCase() + raw.slice(1)
// // //     }
// // //     if (typeof fallback === "string" && fallback.length > 0) {
// // //       return fallback.charAt(0).toUpperCase() + fallback.slice(1)
// // //     }
// // //     return "Unknown"
// // //   }
// // //   function getFanData(fanId) {
// // //     if (actualFanData && typeof actualFanData === "object" && actualFanData[fanId]) return actualFanData[fanId]
// // //     return {}
// // //   }

// // //   const themeColors = {
// // //     light: {
// // //       bg: "#fff",
// // //       bgElevated: "#fafbfc",
// // //       text: "#222",
// // //       textSecondary: "#444",
// // //       surface: "#f6f8fa",
// // //       accent: "#1667ff",
// // //       ok: "#4caf50",
// // //       warn: "#ff9800",
// // //       err: "#f44336",
// // //     },
// // //     dark: {
// // //       bg: "#141414",
// // //       bgElevated: "#000000",
// // //       text: "#fff",
// // //       textSecondary: "#bdbdbd",
// // //       surface: "#181818",
// // //       accent: "var(--primary-color, #1667ff)",
// // //       ok: "#4caf50",
// // //       warn: "#ff9800",
// // //       err: "#f44336",
// // //     }
// // //   }

// // //   const colors = themeColors[isDarkMode ? "dark" : "light"]

// // //   const getStatusColor = (status, important) =>
// // //     important ? IMPORTANT_COLOR : status === "Running" ? "#4caf50" : status === "Failed" ? "#f44336" : colors.cardBorder

// // //   const getStatusIcon = (fan) => {
// // //     const status = getFanStatus(fan.id, fan.status)
// // //     return status === "Running" ? <CheckCircle style={{ color: "#4caf50" }} />
// // //       : status === "Failed" ? <Error style={{ color: "#f44336" }} />
// // //         : <Stop style={{ color: colors.textSecondary }} />
// // //   }

// // //   const runningFans = fanList.filter(fan => getFanStatus(fan.id, fan.status) === "Running").length
// // //   const totalAlarms = fanList.reduce((sum, fan) => sum + (fan.alarms?.length || 0), 0)

// // //   return (
// // //     <Card
// // //       className={`fan-control-widget ${isDarkMode ? "fan-widget-dark" : ""}`}
// // //       style={{
// // //         color: colors.text,
// // //         minWidth: 340,
// // //         maxWidth: "100%",
// // //         boxSizing: "border-box",
// // //       }}
// // //       elevation={0}
// // //     >
// // //       <CardContent style={{ background: colors.bg }}>
// // //         <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
// // //           <Box minWidth={0}>
// // //             <Typography variant="h6" sx={{
// // //               color: primaryColor,
// // //               fontWeight: 700,
// // //               letterSpacing: 0.2,
// // //               whiteSpace: "nowrap",
// // //               overflow: "hidden",
// // //               textOverflow: "ellipsis",
// // //               maxWidth: 240
// // //             }}>
// // //               {props.title}
// // //             </Typography>
// // //             <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 500 }}>
// // //               System Status: <b style={{ color: runningFans === fanList.length ? "#388e3c" : runningFans > 0 ? "#fa8c16" : "#d32f2f" }}>
// // //                 {runningFans === fanList.length ? "All Running" : runningFans > 0 ? `${runningFans} Running` : "All Stopped"}
// // //               </b> ({fanList.length} Fans)
// // //             </Typography>
// // //           </Box>
// // //           <Box display="flex" gap={1}>
// // //             {showStats && (
// // //               <Chip label={`${runningFans}/${fanList.length} Running`} color={runningFans > 0 ? "success" : "default"} size="small" />
// // //             )}
// // //             {showAlarms && totalAlarms > 0 && (
// // //               <Badge badgeContent={totalAlarms} color="error">
// // //                 <Warning color="warning" />
// // //               </Badge>
// // //             )}
// // //             {showAddFan && (
// // //               <IconButton size="small" onClick={() => setAddFanDialog(true)} style={{ color: primaryColor }}>
// // //                 <Add />
// // //               </IconButton>
// // //             )}
// // //           </Box>
// // //         </Box>

// // //         {showAllControl && (
// // //           <Box mb={2} display="flex" gap={2} flexWrap="wrap">
// // //             <Button
// // //               variant="outlined"
// // //               sx={{
// // //                 borderColor: "#539150",
// // //                 color: "#539150",
// // //               }}
// // //               startIcon={<PlayArrow />}
// // //               size="small"
// // //               onClick={() => handleAllFans("start")}
// // //             >
// // //               Start All
// // //             </Button>
// // //             <Button
// // //               variant="outlined"
// // //               sx={{
// // //                 borderColor: "#bc3d3d",
// // //                 color: "#bc3d3d",
// // //               }}
// // //               startIcon={<Stop />}
// // //               size="small"
// // //               onClick={() => handleAllFans("stop")}
// // //             >
// // //               Stop All
// // //             </Button>
// // //           </Box>
// // //         )}

// // //         <Grid container spacing={2} alignItems="stretch">
// // //           {fanList.map((fan) => {
// // //             const fanData = getFanData(fan.id)
// // //             const status = getFanStatus(fan.id, fan.status)
// // //             const speed = getLatestSpeed(fan.id, fan.targetSpeed ?? 0)
// // //             const isSpinning = status === "Running" && speed > 0
// // //             const important = !!importantMap[fan.id]
// // //             const [prevSpeed, currSpeed] = speedHistory[fan.id] || [speed, speed]
// // //             const { trend, delta } = getTrend(prevSpeed, currSpeed)
// // //             const speedUnit = fan.speedUnit || "%"

// // //             // Log each fan's data during rendering
// // //             console.log(`[FanControlWidget] Rendering fan ${fan.id} data:`, fanData)

// // //             const showControls = showStartStop || showAutoMode || showReset || showSpeedSet
// // //             const showDetails = true

// // //             return (
// // //               <Grid
// // //                 item
// // //                 xs={12}
// // //                 sm={12}
// // //                 md={6}
// // //                 lg={6}
// // //                 xl={6}
// // //                 key={fan.id}
// // //               >
// // //                 <Card
// // //                   variant="outlined"
// // //                   className={`fan-card ${status.toLowerCase()} ${isSpinning ? "spinning" : ""} ${important ? "important-fan" : ""} ${isDarkMode ? "fan-card-dark" : ""}`}
// // //                   style={{
// // //                     background: colors.bgElevated,
// // //                     color: colors.text,
// // //                     display: "flex",
// // //                     flexDirection: "column",
// // //                     justifyContent: "stretch",
// // //                   }}
// // //                 >
// // //                   <CardContent style={{ flex: 1, display: "flex", flexDirection: "column" }}>
// // //                     {/* Header */}
// // //                     <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
// // //                       <Box display="flex" alignItems="center" gap={1}>
// // //                         {enableImportantFan && (
// // //                           <Tooltip title={important ? "Important Fan" : "Mark as Important"}>
// // //                             <IconButton
// // //                               size="small"
// // //                               aria-label={important ? "Unmark important" : "Mark important"}
// // //                               onClick={() => handleToggleImportant(fan.id)}
// // //                               style={{ color: important ? IMPORTANT_COLOR : "#bbb", marginRight: 2 }}>
// // //                               {important ? <Star /> : <StarBorder />}
// // //                             </IconButton>
// // //                           </Tooltip>
// // //                         )}
// // //                         <Box>
// // //                           <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.text, maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
// // //                             {fan.name}
// // //                           </Typography>
// // //                           <Typography variant="caption" sx={{ color: colors.textSecondary }}>
// // //                             Fan ID: <b>{fan.id}</b>
// // //                             {" | Status: "}
// // //                             <b style={{
// // //                               color:
// // //                                 status === "Running"
// // //                                   ? "#2e7d32"
// // //                                   : status === "Stopped"
// // //                                     ? "#d32f2f"
// // //                                     : status === "Failed"
// // //                                       ? "#f44336"
// // //                                       : colors.textSecondary,
// // //                             }}>
// // //                               {status}
// // //                             </b>
// // //                             {important && (
// // //                               <span style={{
// // //                                 background: IMPORTANT_COLOR,
// // //                                 color: "#fff",
// // //                                 fontWeight: 600,
// // //                                 borderRadius: 6,
// // //                                 fontSize: 11,
// // //                                 padding: "2px 7px",
// // //                                 marginLeft: 7
// // //                               }}>
// // //                                 Important
// // //                               </span>
// // //                             )}
// // //                           </Typography>
// // //                         </Box>
// // //                       </Box>
// // //                       <Box display="flex" alignItems="center" gap={1}>
// // //                         {getStatusIcon(fan)}
// // //                         {showEditFan && (
// // //                           <IconButton size="small" onClick={() => setSelectedFan(fan)} style={{ color: primaryColor }}>
// // //                             <Settings />
// // //                           </IconButton>
// // //                         )}
// // //                         {showDeleteFan && (
// // //                           <IconButton size="small" onClick={() => deleteFan(fan.id)} color="error">
// // //                             <Delete />
// // //                           </IconButton>
// // //                         )}
// // //                       </Box>
// // //                     </Box>

// // //                     {/* Trend/RPM info, always on top, industry format */}
// // //                     <Box display="flex" alignItems="center" gap={2} mb={1}>
// // //                       <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text }}>
// // //                         Live Speed: {safe(speed, " " + speedUnit)}
// // //                       </Typography>
// // //                       {trend !== 0 && (
// // //                         <Box display="flex" alignItems="center" gap={0.5}>
// // //                           {trend > 0 ? (
// // //                             <span style={{ color: TREND_UP_COLOR, fontWeight: 600 }}>
// // //                               <ArrowUpward fontSize="small" /> +{trend.toFixed(1)}%
// // //                             </span>
// // //                           ) : (
// // //                             <span style={{ color: TREND_DOWN_COLOR, fontWeight: 600 }}>
// // //                               <ArrowDownward fontSize="small" /> {trend.toFixed(1)}%
// // //                             </span>
// // //                           )}
// // //                         </Box>
// // //                       )}
// // //                       {delta !== 0 && (
// // //                         <Typography variant="caption" sx={{ color: "#aaa" }}>
// // //                           Δ {delta > 0 ? "+" : ""}{delta.toFixed(1)} {speedUnit}
// // //                         </Typography>
// // //                       )}
// // //                     </Box>

// // //                     {/* Fan Animation */}
// // //                     <Box display="flex" justifyContent="center" mb={showControls ? 2 : 1}>
// // //                       <div className={`fan-blade ${isSpinning ? "spinning" : ""} ${isDarkMode ? "blade-dark" : ""}`}
// // //                         style={{ animationDuration: isSpinning ? `${2 - Math.min(1.99, speed / 50)}s` : "0s" }}>
// // //                         <div className="fan-center"></div>
// // //                         <div className="blade" style={{ transform: "rotate(0deg)" }}></div>
// // //                         <div className="blade" style={{ transform: "rotate(90deg)" }}></div>
// // //                         <div className="blade" style={{ transform: "rotate(180deg)" }}></div>
// // //                         <div className="blade" style={{ transform: "rotate(270deg)" }}></div>
// // //                       </div>
// // //                     </Box>

// // //                     {showControls && (
// // //                       <>
// // //                         {(showStartStop || showAutoMode || showReset) && (
// // //                           <Box mb={2}>
// // //                             {showStartStop && (
// // //                               <Box display="flex" gap={1} mb={1}>
// // //                                 <Button size="small" startIcon={<PlayArrow />} onClick={() => handleFanControl(fan.id, "start")} disabled={status === "Failed"} variant="outlined" color="success">Start</Button>
// // //                                 <Button size="small" startIcon={<Stop />} onClick={() => handleFanControl(fan.id, "stop")} variant="outlined" color="error">Stop</Button>
// // //                                 {showReset && status === "Failed" && (
// // //                                   <Button size="small" onClick={() => handleFanControl(fan.id, "reset")} variant="outlined">Reset</Button>
// // //                                 )}
// // //                               </Box>
// // //                             )}
// // //                             {showAutoMode && (
// // //                               <Box display="flex" alignItems="center" gap={1} mb={1}>
// // //                                 <Typography variant="caption" style={{ color: colors.textSecondary }}>Auto Mode:</Typography>
// // //                                 <Switch size="small" checked={fan.autoMode} onChange={() => handleAutoModeToggle(fan.id, fan.autoMode)} />
// // //                               </Box>
// // //                             )}
// // //                           </Box>
// // //                         )}
// // //                         {showSpeedSet && (
// // //                           <Box mb={2}>
// // //                             <Typography variant="caption" gutterBottom style={{ color: colors.textSecondary }}>
// // //                               Speed: {safe(speed, " " + speedUnit)}
// // //                             </Typography>
// // //                             <Slider
// // //                               value={Number.isFinite(speed) ? speed : 0}
// // //                               onChange={(e, value) => handleSpeedChange(fan.id, value)}
// // //                               disabled={status === "Failed"}
// // //                               min={minSpeed}
// // //                               max={speedUnit === "RPM" ? maxSpeedRpm : maxSpeedPercent}
// // //                               size="small"
// // //                               sx={{
// // //                                 color: primaryColor,
// // //                                 '& .MuiSlider-rail': { backgroundColor: isDarkMode ? "#222" : "#eee" },
// // //                               }}
// // //                             />
// // //                           </Box>
// // //                         )}
// // //                       </>
// // //                     )}

// // //                     {showDetails && (
// // //                       <Grid container spacing={1} sx={{ mt: 1 }}>
// // //                         {showTemperature && (
// // //                           <Grid item xs={6}>
// // //                             <Box display="flex" alignItems="center" gap={0.5}>
// // //                               <Thermostat fontSize="small" />
// // //                               <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // //                                 {safe(fanData.temperature ?? fan.temperature, fan.tempUnit)}
// // //                               </Typography>
// // //                             </Box>
// // //                           </Grid>
// // //                         )}
// // //                         {showPower && (
// // //                           <Grid item xs={6}>
// // //                             <Box display="flex" alignItems="center" gap={0.5}>
// // //                               <ElectricBolt fontSize="small" />
// // //                               <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // //                                 {safe(fanData.power ?? fan.power, "W")}
// // //                               </Typography>
// // //                             </Box>
// // //                           </Grid>
// // //                         )}
// // //                         {showRuntime && (
// // //                           <Grid item xs={6}>
// // //                             <Box display="flex" alignItems="center" gap={0.5}>
// // //                               <Schedule fontSize="small" />
// // //                               <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // //                                 {safe((fanData.runtime ?? fan.runtime)?.toFixed(1), "h")}
// // //                               </Typography>
// // //                             </Box>
// // //                           </Grid>
// // //                         )}
// // //                         {showMaintenance && (
// // //                           <Grid item xs={6}>
// // //                             <Box display="flex" alignItems="center" gap={0.5}>
// // //                               <Build fontSize="small" />
// // //                               <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // //                                 {safe(Math.max(0, (fan.maintenanceHours ?? 0) - (fanData.runtime ?? fan.runtime ?? 0)).toFixed(0), "h")}
// // //                               </Typography>
// // //                             </Box>
// // //                           </Grid>
// // //                         )}
// // //                       </Grid>
// // //                     )}
// // //                     {showAlarms && fan.alarms && fan.alarms.length > 0 && (
// // //                       <Box mt={1}>{fan.alarms.map((alarm, i) =>
// // //                         <Alert key={i} severity={alarm.type} size="small" style={{ marginBottom: 4 }}>{alarm.message}</Alert>
// // //                       )}</Box>
// // //                     )}
// // //                   </CardContent>
// // //                 </Card>
// // //               </Grid>
// // //             )
// // //           })}
// // //         </Grid>

// // //         {/* Add Fan Dialog */}
// // //         {showAddFanDialog && (
// // //           <Dialog open={addFanDialog} onClose={() => setAddFanDialog(false)}>
// // //             <DialogTitle style={{ background: colors.surface, color: colors.text }}>Add New Fan</DialogTitle>
// // //             <DialogContent style={{ background: colors.bg, color: colors.text }}>
// // //               <TextField autoFocus margin="dense" label="Fan Name" fullWidth variant="outlined" value={newFanName} onChange={e => setNewFanName(e.target.value)} />
// // //             </DialogContent>
// // //             <DialogActions style={{ background: colors.surface }}>
// // //               <Button onClick={() => setAddFanDialog(false)}>Cancel</Button>
// // //               <Button onClick={addNewFan} variant="contained" style={{ background: primaryColor, color: "#fff" }}>Add Fan</Button>
// // //             </DialogActions>
// // //           </Dialog>
// // //         )}

// // //         {/* Fan Config Dialog */}
// // //         {showFanConfigDialog && selectedFan && (
// // //           <Dialog open={!!selectedFan} onClose={() => setSelectedFan(null)} maxWidth="sm" fullWidth>
// // //             <DialogTitle style={{ background: colors.surface, color: colors.text }}>
// // //               <Box display="flex" alignItems="center" gap={1}><Tune fontSize="small" />Configure {selectedFan.name}</Box>
// // //             </DialogTitle>
// // //             <DialogContent style={{ background: colors.bg, color: colors.text }}>
// // //               <Grid container spacing={2}>
// // //                 <Grid item xs={12}><TextField label="Fan Name" fullWidth value={selectedFan.name} onChange={e => setSelectedFan({ ...selectedFan, name: e.target.value })} /></Grid>
// // //                 <Grid item xs={6}><TextField label="Maintenance Hours" type="number" fullWidth value={selectedFan.maintenanceHours} onChange={e => setSelectedFan({ ...selectedFan, maintenanceHours: Number.parseInt(e.target.value) })} /></Grid>
// // //                 <Grid item xs={6}><TextField label="Last Maintenance" type="date" fullWidth value={selectedFan.lastMaintenance} onChange={e => setSelectedFan({ ...selectedFan, lastMaintenance: e.target.value })} /></Grid>
// // //                 <Grid item xs={6}>
// // //                   <FormControl fullWidth>
// // //                     <InputLabel>Speed Unit</InputLabel>
// // //                     <Select value={selectedFan.speedUnit} label="Speed Unit" onChange={e => setSelectedFan({ ...selectedFan, speedUnit: e.target.value })}>
// // //                       {(speedUnits || DEFAULT_SPEED_UNITS).map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
// // //                     </Select>
// // //                   </FormControl>
// // //                 </Grid>
// // //                 <Grid item xs={6}>
// // //                   <FormControl fullWidth>
// // //                     <InputLabel>Temperature Unit</InputLabel>
// // //                     <Select value={selectedFan.tempUnit} label="Temperature Unit" onChange={e => setSelectedFan({ ...selectedFan, tempUnit: e.target.value })}>
// // //                       {(tempUnits || DEFAULT_TEMP_UNITS).map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
// // //                     </Select>
// // //                   </FormControl>
// // //                 </Grid>
// // //               </Grid>
// // //             </DialogContent>
// // //             <DialogActions style={{ background: colors.surface }}>
// // //               <Button onClick={() => setSelectedFan(null)} style={{ color: primaryColor }}>Close</Button>
// // //             </DialogActions>
// // //           </Dialog>
// // //         )}
// // //       </CardContent>
// // //     </Card>
// // //   )
// // // }

// // // export default FanControlWidget

// // // // import { useState, useEffect } from "react"
// // // // import {
// // // //   Card, CardContent, Typography, Button, Slider, Switch, Chip, Grid, Box, IconButton, Dialog, DialogTitle,
// // // //   DialogContent, DialogActions, TextField, Alert, Badge, MenuItem, Select, InputLabel, FormControl, Tooltip
// // // // } from "@mui/material"
// // // // import {
// // // //   PlayArrow, Stop, Settings, Warning, Error, CheckCircle, Thermostat, ElectricBolt, Schedule, Build,
// // // //   Add, Delete, Tune, Percent, RotateRight, Opacity, Star, StarBorder, ArrowUpward, ArrowDownward
// // // // } from "@mui/icons-material"
// // // // import { useTheme } from "../../theme/ThemeProvider"
// // // // import "../../../styles/fan-control-widget.css"

// // // // const DEFAULT_SPEED_UNITS = [
// // // //   { value: "%", label: "Percentage (%)", icon: <Percent fontSize="small" /> },
// // // //   { value: "RPM", label: "Rotation (RPM)", icon: <RotateRight fontSize="small" /> },
// // // // ]
// // // // const DEFAULT_TEMP_UNITS = [
// // // //   { value: "°C", label: "Celsius (°C)", icon: <Thermostat fontSize="small" /> },
// // // //   { value: "°F", label: "Fahrenheit (°F)", icon: <Thermostat fontSize="small" /> },
// // // //   { value: "K", label: "Kelvin (K)", icon: <Opacity fontSize="small" /> },
// // // // ]

// // // // // const IMPORTANT_COLOR = "#FFB300"
// // // // // const TREND_UP_COLOR = "#2e7d32"
// // // // // const TREND_DOWN_COLOR = "#cf1322"
// // // // const IMPORTANT_COLOR = "#bb9500" // Muted industrial gold, not bright yellow
// // // // const TREND_UP_COLOR = "#539150"  // Soft green, not neon
// // // // const TREND_DOWN_COLOR = "#bc3d3d" // Soft red, not alarm red


// // // // const safe = (v, suffix = "") =>
// // // //   v === undefined || v === null || Number.isNaN(v) ? <span title="No data">--</span> : v + suffix

// // // // function buildFanCommandPayload(fanId, command, value) {
// // // //   return { fanId, command, ...(value !== undefined ? { value } : {}), ts: Date.now() }
// // // // }
// // // // function getTrend(prev, curr) {
// // // //   if (typeof prev !== "number" || typeof curr !== "number") return { trend: 0, delta: 0 }
// // // //   const trend = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0
// // // //   const delta = curr - prev
// // // //   return { trend, delta }
// // // // }

// // // // const FanControlWidget = ({
// // // //   fans = [],
// // // //   data = {},
// // // //   dataKeys = ["speed"],

// // // //   showStats = false,
// // // //   showAlarms = false,
// // // //   showAddFan = false,
// // // //   showDeleteFan = false,
// // // //   showEditFan = false,
// // // //   showFanConfigDialog = false,
// // // //   showAddFanDialog = false,
// // // //   showStartStop = false,
// // // //   showAllControl = false,
// // // //   showSpeedSet = false,
// // // //   showReset = false,
// // // //   showAutoMode = false,
// // // //   enableImportantFan = true,

// // // //   showTemperature = false,
// // // //   showPower = false,
// // // //   showRuntime = false,
// // // //   showMaintenance = false,

// // // //   minSpeed = 0,
// // // //   maxSpeedPercent = 100,
// // // //   maxSpeedRpm = 1800,
// // // //   speedUnits = DEFAULT_SPEED_UNITS,
// // // //   tempUnits = DEFAULT_TEMP_UNITS,

// // // //   onConfigChange,
// // // //   onControlChange,
// // // //   sendMqttCommand,
// // // //   ...props
// // // // }) => {
// // // //   const { isDarkMode, primaryColor } = useTheme()
// // // //   const [fanList, setFanList] = useState(fans)
// // // //   const [selectedFan, setSelectedFan] = useState(null)
// // // //   const [addFanDialog, setAddFanDialog] = useState(false)
// // // //   const [newFanName, setNewFanName] = useState("")
// // // //   const [importantMap, setImportantMap] = useState({})
// // // //   const [speedHistory, setSpeedHistory] = useState({})

// // // //   useEffect(() => {
// // // //     setFanList(fans)
// // // //     const newMap = {}
// // // //     fans.forEach(fan => { if (fan.important) newMap[fan.id] = true })
// // // //     setImportantMap(newMap)
// // // //   }, [fans])

// // // //   useEffect(() => {
// // // //     setSpeedHistory(prevHist => {
// // // //       const updated = { ...prevHist }
// // // //       fanList.forEach(fan => {
// // // //         const fanData = data[fan.id] || {}
// // // //         const curr = fanData.speed !== undefined ? fanData.speed : fan.targetSpeed ?? 0
// // // //         if (!updated[fan.id]) updated[fan.id] = [curr, curr]
// // // //         else if (updated[fan.id][1] !== curr) updated[fan.id] = [updated[fan.id][1], curr]
// // // //       })
// // // //       return updated
// // // //     })
// // // //   }, [data, fanList])

// // // //   const addNewFan = () => {
// // // //     if (!newFanName.trim()) return
// // // //     const newFan = {
// // // //       id: `fan${Date.now()}`,
// // // //       name: newFanName,
// // // //       status: "stopped",
// // // //       speed: 0,
// // // //       targetSpeed: 0,
// // // //       speedUnit: "%",
// // // //       temperature: 25,
// // // //       tempUnit: "°C",
// // // //       power: 0,
// // // //       runtime: 0,
// // // //       maintenanceHours: 8760,
// // // //       lastMaintenance: new Date().toISOString().split("T")[0],
// // // //       autoMode: false,
// // // //       alarms: [],
// // // //       important: false,
// // // //     }
// // // //     setFanList(prev => [...prev, newFan])
// // // //     setImportantMap(prev => ({ ...prev, [newFan.id]: false }))
// // // //     setNewFanName("")
// // // //     setAddFanDialog(false)
// // // //     if (onConfigChange) onConfigChange([...fanList, newFan])
// // // //   }

// // // //   const deleteFan = (fanId) => {
// // // //     setFanList(prev => prev.filter(f => f.id !== fanId))
// // // //     setImportantMap(prev => {
// // // //       const next = { ...prev }
// // // //       delete next[fanId]
// // // //       return next
// // // //     })
// // // //     setSpeedHistory(prev => {
// // // //       const next = { ...prev }
// // // //       delete next[fanId]
// // // //       return next
// // // //     })
// // // //     if (onConfigChange) onConfigChange(fanList.filter(f => f.id !== fanId))
// // // //   }

// // // //   const handleToggleImportant = (fanId) => {
// // // //     setImportantMap(prev => {
// // // //       const updated = { ...prev, [fanId]: !prev[fanId] }
// // // //       setFanList(list =>
// // // //         list.map(fan => fan.id === fanId ? { ...fan, important: !prev[fanId] } : fan)
// // // //       )
// // // //       return updated
// // // //     })
// // // //   }

// // // //   const handleFanControl = (fanId, action) => {
// // // //     if (onControlChange) onControlChange(fanId, "action", action)
// // // //     if (typeof sendMqttCommand === "function") {
// // // //       sendMqttCommand(buildFanCommandPayload(fanId, action))
// // // //     }
// // // //   }
// // // //   const handleSpeedChange = (fanId, value) => {
// // // //     if (onControlChange) onControlChange(fanId, "targetSpeed", value)
// // // //     if (typeof sendMqttCommand === "function") {
// // // //       sendMqttCommand(buildFanCommandPayload(fanId, "set_speed", value))
// // // //     }
// // // //   }
// // // //   const handleAutoModeToggle = (fanId, current) => {
// // // //     if (onControlChange) onControlChange(fanId, "autoMode", !current)
// // // //     if (typeof sendMqttCommand === "function") {
// // // //       sendMqttCommand(buildFanCommandPayload(fanId, "auto_mode", !current))
// // // //     }
// // // //   }
// // // //   const handleAllFans = (action) => {
// // // //     fanList.forEach(fan => handleFanControl(fan.id, action))
// // // //   }

// // // //   function getLatestSpeed(fanId, fallback) {
// // // //     if (data && typeof data === "object" && data[fanId] && data[fanId].speed !== undefined) return data[fanId].speed
// // // //     return fallback
// // // //   }
// // // //   function getFanStatus(fanId, fallback) {
// // // //     if (data && typeof data === "object" && data[fanId]) {
// // // //       const raw = data[fanId].status
// // // //       if (raw === "on" || raw === true) return "Running"
// // // //       if (raw === "off" || raw === false) return "Stopped"
// // // //       if (typeof raw === "string") return raw.charAt(0).toUpperCase() + raw.slice(1)
// // // //     }
// // // //     if (typeof fallback === "string" && fallback.length > 0) {
// // // //       return fallback.charAt(0).toUpperCase() + fallback.slice(1)
// // // //     }
// // // //     return "Unknown"
// // // //   }
// // // //   function getFanData(fanId) {
// // // //     if (data && typeof data === "object" && data[fanId]) return data[fanId]
// // // //     return {}
// // // //   }

// // // //   // const themeColors = {
// // // //   //   light: { bg: "#fff", bgElevated: "#fafbfc", cardBorder: "#e0e0e0", text: "#222", textSecondary: "#444", surface: "#f6f8fa", },
// // // //   //   dark: { bg: "#141414", bgElevated: "#23272f", cardBorder: "#24272b", text: "#fff", textSecondary: "#bbb", surface: "#181c23", }
// // // //   // }
// // // //   const themeColors = {
// // // //     light: {
// // // //       bg: "#fff",                        // Body/Root
// // // //       bgElevated: "#fafbfc",             // Card, Modal, Drawer
// // // //       // cardBorder: "#e0e0e0",
// // // //       text: "#222",
// // // //       textSecondary: "#444",
// // // //       surface: "#f6f8fa",                // Panels, Sub-surfaces
// // // //       accent: "#1667ff",                 // Default primary
// // // //       ok: "#4caf50",
// // // //       warn: "#ff9800",
// // // //       err: "#f44336",
// // // //     },
// // // //     dark: {
// // // //       bg: "#141414",                     // Body/Root, matches dashboard
// // // //       // bgElevated: "#171717",             // Card, Modal, Drawer (deeper than before)
// // // //       bgElevated: "#000000",
// // // //       // cardBorder: "#181818",             // For crisp, minimal contrast
// // // //       text: "#fff",
// // // //       textSecondary: "#bdbdbd",          // Slightly lighter for pure dark
// // // //       surface: "#181818",                // Panels, inner containers
// // // //       accent: "var(--primary-color, #1667ff)", // Uses theme primary if set
// // // //       ok: "#4caf50",
// // // //       warn: "#ff9800",
// // // //       err: "#f44336",
// // // //     }
// // // //   }

// // // //   const colors = themeColors[isDarkMode ? "dark" : "light"]

// // // //   const getStatusColor = (status, important) =>
// // // //     important ? IMPORTANT_COLOR : status === "Running" ? "#4caf50" : status === "Failed" ? "#f44336" : colors.cardBorder

// // // //   const getStatusIcon = (fan) => {
// // // //     const status = getFanStatus(fan.id, fan.status)
// // // //     return status === "Running" ? <CheckCircle style={{ color: "#4caf50" }} />
// // // //       : status === "Failed" ? <Error style={{ color: "#f44336" }} />
// // // //         : <Stop style={{ color: colors.textSecondary }} />
// // // //   }

// // // //   const runningFans = fanList.filter(fan => getFanStatus(fan.id, fan.status) === "Running").length
// // // //   const totalAlarms = fanList.reduce((sum, fan) => sum + (fan.alarms?.length || 0), 0)

// // // //   // MAIN RENDER
// // // //   return (
// // // //     <Card
// // // //       className={`fan-control-widget ${isDarkMode ? "fan-widget-dark" : ""}`}
// // // //       style={{
// // // //         // background: colors.bg,
// // // //         color: colors.text,
// // // //         // borderRadius: 12,
// // // //         minWidth: 340, // aligns with AntD/MUI card default
// // // //         maxWidth: "100%",
// // // //         boxSizing: "border-box",
// // // //         // margin: "0 auto",
// // // //         // boxShadow: isDarkMode ? "0 2px 8px #0a0a0a88" : "0 2px 8px #dadada33"
// // // //       }}
// // // //       elevation={0}
// // // //     >
// // // //       <CardContent style={{ background: colors.bg  }}> 
// // // //         {/* padding: "22px 20px 18px 20px"  */}
// // // //         <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
// // // //           <Box minWidth={0}>
// // // //             <Typography variant="h6" sx={{
// // // //               color: primaryColor,
// // // //               fontWeight: 700,
// // // //               letterSpacing: 0.2,
// // // //               whiteSpace: "nowrap",
// // // //               overflow: "hidden",
// // // //               textOverflow: "ellipsis",
// // // //               maxWidth: 240
// // // //             }}>
// // // //               {props.title}
// // // //             </Typography>
// // // //             <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 500 }}>
// // // //               System Status: <b style={{ color: runningFans === fanList.length ? "#388e3c" : runningFans > 0 ? "#fa8c16" : "#d32f2f" }}>
// // // //                 {runningFans === fanList.length ? "All Running" : runningFans > 0 ? `${runningFans} Running` : "All Stopped"}
// // // //               </b> ({fanList.length} Fans)
// // // //             </Typography>
// // // //           </Box>
// // // //           <Box display="flex" gap={1}>
// // // //             {showStats && (
// // // //               <Chip label={`${runningFans}/${fanList.length} Running`} color={runningFans > 0 ? "success" : "default"} size="small" />
// // // //             )}
// // // //             {showAlarms && totalAlarms > 0 && (
// // // //               <Badge badgeContent={totalAlarms} color="error">
// // // //                 <Warning color="warning" />
// // // //               </Badge>
// // // //             )}
// // // //             {showAddFan && (
// // // //               <IconButton size="small" onClick={() => setAddFanDialog(true)} style={{ color: primaryColor }}>
// // // //                 <Add />
// // // //               </IconButton>
// // // //             )}
// // // //           </Box>
// // // //         </Box>

// // // //         {showAllControl && (
// // // //           <Box mb={2} display="flex" gap={2} flexWrap="wrap">
// // // //             {/* <Button variant="contained" color="success" startIcon={<PlayArrow />} size="small"
// // // //               onClick={() => handleAllFans("start")}>Start All</Button>
// // // //             <Button variant="contained" color="error" startIcon={<Stop />} size="small"
// // // //               onClick={() => handleAllFans("stop")}>Stop All</Button> */}
// // // //               <Button
// // // //                 variant="outlined"
// // // //                 sx={{
// // // //                   borderColor: "#539150",
// // // //                   color: "#539150",
// // // //                   // '&:hover': { background: 'rgba(83,145,80,0.1)' }
// // // //                 }}
// // // //                 startIcon={<PlayArrow />}
// // // //                 size="small"
// // // //                 onClick={() => handleAllFans("start")}
// // // //               >
// // // //                 Start All
// // // //               </Button>
// // // //               <Button
// // // //                 variant="outlined"
// // // //                 sx={{
// // // //                   borderColor: "#bc3d3d",
// // // //                   color: "#bc3d3d",
// // // //                   // '&:hover': { background: 'rgba(188,61,61,0.1)' }
// // // //                 }}
// // // //                 startIcon={<Stop />}
// // // //                 size="small"
// // // //                 onClick={() => handleAllFans("stop")}
// // // //               >
// // // //                 Stop All
// // // //               </Button>

// // // //           </Box>
// // // //         )}

// // // //         <Grid container spacing={2} alignItems="stretch">
// // // //           {fanList.map((fan) => {
// // // //             const fanData = getFanData(fan.id)
// // // //             const status = getFanStatus(fan.id, fan.status)
// // // //             const speed = getLatestSpeed(fan.id, fan.targetSpeed ?? 0)
// // // //             const isSpinning = status === "Running" && speed > 0
// // // //             const important = !!importantMap[fan.id]
// // // //             const [prevSpeed, currSpeed] = speedHistory[fan.id] || [speed, speed]
// // // //             const { trend, delta } = getTrend(prevSpeed, currSpeed)
// // // //             const speedUnit = fan.speedUnit || "%"

// // // //             const showControls = showStartStop || showAutoMode || showReset || showSpeedSet
// // // //             const showDetails = true

// // // //             return (
// // // //               <Grid
// // // //                 item
// // // //                 xs={12}
// // // //                 sm={12}
// // // //                 md={6}
// // // //                 lg={6}
// // // //                 xl={6}
// // // //                 key={fan.id}
// // // //                 style={{
// // // //                   // minWidth: 300,
// // // //                   // maxWidth: "100%",
// // // //                   // display: "flex",
// // // //                 }}
// // // //               >
// // // //                 <Card
// // // //                   variant="outlined"
// // // //                   className={`fan-card ${status.toLowerCase()} ${isSpinning ? "spinning" : ""} ${important ? "important-fan" : ""} ${isDarkMode ? "fan-card-dark" : ""}`}
// // // //                   style={{
// // // //                     // borderColor: getStatusColor(status, important),
// // // //                     background: colors.bgElevated,
// // // //                     color: colors.text,
// // // //                     // borderWidth: important ? 3 : 1,
// // // //                     // width: "100%",
// // // //                     // minWidth: 0,
// // // //                     // margin: "0",
// // // //                     display: "flex",
// // // //                     flexDirection: "column",
// // // //                     justifyContent: "stretch",
// // // //                   }}
// // // //                 >
// // // //                   <CardContent style={{ /* padding: "18px 18px 12px 18px",*/ flex: 1, display: "flex", flexDirection: "column" }}>
// // // //                     {/* Header */}
// // // //                     <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
// // // //                       <Box display="flex" alignItems="center" gap={1}>
// // // //                         {enableImportantFan && (
// // // //                           <Tooltip title={important ? "Important Fan" : "Mark as Important"}>
// // // //                             <IconButton
// // // //                               size="small"
// // // //                               aria-label={important ? "Unmark important" : "Mark important"}
// // // //                               onClick={() => handleToggleImportant(fan.id)}
// // // //                               style={{ color: important ? IMPORTANT_COLOR : "#bbb", marginRight: 2 }}>
// // // //                               {important ? <Star /> : <StarBorder />}
// // // //                             </IconButton>
// // // //                           </Tooltip>
// // // //                         )}
// // // //                         <Box>
// // // //                           <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.text, maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
// // // //                             {fan.name}
// // // //                           </Typography>
// // // //                           <Typography variant="caption" sx={{ color: colors.textSecondary }}>
// // // //                             Fan ID: <b>{fan.id}</b>
// // // //                             {" | Status: "}
// // // //                             <b style={{
// // // //                               color:
// // // //                                 status === "Running"
// // // //                                   ? "#2e7d32"
// // // //                                   : status === "Stopped"
// // // //                                     ? "#d32f2f"
// // // //                                     : status === "Failed"
// // // //                                       ? "#f44336"
// // // //                                       : colors.textSecondary,
// // // //                             }}>
// // // //                               {status}
// // // //                             </b>
// // // //                             {important && (
// // // //                               <span style={{
// // // //                                 background: IMPORTANT_COLOR,
// // // //                                 color: "#fff",
// // // //                                 fontWeight: 600,
// // // //                                 borderRadius: 6,
// // // //                                 fontSize: 11,
// // // //                                 padding: "2px 7px",
// // // //                                 marginLeft: 7
// // // //                               }}>
// // // //                                 Important
// // // //                               </span>
// // // //                             )}
// // // //                           </Typography>
// // // //                         </Box>
// // // //                       </Box>
// // // //                       <Box display="flex" alignItems="center" gap={1}>
// // // //                         {getStatusIcon(fan)}
// // // //                         {showEditFan && (
// // // //                           <IconButton size="small" onClick={() => setSelectedFan(fan)} style={{ color: primaryColor }}>
// // // //                             <Settings />
// // // //                           </IconButton>
// // // //                         )}
// // // //                         {showDeleteFan && (
// // // //                           <IconButton size="small" onClick={() => deleteFan(fan.id)} color="error">
// // // //                             <Delete />
// // // //                           </IconButton>
// // // //                         )}
// // // //                       </Box>
// // // //                     </Box>

// // // //                     {/* Trend/RPM info, always on top, industry format */}
// // // //                     <Box display="flex" alignItems="center" gap={2} mb={1}>
// // // //                       <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text }}>
// // // //                         Live Speed: {safe(currSpeed, " " + speedUnit)}
// // // //                       </Typography>
// // // //                       {trend !== 0 && (
// // // //                         <Box display="flex" alignItems="center" gap={0.5}>
// // // //                           {trend > 0 ? (
// // // //                             <span style={{ color: TREND_UP_COLOR, fontWeight: 600 }}>
// // // //                               <ArrowUpward fontSize="small" /> +{trend.toFixed(1)}%
// // // //                             </span>
// // // //                           ) : (
// // // //                             <span style={{ color: TREND_DOWN_COLOR, fontWeight: 600 }}>
// // // //                               <ArrowDownward fontSize="small" /> {trend.toFixed(1)}%
// // // //                             </span>
// // // //                           )}
// // // //                         </Box>
// // // //                       )}
// // // //                       {delta !== 0 && (
// // // //                         <Typography variant="caption" sx={{ color: "#aaa" }}>
// // // //                           Δ {delta > 0 ? "+" : ""}{delta.toFixed(1)} {speedUnit}
// // // //                         </Typography>
// // // //                       )}
// // // //                     </Box>

// // // //                     {/* Fan Animation */}
// // // //                     <Box display="flex" justifyContent="center" mb={showControls ? 2 : 1}>
// // // //                       <div className={`fan-blade ${isSpinning ? "spinning" : ""} ${isDarkMode ? "blade-dark" : ""}`}
// // // //                         style={{ animationDuration: isSpinning ? `${2 - Math.min(1.99, currSpeed / 50)}s` : "0s" }}>
// // // //                         <div className="fan-center"></div>
// // // //                         <div className="blade" style={{ transform: "rotate(0deg)" }}></div>
// // // //                         <div className="blade" style={{ transform: "rotate(90deg)" }}></div>
// // // //                         <div className="blade" style={{ transform: "rotate(180deg)" }}></div>
// // // //                         <div className="blade" style={{ transform: "rotate(270deg)" }}></div>
// // // //                       </div>
// // // //                     </Box>

// // // //                     {showControls && (
// // // //                       <>
// // // //                         {(showStartStop || showAutoMode || showReset) && (
// // // //                           <Box mb={2}>
// // // //                             {showStartStop && (
// // // //                               <Box display="flex" gap={1} mb={1}>
// // // //                                 <Button size="small" startIcon={<PlayArrow />} onClick={() => handleFanControl(fan.id, "start")} disabled={status === "Failed"} variant="outlined" color="success">Start</Button>
// // // //                                 <Button size="small" startIcon={<Stop />} onClick={() => handleFanControl(fan.id, "stop")} variant="outlined" color="error">Stop</Button>
// // // //                                 {showReset && status === "Failed" && (
// // // //                                   <Button size="small" onClick={() => handleFanControl(fan.id, "reset")} variant="outlined">Reset</Button>
// // // //                                 )}
// // // //                               </Box>
// // // //                             )}
// // // //                             {showAutoMode && (
// // // //                               <Box display="flex" alignItems="center" gap={1} mb={1}>
// // // //                                 <Typography variant="caption" style={{ color: colors.textSecondary }}>Auto Mode:</Typography>
// // // //                                 <Switch size="small" checked={fan.autoMode} onChange={() => handleAutoModeToggle(fan.id, fan.autoMode)} />
// // // //                               </Box>
// // // //                             )}
// // // //                           </Box>
// // // //                         )}
// // // //                         {showSpeedSet && (
// // // //                           <Box mb={2}>
// // // //                             <Typography variant="caption" gutterBottom style={{ color: colors.textSecondary }}>
// // // //                               Speed: {safe(currSpeed, " " + speedUnit)}
// // // //                             </Typography>
// // // //                             <Slider
// // // //                               value={Number.isFinite(currSpeed) ? currSpeed : 0}
// // // //                               onChange={(e, value) => handleSpeedChange(fan.id, value)}
// // // //                               disabled={status === "Failed"}
// // // //                               min={minSpeed}
// // // //                               max={speedUnit === "RPM" ? maxSpeedRpm : maxSpeedPercent}
// // // //                               size="small"
// // // //                               sx={{
// // // //                                 color: primaryColor,
// // // //                                 '& .MuiSlider-rail': { backgroundColor: isDarkMode ? "#222" : "#eee" },
// // // //                               }}
// // // //                             />
// // // //                           </Box>
// // // //                         )}
// // // //                       </>
// // // //                     )}

// // // //                     {showDetails && (
// // // //                       <Grid container spacing={1} sx={{ mt: 1 }}>
// // // //                         {showTemperature && (
// // // //                           <Grid item xs={6}>
// // // //                             <Box display="flex" alignItems="center" gap={0.5}>
// // // //                               <Thermostat fontSize="small" />
// // // //                               <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // //                                 {safe(fanData.temperature ?? fan.temperature, fan.tempUnit)}
// // // //                               </Typography>
// // // //                             </Box>
// // // //                           </Grid>
// // // //                         )}
// // // //                         {showPower && (
// // // //                           <Grid item xs={6}>
// // // //                             <Box display="flex" alignItems="center" gap={0.5}>
// // // //                               <ElectricBolt fontSize="small" />
// // // //                               <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // //                                 {safe(fanData.power ?? fan.power, "W")}
// // // //                               </Typography>
// // // //                             </Box>
// // // //                           </Grid>
// // // //                         )}
// // // //                         {showRuntime && (
// // // //                           <Grid item xs={6}>
// // // //                             <Box display="flex" alignItems="center" gap={0.5}>
// // // //                               <Schedule fontSize="small" />
// // // //                               <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // //                                 {safe((fanData.runtime ?? fan.runtime)?.toFixed(1), "h")}
// // // //                               </Typography>
// // // //                             </Box>
// // // //                           </Grid>
// // // //                         )}
// // // //                         {showMaintenance && (
// // // //                           <Grid item xs={6}>
// // // //                             <Box display="flex" alignItems="center" gap={0.5}>
// // // //                               <Build fontSize="small" />
// // // //                               <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // //                                 {safe(Math.max(0, (fan.maintenanceHours ?? 0) - (fanData.runtime ?? fan.runtime ?? 0)).toFixed(0), "h")}
// // // //                               </Typography>
// // // //                             </Box>
// // // //                           </Grid>
// // // //                         )}
// // // //                       </Grid>
// // // //                     )}
// // // //                     {showAlarms && fan.alarms && fan.alarms.length > 0 && (
// // // //                       <Box mt={1}>{fan.alarms.map((alarm, i) =>
// // // //                         <Alert key={i} severity={alarm.type} size="small" style={{ marginBottom: 4 }}>{alarm.message}</Alert>
// // // //                       )}</Box>
// // // //                     )}
// // // //                   </CardContent>
// // // //                 </Card>
// // // //               </Grid>
// // // //             )
// // // //           })}
// // // //         </Grid>

// // // //         {/* Add Fan Dialog */}
// // // //         {showAddFanDialog && (
// // // //           <Dialog open={addFanDialog} onClose={() => setAddFanDialog(false)}>
// // // //             <DialogTitle style={{ background: colors.surface, color: colors.text }}>Add New Fan</DialogTitle>
// // // //             <DialogContent style={{ background: colors.bg, color: colors.text }}>
// // // //               <TextField autoFocus margin="dense" label="Fan Name" fullWidth variant="outlined" value={newFanName} onChange={e => setNewFanName(e.target.value)} />
// // // //             </DialogContent>
// // // //             <DialogActions style={{ background: colors.surface }}>
// // // //               <Button onClick={() => setAddFanDialog(false)}>Cancel</Button>
// // // //               <Button onClick={addNewFan} variant="contained" style={{ background: primaryColor, color: "#fff" }}>Add Fan</Button>
// // // //             </DialogActions>
// // // //           </Dialog>
// // // //         )}

// // // //         {/* Fan Config Dialog */}
// // // //         {showFanConfigDialog && selectedFan && (
// // // //           <Dialog open={!!selectedFan} onClose={() => setSelectedFan(null)} maxWidth="sm" fullWidth>
// // // //             <DialogTitle style={{ background: colors.surface, color: colors.text }}>
// // // //               <Box display="flex" alignItems="center" gap={1}><Tune fontSize="small" />Configure {selectedFan.name}</Box>
// // // //             </DialogTitle>
// // // //             <DialogContent style={{ background: colors.bg, color: colors.text }}>
// // // //               <Grid container spacing={2}>
// // // //                 <Grid item xs={12}><TextField label="Fan Name" fullWidth value={selectedFan.name} onChange={e => setSelectedFan({ ...selectedFan, name: e.target.value })} /></Grid>
// // // //                 <Grid item xs={6}><TextField label="Maintenance Hours" type="number" fullWidth value={selectedFan.maintenanceHours} onChange={e => setSelectedFan({ ...selectedFan, maintenanceHours: Number.parseInt(e.target.value) })} /></Grid>
// // // //                 <Grid item xs={6}><TextField label="Last Maintenance" type="date" fullWidth value={selectedFan.lastMaintenance} onChange={e => setSelectedFan({ ...selectedFan, lastMaintenance: e.target.value })} /></Grid>
// // // //                 <Grid item xs={6}>
// // // //                   <FormControl fullWidth>
// // // //                     <InputLabel>Speed Unit</InputLabel>
// // // //                     <Select value={selectedFan.speedUnit} label="Speed Unit" onChange={e => setSelectedFan({ ...selectedFan, speedUnit: e.target.value })}>
// // // //                       {(speedUnits || DEFAULT_SPEED_UNITS).map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
// // // //                     </Select>
// // // //                   </FormControl>
// // // //                 </Grid>
// // // //                 <Grid item xs={6}>
// // // //                   <FormControl fullWidth>
// // // //                     <InputLabel>Temperature Unit</InputLabel>
// // // //                     <Select value={selectedFan.tempUnit} label="Temperature Unit" onChange={e => setSelectedFan({ ...selectedFan, tempUnit: e.target.value })}>
// // // //                       {(tempUnits || DEFAULT_TEMP_UNITS).map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
// // // //                     </Select>
// // // //                   </FormControl>
// // // //                 </Grid>
// // // //               </Grid>
// // // //             </DialogContent>
// // // //             <DialogActions style={{ background: colors.surface }}>
// // // //               <Button onClick={() => setSelectedFan(null)} style={{ color: primaryColor }}>Close</Button>
// // // //             </DialogActions>
// // // //           </Dialog>
// // // //         )}
// // // //       </CardContent>
// // // //     </Card>
// // // //   )
// // // // }

// // // // export default FanControlWidget


// // // // // import { useState, useEffect } from "react"

// // // // // import {
// // // // //   Card, CardContent, Typography, Button, Slider, Switch, Chip, Grid, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Badge, MenuItem, Select, InputLabel, FormControl, Tooltip
// // // // // } from "@mui/material"
// // // // // import {
// // // // //   PlayArrow, Stop, Settings, Warning, Error, CheckCircle, Thermostat, ElectricBolt, Schedule, Build, Add, Delete, Tune,
// // // // //   Percent, RotateRight, Opacity, Star, StarBorder
// // // // // } from "@mui/icons-material"
// // // // // import { useTheme } from "../../theme/ThemeProvider"
// // // // // import "../../../styles/fan-control-widget.css"

// // // // // const DEFAULT_SPEED_UNITS = [
// // // // //   { value: "%", label: "Percentage (%)", icon: <Percent fontSize="small" /> },
// // // // //   { value: "RPM", label: "Rotation (RPM)", icon: <RotateRight fontSize="small" /> },
// // // // // ]
// // // // // const DEFAULT_TEMP_UNITS = [
// // // // //   { value: "°C", label: "Celsius (°C)", icon: <Thermostat fontSize="small" /> },
// // // // //   { value: "°F", label: "Fahrenheit (°F)", icon: <Thermostat fontSize="small" /> },
// // // // //   { value: "K", label: "Kelvin (K)", icon: <Opacity fontSize="small" /> },
// // // // // ]

// // // // // function buildFanCommandPayload(fanId, command, value) {
// // // // //   return {
// // // // //     fanId,
// // // // //     command,
// // // // //     ...(value !== undefined ? { value } : {}),
// // // // //     ts: Date.now(),
// // // // //   }
// // // // // }

// // // // // const IMPORTANT_COLOR = "#FFB300" // Material Amber 700

// // // // // const FanControlWidget = ({
// // // // //   fans = [],
// // // // //   data = {},
// // // // //   dataKeys = ["speed"], // kept for compatibility
// // // // //   ...props
// // // // // }) => {
// // // // //   const { isDarkMode, primaryColor } = useTheme()
// // // // //   const [fanList, setFanList] = useState(fans)
// // // // //   const [selectedFan, setSelectedFan] = useState(null)
// // // // //   const [addFanDialog, setAddFanDialog] = useState(false)
// // // // //   const [newFanName, setNewFanName] = useState("")
// // // // //   // Store "important" state in each fan
// // // // //   const [importantMap, setImportantMap] = useState({}) // { [fanId]: true }

// // // // //   // Update fanList and importantMap when fans prop changes
// // // // //   useEffect(() => {
// // // // //     setFanList(fans)
// // // // //     // Initialize important state if not present in the fan object
// // // // //     const newMap = {}
// // // // //     fans.forEach(fan => {
// // // // //       if (fan.important) newMap[fan.id] = true
// // // // //     })
// // // // //     setImportantMap(newMap)
// // // // //   }, [fans])

// // // // //   const addNewFan = () => {
// // // // //     if (!newFanName.trim()) return
// // // // //     const newFan = {
// // // // //       id: `fan${Date.now()}`,
// // // // //       name: newFanName,
// // // // //       status: "stopped",
// // // // //       speed: 0,
// // // // //       targetSpeed: 0,
// // // // //       speedUnit: "%",
// // // // //       temperature: 25,
// // // // //       tempUnit: "°C",
// // // // //       power: 0,
// // // // //       runtime: 0,
// // // // //       maintenanceHours: 8760,
// // // // //       lastMaintenance: new Date().toISOString().split("T")[0],
// // // // //       autoMode: false,
// // // // //       alarms: [],
// // // // //       important: false,
// // // // //     }
// // // // //     setFanList(prev => [...prev, newFan])
// // // // //     setImportantMap(prev => ({ ...prev, [newFan.id]: false }))
// // // // //     setNewFanName("")
// // // // //     setAddFanDialog(false)
// // // // //     if (props.onConfigChange) props.onConfigChange([...fanList, newFan])
// // // // //   }

// // // // //   const deleteFan = (fanId) => {
// // // // //     setFanList(prev => prev.filter(f => f.id !== fanId))
// // // // //     setImportantMap(prev => {
// // // // //       const next = { ...prev }
// // // // //       delete next[fanId]
// // // // //       return next
// // // // //     })
// // // // //     if (props.onConfigChange) props.onConfigChange(fanList.filter(f => f.id !== fanId))
// // // // //   }

// // // // //   // Mark/unmark as important
// // // // //   const handleToggleImportant = (fanId) => {
// // // // //     setImportantMap(prev => {
// // // // //       const updated = { ...prev, [fanId]: !prev[fanId] }
// // // // //       setFanList(list =>
// // // // //         list.map(fan => fan.id === fanId ? { ...fan, important: !prev[fanId] } : fan)
// // // // //       )
// // // // //       return updated
// // // // //     })
// // // // //   }

// // // // //   // --- MQTT/Control/other helpers unchanged
// // // // //   const handleFanControl = (fanId, action) => {
// // // // //     if (props.onControlChange) props.onControlChange(fanId, "action", action)
// // // // //     if (typeof props.sendMqttCommand === "function") {
// // // // //       props.sendMqttCommand(buildFanCommandPayload(fanId, action))
// // // // //     }
// // // // //   }
// // // // //   const handleSpeedChange = (fanId, value) => {
// // // // //     if (props.onControlChange) props.onControlChange(fanId, "targetSpeed", value)
// // // // //     if (typeof props.sendMqttCommand === "function") {
// // // // //       props.sendMqttCommand(buildFanCommandPayload(fanId, "set_speed", value))
// // // // //     }
// // // // //   }
// // // // //   const handleAutoModeToggle = (fanId, current) => {
// // // // //     if (props.onControlChange) props.onControlChange(fanId, "autoMode", !current)
// // // // //     if (typeof props.sendMqttCommand === "function") {
// // // // //       props.sendMqttCommand(buildFanCommandPayload(fanId, "auto_mode", !current))
// // // // //     }
// // // // //   }
// // // // //   const handleAllFans = (action) => {
// // // // //     fanList.forEach(fan => handleFanControl(fan.id, action))
// // // // //   }
// // // // //   function getLatestSpeed(fanId, fallback) {
// // // // //     if (data && typeof data === "object" && data[fanId]) {
// // // // //       if ("speed" in data[fanId]) return data[fanId].speed
// // // // //     }
// // // // //     return fallback
// // // // //   }
// // // // //   function getFanStatus(fanId, fallback) {
// // // // //     if (data && typeof data === "object" && data[fanId]) {
// // // // //       const raw = data[fanId].status
// // // // //       if (raw === "on" || raw === true) return "running"
// // // // //       if (raw === "off" || raw === false) return "stopped"
// // // // //       if (typeof raw === "string") return raw // fallback for legacy
// // // // //     }
// // // // //     return fallback
// // // // //   }
// // // // //   function getFanData(fanId) {
// // // // //     if (data && typeof data === "object" && data[fanId]) return data[fanId]
// // // // //     return {}
// // // // //   }

// // // // //   const themeColors = {
// // // // //     light: { bg: "#fff", bgElevated: "#fafbfc", cardBorder: "#e0e0e0", text: "#222", textSecondary: "#444", surface: "#f6f8fa", },
// // // // //     dark: { bg: "#141414", bgElevated: "#23272f", cardBorder: "#24272b", text: "#fff", textSecondary: "#bbb", surface: "#181c23", }
// // // // //   }
// // // // //   const colors = themeColors[isDarkMode ? "dark" : "light"]

// // // // //   const getStatusColor = (status, important) =>
// // // // //     important ? IMPORTANT_COLOR : status === "running" ? "#4caf50" : status === "failed" ? "#f44336" : colors.cardBorder
// // // // //   const getStatusIcon = (fan) => {
// // // // //     const status = getFanStatus(fan.id, fan.status)
// // // // //     return status === "running" ? <CheckCircle style={{ color: "#4caf50" }} />
// // // // //       : status === "failed" ? <Error style={{ color: "#f44336" }} />
// // // // //         : <Stop style={{ color: colors.textSecondary }} />
// // // // //   }

// // // // //   const runningFans = fanList.filter(fan => getFanStatus(fan.id, fan.status) === "running").length
// // // // //   const totalAlarms = fanList.reduce((sum, fan) => sum + (fan.alarms?.length || 0), 0)

// // // // //   return (
// // // // //     <Card className={`fan-control-widget ${isDarkMode ? "fan-widget-dark" : ""}`}
// // // // //       style={{ background: colors.bg, color: colors.text }}>
// // // // //       <CardContent style={{ background: colors.bg }}>
// // // // //         <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
// // // // //           <Typography variant="h6" style={{ color: primaryColor, fontWeight: 700, letterSpacing: 0.2 }}>{props.title}</Typography>
// // // // //           <Box display="flex" gap={1}>
// // // // //             {props.showStats && (
// // // // //               <Chip label={`${runningFans}/${fanList.length} Running`} color={runningFans > 0 ? "success" : "default"} size="small" />
// // // // //             )}
// // // // //             {props.showAlarms && totalAlarms > 0 && (
// // // // //               <Badge badgeContent={totalAlarms} color="error">
// // // // //                 <Warning color="warning" />
// // // // //               </Badge>
// // // // //             )}
// // // // //             {props.showAddFan && (
// // // // //               <IconButton size="small" onClick={() => setAddFanDialog(true)} style={{ color: primaryColor }}>
// // // // //                 <Add />
// // // // //               </IconButton>
// // // // //             )}
// // // // //           </Box>
// // // // //         </Box>

// // // // //         {props.showAllControl && (
// // // // //           <Box mb={2} display="flex" gap={2}>
// // // // //             <Button variant="contained" color="success" startIcon={<PlayArrow />} size="small"
// // // // //               onClick={() => handleAllFans("start")}>Start All</Button>
// // // // //             <Button variant="contained" color="error" startIcon={<Stop />} size="small"
// // // // //               onClick={() => handleAllFans("stop")}>Stop All</Button>
// // // // //           </Box>
// // // // //         )}

// // // // //         <Grid container spacing={1}>
// // // // //           {fanList.map((fan) => {
// // // // //             const fanData = getFanData(fan.id)
// // // // //             const status = getFanStatus(fan.id, fan.status)
// // // // //             const speed = getLatestSpeed(fan.id, fan.targetSpeed ?? 0)
// // // // //             const isSpinning = status === "running" && speed > 0
// // // // //             const important = !!importantMap[fan.id]

// // // // //             // Calculate if the card is "minimal" (no controls, no stats, etc.)
// // // // //             const showControls = props.showStartStop || props.showAutoMode || props.showReset || props.showSpeedSet
// // // // //             const showDetails = true // always show data grid

// // // // //             return (
// // // // //               <Grid item xs={12} md={6} key={fan.id}>
// // // // //                 <Card
// // // // //                   variant="outlined"
// // // // //                   className={`fan-card ${status} ${isSpinning ? "spinning" : ""} ${important ? "important-fan" : ""} ${isDarkMode ? "fan-card-dark" : ""}`}
// // // // //                   style={{
// // // // //                     borderColor: getStatusColor(status, important),
// // // // //                     background: colors.bgElevated,
// // // // //                     color: colors.text,
// // // // //                     borderWidth: important ? 3 : 1,
// // // // //                     minHeight: (!showControls && !props.showAlarms) ? 140 : 210,
// // // // //                     marginBottom: 10,
// // // // //                   }}
// // // // //                 >
// // // // //                   <CardContent style={{ padding: "18px 16px 10px 16px" }}>
// // // // //                     <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
// // // // //                       <Box display="flex" alignItems="center" gap={1}>
// // // // //                         <Tooltip title={important ? "Important Fan" : "Mark as Important"}>
// // // // //                           <IconButton
// // // // //                             size="small"
// // // // //                             aria-label={important ? "Unmark important" : "Mark important"}
// // // // //                             onClick={() => handleToggleImportant(fan.id)}
// // // // //                             style={{ color: important ? IMPORTANT_COLOR : "#bbb", marginRight: 2 }}>
// // // // //                             {important ? <Star /> : <StarBorder />}
// // // // //                           </IconButton>
// // // // //                         </Tooltip>
// // // // //                         <Typography variant="subtitle1" fontWeight="bold" style={{ color: colors.text }}>
// // // // //                           {fan.name}
// // // // //                         </Typography>
// // // // //                         {important && (
// // // // //                           <Chip label="Important" size="small"
// // // // //                             sx={{
// // // // //                               ml: 0.5,
// // // // //                               background: IMPORTANT_COLOR,
// // // // //                               color: "#fff",
// // // // //                               fontWeight: 600,
// // // // //                               fontSize: 12,
// // // // //                               letterSpacing: 0.5,
// // // // //                               height: 22
// // // // //                             }} />
// // // // //                         )}
// // // // //                       </Box>
// // // // //                       <Box display="flex" alignItems="center" gap={1}>
// // // // //                         {getStatusIcon(fan)}
// // // // //                         {props.showEditFan && (
// // // // //                           <IconButton size="small" onClick={() => setSelectedFan(fan)} style={{ color: primaryColor }}>
// // // // //                             <Settings />
// // // // //                           </IconButton>
// // // // //                         )}
// // // // //                         {props.showDeleteFan && (
// // // // //                           <IconButton size="small" onClick={() => deleteFan(fan.id)} color="error">
// // // // //                             <Delete />
// // // // //                           </IconButton>
// // // // //                         )}
// // // // //                       </Box>
// // // // //                     </Box>

// // // // //                     {/* Fan Animation */}
// // // // //                     <Box display="flex" justifyContent="center" mb={showControls ? 2 : 1}>
// // // // //                       <div className={`fan-blade ${isSpinning ? "spinning" : ""} ${isDarkMode ? "blade-dark" : ""}`}
// // // // //                         style={{ animationDuration: isSpinning ? `${2 - Math.min(1.99, speed / 50)}s` : "0s" }}>
// // // // //                         <div className="fan-center"></div>
// // // // //                         <div className="blade" style={{ transform: "rotate(0deg)" }}></div>
// // // // //                         <div className="blade" style={{ transform: "rotate(90deg)" }}></div>
// // // // //                         <div className="blade" style={{ transform: "rotate(180deg)" }}></div>
// // // // //                         <div className="blade" style={{ transform: "rotate(270deg)" }}></div>
// // // // //                       </div>
// // // // //                     </Box>

// // // // //                     {showControls && (
// // // // //                       <>
// // // // //                         {(props.showStartStop || props.showAutoMode || props.showReset) && (
// // // // //                           <Box mb={2}>
// // // // //                             {props.showStartStop && (
// // // // //                               <Box display="flex" gap={1} mb={1}>
// // // // //                                 <Button size="small" startIcon={<PlayArrow />} onClick={() => handleFanControl(fan.id, "start")} disabled={status === "failed"} variant="outlined" color="success">Start</Button>
// // // // //                                 <Button size="small" startIcon={<Stop />} onClick={() => handleFanControl(fan.id, "stop")} variant="outlined" color="error">Stop</Button>
// // // // //                                 {props.showReset && status === "failed" && (
// // // // //                                   <Button size="small" onClick={() => handleFanControl(fan.id, "reset")} variant="outlined">Reset</Button>
// // // // //                                 )}
// // // // //                               </Box>
// // // // //                             )}
// // // // //                             {props.showAutoMode && (
// // // // //                               <Box display="flex" alignItems="center" gap={1} mb={1}>
// // // // //                                 <Typography variant="caption" style={{ color: colors.textSecondary }}>Auto Mode:</Typography>
// // // // //                                 <Switch size="small" checked={fan.autoMode} onChange={() => handleAutoModeToggle(fan.id, fan.autoMode)} />
// // // // //                               </Box>
// // // // //                             )}
// // // // //                           </Box>
// // // // //                         )}
// // // // //                         {props.showSpeedSet && (
// // // // //                           <Box mb={2}>
// // // // //                             <Typography variant="caption" gutterBottom style={{ color: colors.textSecondary }}>
// // // // //                               Speed: {speed} {fan.speedUnit}
// // // // //                             </Typography>
// // // // //                             <Slider
// // // // //                               value={speed}
// // // // //                               onChange={(e, value) => handleSpeedChange(fan.id, value)}
// // // // //                               disabled={status === "failed"}
// // // // //                               min={props.minSpeed}
// // // // //                               max={fan.speedUnit === "RPM" ? props.maxSpeedRpm : props.maxSpeedPercent}
// // // // //                               size="small"
// // // // //                               sx={{
// // // // //                                 color: primaryColor,
// // // // //                                 '& .MuiSlider-rail': { backgroundColor: isDarkMode ? "#222" : "#eee" },
// // // // //                               }}
// // // // //                             />
// // // // //                           </Box>
// // // // //                         )}
// // // // //                       </>
// // // // //                     )}

// // // // //                     {showDetails && (
// // // // //                       <Grid container spacing={1}>
// // // // //                         <Grid item xs={6}>
// // // // //                           <Box display="flex" alignItems="center" gap={0.5}>
// // // // //                             <Thermostat fontSize="small" />
// // // // //                             <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // // //                               {fanData.temperature ?? fan.temperature}{fan.tempUnit}
// // // // //                             </Typography>
// // // // //                           </Box>
// // // // //                         </Grid>
// // // // //                         <Grid item xs={6}>
// // // // //                           <Box display="flex" alignItems="center" gap={0.5}>
// // // // //                             <ElectricBolt fontSize="small" />
// // // // //                             <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // // //                               {fanData.power ?? fan.power}W
// // // // //                             </Typography>
// // // // //                           </Box>
// // // // //                         </Grid>
// // // // //                         <Grid item xs={6}>
// // // // //                           <Box display="flex" alignItems="center" gap={0.5}>
// // // // //                             <Schedule fontSize="small" />
// // // // //                             <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // // //                               {(fanData.runtime ?? fan.runtime)?.toFixed(1)}h
// // // // //                             </Typography>
// // // // //                           </Box>
// // // // //                         </Grid>
// // // // //                         <Grid item xs={6}>
// // // // //                           <Box display="flex" alignItems="center" gap={0.5}>
// // // // //                             <Build fontSize="small" />
// // // // //                             <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // // //                               {Math.max(0, (fan.maintenanceHours ?? 0) - (fanData.runtime ?? fan.runtime ?? 0)).toFixed(0)}h
// // // // //                             </Typography>
// // // // //                           </Box>
// // // // //                         </Grid>
// // // // //                       </Grid>
// // // // //                     )}
// // // // //                     {props.showAlarms && fan.alarms && fan.alarms.length > 0 && (
// // // // //                       <Box mt={1}>{fan.alarms.map((alarm, i) =>
// // // // //                         <Alert key={i} severity={alarm.type} size="small" style={{ marginBottom: 4 }}>{alarm.message}</Alert>
// // // // //                       )}</Box>
// // // // //                     )}
// // // // //                   </CardContent>
// // // // //                 </Card>
// // // // //               </Grid>
// // // // //             )
// // // // //           })}
// // // // //         </Grid>

// // // // //         {/* Add Fan Dialog */}
// // // // //         {props.showAddFanDialog && (
// // // // //           <Dialog open={addFanDialog} onClose={() => setAddFanDialog(false)}>
// // // // //             <DialogTitle style={{ background: colors.surface, color: colors.text }}>Add New Fan</DialogTitle>
// // // // //             <DialogContent style={{ background: colors.bg, color: colors.text }}>
// // // // //               <TextField autoFocus margin="dense" label="Fan Name" fullWidth variant="outlined" value={newFanName} onChange={e => setNewFanName(e.target.value)} />
// // // // //             </DialogContent>
// // // // //             <DialogActions style={{ background: colors.surface }}>
// // // // //               <Button onClick={() => setAddFanDialog(false)}>Cancel</Button>
// // // // //               <Button onClick={addNewFan} variant="contained" style={{ background: primaryColor, color: "#fff" }}>Add Fan</Button>
// // // // //             </DialogActions>
// // // // //           </Dialog>
// // // // //         )}

// // // // //         {/* Fan Config Dialog */}
// // // // //         {props.showFanConfigDialog && selectedFan && (
// // // // //           <Dialog open={!!selectedFan} onClose={() => setSelectedFan(null)} maxWidth="sm" fullWidth>
// // // // //             <DialogTitle style={{ background: colors.surface, color: colors.text }}>
// // // // //               <Box display="flex" alignItems="center" gap={1}><Tune fontSize="small" />Configure {selectedFan.name}</Box>
// // // // //             </DialogTitle>
// // // // //             <DialogContent style={{ background: colors.bg, color: colors.text }}>
// // // // //               <Grid container spacing={2}>
// // // // //                 <Grid item xs={12}><TextField label="Fan Name" fullWidth value={selectedFan.name} onChange={e => setSelectedFan({ ...selectedFan, name: e.target.value })} /></Grid>
// // // // //                 <Grid item xs={6}><TextField label="Maintenance Hours" type="number" fullWidth value={selectedFan.maintenanceHours} onChange={e => setSelectedFan({ ...selectedFan, maintenanceHours: Number.parseInt(e.target.value) })} /></Grid>
// // // // //                 <Grid item xs={6}><TextField label="Last Maintenance" type="date" fullWidth value={selectedFan.lastMaintenance} onChange={e => setSelectedFan({ ...selectedFan, lastMaintenance: e.target.value })} /></Grid>
// // // // //                 <Grid item xs={6}>
// // // // //                   <FormControl fullWidth>
// // // // //                     <InputLabel>Speed Unit</InputLabel>
// // // // //                     <Select value={selectedFan.speedUnit} label="Speed Unit" onChange={e => setSelectedFan({ ...selectedFan, speedUnit: e.target.value })}>
// // // // //                       {(props.speedUnits || DEFAULT_SPEED_UNITS).map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
// // // // //                     </Select>
// // // // //                   </FormControl>
// // // // //                 </Grid>
// // // // //                 <Grid item xs={6}>
// // // // //                   <FormControl fullWidth>
// // // // //                     <InputLabel>Temperature Unit</InputLabel>
// // // // //                     <Select value={selectedFan.tempUnit} label="Temperature Unit" onChange={e => setSelectedFan({ ...selectedFan, tempUnit: e.target.value })}>
// // // // //                       {(props.tempUnits || DEFAULT_TEMP_UNITS).map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
// // // // //                     </Select>
// // // // //                   </FormControl>
// // // // //                 </Grid>
// // // // //               </Grid>
// // // // //             </DialogContent>
// // // // //             <DialogActions style={{ background: colors.surface }}>
// // // // //               <Button onClick={() => setSelectedFan(null)} style={{ color: primaryColor }}>Close</Button>
// // // // //             </DialogActions>
// // // // //           </Dialog>
// // // // //         )}
// // // // //       </CardContent>
// // // // //     </Card>
// // // // //   )
// // // // // }

// // // // // export default FanControlWidget

// // // // // // import { useState, useEffect } from "react"
// // // // // // import {
// // // // // //   Card, CardContent, Typography, Button, Slider, Switch, Chip, Grid, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Badge, MenuItem, Select, InputLabel, FormControl
// // // // // // } from "@mui/material"
// // // // // // import {
// // // // // //   PlayArrow, Stop, Settings, Warning, Error, CheckCircle, Thermostat, ElectricBolt, Schedule, Build, Add, Delete, Tune,
// // // // // //   Percent, RotateRight, Opacity
// // // // // // } from "@mui/icons-material"
// // // // // // import { useTheme } from "../../theme/ThemeProvider"
// // // // // // import "../../../styles/fan-control-widget.css"

// // // // // // const DEFAULT_SPEED_UNITS = [
// // // // // //   { value: "%", label: "Percentage (%)", icon: <Percent fontSize="small" /> },
// // // // // //   { value: "RPM", label: "Rotation (RPM)", icon: <RotateRight fontSize="small" /> },
// // // // // // ]
// // // // // // const DEFAULT_TEMP_UNITS = [
// // // // // //   { value: "°C", label: "Celsius (°C)", icon: <Thermostat fontSize="small" /> },
// // // // // //   { value: "°F", label: "Fahrenheit (°F)", icon: <Thermostat fontSize="small" /> },
// // // // // //   { value: "K", label: "Kelvin (K)", icon: <Opacity fontSize="small" /> },
// // // // // // ]

// // // // // // function buildFanCommandPayload(fanId, command, value) {
// // // // // //   const payload = {
// // // // // //     fanId,
// // // // // //     command,
// // // // // //     ...(value !== undefined ? { value } : {}),
// // // // // //     ts: Date.now(),
// // // // // //   }
// // // // // //   console.log("[FAN][COMMAND]", JSON.stringify(payload))
// // // // // //   return payload
// // // // // // }

// // // // // // const FanControlWidget = ({
// // // // // //   fans = [],
// // // // // //   data = {},
// // // // // //   dataKeys = ["speed"], // kept for compatibility
// // // // // //   ...props
// // // // // // }) => {
// // // // // //   const { isDarkMode, primaryColor } = useTheme()
// // // // // //   // We always use "speed" for live data, but fallback to config if needed.
// // // // // //   // const speedKey = Array.isArray(dataKeys) && dataKeys.length ? dataKeys[0] : "speed"
// // // // // //   const [fanList, setFanList] = useState(fans)
// // // // // //   const [selectedFan, setSelectedFan] = useState(null)
// // // // // //   const [addFanDialog, setAddFanDialog] = useState(false)
// // // // // //   const [newFanName, setNewFanName] = useState("")

// // // // // //   // --------- Logging and Diagnostics ---------
// // // // // //   useEffect(() => {
// // // // // //     console.log("[FAN][DATA][RECEIVED]", JSON.stringify(data))
// // // // // //     fanList.forEach(fan => {
// // // // // //       const fanData = data[fan.id] || {}
// // // // // //       console.log(`[FAN][${fan.id}] status:`, fanData.status, "speed:", fanData.speed, "temp:", fanData.temperature)
// // // // // //     })
// // // // // //   }, [data, fanList])

// // // // // //   useEffect(() => {
// // // // // //     setFanList(fans)
// // // // // //     console.log("[FAN][CONFIG][FANS]", fans)
// // // // // //   }, [fans])

// // // // // //   // --------- Add/Delete/Config ----------
// // // // // //   const addNewFan = () => {
// // // // // //     if (!newFanName.trim()) return
// // // // // //     const newFan = {
// // // // // //       id: `fan${Date.now()}`,
// // // // // //       name: newFanName,
// // // // // //       status: "stopped",
// // // // // //       speed: 0,
// // // // // //       targetSpeed: 0,
// // // // // //       speedUnit: "%",
// // // // // //       temperature: 25,
// // // // // //       tempUnit: "°C",
// // // // // //       power: 0,
// // // // // //       runtime: 0,
// // // // // //       maintenanceHours: 8760,
// // // // // //       lastMaintenance: new Date().toISOString().split("T")[0],
// // // // // //       autoMode: false,
// // // // // //       alarms: [],
// // // // // //     }
// // // // // //     setFanList(prev => [...prev, newFan])
// // // // // //     setNewFanName("")
// // // // // //     setAddFanDialog(false)
// // // // // //     if (props.onConfigChange) props.onConfigChange([...fanList, newFan])
// // // // // //     console.log("[FAN][ADD]", newFan)
// // // // // //   }

// // // // // //   const deleteFan = (fanId) => {
// // // // // //     setFanList(prev => prev.filter(f => f.id !== fanId))
// // // // // //     if (props.onConfigChange) props.onConfigChange(fanList.filter(f => f.id !== fanId))
// // // // // //     console.log("[FAN][DELETE]", fanId)
// // // // // //   }

// // // // // //   // -------- MQTT/control actions with logging --------
// // // // // //   const handleFanControl = (fanId, action) => {
// // // // // //     console.log(`[FAN][CONTROL][${fanId}] Action:`, action)
// // // // // //     if (props.onControlChange) props.onControlChange(fanId, "action", action)
// // // // // //     if (typeof props.sendMqttCommand === "function") {
// // // // // //       props.sendMqttCommand(buildFanCommandPayload(fanId, action))
// // // // // //     }
// // // // // //   }
// // // // // //   const handleSpeedChange = (fanId, value) => {
// // // // // //     console.log(`[FAN][CONTROL][${fanId}] Set Speed:`, value)
// // // // // //     if (props.onControlChange) props.onControlChange(fanId, "targetSpeed", value)
// // // // // //     if (typeof props.sendMqttCommand === "function") {
// // // // // //       props.sendMqttCommand(buildFanCommandPayload(fanId, "set_speed", value))
// // // // // //     }
// // // // // //   }
// // // // // //   const handleAutoModeToggle = (fanId, current) => {
// // // // // //     console.log(`[FAN][CONTROL][${fanId}] Auto Mode:`, !current)
// // // // // //     if (props.onControlChange) props.onControlChange(fanId, "autoMode", !current)
// // // // // //     if (typeof props.sendMqttCommand === "function") {
// // // // // //       props.sendMqttCommand(buildFanCommandPayload(fanId, "auto_mode", !current))
// // // // // //     }
// // // // // //   }
// // // // // //   const handleAllFans = (action) => {
// // // // // //     console.log(`[FAN][CONTROL][ALL] Action:`, action)
// // // // // //     fanList.forEach(fan => handleFanControl(fan.id, action))
// // // // // //   }

// // // // // //   // --------- Data helpers: status & value from nested object ---------
// // // // // //   // ALWAYS use "speed" for incoming data
// // // // // //   function getLatestSpeed(fanId, fallback) {
// // // // // //     if (data && typeof data === "object" && data[fanId]) {
// // // // // //       if ("speed" in data[fanId]) return data[fanId].speed
// // // // // //     }
// // // // // //     return fallback
// // // // // //   }
// // // // // //   function getFanStatus(fanId, fallback) {
// // // // // //     if (data && typeof data === "object" && data[fanId]) {
// // // // // //       const raw = data[fanId].status
// // // // // //       if (raw === "on" || raw === true) return "running"
// // // // // //       if (raw === "off" || raw === false) return "stopped"
// // // // // //       if (typeof raw === "string") return raw // fallback for legacy
// // // // // //     }
// // // // // //     return fallback
// // // // // //   }
// // // // // //   function getFanData(fanId) {
// // // // // //     if (data && typeof data === "object" && data[fanId]) return data[fanId]
// // // // // //     return {}
// // // // // //   }

// // // // // //   const themeColors = {
// // // // // //     light: { bg: "#fff", bgElevated: "#fafbfc", cardBorder: "#e0e0e0", text: "#222", textSecondary: "#444", surface: "#f6f8fa", },
// // // // // //     dark: { bg: "#141414", bgElevated: "#23272f", cardBorder: "#24272b", text: "#fff", textSecondary: "#bbb", surface: "#181c23", }
// // // // // //   }
// // // // // //   const colors = themeColors[isDarkMode ? "dark" : "light"]

// // // // // //   const getStatusColor = (status) =>
// // // // // //     status === "running" ? "#4caf50" : status === "failed" ? "#f44336" : colors.cardBorder
// // // // // //   const getStatusIcon = (fan) => {
// // // // // //     const status = getFanStatus(fan.id, fan.status)
// // // // // //     return status === "running" ? <CheckCircle style={{ color: "#4caf50" }} />
// // // // // //       : status === "failed" ? <Error style={{ color: "#f44336" }} />
// // // // // //         : <Stop style={{ color: colors.textSecondary }} />
// // // // // //   }

// // // // // //   const runningFans = fanList.filter(fan => getFanStatus(fan.id, fan.status) === "running").length
// // // // // //   const totalAlarms = fanList.reduce((sum, fan) => sum + (fan.alarms?.length || 0), 0)

// // // // // //   return (
// // // // // //     <Card className={`fan-control-widget ${isDarkMode ? "fan-widget-dark" : ""}`}
// // // // // //       style={{ background: colors.bg, color: colors.text, }}
// // // // // //     >
// // // // // //       <CardContent style={{ background: colors.bg }}>
// // // // // //         <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
// // // // // //           <Typography variant="h6" style={{ color: primaryColor, fontWeight: 700, letterSpacing: 0.2 }}>{props.title}</Typography>
// // // // // //           <Box display="flex" gap={1}>
// // // // // //             {props.showStats && (
// // // // // //               <Chip label={`${runningFans}/${fanList.length} Running`} color={runningFans > 0 ? "success" : "default"} size="small" />
// // // // // //             )}
// // // // // //             {props.showAlarms && totalAlarms > 0 && (
// // // // // //               <Badge badgeContent={totalAlarms} color="error">
// // // // // //                 <Warning color="warning" />
// // // // // //               </Badge>
// // // // // //             )}
// // // // // //             {props.showAddFan && (
// // // // // //               <IconButton size="small" onClick={() => setAddFanDialog(true)} style={{ color: primaryColor }}>
// // // // // //                 <Add />
// // // // // //               </IconButton>
// // // // // //             )}
// // // // // //           </Box>
// // // // // //         </Box>

// // // // // //         {props.showAllControl && (
// // // // // //           <Box mb={2} display="flex" gap={2}>
// // // // // //             <Button variant="contained" color="success" startIcon={<PlayArrow />} size="small"
// // // // // //               onClick={() => handleAllFans("start")}>Start All</Button>
// // // // // //             <Button variant="contained" color="error" startIcon={<Stop />} size="small"
// // // // // //               onClick={() => handleAllFans("stop")}>Stop All</Button>
// // // // // //           </Box>
// // // // // //         )}

// // // // // //         <Grid container spacing={1}>
// // // // // //           {fanList.map((fan) => {
// // // // // //             const fanData = getFanData(fan.id)
// // // // // //             const statusFromData = fanData.status
// // // // // //             const status = getFanStatus(fan.id, fan.status)
// // // // // //             const speedFromData = fanData.speed
// // // // // //             // Prefer live speed; fallback to config/targetSpeed
// // // // // //             const speed = getLatestSpeed(fan.id, fan.targetSpeed ?? 0)
// // // // // //             const isSpinning = status === "running" && speed > 0

// // // // // //             // --- Ultra verbose debug log for this fan ---
// // // // // //             console.debug(
// // // // // //               `[DEBUG][${fan.id}] | fan.id: ${fan.id} | fan.name: ${fan.name} | data:`,
// // // // // //               fanData,
// // // // // //               `| status-from-data: ${statusFromData} | status: ${status} | speed-from-data: ${speedFromData} | speed: ${speed} | isSpinning:`, isSpinning
// // // // // //             )

// // // // // //             return (
// // // // // //               <Grid item xs={12} md={6} key={fan.id}>
// // // // // //                 <Card
// // // // // //                   variant="outlined"
// // // // // //                   className={`fan-card ${status} ${isSpinning ? "spinning" : ""} ${isDarkMode ? "fan-card-dark" : ""}`}
// // // // // //                   style={{
// // // // // //                     borderColor: getStatusColor(status),
// // // // // //                     background: colors.bgElevated,
// // // // // //                     color: colors.text,
// // // // // //                   }}
// // // // // //                 >
// // // // // //                   <CardContent>
// // // // // //                     <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
// // // // // //                       <Typography variant="subtitle1" fontWeight="bold" style={{ color: colors.text }}>
// // // // // //                         {fan.name}
// // // // // //                       </Typography>
// // // // // //                       <Box display="flex" alignItems="center" gap={1}>
// // // // // //                         {getStatusIcon(fan)}
// // // // // //                         {props.showEditFan && (
// // // // // //                           <IconButton size="small" onClick={() => setSelectedFan(fan)} style={{ color: primaryColor }}>
// // // // // //                             <Settings />
// // // // // //                           </IconButton>
// // // // // //                         )}
// // // // // //                         {props.showDeleteFan && (
// // // // // //                           <IconButton size="small" onClick={() => deleteFan(fan.id)} color="error">
// // // // // //                             <Delete />
// // // // // //                           </IconButton>
// // // // // //                         )}
// // // // // //                       </Box>
// // // // // //                     </Box>
// // // // // //                     {/* <Box display="flex" justifyContent="center" mb={2}>
// // // // // //                       <div className={`fan-blade ${isSpinning ? "spinning" : ""} ${isDarkMode ? "blade-dark" : ""}`}
// // // // // //                         style={{ animationDuration: isSpinning ? `${2 - Math.min(1.99, speed / 50)}s` : "0s" }}>
// // // // // //                         <div className="fan-center"></div>
// // // // // //                         <div className="blade blade1"></div>
// // // // // //                         <div className="blade blade2"></div>
// // // // // //                         <div className="blade blade3"></div>
// // // // // //                         <div className="blade blade4"></div>
// // // // // //                       </div>
// // // // // //                     </Box> */}
// // // // // //                     <Box display="flex" justifyContent="center" mb={2}>
// // // // // //                            <div className={`fan-blade ${isSpinning ? "spinning" : ""} ${isDarkMode ? "blade-dark" : ""}`}
// // // // // //                         style={{ animationDuration: isSpinning ? `${2 - Math.min(1.99, speed / 50)}s` : "0s" }}>
// // // // // //                         <div className="fan-center"></div>
// // // // // //                         <div className="blade" style={{ transform: "rotate(0deg)" }}></div>
// // // // // //                         <div className="blade" style={{ transform: "rotate(90deg)" }}></div>
// // // // // //                         <div className="blade" style={{ transform: "rotate(180deg)" }}></div>
// // // // // //                         <div className="blade" style={{ transform: "rotate(270deg)" }}></div>
// // // // // //                       </div>
// // // // // //                       </Box>
// // // // // //                     {(props.showStartStop || props.showAutoMode || props.showReset) && (
// // // // // //                       <Box mb={2}>
// // // // // //                         {props.showStartStop && (
// // // // // //                           <Box display="flex" gap={1} mb={1}>
// // // // // //                             <Button size="small" startIcon={<PlayArrow />} onClick={() => handleFanControl(fan.id, "start")} disabled={status === "failed"} variant="outlined" color="success">Start</Button>
// // // // // //                             <Button size="small" startIcon={<Stop />} onClick={() => handleFanControl(fan.id, "stop")} variant="outlined" color="error">Stop</Button>
// // // // // //                             {props.showReset && status === "failed" && (
// // // // // //                               <Button size="small" onClick={() => handleFanControl(fan.id, "reset")} variant="outlined">Reset</Button>
// // // // // //                             )}
// // // // // //                           </Box>
// // // // // //                         )}
// // // // // //                         {props.showAutoMode && (
// // // // // //                           <Box display="flex" alignItems="center" gap={1} mb={1}>
// // // // // //                             <Typography variant="caption" style={{ color: colors.textSecondary }}>Auto Mode:</Typography>
// // // // // //                             <Switch size="small" checked={fan.autoMode} onChange={() => handleAutoModeToggle(fan.id, fan.autoMode)} />
// // // // // //                           </Box>
// // // // // //                         )}
// // // // // //                       </Box>
// // // // // //                     )}
// // // // // //                     {props.showSpeedSet && (
// // // // // //                       <Box mb={2}>
// // // // // //                         <Typography variant="caption" gutterBottom style={{ color: colors.textSecondary }}>
// // // // // //                           Speed: {speed} {fan.speedUnit}
// // // // // //                         </Typography>
// // // // // //                         <Slider
// // // // // //                           value={speed}
// // // // // //                           onChange={(e, value) => handleSpeedChange(fan.id, value)}
// // // // // //                           disabled={status === "failed"}
// // // // // //                           min={props.minSpeed}
// // // // // //                           max={fan.speedUnit === "RPM" ? props.maxSpeedRpm : props.maxSpeedPercent}
// // // // // //                           size="small"
// // // // // //                           sx={{
// // // // // //                             color: primaryColor,
// // // // // //                             '& .MuiSlider-rail': { backgroundColor: isDarkMode ? "#222" : "#eee" },
// // // // // //                           }}
// // // // // //                         />
// // // // // //                       </Box>
// // // // // //                     )}
// // // // // //                     <Grid container spacing={1}>
// // // // // //                       <Grid item xs={6}>
// // // // // //                         <Box display="flex" alignItems="center" gap={0.5}>
// // // // // //                           <Thermostat fontSize="small" />
// // // // // //                           <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // // // //                             {fanData.temperature ?? fan.temperature}{fan.tempUnit}
// // // // // //                           </Typography>
// // // // // //                         </Box>
// // // // // //                       </Grid>
// // // // // //                       <Grid item xs={6}>
// // // // // //                         <Box display="flex" alignItems="center" gap={0.5}>
// // // // // //                           <ElectricBolt fontSize="small" />
// // // // // //                           <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // // // //                             {fanData.power ?? fan.power}W
// // // // // //                           </Typography>
// // // // // //                         </Box>
// // // // // //                       </Grid>
// // // // // //                       <Grid item xs={6}>
// // // // // //                         <Box display="flex" alignItems="center" gap={0.5}>
// // // // // //                           <Schedule fontSize="small" />
// // // // // //                           <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // // // //                             {(fanData.runtime ?? fan.runtime)?.toFixed(1)}h
// // // // // //                           </Typography>
// // // // // //                         </Box>
// // // // // //                       </Grid>
// // // // // //                       <Grid item xs={6}>
// // // // // //                         <Box display="flex" alignItems="center" gap={0.5}>
// // // // // //                           <Build fontSize="small" />
// // // // // //                           <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // // // //                             {Math.max(0, (fan.maintenanceHours ?? 0) - (fanData.runtime ?? fan.runtime ?? 0)).toFixed(0)}h
// // // // // //                           </Typography>
// // // // // //                         </Box>
// // // // // //                       </Grid>
// // // // // //                     </Grid>
// // // // // //                     {props.showAlarms && fan.alarms && fan.alarms.length > 0 && (
// // // // // //                       <Box mt={1}>{fan.alarms.map((alarm, i) =>
// // // // // //                         <Alert key={i} severity={alarm.type} size="small" style={{ marginBottom: 4 }}>{alarm.message}</Alert>
// // // // // //                       )}</Box>
// // // // // //                     )}
// // // // // //                   </CardContent>
// // // // // //                 </Card>
// // // // // //               </Grid>
// // // // // //             )
// // // // // //           })}
// // // // // //         </Grid>

// // // // // //         {/* Add Fan Dialog */}
// // // // // //         {props.showAddFanDialog && (
// // // // // //           <Dialog open={addFanDialog} onClose={() => setAddFanDialog(false)}>
// // // // // //             <DialogTitle style={{ background: colors.surface, color: colors.text }}>Add New Fan</DialogTitle>
// // // // // //             <DialogContent style={{ background: colors.bg, color: colors.text }}>
// // // // // //               <TextField autoFocus margin="dense" label="Fan Name" fullWidth variant="outlined" value={newFanName} onChange={e => setNewFanName(e.target.value)} />
// // // // // //             </DialogContent>
// // // // // //             <DialogActions style={{ background: colors.surface }}>
// // // // // //               <Button onClick={() => setAddFanDialog(false)}>Cancel</Button>
// // // // // //               <Button onClick={addNewFan} variant="contained" style={{ background: primaryColor, color: "#fff" }}>Add Fan</Button>
// // // // // //             </DialogActions>
// // // // // //           </Dialog>
// // // // // //         )}

// // // // // //         {/* Fan Config Dialog */}
// // // // // //         {props.showFanConfigDialog && selectedFan && (
// // // // // //           <Dialog open={!!selectedFan} onClose={() => setSelectedFan(null)} maxWidth="sm" fullWidth>
// // // // // //             <DialogTitle style={{ background: colors.surface, color: colors.text }}>
// // // // // //               <Box display="flex" alignItems="center" gap={1}><Tune fontSize="small" />Configure {selectedFan.name}</Box>
// // // // // //             </DialogTitle>
// // // // // //             <DialogContent style={{ background: colors.bg, color: colors.text }}>
// // // // // //               <Grid container spacing={2}>
// // // // // //                 <Grid item xs={12}><TextField label="Fan Name" fullWidth value={selectedFan.name} onChange={e => setSelectedFan({ ...selectedFan, name: e.target.value })} /></Grid>
// // // // // //                 <Grid item xs={6}><TextField label="Maintenance Hours" type="number" fullWidth value={selectedFan.maintenanceHours} onChange={e => setSelectedFan({ ...selectedFan, maintenanceHours: Number.parseInt(e.target.value) })} /></Grid>
// // // // // //                 <Grid item xs={6}><TextField label="Last Maintenance" type="date" fullWidth value={selectedFan.lastMaintenance} onChange={e => setSelectedFan({ ...selectedFan, lastMaintenance: e.target.value })} /></Grid>
// // // // // //                 <Grid item xs={6}>
// // // // // //                   <FormControl fullWidth>
// // // // // //                     <InputLabel>Speed Unit</InputLabel>
// // // // // //                     <Select value={selectedFan.speedUnit} label="Speed Unit" onChange={e => setSelectedFan({ ...selectedFan, speedUnit: e.target.value })}>
// // // // // //                       {(props.speedUnits || DEFAULT_SPEED_UNITS).map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
// // // // // //                     </Select>
// // // // // //                   </FormControl>
// // // // // //                 </Grid>
// // // // // //                 <Grid item xs={6}>
// // // // // //                   <FormControl fullWidth>
// // // // // //                     <InputLabel>Temperature Unit</InputLabel>
// // // // // //                     <Select value={selectedFan.tempUnit} label="Temperature Unit" onChange={e => setSelectedFan({ ...selectedFan, tempUnit: e.target.value })}>
// // // // // //                       {(props.tempUnits || DEFAULT_TEMP_UNITS).map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
// // // // // //                     </Select>
// // // // // //                   </FormControl>
// // // // // //                 </Grid>
// // // // // //               </Grid>
// // // // // //             </DialogContent>
// // // // // //             <DialogActions style={{ background: colors.surface }}>
// // // // // //               <Button onClick={() => setSelectedFan(null)} style={{ color: primaryColor }}>Close</Button>
// // // // // //             </DialogActions>
// // // // // //           </Dialog>
// // // // // //         )}
// // // // // //       </CardContent>
// // // // // //     </Card>
// // // // // //   )
// // // // // // }

// // // // // // export default FanControlWidget


// // // // // // // import { useState, useEffect } from "react"
// // // // // // // import {
// // // // // // //   Card, CardContent, Typography, Button, Slider, Switch, Chip, Grid, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Badge, MenuItem, Select, InputLabel, FormControl
// // // // // // // } from "@mui/material"
// // // // // // // import {
// // // // // // //   PlayArrow, Stop, Settings, Warning, Error, CheckCircle, Thermostat, ElectricBolt, Schedule, Build, Add, Delete, Tune,
// // // // // // //   Percent, RotateRight, Opacity
// // // // // // // } from "@mui/icons-material"
// // // // // // // import { useTheme } from "../../theme/ThemeProvider"
// // // // // // // import "../../../styles/fan-control-widget.css"

// // // // // // // const DEFAULT_SPEED_UNITS = [
// // // // // // //   { value: "%", label: "Percentage (%)", icon: <Percent fontSize="small" /> },
// // // // // // //   { value: "RPM", label: "Rotation (RPM)", icon: <RotateRight fontSize="small" /> },
// // // // // // // ]
// // // // // // // const DEFAULT_TEMP_UNITS = [
// // // // // // //   { value: "°C", label: "Celsius (°C)", icon: <Thermostat fontSize="small" /> },
// // // // // // //   { value: "°F", label: "Fahrenheit (°F)", icon: <Thermostat fontSize="small" /> },
// // // // // // //   { value: "K", label: "Kelvin (K)", icon: <Opacity fontSize="small" /> },
// // // // // // // ]

// // // // // // // function buildFanCommandPayload(fanId, command, value) {
// // // // // // //   const payload = {
// // // // // // //     fanId,
// // // // // // //     command,
// // // // // // //     ...(value !== undefined ? { value } : {}),
// // // // // // //     ts: Date.now(),
// // // // // // //   }
// // // // // // //   console.log("[FAN][COMMAND]", JSON.stringify(payload))
// // // // // // //   return payload
// // // // // // // }

// // // // // // // const FanControlWidget = ({
// // // // // // //   fans = [],
// // // // // // //   data = {},
// // // // // // //   dataKeys = ["speed"],
// // // // // // //   ...props
// // // // // // // }) => {
// // // // // // //   const { isDarkMode, primaryColor } = useTheme()
// // // // // // //   const speedKey = Array.isArray(dataKeys) && dataKeys.length ? dataKeys[0] : "speed"
// // // // // // //   const [fanList, setFanList] = useState(fans)
// // // // // // //   const [selectedFan, setSelectedFan] = useState(null)
// // // // // // //   const [addFanDialog, setAddFanDialog] = useState(false)
// // // // // // //   const [newFanName, setNewFanName] = useState("")

// // // // // // //   // --------- Logging and Diagnostics ---------
// // // // // // //   useEffect(() => {
// // // // // // //     console.log("[FAN][DATA][RECEIVED]", JSON.stringify(data))
// // // // // // //     fanList.forEach(fan => {
// // // // // // //       const fanData = data[fan.id] || {}
// // // // // // //       console.log(`[FAN][${fan.id}] status:`, fanData.status, "speed:", fanData.speed, "temp:", fanData.temperature)
// // // // // // //     })
// // // // // // //   }, [data, fanList])

// // // // // // //   useEffect(() => {
// // // // // // //     setFanList(fans)
// // // // // // //     console.log("[FAN][CONFIG][FANS]", fans)
// // // // // // //   }, [fans])

// // // // // // //   // --------- Add/Delete/Config ----------
// // // // // // //   const addNewFan = () => {
// // // // // // //     if (!newFanName.trim()) return
// // // // // // //     const newFan = {
// // // // // // //       id: `fan${Date.now()}`,
// // // // // // //       name: newFanName,
// // // // // // //       status: "stopped",
// // // // // // //       speed: 0,
// // // // // // //       targetSpeed: 0,
// // // // // // //       speedUnit: "%",
// // // // // // //       temperature: 25,
// // // // // // //       tempUnit: "°C",
// // // // // // //       power: 0,
// // // // // // //       runtime: 0,
// // // // // // //       maintenanceHours: 8760,
// // // // // // //       lastMaintenance: new Date().toISOString().split("T")[0],
// // // // // // //       autoMode: false,
// // // // // // //       alarms: [],
// // // // // // //     }
// // // // // // //     setFanList(prev => [...prev, newFan])
// // // // // // //     setNewFanName("")
// // // // // // //     setAddFanDialog(false)
// // // // // // //     if (props.onConfigChange) props.onConfigChange([...fanList, newFan])
// // // // // // //     console.log("[FAN][ADD]", newFan)
// // // // // // //   }

// // // // // // //   const deleteFan = (fanId) => {
// // // // // // //     setFanList(prev => prev.filter(f => f.id !== fanId))
// // // // // // //     if (props.onConfigChange) props.onConfigChange(fanList.filter(f => f.id !== fanId))
// // // // // // //     console.log("[FAN][DELETE]", fanId)
// // // // // // //   }

// // // // // // //   // -------- MQTT/control actions with logging --------
// // // // // // //   const handleFanControl = (fanId, action) => {
// // // // // // //     console.log(`[FAN][CONTROL][${fanId}] Action:`, action)
// // // // // // //     if (props.onControlChange) props.onControlChange(fanId, "action", action)
// // // // // // //     if (typeof props.sendMqttCommand === "function") {
// // // // // // //       props.sendMqttCommand(buildFanCommandPayload(fanId, action))
// // // // // // //     }
// // // // // // //   }
// // // // // // //   const handleSpeedChange = (fanId, value) => {
// // // // // // //     console.log(`[FAN][CONTROL][${fanId}] Set Speed:`, value)
// // // // // // //     if (props.onControlChange) props.onControlChange(fanId, "targetSpeed", value)
// // // // // // //     if (typeof props.sendMqttCommand === "function") {
// // // // // // //       props.sendMqttCommand(buildFanCommandPayload(fanId, "set_speed", value))
// // // // // // //     }
// // // // // // //   }
// // // // // // //   const handleAutoModeToggle = (fanId, current) => {
// // // // // // //     console.log(`[FAN][CONTROL][${fanId}] Auto Mode:`, !current)
// // // // // // //     if (props.onControlChange) props.onControlChange(fanId, "autoMode", !current)
// // // // // // //     if (typeof props.sendMqttCommand === "function") {
// // // // // // //       props.sendMqttCommand(buildFanCommandPayload(fanId, "auto_mode", !current))
// // // // // // //     }
// // // // // // //   }
// // // // // // //   const handleAllFans = (action) => {
// // // // // // //     console.log(`[FAN][CONTROL][ALL] Action:`, action)
// // // // // // //     fanList.forEach(fan => handleFanControl(fan.id, action))
// // // // // // //   }

// // // // // // //   // --------- Data helpers: status & value from nested object ---------
// // // // // // //   function getLatestValue(fanId, key, fallback) {
// // // // // // //     if (data && typeof data === "object" && data[fanId] && key in data[fanId]) {
// // // // // // //       return data[fanId][key]
// // // // // // //     }
// // // // // // //     return fallback
// // // // // // //   }
// // // // // // //   function getFanStatus(fanId, fallback) {
// // // // // // //     if (data && typeof data === "object" && data[fanId]) {
// // // // // // //       const raw = data[fanId].status
// // // // // // //       if (raw === "on" || raw === true) return "running"
// // // // // // //       if (raw === "off" || raw === false) return "stopped"
// // // // // // //       if (typeof raw === "string") return raw // fallback for legacy
// // // // // // //     }
// // // // // // //     return fallback
// // // // // // //   }

// // // // // // //   const themeColors = {
// // // // // // //     light: { bg: "#fff", bgElevated: "#fafbfc", cardBorder: "#e0e0e0", text: "#222", textSecondary: "#444", surface: "#f6f8fa", },
// // // // // // //     dark: { bg: "#141414", bgElevated: "#23272f", cardBorder: "#24272b", text: "#fff", textSecondary: "#bbb", surface: "#181c23", }
// // // // // // //   }
// // // // // // //   const colors = themeColors[isDarkMode ? "dark" : "light"]

// // // // // // //   const getStatusColor = (status) =>
// // // // // // //     status === "running" ? "#4caf50" : status === "failed" ? "#f44336" : colors.cardBorder
// // // // // // //   const getStatusIcon = (fan) => {
// // // // // // //     const status = getFanStatus(fan.id, fan.status)
// // // // // // //     return status === "running" ? <CheckCircle style={{ color: "#4caf50" }} />
// // // // // // //       : status === "failed" ? <Error style={{ color: "#f44336" }} />
// // // // // // //         : <Stop style={{ color: colors.textSecondary }} />
// // // // // // //   }

// // // // // // //   const runningFans = fanList.filter(fan => getFanStatus(fan.id, fan.status) === "running").length
// // // // // // //   const totalAlarms = fanList.reduce((sum, fan) => sum + (fan.alarms?.length || 0), 0)

// // // // // // //   return (
// // // // // // //     <Card className={`fan-control-widget ${isDarkMode ? "fan-widget-dark" : ""}`}
// // // // // // //       style={{ background: colors.bg, color: colors.text, }}
// // // // // // //     >
// // // // // // //       <CardContent style={{ background: colors.bg }}>
// // // // // // //         <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
// // // // // // //           <Typography variant="h6" style={{ color: primaryColor, fontWeight: 700, letterSpacing: 0.2 }}>{props.title}</Typography>
// // // // // // //           <Box display="flex" gap={1}>
// // // // // // //             {props.showStats && (
// // // // // // //               <Chip label={`${runningFans}/${fanList.length} Running`} color={runningFans > 0 ? "success" : "default"} size="small" />
// // // // // // //             )}
// // // // // // //             {props.showAlarms && totalAlarms > 0 && (
// // // // // // //               <Badge badgeContent={totalAlarms} color="error">
// // // // // // //                 <Warning color="warning" />
// // // // // // //               </Badge>
// // // // // // //             )}
// // // // // // //             {props.showAddFan && (
// // // // // // //               <IconButton size="small" onClick={() => setAddFanDialog(true)} style={{ color: primaryColor }}>
// // // // // // //                 <Add />
// // // // // // //               </IconButton>
// // // // // // //             )}
// // // // // // //           </Box>
// // // // // // //         </Box>

// // // // // // //         {props.showAllControl && (
// // // // // // //           <Box mb={2} display="flex" gap={2}>
// // // // // // //             <Button variant="contained" color="success" startIcon={<PlayArrow />} size="small"
// // // // // // //               onClick={() => handleAllFans("start")}>Start All</Button>
// // // // // // //             <Button variant="contained" color="error" startIcon={<Stop />} size="small"
// // // // // // //               onClick={() => handleAllFans("stop")}>Stop All</Button>
// // // // // // //           </Box>
// // // // // // //         )}

// // // // // // //         <Grid container spacing={1}>
// // // // // // //           {fanList.map((fan) => {
// // // // // // //             const status = getFanStatus(fan.id, fan.status)
// // // // // // //             const speed = getLatestValue(fan.id, speedKey, fan.targetSpeed ?? 0)

// // // // // // //             return (
// // // // // // //               <Grid item xs={12} md={6} key={fan.id}>
// // // // // // //                 <Card
// // // // // // //                   variant="outlined"
// // // // // // //                   className={`fan-card ${status} ${isDarkMode ? "fan-card-dark" : ""}`}
// // // // // // //                   style={{
// // // // // // //                     borderColor: getStatusColor(status),
// // // // // // //                     background: colors.bgElevated,
// // // // // // //                     color: colors.text,
// // // // // // //                   }}
// // // // // // //                 >
// // // // // // //                   <CardContent>
// // // // // // //                     <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
// // // // // // //                       <Typography variant="subtitle1" fontWeight="bold" style={{ color: colors.text }}>
// // // // // // //                         {fan.name}
// // // // // // //                       </Typography>
// // // // // // //                       <Box display="flex" alignItems="center" gap={1}>
// // // // // // //                         {getStatusIcon(fan)}
// // // // // // //                         {props.showEditFan && (
// // // // // // //                           <IconButton size="small" onClick={() => setSelectedFan(fan)} style={{ color: primaryColor }}>
// // // // // // //                             <Settings />
// // // // // // //                           </IconButton>
// // // // // // //                         )}
// // // // // // //                         {props.showDeleteFan && (
// // // // // // //                           <IconButton size="small" onClick={() => deleteFan(fan.id)} color="error">
// // // // // // //                             <Delete />
// // // // // // //                           </IconButton>
// // // // // // //                         )}
// // // // // // //                       </Box>
// // // // // // //                     </Box>
// // // // // // //                     <Box display="flex" justifyContent="center" mb={2}>
// // // // // // //                       <div className={`fan-blade ${status === "running" ? "spinning" : ""} ${isDarkMode ? "blade-dark" : ""}`}
// // // // // // //                         style={{ animationDuration: speed > 0 ? `${2 - speed / 50}s` : "0s" }}>
// // // // // // //                         <div className="fan-center"></div>
// // // // // // //                         <div className="blade" style={{ transform: "rotate(0deg)" }}></div>
// // // // // // //                         <div className="blade" style={{ transform: "rotate(90deg)" }}></div>
// // // // // // //                         <div className="blade" style={{ transform: "rotate(180deg)" }}></div>
// // // // // // //                         <div className="blade" style={{ transform: "rotate(270deg)" }}></div>
// // // // // // //                       </div>
// // // // // // //                     </Box>
// // // // // // //                     {(props.showStartStop || props.showAutoMode || props.showReset) && (
// // // // // // //                       <Box mb={2}>
// // // // // // //                         {props.showStartStop && (
// // // // // // //                           <Box display="flex" gap={1} mb={1}>
// // // // // // //                             <Button size="small" startIcon={<PlayArrow />} onClick={() => handleFanControl(fan.id, "start")} disabled={status === "failed"} variant="outlined" color="success">Start</Button>
// // // // // // //                             <Button size="small" startIcon={<Stop />} onClick={() => handleFanControl(fan.id, "stop")} variant="outlined" color="error">Stop</Button>
// // // // // // //                             {props.showReset && status === "failed" && (
// // // // // // //                               <Button size="small" onClick={() => handleFanControl(fan.id, "reset")} variant="outlined">Reset</Button>
// // // // // // //                             )}
// // // // // // //                           </Box>
// // // // // // //                         )}
// // // // // // //                         {props.showAutoMode && (
// // // // // // //                           <Box display="flex" alignItems="center" gap={1} mb={1}>
// // // // // // //                             <Typography variant="caption" style={{ color: colors.textSecondary }}>Auto Mode:</Typography>
// // // // // // //                             <Switch size="small" checked={fan.autoMode} onChange={() => handleAutoModeToggle(fan.id, fan.autoMode)} />
// // // // // // //                           </Box>
// // // // // // //                         )}
// // // // // // //                       </Box>
// // // // // // //                     )}
// // // // // // //                     {props.showSpeedSet && (
// // // // // // //                       <Box mb={2}>
// // // // // // //                         <Typography variant="caption" gutterBottom style={{ color: colors.textSecondary }}>
// // // // // // //                           Speed: {speed} {fan.speedUnit}
// // // // // // //                         </Typography>
// // // // // // //                         <Slider
// // // // // // //                           value={speed}
// // // // // // //                           onChange={(e, value) => handleSpeedChange(fan.id, value)}
// // // // // // //                           disabled={status === "failed"}
// // // // // // //                           min={props.minSpeed}
// // // // // // //                           max={fan.speedUnit === "RPM" ? props.maxSpeedRpm : props.maxSpeedPercent}
// // // // // // //                           size="small"
// // // // // // //                           sx={{
// // // // // // //                             color: primaryColor,
// // // // // // //                             '& .MuiSlider-rail': { backgroundColor: isDarkMode ? "#222" : "#eee" },
// // // // // // //                           }}
// // // // // // //                         />
// // // // // // //                       </Box>
// // // // // // //                     )}
// // // // // // //                     <Grid container spacing={1}>
// // // // // // //                       <Grid item xs={6}>
// // // // // // //                         <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // //                           <Thermostat fontSize="small" />
// // // // // // //                           <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // // // // //                             {getLatestValue(fan.id, "temperature", fan.temperature)}{fan.tempUnit}
// // // // // // //                           </Typography>
// // // // // // //                         </Box>
// // // // // // //                       </Grid>
// // // // // // //                       <Grid item xs={6}>
// // // // // // //                         <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // //                           <ElectricBolt fontSize="small" />
// // // // // // //                           <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // // // // //                             {getLatestValue(fan.id, "power", fan.power)}W
// // // // // // //                           </Typography>
// // // // // // //                         </Box>
// // // // // // //                       </Grid>
// // // // // // //                       <Grid item xs={6}>
// // // // // // //                         <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // //                           <Schedule fontSize="small" />
// // // // // // //                           <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // // // // //                             {getLatestValue(fan.id, "runtime", fan.runtime)?.toFixed(1)}h
// // // // // // //                           </Typography>
// // // // // // //                         </Box>
// // // // // // //                       </Grid>
// // // // // // //                       <Grid item xs={6}>
// // // // // // //                         <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // //                           <Build fontSize="small" />
// // // // // // //                           <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // // // // //                             {Math.max(0, (fan.maintenanceHours ?? 0) - (getLatestValue(fan.id, "runtime", fan.runtime) ?? 0)).toFixed(0)}h
// // // // // // //                           </Typography>
// // // // // // //                         </Box>
// // // // // // //                       </Grid>
// // // // // // //                     </Grid>
// // // // // // //                     {props.showAlarms && fan.alarms && fan.alarms.length > 0 && (
// // // // // // //                       <Box mt={1}>{fan.alarms.map((alarm, i) =>
// // // // // // //                         <Alert key={i} severity={alarm.type} size="small" style={{ marginBottom: 4 }}>{alarm.message}</Alert>
// // // // // // //                       )}</Box>
// // // // // // //                     )}
// // // // // // //                   </CardContent>
// // // // // // //                 </Card>
// // // // // // //               </Grid>
// // // // // // //             )
// // // // // // //           })}
// // // // // // //         </Grid>

// // // // // // //         {/* Add Fan Dialog */}
// // // // // // //         {props.showAddFanDialog && (
// // // // // // //           <Dialog open={addFanDialog} onClose={() => setAddFanDialog(false)}>
// // // // // // //             <DialogTitle style={{ background: colors.surface, color: colors.text }}>Add New Fan</DialogTitle>
// // // // // // //             <DialogContent style={{ background: colors.bg, color: colors.text }}>
// // // // // // //               <TextField autoFocus margin="dense" label="Fan Name" fullWidth variant="outlined" value={newFanName} onChange={e => setNewFanName(e.target.value)} />
// // // // // // //             </DialogContent>
// // // // // // //             <DialogActions style={{ background: colors.surface }}>
// // // // // // //               <Button onClick={() => setAddFanDialog(false)}>Cancel</Button>
// // // // // // //               <Button onClick={addNewFan} variant="contained" style={{ background: primaryColor, color: "#fff" }}>Add Fan</Button>
// // // // // // //             </DialogActions>
// // // // // // //           </Dialog>
// // // // // // //         )}

// // // // // // //         {/* Fan Config Dialog */}
// // // // // // //         {props.showFanConfigDialog && selectedFan && (
// // // // // // //           <Dialog open={!!selectedFan} onClose={() => setSelectedFan(null)} maxWidth="sm" fullWidth>
// // // // // // //             <DialogTitle style={{ background: colors.surface, color: colors.text }}>
// // // // // // //               <Box display="flex" alignItems="center" gap={1}><Tune fontSize="small" />Configure {selectedFan.name}</Box>
// // // // // // //             </DialogTitle>
// // // // // // //             <DialogContent style={{ background: colors.bg, color: colors.text }}>
// // // // // // //               <Grid container spacing={2}>
// // // // // // //                 <Grid item xs={12}><TextField label="Fan Name" fullWidth value={selectedFan.name} onChange={e => setSelectedFan({ ...selectedFan, name: e.target.value })} /></Grid>
// // // // // // //                 <Grid item xs={6}><TextField label="Maintenance Hours" type="number" fullWidth value={selectedFan.maintenanceHours} onChange={e => setSelectedFan({ ...selectedFan, maintenanceHours: Number.parseInt(e.target.value) })} /></Grid>
// // // // // // //                 <Grid item xs={6}><TextField label="Last Maintenance" type="date" fullWidth value={selectedFan.lastMaintenance} onChange={e => setSelectedFan({ ...selectedFan, lastMaintenance: e.target.value })} /></Grid>
// // // // // // //                 <Grid item xs={6}>
// // // // // // //                   <FormControl fullWidth>
// // // // // // //                     <InputLabel>Speed Unit</InputLabel>
// // // // // // //                     <Select value={selectedFan.speedUnit} label="Speed Unit" onChange={e => setSelectedFan({ ...selectedFan, speedUnit: e.target.value })}>
// // // // // // //                       {(props.speedUnits || DEFAULT_SPEED_UNITS).map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
// // // // // // //                     </Select>
// // // // // // //                   </FormControl>
// // // // // // //                 </Grid>
// // // // // // //                 <Grid item xs={6}>
// // // // // // //                   <FormControl fullWidth>
// // // // // // //                     <InputLabel>Temperature Unit</InputLabel>
// // // // // // //                     <Select value={selectedFan.tempUnit} label="Temperature Unit" onChange={e => setSelectedFan({ ...selectedFan, tempUnit: e.target.value })}>
// // // // // // //                       {(props.tempUnits || DEFAULT_TEMP_UNITS).map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
// // // // // // //                     </Select>
// // // // // // //                   </FormControl>
// // // // // // //                 </Grid>
// // // // // // //               </Grid>
// // // // // // //             </DialogContent>
// // // // // // //             <DialogActions style={{ background: colors.surface }}>
// // // // // // //               <Button onClick={() => setSelectedFan(null)} style={{ color: primaryColor }}>Close</Button>
// // // // // // //             </DialogActions>
// // // // // // //           </Dialog>
// // // // // // //         )}
// // // // // // //       </CardContent>
// // // // // // //     </Card>
// // // // // // //   )
// // // // // // // }

// // // // // // // export default FanControlWidget


// // // // // // // // import { useState, useEffect } from "react"
// // // // // // // // import {
// // // // // // // //   Card, CardContent, Typography, Button, Slider, Switch, Chip, Grid, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Badge, MenuItem, Select, InputLabel, FormControl
// // // // // // // // } from "@mui/material"
// // // // // // // // import {
// // // // // // // //   PlayArrow, Stop, Settings, Warning, Error, CheckCircle, Thermostat, ElectricBolt, Schedule, Build, Add, Delete, Tune,
// // // // // // // //   Percent, RotateRight, Opacity, ArrowUpward, ArrowDownward
// // // // // // // // } from "@mui/icons-material"
// // // // // // // // import { useTheme } from "../../theme/ThemeProvider"
// // // // // // // // import "../../../styles/fan-control-widget.css"

// // // // // // // // const DEFAULT_SPEED_UNITS = [
// // // // // // // //   { value: "%", label: "Percentage (%)", icon: <Percent fontSize="small" /> },
// // // // // // // //   { value: "RPM", label: "Rotation (RPM)", icon: <RotateRight fontSize="small" /> },
// // // // // // // // ]
// // // // // // // // const DEFAULT_TEMP_UNITS = [
// // // // // // // //   { value: "°C", label: "Celsius (°C)", icon: <Thermostat fontSize="small" /> },
// // // // // // // //   { value: "°F", label: "Fahrenheit (°F)", icon: <Thermostat fontSize="small" /> },
// // // // // // // //   { value: "K", label: "Kelvin (K)", icon: <Opacity fontSize="small" /> },
// // // // // // // // ]

// // // // // // // // function buildFanCommandPayload(fanId, command, value) {
// // // // // // // //   return {
// // // // // // // //     fanId,
// // // // // // // //     command,
// // // // // // // //     ...(value !== undefined ? { value } : {}),
// // // // // // // //     ts: Date.now(),
// // // // // // // //   }
// // // // // // // // }

// // // // // // // // const FanControlWidget = ({
// // // // // // // //   fans = [],          // [{ id, name, ... }]
// // // // // // // //   data = {},          // { fan1: {...}, fan2: {...} }
// // // // // // // //   dataKeys = ["speed"],
// // // // // // // //   ...props
// // // // // // // // }) => {
// // // // // // // //   const { isDarkMode, primaryColor } = useTheme()

// // // // // // // //   const speedKey = Array.isArray(dataKeys) && dataKeys.length ? dataKeys[0] : "speed"

// // // // // // // //   const [fanList, setFanList] = useState(fans)
// // // // // // // //   const [selectedFan, setSelectedFan] = useState(null)
// // // // // // // //   const [addFanDialog, setAddFanDialog] = useState(false)
// // // // // // // //   const [newFanName, setNewFanName] = useState("")

// // // // // // // //   useEffect(() => {
// // // // // // // //     setFanList(fans)
// // // // // // // //   }, [fans])

// // // // // // // //   // Add/Delete/Config
// // // // // // // //   const addNewFan = () => {
// // // // // // // //     if (!newFanName.trim()) return
// // // // // // // //     const newFan = {
// // // // // // // //       id: `fan${Date.now()}`, name: newFanName, status: "stopped", speed: 0, targetSpeed: 0, speedUnit: "%",
// // // // // // // //       temperature: 25, tempUnit: "°C", power: 0, runtime: 0, maintenanceHours: 8760,
// // // // // // // //       lastMaintenance: new Date().toISOString().split("T")[0], autoMode: false, alarms: [],
// // // // // // // //     }
// // // // // // // //     setFanList(prev => [...prev, newFan])
// // // // // // // //     setNewFanName("")
// // // // // // // //     setAddFanDialog(false)
// // // // // // // //     if (props.onConfigChange) props.onConfigChange([...fanList, newFan])
// // // // // // // //   }
// // // // // // // //   const deleteFan = (fanId) => {
// // // // // // // //     setFanList(prev => prev.filter(f => f.id !== fanId))
// // // // // // // //     if (props.onConfigChange) props.onConfigChange(fanList.filter(f => f.id !== fanId))
// // // // // // // //   }

// // // // // // // //   // MQTT control
// // // // // // // //   const handleFanControl = (fanId, action) => {
// // // // // // // //     if (props.onControlChange) props.onControlChange(fanId, "action", action)
// // // // // // // //     if (typeof props.sendMqttCommand === "function") {
// // // // // // // //       props.sendMqttCommand(buildFanCommandPayload(fanId, action))
// // // // // // // //     }
// // // // // // // //   }
// // // // // // // //   const handleSpeedChange = (fanId, value) => {
// // // // // // // //     if (props.onControlChange) props.onControlChange(fanId, "targetSpeed", value)
// // // // // // // //     if (typeof props.sendMqttCommand === "function") {
// // // // // // // //       props.sendMqttCommand(buildFanCommandPayload(fanId, "set_speed", value))
// // // // // // // //     }
// // // // // // // //   }
// // // // // // // //   const handleAutoModeToggle = (fanId, current) => {
// // // // // // // //     if (props.onControlChange) props.onControlChange(fanId, "autoMode", !current)
// // // // // // // //     if (typeof props.sendMqttCommand === "function") {
// // // // // // // //       props.sendMqttCommand(buildFanCommandPayload(fanId, "auto_mode", !current))
// // // // // // // //     }
// // // // // // // //   }
// // // // // // // //   const handleAllFans = (action) => {
// // // // // // // //     fanList.forEach(fan => handleFanControl(fan.id, action))
// // // // // // // //   }

// // // // // // // //   // -- **KEY: Read value from nested data object** --
// // // // // // // //   function getLatestValue(fanId, key, fallback) {
// // // // // // // //     if (data && typeof data === "object" && data[fanId] && key in data[fanId]) {
// // // // // // // //       return data[fanId][key]
// // // // // // // //     }
// // // // // // // //     return fallback
// // // // // // // //   }
// // // // // // // //   // For trend/analytics (not supported in nested object unless you add history)

// // // // // // // //   // UI helpers...
// // // // // // // //   const themeColors = {
// // // // // // // //     light: { bg: "#fff", bgElevated: "#fafbfc", cardBorder: "#e0e0e0", text: "#222", textSecondary: "#444", surface: "#f6f8fa", },
// // // // // // // //     dark: { bg: "#141414", bgElevated: "#23272f", cardBorder: "#24272b", text: "#fff", textSecondary: "#bbb", surface: "#181c23", }
// // // // // // // //   }
// // // // // // // //   const colors = themeColors[isDarkMode ? "dark" : "light"]

// // // // // // // //   const getStatusColor = (status) =>
// // // // // // // //     status === "running" ? "#4caf50" : status === "failed" ? "#f44336" : colors.cardBorder
// // // // // // // //   const getStatusIcon = (fan) =>
// // // // // // // //     fan.status === "running" ? <CheckCircle style={{ color: "#4caf50" }} />
// // // // // // // //       : fan.status === "failed" ? <Error style={{ color: "#f44336" }} />
// // // // // // // //         : <Stop style={{ color: colors.textSecondary }} />

// // // // // // // //   const runningFans = fanList.filter(fan => fan.status === "running").length
// // // // // // // //   const totalAlarms = fanList.reduce((sum, fan) => sum + (fan.alarms?.length || 0), 0)

// // // // // // // //   return (
// // // // // // // //     <Card className={`fan-control-widget ${isDarkMode ? "fan-widget-dark" : ""}`}
// // // // // // // //       style={{ background: colors.bg, color: colors.text, }}
// // // // // // // //     >
// // // // // // // //       <CardContent style={{ background: colors.bg }}>
// // // // // // // //         <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
// // // // // // // //           <Typography variant="h6" style={{ color: primaryColor, fontWeight: 700, letterSpacing: 0.2 }}>{props.title}</Typography>
// // // // // // // //           <Box display="flex" gap={1}>
// // // // // // // //             {props.showStats && (
// // // // // // // //               <Chip label={`${runningFans}/${fanList.length} Running`} color={runningFans > 0 ? "success" : "default"} size="small" />
// // // // // // // //             )}
// // // // // // // //             {props.showAlarms && totalAlarms > 0 && (
// // // // // // // //               <Badge badgeContent={totalAlarms} color="error">
// // // // // // // //                 <Warning color="warning" />
// // // // // // // //               </Badge>
// // // // // // // //             )}
// // // // // // // //             {props.showAddFan && (
// // // // // // // //               <IconButton size="small" onClick={() => setAddFanDialog(true)} style={{ color: primaryColor }}>
// // // // // // // //                 <Add />
// // // // // // // //               </IconButton>
// // // // // // // //             )}
// // // // // // // //           </Box>
// // // // // // // //         </Box>

// // // // // // // //         {props.showAllControl && (
// // // // // // // //           <Box mb={2} display="flex" gap={2}>
// // // // // // // //             <Button variant="contained" color="success" startIcon={<PlayArrow />} size="small"
// // // // // // // //               onClick={() => handleAllFans("start")}>Start All</Button>
// // // // // // // //             <Button variant="contained" color="error" startIcon={<Stop />} size="small"
// // // // // // // //               onClick={() => handleAllFans("stop")}>Stop All</Button>
// // // // // // // //           </Box>
// // // // // // // //         )}

// // // // // // // //         <Grid container spacing={1}>
// // // // // // // //           {fanList.map((fan) => {
// // // // // // // //             const speed = getLatestValue(fan.id, speedKey, fan.targetSpeed ?? 0)
// // // // // // // //             // const prevSpeed = ... // If you want trend, you'll need to store previous state

// // // // // // // //             return (
// // // // // // // //               <Grid item xs={12} md={6} key={fan.id}>
// // // // // // // //                 <Card
// // // // // // // //                   variant="outlined"
// // // // // // // //                   className={`fan-card ${fan.status} ${isDarkMode ? "fan-card-dark" : ""}`}
// // // // // // // //                   style={{
// // // // // // // //                     borderColor: getStatusColor(fan.status),
// // // // // // // //                     background: colors.bgElevated,
// // // // // // // //                     color: colors.text,
// // // // // // // //                   }}
// // // // // // // //                 >
// // // // // // // //                   <CardContent>
// // // // // // // //                     <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
// // // // // // // //                       <Typography variant="subtitle1" fontWeight="bold" style={{ color: colors.text }}>
// // // // // // // //                         {fan.name}
// // // // // // // //                       </Typography>
// // // // // // // //                       <Box display="flex" alignItems="center" gap={1}>
// // // // // // // //                         {getStatusIcon(fan)}
// // // // // // // //                         {props.showEditFan && (
// // // // // // // //                           <IconButton size="small" onClick={() => setSelectedFan(fan)} style={{ color: primaryColor }}>
// // // // // // // //                             <Settings />
// // // // // // // //                           </IconButton>
// // // // // // // //                         )}
// // // // // // // //                         {props.showDeleteFan && (
// // // // // // // //                           <IconButton size="small" onClick={() => deleteFan(fan.id)} color="error">
// // // // // // // //                             <Delete />
// // // // // // // //                           </IconButton>
// // // // // // // //                         )}
// // // // // // // //                       </Box>
// // // // // // // //                     </Box>
// // // // // // // //                     <Box display="flex" justifyContent="center" mb={2}>
// // // // // // // //                       <div className={`fan-blade ${fan.status === "running" ? "spinning" : ""} ${isDarkMode ? "blade-dark" : ""}`}
// // // // // // // //                         style={{ animationDuration: speed > 0 ? `${2 - speed / 50}s` : "0s" }}>
// // // // // // // //                         <div className="fan-center"></div>
// // // // // // // //                         <div className="blade" style={{ transform: "rotate(0deg)" }}></div>
// // // // // // // //                         <div className="blade" style={{ transform: "rotate(90deg)" }}></div>
// // // // // // // //                         <div className="blade" style={{ transform: "rotate(180deg)" }}></div>
// // // // // // // //                         <div className="blade" style={{ transform: "rotate(270deg)" }}></div>
// // // // // // // //                       </div>
// // // // // // // //                     </Box>
// // // // // // // //                     {(props.showStartStop || props.showAutoMode || props.showReset) && (
// // // // // // // //                       <Box mb={2}>
// // // // // // // //                         {props.showStartStop && (
// // // // // // // //                           <Box display="flex" gap={1} mb={1}>
// // // // // // // //                             <Button size="small" startIcon={<PlayArrow />} onClick={() => handleFanControl(fan.id, "start")} disabled={fan.status === "failed"} variant="outlined" color="success">Start</Button>
// // // // // // // //                             <Button size="small" startIcon={<Stop />} onClick={() => handleFanControl(fan.id, "stop")} variant="outlined" color="error">Stop</Button>
// // // // // // // //                             {props.showReset && fan.status === "failed" && (
// // // // // // // //                               <Button size="small" onClick={() => handleFanControl(fan.id, "reset")} variant="outlined">Reset</Button>
// // // // // // // //                             )}
// // // // // // // //                           </Box>
// // // // // // // //                         )}
// // // // // // // //                         {props.showAutoMode && (
// // // // // // // //                           <Box display="flex" alignItems="center" gap={1} mb={1}>
// // // // // // // //                             <Typography variant="caption" style={{ color: colors.textSecondary }}>Auto Mode:</Typography>
// // // // // // // //                             <Switch size="small" checked={fan.autoMode} onChange={() => handleAutoModeToggle(fan.id, fan.autoMode)} />
// // // // // // // //                           </Box>
// // // // // // // //                         )}
// // // // // // // //                       </Box>
// // // // // // // //                     )}
// // // // // // // //                     {props.showSpeedSet && (
// // // // // // // //                       <Box mb={2}>
// // // // // // // //                         <Typography variant="caption" gutterBottom style={{ color: colors.textSecondary }}>
// // // // // // // //                           Speed: {speed} {fan.speedUnit}
// // // // // // // //                         </Typography>
// // // // // // // //                         <Slider
// // // // // // // //                           value={speed}
// // // // // // // //                           onChange={(e, value) => handleSpeedChange(fan.id, value)}
// // // // // // // //                           disabled={fan.status === "failed"}
// // // // // // // //                           min={props.minSpeed}
// // // // // // // //                           max={fan.speedUnit === "RPM" ? props.maxSpeedRpm : props.maxSpeedPercent}
// // // // // // // //                           size="small"
// // // // // // // //                           sx={{
// // // // // // // //                             color: primaryColor,
// // // // // // // //                             '& .MuiSlider-rail': { backgroundColor: isDarkMode ? "#222" : "#eee" },
// // // // // // // //                           }}
// // // // // // // //                         />
// // // // // // // //                       </Box>
// // // // // // // //                     )}
// // // // // // // //                     <Grid container spacing={1}>
// // // // // // // //                       <Grid item xs={6}>
// // // // // // // //                         <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // // //                           <Thermostat fontSize="small" />
// // // // // // // //                           <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // // // // // //                             {getLatestValue(fan.id, "temperature", fan.temperature)}{fan.tempUnit}
// // // // // // // //                           </Typography>
// // // // // // // //                         </Box>
// // // // // // // //                       </Grid>
// // // // // // // //                       <Grid item xs={6}>
// // // // // // // //                         <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // // //                           <ElectricBolt fontSize="small" />
// // // // // // // //                           <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // // // // // //                             {getLatestValue(fan.id, "power", fan.power)}W
// // // // // // // //                           </Typography>
// // // // // // // //                         </Box>
// // // // // // // //                       </Grid>
// // // // // // // //                       <Grid item xs={6}>
// // // // // // // //                         <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // // //                           <Schedule fontSize="small" />
// // // // // // // //                           <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // // // // // //                             {getLatestValue(fan.id, "runtime", fan.runtime)?.toFixed(1)}h
// // // // // // // //                           </Typography>
// // // // // // // //                         </Box>
// // // // // // // //                       </Grid>
// // // // // // // //                       <Grid item xs={6}>
// // // // // // // //                         <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // // //                           <Build fontSize="small" />
// // // // // // // //                           <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // // // // // //                             {Math.max(0, (fan.maintenanceHours ?? 0) - (getLatestValue(fan.id, "runtime", fan.runtime) ?? 0)).toFixed(0)}h
// // // // // // // //                           </Typography>
// // // // // // // //                         </Box>
// // // // // // // //                       </Grid>
// // // // // // // //                     </Grid>
// // // // // // // //                     {props.showAlarms && fan.alarms && fan.alarms.length > 0 && (
// // // // // // // //                       <Box mt={1}>{fan.alarms.map((alarm, i) =>
// // // // // // // //                         <Alert key={i} severity={alarm.type} size="small" style={{ marginBottom: 4 }}>{alarm.message}</Alert>
// // // // // // // //                       )}</Box>
// // // // // // // //                     )}
// // // // // // // //                   </CardContent>
// // // // // // // //                 </Card>
// // // // // // // //               </Grid>
// // // // // // // //             )
// // // // // // // //           })}
// // // // // // // //         </Grid>

// // // // // // // //         {/* Add Fan Dialog */}
// // // // // // // //         {props.showAddFanDialog && (
// // // // // // // //           <Dialog open={addFanDialog} onClose={() => setAddFanDialog(false)}>
// // // // // // // //             <DialogTitle style={{ background: colors.surface, color: colors.text }}>Add New Fan</DialogTitle>
// // // // // // // //             <DialogContent style={{ background: colors.bg, color: colors.text }}>
// // // // // // // //               <TextField autoFocus margin="dense" label="Fan Name" fullWidth variant="outlined" value={newFanName} onChange={e => setNewFanName(e.target.value)} />
// // // // // // // //             </DialogContent>
// // // // // // // //             <DialogActions style={{ background: colors.surface }}>
// // // // // // // //               <Button onClick={() => setAddFanDialog(false)}>Cancel</Button>
// // // // // // // //               <Button onClick={addNewFan} variant="contained" style={{ background: primaryColor, color: "#fff" }}>Add Fan</Button>
// // // // // // // //             </DialogActions>
// // // // // // // //           </Dialog>
// // // // // // // //         )}

// // // // // // // //         {/* Fan Config Dialog */}
// // // // // // // //         {props.showFanConfigDialog && selectedFan && (
// // // // // // // //           <Dialog open={!!selectedFan} onClose={() => setSelectedFan(null)} maxWidth="sm" fullWidth>
// // // // // // // //             <DialogTitle style={{ background: colors.surface, color: colors.text }}>
// // // // // // // //               <Box display="flex" alignItems="center" gap={1}><Tune fontSize="small" />Configure {selectedFan.name}</Box>
// // // // // // // //             </DialogTitle>
// // // // // // // //             <DialogContent style={{ background: colors.bg, color: colors.text }}>
// // // // // // // //               <Grid container spacing={2}>
// // // // // // // //                 <Grid item xs={12}><TextField label="Fan Name" fullWidth value={selectedFan.name} onChange={e => setSelectedFan({ ...selectedFan, name: e.target.value })} /></Grid>
// // // // // // // //                 <Grid item xs={6}><TextField label="Maintenance Hours" type="number" fullWidth value={selectedFan.maintenanceHours} onChange={e => setSelectedFan({ ...selectedFan, maintenanceHours: Number.parseInt(e.target.value) })} /></Grid>
// // // // // // // //                 <Grid item xs={6}><TextField label="Last Maintenance" type="date" fullWidth value={selectedFan.lastMaintenance} onChange={e => setSelectedFan({ ...selectedFan, lastMaintenance: e.target.value })} /></Grid>
// // // // // // // //                 <Grid item xs={6}>
// // // // // // // //                   <FormControl fullWidth>
// // // // // // // //                     <InputLabel>Speed Unit</InputLabel>
// // // // // // // //                     <Select value={selectedFan.speedUnit} label="Speed Unit" onChange={e => setSelectedFan({ ...selectedFan, speedUnit: e.target.value })}>
// // // // // // // //                       {(props.speedUnits || DEFAULT_SPEED_UNITS).map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
// // // // // // // //                     </Select>
// // // // // // // //                   </FormControl>
// // // // // // // //                 </Grid>
// // // // // // // //                 <Grid item xs={6}>
// // // // // // // //                   <FormControl fullWidth>
// // // // // // // //                     <InputLabel>Temperature Unit</InputLabel>
// // // // // // // //                     <Select value={selectedFan.tempUnit} label="Temperature Unit" onChange={e => setSelectedFan({ ...selectedFan, tempUnit: e.target.value })}>
// // // // // // // //                       {(props.tempUnits || DEFAULT_TEMP_UNITS).map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
// // // // // // // //                     </Select>
// // // // // // // //                   </FormControl>
// // // // // // // //                 </Grid>
// // // // // // // //               </Grid>
// // // // // // // //             </DialogContent>
// // // // // // // //             <DialogActions style={{ background: colors.surface }}>
// // // // // // // //               <Button onClick={() => setSelectedFan(null)} style={{ color: primaryColor }}>Close</Button>
// // // // // // // //             </DialogActions>
// // // // // // // //           </Dialog>
// // // // // // // //         )}
// // // // // // // //       </CardContent>
// // // // // // // //     </Card>
// // // // // // // //   )
// // // // // // // // }

// // // // // // // // export default FanControlWidget

// // // // // // // // // import { useState, useEffect } from "react"
// // // // // // // // // import {
// // // // // // // // //   Card, CardContent, Typography, Button, Slider, Switch, Chip, Grid, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Badge, MenuItem, Select, InputLabel, FormControl
// // // // // // // // // } from "@mui/material"
// // // // // // // // // import {
// // // // // // // // //   PlayArrow, Stop, Settings, Warning, Error, CheckCircle, Thermostat, ElectricBolt, Schedule, Build, Add, Delete, Tune,
// // // // // // // // //   Percent, RotateRight, Opacity,  ArrowUpward, ArrowDownward 
// // // // // // // // // } from "@mui/icons-material"
// // // // // // // // // import { useTheme } from "../../theme/ThemeProvider"
// // // // // // // // // import "../../../styles/fan-control-widget.css"

// // // // // // // // // const DEFAULT_SPEED_UNITS = [
// // // // // // // // //   { value: "%", label: "Percentage (%)", icon: <Percent fontSize="small" /> },
// // // // // // // // //   { value: "RPM", label: "Rotation (RPM)", icon: <RotateRight fontSize="small" /> },
// // // // // // // // // ]
// // // // // // // // // const DEFAULT_TEMP_UNITS = [
// // // // // // // // //   { value: "°C", label: "Celsius (°C)", icon: <Thermostat fontSize="small" /> },
// // // // // // // // //   { value: "°F", label: "Fahrenheit (°F)", icon: <Thermostat fontSize="small" /> },
// // // // // // // // //   { value: "K", label: "Kelvin (K)", icon: <Opacity fontSize="small" /> },
// // // // // // // // // ]

// // // // // // // // // function buildFanCommandPayload(fanId, command, value) {
// // // // // // // // //   return {
// // // // // // // // //     fanId,
// // // // // // // // //     command,
// // // // // // // // //     ...(value !== undefined ? { value } : {}),
// // // // // // // // //     ts: Date.now(),
// // // // // // // // //   }
// // // // // // // // // }

// // // // // // // // // // Like ValueCardWidget, but for each fan, based on fanId
// // // // // // // // // function getFanTelemetryHistory(data, fanId, key) {
// // // // // // // // //   if (!Array.isArray(data) || !key) return []
// // // // // // // // //   // filter all values for that fan
// // // // // // // // //   return data.filter(d => d.fanId === fanId && typeof d[key] === "number")
// // // // // // // // // }

// // // // // // // // // const FanControlWidget = ({
// // // // // // // // //   fans = [],                 // Array of fan configs, e.g. from config or fans prop
// // // // // // // // //   data = [],                 // Telemetry updates, [{fanId, speed, ...}, ...]
// // // // // // // // //   dataKeys = ["speed"],      // Used for speed/slider control and trend
// // // // // // // // //   onControlChange,
// // // // // // // // //   onConfigChange,
// // // // // // // // //   showAddFan = true,
// // // // // // // // //   showDeleteFan = true,
// // // // // // // // //   showEditFan = true,
// // // // // // // // //   showAutoMode = true,
// // // // // // // // //   showSpeedSet = false,
// // // // // // // // //   showStartStop = true,
// // // // // // // // //   showReset = true,
// // // // // // // // //   showAlarms = true,
// // // // // // // // //   showStats = true,
// // // // // // // // //   showFanConfigDialog = true,
// // // // // // // // //   showAddFanDialog = true,
// // // // // // // // //   showAllControl = true,
// // // // // // // // //   speedUnits = DEFAULT_SPEED_UNITS,
// // // // // // // // //   tempUnits = DEFAULT_TEMP_UNITS,
// // // // // // // // //   minSpeed = 0,
// // // // // // // // //   maxSpeedPercent = 100,
// // // // // // // // //   maxSpeedRpm = 1800,
// // // // // // // // //   title = "Fan Control System",
// // // // // // // // //   sendMqttCommand,
// // // // // // // // // }) => {
// // // // // // // // //   const { isDarkMode, primaryColor } = useTheme()

// // // // // // // // //   const speedKey = Array.isArray(dataKeys) && dataKeys.length ? dataKeys[0] : "speed"

// // // // // // // // //   const [fanList, setFanList] = useState(fans)
// // // // // // // // //   const [selectedFan, setSelectedFan] = useState(null)
// // // // // // // // //   const [addFanDialog, setAddFanDialog] = useState(false)
// // // // // // // // //   const [newFanName, setNewFanName] = useState("")

// // // // // // // // //   useEffect(() => {
// // // // // // // // //     setFanList(fans)
// // // // // // // // //   }, [fans])

// // // // // // // // //   // Add/Delete/Config
// // // // // // // // //   const addNewFan = () => {
// // // // // // // // //     if (!newFanName.trim()) return
// // // // // // // // //     const newFan = {
// // // // // // // // //       id: `fan${Date.now()}`, name: newFanName, status: "stopped", speed: 0, targetSpeed: 0, speedUnit: "%",
// // // // // // // // //       temperature: 25, tempUnit: "°C", power: 0, runtime: 0, maintenanceHours: 8760,
// // // // // // // // //       lastMaintenance: new Date().toISOString().split("T")[0], autoMode: false, alarms: [],
// // // // // // // // //     }
// // // // // // // // //     setFanList(prev => [...prev, newFan])
// // // // // // // // //     setNewFanName("")
// // // // // // // // //     setAddFanDialog(false)
// // // // // // // // //     if (onConfigChange) onConfigChange([...fanList, newFan])
// // // // // // // // //   }
// // // // // // // // //   const deleteFan = (fanId) => {
// // // // // // // // //     setFanList(prev => prev.filter(f => f.id !== fanId))
// // // // // // // // //     if (onConfigChange) onConfigChange(fanList.filter(f => f.id !== fanId))
// // // // // // // // //   }

// // // // // // // // //   // Start/Stop/Reset/AUTO MQTT control
// // // // // // // // //   const handleFanControl = (fanId, action) => {
// // // // // // // // //     if (onControlChange) onControlChange(fanId, "action", action)
// // // // // // // // //     if (typeof sendMqttCommand === "function") {
// // // // // // // // //       sendMqttCommand(buildFanCommandPayload(fanId, action))
// // // // // // // // //     }
// // // // // // // // //   }
// // // // // // // // //   const handleSpeedChange = (fanId, value) => {
// // // // // // // // //     if (onControlChange) onControlChange(fanId, "targetSpeed", value)
// // // // // // // // //     if (typeof sendMqttCommand === "function") {
// // // // // // // // //       sendMqttCommand(buildFanCommandPayload(fanId, "set_speed", value))
// // // // // // // // //     }
// // // // // // // // //   }
// // // // // // // // //   const handleAutoModeToggle = (fanId, current) => {
// // // // // // // // //     if (onControlChange) onControlChange(fanId, "autoMode", !current)
// // // // // // // // //     if (typeof sendMqttCommand === "function") {
// // // // // // // // //       sendMqttCommand(buildFanCommandPayload(fanId, "auto_mode", !current))
// // // // // // // // //     }
// // // // // // // // //   }
// // // // // // // // //   const handleAllFans = (action) => {
// // // // // // // // //     fanList.forEach(fan => handleFanControl(fan.id, action))
// // // // // // // // //   }

// // // // // // // // //   // Helper for getting the *latest* value for a key for a fan
// // // // // // // // //   function getLatestValue(fanId, key, fallback) {
// // // // // // // // //     if (!Array.isArray(data)) return fallback
// // // // // // // // //     // Find the last data point for that fan
// // // // // // // // //     for (let i = data.length - 1; i >= 0; i--) {
// // // // // // // // //       const d = data[i]
// // // // // // // // //       if (d.fanId === fanId && typeof d[key] === "number") {
// // // // // // // // //         return d[key]
// // // // // // // // //       }
// // // // // // // // //     }
// // // // // // // // //     return fallback
// // // // // // // // //   }
// // // // // // // // //   // For trend/analytics (optional, like ValueCardWidget)
// // // // // // // // //   function getPrevValue(fanId, key) {
// // // // // // // // //     let found = 0
// // // // // // // // //     for (let i = data.length - 1; i >= 0; i--) {
// // // // // // // // //       const d = data[i]
// // // // // // // // //       if (d.fanId === fanId && typeof d[key] === "number") {
// // // // // // // // //         found++
// // // // // // // // //         if (found === 2) return d[key]
// // // // // // // // //       }
// // // // // // // // //     }
// // // // // // // // //     return null
// // // // // // // // //   }

// // // // // // // // //   // UI helpers...
// // // // // // // // //   const themeColors = {
// // // // // // // // //     light: { bg: "#fff", bgElevated: "#fafbfc", cardBorder: "#e0e0e0", text: "#222", textSecondary: "#444", surface: "#f6f8fa", },
// // // // // // // // //     dark: { bg: "#141414", bgElevated: "#23272f", cardBorder: "#24272b", text: "#fff", textSecondary: "#bbb", surface: "#181c23", }
// // // // // // // // //   }
// // // // // // // // //   const colors = themeColors[isDarkMode ? "dark" : "light"]

// // // // // // // // //   const getStatusColor = (status) =>
// // // // // // // // //     status === "running" ? "#4caf50" : status === "failed" ? "#f44336" : colors.cardBorder
// // // // // // // // //   const getStatusIcon = (fan) =>
// // // // // // // // //     fan.status === "running" ? <CheckCircle style={{ color: "#4caf50" }} />
// // // // // // // // //       : fan.status === "failed" ? <Error style={{ color: "#f44336" }} />
// // // // // // // // //         : <Stop style={{ color: colors.textSecondary }} />

// // // // // // // // //   const runningFans = fanList.filter(fan => fan.status === "running").length
// // // // // // // // //   const totalAlarms = fanList.reduce((sum, fan) => sum + (fan.alarms?.length || 0), 0)

// // // // // // // // //   return (
// // // // // // // // //     <Card className={`fan-control-widget ${isDarkMode ? "fan-widget-dark" : ""}`}
// // // // // // // // //       style={{ background: colors.bg, color: colors.text, }}
// // // // // // // // //     >
// // // // // // // // //       <CardContent style={{ background: colors.bg }}>
// // // // // // // // //         <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
// // // // // // // // //           <Typography variant="h6" style={{ color: primaryColor, fontWeight: 700, letterSpacing: 0.2 }}>{title}</Typography>
// // // // // // // // //           <Box display="flex" gap={1}>
// // // // // // // // //             {showStats && (
// // // // // // // // //               <Chip label={`${runningFans}/${fanList.length} Running`} color={runningFans > 0 ? "success" : "default"} size="small" />
// // // // // // // // //             )}
// // // // // // // // //             {showAlarms && totalAlarms > 0 && (
// // // // // // // // //               <Badge badgeContent={totalAlarms} color="error">
// // // // // // // // //                 <Warning color="warning" />
// // // // // // // // //               </Badge>
// // // // // // // // //             )}
// // // // // // // // //             {showAddFan && (
// // // // // // // // //               <IconButton size="small" onClick={() => setAddFanDialog(true)} style={{ color: primaryColor }}>
// // // // // // // // //                 <Add />
// // // // // // // // //               </IconButton>
// // // // // // // // //             )}
// // // // // // // // //           </Box>
// // // // // // // // //         </Box>

// // // // // // // // //         {showAllControl && (
// // // // // // // // //           <Box mb={2} display="flex" gap={2}>
// // // // // // // // //             <Button variant="contained" color="success" startIcon={<PlayArrow />} size="small"
// // // // // // // // //               onClick={() => handleAllFans("start")}>Start All</Button>
// // // // // // // // //             <Button variant="contained" color="error" startIcon={<Stop />} size="small"
// // // // // // // // //               onClick={() => handleAllFans("stop")}>Stop All</Button>
// // // // // // // // //           </Box>
// // // // // // // // //         )}

// // // // // // // // //         <Grid container spacing={1}>
// // // // // // // // //           {fanList.map((fan) => {
// // // // // // // // //             // Live values from telemetry, fallback to config/defaults
// // // // // // // // //             const speed = getLatestValue(fan.id, speedKey, fan.targetSpeed ?? 0)
// // // // // // // // //             const prevSpeed = getPrevValue(fan.id, speedKey)
// // // // // // // // //             const trend = (prevSpeed !== null && prevSpeed !== 0) ? ((speed - prevSpeed) / Math.abs(prevSpeed)) * 100 : 0

// // // // // // // // //             return (
// // // // // // // // //               <Grid item xs={12} md={6} key={fan.id}>
// // // // // // // // //                 <Card
// // // // // // // // //                   variant="outlined"
// // // // // // // // //                   className={`fan-card ${fan.status} ${isDarkMode ? "fan-card-dark" : ""}`}
// // // // // // // // //                   style={{
// // // // // // // // //                     borderColor: getStatusColor(fan.status),
// // // // // // // // //                     background: colors.bgElevated,
// // // // // // // // //                     color: colors.text,
// // // // // // // // //                   }}
// // // // // // // // //                 >
// // // // // // // // //                   <CardContent>
// // // // // // // // //                     <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
// // // // // // // // //                       <Typography variant="subtitle1" fontWeight="bold" style={{ color: colors.text }}>
// // // // // // // // //                         {fan.name}
// // // // // // // // //                       </Typography>
// // // // // // // // //                       <Box display="flex" alignItems="center" gap={1}>
// // // // // // // // //                         {getStatusIcon(fan)}
// // // // // // // // //                         {showEditFan && (
// // // // // // // // //                           <IconButton size="small" onClick={() => setSelectedFan(fan)} style={{ color: primaryColor }}>
// // // // // // // // //                             <Settings />
// // // // // // // // //                           </IconButton>
// // // // // // // // //                         )}
// // // // // // // // //                         {showDeleteFan && (
// // // // // // // // //                           <IconButton size="small" onClick={() => deleteFan(fan.id)} color="error">
// // // // // // // // //                             <Delete />
// // // // // // // // //                           </IconButton>
// // // // // // // // //                         )}
// // // // // // // // //                       </Box>
// // // // // // // // //                     </Box>
// // // // // // // // //                     <Box display="flex" justifyContent="center" mb={2}>
// // // // // // // // //                       <div className={`fan-blade ${fan.status === "running" ? "spinning" : ""} ${isDarkMode ? "blade-dark" : ""}`}
// // // // // // // // //                         style={{ animationDuration: speed > 0 ? `${2 - speed / 50}s` : "0s" }}>
// // // // // // // // //                         <div className="fan-center"></div>
// // // // // // // // //                         <div className="blade" style={{ transform: "rotate(0deg)" }}></div>
// // // // // // // // //                         <div className="blade" style={{ transform: "rotate(90deg)" }}></div>
// // // // // // // // //                         <div className="blade" style={{ transform: "rotate(180deg)" }}></div>
// // // // // // // // //                         <div className="blade" style={{ transform: "rotate(270deg)" }}></div>
// // // // // // // // //                       </div>
// // // // // // // // //                     </Box>
// // // // // // // // //                     {(showStartStop || showAutoMode || showReset) && (
// // // // // // // // //                       <Box mb={2}>
// // // // // // // // //                         {showStartStop && (
// // // // // // // // //                           <Box display="flex" gap={1} mb={1}>
// // // // // // // // //                             <Button size="small" startIcon={<PlayArrow />} onClick={() => handleFanControl(fan.id, "start")} disabled={fan.status === "failed"} variant="outlined" color="success">Start</Button>
// // // // // // // // //                             <Button size="small" startIcon={<Stop />} onClick={() => handleFanControl(fan.id, "stop")} variant="outlined" color="error">Stop</Button>
// // // // // // // // //                             {showReset && fan.status === "failed" && (
// // // // // // // // //                               <Button size="small" onClick={() => handleFanControl(fan.id, "reset")} variant="outlined">Reset</Button>
// // // // // // // // //                             )}
// // // // // // // // //                           </Box>
// // // // // // // // //                         )}
// // // // // // // // //                         {showAutoMode && (
// // // // // // // // //                           <Box display="flex" alignItems="center" gap={1} mb={1}>
// // // // // // // // //                             <Typography variant="caption" style={{ color: colors.textSecondary }}>Auto Mode:</Typography>
// // // // // // // // //                             <Switch size="small" checked={fan.autoMode} onChange={() => handleAutoModeToggle(fan.id, fan.autoMode)} />
// // // // // // // // //                           </Box>
// // // // // // // // //                         )}
// // // // // // // // //                       </Box>
// // // // // // // // //                     )}
// // // // // // // // //                     {showSpeedSet && (
// // // // // // // // //                       <Box mb={2}>
// // // // // // // // //                         <Typography variant="caption" gutterBottom style={{ color: colors.textSecondary }}>
// // // // // // // // //                           Speed: {speed} {fan.speedUnit}
// // // // // // // // //                           {trend !== 0 && (
// // // // // // // // //                             <span style={{ marginLeft: 8, color: trend > 0 ? "#3f8600" : "#cf1322", fontWeight: 500 }}>
// // // // // // // // //                               {trend > 0 ? <ArrowUpward /> : <ArrowDownward />}
// // // // // // // // //                               {" "}
// // // // // // // // //                               {Math.abs(trend).toFixed(1)}%
// // // // // // // // //                             </span>
// // // // // // // // //                           )}
// // // // // // // // //                         </Typography>
// // // // // // // // //                         <Slider
// // // // // // // // //                           value={speed}
// // // // // // // // //                           onChange={(e, value) => handleSpeedChange(fan.id, value)}
// // // // // // // // //                           disabled={fan.status === "failed"}
// // // // // // // // //                           min={minSpeed}
// // // // // // // // //                           max={fan.speedUnit === "RPM" ? maxSpeedRpm : maxSpeedPercent}
// // // // // // // // //                           size="small"
// // // // // // // // //                           sx={{
// // // // // // // // //                             color: primaryColor,
// // // // // // // // //                             '& .MuiSlider-rail': { backgroundColor: isDarkMode ? "#222" : "#eee" },
// // // // // // // // //                           }}
// // // // // // // // //                         />
// // // // // // // // //                       </Box>
// // // // // // // // //                     )}
// // // // // // // // //                     <Grid container spacing={1}>
// // // // // // // // //                       <Grid item xs={6}>
// // // // // // // // //                         <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // // // //                           <Thermostat fontSize="small" />
// // // // // // // // //                           <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // // // // // // //                             {getLatestValue(fan.id, "temperature", fan.temperature)}{fan.tempUnit}
// // // // // // // // //                           </Typography>
// // // // // // // // //                         </Box>
// // // // // // // // //                       </Grid>
// // // // // // // // //                       <Grid item xs={6}>
// // // // // // // // //                         <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // // // //                           <ElectricBolt fontSize="small" />
// // // // // // // // //                           <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // // // // // // //                             {getLatestValue(fan.id, "power", fan.power)}W
// // // // // // // // //                           </Typography>
// // // // // // // // //                         </Box>
// // // // // // // // //                       </Grid>
// // // // // // // // //                       <Grid item xs={6}>
// // // // // // // // //                         <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // // // //                           <Schedule fontSize="small" />
// // // // // // // // //                           <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // // // // // // //                             {getLatestValue(fan.id, "runtime", fan.runtime)?.toFixed(1)}h
// // // // // // // // //                           </Typography>
// // // // // // // // //                         </Box>
// // // // // // // // //                       </Grid>
// // // // // // // // //                       <Grid item xs={6}>
// // // // // // // // //                         <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // // // //                           <Build fontSize="small" />
// // // // // // // // //                           <Typography variant="caption" style={{ color: colors.textSecondary }}>
// // // // // // // // //                             {Math.max(0, (fan.maintenanceHours ?? 0) - (getLatestValue(fan.id, "runtime", fan.runtime) ?? 0)).toFixed(0)}h
// // // // // // // // //                           </Typography>
// // // // // // // // //                         </Box>
// // // // // // // // //                       </Grid>
// // // // // // // // //                     </Grid>
// // // // // // // // //                     {showAlarms && fan.alarms && fan.alarms.length > 0 && (
// // // // // // // // //                       <Box mt={1}>{fan.alarms.map((alarm, i) =>
// // // // // // // // //                         <Alert key={i} severity={alarm.type} size="small" style={{ marginBottom: 4 }}>{alarm.message}</Alert>
// // // // // // // // //                       )}</Box>
// // // // // // // // //                     )}
// // // // // // // // //                   </CardContent>
// // // // // // // // //                 </Card>
// // // // // // // // //               </Grid>
// // // // // // // // //             )
// // // // // // // // //           })}
// // // // // // // // //         </Grid>

// // // // // // // // //         {/* Add Fan Dialog */}
// // // // // // // // //         {showAddFanDialog && (
// // // // // // // // //           <Dialog open={addFanDialog} onClose={() => setAddFanDialog(false)}>
// // // // // // // // //             <DialogTitle style={{ background: colors.surface, color: colors.text }}>Add New Fan</DialogTitle>
// // // // // // // // //             <DialogContent style={{ background: colors.bg, color: colors.text }}>
// // // // // // // // //               <TextField autoFocus margin="dense" label="Fan Name" fullWidth variant="outlined" value={newFanName} onChange={e => setNewFanName(e.target.value)} />
// // // // // // // // //             </DialogContent>
// // // // // // // // //             <DialogActions style={{ background: colors.surface }}>
// // // // // // // // //               <Button onClick={() => setAddFanDialog(false)}>Cancel</Button>
// // // // // // // // //               <Button onClick={addNewFan} variant="contained" style={{ background: primaryColor, color: "#fff" }}>Add Fan</Button>
// // // // // // // // //             </DialogActions>
// // // // // // // // //           </Dialog>
// // // // // // // // //         )}

// // // // // // // // //         {/* Fan Config Dialog */}
// // // // // // // // //         {showFanConfigDialog && selectedFan && (
// // // // // // // // //           <Dialog open={!!selectedFan} onClose={() => setSelectedFan(null)} maxWidth="sm" fullWidth>
// // // // // // // // //             <DialogTitle style={{ background: colors.surface, color: colors.text }}>
// // // // // // // // //               <Box display="flex" alignItems="center" gap={1}><Tune fontSize="small" />Configure {selectedFan.name}</Box>
// // // // // // // // //             </DialogTitle>
// // // // // // // // //             <DialogContent style={{ background: colors.bg, color: colors.text }}>
// // // // // // // // //               <Grid container spacing={2}>
// // // // // // // // //                 <Grid item xs={12}><TextField label="Fan Name" fullWidth value={selectedFan.name} onChange={e => setSelectedFan({ ...selectedFan, name: e.target.value })} /></Grid>
// // // // // // // // //                 <Grid item xs={6}><TextField label="Maintenance Hours" type="number" fullWidth value={selectedFan.maintenanceHours} onChange={e => setSelectedFan({ ...selectedFan, maintenanceHours: Number.parseInt(e.target.value) })} /></Grid>
// // // // // // // // //                 <Grid item xs={6}><TextField label="Last Maintenance" type="date" fullWidth value={selectedFan.lastMaintenance} onChange={e => setSelectedFan({ ...selectedFan, lastMaintenance: e.target.value })} /></Grid>
// // // // // // // // //                 <Grid item xs={6}>
// // // // // // // // //                   <FormControl fullWidth>
// // // // // // // // //                     <InputLabel>Speed Unit</InputLabel>
// // // // // // // // //                     <Select value={selectedFan.speedUnit} label="Speed Unit" onChange={e => setSelectedFan({ ...selectedFan, speedUnit: e.target.value })}>
// // // // // // // // //                       {speedUnits.map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
// // // // // // // // //                     </Select>
// // // // // // // // //                   </FormControl>
// // // // // // // // //                 </Grid>
// // // // // // // // //                 <Grid item xs={6}>
// // // // // // // // //                   <FormControl fullWidth>
// // // // // // // // //                     <InputLabel>Temperature Unit</InputLabel>
// // // // // // // // //                     <Select value={selectedFan.tempUnit} label="Temperature Unit" onChange={e => setSelectedFan({ ...selectedFan, tempUnit: e.target.value })}>
// // // // // // // // //                       {tempUnits.map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
// // // // // // // // //                     </Select>
// // // // // // // // //                   </FormControl>
// // // // // // // // //                 </Grid>
// // // // // // // // //               </Grid>
// // // // // // // // //             </DialogContent>
// // // // // // // // //             <DialogActions style={{ background: colors.surface }}>
// // // // // // // // //               <Button onClick={() => setSelectedFan(null)} style={{ color: primaryColor }}>Close</Button>
// // // // // // // // //             </DialogActions>
// // // // // // // // //           </Dialog>
// // // // // // // // //         )}
// // // // // // // // //       </CardContent>
// // // // // // // // //     </Card>
// // // // // // // // //   )
// // // // // // // // // }

// // // // // // // // // export default FanControlWidget



// // // // // // // // // // <FanControlWidget
// // // // // // // // // //   fans={[
// // // // // // // // // //     { id: "fan1", name: "Fan 1", speedUnit: "%", tempUnit: "°C", maintenanceHours: 8760, runtime: 1200, ... },
// // // // // // // // // //     { id: "fan2", name: "Fan 2", speedUnit: "RPM", tempUnit: "°C", maintenanceHours: 8760, runtime: 890, ... },
// // // // // // // // // //   ]}
// // // // // // // // // //   data={[
// // // // // // // // // //     { fanId: "fan1", speed: 80, temperature: 46.5, status: "stop", power: 135, runtime: 1260 },
// // // // // // // // // //     { fanId: "fan2", speed: 0, temperature: 32.2, status: "stop", power: 0, runtime: 890 },
// // // // // // // // // //   ]}
// // // // // // // // // //   dataKeys={["speed"]} // or ["rpm"], etc.
// // // // // // // // // //   sendMqttCommand={fanSendCommand}
// // // // // // // // // // />


// // // // // // // // // // "use client"

// // // // // // // // // // import { useState, useEffect } from "react"
// // // // // // // // // // import {
// // // // // // // // // //     Card, CardContent, Typography, Button, Slider, Switch, Chip, Grid, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Badge, MenuItem, Select, InputLabel, FormControl
// // // // // // // // // // } from "@mui/material"
// // // // // // // // // // import {
// // // // // // // // // //     PlayArrow, Stop, Settings, Warning, Error, CheckCircle, Thermostat, ElectricBolt, Schedule, Build, Add, Delete, Tune,
// // // // // // // // // //     Percent, RotateRight, Opacity
// // // // // // // // // // } from "@mui/icons-material"
// // // // // // // // // // import { useTheme } from "../../theme/ThemeProvider"
// // // // // // // // // // import "../../../styles/fan-control-widget.css"

// // // // // // // // // // const DEFAULT_SPEED_UNITS = [
// // // // // // // // // //     { value: "%", label: "Percentage (%)", icon: <Percent fontSize="small" /> },
// // // // // // // // // //     { value: "RPM", label: "Rotation (RPM)", icon: <RotateRight fontSize="small" /> },
// // // // // // // // // // ]
// // // // // // // // // // const DEFAULT_TEMP_UNITS = [
// // // // // // // // // //     { value: "°C", label: "Celsius (°C)", icon: <Thermostat fontSize="small" /> },
// // // // // // // // // //     { value: "°F", label: "Fahrenheit (°F)", icon: <Thermostat fontSize="small" /> },
// // // // // // // // // //     { value: "K", label: "Kelvin (K)", icon: <Opacity fontSize="small" /> },
// // // // // // // // // // ]

// // // // // // // // // // const DEFAULT_FANS = [
// // // // // // // // // //     {
// // // // // // // // // //         id: "fan1", name: "Cooling Fan 1", status: "running", speed: 75, targetSpeed: 75, speedUnit: "%",
// // // // // // // // // //         temperature: 45, tempUnit: "°C", power: 120, runtime: 1250, maintenanceHours: 8760,
// // // // // // // // // //         lastMaintenance: "2024-01-15", autoMode: true, alarms: [],
// // // // // // // // // //     },
// // // // // // // // // //     {
// // // // // // // // // //         id: "fan2", name: "Exhaust Fan 2", status: "stopped", speed: 0, targetSpeed: 0, speedUnit: "%",
// // // // // // // // // //         temperature: 32, tempUnit: "°C", power: 0, runtime: 890, maintenanceHours: 8760,
// // // // // // // // // //         lastMaintenance: "2024-02-01", autoMode: false, alarms: [],
// // // // // // // // // //     },
// // // // // // // // // // ]

// // // // // // // // // // const FanControlWidget = ({
// // // // // // // // // //     config = {},
// // // // // // // // // //     data = [],
// // // // // // // // // //     onControlChange,
// // // // // // // // // //     onConfigChange,
// // // // // // // // // //     showAddFan = true,
// // // // // // // // // //     showDeleteFan = true,
// // // // // // // // // //     showEditFan = true,
// // // // // // // // // //     showAutoMode = true,
// // // // // // // // // //     showSpeedSet = false,
// // // // // // // // // //     showStartStop = true,
// // // // // // // // // //     showReset = true,
// // // // // // // // // //     showAlarms = true,
// // // // // // // // // //     showStats = true,
// // // // // // // // // //     showFanConfigDialog = true,
// // // // // // // // // //     showAddFanDialog = true,
// // // // // // // // // //     speedUnits = DEFAULT_SPEED_UNITS,
// // // // // // // // // //     tempUnits = DEFAULT_TEMP_UNITS,
// // // // // // // // // //     minSpeed = 0,
// // // // // // // // // //     maxSpeedPercent = 100,
// // // // // // // // // //     maxSpeedRpm = 1800,
// // // // // // // // // //     title = "Fan Control System",
// // // // // // // // // // }) => {
// // // // // // // // // //     const { isDarkMode, primaryColor } = useTheme()

// // // // // // // // // //     const themeColors = {
// // // // // // // // // //         light: {
// // // // // // // // // //             bg: "#fff",
// // // // // // // // // //             bgElevated: "#fafbfc",
// // // // // // // // // //             cardBorder: "#e0e0e0",
// // // // // // // // // //             text: "#222",
// // // // // // // // // //             textSecondary: "#444",
// // // // // // // // // //             surface: "#f6f8fa",
// // // // // // // // // //         },
// // // // // // // // // //         dark: {
// // // // // // // // // //             bg: "#141414",
// // // // // // // // // //             bgElevated: "#23272f",
// // // // // // // // // //             cardBorder: "#24272b",
// // // // // // // // // //             text: "#fff",
// // // // // // // // // //             textSecondary: "#bbb",
// // // // // // // // // //             surface: "#181c23",
// // // // // // // // // //         }
// // // // // // // // // //     }
// // // // // // // // // //     const colors = themeColors[isDarkMode ? "dark" : "light"]

// // // // // // // // // //     const [fans, setFans] = useState(config.fans || DEFAULT_FANS)
// // // // // // // // // //     const [selectedFan, setSelectedFan] = useState(null)
// // // // // // // // // //     const [addFanDialog, setAddFanDialog] = useState(false)
// // // // // // // // // //     const [newFanName, setNewFanName] = useState("")

// // // // // // // // // //     useEffect(() => {
// // // // // // // // // //         if (!data || !data.length) return
// // // // // // // // // //         setFans(prevFans =>
// // // // // // // // // //             prevFans.map(fan => {
// // // // // // // // // //                 const live = data.find(d => d.fanId === fan.id)
// // // // // // // // // //                 return live ? { ...fan, ...live, alarms: fan.alarms } : fan
// // // // // // // // // //             })
// // // // // // // // // //         )
// // // // // // // // // //     }, [data])

// // // // // // // // // //     useEffect(() => {
// // // // // // // // // //         if (data && data.length) return
// // // // // // // // // //         const interval = setInterval(() => {
// // // // // // // // // //             setFans(prevFans =>
// // // // // // // // // //                 prevFans.map(fan => {
// // // // // // // // // //                     if (fan.status === "running") {
// // // // // // // // // //                         let tempChange = (Math.random() - 0.5) * 2
// // // // // // // // // //                         if (fan.tempUnit === "°F") tempChange *= 1.8
// // // // // // // // // //                         else if (fan.tempUnit === "K") tempChange *= 1
// // // // // // // // // //                         const newTemp = Math.max(25, Math.min(85, fan.temperature + tempChange))
// // // // // // // // // //                         return {
// // // // // // // // // //                             ...fan,
// // // // // // // // // //                             temperature: newTemp,
// // // // // // // // // //                             power: Math.round((fan.speed / 100) * 150 + (Math.random() - 0.5) * 10),
// // // // // // // // // //                             runtime: fan.runtime + 0.1,
// // // // // // // // // //                             alarms: newTemp > 80 ? [{ type: "error", message: "Critical temperature!" }]
// // // // // // // // // //                                 : newTemp > 70 ? [{ type: "warning", message: "High temperature detected" }]
// // // // // // // // // //                                     : [],
// // // // // // // // // //                         }
// // // // // // // // // //                     }
// // // // // // // // // //                     return fan
// // // // // // // // // //                 })
// // // // // // // // // //             )
// // // // // // // // // //         }, 1000)
// // // // // // // // // //         return () => clearInterval(interval)
// // // // // // // // // //     }, [data])

// // // // // // // // // //     const handleFanControl = (fanId, action) => {
// // // // // // // // // //         if (onControlChange) onControlChange(fanId, "action", action)
// // // // // // // // // //         setFans(prevFans =>
// // // // // // // // // //             prevFans.map(fan => {
// // // // // // // // // //                 if (fan.id === fanId) {
// // // // // // // // // //                     let updated = { ...fan }
// // // // // // // // // //                     if (action === "start") {
// // // // // // // // // //                         updated.status = "running"
// // // // // // // // // //                         updated.speed = updated.targetSpeed || 50
// // // // // // // // // //                     } else if (action === "stop") {
// // // // // // // // // //                         updated.status = "stopped"
// // // // // // // // // //                         updated.speed = 0
// // // // // // // // // //                         updated.power = 0
// // // // // // // // // //                     } else if (action === "reset") {
// // // // // // // // // //                         updated.status = "stopped"
// // // // // // // // // //                         updated.speed = 0
// // // // // // // // // //                         updated.power = 0
// // // // // // // // // //                         updated.alarms = []
// // // // // // // // // //                     }
// // // // // // // // // //                     return updated
// // // // // // // // // //                 }
// // // // // // // // // //                 return fan
// // // // // // // // // //             })
// // // // // // // // // //         )
// // // // // // // // // //     }

// // // // // // // // // //     const handleSpeedChange = (fanId, newSpeed) => {
// // // // // // // // // //         if (onControlChange) onControlChange(fanId, "targetSpeed", newSpeed)
// // // // // // // // // //         setFans(prevFans =>
// // // // // // // // // //             prevFans.map(fan =>
// // // // // // // // // //                 fan.id === fanId
// // // // // // // // // //                     ? { ...fan, targetSpeed: newSpeed, speed: fan.status === "running" ? newSpeed : 0 }
// // // // // // // // // //                     : fan
// // // // // // // // // //             )
// // // // // // // // // //         )
// // // // // // // // // //     }

// // // // // // // // // //     const handleAutoModeToggle = (fanId) => {
// // // // // // // // // //         setFans(prevFans =>
// // // // // // // // // //             prevFans.map(fan =>
// // // // // // // // // //                 fan.id === fanId ? { ...fan, autoMode: !fan.autoMode } : fan
// // // // // // // // // //             )
// // // // // // // // // //         )
// // // // // // // // // //         if (onControlChange) onControlChange(fanId, "autoMode", !fans.find(f => f.id === fanId).autoMode)
// // // // // // // // // //     }

// // // // // // // // // //     const addNewFan = () => {
// // // // // // // // // //         if (!newFanName.trim()) return
// // // // // // // // // //         const newFan = {
// // // // // // // // // //             id: `fan${Date.now()}`, name: newFanName, status: "stopped", speed: 0, targetSpeed: 50, speedUnit: "%",
// // // // // // // // // //             temperature: 25, tempUnit: "°C", power: 0, runtime: 0, maintenanceHours: 8760,
// // // // // // // // // //             lastMaintenance: new Date().toISOString().split("T")[0], autoMode: false, alarms: [],
// // // // // // // // // //         }
// // // // // // // // // //         setFans(prev => [...prev, newFan])
// // // // // // // // // //         setNewFanName("")
// // // // // // // // // //         setAddFanDialog(false)
// // // // // // // // // //         if (onConfigChange) onConfigChange({ fans: [...fans, newFan] })
// // // // // // // // // //     }
// // // // // // // // // //     const deleteFan = (fanId) => {
// // // // // // // // // //         setFans(prev => prev.filter(f => f.id !== fanId))
// // // // // // // // // //         if (onConfigChange) onConfigChange({ fans: fans.filter(f => f.id !== fanId) })
// // // // // // // // // //     }

// // // // // // // // // //     const getStatusColor = (status) =>
// // // // // // // // // //         status === "running" ? "#4caf50" : status === "failed" ? "#f44336" : colors.cardBorder
// // // // // // // // // //     const getStatusIcon = (fan) =>
// // // // // // // // // //         fan.status === "running" ? <CheckCircle style={{ color: "#4caf50" }} />
// // // // // // // // // //             : fan.status === "failed" ? <Error style={{ color: "#f44336" }} />
// // // // // // // // // //                 : <Stop style={{ color: colors.textSecondary }} />

// // // // // // // // // //     const runningFans = fans.filter(fan => fan.status === "running").length
// // // // // // // // // //     const totalAlarms = fans.reduce((sum, fan) => sum + fan.alarms.length, 0)
// // // // // // // // // //     const convertSpeed = (value, unit) => unit === "RPM" ? Math.round(value * 18) : value
// // // // // // // // // //     const displaySpeed = (fan) => fan.speedUnit === "RPM" ? `${convertSpeed(fan.speed, fan.speedUnit)} RPM` : `${fan.speed} %`
// // // // // // // // // //     const convertTemp = (value, unit) => unit === "°F" ? (value * 9 / 5) + 32 : unit === "K" ? value + 273.15 : value
// // // // // // // // // //     const displayTemp = (fan) => `${convertTemp(fan.temperature, fan.tempUnit).toFixed(1)}${fan.tempUnit}`

// // // // // // // // // //     return (
// // // // // // // // // //         <Card
// // // // // // // // // //             className={`fan-control-widget ${isDarkMode ? "fan-widget-dark" : ""}`}
// // // // // // // // // //             style={{
// // // // // // // // // //                 background: colors.bg,
// // // // // // // // // //                 color: colors.text,
// // // // // // // // // //                 // borderRadius: 0,
// // // // // // // // // //                 // border: `1.5px solid ${colors.cardBorder}`,
// // // // // // // // // //                 // boxShadow: isDarkMode ? "0 2px 14px 0 rgba(10, 12, 15, 0.25)" : "0 2px 8px 0 rgba(50,50,93,0.07)",
// // // // // // // // // //                 // minHeight: 450,
// // // // // // // // // //                 // marginBottom: 18,
// // // // // // // // // //             }}
// // // // // // // // // //         >
// // // // // // // // // //             <CardContent style={{ background: colors.bg }}>
// // // // // // // // // //                 <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
// // // // // // // // // //                     <Typography variant="h6" style={{ color: primaryColor, fontWeight: 700, letterSpacing: 0.2 }}>{title}</Typography>
// // // // // // // // // //                     <Box display="flex" gap={1}>
// // // // // // // // // //                         {showStats && (
// // // // // // // // // //                             <Chip label={`${runningFans}/${fans.length} Running`} color={runningFans > 0 ? "success" : "default"} size="small" />
// // // // // // // // // //                         )}
// // // // // // // // // //                         {showAlarms && totalAlarms > 0 && (
// // // // // // // // // //                             <Badge badgeContent={totalAlarms} color="error">
// // // // // // // // // //                                 <Warning color="warning" />
// // // // // // // // // //                             </Badge>
// // // // // // // // // //                         )}
// // // // // // // // // //                         {showAddFan && (
// // // // // // // // // //                             <IconButton size="small" onClick={() => setAddFanDialog(true)} style={{ color: primaryColor }}>
// // // // // // // // // //                                 <Add />
// // // // // // // // // //                             </IconButton>
// // // // // // // // // //                         )}
// // // // // // // // // //                     </Box>
// // // // // // // // // //                 </Box>

// // // // // // // // // //                 <Grid container spacing={1}>
// // // // // // // // // //                     {fans.map((fan) => (
// // // // // // // // // //                         <Grid item xs={12} md={6} key={fan.id}>
// // // // // // // // // //                             <Card
// // // // // // // // // //                                 variant="outlined"
// // // // // // // // // //                                 className={`fan-card ${fan.status} ${isDarkMode ? "fan-card-dark" : ""}`}
// // // // // // // // // //                                 style={{
// // // // // // // // // //                                     borderColor: getStatusColor(fan.status),
// // // // // // // // // //                                     background: colors.bgElevated,
// // // // // // // // // //                                     color: colors.text,
// // // // // // // // // //                                     // borderRadius: 2,
// // // // // // // // // //                                 }}
// // // // // // // // // //                             >
// // // // // // // // // //                                 <CardContent>
// // // // // // // // // //                                     <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
// // // // // // // // // //                                         <Typography variant="subtitle1" fontWeight="bold" style={{ color: colors.text }}>
// // // // // // // // // //                                             {fan.name}
// // // // // // // // // //                                         </Typography>
// // // // // // // // // //                                         <Box display="flex" alignItems="center" gap={1}>
// // // // // // // // // //                                             {getStatusIcon(fan)}
// // // // // // // // // //                                             {showEditFan && (
// // // // // // // // // //                                                 <IconButton size="small" onClick={() => setSelectedFan(fan)} style={{ color: primaryColor }}>
// // // // // // // // // //                                                     <Settings />
// // // // // // // // // //                                                 </IconButton>
// // // // // // // // // //                                             )}
// // // // // // // // // //                                             {showDeleteFan && (
// // // // // // // // // //                                                 <IconButton size="small" onClick={() => deleteFan(fan.id)} color="error">
// // // // // // // // // //                                                     <Delete />
// // // // // // // // // //                                                 </IconButton>
// // // // // // // // // //                                             )}
// // // // // // // // // //                                         </Box>
// // // // // // // // // //                                     </Box>
// // // // // // // // // //                                     <Box display="flex" justifyContent="center" mb={2}>
// // // // // // // // // //                                         <div className={`fan-blade ${fan.status === "running" ? "spinning" : ""} ${isDarkMode ? "blade-dark" : ""}`}
// // // // // // // // // //                                             style={{ animationDuration: fan.speed > 0 ? `${2 - fan.speed / 50}s` : "0s" }}>
// // // // // // // // // //                                             <div className="fan-center"></div>
// // // // // // // // // //                                             <div className="blade" style={{ transform: "rotate(0deg)" }}></div>
// // // // // // // // // //                                             <div className="blade" style={{ transform: "rotate(90deg)" }}></div>
// // // // // // // // // //                                             <div className="blade" style={{ transform: "rotate(180deg)" }}></div>
// // // // // // // // // //                                             <div className="blade" style={{ transform: "rotate(270deg)" }}></div>
// // // // // // // // // //                                         </div>
// // // // // // // // // //                                     </Box>
// // // // // // // // // //                                     {(showStartStop || showAutoMode || showReset) && (
// // // // // // // // // //                                         <Box mb={2}>
// // // // // // // // // //                                             {showStartStop && (
// // // // // // // // // //                                                 <Box display="flex" gap={1} mb={1}>
// // // // // // // // // //                                                     <Button size="small" startIcon={<PlayArrow />} onClick={() => handleFanControl(fan.id, "start")} disabled={fan.status === "failed"} variant="outlined" color="success">Start</Button>
// // // // // // // // // //                                                     <Button size="small" startIcon={<Stop />} onClick={() => handleFanControl(fan.id, "stop")} variant="outlined" color="error">Stop</Button>
// // // // // // // // // //                                                     {showReset && fan.status === "failed" && (
// // // // // // // // // //                                                         <Button size="small" onClick={() => handleFanControl(fan.id, "reset")} variant="outlined">Reset</Button>
// // // // // // // // // //                                                     )}
// // // // // // // // // //                                                 </Box>
// // // // // // // // // //                                             )}
// // // // // // // // // //                                             {showAutoMode && (
// // // // // // // // // //                                                 <Box display="flex" alignItems="center" gap={1} mb={1}>
// // // // // // // // // //                                                     <Typography variant="caption" style={{ color: colors.textSecondary }}>Auto Mode:</Typography>
// // // // // // // // // //                                                     <Switch size="small" checked={fan.autoMode} onChange={() => handleAutoModeToggle(fan.id)} />
// // // // // // // // // //                                                 </Box>
// // // // // // // // // //                                             )}
// // // // // // // // // //                                         </Box>
// // // // // // // // // //                                     )}
// // // // // // // // // //                                     {showSpeedSet && (
// // // // // // // // // //                                         <Box mb={2}>
// // // // // // // // // //                                             <Typography variant="caption" gutterBottom style={{ color: colors.textSecondary }}>Speed: {displaySpeed(fan)}</Typography>
// // // // // // // // // //                                             <Slider
// // // // // // // // // //                                                 value={fan.targetSpeed}
// // // // // // // // // //                                                 onChange={(e, value) => handleSpeedChange(fan.id, value)}
// // // // // // // // // //                                                 disabled={fan.status === "failed"}
// // // // // // // // // //                                                 min={minSpeed}
// // // // // // // // // //                                                 max={fan.speedUnit === "RPM" ? maxSpeedRpm : maxSpeedPercent}
// // // // // // // // // //                                                 size="small"
// // // // // // // // // //                                                 sx={{
// // // // // // // // // //                                                     color: primaryColor,
// // // // // // // // // //                                                     '& .MuiSlider-rail': { backgroundColor: isDarkMode ? "#222" : "#eee" },
// // // // // // // // // //                                                 }}
// // // // // // // // // //                                             />
// // // // // // // // // //                                         </Box>
// // // // // // // // // //                                     )}
// // // // // // // // // //                                     <Grid container spacing={1}>
// // // // // // // // // //                                         <Grid item xs={6}>
// // // // // // // // // //                                             <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // // // // //                                                 <Thermostat fontSize="small" />
// // // // // // // // // //                                                 <Typography variant="caption" style={{ color: colors.textSecondary }}>{displayTemp(fan)}</Typography>
// // // // // // // // // //                                             </Box>
// // // // // // // // // //                                         </Grid>
// // // // // // // // // //                                         <Grid item xs={6}>
// // // // // // // // // //                                             <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // // // // //                                                 <ElectricBolt fontSize="small" />
// // // // // // // // // //                                                 <Typography variant="caption" style={{ color: colors.textSecondary }}>{fan.power}W</Typography>
// // // // // // // // // //                                             </Box>
// // // // // // // // // //                                         </Grid>
// // // // // // // // // //                                         <Grid item xs={6}>
// // // // // // // // // //                                             <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // // // // //                                                 <Schedule fontSize="small" />
// // // // // // // // // //                                                 <Typography variant="caption" style={{ color: colors.textSecondary }}>{fan.runtime.toFixed(1)}h</Typography>
// // // // // // // // // //                                             </Box>
// // // // // // // // // //                                         </Grid>
// // // // // // // // // //                                         <Grid item xs={6}>
// // // // // // // // // //                                             <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // // // // //                                                 <Build fontSize="small" />
// // // // // // // // // //                                                 <Typography variant="caption" style={{ color: colors.textSecondary }}>{Math.max(0, fan.maintenanceHours - fan.runtime).toFixed(0)}h</Typography>
// // // // // // // // // //                                             </Box>
// // // // // // // // // //                                         </Grid>
// // // // // // // // // //                                     </Grid>
// // // // // // // // // //                                     {showAlarms && fan.alarms.length > 0 && (
// // // // // // // // // //                                         <Box mt={1}>{fan.alarms.map((alarm, i) =>
// // // // // // // // // //                                             <Alert key={i} severity={alarm.type} size="small" style={{ marginBottom: 4 }}>{alarm.message}</Alert>
// // // // // // // // // //                                         )}</Box>
// // // // // // // // // //                                     )}
// // // // // // // // // //                                 </CardContent>
// // // // // // // // // //                             </Card>
// // // // // // // // // //                         </Grid>
// // // // // // // // // //                     ))}
// // // // // // // // // //                 </Grid>

// // // // // // // // // //                 {/* Add Fan Dialog */}
// // // // // // // // // //                 {showAddFanDialog && (
// // // // // // // // // //                     <Dialog open={addFanDialog} onClose={() => setAddFanDialog(false)}>
// // // // // // // // // //                         <DialogTitle style={{ background: colors.surface, color: colors.text }}>Add New Fan</DialogTitle>
// // // // // // // // // //                         <DialogContent style={{ background: colors.bg, color: colors.text }}>
// // // // // // // // // //                             <TextField autoFocus margin="dense" label="Fan Name" fullWidth variant="outlined" value={newFanName} onChange={e => setNewFanName(e.target.value)} />
// // // // // // // // // //                         </DialogContent>
// // // // // // // // // //                         <DialogActions style={{ background: colors.surface }}>
// // // // // // // // // //                             <Button onClick={() => setAddFanDialog(false)}>Cancel</Button>
// // // // // // // // // //                             <Button onClick={addNewFan} variant="contained" style={{ background: primaryColor, color: "#fff" }}>Add Fan</Button>
// // // // // // // // // //                         </DialogActions>
// // // // // // // // // //                     </Dialog>
// // // // // // // // // //                 )}

// // // // // // // // // //                 {/* Fan Configuration Dialog */}
// // // // // // // // // //                 {showFanConfigDialog && selectedFan && (
// // // // // // // // // //                     <Dialog open={!!selectedFan} onClose={() => setSelectedFan(null)} maxWidth="sm" fullWidth>
// // // // // // // // // //                         <DialogTitle style={{ background: colors.surface, color: colors.text }}>
// // // // // // // // // //                             <Box display="flex" alignItems="center" gap={1}><Tune fontSize="small" />Configure {selectedFan.name}</Box>
// // // // // // // // // //                         </DialogTitle>
// // // // // // // // // //                         <DialogContent style={{ background: colors.bg, color: colors.text }}>
// // // // // // // // // //                             <Grid container spacing={2}>
// // // // // // // // // //                                 <Grid item xs={12}><TextField label="Fan Name" fullWidth value={selectedFan.name} onChange={e => setSelectedFan({ ...selectedFan, name: e.target.value })} /></Grid>
// // // // // // // // // //                                 <Grid item xs={6}><TextField label="Maintenance Hours" type="number" fullWidth value={selectedFan.maintenanceHours} onChange={e => setSelectedFan({ ...selectedFan, maintenanceHours: Number.parseInt(e.target.value) })} /></Grid>
// // // // // // // // // //                                 <Grid item xs={6}><TextField label="Last Maintenance" type="date" fullWidth value={selectedFan.lastMaintenance} onChange={e => setSelectedFan({ ...selectedFan, lastMaintenance: e.target.value })} /></Grid>
// // // // // // // // // //                                 <Grid item xs={6}>
// // // // // // // // // //                                     <FormControl fullWidth>
// // // // // // // // // //                                         <InputLabel>Speed Unit</InputLabel>
// // // // // // // // // //                                         <Select value={selectedFan.speedUnit} label="Speed Unit" onChange={e => setSelectedFan({ ...selectedFan, speedUnit: e.target.value })}>
// // // // // // // // // //                                             {speedUnits.map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
// // // // // // // // // //                                         </Select>
// // // // // // // // // //                                     </FormControl>
// // // // // // // // // //                                 </Grid>
// // // // // // // // // //                                 <Grid item xs={6}>
// // // // // // // // // //                                     <FormControl fullWidth>
// // // // // // // // // //                                         <InputLabel>Temperature Unit</InputLabel>
// // // // // // // // // //                                         <Select value={selectedFan.tempUnit} label="Temperature Unit" onChange={e => setSelectedFan({ ...selectedFan, tempUnit: e.target.value })}>
// // // // // // // // // //                                             {tempUnits.map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
// // // // // // // // // //                                         </Select>
// // // // // // // // // //                                     </FormControl>
// // // // // // // // // //                                 </Grid>
// // // // // // // // // //                             </Grid>
// // // // // // // // // //                         </DialogContent>
// // // // // // // // // //                         <DialogActions style={{ background: colors.surface }}>
// // // // // // // // // //                             <Button onClick={() => setSelectedFan(null)} style={{ color: primaryColor }}>Close</Button>
// // // // // // // // // //                         </DialogActions>
// // // // // // // // // //                     </Dialog>
// // // // // // // // // //                 )}
// // // // // // // // // //             </CardContent>
// // // // // // // // // //         </Card>
// // // // // // // // // //     )
// // // // // // // // // // }

// // // // // // // // // // export default FanControlWidget



// // // // // // // // // // // "use client"

// // // // // // // // // // // import { useState, useEffect } from "react"
// // // // // // // // // // // import {
// // // // // // // // // // //   Card,
// // // // // // // // // // //   CardContent,
// // // // // // // // // // //   Typography,
// // // // // // // // // // //   Button,
// // // // // // // // // // //   Slider,
// // // // // // // // // // //   Switch,
// // // // // // // // // // //   Chip,
// // // // // // // // // // //   Grid,
// // // // // // // // // // //   Box,
// // // // // // // // // // //   IconButton,
// // // // // // // // // // //   Dialog,
// // // // // // // // // // //   DialogTitle,
// // // // // // // // // // //   DialogContent,
// // // // // // // // // // //   DialogActions,
// // // // // // // // // // //   TextField,
// // // // // // // // // // //   Alert,
// // // // // // // // // // //   Badge,
// // // // // // // // // // //   MenuItem,
// // // // // // // // // // //   Select,
// // // // // // // // // // //   InputLabel,
// // // // // // // // // // //   FormControl,
// // // // // // // // // // // } from "@mui/material"
// // // // // // // // // // // import {
// // // // // // // // // // //   PlayArrow,
// // // // // // // // // // //   Stop,
// // // // // // // // // // //   Settings,
// // // // // // // // // // //   Warning,
// // // // // // // // // // //   Error,
// // // // // // // // // // //   CheckCircle,
// // // // // // // // // // //   Thermostat,
// // // // // // // // // // //   ElectricBolt,
// // // // // // // // // // //   Schedule,
// // // // // // // // // // //   Build,
// // // // // // // // // // //   Add,
// // // // // // // // // // //   Delete,
// // // // // // // // // // //   GroupWork,
// // // // // // // // // // //   RotateRight,
// // // // // // // // // // //   Percent,
// // // // // // // // // // //   Opacity,
// // // // // // // // // // //   Tune,
// // // // // // // // // // // } from "@mui/icons-material"
// // // // // // // // // // // import "../../../styles/fan-control-widget.css"

// // // // // // // // // // // // --- Industrial unit options for speed/temperature ---
// // // // // // // // // // // const SPEED_UNITS = [
// // // // // // // // // // //   { value: "%", label: "Percentage (%)", icon: <Percent fontSize="small" /> },
// // // // // // // // // // //   { value: "RPM", label: "Rotation (RPM)", icon: <RotateRight fontSize="small" /> },
// // // // // // // // // // // ]
// // // // // // // // // // // const TEMP_UNITS = [
// // // // // // // // // // //   { value: "°C", label: "Celsius (°C)", icon: <Thermostat fontSize="small" /> },
// // // // // // // // // // //   { value: "°F", label: "Fahrenheit (°F)", icon: <Thermostat fontSize="small" /> },
// // // // // // // // // // //   { value: "K", label: "Kelvin (K)", icon: <Opacity fontSize="small" /> },
// // // // // // // // // // // ]

// // // // // // // // // // // const DEFAULT_FANS = [
// // // // // // // // // // //   {
// // // // // // // // // // //     id: "fan1",
// // // // // // // // // // //     name: "Cooling Fan 1",
// // // // // // // // // // //     status: "running",
// // // // // // // // // // //     speed: 75,
// // // // // // // // // // //     targetSpeed: 75,
// // // // // // // // // // //     speedUnit: "%",
// // // // // // // // // // //     temperature: 45,
// // // // // // // // // // //     tempUnit: "°C",
// // // // // // // // // // //     power: 120,
// // // // // // // // // // //     runtime: 1250,
// // // // // // // // // // //     maintenanceHours: 8760,
// // // // // // // // // // //     lastMaintenance: "2024-01-15",
// // // // // // // // // // //     autoMode: true,
// // // // // // // // // // //     alarms: [],
// // // // // // // // // // //   },
// // // // // // // // // // //   {
// // // // // // // // // // //     id: "fan2",
// // // // // // // // // // //     name: "Exhaust Fan 2",
// // // // // // // // // // //     status: "stopped",
// // // // // // // // // // //     speed: 0,
// // // // // // // // // // //     targetSpeed: 0,
// // // // // // // // // // //     speedUnit: "%",
// // // // // // // // // // //     temperature: 32,
// // // // // // // // // // //     tempUnit: "°C",
// // // // // // // // // // //     power: 0,
// // // // // // // // // // //     runtime: 890,
// // // // // // // // // // //     maintenanceHours: 8760,
// // // // // // // // // // //     lastMaintenance: "2024-02-01",
// // // // // // // // // // //     autoMode: false,
// // // // // // // // // // //     alarms: [],
// // // // // // // // // // //   },
// // // // // // // // // // // ]

// // // // // // // // // // // const FanControlWidget = ({ config = {}, onConfigChange }) => {
// // // // // // // // // // //   const [fans, setFans] = useState(config.fans || DEFAULT_FANS)
// // // // // // // // // // //   const [selectedFan, setSelectedFan] = useState(null)
// // // // // // // // // // //   const [configDialog, setConfigDialog] = useState(false)
// // // // // // // // // // //   const [addFanDialog, setAddFanDialog] = useState(false)
// // // // // // // // // // //   const [groupOperation, setGroupOperation] = useState(false)
// // // // // // // // // // //   const [newFanName, setNewFanName] = useState("")

// // // // // // // // // // //   // ---- Real-time updates simulation (1s) ----
// // // // // // // // // // //   useEffect(() => {
// // // // // // // // // // //     const interval = setInterval(() => {
// // // // // // // // // // //       setFans((prevFans) =>
// // // // // // // // // // //         prevFans.map((fan) => {
// // // // // // // // // // //           if (fan.status === "running") {
// // // // // // // // // // //             const newFan = { ...fan }
// // // // // // // // // // //             // Simulate temperature drift and convert to selected unit
// // // // // // // // // // //             let tempChange = (Math.random() - 0.5) * 2
// // // // // // // // // // //             if (fan.tempUnit === "°F") tempChange *= 1.8
// // // // // // // // // // //             else if (fan.tempUnit === "K") tempChange *= 1

// // // // // // // // // // //             newFan.temperature = Math.max(25, Math.min(85, fan.temperature + tempChange))
// // // // // // // // // // //             newFan.power = Math.round((fan.speed / 100) * 150 + (Math.random() - 0.5) * 10)
// // // // // // // // // // //             newFan.runtime += 0.1

// // // // // // // // // // //             // Alarms
// // // // // // // // // // //             const newAlarms = []
// // // // // // // // // // //             // Always base threshold in Celsius, convert for display
// // // // // // // // // // //             let alarmTemp = fan.tempUnit === "°C" ? newFan.temperature :
// // // // // // // // // // //                             fan.tempUnit === "°F" ? (newFan.temperature - 32) * (5 / 9) :
// // // // // // // // // // //                             fan.tempUnit === "K"  ? (newFan.temperature - 273.15) : newFan.temperature
// // // // // // // // // // //             if (alarmTemp > 70) newAlarms.push({ type: "warning", message: "High temperature detected" })
// // // // // // // // // // //             if (alarmTemp > 80) newAlarms.push({ type: "error", message: "Critical temperature!" })
// // // // // // // // // // //             if (newFan.runtime > newFan.maintenanceHours) newAlarms.push({ type: "info", message: "Maintenance required" })

// // // // // // // // // // //             newFan.alarms = newAlarms

// // // // // // // // // // //             // Random failure
// // // // // // // // // // //             if (Math.random() < 0.001) {
// // // // // // // // // // //               newFan.status = "failed"
// // // // // // // // // // //               newFan.speed = 0
// // // // // // // // // // //               newFan.power = 0
// // // // // // // // // // //               newFan.alarms.push({ type: "error", message: "Fan failure detected!" })
// // // // // // // // // // //             }
// // // // // // // // // // //             return newFan
// // // // // // // // // // //           }
// // // // // // // // // // //           return fan
// // // // // // // // // // //         })
// // // // // // // // // // //       )
// // // // // // // // // // //     }, 1000)
// // // // // // // // // // //     return () => clearInterval(interval)
// // // // // // // // // // //   }, [])

// // // // // // // // // // //   // ---- Fan control actions ----
// // // // // // // // // // //   const handleFanControl = (fanId, action) => {
// // // // // // // // // // //     setFans((prevFans) =>
// // // // // // // // // // //       prevFans.map((fan) => {
// // // // // // // // // // //         if (fan.id === fanId) {
// // // // // // // // // // //           const updatedFan = { ...fan }
// // // // // // // // // // //           switch (action) {
// // // // // // // // // // //             case "start":
// // // // // // // // // // //               updatedFan.status = "running"
// // // // // // // // // // //               updatedFan.speed = updatedFan.targetSpeed || 50
// // // // // // // // // // //               break
// // // // // // // // // // //             case "stop":
// // // // // // // // // // //               updatedFan.status = "stopped"
// // // // // // // // // // //               updatedFan.speed = 0
// // // // // // // // // // //               updatedFan.power = 0
// // // // // // // // // // //               break
// // // // // // // // // // //             case "reset":
// // // // // // // // // // //               updatedFan.status = "stopped"
// // // // // // // // // // //               updatedFan.speed = 0
// // // // // // // // // // //               updatedFan.power = 0
// // // // // // // // // // //               updatedFan.alarms = []
// // // // // // // // // // //               break
// // // // // // // // // // //           }
// // // // // // // // // // //           return updatedFan
// // // // // // // // // // //         }
// // // // // // // // // // //         return fan
// // // // // // // // // // //       }),
// // // // // // // // // // //     )
// // // // // // // // // // //   }

// // // // // // // // // // //   // --- Speed change (supports % or RPM) ---
// // // // // // // // // // //   const handleSpeedChange = (fanId, newSpeed) => {
// // // // // // // // // // //     setFans((prevFans) =>
// // // // // // // // // // //       prevFans.map((fan) => {
// // // // // // // // // // //         if (fan.id === fanId) {
// // // // // // // // // // //           return {
// // // // // // // // // // //             ...fan,
// // // // // // // // // // //             targetSpeed: newSpeed,
// // // // // // // // // // //             speed: fan.status === "running" ? newSpeed : 0,
// // // // // // // // // // //           }
// // // // // // // // // // //         }
// // // // // // // // // // //         return fan
// // // // // // // // // // //       }),
// // // // // // // // // // //     )
// // // // // // // // // // //   }

// // // // // // // // // // //   const handleAutoModeToggle = (fanId) => {
// // // // // // // // // // //     setFans((prevFans) =>
// // // // // // // // // // //       prevFans.map((fan) => {
// // // // // // // // // // //         if (fan.id === fanId) {
// // // // // // // // // // //           return { ...fan, autoMode: !fan.autoMode }
// // // // // // // // // // //         }
// // // // // // // // // // //         return fan
// // // // // // // // // // //       }),
// // // // // // // // // // //     )
// // // // // // // // // // //   }

// // // // // // // // // // //   // --- Add/delete ---
// // // // // // // // // // //   const addNewFan = () => {
// // // // // // // // // // //     if (newFanName.trim()) {
// // // // // // // // // // //       const newFan = {
// // // // // // // // // // //         id: `fan${Date.now()}`,
// // // // // // // // // // //         name: newFanName,
// // // // // // // // // // //         status: "stopped",
// // // // // // // // // // //         speed: 0,
// // // // // // // // // // //         targetSpeed: 50,
// // // // // // // // // // //         speedUnit: "%",
// // // // // // // // // // //         temperature: 25,
// // // // // // // // // // //         tempUnit: "°C",
// // // // // // // // // // //         power: 0,
// // // // // // // // // // //         runtime: 0,
// // // // // // // // // // //         maintenanceHours: 8760,
// // // // // // // // // // //         lastMaintenance: new Date().toISOString().split("T")[0],
// // // // // // // // // // //         autoMode: false,
// // // // // // // // // // //         alarms: [],
// // // // // // // // // // //       }
// // // // // // // // // // //       setFans((prev) => [...prev, newFan])
// // // // // // // // // // //       setNewFanName("")
// // // // // // // // // // //       setAddFanDialog(false)
// // // // // // // // // // //     }
// // // // // // // // // // //   }
// // // // // // // // // // //   const deleteFan = (fanId) => setFans((prev) => prev.filter((fan) => fan.id !== fanId))

// // // // // // // // // // //   // --- Group Operations ---
// // // // // // // // // // //   const groupStartAll = () => setFans((prevFans) =>
// // // // // // // // // // //     prevFans.map((fan) => ({
// // // // // // // // // // //       ...fan,
// // // // // // // // // // //       status: fan.status !== "failed" ? "running" : fan.status,
// // // // // // // // // // //       speed: fan.status !== "failed" ? fan.targetSpeed : 0,
// // // // // // // // // // //     }))
// // // // // // // // // // //   )
// // // // // // // // // // //   const groupStopAll = () => setFans((prevFans) =>
// // // // // // // // // // //     prevFans.map((fan) => ({
// // // // // // // // // // //       ...fan,
// // // // // // // // // // //       status: fan.status !== "failed" ? "stopped" : fan.status,
// // // // // // // // // // //       speed: 0,
// // // // // // // // // // //       power: 0,
// // // // // // // // // // //     }))
// // // // // // // // // // //   )

// // // // // // // // // // //   // --- Unit update handlers in settings dialog ---
// // // // // // // // // // //   const handleFanConfigChange = (field, value) => {
// // // // // // // // // // //     if (!selectedFan) return
// // // // // // // // // // //     const updatedFan = { ...selectedFan, [field]: value }
// // // // // // // // // // //     setSelectedFan(updatedFan)
// // // // // // // // // // //     setFans((prev) => prev.map((f) => (f.id === selectedFan.id ? updatedFan : f)))
// // // // // // // // // // //   }

// // // // // // // // // // //   // --- Display ---
// // // // // // // // // // //   const getStatusColor = (status) => {
// // // // // // // // // // //     switch (status) {
// // // // // // // // // // //       case "running":
// // // // // // // // // // //         return "#4caf50"
// // // // // // // // // // //       case "stopped":
// // // // // // // // // // //         return "#757575"
// // // // // // // // // // //       case "failed":
// // // // // // // // // // //         return "#f44336"
// // // // // // // // // // //       default:
// // // // // // // // // // //         return "#757575"
// // // // // // // // // // //     }
// // // // // // // // // // //   }
// // // // // // // // // // //   const getStatusIcon = (fan) => {
// // // // // // // // // // //     switch (fan.status) {
// // // // // // // // // // //       case "running":
// // // // // // // // // // //         return <CheckCircle style={{ color: "#4caf50" }} />
// // // // // // // // // // //       case "stopped":
// // // // // // // // // // //         return <Stop style={{ color: "#757575" }} />
// // // // // // // // // // //       case "failed":
// // // // // // // // // // //         return <Error style={{ color: "#f44336" }} />
// // // // // // // // // // //       default:
// // // // // // // // // // //         return <Stop style={{ color: "#757575" }} />
// // // // // // // // // // //     }
// // // // // // // // // // //   }

// // // // // // // // // // //   const convertSpeed = (value, unit) => {
// // // // // // // // // // //     if (unit === "RPM") return Math.round(value * 18)
// // // // // // // // // // //     return value
// // // // // // // // // // //   }
// // // // // // // // // // //   const displaySpeed = (fan) => {
// // // // // // // // // // //     if (fan.speedUnit === "RPM") {
// // // // // // // // // // //       return `${convertSpeed(fan.speed, fan.speedUnit)} RPM`
// // // // // // // // // // //     } else {
// // // // // // // // // // //       return `${fan.speed} %`
// // // // // // // // // // //     }
// // // // // // // // // // //   }
// // // // // // // // // // //   const convertTemp = (value, unit) => {
// // // // // // // // // // //     if (unit === "°F") return (value * 9/5) + 32
// // // // // // // // // // //     if (unit === "K") return value + 273.15
// // // // // // // // // // //     return value
// // // // // // // // // // //   }
// // // // // // // // // // //   const displayTemp = (fan) => {
// // // // // // // // // // //     const t = convertTemp(fan.temperature, fan.tempUnit)
// // // // // // // // // // //     return `${t.toFixed(1)}${fan.tempUnit}`
// // // // // // // // // // //   }

// // // // // // // // // // //   const runningFans = fans.filter((fan) => fan.status === "running").length
// // // // // // // // // // //   const totalAlarms = fans.reduce((sum, fan) => sum + fan.alarms.length, 0)

// // // // // // // // // // //   return (
// // // // // // // // // // //     <Card className="fan-control-widget">
// // // // // // // // // // //       <CardContent>
// // // // // // // // // // //         <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
// // // // // // // // // // //           <Typography variant="h6">Fan Control System</Typography>
// // // // // // // // // // //           <Box display="flex" gap={1}>
// // // // // // // // // // //             <Chip
// // // // // // // // // // //               label={`${runningFans}/${fans.length} Running`}
// // // // // // // // // // //               color={runningFans > 0 ? "success" : "default"}
// // // // // // // // // // //               size="small"
// // // // // // // // // // //             />
// // // // // // // // // // //             {totalAlarms > 0 && (
// // // // // // // // // // //               <Badge badgeContent={totalAlarms} color="error">
// // // // // // // // // // //                 <Warning color="warning" />
// // // // // // // // // // //               </Badge>
// // // // // // // // // // //             )}
// // // // // // // // // // //             <IconButton size="small" onClick={() => setAddFanDialog(true)}>
// // // // // // // // // // //               <Add />
// // // // // // // // // // //             </IconButton>
// // // // // // // // // // //           </Box>
// // // // // // // // // // //         </Box>

// // // // // // // // // // //         {/* Group Controls */}
// // // // // // // // // // //         <Box mb={2} p={1} bgcolor="#f5f5f5" borderRadius={1}>
// // // // // // // // // // //           <Typography variant="subtitle2" gutterBottom>
// // // // // // // // // // //             Group Operations
// // // // // // // // // // //           </Typography>
// // // // // // // // // // //           <Box display="flex" gap={1}>
// // // // // // // // // // //             <Button size="small" startIcon={<PlayArrow />} onClick={groupStartAll} variant="outlined" color="success">
// // // // // // // // // // //               Start All
// // // // // // // // // // //             </Button>
// // // // // // // // // // //             <Button size="small" startIcon={<Stop />} onClick={groupStopAll} variant="outlined" color="error">
// // // // // // // // // // //               Stop All
// // // // // // // // // // //             </Button>
// // // // // // // // // // //             <Button
// // // // // // // // // // //               size="small"
// // // // // // // // // // //               startIcon={<GroupWork />}
// // // // // // // // // // //               onClick={() => setGroupOperation(!groupOperation)}
// // // // // // // // // // //               variant={groupOperation ? "contained" : "outlined"}
// // // // // // // // // // //             >
// // // // // // // // // // //               Group Mode
// // // // // // // // // // //             </Button>
// // // // // // // // // // //           </Box>
// // // // // // // // // // //         </Box>

// // // // // // // // // // //         {/* Fan Grid */}
// // // // // // // // // // //         <Grid container spacing={2}>
// // // // // // // // // // //           {fans.map((fan) => (
// // // // // // // // // // //             <Grid item xs={12} md={6} key={fan.id}>
// // // // // // // // // // //               <Card
// // // // // // // // // // //                 variant="outlined"
// // // // // // // // // // //                 className={`fan-card ${fan.status}`}
// // // // // // // // // // //                 style={{ borderColor: getStatusColor(fan.status) }}
// // // // // // // // // // //               >
// // // // // // // // // // //                 <CardContent>
// // // // // // // // // // //                   <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
// // // // // // // // // // //                     <Typography variant="subtitle1" fontWeight="bold">
// // // // // // // // // // //                       {fan.name}
// // // // // // // // // // //                     </Typography>
// // // // // // // // // // //                     <Box display="flex" alignItems="center" gap={1}>
// // // // // // // // // // //                       {getStatusIcon(fan)}
// // // // // // // // // // //                       <IconButton size="small" onClick={() => setSelectedFan(fan)}>
// // // // // // // // // // //                         <Settings />
// // // // // // // // // // //                       </IconButton>
// // // // // // // // // // //                       <IconButton size="small" onClick={() => deleteFan(fan.id)} color="error">
// // // // // // // // // // //                         <Delete />
// // // // // // // // // // //                       </IconButton>
// // // // // // // // // // //                     </Box>
// // // // // // // // // // //                   </Box>

// // // // // // // // // // //                   {/* Fan Animation */}
// // // // // // // // // // //                   {/* Fan Animation */}
// // // // // // // // // // //                     <Box display="flex" justifyContent="center" mb={2}>
// // // // // // // // // // //                     <div
// // // // // // // // // // //                         className={`fan-blade ${fan.status === "running" ? "spinning" : ""}`}
// // // // // // // // // // //                         style={{
// // // // // // // // // // //                         animationDuration: fan.speed > 0 ? `${2 - fan.speed / 50}s` : "0s",
// // // // // // // // // // //                         }}
// // // // // // // // // // //                     >
// // // // // // // // // // //                         <div className="fan-center"></div>
// // // // // // // // // // //                         {/* Use 4 blades, 90deg apart, all positioned from center */}
// // // // // // // // // // //                         <div className="blade" style={{ transform: "rotate(0deg)" }}></div>
// // // // // // // // // // //                         <div className="blade" style={{ transform: "rotate(90deg)" }}></div>
// // // // // // // // // // //                         <div className="blade" style={{ transform: "rotate(180deg)" }}></div>
// // // // // // // // // // //                         <div className="blade" style={{ transform: "rotate(270deg)" }}></div>
// // // // // // // // // // //                     </div>
// // // // // // // // // // //                     </Box>


// // // // // // // // // // //                   {/* Controls */}
// // // // // // // // // // //                   <Box mb={2}>
// // // // // // // // // // //                     <Box display="flex" gap={1} mb={1}>
// // // // // // // // // // //                       <Button
// // // // // // // // // // //                         size="small"
// // // // // // // // // // //                         startIcon={<PlayArrow />}
// // // // // // // // // // //                         onClick={() => handleFanControl(fan.id, "start")}
// // // // // // // // // // //                         disabled={fan.status === "failed"}
// // // // // // // // // // //                         variant="outlined"
// // // // // // // // // // //                         color="success"
// // // // // // // // // // //                       >
// // // // // // // // // // //                         Start
// // // // // // // // // // //                       </Button>
// // // // // // // // // // //                       <Button
// // // // // // // // // // //                         size="small"
// // // // // // // // // // //                         startIcon={<Stop />}
// // // // // // // // // // //                         onClick={() => handleFanControl(fan.id, "stop")}
// // // // // // // // // // //                         variant="outlined"
// // // // // // // // // // //                         color="error"
// // // // // // // // // // //                       >
// // // // // // // // // // //                         Stop
// // // // // // // // // // //                       </Button>
// // // // // // // // // // //                       {fan.status === "failed" && (
// // // // // // // // // // //                         <Button size="small" onClick={() => handleFanControl(fan.id, "reset")} variant="outlined">
// // // // // // // // // // //                           Reset
// // // // // // // // // // //                         </Button>
// // // // // // // // // // //                       )}
// // // // // // // // // // //                     </Box>
// // // // // // // // // // //                     <Box display="flex" alignItems="center" gap={1} mb={1}>
// // // // // // // // // // //                       <Typography variant="caption">Auto Mode:</Typography>
// // // // // // // // // // //                       <Switch size="small" checked={fan.autoMode} onChange={() => handleAutoModeToggle(fan.id)} />
// // // // // // // // // // //                     </Box>
// // // // // // // // // // //                   </Box>

// // // // // // // // // // //                   {/* Speed Control */}
// // // // // // // // // // //                   <Box mb={2}>
// // // // // // // // // // //                     <Typography variant="caption" gutterBottom>
// // // // // // // // // // //                       Speed: {displaySpeed(fan)}
// // // // // // // // // // //                     </Typography>
// // // // // // // // // // //                     <Slider
// // // // // // // // // // //                       value={fan.targetSpeed}
// // // // // // // // // // //                       onChange={(e, value) => handleSpeedChange(fan.id, value)}
// // // // // // // // // // //                       disabled={fan.status === "failed"}
// // // // // // // // // // //                       min={0}
// // // // // // // // // // //                       max={fan.speedUnit === "RPM" ? 1800 : 100}
// // // // // // // // // // //                       size="small"
// // // // // // // // // // //                     />
// // // // // // // // // // //                   </Box>

// // // // // // // // // // //                   {/* Status Information */}
// // // // // // // // // // //                   <Grid container spacing={1}>
// // // // // // // // // // //                     <Grid item xs={6}>
// // // // // // // // // // //                       <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // // // // // //                         <Thermostat fontSize="small" />
// // // // // // // // // // //                         <Typography variant="caption">{displayTemp(fan)}</Typography>
// // // // // // // // // // //                       </Box>
// // // // // // // // // // //                     </Grid>
// // // // // // // // // // //                     <Grid item xs={6}>
// // // // // // // // // // //                       <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // // // // // //                         <ElectricBolt fontSize="small" />
// // // // // // // // // // //                         <Typography variant="caption">{fan.power}W</Typography>
// // // // // // // // // // //                       </Box>
// // // // // // // // // // //                     </Grid>
// // // // // // // // // // //                     <Grid item xs={6}>
// // // // // // // // // // //                       <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // // // // // //                         <Schedule fontSize="small" />
// // // // // // // // // // //                         <Typography variant="caption">{fan.runtime.toFixed(1)}h</Typography>
// // // // // // // // // // //                       </Box>
// // // // // // // // // // //                     </Grid>
// // // // // // // // // // //                     <Grid item xs={6}>
// // // // // // // // // // //                       <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // // // // // //                         <Build fontSize="small" />
// // // // // // // // // // //                         <Typography variant="caption">
// // // // // // // // // // //                           {Math.max(0, fan.maintenanceHours - fan.runtime).toFixed(0)}h
// // // // // // // // // // //                         </Typography>
// // // // // // // // // // //                       </Box>
// // // // // // // // // // //                     </Grid>
// // // // // // // // // // //                   </Grid>

// // // // // // // // // // //                   {/* Alarms */}
// // // // // // // // // // //                   {fan.alarms.length > 0 && (
// // // // // // // // // // //                     <Box mt={1}>
// // // // // // // // // // //                       {fan.alarms.map((alarm, index) => (
// // // // // // // // // // //                         <Alert key={index} severity={alarm.type} size="small" style={{ marginBottom: 4 }}>
// // // // // // // // // // //                           {alarm.message}
// // // // // // // // // // //                         </Alert>
// // // // // // // // // // //                       ))}
// // // // // // // // // // //                     </Box>
// // // // // // // // // // //                   )}
// // // // // // // // // // //                 </CardContent>
// // // // // // // // // // //               </Card>
// // // // // // // // // // //             </Grid>
// // // // // // // // // // //           ))}
// // // // // // // // // // //         </Grid>

// // // // // // // // // // //         {/* Add Fan Dialog */}
// // // // // // // // // // //         <Dialog open={addFanDialog} onClose={() => setAddFanDialog(false)}>
// // // // // // // // // // //           <DialogTitle>Add New Fan</DialogTitle>
// // // // // // // // // // //           <DialogContent>
// // // // // // // // // // //             <TextField
// // // // // // // // // // //               autoFocus
// // // // // // // // // // //               margin="dense"
// // // // // // // // // // //               label="Fan Name"
// // // // // // // // // // //               fullWidth
// // // // // // // // // // //               variant="outlined"
// // // // // // // // // // //               value={newFanName}
// // // // // // // // // // //               onChange={(e) => setNewFanName(e.target.value)}
// // // // // // // // // // //             />
// // // // // // // // // // //           </DialogContent>
// // // // // // // // // // //           <DialogActions>
// // // // // // // // // // //             <Button onClick={() => setAddFanDialog(false)}>Cancel</Button>
// // // // // // // // // // //             <Button onClick={addNewFan} variant="contained">
// // // // // // // // // // //               Add Fan
// // // // // // // // // // //             </Button>
// // // // // // // // // // //           </DialogActions>
// // // // // // // // // // //         </Dialog>

// // // // // // // // // // //         {/* Fan Configuration Dialog */}
// // // // // // // // // // //         {selectedFan && (
// // // // // // // // // // //           <Dialog open={!!selectedFan} onClose={() => setSelectedFan(null)} maxWidth="sm" fullWidth>
// // // // // // // // // // //             <DialogTitle>
// // // // // // // // // // //               <Box display="flex" alignItems="center" gap={1}>
// // // // // // // // // // //                 <Tune fontSize="small" />
// // // // // // // // // // //                 Configure {selectedFan.name}
// // // // // // // // // // //               </Box>
// // // // // // // // // // //             </DialogTitle>
// // // // // // // // // // //             <DialogContent>
// // // // // // // // // // //               <Grid container spacing={2}>
// // // // // // // // // // //                 <Grid item xs={12}>
// // // // // // // // // // //                   <TextField
// // // // // // // // // // //                     label="Fan Name"
// // // // // // // // // // //                     fullWidth
// // // // // // // // // // //                     value={selectedFan.name}
// // // // // // // // // // //                     onChange={(e) => handleFanConfigChange("name", e.target.value)}
// // // // // // // // // // //                   />
// // // // // // // // // // //                 </Grid>
// // // // // // // // // // //                 <Grid item xs={6}>
// // // // // // // // // // //                   <TextField
// // // // // // // // // // //                     label="Maintenance Hours"
// // // // // // // // // // //                     type="number"
// // // // // // // // // // //                     fullWidth
// // // // // // // // // // //                     value={selectedFan.maintenanceHours}
// // // // // // // // // // //                     onChange={(e) => handleFanConfigChange("maintenanceHours", Number.parseInt(e.target.value))}
// // // // // // // // // // //                   />
// // // // // // // // // // //                 </Grid>
// // // // // // // // // // //                 <Grid item xs={6}>
// // // // // // // // // // //                   <TextField
// // // // // // // // // // //                     label="Last Maintenance"
// // // // // // // // // // //                     type="date"
// // // // // // // // // // //                     fullWidth
// // // // // // // // // // //                     value={selectedFan.lastMaintenance}
// // // // // // // // // // //                     onChange={(e) => handleFanConfigChange("lastMaintenance", e.target.value)}
// // // // // // // // // // //                   />
// // // // // // // // // // //                 </Grid>
// // // // // // // // // // //                 <Grid item xs={6}>
// // // // // // // // // // //                   <FormControl fullWidth>
// // // // // // // // // // //                     <InputLabel>Speed Unit</InputLabel>
// // // // // // // // // // //                     <Select
// // // // // // // // // // //                       value={selectedFan.speedUnit}
// // // // // // // // // // //                       label="Speed Unit"
// // // // // // // // // // //                       onChange={(e) => handleFanConfigChange("speedUnit", e.target.value)}
// // // // // // // // // // //                     >
// // // // // // // // // // //                       {SPEED_UNITS.map(opt => (
// // // // // // // // // // //                         <MenuItem key={opt.value} value={opt.value}>
// // // // // // // // // // //                           <Box display="flex" alignItems="center" gap={1}>
// // // // // // // // // // //                             {opt.icon}
// // // // // // // // // // //                             {opt.label}
// // // // // // // // // // //                           </Box>
// // // // // // // // // // //                         </MenuItem>
// // // // // // // // // // //                       ))}
// // // // // // // // // // //                     </Select>
// // // // // // // // // // //                   </FormControl>
// // // // // // // // // // //                 </Grid>
// // // // // // // // // // //                 <Grid item xs={6}>
// // // // // // // // // // //                   <FormControl fullWidth>
// // // // // // // // // // //                     <InputLabel>Temperature Unit</InputLabel>
// // // // // // // // // // //                     <Select
// // // // // // // // // // //                       value={selectedFan.tempUnit}
// // // // // // // // // // //                       label="Temperature Unit"
// // // // // // // // // // //                       onChange={(e) => handleFanConfigChange("tempUnit", e.target.value)}
// // // // // // // // // // //                     >
// // // // // // // // // // //                       {TEMP_UNITS.map(opt => (
// // // // // // // // // // //                         <MenuItem key={opt.value} value={opt.value}>
// // // // // // // // // // //                           <Box display="flex" alignItems="center" gap={1}>
// // // // // // // // // // //                             {opt.icon}
// // // // // // // // // // //                             {opt.label}
// // // // // // // // // // //                           </Box>
// // // // // // // // // // //                         </MenuItem>
// // // // // // // // // // //                       ))}
// // // // // // // // // // //                     </Select>
// // // // // // // // // // //                   </FormControl>
// // // // // // // // // // //                 </Grid>
// // // // // // // // // // //               </Grid>
// // // // // // // // // // //             </DialogContent>
// // // // // // // // // // //             <DialogActions>
// // // // // // // // // // //               <Button onClick={() => setSelectedFan(null)}>Close</Button>
// // // // // // // // // // //             </DialogActions>
// // // // // // // // // // //           </Dialog>
// // // // // // // // // // //         )}
// // // // // // // // // // //       </CardContent>
// // // // // // // // // // //     </Card>
// // // // // // // // // // //   )
// // // // // // // // // // // }

// // // // // // // // // // // export default FanControlWidget

// // // // // // // // // // // // "use client"

// // // // // // // // // // // // import { useState, useEffect } from "react"
// // // // // // // // // // // // import {
// // // // // // // // // // // //   Card,
// // // // // // // // // // // //   CardContent,
// // // // // // // // // // // //   Typography,
// // // // // // // // // // // //   Button,
// // // // // // // // // // // //   Slider,
// // // // // // // // // // // //   Switch,
// // // // // // // // // // // //   Chip,
// // // // // // // // // // // //   Grid,
// // // // // // // // // // // //   Box,
// // // // // // // // // // // //   IconButton,
// // // // // // // // // // // //   Dialog,
// // // // // // // // // // // //   DialogTitle,
// // // // // // // // // // // //   DialogContent,
// // // // // // // // // // // //   DialogActions,
// // // // // // // // // // // //   TextField,
// // // // // // // // // // // //   Alert,
// // // // // // // // // // // //   Badge,
// // // // // // // // // // // // } from "@mui/material"
// // // // // // // // // // // // import {
// // // // // // // // // // // //   PlayArrow,
// // // // // // // // // // // //   Stop,
// // // // // // // // // // // //   Settings,
// // // // // // // // // // // //   Warning,
// // // // // // // // // // // //   Error,
// // // // // // // // // // // //   CheckCircle,
// // // // // // // // // // // //   Thermostat,
// // // // // // // // // // // //   ElectricBolt,
// // // // // // // // // // // //   Schedule,
// // // // // // // // // // // //   Build,
// // // // // // // // // // // //   Add,
// // // // // // // // // // // //   Delete,
// // // // // // // // // // // //   GroupWork,
// // // // // // // // // // // // } from "@mui/icons-material"
// // // // // // // // // // // // import "../../styles/fan-control-widget.css"

// // // // // // // // // // // // const FanControlWidget = ({ config = {}, onConfigChange }) => {
// // // // // // // // // // // //   const [fans, setFans] = useState(
// // // // // // // // // // // //     config.fans || [
// // // // // // // // // // // //       {
// // // // // // // // // // // //         id: "fan1",
// // // // // // // // // // // //         name: "Cooling Fan 1",
// // // // // // // // // // // //         status: "running",
// // // // // // // // // // // //         speed: 75,
// // // // // // // // // // // //         targetSpeed: 75,
// // // // // // // // // // // //         temperature: 45,
// // // // // // // // // // // //         power: 120,
// // // // // // // // // // // //         runtime: 1250,
// // // // // // // // // // // //         maintenanceHours: 8760,
// // // // // // // // // // // //         lastMaintenance: "2024-01-15",
// // // // // // // // // // // //         autoMode: true,
// // // // // // // // // // // //         alarms: [],
// // // // // // // // // // // //       },
// // // // // // // // // // // //       {
// // // // // // // // // // // //         id: "fan2",
// // // // // // // // // // // //         name: "Exhaust Fan 2",
// // // // // // // // // // // //         status: "stopped",
// // // // // // // // // // // //         speed: 0,
// // // // // // // // // // // //         targetSpeed: 0,
// // // // // // // // // // // //         temperature: 32,
// // // // // // // // // // // //         power: 0,
// // // // // // // // // // // //         runtime: 890,
// // // // // // // // // // // //         maintenanceHours: 8760,
// // // // // // // // // // // //         lastMaintenance: "2024-02-01",
// // // // // // // // // // // //         autoMode: false,
// // // // // // // // // // // //         alarms: [],
// // // // // // // // // // // //       },
// // // // // // // // // // // //     ],
// // // // // // // // // // // //   )

// // // // // // // // // // // //   const [selectedFan, setSelectedFan] = useState(null)
// // // // // // // // // // // //   const [configDialog, setConfigDialog] = useState(false)
// // // // // // // // // // // //   const [addFanDialog, setAddFanDialog] = useState(false)
// // // // // // // // // // // //   const [groupOperation, setGroupOperation] = useState(false)
// // // // // // // // // // // //   const [newFanName, setNewFanName] = useState("")

// // // // // // // // // // // //   // Simulate real-time data updates
// // // // // // // // // // // //   useEffect(() => {
// // // // // // // // // // // //     const interval = setInterval(() => {
// // // // // // // // // // // //       setFans((prevFans) =>
// // // // // // // // // // // //         prevFans.map((fan) => {
// // // // // // // // // // // //           if (fan.status === "running") {
// // // // // // // // // // // //             const newFan = { ...fan }

// // // // // // // // // // // //             // Simulate temperature fluctuation
// // // // // // // // // // // //             newFan.temperature = Math.max(25, Math.min(85, fan.temperature + (Math.random() - 0.5) * 2))

// // // // // // // // // // // //             // Simulate power consumption based on speed
// // // // // // // // // // // //             newFan.power = Math.round((fan.speed / 100) * 150 + (Math.random() - 0.5) * 10)

// // // // // // // // // // // //             // Increment runtime
// // // // // // // // // // // //             newFan.runtime += 0.1

// // // // // // // // // // // //             // Check for alarms
// // // // // // // // // // // //             const newAlarms = []
// // // // // // // // // // // //             if (newFan.temperature > 70) {
// // // // // // // // // // // //               newAlarms.push({ type: "warning", message: "High temperature detected" })
// // // // // // // // // // // //             }
// // // // // // // // // // // //             if (newFan.temperature > 80) {
// // // // // // // // // // // //               newAlarms.push({ type: "error", message: "Critical temperature!" })
// // // // // // // // // // // //             }
// // // // // // // // // // // //             if (newFan.runtime > newFan.maintenanceHours) {
// // // // // // // // // // // //               newAlarms.push({ type: "info", message: "Maintenance required" })
// // // // // // // // // // // //             }

// // // // // // // // // // // //             newFan.alarms = newAlarms

// // // // // // // // // // // //             // Random failure simulation (very low probability)
// // // // // // // // // // // //             if (Math.random() < 0.001) {
// // // // // // // // // // // //               newFan.status = "failed"
// // // // // // // // // // // //               newFan.speed = 0
// // // // // // // // // // // //               newFan.power = 0
// // // // // // // // // // // //               newFan.alarms.push({ type: "error", message: "Fan failure detected!" })
// // // // // // // // // // // //             }

// // // // // // // // // // // //             return newFan
// // // // // // // // // // // //           }
// // // // // // // // // // // //           return fan
// // // // // // // // // // // //         }),
// // // // // // // // // // // //       )
// // // // // // // // // // // //     }, 1000)

// // // // // // // // // // // //     return () => clearInterval(interval)
// // // // // // // // // // // //   }, [])

// // // // // // // // // // // //   const handleFanControl = (fanId, action) => {
// // // // // // // // // // // //     setFans((prevFans) =>
// // // // // // // // // // // //       prevFans.map((fan) => {
// // // // // // // // // // // //         if (fan.id === fanId) {
// // // // // // // // // // // //           const updatedFan = { ...fan }
// // // // // // // // // // // //           switch (action) {
// // // // // // // // // // // //             case "start":
// // // // // // // // // // // //               updatedFan.status = "running"
// // // // // // // // // // // //               updatedFan.speed = updatedFan.targetSpeed || 50
// // // // // // // // // // // //               break
// // // // // // // // // // // //             case "stop":
// // // // // // // // // // // //               updatedFan.status = "stopped"
// // // // // // // // // // // //               updatedFan.speed = 0
// // // // // // // // // // // //               updatedFan.power = 0
// // // // // // // // // // // //               break
// // // // // // // // // // // //             case "reset":
// // // // // // // // // // // //               updatedFan.status = "stopped"
// // // // // // // // // // // //               updatedFan.speed = 0
// // // // // // // // // // // //               updatedFan.power = 0
// // // // // // // // // // // //               updatedFan.alarms = []
// // // // // // // // // // // //               break
// // // // // // // // // // // //           }
// // // // // // // // // // // //           return updatedFan
// // // // // // // // // // // //         }
// // // // // // // // // // // //         return fan
// // // // // // // // // // // //       }),
// // // // // // // // // // // //     )
// // // // // // // // // // // //   }

// // // // // // // // // // // //   const handleSpeedChange = (fanId, newSpeed) => {
// // // // // // // // // // // //     setFans((prevFans) =>
// // // // // // // // // // // //       prevFans.map((fan) => {
// // // // // // // // // // // //         if (fan.id === fanId) {
// // // // // // // // // // // //           return {
// // // // // // // // // // // //             ...fan,
// // // // // // // // // // // //             targetSpeed: newSpeed,
// // // // // // // // // // // //             speed: fan.status === "running" ? newSpeed : 0,
// // // // // // // // // // // //           }
// // // // // // // // // // // //         }
// // // // // // // // // // // //         return fan
// // // // // // // // // // // //       }),
// // // // // // // // // // // //     )
// // // // // // // // // // // //   }

// // // // // // // // // // // //   const handleAutoModeToggle = (fanId) => {
// // // // // // // // // // // //     setFans((prevFans) =>
// // // // // // // // // // // //       prevFans.map((fan) => {
// // // // // // // // // // // //         if (fan.id === fanId) {
// // // // // // // // // // // //           return { ...fan, autoMode: !fan.autoMode }
// // // // // // // // // // // //         }
// // // // // // // // // // // //         return fan
// // // // // // // // // // // //       }),
// // // // // // // // // // // //     )
// // // // // // // // // // // //   }

// // // // // // // // // // // //   const addNewFan = () => {
// // // // // // // // // // // //     if (newFanName.trim()) {
// // // // // // // // // // // //       const newFan = {
// // // // // // // // // // // //         id: `fan${Date.now()}`,
// // // // // // // // // // // //         name: newFanName,
// // // // // // // // // // // //         status: "stopped",
// // // // // // // // // // // //         speed: 0,
// // // // // // // // // // // //         targetSpeed: 50,
// // // // // // // // // // // //         temperature: 25,
// // // // // // // // // // // //         power: 0,
// // // // // // // // // // // //         runtime: 0,
// // // // // // // // // // // //         maintenanceHours: 8760,
// // // // // // // // // // // //         lastMaintenance: new Date().toISOString().split("T")[0],
// // // // // // // // // // // //         autoMode: false,
// // // // // // // // // // // //         alarms: [],
// // // // // // // // // // // //       }
// // // // // // // // // // // //       setFans((prev) => [...prev, newFan])
// // // // // // // // // // // //       setNewFanName("")
// // // // // // // // // // // //       setAddFanDialog(false)
// // // // // // // // // // // //     }
// // // // // // // // // // // //   }

// // // // // // // // // // // //   const deleteFan = (fanId) => {
// // // // // // // // // // // //     setFans((prev) => prev.filter((fan) => fan.id !== fanId))
// // // // // // // // // // // //   }

// // // // // // // // // // // //   const groupStartAll = () => {
// // // // // // // // // // // //     setFans((prevFans) =>
// // // // // // // // // // // //       prevFans.map((fan) => ({
// // // // // // // // // // // //         ...fan,
// // // // // // // // // // // //         status: fan.status !== "failed" ? "running" : fan.status,
// // // // // // // // // // // //         speed: fan.status !== "failed" ? fan.targetSpeed : 0,
// // // // // // // // // // // //       })),
// // // // // // // // // // // //     )
// // // // // // // // // // // //   }

// // // // // // // // // // // //   const groupStopAll = () => {
// // // // // // // // // // // //     setFans((prevFans) =>
// // // // // // // // // // // //       prevFans.map((fan) => ({
// // // // // // // // // // // //         ...fan,
// // // // // // // // // // // //         status: fan.status !== "failed" ? "stopped" : fan.status,
// // // // // // // // // // // //         speed: 0,
// // // // // // // // // // // //         power: 0,
// // // // // // // // // // // //       })),
// // // // // // // // // // // //     )
// // // // // // // // // // // //   }

// // // // // // // // // // // //   const getStatusColor = (status) => {
// // // // // // // // // // // //     switch (status) {
// // // // // // // // // // // //       case "running":
// // // // // // // // // // // //         return "#4caf50"
// // // // // // // // // // // //       case "stopped":
// // // // // // // // // // // //         return "#757575"
// // // // // // // // // // // //       case "failed":
// // // // // // // // // // // //         return "#f44336"
// // // // // // // // // // // //       default:
// // // // // // // // // // // //         return "#757575"
// // // // // // // // // // // //     }
// // // // // // // // // // // //   }

// // // // // // // // // // // //   const getStatusIcon = (fan) => {
// // // // // // // // // // // //     switch (fan.status) {
// // // // // // // // // // // //       case "running":
// // // // // // // // // // // //         return <CheckCircle style={{ color: "#4caf50" }} />
// // // // // // // // // // // //       case "stopped":
// // // // // // // // // // // //         return <Stop style={{ color: "#757575" }} />
// // // // // // // // // // // //       case "failed":
// // // // // // // // // // // //         return <Error style={{ color: "#f44336" }} />
// // // // // // // // // // // //       default:
// // // // // // // // // // // //         return <Stop style={{ color: "#757575" }} />
// // // // // // // // // // // //     }
// // // // // // // // // // // //   }

// // // // // // // // // // // //   const runningFans = fans.filter((fan) => fan.status === "running").length
// // // // // // // // // // // //   const totalAlarms = fans.reduce((sum, fan) => sum + fan.alarms.length, 0)

// // // // // // // // // // // //   return (
// // // // // // // // // // // //     <Card className="fan-control-widget">
// // // // // // // // // // // //       <CardContent>
// // // // // // // // // // // //         <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
// // // // // // // // // // // //           <Typography variant="h6">Fan Control System</Typography>
// // // // // // // // // // // //           <Box display="flex" gap={1}>
// // // // // // // // // // // //             <Chip
// // // // // // // // // // // //               label={`${runningFans}/${fans.length} Running`}
// // // // // // // // // // // //               color={runningFans > 0 ? "success" : "default"}
// // // // // // // // // // // //               size="small"
// // // // // // // // // // // //             />
// // // // // // // // // // // //             {totalAlarms > 0 && (
// // // // // // // // // // // //               <Badge badgeContent={totalAlarms} color="error">
// // // // // // // // // // // //                 <Warning color="warning" />
// // // // // // // // // // // //               </Badge>
// // // // // // // // // // // //             )}
// // // // // // // // // // // //             <IconButton size="small" onClick={() => setAddFanDialog(true)}>
// // // // // // // // // // // //               <Add />
// // // // // // // // // // // //             </IconButton>
// // // // // // // // // // // //           </Box>
// // // // // // // // // // // //         </Box>

// // // // // // // // // // // //         {/* Group Controls */}
// // // // // // // // // // // //         <Box mb={2} p={1} bgcolor="#f5f5f5" borderRadius={1}>
// // // // // // // // // // // //           <Typography variant="subtitle2" gutterBottom>
// // // // // // // // // // // //             Group Operations
// // // // // // // // // // // //           </Typography>
// // // // // // // // // // // //           <Box display="flex" gap={1}>
// // // // // // // // // // // //             <Button size="small" startIcon={<PlayArrow />} onClick={groupStartAll} variant="outlined" color="success">
// // // // // // // // // // // //               Start All
// // // // // // // // // // // //             </Button>
// // // // // // // // // // // //             <Button size="small" startIcon={<Stop />} onClick={groupStopAll} variant="outlined" color="error">
// // // // // // // // // // // //               Stop All
// // // // // // // // // // // //             </Button>
// // // // // // // // // // // //             <Button
// // // // // // // // // // // //               size="small"
// // // // // // // // // // // //               startIcon={<GroupWork />}
// // // // // // // // // // // //               onClick={() => setGroupOperation(!groupOperation)}
// // // // // // // // // // // //               variant={groupOperation ? "contained" : "outlined"}
// // // // // // // // // // // //             >
// // // // // // // // // // // //               Group Mode
// // // // // // // // // // // //             </Button>
// // // // // // // // // // // //           </Box>
// // // // // // // // // // // //         </Box>

// // // // // // // // // // // //         {/* Fan Grid */}
// // // // // // // // // // // //         <Grid container spacing={2}>
// // // // // // // // // // // //           {fans.map((fan) => (
// // // // // // // // // // // //             <Grid item xs={12} md={6} key={fan.id}>
// // // // // // // // // // // //               <Card
// // // // // // // // // // // //                 variant="outlined"
// // // // // // // // // // // //                 className={`fan-card ${fan.status}`}
// // // // // // // // // // // //                 style={{ borderColor: getStatusColor(fan.status) }}
// // // // // // // // // // // //               >
// // // // // // // // // // // //                 <CardContent>
// // // // // // // // // // // //                   <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
// // // // // // // // // // // //                     <Typography variant="subtitle1" fontWeight="bold">
// // // // // // // // // // // //                       {fan.name}
// // // // // // // // // // // //                     </Typography>
// // // // // // // // // // // //                     <Box display="flex" alignItems="center" gap={1}>
// // // // // // // // // // // //                       {getStatusIcon(fan)}
// // // // // // // // // // // //                       <IconButton size="small" onClick={() => setSelectedFan(fan)}>
// // // // // // // // // // // //                         <Settings />
// // // // // // // // // // // //                       </IconButton>
// // // // // // // // // // // //                       <IconButton size="small" onClick={() => deleteFan(fan.id)} color="error">
// // // // // // // // // // // //                         <Delete />
// // // // // // // // // // // //                       </IconButton>
// // // // // // // // // // // //                     </Box>
// // // // // // // // // // // //                   </Box>

// // // // // // // // // // // //                   {/* Fan Animation */}
// // // // // // // // // // // //                   <Box display="flex" justifyContent="center" mb={2}>
// // // // // // // // // // // //                     <div
// // // // // // // // // // // //                       className={`fan-blade ${fan.status === "running" ? "spinning" : ""}`}
// // // // // // // // // // // //                       style={{
// // // // // // // // // // // //                         animationDuration: fan.speed > 0 ? `${2 - fan.speed / 100}s` : "0s",
// // // // // // // // // // // //                       }}
// // // // // // // // // // // //                     >
// // // // // // // // // // // //                       <div className="fan-center"></div>
// // // // // // // // // // // //                       <div className="blade blade1"></div>
// // // // // // // // // // // //                       <div className="blade blade2"></div>
// // // // // // // // // // // //                       <div className="blade blade3"></div>
// // // // // // // // // // // //                       <div className="blade blade4"></div>
// // // // // // // // // // // //                     </div>
// // // // // // // // // // // //                   </Box>

// // // // // // // // // // // //                   {/* Controls */}
// // // // // // // // // // // //                   <Box mb={2}>
// // // // // // // // // // // //                     <Box display="flex" gap={1} mb={1}>
// // // // // // // // // // // //                       <Button
// // // // // // // // // // // //                         size="small"
// // // // // // // // // // // //                         startIcon={<PlayArrow />}
// // // // // // // // // // // //                         onClick={() => handleFanControl(fan.id, "start")}
// // // // // // // // // // // //                         disabled={fan.status === "failed"}
// // // // // // // // // // // //                         variant="outlined"
// // // // // // // // // // // //                         color="success"
// // // // // // // // // // // //                       >
// // // // // // // // // // // //                         Start
// // // // // // // // // // // //                       </Button>
// // // // // // // // // // // //                       <Button
// // // // // // // // // // // //                         size="small"
// // // // // // // // // // // //                         startIcon={<Stop />}
// // // // // // // // // // // //                         onClick={() => handleFanControl(fan.id, "stop")}
// // // // // // // // // // // //                         variant="outlined"
// // // // // // // // // // // //                         color="error"
// // // // // // // // // // // //                       >
// // // // // // // // // // // //                         Stop
// // // // // // // // // // // //                       </Button>
// // // // // // // // // // // //                       {fan.status === "failed" && (
// // // // // // // // // // // //                         <Button size="small" onClick={() => handleFanControl(fan.id, "reset")} variant="outlined">
// // // // // // // // // // // //                           Reset
// // // // // // // // // // // //                         </Button>
// // // // // // // // // // // //                       )}
// // // // // // // // // // // //                     </Box>

// // // // // // // // // // // //                     <Box display="flex" alignItems="center" gap={1} mb={1}>
// // // // // // // // // // // //                       <Typography variant="caption">Auto Mode:</Typography>
// // // // // // // // // // // //                       <Switch size="small" checked={fan.autoMode} onChange={() => handleAutoModeToggle(fan.id)} />
// // // // // // // // // // // //                     </Box>
// // // // // // // // // // // //                   </Box>

// // // // // // // // // // // //                   {/* Speed Control */}
// // // // // // // // // // // //                   <Box mb={2}>
// // // // // // // // // // // //                     <Typography variant="caption" gutterBottom>
// // // // // // // // // // // //                       Speed: {fan.speed}% ({Math.round(fan.speed * 18)} RPM)
// // // // // // // // // // // //                     </Typography>
// // // // // // // // // // // //                     <Slider
// // // // // // // // // // // //                       value={fan.targetSpeed}
// // // // // // // // // // // //                       onChange={(e, value) => handleSpeedChange(fan.id, value)}
// // // // // // // // // // // //                       disabled={fan.status === "failed"}
// // // // // // // // // // // //                       min={0}
// // // // // // // // // // // //                       max={100}
// // // // // // // // // // // //                       size="small"
// // // // // // // // // // // //                     />
// // // // // // // // // // // //                   </Box>

// // // // // // // // // // // //                   {/* Status Information */}
// // // // // // // // // // // //                   <Grid container spacing={1}>
// // // // // // // // // // // //                     <Grid item xs={6}>
// // // // // // // // // // // //                       <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // // // // // // //                         <Thermostat fontSize="small" />
// // // // // // // // // // // //                         <Typography variant="caption">{fan.temperature.toFixed(1)}°C</Typography>
// // // // // // // // // // // //                       </Box>
// // // // // // // // // // // //                     </Grid>
// // // // // // // // // // // //                     <Grid item xs={6}>
// // // // // // // // // // // //                       <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // // // // // // //                         <ElectricBolt fontSize="small" />
// // // // // // // // // // // //                         <Typography variant="caption">{fan.power}W</Typography>
// // // // // // // // // // // //                       </Box>
// // // // // // // // // // // //                     </Grid>
// // // // // // // // // // // //                     <Grid item xs={6}>
// // // // // // // // // // // //                       <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // // // // // // //                         <Schedule fontSize="small" />
// // // // // // // // // // // //                         <Typography variant="caption">{fan.runtime.toFixed(1)}h</Typography>
// // // // // // // // // // // //                       </Box>
// // // // // // // // // // // //                     </Grid>
// // // // // // // // // // // //                     <Grid item xs={6}>
// // // // // // // // // // // //                       <Box display="flex" alignItems="center" gap={0.5}>
// // // // // // // // // // // //                         <Build fontSize="small" />
// // // // // // // // // // // //                         <Typography variant="caption">
// // // // // // // // // // // //                           {Math.max(0, fan.maintenanceHours - fan.runtime).toFixed(0)}h
// // // // // // // // // // // //                         </Typography>
// // // // // // // // // // // //                       </Box>
// // // // // // // // // // // //                     </Grid>
// // // // // // // // // // // //                   </Grid>

// // // // // // // // // // // //                   {/* Alarms */}
// // // // // // // // // // // //                   {fan.alarms.length > 0 && (
// // // // // // // // // // // //                     <Box mt={1}>
// // // // // // // // // // // //                       {fan.alarms.map((alarm, index) => (
// // // // // // // // // // // //                         <Alert key={index} severity={alarm.type} size="small" style={{ marginBottom: 4 }}>
// // // // // // // // // // // //                           {alarm.message}
// // // // // // // // // // // //                         </Alert>
// // // // // // // // // // // //                       ))}
// // // // // // // // // // // //                     </Box>
// // // // // // // // // // // //                   )}
// // // // // // // // // // // //                 </CardContent>
// // // // // // // // // // // //               </Card>
// // // // // // // // // // // //             </Grid>
// // // // // // // // // // // //           ))}
// // // // // // // // // // // //         </Grid>

// // // // // // // // // // // //         {/* Add Fan Dialog */}
// // // // // // // // // // // //         <Dialog open={addFanDialog} onClose={() => setAddFanDialog(false)}>
// // // // // // // // // // // //           <DialogTitle>Add New Fan</DialogTitle>
// // // // // // // // // // // //           <DialogContent>
// // // // // // // // // // // //             <TextField
// // // // // // // // // // // //               autoFocus
// // // // // // // // // // // //               margin="dense"
// // // // // // // // // // // //               label="Fan Name"
// // // // // // // // // // // //               fullWidth
// // // // // // // // // // // //               variant="outlined"
// // // // // // // // // // // //               value={newFanName}
// // // // // // // // // // // //               onChange={(e) => setNewFanName(e.target.value)}
// // // // // // // // // // // //             />
// // // // // // // // // // // //           </DialogContent>
// // // // // // // // // // // //           <DialogActions>
// // // // // // // // // // // //             <Button onClick={() => setAddFanDialog(false)}>Cancel</Button>
// // // // // // // // // // // //             <Button onClick={addNewFan} variant="contained">
// // // // // // // // // // // //               Add Fan
// // // // // // // // // // // //             </Button>
// // // // // // // // // // // //           </DialogActions>
// // // // // // // // // // // //         </Dialog>

// // // // // // // // // // // //         {/* Fan Configuration Dialog */}
// // // // // // // // // // // //         {selectedFan && (
// // // // // // // // // // // //           <Dialog open={!!selectedFan} onClose={() => setSelectedFan(null)} maxWidth="sm" fullWidth>
// // // // // // // // // // // //             <DialogTitle>Configure {selectedFan.name}</DialogTitle>
// // // // // // // // // // // //             <DialogContent>
// // // // // // // // // // // //               <Grid container spacing={2}>
// // // // // // // // // // // //                 <Grid item xs={12}>
// // // // // // // // // // // //                   <TextField
// // // // // // // // // // // //                     label="Fan Name"
// // // // // // // // // // // //                     fullWidth
// // // // // // // // // // // //                     value={selectedFan.name}
// // // // // // // // // // // //                     onChange={(e) => {
// // // // // // // // // // // //                       const updatedFan = { ...selectedFan, name: e.target.value }
// // // // // // // // // // // //                       setSelectedFan(updatedFan)
// // // // // // // // // // // //                       setFans((prev) => prev.map((f) => (f.id === selectedFan.id ? updatedFan : f)))
// // // // // // // // // // // //                     }}
// // // // // // // // // // // //                   />
// // // // // // // // // // // //                 </Grid>
// // // // // // // // // // // //                 <Grid item xs={6}>
// // // // // // // // // // // //                   <TextField
// // // // // // // // // // // //                     label="Maintenance Hours"
// // // // // // // // // // // //                     type="number"
// // // // // // // // // // // //                     fullWidth
// // // // // // // // // // // //                     value={selectedFan.maintenanceHours}
// // // // // // // // // // // //                     onChange={(e) => {
// // // // // // // // // // // //                       const updatedFan = { ...selectedFan, maintenanceHours: Number.parseInt(e.target.value) }
// // // // // // // // // // // //                       setSelectedFan(updatedFan)
// // // // // // // // // // // //                       setFans((prev) => prev.map((f) => (f.id === selectedFan.id ? updatedFan : f)))
// // // // // // // // // // // //                     }}
// // // // // // // // // // // //                   />
// // // // // // // // // // // //                 </Grid>
// // // // // // // // // // // //                 <Grid item xs={6}>
// // // // // // // // // // // //                   <TextField
// // // // // // // // // // // //                     label="Last Maintenance"
// // // // // // // // // // // //                     type="date"
// // // // // // // // // // // //                     fullWidth
// // // // // // // // // // // //                     value={selectedFan.lastMaintenance}
// // // // // // // // // // // //                     onChange={(e) => {
// // // // // // // // // // // //                       const updatedFan = { ...selectedFan, lastMaintenance: e.target.value }
// // // // // // // // // // // //                       setSelectedFan(updatedFan)
// // // // // // // // // // // //                       setFans((prev) => prev.map((f) => (f.id === selectedFan.id ? updatedFan : f)))
// // // // // // // // // // // //                     }}
// // // // // // // // // // // //                   />
// // // // // // // // // // // //                 </Grid>
// // // // // // // // // // // //               </Grid>
// // // // // // // // // // // //             </DialogContent>
// // // // // // // // // // // //             <DialogActions>
// // // // // // // // // // // //               <Button onClick={() => setSelectedFan(null)}>Close</Button>
// // // // // // // // // // // //             </DialogActions>
// // // // // // // // // // // //           </Dialog>
// // // // // // // // // // // //         )}
// // // // // // // // // // // //       </CardContent>
// // // // // // // // // // // //     </Card>
// // // // // // // // // // // //   )
// // // // // // // // // // // // }

// // // // // // // // // // // // export default FanControlWidget
