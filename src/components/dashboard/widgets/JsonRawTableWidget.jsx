"use client"

import React, { useState, useMemo } from "react"
import { Table, Typography, Tag, Tooltip, Button, Space, Switch as AntdSwitch } from "antd"
import {
  ClockCircleOutlined, DownOutlined, RightOutlined, FileOutlined,
  NumberOutlined, QuestionCircleOutlined, CalendarOutlined,
  CheckCircleTwoTone, CloseCircleTwoTone, BarsOutlined,
  AlignLeftOutlined, BranchesOutlined, CodeOutlined
} from "@ant-design/icons"
import { useTheme } from "../../theme/ThemeProvider"
import moment from "moment"
import "../../../styles/widget/json-table-widget.css"
const { Text } = Typography

const isObject = val => typeof val === "object" && val !== null && !Array.isArray(val)
const isArray = Array.isArray
const isNull = val => val === null

function typeIcon(type, value, primaryColor) {
  switch (type) {
    case "object":   return <BranchesOutlined style={{color: primaryColor ?? "#779"}} />
    case "array":    return <BarsOutlined style={{color: primaryColor ?? "#557"}} />
    case "string":   return <AlignLeftOutlined style={{color: "#229"}} />
    case "number":   return <NumberOutlined style={{color: "#6a5"}} />
    case "boolean":  return value ? <CheckCircleTwoTone twoToneColor={primaryColor ? [primaryColor,"#52c41a"] : "#52c41a"} /> : <CloseCircleTwoTone twoToneColor="#f5222d" />
    case "null":     return <QuestionCircleOutlined style={{color:"#888"}} />
    default:         return <FileOutlined style={{color:"#aaa"}} />
  }
}
function formatTimestamp(val) {
  if (!val) return ""
  let d = moment(val)
  if (!d.isValid()) {
    d = moment(Number(val))
    if (!d.isValid()) return String(val)
  }
  return d.format("YYYY-MM-DD HH:mm:ss")
}
function isTimestamp(val) {
  if (typeof val === "string" && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) return true
  if (typeof val === "number" && val > 1.5e9) return true
  if (typeof val === "string" && /^\d{10,}$/.test(val)) return true
  return false
}
function flatten(obj, parent = "", rootTimestamp = undefined) {
  if (isArray(obj)) {
    return obj.map((v, i) => ({
      key: `${parent}[${i}]`,
      label: `[${i}]`,
      value: v,
      type: Array.isArray(v) ? "array" : isObject(v) ? "object" : v === null ? "null" : typeof v,
      path: `${parent}[${i}]`,
      isExpandable: isObject(v) || isArray(v),
      timestamp: (isObject(v) && v.timestamp && isTimestamp(v.timestamp)) ? v.timestamp : rootTimestamp
    }))
  } else if (isObject(obj)) {
    return Object.entries(obj).map(([k, v]) => ({
      key: parent ? `${parent}.${k}` : k,
      label: k,
      value: v,
      type: Array.isArray(v) ? "array" : isObject(v) ? "object" : v === null ? "null" : typeof v,
      path: parent ? `${parent}.${k}` : k,
      isExpandable: isObject(v) || isArray(v),
      timestamp: k === "timestamp" && isTimestamp(v) ? v : (isObject(v) && v.timestamp && isTimestamp(v.timestamp)) ? v.timestamp : rootTimestamp
    }))
  }
  return []
}

