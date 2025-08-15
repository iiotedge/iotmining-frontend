"use client"

import { useState } from "react"
import { 
  Typography, 
  Form, 
  Input, 
  Button, 
  Upload, 
  Card, 
  Row, 
  Col, 
  Select, 
  Switch, 
  Divider, 
  Avatar, 
  Space,
  TimePicker,
  message
} from "antd"
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  GlobalOutlined, 
  UploadOutlined,
  SaveOutlined,
  BellOutlined,
  ClockCircleOutlined,
  TranslationOutlined
} from "@ant-design/icons"
import moment from 'moment'


const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input

const UserSettings = () => {
  const [form] = Form.useForm()
  const [avatarUrl, setAvatarUrl] = useState(null)
  
  // Mock user data
  const [userData, setUserData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    jobTitle: "System Administrator",
    company: "Acme Inc.",
    language: "en-US",
    timezone: "America/New_York",
    notifications: {
      email: true,
      push: true,
      sms: false
    }
  })

  const handleAvatarChange = (info) => {
    if (info.file.status === 'done') {
      // Get this url from response in real world
      setAvatarUrl(URL.createObjectURL(info.file.originFileObj))
      message.success(`${info.file.name} uploaded successfully`)
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} upload failed.`)
    }
  }

  const handleSaveSettings = () => {
    form.validateFields().then(values => {
      // In a real app, this would save to backend
      console.log("User settings saved:", values)
      
      // Update local state
      setUserData({
        ...userData,
        ...values
      })
      
      // Show success message
      message.success("Profile updated successfully")
    })
  }

  return (
    <div className="user-settings">
      <Title level={3}>User Profile</Title>
      <Paragraph>
        Manage your personal information and preferences. This information may be visible to other users depending on your privacy settings.
      </Paragraph>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          jobTitle: userData.jobTitle,
          company: userData.company,
          language: userData.language,
          timezone: userData.timezone,
          emailNotifications: userData.notifications.email,
          pushNotifications: userData.notifications.push,
          smsNotifications: userData.notifications.sms,
          workingHoursStart: moment('09:00', 'HH:mm'),
          workingHoursEnd: moment('17:00', 'HH:mm')
        }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card bordered={false} className="settings-section-card">
              <div className="user-avatar-section">
                <Avatar 
                  size={100} 
                  icon={<UserOutlined />} 
                  src={avatarUrl}
                  className="user-avatar"
                />
                
                <Upload 
                  name="avatar"
                  listType="picture"
                  className="avatar-uploader"
                  showUploadList={false}
                  action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
                  onChange={handleAvatarChange}
                >
                  <Button icon={<UploadOutlined />}>Change Avatar</Button>
                </Upload>
              </div>

              <Divider />

              <div className="user-info-summary">
                <Title level={4}>{userData.firstName} {userData.lastName}</Title>
                <Text type="secondary">{userData.jobTitle}</Text>
                <Text type="secondary" style={{ display: 'block' }}>{userData.company}</Text>
                
                <Space direction="vertical" style={{ marginTop: 16 }}>
                  <Text><MailOutlined /> {userData.email}</Text>
                  {userData.phone && <Text><PhoneOutlined /> {userData.phone}</Text>}
                </Space>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={16}>
            <Card title="Personal Information" bordered={false} className="settings-section-card">
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[{ required: true, message: 'Please input your first name!' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="First Name" />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="lastName"
                    label="Last Name"
                    rules={[{ required: true, message: 'Please input your last name!' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Last Name" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Please input your email!' },
                      { type: 'email', message: 'Please enter a valid email!' }
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="Email" />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="phone"
                    label="Phone Number"
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="Phone Number" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="jobTitle"
                    label="Job Title"
                  >
                    <Input placeholder="Job Title" />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="company"
                    label="Company"
                  >
                    <Input placeholder="Company" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="bio"
                label="Bio"
              >
                <TextArea rows={4} placeholder="Tell us about yourself" />
              </Form.Item>
            </Card>

            <Card title="Preferences" bordered={false} className="settings-section-card" style={{ marginTop: 24 }}>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="language"
                    label={<><TranslationOutlined /> Language</>}
                  >
                    <Select>
                      <Option value="en-US">English (US)</Option>
                      <Option value="en-GB">English (UK)</Option>
                      <Option value="es">Spanish</Option>
                      <Option value="fr">French</Option>
                      <Option value="de">German</Option>
                      <Option value="zh-CN">Chinese (Simplified)</Option>
                      <Option value="ja">Japanese</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="timezone"
                    label={<><GlobalOutlined /> Timezone</>}
                  >
                    <Select showSearch>
                      <Option value="America/New_York">Eastern Time (US & Canada)</Option>
                      <Option value="America/Chicago">Central Time (US & Canada)</Option>
                      <Option value="America/Denver">Mountain Time (US & Canada)</Option>
                      <Option value="America/Los_Angeles">Pacific Time (US & Canada)</Option>
                      <Option value="Europe/London">London</Option>
                      <Option value="Europe/Paris">Paris</Option>
                      <Option value="Asia/Tokyo">Tokyo</Option>
                      <Option value="Australia/Sydney">Sydney</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="workingHoursStart"
                    label={<><ClockCircleOutlined /> Working Hours Start</>}
                  >
                    <TimePicker format="HH:mm" />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="workingHoursEnd"
                    label={<><ClockCircleOutlined /> Working Hours End</>}
                  >
                    <TimePicker format="HH:mm" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left"><BellOutlined /> Notification Preferences</Divider>

              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="emailNotifications"
                    label="Email Notifications"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="pushNotifications"
                    label="Push Notifications"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="smsNotifications"
                    label="SMS Notifications"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <div className="settings-actions">
          <Button type="primary" onClick={handleSaveSettings}>
            <SaveOutlined /> Save Profile
          </Button>
        </div>
      </Form>
    </div>
  )
}

export default UserSettings
