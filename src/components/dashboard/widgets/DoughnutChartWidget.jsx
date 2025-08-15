import React, { useState, useMemo, useEffect, useRef } from "react"
import { Card, Typography, Button, Tooltip, Dropdown, Menu } from "antd"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { DownloadOutlined, ArrowLeftOutlined, MoreOutlined } from "@ant-design/icons"
import { motion, AnimatePresence } from "framer-motion"
import * as htmlToImage from 'html-to-image'
import dayjs from "dayjs"

const { Title } = Typography

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#83a6ed"]

const DoughnutChartWidget = ({
  title = "Doughnut Chart",
  data = [],
  drilldownData = {},
  theme = "light",
  onSliceClick: externalSliceClick = null,
  exportFileName = "chart-export",
}) => {
  const [currentData, setCurrentData] = useState(data)
  const [history, setHistory] = useState([])
  const [tooltipContent, setTooltipContent] = useState(null)
  const chartRef = useRef(null)

  // Memoized total for performance
  const total = useMemo(() => currentData.reduce((sum, item) => sum + (item.value || 0), 0), [currentData])

  // Drilldown click handler
  const handleSliceClick = (slice) => {
    if (externalSliceClick) {
      externalSliceClick(slice)
    }

    if (drilldownData && drilldownData[slice.name]) {
      setHistory((prev) => [...prev, currentData])
      setCurrentData(drilldownData[slice.name])
      setTooltipContent(null)
    }
  }

  // Back navigation
  const handleBack = () => {
    if (history.length > 0) {
      const previous = history[history.length - 1]
      setHistory((prev) => prev.slice(0, -1))
      setCurrentData(previous)
      setTooltipContent(null)
    }
  }

  // Export chart as PNG or SVG
  const exportMenu = (
    <Menu
      onClick={async ({ key }) => {
        if (!chartRef.current) return
        try {
          if (key === "png") {
            const dataUrl = await htmlToImage.toPng(chartRef.current)
            const a = document.createElement("a")
            a.href = dataUrl
            a.download = `${exportFileName}.png`
            a.click()
          } else if (key === "svg") {
            const dataUrl = await htmlToImage.toSvg(chartRef.current)
            const a = document.createElement("a")
            a.href = dataUrl
            a.download = `${exportFileName}.svg`
            a.click()
          }
        } catch (error) {
          console.error("Export failed:", error)
        }
      }}
    >
      <Menu.Item key="png">Export as PNG</Menu.Item>
      <Menu.Item key="svg">Export as SVG</Menu.Item>
    </Menu>
  )

  // Custom animated legend content
  const renderLegend = (props) => {
    const { payload } = props
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "center",
          marginTop: 16,
          userSelect: "none",
        }}
      >
        {history.length > 0 && (
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            size="small"
            style={{ marginRight: 20 }}
          >
            Back
          </Button>
        )}
        {payload.map((entry, index) => (
          <motion.div
            key={`legend-item-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            style={{
              display: "flex",
              alignItems: "center",
              cursor: drilldownData ? "pointer" : "default",
              gap: 8,
            }}
            onClick={() => handleSliceClick(currentData[index])}
          >
            <div
              style={{
                width: 16,
                height: 16,
                backgroundColor: entry.color,
                borderRadius: 4,
                border: `1px solid ${theme === "dark" ? "#555" : "#ccc"}`,
              }}
            />
            <span>
              {entry.value} ({((entry.payload.value / total) * 100).toFixed(1)}%)
            </span>
          </motion.div>
        ))}
      </div>
    )
  }

  // Animated custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, value } = payload[0]
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            backgroundColor: theme === "dark" ? "#333" : "#fff",
            border: `1px solid ${theme === "dark" ? "#555" : "#ccc"}`,
            padding: 8,
            borderRadius: 4,
            color: theme === "dark" ? "#eee" : "#000",
            fontSize: 12,
            pointerEvents: "none",
          }}
        >
          <div><strong>{name}</strong></div>
          <div>{value} ({((value / total) * 100).toFixed(2)}%)</div>
          <div>{dayjs().format("YYYY-MM-DD HH:mm:ss")}</div>
        </motion.div>
      )
    }
    return null
  }

  return (
    <Card
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            {title}
          </Title>
          <Dropdown overlay={exportMenu} placement="bottomRight" arrow>
            <Button icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </div>
      }
      bordered
      style={{ height: "100%" }}
      bodyStyle={{ padding: 0 }}
      className={theme === "dark" ? "widget-theme-dark" : ""}
    >
      <div
        ref={chartRef}
        style={{ width: "100%", height: 300, position: "relative" }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            zIndex: 1,
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: "14px" }}>Total</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{total}</div>
        </div>

        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={currentData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              onClick={(entry) => handleSliceClick(entry.payload)}
              cursor={drilldownData ? "pointer" : "default"}
              isAnimationActive={true}
              animationDuration={600}
              animationEasing="ease-in-out"
              onMouseEnter={(entry) => setTooltipContent(entry.payload)}
              onMouseLeave={() => setTooltipContent(null)}
            >
              {currentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default DoughnutChartWidget