const JsonTableWidget = ({
  data = {},
  title = "Live JSON Table",
  darkMode: _darkMode, // fallback, but always use theme context
  showTimestampTag = true,
  maxDepth = 5,
  defaultExpandDepth = 2
}) => {
  // Theme context
  const { isDarkMode, primaryColor } = useTheme()
  const [expandAll, setExpandAll] = useState(false)
  const [showRaw, setShowRaw] = useState(false)

  const columns = [
    {
      title: "Key",
      dataIndex: "label",
      key: "label",
      width: "27%",
      render: (label, row) => (
        <Tooltip title={row.path}>
          <span style={{
            fontWeight: row.isExpandable ? 600 : 400,
            cursor: "pointer",
            color: isDarkMode ? "#f5fcff" : "#18304a"
          }}>
            {row.isExpandable ? <RightOutlined style={{ fontSize: 11, marginRight: 6, verticalAlign:"middle", color: primaryColor }} /> : null}
            {label}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      render: (value, row) => {
        if (isArray(value)) {
          return <span style={{ color: primaryColor || "#339" }}>[Array, {value.length} items]</span>
        }
        if (isObject(value)) {
          return <span style={{ color: "#892" }}>{"{...}"}</span>
        }
        if (showTimestampTag && isTimestamp(value)) {
          const formatted = formatTimestamp(value)
          return (
            <Tooltip title={value}>
              <Tag icon={<ClockCircleOutlined />} color={primaryColor || "blue"}>
                {formatted}
              </Tag>
            </Tooltip>
          )
        }
        if (typeof value === "boolean") {
          return (
            <Tag color={value ? "green" : "red"}>
              {value ? "true" : "false"}
            </Tag>
          )
        }
        if (typeof value === "number") {
          return <Text code style={{ color: primaryColor }}>{value}</Text>
        }
        if (isNull(value)) {
          return <Tag color="default">null</Tag>
        }
        return <Text style={{ color: isDarkMode ? "#e5f9ff" : "#2b3a44" }}>{String(value)}</Text>
      }
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: "14%",
      render: (t, row) => <span>{typeIcon(t, row.value, primaryColor)} <Text type="secondary">{t}</Text></span>
    },
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      width: "18%",
      render: (ts, row) => {
        if (!showTimestampTag) return null
        const timestamp = row.timestamp && isTimestamp(row.timestamp)
          ? row.timestamp
          : (isObject(row.value) && row.value && row.value.timestamp && isTimestamp(row.value.timestamp))
            ? row.value.timestamp
            : null
        if (timestamp)
          return <Tooltip title={timestamp}><CalendarOutlined style={{color:primaryColor||"#188"}}/> {formatTimestamp(timestamp)}</Tooltip>
        return <Text type="secondary" style={{fontSize:12,opacity:.7}}>-</Text>
      }
    }
  ]

  function expandedRowRender(row, depth = 1) {
    if ((isObject(row.value) || isArray(row.value)) && depth <= maxDepth) {
      const children = flatten(row.value, row.path, row.timestamp)
      return (
        <Table
          size="small"
          columns={columns}
          dataSource={children}
          rowKey={r => r.key}
          pagination={false}
          showHeader={false}
          style={{ marginLeft: 20, background: isDarkMode ? "#171e22" : "#fafdff", borderRadius: 1 }}
          bordered={false}
          expandable={{
            defaultExpandAllRows: expandAll || (depth < defaultExpandDepth),
            rowExpandable: r => r.isExpandable,
            expandedRowRender: (childRow) => expandedRowRender(childRow, depth + 1),
          }}
        />
      )
    }
    if (showRaw && depth === maxDepth && (isObject(row.value) || isArray(row.value))) {
      return (
        <pre
          className={`json-table-raw-block${isDarkMode ? " dark" : ""}`}
        >{JSON.stringify(row.value, null, 2)}</pre>
      )
    }
    return null
  }

  const dataSource = useMemo(() => flatten(data, "", data.timestamp), [data, data.timestamp])

  return (
    <div
      className="json-table-widget-root"
      style={{
        padding: 0,
        background: isDarkMode ? "#12181b" : "#f3f6fa",
        borderRadius: 12,
        boxShadow: isDarkMode ? "0 1px 8px #102" : "0 2px 16px #eee",
        minHeight: 120,
      }}
    >
      <Space align="center" style={{width:"100%", marginBottom:8, justifyContent:"space-between"}}>
        <span style={{
          fontWeight: 700,
          fontSize: 20,
          color: isDarkMode ? "#c7e7fa" : "#232b33",
          letterSpacing: 0.3,
        }}>
          <BranchesOutlined style={{fontSize:20, marginRight:7, color: primaryColor}}/>
          {title}
        </span>
        <Space>
          <Button
            size="small"
            type="default"
            icon={expandAll ? <DownOutlined /> : <RightOutlined />}
            onClick={() => setExpandAll(a => !a)}
            style={{
              color: isDarkMode ? "#c7e7fa" : "#3a4250",
              borderColor: primaryColor,
              background: isDarkMode ? "#222f38" : "#e9f1ff",
            }}
          >
            {expandAll ? "Collapse All" : "Expand All"}
          </Button>
          <AntdSwitch
            size="small"
            checked={showRaw}
            onChange={setShowRaw}
            checkedChildren={<span><CodeOutlined /> JSON</span>}
            unCheckedChildren={<span><FileOutlined /> Table</span>}
            style={{
              marginLeft: 5, marginRight: 8,
              background: showRaw && primaryColor ? primaryColor : undefined,
              borderColor: primaryColor
            }}
            title="Toggle raw JSON view"
          />
        </Space>
      </Space>
      {showRaw ? (
        <pre className={`json-table-raw-block${isDarkMode ? " dark" : ""}`}>
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <Table
          size="small"
          columns={columns}
          dataSource={dataSource}
          rowKey={row => row.key}
          pagination={false}
          expandable={{
            defaultExpandAllRows: expandAll,
            rowExpandable: row => row.isExpandable,
            expandedRowRender: (row) => expandedRowRender(row, 1),
            expandRowByClick: true,
          }}
          style={{
            background: isDarkMode ? "#181e21" : "#fff",
            // borderRadius: 8,
            border: isDarkMode ? `1px solid ${primaryColor || "#232c35"}` : `1px solid ${primaryColor || "#eee"}`,
          }}
        />
      )}
    </div>
  )
}

