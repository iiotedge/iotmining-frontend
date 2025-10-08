"use client"

import { useEffect, useState } from "react"
import {
  Card,
  Button,
  Table,
  Space,
  Checkbox,
  Dropdown,
  Typography,
  Tag,
  List,
  Avatar,
  Modal,
  Select,
  Spin,
  message,
  Result,
  theme
} from "antd"
import {
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  SafetyOutlined,
  DeleteOutlined,
  MoreOutlined,
  DashboardOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LockOutlined,
  CustomerServiceOutlined,
  LoginOutlined,
} from "@ant-design/icons"
import AddDeviceModal from "../components/device/AddDeviceModal"
import DeviceDetailsDrawer from "../components/device/DeviceDetailsDrawer"
import DeviceCreationSuccess from "../components/device/DeviceCreationSuccess"
import UnauthorizedPage from "./UnauthorizedPage"
import { useMediaQuery } from "../hooks/useMediaQuery"
import { useNavigate } from "react-router-dom"
import { getDeviceList, getDeviceById, addDevice } from "../api/deviceApi"

const { Option } = Select

const DevicesPage = () => {
  const navigate = useNavigate()
  const [isAddDeviceModalVisible, setIsAddDeviceModalVisible] = useState(false)
  const [isDeviceDrawerVisible, setIsDeviceDrawerVisible] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [newDevice, setNewDevice] = useState(null)
  const [pagination, setPagination] = useState({ page: 0, size: 10, total: 0 })
  const [deviceData, setDeviceData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tenantId, setTenantId] = useState("")

  const [dashboards] = useState([
    { id: "1", title: "Environmental Monitoring" },
    { id: "2", title: "Production Overview" },
    { id: "3", title: "Energy Consumption" },
    { id: "customer1", title: "Customer Dashboard" },
  ])

  const isMobile = useMediaQuery("(max-width: 768px)")
  const isTablet = useMediaQuery("(max-width: 992px)")

  useEffect(() => {
    const tid = localStorage.getItem("tenantId") || ""
    setTenantId(tid)
  }, [])

  // const fetchDevices = async (page = 0, size = 10) => {
  //   if (!tenantId) return
  //   setLoading(true)
  //   setError(null)
  //   try {
  //     const res = await getDeviceList({ tenantId, page, size })
  //     setDeviceData(
  //       res.content.map((d) => ({
  //         ...d,
  //         key: d.deviceId,
  //         id: d.deviceId,
  //         name: d.deviceName,
  //         state: d.state || "Inactive",
  //         public: d.public || d.isPublic,
  //         deviceProfile: d.deviceProfileId || "N/A",
  //         createdAt: d.createdAt,
  //       }))
  //     )
  //     setPagination({ page: res.number, size: res.size, total: res.totalElements })
  //   } catch (e) {
  //     setError(e.message || "Failed to load devices")
  //     message.error(e.message || "Failed to load devices")
  //   } finally {
  //     setLoading(false)
  //   }
  // }
  const fetchDevices = async (page = 0, size = 10) => {
    if (!tenantId) return
    setLoading(true)
    setError(null)
    try {
      // Pass withProfile: true to backend
      const res = await getDeviceList({ tenantId, page, size, withProfile: true })
      setDeviceData(
        (res.content || []).map((entry) => {
          // If backend returns { device, profile } structure
          const device = entry.device || entry
          const profile = entry.profile || {}
          
          console.log(profile)
          return {
            ...device,
            key: device.deviceId,
            id: device.deviceId,
            name: device.deviceName,
            state: device.state || "Inactive",
            public: device.public || device.isPublic,
            deviceProfile: profile.name || device.deviceProfileId || "N/A", // <- Use name if present
            createdAt: device.createdAt,
          }
        })
      )
      setPagination({ page: res.number, size: res.size, total: res.totalElements })
    } catch (e) {
      setError(e.message || "Failed to load devices")
      message.error(e.message || "Failed to load devices")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tenantId) fetchDevices()
    // eslint-disable-next-line
  }, [tenantId])

  const columns = [
    {
      title: "",
      dataIndex: "select",
      key: "select",
      width: 50,
      render: () => <Checkbox />,
      responsive: ["md"],
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => <a onClick={() => handleDeviceClick(record)}>{text}</a>,
    },
    {
      title: "Device profile",
      dataIndex: "deviceProfile",
      key: "deviceProfile",
      responsive: ["md"],
    },
    {
      title: "Created time",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""),
      responsive: ["lg"],
    },
    {
      title: "State",
      dataIndex: "state",
      key: "state",
      render: (state) => (
        <Tag color={state === "Active" ? "green" : "volcano"} style={{ borderRadius: "16px" }}>
          {state}
        </Tag>
      ),
    },
    {
      title: "Public",
      dataIndex: "public",
      key: "public",
      render: (isPublic) => <Checkbox checked={isPublic} disabled />,
      responsive: ["xl"],
    },
    {
      title: "",
      key: "actions",
      width: isMobile ? 80 : 200,
      render: (_, record) => (
        <Space size="small">
          {!isMobile && (
            <>
              <Button
                type="text"
                icon={<DashboardOutlined />}
                title="Add to Dashboard"
              />
              <Button type="text" icon={<ShareAltOutlined />} />
              <Button type="text" icon={<DownloadOutlined />} />
            </>
          )}
          <Button type="text" icon={<SafetyOutlined />} />
          <Button type="text" icon={<DeleteOutlined />} />
          <Dropdown
            menu={{
              items: [
                {
                  key: "add-to-dashboard",
                  icon: <DashboardOutlined />,
                  label: "Add to Dashboard",
                },
                {
                  key: "share",
                  icon: <ShareAltOutlined />,
                  label: "Share Device",
                },
                {
                  key: "download",
                  icon: <DownloadOutlined />,
                  label: "Download Data",
                },
                {
                  key: "delete",
                  icon: <DeleteOutlined />,
                  label: "Delete Device",
                  danger: true,
                },
              ],
            }}
            trigger={["click"]}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ]

  const handleDeviceClick = async (device) => {
    setLoading(true)
    try {
      const data = await getDeviceById(device.id, { withProfile: true })
      setSelectedDevice({
        ...data.device,
        profile: data.profile,
      })
    } catch (e) {
      message.error(e.message || "Failed to load device details")
      setSelectedDevice(device)
    } finally {
      setIsDeviceDrawerVisible(true)
      setLoading(false)
    }
  }

  const showAddDeviceModal = () => setIsAddDeviceModalVisible(true)
  const handleAddDeviceCancel = () => setIsAddDeviceModalVisible(false)
  const handleSuccessModalClose = () => setShowSuccessModal(false)

  // The add handler: controlled in parent, called by AddDeviceModal
  const handleAddDevice = async (savedDevice) => {
    setIsAddDeviceModalVisible(false)
    setNewDevice(savedDevice)
    setShowSuccessModal(true)
    await fetchDevices(pagination.page, pagination.size)
  }

  // if (!tenantId) {
  //   return (
  //     <div style={{ padding: 40 }}>
  //       <Typography.Text type="danger">
  //         You are not authorized to access this application. <br />
  //         Please log in again or contact support if the issue persists.
  //       </Typography.Text>
  //     </div>
  //   );
  // }

  if (!tenantId) {
    return <UnauthorizedPage />
  }
  return (
    <div className="devices-page">
      <Card
        title={<Typography.Title level={4}>Devices</Typography.Title>}
        extra={
          <Space wrap={isMobile} size={isMobile ? 8 : "middle"}>
            {!isMobile && <Button icon={<FilterOutlined />}>Device Filter</Button>}
            <Button icon={<PlusOutlined />} type={isMobile ? "primary" : "default"} onClick={showAddDeviceModal}>
              {!isMobile && "Add"}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => fetchDevices(pagination.page, pagination.size)} />
            {!isMobile && <Button icon={<SearchOutlined />} />}
          </Space>
        }
        bordered={false}
        className="responsive-card"
      >
        {loading ? (
          <Spin />
        ) : isMobile ? (
          // Your mobile renderer (not shown for brevity)
          <div />
        ) : (
          // <Table
          //   columns={columns}
          //   dataSource={deviceData}
          //   loading={loading}
          //   pagination={{
          //     position: ["bottomRight"],
          //     showSizeChanger: true,
          //     pageSizeOptions: ["10", "20", "50", "100"],
          //     total: pagination.total,
          //     current: pagination.page + 1,
          //     pageSize: pagination.size,
          //     showTotal: (total, range) => `${range[0]} - ${range[1]} of ${total}`,
          //   }}
          //   size={isMobile ? "small" : "middle"}
          //   rowSelection={{ type: "checkbox" }}
          //   scroll={{ x: isTablet ? 800 : undefined }}
          // />
          <Table
            columns={columns}
            dataSource={deviceData}
            loading={loading}
            pagination={{
              position: ["bottomRight"],
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              total: pagination.total,
              current: pagination.page + 1,   // Antd Table expects 1-based page numbers
              pageSize: pagination.size,
              showTotal: (total, range) => `${range[0]} - ${range[1]} of ${total}`,
            }}
            size={isMobile ? "small" : "middle"}
            rowSelection={{ type: "checkbox" }}
            scroll={{ x: isTablet ? 800 : undefined }}
            onChange={(pagination) => {
              // Antd pagination.current is 1-based, our fetchDevices expects 0-based
              fetchDevices((pagination.current || 1) - 1, pagination.pageSize)
            }}
          />

        )}
      </Card>

      {/* Add Device Modal */}
      <AddDeviceModal
        visible={isAddDeviceModalVisible}
        onCancel={handleAddDeviceCancel}
        onAdd={handleAddDevice}
        isMobile={isMobile}
      />

      {/* Device Success Modal, only controlled by parent */}
      <DeviceCreationSuccess
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        device={newDevice}
      />

      <DeviceDetailsDrawer
        visible={isDeviceDrawerVisible}
        onClose={() => setIsDeviceDrawerVisible(false)}
        device={selectedDevice}
        isMobile={isMobile}
        width={isMobile ? "100%" : 520}
      />
    </div>
  )
}

