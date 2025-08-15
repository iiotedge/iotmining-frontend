import React, { useState, useEffect, useRef } from "react"
import { Card, Button, theme as antdTheme, Tooltip as AntdTooltip } from "antd"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from "recharts"
import dayjs from "dayjs"
import { DownloadOutlined } from "@ant-design/icons"

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ff7300",
  "#ff6e54",
  "#4f98ca",
  "#34c759",
  "#b00020",
  "#f7b731",
]

// ---- Dot-path helper ----
function getByDotPath(obj, path) {
  if (!obj || typeof obj !== "object" || !path) return undefined
  return path.split('.').reduce((acc, part) =>
    acc && Object.prototype.hasOwnProperty.call(acc, part) ? acc[part] : undefined, obj
  )
}

// ---- Label formatter: Extracts last segment, replaces underscores, capitalizes ----
function makeLabelFromDotPath(dotPath) {
  if (!dotPath) return ""
  const last = dotPath.split(".").pop()
  return last
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

const formatTime = (time) => {
  if (!time) return ""
  if (typeof time === "string") return dayjs(time).format("HH:mm:ss")
  if (typeof time === "number") return dayjs(time).format("HH:mm:ss")
  return String(time)
}

// ---- Use pretty label for tooltip ----
const tooltipFormatter = (value, name) => {
  return [value, makeLabelFromDotPath(name)]
}

const downloadCSV = (data, dataKeys) => {
  if (!data.length) return

  const header = ["Time", ...dataKeys.map(makeLabelFromDotPath)]
  const csvRows = [header.join(",")]

  data.forEach((row) => {
    const values = [row.time]
    dataKeys.forEach((key) => values.push(row[key]))
    csvRows.push(values.join(","))
  })

  const csvString = csvRows.join("\n")
  const blob = new Blob([csvString], { type: "text/csv" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = "chart-data.csv"
  a.click()
  URL.revokeObjectURL(url)
}

const LineChartWidget = ({
  title = "Line Chart",
  data = [],
  dataKeys = [],
  config = {},
  realtime = false, // enable realtime appending data simulation
  realtimeInterval = 3000,
}) => {
  const {
    token: { colorText, colorTextSecondary, colorBorder, colorPrimary },
  } = antdTheme.useToken()

  const [chartData, setChartData] = useState(data)
  const realtimeTimer = useRef(null)

  // Realtime data appending simulation (unchanged)
  useEffect(() => {
    if (!realtime) {
      setChartData(data)
      return () => {}
    }

    setChartData(data)

    realtimeTimer.current = setInterval(() => {
      setChartData((prevData) => {
        const lastTime = prevData.length ? new Date(prevData[prevData.length - 1].time).getTime() : Date.now()
        const newTime = new Date(lastTime + 1000 * 5) // every 5 seconds

        // Generate new datapoint with random values for keys
        const newPoint = { time: newTime.toISOString() }
        dataKeys.forEach((key) => {
          // Random walk or just random variation
          const lastVal = prevData.length ? prevData[prevData.length - 1][key] || 0 : 0
          const change = (Math.random() - 0.5) * (config.valueRange || 10)
          newPoint[key] = Math.max(0, lastVal + change)
        })

        // Keep max 100 points for performance
        const updatedData = [...prevData.slice(-99), newPoint]
        return updatedData
      })
    }, realtimeInterval)

    return () => {
      if (realtimeTimer.current) clearInterval(realtimeTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtime, data, dataKeys])

  // ---- Flatten chartData for dot-path keys
  const flattenedChartData = chartData.map(datum => {
    const out = { time: datum.time }
    dataKeys.forEach(key => {
      out[key] = getByDotPath(datum, key)
    })
    return out
  })

  if (!flattenedChartData?.length || !dataKeys?.length) {
    return (
      <Card title={title} bordered /*style={{ height: "100%" } } */ >
        <div
          style={{
            height: 280,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colorTextSecondary,
          }}
        >
          No data or telemetry keys selected.
        </div>
      </Card>
    )
  }

  return (
    <Card
      title={title}
      bordered
      extra={
        <AntdTooltip title="Export CSV">
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => downloadCSV(flattenedChartData, dataKeys)}
          />
        </AntdTooltip>
      }
      style={{ height: "100%" }}
    >
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart
            data={flattenedChartData}
            margin={{ top: 30, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={colorBorder} />
            <XAxis
              dataKey="time"
              tickFormatter={formatTime}
              tick={{ fill: colorTextSecondary, fontSize: 12 }}
              label={{ value: "Time", position: "insideBottomRight", offset: -20, fill: colorText }}
              minTickGap={15}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: colorTextSecondary, fontSize: 12 }}
              label={{ value: config.yAxisLabel || "", angle: -90, position: "insideLeft", fill: colorText }}
              allowDecimals={true}
              domain={["auto", "auto"]}
            />
            <Tooltip
              formatter={tooltipFormatter}
              labelFormatter={(label) => `Time: ${formatTime(label)}`}
              contentStyle={{ fontSize: 12 }}
              cursor={{ stroke: colorPrimary, strokeWidth: 1 }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ fontSize: 12, color: colorText }}
            />
            {dataKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={makeLabelFromDotPath(key)}
                stroke={COLORS[i % COLORS.length]}
                dot={false}
                isAnimationActive={false}
                strokeWidth={2}
                activeDot={{ r: 6 }}
              />
            ))}
            <Brush
              dataKey="time"
              height={30}
              stroke={colorPrimary}
              travellerWidth={10}
              tickFormatter={formatTime}
              tick={{ fill: colorTextSecondary, fontSize: 10 }}
              travellerStyle={{ fill: colorPrimary }}
              startIndex={Math.max(0, flattenedChartData.length - 30)}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default LineChartWidget

// import React, { useState, useEffect, useRef } from "react"
// import { Card, Button, theme as antdTheme, Tooltip as AntdTooltip } from "antd"
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   Brush,
// } from "recharts"
// import dayjs from "dayjs"
// import { DownloadOutlined } from "@ant-design/icons"

// const COLORS = [
//   "#8884d8",
//   "#82ca9d",
//   "#ff7300",
//   "#ff6e54",
//   "#4f98ca",
//   "#34c759",
//   "#b00020",
//   "#f7b731",
// ]

// // ---- Dot-path helper ----
// function getByDotPath(obj, path) {
//   if (!obj || typeof obj !== "object" || !path) return undefined
//   return path.split('.').reduce((acc, part) =>
//     acc && Object.prototype.hasOwnProperty.call(acc, part) ? acc[part] : undefined, obj
//   )
// }

// const formatTime = (time) => {
//   if (!time) return ""
//   if (typeof time === "string") return dayjs(time).format("HH:mm:ss")
//   if (typeof time === "number") return dayjs(time).format("HH:mm:ss")
//   return String(time)
// }

// const tooltipFormatter = (value, name) => {
//   return [value, name.charAt(0).toUpperCase() + name.slice(1)]
// }

// const downloadCSV = (data, dataKeys) => {
//   if (!data.length) return

//   const header = ["Time", ...dataKeys]
//   const csvRows = [header.join(",")]

//   data.forEach((row) => {
//     const values = [row.time]
//     dataKeys.forEach((key) => values.push(row[key]))
//     csvRows.push(values.join(","))
//   })

//   const csvString = csvRows.join("\n")
//   const blob = new Blob([csvString], { type: "text/csv" })
//   const url = URL.createObjectURL(blob)

//   const a = document.createElement("a")
//   a.href = url
//   a.download = "chart-data.csv"
//   a.click()
//   URL.revokeObjectURL(url)
// }

// const LineChartWidget = ({
//   title = "Line Chart",
//   data = [],
//   dataKeys = [],
//   config = {},
//   realtime = false, // enable realtime appending data simulation
//   realtimeInterval = 3000,
// }) => {
//   const {
//     token: { colorText, colorTextSecondary, colorBorder, colorPrimary },
//   } = antdTheme.useToken()

//   const [chartData, setChartData] = useState(data)
//   const realtimeTimer = useRef(null)

//   // Realtime data appending simulation (unchanged)
//   useEffect(() => {
//     if (!realtime) {
//       setChartData(data)
//       return () => {}
//     }

//     setChartData(data)

//     realtimeTimer.current = setInterval(() => {
//       setChartData((prevData) => {
//         const lastTime = prevData.length ? new Date(prevData[prevData.length - 1].time).getTime() : Date.now()
//         const newTime = new Date(lastTime + 1000 * 5) // every 5 seconds

//         // Generate new datapoint with random values for keys
//         const newPoint = { time: newTime.toISOString() }
//         dataKeys.forEach((key) => {
//           // Random walk or just random variation
//           const lastVal = prevData.length ? prevData[prevData.length - 1][key] || 0 : 0
//           const change = (Math.random() - 0.5) * (config.valueRange || 10)
//           newPoint[key] = Math.max(0, lastVal + change)
//         })

//         // Keep max 100 points for performance
//         const updatedData = [...prevData.slice(-99), newPoint]
//         return updatedData
//       })
//     }, realtimeInterval)

//     return () => {
//       if (realtimeTimer.current) clearInterval(realtimeTimer.current)
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [realtime, data, dataKeys])

//   // ---- Flatten chartData for dot-path keys
//   const flattenedChartData = chartData.map(datum => {
//     const out = { time: datum.time }
//     dataKeys.forEach(key => {
//       out[key] = getByDotPath(datum, key)
//     })
//     return out
//   })

//   if (!flattenedChartData?.length || !dataKeys?.length) {
//     return (
//       <Card title={title} bordered style={{ height: "100%" }}>
//         <div
//           style={{
//             height: 280,
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             color: colorTextSecondary,
//           }}
//         >
//           No data or telemetry keys selected.
//         </div>
//       </Card>
//     )
//   }

//   return (
//     <Card
//       title={title}
//       bordered
//       extra={
//         <AntdTooltip title="Export CSV">
//           <Button
//             size="small"
//             icon={<DownloadOutlined />}
//             onClick={() => downloadCSV(flattenedChartData, dataKeys)}
//           />
//         </AntdTooltip>
//       }
//       style={{ height: "100%" }}
//     >
//       <div style={{ width: "100%", height: 300 }}>
//         <ResponsiveContainer>
//           <LineChart
//             data={flattenedChartData}
//             margin={{ top: 30, right: 30, left: 20, bottom: 30 }}
//           >
//             <CartesianGrid strokeDasharray="3 3" stroke={colorBorder} />
//             <XAxis
//               dataKey="time"
//               tickFormatter={formatTime}
//               tick={{ fill: colorTextSecondary, fontSize: 12 }}
//               label={{ value: "Time", position: "insideBottomRight", offset: -20, fill: colorText }}
//               minTickGap={15}
//               interval="preserveStartEnd"
//             />
//             <YAxis
//               tick={{ fill: colorTextSecondary, fontSize: 12 }}
//               label={{ value: config.yAxisLabel || "", angle: -90, position: "insideLeft", fill: colorText }}
//               allowDecimals={true}
//               domain={["auto", "auto"]}
//             />
//             <Tooltip
//               formatter={tooltipFormatter}
//               labelFormatter={(label) => `Time: ${formatTime(label)}`}
//               contentStyle={{ fontSize: 12 }}
//               cursor={{ stroke: colorPrimary, strokeWidth: 1 }}
//             />
//             <Legend
//               verticalAlign="top"
//               height={36}
//               wrapperStyle={{ fontSize: 12, color: colorText }}
//             />
//             {dataKeys.map((key, i) => (
//               <Line
//                 key={key}
//                 type="monotone"
//                 dataKey={key}
//                 name={key.charAt(0).toUpperCase() + key.slice(1)}
//                 stroke={COLORS[i % COLORS.length]}
//                 dot={false}
//                 isAnimationActive={false}
//                 strokeWidth={2}
//                 activeDot={{ r: 6 }}
//               />
//             ))}
//             <Brush
//               dataKey="time"
//               height={30}
//               stroke={colorPrimary}
//               travellerWidth={10}
//               tickFormatter={formatTime}
//               tick={{ fill: colorTextSecondary, fontSize: 10 }}
//               travellerStyle={{ fill: colorPrimary }}
//               startIndex={Math.max(0, flattenedChartData.length - 30)}
//             />
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//     </Card>
//   )
// }

// export default LineChartWidget

// // import React, { useState, useEffect, useRef } from "react"
// // import { Card, Button, theme as antdTheme, Tooltip as AntdTooltip } from "antd"
// // import {
// //   LineChart,
// //   Line,
// //   XAxis,
// //   YAxis,
// //   CartesianGrid,
// //   Tooltip,
// //   Legend,
// //   ResponsiveContainer,
// //   Brush,
// // } from "recharts"
// // import dayjs from "dayjs"
// // import { DownloadOutlined } from "@ant-design/icons"

// // const COLORS = [
// //   "#8884d8",
// //   "#82ca9d",
// //   "#ff7300",
// //   "#ff6e54",
// //   "#4f98ca",
// //   "#34c759",
// //   "#b00020",
// //   "#f7b731",
// // ]

// // const formatTime = (time) => {
// //   if (!time) return ""
// //   if (typeof time === "string") return dayjs(time).format("HH:mm:ss")
// //   if (typeof time === "number") return dayjs(time).format("HH:mm:ss")
// //   return String(time)
// // }

// // const tooltipFormatter = (value, name) => {
// //   return [value, name.charAt(0).toUpperCase() + name.slice(1)]
// // }

// // const downloadCSV = (data, dataKeys) => {
// //   if (!data.length) return

// //   const header = ["Time", ...dataKeys]
// //   const csvRows = [header.join(",")]

// //   data.forEach((row) => {
// //     const values = [row.time]
// //     dataKeys.forEach((key) => values.push(row[key]))
// //     csvRows.push(values.join(","))
// //   })

// //   const csvString = csvRows.join("\n")
// //   const blob = new Blob([csvString], { type: "text/csv" })
// //   const url = URL.createObjectURL(blob)

// //   const a = document.createElement("a")
// //   a.href = url
// //   a.download = "chart-data.csv"
// //   a.click()
// //   URL.revokeObjectURL(url)
// // }

// // const LineChartWidget = ({
// //   title = "Line Chart",
// //   data = [],
// //   dataKeys = [],
// //   config = {},
// //   realtime = false, // enable realtime appending data simulation
// //   realtimeInterval = 3000,
// // }) => {
// //   const {
// //     token: { colorText, colorTextSecondary, colorBorder, colorPrimary },
// //   } = antdTheme.useToken()

// //   const [chartData, setChartData] = useState(data)
// //   const realtimeTimer = useRef(null)

// //   // Realtime data appending simulation
// //   useEffect(() => {
// //     if (!realtime) {
// //       setChartData(data)
// //       return () => {}
// //     }

// //     setChartData(data)

// //     realtimeTimer.current = setInterval(() => {
// //       setChartData((prevData) => {
// //         const lastTime = prevData.length ? new Date(prevData[prevData.length - 1].time).getTime() : Date.now()
// //         const newTime = new Date(lastTime + 1000 * 5) // every 5 seconds

// //         // Generate new datapoint with random values for keys
// //         const newPoint = { time: newTime.toISOString() }
// //         dataKeys.forEach((key) => {
// //           // Random walk or just random variation
// //           const lastVal = prevData.length ? prevData[prevData.length - 1][key] || 0 : 0
// //           const change = (Math.random() - 0.5) * (config.valueRange || 10)
// //           newPoint[key] = Math.max(0, lastVal + change)
// //         })

// //         // Keep max 100 points for performance
// //         const updatedData = [...prevData.slice(-99), newPoint]
// //         return updatedData
// //       })
// //     }, realtimeInterval)

// //     return () => {
// //       if (realtimeTimer.current) clearInterval(realtimeTimer.current)
// //     }
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [realtime, data, dataKeys])

// //   if (!chartData?.length || !dataKeys?.length) {
// //     return (
// //       <Card title={title} bordered style={{ height: "100%" }}>
// //         <div
// //           style={{
// //             height: 280,
// //             display: "flex",
// //             alignItems: "center",
// //             justifyContent: "center",
// //             color: colorTextSecondary,
// //           }}
// //         >
// //           No data or telemetry keys selected.
// //         </div>
// //       </Card>
// //     )
// //   }

// //   return (
// //     <Card
// //       title={title}
// //       bordered
// //       extra={
// //         <AntdTooltip title="Export CSV">
// //           <Button
// //             size="small"
// //             icon={<DownloadOutlined />}
// //             onClick={() => downloadCSV(chartData, dataKeys)}
// //           />
// //         </AntdTooltip>
// //       }
// //       style={{ height: "100%" }}
// //     >
// //       <div style={{ width: "100%", height: 300 }}>
// //         <ResponsiveContainer>
// //           <LineChart
// //             data={chartData}
// //             margin={{ top: 30, right: 30, left: 20, bottom: 30 }}
// //           >
// //             <CartesianGrid strokeDasharray="3 3" stroke={colorBorder} />
// //             <XAxis
// //               dataKey="time"
// //               tickFormatter={formatTime}
// //               tick={{ fill: colorTextSecondary, fontSize: 12 }}
// //               label={{ value: "Time", position: "insideBottomRight", offset: -20, fill: colorText }}
// //               minTickGap={15}
// //               interval="preserveStartEnd"
// //             />
// //             <YAxis
// //               tick={{ fill: colorTextSecondary, fontSize: 12 }}
// //               label={{ value: config.yAxisLabel || "", angle: -90, position: "insideLeft", fill: colorText }}
// //               allowDecimals={true}
// //               domain={["auto", "auto"]}
// //             />
// //             <Tooltip
// //               formatter={tooltipFormatter}
// //               labelFormatter={(label) => `Time: ${formatTime(label)}`}
// //               contentStyle={{ fontSize: 12 }}
// //               cursor={{ stroke: colorPrimary, strokeWidth: 1 }}
// //             />
// //             <Legend
// //               verticalAlign="top"
// //               height={36}
// //               wrapperStyle={{ fontSize: 12, color: colorText }}
// //             />
// //             {dataKeys.map((key, i) => (
// //               <Line
// //                 key={key}
// //                 type="monotone"
// //                 dataKey={key}
// //                 name={key.charAt(0).toUpperCase() + key.slice(1)}
// //                 stroke={COLORS[i % COLORS.length]}
// //                 dot={false}
// //                 isAnimationActive={false}
// //                 strokeWidth={2}
// //                 activeDot={{ r: 6 }}
// //               />
// //             ))}
// //             <Brush
// //               dataKey="time"
// //               height={30}
// //               stroke={colorPrimary}
// //               travellerWidth={10}
// //               tickFormatter={formatTime}
// //               tick={{ fill: colorTextSecondary, fontSize: 10 }}
// //               travellerStyle={{ fill: colorPrimary }}
// //               startIndex={Math.max(0, chartData.length - 30)}
// //             />
// //           </LineChart>
// //         </ResponsiveContainer>
// //       </div>
// //     </Card>
// //   )
// // }

// // export default LineChartWidget

// // // // src/components/dashboard/widgets/LineChartWidget.jsx
// // // import { Card } from "antd"
// // // import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// // // const COLORS = [
// // //   "#8884d8", "#82ca9d", "#ff7300", "#ff6e54", "#4f98ca", "#34c759", "#b00020", "#f7b731"
// // // ]

// // // const LineChartWidget = ({ title = "Line Chart", data = [], dataKeys = [], config = {} }) => {
// // //   if (!data?.length || !dataKeys?.length) {
// // //     return (
// // //       <Card title={title} bordered={true} style={{ height: "100%" }}>
// // //         <div style={{
// // //           height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb"
// // //         }}>
// // //           No data or telemetry keys selected.
// // //         </div>
// // //       </Card>
// // //     )
// // //   }

// // //   return (
// // //     <Card title={title} bordered={true} style={{ height: "100%" }}>
// // //       <div style={{ width: "100%", height: 300 }}>
// // //         <ResponsiveContainer>
// // //           <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
// // //             <CartesianGrid strokeDasharray="3 3" />
// // //             <XAxis dataKey="time" />
// // //             <YAxis />
// // //             <Tooltip />
// // //             <Legend />
// // //             {dataKeys.map((key, i) => (
// // //               <Line
// // //                 key={key}
// // //                 type="monotone"
// // //                 dataKey={key}
// // //                 name={key.charAt(0).toUpperCase() + key.slice(1)}
// // //                 stroke={COLORS[i % COLORS.length]}
// // //                 dot={false}
// // //                 isAnimationActive={false}
// // //               />
// // //             ))}
// // //           </LineChart>
// // //         </ResponsiveContainer>
// // //       </div>
// // //     </Card>
// // //   )
// // // }

// // // export default LineChartWidget


// // // // import { Card } from "antd"
// // // // import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// // // // const COLORS = [
// // // //   "#8884d8", "#82ca9d", "#ff7300", "#ff6e54", "#4f98ca", "#34c759", "#b00020", "#f7b731"
// // // // ]

// // // // const LineChartWidget = ({ title = "Line Chart", data = [], config = {} }) => {
// // // //   const keys = config?.dataSource?.telemetry || []

// // // //   if (!data?.length || !keys?.length) {
// // // //     return (
// // // //       <Card title={title} bordered={true} style={{ height: "100%" }}>
// // // //         <div style={{
// // // //           height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb"
// // // //         }}>
// // // //           No data or telemetry keys selected.
// // // //         </div>
// // // //       </Card>
// // // //     )
// // // //   }

// // // //   return (
// // // //     <Card title={title} bordered={true} style={{ height: "100%" }}>
// // // //       <div style={{ width: "100%", height: 300 }}>
// // // //         <ResponsiveContainer>
// // // //           <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
// // // //             <CartesianGrid strokeDasharray="3 3" />
// // // //             <XAxis dataKey="time" tickFormatter={t => {
// // // //               try { return new Date(t).toLocaleTimeString() } catch { return t }
// // // //             }}/>
// // // //             <YAxis />
// // // //             <Tooltip />
// // // //             <Legend />
// // // //             {keys.map((key, i) => (
// // // //               <Line
// // // //                 key={key}
// // // //                 type="monotone"
// // // //                 dataKey={key}
// // // //                 name={key.charAt(0).toUpperCase() + key.slice(1)}
// // // //                 stroke={COLORS[i % COLORS.length]}
// // // //                 dot={false}
// // // //                 isAnimationActive={false}
// // // //               />
// // // //             ))}
// // // //           </LineChart>
// // // //         </ResponsiveContainer>
// // // //       </div>
// // // //     </Card>
// // // //   )
// // // // }

// // // // export default LineChartWidget



// // // // import { Card, Typography } from "antd"
// // // // import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// // // // const { Title } = Typography

// // // // const LineChartWidget = ({ title = "Line Chart", data = null }) => {
// // // //   // Generate sample data if none provided
// // // //   const chartData = data || [
// // // //     { name: "Jan", Temperature: 65, Humidity: 28 },
// // // //     { name: "Feb", Temperature: 59, Humidity: 48 },
// // // //     { name: "Mar", Temperature: 80, Humidity: 40 },
// // // //     { name: "Apr", Temperature: 81, Humidity: 47 },
// // // //     { name: "May", Temperature: 56, Humidity: 65 },
// // // //     { name: "Jun", Temperature: 55, Humidity: 30 },
// // // //     { name: "Jul", Temperature: 40, Humidity: 32 },
// // // //   ]

// // // //   return (
// // // //     <Card title={title} bordered={true} style={{ height: "100%" }}>
// // // //       <div style={{ width: "100%", height: 300 }}>
// // // //         <ResponsiveContainer>
// // // //           <LineChart
// // // //             data={chartData}
// // // //             margin={{
// // // //               top: 5,
// // // //               right: 30,
// // // //               left: 20,
// // // //               bottom: 5,
// // // //             }}
// // // //           >
// // // //             <CartesianGrid strokeDasharray="3 3" />
// // // //             <XAxis dataKey="name" />
// // // //             <YAxis />
// // // //             <Tooltip />
// // // //             <Legend />
// // // //             <Line type="monotone" dataKey="Temperature" stroke="#8884d8" activeDot={{ r: 8 }} />
// // // //             <Line type="monotone" dataKey="Humidity" stroke="#82ca9d" />
// // // //           </LineChart>
// // // //         </ResponsiveContainer>
// // // //       </div>
// // // //     </Card>
// // // //   )
// // // // }

// // // // export default LineChartWidget
