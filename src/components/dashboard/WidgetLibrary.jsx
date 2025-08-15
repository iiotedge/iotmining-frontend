"use client"

import { Modal, Tabs, Input, Card, Row, Col, Typography, Button } from "antd"
import { SearchOutlined, UploadOutlined } from "@ant-design/icons"
import { useState } from "react"

const { TabPane } = Tabs
const { Text } = Typography

const widgetBundles = {
  charts: [
    { title: "Line chart", icon: "📈", type: "line-chart" },
    { title: "Bar chart", icon: "📊", type: "bar-chart" },
    { title: "Pie chart", icon: "🥧", type: "pie-chart" },
    { title: "Time series chart", icon: "📉", type: "time-series-chart" },
    { title: "Point chart", icon: "📍", type: "point-chart" },
    { title: "Doughnut chart", icon: "🍩", type: "doughnut-chart" },
  ],
  cards: [
    { title: "Value card", icon: "📝", type: "value-card" },
    { title: "Status card", icon: "✅", type: "status-card" },
    { title: "Air quality index card", icon: "🌡️", type: "air-quality-card" },
    { title: "Image card", icon: "🎦", type: "image-card" },
  ],
  alarms: [ 
    { title: "Alert", icon: "🚨", type: "alert-system-card" },
    { title: "Alarm count", icon: "🚨", type: "alarm-count" },
    { title: "Alarm table", icon: "📋", type: "alarm-table" },
    { title: "Water Logging", icon: "🚨", type: "water-logging" },
    { title: "Fire Detection", icon: "🚨", type: "fire-detection" }
  ],
  tables: [
    { title: "Basic table", icon: "📑", type: "basic-table" },
    { title: "Data table", icon: "📊", type: "data-table" },
    { title: "Raw Data table", icon: "📊", type: "json-table" },
  ],
  maps: [
    { title: "Google map", icon: "🗺️", type: "google-map" },
    { title: "OpenStreet map", icon: "🌍", type: "openstreet-map" },
  ],
  gauges: [
    { title: "Radial gauge", icon: "⭕", type: "radial-gauge" },
    { title: "Linear gauge", icon: "📏", type: "linear-gauge" },
  ],
  controls: [
    { title: "Button", icon: "🔘", type: "button-control" },
    { title: "Switch", icon: "🔄", type: "switch-control" },
    { title: "Slider Control", icon: "⬅️", type: "slider-control" },
    { title: "Value Stepper", icon: "⬅️", type: "value-stepper" },
    { title: "Switch Control Widget", icon: "⬅️", type: "switch-control-widget" },
    { title: "Led Indicator", icon: "⬅️", type: "led-indicator" },
  ],
  indicators: [
    { title: "Battery level", icon: "🔋", type: "battery-level" },
    { title: "Signal strength", icon: "📶", type: "signal-strength" },
    { title: "Progress bar", icon: "⏳", type: "progress-bar" },
  ],
  industrial: [
    { title: "Flow rate gauge", icon: "🌊", type: "flow-rate-gauge" },
    { title: "Pressure card", icon: "📊", type: "pressure-card" },
    { title: "Temperature gauge", icon: "🌡️", type: "temperature-gauge" },
  ],
  cameras: [
    { title: "Live camera", icon: "📹", type: "camera" },
    { title: "Camera grid", icon: "🎦", type: "camera-grid" },
    { title: "Motion detection", icon: "👁️", type: "motion-detection" },
  ],
  security: [
    { title: "Camera Feed", icon: "📹", type: "camera-feed" },
    { title: "Camera Grid View", icon: "🎦", type: "camera-grid" },
    { title: "Door Lock System", icon: "🎦", type: "door-lock" },
  ],
  misc: [
    { title: "Fan Grid Control", icon: "*", type: "fan-grid-control" },
    { title: "Fan Control", icon: "*", type: "fan-control" },
    { title: "Single Fan Control", icon: "*", type: "single-fan-control" },
    { title: "Dynamic Json Form", icon: "*", type: "dynamic-form-control" },
    { title: "Device Control Command", icon: "*", type: "device-command-control" }
    
  ],
}