export default JsonTableWidget

// "use client"

// import React, { useState, useMemo } from "react"
// import { Table, Typography, Tag, Tooltip, Button, Space, Switch as AntdSwitch } from "antd"
// import {
//   ClockCircleOutlined, DownOutlined, RightOutlined, FileOutlined, 
//   NumberOutlined, QuestionCircleOutlined, CalendarOutlined, 
//   CheckCircleTwoTone, CloseCircleTwoTone, BarsOutlined, 
//   AlignLeftOutlined, BranchesOutlined, CodeOutlined
// } from "@ant-design/icons"

// import moment from "moment"
// import "../../../styles/json-table-widget.css"
// const { Text } = Typography

// // Helpers
// const isObject = val => typeof val === "object" && val !== null && !Array.isArray(val)
// const isArray = Array.isArray
// const isNull = val => val === null

// function typeIcon(type, value) {
//   switch (type) {
//     case "object":   return <BranchesOutlined style={{color:"#779"}} />
//     case "array":    return <BarsOutlined style={{color:"#557"}} />
//     case "string":   return <AlignLeftOutlined style={{color:"#229"}} />
//     case "number":   return <NumberOutlined style={{color:"#6a5"}} />
//     case "boolean":  return value ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : <CloseCircleTwoTone twoToneColor="#f5222d" />
//     case "null":     return <QuestionCircleOutlined style={{color:"#888"}} />
//     default:         return <FileOutlined style={{color:"#aaa"}} />
//   }
// }
// function formatTimestamp(val) {
//   if (!val) return ""
//   let d = moment(val)
//   if (!d.isValid()) {
//     d = moment(Number(val))
//     if (!d.isValid()) return String(val)
//   }
//   return d.format("YYYY-MM-DD HH:mm:ss")
// }
// function isTimestamp(val) {
//   if (typeof val === "string" && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) return true
//   if (typeof val === "number" && val > 1.5e9) return true
//   if (typeof val === "string" && /^\d{10,}$/.test(val)) return true
//   return false
// }
// function flatten(obj, parent = "", rootTimestamp = undefined) {
//   if (isArray(obj)) {
//     return obj.map((v, i) => ({
//       key: `${parent}[${i}]`,
//       label: `[${i}]`,
//       value: v,
//       type: Array.isArray(v) ? "array" : isObject(v) ? "object" : v === null ? "null" : typeof v,
//       path: `${parent}[${i}]`,
//       isExpandable: isObject(v) || isArray(v),
//       timestamp: (isObject(v) && v.timestamp && isTimestamp(v.timestamp)) ? v.timestamp : rootTimestamp
//     }))
//   } else if (isObject(obj)) {
//     return Object.entries(obj).map(([k, v]) => ({
//       key: parent ? `${parent}.${k}` : k,
//       label: k,
//       value: v,
//       type: Array.isArray(v) ? "array" : isObject(v) ? "object" : v === null ? "null" : typeof v,
//       path: parent ? `${parent}.${k}` : k,
//       isExpandable: isObject(v) || isArray(v),
//       timestamp: k === "timestamp" && isTimestamp(v) ? v : (isObject(v) && v.timestamp && isTimestamp(v.timestamp)) ? v.timestamp : rootTimestamp
//     }))
//   }
//   return []
// }

