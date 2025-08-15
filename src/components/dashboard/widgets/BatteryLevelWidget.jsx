import React, { useMemo, useState } from "react"
import { Card, Typography, Progress, Tooltip, theme as antdTheme, Modal, Button, Form, InputNumber, Switch } from "antd"
import { PoweroffOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

dayjs.extend(relativeTime)

const { Title, Text } = Typography

const BatteryLevelWidget = ({
  title = "Battery Level",
  level = 0,
  data = [],
  dataKeys = ["level"],
  colorThresholds = [
    { threshold: 0.2, color: "#f5222d" }, // red below 20%
    { threshold: 0.6, color: "#faad14" }, // yellow 20-60%
    { threshold: 1.0, color: "#52c41a" }, // green above 60%
  ],
  precision = 0,
  theme = "light",
  size = "medium", // small, medium, large
  showLastUpdated = true,
  showIcon = true,
  animateProgress = true,
}) => {
  const {
    token: { colorText, colorTextSecondary },
  } = antdTheme.useToken()

  // Local state for settings modal
  const [settingsVisible, setSettingsVisible] = useState(false)

  // Extract latest battery level from data if available, else fallback to prop
  const currentLevel = useMemo(() => {
    if (data && data.length && dataKeys && dataKeys.length) {
      const latest = data[data.length - 1]
      if (latest && typeof latest[dataKeys[0]] === "number") {
        return Math.min(100, Math.max(0, latest[dataKeys[0]]))
      }
    }
    return Math.min(100, Math.max(0, level))
  }, [data, dataKeys, level])

  // Determine color based on thresholds
  const strokeColor = useMemo(() => {
    const normalized = currentLevel / 100
    for (const { threshold, color } of colorThresholds) {
      if (normalized <= threshold) return color
    }
    return colorThresholds[colorThresholds.length - 1].color
  }, [currentLevel, colorThresholds])

  // Format timestamp for tooltip if available
  const lastTimestamp = useMemo(() => {
    if (data && data.length) {
      const latest = data[data.length - 1]
      if (latest.timestamp) {
        return dayjs(latest.timestamp).fromNow()
      }
    }
    return null
  }, [data])

  // Size config
  const iconSizes = {
    small: 36,
    medium: 56,
    large: 80,
  }
  const progressWidths = {
    small: "100%",
    medium: 320,
    large: 400,
  }
  const titleFontSizes = {
    small: 16,
    medium: 20,
    large: 24,
  }

  // -- Settings Modal Handlers (to be connected with actual dynamic settings) --
  const [form] = Form.useForm()

  const openSettings = () => {
    setSettingsVisible(true)
    // Pre-fill form with current settings (if dynamic settings implemented)
    form.setFieldsValue({
      precision,
      size,
      animateProgress,
      showLastUpdated,
      showIcon,
      // thresholds can be pre-filled if saved in state or props
    })
  }
  const closeSettings = () => setSettingsVisible(false)

  const saveSettings = async () => {
    try {
      const values = await form.validateFields()
      // TODO: propagate these settings up via props or context/state management
      console.log("Save settings:", values)
      setSettingsVisible(false)
    } catch (error) {
      // validation failed
    }
  }

  return (
    <>
      <Card
        bordered
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          backgroundColor: theme === "dark" ? "#1f1f1f" : undefined,
          userSelect: "none",
          padding: size === "small" ? "16px 12px" : "24px 16px",
          position: "relative",
        }}
        bodyStyle={{ width: "100%", padding: 0 }}
        className={theme === "dark" ? "widget-theme-dark" : ""}
      >
        <Title
          level={5}
          style={{
            marginBottom: size === "small" ? 12 : 16,
            color: colorText,
            width: "100%",
            textAlign: "left",
            fontSize: titleFontSizes[size] || titleFontSizes.medium,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={title}
        >
          {title}
        </Title>

        {showIcon && (
          <Tooltip
            title={
              <>
                <div>
                  <strong>Battery Level:</strong> {currentLevel.toFixed(precision)}%
                </div>
                {lastTimestamp && <div><small>Last updated: {lastTimestamp}</small></div>}
              </>
            }
            mouseLeaveDelay={0.1}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                marginBottom: size === "small" ? 12 : 20,
                userSelect: "none",
              }}
            >
              <PoweroffOutlined
                aria-label="Battery level icon"
                role="img"
                style={{
                  fontSize: iconSizes[size] || iconSizes.medium,
                  color: strokeColor,
                  transition: "color 0.4s ease",
                }}
              />
            </div>
          </Tooltip>
        )}

        {/* Progress bar centered */}
        <div
          style={{
            width: progressWidths[size] || progressWidths.medium,
            margin: "0 auto",
          }}
        >
          <Progress
            type="line"
            percent={currentLevel}
            strokeColor={strokeColor}
            format={(percent) => `${percent.toFixed(precision)}%`}
            strokeWidth={size === "small" ? 12 : 20}
            showInfo={true}
            status={currentLevel === 100 ? "success" : "active"}
            style={{
              transition: animateProgress ? "all 0.6s ease" : undefined,
            }}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={currentLevel}
            aria-label="Battery level progress bar"
          />
        </div>


        {showLastUpdated && lastTimestamp && (
          <Text
            type="secondary"
            style={{
              marginTop: size === "small" ? 6 : 8,
              fontSize: size === "small" ? 10 : 12,
              color: colorTextSecondary,
              userSelect: "none",
              whiteSpace: "nowrap",
            }}
            aria-live="polite"
            aria-atomic="true"
          >
            Last updated: {lastTimestamp}
          </Text>
        )}

        {/* Settings button, top-right */}
        <Button
          size="small"
          type="text"
          onClick={openSettings}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            padding: 0,
            userSelect: "none",
            fontWeight: "bold",
            color: colorTextSecondary,
          }}
          aria-label="Open Battery Widget Settings"
        >
          ⚙️
        </Button>
      </Card>

      {/* Settings Modal */}
      <Modal
        title="Battery Widget Settings"
        open={settingsVisible}
        onCancel={closeSettings}
        onOk={saveSettings}
        okText="Save"
        cancelText="Cancel"
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ precision, size, animateProgress, showLastUpdated, showIcon }}>
          <Form.Item name="precision" label="Decimal Precision" rules={[{ type: "number", min: 0, max: 4 }]}>
            <InputNumber min={0} max={4} />
          </Form.Item>

          <Form.Item name="size" label="Widget Size">
            <InputNumber min={0} max={2} formatter={val => ["small","medium","large"][val]} parser={val => ["small","medium","large"].indexOf(val)} />
          </Form.Item>

          <Form.Item name="animateProgress" label="Animate Progress Bar" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="showLastUpdated" label="Show Last Updated Text" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="showIcon" label="Show Battery Icon" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default BatteryLevelWidget
