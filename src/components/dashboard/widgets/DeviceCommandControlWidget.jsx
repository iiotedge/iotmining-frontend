"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material"
import {
  Send as SendIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Code as CodeIcon,
} from "@mui/icons-material"
import { useTheme } from "../../theme/ThemeProvider"
import "../../../styles/widget/device-command-control-widget.css"

const DEFAULT_COMMANDS = [
  {
    id: "set_fan_level",
    name: "Set Fan Level",
    description: "Control fan speed level",
    commandValue: "set_fan_level",
    parameters: [
      {
        key: "level",
        label: "Fan Level",
        type: "select",
        required: true,
        options: [
          { value: "1", label: "Level 1 (Low)" },
          { value: "2", label: "Level 2 (Medium)" },
          { value: "3", label: "Level 3 (High)" },
          { value: "4", label: "Level 4 (Max)" },
          { value: "5", label: "Level 5 (Extreme)" },
        ],
        defaultValue: "1",
      },
    ],
  },
  {
    id: "fan_auto",
    name: "Turn Fan On (Auto Mode)",
    description: "Turn on the fan auto mode",
    commandValue: "fan_auto",
    parameters: [],
  },
  {
    id: "fan_on",
    name: "Turn Fan On",
    description: "Turn on the all fan completely",
    commandValue: "fan_on",
    parameters: [],
  },
  {
    id: "fan_off",
    name: "Turn Fan Off",
    description: "Turn off the fan completely",
    commandValue: "fan_off",
    parameters: [],
  },
  {
    id: "reset_lock",
    name: "Reset Lock",
    description: "Reset lock with new passcode",
    commandValue: "reset_lock",
    parameters: [
      {
        key: "new_pass",
        label: "New Passcode",
        type: "number",
        required: true,
        min: 1000,
        max: 9999,
        placeholder: "Enter 4-digit passcode",
        helperText: "Must be a 4-digit number (1000-9999)",
      },
    ],
  },
  {
    id: "reset_alarm",
    name: "Reset Alarm",
    description: "Reset triggered alarm (fire or water)",
    commandValue: "reset_alarm",
    parameters: [
      {
        key: "type",
        label: "Alarm Type",
        type: "select",
        required: true,
        options: [
          { value: "fire", label: "Fire Alarm" },
          { value: "water", label: "Water Alarm" }
        ],
        defaultValue: "fire"
      }
    ]
  }
]