export default DevicesPage

// "use client"

// import { useEffect, useState } from "react"
// import {
//   Card,
//   Button,
//   Table,
//   Space,
//   Form,
//   Checkbox,
//   Dropdown,
//   Typography,
//   Tag,
//   List,
//   Avatar,
//   Modal,
//   Select,
//   Spin,
//   message,
// } from "antd"
// import {
//   ReloadOutlined,
//   PlusOutlined,
//   SearchOutlined,
//   FilterOutlined,
//   ShareAltOutlined,
//   DownloadOutlined,
//   SafetyOutlined,
//   DeleteOutlined,
//   MoreOutlined,
//   DashboardOutlined,
//   LineChartOutlined,
//   BarChartOutlined,
//   PieChartOutlined,
// } from "@ant-design/icons"
// import AddDeviceModal from "../components/device/AddDeviceModal"
// import DeviceDetailsDrawer from "../components/device/DeviceDetailsDrawer"
// import DeviceCreationSuccess from "../components/device/DeviceCreationSuccess"
// import { useMediaQuery } from "../hooks/useMediaQuery"
// import { useNavigate } from "react-router-dom"
// import { getDeviceList, getDeviceById, addDevice } from "../api/deviceApi"

// const { Option } = Select

// const DevicesPage = () => {
//   const navigate = useNavigate()
//   const [isAddDeviceModalVisible, setIsAddDeviceModalVisible] = useState(false)
//   const [isDeviceDrawerVisible, setIsDeviceDrawerVisible] = useState(false)
//   const [selectedDevice, setSelectedDevice] = useState(null)
//   const [showSuccessModal, setShowSuccessModal] = useState(false)
//   const [newDevice, setNewDevice] = useState(null)
//   const [isAddToDashboardModalVisible, setIsAddToDashboardModalVisible] = useState(false)
//   const [selectedDashboard, setSelectedDashboard] = useState(null)
//   const [selectedWidgetType, setSelectedWidgetType] = useState(null)
//   const [pagination, setPagination] = useState({ page: 0, size: 10, total: 0 })
//   const [deviceData, setDeviceData] = useState([])
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState(null)
//   const [tenantId, setTenantId] = useState("")

//   const [dashboards] = useState([
//     { id: "1", title: "Environmental Monitoring" },
//     { id: "2", title: "Production Overview" },
//     { id: "3", title: "Energy Consumption" },
//     { id: "customer1", title: "Customer Dashboard" },
//   ])

//   const [form] = Form.useForm()
//   const isMobile = useMediaQuery("(max-width: 768px)")
//   const isTablet = useMediaQuery("(max-width: 992px)")

//   // USE ONLY THE tenantId FROM LOCALSTORAGE, NOTHING ELSE
//   useEffect(() => {
//     const tid = localStorage.getItem("tenantId") || ""
//     setTenantId(tid)
//   }, [])

//   const fetchDevices = async (page = 0, size = 10) => {
//     if (!tenantId) return
//     setLoading(true)
//     setError(null)
//     try {
//       console.log("TenantId: ",tenantId);
//       const res = await getDeviceList({ tenantId, page, size })
//       setDeviceData(res.content.map((d) => ({
//         ...d,
//         key: d.deviceId,
//         id: d.deviceId,
//         name: d.deviceName,
//         state: d.state || "Inactive",
//         public: d.public || d.isPublic,
//         deviceProfile: d.deviceProfileId || "N/A",
//         createdAt: d.createdAt,
//       })))
//       setPagination({ page: res.number, size: res.size, total: res.totalElements })
//     } catch (e) {
//       setError(e.message || "Failed to load devices")
//       message.error(e.message || "Failed to load devices")
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     if (tenantId) fetchDevices()
//     // eslint-disable-next-line
//   }, [tenantId])

//   // Table columns
//   const columns = [
//     {
//       title: "",
//       dataIndex: "select",
//       key: "select",
//       width: 50,
//       render: () => <Checkbox />,
//       responsive: ["md"],
//     },
//     {
//       title: "Created time",
//       dataIndex: "createdAt",
//       key: "createdAt",
//       sorter: (a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""),
//       responsive: ["lg"],
//     },
//     {
//       title: "Name",
//       dataIndex: "name",
//       key: "name",
//       render: (text, record) => <a onClick={() => handleDeviceClick(record)}>{text}</a>,
//     },
//     {
//       title: "Device profile",
//       dataIndex: "deviceProfile",
//       key: "deviceProfile",
//       responsive: ["md"],
//     },
//     {
//       title: "State",
//       dataIndex: "state",
//       key: "state",
//       render: (state) => (
//         <Tag color={state === "Active" ? "green" : "volcano"} style={{ borderRadius: "16px" }}>
//           {state}
//         </Tag>
//       ),
//     },
//     {
//       title: "Public",
//       dataIndex: "public",
//       key: "public",
//       render: (isPublic) => <Checkbox checked={isPublic} disabled />,
//       responsive: ["xl"],
//     },
//     {
//       title: "",
//       key: "actions",
//       width: isMobile ? 80 : 200,
//       render: (_, record) => (
//         <Space size="small">
//           {!isMobile && (
//             <>
//               <Button
//                 type="text"
//                 icon={<DashboardOutlined />}
//                 onClick={(e) => {
//                   e.stopPropagation()
//                   handleAddToDashboard(record)
//                 }}
//                 title="Add to Dashboard"
//               />
//               <Button type="text" icon={<ShareAltOutlined />} />
//               <Button type="text" icon={<DownloadOutlined />} />
//             </>
//           )}
//           <Button type="text" icon={<SafetyOutlined />} />
//           <Button type="text" icon={<DeleteOutlined />} />
//           <Dropdown
//             menu={{
//               items: [
//                 {
//                   key: "add-to-dashboard",
//                   icon: <DashboardOutlined />,
//                   label: "Add to Dashboard",
//                   onClick: () => handleAddToDashboard(record),
//                 },
//                 {
//                   key: "share",
//                   icon: <ShareAltOutlined />,
//                   label: "Share Device",
//                 },
//                 {
//                   key: "download",
//                   icon: <DownloadOutlined />,
//                   label: "Download Data",
//                 },
//                 {
//                   key: "delete",
//                   icon: <DeleteOutlined />,
//                   label: "Delete Device",
//                   danger: true,
//                 },
//               ],
//             }}
//             trigger={["click"]}
//           >
//             <Button type="text" icon={<MoreOutlined />} />
//           </Dropdown>
//         </Space>
//       ),
//     },
//   ]

