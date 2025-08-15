// src/services/MqttProvider.js

import React, { createContext, useContext, useRef, useState, useEffect } from "react"
import mqtt from "mqtt"
import MQTT_CONFIG from "../config/mqttConfig"

export const MqttContext = createContext()

export function useMqtt() {
  return useContext(MqttContext)
}

export const MqttProvider = ({ children }) => {
  const clientRef = useRef(null)
  const listeners = useRef({})
  const [connected, setConnected] = useState(false)

  // --- 1. Connect once ---
  useEffect(() => {
    if (clientRef.current) return // Don't recreate!
    const client = mqtt.connect(MQTT_CONFIG.brokerUrl, MQTT_CONFIG.options)
    clientRef.current = client

    client.on("connect", () => {
      setConnected(true)
      console.log("%c[MQTT] Connected to broker", "color: green; font-weight: bold;")
    })
    client.on("close", () => {
      setConnected(false)
      console.log("%c[MQTT] Connection closed", "color: orange; font-weight: bold;")
    })
    client.on("reconnect", () => {
      console.log("%c[MQTT] Attempting to reconnect...", "color: orange; font-weight: bold;")
    })
    client.on("offline", () => {
      setConnected(false)
      console.log("%c[MQTT] Client is offline", "color: gray; font-weight: bold;")
    })
    client.on("error", (err) => {
      setConnected(false)
      console.error("%c[MQTT] Error:", "color: red; font-weight: bold;", err)
    })
    client.on("message", (topic, payload) => {
      let data
      try {
        data = JSON.parse(payload.toString())
        console.log(
          `%c[MQTT] Received JSON on "${topic}":`,
          "color: #3498db; font-weight: bold;",
          data
        )
      } catch {
        data = payload.toString()
        console.warn(
          `%c[MQTT] Received non-JSON payload on "${topic}":`,
          "color: #f39c12; font-weight: bold;",
          payload.toString()
        )
      }
      if (listeners.current[topic]) {
        listeners.current[topic].forEach(cb => cb(topic, data))
      }
    })

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.end(true)
        clientRef.current = null
      }
    }
  }, [])

  // --- 2. Subscribe/Unsubscribe logic (unchanged) ---
  function subscribe(topic, callback) {
    if (typeof topic !== "string") {
      console.error("%c[MQTT] subscribe: Topic must be a string!", "color: red; font-weight: bold;", topic)
      return
    }
    if (!listeners.current[topic]) {
      listeners.current[topic] = new Set()
      clientRef.current?.subscribe(topic, (err) => {
        if (err) {
          console.error("%c[MQTT] Failed to subscribe:", "color: red; font-weight: bold;", topic, err)
        } else {
          console.log(`%c[MQTT] Subscribed to topic "${topic}"`, "color: green; font-weight: bold;")
        }
      })
    }
    listeners.current[topic].add(callback)
    console.log(
      `%c[MQTT] Listener added for topic "${topic}" (count: ${listeners.current[topic].size})`,
      "color: #27ae60; font-weight: bold;"
    )
  }

  function unsubscribe(topic, callback) {
    if (typeof topic !== "string") {
      console.error("%c[MQTT] unsubscribe: Topic must be a string!", "color: red; font-weight: bold;", topic)
      return
    }
    if (listeners.current[topic]) {
      listeners.current[topic].delete(callback)
      if (listeners.current[topic].size === 0) {
        clientRef.current?.unsubscribe(topic, (err) => {
          if (err) {
            console.error("%c[MQTT] Failed to unsubscribe from topic:", "color: red; font-weight: bold;", topic, err)
          } else {
            console.log(`%c[MQTT] Unsubscribed from topic "${topic}"`, "color: orange; font-weight: bold;")
          }
        })
        delete listeners.current[topic]
      } else {
        console.log(
          `%c[MQTT] Listener removed for topic "${topic}" (remaining: ${listeners.current[topic].size})`,
          "color: #e67e22; font-weight: bold;"
        )
      }
    }
  }

  // --- 3. Deep-logged Command Sender (Promise-based) ---
  function sendMqttCommand(topic, payload) {
    if (!clientRef.current || !connected) {
      console.error(
        "%c[MQTT] sendMqttCommand: Not connected! Topic: %s, Payload: %o",
        "color: red; font-weight: bold;", topic, payload
      )
      return Promise.reject(new Error("MQTT not connected"))
    }
    if (!topic) {
      console.error("%c[MQTT] sendMqttCommand: No topic given", "color: red; font-weight: bold;")
      return Promise.reject(new Error("No topic"))
    }
    console.log(
      `%c[MQTT] Publishing command to "${topic}":`,
      "color: #2980b9; font-weight: bold;", payload
    )
    return new Promise((resolve, reject) => {
      clientRef.current.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
        if (err) {
          console.error("%c[MQTT] Command publish failed:", "color: red; font-weight: bold;", err)
          reject(err)
        } else {
          console.log("%c[MQTT] Command sent successfully.", "color: #27ae60; font-weight: bold;")
          resolve()
        }
      })
    })
  }

  // --- 4. Final Context Value ---
  return (
    <MqttContext.Provider value={{
      client: clientRef.current,
      subscribe,
      unsubscribe,
      sendMqttCommand,
      connected,
    }}>
      {children}
    </MqttContext.Provider>
  )
}
// // src/services/MqttProvider.js

