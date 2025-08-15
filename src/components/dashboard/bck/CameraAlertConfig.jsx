"use client"

import { useState } from "react"
import { Modal, Form, Switch, Slider, Checkbox, Select, Button, Divider, Typography, Space } from "antd"
import {
  BellOutlined,
  MailOutlined,
  PhoneOutlined,
  NotificationOutlined,
  WarningOutlined,
  ScheduleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CarOutlined,
  RobotOutlined,
  FireOutlined,
  AlertOutlined,
} from "@ant-design/icons"

const { Option } = Select
const { Title, Text } = Typography

const CameraAlertConfig = ({ visible, onCancel, onSave, initialValues = {} }) => {
  const [form] = Form.useForm()
  const [motionDetectionEnabled, setMotionDetectionEnabled] = useState(initialValues.motionDetection ?? true)
  const [objectDetectionEnabled, setObjectDetectionEnabled] = useState(initialValues.objectDetection ?? true)
  const [restrictedAreaEnabled, setRestrictedAreaEnabled] = useState(initialValues.restrictedArea ?? false)
  const [customAlertsEnabled, setCustomAlertsEnabled] = useState(initialValues.customAlerts ?? false)
  const [scheduleEnabled, setScheduleEnabled] = useState(initialValues.scheduleEnabled ?? false)

  // Reset form when modal opens
  useState(() => {
    if (visible) {
      form.setFieldsValue(initialValues)
    }
  }, [visible, form, initialValues])

  const handleSave = () => {
    form.validateFields().then((values) => {
      onSave(values)
    })
  }

  return (
    <Modal
      title={
        <div className="alert-config-header">
          <BellOutlined /> Camera Alert Configuration
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          Save Configuration
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <div className="alert-config-section">
          <Title level={5}>Motion Detection</Title>
          <Form.Item name="motionDetection" valuePropName="checked" label="Enable Motion Detection">
            <Switch onChange={setMotionDetectionEnabled} />
          </Form.Item>

          {motionDetectionEnabled && (
            <>
              <Form.Item
                name="motionSensitivity"
                label="Motion Sensitivity"
                help="Higher sensitivity may trigger more false alarms"
              >
                <Slider
                  min={0}
                  max={100}
                  marks={{
                    0: "Low",
                    50: "Medium",
                    100: "High",
                  }}
                />
              </Form.Item>

              <Form.Item
                name="motionThreshold"
                label="Minimum Duration (seconds)"
                help="Minimum duration of motion to trigger an alert"
              >
                <Select>
                  <Option value={1}>1 second</Option>
                  <Option value={2}>2 seconds</Option>
                  <Option value={5}>5 seconds</Option>
                  <Option value={10}>10 seconds</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="motionCooldown"
                label="Cooldown Period (seconds)"
                help="Minimum time between consecutive motion alerts"
              >
                <Select>
                  <Option value={30}>30 seconds</Option>
                  <Option value={60}>1 minute</Option>
                  <Option value={300}>5 minutes</Option>
                  <Option value={600}>10 minutes</Option>
                </Select>
              </Form.Item>
            </>
          )}
        </div>

        <Divider />

        <div className="alert-config-section">
          <Title level={5}>Object Detection</Title>
          <Form.Item name="objectDetection" valuePropName="checked" label="Enable Object Detection">
            <Switch onChange={setObjectDetectionEnabled} />
          </Form.Item>

          {objectDetectionEnabled && (
            <>
              <Form.Item name="objectTypes" label="Detect Objects">
                <Checkbox.Group>
                  <Space direction="vertical">
                    <Checkbox value="person">
                      <UserOutlined /> People
                    </Checkbox>
                    <Checkbox value="vehicle">
                      <CarOutlined /> Vehicles
                    </Checkbox>
                    <Checkbox value="animal">
                      <RobotOutlined /> Animals
                    </Checkbox>
                    <Checkbox value="package">
                      <EnvironmentOutlined /> Packages
                    </Checkbox>
                  </Space>
                </Checkbox.Group>
              </Form.Item>

              <Form.Item
                name="objectConfidence"
                label="Minimum Confidence (%)"
                help="Higher confidence reduces false positives"
              >
                <Slider
                  min={50}
                  max={95}
                  step={5}
                  marks={{
                    50: "50%",
                    75: "75%",
                    95: "95%",
                  }}
                />
              </Form.Item>
            </>
          )}
        </div>

        <Divider />

        <div className="alert-config-section">
          <Title level={5}>Restricted Area</Title>
          <Form.Item name="restrictedArea" valuePropName="checked" label="Enable Restricted Area Detection">
            <Switch onChange={setRestrictedAreaEnabled} />
          </Form.Item>

          {restrictedAreaEnabled && (
            <>
              <Form.Item
                name="restrictedAreaConfig"
                label="Restricted Area"
                help="In a real implementation, this would include a visual editor to define areas"
              >
                <Button type="dashed" block>
                  <EnvironmentOutlined /> Configure Restricted Areas
                </Button>
              </Form.Item>

              <Form.Item
                name="restrictedAreaDelay"
                label="Alert Delay (seconds)"
                help="Time before triggering an alert after detection"
              >
                <Select>
                  <Option value={0}>Immediate</Option>
                  <Option value={3}>3 seconds</Option>
                  <Option value={5}>5 seconds</Option>
                  <Option value={10}>10 seconds</Option>
                </Select>
              </Form.Item>
            </>
          )}
        </div>

        <Divider />

        <div className="alert-config-section">
          <Title level={5}>Custom Alerts</Title>
          <Form.Item name="customAlerts" valuePropName="checked" label="Enable Custom Alerts">
            <Switch onChange={setCustomAlertsEnabled} />
          </Form.Item>

          {customAlertsEnabled && (
            <>
              <Form.Item name="customAlertTypes" label="Custom Alert Types">
                <Checkbox.Group>
                  <Space direction="vertical">
                    <Checkbox value="disconnection">
                      <AlertOutlined /> Camera Disconnection
                    </Checkbox>
                    <Checkbox value="tampering">
                      <WarningOutlined /> Camera Tampering
                    </Checkbox>
                    <Checkbox value="fire">
                      <FireOutlined /> Fire Detection
                    </Checkbox>
                  </Space>
                </Checkbox.Group>
              </Form.Item>
            </>
          )}
        </div>

        <Divider />

        <div className="alert-config-section">
          <Title level={5}>Alert Schedule</Title>
          <Form.Item
            name="scheduleEnabled"
            valuePropName="checked"
            label="Enable Schedule"
            help="Only send alerts during specified times"
          >
            <Switch onChange={setScheduleEnabled} />
          </Form.Item>

          {scheduleEnabled && (
            <>
              <Form.Item name="scheduleType" label="Schedule Type">
                <Select>
                  <Option value="always">Always (24/7)</Option>
                  <Option value="business">Business Hours (9AM-5PM, Mon-Fri)</Option>
                  <Option value="night">Night Hours (8PM-6AM)</Option>
                  <Option value="custom">Custom Schedule</Option>
                </Select>
              </Form.Item>

              <Form.Item name="scheduleConfig" label="Custom Schedule">
                <Button type="dashed" block>
                  <ScheduleOutlined /> Configure Schedule
                </Button>
              </Form.Item>
            </>
          )}
        </div>

        <Divider />

        <div className="alert-config-section">
          <Title level={5}>Notification Methods</Title>
          <Form.Item
            name="alertSound"
            valuePropName="checked"
            label={
              <>
                <NotificationOutlined /> Play Sound
              </>
            }
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="alertEmail"
            valuePropName="checked"
            label={
              <>
                <MailOutlined /> Send Email
              </>
            }
          >
            <Switch />
          </Form.Item>

          <Form.Item name="alertEmailRecipients" label="Email Recipients" dependencies={["alertEmail"]}>
            <Select
              mode="tags"
              placeholder="Enter email addresses"
              disabled={!form.getFieldValue("alertEmail")}
              tokenSeparators={[","]}
            />
          </Form.Item>

          <Form.Item
            name="alertSms"
            valuePropName="checked"
            label={
              <>
                <PhoneOutlined /> Send SMS
              </>
            }
          >
            <Switch />
          </Form.Item>

          <Form.Item name="alertSmsRecipients" label="SMS Recipients" dependencies={["alertSms"]}>
            <Select
              mode="tags"
              placeholder="Enter phone numbers"
              disabled={!form.getFieldValue("alertSms")}
              tokenSeparators={[","]}
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}

export default CameraAlertConfig
