import React, { useState, useMemo } from "react"
import {
  Card,
  Typography,
  Statistic,
  Alert,
  Space,
  Button,
  Select,
  Tag,
  Divider,
  Popover,
  Tooltip,
  DatePicker,
  Checkbox,
  message,
  theme as antdTheme,
} from "antd"
import {
  AlertOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts"

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const SEVERITY_COLORS = {
  Critical: "#cf1322",
  Major: "#fa8c16",
  Warning: "#faad14",
  Info: "#1890ff",
  Cleared: "#52c41a",
}

const DELIVERY_STATUS_ICONS = {
  success: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
  failure: <CloseCircleOutlined style={{ color: "#cf1322" }} />,
}

const BAR_COLORS_LIGHT = ["#ff4d4f", "#fa8c16", "#faad14", "#1890ff", "#52c41a"]
const BAR_COLORS_DARK = ["#ff7875", "#ffa940", "#ffd666", "#69c0ff", "#95de64"]

const AlarmCountWidget = ({
  title = "Alarm Count",
  data = [],
  notificationConfig = { emails: [], slackUrls: [] },
  onNotificationChange = () => {},
  onAcknowledge = () => {},
  onClear = () => {},
  theme = "light",
}) => {
  const {
    token: { colorText, colorTextSecondary },
  } = antdTheme.useToken()

  // Time filter: default last 24h
  const [timeFilter, setTimeFilter] = useState([
    dayjs().subtract(24, "hour").toDate(),
    new Date(),
  ])

  // Alarm severity filter
  const [selectedSeverities, setSelectedSeverities] = useState([
    "Critical",
    "Major",
    "Warning",
    "Info",
  ])

  // Filter alarms by time & severity & active status (Active only)
  const filteredAlarms = useMemo(() => {
    return data.filter((alarm) => {
      const ts = new Date(alarm.time).getTime()
      return (
        selectedSeverities.includes(alarm.severity) &&
        ts >= timeFilter[0].getTime() &&
        ts <= timeFilter[1].getTime() &&
        alarm.status === "Active"
      )
    })
  }, [data, selectedSeverities, timeFilter])

  const alarmCount = filteredAlarms.length

  // Count by severity for active alarms
  const severityCounts = useMemo(() => {
    const counts = { Critical: 0, Major: 0, Warning: 0, Info: 0 }
    filteredAlarms.forEach((alarm) => {
      if (counts[alarm.severity] !== undefined) {
        counts[alarm.severity]++
      }
    })
    return counts
  }, [filteredAlarms])

  // Calculate alarm trends over time (hourly counts for last 24 hours)
  const alarmTrends = useMemo(() => {
    const hours = []
    const now = dayjs()
    for (let i = 23; i >= 0; i--) {
      const hourStart = now.subtract(i, "hour").startOf("hour")
      hours.push({
        hour: hourStart.format("HH:mm"),
        count: 0,
      })
    }
    filteredAlarms.forEach((alarm) => {
      const alarmHour = dayjs(alarm.time).startOf("hour").format("HH:mm")
      const hourObj = hours.find((h) => h.hour === alarmHour)
      if (hourObj) hourObj.count++
    })
    return hours
  }, [filteredAlarms])

  // Notification settings UI (unchanged)
  const notifContent = (
    <div style={{ maxWidth: 350 }}>
      <Text strong>Notification Channels</Text>
      <Divider />
      <Text>Email Recipients:</Text>
      {notificationConfig.emails.length === 0 && (
        <div style={{ fontSize: 12, color: "#999" }}>No emails configured</div>
      )}
      {notificationConfig.emails.map((email, idx) => (
        <Tag
          key={idx}
          closable
          onClose={() =>
            onNotificationChange({
              emails: notificationConfig.emails.filter((e) => e !== email),
              slackUrls: notificationConfig.slackUrls,
            })
          }
        >
          {email}
        </Tag>
      ))}
      <Divider />
      <Text>Slack URLs:</Text>
      {notificationConfig.slackUrls.length === 0 && (
        <div style={{ fontSize: 12, color: "#999" }}>No Slack URLs configured</div>
      )}
      {notificationConfig.slackUrls.map((url, idx) => (
        <Tag
          key={idx}
          closable
          onClose={() =>
            onNotificationChange({
              emails: notificationConfig.emails,
              slackUrls: notificationConfig.slackUrls.filter((u) => u !== url),
            })
          }
        >
          {url}
        </Tag>
      ))}
      <Divider />
      <Button
        type="dashed"
        block
        style={{ marginTop: 8 }}
        onClick={() => message.info("Notification config UI not implemented yet.")}
      >
        Add Notification Channel
      </Button>
    </div>
  )

  // Helper to display platform notification status per alarm (simulation)
  const renderNotifStatus = (alarm) => {
    if (!alarm.notifiedPlatforms) return null
    return (
      <Space size="small">
        {Object.entries(alarm.notifiedPlatforms).map(([platform, status]) => (
          <Tooltip key={platform} title={`${platform} notification: ${status}`}>
            {DELIVERY_STATUS_ICONS[status] || null}
          </Tooltip>
        ))}
      </Space>
    )
  }

  const barColors = theme === "dark" ? BAR_COLORS_DARK : BAR_COLORS_LIGHT

  return (
    <Card
      bordered
      style={{
        height: "100%",
        userSelect: "none",
        backgroundColor: theme === "dark" ? "#1f1f1f" : undefined,
      }}
      bodyStyle={{ padding: 16 }}
      className={theme === "dark" ? "widget-theme-dark" : ""}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title level={4} style={{ margin: 0, color: colorText }}>
            {title}
          </Title>
          <Popover
            content={notifContent}
            title="Notification Settings"
            trigger="click"
            placement="bottomRight"
          >
            <Tooltip title="Configure Notifications">
              <Button type="text" icon={<SettingOutlined />} size="small" />
            </Tooltip>
          </Popover>
        </div>

        <Statistic
          value={alarmCount}
          valueStyle={{ color: alarmCount > 0 ? "#cf1322" : "#3f8600" }}
          prefix={<AlertOutlined />}
        />

        {/* Severity breakdown */}
        <Space wrap>
          {Object.entries(severityCounts).map(([severity, count], i) => (
            <Tag
              key={severity}
              color={SEVERITY_COLORS[severity]}
              closable={false}
              style={{ userSelect: "none" }}
            >
              {severity}: {count}
            </Tag>
          ))}
        </Space>

        {/* Time range filter */}
        <Space size="small" wrap style={{ marginTop: 10, marginBottom: 8 }} align="center">
          <Text strong>Time Range:</Text>
          <RangePicker
            allowClear={false}
            value={[dayjs(timeFilter[0]), dayjs(timeFilter[1])]}
            onChange={(dates) => {
              if (dates && dates.length === 2) {
                setTimeFilter([dates[0].toDate(), dates[1].toDate()])
              }
            }}
            showTime={{ format: "HH:mm" }}
            format="YYYY-MM-DD HH:mm"
            size="small"
          />
        </Space>

        {/* Severity filter */}
        <Space size="small" wrap align="center" style={{ marginBottom: 10 }}>
          <Text strong>Filter Severities:</Text>
          <Checkbox.Group
            options={Object.keys(SEVERITY_COLORS).map((sev) => ({
              label: <Tag color={SEVERITY_COLORS[sev]}>{sev}</Tag>,
              value: sev,
            }))}
            value={selectedSeverities}
            onChange={setSelectedSeverities}
          />
        </Space>

        {/* Action buttons */}
        <Space size="small" wrap>
          <Button
            type="primary"
            disabled={alarmCount === 0}
            onClick={() => {
              onAcknowledge(filteredAlarms)
              message.success("Alarms acknowledged.")
            }}
          >
            Acknowledge All
          </Button>
          <Button
            danger
            disabled={alarmCount === 0}
            onClick={() => {
              onClear(filteredAlarms)
              message.success("Alarms cleared.")
            }}
          >
            Clear All
          </Button>
          <Button
            onClick={() => {
              setSelectedSeverities(Object.keys(SEVERITY_COLORS))
              setTimeFilter([dayjs().subtract(24, "hour").toDate(), new Date()])
            }}
          >
            Reset Filters
          </Button>
        </Space>

        {/* Alarm trends chart */}
        <div style={{ width: "100%", height: 120, marginTop: 12 }}>
          <ResponsiveContainer>
            <BarChart data={alarmTrends} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 12, fill: colorText }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <RechartsTooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(value) => [`${value} alarms`, "Alarms"]}
              />
              <Bar dataKey="count" fill={barColors[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Space>
    </Card>
  )
}

export default AlarmCountWidget
