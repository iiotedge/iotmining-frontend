import { useEffect, useState } from "react"
import dayjs from "dayjs"
import axios from "axios"
import { Input, Tabs, List, Tag, Select } from "antd"

const { TabPane } = Tabs
const { Option } = Select

const CameraEventSidebar = ({ isLive, currentTime }) => {
  const [liveEvents, setLiveEvents] = useState([])
  const [recordedEvents, setRecordedEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [searchText, setSearchText] = useState("")
  const [filterType, setFilterType] = useState("all")

  // Simulate Live Feed
  useEffect(() => {
    if (!isLive) return
    const interval = setInterval(() => {
      const now = dayjs()
      setLiveEvents((prev) => [
        ...prev.slice(-50),
        {
          id: now.valueOf(),
          time: now.format("HH:mm:ss"),
          user: "User" + Math.floor(Math.random() * 100),
          type: "motion",
          message: "Live motion detected",
        },
      ])
    }, 4000)
    return () => clearInterval(interval)
  }, [isLive])

  // Fetch Recorded Events
  useEffect(() => {
    if (isLive) return
    const fetchLogs = async () => {
      try {
        const response = await axios.get("/api/log-events")
        setRecordedEvents(response.data)
      } catch {
        const mock = []
        for (let i = 1; i <= 20; i++) {
          mock.push({
            id: i,
            time: i * 10,
            user: "Logger",
            type: i % 2 === 0 ? "motion" : "object",
            message: `Event at ${i * 10}s`,
          })
        }
        setRecordedEvents(mock)
      }
    }
    fetchLogs()
  }, [isLive])

  // Filter Playback Events based on currentTime, search, type
  useEffect(() => {
    if (isLive) return

    let events = recordedEvents.filter(
      (e) => Math.abs(e.time - currentTime) < 5
    )

    if (filterType !== "all") {
      events = events.filter((e) => e.type === filterType)
    }

    if (searchText) {
      events = events.filter((e) =>
        e.message.toLowerCase().includes(searchText.toLowerCase())
      )
    }

    setFilteredEvents(events)
  }, [currentTime, recordedEvents, searchText, filterType, isLive])

  const renderItem = (item) => (
    <List.Item>
      <List.Item.Meta
        title={
          <span>
            {item.time}{" "}
            <Tag color={item.type === "motion" ? "green" : "blue"}>
              {item.type.toUpperCase()}
            </Tag>
          </span>
        }
        description={
          <>
            <strong>{item.user}</strong>: {item.message}
          </>
        }
      />
    </List.Item>
  )

  return (
    <div className="event-sidebar">
      <Tabs defaultActiveKey="1">
        <TabPane tab="Live Events" key="1" disabled={!isLive}>
          <List
            size="small"
            dataSource={liveEvents.slice().reverse()}
            renderItem={renderItem}
          />
        </TabPane>
        <TabPane tab="Playback Events" key="2" disabled={isLive}>
          <div style={{ marginBottom: 8 }}>
            <Input
              placeholder="Search events"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ marginTop: 8, width: "100%" }}
            >
              <Option value="all">All</Option>
              <Option value="motion">Motion</Option>
              <Option value="object">Object</Option>
              <Option value="custom">Custom</Option>
            </Select>
          </div>
          <List
            size="small"
            dataSource={filteredEvents}
            renderItem={renderItem}
          />
        </TabPane>
      </Tabs>
    </div>
  )
}

export default CameraEventSidebar
