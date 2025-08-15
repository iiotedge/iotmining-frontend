"use client"

import React, { useMemo, useEffect } from "react"
import { Empty, Spin } from "antd"
import { useWidgetLiveData } from "../../hooks/useWidgetLiveData"
import { useMqttCommand } from "../../hooks/useMqttCommand"

import ValueCardWidget from "./widgets/ValueCardWidget"
import StatusCardWidget from "./widgets/StatusCardWidget"
import AlarmTableWidget from "./widgets/AlarmTableWidget"
import AlarmCountWidget from "./widgets/AlarmCountWidget"
import ButtonWidget from "./widgets/ButtonWidget"
import SignalStrengthWidget from "./widgets/SignalStrengthWidget"
import SwitchControlWidget from "./widgets/SwitchControlWidget"
import ProgressBarWidget from "./widgets/ProgressBarWidget"
import BatteryLevelWidget from "./widgets/BatteryLevelWidget"
import LineChartWidget from "./widgets/LineChartWidget"
import BarChartWidget from "./widgets/BarChartWidget"
import PieChartWidget from "./widgets/PieChartWidget"
import DoughnutChartWidget from "./widgets/DoughnutChartWidget"
import TimeSeriesChartWidget from "./widgets/TimeSeriesChartWidget"
import GaugeWidget from "./widgets/GaugeWidget"
import MapWidget from "./widgets/MapWidget"
import OSMMapWidget from "./widgets/OSMMapWidget"
import CameraWidget from "./widgets/CameraWidget"
import CameraGridWidget from "./widgets/CameraGridWidget"
import SliderControlWidget from "./widgets/SliderWidget"
import FanControlWidget from "./widgets/FanControlWidget"
import FanGridWidget from "./widgets/FanGridWidget"
import SingleFanWidget from "./widgets/SingleFanWidget"
import ImageCardWidget from "./widgets/ImageCardWidget"
import DoorStatusCardWidget from "./widgets/DoorStatusCardWidget"
import WaterLoggingDetectedWidget from "./widgets/WaterLoggingDetectedWidget"
import FireDetectionWidget from "./widgets/FireDetectionWidget"
import AlertSystemCardWidget from "./widgets/AlertSystemCardWidget"
import DynamicJsonFormWidget from "./widgets/DynamicJsonFormWidget"
import DeviceCommandControlWidget from "./widgets/DeviceCommandControlWidget"
import JsonRawTableWidget from "./widgets/JsonRawTableWidget"
import ValueStepperWidget from "./widgets/control/ValueStepperWidget"
import SwitchControlWidgetNew from "./widgets/control/SwitchControlWidget"
import LedIndicatorWidget from "./widgets/control/LedIndicatorWidget"

const CHART_WIDGETS = [
  "line-chart", "bar-chart", "time-series-chart", "value-card"
]

function safeTelemetryKeys(ds) {
  if (!ds) return []
  if (Array.isArray(ds.telemetry)) return ds.telemetry.filter(Boolean)
  if (typeof ds.telemetry === "string") return ds.telemetry ? [ds.telemetry] : []
  return []
}

const WidgetRenderer = ({ widget, config, ...props }) => {
  useEffect(() => {
    console.log("[WidgetRenderer] Render:", widget?.type, "Widget ID:", widget?.id, "Config:", config)
  }, [widget, config])

  const dataSource = config?.dataSource ?? {}
  const telemetryKeys = safeTelemetryKeys(dataSource)

  const NO_TELEMETRY_REQUIRED = [
    "camera", "camera-feed", "camera-grid", "map", "gauge", "radial-gauge"
  ]
  const NO_DATA_REQUIRED = [
    "camera", "camera-feed", "camera-grid", "map"
  ]

  const bufferSize = CHART_WIDGETS.includes(widget?.type) ? 50 : 1

  const liveData = useWidgetLiveData(widget, { ...config, bufferSize })

  const dataSourceType = dataSource?.type || "static"

  // Always call useMemo unconditionally here
  const { data, dataKeys } = useMemo(() => {
    // If isJsonObject is true and widget supports full JSON mode, pass full jsonObjectValue
    if (dataSource?.isJsonObject && dataSource?.jsonObjectValue) {
      return {
        data: dataSource.jsonObjectValue,
        dataKeys: [], // no telemetry keys for full JSON mode
      }
    }

    // Otherwise, use telemetry/live data mode
    const isLiveDataSource = (
      dataSourceType === "mqtt" ||
      dataSourceType === "coap" ||
      dataSourceType === "http" ||
      dataSourceType === "device"
    )

    let resolvedData = null
    if (isLiveDataSource) {
      if (widget?.type === "fan-control" && liveData && typeof liveData.fans === "object") {
        resolvedData = liveData.fans
      } else {
        resolvedData = liveData
      }
    } else {
      resolvedData = config?.data || (widget?.type === "fan-control" ? {} : [])
    }

    return {
      data: resolvedData,
      dataKeys: telemetryKeys,
    }
  }, [dataSource, dataSourceType, telemetryKeys, liveData, config?.data, widget?.type])

  const commonProps = {
    ...config,
    data,
    dataKeys,
    theme: config?.theme || "light",
  }

  const { sendCommand: sliderSendCommand, fanSendCommand, commandControlSendCommand, isSending: sliderIsSending , connected: mqttConnected, } =
    useMqttCommand(config.dataSource || config)

  let streamUrl =
    config?.streamUrl ||
    dataSource?.streamUrl ||
    (Array.isArray(telemetryKeys) && telemetryKeys.length > 0 ? telemetryKeys[0] : "") ||
    ""
  if (typeof streamUrl !== "string") streamUrl = ""

  const cameraConfig = {
    ...commonProps,
    streamUrl,
    telemetry: telemetryKeys,
  }

  if (
    !dataSource?.isJsonObject &&
    (!telemetryKeys || telemetryKeys.length === 0) &&
    !NO_TELEMETRY_REQUIRED.includes(widget?.type)
  ) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        No telemetry keys selected.
      </div>
    )
  }

  if (
    (!data || (Array.isArray(data) ? data.length === 0 : Object.keys(data).length === 0)) &&
    !NO_DATA_REQUIRED.includes(widget?.type)
  ) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin tip="Waiting for data..." />
      </div>
    )
  }
  console.log("------------------------->")
  // console.log(liveData)
  console.log("[WidgetRenderer] config.fans:", widget.config)


  try {
    switch (widget?.type) {
      case "dynamic-form-control": return <DynamicJsonFormWidget {...commonProps} />
      case "device-command-control": 
            return <DeviceCommandControlWidget 
                      {...commonProps}  
                      sendMqttCommand={sliderSendCommand}  
                      mqttConnected={mqttConnected}
                      isMqttSending={sliderIsSending}
      />
      case "value-card": return <ValueCardWidget {...commonProps} />
      case "status-card": return <StatusCardWidget {...commonProps} />
      case "alert-system-card": return <AlertSystemCardWidget {...commonProps}  data={liveData}/>
      case "alarm-table": return <AlarmTableWidget {...commonProps} />
      case "alarm-count": return <AlarmCountWidget {...commonProps} />
      case "button-control": return <ButtonWidget {...commonProps} />
      case "single-fan-control": return <SingleFanWidget {...commonProps} />
      case "fan-control":
        return (
          <FanControlWidget
            {...commonProps}
            fans={config.fans || []}
            data={liveData}
            sendMqttCommand={fanSendCommand}
          />
        )
      case "fan-grid-control": return <FanGridWidget {...commonProps} />
      case "signal-strength": return <SignalStrengthWidget {...commonProps} />
      case "slider-control":
        return (
          <SliderControlWidget
            {...commonProps}
            sendMqttCommand={sliderSendCommand}
            isMqttSending={sliderIsSending}
            telemetryOut={dataSource.telemetryOut || []}
          />
        )
      case "led-indicator": return <LedIndicatorWidget {...commonProps} />
      case "switch-control": return <SwitchControlWidget {...commonProps} />
      case "switch-control-widget": return <SwitchControlWidgetNew {...commonProps} />
      case "progress-bar": return <ProgressBarWidget {...commonProps} />
      case "battery-level": return <BatteryLevelWidget {...commonProps} />
      case "line-chart": return <LineChartWidget {...commonProps} />
      case "bar-chart": return <BarChartWidget {...commonProps} />
      case "pie-chart": return <PieChartWidget {...commonProps} />
      case "doughnut-chart": return <DoughnutChartWidget {...commonProps} />
      case "time-series-chart": return <TimeSeriesChartWidget {...commonProps} />
      case "json-table":
        return <JsonRawTableWidget {...commonProps} data={liveData} darkMode={config?.theme === "dark"} />
      case "radial-gauge":
      // case "gauge": return <GaugeWidget {...commonProps} />
      case "gauge":
        return (
          <GaugeWidget
            {...commonProps}
            onSettingsSave={(settings) => {
              // Pass new settings to parent
              // Update config object but preserve dataSource, etc.
              props.onConfigChange?.(
                widget.id,
                { ...config, ...settings }
              )
            }}
          />)
      case "google-map":
      case "map": return <MapWidget {...commonProps} />
      case "openstreet-map": return <OSMMapWidget theme="dark" {...commonProps} />
      case "door-lock": return <DoorStatusCardWidget {...commonProps} data={liveData} />
      case "camera":
      case "camera-feed":
        return (
          <CameraWidget
            config={cameraConfig}
            onConfigChange={newConfig => {
              props.onConfigChange?.(widget?.id, newConfig)
            }}
            {...props}
          />
        )
      case "camera-grid": return <CameraGridWidget {...commonProps} />
      case "image-card":
        return <ImageCardWidget {...commonProps} config={config} liveData={liveData} />
      case "value-stepper": return <ValueStepperWidget {...commonProps} />
      case "water-logging": return <WaterLoggingDetectedWidget {...commonProps} />
      case "fire-detection": return <FireDetectionWidget {...commonProps} />
      default:
        return (
          <Empty
            description={`Unknown widget type: ${widget?.type}`}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )
    }
  } catch (err) {
    console.error("[WidgetRenderer] Exception while rendering widget:", err)
    return (
      <Empty
        description={`Error rendering widget: ${widget?.type || "Unknown"}`}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    )
  }
}

export default WidgetRenderer



// "use client"

// import React, { useMemo, useEffect } from "react"
// import { Empty, Spin } from "antd"
// import { useWidgetLiveData } from "../../hooks/useWidgetLiveData"
// import { useMqttCommand } from "../../hooks/useMqttCommand"

// import ValueCardWidget from "./widgets/ValueCardWidget"
// import StatusCardWidget from "./widgets/StatusCardWidget"
// import AlarmTableWidget from "./widgets/AlarmTableWidget"
// import AlarmCountWidget from "./widgets/AlarmCountWidget"
// import ButtonWidget from "./widgets/ButtonWidget"
// import SignalStrengthWidget from "./widgets/SignalStrengthWidget"
// import SwitchControlWidget from "./widgets/SwitchControlWidget"
// import ProgressBarWidget from "./widgets/ProgressBarWidget"
// import BatteryLevelWidget from "./widgets/BatteryLevelWidget"
// import LineChartWidget from "./widgets/LineChartWidget"
// import BarChartWidget from "./widgets/BarChartWidget"
// import PieChartWidget from "./widgets/PieChartWidget"
// import DoughnutChartWidget from "./widgets/DoughnutChartWidget"
// import TimeSeriesChartWidget from "./widgets/TimeSeriesChartWidget"
// import GaugeWidget from "./widgets/GaugeWidget"
// import MapWidget from "./widgets/MapWidget"
// import CameraWidget from "./widgets/CameraWidget"
// import CameraGridWidget from "./widgets/CameraGridWidget"
// import SliderControlWidget from "./widgets/SliderWidget"
// import FanControlWidget from "./widgets/FanControlWidget"
// import FanGridWidget from "./widgets/FanGridWidget"
// import SingleFanWidget from "./widgets/SingleFanWidget"

// const CHART_WIDGETS = [
//   "line-chart", "bar-chart", "time-series-chart", "value-card"
// ]

// function safeTelemetryKeys(ds) {
//   if (!ds) return []
//   if (Array.isArray(ds.telemetry)) return ds.telemetry.filter(Boolean)
//   if (typeof ds.telemetry === "string") return ds.telemetry ? [ds.telemetry] : []
//   return []
// }

// const WidgetRenderer = ({ widget, config, ...props }) => {
//   useEffect(() => {
//     console.log("[WidgetRenderer] Render:", widget?.type, "Widget ID:", widget?.id, "Config:", config)
//   }, [widget, config])

//   const dataSource = config?.dataSource ?? {}
//   const telemetryKeys = safeTelemetryKeys(dataSource)

//   const NO_TELEMETRY_REQUIRED = [
//     "camera", "camera-feed", "camera-grid", "map", "gauge", "radial-gauge"
//   ]
//   const NO_DATA_REQUIRED = [
//     "camera", "camera-feed", "camera-grid", "map"
//   ]

//   const bufferSize = CHART_WIDGETS.includes(widget?.type) ? 50 : 1

//   const liveData = useWidgetLiveData(widget, { ...config, bufferSize })

//   const dataSourceType = dataSource?.type || "static"

//   // // Determine data and dataKeys based on JSON object filter
//   // const { data, dataKeys } = useMemo(() => {
//   //   // If isJsonObject is true and widget supports full JSON mode, pass full jsonObjectValue
//   //   if (dataSource?.isJsonObject && dataSource?.jsonObjectValue) {
//   //     return {
//   //       data: dataSource.jsonObjectValue,
//   //       dataKeys: [], // no telemetry keys for full JSON mode
//   //     }
//   //   }
//   //   // Otherwise, use telemetry/live data mode
//   //   return {
//   //     data: (
//   //       dataSourceType === "mqtt" ||
//   //       dataSourceType === "coap" ||
//   //       dataSourceType === "http" ||
//   //       dataSourceType === "device"
//   //     )
//   //       ? (widget?.type === "fan-control" && liveData && typeof liveData.fans === "object"
//   //         ? liveData.fans
//   //         : liveData)
//   //       : (config?.data || (widget?.type === "fan-control" ? {} : [])),
//   //     dataKeys: telemetryKeys,
//   //   }
//   // }, [dataSource, dataSourceType, telemetryKeys, liveData, config?.data, widget?.type])
  
//   const { isJsonObject, jsonObjectValue, type: dsType } = dataSource || {}

//   const { data, dataKeys } = useMemo(() => {
    
