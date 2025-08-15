import webSocketService from "./WebSocketService"
import { message } from "antd"

const STORAGE_KEY = "iot_notifications"
let subscribers = {}
let notifications = []
let unreadCount = 0
let isConnected = false

const notifySubscribers = (event, data) => {
  (subscribers[event] || []).forEach(cb => cb(data))
}

const save = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
}

const fetchNotifications = async () => {
  const raw = localStorage.getItem(STORAGE_KEY)
  notifications = raw ? JSON.parse(raw) : []
  unreadCount = notifications.filter(n => !n.read && !n.deleted).length
}

const getNotifications = () => notifications.filter(n => !n.deleted)
const getDeletedNotifications = () => notifications.filter(n => n.deleted)
const getUnreadCount = () => unreadCount

const markAllAsRead = () => {
  notifications = notifications.map(n => ({ ...n, read: true }))
  unreadCount = 0
  save()
  notifySubscribers("unreadCountChanged", unreadCount)
  notifySubscribers("notificationsChanged", getNotifications())
}

const markAsRead = (id) => {
  notifications = notifications.map(n =>
    n.id === id ? { ...n, read: true } : n
  )
  unreadCount = notifications.filter(n => !n.read && !n.deleted).length
  save()
  notifySubscribers("unreadCountChanged", unreadCount)
  notifySubscribers("notificationsChanged", getNotifications())
}

const deleteNotification = (id) => {
  notifications = notifications.map(n =>
    n.id === id ? { ...n, deleted: true } : n
  )
  unreadCount = notifications.filter(n => !n.read && !n.deleted).length
  save()
  notifySubscribers("unreadCountChanged", unreadCount)
  notifySubscribers("notificationsChanged", getNotifications())
}

const clearAllNotifications = () => {
  notifications = notifications.map(n => ({ ...n, deleted: true }))
  unreadCount = 0
  save()
  notifySubscribers("unreadCountChanged", unreadCount)
  notifySubscribers("notificationsChanged", getNotifications())
}

const restoreNotification = (id) => {
  notifications = notifications.map(n =>
    n.id === id ? { ...n, deleted: false } : n
  )
  unreadCount = notifications.filter(n => !n.read && !n.deleted).length
  save()
  notifySubscribers("unreadCountChanged", unreadCount)
  notifySubscribers("notificationsChanged", getNotifications())
}

const subscribe = (event, cb) => {
  if (!subscribers[event]) subscribers[event] = []
  subscribers[event].push(cb)
  return () => {
    subscribers[event] = subscribers[event].filter((c) => c !== cb)
  }
}

const connect = async (token) => {
  if (isConnected) return
  isConnected = true

  await fetchNotifications()

  webSocketService.handleMessage = (message) => {
    if (message.type === "NOTIFICATION") {
      const exists = notifications.some(n => n.id === message.payload.id)
      if (!exists) {
        notifications.unshift(message.payload)
        unreadCount++
        save()
        notifySubscribers("notification", message.payload)
        notifySubscribers("unreadCountChanged", unreadCount)
        notifySubscribers("notificationsChanged", getNotifications())
      }
    }
  }

  try {
    await webSocketService.connect("ws://localhost:8087/ws/notifications?token=" + token)
  } catch (err) {
    // Always show a string in the UI
    message.error(err?.message || "Notification WebSocket connection failed")
    isConnected = false
  }
}

const disconnect = () => {
  isConnected = false
  webSocketService.disconnect()
}

export default {
  connect,
  disconnect,
  subscribe,
  fetchNotifications,
  getNotifications,
  getDeletedNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  restoreNotification,
}

// import webSocketService from "./WebSocketService"

// const STORAGE_KEY = "iot_notifications"
// let subscribers = {}
// let notifications = []
// let unreadCount = 0
// let isConnected = false

// const notifySubscribers = (event, data) => {
//   (subscribers[event] || []).forEach(cb => cb(data))
// }

// const save = () => {
//   localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
// }