const WidgetLibrary = ({ visible, onClose, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBundle, setSelectedBundle] = useState("all")

  const filterWidgets = (widgets) => {
    if (!searchTerm) return widgets
    return widgets.filter((w) => w.title.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  return (
    <Modal title="Select widget" open={visible} onCancel={onClose} width={1200} footer={null}>
      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
        <Input
          placeholder="Search widgets"
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 300 }}
        />
        <Button icon={<UploadOutlined />}>Import widget</Button>
      </div>

      <Tabs defaultActiveKey="all">
        <TabPane tab="All widgets" key="all">
          {Object.entries(widgetBundles).map(([category, widgets]) => (
            <div key={category} style={{ marginBottom: "24px" }}>
              <Text strong style={{ textTransform: "capitalize", marginBottom: "16px", display: "block" }}>
                {category}
              </Text>
              <Row gutter={[16, 16]}>
                {filterWidgets(widgets).map((widget, index) => (
                  <Col span={6} key={index}>
                    <Card hoverable onClick={() => onSelect(widget)} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "32px", marginBottom: "8px" }}>{widget.icon}</div>
                      <Text>{widget.title}</Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </TabPane>
        <TabPane tab="Charts" key="charts">
          <Row gutter={[16, 16]}>
            {filterWidgets(widgetBundles.charts).map((widget, index) => (
              <Col span={6} key={index}>
                <Card hoverable onClick={() => onSelect(widget)} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>{widget.icon}</div>
                  <Text>{widget.title}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
        <TabPane tab="Cards" key="cards">
          <Row gutter={[16, 16]}>
            {filterWidgets(widgetBundles.cards).map((widget, index) => (
              <Col span={6} key={index}>
                <Card hoverable onClick={() => onSelect(widget)} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>{widget.icon}</div>
                  <Text>{widget.title}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
        <TabPane tab="Alarms" key="alarms">
          <Row gutter={[16, 16]}>
            {filterWidgets(widgetBundles.alarms).map((widget, index) => (
              <Col span={6} key={index}>
                <Card hoverable onClick={() => onSelect(widget)} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>{widget.icon}</div>
                  <Text>{widget.title}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
        <TabPane tab="Maps" key="maps">
          <Row gutter={[16, 16]}>
            {filterWidgets(widgetBundles.maps).map((widget, index) => (
              <Col span={6} key={index}>
                <Card hoverable onClick={() => onSelect(widget)} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>{widget.icon}</div>
                  <Text>{widget.title}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
        <TabPane tab="Gauges" key="gauges">
          <Row gutter={[16, 16]}>
            {filterWidgets(widgetBundles.gauges).map((widget, index) => (
              <Col span={6} key={index}>
                <Card hoverable onClick={() => onSelect(widget)} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>{widget.icon}</div>
                  <Text>{widget.title}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
        <TabPane tab="Controls" key="controls">
          <Row gutter={[16, 16]}>
            {filterWidgets(widgetBundles.controls).map((widget, index) => (
              <Col span={6} key={index}>
                <Card hoverable onClick={() => onSelect(widget)} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>{widget.icon}</div>
                  <Text>{widget.title}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
        <TabPane tab="Indicators" key="indicators">
          <Row gutter={[16, 16]}>
            {filterWidgets(widgetBundles.indicators).map((widget, index) => (
              <Col span={6} key={index}>
                <Card hoverable onClick={() => onSelect(widget)} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>{widget.icon}</div>
                  <Text>{widget.title}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
        <TabPane tab="Industrial" key="industrial">
          <Row gutter={[16, 16]}>
            {filterWidgets(widgetBundles.industrial).map((widget, index) => (
              <Col span={6} key={index}>
                <Card hoverable onClick={() => onSelect(widget)} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>{widget.icon}</div>
                  <Text>{widget.title}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
        <TabPane tab="Cameras" key="cameras">
          <Row gutter={[16, 16]}>
            {filterWidgets(widgetBundles.cameras).map((widget, index) => (
              <Col span={6} key={index}>
                <Card hoverable onClick={() => onSelect(widget)} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>{widget.icon}</div>
                  <Text>{widget.title}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
        <TabPane tab="Security" key="security">
          <Row gutter={[16, 16]}>
            {filterWidgets(widgetBundles.security).map((widget, index) => (
              <Col span={6} key={index}>
                <Card hoverable onClick={() => onSelect(widget)} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>{widget.icon}</div>
                  <Text>{widget.title}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
      </Tabs>
    </Modal>
  )
}

export default WidgetLibrary