// import React, { createContext, useContext, useRef, useEffect } from "react"
// import mqtt from "mqtt"
// import MQTT_CONFIG from "../config/mqttConfig"

// // 1. Context definition (only ONCE in your project!)
// export const MqttContext = createContext()

// // 2. Custom hook for convenient use
// export function useMqtt() {
//   return useContext(MqttContext)
// }

// // 3. Provider
// export const MqttProvider = ({ children }) => {
//   const clientRef = useRef(null)
//   const listeners = useRef({})

//   useEffect(() => {
//     if (clientRef.current) return // Don't recreate!
//     const client = mqtt.connect(MQTT_CONFIG.brokerUrl, MQTT_CONFIG.options)
//     clientRef.current = client

//     client.on("connect", () => {
//       console.log("%c[MQTT] Connected to broker", "color: green; font-weight: bold;")
//     })
//     client.on("close", () => {
//       console.log("%c[MQTT] Connection closed", "color: orange; font-weight: bold;")
//     })
//     client.on("reconnect", () => {
//       console.log("%c[MQTT] Attempting to reconnect...", "color: orange; font-weight: bold;")
//     })
//     client.on("offline", () => {
//       console.log("%c[MQTT] Client is offline", "color: gray; font-weight: bold;")
//     })
//     client.on("error", (err) => {
//       console.error("%c[MQTT] Error:", "color: red; font-weight: bold;", err)
//     })
//     client.on("message", (topic, payload) => {
//       let data
//       try {
//         data = JSON.parse(payload.toString())
//         console.log(
//           `%c[MQTT] Received JSON on "${topic}":`,
//           "color: #3498db; font-weight: bold;",
//           data
//         )
//       } catch {
//         data = payload.toString()
//         console.warn(
//           `%c[MQTT] Received non-JSON payload on "${topic}":`,
//           "color: #f39c12; font-weight: bold;",
//           payload.toString()
//         )
//       }
//       if (listeners.current[topic]) {
//         listeners.current[topic].forEach(cb => cb(topic, data))
//       }
//     })

//     // Cleanup on unmount
//     return () => {
//       if (clientRef.current) {
//         clientRef.current.end(true)
//         clientRef.current = null
//       }
//     }
//   }, [])

//   function subscribe(topic, callback) {
//     if (typeof topic !== "string") {
//       console.error("%c[MQTT] subscribe: Topic must be a string!", "color: red; font-weight: bold;", topic)
//       return
//     }
//     if (!listeners.current[topic]) {
//       listeners.current[topic] = new Set()
//       clientRef.current?.subscribe(topic, (err) => {
//         if (err) {
//           console.error("%c[MQTT] Failed to subscribe:", "color: red; font-weight: bold;", topic, err)
//         } else {
//           console.log(`%c[MQTT] Subscribed to topic "${topic}"`, "color: green; font-weight: bold;")
//         }
//       })
//     }
//     listeners.current[topic].add(callback)
//     console.log(
//       `%c[MQTT] Listener added for topic "${topic}" (count: ${listeners.current[topic].size})`,
//       "color: #27ae60; font-weight: bold;"
//     )
//   }

