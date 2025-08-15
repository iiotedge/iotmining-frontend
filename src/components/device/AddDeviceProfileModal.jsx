"use client"

import React, { useState, useEffect } from "react"
import {
  Modal, Button, Form, Input, Select, Space, Typography, Row, Col, Divider
} from "antd"

const { Option } = Select

const initialOutput = { key: "", dataType: "", format: "", description: "" }
const initialInput = { action: "", targetType: "", destination: "", description: "" }
const dataTypes = [
  "STRING", "JSON", "ARRAY_OF_JSON", "BOOLEAN", "NUMBER", "String"
]

const AddDeviceProfileModal = ({ visible, onCancel, onAdd, tenants = [] }) => {
  const [form] = Form.useForm()
  const [outputs, setOutputs] = useState([{ ...initialOutput }])
  const [inputs, setInputs] = useState([{ ...initialInput }])
  const [metadata, setMetadata] = useState({})

  useEffect(() => {
    if (!visible) return
    form.resetFields()
    setOutputs([{ ...initialOutput }])
    setInputs([{ ...initialInput }])
    setMetadata({})
  }, [visible])

  // Output handlers
  const handleOutputChange = (idx, field, value) => {
    const list = [...outputs]
    list[idx][field] = value
    setOutputs(list)
  }
  const addOutput = () => setOutputs([...outputs, { ...initialOutput }])
  const removeOutput = (idx) => setOutputs(outputs.filter((_, i) => i !== idx))

  // Input handlers
  const handleInputChange = (idx, field, value) => {
    const list = [...inputs]
    list[idx][field] = value
    setInputs(list)
  }
  const addInput = () => setInputs([...inputs, { ...initialInput }])
  const removeInput = (idx) => setInputs(inputs.filter((_, i) => i !== idx))

  // Metadata
  const handleMetaChange = (field, value) => setMetadata({ ...metadata, [field]: value })

  // On submit
  const handleFinish = (values) => {
    // Merge form with outputs, inputs, and metadata
    const payload = {
      ...values,
      outputs,
      inputs,
      metadata,
      parentId: values.parentId || null
    }
    if (onAdd) onAdd(payload)
    form.resetFields()
    setOutputs([{ ...initialOutput }])
    setInputs([{ ...initialInput }])
    setMetadata({})
  }

  return (
    <Modal
      title="Add Device Profile"
      open={visible}
      onCancel={() => { onCancel(); form.resetFields() }}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} preserve={false}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
              <Input placeholder="Profile Name" />
            </Form.Item>
            <Form.Item name="type" label="Profile Type" initialValue="Device">
              <Select>
                <Option value="Device">Device</Option>
                <Option value="Gateway">Gateway</Option>
                <Option value="Asset">Asset</Option>
              </Select>
            </Form.Item>
            <Form.Item name="protocol" label="Protocol" initialValue="MQTT">
              <Select>
                <Option value="MQTT">MQTT</Option>
                <Option value="HTTP">HTTP</Option>
                <Option value="CoAP">CoAP</Option>
                <Option value="LWM2M">LWM2M</Option>
              </Select>
            </Form.Item>
            {/* Tenant as parentId */}
            <Form.Item name="parentId" label="Tenant">
              <Select
                showSearch
                placeholder="Select Tenant"
                optionFilterProp="label"
                allowClear
                options={tenants.map(t => ({ value: t.id, label: t.name }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Divider orientation="left">Metadata</Divider>
            <Row gutter={6}>
              <Col span={12}>
                <Input
                  placeholder="Model"
                  value={metadata.model}
                  onChange={e => handleMetaChange("model", e.target.value)}
                  style={{ marginBottom: 8 }}
                />
              </Col>
              <Col span={12}>
                <Input
                  placeholder="MQTT Topic"
                  value={metadata.mqtt_topic}
                  onChange={e => handleMetaChange("mqtt_topic", e.target.value)}
                  style={{ marginBottom: 8 }}
                />
              </Col>
              <Col span={12}>
                <Input
                  placeholder="Location"
                  value={metadata.location}
                  onChange={e => handleMetaChange("location", e.target.value)}
                  style={{ marginBottom: 8 }}
                />
              </Col>
              <Col span={12}>
                <Input
                  placeholder="Range"
                  value={metadata.range}
                  onChange={e => handleMetaChange("range", e.target.value)}
                  style={{ marginBottom: 8 }}
                />
              </Col>
            </Row>
          </Col>
        </Row>

        <Divider orientation="left">Outputs</Divider>
        {outputs.map((out, idx) => (
          <Row key={idx} gutter={8} style={{ marginBottom: 6 }}>
            <Col span={4}>
              <Input
                placeholder="Key"
                value={out.key}
                onChange={e => handleOutputChange(idx, "key", e.target.value)}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="Data Type"
                value={out.dataType}
                onChange={v => handleOutputChange(idx, "dataType", v)}
                style={{ width: "100%" }}
              >
                {dataTypes.map(dt => <Option key={dt} value={dt}>{dt}</Option>)}
              </Select>
            </Col>
            <Col span={4}>
              <Input
                placeholder="Format"
                value={out.format}
                onChange={e => handleOutputChange(idx, "format", e.target.value)}
              />
            </Col>
            <Col span={8}>
              <Input
                placeholder="Description"
                value={out.description}
                onChange={e => handleOutputChange(idx, "description", e.target.value)}
              />
            </Col>
            <Col span={2}>
              <Button
                danger
                disabled={outputs.length === 1}
                onClick={() => removeOutput(idx)}
              >Remove</Button>
            </Col>
          </Row>
        ))}
        <Button type="dashed" onClick={addOutput} style={{ width: 200, marginBottom: 10 }}>
          Add Output
        </Button>

        <Divider orientation="left">Inputs</Divider>
        {inputs.map((inp, idx) => (
          <Row key={idx} gutter={8} style={{ marginBottom: 6 }}>
            <Col span={4}>
              <Input
                placeholder="Action"
                value={inp.action}
                onChange={e => handleInputChange(idx, "action", e.target.value)}
              />
            </Col>
            <Col span={4}>
              <Input
                placeholder="Target Type"
                value={inp.targetType}
                onChange={e => handleInputChange(idx, "targetType", e.target.value)}
              />
            </Col>
            <Col span={8}>
              <Input
                placeholder="Destination"
                value={inp.destination}
                onChange={e => handleInputChange(idx, "destination", e.target.value)}
              />
            </Col>
            <Col span={6}>
              <Input
                placeholder="Description"
                value={inp.description}
                onChange={e => handleInputChange(idx, "description", e.target.value)}
              />
            </Col>
            <Col span={2}>
              <Button
                danger
                disabled={inputs.length === 1}
                onClick={() => removeInput(idx)}
              >Remove</Button>
            </Col>
          </Row>
        ))}
        <Button type="dashed" onClick={addInput} style={{ width: 200 }}>
          Add Input
        </Button>

        <Divider />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>Cancel</Button>
          <Button type="primary" htmlType="submit">Add Profile</Button>
        </div>
      </Form>
    </Modal>
  )
}

export default AddDeviceProfileModal
