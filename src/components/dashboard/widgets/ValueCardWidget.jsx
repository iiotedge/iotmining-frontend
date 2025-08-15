import { useEffect, useState } from "react"
import { Card, Statistic, Button } from "antd"
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons"
import { getByDotPath } from "../../../utils/dotPath"


const ValueCardWidget = ({
  title = "Value Card",
  value = 0,
  unit = "v",
  prefix = "",
  suffix = "",
  trend = 0,
  precision = 0,
  data = [],
  dataKeys = ["value"],  // dot-paths supported
  theme = "light",
  thresholds = null,     // { warning: number, critical: number }
}) => {
  const [showRaw, setShowRaw] = useState(false)

  useEffect(() => {
    console.log(`[WIDGET:${title}] Render. Data:`, data, "Keys:", dataKeys)
  })

  // Extract main value and trend %
  let displayValue = value
  let displayTrend = trend

  if (Array.isArray(data) && data.length && Array.isArray(dataKeys) && dataKeys.length) {
    const latestData = data[data.length - 1]
    const primaryKey = dataKeys[0]
    const latestVal = getByDotPath(latestData, primaryKey)
    if (latestVal !== undefined) {
      displayValue = latestVal

      if (data.length > 1) {
        const prevData = data[data.length - 2]
        const prevVal = getByDotPath(prevData, primaryKey)
        if (prevVal !== undefined && prevVal !== 0) {
          displayTrend = ((displayValue - prevVal) / Math.abs(prevVal)) * 100
        }
      }
    }
  }

  // Round value
  if (typeof displayValue === "number") {
    displayValue = Number(displayValue.toFixed(precision))
  }

  // Compute min, max, avg for stats (dot-path aware)
  const primaryKey = dataKeys[0]
  const values = data
    .map(d => getByDotPath(d, primaryKey))
    .filter(v => typeof v === "number")

  const minValue = values.length ? Math.min(...values) : null
  const maxValue = values.length ? Math.max(...values) : null
  const avgValue = values.length ? (values.reduce((a, b) => a + b, 0) / values.length) : null

  // Last update time from latest data point
  const lastTimestamp = data.length ? data[data.length - 1].time || null : null

  // Absolute delta (dot-path aware)
  const prevValue = data.length > 1 ? getByDotPath(data[data.length - 2], primaryKey) : null
  const absoluteChange = prevValue !== null && prevValue !== undefined ? displayValue - prevValue : null

  // Determine status color based on thresholds
  let statusColor = undefined
  if (thresholds) {
    if (displayValue >= thresholds.critical) statusColor = "#cf1322" // red
    else if (displayValue >= thresholds.warning) statusColor = "#fa8c16" // orange
    else statusColor = "#3f8600" // green
  }

  // If no thresholds, fallback color based on trend
  const valueColor =
    statusColor ||
    (displayTrend > 0 ? "#3f8600" :
    displayTrend < 0 ? "#cf1322" : undefined)

  return (
    <Card
      bordered
      style={{
        height: "100%",
        padding: 16,
        borderColor: statusColor || undefined,
        borderWidth: statusColor ? 2 : undefined,
        borderStyle: statusColor ? "solid" : undefined,
      }}
      className={`value-card-widget ${theme === "dark" ? "widget-theme-dark" : ""}`}
    >
      <Statistic
        title={title}
        value={displayValue}
        precision={precision}
        valueStyle={{ color: valueColor }}
        prefix={prefix}
        suffix={suffix || unit}
      />

      {/* Trend % */}
      {displayTrend !== 0 && (
        <div style={{ marginBottom: 12 }}>
          {displayTrend > 0 ? (
            <span style={{ color: "#3f8600", fontWeight: "bold" }}>
              <ArrowUpOutlined /> {displayTrend.toFixed(1)}%
            </span>
          ) : (
            <span style={{ color: "#cf1322", fontWeight: "bold" }}>
              <ArrowDownOutlined /> {Math.abs(displayTrend).toFixed(1)}%
            </span>
          )}
        </div>
      )}

      {/* Absolute delta */}
      {absoluteChange !== null && (
        <div style={{ fontSize: 12, color: theme === "dark" ? "#bbb" : "#555" }}>
          Δ {absoluteChange.toFixed(precision)} {unit}
        </div>
      )}

      {/* Min, Max, Avg stats */}
      {minValue !== null && maxValue !== null && avgValue !== null && (
        <div style={{ marginTop: 8, fontSize: 12, color: theme === "dark" ? "#bbb" : "#555" }}>
          Min: {minValue.toFixed(precision)}, Max: {maxValue.toFixed(precision)}, Avg: {avgValue.toFixed(precision)}
        </div>
      )}

      {/* Last updated timestamp */}
      {lastTimestamp && (
        <div style={{ fontSize: 10, color: theme === "dark" ? "#888" : "#999" }}>
          Last updated: {new Date(lastTimestamp).toLocaleString()}
        </div>
      )}

      {/* <Button
        size="small"
        style={{ marginTop: 16, marginBottom: 4 }}
        onClick={() => setShowRaw(s => !s)}
      >
        {showRaw ? "Hide Raw Data" : "Show Raw Data"}
      </Button>
      {showRaw && (
        <div
          style={{
            marginTop: 8,
            padding: 12,
            background: theme === "dark" ? "#222" : "#fafafa",
            fontFamily: "monospace",
            fontSize: 12,
            borderRadius: 6,
            wordBreak: "break-word",
            maxHeight: 120,
            overflowY: "auto"
          }}
        >
          <b>Raw Data:</b>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            {JSON.stringify(data && data.length ? data[data.length - 1] : {}, null, 2)}
          </pre>
        </div>
      )} */}
    </Card>
  )
}