//     if (isJsonObject && jsonObjectValue) {
//       // Return a shallow clone to ensure new object reference each time
//       return {
//         data: { ...jsonObjectValue },
//         dataKeys: [],
//       }
//     }
//     const isLiveDataSource = ["mqtt", "coap", "http", "device"].includes(dsType)

//     let resolvedData = isLiveDataSource
//       ? (widget?.type === "fan-control" && liveData && typeof liveData.fans === "object"
//         ? liveData.fans
//         : liveData)
//       : (config?.data || (widget?.type === "fan-control" ? {} : []))

//     // Clone to ensure new object reference if it’s an object (helps React detect change)
//     if (resolvedData && typeof resolvedData === "object") {
//       resolvedData = Array.isArray(resolvedData)
//         ? [...resolvedData]
//         : { ...resolvedData }
//     }

//     return {
//       data: resolvedData,
//       dataKeys: telemetryKeys,
//     }
//   }, [isJsonObject, jsonObjectValue, dsType, telemetryKeys, liveData, config?.data, widget?.type])


//   const commonProps = {
//     ...config,
//     data,
//     dataKeys,
//     theme: config?.theme || "light",
//   }

//   const { sendCommand: sliderSendCommand, fanSendCommand, isSending: sliderIsSending } =
//     useMqttCommand(config.dataSource || config)

//   let streamUrl =
//     config?.streamUrl ||
//     dataSource?.streamUrl ||
//     (Array.isArray(telemetryKeys) && telemetryKeys.length > 0 ? telemetryKeys[0] : "") ||
//     ""
//   if (typeof streamUrl !== "string") streamUrl = ""

//   const cameraConfig = {
//     ...commonProps,
//     streamUrl,
//     telemetry: telemetryKeys,
//   }

//   if (
//     !dataSource?.isJsonObject &&
//     (!telemetryKeys || telemetryKeys.length === 0) &&
//     !NO_TELEMETRY_REQUIRED.includes(widget?.type)
//   ) {
//     return (
//       <div style={{ padding: 24, textAlign: "center" }}>
//         No telemetry keys selected.
//       </div>
//     )
//   }

//   if (
//     (!data || (Array.isArray(data) ? data.length === 0 : Object.keys(data).length === 0)) &&
//     !NO_DATA_REQUIRED.includes(widget?.type)
//   ) {
//     return (
//       <div style={{ padding: 24, textAlign: "center" }}>
//         <Spin tip="Waiting for data..." />
//       </div>
//     )
//   }

//   // // Prepare fanData if fan-control widget: try fans_status if available
//   // const latestSample = Array.isArray(data) ? data[data.length - 1] : data
//   // const fanData = latestSample?.fans || latestSample?.fan || latestSample || {}
//   // console.log("------------------------------->"+data);
//   // console.log(fanData);
  

//   try {
//     switch (widget?.type) {
//       case "value-card": return <ValueCardWidget {...commonProps} />
//       case "status-card": return <StatusCardWidget {...commonProps} />
//       case "alarm-table": return <AlarmTableWidget {...commonProps} />
//       case "alarm-count": return <AlarmCountWidget {...commonProps} />
//       case "button-control": return <ButtonWidget {...commonProps} />
//       case "single-fan-control": return <SingleFanWidget {...commonProps} />
//       case "fan-control":
//         return (
//           <FanControlWidget
//             {...commonProps}
//             fans={config.fans || []}
//             data={data}
//             sendMqttCommand={fanSendCommand}
//           />
//         )
//       case "fan-grid-control": return <FanGridWidget {...commonProps} />
//       case "signal-strength": return <SignalStrengthWidget {...commonProps} />
//       case "slider-control":
//         return (
//           <SliderControlWidget
//             {...commonProps}
//             sendMqttCommand={sliderSendCommand}
//             isMqttSending={sliderIsSending}
//             telemetryOut={dataSource.telemetryOut || []}
//           />
//         )
//       case "switch-control": return <SwitchControlWidget {...commonProps} />
//       case "progress-bar": return <ProgressBarWidget {...commonProps} />
//       case "battery-level": return <BatteryLevelWidget {...commonProps} />
//       case "line-chart": return <LineChartWidget {...commonProps} />
//       case "bar-chart": return <BarChartWidget {...commonProps} />
//       case "pie-chart": return <PieChartWidget {...commonProps} />
//       case "doughnut-chart": return <DoughnutChartWidget {...commonProps} />
//       case "time-series-chart": return <TimeSeriesChartWidget {...commonProps} />
//       case "radial-gauge":
//       case "gauge": return <GaugeWidget {...commonProps} />
//       case "google-map":
//       case "map": return <MapWidget {...commonProps} />
//       case "camera":
//       case "camera-feed":
//         return (
//           <CameraWidget
//             config={cameraConfig}
//             onConfigChange={newConfig => {
//               props.onConfigChange?.(widget?.id, newConfig)
//             }}
//             {...props}
//           />
//         )
//       case "camera-grid": return <CameraGridWidget {...commonProps} />
//       default:
//         return (
//           <Empty
//             description={`Unknown widget type: ${widget?.type}`}
//             image={Empty.PRESENTED_IMAGE_SIMPLE}
//           />
//         )
//     }
//   } catch (err) {
//     console.error("[WidgetRenderer] Exception while rendering widget:", err)
//     return (
//       <Empty
//         description={`Error rendering widget: ${widget?.type || "Unknown"}`}
//         image={Empty.PRESENTED_IMAGE_SIMPLE}
//       />
//     )
//   }
// }

// export default WidgetRenderer

// "use client"

// import React, { useMemo, useEffect } from "react"
// import { Empty, Spin } from "antd"
// import { useWidgetLiveData } from "../../hooks/useWidgetLiveData"
// import { useMqttCommand } from "../../hooks/useMqttCommand"

// import ValueCardWidget from "./widgets/ValueCardWidget"
// import StatusCardWidget from "./widgets/StatusCardWidget"
// import AlarmTableWidget from "./widgets/AlarmTableWidget"
// import AlarmCountWidget from "./widgets/AlarmCountWidget"
// import ButtonWidget from "./widgets/ButtonWidget"
// import SignalStrengthWidget from "./widgets/SignalStrengthWidget"
// import SwitchControlWidget from "./widgets/SwitchControlWidget"
// import ProgressBarWidget from "./widgets/ProgressBarWidget"
// import BatteryLevelWidget from "./widgets/BatteryLevelWidget"
// import LineChartWidget from "./widgets/LineChartWidget"
// import BarChartWidget from "./widgets/BarChartWidget"
// import PieChartWidget from "./widgets/PieChartWidget"
// import DoughnutChartWidget from "./widgets/DoughnutChartWidget"
// import TimeSeriesChartWidget from "./widgets/TimeSeriesChartWidget"
// import GaugeWidget from "./widgets/GaugeWidget"
// import MapWidget from "./widgets/MapWidget"
// import CameraWidget from "./widgets/CameraWidget"
// import CameraGridWidget from "./widgets/CameraGridWidget"
// import SliderControlWidget from "./widgets/SliderWidget"
// import FanControlWidget from "./widgets/FanControlWidget"
// import FanGridWidget from "./widgets/FanGridWidget"
// import SingleFanWidget from "./widgets/SingleFanWidget"

// const CHART_WIDGETS = [
//   "line-chart", "bar-chart", "time-series-chart", "value-card"
// ]

// function safeTelemetryKeys(ds) {
//   if (!ds) return []
//   if (Array.isArray(ds.telemetry)) return ds.telemetry.filter(Boolean)
//   if (typeof ds.telemetry === "string") return ds.telemetry ? [ds.telemetry] : []
//   return []
// }

// const WidgetRenderer = ({ widget, config, ...props }) => {
//   useEffect(() => {
//     console.log("[WidgetRenderer] Render:", widget?.type, "Widget ID:", widget?.id, "Config:", config)
//   }, [widget, config])

//   const dataSource = config?.dataSource ?? {}
//   const telemetryKeys = safeTelemetryKeys(dataSource)

//   const NO_TELEMETRY_REQUIRED = [
//     "camera", "camera-feed", "camera-grid", "map", "gauge", "radial-gauge"
//   ]
//   const NO_DATA_REQUIRED = [
//     "camera", "camera-feed", "camera-grid", "map"
//   ]

//   const bufferSize = CHART_WIDGETS.includes(widget?.type) ? 50 : 1

//   const liveData = useWidgetLiveData(widget, { ...config, bufferSize })

//   // ----------- FIX: Hooks must be unconditionally called -----------
//   const dataSourceType = dataSource?.type || "static"
//   const memoData = useMemo(() => {
//     if (
//       dataSourceType === "mqtt" ||
//       dataSourceType === "coap" ||
//       dataSourceType === "http" ||
//       dataSourceType === "device"
//     ) {
//       if (widget?.type === "fan-control" && liveData && typeof liveData.fans === "object") {
//         return liveData.fans
//       }
//       return liveData
//     }
//     return config?.data || (widget?.type === "fan-control" ? {} : [])
//   }, [dataSourceType, liveData, config?.data, widget?.type])

//   // Conditional data assignment based on mode (object vs telemetry)
//   let data, dataKeys
//   if (dataSource?.isJsonObject) {
//     data = dataSource?.jsonObject || {}
//     dataKeys = []
//   } else {
//     data = memoData
//     dataKeys = telemetryKeys
//   }
//   // ---------------------------------------------------------------

//   const commonProps = {
//     ...config,
//     data,
//     dataKeys,
//     theme: config?.theme || "light"
//   }

//   const { sendCommand: sliderSendCommand, fanSendCommand, isSending: sliderIsSending } =
//     useMqttCommand(config.dataSource || config)

//   let streamUrl =
//     config?.streamUrl ||
//     dataSource?.streamUrl ||
//     (Array.isArray(telemetryKeys) && telemetryKeys.length > 0 ? telemetryKeys[0] : "") ||
//     ""
//   if (typeof streamUrl !== "string") streamUrl = ""

//   const cameraConfig = {
//     ...commonProps,
//     streamUrl,
//     telemetry: telemetryKeys,
//   }

//   // For Telemetry mode: require telemetry keys; for Object mode: always proceed
//   if (
//     !dataSource?.isJsonObject &&
//     (!telemetryKeys || telemetryKeys.length === 0) &&
//     !NO_TELEMETRY_REQUIRED.includes(widget?.type)
//   ) {
//     return (
//       <div style={{ padding: 24, textAlign: "center" }}>
//         No telemetry keys selected.
//       </div>
//     )
//   }

//   if (
//     (!data || (Array.isArray(data) ? data.length === 0 : Object.keys(data).length === 0)) &&
//     !NO_DATA_REQUIRED.includes(widget?.type)
//   ) {
//     return (
//       <div style={{ padding: 24, textAlign: "center" }}>
//         <Spin tip="Waiting for data..." />
//       </div>
//     )
//   }
//   const latestSample = Array.isArray(data) ? data[data.length - 1] : data
//   const fanData = latestSample?.fan_status || {}

//   try {
//     switch (widget?.type) {
//       case "value-card": return <ValueCardWidget {...commonProps} />
//       case "status-card": return <StatusCardWidget {...commonProps} />
//       case "alarm-table": return <AlarmTableWidget {...commonProps} />
//       case "alarm-count": return <AlarmCountWidget {...commonProps} />
//       case "button-control": return <ButtonWidget {...commonProps} />
//       case "single-fan-control": return <SingleFanWidget {...commonProps} />
//       case "fan-control": 
//         return (
//           <FanControlWidget
//             {...commonProps}
//             fans={config.fans || []}
//             data={fanData}
//             sendMqttCommand={fanSendCommand}
//           />
//         )
//       case "fan-grid-control": return <FanGridWidget {...commonProps} />
//       case "signal-strength": return <SignalStrengthWidget {...commonProps} />
//       case "slider-control":
//         return (
//           <SliderControlWidget
//             {...commonProps}
//             sendMqttCommand={sliderSendCommand}
//             isMqttSending={sliderIsSending}
//             telemetryOut={dataSource.telemetryOut || []}
//           />
//         )
//       case "switch-control": return <SwitchControlWidget {...commonProps} />
//       case "progress-bar": return <ProgressBarWidget {...commonProps} />
//       case "battery-level": return <BatteryLevelWidget {...commonProps} />
//       case "line-chart": return <LineChartWidget {...commonProps} />
//       case "bar-chart": return <BarChartWidget {...commonProps} />
//       case "pie-chart": return <PieChartWidget {...commonProps} />
//       case "doughnut-chart": return <DoughnutChartWidget {...commonProps} />
//       case "time-series-chart": return <TimeSeriesChartWidget {...commonProps} />
//       case "radial-gauge":
//       case "gauge": return <GaugeWidget {...commonProps} />
//       case "google-map":
//       case "map": return <MapWidget {...commonProps} />
//       case "camera":
//       case "camera-feed":
//         return (
//           <CameraWidget
//             config={cameraConfig}
//             onConfigChange={newConfig => {
//               props.onConfigChange?.(widget?.id, newConfig)
//             }}
//             {...props}
//           />
//         )
//       case "camera-grid": return <CameraGridWidget {...commonProps} />
//       default:
//         return (
//           <Empty
//             description={`Unknown widget type: ${widget?.type}`}
//             image={Empty.PRESENTED_IMAGE_SIMPLE}
//           />
//         )
//     }
//   } catch (err) {
//     console.error("[WidgetRenderer] Exception while rendering widget:", err)
//     return (
//       <Empty
//         description={`Error rendering widget: ${widget?.type || "Unknown"}`}
//         image={Empty.PRESENTED_IMAGE_SIMPLE}
//       />
//     )
//   }
// }

// export default WidgetRenderer

// // "use client"

// // import React, { useMemo, useEffect } from "react"
// // import { Empty, Spin } from "antd"
// // import { useWidgetLiveData } from "../../hooks/useWidgetLiveData"
// // import { useMqttCommand } from "../../hooks/useMqttCommand"

