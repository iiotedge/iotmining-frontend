import { useMemo, useState, useEffect } from "react"
import { Card, Typography, Progress, theme as antdTheme, Spin } from "antd"

const { Text } = Typography

const ProgressBarWidget = ({
  title = "Progress Bar",
  progress = 0,
  unit = "%",
  colorThresholds = [
    { threshold: 0.3, color: "#f5222d" },   // Red below 30%
    { threshold: 0.7, color: "#faad14" },   // Yellow 30-70%
    { threshold: 1.0, color: "#52c41a" },   // Green above 70%
  ],
  precision = 0,
  data = [],
  dataKeys = ["value"],
  loading = false,
  theme = "light",
  barHeight = 24,
}) => {
  const {
    token: { colorText, colorTextSecondary },
  } = antdTheme.useToken()

  // Animated progress state for smooth transitions
  const [animatedProgress, setAnimatedProgress] = useState(0)

  // Update animated progress smoothly when currentProgress changes
  const currentProgress = useMemo(() => {
    if (data && data.length && dataKeys && dataKeys.length) {
      const latest = data[data.length - 1]
      if (latest && typeof latest[dataKeys[0]] === "number") {
        return Math.min(100, Math.max(0, latest[dataKeys[0]]))
      }
    }
    return Math.min(100, Math.max(0, progress))
  }, [data, dataKeys, progress])

  useEffect(() => {
    let rafId
    let start = null
    const duration = 500 // animation duration ms
    const from = animatedProgress
    const to = currentProgress

    const animate = (timestamp) => {
      if (!start) start = timestamp
      const elapsed = timestamp - start
      const progressRatio = Math.min(elapsed / duration, 1)
      const value = from + (to - from) * progressRatio
      setAnimatedProgress(value)
      if (elapsed < duration) {
        rafId = requestAnimationFrame(animate)
      } else {
        setAnimatedProgress(to)
      }
    }
    rafId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(rafId)
  }, [currentProgress])

  // Determine color based on thresholds
  const strokeColor = useMemo(() => {
    const normalized = animatedProgress / 100
    for (const { threshold, color } of colorThresholds) {
      if (normalized <= threshold) return color
    }
    return colorThresholds[colorThresholds.length - 1].color
  }, [animatedProgress, colorThresholds])

  if (loading) {
    return (
      <Card title={title} bordered style={{ height: "100%", textAlign: "center" }}>
        <Spin tip="Loading..." />
      </Card>
    )
  }

  return (
    <Card
      title={title}
      bordered
      style={{ height: "100%" }}
      bodyStyle={{ textAlign: "center", padding: "24px 16px" }}
      className={theme === "dark" ? "widget-theme-dark" : ""}
    >
      <Progress
        percent={Number(animatedProgress.toFixed(precision))}
        strokeColor={strokeColor}
        status={animatedProgress >= 100 ? "success" : "active"}
        showInfo={true}
        format={(percent) => `${percent.toFixed(precision)}${unit}`}
        strokeWidth={barHeight}
        style={{ marginBottom: 16, fontWeight: "bold", color: colorText }}
        // Tooltip enabled by default in antd Progress, no extra needed
      />
      <Text
        strong
        style={{
          fontSize: 28,
          color: colorText,
          userSelect: "none",
          display: "block",
        }}
      >
        {animatedProgress.toFixed(precision)}
        {unit && <span style={{ fontSize: 16, marginLeft: 4 }}>{unit}</span>}
      </Text>
    </Card>
  )
}

export default ProgressBarWidget
