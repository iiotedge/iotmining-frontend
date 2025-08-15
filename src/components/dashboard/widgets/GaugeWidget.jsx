"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react" // Added useCallback
import {
  Card, Modal, Select, Button, Tooltip, Space, InputNumber, Divider, Input, Row, Col, message,
} from "antd"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { SettingOutlined, RedoOutlined, ClusterOutlined, SaveOutlined } from "@ant-design/icons"
import "../../../styles/widget/gauge.css"

const DEFAULT_THRESHOLDS = [0.3, 0.7]
const DEFAULT_COLORS = ["#52c41a", "#faad14", "#f5222d"]
const DEFAULT_RANGE = { min: 0, max: 100 }
const DEFAULT_PRECISION = 1

const UNIT_OPTIONS = [
  { value: "%", label: "Percentage (%)", icon: <ClusterOutlined /> },
  { value: "°C", label: "Temperature (°C)", icon: <ClusterOutlined /> },
  { value: "°F", label: "Temperature (°F)", icon: <ClusterOutlined /> },
  { value: "V", label: "Voltage (V)", icon: <ClusterOutlined /> },
  { value: "A", label: "Current (A)", icon: <ClusterOutlined /> },
  { value: "Bar", label: "Pressure (Bar)", icon: <ClusterOutlined /> },
  { value: "Pa", label: "Pressure (Pa)", icon: <ClusterOutlined /> },
  { value: "L", label: "Level (L)", icon: <ClusterOutlined /> },
  { value: "m/s", label: "Speed (m/s)", icon: <ClusterOutlined /> },
  { value: "rpm", label: "Rotation (RPM)", icon: <ClusterOutlined /> },
  { value: "custom", label: "Custom", icon: <SettingOutlined /> },
]

// Debounce utility (closure, safe for React)
function useDebounceCallback(callback, delay = 60) {
  const ref = useRef()
  useEffect(() => { ref.current = callback }, [callback])
  return useMemo(
    () => {
      let t
      return (...args) => {
        if (t) clearTimeout(t)
        t = setTimeout(() => ref.current(...args), delay)
      }
    },
    [delay]
  )
}

function getByDotPath(obj, path) {
  if (!obj || typeof obj !== "object" || !path) return undefined
  return path.split('.').reduce((acc, part) =>
    acc && Object.prototype.hasOwnProperty.call(acc, part) ? acc[part] : undefined, obj
  )
}

