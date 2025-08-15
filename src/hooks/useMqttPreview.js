// src/hooks/useMqttPreview.js
import { useState, useEffect, useContext } from "react"
import { MqttContext } from "../services/MqttProvider"

/**
 * useMqttPreview
 * Subscribes to an MQTT topic (for temporary preview in config UI).
 * Returns: [lastMsg, log], unsubscribes on cleanup.
 */
export function useMqttPreview(topic, visible, onNewKeys) {
  const { subscribe, unsubscribe } = useContext(MqttContext) || {}
  const [log, setLog] = useState([])
  const [lastMsg, setLastMsg] = useState(null)

  useEffect(() => {
    if (!visible || !topic || !subscribe) {
      if (!visible) {
        console.warn(
          `%c[useMqttPreview] Not subscribing (not visible)`,
          "color:#e67e22;"
        )
      }
      if (!topic) {
        console.warn(
          `%c[useMqttPreview] Not subscribing (no topic)`,
          "color:#e67e22;"
        )
      }
      return
    }

    function handleMessage(receivedTopic, data) {
      setLog(prev => [
        ...prev,
        `[MQTT] Message on ${receivedTopic}: ${JSON.stringify(data)}`
      ])
      setLastMsg(data)
      console.log(
        `%c[useMqttPreview] MQTT msg on "${receivedTopic}":`,
        "color:#27ae60;font-weight:bold;",
        data
      )
      // Notify parent of any new keys if callback provided
      if (onNewKeys && typeof data === "object" && data !== null) {
        onNewKeys(data)
      }
    }

    subscribe(topic, handleMessage)
    setLog(prev => [...prev, `[MQTT] Subscribed to ${topic}`])
    console.log(
      `%c[useMqttPreview] Subscribed to "${topic}"`,
      "color:#2980b9;font-weight:bold;"
    )

    return () => {
      unsubscribe(topic, handleMessage)
      setLog(prev => [...prev, `[MQTT] Unsubscribed from ${topic}`])
      console.log(
        `%c[useMqttPreview] Unsubscribed from "${topic}"`,
        "color:#e74c3c;font-weight:bold;"
      )
    }
    // eslint-disable-next-line
  }, [topic, visible, subscribe, unsubscribe, onNewKeys])

  return [lastMsg, log]
}

// // src/hooks/useMqttPreview.js
// import { useState, useEffect, useRef, useContext } from "react"
// import { MqttContext } from "../services/MqttProvider"

// /**
//  * useMqttPreview
//  * Subscribes to an MQTT topic (for temporary preview in config UI).
//  * Returns: [lastMsg, log], unsubscribes on cleanup.
//  */
// export function useMqttPreview(topic, visible, onNewKeys) {
//   const { subscribe, unsubscribe } = useContext(MqttContext) || {}
//   const [log, setLog] = useState([])
//   const [lastMsg, setLastMsg] = useState(null)

//   useEffect(() => {
//     if (!visible || !topic || !subscribe) return

//     function handleMessage(receivedTopic, data) {
//       setLog(prev => [
//         ...prev,
//         `[MQTT] Message on ${receivedTopic}: ${JSON.stringify(data)}`
//       ])
//       setLastMsg(data)
//       // Notify parent of any new keys if callback provided
//       if (onNewKeys && typeof data === "object" && data !== null) {
//         onNewKeys(data)
//       }
//     }

//     subscribe(topic, handleMessage)
//     setLog(prev => [...prev, `[MQTT] Subscribed to ${topic}`])

//     return () => {
//       unsubscribe(topic, handleMessage)
//       setLog(prev => [...prev, `[MQTT] Unsubscribed from ${topic}`])
//     }
//   // Re-run only if topic or modal open state changes
//   }, [topic, visible, subscribe, unsubscribe, onNewKeys])

//   return [lastMsg, log]
// }