//   // Mobile card view renderer
//   const renderMobileList = () => (
//     <List
//       dataSource={deviceData}
//       renderItem={(item) => (
//         <List.Item
//           key={item.key}
//           actions={[
//             <Button
//               key="dashboard"
//               type="text"
//               icon={<DashboardOutlined />}
//               onClick={(e) => {
//                 e.stopPropagation()
//                 handleAddToDashboard(item)
//               }}
//             />,
//             <Button
//               key="more"
//               type="text"
//               icon={<MoreOutlined />}
//               onClick={(e) => {
//                 e.stopPropagation()
//                 // Show dropdown menu
//               }}
//             />,
//           ]}
//           onClick={() => handleDeviceClick(item)}
//         >
//           <List.Item.Meta
//             avatar={
//               <Avatar
//                 style={{
//                   backgroundColor: item.isGateway ? "#1890ff" : "#f56a00",
//                   verticalAlign: "middle",
//                 }}
//               >
//                 {item.name.charAt(0)}
//               </Avatar>
//             }
//             title={item.name}
//             description={
//               <Space direction="vertical" size={1}>
//                 <div>{item.deviceProfile}</div>
//                 <Tag color={item.state === "Active" ? "green" : "volcano"} style={{ borderRadius: "16px" }}>
//                   {item.state}
//                 </Tag>
//               </Space>
//             }
//           />
//         </List.Item>
//       )}
//       pagination={{
//         position: "bottom",
//         pageSize: pagination.size,
//         showSizeChanger: true,
//         pageSizeOptions: ["10", "20", "50", "100"],
//         total: pagination.total,
//         showTotal: (total, range) => `${range[0]} - ${range[1]} of ${total}`,
//       }}
//     />
//   )

//   // Handle row/page change
//   const handleTableChange = (paginationObj) => {
//     fetchDevices(paginationObj.current - 1, paginationObj.pageSize)
//   }

//   // Device details
//   // const handleDeviceClick = async (device) => {
//   //   setLoading(true)
//   //   try {
//   //     // Use correct id field!
//   //     const data = await getDeviceById(device.id, { withProfile: true })
//   //     setSelectedDevice(data.device || device) // for DeviceDetailsDrawer
//   //   } catch (e) {
//   //     message.error(e.message || "Failed to load device details")
//   //     setSelectedDevice(device)
//   //   } finally {
//   //     setIsDeviceDrawerVisible(true)
//   //     setLoading(false)
//   //   }
//   // }
//   const handleDeviceClick = async (device) => {
//     setLoading(true)
//     try {
//       const data = await getDeviceById(device.id, { withProfile: true })
//       setSelectedDevice({
//         ...data.device,
//         profile: data.profile, // Add profile as property!
//       })
//     } catch (e) {
//       message.error(e.message || "Failed to load device details")
//       setSelectedDevice(device)
//     } finally {
//       setIsDeviceDrawerVisible(true)
//       setLoading(false)
//     }
//   }

//   // Add device modal
//   const showAddDeviceModal = () => setIsAddDeviceModalVisible(true)
//   const handleAddDeviceCancel = () => setIsAddDeviceModalVisible(false)

//   // Add device handler (call backend and refresh list)
//   const handleAddDevice = async (values) => {
//     try {
//       await addDevice(values)
//       setIsAddDeviceModalVisible(false)
//       setShowSuccessModal(true)
//       fetchDevices(pagination.page, pagination.size)
//     } catch (e) {
//       message.error(e.message || "Failed to add device")
//     }
//   }

//   const handleDeviceDrawerClose = () => setIsDeviceDrawerVisible(false)
//   const handleSuccessModalClose = () => setShowSuccessModal(false)

//   const handleAddToDashboard = (device) => {
//     setSelectedDevice(device)
//     setIsAddToDashboardModalVisible(true)
//   }

//   const handleAddToDashboardSubmit = () => {
//     setIsAddToDashboardModalVisible(false)
//     navigate(`/customer-dashboard/${selectedDashboard}?device=${selectedDevice.id}&widgetType=${selectedWidgetType}`)
//   }

//   const addDeviceMenu = {
//     items: [
//       {
//         key: "1",
//         label: "Add new device",
//         icon: <PlusOutlined />,
//         onClick: showAddDeviceModal,
//       },
//       {
//         key: "2",
//         label: "Import device",
//         icon: <DownloadOutlined />,
//       },
//     ],
//   }

//   if (!tenantId) {
//     return (
//       <div style={{ padding: 40 }}>
//         <Typography.Text type="danger">
//           Tenant ID missing. Please log in again.
//         </Typography.Text>
//       </div>
//     )
//   }

//   return (
//     <div className="devices-page">
//       <Card
//         title={<Typography.Title level={4}>Devices</Typography.Title>}
//         extra={
//           <Space wrap={isMobile} size={isMobile ? 8 : "middle"}>
//             {!isMobile && <Button icon={<FilterOutlined />}>Device Filter</Button>}
//             <Dropdown menu={addDeviceMenu} trigger={["click"]}>
//               <Button icon={<PlusOutlined />} type={isMobile ? "primary" : "default"}>
//                 {!isMobile && "Add"}
//               </Button>
//             </Dropdown>
//             <Button icon={<ReloadOutlined />} onClick={() => fetchDevices(pagination.page, pagination.size)} />
//             {!isMobile && <Button icon={<SearchOutlined />} />}
//           </Space>
//         }
//         bordered={false}
//         className="responsive-card"
//       >
//         {loading ? (
//           <Spin />
//         ) : isMobile ? (
//           renderMobileList()
//         ) : (
//           <Table
//             columns={columns}
//             dataSource={deviceData}
//             loading={loading}
//             pagination={{
//               position: ["bottomRight"],
//               showSizeChanger: true,
//               pageSizeOptions: ["10", "20", "50", "100"],
//               total: pagination.total,
//               current: pagination.page + 1,
//               pageSize: pagination.size,
//               showTotal: (total, range) => `${range[0]} - ${range[1]} of ${total}`,
//             }}
//             size={isMobile ? "small" : "middle"}
//             onChange={handleTableChange}
//             rowSelection={{ type: "checkbox" }}
//             scroll={{ x: isTablet ? 800 : undefined }}
//           />
//         )}
//       </Card>

