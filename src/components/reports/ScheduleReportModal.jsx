"use client"

import { useState } from "react"
import {
  Modal,
  Form,
  Select,
  DatePicker,
  TimePicker,
  Switch,
  InputNumber,
  Radio,
  Card,
  Typography,
  Space,
  Divider,
  Alert,
  Row,
  Col,
  Checkbox,
} from "antd"
import { CalendarOutlined, ClockCircleOutlined, MailOutlined, InfoCircleOutlined } from "@ant-design/icons"
import moment from "moment"

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

const ScheduleReportModal = ({ visible, report, onCancel, onSuccess }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [scheduleType, setScheduleType] = useState("recurring")

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      // Simulate API call
      setTimeout(() => {
        onSuccess(values)
        form.resetFields()
        setLoading(false)
      }, 1000)
    } catch (error) {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setScheduleType("recurring")
    onCancel()
  }

  const getNextRunTime = (frequency, time) => {
    const now = moment()
    const scheduledTime = moment(time)

    switch (frequency) {
      case "daily":
        return now.clone().add(1, "day").hour(scheduledTime.hour()).minute(scheduledTime.minute())
      case "weekly":
        return now.clone().add(1, "week").hour(scheduledTime.hour()).minute(scheduledTime.minute())
      case "monthly":
        return now.clone().add(1, "month").hour(scheduledTime.hour()).minute(scheduledTime.minute())
      default:
        return scheduledTime
    }
  }

  return (
    <Modal
      title={`Schedule Report: ${report?.name}`}
      open={visible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
      okText="Save Schedule"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          enabled: true,
          frequency: "daily",
          time: moment("09:00", "HH:mm"),
          timezone: "UTC",
          retryAttempts: 3,
          emailNotifications: true,
          scheduleType: "recurring",
        }}
      >
        <Alert
          message="Schedule Configuration"
          description="Configure when and how often this report should be generated automatically."
          type="info"
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 16 }}
        />

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="enabled" label="Enable Schedule" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="scheduleType" label="Schedule Type">
              <Radio.Group onChange={(e) => setScheduleType(e.target.value)}>
                <Radio value="recurring">Recurring</Radio>
                <Radio value="oneTime">One Time</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>

        {scheduleType === "recurring" ? (
          <>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="frequency"
                  label="Frequency"
                  rules={[{ required: true, message: "Please select frequency" }]}
                >
                  <Select placeholder="Select frequency">
                    <Option value="hourly">Hourly</Option>
                    <Option value="daily">Daily</Option>
                    <Option value="weekly">Weekly</Option>
                    <Option value="monthly">Monthly</Option>
                    <Option value="quarterly">Quarterly</Option>
                    <Option value="yearly">Yearly</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="time"
                  label="Execution Time"
                  rules={[{ required: true, message: "Please select time" }]}
                >
                  <TimePicker style={{ width: "100%" }} format="HH:mm" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="daysOfWeek" label="Days of Week (for weekly frequency)" dependencies={["frequency"]}>
              <Checkbox.Group>
                <Row>
                  <Col span={8}>
                    <Checkbox value="monday">Monday</Checkbox>
                  </Col>
                  <Col span={8}>
                    <Checkbox value="tuesday">Tuesday</Checkbox>
                  </Col>
                  <Col span={8}>
                    <Checkbox value="wednesday">Wednesday</Checkbox>
                  </Col>
                  <Col span={8}>
                    <Checkbox value="thursday">Thursday</Checkbox>
                  </Col>
                  <Col span={8}>
                    <Checkbox value="friday">Friday</Checkbox>
                  </Col>
                  <Col span={8}>
                    <Checkbox value="saturday">Saturday</Checkbox>
                  </Col>
                  <Col span={24}>
                    <Checkbox value="sunday">Sunday</Checkbox>
                  </Col>
                </Row>
              </Checkbox.Group>
            </Form.Item>

            <Form.Item name="dayOfMonth" label="Day of Month (for monthly frequency)" dependencies={["frequency"]}>
              <InputNumber min={1} max={31} placeholder="Day of month (1-31)" style={{ width: "100%" }} />
            </Form.Item>
          </>
        ) : (
          <Form.Item
            name="oneTimeDate"
            label="Execution Date & Time"
            rules={[{ required: true, message: "Please select date and time" }]}
          >
            <DatePicker
              showTime
              style={{ width: "100%" }}
              disabledDate={(current) => current && current < moment().startOf("day")}
            />
          </Form.Item>
        )}

        <Divider>Advanced Settings</Divider>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="timezone" label="Timezone">
              <Select placeholder="Select timezone">
                <Option value="UTC">UTC</Option>
                <Option value="America/New_York">Eastern Time</Option>
                <Option value="America/Chicago">Central Time</Option>
                <Option value="America/Denver">Mountain Time</Option>
                <Option value="America/Los_Angeles">Pacific Time</Option>
                <Option value="Europe/London">London</Option>
                <Option value="Europe/Paris">Paris</Option>
                <Option value="Asia/Tokyo">Tokyo</Option>
                <Option value="Asia/Shanghai">Shanghai</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="retryAttempts" label="Retry Attempts">
              <InputNumber min={0} max={5} placeholder="Number of retry attempts" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="emailNotifications" label="Email Notifications" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="onFailureOnly" label="Notify on Failure Only" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="validityPeriod" label="Schedule Validity Period">
          <RangePicker style={{ width: "100%" }} placeholder={["Start Date", "End Date"]} />
        </Form.Item>

        <Card size="small" style={{ backgroundColor: "#f6f6f6" }}>
          <Space direction="vertical" size="small">
            <Text strong>Schedule Summary</Text>
            <Space>
              <CalendarOutlined />
              <Text>Frequency: Daily</Text>
            </Space>
            <Space>
              <ClockCircleOutlined />
              <Text>Time: 09:00 UTC</Text>
            </Space>
            <Space>
              <MailOutlined />
              <Text>Email notifications enabled</Text>
            </Space>
          </Space>
        </Card>
      </Form>
    </Modal>
  )
}

export default ScheduleReportModal