"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Card, Typography, Slider, InputNumber, Button, Tag, Tooltip, Modal, Select, Switch, Divider, Space, message,
} from "antd"
import {
  LockOutlined, UnlockOutlined, SettingOutlined, WarningOutlined, CheckCircleOutlined, CloseCircleOutlined, SlidersOutlined, AppstoreAddOutlined,
  DashboardOutlined, ThunderboltOutlined, FireOutlined, ExperimentOutlined, PercentageOutlined,
  CloudOutlined, PoweroffOutlined
} from "@ant-design/icons"
import { useTheme } from "../../theme/ThemeProvider"

// --- UNIT options for dropdown ---
const UNIT_OPTIONS = [
  { value: "%", label: "Percentage (%)" },
  { value: "°C", label: "Temperature (°C)" },
  { value: "°F", label: "Temperature (°F)" },
  { value: "L", label: "Level (L)" },
  { value: "m", label: "Length (m)" },
  { value: "V", label: "Voltage (V)" },
  { value: "A", label: "Current (A)" },
]

// --- Build MQTT command payload ---
function buildFanLevelCommandPayload(level) {
  return { command: "set_fan_level", level }
}

// --- Slider scale marks (numbered bar) ---
function getScaleMarks(min, max, unit, interval = 5) {
  let marks = {}
  for (let v = min; v <= max; v += interval) {
    marks[v] = {
      style: { fontWeight: v === min || v === max ? 700 : 400, color: "#888" },
      label: <span>{v}{unit}</span>
    }
  }
  if (!marks[max]) {
    marks[max] = {
      style: { fontWeight: 700, color: "#333" },
      label: <span>{max}{unit}</span>
    }
  }
  return marks
}

// --- Dynamic icon selection by unit ---
function getIconForUnit(unit) {
  switch (unit) {
    case "%": return <PercentageOutlined style={{ color: "#52c41a" }} />;
    case "°C": return <FireOutlined style={{ color: "#ff7043" }} />;
    case "°F": return <FireOutlined style={{ color: "#ff7043" }} />;
    case "L": return <CloudOutlined style={{ color: "#1890ff" }} />;
    case "V": return <ThunderboltOutlined style={{ color: "#faad14" }} />;
    case "A": return <PoweroffOutlined style={{ color: "#faad14" }} />;
    case "m": return <DashboardOutlined style={{ color: "#722ed1" }} />;
    default: return <AppstoreAddOutlined style={{ color: "#1976d2" }} />;
  }
}

const SliderControlWidget = ({
  widget,
  data = [],
  dataKeys = ["value"],
  telemetryOut = [],
  sendMqttCommand,
  isMqttSending,
}) => {
  // Theme context
  const { isDarkMode, primaryColor } = useTheme()
  const config = widget?.config || {}
  const [title] = useState(config.title || "Device Control")
  const outputKey = telemetryOut?.[0] || "setpoint"

  // Core state
  const [unit, setUnit] = useState(config.units || "%")
  const [minValue, setMinValue] = useState(config.minValue ?? 0)
  const [maxValue, setMaxValue] = useState(config.maxValue ?? 100)
  const [step, setStep] = useState(config.step || 1)
  const [precision, setPrecision] = useState(config.precision || 1)
  const [enableRange, setEnableRange] = useState(config.enableRange || false)
  const [presetValues, setPresetValues] = useState(config.presets || [0, 25, 50, 75, 100])

  // Value from data
  const liveValue =
    Array.isArray(data) && data.length && typeof data[data.length - 1][dataKeys[0]] === "number"
      ? data[data.length - 1][dataKeys[0]]
      : config.defaultValue || minValue

  const [targetValue, setTargetValue] = useState(liveValue)
  const [rangeValue, setRangeValue] = useState([minValue, maxValue])
  useEffect(() => {
    setTargetValue(liveValue)
    setRangeValue([minValue, maxValue])
  }, [liveValue, minValue, maxValue])

  // UI state
  const [isLocked, setIsLocked] = useState(false)
  const [isConnected] = useState(true) // For now always online
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [manualInput, setManualInput] = useState("")
  const [showManualInput, setShowManualInput] = useState(false)
  const [notification, setNotification] = useState("")
  const [notificationType, setNotificationType] = useState("info")
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date())

  // --- Slider Change Handlers ---
  const handleSliderChange = (value) => {
    if (isLocked) {
      setNotification("Control is locked")
      setNotificationType("warning")
      return
    }
    if (enableRange) setRangeValue(value)
    else setTargetValue(value)
  }

  const handleSliderAfterChange = (value) => {
    if (isLocked) return
    if (enableRange) {
      setRangeValue(value)
      if (typeof sendMqttCommand === "function") {
        sendMqttCommand(buildFanLevelCommandPayload(value[0]))
        message.success(`Range min set as fan level: ${value[0]}`)
      }
    } else {
      setTargetValue(value)
      if (typeof sendMqttCommand === "function") {
        sendMqttCommand(buildFanLevelCommandPayload(value))
        message.success(`Fan level set: ${value}`)
      }
    }
    setLastUpdateTime(new Date())
  }

  const handleManualInput = () => {
    const value = Number.parseFloat(manualInput)
    if (isNaN(value)) {
      setNotification("Invalid input value")
      setNotificationType("error")
      return
    }
    if (value < minValue || value > maxValue) {
      setNotification(`Value must be between ${minValue} and ${maxValue}`)
      setNotificationType("error")
      return
    }
    handleSliderAfterChange(value)
    setManualInput("")
    setShowManualInput(false)
  }

  const handlePresetClick = (preset) => {
    if (isLocked) {
      setNotification("Control is locked")
      setNotificationType("warning")
      return
    }
    handleSliderAfterChange(preset)
  }

  // Settings dialog handlers
  const handleUnitChange = (val) => setUnit(val)
  const handleRangeToggle = (checked) => setEnableRange(checked)
  const handleMinValueChange = (val) => setMinValue(Number(val))
  const handleMaxValueChange = (val) => setMaxValue(Number(val))
  const handleStepChange = (val) => setStep(Number(val))
  const handlePrecisionChange = (val) => setPrecision(Number(val))

  // Theme styles
  const bgColor = isDarkMode ? "#18181c" : "#fff"
  const cardBorder = isDarkMode ? "#222" : "#f0f0f0"
  const textColor = isDarkMode ? "#fff" : "#222"
  const subTextColor = isDarkMode ? "#ccc" : "#888"
  const sliderColor = primaryColor

  // --- Memoized icon
  const sliderIcon = useMemo(() => getIconForUnit(unit), [unit])

  // --- Render ---
  return (
    <Card
      style={{
        background: bgColor,
        borderColor: cardBorder,
        color: textColor,
        height: "100%",
        minWidth: 320,
      }}
      bodyStyle={{ padding: 24, display: "flex", flexDirection: "column", minHeight: 420 }}
      bordered
      headStyle={{ background: bgColor, color: textColor }}
      title={
        <Space>
          {sliderIcon}
          <span style={{ color: textColor }}>{title}</span>
          <Tag
            icon={isLocked ? <LockOutlined /> : <UnlockOutlined />}
            color={isLocked ? "warning" : "success"}
            style={{ marginLeft: 8 }}
          >
            {isLocked ? "Locked" : "Active"}
          </Tag>
        </Space>
      }
      extra={
        <Space>
          <Tooltip title={isLocked ? "Unlock Control" : "Lock Control"}>
            <Button
              type="default"
              shape="circle"
              icon={isLocked ? <UnlockOutlined /> : <LockOutlined />}
              onClick={() => setIsLocked((v) => !v)}
              style={{ color: isLocked ? "#e8b100" : undefined }}
            />
          </Tooltip>
          <Tooltip title="Settings">
            <Button
              type="default"
              shape="circle"
              icon={<SettingOutlined />}
              onClick={() => setSettingsOpen(true)}
            />
          </Tooltip>
        </Space>
      }
    >
      {/* Value Display */}
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        {!enableRange ? (
          <>
            <Typography.Title level={2} style={{ margin: 0, color: sliderColor }}>
              {targetValue?.toFixed(precision)}{" "}
              <span style={{ fontSize: 20, color: subTextColor }}>{unit}</span>
            </Typography.Title>
            <Typography.Text type="secondary" style={{ color: subTextColor }}>Current Value</Typography.Text>
          </>
        ) : (
          <>
            <Typography.Title level={4} style={{ margin: 0, color: sliderColor }}>
              {rangeValue[0]?.toFixed(precision)}{unit} - {rangeValue[1]?.toFixed(precision)}{unit}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ color: subTextColor }}>Current Range</Typography.Text>
          </>
        )}
      </div>

      {/* Slider */}
      <div style={{ marginBottom: 24 }}>
        <Slider
          value={enableRange ? rangeValue : targetValue}
          onChange={handleSliderChange}
          onAfterChange={handleSliderAfterChange}
          min={minValue}
          max={maxValue}
          step={step}
          range={enableRange}
          marks={getScaleMarks(minValue, maxValue, unit, Math.max(5, Math.round((maxValue - minValue) / 10)))}
          tooltip={{ open: true, placement: "top", formatter: v => `${v}${unit}` }}
          disabled={isLocked}
          trackStyle={[{ backgroundColor: sliderColor }]}
          handleStyle={[{ borderColor: sliderColor, background: sliderColor }]}
          style={{ color: sliderColor }}
        />
      </div>

      {/* Presets */}
      {!enableRange && (
        <div style={{ marginBottom: 18 }}>
          <Typography.Text type="secondary" style={{ color: subTextColor }}>Quick Presets:</Typography.Text>
          <Space style={{ marginTop: 8 }}>
            {presetValues.map((preset, i) => (
              <Button
                key={i}
                size="small"
                type={targetValue === preset ? "primary" : "default"}
                style={{ color: targetValue === preset ? "#fff" : undefined, background: targetValue === preset ? sliderColor : undefined, borderColor: sliderColor }}
                onClick={() => handlePresetClick(preset)}
                disabled={isLocked}
              >
                {preset}{unit}
              </Button>
            ))}
          </Space>
        </div>
      )}

      {/* Manual Input */}
      {!enableRange && (
        <div style={{ marginBottom: 18 }}>
          <Space>
            <Button
              type="default"
              size="small"
              onClick={() => setShowManualInput(!showManualInput)}
              icon={<SlidersOutlined />}
              disabled={isLocked}
            >Manual Input</Button>
            {showManualInput && (
              <>
                <InputNumber
                  size="small"
                  value={manualInput}
                  onChange={val => setManualInput(val)}
                  placeholder={`${minValue}-${maxValue}`}
                  min={minValue}
                  max={maxValue}
                  step={step}
                  style={{ width: 90 }}
                  addonAfter={unit}
                />
                <Button type="primary" size="small" onClick={handleManualInput}>Apply</Button>
              </>
            )}
          </Space>
        </div>
      )}

      {/* Last Update */}
      <div style={{ marginTop: "auto" }}>
        <Divider style={{ margin: "16px 0" }} />
        <Space size="large" style={{ width: "100%", justifyContent: "space-between" }}>
          <div>
            <Typography.Text type="secondary" style={{ color: subTextColor, fontSize: 12 }}>Last Update</Typography.Text>
            <div style={{ fontSize: 14 }}>{lastUpdateTime.toLocaleTimeString()}</div>
          </div>
          <div>
            <Typography.Text type="secondary" style={{ color: subTextColor, fontSize: 12 }}>Connection</Typography.Text>
            <div>
              <Tag icon={isConnected ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={isConnected ? "success" : "error"}>
                {isConnected ? "Online" : "Offline"}
              </Tag>
            </div>
          </div>
        </Space>
      </div>

      {/* Settings Modal */}
      <Modal
        title={<><SettingOutlined /> Control Settings</>}
        open={settingsOpen}
        onCancel={() => setSettingsOpen(false)}
        onOk={() => setSettingsOpen(false)}
        okText="Close"
        okButtonProps={{ style: { background: sliderColor } }}
        bodyStyle={{ background: bgColor, color: textColor }}
        style={{ top: 80 }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div>
            <Switch checked={enableRange} onChange={handleRangeToggle} /> <span>Enable Range Selection</span>
          </div>
          <Space>
            <div>
              <div style={{ marginBottom: 2 }}>Min Value</div>
              <InputNumber value={minValue} min={-1000} max={maxValue - 1} onChange={handleMinValueChange} addonAfter={unit} />
            </div>
            <div>
              <div style={{ marginBottom: 2 }}>Max Value</div>
              <InputNumber value={maxValue} min={minValue + 1} max={1000} onChange={handleMaxValueChange} addonAfter={unit} />
            </div>
            <div>
              <div style={{ marginBottom: 2 }}>Step</div>
              <InputNumber value={step} min={1} max={100} onChange={handleStepChange} />
            </div>
            <div>
              <div style={{ marginBottom: 2 }}>Precision</div>
              <InputNumber value={precision} min={0} max={4} onChange={handlePrecisionChange} />
            </div>
          </Space>
          <div>
            <div style={{ marginBottom: 4 }}>Unit</div>
            <Select value={unit} style={{ width: 160 }} onChange={handleUnitChange}>
              {UNIT_OPTIONS.map(u => <Select.Option key={u.value} value={u.value}>{u.label}</Select.Option>)}
            </Select>
          </div>
        </Space>
      </Modal>
    </Card>
  )
}

export default SliderControlWidget


// "use client"

// import { useState, useEffect, useRef } from "react"
// import {
//   Card, CardContent, Typography, Box, Slider, TextField, Button, IconButton,
//   Chip, Dialog, DialogTitle, DialogContent, DialogActions, Switch,
//   FormControlLabel, Alert, Tooltip, LinearProgress, Divider, Grid,
//   InputAdornment, Snackbar, MenuItem, Select
// } from "@mui/material"
// import { Settings, Stop, Warning, CheckCircle, Error, Lock, LockOpen, TrendingUp, Tune } from "@mui/icons-material"
// import { useTheme as useAppTheme } from "../../theme/ThemeProvider" // <-- Change path to your ThemeProvider file

// const LOG_PREFIX = "[SliderControlWidget]"

// const UNIT_OPTIONS = [
//   { value: "%", label: "Percentage (%)" },
//   { value: "°C", label: "Temperature (°C)" },
//   { value: "°F", label: "Temperature (°F)" },
//   { value: "L", label: "Level (L)" },
//   { value: "m", label: "Length (m)" },
//   { value: "V", label: "Voltage (V)" },
//   { value: "A", label: "Current (A)" },
// ]

// function buildFanLevelCommandPayload(level) {
//   return { command: "set_fan_level", level }
// }

// function getScaleMarks(min, max, unit, step, interval = 5, darkMode = false) {
//   const markColor = darkMode ? "#eee" : "#888"
//   const boldColor = darkMode ? "#fff" : "#333"
//   const marks = []
//   for (let v = min; v <= max; v += interval) {
//     marks.push({
//       value: v,
//       label: (
//         <span style={{
//           fontWeight: v === min || v === max ? 700 : 400,
//           color: v === min || v === max ? boldColor : markColor,
//           fontSize: "0.8rem"
//         }}>
//           {v}{unit}
//         </span>
//       )
//     })
//   }
//   if (marks[marks.length - 1]?.value !== max) {
//     marks.push({
//       value: max,
//       label: <span style={{ fontWeight: 700, color: boldColor }}>{max}{unit}</span>
//     })
//   }
//   return marks
// }

// const SliderControlWidget = ({
//   widget,
//   onConfigChange,
//   devices = [],
//   data = [],
//   dataKeys = ["value"],
//   telemetryOut = [],
//   sendMqttCommand,
//   isMqttSending,
//   ...props
// }) => {
//   // --- Theme (from ThemeProvider) ---
//   const { isDarkMode, primaryColor } = useAppTheme()