//       {/* <AddDeviceModal
//         visible={isAddDeviceModalVisible}
//         onCancel={handleAddDeviceCancel}
//         onAdd={handleAddDevice}
//         isMobile={isMobile}
//       /> */}
//       <AddDeviceModal
//         visible={isAddDeviceModalVisible}
//         onCancel={handleAddDeviceCancel}
//         onAdd={() => {
//           setIsAddDeviceModalVisible(false)
//           fetchDevices(pagination.page, pagination.size)
//         }}
//         isMobile={isMobile}
//       />

//       <DeviceDetailsDrawer
//         visible={isDeviceDrawerVisible}
//         onClose={handleDeviceDrawerClose}
//         device={selectedDevice}
//         isMobile={isMobile}
//         width={isMobile ? "100%" : 520}
//       />

//       {/* <DeviceCreationSuccess visible={showSuccessModal} onClose={handleSuccessModalClose} device={newDevice} /> */}

//       {/* Add to Dashboard Modal */}
//       <Modal
//         title="Add Device to Dashboard"
//         open={isAddToDashboardModalVisible}
//         onCancel={() => setIsAddToDashboardModalVisible(false)}
//         onOk={handleAddToDashboardSubmit}
//         okText="Add to Dashboard"
//       >
//         <Form layout="vertical">
//           <Form.Item label="Select Dashboard" required style={{ marginBottom: 16 }}>
//             <Select
//               placeholder="Select a dashboard"
//               style={{ width: "100%" }}
//               value={selectedDashboard}
//               onChange={setSelectedDashboard}
//             >
//               {dashboards.map((dashboard) => (
//                 <Option key={dashboard.id} value={dashboard.id}>
//                   {dashboard.title}
//                 </Option>
//               ))}
//             </Select>
//           </Form.Item>
//           <Form.Item label="Widget Type" required style={{ marginBottom: 16 }}>
//             <Select
//               placeholder="Select widget type"
//               style={{ width: "100%" }}
//               value={selectedWidgetType}
//               onChange={setSelectedWidgetType}
//             >
//               <Option value="line-chart">
//                 <Space>
//                   <LineChartOutlined /> Line Chart
//                 </Space>
//               </Option>
//               <Option value="bar-chart">
//                 <Space>
//                   <BarChartOutlined /> Bar Chart
//                 </Space>
//               </Option>
//               <Option value="pie-chart">
//                 <Space>
//                   <PieChartOutlined /> Pie Chart
//                 </Space>
//               </Option>
//               <Option value="gauge">
//                 <Space>
//                   <DashboardOutlined /> Gauge
//                 </Space>
//               </Option>
//               <Option value="value-card">Value Card</Option>
//               <Option value="status-card">Status Card</Option>
//               <Option value="battery-level">Battery Level</Option>
//               <Option value="signal-strength">Signal Strength</Option>
//             </Select>
//           </Form.Item>
//           <Typography.Text type="secondary">
//             This will add {selectedDevice?.name || "the selected device"} to the dashboard with the selected widget
//             type.
//           </Typography.Text>
//         </Form>
//       </Modal>
//     </div>
//   )
// }

// export default DevicesPage


// // "use client"

// // import { useEffect, useState } from "react"
// // import {
// //   Card,
// //   Button,
// //   Table,
// //   Space,
// //   Form,
// //   Checkbox,
// //   Dropdown,
// //   Typography,
// //   Tag,
// //   List,
// //   Avatar,
// //   Modal,
// //   Select,
// //   Spin,
// //   message,
// // } from "antd"
// // import {
// //   ReloadOutlined,
// //   PlusOutlined,
// //   SearchOutlined,
// //   FilterOutlined,
// //   ShareAltOutlined,
// //   DownloadOutlined,
// //   SafetyOutlined,
// //   DeleteOutlined,
// //   MoreOutlined,
// //   DashboardOutlined,
// //   LineChartOutlined,
// //   BarChartOutlined,
// //   PieChartOutlined,
// // } from "@ant-design/icons"
// // import AddDeviceModal from "../components/device/AddDeviceModal"
// // import DeviceDetailsDrawer from "../components/device/DeviceDetailsDrawer"
// // import DeviceCreationSuccess from "../components/device/DeviceCreationSuccess"
// // import { useMediaQuery } from "../hooks/useMediaQuery"
// // import { useNavigate } from "react-router-dom"
// // import { getDeviceList, getDeviceById, addDevice } from "../api/deviceApi"

// // const { Option } = Select

// // const DevicesPage = () => {
// //   const navigate = useNavigate()
// //   const [isAddDeviceModalVisible, setIsAddDeviceModalVisible] = useState(false)
// //   const [isDeviceDrawerVisible, setIsDeviceDrawerVisible] = useState(false)
// //   const [selectedDevice, setSelectedDevice] = useState(null)
// //   const [showSuccessModal, setShowSuccessModal] = useState(false)
// //   const [newDevice, setNewDevice] = useState(null)
// //   const [isAddToDashboardModalVisible, setIsAddToDashboardModalVisible] = useState(false)
// //   const [selectedDashboard, setSelectedDashboard] = useState(null)
// //   const [selectedWidgetType, setSelectedWidgetType] = useState(null)

// //   // Pagination
// //   const [pagination, setPagination] = useState({ page: 0, size: 10, total: 0 })

// //   // Data
// //   const [deviceData, setDeviceData] = useState([])
// //   const [loading, setLoading] = useState(false)
// //   const [error, setError] = useState(null)

// //   // Replace with your actual tenantId
// //   const tenantId = "e63e1c4a-5b4c-42e9-91f2-1d682b0a5d02"

// //   // Dashboards mock (can be fetched as well)
// //   const [dashboards] = useState([
// //     { id: "1", title: "Environmental Monitoring" },
// //     { id: "2", title: "Production Overview" },
// //     { id: "3", title: "Energy Consumption" },
// //     { id: "customer1", title: "Customer Dashboard" },
// //   ])

// //   const [form] = Form.useForm()
// //   const isMobile = useMediaQuery("(max-width: 768px)")
// //   const isTablet = useMediaQuery("(max-width: 992px)")

// //   // Fetch devices
// //   const fetchDevices = async (page = 0, size = 10) => {
// //     setLoading(true)
// //     setError(null)
// //     try {
// //       const res = await getDeviceList({ tenantId, page, size })
// //       setDeviceData(res.content.map((d) => ({
// //         ...d,
// //         key: d.id, // AntD needs "key"
// //         name: d.deviceName, // adjust if your model is different
// //         state: d.state || "Inactive",
// //         public: d.isPublic,
// //         deviceProfile: d.deviceProfileId || "N/A",
// //       })))
// //       setPagination({ page: res.number, size: res.size, total: res.totalElements })
// //     } catch (e) {
// //       setError(e.message || "Failed to load devices")
// //       message.error(e.message || "Failed to load devices")
// //     } finally {
// //       setLoading(false)
// //     }
// //   }

// //   // Initial fetch
// //   useEffect(() => {
// //     fetchDevices()
// //   }, [])

