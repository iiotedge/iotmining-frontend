// src/hooks/useWidgetLiveData.js

import { useEffect, useState, useContext } from "react"
import { MqttContext } from "../services/MqttProvider"

// Color log helpers for console output
const logStyle = {
  mqtt: "color:#38a169;font-weight:bold",
  video: "color:#3182ce;font-weight:bold",
  warn: "color:#e53e3e;font-weight:bold",
  info: "color:#718096",
  unknown: "color:#d53f8c;font-weight:bold",
}

// Normalize protocol string to lowercase
function normalizeProtocol(proto) {
  if (!proto) return ""
  return proto.toString().trim().toLowerCase()
}

// Helper to get nested value from an object by dot-path ("a.b.c")
function getByDotPath(obj, path) {
  if (!path || path === "ROOT") return obj // PATCH: support "ROOT" or empty as full object
  return path.split('.').reduce((acc, part) =>
    acc && Object.prototype.hasOwnProperty.call(acc, part) ? acc[part] : undefined, obj
  )
}

// Helper to set nested value in object by dot-path, creating objects as needed
function setByDotPath(obj, path, value) {
  const parts = path.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== "object") {
      current[parts[i]] = {}
    }
    current = current[parts[i]]
  }
  current[parts[parts.length - 1]] = value
}

export function useWidgetLiveData(widget, config) {
  // Determine protocol from config or defaults
  const protocol =
    normalizeProtocol(
      config?.dataSource?.protocol ||
      (config?.dataSource?.topic ? "mqtt"
        : config?.dataSource?.streamUrl ? "hls"
        : "mqtt")
    )

  // Determine topic for MQTT subscription
  const topic =
    config?.dataSource?.topic ||
    (config?.dataSource?.type === "device" && config?.dataSource?.deviceId
      ? `kepler/devices/${config.dataSource.deviceId}/up/data`
      : null)

  // Telemetry keys array (e.g., ["fans.FAN1.speed", "fans.FAN2.speed"])
  const telemetryKeys = config?.dataSource?.telemetry || []

  // Buffer size for telemetry data points
  const bufferSize = config?.bufferSize || 20

  // Stream URL for video protocols
  const streamUrl = config?.dataSource?.streamUrl

  // MQTT context for subscribe/unsubscribe
  const { subscribe, unsubscribe } = useContext(MqttContext) || {}

  // liveData state holds current telemetry or video stream info
  const [liveData, setLiveData] = useState(
    ["mqtt", "json"].includes(protocol) ? [] : null
  )

  const widgetId = widget?.id || config?.id

  // Effect for MQTT / JSON telemetry subscriptions
  useEffect(() => {
    if (!["mqtt", "json"].includes(protocol)) return

    // If missing topic, telemetry keys (unless isJsonObject), or subscribe function, disable live data
    if (!topic || (!telemetryKeys.length && !config.dataSource?.isJsonObject) || !subscribe) {
      setLiveData([])
      console.log(
        `%c[useWidgetLiveData][${widget.type}] MQTT Disabled: missing topic/keys/subscriber.`,
        logStyle.mqtt,
        { protocol, topic, telemetryKeys, subscribe }
      )
      return
    }

    // MQTT message handler
    const onMessage = (topic, msg) => {
      console.log(`[useWidgetLiveData][${widget.type}] MQTT raw message on topic "${topic}":`, msg)

      let payload = msg

      // Parse string payload as JSON if needed
      if (typeof msg === "string") {
        try {
          payload = JSON.parse(msg)
        } catch (e) {
          console.warn(`[useWidgetLiveData][${widget.type}] JSON parse error:`, e, msg)
          return
        }
      }

      // --- PATCH: Support isJsonObject and "ROOT"/empty path for full JSON ---
      if (config.dataSource?.isJsonObject) {
        const path = config.dataSource.jsonObjectPath
        // If path is empty, "ROOT", or undefined: give full payload
        if (!path || path === "ROOT") {
          setLiveData(payload)
          console.log(`[useWidgetLiveData][${widget.type}] liveData updated with full payload (ROOT):`, payload)
        } else {
          const subtree = getByDotPath(payload, path)
          if (subtree === undefined) {
            console.warn(`[useWidgetLiveData][${widget.type}] jsonObjectPath "${path}" not found in payload`)
            return
          }
          setLiveData(subtree)
          console.log(`[useWidgetLiveData][${widget.type}] liveData updated with JSON subtree at path "${path}":`, subtree)
        }
      }
      // Otherwise use telemetry keys to extract data points and buffer them
      else if (Array.isArray(telemetryKeys) && telemetryKeys.length > 0 && typeof payload === "object" && payload !== null) {
        const latestPoint = { time: new Date().toISOString() }
        telemetryKeys.forEach(k => {
          const val = getByDotPath(payload, k)
          setByDotPath(latestPoint, k, val)
        })
        setLiveData(prev => {
          const newBuffer = [...prev, latestPoint].slice(-bufferSize)
          console.log(`[useWidgetLiveData][${widget.type}] liveData buffer updated:`, newBuffer)
          return newBuffer
        })
      } else {
        console.warn(`[useWidgetLiveData][${widget.type}] Ignored MQTT message: no telemetry keys and no isJsonObject flag`)
      }
    }

    console.log(
      `%c[useWidgetLiveData][${widget.type}] Subscribing to MQTT topic: "%c${topic}%c" [protocol=%c${protocol}%c]`,
      logStyle.mqtt,
      "color:#4294ff;font-weight:bold",
      "",
      "color:#d89c00;font-weight:bold",
      ""
    )

    // Subscribe to MQTT topic
    subscribe(topic, onMessage)

    // Unsubscribe on cleanup
    return () => {
      unsubscribe(topic, onMessage)
      setLiveData([])
      console.log(
        `%c[useWidgetLiveData][${widget.type}] Unsubscribed from MQTT topic: "%c${topic}%c" [protocol=%c${protocol}%c]`,
        logStyle.mqtt,
        "color:#4294ff;font-weight:bold",
        "",
        "color:#d89c00;font-weight:bold",
        ""
      )
    }
  }, [
    protocol,
    topic,
    JSON.stringify(telemetryKeys),
    subscribe,
    unsubscribe,
    widget.type,
    bufferSize,
    config.dataSource?.isJsonObject,
    config.dataSource?.jsonObjectPath
  ])

  // Effect for video protocols (hls, rtsp, http)
  useEffect(() => {
    if (["mqtt", "json"].includes(protocol)) return
    if (["hls", "rtsp", "http"].includes(protocol)) {
      if (streamUrl && typeof streamUrl === "string") {
        setLiveData({ streamUrl })
        console.log(
          `%c[useWidgetLiveData][${widget.type}] Video protocol "${protocol}", using streamUrl: %c${streamUrl}`,
          logStyle.video,
          "color:#fa5252;font-weight:bold"
        )
      } else {
        setLiveData(null)
        console.warn(
          `%c[useWidgetLiveData][${widget.type}] No valid streamUrl for protocol "${protocol}"`,
          logStyle.warn,
          { protocol, streamUrl }
        )
      }
    }
  }, [protocol, streamUrl, widgetId])

  // Warn if protocol not handled
  useEffect(() => {
    if (
      protocol &&
      !["mqtt", "json", "hls", "rtsp", "http"].includes(protocol)
    ) {
      console.info(
        `%c[useWidgetLiveData][${widget.type}] Protocol "%c${protocol}%c" not handled. You may want to add support.`,
        logStyle.unknown,
        "color:#ff9800;font-weight:bold",
        logStyle.unknown
      )
    }
  }, [protocol, widget.type])

  // Log liveData changes for debug
  useEffect(() => {
    console.log(
      `%c[useWidgetLiveData][${widget.type}] liveData state changed:`,
      logStyle.info,
      liveData
    )
  }, [liveData, widget?.type])

  return liveData
}

