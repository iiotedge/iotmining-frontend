"use client"

import { useState, useEffect } from "react"
import {
  Card, CardContent, Typography, Button, Slider, Switch, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, MenuItem, Select, InputLabel, FormControl
} from "@mui/material"
import {
  PlayArrow, Stop, Settings, Error, CheckCircle, Thermostat, ElectricBolt, Schedule, Build, Tune,
  Percent, RotateRight, Opacity
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

const DEFAULT_FAN = {
  id: "fan1", name: "Cooling Fan 1", status: "running", speed: 75, targetSpeed: 75, speedUnit: "%",
  temperature: 45, tempUnit: "°C", power: 120, runtime: 1250, maintenanceHours: 8760,
  lastMaintenance: "2024-01-15", autoMode: true, alarms: [],
}

const SingleFanWidget = ({
  fan: propFan = DEFAULT_FAN,
  onControlChange,
  onConfigChange,
  showEditFan = true,
  showAutoMode = true,
  showSpeedSet = true,
  showStartStop = true,
  showReset = true,
  showAlarms = true,
  showStats = true,
  showFanConfigDialog = true,
  speedUnits = DEFAULT_SPEED_UNITS,
  tempUnits = DEFAULT_TEMP_UNITS,
  minSpeed = 0,
  maxSpeedPercent = 100,
  maxSpeedRpm = 1800,
  title = "Fan Control",
}) => {
  const { isDarkMode, primaryColor } = useTheme()
  const themeColors = {
    light: {
      bg: "#fff", bgElevated: "#fafbfc", cardBorder: "#e0e0e0", text: "#222", textSecondary: "#444", surface: "#f6f8fa",
    },
    dark: {
      bg: "#141414", bgElevated: "#23272f", cardBorder: "#24272b", text: "#fff", textSecondary: "#bbb", surface: "#181c23",
    }
  }
  const colors = themeColors[isDarkMode ? "dark" : "light"]

  // Maintain local state for this single fan (simulate real-time as in the grid version)
  const [fan, setFan] = useState(propFan)
  const [editDialog, setEditDialog] = useState(false)

  // Demo mode simulation (remove for live)
  useEffect(() => {
    const interval = setInterval(() => {
      setFan((f) => {
        if (f.status === "running") {
          let tempChange = (Math.random() - 0.5) * 2
          if (f.tempUnit === "°F") tempChange *= 1.8
          else if (f.tempUnit === "K") tempChange *= 1
          const newTemp = Math.max(25, Math.min(85, f.temperature + tempChange))
          return {
            ...f,
            temperature: newTemp,
            power: Math.round((f.speed / 100) * 150 + (Math.random() - 0.5) * 10),
            runtime: f.runtime + 0.1,
            alarms: newTemp > 80 ? [{ type: "error", message: "Critical temperature!" }]
              : newTemp > 70 ? [{ type: "warning", message: "High temperature detected" }]
              : [],
          }
        }
        return f
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleFanControl = (action) => {
    if (onControlChange) onControlChange(fan.id, "action", action)
    setFan((f) => {
      let updated = { ...f }
      if (action === "start") {
        updated.status = "running"
        updated.speed = updated.targetSpeed || 50
      } else if (action === "stop") {
        updated.status = "stopped"
        updated.speed = 0
        updated.power = 0
      } else if (action === "reset") {
        updated.status = "stopped"
        updated.speed = 0
        updated.power = 0
        updated.alarms = []
      }
      return updated
    })
  }

  const handleSpeedChange = (newSpeed) => {
    if (onControlChange) onControlChange(fan.id, "targetSpeed", newSpeed)
    setFan(f => ({ ...f, targetSpeed: newSpeed, speed: f.status === "running" ? newSpeed : 0 }))
  }

  const handleAutoModeToggle = () => {
    setFan(f => ({ ...f, autoMode: !f.autoMode }))
    if (onControlChange) onControlChange(fan.id, "autoMode", !fan.autoMode)
  }

  const getStatusColor = (status) =>
    status === "running" ? "#4caf50" : status === "failed" ? "#f44336" : colors.cardBorder
  const getStatusIcon = (fan) =>
    fan.status === "running" ? <CheckCircle style={{ color: "#4caf50" }} />
      : fan.status === "failed" ? <Error style={{ color: "#f44336" }} />
        : <Stop style={{ color: colors.textSecondary }} />

  const convertSpeed = (value, unit) => unit === "RPM" ? Math.round(value * 18) : value
  const displaySpeed = (fan) => fan.speedUnit === "RPM" ? `${convertSpeed(fan.speed, fan.speedUnit)} RPM` : `${fan.speed} %`
  const convertTemp = (value, unit) => unit === "°F" ? (value * 9 / 5) + 32 : unit === "K" ? value + 273.15 : value
  const displayTemp = (fan) => `${convertTemp(fan.temperature, fan.tempUnit).toFixed(1)}${fan.tempUnit}`

  return (
    <Card
      className={`fan-control-widget ${isDarkMode ? "fan-widget-dark" : ""}`}
      style={{
        background: colors.bg,
        color: colors.text,
        borderRadius: 8,
        border: `1.5px solid ${colors.cardBorder}`,
        boxShadow: isDarkMode ? "0 2px 14px 0 rgba(10, 12, 15, 0.25)" : "0 2px 8px 0 rgba(50,50,93,0.07)",
        minWidth: 320, maxWidth: 420, margin: "auto"
      }}
    >
      <CardContent style={{ background: colors.bg, padding: 18, paddingBottom: 12 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" style={{ color: primaryColor, fontWeight: 700 }}>{title}</Typography>
          {showStats && (
            <Box fontSize={13} color={fan.status === "running" ? "#4caf50" : colors.textSecondary}>
              {getStatusIcon(fan)}
            </Box>
          )}
          {showEditFan && (
            <IconButton size="small" onClick={() => setEditDialog(true)} style={{ color: primaryColor, marginLeft: 4 }}>
              <Settings />
            </IconButton>
          )}
        </Box>
        {/* --- Fan Graphics --- */}
        <Box display="flex" justifyContent="center" alignItems="center" mb={1.5}>
          <div className={`fan-blade ${fan.status === "running" ? "spinning" : ""} ${isDarkMode ? "blade-dark" : ""}`}
            style={{ animationDuration: fan.speed > 0 ? `${2 - fan.speed / 50}s` : "0s" }}>
            <div className="fan-center"></div>
            <div className="blade blade1"></div>
            <div className="blade blade2"></div>
            <div className="blade blade3"></div>
            <div className="blade blade4"></div>
          </div>
        </Box>
        <Typography variant="subtitle1" style={{ fontWeight: 500, marginBottom: 2 }}>{fan.name}</Typography>
        <Box display="flex" gap={2} mb={0.8}>
          <Box display="flex" alignItems="center" gap={0.5}><Thermostat fontSize="small" /><Typography variant="caption" style={{ color: colors.textSecondary }}>{displayTemp(fan)}</Typography></Box>
          <Box display="flex" alignItems="center" gap={0.5}><ElectricBolt fontSize="small" /><Typography variant="caption" style={{ color: colors.textSecondary }}>{fan.power}W</Typography></Box>
        </Box>
        <Box display="flex" gap={2} mb={0.5}>
          <Box display="flex" alignItems="center" gap={0.5}><Schedule fontSize="small" /><Typography variant="caption" style={{ color: colors.textSecondary }}>{fan.runtime.toFixed(1)}h</Typography></Box>
          <Box display="flex" alignItems="center" gap={0.5}><Build fontSize="small" /><Typography variant="caption" style={{ color: colors.textSecondary }}>{Math.max(0, fan.maintenanceHours - fan.runtime).toFixed(0)}h</Typography></Box>
        </Box>
        {showAlarms && fan.alarms.length > 0 && (
          <Box mt={1}>
            {fan.alarms.map((alarm, i) =>
              <Alert key={i} severity={alarm.type} size="small" style={{ marginBottom: 3 }}>{alarm.message}</Alert>
            )}
          </Box>
        )}
        <Box display="flex" alignItems="center" gap={1} mb={1} mt={1}>
          {showStartStop && (
            <>
              <Button size="small" startIcon={<PlayArrow />} onClick={() => handleFanControl("start")} disabled={fan.status === "failed"} variant="outlined" color="success">Start</Button>
              <Button size="small" startIcon={<Stop />} onClick={() => handleFanControl("stop")} variant="outlined" color="error">Stop</Button>
              {showReset && fan.status === "failed" && (
                <Button size="small" onClick={() => handleFanControl("reset")} variant="outlined">Reset</Button>
              )}
            </>
          )}
          {showAutoMode && (
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="caption" style={{ color: colors.textSecondary }}>Auto:</Typography>
              <Switch size="small" checked={fan.autoMode} onChange={handleAutoModeToggle} />
            </Box>
          )}
        </Box>
        {showSpeedSet && (
          <Box mt={0.5}>
            <Typography variant="caption" style={{ color: colors.textSecondary }}>Speed: {displaySpeed(fan)}</Typography>
            <Slider
              value={fan.targetSpeed}
              onChange={(e, value) => handleSpeedChange(value)}
              disabled={fan.status === "failed"}
              min={minSpeed}
              max={fan.speedUnit === "RPM" ? maxSpeedRpm : maxSpeedPercent}
              size="small"
              sx={{
                color: primaryColor,
                '& .MuiSlider-rail': { backgroundColor: isDarkMode ? "#222" : "#eee" },
                height: 4,
              }}
            />
          </Box>
        )}

        {/* --- Fan Config Dialog --- */}
        {showFanConfigDialog && editDialog && (
          <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle style={{ background: colors.surface, color: colors.text }}>
              <Box display="flex" alignItems="center" gap={1}><Tune fontSize="small" />Configure {fan.name}</Box>
            </DialogTitle>
            <DialogContent style={{ background: colors.bg, color: colors.text }}>
              <TextField label="Fan Name" fullWidth value={fan.name} onChange={e => setFan({ ...fan, name: e.target.value })} />
              <Box display="flex" gap={2} mt={2}>
                <TextField label="Maintenance Hours" type="number" fullWidth value={fan.maintenanceHours} onChange={e => setFan({ ...fan, maintenanceHours: Number.parseInt(e.target.value) })} />
                <TextField label="Last Maintenance" type="date" fullWidth value={fan.lastMaintenance} onChange={e => setFan({ ...fan, lastMaintenance: e.target.value })} />
              </Box>
              <Box display="flex" gap={2} mt={2}>
                <FormControl fullWidth>
                  <InputLabel>Speed Unit</InputLabel>
                  <Select value={fan.speedUnit} label="Speed Unit" onChange={e => setFan({ ...fan, speedUnit: e.target.value })}>
                    {speedUnits.map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Temperature Unit</InputLabel>
                  <Select value={fan.tempUnit} label="Temperature Unit" onChange={e => setFan({ ...fan, tempUnit: e.target.value })}>
                    {tempUnits.map(opt => <MenuItem key={opt.value} value={opt.value}><Box display="flex" alignItems="center" gap={1}>{opt.icon}{opt.label}</Box></MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions style={{ background: colors.surface }}>
              <Button onClick={() => setEditDialog(false)} style={{ color: primaryColor }}>Close</Button>
            </DialogActions>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}

export default SingleFanWidget
