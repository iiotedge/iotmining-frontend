"use client"

import { Modal, Radio, Select, Button } from "antd"
import { useState } from "react"

const TimeWindowSettings = ({ visible, onClose }) => {
  const [timeMode, setTimeMode] = useState("realtime")
  const [timeWindow, setTimeWindow] = useState("1_minute")
  const [aggregation, setAggregation] = useState("avg")
  const [groupingInterval, setGroupingInterval] = useState("1_second")

  return (
    <Modal
      title="Time window"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="update" type="primary" onClick={onClose}>
          Update
        </Button>,
      ]}
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
        <Radio.Group value="last" style={{ marginBottom: "8px", width: "100%" }}>
          <Radio.Button value="last" style={{ width: "50%", textAlign: "center" }}>
            Last
          </Radio.Button>
          <Radio.Button value="relative" style={{ width: "50%", textAlign: "center" }}>
            Relative
          </Radio.Button>
        </Radio.Group>
        <Select
          value={timeWindow}
          onChange={setTimeWindow}
          style={{ width: "100%" }}
          options={[
            { label: "1 minute", value: "1_minute" },
            { label: "5 minutes", value: "5_minutes" },
            { label: "15 minutes", value: "15_minutes" },
            { label: "1 hour", value: "1_hour" },
            { label: "6 hours", value: "6_hours" },
            { label: "1 day", value: "1_day" },
          ]}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <div style={{ marginBottom: "8px" }}>Aggregation</div>
        <Select
          value={aggregation}
          onChange={setAggregation}
          style={{ width: "100%" }}
          options={[
            { label: "Average", value: "avg" },
            { label: "Min", value: "min" },
            { label: "Max", value: "max" },
            { label: "Sum", value: "sum" },
            { label: "Count", value: "count" },
          ]}
        />
      </div>

      <div>
        <div style={{ marginBottom: "8px" }}>Grouping interval</div>
        <Select
          value={groupingInterval}
          onChange={setGroupingInterval}
          style={{ width: "100%" }}
          options={[
            { label: "1 second", value: "1_second" },
            { label: "5 seconds", value: "5_seconds" },
            { label: "10 seconds", value: "10_seconds" },
            { label: "15 seconds", value: "15_seconds" },
            { label: "30 seconds", value: "30_seconds" },
            { label: "1 minute", value: "1_minute" },
          ]}
        />
      </div>
    </Modal>
  )
}

export default TimeWindowSettings

