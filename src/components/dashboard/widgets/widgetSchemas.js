export const widgetSchemas = {
  "gauge": [
    { name: "title", label: "Title", type: "input", required: true },
    { name: "unit", label: "Unit", type: "input" },
    { name: "min", label: "Min Value", type: "number", default: 0 },
    { name: "max", label: "Max Value", type: "number", default: 100 },
    { name: "precision", label: "Precision", type: "number", min: 0, max: 4, default: 1 },
    { name: "dataKeys", label: "Data Keys", type: "list", required: true, tooltip: "Telemetry key(s) for the gauge" },
    {
      name: "thresholds",
      label: "Thresholds (two values, 0 to 1)",
      type: "list",
      default: [0.3, 0.7],
      description: "Enter two thresholds between 0 and 1 to control gauge color ranges"
    },
    {
      name: "colors",
      label: "Colors (three values)",
      type: "list",
      default: ["#f5222d", "#faad14", "#52c41a"],
      description: "Enter 3 colors for the gauge (low, medium, high)"
    }
  ],
  "fan-control": [
    { name: "title", label: "Title", type: "input", default: "Fan Control System", required: true },
    { name: "numFans", label: "Number of Fans", type: "number", min: 1, max: 16, default: 2 },
    { name: "showStats", label: "Show Stats (Running/Total)", type: "switch", default: true },
    { name: "showAlarms", label: "Show Alarms", type: "switch", default: true },
    { name: "showAddFan", label: "Enable Add Fan", type: "switch", default: true },
    { name: "showDeleteFan", label: "Enable Delete Fan", type: "switch", default: true },
    { name: "showEditFan", label: "Enable Edit Fan", type: "switch", default: true },
    { name: "showFanConfigDialog", label: "Enable Fan Config Dialog", type: "switch", default: true },
    { name: "showAddFanDialog", label: "Enable Add Fan Dialog", type: "switch", default: true },
    { name: "showStartStop", label: "Enable Start/Stop Controls", type: "switch", default: true },
    { name: "showAllControl", label: "Enable Start/Stop All Controls", type: "switch", default: true },
    { name: "showSpeedSet", label: "Enable Speed Slider", type: "switch", default: false },
    { name: "showReset", label: "Enable Reset Button", type: "switch", default: true },
    { name: "showAutoMode", label: "Enable Auto Mode Toggle", type: "switch", default: true },

    // NEW: Important fan config
    { name: "enableImportantFan", label: "Allow Marking Important Fan", type: "switch", default: true },
    {
      name: "importantFans",
      label: "Important Fans (IDs or Indexes)",
      type: "list",
      description: "Set initial important fans by ID or index (optional)",
      default: []
    },

    { name: "minSpeed", label: "Min Speed (%)", type: "number", default: 0 },
    { name: "maxSpeedPercent", label: "Max Speed (%)", type: "number", default: 100 },
    { name: "maxSpeedRpm", label: "Max Speed (RPM)", type: "number", default: 1800 },
    {
      name: "speedUnit",
      label: "Speed Unit",
      type: "select",
      options: ["%", "RPM"],
      default: "%"
    },
    {
      name: "tempUnit",
      label: "Temperature Unit",
      type: "select",
      options: ["°C", "°F", "K"],
      default: "°C"
    },
    { name: "maintenanceHours", label: "Maintenance Hours", type: "number", default: 8760 },
    { name: "runtime", label: "Initial Runtime (h)", type: "number", default: 0 },
    {
      name: "speedUnits",
      label: "Speed Units (array)",
      type: "list",
      default: [
        { value: "%", label: "Percentage (%)" },
        { value: "RPM", label: "Rotation (RPM)" }
      ]
    },
    {
      name: "tempUnits",
      label: "Temperature Units (array)",
      type: "list",
      default: [
        { value: "°C", label: "Celsius (°C)" },
        { value: "°F", label: "Fahrenheit (°F)" },
        { value: "K", label: "Kelvin (K)" }
      ]
    },
    { name: "theme", label: "Theme", type: "select", options: ["light", "dark"], default: "light" },
    { name: "showTemperature", label: "Show Temperature", type: "switch", default: true },
    { name: "showPower", label: "Show Power", type: "switch", default: true },
    { name: "showRuntime", label: "Show Runtime", type: "switch", default: true },
    { name: "showMaintenance", label: "Show Maintenance Hours", type: "switch", default: true }
  ],

}