// // import ValueCardWidget from "./widgets/ValueCardWidget"
// // import StatusCardWidget from "./widgets/StatusCardWidget"
// // import AlarmTableWidget from "./widgets/AlarmTableWidget"
// // import AlarmCountWidget from "./widgets/AlarmCountWidget"
// // import ButtonWidget from "./widgets/ButtonWidget"
// // import SignalStrengthWidget from "./widgets/SignalStrengthWidget"
// // import SwitchControlWidget from "./widgets/SwitchControlWidget"
// // import ProgressBarWidget from "./widgets/ProgressBarWidget"
// // import BatteryLevelWidget from "./widgets/BatteryLevelWidget"
// // import LineChartWidget from "./widgets/LineChartWidget"
// // import BarChartWidget from "./widgets/BarChartWidget"
// // import PieChartWidget from "./widgets/PieChartWidget"
// // import DoughnutChartWidget from "./widgets/DoughnutChartWidget"
// // import TimeSeriesChartWidget from "./widgets/TimeSeriesChartWidget"
// // import GaugeWidget from "./widgets/GaugeWidget"
// // import MapWidget from "./widgets/MapWidget"
// // import CameraWidget from "./widgets/CameraWidget"
// // import CameraGridWidget from "./widgets/CameraGridWidget"
// // import SliderControlWidget from "./widgets/SliderWidget"
// // import FanControlWidget from "./widgets/FanControlWidget"
// // import FanGridWidget from "./widgets/FanGridWidget"
// // import SingleFanWidget from "./widgets/SingleFanWidget"

// // const CHART_WIDGETS = [
// //   "line-chart", "bar-chart", "time-series-chart", "value-card"
// // ]

// // function safeTelemetryKeys(ds) {
// //   if (!ds) return []
// //   if (Array.isArray(ds.telemetry)) return ds.telemetry.filter(Boolean)
// //   if (typeof ds.telemetry === "string") return ds.telemetry ? [ds.telemetry] : []
// //   return []
// // }

// // const WidgetRenderer = ({ widget, config, ...props }) => {
// //   useEffect(() => {
// //     console.log("[WidgetRenderer] Render:", widget?.type, "Widget ID:", widget?.id, "Config:", config)
// //   }, [widget, config])

// //   const dataSource = config?.dataSource ?? {}
// //   const telemetryKeys = safeTelemetryKeys(dataSource)

// //   const NO_TELEMETRY_REQUIRED = [
// //     "camera", "camera-feed", "camera-grid", "map", "gauge", "radial-gauge"
// //   ]
// //   const NO_DATA_REQUIRED = [
// //     "camera", "camera-feed", "camera-grid", "map"
// //   ]

// //   const bufferSize = CHART_WIDGETS.includes(widget?.type) ? 50 : 1

// //   const liveData = useWidgetLiveData(widget, { ...config, bufferSize })

// //   // -- Data mapping: for fan-control, support { fans: { ... } }
// //   const dataSourceType = dataSource?.type || "static"
// //   const data = useMemo(() => {
// //     if (
// //       dataSourceType === "mqtt" ||
// //       dataSourceType === "coap" ||
// //       dataSourceType === "http" ||
// //       dataSourceType === "device"
// //     ) {
// //       // If widget is fan-control and data.fans exists, pass fans object
// //       if (widget?.type === "fan-control" && liveData && typeof liveData.fans === "object") {
// //         return liveData.fans
// //       }
// //       return liveData
// //     }
// //     return config?.data || (widget?.type === "fan-control" ? {} : [])
// //   }, [dataSourceType, liveData, config?.data, widget?.type])

// //   const commonProps = {
// //     ...config,
// //     data,
// //     dataKeys: telemetryKeys,
// //     theme: config?.theme || "light"
// //   }

// //   const { sendCommand: sliderSendCommand, fanSendCommand, isSending: sliderIsSending } =
// //     useMqttCommand(config.dataSource || config)

// //   let streamUrl =
// //     config?.streamUrl ||
// //     dataSource?.streamUrl ||
// //     (Array.isArray(telemetryKeys) && telemetryKeys.length > 0 ? telemetryKeys[0] : "") ||
// //     ""
// //   if (typeof streamUrl !== "string") streamUrl = ""

// //   const cameraConfig = {
// //     ...commonProps,
// //     streamUrl,
// //     telemetry: telemetryKeys,
// //   }

// //   if (
// //     (!telemetryKeys || telemetryKeys.length === 0) &&
// //     !NO_TELEMETRY_REQUIRED.includes(widget?.type)
// //   ) {
// //     return (
// //       <div style={{ padding: 24, textAlign: "center" }}>
// //         No telemetry keys selected.
// //       </div>
// //     )
// //   }

// //   if (
// //     (!data || (Array.isArray(data) ? data.length === 0 : Object.keys(data).length === 0)) &&
// //     !NO_DATA_REQUIRED.includes(widget?.type)
// //   ) {
// //     return (
// //       <div style={{ padding: 24, textAlign: "center" }}>
// //         <Spin tip="Waiting for data..." />
// //       </div>
// //     )
// //   }
// //   const latestSample = Array.isArray(data) ? data[data.length - 1] : data
// //   const fanData = latestSample?.fan_status || {}

// //   try {
// //     switch (widget?.type) {
// //       case "value-card": return <ValueCardWidget {...commonProps} />
// //       case "status-card": return <StatusCardWidget {...commonProps} />
// //       case "alarm-table": return <AlarmTableWidget {...commonProps} />
// //       case "alarm-count": return <AlarmCountWidget {...commonProps} />
// //       case "button-control": return <ButtonWidget {...commonProps} />
// //       case "single-fan-control": return <SingleFanWidget {...commonProps} />
// //       case "fan-control": 
// //       return (
// //         <FanControlWidget
// //           {...commonProps}
// //           fans={config.fans || []}
// //           data={fanData} // <-- fans object
// //           sendMqttCommand={fanSendCommand}
// //         />
// //       )
// //       case "fan-grid-control": return <FanGridWidget {...commonProps} />
// //       case "signal-strength": return <SignalStrengthWidget {...commonProps} />
// //       case "slider-control":
// //         return (
// //           <SliderControlWidget
// //             {...commonProps}
// //             sendMqttCommand={sliderSendCommand}
// //             isMqttSending={sliderIsSending}
// //             telemetryOut={dataSource.telemetryOut || []}
// //           />
// //         )
// //       case "switch-control": return <SwitchControlWidget {...commonProps} />
// //       case "progress-bar": return <ProgressBarWidget {...commonProps} />
// //       case "battery-level": return <BatteryLevelWidget {...commonProps} />
// //       case "line-chart": return <LineChartWidget {...commonProps} />
// //       case "bar-chart": return <BarChartWidget {...commonProps} />
// //       case "pie-chart": return <PieChartWidget {...commonProps} />
// //       case "doughnut-chart": return <DoughnutChartWidget {...commonProps} />
// //       case "time-series-chart": return <TimeSeriesChartWidget {...commonProps} />
// //       case "radial-gauge":
// //       case "gauge": return <GaugeWidget {...commonProps} />
// //       case "google-map":
// //       case "map": return <MapWidget {...commonProps} />
// //       case "camera":
// //       case "camera-feed":
// //         return (
// //           <CameraWidget
// //             config={cameraConfig}
// //             onConfigChange={newConfig => {
// //               props.onConfigChange?.(widget?.id, newConfig)
// //             }}
// //             {...props}
// //           />
// //         )
// //       case "camera-grid": return <CameraGridWidget {...commonProps} />
// //       default:
// //         return (
// //           <Empty
// //             description={`Unknown widget type: ${widget?.type}`}
// //             image={Empty.PRESENTED_IMAGE_SIMPLE}
// //           />
// //         )
// //     }
// //   } catch (err) {
// //     console.error("[WidgetRenderer] Exception while rendering widget:", err)
// //     return (
// //       <Empty
// //         description={`Error rendering widget: ${widget?.type || "Unknown"}`}
// //         image={Empty.PRESENTED_IMAGE_SIMPLE}
// //       />
// //     )
// //   }
// // }

// // export default WidgetRenderer

// // // // "use client"

// // // // import React, { useMemo, useEffect } from "react"
// // // // import { Empty, Spin } from "antd"
// // // // import { useWidgetLiveData } from "../../hooks/useWidgetLiveData"
// // // // import { useMqttCommand } from "../../hooks/useMqttCommand"

// // // // import ValueCardWidget from "./widgets/ValueCardWidget"
// // // // import StatusCardWidget from "./widgets/StatusCardWidget"
// // // // import AlarmTableWidget from "./widgets/AlarmTableWidget"
// // // // import AlarmCountWidget from "./widgets/AlarmCountWidget"
// // // // import ButtonWidget from "./widgets/ButtonWidget"
// // // // import SignalStrengthWidget from "./widgets/SignalStrengthWidget"
// // // // import SwitchControlWidget from "./widgets/SwitchControlWidget"
// // // // import ProgressBarWidget from "./widgets/ProgressBarWidget"
// // // // import BatteryLevelWidget from "./widgets/BatteryLevelWidget"
// // // // import LineChartWidget from "./widgets/LineChartWidget"
// // // // import BarChartWidget from "./widgets/BarChartWidget"
// // // // import PieChartWidget from "./widgets/PieChartWidget"
// // // // import DoughnutChartWidget from "./widgets/DoughnutChartWidget"
// // // // import TimeSeriesChartWidget from "./widgets/TimeSeriesChartWidget"
// // // // import GaugeWidget from "./widgets/GaugeWidget"
// // // // import MapWidget from "./widgets/MapWidget"
// // // // import CameraWidget from "./widgets/CameraWidget"
// // // // import CameraGridWidget from "./widgets/CameraGridWidget"
// // // // import SliderControlWidget from "./widgets/SliderWidget"
// // // // import FanControlWidget from "./widgets/FanControlWidget"
// // // // import FanGridWidget from "./widgets/FanGridWidget"
// // // // import SingleFanWidget from "./widgets/SingleFanWidget"

// // // // // --- 1. Which widget types should buffer data? ---
// // // // const CHART_WIDGETS = [
// // // //   "line-chart", "bar-chart", "time-series-chart", "value-card"
// // // // ]

// // // // function safeTelemetryKeys(ds) {
// // // //   if (!ds) return []
// // // //   if (Array.isArray(ds.telemetry)) return ds.telemetry.filter(Boolean)
// // // //   if (typeof ds.telemetry === "string") return ds.telemetry ? [ds.telemetry] : []
// // // //   return []
// // // // }

// // // // const WidgetRenderer = ({ widget, config, ...props }) => {
// // // //   useEffect(() => {
// // // //     console.log("[WidgetRenderer] Render:", widget?.type, "Widget ID:", widget?.id, "Config:", config)
// // // //   }, [widget, config])

// // // //   // --- 2. Extract data source and telemetry keys (safe) ---
// // // //   const dataSource = config?.dataSource ?? {}
// // // //   const telemetryKeys = safeTelemetryKeys(dataSource)

// // // //   const NO_TELEMETRY_REQUIRED = [
// // // //     "camera", "camera-feed", "camera-grid", "map", "gauge", "radial-gauge"
// // // //   ]
// // // //   const NO_DATA_REQUIRED = [
// // // //     "camera", "camera-feed", "camera-grid", "map"
// // // //   ]

// // // //   // --- 3. Decide buffer size (charts = 50, value cards = 1, default = 1) ---
// // // //   const bufferSize = CHART_WIDGETS.includes(widget?.type) ? 50 : 1

// // // //   // --- 4. Get live (buffered) data from hook ---
// // // //   const liveData = useWidgetLiveData(widget, { ...config, bufferSize })

// // // //   // --- 5. Decide which data array to use (live, mock, or static) ---
// // // //   const dataSourceType = dataSource?.type || "static"
// // // //   const data = useMemo(() => {
// // // //     if (
// // // //       dataSourceType === "mqtt" ||
// // // //       dataSourceType === "coap" ||
// // // //       dataSourceType === "http" ||
// // // //       dataSourceType === "device"
// // // //     ) {
// // // //       return liveData
// // // //     }
// // // //     return config?.data || []
// // // //   }, [dataSourceType, liveData, config?.data])

// // // //   // --- 6. Dynamic dataKeys for all widgets ---
// // // //   const commonProps = {
// // // //     ...config,
// // // //     data,
// // // //     dataKeys: telemetryKeys,
// // // //     theme: config?.theme || "light"
// // // //   }

// // // //   // ---- MQTT Command hooks
// // // //   const { sendCommand: sliderSendCommand, fanSendCommand, isSending: sliderIsSending } =
// // // //     useMqttCommand(config.dataSource || config)

// // // //   // Camera patch (always provide streamUrl at top level)
// // // //   let streamUrl =
// // // //     config?.streamUrl ||
// // // //     dataSource?.streamUrl ||
// // // //     (Array.isArray(telemetryKeys) && telemetryKeys.length > 0 ? telemetryKeys[0] : "") ||
// // // //     ""
// // // //   if (typeof streamUrl !== "string") streamUrl = ""
// // // //   const cameraConfig = {
// // // //     ...commonProps,
// // // //     streamUrl,
// // // //     telemetry: telemetryKeys,
// // // //   }

// // // //   // --- 7. Render states, **robust length checks** ---
// // // //   if (
// // // //     (!telemetryKeys || telemetryKeys.length === 0) &&
// // // //     !NO_TELEMETRY_REQUIRED.includes(widget?.type)
// // // //   ) {
// // // //     return (
// // // //       <div style={{ padding: 24, textAlign: "center" }}>
// // // //         No telemetry keys selected.
// // // //       </div>
// // // //     )
// // // //   }

// // // //   if (
// // // //     (!data || data.length === 0) &&
// // // //     !NO_DATA_REQUIRED.includes(widget?.type)
// // // //   ) {
// // // //     return (
// // // //       <div style={{ padding: 24, textAlign: "center" }}>
// // // //         <Spin tip="Waiting for data..." />
// // // //       </div>
// // // //     )
// // // //   }

// // // //   // -- Sample alarm and fallback fan data for dev (not used for live widgets)
// // // //   const sampleAlarmData = [
// // // //     { key: "1", type: "Temperature", severity: "Critical", time: "2025-04-20T10:23:45Z", status: "Active", device: "Air Filter" },
// // // //     { key: "2", type: "Temperature", severity: "Major", time: "2025-04-20T09:15:22Z", status: "Active", device: "IOTM" },
// // // //     { key: "3", type: "Low Humidity", severity: "Warning", time: "2025-04-19T22:45:12Z", status: "Cleared", device: "Water level meter" },
// // // //     { key: "4", type: "Pressure", severity: "Major", time: "2025-04-18T16:20:30Z", status: "Active", device: "Pressure Sensor" },
// // // //     { key: "5", type: "Voltage", severity: "Critical", time: "2025-04-18T14:10:05Z", status: "Active", device: "Power Supply" }
// // // //   ]
// // // //   const myFan = {
// // // //     id: "fan99", name: "Main Floor Fan", status: "running", speed: 80, targetSpeed: 80, speedUnit: "RPM",
// // // //     temperature: 42, tempUnit: "°C", power: 115, runtime: 600, maintenanceHours: 1200,
// // // //     lastMaintenance: "2024-06-01", autoMode: true, alarms: [],
// // // //   }

