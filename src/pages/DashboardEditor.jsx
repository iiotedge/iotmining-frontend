"use client"

import { useState, useEffect } from "react"
import {
  Layout, Button, Space, Input, Typography, Modal, Form, Select, Dropdown, Menu,
} from "antd"
import { useParams, useNavigate } from "react-router-dom"
import {
  PlusOutlined, ClockCircleOutlined, SettingOutlined, LinkOutlined, FilterOutlined,
  HistoryOutlined, CloseOutlined, SaveOutlined, FullscreenOutlined, EditOutlined,
  DeleteOutlined, CopyOutlined, DownloadOutlined, UploadOutlined, TeamOutlined, DownOutlined,
  CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, InfoCircleOutlined,
} from "@ant-design/icons"
import { Responsive, WidthProvider } from "react-grid-layout"
import { saveAs } from "file-saver"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import "../styles/widget.css"

import WidgetLibrary from "../components/dashboard/WidgetLibrary"
import TimeWindowSettings from "../components/dashboard/TimeWindowSettings"
import DashboardSettings from "../components/dashboard/DashboardSettings"
import ManageLayoutsModal from "../components/dashboard/ManageLayoutsModal"
import ManageStatesModal from "../components/dashboard/ManageStatesModal"
import EntityAliasesModal from "../components/dashboard/EntityAliasesModal"
import WidgetRenderer from "../components/dashboard/WidgetRenderer"
import WidgetConfigModal from "../components/dashboard/WidgetConfigModal"
import { useMediaQuery } from "../hooks/useMediaQuery"
import { useTheme } from "../components/theme/ThemeProvider"
import { saveDashboardToBackend, fetchDashboardById } from "../services/dashboardSave"
import { v4 as uuidv4 } from 'uuid'

const { Header, Content } = Layout
const ResponsiveGridLayout = WidthProvider(Responsive)