//   function unsubscribe(topic, callback) {
//     if (typeof topic !== "string") {
//       console.error("%c[MQTT] unsubscribe: Topic must be a string!", "color: red; font-weight: bold;", topic)
//       return
//     }
//     if (listeners.current[topic]) {
//       listeners.current[topic].delete(callback)
//       if (listeners.current[topic].size === 0) {
//         clientRef.current?.unsubscribe(topic, (err) => {
//           if (err) {
//             console.error("%c[MQTT] Failed to unsubscribe from topic:", "color: red; font-weight: bold;", topic, err)
//           } else {
//             console.log(`%c[MQTT] Unsubscribed from topic "${topic}"`, "color: orange; font-weight: bold;")
//           }
//         })
//         delete listeners.current[topic]
//       } else {
//         console.log(
//           `%c[MQTT] Listener removed for topic "${topic}" (remaining: ${listeners.current[topic].size})`,
//           "color: #e67e22; font-weight: bold;"
//         )
//       }
//     }
//   }

//   return (
//     <MqttContext.Provider value={{
//       client: clientRef.current,
//       subscribe,
//       unsubscribe
//     }}>
//       {children}
//     </MqttContext.Provider>
//   )
// }


// // // src/services/MqttProvider.js

// // import React, { createContext, useContext, useRef, useEffect } from "react"
// // import mqtt from "mqtt"
// // import MQTT_CONFIG from "../config/mqttConfig"

// // // 1. Context definition (only ONCE in your project!)
// // export const MqttContext = createContext()

// // // 2. Custom hook for convenient use
// // export function useMqtt() {
// //   return useContext(MqttContext)
// // }

// // // 3. Provider
// // export const MqttProvider = ({ children }) => {
// //   const clientRef = useRef(null)
// //   const listeners = useRef({})

// //   useEffect(() => {
// //     if (clientRef.current) return // Don't recreate!
// //     const client = mqtt.connect(MQTT_CONFIG.brokerUrl, MQTT_CONFIG.options)
// //     clientRef.current = client

// //     client.on("connect", () => {
// //       console.log("[MQTT] Connected to broker")
// //     })
// //     client.on("close", () => {
// //       console.log("[MQTT] Connection closed")
// //     })
// //     client.on("reconnect", () => {
// //       console.log("[MQTT] Attempting to reconnect...")
// //     })
// //     client.on("offline", () => {
// //       console.log("[MQTT] Client is offline")
// //     })
// //     client.on("error", (err) => {
// //       console.error("[MQTT] Error:", err)
// //     })
// //     client.on("message", (topic, payload) => {
// //       let data
// //       try { data = JSON.parse(payload.toString()) }
// //       catch {
// //         data = payload.toString();
// //         console.warn("Received non-JSON payload:", payload.toString())
// //       }
// //       if (listeners.current[topic]) {
// //         listeners.current[topic].forEach(cb => cb(topic, data))
// //       }
// //     })

// //     // Cleanup on unmount
// //     return () => {
// //       if (clientRef.current) {
// //         clientRef.current.end(true)
// //         clientRef.current = null
// //       }
// //     }
// //   }, [])

// //   function subscribe(topic, callback) {
// //     if (typeof topic !== "string") {
// //       console.error("[MQTT] subscribe: Topic must be a string!", topic)
// //       return
// //     }
// //     if (!listeners.current[topic]) {
// //       listeners.current[topic] = new Set()
// //       clientRef.current?.subscribe(topic, (err) => {
// //         if (err) console.error("[MQTT] Failed to subscribe:", topic, err)
// //         else console.log("[MQTT] Subscribed to topic", topic)
// //       })
// //     }
// //     listeners.current[topic].add(callback)
// //     console.log(`[MQTT] Listener added for topic "${topic}" (count: ${listeners.current[topic].size})`)
// //   }