// export const widgetSchemas = {
//   "value-card": [
//     { name: "title", label: "Title", type: "input", required: true },
//     { name: "unit", label: "Unit", type: "input" },
//     { name: "prefix", label: "Prefix", type: "input" },
//     { name: "suffix", label: "Suffix", type: "input" },
//     { name: "precision", label: "Precision", type: "number", min: 0, max: 6, default: 2 },
//     { name: "dataKeys", label: "Data Keys", type: "list", required: true, tooltip: "Telemetry key(s) for this card" }
//   ],
//   "gauge": [
//     { name: "title", label: "Title", type: "input", required: true },
//     { name: "unit", label: "Unit", type: "input" },
//     { name: "min", label: "Min Value", type: "number", default: 0 },
//     { name: "max", label: "Max Value", type: "number", default: 100 },
//     { name: "precision", label: "Precision", type: "number", min: 0, max: 4, default: 1 },
//     { name: "dataKeys", label: "Data Keys", type: "list", required: true, tooltip: "Telemetry key(s) for the gauge" },
//     {
//       name: "thresholds",
//       label: "Thresholds (two values, 0 to 1)",
//       type: "list",
//       default: [0.3, 0.7],
//       description: "Enter two thresholds between 0 and 1 to control gauge color ranges"
//     },
//     {
//       name: "colors",
//       label: "Colors (three values)",
//       type: "list",
//       default: ["#f5222d", "#faad14", "#52c41a"],
//       description: "Enter 3 colors for the gauge (low, medium, high)"
//     }
//   ],
//   "camera": [
//     { name: "title", label: "Camera Name", type: "input", required: true },
//     { name: "streamUrl", label: "Stream URL", type: "input", required: true },
//     { name: "username", label: "Username", type: "input" },
//     { name: "password", label: "Password", type: "password" },
//     { name: "refreshInterval", label: "Refresh Interval (s)", type: "number", default: 30 },
//     { name: "motionDetection", label: "Motion Detection", type: "switch" },
//     { name: "motionSensitivity", label: "Motion Sensitivity (%)", type: "slider", min: 0, max: 100, default: 50, showIf: c => c.motionDetection },
//     { name: "notifications", label: "Notifications", type: "switch" },
//     { name: "recordingEnabled", label: "Recording Enabled", type: "switch" },
//     { name: "storageRetention", label: "Storage Retention (days)", type: "number", min: 1, max: 90, default: 7, showIf: c => c.recordingEnabled },
//     { name: "ptz", label: "PTZ Controls", type: "switch" }
//   ],

//   // New Slider widget schema
//   "slider": [
//     { name: "title", label: "Slider Title", type: "input", required: true },
//     { name: "min", label: "Minimum Value", type: "number", default: 0 },
//     { name: "max", label: "Maximum Value", type: "number", default: 100 },
//     { name: "step", label: "Step Size", type: "number", default: 1 },
//     { name: "unit", label: "Unit", type: "input" },
//     { name: "dataKey", label: "Data Key", type: "input", required: true },
//     { name: "disabled", label: "Disabled", type: "switch", default: false }
//   ],

//   "fan-control": [
//     { name: "title", label: "Title", type: "input", default: "Fan Control System", required: true },
//     { name: "numFans", label: "Number of Fans", type: "number", min: 1, max: 16, default: 2 },
//     // { name: "dataKeys", label: "Telemetry Data Keys", type: "list", required: true, tooltip: "Key(s) for telemetry (e.g., speed, rpm)" },
//     // { name: "fans", label: "Fans Config", type: "json", required: true, description: "Array of fan objects: [{ id, name, speedUnit, tempUnit, ... }]" },
//     { name: "showStats", label: "Show Stats (Running/Total)", type: "switch", default: true },
//     { name: "showAlarms", label: "Show Alarms", type: "switch", default: true },
//     { name: "showAddFan", label: "Enable Add Fan", type: "switch", default: true },
//     { name: "showDeleteFan", label: "Enable Delete Fan", type: "switch", default: true },
//     { name: "showEditFan", label: "Enable Edit Fan", type: "switch", default: true },
//     { name: "showFanConfigDialog", label: "Enable Fan Config Dialog", type: "switch", default: true },
//     { name: "showAddFanDialog", label: "Enable Add Fan Dialog", type: "switch", default: true },
//     { name: "showStartStop", label: "Enable Start/Stop Controls", type: "switch", default: true },
//     { name: "showAllControl", label: "Enable Start/Stop All Controls", type: "switch", default: true },
//     { name: "showSpeedSet", label: "Enable Speed Slider", type: "switch", default: false },
//     { name: "showReset", label: "Enable Reset Button", type: "switch", default: true },
//     { name: "showAutoMode", label: "Enable Auto Mode Toggle", type: "switch", default: true },
//     { name: "minSpeed", label: "Min Speed (%)", type: "number", default: 0 },
//     { name: "maxSpeedPercent", label: "Max Speed (%)", type: "number", default: 100 },
//     { name: "maxSpeedRpm", label: "Max Speed (RPM)", type: "number", default: 1800 },
//     {
//       name: "speedUnits",
//       label: "Speed Units",
//       type: "list",
//       default: [
//         { value: "%", label: "Percentage (%)" },
//         { value: "RPM", label: "Rotation (RPM)" }
//       ],
//       description: "Array of allowed speed units"
//     },
//     {
//       name: "tempUnits",
//       label: "Temperature Units",
//       type: "list",
//       default: [
//         { value: "°C", label: "Celsius (°C)" },
//         { value: "°F", label: "Fahrenheit (°F)" },
//         { value: "K", label: "Kelvin (K)" }
//       ],
//       description: "Array of allowed temperature units"
//     },
//     { name: "theme", label: "Theme", type: "select", options: ["light", "dark"], default: "light" },
//   ],
// }