// //   // Table columns (unchanged, but "deviceProfile" and "name" are now mapped from backend)
// //   const columns = [
// //     {
// //       title: "",
// //       dataIndex: "select",
// //       key: "select",
// //       width: 50,
// //       render: () => <Checkbox />,
// //       responsive: ["md"],
// //     },
// //     {
// //       title: "Created time",
// //       dataIndex: "createdAt",
// //       key: "createdAt",
// //       sorter: (a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""),
// //       responsive: ["lg"],
// //     },
// //     {
// //       title: "Name",
// //       dataIndex: "name",
// //       key: "name",
// //       render: (text, record) => <a onClick={() => handleDeviceClick(record)}>{text}</a>,
// //     },
// //     {
// //       title: "Device profile",
// //       dataIndex: "deviceProfile",
// //       key: "deviceProfile",
// //       responsive: ["md"],
// //     },
// //     {
// //       title: "State",
// //       dataIndex: "state",
// //       key: "state",
// //       render: (state) => (
// //         <Tag color={state === "Active" ? "green" : "volcano"} style={{ borderRadius: "16px" }}>
// //           {state}
// //         </Tag>
// //       ),
// //     },
// //     {
// //       title: "Public",
// //       dataIndex: "public",
// //       key: "public",
// //       render: (isPublic) => <Checkbox checked={isPublic} disabled />,
// //       responsive: ["xl"],
// //     },
// //     // ...rest unchanged
// //     {
// //       title: "",
// //       key: "actions",
// //       width: isMobile ? 80 : 200,
// //       render: (_, record) => (
// //         <Space size="small">
// //           {!isMobile && (
// //             <>
// //               <Button
// //                 type="text"
// //                 icon={<DashboardOutlined />}
// //                 onClick={(e) => {
// //                   e.stopPropagation()
// //                   handleAddToDashboard(record)
// //                 }}
// //                 title="Add to Dashboard"
// //               />
// //               <Button type="text" icon={<ShareAltOutlined />} />
// //               <Button type="text" icon={<DownloadOutlined />} />
// //             </>
// //           )}
// //           <Button type="text" icon={<SafetyOutlined />} />
// //           <Button type="text" icon={<DeleteOutlined />} />
// //           <Dropdown
// //             menu={{
// //               items: [
// //                 {
// //                   key: "add-to-dashboard",
// //                   icon: <DashboardOutlined />,
// //                   label: "Add to Dashboard",
// //                   onClick: () => handleAddToDashboard(record),
// //                 },
// //                 {
// //                   key: "share",
// //                   icon: <ShareAltOutlined />,
// //                   label: "Share Device",
// //                 },
// //                 {
// //                   key: "download",
// //                   icon: <DownloadOutlined />,
// //                   label: "Download Data",
// //                 },
// //                 {
// //                   key: "delete",
// //                   icon: <DeleteOutlined />,
// //                   label: "Delete Device",
// //                   danger: true,
// //                 },
// //               ],
// //             }}
// //             trigger={["click"]}
// //           >
// //             <Button type="text" icon={<MoreOutlined />} />
// //           </Dropdown>
// //         </Space>
// //       ),
// //     },
// //   ]

// //   // Mobile card view renderer (unchanged except using backend data)
// //   const renderMobileList = () => (
// //     <List
// //       dataSource={deviceData}
// //       renderItem={(item) => (
// //         <List.Item
// //           key={item.key}
// //           actions={[
// //             <Button
// //               key="dashboard"
// //               type="text"
// //               icon={<DashboardOutlined />}
// //               onClick={(e) => {
// //                 e.stopPropagation()
// //                 handleAddToDashboard(item)
// //               }}
// //             />,
// //             <Button
// //               key="more"
// //               type="text"
// //               icon={<MoreOutlined />}
// //               onClick={(e) => {
// //                 e.stopPropagation()
// //                 // Show dropdown menu
// //               }}
// //             />,
// //           ]}
// //           onClick={() => handleDeviceClick(item)}
// //         >
// //           <List.Item.Meta
// //             avatar={
// //               <Avatar
// //                 style={{
// //                   backgroundColor: item.isGateway ? "#1890ff" : "#f56a00",
// //                   verticalAlign: "middle",
// //                 }}
// //               >
// //                 {item.name.charAt(0)}
// //               </Avatar>
// //             }
// //             title={item.name}
// //             description={
// //               <Space direction="vertical" size={1}>
// //                 <div>{item.deviceProfile}</div>
// //                 <Tag color={item.state === "Active" ? "green" : "volcano"} style={{ borderRadius: "16px" }}>
// //                   {item.state}
// //                 </Tag>
// //               </Space>
// //             }
// //           />
// //         </List.Item>
// //       )}
// //       pagination={{
// //         position: "bottom",
// //         pageSize: pagination.size,
// //         showSizeChanger: true,
// //         pageSizeOptions: ["10", "20", "50", "100"],
// //         total: pagination.total,
// //         showTotal: (total, range) => `${range[0]} - ${range[1]} of ${total}`,
// //       }}
// //     />
// //   )

// //   // Handle row/page change
// //   const handleTableChange = (paginationObj) => {
// //     fetchDevices(paginationObj.current - 1, paginationObj.pageSize)
// //   }

// //   // Device details
// //   const handleDeviceClick = async (device) => {
// //     setLoading(true)
// //     try {
// //       // Optionally: fetch full details with profile
// //       const data = await getDeviceById(device.id, { withProfile: true })
// //       setSelectedDevice(data.device || device) // for DeviceDetailsDrawer
// //     } catch (e) {
// //       message.error(e.message || "Failed to load device details")
// //     } finally {
// //       setIsDeviceDrawerVisible(true)
// //       setLoading(false)
// //     }
// //   }

// //   // Add device modal
// //   const showAddDeviceModal = () => setIsAddDeviceModalVisible(true)
// //   const handleAddDeviceCancel = () => setIsAddDeviceModalVisible(false)

// //   // Add device handler (call backend and refresh list)
// //   const handleAddDevice = async (values) => {
// //     try {
// //       await addDevice(values)
// //       setIsAddDeviceModalVisible(false)
// //       setShowSuccessModal(true)
// //       fetchDevices(pagination.page, pagination.size)
// //     } catch (e) {
// //       message.error(e.message || "Failed to add device")
// //     }
// //   }

// //   const handleDeviceDrawerClose = () => setIsDeviceDrawerVisible(false)
// //   const handleSuccessModalClose = () => setShowSuccessModal(false)

// //   const handleAddToDashboard = (device) => {
// //     setSelectedDevice(device)
// //     setIsAddToDashboardModalVisible(true)
// //   }

// //   const handleAddToDashboardSubmit = () => {
// //     setIsAddToDashboardModalVisible(false)
// //     navigate(`/customer-dashboard/${selectedDashboard}?device=${selectedDevice.id}&widgetType=${selectedWidgetType}`)
// //   }

// //   const addDeviceMenu = {
// //     items: [
// //       {
// //         key: "1",
// //         label: "Add new device",
// //         icon: <PlusOutlined />,
// //         onClick: showAddDeviceModal,
// //       },
// //       {
// //         key: "2",
// //         label: "Import device",
// //         icon: <DownloadOutlined />,
// //       },
// //     ],
// //   }

// //   return (
// //     <div className="devices-page">
// //       <Card
// //         title={<Typography.Title level={4}>Devices</Typography.Title>}
// //         extra={
// //           <Space wrap={isMobile} size={isMobile ? 8 : "middle"}>
// //             {!isMobile && <Button icon={<FilterOutlined />}>Device Filter</Button>}
// //             <Dropdown menu={addDeviceMenu} trigger={["click"]}>
// //               <Button icon={<PlusOutlined />} type={isMobile ? "primary" : "default"}>
// //                 {!isMobile && "Add"}
// //               </Button>
// //             </Dropdown>
// //             <Button icon={<ReloadOutlined />} onClick={() => fetchDevices(pagination.page, pagination.size)} />
// //             {!isMobile && <Button icon={<SearchOutlined />} />}
// //           </Space>
// //         }
// //         bordered={false}
// //         className="responsive-card"
// //       >
// //         {loading ? (
// //           <Spin />
// //         ) : isMobile ? (
// //           renderMobileList()
// //         ) : (
// //           <Table
// //             columns={columns}
// //             dataSource={deviceData}
// //             loading={loading}
// //             pagination={{
// //               position: ["bottomRight"],
// //               showSizeChanger: true,
// //               pageSizeOptions: ["10", "20", "50", "100"],
// //               total: pagination.total,
// //               current: pagination.page + 1,
// //               pageSize: pagination.size,
// //               showTotal: (total, range) => `${range[0]} - ${range[1]} of ${total}`,
// //             }}
// //             size={isMobile ? "small" : "middle"}
// //             onChange={handleTableChange}
// //             rowSelection={{ type: "checkbox" }}
// //             scroll={{ x: isTablet ? 800 : undefined }}
// //           />
// //         )}
// //       </Card>

