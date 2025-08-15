import { useEffect, useState } from "react"
import dayjs from "dayjs"
import axios from "axios"

const CameraOverlay = ({ isLive, currentTime }) => {
  const [liveChatMessages, setLiveChatMessages] = useState([])
  const [logEvents, setLogEvents] = useState([])
  const [visibleEvents, setVisibleEvents] = useState([])

  // Simulate live chat
  useEffect(() => {
    if (!isLive) return
    const interval = setInterval(() => {
      const now = dayjs()
      setLiveChatMessages((prev) => [
        ...prev.slice(-10),
        {
          id: now.valueOf(),
          user: "User" + Math.floor(Math.random() * 100),
          message: "Live event at " + now.format("HH:mm:ss"),
        },
      ])
    }, 4000)
    return () => clearInterval(interval)
  }, [isLive])

  // Load mock backend log events
  useEffect(() => {
    if (isLive) return
    const fetchEvents = async () => {
      try {
        const response = await axios.get("/api/log-events") // replace this with your actual API
        setLogEvents(response.data)
      } catch (e) {
        const mock = []
        for (let i = 1; i <= 20; i++) {
          mock.push({
            time: i * 10,
            user: "Logger",
            message: `Event at ${i * 10}s`,
          })
        }
        setLogEvents(mock)
      }
    }
    fetchEvents()
  }, [isLive])

  // Match events near currentTime
  useEffect(() => {
    if (isLive) return
    const matched = logEvents.filter((e) => Math.abs(e.time - currentTime) < 3)
    setVisibleEvents(matched)
  }, [currentTime, logEvents, isLive])

  return (
    <div className="overlay-chat">
      {(isLive ? liveChatMessages : visibleEvents).map((msg, i) => (
        <div key={msg.id || i} className={`chat-msg ${isLive ? "live" : "recorded"}`}>
          <strong>{msg.user}</strong>: {msg.message}
        </div>
      ))}
    </div>
  )
}

export default CameraOverlay