// const JsonTableWidget = ({
//   data = {},
//   title = "Live JSON Table",
//   darkMode = false,
//   showTimestampTag = true,
//   maxDepth = 5,
//   defaultExpandDepth = 2
// }) => {
//   const [expandAll, setExpandAll] = useState(false)
//   const [showRaw, setShowRaw] = useState(false)

//   const columns = [
//     {
//       title: "Key",
//       dataIndex: "label",
//       key: "label",
//       width: "27%",
//       render: (label, row) => (
//         <Tooltip title={row.path}>
//           <span style={{ fontWeight: row.isExpandable ? 600 : 400, cursor: "pointer" }}>
//             {row.isExpandable ? <RightOutlined style={{ fontSize: 11, marginRight: 6, verticalAlign:"middle" }} /> : null}
//             {label}
//           </span>
//         </Tooltip>
//       ),
//     },
//     {
//       title: "Value",
//       dataIndex: "value",
//       key: "value",
//       render: (value, row) => {
//         if (isArray(value)) {
//           return <span style={{ color: "#339" }}>[Array, {value.length} items]</span>
//         }
//         if (isObject(value)) {
//           return <span style={{ color: "#892" }}>{"{...}"}</span>
//         }
//         if (showTimestampTag && isTimestamp(value)) {
//           const formatted = formatTimestamp(value)
//           return (
//             <Tooltip title={value}>
//               <Tag icon={<ClockCircleOutlined />} color="blue">
//                 {formatted}
//               </Tag>
//             </Tooltip>
//           )
//         }
//         if (typeof value === "boolean") {
//           return (
//             <Tag color={value ? "green" : "red"}>
//               {value ? "true" : "false"}
//             </Tag>
//           )
//         }
//         if (typeof value === "number") {
//           return <Text code>{value}</Text>
//         }
//         if (isNull(value)) {
//           return <Tag color="default">null</Tag>
//         }
//         return <Text>{String(value)}</Text>
//       }
//     },
//     {
//       title: "Type",
//       dataIndex: "type",
//       key: "type",
//       width: "14%",
//       render: (t, row) => <span>{typeIcon(t, row.value)} <Text type="secondary">{t}</Text></span>
//     },
//     {
//       title: "Timestamp",
//       dataIndex: "timestamp",
//       key: "timestamp",
//       width: "18%",
//       render: (ts, row) => {
//         if (!showTimestampTag) return null
//         const timestamp = row.timestamp && isTimestamp(row.timestamp)
//           ? row.timestamp
//           : (isObject(row.value) && row.value && row.value.timestamp && isTimestamp(row.value.timestamp))
//             ? row.value.timestamp
//             : null
//         if (timestamp)
//           return <Tooltip title={timestamp}><CalendarOutlined style={{color:"#188"}}/> {formatTimestamp(timestamp)}</Tooltip>
//         return <Text type="secondary" style={{fontSize:12,opacity:.7}}>-</Text>
//       }
//     }
//   ]