// //       <AddDeviceModal
// //         visible={isAddDeviceModalVisible}
// //         onCancel={handleAddDeviceCancel}
// //         onAdd={handleAddDevice}
// //         isMobile={isMobile}
// //       />

// //       <DeviceDetailsDrawer
// //         visible={isDeviceDrawerVisible}
// //         onClose={handleDeviceDrawerClose}
// //         device={selectedDevice}
// //         isMobile={isMobile}
// //         width={isMobile ? "100%" : 520}
// //       />

// //       <DeviceCreationSuccess visible={showSuccessModal} onClose={handleSuccessModalClose} device={newDevice} />

// //       {/* Add to Dashboard Modal */}
// //       <Modal
// //         title="Add Device to Dashboard"
// //         open={isAddToDashboardModalVisible}
// //         onCancel={() => setIsAddToDashboardModalVisible(false)}
// //         onOk={handleAddToDashboardSubmit}
// //         okText="Add to Dashboard"
// //       >
// //         <Form layout="vertical">
// //           <Form.Item label="Select Dashboard" required style={{ marginBottom: 16 }}>
// //             <Select
// //               placeholder="Select a dashboard"
// //               style={{ width: "100%" }}
// //               value={selectedDashboard}
// //               onChange={setSelectedDashboard}
// //             >
// //               {dashboards.map((dashboard) => (
// //                 <Option key={dashboard.id} value={dashboard.id}>
// //                   {dashboard.title}
// //                 </Option>
// //               ))}
// //             </Select>
// //           </Form.Item>
// //           <Form.Item label="Widget Type" required style={{ marginBottom: 16 }}>
// //             <Select
// //               placeholder="Select widget type"
// //               style={{ width: "100%" }}
// //               value={selectedWidgetType}
// //               onChange={setSelectedWidgetType}
// //             >
// //               <Option value="line-chart">
// //                 <Space>
// //                   <LineChartOutlined /> Line Chart
// //                 </Space>
// //               </Option>
// //               <Option value="bar-chart">
// //                 <Space>
// //                   <BarChartOutlined /> Bar Chart
// //                 </Space>
// //               </Option>
// //               <Option value="pie-chart">
// //                 <Space>
// //                   <PieChartOutlined /> Pie Chart
// //                 </Space>
// //               </Option>
// //               <Option value="gauge">
// //                 <Space>
// //                   <DashboardOutlined /> Gauge
// //                 </Space>
// //               </Option>
// //               <Option value="value-card">Value Card</Option>
// //               <Option value="status-card">Status Card</Option>
// //               <Option value="battery-level">Battery Level</Option>
// //               <Option value="signal-strength">Signal Strength</Option>
// //             </Select>
// //           </Form.Item>
// //           <Typography.Text type="secondary">
// //             This will add {selectedDevice?.name || "the selected device"} to the dashboard with the selected widget
// //             type.
// //           </Typography.Text>
// //         </Form>
// //       </Modal>
// //     </div>
// //   )
// // }

// // export default DevicesPage

// // // "use client"

// // // import { useState } from "react"
// // // import {
// // //   Card,
// // //   Button,
// // //   Table,
// // //   Space,
// // //   Form,
// // //   Checkbox,
// // //   Dropdown,
// // //   Menu,
// // //   Typography,
// // //   Tag,
// // //   List,
// // //   Avatar,
// // //   Modal,
// // //   Select,
// // // } from "antd"
// // // import {
// // //   ReloadOutlined,
// // //   PlusOutlined,
// // //   SearchOutlined,
// // //   FilterOutlined,
// // //   ShareAltOutlined,
// // //   DownloadOutlined,
// // //   SafetyOutlined,
// // //   DeleteOutlined,
// // //   MoreOutlined,
// // //   DashboardOutlined,
// // //   LineChartOutlined,
// // //   BarChartOutlined,
// // //   PieChartOutlined,

// // // } from "@ant-design/icons"
// // // import AddDeviceModal from "../components/device/AddDeviceModal"
// // // import DeviceDetailsDrawer from "../components/device/DeviceDetailsDrawer"
// // // import DeviceCreationSuccess from "../components/device/DeviceCreationSuccess"
// // // import { useMediaQuery } from "../hooks/useMediaQuery"
// // // import { useNavigate } from "react-router-dom"

// // // const { Option } = Select

// // // const DevicesPage = () => {
// // //   const navigate = useNavigate()
// // //   const [isAddDeviceModalVisible, setIsAddDeviceModalVisible] = useState(false)
// // //   const [isDeviceDrawerVisible, setIsDeviceDrawerVisible] = useState(false)
// // //   const [selectedDevice, setSelectedDevice] = useState(null)
// // //   const [showSuccessModal, setShowSuccessModal] = useState(false)
// // //   const [newDevice, setNewDevice] = useState(null)
// // //   const [isAddToDashboardModalVisible, setIsAddToDashboardModalVisible] = useState(false)
// // //   const [selectedDashboard, setSelectedDashboard] = useState(null)
// // //   const [selectedWidgetType, setSelectedWidgetType] = useState(null)
// // //   const [deviceData, setDeviceData] = useState([
// // //     {
// // //       key: "1",
// // //       id: "device1",
// // //       createdTime: "2025-03-04 12:28:37",
// // //       name: "Air Filter",
// // //       deviceProfile: "default",
// // //       label: "filter",
// // //       state: "Inactive",
// // //       customer: "",
// // //       public: false,
// // //       isGateway: false,
// // //     },
// // //     {
// // //       key: "2",
// // //       id: "device2",
// // //       createdTime: "2025-03-01 18:40:50",
// // //       name: "IOTM",
// // //       deviceProfile: "IoTM",
// // //       label: "",
// // //       state: "Active",
// // //       customer: "",
// // //       public: false,
// // //       isGateway: true,
// // //     },
// // //     {
// // //       key: "3",
// // //       id: "device3",
// // //       createdTime: "2025-03-01 18:18:43",
// // //       name: "Vehicle",
// // //       deviceProfile: "IoTM",
// // //       label: "",
// // //       state: "Inactive",
// // //       customer: "",
// // //       public: false,
// // //       isGateway: false,
// // //     },
// // //     {
// // //       key: "4",
// // //       id: "device4",
// // //       createdTime: "2025-01-27 15:01:30",
// // //       name: "Drain valve",
// // //       deviceProfile: "Valve",
// // //       label: "",
// // //       state: "Active",
// // //       customer: "",
// // //       public: false,
// // //       isGateway: false,
// // //     },
// // //     {
// // //       key: "5",
// // //       id: "device5",
// // //       createdTime: "2025-01-27 15:01:30",
// // //       name: "Water pump outgoing valve",
// // //       deviceProfile: "Valve",
// // //       label: "",
// // //       state: "Inactive",
// // //       customer: "",
// // //       public: false,
// // //       isGateway: false,
// // //     },
// // //     {
// // //       key: "6",
// // //       id: "device6",
// // //       createdTime: "2025-01-27 15:01:30",
// // //       name: "Water level meter",
// // //       deviceProfile: "Water sensor",
// // //       label: "",
// // //       state: "Active",
// // //       customer: "",
// // //       public: false,
// // //       isGateway: false,
// // //     },
// // //     {
// // //       key: "7",
// // //       id: "device7",
// // //       createdTime: "2025-01-27 15:01:29",
// // //       name: "Pool drain valve",
// // //       deviceProfile: "Valve",
// // //       label: "",
// // //       state: "Inactive",
// // //       customer: "",
// // //       public: false,
// // //       isGateway: false,
// // //     },
// // //     {
// // //       key: "8",
// // //       id: "device8",
// // //       createdTime: "2025-01-27 15:01:29",
// // //       name: "Pool weir valve",
// // //       deviceProfile: "Valve",
// // //       label: "",
// // //       state: "Inactive",
// // //       customer: "",
// // //       public: false,
// // //       isGateway: false,
// // //     },
// // //     {
// // //       key: "9",
// // //       id: "device9",
// // //       createdTime: "2025-01-27 15:01:29",
// // //       name: "Pool intake valve",
// // //       deviceProfile: "Valve",
// // //       label: "",
// // //       state: "Inactive",
// // //       customer: "",
// // //       public: false,
// // //       isGateway: false,
// // //     },
// // //     {
// // //       key: "10",
// // //       id: "device10",
// // //       createdTime: "2025-01-27 15:01:29",
// // //       name: "Heat pump outgoing valve",
// // //       deviceProfile: "Valve",
// // //       label: "",
// // //       state: "Inactive",
// // //       customer: "",
// // //       public: false,
// // //       isGateway: false,
// // //     },
// // //   ])