const DashboardEditor = () => {
  const { theme, isDarkMode } = useTheme()
  const { id } = useParams()
  const navigate = useNavigate()
  const [isWidgetLibraryVisible, setIsWidgetLibraryVisible] = useState(false)
  const [isTimeWindowVisible, setIsTimeWindowVisible] = useState(false)
  const [isSettingsVisible, setIsSettingsVisible] = useState(false)
  const [selectedWidget, setSelectedWidget] = useState(null)
  const [widgets, setWidgets] = useState([])
  const [layouts, setLayouts] = useState({ lg: [], md: [], sm: [], xs: [] })
  const [isLayoutsModalVisible, setIsLayoutsModalVisible] = useState(false)
  const [isStatesModalVisible, setIsStatesModalVisible] = useState(false)
  const [isAliasesModalVisible, setIsAliasesModalVisible] = useState(false)
  const [dashboardTitle, setDashboardTitle] = useState("New Dashboard")
  const [dashboardSettings, setDashboardSettings] = useState({
    timewindow: { realtime: { timewindowMs: 60000 }, aggregation: { type: "AVG", limit: 200 } },
    gridSettings: { backgroundColor: "#ffffff", columns: 24, margin: [10, 10], backgroundImage: null },
  })
  const [isImportModalVisible, setIsImportModalVisible] = useState(false)
  const [isAssignCustomerModalVisible, setIsAssignCustomerModalVisible] = useState(false)
  const [isWidgetConfigModalVisible, setIsWidgetConfigModalVisible] = useState(false)
  const [timeWindow, setTimeWindow] = useState({
    displayValue: "Last 15 minutes", value: "15_minutes", type: "REALTIME",
  })
  const [form] = Form.useForm()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isTablet = useMediaQuery("(max-width: 992px)")
  const [feedback, setFeedback] = useState({ type: "", text: "" })
  const [fetchError, setFetchError] = useState(false)

  const [devices] = useState([
    { id: "device1", name: "Rack Board" },
    { id: "device2", name: "Pressure Valve" },
    { id: "device3", name: "Power Meter" },
  ])
  const [customers] = useState([
    { id: "customer1", name: "Demo Customer" },
    { id: "customer2", name: "Device Claiming Customer" },
    { id: "customer3", name: "Customer A" },
  ])
  const [assignedCustomers, setAssignedCustomers] = useState([])

  useEffect(() => {
    if (id && id !== "new") fetchDashboard(id)
    else {
      setDashboardTitle("New Dashboard")
      setWidgets([])
      setLayouts({ lg: [], md: [], sm: [], xs: [] })
    }
    // eslint-disable-next-line
  }, [id])

  function showFeedback(type, text, timeout = 3200) {
    setFeedback({ type, text })
    if (timeout) setTimeout(() => setFeedback({ type: "", text: "" }), timeout)
  }

  const fetchDashboard = async (dashboardId) => {
    try {
      const dashboard = await fetchDashboardById(dashboardId)
      setDashboardTitle(dashboard.title || "Untitled")
      setWidgets(Array.isArray(dashboard.widgets)
        ? dashboard.widgets
        : JSON.parse(dashboard.widgets || "[]"))
      setLayouts(typeof dashboard.layouts === "object"
        ? dashboard.layouts
        : JSON.parse(dashboard.layouts || "{}"))
      setDashboardSettings(typeof dashboard.settings === "object"
        ? dashboard.settings
        : JSON.parse(dashboard.settings || "{}"))
      setAssignedCustomers(dashboard.assignedCustomers || [])
      setTimeWindow(typeof dashboard.timewindow === "object"
        ? dashboard.timewindow
        : JSON.parse(dashboard.timewindow || "{}"))
      setFetchError(false)
    } catch (error) {
      setDashboardTitle("New Dashboard")
      setWidgets([])
      setLayouts({ lg: [], md: [], sm: [], xs: [] })
      setDashboardSettings({
        timewindow: { realtime: { timewindowMs: 60000 }, aggregation: { type: "AVG", limit: 200 } },
        gridSettings: { backgroundColor: "#ffffff", columns: 24, margin: [10, 10], backgroundImage: null },
      })
      setAssignedCustomers([])
      showFeedback("error", "Unable to load dashboard. Please check your connection or dashboard ID.")
      setFetchError(true)
    }
  }

  const handleAssignCustomers = () => setIsAssignCustomerModalVisible(true)
  const handleExport = () => {
    const dashboardState = {
      id: id && id !== "new" ? id : uuidv4(),
      title: dashboardTitle,
      widgets,
      layouts,
      settings: dashboardSettings,
      assignedCustomers,
      timeWindow,
      version: "1.0.0",
      createdTime: new Date().toISOString(),
    }
    const dashboardJson = JSON.stringify(dashboardState, null, 2)
    const blob = new Blob([dashboardJson], { type: "application/json" })
    saveAs(blob, `${dashboardTitle.replace(/\s+/g, "_").toLowerCase()}_dashboard.json`)
    showFeedback("success", "Dashboard exported successfully")
  }
  const handleCancel = () => navigate("/dashboards")
  const handleSave = async () => {
    if (fetchError) {
      showFeedback("error", "Cannot save. There was a problem loading the dashboard.");
      return;
    }
    const dashboardState = {
      id,
      title: dashboardTitle,
      widgets,
      layouts,
      settings: dashboardSettings,
      assignedCustomers,
      timewindow: timeWindow,
      version: "1.0.0",
    }
    try {
      await saveDashboardToBackend({
        dashboardJson: JSON.stringify(dashboardState, null, 2),
        dashboardId: id,
      })
      showFeedback("success", "Dashboard saved to backend")
    } catch (err) {
      showFeedback("error", "Failed to save dashboard: " + (err.message || err))
    }
  }
  const handleTimeWindowChange = (newTimeWindow) => {
    setTimeWindow(newTimeWindow)
    setIsTimeWindowVisible(false)
    showFeedback("info", `Time window changed to: ${newTimeWindow.displayValue}`)
  }
  const handleLayoutChange = (layout, allLayouts) => setLayouts(allLayouts)
  const handleWidgetSettings = (widget) => { setSelectedWidget(widget); setIsWidgetConfigModalVisible(true) }
  const handleDuplicateWidget = (widget) => {
    const newWidgetId = uuidv4()
    const newWidget = {
      ...widget,
      id: newWidgetId,
      title: `${widget.title} (Copy)`,
      config: { ...widget.config },
    }
    setWidgets([...widgets, newWidget])
    const originalLayout = layouts.lg.find((item) => item.i === widget.id)
    if (originalLayout) {
      const newLayout = {
        ...originalLayout,
        i: newWidgetId,
        x: (originalLayout.x + 1) % 12,
        y: originalLayout.y + 1,
      }
      setLayouts({
        lg: [...layouts.lg, newLayout],
        md: [...layouts.md, { ...newLayout, w: Math.min(newLayout.w, 8) }],
        sm: [...layouts.sm, { ...newLayout, w: Math.min(newLayout.w * 2, 12), x: 0 }],
        xs: [...layouts.xs, { ...newLayout, w: 12, x: 0 }],
      })
    }
    showFeedback("success", "Widget duplicated")
  }
  const handleDeleteWidget = (widgetId) => {
    Modal.confirm({
      title: "Are you sure you want to delete this widget?",
      content: "This action cannot be undone.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        setWidgets(widgets.filter((w) => w.id !== widgetId))
        setLayouts({
          lg: layouts.lg.filter((item) => item.i !== widgetId),
          md: layouts.md.filter((item) => item.i !== widgetId),
          sm: layouts.sm.filter((item) => item.i !== widgetId),
          xs: layouts.xs.filter((item) => item.i !== widgetId),
        })
        showFeedback("success", "Widget deleted")
      },
    })
  }
  const handleWidgetConfigChange = (widgetId, newConfig) => {
    setWidgets(prev =>
      prev.map(w =>
        w.id === widgetId ? { ...w, config: newConfig } : w
      )
    )
    showFeedback("success", "Widget configuration updated")
  }
  const handleAddWidget = (widget) => {
    const widgetId = uuidv4()
    const newWidget = {
      ...widget,
      id: widgetId,
      config: {
        title: widget.title,
        dataSource: {
          type: "device",
          deviceId: null,
          telemetry: [],
        },
        ...(widget.type.includes("chart")
          ? { height: 300, showLegend: true, showPoints: true }
          : {}),
        ...(widget.type.includes("map")
          ? { zoom: 4, center: { lat: 37.7749, lng: -122.4194 } }
          : {}),
      },
    }
    setWidgets([...widgets, newWidget])

    const cols = 12
    const getNextPosition = (layoutArr) => {
      if (!layoutArr || !layoutArr.length) return { x: 0, y: 0 }
      const maxY = Math.max(...layoutArr.map(item => item.y + item.h))
      const taken = layoutArr.filter(item => item.y === 0)
      let freeX = 0
      while (taken.some(item => item.x <= freeX && freeX < item.x + item.w)) {
        freeX++
      }
      if (freeX + 4 <= cols) return { x: freeX, y: 0 }
      return { x: 0, y: maxY }
    }

    const lgArr = Array.isArray(layouts.lg) ? layouts.lg : []
    const mdArr = Array.isArray(layouts.md) ? layouts.md : []
    const smArr = Array.isArray(layouts.sm) ? layouts.sm : []
    const xsArr = Array.isArray(layouts.xs) ? layouts.xs : []

    const nextPosLg = getNextPosition(lgArr)
    const newLayout = {
      i: widgetId,
      x: nextPosLg.x,
      y: nextPosLg.y,
      w: 4,
      h: 4,
      minW: 2,
      minH: 2,
    }
    setLayouts({
      lg: [...lgArr, newLayout],
      md: [...mdArr, { ...newLayout, w: Math.min(newLayout.w, 8) }],
      sm: [...smArr, { ...newLayout, w: Math.min(newLayout.w * 2, 12), x: 0 }],
      xs: [...xsArr, { ...newLayout, w: 12, x: 0 }],
    })

    setIsWidgetLibraryVisible(false)
    setSelectedWidget(newWidget)
    setIsWidgetConfigModalVisible(true)
    showFeedback("success", "Widget added")
  }
  const handleWidgetConfigSave = (updatedWidget) => {
    setWidgets((prevWidgets) =>
      prevWidgets.map((w) => (w.id === updatedWidget.id ? { ...w, ...updatedWidget } : w))
    )
    setIsWidgetConfigModalVisible(false)
    showFeedback("success", "Widget configuration updated")
  }
  const handleImportDashboard = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const dashboardData = JSON.parse(e.target.result)
        if (!dashboardData.widgets || !dashboardData.layouts) throw new Error("Invalid dashboard file format")
        const normalizedWidgets = Array.isArray(dashboardData.widgets)
          ? dashboardData.widgets.map(normalizeWidget).filter(Boolean)
          : []
        setDashboardTitle(dashboardData.title || "Imported Dashboard")
        setWidgets(normalizedWidgets)
        setLayouts(dashboardData.layouts || { lg: [], md: [], sm: [], xs: [] })
        setDashboardSettings(dashboardData.settings || dashboardSettings)
        setAssignedCustomers(dashboardData.assignedCustomers || [])
        setTimeWindow(dashboardData.timewindow || timeWindow)
        setIsImportModalVisible(false)
        showFeedback("success", "Dashboard imported successfully")
      } catch (error) {
        showFeedback("error", "Failed to import dashboard. Invalid file format.")
      }
    }
    reader.readAsText(file)
  }
  const handleAssignCustomersSave = (selectedCustomers) => {
    setAssignedCustomers(selectedCustomers)
    setIsAssignCustomerModalVisible(false)
    showFeedback("success", "Dashboard assigned to customers")
  }

  function normalizeWidget(widget) {
    if (!widget) return null
    const config = widget.config || {}
    const dataSource = config.dataSource || {}
    let telemetry = dataSource.telemetry
    if (!Array.isArray(telemetry)) {
      if (typeof telemetry === "string" && telemetry.length > 0) {
        try { telemetry = [telemetry] } catch { telemetry = [] }
      } else {
        telemetry = []
      }
    }
    if (widget.type === "camera" && (!telemetry.length && dataSource.streamUrl)) {
      telemetry = [dataSource.streamUrl]
    }
    return {
      ...widget,
      config: {
        ...config,
        dataSource: {
          ...dataSource,
          telemetry
        }
      }
    }
  }

  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
  const cols = { lg: 12, md: 8, sm: 6, xs: 2, xxs: 1 }
  const rowHeight = isMobile ? 68 : 44
  const margin = isMobile ? [4, 4] : [8, 8]
  const containerPadding = isMobile ? [0, 0] : [0, 0]

  const renderFeedback = () => {
    if (!feedback.text) return null
    let icon, color, bg
    switch (feedback.type) {
      case "success":
        icon = <CheckCircleOutlined />
        color = "#389e0d"
        bg = "#e6ffed"
        break
      case "error":
        icon = <CloseCircleOutlined />
        color = "#cf1322"
        bg = "#fff1f0"
        break
      case "warning":
        icon = <WarningOutlined />
        color = "#d48806"
        bg = "#fffbe6"
        break
      case "info":
      default:
        icon = <InfoCircleOutlined />
        color = "#0958d9"
        bg = "#e6f4ff"
        break
    }
    return (
      <div
        style={{
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
        }}
      >
        {icon}
        <span>{feedback.text}</span>
      </div>
    )
  }
  
  const timeWindowMenu = (
    <Menu>
      <Menu.Item key="realtime_15_minutes" onClick={() => handleTimeWindowChange({ displayValue: "Last 15 minutes", value: "15_minutes", type: "REALTIME" })}>Last 15 minutes</Menu.Item>
      <Menu.Item key="realtime_30_minutes" onClick={() => handleTimeWindowChange({ displayValue: "Last 30 minutes", value: "30_minutes", type: "REALTIME" })}>Last 30 minutes</Menu.Item>
      <Menu.Item key="realtime_1_hour" onClick={() => handleTimeWindowChange({ displayValue: "Last 1 hour", value: "1_hour", type: "REALTIME" })}>Last 1 hour</Menu.Item>
      <Menu.Item key="realtime_6_hours" onClick={() => handleTimeWindowChange({ displayValue: "Last 6 hours", value: "6_hours", type: "REALTIME" })}>Last 6 hours</Menu.Item>
      <Menu.Item key="realtime_1_day" onClick={() => handleTimeWindowChange({ displayValue: "Last 1 day", value: "1_day", type: "REALTIME" })}>Last 1 day</Menu.Item>
      <Menu.Item key="custom" onClick={() => setIsTimeWindowVisible(true)}>Custom...</Menu.Item>
    </Menu>
  )
  
  return (
    <Layout className={`dashboard-layout${isDarkMode ? " dark-theme" : ""}`}>
      <Header className="dashboard-header">
        <Input
          className="dashboard-title-input"
          placeholder="Dashboard title"
          value={dashboardTitle}
          onChange={(e) => setDashboardTitle(e.target.value)}
        />
        <Space wrap={isMobile}>
          <Button icon={<PlusOutlined />} onClick={() => setIsWidgetLibraryVisible(true)}>{!isMobile && "Add widget"}</Button>
          <Dropdown overlay={timeWindowMenu} trigger={["click"]}>
            <Button icon={<ClockCircleOutlined />}>{!isMobile && timeWindow.displayValue} {isMobile && <DownOutlined />}</Button>
          </Dropdown>
          <Button icon={<SettingOutlined />} onClick={() => setIsSettingsVisible(true)}>{!isMobile && "Settings"}</Button>
          {!isMobile && (<>
            <Button icon={<LinkOutlined />} onClick={() => setIsAliasesModalVisible(true)}>Aliases</Button>
            <Button icon={<FilterOutlined />}>Filters</Button>
            <Button icon={<HistoryOutlined />}>Versions</Button>
          </>)}
          {!isTablet && (
            <Button icon={<TeamOutlined />} onClick={handleAssignCustomers}>Assign</Button>
          )}
          <Button icon={<UploadOutlined />} onClick={() => setIsImportModalVisible(true)}>{!isMobile && "Import"}</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>{!isMobile && "Export"}</Button>
          <Button icon={<CloseOutlined />} onClick={handleCancel}>{!isMobile && "Cancel"}</Button>
          <Button
            icon={<SaveOutlined />}
            type="primary"
            onClick={handleSave}
            disabled={fetchError}
          >
            {!isMobile && "Save"}
          </Button>
          {!isMobile && <Button icon={<FullscreenOutlined />} />}
        </Space>
      </Header>
      <Content className="dashboard-content">
        {/* Feedback Banner */}
        {renderFeedback()}

        <div className="dashboard-main-content">
          {widgets.length === 0 ? (
            <div className="dashboard-empty-state">
              <div className="dashboard-empty-icon">📊</div>
              <Typography.Title level={4}>No widgets added yet</Typography.Title>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsWidgetLibraryVisible(true)}
                className="dashboard-empty-add-btn"
              >
                Add your first widget
              </Button>
            </div>
          ) : (
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              breakpoints={breakpoints}
              cols={cols}
              rowHeight={rowHeight}
              margin={margin}
              containerPadding={containerPadding}
              autoSize={true}
              isDraggable={true}
              isResizable={true}
              draggableHandle=".widget-drag-handle"
              resizeHandles={['se', 'e', 's']}
              compactType={null}
              preventCollision={true}
              allowOverlap={false}
              useCSSTransforms={true}
              onLayoutChange={handleLayoutChange}
            >
              {widgets.map((widget) => (
                <div key={widget.id} className="widget-container">
                  <div className="widget-controls">
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); handleWidgetSettings(widget) }} />
                    <Button type="text" size="small" icon={<CopyOutlined />} onClick={(e) => { e.stopPropagation(); handleDuplicateWidget(widget) }} />
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); handleDeleteWidget(widget.id) }} />
                  </div>
                  <div className="widget-drag-handle">{widget.title}</div>
                  <div className="widget-body">
                    <WidgetRenderer
                      widget={widget}
                      config={{ ...widget.config, timeWindow: timeWindow }}
                      onConfigChange={handleWidgetConfigChange}
                    />
                  </div>
                </div>
              ))}
            </ResponsiveGridLayout>
          )}
        </div>
      </Content>
      <WidgetLibrary
        visible={isWidgetLibraryVisible}
        onClose={() => setIsWidgetLibraryVisible(false)}
        onSelect={handleAddWidget}
      />
      <TimeWindowSettings
        visible={isTimeWindowVisible}
        onClose={() => setIsTimeWindowVisible(false)}
        onSave={handleTimeWindowChange}
        initialValue={timeWindow}
      />
      <DashboardSettings visible={isSettingsVisible} onClose={() => setIsSettingsVisible(false)} />
      <ManageLayoutsModal visible={isLayoutsModalVisible} onClose={() => setIsLayoutsModalVisible(false)} />
      <ManageStatesModal visible={isStatesModalVisible} onClose={() => setIsStatesModalVisible(false)} />
      <EntityAliasesModal visible={isAliasesModalVisible} onClose={() => setIsAliasesModalVisible(false)} />
      <WidgetConfigModal
        visible={isWidgetConfigModalVisible}
        onCancel={() => setIsWidgetConfigModalVisible(false)}
        onSave={handleWidgetConfigSave}
        widget={selectedWidget}
        devices={devices}
      />
      <Modal
        title="Import Dashboard"
        open={isImportModalVisible}
        onCancel={() => setIsImportModalVisible(false)}
        footer={null}
      >
        <div className="dashboard-import-modal">
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleImportDashboard(e.target.files[0])
              }
            }}
            className="dashboard-import-input"
          />
          <Typography.Paragraph>
            Select a dashboard JSON file to import. The file should contain a valid dashboard configuration.
          </Typography.Paragraph>
          <Typography.Text type="secondary">
            Note: Importing a dashboard will replace your current dashboard configuration.
          </Typography.Text>
        </div>
      </Modal>
      <Modal
        title="Assign Dashboard to Customers"
        open={isAssignCustomerModalVisible}
        onCancel={() => setIsAssignCustomerModalVisible(false)}
        onOk={() => {
          form.validateFields().then((values) => {
            handleAssignCustomersSave(values.customers)
          })
        }}
      >
        <Form form={form} layout="vertical" initialValues={{ customers: assignedCustomers }}>
          <Form.Item
            name="customers"
            label="Select Customers"
            rules={[{ required: false, message: "Please select at least one customer" }]}
          >
            <Select mode="multiple" placeholder="Select customers" style={{ width: "100%" }} optionLabelProp="label">
              {customers.map((customer) => (
                <Select.Option key={customer.id} value={customer.id} label={customer.name}>
                  {customer.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Typography.Paragraph>
            Assigned customers will be able to view this dashboard in their customer portal.
          </Typography.Paragraph>
        </Form>
      </Modal>
    </Layout>
  )
}

export default DashboardEditor


// "use client"

// import { useState, useEffect } from "react"
// import {
//   Layout, Button, Space, Input, Typography, Modal, Form, Select, Dropdown, Menu,
// } from "antd"
// import { useParams, useNavigate } from "react-router-dom"
// import {
//   PlusOutlined, ClockCircleOutlined, SettingOutlined, LinkOutlined, FilterOutlined,
//   HistoryOutlined, CloseOutlined, SaveOutlined, FullscreenOutlined, EditOutlined,
//   DeleteOutlined, CopyOutlined, DownloadOutlined, UploadOutlined, TeamOutlined, DownOutlined,
//   CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, InfoCircleOutlined,
// } from "@ant-design/icons"
// import { Responsive, WidthProvider } from "react-grid-layout"
// import { saveAs } from "file-saver"
// import "react-grid-layout/css/styles.css"
// import "react-resizable/css/styles.css"
// import "../styles/widget.css"

// import WidgetLibrary from "../components/dashboard/WidgetLibrary"
// import TimeWindowSettings from "../components/dashboard/TimeWindowSettings"
// import DashboardSettings from "../components/dashboard/DashboardSettings"
// import ManageLayoutsModal from "../components/dashboard/ManageLayoutsModal"
// import ManageStatesModal from "../components/dashboard/ManageStatesModal"
// import EntityAliasesModal from "../components/dashboard/EntityAliasesModal"
// import WidgetRenderer from "../components/dashboard/WidgetRenderer"
// import WidgetConfigModal from "../components/dashboard/WidgetConfigModal"
// import { useMediaQuery } from "../hooks/useMediaQuery"
// import { useTheme } from "../components/theme/ThemeProvider"
// import { saveDashboardToBackend, fetchDashboardById } from "../services/dashboardSave"

// import { v4 as uuidv4 } from 'uuid'

// const { Header, Content } = Layout
// const ResponsiveGridLayout = WidthProvider(Responsive)

// const DashboardEditor = () => {
//   const { theme, isDarkMode } = useTheme()
//   const { id } = useParams()
//   const navigate = useNavigate()
//   const [isWidgetLibraryVisible, setIsWidgetLibraryVisible] = useState(false)
//   const [isTimeWindowVisible, setIsTimeWindowVisible] = useState(false)
//   const [isSettingsVisible, setIsSettingsVisible] = useState(false)
//   const [selectedWidget, setSelectedWidget] = useState(null)
//   const [widgets, setWidgets] = useState([])
//   const [layouts, setLayouts] = useState({ lg: [], md: [], sm: [], xs: [] })
//   const [isLayoutsModalVisible, setIsLayoutsModalVisible] = useState(false)
//   const [isStatesModalVisible, setIsStatesModalVisible] = useState(false)
//   const [isAliasesModalVisible, setIsAliasesModalVisible] = useState(false)
//   const [dashboardTitle, setDashboardTitle] = useState("New Dashboard")
//   const [dashboardSettings, setDashboardSettings] = useState({
//     timewindow: { realtime: { timewindowMs: 60000 }, aggregation: { type: "AVG", limit: 200 } },
//     gridSettings: { backgroundColor: "#ffffff", columns: 24, margin: [10, 10], backgroundImage: null },
//   })
//   const [isImportModalVisible, setIsImportModalVisible] = useState(false)
//   const [isAssignCustomerModalVisible, setIsAssignCustomerModalVisible] = useState(false)
//   const [isWidgetConfigModalVisible, setIsWidgetConfigModalVisible] = useState(false)
//   const [timeWindow, setTimeWindow] = useState({
//     displayValue: "Last 15 minutes", value: "15_minutes", type: "REALTIME",
//   })
//   const [form] = Form.useForm()
//   const isMobile = useMediaQuery("(max-width: 768px)")
//   const isTablet = useMediaQuery("(max-width: 992px)")

//   // --- Feedback Banner State ---
//   const [feedback, setFeedback] = useState({ type: "", text: "" })
//   function showFeedback(type, text, timeout = 3200) {
//     setFeedback({ type, text })
//     if (timeout) setTimeout(() => setFeedback({ type: "", text: "" }), timeout)
//   }

//   const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
//   const cols = { lg: 12, md: 8, sm: 6, xs: 2, xxs: 1 }
//   const rowHeight = isMobile ? 68 : 44
//   const margin = isMobile ? [4, 4] : [8, 8]
//   const containerPadding = isMobile ? [0, 0] : [0, 0]
//   const [fetchError, setFetchError] = useState(false)

//   const [devices] = useState([
//     { id: "device1", name: "Rack Board" },
//     { id: "device2", name: "Pressure Valve" },
//     { id: "device3", name: "Power Meter" },
//   ])
//   const [customers] = useState([
//     { id: "customer1", name: "Demo Customer" },
//     { id: "customer2", name: "Device Claiming Customer" },
//     { id: "customer3", name: "Customer A" },
//   ])
//   const [assignedCustomers, setAssignedCustomers] = useState([])

//   useEffect(() => {
//     if (id && id !== "new") {
//       fetchDashboard(id)
//     } else {
//       setDashboardTitle("New Dashboard")
//       setWidgets([])
//       setLayouts({ lg: [], md: [], sm: [], xs: [] })
//     }
//   }, [id])

//   // const fetchDashboard = async (dashboardId) => {
//   //   try {
//   //     const dashboard = await fetchDashboards(dashboardId)
//   //     setDashboardTitle(dashboard.title || "Untitled")
//   //     setWidgets(Array.isArray(dashboard.widgets)
//   //       ? dashboard.widgets
//   //       : JSON.parse(dashboard.widgets || "[]"))
//   //     setLayouts(typeof dashboard.layouts === "object"
//   //       ? dashboard.layouts
//   //       : JSON.parse(dashboard.layouts || "{}"))
//   //     setDashboardSettings(typeof dashboard.settings === "object"
//   //       ? dashboard.settings
//   //       : JSON.parse(dashboard.settings || "{}"))
//   //     setAssignedCustomers(dashboard.assignedCustomers || [])
//   //     setTimeWindow(typeof dashboard.timewindow === "object"
//   //       ? dashboard.timewindow
//   //       : JSON.parse(dashboard.timewindow || "{}"))
//   //   } catch (error) {
//   //     setDashboardTitle("New Dashboard")
//   //     setWidgets([])
//   //     setLayouts({ lg: [], md: [], sm: [], xs: [] })
//   //     setDashboardSettings({
//   //       timewindow: { realtime: { timewindowMs: 60000 }, aggregation: { type: "AVG", limit: 200 } },
//   //       gridSettings: { backgroundColor: "#ffffff", columns: 24, margin: [10, 10], backgroundImage: null },
//   //     })
//   //     setAssignedCustomers([])
//   //     showFeedback("warning", "Unable to load dashboard. Starting empty.")
//   //   }
//   // }
//   const fetchDashboard = async (dashboardId) => {
//     try {
//       const dashboard = await fetchDashboardById(dashboardId)
//       setDashboardTitle(dashboard.title || "Untitled")
//       setWidgets(Array.isArray(dashboard.widgets)
//         ? dashboard.widgets
//         : JSON.parse(dashboard.widgets || "[]"))
//       setLayouts(typeof dashboard.layouts === "object"
//         ? dashboard.layouts
//         : JSON.parse(dashboard.layouts || "{}"))
//       setDashboardSettings(typeof dashboard.settings === "object"
//         ? dashboard.settings
//         : JSON.parse(dashboard.settings || "{}"))
//       setAssignedCustomers(dashboard.assignedCustomers || [])
//       setTimeWindow(typeof dashboard.timewindow === "object"
//         ? dashboard.timewindow
//         : JSON.parse(dashboard.timewindow || "{}"))
//       setFetchError(false)
//     } catch (error) {
//       setDashboardTitle("New Dashboard")
//       setWidgets([])
//       setLayouts({ lg: [], md: [], sm: [], xs: [] })
//       setDashboardSettings({
//         timewindow: { realtime: { timewindowMs: 60000 }, aggregation: { type: "AVG", limit: 200 } },
//         gridSettings: { backgroundColor: "#ffffff", columns: 24, margin: [10, 10], backgroundImage: null },
//       })
//       setAssignedCustomers([])
//       showFeedback("error", "Unable to load dashboard. Please check your connection or dashboard ID.")
//       setFetchError(true)
//     }
//   }


//   // --- Widget Add Handler with Defensive Arrays ---
//   const handleAddWidget = (widget) => {
//     const widgetId = uuidv4()
//     const newWidget = {
//       ...widget,
//       id: widgetId,
//       config: {
//         title: widget.title,
//         dataSource: {
//           type: "device",
//           deviceId: null,
//           telemetry: [],
//         },
//         ...(widget.type.includes("chart")
//           ? { height: 300, showLegend: true, showPoints: true }
//           : {}),
//         ...(widget.type.includes("map")
//           ? { zoom: 4, center: { lat: 37.7749, lng: -122.4194 } }
//           : {}),
//       },
//     }
//     setWidgets([...widgets, newWidget])

//     const cols = 12
//     const getNextPosition = (layoutArr) => {
//       if (!layoutArr || !layoutArr.length) return { x: 0, y: 0 }
//       const maxY = Math.max(...layoutArr.map(item => item.y + item.h))
//       const taken = layoutArr.filter(item => item.y === 0)
//       let freeX = 0
//       while (taken.some(item => item.x <= freeX && freeX < item.x + item.w)) {
//         freeX++
//       }
//       if (freeX + 4 <= cols) return { x: freeX, y: 0 }
//       return { x: 0, y: maxY }
//     }

//     const lgArr = Array.isArray(layouts.lg) ? layouts.lg : []
//     const mdArr = Array.isArray(layouts.md) ? layouts.md : []
//     const smArr = Array.isArray(layouts.sm) ? layouts.sm : []
//     const xsArr = Array.isArray(layouts.xs) ? layouts.xs : []

//     const nextPosLg = getNextPosition(lgArr)
//     const newLayout = {
//       i: widgetId,
//       x: nextPosLg.x,
//       y: nextPosLg.y,
//       w: 4,
//       h: 4,
//       minW: 2,
//       minH: 2,
//     }
//     setLayouts({
//       lg: [...lgArr, newLayout],
//       md: [...mdArr, { ...newLayout, w: Math.min(newLayout.w, 8) }],
//       sm: [...smArr, { ...newLayout, w: Math.min(newLayout.w * 2, 12), x: 0 }],
//       xs: [...xsArr, { ...newLayout, w: 12, x: 0 }],
//     })

//     setIsWidgetLibraryVisible(false)
//     setSelectedWidget(newWidget)
//     setIsWidgetConfigModalVisible(true)
//     showFeedback("success", "Widget added")
//   }

//   const handleWidgetSettings = (widget) => {
//     setSelectedWidget(widget)
//     setIsWidgetConfigModalVisible(true)
//   }

//   const handleWidgetConfigSave = (updatedWidget) => {
//     setWidgets((prevWidgets) =>
//       prevWidgets.map((w) => (w.id === updatedWidget.id ? { ...w, ...updatedWidget } : w))
//     )
//     setIsWidgetConfigModalVisible(false)
//     showFeedback("success", "Widget configuration updated")
//   }

//   const handleDeleteWidget = (widgetId) => {
//     Modal.confirm({
//       title: "Are you sure you want to delete this widget?",
//       content: "This action cannot be undone.",
//       okText: "Yes",
//       okType: "danger",
//       cancelText: "No",
//       onOk() {
//         setWidgets(widgets.filter((w) => w.id !== widgetId))
//         setLayouts({
//           lg: layouts.lg.filter((item) => item.i !== widgetId),
//           md: layouts.md.filter((item) => item.i !== widgetId),
//           sm: layouts.sm.filter((item) => item.i !== widgetId),
//           xs: layouts.xs.filter((item) => item.i !== widgetId),
//         })
//         showFeedback("success", "Widget deleted")
//       },
//     })
//   }

//   const handleDuplicateWidget = (widget) => {
//     const newWidgetId = uuidv4()
//     const newWidget = {
//       ...widget,
//       id: newWidgetId,
//       title: `${widget.title} (Copy)`,
//       config: { ...widget.config },
//     }
//     setWidgets([...widgets, newWidget])
//     const originalLayout = layouts.lg.find((item) => item.i === widget.id)
//     if (originalLayout) {
//       const newLayout = {
//         ...originalLayout,
//         i: newWidgetId,
//         x: (originalLayout.x + 1) % 12,
//         y: originalLayout.y + 1,
//       }
//       setLayouts({
//         lg: [...layouts.lg, newLayout],
//         md: [...layouts.md, { ...newLayout, w: Math.min(newLayout.w, 8) }],
//         sm: [...layouts.sm, { ...newLayout, w: Math.min(newLayout.w * 2, 12), x: 0 }],
//         xs: [...layouts.xs, { ...newLayout, w: 12, x: 0 }],
//       })
//     }
//     showFeedback("success", "Widget duplicated")
//   }

//   const handleLayoutChange = (layout, allLayouts) => {
//     setLayouts(allLayouts)
//   }

//   const handleTimeWindowChange = (newTimeWindow) => {
//     setTimeWindow(newTimeWindow)
//     setIsTimeWindowVisible(false)
//     showFeedback("info", `Time window changed to: ${newTimeWindow.displayValue}`)
//   }

//   const handleAssignCustomers = () => {
//     setIsAssignCustomerModalVisible(true)
//   }
//   const handleAssignCustomersSave = (selectedCustomers) => {
//     setAssignedCustomers(selectedCustomers)
//     setIsAssignCustomerModalVisible(false)
//     showFeedback("success", "Dashboard assigned to customers")
//   }

//   // const handleSave = async () => {
//   //   const dashboardState = {
//   //     id,
//   //     title: dashboardTitle,
//   //     widgets,
//   //     layouts,
//   //     settings: dashboardSettings,
//   //     assignedCustomers,
//   //     timewindow: timeWindow,
//   //     version: "1.0.0",
//   //   }
//   //   try {
//   //     await saveDashboardToBackend({
//   //       dashboardJson: JSON.stringify(dashboardState, null, 2),
//   //       dashboardId: id,
//   //     })
//   //     showFeedback("success", "Dashboard saved to backend")
//   //   } catch (err) {
//   //     showFeedback("error", "Failed to save dashboard: " + (err.message || err))
//   //   }
//   // }
//   const handleSave = async () => {
//     if (fetchError) {
//       showFeedback("error", "Cannot save. There was a problem loading the dashboard.");
//       return;
//     }
//     const dashboardState = {
//       id,
//       title: dashboardTitle,
//       widgets,
//       layouts,
//       settings: dashboardSettings,
//       assignedCustomers,
//       timewindow: timeWindow,
//       version: "1.0.0",
//     }
//     try {
//       await saveDashboardToBackend({
//         dashboardJson: JSON.stringify(dashboardState, null, 2),
//         dashboardId: id,
//       })
//       showFeedback("success", "Dashboard saved to backend")
//     } catch (err) {
//       showFeedback("error", "Failed to save dashboard: " + (err.message || err))
//     }
//   }

//   const handleExport = () => {
//     const dashboardState = {
//       id: id && id !== "new" ? id : uuidv4(),
//       title: dashboardTitle,
//       widgets,
//       layouts,
//       settings: dashboardSettings,
//       assignedCustomers,
//       timeWindow,
//       version: "1.0.0",
//       createdTime: new Date().toISOString(),
//     }
//     const dashboardJson = JSON.stringify(dashboardState, null, 2)
//     const blob = new Blob([dashboardJson], { type: "application/json" })
//     saveAs(blob, `${dashboardTitle.replace(/\s+/g, "_").toLowerCase()}_dashboard.json`)
//     showFeedback("success", "Dashboard exported successfully")
//   }

//   function normalizeWidget(widget) {
//     if (!widget) return null
//     const config = widget.config || {}
//     const dataSource = config.dataSource || {}
//     let telemetry = dataSource.telemetry
//     if (!Array.isArray(telemetry)) {
//       if (typeof telemetry === "string" && telemetry.length > 0) {
//         try { telemetry = [telemetry] } catch { telemetry = [] }
//       } else {
//         telemetry = []
//       }
//     }
//     if (widget.type === "camera" && (!telemetry.length && dataSource.streamUrl)) {
//       telemetry = [dataSource.streamUrl]
//     }
//     return {
//       ...widget,
//       config: {
//         ...config,
//         dataSource: {
//           ...dataSource,
//           telemetry
//         }
//       }
//     }
//   }

//   const handleImportDashboard = (file) => {
//     const reader = new FileReader()
//     reader.onload = (e) => {
//       try {
//         const dashboardData = JSON.parse(e.target.result)
//         if (!dashboardData.widgets || !dashboardData.layouts) throw new Error("Invalid dashboard file format")
//         const normalizedWidgets = Array.isArray(dashboardData.widgets)
//           ? dashboardData.widgets.map(normalizeWidget).filter(Boolean)
//           : []
//         setDashboardTitle(dashboardData.title || "Imported Dashboard")
//         setWidgets(normalizedWidgets)
//         setLayouts(dashboardData.layouts || { lg: [], md: [], sm: [], xs: [] })
//         setDashboardSettings(dashboardData.settings || dashboardSettings)
//         setAssignedCustomers(dashboardData.assignedCustomers || [])
//         setTimeWindow(dashboardData.timewindow || timeWindow)
//         setIsImportModalVisible(false)
//         showFeedback("success", "Dashboard imported successfully")
//       } catch (error) {
//         showFeedback("error", "Failed to import dashboard. Invalid file format.")
//       }
//     }
//     reader.readAsText(file)
//   }

//   const handleCancel = () => {
//     navigate("/dashboards")
//   }

//   const handleWidgetConfigChange = (widgetId, newConfig) => {
//     setWidgets(prev =>
//       prev.map(w =>
//         w.id === widgetId ? { ...w, config: newConfig } : w
//       )
//     )
//     showFeedback("success", "Widget configuration updated")
//   }

//   const timeWindowMenu = (
//     <Menu>
//       <Menu.Item key="realtime_15_minutes" onClick={() => handleTimeWindowChange({ displayValue: "Last 15 minutes", value: "15_minutes", type: "REALTIME" })}>Last 15 minutes</Menu.Item>
//       <Menu.Item key="realtime_30_minutes" onClick={() => handleTimeWindowChange({ displayValue: "Last 30 minutes", value: "30_minutes", type: "REALTIME" })}>Last 30 minutes</Menu.Item>
//       <Menu.Item key="realtime_1_hour" onClick={() => handleTimeWindowChange({ displayValue: "Last 1 hour", value: "1_hour", type: "REALTIME" })}>Last 1 hour</Menu.Item>
//       <Menu.Item key="realtime_6_hours" onClick={() => handleTimeWindowChange({ displayValue: "Last 6 hours", value: "6_hours", type: "REALTIME" })}>Last 6 hours</Menu.Item>
//       <Menu.Item key="realtime_1_day" onClick={() => handleTimeWindowChange({ displayValue: "Last 1 day", value: "1_day", type: "REALTIME" })}>Last 1 day</Menu.Item>
//       <Menu.Item key="custom" onClick={() => setIsTimeWindowVisible(true)}>Custom...</Menu.Item>
//     </Menu>
//   )

//   // --- FEEDBACK BANNER UI ---
//   const renderFeedback = () => {
//     if (!feedback.text) return null
//     let icon, color, bg
//     switch (feedback.type) {
//       case "success":
//         icon = <CheckCircleOutlined />
//         color = "#389e0d"
//         bg = "#e6ffed"
//         break
//       case "error":
//         icon = <CloseCircleOutlined />
//         color = "#cf1322"
//         bg = "#fff1f0"
//         break
//       case "warning":
//         icon = <WarningOutlined />
//         color = "#d48806"
//         bg = "#fffbe6"
//         break
//       case "info":
//       default:
//         icon = <InfoCircleOutlined />
//         color = "#0958d9"
//         bg = "#e6f4ff"
//         break
//     }
//     return (
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           padding: "9px 18px",
//           marginBottom: 10,
//           borderRadius: 7,
//           background: bg,
//           color: color,
//           fontWeight: 500,
//           fontSize: 16,
//           gap: 8,
//         }}
//       >
//         {icon}
//         <span>{feedback.text}</span>
//       </div>
//     )
//   }

//   return (
//     <Layout className={`dashboard-layout${isDarkMode ? " dark-theme" : ""}`}>
//       <Header className="dashboard-header">
//         <Input
//           className="dashboard-title-input"
//           placeholder="Dashboard title"
//           value={dashboardTitle}
//           onChange={(e) => setDashboardTitle(e.target.value)}
//         />
//         <Space wrap={isMobile}>
//           <Button icon={<PlusOutlined />} onClick={() => setIsWidgetLibraryVisible(true)}>{!isMobile && "Add widget"}</Button>
//           <Dropdown overlay={timeWindowMenu} trigger={["click"]}>
//             <Button icon={<ClockCircleOutlined />}>{!isMobile && timeWindow.displayValue} {isMobile && <DownOutlined />}</Button>
//           </Dropdown>
//           <Button icon={<SettingOutlined />} onClick={() => setIsSettingsVisible(true)}>{!isMobile && "Settings"}</Button>
//           {!isMobile && (<>
//             <Button icon={<LinkOutlined />} onClick={() => setIsAliasesModalVisible(true)}>Aliases</Button>
//             <Button icon={<FilterOutlined />}>Filters</Button>
//             <Button icon={<HistoryOutlined />}>Versions</Button>
//           </>)}
//           {!isTablet && (
//             <Button icon={<TeamOutlined />} onClick={handleAssignCustomers}>Assign</Button>
//           )}
//           <Button icon={<UploadOutlined />} onClick={() => setIsImportModalVisible(true)}>{!isMobile && "Import"}</Button>
//           <Button icon={<DownloadOutlined />} onClick={handleExport}>{!isMobile && "Export"}</Button>
//           <Button icon={<CloseOutlined />} onClick={handleCancel}>{!isMobile && "Cancel"}</Button>
//           <Button
//             icon={<SaveOutlined />}
//             type="primary"
//             onClick={handleSave}
//             disabled={fetchError}
//           >
//             {!isMobile && "Save"}
//           </Button>

//           {!isMobile && <Button icon={<FullscreenOutlined />} />}
//         </Space>
//       </Header>
//       <Content className="dashboard-content">
//         {/* Feedback Banner */}
//         {renderFeedback()}

//         <div className="dashboard-main-content">
//           {widgets.length === 0 ? (
//             <div className="dashboard-empty-state">
//               <div className="dashboard-empty-icon">📊</div>
//               <Typography.Title level={4}>No widgets added yet</Typography.Title>
//               <Button
//                 type="primary"
//                 icon={<PlusOutlined />}
//                 onClick={() => setIsWidgetLibraryVisible(true)}
//                 className="dashboard-empty-add-btn"
//               >
//                 Add your first widget
//               </Button>
//             </div>
//           ) : (
//             <ResponsiveGridLayout
//               className="layout"
//               layouts={layouts}
//               breakpoints={breakpoints}
//               cols={cols}
//               rowHeight={rowHeight}
//               margin={margin}
//               containerPadding={containerPadding}
//               autoSize={true}
//               isDraggable={true}
//               isResizable={true}
//               draggableHandle=".widget-drag-handle"
//               resizeHandles={['se', 'e', 's']}
//               compactType={null}
//               preventCollision={true}
//               allowOverlap={false}
//               useCSSTransforms={true}
//               onLayoutChange={handleLayoutChange}
//             >
//               {widgets.map((widget) => (
//                 <div key={widget.id} className="widget-container">
//                   <div className="widget-controls">
//                     <Button type="text" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); handleWidgetSettings(widget) }} />
//                     <Button type="text" size="small" icon={<CopyOutlined />} onClick={(e) => { e.stopPropagation(); handleDuplicateWidget(widget) }} />
//                     <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); handleDeleteWidget(widget.id) }} />
//                   </div>
//                   <div className="widget-drag-handle">{widget.title}</div>
//                   <div className="widget-body">
//                     <WidgetRenderer
//                       widget={widget}
//                       config={{ ...widget.config, timeWindow: timeWindow }}
//                       onConfigChange={handleWidgetConfigChange}
//                     />
//                   </div>
//                 </div>
//               ))}
//             </ResponsiveGridLayout>
//           )}
//         </div>
//       </Content>
//       <WidgetLibrary
//         visible={isWidgetLibraryVisible}
//         onClose={() => setIsWidgetLibraryVisible(false)}
//         onSelect={handleAddWidget}
//       />
//       <TimeWindowSettings
//         visible={isTimeWindowVisible}
//         onClose={() => setIsTimeWindowVisible(false)}
//         onSave={handleTimeWindowChange}
//         initialValue={timeWindow}
//       />
//       <DashboardSettings visible={isSettingsVisible} onClose={() => setIsSettingsVisible(false)} />
//       <ManageLayoutsModal visible={isLayoutsModalVisible} onClose={() => setIsLayoutsModalVisible(false)} />
//       <ManageStatesModal visible={isStatesModalVisible} onClose={() => setIsStatesModalVisible(false)} />
//       <EntityAliasesModal visible={isAliasesModalVisible} onClose={() => setIsAliasesModalVisible(false)} />
//       <WidgetConfigModal
//         visible={isWidgetConfigModalVisible}
//         onCancel={() => setIsWidgetConfigModalVisible(false)}
//         onSave={handleWidgetConfigSave}
//         widget={selectedWidget}
//         devices={devices}
//       />
//       <Modal
//         title="Import Dashboard"
//         open={isImportModalVisible}
//         onCancel={() => setIsImportModalVisible(false)}
//         footer={null}
//       >
//         <div className="dashboard-import-modal">
//           <input
//             type="file"
//             accept=".json"
//             onChange={(e) => {
//               if (e.target.files && e.target.files[0]) {
//                 handleImportDashboard(e.target.files[0])
//               }
//             }}
//             className="dashboard-import-input"
//           />
//           <Typography.Paragraph>
//             Select a dashboard JSON file to import. The file should contain a valid dashboard configuration.
//           </Typography.Paragraph>
//           <Typography.Text type="secondary">
//             Note: Importing a dashboard will replace your current dashboard configuration.
//           </Typography.Text>
//         </div>
//       </Modal>
//       <Modal
//         title="Assign Dashboard to Customers"
//         open={isAssignCustomerModalVisible}
//         onCancel={() => setIsAssignCustomerModalVisible(false)}
//         onOk={() => {
//           form.validateFields().then((values) => {
//             handleAssignCustomersSave(values.customers)
//           })
//         }}
//       >
//         <Form form={form} layout="vertical" initialValues={{ customers: assignedCustomers }}>
//           <Form.Item
//             name="customers"
//             label="Select Customers"
//             rules={[{ required: false, message: "Please select at least one customer" }]}
//           >
//             <Select mode="multiple" placeholder="Select customers" style={{ width: "100%" }} optionLabelProp="label">
//               {customers.map((customer) => (
//                 <Select.Option key={customer.id} value={customer.id} label={customer.name}>
//                   {customer.name}
//                 </Select.Option>
//               ))}
//             </Select>
//           </Form.Item>
//           <Typography.Paragraph>
//             Assigned customers will be able to view this dashboard in their customer portal.
//           </Typography.Paragraph>
//         </Form>
//       </Modal>
//     </Layout>
//   )
// }

// export default DashboardEditor

// "use client"

// import { useState, useEffect } from "react"
// import {
//   Layout, Button, Space, Input, Typography, message, Modal, Form, Select, Dropdown, Menu,
// } from "antd"
// import { useParams, useNavigate } from "react-router-dom"
// import {
//   PlusOutlined, ClockCircleOutlined, SettingOutlined, LinkOutlined, FilterOutlined,
//   HistoryOutlined, CloseOutlined, SaveOutlined, FullscreenOutlined, EditOutlined,
//   DeleteOutlined, CopyOutlined, DownloadOutlined, UploadOutlined, TeamOutlined, DownOutlined,
// } from "@ant-design/icons"
// import { Responsive, WidthProvider } from "react-grid-layout"
// import { saveAs } from "file-saver"
// import "react-grid-layout/css/styles.css"
// import "react-resizable/css/styles.css"
// import "../styles/widget.css"

// import WidgetLibrary from "../components/dashboard/WidgetLibrary"
// import TimeWindowSettings from "../components/dashboard/TimeWindowSettings"
// import DashboardSettings from "../components/dashboard/DashboardSettings"
// import ManageLayoutsModal from "../components/dashboard/ManageLayoutsModal"
// import ManageStatesModal from "../components/dashboard/ManageStatesModal"
// import EntityAliasesModal from "../components/dashboard/EntityAliasesModal"
// import WidgetRenderer from "../components/dashboard/WidgetRenderer"
// import WidgetConfigModal from "../components/dashboard/WidgetConfigModal"
// import { useMediaQuery } from "../hooks/useMediaQuery"
// import { useTheme } from "../components/theme/ThemeProvider"
// // import { getDashboard, createDashboard, updateDashboard } from "../services/api"
// import { saveDashboardToBackend, fetchDashboards} from "../services/dashboardSave"

// import { v4 as uuidv4 } from 'uuid'

// const { Header, Content } = Layout
// const ResponsiveGridLayout = WidthProvider(Responsive)

// const DashboardEditor = () => {
//   const { theme, isDarkMode } = useTheme()
//   const { id } = useParams()
//   const navigate = useNavigate()
//   const [isWidgetLibraryVisible, setIsWidgetLibraryVisible] = useState(false)
//   const [isTimeWindowVisible, setIsTimeWindowVisible] = useState(false)
//   const [isSettingsVisible, setIsSettingsVisible] = useState(false)
//   const [selectedWidget, setSelectedWidget] = useState(null)
//   const [widgets, setWidgets] = useState([])
//   const [layouts, setLayouts] = useState({ lg: [], md: [], sm: [], xs: [] })
//   const [isLayoutsModalVisible, setIsLayoutsModalVisible] = useState(false)
//   const [isStatesModalVisible, setIsStatesModalVisible] = useState(false)
//   const [isAliasesModalVisible, setIsAliasesModalVisible] = useState(false)
//   const [dashboardTitle, setDashboardTitle] = useState("New Dashboard")
//   const [dashboardSettings, setDashboardSettings] = useState({
//     timewindow: { realtime: { timewindowMs: 60000 }, aggregation: { type: "AVG", limit: 200 } },
//     gridSettings: { backgroundColor: "#ffffff", columns: 24, margin: [10, 10], backgroundImage: null },
//   })
//   const [isImportModalVisible, setIsImportModalVisible] = useState(false)
//   const [isAssignCustomerModalVisible, setIsAssignCustomerModalVisible] = useState(false)
//   const [isWidgetConfigModalVisible, setIsWidgetConfigModalVisible] = useState(false)
//   const [timeWindow, setTimeWindow] = useState({
//     displayValue: "Last 15 minutes", value: "15_minutes", type: "REALTIME",
//   })
//   const [form] = Form.useForm()
//   const isMobile = useMediaQuery("(max-width: 768px)")
//   const isTablet = useMediaQuery("(max-width: 992px)")

//   const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
//   const cols = { lg: 12, md: 8, sm: 6, xs: 2, xxs: 1 }
  
//   const rowHeight = isMobile ? 68 : 44
//   const margin = isMobile ? [4, 4] : [8, 8]
//   const containerPadding = isMobile ? [0, 0] : [0, 0]
  
//   const [devices] = useState([
//     { id: "device1", name: "Rack Board" },
//     { id: "device2", name: "Pressure Valve" },
//     { id: "device3", name: "Power Meter" },
//   ])
//   const [customers] = useState([
//     { id: "customer1", name: "Demo Customer" },
//     { id: "customer2", name: "Device Claiming Customer" },
//     { id: "customer3", name: "Customer A" },
//   ])
//   const [assignedCustomers, setAssignedCustomers] = useState([])

//   useEffect(() => {
//     if (id && id !== "new") {
//       fetchDashboard(id)
//     } else {
//       setDashboardTitle("New Dashboard")
//       setWidgets([])
//       setLayouts({ lg: [], md: [], sm: [], xs: [] })
//     }
//   }, [id])

//   const fetchDashboard = async (dashboardId) => {
//     try {
//       const dashboard = await fetchDashboards(dashboardId)
//       setDashboardTitle(dashboard.title || "Untitled")
//       setWidgets(Array.isArray(dashboard.widgets)
//         ? dashboard.widgets
//         : JSON.parse(dashboard.widgets || "[]"))
//       setLayouts(typeof dashboard.layouts === "object"
//         ? dashboard.layouts
//         : JSON.parse(dashboard.layouts || "{}"))
//       setDashboardSettings(typeof dashboard.settings === "object"
//         ? dashboard.settings
//         : JSON.parse(dashboard.settings || "{}"))
//       setAssignedCustomers(dashboard.assignedCustomers || [])
//       setTimeWindow(typeof dashboard.timewindow === "object"
//         ? dashboard.timewindow
//         : JSON.parse(dashboard.timewindow || "{}"))
//     } catch (error) {
//       setDashboardTitle("New Dashboard")
//       setWidgets([])
//       setLayouts({ lg: [], md: [], sm: [], xs: [] })
//       setDashboardSettings({
//         timewindow: { realtime: { timewindowMs: 60000 }, aggregation: { type: "AVG", limit: 200 } },
//         gridSettings: { backgroundColor: "#ffffff", columns: 24, margin: [10, 10], backgroundImage: null },
//       })
//       setAssignedCustomers([])
//       message.warning("Unable to load dashboard. Starting empty.")
//     }
//   }

//   useEffect(() => {
//     console.log("[DashboardEditor] widgets updated:", widgets)
//   }, [widgets])

//   // const handleAddWidget = (widget) => {
//   //   const widgetId = uuidv4()
//   //   const newWidget = {
//   //     ...widget,
//   //     id: widgetId,
//   //     config: {
//   //       title: widget.title,
//   //       dataSource: {
//   //         type: "device",
//   //         deviceId: null,
//   //         telemetry: [],
//   //       },
//   //       ...(widget.type.includes("chart")
//   //         ? { height: 300, showLegend: true, showPoints: true }
//   //         : {}),
//   //       ...(widget.type.includes("map")
//   //         ? { zoom: 4, center: { lat: 37.7749, lng: -122.4194 } }
//   //         : {}),
//   //     },
//   //   }
//   //   console.log("[DashboardEditor] Adding widget:", newWidget)
//   //   setWidgets([...widgets, newWidget])

//   //   const cols = 12
//   //   const getNextPosition = (layoutArr) => {
//   //     if (!layoutArr.length) return { x: 0, y: 0 }
//   //     const maxY = Math.max(...layoutArr.map(item => item.y + item.h))
//   //     const taken = layoutArr.filter(item => item.y === 0)
//   //     let freeX = 0
//   //     while (taken.some(item => item.x <= freeX && freeX < item.x + item.w)) {
//   //       freeX++
//   //     }
//   //     if (freeX + 4 <= cols) return { x: freeX, y: 0 }
//   //     return { x: 0, y: maxY }
//   //   }

//   //   const nextPosLg = getNextPosition(layouts.lg)
//   //   const newLayout = {
//   //     i: widgetId,
//   //     x: nextPosLg.x,
//   //     y: nextPosLg.y,
//   //     w: 4,
//   //     h: 4,
//   //     minW: 2,
//   //     minH: 2,
//   //   }
//   //   setLayouts({
//   //     lg: [...layouts.lg, newLayout],
//   //     md: [...layouts.md, { ...newLayout, w: Math.min(newLayout.w, 8) }],
//   //     sm: [...layouts.sm, { ...newLayout, w: Math.min(newLayout.w * 2, 12), x: 0 }],
//   //     xs: [...layouts.xs, { ...newLayout, w: 12, x: 0 }],
//   //   })

//   //   setIsWidgetLibraryVisible(false)
//   //   setSelectedWidget(newWidget)
//   //   setIsWidgetConfigModalVisible(true)
//   // }
//   const handleAddWidget = (widget) => {
//     const widgetId = uuidv4()
//     const newWidget = {
//       ...widget,
//       id: widgetId,
//       config: {
//         title: widget.title,
//         dataSource: {
//           type: "device",
//           deviceId: null,
//           telemetry: [],
//         },
//         ...(widget.type.includes("chart")
//           ? { height: 300, showLegend: true, showPoints: true }
//           : {}),
//         ...(widget.type.includes("map")
//           ? { zoom: 4, center: { lat: 37.7749, lng: -122.4194 } }
//           : {}),
//       },
//     }
//     setWidgets([...widgets, newWidget])

//     const cols = 12
//     const getNextPosition = (layoutArr) => {
//       if (!layoutArr || !layoutArr.length) return { x: 0, y: 0 }
//       const maxY = Math.max(...layoutArr.map(item => item.y + item.h))
//       const taken = layoutArr.filter(item => item.y === 0)
//       let freeX = 0
//       while (taken.some(item => item.x <= freeX && freeX < item.x + item.w)) {
//         freeX++
//       }
//       if (freeX + 4 <= cols) return { x: freeX, y: 0 }
//       return { x: 0, y: maxY }
//     }

//     const lgArr = Array.isArray(layouts.lg) ? layouts.lg : []
//     const mdArr = Array.isArray(layouts.md) ? layouts.md : []
//     const smArr = Array.isArray(layouts.sm) ? layouts.sm : []
//     const xsArr = Array.isArray(layouts.xs) ? layouts.xs : []

//     const nextPosLg = getNextPosition(lgArr)
//     const newLayout = {
//       i: widgetId,
//       x: nextPosLg.x,
//       y: nextPosLg.y,
//       w: 4,
//       h: 4,
//       minW: 2,
//       minH: 2,
//     }
//     setLayouts({
//       lg: [...lgArr, newLayout],
//       md: [...mdArr, { ...newLayout, w: Math.min(newLayout.w, 8) }],
//       sm: [...smArr, { ...newLayout, w: Math.min(newLayout.w * 2, 12), x: 0 }],
//       xs: [...xsArr, { ...newLayout, w: 12, x: 0 }],
//     })

//     setIsWidgetLibraryVisible(false)
//     setSelectedWidget(newWidget)
//     setIsWidgetConfigModalVisible(true)
//   }

//   const handleWidgetSettings = (widget) => {
//     setSelectedWidget(widget)
//     setIsWidgetConfigModalVisible(true)
//   }

//   const handleWidgetConfigSave = (updatedWidget) => {
//     console.log("[DashboardEditor] handleWidgetConfigSave for", updatedWidget.id, "with:", updatedWidget)
//     setWidgets((prevWidgets) =>
//       prevWidgets.map((w) => (w.id === updatedWidget.id ? { ...w, ...updatedWidget } : w))
//     )
//     setIsWidgetConfigModalVisible(false)
//     message.success("Widget configuration updated")
//   }

//   const handleDeleteWidget = (widgetId) => {
//     Modal.confirm({
//       title: "Are you sure you want to delete this widget?",
//       content: "This action cannot be undone.",
//       okText: "Yes",
//       okType: "danger",
//       cancelText: "No",
//       onOk() {
//         setWidgets(widgets.filter((w) => w.id !== widgetId))
//         setLayouts({
//           lg: layouts.lg.filter((item) => item.i !== widgetId),
//           md: layouts.md.filter((item) => item.i !== widgetId),
//           sm: layouts.sm.filter((item) => item.i !== widgetId),
//           xs: layouts.xs.filter((item) => item.i !== widgetId),
//         })
//         message.success("Widget deleted")
//       },
//     })
//   }

//   const handleDuplicateWidget = (widget) => {
//     const newWidgetId = uuidv4()
//     const newWidget = {
//       ...widget,
//       id: newWidgetId,
//       title: `${widget.title} (Copy)`,
//       config: { ...widget.config },
//     }
//     setWidgets([...widgets, newWidget])
//     const originalLayout = layouts.lg.find((item) => item.i === widget.id)
//     if (originalLayout) {
//       const newLayout = {
//         ...originalLayout,
//         i: newWidgetId,
//         x: (originalLayout.x + 1) % 12,
//         y: originalLayout.y + 1,
//       }
//       setLayouts({
//         lg: [...layouts.lg, newLayout],
//         md: [...layouts.md, { ...newLayout, w: Math.min(newLayout.w, 8) }],
//         sm: [...layouts.sm, { ...newLayout, w: Math.min(newLayout.w * 2, 12), x: 0 }],
//         xs: [...layouts.xs, { ...newLayout, w: 12, x: 0 }],
//       })
//     }
//     message.success("Widget duplicated")
//   }

//   const handleLayoutChange = (layout, allLayouts) => {
//     setLayouts(allLayouts)
//   }

//   const handleTimeWindowChange = (newTimeWindow) => {
//     setTimeWindow(newTimeWindow)
//     setIsTimeWindowVisible(false)
//   }

//   const handleAssignCustomers = () => {
//     setIsAssignCustomerModalVisible(true)
//   }
//   const handleAssignCustomersSave = (selectedCustomers) => {
//     setAssignedCustomers(selectedCustomers)
//     setIsAssignCustomerModalVisible(false)
//     message.success("Dashboard assigned to customers")
//   }

//   // const handleSave = async () => {
//   //   const dashboardState = {
//   //     id: id && id !== "new" ? id : uuidv4(),
//   //     title: dashboardTitle,
//   //     widgets: JSON.stringify(widgets),
//   //     layouts: JSON.stringify(layouts),
//   //     settings: JSON.stringify(dashboardSettings),
//   //     assignedCustomers,
//   //     timewindow: JSON.stringify(timeWindow),
//   //     version: "1.0.0",
//   //   }

//   //   try {
//   //     let result
//   //     if (id && id !== "new") {
//   //       result = await updateDashboard(id, dashboardState)
//   //       message.success("Dashboard updated")
//   //     } else {
//   //       result = await createDashboard(dashboardState)
//   //       message.success("Dashboard created")
//   //       navigate(`/dashboards/${result.id}`)
//   //     }
//   //   } catch (err) {
//   //     console.error(err)
//   //     message.error("Failed to save dashboard")
//   //   }
//   // }

//   const handleSave = async () => {
//     // Always use the dashboard id from state/route
//     const dashboardState = {
//       id, // it's safe to always include it, even if backend ignores it for create
//       title: dashboardTitle,
//       widgets,
//       layouts,
//       settings: dashboardSettings,
//       assignedCustomers,
//       timewindow: timeWindow,
//       version: "1.0.0",
//     };

//     try {
//       const resp = await saveDashboardToBackend({
//         dashboardJson: JSON.stringify(dashboardState, null, 2),
//         dashboardId: id, // Always pass id from route/state
//       });

//       message.success("Dashboard saved to backend");
//       // No need for redirect—already on the correct page!
//     } catch (err) {
//       message.error("Failed to save dashboard: " + (err.message || err));
//     }
//   };

//   const handleExport = () => {
//     const dashboardState = {
//       id: id && id !== "new" ? id : uuidv4(),
//       title: dashboardTitle,
//       widgets,
//       layouts,
//       settings: dashboardSettings,
//       assignedCustomers,
//       timeWindow,
//       version: "1.0.0",
//       createdTime: new Date().toISOString(),
//     }

//     const dashboardJson = JSON.stringify(dashboardState, null, 2)
//     const blob = new Blob([dashboardJson], { type: "application/json" })
//     saveAs(blob, `${dashboardTitle.replace(/\s+/g, "_").toLowerCase()}_dashboard.json`)
//     message.success("Dashboard exported successfully")
//   }

//   function normalizeWidget(widget) {
//     if (!widget) return null;
//     const config = widget.config || {};
//     const dataSource = config.dataSource || {};
//     let telemetry = dataSource.telemetry;
//     if (!Array.isArray(telemetry)) {
//       if (typeof telemetry === "string" && telemetry.length > 0) {
//         try { telemetry = [telemetry]; } catch { telemetry = []; }
//       } else {
//         telemetry = [];
//       }
//     }
//     if (widget.type === "camera" && (!telemetry.length && dataSource.streamUrl)) {
//       telemetry = [dataSource.streamUrl];
//     }
//     // Logging for debugging every widget during normalization
//     console.log("[DashboardEditor] normalizeWidget", widget.type, widget.id, {
//       ...widget,
//       config: {
//         ...config,
//         dataSource: {
//           ...dataSource,
//           telemetry
//         }
//       }
//     });
//     return {
//       ...widget,
//       config: {
//         ...config,
//         dataSource: {
//           ...dataSource,
//           telemetry
//         }
//       }
//     }
//   }

//   const handleImportDashboard = (file) => {
//     const reader = new FileReader()
//     reader.onload = (e) => {
//       try {
//         const dashboardData = JSON.parse(e.target.result)
//         console.log("[DashboardEditor] Raw imported dashboardData:", dashboardData)
//         if (!dashboardData.widgets || !dashboardData.layouts) throw new Error("Invalid dashboard file format")
//         const normalizedWidgets = Array.isArray(dashboardData.widgets)
//           ? dashboardData.widgets.map(normalizeWidget).filter(Boolean)
//           : []
//         console.log("[DashboardEditor] Normalized widgets:", normalizedWidgets)
//         setDashboardTitle(dashboardData.title || "Imported Dashboard")
//         setWidgets(normalizedWidgets)
//         setLayouts(dashboardData.layouts || { lg: [], md: [], sm: [], xs: [] })
//         setDashboardSettings(dashboardData.settings || dashboardSettings)
//         setAssignedCustomers(dashboardData.assignedCustomers || [])
//         setTimeWindow(dashboardData.timewindow || timeWindow)
//         setIsImportModalVisible(false)
//         message.success("Dashboard imported successfully")
//       } catch (error) {
//         console.error("[DashboardEditor] Error importing dashboard:", error)
//         message.error("Failed to import dashboard. Invalid file format.")
//       }
//     }
//     reader.readAsText(file)
//   }

//   const handleCancel = () => {
//     navigate("/dashboards")
//   }
  
//   const handleWidgetConfigChange = (widgetId, newConfig) => {
//     console.log("[DashboardEditor] handleWidgetConfigChange for", widgetId, "with:", newConfig)
//     setWidgets(prev =>
//       prev.map(w =>
//         w.id === widgetId ? { ...w, config: newConfig } : w
//       )
//     );
//   };

//   const timeWindowMenu = (
//     <Menu>
//       <Menu.Item key="realtime_15_minutes" onClick={() => handleTimeWindowChange({ displayValue: "Last 15 minutes", value: "15_minutes", type: "REALTIME" })}>Last 15 minutes</Menu.Item>
//       <Menu.Item key="realtime_30_minutes" onClick={() => handleTimeWindowChange({ displayValue: "Last 30 minutes", value: "30_minutes", type: "REALTIME" })}>Last 30 minutes</Menu.Item>
//       <Menu.Item key="realtime_1_hour" onClick={() => handleTimeWindowChange({ displayValue: "Last 1 hour", value: "1_hour", type: "REALTIME" })}>Last 1 hour</Menu.Item>
//       <Menu.Item key="realtime_6_hours" onClick={() => handleTimeWindowChange({ displayValue: "Last 6 hours", value: "6_hours", type: "REALTIME" })}>Last 6 hours</Menu.Item>
//       <Menu.Item key="realtime_1_day" onClick={() => handleTimeWindowChange({ displayValue: "Last 1 day", value: "1_day", type: "REALTIME" })}>Last 1 day</Menu.Item>
//       <Menu.Item key="custom" onClick={() => setIsTimeWindowVisible(true)}>Custom...</Menu.Item>
//     </Menu>
//   )

//   return (
//     <Layout className={`dashboard-layout${isDarkMode ? " dark-theme" : ""}`}>
//       <Header className="dashboard-header">
//         <Input
//           className="dashboard-title-input"
//           placeholder="Dashboard title"
//           value={dashboardTitle}
//           onChange={(e) => setDashboardTitle(e.target.value)}
//         />
//         <Space wrap={isMobile}>
//           <Button icon={<PlusOutlined />} onClick={() => setIsWidgetLibraryVisible(true)}>{!isMobile && "Add widget"}</Button>
//           <Dropdown overlay={timeWindowMenu} trigger={["click"]}>
//             <Button icon={<ClockCircleOutlined />}>{!isMobile && timeWindow.displayValue} {isMobile && <DownOutlined />}</Button>
//           </Dropdown>
//           <Button icon={<SettingOutlined />} onClick={() => setIsSettingsVisible(true)}>{!isMobile && "Settings"}</Button>
//           {!isMobile && (<>
//             <Button icon={<LinkOutlined />} onClick={() => setIsAliasesModalVisible(true)}>Aliases</Button>
//             <Button icon={<FilterOutlined />}>Filters</Button>
//             <Button icon={<HistoryOutlined />}>Versions</Button>
//           </>)}
//           {!isTablet && (
//             <Button icon={<TeamOutlined />} onClick={handleAssignCustomers}>Assign</Button>
//           )}
//           <Button icon={<UploadOutlined />} onClick={() => setIsImportModalVisible(true)}>{!isMobile && "Import"}</Button>
//           <Button icon={<DownloadOutlined />} onClick={handleExport}>{!isMobile && "Export"}</Button>
//           <Button icon={<CloseOutlined />} onClick={handleCancel}>{!isMobile && "Cancel"}</Button>
//           <Button icon={<SaveOutlined />} type="primary" onClick={handleSave}>{!isMobile && "Save"}</Button>
//           {!isMobile && <Button icon={<FullscreenOutlined />} />}
//         </Space>
//       </Header>
//       <Content className="dashboard-content">
//         <div className="dashboard-main-content">
//           {widgets.length === 0 ? (
//             <div className="dashboard-empty-state">
//               <div className="dashboard-empty-icon">📊</div>
//               <Typography.Title level={4}>No widgets added yet</Typography.Title>
//               <Button
//                 type="primary"
//                 icon={<PlusOutlined />}
//                 onClick={() => setIsWidgetLibraryVisible(true)}
//                 className="dashboard-empty-add-btn"
//               >
//                 Add your first widget
//               </Button>
//             </div>
//           ) : (
//             <ResponsiveGridLayout
//               className="layout"
//               layouts={layouts}
//               breakpoints={breakpoints}
//               cols={cols}
//               rowHeight={rowHeight}
//               margin={margin}
//               containerPadding={containerPadding}
//               autoSize={true}
//               isDraggable={true}
//               isResizable={true}
//               draggableHandle=".widget-drag-handle"
//               resizeHandles={['se', 'e', 's']}
//               compactType={null}
//               preventCollision={true}
//               allowOverlap={false}
//               useCSSTransforms={true}
//               onLayoutChange={handleLayoutChange}
//             >
//               {widgets.map((widget) => (
//                 <div key={widget.id} className="widget-container">
//                   <div className="widget-controls">
//                     <Button type="text" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); handleWidgetSettings(widget) }} />
//                     <Button type="text" size="small" icon={<CopyOutlined />} onClick={(e) => { e.stopPropagation(); handleDuplicateWidget(widget) }} />
//                     <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); handleDeleteWidget(widget.id) }} />
//                   </div>
//                   <div className="widget-drag-handle">{widget.title}</div>
//                   <div className="widget-body">
//                     <WidgetRenderer
//                       widget={widget}
//                       config={{ ...widget.config, timeWindow: timeWindow }}
//                       onConfigChange={handleWidgetConfigChange}
//                     />
//                   </div>
//                 </div>
//               ))}
//             </ResponsiveGridLayout>
//           )}
//         </div>
//       </Content>
//       <WidgetLibrary
//         visible={isWidgetLibraryVisible}
//         onClose={() => setIsWidgetLibraryVisible(false)}
//         onSelect={handleAddWidget}
//       />
//       <TimeWindowSettings
//         visible={isTimeWindowVisible}
//         onClose={() => setIsTimeWindowVisible(false)}
//         onSave={handleTimeWindowChange}
//         initialValue={timeWindow}
//       />
//       <DashboardSettings visible={isSettingsVisible} onClose={() => setIsSettingsVisible(false)} />
//       <ManageLayoutsModal visible={isLayoutsModalVisible} onClose={() => setIsLayoutsModalVisible(false)} />
//       <ManageStatesModal visible={isStatesModalVisible} onClose={() => setIsStatesModalVisible(false)} />
//       <EntityAliasesModal visible={isAliasesModalVisible} onClose={() => setIsAliasesModalVisible(false)} />
//       <WidgetConfigModal
//         visible={isWidgetConfigModalVisible}
//         onCancel={() => setIsWidgetConfigModalVisible(false)}
//         onSave={handleWidgetConfigSave}
//         widget={selectedWidget}
//         devices={devices}
//       />
//       <Modal
//         title="Import Dashboard"
//         open={isImportModalVisible}
//         onCancel={() => setIsImportModalVisible(false)}
//         footer={null}
//       >
//         <div className="dashboard-import-modal">
//           <input
//             type="file"
//             accept=".json"
//             onChange={(e) => {
//               if (e.target.files && e.target.files[0]) {
//                 handleImportDashboard(e.target.files[0])
//               }
//             }}
//             className="dashboard-import-input"
//           />
//           <Typography.Paragraph>
//             Select a dashboard JSON file to import. The file should contain a valid dashboard configuration.
//           </Typography.Paragraph>
//           <Typography.Text type="secondary">
//             Note: Importing a dashboard will replace your current dashboard configuration.
//           </Typography.Text>
//         </div>
//       </Modal>
//       <Modal
//         title="Assign Dashboard to Customers"
//         open={isAssignCustomerModalVisible}
//         onCancel={() => setIsAssignCustomerModalVisible(false)}
//         onOk={() => {
//           form.validateFields().then((values) => {
//             handleAssignCustomersSave(values.customers)
//           })
//         }}
//       >
//         <Form form={form} layout="vertical" initialValues={{ customers: assignedCustomers }}>
//           <Form.Item
//             name="customers"
//             label="Select Customers"
//             rules={[{ required: false, message: "Please select at least one customer" }]}
//           >
//             <Select mode="multiple" placeholder="Select customers" style={{ width: "100%" }} optionLabelProp="label">
//               {customers.map((customer) => (
//                 <Select.Option key={customer.id} value={customer.id} label={customer.name}>
//                   {customer.name}
//                 </Select.Option>
//               ))}
//             </Select>
//           </Form.Item>
//           <Typography.Paragraph>
//             Assigned customers will be able to view this dashboard in their customer portal.
//           </Typography.Paragraph>
//         </Form>
//       </Modal>
//     </Layout>
//   )
// }

// export default DashboardEditor

// // "use client"

// // import { useState, useEffect } from "react"
// // import {
// //   Layout, Button, Space, Input, Typography, message, Modal, Form, Select, Dropdown, Menu,
// // } from "antd"
// // import { useParams, useNavigate } from "react-router-dom"
// // import {
// //   PlusOutlined, ClockCircleOutlined, SettingOutlined, LinkOutlined, FilterOutlined,
// //   HistoryOutlined, CloseOutlined, SaveOutlined, FullscreenOutlined, EditOutlined,
// //   DeleteOutlined, CopyOutlined, DownloadOutlined, UploadOutlined, TeamOutlined, DownOutlined,
// // } from "@ant-design/icons"
// // import { Responsive, WidthProvider } from "react-grid-layout"
// // import { saveAs } from "file-saver"
// // import "react-grid-layout/css/styles.css"
// // import "react-resizable/css/styles.css"
// // import "../styles/widget.css"

// // import WidgetLibrary from "../components/dashboard/WidgetLibrary"
// // import TimeWindowSettings from "../components/dashboard/TimeWindowSettings"
// // import DashboardSettings from "../components/dashboard/DashboardSettings"
// // import ManageLayoutsModal from "../components/dashboard/ManageLayoutsModal"
// // import ManageStatesModal from "../components/dashboard/ManageStatesModal"
// // import EntityAliasesModal from "../components/dashboard/EntityAliasesModal"
// // import WidgetRenderer from "../components/dashboard/WidgetRenderer"
// // import WidgetConfigModal from "../components/dashboard/WidgetConfigModal"
// // import { useMediaQuery } from "../hooks/useMediaQuery"
// // import { useTheme } from "../components/theme/ThemeProvider"
// // import { getDashboard, createDashboard, updateDashboard } from "../services/api"
// // import { v4 as uuidv4 } from 'uuid'

// // const { Header, Content } = Layout
// // const ResponsiveGridLayout = WidthProvider(Responsive)

// // const DashboardEditor = () => {
// //   const { theme, isDarkMode } = useTheme()
// //   const { id } = useParams()
// //   const navigate = useNavigate()
// //   const [isWidgetLibraryVisible, setIsWidgetLibraryVisible] = useState(false)
// //   const [isTimeWindowVisible, setIsTimeWindowVisible] = useState(false)
// //   const [isSettingsVisible, setIsSettingsVisible] = useState(false)
// //   const [selectedWidget, setSelectedWidget] = useState(null)
// //   const [widgets, setWidgets] = useState([])
// //   const [layouts, setLayouts] = useState({ lg: [], md: [], sm: [], xs: [] })
// //   const [isLayoutsModalVisible, setIsLayoutsModalVisible] = useState(false)
// //   const [isStatesModalVisible, setIsStatesModalVisible] = useState(false)
// //   const [isAliasesModalVisible, setIsAliasesModalVisible] = useState(false)
// //   const [dashboardTitle, setDashboardTitle] = useState("New Dashboard")
// //   const [dashboardSettings, setDashboardSettings] = useState({
// //     timewindow: { realtime: { timewindowMs: 60000 }, aggregation: { type: "AVG", limit: 200 } },
// //     gridSettings: { backgroundColor: "#ffffff", columns: 24, margin: [10, 10], backgroundImage: null },
// //   })
// //   const [isImportModalVisible, setIsImportModalVisible] = useState(false)
// //   const [isAssignCustomerModalVisible, setIsAssignCustomerModalVisible] = useState(false)
// //   const [isWidgetConfigModalVisible, setIsWidgetConfigModalVisible] = useState(false)
// //   const [timeWindow, setTimeWindow] = useState({
// //     displayValue: "Last 15 minutes", value: "15_minutes", type: "REALTIME",
// //   })
// //   const [form] = Form.useForm()
// //   const isMobile = useMediaQuery("(max-width: 768px)")
// //   const isTablet = useMediaQuery("(max-width: 992px)")
// //   const [devices] = useState([
// //     { id: "device1", name: "Rack Board" },
// //     { id: "device2", name: "Pressure Valve" },
// //     { id: "device3", name: "Power Meter" },
// //   ])
// //   const [customers] = useState([
// //     { id: "customer1", name: "Demo Customer" },
// //     { id: "customer2", name: "Device Claiming Customer" },
// //     { id: "customer3", name: "Customer A" },
// //   ])
// //   const [assignedCustomers, setAssignedCustomers] = useState([])

// //   // Load dashboard data when component mounts
// //   useEffect(() => {
// //     if (id && id !== "new") {
// //       fetchDashboard(id)
// //     } else {
// //       setDashboardTitle("New Dashboard")
// //       setWidgets([])
// //       setLayouts({ lg: [], md: [], sm: [], xs: [] })
// //     }
// //   }, [id])

// //   const fetchDashboard = async (dashboardId) => {
// //     try {
// //       const dashboard = await getDashboard(dashboardId)
// //       setDashboardTitle(dashboard.title || "Untitled")
// //       setWidgets(Array.isArray(dashboard.widgets)
// //         ? dashboard.widgets
// //         : JSON.parse(dashboard.widgets || "[]"))
// //       setLayouts(typeof dashboard.layouts === "object"
// //         ? dashboard.layouts
// //         : JSON.parse(dashboard.layouts || "{}"))
// //       setDashboardSettings(typeof dashboard.settings === "object"
// //         ? dashboard.settings
// //         : JSON.parse(dashboard.settings || "{}"))
// //       setAssignedCustomers(dashboard.assignedCustomers || [])
// //       setTimeWindow(typeof dashboard.timewindow === "object"
// //         ? dashboard.timewindow
// //         : JSON.parse(dashboard.timewindow || "{}"))
// //     } catch (error) {
// //       setDashboardTitle("New Dashboard")
// //       setWidgets([])
// //       setLayouts({ lg: [], md: [], sm: [], xs: [] })
// //       setDashboardSettings({
// //         timewindow: { realtime: { timewindowMs: 60000 }, aggregation: { type: "AVG", limit: 200 } },
// //         gridSettings: { backgroundColor: "#ffffff", columns: 24, margin: [10, 10], backgroundImage: null },
// //       })
// //       setAssignedCustomers([])
// //       message.warning("Unable to load dashboard. Starting empty.")
// //     }
// //   }

// //   useEffect(() => {
// //     console.log("[DashboardEditor] widgets updated:", widgets)
// //   }, [widgets])

// //   // --- Widget operations ---
// //   const handleAddWidget = (widget) => {
// //     const widgetId = uuidv4()
// //     const newWidget = {
// //       ...widget,
// //       id: widgetId,
// //       config: {
// //         title: widget.title,
// //         dataSource: {
// //           type: "device",
// //           deviceId: null,
// //           telemetry: [],
// //         },
// //         ...(widget.type.includes("chart")
// //           ? { height: 300, showLegend: true, showPoints: true }
// //           : {}),
// //         ...(widget.type.includes("map")
// //           ? { zoom: 4, center: { lat: 37.7749, lng: -122.4194 } }
// //           : {}),
// //       },
// //     }
// //     console.log("[DashboardEditor] Adding widget:", newWidget)
// //     setWidgets([...widgets, newWidget])

// //     // --- Calculate "next open slot" for new widget ---
// //     const cols = 12
// //     const getNextPosition = (layoutArr) => {
// //       if (!layoutArr.length) return { x: 0, y: 0 }
// //       const maxY = Math.max(...layoutArr.map(item => item.y + item.h))
// //       const taken = layoutArr.filter(item => item.y === 0)
// //       let freeX = 0
// //       while (taken.some(item => item.x <= freeX && freeX < item.x + item.w)) {
// //         freeX++
// //       }
// //       if (freeX + 4 <= cols) return { x: freeX, y: 0 }
// //       return { x: 0, y: maxY }
// //     }

// //     const nextPosLg = getNextPosition(layouts.lg)
// //     const newLayout = {
// //       i: widgetId,
// //       x: nextPosLg.x,
// //       y: nextPosLg.y,
// //       w: 4,
// //       h: 4,
// //       minW: 2,
// //       minH: 2,
// //     }
// //     setLayouts({
// //       lg: [...layouts.lg, newLayout],
// //       md: [...layouts.md, { ...newLayout, w: Math.min(newLayout.w, 8) }],
// //       sm: [...layouts.sm, { ...newLayout, w: Math.min(newLayout.w * 2, 12), x: 0 }],
// //       xs: [...layouts.xs, { ...newLayout, w: 12, x: 0 }],
// //     })

// //     setIsWidgetLibraryVisible(false)
// //     setSelectedWidget(newWidget)
// //     setIsWidgetConfigModalVisible(true)
// //   }

// //   const handleWidgetSettings = (widget) => {
// //     setSelectedWidget(widget)
// //     setIsWidgetConfigModalVisible(true)
// //   }

// //   const handleWidgetConfigSave = (updatedWidget) => {
// //     console.log("[DashboardEditor] handleWidgetConfigSave for", updatedWidget.id, "with:", updatedWidget)
// //     setWidgets((prevWidgets) =>
// //       prevWidgets.map((w) => (w.id === updatedWidget.id ? { ...w, ...updatedWidget } : w))
// //     )
// //     setIsWidgetConfigModalVisible(false)
// //     message.success("Widget configuration updated")
// //   }

// //   const handleDeleteWidget = (widgetId) => {
// //     Modal.confirm({
// //       title: "Are you sure you want to delete this widget?",
// //       content: "This action cannot be undone.",
// //       okText: "Yes",
// //       okType: "danger",
// //       cancelText: "No",
// //       onOk() {
// //         setWidgets(widgets.filter((w) => w.id !== widgetId))
// //         setLayouts({
// //           lg: layouts.lg.filter((item) => item.i !== widgetId),
// //           md: layouts.md.filter((item) => item.i !== widgetId),
// //           sm: layouts.sm.filter((item) => item.i !== widgetId),
// //           xs: layouts.xs.filter((item) => item.i !== widgetId),
// //         })
// //         message.success("Widget deleted")
// //       },
// //     })
// //   }

// //   const handleDuplicateWidget = (widget) => {
// //     const newWidgetId = uuidv4()
// //     const newWidget = {
// //       ...widget,
// //       id: newWidgetId,
// //       title: `${widget.title} (Copy)`,
// //       config: { ...widget.config },
// //     }
// //     setWidgets([...widgets, newWidget])
// //     const originalLayout = layouts.lg.find((item) => item.i === widget.id)
// //     if (originalLayout) {
// //       const newLayout = {
// //         ...originalLayout,
// //         i: newWidgetId,
// //         x: (originalLayout.x + 1) % 12,
// //         y: originalLayout.y + 1,
// //       }
// //       setLayouts({
// //         lg: [...layouts.lg, newLayout],
// //         md: [...layouts.md, { ...newLayout, w: Math.min(newLayout.w, 8) }],
// //         sm: [...layouts.sm, { ...newLayout, w: Math.min(newLayout.w * 2, 12), x: 0 }],
// //         xs: [...layouts.xs, { ...newLayout, w: 12, x: 0 }],
// //       })
// //     }
// //     message.success("Widget duplicated")
// //   }

// //   const handleLayoutChange = (layout, allLayouts) => {
// //     setLayouts(allLayouts)
// //   }

// //   const handleTimeWindowChange = (newTimeWindow) => {
// //     setTimeWindow(newTimeWindow)
// //     setIsTimeWindowVisible(false)
// //   }

// //   const handleAssignCustomers = () => {
// //     setIsAssignCustomerModalVisible(true)
// //   }
// //   const handleAssignCustomersSave = (selectedCustomers) => {
// //     setAssignedCustomers(selectedCustomers)
// //     setIsAssignCustomerModalVisible(false)
// //     message.success("Dashboard assigned to customers")
// //   }

// //   const handleSave = async () => {
// //     const dashboardState = {
// //       id: id && id !== "new" ? id : uuidv4(),
// //       title: dashboardTitle,
// //       widgets: JSON.stringify(widgets),
// //       layouts: JSON.stringify(layouts),
// //       settings: JSON.stringify(dashboardSettings),
// //       assignedCustomers,
// //       timewindow: JSON.stringify(timeWindow),
// //       version: "1.0.0",
// //     }

// //     try {
// //       let result
// //       if (id && id !== "new") {
// //         result = await updateDashboard(id, dashboardState)
// //         message.success("Dashboard updated")
// //       } else {
// //         result = await createDashboard(dashboardState)
// //         message.success("Dashboard created")
// //         navigate(`/dashboards/${result.id}`)
// //       }
// //     } catch (err) {
// //       console.error(err)
// //       message.error("Failed to save dashboard")
// //     }
// //   }

// //   const handleExport = () => {
// //     const dashboardState = {
// //       id: id && id !== "new" ? id : uuidv4(),
// //       title: dashboardTitle,
// //       widgets,
// //       layouts,
// //       settings: dashboardSettings,
// //       assignedCustomers,
// //       timeWindow,
// //       version: "1.0.0",
// //       createdTime: new Date().toISOString(),
// //     }

// //     const dashboardJson = JSON.stringify(dashboardState, null, 2)
// //     const blob = new Blob([dashboardJson], { type: "application/json" })
// //     saveAs(blob, `${dashboardTitle.replace(/\s+/g, "_").toLowerCase()}_dashboard.json`)
// //     message.success("Dashboard exported successfully")
// //   }
// //   // Defensive normalization for camera widgets (and all others)
// //   function normalizeWidget(widget) {
// //     if (!widget) return null;
// //     const config = widget.config || {};
// //     const dataSource = config.dataSource || {};

// //     // Force telemetry to be an array, even if missing
// //     let telemetry = dataSource.telemetry;
// //     if (!Array.isArray(telemetry)) {
// //       if (typeof telemetry === "string" && telemetry.length > 0) {
// //         try { telemetry = [telemetry]; } catch { telemetry = []; }
// //       } else {
// //         telemetry = [];
// //       }
// //     }

// //     // For cameras: sometimes streamUrl only, no telemetry—add if missing
// //     if (
// //       widget.type === "camera" &&
// //       (!telemetry.length && dataSource.streamUrl)
// //     ) {
// //       telemetry = [dataSource.streamUrl];
// //     }

// //     // Return a safe copy
// //     return {
// //       ...widget,
// //       config: {
// //         ...config,
// //         dataSource: {
// //           ...dataSource,
// //           telemetry
// //         }
// //       }
// //     }
// //   }

// //   // const handleImportDashboard = (file) => {
// //   //   const reader = new FileReader()
// //   //   reader.onload = (e) => {
// //   //     try {
// //   //       const dashboardData = JSON.parse(e.target.result)
// //   //       if (!dashboardData.widgets || !dashboardData.layouts) throw new Error("Invalid dashboard file format")
// //   //       setDashboardTitle(dashboardData.title || "Imported Dashboard")
// //   //       // setWidgets(dashboardData.widgets || [])
// //   //       setWidgets(Array.isArray(dashboardData.widgets)
// //   //       ? dashboardData.widgets.map(normalizeWidget).filter(Boolean)
// //   //       : [])

// //   //       setLayouts(dashboardData.layouts || { lg: [], md: [], sm: [], xs: [] })
// //   //       setDashboardSettings(dashboardData.settings || dashboardSettings)
// //   //       setAssignedCustomers(dashboardData.assignedCustomers || [])
// //   //       setTimeWindow(dashboardData.timewindow || timeWindow)
// //   //       setIsImportModalVisible(false)
// //   //       message.success("Dashboard imported successfully")
// //   //     } catch (error) {
// //   //       console.error("Error importing dashboard:", error)
// //   //       message.error("Failed to import dashboard. Invalid file format.")
// //   //     }
// //   //   }
// //   //   reader.readAsText(file)
// //   // }
// //   const handleImportDashboard = (file) => {
// //     const reader = new FileReader()
// //     reader.onload = (e) => {
// //       try {
// //         const dashboardData = JSON.parse(e.target.result)
// //         if (!dashboardData.widgets || !dashboardData.layouts) throw new Error("Invalid dashboard file format")
// //         setDashboardTitle(dashboardData.title || "Imported Dashboard")
// //         setWidgets(Array.isArray(dashboardData.widgets)
// //           ? dashboardData.widgets.map(normalizeWidget).filter(Boolean)
// //           : [])
// //         setLayouts(dashboardData.layouts || { lg: [], md: [], sm: [], xs: [] })
// //         setDashboardSettings(dashboardData.settings || dashboardSettings)
// //         setAssignedCustomers(dashboardData.assignedCustomers || [])
// //         setTimeWindow(dashboardData.timewindow || timeWindow)
// //         setIsImportModalVisible(false)
// //         message.success("Dashboard imported successfully")
// //       } catch (error) {
// //         console.error("Error importing dashboard:", error)
// //         message.error("Failed to import dashboard. Invalid file format.")
// //       }
// //     }
// //     reader.readAsText(file)
// //   }

// //   const handleCancel = () => {
// //     navigate("/dashboards")
// //   }
  
// //   const handleWidgetConfigChange = (widgetId, newConfig) => {
// //     console.log("[DashboardEditor] handleWidgetConfigChange for", widgetId, "with:", newConfig)
// //     setWidgets(prev =>
// //       prev.map(w =>
// //         w.id === widgetId ? { ...w, config: newConfig } : w
// //       )
// //     );
// //   };
// //   const timeWindowMenu = (
// //     <Menu>
// //       <Menu.Item key="realtime_15_minutes" onClick={() => handleTimeWindowChange({ displayValue: "Last 15 minutes", value: "15_minutes", type: "REALTIME" })}>Last 15 minutes</Menu.Item>
// //       <Menu.Item key="realtime_30_minutes" onClick={() => handleTimeWindowChange({ displayValue: "Last 30 minutes", value: "30_minutes", type: "REALTIME" })}>Last 30 minutes</Menu.Item>
// //       <Menu.Item key="realtime_1_hour" onClick={() => handleTimeWindowChange({ displayValue: "Last 1 hour", value: "1_hour", type: "REALTIME" })}>Last 1 hour</Menu.Item>
// //       <Menu.Item key="realtime_6_hours" onClick={() => handleTimeWindowChange({ displayValue: "Last 6 hours", value: "6_hours", type: "REALTIME" })}>Last 6 hours</Menu.Item>
// //       <Menu.Item key="realtime_1_day" onClick={() => handleTimeWindowChange({ displayValue: "Last 1 day", value: "1_day", type: "REALTIME" })}>Last 1 day</Menu.Item>
// //       <Menu.Item key="custom" onClick={() => setIsTimeWindowVisible(true)}>Custom...</Menu.Item>
// //     </Menu>
// //   )

// //   return (
// //     <Layout className={`dashboard-layout${isDarkMode ? " dark-theme" : ""}`}>
// //       <Header className="dashboard-header">
// //         <Input
// //           className="dashboard-title-input"
// //           placeholder="Dashboard title"
// //           value={dashboardTitle}
// //           onChange={(e) => setDashboardTitle(e.target.value)}
// //         />
// //         <Space wrap={isMobile}>
// //           <Button icon={<PlusOutlined />} onClick={() => setIsWidgetLibraryVisible(true)}>{!isMobile && "Add widget"}</Button>
// //           <Dropdown overlay={timeWindowMenu} trigger={["click"]}>
// //             <Button icon={<ClockCircleOutlined />}>{!isMobile && timeWindow.displayValue} {isMobile && <DownOutlined />}</Button>
// //           </Dropdown>
// //           <Button icon={<SettingOutlined />} onClick={() => setIsSettingsVisible(true)}>{!isMobile && "Settings"}</Button>
// //           {!isMobile && (<>
// //             <Button icon={<LinkOutlined />} onClick={() => setIsAliasesModalVisible(true)}>Aliases</Button>
// //             <Button icon={<FilterOutlined />}>Filters</Button>
// //             <Button icon={<HistoryOutlined />}>Versions</Button>
// //           </>)}
// //           {!isTablet && (
// //             <Button icon={<TeamOutlined />} onClick={handleAssignCustomers}>Assign</Button>
// //           )}
// //           <Button icon={<UploadOutlined />} onClick={() => setIsImportModalVisible(true)}>{!isMobile && "Import"}</Button>
// //           <Button icon={<DownloadOutlined />} onClick={handleExport}>{!isMobile && "Export"}</Button>
// //           <Button icon={<CloseOutlined />} onClick={handleCancel}>{!isMobile && "Cancel"}</Button>
// //           <Button icon={<SaveOutlined />} type="primary" onClick={handleSave}>{!isMobile && "Save"}</Button>
// //           {!isMobile && <Button icon={<FullscreenOutlined />} />}
// //         </Space>
// //       </Header>
// //       <Content className="dashboard-content">
// //         <div className="dashboard-main-content">
// //           {widgets.length === 0 ? (
// //             <div className="dashboard-empty-state">
// //               <div className="dashboard-empty-icon">📊</div>
// //               <Typography.Title level={4}>No widgets added yet</Typography.Title>
// //               <Button
// //                 type="primary"
// //                 icon={<PlusOutlined />}
// //                 onClick={() => setIsWidgetLibraryVisible(true)}
// //                 className="dashboard-empty-add-btn"
// //               >
// //                 Add your first widget
// //               </Button>
// //             </div>
// //           ) : (
// //             <ResponsiveGridLayout
// //               className="layout"
// //               layouts={layouts}
// //               breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
// //               cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
// //               rowHeight={40}
// //               margin={[18, 18]}
// //               containerPadding={[8, 8]}
// //               autoSize={true}
// //               isDraggable={true}
// //               isResizable={true}
// //               draggableHandle=".widget-drag-handle"
// //               resizeHandles={['se', 'e', 's']}
// //               compactType={null}
// //               preventCollision={true}
// //               allowOverlap={false}
// //               useCSSTransforms={true}
// //               onLayoutChange={handleLayoutChange}
// //             >
// //             {widgets.map((widget) => {
// //               // Defensive skip for invalid widget configs (prevents .length crash)
// //               if (
// //                 !widget ||
// //                 !widget.config ||
// //                 !widget.config.dataSource ||
// //                 !Array.isArray(widget.config.dataSource.telemetry)
// //               ) {
// //                 // Optionally log:
// //                 console.warn("Skipping bad widget:", widget)
// //                 return null
// //               }
// //               return (
// //                 <div key={widget.id} className="widget-container">
// //                   <div className="widget-controls">
// //                     <Button
// //                       type="text"
// //                       size="small"
// //                       icon={<EditOutlined />}
// //                       onClick={(e) => { e.stopPropagation(); handleWidgetSettings(widget) }}
// //                     />
// //                     <Button
// //                       type="text"
// //                       size="small"
// //                       icon={<CopyOutlined />}
// //                       onClick={(e) => { e.stopPropagation(); handleDuplicateWidget(widget) }}
// //                     />
// //                     <Button
// //                       type="text"
// //                       size="small"
// //                       danger
// //                       icon={<DeleteOutlined />}
// //                       onClick={(e) => { e.stopPropagation(); handleDeleteWidget(widget.id) }}
// //                     />
// //                   </div>
// //                   <div className="widget-drag-handle">{widget.title}</div>
// //                   <div className="widget-body">
// //                     <WidgetRenderer
// //                       widget={widget}
// //                       config={{ ...widget.config, timeWindow: timeWindow }}
// //                       onConfigChange={handleWidgetConfigChange}
// //                     />
// //                   </div>
// //                 </div>
// //               );
// //             })}

// //             </ResponsiveGridLayout>
// //           )}
// //         </div>
// //       </Content>
// //       <WidgetLibrary
// //         visible={isWidgetLibraryVisible}
// //         onClose={() => setIsWidgetLibraryVisible(false)}
// //         onSelect={handleAddWidget}
// //       />
// //       <TimeWindowSettings
// //         visible={isTimeWindowVisible}
// //         onClose={() => setIsTimeWindowVisible(false)}
// //         onSave={handleTimeWindowChange}
// //         initialValue={timeWindow}
// //       />
// //       <DashboardSettings visible={isSettingsVisible} onClose={() => setIsSettingsVisible(false)} />
// //       <ManageLayoutsModal visible={isLayoutsModalVisible} onClose={() => setIsLayoutsModalVisible(false)} />
// //       <ManageStatesModal visible={isStatesModalVisible} onClose={() => setIsStatesModalVisible(false)} />
// //       <EntityAliasesModal visible={isAliasesModalVisible} onClose={() => setIsAliasesModalVisible(false)} />
// //       <WidgetConfigModal
// //         visible={isWidgetConfigModalVisible}
// //         onCancel={() => setIsWidgetConfigModalVisible(false)}
// //         onSave={handleWidgetConfigSave}
// //         widget={selectedWidget}
// //         devices={devices}
// //       />
// //       <Modal
// //         title="Import Dashboard"
// //         open={isImportModalVisible}
// //         onCancel={() => setIsImportModalVisible(false)}
// //         footer={null}
// //       >
// //         <div className="dashboard-import-modal">
// //           <input
// //             type="file"
// //             accept=".json"
// //             onChange={(e) => {
// //               if (e.target.files && e.target.files[0]) {
// //                 handleImportDashboard(e.target.files[0])
// //               }
// //             }}
// //             className="dashboard-import-input"
// //           />
// //           <Typography.Paragraph>
// //             Select a dashboard JSON file to import. The file should contain a valid dashboard configuration.
// //           </Typography.Paragraph>
// //           <Typography.Text type="secondary">
// //             Note: Importing a dashboard will replace your current dashboard configuration.
// //           </Typography.Text>
// //         </div>
// //       </Modal>
// //       <Modal
// //         title="Assign Dashboard to Customers"
// //         open={isAssignCustomerModalVisible}
// //         onCancel={() => setIsAssignCustomerModalVisible(false)}
// //         onOk={() => {
// //           form.validateFields().then((values) => {
// //             handleAssignCustomersSave(values.customers)
// //           })
// //         }}
// //       >
// //         <Form form={form} layout="vertical" initialValues={{ customers: assignedCustomers }}>
// //           <Form.Item
// //             name="customers"
// //             label="Select Customers"
// //             rules={[{ required: false, message: "Please select at least one customer" }]}
// //           >
// //             <Select mode="multiple" placeholder="Select customers" style={{ width: "100%" }} optionLabelProp="label">
// //               {customers.map((customer) => (
// //                 <Select.Option key={customer.id} value={customer.id} label={customer.name}>
// //                   {customer.name}
// //                 </Select.Option>
// //               ))}
// //             </Select>
// //           </Form.Item>
// //           <Typography.Paragraph>
// //             Assigned customers will be able to view this dashboard in their customer portal.
// //           </Typography.Paragraph>
// //         </Form>
// //       </Modal>
// //     </Layout>
// //   )
// // }

// // export default DashboardEditor

// // // "use client"

// // // import { useState, useEffect } from "react"
// // // import {
// // //   Layout,
// // //   Button,
// // //   Space,
// // //   Input,
// // //   Typography,
// // //   message,
// // //   Modal,
// // //   Form,
// // //   Select,
// // //   Dropdown,
// // //   Menu,
// // // } from "antd"
// // // import { useParams, useNavigate } from "react-router-dom"
// // // import {
// // //   PlusOutlined,
// // //   ClockCircleOutlined,
// // //   SettingOutlined,
// // //   LinkOutlined,
// // //   FilterOutlined,
// // //   HistoryOutlined,
// // //   CloseOutlined,
// // //   SaveOutlined,
// // //   FullscreenOutlined,
// // //   EditOutlined,
// // //   DeleteOutlined,
// // //   CopyOutlined,
// // //   DownloadOutlined,
// // //   UploadOutlined,
// // //   TeamOutlined,
// // //   DownOutlined,
// // // } from "@ant-design/icons"
// // // import { Responsive, WidthProvider } from "react-grid-layout"
// // // import { saveAs } from "file-saver"
// // // import "react-grid-layout/css/styles.css"
// // // import "react-resizable/css/styles.css"
// // // import "../styles/widget.css"

// // // import WidgetLibrary from "../components/dashboard/WidgetLibrary"
// // // import TimeWindowSettings from "../components/dashboard/TimeWindowSettings"
// // // import DashboardSettings from "../components/dashboard/DashboardSettings"
// // // import ManageLayoutsModal from "../components/dashboard/ManageLayoutsModal"
// // // import ManageStatesModal from "../components/dashboard/ManageStatesModal"
// // // import EntityAliasesModal from "../components/dashboard/EntityAliasesModal"
// // // import WidgetRenderer from "../components/dashboard/WidgetRenderer"
// // // import WidgetConfigModal from "../components/dashboard/WidgetConfigModal"
// // // import { useMediaQuery } from "../hooks/useMediaQuery"
// // // import { useTheme } from "../components/theme/ThemeProvider"
// // // import { getDashboard, createDashboard, updateDashboard } from "../services/api"
// // // import { v4 as uuidv4 } from 'uuid'

// // // const { Header, Content } = Layout
// // // const ResponsiveGridLayout = WidthProvider(Responsive)

// // // const DashboardEditor = () => {
// // //   const { theme, isDarkMode } = useTheme()
// // //   const { id } = useParams()
// // //   const navigate = useNavigate()
// // //   const [isWidgetLibraryVisible, setIsWidgetLibraryVisible] = useState(false)
// // //   const [isTimeWindowVisible, setIsTimeWindowVisible] = useState(false)
// // //   const [isSettingsVisible, setIsSettingsVisible] = useState(false)
// // //   const [selectedWidget, setSelectedWidget] = useState(null)
// // //   const [widgets, setWidgets] = useState([])
// // //   const [layouts, setLayouts] = useState({ lg: [], md: [], sm: [], xs: [] })
// // //   const [isLayoutsModalVisible, setIsLayoutsModalVisible] = useState(false)
// // //   const [isStatesModalVisible, setIsStatesModalVisible] = useState(false)
// // //   const [isAliasesModalVisible, setIsAliasesModalVisible] = useState(false)
// // //   const [dashboardTitle, setDashboardTitle] = useState("New Dashboard")
// // //   const [dashboardSettings, setDashboardSettings] = useState({
// // //     timewindow: {
// // //       realtime: { timewindowMs: 60000 },
// // //       aggregation: { type: "AVG", limit: 200 },
// // //     },
// // //     gridSettings: {
// // //       backgroundColor: "#ffffff",
// // //       columns: 24,
// // //       margin: [10, 10],
// // //       backgroundImage: null,
// // //     },
// // //   })
// // //   const [isImportModalVisible, setIsImportModalVisible] = useState(false)
// // //   const [isAssignCustomerModalVisible, setIsAssignCustomerModalVisible] = useState(false)
// // //   const [isWidgetConfigModalVisible, setIsWidgetConfigModalVisible] = useState(false)
// // //   const [timeWindow, setTimeWindow] = useState({
// // //     displayValue: "Last 15 minutes",
// // //     value: "15_minutes",
// // //     type: "REALTIME",
// // //   })
// // //   const [form] = Form.useForm()
// // //   const isMobile = useMediaQuery("(max-width: 768px)")
// // //   const isTablet = useMediaQuery("(max-width: 992px)")
// // //   const [devices, setDevices] = useState([
// // //     { id: "device1", name: "Rack Board" },
// // //     { id: "device2", name: "Pressure Valve" },
// // //     { id: "device3", name: "Power Meter" },
// // //   ])
// // //   const [customers, setCustomers] = useState([
// // //     { id: "customer1", name: "Demo Customer" },
// // //     { id: "customer2", name: "Device Claiming Customer" },
// // //     { id: "customer3", name: "Customer A" },
// // //   ])
// // //   const [assignedCustomers, setAssignedCustomers] = useState([])

// // //   // Load dashboard data when component mounts
// // //   useEffect(() => {
// // //     if (id && id !== "new") {
// // //       fetchDashboard(id)
// // //     } else {
// // //       setDashboardTitle("New Dashboard")
// // //       setWidgets([])
// // //       setLayouts({ lg: [], md: [], sm: [], xs: [] })
// // //     }
// // //   }, [id])

// // //   const fetchDashboard = async (dashboardId) => {
// // //     try {
// // //       const dashboard = await getDashboard(dashboardId)
// // //       setDashboardTitle(dashboard.title || "Untitled")
// // //       setWidgets(Array.isArray(dashboard.widgets)
// // //         ? dashboard.widgets
// // //         : JSON.parse(dashboard.widgets || "[]"))
// // //       setLayouts(typeof dashboard.layouts === "object"
// // //         ? dashboard.layouts
// // //         : JSON.parse(dashboard.layouts || "{}"))
// // //       setDashboardSettings(typeof dashboard.settings === "object"
// // //         ? dashboard.settings
// // //         : JSON.parse(dashboard.settings || "{}"))
// // //       setAssignedCustomers(dashboard.assignedCustomers || [])
// // //       setTimeWindow(typeof dashboard.timewindow === "object"
// // //         ? dashboard.timewindow
// // //         : JSON.parse(dashboard.timewindow || "{}"))
// // //     } catch (error) {
// // //       setDashboardTitle("New Dashboard")
// // //       setWidgets([])
// // //       setLayouts({ lg: [], md: [], sm: [], xs: [] })
// // //       setDashboardSettings({
// // //         timewindow: { realtime: { timewindowMs: 60000 }, aggregation: { type: "AVG", limit: 200 } },
// // //         gridSettings: { backgroundColor: "#ffffff", columns: 24, margin: [10, 10], backgroundImage: null },
// // //       })
// // //       setAssignedCustomers([])
// // //       message.warning("Unable to load dashboard. Starting empty.")
// // //     }
// // //   }

// // //   // --- Widget operations ---
// // //   const handleAddWidget = (widget) => {
// // //     const widgetId = uuidv4()
// // //     const newWidget = {
// // //       ...widget,
// // //       id: widgetId,
// // //       config: {
// // //         title: widget.title,
// // //         dataSource: {
// // //           type: "device",
// // //           deviceId: null,
// // //           telemetry: [],
// // //         },
// // //         ...(widget.type.includes("chart")
// // //           ? { height: 300, showLegend: true, showPoints: true }
// // //           : {}),
// // //         ...(widget.type.includes("map")
// // //           ? { zoom: 4, center: { lat: 37.7749, lng: -122.4194 } }
// // //           : {}),
// // //       },
// // //     }

// // //     setWidgets([...widgets, newWidget])

// // //     // --- Calculate "next open slot" for new widget ---
// // //     const cols = 12 // You can make this dynamic from gridSettings if desired
// // //     const getNextPosition = (layoutArr) => {
// // //       // Place after the lowest widget in Y, or next to rightmost in first row if empty
// // //       if (!layoutArr.length) return { x: 0, y: 0 }
// // //       // Find max Y
// // //       const maxY = Math.max(...layoutArr.map(item => item.y + item.h))
// // //       // Try to place in first empty column in row 0
// // //       const taken = layoutArr.filter(item => item.y === 0)
// // //       let freeX = 0
// // //       while (taken.some(item => item.x <= freeX && freeX < item.x + item.w)) {
// // //         freeX++
// // //       }
// // //       if (freeX + 4 <= cols) return { x: freeX, y: 0 } // Place next in first row
// // //       return { x: 0, y: maxY } // Place in next row
// // //     }

// // //     const nextPosLg = getNextPosition(layouts.lg)
// // //     const newLayout = {
// // //       i: widgetId,
// // //       x: nextPosLg.x,
// // //       y: nextPosLg.y,
// // //       w: 4,
// // //       h: 4,
// // //       minW: 2,
// // //       minH: 2,
// // //     }
// // //     setLayouts({
// // //       lg: [...layouts.lg, newLayout],
// // //       md: [...layouts.md, { ...newLayout, w: Math.min(newLayout.w, 8) }],
// // //       sm: [...layouts.sm, { ...newLayout, w: Math.min(newLayout.w * 2, 12), x: 0 }],
// // //       xs: [...layouts.xs, { ...newLayout, w: 12, x: 0 }],
// // //     })

// // //     setIsWidgetLibraryVisible(false)
// // //     setSelectedWidget(newWidget)
// // //     setIsWidgetConfigModalVisible(true)
// // //   }

// // //   const handleWidgetSettings = (widget) => {
// // //     setSelectedWidget(widget)
// // //     setIsWidgetConfigModalVisible(true)
// // //   }

// // //   const handleWidgetConfigSave = (updatedWidget) => {
// // //     setWidgets((prevWidgets) =>
// // //       prevWidgets.map((w) => (w.id === updatedWidget.id ? { ...w, ...updatedWidget } : w))
// // //     )
// // //     setIsWidgetConfigModalVisible(false)
// // //     message.success("Widget configuration updated")
// // //   }

// // //   const handleDeleteWidget = (widgetId) => {
// // //     Modal.confirm({
// // //       title: "Are you sure you want to delete this widget?",
// // //       content: "This action cannot be undone.",
// // //       okText: "Yes",
// // //       okType: "danger",
// // //       cancelText: "No",
// // //       onOk() {
// // //         setWidgets(widgets.filter((w) => w.id !== widgetId))
// // //         setLayouts({
// // //           lg: layouts.lg.filter((item) => item.i !== widgetId),
// // //           md: layouts.md.filter((item) => item.i !== widgetId),
// // //           sm: layouts.sm.filter((item) => item.i !== widgetId),
// // //           xs: layouts.xs.filter((item) => item.i !== widgetId),
// // //         })
// // //         message.success("Widget deleted")
// // //       },
// // //     })
// // //   }

// // //   const handleDuplicateWidget = (widget) => {
// // //     const newWidgetId = uuidv4()
// // //     const newWidget = {
// // //       ...widget,
// // //       id: newWidgetId,
// // //       title: `${widget.title} (Copy)`,
// // //       config: { ...widget.config },
// // //     }
// // //     setWidgets([...widgets, newWidget])
// // //     const originalLayout = layouts.lg.find((item) => item.i === widget.id)
// // //     if (originalLayout) {
// // //       const newLayout = {
// // //         ...originalLayout,
// // //         i: newWidgetId,
// // //         x: (originalLayout.x + 1) % 12,
// // //         y: originalLayout.y + 1,
// // //       }
// // //       setLayouts({
// // //         lg: [...layouts.lg, newLayout],
// // //         md: [...layouts.md, { ...newLayout, w: Math.min(newLayout.w, 8) }],
// // //         sm: [...layouts.sm, { ...newLayout, w: Math.min(newLayout.w * 2, 12), x: 0 }],
// // //         xs: [...layouts.xs, { ...newLayout, w: 12, x: 0 }],
// // //       })
// // //     }
// // //     message.success("Widget duplicated")
// // //   }

// // //   const handleLayoutChange = (layout, allLayouts) => {
// // //     setLayouts(allLayouts)
// // //   }

// // //   const handleTimeWindowChange = (newTimeWindow) => {
// // //     setTimeWindow(newTimeWindow)
// // //     setIsTimeWindowVisible(false)
// // //   }

// // //   const handleAssignCustomers = () => {
// // //     setIsAssignCustomerModalVisible(true)
// // //   }
// // //   const handleAssignCustomersSave = (selectedCustomers) => {
// // //     setAssignedCustomers(selectedCustomers)
// // //     setIsAssignCustomerModalVisible(false)
// // //     message.success("Dashboard assigned to customers")
// // //   }

// // //   // --- Save/Export dashboard: widgets is the FULL state ---
// // //   const handleSave = async () => {
// // //     const dashboardState = {
// // //       id: id && id !== "new" ? id : uuidv4(),
// // //       title: dashboardTitle,
// // //       widgets: JSON.stringify(widgets),
// // //       layouts: JSON.stringify(layouts),
// // //       settings: JSON.stringify(dashboardSettings),
// // //       assignedCustomers,
// // //       timewindow: JSON.stringify(timeWindow),
// // //       version: "1.0.0",
// // //     }

// // //     try {
// // //       let result
// // //       if (id && id !== "new") {
// // //         result = await updateDashboard(id, dashboardState)
// // //         message.success("Dashboard updated")
// // //       } else {
// // //         result = await createDashboard(dashboardState)
// // //         message.success("Dashboard created")
// // //         navigate(`/dashboards/${result.id}`)
// // //       }
// // //     } catch (err) {
// // //       console.error(err)
// // //       message.error("Failed to save dashboard")
// // //     }
// // //   }

// // //   const handleExport = () => {
// // //     const dashboardState = {
// // //       id: id && id !== "new" ? id : uuidv4(),
// // //       title: dashboardTitle,
// // //       widgets,
// // //       layouts,
// // //       settings: dashboardSettings,
// // //       assignedCustomers,
// // //       timeWindow,
// // //       version: "1.0.0",
// // //       createdTime: new Date().toISOString(),
// // //     }

// // //     const dashboardJson = JSON.stringify(dashboardState, null, 2)
// // //     const blob = new Blob([dashboardJson], { type: "application/json" })
// // //     saveAs(blob, `${dashboardTitle.replace(/\s+/g, "_").toLowerCase()}_dashboard.json`)
// // //     message.success("Dashboard exported successfully")
// // //   }

// // //   const handleImportDashboard = (file) => {
// // //     const reader = new FileReader()
// // //     reader.onload = (e) => {
// // //       try {
// // //         const dashboardData = JSON.parse(e.target.result)
// // //         if (!dashboardData.widgets || !dashboardData.layouts) throw new Error("Invalid dashboard file format")
// // //         setDashboardTitle(dashboardData.title || "Imported Dashboard")
// // //         setWidgets(dashboardData.widgets || [])
// // //         setLayouts(dashboardData.layouts || { lg: [], md: [], sm: [], xs: [] })
// // //         setDashboardSettings(dashboardData.settings || dashboardSettings)
// // //         setAssignedCustomers(dashboardData.assignedCustomers || [])
// // //         setTimeWindow(dashboardData.timewindow || timeWindow)
// // //         setIsImportModalVisible(false)
// // //         message.success("Dashboard imported successfully")
// // //       } catch (error) {
// // //         console.error("Error importing dashboard:", error)
// // //         message.error("Failed to import dashboard. Invalid file format.")
// // //       }
// // //     }
// // //     reader.readAsText(file)
// // //   }

// // //   const handleCancel = () => {
// // //     navigate("/dashboards")
// // //   }

// // //   const timeWindowMenu = (
// // //     <Menu>
// // //       <Menu.Item key="realtime_15_minutes" onClick={() => handleTimeWindowChange({ displayValue: "Last 15 minutes", value: "15_minutes", type: "REALTIME" })}>Last 15 minutes</Menu.Item>
// // //       <Menu.Item key="realtime_30_minutes" onClick={() => handleTimeWindowChange({ displayValue: "Last 30 minutes", value: "30_minutes", type: "REALTIME" })}>Last 30 minutes</Menu.Item>
// // //       <Menu.Item key="realtime_1_hour" onClick={() => handleTimeWindowChange({ displayValue: "Last 1 hour", value: "1_hour", type: "REALTIME" })}>Last 1 hour</Menu.Item>
// // //       <Menu.Item key="realtime_6_hours" onClick={() => handleTimeWindowChange({ displayValue: "Last 6 hours", value: "6_hours", type: "REALTIME" })}>Last 6 hours</Menu.Item>
// // //       <Menu.Item key="realtime_1_day" onClick={() => handleTimeWindowChange({ displayValue: "Last 1 day", value: "1_day", type: "REALTIME" })}>Last 1 day</Menu.Item>
// // //       <Menu.Item key="custom" onClick={() => setIsTimeWindowVisible(true)}>Custom...</Menu.Item>
// // //     </Menu>
// // //   )

// // //   return (
// // //     <Layout style={{ minHeight: "100vh" }} className={isDarkMode ? "dark-theme" : ""}>
// // //       <Header style={{
// // //         background: isDarkMode ? "#1f1f1f" : "#fff",
// // //         padding: "0 16px",
// // //         display: "flex",
// // //         justifyContent: "space-between",
// // //         alignItems: "center",
// // //         height: "64px",
// // //         boxShadow: "0 1px 4px rgba(0,21,41,.08)",
// // //       }}>
// // //         <Input
// // //           placeholder="Dashboard title"
// // //           style={{ width: isMobile ? 150 : 300 }}
// // //           value={dashboardTitle}
// // //           onChange={(e) => setDashboardTitle(e.target.value)}
// // //         />
// // //         <Space wrap={isMobile}>
// // //           <Button icon={<PlusOutlined />} onClick={() => setIsWidgetLibraryVisible(true)}>{!isMobile && "Add widget"}</Button>
// // //           <Dropdown overlay={timeWindowMenu} trigger={["click"]}>
// // //             <Button icon={<ClockCircleOutlined />}>{!isMobile && timeWindow.displayValue} {isMobile && <DownOutlined />}</Button>
// // //           </Dropdown>
// // //           <Button icon={<SettingOutlined />} onClick={() => setIsSettingsVisible(true)}>{!isMobile && "Settings"}</Button>
// // //           {!isMobile && (<>
// // //             <Button icon={<LinkOutlined />} onClick={() => setIsAliasesModalVisible(true)}>Aliases</Button>
// // //             <Button icon={<FilterOutlined />}>Filters</Button>
// // //             <Button icon={<HistoryOutlined />}>Versions</Button>
// // //           </>)}
// // //           {!isTablet && (
// // //             <Button icon={<TeamOutlined />} onClick={handleAssignCustomers}>Assign</Button>
// // //           )}
// // //           <Button icon={<UploadOutlined />} onClick={() => setIsImportModalVisible(true)}>{!isMobile && "Import"}</Button>
// // //           <Button icon={<DownloadOutlined />} onClick={handleExport}>{!isMobile && "Export"}</Button>
// // //           <Button icon={<CloseOutlined />} onClick={handleCancel}>{!isMobile && "Cancel"}</Button>
// // //           <Button icon={<SaveOutlined />} type="primary" onClick={handleSave}>{!isMobile && "Save"}</Button>
// // //           {!isMobile && <Button icon={<FullscreenOutlined />} />}
// // //         </Space>
// // //       </Header>
// // //       <Content style={{
// // //         minHeight: `calc(100vh - 64px)`,
// // //         background: isDarkMode ? "#18181c" : "#f0f2f5",
// // //         overflow: "auto",
// // //         padding: 0,
// // //       }}>
// // //         <div style={{
// // //           minHeight: `calc(100vh - 64px)`,
// // //           background: isDarkMode ? "#18181c" : "#fff",
// // //           boxShadow: "0 1px 4px rgba(0,21,41,.08)",
// // //           display: "flex",
// // //           flexDirection: "column",
// // //           padding: isMobile ? 0 : 0,
// // //         }}>
// // //           {widgets.length === 0 ? (
// // //             <div style={{
// // //               flex: 1,
// // //               display: "flex",
// // //               flexDirection: "column",
// // //               alignItems: "center",
// // //               justifyContent: "center",
// // //               color: "#999",
// // //               minHeight: "200px"
// // //             }}>
// // //               <div style={{ fontSize: "64px", marginBottom: "16px" }}>📊</div>
// // //               <Typography.Title level={4}>No widgets added yet</Typography.Title>
// // //               <Button
// // //                 type="primary"
// // //                 icon={<PlusOutlined />}
// // //                 onClick={() => setIsWidgetLibraryVisible(true)}
// // //                 style={{ marginTop: "16px" }}
// // //               >
// // //                 Add your first widget
// // //               </Button>
// // //             </div>
// // //           ) : (
// // //             <ResponsiveGridLayout
// // //               className="layout"
// // //               layouts={layouts}
// // //               breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
// // //               cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
// // //               rowHeight={40}
// // //               margin={[18, 18]}
// // //               containerPadding={[8, 8]}
// // //               autoSize={true}
// // //               isDraggable={true}
// // //               isResizable={true}
// // //               draggableHandle=".widget-drag-handle"
// // //               resizeHandles={['se', 'e', 's']}
// // //               compactType={null}
// // //               preventCollision={true}
// // //               allowOverlap={false}
// // //               useCSSTransforms={true}
// // //               onLayoutChange={handleLayoutChange}
// // //             >
// // //               {widgets.map((widget) => (
// // //                 <div
// // //                   key={widget.id}
// // //                   className="widget-container"
// // //                   style={{
// // //                     position: "relative",
// // //                     border: isDarkMode ? "1px solid #333" : "1px solid #eee",
// // //                     background: isDarkMode ? "#23232a" : "#fff",
// // //                     display: "flex",
// // //                     flexDirection: "column",
// // //                     minHeight: 0,
// // //                     boxSizing: "border-box",
// // //                   }}
// // //                 >
// // //                   <div
// // //                     style={{
// // //                       position: "absolute",
// // //                       top: 4,
// // //                       right: 4,
// // //                       zIndex: 10,
// // //                       display: "flex",
// // //                       gap: 4,
// // //                       background: isDarkMode ? "rgba(32,32,32,0.95)" : "rgba(255,255,255,0.95)",
// // //                       borderRadius: 4,
// // //                       padding: 2,
// // //                       boxShadow: isDarkMode
// // //                         ? "0 0 4px rgba(0,0,0,0.4)"
// // //                         : "0 0 4px rgba(0,0,0,0.1)",
// // //                     }}
// // //                   >
// // //                     <Button
// // //                       type="text"
// // //                       size="small"
// // //                       icon={<EditOutlined />}
// // //                       onClick={(e) => {
// // //                         e.stopPropagation()
// // //                         handleWidgetSettings(widget)
// // //                       }}
// // //                     />
// // //                     <Button
// // //                       type="text"
// // //                       size="small"
// // //                       icon={<CopyOutlined />}
// // //                       onClick={(e) => {
// // //                         e.stopPropagation()
// // //                         handleDuplicateWidget(widget)
// // //                       }}
// // //                     />
// // //                     <Button
// // //                       type="text"
// // //                       size="small"
// // //                       danger
// // //                       icon={<DeleteOutlined />}
// // //                       onClick={(e) => {
// // //                         e.stopPropagation()
// // //                         handleDeleteWidget(widget.id)
// // //                       }}
// // //                     />
// // //                   </div>
// // //                   <div
// // //                     className="widget-drag-handle"
// // //                     style={{
// // //                       cursor: "move",
// // //                       padding: "5px 5px",
// // //                       fontWeight: 500,
// // //                       fontSize: 14,
// // //                       background: isDarkMode ? "#18181c" : "#f5f5f5",
// // //                       color: isDarkMode ? "#eee" : "#333",
// // //                       minHeight: 38,
// // //                       maxHeight: 38,
// // //                       lineHeight: "28px",
// // //                       flex: "0 0 38px",
// // //                       borderBottom: isDarkMode ? "1px solid #222" : "1px solid #eee",
// // //                       transition: "background 0.2s, color 0.2s, border-bottom 0.2s",
// // //                     }}
// // //                   >
// // //                     {widget.title}
// // //                   </div>
// // //                   <div
// // //                     style={{
// // //                       flex: 1,
// // //                       minHeight: 0,
// // //                       overflow: "auto",
// // //                       padding: 0,
// // //                       background: "inherit"
// // //                     }}
// // //                   >
// // //                     <WidgetRenderer
// // //                       widget={widget}
// // //                       config={{
// // //                         ...widget.config,
// // //                         timeWindow: timeWindow,
// // //                       }}
// // //                     />
// // //                   </div>
// // //                 </div>
// // //               ))}
// // //             </ResponsiveGridLayout>
// // //           )}
// // //         </div>
// // //       </Content>
// // //       <WidgetLibrary
// // //         visible={isWidgetLibraryVisible}
// // //         onClose={() => setIsWidgetLibraryVisible(false)}
// // //         onSelect={handleAddWidget}
// // //       />
// // //       <TimeWindowSettings
// // //         visible={isTimeWindowVisible}
// // //         onClose={() => setIsTimeWindowVisible(false)}
// // //         onSave={handleTimeWindowChange}
// // //         initialValue={timeWindow}
// // //       />
// // //       <DashboardSettings visible={isSettingsVisible} onClose={() => setIsSettingsVisible(false)} />
// // //       <ManageLayoutsModal visible={isLayoutsModalVisible} onClose={() => setIsLayoutsModalVisible(false)} />
// // //       <ManageStatesModal visible={isStatesModalVisible} onClose={() => setIsStatesModalVisible(false)} />
// // //       <EntityAliasesModal visible={isAliasesModalVisible} onClose={() => setIsAliasesModalVisible(false)} />
// // //       <WidgetConfigModal
// // //         visible={isWidgetConfigModalVisible}
// // //         onCancel={() => setIsWidgetConfigModalVisible(false)}
// // //         onSave={handleWidgetConfigSave}
// // //         widget={selectedWidget}
// // //         devices={devices}
// // //       />
// // //       <Modal
// // //         title="Import Dashboard"
// // //         open={isImportModalVisible}
// // //         onCancel={() => setIsImportModalVisible(false)}
// // //         footer={null}
// // //       >
// // //         <div style={{ padding: "20px 0" }}>
// // //           <input
// // //             type="file"
// // //             accept=".json"
// // //             onChange={(e) => {
// // //               if (e.target.files && e.target.files[0]) {
// // //                 handleImportDashboard(e.target.files[0])
// // //               }
// // //             }}
// // //             style={{ marginBottom: "20px" }}
// // //           />
// // //           <Typography.Paragraph>
// // //             Select a dashboard JSON file to import. The file should contain a valid dashboard configuration.
// // //           </Typography.Paragraph>
// // //           <Typography.Text type="secondary">
// // //             Note: Importing a dashboard will replace your current dashboard configuration.
// // //           </Typography.Text>
// // //         </div>
// // //       </Modal>
// // //       <Modal
// // //         title="Assign Dashboard to Customers"
// // //         open={isAssignCustomerModalVisible}
// // //         onCancel={() => setIsAssignCustomerModalVisible(false)}
// // //         onOk={() => {
// // //           form.validateFields().then((values) => {
// // //             handleAssignCustomersSave(values.customers)
// // //           })
// // //         }}
// // //       >
// // //         <Form form={form} layout="vertical" initialValues={{ customers: assignedCustomers }}>
// // //           <Form.Item
// // //             name="customers"
// // //             label="Select Customers"
// // //             rules={[{ required: false, message: "Please select at least one customer" }]}
// // //           >
// // //             <Select mode="multiple" placeholder="Select customers" style={{ width: "100%" }} optionLabelProp="label">
// // //               {customers.map((customer) => (
// // //                 <Select.Option key={customer.id} value={customer.id} label={customer.name}>
// // //                   {customer.name}
// // //                 </Select.Option>
// // //               ))}
// // //             </Select>
// // //           </Form.Item>
// // //           <Typography.Paragraph>
// // //             Assigned customers will be able to view this dashboard in their customer portal.
// // //           </Typography.Paragraph>
// // //         </Form>
// // //       </Modal>
// // //     </Layout>
// // //   )
// // // }

// // // export default DashboardEditor

// // // // "use client"

// // // // import { useState, useEffect } from "react"
// // // // import {
// // // //   Layout,
// // // //   Button,
// // // //   Space,
// // // //   Input,
// // // //   Typography,
// // // //   message,
// // // //   Modal,
// // // //   Form,
// // // //   Select,
// // // //   Dropdown,
// // // //   Menu,
// // // // } from "antd"
// // // // import { useParams, useNavigate } from "react-router-dom"
// // // // import {
// // // //   PlusOutlined,
// // // //   ClockCircleOutlined,
// // // //   SettingOutlined,
// // // //   LinkOutlined,
// // // //   FilterOutlined,
// // // //   HistoryOutlined,
// // // //   CloseOutlined,
// // // //   SaveOutlined,
// // // //   FullscreenOutlined,
// // // //   EditOutlined,
// // // //   DeleteOutlined,
// // // //   CopyOutlined,
// // // //   DownloadOutlined,
// // // //   UploadOutlined,
// // // //   TeamOutlined,
// // // //   DownOutlined,
// // // // } from "@ant-design/icons"
// // // // import { Responsive, WidthProvider } from "react-grid-layout"
// // // // import { saveAs } from "file-saver"
// // // // import "react-grid-layout/css/styles.css"
// // // // import "react-resizable/css/styles.css"

// // // // import WidgetLibrary from "../components/dashboard/WidgetLibrary"
// // // // import TimeWindowSettings from "../components/dashboard/TimeWindowSettings"
// // // // import DashboardSettings from "../components/dashboard/DashboardSettings"
// // // // import ManageLayoutsModal from "../components/dashboard/ManageLayoutsModal"
// // // // import ManageStatesModal from "../components/dashboard/ManageStatesModal"
// // // // import EntityAliasesModal from "../components/dashboard/EntityAliasesModal"
// // // // import WidgetRenderer from "../components/dashboard/WidgetRenderer"
// // // // import WidgetConfigModal from "../components/dashboard/WidgetConfigModal"
// // // // import { useMediaQuery } from "../hooks/useMediaQuery"
// // // // import { useTheme } from "../components/theme/ThemeProvider"
// // // // import { getDashboard, createDashboard, updateDashboard } from "../services/api"
// // // // import { v4 as uuidv4 } from 'uuid'

// // // // const { Header, Content } = Layout
// // // // const ResponsiveGridLayout = WidthProvider(Responsive)

// // // // // --- MOCK DASHBOARD DATA: loads if id === "1" ---
// // // // const MOCK_DASHBOARD = {
// // // //   id: "1",
// // // //   title: "Environmental Monitoring",
// // // //   widgets: [
// // // //     {
// // // //       id: "widget1",
// // // //       title: "Temperature Sensor",
// // // //       type: "line-chart",
// // // //       deviceId: "device1",
// // // //       deviceName: "Temperature Sensor",
// // // //       telemetry: ["temperature", "humidity"],
// // // //       config: {
// // // //         title: "Temperature & Humidity",
// // // //         dataSource: {
// // // //           type: "device",
// // // //           deviceId: "device1",
// // // //           telemetry: ["temperature", "humidity"],
// // // //         },
// // // //         showLegend: true,
// // // //         showPoints: true,
// // // //         height: 300,
// // // //       },
// // // //     },
// // // //     {
// // // //       id: "widget2",
// // // //       title: "Device Status",
// // // //       type: "status-card",
// // // //       deviceId: "device1",
// // // //       deviceName: "Temperature Sensor",
// // // //       telemetry: ["status"],
// // // //       config: {
// // // //         title: "Device Status",
// // // //         dataSource: {
// // // //           type: "device",
// // // //           deviceId: "device1",
// // // //           telemetry: ["status"],
// // // //         },
// // // //         showLastUpdateTime: true,
// // // //       },
// // // //     },
// // // //     {
// // // //       id: "widget3",
// // // //       title: "Battery Level",
// // // //       type: "battery-level",
// // // //       deviceId: "device1",
// // // //       deviceName: "Temperature Sensor",
// // // //       telemetry: ["batteryLevel"],
// // // //       config: {
// // // //         title: "Battery Level",
// // // //         dataSource: {
// // // //           type: "device",
// // // //           deviceId: "device1",
// // // //           telemetry: ["batteryLevel"],
// // // //         },
// // // //         showValue: true,
// // // //       },
// // // //     },
// // // //   ],
// // // //   layouts: {
// // // //     lg: [
// // // //       { i: "widget1", x: 0, y: 0, w: 8, h: 4 },
// // // //       { i: "widget2", x: 8, y: 0, w: 4, h: 2 },
// // // //       { i: "widget3", x: 8, y: 2, w: 4, h: 2 },
// // // //     ],
// // // //     md: [
// // // //       { i: "widget1", x: 0, y: 0, w: 8, h: 4 },
// // // //       { i: "widget2", x: 8, y: 0, w: 4, h: 2 },
// // // //       { i: "widget3", x: 8, y: 2, w: 4, h: 2 },
// // // //     ],
// // // //     sm: [
// // // //       { i: "widget1", x: 0, y: 0, w: 12, h: 4 },
// // // //       { i: "widget2", x: 0, y: 4, w: 6, h: 2 },
// // // //       { i: "widget3", x: 6, y: 4, w: 6, h: 2 },
// // // //     ],
// // // //     xs: [
// // // //       { i: "widget1", x: 0, y: 0, w: 12, h: 4 },
// // // //       { i: "widget2", x: 0, y: 4, w: 12, h: 2 },
// // // //       { i: "widget3", x: 0, y: 6, w: 12, h: 2 },
// // // //     ],
// // // //   },
// // // //   settings: {
// // // //     timewindow: {
// // // //       realtime: { timewindowMs: 60000 },
// // // //       aggregation: { type: "AVG", limit: 200 },
// // // //     },
// // // //     gridSettings: {
// // // //       backgroundColor: "#ffffff",
// // // //       columns: 24,
// // // //       margin: [10, 10],
// // // //       backgroundImage: null,
// // // //     },
// // // //   },
// // // //   assignedCustomers: ["customer1", "customer2"],
// // // // }

// // // // // -- END MOCK DATA --

// // // // const DashboardEditor = () => {
// // // //   const { theme, isDarkMode } = useTheme()
// // // //   const { id } = useParams()
// // // //   const navigate = useNavigate()
// // // //   const [isWidgetLibraryVisible, setIsWidgetLibraryVisible] = useState(false)
// // // //   const [isTimeWindowVisible, setIsTimeWindowVisible] = useState(false)
// // // //   const [isSettingsVisible, setIsSettingsVisible] = useState(false)
// // // //   const [selectedWidget, setSelectedWidget] = useState(null)
// // // //   const [widgets, setWidgets] = useState([])
// // // //   const [layouts, setLayouts] = useState({ lg: [], md: [], sm: [], xs: [] })
// // // //   const [isLayoutsModalVisible, setIsLayoutsModalVisible] = useState(false)
// // // //   const [isStatesModalVisible, setIsStatesModalVisible] = useState(false)
// // // //   const [isAliasesModalVisible, setIsAliasesModalVisible] = useState(false)
// // // //   const [dashboardTitle, setDashboardTitle] = useState("New Dashboard")
// // // //   const [dashboardSettings, setDashboardSettings] = useState({
// // // //     timewindow: {
// // // //       realtime: { timewindowMs: 60000 },
// // // //       aggregation: { type: "AVG", limit: 200 },
// // // //     },
// // // //     gridSettings: {
// // // //       backgroundColor: "#ffffff",
// // // //       columns: 24,
// // // //       margin: [10, 10],
// // // //       backgroundImage: null,
// // // //     },
// // // //   })
// // // //   const [isImportModalVisible, setIsImportModalVisible] = useState(false)
// // // //   const [isAssignCustomerModalVisible, setIsAssignCustomerModalVisible] = useState(false)
// // // //   const [isWidgetConfigModalVisible, setIsWidgetConfigModalVisible] = useState(false)
// // // //   const [timeWindow, setTimeWindow] = useState({
// // // //     displayValue: "Last 15 minutes",
// // // //     value: "15_minutes",
// // // //     type: "REALTIME",
// // // //   })
// // // //   const [form] = Form.useForm()
// // // //   const isMobile = useMediaQuery("(max-width: 768px)")
// // // //   const isTablet = useMediaQuery("(max-width: 992px)")
// // // //   const [devices, setDevices] = useState([
// // // //     { id: "device1", name: "Rack Board" },
// // // //     { id: "device2", name: "Pressure Valve" },
// // // //     { id: "device3", name: "Power Meter" },
// // // //   ])
// // // //   const [customers, setCustomers] = useState([
// // // //     { id: "customer1", name: "Demo Customer" },
// // // //     { id: "customer2", name: "Device Claiming Customer" },
// // // //     { id: "customer3", name: "Customer A" },
// // // //   ])
// // // //   const [assignedCustomers, setAssignedCustomers] = useState([])

// // // //   // Load dashboard data when component mounts
// // // //   useEffect(() => {
// // // //     if (id && id !== "new") {
// // // //       // If "1", load mock data
// // // //       if (id === "1") {
// // // //         setDashboardTitle(MOCK_DASHBOARD.title)
// // // //         setWidgets(MOCK_DASHBOARD.widgets)
// // // //         setLayouts(MOCK_DASHBOARD.layouts)
// // // //         setDashboardSettings(MOCK_DASHBOARD.settings)
// // // //         setAssignedCustomers(MOCK_DASHBOARD.assignedCustomers)
// // // //       } else {
// // // //         fetchDashboard(id)
// // // //       }
// // // //     } else {
// // // //       setDashboardTitle("New Dashboard")
// // // //     }
// // // //   }, [id])

// // // //   // const fetchDashboard = async (dashboardId) => {
// // // //   //   try {
// // // //   //     const dashboard = await getDashboard(dashboardId)
// // // //   //     setDashboardTitle(dashboard.title || "Untitled")
// // // //   //     setWidgets(Array.isArray(dashboard.widgets)
// // // //   //       ? dashboard.widgets
// // // //   //       : JSON.parse(dashboard.widgets || "[]"))
// // // //   //     setLayouts(typeof dashboard.layouts === "object"
// // // //   //       ? dashboard.layouts
// // // //   //       : JSON.parse(dashboard.layouts || "{}"))
// // // //   //     setDashboardSettings(typeof dashboard.settings === "object"
// // // //   //       ? dashboard.settings
// // // //   //       : JSON.parse(dashboard.settings || "{}"))
// // // //   //     setAssignedCustomers(dashboard.assignedCustomers || [])
// // // //   //     setTimeWindow(typeof dashboard.timewindow === "object"
// // // //   //       ? dashboard.timewindow
// // // //   //       : JSON.parse(dashboard.timewindow || "{}"))
// // // //   //   } catch (error) {
// // // //   //     console.error("Error loading dashboard:", error)
// // // //   //     message.error("Unable to load dashboard from server")
// // // //   //   }
// // // //   // }
// // // //   const fetchDashboard = async (dashboardId) => {
// // // //     try {
// // // //       if (dashboardId === "1") {
// // // //         setDashboardTitle(MOCK_DASHBOARD.title)
// // // //         setWidgets(MOCK_DASHBOARD.widgets)
// // // //         setLayouts(MOCK_DASHBOARD.layouts)
// // // //         setDashboardSettings(MOCK_DASHBOARD.settings)
// // // //         setAssignedCustomers(MOCK_DASHBOARD.assignedCustomers)
// // // //         // Optionally: return here so we don't fetch from backend
// // // //         return
// // // //       }
// // // //       // --- real API call for other IDs ---
// // // //       const dashboard = await getDashboard(dashboardId)
// // // //       setDashboardTitle(dashboard.title || "Untitled")
// // // //       setWidgets(Array.isArray(dashboard.widgets)
// // // //         ? dashboard.widgets
// // // //         : JSON.parse(dashboard.widgets || "[]"))
// // // //       setLayouts(typeof dashboard.layouts === "object"
// // // //         ? dashboard.layouts
// // // //         : JSON.parse(dashboard.layouts || "{}"))
// // // //       setDashboardSettings(typeof dashboard.settings === "object"
// // // //         ? dashboard.settings
// // // //         : JSON.parse(dashboard.settings || "{}"))
// // // //       setAssignedCustomers(dashboard.assignedCustomers || [])
// // // //       setTimeWindow(typeof dashboard.timewindow === "object"
// // // //         ? dashboard.timewindow
// // // //         : JSON.parse(dashboard.timewindow || "{}"))
// // // //     } catch (error) {
// // // //       // Always fall back to mock data if there's an error
// // // //       setDashboardTitle(MOCK_DASHBOARD.title)
// // // //       setWidgets(MOCK_DASHBOARD.widgets)
// // // //       setLayouts(MOCK_DASHBOARD.layouts)
// // // //       setDashboardSettings(MOCK_DASHBOARD.settings)
// // // //       setAssignedCustomers(MOCK_DASHBOARD.assignedCustomers)
// // // //       message.warn("Falling back to mock dashboard.")
// // // //     }
// // // //   }

// // // //   // --- Widget operations ---

// // // //   const handleAddWidget = (widget) => {
// // // //     const widgetId = uuidv4()
// // // //     const newWidget = {
// // // //       ...widget,
// // // //       id: widgetId,
// // // //       config: {
// // // //         title: widget.title,
// // // //         dataSource: {
// // // //           type: "device",
// // // //           deviceId: null,
// // // //           telemetry: [],
// // // //         },
// // // //         ...(widget.type.includes("chart")
// // // //           ? { height: 300, showLegend: true, showPoints: true }
// // // //           : {}),
// // // //         ...(widget.type.includes("map")
// // // //           ? { zoom: 4, center: { lat: 37.7749, lng: -122.4194 } }
// // // //           : {}),
// // // //       },
// // // //     }

// // // //     setWidgets([...widgets, newWidget])

// // // //     const newLayout = {
// // // //       i: widgetId,
// // // //       x: (layouts.lg.length * 4) % 12,
// // // //       y: Number.POSITIVE_INFINITY,
// // // //       w: 4,
// // // //       h: 4,
// // // //       minW: 2,
// // // //       minH: 2,
// // // //     }
// // // //     setLayouts({
// // // //       lg: [...layouts.lg, newLayout],
// // // //       md: [...layouts.md, { ...newLayout, w: Math.min(newLayout.w, 8) }],
// // // //       sm: [...layouts.sm, { ...newLayout, w: Math.min(newLayout.w * 2, 12), x: 0 }],
// // // //       xs: [...layouts.xs, { ...newLayout, w: 12, x: 0 }],
// // // //     })

// // // //     setIsWidgetLibraryVisible(false)
// // // //     setSelectedWidget(newWidget)
// // // //     setIsWidgetConfigModalVisible(true)
// // // //   }

// // // //   const handleWidgetSettings = (widget) => {
// // // //     setSelectedWidget(widget)
// // // //     setIsWidgetConfigModalVisible(true)
// // // //   }

// // // //   const handleWidgetConfigSave = (updatedWidget) => {
// // // //     setWidgets((prevWidgets) =>
// // // //       prevWidgets.map((w) => (w.id === updatedWidget.id ? { ...w, ...updatedWidget } : w))
// // // //     )
// // // //     setIsWidgetConfigModalVisible(false)
// // // //     message.success("Widget configuration updated")
// // // //   }

// // // //   const handleDeleteWidget = (widgetId) => {
// // // //     Modal.confirm({
// // // //       title: "Are you sure you want to delete this widget?",
// // // //       content: "This action cannot be undone.",
// // // //       okText: "Yes",
// // // //       okType: "danger",
// // // //       cancelText: "No",
// // // //       onOk() {
// // // //         setWidgets(widgets.filter((w) => w.id !== widgetId))
// // // //         setLayouts({
// // // //           lg: layouts.lg.filter((item) => item.i !== widgetId),
// // // //           md: layouts.md.filter((item) => item.i !== widgetId),
// // // //           sm: layouts.sm.filter((item) => item.i !== widgetId),
// // // //           xs: layouts.xs.filter((item) => item.i !== widgetId),
// // // //         })
// // // //         message.success("Widget deleted")
// // // //       },
// // // //     })
// // // //   }

// // // //   const handleDuplicateWidget = (widget) => {
// // // //     const newWidgetId = uuidv4()
// // // //     const newWidget = {
// // // //       ...widget,
// // // //       id: newWidgetId,
// // // //       title: `${widget.title} (Copy)`,
// // // //       config: { ...widget.config },
// // // //     }
// // // //     setWidgets([...widgets, newWidget])
// // // //     const originalLayout = layouts.lg.find((item) => item.i === widget.id)
// // // //     if (originalLayout) {
// // // //       const newLayout = {
// // // //         ...originalLayout,
// // // //         i: newWidgetId,
// // // //         x: (originalLayout.x + 1) % 12,
// // // //         y: originalLayout.y + 1,
// // // //       }
// // // //       setLayouts({
// // // //         lg: [...layouts.lg, newLayout],
// // // //         md: [...layouts.md, { ...newLayout, w: Math.min(newLayout.w, 8) }],
// // // //         sm: [...layouts.sm, { ...newLayout, w: Math.min(newLayout.w * 2, 12), x: 0 }],
// // // //         xs: [...layouts.xs, { ...newLayout, w: 12, x: 0 }],
// // // //       })
// // // //     }
// // // //     message.success("Widget duplicated")
// // // //   }

// // // //   const handleLayoutChange = (layout, allLayouts) => {
// // // //     setLayouts(allLayouts)
// // // //   }

// // // //   const handleTimeWindowChange = (newTimeWindow) => {
// // // //     setTimeWindow(newTimeWindow)
// // // //     setIsTimeWindowVisible(false)
// // // //   }

// // // //   const handleAssignCustomers = () => {
// // // //     setIsAssignCustomerModalVisible(true)
// // // //   }
// // // //   const handleAssignCustomersSave = (selectedCustomers) => {
// // // //     setAssignedCustomers(selectedCustomers)
// // // //     setIsAssignCustomerModalVisible(false)
// // // //     message.success("Dashboard assigned to customers")
// // // //   }

// // // //   // --- Save/Export dashboard: widgets is the FULL state ---
// // // //   const handleSave = async () => {
// // // //     const dashboardState = {
// // // //       id: id && id !== "new" ? id : uuidv4(),
// // // //       title: dashboardTitle,
// // // //       widgets: JSON.stringify(widgets),  // full state!
// // // //       layouts: JSON.stringify(layouts),
// // // //       settings: JSON.stringify(dashboardSettings),
// // // //       assignedCustomers,
// // // //       timewindow: JSON.stringify(timeWindow),
// // // //       version: "1.0.0",
// // // //     }

// // // //     try {
// // // //       let result
// // // //       if (id && id !== "new") {
// // // //         result = await updateDashboard(id, dashboardState)
// // // //         message.success("Dashboard updated")
// // // //       } else {
// // // //         result = await createDashboard(dashboardState)
// // // //         message.success("Dashboard created")
// // // //         navigate(`/dashboards/${result.id}`)
// // // //       }
// // // //     } catch (err) {
// // // //       console.error(err)
// // // //       message.error("Failed to save dashboard")
// // // //     }
// // // //   }

// // // //   const handleExport = () => {
// // // //     const dashboardState = {
// // // //       id: id && id !== "new" ? id : uuidv4(),
// // // //       title: dashboardTitle,
// // // //       widgets,
// // // //       layouts,
// // // //       settings: dashboardSettings,
// // // //       assignedCustomers,
// // // //       timeWindow,
// // // //       version: "1.0.0",
// // // //       createdTime: new Date().toISOString(),
// // // //     }

// // // //     const dashboardJson = JSON.stringify(dashboardState, null, 2)
// // // //     const blob = new Blob([dashboardJson], { type: "application/json" })
// // // //     saveAs(blob, `${dashboardTitle.replace(/\s+/g, "_").toLowerCase()}_dashboard.json`)
// // // //     message.success("Dashboard exported successfully")
// // // //   }

// // // //   const handleImportDashboard = (file) => {
// // // //     const reader = new FileReader()
// // // //     reader.onload = (e) => {
// // // //       try {
// // // //         const dashboardData = JSON.parse(e.target.result)
// // // //         if (!dashboardData.widgets || !dashboardData.layouts) throw new Error("Invalid dashboard file format")
// // // //         setDashboardTitle(dashboardData.title || "Imported Dashboard")
// // // //         setWidgets(dashboardData.widgets || [])
// // // //         setLayouts(dashboardData.layouts || { lg: [], md: [], sm: [], xs: [] })
// // // //         setDashboardSettings(dashboardData.settings || dashboardSettings)
// // // //         setAssignedCustomers(dashboardData.assignedCustomers || [])
// // // //         setTimeWindow(dashboardData.timewindow || timeWindow)
// // // //         setIsImportModalVisible(false)
// // // //         message.success("Dashboard imported successfully")
// // // //       } catch (error) {
// // // //         console.error("Error importing dashboard:", error)
// // // //         message.error("Failed to import dashboard. Invalid file format.")
// // // //       }
// // // //     }
// // // //     reader.readAsText(file)
// // // //   }

// // // //   const handleCancel = () => {
// // // //     navigate("/dashboards")
// // // //   }

// // // //   const timeWindowMenu = (
// // // //     <Menu>
// // // //       <Menu.Item
// // // //         key="realtime_15_minutes"
// // // //         onClick={() =>
// // // //           handleTimeWindowChange({ displayValue: "Last 15 minutes", value: "15_minutes", type: "REALTIME" })
// // // //         }
// // // //       >Last 15 minutes</Menu.Item>
// // // //       <Menu.Item
// // // //         key="realtime_30_minutes"
// // // //         onClick={() =>
// // // //           handleTimeWindowChange({ displayValue: "Last 30 minutes", value: "30_minutes", type: "REALTIME" })
// // // //         }
// // // //       >Last 30 minutes</Menu.Item>
// // // //       <Menu.Item
// // // //         key="realtime_1_hour"
// // // //         onClick={() => handleTimeWindowChange({ displayValue: "Last 1 hour", value: "1_hour", type: "REALTIME" })}
// // // //       >Last 1 hour</Menu.Item>
// // // //       <Menu.Item
// // // //         key="realtime_6_hours"
// // // //         onClick={() => handleTimeWindowChange({ displayValue: "Last 6 hours", value: "6_hours", type: "REALTIME" })}
// // // //       >Last 6 hours</Menu.Item>
// // // //       <Menu.Item
// // // //         key="realtime_1_day"
// // // //         onClick={() => handleTimeWindowChange({ displayValue: "Last 1 day", value: "1_day", type: "REALTIME" })}
// // // //       >Last 1 day</Menu.Item>
// // // //       <Menu.Item key="custom" onClick={() => setIsTimeWindowVisible(true)}>
// // // //         Custom...
// // // //       </Menu.Item>
// // // //     </Menu>
// // // //   )

// // // //   // --- Generate mock data for each widget (by telemetry keys) ---
// // // //   const generateMockData = (telemetry, timeWindow) => {
// // // //     if (!telemetry || telemetry.length === 0) return []
// // // //     const now = new Date()
// // // //     const data = []
// // // //     let timeRange = 900000 // 15 min default
// // // //     switch (timeWindow.value) {
// // // //       case "30_minutes": timeRange = 1800000; break
// // // //       case "1_hour": timeRange = 3600000; break
// // // //       case "6_hours": timeRange = 21600000; break
// // // //       case "1_day": timeRange = 86400000; break
// // // //       default: timeRange = 900000
// // // //     }
// // // //     const numPoints = 100
// // // //     const interval = timeRange / numPoints
// // // //     for (let i = 0; i < numPoints; i++) {
// // // //       const time = new Date(now.getTime() - (numPoints - i) * interval)
// // // //       const point = { time: time.toISOString() }
// // // //       telemetry.forEach((key) => {
// // // //         if (key === "temperature") point[key] = 25 + 5 * Math.sin((i / numPoints) * Math.PI * 2) + Math.random() * 2 - 1
// // // //         else if (key === "humidity") point[key] = 50 + 10 * Math.cos((i / numPoints) * Math.PI * 2) + Math.random() * 5 - 2.5
// // // //         else if (key === "batteryLevel") point[key] = 100 - (20 * i) / numPoints - Math.random() * 2
// // // //         else if (key === "signalStrength") point[key] = 75 + 15 * Math.sin((i / numPoints) * Math.PI * 4) + Math.random() * 5 - 2.5
// // // //         else if (key === "status") point[key] = Math.random() > 0.1 ? "Online" : "Offline"
// // // //         else point[key] = Math.random() * 100
// // // //       })
// // // //       data.push(point)
// // // //     }
// // // //     return data
// // // //   }

// // // //   return (
// // // //     <Layout style={{ minHeight: "100vh" }} className={isDarkMode ? "dark-theme" : ""}>
// // // //       <Header style={{
// // // //         background: isDarkMode ? "#1f1f1f" : "#fff",
// // // //         padding: "0 16px",
// // // //         display: "flex",
// // // //         justifyContent: "space-between",
// // // //         alignItems: "center",
// // // //         height: "64px",
// // // //         boxShadow: "0 1px 4px rgba(0,21,41,.08)",
// // // //       }}>
// // // //         <Input
// // // //           placeholder="Dashboard title"
// // // //           style={{ width: isMobile ? 150 : 300 }}
// // // //           value={dashboardTitle}
// // // //           onChange={(e) => setDashboardTitle(e.target.value)}
// // // //         />
// // // //         <Space wrap={isMobile}>
// // // //           <Button icon={<PlusOutlined />} onClick={() => setIsWidgetLibraryVisible(true)}>{!isMobile && "Add widget"}</Button>
// // // //           <Dropdown overlay={timeWindowMenu} trigger={["click"]}>
// // // //             <Button icon={<ClockCircleOutlined />}>{!isMobile && timeWindow.displayValue} {isMobile && <DownOutlined />}</Button>
// // // //           </Dropdown>
// // // //           <Button icon={<SettingOutlined />} onClick={() => setIsSettingsVisible(true)}>{!isMobile && "Settings"}</Button>
// // // //           {!isMobile && (<>
// // // //             <Button icon={<LinkOutlined />} onClick={() => setIsAliasesModalVisible(true)}>Aliases</Button>
// // // //             <Button icon={<FilterOutlined />}>Filters</Button>
// // // //             <Button icon={<HistoryOutlined />}>Versions</Button>
// // // //           </>)}
// // // //           {!isTablet && (
// // // //             <Button icon={<TeamOutlined />} onClick={handleAssignCustomers}>Assign</Button>
// // // //           )}
// // // //           <Button icon={<UploadOutlined />} onClick={() => setIsImportModalVisible(true)}>{!isMobile && "Import"}</Button>
// // // //           <Button icon={<DownloadOutlined />} onClick={handleExport}>{!isMobile && "Export"}</Button>
// // // //           <Button icon={<CloseOutlined />} onClick={handleCancel}>{!isMobile && "Cancel"}</Button>
// // // //           <Button icon={<SaveOutlined />} type="primary" onClick={handleSave}>{!isMobile && "Save"}</Button>
// // // //           {!isMobile && <Button icon={<FullscreenOutlined />} />}
// // // //         </Space>
// // // //       </Header>
// // // //       <Content style={{
// // // //         minHeight: `calc(100vh - 64px)`,
// // // //         background: isDarkMode ? "#18181c" : "#f0f2f5",
// // // //         overflow: "auto",
// // // //         padding: 0,
// // // //       }}>
// // // //         <div style={{
// // // //           minHeight: `calc(100vh - 64px)`,
// // // //           background: isDarkMode ? "#18181c" : "#fff",
// // // //           boxShadow: "0 1px 4px rgba(0,21,41,.08)",
// // // //           display: "flex",
// // // //           flexDirection: "column",
// // // //           padding: isMobile ? 0 : 0,
// // // //         }}>
// // // //           {widgets.length === 0 ? (
// // // //             <div style={{
// // // //               flex: 1,
// // // //               display: "flex",
// // // //               flexDirection: "column",
// // // //               alignItems: "center",
// // // //               justifyContent: "center",
// // // //               color: "#999",
// // // //               minHeight: "200px"
// // // //             }}>
// // // //               <div style={{ fontSize: "64px", marginBottom: "16px" }}>📊</div>
// // // //               <Typography.Title level={4}>No widgets added yet</Typography.Title>
// // // //               <Button
// // // //                 type="primary"
// // // //                 icon={<PlusOutlined />}
// // // //                 onClick={() => setIsWidgetLibraryVisible(true)}
// // // //                 style={{ marginTop: "16px" }}
// // // //               >
// // // //                 Add your first widget
// // // //               </Button>
// // // //             </div>
// // // //           ) : (
// // // //             <ResponsiveGridLayout
// // // //               // className="layout"
// // // //               // layouts={layouts}
// // // //               // breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
// // // //               // cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
// // // //               // rowHeight={100}
// // // //               // onLayoutChange={handleLayoutChange}
// // // //               // isDraggable={true}
// // // //               // isResizable={true}
// // // //               // compactType={null}           // <--- disables auto-compaction, so widgets move independently!
// // // //               // preventCollision={true}     // 
// // // //               // margin={[10, 10]}
// // // //               // draggableHandle=".widget-drag-handle"
// // // //               className="layout"
// // // //               layouts={layouts}  // Responsive layouts for all breakpoints
// // // //               breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
// // // //               cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
// // // //               rowHeight={30}             // Fine vertical resize steps (30px typical)
// // // //               width={1200}               // Set this if you want a fixed grid width, else auto
// // // //               margin={[10, 10]}          // Space between widgets
// // // //               containerPadding={[0, 0]}  // No padding around grid (set if you want padding)
// // // //               autoSize={true}            // Grid height grows with widgets
// // // //               isDraggable={true}         // Drag widgets with mouse
// // // //               isResizable={true}         // Allow resize
// // // //               draggableHandle=".widget-drag-handle" // Only drag using handle, not whole widget
// // // //               resizeHandles={['se', 'e', 's']} // Show resizer handles (south-east, east, south)
// // // //               compactType={null}         // No auto-compaction (industry best-practice)
// // // //               preventCollision={true}   // Allow free movement even if temp collision (best UX)
// // // //               allowOverlap={false}       // Prevents saving/overlapping final layout
// // // //               useCSSTransforms={true}    // Animations
// // // //               measureBeforeMount={false} // Only set to true if grid mismeasures on load
// // // //               droppingItem={undefined}   // Used for drag'n'drop external widget support
// // // //               onLayoutChange={handleLayoutChange}
// // // //               // onBreakpointChange={handleBreakpointChange} // (optional)
// // // //               // onWidthChange={handleWidthChange} // (optional)
// // // //             >
// // // //               {widgets.map((widget) => (
// // // //                 <div
// // // //                   key={widget.id}
// // // //                   className="widget-container"
// // // //                   style={{
// // // //                     position: "relative",
// // // //                     border: isDarkMode ? "1px solid #333" : "1px solid #eee",
// // // //                     background: isDarkMode ? "#23232a" : "#fff",
// // // //                     transition: "background 0.2s, border 0.2s",
// // // //                     height: "100%",
// // // //                     display: "flex",
// // // //                     flexDirection: "column",
// // // //                     minHeight: 0,
// // // //                     boxSizing: "border-box",
// // // //                   }}
// // // //                 >
// // // //                   <div
// // // //                     style={{
// // // //                       position: "absolute",
// // // //                       top: 4,
// // // //                       right: 4,
// // // //                       zIndex: 10,
// // // //                       display: "flex",
// // // //                       gap: 4,
// // // //                       background: isDarkMode ? "rgba(32,32,32,0.95)" : "rgba(255,255,255,0.95)",
// // // //                       borderRadius: 4,
// // // //                       padding: 2,
// // // //                       boxShadow: isDarkMode
// // // //                         ? "0 0 4px rgba(0,0,0,0.4)"
// // // //                         : "0 0 4px rgba(0,0,0,0.1)",
// // // //                     }}
// // // //                   >
// // // //                     <Button
// // // //                       type="text"
// // // //                       size="small"
// // // //                       icon={<EditOutlined />}
// // // //                       onClick={(e) => {
// // // //                         e.stopPropagation()
// // // //                         handleWidgetSettings(widget)
// // // //                       }}
// // // //                     />
// // // //                     <Button
// // // //                       type="text"
// // // //                       size="small"
// // // //                       icon={<CopyOutlined />}
// // // //                       onClick={(e) => {
// // // //                         e.stopPropagation()
// // // //                         handleDuplicateWidget(widget)
// // // //                       }}
// // // //                     />
// // // //                     <Button
// // // //                       type="text"
// // // //                       size="small"
// // // //                       danger
// // // //                       icon={<DeleteOutlined />}
// // // //                       onClick={(e) => {
// // // //                         e.stopPropagation()
// // // //                         handleDeleteWidget(widget.id)
// // // //                       }}
// // // //                     />
// // // //                   </div>
// // // //                   <div
// // // //                     className="widget-drag-handle"
// // // //                     style={{
// // // //                       cursor: "move",
// // // //                       padding: "5px 5px",
// // // //                       fontWeight: 500,
// // // //                       fontSize: 14,
// // // //                       background: isDarkMode ? "#18181c" : "#f5f5f5",
// // // //                       color: isDarkMode ? "#eee" : "#333",
// // // //                       minHeight: 38,
// // // //                       maxHeight: 38,
// // // //                       lineHeight: "28px",
// // // //                       flex: "0 0 38px",
// // // //                       borderBottom: isDarkMode ? "1px solid #222" : "1px solid #eee",
// // // //                       transition: "background 0.2s, color 0.2s, border-bottom 0.2s",
// // // //                     }}
// // // //                   >
// // // //                     {widget.title}
// // // //                   </div>
// // // //                   <div
// // // //                     style={{
// // // //                       flex: 1,
// // // //                       minHeight: 0,
// // // //                       overflow: "auto",
// // // //                       padding: 0,
// // // //                       background: "inherit"
// // // //                     }}
// // // //                   >
// // // //                     {/* <WidgetRenderer
// // // //                       widget={widget}
// // // //                       config={{
// // // //                         ...widget.config,
// // // //                         data: generateMockData(
// // // //                           widget.config?.dataSource?.telemetry ||
// // // //                             widget.telemetry ||
// // // //                             [],
// // // //                           timeWindow
// // // //                         ),
// // // //                         timeWindow: timeWindow,
// // // //                       }}
// // // //                     /> */}
// // // //                     {/* <WidgetRenderer
// // // //                       widget={widget}
// // // //                       config={{
// // // //                         ...widget.config,
// // // //                         // Only inject mock data if it's a static widget!
// // // //                         ...(widget.config?.dataSource?.type === "static"
// // // //                           ? { data: generateMockData(widget.config?.dataSource?.telemetry || [], timeWindow) }
// // // //                           : {}),
// // // //                         timeWindow: timeWindow,
// // // //                       }}
// // // //                     /> */}
// // // //                         <WidgetRenderer
// // // //                           widget={widget}
// // // //                           config={{
// // // //                             ...widget.config,
// // // //                             timeWindow: timeWindow,
// // // //                           }}
// // // //                         />

// // // //                   </div>
// // // //                 </div>
// // // //               ))}
// // // //             </ResponsiveGridLayout>
// // // //           )}
// // // //         </div>
// // // //       </Content>
// // // //       <WidgetLibrary
// // // //         visible={isWidgetLibraryVisible}
// // // //         onClose={() => setIsWidgetLibraryVisible(false)}
// // // //         onSelect={handleAddWidget}
// // // //       />
// // // //       <TimeWindowSettings
// // // //         visible={isTimeWindowVisible}
// // // //         onClose={() => setIsTimeWindowVisible(false)}
// // // //         onSave={handleTimeWindowChange}
// // // //         initialValue={timeWindow}
// // // //       />
// // // //       <DashboardSettings visible={isSettingsVisible} onClose={() => setIsSettingsVisible(false)} />
// // // //       <ManageLayoutsModal visible={isLayoutsModalVisible} onClose={() => setIsLayoutsModalVisible(false)} />
// // // //       <ManageStatesModal visible={isStatesModalVisible} onClose={() => setIsStatesModalVisible(false)} />
// // // //       <EntityAliasesModal visible={isAliasesModalVisible} onClose={() => setIsAliasesModalVisible(false)} />
// // // //       <WidgetConfigModal
// // // //         visible={isWidgetConfigModalVisible}
// // // //         onCancel={() => setIsWidgetConfigModalVisible(false)}
// // // //         onSave={handleWidgetConfigSave}
// // // //         widget={selectedWidget}
// // // //         devices={devices}
// // // //       />
// // // //       <Modal
// // // //         title="Import Dashboard"
// // // //         open={isImportModalVisible}
// // // //         onCancel={() => setIsImportModalVisible(false)}
// // // //         footer={null}
// // // //       >
// // // //         <div style={{ padding: "20px 0" }}>
// // // //           <input
// // // //             type="file"
// // // //             accept=".json"
// // // //             onChange={(e) => {
// // // //               if (e.target.files && e.target.files[0]) {
// // // //                 handleImportDashboard(e.target.files[0])
// // // //               }
// // // //             }}
// // // //             style={{ marginBottom: "20px" }}
// // // //           />
// // // //           <Typography.Paragraph>
// // // //             Select a dashboard JSON file to import. The file should contain a valid dashboard configuration.
// // // //           </Typography.Paragraph>
// // // //           <Typography.Text type="secondary">
// // // //             Note: Importing a dashboard will replace your current dashboard configuration.
// // // //           </Typography.Text>
// // // //         </div>
// // // //       </Modal>
// // // //       <Modal
// // // //         title="Assign Dashboard to Customers"
// // // //         open={isAssignCustomerModalVisible}
// // // //         onCancel={() => setIsAssignCustomerModalVisible(false)}
// // // //         onOk={() => {
// // // //           form.validateFields().then((values) => {
// // // //             handleAssignCustomersSave(values.customers)
// // // //           })
// // // //         }}
// // // //       >
// // // //         <Form form={form} layout="vertical" initialValues={{ customers: assignedCustomers }}>
// // // //           <Form.Item
// // // //             name="customers"
// // // //             label="Select Customers"
// // // //             rules={[{ required: false, message: "Please select at least one customer" }]}
// // // //           >
// // // //             <Select mode="multiple" placeholder="Select customers" style={{ width: "100%" }} optionLabelProp="label">
// // // //               {customers.map((customer) => (
// // // //                 <Select.Option key={customer.id} value={customer.id} label={customer.name}>
// // // //                   {customer.name}
// // // //                 </Select.Option>
// // // //               ))}
// // // //             </Select>
// // // //           </Form.Item>
// // // //           <Typography.Paragraph>
// // // //             Assigned customers will be able to view this dashboard in their customer portal.
// // // //           </Typography.Paragraph>
// // // //         </Form>
// // // //       </Modal>
// // // //     </Layout>
// // // //   )
// // // // }

// // // // export default DashboardEditor


// // // // // "use client"

// // // // // import { useState, useEffect } from "react"
// // // // // import {
// // // // //   Layout,
// // // // //   Button,
// // // // //   Space,
// // // // //   Input,
// // // // //   Typography,
// // // // //   message,
// // // // //   Modal,
// // // // //   Form,
// // // // //   Select,
// // // // //   Dropdown,
// // // // //   Menu,
// // // // // } from "antd"
// // // // // import { useParams, useNavigate } from "react-router-dom"
// // // // // import {
// // // // //   PlusOutlined,
// // // // //   ClockCircleOutlined,
// // // // //   SettingOutlined,
// // // // //   LinkOutlined,
// // // // //   FilterOutlined,
// // // // //   HistoryOutlined,
// // // // //   CloseOutlined,
// // // // //   SaveOutlined,
// // // // //   FullscreenOutlined,
// // // // //   EditOutlined,
// // // // //   DeleteOutlined,
// // // // //   CopyOutlined,
// // // // //   DownloadOutlined,
// // // // //   UploadOutlined,
// // // // //   TeamOutlined,
// // // // //   DownOutlined,
// // // // // } from "@ant-design/icons"
// // // // // import { Responsive, WidthProvider } from "react-grid-layout"
// // // // // import { saveAs } from "file-saver"
// // // // // import "react-grid-layout/css/styles.css"
// // // // // import "react-resizable/css/styles.css"

// // // // // import WidgetLibrary from "../components/dashboard/WidgetLibrary"
// // // // // import TimeWindowSettings from "../components/dashboard/TimeWindowSettings"
// // // // // import DashboardSettings from "../components/dashboard/DashboardSettings"
// // // // // import ManageLayoutsModal from "../components/dashboard/ManageLayoutsModal"
// // // // // import ManageStatesModal from "../components/dashboard/ManageStatesModal"
// // // // // import EntityAliasesModal from "../components/dashboard/EntityAliasesModal"
// // // // // import WidgetRenderer from "../components/dashboard/WidgetRenderer"
// // // // // import WidgetConfigModal from "../components/dashboard/WidgetConfigModal"
// // // // // import { useMediaQuery } from "../hooks/useMediaQuery"
// // // // // import { useTheme } from "../components/theme/ThemeProvider"
// // // // // import { getDashboard, createDashboard, updateDashboard } from "../services/api"
// // // // // import { v4 as uuidv4 } from 'uuid'

// // // // // const { Header, Content } = Layout
// // // // // const ResponsiveGridLayout = WidthProvider(Responsive)

// // // // // const DashboardEditor = () => {
// // // // //   const { theme, isDarkMode } = useTheme()
// // // // //   const { id } = useParams()
// // // // //   const navigate = useNavigate()
// // // // //   const [isWidgetLibraryVisible, setIsWidgetLibraryVisible] = useState(false)
// // // // //   const [isTimeWindowVisible, setIsTimeWindowVisible] = useState(false)
// // // // //   const [isSettingsVisible, setIsSettingsVisible] = useState(false)
// // // // //   const [selectedWidget, setSelectedWidget] = useState(null)
// // // // //   const [widgets, setWidgets] = useState([])
// // // // //   const [layouts, setLayouts] = useState({ lg: [], md: [], sm: [], xs: [] })
// // // // //   const [isLayoutsModalVisible, setIsLayoutsModalVisible] = useState(false)
// // // // //   const [isStatesModalVisible, setIsStatesModalVisible] = useState(false)
// // // // //   const [isAliasesModalVisible, setIsAliasesModalVisible] = useState(false)
// // // // //   const [dashboardTitle, setDashboardTitle] = useState("New Dashboard")
// // // // //   const [dashboardSettings, setDashboardSettings] = useState({
// // // // //     timewindow: {
// // // // //       realtime: { timewindowMs: 60000 },
// // // // //       aggregation: { type: "AVG", limit: 200 },
// // // // //     },
// // // // //     gridSettings: {
// // // // //       backgroundColor: "#ffffff",
// // // // //       columns: 24,
// // // // //       margin: [10, 10],
// // // // //       backgroundImage: null,
// // // // //     },
// // // // //   })
// // // // //   const [isImportModalVisible, setIsImportModalVisible] = useState(false)
// // // // //   const [isAssignCustomerModalVisible, setIsAssignCustomerModalVisible] = useState(false)
// // // // //   const [isWidgetConfigModalVisible, setIsWidgetConfigModalVisible] = useState(false)
// // // // //   const [timeWindow, setTimeWindow] = useState({
// // // // //     displayValue: "Last 15 minutes",
// // // // //     value: "15_minutes",
// // // // //     type: "REALTIME",
// // // // //   })
// // // // //   const [form] = Form.useForm()
// // // // //   const isMobile = useMediaQuery("(max-width: 768px)")
// // // // //   const isTablet = useMediaQuery("(max-width: 992px)")
// // // // //   const [devices, setDevices] = useState([
// // // // //     { id: "device1", name: "Rack Board" },
// // // // //     { id: "device2", name: "Pressure Valve" },
// // // // //     { id: "device3", name: "Power Meter" },
// // // // //   ])
// // // // //   const [customers, setCustomers] = useState([
// // // // //     { id: "customer1", name: "Demo Customer" },
// // // // //     { id: "customer2", name: "Device Claiming Customer" },
// // // // //     { id: "customer3", name: "Customer A" },
// // // // //   ])
// // // // //   const [assignedCustomers, setAssignedCustomers] = useState([])

// // // // //   // Load dashboard data when component mounts
// // // // //   useEffect(() => {
// // // // //     if (id && id !== "new") {
// // // // //       fetchDashboard(id)
// // // // //     } else {
// // // // //       setDashboardTitle("New Dashboard")
// // // // //     }
// // // // //   }, [id])

// // // // //   const fetchDashboard = async (dashboardId) => {
// // // // //     try {
// // // // //       const dashboard = await getDashboard(dashboardId)
// // // // //       setDashboardTitle(dashboard.title || "Untitled")
// // // // //       setWidgets(Array.isArray(dashboard.widgets)
// // // // //         ? dashboard.widgets
// // // // //         : JSON.parse(dashboard.widgets || "[]"))
// // // // //       setLayouts(typeof dashboard.layouts === "object"
// // // // //         ? dashboard.layouts
// // // // //         : JSON.parse(dashboard.layouts || "{}"))
// // // // //       setDashboardSettings(typeof dashboard.settings === "object"
// // // // //         ? dashboard.settings
// // // // //         : JSON.parse(dashboard.settings || "{}"))
// // // // //       setAssignedCustomers(dashboard.assignedCustomers || [])
// // // // //       setTimeWindow(typeof dashboard.timewindow === "object"
// // // // //         ? dashboard.timewindow
// // // // //         : JSON.parse(dashboard.timewindow || "{}"))
// // // // //     } catch (error) {
// // // // //       console.error("Error loading dashboard:", error)
// // // // //       message.error("Unable to load dashboard from server")
// // // // //     }
// // // // //   }

// // // // //   // --- Widget operations ---

// // // // //   const handleAddWidget = (widget) => {
// // // // //     const widgetId = uuidv4()
// // // // //     const newWidget = {
// // // // //       ...widget,
// // // // //       id: widgetId,
// // // // //       config: {
// // // // //         title: widget.title,
// // // // //         dataSource: {
// // // // //           type: "device",
// // // // //           deviceId: null,
// // // // //           telemetry: [],
// // // // //         },
// // // // //         ...(widget.type.includes("chart")
// // // // //           ? { height: 300, showLegend: true, showPoints: true }
// // // // //           : {}),
// // // // //         ...(widget.type.includes("map")
// // // // //           ? { zoom: 4, center: { lat: 37.7749, lng: -122.4194 } }
// // // // //           : {}),
// // // // //       },
// // // // //     }

// // // // //     setWidgets([...widgets, newWidget])

// // // // //     const newLayout = {
// // // // //       i: widgetId,
// // // // //       x: (layouts.lg.length * 4) % 12,
// // // // //       y: Number.POSITIVE_INFINITY,
// // // // //       w: 4,
// // // // //       h: 4,
// // // // //       minW: 2,
// // // // //       minH: 2,
// // // // //     }
// // // // //     setLayouts({
// // // // //       lg: [...layouts.lg, newLayout],
// // // // //       md: [...layouts.md, { ...newLayout, w: Math.min(newLayout.w, 8) }],
// // // // //       sm: [...layouts.sm, { ...newLayout, w: Math.min(newLayout.w * 2, 12), x: 0 }],
// // // // //       xs: [...layouts.xs, { ...newLayout, w: 12, x: 0 }],
// // // // //     })

// // // // //     setIsWidgetLibraryVisible(false)
// // // // //     setSelectedWidget(newWidget)
// // // // //     setIsWidgetConfigModalVisible(true)
// // // // //   }

// // // // //   const handleWidgetSettings = (widget) => {
// // // // //     setSelectedWidget(widget)
// // // // //     setIsWidgetConfigModalVisible(true)
// // // // //   }

// // // // //   // --- KEY: Save full state of widget ---
// // // // //   const handleWidgetConfigSave = (updatedWidget) => {
// // // // //     setWidgets((prevWidgets) =>
// // // // //       prevWidgets.map((w) => (w.id === updatedWidget.id ? { ...w, ...updatedWidget } : w))
// // // // //     )
// // // // //     setIsWidgetConfigModalVisible(false)
// // // // //     message.success("Widget configuration updated")
// // // // //   }

// // // // //   const handleDeleteWidget = (widgetId) => {
// // // // //     Modal.confirm({
// // // // //       title: "Are you sure you want to delete this widget?",
// // // // //       content: "This action cannot be undone.",
// // // // //       okText: "Yes",
// // // // //       okType: "danger",
// // // // //       cancelText: "No",
// // // // //       onOk() {
// // // // //         setWidgets(widgets.filter((w) => w.id !== widgetId))
// // // // //         setLayouts({
// // // // //           lg: layouts.lg.filter((item) => item.i !== widgetId),
// // // // //           md: layouts.md.filter((item) => item.i !== widgetId),
// // // // //           sm: layouts.sm.filter((item) => item.i !== widgetId),
// // // // //           xs: layouts.xs.filter((item) => item.i !== widgetId),
// // // // //         })
// // // // //         message.success("Widget deleted")
// // // // //       },
// // // // //     })
// // // // //   }

// // // // //   const handleDuplicateWidget = (widget) => {
// // // // //     const newWidgetId = uuidv4()
// // // // //     const newWidget = {
// // // // //       ...widget,
// // // // //       id: newWidgetId,
// // // // //       title: `${widget.title} (Copy)`,
// // // // //       config: { ...widget.config },
// // // // //     }
// // // // //     setWidgets([...widgets, newWidget])
// // // // //     const originalLayout = layouts.lg.find((item) => item.i === widget.id)
// // // // //     if (originalLayout) {
// // // // //       const newLayout = {
// // // // //         ...originalLayout,
// // // // //         i: newWidgetId,
// // // // //         x: (originalLayout.x + 1) % 12,
// // // // //         y: originalLayout.y + 1,
// // // // //       }
// // // // //       setLayouts({
// // // // //         lg: [...layouts.lg, newLayout],
// // // // //         md: [...layouts.md, { ...newLayout, w: Math.min(newLayout.w, 8) }],
// // // // //         sm: [...layouts.sm, { ...newLayout, w: Math.min(newLayout.w * 2, 12), x: 0 }],
// // // // //         xs: [...layouts.xs, { ...newLayout, w: 12, x: 0 }],
// // // // //       })
// // // // //     }
// // // // //     message.success("Widget duplicated")
// // // // //   }

// // // // //   const handleLayoutChange = (layout, allLayouts) => {
// // // // //     setLayouts(allLayouts)
// // // // //   }

// // // // //   const handleTimeWindowChange = (newTimeWindow) => {
// // // // //     setTimeWindow(newTimeWindow)
// // // // //     setIsTimeWindowVisible(false)
// // // // //   }

// // // // //   const handleAssignCustomers = () => {
// // // // //     setIsAssignCustomerModalVisible(true)
// // // // //   }
// // // // //   const handleAssignCustomersSave = (selectedCustomers) => {
// // // // //     setAssignedCustomers(selectedCustomers)
// // // // //     setIsAssignCustomerModalVisible(false)
// // // // //     message.success("Dashboard assigned to customers")
// // // // //   }

// // // // //   // --- Save/Export dashboard: widgets is the FULL state ---
// // // // //   const handleSave = async () => {
// // // // //     const dashboardState = {
// // // // //       id: id && id !== "new" ? id : uuidv4(),
// // // // //       title: dashboardTitle,
// // // // //       widgets: JSON.stringify(widgets),  // full state!
// // // // //       layouts: JSON.stringify(layouts),
// // // // //       settings: JSON.stringify(dashboardSettings),
// // // // //       assignedCustomers,
// // // // //       timewindow: JSON.stringify(timeWindow),
// // // // //       version: "1.0.0",
// // // // //     }

// // // // //     try {
// // // // //       let result
// // // // //       if (id && id !== "new") {
// // // // //         result = await updateDashboard(id, dashboardState)
// // // // //         message.success("Dashboard updated")
// // // // //       } else {
// // // // //         result = await createDashboard(dashboardState)
// // // // //         message.success("Dashboard created")
// // // // //         navigate(`/dashboards/${result.id}`)
// // // // //       }
// // // // //     } catch (err) {
// // // // //       console.error(err)
// // // // //       message.error("Failed to save dashboard")
// // // // //     }
// // // // //   }

// // // // //   const handleExport = () => {
// // // // //     const dashboardState = {
// // // // //       id: id && id !== "new" ? id : uuidv4(),
// // // // //       title: dashboardTitle,
// // // // //       widgets,
// // // // //       layouts,
// // // // //       settings: dashboardSettings,
// // // // //       assignedCustomers,
// // // // //       timeWindow,
// // // // //       version: "1.0.0",
// // // // //       createdTime: new Date().toISOString(),
// // // // //     }

// // // // //     const dashboardJson = JSON.stringify(dashboardState, null, 2)
// // // // //     const blob = new Blob([dashboardJson], { type: "application/json" })
// // // // //     saveAs(blob, `${dashboardTitle.replace(/\s+/g, "_").toLowerCase()}_dashboard.json`)
// // // // //     message.success("Dashboard exported successfully")
// // // // //   }

// // // // //   const handleImportDashboard = (file) => {
// // // // //     const reader = new FileReader()
// // // // //     reader.onload = (e) => {
// // // // //       try {
// // // // //         const dashboardData = JSON.parse(e.target.result)
// // // // //         if (!dashboardData.widgets || !dashboardData.layouts) throw new Error("Invalid dashboard file format")
// // // // //         setDashboardTitle(dashboardData.title || "Imported Dashboard")
// // // // //         setWidgets(dashboardData.widgets || [])
// // // // //         setLayouts(dashboardData.layouts || { lg: [], md: [], sm: [], xs: [] })
// // // // //         setDashboardSettings(dashboardData.settings || dashboardSettings)
// // // // //         setAssignedCustomers(dashboardData.assignedCustomers || [])
// // // // //         setTimeWindow(dashboardData.timewindow || timeWindow)
// // // // //         setIsImportModalVisible(false)
// // // // //         message.success("Dashboard imported successfully")
// // // // //       } catch (error) {
// // // // //         console.error("Error importing dashboard:", error)
// // // // //         message.error("Failed to import dashboard. Invalid file format.")
// // // // //       }
// // // // //     }
// // // // //     reader.readAsText(file)
// // // // //   }

// // // // //   const handleCancel = () => {
// // // // //     navigate("/dashboards")
// // // // //   }

// // // // //   const timeWindowMenu = (
// // // // //     <Menu>
// // // // //       <Menu.Item
// // // // //         key="realtime_15_minutes"
// // // // //         onClick={() =>
// // // // //           handleTimeWindowChange({ displayValue: "Last 15 minutes", value: "15_minutes", type: "REALTIME" })
// // // // //         }
// // // // //       >Last 15 minutes</Menu.Item>
// // // // //       <Menu.Item
// // // // //         key="realtime_30_minutes"
// // // // //         onClick={() =>
// // // // //           handleTimeWindowChange({ displayValue: "Last 30 minutes", value: "30_minutes", type: "REALTIME" })
// // // // //         }
// // // // //       >Last 30 minutes</Menu.Item>
// // // // //       <Menu.Item
// // // // //         key="realtime_1_hour"
// // // // //         onClick={() => handleTimeWindowChange({ displayValue: "Last 1 hour", value: "1_hour", type: "REALTIME" })}
// // // // //       >Last 1 hour</Menu.Item>
// // // // //       <Menu.Item
// // // // //         key="realtime_6_hours"
// // // // //         onClick={() => handleTimeWindowChange({ displayValue: "Last 6 hours", value: "6_hours", type: "REALTIME" })}
// // // // //       >Last 6 hours</Menu.Item>
// // // // //       <Menu.Item
// // // // //         key="realtime_1_day"
// // // // //         onClick={() => handleTimeWindowChange({ displayValue: "Last 1 day", value: "1_day", type: "REALTIME" })}
// // // // //       >Last 1 day</Menu.Item>
// // // // //       <Menu.Item key="custom" onClick={() => setIsTimeWindowVisible(true)}>
// // // // //         Custom...
// // // // //       </Menu.Item>
// // // // //     </Menu>
// // // // //   )

// // // // //   // --- Widget mock data remains as before ---
// // // // //   const generateMockData = (telemetry, timeWindow) => {
// // // // //     if (!telemetry || telemetry.length === 0) return []
// // // // //     const now = new Date()
// // // // //     const data = []
// // // // //     let timeRange = 900000 // 15 minutes in ms (default)
// // // // //     switch (timeWindow.value) {
// // // // //       case "30_minutes": timeRange = 1800000; break
// // // // //       case "1_hour": timeRange = 3600000; break
// // // // //       case "6_hours": timeRange = 21600000; break
// // // // //       case "1_day": timeRange = 86400000; break
// // // // //       default: timeRange = 900000
// // // // //     }
// // // // //     const numPoints = 100
// // // // //     const interval = timeRange / numPoints
// // // // //     for (let i = 0; i < numPoints; i++) {
// // // // //       const time = new Date(now.getTime() - (numPoints - i) * interval)
// // // // //       const point = { time: time.toISOString() }
// // // // //       telemetry.forEach((key) => {
// // // // //         if (key === "temperature") point[key] = 25 + 5 * Math.sin((i / numPoints) * Math.PI * 2) + Math.random() * 2 - 1
// // // // //         else if (key === "humidity") point[key] = 50 + 10 * Math.cos((i / numPoints) * Math.PI * 2) + Math.random() * 5 - 2.5
// // // // //         else if (key === "batteryLevel") point[key] = 100 - (20 * i) / numPoints - Math.random() * 2
// // // // //         else if (key === "signalStrength") point[key] = 75 + 15 * Math.sin((i / numPoints) * Math.PI * 4) + Math.random() * 5 - 2.5
// // // // //         else if (key === "status") point[key] = Math.random() > 0.1 ? "Online" : "Offline"
// // // // //         else point[key] = Math.random() * 100
// // // // //       })
// // // // //       data.push(point)
// // // // //     }
// // // // //     return data
// // // // //   }

// // // // //   return (
// // // // //     <Layout style={{ minHeight: "100vh" }} className={isDarkMode ? "dark-theme" : ""}>
// // // // //       <Header style={{
// // // // //         background: isDarkMode ? "#1f1f1f" : "#fff",
// // // // //         padding: "0 16px",
// // // // //         display: "flex",
// // // // //         justifyContent: "space-between",
// // // // //         alignItems: "center",
// // // // //         height: "64px",
// // // // //         boxShadow: "0 1px 4px rgba(0,21,41,.08)",
// // // // //       }}>
// // // // //         <Input
// // // // //           placeholder="Dashboard title"
// // // // //           style={{ width: isMobile ? 150 : 300 }}
// // // // //           value={dashboardTitle}
// // // // //           onChange={(e) => setDashboardTitle(e.target.value)}
// // // // //         />
// // // // //         <Space wrap={isMobile}>
// // // // //           <Button icon={<PlusOutlined />} onClick={() => setIsWidgetLibraryVisible(true)}>{!isMobile && "Add widget"}</Button>
// // // // //           <Dropdown overlay={timeWindowMenu} trigger={["click"]}>
// // // // //             <Button icon={<ClockCircleOutlined />}>{!isMobile && timeWindow.displayValue} {isMobile && <DownOutlined />}</Button>
// // // // //           </Dropdown>
// // // // //           <Button icon={<SettingOutlined />} onClick={() => setIsSettingsVisible(true)}>{!isMobile && "Settings"}</Button>
// // // // //           {!isMobile && (<>
// // // // //             <Button icon={<LinkOutlined />} onClick={() => setIsAliasesModalVisible(true)}>Aliases</Button>
// // // // //             <Button icon={<FilterOutlined />}>Filters</Button>
// // // // //             <Button icon={<HistoryOutlined />}>Versions</Button>
// // // // //           </>)}
// // // // //           {!isTablet && (
// // // // //             <Button icon={<TeamOutlined />} onClick={handleAssignCustomers}>Assign</Button>
// // // // //           )}
// // // // //           <Button icon={<UploadOutlined />} onClick={() => setIsImportModalVisible(true)}>{!isMobile && "Import"}</Button>
// // // // //           <Button icon={<DownloadOutlined />} onClick={handleExport}>{!isMobile && "Export"}</Button>
// // // // //           <Button icon={<CloseOutlined />} onClick={handleCancel}>{!isMobile && "Cancel"}</Button>
// // // // //           <Button icon={<SaveOutlined />} type="primary" onClick={handleSave}>{!isMobile && "Save"}</Button>
// // // // //           {!isMobile && <Button icon={<FullscreenOutlined />} />}
// // // // //         </Space>
// // // // //       </Header>
// // // // //       <Content style={{
// // // // //         minHeight: `calc(100vh - 64px)`,
// // // // //         background: isDarkMode ? "#18181c" : "#f0f2f5",
// // // // //         overflow: "auto",
// // // // //         padding: 0,
// // // // //       }}>
// // // // //         <div style={{
// // // // //           minHeight: `calc(100vh - 64px)`,
// // // // //           background: isDarkMode ? "#18181c" : "#fff",
// // // // //           boxShadow: "0 1px 4px rgba(0,21,41,.08)",
// // // // //           display: "flex",
// // // // //           flexDirection: "column",
// // // // //           padding: isMobile ? 0 : 0,
// // // // //         }}>
// // // // //           {widgets.length === 0 ? (
// // // // //             <div style={{
// // // // //               flex: 1,
// // // // //               display: "flex",
// // // // //               flexDirection: "column",
// // // // //               alignItems: "center",
// // // // //               justifyContent: "center",
// // // // //               color: "#999",
// // // // //               minHeight: "200px"
// // // // //             }}>
// // // // //               <div style={{ fontSize: "64px", marginBottom: "16px" }}>📊</div>
// // // // //               <Typography.Title level={4}>No widgets added yet</Typography.Title>
// // // // //               <Button
// // // // //                 type="primary"
// // // // //                 icon={<PlusOutlined />}
// // // // //                 onClick={() => setIsWidgetLibraryVisible(true)}
// // // // //                 style={{ marginTop: "16px" }}
// // // // //               >
// // // // //                 Add your first widget
// // // // //               </Button>
// // // // //             </div>
// // // // //           ) : (
// // // // //             <ResponsiveGridLayout
// // // // //               className="layout"
// // // // //               layouts={layouts}
// // // // //               breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
// // // // //               cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
// // // // //               rowHeight={100}
// // // // //               onLayoutChange={handleLayoutChange}
// // // // //               isDraggable={true}
// // // // //               isResizable={true}
// // // // //               margin={[10, 10]}
// // // // //               draggableHandle=".widget-drag-handle"
// // // // //             >
// // // // //               {widgets.map((widget) => (
// // // // //                 <div
// // // // //                   key={widget.id}
// // // // //                   className="widget-container"
// // // // //                   style={{
// // // // //                     position: "relative",
// // // // //                     border: isDarkMode ? "1px solid #333" : "1px solid #eee",
// // // // //                     background: isDarkMode ? "#23232a" : "#fff",
// // // // //                     transition: "background 0.2s, border 0.2s",
// // // // //                     height: "100%",
// // // // //                     display: "flex",
// // // // //                     flexDirection: "column",
// // // // //                     minHeight: 0,
// // // // //                     boxSizing: "border-box",
// // // // //                   }}
// // // // //                 >
// // // // //                   <div
// // // // //                     style={{
// // // // //                       position: "absolute",
// // // // //                       top: 4,
// // // // //                       right: 4,
// // // // //                       zIndex: 10,
// // // // //                       display: "flex",
// // // // //                       gap: 4,
// // // // //                       background: isDarkMode ? "rgba(32,32,32,0.95)" : "rgba(255,255,255,0.95)",
// // // // //                       borderRadius: 4,
// // // // //                       padding: 2,
// // // // //                       boxShadow: isDarkMode
// // // // //                         ? "0 0 4px rgba(0,0,0,0.4)"
// // // // //                         : "0 0 4px rgba(0,0,0,0.1)",
// // // // //                     }}
// // // // //                   >
// // // // //                     <Button
// // // // //                       type="text"
// // // // //                       size="small"
// // // // //                       icon={<EditOutlined />}
// // // // //                       onClick={(e) => {
// // // // //                         e.stopPropagation()
// // // // //                         handleWidgetSettings(widget)
// // // // //                       }}
// // // // //                     />
// // // // //                     <Button
// // // // //                       type="text"
// // // // //                       size="small"
// // // // //                       icon={<CopyOutlined />}
// // // // //                       onClick={(e) => {
// // // // //                         e.stopPropagation()
// // // // //                         handleDuplicateWidget(widget)
// // // // //                       }}
// // // // //                     />
// // // // //                     <Button
// // // // //                       type="text"
// // // // //                       size="small"
// // // // //                       danger
// // // // //                       icon={<DeleteOutlined />}
// // // // //                       onClick={(e) => {
// // // // //                         e.stopPropagation()
// // // // //                         handleDeleteWidget(widget.id)
// // // // //                       }}
// // // // //                     />
// // // // //                   </div>
// // // // //                   <div
// // // // //                     className="widget-drag-handle"
// // // // //                     style={{
// // // // //                       cursor: "move",
// // // // //                       padding: "5px 5px",
// // // // //                       fontWeight: 500,
// // // // //                       fontSize: 14,
// // // // //                       background: isDarkMode ? "#18181c" : "#f5f5f5",
// // // // //                       color: isDarkMode ? "#eee" : "#333",
// // // // //                       minHeight: 38,
// // // // //                       maxHeight: 38,
// // // // //                       lineHeight: "28px",
// // // // //                       flex: "0 0 38px",
// // // // //                       borderBottom: isDarkMode ? "1px solid #222" : "1px solid #eee",
// // // // //                       transition: "background 0.2s, color 0.2s, border-bottom 0.2s",
// // // // //                     }}
// // // // //                   >
// // // // //                     {widget.title}
// // // // //                   </div>
// // // // //                   <div
// // // // //                     style={{
// // // // //                       flex: 1,
// // // // //                       minHeight: 0,
// // // // //                       overflow: "auto",
// // // // //                       padding: 0,
// // // // //                       background: "inherit"
// // // // //                     }}
// // // // //                   >
// // // // //                     <WidgetRenderer
// // // // //                       widget={widget}
// // // // //                       config={{
// // // // //                         ...widget.config,
// // // // //                         data: generateMockData(widget.config?.dataSource?.telemetry, timeWindow),
// // // // //                         timeWindow: timeWindow,
// // // // //                       }}
// // // // //                     />
// // // // //                   </div>
// // // // //                 </div>
// // // // //               ))}
// // // // //             </ResponsiveGridLayout>
// // // // //           )}
// // // // //         </div>
// // // // //       </Content>
// // // // //       <WidgetLibrary
// // // // //         visible={isWidgetLibraryVisible}
// // // // //         onClose={() => setIsWidgetLibraryVisible(false)}
// // // // //         onSelect={handleAddWidget}
// // // // //       />
// // // // //       <TimeWindowSettings
// // // // //         visible={isTimeWindowVisible}
// // // // //         onClose={() => setIsTimeWindowVisible(false)}
// // // // //         onSave={handleTimeWindowChange}
// // // // //         initialValue={timeWindow}
// // // // //       />
// // // // //       <DashboardSettings visible={isSettingsVisible} onClose={() => setIsSettingsVisible(false)} />
// // // // //       <ManageLayoutsModal visible={isLayoutsModalVisible} onClose={() => setIsLayoutsModalVisible(false)} />
// // // // //       <ManageStatesModal visible={isStatesModalVisible} onClose={() => setIsStatesModalVisible(false)} />
// // // // //       <EntityAliasesModal visible={isAliasesModalVisible} onClose={() => setIsAliasesModalVisible(false)} />
// // // // //       <WidgetConfigModal
// // // // //         visible={isWidgetConfigModalVisible}
// // // // //         onCancel={() => setIsWidgetConfigModalVisible(false)}
// // // // //         onSave={handleWidgetConfigSave}
// // // // //         widget={selectedWidget}
// // // // //         devices={devices}
// // // // //       />
// // // // //       <Modal
// // // // //         title="Import Dashboard"
// // // // //         open={isImportModalVisible}
// // // // //         onCancel={() => setIsImportModalVisible(false)}
// // // // //         footer={null}
// // // // //       >
// // // // //         <div style={{ padding: "20px 0" }}>
// // // // //           <input
// // // // //             type="file"
// // // // //             accept=".json"
// // // // //             onChange={(e) => {
// // // // //               if (e.target.files && e.target.files[0]) {
// // // // //                 handleImportDashboard(e.target.files[0])
// // // // //               }
// // // // //             }}
// // // // //             style={{ marginBottom: "20px" }}
// // // // //           />
// // // // //           <Typography.Paragraph>
// // // // //             Select a dashboard JSON file to import. The file should contain a valid dashboard configuration.
// // // // //           </Typography.Paragraph>
// // // // //           <Typography.Text type="secondary">
// // // // //             Note: Importing a dashboard will replace your current dashboard configuration.
// // // // //           </Typography.Text>
// // // // //         </div>
// // // // //       </Modal>
// // // // //       <Modal
// // // // //         title="Assign Dashboard to Customers"
// // // // //         open={isAssignCustomerModalVisible}
// // // // //         onCancel={() => setIsAssignCustomerModalVisible(false)}
// // // // //         onOk={() => {
// // // // //           form.validateFields().then((values) => {
// // // // //             handleAssignCustomersSave(values.customers)
// // // // //           })
// // // // //         }}
// // // // //       >
// // // // //         <Form form={form} layout="vertical" initialValues={{ customers: assignedCustomers }}>
// // // // //           <Form.Item
// // // // //             name="customers"
// // // // //             label="Select Customers"
// // // // //             rules={[{ required: false, message: "Please select at least one customer" }]}
// // // // //           >
// // // // //             <Select mode="multiple" placeholder="Select customers" style={{ width: "100%" }} optionLabelProp="label">
// // // // //               {customers.map((customer) => (
// // // // //                 <Select.Option key={customer.id} value={customer.id} label={customer.name}>
// // // // //                   {customer.name}
// // // // //                 </Select.Option>
// // // // //               ))}
// // // // //             </Select>
// // // // //           </Form.Item>
// // // // //           <Typography.Paragraph>
// // // // //             Assigned customers will be able to view this dashboard in their customer portal.
// // // // //           </Typography.Paragraph>
// // // // //         </Form>
// // // // //       </Modal>
// // // // //     </Layout>
// // // // //   )
// // // // // }

// // // // // export default DashboardEditor
// // // // // // "use client"

// // // // // // import { useState, useEffect } from "react"
// // // // // // import {
// // // // // //   Layout,
// // // // // //   Button,
// // // // // //   Space,
// // // // // //   Input,
// // // // // //   Typography,
// // // // // //   message,
// // // // // //   Modal,
// // // // // //   Form,
// // // // // //   Select,
// // // // // //   Dropdown,
// // // // // //   Menu,
// // // // // // } from "antd"
// // // // // // import { useParams, useNavigate } from "react-router-dom"
// // // // // // import {
// // // // // //   PlusOutlined,
// // // // // //   ClockCircleOutlined,
// // // // // //   SettingOutlined,
// // // // // //   LinkOutlined,
// // // // // //   FilterOutlined,
// // // // // //   HistoryOutlined,
// // // // // //   CloseOutlined,
// // // // // //   SaveOutlined,
// // // // // //   FullscreenOutlined,
// // // // // //   EditOutlined,
// // // // // //   DeleteOutlined,
// // // // // //   CopyOutlined,
// // // // // //   DownloadOutlined,
// // // // // //   UploadOutlined,
// // // // // //   TeamOutlined,
// // // // // //   DownOutlined,
// // // // // // } from "@ant-design/icons"
// // // // // // import { Responsive, WidthProvider } from "react-grid-layout"
// // // // // // import { saveAs } from "file-saver"
// // // // // // import "react-grid-layout/css/styles.css"
// // // // // // import "react-resizable/css/styles.css"

// // // // // // import WidgetLibrary from "../components/dashboard/WidgetLibrary"
// // // // // // import TimeWindowSettings from "../components/dashboard/TimeWindowSettings"
// // // // // // import DashboardSettings from "../components/dashboard/DashboardSettings"
// // // // // // import ManageLayoutsModal from "../components/dashboard/ManageLayoutsModal"
// // // // // // import ManageStatesModal from "../components/dashboard/ManageStatesModal"
// // // // // // import EntityAliasesModal from "../components/dashboard/EntityAliasesModal"
// // // // // // import WidgetRenderer from "../components/dashboard/WidgetRenderer"
// // // // // // import WidgetConfigModal from "../components/dashboard/WidgetConfigModal"
// // // // // // import { useMediaQuery } from "../hooks/useMediaQuery"
// // // // // // import { useTheme } from "../components/theme/ThemeProvider"
// // // // // // import { getDashboard, createDashboard, updateDashboard } from "../services/api"
// // // // // // import { v4 as uuidv4 } from 'uuid'

// // // // // // const { Header, Content } = Layout

// // // // // // const ResponsiveGridLayout = WidthProvider(Responsive)

// // // // // // const DashboardEditor = () => {
// // // // // //   const { theme, isDarkMode } = useTheme()    // ← Use the ThemeProvider hook!
// // // // // //   const { id } = useParams()
// // // // // //   const navigate = useNavigate()
// // // // // //   const [isWidgetLibraryVisible, setIsWidgetLibraryVisible] = useState(false)
// // // // // //   const [isTimeWindowVisible, setIsTimeWindowVisible] = useState(false)
// // // // // //   const [isSettingsVisible, setIsSettingsVisible] = useState(false)
// // // // // //   const [selectedWidget, setSelectedWidget] = useState(null)
// // // // // //   const [widgets, setWidgets] = useState([])
// // // // // //   const [layouts, setLayouts] = useState({ lg: [], md: [], sm: [], xs: [] })
// // // // // //   const [isLayoutsModalVisible, setIsLayoutsModalVisible] = useState(false)
// // // // // //   const [isStatesModalVisible, setIsStatesModalVisible] = useState(false)
// // // // // //   const [isAliasesModalVisible, setIsAliasesModalVisible] = useState(false)
// // // // // //   const [dashboardTitle, setDashboardTitle] = useState("New Dashboard")
// // // // // //   const [dashboardSettings, setDashboardSettings] = useState({
// // // // // //     timewindow: {
// // // // // //       realtime: { timewindowMs: 60000 },
// // // // // //       aggregation: { type: "AVG", limit: 200 },
// // // // // //     },
// // // // // //     gridSettings: {
// // // // // //       backgroundColor: "#ffffff",
// // // // // //       columns: 24,
// // // // // //       margin: [10, 10],
// // // // // //       backgroundImage: null,
// // // // // //     },
// // // // // //   })
// // // // // //   const [isImportModalVisible, setIsImportModalVisible] = useState(false)
// // // // // //   const [isAssignCustomerModalVisible, setIsAssignCustomerModalVisible] = useState(false)
// // // // // //   const [isWidgetConfigModalVisible, setIsWidgetConfigModalVisible] = useState(false)
// // // // // //   const [timeWindow, setTimeWindow] = useState({
// // // // // //     displayValue: "Last 15 minutes",
// // // // // //     value: "15_minutes",
// // // // // //     type: "REALTIME",
// // // // // //   })
// // // // // //   const [form] = Form.useForm()
// // // // // //   const isMobile = useMediaQuery("(max-width: 768px)")
// // // // // //   const isTablet = useMediaQuery("(max-width: 992px)")
// // // // // //   const [devices, setDevices] = useState([
// // // // // //     { id: "device1", name: "Rack Board" },
// // // // // //     { id: "device2", name: "Pressure Valve" },
// // // // // //     { id: "device3", name: "Power Meter" },
// // // // // //   ])
// // // // // //   const [customers, setCustomers] = useState([
// // // // // //     { id: "customer1", name: "Demo Customer" },
// // // // // //     { id: "customer2", name: "Device Claiming Customer" },
// // // // // //     { id: "customer3", name: "Customer A" },
// // // // // //   ])
// // // // // //   const [assignedCustomers, setAssignedCustomers] = useState([])



// // // // // //   // Load dashboard data when component mounts
// // // // // //   useEffect(() => {
// // // // // //     console.log("Dashboard Editor loaded with ID:", id)
// // // // // //     // Here you would typically fetch the dashboard data based on the ID
// // // // // //     // For now, we'll just set a default title
// // // // // //     if (id && id !== "new") {
// // // // // //       fetchDashboard(id)
// // // // // //     } else {
// // // // // //       setDashboardTitle("New Dashboard")
// // // // // //     }
// // // // // //   }, [id])

// // // // // //   // const fetchDashboard = async (dashboardId) => {
// // // // // //   //   try {
// // // // // //   //     // In a real app, you would fetch from an API
// // // // // //   //     // For now, we'll simulate a dashboard with mock data
// // // // // //   //     await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API delay

// // // // // //   //     // Check if this is a predefined dashboard ID
// // // // // //   //     if (dashboardId === "1") {
// // // // // //   //       // Mock dashboard data
// // // // // //   //       const mockDashboard = {
// // // // // //   //         id: dashboardId,
// // // // // //   //         title: "Environmental Monitoring",
// // // // // //   //         widgets: [
// // // // // //   //           {
// // // // // //   //             id: "widget1",
// // // // // //   //             title: "Temperature Sensor",
// // // // // //   //             type: "line-chart",
// // // // // //   //             deviceId: "device1",
// // // // // //   //             deviceName: "Temperature Sensor",
// // // // // //   //             telemetry: ["temperature", "humidity"],
// // // // // //   //             config: {
// // // // // //   //               title: "Temperature & Humidity",
// // // // // //   //               dataSource: {
// // // // // //   //                 type: "device",
// // // // // //   //                 deviceId: "device1",
// // // // // //   //                 telemetry: ["temperature", "humidity"],
// // // // // //   //               },
// // // // // //   //               showLegend: true,
// // // // // //   //               showPoints: true,
// // // // // //   //               height: 300,
// // // // // //   //             },
// // // // // //   //           },
// // // // // //   //           {
// // // // // //   //             id: "widget2",
// // // // // //   //             title: "Device Status",
// // // // // //   //             type: "status-card",
// // // // // //   //             deviceId: "device1",
// // // // // //   //             deviceName: "Temperature Sensor",
// // // // // //   //             telemetry: ["status"],
// // // // // //   //             config: {
// // // // // //   //               title: "Device Status",
// // // // // //   //               dataSource: {
// // // // // //   //                 type: "device",
// // // // // //   //                 deviceId: "device1",
// // // // // //   //                 telemetry: ["status"],
// // // // // //   //               },
// // // // // //   //               showLastUpdateTime: true,
// // // // // //   //             },
// // // // // //   //           },
// // // // // //   //           {
// // // // // //   //             id: "widget3",
// // // // // //   //             title: "Battery Level",
// // // // // //   //             type: "battery-level",
// // // // // //   //             deviceId: "device1",
// // // // // //   //             deviceName: "Temperature Sensor",
// // // // // //   //             telemetry: ["batteryLevel"],
// // // // // //   //             config: {
// // // // // //   //               title: "Battery Level",
// // // // // //   //               dataSource: {
// // // // // //   //                 type: "device",
// // // // // //   //                 deviceId: "device1",
// // // // // //   //                 telemetry: ["batteryLevel"],
// // // // // //   //               },
// // // // // //   //               showValue: true,
// // // // // //   //             },
// // // // // //   //           },
// // // // // //   //         ],
// // // // // //   //         layouts: {
// // // // // //   //           lg: [
// // // // // //   //             { i: "widget1", x: 0, y: 0, w: 8, h: 4 },
// // // // // //   //             { i: "widget2", x: 8, y: 0, w: 4, h: 2 },
// // // // // //   //             { i: "widget3", x: 8, y: 2, w: 4, h: 2 },
// // // // // //   //           ],
// // // // // //   //           md: [
// // // // // //   //             { i: "widget1", x: 0, y: 0, w: 8, h: 4 },
// // // // // //   //             { i: "widget2", x: 8, y: 0, w: 4, h: 2 },
// // // // // //   //             { i: "widget3", x: 8, y: 2, w: 4, h: 2 },
// // // // // //   //           ],
// // // // // //   //           sm: [
// // // // // //   //             { i: "widget1", x: 0, y: 0, w: 12, h: 4 },
// // // // // //   //             { i: "widget2", x: 0, y: 4, w: 6, h: 2 },
// // // // // //   //             { i: "widget3", x: 6, y: 4, w: 6, h: 2 },
// // // // // //   //           ],
// // // // // //   //           xs: [
// // // // // //   //             { i: "widget1", x: 0, y: 0, w: 12, h: 4 },
// // // // // //   //             { i: "widget2", x: 0, y: 4, w: 12, h: 2 },
// // // // // //   //             { i: "widget3", x: 0, y: 6, w: 12, h: 2 },
// // // // // //   //           ],
// // // // // //   //         },
// // // // // //   //         settings: dashboardSettings,
// // // // // //   //         assignedCustomers: ["customer1", "customer2"],
// // // // // //   //       }

// // // // // //   //       setDashboardTitle(mockDashboard.title)
// // // // // //   //       setWidgets(mockDashboard.widgets)
// // // // // //   //       setLayouts(mockDashboard.layouts)
// // // // // //   //       setDashboardSettings(mockDashboard.settings)
// // // // // //   //       setAssignedCustomers(mockDashboard.assignedCustomers)
// // // // // //   //     } else {
// // // // // //   //       setDashboardTitle(`Dashboard ${dashboardId}`)
// // // // // //   //     }
// // // // // //   //   } catch (error) {
// // // // // //   //     console.error("Error fetching dashboard:", error)
// // // // // //   //     message.error("Failed to load dashboard")
// // // // // //   //   }
// // // // // //   // }
// // // // // //   const fetchDashboard = async (dashboardId) => {
// // // // // //     try {
// // // // // //       const dashboard = await getDashboard(dashboardId)
  
// // // // // //       setDashboardTitle(dashboard.title || "Untitled")
// // // // // //       setWidgets(JSON.parse(dashboard.widgets || "[]"))
// // // // // //       setLayouts(JSON.parse(dashboard.layouts || "{}"))
// // // // // //       setDashboardSettings(JSON.parse(dashboard.settings || "{}"))
// // // // // //       setAssignedCustomers(dashboard.assignedCustomers || [])
// // // // // //       setTimeWindow(JSON.parse(dashboard.timewindow || "{}"))
// // // // // //     } catch (error) {
// // // // // //       console.error("Error loading dashboard:", error)
// // // // // //       message.error("Unable to load dashboard from server")
// // // // // //     }
// // // // // //   }
// // // // // //   const handleAddWidget = (widget) => {
// // // // // //     const widgetId = Date.now().toString()
// // // // // //     const newWidget = {
// // // // // //       ...widget,
// // // // // //       id: widgetId,
// // // // // //       config: {
// // // // // //         title: widget.title,
// // // // // //         dataSource: {
// // // // // //           type: "device",
// // // // // //           deviceId: null,
// // // // // //           telemetry: [],
// // // // // //         },
// // // // // //         // Default configuration based on widget type
// // // // // //         ...(widget.type.includes("chart")
// // // // // //           ? {
// // // // // //               height: 300,
// // // // // //               showLegend: true,
// // // // // //               showPoints: true,
// // // // // //             }
// // // // // //           : {}),
// // // // // //         ...(widget.type.includes("map")
// // // // // //           ? {
// // // // // //               zoom: 4,
// // // // // //               center: { lat: 37.7749, lng: -122.4194 },
// // // // // //             }
// // // // // //           : {}),
// // // // // //       },
// // // // // //     }

// // // // // //     // Add widget to widgets array
// // // // // //     setWidgets([...widgets, newWidget])

// // // // // //     // Create a layout for the new widget
// // // // // //     const newLayout = {
// // // // // //       i: widgetId,
// // // // // //       x: (layouts.lg.length * 4) % 12, // Position based on number of widgets
// // // // // //       y: Number.POSITIVE_INFINITY, // Put it at the bottom
// // // // // //       w: 4, // Default width
// // // // // //       h: 4, // Default height
// // // // // //       minW: 2, // Min width
// // // // // //       minH: 2, // Min height
// // // // // //     }

// // // // // //     // Update layouts for all breakpoints
// // // // // //     setLayouts({
// // // // // //       lg: [...layouts.lg, newLayout],
// // // // // //       md: [...layouts.md, { ...newLayout, w: Math.min(newLayout.w, 8) }],
// // // // // //       sm: [...layouts.sm, { ...newLayout, w: Math.min(newLayout.w * 2, 12), x: 0 }],
// // // // // //       xs: [...layouts.xs, { ...newLayout, w: 12, x: 0 }],
// // // // // //     })

// // // // // //     setIsWidgetLibraryVisible(false)

// // // // // //     // Open widget configuration modal for the new widget
// // // // // //     setSelectedWidget(newWidget)
// // // // // //     setIsWidgetConfigModalVisible(true)
// // // // // //   }

// // // // // //   const handleWidgetSettings = (widget) => {
// // // // // //     setSelectedWidget(widget)
// // // // // //     setIsWidgetConfigModalVisible(true)
// // // // // //   }

// // // // // //   const handleWidgetConfigSave = (updatedWidget) => {
// // // // // //     // Update the widget in the widgets array
// // // // // //     const updatedWidgets = widgets.map((w) => {
// // // // // //       if (w.id === updatedWidget.id) {
// // // // // //         return updatedWidget
// // // // // //       }
// // // // // //       return w
// // // // // //     })

// // // // // //     setWidgets(updatedWidgets)
// // // // // //     setIsWidgetConfigModalVisible(false)
// // // // // //     message.success("Widget configuration updated")
// // // // // //   }

// // // // // //   const handleDeleteWidget = (widgetId) => {
// // // // // //     Modal.confirm({
// // // // // //       title: "Are you sure you want to delete this widget?",
// // // // // //       content: "This action cannot be undone.",
// // // // // //       okText: "Yes",
// // // // // //       okType: "danger",
// // // // // //       cancelText: "No",
// // // // // //       onOk() {
// // // // // //         // Remove widget from widgets array
// // // // // //         setWidgets(widgets.filter((w) => w.id !== widgetId))

// // // // // //         // Remove widget from layout
// // // // // //         setLayouts({
// // // // // //           lg: layouts.lg.filter((item) => item.i !== widgetId),
// // // // // //           md: layouts.md.filter((item) => item.i !== widgetId),
// // // // // //           sm: layouts.sm.filter((item) => item.i !== widgetId),
// // // // // //           xs: layouts.xs.filter((item) => item.i !== widgetId),
// // // // // //         })

// // // // // //         message.success("Widget deleted")
// // // // // //       },
// // // // // //     })
// // // // // //   }

// // // // // //   const handleDuplicateWidget = (widget) => {
// // // // // //     const newWidgetId = Date.now().toString()
// // // // // //     const newWidget = {
// // // // // //       ...widget,
// // // // // //       id: newWidgetId,
// // // // // //       title: `${widget.title} (Copy)`,
// // // // // //     }

// // // // // //     // Add duplicated widget to widgets array
// // // // // //     setWidgets([...widgets, newWidget])

// // // // // //     // Find the layout of the original widget
// // // // // //     const originalLayout = layouts.lg.find((item) => item.i === widget.id)

// // // // // //     if (originalLayout) {
// // // // // //       // Create a new layout for the duplicated widget
// // // // // //       const newLayout = {
// // // // // //         ...originalLayout,
// // // // // //         i: newWidgetId,
// // // // // //         x: (originalLayout.x + 1) % 12, // Position it next to the original
// // // // // //         y: originalLayout.y + 1, // Position it below the original
// // // // // //       }

// // // // // //       // Update layouts for all breakpoints
// // // // // //       setLayouts({
// // // // // //         lg: [...layouts.lg, newLayout],
// // // // // //         md: [...layouts.md, { ...newLayout, w: Math.min(newLayout.w, 8) }],
// // // // // //         sm: [...layouts.sm, { ...newLayout, w: Math.min(newLayout.w * 2, 12), x: 0 }],
// // // // // //         xs: [...layouts.xs, { ...newLayout, w: 12, x: 0 }],
// // // // // //       })
// // // // // //     }

// // // // // //     message.success("Widget duplicated")
// // // // // //   }

// // // // // //   const handleLayoutChange = (layout, allLayouts) => {
// // // // // //     setLayouts(allLayouts)
// // // // // //   }

// // // // // //   const handleTimeWindowChange = (newTimeWindow) => {
// // // // // //     setTimeWindow(newTimeWindow)
// // // // // //     setIsTimeWindowVisible(false)
// // // // // //   }

// // // // // //   const handleAssignCustomers = () => {
// // // // // //     setIsAssignCustomerModalVisible(true)
// // // // // //   }

// // // // // //   const handleAssignCustomersSave = (selectedCustomers) => {
// // // // // //     setAssignedCustomers(selectedCustomers)
// // // // // //     setIsAssignCustomerModalVisible(false)
// // // // // //     message.success("Dashboard assigned to customers")
// // // // // //   }

// // // // // //   // const handleSave = () => {
// // // // // //   //   // Create dashboard state object
// // // // // //   //   const dashboardState = {
// // // // // //   //     id: id || Date.now().toString(),
// // // // // //   //     title: dashboardTitle,
// // // // // //   //     widgets: widgets,
// // // // // //   //     layouts: layouts,
// // // // // //   //     settings: dashboardSettings,
// // // // // //   //     assignedCustomers: assignedCustomers,
// // // // // //   //     timewindow: timeWindow,
// // // // // //   //     createdTime: new Date().toISOString(),
// // // // // //   //     version: "1.0.0",
// // // // // //   //   }

// // // // // //   //   // Convert to JSON string
// // // // // //   //   const dashboardJson = JSON.stringify(dashboardState, null, 2)

// // // // // //   //   // Create a blob and save it as a file
// // // // // //   //   const blob = new Blob([dashboardJson], { type: "application/json" })
// // // // // //   //   saveAs(blob, `${dashboardTitle.replace(/\s+/g, "_").toLowerCase()}_dashboard.json`)

// // // // // //   //   message.success("Dashboard saved successfully")
// // // // // //   // }
// // // // // //     const handleSave = async () => {
// // // // // //       const dashboardState = {
// // // // // //         id: id && id !== "new" ? id : uuidv4(), // ✅ UUID for ID
// // // // // //         title: dashboardTitle,
// // // // // //         widgets: JSON.stringify(widgets),
// // // // // //         layouts: JSON.stringify(layouts),
// // // // // //         settings: JSON.stringify(dashboardSettings),
// // // // // //         assignedCustomers,
// // // // // //         timewindow: JSON.stringify(timeWindow),
// // // // // //         version: "1.0.0",
// // // // // //       }

// // // // // //       try {
// // // // // //         let result
// // // // // //         if (id && id !== "new") {
// // // // // //           result = await updateDashboard(id, dashboardState)
// // // // // //           message.success("Dashboard updated")
// // // // // //         } else {
// // // // // //           result = await createDashboard(dashboardState)
// // // // // //           message.success("Dashboard created")
// // // // // //           navigate(`/dashboards/${result.id}`)
// // // // // //         }
// // // // // //       } catch (err) {
// // // // // //         console.error(err)
// // // // // //         message.error("Failed to save dashboard")
// // // // // //       }
// // // // // //     }

// // // // // //     const handleExport = () => {
// // // // // //       const dashboardState = {
// // // // // //         id: id && id !== "new" ? id : uuidv4(), // ✅ UUID for ID
// // // // // //         title: dashboardTitle,
// // // // // //         widgets,
// // // // // //         layouts,
// // // // // //         settings: dashboardSettings,
// // // // // //         assignedCustomers,
// // // // // //         timeWindow,
// // // // // //         version: "1.0.0",
// // // // // //         createdTime: new Date().toISOString(),
// // // // // //       }

// // // // // //       const dashboardJson = JSON.stringify(dashboardState, null, 2)
// // // // // //       const blob = new Blob([dashboardJson], { type: "application/json" })
// // // // // //       saveAs(blob, `${dashboardTitle.replace(/\s+/g, "_").toLowerCase()}_dashboard.json`)
// // // // // //       message.success("Dashboard exported successfully")
// // // // // //     }


// // // // // //   const handleImportDashboard = (file) => {
// // // // // //     const reader = new FileReader()

// // // // // //     reader.onload = (e) => {
// // // // // //       try {
// // // // // //         const dashboardData = JSON.parse(e.target.result)

// // // // // //         // Validate the dashboard data
// // // // // //         if (!dashboardData.widgets || !dashboardData.layouts) {
// // // // // //           throw new Error("Invalid dashboard file format")
// // // // // //         }

// // // // // //         // Set dashboard state from imported file
// // // // // //         setDashboardTitle(dashboardData.title || "Imported Dashboard")
// // // // // //         setWidgets(dashboardData.widgets || [])
// // // // // //         setLayouts(dashboardData.layouts || { lg: [], md: [], sm: [], xs: [] })
// // // // // //         setDashboardSettings(dashboardData.settings || dashboardSettings)
// // // // // //         setAssignedCustomers(dashboardData.assignedCustomers || [])
// // // // // //         setTimeWindow(dashboardData.timewindow || timeWindow)

// // // // // //         setIsImportModalVisible(false)
// // // // // //         message.success("Dashboard imported successfully")
// // // // // //       } catch (error) {
// // // // // //         console.error("Error importing dashboard:", error)
// // // // // //         message.error("Failed to import dashboard. Invalid file format.")
// // // // // //       }
// // // // // //     }

// // // // // //     reader.readAsText(file)
// // // // // //   }

// // // // // //   const handleCancel = () => {
// // // // // //     navigate("/dashboards")
// // // // // //   }

// // // // // //   const timeWindowMenu = (
// // // // // //     <Menu>
// // // // // //       <Menu.Item
// // // // // //         key="realtime_15_minutes"
// // // // // //         onClick={() =>
// // // // // //           handleTimeWindowChange({ displayValue: "Last 15 minutes", value: "15_minutes", type: "REALTIME" })
// // // // // //         }
// // // // // //       >
// // // // // //         Last 15 minutes
// // // // // //       </Menu.Item>
// // // // // //       <Menu.Item
// // // // // //         key="realtime_30_minutes"
// // // // // //         onClick={() =>
// // // // // //           handleTimeWindowChange({ displayValue: "Last 30 minutes", value: "30_minutes", type: "REALTIME" })
// // // // // //         }
// // // // // //       >
// // // // // //         Last 30 minutes
// // // // // //       </Menu.Item>
// // // // // //       <Menu.Item
// // // // // //         key="realtime_1_hour"
// // // // // //         onClick={() => handleTimeWindowChange({ displayValue: "Last 1 hour", value: "1_hour", type: "REALTIME" })}
// // // // // //       >
// // // // // //         Last 1 hour
// // // // // //       </Menu.Item>
// // // // // //       <Menu.Item
// // // // // //         key="realtime_6_hours"
// // // // // //         onClick={() => handleTimeWindowChange({ displayValue: "Last 6 hours", value: "6_hours", type: "REALTIME" })}
// // // // // //       >
// // // // // //         Last 6 hours
// // // // // //       </Menu.Item>
// // // // // //       <Menu.Item
// // // // // //         key="realtime_1_day"
// // // // // //         onClick={() => handleTimeWindowChange({ displayValue: "Last 1 day", value: "1_day", type: "REALTIME" })}
// // // // // //       >
// // // // // //         Last 1 day
// // // // // //       </Menu.Item>
// // // // // //       <Menu.Item key="custom" onClick={() => setIsTimeWindowVisible(true)}>
// // // // // //         Custom...
// // // // // //       </Menu.Item>
// // // // // //     </Menu>
// // // // // //   )

// // // // // //   // Generate mock data for widgets based on time window
// // // // // //   const generateMockData = (telemetry, timeWindow) => {
// // // // // //     if (!telemetry || telemetry.length === 0) return []

// // // // // //     const now = new Date()
// // // // // //     const data = []
// // // // // //     let timeRange = 900000 // 15 minutes in milliseconds (default)

// // // // // //     // Set time range based on selected time window
// // // // // //     switch (timeWindow.value) {
// // // // // //       case "30_minutes":
// // // // // //         timeRange = 1800000
// // // // // //         break
// // // // // //       case "1_hour":
// // // // // //         timeRange = 3600000
// // // // // //         break
// // // // // //       case "6_hours":
// // // // // //         timeRange = 21600000
// // // // // //         break
// // // // // //       case "1_day":
// // // // // //         timeRange = 86400000
// // // // // //         break
// // // // // //       default:
// // // // // //         timeRange = 900000
// // // // // //     }

// // // // // //     // Number of data points to generate
// // // // // //     const numPoints = 100
// // // // // //     const interval = timeRange / numPoints

// // // // // //     for (let i = 0; i < numPoints; i++) {
// // // // // //       const time = new Date(now.getTime() - (numPoints - i) * interval)
// // // // // //       const point = { time: time.toISOString() }

// // // // // //       // Generate values for each data key
// // // // // //       telemetry.forEach((key) => {
// // // // // //         if (key === "temperature") {
// // // // // //           // Temperature between 20-30°C with some randomness
// // // // // //           point[key] = 25 + 5 * Math.sin((i / numPoints) * Math.PI * 2) + Math.random() * 2 - 1
// // // // // //         } else if (key === "humidity") {
// // // // // //           // Humidity between 40-60% with some randomness
// // // // // //           point[key] = 50 + 10 * Math.cos((i / numPoints) * Math.PI * 2) + Math.random() * 5 - 2.5
// // // // // //         } else if (key === "batteryLevel") {
// // // // // //           // Battery level decreasing from 100% to 80%
// // // // // //           point[key] = 100 - (20 * i) / numPoints - Math.random() * 2
// // // // // //         } else if (key === "signalStrength") {
// // // // // //           // Signal strength between 60-90% with some randomness
// // // // // //           point[key] = 75 + 15 * Math.sin((i / numPoints) * Math.PI * 4) + Math.random() * 5 - 2.5
// // // // // //         } else if (key === "status") {
// // // // // //           // Status is either "Online" or "Offline"
// // // // // //           point[key] = Math.random() > 0.1 ? "Online" : "Offline"
// // // // // //         } else {
// // // // // //           // Generic random value between 0-100
// // // // // //           point[key] = Math.random() * 100
// // // // // //         }
// // // // // //       })

// // // // // //       data.push(point)
// // // // // //     }

// // // // // //     return data
// // // // // //   }

// // // // // //   return (
// // // // // //     <Layout
// // // // // //       style={{
// // // // // //         minHeight: "100vh",
// // // // // //       }}
// // // // // //       className={isDarkMode ? "dark-theme" : ""}
// // // // // //     >
// // // // // //       <Header
// // // // // //         style={{
// // // // // //           background: isDarkMode ? "#1f1f1f" : "#fff",
// // // // // //           padding: "0 16px",
// // // // // //           display: "flex",
// // // // // //           justifyContent: "space-between",
// // // // // //           alignItems: "center",
// // // // // //           height: "64px",
// // // // // //           boxShadow: "0 1px 4px rgba(0,21,41,.08)",
// // // // // //         }}
// // // // // //       >
// // // // // //         <Input
// // // // // //           placeholder="Dashboard title"
// // // // // //           style={{ width: isMobile ? 150 : 300 }}
// // // // // //           value={dashboardTitle}
// // // // // //           onChange={(e) => setDashboardTitle(e.target.value)}
// // // // // //         />
// // // // // //         <Space wrap={isMobile}>
// // // // // //           <Button icon={<PlusOutlined />} onClick={() => setIsWidgetLibraryVisible(true)}>
// // // // // //             {!isMobile && "Add widget"}
// // // // // //           </Button>
// // // // // //           <Dropdown overlay={timeWindowMenu} trigger={["click"]}>
// // // // // //             <Button icon={<ClockCircleOutlined />}>
// // // // // //               {!isMobile && timeWindow.displayValue} {isMobile && <DownOutlined />}
// // // // // //             </Button>
// // // // // //           </Dropdown>
// // // // // //           <Button icon={<SettingOutlined />} onClick={() => setIsSettingsVisible(true)}>
// // // // // //             {!isMobile && "Settings"}
// // // // // //           </Button>
// // // // // //           {!isMobile && (
// // // // // //             <>
// // // // // //               <Button icon={<LinkOutlined />} onClick={() => setIsAliasesModalVisible(true)}>
// // // // // //                 Aliases
// // // // // //               </Button>
// // // // // //               <Button icon={<FilterOutlined />}>Filters</Button>
// // // // // //               <Button icon={<HistoryOutlined />}>Versions</Button>
// // // // // //             </>
// // // // // //           )}
// // // // // //           {!isTablet && (
// // // // // //             <Button icon={<TeamOutlined />} onClick={handleAssignCustomers}>
// // // // // //               Assign
// // // // // //             </Button>
// // // // // //           )}
// // // // // //           <Button icon={<UploadOutlined />} onClick={() => setIsImportModalVisible(true)}>
// // // // // //             {!isMobile && "Import"}
// // // // // //           </Button>
// // // // // //           <Button icon={<DownloadOutlined />} onClick={handleExport}>
// // // // // //             {!isMobile && "Export"}
// // // // // //           </Button>
// // // // // //           <Button icon={<CloseOutlined />} onClick={handleCancel}>
// // // // // //             {!isMobile && "Cancel"}
// // // // // //           </Button>
// // // // // //           <Button icon={<SaveOutlined />} type="primary" onClick={handleSave}>
// // // // // //             {!isMobile && "Save"}
// // // // // //           </Button>
// // // // // //           {!isMobile && <Button icon={<FullscreenOutlined />} />}
// // // // // //         </Space>
// // // // // //       </Header>

// // // // // //       {/* <Content
// // // // // //         style={{
// // // // // //           background: isDarkMode ? "#18181c" : "#f0f2f5",
// // // // // //           color: isDarkMode ? "#f0f0f0" : undefined,
// // // // // //           minHeight: "calc(100vh - 64px)",
// // // // // //           overflow: "auto",
// // // // // //         }}
// // // // // //       >
// // // // // //         <div
// // // // // //           style={{
// // // // // //                 minHeight: "100%",
// // // // // //                 background: isDarkMode ? "#1a1a1a" : "#fff",
// // // // // //                 boxShadow: isDarkMode
// // // // // //                   ? "0 1px 4px rgba(0,0,0,.45)"
// // // // // //                   : "0 1px 4px rgba(0,21,41,.08)",
// // // // // //           }}
// // // // // //         > */}

// // // // // //         <Content
// // // // // //           style={{
// // // // // //             minHeight: `calc(100vh - 64px)`,
// // // // // //             background: isDarkMode ? "#18181c" : "#f0f2f5",
// // // // // //             overflow: "auto",
// // // // // //             padding: 0,
// // // // // //           }}
// // // // // //         >
// // // // // //           <div
// // // // // //             style={{
// // // // // //               minHeight: `calc(100vh - 64px)`,
// // // // // //               background: isDarkMode ? "#18181c" : "#fff",
// // // // // //               boxShadow: "0 1px 4px rgba(0,21,41,.08)",
// // // // // //               display: "flex",
// // // // // //               flexDirection: "column",
// // // // // //               padding: isMobile ? 0 : 0,
// // // // // //             }}
// // // // // //           >          
// // // // // //           {widgets.length === 0 ? (
// // // // // //               <div style={{
// // // // // //                 flex: 1,
// // // // // //                 display: "flex",
// // // // // //                 flexDirection: "column",
// // // // // //                 alignItems: "center",
// // // // // //                 justifyContent: "center",
// // // // // //                 color: "#999",
// // // // // //                 minHeight: "200px"
// // // // // //               }}>
// // // // // //               <div style={{ fontSize: "64px", marginBottom: "16px" }}>📊</div>
// // // // // //               <Typography.Title level={4}>No widgets added yet</Typography.Title>
// // // // // //               <Button
// // // // // //                 type="primary"
// // // // // //                 icon={<PlusOutlined />}
// // // // // //                 onClick={() => setIsWidgetLibraryVisible(true)}
// // // // // //                 style={{ marginTop: "16px" }}
// // // // // //               >
// // // // // //                 Add your first widget
// // // // // //               </Button>
// // // // // //             </div>
// // // // // //           ) : (
// // // // // //             <ResponsiveGridLayout
// // // // // //               className="layout"
// // // // // //               layouts={layouts}
// // // // // //               breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
// // // // // //               cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
// // // // // //               rowHeight={100}
// // // // // //               onLayoutChange={handleLayoutChange}
// // // // // //               isDraggable={true}
// // // // // //               isResizable={true}
// // // // // //               margin={[10, 10]}
// // // // // //               draggableHandle=".widget-drag-handle" // <-- ONLY allow drag from this class

// // // // // //               // draggableCancel=".no-drag"
// // // // // //             >
// // // // // //             {/* <ResponsiveGridLayout
// // // // // //                 className="layout"
// // // // // //                 layouts={layouts}
// // // // // //                 breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
// // // // // //                 cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
// // // // // //                 rowHeight={100}
// // // // // //                 onLayoutChange={handleLayoutChange}
// // // // // //                 isDraggable={true}
// // // // // //                 isResizable={true}
// // // // // //                 margin={[10, 10]}
// // // // // //                 draggableHandle=".widget-drag-handle"
// // // // // //                 // draggableCancel=".no-drag"
// // // // // //                 style={{
// // // // // //                   flex: 1,
// // // // // //                   minHeight: 0,
// // // // // //                   // ensures it always fills available space
// // // // // //                 }}
// // // // // //               > */}
// // // // // //               {widgets.map((widget) => (
// // // // // //                   // <div key={widget.id} className="widget-container" style={{ position: "relative", border: "1px solid #eee", borderRadius: 6, overflow: "hidden" }}>
// // // // // //                   <div
// // // // // //                     key={widget.id}
// // // // // //                     className="widget-container"
// // // // // //                     style={{
// // // // // //                       position: "relative",
// // // // // //                       border: isDarkMode ? "1px solid #333" : "1px solid #eee",
// // // // // //                       background: isDarkMode ? "#23232a" : "#fff",
// // // // // //                       transition: "background 0.2s, border 0.2s",
// // // // // //                       height: "100%",
// // // // // //                       display: "flex",
// // // // // //                       flexDirection: "column",
// // // // // //                       minHeight: 0, // Allow widget-body to shrink if needed
// // // // // //                       boxSizing: "border-box",
// // // // // //                     }}
// // // // // //                   >

                    
// // // // // //                     {/* Floating Control Buttons */}
// // // // // //                     {/* <div
// // // // // //                       style={{
// // // // // //                         position: "absolute",
// // // // // //                         top: 4,
// // // // // //                         right: 4,
// // // // // //                         zIndex: 10,
// // // // // //                         display: "flex",
// // // // // //                         gap: 4,
// // // // // //                         background: "rgba(255,255,255,0.9)",
// // // // // //                         borderRadius: 4,
// // // // // //                         padding: 2,
// // // // // //                         boxShadow: "0 0 4px rgba(0,0,0,0.1)"
// // // // // //                       }}
// // // // // //                     > */}
// // // // // //                     <div
// // // // // //                       style={{
// // // // // //                         position: "absolute",
// // // // // //                         top: 4,
// // // // // //                         right: 4,
// // // // // //                         zIndex: 10,
// // // // // //                         display: "flex",
// // // // // //                         gap: 4,
// // // // // //                         background: isDarkMode ? "rgba(32,32,32,0.95)" : "rgba(255,255,255,0.95)",
// // // // // //                         borderRadius: 4,
// // // // // //                         padding: 2,
// // // // // //                         boxShadow: isDarkMode
// // // // // //                           ? "0 0 4px rgba(0,0,0,0.4)"
// // // // // //                           : "0 0 4px rgba(0,0,0,0.1)",
// // // // // //                       }}
// // // // // //                     >

// // // // // //                       <Button
// // // // // //                         type="text"
// // // // // //                         size="small"
// // // // // //                         icon={<EditOutlined />}
// // // // // //                         onClick={(e) => {
// // // // // //                           e.stopPropagation()
// // // // // //                           handleWidgetSettings(widget)
// // // // // //                         }}
// // // // // //                       />
// // // // // //                       <Button
// // // // // //                         type="text"
// // // // // //                         size="small"
// // // // // //                         icon={<CopyOutlined />}
// // // // // //                         onClick={(e) => {
// // // // // //                           e.stopPropagation()
// // // // // //                           handleDuplicateWidget(widget)
// // // // // //                         }}
// // // // // //                       />
// // // // // //                       <Button
// // // // // //                         type="text"
// // // // // //                         size="small"
// // // // // //                         danger
// // // // // //                         icon={<DeleteOutlined />}
// // // // // //                         onClick={(e) => {
// // // // // //                           e.stopPropagation()
// // // // // //                           handleDeleteWidget(widget.id)
// // // // // //                         }}
// // // // // //                       />
// // // // // //                     </div>

// // // // // //                     {/* Drag Handle Header */}
// // // // // //                     {/* <div
// // // // // //                       className="widget-drag-handle"
// // // // // //                       style={{
// // // // // //                         cursor: "move",
// // // // // //                         padding: "6px 12px",
// // // // // //                         fontWeight: 500,
// // // // // //                         fontSize: 14,
// // // // // //                         background: "#f5f5f5",
// // // // // //                         borderBottom: "1px solid #e0e0e0",
// // // // // //                         color: "#333",
// // // // // //                       }}
// // // // // //                     > */}
// // // // // //                       {/* <div
// // // // // //                         className="widget-drag-handle"
// // // // // //                         style={{
// // // // // //                           cursor: "move",
// // // // // //                           padding: "5px 5px",
// // // // // //                           fontWeight: 500,
// // // // // //                           fontSize: 14,
// // // // // //                           background: isDarkMode ? "#18181c" : "#f5f5f5",
// // // // // //                           // borderBottom: isDarkMode ? "1px solid #333" : "1px solid #e0e0e0",
// // // // // //                           color: isDarkMode ? "#eee" : "#333",
// // // // // //                           transition: "background 0.2s, color 0.2s, border-bottom 0.2s",
// // // // // //                         }}
// // // // // //                       > */}
// // // // // //                         <div
// // // // // //                           className="widget-drag-handle"
// // // // // //                           style={{
// // // // // //                             cursor: "move",
// // // // // //                             padding: "5px 5px",
// // // // // //                             fontWeight: 500,
// // // // // //                             fontSize: 14,
// // // // // //                             background: isDarkMode ? "#18181c" : "#f5f5f5",
// // // // // //                             color: isDarkMode ? "#eee" : "#333",
// // // // // //                             minHeight: 38, // Set min-height for header
// // // // // //                             maxHeight: 38,
// // // // // //                             lineHeight: "28px",
// // // // // //                             flex: "0 0 38px", // Fixed header
// // // // // //                             borderBottom: isDarkMode ? "1px solid #222" : "1px solid #eee",
// // // // // //                             transition: "background 0.2s, color 0.2s, border-bottom 0.2s",
// // // // // //                           }}
// // // // // //                         >
// // // // // //                       {widget.title}
// // // // // //                     </div>

// // // // // //                     {/* Widget Body */}
// // // // // //                       <div
// // // // // //                         style={{
// // // // // //                           flex: 1,
// // // // // //                           minHeight: 0,
// // // // // //                           overflow: "auto",
// // // // // //                           padding: 0,
// // // // // //                           background: "inherit"
// // // // // //                         }}
// // // // // //                       >
// // // // // //                       <WidgetRenderer
// // // // // //                         widget={widget}
// // // // // //                         config={{
// // // // // //                           ...widget.config,
// // // // // //                           data: generateMockData(widget.config?.dataSource?.telemetry, timeWindow),
// // // // // //                           timeWindow: timeWindow,
// // // // // //                         }}
// // // // // //                       />
// // // // // //                     </div>
// // // // // //                   </div>
// // // // // //                 ))}


// // // // // //             </ResponsiveGridLayout>
// // // // // //           )}
// // // // // //         </div>
// // // // // //       </Content>

// // // // // //       <WidgetLibrary
// // // // // //         visible={isWidgetLibraryVisible}
// // // // // //         onClose={() => setIsWidgetLibraryVisible(false)}
// // // // // //         onSelect={handleAddWidget}
// // // // // //       />

// // // // // //       <TimeWindowSettings
// // // // // //         visible={isTimeWindowVisible}
// // // // // //         onClose={() => setIsTimeWindowVisible(false)}
// // // // // //         onSave={handleTimeWindowChange}
// // // // // //         initialValue={timeWindow}
// // // // // //       />

// // // // // //       <DashboardSettings visible={isSettingsVisible} onClose={() => setIsSettingsVisible(false)} />

// // // // // //       <ManageLayoutsModal visible={isLayoutsModalVisible} onClose={() => setIsLayoutsModalVisible(false)} />

// // // // // //       <ManageStatesModal visible={isStatesModalVisible} onClose={() => setIsStatesModalVisible(false)} />

// // // // // //       <EntityAliasesModal visible={isAliasesModalVisible} onClose={() => setIsAliasesModalVisible(false)} />

// // // // // //       <WidgetConfigModal
// // // // // //         visible={isWidgetConfigModalVisible}
// // // // // //         onCancel={() => setIsWidgetConfigModalVisible(false)}
// // // // // //         onSave={handleWidgetConfigSave}
// // // // // //         widget={selectedWidget}
// // // // // //         devices={devices}
// // // // // //       />

// // // // // //       {/* Import Dashboard Modal */}
// // // // // //       <Modal
// // // // // //         title="Import Dashboard"
// // // // // //         open={isImportModalVisible}
// // // // // //         onCancel={() => setIsImportModalVisible(false)}
// // // // // //         footer={null}
// // // // // //       >
// // // // // //         <div style={{ padding: "20px 0" }}>
// // // // // //           <input
// // // // // //             type="file"
// // // // // //             accept=".json"
// // // // // //             onChange={(e) => {
// // // // // //               if (e.target.files && e.target.files[0]) {
// // // // // //                 handleImportDashboard(e.target.files[0])
// // // // // //               }
// // // // // //             }}
// // // // // //             style={{ marginBottom: "20px" }}
// // // // // //           />
// // // // // //           <Typography.Paragraph>
// // // // // //             Select a dashboard JSON file to import. The file should contain a valid dashboard configuration.
// // // // // //           </Typography.Paragraph>
// // // // // //           <Typography.Text type="secondary">
// // // // // //             Note: Importing a dashboard will replace your current dashboard configuration.
// // // // // //           </Typography.Text>
// // // // // //         </div>
// // // // // //       </Modal>

// // // // // //       {/* Assign Customer Modal */}
// // // // // //       <Modal
// // // // // //         title="Assign Dashboard to Customers"
// // // // // //         open={isAssignCustomerModalVisible}
// // // // // //         onCancel={() => setIsAssignCustomerModalVisible(false)}
// // // // // //         onOk={() => {
// // // // // //           form.validateFields().then((values) => {
// // // // // //             handleAssignCustomersSave(values.customers)
// // // // // //           })
// // // // // //         }}
// // // // // //       >
// // // // // //         <Form form={form} layout="vertical" initialValues={{ customers: assignedCustomers }}>
// // // // // //           <Form.Item
// // // // // //             name="customers"
// // // // // //             label="Select Customers"
// // // // // //             rules={[{ required: false, message: "Please select at least one customer" }]}
// // // // // //           >
// // // // // //             <Select mode="multiple" placeholder="Select customers" style={{ width: "100%" }} optionLabelProp="label">
// // // // // //               {customers.map((customer) => (
// // // // // //                 <Select.Option key={customer.id} value={customer.id} label={customer.name}>
// // // // // //                   {customer.name}
// // // // // //                 </Select.Option>
// // // // // //               ))}
// // // // // //             </Select>
// // // // // //           </Form.Item>
// // // // // //           <Typography.Paragraph>
// // // // // //             Assigned customers will be able to view this dashboard in their customer portal.
// // // // // //           </Typography.Paragraph>
// // // // // //         </Form>
// // // // // //       </Modal>
// // // // // //     </Layout>
// // // // // //   )
// // // // // // }

// // // // // // export default DashboardEditor