const DeviceCommandControlWidget = ({
  widget = {},
  sendMqttCommand,
  dataSource = {},
  mqttConnected = true,
  isMqttSending = false,
  onConfigChange,
}) => {
  const config = widget?.config || {}
  const {
    title = "Device Control Command",
    commands = DEFAULT_COMMANDS,
    showLastResponse = true,
    showJsonPreview = false,
    confirmBeforeSend = false,
    resetAfterSend = true,
  } = config

  const { isDarkMode, primaryColor, tokens } = useTheme()
  const commandList = Array.isArray(commands) ? commands : []

  const [selectedCommand, setSelectedCommand] = useState("")
  const [parameterValues, setParameterValues] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState({ open: false, message: "", severity: "info" })
  const [lastResponse, setLastResponse] = useState(null)

  useEffect(() => {
    if (selectedCommand) {
      const command = commandList.find((cmd) => cmd.id === selectedCommand)
      if (command) {
        const initialValues = {}
        Array.isArray(command.parameters) && command.parameters.forEach((param) => {
          initialValues[param.key] = param.defaultValue ?? getDefaultValue(param.type)
        })
        setParameterValues(initialValues)
      }
    } else {
      setParameterValues({})
    }
  }, [selectedCommand, JSON.stringify(commandList)])

  function getDefaultValue(type) {
    switch (type) {
      case "boolean": return false
      case "number": return ""
      case "array": return ""
      default: return ""
    }
  }

  const handleCommandChange = (event) => setSelectedCommand(event.target.value)
  const handleParameterChange = (paramKey, value) => setParameterValues((prev) => ({
    ...prev,
    [paramKey]: value,
  }))

  const buildJsonPayload = () => {
    const command = commandList.find((cmd) => cmd.id === selectedCommand)
    if (!command) return {}
    const payload = { command: command.commandValue || command.name }
    Array.isArray(command.parameters) && command.parameters.forEach((param) => {
      const value = parameterValues[param.key]
      if (value !== undefined && value !== "") {
        switch (param.type) {
          case "number": payload[param.key] = Number(value); break
          case "boolean": payload[param.key] = value === true || value === "true"; break
          case "array":
            if (typeof value === "string") {
              try { payload[param.key] = JSON.parse(value) }
              catch { payload[param.key] = value.split(",").map((item) => item.trim()) }
            } else {
              payload[param.key] = value
            }
            break
          default: payload[param.key] = value
        }
      }
    })
    return payload
  }

  const validateParameters = () => {
    const command = commandList.find((cmd) => cmd.id === selectedCommand)
    if (!command) return { isValid: false, errors: ["No command selected"] }
    const errors = []
    Array.isArray(command.parameters) && command.parameters.forEach((param) => {
      const value = parameterValues[param.key]
      if (param.required && (value === undefined || value === "" || value === null)) {
        errors.push(`${param.label || param.key} is required`)
        return
      }
      if (value !== undefined && value !== "") {
        switch (param.type) {
          case "number":
            const numValue = Number(value)
            if (isNaN(numValue)) errors.push(`${param.label || param.key} must be a valid number`)
            else {
              if (param.min !== undefined && numValue < param.min) errors.push(`${param.label || param.key} must be at least ${param.min}`)
              if (param.max !== undefined && numValue > param.max) errors.push(`${param.label || param.key} must be at most ${param.max}`)
            }
            break
          case "string":
            if (param.minLength && value.length < param.minLength) errors.push(`${param.label || param.key} must be at least ${param.minLength} characters`)
            if (param.maxLength && value.length > param.maxLength) errors.push(`${param.label || param.key} must be at most ${param.maxLength} characters`)
            if (param.pattern) {
              try {
                const regex = new RegExp(param.pattern)
                if (!regex.test(value)) errors.push(`${param.label || param.key} format is invalid`)
              } catch {}
            }
            break
          default: break
        }
      }
    })
    return { isValid: errors.length === 0, errors }
  }

  const handleSendCommand = async () => {
    if (!selectedCommand) return showNotification("Please select a command", "warning")
    if (typeof sendMqttCommand !== "function") return showNotification("MQTT not available", "error")
    if (!mqttConnected) return showNotification("MQTT not connected", "error")
    if (isMqttSending || isLoading) return showNotification("Previous command still sending", "info")
    const validation = validateParameters()
    if (!validation.isValid) return showNotification(validation.errors.join(", "), "error")

    if (confirmBeforeSend) {
      const confirmed = window.confirm("Are you sure you want to send this command?")
      if (!confirmed) return
    }

    setIsLoading(true)
    try {
      const payload = buildJsonPayload()
      await sendMqttCommand(payload)
      setLastResponse({
        success: true,
        data: { sent: true },
        timestamp: new Date().toISOString(),
      })
      showNotification("Command sent successfully!", "success")
      if (resetAfterSend) {
        setSelectedCommand("")
        setParameterValues({})
      }
    } catch (error) {
      setLastResponse({
        success: false,
        error: error?.message || "MQTT Send Error",
        timestamp: new Date().toISOString(),
      })
      showNotification(`MQTT send error: ${error?.message || "Unknown"}`, "error")
    } finally {
      setIsLoading(false)
    }
  }

  const showNotification = (message, severity) => setNotification({ open: true, message, severity })
  const handleCloseNotification = () => setNotification({ ...notification, open: false })

  const handleConfigureWidget = () => {
    if (typeof onConfigChange === "function") onConfigChange(widget)
    else showNotification("Configuration not available. Please implement onConfigChange in your dashboard.", "warning")
  }

  const handleWidgetRefresh = () => {
    setSelectedCommand("")
    setParameterValues({})
    setLastResponse(null)
    setNotification({ open: false, message: "", severity: "info" })
  }

  const renderParameterInput = (parameter) => {
    const value = parameterValues[parameter.key] ?? getDefaultValue(parameter.type)
    const labelProps = { sx: { color: tokens.colorTextSecondary + " !important" } }
    const textFieldCommon = {
      fullWidth: true,
      label: parameter.label,
      value,
      onChange: (e) => handleParameterChange(parameter.key, e.target.value),
      placeholder: parameter.placeholder,
      required: parameter.required,
      helperText: parameter.helperText,
      size: "small",
      variant: "outlined",
      sx: {
        mt: 1, mb: 1,
        background: tokens.colorBgElevated,
        borderRadius: 2,
        '& label': { color: tokens.colorTextSecondary + " !important" },
        '& .MuiInputBase-root': { color: tokens.colorText + " !important" }
      },
      InputLabelProps: labelProps
    }
    switch (parameter.type) {
      case "number":
        return (
          <TextField
            {...textFieldCommon}
            type="number"
            inputProps={{
              min: parameter.min,
              max: parameter.max,
              step: parameter.step || 1,
              style: { color: tokens.colorText }
            }}
          />
        )
      case "boolean":
        return (
          <FormControlLabel
            key={parameter.key}
            control={
              <Switch
                checked={!!value}
                onChange={(e) => handleParameterChange(parameter.key, e.target.checked)}
                color="primary"
              />
            }
            label={parameter.label}
            sx={{
              my: 1,
              '& .MuiFormControlLabel-label': { color: tokens.colorText + " !important" }
            }}
          />
        )
      case "select":
        return (
          <FormControl key={parameter.key} fullWidth size="small" sx={{ my: 1 }}>
            <InputLabel sx={{ color: tokens.colorTextSecondary + " !important" }}>
              {parameter.label}
            </InputLabel>
            <Select
              value={value}
              label={parameter.label}
              onChange={(e) => handleParameterChange(parameter.key, e.target.value)}
              required={parameter.required}
              sx={{
                background: tokens.colorBgElevated,
                borderRadius: 2,
                color: tokens.colorText + " !important",
                '& .MuiSelect-select': { color: tokens.colorText + " !important" }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    background: tokens.colorBgElevated,
                    color: tokens.colorText + " !important",
                  }
                }
              }}
            >
              {(parameter.options || []).map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                  sx={{
                    color: tokens.colorText + " !important",
                    background: isDarkMode ? tokens.colorBgElevated : "#fff",
                    '&.Mui-selected': {
                      background: tokens.colorPrimaryBg + " !important",
                      color: tokens.colorText + " !important",
                    }
                  }}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )
      case "textarea":
        return (
          <TextField
            {...textFieldCommon}
            multiline
            rows={3}
          />
        )
      default:
        return (
          <TextField
            {...textFieldCommon}
          />
        )
    }
  }

  const selectedCommandObj = commandList.find((cmd) => cmd.id === selectedCommand)
  const bgColor = tokens.colorBgContainer
  const cardBorder = tokens.colorBorder
  const textColor = tokens.colorText
  const subTextColor = tokens.colorTextSecondary

  return (
    <Card
      className="device-command-control-widget"
      sx={{
        minWidth: 340,
        borderRadius: 3,
        background: bgColor,
        border: `1.5px solid ${cardBorder}`,
        boxShadow: tokens.boxShadow,
        color: textColor,
      }}
      variant="outlined"
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ color: textColor }}>
            {title}
          </Typography>
          <Box>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={handleWidgetRefresh} sx={{ color: subTextColor }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Configure Widget">
              <IconButton size="small" onClick={handleConfigureWidget} sx={{ color: subTextColor }}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {commandList.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2, background: tokens.colorInfoBg, color: textColor }}>
            No commands configured. Please configure commands in widget settings.
          </Alert>
        ) : (
          <>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel sx={{ color: subTextColor + " !important" }}>Select Command</InputLabel>
              <Select
                value={selectedCommand}
                label="Select Command"
                onChange={handleCommandChange}
                sx={{
                  background: tokens.colorBgElevated,
                  borderRadius: 2,
                  color: textColor + " !important",
                  '& .MuiSelect-select': { color: textColor + " !important" }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      background: tokens.colorBgElevated,
                      color: textColor + " !important",
                    }
                  }
                }}
              >
                {commandList.map((command) => (
                  <MenuItem
                    key={command.id}
                    value={command.id}
                    sx={{
                      color: textColor + " !important",
                      background: isDarkMode ? tokens.colorBgElevated : "#fff",
                      '&.Mui-selected': {
                        background: tokens.colorPrimaryBg + " !important",
                        color: textColor + " !important",
                      }
                    }}
                  >
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <Typography sx={{ color: textColor, fontWeight: 600 }}>{command.name}</Typography>
                      {command.description && (
                        <Typography variant="caption" sx={{ color: subTextColor }}>
                          {command.description}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedCommandObj && Array.isArray(selectedCommandObj.parameters) && selectedCommandObj.parameters.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: subTextColor, fontWeight: 600, mb: 1 }}>
                  Parameters
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {selectedCommandObj.parameters.map((parameter) => renderParameterInput(parameter))}
                </Box>
              </Box>
            )}

            {showJsonPreview && selectedCommand && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: subTextColor, display: "flex", alignItems: "center", gap: 1 }}>
                  <CodeIcon fontSize="small" />
                  JSON Preview
                </Typography>
                <Box
                  sx={{
                    background: isDarkMode ? "#202026" : "#fafbfc",
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 2,
                    p: 1.2,
                    fontFamily: "monospace",
                    fontSize: 13,
                    mb: 1,
                    whiteSpace: "pre",
                    color: textColor,
                  }}
                >
                  {JSON.stringify(buildJsonPayload(), null, 2)}
                </Box>
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              onClick={handleSendCommand}
              disabled={
                !selectedCommand ||
                isLoading ||
                typeof sendMqttCommand !== "function" ||
                !mqttConnected ||
                isMqttSending
              }
              startIcon={isLoading ? <RefreshIcon className="spinning" /> : <SendIcon />}
              sx={{
                mb: 2,
                borderRadius: 2,
                fontWeight: 600,
                letterSpacing: "0.01em",
                background: primaryColor,
                boxShadow: tokens.boxShadow,
                color: "#fff",
                "&:hover": { background: tokens.colorPrimaryHover },
              }}
              color="primary"
            >
              {isLoading ? "Sending..." : "Send Command"}
            </Button>

            {showLastResponse && lastResponse && (
              <Box>
                <Divider sx={{ mb: 2, mt: 1, borderColor: cardBorder }} />
                <Typography variant="subtitle2" sx={{ color: subTextColor, fontWeight: 600, mb: 1 }}>
                  Last Response
                </Typography>
                <Box sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1,
                }}>
                  {lastResponse.success ? (
                    <SuccessIcon sx={{ color: tokens.colorSuccess, fontSize: 18, mr: 1 }} />
                  ) : (
                    <ErrorIcon sx={{ color: tokens.colorError, fontSize: 18, mr: 1 }} />
                  )}
                  <Typography variant="body2" sx={{ color: lastResponse.success ? tokens.colorSuccess : tokens.colorError, fontWeight: 600 }}>
                    {lastResponse.success ? "Success" : "Failed"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: subTextColor, ml: "auto" }}>
                    {new Date(lastResponse.timestamp).toLocaleString()}
                  </Typography>
                </Box>
                {/* Optionally: show JSON of response */}
                {/* <Box
                  sx={{
                    background: lastResponse.success ? tokens.colorSuccessBg : tokens.colorErrorBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 2,
                    p: 1.3,
                    fontFamily: "monospace",
                    fontSize: 13,
                    mb: 1,
                    whiteSpace: "pre",
                    color: lastResponse.success ? tokens.colorSuccess : tokens.colorError,
                  }}
                >
                  {JSON.stringify(lastResponse.success ? lastResponse.data : lastResponse.error, null, 2)}
                </Box> */}
              </Box>
            )}
          </>
        )}

        <Snackbar
          open={notification.open}
          autoHideDuration={5000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: "100%" }}>
            {notification.message}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  )
}

