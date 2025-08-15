// import { useEffect, useRef, useState } from "react"
// import { connectAndSubscribe, disconnect } from "../services/mqttClient"

// /**
//  * useMqttLiveData
//  * @param {Object} params
//  * @param {string} params.topic - MQTT topic
//  * @param {Array}  params.telemetryKeys - keys to extract
//  * @param {string} params.widgetType - e.g., 'line-chart'
//  * @returns {Array} live data for chart or value widget
//  */
// export function useMqttLiveData({ topic, telemetryKeys = [], widgetType, widgetId }) {
//   const [liveData, setLiveData] = useState([])
//   const clientRef = useRef(null)
//   const bufferRef = useRef([])

//   useEffect(() => {
//     if (!topic || !telemetryKeys.length) {
//       setLiveData([])
//       return
//     }

//     console.log(`[useMqttLiveData][${widgetType}] Connecting to:`, topic)
//     bufferRef.current = []
//     clientRef.current = connectAndSubscribe({
//       topic,
//       onMessage: (receivedTopic, payload) => {
//         const now = new Date().toISOString()
//         if (widgetType?.includes("chart")) {
//           const point = { time: now }
//           telemetryKeys.forEach((k) => (point[k] = payload[k]))
//           bufferRef.current = [...bufferRef.current, point].slice(-100)
//           setLiveData([...bufferRef.current])
//           console.log(`[useMqttLiveData][${widgetType}] Chart point:`, point)
//         } else {
//           const latest = {}
//           telemetryKeys.forEach((k) => (latest[k] = payload[k]))
//           setLiveData([latest])
//           console.log(`[useMqttLiveData][${widgetType}] Latest value:`, latest)
//         }
//       },
//       clientId: `widget-${widgetType}-${topic}-${widgetId || Math.floor(Math.random()*1e5)}`,
//     })

//     return () => {
//       console.log(`[useMqttLiveData][${widgetType}] Disconnecting:`, topic)
//       disconnect(clientRef.current)
//       clientRef.current = null
//       bufferRef.current = []
//       setLiveData([])
//     }
//     // eslint-disable-next-line
//   }, [topic, JSON.stringify(telemetryKeys), widgetType, widgetId])

//   return liveData
// }