// const fetchNotifications = async () => {
//   const raw = localStorage.getItem(STORAGE_KEY)
//   notifications = raw ? JSON.parse(raw) : []
//   unreadCount = notifications.filter(n => !n.read && !n.deleted).length
// }

// const getNotifications = () => notifications.filter(n => !n.deleted)
// const getDeletedNotifications = () => notifications.filter(n => n.deleted)
// const getUnreadCount = () => unreadCount

// const markAllAsRead = () => {
//   notifications = notifications.map(n => ({ ...n, read: true }))
//   unreadCount = 0
//   save()
//   notifySubscribers("unreadCountChanged", unreadCount)
//   notifySubscribers("notificationsChanged", getNotifications())
// }

// const markAsRead = (id) => {
//   notifications = notifications.map(n =>
//     n.id === id ? { ...n, read: true } : n
//   )
//   unreadCount = notifications.filter(n => !n.read && !n.deleted).length
//   save()
//   notifySubscribers("unreadCountChanged", unreadCount)
//   notifySubscribers("notificationsChanged", getNotifications())
// }

// const deleteNotification = (id) => {
//   notifications = notifications.map(n =>
//     n.id === id ? { ...n, deleted: true } : n
//   )
//   unreadCount = notifications.filter(n => !n.read && !n.deleted).length
//   save()
//   notifySubscribers("unreadCountChanged", unreadCount)
//   notifySubscribers("notificationsChanged", getNotifications())
// }

// const clearAllNotifications = () => {
//   notifications = notifications.map(n => ({ ...n, deleted: true }))
//   unreadCount = 0
//   save()
//   notifySubscribers("unreadCountChanged", unreadCount)
//   notifySubscribers("notificationsChanged", getNotifications())
// }

// const restoreNotification = (id) => {
//   notifications = notifications.map(n =>
//     n.id === id ? { ...n, deleted: false } : n
//   )
//   unreadCount = notifications.filter(n => !n.read && !n.deleted).length
//   save()
//   notifySubscribers("unreadCountChanged", unreadCount)
//   notifySubscribers("notificationsChanged", getNotifications())
// }

// const subscribe = (event, cb) => {
//   if (!subscribers[event]) subscribers[event] = []
//   subscribers[event].push(cb)
//   return () => {
//     subscribers[event] = subscribers[event].filter((c) => c !== cb)
//   }
// }

// const connect = async (token) => {
//   if (isConnected) return
//   isConnected = true

//   await fetchNotifications()

//   webSocketService.handleMessage = (message) => {
//     if (message.type === "NOTIFICATION") {
//       const exists = notifications.some(n => n.id === message.payload.id)
//       if (!exists) {
//         notifications.unshift(message.payload)
//         unreadCount++
//         save()
//         notifySubscribers("notification", message.payload)
//         notifySubscribers("unreadCountChanged", unreadCount)
//         notifySubscribers("notificationsChanged", getNotifications())
//       }
//     }
//   }

// //  await webSocketService.connect("ws://localhost:8087/ws/notifications", token)
//   await webSocketService.connect("ws://localhost:8087/ws/notifications?token="+ token)
// }

// const disconnect = () => {
//   isConnected = false
//   webSocketService.disconnect()
// }

// export default {
//   connect,
//   disconnect,
//   subscribe,
//   fetchNotifications,
//   getNotifications,
//   getDeletedNotifications,
//   getUnreadCount,
//   markAsRead,
//   markAllAsRead,
//   deleteNotification,
//   clearAllNotifications,
//   restoreNotification,
// }


