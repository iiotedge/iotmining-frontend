import React from "react"
import { Spin } from "antd"
import { LoadingOutlined } from "@ant-design/icons"
import "./IotLoader.css"

const IotLoader = ({ message = "Loading IoT data..." }) => {
  return (
    <div className="iot-loader">
      <Spin
        indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
        size="large"
      />
      <div className="iot-loader-text">{message}</div>
    </div>
  )
}

export default IotLoader