// // src/hooks/useWidgetLiveData.js

// import { useEffect, useState, useContext } from "react"
// import { MqttContext } from "../services/MqttProvider"

// // Color log helpers for console output
// const logStyle = {
//   mqtt: "color:#38a169;font-weight:bold",
//   video: "color:#3182ce;font-weight:bold",
//   warn: "color:#e53e3e;font-weight:bold",
//   info: "color:#718096",
//   unknown: "color:#d53f8c;font-weight:bold",
// }

// // Normalize protocol string to lowercase
// function normalizeProtocol(proto) {
//   if (!proto) return ""
//   return proto.toString().trim().toLowerCase()
// }

// // Helper to get nested value from an object by dot-path ("a.b.c")
// function getByDotPath(obj, path) {
//   return path.split('.').reduce((acc, part) =>
//     acc && Object.prototype.hasOwnProperty.call(acc, part) ? acc[part] : undefined, obj
//   )
// }

// // Helper to set nested value in object by dot-path, creating objects as needed
// function setByDotPath(obj, path, value) {
//   const parts = path.split('.')
//   let current = obj
//   for (let i = 0; i < parts.length - 1; i++) {
//     if (!current[parts[i]] || typeof current[parts[i]] !== "object") {
//       current[parts[i]] = {}
//     }
//     current = current[parts[i]]
//   }
//   current[parts[parts.length - 1]] = value
// }

// export function useWidgetLiveData(widget, config) {
//   // Determine protocol from config or defaults
//   const protocol =
//     normalizeProtocol(
//       config?.dataSource?.protocol ||
//       (config?.dataSource?.topic ? "mqtt"
//         : config?.dataSource?.streamUrl ? "hls"
//         : "mqtt")
//     )

//   // Determine topic for MQTT subscription
//   const topic =
//     config?.dataSource?.topic ||
//     (config?.dataSource?.type === "device" && config?.dataSource?.deviceId
//       ? `kepler/devices/${config.dataSource.deviceId}/up/data`
//       : null)

//   // Telemetry keys array (e.g., ["fans.FAN1.speed", "fans.FAN2.speed"])
//   const telemetryKeys = config?.dataSource?.telemetry || []

//   // Buffer size for telemetry data points
//   const bufferSize = config?.bufferSize || 20

//   // Stream URL for video protocols
//   const streamUrl = config?.dataSource?.streamUrl

//   // MQTT context for subscribe/unsubscribe
//   const { subscribe, unsubscribe } = useContext(MqttContext) || {}

//   // liveData state holds current telemetry or video stream info
//   const [liveData, setLiveData] = useState(
//     ["mqtt", "json"].includes(protocol) ? [] : null
//   )

//   const widgetId = widget?.id || config?.id

//   // Effect for MQTT / JSON telemetry subscriptions
//   useEffect(() => {
//     if (!["mqtt", "json"].includes(protocol)) return

//     // If missing topic, telemetry keys (unless isJsonObject), or subscribe function, disable live data
//     if (!topic || (!telemetryKeys.length && !config.dataSource?.isJsonObject) || !subscribe) {
//       setLiveData([])
//       console.log(
//         `%c[useWidgetLiveData][${widget.type}] MQTT Disabled: missing topic/keys/subscriber.`,
//         logStyle.mqtt,
//         { protocol, topic, telemetryKeys, subscribe }
//       )
//       return
//     }

//     // MQTT message handler
//     const onMessage = (topic, msg) => {
//       console.log(`[useWidgetLiveData][${widget.type}] MQTT raw message on topic "${topic}":`, msg)

//       let payload = msg

//       // Parse string payload as JSON if needed
//       if (typeof msg === "string") {
//         try {
//           payload = JSON.parse(msg)
//         } catch (e) {
//           console.warn(`[useWidgetLiveData][${widget.type}] JSON parse error:`, e, msg)
//           return
//         }
//       }