export default DeviceCommandControlWidget


// "use client"

// import { useState, useEffect } from "react"
// import {
//   Card,
//   CardContent,
//   Typography,
//   Box,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   TextField,
//   Button,
//   Switch,
//   FormControlLabel,
//   Alert,
//   Snackbar,
//   Divider,
//   IconButton,
//   Tooltip,
// } from "@mui/material"
// import {
//   Send as SendIcon,
//   Settings as SettingsIcon,
//   Refresh as RefreshIcon,
//   CheckCircle as SuccessIcon,
//   Error as ErrorIcon,
//   Code as CodeIcon,
// } from "@mui/icons-material"
// import "../../../styles/device-command-control-widget.css"

// // --- Dev/test fallback commands ---
// const DEFAULT_COMMANDS = [
//   {
//     id: "set_fan_level",
//     name: "Set Fan Level",
//     description: "Control fan speed level",
//     commandValue: "set_fan_level",
//     parameters: [
//       {
//         key: "level",
//         label: "Fan Level",
//         type: "select",
//         required: true,
//         options: [
//           { value: "1", label: "Level 1 (Low)" },
//           { value: "2", label: "Level 2 (Medium)" },
//           { value: "3", label: "Level 3 (High)" },
//           { value: "4", label: "Level 4 (Max)" },
//         ],
//         defaultValue: "1",
//       },
//     ],
//   },
//   {
//     id: "fan_auto",
//     name: "Turn Fan On (Auto Mode)",
//     description: "Turn on the fan auto mode",
//     commandValue: "fan_auto",
//     parameters: [],
//   },
//   {
//     id: "fan_on",
//     name: "Turn Fan On",
//     description: "Turn on the all fan completely",
//     commandValue: "fan_on",
//     parameters: [],
//   },
//   {
//     id: "fan_off",
//     name: "Turn Fan Off",
//     description: "Turn off the fan completely",
//     commandValue: "fan_off",
//     parameters: [],
//   },
//   {
//     id: "reset_lock",
//     name: "Reset Lock",
//     description: "Reset lock with new passcode",
//     commandValue: "reset_lock",
//     parameters: [
//       {
//         key: "new_pass",
//         label: "New Passcode",
//         type: "number",
//         required: true,
//         min: 1000,
//         max: 9999,
//         placeholder: "Enter 4-digit passcode",
//         helperText: "Must be a 4-digit number (1000-9999)",
//       },
//     ],
//   },
// ]

// const DeviceCommandControlWidget = ({
//   widget = {},
//   sendMqttCommand,
//   dataSource = {},
//   mqttConnected = true,
//   isMqttSending = false,
//   onConfigChange,
// }) => {
//   const config = widget?.config || {}
//   const {
//     title = "Device Command Control",
//     commands = DEFAULT_COMMANDS,
//     showLastResponse = true,
//     showJsonPreview = false,
//     confirmBeforeSend = false,
//     resetAfterSend = true,
//   } = config

//   const commandList = Array.isArray(commands) ? commands : []

