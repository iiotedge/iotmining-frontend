import { message } from "antd"

class WebSocketService {
  constructor() {
    this.socket = null
    this.connected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectTimeout = 2000
    this.listeners = new Map()
    this.messageQueue = []
    this.token = null
  }

  connect(baseUrl, token) {
    return new Promise((resolve, reject) => {
      if (this.socket) this.disconnect()
      this.token = token

      try {
        this.socket = new WebSocket(baseUrl)
      } catch (err) {
        message.error("Failed to create WebSocket: " + (err?.message || "Unknown error"))
        return reject(new Error("WebSocket creation failed"))
      }

      this.socket.onopen = () => {
        if (!this.connected) message.success("WebSocket connected")
        this.connected = true
        this.reconnectAttempts = 0
        while (this.messageQueue.length > 0) {
          const msg = this.messageQueue.shift()
          this.sendMessage(msg)
        }
        resolve()
      }

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (err) {
          message.error("Error parsing WebSocket message")
          console.error("❌ Error parsing message:", err)
        }
      }

      this.socket.onclose = () => {
        this.connected = false
        message.warning("WebSocket connection closed")
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++
            this.connect(baseUrl, token).catch(() =>
              message.error("WebSocket reconnect failed")
            )
          }, this.reconnectTimeout * Math.pow(2, this.reconnectAttempts))
        }
      }

      this.socket.onerror = (event) => {
        this.connected = false
        // Only show a string message (not the Event)
        message.error("WebSocket connection error")
        // Only reject with a real Error object, never the Event
        reject(new Error("WebSocket connection error"))
      }
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
      this.connected = false
    }
  }

  sendMessage(message) {
    if (this.connected && this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    } else {
      this.messageQueue.push(message)
    }
  }

  handleMessage(msg) {
    const { type, data } = msg
    this.listeners.get(type)?.forEach(cb => cb(data))
    this.listeners.get("all")?.forEach(cb => cb(msg))
  }

  subscribe(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, [])
    this.listeners.get(type).push(callback)
    return () => {
      const list = this.listeners.get(type)
      this.listeners.set(type, list.filter(cb => cb !== callback))
    }
  }

  isConnected() {
    return this.connected
  }
}

const webSocketService = new WebSocketService()
export default webSocketService


// class WebSocketService {
//   constructor() {
//     this.socket = null
//     this.connected = false
//     this.reconnectAttempts = 0
//     this.maxReconnectAttempts = 5
//     this.reconnectTimeout = 2000
//     this.listeners = new Map()
//     this.messageQueue = []
//     this.token = null
//   }

//   connect(baseUrl, token) {
//     return new Promise((resolve, reject) => {
//       if (this.socket) this.disconnect()
//       this.token = token

//       try {
// //        this.socket = new WebSocket(baseUrl, [token])

//         this.socket = new WebSocket(baseUrl);
//       } catch (err) {
//         console.error("❌ WebSocket creation failed:", err)
//         return reject(err)
//       }

//       this.socket.onopen = () => {
//         console.log("✅ WebSocket connected")
//         this.socket.send("Hello from React");
//         this.connected = true
//         this.reconnectAttempts = 0
//         while (this.messageQueue.length > 0) {
//           const msg = this.messageQueue.shift()
//           this.sendMessage(msg)
//         }
//         resolve()
//       }

//       this.socket.onmessage = (event) => {
//         try {
//           const data = JSON.parse(event.data)
//               console.log("Received:", JSON.stringify(data, null, 2))
//           this.handleMessage(data)
//         } catch (err) {
//           console.error("❌ Error parsing message:", err)
//         }
//       }

//       this.socket.onclose = () => {
//         console.warn("⚠️ WebSocket closed")
//         this.connected = false
//         if (this.reconnectAttempts < this.maxReconnectAttempts) {
//           setTimeout(() => {
//             this.reconnectAttempts++
//             this.connect(baseUrl, token).catch(() =>
//               console.error("Reconnect failed")
//             )
//           }, this.reconnectTimeout * Math.pow(2, this.reconnectAttempts))
//         }
//       }