//       // If configured for JSON subtree extraction
//       if (config.dataSource?.isJsonObject) {
//         const path = config.dataSource.jsonObjectPath
//         if (path) {
//           const subtree = getByDotPath(payload, path)
//           if (subtree === undefined) {
//             console.warn(`[useWidgetLiveData][${widget.type}] jsonObjectPath "${path}" not found in payload`)
//             return
//           }
//           setLiveData(subtree)
//           console.log(`[useWidgetLiveData][${widget.type}] liveData updated with JSON subtree at path "${path}":`, subtree)
//         } else {
//           setLiveData(payload)
//           console.log(`[useWidgetLiveData][${widget.type}] liveData updated with full payload:`, payload)
//         }
//       }
//       // Otherwise use telemetry keys to extract data points and buffer them
//       else if (Array.isArray(telemetryKeys) && telemetryKeys.length > 0 && typeof payload === "object" && payload !== null) {
//         const latestPoint = { time: new Date().toISOString() }
//         telemetryKeys.forEach(k => {
//           const val = getByDotPath(payload, k)
//           setByDotPath(latestPoint, k, val)
//         })
//         setLiveData(prev => {
//           const newBuffer = [...prev, latestPoint].slice(-bufferSize)
//           console.log(`[useWidgetLiveData][${widget.type}] liveData buffer updated:`, newBuffer)
//           return newBuffer
//         })
//       } else {
//         console.warn(`[useWidgetLiveData][${widget.type}] Ignored MQTT message: no telemetry keys and no isJsonObject flag`)
//       }
//     }

//     console.log(
//       `%c[useWidgetLiveData][${widget.type}] Subscribing to MQTT topic: "%c${topic}%c" [protocol=%c${protocol}%c]`,
//       logStyle.mqtt,
//       "color:#4294ff;font-weight:bold",
//       "",
//       "color:#d89c00;font-weight:bold",
//       ""
//     )

//     // Subscribe to MQTT topic
//     subscribe(topic, onMessage)

//     // Unsubscribe on cleanup
//     return () => {
//       unsubscribe(topic, onMessage)
//       setLiveData([])
//       console.log(
//         `%c[useWidgetLiveData][${widget.type}] Unsubscribed from MQTT topic: "%c${topic}%c" [protocol=%c${protocol}%c]`,
//         logStyle.mqtt,
//         "color:#4294ff;font-weight:bold",
//         "",
//         "color:#d89c00;font-weight:bold",
//         ""
//       )
//     }
//   }, [
//     protocol,
//     topic,
//     JSON.stringify(telemetryKeys),
//     subscribe,
//     unsubscribe,
//     widget.type,
//     bufferSize,
//     config.dataSource?.isJsonObject,
//     config.dataSource?.jsonObjectPath
//   ])

//   // Effect for video protocols (hls, rtsp, http)
//   useEffect(() => {
//     if (["mqtt", "json"].includes(protocol)) return
//     if (["hls", "rtsp", "http"].includes(protocol)) {
//       if (streamUrl && typeof streamUrl === "string") {
//         setLiveData({ streamUrl })
//         console.log(
//           `%c[useWidgetLiveData][${widget.type}] Video protocol "${protocol}", using streamUrl: %c${streamUrl}`,
//           logStyle.video,
//           "color:#fa5252;font-weight:bold"
//         )
//       } else {
//         setLiveData(null)
//         console.warn(
//           `%c[useWidgetLiveData][${widget.type}] No valid streamUrl for protocol "${protocol}"`,
//           logStyle.warn,
//           { protocol, streamUrl }
//         )
//       }
//     }
//   }, [protocol, streamUrl, widgetId])

//   // Warn if protocol not handled
//   useEffect(() => {
//     if (
//       protocol &&
//       !["mqtt", "json", "hls", "rtsp", "http"].includes(protocol)
//     ) {
//       console.info(
//         `%c[useWidgetLiveData][${widget.type}] Protocol "%c${protocol}%c" not handled. You may want to add support.`,
//         logStyle.unknown,
//         "color:#ff9800;font-weight:bold",
//         logStyle.unknown
//       )
//     }
//   }, [protocol, widget.type])

//   // Log liveData changes for debug
//   useEffect(() => {
//     console.log(
//       `%c[useWidgetLiveData][${widget.type}] liveData state changed:`,
//       logStyle.info,
//       liveData
//     )
//   }, [liveData, widget?.type])

//   return liveData
// }


// // // src/hooks/useWidgetLiveData.js

// // import { useEffect, useState, useContext } from "react"
// // import { MqttContext } from "../services/MqttProvider"

// // // Color log helpers
// // const logStyle = {
// //   mqtt: "color:#38a169;font-weight:bold",
// //   video: "color:#3182ce;font-weight:bold",
// //   http: "color:#b7791f;font-weight:bold",
// //   warn: "color:#e53e3e;font-weight:bold",
// //   info: "color:#718096",
// //   unknown: "color:#d53f8c;font-weight:bold",
// // }

// // // Protocol normalization helper
// // function normalizeProtocol(proto) {
// //   if (!proto) return ""
// //   return proto.toString().trim().toLowerCase()
// // }

// // // Helper to get nested value from object by dot-path
// // function getByDotPath(obj, path) {
// //   return path.split('.').reduce((acc, part) =>
// //     acc && Object.prototype.hasOwnProperty.call(acc, part) ? acc[part] : undefined, obj
// //   )
// // }

// // // Helper to set nested value in object by dot-path, creating objects as needed
// // function setByDotPath(obj, path, value) {
// //   const parts = path.split('.')
// //   let current = obj
// //   for (let i = 0; i < parts.length - 1; i++) {
// //     if (!current[parts[i]] || typeof current[parts[i]] !== "object") {
// //       current[parts[i]] = {}
// //     }
// //     current = current[parts[i]]
// //   }
// //   current[parts[parts.length - 1]] = value
// // }

// // export function useWidgetLiveData(widget, config) {
// //   // Protocol logic: check config, guess by keys, fallback to "mqtt"
// //   const protocol =
// //     normalizeProtocol(
// //       config?.dataSource?.protocol ||
// //       (config?.dataSource?.topic ? "mqtt"
// //         : config?.dataSource?.streamUrl ? "hls"
// //         : "mqtt")
// //     )
// //   const topic =
// //     config?.dataSource?.topic ||
// //     (config?.dataSource?.type === "device" && config?.dataSource?.deviceId
// //       ? `kepler/devices/${config.dataSource.deviceId}/up/data`
// //       : null)
// //   const telemetryKeys = config?.dataSource?.telemetry || []
// //   const bufferSize = config?.bufferSize || 20
// //   const streamUrl = config?.dataSource?.streamUrl

