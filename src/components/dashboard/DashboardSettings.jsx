"use client"

import { Modal, Form, Checkbox, Input, Select, Upload, Button, Space, Collapse } from "antd"
import { PictureOutlined, LinkOutlined } from "@ant-design/icons"
import { useState } from "react"

const { Panel } = Collapse

const DashboardSettings = ({ visible, onClose }) => {
  const [form] = Form.useForm()
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <Modal
      title="Settings"
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={onClose}>
          Save
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="keepToolbarOpened" valuePropName="checked">
          <Checkbox>Keep toolbar opened</Checkbox>
        </Form.Item>

        <Form.Item name="displayDashboardsSelection" valuePropName="checked">
          <Checkbox>Display dashboards selection</Checkbox>
        </Form.Item>

        <Form.Item name="displayEntitiesSelection" valuePropName="checked">
          <Checkbox>Display entities selection</Checkbox>
        </Form.Item>

        <Form.Item name="displayFilters" valuePropName="checked">
          <Checkbox>Display filters</Checkbox>
        </Form.Item>

        <Form.Item name="displayTimeWindow" valuePropName="checked">
          <Checkbox>Display time window</Checkbox>
        </Form.Item>

        <Form.Item name="displayExport" valuePropName="checked">
          <Checkbox>Display export</Checkbox>
        </Form.Item>

        <Form.Item name="displayUpdateDashboardImage" valuePropName="checked">
          <Checkbox>Display update dashboard image</Checkbox>
        </Form.Item>

        <Collapse>
          <Panel header="Advanced settings" key="advanced">
            <Form.Item label="Layout settings: Default breakpoint">
              <Form.Item name="columnsCount" label="Columns count">
                <Input type="number" min={1} max={24} defaultValue={24} />
              </Form.Item>

              <Form.Item name="minLayoutWidth" label="Minimum layout width">
                <Input type="number" min={1} addonAfter="columns" defaultValue={24} />
              </Form.Item>

              <Form.Item name="marginBetweenWidgets" label="Margin between widgets">
                <Input type="number" min={0} defaultValue={10} />
              </Form.Item>

              <Form.Item name="applyMarginToSides" valuePropName="checked">
                <Checkbox>Apply margin to the sides of the layout</Checkbox>
              </Form.Item>

              <Form.Item name="autoFillHeight" valuePropName="checked">
                <Checkbox>Auto fill layout height</Checkbox>
              </Form.Item>
            </Form.Item>

            <Form.Item label="Background settings">
              <Form.Item name="backgroundColor" label="Background color">
                <Input type="color" />
              </Form.Item>

              <Form.Item label="Background image">
                <Space>
                  <Upload accept="image/*" showUploadList={false}>
                    <Button icon={<PictureOutlined />}>Browse from gallery</Button>
                  </Upload>
                  <Button icon={<LinkOutlined />}>Set link</Button>
                </Space>
              </Form.Item>

              <Form.Item name="backgroundSizeMode" label="Background size mode">
                <Select
                  defaultValue="fit-width"
                  options={[
                    { label: "Fit width", value: "fit-width" },
                    { label: "Fit height", value: "fit-height" },
                    { label: "Stretch", value: "stretch" },
                    { label: "Cover", value: "cover" },
                  ]}
                />
              </Form.Item>
            </Form.Item>

            <Form.Item label="Mobile layout settings">{/* Add mobile layout settings here */}</Form.Item>
          </Panel>
        </Collapse>
      </Form>
    </Modal>
  )
}

export default DashboardSettings

