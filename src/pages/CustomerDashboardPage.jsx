"use client"

import { useState, useEffect } from "react"
import { Layout, Card, Typography, Spin, Empty, Row, Col, Button, Space, Dropdown, Menu, Drawer, Alert } from "antd"
import { useParams, useNavigate } from "react-router-dom"
import {
  ClockCircleOutlined,
  FullscreenOutlined,
  ReloadOutlined,
  DownOutlined,
  AppstoreOutlined,
  FilterOutlined,
  DesktopOutlined,
  MobileOutlined,
  TabletOutlined,
} from "@ant-design/icons"
import { useMediaQuery } from "../hooks/useMediaQuery"
import TimeWindowSettings from "../components/dashboard/TimeWindowSettings"
import WidgetRenderer from "../components/dashboard/WidgetRenderer"
import DeviceSelector from "../components/dashboard/DeviceSelector"
import ThemeToggle from "../components/theme/ThemeToggle"
import { useTheme } from "../components/theme/ThemeProvider"

const { Content } = Layout
const { Title, Text } = Typography

const CustomerDashboardPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState(null)
  const [timeWindow, setTimeWindow] = useState({
    displayValue: "Last 15 minutes",
    value: "15_minutes",
    type: "REALTIME",
  })
  const [isTimeWindowVisible, setIsTimeWindowVisible] = useState(false)
  const [selectedDevices, setSelectedDevices] = useState([])
  const [aggregationMode, setAggregationMode] = useState("none")
  const [isDeviceSelectorVisible, setIsDeviceSelectorVisible] = useState(false)
  const [viewMode, setViewMode] = useState("desktop") // desktop, tablet, mobile
  const [refreshInterval, setRefreshInterval] = useState(null)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)

  const isMobile = useMediaQuery("(max-width: 768px)")
  const isSmallScreen = useMediaQuery("(max-width: 576px)")
  const { theme } = useTheme()

  // Mock devices data
  const [devices, setDevices] = useState([
    {
      id: "device1",
      name: "Temperature Sensor",
      deviceProfile: "Sensors",
      state: "Active",
      label: "temperature",
    },
    {
      id: "device2",
      name: "Pressure Valve",
      deviceProfile: "Valves",
      state: "Active",
      label: "pressure",
    },
    {
      id: "device3",
      name: "Power Meter",
      deviceProfile: "Meters",
      state: "Inactive",
      label: "power",
    },
    {
      id: "device4",
      name: "Humidity Sensor",
      deviceProfile: "Sensors",
      state: "Active",
      label: "humidity",
    },
    {
      id: "device5",
      name: "Flow Meter",
      deviceProfile: "Meters",
      state: "Active",
      label: "flow",
    },
    {
      id: "device6",
      name: "Water Level Sensor",
      deviceProfile: "Sensors",
      state: "Inactive",
      label: "water",
    },
  ])

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      try {
        // In a real app, you would fetch from an API
        // For now, we'll simulate a dashboard with mock data
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API delay

        // Mock dashboard data
        const mockDashboard = {
          id,
          title: "Customer Dashboard",
          widgets: [
            {
              id: "widget1",
              title: "Temperature Sensor",
              type: "line-chart",
              deviceId: "device1",
              deviceName: "Temperature Sensor",
              telemetry: ["temperature", "humidity"],
              position: { x: 0, y: 0, w: 6, h: 4 },
              config: {
                title: "Temperature & Humidity",
                dataSource: {
                  type: "device",
                  deviceId: "device1",
                  telemetry: ["temperature", "humidity"],
                },
              },
            },
            {
              id: "widget2",
              title: "Device Status",
              type: "status-card",
              deviceId: "device1",
              deviceName: "Temperature Sensor",
              telemetry: ["status"],
              position: { x: 6, y: 0, w: 6, h: 2 },
              config: {
                title: "Device Status",
                dataSource: {
                  type: "device",
                  deviceId: "device1",
                  telemetry: ["status"],
                },
              },
            },
            {
              id: "widget3",
              title: "Battery Level",
              type: "battery-level",
              deviceId: "device1",
              deviceName: "Temperature Sensor",
              telemetry: ["batteryLevel"],
              position: { x: 6, y: 2, w: 3, h: 2 },
              config: {
                title: "Battery Level",
                dataSource: {
                  type: "device",
                  deviceId: "device1",
                  telemetry: ["batteryLevel"],
                },
              },
            },
            {
              id: "widget4",
              title: "Signal Strength",
              type: "signal-strength",
              deviceId: "device1",
              deviceName: "Temperature Sensor",
              telemetry: ["signalStrength"],
              position: { x: 9, y: 2, w: 3, h: 2 },
              config: {
                title: "Signal Strength",
                dataSource: {
                  type: "device",
                  deviceId: "device1",
                  telemetry: ["signalStrength"],
                },
              },
            },
          ],
          layouts: {
            lg: [
              { i: "widget1", x: 0, y: 0, w: 6, h: 4 },
              { i: "widget2", x: 6, y: 0, w: 6, h: 2 },
              { i: "widget3", x: 6, y: 2, w: 3, h: 2 },
              { i: "widget4", x: 9, y: 2, w: 3, h: 2 },
            ],
            md: [
              { i: "widget1", x: 0, y: 0, w: 6, h: 4 },
              { i: "widget2", x: 6, y: 0, w: 6, h: 2 },
              { i: "widget3", x: 6, y: 2, w: 3, h: 2 },
              { i: "widget4", x: 9, y: 2, w: 3, h: 2 },
            ],
            sm: [
              { i: "widget1", x: 0, y: 0, w: 12, h: 4 },
              { i: "widget2", x: 0, y: 4, w: 12, h: 2 },
              { i: "widget3", x: 0, y: 6, w: 6, h: 2 },
              { i: "widget4", x: 6, y: 6, w: 6, h: 2 },
            ],
            xs: [
              { i: "widget1", x: 0, y: 0, w: 12, h: 4 },
              { i: "widget2", x: 0, y: 4, w: 12, h: 2 },
              { i: "widget3", x: 0, y: 6, w: 12, h: 2 },
              { i: "widget4", x: 0, y: 8, w: 12, h: 2 },
            ],
          },
          settings: {
            timewindow: {
              realtime: { timewindowMs: 900000 }, // 15 minutes
              aggregation: { type: "AVG", limit: 200 },
            },
          },
          createdTime: "2025-04-20T10:00:00.000Z",
        }

        setDashboard(mockDashboard)

        // Set initial selected devices based on widgets
        const initialDevices = [
          ...new Set(mockDashboard.widgets.filter((widget) => widget.deviceId).map((widget) => widget.deviceId)),
        ]

        setSelectedDevices(initialDevices)
      } catch (error) {
        console.error("Error fetching dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()

    // Setup auto-refresh
    const interval = setInterval(() => {
      setLastRefreshed(new Date())
    }, 30000) // Refresh every 30 seconds

    setRefreshInterval(interval)

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [id])

  const handleTimeWindowChange = (newTimeWindow) => {
    setTimeWindow(newTimeWindow)
    setIsTimeWindowVisible(false)
  }

  const handleDeviceChange = (deviceIds) => {
    setSelectedDevices(deviceIds)
  }

  const handleAggregationChange = (mode) => {
    setAggregationMode(mode)
  }

  const handleRefresh = () => {
    setLastRefreshed(new Date())
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const timeWindowMenu = (
    <Menu>
      <Menu.Item
        key="realtime_15_minutes"
        onClick={() =>
          handleTimeWindowChange({ displayValue: "Last 15 minutes", value: "15_minutes", type: "REALTIME" })
        }
      >
        Last 15 minutes
      </Menu.Item>
      <Menu.Item
        key="realtime_30_minutes"
        onClick={() =>
          handleTimeWindowChange({ displayValue: "Last 30 minutes", value: "30_minutes", type: "REALTIME" })
        }
      >
        Last 30 minutes
      </Menu.Item>
      <Menu.Item
        key="realtime_1_hour"
        onClick={() => handleTimeWindowChange({ displayValue: "Last 1 hour", value: "1_hour", type: "REALTIME" })}
      >
        Last 1 hour
      </Menu.Item>
      <Menu.Item
        key="realtime_6_hours"
        onClick={() => handleTimeWindowChange({ displayValue: "Last 6 hours", value: "6_hours", type: "REALTIME" })}
      >
        Last 6 hours
      </Menu.Item>
      <Menu.Item
        key="realtime_1_day"
        onClick={() => handleTimeWindowChange({ displayValue: "Last 1 day", value: "1_day", type: "REALTIME" })}
      >
        Last 1 day
      </Menu.Item>
      <Menu.Item
        key="realtime_1_week"
        onClick={() => handleTimeWindowChange({ displayValue: "Last 1 week", value: "1_week", type: "REALTIME" })}
      >
        Last 1 week
      </Menu.Item>
      <Menu.Item key="custom" onClick={() => setIsTimeWindowVisible(true)}>
        Custom...
      </Menu.Item>
    </Menu>
  )

  const viewModeMenu = (
    <Menu>
      <Menu.Item key="desktop" onClick={() => setViewMode("desktop")} icon={<DesktopOutlined />}>
        Desktop View
      </Menu.Item>
      <Menu.Item key="tablet" onClick={() => setViewMode("tablet")} icon={<TabletOutlined />}>
        Tablet View
      </Menu.Item>
      <Menu.Item key="mobile" onClick={() => setViewMode("mobile")} icon={<MobileOutlined />}>
        Mobile View
      </Menu.Item>
    </Menu>
  )

  // Generate mock data for widgets based on time window and selected devices
  const generateMockData = (telemetry, timeWindow, deviceIds, aggregation = "none") => {
    if (!telemetry || telemetry.length === 0) return []
    if (!deviceIds || deviceIds.length === 0) return []

    const now = new Date()
    let timeRange = 900000 // 15 minutes in milliseconds (default)

    // Set time range based on selected time window
    switch (timeWindow.value) {
      case "30_minutes":
        timeRange = 1800000
        break
      case "1_hour":
        timeRange = 3600000
        break
      case "6_hours":
        timeRange = 21600000
        break
      case "1_day":
        timeRange = 86400000
        break
      case "1_week":
        timeRange = 604800000
        break
      default:
        timeRange = 900000
    }

    // Number of data points to generate
    const numPoints = 100
    const interval = timeRange / numPoints

    // Generate data for each device
    const deviceData = {}

    deviceIds.forEach((deviceId) => {
      const data = []

      for (let i = 0; i < numPoints; i++) {
        const time = new Date(now.getTime() - (numPoints - i) * interval)
        const point = { time: time.toISOString() }

        // Generate values for each data key
        telemetry.forEach((key) => {
          // Add some variation based on device ID to make each device's data different
          const deviceVariation = Number.parseInt(deviceId.replace("device", "")) * 0.1

          if (key === "temperature") {
            // Temperature between 20-30°C with some randomness
            point[key] = 25 + 5 * Math.sin((i / numPoints) * Math.PI * 2) + Math.random() * 2 - 1 + deviceVariation * 5
          } else if (key === "humidity") {
            // Humidity between 40-60% with some randomness
            point[key] =
              50 + 10 * Math.cos((i / numPoints) * Math.PI * 2) + Math.random() * 5 - 2.5 + deviceVariation * 10
          } else if (key === "batteryLevel") {
            // Battery level decreasing from 100% to 80%
            point[key] = 100 - (20 * i) / numPoints - Math.random() * 2 - deviceVariation * 15
          } else if (key === "signalStrength") {
            // Signal strength between 60-90% with some randomness
            point[key] =
              75 + 15 * Math.sin((i / numPoints) * Math.PI * 4) + Math.random() * 5 - 2.5 - deviceVariation * 10
          } else if (key === "status") {
            // Status is either "Online" or "Offline"
            point[key] = Math.random() > 0.1 + deviceVariation ? "Online" : "Offline"
          } else {
            // Generic random value between 0-100
            point[key] = Math.random() * 100 + deviceVariation * 20
          }
        })

        data.push(point)
      }

      deviceData[deviceId] = data
    })

    // If no aggregation or only one device, return the data for the first device
    if (aggregation === "none" || deviceIds.length === 1) {
      return deviceData[deviceIds[0]]
    }

    // Perform aggregation across devices
    const aggregatedData = []

    // For each time point
    for (let i = 0; i < numPoints; i++) {
      const aggregatedPoint = {
        time: deviceData[deviceIds[0]][i].time,
      }

      // For each data key
      telemetry.forEach((key) => {
        // Collect values for this key from all devices at this time point
        const values = deviceIds.map((deviceId) => deviceData[deviceId][i][key])

        // Skip non-numeric values for aggregation
        const numericValues = values.filter((value) => typeof value === "number")

        if (numericValues.length === 0) {
          // For non-numeric values (like status), use the most common value
          const valueCounts = {}
          values.forEach((value) => {
            valueCounts[value] = (valueCounts[value] || 0) + 1
          })

          // Find the most common value
          let mostCommonValue = values[0]
          let maxCount = 0

          Object.entries(valueCounts).forEach(([value, count]) => {
            if (count > maxCount) {
              mostCommonValue = value
              maxCount = count
            }
          })

          aggregatedPoint[key] = mostCommonValue
        } else {
          // Apply the selected aggregation method
          switch (aggregation) {
            case "mean":
              aggregatedPoint[key] = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
              break
            case "median":
              // Sort values and find the middle one
              const sortedValues = [...numericValues].sort((a, b) => a - b)
              const mid = Math.floor(sortedValues.length / 2)
              aggregatedPoint[key] =
                sortedValues.length % 2 === 0 ? (sortedValues[mid - 1] + sortedValues[mid]) / 2 : sortedValues[mid]
              break
            case "min":
              aggregatedPoint[key] = Math.min(...numericValues)
              break
            case "max":
              aggregatedPoint[key] = Math.max(...numericValues)
              break
            case "sum":
              aggregatedPoint[key] = numericValues.reduce((sum, val) => sum + val, 0)
              break
            case "count":
              aggregatedPoint[key] = numericValues.length
              break
            case "last":
              // Use the last value from the last device
              aggregatedPoint[key] = values[values.length - 1]
              break
            default:
              // Default to mean if unknown aggregation method
              aggregatedPoint[key] = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
          }
        }
      })

      aggregatedData.push(aggregatedPoint)
    }

    return aggregatedData
  }

  // Determine which layout to use based on viewMode or screen size
  const getActiveLayout = () => {
    if (viewMode === "mobile") return "xs"
    if (viewMode === "tablet") return "sm"

    // If no explicit view mode, use responsive detection
    if (isSmallScreen) return "xs"
    if (isMobile) return "sm"
    return "lg"
  }

  // Render widgets based on dashboard layout and selected devices
  const renderWidgets = () => {
    if (!dashboard || !dashboard.widgets) return null

    const layout = dashboard.layouts[getActiveLayout()]
    if (!layout) return null

    return (
      <Row gutter={[8, 8]}>
        {dashboard.widgets.map((widget) => {
          // Skip widgets that don't match selected devices
          if (widget.deviceId && selectedDevices.length > 0 && !selectedDevices.includes(widget.deviceId)) {
            return null
          }

          // Find widget position in layout
          const position = layout.find((item) => item.i === widget.id)
          if (!position) return null

          // Calculate column span (12 is the total width in the grid system)
          const span = Math.floor((position.w / 12) * 24) // Convert to 24-column grid

          // Generate mock data for this widget
          const mockData = generateMockData(
            widget.config.dataSource.telemetry,
            timeWindow,
            selectedDevices.length > 0 ? selectedDevices : [widget.deviceId],
            aggregationMode,
          )

          return (
            <Col key={widget.id} xs={24} sm={span < 8 ? 12 : 24} md={span < 6 ? 8 : span < 12 ? 16 : 24} lg={span}>
              <WidgetRenderer
                widget={widget}
                config={{
                  ...widget.config,
                  data: mockData,
                  timeWindow: timeWindow,
                  theme: theme,
                }}
              />
            </Col>
          )
        })}
      </Row>
    )
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 64px)" }}>
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    )
  }

  if (!dashboard) {
    return (
      <Card>
        <Empty description="Dashboard not found or not assigned to you" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    )
  }

  return (
    <div className="customer-dashboard-page">
      <Card
        title={<Title level={4}>{dashboard.title}</Title>}
        extra={
          <Space size={isMobile ? "small" : "middle"} wrap={isMobile}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setIsDeviceSelectorVisible(true)}
              type={selectedDevices.length > 0 ? "primary" : "default"}
            >
              {!isMobile && "Devices"}
              {selectedDevices.length > 0 && ` (${selectedDevices.length})`}
            </Button>
            <Dropdown overlay={timeWindowMenu} trigger={["click"]}>
              <Button icon={<ClockCircleOutlined />}>
                {!isMobile && timeWindow.displayValue} <DownOutlined />
              </Button>
            </Dropdown>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
            <ThemeToggle />
            {!isMobile && (
              <Dropdown overlay={viewModeMenu} trigger={["click"]}>
                <Button icon={<AppstoreOutlined />}>
                  View <DownOutlined />
                </Button>
              </Dropdown>
            )}
            <Button icon={<FullscreenOutlined />} onClick={handleFullscreen} />
          </Space>
        }
        bordered={false}
        className="dashboard-card"
      >
        {selectedDevices.length === 0 ? (
          <Alert
            message="No devices selected"
            description="Please select one or more devices to view their data."
            type="info"
            showIcon
            action={
              <Button size="small" type="primary" onClick={() => setIsDeviceSelectorVisible(true)}>
                Select Devices
              </Button>
            }
          />
        ) : (
          renderWidgets()
        )}

        <div style={{ marginTop: 8, textAlign: "right" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </Text>
        </div>
      </Card>

      <TimeWindowSettings
        visible={isTimeWindowVisible}
        onClose={() => setIsTimeWindowVisible(false)}
        onSave={handleTimeWindowChange}
        initialValue={timeWindow}
      />

      <Drawer
        title="Device Selection"
        placement="right"
        onClose={() => setIsDeviceSelectorVisible(false)}
        open={isDeviceSelectorVisible}
        width={isMobile ? "100%" : 400}
      >
        <DeviceSelector
          devices={devices}
          selectedDevices={selectedDevices}
          onDeviceChange={handleDeviceChange}
          aggregationMode={aggregationMode}
          onAggregationChange={handleAggregationChange}
        />
      </Drawer>
    </div>
  )
}

export default CustomerDashboardPage
