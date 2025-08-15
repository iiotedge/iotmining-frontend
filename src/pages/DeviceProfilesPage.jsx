"use client"

import React, { useState, useEffect } from "react"
import {
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Spin,
} from "antd"
import {
  PlusOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FlagOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons"

import DeviceProfileDetailsDrawer from "../components/device/DeviceProfileDetailsDrawer"
import { listDeviceProfiles, getDeviceProfileById, createDeviceProfile } from "../api/deviceProfileApi"
import AddDeviceProfileModal from "../components/device/AddDeviceProfileModal"
import { mockTenants } from "../api/mockTenants"

const { Title } = Typography

const DeviceProfilesPage = () => {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailsDrawer, setDetailsDrawer] = useState({ visible: false, record: null })
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  const fetchProfiles = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const data = await listDeviceProfiles(page - 1, pageSize) // backend 0-based
      setProfiles((data.content || []).map(p => ({
        ...p,
        key: p.id,
        createdTime: p.createdAt || p.createdTime,
        name: p.name,
        profileType: p.type || p.profileType,
        transportType: p.protocol || p.transportType,
        description: p.description || "",
        isDefault: !!p.isDefault,
      })))
      setPagination({
        current: data.pageable.pageNumber + 1,
        pageSize: data.pageable.pageSize,
        total: data.totalElements,
      })
    } catch (e) {
      message.error(e.message || "Failed to load device profiles")
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    fetchProfiles(pagination.current, pagination.pageSize)
  }, [])

  const handleShowDrawer = async (profile) => {
    setDetailsLoading(true)
    try {
      const details = await getDeviceProfileById(profile.id)
      setDetailsDrawer({ visible: true, record: details })
    } catch (e) {
      message.error(e.message || "Failed to load profile details")
      setDetailsDrawer({ visible: true, record: profile }) // fallback
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleAddProfile = async (profile) => {
    try {
      await createDeviceProfile(profile)
      setAddModalVisible(false)
      fetchProfiles()
      message.success("Device profile created")
    } catch (e) {
      message.error(e.message || "Failed to create device profile")
    }
  }

  const columns = [
    {
      title: "Created time",
      dataIndex: "createdTime",
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (text, record) => (
        <a onClick={() => handleShowDrawer(record)}>{text}</a>
      ),
    },
    {
      title: "Profile type",
      dataIndex: "profileType",
    },
    {
      title: "Transport type",
      dataIndex: "transportType",
    },
    {
      title: "Description",
      dataIndex: "description",
    },
    {
      title: "Default",
      dataIndex: "isDefault",
      render: (v) => (v ? <Tag color="blue">Default</Tag> : null),
      align: "center",
    },
    {
      title: "",
      render: () => (
        <Space>
          <Button icon={<DownloadOutlined />} size="small" />
          <Button icon={<FlagOutlined />} size="small" />
          <Button icon={<DeleteOutlined />} size="small" danger />
        </Space>
      ),
      width: 120,
    },
  ]

  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 6, minHeight: 500 }}>
      <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
        <Title level={4} style={{ margin: 0 }}>Device profiles</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchProfiles} />
          <Button icon={<PlusOutlined />} type="primary" onClick={() => setAddModalVisible(true)}>
            Add device profile
          </Button>
        </Space>
      </Space>

      <Table
        dataSource={profiles}
        columns={columns}
        loading={loading}
        rowSelection={{}}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: (page, pageSize) => fetchProfiles(page, pageSize),
        }}
        size="middle"
      />

      {/* Add Device Profile Modal */}
      <AddDeviceProfileModal
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onAdd={handleAddProfile}
        tenants={mockTenants}   // or pass real tenant list here
      />

      {/* Details Drawer */}
      <DeviceProfileDetailsDrawer
        visible={detailsDrawer.visible}
        onClose={() => setDetailsDrawer({ visible: false, record: null })}
        profile={detailsDrawer.record}
        loading={detailsLoading}
      />
    </div>
  )
}

export default DeviceProfilesPage


// "use client"

// import React, { useState, useEffect } from "react"
// import {
//   Table,
//   Button,
//   Space,
//   Typography,
//   Tag,
//   Drawer,
//   Modal,
//   Form,
//   Input,
//   Select,
//   message,
// } from "antd"
// import {
//   PlusOutlined,
//   ReloadOutlined,
//   DownloadOutlined,
//   FlagOutlined,
//   DeleteOutlined,
//   SearchOutlined,
//   QuestionCircleOutlined,
// } from "@ant-design/icons"

// import DeviceProfileDetailsDrawer from "../components/device/DeviceProfileDetailsDrawer"

// const { Title } = Typography

// // Mock API/data
// const mockProfiles = [
//   {
//     key: "1",
//     createdTime: "2025-07-04 11:38:11",
//     name: "dsf",
//     profileType: "Default",
//     transportType: "MQTT",
//     description: "",
//     isDefault: false,
//   },
//   {
//     key: "2",
//     createdTime: "2025-03-01 18:13:46",
//     name: "IoTM",
//     profileType: "Default",
//     transportType: "Default",
//     description: "",
//     isDefault: false,
//   },
//   // ...other profiles
// ]

// // Main List Page
// const DeviceProfilesPage = () => {
//   const [profiles, setProfiles] = useState([])
//   const [loading, setLoading] = useState(false)
//   const [detailsDrawer, setDetailsDrawer] = useState({ visible: false, record: null })
//   const [addModalVisible, setAddModalVisible] = useState(false)