// // //   // Mock dashboards data
// // //   const [dashboards, setDashboards] = useState([
// // //     { id: "1", title: "Environmental Monitoring" },
// // //     { id: "2", title: "Production Overview" },
// // //     { id: "3", title: "Energy Consumption" },
// // //     { id: "customer1", title: "Customer Dashboard" },
// // //   ])

// // //   const [form] = Form.useForm()
// // //   const isMobile = useMediaQuery("(max-width: 768px)")
// // //   const isTablet = useMediaQuery("(max-width: 992px)")

// // //   const columns = [
// // //     {
// // //       title: "",
// // //       dataIndex: "select",
// // //       key: "select",
// // //       width: 50,
// // //       render: () => <Checkbox />,
// // //       responsive: ["md"],
// // //     },
// // //     {
// // //       title: "Created time",
// // //       dataIndex: "createdTime",
// // //       key: "createdTime",
// // //       sorter: (a, b) => a.createdTime.localeCompare(b.createdTime),
// // //       responsive: ["lg"],
// // //     },
// // //     {
// // //       title: "Name",
// // //       dataIndex: "name",
// // //       key: "name",
// // //       render: (text, record) => <a onClick={() => handleDeviceClick(record)}>{text}</a>,
// // //     },
// // //     {
// // //       title: "Device profile",
// // //       dataIndex: "deviceProfile",
// // //       key: "deviceProfile",
// // //       responsive: ["md"],
// // //     },
// // //     {
// // //       title: "Label",
// // //       dataIndex: "label",
// // //       key: "label",
// // //       responsive: ["lg"],
// // //     },
// // //     {
// // //       title: "State",
// // //       dataIndex: "state",
// // //       key: "state",
// // //       render: (state) => (
// // //         <Tag color={state === "Active" ? "green" : "volcano"} style={{ borderRadius: "16px" }}>
// // //           {state}
// // //         </Tag>
// // //       ),
// // //     },
// // //     {
// // //       title: "Customer",
// // //       dataIndex: "customer",
// // //       key: "customer",
// // //       responsive: ["lg"],
// // //     },
// // //     {
// // //       title: "Public",
// // //       dataIndex: "public",
// // //       key: "public",
// // //       render: (isPublic) => <Checkbox checked={isPublic} disabled />,
// // //       responsive: ["xl"],
// // //     },
// // //     {
// // //       title: "Is gateway",
// // //       dataIndex: "isGateway",
// // //       key: "isGateway",
// // //       render: (isGateway) => <Checkbox checked={isGateway} disabled />,
// // //       responsive: ["xl"],
// // //     },
// // //     {
// // //       title: "",
// // //       key: "actions",
// // //       width: isMobile ? 80 : 200,
// // //       render: (_, record) => (
// // //         <Space size="small">
// // //           {!isMobile && (
// // //             <>
// // //               <Button
// // //                 type="text"
// // //                 icon={<DashboardOutlined />}
// // //                 onClick={(e) => {
// // //                   e.stopPropagation()
// // //                   handleAddToDashboard(record)
// // //                 }}
// // //                 title="Add to Dashboard"
// // //               />
// // //               <Button type="text" icon={<ShareAltOutlined />} />
// // //               <Button type="text" icon={<DownloadOutlined />} />
// // //             </>
// // //           )}
// // //           <Button type="text" icon={<SafetyOutlined />} />
// // //           <Button type="text" icon={<DeleteOutlined />} />
// // //           <Dropdown
// // //             overlay={
// // //               <Menu>
// // //                 <Menu.Item
// // //                   key="add-to-dashboard"
// // //                   icon={<DashboardOutlined />}
// // //                   onClick={() => handleAddToDashboard(record)}
// // //                 >
// // //                   Add to Dashboard
// // //                 </Menu.Item>
// // //                 <Menu.Item key="share" icon={<ShareAltOutlined />}>
// // //                   Share Device
// // //                 </Menu.Item>
// // //                 <Menu.Item key="download" icon={<DownloadOutlined />}>
// // //                   Download Data
// // //                 </Menu.Item>
// // //                 <Menu.Item key="delete" icon={<DeleteOutlined />} danger>
// // //                   Delete Device
// // //                 </Menu.Item>
// // //               </Menu>
// // //             }
// // //             trigger={["click"]}
// // //           >
// // //             <Button type="text" icon={<MoreOutlined />} />
// // //           </Dropdown>
// // //         </Space>
// // //       ),
// // //     },
// // //   ]

// // //   // Mobile card view renderer
// // //   const renderMobileList = () => (
// // //     <List
// // //       dataSource={deviceData}
// // //       renderItem={(item) => (
// // //         <List.Item
// // //           key={item.key}
// // //           actions={[
// // //             <Button
// // //               key="dashboard"
// // //               type="text"
// // //               icon={<DashboardOutlined />}
// // //               onClick={(e) => {
// // //                 e.stopPropagation()
// // //                 handleAddToDashboard(item)
// // //               }}
// // //             />,
// // //             <Button
// // //               key="more"
// // //               type="text"
// // //               icon={<MoreOutlined />}
// // //               onClick={(e) => {
// // //                 e.stopPropagation()
// // //                 // Show dropdown menu
// // //               }}
// // //             />,
// // //           ]}
// // //           onClick={() => handleDeviceClick(item)}
// // //         >
// // //           <List.Item.Meta
// // //             avatar={
// // //               <Avatar
// // //                 style={{
// // //                   backgroundColor: item.isGateway ? "#1890ff" : "#f56a00",
// // //                   verticalAlign: "middle",
// // //                 }}
// // //               >
// // //                 {item.name.charAt(0)}
// // //               </Avatar>
// // //             }
// // //             title={item.name}
// // //             description={
// // //               <Space direction="vertical" size={1}>
// // //                 <div>{item.deviceProfile}</div>
// // //                 <Tag color={item.state === "Active" ? "green" : "volcano"} style={{ borderRadius: "16px" }}>
// // //                   {item.state}
// // //                 </Tag>
// // //               </Space>
// // //             }
// // //           />
// // //         </List.Item>
// // //       )}
// // //       pagination={{
// // //         position: "bottom",
// // //         pageSize: 10,
// // //         showSizeChanger: true,
// // //         pageSizeOptions: ["10", "20", "50", "100"],
// // //         total: deviceData.length,
// // //         showTotal: (total, range) => `${range[0]} - ${range[1]} of ${total}`,
// // //       }}
// // //     />
// // //   )