//   // Widget configuration
//   const config = widget?.config || {}
//   const [title] = useState(config.title || "Device Control")
//   const [deviceId] = useState(config.deviceId || config.dataSource?.deviceId || null)
//   const outputKey = Array.isArray(telemetryOut) && telemetryOut.length > 0 ? telemetryOut[0] : "setpoint"

//   // --- UNIT/RANGE/STEP State ---
//   const [unit, setUnit] = useState(config.units || "%")
//   const [minValue, setMinValue] = useState(config.minValue ?? 0)
//   const [maxValue, setMaxValue] = useState(config.maxValue ?? 100)
//   const [step, setStep] = useState(config.step || 1)
//   const [enableRange, setEnableRange] = useState(config.enableRange || false)
//   const [precision, setPrecision] = useState(config.precision || 1)

//   // Live value from data/dataKeys
//   const liveValue =
//     Array.isArray(data) && data.length && Array.isArray(dataKeys) && dataKeys.length &&
//     typeof data[data.length - 1][dataKeys[0]] === "number"
//       ? data[data.length - 1][dataKeys[0]]
//       : config.defaultValue || minValue

//   // --- Value State ---
//   const [currentValue, setCurrentValue] = useState(liveValue)
//   const [targetValue, setTargetValue] = useState(liveValue)
//   const [rangeValue, setRangeValue] = useState([minValue, maxValue])
//   useEffect(() => {
//     setCurrentValue(liveValue)
//     setTargetValue(liveValue)
//     setRangeValue([minValue, maxValue])
//   }, [liveValue, minValue, maxValue])

//   // --- Other UI States ---
//   const [isActive, setIsActive] = useState(false)
//   const [isLocked, setIsLocked] = useState(false)
//   const [isConnected, setIsConnected] = useState(true)
//   const [lastUpdateTime, setLastUpdateTime] = useState(new Date())
//   const [settingsOpen, setSettingsOpen] = useState(false)
//   const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
//   const [pendingValue, setPendingValue] = useState(null)
//   const [manualInput, setManualInput] = useState("")
//   const [showManualInput, setShowManualInput] = useState(false)
//   const [presetValues, setPresetValues] = useState(config.presets || [0, 25, 50, 75, 100])
//   const [history, setHistory] = useState([])
//   const [notification, setNotification] = useState({ open: false, message: "", severity: "info" })
//   const [autoMode, setAutoMode] = useState(false)
//   const [rampRate] = useState(config.rampRate || 5)
//   const [enableSafetyLimits] = useState(config.enableSafetyLimits !== false)
//   const [requireConfirmation] = useState(config.requireConfirmation !== false)
//   const [criticalThreshold] = useState(config.criticalThreshold || 80)
//   const [enableLogging] = useState(config.enableLogging !== false)
//   const [safetyLimits] = useState(config.safetyLimits || { min: 10, max: 90 })
//   const rampIntervalRef = useRef(null)
//   const historyIntervalRef = useRef(null)

//   // --- Notifications ---
//   const showNotification = (message, severity = "info") => {
//     setNotification({ open: true, message, severity })
//     setTimeout(() => setNotification({ ...notification, open: false }), 3000)
//   }

//   // --- Slider Change Handlers ---
//   const handleSliderChange = (event, newValue) => {
//     if (isLocked) {
//       showNotification("Control is locked", "warning")
//       return
//     }
//     if (enableRange) {
//       setRangeValue(newValue)
//     } else {
//       setTargetValue(newValue)
//     }
//   }

//   const handleSliderCommit = (event, newValue) => {
//     if (isLocked) return
//     // No feedback waiting, just set and send!
//     if (enableRange) {
//       setRangeValue(newValue)
//       if (typeof sendMqttCommand === "function") {
//         const payload = buildFanLevelCommandPayload(newValue[0])
//         sendMqttCommand(payload)
//         showNotification(`Range min set as fan level: ${newValue[0]}`, "info")
//       }
//     } else {
//       setTargetValue(newValue)
//       if (typeof sendMqttCommand === "function") {
//         const payload = buildFanLevelCommandPayload(newValue)
//         sendMqttCommand(payload)
//         showNotification(`Fan level set: ${newValue}`, "info")
//       }
//     }
//     setLastUpdateTime(new Date())
//     setIsActive(false)
//   }

//   // --- Manual Input Handler ---
//   const handleManualInput = () => {
//     const value = Number.parseFloat(manualInput)
//     if (isNaN(value)) {
//       showNotification("Invalid input value", "error")
//       return
//     }
//     if (value < minValue || value > maxValue) {
//       showNotification(`Value must be between ${minValue} and ${maxValue}`, "error")
//       return
//     }
//     handleSliderCommit(null, value)
//     setManualInput("")
//     setShowManualInput(false)
//   }

//   // --- Preset Handler ---
//   const handlePresetClick = (presetValue) => {
//     if (isLocked) {
//       showNotification("Control is locked", "warning")
//       return
//     }
//     handleSliderCommit(null, presetValue)
//   }

//   // --- Settings Handlers (unit/range/range set) ---
//   const handleUnitChange = (e) => setUnit(e.target.value)
//   const handleRangeToggle = () => setEnableRange((prev) => !prev)
//   const handleMinValueChange = (e) => setMinValue(Number(e.target.value))
//   const handleMaxValueChange = (e) => setMaxValue(Number(e.target.value))
//   const handleStepChange = (e) => setStep(Number(e.target.value))
//   const handlePrecisionChange = (e) => setPrecision(Number(e.target.value))

//   // --- UI Render ---
//   return (
//     <Card
//       sx={{
//         height: "100%",
//         display: "flex",
//         flexDirection: "column",
//         background: isDarkMode ? "#1f1f1f" : "#fff",
//         color: isDarkMode ? "#fff" : "#111",
//         borderColor: isDarkMode ? "#444" : "#eee"
//       }}
//       variant="outlined"
//     >
//       {/* Header */}
//       <Box p={2} borderBottom={isDarkMode ? "1px solid #333" : "1px solid #e0e0e0"}>
//         <Box display="flex" justifyContent="space-between" alignItems="center">
//           <Box>
//             <Typography variant="h6" color={isDarkMode ? "#fff" : "#222"}>{title}</Typography>
//             <Box display="flex" alignItems="center" gap={1} mt={0.5}>
//               <Chip
//                 size="small"
//                 label={isConnected ? "Ready" : "Disconnected"}
//                 color={isConnected ? "success" : "error"}
//                 icon={isConnected ? <CheckCircle /> : <Error />}
//                 sx={{
//                   background: isDarkMode ? "#263238" : "#f5f5f5",
//                   color: isDarkMode ? "#fff" : "#333"
//                 }}
//               />
//               {isLocked && <Chip size="small" label="LOCKED" color="warning" icon={<Lock />} />}
//             </Box>
//           </Box>
//           <Box display="flex" gap={1}>
//             <Tooltip title={isLocked ? "Unlock Control" : "Lock Control"}>
//               <IconButton onClick={() => setIsLocked(!isLocked)} color={isLocked ? "warning" : "default"}>
//                 {isLocked ? <Lock /> : <LockOpen />}
//               </IconButton>
//             </Tooltip>
//             <Tooltip title="Settings">
//               <IconButton onClick={() => setSettingsOpen(true)}>
//                 <Settings />
//               </IconButton>
//             </Tooltip>
//           </Box>
//         </Box>
//       </Box>

//       {/* Main Control Area */}
//       <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
//         {/* Value Display */}
//         <Box textAlign="center" mb={2}>
//           {!enableRange ? (
//             <>
//               <Typography variant="h3" color={isDarkMode ? primaryColor : "primary"}>
//                 {targetValue?.toFixed(precision)}
//                 <Typography component="span" variant="h5" color={isDarkMode ? "#bbb" : "textSecondary"}>{unit}</Typography>
//               </Typography>
//               <Typography variant="body2" color={isDarkMode ? "#aaa" : "textSecondary"}>
//                 Current Value
//               </Typography>
//             </>
//           ) : (
//             <>
//               <Typography variant="h4" color={isDarkMode ? primaryColor : "primary"}>
//                 {rangeValue[0].toFixed(precision)}{unit} - {rangeValue[1].toFixed(precision)}{unit}
//               </Typography>
//               <Typography variant="body2" color={isDarkMode ? "#aaa" : "textSecondary"}>
//                 Current Range
//               </Typography>
//             </>
//           )}
//         </Box>

//         {/* Main Slider with scale */}
//         <Box mb={2}>
//           <Slider
//             value={enableRange ? rangeValue : targetValue}
//             onChange={handleSliderChange}
//             onChangeCommitted={handleSliderCommit}
//             min={minValue}
//             max={maxValue}
//             step={step}
//             disabled={isLocked || !isConnected}
//             valueLabelDisplay="auto"
//             marks={getScaleMarks(minValue, maxValue, unit, step, Math.max(5, Math.round((maxValue - minValue) / 10)), isDarkMode)}
//             sx={{
//               color: primaryColor,
//               "& .MuiSlider-markLabel": {
//                 fontSize: "0.85rem",
//                 color: isDarkMode ? "#eee" : "#888"
//               },
//               "& .MuiSlider-mark": {
//                 backgroundColor: isDarkMode ? "#bbb" : "currentColor"
//               },
//               "& .MuiSlider-valueLabel": {
//                 fontWeight: 700,
//                 fontSize: "1.1rem",
//                 color: isDarkMode ? "#fff" : "#333"
//               }
//             }}
//           />
//         </Box>

//         {/* Preset Values */}
//         {!enableRange && (
//           <Box mb={2}>
//             <Typography variant="subtitle2" gutterBottom>
//               Quick Presets
//             </Typography>
//             <Box display="flex" gap={1} flexWrap="wrap">
//               {presetValues.map((preset, index) => (
//                 <Button
//                   key={index}
//                   variant={targetValue === preset ? "contained" : "outlined"}
//                   size="small"
//                   onClick={() => handlePresetClick(preset)}
//                   disabled={isLocked || !isConnected}
//                   sx={{
//                     color: isDarkMode && targetValue !== preset ? "#fff" : undefined,
//                     borderColor: isDarkMode ? "#444" : undefined,
//                   }}
//                 >
//                   {preset}
//                   {unit}
//                 </Button>
//               ))}
//             </Box>
//           </Box>
//         )}

//         {/* Manual Input */}
//         {!enableRange && (
//           <Box mb={2}>
//             <Box display="flex" alignItems="center" gap={1}>
//               <Button
//                 variant="outlined"
//                 size="small"
//                 onClick={() => setShowManualInput(!showManualInput)}
//                 disabled={isLocked || !isConnected}
//                 sx={{
//                   color: isDarkMode ? "#fff" : undefined,
//                   borderColor: isDarkMode ? "#444" : undefined,
//                 }}
//               >
//                 Manual Input
//               </Button>
//               {showManualInput && (
//                 <>
//                   <TextField
//                     size="small"
//                     value={manualInput}
//                     onChange={(e) => setManualInput(e.target.value)}
//                     placeholder={`${minValue}-${maxValue}`}
//                     InputProps={{
//                       endAdornment: <InputAdornment position="end">{unit}</InputAdornment>,
//                     }}
//                     sx={{
//                       width: 120,
//                       input: { color: isDarkMode ? "#fff" : undefined },
//                       "& .MuiOutlinedInput-root": {
//                         "& fieldset": {
//                           borderColor: isDarkMode ? "#444" : undefined
//                         }
//                       }
//                     }}
//                   />
//                   <Button variant="contained" size="small" onClick={handleManualInput} sx={{
//                     background: primaryColor,
//                     color: "#fff"
//                   }}>
//                     Apply
//                   </Button>
//                 </>
//               )}
//             </Box>
//           </Box>
//         )}

//         {/* Status Information */}
//         <Box mt="auto">
//           <Divider sx={{ mb: 2, borderColor: isDarkMode ? "#333" : "#eee" }} />
//           <Grid container spacing={2}>
//             <Grid item xs={6}>
//               <Typography variant="caption" color={isDarkMode ? "#aaa" : "textSecondary"}>
//                 Last Update
//               </Typography>
//               <Typography variant="body2" color={isDarkMode ? "#fff" : "textPrimary"}>{lastUpdateTime.toLocaleTimeString()}</Typography>
//             </Grid>
//             <Grid item xs={6}>
//               <Typography variant="caption" color={isDarkMode ? "#aaa" : "textSecondary"}>
//                 Connection
//               </Typography>
//               <Typography variant="body2" color={isConnected ? "success.main" : isDarkMode ? "#f44336" : "error.main"}>
//                 {isConnected ? "Online" : "Offline"}
//               </Typography>
//             </Grid>
//           </Grid>
//         </Box>
//       </CardContent>

//       {/* Settings Dialog */}
//       <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
//         <DialogTitle>
//           <Box display="flex" alignItems="center" gap={1}>
//             <Tune fontSize="small" /> Control Settings
//           </Box>
//         </DialogTitle>
//         <DialogContent sx={{ background: isDarkMode ? "#212121" : "#fff" }}>
//           <Box display="flex" flexDirection="column" gap={2} pt={1}>
//             <FormControlLabel
//               control={<Switch checked={enableRange} onChange={handleRangeToggle} />}
//               label="Enable Range Selection"
//             />
//             <Box display="flex" gap={2}>
//               <TextField
//                 label="Min Value"
//                 type="number"
//                 size="small"
//                 value={minValue}
//                 onChange={handleMinValueChange}
//                 InputProps={{
//                   endAdornment: <InputAdornment position="end">{unit}</InputAdornment>
//                 }}
//                 sx={{
//                   input: { color: isDarkMode ? "#fff" : undefined },
//                   "& .MuiOutlinedInput-root": {
//                     "& fieldset": { borderColor: isDarkMode ? "#444" : undefined }
//                   }
//                 }}
//               />
//               <TextField
//                 label="Max Value"
//                 type="number"
//                 size="small"
//                 value={maxValue}
//                 onChange={handleMaxValueChange}
//                 InputProps={{
//                   endAdornment: <InputAdornment position="end">{unit}</InputAdornment>
//                 }}
//                 sx={{
//                   input: { color: isDarkMode ? "#fff" : undefined },
//                   "& .MuiOutlinedInput-root": {
//                     "& fieldset": { borderColor: isDarkMode ? "#444" : undefined }
//                   }
//                 }}
//               />
//               <TextField
//                 label="Step"
//                 type="number"
//                 size="small"
//                 value={step}
//                 onChange={handleStepChange}
//                 sx={{
//                   input: { color: isDarkMode ? "#fff" : undefined },
//                   "& .MuiOutlinedInput-root": {
//                     "& fieldset": { borderColor: isDarkMode ? "#444" : undefined }
//                   }
//                 }}
//               />
//               <TextField
//                 label="Precision"
//                 type="number"
//                 size="small"
//                 value={precision}
//                 onChange={handlePrecisionChange}
//                 sx={{
//                   input: { color: isDarkMode ? "#fff" : undefined },
//                   "& .MuiOutlinedInput-root": {
//                     "& fieldset": { borderColor: isDarkMode ? "#444" : undefined }
//                   }
//                 }}
//               />
//             </Box>
//             <Box>
//               <Typography variant="subtitle2" sx={{ mb: 0.5, color: isDarkMode ? "#eee" : "#333" }}>Unit</Typography>
//               <Select
//                 size="small"
//                 value={unit}
//                 onChange={handleUnitChange}
//                 sx={{
//                   color: isDarkMode ? "#fff" : undefined,
//                   "& .MuiOutlinedInput-notchedOutline": {
//                     borderColor: isDarkMode ? "#444" : undefined
//                   }
//                 }}
//               >
//                 {UNIT_OPTIONS.map(u => (
//                   <MenuItem value={u.value} key={u.value}>{u.label}</MenuItem>
//                 ))}
//               </Select>
//             </Box>
//           </Box>
//         </DialogContent>
//         <DialogActions sx={{ background: isDarkMode ? "#232323" : "#fff" }}>
//           <Button onClick={() => setSettingsOpen(false)} sx={{
//             color: isDarkMode ? "#fff" : undefined
//           }}>Close</Button>
//         </DialogActions>
//       </Dialog>

