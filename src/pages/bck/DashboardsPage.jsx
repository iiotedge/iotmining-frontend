"use client"

import { useState, useEffect } from "react"
import {
  Card, Table, Button, Space, Typography, Modal, Checkbox, Upload, message
} from "antd"
import {
  PlusOutlined, ReloadOutlined, SearchOutlined, DownloadOutlined, ShareAltOutlined,
  UserOutlined, EditOutlined, DeleteOutlined, UploadOutlined,
} from "@ant-design/icons"
import { useNavigate, Link } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import AddDashboardModal from "../components/dashboard/AddDashboardModal"
import IotLoader from "../components/common/IotLoader"  // ✅ IoT loader component

const { Title } = Typography
const { Dragger } = Upload

const DashboardsPage = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isImportModalVisible, setIsImportModalVisible] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)
  const [dashboards, setDashboards] = useState([
    {
      key: "1",
      createdTime: "2025-03-13 17:23:32",
      title: "ddfef",
      assignedCustomers: [],
      public: false,
    },
    {
      key: "2",
      createdTime: "2025-01-27 15:01:24",
      title: "Swimming pool scada system",
      assignedCustomers: [],
      public: false,
    },
    {
      key: "3",
      createdTime: "2025-01-27 15:01:24",
      title: "Charging Port (For Mobile App)",
      assignedCustomers: ["Demo Customer", "Device Claiming Customer"],
      public: false,
    },
    {
      key: "4",
      createdTime: "2025-01-27 15:01:23",
      title: "EV Charging Stations",
      assignedCustomers: ["Demo Customer"],
      public: false,
    },
  ])

  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      message.error("Unauthorized access")
      navigate("/auth", { replace: true })
      return
    }

    try {
      const decoded = jwtDecode(token)
      const roles = decoded.role || decoded.roles || []  // <- adjust for your token format
      const allowedRoles = ["ROLE_ADMIN"]
      const hasAccess = Array.isArray(roles)
        ? roles.some((role) => allowedRoles.includes(role))
        : allowedRoles.includes(roles)

      if (!hasAccess) {
        message.error("Access denied")
        navigate("/unauthorized", { replace: true })
      } else {
        setAuthorized(true)
      }
    } catch (err) {
      message.error("Invalid token")
      localStorage.removeItem("token")
      navigate("/auth", { replace: true })
    } finally {
      setChecking(false)
    }
  }, [navigate])

  if (checking) {
    return <IotLoader message="Checking access for dashboard..." />
  }

  if (!authorized) return null

  const handleEditDashboard = (dashboardId) => {
    navigate(`/dashboards/${dashboardId}`)
  }

  const columns = [
    {
      title: "",
      dataIndex: "select",
      width: 50,
      render: () => <input type="checkbox" />,
    },
    {
      title: "Created time",
      dataIndex: "createdTime",
      key: "createdTime",
      sorter: (a, b) => a.createdTime.localeCompare(b.createdTime),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text, record) => <Link to={`/dashboards/${record.key}`}>{text}</Link>,
    },
    {
      title: "Assigned to customers",
      dataIndex: "assignedCustomers",
      key: "assignedCustomers",
      render: (customers) => customers?.join(", "),
    },
    {
      title: "Public",
      dataIndex: "public",
      key: "public",
      render: (isPublic) => <Checkbox checked={isPublic} disabled />,
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<DownloadOutlined />} title="Export dashboard" />
          <Button type="text" icon={<ShareAltOutlined />} title="Share dashboard" />
          <Button type="text" icon={<UserOutlined />} title="Make public" />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditDashboard(record.key)}
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

  const handleAddDashboard = (values) => {
    const newDashboard = {
      key: String(dashboards.length + 1),
      createdTime: new Date().toISOString().replace("T", " ").substring(0, 19),
      title: values.title,
      assignedCustomers: [],
      public: false,
    }

    setDashboards([...dashboards, newDashboard])
    setIsAddModalVisible(false)
    window.location.href = `/dashboards/${newDashboard.key}`
  }

  const handleImportDashboard = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const dashboard = JSON.parse(e.target.result)
        const newDashboard = {
          key: String(dashboards.length + 1),
          createdTime: new Date().toISOString().replace("T", " ").substring(0, 19),
          title: dashboard.title || "Imported Dashboard",
          assignedCustomers: [],
          public: false,
        }

        setDashboards([...dashboards, newDashboard])
        message.success("Dashboard imported successfully")
        setIsImportModalVisible(false)
        window.location.href = `/dashboards/${newDashboard.key}`
      } catch (error) {
        message.error("Failed to import dashboard. Invalid file format.")
      }
    }
    reader.readAsText(file)
  }

  return (
    <>
      <Card
        title={<Title level={4}>Dashboards</Title>}
        extra={
          <Space>
            <Button icon={<PlusOutlined />} type="primary" onClick={() => setIsAddModalVisible(true)}>
              Create new dashboard
            </Button>
            <Button icon={<UploadOutlined />} onClick={() => setIsImportModalVisible(true)}>
              Import dashboard
            </Button>
            <Button icon={<ReloadOutlined />} />
            <Button icon={<SearchOutlined />} />
          </Space>
        }
      >
        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          columns={columns}
          dataSource={dashboards}
          pagination={{
            total: dashboards.length,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
          }}
          onRow={(record) => ({
            onClick: () => handleEditDashboard(record.key),
          })}
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
          <p className="ant-upload-drag-icon"><UploadOutlined /></p>
          <p className="ant-upload-text">Click or drag dashboard JSON file to this area to upload</p>
          <p className="ant-upload-hint">Support for a single JSON file upload. The file should contain a valid dashboard configuration.</p>
        </Dragger>
      </Modal>
    </>
  )
}

export default DashboardsPage