// // // //   // --- 8. Render widget by type ---
// // // //   try {
// // // //     switch (widget?.type) {
// // // //       case "value-card":
// // // //         return <ValueCardWidget {...commonProps} />
// // // //       case "status-card":
// // // //         return <StatusCardWidget {...commonProps} />
// // // //       case "alarm-table":
// // // //         return <AlarmTableWidget {...commonProps} data={sampleAlarmData} pageSize={5} />
// // // //       case "alarm-count":
// // // //         return <AlarmCountWidget {...commonProps} />
// // // //       case "button-control":
// // // //         return <ButtonWidget {...commonProps} />
// // // //       case "single-fan-control":
// // // //         return <SingleFanWidget fan={myFan} showSpeedSet={true} {...commonProps} />
// // // //       case "fan-control":
// // // //         // Use fans config from modal/settings, fallback to 2 fans if not set
// // // //         return (
// // // //           <FanControlWidget
// // // //             {...commonProps}
// // // //             fans={
// // // //               Array.isArray(config.fans) && config.fans.length > 0
// // // //                 ? config.fans
// // // //                 : [
// // // //                   { id: "fan1", name: "Fan 1", speedUnit: config.speedUnit || "%", tempUnit: config.tempUnit || "°C", maintenanceHours: config.maintenanceHours || 8760, runtime: config.runtime || 0 },
// // // //                   { id: "fan2", name: "Fan 2", speedUnit: config.speedUnit || "%", tempUnit: config.tempUnit || "°C", maintenanceHours: config.maintenanceHours || 8760, runtime: config.runtime || 0 }
// // // //                 ]
// // // //             }
// // // //             sendMqttCommand={fanSendCommand}
// // // //           />
// // // //         )
// // // //       case "fan-grid-control":
// // // //         return <FanGridWidget {...commonProps} />
// // // //       case "signal-strength":
// // // //         return <SignalStrengthWidget {...commonProps} />
// // // //       case "slider-control":
// // // //         return (
// // // //           <SliderControlWidget
// // // //             {...commonProps}
// // // //             sendMqttCommand={sliderSendCommand}
// // // //             isMqttSending={sliderIsSending}
// // // //             telemetryOut={dataSource.telemetryOut || []}
// // // //           />
// // // //         )
// // // //       case "switch-control":
// // // //         return <SwitchControlWidget {...commonProps} />
// // // //       case "progress-bar":
// // // //         return <ProgressBarWidget {...commonProps} />
// // // //       case "battery-level":
// // // //         return <BatteryLevelWidget {...commonProps} />
// // // //       case "line-chart":
// // // //         return <LineChartWidget {...commonProps} />
// // // //       case "bar-chart":
// // // //         return <BarChartWidget {...commonProps} />
// // // //       case "pie-chart":
// // // //         return <PieChartWidget {...commonProps} />
// // // //       case "doughnut-chart":
// // // //         return (
// // // //           <DoughnutChartWidget
// // // //             {...commonProps}
// // // //             data={[
// // // //               { name: "Electronics", value: 40 },
// // // //               { name: "Furniture", value: 30 },
// // // //               { name: "Clothing", value: 20 },
// // // //               { name: "Toys", value: 10 },
// // // //             ]}
// // // //             drilldownData={{
// // // //               Electronics: [
// // // //                 { name: "Phones", value: 25 },
// // // //                 { name: "Laptops", value: 10 },
// // // //                 { name: "Accessories", value: 5 },
// // // //               ],
// // // //               Furniture: [
// // // //                 { name: "Chairs", value: 20 },
// // // //                 { name: "Tables", value: 10 },
// // // //               ],
// // // //               Clothing: [
// // // //                 { name: "Men", value: 15 },
// // // //                 { name: "Women", value: 5 },
// // // //               ],
// // // //             }}
// // // //             onSliceClick={(slice) => console.log("Slice clicked:", slice)}
// // // //           />
// // // //         )
// // // //       case "time-series-chart":
// // // //         return <TimeSeriesChartWidget {...commonProps} />
// // // //       case "radial-gauge":
// // // //       case "gauge":
// // // //         return <GaugeWidget {...commonProps} />
// // // //       case "google-map":
// // // //       case "map":
// // // //         return <MapWidget {...commonProps} />
// // // //       case "camera":
// // // //       case "camera-feed":
// // // //         return (
// // // //           <CameraWidget
// // // //             config={cameraConfig}
// // // //             onConfigChange={newConfig => {
// // // //               props.onConfigChange?.(widget?.id, newConfig)
// // // //             }}
// // // //             {...props}
// // // //           />
// // // //         )
// // // //       case "camera-grid":
// // // //         return <CameraGridWidget {...commonProps} />
// // // //       default:
// // // //         return (
// // // //           <Empty
// // // //             description={`Unknown widget type: ${widget?.type}`}
// // // //             image={Empty.PRESENTED_IMAGE_SIMPLE}
// // // //           />
// // // //         )
// // // //     }
// // // //   } catch (err) {
// // // //     console.error("[WidgetRenderer] Exception while rendering widget:", err)
// // // //     return (
// // // //       <Empty
// // // //         description={`Error rendering widget: ${widget?.type || "Unknown"}`}
// // // //         image={Empty.PRESENTED_IMAGE_SIMPLE}
// // // //       />
// // // //     )
// // // //   }
// // // // }

// // // // export default WidgetRenderer

// // // // // "use client"

// // // // // import React, { useMemo, useEffect } from "react"
// // // // // import { Empty, Spin } from "antd"
// // // // // import { useWidgetLiveData } from "../../hooks/useWidgetLiveData"
// // // // // import { useMqttCommand } from "../../hooks/useMqttCommand"   // <-- Import here!

// // // // // import ValueCardWidget from "./widgets/ValueCardWidget"
// // // // // import StatusCardWidget from "./widgets/StatusCardWidget"
// // // // // import AlarmTableWidget from "./widgets/AlarmTableWidget"
// // // // // import AlarmCountWidget from "./widgets/AlarmCountWidget"
// // // // // import ButtonWidget from "./widgets/ButtonWidget"
// // // // // import SignalStrengthWidget from "./widgets/SignalStrengthWidget"
// // // // // import SwitchControlWidget from "./widgets/SwitchControlWidget"
// // // // // import ProgressBarWidget from "./widgets/ProgressBarWidget"
// // // // // import BatteryLevelWidget from "./widgets/BatteryLevelWidget"
// // // // // import LineChartWidget from "./widgets/LineChartWidget"
// // // // // import BarChartWidget from "./widgets/BarChartWidget"
// // // // // import PieChartWidget from "./widgets/PieChartWidget"
// // // // // import DoughnutChartWidget from "./widgets/DoughnutChartWidget"
// // // // // import TimeSeriesChartWidget from "./widgets/TimeSeriesChartWidget"
// // // // // import GaugeWidget from "./widgets/GaugeWidget"
// // // // // import MapWidget from "./widgets/MapWidget"
// // // // // import CameraWidget from "./widgets/CameraWidget"
// // // // // import CameraGridWidget from "./widgets/CameraGridWidget"
// // // // // import SliderControlWidget from "./widgets/SliderWidget"
// // // // // import FanControlWidget from "./widgets/FanControlWidget"
// // // // // import FanGridWidget from "./widgets/FanGridWidget"
// // // // // import SingleFanWidget from "./widgets/SingleFanWidget"

// // // // // // --- 1. Which widget types should buffer data? ---
// // // // // const CHART_WIDGETS = [
// // // // //   "line-chart", "bar-chart", "time-series-chart", "value-card"
// // // // //   // Add others as needed
// // // // // ]

// // // // // function safeTelemetryKeys(ds) {
// // // // //   // Accept: array, string, null, undefined, number, etc.
// // // // //   if (!ds) return []
// // // // //   if (Array.isArray(ds.telemetry)) return ds.telemetry.filter(Boolean)
// // // // //   if (typeof ds.telemetry === "string") return ds.telemetry ? [ds.telemetry] : []
// // // // //   return []
// // // // // }

// // // // // const WidgetRenderer = ({ widget, config, ...props }) => {
// // // // //   useEffect(() => {
// // // // //     console.log("[WidgetRenderer] Render:", widget?.type, "Widget ID:", widget?.id, "Config:", config)
// // // // //   }, [widget, config])

// // // // //   // --- 2. Extract data source and telemetry keys (safe) ---
// // // // //   const dataSource = config?.dataSource ?? {}
// // // // //   const telemetryKeys = safeTelemetryKeys(dataSource)

// // // // //   const NO_TELEMETRY_REQUIRED = [
// // // // //     "camera", "camera-feed", "camera-grid", "map", "gauge", "radial-gauge"
// // // // //   ]
// // // // //   const NO_DATA_REQUIRED = [
// // // // //     "camera", "camera-feed", "camera-grid", "map"
// // // // //   ]

// // // // //   // --- 3. Decide buffer size (charts = 50, value cards = 1, default = 1) ---
// // // // //   const bufferSize = CHART_WIDGETS.includes(widget?.type) ? 50 : 1

// // // // //   // --- 4. Get live (buffered) data from hook ---
// // // // //   const liveData = useWidgetLiveData(widget, { ...config, bufferSize })

// // // // //   // --- 5. Decide which data array to use (live, mock, or static) ---
// // // // //   const dataSourceType = dataSource?.type || "static"
// // // // //   const data = useMemo(() => {
// // // // //     if (
// // // // //       dataSourceType === "mqtt" ||
// // // // //       dataSourceType === "coap" ||
// // // // //       dataSourceType === "http" ||
// // // // //       dataSourceType === "device"
// // // // //     ) {
// // // // //       return liveData
// // // // //     }
// // // // //     return config?.data || []
// // // // //   }, [dataSourceType, liveData, config?.data])

// // // // //   // --- 6. Dynamic dataKeys for all widgets ---
// // // // //   const commonProps = {
// // // // //     ...config,
// // // // //     data,
// // // // //     dataKeys: telemetryKeys,
// // // // //     theme: config?.theme || "light"
// // // // //   }

// // // // //   // ---- Call useMqttCommand ALWAYS here, and only pass to slider widget ----
// // // // //   const { sendCommand: sliderSendCommand, fanSendCommand, isSending: sliderIsSending } =
// // // // //     useMqttCommand(config.dataSource || config)

// // // // //   // Patch for camera widgets: always provide streamUrl at top level, fallback to first telemetry key
// // // // //   let streamUrl =
// // // // //     config?.streamUrl ||
// // // // //     dataSource?.streamUrl ||
// // // // //     (Array.isArray(telemetryKeys) && telemetryKeys.length > 0 ? telemetryKeys[0] : "") ||
// // // // //     ""

// // // // //   if (typeof streamUrl !== "string") streamUrl = ""

// // // // //   const cameraConfig = {
// // // // //     ...commonProps,
// // // // //     streamUrl,
// // // // //     telemetry: telemetryKeys, // pass telemetry keys explicitly if needed
// // // // //   }

// // // // //   // --- 7. Render states, **robust length checks** ---
// // // // //   if (
// // // // //     (!telemetryKeys || telemetryKeys.length === 0) &&
// // // // //     !NO_TELEMETRY_REQUIRED.includes(widget?.type)
// // // // //   ) {
// // // // //     return (
// // // // //       <div style={{ padding: 24, textAlign: "center" }}>
// // // // //         No telemetry keys selected.
// // // // //       </div>
// // // // //     )
// // // // //   }

// // // // //   if (
// // // // //     (!data || data.length === 0) &&
// // // // //     !NO_DATA_REQUIRED.includes(widget?.type)
// // // // //   ) {
// // // // //     return (
// // // // //       <div style={{ padding: 24, textAlign: "center" }}>
// // // // //         <Spin tip="Waiting for data..." />
// // // // //       </div>
// // // // //     )
// // // // //   }

// // // // //   const sampleAlarmData = [
// // // // //     {
// // // // //       key: "1",
// // // // //       type: "Temperature",
// // // // //       severity: "Critical",
// // // // //       time: "2025-04-20T10:23:45Z",
// // // // //       status: "Active",
// // // // //       device: "Air Filter",
// // // // //     },
// // // // //     {
// // // // //       key: "2",
// // // // //       type: "Temperature",
// // // // //       severity: "Major",
// // // // //       time: "2025-04-20T09:15:22Z",
// // // // //       status: "Active",
// // // // //       device: "IOTM",
// // // // //     },
// // // // //     {
// // // // //       key: "3",
// // // // //       type: "Low Humidity",
// // // // //       severity: "Warning",
// // // // //       time: "2025-04-19T22:45:12Z",
// // // // //       status: "Cleared",
// // // // //       device: "Water level meter",
// // // // //     },
// // // // //     {
// // // // //       key: "4",
// // // // //       type: "Pressure",
// // // // //       severity: "Major",
// // // // //       time: "2025-04-18T16:20:30Z",
// // // // //       status: "Active",
// // // // //       device: "Pressure Sensor",
// // // // //     },
// // // // //     {
// // // // //       key: "5",
// // // // //       type: "Voltage",
// // // // //       severity: "Critical",
// // // // //       time: "2025-04-18T14:10:05Z",
// // // // //       status: "Active",
// // // // //       device: "Power Supply",
// // // // //     },
// // // // //   ]
// // // // //   const myFan = {
// // // // //     id: "fan99", name: "Main Floor Fan", status: "running", speed: 80, targetSpeed: 80, speedUnit: "RPM",
// // // // //     temperature: 42, tempUnit: "°C", power: 115, runtime: 600, maintenanceHours: 1200,
// // // // //     lastMaintenance: "2024-06-01", autoMode: true, alarms: [],
// // // // //   }
// // // // //   // --- 8. Render widget by type ---
// // // // //   try {
// // // // //     switch (widget?.type) {
// // // // //       case "value-card": return <ValueCardWidget {...commonProps} />
// // // // //       case "status-card": return <StatusCardWidget {...commonProps} />
// // // // //       case "alarm-table": return <AlarmTableWidget {...commonProps} data={sampleAlarmData} pageSize={5} />
// // // // //       case "alarm-count": return <AlarmCountWidget {...commonProps} />
// // // // //       case "button-control": return <ButtonWidget {...commonProps} />
// // // // //       case "single-fan-control": return <SingleFanWidget
// // // // //         fan={myFan} showSpeedSet={true}
// // // // //         {...commonProps} />
// // // // //       case "fan-control": return <FanControlWidget
// // // // //         {...commonProps}

