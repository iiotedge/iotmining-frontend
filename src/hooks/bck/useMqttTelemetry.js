// // src/hooks/useMqttTelemetry.js
// import { useEffect, useRef, useState } from "react"
// import { connectAndSubscribe, disconnect } from "../services/mqttClient"

// export function useMqttTelemetry({ topic, keys, maxPoints = 100 }) {
//   const [data, setData] = useState([])
//   const clientRef = useRef(null)

//   useEffect(() => {
//     if (!topic || !Array.isArray(keys) || !keys.length) {
//       setData([])
//       disconnect()
//       return
//     }
//     let buffer = []
//     let mounted = true

//     clientRef.current = connectAndSubscribe({
//       topic,
//       onMessage: (receivedTopic, payload) => {
//         if (!payload || typeof payload !== "object") return
//         const point = { time: new Date().toISOString() }
//         keys.forEach(key => {
//           point[key] = payload[key]
//         })
//         buffer.push(point)
//         if (buffer.length > maxPoints) buffer = buffer.slice(-maxPoints)
//         if (mounted) setData([...buffer])
//       },
//       clientId: "widget-" + Math.random().toString(16).slice(2)
//     })

//     return () => {
//       mounted = false
//       disconnect()
//     }
//     // eslint-disable-next-line
//   }, [topic, JSON.stringify(keys), maxPoints])

//   return data
// }