//   const [selectedCommand, setSelectedCommand] = useState("")
//   const [parameterValues, setParameterValues] = useState({})
//   const [isLoading, setIsLoading] = useState(false)
//   const [notification, setNotification] = useState({ open: false, message: "", severity: "info" })
//   const [lastResponse, setLastResponse] = useState(null)

//   useEffect(() => {
//     if (selectedCommand) {
//       const command = commandList.find((cmd) => cmd.id === selectedCommand)
//       if (command) {
//         const initialValues = {}
//         Array.isArray(command.parameters) && command.parameters.forEach((param) => {
//           initialValues[param.key] = param.defaultValue ?? getDefaultValue(param.type)
//         })
//         setParameterValues(initialValues)
//       }
//     } else {
//       setParameterValues({})
//     }
//   }, [selectedCommand, JSON.stringify(commandList)])

//   function getDefaultValue(type) {
//     switch (type) {
//       case "boolean": return false
//       case "number": return ""
//       case "array": return ""
//       default: return ""
//     }
//   }

//   const handleCommandChange = (event) => setSelectedCommand(event.target.value)
//   const handleParameterChange = (paramKey, value) => setParameterValues((prev) => ({
//     ...prev,
//     [paramKey]: value,
//   }))

//   // --- Build payload for MQTT send
//   const buildJsonPayload = () => {
//     const command = commandList.find((cmd) => cmd.id === selectedCommand)
//     if (!command) return {}
//     const payload = {
//       command: command.commandValue || command.name,
//     }
//     Array.isArray(command.parameters) && command.parameters.forEach((param) => {
//       const value = parameterValues[param.key]
//       if (value !== undefined && value !== "") {
//         switch (param.type) {
//           case "number": payload[param.key] = Number(value); break
//           case "boolean": payload[param.key] = value === true || value === "true"; break
//           case "array":
//             if (typeof value === "string") {
//               try { payload[param.key] = JSON.parse(value) }
//               catch { payload[param.key] = value.split(",").map((item) => item.trim()) }
//             } else {
//               payload[param.key] = value
//             }
//             break
//           default: payload[param.key] = value
//         }
//       }
//     })
//     return payload
//   }

//   // --- Validate parameters
//   const validateParameters = () => {
//     const command = commandList.find((cmd) => cmd.id === selectedCommand)
//     if (!command) return { isValid: false, errors: ["No command selected"] }
//     const errors = []

//     Array.isArray(command.parameters) && command.parameters.forEach((param) => {
//       const value = parameterValues[param.key]
//       if (param.required && (value === undefined || value === "" || value === null)) {
//         errors.push(`${param.label || param.key} is required`)
//         return
//       }
//       if (value !== undefined && value !== "") {
//         switch (param.type) {
//           case "number":
//             const numValue = Number(value)
//             if (isNaN(numValue)) errors.push(`${param.label || param.key} must be a valid number`)
//             else {
//               if (param.min !== undefined && numValue < param.min) errors.push(`${param.label || param.key} must be at least ${param.min}`)
//               if (param.max !== undefined && numValue > param.max) errors.push(`${param.label || param.key} must be at most ${param.max}`)
//             }
//             break
//           case "string":
//             if (param.minLength && value.length < param.minLength) errors.push(`${param.label || param.key} must be at least ${param.minLength} characters`)
//             if (param.maxLength && value.length > param.maxLength) errors.push(`${param.label || param.key} must be at most ${param.maxLength} characters`)
//             if (param.pattern) {
//               try {
//                 const regex = new RegExp(param.pattern)
//                 if (!regex.test(value)) errors.push(`${param.label || param.key} format is invalid`)
//               } catch {}
//             }
//             break
//           default: break
//         }
//       }
//     })
//     return { isValid: errors.length === 0, errors }
//   }

//   // --- Send command over MQTT
//   const handleSendCommand = async () => {
//     if (!selectedCommand) return showNotification("Please select a command", "warning")
//     if (typeof sendMqttCommand !== "function") return showNotification("MQTT not available", "error")
//     if (!mqttConnected) return showNotification("MQTT not connected", "error")
//     if (isMqttSending || isLoading) return showNotification("Previous command still sending", "info")
//     const validation = validateParameters()
//     if (!validation.isValid) return showNotification(validation.errors.join(", "), "error")

//     if (confirmBeforeSend) {
//       const confirmed = window.confirm("Are you sure you want to send this command?")
//       if (!confirmed) return
//     }

//     setIsLoading(true)
//     try {
//       const payload = buildJsonPayload()
//       await sendMqttCommand(payload)
//       setLastResponse({
//         success: true,
//         data: { sent: true },
//         timestamp: new Date().toISOString(),
//       })
//       showNotification("Command sent successfully!", "success")
//       if (resetAfterSend) {
//         setSelectedCommand("")
//         setParameterValues({})
//       }
//     } catch (error) {
//       setLastResponse({
//         success: false,
//         error: error?.message || "MQTT Send Error",
//         timestamp: new Date().toISOString(),
//       })
//       showNotification(`MQTT send error: ${error?.message || "Unknown"}`, "error")
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const showNotification = (message, severity) => setNotification({ open: true, message, severity })
//   const handleCloseNotification = () => setNotification({ ...notification, open: false })

//   const handleConfigureWidget = () => {
//     if (typeof onConfigChange === "function") onConfigChange(widget)
//     else showNotification("Configuration not available. Please implement onConfigChange in your dashboard.", "warning")
//   }

//   const handleWidgetRefresh = () => {
//     setSelectedCommand("")
//     setParameterValues({})
//     setLastResponse(null)
//     setNotification({ open: false, message: "", severity: "info" })
//   }

