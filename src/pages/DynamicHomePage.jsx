"use client"

import { useState, useEffect } from "react"
import {
  Layout,
  Typography,
  Spin,
  Button,
  Space,
  Dropdown,
  Menu,
  Drawer,
} from "antd"
import {
  FilterOutlined,
  AppstoreOutlined,
  DesktopOutlined,
  TabletOutlined,
  MobileOutlined,
  DashboardOutlined,
  CheckCircleFilled,
  InfoCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import { Responsive, WidthProvider } from "react-grid-layout"
import WidgetRenderer from "../components/dashboard/WidgetRenderer"
import DeviceSelector from "../components/dashboard/DeviceSelector"
import { useTheme } from "../components/theme/ThemeProvider"
import ThemeToggle from "../components/theme/ThemeToggle"
import { useMediaQuery } from "../hooks/useMediaQuery"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import "../styles/widget.css"
import { dashboards } from "./dashboards/mockDashboards"

const ResponsiveGridLayout = WidthProvider(Responsive)
const { Content } = Layout
const { Title } = Typography

const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
const cols = { lg: 12, md: 8, sm: 6, xs: 2, xxs: 1 }

const DynamicHomePage = () => {
  const [activeDashboardId, setActiveDashboardId] = useState(dashboards[0]?.id)
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDeviceSelectorVisible, setIsDeviceSelectorVisible] = useState(false)
  const [selectedDevices, setSelectedDevices] = useState([])
  const [viewMode, setViewMode] = useState("desktop")
  const { theme, toggleTheme, primaryColor } = useTheme()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isTablet = useMediaQuery("(max-width: 992px)")

  // --- Feedback state/logic ---
  const [feedback, setFeedback] = useState({ type: "", text: "" })
  function showFeedback(type, text, timeout = 3200) {
    setFeedback({ type, text })
    if (timeout) setTimeout(() => setFeedback({ type: "", text: "" }), timeout)
  }
  function renderFeedback() {
    if (!feedback.text) return null
    let icon, color, bg
    switch (feedback.type) {
      case "success": icon = <CheckCircleFilled />; color = "#389e0d"; bg = "#e6ffed"; break
      case "error": icon = <CloseCircleOutlined />; color = "#cf1322"; bg = "#fff1f0"; break
      case "warning": icon = <WarningOutlined />; color = "#d48806"; bg = "#fffbe6"; break
      case "info":
      default: icon = <InfoCircleOutlined />; color = "#0958d9"; bg = "#e6f4ff"; break
    }
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "9px 18px",
        marginBottom: 10,
        borderRadius: 7,
        background: bg,
        color: color,
        fontWeight: 500,
        fontSize: 16,
        gap: 8,
        overflowWrap: "anywhere",
      }}>
        {icon}
        <span>{feedback.text}</span>
      </div>
    )
  }

  // --- Responsive layout settings ---
  const rowHeight = isMobile ? 68 : 44
  const margin = isMobile ? [4, 4] : [8, 8]
  const containerPadding = isMobile ? [0, 0] : [0, 0]

  function safeArray(arr) {
    return Array.isArray(arr) ? arr : []
  }

  // --- Load dashboard and update selected devices
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      const dash = dashboards.find((d) => d.id === activeDashboardId)
      setDashboard(dash || null)
      setSelectedDevices(
        safeArray(dash?.widgets)
          .map((w) => w.deviceId)
          .filter(Boolean)
      )
      setLoading(false)
    }, 200)
  }, [activeDashboardId])

  // --- Dashboard Dropdown Menu ---
  const dashboardMenu = (
    <Menu
      selectedKeys={[activeDashboardId]}
      style={{
        minWidth: 220,
        maxHeight: 320,
        overflow: "auto",
        background: theme === "dark" ? "#181c24" : "#fff",
        color: theme === "dark" ? "#fff" : "#222",
        borderRadius: 8,
        boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
      }}
    >
      {dashboards.map((dash) => (
        <Menu.Item
          key={dash.id}
          onClick={() => {
            setActiveDashboardId(dash.id)
            showFeedback("info", `Switched to dashboard: ${dash.title}`)
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontWeight: dash.id === activeDashboardId ? 600 : 400,
            background:
              dash.id === activeDashboardId
                ? theme === "dark"
                  ? "#233045"
                  : "#eaf2fb"
                : "transparent",
            color:
              dash.id === activeDashboardId
                ? theme === "dark"
                  ? "#fff"
                  : primaryColor
                : theme === "dark"
                  ? "#fff"
                  : "#222",
            borderRadius: 8,
          }}
          icon={dash.icon || <DashboardOutlined />}
        >
          <span>
            {dash.title}
            {dash.id === activeDashboardId && (
              <CheckCircleFilled style={{ color: "#52c41a", marginLeft: 8 }} />
            )}
          </span>
        </Menu.Item>
      ))}
    </Menu>
  )

  // --- View Mode Dropdown ---
  const viewMenu = (
    <Menu>
      {["desktop", "tablet", "mobile"].map((v) => (
        <Menu.Item
          key={v}
          icon={
            v === "desktop"
              ? <DesktopOutlined />
              : v === "tablet"
                ? <TabletOutlined />
                : <MobileOutlined />
          }
          onClick={() => {
            setViewMode(v)
            showFeedback("info", `Switched to ${v} view`)
          }}
          style={{
            background: viewMode === v
              ? theme === "dark"
                ? "#001529"
                : "#f6ffed"
              : undefined,
            color: viewMode === v
              ? theme === "dark"
                ? "#52c41a"
                : "#1677ff"
              : undefined,
            borderRadius: 6,
          }}
        >
          {v.charAt(0).toUpperCase() + v.slice(1)} View
        </Menu.Item>
      ))}
    </Menu>
  )

  // --- Device selector handler ---
  const handleDeviceChange = (devices) => {
    setSelectedDevices(devices)
    showFeedback("success", `Showing data for ${devices.length} device${devices.length === 1 ? "" : "s"}`)
  }

  // --- Get layout by view mode ---
  const getActiveLayoutKey = () => {
    if (viewMode === "mobile") return "xs"
    if (viewMode === "tablet") return "sm"
    return "lg"
  }

  // --- Generate mock telemetry for demo widgets ---
  const generateMockData = (telemetry = [], timeWindow = {}) => {
    if (!Array.isArray(telemetry) || telemetry.length === 0) return []
    const now = new Date()
    const range = { "15_minutes": 15, "30_minutes": 30, "1_hour": 60 }[timeWindow.value] || 15
    const points = 30
    const interval = (range * 60 * 1000) / points
    return Array.from({ length: points }).map((_, i) => {
      const time = new Date(now - i * interval).toISOString()
      const data = { time }
      telemetry.forEach((k) => {
        if (k === "temperature") data[k] = 25 + Math.random() * 4
        else if (k === "humidity") data[k] = 40 + Math.random() * 20
        else data[k] = Math.random() * 100
      })
      return data
    }).reverse()
  }

  // --- Filter layouts for selected devices ---
  function filterLayouts(layouts, widgets, selectedDevices) {
    const selectedWidgetIds = widgets
      .filter(w => selectedDevices.includes(w.deviceId))
      .map(w => w.id)
    const filterLayoutArr = (arr) =>
      Array.isArray(arr) ? arr.filter(l => selectedWidgetIds.includes(l.i)) : []
    let filteredLayouts = {}
    for (let key of Object.keys(layouts)) {
      filteredLayouts[key] = filterLayoutArr(layouts[key])
    }
    return filteredLayouts
  }

  // --- Main Render ---
  if (loading || !dashboard || !Array.isArray(dashboard.widgets)) {
    return (
      <Layout className="dashboard-loading">
        <Spin size="large" />
      </Layout>
    )
  }

  return (
    <Layout className={`dashboard-root ${theme === "dark" ? "dark-theme" : ""}`}>
      <Content className="dashboard-content">
        {/* Feedback Banner */}
        {renderFeedback()}

        <div className="dashboard-toolbar" style={{ gap: 12, flexWrap: "wrap" }}>
          <Dropdown
            overlay={dashboardMenu}
            placement="bottomLeft"
            trigger={["click"]}
            arrow
          >
            <Button
              type="primary"
              icon={dashboard.icon || <DashboardOutlined />}
              style={{
                background: primaryColor,
                border: 0,
                color: "#fff",
                marginRight: 8,
                letterSpacing: 0.5,
                transition: "all 0.15s",
              }}
            >
              {dashboard.title}
            </Button>
          </Dropdown>
          <Space wrap>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setIsDeviceSelectorVisible(true)}
            >
              Devices ({selectedDevices.length})
            </Button>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <Dropdown overlay={viewMenu}>
              <Button icon={<AppstoreOutlined />} />
            </Dropdown>
          </Space>
        </div>

        {/* --- Empty State --- */}
        {safeArray(dashboard.widgets).filter(
          (w) => w.deviceId && selectedDevices.includes(w.deviceId)
        ).length === 0 ? (
          <div className="dashboard-empty-state">
            <div className="dashboard-empty-icon">📊</div>
            <Title level={4} style={{ margin: 0 }}>No widgets for selected devices</Title>
            <Typography.Text type="secondary">
              Please select another device or dashboard.
            </Typography.Text>
          </div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={filterLayouts(
              dashboard.layouts,
              dashboard.widgets,
              selectedDevices
            )}
            breakpoints={breakpoints}
            cols={cols}
            rowHeight={rowHeight}
            margin={margin}
            containerPadding={containerPadding}
            autoSize={true}
            isDraggable={false}
            isResizable={false}
            compactType={null}
            preventCollision={true}
            allowOverlap={false}
            useCSSTransforms={true}
          >
            {safeArray(dashboard.widgets).map((w) => {
              if (
                !w ||
                typeof w !== "object" ||
                !w.config ||
                !w.config.dataSource ||
                !w.deviceId ||
                !selectedDevices.includes(w.deviceId)
              )
                return null
              // Patch for null telemetry
              const telemetryArr = Array.isArray(w.config.dataSource.telemetry)
                ? w.config.dataSource.telemetry
                : typeof w.config.dataSource.telemetry === "string"
                  ? [w.config.dataSource.telemetry]
                  : []
              return (
                <div key={w.id} className="widget-container" style={{ height: "100%" }}>
                  <div className="widget-body" style={{ height: "100%" }}>
                    <WidgetRenderer
                      widget={w}
                      config={{
                        ...w.config,
                        data: generateMockData(
                          telemetryArr,
                          dashboard.timeWindow,
                          [w.deviceId]
                        ),
                        timeWindow: dashboard.timeWindow,
                        theme,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </ResponsiveGridLayout>
        )}
      </Content>
      {/* --- Device Selector Drawer --- */}
      <Drawer
        title="Select Devices"
        placement="right"
        open={isDeviceSelectorVisible}
        onClose={() => setIsDeviceSelectorVisible(false)}
        width={isMobile ? "100%" : 360}
      >
        <DeviceSelector
          devices={safeArray(dashboard?.widgets).reduce((acc, w) => {
            if (
              w &&
              typeof w === "object" &&
              w.deviceId &&
              !acc.find((d) => d.id === w.deviceId)
            ) {
              acc.push({ id: w.deviceId, name: w.deviceName || w.deviceId })
            }
            return acc
          }, [])}
          selectedDevices={selectedDevices}
          onDeviceChange={handleDeviceChange}
          aggregationMode={"none"}
          onAggregationChange={() => {}}
        />
      </Drawer>
    </Layout>
  )
}

export default DynamicHomePage

// "use client"

// import { useState, useEffect } from "react"
// import {
//   Layout,
//   Typography,
//   Spin,
//   Button,
//   Space,
//   Dropdown,
//   Menu,
//   Drawer,
//   Avatar,
// } from "antd"
// import {
//   FilterOutlined,
//   AppstoreOutlined,
//   DesktopOutlined,
//   TabletOutlined,
//   MobileOutlined,
//   DashboardOutlined,
//   CheckCircleFilled,
// } from "@ant-design/icons"
// import { Responsive, WidthProvider } from "react-grid-layout"
// import WidgetRenderer from "../components/dashboard/WidgetRenderer"
// import DeviceSelector from "../components/dashboard/DeviceSelector"
// import { useTheme } from "../components/theme/ThemeProvider"
// import ThemeToggle from "../components/theme/ThemeToggle"
// import { useMediaQuery } from "../hooks/useMediaQuery"
// import "react-grid-layout/css/styles.css"
// import "react-resizable/css/styles.css"
// import "../styles/widget.css"
// import {dashboards} from "./dashboards/mockDashboards"

// const ResponsiveGridLayout = WidthProvider(Responsive)
// const { Content } = Layout
// const { Title } = Typography

// const DynamicHomePage = () => {
//   const [activeDashboardId, setActiveDashboardId] = useState(dashboards[0]?.id)
//   const [dashboard, setDashboard] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const [isDeviceSelectorVisible, setIsDeviceSelectorVisible] = useState(false)
//   const [selectedDevices, setSelectedDevices] = useState([])
//   const [viewMode, setViewMode] = useState("desktop")
//   const { theme, toggleTheme, primaryColor } = useTheme()
//   const isMobile = useMediaQuery("(max-width: 768px)")
//   const isTablet = useMediaQuery("(max-width: 992px)")

//   const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
//   const cols = { lg: 12, md: 8, sm: 6, xs: 2, xxs: 1 }
//   const rowHeight = isMobile ? 68 : 44
//   const margin = isMobile ? [4, 4] : [8, 8]
//   const containerPadding = isMobile ? [0, 0] : [0, 0]

//   // Safe fallback for undefined
//   function safeArray(arr) {
//     return Array.isArray(arr) ? arr : []
//   }

//   // Get the active dashboard object
//   useEffect(() => {
//     setLoading(true)
//     setTimeout(() => {
//       const dash = dashboards.find((d) => d.id === activeDashboardId)
//       setDashboard(dash || null)
//       setSelectedDevices(
//         safeArray(dash?.widgets).map((w) => w.deviceId).filter(Boolean)
//       )
//       setLoading(false)
//     }, 250)
//   }, [activeDashboardId])

//   const handleDeviceChange = setSelectedDevices

//   const getActiveLayout = () => {
//     if (viewMode === "mobile") return "xs"
//     if (viewMode === "tablet") return "sm"
//     return "lg"
//   }

//   // Dummy mock data generator
//   const generateMockData = (telemetry = [], timeWindow = {}) => {
//     if (!Array.isArray(telemetry) || telemetry.length === 0) return []
//     const now = new Date()
//     const range = { "15_minutes": 15, "30_minutes": 30, "1_hour": 60 }[timeWindow.value] || 15
//     const points = 30
//     const interval = (range * 60 * 1000) / points
//     return Array.from({ length: points }).map((_, i) => {
//       const time = new Date(now - i * interval).toISOString()
//       const data = { time }
//       telemetry.forEach((k) => {
//         if (k === "temperature") data[k] = 25 + Math.random() * 4
//         else if (k === "humidity") data[k] = 40 + Math.random() * 20
//         else data[k] = Math.random() * 100
//       })
//       return data
//     }).reverse()
//   }

//   // --- Dashboard Dropdown Menu ---
//   const dashboardMenu = (
//     <Menu
//       selectedKeys={[activeDashboardId]}
//       style={{
//         minWidth: 220,
//         maxHeight: 320,
//         overflow: "auto",
//         background: theme === "dark" ? "#181c24" : "#fff",
//         color: theme === "dark" ? "#fff" : "#222",
//         borderRadius: 8,
//         boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
//       }}
//     >
//       {dashboards.map((dash) => (
//         <Menu.Item
//           key={dash.id}
//           onClick={() => setActiveDashboardId(dash.id)}
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: 10,
//             fontWeight: dash.id === activeDashboardId ? 600 : 400,
//             background:
//               dash.id === activeDashboardId
//                 ? theme === "dark"
//                   ? "#233045"      // Solid dark highlight
//                   : "#eaf2fb"      // Solid light highlight
//                 : "transparent",   // Nothing for unselected
//             color:
//               dash.id === activeDashboardId
//                 ? theme === "dark"
//                   ? "#fff"
//                   : primaryColor    // Uses your theme’s primary color for selected
//                 : theme === "dark"
//                   ? "#fff"
//                   : "#222",
//             borderRadius: 8,
//           }}
//           icon={dash.icon || <DashboardOutlined />}
//         >
//           <span>
//             {dash.title}
//             {dash.id === activeDashboardId && (
//               <CheckCircleFilled style={{ color: "#52c41a", marginLeft: 8 }} />
//             )}
//           </span>
//         </Menu.Item>
//       ))}
//     </Menu>
//   )


//   // View Mode Dropdown
//   const viewMenu = (
//     <Menu>
//       {["desktop", "tablet", "mobile"].map((v) => (
//         <Menu.Item
//           key={v}
//           icon={
//             v === "desktop"
//               ? <DesktopOutlined />
//               : v === "tablet"
//               ? <TabletOutlined />
//               : <MobileOutlined />
//           }
//           onClick={() => setViewMode(v)}
//           style={{
//             background: viewMode === v
//               ? theme === "dark"
//                 ? "#001529"
//                 : "#f6ffed"
//               : undefined,
//             color: viewMode === v
//               ? theme === "dark"
//                 ? "#52c41a"
//                 : "#1677ff"
//               : undefined,
//             borderRadius: 6,
//           }}
//         >
//           {v.charAt(0).toUpperCase() + v.slice(1)} View
//         </Menu.Item>
//       ))}
//     </Menu>
//   )

//   if (loading || !dashboard || !Array.isArray(dashboard.widgets)) {
//     return (
//       <Layout className="dashboard-loading">
//         <Spin size="large" />
//       </Layout>
//     )
//   }

//   function filterLayouts(layouts, widgets, selectedDevices) {
//     const selectedWidgetIds = widgets
//       .filter(w => selectedDevices.includes(w.deviceId))
//       .map(w => w.id)

//     const filterLayoutArr = (arr) =>
//       Array.isArray(arr) ? arr.filter(l => selectedWidgetIds.includes(l.i)) : []

//     let filteredLayouts = {}
//     for (let key of Object.keys(layouts)) {
//       filteredLayouts[key] = filterLayoutArr(layouts[key])
//     }
//     return filteredLayouts
//   }

//   return (
//     <Layout className={`dashboard-root ${theme === "dark" ? "dark-theme" : ""}`}>
//       <Content className="dashboard-content">
//         <div className="dashboard-toolbar" style={{ gap: 12, flexWrap: "wrap" }}>
//           <Dropdown
//             overlay={dashboardMenu}
//             placement="bottomLeft"
//             trigger={["click"]}
//             arrow
//           >
//           <Button
//             type="primary"
//             icon={dashboard.icon || <DashboardOutlined />}
//             style={{
//               background: primaryColor,
//               border: 0,
//               color: "#fff",
//               marginRight: 8,
//               letterSpacing: 0.5,
//               transition: "all 0.15s",
//             }}
//           >
//             {dashboard.title}
//           </Button>

//           </Dropdown>
//           <Space wrap>
//             <Button icon={<FilterOutlined />} onClick={() => setIsDeviceSelectorVisible(true)}>
//               Devices ({selectedDevices.length})
//             </Button>
//             <ThemeToggle theme={theme} onToggle={toggleTheme} />
//             <Dropdown overlay={viewMenu}>
//               <Button icon={<AppstoreOutlined />} />
//             </Dropdown>
//           </Space>
//         </div>

//         <ResponsiveGridLayout
//           className="layout"
//           layouts={filterLayouts(dashboard.layouts, dashboard.widgets, selectedDevices)}
//           // // layouts={dashboard.layouts}
//           breakpoints={breakpoints}
//           cols={cols}
//           rowHeight={rowHeight}
//           margin={margin}
//           containerPadding={containerPadding}
//           autoSize={true}
//           isDraggable={false}
//           isResizable={false}
//           compactType={null}
//           preventCollision={true}
//           allowOverlap={false}
//           useCSSTransforms={true}
          
//         >
//           {safeArray(dashboard.widgets).map((w) => {
//             // Defensive: skip widget if missing config/dataSource or not selected
//             if (
//               !w ||
//               typeof w !== "object" ||
//               !w.config ||
//               !w.config.dataSource ||
//               !w.deviceId ||
//               !selectedDevices.includes(w.deviceId)
//             )
//               return null
//             // Patch for null telemetry in some dashboards
//             const telemetryArr = Array.isArray(w.config.dataSource.telemetry)
//               ? w.config.dataSource.telemetry
//               : typeof w.config.dataSource.telemetry === "string"
//                 ? [w.config.dataSource.telemetry]
//                 : []
//             return (
//               <div key={w.id} className="widget-container" style={{ height: "100%" }}>
//                 <div className="widget-body" style={{ height: "100%" }}>
//                   <WidgetRenderer
//                     widget={w}
//                     config={{
//                       ...w.config,
//                       data: generateMockData(
//                         telemetryArr,
//                         dashboard.timeWindow,
//                         [w.deviceId]
//                       ),
//                       timeWindow: dashboard.timeWindow,
//                       theme,
//                     }}
//                   />
//                 </div>
//               </div>
//             )
//           })}
//         </ResponsiveGridLayout>
//       </Content>

//       <Drawer
//         title="Select Devices"
//         placement="right"
//         open={isDeviceSelectorVisible}
//         onClose={() => setIsDeviceSelectorVisible(false)}
//         width={isMobile ? "100%" : 360}
//       >
//         <DeviceSelector
//           devices={safeArray(dashboard?.widgets).reduce((acc, w) => {
//             if (
//               w &&
//               typeof w === "object" &&
//               w.deviceId &&
//               !acc.find((d) => d.id === w.deviceId)
//             ) {
//               acc.push({ id: w.deviceId, name: w.deviceName || w.deviceId })
//             }
//             return acc
//           }, [])}
//           selectedDevices={selectedDevices}
//           onDeviceChange={handleDeviceChange}
//           aggregationMode={"none"}
//           onAggregationChange={() => {}}
//         />
//       </Drawer>
//     </Layout>
//   )
// }

// export default DynamicHomePage


// // "use client"

// // import { useState, useEffect } from "react"
// // import {
// //   Layout,
// //   Typography,
// //   Spin,
// //   Button,
// //   Space,
// //   Dropdown,
// //   Menu,
// //   Drawer,
// // } from "antd"
// // import {
// //   FilterOutlined,
// //   AppstoreOutlined,
// //   DesktopOutlined,
// //   TabletOutlined,
// //   MobileOutlined,
// // } from "@ant-design/icons"
// // import { Responsive, WidthProvider } from "react-grid-layout"
// // import WidgetRenderer from "../components/dashboard/WidgetRenderer"
// // import DeviceSelector from "../components/dashboard/DeviceSelector"
// // import { useTheme } from "../components/theme/ThemeProvider"
// // import ThemeToggle from "../components/theme/ThemeToggle"
// // import { useMediaQuery } from "../hooks/useMediaQuery"
// // import "react-grid-layout/css/styles.css"
// // import "react-resizable/css/styles.css"
// // import "../styles/widget.css" // your combined CSS

// // const ResponsiveGridLayout = WidthProvider(Responsive)
// // const { Content } = Layout
// // const { Title } = Typography

// // // --- Your test1 dashboard data ---
// // const test1Dashboard = {
// //   "id": "1",
// //   "title": "Warehouse 1",
// //   "widgets": [
// //     {
// //       "title": "Temperature",
// //       "icon": "⭕",
// //       "type": "radial-gauge",
// //       "id": "bce198e3-7837-4cd0-848c-1b19a7ef3a3f",
// //       "config": {
// //         "title": "Temperature",
// //         "dataSource": {
// //           "type": "device",
// //           "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
// //           "telemetry": [
// //             "temp"
// //           ],
// //           "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
// //           "protocol": "JSON",
// //           "streamUrl": "http://report-service/sensors"
// //         }
// //       },
// //       "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
// //       "deviceName": "SENSOR-003"
// //     },
// //     {
// //       "title": "Machine 1 - Temp & Humidity",
// //       "icon": "📈",
// //       "type": "line-chart",
// //       "id": "f25d5637-2022-4ca8-9e97-2213611f2980",
// //       "config": {
// //         "title": "Machine 1 - Temp & Humidity",
// //         "dataSource": {
// //           "type": "device",
// //           "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
// //           "telemetry": [
// //             "temp",
// //             "humidity"
// //           ],
// //           "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
// //           "protocol": "JSON",
// //           "streamUrl": "http://report-service/sensors"
// //         },
// //         "height": 300,
// //         "showLegend": true,
// //         "showPoints": true
// //       },
// //       "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
// //       "deviceName": "SENSOR-003"
// //     },
// //     {
// //       "title": "Temperature Card",
// //       "icon": "📝",
// //       "type": "value-card",
// //       "id": "50502903-f507-4f4b-a73e-2314362af04d",
// //       "config": {
// //         "title": "Temperature Card",
// //         "dataSource": {
// //           "type": "device",
// //           "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
// //           "telemetry": [
// //             "temp"
// //           ],
// //           "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
// //           "protocol": "JSON",
// //           "streamUrl": "http://report-service/sensors"
// //         }
// //       },
// //       "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
// //       "deviceName": "SENSOR-003"
// //     },
// //     {
// //       "title": "Humidity Card",
// //       "icon": "📝",
// //       "type": "value-card",
// //       "id": "22006596-037c-495d-ac50-1ec337ad2cc1",
// //       "config": {
// //         "title": "Humidity Card",
// //         "dataSource": {
// //           "type": "device",
// //           "deviceId": "0707216a-5613-4d00-81aa-efbe34f2a839",
// //           "telemetry": [
// //             "humidity"
// //           ],
// //           "topic": "kepler/prod/delhi/rms-device/0707216a-5613-4d00-81aa-efbe34f2a839/up/data",
// //           "protocol": "JSON",
// //           "streamUrl": "http://report-service/sensors"
// //         }
// //       },
// //       "deviceId": "0707216a-5613-4d00-81aa-efbe34f2a839",
// //       "deviceName": "SENSOR-001"
// //     },
// //     {
// //       "title": "Radial gauge",
// //       "icon": "⭕",
// //       "type": "radial-gauge",
// //       "id": "a8c23f79-a406-444f-80a0-8ace011358f0",
// //       "config": {
// //         "title": "Radial gauge",
// //         "dataSource": {
// //           "type": "device",
// //           "deviceId": "0707216a-5613-4d00-81aa-efbe34f2a839",
// //           "telemetry": [
// //             "humidity"
// //           ],
// //           "topic": "kepler/prod/delhi/rms-device/0707216a-5613-4d00-81aa-efbe34f2a839/up/data",
// //           "protocol": "JSON",
// //           "streamUrl": "http://report-service/sensors"
// //         }
// //       },
// //       "deviceId": "0707216a-5613-4d00-81aa-efbe34f2a839",
// //       "deviceName": "SENSOR-001"
// //     }
// //   ],
// //   "layouts": {
// //     "lg": [
// //       {
// //         "w": 3,
// //         "h": 6,
// //         "x": 0,
// //         "y": 0,
// //         "i": "bce198e3-7837-4cd0-848c-1b19a7ef3a3f",
// //         "minW": 2,
// //         "minH": 2,
// //         "moved": false,
// //         "static": false
// //       },
// //       {
// //         "w": 5,
// //         "h": 11,
// //         "x": 3,
// //         "y": 0,
// //         "i": "f25d5637-2022-4ca8-9e97-2213611f2980",
// //         "minW": 2,
// //         "minH": 2,
// //         "moved": false,
// //         "static": false
// //       },
// //       {
// //         "w": 3,
// //         "h": 5,
// //         "x": 0,
// //         "y": 6,
// //         "i": "50502903-f507-4f4b-a73e-2314362af04d",
// //         "minW": 2,
// //         "minH": 2,
// //         "moved": false,
// //         "static": false
// //       },
// //       {
// //         "w": 4,
// //         "h": 4,
// //         "x": 8,
// //         "y": 0,
// //         "i": "22006596-037c-495d-ac50-1ec337ad2cc1",
// //         "minW": 2,
// //         "minH": 2,
// //         "moved": false,
// //         "static": false
// //       },
// //       {
// //         "w": 4,
// //         "h": 7,
// //         "x": 8,
// //         "y": 4,
// //         "i": "a8c23f79-a406-444f-80a0-8ace011358f0",
// //         "minW": 2,
// //         "minH": 2,
// //         "moved": false,
// //         "static": false
// //       }
// //     ],
// //     "md": [
// //       {
// //         "i": "bce198e3-7837-4cd0-848c-1b19a7ef3a3f",
// //         "x": 0,
// //         "y": 0,
// //         "w": 4,
// //         "h": 4,
// //         "minW": 2,
// //         "minH": 2
// //       },
// //       {
// //         "i": "f25d5637-2022-4ca8-9e97-2213611f2980",
// //         "x": 2,
// //         "y": 0,
// //         "w": 4,
// //         "h": 4,
// //         "minW": 2,
// //         "minH": 2
// //       },
// //       {
// //         "i": "50502903-f507-4f4b-a73e-2314362af04d",
// //         "x": 2,
// //         "y": 0,
// //         "w": 4,
// //         "h": 4,
// //         "minW": 2,
// //         "minH": 2
// //       },
// //       {
// //         "i": "22006596-037c-495d-ac50-1ec337ad2cc1",
// //         "x": 0,
// //         "y": 11,
// //         "w": 4,
// //         "h": 4,
// //         "minW": 2,
// //         "minH": 2
// //       },
// //       {
// //         "i": "a8c23f79-a406-444f-80a0-8ace011358f0",
// //         "x": 0,
// //         "y": 11,
// //         "w": 4,
// //         "h": 4,
// //         "minW": 2,
// //         "minH": 2
// //       }
// //     ],
// //     "sm": [
// //       {
// //         "i": "bce198e3-7837-4cd0-848c-1b19a7ef3a3f",
// //         "x": 0,
// //         "y": 0,
// //         "w": 8,
// //         "h": 4,
// //         "minW": 2,
// //         "minH": 2
// //       },
// //       {
// //         "i": "f25d5637-2022-4ca8-9e97-2213611f2980",
// //         "x": 0,
// //         "y": 0,
// //         "w": 8,
// //         "h": 4,
// //         "minW": 2,
// //         "minH": 2
// //       },
// //       {
// //         "i": "50502903-f507-4f4b-a73e-2314362af04d",
// //         "x": 0,
// //         "y": 0,
// //         "w": 8,
// //         "h": 4,
// //         "minW": 2,
// //         "minH": 2
// //       },
// //       {
// //         "i": "22006596-037c-495d-ac50-1ec337ad2cc1",
// //         "x": 0,
// //         "y": 11,
// //         "w": 8,
// //         "h": 4,
// //         "minW": 2,
// //         "minH": 2
// //       },
// //       {
// //         "i": "a8c23f79-a406-444f-80a0-8ace011358f0",
// //         "x": 0,
// //         "y": 11,
// //         "w": 8,
// //         "h": 4,
// //         "minW": 2,
// //         "minH": 2
// //       }
// //     ],
// //     "xs": [
// //       {
// //         "i": "bce198e3-7837-4cd0-848c-1b19a7ef3a3f",
// //         "x": 0,
// //         "y": 0,
// //         "w": 12,
// //         "h": 4,
// //         "minW": 2,
// //         "minH": 2
// //       },
// //       {
// //         "i": "f25d5637-2022-4ca8-9e97-2213611f2980",
// //         "x": 0,
// //         "y": 0,
// //         "w": 12,
// //         "h": 4,
// //         "minW": 2,
// //         "minH": 2
// //       },
// //       {
// //         "i": "50502903-f507-4f4b-a73e-2314362af04d",
// //         "x": 0,
// //         "y": 0,
// //         "w": 12,
// //         "h": 4,
// //         "minW": 2,
// //         "minH": 2
// //       },
// //       {
// //         "i": "22006596-037c-495d-ac50-1ec337ad2cc1",
// //         "x": 0,
// //         "y": 11,
// //         "w": 12,
// //         "h": 4,
// //         "minW": 2,
// //         "minH": 2
// //       },
// //       {
// //         "i": "a8c23f79-a406-444f-80a0-8ace011358f0",
// //         "x": 0,
// //         "y": 11,
// //         "w": 12,
// //         "h": 4,
// //         "minW": 2,
// //         "minH": 2
// //       }
// //     ]
// //   },
// //   "settings": {
// //     "timewindow": {
// //       "realtime": {
// //         "timewindowMs": 60000
// //       },
// //       "aggregation": {
// //         "type": "AVG",
// //         "limit": 200
// //       }
// //     },
// //     "gridSettings": {
// //       "backgroundColor": "#ffffff",
// //       "columns": 24,
// //       "margin": [
// //         10,
// //         10
// //       ],
// //       "backgroundImage": null
// //     }
// //   },
// //   "assignedCustomers": [],
// //   "timeWindow": {
// //     "displayValue": "Last 15 minutes",
// //     "value": "15_minutes",
// //     "type": "REALTIME"
// //   },
// //   "version": "1.0.0",
// //   "createdTime": "2025-07-06T14:36:52.119Z"
// // }

// // const DynamicHomePage = () => {
// //   const [dashboard, setDashboard] = useState(null)
// //   const [loading, setLoading] = useState(true)
// //   const [isDeviceSelectorVisible, setIsDeviceSelectorVisible] = useState(false)
// //   const [selectedDevices, setSelectedDevices] = useState([])
// //   const [viewMode, setViewMode] = useState("desktop")
// //   const { theme, toggleTheme } = useTheme()
// //   const isMobile = useMediaQuery("(max-width: 768px)")

// //   // Devices for selector
// //   const devices = (dashboard?.widgets || []).reduce((acc, w) => {
// //     if (w.deviceId && !acc.find(d => d.id === w.deviceId)) {
// //       acc.push({ id: w.deviceId, name: w.deviceName || w.deviceId })
// //     }
// //     return acc
// //   }, [])

// //   useEffect(() => {
// //     setTimeout(() => {
// //       setDashboard(test1Dashboard)
// //       setSelectedDevices(
// //         test1Dashboard.widgets.map(w => w.deviceId).filter(Boolean)
// //       )
// //       setLoading(false)
// //     }, 300)
// //   }, [])

// //   const handleDeviceChange = setSelectedDevices

// //   const getActiveLayout = () => {
// //     if (viewMode === "mobile") return "xs"
// //     if (viewMode === "tablet") return "sm"
// //     return "lg"
// //   }

// //   // Dummy mock data generator
// //   const generateMockData = (telemetry = [], timeWindow = {}) => {
// //     if (!telemetry.length) return []
// //     const now = new Date()
// //     const range = { "15_minutes": 15, "30_minutes": 30, "1_hour": 60 }[timeWindow.value] || 15
// //     const points = 30
// //     const interval = (range * 60 * 1000) / points
// //     return Array.from({ length: points }).map((_, i) => {
// //       const time = new Date(now - i * interval).toISOString()
// //       const data = { time }
// //       telemetry.forEach((k) => {
// //         if (k === "temp") data[k] = 25 + Math.random() * 4
// //         else if (k === "humidity") data[k] = 40 + Math.random() * 20
// //         else data[k] = Math.random() * 100
// //       })
// //       return data
// //     }).reverse()
// //   }

// //   const viewMenu = (
// //     <Menu>
// //       {["desktop", "tablet", "mobile"].map((v) => (
// //         <Menu.Item key={v} icon={v === "desktop" ? <DesktopOutlined /> : v === "tablet" ? <TabletOutlined /> : <MobileOutlined />} onClick={() => setViewMode(v)}>
// //           {v.charAt(0).toUpperCase() + v.slice(1)} View
// //         </Menu.Item>
// //       ))}
// //     </Menu>
// //   )

// //   if (loading || !dashboard) {
// //     return (
// //       <Layout className="dashboard-loading">
// //         <Spin size="large" />
// //       </Layout>
// //     )
// //   }
// //   return (
// //     <Layout className={`dashboard-root ${theme === "dark" ? "dark-theme" : ""}`}>
// //       <Content className="dashboard-content">
// //         <div className="dashboard-toolbar">
// //           <Title level={4} className="dashboard-title">{dashboard.title}</Title>
// //           <Space wrap>
// //             <Button icon={<FilterOutlined />} onClick={() => setIsDeviceSelectorVisible(true)}>
// //               Devices ({selectedDevices.length})
// //             </Button>
// //             <ThemeToggle theme={theme} onToggle={toggleTheme} />
// //             <Dropdown overlay={viewMenu}><Button icon={<AppstoreOutlined />} /></Dropdown>
// //           </Space>
// //         </div>

// //         <ResponsiveGridLayout
// //           className="layout"
// //           layouts={dashboard.layouts}
// //           breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
// //           cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
// //           rowHeight={40}
// //           margin={[5, 5]}
// //           containerPadding={[0, 0]}
// //           autoSize={true}
// //           isDraggable={false}
// //           isResizable={false}
// //           compactType={null}
// //           preventCollision={true}
// //           allowOverlap={false}
// //           useCSSTransforms={true}
// //         >
// //           {dashboard.widgets.map((w) => {
// //             if (!selectedDevices.includes(w.deviceId)) return null
// //             return (
// //               <div key={w.id} className="widget-container">
// //                 {/* Removed widget-drag-handle to avoid duplicate widget title */}
// //                 <div className="widget-body">
// //                   <WidgetRenderer
// //                     widget={w}
// //                     config={{
// //                       ...w.config,
// //                       data: generateMockData(
// //                         w.config.dataSource.telemetry || [],
// //                         dashboard.timeWindow,
// //                         [w.deviceId]
// //                       ),
// //                       timeWindow: dashboard.timeWindow,
// //                       theme,
// //                     }}
// //                   />
// //                 </div>
// //               </div>
// //             )
// //           })}
// //         </ResponsiveGridLayout>
// //       </Content>

// //       <Drawer
// //         title="Select Devices"
// //         placement="right"
// //         open={isDeviceSelectorVisible}
// //         onClose={() => setIsDeviceSelectorVisible(false)}
// //         width={isMobile ? "100%" : 360}
// //       >
// //         <DeviceSelector
// //           devices={devices}
// //           selectedDevices={selectedDevices}
// //           onDeviceChange={handleDeviceChange}
// //           aggregationMode={"none"}
// //           onAggregationChange={() => {}}
// //         />
// //       </Drawer>
// //     </Layout>
// //   )
// // //   return (
// // //     <Layout className={`dashboard-root ${theme === "dark" ? "dark-theme" : ""}`}>
// // //       <Content className="dashboard-content">
// // //         <div className="dashboard-toolbar">
// // //           <Title level={4} className="dashboard-title">{dashboard.title}</Title>
// // //           <Space wrap>
// // //             <Button icon={<FilterOutlined />} onClick={() => setIsDeviceSelectorVisible(true)}>
// // //               Devices ({selectedDevices.length})
// // //             </Button>
// // //             <ThemeToggle theme={theme} onToggle={toggleTheme} />
// // //             <Dropdown overlay={viewMenu}><Button icon={<AppstoreOutlined />} /></Dropdown>
// // //           </Space>
// // //         </div>

// // //         <ResponsiveGridLayout
// // //           className="layout"
// // //           layouts={dashboard.layouts}
// // //           breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
// // //           cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
// // //           rowHeight={40}
// // //           margin={[5, 5]}
// // //           containerPadding={[0, 0]}
// // //           autoSize={true}
// // //           isDraggable={false}
// // //           isResizable={false}
// // //           compactType={null}
// // //           preventCollision={true}
// // //           allowOverlap={false}
// // //           useCSSTransforms={true}
// // //         >
// // //           {dashboard.widgets.map((w) => {
// // //             if (!selectedDevices.includes(w.deviceId)) return null
// // //             return (
// // //               <div key={w.id} className="widget-container">
// // //                 <div className="widget-drag-handle">
// // //                   {w.title}
// // //                 </div>
// // //                 <div className="widget-body">
// // //                   <WidgetRenderer
// // //                     widget={w}
// // //                     config={{
// // //                       ...w.config,
// // //                       data: generateMockData(
// // //                         w.config.dataSource.telemetry || [],
// // //                         dashboard.timeWindow,
// // //                         [w.deviceId]
// // //                       ),
// // //                       timeWindow: dashboard.timeWindow,
// // //                       theme,
// // //                     }}
// // //                   />
// // //                 </div>
// // //               </div>
// // //             )
// // //           })}
// // //         </ResponsiveGridLayout>
// // //       </Content>

// // //       <Drawer
// // //         title="Select Devices"
// // //         placement="right"
// // //         open={isDeviceSelectorVisible}
// // //         onClose={() => setIsDeviceSelectorVisible(false)}
// // //         width={isMobile ? "100%" : 360}
// // //       >
// // //         <DeviceSelector
// // //           devices={devices}
// // //           selectedDevices={selectedDevices}
// // //           onDeviceChange={handleDeviceChange}
// // //           aggregationMode={"none"}
// // //           onAggregationChange={() => {}}
// // //         />
// // //       </Drawer>
// // //     </Layout>
// // //   )
// // }

// // export default DynamicHomePage

// // // const DynamicHomePage = () => {
// // //   const [dashboard, setDashboard] = useState(null)
// // //   const [loading, setLoading] = useState(true)
// // //   const [isDeviceSelectorVisible, setIsDeviceSelectorVisible] = useState(false)
// // //   const [selectedDevices, setSelectedDevices] = useState([])
// // //   const [viewMode, setViewMode] = useState("desktop")
// // //   const { theme, toggleTheme } = useTheme()
// // //   const isMobile = useMediaQuery("(max-width: 768px)")

// // //   // Extract devices from dashboard for selector
// // //   const devices = (dashboard?.widgets || []).reduce((acc, w) => {
// // //     if (w.deviceId && !acc.find(d => d.id === w.deviceId)) {
// // //       acc.push({ id: w.deviceId, name: w.deviceName || w.deviceId })
// // //     }
// // //     return acc
// // //   }, [])

// // //   useEffect(() => {
// // //     setTimeout(() => {
// // //       setDashboard(test1Dashboard)
// // //       setSelectedDevices(
// // //         test1Dashboard.widgets.map(w => w.deviceId).filter(Boolean)
// // //       )
// // //       setLoading(false)
// // //     }, 300)
// // //   }, [])

// // //   const handleDeviceChange = setSelectedDevices

// // //   const getActiveLayout = () => {
// // //     if (viewMode === "mobile") return "xs"
// // //     if (viewMode === "tablet") return "sm"
// // //     return "lg"
// // //   }

// // //   // Dummy mock data function for demo widgets
// // //   const generateMockData = (telemetry = [], timeWindow = {}) => {
// // //     if (!telemetry.length) return []
// // //     const now = new Date()
// // //     const range = { "15_minutes": 15, "30_minutes": 30, "1_hour": 60 }[timeWindow.value] || 15
// // //     const points = 30
// // //     const interval = (range * 60 * 1000) / points
// // //     return Array.from({ length: points }).map((_, i) => {
// // //       const time = new Date(now - i * interval).toISOString()
// // //       const data = { time }
// // //       telemetry.forEach((k) => {
// // //         if (k === "temp") data[k] = 25 + Math.random() * 4
// // //         else if (k === "humidity") data[k] = 40 + Math.random() * 20
// // //         else data[k] = Math.random() * 100
// // //       })
// // //       return data
// // //     }).reverse()
// // //   }

// // //   const viewMenu = (
// // //     <Menu>
// // //       {["desktop", "tablet", "mobile"].map((v) => (
// // //         <Menu.Item key={v} icon={v === "desktop" ? <DesktopOutlined /> : v === "tablet" ? <TabletOutlined /> : <MobileOutlined />} onClick={() => setViewMode(v)}>
// // //           {v.charAt(0).toUpperCase() + v.slice(1)} View
// // //         </Menu.Item>
// // //       ))}
// // //     </Menu>
// // //   )

// // //   if (loading || !dashboard) {
// // //     return (
// // //       <Layout style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
// // //         <Spin size="large" />
// // //       </Layout>
// // //     )
// // //   }

// // //   return (
// // //     <Layout style={{ minHeight: "100vh", background: theme === "dark" ? "#1f1f1f" : "#f0f2f5" }}>
// // //       <Content style={{ background: theme === "dark" ? "#141414" : "#fff", padding: 16, borderRadius: 8 }}>
// // //         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
// // //           <Title level={4} style={{ margin: 0, color: theme === "dark" ? "#fff" : "#000" }}>{dashboard.title}</Title>
// // //           <Space wrap>
// // //             <Button icon={<FilterOutlined />} onClick={() => setIsDeviceSelectorVisible(true)}>
// // //               Devices ({selectedDevices.length})
// // //             </Button>
// // //             <ThemeToggle theme={theme} onToggle={toggleTheme} />
// // //             <Dropdown overlay={viewMenu}><Button icon={<AppstoreOutlined />} /></Dropdown>
// // //           </Space>
// // //         </div>

// // //         <ResponsiveGridLayout
// // //           // className="layout"
// // //           // layouts={dashboard.layouts}
// // //           // breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
// // //           // cols={{ lg: 12, md: 10, sm: 8, xs: 4 }}
// // //           // rowHeight={40}
// // //           // isDraggable={false}
// // //           // isResizable={false}
// // //           // margin={[10, 10]}
// // //           // useCSSTransforms={true}
// // //           // compactType={null}
// // //           // allowOverlap={false}

// // //               className="layout"
// // //               layouts={dashboard.layouts}
// // //               breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
// // //               cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
// // //               rowHeight={40}
// // //               margin={[5, 5]}
// // //               containerPadding={[0, 0]}
// // //               autoSize={true}
// // //               isDraggable={false}
// // //               isResizable={false}
// // //               compactType={null}
// // //               preventCollision={true}
// // //               allowOverlap={false}
// // //               useCSSTransforms={true}
// // //               // onLayoutChange={handleLayoutChange}
// // //         >
// // //           {dashboard.widgets.map((w) => {
// // //             if (!selectedDevices.includes(w.deviceId)) return null
// // //             // Use widget's current config for WidgetRenderer, inject mock data
// // //             const activeLayoutArr = dashboard.layouts[getActiveLayout()] || []
// // //             const layout = activeLayoutArr.find(l => l.i === w.id)
// // //             const widgetHeight = layout ? (layout.h * 40) : 300
// // //             const headerHeight = 38

// // //             return (
// // //               <div
// // //                 key={w.id}
// // //                 className="widget-container"
// // //                 style={{
// // //                   // border: theme === "dark" ? "1px solid #333" : "1px solid #eee",
// // //                   // background: theme === "dark" ? "#23232a" : "#fff",
// // //                   display: "flex",
// // //                   flexDirection: "column",
// // //                   height: widgetHeight,
// // //                   minHeight: 60,
// // //                   boxSizing: "border-box",
// // //                   overflow: "hidden",
// // //                 }}
// // //               >
// // //                 <div
// // //                   className="widget-drag-handle"
// // //                   style={{
// // //                     padding: "8px 12px",
// // //                     // background: theme === "dark" ? "#191921" : "#fafafa",
// // //                     // borderBottom: "1px solid #eee",
// // //                     fontWeight: 500,
// // //                     fontSize: 15,
// // //                     minHeight: headerHeight,
// // //                     maxHeight: headerHeight,
// // //                     // color: theme === "dark" ? "#fff" : "#222",
// // //                     display: "flex",
// // //                     alignItems: "center"
// // //                   }}
// // //                 >
// // //                   {w.title}
// // //                 </div>
// // //                 <div
// // //                   className="widget-body"
// // //                   style={{
// // //                     width: "100%",
// // //                     height: "100%",
// // //                     display: "flex",
// // //                     flexDirection: "column",
// // //                     flex: 1,
// // //                     minHeight: 0,
// // //                     overflow: "hidden",
// // //                     background: "inherit",
// // //                     padding: 0,
// // //                   }}
// // //                 >
// // //                   <WidgetRenderer
// // //                     widget={w}
// // //                     config={{
// // //                       ...w.config,
// // //                       data: generateMockData(
// // //                         w.config.dataSource.telemetry || [],
// // //                         dashboard.timeWindow,
// // //                         [w.deviceId]
// // //                       ),
// // //                       timeWindow: dashboard.timeWindow,
// // //                       theme,
// // //                     }}
// // //                   />
// // //                 </div>
// // //               </div>
// // //             )
// // //           })}
// // //         </ResponsiveGridLayout>
// // //       </Content>

// // //       <Drawer
// // //         title="Select Devices"
// // //         placement="right"
// // //         open={isDeviceSelectorVisible}
// // //         onClose={() => setIsDeviceSelectorVisible(false)}
// // //         width={isMobile ? "100%" : 360}
// // //       >
// // //         <DeviceSelector
// // //           devices={devices}
// // //           selectedDevices={selectedDevices}
// // //           onDeviceChange={handleDeviceChange}
// // //           aggregationMode={"none"}
// // //           onAggregationChange={() => {}}
// // //         />
// // //       </Drawer>
// // //     </Layout>
// // //   )
// // // }

// // // export default DynamicHomePage

// // // "use client"

// // // import { useState, useEffect } from "react"
// // // import {
// // //   Layout,
// // //   Typography,
// // //   Spin,
// // //   Button,
// // //   Upload,
// // //   Space,
// // //   Dropdown,
// // //   Menu,
// // //   Alert,
// // //   Drawer,
// // // } from "antd"
// // // import {
// // //   UploadOutlined,
// // //   ClockCircleOutlined,
// // //   ReloadOutlined,
// // //   FullscreenOutlined,
// // //   FilterOutlined,
// // //   AppstoreOutlined,
// // //   DesktopOutlined,
// // //   TabletOutlined,
// // //   MobileOutlined,
// // // } from "@ant-design/icons"
// // // import { Responsive, WidthProvider } from "react-grid-layout"
// // // import WidgetRenderer from "../components/dashboard/WidgetRenderer"
// // // import TimeWindowSettings from "../components/dashboard/TimeWindowSettings"
// // // import DeviceSelector from "../components/dashboard/DeviceSelector"
// // // import { useTheme } from "../components/theme/ThemeProvider"
// // // import ThemeToggle from "../components/theme/ThemeToggle"
// // // import { useMediaQuery } from "../hooks/useMediaQuery"
// // // import "react-grid-layout/css/styles.css"
// // // import "react-resizable/css/styles.css"

// // // const ResponsiveGridLayout = WidthProvider(Responsive)
// // // const { Content } = Layout
// // // const { Title, Text } = Typography

// // // const DynamicHomePage = () => {
// // //   const [dashboard, setDashboard] = useState(null)
// // //   const [loading, setLoading] = useState(true)
// // //   const [isFullscreen, setIsFullscreen] = useState(false)
// // //   const [isTimeWindowVisible, setIsTimeWindowVisible] = useState(false)
// // //   const [isDeviceSelectorVisible, setIsDeviceSelectorVisible] = useState(false)
// // //   const [selectedDevices, setSelectedDevices] = useState([])
// // //   const [aggregationMode, setAggregationMode] = useState("none")
// // //   const [lastRefreshed, setLastRefreshed] = useState(new Date())
// // //   const [viewMode, setViewMode] = useState("desktop")
// // //   const { theme, toggleTheme } = useTheme()
// // //   const isMobile = useMediaQuery("(max-width: 768px)")

// // //   const devices = [
// // //     { id: "device1", name: "Temperature Sensor" },
// // //     { id: "device2", name: "Pressure Valve" },
// // //     { id: "device3", name: "Power Meter" },
// // //   ]

// // //   const mockDashboard = {
// // //     title: "Mock IoT Dashboard",
// // //     widgets: [
// // //       {
// // //         id: "widget1",
// // //         type: "camera",
// // //         title: "Temperature Chart",
// // //         deviceId: "device1",
// // //         config: {
// // //           title: "Temperature",
// // //           dataSource: {
// // //             deviceId: "device1",
// // //             dataKeys: ["temperature"],
// // //           },
// // //         },
// // //       },
// // //       {
// // //         id: "widget2",
// // //         type: "battery-level",
// // //         title: "Battery Level",
// // //         deviceId: "device2",
// // //         config: {
// // //           title: "Battery",
// // //           dataSource: {
// // //             deviceId: "device2",
// // //             dataKeys: ["batteryLevel"],
// // //           },
// // //         },
// // //       },
// // //       {
// // //         id: "widget3",
// // //         type: "status-card",
// // //         title: "Device Status",
// // //         deviceId: "device3",
// // //         config: {
// // //           title: "Status",
// // //           dataSource: {
// // //             deviceId: "device3",
// // //             dataKeys: ["status"],
// // //           },
// // //         },
// // //       },
// // //     ],
// // //     layouts: {
// // //       lg: [
// // //         { i: "widget1", x: 0, y: 0, w: 6, h: 3 },
// // //         { i: "widget2", x: 6, y: 0, w: 3, h: 2 },
// // //         { i: "widget3", x: 9, y: 0, w: 3, h: 2 },
// // //       ],
// // //     },
// // //     timeWindow: {
// // //       displayValue: "Last 15 minutes",
// // //       value: "15_minutes",
// // //       type: "REALTIME",
// // //     },
// // //   }

// // //   useEffect(() => {
// // //     setTimeout(() => {
// // //       setDashboard(mockDashboard)
// // //       setSelectedDevices(devices.map((d) => d.id))
// // //       setLoading(false)
// // //     }, 800)
// // //   }, [])

// // //   const handleImportDashboard = (file) => {
// // //     const reader = new FileReader()
// // //     reader.onload = (e) => {
// // //       try {
// // //         const imported = JSON.parse(e.target.result)
// // //         setDashboard(imported)
// // //         const importedDevices = [
// // //           ...new Set(
// // //             (imported.widgets || [])
// // //               .map((w) => w.config?.dataSource?.deviceId)
// // //               .filter(Boolean)
// // //           ),
// // //         ]
// // //         setSelectedDevices(importedDevices)
// // //       } catch (err) {
// // //         console.error("Invalid dashboard:", err)
// // //       }
// // //     }
// // //     reader.readAsText(file)
// // //     return false
// // //   }

// // //   const handleFullscreen = () => {
// // //     if (!document.fullscreenElement) {
// // //       document.documentElement.requestFullscreen()
// // //       setIsFullscreen(true)
// // //     } else {
// // //       document.exitFullscreen()
// // //       setIsFullscreen(false)
// // //     }
// // //   }

// // //   const handleTimeWindowChange = (tw) => {
// // //     setDashboard((prev) => ({ ...prev, timeWindow: tw }))
// // //     setIsTimeWindowVisible(false)
// // //   }

// // //   const handleDeviceChange = setSelectedDevices
// // //   const handleAggregationChange = setAggregationMode
// // //   const handleRefresh = () => setLastRefreshed(new Date())

// // //   const getActiveLayout = () => {
// // //     if (viewMode === "mobile") return "xs"
// // //     if (viewMode === "tablet") return "sm"
// // //     return "lg"
// // //   }

// // //   const generateMockData = (keys = [], timeWindow = {}, devIds = [], aggregation = "none") => {
// // //     if (!keys.length || !devIds.length) return []
// // //     const now = new Date()
// // //     const range = { "15_minutes": 15, "30_minutes": 30, "1_hour": 60 }[timeWindow.value] || 15
// // //     const points = 30
// // //     const interval = (range * 60 * 1000) / points

// // //     return Array.from({ length: points }).map((_, i) => {
// // //       const time = new Date(now - i * interval).toISOString()
// // //       const data = { time }
// // //       keys.forEach((k) => {
// // //         if (k === "temperature") data[k] = 20 + Math.random() * 5
// // //         else if (k === "batteryLevel") data[k] = 100 - i + Math.random() * 2
// // //         else if (k === "status") data[k] = i % 5 === 0 ? "Offline" : "Online"
// // //       })
// // //       return data
// // //     }).reverse()
// // //   }

// // //   const timeWindowMenu = (
// // //     <Menu>
// // //       {["15_minutes", "30_minutes", "1_hour"].map((v) => (
// // //         <Menu.Item key={v} onClick={() => handleTimeWindowChange({ displayValue: v.replace("_", " "), value: v })}>
// // //           {v.replace("_", " ")}
// // //         </Menu.Item>
// // //       ))}
// // //       <Menu.Item key="custom" onClick={() => setIsTimeWindowVisible(true)}>Custom...</Menu.Item>
// // //     </Menu>
// // //   )

// // //   const viewMenu = (
// // //     <Menu>
// // //       {["desktop", "tablet", "mobile"].map((v) => (
// // //         <Menu.Item key={v} icon={v === "desktop" ? <DesktopOutlined /> : v === "tablet" ? <TabletOutlined /> : <MobileOutlined />} onClick={() => setViewMode(v)}>
// // //           {v.charAt(0).toUpperCase() + v.slice(1)} View
// // //         </Menu.Item>
// // //       ))}
// // //     </Menu>
// // //   )

// // //   if (loading || !dashboard) {
// // //     return (
// // //       <Layout style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
// // //         <Spin size="large" />
// // //       </Layout>
// // //     )
// // //   }

// // //   return (
// // //     <Layout style={{ minHeight: "100vh", padding: 24, background: theme === "dark" ? "#1f1f1f" : "#f0f2f5" }}>
// // //       <Content style={{ background: theme === "dark" ? "#141414" : "#fff", padding: 24, borderRadius: 8 }}>
// // //         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
// // //           <Title level={4} style={{ margin: 0, color: theme === "dark" ? "#fff" : "#000" }}>{dashboard.title}</Title>
// // //           <Space wrap>
// // //             <Button icon={<FilterOutlined />} onClick={() => setIsDeviceSelectorVisible(true)}>
// // //               Devices ({selectedDevices.length})
// // //             </Button>
// // //             <Dropdown overlay={timeWindowMenu}><Button icon={<ClockCircleOutlined />} /></Dropdown>
// // //             <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
// // //             {/* Theme Toggle */}
// // //             <ThemeToggle theme={theme} onToggle={toggleTheme} />
// // //             <Dropdown overlay={viewMenu}><Button icon={<AppstoreOutlined />} /></Dropdown>
// // //             <Button icon={<FullscreenOutlined />} onClick={handleFullscreen} />
// // //             <Upload accept=".json" beforeUpload={handleImportDashboard} showUploadList={false}>
// // //               <Button icon={<UploadOutlined />}>Import</Button>
// // //             </Upload>
// // //           </Space>
// // //         </div>

// // //         {selectedDevices.length === 0 ? (
// // //           <Alert
// // //             type="info"
// // //             message="No devices selected"
// // //             action={<Button onClick={() => setIsDeviceSelectorVisible(true)}>Select Devices</Button>}
// // //           />
// // //         ) : (
// // //           <ResponsiveGridLayout
// // //             className="layout"
// // //             layouts={dashboard.layouts}
// // //             breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
// // //             cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
// // //             rowHeight={100}
// // //             isDraggable={false}
// // //             isResizable={false}
// // //             margin={[10, 10]}
// // //           >
// // // {dashboard.widgets.map((w) => {
// // //   if (!selectedDevices.includes(w.deviceId)) return null

// // //   // Find layout info for current widget
// // //   const layoutArr = dashboard.layouts[getActiveLayout()] || []
// // //   const layout = layoutArr.find(l => l.i === w.id)
// // //   const rowHeight = 100 // Should match ResponsiveGridLayout
// // //   const headerHeight = 36 // px for header
// // //   const widgetHeight = layout ? (layout.h * rowHeight) : 300

// // //   return (
// // //     <div
// // //       key={w.id}
// // //       style={{
// // //         border: "1px solid #eee",
// // //         borderRadius: 0,
// // //         background: theme === "dark" ? "#23232a" : "#fff",
// // //         display: "flex",
// // //         flexDirection: "column",
// // //         height: widgetHeight,
// // //         overflow: "hidden"
// // //       }}
// // //     >
// // //       <div
// // //         style={{
// // //           padding: "8px 12px",
// // //           background: theme === "dark" ? "#191921" : "#fafafa",
// // //           borderBottom: "1px solid #eee",
// // //           fontWeight: 500,
// // //           fontSize: 15,
// // //           minHeight: headerHeight,
// // //           maxHeight: headerHeight,
// // //           color: theme === "dark" ? "#fff" : "#222",
// // //           display: "flex",
// // //           alignItems: "center"
// // //         }}
// // //       >
// // //         {w.title}
// // //       </div>
// // //       <div
// // //         style={{
// // //           width: "100%",
// // //           height: "100%",
// // //           display: "flex",         // allow children to fill height
// // //           flexDirection: "column", // stack vertically
// // //           flex: 1,                 // grow to fill container
// // //           minHeight: 0,            // allow child shrinkage in flexbox
// // //           overflow: "hidden",      // prevent internal scrollbars
// // //           padding: 0,
// // //           background: "inherit",
// // //         }}
// // //       >
// // //         <WidgetRenderer
        
// // //           widget={w}
// // //           config={{
// // //             ...w.config,
// // //             data: generateMockData(
// // //               w.config.dataSource.dataKeys || [],
// // //               dashboard.timeWindow,
// // //               selectedDevices,
// // //               aggregationMode
// // //             ),
// // //             timeWindow: dashboard.timeWindow,
// // //             theme,
// // //           }}
// // //         />
// // //       </div>
// // //     </div>
// // //   )
// // // })}

// // //           </ResponsiveGridLayout>
// // //         )}

// // //         <div style={{ textAlign: "right", marginTop: 12 }}>
// // //           <Text type="secondary">Last updated: {lastRefreshed.toLocaleTimeString()}</Text>
// // //         </div>
// // //       </Content>

// // //       <TimeWindowSettings
// // //         visible={isTimeWindowVisible}
// // //         onClose={() => setIsTimeWindowVisible(false)}
// // //         onSave={handleTimeWindowChange}
// // //         initialValue={dashboard.timeWindow}
// // //       />

// // //       <Drawer
// // //         title="Select Devices"
// // //         placement="right"
// // //         open={isDeviceSelectorVisible}
// // //         onClose={() => setIsDeviceSelectorVisible(false)}
// // //         width={isMobile ? "100%" : 360}
// // //       >
// // //         <DeviceSelector
// // //           devices={devices}
// // //           selectedDevices={selectedDevices}
// // //           onDeviceChange={handleDeviceChange}
// // //           aggregationMode={aggregationMode}
// // //           onAggregationChange={handleAggregationChange}
// // //         />
// // //       </Drawer>
// // //     </Layout>
// // //   )
// // // }

// // // export default DynamicHomePage


// // // // "use client"

// // // // import { useState, useEffect } from "react"
// // // // import {
// // // //   Layout,
// // // //   Typography,
// // // //   Spin,
// // // //   Button,
// // // //   Upload,
// // // //   Space,
// // // //   Dropdown,
// // // //   Menu,
// // // //   Card,
// // // //   Empty,
// // // //   Drawer,
// // // //   Alert,
// // // // } from "antd"
// // // // import {
// // // //   UploadOutlined,
// // // //   ClockCircleOutlined,
// // // //   ReloadOutlined,
// // // //   FullscreenOutlined,
// // // //   DownOutlined,
// // // //   FilterOutlined,
// // // //   AppstoreOutlined,
// // // //   DesktopOutlined,
// // // //   TabletOutlined,
// // // //   MobileOutlined,
// // // // } from "@ant-design/icons"
// // // // import { Responsive, WidthProvider } from "react-grid-layout"
// // // // import WidgetRenderer from "../components/dashboard/WidgetRenderer"
// // // // import TimeWindowSettings from "../components/dashboard/TimeWindowSettings"
// // // // import DeviceSelector from "../components/dashboard/DeviceSelector"
// // // // import { useTheme } from "../components/theme/ThemeProvider"
// // // // import ThemeToggle from "../components/theme/ThemeToggle"
// // // // import { useMediaQuery } from "../hooks/useMediaQuery"
// // // // import "react-grid-layout/css/styles.css"
// // // // import "react-resizable/css/styles.css"

// // // // const ResponsiveGridLayout = WidthProvider(Responsive)
// // // // const { Content } = Layout
// // // // const { Title, Text } = Typography

// // // // const DynamicHomePage = () => {
// // // //   const [dashboard, setDashboard] = useState(null)
// // // //   const [loading, setLoading] = useState(true)
// // // //   const [isFullscreen, setIsFullscreen] = useState(false)
// // // //   const [isTimeWindowVisible, setIsTimeWindowVisible] = useState(false)
// // // //   const [isDeviceSelectorVisible, setIsDeviceSelectorVisible] = useState(false)
// // // //   const [selectedDevices, setSelectedDevices] = useState([])
// // // //   const [aggregationMode, setAggregationMode] = useState("none")
// // // //   const [lastRefreshed, setLastRefreshed] = useState(new Date())
// // // //   const [viewMode, setViewMode] = useState("desktop")
// // // //   const { theme } = useTheme()
// // // //   const isMobile = useMediaQuery("(max-width: 768px)")

// // // //   const devices = [
// // // //     { id: "device1", name: "Temperature Sensor" },
// // // //     { id: "device2", name: "Pressure Valve" },
// // // //     { id: "device3", name: "Power Meter" },
// // // //   ]

// // // //   const mockDashboard = {
// // // //     title: "Mock IoT Dashboard",
// // // //     widgets: [
// // // //       {
// // // //         id: "widget1",
// // // //         type: "line-chart",
// // // //         title: "Temperature Chart",
// // // //         deviceId: "device1",
// // // //         config: {
// // // //           title: "Temperature",
// // // //           dataSource: {
// // // //             deviceId: "device1",
// // // //             dataKeys: ["temperature"],
// // // //           },
// // // //         },
// // // //       },
// // // //       {
// // // //         id: "widget2",
// // // //         type: "battery-level",
// // // //         title: "Battery Level",
// // // //         deviceId: "device2",
// // // //         config: {
// // // //           title: "Battery",
// // // //           dataSource: {
// // // //             deviceId: "device2",
// // // //             dataKeys: ["batteryLevel"],
// // // //           },
// // // //         },
// // // //       },
// // // //       {
// // // //         id: "widget3",
// // // //         type: "status-card",
// // // //         title: "Device Status",
// // // //         deviceId: "device3",
// // // //         config: {
// // // //           title: "Status",
// // // //           dataSource: {
// // // //             deviceId: "device3",
// // // //             dataKeys: ["status"],
// // // //           },
// // // //         },
// // // //       },
// // // //     ],
// // // //     layouts: {
// // // //       lg: [
// // // //         { i: "widget1", x: 0, y: 0, w: 6, h: 3 },
// // // //         { i: "widget2", x: 6, y: 0, w: 3, h: 2 },
// // // //         { i: "widget3", x: 9, y: 0, w: 3, h: 2 },
// // // //       ],
// // // //     },
// // // //     timeWindow: {
// // // //       displayValue: "Last 15 minutes",
// // // //       value: "15_minutes",
// // // //       type: "REALTIME",
// // // //     },
// // // //   }

// // // //   useEffect(() => {
// // // //     setTimeout(() => {
// // // //       setDashboard(mockDashboard)
// // // //       setSelectedDevices(devices.map((d) => d.id))
// // // //       setLoading(false)
// // // //     }, 800)
// // // //   }, [])

// // // //   const handleImportDashboard = (file) => {
// // // //     const reader = new FileReader()
// // // //     reader.onload = (e) => {
// // // //       try {
// // // //         const imported = JSON.parse(e.target.result)
// // // //         setDashboard(imported)

// // // //         // 🔧 Extract device IDs from widgets
// // // //         const importedDevices = [
// // // //           ...new Set(
// // // //             (imported.widgets || [])
// // // //               .map((w) => w.config?.dataSource?.deviceId)
// // // //               .filter(Boolean)
// // // //           ),
// // // //         ]
// // // //         setSelectedDevices(importedDevices)
// // // //       } catch (err) {
// // // //         console.error("Invalid dashboard:", err)
// // // //       }
// // // //     }
// // // //     reader.readAsText(file)
// // // //     return false
// // // //   }


// // // //   const handleFullscreen = () => {
// // // //     if (!document.fullscreenElement) {
// // // //       document.documentElement.requestFullscreen()
// // // //       setIsFullscreen(true)
// // // //     } else {
// // // //       document.exitFullscreen()
// // // //       setIsFullscreen(false)
// // // //     }
// // // //   }

// // // //   const handleTimeWindowChange = (tw) => {
// // // //     setDashboard((prev) => ({ ...prev, timeWindow: tw }))
// // // //     setIsTimeWindowVisible(false)
// // // //   }

// // // //   const handleDeviceChange = setSelectedDevices
// // // //   const handleAggregationChange = setAggregationMode
// // // //   const handleRefresh = () => setLastRefreshed(new Date())

// // // //   const getActiveLayout = () => {
// // // //     if (viewMode === "mobile") return "xs"
// // // //     if (viewMode === "tablet") return "sm"
// // // //     return "lg"
// // // //   }

// // // //   const generateMockData = (keys = [], timeWindow = {}, devIds = [], aggregation = "none") => {
// // // //     if (!keys.length || !devIds.length) return []
// // // //     const now = new Date()
// // // //     const range = { "15_minutes": 15, "30_minutes": 30, "1_hour": 60 }[timeWindow.value] || 15
// // // //     const points = 30
// // // //     const interval = (range * 60 * 1000) / points

// // // //     return Array.from({ length: points }).map((_, i) => {
// // // //       const time = new Date(now - i * interval).toISOString()
// // // //       const data = { time }
// // // //       keys.forEach((k) => {
// // // //         if (k === "temperature") data[k] = 20 + Math.random() * 5
// // // //         else if (k === "batteryLevel") data[k] = 100 - i + Math.random() * 2
// // // //         else if (k === "status") data[k] = i % 5 === 0 ? "Offline" : "Online"
// // // //       })
// // // //       return data
// // // //     }).reverse()
// // // //   }

// // // //   const timeWindowMenu = (
// // // //     <Menu>
// // // //       {["15_minutes", "30_minutes", "1_hour"].map((v) => (
// // // //         <Menu.Item key={v} onClick={() => handleTimeWindowChange({ displayValue: v.replace("_", " "), value: v })}>
// // // //           {v.replace("_", " ")}
// // // //         </Menu.Item>
// // // //       ))}
// // // //       <Menu.Item key="custom" onClick={() => setIsTimeWindowVisible(true)}>Custom...</Menu.Item>
// // // //     </Menu>
// // // //   )

// // // //   const viewMenu = (
// // // //     <Menu>
// // // //       {["desktop", "tablet", "mobile"].map((v) => (
// // // //         <Menu.Item key={v} icon={v === "desktop" ? <DesktopOutlined /> : v === "tablet" ? <TabletOutlined /> : <MobileOutlined />} onClick={() => setViewMode(v)}>
// // // //           {v.charAt(0).toUpperCase() + v.slice(1)} View
// // // //         </Menu.Item>
// // // //       ))}
// // // //     </Menu>
// // // //   )

// // // //   if (loading || !dashboard) {
// // // //     return (
// // // //       <Layout style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
// // // //         <Spin size="large" />
// // // //       </Layout>
// // // //     )
// // // //   }

// // // //   return (
// // // //     <Layout style={{ minHeight: "100vh", padding: 24, background: theme === "dark" ? "#1f1f1f" : "#f0f2f5" }}>
// // // //       <Content style={{ background: theme === "dark" ? "#141414" : "#fff", padding: 24, borderRadius: 8 }}>
// // // //         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
// // // //           <Title level={4} style={{ margin: 0, color: theme === "dark" ? "#fff" : "#000" }}>{dashboard.title}</Title>
// // // //           <Space wrap>
// // // //             <Button icon={<FilterOutlined />} onClick={() => setIsDeviceSelectorVisible(true)}>
// // // //               Devices ({selectedDevices.length})
// // // //             </Button>
// // // //             <Dropdown overlay={timeWindowMenu}><Button icon={<ClockCircleOutlined />} /></Dropdown>
// // // //             <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
// // // //             <ThemeToggle />
// // // //             <Dropdown overlay={viewMenu}><Button icon={<AppstoreOutlined />} /></Dropdown>
// // // //             <Button icon={<FullscreenOutlined />} onClick={handleFullscreen} />
// // // //             <Upload accept=".json" beforeUpload={handleImportDashboard} showUploadList={false}>
// // // //               <Button icon={<UploadOutlined />}>Import</Button>
// // // //             </Upload>
// // // //           </Space>
// // // //         </div>

// // // //         {selectedDevices.length === 0 ? (
// // // //           <Alert
// // // //             type="info"
// // // //             message="No devices selected"
// // // //             action={<Button onClick={() => setIsDeviceSelectorVisible(true)}>Select Devices</Button>}
// // // //           />
// // // //         ) : (
// // // //           <ResponsiveGridLayout
// // // //             className="layout"
// // // //             layouts={dashboard.layouts}
// // // //             breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
// // // //             cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
// // // //             rowHeight={100}
// // // //             isDraggable={false}
// // // //             isResizable={false}
// // // //             margin={[10, 10]}
// // // //           >
// // // //             {dashboard.widgets.map((w) => {
// // // //               if (!selectedDevices.includes(w.deviceId)) return null
// // // //               return (
// // // //                 <div key={w.id} style={{ border: "1px solid #eee", borderRadius: 0 }}>
// // // //                   <div style={{ padding: 2, background: "#fafafa", }}>{w.title}</div>
// // // //                   <div style={{ padding: 0 }}>
// // // //                     <WidgetRenderer
// // // //                       widget={w}
// // // //                       config={{
// // // //                         ...w.config,
// // // //                         data: generateMockData(w.config.dataSource.dataKeys || [], dashboard.timeWindow, selectedDevices, aggregationMode),
// // // //                         timeWindow: dashboard.timeWindow,
// // // //                         theme,
// // // //                       }}
// // // //                     />
// // // //                   </div>
// // // //                 </div>
// // // //               )
// // // //             })}
// // // //           </ResponsiveGridLayout>
// // // //         )}

// // // //         <div style={{ textAlign: "right", marginTop: 12 }}>
// // // //           <Text type="secondary">Last updated: {lastRefreshed.toLocaleTimeString()}</Text>
// // // //         </div>
// // // //       </Content>

// // // //       <TimeWindowSettings
// // // //         visible={isTimeWindowVisible}
// // // //         onClose={() => setIsTimeWindowVisible(false)}
// // // //         onSave={handleTimeWindowChange}
// // // //         initialValue={dashboard.timeWindow}
// // // //       />

// // // //       <Drawer
// // // //         title="Select Devices"
// // // //         placement="right"
// // // //         open={isDeviceSelectorVisible}
// // // //         onClose={() => setIsDeviceSelectorVisible(false)}
// // // //         width={isMobile ? "100%" : 360}
// // // //       >
// // // //         <DeviceSelector
// // // //           devices={devices}
// // // //           selectedDevices={selectedDevices}
// // // //           onDeviceChange={handleDeviceChange}
// // // //           aggregationMode={aggregationMode}
// // // //           onAggregationChange={handleAggregationChange}
// // // //         />
// // // //       </Drawer>
// // // //     </Layout>
// // // //   )
// // // // }

// // // // export default DynamicHomePage