//       {/* Notification Snackbar */}
//       <Snackbar
//         open={notification.open}
//         autoHideDuration={4000}
//         onClose={() => setNotification({ ...notification, open: false })}
//         anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
//       >
//         <Alert
//           onClose={() => setNotification({ ...notification, open: false })}
//           severity={notification.severity}
//           sx={{
//             background: isDarkMode ? "#232323" : undefined,
//             color: isDarkMode ? "#fff" : undefined,
//             borderColor: isDarkMode ? "#444" : undefined
//           }}
//         >
//           {notification.message}
//         </Alert>
//       </Snackbar>
//     </Card>
//   )
// }

// export default SliderControlWidget

// // "use client"

// // import { useState, useEffect, useRef } from "react"
// // import {
// //   Card, CardContent, Typography, Box, Slider, TextField, Button, IconButton,
// //   Chip, Dialog, DialogTitle, DialogContent, DialogActions, Switch,
// //   FormControlLabel, Alert, Tooltip, LinearProgress, Divider, Grid,
// //   InputAdornment, Snackbar, MenuItem, Select
// // } from "@mui/material"
// // import { Settings, Stop, Warning, CheckCircle, Error, Lock, LockOpen, TrendingUp, Tune } from "@mui/icons-material"

// // const LOG_PREFIX = "[SliderControlWidget]"

// // const UNIT_OPTIONS = [
// //   { value: "%", label: "Percentage (%)" },
// //   { value: "°C", label: "Temperature (°C)" },
// //   { value: "°F", label: "Temperature (°F)" },
// //   { value: "L", label: "Level (L)" },
// //   { value: "m", label: "Length (m)" },
// //   { value: "V", label: "Voltage (V)" },
// //   { value: "A", label: "Current (A)" },
// // ]
// // // --- Temporary: always send this command payload ---
// // function buildFanLevelCommandPayload(level) {
// //   return {
// //     command: "set_fan_level",
// //     level: level,
// //   }
// // }

// // function getScaleMarks(min, max, unit, step, interval = 5) {
// //   // Generate marks at every `interval` between min and max, with bold at min/max
// //   const marks = []
// //   for (let v = min; v <= max; v += interval) {
// //     marks.push({
// //       value: v,
// //       label: (
// //         <span style={{
// //           fontWeight: v === min || v === max ? 700 : 400,
// //           color: v === min || v === max ? "#333" : "#888",
// //           fontSize: "0.8rem"
// //         }}>
// //           {v}{unit}
// //         </span>
// //       )
// //     })
// //   }
// //   if (marks[marks.length - 1]?.value !== max) {
// //     marks.push({
// //       value: max,
// //       label: <span style={{ fontWeight: 700, color: "#333" }}>{max}{unit}</span>
// //     })
// //   }
// //   return marks
// // }

// // const SliderControlWidget = ({
// //   widget,
// //   onConfigChange,
// //   devices = [],
// //   data = [],
// //   dataKeys = ["value"],
// //   telemetryOut = [],
// //   sendMqttCommand,
// //   isMqttSending,
// //   ...props
// // }) => {
// //   // Widget configuration
// //   const config = widget?.config || {}
// //   const [title] = useState(config.title || "Device Control")
// //   const [deviceId] = useState(config.deviceId || config.dataSource?.deviceId || null)
// //   const outputKey = Array.isArray(telemetryOut) && telemetryOut.length > 0 ? telemetryOut[0] : "setpoint"

// //   // --- UNIT/RANGE/STEP State ---
// //   const [unit, setUnit] = useState(config.units || "%")
// //   const [minValue, setMinValue] = useState(config.minValue ?? 0)
// //   const [maxValue, setMaxValue] = useState(config.maxValue ?? 100)
// //   const [step, setStep] = useState(config.step || 1)
// //   const [enableRange, setEnableRange] = useState(config.enableRange || false)
// //   const [precision, setPrecision] = useState(config.precision || 1)

// //   // Live value from data/dataKeys
// //   const liveValue =
// //     Array.isArray(data) && data.length && Array.isArray(dataKeys) && dataKeys.length &&
// //     typeof data[data.length - 1][dataKeys[0]] === "number"
// //       ? data[data.length - 1][dataKeys[0]]
// //       : config.defaultValue || minValue

// //   // --- Value State ---
// //   const [currentValue, setCurrentValue] = useState(liveValue)
// //   const [targetValue, setTargetValue] = useState(liveValue)
// //   const [rangeValue, setRangeValue] = useState([
// //     minValue, maxValue
// //   ])
// //   useEffect(() => {
// //     setCurrentValue(liveValue)
// //     setTargetValue(liveValue)
// //     setRangeValue([minValue, maxValue])
// //   }, [liveValue, minValue, maxValue])

// //   // --- Other UI States ---
// //   const [isActive, setIsActive] = useState(false)
// //   const [isLocked, setIsLocked] = useState(false)
// //   const [isConnected, setIsConnected] = useState(true)
// //   const [lastUpdateTime, setLastUpdateTime] = useState(new Date())
// //   const [settingsOpen, setSettingsOpen] = useState(false)
// //   const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
// //   const [pendingValue, setPendingValue] = useState(null)
// //   const [manualInput, setManualInput] = useState("")
// //   const [showManualInput, setShowManualInput] = useState(false)
// //   const [presetValues, setPresetValues] = useState(config.presets || [0, 25, 50, 75, 100])
// //   const [history, setHistory] = useState([])
// //   const [notification, setNotification] = useState({ open: false, message: "", severity: "info" })
// //   const [autoMode, setAutoMode] = useState(false)
// //   const [rampRate] = useState(config.rampRate || 5)
// //   const [enableSafetyLimits] = useState(config.enableSafetyLimits !== false)
// //   const [requireConfirmation] = useState(config.requireConfirmation !== false)
// //   const [criticalThreshold] = useState(config.criticalThreshold || 80)
// //   const [enableLogging] = useState(config.enableLogging !== false)
// //   const [safetyLimits] = useState(config.safetyLimits || { min: 10, max: 90 })
// //   const rampIntervalRef = useRef(null)
// //   const historyIntervalRef = useRef(null)

// //   // --- Notifications ---
// //   const showNotification = (message, severity = "info") => {
// //     setNotification({ open: true, message, severity })
// //     setTimeout(() => setNotification({ ...notification, open: false }), 3000)
// //   }

// //   // --- Slider Change Handlers ---
// //   const handleSliderChange = (event, newValue) => {
// //     if (isLocked) {
// //       showNotification("Control is locked", "warning")
// //       return
// //     }
// //     if (enableRange) {
// //       setRangeValue(newValue)
// //     } else {
// //       setTargetValue(newValue)
// //     }
// //   }

// //   const handleSliderCommit = (event, newValue) => {
// //     if (isLocked) return
// //     // No feedback waiting, just set and send!
// //     if (enableRange) {
// //       setRangeValue(newValue)
// //       if (typeof sendMqttCommand === "function") {
// //         // sendMqttCommand({
// //         //   [`${outputKey}_min`]: newValue[0],
// //         //   [`${outputKey}_max`]: newValue[1]
// //         // })
// //         // showNotification(`Range set: ${newValue[0]}${unit} - ${newValue[1]}${unit}`, "info")
// //           const payload = buildFanLevelCommandPayload(newValue[0])
// //           sendMqttCommand(payload)
// //           showNotification(`Range min set as fan level: ${newValue[0]}`, "info")
// //       }
// //     } else {
// //       setTargetValue(newValue)
// //       if (typeof sendMqttCommand === "function") {
// //         const payload = buildFanLevelCommandPayload(newValue)
// //         sendMqttCommand(payload)
// //         showNotification(`Fan level set: ${newValue}`, "info")
// //       }
// //     }
// //     setLastUpdateTime(new Date())
// //     setIsActive(false)
// //   }

// //   // --- Manual Input Handler ---
// //   const handleManualInput = () => {
// //     const value = Number.parseFloat(manualInput)
// //     if (isNaN(value)) {
// //       showNotification("Invalid input value", "error")
// //       return
// //     }
// //     if (value < minValue || value > maxValue) {
// //       showNotification(`Value must be between ${minValue} and ${maxValue}`, "error")
// //       return
// //     }
// //     handleSliderCommit(null, value)
// //     setManualInput("")
// //     setShowManualInput(false)
// //   }

// //   // --- Preset Handler ---
// //   const handlePresetClick = (presetValue) => {
// //     if (isLocked) {
// //       showNotification("Control is locked", "warning")
// //       return
// //     }
// //     handleSliderCommit(null, presetValue)
// //   }

// //   // --- Settings Handlers (unit/range/range set) ---
// //   const handleUnitChange = (e) => setUnit(e.target.value)
// //   const handleRangeToggle = () => setEnableRange((prev) => !prev)
// //   const handleMinValueChange = (e) => setMinValue(Number(e.target.value))
// //   const handleMaxValueChange = (e) => setMaxValue(Number(e.target.value))
// //   const handleStepChange = (e) => setStep(Number(e.target.value))
// //   const handlePrecisionChange = (e) => setPrecision(Number(e.target.value))

// //   // --- UI Render ---
// //   return (
// //     <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
// //       {/* Header */}
// //       <Box p={2} borderBottom="1px solid #e0e0e0">
// //         <Box display="flex" justifyContent="space-between" alignItems="center">
// //           <Box>
// //             <Typography variant="h6">{title}</Typography>
// //             <Box display="flex" alignItems="center" gap={1} mt={0.5}>
// //               <Chip
// //                 size="small"
// //                 label={isConnected ? "Ready" : "Disconnected"}
// //                 color={isConnected ? "success" : "error"}
// //                 icon={isConnected ? <CheckCircle /> : <Error />}
// //               />
// //               {isLocked && <Chip size="small" label="LOCKED" color="warning" icon={<Lock />} />}
// //             </Box>
// //           </Box>
// //           <Box display="flex" gap={1}>
// //             <Tooltip title={isLocked ? "Unlock Control" : "Lock Control"}>
// //               <IconButton onClick={() => setIsLocked(!isLocked)} color={isLocked ? "warning" : "default"}>
// //                 {isLocked ? <Lock /> : <LockOpen />}
// //               </IconButton>
// //             </Tooltip>
// //             <Tooltip title="Settings">
// //               <IconButton onClick={() => setSettingsOpen(true)}>
// //                 <Settings />
// //               </IconButton>
// //             </Tooltip>
// //           </Box>
// //         </Box>
// //       </Box>

// //       {/* Main Control Area */}
// //       <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
// //         {/* Value Display */}
// //         <Box textAlign="center" mb={2}>
// //           {!enableRange ? (
// //             <>
// //               <Typography variant="h3" color="primary">
// //                 {targetValue?.toFixed(precision)} <Typography component="span" variant="h5" color="textSecondary">{unit}</Typography>
// //               </Typography>
// //               <Typography variant="body2" color="textSecondary">
// //                 Current Value
// //               </Typography>
// //             </>
// //           ) : (
// //             <>
// //               <Typography variant="h4" color="primary">
// //                 {rangeValue[0].toFixed(precision)}{unit} - {rangeValue[1].toFixed(precision)}{unit}
// //               </Typography>
// //               <Typography variant="body2" color="textSecondary">
// //                 Current Range
// //               </Typography>
// //             </>
// //           )}
// //         </Box>

// //         {/* Main Slider with scale */}
// //         <Box mb={2}>
// //           <Slider
// //             value={enableRange ? rangeValue : targetValue}
// //             onChange={handleSliderChange}
// //             onChangeCommitted={handleSliderCommit}
// //             min={minValue}
// //             max={maxValue}
// //             step={step}
// //             disabled={isLocked || !isConnected}
// //             valueLabelDisplay="auto"
// //             marks={getScaleMarks(minValue, maxValue, unit, step, Math.max(5, Math.round((maxValue - minValue) / 10)))}
// //             sx={{
// //               "& .MuiSlider-markLabel": { fontSize: "0.85rem" },
// //               "& .MuiSlider-mark": { backgroundColor: "currentColor" },
// //               "& .MuiSlider-valueLabel": {
// //                 fontWeight: 700,
// //                 fontSize: "1.1rem",
// //                 color: "#333"
// //               }
// //             }}
// //           />
// //         </Box>

// //         {/* Progress Bar for Active Changes (remains, but commented out) */}
// //         {/* {isActive && (
// //           <Box mb={2}>
// //             <LinearProgress variant="determinate" value={100} />
// //             <Typography variant="caption" color="textSecondary" textAlign="center" display="block">
// //               Adjusting to target value...
// //             </Typography>
// //           </Box>
// //         )} */}

// //         {/* Safety Limits Indicator */}
// //         {enableSafetyLimits && (
// //           <Alert
// //             severity={
// //               (!enableRange && (targetValue < safetyLimits.min || targetValue > safetyLimits.max)) ||
// //               (enableRange && (rangeValue[0] < safetyLimits.min || rangeValue[1] > safetyLimits.max))
// //                 ? "error"
// //                 : (!enableRange && targetValue > criticalThreshold) ||
// //                   (enableRange && rangeValue[1] > criticalThreshold)
// //                 ? "warning"
// //                 : "info"
// //             }
// //             sx={{ mb: 2 }}
// //           >
// //             Safety Limits: {safetyLimits.min} - {safetyLimits.max}
// //             {unit}
// //             {!enableRange && targetValue > criticalThreshold && " | Critical threshold exceeded!"}
// //             {enableRange && rangeValue[1] > criticalThreshold && " | Critical threshold exceeded!"}
// //           </Alert>
// //         )}

// //         {/* Preset Values */}
// //         {!enableRange && (
// //           <Box mb={2}>
// //             <Typography variant="subtitle2" gutterBottom>
// //               Quick Presets
// //             </Typography>
// //             <Box display="flex" gap={1} flexWrap="wrap">
// //               {presetValues.map((preset, index) => (
// //                 <Button
// //                   key={index}
// //                   variant={targetValue === preset ? "contained" : "outlined"}
// //                   size="small"
// //                   onClick={() => handlePresetClick(preset)}
// //                   disabled={isLocked || !isConnected}
// //                 >
// //                   {preset}
// //                   {unit}
// //                 </Button>
// //               ))}
// //             </Box>
// //           </Box>
// //         )}

// //         {/* Manual Input */}
// //         {!enableRange && (
// //           <Box mb={2}>
// //             <Box display="flex" alignItems="center" gap={1}>
// //               <Button
// //                 variant="outlined"
// //                 size="small"
// //                 onClick={() => setShowManualInput(!showManualInput)}
// //                 disabled={isLocked || !isConnected}
// //               >
// //                 Manual Input
// //               </Button>
// //               {showManualInput && (
// //                 <>
// //                   <TextField
// //                     size="small"
// //                     value={manualInput}
// //                     onChange={(e) => setManualInput(e.target.value)}
// //                     placeholder={`${minValue}-${maxValue}`}
// //                     InputProps={{
// //                       endAdornment: <InputAdornment position="end">{unit}</InputAdornment>,
// //                     }}
// //                     sx={{ width: 120 }}
// //                   />
// //                   <Button variant="contained" size="small" onClick={handleManualInput}>
// //                     Apply
// //                   </Button>
// //                 </>
// //               )}
// //             </Box>
// //           </Box>
// //         )}