// // //   const handleDeviceClick = (device) => {
// // //     setSelectedDevice(device)
// // //     setIsDeviceDrawerVisible(true)
// // //   }

// // //   const showAddDeviceModal = () => {
// // //     setIsAddDeviceModalVisible(true)
// // //   }

// // //   const handleAddDeviceCancel = () => {
// // //     setIsAddDeviceModalVisible(false)
// // //   }

// // //   const handleAddDevice = (values) => {
// // //     // Add the new device to the list
// // //     const newDeviceData = [...deviceData, values]
// // //     setDeviceData(newDeviceData)

// // //     // Store the new device for the success modal
// // //     setNewDevice(values)

// // //     // Close the add modal
// // //     setIsAddDeviceModalVisible(false)

// // //     // Show the success modal
// // //     setShowSuccessModal(true)
// // //   }

// // //   const handleDeviceDrawerClose = () => {
// // //     setIsDeviceDrawerVisible(false)
// // //   }

// // //   const handleSuccessModalClose = () => {
// // //     setShowSuccessModal(false)
// // //   }

// // //   const handleAddToDashboard = (device) => {
// // //     setSelectedDevice(device)
// // //     setIsAddToDashboardModalVisible(true)
// // //   }

// // //   const handleAddToDashboardSubmit = () => {
// // //     // In a real app, this would add the device to the selected dashboard
// // //     // For now, we'll just navigate to the customer dashboard with the device pre-selected

// // //     // Close the modal
// // //     setIsAddToDashboardModalVisible(false)

// // //     // Navigate to the customer dashboard with the device ID as a parameter
// // //     navigate(`/customer-dashboard/${selectedDashboard}?device=${selectedDevice.id}&widgetType=${selectedWidgetType}`)
// // //   }

// // //   // const addDeviceMenu = (
// // //   //   <Menu
// // //   //     items={[
// // //   //       {
// // //   //         key: "1",
// // //   //         label: "Add new device",
// // //   //         icon: <PlusOutlined />,
// // //   //         onClick: showAddDeviceModal,
// // //   //       },
// // //   //       {
// // //   //         key: "2",
// // //   //         label: "Import device",
// // //   //         icon: <DownloadOutlined />,
// // //   //       },
// // //   //     ]}
// // //   //   />
// // //   // )
// // //     const addDeviceMenu = {
// // //       items: [
// // //         {
// // //           key: "1",
// // //           label: "Add new device",
// // //           icon: <PlusOutlined />,
// // //           onClick: showAddDeviceModal,
// // //         },
// // //         {
// // //           key: "2",
// // //           label: "Import device",
// // //           icon: <DownloadOutlined />,
// // //         },
// // //       ],
// // //     }

// // //   return (
// // //     <div className="devices-page">
// // //       <Card
// // //         title={<Typography.Title level={4}>Devices</Typography.Title>}
// // //         extra={
// // //           <Space wrap={isMobile} size={isMobile ? 8 : "middle"}>
// // //             {!isMobile && <Button icon={<FilterOutlined />}>Device Filter</Button>}
// // //             <Dropdown menu={addDeviceMenu} trigger={["click"]}>
// // //               <Button icon={<PlusOutlined />} type={isMobile ? "primary" : "default"}>
// // //                 {!isMobile && "Add"}
// // //               </Button>
// // //             </Dropdown>
// // //             <Button icon={<ReloadOutlined />} />
// // //             {!isMobile && <Button icon={<SearchOutlined />} />}
// // //           </Space>
// // //         }
// // //         bordered={false}
// // //         className="responsive-card"
// // //       >
// // //         {isMobile ? (
// // //           renderMobileList()
// // //         ) : (
// // //           <Table
// // //             columns={columns}
// // //             dataSource={deviceData}
// // //             pagination={{
// // //               position: ["bottomRight"],
// // //               showSizeChanger: true,
// // //               pageSizeOptions: ["10", "20", "50", "100"],
// // //               total: deviceData.length,
// // //               showTotal: (total, range) => `${range[0]} - ${range[1]} of ${total}`,
// // //             }}
// // //             size={isMobile ? "small" : "middle"}
// // //             rowSelection={{
// // //               type: "checkbox",
// // //             }}
// // //             scroll={{ x: isTablet ? 800 : undefined }}
// // //           />
// // //         )}
// // //       </Card>

// // //       <AddDeviceModal
// // //         visible={isAddDeviceModalVisible}
// // //         onCancel={handleAddDeviceCancel}
// // //         onAdd={handleAddDevice}
// // //         isMobile={isMobile}
// // //       />

// // //       <DeviceDetailsDrawer
// // //         visible={isDeviceDrawerVisible}
// // //         onClose={handleDeviceDrawerClose}
// // //         device={selectedDevice}
// // //         isMobile={isMobile}
// // //         width={isMobile ? "100%" : 520}
// // //       />

// // //       <DeviceCreationSuccess visible={showSuccessModal} onClose={handleSuccessModalClose} device={newDevice} />

// // //       {/* Add to Dashboard Modal */}
// // //       <Modal
// // //         title="Add Device to Dashboard"
// // //         open={isAddToDashboardModalVisible}
// // //         onCancel={() => setIsAddToDashboardModalVisible(false)}
// // //         onOk={handleAddToDashboardSubmit}
// // //         okText="Add to Dashboard"
// // //       >
// // //         <Form layout="vertical">
// // //           <Form.Item label="Select Dashboard" required style={{ marginBottom: 16 }}>
// // //             <Select
// // //               placeholder="Select a dashboard"
// // //               style={{ width: "100%" }}
// // //               value={selectedDashboard}
// // //               onChange={setSelectedDashboard}
// // //             >
// // //               {dashboards.map((dashboard) => (
// // //                 <Option key={dashboard.id} value={dashboard.id}>
// // //                   {dashboard.title}
// // //                 </Option>
// // //               ))}
// // //             </Select>
// // //           </Form.Item>

// // //           <Form.Item label="Widget Type" required style={{ marginBottom: 16 }}>
// // //             <Select
// // //               placeholder="Select widget type"
// // //               style={{ width: "100%" }}
// // //               value={selectedWidgetType}
// // //               onChange={setSelectedWidgetType}
// // //             >
// // //               <Option value="line-chart">
// // //                 <Space>
// // //                   <LineChartOutlined /> Line Chart
// // //                 </Space>
// // //               </Option>
// // //               <Option value="bar-chart">
// // //                 <Space>
// // //                   <BarChartOutlined /> Bar Chart
// // //                 </Space>
// // //               </Option>
// // //               <Option value="pie-chart">
// // //                 <Space>
// // //                   <PieChartOutlined /> Pie Chart
// // //                 </Space>
// // //               </Option>
// // //               <Option value="gauge">
// // //                 <Space>
// // //                   <DashboardOutlined /> Gauge
// // //                 </Space>
// // //               </Option>
// // //               <Option value="value-card">Value Card</Option>
// // //               <Option value="status-card">Status Card</Option>
// // //               <Option value="battery-level">Battery Level</Option>
// // //               <Option value="signal-strength">Signal Strength</Option>
// // //             </Select>
// // //           </Form.Item>

// // //           <Typography.Text type="secondary">
// // //             This will add {selectedDevice?.name || "the selected device"} to the dashboard with the selected widget
// // //             type.
// // //           </Typography.Text>
// // //         </Form>
// // //       </Modal>
// // //     </div>
// // //   )
// // // }

// // // export default DevicesPage