//   // --- Render each parameter field
//   const renderParameterInput = (parameter) => {
//     const value = parameterValues[parameter.key] ?? getDefaultValue(parameter.type)
//     switch (parameter.type) {
//       case "number":
//         return (
//           <TextField
//             key={parameter.key}
//             fullWidth
//             type="number"
//             label={parameter.label}
//             value={value}
//             onChange={(e) => handleParameterChange(parameter.key, e.target.value)}
//             placeholder={parameter.placeholder}
//             required={parameter.required}
//             inputProps={{
//               min: parameter.min,
//               max: parameter.max,
//               step: parameter.step || 1,
//             }}
//             helperText={parameter.helperText}
//             size="small"
//           />
//         )
//       case "boolean":
//         return (
//           <FormControlLabel
//             key={parameter.key}
//             control={
//               <Switch
//                 checked={!!value}
//                 onChange={(e) => handleParameterChange(parameter.key, e.target.checked)}
//               />
//             }
//             label={parameter.label}
//           />
//         )
//       case "select":
//         return (
//           <FormControl key={parameter.key} fullWidth size="small">
//             <InputLabel>{parameter.label}</InputLabel>
//             <Select
//               value={value}
//               label={parameter.label}
//               onChange={(e) => handleParameterChange(parameter.key, e.target.value)}
//               required={parameter.required}
//             >
//               {(parameter.options || []).map((option) => (
//                 <MenuItem key={option.value} value={option.value}>
//                   {option.label}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>
//         )
//       case "textarea":
//         return (
//           <TextField
//             key={parameter.key}
//             fullWidth
//             multiline
//             rows={3}
//             label={parameter.label}
//             value={value}
//             onChange={(e) => handleParameterChange(parameter.key, e.target.value)}
//             placeholder={parameter.placeholder}
//             required={parameter.required}
//             helperText={parameter.helperText}
//             size="small"
//           />
//         )
//       default: // string
//         return (
//           <TextField
//             key={parameter.key}
//             fullWidth
//             label={parameter.label}
//             value={value}
//             onChange={(e) => handleParameterChange(parameter.key, e.target.value)}
//             placeholder={parameter.placeholder}
//             required={parameter.required}
//             helperText={parameter.helperText}
//             size="small"
//           />
//         )
//     }
//   }

//   const selectedCommandObj = commandList.find((cmd) => cmd.id === selectedCommand)

//   return (
//     <Card className="device-command-control-widget" style={{ minWidth: 350, borderRadius: 12 }}>
//       <CardContent>
//         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//           <Typography variant="h6" component="h2">
//             {title}
//           </Typography>
//           <Box>
//             <Tooltip title="Refresh">
//               <IconButton size="small" onClick={handleWidgetRefresh}>
//                 <RefreshIcon />
//               </IconButton>
//             </Tooltip>
//             <Tooltip title="Configure Widget">
//               <IconButton size="small" onClick={handleConfigureWidget}>
//                 <SettingsIcon />
//               </IconButton>
//             </Tooltip>
//           </Box>
//         </div>

//         {commandList.length === 0 ? (
//           <Alert severity="info">No commands configured. Please configure commands in widget settings.</Alert>
//         ) : (
//           <>
//             <FormControl fullWidth sx={{ mb: 2 }}>
//               <InputLabel>Select Command</InputLabel>
//               <Select value={selectedCommand} label="Select Command" onChange={handleCommandChange}>
//                 {commandList.map((command) => (
//                   <MenuItem key={command.id} value={command.id}>
//                     <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
//                       <Typography>{command.name}</Typography>
//                       {command.description && (
//                         <Typography variant="caption" color="text.secondary">
//                           {command.description}
//                         </Typography>
//                       )}
//                     </Box>
//                   </MenuItem>
//                 ))}
//               </Select>
//             </FormControl>

//             {selectedCommandObj && Array.isArray(selectedCommandObj.parameters) && selectedCommandObj.parameters.length > 0 && (
//               <div>
//                 <Typography variant="subtitle2" sx={{ mb: 2, color: "text.secondary", fontWeight: 600 }}>
//                   Parameters
//                 </Typography>
//                 <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
//                   {selectedCommandObj.parameters.map((parameter) => renderParameterInput(parameter))}
//                 </Box>
//               </div>
//             )}

//             {showJsonPreview && selectedCommand && (
//               <Box sx={{ mb: 2 }}>
//                 <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
//                   <CodeIcon fontSize="small" />
//                   JSON Preview
//                 </Typography>
//                 <div style={{
//                   background: "#fafbfc",
//                   border: "1px solid #eee",
//                   borderRadius: 4,
//                   padding: 12,
//                   fontFamily: "monospace",
//                   fontSize: 13,
//                   marginBottom: 8,
//                   whiteSpace: "pre",
//                 }}>
//                   {JSON.stringify(buildJsonPayload(), null, 2)}
//                 </div>
//               </Box>
//             )}

//             <Button
//               fullWidth
//               variant="contained"
//               onClick={handleSendCommand}
//               disabled={
//                 !selectedCommand ||
//                 isLoading ||
//                 typeof sendMqttCommand !== "function" ||
//                 !mqttConnected ||
//                 isMqttSending
//               }
//               startIcon={isLoading ? <RefreshIcon className="spinning" /> : <SendIcon />}
//               sx={{ mb: 2, borderRadius: 8 }}
//               color="primary"
//             >
//               {isLoading ? "Sending..." : "Send Command"}
//             </Button>

//             {showLastResponse && lastResponse && (
//               <div>
//                 <Divider sx={{ mb: 2 }} />
//                 <Box>
//                   <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary", fontWeight: 600 }}>
//                     Last Response
//                   </Typography>
//                   <Box
//                     sx={{
//                       display: "flex",
//                       alignItems: "center",
//                       gap: 1,
//                       mb: 1,
//                     }}
//                   >
//                     {lastResponse.success ? (
//                       <SuccessIcon color="success" fontSize="small" />
//                     ) : (
//                       <ErrorIcon color="error" fontSize="small" />
//                     )}
//                     <Typography variant="body2" color={lastResponse.success ? "success.main" : "error.main"} fontWeight={600}>
//                       {lastResponse.success ? "Success" : "Failed"}
//                     </Typography>
//                     <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
//                       {new Date(lastResponse.timestamp).toLocaleString()}
//                     </Typography>
//                   </Box>
//                   <div style={{
//                     background: lastResponse.success ? "#e9f7ef" : "#fdeaea",
//                     border: "1px solid #eee",
//                     borderRadius: 4,
//                     padding: 12,
//                     fontFamily: "monospace",
//                     fontSize: 13,
//                     marginBottom: 8,
//                     whiteSpace: "pre",
//                   }}>
//                     {JSON.stringify(lastResponse.success ? lastResponse.data : lastResponse.error, null, 2)}
//                   </div>
//                 </Box>
//               </div>
//             )}
//           </>
//         )}

//         <Snackbar
//           open={notification.open}
//           autoHideDuration={6000}
//           onClose={handleCloseNotification}
//           anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
//         >
//           <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: "100%" }}>
//             {notification.message}
//           </Alert>
//         </Snackbar>
//       </CardContent>
//     </Card>
//   )
// }

// export default DeviceCommandControlWidget




// // "use client"

