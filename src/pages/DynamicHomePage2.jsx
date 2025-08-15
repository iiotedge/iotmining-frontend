"use client"

import React, { useState, useEffect } from "react"
import {
  Layout, Button, Drawer, List, Checkbox, Tag, Typography, Space, message,
} from "antd"
import { AppstoreAddOutlined } from "@ant-design/icons"
import { fetchDevices } from "../services/dashboardService"
import WidgetRenderer from "../components/dashboard/WidgetRenderer"
import { useTheme } from "../components/theme/ThemeProvider"

const { Header, Content } = Layout
const { Text } = Typography

function DeviceSelectorDrawer({ open, onClose, devices, selected, onChange, loading }) {
  return (
    <Drawer
      title="Select Device(s)"
      placement="left"
      onClose={onClose}
      open={open}
      width={320}
    >
      {loading ? "Loading..." :
        <List
          dataSource={devices}
          renderItem={device => (
            <List.Item>
              <Checkbox
                checked={selected.includes(device.id)}
                onChange={e => {
                  const checked = e.target.checked
                  let newSel
                  if (checked)
                    newSel = [...selected, device.id]
                  else
                    newSel = selected.filter(id => id !== device.id)
                  onChange(newSel)
                }}
              >
                <Text strong>{device.name || device.id}</Text>
                {device.status &&
                  <Tag color={device.status === "online" ? "green" : "red"} style={{marginLeft:8}}>
                    {device.status}
                  </Tag>
                }
              </Checkbox>
            </List.Item>
          )}
        />
      }
      <Space style={{ marginTop: 16 }}>
        <Button type="primary" onClick={onClose}>Done</Button>
      </Space>
    </Drawer>
  )
}

const DynamicHomePage2 = () => {
  const { theme } = useTheme()
  const [deviceDrawerOpen, setDeviceDrawerOpen] = useState(false)
  const [allDevices, setAllDevices] = useState([])
  const [deviceLoading, setDeviceLoading] = useState(false)
  const [selectedDevices, setSelectedDevices] = useState([])

  // Example: Widget layout and config (Replace with your own logic!)
  const [widgets, setWidgets] = useState([
    // { id: "w1", type: "json-table", config: {...} },
    // { id: "w2", type: "gauge", config: {...} },
  ])

  // Fetch devices on mount
  useEffect(() => {
    setDeviceLoading(true)
    fetchDevices()
      .then(devs => setAllDevices(devs))
      .catch(err => message.error("Failed to fetch devices"))
      .finally(() => setDeviceLoading(false))
  }, [])

  // Example: If you want to default select first device
  useEffect(() => {
    if (allDevices.length && selectedDevices.length === 0) {
      setSelectedDevices([allDevices[0].id])
    }
  }, [allDevices, selectedDevices])

  // --- Your normal dashboard UI/layout code here ---
  // No changes below except header button and drawer

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{
        background: theme === "dark" ? "#1f1f1f" : "#fff",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <Text style={{
          color: theme === "dark" ? "#fff" : "#222",
          fontWeight: 600, fontSize: 20, letterSpacing: 1,
        }}>
          IoT Device Dashboard
        </Text>
        <div>
          {/* Device Switch Button */}
          <Button
            icon={<AppstoreAddOutlined />}
            onClick={() => setDeviceDrawerOpen(true)}
            type="primary"
            style={{ marginRight: 8 }}
          >
            {selectedDevices.length > 0
              ? `Device${selectedDevices.length > 1 ? "s" : ""}: ${selectedDevices.map(id => {
                  const d = allDevices.find(x => x.id === id)
                  return d?.name || id
                }).join(", ")}`
              : "Select Device(s)"}
          </Button>
        </div>
      </Header>

      <Content style={{
        padding: 24,
        background: theme === "dark" ? "#181a1b" : "#f5f6fa",
        minHeight: 360,
      }}>
        {/* Render your dashboard grid/layout and widgets as before */}
        {/* Pass selectedDevices to widgets as prop if needed */}
        {widgets.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <Text type="secondary" style={{ fontSize: 16 }}>No widgets configured.</Text>
          </div>
        ) : (
          <div className="widget-grid">
            {widgets.map(widget => (
              <WidgetRenderer
                key={widget.id}
                widget={widget}
                selectedDevices={selectedDevices}
                theme={theme}
              />
            ))}
          </div>
        )}
      </Content>

      {/* Device Selector Drawer */}
      <DeviceSelectorDrawer
        open={deviceDrawerOpen}
        onClose={() => setDeviceDrawerOpen(false)}
        devices={allDevices}
        selected={selectedDevices}
        onChange={setSelectedDevices}
        loading={deviceLoading}
      />
    </Layout>
  )
}

export default DynamicHomePage2