// //         {/* Status Information */}
// //         <Box mt="auto">
// //           <Divider sx={{ mb: 2 }} />
// //           <Grid container spacing={2}>
// //             <Grid item xs={6}>
// //               <Typography variant="caption" color="textSecondary">
// //                 Last Update
// //               </Typography>
// //               <Typography variant="body2">{lastUpdateTime.toLocaleTimeString()}</Typography>
// //             </Grid>
// //             <Grid item xs={6}>
// //               <Typography variant="caption" color="textSecondary">
// //                 Connection
// //               </Typography>
// //               <Typography variant="body2" color={isConnected ? "success.main" : "error.main"}>
// //                 {isConnected ? "Online" : "Offline"}
// //               </Typography>
// //             </Grid>
// //           </Grid>
// //         </Box>
// //       </CardContent>

// //       {/* Settings Dialog */}
// //       <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
// //         <DialogTitle>
// //           <Box display="flex" alignItems="center" gap={1}>
// //             <Tune fontSize="small" /> Control Settings
// //           </Box>
// //         </DialogTitle>
// //         <DialogContent>
// //           <Box display="flex" flexDirection="column" gap={2} pt={1}>
// //             <FormControlLabel
// //               control={<Switch checked={enableRange} onChange={handleRangeToggle} />}
// //               label="Enable Range Selection"
// //             />
// //             <Box display="flex" gap={2}>
// //               <TextField
// //                 label="Min Value"
// //                 type="number"
// //                 size="small"
// //                 value={minValue}
// //                 onChange={handleMinValueChange}
// //                 InputProps={{
// //                   endAdornment: <InputAdornment position="end">{unit}</InputAdornment>
// //                 }}
// //               />
// //               <TextField
// //                 label="Max Value"
// //                 type="number"
// //                 size="small"
// //                 value={maxValue}
// //                 onChange={handleMaxValueChange}
// //                 InputProps={{
// //                   endAdornment: <InputAdornment position="end">{unit}</InputAdornment>
// //                 }}
// //               />
// //               <TextField
// //                 label="Step"
// //                 type="number"
// //                 size="small"
// //                 value={step}
// //                 onChange={handleStepChange}
// //               />
// //               <TextField
// //                 label="Precision"
// //                 type="number"
// //                 size="small"
// //                 value={precision}
// //                 onChange={handlePrecisionChange}
// //               />
// //             </Box>
// //             <Box>
// //               <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Unit</Typography>
// //               <Select size="small" value={unit} onChange={handleUnitChange}>
// //                 {UNIT_OPTIONS.map(u => (
// //                   <MenuItem value={u.value} key={u.value}>{u.label}</MenuItem>
// //                 ))}
// //               </Select>
// //             </Box>
// //           </Box>
// //         </DialogContent>
// //         <DialogActions>
// //           <Button onClick={() => setSettingsOpen(false)}>Close</Button>
// //         </DialogActions>
// //       </Dialog>

// //       {/* Notification Snackbar */}
// //       <Snackbar
// //         open={notification.open}
// //         autoHideDuration={4000}
// //         onClose={() => setNotification({ ...notification, open: false })}
// //         anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
// //       >
// //         <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity}>
// //           {notification.message}
// //         </Alert>
// //       </Snackbar>
// //     </Card>
// //   )
// // }

// // export default SliderControlWidget

// // // "use client"

// // // import { useState, useEffect, useRef } from "react"
// // // import {
// // //   Card, CardContent, Typography, Box, Slider, TextField, Button, IconButton,
// // //   Chip, Dialog, DialogTitle, DialogContent, DialogActions, Switch,
// // //   FormControlLabel, Alert, Tooltip, LinearProgress, Divider, Grid,
// // //   InputAdornment, Snackbar,
// // // } from "@mui/material"
// // // import { Settings, Stop, Warning, CheckCircle, Error, Lock, LockOpen, TrendingUp } from "@mui/icons-material"

// // // const LOG_PREFIX = "[SliderControlWidget]"

// // // const SliderControlWidget = ({
// // //   widget,
// // //   onConfigChange,
// // //   devices = [],
// // //   data = [],
// // //   dataKeys = ["value"],
// // //   telemetryOut = [],
// // //   sendMqttCommand,        // <--- Now received from props!
// // //   isMqttSending,          // <--- Now received from props!
// // //   ...props
// // // }) => {
// // //   // Widget configuration
// // //   const config = widget?.config || {}
// // //   const [title] = useState(config.title || "Device Control")
// // //   const [deviceId] = useState(config.deviceId || config.dataSource?.deviceId || null)
// // //   const outputKey = Array.isArray(telemetryOut) && telemetryOut.length > 0
// // //   ? telemetryOut[0]
// // //   : "setpoint"


// // //   // -- IN-DEPTH LOGS --
// // //   useEffect(() => {
// // //     console.log(`${LOG_PREFIX} Mount. Config:`, config)
// // //     console.log(`${LOG_PREFIX} Incoming dataKeys:`, dataKeys)
// // //     return () => {
// // //       console.log(`${LOG_PREFIX} Unmounted.`)
// // //       console.log(`${LOG_PREFIX} Cleanup intervals`)
// // //     }
// // //   }, [])

// // //   // Live value from data/dataKeys
// // //   const liveValue =
// // //     Array.isArray(data) && data.length && Array.isArray(dataKeys) && dataKeys.length &&
// // //     typeof data[data.length - 1][dataKeys[0]] === "number"
// // //       ? data[data.length - 1][dataKeys[0]]
// // //       : config.defaultValue || config.minValue || 0

// // //   useEffect(() => {
// // //     console.log(`${LOG_PREFIX} liveValue changed:`, liveValue)
// // //   }, [liveValue])

// // //   // Control states, etc.
// // //   const [currentValue, setCurrentValue] = useState(liveValue)
// // //   const [targetValue, setTargetValue] = useState(liveValue)
// // //   const [isActive, setIsActive] = useState(false)
// // //   const [isLocked, setIsLocked] = useState(false)
// // //   const [isConnected, setIsConnected] = useState(true)
// // //   const [lastUpdateTime, setLastUpdateTime] = useState(new Date())
// // //   const [minValue] = useState(config.minValue || 0)
// // //   const [maxValue] = useState(config.maxValue || 100)
// // //   const [step] = useState(config.step || 1)
// // //   const [units] = useState(config.units || "%")
// // //   const [precision] = useState(config.precision || 1)
// // //   const [safetyLimits] = useState(config.safetyLimits || { min: 10, max: 90 })
// // //   const [criticalThreshold] = useState(config.criticalThreshold || 80)
// // //   const [settingsOpen, setSettingsOpen] = useState(false)
// // //   const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
// // //   const [pendingValue, setPendingValue] = useState(null)
// // //   const [manualInput, setManualInput] = useState("")
// // //   const [showManualInput, setShowManualInput] = useState(false)
// // //   const [presetValues] = useState(config.presets || [0, 25, 50, 75, 100])
// // //   const [history, setHistory] = useState([])
// // //   const [notification, setNotification] = useState({ open: false, message: "", severity: "info" })
// // //   const [autoMode, setAutoMode] = useState(false)
// // //   const [rampRate] = useState(config.rampRate || 5)
// // //   const [enableSafetyLimits] = useState(config.enableSafetyLimits !== false)
// // //   const [requireConfirmation] = useState(config.requireConfirmation !== false)
// // //   const [enableLogging] = useState(config.enableLogging !== false)
// // //   const rampIntervalRef = useRef(null)
// // //   const historyIntervalRef = useRef(null)

// // //   useEffect(() => {
// // //     setCurrentValue(liveValue)
// // //     setTargetValue(liveValue)
// // //   }, [liveValue])

// // //   useEffect(() => {
// // //     // Simulate connection (DEV only)
// // //     console.log(`${LOG_PREFIX} Simulating connection every 5s.`)
// // //     const connectionInterval = setInterval(() => {
// // //       setIsConnected(Math.random() > 0.1)
// // //       console.log(`${LOG_PREFIX} Simulated isConnected = ${isConnected}`)
// // //     }, 5000)
// // //     if (enableLogging) {
// // //       historyIntervalRef.current = setInterval(() => {
// // //         setHistory((prev) => {
// // //           const newEntry = {
// // //             timestamp: new Date(),
// // //             value: currentValue,
// // //             target: targetValue,
// // //             status: isActive ? "active" : "idle",
// // //           }
// // //           console.log(`${LOG_PREFIX} History log update:`, newEntry)
// // //           return [...prev.slice(-99), newEntry]
// // //         })
// // //       }, 10000)
// // //     }
// // //     return () => {
// // //       clearInterval(connectionInterval)
// // //       if (historyIntervalRef.current) clearInterval(historyIntervalRef.current)
// // //       if (rampIntervalRef.current) clearInterval(rampIntervalRef.current)
// // //       console.log(`${LOG_PREFIX} Cleanup intervals`)
// // //     }
// // //   }, [currentValue, targetValue, isActive, enableLogging])

// // //   useEffect(() => {
// // //     if (isActive && currentValue !== targetValue && !autoMode) {
// // //       console.log(`${LOG_PREFIX} Begin ramp: current ${currentValue} → target ${targetValue} | rampRate: ${rampRate}`)
// // //       rampIntervalRef.current = setInterval(() => {
// // //         setCurrentValue((prev) => {
// // //           const diff = targetValue - prev
// // //           const increment = Math.sign(diff) * Math.min(Math.abs(diff), rampRate / 10)
// // //           const newValue = prev + increment
// // //           console.log(`${LOG_PREFIX} Ramping: prev ${prev} → ${newValue}`)
// // //           if (Math.abs(newValue - targetValue) < 0.1) {
// // //             clearInterval(rampIntervalRef.current)
// // //             setIsActive(false)
// // //             showNotification("Target value reached", "success")
// // //             return targetValue
// // //           }
// // //           return newValue
// // //         })
// // //       }, 100)
// // //     }
// // //     return () => {
// // //       if (rampIntervalRef.current) clearInterval(rampIntervalRef.current)
// // //     }
// // //   }, [isActive, targetValue, rampRate, autoMode])

// // //   const showNotification = (message, severity = "info") => {
// // //     setNotification({ open: true, message, severity })
// // //     console.log(`${LOG_PREFIX} Notification: ${severity}`, message)
// // //   }

// // //   const handleSliderChange = (event, newValue) => {
// // //     console.log(`${LOG_PREFIX} SliderChange`, newValue)
// // //     if (isLocked) {
// // //       showNotification("Control is locked", "warning")
// // //       return
// // //     }
// // //     setTargetValue(newValue)
// // //   }

// // //   const handleSliderCommit = (event, newValue) => {
// // //     console.log(`${LOG_PREFIX} SliderCommit`, newValue)
// // //     if (isLocked) return
// // //     if (enableSafetyLimits) {
// // //       if (newValue < safetyLimits.min || newValue > safetyLimits.max) {
// // //         showNotification(`Value outside safety limits (${safetyLimits.min}-${safetyLimits.max})`, "error")
// // //         setTargetValue(currentValue)
// // //         return
// // //       }
// // //     }
// // //     if (requireConfirmation && newValue > criticalThreshold) {
// // //       setPendingValue(newValue)
// // //       setConfirmDialogOpen(true)
// // //       return
// // //     }
// // //     applyValue(newValue)
// // //   }

// // //   // --------- SEND TO DEVICE (MQTT!) ---------
// // //   const applyValue = (value) => {
// // //     console.log(`${LOG_PREFIX} applyValue called with`, value)
// // //     if (!isConnected) {
// // //       showNotification("Device not connected", "error")
// // //       return
// // //     }
// // //     setTargetValue(value)
// // //     setIsActive(true)
// // //     setLastUpdateTime(new Date())
// // //     showNotification(`Setting ${outputKey} to ${value.toFixed(precision)}${units}`, "info")

// // //     // Deep log MQTT status and attempt to send
// // //     if (typeof sendMqttCommand === "function") {
// // //       console.log(`${LOG_PREFIX} Calling sendCommand. Details:`, {
// // //         deviceId, outputKey, value,
// // //         dataSource: config.dataSource || config
// // //       })
// // //       sendMqttCommand({ [outputKey]: value })
// // //         .then(() => showNotification("Command sent", "success"))
// // //         .catch((err) => {
// // //           showNotification("Failed to send command", "error")
// // //           console.error(`${LOG_PREFIX} MQTT command error:`, err)
// // //         })
// // //     } else {
// // //       showNotification("MQTT command function missing", "error")
// // //       console.warn(`${LOG_PREFIX} sendMqttCommand function missing or not a function.`, { sendMqttCommand })
// // //     }
// // //   }

// // //   const handleManualInput = () => {
// // //     const value = Number.parseFloat(manualInput)
// // //     if (isNaN(value)) {
// // //       showNotification("Invalid input value", "error")
// // //       return
// // //     }
// // //     if (value < minValue || value > maxValue) {
// // //       showNotification(`Value must be between ${minValue} and ${maxValue}`, "error")
// // //       return
// // //     }
// // //     handleSliderCommit(null, value)
// // //     setManualInput("")
// // //     setShowManualInput(false)
// // //   }

// // //   const handlePresetClick = (presetValue) => {
// // //     if (isLocked) {
// // //       showNotification("Control is locked", "warning")
// // //       return
// // //     }
// // //     handleSliderCommit(null, presetValue)
// // //   }

// // //   const handleEmergencyStop = () => {
// // //     setIsActive(false)
// // //     setTargetValue(currentValue)
// // //     if (rampIntervalRef.current) clearInterval(rampIntervalRef.current)
// // //     showNotification("Emergency stop activated", "warning")
// // //   }

// // //   const getValueColor = () => {
// // //     if (!isConnected) return "error"
// // //     if (currentValue > criticalThreshold) return "warning"
// // //     if (isActive) return "primary"
// // //     return "success"
// // //   }

// // //   const getStatusText = () => {
// // //     if (!isConnected) return "Disconnected"
// // //     if (isActive) return "Adjusting"
// // //     if (isLocked) return "Locked"
// // //     return "Ready"
// // //   }

// // //   // --- UI unchanged from your version below ---
// // //   return (
// // //     <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
// // //       {/* Header */}
// // //       <Box p={2} borderBottom="1px solid #e0e0e0">
// // //         <Box display="flex" justifyContent="space-between" alignItems="center">
// // //           <Box>
// // //             <Typography variant="h6">{title}</Typography>
// // //             <Box display="flex" alignItems="center" gap={1} mt={0.5}>
// // //               <Chip
// // //                 size="small"
// // //                 label={getStatusText()}
// // //                 color={getValueColor()}
// // //                 icon={isConnected ? <CheckCircle /> : <Error />}
// // //               />
// // //               {isActive && <Chip size="small" label="ACTIVE" color="primary" icon={<TrendingUp />} />}
// // //               {isLocked && <Chip size="small" label="LOCKED" color="warning" icon={<Lock />} />}
// // //             </Box>
// // //           </Box>
// // //           <Box display="flex" gap={1}>
// // //             <Tooltip title={isLocked ? "Unlock Control" : "Lock Control"}>
// // //               <IconButton onClick={() => setIsLocked(!isLocked)} color={isLocked ? "warning" : "default"}>
// // //                 {isLocked ? <Lock /> : <LockOpen />}
// // //               </IconButton>
// // //             </Tooltip>
// // //             <Tooltip title="Emergency Stop">
// // //               <IconButton onClick={handleEmergencyStop} color="error" disabled={!isActive}>
// // //                 <Stop />
// // //               </IconButton>
// // //             </Tooltip>
// // //             <Tooltip title="Settings">
// // //               <IconButton onClick={() => setSettingsOpen(true)}>
// // //                 <Settings />
// // //               </IconButton>
// // //             </Tooltip>
// // //           </Box>
// // //         </Box>
// // //       </Box>