// // import { useState, useEffect } from "react"
// // import {
// //   Card,
// //   CardContent,
// //   Typography,
// //   Box,
// //   FormControl,
// //   InputLabel,
// //   Select,
// //   MenuItem,
// //   TextField,
// //   Button,
// //   Switch,
// //   FormControlLabel,
// //   Alert,
// //   Snackbar,
// //   Chip,
// //   Divider,
// //   IconButton,
// //   Tooltip,
// // } from "@mui/material"
// // import {
// //   Send as SendIcon,
// //   Settings as SettingsIcon,
// //   Refresh as RefreshIcon,
// //   CheckCircle as SuccessIcon,
// //   Error as ErrorIcon,
// //   Code as CodeIcon,
// // } from "@mui/icons-material"
// // import "../../../styles/device-command-control-widget.css"

// // // Default/fallback commands for dev/local use
// // const DEFAULT_COMMANDS = [
// //   {
// //     id: "set_fan_level",
// //     name: "Set Fan Level",
// //     description: "Control fan speed level",
// //     commandValue: "set_fan_level",
// //     parameters: [
// //       {
// //         key: "level",
// //         label: "Fan Level",
// //         type: "select",
// //         required: true,
// //         options: [
// //           { value: "1", label: "Level 1 (Low)" },
// //           { value: "2", label: "Level 2 (Medium)" },
// //           { value: "3", label: "Level 3 (High)" },
// //           { value: "4", label: "Level 4 (Max)" },
// //         ],
// //         defaultValue: "1",
// //       },
// //     ],
// //   },
// //   {
// //     id: "fan_off",
// //     name: "Turn Fan Off",
// //     description: "Turn off the fan completely",
// //     commandValue: "fan_off",
// //     parameters: [],
// //   },
// //   {
// //     id: "reset_lock",
// //     name: "Reset Lock",
// //     description: "Reset lock with new passcode",
// //     commandValue: "reset_lock",
// //     parameters: [
// //       {
// //         key: "new_pass",
// //         label: "New Passcode",
// //         type: "number",
// //         required: true,
// //         min: 1000,
// //         max: 9999,
// //         placeholder: "Enter 4-digit passcode",
// //         helperText: "Must be a 4-digit number (1000-9999)",
// //       },
// //     ],
// //   },
// // //   {
// // //     id: "set_temperature",
// // //     name: "Set Temperature",
// // //     description: "Adjust thermostat temperature",
// // //     commandValue: "set_temperature",
// // //     parameters: [
// // //       {
// // //         key: "temperature",
// // //         label: "Temperature (°C)",
// // //         type: "number",
// // //         required: true,
// // //         min: 16,
// // //         max: 30,
// // //         step: 0.5,
// // //         defaultValue: "22",
// // //         helperText: "Temperature range: 16-30°C",
// // //       },
// // //       {
// // //         key: "mode",
// // //         label: "Mode",
// // //         type: "select",
// // //         required: true,
// // //         options: [
// // //           { value: "auto", label: "Auto" },
// // //           { value: "heat", label: "Heat" },
// // //           { value: "cool", label: "Cool" },
// // //           { value: "fan", label: "Fan Only" },
// // //         ],
// // //         defaultValue: "auto",
// // //       },
// // //     ],
// // //   },
// // //   {
// // //     id: "security_arm",
// // //     name: "Arm Security",
// // //     description: "Arm security system",
// // //     commandValue: "security_arm",
// // //     parameters: [
// // //       {
// // //         key: "mode",
// // //         label: "Security Mode",
// // //         type: "select",
// // //         required: true,
// // //         options: [
// // //           { value: "home", label: "Home Mode" },
// // //           { value: "away", label: "Away Mode" },
// // //           { value: "night", label: "Night Mode" },
// // //         ],
// // //         defaultValue: "home",
// // //       },
// // //       {
// // //         key: "delay",
// // //         label: "Entry Delay (seconds)",
// // //         type: "number",
// // //         required: false,
// // //         min: 0,
// // //         max: 300,
// // //         defaultValue: "30",
// // //         helperText: "Delay before system arms (0-300 seconds)",
// // //       },
// // //     ],
// // //   },
// // ]

// // const DeviceCommandControlWidget = ({ widget = {}, onConfigChange }) => {
// //   // Defensive: always have a config object
// //   const config = widget && typeof widget === "object" ? (widget.config || {}) : {}

// //   const {
// //     title = "Device Command Control",
// //     apiEndpoint = "",
// //     httpMethod = "POST",
// //     headers = {},
// //     commands = DEFAULT_COMMANDS,
// //     showLastResponse = true,
// //     showJsonPreview = false,
// //     confirmBeforeSend = false,
// //     resetAfterSend = true,
// //     timeout = 10000,
// //   } = config

// //   const commandList = Array.isArray(commands) ? commands : []

// //   const [selectedCommand, setSelectedCommand] = useState("")
// //   const [parameterValues, setParameterValues] = useState({})
// //   const [isLoading, setIsLoading] = useState(false)
// //   const [notification, setNotification] = useState({ open: false, message: "", severity: "info" })
// //   const [lastResponse, setLastResponse] = useState(null)

// //   useEffect(() => {
// //     if (selectedCommand) {
// //       const command = commandList.find((cmd) => cmd.id === selectedCommand)
// //       if (command) {
// //         const initialValues = {}
// //         Array.isArray(command.parameters) && command.parameters.forEach((param) => {
// //           initialValues[param.key] = param.defaultValue ?? getDefaultValue(param.type)
// //         })
// //         setParameterValues(initialValues)
// //       }
// //     } else {
// //       setParameterValues({})
// //     }
// //   }, [selectedCommand, JSON.stringify(commandList)])

// //   function getDefaultValue(type) {
// //     switch (type) {
// //       case "boolean": return false
// //       case "number": return ""
// //       case "array": return ""
// //       default: return ""
// //     }
// //   }

// //   const handleCommandChange = (event) => setSelectedCommand(event.target.value)
// //   const handleParameterChange = (paramKey, value) => setParameterValues((prev) => ({
// //     ...prev,
// //     [paramKey]: value,
// //   }))

// //   const buildJsonPayload = () => {
// //     const command = commandList.find((cmd) => cmd.id === selectedCommand)
// //     if (!command) return {}

// //     const payload = {
// //       command: command.commandValue || command.name,
// //     }

