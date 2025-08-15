"use client"

import { useState } from "react"
import { 
  Typography, 
  Form, 
  Switch, 
  InputNumber, 
  Select, 
  Button, 
  Divider, 
  Card, 
  Row, 
  Col, 
  Radio, 
  Space, 
  Alert,
  Tooltip,
  Tag,
  Input,
  message
} from "antd"
import { 
  SaveOutlined, 
  GlobalOutlined, 
  LockOutlined, 
  TeamOutlined, 
  UserOutlined,
  ClockCircleOutlined,
  LayoutOutlined,
  EyeOutlined,
  ShareAltOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  KeyOutlined,
  DesktopOutlined,
  TabletOutlined,
  MobileOutlined
} from "@ant-design/icons"

const { Title, Text, Paragraph } = Typography
const { Option } = Select

const DashboardSettings = () => {
  const [form] = Form.useForm()
  const [publicAccess, setPublicAccess] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30)
  const [customRefresh, setCustomRefresh] = useState(false)
  const [defaultTimeWindow, setDefaultTimeWindow] = useState("15_minutes")
  const [defaultAggregation, setDefaultAggregation] = useState("none")
  const [defaultLayout, setDefaultLayout] = useState("auto")
  const [shareableLink, setShareableLink] = useState("")

  const handlePublicAccessChange = (checked) => {
    setPublicAccess(checked)
    if (checked) {
      // Generate a mock shareable link
      const mockLink = `https://thingsboard.example.com/public/dashboard/${Math.random().toString(36).substring(2, 15)}`
      setShareableLink(mockLink)
    } else {
      setShareableLink("")
    }
  }

  const handleCustomRefreshChange = (checked) => {
    setCustomRefresh(checked)
    if (!checked) {
      setRefreshInterval(30)
      form.setFieldsValue({ refreshInterval: 30 })
    }
  }

  const handleSaveSettings = () => {
    form.validateFields().then(values => {
      // In a real app, this would save to backend
      console.log("Dashboard settings saved:", values)
      
      // Show success message
      Alert.success({
        message: "Settings saved successfully",
        description: "Your dashboard settings have been updated.",
      })
    })
  }

  return (
    <div className="dashboard-settings">
      <Title level={3}>Dashboard Settings</Title>
      <Paragraph>
        Configure how your dashboards behave and who can access them. These settings will apply to all dashboards unless overridden at the individual dashboard level.
      </Paragraph>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          publicAccess: publicAccess,
          refreshInterval: refreshInterval,
          customRefresh: customRefresh,
          defaultTimeWindow: defaultTimeWindow,
          defaultAggregation: defaultAggregation,
          defaultLayout: defaultLayout,
          allowExport: true,
          allowFullscreen: true,
          showTitle: true,
          showTimeControls: true,
          showFilters: true,
          defaultView: "desktop"
        }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title="Access Control" bordered={false} className="settings-section-card">
              <Form.Item
                name="publicAccess"
                label={
                  <span>
                    Public Access 
                    <Tooltip title="Allow anyone with the link to view your dashboards without logging in">
                      <InfoCircleOutlined style={{ marginLeft: 8 }} />
                    </Tooltip>
                  </span>
                }
                valuePropName="checked"
              >
                <Switch onChange={handlePublicAccessChange} />
              </Form.Item>

              {publicAccess && (
                <div className="public-link-section">
                  <Text type="secondary">Shareable Link:</Text>
                  <div className="shareable-link">
                    <Input.Group compact>
                      <Input
                        style={{ width: 'calc(100% - 32px)' }}
                        value={shareableLink}
                        readOnly
                      />
                      <Tooltip title="Copy link">
                        <Button icon={<CopyOutlined />} onClick={() => {
                          navigator.clipboard.writeText(shareableLink)
                          message.success('Link copied to clipboard')
                        }} />
                      </Tooltip>
                    </Input.Group>
                  </div>
                  
                  <Form.Item name="accessControl" label="Who can access public dashboards">
                    <Radio.Group>
                      <Space direction="vertical">
                        <Radio value="view_only">
                          <LockOutlined /> View Only (No controls or filters)
                        </Radio>
                        <Radio value="interactive">
                          <EyeOutlined /> Interactive (Can use controls and filters)
                        </Radio>
                        <Radio value="password">
                          <KeyOutlined /> Password Protected
                        </Radio>
                      </Space>
                    </Radio.Group>
                  </Form.Item>
                </div>
              )}

              <Divider />

              <Form.Item
                name="defaultPermission"
                label="Default Dashboard Permissions"
              >
                <Select>
                  <Option value="admin_only">
                    <UserOutlined /> Admin Only
                  </Option>
                  <Option value="team">
                    <TeamOutlined /> Team Members
                  </Option>
                  <Option value="customers">
                    <GlobalOutlined /> All Customers
                  </Option>
                </Select>
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="Data & Refresh Settings" bordered={false} className="settings-section-card">
              <Form.Item
                name="customRefresh"
                label="Custom Refresh Interval"
                valuePropName="checked"
              >
                <Switch onChange={handleCustomRefreshChange} />
              </Form.Item>

              <Form.Item
                name="refreshInterval"
                label="Refresh Interval (seconds)"
                rules={[{ required: true, message: 'Please input refresh interval' }]}
                tooltip="How often dashboard data will automatically refresh"
                disabled={!customRefresh}
              >
                <InputNumber min={5} max={3600} disabled={!customRefresh} />
              </Form.Item>

              <Divider />

              <Form.Item
                name="defaultTimeWindow"
                label={
                  <span>
                    Default Time Window
                    <Tooltip title="The default time range for dashboard widgets">
                      <InfoCircleOutlined style={{ marginLeft: 8 }} />
                    </Tooltip>
                  </span>
                }
              >
                <Select onChange={value => setDefaultTimeWindow(value)}>
                  <Option value="15_minutes">Last 15 minutes</Option>
                  <Option value="30_minutes">Last 30 minutes</Option>
                  <Option value="1_hour">Last 1 hour</Option>
                  <Option value="6_hours">Last 6 hours</Option>
                  <Option value="1_day">Last 1 day</Option>
                  <Option value="1_week">Last 1 week</Option>
                  <Option value="1_month">Last 1 month</Option>
                  <Option value="custom">Custom</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="defaultAggregation"
                label="Default Aggregation Method"
              >
                <Select onChange={value => setDefaultAggregation(value)}>
                  <Option value="none">No Aggregation</Option>
                  <Option value="mean">Mean (Average)</Option>
                  <Option value="median">Median</Option>
                  <Option value="min">Minimum</Option>
                  <Option value="max">Maximum</Option>
                  <Option value="sum">Sum</Option>
                  <Option value="count">Count</Option>
                  <Option value="last">Last Value</Option>
                </Select>
              </Form.Item>
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24}>
            <Card title="Display Settings" bordered={false} className="settings-section-card">
              <Row gutter={[24, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="defaultLayout"
                    label="Default Layout Mode"
                  >
                    <Select onChange={value => setDefaultLayout(value)}>
                      <Option value="auto">Auto (Responsive)</Option>
                      <Option value="fixed">Fixed Grid</Option>
                      <Option value="fluid">Fluid</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="defaultView"
                    label="Default View Mode"
                  >
                    <Radio.Group>
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
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="widgetSpacing"
                    label="Widget Spacing (pixels)"
                  >
                    <InputNumber min={0} max={24} />
                  </Form.Item>

                  <div className="toggle-options">
                    <Form.Item name="showTitle" valuePropName="checked" label="Show Dashboard Title">
                      <Switch />
                    </Form.Item>

                    <Form.Item name="showTimeControls" valuePropName="checked" label="Show Time Controls">
                      <Switch />
                    </Form.Item>

                    <Form.Item name="showFilters" valuePropName="checked" label="Show Filter Controls">
                      <Switch />
                    </Form.Item>

                    <Form.Item name="allowExport" valuePropName="checked" label="Allow Data Export">
                      <Switch />
                    </Form.Item>

                    <Form.Item name="allowFullscreen" valuePropName="checked" label="Allow Fullscreen Mode">
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <div className="settings-actions">
          <Button type="primary" onClick={handleSaveSettings}>
            <SaveOutlined /> Save Settings
          </Button>
        </div>
      </Form>
    </div>
  )
}

export default DashboardSettings