// // // // //         fans={[
// // // // //           { id: "fan1", name: "Fan 1", speedUnit: "%", tempUnit: "°C", maintenanceHours: 8760, runtime: 1200},
// // // // //           { id: "fan2", name: "Fan 2", speedUnit: "RPM", tempUnit: "°C", maintenanceHours: 8760, runtime: 890},
// // // // //         ]}
// // // // //         data={[
// // // // //           { fanId: "fan1", speed: 80, temperature: 46.5, status: "stop", power: 135, runtime: 1260 },
// // // // //           { fanId: "fan2", speed: 0, temperature: 32.2, status: "stop", power: 0, runtime: 890 },
// // // // //         ]}
// // // // //         dataKeys={["speed"]} 
// // // // //         sendMqttCommand={fanSendCommand}/>

// // // // //       case "fan-grid-control": return <FanGridWidget {...commonProps} />
// // // // //       case "signal-strength": return <SignalStrengthWidget {...commonProps} />
// // // // //       case "slider-control":
// // // // //         return (
// // // // //           <SliderControlWidget
// // // // //             {...commonProps}
// // // // //             sendMqttCommand={sliderSendCommand}
// // // // //             isMqttSending={sliderIsSending}
// // // // //             telemetryOut={dataSource.telemetryOut || []}
// // // // //           />
// // // // //         )
// // // // //       case "switch-control": return <SwitchControlWidget {...commonProps} />
// // // // //       case "progress-bar": return <ProgressBarWidget {...commonProps} />
// // // // //       case "battery-level": return <BatteryLevelWidget {...commonProps} />
// // // // //       case "line-chart": return <LineChartWidget {...commonProps} />
// // // // //       case "bar-chart": return <BarChartWidget {...commonProps} />
// // // // //       case "pie-chart": return <PieChartWidget {...commonProps} />
// // // // //       case "doughnut-chart": return <DoughnutChartWidget {...commonProps} data={[
// // // // //         { name: "Electronics", value: 40 },
// // // // //         { name: "Furniture", value: 30 },
// // // // //         { name: "Clothing", value: 20 },
// // // // //         { name: "Toys", value: 10 },
// // // // //       ]}
// // // // //         drilldownData={{
// // // // //           Electronics: [
// // // // //             { name: "Phones", value: 25 },
// // // // //             { name: "Laptops", value: 10 },
// // // // //             { name: "Accessories", value: 5 },
// // // // //           ],
// // // // //           Furniture: [
// // // // //             { name: "Chairs", value: 20 },
// // // // //             { name: "Tables", value: 10 },
// // // // //           ],
// // // // //           Clothing: [
// // // // //             { name: "Men", value: 15 },
// // // // //             { name: "Women", value: 5 },
// // // // //           ],
// // // // //         }}
// // // // //         onSliceClick={(slice) => console.log("Slice clicked:", slice)} />
// // // // //       case "time-series-chart": return <TimeSeriesChartWidget {...commonProps} />
// // // // //       case "radial-gauge":
// // // // //       case "gauge": return <GaugeWidget {...commonProps} />
// // // // //       case "google-map":
// // // // //       case "map": return <MapWidget {...commonProps} />
// // // // //       case "camera":
// // // // //       case "camera-feed":
// // // // //         console.log("[WidgetRenderer] Rendering CameraWidget with config:", cameraConfig)
// // // // //         return (
// // // // //           <CameraWidget
// // // // //             config={cameraConfig}
// // // // //             onConfigChange={newConfig => {
// // // // //               console.log("[WidgetRenderer] onConfigChange for widget", widget?.id, "with config:", newConfig)
// // // // //               props.onConfigChange?.(widget?.id, newConfig)
// // // // //             }}
// // // // //             {...props}
// // // // //           />
// // // // //         )
// // // // //       case "camera-grid": return <CameraGridWidget {...commonProps} />
// // // // //       default:
// // // // //         return (
// // // // //           <Empty
// // // // //             description={`Unknown widget type: ${widget?.type}`}
// // // // //             image={Empty.PRESENTED_IMAGE_SIMPLE}
// // // // //           />
// // // // //         )
// // // // //     }
// // // // //   } catch (err) {
// // // // //     console.error("[WidgetRenderer] Exception while rendering widget:", err)
// // // // //     return (
// // // // //       <Empty
// // // // //         description={`Error rendering widget: ${widget?.type || "Unknown"}`}
// // // // //         image={Empty.PRESENTED_IMAGE_SIMPLE}
// // // // //       />
// // // // //     )
// // // // //   }
// // // // // }

// // // // // export default WidgetRenderer

// // // // // // "use client"

// // // // // // import React, { useMemo, useEffect } from "react"
// // // // // // import { Empty, Spin } from "antd"
// // // // // // import { useWidgetLiveData } from "../../hooks/useWidgetLiveData"

// // // // // // import ValueCardWidget from "./widgets/ValueCardWidget"
// // // // // // import StatusCardWidget from "./widgets/StatusCardWidget"
// // // // // // import AlarmTableWidget from "./widgets/AlarmTableWidget"
// // // // // // import AlarmCountWidget from "./widgets/AlarmCountWidget"
// // // // // // import SignalStrengthWidget from "./widgets/SignalStrengthWidget"
// // // // // // import ProgressBarWidget from "./widgets/ProgressBarWidget"
// // // // // // import BatteryLevelWidget from "./widgets/BatteryLevelWidget"
// // // // // // import LineChartWidget from "./widgets/LineChartWidget"
// // // // // // import BarChartWidget from "./widgets/BarChartWidget"
// // // // // // import PieChartWidget from "./widgets/PieChartWidget"
// // // // // // import DoughnutChartWidget from "./widgets/DoughnutChartWidget"
// // // // // // import TimeSeriesChartWidget from "./widgets/TimeSeriesChartWidget"
// // // // // // import GaugeWidget from "./widgets/GaugeWidget"
// // // // // // import MapWidget from "./widgets/MapWidget"
// // // // // // import CameraWidget from "./widgets/CameraWidget"
// // // // // // import CameraGridWidget from "./widgets/CameraGridWidget"

// // // // // // // --- 1. Which widget types should buffer data? ---
// // // // // // const CHART_WIDGETS = [
// // // // // //   "line-chart", "bar-chart", "time-series-chart", "value-card"
// // // // // //   // Add others as needed
// // // // // // ]

// // // // // // const WidgetRenderer = ({ widget, config, ...props }) => {
// // // // // //   useEffect(() => {
// // // // // //     console.log("[WidgetRenderer] Render:", widget.type, "Widget ID:", widget.id, "Config:", config)
// // // // // //   }, [widget, config])

// // // // // //   // --- 2. Extract data source and telemetry keys ---
// // // // // //   const dataSourceType = config?.dataSource?.type || "static"
// // // // // //   // const telemetryKeys = config?.dataSource?.telemetry || []
// // // // // //   const telemetryKeys = Array.isArray(config?.dataSource?.telemetry)
// // // // // //     ? config.dataSource.telemetry
// // // // // //     : (
// // // // // //         typeof config?.dataSource?.telemetry === "string"
// // // // // //           ? [config.dataSource.telemetry]
// // // // // //           : []
// // // // // //       );

// // // // // //   const NO_TELEMETRY_REQUIRED = [
// // // // // //     "camera", "camera-feed", "camera-grid", "map", "gauge", "radial-gauge"
// // // // // //     // Add any others here!
// // // // // //   ]

// // // // // //   const NO_DATA_REQUIRED = [
// // // // // //     "camera", "camera-feed", "camera-grid", "map"
// // // // // //     // Add any others here!
// // // // // //   ]

// // // // // //   // --- 3. Decide buffer size (charts = 50, value cards = 1, default = 1) ---
// // // // // //   const bufferSize = CHART_WIDGETS.includes(widget.type) ? 50 : 1

// // // // // //   // --- 4. Get live (buffered) data from hook ---
// // // // // //   const liveData = useWidgetLiveData(widget, { ...config, bufferSize })

// // // // // //   // --- 5. Decide which data array to use (live, mock, or static) ---
// // // // // //   const data = useMemo(() => {
// // // // // //     if (
// // // // // //       dataSourceType === "mqtt" ||
// // // // // //       dataSourceType === "coap" ||
// // // // // //       dataSourceType === "http" ||
// // // // // //       dataSourceType === "device"
// // // // // //     ) {
// // // // // //       return liveData
// // // // // //     }
// // // // // //     return config.data || []
// // // // // //     // eslint-disable-next-line
// // // // // //   }, [dataSourceType, liveData, config.data])

// // // // // //   // --- 6. Dynamic dataKeys for all widgets ---
// // // // // //   const commonProps = {
// // // // // //     ...config,
// // // // // //     data,
// // // // // //     dataKeys: telemetryKeys,
// // // // // //     theme: config.theme || "light"
// // // // // //   }

// // // // // //   // Patch for camera widgets: always provide streamUrl at top level
// // // // // //   const streamUrl =
// // // // // //     config?.streamUrl ||
// // // // // //     config?.dataSource?.streamUrl ||
// // // // // //     (Array.isArray(telemetryKeys) && telemetryKeys.length === 1 && telemetryKeys[0].startsWith("http") ? telemetryKeys[0] : "") ||
// // // // // //     ""; // fallback to empty

// // // // // //   const cameraConfig = {
// // // // // //     ...commonProps,
// // // // // //     streamUrl,
// // // // // //     telemetry: telemetryKeys, // pass telemetry keys explicitly if needed
// // // // // //   }

// // // // // //   // --- 7. Render states ---
// // // // // //   if (
// // // // // //     !telemetryKeys.length &&
// // // // // //     !NO_TELEMETRY_REQUIRED.includes(widget.type)
// // // // // //   ) {
// // // // // //     return (
// // // // // //       <div style={{ padding: 24, textAlign: "center" }}>
// // // // // //         No telemetry keys selected.
// // // // // //       </div>
// // // // // //     )
// // // // // //   }

// // // // // //   if (
// // // // // //     !data.length &&
// // // // // //     !NO_DATA_REQUIRED.includes(widget.type)
// // // // // //   ) {
// // // // // //     return (
// // // // // //       <div style={{ padding: 24, textAlign: "center" }}>
// // // // // //         <Spin tip="Waiting for data..." />
// // // // // //       </div>
// // // // // //     )
// // // // // //   }

// // // // // //   // --- 8. Render widget by type ---
// // // // // //   switch (widget.type) {
// // // // // //     case "value-card":        return <ValueCardWidget {...commonProps} />
// // // // // //     case "status-card":       return <StatusCardWidget {...commonProps} />
// // // // // //     case "alarm-table":       return <AlarmTableWidget {...commonProps} />
// // // // // //     case "alarm-count":       return <AlarmCountWidget {...commonProps} />
// // // // // //     case "signal-strength":   return <SignalStrengthWidget {...commonProps} />
// // // // // //     case "progress-bar":      return <ProgressBarWidget {...commonProps} />
// // // // // //     case "battery-level":     return <BatteryLevelWidget {...commonProps} />
// // // // // //     case "line-chart":        return <LineChartWidget {...commonProps} />
// // // // // //     case "bar-chart":         return <BarChartWidget {...commonProps} />
// // // // // //     case "pie-chart":         return <PieChartWidget {...commonProps} />
// // // // // //     case "doughnut-chart":    return <DoughnutChartWidget {...commonProps} />
// // // // // //     case "time-series-chart": return <TimeSeriesChartWidget {...commonProps} />
// // // // // //     case "radial-gauge":
// // // // // //     case "gauge":             return <GaugeWidget {...commonProps} />
// // // // // //     case "map":               return <MapWidget {...commonProps} />
// // // // // //     // case "camera":
// // // // // //     // case "camera-feed":       return <CameraWidget config={cameraConfig} {...props} />
// // // // // //     case "camera":
// // // // // //     case "camera-feed":
// // // // // //       console.log("[WidgetRenderer] Rendering CameraWidget with config:", cameraConfig)
// // // // // //       return (
// // // // // //         <CameraWidget
// // // // // //           config={cameraConfig}
// // // // // //           onConfigChange={newConfig => {
// // // // // //             console.log("[WidgetRenderer] onConfigChange for widget", widget.id, "with config:", newConfig)
// // // // // //             props.onConfigChange?.(widget.id, newConfig)
// // // // // //           }}
// // // // // //           {...props}
// // // // // //         />
// // // // // //       )
// // // // // //     case "camera-grid":       return <CameraGridWidget {...commonProps} />
// // // // // //     default:
// // // // // //       return (
// // // // // //         <Empty
// // // // // //           description={`Unknown widget type: ${widget.type}`}
// // // // // //           image={Empty.PRESENTED_IMAGE_SIMPLE}
// // // // // //         />
// // // // // //       )
// // // // // //   }
// // // // // // }

// // // // // // export default WidgetRenderer


// // // // // // // "use client"

// // // // // // // import React, { useMemo } from "react"
// // // // // // // import { Empty, Spin } from "antd"
// // // // // // // import { useWidgetLiveData } from "../../hooks/useWidgetLiveData"

// // // // // // // import ValueCardWidget from "./widgets/ValueCardWidget"
// // // // // // // import StatusCardWidget from "./widgets/StatusCardWidget"
// // // // // // // import AlarmTableWidget from "./widgets/AlarmTableWidget"
// // // // // // // import AlarmCountWidget from "./widgets/AlarmCountWidget"
// // // // // // // import SignalStrengthWidget from "./widgets/SignalStrengthWidget"
// // // // // // // import ProgressBarWidget from "./widgets/ProgressBarWidget"
// // // // // // // import BatteryLevelWidget from "./widgets/BatteryLevelWidget"
// // // // // // // import LineChartWidget from "./widgets/LineChartWidget"
// // // // // // // import BarChartWidget from "./widgets/BarChartWidget"
// // // // // // // import PieChartWidget from "./widgets/PieChartWidget"
// // // // // // // import DoughnutChartWidget from "./widgets/DoughnutChartWidget"
// // // // // // // import TimeSeriesChartWidget from "./widgets/TimeSeriesChartWidget"
// // // // // // // import GaugeWidget from "./widgets/GaugeWidget"
// // // // // // // import MapWidget from "./widgets/MapWidget"
// // // // // // // import CameraWidget from "./widgets/CameraWidget"
// // // // // // // import CameraGridWidget from "./widgets/CameraGridWidget"

// // // // // // // // --- 1. Which widget types should buffer data? ---
// // // // // // // const CHART_WIDGETS = [
// // // // // // //   "line-chart", "bar-chart", "time-series-chart", "value-card"
// // // // // // //   // Add others as needed
// // // // // // // ]