// //     Array.isArray(command.parameters) &&
// //       command.parameters.forEach((param) => {
// //         const value = parameterValues[param.key]
// //         if (value !== undefined && value !== "") {
// //           switch (param.type) {
// //             case "number": payload[param.key] = Number(value); break
// //             case "boolean": payload[param.key] = value === true || value === "true"; break
// //             case "array":
// //               if (typeof value === "string") {
// //                 try { payload[param.key] = JSON.parse(value) }
// //                 catch { payload[param.key] = value.split(",").map((item) => item.trim()) }
// //               } else {
// //                 payload[param.key] = value
// //               }
// //               break
// //             default: payload[param.key] = value
// //           }
// //         }
// //       })

// //     return payload
// //   }

// //   const validateParameters = () => {
// //     const command = commandList.find((cmd) => cmd.id === selectedCommand)
// //     if (!command) return { isValid: false, errors: ["No command selected"] }

// //     const errors = []

// //     Array.isArray(command.parameters) && command.parameters.forEach((param) => {
// //       const value = parameterValues[param.key]

// //       if (param.required && (value === undefined || value === "" || value === null)) {
// //         errors.push(`${param.label || param.key} is required`)
// //         return
// //       }
// //       if (value !== undefined && value !== "") {
// //         switch (param.type) {
// //           case "number":
// //             const numValue = Number(value)
// //             if (isNaN(numValue)) errors.push(`${param.label || param.key} must be a valid number`)
// //             else {
// //               if (param.min !== undefined && numValue < param.min) errors.push(`${param.label || param.key} must be at least ${param.min}`)
// //               if (param.max !== undefined && numValue > param.max) errors.push(`${param.label || param.key} must be at most ${param.max}`)
// //             }
// //             break
// //           case "string":
// //             if (param.minLength && value.length < param.minLength) errors.push(`${param.label || param.key} must be at least ${param.minLength} characters`)
// //             if (param.maxLength && value.length > param.maxLength) errors.push(`${param.label || param.key} must be at most ${param.maxLength} characters`)
// //             if (param.pattern) {
// //               try {
// //                 const regex = new RegExp(param.pattern)
// //                 if (!regex.test(value)) errors.push(`${param.label || param.key} format is invalid`)
// //               } catch {}
// //             }
// //             break
// //           default: break
// //         }
// //       }
// //     })

// //     return { isValid: errors.length === 0, errors }
// //   }

// //   const handleSendCommand = async () => {
// //     if (!selectedCommand) return showNotification("Please select a command", "warning")
// //     if (!apiEndpoint) return showNotification("API endpoint not configured", "error")
// //     const validation = validateParameters()
// //     if (!validation.isValid) return showNotification(validation.errors.join(", "), "error")

// //     if (confirmBeforeSend) {
// //       const confirmed = window.confirm("Are you sure you want to send this command?")
// //       if (!confirmed) return
// //     }

// //     setIsLoading(true)

// //     try {
// //       const payload = buildJsonPayload()
// //       const requestHeaders = { "Content-Type": "application/json", ...headers }
// //       let controller = null, signal = undefined
// //       if ("AbortController" in window && "timeout" in AbortSignal) signal = AbortSignal.timeout(timeout)
// //       else if ("AbortController" in window) {
// //         controller = new AbortController()
// //         signal = controller.signal
// //         setTimeout(() => controller.abort(), timeout)
// //       }

// //       const response = await fetch(apiEndpoint, {
// //         method: httpMethod,
// //         headers: requestHeaders,
// //         body: JSON.stringify(payload),
// //         signal,
// //       })

// //       const responseData = await response.text()
// //       let parsedResponse
// //       try { parsedResponse = JSON.parse(responseData) } catch { parsedResponse = responseData }

// //       if (response.ok) {
// //         setLastResponse({
// //           success: true,
// //           data: parsedResponse,
// //           timestamp: new Date().toISOString(),
// //           status: response.status,
// //         })
// //         showNotification("Command sent successfully!", "success")
// //         if (resetAfterSend) { setSelectedCommand(""); setParameterValues({}) }
// //       } else {
// //         setLastResponse({
// //           success: false,
// //           error: parsedResponse,
// //           timestamp: new Date().toISOString(),
// //           status: response.status,
// //         })
// //         showNotification(`Command failed: ${response.status} ${response.statusText}`, "error")
// //       }
// //     } catch (error) {
// //       setLastResponse({
// //         success: false,
// //         error: error.message,
// //         timestamp: new Date().toISOString(),
// //       })
// //       showNotification(`Network error: ${error.message}`, "error")
// //     } finally {
// //       setIsLoading(false)
// //     }
// //   }

// //   const showNotification = (message, severity) => setNotification({ open: true, message, severity })
// //   const handleCloseNotification = () => setNotification({ ...notification, open: false })

// //   const handleConfigureWidget = () => {
// //     if (typeof onConfigChange === "function") onConfigChange(widget)
// //     else showNotification("Configuration not available. Please implement onConfigChange in your dashboard.", "warning")
// //   }

// //     const handleWidgetRefresh = () => {
// //         setSelectedCommand("")
// //         setParameterValues({})
// //         setLastResponse(null)
// //         setNotification({ open: false, message: "", severity: "info" })
// //     }

// //   const renderParameterInput = (parameter) => {
// //     const value = parameterValues[parameter.key] ?? getDefaultValue(parameter.type)
// //     switch (parameter.type) {
// //       case "number":
// //         return (
// //           <TextField
// //             key={parameter.key}
// //             fullWidth
// //             type="number"
// //             label={parameter.label}
// //             value={value}
// //             onChange={(e) => handleParameterChange(parameter.key, e.target.value)}
// //             placeholder={parameter.placeholder}
// //             required={parameter.required}
// //             inputProps={{
// //               min: parameter.min,
// //               max: parameter.max,
// //               step: parameter.step || 1,
// //             }}
// //             helperText={parameter.helperText}
// //             size="small"
// //           />
// //         )
// //       case "boolean":
// //         return (
// //           <FormControlLabel
// //             key={parameter.key}
// //             control={
// //               <Switch
// //                 checked={!!value}
// //                 onChange={(e) => handleParameterChange(parameter.key, e.target.checked)}
// //               />
// //             }
// //             label={parameter.label}
// //           />
// //         )
// //       case "select":
// //         return (
// //           <FormControl key={parameter.key} fullWidth size="small">
// //             <InputLabel>{parameter.label}</InputLabel>
// //             <Select
// //               value={value}
// //               label={parameter.label}
// //               onChange={(e) => handleParameterChange(parameter.key, e.target.value)}
// //               required={parameter.required}
// //             >
// //               {(parameter.options || []).map((option) => (
// //                 <MenuItem key={option.value} value={option.value}>
// //                   {option.label}
// //                 </MenuItem>
// //               ))}
// //             </Select>
// //           </FormControl>
// //         )
// //       case "textarea":
// //         return (
// //           <TextField
// //             key={parameter.key}
// //             fullWidth
// //             multiline
// //             rows={3}
// //             label={parameter.label}
// //             value={value}
// //             onChange={(e) => handleParameterChange(parameter.key, e.target.value)}
// //             placeholder={parameter.placeholder}
// //             required={parameter.required}
// //             helperText={parameter.helperText}
// //             size="small"
// //           />
// //         )
// //       default: // string
// //         return (
// //           <TextField
// //             key={parameter.key}
// //             fullWidth
// //             label={parameter.label}
// //             value={value}
// //             onChange={(e) => handleParameterChange(parameter.key, e.target.value)}
// //             placeholder={parameter.placeholder}
// //             required={parameter.required}
// //             helperText={parameter.helperText}
// //             size="small"
// //           />
// //         )
// //     }
// //   }

