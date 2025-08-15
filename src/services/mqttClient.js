// // src/services/mqttClient.js
// import mqtt from "mqtt"
// import MQTT_CONFIG from "../config/mqttConfig"

// // Utility: only log in development
// const devLog = (...args) => {
//   if (process.env.NODE_ENV !== "production") {
//     // Prefix for easy search in browser console
//     console.log("[MQTT]", ...args)
//   }
// }

// /**
//  * Connects and subscribes to a topic (or topics), returns the client instance.
//  * Clean, per-widget instance, suitable for production React apps.
//  * @param {object} opts
//  * @param {string|string[]} opts.topic - topic(s) to subscribe
//  * @param {function} opts.onMessage - (topic, data) => void
//  * @param {string} opts.clientId - optional custom clientId
//  * @param {object} opts.options - additional MQTT.js options
//  */
// export function connectAndSubscribe({ topic, onMessage, clientId, options = {} }) {
//   const topics = Array.isArray(topic) ? topic : [topic]
//   const mqttOptions = {
//     ...MQTT_CONFIG.options,
//     ...options,
//     clientId: clientId || `dashboard-${Date.now()}-${Math.floor(Math.random() * 1e5)}`,
//     reconnectPeriod: 5000,
//     clean: true,
//   }

//   devLog("Connecting to:", MQTT_CONFIG.brokerUrl, mqttOptions)
//   const client = mqtt.connect(MQTT_CONFIG.brokerUrl, mqttOptions)

//   client.on("connect", () => {
//     devLog("Connected", mqttOptions.clientId)
//     // Subscribe to all topics
//     topics.forEach(tp => {
//       client.subscribe(tp, { qos: 0 }, (err) => {
//         if (err) {
//           devLog("Subscribe error:", tp, err)
//         } else {
//           devLog("Subscribed to", tp)
//         }
//       })
//     })
//   })

//   client.on("message", (receivedTopic, payload) => {
//     devLog("Message received on", receivedTopic, ":", payload.toString())
//     try {
//       const data = JSON.parse(payload.toString())
//       onMessage && onMessage(receivedTopic, data)
//     } catch (e) {
//       onMessage && onMessage(receivedTopic, payload.toString())
//     }
//   })

//   client.on("reconnect", () => devLog("Reconnecting..."))
//   client.on("close", () => devLog("Connection closed"))
//   client.on("offline", () => devLog("MQTT is offline"))
//   client.on("error", (err) => devLog("Error:", err))

//   return client
// }

// /**
//  * Disconnect and cleanup a specific client instance.
//  * @param {MqttClient} client
//  */
// export function disconnect(client) {
//   if (client) {
//     try {
//       devLog("Disconnecting client for:", client.options?.clientId)
//       client.removeAllListeners()
//       client.end(true)
//     } catch (e) {
//       devLog("Error during disconnect", e)
//     }
//   }
// }

// // // src/services/mqttClient.js
// // import mqtt from "mqtt"
// // import MQTT_CONFIG from "../config/mqttConfig"

// // // Return new client, do not overwrite global
// // export function connectAndSubscribe({ topic, onMessage, clientId, options = {} }) {
// //   const mqttOptions = {
// //     ...MQTT_CONFIG.options,
// //     ...options,
// //     clientId: clientId || `dashboard-${Date.now()}`,
// //     reconnectPeriod: 3000,
// //     clean: true,
// //   }
// //   const client = mqtt.connect(MQTT_CONFIG.brokerUrl, mqttOptions)

// //   client.on("connect", () => {
// //     client.subscribe(topic, { qos: 0 })
// //   })
// //   client.on("message", (receivedTopic, payload) => {
// //     try {
// //       const data = JSON.parse(payload.toString())
// //       onMessage && onMessage(receivedTopic, data)
// //     } catch (e) {
// //       onMessage && onMessage(receivedTopic, payload.toString())
// //     }
// //   })
// //   return client
// // }

// // // Accept a client instance to disconnect
// // export function disconnect(client) {
// //   if (client) {
// //     client.removeAllListeners()
// //     try {
// //       client.end(true)
// //     } catch {}
// //   }
// // }

// // // // src/services/mqttClient.js
// // // import mqtt from "mqtt"
// // // import MQTT_CONFIG from "../config/mqttConfig"

// // // let client = null
// // // let lastTopic = null
// // // let lastOnMessage = null

// // // // Utility to log only in development
// // // function devLog(...args) {
// // //   if (process.env.NODE_ENV !== "production") {
// // //     console.log("[MQTT]", ...args)
// // //   }
// // // }

// // // export function connectAndSubscribe({ topic, onMessage, clientId, options = {} }) {
// // //   // End any previous connection
// // //   if (client) {
// // //     try {
// // //       client.end(true)
// // //       devLog("Previous client ended.")
// // //     } catch (e) {
// // //       devLog("Client cleanup error", e)
// // //     }
// // //     client = null
// // //   }

// // //   lastTopic = topic
// // //   lastOnMessage = onMessage

// // //   const mqttOptions = {
// // //     ...MQTT_CONFIG.options,
// // //     ...options,
// // //     clientId: clientId || `dashboard-${Date.now()}`,
// // //     reconnectPeriod: 3000, // auto-reconnect every 3s if disconnected
// // //     clean: true,
// // //   }

// // //   devLog("Connecting to:", MQTT_CONFIG.brokerUrl, mqttOptions)
// // //   client = mqtt.connect(MQTT_CONFIG.brokerUrl, mqttOptions)

// // //   client.on("connect", () => {
// // //     devLog("Connected")
// // //     client.subscribe(topic, { qos: 0 }, (err) => {
// // //       if (err) {
// // //         devLog("Subscribe error:", err)
// // //       } else {
// // //         devLog("Subscribed to", topic)
// // //       }
// // //     })
// // //   })

// // //   client.on("reconnect", () => devLog("Reconnecting..."))

// // //   client.on("close", () => devLog("Connection closed"))
// // //   client.on("offline", () => devLog("MQTT is offline"))

// // //   client.on("error", (err) => {
// // //     devLog("Error:", err)
// // //   })

// // //   client.on("message", (receivedTopic, payload) => {
// // //     devLog("Message received on", receivedTopic, ":", payload.toString())
// // //     if (typeof onMessage === "function") {
// // //       try {
// // //         const data = JSON.parse(payload.toString())
// // //         onMessage(receivedTopic, data)
// // //       } catch (e) {
// // //         // fallback: pass raw payload
// // //         onMessage(receivedTopic, payload.toString())
// // //       }
// // //     }
// // //   })

// // //   return client
// // // }

// // // export function disconnect() {
// // //   if (client) {
// // //     // Remove all listeners to avoid leaks
// // //     client.removeAllListeners()
// // //     try {
// // //       client.end(true)
// // //       devLog("Disconnected by user")
// // //     } catch (e) {
// // //       devLog("Disconnect error", e)
// // //     }
// // //     client = null
// // //   }
// // // }
