import React, { useMemo, useCallback, useState } from "react"
import { Card, Typography, Button, Tooltip as AntdTooltip, theme as antdTheme } from "antd"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector,
} from "recharts"
import { DownloadOutlined } from "@ant-design/icons"

const { Title } = Typography

const DEFAULT_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#83a6ed",
]

function downloadCSV(data, name = "pie-chart-data.csv") {
  if (!data || data.length === 0) return

  const header = Object.keys(data[0])
  const csvRows = [header.join(",")]

  data.forEach((row) => {
    const values = header.map((key) => JSON.stringify(row[key], replacer))
    csvRows.push(values.join(","))
  })

  function replacer(key, value) {
    return value === null ? "" : value
  }

  const csvString = csvRows.join("\n")
  const blob = new Blob([csvString], { type: "text/csv" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

const RADIAN = Math.PI / 180

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
  name,
  fill,
  labelFormatter,
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  const labelText = labelFormatter
    ? labelFormatter(name, percent)
    : `${name} ${(percent * 100).toFixed(0)}%`

  return (
    <text
      x={x}
      y={y}
      fill={fill}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={12}
      fontWeight="600"
      aria-label={labelText}
    >
      {labelText}
    </text>
  )
}

{/* <PieChartWidget
  title="Sales Breakdown"
  data={liveData}           // Real-time array of data points [{ name: 'A', value: 30 }, ...]
  dataKeys={["categoryA", "categoryB", "categoryC"]} // Keys from telemetry
  config={{
    colors: ["#FF6384", "#36A2EB", "#FFCE56"],
    innerRadius: 50,
    outerRadius: 80,
    labelLine: false,
    legendLayout: "vertical",
    legendAlign: "right",
    legendVerticalAlign: "middle",
  }}
  donutCenterText="Total Sales"
  theme="dark"
  onSliceClick={(slice) => alert(`Clicked slice: ${slice.name} (${slice.value})`)}
  tooltipFormatter={(val, name) => [`${val} units`, name.toUpperCase()]}
  tooltipLabelFormatter={(label) => `Category: ${label}`}
  onLegendClick={(item) => console.log("Legend clicked", item)}
/> */}

const PieChartWidget = ({
  title = "Pie Chart",
  data = [],
  dataKeys = [], // list of telemetry keys to show, aggregated from latest data point
  config = {},   // colors, radius, labels, export options, etc.
  theme = "light",
  donutCenterText = null,
  labelFormatter = null, // function (name, percent) => ReactNode
  ariaLabel = "Pie chart visualization",

  // Advanced props:
  onSliceClick = null,         // function(sliceData)
  tooltipFormatter = null,     // function(value, name)
  tooltipLabelFormatter = null,// function(label)
  legendLayout = "horizontal", // "horizontal" | "vertical"
  legendAlign = "center",      // "left" | "center" | "right"
  legendVerticalAlign = "bottom", // "top" | "middle" | "bottom"
  onLegendClick = null,        // function(item)
}) => {
  const {
    token: {
      colorText,
      colorTextSecondary,
      colorBorder,
      colorPrimary,
      colorBgContainer,
    },
  } = antdTheme.useToken()

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    if (dataKeys && dataKeys.length > 0) {
      const latest = data[data.length - 1]
      if (!latest) return []

      return dataKeys.map((key) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: typeof latest[key] === "number" ? latest[key] : 0,
      }))
    }
    return data
  }, [data, dataKeys])

  const colors = config.colors || DEFAULT_COLORS
  const outerRadius = config.outerRadius || 90
  const innerRadius = config.innerRadius || 40
  const labelLine = config.labelLine !== undefined ? config.labelLine : true
  const legendHeight = config.legendHeight || 36
  const legendIconSize = config.legendIconSize || 12

  const handleExportCSV = useCallback(() => {
    downloadCSV(chartData, config.exportFileName || "pie-chart-data.csv")
  }, [chartData, config.exportFileName])

  // Slice hover state for highlighting
  const [activeIndex, setActiveIndex] = useState(null)

  // Legend click handler (wrap for optional prop)
  const legendClickHandler = useCallback((item) => {
    if (onLegendClick) onLegendClick(item)
  }, [onLegendClick])

  if (!chartData.length) {
    return (
      <Card
        title={title}
        bordered
        style={{ height: "100%", textAlign: "center", padding: 24 }}
        headStyle={{ textAlign: "left", color: colorText }}
      >
        <div style={{ color: colorTextSecondary }}>No data available</div>
      </Card>
    )
  }

  return (
    <Card
      title={title}
      bordered
      style={{ height: "100%", padding: 16 }}
      bodyStyle={{ padding: 0, position: "relative" }}
      headStyle={{ textAlign: "left", color: colorText }}
      aria-label={ariaLabel}
    >
      <AntdTooltip title="Export CSV">
        <Button
          size="small"
          icon={<DownloadOutlined />}
          onClick={handleExportCSV}
          style={{
            position: "absolute",
            right: 16,
            top: 16,
            zIndex: 10,
            backgroundColor: colorBgContainer,
            borderRadius: 4,
          }}
        />
      </AntdTooltip>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              fill="#8884d8"
              dataKey="value"
              labelLine={labelLine}
              label={(props) =>
                renderCustomizedLabel({ ...props, labelFormatter })
              }
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-in-out"
              activeIndex={activeIndex}
              activeShape={(props) => {
                // Slightly expand active slice
                const RADIAN = Math.PI / 180
                const {
                  cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
                  fill, payload, percent, value,
                } = props

                const expandOffset = 10
                const sin = Math.sin(-RADIAN * midAngle)
                const cos = Math.cos(-RADIAN * midAngle)
                const sx = cx + (outerRadius + expandOffset) * cos
                const sy = cy + (outerRadius + expandOffset) * sin
                const mx = cx + (outerRadius + expandOffset / 2) * cos
                const my = cy + (outerRadius + expandOffset / 2) * sin
                const ex = sx + (cos >= 0 ? 1 : -1) * 22
                const ey = sy
                const textAnchor = cos >= 0 ? "start" : "end"

                return (
                  <g>
                    <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontWeight="bold" fontSize={18}>
                      {payload.name}
                    </text>
                    <Sector
                      cx={cx}
                      cy={cy}
                      innerRadius={innerRadius}
                      outerRadius={outerRadius + expandOffset}
                      startAngle={startAngle}
                      endAngle={endAngle}
                      fill={fill}
                      stroke={fill}
                      strokeWidth={2}
                    />
                    <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
                    <circle cx={ex} cy={ey} r={4} fill={fill} stroke="none" />
                    <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill={colorText} fontSize={14} fontWeight="bold">
                      {`${payload.name}: ${(percent * 100).toFixed(2)}% (${value})`}
                    </text>
                  </g>
                )
              }}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={(data, index) => onSliceClick && onSliceClick(data.payload)}
              role="list"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                  stroke={theme === "dark" ? colorBorder : colorBgContainer}
                  strokeWidth={1}
                  aria-label={`${entry.name}: ${entry.value}`}
                  style={{ cursor: onSliceClick ? "pointer" : "default" }}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={tooltipFormatter || ((value, name) => [value, name])}
              labelFormatter={tooltipLabelFormatter || ((label) => label)}
              itemStyle={{ color: colorText }}
              contentStyle={{
                backgroundColor: theme === "dark" ? "#222" : "#fff",
                borderColor: colorBorder,
                borderRadius: 4,
                fontSize: 12,
              }}
              cursor={{
                fill: theme === "dark"
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.1)",
              }}
            />

            <Legend
              layout={legendLayout}
              align={legendAlign}
              verticalAlign={legendVerticalAlign}
              height={legendHeight}
              wrapperStyle={{ fontSize: 12, color: colorText, paddingTop: 10 }}
              iconSize={legendIconSize}
              onClick={legendClickHandler}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {donutCenterText && innerRadius > 0 && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            userSelect: "none",
            textAlign: "center",
            color: colorText,
            fontWeight: "600",
            fontSize: 24,
            whiteSpace: "nowrap",
          }}
        >
          {donutCenterText}
        </div>
      )}
    </Card>
  )
}

export default PieChartWidget



// import { Card, Typography } from "antd"
// import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

// const { Title } = Typography

// const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#83a6ed"]

// const PieChartWidget = ({ title = "Pie Chart", data = null }) => {
//   // Generate sample data if none provided
//   const chartData = data || [
//     { name: "Category 1", value: 27 },
//     { name: "Category 2", value: 25 },
//     { name: "Category 3", value: 18 },
//     { name: "Category 4", value: 15 },
//     { name: "Category 5", value: 10 },
//     { name: "Others", value: 5 },
//   ]

//   return (
//     <Card title={title} bordered={true} style={{ height: "100%" }}>
//       <div style={{ width: "100%", height: 300 }}>
//         <ResponsiveContainer>
//           <PieChart>
//             <Pie
//               data={chartData}
//               cx="50%"
//               cy="50%"
//               labelLine={true}
//               outerRadius={80}
//               fill="#8884d8"
//               dataKey="value"
//               label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
//             >
//               {chartData.map((entry, index) => (
//                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//               ))}
//             </Pie>
//             <Tooltip />
//             <Legend />
//           </PieChart>
//         </ResponsiveContainer>
//       </div>
//     </Card>
//   )
// }

// export default PieChartWidget