//       this.socket.onerror = (err) => {
//         console.error("❌ WebSocket error:", err)
//         reject(err)
//       }
//     })
//   }

//   disconnect() {
//     if (this.socket) {
//       this.socket.close()
//       this.socket = null
//       this.connected = false
//     }
//   }

//   sendMessage(message) {
//     if (this.connected && this.socket?.readyState === WebSocket.OPEN) {
//       this.socket.send(JSON.stringify(message))
//     } else {
//       this.messageQueue.push(message)
//     }
//   }

//   handleMessage(msg) {
//     const { type, data } = msg
//     this.listeners.get(type)?.forEach(cb => cb(data))
//     this.listeners.get("all")?.forEach(cb => cb(msg))
//   }

//   subscribe(type, callback) {
//     if (!this.listeners.has(type)) this.listeners.set(type, [])
//     this.listeners.get(type).push(callback)

//     return () => {
//       const list = this.listeners.get(type)
//       this.listeners.set(type, list.filter(cb => cb !== callback))
//     }
//   }

//   isConnected() {
//     return this.connected
//   }
// }

// const webSocketService = new WebSocketService()
// export default webSocketService


// //// src/services/WebSocketService.js
// //class WebSocketService {
// //  constructor() {
// //    this.socket = null
// //    this.connected = false
// //    this.reconnectAttempts = 0
// //    this.maxReconnectAttempts = 5
// //    this.reconnectTimeout = 2000
// //    this.listeners = new Map()
// //    this.messageQueue = []
// //    this.userId = null
// //  }
// //
// //  connect(baseUrl, userId) {
// //    return new Promise((resolve, reject) => {
// //      if (this.socket) this.disconnect()
// //      this.userId = userId
// //
// //      const wsUrl = `${baseUrl}?userId=${userId}`
// //      this.socket = new WebSocket(wsUrl)
// //
// //      this.socket.onopen = () => {
// //        console.log("✅ WebSocket connected")
// //        this.connected = true
// //        this.reconnectAttempts = 0
// //        while (this.messageQueue.length > 0) {
// //          const msg = this.messageQueue.shift()
// //          this.sendMessage(msg)
// //        }
// //        resolve()
// //      }
// //
// //      this.socket.onmessage = (event) => {
// //        try {
// //          const data = JSON.parse(event.data)
// //          this.handleMessage(data)
// //        } catch (err) {
// //          console.error("❌ Error parsing message:", err)
// //        }
// //      }
// //
// //      this.socket.onclose = () => {
// //        console.warn("⚠️ WebSocket closed")
// //        this.connected = false
// //        if (this.reconnectAttempts < this.maxReconnectAttempts) {
// //          setTimeout(() => {
// //            this.reconnectAttempts++
// //            this.connect(baseUrl, userId).catch(() =>
// //              console.error("Reconnect failed")
// //            )
// //          }, this.reconnectTimeout * Math.pow(2, this.reconnectAttempts))
// //        }
// //      }
// //
// //      this.socket.onerror = (err) => {
// //        console.error("❌ WebSocket error:", err)
// //        reject(err)
// //      }
// //    })
// //  }
// //
// //  disconnect() {
// //    if (this.socket) {
// //      this.socket.close()
// //      this.socket = null
// //      this.connected = false
// //    }
// //  }
// //
// //  sendMessage(message) {
// //    if (this.connected && this.socket?.readyState === WebSocket.OPEN) {
// //      this.socket.send(JSON.stringify(message))
// //    } else {
// //      this.messageQueue.push(message)
// //    }
// //  }
// //
// //  handleMessage(msg) {
// //    const { type, data } = msg
// //    this.listeners.get(type)?.forEach(cb => cb(data))
// //    this.listeners.get("all")?.forEach(cb => cb(msg))
// //  }
// //
// //  subscribe(type, callback) {
// //    if (!this.listeners.has(type)) this.listeners.set(type, [])
// //    this.listeners.get(type).push(callback)
// //
// //    return () => {
// //      const list = this.listeners.get(type)
// //      this.listeners.set(type, list.filter(cb => cb !== callback))
// //    }
// //  }
// //
// //  isConnected() {
// //    return this.connected
// //  }
// //}
// //
// //const webSocketService = new WebSocketService()
// //export default webSocketService