//   useEffect(() => {
//     setLoading(true)
//     setTimeout(() => {
//       setProfiles(mockProfiles)
//       setLoading(false)
//     }, 600)
//   }, [])

//   const columns = [
//     {
//       title: "Created time",
//       dataIndex: "createdTime",
//     },
//     {
//       title: "Name",
//       dataIndex: "name",
//       render: (text, record) => (
//         <a onClick={() => setDetailsDrawer({ visible: true, record })}>{text}</a>
//       ),
//     },
//     {
//       title: "Profile type",
//       dataIndex: "profileType",
//     },
//     {
//       title: "Transport type",
//       dataIndex: "transportType",
//     },
//     {
//       title: "Description",
//       dataIndex: "description",
//     },
//     {
//       title: "Default",
//       dataIndex: "isDefault",
//       render: (v) => (v ? <Tag color="blue">Default</Tag> : null),
//       align: "center",
//     },
//     {
//       title: "",
//       render: () => (
//         <Space>
//           <Button icon={<DownloadOutlined />} size="small" />
//           <Button icon={<FlagOutlined />} size="small" />
//           <Button icon={<DeleteOutlined />} size="small" danger />
//         </Space>
//       ),
//       width: 120,
//     },
//   ]

//   return (
//     <div style={{ background: "#fff", padding: 24, borderRadius: 6, minHeight: 500 }}>
//       <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
//         <Title level={4} style={{ margin: 0 }}>Device profiles</Title>
//         <Space>
//           <Button icon={<ReloadOutlined />} />
//           <Button icon={<PlusOutlined />} type="primary" onClick={() => setAddModalVisible(true)}>
//             Add device profile
//           </Button>
//         </Space>
//       </Space>

//       <Table
//         dataSource={profiles}
//         columns={columns}
//         loading={loading}
//         rowSelection={{}}
//         pagination={{ pageSize: 10 }}
//         size="middle"
//       />

//       {/* Add Device Profile Modal */}
//       <AddDeviceProfileModal
//         visible={addModalVisible}
//         onCancel={() => setAddModalVisible(false)}
//         onAdd={(profile) => {
//           setProfiles([...profiles, { ...profile, key: String(profiles.length + 1) }])
//           setAddModalVisible(false)
//         }}
//       />

//       {/* Details Drawer */}
//       <DeviceProfileDetailsDrawer
//         visible={detailsDrawer.visible}
//         onClose={() => setDetailsDrawer({ visible: false, record: null })}
//         profile={detailsDrawer.record}
//       />
//     </div>
//   )
// }

// export default DeviceProfilesPage

// // ---- Add Device Profile Modal ----

// const AddDeviceProfileModal = ({ visible, onCancel, onAdd }) => {
//   const [form] = Form.useForm()
//   const [step, setStep] = useState(0)

//   // Steps: 0=Details, 1=Transport, 2=Alarm, 3=Provisioning
//   const handleNext = () => {
//     if (step < 3) setStep(step + 1)
//     else form.submit()
//   }
//   const handleBack = () => setStep(Math.max(0, step - 1))

//   const onFinish = (values) => {
//     onAdd(values)
//     form.resetFields()
//     setStep(0)
//   }

//   const renderStep = () => {
//     if (step === 0)
//       return (
//         <>
//           <Form.Item name="name" label="Name" rules={[{ required: true }]}>
//             <Input />
//           </Form.Item>
//           <Form.Item name="ruleChain" label="Default rule chain">
//             <Input />
//           </Form.Item>
//           <Form.Item name="mobileDashboard" label="Mobile dashboard">
//             <Input />
//           </Form.Item>
//           <Form.Item name="queue" label="Queue">
//             <Input />
//           </Form.Item>
//         </>
//       )
//     if (step === 1)
//       return (
//         <>
//           <Form.Item name="transportType" label="Transport type" initialValue="Default">
//             <Select>
//               <Select.Option value="Default">Default</Select.Option>
//               <Select.Option value="MQTT">MQTT</Select.Option>
//               <Select.Option value="CoAP">CoAP</Select.Option>
//               <Select.Option value="LWM2M">LWM2M</Select.Option>
//               <Select.Option value="SNMP">SNMP</Select.Option>
//             </Select>
//           </Form.Item>
//         </>
//       )
//     if (step === 2)
//       return <Typography.Text>No alarm rules configured.</Typography.Text>
//     if (step === 3)
//       return (
//         <Form.Item name="provisionStrategy" label="Provision strategy" initialValue="Disabled">
//           <Select>
//             <Select.Option value="Disabled">Disabled</Select.Option>
//             <Select.Option value="Allow">Allow to create new devices</Select.Option>
//             <Select.Option value="PreProvisioned">Check for pre-provisioned devices</Select.Option>
//             <Select.Option value="X509">X509 Certificates Chain</Select.Option>
//           </Select>
//         </Form.Item>
//       )
//   }

//   return (
//     <Modal
//       title="Add device profile"
//       visible={visible}
//       onCancel={() => { onCancel(); setStep(0) }}
//       footer={null}
//       width={560}
//       destroyOnClose
//     >
//       <Form form={form} layout="vertical" onFinish={onFinish}>
//         {renderStep()}
//         <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
//           {step > 0 ? <Button onClick={handleBack}>Back</Button> : <span />}
//           {step < 3
//             ? <Button type="primary" onClick={handleNext}>Next</Button>
//             : <Button type="primary" htmlType="submit">Add</Button>
//           }
//         </div>
//       </Form>
//     </Modal>
//   )
// }