// //   // MQTT context (if needed)
// //   const { subscribe, unsubscribe } = useContext(MqttContext) || {}
// //   const [liveData, setLiveData] = useState(
// //     ["mqtt", "json"].includes(protocol) ? [] : null
// //   )
// //   const widgetId = widget?.id || config?.id

// //   // ---- PROTOCOL HANDLING ----

// //   // --- 1. MQTT/JSON telemetry ---
// //   useEffect(() => {
// //     if (!["mqtt", "json"].includes(protocol)) return // Only run this effect for MQTT/JSON

// //     if (!topic || !telemetryKeys.length || !subscribe) {
// //       setLiveData([])
// //       console.log(
// //         `%c[useWidgetLiveData][${widget.type}] MQTT Disabled: missing topic/keys/subscriber.`,
// //         logStyle.mqtt,
// //         { protocol, topic, telemetryKeys, subscribe }
// //       )
// //       return
// //     }

// //     const onMessage = (topic, msg) => {
// //       if (typeof msg === "object" && msg !== null) {
// //         const latestPoint = { time: new Date().toISOString() }
// //         telemetryKeys.forEach((k) => {
// //           const val = getByDotPath(msg, k)
// //           setByDotPath(latestPoint, k, val)
// //         })
// //         setLiveData((prev) => {
// //           const newBuffer = [...prev, latestPoint].slice(-bufferSize)
// //           console.log(
// //             `%c[useWidgetLiveData][${widget.type}] MQTT buffer (${protocol}):`,
// //             logStyle.mqtt,
// //             newBuffer
// //           )
// //           return newBuffer
// //         })
// //       } else {
// //         console.warn(
// //           `%c[useWidgetLiveData][${widget.type}] Ignored invalid MQTT message on "${topic}":`,
// //           logStyle.warn,
// //           msg
// //         )
// //       }
// //     }

// //     console.log(
// //       `%c[useWidgetLiveData][${widget.type}] Subscribing to MQTT topic: "${topic}" [protocol=${protocol}]`,
// //       logStyle.mqtt
// //     )
// //     subscribe(topic, onMessage)
// //     return () => {
// //       unsubscribe(topic, onMessage)
// //       setLiveData([])
// //       console.log(
// //         `%c[useWidgetLiveData][${widget.type}] Unsubscribed from MQTT topic: "${topic}" [protocol=${protocol}]`,
// //         logStyle.mqtt
// //       )
// //     }
// //     // eslint-disable-next-line
// //   }, [protocol, topic, JSON.stringify(telemetryKeys), widgetId, bufferSize])

// //   // --- 2. HLS / RTSP / HTTP video protocols ---
// //   useEffect(() => {
// //     if (["mqtt", "json"].includes(protocol)) return // Skip for MQTT/JSON
// //     if (["hls", "rtsp", "http"].includes(protocol)) {
// //       if (streamUrl && typeof streamUrl === "string") {
// //         setLiveData({ streamUrl })
// //         console.log(
// //           `%c[useWidgetLiveData][${widget.type}] Video protocol "${protocol}", using streamUrl: %c${streamUrl}`,
// //           logStyle.video,
// //           "color:#fa5252;font-weight:bold"
// //         )
// //       } else {
// //         setLiveData(null)
// //         console.warn(
// //           `%c[useWidgetLiveData][${widget.type}] No valid streamUrl for protocol "${protocol}"`,
// //           logStyle.warn,
// //           { protocol, streamUrl }
// //         )
// //       }
// //     }
// //     // For telemetry over HTTP/CoAP/etc, you would add a fetch logic here
// //   }, [protocol, streamUrl, widgetId])

// //   // --- 3. Placeholder: HTTP telemetry / CoAP etc ---
// //   // TODO: Add HTTP polling logic if needed

// //   // --- 4. Protocol not handled ---
// //   useEffect(() => {
// //     if (
// //       protocol &&
// //       !["mqtt", "json", "hls", "rtsp", "http"].includes(protocol)
// //     ) {
// //       console.info(
// //         `%c[useWidgetLiveData][${widget.type}] Protocol "%c${protocol}%c" not handled. You may want to add support.`,
// //         logStyle.unknown,
// //         "color:#ff9800;font-weight:bold",
// //         logStyle.unknown
// //       )
// //     }
// //   }, [protocol, widget.type])

// //   return liveData
// // }


// // // // src/hooks/useWidgetLiveData.js

// // // import { useEffect, useState, useContext } from "react"
// // // import { MqttContext } from "../services/MqttProvider"

// // // // Color log helpers
// // // const logStyle = {
// // //   mqtt: "color:#38a169;font-weight:bold",
// // //   video: "color:#3182ce;font-weight:bold",
// // //   http: "color:#b7791f;font-weight:bold",
// // //   warn: "color:#e53e3e;font-weight:bold",
// // //   info: "color:#718096",
// // //   unknown: "color:#d53f8c;font-weight:bold",
// // // }

// // // // Protocol normalization helper
// // // function normalizeProtocol(proto) {
// // //   if (!proto) return ""
// // //   return proto.toString().trim().toLowerCase()
// // // }

// // // export function useWidgetLiveData(widget, config) {
// // //   // Protocol logic: check config, guess by keys, fallback to "mqtt"
// // //   const protocol =
// // //     normalizeProtocol(
// // //       config?.dataSource?.protocol ||
// // //       (config?.dataSource?.topic ? "mqtt"
// // //         : config?.dataSource?.streamUrl ? "hls"
// // //         : "mqtt")
// // //     )
// // //   const topic =
// // //     config?.dataSource?.topic ||
// // //     (config?.dataSource?.type === "device" && config?.dataSource?.deviceId
// // //       ? `kepler/devices/${config.dataSource.deviceId}/up/data`
// // //       : null)
// // //   const telemetryKeys = config?.dataSource?.telemetry || []
// // //   const bufferSize = config?.bufferSize || 20
// // //   const streamUrl = config?.dataSource?.streamUrl