// //const STORAGE_KEY = "iot_notifications"
// //let socket = null
// //let subscribers = {}
// //let notifications = []
// //let unreadCount = 0
// //
// //const notifySubscribers = (event, data) => {
// //  (subscribers[event] || []).forEach(cb => cb(data))
// //}
// //
// //const save = () => {
// //  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
// //}
// //
// //const fetchNotifications = async () => {
// //  const raw = localStorage.getItem(STORAGE_KEY)
// //  notifications = raw ? JSON.parse(raw) : []
// //  unreadCount = notifications.filter(n => !n.read && !n.deleted).length
// //}
// //
// //const getNotifications = () => notifications.filter(n => !n.deleted)
// //const getDeletedNotifications = () => notifications.filter(n => n.deleted)
// //const getUnreadCount = () => unreadCount
// //
// //const markAllAsRead = () => {
// //  notifications = notifications.map(n => ({ ...n, read: true }))
// //  unreadCount = 0
// //  save()
// //  notifySubscribers("unreadCountChanged", unreadCount)
// //  notifySubscribers("notificationsChanged", getNotifications())
// //}
// //
// //const markAsRead = (id) => {
// //  notifications = notifications.map(n =>
// //    n.id === id ? { ...n, read: true } : n
// //  )
// //  unreadCount = notifications.filter(n => !n.read && !n.deleted).length
// //  save()
// //  notifySubscribers("unreadCountChanged", unreadCount)
// //  notifySubscribers("notificationsChanged", getNotifications())
// //}
// //
// //const deleteNotification = (id) => {
// //  notifications = notifications.map(n =>
// //    n.id === id ? { ...n, deleted: true } : n
// //  )
// //  unreadCount = notifications.filter(n => !n.read && !n.deleted).length
// //  save()
// //  notifySubscribers("unreadCountChanged", unreadCount)
// //  notifySubscribers("notificationsChanged", getNotifications())
// //}
// //
// //const clearAllNotifications = () => {
// //  notifications = notifications.map(n => ({ ...n, deleted: true }))
// //  unreadCount = 0
// //  save()
// //  notifySubscribers("unreadCountChanged", unreadCount)
// //  notifySubscribers("notificationsChanged", getNotifications())
// //}
// //
// //const restoreNotification = (id) => {
// //  notifications = notifications.map(n =>
// //    n.id === id ? { ...n, deleted: false } : n
// //  )
// //  unreadCount = notifications.filter(n => !n.read && !n.deleted).length
// //  save()
// //  notifySubscribers("unreadCountChanged", unreadCount)
// //  notifySubscribers("notificationsChanged", getNotifications())
// //}
// //
// //const subscribe = (event, cb) => {
// //  if (!subscribers[event]) subscribers[event] = []
// //  subscribers[event].push(cb)
// //  return () => {
// //    subscribers[event] = subscribers[event].filter((c) => c !== cb)
// //  }
// //}
// //
// //const connect = (token) => {
// //  if (socket && socket.readyState === WebSocket.OPEN) return
// ////  socket = new WebSocket(`ws://localhost:8087/ws/notifications`)
// //    const dummyToken = token || "dummy-token"
// //    console.log("🔌 Attempting WebSocket connection");
// //    const socket = new WebSocket("ws://localhost:8087/ws/notifications", [token]);
// //
// //  socket.onmessage = (event) => {
// //    try {
// //      const message = JSON.parse(event.data)
// //      if (message.type === "NOTIFICATION") {
// //        const exists = notifications.some(n => n.id === message.payload.id)
// //        if (!exists) {
// //          notifications.unshift(message.payload)
// //          unreadCount++
// //          save()
// //          notifySubscribers("notification", message.payload)
// //          notifySubscribers("unreadCountChanged", unreadCount)
// //          notifySubscribers("notificationsChanged", getNotifications())
// //        }
// //      }
// //    } catch (err) {
// //      console.error("WebSocket parse error:", err)
// //    }
// //  }
// //
// //  socket.onclose = () => console.warn("WebSocket closed")
// //  socket.onerror = (err) => console.error("WebSocket error:", err)
// //}
// //
// //export default {
// //  connect,
// //  disconnect: () => socket?.close(),
// //  subscribe,
// //  fetchNotifications,
// //  getNotifications,
// //  getDeletedNotifications,
// //  getUnreadCount,
// //  markAsRead,
// //  markAllAsRead,
// //  deleteNotification,
// //  clearAllNotifications,
// //  restoreNotification,
// //}
// //
// //
// ////const STORAGE_KEY = "iot_notifications"
// ////let socket = null
// ////let subscribers = {}
// ////let notifications = []
// ////let unreadCount = 0
// ////
// ////const notifySubscribers = (event, data) => {
// ////  (subscribers[event] || []).forEach(cb => cb(data))
// ////}
// ////
// ////const save = () => {
// ////  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
// ////}
// ////
// ////const fetchNotifications = async () => {
// ////  const raw = localStorage.getItem(STORAGE_KEY)
// ////  notifications = raw ? JSON.parse(raw) : []
// ////  unreadCount = notifications.filter(n => !n.read && !n.deleted).length
// ////}
// ////
// ////const getNotifications = () => notifications.filter(n => !n.deleted)
// ////const getDeletedNotifications = () => notifications.filter(n => n.deleted)
// ////const getUnreadCount = () => unreadCount
// ////
// ////const markAllAsRead = () => {
// ////  notifications = notifications.map(n => ({ ...n, read: true }))
// ////  unreadCount = 0
// ////  save()
// ////  notifySubscribers("unreadCountChanged", unreadCount)
// ////  notifySubscribers("notificationsChanged", getNotifications())
// ////}
// ////
// ////const markAsRead = (id) => {
// ////  notifications = notifications.map(n =>
// ////    n.id === id ? { ...n, read: true } : n
// ////  )
// ////  unreadCount = notifications.filter(n => !n.read && !n.deleted).length
// ////  save()
// ////  notifySubscribers("unreadCountChanged", unreadCount)
// ////  notifySubscribers("notificationsChanged", getNotifications())
// ////}
// ////
// ////const deleteNotification = (id) => {
// ////  notifications = notifications.map(n =>
// ////    n.id === id ? { ...n, deleted: true } : n
// ////  )
// ////  unreadCount = notifications.filter(n => !n.read && !n.deleted).length
// ////  save()
// ////  notifySubscribers("unreadCountChanged", unreadCount)
// ////  notifySubscribers("notificationsChanged", getNotifications())
// ////}
// ////
// ////const clearAllNotifications = () => {
// ////  notifications = notifications.map(n => ({ ...n, deleted: true }))
// ////  unreadCount = 0
// ////  save()
// ////  notifySubscribers("unreadCountChanged", unreadCount)
// ////  notifySubscribers("notificationsChanged", getNotifications())
// ////}
// ////
// ////const restoreNotification = (id) => {
// ////  notifications = notifications.map(n =>
// ////    n.id === id ? { ...n, deleted: false } : n
// ////  )
// ////  unreadCount = notifications.filter(n => !n.read && !n.deleted).length
// ////  save()
// ////  notifySubscribers("unreadCountChanged", unreadCount)
// ////  notifySubscribers("notificationsChanged", getNotifications())
// ////}
// ////
// ////const subscribe = (event, cb) => {
// ////  if (!subscribers[event]) subscribers[event] = []
// ////  subscribers[event].push(cb)
// ////  return () => {
// ////    subscribers[event] = subscribers[event].filter((c) => c !== cb)
// ////  }
// ////}
// ////
// ////const connect = (token) => {
// ////  if (socket && socket.readyState === WebSocket.OPEN) return
// ////  socket = new WebSocket(`ws://localhost:8087/ws/notifications`)
// ////
// ////  socket.onmessage = (event) => {
// ////    try {
// ////      const message = JSON.parse(event.data)
// ////      if (message.type === "NOTIFICATION") {
// ////        const exists = notifications.some(n => n.id === message.payload.id)
// ////        if (!exists) {
// ////          notifications.unshift(message.payload)
// ////          unreadCount++
// ////          save()
// ////          notifySubscribers("notification", message.payload)
// ////          notifySubscribers("unreadCountChanged", unreadCount)
// ////          notifySubscribers("notificationsChanged", getNotifications())
// ////        }
// ////      }
// ////    } catch (err) {
// ////      console.error("WebSocket parse error:", err)
// ////    }
// ////  }
// ////
// ////  socket.onclose = () => console.warn("WebSocket closed")
// ////  socket.onerror = (err) => console.error("WebSocket error:", err)
// ////}
// ////
// ////export default {
// ////  connect,
// ////  disconnect: () => socket?.close(),
// ////  subscribe,
// ////  fetchNotifications,
// ////  getNotifications,
// ////  getDeletedNotifications,
// ////  getUnreadCount,
// ////  markAsRead,
// ////  markAllAsRead,
// ////  deleteNotification,
// ////  clearAllNotifications,
// ////  restoreNotification,
// ////}
// //
// //
// //// let socket = null
// //// let subscribers = {}
// //// let notifications = []
// //// let unreadCount = 0
// //
// //// const connect = (token) => {
// ////   if (socket && socket.readyState === WebSocket.OPEN) return
// //
// ////   // const wsUrl = `ws://localhost:8087/ws/notifications?token=${token}` // 🔁 adjust if needed
// ////   const wsUrl = `ws://localhost:8087/ws/notifications`
// //
// ////   socket = new WebSocket(wsUrl)
// //
// ////   socket.onopen = () => {
// ////     console.log("WebSocket connected")
// ////   }
// //
// ////   socket.onmessage = (event) => {
// ////     try {
// ////       const message = JSON.parse(event.data)
// //
// ////       // if (message.type === "NOTIFICATION") {
// ////       //   notifications.unshift(message.payload)
// ////       //   unreadCount++
// ////       //   notifySubscribers("notification", message.payload)
// ////       //   notifySubscribers("unreadCountChanged", unreadCount)
// ////       // }
// ////       if (message.type === "NOTIFICATION") {
// ////         const existing = notifications.find(n => n.id === message.payload.id)
// ////         if (!existing) {
// ////           notifications.unshift(message.payload)
// ////           unreadCount++
// ////           notifySubscribers("notification", message.payload)
// ////           notifySubscribers("unreadCountChanged", unreadCount)
// ////         }
// ////       }
// ////     } catch (error) {
// ////       console.error("Error parsing WebSocket message:", error)
// ////     }
// ////   }
// //
// ////   socket.onclose = () => {
// ////     console.warn("WebSocket disconnected")
// ////   }
// //
// ////   socket.onerror = (error) => {
// ////     console.error("WebSocket error:", error)
// ////   }
// //// }
// //
// //// const disconnect = () => {
// ////   if (socket) {
// ////     socket.close()
// ////     socket = null
// ////   }
// //// }
// //
// //// const subscribe = (event, callback) => {
// ////   if (!subscribers[event]) {
// ////     subscribers[event] = []
// ////   }
// ////   subscribers[event].push(callback)
// //
// ////   return () => {
// ////     subscribers[event] = subscribers[event].filter((cb) => cb !== callback)
// ////   }
// //// }
// //
// //// const notifySubscribers = (event, data) => {
// ////   if (subscribers[event]) {
// ////     subscribers[event].forEach((cb) => cb(data))
// ////   }
// //// }
// //
// //// // Optional: simulate fetching from server on initial load
// //// const fetchNotifications = async () => {
// ////   // Simulate server call or replace with actual API
// ////   await new Promise((resolve) => setTimeout(resolve, 500))
// ////   // You can preload from localStorage or server here if needed
// //// }
// //
// //// const markAllAsRead = () => {
// ////   notifications = notifications.map((n) => ({ ...n, read: true }))
// ////   unreadCount = 0
// ////   notifySubscribers("unreadCountChanged", unreadCount)
// //// }
// //
// //// const markAsRead = (id) => {
// ////   notifications = notifications.map((n) =>
// ////     n.id === id ? { ...n, read: true } : n
// ////   )
// ////   unreadCount = notifications.filter((n) => !n.read).length
// ////   notifySubscribers("unreadCountChanged", unreadCount)
// //// }
// //
// //// const getNotifications = () => notifications
// //// const getUnreadCount = () => unreadCount
// //
// //// export default {
// ////   connect,
// ////   disconnect,
// ////   subscribe,
// ////   fetchNotifications,
// ////   markAllAsRead,
// ////   markAsRead,
// ////   getNotifications,
// ////   getUnreadCount,
// //// }