const GaugeWidget = ({
  title = "Radial Gauge",
  value,
  unit = "°C",
  min = DEFAULT_RANGE.min,
  max = DEFAULT_RANGE.max,
  precision = DEFAULT_PRECISION,
  data = [],
  dataKeys = ["value"],
  theme = "light",
  thresholds = DEFAULT_THRESHOLDS,
  colors = DEFAULT_COLORS,
  onSettingsSave,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Local state for settings
  const [gaugeMin, setGaugeMin] = useState(min)
  const [gaugeMax, setGaugeMax] = useState(max)
  const [gaugePrecision, setGaugePrecision] = useState(precision)
  const [selectedUnit, setSelectedUnit] = useState(unit)
  const [customUnit, setCustomUnit] = useState("")
  const [gaugeThresholds, setGaugeThresholds] = useState([...thresholds])
  const [gaugeColors, setGaugeColors] = useState([...colors])

  // Debounced color updaters
  const setGaugeColorsDebounced = useDebounceCallback(setGaugeColors, 60)

  // Sync props to state only when modal opens (so Save/Cancel works as expected)
  useEffect(() => {
    if (settingsOpen) {
      setGaugeMin(min)
      setGaugeMax(max)
      setGaugePrecision(precision)
      setSelectedUnit(unit)
      setCustomUnit("") // Clear custom unit on open, it will be set if 'unit' is 'custom'
      setGaugeThresholds([...thresholds])
      setGaugeColors([...colors])
    }
  }, [settingsOpen, min, max, precision, unit, thresholds, colors]) // Added dependencies for clarity

  // Value logic
  let gaugeValue = typeof value === "number" ? value : 0
  if (data && data.length > 0 && dataKeys && dataKeys.length > 0) {
    const latest = data[data.length - 1]
    if (latest) {
      const v = getByDotPath(latest, dataKeys[0])
      if (typeof v === "number") gaugeValue = v
    }
  }

  const safeValue = Math.max(gaugeMin, Math.min(gaugeMax, gaugeValue))
  const range = Math.max(1, gaugeMax - gaugeMin)
  const percent = (safeValue - gaugeMin) / range

  const dataArr = [
    { name: "value", value: percent },
    { name: "empty", value: 1 - percent },
  ]

  const getColor = useCallback(() => { // Memoize getColor for performance
    if (percent < (gaugeThresholds[0] ?? DEFAULT_THRESHOLDS[0])) return gaugeColors[0] || DEFAULT_COLORS[0]
    if (percent < (gaugeThresholds[1] ?? DEFAULT_THRESHOLDS[1])) return gaugeColors[1] || DEFAULT_COLORS[1]
    return gaugeColors[2] || DEFAULT_COLORS[2]
  }, [percent, gaugeThresholds, gaugeColors])

  const displayUnit = selectedUnit === "custom" ? customUnit : selectedUnit

  const handleResetAll = () => {
    setGaugeMin(DEFAULT_RANGE.min)
    setGaugeMax(DEFAULT_RANGE.max)
    setGaugePrecision(DEFAULT_PRECISION)
    setSelectedUnit(unit) // Reset to prop unit, not necessarily 'default'
    setCustomUnit("")
    setGaugeThresholds([...DEFAULT_THRESHOLDS])
    setGaugeColors([...DEFAULT_COLORS])
    message.info("Settings reset to default.")
  }

  const handleSave = () => {
    setSettingsOpen(false)
    if (onSettingsSave) {
      onSettingsSave({
        min: gaugeMin,
        max: gaugeMax,
        precision: gaugePrecision,
        thresholds: gaugeThresholds,
        colors: gaugeColors,
        unit: selectedUnit,
        customUnit,
      })
    }
    message.success("Gauge settings saved")
  }

  const unitOptionRender = (option) => (
    <span>
      {option.icon} <span style={{ marginLeft: 8 }}>{option.label}</span>
    </span>
  )

  return (
    <Card
      title={
        <Space>
          <span>{title}</span>
          <Tooltip title="Gauge settings">
            <Button
              type="link"
              icon={<SettingOutlined />}
              size="small"
              onClick={() => setSettingsOpen(true)}
            />
          </Tooltip>
        </Space>
      }
      bordered={false}
      style={{
        height: "100%",
        width: "100%",
        background: "transparent",
        boxShadow: "none",
        margin: 0,
        padding: 0,
      }}
      bodyStyle={{
        height: "100%",
        width: "100%",
        padding: 0,
        margin: 0,
        background: "transparent",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      className={theme === "dark" ? "widget-theme-dark" : ""}
    >
      <div
        className="gauge-widget-content" // Added a class for styling
        style={{
          flex: 1,
          height: "100%",
          width: "100%",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Center value and unit */}
        <div
          className="gauge-value-display" // Added a class for styling
          style={{
            position: "absolute",
            top: "54%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            zIndex: 1,
            pointerEvents: "none",
            width: "100%",
            userSelect: "none",
          }}
        >
          <div className="gauge-main-value" style={{ fontSize: "2.2em", fontWeight: 700, color: getColor(), lineHeight: 1 }}>
            {safeValue.toFixed(gaugePrecision)}
            <span className="gauge-unit" style={{
              fontSize: "0.6em",
              color: theme === "dark" ? "#bbb" : "#888",
              marginLeft: 6,
            }}>
              {displayUnit}
            </span>
          </div>
          <div className="gauge-range-info" style={{
            fontSize: "0.9em",
            color: theme === "dark" ? "#bbb" : "#888",
            marginTop: 2,
          }}>
            {gaugeMin} {displayUnit} — {gaugeMax} {displayUnit}
          </div>
          <div className="gauge-percent-info" style={{
            fontSize: "0.85em",
            color: theme === "dark" ? "#a3c0fa" : "#669",
            marginTop: 2,
            letterSpacing: 0.5,
          }}>
            {Math.round(percent * 100)}%
          </div>
        </div>

        {/* Gauge Pie */}
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataArr}
              cx="50%"
              cy="50%"
              startAngle={210}
              endAngle={-30}
              innerRadius="75%"
              outerRadius="95%"
              dataKey="value"
              stroke="none"
              isAnimationActive={true}
              animationDuration={800}
              cornerRadius={8}
            >
              <Cell fill={getColor()} />
              <Cell fill={theme === "dark" ? "#1a1a1a" : "#eee"} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Settings Modal */}
      <Modal
        title={<span><SettingOutlined /> Gauge Settings</span>}
        open={settingsOpen}
        onOk={handleSave}
        onCancel={() => setSettingsOpen(false)}
        okText={<span><SaveOutlined /> Save</span>}
        cancelText="Cancel"
        bodyStyle={{ padding: 20, paddingTop: 12 }}
        style={{ top: 80 }}
        footer={[
          <Button key="reset" icon={<RedoOutlined />} onClick={handleResetAll}>Reset</Button>,
          <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleSave}>Save</Button>
        ]}
      >
        {/* Range */}
        <Row gutter={12} align="middle" style={{ marginBottom: 18 }}>
          <Col flex="60px"><b>Range</b></Col>
          <Col xs={24} sm={8}> {/* Responsive column for Min */}
            <InputNumber
              value={gaugeMin}
              min={-10000}
              max={gaugeMax - 1}
              size="small"
              onChange={v => setGaugeMin(Number(v))}
              style={{ width: '100%' }} // Full width on small screens
              addonBefore="Min"
            />
          </Col>
          <Col xs={24} sm={8}> {/* Responsive column for Max */}
            <InputNumber
              value={gaugeMax}
              min={gaugeMin + 1}
              max={10000}
              size="small"
              onChange={v => setGaugeMax(Number(v))}
              style={{ width: '100%', marginTop: window.innerWidth <= 576 ? 10 : 0 }} // Add top margin on mobile
              addonBefore="Max"
            />
          </Col>
          <Col xs={24} sm={8}> {/* Responsive column for Precision */}
            <Tooltip title="Decimal places">
              <InputNumber
                value={gaugePrecision}
                min={0}
                max={4}
                size="small"
                onChange={v => setGaugePrecision(Number(v))}
                style={{ width: '100%', marginTop: window.innerWidth <= 576 ? 10 : 0 }} // Add top margin on mobile
                addonBefore="Prec"
              />
            </Tooltip>
          </Col>
        </Row>
        <Divider style={{ margin: "12px 0" }} />

        {/* Thresholds */}
        <div style={{ marginBottom: 14 }}>
          <b>Thresholds &amp; Colors</b>
          {/* Use responsive rows for each threshold */}
          <Row gutter={[12, 10]} align="middle" style={{ marginTop: 6 }}> {/* Added vertical gutter */}
            <Col flex="70px">Low</Col>
            <Col xs={14} sm={8}> {/* Adjusted column width for mobile */}
              <InputNumber
                min={0}
                max={gaugeThresholds[1] || 1}
                step={0.01}
                value={gaugeThresholds[0]}
                onChange={v => {
                  const t = [...gaugeThresholds]
                  t[0] = Number(v)
                  setGaugeThresholds(t)
                }}
                size="small"
                formatter={v => `${Math.round(Number(v) * 100)}%`}
                parser={v => (Number(v.replace("%", "")) / 100)}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={6} sm={4}> {/* Adjusted column width for mobile */}
              <input
                type="color"
                value={gaugeColors[0]}
                onChange={e => {
                  const c = [...gaugeColors]
                  c[0] = e.target.value
                  setGaugeColorsDebounced(c)
                }}
                style={{ width: "100%", height: 24, border: "none" }}
              />
            </Col>
          </Row>
          <Row gutter={[12, 10]} align="middle" style={{ marginTop: 6 }}>
            <Col flex="70px">Med</Col>
            <Col xs={14} sm={8}>
              <InputNumber
                min={gaugeThresholds[0]}
                max={1}
                step={0.01}
                value={gaugeThresholds[1]}
                onChange={v => {
                  const t = [...gaugeThresholds]
                  t[1] = Number(v)
                  setGaugeThresholds(t)
                }}
                size="small"
                formatter={v => `${Math.round(Number(v) * 100)}%`}
                parser={v => (Number(v.replace("%", "")) / 100)}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={6} sm={4}>
              <input
                type="color"
                value={gaugeColors[1]}
                onChange={e => {
                  const c = [...gaugeColors]
                  c[1] = e.target.value
                  setGaugeColorsDebounced(c)
                }}
                style={{ width: "100%", height: 24, border: "none" }}
              />
            </Col>
          </Row>
          <Row gutter={[12, 10]} align="middle" style={{ marginTop: 6 }}>
            <Col flex="70px">High</Col>
            <Col xs={14} sm={8} style={{ opacity: 0.65 }}>n/a</Col> {/* Adjusted column width */}
            <Col xs={6} sm={4}>
              <input
                type="color"
                value={gaugeColors[2]}
                onChange={e => {
                  const c = [...gaugeColors]
                  c[2] = e.target.value
                  setGaugeColorsDebounced(c)
                }}
                style={{ width: "100%", height: 24, border: "none" }}
              />
            </Col>
          </Row>
        </div>
        <Divider style={{ margin: "12px 0" }} />

        {/* Unit Picker */}
        <div style={{ marginBottom: 12 }}>
          <b>Unit</b>
          <Select
            value={selectedUnit}
            onChange={val => {
              setSelectedUnit(val)
              if (val !== "custom") setCustomUnit("")
            }}
            style={{ width: 'calc(100% - 60px)', marginLeft: 10 }} // Adjusted width for responsiveness
            dropdownStyle={{ zIndex: 2000 }}
            optionLabelProp="label"
            optionRender={unitOptionRender}
          >
            {UNIT_OPTIONS.map(opt => (
              <Select.Option key={opt.value} value={opt.value} label={opt.label}>
                {unitOptionRender(opt)}
              </Select.Option>
            ))}
          </Select>
          {selectedUnit === "custom" && (
            <Input
              value={customUnit}
              placeholder="Enter custom unit"
              onChange={e => setCustomUnit(e.target.value)}
              size="small"
              style={{
                width: '100%', // Full width for custom unit input on mobile
                marginTop: 10, // Added margin top
                fontSize: 13,
              }}
            />
          )}
        </div>
      </Modal>
    </Card>
  )
}

export default GaugeWidget

// "use client"

// import { useState, useEffect, useMemo, useRef } from "react"
// import {
//   Card, Modal, Select, Button, Tooltip, Space, InputNumber, Divider, Input, Row, Col, message,
// } from "antd"
// import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
// import { SettingOutlined, RedoOutlined, ClusterOutlined, SaveOutlined } from "@ant-design/icons"

// const DEFAULT_THRESHOLDS = [0.3, 0.7]
// const DEFAULT_COLORS = ["#52c41a", "#faad14", "#f5222d"]
// const DEFAULT_RANGE = { min: 0, max: 100 }
// const DEFAULT_PRECISION = 1

// const UNIT_OPTIONS = [
//   { value: "%", label: "Percentage (%)", icon: <ClusterOutlined /> },
//   { value: "°C", label: "Temperature (°C)", icon: <ClusterOutlined /> },
//   { value: "°F", label: "Temperature (°F)", icon: <ClusterOutlined /> },
//   { value: "V", label: "Voltage (V)", icon: <ClusterOutlined /> },
//   { value: "A", label: "Current (A)", icon: <ClusterOutlined /> },
//   { value: "Bar", label: "Pressure (Bar)", icon: <ClusterOutlined /> },
//   { value: "Pa", label: "Pressure (Pa)", icon: <ClusterOutlined /> },
//   { value: "L", label: "Level (L)", icon: <ClusterOutlined /> },
//   { value: "m/s", label: "Speed (m/s)", icon: <ClusterOutlined /> },
//   { value: "rpm", label: "Rotation (RPM)", icon: <ClusterOutlined /> },
//   { value: "custom", label: "Custom", icon: <SettingOutlined /> },
// ]

// // Debounce utility (closure, safe for React)
// function useDebounceCallback(callback, delay = 60) {
//   const ref = useRef()
//   useEffect(() => { ref.current = callback }, [callback])
//   return useMemo(
//     () => {
//       let t
//       return (...args) => {
//         if (t) clearTimeout(t)
//         t = setTimeout(() => ref.current(...args), delay)
//       }
//     },
//     [delay]
//   )
// }

// function getByDotPath(obj, path) {
//   if (!obj || typeof obj !== "object" || !path) return undefined
//   return path.split('.').reduce((acc, part) =>
//     acc && Object.prototype.hasOwnProperty.call(acc, part) ? acc[part] : undefined, obj
//   )
// }

// const GaugeWidget = ({
//   title = "Radial Gauge",
//   value,
//   unit = "°C",
//   min = DEFAULT_RANGE.min,
//   max = DEFAULT_RANGE.max,
//   precision = DEFAULT_PRECISION,
//   data = [],
//   dataKeys = ["value"],
//   theme = "light",
//   thresholds = DEFAULT_THRESHOLDS,
//   colors = DEFAULT_COLORS,
//   onSettingsSave,
// }) => {
//   const [settingsOpen, setSettingsOpen] = useState(false)

//   // Local state for settings
//   const [gaugeMin, setGaugeMin] = useState(min)
//   const [gaugeMax, setGaugeMax] = useState(max)
//   const [gaugePrecision, setGaugePrecision] = useState(precision)
//   const [selectedUnit, setSelectedUnit] = useState(unit)
//   const [customUnit, setCustomUnit] = useState("")
//   const [gaugeThresholds, setGaugeThresholds] = useState([...thresholds])
//   const [gaugeColors, setGaugeColors] = useState([...colors])

//   // Debounced color updaters
//   const setGaugeColorsDebounced = useDebounceCallback(setGaugeColors, 60)

//   // Sync props to state only when modal opens (so Save/Cancel works as expected)
//   useEffect(() => {
//     if (settingsOpen) {
//       setGaugeMin(min)
//       setGaugeMax(max)
//       setGaugePrecision(precision)
//       setSelectedUnit(unit)
//       setCustomUnit("")
//       setGaugeThresholds([...thresholds])
//       setGaugeColors([...colors])
//     }
//   }, [settingsOpen]) // Only runs when modal is opened

//   // Value logic
//   let gaugeValue = typeof value === "number" ? value : 0
//   if (data && data.length > 0 && dataKeys && dataKeys.length > 0) {
//     const latest = data[data.length - 1]
//     if (latest) {
//       const v = getByDotPath(latest, dataKeys[0])
//       if (typeof v === "number") gaugeValue = v
//     }
//   }

//   const safeValue = Math.max(gaugeMin, Math.min(gaugeMax, gaugeValue))
//   const range = Math.max(1, gaugeMax - gaugeMin)
//   const percent = (safeValue - gaugeMin) / range

//   const dataArr = [
//     { name: "value", value: percent },
//     { name: "empty", value: 1 - percent },
//   ]

//   const getColor = () => {
//     if (percent < (gaugeThresholds[0] ?? DEFAULT_THRESHOLDS[0])) return gaugeColors[0] || DEFAULT_COLORS[0]
//     if (percent < (gaugeThresholds[1] ?? DEFAULT_THRESHOLDS[1])) return gaugeColors[1] || DEFAULT_COLORS[1]
//     return gaugeColors[2] || DEFAULT_COLORS[2]
//   }

//   const displayUnit = selectedUnit === "custom" ? customUnit : selectedUnit

//   const handleResetAll = () => {
//     setGaugeMin(DEFAULT_RANGE.min)
//     setGaugeMax(DEFAULT_RANGE.max)
//     setGaugePrecision(DEFAULT_PRECISION)
//     setSelectedUnit(unit)
//     setCustomUnit("")
//     setGaugeThresholds([...DEFAULT_THRESHOLDS])
//     setGaugeColors([...DEFAULT_COLORS])
//     message.info("Settings reset to default.")
//   }

//   const handleSave = () => {
//     setSettingsOpen(false)
//     if (onSettingsSave) {
//       onSettingsSave({
//         min: gaugeMin,
//         max: gaugeMax,
//         precision: gaugePrecision,
//         thresholds: gaugeThresholds,
//         colors: gaugeColors,
//         unit: selectedUnit,
//         customUnit,
//       })
//     }
//     message.success("Gauge settings saved")
//   }

//   const unitOptionRender = (option) => (
//     <span>
//       {option.icon} <span style={{ marginLeft: 8 }}>{option.label}</span>
//     </span>
//   )

//   return (
//     <Card
//       title={
//         <Space>
//           <span>{title}</span>
//           <Tooltip title="Gauge settings">
//             <Button
//               type="link"
//               icon={<SettingOutlined />}
//               size="small"
//               onClick={() => setSettingsOpen(true)}
//             />
//           </Tooltip>
//         </Space>
//       }
//       bordered={false}
//       style={{
//         height: "100%",
//         width: "100%",
//         background: "transparent",
//         boxShadow: "none",
//         margin: 0,
//         padding: 0,
//       }}
//       bodyStyle={{
//         height: "100%",
//         width: "100%",
//         padding: 0,
//         margin: 0,
//         background: "transparent",
//         overflow: "hidden",
//         display: "flex",
//         flexDirection: "column",
//       }}
//       className={theme === "dark" ? "widget-theme-dark" : ""}
//     >
//       <div
//         style={{
//           flex: 1,
//           height: "100%",
//           width: "100%",
//           position: "relative",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           overflow: "hidden",
//           minHeight: 0,
//         }}
//       >
//         {/* Center value and unit */}
//         <div
//           style={{
//             position: "absolute",
//             top: "54%",
//             left: "50%",
//             transform: "translate(-50%, -50%)",
//             textAlign: "center",
//             zIndex: 1,
//             pointerEvents: "none",
//             width: "100%",
//             userSelect: "none",
//           }}
//         >
//           <div style={{ fontSize: "2.2em", fontWeight: 700, color: getColor(), lineHeight: 1 }}>
//             {safeValue.toFixed(gaugePrecision)}
//             <span style={{
//               fontSize: "0.6em",
//               color: theme === "dark" ? "#bbb" : "#888",
//               marginLeft: 6,
//             }}>
//               {displayUnit}
//             </span>
//           </div>
//           <div style={{
//             fontSize: "0.9em",
//             color: theme === "dark" ? "#bbb" : "#888",
//             marginTop: 2,
//           }}>
//             {gaugeMin} {displayUnit} — {gaugeMax} {displayUnit}
//           </div>
//           <div style={{
//             fontSize: "0.85em",
//             color: theme === "dark" ? "#a3c0fa" : "#669",
//             marginTop: 2,
//             letterSpacing: 0.5,
//           }}>
//             {Math.round(percent * 100)}%
//           </div>
//         </div>

//         {/* Gauge Pie */}
//         <ResponsiveContainer width="100%" height="100%">
//           <PieChart>
//             <Pie
//               data={dataArr}
//               cx="50%"
//               cy="50%"
//               startAngle={210}
//               endAngle={-30}
//               innerRadius="75%"
//               outerRadius="95%"
//               dataKey="value"
//               stroke="none"
//               isAnimationActive={true}
//               animationDuration={800}
//               cornerRadius={8}
//             >
//               <Cell fill={getColor()} />
//               <Cell fill={theme === "dark" ? "#1a1a1a" : "#eee"} />
//             </Pie>
//           </PieChart>
//         </ResponsiveContainer>
//       </div>

//       {/* Settings Modal */}
//       <Modal
//         title={<span><SettingOutlined /> Gauge Settings</span>}
//         open={settingsOpen}
//         onOk={handleSave}
//         onCancel={() => setSettingsOpen(false)}
//         okText={<span><SaveOutlined /> Save</span>}
//         cancelText="Cancel"
//         bodyStyle={{ padding: 20, paddingTop: 12 }}
//         style={{ top: 80 }}
//         footer={[
//           <Button key="reset" icon={<RedoOutlined />} onClick={handleResetAll}>Reset</Button>,
//           <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleSave}>Save</Button>
//         ]}
//       >
//         {/* Range */}
//         <Row gutter={12} align="middle" style={{ marginBottom: 18 }}>
//           <Col flex="60px"><b>Range</b></Col>
//           <Col>
//             <InputNumber
//               value={gaugeMin}
//               min={-10000}
//               max={gaugeMax - 1}
//               size="small"
//               onChange={v => setGaugeMin(Number(v))}
//               style={{ width: 80 }}
//               addonBefore="Min"
//             />
//           </Col>
//           <Col>
//             <InputNumber
//               value={gaugeMax}
//               min={gaugeMin + 1}
//               max={10000}
//               size="small"
//               onChange={v => setGaugeMax(Number(v))}
//               style={{ width: 80 }}
//               addonBefore="Max"
//             />
//           </Col>
//           <Col>
//             <Tooltip title="Decimal places">
//               <InputNumber
//                 value={gaugePrecision}
//                 min={0}
//                 max={4}
//                 size="small"
//                 onChange={v => setGaugePrecision(Number(v))}
//                 style={{ width: 60, marginLeft: 6 }}
//                 addonBefore="Prec"
//               />
//             </Tooltip>
//           </Col>
//         </Row>
//         <Divider style={{ margin: "12px 0" }} />

//         {/* Thresholds */}
//         <div style={{ marginBottom: 14 }}>
//           <b>Thresholds &amp; Colors</b>
//           <Row gutter={12} align="middle" style={{ marginTop: 6 }}>
//             <Col flex="70px">Low</Col>
//             <Col>
//               <InputNumber
//                 min={0}
//                 max={gaugeThresholds[1] || 1}
//                 step={0.01}
//                 value={gaugeThresholds[0]}
//                 onChange={v => {
//                   const t = [...gaugeThresholds]
//                   t[0] = Number(v)
//                   setGaugeThresholds(t)
//                 }}
//                 size="small"
//                 formatter={v => `${Math.round(Number(v) * 100)}%`}
//                 parser={v => (Number(v.replace("%", "")) / 100)}
//                 style={{ width: 75 }}
//               />
//             </Col>
//             <Col>
//               <input
//                 type="color"
//                 value={gaugeColors[0]}
//                 onChange={e => {
//                   const c = [...gaugeColors]
//                   c[0] = e.target.value
//                   setGaugeColorsDebounced(c)
//                 }}
//                 style={{ width: 36, height: 24, border: "none" }}
//               />
//             </Col>
//           </Row>
//           <Row gutter={12} align="middle" style={{ marginTop: 6 }}>
//             <Col flex="70px">Med</Col>
//             <Col>
//               <InputNumber
//                 min={gaugeThresholds[0]}
//                 max={1}
//                 step={0.01}
//                 value={gaugeThresholds[1]}
//                 onChange={v => {
//                   const t = [...gaugeThresholds]
//                   t[1] = Number(v)
//                   setGaugeThresholds(t)
//                 }}
//                 size="small"
//                 formatter={v => `${Math.round(Number(v) * 100)}%`}
//                 parser={v => (Number(v.replace("%", "")) / 100)}
//                 style={{ width: 75 }}
//               />
//             </Col>
//             <Col>
//               <input
//                 type="color"
//                 value={gaugeColors[1]}
//                 onChange={e => {
//                   const c = [...gaugeColors]
//                   c[1] = e.target.value
//                   setGaugeColorsDebounced(c)
//                 }}
//                 style={{ width: 36, height: 24, border: "none" }}
//               />
//             </Col>
//           </Row>
//           <Row gutter={12} align="middle" style={{ marginTop: 6 }}>
//             <Col flex="70px">High</Col>
//             <Col style={{ opacity: 0.65 }}>n/a</Col>
//             <Col>
//               <input
//                 type="color"
//                 value={gaugeColors[2]}
//                 onChange={e => {
//                   const c = [...gaugeColors]
//                   c[2] = e.target.value
//                   setGaugeColorsDebounced(c)
//                 }}
//                 style={{ width: 36, height: 24, border: "none" }}
//               />
//             </Col>
//           </Row>
//         </div>
//         <Divider style={{ margin: "12px 0" }} />

//         {/* Unit Picker */}
//         <div style={{ marginBottom: 12 }}>
//           <b>Unit</b>
//           <Select
//             value={selectedUnit}
//             onChange={val => {
//               setSelectedUnit(val)
//               if (val !== "custom") setCustomUnit("")
//             }}
//             style={{ width: 190, marginLeft: 10 }}
//             dropdownStyle={{ zIndex: 2000 }}
//             optionLabelProp="label"
//             optionRender={unitOptionRender}
//           >
//             {UNIT_OPTIONS.map(opt => (
//               <Select.Option key={opt.value} value={opt.value} label={opt.label}>
//                 {unitOptionRender(opt)}
//               </Select.Option>
//             ))}
//           </Select>
//           {selectedUnit === "custom" && (
//             <Input
//               value={customUnit}
//               placeholder="Enter custom unit"
//               onChange={e => setCustomUnit(e.target.value)}
//               size="small"
//               style={{
//                 width: 110,
//                 marginLeft: 10,
//                 fontSize: 13,
//               }}
//             />
//           )}
//         </div>
//       </Modal>
//     </Card>
//   )
// }

// export default GaugeWidget




// // "use client"

// // import { useState } from "react"
// // import { Card, Modal, Select, Button, Tooltip, Space } from "antd"
// // import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
// // import { SettingOutlined, RedoOutlined, ClusterOutlined } from "@ant-design/icons"

// // const DEFAULT_THRESHOLDS = [0.3, 0.7, 0.4]
// // // const DEFAULT_COLORS = ["#f5222d", "#faad14", "#52c41a"]
// // const DEFAULT_COLORS = ["#52c41a", "#faad14", "#f5222d"]
// // const UNIT_OPTIONS = [
// //   { value: "%", label: "Percentage (%)", icon: <ClusterOutlined /> },
// //   { value: "°C", label: "Temperature (°C)", icon: <ClusterOutlined /> },
// //   { value: "°F", label: "Temperature (°F)", icon: <ClusterOutlined /> },
// //   { value: "V", label: "Voltage (V)", icon: <ClusterOutlined /> },
// //   { value: "A", label: "Current (A)", icon: <ClusterOutlined /> },
// //   { value: "Bar", label: "Pressure (Bar)", icon: <ClusterOutlined /> },
// //   { value: "Pa", label: "Pressure (Pa)", icon: <ClusterOutlined /> },
// //   { value: "L", label: "Level (L)", icon: <ClusterOutlined /> },
// //   { value: "m/s", label: "Speed (m/s)", icon: <ClusterOutlined /> },
// //   { value: "rpm", label: "Rotation (RPM)", icon: <ClusterOutlined /> },
// //   { value: "custom", label: "Custom", icon: <SettingOutlined /> },
// // ]

// // // Helper to get nested value from object by dot-path
// // function getByDotPath(obj, path) {
// //   if (!obj || typeof obj !== "object" || !path) return undefined
// //   return path.split('.').reduce((acc, part) =>
// //     acc && Object.prototype.hasOwnProperty.call(acc, part) ? acc[part] : undefined, obj
// //   )
// // }

// // const GaugeWidget = ({
// //   title = "Radial Gauge",
// //   value,
// //   unit = "°C",
// //   min = 0,
// //   max = 100,
// //   precision = 1,
// //   data = [],
// //   dataKeys = ["value"],
// //   theme = "light",
// //   thresholds = DEFAULT_THRESHOLDS,
// //   colors = ["#119e34ff", "#faad14", "#f5222d"],
// // }) => {
// //   // --- Widget State ---
// //   const [settingsOpen, setSettingsOpen] = useState(false)
// //   const [selectedUnit, setSelectedUnit] = useState(unit)
// //   const [customUnit, setCustomUnit] = useState("")

// //   // Value logic (dot-path supported!)
// //   let gaugeValue = typeof value === "number" ? value : 0
// //   if (data && data.length > 0 && dataKeys && dataKeys.length > 0) {
// //     const latest = data[data.length - 1]
// //     if (latest) {
// //       const v = getByDotPath(latest, dataKeys[0])
// //       if (typeof v === "number") {
// //         gaugeValue = v
// //       }
// //     }
// //   }

// //   const safeValue = Math.max(min, Math.min(max, gaugeValue))
// //   const range = Math.max(1, max - min)
// //   const percent = (safeValue - min) / range

// //   const dataArr = [
// //     { name: "value", value: percent },
// //     { name: "empty", value: 1 - percent },
// //   ]

// //   // Threshold coloring logic
// //   const getColor = () => {
// //     if (percent < (thresholds[0] ?? DEFAULT_THRESHOLDS[0])) return colors[0] || DEFAULT_COLORS[0]
// //     if (percent < (thresholds[1] ?? DEFAULT_THRESHOLDS[1])) return colors[1] || DEFAULT_COLORS[1]
// //     // if (percent < (thresholds[2] ?? DEFAULT_THRESHOLDS[2])) return colors[2] || DEFAULT_COLORS[2]
// //     //  if (percent < (thresholds[3] ?? DEFAULT_THRESHOLDS[3])) return colors[3] || DEFAULT_COLORS[2]
// //     return colors[2] || DEFAULT_COLORS[2]
// //   }

// //   // Display logic for unit
// //   const displayUnit =
// //     selectedUnit === "custom" ? customUnit || "" : selectedUnit

// //   // Reset to prop unit
// //   const handleResetUnit = () => {
// //     setSelectedUnit(unit)
// //     setCustomUnit("")
// //   }

// //   // Render option with icon for unit select
// //   const unitOptionRender = (option) => (
// //     <span>
// //       {option.icon} <span style={{ marginLeft: 8 }}>{option.label}</span>
// //     </span>
// //   )

// //   return (
// //     <Card
// //       title={
// //         <Space>
// //           <span>{title}</span>
// //           <Tooltip title="Gauge settings">
// //             <Button
// //               type="link"
// //               icon={<SettingOutlined />}
// //               size="small"
// //               onClick={() => setSettingsOpen(true)}
// //             />
// //           </Tooltip>
// //         </Space>
// //       }
// //       bordered={false}
// //       style={{
// //         height: "100%",
// //         width: "100%",
// //         background: "transparent",
// //         boxShadow: "none",
// //         margin: 0,
// //         padding: 0,
// //       }}
// //       bodyStyle={{
// //         height: "100%",
// //         width: "100%",
// //         padding: 0,
// //         margin: 0,
// //         background: "transparent",
// //         overflow: "hidden",
// //         display: "flex",
// //         flexDirection: "column",
// //       }}
// //       className={theme === "dark" ? "widget-theme-dark" : ""}
// //     >
// //       <div
// //         style={{
// //           flex: 1,
// //           height: "100%",
// //           width: "100%",
// //           position: "relative",
// //           display: "flex",
// //           alignItems: "center",
// //           justifyContent: "center",
// //           overflow: "hidden",
// //           minHeight: 0,
// //         }}
// //       >
// //         {/* Center value and unit */}
// //         <div
// //           style={{
// //             position: "absolute",
// //             top: "54%",
// //             left: "50%",
// //             transform: "translate(-50%, -50%)",
// //             textAlign: "center",
// //             zIndex: 1,
// //             pointerEvents: "none",
// //             width: "100%",
// //             userSelect: "none",
// //           }}
// //         >
// //           <div style={{ fontSize: "2.2em", fontWeight: 700, color: getColor(), lineHeight: 1 }}>
// //             {safeValue.toFixed(precision)}
// //             <span style={{
// //               fontSize: "0.6em",
// //               color: theme === "dark" ? "#bbb" : "#888",
// //               marginLeft: 6,
// //             }}>
// //               {displayUnit}
// //             </span>
// //           </div>
// //           <div style={{
// //             fontSize: "0.9em",
// //             color: theme === "dark" ? "#bbb" : "#888",
// //             marginTop: 2,
// //           }}>
// //             {min} {displayUnit} — {max} {displayUnit}
// //           </div>
// //           <div style={{
// //             fontSize: "0.85em",
// //             color: theme === "dark" ? "#a3c0fa" : "#669",
// //             marginTop: 2,
// //             letterSpacing: 0.5,
// //           }}>
// //             {Math.round(percent * 100)}%
// //           </div>
// //         </div>

// //         {/* Gauge Pie */}
// //         <ResponsiveContainer width="100%" height="100%">
// //           <PieChart>
// //             <Pie
// //               data={dataArr}
// //               cx="50%"
// //               cy="50%"
// //               startAngle={210}
// //               endAngle={-30}
// //               innerRadius="75%"
// //               outerRadius="95%"
// //               dataKey="value"
// //               stroke="none"
// //               isAnimationActive={true}
// //               animationDuration={800}
// //               cornerRadius={8}
// //             >
// //               <Cell fill={getColor()} />
// //               <Cell fill={theme === "dark" ? "#1a1a1a" : "#eee"} />
// //             </Pie>
// //           </PieChart>
// //         </ResponsiveContainer>
// //       </div>

// //       {/* Settings Modal for Unit Picker */}
// //       <Modal
// //         title={<span><SettingOutlined /> Gauge Settings</span>}
// //         open={settingsOpen}
// //         onOk={() => setSettingsOpen(false)}
// //         onCancel={() => setSettingsOpen(false)}
// //         okText="Close"
// //         cancelButtonProps={{ style: { display: "none" } }}
// //         bodyStyle={{ padding: 20, paddingTop: 12 }}
// //         style={{ top: 80 }}
// //       >
// //         <div style={{ marginBottom: 18 }}>
// //           <span style={{ fontWeight: 600, fontSize: 14, marginRight: 8 }}>
// //             <ClusterOutlined style={{ marginRight: 6, color: "#1677ff" }} />
// //             Select Unit
// //           </span>
// //           <Select
// //             value={selectedUnit}
// //             onChange={val => {
// //               setSelectedUnit(val)
// //               if (val !== "custom") setCustomUnit("")
// //             }}
// //             style={{ width: 180, marginLeft: 10 }}
// //             dropdownStyle={{ zIndex: 2000 }}
// //             optionLabelProp="label"
// //             optionRender={(option) => unitOptionRender(option.data)}
// //           >
// //             {UNIT_OPTIONS.map(opt => (
// //               <Select.Option key={opt.value} value={opt.value} label={opt.label}>
// //                 {unitOptionRender(opt)}
// //               </Select.Option>
// //             ))}
// //           </Select>
// //           {selectedUnit === "custom" && (
// //             <input
// //               type="text"
// //               value={customUnit}
// //               placeholder="Enter custom unit"
// //               onChange={e => setCustomUnit(e.target.value)}
// //               style={{
// //                 width: 110,
// //                 marginLeft: 10,
// //                 fontSize: 13,
// //                 padding: "2px 8px",
// //                 border: "1px solid #bbb",
// //                 borderRadius: 4,
// //               }}
// //             />
// //           )}
// //           <Tooltip title="Reset unit to default">
// //             <Button
// //               size="small"
// //               icon={<RedoOutlined />}
// //               style={{ marginLeft: 10 }}
// //               onClick={handleResetUnit}
// //             />
// //           </Tooltip>
// //         </div>
// //         {/* ...add more settings here as needed (thresholds, precision, etc.) */}
// //       </Modal>
// //     </Card>
// //   )
// // }

// // export default GaugeWidget

// // // "use client"

// // // import { useState } from "react"
// // // import { Card, Modal, Select, Button, Tooltip, Space } from "antd"
// // // import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
// // // import { SettingOutlined, RedoOutlined, ClusterOutlined } from "@ant-design/icons"

// // // const DEFAULT_THRESHOLDS = [0.3, 0.7]
// // // const DEFAULT_COLORS = ["#f5222d", "#faad14", "#52c41a"]
// // // const UNIT_OPTIONS = [
// // //   { value: "%", label: "Percentage (%)", icon: <ClusterOutlined /> },
// // //   { value: "°C", label: "Temperature (°C)", icon: <ClusterOutlined /> },
// // //   { value: "°F", label: "Temperature (°F)", icon: <ClusterOutlined /> },
// // //   { value: "V", label: "Voltage (V)", icon: <ClusterOutlined /> },
// // //   { value: "A", label: "Current (A)", icon: <ClusterOutlined /> },
// // //   { value: "Bar", label: "Pressure (Bar)", icon: <ClusterOutlined /> },
// // //   { value: "Pa", label: "Pressure (Pa)", icon: <ClusterOutlined /> },
// // //   { value: "L", label: "Level (L)", icon: <ClusterOutlined /> },
// // //   { value: "m/s", label: "Speed (m/s)", icon: <ClusterOutlined /> },
// // //   { value: "rpm", label: "Rotation (RPM)", icon: <ClusterOutlined /> },
// // //   { value: "custom", label: "Custom", icon: <SettingOutlined /> },
// // // ]

// // // const GaugeWidget = ({
// // //   title = "Radial Gauge",
// // //   value,
// // //   unit = "%",
// // //   min = 0,
// // //   max = 100,
// // //   precision = 1,
// // //   data = [],
// // //   dataKeys = ["value"],
// // //   theme = "light",
// // //   thresholds = DEFAULT_THRESHOLDS,
// // //   colors = ["#52c41a", "#faad14", "#f5222d"],
// // // }) => {
// // //   // --- Widget State ---
// // //   const [settingsOpen, setSettingsOpen] = useState(false)
// // //   const [selectedUnit, setSelectedUnit] = useState(unit)
// // //   const [customUnit, setCustomUnit] = useState("")

// // //   // Value logic
// // //   let gaugeValue = typeof value === "number" ? value : 0
// // //   if (data && data.length > 0 && dataKeys && dataKeys.length > 0) {
// // //     const latest = data[data.length - 1]
// // //     if (latest && typeof latest[dataKeys[0]] === "number") {
// // //       gaugeValue = latest[dataKeys[0]]
// // //     }
// // //   }
// // //   const safeValue = Math.max(min, Math.min(max, gaugeValue))
// // //   const range = Math.max(1, max - min)
// // //   const percent = (safeValue - min) / range

// // //   const dataArr = [
// // //     { name: "value", value: percent },
// // //     { name: "empty", value: 1 - percent },
// // //   ]

// // //   // Threshold coloring logic
// // //   const getColor = () => {
// // //     if (percent < (thresholds[0] ?? DEFAULT_THRESHOLDS[0])) return colors[0] || DEFAULT_COLORS[0]
// // //     if (percent < (thresholds[1] ?? DEFAULT_THRESHOLDS[1])) return colors[1] || DEFAULT_COLORS[1]
// // //     return colors[2] || DEFAULT_COLORS[2]
// // //   }

// // //   // Display logic for unit
// // //   const displayUnit =
// // //     selectedUnit === "custom" ? customUnit || "" : selectedUnit

// // //   // Reset to prop unit
// // //   const handleResetUnit = () => {
// // //     setSelectedUnit(unit)
// // //     setCustomUnit("")
// // //   }

// // //   // Render option with icon for unit select
// // //   const unitOptionRender = (option) => (
// // //     <span>
// // //       {option.icon} <span style={{ marginLeft: 8 }}>{option.label}</span>
// // //     </span>
// // //   )

// // //   return (
// // //     <Card
// // //       title={
// // //         <Space>
// // //           <span>{title}</span>
// // //           <Tooltip title="Gauge settings">
// // //             <Button
// // //               type="link"
// // //               icon={<SettingOutlined />}
// // //               size="small"
// // //               onClick={() => setSettingsOpen(true)}
// // //             />
// // //           </Tooltip>
// // //         </Space>
// // //       }
// // //       bordered={false}
// // //       style={{
// // //         height: "100%",
// // //         width: "100%",
// // //         background: "transparent",
// // //         boxShadow: "none",
// // //         margin: 0,
// // //         padding: 0,
// // //       }}
// // //       bodyStyle={{
// // //         height: "100%",
// // //         width: "100%",
// // //         padding: 0,
// // //         margin: 0,
// // //         background: "transparent",
// // //         overflow: "hidden",
// // //         display: "flex",
// // //         flexDirection: "column",
// // //       }}
// // //       className={theme === "dark" ? "widget-theme-dark" : ""}
// // //     >
// // //       <div
// // //         style={{
// // //           flex: 1,
// // //           height: "100%",
// // //           width: "100%",
// // //           position: "relative",
// // //           display: "flex",
// // //           alignItems: "center",
// // //           justifyContent: "center",
// // //           overflow: "hidden",
// // //           minHeight: 0,
// // //         }}
// // //       >
// // //         {/* Center value and unit */}
// // //         <div
// // //           style={{
// // //             position: "absolute",
// // //             top: "54%",
// // //             left: "50%",
// // //             transform: "translate(-50%, -50%)",
// // //             textAlign: "center",
// // //             zIndex: 1,
// // //             pointerEvents: "none",
// // //             width: "100%",
// // //             userSelect: "none",
// // //           }}
// // //         >
// // //           <div style={{ fontSize: "2.2em", fontWeight: 700, color: getColor(), lineHeight: 1 }}>
// // //             {safeValue.toFixed(precision)}
// // //             <span style={{
// // //               fontSize: "0.6em",
// // //               color: theme === "dark" ? "#bbb" : "#888",
// // //               marginLeft: 6,
// // //             }}>
// // //               {displayUnit}
// // //             </span>
// // //           </div>
// // //           <div style={{
// // //             fontSize: "0.9em",
// // //             color: theme === "dark" ? "#bbb" : "#888",
// // //             marginTop: 2,
// // //           }}>
// // //             {min} {displayUnit} — {max} {displayUnit}
// // //           </div>
// // //           <div style={{
// // //             fontSize: "0.85em",
// // //             color: theme === "dark" ? "#a3c0fa" : "#669",
// // //             marginTop: 2,
// // //             letterSpacing: 0.5,
// // //           }}>
// // //             {Math.round(percent * 100)}%
// // //           </div>
// // //         </div>

// // //         {/* Gauge Pie */}
// // //         <ResponsiveContainer width="100%" height="100%">
// // //           <PieChart>
// // //             <Pie
// // //               data={dataArr}
// // //               cx="50%"
// // //               cy="50%"
// // //               startAngle={210}
// // //               endAngle={-30}
// // //               innerRadius="75%"
// // //               outerRadius="95%"
// // //               dataKey="value"
// // //               stroke="none"
// // //               isAnimationActive={true}
// // //               animationDuration={800}
// // //               cornerRadius={8}
// // //             >
// // //               <Cell fill={getColor()} />
// // //               <Cell fill={theme === "dark" ? "#1a1a1a" : "#eee"} />
// // //             </Pie>
// // //           </PieChart>
// // //         </ResponsiveContainer>
// // //       </div>

// // //       {/* Settings Modal for Unit Picker */}
// // //       <Modal
// // //         title={<span><SettingOutlined /> Gauge Settings</span>}
// // //         open={settingsOpen}
// // //         onOk={() => setSettingsOpen(false)}
// // //         onCancel={() => setSettingsOpen(false)}
// // //         okText="Close"
// // //         cancelButtonProps={{ style: { display: "none" } }}
// // //         bodyStyle={{ padding: 20, paddingTop: 12 }}
// // //         style={{ top: 80 }}
// // //       >
// // //         <div style={{ marginBottom: 18 }}>
// // //           <span style={{ fontWeight: 600, fontSize: 14, marginRight: 8 }}>
// // //             <ClusterOutlined style={{ marginRight: 6, color: "#1677ff" }} />
// // //             Select Unit
// // //           </span>
// // //           <Select
// // //             value={selectedUnit}
// // //             onChange={val => {
// // //               setSelectedUnit(val)
// // //               if (val !== "custom") setCustomUnit("")
// // //             }}
// // //             style={{ width: 180, marginLeft: 10 }}
// // //             dropdownStyle={{ zIndex: 2000 }}
// // //             optionLabelProp="label"
// // //             optionRender={(option) => unitOptionRender(option.data)}
// // //           >
// // //             {UNIT_OPTIONS.map(opt => (
// // //               <Select.Option key={opt.value} value={opt.value} label={opt.label}>
// // //                 {unitOptionRender(opt)}
// // //               </Select.Option>
// // //             ))}
// // //           </Select>
// // //           {selectedUnit === "custom" && (
// // //             <input
// // //               type="text"
// // //               value={customUnit}
// // //               placeholder="Enter custom unit"
// // //               onChange={e => setCustomUnit(e.target.value)}
// // //               style={{
// // //                 width: 110,
// // //                 marginLeft: 10,
// // //                 fontSize: 13,
// // //                 padding: "2px 8px",
// // //                 border: "1px solid #bbb",
// // //                 borderRadius: 4,
// // //               }}
// // //             />
// // //           )}
// // //           <Tooltip title="Reset unit to default">
// // //             <Button
// // //               size="small"
// // //               icon={<RedoOutlined />}
// // //               style={{ marginLeft: 10 }}
// // //               onClick={handleResetUnit}
// // //             />
// // //           </Tooltip>
// // //         </div>
// // //         {/* ...add more settings here as needed (thresholds, precision, etc.) */}
// // //       </Modal>
// // //     </Card>
// // //   )
// // // }

// // // export default GaugeWidget


// // // // import { Card } from "antd"
// // // // import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

// // // // const DEFAULT_THRESHOLDS = [0.3, 0.7]
// // // // const DEFAULT_COLORS = ["#52c41a", "#faad14", "#f5222d"]

// // // // const GaugeWidget = ({
// // // //   title = "Gauge",
// // // //   value,
// // // //   unit = "",
// // // //   min = 0,
// // // //   max = 100,
// // // //   precision = 1,
// // // //   data = [],
// // // //   dataKeys = ["value"],
// // // //   theme = "light",
// // // //   thresholds = DEFAULT_THRESHOLDS,
// // // //   colors = DEFAULT_COLORS,
// // // // }) => {
// // // //   let gaugeValue = typeof value === "number" ? value : 0
// // // //   if (data && data.length > 0 && dataKeys && dataKeys.length > 0) {
// // // //     const latest = data[data.length - 1]
// // // //     if (latest && typeof latest[dataKeys[0]] === "number") {
// // // //       gaugeValue = latest[dataKeys[0]]
// // // //     }
// // // //   }
// // // //   const safeValue = Math.max(min, Math.min(max, gaugeValue))
// // // //   const range = Math.max(1, max - min)
// // // //   const percent = (safeValue - min) / range

// // // //   const dataArr = [
// // // //     { name: "value", value: percent },
// // // //     { name: "empty", value: 1 - percent },
// // // //   ]

// // // //   const getColor = () => {
// // // //     if (percent < (thresholds[0] ?? DEFAULT_THRESHOLDS[0])) return colors[0] || DEFAULT_COLORS[0]
// // // //     if (percent < (thresholds[1] ?? DEFAULT_THRESHOLDS[1])) return colors[1] || DEFAULT_COLORS[1]
// // // //     return colors[2] || DEFAULT_COLORS[2]
// // // //   }

// // // //   return (
// // // //     <Card
// // // //       title={title}
// // // //       bordered={false}
// // // //       style={{
// // // //         height: "100%",
// // // //         width: "100%",
// // // //         background: "transparent",
// // // //         margin: 0,
// // // //         padding: 0,
// // // //         boxShadow: "none"
// // // //       }}
// // // //       bodyStyle={{
// // // //         height: "100%",
// // // //         width: "100%",
// // // //         padding: 0,
// // // //         margin: 0,
// // // //         background: "transparent",
// // // //         overflow: "hidden",
// // // //         display: "flex",
// // // //         flexDirection: "column"
// // // //       }}
// // // //       className={theme === "dark" ? "widget-theme-dark" : ""}
// // // //     >
// // // //       <div
// // // //         style={{
// // // //           flex: 1,
// // // //           height: "100%",
// // // //           width: "100%",
// // // //           position: "relative",
// // // //           display: "flex",
// // // //           alignItems: "center",
// // // //           justifyContent: "center",
// // // //           overflow: "hidden",
// // // //           minHeight: 0,
// // // //         }}
// // // //       >
// // // //         <div
// // // //           style={{
// // // //             position: "absolute",
// // // //             top: "54%",
// // // //             left: "50%",
// // // //             transform: "translate(-50%, -50%)",
// // // //             textAlign: "center",
// // // //             zIndex: 1,
// // // //             pointerEvents: "none",
// // // //             width: "100%",
// // // //           }}
// // // //         >
// // // //           <div style={{ fontSize: "2em", fontWeight: 600, lineHeight: 1 }}>
// // // //             {safeValue.toFixed(precision)}
// // // //             <span style={{ fontSize: "0.6em", color: "#888" }}>
// // // //               {unit ? ` ${unit}` : ""}
// // // //             </span>
// // // //           </div>
// // // //           <div style={{ fontSize: "0.85em", color: "#999" }}>
// // // //             {Math.round(percent * 100)}%
// // // //           </div>
// // // //         </div>
// // // //         <ResponsiveContainer width="100%" height="100%">
// // // //           <PieChart>
// // // //             <Pie
// // // //               data={dataArr}
// // // //               cx="50%"
// // // //               cy="50%"
// // // //               startAngle={180}
// // // //               endAngle={0}
// // // //               innerRadius="75%"
// // // //               outerRadius="95%"
// // // //               dataKey="value"
// // // //               stroke="none"
// // // //               isAnimationActive={true}          // <-- ENABLE ANIMATION
// // // //               animationDuration={800}           // <-- SMOOTH SPEED (optional)
// // // //               cornerRadius={5}
// // // //             >
// // // //               <Cell fill={getColor()} />
// // // //               <Cell fill={theme === "dark" ? "#222" : "#eee"} />
// // // //             </Pie>
// // // //           </PieChart>
// // // //         </ResponsiveContainer>
// // // //       </div>
// // // //     </Card>
// // // //   )
// // // // }

// // // // export default GaugeWidget




// // // // // // import { Card, Typography } from "antd"
// // // // // // import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

// // // // // // const { Title } = Typography

// // // // // // const GaugeWidget = ({
// // // // // //   title = "Gauge",
// // // // // //   value,
// // // // // //   unit = "",
// // // // // //   min = 0,
// // // // // //   max = 100,
// // // // // //   precision = 1,
// // // // // //   data = [],
// // // // // //   dataKeys = ["value"],
// // // // // //   theme = "light"
// // // // // // }) => {
// // // // // //   // Extract the latest value from data if present
// // // // // //   let gaugeValue = typeof value === "number" ? value : 0
// // // // // //   if (data && data.length > 0 && dataKeys && dataKeys.length > 0) {
// // // // // //     const latest = data[data.length - 1]
// // // // // //     if (latest && typeof latest[dataKeys[0]] === "number") {
// // // // // //       gaugeValue = latest[dataKeys[0]]
// // // // // //     }
// // // // // //   }

// // // // // //   // Clamp value to [min, max]
// // // // // //   const safeValue = Math.max(min, Math.min(max, gaugeValue))
// // // // // //   const range = Math.max(1, max - min)
// // // // // //   const percent = (safeValue - min) / range

// // // // // //   const dataArr = [
// // // // // //     { name: "value", value: percent },
// // // // // //     { name: "empty", value: 1 - percent },
// // // // // //   ]

// // // // // //   // Color based on percentage
// // // // // //   const getColor = () => {
// // // // // //     if (percent < 0.3) return "#f5222d"
// // // // // //     if (percent < 0.7) return "#faad14"
// // // // // //     return "#52c41a"
// // // // // //   }

// // // // // //   return (
// // // // // //     <Card
// // // // // //       title={title}
// // // // // //       bordered={true}
// // // // // //       style={{ height: "100%" }}
// // // // // //       className={theme === "dark" ? "widget-theme-dark" : ""}
// // // // // //     >
// // // // // //       <div style={{ width: "100%", height: 200, position: "relative" }}>
// // // // // //         <div
// // // // // //           style={{
// // // // // //             position: "absolute",
// // // // // //             top: "58%",
// // // // // //             left: "50%",
// // // // // //             transform: "translate(-50%, -50%)",
// // // // // //             textAlign: "center",
// // // // // //             zIndex: 1,
// // // // // //           }}
// // // // // //         >
// // // // // //           <div style={{ fontSize: "30px", fontWeight: "bold" }}>
// // // // // //             {safeValue.toFixed(precision)}
// // // // // //             <span style={{ fontSize: 18, color: "#888" }}>
// // // // // //               {unit ? ` ${unit}` : ""}
// // // // // //             </span>
// // // // // //           </div>
// // // // // //           <div style={{ fontSize: 14, color: "#999" }}>
// // // // // //             {Math.round(percent * 100)}%
// // // // // //           </div>
// // // // // //         </div>
// // // // // //         <ResponsiveContainer>
// // // // // //           <PieChart>
// // // // // //             <Pie
// // // // // //               data={dataArr}
// // // // // //               cx="50%"
// // // // // //               cy="50%"
// // // // // //               startAngle={180}
// // // // // //               endAngle={0}
// // // // // //               innerRadius={70}
// // // // // //               outerRadius={90}
// // // // // //               dataKey="value"
// // // // // //               stroke="none"
// // // // // //             >
// // // // // //               <Cell fill={getColor()} />
// // // // // //               <Cell fill={theme === "dark" ? "#333" : "#f0f0f0"} />
// // // // // //             </Pie>
// // // // // //           </PieChart>
// // // // // //         </ResponsiveContainer>
// // // // // //       </div>
// // // // // //     </Card>
// // // // // //   )
// // // // // // }

// // // // // // export default GaugeWidget

// // // // // // // import { Card, Typography } from "antd"
// // // // // // // import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

// // // // // // // const { Title } = Typography

// // // // // // // const GaugeWidget = ({ title = "Gauge", value = 75, min = 0, max = 100 }) => {
// // // // // // //   // Calculate percentage
// // // // // // //   const percent = value / max
// // // // // // //   const data = [
// // // // // // //     { name: "value", value: percent },
// // // // // // //     { name: "empty", value: 1 - percent },
// // // // // // //   ]

// // // // // // //   // Determine color based on value
// // // // // // //   const getColor = () => {
// // // // // // //     if (percent < 0.3) return "#f5222d"
// // // // // // //     if (percent < 0.7) return "#faad14"
// // // // // // //     return "#52c41a"
// // // // // // //   }

// // // // // // //   return (
// // // // // // //     <Card title={title} bordered={true} style={{ height: "100%" }}>
// // // // // // //       <div style={{ width: "100%", height: 300, position: "relative" }}>
// // // // // // //         <div
// // // // // // //           style={{
// // // // // // //             position: "absolute",
// // // // // // //             top: "50%",
// // // // // // //             left: "50%",
// // // // // // //             transform: "translate(-50%, -50%)",
// // // // // // //             textAlign: "center",
// // // // // // //             zIndex: 1,
// // // // // // //           }}
// // // // // // //         >
// // // // // // //           <div style={{ fontSize: "24px", fontWeight: "bold" }}>{value}</div>
// // // // // // //         </div>
// // // // // // //         <ResponsiveContainer>
// // // // // // //           <PieChart>
// // // // // // //             <Pie
// // // // // // //               data={data}
// // // // // // //               cx="50%"
// // // // // // //               cy="50%"
// // // // // // //               startAngle={180}
// // // // // // //               endAngle={0}
// // // // // // //               innerRadius={60}
// // // // // // //               outerRadius={80}
// // // // // // //               paddingAngle={0}
// // // // // // //               dataKey="value"
// // // // // // //             >
// // // // // // //               <Cell fill={getColor()} />
// // // // // // //               <Cell fill="#f0f0f0" />
// // // // // // //             </Pie>
// // // // // // //           </PieChart>
// // // // // // //         </ResponsiveContainer>
// // // // // // //       </div>
// // // // // // //     </Card>
// // // // // // //   )
// // // // // // // }

// // // // // // // export default GaugeWidget
