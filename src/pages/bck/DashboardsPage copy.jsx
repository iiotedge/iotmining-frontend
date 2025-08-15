"use client"

import { useState } from "react"
import { Card, Table, Button, Space, Typography, Modal, Checkbox, Upload, message, Tabs, Tag } from "antd"
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons"
import { useNavigate, Link } from "react-router-dom"
import AddDashboardModal from "../components/dashboard/AddDashboardModal"
import { useMediaQuery } from "../hooks/useMediaQuery"

const { Title, Text } = Typography
const { Dragger } = Upload
const { TabPane } = Tabs

const DashboardsPage = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isImportModalVisible, setIsImportModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [dashboards, setDashboards] = useState([
    {
      key: "1",
      id: "1",
      createdTime: "2025-03-13 17:23:32",
      title: "Environmental Monitoring",
      assignedCustomers: ["customer1", "customer2"],
      public: false,
      customerNames: ["Demo Customer", "Device Claiming Customer"],
    },
    {
      key: "2",
      id: "2",
      createdTime: "2025-01-27 15:01:24",
      title: "Swimming pool scada system",
      assignedCustomers: [],
      public: false,
      customerNames: [],
    },
    {
      key: "3",
      id: "3",
      createdTime: "2025-01-27 15:01:24",
      title: "Charging Port (For Mobile App)",
      assignedCustomers: ["customer1", "customer3"],
      public: false,
      customerNames: ["Demo Customer", "Customer A"],
    },
    {
      key: "4",
      id: "4",
      createdTime: "2025-01-27 15:01:23",
      title: "EV Charging Stations",
      assignedCustomers: ["customer1"],
      public: false,
      customerNames: ["Demo Customer"],
    },
  ])

  const navigate = useNavigate()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isTablet = useMediaQuery("(max-width: 992px)")

  const handleEditDashboard = (dashboardId) => {
    console.log("Navigating to dashboard editor with ID:", dashboardId)
    navigate(`/dashboards/${dashboardId}`)
  }

  const columns = [
    {
      title: "",
      dataIndex: "select",
      width: 50,
      render: () => <Checkbox />,
      responsive: ["md"],
    },
    {
      title: "Created time",
      dataIndex: "createdTime",
      key: "createdTime",
      sorter: (a, b) => a.createdTime.localeCompare(b.createdTime),
      responsive: ["lg"],
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text, record) => <Link to={`/dashboards/${record.id}`}>{text}</Link>,
    },
    {
      title: "Assigned to customers",
      dataIndex: "customerNames",
      key: "customerNames",
      render: (customers) => (
        <Space size={[0, 4]} wrap>
          {customers && customers.length > 0 ? (
            customers.map((customer, index) => (
              <Tag key={index} color="blue">
                {customer}
              </Tag>
            ))
          ) : (
            <Text type="secondary">Not assigned</Text>
          )}
        </Space>
      ),
      responsive: ["md"],
    },
    {
      title: "Public",
      dataIndex: "public",
      key: "public",
      render: (isPublic) => <Checkbox checked={isPublic} disabled />,
      responsive: ["lg"],
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          {!isMobile && (
            <>
              <Button type="text" icon={<DownloadOutlined />} title="Export dashboard" />
              <Button type="text" icon={<ShareAltOutlined />} title="Share dashboard" />
              <Button type="text" icon={<UserOutlined />} title="Make public" />
            </>
          )}
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditDashboard(record.id)}
            title="Edit dashboard"
          />
          <Button type="text" icon={<DeleteOutlined />} onClick={() => showDeleteConfirm(record)} />
        </Space>
      ),
    },
  ]

  const showDeleteConfirm = (dashboard) => {
    Modal.confirm({
      title: "Are you sure you want to delete this dashboard?",
      content: `Dashboard "${dashboard.title}" will be deleted.`,
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        setDashboards(dashboards.filter((d) => d.key !== dashboard.key))
      },
    })
  }

  // const handleAddDashboard = (values) => {
  //   const newDashboard = {
  //     key: String(dashboards.length + 1),
  //     id: String(dashboards.length + 1),
  //     createdTime: new Date().toISOString().replace("T", " ").substring(0, 19),
  //     title: values.title,
  //     assignedCustomers: values.assignedCustomers || [],
  //     customerNames:
  //       values.assignedCustomers?.map((id) => {
  //         const customerMap = {
  //           customer1: "Demo Customer",
  //           customer2: "Device Claiming Customer",
  //           customer3: "Customer A",
  //         }
  //         return customerMap[id] || "Unknown Customer"
  //       }) || [],
  //     public: false,
  //   }

  //   setDashboards([...dashboards, newDashboard])
  //   setIsAddModalVisible(false)

  //   console.log("Created new dashboard with ID:", newDashboard.id)
  //   console.log("Navigating to:", `/dashboards/${newDashboard.id}`)

  //   // Navigate to the new dashboard editor
  //   navigate(`/dashboards/${newDashboard.id}`)
  // }

  const handleAddDashboard = async (values) => {
  const newId = String(dashboards.length + 1) // or use UUID if needed
  const now = new Date().toISOString()
  const payload = {
    id: newId,
    title: values.title,
    widgets: [],
    layouts: {},              // ✅ valid JSON object
    settings: {},             // ✅ valid JSON object
    timewindow: {             // ✅ valid JSON object (not a string)
      displayValue: "Last 1 hour",
      value: {
        history: {
          interval: 60000,
          timewindowMs: 3600000,
          selectedTab: 0,
          realtimeType: 1,
        },
      },
    },
    assignedCustomers: values.assignedCustomers || [],
    version: "v1.0",
    createdTime: now,
  };
  
  console.log(JSON.stringify(payload))
  
  try {
    const response = await fetch("http://localhost:8091/api/dashboards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("Server error response:", err)
      throw new Error("Failed to create dashboard on server")
    }

    const created = await response.json()

    setDashboards([
      ...dashboards,
      {
        ...created,
        key: created.id,
        customerNames: (created.assignedCustomers || []).map((id) => {
          const customerMap = {
            customer1: "Demo Customer",
            customer2: "Device Claiming Customer",
            customer3: "Customer A",
          }
          return customerMap[id] || "Unknown Customer"
        }),
      },
    ])

    setIsAddModalVisible(false)
    navigate(`/dashboards/${created.id}`)
  } catch (error) {
    console.error("Create error:", error)
    message.error("Failed to create dashboard.")
  }
}


  
  const handleImportDashboard = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const dashboard = JSON.parse(e.target.result)
        const newDashboard = {
          key: String(dashboards.length + 1),
          id: String(dashboards.length + 1),
          createdTime: new Date().toISOString().replace("T", " ").substring(0, 19),
          title: dashboard.title || "Imported Dashboard",
          assignedCustomers: dashboard.assignedCustomers || [],
          customerNames:
            dashboard.assignedCustomers?.map((id) => {
              const customerMap = {
                customer1: "Demo Customer",
                customer2: "Device Claiming Customer",
                customer3: "Customer A",
              }
              return customerMap[id] || "Unknown Customer"
            }) || [],
          public: false,
        }

        setDashboards([...dashboards, newDashboard])
        message.success("Dashboard imported successfully")
        setIsImportModalVisible(false)

        // Navigate to the new dashboard editor
        navigate(`/dashboards/${newDashboard.id}`)
      } catch (error) {
        message.error("Failed to import dashboard. Invalid file format.")
      }
    }
    reader.readAsText(file)
  }

  const handleTabChange = (key) => {
    setActiveTab(key)
  }

  // Filter dashboards based on active tab
  const getFilteredDashboards = () => {
    if (activeTab === "all") {
      return dashboards
    } else if (activeTab === "assigned") {
      return dashboards.filter((d) => d.assignedCustomers && d.assignedCustomers.length > 0)
    } else if (activeTab === "unassigned") {
      return dashboards.filter((d) => !d.assignedCustomers || d.assignedCustomers.length === 0)
    }
    return dashboards
  }

  return (
    <>
      <Card
        title={<Title level={4}>Dashboards</Title>}
        extra={
          <Space wrap={isMobile} size={isMobile ? 8 : "middle"}>
            <Button icon={<PlusOutlined />} type="primary" onClick={() => setIsAddModalVisible(true)}>
              {!isMobile && "Create new dashboard"}
            </Button>
            <Button icon={<UploadOutlined />} onClick={() => setIsImportModalVisible(true)}>
              {!isMobile && "Import dashboard"}
            </Button>
            <Button icon={<ReloadOutlined />} />
            {!isMobile && <Button icon={<SearchOutlined />} />}
          </Space>
        }
        tabList={[
          { key: "all", tab: "All Dashboards" },
          { key: "assigned", tab: "Assigned" },
          { key: "unassigned", tab: "Unassigned" },
        ]}
        activeTabKey={activeTab}
        onTabChange={handleTabChange}
      >
        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          columns={columns}
          dataSource={getFilteredDashboards()}
          pagination={{
            total: getFilteredDashboards().length,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
          }}
          scroll={{ x: isTablet ? 800 : undefined }}
          size={isMobile ? "small" : "middle"}
        />
      </Card>

      <AddDashboardModal
        visible={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        onAdd={handleAddDashboard}
      />

      <Modal
        title="Import dashboard"
        open={isImportModalVisible}
        onCancel={() => setIsImportModalVisible(false)}
        footer={null}
      >
        <Dragger
          name="file"
          multiple={false}
          accept=".json"
          showUploadList={false}
          beforeUpload={(file) => {
            handleImportDashboard(file)
            return false
          }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">Click or drag dashboard JSON file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for a single JSON file upload. The file should contain a valid dashboard configuration.
          </p>
        </Dragger>
      </Modal>
    </>
  )
}

export default DashboardsPage