//   // Recursive children (expandable)
//   function expandedRowRender(row, depth = 1) {
//     if ((isObject(row.value) || isArray(row.value)) && depth <= maxDepth) {
//       const children = flatten(row.value, row.path, row.timestamp)
//       return (
//         <Table
//           size="small"
//           columns={columns}
//           dataSource={children}
//           rowKey={r => r.key}
//           pagination={false}
//           showHeader={false}
//           style={{ marginLeft: 20, background: darkMode ? "#171e22" : "#fafdff", borderRadius: 6 }}
//           bordered={false}
//           expandable={{
//             defaultExpandAllRows: expandAll || (depth < defaultExpandDepth),
//             rowExpandable: r => r.isExpandable,
//             expandedRowRender: (childRow) => expandedRowRender(childRow, depth + 1),
//           }}
//         />
//       )
//     }
//     // Show full JSON at max depth if toggled
//     if (showRaw && depth === maxDepth && (isObject(row.value) || isArray(row.value))) {
//       return (
//         <pre
//           className="json-table-raw-block"
//         >{JSON.stringify(row.value, null, 2)}</pre>
//       )
//     }
//     return null
//   }

//   const dataSource = useMemo(() => flatten(data, "", data.timestamp), [data, data.timestamp])

//   // Top bar: title, expand/collapse, raw toggle
//   return (
//     <div
//       className="json-table-widget-root"
//       style={{
//         padding: 16,
//         background: darkMode ? "#12181b" : "#f3f6fa",
//         borderRadius: 12,
//         boxShadow: darkMode ? "0 1px 8px #102" : "0 2px 16px #eee",
//         minHeight: 120,
//       }}
//     >
//       <Space align="center" style={{width:"100%", marginBottom:8, justifyContent:"space-between"}}>
//         <span style={{
//           fontWeight: 700,
//           fontSize: 20,
//           color: darkMode ? "#c7e7fa" : "#232b33",
//           letterSpacing: 0.3,
//         }}>
//           <BranchesOutlined style={{fontSize:20, marginRight:7}}/>
//           {title}
//         </span>
//         <Space>
//           <Button
//             size="small"
//             type="default"
//             icon={expandAll ? <DownOutlined /> : <RightOutlined />}
//             onClick={() => setExpandAll(a => !a)}
//           >
//             {expandAll ? "Collapse All" : "Expand All"}
//           </Button>
//           <AntdSwitch
//             size="small"
//             checked={showRaw}
//             onChange={setShowRaw}
//             checkedChildren={<span><CodeOutlined /> JSON</span>}
//             unCheckedChildren={<span><FileOutlined /> Table</span>}
//             style={{marginLeft:5,marginRight:8}}
//             title="Toggle raw JSON view"
//           />
//         </Space>
//       </Space>
//       {showRaw ? (
//         <pre className={`json-table-raw-block${darkMode ? " dark" : ""}`}>
//           {JSON.stringify(data, null, 2)}
//         </pre>
//       ) : (
//         <Table
//           size="small"
//           columns={columns}
//           dataSource={dataSource}
//           rowKey={row => row.key}
//           pagination={false}
//           expandable={{
//             defaultExpandAllRows: expandAll,
//             rowExpandable: row => row.isExpandable,
//             expandedRowRender: (row) => expandedRowRender(row, 1),
//             expandRowByClick: true,
//           }}
//           style={{
//             background: darkMode ? "#181e21" : "#fff",
//             borderRadius: 8,
//             border: darkMode ? "1px solid #232c35" : "1px solid #eee",
//           }}
//         />
//       )}
//     </div>
//   )
// }

// export default JsonTableWidget
