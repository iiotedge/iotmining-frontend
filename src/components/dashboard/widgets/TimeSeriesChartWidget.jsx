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

const DEFAULT_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ff7300",
  "#ff6e54",
  "#4f98ca",
  "#34c759",
  "#b00020",
  "#f7b731",
]

const formatTime = (time) => {
  if (!time) return ""
  if (typeof time === "string") return dayjs(time).format("HH:mm")
  if (typeof time === "number") return dayjs(time).format("HH:mm")
  if (time instanceof Date) return dayjs(time).format("HH:mm")
  return String(time)
}

const tooltipFormatter = (value, name) => [
  value,
  name.charAt(0).toUpperCase() + name.slice(1),
]

const downloadCSV = (data, dataKeys, title = "chart-data") => {
  if (!data.length || !dataKeys.length) return

  const header = ["Time", ...dataKeys]
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
  a.download = `${title.replace(/\s+/g, "_").toLowerCase()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

{/* <TimeSeriesChartWidget
  title="Temperature & Humidity"
  data={yourDataArray}
  dataKeys={["temperature", "humidity"]}
  config={{ yAxisLabel: "Value" }}
  theme="light" // or "dark"
  realtime={false}
  enableBrush={true}
  enableExport={true}
  rotateXAxisLabels={true}
/> */}

const TimeSeriesChartWidget = ({
  title = "Time Series Chart",
  data = [],
  dataKeys = [],
  config = {},
  theme = "light",
  realtime = false,
  realtimeInterval = 3000,
  enableBrush = true,
  enableExport = true,
  rotateXAxisLabels = true,
}) => {
  const {
    token: { colorText, colorTextSecondary, colorBorder, colorPrimary },
  } = antdTheme.useToken()

  const [chartData, setChartData] = useState(data)
  const realtimeTimer = useRef(null)

  // Realtime data appending simulation (optional)
  useEffect(() => {
    if (!realtime) {
      setChartData(data)
      return () => {}
    }

    setChartData(data)

    realtimeTimer.current = setInterval(() => {
      setChartData((prevData) => {
        const lastTime = prevData.length
          ? new Date(prevData[prevData.length - 1].time).getTime()
          : Date.now()
        const newTime = new Date(lastTime + 1000 * 5) // every 5 seconds

        const newPoint = { time: newTime.toISOString() }
        dataKeys.forEach((key) => {
          const lastVal = prevData.length ? prevData[prevData.length - 1][key] || 0 : 0
          const change = (Math.random() - 0.5) * (config.valueRange || 10)
          newPoint[key] = Math.max(0, lastVal + change)
        })

        const updatedData = [...prevData.slice(-99), newPoint]
        return updatedData
      })
    }, realtimeInterval)

    return () => {
      if (realtimeTimer.current) clearInterval(realtimeTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtime, data, dataKeys])

  if (!chartData?.length || !dataKeys?.length) {
    return (
      <Card title={title} bordered style={{ height: "100%" }}>
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

  const COLORS = config.colors || DEFAULT_COLORS

  // Legend scroll if too many lines
  const legendWrapperStyle =
    dataKeys.length > 5
      ? {
          maxHeight: 36,
          overflowX: "auto",
          whiteSpace: "nowrap",
          paddingBottom: 6,
          fontSize: 12,
          color: colorText,
        }
      : {
          fontSize: 12,
          color: colorText,
        }

  return (
    <Card
      title={title}
      bordered
      style={{ height: "100%" }}
      bodyStyle={{ padding: 12 }}
      extra={
        enableExport && (
          <AntdTooltip title="Export CSV">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => downloadCSV(chartData, dataKeys, title)}
            />
          </AntdTooltip>
        )
      }
    >
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colorBorder} />
            <XAxis
              dataKey="time"
              tickFormatter={formatTime}
              tick={{
                fill: colorTextSecondary,
                fontSize: 12,
                transform: rotateXAxisLabels ? "rotate(-45deg)" : undefined,
                textAnchor: rotateXAxisLabels ? "end" : "middle",
              }}
              label={{
                value: config.xAxisLabel || "Time",
                position: "insideBottomRight",
                offset: -20,
                fill: colorText,
              }}
              minTickGap={15}
              interval="preserveStartEnd"
              height={rotateXAxisLabels ? 50 : 30}
            />
            <YAxis
              tick={{ fill: colorTextSecondary, fontSize: 12 }}
              label={{
                value: config.yAxisLabel || "",
                angle: -90,
                position: "insideLeft",
                fill: colorText,
              }}
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
              wrapperStyle={legendWrapperStyle}
            />
            {dataKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={key.charAt(0).toUpperCase() + key.slice(1)}
                stroke={COLORS[i % COLORS.length]}
                dot={false}
                isAnimationActive={false}
                strokeWidth={2}
                activeDot={{ r: 6 }}
              />
            ))}
            {enableBrush && (
              <Brush
                dataKey="time"
                height={30}
                stroke={colorPrimary}
                travellerWidth={10}
                tickFormatter={formatTime}
                tick={{ fill: colorTextSecondary, fontSize: 10 }}
                travellerStyle={{ fill: colorPrimary }}
                startIndex={Math.max(0, chartData.length - 30)}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default TimeSeriesChartWidget


// import { Card, Typography } from "antd"
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// const { Title } = Typography

// const TimeSeriesChartWidget = ({ title = "Time Series Chart", data = null }) => {
//   // Generate sample data if none provided
//   const generateTimeSeriesData = () => {
//     const result = []
//     const now = new Date()

//     for (let i = 0; i < 24; i++) {
//       const time = new Date(now)
//       time.setHours(now.getHours() - 24 + i)

//       result.push({
//         time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//         Temperature: Math.sin(i / 4) * 20 + 50 + Math.random() * 10,
//         Humidity: Math.cos(i / 4) * 30 + 40 + Math.random() * 10,
//       })
//     }

//     return result
//   }

//   const chartData = data || generateTimeSeriesData()

//   return (
//     <Card title={title} bordered={true} style={{ height: "100%" }}>
//       <div style={{ width: "100%", height: 300 }}>
//         <ResponsiveContainer>
//           <LineChart
//             data={chartData}
//             margin={{
//               top: 5,
//               right: 30,
//               left: 20,
//               bottom: 5,
//             }}
//           >
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="time" />
//             <YAxis />
//             <Tooltip />
//             <Legend />
//             <Line type="monotone" dataKey="Temperature" stroke="#8884d8" activeDot={{ r: 8 }} />
//             <Line type="monotone" dataKey="Humidity" stroke="#82ca9d" />
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//     </Card>
//   )
// }

// export default TimeSeriesChartWidget