// //class WebSocketService {
// //  constructor() {
// //    this.socket = null
// //    this.connected = false
// //    this.reconnectAttempts = 0
// //    this.maxReconnectAttempts = 5
// //    this.reconnectTimeout = 2000
// //    this.listeners = new Map()
// //    this.messageQueue = []
// //  }
// //
// //  // Connect to WebSocket server
// //  connect(url, token) {
// //    return new Promise((resolve, reject) => {
// //      if (this.socket) {
// //        this.disconnect()
// //      }
// //
// //      const wsUrl = token ? `${url}?token=${token}` : url
// //      this.socket = new WebSocket(wsUrl)
// //
// //      this.socket.onopen = () => {
// //        console.log("WebSocket connection established")
// //        this.connected = true
// //        this.reconnectAttempts = 0
// //
// //        // Send any queued messages
// //        while (this.messageQueue.length > 0) {
// //          const message = this.messageQueue.shift()
// //          this.sendMessage(message)
// //        }
// //
// //        resolve()
// //      }
// //
// //      this.socket.onmessage = (event) => {
// //        try {
// //          const data = JSON.parse(event.data)
// //          this.handleMessage(data)
// //        } catch (e) {
// //          console.error("Error parsing WebSocket message:", e)
// //        }
// //      }
// //
// //      this.socket.onclose = (event) => {
// //        this.connected = false
// //        console.log("WebSocket connection closed", event.code, event.reason)
// //
// //        // Attempt to reconnect
// //        if (this.reconnectAttempts < this.maxReconnectAttempts) {
// //          setTimeout(() => {
// //            this.reconnectAttempts++
// //            this.connect(url, token).catch((err) => {
// //              console.error("WebSocket reconnection failed:", err)
// //            })
// //          }, this.reconnectTimeout * Math.pow(2, this.reconnectAttempts))
// //        }
// //
// //        reject(new Error(`WebSocket closed: ${event.code} ${event.reason}`))
// //      }
// //
// //      this.socket.onerror = (error) => {
// //        console.error("WebSocket error:", error)
// //        reject(error)
// //      }
// //    })
// //  }
// //
// //  // Disconnect WebSocket
// //  disconnect() {
// //    if (this.socket) {
// //      this.socket.close()
// //      this.socket = null
// //      this.connected = false
// //    }
// //  }
// //
// //  // Send message through WebSocket
// //  sendMessage(message) {
// //    if (this.connected && this.socket) {
// //      this.socket.send(JSON.stringify(message))
// //    } else {
// //      // Queue message to be sent when connection is established
// //      this.messageQueue.push(message)
// //    }
// //  }
// //
// //  // Handle incoming message
// //  handleMessage(message) {
// //    const { type, data } = message
// //
// //    if (this.listeners.has(type)) {
// //      this.listeners.get(type).forEach((callback) => {
// //        callback(data)
// //      })
// //    }
// //
// //    // Also trigger 'all' listeners
// //    if (this.listeners.has("all")) {
// //      this.listeners.get("all").forEach((callback) => {
// //        callback(message)
// //      })
// //    }
// //  }
// //
// //  // Subscribe to message type
// //  subscribe(type, callback) {
// //    if (!this.listeners.has(type)) {
// //      this.listeners.set(type, [])
// //    }
// //
// //    this.listeners.get(type).push(callback)
// //
// //    // Return unsubscribe function
// //    return () => {
// //      const callbacks = this.listeners.get(type)
// //      const index = callbacks.indexOf(callback)
// //      if (index !== -1) {
// //        callbacks.splice(index, 1)
// //      }
// //    }
// //  }
// //
// //  // Check if connected
// //  isConnected() {
// //    return this.connected
// //  }
// //}
// //
// //// Create singleton instance
// //const webSocketService = new WebSocketService()
// //
// //export default webSocketService