// // // // // // // const WidgetRenderer = ({ widget, config }) => {
// // // // // // //   // --- 2. Extract data source and telemetry keys ---
// // // // // // //   const dataSourceType = config?.dataSource?.type || "static"
// // // // // // //   const telemetryKeys = config?.dataSource?.telemetry || []
// // // // // // //   const NO_TELEMETRY_REQUIRED = [
// // // // // // //     "camera", "camera-feed", "camera-grid", "map", "gauge", "radial-gauge"
// // // // // // //     // Add any others here!
// // // // // // //   ]

// // // // // // //   const NO_DATA_REQUIRED = [
// // // // // // //     "camera", "camera-feed", "camera-grid", "map"
// // // // // // //     // Add any others here!
// // // // // // //   ]
// // // // // // //   // --- 3. Decide buffer size (charts = 50, value cards = 1, default = 1) ---
// // // // // // //   const bufferSize = CHART_WIDGETS.includes(widget.type) ? 50 : 1

// // // // // // //   // --- 4. Get live (buffered) data from hook ---
// // // // // // //   const liveData = useWidgetLiveData(widget, { ...config, bufferSize })

// // // // // // //   // --- 5. Decide which data array to use (live, mock, or static) ---
// // // // // // //   const data = useMemo(() => {
// // // // // // //     if (
// // // // // // //       dataSourceType === "mqtt" ||
// // // // // // //       dataSourceType === "coap" ||
// // // // // // //       dataSourceType === "http" ||
// // // // // // //       dataSourceType === "device"
// // // // // // //     ) {
// // // // // // //       return liveData
// // // // // // //     }
// // // // // // //     return config.data || []
// // // // // // //     // eslint-disable-next-line
// // // // // // //   }, [dataSourceType, liveData, config.data])

// // // // // // //   // --- 6. Dynamic dataKeys for all widgets ---
// // // // // // //   const commonProps = {
// // // // // // //     ...config,
// // // // // // //     data,
// // // // // // //     dataKeys: telemetryKeys,
// // // // // // //     theme: config.theme || "light"
// // // // // // //   }

// // // // // // //   // --- 7. Render states ---
// // // // // // //   // if (!telemetryKeys.length) {
// // // // // // //   //   return (
// // // // // // //   //     <div style={{ padding: 24, textAlign: "center" }}>
// // // // // // //   //       No telemetry keys selected.
// // // // // // //   //     </div>
// // // // // // //   //   )
// // // // // // //   // }
// // // // // // //   // if (!data.length) {
// // // // // // //   //   return (
// // // // // // //   //     <div style={{ padding: 24, textAlign: "center" }}>
// // // // // // //   //       <Spin tip="Waiting for data..." />
// // // // // // //   //     </div>
// // // // // // //   //   )
// // // // // // //   // }
// // // // // // //   // Only require telemetryKeys for NON-camera widgets
// // // // // // //   if (
// // // // // // //     !telemetryKeys.length &&
// // // // // // //     !NO_TELEMETRY_REQUIRED.includes(widget.type)
// // // // // // //   ) {
// // // // // // //     return (
// // // // // // //       <div style={{ padding: 24, textAlign: "center" }}>
// // // // // // //         No telemetry keys selected.
// // // // // // //       </div>
// // // // // // //     )
// // // // // // //   }

// // // // // // //   if (
// // // // // // //     !data.length &&
// // // // // // //     !NO_DATA_REQUIRED.includes(widget.type)
// // // // // // //   ) {
// // // // // // //     return (
// // // // // // //       <div style={{ padding: 24, textAlign: "center" }}>
// // // // // // //         <Spin tip="Waiting for data..." />
// // // // // // //       </div>
// // // // // // //     )
// // // // // // //   }

// // // // // // //   // --- 8. Render widget by type ---
// // // // // // //   switch (widget.type) {
// // // // // // //     case "value-card":        return <ValueCardWidget {...commonProps} />
// // // // // // //     case "status-card":       return <StatusCardWidget {...commonProps} />
// // // // // // //     case "alarm-table":       return <AlarmTableWidget {...commonProps} />
// // // // // // //     case "alarm-count":       return <AlarmCountWidget {...commonProps} />
// // // // // // //     case "signal-strength":   return <SignalStrengthWidget {...commonProps} />
// // // // // // //     case "progress-bar":      return <ProgressBarWidget {...commonProps} />
// // // // // // //     case "battery-level":     return <BatteryLevelWidget {...commonProps} />
// // // // // // //     case "line-chart":        return <LineChartWidget {...commonProps} />
// // // // // // //     case "bar-chart":         return <BarChartWidget {...commonProps} />
// // // // // // //     case "pie-chart":         return <PieChartWidget {...commonProps} />
// // // // // // //     case "doughnut-chart":    return <DoughnutChartWidget {...commonProps} />
// // // // // // //     case "time-series-chart": return <TimeSeriesChartWidget {...commonProps} />
// // // // // // //     case "radial-gauge":
// // // // // // //     case "gauge":             return <GaugeWidget {...commonProps} />
// // // // // // //     case "map":               return <MapWidget {...commonProps} />
// // // // // // //     case "camera":
// // // // // // //     case "camera-feed":       return <CameraWidget {...commonProps} />
// // // // // // //     case "camera-grid":       return <CameraGridWidget {...commonProps} />
// // // // // // //     default:
// // // // // // //       return (
// // // // // // //         <Empty
// // // // // // //           description={`Unknown widget type: ${widget.type}`}
// // // // // // //           image={Empty.PRESENTED_IMAGE_SIMPLE}
// // // // // // //         />
// // // // // // //       )
// // // // // // //   }
// // // // // // // }

// // // // // // // export default WidgetRenderer

// // // // // // // // // src/components/dashboard/WidgetRenderer.jsx
// // // // // // // // "use client"

// // // // // // // // import React, { useMemo } from "react"
// // // // // // // // import { Empty, Spin } from "antd"
// // // // // // // // import { useWidgetLiveData } from "../../hooks/useWidgetLiveData"

// // // // // // // // import ValueCardWidget from "./widgets/ValueCardWidget"
// // // // // // // // import StatusCardWidget from "./widgets/StatusCardWidget"
// // // // // // // // import AlarmTableWidget from "./widgets/AlarmTableWidget"
// // // // // // // // import AlarmCountWidget from "./widgets/AlarmCountWidget"
// // // // // // // // import SignalStrengthWidget from "./widgets/SignalStrengthWidget"
// // // // // // // // import ProgressBarWidget from "./widgets/ProgressBarWidget"
// // // // // // // // import BatteryLevelWidget from "./widgets/BatteryLevelWidget"
// // // // // // // // import LineChartWidget from "./widgets/LineChartWidget"
// // // // // // // // import BarChartWidget from "./widgets/BarChartWidget"
// // // // // // // // import PieChartWidget from "./widgets/PieChartWidget"
// // // // // // // // import DoughnutChartWidget from "./widgets/DoughnutChartWidget"
// // // // // // // // import TimeSeriesChartWidget from "./widgets/TimeSeriesChartWidget"
// // // // // // // // import GaugeWidget from "./widgets/GaugeWidget"
// // // // // // // // import MapWidget from "./widgets/MapWidget"
// // // // // // // // import CameraWidget from "./widgets/CameraWidget"
// // // // // // // // import CameraGridWidget from "./widgets/CameraGridWidget"

// // // // // // // // const WidgetRenderer = ({ widget, config }) => {
// // // // // // // //   // --- 1. Extract data source and telemetry keys ---
// // // // // // // //   const dataSourceType = config?.dataSource?.type || "static"
// // // // // // // //   const telemetryKeys = config?.dataSource?.telemetry || []

// // // // // // // //   // --- 2. Get live (buffered) data from hook (one MQTT client, per-widget buffer) ---
// // // // // // // //   const liveData = useWidgetLiveData(widget, config)

// // // // // // // //   // --- 3. Decide which data array to use (live, mock, or static) ---
// // // // // // // //   const data = useMemo(() => {
// // // // // // // //     if (
// // // // // // // //       dataSourceType === "mqtt" ||
// // // // // // // //       dataSourceType === "coap" ||
// // // // // // // //       dataSourceType === "http" ||
// // // // // // // //       dataSourceType === "device"
// // // // // // // //     ) {
// // // // // // // //       return liveData
// // // // // // // //     }
// // // // // // // //     return config.data || []
// // // // // // // //     // eslint-disable-next-line
// // // // // // // //   }, [dataSourceType, liveData, config.data])

// // // // // // // //   // --- 4. Dynamic dataKeys for all widgets ---
// // // // // // // //   const commonProps = {
// // // // // // // //     ...config,
// // // // // // // //     data,
// // // // // // // //     dataKeys: telemetryKeys, // <-- Dynamic, matches telemetry selection!
// // // // // // // //     theme: config.theme || "light"
// // // // // // // //   }

// // // // // // // //   // --- 5. Render states ---
// // // // // // // //   if (!telemetryKeys.length) {
// // // // // // // //     return (
// // // // // // // //       <div style={{ padding: 24, textAlign: "center" }}>
// // // // // // // //         No telemetry keys selected.
// // // // // // // //       </div>
// // // // // // // //     )
// // // // // // // //   }
// // // // // // // //   if (!data.length) {
// // // // // // // //     return (
// // // // // // // //       <div style={{ padding: 24, textAlign: "center" }}>
// // // // // // // //         <Spin tip="Waiting for data..." />
// // // // // // // //       </div>
// // // // // // // //     )
// // // // // // // //   }

// // // // // // // //   // --- 6. Render widget by type ---
// // // // // // // //   switch (widget.type) {
// // // // // // // //     case "value-card":        return <ValueCardWidget {...commonProps} />
// // // // // // // //     case "status-card":       return <StatusCardWidget {...commonProps} />
// // // // // // // //     case "alarm-table":       return <AlarmTableWidget {...commonProps} />
// // // // // // // //     case "alarm-count":       return <AlarmCountWidget {...commonProps} />
// // // // // // // //     case "signal-strength":   return <SignalStrengthWidget {...commonProps} />
// // // // // // // //     case "progress-bar":      return <ProgressBarWidget {...commonProps} />
// // // // // // // //     case "battery-level":     return <BatteryLevelWidget {...commonProps} />
// // // // // // // //     case "line-chart":        return <LineChartWidget {...commonProps}  />
// // // // // // // //     case "bar-chart":         return <BarChartWidget {...commonProps} />
// // // // // // // //     case "pie-chart":         return <PieChartWidget {...commonProps} />
// // // // // // // //     case "doughnut-chart":    return <DoughnutChartWidget {...commonProps} />
// // // // // // // //     case "time-series-chart": return <TimeSeriesChartWidget {...commonProps} />
// // // // // // // //     case "radial-gauge":
// // // // // // // //     case "gauge":             return <GaugeWidget {...commonProps} />
// // // // // // // //     case "map":               return <MapWidget {...commonProps} />
// // // // // // // //     case "camera":
// // // // // // // //     case "camera-feed":       return <CameraWidget {...commonProps} />
// // // // // // // //     case "camera-grid":       return <CameraGridWidget {...commonProps} />
// // // // // // // //     default:
// // // // // // // //       return (
// // // // // // // //         <Empty
// // // // // // // //           description={`Unknown widget type: ${widget.type}`}
// // // // // // // //           image={Empty.PRESENTED_IMAGE_SIMPLE}
// // // // // // // //         />
// // // // // // // //       )
// // // // // // // //   }
// // // // // // // // }

// // // // // // // // export default WidgetRenderer


// // // // // // // // // // src/components/dashboard/WidgetRenderer.jsx
// // // // // // // // // "use client"

// // // // // // // // // import React, { useMemo } from "react"
// // // // // // // // // import { Empty, Spin } from "antd"
// // // // // // // // // import { useWidgetLiveData } from "../../hooks/useWidgetLiveData"

// // // // // // // // // import ValueCardWidget from "./widgets/ValueCardWidget"
// // // // // // // // // import StatusCardWidget from "./widgets/StatusCardWidget"
// // // // // // // // // import AlarmTableWidget from "./widgets/AlarmTableWidget"
// // // // // // // // // import AlarmCountWidget from "./widgets/AlarmCountWidget"
// // // // // // // // // import SignalStrengthWidget from "./widgets/SignalStrengthWidget"
// // // // // // // // // import ProgressBarWidget from "./widgets/ProgressBarWidget"
// // // // // // // // // import BatteryLevelWidget from "./widgets/BatteryLevelWidget"
// // // // // // // // // import LineChartWidget from "./widgets/LineChartWidget"
// // // // // // // // // import BarChartWidget from "./widgets/BarChartWidget"
// // // // // // // // // import PieChartWidget from "./widgets/PieChartWidget"
// // // // // // // // // import DoughnutChartWidget from "./widgets/DoughnutChartWidget"
// // // // // // // // // import TimeSeriesChartWidget from "./widgets/TimeSeriesChartWidget"
// // // // // // // // // import GaugeWidget from "./widgets/GaugeWidget"
// // // // // // // // // import MapWidget from "./widgets/MapWidget"
// // // // // // // // // import CameraWidget from "./widgets/CameraWidget"
// // // // // // // // // import CameraGridWidget from "./widgets/CameraGridWidget"

// // // // // // // // // const WidgetRenderer = ({ widget, config }) => {
// // // // // // // // //   // --- 1. Extract data source and telemetry keys ---
// // // // // // // // //   const dataSourceType = config?.dataSource?.type || "static"
// // // // // // // // //   const telemetryKeys = config?.dataSource?.telemetry || []

// // // // // // // // //   // --- 2. Live data from hook ---
// // // // // // // // //   const liveData = useWidgetLiveData(widget, config)

// // // // // // // // //   // --- 3. Decide which data array to use (live, mock, or static) ---
// // // // // // // // //   const data = useMemo(() => {
// // // // // // // // //     if (
// // // // // // // // //       dataSourceType === "mqtt" ||
// // // // // // // // //       dataSourceType === "coap" ||
// // // // // // // // //       dataSourceType === "http" ||
// // // // // // // // //       dataSourceType === "device"
// // // // // // // // //     ) {
// // // // // // // // //       return liveData
// // // // // // // // //     }
// // // // // // // // //     return config.data || []
// // // // // // // // //     // eslint-disable-next-line
// // // // // // // // //   }, [dataSourceType, liveData, config.data])