// //   function unsubscribe(topic, callback) {
// //     if (typeof topic !== "string") {
// //       console.error("[MQTT] unsubscribe: Topic must be a string!", topic)
// //       return
// //     }
// //     if (listeners.current[topic]) {
// //       listeners.current[topic].delete(callback)
// //       if (listeners.current[topic].size === 0) {
// //         clientRef.current?.unsubscribe(topic, (err) => {
// //           if (err) console.error("[MQTT] Failed to unsubscribe from topic:", topic, err)
// //           else console.log("[MQTT] Unsubscribed from topic", topic)
// //         })
// //         delete listeners.current[topic]
// //       } else {
// //         console.log(`[MQTT] Listener removed for topic "${topic}" (remaining: ${listeners.current[topic].size})`)
// //       }
// //     }
// //   }

// //   return (
// //     <MqttContext.Provider value={{
// //       client: clientRef.current,
// //       subscribe,
// //       unsubscribe
// //     }}>
// //       {children}
// //     </MqttContext.Provider>
// //   )
// // }


// // // import React, { createContext, useRef, useEffect } from "react"
// // // import mqtt from "mqtt"
// // // import MQTT_CONFIG from "../config/mqttConfig"
// // // import { useContext } from "react"
// // // import { MqttContext } from "./MqttProvider"

// // // export function useMqtt() {
// // //   return useContext(MqttContext)
// // // }

// // // export const MqttContext = createContext()

// // // export const MqttProvider = ({ children }) => {
// // //   const clientRef = useRef(null)
// // //   const listeners = useRef({})

// // //   useEffect(() => {
// // //     if (clientRef.current) return; // Don't recreate!

// // //     const client = mqtt.connect(MQTT_CONFIG.brokerUrl, MQTT_CONFIG.options)
// // //     clientRef.current = client

// // //     client.on("connect", () => {
// // //       console.log("[MQTT] Connected to broker")
// // //     })
// // //     client.on("close", () => {
// // //       console.log("[MQTT] Connection closed")
// // //     })
// // //     client.on("reconnect", () => {
// // //       console.log("[MQTT] Attempting to reconnect...")
// // //     })
// // //     client.on("offline", () => {
// // //       console.log("[MQTT] Client is offline")
// // //     })
// // //     client.on("error", (err) => {
// // //       console.error("[MQTT] Error:", err)
// // //     })
// // //     client.on("message", (topic, payload) => {
// // //       let data
// // //       try { data = JSON.parse(payload.toString()) } catch { data = payload.toString() }
// // //       if (listeners.current[topic]) {
// // //         listeners.current[topic].forEach(cb => cb(topic, data))
// // //       }
// // //     })

// // //     return () => {
// // //       if (clientRef.current) {
// // //         clientRef.current.end(true)
// // //         clientRef.current = null
// // //       }
// // //     }
// // //   }, [])

// // //   function subscribe(topic, callback) {
// // //     if (typeof topic !== "string") {
// // //       console.error("[MQTT] subscribe: Topic must be a string!", topic)
// // //       return
// // //     }
// // //     if (!listeners.current[topic]) {
// // //       listeners.current[topic] = new Set()
// // //       clientRef.current?.subscribe(topic, (err) => {
// // //         if (err) console.error("[MQTT] Failed to subscribe:", topic, err)
// // //         else console.log("[MQTT] Subscribed to topic", topic)
// // //       })
// // //     }
// // //     listeners.current[topic].add(callback)
// // //     console.log(`[MQTT] Listener added for topic "${topic}" (count: ${listeners.current[topic].size})`)
// // //   }

// // //   function unsubscribe(topic, callback) {
// // //     if (typeof topic !== "string") {
// // //       console.error("[MQTT] unsubscribe: Topic must be a string!", topic)
// // //       return
// // //     }
// // //     if (listeners.current[topic]) {
// // //       listeners.current[topic].delete(callback)
// // //       if (listeners.current[topic].size === 0) {
// // //         clientRef.current?.unsubscribe(topic, (err) => {
// // //           if (err) console.error("[MQTT] Failed to unsubscribe from topic:", topic, err)
// // //           else console.log("[MQTT] Unsubscribed from topic", topic)
// // //         })
// // //         delete listeners.current[topic]
// // //       } else {
// // //         console.log(`[MQTT] Listener removed for topic "${topic}" (remaining: ${listeners.current[topic].size})`)
// // //       }
// // //     }
// // //   }

