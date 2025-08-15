"use client"

import { useState, useEffect } from "react"
import { Layout, Button, Space, Input, Typography, message, Modal, Form, Select, Tabs } from "antd"
import { useParams, useNavigate } from "react-router-dom"
import {
  PlusOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  LinkOutlined,
  FilterOutlined,
  HistoryOutlined,
  CloseOutlined,
  SaveOutlined,
  FullscreenOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons"
import { Responsive, WidthProvider } from "react-grid-layout"
import { saveAs } from "file-saver"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

import WidgetLibrary from "../components/dashboard/WidgetLibrary"
import TimeWindowSettings from "../components/dashboard/TimeWindowSettings"
import DashboardSettings from "../components/dashboard/DashboardSettings"
import ManageLayoutsModal from "../components/dashboard/ManageLayoutsModal"
import ManageStatesModal from "../components/dashboard/ManageStatesModal"
import EntityAliasesModal from "../components/dashboard/EntityAliasesModal"
import WidgetRenderer from "../components/dashboard/WidgetRenderer"
import { createDashboard, updateDashboard } from "../services/api"

const { Header, Content } = Layout
const { Title } = Typography
const { TabPane } = Tabs

const ResponsiveGridLayout = WidthProvider(Responsive)

const DashboardEditor = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isWidgetLibraryVisible, setIsWidgetLibraryVisible] = useState(false)
  const [isTimeWindowVisible, setIsTimeWindowVisible] = useState(false)
  const [isSettingsVisible, setIsSettingsVisible] = useState(false)
  const [selectedWidget, setSelectedWidget] = useState(null)
  const [isWidgetSettingsVisible, setIsWidgetSettingsVisible] = useState(false)
  const [widgets, setWidgets] = useState([])
  const [layouts, setLayouts] = useState({ lg: [] })
  const [isLayoutsModalVisible, setIsLayoutsModalVisible] = useState(false)
  const [isStatesModalVisible, setIsStatesModalVisible] = useState(false)
  const [isAliasesModalVisible, setIsAliasesModalVisible] = useState(false)
  const [dashboardTitle, setDashboardTitle] = useState("New Dashboard")
  const [dashboardSettings, setDashboardSettings] = useState({
    timewindow: {
      realtime: { timewindowMs: 60000 },
      aggregation: { type: "AVG", limit: 200 },
    },
    gridSettings: {
      backgroundColor: "#ffffff",
      columns: 24,
      margin: [10, 10],
      backgroundImage: null,
    },
  })
  const [isImportModalVisible, setIsImportModalVisible] = useState(false)
  const [form] = Form.useForm()

  // Load dashboard data when component mounts
  // useEffect(() => {
  //   console.log("Dashboard Editor loaded with ID:", id)
  //   // Here you would typically fetch the dashboard data based on the ID
  //   // For now, we'll just set a default title
  //   setDashboardTitle(id ? `Dashboard ${id}` : "New Dashboard")
  // }, [id])

  useEffect(() => {
    if (id && id !== "new") {
      fetchDashboard(id)
    } else {
      setDashboardTitle(id ? `Dashboard ${id}` : "New Dashboard")
      // setDashboardTitle("New Dashboard")
    }
  }, [id])
  
  const handleAddWidget = (widget) => {
    const widgetId = Date.now().toString()
    const newWidget = {
      ...widget,
      id: widgetId,
      config: {
        title: widget.title,
        // Default configuration based on widget type
        ...(widget.type.includes("chart")
          ? {
              height: 300,
              refreshInterval: 30,
            }
          : {}),
        ...(widget.type.includes("map")
          ? {
              zoom: 4,
              center: { lat: 37.7749, lng: -122.4194 },
            }
          : {}),
      },
    }

    // Add widget to widgets array
    setWidgets([...widgets, newWidget])

    // Create a layout for the new widget
    const newLayout = {
      i: widgetId,
      x: (layouts.lg.length * 4) % 12, // Position based on number of widgets
      y: Number.POSITIVE_INFINITY, // Put it at the bottom
      w: 4, // Default width
      h: 4, // Default height
      minW: 2, // Min width
      minH: 2, // Min height
    }

    // Update layouts
    setLayouts({
      lg: [...layouts.lg, newLayout],
    })

    setIsWidgetLibraryVisible(false)
    message.success(`Added ${widget.title} widget`)
  }

  const handleWidgetSettings = (widget) => {
    setSelectedWidget(widget)

    // Set form values based on widget config
    form.setFieldsValue({
      title: widget.title,
      ...widget.config,
    })

    setIsWidgetSettingsVisible(true)
  }

  const handleWidgetSettingsSubmit = () => {
    form.validateFields().then((values) => {
      // Update the widget with new settings
      const updatedWidgets = widgets.map((w) => {
        if (w.id === selectedWidget.id) {
          return {
            ...w,
            title: values.title,
            config: {
              ...w.config,
              ...values,
            },
          }
        }
        return w
      })

      setWidgets(updatedWidgets)
      setIsWidgetSettingsVisible(false)
      message.success("Widget settings updated")
    })
  }

  const handleDeleteWidget = (widgetId) => {
    Modal.confirm({
      title: "Are you sure you want to delete this widget?",
      content: "This action cannot be undone.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        // Remove widget from widgets array
        setWidgets(widgets.filter((w) => w.id !== widgetId))

        // Remove widget from layout
        setLayouts({
          lg: layouts.lg.filter((item) => item.i !== widgetId),
        })

        message.success("Widget deleted")
      },
    })
  }

  const handleDuplicateWidget = (widget) => {
    const newWidgetId = Date.now().toString()
    const newWidget = {
      ...widget,
      id: newWidgetId,
      title: `${widget.title} (Copy)`,
    }

    // Add duplicated widget to widgets array
    setWidgets([...widgets, newWidget])

    // Find the layout of the original widget
    const originalLayout = layouts.lg.find((item) => item.i === widget.id)

    if (originalLayout) {
      // Create a new layout for the duplicated widget
      const newLayout = {
        ...originalLayout,
        i: newWidgetId,
        x: (originalLayout.x + 1) % 12, // Position it next to the original
        y: originalLayout.y + 1, // Position it below the original
      }

      // Update layouts
      setLayouts({
        lg: [...layouts.lg, newLayout],
      })
    }

    message.success("Widget duplicated")
  }

  const handleLayoutChange = (layout, allLayouts) => {
    setLayouts(allLayouts)
  }

  // const handleSave = () => {
  //   // Create dashboard state object
  //   const dashboardState = {
  //     id: id || Date.now().toString(),
  //     title: dashboardTitle,
  //     widgets: widgets,
  //     layouts: layouts,
  //     settings: dashboardSettings,
  //     createdTime: new Date().toISOString(),
  //     version: "1.0.0",
  //   }

  //   // Convert to JSON string
  //   const dashboardJson = JSON.stringify(dashboardState, null, 2)

  //   // Create a blob and save it as a file
  //   const blob = new Blob([dashboardJson], { type: "application/json" })
  //   saveAs(blob, `${dashboardTitle.replace(/\s+/g, "_").toLowerCase()}_dashboard.json`)

  //   message.success("Dashboard saved successfully")
  // }

  // const handleSave = async () => {
  //   const dashboardState = {
  //     id: id === "new" ? Date.now().toString() : id,
  //     title: dashboardTitle,
  //     widgets: JSON.stringify(widgets),
  //     layouts: JSON.stringify(layouts),
  //     settings: JSON.stringify(dashboardSettings),
  //     assignedCustomers,
  //     timewindow: JSON.stringify(timeWindow),
  //     version: "1.0.0",
  //   }
  
  //   try {
  //     let result
  //     if (id && id !== "new") {
  //       // Try PUT first — may fail if dashboard doesn't exist yet
  //       const res = await updateDashboard(id, dashboardState)
  //       result = res
  //       message.success("Dashboard updated successfully")
  //     } else {
  //       const res = await createDashboard(dashboardState)
  //       result = res
  //       message.success("Dashboard created successfully")
  //       navigate(`/dashboards/${res.id}`)
  //     }
  //   } catch (err) {
  //     // If PUT fails with 404, fallback to POST
  //     if (err.message.includes("404")) {
  //       try {
  //         const res = await createDashboard(dashboardState)
  //         message.success("Dashboard created successfully")
  //         navigate(`/dashboards/${res.id}`)
  //       } catch (e) {
  //         console.error(e)
  //         message.error("Failed to create dashboard")
  //       }
  //     } else {
  //       console.error(err)
  //       message.error("Failed to save dashboard")
  //     }
  //   }
  // }
  
  const handleSave = async () => {
    const dashboardData = {
      id,
      title: dashboardTitle,
      widgets: JSON.stringify(widgets),
      layouts: JSON.stringify(layouts),
      settings: JSON.stringify(dashboardSettings),
      assignedCustomers,
      timewindow: JSON.stringify(timeWindow),
      version: "1.0.0"
    };
  
    try {
      // Try PUT first
      await updateDashboard(id, dashboardData);
      message.success("Dashboard updated successfully");
    } catch (error) {
      if (error.message.includes("404")) {
        // Fallback to POST
        try {
          const newDashboard = await createDashboard(dashboardData);
          message.success("Dashboard created successfully");
          navigate(`/dashboards/${newDashboard.id}`);
        } catch (e) {
          console.error("Create failed", e);
          message.error("Failed to create dashboard");
        }
      } else {
        console.error("Update failed", error);
        message.error("Failed to update dashboard");
      }
    }
  };
  
  const handleImportDashboard = (file) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const dashboardData = JSON.parse(e.target.result)

        // Validate the dashboard data
        if (!dashboardData.widgets || !dashboardData.layouts) {
          throw new Error("Invalid dashboard file format")
        }

        // Set dashboard state from imported file
        setDashboardTitle(dashboardData.title || "Imported Dashboard")
        setWidgets(dashboardData.widgets || [])
        setLayouts(dashboardData.layouts || { lg: [] })
        setDashboardSettings(dashboardData.settings || dashboardSettings)

        setIsImportModalVisible(false)
        message.success("Dashboard imported successfully")
      } catch (error) {
        console.error("Error importing dashboard:", error)
        message.error("Failed to import dashboard. Invalid file format.")
      }
    }

    reader.readAsText(file)
  }

  const handleCancel = () => {
    navigate("/dashboards")
  }

  return (
    <Layout style={{ height: "calc(100vh - 64px)" }}>
      <Header
        style={{
          background: "#fff",
          padding: "0 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "64px",
          boxShadow: "0 1px 4px rgba(0,21,41,.08)",
        }}
      >
        <Input
          placeholder="Dashboard title"
          style={{ width: 300 }}
          value={dashboardTitle}
          onChange={(e) => setDashboardTitle(e.target.value)}
        />
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => setIsWidgetLibraryVisible(true)}>
            Add widget
          </Button>
          <Button icon={<ClockCircleOutlined />} onClick={() => setIsTimeWindowVisible(true)}>
            Time window
          </Button>
          <Button icon={<SettingOutlined />} onClick={() => setIsSettingsVisible(true)}>
            Settings
          </Button>
          <Button icon={<LinkOutlined />} onClick={() => setIsAliasesModalVisible(true)}>
            Aliases
          </Button>
          <Button icon={<FilterOutlined />}>Filters</Button>
          <Button icon={<HistoryOutlined />}>Versions</Button>
          <Button icon={<UploadOutlined />} onClick={() => setIsImportModalVisible(true)}>
            Import
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleSave}>
            Export
          </Button>
          <Button icon={<CloseOutlined />} onClick={handleCancel}>
            Cancel
          </Button>
          <Button icon={<SaveOutlined />} type="primary" onClick={handleSave}>
            Save
          </Button>
          <Button icon={<FullscreenOutlined />} />
        </Space>
      </Header>

      <Content style={{ padding: "24px", background: "#f0f2f5", overflow: "auto" }}>
        <div
          style={{
            minHeight: "100%",
            background: "#fff",
            padding: "24px",
            borderRadius: "4px",
            boxShadow: "0 1px 4px rgba(0,21,41,.08)",
          }}
        >
          {widgets.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "400px",
                color: "#999",
              }}
            >
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>📊</div>
              <Typography.Title level={4}>No widgets added yet</Typography.Title>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsWidgetLibraryVisible(true)}
                style={{ marginTop: "16px" }}
              >
                Add your first widget
              </Button>
            </div>
          ) : (
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={100}
              onLayoutChange={handleLayoutChange}
              isDraggable={true}
              isResizable={true}
              margin={[10, 10]}
            >
              {widgets.map((widget) => (
                <div key={widget.id} className="widget-container">
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      zIndex: 10,
                      padding: "8px",
                      display: "flex",
                      gap: "4px",
                      background: "rgba(255, 255, 255, 0.8)",
                      borderRadius: "0 0 0 4px",
                    }}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleWidgetSettings(widget)
                      }}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDuplicateWidget(widget)
                      }}
                    />
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteWidget(widget.id)
                      }}
                    />
                  </div>
                  <WidgetRenderer widget={widget} config={widget.config} />
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

      <TimeWindowSettings visible={isTimeWindowVisible} onClose={() => setIsTimeWindowVisible(false)} />

      <DashboardSettings visible={isSettingsVisible} onClose={() => setIsSettingsVisible(false)} />

      <ManageLayoutsModal visible={isLayoutsModalVisible} onClose={() => setIsLayoutsModalVisible(false)} />

      <ManageStatesModal visible={isStatesModalVisible} onClose={() => setIsStatesModalVisible(false)} />

      <EntityAliasesModal visible={isAliasesModalVisible} onClose={() => setIsAliasesModalVisible(false)} />

      {/* Widget Settings Modal */}
      <Modal
        title={`Widget Settings: ${selectedWidget?.title || ""}`}
        open={isWidgetSettingsVisible}
        onCancel={() => setIsWidgetSettingsVisible(false)}
        onOk={handleWidgetSettingsSubmit}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Tabs defaultActiveKey="general">
            <TabPane tab="General" key="general">
              {selectedWidget?.type?.includes("chart") && (
                <>
                  <Form.Item name="height" label="Height (px)" rules={[{ type: "number", min: 100 }]}>
                    <Input type="number" />
                  </Form.Item>
                  <Form.Item name="refreshInterval" label="Refresh Interval (seconds)">
                    <Input type="number" />
                  </Form.Item>
                </>
              )}

              {selectedWidget?.type?.includes("map") && (
                <>
                  <Form.Item name="zoom" label="Default Zoom Level" rules={[{ type: "number", min: 1, max: 20 }]}>
                    <Input type="number" />
                  </Form.Item>
                </>
              )}
            </TabPane>

            <TabPane tab="Advanced" key="advanced">
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} />
              </Form.Item>
            </TabPane>

            <TabPane tab="Data" key="data">
              <Form.Item name="dataSource" label="Data Source">
                <Select>
                  <Select.Option value="device">Device</Select.Option>
                  <Select.Option value="asset">Asset</Select.Option>
                  <Select.Option value="entity">Entity</Select.Option>
                  <Select.Option value="static">Static Data</Select.Option>
                </Select>
              </Form.Item>
            </TabPane>
          </Tabs>
        </Form>
      </Modal>

      {/* Import Dashboard Modal */}
      <Modal
        title="Import Dashboard"
        open={isImportModalVisible}
        onCancel={() => setIsImportModalVisible(false)}
        footer={null}
      >
        <div style={{ padding: "20px 0" }}>
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleImportDashboard(e.target.files[0])
              }
            }}
            style={{ marginBottom: "20px" }}
          />
          <Typography.Paragraph>
            Select a dashboard JSON file to import. The file should contain a valid dashboard configuration.
          </Typography.Paragraph>
          <Typography.Text type="secondary">
            Note: Importing a dashboard will replace your current dashboard configuration.
          </Typography.Text>
        </div>
      </Modal>
    </Layout>
  )
}

export default DashboardEditor