export default ValueCardWidget

// import { useEffect, useState } from "react"
// import { Card, Statistic, Button } from "antd"
// import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons"

// const ValueCardWidget = ({
//   title = "Value Card",
//   value = 0,
//   unit = "",
//   prefix = "",
//   suffix = "",
//   trend = 0,
//   precision = 0,
//   data = [],
//   dataKeys = ["value"],  
//   theme = "light",
//   thresholds = null,  // { warning: number, critical: number }
// }) => {
//   const [showRaw, setShowRaw] = useState(false)

//   useEffect(() => {
//     console.log(`[WIDGET:${title}] Render. Data:`, data, "Keys:", dataKeys)
//   })

//   // Extract main value and trend %
//   let displayValue = value
//   let displayTrend = trend

//   if (Array.isArray(data) && data.length && Array.isArray(dataKeys) && dataKeys.length) {
//     const latestData = data[data.length - 1]
//     if (latestData && latestData[dataKeys[0]] !== undefined) {
//       displayValue = latestData[dataKeys[0]]

//       if (data.length > 1) {
//         const prevData = data[data.length - 2]
//         if (prevData && prevData[dataKeys[0]] !== undefined) {
//           const prevValue = prevData[dataKeys[0]]
//           if (prevValue !== 0) {
//             displayTrend = ((displayValue - prevValue) / Math.abs(prevValue)) * 100
//           }
//         }
//       }
//     }
//   }

//   // Round value
//   if (typeof displayValue === "number") {
//     displayValue = Number(displayValue.toFixed(precision))
//   }

//   // Compute min, max, avg for stats
//   const values = data
//     .map(d => d[dataKeys[0]])
//     .filter(v => typeof v === "number")

//   const minValue = values.length ? Math.min(...values) : null
//   const maxValue = values.length ? Math.max(...values) : null
//   const avgValue = values.length ? (values.reduce((a, b) => a + b, 0) / values.length) : null

//   // Last update time from latest data point
//   const lastTimestamp = data.length ? data[data.length - 1].time || null : null

//   // Absolute delta
//   const prevValue = data.length > 1 ? data[data.length - 2][dataKeys[0]] : null
//   const absoluteChange = prevValue !== null ? displayValue - prevValue : null

//   // Determine status color based on thresholds
//   let statusColor = undefined
//   if (thresholds) {
//     if (displayValue >= thresholds.critical) statusColor = "#cf1322" // red
//     else if (displayValue >= thresholds.warning) statusColor = "#fa8c16" // orange
//     else statusColor = "#3f8600" // green
//   }

//   // If no thresholds, fallback color based on trend
//   const valueColor =
//     statusColor ||
//     (displayTrend > 0 ? "#3f8600" :
//     displayTrend < 0 ? "#cf1322" : undefined)

//   return (
//     <Card
//       bordered
//       style={{
//         height: "100%",
//         padding: 16,
//         borderColor: statusColor || undefined,
//         borderWidth: statusColor ? 2 : undefined,
//         borderStyle: statusColor ? "solid" : undefined,
//       }}
//       className={`value-card-widget ${theme === "dark" ? "widget-theme-dark" : ""}`}
//     >
//       <Statistic
//         title={title}
//         value={displayValue}
//         precision={precision}
//         valueStyle={{ color: valueColor }}
//         prefix={prefix}
//         suffix={suffix || unit}
//       />

