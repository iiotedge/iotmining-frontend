"use client"

import { useState } from "react"
import { 
  Typography, 
  Form, 
  Input, 
  Button, 
  Switch, 
  Card, 
  Row, 
  Col, 
  Select, 
  InputNumber, 
  Divider, 
  Alert, 
  Space,
  List,
  Badge,
  Tooltip
} from "antd"
import { 
  LockOutlined, 
  SaveOutlined, 
  EyeInvisibleOutlined, 
  EyeTwoTone, 
  KeyOutlined,
  SafetyCertificateOutlined,
  UserSwitchOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined
} from "@ant-design/icons"

const { Title, Text, Paragraph } = Typography
const { Option } = Select

const SecuritySettings = () => {
  const [form] = Form.useForm()
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState(30)
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventReuse: 5
  })

  // Mock active sessions
  const [activeSessions, setActiveSessions] = useState([
    {
      id: 1,
      device: "Chrome on Windows",
      location: "New York, USA",
      ip: "192.168.1.1",
      lastActive: "2025-05-08T10:30:00Z",
      current: true
    },
    {
      id: 2,
      device: "Safari on MacOS",
      location: "San Francisco, USA",
      ip: "192.168.1.2",
      lastActive: "2025-05-07T14:20:00Z",
      current: false
    },
    {
      id: 3,
      device: "Mobile App on Android",
      location: "Chicago, USA",
      ip: "192.168.1.3",
      lastActive: "2025-05-06T09:15:00Z",
      current: false
    }
  ])

  const handleTwoFactorChange = (checked) => {
    setTwoFactorEnabled(checked)
  }

  const handleSessionTimeout = (value) => {
    setSessionTimeout(value)
  }

  const handleTerminateSession = (sessionId) => {
    setActiveSessions(activeSessions.filter(session => session.id !== sessionId))
  }

  const handleTerminateAllSessions = () => {
    setActiveSessions(activeSessions.filter(session => session.current))
  }

  const handleSaveSettings = () => {
    form.validateFields().then(values => {
      // In a real app, this would save to backend
      console.log("Security settings saved:", values)
      
      // Show success message
      Alert.success({
        message: "Settings saved successfully",
        description: "Your security settings have been updated.",
      })
    })
  }

  return (
    <div className="security-settings">
      <Title level={3}>Security Settings</Title>
      <Paragraph>
        Configure security settings to protect your account and data. We recommend enabling two-factor authentication for additional security.
      </Paragraph>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          twoFactorAuth: twoFactorEnabled,
          sessionTimeout: sessionTimeout,
          minPasswordLength: passwordPolicy.minLength,
          requireUppercase: passwordPolicy.requireUppercase,
          requireLowercase: passwordPolicy.requireLowercase,
          requireNumbers: passwordPolicy.requireNumbers,
          requireSpecialChars: passwordPolicy.requireSpecialChars,
          preventPasswordReuse: passwordPolicy.preventReuse
        }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title="Authentication Settings" bordered={false} className="settings-section-card">
              <Form.Item
                name="twoFactorAuth"
                label={
                  <span>
                    Two-Factor Authentication
                    <Tooltip title="Adds an extra layer of security by requiring a code from your mobile device">
                      <InfoCircleOutlined style={{ marginLeft: 8 }} />
                    </Tooltip>
                  </span>
                }
                valuePropName="checked"
              >
                <Switch onChange={handleTwoFactorChange} />
              </Form.Item>

              {twoFactorEnabled && (
                <Alert
                  message="Two-Factor Authentication Enabled"
                  description="You will be required to enter a verification code when logging in from a new device or browser."
                  type="success"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <Form.Item
                name="sessionTimeout"
                label="Session Timeout (minutes)"
                tooltip="Your session will expire after this period of inactivity"
              >
                <InputNumber min={5} max={1440} onChange={handleSessionTimeout} />
              </Form.Item>

              <Divider />

              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[{ required: false, message: 'Please input your current password!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  placeholder="Enter current password to change settings"
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[{ required: false, message: 'Please input your new password!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  placeholder="Enter new password"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
                rules={[
                  { required: false, message: 'Please confirm your password!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  placeholder="Confirm new password"
                />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="Password Policy" bordered={false} className="settings-section-card">
              <Form.Item
                name="minPasswordLength"
                label="Minimum Password Length"
              >
                <InputNumber min={6} max={32} />
              </Form.Item>

              <div className="password-requirements">
                <Form.Item name="requireUppercase" valuePropName="checked" label="Require Uppercase Letters">
                  <Switch />
                </Form.Item>

                <Form.Item name="requireLowercase" valuePropName="checked" label="Require Lowercase Letters">
                  <Switch />
                </Form.Item>

                <Form.Item name="requireNumbers" valuePropName="checked" label="Require Numbers">
                  <Switch />
                </Form.Item>

                <Form.Item name="requireSpecialChars" valuePropName="checked" label="Require Special Characters">
                  <Switch />
                </Form.Item>

                <Form.Item name="preventPasswordReuse" label="Prevent Password Reuse (previous passwords)">
                  <InputNumber min={0} max={10} />
                </Form.Item>
              </div>

              <Alert
                message="Password Strength"
                description="Strong passwords help protect your account from unauthorized access."
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            </Card>

            <Card title="Active Sessions" bordered={false} className="settings-section-card" style={{ marginTop: 24 }}>
              <List
                itemLayout="horizontal"
                dataSource={activeSessions}
                renderItem={session => (
                  <List.Item
                    key={session.id}
                    actions={[
                      session.current ? (
                        <Badge status="processing" text="Current" />
                      ) : (
                        <Button 
                          danger 
                          size="small" 
                          onClick={() => handleTerminateSession(session.id)}
                        >
                          Terminate
                        </Button>
                      )
                    ]}
                  >
                    <List.Item.Meta
                      title={session.device}
                      description={
                        <>
                          <div>{session.location} • {session.ip}</div>
                          <div>
                            <ClockCircleOutlined /> Last active: {new Date(session.lastActive).toLocaleString()}
                          </div>
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
              
              {activeSessions.length > 1 && (
                <Button 
                  danger 
                  style={{ marginTop: 16 }}
                  onClick={handleTerminateAllSessions}
                >
                  Terminate All Other Sessions
                </Button>
              )}
            </Card>
          </Col>
        </Row>

        <div className="settings-actions">
          <Button type="primary" onClick={handleSaveSettings}>
            <SaveOutlined /> Save Security Settings
          </Button>
        </div>
      </Form>
    </div>
  )
}

export default SecuritySettings