// //   const selectedCommandObj = commandList.find((cmd) => cmd.id === selectedCommand)

// //   return (
// //     <Card className="device-command-control-widget">
// //       <CardContent>
// //         <div className="widget-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
// //           <Typography variant="h6" component="h2">
// //             {title}
// //           </Typography>
// //           <Box>
// //             <Tooltip title="Refresh">
// //                 <IconButton size="small" onClick={handleWidgetRefresh}>
// //                     <RefreshIcon />
// //                 </IconButton>
// //             </Tooltip>
// //             <Tooltip title="Configure Widget">
// //               <IconButton size="small" onClick={handleConfigureWidget}>
// //                 <SettingsIcon />
// //               </IconButton>
// //             </Tooltip>
// //           </Box>
// //         </div>

// //         {commandList.length === 0 ? (
// //           <Alert severity="info">No commands configured. Please configure commands in widget settings.</Alert>
// //         ) : (
// //           <>
// //             <FormControl fullWidth sx={{ mb: 2 }}>
// //               <InputLabel>Select Command</InputLabel>
// //               <Select value={selectedCommand} label="Select Command" onChange={handleCommandChange}>
// //                 {commandList.map((command) => (
// //                   <MenuItem key={command.id} value={command.id}>
// //                     <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
// //                       <Typography>{command.name}</Typography>
// //                       {command.description && (
// //                         <Typography variant="caption" color="text.secondary">
// //                           {command.description}
// //                         </Typography>
// //                       )}
// //                     </Box>
// //                   </MenuItem>
// //                 ))}
// //               </Select>
// //             </FormControl>

// //             {selectedCommandObj && Array.isArray(selectedCommandObj.parameters) && selectedCommandObj.parameters.length > 0 && (
// //               <div>
// //                 <Typography variant="subtitle2" sx={{ mb: 2, color: "text.secondary", fontWeight: 600 }}>
// //                   Parameters
// //                 </Typography>
// //                 <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
// //                   {selectedCommandObj.parameters.map((parameter) => renderParameterInput(parameter))}
// //                 </Box>
// //               </div>
// //             )}

// //             {showJsonPreview && selectedCommand && (
// //               <Box sx={{ mb: 2 }}>
// //                 <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
// //                   <CodeIcon fontSize="small" />
// //                   JSON Preview
// //                 </Typography>
// //                 <div style={{
// //                   background: "#fafbfc",
// //                   border: "1px solid #eee",
// //                   borderRadius: 4,
// //                   padding: 12,
// //                   fontFamily: "monospace",
// //                   fontSize: 13,
// //                   marginBottom: 8,
// //                   whiteSpace: "pre",
// //                 }}>
// //                   {JSON.stringify(buildJsonPayload(), null, 2)}
// //                 </div>
// //               </Box>
// //             )}

// //             <Button
// //               fullWidth
// //               variant="contained"
// //               onClick={handleSendCommand}
// //               disabled={!selectedCommand || isLoading}
// //               startIcon={isLoading ? <RefreshIcon className="spinning" /> : <SendIcon />}
// //               sx={{ mb: 2 }}
// //               color="primary"
// //             >
// //               {isLoading ? "Sending Command..." : "Send Command"}
// //             </Button>

// //             {showLastResponse && lastResponse && (
// //               <div>
// //                 <Divider sx={{ mb: 2 }} />
// //                 <Box>
// //                   <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary", fontWeight: 600 }}>
// //                     Last Response
// //                   </Typography>
// //                   <Box
// //                     sx={{
// //                       display: "flex",
// //                       alignItems: "center",
// //                       gap: 1,
// //                       mb: 1,
// //                     }}
// //                   >
// //                     {lastResponse.success ? (
// //                       <SuccessIcon color="success" fontSize="small" />
// //                     ) : (
// //                       <ErrorIcon color="error" fontSize="small" />
// //                     )}
// //                     <Typography variant="body2" color={lastResponse.success ? "success.main" : "error.main"} fontWeight={600}>
// //                       {lastResponse.success ? "Success" : "Failed"}
// //                     </Typography>
// //                     {lastResponse.status && (
// //                       <Chip
// //                         label={`HTTP ${lastResponse.status}`}
// //                         size="small"
// //                         variant="outlined"
// //                         color={lastResponse.success ? "success" : "error"}
// //                       />
// //                     )}
// //                     <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
// //                       {new Date(lastResponse.timestamp).toLocaleString()}
// //                     </Typography>
// //                   </Box>
// //                   <div style={{
// //                     background: lastResponse.success ? "#e9f7ef" : "#fdeaea",
// //                     border: "1px solid #eee",
// //                     borderRadius: 4,
// //                     padding: 12,
// //                     fontFamily: "monospace",
// //                     fontSize: 13,
// //                     marginBottom: 8,
// //                     whiteSpace: "pre",
// //                   }}>
// //                     {JSON.stringify(lastResponse.success ? lastResponse.data : lastResponse.error, null, 2)}
// //                   </div>
// //                 </Box>
// //               </div>
// //             )}
// //           </>
// //         )}

// //         <Snackbar
// //           open={notification.open}
// //           autoHideDuration={6000}
// //           onClose={handleCloseNotification}
// //           anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
// //         >
// //           <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: "100%" }}>
// //             {notification.message}
// //           </Alert>
// //         </Snackbar>
// //       </CardContent>
// //     </Card>
// //   )
// // }

// // export default DeviceCommandControlWidget
