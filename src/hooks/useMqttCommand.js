// src/hooks/useMqttCommand.js
import { useContext, useState } from "react"
import { MqttContext } from "../services/MqttProvider"

const LOG_STYLE = {
  info: "color:#4e88e6;font-weight:bold",
  success: "color:#1aaa55;font-weight:bold",
  error: "color:#e14b3b;font-weight:bold",
  topic: "color:#d19a18;font-weight:bold",
}

export function useMqttCommand(dataSource = {}) {
  const context = useContext(MqttContext) || {}
  const { sendMqttCommand, connected } = context
  const [isSending, setIsSending] = useState(false)

  // Resolve topic from dataSource (robust, logs for debug)
  const topic =
    // dataSource?.topic ||
    // dataSource?.dataSource?.topic ||
    (dataSource?.deviceId || dataSource?.dataSource?.deviceId
      ? `kepler/prod/delhi/rms-device/${dataSource.deviceId || dataSource?.dataSource?.deviceId}/down/control`
      : null)

  if (process.env.NODE_ENV === "development") {
    console.log(
      "%c[useMqttCommand] Init | MQTT: %c%s %c| Topic: %c%s | dataSource: %o",
      LOG_STYLE.info,
      LOG_STYLE.success,
      connected ? "CONNECTED" : "NOT CONNECTED",
      LOG_STYLE.info,
      LOG_STYLE.topic,
      topic || "N/A",
      dataSource
    )
  }

  // Main sendCommand: always use sendMqttCommand from context!
  const sendCommand = async (payload) => {
    if (!connected || !sendMqttCommand) {
      console.error(
        "%c[useMqttCommand] Not connected, or sendMqttCommand missing.",
        LOG_STYLE.error
      )
      throw new Error("MQTT not connected or sendMqttCommand missing")
    }
    if (!topic) {
      console.error(
        "%c[useMqttCommand] No MQTT topic resolved for sendCommand! dataSource: %o",
        LOG_STYLE.error,
        dataSource
      )
      throw new Error("MQTT topic missing")
    }

    console.log(
      "%c[useMqttCommand] Sending command → topic:%c %s",
      LOG_STYLE.info,
      LOG_STYLE.topic,
      topic
    )
    console.log(
      "%c[useMqttCommand] Payload:%c %s",
      LOG_STYLE.info,
      "color:#111;font-weight:normal",
      JSON.stringify(payload)
    )

    setIsSending(true)
    try {
      await sendMqttCommand(topic, payload)
      setIsSending(false)
      console.log(
        "%c[useMqttCommand] Command sent successfully → %c%s",
        LOG_STYLE.success,
        LOG_STYLE.topic,
        topic
      )
    } catch (err) {
      setIsSending(false)
      console.error(
        "%c[useMqttCommand] Command send failed! Error:",
        LOG_STYLE.error,
        err
      )
      throw err
    }
  }

  return { sendCommand, isSending, connected }
}