// // //   // MQTT context (if needed)
// // //   const { subscribe, unsubscribe } = useContext(MqttContext) || {}
// // //   const [liveData, setLiveData] = useState(
// // //     ["mqtt", "json"].includes(protocol) ? [] : null
// // //   )
// // //   const widgetId = widget?.id || config?.id

// // //   // ---- PROTOCOL HANDLING ----

// // //   // --- 1. MQTT/JSON telemetry ---
// // //   useEffect(() => {
// // //     if (!["mqtt", "json"].includes(protocol)) return // Only run this effect for MQTT/JSON

// // //     if (!topic || !telemetryKeys.length || !subscribe) {
// // //       setLiveData([])
// // //       console.log(
// // //         `%c[useWidgetLiveData][${widget.type}] MQTT Disabled: missing topic/keys/subscriber.`,
// // //         logStyle.mqtt,
// // //         { protocol, topic, telemetryKeys, subscribe }
// // //       )
// // //       return
// // //     }
// // //     const onMessage = (topic, msg) => {
// // //       if (typeof msg === "object" && msg !== null) {
// // //         const latestPoint = { time: new Date().toISOString() }
// // //         telemetryKeys.forEach((k) => {
// // //           latestPoint[k] = msg[k]
// // //         })
// // //         setLiveData((prev) => {
// // //           const newBuffer = [...prev, latestPoint].slice(-bufferSize)
// // //           console.log(
// // //             `%c[useWidgetLiveData][${widget.type}] MQTT buffer (${protocol}):`,
// // //             logStyle.mqtt,
// // //             newBuffer
// // //           )
// // //           return newBuffer
// // //         })
// // //       } else {
// // //         console.warn(
// // //           `%c[useWidgetLiveData][${widget.type}] Ignored invalid MQTT message on "${topic}":`,
// // //           logStyle.warn,
// // //           msg
// // //         )
// // //       }
// // //     }
// // //     console.log(
// // //       `%c[useWidgetLiveData][${widget.type}] Subscribing to MQTT topic: "${topic}" [protocol=${protocol}]`,
// // //       logStyle.mqtt
// // //     )
// // //     subscribe(topic, onMessage)
// // //     return () => {
// // //       unsubscribe(topic, onMessage)
// // //       setLiveData([])
// // //       console.log(
// // //         `%c[useWidgetLiveData][${widget.type}] Unsubscribed from MQTT topic: "${topic}" [protocol=${protocol}]`,
// // //         logStyle.mqtt
// // //       )
// // //     }
// // //     // eslint-disable-next-line
// // //   }, [protocol, topic, JSON.stringify(telemetryKeys), widgetId, bufferSize])

// // //   // --- 2. HLS / RTSP / HTTP video protocols ---
// // //   useEffect(() => {
// // //     if (["mqtt", "json"].includes(protocol)) return // Skip for MQTT/JSON
// // //     if (["hls", "rtsp", "http"].includes(protocol)) {
// // //       if (streamUrl && typeof streamUrl === "string") {
// // //         setLiveData({ streamUrl })
// // //         console.log(
// // //           `%c[useWidgetLiveData][${widget.type}] Video protocol "${protocol}", using streamUrl: %c${streamUrl}`,
// // //           logStyle.video,
// // //           "color:#fa5252;font-weight:bold"
// // //         )
// // //       } else {
// // //         setLiveData(null)
// // //         console.warn(
// // //           `%c[useWidgetLiveData][${widget.type}] No valid streamUrl for protocol "${protocol}"`,
// // //           logStyle.warn,
// // //           { protocol, streamUrl }
// // //         )
// // //       }
// // //     }
// // //     // For telemetry over HTTP/CoAP/etc, you would add a fetch logic here
// // //   }, [protocol, streamUrl, widgetId])

// // //   // --- 3. Placeholder: HTTP telemetry / CoAP etc ---
// // //   // TODO: Add HTTP polling logic if needed

// // //   // --- 4. Protocol not handled ---
// // //   useEffect(() => {
// // //     if (
// // //       protocol &&
// // //       !["mqtt", "json", "hls", "rtsp", "http"].includes(protocol)
// // //     ) {
// // //       console.info(
// // //         `%c[useWidgetLiveData][${widget.type}] Protocol "%c${protocol}%c" not handled. You may want to add support.`,
// // //         logStyle.unknown,
// // //         "color:#ff9800;font-weight:bold",
// // //         logStyle.unknown
// // //       )
// // //     }
// // //   }, [protocol, widget.type])

// // //   return liveData
// // // }


// // // // // src/hooks/useWidgetLiveData.js

// // // // import { useEffect, useRef, useState, useContext } from "react"
// // // // import { MqttContext } from "../services/MqttProvider"

// // // // export function useWidgetLiveData(widget, config) {
// // // //   const topic =
// // // //     config?.dataSource?.topic ||
// // // //     (config?.dataSource?.type === "device" && config?.dataSource?.deviceId
// // // //       ? `kepler/devices/${config.dataSource.deviceId}/up/data`
// // // //       : null)
// // // //   const telemetryKeys = config?.dataSource?.telemetry || []
// // // //   const bufferSize = config?.bufferSize || 20   // Or whatever you want as default!

// // // //   const { subscribe, unsubscribe } = useContext(MqttContext) || {}
// // // //   const [liveData, setLiveData] = useState([])
// // // //   const widgetId = widget?.id || config?.id

// // // //   useEffect(() => {
// // // //     if (!topic || !telemetryKeys.length || !subscribe) {
// // // //       setLiveData([])
// // // //       return
// // // //     }
// // // //     const onMessage = (topic, msg) => {
// // // //       if (typeof msg === "object" && msg !== null) {
// // // //         const latestPoint = { time: new Date().toISOString() }
// // // //         telemetryKeys.forEach((k) => {
// // // //           latestPoint[k] = msg[k]
// // // //         })
// // // //         setLiveData((prev) => {
// // // //           const newBuffer = [...prev, latestPoint].slice(-bufferSize)
// // // //           // For debug:
// // // //           console.log(`[useWidgetLiveData][${widget.type}] Updated buffer:`, newBuffer)
// // // //           return newBuffer
// // // //         })
// // // //       } else {
// // // //         // Ignore invalid data
// // // //         console.warn(`[useWidgetLiveData][${widget.type}] Ignored invalid message on "${topic}":`, msg)
// // // //       }
// // // //     }
// // // //     subscribe(topic, onMessage)
// // // //     return () => {
// // // //       unsubscribe(topic, onMessage)
// // // //       setLiveData([])
// // // //     }
// // // //     // eslint-disable-next-line
// // // //   }, [topic, JSON.stringify(telemetryKeys), widgetId, bufferSize])