//       {/* Trend % */}
//       {displayTrend !== 0 && (
//         <div style={{ marginBottom: 12 }}>
//           {displayTrend > 0 ? (
//             <span style={{ color: "#3f8600", fontWeight: "bold" }}>
//               <ArrowUpOutlined /> {displayTrend.toFixed(1)}%
//             </span>
//           ) : (
//             <span style={{ color: "#cf1322", fontWeight: "bold" }}>
//               <ArrowDownOutlined /> {Math.abs(displayTrend).toFixed(1)}%
//             </span>
//           )}
//         </div>
//       )}

//       {/* Absolute delta */}
//       {absoluteChange !== null && (
//         <div style={{ fontSize: 12, color: theme === "dark" ? "#bbb" : "#555" }}>
//           Δ {absoluteChange.toFixed(precision)} {unit}
//         </div>
//       )}

//       {/* Min, Max, Avg stats */}
//       {minValue !== null && maxValue !== null && avgValue !== null && (
//         <div style={{ marginTop: 8, fontSize: 12, color: theme === "dark" ? "#bbb" : "#555" }}>
//           Min: {minValue.toFixed(precision)}, Max: {maxValue.toFixed(precision)}, Avg: {avgValue.toFixed(precision)}
//         </div>
//       )}

//       {/* Last updated timestamp */}
//       {lastTimestamp && (
//         <div style={{ fontSize: 10, color: theme === "dark" ? "#888" : "#999" }}>
//           Last updated: {new Date(lastTimestamp).toLocaleString()}
//         </div>
//       )}

//       {/* <Button
//         size="small"
//         style={{ marginTop: 16, marginBottom: 4 }}
//         onClick={() => setShowRaw(s => !s)}
//       >
//         {showRaw ? "Hide Raw Data" : "Show Raw Data"}
//       </Button>
//       {showRaw && (
//         <div
//           style={{
//             marginTop: 8,
//             padding: 12,
//             background: theme === "dark" ? "#222" : "#fafafa",
//             fontFamily: "monospace",
//             fontSize: 12,
//             borderRadius: 6,
//             wordBreak: "break-word",
//             maxHeight: 120,
//             overflowY: "auto"
//           }}
//         >
//           <b>Raw Data:</b>
//           <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
//             {JSON.stringify(data && data.length ? data[data.length - 1] : {}, null, 2)}
//           </pre>
//         </div>
//       )} */}
//     </Card>
//   )
// }

// export default ValueCardWidget

// // import { useEffect, useState } from "react"
// // import { Card, Statistic, Button } from "antd"
// // import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons"

// // // ValueCardWidget: Shows latest value from data array using the key(s) given in dataKeys
// // const ValueCardWidget = ({
// //   title = "Value Card",
// //   value = 0,
// //   unit = "",
// //   prefix = "",
// //   suffix = "",
// //   trend = 0,
// //   precision = 0,
// //   data = [],
// //   dataKeys = ["value"],  // <-- this should match your telemetryKeys!
// //   theme = "light",
// // }) => {
// //   // State for toggling raw data visibility
// //   const [showRaw, setShowRaw] = useState(false)

// //   // LOG on every render
// //   useEffect(() => {
// //     console.log(`[WIDGET:${title}] Render. Data:`, data, "Keys:", dataKeys)
// //   })

// //   // --- Value/Trend extraction ---
// //   let displayValue = value
// //   let displayTrend = trend

// //   if (Array.isArray(data) && data.length && Array.isArray(dataKeys) && dataKeys.length) {
// //     const latestData = data[data.length - 1]
// //     if (latestData && latestData[dataKeys[0]] !== undefined) {
// //       displayValue = latestData[dataKeys[0]]
// //       console.log(`[WIDGET:${title}] Latest value:`, displayValue)

// //       // Compute trend if enough data points
// //       if (data.length > 1) {
// //         const prevData = data[data.length - 2]
// //         if (prevData && prevData[dataKeys[0]] !== undefined) {
// //           const prevValue = prevData[dataKeys[0]]
// //           if (prevValue !== 0) {
// //             displayTrend = ((displayValue - prevValue) / Math.abs(prevValue)) * 100
// //             console.log(`[WIDGET:${title}] Trend: ${(displayTrend > 0 ? "+" : "") + displayTrend.toFixed(2)}% (Prev: ${prevValue} → Now: ${displayValue})`)
// //           }
// //         }
// //       }
// //     }
// //   } else {
// //     console.log(`[WIDGET:${title}] No data available to display`)
// //   }

