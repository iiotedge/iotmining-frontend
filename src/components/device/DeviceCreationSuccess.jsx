"use client"

import { useState } from "react"
import { Modal, Tabs, Button, Typography, Space, Table, Checkbox, Tag } from "antd"
import { CopyOutlined, CloseOutlined } from "@ant-design/icons"

const { TabPane } = Tabs

const DeviceCreationSuccess = ({ visible, onClose, device }) => {
  const [doNotShow, setDoNotShow] = useState(false)
  const [activeProtocol, setActiveProtocol] = useState("HTTP")
  const [activePlatform, setActivePlatform] = useState("Windows")

  // Generate a random token for demo purposes
  const deviceToken = device?.accessToken || "7trup7vozemu72ybkggk"
  const deviceId = device?.key || "12345"

  const protocols = {
    HTTP: {
      platforms: ["Windows", "MacOS", "Linux"],
      commands: {
        Windows: `curl -v -X POST http://demo.thingsboard.io/api/v1/${deviceId}`,
        MacOS: `curl -v -X POST http://demo.thingsboard.io/api/v1/${deviceId}`,
        Linux: `curl -v -X POST http://demo.thingsboard.io/api/v1/${deviceId}`,
      },
    },
    MQTT: {
      platforms: ["Windows", "MacOS", "Linux", "Docker"],
      install: {
        Linux: "sudo apt-get install curl mosquitto-clients",
      },
      commands: {
        Linux: `mosquitto_pub -d -q 1 -h demo.thingsboard.io -p 1883 -t v1/device`,
      },
    },
    CoAP: {
      platforms: ["Linux", "Docker"],
      install: {
        Linux: "Use the instructions to download, install, setup and run coap-client",
      },
      commands: {
        Linux: `coap-client -v 6 -m POST coap://demo.thingsboard.io:5683/api/v1/m`,
      },
    },
  }

  const telemetryColumns = [
    {
      title: "Time",
      dataIndex: "time",
      key: "time",
    },
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
    },
  ]

  const handleClose = () => {
    if (doNotShow) {
      // Save preference to localStorage or backend
      localStorage.setItem("hideDeviceCreationSuccess", "true")
    }
    onClose()
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    // Could add a notification here
  }

  return (
    <Modal
      title={
        <div className="device-success-header">
          <span>Device created. Let's check connectivity!</span>
          <Button type="text" icon={<CloseOutlined />} onClick={handleClose} className="close-button" />
        </div>
      }
      open={visible}
      onCancel={handleClose}
      width={700}
      footer={null}
      closable={false}
    >
      <Tabs activeKey={activeProtocol} onChange={setActiveProtocol} type="card" className="protocol-tabs">
        {Object.keys(protocols).map((protocol) => (
          <TabPane tab={protocol} key={protocol} />
        ))}
      </Tabs>

      <Typography.Text>
        Use the following instructions for sending telemetry on behalf of the device using shell
      </Typography.Text>

      <Tabs activeKey={activePlatform} onChange={setActivePlatform} className="platform-tabs">
        {protocols[activeProtocol].platforms.map((platform) => (
          <TabPane
            tab={
              <Space>
                {platform === "Windows" && <span className="platform-icon windows">⊞</span>}
                {platform === "MacOS" && <span className="platform-icon macos">⌘</span>}
                {platform === "Linux" && <span className="platform-icon linux">🐧</span>}
                {platform === "Docker" && <span className="platform-icon docker">🐳</span>}
                {platform}
              </Space>
            }
            key={platform}
          />
        ))}
      </Tabs>

      {protocols[activeProtocol].install?.[activePlatform] && (
        <>
          <Typography.Title level={5}>Install necessary client tools</Typography.Title>
          <div className="code-block">
            <pre className={activeProtocol.toLowerCase()}>{protocols[activeProtocol].install[activePlatform]}</pre>
            <Button
              icon={<CopyOutlined />}
              className="copy-button"
              onClick={() => copyToClipboard(protocols[activeProtocol].install[activePlatform])}
            />
          </div>
        </>
      )}

      <Typography.Title level={5}>Execute the following command</Typography.Title>
      <div className="code-block">
        <pre className={activeProtocol.toLowerCase()}>
          {protocols[activeProtocol].commands[activePlatform] || `Command for ${activePlatform} not available`}
        </pre>
        <Button
          icon={<CopyOutlined />}
          className="copy-button"
          onClick={() => copyToClipboard(protocols[activeProtocol].commands[activePlatform] || "")}
        />
      </div>

      <div className="device-state">
        <Typography.Title level={5}>State</Typography.Title>
        <Tag color="volcano">Inactive</Tag>

        <Typography.Title level={5}>Latest telemetry</Typography.Title>
        <Table
          columns={telemetryColumns}
          dataSource={[]}
          pagination={false}
          locale={{
            emptyText: (
              <div className="no-telemetry">
                <img src="/placeholder.svg?height=50&width=50" alt="No data" />
                <Typography.Text>No latest telemetry</Typography.Text>
              </div>
            ),
          }}
        />
      </div>

      <div className="modal-footer">
        <Checkbox checked={doNotShow} onChange={(e) => setDoNotShow(e.target.checked)}>
          Do not show again
        </Checkbox>
        <Button onClick={handleClose}>Close</Button>
      </div>
    </Modal>
  )
}

export default DeviceCreationSuccess

