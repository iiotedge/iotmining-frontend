"use client"

import { useState } from "react"
import { Drawer, Tabs, Button, Space, Typography, Form, Input, Select, Table, Tag, Checkbox, Card } from "antd"
import { QuestionCircleOutlined, CopyOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons"

const { Title, Text } = Typography
const { TabPane } = Tabs

const CustomerDetailsDrawer = ({ visible, onClose, customer }) => {
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState("details")

  // Table columns for different tabs
  const attributeColumns = [
    {
      title: "Last update time",
      dataIndex: "lastUpdateTime",
      key: "lastUpdateTime",
      sorter: true,
    },
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
      sorter: true,
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
    },
  ]

  const telemetryColumns = [
    {
      title: "Last update time",
      dataIndex: "lastUpdateTime",
      key: "lastUpdateTime",
      sorter: true,
    },
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
      sorter: true,
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
    },
  ]

  const alarmColumns = [
    {
      title: "Created time",
      dataIndex: "createdTime",
      key: "createdTime",
      sorter: true,
    },
    {
      title: "Originator",
      dataIndex: "originator",
      key: "originator",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      render: (severity) => <Tag color={severity === "Critical" ? "red" : "orange"}>{severity}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={status === "Active" ? "red" : "green"}>{status}</Tag>,
    },
  ]

  const eventColumns = [
    {
      title: "Event time",
      dataIndex: "eventTime",
      key: "eventTime",
      sorter: true,
    },
    {
      title: "Server",
      dataIndex: "server",
      key: "server",
    },
    {
      title: "Method",
      dataIndex: "method",
      key: "method",
    },
    {
      title: "Error",
      dataIndex: "error",
      key: "error",
    },
  ]

  if (!customer) return null

  return (
    <Drawer
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Title level={4}>{customer.title}</Title>
          <Text>Customer details</Text>
          <Button type="text" icon={<QuestionCircleOutlined />} />
        </div>
      }
      width={800}
      placement="right"
      onClose={onClose}
      open={visible}
      extra={
        <Space>
          <Button type="primary" onClick={onClose}>
            Close
          </Button>
        </Space>
      }
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Details" key="details">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space>
              <Button>Open details page</Button>
              <Button>Manage users</Button>
              <Button>Manage assets</Button>
              <Button>Manage devices</Button>
              <Button>Manage dashboards</Button>
              <Button>Manage edge instances</Button>
              <Button danger>Delete customer</Button>
            </Space>

            <Button icon={<CopyOutlined />}>Copy customer ID</Button>

            <Form
              form={form}
              layout="vertical"
              initialValues={{
                title: customer.title,
                country: customer.country,
                city: customer.city,
              }}
            >
              <Form.Item name="title" label="Title" required>
                <Input />
              </Form.Item>

              <Form.Item name="description" label="Description">
                <Input.TextArea rows={4} />
              </Form.Item>

              <Form.Item name="homeDashboard" label="Home dashboard">
                <Select placeholder="Select dashboard">
                  <Select.Option value="dashboard1">Dashboard 1</Select.Option>
                  <Select.Option value="dashboard2">Dashboard 2</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item name="hideToolbar" valuePropName="checked">
                <Checkbox>Hide home dashboard toolbar</Checkbox>
              </Form.Item>

              <Form.Item name="country" label="Country">
                <Input />
              </Form.Item>

              <div style={{ display: "flex", gap: "16px" }}>
                <Form.Item name="city" label="City" style={{ flex: 1 }}>
                  <Input />
                </Form.Item>

                <Form.Item name="state" label="State / Province" style={{ flex: 1 }}>
                  <Input />
                </Form.Item>

                <Form.Item name="zip" label="Zip / Postal Code" style={{ flex: 1 }}>
                  <Input />
                </Form.Item>
              </div>

              <Form.Item name="address" label="Address">
                <Input />
              </Form.Item>

              <Form.Item name="address2" label="Address 2">
                <Input />
              </Form.Item>

              <Form.Item name="phone" label="Phone">
                <Input />
              </Form.Item>

              <Form.Item name="email" label="Email">
                <Input />
              </Form.Item>
            </Form>
          </Space>
        </TabPane>

        <TabPane tab="Attributes" key="attributes">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space>
              <Select defaultValue="server" style={{ width: 200 }}>
                <Select.Option value="server">Server attributes</Select.Option>
                <Select.Option value="shared">Shared attributes</Select.Option>
              </Select>
              <Button icon={<SearchOutlined />} />
              <Button icon={<ReloadOutlined />} />
            </Space>

            <Table
              columns={attributeColumns}
              dataSource={[]}
              pagination={{
                total: 0,
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
              }}
            />
          </Space>
        </TabPane>

        <TabPane tab="Latest telemetry" key="telemetry">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space>
              <Button icon={<SearchOutlined />} />
              <Button icon={<ReloadOutlined />} />
            </Space>

            <Table
              columns={telemetryColumns}
              dataSource={[]}
              pagination={{
                total: 0,
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
              }}
            />
          </Space>
        </TabPane>

        <TabPane tab="Alarms" key="alarms">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space>
              <Select defaultValue="active" style={{ width: 200 }}>
                <Select.Option value="active">Filter: Active</Select.Option>
                <Select.Option value="cleared">Filter: Cleared</Select.Option>
                <Select.Option value="all">Filter: All</Select.Option>
              </Select>
              <Button>For all time</Button>
              <Button icon={<SearchOutlined />} />
              <Button icon={<ReloadOutlined />} />
            </Space>

            <Table
              columns={alarmColumns}
              dataSource={[]}
              pagination={{
                total: 0,
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
              }}
            />
          </Space>
        </TabPane>

        <TabPane tab="Events" key="events">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space>
              <Select defaultValue="error" style={{ width: 200 }}>
                <Select.Option value="error">Error</Select.Option>
                <Select.Option value="lifecycle">Lifecycle</Select.Option>
                <Select.Option value="stats">Stats</Select.Option>
              </Select>
              <Button>last 15 minutes</Button>
              <Button icon={<SearchOutlined />} />
              <Button icon={<ReloadOutlined />} />
            </Space>

            <Table
              columns={eventColumns}
              dataSource={[]}
              pagination={{
                total: 0,
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
              }}
            />
          </Space>
        </TabPane>

        <TabPane tab="Relations" key="relations">
          <Space direction="vertical" style={{ width: "100%" }}>
            {/* Relations content */}
          </Space>
        </TabPane>

        <TabPane tab="Audit logs" key="audit">
          <Space direction="vertical" style={{ width: "100%" }}>
            {/* Audit logs content */}
          </Space>
        </TabPane>

        <TabPane tab="Version control" key="version">
          <Card title="Repository settings">
            <Form layout="vertical">
              <Form.Item label="Repository URL" required tooltip="The URL of your Git repository">
                <Input placeholder="Enter repository URL" />
              </Form.Item>

              <Form.Item label="Default branch name">
                <Input defaultValue="main" />
              </Form.Item>

              <Form.Item>
                <Checkbox>Read-only</Checkbox>
              </Form.Item>

              <Form.Item>
                <Checkbox>Show merge commits</Checkbox>
              </Form.Item>

              <Title level={5}>Authentication settings</Title>

              <Form.Item label="Authentication method" required>
                <Select defaultValue="password">
                  <Select.Option value="password">Password / access token</Select.Option>
                  <Select.Option value="ssh">SSH key</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="Username">
                <Input />
              </Form.Item>

              <Form.Item label="Password / access token">
                <Input.Password />
              </Form.Item>

              <Text type="secondary">
                GitHub users must use access tokens with write permissions to the repository.
              </Text>

              <div style={{ marginTop: 24 }}>
                <Space>
                  <Button>Check access</Button>
                  <Button type="primary">Save</Button>
                </Space>
              </div>
            </Form>
          </Card>
        </TabPane>
      </Tabs>
    </Drawer>
  )
}

export default CustomerDetailsDrawer