// // //       {/* Main Control Area */}
// // //       <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
// // //         {/* Current Value Display */}
// // //         <Box textAlign="center" mb={3}>
// // //           <Typography variant="h3" color={getValueColor()}>
// // //             {currentValue.toFixed(precision)}
// // //             <Typography component="span" variant="h5" color="textSecondary">
// // //               {units}
// // //             </Typography>
// // //           </Typography>
// // //           <Typography variant="body2" color="textSecondary">
// // //             Current Value
// // //           </Typography>
// // //           {targetValue !== currentValue && (
// // //             <Typography variant="body2" color="primary">
// // //               Target: {targetValue.toFixed(precision)}
// // //               {units}
// // //             </Typography>
// // //           )}
// // //         </Box>

// // //         {/* Progress Bar for Active Changes */}
// // //         {isActive && (
// // //           <Box mb={2}>
// // //             <LinearProgress
// // //               variant="determinate"
// // //               value={
// // //                 Math.abs(currentValue - targetValue) < 0.1
// // //                   ? 100
// // //                   : (Math.abs(currentValue - Math.min(currentValue, targetValue)) /
// // //                       Math.abs(targetValue - Math.min(currentValue, targetValue))) *
// // //                     100
// // //               }
// // //             />
// // //             <Typography variant="caption" color="textSecondary" textAlign="center" display="block">
// // //               Adjusting to target value...
// // //             </Typography>
// // //           </Box>
// // //         )}

// // //         {/* Main Slider */}
// // //         <Box mb={3}>
// // //           <Slider
// // //             value={targetValue}
// // //             onChange={handleSliderChange}
// // //             onChangeCommitted={handleSliderCommit}
// // //             min={minValue}
// // //             max={maxValue}
// // //             step={step}
// // //             disabled={isLocked || !isConnected}
// // //             marks={[
// // //               { value: minValue, label: `${minValue}${units}` },
// // //               { value: maxValue, label: `${maxValue}${units}` },
// // //               ...(enableSafetyLimits
// // //                 ? [
// // //                     { value: safetyLimits.min, label: "Min Safe" },
// // //                     { value: safetyLimits.max, label: "Max Safe" },
// // //                   ]
// // //                 : []),
// // //               { value: criticalThreshold, label: "Critical" },
// // //             ]}
// // //             sx={{
// // //               "& .MuiSlider-markLabel": { fontSize: "0.75rem" },
// // //               "& .MuiSlider-mark": { backgroundColor: "currentColor" },
// // //             }}
// // //           />
// // //         </Box>

// // //         {/* Safety Limits Indicator */}
// // //         {enableSafetyLimits && (
// // //           <Alert
// // //             severity={
// // //               targetValue < safetyLimits.min || targetValue > safetyLimits.max
// // //                 ? "error"
// // //                 : targetValue > criticalThreshold
// // //                   ? "warning"
// // //                   : "info"
// // //             }
// // //             sx={{ mb: 2 }}
// // //           >
// // //             Safety Limits: {safetyLimits.min} - {safetyLimits.max}
// // //             {units}
// // //             {targetValue > criticalThreshold && " | Critical threshold exceeded!"}
// // //           </Alert>
// // //         )}

// // //         {/* Preset Values */}
// // //         <Box mb={2}>
// // //           <Typography variant="subtitle2" gutterBottom>
// // //             Quick Presets
// // //           </Typography>
// // //           <Box display="flex" gap={1} flexWrap="wrap">
// // //             {presetValues.map((preset, index) => (
// // //               <Button
// // //                 key={index}
// // //                 variant={targetValue === preset ? "contained" : "outlined"}
// // //                 size="small"
// // //                 onClick={() => handlePresetClick(preset)}
// // //                 disabled={isLocked || !isConnected}
// // //               >
// // //                 {preset}
// // //                 {units}
// // //               </Button>
// // //             ))}
// // //           </Box>
// // //         </Box>

// // //         {/* Manual Input */}
// // //         <Box mb={2}>
// // //           <Box display="flex" alignItems="center" gap={1}>
// // //             <Button
// // //               variant="outlined"
// // //               size="small"
// // //               onClick={() => setShowManualInput(!showManualInput)}
// // //               disabled={isLocked || !isConnected}
// // //             >
// // //               Manual Input
// // //             </Button>
// // //             {showManualInput && (
// // //               <>
// // //                 <TextField
// // //                   size="small"
// // //                   value={manualInput}
// // //                   onChange={(e) => setManualInput(e.target.value)}
// // //                   placeholder={`${minValue}-${maxValue}`}
// // //                   InputProps={{
// // //                     endAdornment: <InputAdornment position="end">{units}</InputAdornment>,
// // //                   }}
// // //                   sx={{ width: 120 }}
// // //                 />
// // //                 <Button variant="contained" size="small" onClick={handleManualInput}>
// // //                   Apply
// // //                 </Button>
// // //               </>
// // //             )}
// // //           </Box>
// // //         </Box>

// // //         {/* Status Information */}
// // //         <Box mt="auto">
// // //           <Divider sx={{ mb: 2 }} />
// // //           <Grid container spacing={2}>
// // //             <Grid item xs={6}>
// // //               <Typography variant="caption" color="textSecondary">
// // //                 Last Update
// // //               </Typography>
// // //               <Typography variant="body2">{lastUpdateTime.toLocaleTimeString()}</Typography>
// // //             </Grid>
// // //             <Grid item xs={6}>
// // //               <Typography variant="caption" color="textSecondary">
// // //                 Connection
// // //               </Typography>
// // //               <Typography variant="body2" color={isConnected ? "success.main" : "error.main"}>
// // //                 {isConnected ? "Online" : "Offline"}
// // //               </Typography>
// // //             </Grid>
// // //           </Grid>
// // //         </Box>
// // //       </CardContent>

// // //       {/* Confirmation Dialog */}
// // //       <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
// // //         <DialogTitle>
// // //           <Box display="flex" alignItems="center" gap={1}>
// // //             <Warning color="warning" />
// // //             Confirm Critical Value
// // //           </Box>
// // //         </DialogTitle>
// // //         <DialogContent>
// // //           <Typography>
// // //             You are about to set {outputKey} to {pendingValue?.toFixed(precision)}
// // //             {units}. This exceeds the critical threshold of {criticalThreshold}
// // //             {units}.
// // //           </Typography>
// // //           <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
// // //             Please confirm this action is intentional.
// // //           </Typography>
// // //         </DialogContent>
// // //         <DialogActions>
// // //           <Button
// // //             onClick={() => {
// // //               setConfirmDialogOpen(false)
// // //               setPendingValue(null)
// // //               setTargetValue(currentValue)
// // //             }}
// // //           >
// // //             Cancel
// // //           </Button>
// // //           <Button
// // //             onClick={() => {
// // //               applyValue(pendingValue)
// // //               setConfirmDialogOpen(false)
// // //               setPendingValue(null)
// // //             }}
// // //             variant="contained"
// // //             color="warning"
// // //           >
// // //             Confirm
// // //           </Button>
// // //         </DialogActions>
// // //       </Dialog>

// // //       {/* Settings Dialog */}
// // //       <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
// // //         <DialogTitle>Control Settings</DialogTitle>
// // //         <DialogContent>
// // //           <Box display="flex" flexDirection="column" gap={2} pt={1}>
// // //             <FormControlLabel
// // //               control={<Switch checked={autoMode} onChange={(e) => setAutoMode(e.target.checked)} />}
// // //               label="Auto Mode"
// // //             />
// // //             <Typography variant="body2" color="textSecondary">
// // //               Range: {minValue} - {maxValue}
// // //               {units} | Step: {step}
// // //               {units} | Ramp Rate: {rampRate}
// // //               {units}/s
// // //             </Typography>
// // //             {enableLogging && (
// // //               <Box>
// // //                 <Typography variant="subtitle2" gutterBottom>
// // //                   Recent History ({history.length} entries)
// // //                 </Typography>
// // //                 <Box maxHeight={200} overflow="auto">
// // //                   {history
// // //                     .slice(-10)
// // //                     .reverse()
// // //                     .map((entry, index) => (
// // //                       <Typography key={index} variant="caption" display="block">
// // //                         {entry.timestamp.toLocaleTimeString()}: {entry.value.toFixed(precision)}
// // //                         {units}({entry.status})
// // //                       </Typography>
// // //                     ))}
// // //                 </Box>
// // //               </Box>
// // //             )}
// // //           </Box>
// // //         </DialogContent>
// // //         <DialogActions>
// // //           <Button onClick={() => setSettingsOpen(false)}>Close</Button>
// // //         </DialogActions>
// // //       </Dialog>

// // //       {/* Notification Snackbar */}
// // //       <Snackbar
// // //         open={notification.open}
// // //         autoHideDuration={4000}
// // //         onClose={() => setNotification({ ...notification, open: false })}
// // //         anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
// // //       >
// // //         <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity}>
// // //           {notification.message}
// // //         </Alert>
// // //       </Snackbar>
// // //     </Card>
// // //   )
// // // }

// // // export default SliderControlWidget


// // // // // "use client"

// // // // // import { useState, useEffect, useRef, useCallback } from "react"
// // // // // import { Card, Typography, Slider, Button, InputNumber, Space, Tooltip, Switch, message, Tag, Progress, Spin } from "antd"
// // // // // import { LockOutlined, UnlockOutlined, SettingOutlined, ThunderboltOutlined, WarningOutlined, CheckCircleOutlined, PoweroffOutlined } from "@ant-design/icons"
// // // // // // import { useWidgetLiveData } from "../../hooks/useWidgetLiveData"
// // // // // import { useMqttCommand } from "../../../hooks/useMqttCommand" // (see below for implementation)
// // // // // import { theme as antdTheme } from "antd"

// // // // // const SliderControlWidget = ({
// // // // //   title = "Device Setpoint",
// // // // //   data = [],
// // // // //   dataKeys = ["setpoint"],
// // // // //   min = 0,
// // // // //   max = 100,
// // // // //   step = 1,
// // // // //   precision = 1,
// // // // //   unit = "%",
// // // // //   theme = "light",
// // // // //   commandKey = "setpoint",
// // // // //   deviceId,
// // // // //   dataSource = {},
// // // // //   loading = false,
// // // // //   onConfigChange, // for WidgetRenderer propagation
// // // // //   ...props
// // // // // }) => {
// // // // //   const { token } = antdTheme.useToken()
// // // // //   // MQTT/HTTP sending logic (see useMqttCommand below!)
// // // // //   const { sendCommand, isSending } = useMqttCommand(dataSource)

// // // // //   // Telemetry: derive current value from live data (buffered array)
// // // // //   const latestValue =
// // // // //     Array.isArray(data) && data.length && dataKeys.length && typeof data[data.length - 1][dataKeys[0]] === "number"
// // // // //       ? data[data.length - 1][dataKeys[0]]
// // // // //       : min

// // // // //   // Local UI state (target value to be set)
// // // // //   const [targetValue, setTargetValue] = useState(latestValue)
// // // // //   const [locked, setLocked] = useState(false)
// // // // //   const [autoMode, setAutoMode] = useState(false)
// // // // //   const [showInput, setShowInput] = useState(false)
// // // // //   const [status, setStatus] = useState("ready")
// // // // //   const [notif, setNotif] = useState("")

// // // // //   // Update local state when live value changes
// // // // //   useEffect(() => {
// // // // //     setTargetValue(latestValue)
// // // // //   }, [latestValue])

// // // // //   // Handle setpoint change (slider or input)
// // // // //   const handleChange = (value) => setTargetValue(value)
// // // // //   const handleAfterChange = async (value) => {
// // // // //     if (locked) {
// // // // //       message.warning("Control is locked")
// // // // //       return
// // // // //     }
// // // // //     setStatus("sending")
// // // // //     try {
// // // // //       await sendCommand({ [commandKey]: value })
// // // // //       setStatus("success")
// // // // //       setNotif(`Setpoint updated: ${value}${unit}`)
// // // // //       setTimeout(() => setStatus("ready"), 1000)
// // // // //     } catch (err) {
// // // // //       setStatus("error")
// // // // //       setNotif("Failed to send command")
// // // // //       message.error("Failed to send command")
// // // // //     }
// // // // //   }

// // // // //   const valueColor =
// // // // //     status === "error"
// // // // //       ? token.colorError
// // // // //       : status === "success"
// // // // //         ? token.colorSuccess
// // // // //         : status === "sending"
// // // // //           ? token.colorWarning
// // // // //           : token.colorText

// // // // //   return (
// // // // //     <Card
// // // // //       title={
// // // // //         <Space>
// // // // //           <ThunderboltOutlined />
// // // // //           {title}
// // // // //           <Tag color={locked ? "warning" : "success"} icon={locked ? <LockOutlined /> : <UnlockOutlined />}>
// // // // //             {locked ? "Locked" : "Active"}
// // // // //           </Tag>
// // // // //           <Tooltip title={autoMode ? "Auto Mode" : "Manual"}>
// // // // //             <Switch checked={autoMode} onChange={setAutoMode} checkedChildren="Auto" unCheckedChildren="Manual" size="small" />
// // // // //           </Tooltip>
// // // // //         </Space>
// // // // //       }
// // // // //       extra={
// // // // //         <Space>
// // // // //           <Tooltip title={locked ? "Unlock" : "Lock"}>
// // // // //             <Button icon={locked ? <UnlockOutlined /> : <LockOutlined />} size="small" onClick={() => setLocked((v) => !v)} />
// // // // //           </Tooltip>
// // // // //           <Tooltip title="Manual Input">
// // // // //             <Button icon={<SettingOutlined />} size="small" onClick={() => setShowInput((v) => !v)} />
// // // // //           </Tooltip>
// // // // //         </Space>
// // // // //       }
// // // // //       bordered
// // // // //       className={theme === "dark" ? "widget-theme-dark" : ""}
// // // // //       style={{ height: "100%", minWidth: 280 }}
// // // // //       bodyStyle={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}
// // // // //     >
// // // // //       {loading ? <Spin size="large" tip="Loading..." /> : (
// // // // //         <>
// // // // //           <div style={{ width: "100%", marginBottom: 12 }}>
// // // // //             <Slider
// // // // //               min={min}
// // // // //               max={max}
// // // // //               step={step}
// // // // //               value={targetValue}
// // // // //               onChange={handleChange}
// // // // //               onAfterChange={handleAfterChange}
// // // // //               disabled={locked || isSending || autoMode}
// // // // //               tooltip={{ open: true, placement: "top", formatter: val => `${val}${unit}` }}
// // // // //             />
// // // // //           </div>
// // // // //           {showInput && (
// // // // //             <InputNumber
// // // // //               min={min}
// // // // //               max={max}
// // // // //               step={step}
// // // // //               value={targetValue}
// // // // //               onChange={handleChange}
// // // // //               onPressEnter={e => handleAfterChange(Number(e.target.value))}
// // // // //               precision={precision}
// // // // //               addonAfter={unit}
// // // // //               style={{ marginBottom: 12, width: 120 }}
// // // // //               disabled={locked || isSending || autoMode}
// // // // //             />
// // // // //           )}
// // // // //           <Typography.Title level={2} style={{ margin: 0, color: valueColor }}>
// // // // //             {Number(latestValue).toFixed(precision)} <span style={{ fontSize: 16, color: token.colorTextSecondary }}>{unit}</span>
// // // // //           </Typography.Title>
// // // // //           <Typography.Text type={status === "error" ? "danger" : "secondary"}>
// // // // //             {notif || (isSending ? "Sending..." : "Current Value")}
// // // // //           </Typography.Text>
// // // // //           <div style={{ marginTop: 16, width: "100%" }}>
// // // // //             <Progress
// // // // //               percent={100 * (Number(latestValue) - min) / (max - min)}
// // // // //               showInfo={false}
// // // // //               strokeColor={status === "error" ? token.colorError : token.colorPrimary}
// // // // //             />
// // // // //           </div>
// // // // //         </>
// // // // //       )}
// // // // //     </Card>
// // // // //   )
// // // // // }