// // // //   return liveData
// // // // }


// // // // // // src/hooks/useWidgetLiveData.js

// // // // // import { useEffect, useContext, useState } from "react"
// // // // // import { MqttContext } from "../services/MqttProvider"

// // // // // /**
// // // // //  * useWidgetLiveData
// // // // //  * Subscribes to the given topic via MQTT Context and returns buffered latest data.
// // // // //  * @param {Object} widget - Widget definition (must have .id and .type)
// // // // //  * @param {Object} config - Widget config (must have dataSource with .topic or .deviceId and .telemetry)
// // // // //  * @returns {Array} liveData - array of { key: value, ... }
// // // // //  */
// // // // // export function useWidgetLiveData(widget, config) {
// // // // //   // 1. Resolve topic and telemetry keys
// // // // //   const topic =
// // // // //     config?.dataSource?.topic ||
// // // // //     (config?.dataSource?.type === "device" && config?.dataSource?.deviceId
// // // // //       ? `kepler/devices/${config.dataSource.deviceId}/up/data`
// // // // //       : null)
// // // // //   const telemetryKeys = config?.dataSource?.telemetry || []
// // // // //   const { subscribe, unsubscribe } = useContext(MqttContext) || {}

// // // // //   // 2. Local buffer for data
// // // // //   const [liveData, setLiveData] = useState([])
// // // // //   const widgetId = widget?.id || config?.id

// // // // //   useEffect(() => {
// // // // //     // Guard
// // // // //     if (!topic || !telemetryKeys.length || !subscribe) {
// // // // //       console.log(`[useWidgetLiveData][${widget.type}] Not subscribing: topic/telemetry missing.`, { topic, telemetryKeys })
// // // // //       setLiveData([])
// // // // //       return
// // // // //     }

// // // // //     // Core handler: topic, data
// // // // //     const onMessage = (receivedTopic, msg) => {
// // // // //       console.log(`[useWidgetLiveData][${widget.type}] MQTT received on "${receivedTopic}":`, msg)
// // // // //       if (typeof msg === "object" && msg !== null) {
// // // // //         const latestPoint = { time: new Date().toISOString() }
// // // // //         telemetryKeys.forEach((k) => {
// // // // //           latestPoint[k] = msg[k]
// // // // //         })
// // // // //         setLiveData((prev) => {
// // // // //           const bufferSize = config?.bufferSize || 1
// // // // //           const newBuf = bufferSize > 1
// // // // //             ? [...(prev || []), latestPoint].slice(-bufferSize)
// // // // //             : [latestPoint]
// // // // //           console.log(`[useWidgetLiveData][${widget.type}] Updated buffer:`, newBuf)
// // // // //           return newBuf
// // // // //         })
// // // // //       } else {
// // // // //         console.warn(`[useWidgetLiveData][${widget.type}] Ignored non-object message on "${receivedTopic}":`, msg)
// // // // //       }
// // // // //     }

// // // // //     // Subscribe
// // // // //     subscribe(topic, onMessage)
// // // // //     console.log(`[useWidgetLiveData][${widget.type}] Subscribed to topic: "${topic}"`)

// // // // //     // Cleanup
// // // // //     return () => {
// // // // //       unsubscribe(topic, onMessage)
// // // // //       setLiveData([])
// // // // //       console.log(`[useWidgetLiveData][${widget.type}] Unsubscribed from topic: "${topic}"`)
// // // // //     }
// // // // //     // eslint-disable-next-line
// // // // //   }, [topic, JSON.stringify(telemetryKeys), widgetId])

// // // // //   return liveData
// // // // // }

// // // // // // import { useEffect, useRef, useState, useContext } from "react"
// // // // // // import { MqttContext } from "../services/MqttProvider"

// // // // // // /**
// // // // // //  * useWidgetLiveData
// // // // // //  * - Subscribes to MQTT topic per widget/config and provides latest data for rendering.
// // // // // //  */
// // // // // // export function useWidgetLiveData(widget, config) {
// // // // // //   const topic =
// // // // // //     config?.dataSource?.topic ||
// // // // // //     (config?.dataSource?.type === "device" && config?.dataSource?.deviceId
// // // // // //       ? `kepler/devices/${config.dataSource.deviceId}/up/data`
// // // // // //       : null)
// // // // // //   const telemetryKeys = config?.dataSource?.telemetry || []
// // // // // //   const { subscribe, unsubscribe } = useContext(MqttContext) || {}
// // // // // //   const [liveData, setLiveData] = useState([])
// // // // // //   const widgetId = widget?.id || config?.id

// // // // // //   useEffect(() => {
// // // // // //     if (!topic || !telemetryKeys.length || !subscribe) {
// // // // // //       setLiveData([])
// // // // // //       console.warn(
// // // // // //         `%c[useWidgetLiveData][${widget?.title || widgetId}] Skipped subscribe (missing topic/telemetry)`,
// // // // // //         "color: #f39c12; font-weight: bold;",
// // // // // //         { topic, telemetryKeys }
// // // // // //       )
// // // // // //       return
// // // // // //     }