// //   // Format the value
// //   if (typeof displayValue === "number") {
// //     displayValue = Number(displayValue.toFixed(precision))
// //   }

// //   // Determine color based on trend
// //   const valueColor =
// //     displayTrend > 0 ? "#3f8600" :
// //     displayTrend < 0 ? "#cf1322" : undefined

// //   return (
// //     <Card
// //       bordered
// //       style={{ height: "100%" }}
// //       className={`value-card-widget ${theme === "dark" ? "widget-theme-dark" : ""}`}
// //     >
// //       <Statistic
// //         title={title}
// //         value={displayValue}
// //         precision={precision}
// //         valueStyle={{ color: valueColor }}
// //         prefix={prefix}
// //         suffix={suffix || unit}
// //       />
// //       {displayTrend !== 0 && (
// //         <div style={{ marginTop: 8 }}>
// //           {displayTrend > 0 ? (
// //             <span style={{ color: "#3f8600" }}>
// //               <ArrowUpOutlined /> {displayTrend.toFixed(1)}%
// //             </span>
// //           ) : (
// //             <span style={{ color: "#cf1322" }}>
// //               <ArrowDownOutlined /> {Math.abs(displayTrend).toFixed(1)}%
// //             </span>
// //           )}
// //         </div>
// //       )}

// //       {/* --- Toggle Button and Raw Data Display --- */}
// //       <Button
// //         size="small"
// //         style={{ marginTop: 16, marginBottom: 4 }}
// //         onClick={() => setShowRaw(s => !s)}
// //       >
// //         {showRaw ? "Hide Raw Data" : "Show Raw Data"}
// //       </Button>
// //       {showRaw && (
// //         <div
// //           style={{
// //             marginTop: 8,
// //             padding: 8,
// //             background: theme === "dark" ? "#222" : "#fafafa",
// //             fontFamily: "monospace",
// //             fontSize: 12,
// //             borderRadius: 6,
// //             wordBreak: "break-all",
// //             maxHeight: 120,
// //             overflowY: "auto"
// //           }}
// //         >
// //           <b>Raw Data:</b>
// //           <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
// //             {/* {JSON.stringify(data, null, 2)} */}
// //               {JSON.stringify(data && data.length ? data[data.length - 1] : {}, null, 2)}
// //           </pre>
// //         </div>
// //       )}
// //     </Card>
// //   )
// // }

// // export default ValueCardWidget


// // // import { useEffect } from "react"
// // // import { Card, Statistic } from "antd"
// // // import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons"

// // // // ValueCardWidget: Shows latest value from data array using the key(s) given in dataKeys
// // // const ValueCardWidget = ({
// // //   title = "Value Card",
// // //   value = 0,
// // //   unit = "",
// // //   prefix = "",
// // //   suffix = "",
// // //   trend = 0,
// // //   precision = 0,
// // //   data = [],
// // //   dataKeys = ["value"],  // <-- this should match your telemetryKeys!
// // //   theme = "light",
// // // }) => {
// // //   // LOG on every render
// // //   useEffect(() => {
// // //     console.log(`[WIDGET:${title}] Render. Data:`, data, "Keys:", dataKeys)
// // //   })

// // //   // --- Value/Trend extraction ---
// // //   let displayValue = value
// // //   let displayTrend = trend

// // //   if (Array.isArray(data) && data.length && Array.isArray(dataKeys) && dataKeys.length) {
// // //     const latestData = data[data.length - 1]
// // //     if (latestData && latestData[dataKeys[0]] !== undefined) {
// // //       displayValue = latestData[dataKeys[0]]
// // //       console.log(`[WIDGET:${title}] Latest value:`, displayValue)

// // //       // Compute trend if enough data points
// // //       if (data.length > 1) {
// // //         const prevData = data[data.length - 2]
// // //         if (prevData && prevData[dataKeys[0]] !== undefined) {
// // //           const prevValue = prevData[dataKeys[0]]
// // //           if (prevValue !== 0) {
// // //             displayTrend = ((displayValue - prevValue) / Math.abs(prevValue)) * 100
// // //             console.log(`[WIDGET:${title}] Trend: ${(displayTrend > 0 ? "+" : "") + displayTrend.toFixed(2)}% (Prev: ${prevValue} → Now: ${displayValue})`)
// // //           }
// // //         }
// // //       }
// // //     }
// // //   } else {
// // //     console.log(`[WIDGET:${title}] No data available to display`)
// // //   }