// // // // // // // // //   // --- 4. Dynamic dataKeys for all widgets ---
// // // // // // // // //   const commonProps = {
// // // // // // // // //     ...config,
// // // // // // // // //     data,
// // // // // // // // //     dataKeys: telemetryKeys, // <-- Dynamic, matches telemetry selection!
// // // // // // // // //     theme: config.theme || "light"
// // // // // // // // //   }

// // // // // // // // //   // --- 5. Render states ---
// // // // // // // // //   if (!telemetryKeys.length) {
// // // // // // // // //     return (
// // // // // // // // //       <div style={{ padding: 24, textAlign: "center" }}>
// // // // // // // // //         No telemetry keys selected.
// // // // // // // // //       </div>
// // // // // // // // //     )
// // // // // // // // //   }
// // // // // // // // //   if (!data.length) {
// // // // // // // // //     return (
// // // // // // // // //       <div style={{ padding: 24, textAlign: "center" }}>
// // // // // // // // //         <Spin tip="Waiting for data..." />
// // // // // // // // //       </div>
// // // // // // // // //     )
// // // // // // // // //   }

// // // // // // // // //   // --- 6. Render widget by type ---
// // // // // // // // //   switch (widget.type) {
// // // // // // // // //     case "value-card":        return <ValueCardWidget {...commonProps} />
// // // // // // // // //     case "status-card":       return <StatusCardWidget {...commonProps} />
// // // // // // // // //     case "alarm-table":       return <AlarmTableWidget {...commonProps} />
// // // // // // // // //     case "alarm-count":       return <AlarmCountWidget {...commonProps} />
// // // // // // // // //     case "signal-strength":   return <SignalStrengthWidget {...commonProps} />
// // // // // // // // //     case "progress-bar":      return <ProgressBarWidget {...commonProps} />
// // // // // // // // //     case "battery-level":     return <BatteryLevelWidget {...commonProps} />
// // // // // // // // //     case "line-chart":        return <LineChartWidget {...commonProps} />
// // // // // // // // //     case "bar-chart":         return <BarChartWidget {...commonProps} />
// // // // // // // // //     case "pie-chart":         return <PieChartWidget {...commonProps} />
// // // // // // // // //     case "doughnut-chart":    return <DoughnutChartWidget {...commonProps} />
// // // // // // // // //     case "time-series-chart": return <TimeSeriesChartWidget {...commonProps} />
// // // // // // // // //     case "radial-gauge":
// // // // // // // // //     case "gauge":             return <GaugeWidget {...commonProps} />
// // // // // // // // //     case "map":               return <MapWidget {...commonProps} />
// // // // // // // // //     case "camera":
// // // // // // // // //     case "camera-feed":       return <CameraWidget {...commonProps} />
// // // // // // // // //     case "camera-grid":       return <CameraGridWidget {...commonProps} />
// // // // // // // // //     default:
// // // // // // // // //       return (
// // // // // // // // //         <Empty
// // // // // // // // //           description={`Unknown widget type: ${widget.type}`}
// // // // // // // // //           image={Empty.PRESENTED_IMAGE_SIMPLE}
// // // // // // // // //         />
// // // // // // // // //       )
// // // // // // // // //   }
// // // // // // // // // }

// // // // // // // // // export default WidgetRenderer


// // // // // // // // // // "use client"

// // // // // // // // // // import { useWidgetLiveData } from "../../hooks/useWidgetLiveData"
// // // // // // // // // // import { Empty, Spin } from "antd"

// // // // // // // // // // import ValueCardWidget from "./widgets/ValueCardWidget"
// // // // // // // // // // import StatusCardWidget from "./widgets/StatusCardWidget"
// // // // // // // // // // import AlarmTableWidget from "./widgets/AlarmTableWidget"
// // // // // // // // // // import AlarmCountWidget from "./widgets/AlarmCountWidget"
// // // // // // // // // // import SignalStrengthWidget from "./widgets/SignalStrengthWidget"
// // // // // // // // // // import ProgressBarWidget from "./widgets/ProgressBarWidget"
// // // // // // // // // // import BatteryLevelWidget from "./widgets/BatteryLevelWidget"
// // // // // // // // // // import LineChartWidget from "./widgets/LineChartWidget"
// // // // // // // // // // import BarChartWidget from "./widgets/BarChartWidget"
// // // // // // // // // // import PieChartWidget from "./widgets/PieChartWidget"
// // // // // // // // // // import DoughnutChartWidget from "./widgets/DoughnutChartWidget"
// // // // // // // // // // import TimeSeriesChartWidget from "./widgets/TimeSeriesChartWidget"
// // // // // // // // // // import GaugeWidget from "./widgets/GaugeWidget"
// // // // // // // // // // import MapWidget from "./widgets/MapWidget"
// // // // // // // // // // import CameraWidget from "./widgets/CameraWidget"
// // // // // // // // // // import CameraGridWidget from "./widgets/CameraGridWidget"

// // // // // // // // // // const WidgetRenderer = ({ widget, config }) => {
// // // // // // // // // //   // Always call hooks unconditionally!
// // // // // // // // // //   const dataSourceType = config?.dataSource?.type
// // // // // // // // // //   const telemetryKeys = config?.dataSource?.telemetry || []
// // // // // // // // // //   // Live data for all types
// // // // // // // // // //   const liveData = useWidgetLiveData(config)
// // // // // // // // // //   // Fallback to config.data if not live (for static/mock)
// // // // // // // // // //   const data = dataSourceType ? liveData : (config.data || [])

// // // // // // // // // //   // Loading states
// // // // // // // // // //   if (dataSourceType && !telemetryKeys.length) {
// // // // // // // // // //     return (
// // // // // // // // // //       <div style={{ padding: 24, textAlign: "center" }}>
// // // // // // // // // //         No telemetry keys selected.
// // // // // // // // // //       </div>
// // // // // // // // // //     )
// // // // // // // // // //   }
// // // // // // // // // //   if (dataSourceType && !data.length) {
// // // // // // // // // //     return (
// // // // // // // // // //       <div style={{ padding: 24, textAlign: "center" }}>
// // // // // // // // // //         <Spin tip="Waiting for data..." />
// // // // // // // // // //       </div>
// // // // // // // // // //     )
// // // // // // // // // //   }

// // // // // // // // // //   const commonProps = { ...config, data, theme: config.theme || "light" }

// // // // // // // // // //   switch (widget.type) {
// // // // // // // // // //     case "value-card":
// // // // // // // // // //       return <ValueCardWidget {...commonProps} />
// // // // // // // // // //     case "status-card":
// // // // // // // // // //       return <StatusCardWidget {...commonProps} />
// // // // // // // // // //     case "alarm-table":
// // // // // // // // // //       return <AlarmTableWidget {...commonProps} />
// // // // // // // // // //     case "alarm-count":
// // // // // // // // // //       return <AlarmCountWidget {...commonProps} />
// // // // // // // // // //     case "signal-strength":
// // // // // // // // // //       return <SignalStrengthWidget {...commonProps} />
// // // // // // // // // //     case "progress-bar":
// // // // // // // // // //       return <ProgressBarWidget {...commonProps} />
// // // // // // // // // //     case "battery-level":
// // // // // // // // // //       return <BatteryLevelWidget {...commonProps} />
// // // // // // // // // //     case "line-chart":
// // // // // // // // // //       return <LineChartWidget {...commonProps} />
// // // // // // // // // //     case "bar-chart":
// // // // // // // // // //       return <BarChartWidget {...commonProps} />
// // // // // // // // // //     case "pie-chart":
// // // // // // // // // //       return <PieChartWidget {...commonProps} />
// // // // // // // // // //     case "doughnut-chart":
// // // // // // // // // //       return <DoughnutChartWidget {...commonProps} />
// // // // // // // // // //     case "time-series-chart":
// // // // // // // // // //       return <TimeSeriesChartWidget {...commonProps} />
// // // // // // // // // //     case "gauge":
// // // // // // // // // //       return <GaugeWidget {...commonProps} />
// // // // // // // // // //     case "map":
// // // // // // // // // //       return <MapWidget {...commonProps} />
// // // // // // // // // //     case "camera":
// // // // // // // // // //     case "camera-feed":
// // // // // // // // // //       return <CameraWidget {...commonProps} />
// // // // // // // // // //     case "camera-grid":
// // // // // // // // // //       return <CameraGridWidget {...commonProps} />
// // // // // // // // // //     default:
// // // // // // // // // //       return (
// // // // // // // // // //         <Empty
// // // // // // // // // //           description={`Unknown widget type: ${widget.type}`}
// // // // // // // // // //           image={Empty.PRESENTED_IMAGE_SIMPLE}
// // // // // // // // // //         />
// // // // // // // // // //       )
// // // // // // // // // //   }
// // // // // // // // // // }

// // // // // // // // // // export default WidgetRenderer


// // // // // // // // // // // "use client"

// // // // // // // // // // // import { useEffect, useRef, useState } from "react"
// // // // // // // // // // // import { Empty, Spin } from "antd"
// // // // // // // // // // // import { connectAndSubscribe, disconnect } from "../../services/mqttClient"

// // // // // // // // // // // import ValueCardWidget from "./widgets/ValueCardWidget"
// // // // // // // // // // // import StatusCardWidget from "./widgets/StatusCardWidget"
// // // // // // // // // // // import AlarmTableWidget from "./widgets/AlarmTableWidget"
// // // // // // // // // // // import AlarmCountWidget from "./widgets/AlarmCountWidget"
// // // // // // // // // // // import SignalStrengthWidget from "./widgets/SignalStrengthWidget"
// // // // // // // // // // // import ProgressBarWidget from "./widgets/ProgressBarWidget"
// // // // // // // // // // // import BatteryLevelWidget from "./widgets/BatteryLevelWidget"
// // // // // // // // // // // import LineChartWidget from "./widgets/LineChartWidget"
// // // // // // // // // // // import BarChartWidget from "./widgets/BarChartWidget"
// // // // // // // // // // // import PieChartWidget from "./widgets/PieChartWidget"
// // // // // // // // // // // import DoughnutChartWidget from "./widgets/DoughnutChartWidget"
// // // // // // // // // // // import TimeSeriesChartWidget from "./widgets/TimeSeriesChartWidget"
// // // // // // // // // // // import GaugeWidget from "./widgets/GaugeWidget"
// // // // // // // // // // // import MapWidget from "./widgets/MapWidget"
// // // // // // // // // // // import CameraWidget from "./widgets/CameraWidget"
// // // // // // // // // // // import CameraGridWidget from "./widgets/CameraGridWidget"

// // // // // // // // // // // const MAX_CHART_POINTS = 100

// // // // // // // // // // // const WidgetRenderer = ({ widget, config }) => {
// // // // // // // // // // //   const [liveData, setLiveData] = useState([])
// // // // // // // // // // //   const mqttClientRef = useRef(null)

// // // // // // // // // // //   // Compute the MQTT topic
// // // // // // // // // // //   const topic =
// // // // // // // // // // //     config?.dataSource?.mqttTopic ||
// // // // // // // // // // //     config?.dataSource?.topic ||
// // // // // // // // // // //     (config?.dataSource?.deviceId
// // // // // // // // // // //       ? `devices/${config.dataSource.deviceId}/up/data`
// // // // // // // // // // //       : "")

// // // // // // // // // // //   // Get telemetry keys
// // // // // // // // // // //   const telemetryKeys = config?.dataSource?.telemetry || []

// // // // // // // // // // //   // Subscribe to MQTT topic & buffer data
// // // // // // // // // // //   useEffect(() => {
// // // // // // // // // // //     if (
// // // // // // // // // // //       !widget ||
// // // // // // // // // // //       !topic ||
// // // // // // // // // // //       !telemetryKeys.length
// // // // // // // // // // //     ) {
// // // // // // // // // // //       setLiveData([])
// // // // // // // // // // //       disconnect()
// // // // // // // // // // //       return
// // // // // // // // // // //     }

// // // // // // // // // // //     let buffer = []

// // // // // // // // // // //     mqttClientRef.current = connectAndSubscribe({
// // // // // // // // // // //       topic,
// // // // // // // // // // //       onMessage: (receivedTopic, payload) => {
// // // // // // // // // // //         const now = new Date().toISOString()
// // // // // // // // // // //         // 1. If chart: accumulate, else: just use latest
// // // // // // // // // // //         if (widget.type.endsWith("chart") || widget.type === "time-series-chart") {
// // // // // // // // // // //           // Each point = { time, ...telemetryKeys }
// // // // // // // // // // //           const point = { time: now }
// // // // // // // // // // //           telemetryKeys.forEach(k => {
// // // // // // // // // // //             point[k] = payload[k]
// // // // // // // // // // //           })
// // // // // // // // // // //           buffer = [...buffer, point].slice(-MAX_CHART_POINTS)
// // // // // // // // // // //           setLiveData([...buffer])
// // // // // // // // // // //         } else {
// // // // // // // // // // //           // Value cards etc: just keep the latest value
// // // // // // // // // // //           const last = {}
// // // // // // // // // // //           telemetryKeys.forEach(k => {
// // // // // // // // // // //             last[k] = payload[k]
// // // // // // // // // // //           })
// // // // // // // // // // //           setLiveData([last])
// // // // // // // // // // //         }
// // // // // // // // // // //       },
// // // // // // // // // // //       clientId: `widget-${widget.id}`,
// // // // // // // // // // //     })

// // // // // // // // // // //     return () => {
// // // // // // // // // // //       disconnect()
// // // // // // // // // // //       setLiveData([])
// // // // // // // // // // //       buffer = []
// // // // // // // // // // //     }
// // // // // // // // // // //     // eslint-disable-next-line
// // // // // // // // // // //   }, [
// // // // // // // // // // //     widget?.id,
// // // // // // // // // // //     topic,
// // // // // // // // // // //     JSON.stringify(telemetryKeys),
// // // // // // // // // // //   ])

// // // // // // // // // // //   // For "loading" state
// // // // // // // // // // //   if (!telemetryKeys.length) {
// // // // // // // // // // //     return (
// // // // // // // // // // //       <div style={{ padding: 24, textAlign: "center" }}>
// // // // // // // // // // //         No telemetry keys selected.
// // // // // // // // // // //       </div>
// // // // // // // // // // //     )
// // // // // // // // // // //   }
// // // // // // // // // // //   if (!liveData.length) {
// // // // // // // // // // //     return (
// // // // // // // // // // //       <div style={{ padding: 24, textAlign: "center" }}>
// // // // // // // // // // //         <Spin tip="Waiting for data..." />
// // // // // // // // // // //       </div>
// // // // // // // // // // //     )
// // // // // // // // // // //   }

