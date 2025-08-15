import React, { useMemo } from "react"
import { Card, Typography, Table, Tag } from "antd"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

dayjs.extend(relativeTime)

const { Title } = Typography

const AlarmTableWidget = ({
  title = "Alarm Table",
  data = [],       // live data array, updates externally
  pageSize = 5,
  theme = "light",
}) => {
  // Memoize data with formatted time strings
  const processedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return []

    return data.map((item, idx) => ({
      key: item.key || idx.toString(),
      ...item,
      formattedTime: item.time
        ? dayjs(item.time).format("YYYY-MM-DD HH:mm:ss")
        : "",
      relativeTime: item.time
        ? dayjs(item.time).fromNow()
        : "",
    }))
  }, [data])

  const columns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      sorter: (a, b) => a.type.localeCompare(b.type),
      responsive: ["sm"],
    },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      sorter: (a, b) => a.severity.localeCompare(b.severity),
      render: (severity) => {
        let color = "green"
        if (severity === "Critical") {
          color = "red"
        } else if (severity === "Major") {
          color = "orange"
        } else if (severity === "Warning") {
          color = "gold"
        }
        return <Tag color={color}>{severity}</Tag>
      },
      responsive: ["xs", "sm", "md"],
    },
    {
      title: "Time",
      dataIndex: "formattedTime",
      key: "time",
      sorter: (a, b) => dayjs(a.time).unix() - dayjs(b.time).unix(),
      render: (_, record) => (
        <div>
          <div>{record.formattedTime}</div>
          <small style={{ color: theme === "dark" ? "#999" : "#666" }}>
            {record.relativeTime}
          </small>
        </div>
      ),
      defaultSortOrder: "descend",
      responsive: ["md"],
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Active", value: "Active" },
        { text: "Cleared", value: "Cleared" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const color = status === "Active" ? "volcano" : "green"
        return <Tag color={color}>{status}</Tag>
      },
      responsive: ["sm"],
    },
    {
      title: "Device",
      dataIndex: "device",
      key: "device",
      sorter: (a, b) => (a.device || "").localeCompare(b.device || ""),
      responsive: ["sm"],
    },
  ]

  return (
    <Card
      title={title}
      bordered
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 12,
        backgroundColor: theme === "dark" ? "#1f1f1f" : undefined,
      }}
      bodyStyle={{ flex: 1, overflow: "hidden", padding: 0 }}
      className={theme === "dark" ? "widget-theme-dark" : ""}
    >
      <Table
        columns={columns}
        dataSource={processedData}
        pagination={{ pageSize, showSizeChanger: false }}
        scroll={{ y: "calc(100% - 60px)" }} // leave space for title
        size="middle"
        rowKey="key"
        bordered={false}
        style={{ flex: 1 }}
        className={theme === "dark" ? "widget-table-dark" : ""}
      />
    </Card>
  )
}

export default AlarmTableWidget