// // // // // //     const onMessage = (msg) => {
// // // // // //       if (typeof msg === "object" && msg !== null) {
// // // // // //         const latestPoint = { time: new Date().toISOString() }
// // // // // //         telemetryKeys.forEach((k) => {
// // // // // //           latestPoint[k] = msg[k]
// // // // // //         })
// // // // // //         setLiveData((prev) => {
// // // // // //           const bufferSize = config?.bufferSize || 1
// // // // // //           const updated =
// // // // // //             bufferSize > 1
// // // // // //               ? [...(prev || []), latestPoint].slice(-bufferSize)
// // // // // //               : [latestPoint]
// // // // // //           console.log(
// // // // // //             `%c[useWidgetLiveData][${widget?.title || widgetId}] Received data for "${topic}":`,
// // // // // //             "color: #27ae60; font-weight: bold;",
// // // // // //             latestPoint
// // // // // //           )
// // // // // //           return updated
// // // // // //         })
// // // // // //       } else {
// // // // // //         console.warn(
// // // // // //           `%c[useWidgetLiveData][${widget?.title || widgetId}] Ignored invalid message on "${topic}":`,
// // // // // //           "color: #e67e22; font-weight: bold;",
// // // // // //           msg
// // // // // //         )
// // // // // //       }
// // // // // //     }

// // // // // //     console.log(
// // // // // //       `%c[useWidgetLiveData][${widget?.title || widgetId}] Subscribing to "${topic}" for keys: [${telemetryKeys.join(", ")}]`,
// // // // // //       "color: #2980b9; font-weight: bold;"
// // // // // //     )
// // // // // //     subscribe(topic, onMessage)

// // // // // //     return () => {
// // // // // //       unsubscribe(topic, onMessage)
// // // // // //       setLiveData([])
// // // // // //       console.log(
// // // // // //         `%c[useWidgetLiveData][${widget?.title || widgetId}] Unsubscribed from "${topic}"`,
// // // // // //         "color: #e74c3c; font-weight: bold;"
// // // // // //       )
// // // // // //     }
// // // // // //     // eslint-disable-next-line
// // // // // //   }, [topic, JSON.stringify(telemetryKeys), widgetId])

// // // // // //   return liveData
// // // // // // }


// // // // // // // import { useEffect, useRef, useState, useContext } from "react"
// // // // // // // import { MqttContext } from "../services/MqttProvider"

// // // // // // // export function useWidgetLiveData(widget, config) {
// // // // // // //   const topic =
// // // // // // //     config?.dataSource?.topic ||
// // // // // // //     (config?.dataSource?.type === "device" && config?.dataSource?.deviceId
// // // // // // //       ? `kepler/devices/${config.dataSource.deviceId}/up/data`
// // // // // // //       : null)
// // // // // // //   const telemetryKeys = config?.dataSource?.telemetry || []
// // // // // // //   const { subscribe, unsubscribe } = useContext(MqttContext) || {}
// // // // // // //   const [liveData, setLiveData] = useState([])
// // // // // // //   const widgetId = widget?.id || config?.id

// // // // // // //   useEffect(() => {
// // // // // // //     if (!topic || !telemetryKeys.length || !subscribe) {
// // // // // // //       setLiveData([])
// // // // // // //       return
// // // // // // //     }
// // // // // // //     const onMessage = (msg) => {
// // // // // // //       if (typeof msg === "object" && msg !== null) {
// // // // // // //         const latestPoint = { time: new Date().toISOString() }
// // // // // // //         telemetryKeys.forEach((k) => {
// // // // // // //           latestPoint[k] = msg[k]
// // // // // // //         })
// // // // // // //         setLiveData((prev) => {
// // // // // // //           const bufferSize = config?.bufferSize || 1
// // // // // // //           return bufferSize > 1
// // // // // // //             ? [...(prev || []), latestPoint].slice(-bufferSize)
// // // // // // //             : [latestPoint]
// // // // // // //         })
// // // // // // //       }
// // // // // // //       // else: ignore invalid data, don't update liveData!
// // // // // // //     }
// // // // // // //     subscribe(topic, onMessage)
// // // // // // //     return () => {
// // // // // // //       unsubscribe(topic, onMessage)
// // // // // // //       setLiveData([])
// // // // // // //     }
// // // // // // //   }, [topic, JSON.stringify(telemetryKeys), widgetId])

// // // // // // //   return liveData
// // // // // // // }


// // // // // // // // import { useEffect, useRef, useState, useContext } from "react"
// // // // // // // // import { MqttContext } from "../services/MqttProvider"

// // // // // // // // /**
// // // // // // // //  * useWidgetLiveData
// // // // // // // //  * - Subscribes to the given topic (from widget config) via global MQTT Context.
// // // // // // // //  * - Returns latest data as array for all widget types.
// // // // // // // //  *
// // // // // // // //  * @param {Object} widget - Widget definition
// // // // // // // //  * @param {Object} config - Widget config
// // // // // // // //  * @returns {Array} liveData - [{ key: value, ... }]
// // // // // // // //  */
// // // // // // // // export function useWidgetLiveData(widget, config) {
// // // // // // // //   // 1. Get topic & telemetry keys from config
// // // // // // // //   const topic =
// // // // // // // //     config?.dataSource?.topic ||
// // // // // // // //     (config?.dataSource?.type === "device" && config?.dataSource?.deviceId
// // // // // // // //       ? `kepler/devices/${config.dataSource.deviceId}/up/data`
// // // // // // // //       : null)
// // // // // // // //   const telemetryKeys = config?.dataSource?.telemetry || []

// // // // // // // //   // 2. Use MQTT context (must be in <MqttProvider>!)
// // // // // // // //   const { subscribe, unsubscribe, getLatestData } = useContext(MqttContext) || {}

// // // // // // // //   // 3. Local state buffer (for chart/history or just latest value)
// // // // // // // //   const [liveData, setLiveData] = useState([])

// // // // // // // //   // 4. Remember last topic (for resubscribe/unsubscribe)
// // // // // // // //   const lastTopicRef = useRef(topic)
// // // // // // // //   const widgetId = widget?.id || config?.id

// // // // // // // //   useEffect(() => {
// // // // // // // //     if (!topic || !telemetryKeys.length || !subscribe) {
// // // // // // // //       setLiveData([])
// // // // // // // //       return
// // // // // // // //     }

