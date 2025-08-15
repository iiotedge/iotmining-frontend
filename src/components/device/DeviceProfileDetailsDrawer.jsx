import React from "react"
import {
  Drawer,
  Tabs,
  Button,
  Typography,
  Space,
  Table,
  Tag,
  Card,
  Divider,
  Form,
  Input,
  Select,
  Checkbox,
} from "antd"
import {
  QuestionCircleOutlined,
  EditOutlined,
  CopyOutlined,
  DeleteOutlined,
  FlagOutlined,
} from "@ant-design/icons"

const DeviceProfileDetailsDrawer = ({ visible, onClose, profile }) => {
  if (!profile) return null

  return (
    <Drawer
      title={
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>{profile.name}</Typography.Title>
          <Typography.Text>Device profile details</Typography.Text>
        </div>
      }
      placement="right"
      width={800}
      onClose={onClose}
      open={visible}
      extra={<Button onClick={onClose}>Close</Button>}
    >
      <Tabs defaultActiveKey="details">
        <Tabs.TabPane tab="Details" key="details">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space>
              <Button icon={<FlagOutlined />}>Make default</Button>
              <Button icon={<DeleteOutlined />} danger>Delete profile</Button>
              <Button icon={<CopyOutlined />}>Copy profile Id</Button>
              <Button icon={<QuestionCircleOutlined />} />
            </Space>
            <Divider />
            <Form layout="vertical">
              <Form.Item label="Name">
                <Input value={profile.name} readOnly />
              </Form.Item>
              <Form.Item label="Profile type">
                <Input value={profile.profileType} readOnly />
              </Form.Item>
              <Form.Item label="Transport type">
                <Input value={profile.transportType} readOnly />
              </Form.Item>
              <Form.Item label="Description">
                <Input.TextArea value={profile.description} readOnly />
              </Form.Item>
            </Form>
          </Space>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Transport configuration" key="transport">
          <Card>
            <Typography.Text strong>Transport type: {profile.transportType}</Typography.Text>
            <Divider />
            <Form layout="vertical">
              <Form.Item label="Telemetry topic filter">
                <Input value="v1/devices/me/telemetry" readOnly />
              </Form.Item>
              <Form.Item label="Attributes publish topic filter">
                <Input value="v1/devices/me/attributes" readOnly />
              </Form.Item>
            </Form>
          </Card>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Calculated fields" key="calculated">
          <Typography.Text>No calculated fields found.</Typography.Text>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Alarm rules" key="alarms">
          <Typography.Text>No alarm rules configured.</Typography.Text>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Device provisioning" key="provisioning">
          <Form layout="vertical">
            <Form.Item label="Provision strategy">
              <Select defaultValue="Disabled" disabled style={{ width: 220 }}>
                <Select.Option value="Disabled">Disabled</Select.Option>
                <Select.Option value="Allow">Allow to create new devices</Select.Option>
                <Select.Option value="PreProvisioned">Check for pre-provisioned devices</Select.Option>
                <Select.Option value="X509">X509 Certificates Chain</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Audit logs" key="audit">
          <Table
            columns={[
              { title: "Timestamp", dataIndex: "timestamp" },
              { title: "User", dataIndex: "user" },
              { title: "Action", dataIndex: "action" },
              { title: "Status", dataIndex: "status", render: (v) => <Tag color={v === "Success" ? "green" : "red"}>{v}</Tag> },
            ]}
            dataSource={[]}
            pagination={false}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Version control" key="version">
          <Card>
            <Typography.Title level={5}>Repository settings</Typography.Title>
            <Form layout="vertical">
              <Form.Item label="Repository URL">
                <Input placeholder="Enter repository URL" />
              </Form.Item>
              <Form.Item label="Default branch name">
                <Input defaultValue="main" />
              </Form.Item>
            </Form>
          </Card>
        </Tabs.TabPane>
      </Tabs>
    </Drawer>
  )
}

export default DeviceProfileDetailsDrawer