// // //   return (
// // //     <MqttContext.Provider value={{
// // //       client: clientRef.current,
// // //       subscribe,
// // //       unsubscribe
// // //     }}>
// // //       {children}
// // //     </MqttContext.Provider>
// // //   )
// // // }


// // // // import React, { createContext, useRef, useEffect } from "react"
// // // // import mqtt from "mqtt"
// // // // import MQTT_CONFIG from "../config/mqttConfig"

// // // // export const MqttContext = createContext()

// // // // export const MqttProvider = ({ children }) => {
// // // //   const clientRef = useRef(null)
// // // //   const listeners = useRef({}) // { topic: Set<callback> }

// // // //   useEffect(() => {
// // // //     console.log("[MQTT] Initializing connection to broker:", MQTT_CONFIG.brokerUrl)
// // // //     const client = mqtt.connect(MQTT_CONFIG.brokerUrl, MQTT_CONFIG.options)
// // // //     clientRef.current = client

// // // //     // Connection events
// // // //     client.on("connect", () => {
// // // //       console.log("[MQTT] Connected to broker")
// // // //     })
// // // //     client.on("reconnect", () => {
// // // //       console.log("[MQTT] Attempting to reconnect...")
// // // //     })
// // // //     client.on("close", () => {
// // // //       console.log("[MQTT] Connection closed")
// // // //     })
// // // //     client.on("offline", () => {
// // // //       console.warn("[MQTT] Client is offline")
// // // //     })
// // // //     client.on("error", (err) => {
// // // //       console.error("[MQTT] Error:", err)
// // // //     })
// // // //     client.on("end", () => {
// // // //       console.log("[MQTT] Connection ended (client.end() called)")
// // // //     })

// // // //     // Message event
// // // //     client.on("message", (topic, payload) => {
// // // //       let data
// // // //       try { data = JSON.parse(payload.toString()) } catch { data = payload.toString() }
// // // //       if (listeners.current[topic]) {
// // // //         listeners.current[topic].forEach(cb => cb(topic, data))
// // // //       }
// // // //       console.log(`[MQTT] Received message on topic "${topic}":`, data)
// // // //     })

// // // //     return () => {
// // // //       console.log("[MQTT] Cleaning up and closing client connection")
// // // //       client.end(true)
// // // //     }
// // // //   }, [])

// // // //   // Subscribe (or add new listener for existing subscription)
// // // //   function subscribe(topic, callback) {
// // // //     if (!listeners.current[topic]) {
// // // //       listeners.current[topic] = new Set()
// // // //       clientRef.current?.subscribe(topic, (err) => {
// // // //         if (err) {
// // // //           console.error(`[MQTT] Failed to subscribe to topic "${topic}":`, err)
// // // //         } else {
// // // //           console.log(`[MQTT] Subscribed to topic "${topic}"`)
// // // //         }
// // // //       })
// // // //     }
// // // //     listeners.current[topic].add(callback)
// // // //     console.log(`[MQTT] Listener added for topic "${topic}" (count: ${listeners.current[topic].size})`)
// // // //   }

// // // //   // Remove listener, and unsubscribe if none left
// // // //   function unsubscribe(topic, callback) {
// // // //     if (listeners.current[topic]) {
// // // //       listeners.current[topic].delete(callback)
// // // //       console.log(`[MQTT] Listener removed for topic "${topic}" (remaining: ${listeners.current[topic].size})`)
// // // //       if (listeners.current[topic].size === 0) {
// // // //         clientRef.current?.unsubscribe(topic, (err) => {
// // // //           if (err) {
// // // //             console.error(`[MQTT] Failed to unsubscribe from topic "${topic}":`, err)
// // // //           } else {
// // // //             console.log(`[MQTT] Unsubscribed from topic "${topic}" (no listeners left)`)
// // // //           }
// // // //         })
// // // //         delete listeners.current[topic]
// // // //       }
// // // //     }
// // // //   }

// // // //   return (
// // // //     <MqttContext.Provider value={{
// // // //       client: clientRef.current,
// // // //       subscribe,
// // // //       unsubscribe
// // // //     }}>
// // // //       {children}
// // // //     </MqttContext.Provider>
// // // //   )
// // // // }