// // //   // Format the value
// // //   if (typeof displayValue === "number") {
// // //     displayValue = Number(displayValue.toFixed(precision))
// // //   }

// // //   // Determine color based on trend
// // //   const valueColor =
// // //     displayTrend > 0 ? "#3f8600" :
// // //     displayTrend < 0 ? "#cf1322" : undefined

// // //   return (
// // //     <Card
// // //       bordered
// // //       style={{ height: "100%" }}
// // //       className={`value-card-widget ${theme === "dark" ? "widget-theme-dark" : ""}`}
// // //     >
// // //       <Statistic
// // //         title={title}
// // //         value={displayValue}
// // //         precision={precision}
// // //         valueStyle={{ color: valueColor }}
// // //         prefix={prefix}
// // //         suffix={suffix || unit}
// // //       />
// // //       {displayTrend !== 0 && (
// // //         <div style={{ marginTop: 8 }}>
// // //           {displayTrend > 0 ? (
// // //             <span style={{ color: "#3f8600" }}>
// // //               <ArrowUpOutlined /> {displayTrend.toFixed(1)}%
// // //             </span>
// // //           ) : (
// // //             <span style={{ color: "#cf1322" }}>
// // //               <ArrowDownOutlined /> {Math.abs(displayTrend).toFixed(1)}%
// // //             </span>
// // //           )}
// // //         </div>
// // //       )}
// // //     </Card>
// // //   )
// // // }

// // // export default ValueCardWidget


// // // // import { Card, Typography, Statistic } from "antd"
// // // // import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons"

// // // // const { Title } = Typography

// // // // const ValueCardWidget = ({
// // // //   title = "Value Card",
// // // //   value = 75,
// // // //   unit = "",
// // // //   prefix = "",
// // // //   suffix = "",
// // // //   trend = 0,
// // // //   precision = 0,
// // // //   data = [],
// // // //   dataKeys = ["value"],
// // // //   theme = "light",
// // // // }) => {
// // // //   // Extract the latest value from data if available
// // // //   let displayValue = value
// // // //   let displayTrend = trend

// // // //   if (data && data.length > 0 && dataKeys && dataKeys.length > 0) {
// // // //     const latestData = data[data.length - 1]
// // // //     if (latestData && latestData[dataKeys[0]] !== undefined) {
// // // //       displayValue = latestData[dataKeys[0]]

// // // //       // Calculate trend if we have enough data points
// // // //       if (data.length > 1) {
// // // //         const previousData = data[data.length - 2]
// // // //         if (previousData && previousData[dataKeys[0]] !== undefined) {
// // // //           const previousValue = previousData[dataKeys[0]]
// // // //           if (previousValue !== 0) {
// // // //             displayTrend = ((displayValue - previousValue) / Math.abs(previousValue)) * 100
// // // //           }
// // // //         }
// // // //       }
// // // //     }
// // // //   }

// // // //   // Format the value
// // // //   if (typeof displayValue === "number") {
// // // //     displayValue = Number(displayValue.toFixed(precision))
// // // //   }

// // // //   // Determine color based on trend
// // // //   const valueColor = displayTrend > 0 ? "#3f8600" : displayTrend < 0 ? "#cf1322" : undefined

// // // //   return (
// // // //     <Card
// // // //       bordered={true}
// // // //       style={{ height: "100%" }}
// // // //       className={`value-card-widget ${theme === "dark" ? "widget-theme-dark" : ""}`}
// // // //     >
// // // //       <Statistic
// // // //         title={title}
// // // //         value={displayValue}
// // // //         precision={precision}
// // // //         valueStyle={{ color: valueColor }}
// // // //         prefix={prefix}
// // // //         suffix={suffix || unit}
// // // //       />
// // // //       {displayTrend !== 0 && (
// // // //         <div style={{ marginTop: 8 }}>
// // // //           {displayTrend > 0 ? (
// // // //             <span style={{ color: "#3f8600" }}>
// // // //               <ArrowUpOutlined /> {displayTrend.toFixed(1)}%
// // // //             </span>
// // // //           ) : (
// // // //             <span style={{ color: "#cf1322" }}>
// // // //               <ArrowDownOutlined /> {Math.abs(displayTrend).toFixed(1)}%
// // // //             </span>
// // // //           )}
// // // //         </div>
// // // //       )}
// // // //     </Card>
// // // //   )
// // // // }

// // // // export default ValueCardWidget