// // // // // export default SliderControlWidget

// // // // // // "use client"

// // // // // // import { useState, useEffect, useRef } from "react"
// // // // // // import {
// // // // // //   Card,
// // // // // //   CardContent,
// // // // // //   Typography,
// // // // // //   Box,
// // // // // //   Slider,
// // // // // //   TextField,
// // // // // //   Button,
// // // // // //   IconButton,
// // // // // //   Chip,
// // // // // //   Dialog,
// // // // // //   DialogTitle,
// // // // // //   DialogContent,
// // // // // //   DialogActions,
// // // // // //   Switch,
// // // // // //   FormControlLabel,
// // // // // //   Alert,
// // // // // //   Tooltip,
// // // // // //   LinearProgress,
// // // // // //   Divider,
// // // // // //   Grid,
// // // // // //   InputAdornment,
// // // // // //   Snackbar,
// // // // // // } from "@mui/material"
// // // // // // import { Settings, Stop, Warning, CheckCircle, Error, Lock, LockOpen, TrendingUp } from "@mui/icons-material"

// // // // // // const SliderControlWidget = ({ widget, onConfigChange, devices = [] }) => {
// // // // // //   // Widget configuration
// // // // // //   const config = widget?.config || {}
// // // // // //   const [title] = useState(config.title || "Device Control")
// // // // // //   const [deviceId] = useState(config.deviceId || null)
// // // // // //   const [controlParameter] = useState(config.controlParameter || "setpoint")

// // // // // //   // Control states
// // // // // //   const [currentValue, setCurrentValue] = useState(config.defaultValue || 50)
// // // // // //   const [targetValue, setTargetValue] = useState(config.defaultValue || 50)
// // // // // //   const [isActive, setIsActive] = useState(false)
// // // // // //   const [isLocked, setIsLocked] = useState(false)
// // // // // //   const [isConnected, setIsConnected] = useState(true)
// // // // // //   const [lastUpdateTime, setLastUpdateTime] = useState(new Date())

// // // // // //   // Configuration
// // // // // //   const [minValue] = useState(config.minValue || 0)
// // // // // //   const [maxValue] = useState(config.maxValue || 100)
// // // // // //   const [step] = useState(config.step || 1)
// // // // // //   const [units] = useState(config.units || "%")
// // // // // //   const [precision] = useState(config.precision || 1)
// // // // // //   const [safetyLimits] = useState(config.safetyLimits || { min: 10, max: 90 })
// // // // // //   const [criticalThreshold] = useState(config.criticalThreshold || 80)

// // // // // //   // UI states
// // // // // //   const [settingsOpen, setSettingsOpen] = useState(false)
// // // // // //   const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
// // // // // //   const [pendingValue, setPendingValue] = useState(null)
// // // // // //   const [manualInput, setManualInput] = useState("")
// // // // // //   const [showManualInput, setShowManualInput] = useState(false)
// // // // // //   const [presetValues] = useState(config.presets || [0, 25, 50, 75, 100])
// // // // // //   const [history, setHistory] = useState([])
// // // // // //   const [notification, setNotification] = useState({ open: false, message: "", severity: "info" })

// // // // // //   // Advanced features
// // // // // //   const [autoMode, setAutoMode] = useState(false)
// // // // // //   const [rampRate] = useState(config.rampRate || 5) // units per second
// // // // // //   const [enableSafetyLimits] = useState(config.enableSafetyLimits !== false)
// // // // // //   const [requireConfirmation] = useState(config.requireConfirmation !== false)
// // // // // //   const [enableLogging] = useState(config.enableLogging !== false)

// // // // // //   // Refs
// // // // // //   const rampIntervalRef = useRef(null)
// // // // // //   const historyIntervalRef = useRef(null)

// // // // // //   // Initialize component
// // // // // //   useEffect(() => {
// // // // // //     // Simulate device connection
// // // // // //     const connectionInterval = setInterval(() => {
// // // // // //       setIsConnected(Math.random() > 0.1) // 90% uptime simulation
// // // // // //     }, 5000)

// // // // // //     // Start history logging
// // // // // //     if (enableLogging) {
// // // // // //       historyIntervalRef.current = setInterval(() => {
// // // // // //         setHistory((prev) => {
// // // // // //           const newEntry = {
// // // // // //             timestamp: new Date(),
// // // // // //             value: currentValue,
// // // // // //             target: targetValue,
// // // // // //             status: isActive ? "active" : "idle",
// // // // // //           }
// // // // // //           return [...prev.slice(-99), newEntry] // Keep last 100 entries
// // // // // //         })
// // // // // //       }, 10000) // Log every 10 seconds
// // // // // //     }

// // // // // //     return () => {
// // // // // //       clearInterval(connectionInterval)
// // // // // //       if (historyIntervalRef.current) {
// // // // // //         clearInterval(historyIntervalRef.current)
// // // // // //       }
// // // // // //       if (rampIntervalRef.current) {
// // // // // //         clearInterval(rampIntervalRef.current)
// // // // // //       }
// // // // // //     }
// // // // // //   }, [currentValue, targetValue, isActive, enableLogging])

// // // // // //   // Handle value ramping
// // // // // //   useEffect(() => {
// // // // // //     if (isActive && currentValue !== targetValue && !autoMode) {
// // // // // //       rampIntervalRef.current = setInterval(() => {
// // // // // //         setCurrentValue((prev) => {
// // // // // //           const diff = targetValue - prev
// // // // // //           const increment = Math.sign(diff) * Math.min(Math.abs(diff), rampRate / 10)
// // // // // //           const newValue = prev + increment

// // // // // //           // Check if we've reached the target
// // // // // //           if (Math.abs(newValue - targetValue) < 0.1) {
// // // // // //             clearInterval(rampIntervalRef.current)
// // // // // //             setIsActive(false)
// // // // // //             showNotification("Target value reached", "success")
// // // // // //             return targetValue
// // // // // //           }

// // // // // //           return newValue
// // // // // //         })
// // // // // //       }, 100) // Update every 100ms for smooth ramping
// // // // // //     }

// // // // // //     return () => {
// // // // // //       if (rampIntervalRef.current) {
// // // // // //         clearInterval(rampIntervalRef.current)
// // // // // //       }
// // // // // //     }
// // // // // //   }, [isActive, targetValue, rampRate, autoMode])

// // // // // //   const showNotification = (message, severity = "info") => {
// // // // // //     setNotification({ open: true, message, severity })
// // // // // //   }

// // // // // //   const handleSliderChange = (event, newValue) => {
// // // // // //     if (isLocked) {
// // // // // //       showNotification("Control is locked", "warning")
// // // // // //       return
// // // // // //     }

// // // // // //     setTargetValue(newValue)
// // // // // //   }

// // // // // //   const handleSliderCommit = (event, newValue) => {
// // // // // //     if (isLocked) return

// // // // // //     // Check safety limits
// // // // // //     if (enableSafetyLimits) {
// // // // // //       if (newValue < safetyLimits.min || newValue > safetyLimits.max) {
// // // // // //         showNotification(`Value outside safety limits (${safetyLimits.min}-${safetyLimits.max})`, "error")
// // // // // //         setTargetValue(currentValue) // Reset to current value
// // // // // //         return
// // // // // //       }
// // // // // //     }

// // // // // //     // Check if confirmation is required for critical values
// // // // // //     if (requireConfirmation && newValue > criticalThreshold) {
// // // // // //       setPendingValue(newValue)
// // // // // //       setConfirmDialogOpen(true)
// // // // // //       return
// // // // // //     }

// // // // // //     applyValue(newValue)
// // // // // //   }

// // // // // //   const applyValue = (value) => {
// // // // // //     if (!isConnected) {
// // // // // //       showNotification("Device not connected", "error")
// // // // // //       return
// // // // // //     }

// // // // // //     setTargetValue(value)
// // // // // //     setIsActive(true)
// // // // // //     setLastUpdateTime(new Date())
// // // // // //     showNotification(`Setting ${controlParameter} to ${value.toFixed(precision)}${units}`, "info")

// // // // // //     // Simulate sending command to device
// // // // // //     console.log(`Sending command: ${controlParameter} = ${value}`)
// // // // // //   }

// // // // // //   const handleManualInput = () => {
// // // // // //     const value = Number.parseFloat(manualInput)
// // // // // //     if (isNaN(value)) {
// // // // // //       showNotification("Invalid input value", "error")
// // // // // //       return
// // // // // //     }

// // // // // //     if (value < minValue || value > maxValue) {
// // // // // //       showNotification(`Value must be between ${minValue} and ${maxValue}`, "error")
// // // // // //       return
// // // // // //     }

// // // // // //     handleSliderCommit(null, value)
// // // // // //     setManualInput("")
// // // // // //     setShowManualInput(false)
// // // // // //   }

// // // // // //   const handlePresetClick = (presetValue) => {
// // // // // //     if (isLocked) {
// // // // // //       showNotification("Control is locked", "warning")
// // // // // //       return
// // // // // //     }
// // // // // //     handleSliderCommit(null, presetValue)
// // // // // //   }

// // // // // //   const handleEmergencyStop = () => {
// // // // // //     setIsActive(false)
// // // // // //     setTargetValue(currentValue)
// // // // // //     if (rampIntervalRef.current) {
// // // // // //       clearInterval(rampIntervalRef.current)
// // // // // //     }
// // // // // //     showNotification("Emergency stop activated", "warning")
// // // // // //   }

// // // // // //   const getValueColor = () => {
// // // // // //     if (!isConnected) return "error"
// // // // // //     if (currentValue > criticalThreshold) return "warning"
// // // // // //     if (isActive) return "primary"
// // // // // //     return "success"
// // // // // //   }

// // // // // //   const getStatusText = () => {
// // // // // //     if (!isConnected) return "Disconnected"
// // // // // //     if (isActive) return "Adjusting"
// // // // // //     if (isLocked) return "Locked"
// // // // // //     return "Ready"
// // // // // //   }

// // // // // //   return (
// // // // // //     <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
// // // // // //       {/* Header */}
// // // // // //       <Box p={2} borderBottom="1px solid #e0e0e0">
// // // // // //         <Box display="flex" justifyContent="space-between" alignItems="center">
// // // // // //           <Box>
// // // // // //             <Typography variant="h6">{title}</Typography>
// // // // // //             <Box display="flex" alignItems="center" gap={1} mt={0.5}>
// // // // // //               <Chip
// // // // // //                 size="small"
// // // // // //                 label={getStatusText()}
// // // // // //                 color={getValueColor()}
// // // // // //                 icon={isConnected ? <CheckCircle /> : <Error />}
// // // // // //               />
// // // // // //               {isActive && <Chip size="small" label="ACTIVE" color="primary" icon={<TrendingUp />} />}
// // // // // //               {isLocked && <Chip size="small" label="LOCKED" color="warning" icon={<Lock />} />}
// // // // // //             </Box>
// // // // // //           </Box>
// // // // // //           <Box display="flex" gap={1}>
// // // // // //             <Tooltip title={isLocked ? "Unlock Control" : "Lock Control"}>
// // // // // //               <IconButton onClick={() => setIsLocked(!isLocked)} color={isLocked ? "warning" : "default"}>
// // // // // //                 {isLocked ? <Lock /> : <LockOpen />}
// // // // // //               </IconButton>
// // // // // //             </Tooltip>
// // // // // //             <Tooltip title="Emergency Stop">
// // // // // //               <IconButton onClick={handleEmergencyStop} color="error" disabled={!isActive}>
// // // // // //                 <Stop />
// // // // // //               </IconButton>
// // // // // //             </Tooltip>
// // // // // //             <Tooltip title="Settings">
// // // // // //               <IconButton onClick={() => setSettingsOpen(true)}>
// // // // // //                 <Settings />
// // // // // //               </IconButton>
// // // // // //             </Tooltip>
// // // // // //           </Box>
// // // // // //         </Box>
// // // // // //       </Box>

// // // // // //       {/* Main Control Area */}
// // // // // //       <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
// // // // // //         {/* Current Value Display */}
// // // // // //         <Box textAlign="center" mb={3}>
// // // // // //           <Typography variant="h3" color={getValueColor()}>
// // // // // //             {currentValue.toFixed(precision)}
// // // // // //             <Typography component="span" variant="h5" color="textSecondary">
// // // // // //               {units}
// // // // // //             </Typography>
// // // // // //           </Typography>
// // // // // //           <Typography variant="body2" color="textSecondary">
// // // // // //             Current Value
// // // // // //           </Typography>
// // // // // //           {targetValue !== currentValue && (
// // // // // //             <Typography variant="body2" color="primary">
// // // // // //               Target: {targetValue.toFixed(precision)}
// // // // // //               {units}
// // // // // //             </Typography>
// // // // // //           )}
// // // // // //         </Box>

// // // // // //         {/* Progress Bar for Active Changes */}
// // // // // //         {isActive && (
// // // // // //           <Box mb={2}>
// // // // // //             <LinearProgress
// // // // // //               variant="determinate"
// // // // // //               value={
// // // // // //                 Math.abs(currentValue - targetValue) < 0.1
// // // // // //                   ? 100
// // // // // //                   : (Math.abs(currentValue - Math.min(currentValue, targetValue)) /
// // // // // //                       Math.abs(targetValue - Math.min(currentValue, targetValue))) *
// // // // // //                     100
// // // // // //               }
// // // // // //             />
// // // // // //             <Typography variant="caption" color="textSecondary" textAlign="center" display="block">
// // // // // //               Adjusting to target value...
// // // // // //             </Typography>
// // // // // //           </Box>
// // // // // //         )}

// // // // // //         {/* Main Slider */}
// // // // // //         <Box mb={3}>
// // // // // //           <Slider
// // // // // //             value={targetValue}
// // // // // //             onChange={handleSliderChange}
// // // // // //             onChangeCommitted={handleSliderCommit}
// // // // // //             min={minValue}
// // // // // //             max={maxValue}
// // // // // //             step={step}
// // // // // //             disabled={isLocked || !isConnected}
// // // // // //             marks={[
// // // // // //               { value: minValue, label: `${minValue}${units}` },
// // // // // //               { value: maxValue, label: `${maxValue}${units}` },
// // // // // //               ...(enableSafetyLimits
// // // // // //                 ? [
// // // // // //                     { value: safetyLimits.min, label: "Min Safe" },
// // // // // //                     { value: safetyLimits.max, label: "Max Safe" },
// // // // // //                   ]
// // // // // //                 : []),
// // // // // //               { value: criticalThreshold, label: "Critical" },
// // // // // //             ]}
// // // // // //             sx={{
// // // // // //               "& .MuiSlider-markLabel": {
// // // // // //                 fontSize: "0.75rem",
// // // // // //               },
// // // // // //               "& .MuiSlider-mark": {
// // // // // //                 backgroundColor: "currentColor",
// // // // // //               },
// // // // // //             }}
// // // // // //           />
// // // // // //         </Box>