// // // // // // // //     // Subscribe and set data update callback
// // // // // // // //     const onMessage = (msg) => {
// // // // // // // //       // Accept either single object or array
// // // // // // // //       let latestPoint
// // // // // // // //       if (typeof msg === "object" && msg !== null) {
// // // // // // // //         latestPoint = { time: new Date().toISOString() }
// // // // // // // //         telemetryKeys.forEach((k) => {
// // // // // // // //           latestPoint[k] = msg[k]
// // // // // // // //         })
// // // // // // // //       }
// // // // // // // //       setLiveData((prev) => {
// // // // // // // //         // Buffer if requested (from config), else latest only
// // // // // // // //         const bufferSize = config?.bufferSize || 1
// // // // // // // //         return bufferSize > 1
// // // // // // // //           ? [...(prev || []), latestPoint].slice(-bufferSize)
// // // // // // // //           : [latestPoint]
// // // // // // // //       })
// // // // // // // //       // Debug log
// // // // // // // //       console.log(`[useWidgetLiveData][${widget.type}] Data:`, msg)
// // // // // // // //     }

// // // // // // // //     // Subscribe via context
// // // // // // // //     // subscribe({ topic, widgetId, onMessage, telemetryKeys })
// // // // // // // //     subscribe(topic, onMessage)

// // // // // // // //     // Cleanup: unsubscribe when topic/widget changes or unmount
// // // // // // // //     return () => {
// // // // // // // //       // unsubscribe({ topic, widgetId })
// // // // // // // //         unsubscribe(topic, onMessage)
// // // // // // // //       setLiveData([])
// // // // // // // //     }
// // // // // // // //     // eslint-disable-next-line
// // // // // // // //   }, [topic, JSON.stringify(telemetryKeys), widgetId])

// // // // // // // //   return liveData
// // // // // // // // }



// // // // // // // // // import { useMqttLiveData } from "./useMqttLiveData"
// // // // // // // // // import { useHttpLiveData } from "./useHttpLiveData"

// // // // // // // // // export function useWidgetLiveData(widget, config) {
// // // // // // // // //   const dataSource = config?.dataSource || {}
// // // // // // // // //   const telemetryKeys = dataSource.telemetry || []
// // // // // // // // //   const widgetType = widget?.type || "unknown"

// // // // // // // // //   // MQTT & device types
// // // // // // // // //   const mqttTypes = ["mqtt", "device"]
// // // // // // // // //   const httpTypes = ["http"]

// // // // // // // // //   // Choose based on type (call hooks UNCONDITIONALLY)
// // // // // // // // //   const mqttData = useMqttLiveData({
// // // // // // // // //     topic: dataSource.topic || dataSource.mqttTopic || (dataSource.deviceId ? `kepler/devices/${dataSource.deviceId}/up/data` : ""),
// // // // // // // // //     telemetryKeys,
// // // // // // // // //     widgetType,
// // // // // // // // //   })

// // // // // // // // //   const httpData = useHttpLiveData({
// // // // // // // // //     url: dataSource.url || dataSource.httpUrl,
// // // // // // // // //     telemetryKeys,
// // // // // // // // //     pollInterval: dataSource.pollInterval || 5000,
// // // // // // // // //   })

// // // // // // // // //   // If you want, add support for CoAP etc here

// // // // // // // // //   if (mqttTypes.includes(dataSource.type)) {
// // // // // // // // //     console.log(`[useWidgetLiveData][${widgetType}] Using MQTT/device live data`, mqttData)
// // // // // // // // //     return mqttData
// // // // // // // // //   }
// // // // // // // // //   if (httpTypes.includes(dataSource.type)) {
// // // // // // // // //     console.log(`[useWidgetLiveData][${widgetType}] Using HTTP live data`, httpData)
// // // // // // // // //     return httpData
// // // // // // // // //   }
// // // // // // // // //   // fallback to static/mock
// // // // // // // // //   console.log(`[useWidgetLiveData][${widgetType}] Using static data`, config.data || [])
// // // // // // // // //   return config.data || []
// // // // // // // // // }


// // // // // // // // // // import { useMqttLiveData } from "./useMqttLiveData"

// // // // // // // // // // /**
// // // // // // // // // //  * Flexible hook for live data for any widget
// // // // // // // // // //  * Handles multiple data source types (mqtt, static, ...future: http/coap)
// // // // // // // // // //  * 
// // // // // // // // // //  * @param {Object} widget
// // // // // // // // // //  * @param {Object} config
// // // // // // // // // //  * @returns {Array} live data
// // // // // // // // // //  */
// // // // // // // // // // export function useWidgetLiveData(widget, config = {}) {
// // // // // // // // // //   const dataSource = config.dataSource || {}
// // // // // // // // // //   const type = dataSource.type || "static"
// // // // // // // // // //   const telemetryKeys = dataSource.telemetry || []
// // // // // // // // // //   const widgetType = widget?.type || "unknown"
// // // // // // // // // //   const widgetId = widget?.id

// // // // // // // // // //   // Topic resolution logic for MQTT
// // // // // // // // // //   let topic = dataSource.mqttTopic || dataSource.topic
// // // // // // // // // //   if (!topic && type === "device" && dataSource.deviceId) {
// // // // // // // // // //     topic = `kepler/devices/${dataSource.deviceId}/up/data`
// // // // // // // // // //   }

// // // // // // // // // //   // Always call hooks in the same order
// // // // // // // // // //   const mqttLiveData = useMqttLiveData({
// // // // // // // // // //     topic,
// // // // // // // // // //     telemetryKeys,
// // // // // // // // // //     widgetType,
// // // // // // // // // //     widgetId
// // // // // // // // // //   })

// // // // // // // // // //   // Future: httpLiveData = useHttpLiveData({...})
// // // // // // // // // //   //         coapLiveData = useCoapLiveData({...})

// // // // // // // // // //   // Flexible: return by type
// // // // // // // // // //   if (["mqtt", "device"].includes(type)) {
// // // // // // // // // //     console.log(`[useWidgetLiveData][${widgetType}] Using MQTT/device live data`, mqttLiveData)
// // // // // // // // // //     return mqttLiveData
// // // // // // // // // //   }

// // // // // // // // // //   // Static/mock data fallback
// // // // // // // // // //   const staticData = config.data || []
// // // // // // // // // //   console.log(`[useWidgetLiveData][${widgetType}] Using static/mock data`, staticData)
// // // // // // // // // //   return staticData
// // // // // // // // // // }
