"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Grid,
  Box,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Tooltip,
} from "@mui/material"
import { PowerSettingsNew, Add, Delete, Warning, CheckCircle, Error, Refresh } from "@mui/icons-material"
import "../../../styles/widget/fan-grid-widget.css"

const DEFAULT_FANS = [
  {
    id: 1, name: "Exhaust Fan 01", location: "Production Hall A", status: "running",
    rpm: 1450, temperature: 45, runtime: 1250, lastMaintenance: "2024-01-15"
  },
  {
    id: 2, name: "Cooling Fan 02", location: "Production Hall B", status: "stopped",
    rpm: 0, temperature: 25, runtime: 890, lastMaintenance: "2024-02-10"
  },
  {
    id: 3, name: "Ventilation Fan 03", location: "Warehouse", status: "failed",
    rpm: 0, temperature: 65, runtime: 2100, lastMaintenance: "2023-12-20"
  },
  {
    id: 4, name: "Intake Fan 04", location: "Production Hall A", status: "running",
    rpm: 1200, temperature: 38, runtime: 750, lastMaintenance: "2024-02-28"
  },
]

const FanGridWidget = ({ config = {}, onConfigChange }) => {
  const isExternal = Array.isArray(config.fans)
  const [fans, setFans] = useState(isExternal ? config.fans : DEFAULT_FANS)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newFanName, setNewFanName] = useState("")
  const [newFanLocation, setNewFanLocation] = useState("")
  const [systemStatus, setSystemStatus] = useState("normal")

  // Sync state if parent provides fans (real-time)
  useEffect(() => {
    if (isExternal) setFans(config.fans)
  }, [isExternal, config.fans])

  // Simulate real-time updates (if NOT using parent-driven fans)
  useEffect(() => {
    if (isExternal) return
    const interval = setInterval(() => {
      setFans((prevFans) =>
        prevFans.map((fan) => {
          if (fan.status === "running") {
            const tempChange = (Math.random() - 0.5) * 2
            const newTemp = Math.max(30, Math.min(70, fan.temperature + tempChange))
            const rpmChange = (Math.random() - 0.5) * 50
            const newRpm = Math.max(1000, Math.min(1500, fan.rpm + rpmChange))
            if (Math.random() < 0.001) {
              return { ...fan, status: "failed", rpm: 0, temperature: Math.min(80, newTemp + 10) }
            }
            return { ...fan, temperature: newTemp, rpm: newRpm, runtime: fan.runtime + 0.1 }
          }
          return fan
        }),
      )
    }, 1000)
    return () => clearInterval(interval)
  }, [isExternal])

  // Update system status based on fan conditions
  useEffect(() => {
    const runningFans = fans.filter((fan) => fan.status === "running").length
    const failedFans = fans.filter((fan) => fan.status === "failed").length
    const totalFans = fans.length
    if (failedFans > 0) setSystemStatus("alarm")
    else if (runningFans === 0) setSystemStatus("warning")
    else if (runningFans === totalFans) setSystemStatus("optimal")
    else setSystemStatus("normal")
  }, [fans])

  // ----------- Handlers (for internal edit, not for read-only prop mode) ----------
  const toggleFan = (fanId) => {
    if (isExternal) return
    setFans((prevFans) =>
      prevFans.map((fan) => {
        if (fan.id === fanId) {
          if (fan.status === "failed") return fan
          const newStatus = fan.status === "running" ? "stopped" : "running"
          return {
            ...fan,
            status: newStatus,
            rpm: newStatus === "running" ? 1450 : 0,
            temperature: newStatus === "running" ? fan.temperature : 25,
          }
        }
        return fan
      }),
    )
  }

  const resetFan = (fanId) => {
    if (isExternal) return
    setFans((prevFans) =>
      prevFans.map((fan) => {
        if (fan.id === fanId && fan.status === "failed") {
          return { ...fan, status: "stopped", rpm: 0, temperature: 25 }
        }
        return fan
      }),
    )
  }

  const addFan = () => {
    if (isExternal) return
    if (newFanName.trim()) {
      const newFan = {
        id: Math.max(...fans.map((f) => f.id)) + 1,
        name: newFanName.trim(),
        location: newFanLocation.trim() || "Unknown",
        status: "stopped",
        rpm: 0,
        temperature: 25,
        runtime: 0,
        lastMaintenance: new Date().toISOString().split("T")[0],
      }
      setFans([...fans, newFan])
      setNewFanName("")
      setNewFanLocation("")
      setAddDialogOpen(false)
    }
  }

  const deleteFan = (fanId) => {
    if (isExternal) return
    setFans(fans.filter((fan) => fan.id !== fanId))
  }

  const startAllFans = () => {
    if (isExternal) return
    setFans((prevFans) =>
      prevFans.map((fan) => ({
        ...fan,
        status: fan.status === "failed" ? "failed" : "running",
        rpm: fan.status === "failed" ? 0 : 1450,
      })),
    )
  }

  const stopAllFans = () => {
    if (isExternal) return
    setFans((prevFans) =>
      prevFans.map((fan) => ({
        ...fan,
        status: fan.status === "failed" ? "failed" : "stopped",
        rpm: 0,
      })),
    )
  }

  // ------------- Styles -------------
  const getStatusColor = (status) => {
    switch (status) {
      case "running": return "#4caf50"
      case "stopped": return "#757575"
      case "failed": return "#f44336"
      default: return "#757575"
    }
  }
  const getSystemStatusColor = () => {
    switch (systemStatus) {
      case "optimal": return "#4caf50"
      case "normal": return "#2196f3"
      case "warning": return "#ff9800"
      case "alarm": return "#f44336"
      default: return "#757575"
    }
  }
  const runningCount = fans.filter((fan) => fan.status === "running").length
  const failedCount = fans.filter((fan) => fan.status === "failed").length

  // ------------ JSX -------------
  return (
    <Card className="fan-grid-widget">
      <CardContent>
        {/* Header */}
        <Box className="widget-header">
          <Box>
            <Typography variant="h6" className="widget-title">Fan Control Grid</Typography>
            <Typography variant="body2" color="textSecondary">Industrial Ventilation System</Typography>
          </Box>
          <Box className="header-controls">
            <Chip
              label={`System: ${systemStatus.toUpperCase()}`}
              style={{
                backgroundColor: getSystemStatusColor(),
                color: "white",
                fontWeight: "bold",
              }}
            />
          </Box>
        </Box>
        {/* System Overview */}
        <Box className="system-overview">
          <Box className="overview-stats">
            <Box className="stat-item">
              <Typography variant="h4" color="primary">{fans.length}</Typography>
              <Typography variant="caption">Total Fans</Typography>
            </Box>
            <Box className="stat-item">
              <Typography variant="h4" style={{ color: "#4caf50" }}>{runningCount}</Typography>
              <Typography variant="caption">Running</Typography>
            </Box>
            <Box className="stat-item">
              <Typography variant="h4" style={{ color: "#f44336" }}>{failedCount}</Typography>
              <Typography variant="caption">Failed</Typography>
            </Box>
          </Box>
          <Box className="system-controls">
            <Button variant="contained" color="success" onClick={startAllFans} startIcon={<PowerSettingsNew />} size="small">Start All</Button>
            <Button variant="contained" color="error" onClick={stopAllFans} startIcon={<PowerSettingsNew />} size="small">Stop All</Button>
            <Button variant="outlined" onClick={() => setAddDialogOpen(true)} startIcon={<Add />} size="small">Add Fan</Button>
          </Box>
        </Box>
        {/* Fan Grid */}
        <Grid container spacing={2} className="fan-grid">
          {fans.map((fan) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={fan.id}>
              <Card className={`fan-card fan-${fan.status}`}>
                <CardContent className="fan-card-content">
                  {/* Fan Visual */}
                  <Box className="fan-visual">
                    <div className={`fan-container ${fan.status}`}>
                      <div className={`fan-blades ${fan.status === "running" ? "spinning" : ""}`}>
                        <div className="blade"></div>
                        <div className="blade"></div>
                        <div className="blade"></div>
                        <div className="blade"></div>
                        <div className="blade"></div>
                        <div className="blade"></div>
                      </div>
                      <div className="fan-center"></div>
                    </div>
                    {/* Status Badge */}
                    <Box className="status-badge">
                      {fan.status === "running" && <CheckCircle style={{ color: "#4caf50" }} />}
                      {fan.status === "stopped" && <PowerSettingsNew style={{ color: "#757575" }} />}
                      {fan.status === "failed" && <Error style={{ color: "#f44336" }} />}
                    </Box>
                  </Box>
                  {/* Fan Info */}
                  <Box className="fan-info">
                    <Typography variant="subtitle2" className="fan-name">{fan.name}</Typography>
                    <Typography variant="caption" color="textSecondary">{fan.location}</Typography>
                    <Chip
                      label={fan.status.toUpperCase()}
                      size="small"
                      style={{
                        backgroundColor: getStatusColor(fan.status),
                        color: "white",
                        fontSize: "10px",
                        height: "20px",
                        marginTop: "4px",
                      }}
                    />
                  </Box>
                  {/* Parameters */}
                  <Box className="fan-parameters">
                    <Box className="parameter">
                      <Typography variant="caption">RPM</Typography>
                      <Typography variant="body2" fontWeight="bold">{Math.round(fan.rpm)}</Typography>
                    </Box>
                    <Box className="parameter">
                      <Typography variant="caption">Temp</Typography>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        style={{
                          color: fan.temperature > 60 ? "#f44336" : fan.temperature > 50 ? "#ff9800" : "#4caf50",
                        }}
                      >
                        {Math.round(fan.temperature)}°C
                      </Typography>
                    </Box>
                  </Box>
                  {/* Controls */}
                  <Box className="fan-controls">
                    {fan.status === "failed" ? (
                      <Tooltip title="Reset Fan">
                        <IconButton onClick={() => resetFan(fan.id)} color="warning" size="small"><Refresh /></IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title={fan.status === "running" ? "Stop Fan" : "Start Fan"}>
                        <IconButton onClick={() => toggleFan(fan.id)} style={{ color: getStatusColor(fan.status) }} size="small"><PowerSettingsNew /></IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete Fan">
                      <IconButton onClick={() => deleteFan(fan.id)} color="error" size="small"><Delete /></IconButton>
                    </Tooltip>
                  </Box>
                  {/* Alarms */}
                  {(fan.temperature > 60 || fan.status === "failed") && (
                    <Box className="fan-alarms">
                      {fan.temperature > 60 && (
                        <Chip icon={<Warning />} label="HIGH TEMP" size="small" color="warning" variant="outlined" />
                      )}
                      {fan.status === "failed" && (
                        <Chip icon={<Error />} label="FAULT" size="small" color="error" variant="outlined" />
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        {/* Add Fan Dialog */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
          <DialogTitle>Add New Fan</DialogTitle>
          <DialogContent>
            <TextField autoFocus margin="dense" label="Fan Name" fullWidth variant="outlined"
              value={newFanName} onChange={(e) => setNewFanName(e.target.value)} placeholder="e.g., Exhaust Fan 05"/>
            <TextField margin="dense" label="Location" fullWidth variant="outlined"
              value={newFanLocation} onChange={(e) => setNewFanLocation(e.target.value)} placeholder="e.g., Production Hall C"/>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={addFan} variant="contained">Add Fan</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default FanGridWidget