// // // // // //         {/* Safety Limits Indicator */}
// // // // // //         {enableSafetyLimits && (
// // // // // //           <Alert
// // // // // //             severity={
// // // // // //               targetValue < safetyLimits.min || targetValue > safetyLimits.max
// // // // // //                 ? "error"
// // // // // //                 : targetValue > criticalThreshold
// // // // // //                   ? "warning"
// // // // // //                   : "info"
// // // // // //             }
// // // // // //             sx={{ mb: 2 }}
// // // // // //           >
// // // // // //             Safety Limits: {safetyLimits.min} - {safetyLimits.max}
// // // // // //             {units}
// // // // // //             {targetValue > criticalThreshold && " | Critical threshold exceeded!"}
// // // // // //           </Alert>
// // // // // //         )}

// // // // // //         {/* Preset Values */}
// // // // // //         <Box mb={2}>
// // // // // //           <Typography variant="subtitle2" gutterBottom>
// // // // // //             Quick Presets
// // // // // //           </Typography>
// // // // // //           <Box display="flex" gap={1} flexWrap="wrap">
// // // // // //             {presetValues.map((preset, index) => (
// // // // // //               <Button
// // // // // //                 key={index}
// // // // // //                 variant={targetValue === preset ? "contained" : "outlined"}
// // // // // //                 size="small"
// // // // // //                 onClick={() => handlePresetClick(preset)}
// // // // // //                 disabled={isLocked || !isConnected}
// // // // // //               >
// // // // // //                 {preset}
// // // // // //                 {units}
// // // // // //               </Button>
// // // // // //             ))}
// // // // // //           </Box>
// // // // // //         </Box>

// // // // // //         {/* Manual Input */}
// // // // // //         <Box mb={2}>
// // // // // //           <Box display="flex" alignItems="center" gap={1}>
// // // // // //             <Button
// // // // // //               variant="outlined"
// // // // // //               size="small"
// // // // // //               onClick={() => setShowManualInput(!showManualInput)}
// // // // // //               disabled={isLocked || !isConnected}
// // // // // //             >
// // // // // //               Manual Input
// // // // // //             </Button>
// // // // // //             {showManualInput && (
// // // // // //               <>
// // // // // //                 <TextField
// // // // // //                   size="small"
// // // // // //                   value={manualInput}
// // // // // //                   onChange={(e) => setManualInput(e.target.value)}
// // // // // //                   placeholder={`${minValue}-${maxValue}`}
// // // // // //                   InputProps={{
// // // // // //                     endAdornment: <InputAdornment position="end">{units}</InputAdornment>,
// // // // // //                   }}
// // // // // //                   sx={{ width: 120 }}
// // // // // //                 />
// // // // // //                 <Button variant="contained" size="small" onClick={handleManualInput}>
// // // // // //                   Apply
// // // // // //                 </Button>
// // // // // //               </>
// // // // // //             )}
// // // // // //           </Box>
// // // // // //         </Box>

// // // // // //         {/* Status Information */}
// // // // // //         <Box mt="auto">
// // // // // //           <Divider sx={{ mb: 2 }} />
// // // // // //           <Grid container spacing={2}>
// // // // // //             <Grid item xs={6}>
// // // // // //               <Typography variant="caption" color="textSecondary">
// // // // // //                 Last Update
// // // // // //               </Typography>
// // // // // //               <Typography variant="body2">{lastUpdateTime.toLocaleTimeString()}</Typography>
// // // // // //             </Grid>
// // // // // //             <Grid item xs={6}>
// // // // // //               <Typography variant="caption" color="textSecondary">
// // // // // //                 Connection
// // // // // //               </Typography>
// // // // // //               <Typography variant="body2" color={isConnected ? "success.main" : "error.main"}>
// // // // // //                 {isConnected ? "Online" : "Offline"}
// // // // // //               </Typography>
// // // // // //             </Grid>
// // // // // //           </Grid>
// // // // // //         </Box>
// // // // // //       </CardContent>

// // // // // //       {/* Confirmation Dialog */}
// // // // // //       <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
// // // // // //         <DialogTitle>
// // // // // //           <Box display="flex" alignItems="center" gap={1}>
// // // // // //             <Warning color="warning" />
// // // // // //             Confirm Critical Value
// // // // // //           </Box>
// // // // // //         </DialogTitle>
// // // // // //         <DialogContent>
// // // // // //           <Typography>
// // // // // //             You are about to set {controlParameter} to {pendingValue?.toFixed(precision)}
// // // // // //             {units}. This exceeds the critical threshold of {criticalThreshold}
// // // // // //             {units}.
// // // // // //           </Typography>
// // // // // //           <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
// // // // // //             Please confirm this action is intentional.
// // // // // //           </Typography>
// // // // // //         </DialogContent>
// // // // // //         <DialogActions>
// // // // // //           <Button
// // // // // //             onClick={() => {
// // // // // //               setConfirmDialogOpen(false)
// // // // // //               setPendingValue(null)
// // // // // //               setTargetValue(currentValue)
// // // // // //             }}
// // // // // //           >
// // // // // //             Cancel
// // // // // //           </Button>
// // // // // //           <Button
// // // // // //             onClick={() => {
// // // // // //               applyValue(pendingValue)
// // // // // //               setConfirmDialogOpen(false)
// // // // // //               setPendingValue(null)
// // // // // //             }}
// // // // // //             variant="contained"
// // // // // //             color="warning"
// // // // // //           >
// // // // // //             Confirm
// // // // // //           </Button>
// // // // // //         </DialogActions>
// // // // // //       </Dialog>

// // // // // //       {/* Settings Dialog */}
// // // // // //       <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
// // // // // //         <DialogTitle>Control Settings</DialogTitle>
// // // // // //         <DialogContent>
// // // // // //           <Box display="flex" flexDirection="column" gap={2} pt={1}>
// // // // // //             <FormControlLabel
// // // // // //               control={<Switch checked={autoMode} onChange={(e) => setAutoMode(e.target.checked)} />}
// // // // // //               label="Auto Mode"
// // // // // //             />
// // // // // //             <Typography variant="body2" color="textSecondary">
// // // // // //               Range: {minValue} - {maxValue}
// // // // // //               {units} | Step: {step}
// // // // // //               {units} | Ramp Rate: {rampRate}
// // // // // //               {units}/s
// // // // // //             </Typography>
// // // // // //             {enableLogging && (
// // // // // //               <Box>
// // // // // //                 <Typography variant="subtitle2" gutterBottom>
// // // // // //                   Recent History ({history.length} entries)
// // // // // //                 </Typography>
// // // // // //                 <Box maxHeight={200} overflow="auto">
// // // // // //                   {history
// // // // // //                     .slice(-10)
// // // // // //                     .reverse()
// // // // // //                     .map((entry, index) => (
// // // // // //                       <Typography key={index} variant="caption" display="block">
// // // // // //                         {entry.timestamp.toLocaleTimeString()}: {entry.value.toFixed(precision)}
// // // // // //                         {units}({entry.status})
// // // // // //                       </Typography>
// // // // // //                     ))}
// // // // // //                 </Box>
// // // // // //               </Box>
// // // // // //             )}
// // // // // //           </Box>
// // // // // //         </DialogContent>
// // // // // //         <DialogActions>
// // // // // //           <Button onClick={() => setSettingsOpen(false)}>Close</Button>
// // // // // //         </DialogActions>
// // // // // //       </Dialog>

// // // // // //       {/* Notification Snackbar */}
// // // // // //       <Snackbar
// // // // // //         open={notification.open}
// // // // // //         autoHideDuration={4000}
// // // // // //         onClose={() => setNotification({ ...notification, open: false })}
// // // // // //         anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
// // // // // //       >
// // // // // //         <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity}>
// // // // // //           {notification.message}
// // // // // //         </Alert>
// // // // // //       </Snackbar>
// // // // // //     </Card>
// // // // // //   )
// // // // // // }

// // // // // // export default SliderControlWidget

// // // // // // // "use client"

// // // // // // // import { useState, useEffect, useRef } from "react"
// // // // // // // import {
// // // // // // //   Card,
// // // // // // //   CardContent,
// // // // // // //   Typography,
// // // // // // //   Box,
// // // // // // //   Slider,
// // // // // // //   TextField,
// // // // // // //   Button,
// // // // // // //   IconButton,
// // // // // // //   Chip,
// // // // // // //   Dialog,
// // // // // // //   DialogTitle,
// // // // // // //   DialogContent,
// // // // // // //   DialogActions,
// // // // // // //   Switch,
// // // // // // //   FormControlLabel,
// // // // // // //   Alert,
// // // // // // //   Tooltip,
// // // // // // //   LinearProgress,
// // // // // // //   Divider,
// // // // // // //   Grid,
// // // // // // //   InputAdornment,
// // // // // // //   Snackbar,
// // // // // // // } from "@mui/material"
// // // // // // // import { Settings, Stop, Warning, CheckCircle, Error, Lock, LockOpen, TrendingUp } from "@mui/icons-material"

// // // // // // // const SliderControlWidget = ({ widget, onConfigChange, devices = [] }) => {
// // // // // // //   // Widget configuration
// // // // // // //   const config = widget?.config || {}
// // // // // // //   const [title] = useState(config.title || "Device Control")
// // // // // // //   const [deviceId] = useState(config.deviceId || null)
// // // // // // //   const [controlParameter] = useState(config.controlParameter || "setpoint")

// // // // // // //   // Control states
// // // // // // //   const [currentValue, setCurrentValue] = useState(config.defaultValue || 50)
// // // // // // //   const [targetValue, setTargetValue] = useState(config.defaultValue || 50)
// // // // // // //   const [isActive, setIsActive] = useState(false)
// // // // // // //   const [isLocked, setIsLocked] = useState(false)
// // // // // // //   const [isConnected, setIsConnected] = useState(true)
// // // // // // //   const [lastUpdateTime, setLastUpdateTime] = useState(new Date())

// // // // // // //   // Configuration
// // // // // // //   const [minValue] = useState(config.minValue || 0)
// // // // // // //   const [maxValue] = useState(config.maxValue || 100)
// // // // // // //   const [step] = useState(config.step || 1)
// // // // // // //   const [units] = useState(config.units || "%")
// // // // // // //   const [precision] = useState(config.precision || 1)
// // // // // // //   const [safetyLimits] = useState(config.safetyLimits || { min: 10, max: 90 })
// // // // // // //   const [criticalThreshold] = useState(config.criticalThreshold || 80)

// // // // // // //   // UI states
// // // // // // //   const [settingsOpen, setSettingsOpen] = useState(false)
// // // // // // //   const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
// // // // // // //   const [pendingValue, setPendingValue] = useState(null)
// // // // // // //   const [manualInput, setManualInput] = useState("")
// // // // // // //   const [showManualInput, setShowManualInput] = useState(false)
// // // // // // //   const [presetValues] = useState(config.presets || [0, 25, 50, 75, 100])
// // // // // // //   const [history, setHistory] = useState([])
// // // // // // //   const [notification, setNotification] = useState({ open: false, message: "", severity: "info" })

// // // // // // //   // Advanced features
// // // // // // //   const [autoMode, setAutoMode] = useState(false)
// // // // // // //   const [rampRate] = useState(config.rampRate || 5) // units per second
// // // // // // //   const [enableSafetyLimits] = useState(config.enableSafetyLimits !== false)
// // // // // // //   const [requireConfirmation] = useState(config.requireConfirmation !== false)
// // // // // // //   const [enableLogging] = useState(config.enableLogging !== false)

// // // // // // //   // Refs
// // // // // // //   const rampIntervalRef = useRef(null)
// // // // // // //   const historyIntervalRef = useRef(null)

// // // // // // //   // Initialize component
// // // // // // //   useEffect(() => {
// // // // // // //     // Simulate device connection
// // // // // // //     const connectionInterval = setInterval(() => {
// // // // // // //       setIsConnected(Math.random() > 0.1) // 90% uptime simulation
// // // // // // //     }, 5000)

// // // // // // //     // Start history logging
// // // // // // //     if (enableLogging) {
// // // // // // //       historyIntervalRef.current = setInterval(() => {
// // // // // // //         setHistory((prev) => {
// // // // // // //           const newEntry = {
// // // // // // //             timestamp: new Date(),
// // // // // // //             value: currentValue,
// // // // // // //             target: targetValue,
// // // // // // //             status: isActive ? "active" : "idle",
// // // // // // //           }
// // // // // // //           return [...prev.slice(-99), newEntry] // Keep last 100 entries
// // // // // // //         })
// // // // // // //       }, 10000) // Log every 10 seconds
// // // // // // //     }

// // // // // // //     return () => {
// // // // // // //       clearInterval(connectionInterval)
// // // // // // //       if (historyIntervalRef.current) {
// // // // // // //         clearInterval(historyIntervalRef.current)
// // // // // // //       }
// // // // // // //       if (rampIntervalRef.current) {
// // // // // // //         clearInterval(rampIntervalRef.current)
// // // // // // //       }
// // // // // // //     }
// // // // // // //   }, [currentValue, targetValue, isActive, enableLogging])

// // // // // // //   // Handle value ramping
// // // // // // //   useEffect(() => {
// // // // // // //     if (isActive && currentValue !== targetValue && !autoMode) {
// // // // // // //       rampIntervalRef.current = setInterval(() => {
// // // // // // //         setCurrentValue((prev) => {
// // // // // // //           const diff = targetValue - prev
// // // // // // //           const increment = Math.sign(diff) * Math.min(Math.abs(diff), rampRate / 10)
// // // // // // //           const newValue = prev + increment

// // // // // // //           // Check if we've reached the target
// // // // // // //           if (Math.abs(newValue - targetValue) < 0.1) {
// // // // // // //             clearInterval(rampIntervalRef.current)
// // // // // // //             setIsActive(false)
// // // // // // //             showNotification("Target value reached", "success")
// // // // // // //             return targetValue
// // // // // // //           }

// // // // // // //           return newValue
// // // // // // //         })
// // // // // // //       }, 100) // Update every 100ms for smooth ramping
// // // // // // //     }

// // // // // // //     return () => {
// // // // // // //       if (rampIntervalRef.current) {
// // // // // // //         clearInterval(rampIntervalRef.current)
// // // // // // //       }
// // // // // // //     }
// // // // // // //   }, [isActive, targetValue, rampRate, autoMode])

// // // // // // //   const showNotification = (message, severity = "info") => {
// // // // // // //     setNotification({ open: true, message, severity })
// // // // // // //   }

// // // // // // //   const handleSliderChange = (event, newValue) => {
// // // // // // //     if (isLocked) {
// // // // // // //       showNotification("Control is locked", "warning")
// // // // // // //       return
// // // // // // //     }

// // // // // // //     setTargetValue(newValue)
// // // // // // //   }

// // // // // // //   const handleSliderCommit = (event, newValue) => {
// // // // // // //     if (isLocked) return

// // // // // // //     // Check safety limits
// // // // // // //     if (enableSafetyLimits) {
// // // // // // //       if (newValue < safetyLimits.min || newValue > safetyLimits.max) {
// // // // // // //         showNotification(`Value outside safety limits (${safetyLimits.min}-${safetyLimits.max})`, "error")
// // // // // // //         setTargetValue(currentValue) // Reset to current value
// // // // // // //         return
// // // // // // //       }
// // // // // // //     }

// // // // // // //     // Check if confirmation is required for critical values
// // // // // // //     if (requireConfirmation && newValue > criticalThreshold) {
// // // // // // //       setPendingValue(newValue)
// // // // // // //       setConfirmDialogOpen(true)
// // // // // // //       return
// // // // // // //     }

// // // // // // //     applyValue(newValue)
// // // // // // //   }

// // // // // // //   const applyValue = (value) => {
// // // // // // //     if (!isConnected) {
// // // // // // //       showNotification("Device not connected", "error")
// // // // // // //       return
// // // // // // //     }

// // // // // // //     setTargetValue(value)
// // // // // // //     setIsActive(true)
// // // // // // //     setLastUpdateTime(new Date())
// // // // // // //     showNotification(`Setting ${controlParameter} to ${value.toFixed(precision)}${units}`, "info")

