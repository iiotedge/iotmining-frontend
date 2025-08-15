"use client"

import { useState, useEffect } from "react"
import { Modal, Radio, Select, Button, Form, Space } from "antd"

const TimeWindowSettings = ({ visible, onClose, onSave, initialValue }) => {
  const [form] = Form.useForm()
  const [timeMode, setTimeMode] = useState("realtime")
  const [timeWindowType, setTimeWindowType] = useState("last")

  useEffect(() => {
    if (visible && initialValue) {
      setTimeMode(initialValue.type === "REALTIME" ? "realtime" : "history")
      form.setFieldsValue({
        timeWindow: initialValue.value,
        aggregation: initialValue.aggregation || "avg",
        groupingInterval: initialValue.groupingInterval || "1_second",
      })
    }
  }, [visible, initialValue, form])

  const handleSave = () => {
    form.validateFields().then((values) => {
      const result = {
        displayValue: getDisplayValue(values.timeWindow),
        value: values.timeWindow,
        type: timeMode.toUpperCase(),
        aggregation: values.aggregation,
        groupingInterval: values.groupingInterval,
      }
      onSave(result)
    })
  }

  const getDisplayValue = (value) => {
    const displayMap = {
      "1_minute": "Last 1 minute",
      "5_minutes": "Last 5 minutes",
      "15_minutes": "Last 15 minutes",
      "30_minutes": "Last 30 minutes",
      "1_hour": "Last 1 hour",
      "6_hours": "Last 6 hours",
      "12_hours": "Last 12 hours",
      "1_day": "Last 1 day",
      "7_days": "Last 7 days",
      "30_days": "Last 30 days",
      custom: "Custom",
    }
    return displayMap[value] || "Custom"
  }

  return (
    <Modal
      title="Time window"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="update" type="primary" onClick={handleSave}>
          Update
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ timeWindow: "15_minutes", aggregation: "avg", groupingInterval: "1_second" }}
      >
        <div style={{ marginBottom: "24px" }}>
          <Radio.Group value={timeMode} onChange={(e) => setTimeMode(e.target.value)} style={{ width: "100%" }}>
            <Radio.Button value="realtime" style={{ width: "50%", textAlign: "center" }}>
              Realtime
            </Radio.Button>
            <Radio.Button value="history" style={{ width: "50%", textAlign: "center" }}>
              History
            </Radio.Button>
          </Radio.Group>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: "8px" }}>Time window</div>
          <Radio.Group
            value={timeWindowType}
            onChange={(e) => setTimeWindowType(e.target.value)}
            style={{ marginBottom: "8px", width: "100%" }}
          >
            <Radio.Button value="last" style={{ width: "50%", textAlign: "center" }}>
              Last
            </Radio.Button>
            <Radio.Button value="relative" style={{ width: "50%", textAlign: "center" }}>
              Relative
            </Radio.Button>
          </Radio.Group>

          <Form.Item name="timeWindow" noStyle>
            <Select style={{ width: "100%" }}>
              <Select.Option value="1_minute">1 minute</Select.Option>
              <Select.Option value="5_minutes">5 minutes</Select.Option>
              <Select.Option value="15_minutes">15 minutes</Select.Option>
              <Select.Option value="30_minutes">30 minutes</Select.Option>
              <Select.Option value="1_hour">1 hour</Select.Option>
              <Select.Option value="6_hours">6 hours</Select.Option>
              <Select.Option value="12_hours">12 hours</Select.Option>
              <Select.Option value="1_day">1 day</Select.Option>
              <Select.Option value="7_days">7 days</Select.Option>
              <Select.Option value="30_days">30 days</Select.Option>
              <Select.Option value="custom">Custom</Select.Option>
            </Select>
          </Form.Item>
        </div>

        {timeMode === "history" && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ marginBottom: "8px" }}>Custom time range</div>
            <Space style={{ width: "100%" }}>
              <Form.Item name="startDate" noStyle>
                <input type="datetime-local" style={{ width: "100%" }} />
              </Form.Item>
              <span style={{ padding: "0 8px" }}>to</span>
              <Form.Item name="endDate" noStyle>
                <input type="datetime-local" style={{ width: "100%" }} />
              </Form.Item>
            </Space>
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: "8px" }}>Aggregation</div>
          <Form.Item name="aggregation" noStyle>
            <Select style={{ width: "100%" }}>
              <Select.Option value="avg">Average</Select.Option>
              <Select.Option value="min">Min</Select.Option>
              <Select.Option value="max">Max</Select.Option>
              <Select.Option value="sum">Sum</Select.Option>
              <Select.Option value="count">Count</Select.Option>
              <Select.Option value="none">None</Select.Option>
            </Select>
          </Form.Item>
        </div>

        <div>
          <div style={{ marginBottom: "8px" }}>Grouping interval</div>
          <Form.Item name="groupingInterval" noStyle>
            <Select style={{ width: "100%" }}>
              <Select.Option value="1_second">1 second</Select.Option>
              <Select.Option value="5_seconds">5 seconds</Select.Option>
              <Select.Option value="10_seconds">10 seconds</Select.Option>
              <Select.Option value="15_seconds">15 seconds</Select.Option>
              <Select.Option value="30_seconds">30 seconds</Select.Option>
              <Select.Option value="1_minute">1 minute</Select.Option>
              <Select.Option value="5_minutes">5 minutes</Select.Option>
              <Select.Option value="15_minutes">15 minutes</Select.Option>
              <Select.Option value="30_minutes">30 minutes</Select.Option>
              <Select.Option value="1_hour">1 hour</Select.Option>
              <Select.Option value="6_hours">6 hours</Select.Option>
              <Select.Option value="1_day">1 day</Select.Option>
            </Select>
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}

export default TimeWindowSettings
