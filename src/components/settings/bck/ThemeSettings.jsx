"use client"

import { useState, useEffect } from "react"
import { 
  Typography, 
  Radio, 
  Switch, 
  Divider, 
  Row, 
  Col, 
  Card, 
  Button, 
  Tooltip, 
  Select, 
  Space, 
  Alert,
  ColorPicker
} from "antd"
import { 
  CheckOutlined, 
  BgColorsOutlined, 
  EyeOutlined, 
  DesktopOutlined, 
  MobileOutlined, 
  TabletOutlined,
  SaveOutlined,
  UndoOutlined
} from "@ant-design/icons"
import { useTheme } from "../theme/ThemeProvider"

const { Title, Text, Paragraph } = Typography
const { Option } = Select

const ThemeSettings = () => {
  const { theme, setTheme, isDarkMode, primaryColor, setPrimaryColor, resetTheme } = useTheme()
  const [themeMode, setThemeMode] = useState(theme)
  const [autoDetect, setAutoDetect] = useState(false)
  const [previewDevice, setPreviewDevice] = useState("desktop")
  const [selectedColor, setSelectedColor] = useState(primaryColor)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    // Check if system preference is being used
    const savedAutoDetect = localStorage.getItem("thingsboard-theme-auto-detect") === "true"
    setAutoDetect(savedAutoDetect)
    
    // Set initial theme mode
    setThemeMode(theme)
    
    // Set initial primary color
    setSelectedColor(primaryColor)
  }, [theme, primaryColor])

  // Update hasChanges state when settings change
  useEffect(() => {
    if (themeMode !== theme || selectedColor !== primaryColor) {
      setHasChanges(true)
    } else {
      setHasChanges(false)
    }
  }, [themeMode, selectedColor, theme, primaryColor])

  const handleThemeChange = (e) => {
    setThemeMode(e.target.value)
  }

  const handleAutoDetectChange = (checked) => {
    setAutoDetect(checked)
    localStorage.setItem("thingsboard-theme-auto-detect", checked.toString())
    
    if (checked) {
      // If auto-detect is enabled, use system preference
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      setThemeMode(prefersDark ? "dark" : "light")
    }
  }

  const handleColorChange = (color) => {
    setSelectedColor(color.toHexString())
  }

  const handleSaveChanges = () => {
    setTheme(themeMode)
    setPrimaryColor(selectedColor)
    setHasChanges(false)
  }

  const handleResetChanges = () => {
    setThemeMode(theme)
    setSelectedColor(primaryColor)
    setHasChanges(false)
  }

  const handleResetToDefaults = () => {
    resetTheme()
    setThemeMode("light")
    setSelectedColor("#304269")
    setAutoDetect(false)
    setHasChanges(false)
  }

  // Predefined color palettes
  const colorPresets = [
    { name: "ThingsBoard Blue", color: "#304269" },
    { name: "Ocean", color: "#1890ff" },
    { name: "Green", color: "#52c41a" },
    { name: "Volcano", color: "#fa541c" },
    { name: "Purple", color: "#722ed1" },
    { name: "Magenta", color: "#eb2f96" },
    { name: "Cyan", color: "#13c2c2" },
    { name: "Gold", color: "#faad14" },
  ]

  return (
    <div className="theme-settings">
      <Title level={3}>Appearance Settings</Title>
      <Paragraph>
        Customize the look and feel of your ThingsBoard application. These settings will be saved to your browser and applied across all pages.
      </Paragraph>

      {hasChanges && (
        <Alert
          message="Unsaved Changes"
          description="You have unsaved appearance changes. Click 'Save Changes' to apply them."
          type="warning"
          showIcon
          action={
            <Space>
              <Button size="small" type="ghost" onClick={handleResetChanges}>
                <UndoOutlined /> Reset
              </Button>
              <Button size="small" type="primary" onClick={handleSaveChanges}>
                <SaveOutlined /> Save
              </Button>
            </Space>
          }
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title="Theme Mode" bordered={false} className="settings-section-card">
            <div className="theme-mode-selector">
              <Radio.Group value={themeMode} onChange={handleThemeChange} buttonStyle="solid">
                <Radio.Button value="light">
                  <span className="theme-option">
                    <div className="theme-preview light-preview"></div>
                    Light
                  </span>
                </Radio.Button>
                <Radio.Button value="dark">
                  <span className="theme-option">
                    <div className="theme-preview dark-preview"></div>
                    Dark
                  </span>
                </Radio.Button>
              </Radio.Group>
            </div>

            <div className="auto-detect-option">
              <Switch checked={autoDetect} onChange={handleAutoDetectChange} />
              <Text style={{ marginLeft: 8 }}>
                Auto-detect from system preferences
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Primary Color" bordered={false} className="settings-section-card">
            <div className="color-picker-container">
              <ColorPicker
                value={selectedColor}
                onChange={handleColorChange}
                showText
              />
              <Text style={{ marginLeft: 16 }}>
                Select a primary color for buttons, links, and accents
              </Text>
            </div>

            <Divider orientation="left">Presets</Divider>
            
            <div className="color-presets">
              {colorPresets.map((preset) => (
                <Tooltip title={preset.name} key={preset.color}>
                  <div
                    className={`color-preset ${selectedColor === preset.color ? 'selected' : ''}`}
                    style={{ backgroundColor: preset.color }}
                    onClick={() => setSelectedColor(preset.color)}
                  >
                    {selectedColor === preset.color && <CheckOutlined />}
                  </div>
                </Tooltip>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Preview" bordered={false} className="settings-section-card">
            <div className="preview-controls">
              <Radio.Group value={previewDevice} onChange={(e) => setPreviewDevice(e.target.value)} buttonStyle="solid">
                <Radio.Button value="desktop">
                  <DesktopOutlined /> Desktop
                </Radio.Button>
                <Radio.Button value="tablet">
                  <TabletOutlined /> Tablet
                </Radio.Button>
                <Radio.Button value="mobile">
                  <MobileOutlined /> Mobile
                </Radio.Button>
              </Radio.Group>
            </div>

            <div className={`theme-preview-container ${previewDevice}`}>
              <div className={`theme-preview-frame ${themeMode}`} style={{ '--primary-color': selectedColor }}>
                <div className="preview-header">
                  <div className="preview-logo"></div>
                  <div className="preview-nav"></div>
                  <div className="preview-actions"></div>
                </div>
                <div className="preview-content">
                  <div className="preview-sidebar"></div>
                  <div className="preview-main">
                    <div className="preview-card"></div>
                    <div className="preview-widgets">
                      <div className="preview-widget"></div>
                      <div className="preview-widget"></div>
                      <div className="preview-widget"></div>
                      <div className="preview-widget"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <div className="settings-actions">
        <Space>
          <Button onClick={handleResetToDefaults}>
            Reset to Defaults
          </Button>
          <Button type="primary" onClick={handleSaveChanges} disabled={!hasChanges}>
            <SaveOutlined /> Save Changes
          </Button>
        </Space>
      </div>
    </div>
  )
}

export default ThemeSettings