// // // // // // // // // // //   // Compose props for widgets
// // // // // // // // // // //   const commonProps = { ...config, data: liveData, theme: config.theme || "light" }

// // // // // // // // // // //   // Render correct widget
// // // // // // // // // // //   switch (widget.type) {
// // // // // // // // // // //     case "value-card":
// // // // // // // // // // //       return <ValueCardWidget {...commonProps} />
// // // // // // // // // // //     case "status-card":
// // // // // // // // // // //       return <StatusCardWidget {...commonProps} />
// // // // // // // // // // //     case "alarm-table":
// // // // // // // // // // //       return <AlarmTableWidget {...commonProps} />
// // // // // // // // // // //     case "alarm-count":
// // // // // // // // // // //       return <AlarmCountWidget {...commonProps} />
// // // // // // // // // // //     case "signal-strength":
// // // // // // // // // // //       return <SignalStrengthWidget {...commonProps} />
// // // // // // // // // // //     case "progress-bar":
// // // // // // // // // // //       return <ProgressBarWidget {...commonProps} />
// // // // // // // // // // //     case "battery-level":
// // // // // // // // // // //       return <BatteryLevelWidget {...commonProps} />
// // // // // // // // // // //     case "line-chart":
// // // // // // // // // // //       return <LineChartWidget {...commonProps} />
// // // // // // // // // // //     case "bar-chart":
// // // // // // // // // // //       return <BarChartWidget {...commonProps} />
// // // // // // // // // // //     case "pie-chart":
// // // // // // // // // // //       return <PieChartWidget {...commonProps} />
// // // // // // // // // // //     case "doughnut-chart":
// // // // // // // // // // //       return <DoughnutChartWidget {...commonProps} />
// // // // // // // // // // //     case "time-series-chart":
// // // // // // // // // // //       return <TimeSeriesChartWidget {...commonProps} />
// // // // // // // // // // //     case "gauge":
// // // // // // // // // // //       return <GaugeWidget {...commonProps} />
// // // // // // // // // // //     case "map":
// // // // // // // // // // //       return <MapWidget {...commonProps} />
// // // // // // // // // // //     case "camera":
// // // // // // // // // // //     case "camera-feed":
// // // // // // // // // // //       return <CameraWidget {...commonProps} />
// // // // // // // // // // //     case "camera-grid":
// // // // // // // // // // //       return <CameraGridWidget {...commonProps} />
// // // // // // // // // // //     default:
// // // // // // // // // // //       return (
// // // // // // // // // // //         <Empty
// // // // // // // // // // //           description={`Unknown widget type: ${widget.type}`}
// // // // // // // // // // //           image={Empty.PRESENTED_IMAGE_SIMPLE}
// // // // // // // // // // //         />
// // // // // // // // // // //       )
// // // // // // // // // // //   }
// // // // // // // // // // // }

// // // // // // // // // // // export default WidgetRenderer

// // // // // // // // // // // // "use client"

// // // // // // // // // // // // import { Empty, Spin } from "antd"
// // // // // // // // // // // // import ValueCardWidget from "./widgets/ValueCardWidget"
// // // // // // // // // // // // import StatusCardWidget from "./widgets/StatusCardWidget"
// // // // // // // // // // // // import AlarmTableWidget from "./widgets/AlarmTableWidget"
// // // // // // // // // // // // import AlarmCountWidget from "./widgets/AlarmCountWidget"
// // // // // // // // // // // // import SignalStrengthWidget from "./widgets/SignalStrengthWidget"
// // // // // // // // // // // // import ProgressBarWidget from "./widgets/ProgressBarWidget"
// // // // // // // // // // // // import BatteryLevelWidget from "./widgets/BatteryLevelWidget"
// // // // // // // // // // // // import LineChartWidget from "./widgets/LineChartWidget"
// // // // // // // // // // // // import BarChartWidget from "./widgets/BarChartWidget"
// // // // // // // // // // // // import PieChartWidget from "./widgets/PieChartWidget"
// // // // // // // // // // // // import DoughnutChartWidget from "./widgets/DoughnutChartWidget"
// // // // // // // // // // // // import TimeSeriesChartWidget from "./widgets/TimeSeriesChartWidget"
// // // // // // // // // // // // import GaugeWidget from "./widgets/GaugeWidget"
// // // // // // // // // // // // import MapWidget from "./widgets/MapWidget"
// // // // // // // // // // // // import CameraWidget from "./widgets/CameraWidget"
// // // // // // // // // // // // import CameraGridWidget from "./widgets/CameraGridWidget"

// // // // // // // // // // // // const WidgetRenderer = ({ widget, config }) => {
// // // // // // // // // // // //   if (!widget) {
// // // // // // // // // // // //     return (
// // // // // // // // // // // //       <div style={{ padding: 8, height: "100%" }}>
// // // // // // // // // // // //         <Empty description="Widget not found" />
// // // // // // // // // // // //       </div>
// // // // // // // // // // // //     )
// // // // // // // // // // // //   }

// // // // // // // // // // // //   if (!config || !config.data) {
// // // // // // // // // // // //     return (
// // // // // // // // // // // //       <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120, padding: 8 }}>
// // // // // // // // // // // //         <Spin tip="Loading..." />
// // // // // // // // // // // //       </div>
// // // // // // // // // // // //     )
// // // // // // // // // // // //   }

// // // // // // // // // // // //   const theme = config.theme || "light"
// // // // // // // // // // // //   const themeClass = `widget-theme-${theme}`

// // // // // // // // // // // //   const renderWidget = () => {
// // // // // // // // // // // //     switch (widget.type) {
// // // // // // // // // // // //       case "value-card":
// // // // // // // // // // // //         return <ValueCardWidget {...config} theme={theme} />
// // // // // // // // // // // //       case "status-card":
// // // // // // // // // // // //         return <StatusCardWidget {...config} theme={theme} />
// // // // // // // // // // // //       case "alarm-table":
// // // // // // // // // // // //         return <AlarmTableWidget {...config} theme={theme} />
// // // // // // // // // // // //       case "alarm-count":
// // // // // // // // // // // //         return <AlarmCountWidget {...config} theme={theme} />
// // // // // // // // // // // //       case "signal-strength":
// // // // // // // // // // // //         return <SignalStrengthWidget {...config} theme={theme} />
// // // // // // // // // // // //       case "progress-bar":
// // // // // // // // // // // //         return <ProgressBarWidget {...config} theme={theme} />
// // // // // // // // // // // //       case "battery-level":
// // // // // // // // // // // //         return <BatteryLevelWidget {...config} theme={theme} />
// // // // // // // // // // // //       case "line-chart":
// // // // // // // // // // // //         return <LineChartWidget {...config} theme={theme} />
// // // // // // // // // // // //       case "bar-chart":
// // // // // // // // // // // //         return <BarChartWidget {...config} theme={theme} />
// // // // // // // // // // // //       case "pie-chart":
// // // // // // // // // // // //         return <PieChartWidget {...config} theme={theme} />
// // // // // // // // // // // //       case "doughnut-chart":
// // // // // // // // // // // //         return <DoughnutChartWidget {...config} theme={theme} />
// // // // // // // // // // // //       case "time-series-chart":
// // // // // // // // // // // //         return <TimeSeriesChartWidget {...config} theme={theme} />
// // // // // // // // // // // //       case "gauge":
// // // // // // // // // // // //         return <GaugeWidget {...config} theme={theme} />
// // // // // // // // // // // //       case "map":
// // // // // // // // // // // //         return <MapWidget {...config} theme={theme} />
// // // // // // // // // // // //       case "camera":
// // // // // // // // // // // //       case "camera-feed":
// // // // // // // // // // // //         return <CameraWidget {...config} theme={theme} />
// // // // // // // // // // // //       case "camera-grid":
// // // // // // // // // // // //         return <CameraGridWidget {...config} theme={theme} />
// // // // // // // // // // // //       default:
// // // // // // // // // // // //         return (
// // // // // // // // // // // //           <Empty
// // // // // // // // // // // //             description={`Unknown widget type: ${widget.type}`}
// // // // // // // // // // // //             image={Empty.PRESENTED_IMAGE_SIMPLE}
// // // // // // // // // // // //           />
// // // // // // // // // // // //         )
// // // // // // // // // // // //     }
// // // // // // // // // // // //   }

// // // // // // // // // // // //   return (
// // // // // // // // // // // //     <div
// // // // // // // // // // // //       className={`widget-render-container ${themeClass}`}
// // // // // // // // // // // //       style={{
// // // // // // // // // // // //         width: "100%",
// // // // // // // // // // // //         height: "100%",
// // // // // // // // // // // //         minHeight: 0,
// // // // // // // // // // // //         // padding: 4,
// // // // // // // // // // // //         boxSizing: "border-box",
// // // // // // // // // // // //       }}
// // // // // // // // // // // //     >
// // // // // // // // // // // //       {renderWidget()}
// // // // // // // // // // // //     </div>
// // // // // // // // // // // //   )
// // // // // // // // // // // // }

// // // // // // // // // // // // export default WidgetRenderer


// // // // // // // // // // // // // "use client"

// // // // // // // // // // // // // import { Card, Empty, Spin } from "antd"
// // // // // // // // // // // // // import ValueCardWidget from "./widgets/ValueCardWidget"
// // // // // // // // // // // // // import StatusCardWidget from "./widgets/StatusCardWidget"
// // // // // // // // // // // // // import AlarmTableWidget from "./widgets/AlarmTableWidget"
// // // // // // // // // // // // // import AlarmCountWidget from "./widgets/AlarmCountWidget"
// // // // // // // // // // // // // import SignalStrengthWidget from "./widgets/SignalStrengthWidget"
// // // // // // // // // // // // // import ProgressBarWidget from "./widgets/ProgressBarWidget"
// // // // // // // // // // // // // import BatteryLevelWidget from "./widgets/BatteryLevelWidget"
// // // // // // // // // // // // // import LineChartWidget from "./widgets/LineChartWidget"
// // // // // // // // // // // // // import BarChartWidget from "./widgets/BarChartWidget"
// // // // // // // // // // // // // import PieChartWidget from "./widgets/PieChartWidget"
// // // // // // // // // // // // // import DoughnutChartWidget from "./widgets/DoughnutChartWidget"
// // // // // // // // // // // // // import TimeSeriesChartWidget from "./widgets/TimeSeriesChartWidget"
// // // // // // // // // // // // // import GaugeWidget from "./widgets/GaugeWidget"
// // // // // // // // // // // // // import MapWidget from "./widgets/MapWidget"
// // // // // // // // // // // // // import CameraWidget from "./widgets/CameraWidget"
// // // // // // // // // // // // // import CameraGridWidget from "./widgets/CameraGridWidget"

// // // // // // // // // // // // // const WidgetRenderer = ({ widget, config }) => {
// // // // // // // // // // // // //   if (!widget) {
// // // // // // // // // // // // //     return <Empty description="Widget not found" />
// // // // // // // // // // // // //   }

// // // // // // // // // // // // //   if (!config || !config.data) {
// // // // // // // // // // // // //     return (
// // // // // // // // // // // // //       <Card title={widget.title} style={{ height: "auto"}}>
// // // // // // // // // // // // //         <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
// // // // // // // // // // // // //           <Spin tip="Loading data..." />
// // // // // // // // // // // // //         </div>
// // // // // // // // // // // // //       </Card>
// // // // // // // // // // // // //     )
// // // // // // // // // // // // //   }

// // // // // // // // // // // // //   const theme = config.theme || "light"
// // // // // // // // // // // // //   const themeClass = `widget-theme-${theme}`

// // // // // // // // // // // // //   const renderWidget = () => {
// // // // // // // // // // // // //     switch (widget.type) {
// // // // // // // // // // // // //       case "value-card":
// // // // // // // // // // // // //         return <ValueCardWidget {...config} theme={theme} />
// // // // // // // // // // // // //       case "status-card":
// // // // // // // // // // // // //         return <StatusCardWidget {...config} theme={theme} />
// // // // // // // // // // // // //       case "alarm-table":
// // // // // // // // // // // // //         return <AlarmTableWidget {...config} theme={theme} />
// // // // // // // // // // // // //       case "alarm-count":
// // // // // // // // // // // // //         return <AlarmCountWidget {...config} theme={theme} />
// // // // // // // // // // // // //       case "signal-strength":
// // // // // // // // // // // // //         return <SignalStrengthWidget {...config} theme={theme} />
// // // // // // // // // // // // //       case "progress-bar":
// // // // // // // // // // // // //         return <ProgressBarWidget {...config} theme={theme} />
// // // // // // // // // // // // //       case "battery-level":
// // // // // // // // // // // // //         return <BatteryLevelWidget {...config} theme={theme} />
// // // // // // // // // // // // //       case "line-chart":
// // // // // // // // // // // // //         return <LineChartWidget {...config} theme={theme} />
// // // // // // // // // // // // //       case "bar-chart":
// // // // // // // // // // // // //         return <BarChartWidget {...config} theme={theme} />
// // // // // // // // // // // // //       case "pie-chart":
// // // // // // // // // // // // //         return <PieChartWidget {...config} theme={theme} />
// // // // // // // // // // // // //       case "doughnut-chart":
// // // // // // // // // // // // //         return <DoughnutChartWidget {...config} theme={theme} />
// // // // // // // // // // // // //       case "time-series-chart":
// // // // // // // // // // // // //         return <TimeSeriesChartWidget {...config} theme={theme} />
// // // // // // // // // // // // //       case "gauge":
// // // // // // // // // // // // //         return <GaugeWidget {...config} theme={theme} />
// // // // // // // // // // // // //       case "map":
// // // // // // // // // // // // //         return <MapWidget {...config} theme={theme} />

// // // // // // // // // // // // //       case "camera":
// // // // // // // // // // // // //       case "camera-feed":
// // // // // // // // // // // // //         return <CameraWidget {...config} theme={theme} />
// // // // // // // // // // // // //       case "camera-grid":
// // // // // // // // // // // // //         return <CameraGridWidget {...config} theme={theme} />
// // // // // // // // // // // // //       default:
// // // // // // // // // // // // //         return <Empty description={`Unknown widget type: ${widget.type}`} image={Empty.PRESENTED_IMAGE_SIMPLE} />
// // // // // // // // // // // // //     }
// // // // // // // // // // // // //   }

// // // // // // // // // // // // //   return <div className={`widget-container ${themeClass}`}>{renderWidget()}</div>
// // // // // // // // // // // // // }

// // // // // // // // // // // // // export default WidgetRenderer