// // // // // // //     // Simulate sending command to device
// // // // // // //     console.log(`Sending command: ${controlParameter} = ${value}`)
// // // // // // //   }

// // // // // // //   const handleManualInput = () => {
// // // // // // //     const value = Number.parseFloat(manualInput)
// // // // // // //     if (isNaN(value)) {
// // // // // // //       showNotification("Invalid input value", "error")
// // // // // // //       return
// // // // // // //     }

// // // // // // //     if (value < minValue || value > maxValue) {
// // // // // // //       showNotification(`Value must be between ${minValue} and ${maxValue}`, "error")
// // // // // // //       return
// // // // // // //     }

// // // // // // //     handleSliderCommit(null, value)
// // // // // // //     setManualInput("")
// // // // // // //     setShowManualInput(false)
// // // // // // //   }

// // // // // // //   const handlePresetClick = (presetValue) => {
// // // // // // //     if (isLocked) {
// // // // // // //       showNotification("Control is locked", "warning")
// // // // // // //       return
// // // // // // //     }
// // // // // // //     handleSliderCommit(null, presetValue)
// // // // // // //   }

// // // // // // //   const handleEmergencyStop = () => {
// // // // // // //     setIsActive(false)
// // // // // // //     setTargetValue(currentValue)
// // // // // // //     if (rampIntervalRef.current) {
// // // // // // //       clearInterval(rampIntervalRef.current)
// // // // // // //     }
// // // // // // //     showNotification("Emergency stop activated", "warning")
// // // // // // //   }

// // // // // // //   const getValueColor = () => {
// // // // // // //     if (!isConnected) return "error"
// // // // // // //     if (currentValue > criticalThreshold) return "warning"
// // // // // // //     if (isActive) return "primary"
// // // // // // //     return "success"
// // // // // // //   }

// // // // // // //   const getStatusText = () => {
// // // // // // //     if (!isConnected) return "Disconnected"
// // // // // // //     if (isActive) return "Adjusting"
// // // // // // //     if (isLocked) return "Locked"
// // // // // // //     return "Ready"
// // // // // // //   }

// // // // // // //   return (
// // // // // // //     <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
// // // // // // //       {/* Header */}
// // // // // // //       <Box p={2} borderBottom="1px solid #e0e0e0">
// // // // // // //         <Box display="flex" justifyContent="space-between" alignItems="center">
// // // // // // //           <Box>
// // // // // // //             <Typography variant="h6">{title}</Typography>
// // // // // // //             <Box display="flex" alignItems="center" gap={1} mt={0.5}>
// // // // // // //               <Chip
// // // // // // //                 size="small"
// // // // // // //                 label={getStatusText()}
// // // // // // //                 color={getValueColor()}
// // // // // // //                 icon={isConnected ? <CheckCircle /> : <Error />}
// // // // // // //               />
// // // // // // //               {isActive && <Chip size="small" label="ACTIVE" color="primary" icon={<TrendingUp />} />}
// // // // // // //               {isLocked && <Chip size="small" label="LOCKED" color="warning" icon={<Lock />} />}
// // // // // // //             </Box>
// // // // // // //           </Box>
// // // // // // //           <Box display="flex" gap={1}>
// // // // // // //             <Tooltip title={isLocked ? "Unlock Control" : "Lock Control"}>
// // // // // // //               <IconButton onClick={() => setIsLocked(!isLocked)} color={isLocked ? "warning" : "default"}>
// // // // // // //                 {isLocked ? <Lock /> : <LockOpen />}
// // // // // // //               </IconButton>
// // // // // // //             </Tooltip>
// // // // // // //             <Tooltip title="Emergency Stop">
// // // // // // //               <IconButton onClick={handleEmergencyStop} color="error" disabled={!isActive}>
// // // // // // //                 <Stop />
// // // // // // //               </IconButton>
// // // // // // //             </Tooltip>
// // // // // // //             <Tooltip title="Settings">
// // // // // // //               <IconButton onClick={() => setSettingsOpen(true)}>
// // // // // // //                 <Settings />
// // // // // // //               </IconButton>
// // // // // // //             </Tooltip>
// // // // // // //           </Box>
// // // // // // //         </Box>
// // // // // // //       </Box>

// // // // // // //       {/* Main Control Area */}
// // // // // // //       <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
// // // // // // //         {/* Current Value Display */}
// // // // // // //         <Box textAlign="center" mb={3}>
// // // // // // //           <Typography variant="h3" color={getValueColor()}>
// // // // // // //             {currentValue.toFixed(precision)}
// // // // // // //             <Typography component="span" variant="h5" color="textSecondary">
// // // // // // //               {units}
// // // // // // //             </Typography>
// // // // // // //           </Typography>
// // // // // // //           <Typography variant="body2" color="textSecondary">
// // // // // // //             Current Value
// // // // // // //           </Typography>
// // // // // // //           {targetValue !== currentValue && (
// // // // // // //             <Typography variant="body2" color="primary">
// // // // // // //               Target: {targetValue.toFixed(precision)}
// // // // // // //               {units}
// // // // // // //             </Typography>
// // // // // // //           )}
// // // // // // //         </Box>

// // // // // // //         {/* Progress Bar for Active Changes */}
// // // // // // //         {isActive && (
// // // // // // //           <Box mb={2}>
// // // // // // //             <LinearProgress
// // // // // // //               variant="determinate"
// // // // // // //               value={
// // // // // // //                 Math.abs(currentValue - targetValue) < 0.1
// // // // // // //                   ? 100
// // // // // // //                   : (Math.abs(currentValue - Math.min(currentValue, targetValue)) /
// // // // // // //                       Math.abs(targetValue - Math.min(currentValue, targetValue))) *
// // // // // // //                     100
// // // // // // //               }
// // // // // // //             />
// // // // // // //             <Typography variant="caption" color="textSecondary" textAlign="center" display="block">
// // // // // // //               Adjusting to target value...
// // // // // // //             </Typography>
// // // // // // //           </Box>
// // // // // // //         )}

// // // // // // //         {/* Main Slider */}
// // // // // // //         <Box mb={3}>
// // // // // // //           <Slider
// // // // // // //             value={targetValue}
// // // // // // //             onChange={handleSliderChange}
// // // // // // //             onChangeCommitted={handleSliderCommit}
// // // // // // //             min={minValue}
// // // // // // //             max={maxValue}
// // // // // // //             step={step}
// // // // // // //             disabled={isLocked || !isConnected}
// // // // // // //             marks={[
// // // // // // //               { value: minValue, label: `${minValue}${units}` },
// // // // // // //               { value: maxValue, label: `${maxValue}${units}` },
// // // // // // //               ...(enableSafetyLimits
// // // // // // //                 ? [
// // // // // // //                     { value: safetyLimits.min, label: "Min Safe" },
// // // // // // //                     { value: safetyLimits.max, label: "Max Safe" },
// // // // // // //                   ]
// // // // // // //                 : []),
// // // // // // //               { value: criticalThreshold, label: "Critical" },
// // // // // // //             ]}
// // // // // // //             sx={{
// // // // // // //               "& .MuiSlider-markLabel": {
// // // // // // //                 fontSize: "0.75rem",
// // // // // // //               },
// // // // // // //               "& .MuiSlider-mark": {
// // // // // // //                 backgroundColor: "currentColor",
// // // // // // //               },
// // // // // // //             }}
// // // // // // //           />
// // // // // // //         </Box>

// // // // // // //         {/* Safety Limits Indicator */}
// // // // // // //         {enableSafetyLimits && (
// // // // // // //           <Alert
// // // // // // //             severity={
// // // // // // //               targetValue < safetyLimits.min || targetValue > safetyLimits.max
// // // // // // //                 ? "error"
// // // // // // //                 : targetValue > criticalThreshold
// // // // // // //                   ? "warning"
// // // // // // //                   : "info"
// // // // // // //             }
// // // // // // //             sx={{ mb: 2 }}
// // // // // // //           >
// // // // // // //             Safety Limits: {safetyLimits.min} - {safetyLimits.max}
// // // // // // //             {units}
// // // // // // //             {targetValue > criticalThreshold && " | Critical threshold exceeded!"}
// // // // // // //           </Alert>
// // // // // // //         )}

// // // // // // //         {/* Preset Values */}
// // // // // // //         <Box mb={2}>
// // // // // // //           <Typography variant="subtitle2" gutterBottom>
// // // // // // //             Quick Presets
// // // // // // //           </Typography>
// // // // // // //           <Box display="flex" gap={1} flexWrap="wrap">
// // // // // // //             {presetValues.map((preset, index) => (
// // // // // // //               <Button
// // // // // // //                 key={index}
// // // // // // //                 variant={targetValue === preset ? "contained" : "outlined"}
// // // // // // //                 size="small"
// // // // // // //                 onClick={() => handlePresetClick(preset)}
// // // // // // //                 disabled={isLocked || !isConnected}
// // // // // // //               >
// // // // // // //                 {preset}
// // // // // // //                 {units}
// // // // // // //               </Button>
// // // // // // //             ))}
// // // // // // //           </Box>
// // // // // // //         </Box>

// // // // // // //         {/* Manual Input */}
// // // // // // //         <Box mb={2}>
// // // // // // //           <Box display="flex" alignItems="center" gap={1}>
// // // // // // //             <Button
// // // // // // //               variant="outlined"
// // // // // // //               size="small"
// // // // // // //               onClick={() => setShowManualInput(!showManualInput)}
// // // // // // //               disabled={isLocked || !isConnected}
// // // // // // //             >
// // // // // // //               Manual Input
// // // // // // //             </Button>
// // // // // // //             {showManualInput && (
// // // // // // //               <>
// // // // // // //                 <TextField
// // // // // // //                   size="small"
// // // // // // //                   value={manualInput}
// // // // // // //                   onChange={(e) => setManualInput(e.target.value)}
// // // // // // //                   placeholder={`${minValue}-${maxValue}`}
// // // // // // //                   InputProps={{
// // // // // // //                     endAdornment: <InputAdornment position="end">{units}</InputAdornment>,
// // // // // // //                   }}
// // // // // // //                   sx={{ width: 120 }}
// // // // // // //                 />
// // // // // // //                 <Button variant="contained" size="small" onClick={handleManualInput}>
// // // // // // //                   Apply
// // // // // // //                 </Button>
// // // // // // //               </>
// // // // // // //             )}
// // // // // // //           </Box>
// // // // // // //         </Box>

// // // // // // //         {/* Status Information */}
// // // // // // //         <Box mt="auto">
// // // // // // //           <Divider sx={{ mb: 2 }} />
// // // // // // //           <Grid container spacing={2}>
// // // // // // //             <Grid item xs={6}>
// // // // // // //               <Typography variant="caption" color="textSecondary">
// // // // // // //                 Last Update
// // // // // // //               </Typography>
// // // // // // //               <Typography variant="body2">{lastUpdateTime.toLocaleTimeString()}</Typography>
// // // // // // //             </Grid>
// // // // // // //             <Grid item xs={6}>
// // // // // // //               <Typography variant="caption" color="textSecondary">
// // // // // // //                 Connection
// // // // // // //               </Typography>
// // // // // // //               <Typography variant="body2" color={isConnected ? "success.main" : "error.main"}>
// // // // // // //                 {isConnected ? "Online" : "Offline"}
// // // // // // //               </Typography>
// // // // // // //             </Grid>
// // // // // // //           </Grid>
// // // // // // //         </Box>
// // // // // // //       </CardContent>

// // // // // // //       {/* Confirmation Dialog */}
// // // // // // //       <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
// // // // // // //         <DialogTitle>
// // // // // // //           <Box display="flex" alignItems="center" gap={1}>
// // // // // // //             <Warning color="warning" />
// // // // // // //             Confirm Critical Value
// // // // // // //           </Box>
// // // // // // //         </DialogTitle>
// // // // // // //         <DialogContent>
// // // // // // //           <Typography>
// // // // // // //             You are about to set {controlParameter} to {pendingValue?.toFixed(precision)}
// // // // // // //             {units}. This exceeds the critical threshold of {criticalThreshold}
// // // // // // //             {units}.
// // // // // // //           </Typography>
// // // // // // //           <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
// // // // // // //             Please confirm this action is intentional.
// // // // // // //           </Typography>
// // // // // // //         </DialogContent>
// // // // // // //         <DialogActions>
// // // // // // //           <Button
// // // // // // //             onClick={() => {
// // // // // // //               setConfirmDialogOpen(false)
// // // // // // //               setPendingValue(null)
// // // // // // //               setTargetValue(currentValue)
// // // // // // //             }}
// // // // // // //           >
// // // // // // //             Cancel
// // // // // // //           </Button>
// // // // // // //           <Button
// // // // // // //             onClick={() => {
// // // // // // //               applyValue(pendingValue)
// // // // // // //               setConfirmDialogOpen(false)
// // // // // // //               setPendingValue(null)
// // // // // // //             }}
// // // // // // //             variant="contained"
// // // // // // //             color="warning"
// // // // // // //           >
// // // // // // //             Confirm
// // // // // // //           </Button>
// // // // // // //         </DialogActions>
// // // // // // //       </Dialog>

// // // // // // //       {/* Settings Dialog */}
// // // // // // //       <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
// // // // // // //         <DialogTitle>Control Settings</DialogTitle>
// // // // // // //         <DialogContent>
// // // // // // //           <Box display="flex" flexDirection="column" gap={2} pt={1}>
// // // // // // //             <FormControlLabel
// // // // // // //               control={<Switch checked={autoMode} onChange={(e) => setAutoMode(e.target.checked)} />}
// // // // // // //               label="Auto Mode"
// // // // // // //             />
// // // // // // //             <Typography variant="body2" color="textSecondary">
// // // // // // //               Range: {minValue} - {maxValue}
// // // // // // //               {units} | Step: {step}
// // // // // // //               {units} | Ramp Rate: {rampRate}
// // // // // // //               {units}/s
// // // // // // //             </Typography>
// // // // // // //             {enableLogging && (
// // // // // // //               <Box>
// // // // // // //                 <Typography variant="subtitle2" gutterBottom>
// // // // // // //                   Recent History ({history.length} entries)
// // // // // // //                 </Typography>
// // // // // // //                 <Box maxHeight={200} overflow="auto">
// // // // // // //                   {history
// // // // // // //                     .slice(-10)
// // // // // // //                     .reverse()
// // // // // // //                     .map((entry, index) => (
// // // // // // //                       <Typography key={index} variant="caption" display="block">
// // // // // // //                         {entry.timestamp.toLocaleTimeString()}: {entry.value.toFixed(precision)}
// // // // // // //                         {units}({entry.status})
// // // // // // //                       </Typography>
// // // // // // //                     ))}
// // // // // // //                 </Box>
// // // // // // //               </Box>
// // // // // // //             )}
// // // // // // //           </Box>
// // // // // // //         </DialogContent>
// // // // // // //         <DialogActions>
// // // // // // //           <Button onClick={() => setSettingsOpen(false)}>Close</Button>
// // // // // // //         </DialogActions>
// // // // // // //       </Dialog>

// // // // // // //       {/* Notification Snackbar */}
// // // // // // //       <Snackbar
// // // // // // //         open={notification.open}
// // // // // // //         autoHideDuration={4000}
// // // // // // //         onClose={() => setNotification({ ...notification, open: false })}
// // // // // // //         anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
// // // // // // //       >
// // // // // // //         <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity}>
// // // // // // //           {notification.message}
// // // // // // //         </Alert>
// // // // // // //       </Snackbar>
// // // // // // //     </Card>
// // // // // // //   )
// // // // // // // }

// // // // // // // export default SliderControlWidget
