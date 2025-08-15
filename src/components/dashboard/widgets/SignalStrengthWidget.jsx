import React, { useMemo } from "react"
import { Card, Typography, theme as antdTheme } from "antd"
import { WifiOutlined } from "@ant-design/icons"

const { Title, Text } = Typography

const SignalStrengthWidget = ({
  title = "Signal Strength",
  strength = 0,
  data = [],
  dataKeys = ["strength"],
  theme = "light",
  precision = 0,
  colorThresholds = [
    { threshold: 0.3, color: "#f5222d" },  // red below 30%
    { threshold: 0.7, color: "#faad14" },  // yellow 30-70%
    { threshold: 1.0, color: "#52c41a" },  // green above 70%
  ],
}) => {
  const {
    token: { colorText, colorTextSecondary },
  } = antdTheme.useToken()

  // Extract latest signal strength from data or fallback to prop
  const currentStrength = useMemo(() => {
    if (data && data.length && dataKeys && dataKeys.length) {
      const latest = data[data.length - 1]
      if (latest && typeof latest[dataKeys[0]] === "number") {
        return Math.min(100, Math.max(0, latest[dataKeys[0]]))
      }
    }
    return Math.min(100, Math.max(0, strength))
  }, [data, dataKeys, strength])

  // Determine color based on thresholds
  const strokeColor = useMemo(() => {
    const normalized = currentStrength / 100
    for (const { threshold, color } of colorThresholds) {
      if (normalized <= threshold) return color
    }
    return colorThresholds[colorThresholds.length - 1].color
  }, [currentStrength, colorThresholds])

  // Icon size scaled by strength
  const iconSize = 24 + (currentStrength / 100) * 24

  return (
    <Card
      bordered
      style={{
        height: "100%",
        backgroundColor: theme === "dark" ? "#1f1f1f" : undefined,
        display: "flex",
        flexDirection: "column",
        padding: 16,
      }}
    >
      <Title
        level={5}
        style={{
          marginBottom: 16,
          color: colorText,
          userSelect: "none",
          textAlign: "left",
          flexShrink: 0,
        }}
      >
        {title}
      </Title>

      <div
        style={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <WifiOutlined
          style={{
            fontSize: iconSize,
            color: strokeColor,
            transition: "color 0.3s ease, font-size 0.3s ease",
            userSelect: "none",
          }}
        />
        <Text
          strong
          style={{
            fontSize: 28,
            marginTop: 12,
            color: strokeColor,
            userSelect: "none",
          }}
        >
          {currentStrength.toFixed(precision)}%
        </Text>
        <Text
          type="secondary"
          style={{
            marginTop: 4,
            fontSize: 14,
            color: colorTextSecondary,
            userSelect: "none",
          }}
        >
          Signal Quality
        </Text>
      </div>
    </Card>
  )
}

export default SignalStrengthWidget
