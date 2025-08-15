"use client"

import { useEffect, useState } from "react"
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Spin,
  Badge,
  Tooltip,
  Tag,
} from "antd"
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  CloudServerOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  TeamOutlined,
} from "@ant-design/icons"
import axios from "axios"
import CustomerDetailsDrawer from "../components/customer/CustomerDetailsDrawer"
import AddCustomerModal from "../components/customer/AddCustomerModal"
import { getTenantId, getToken } from "../utils/tokenUtils"

const { Title, Text } = Typography

// Optional: Nice color by type
const typeColor = (type) => {
  if (type === "ORGANIZATION") return "volcano"
  if (type === "COMPANY") return "geekblue"
  if (type === "USER") return "green"
  return "default"
}

const CustomersPage = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [companiesTree, setCompaniesTree] = useState([])

  // ---- Fetch from backend on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true)
      try {
        const tenantId = getTenantId(); //"4f428fcd-f4f4-408e-b2e3-e5002b8950ff"; //getTenantId()
        if (!tenantId) {
          Modal.error({ title: "Error", content: "No tenantId found in token" })
          setLoading(false)
          return
        }
        const token = getToken()
        const { data } = await axios.get(
          `http://localhost:8096/api/v1/super-admin/tenant-companies-users-details`,
          {
            params: { tenantId },
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        setCompaniesTree(data.companies || [])
      } catch (err) {
        Modal.error({
          title: "Failed to load companies",
          content: (err?.response?.data?.message || "Server error"),
        })
        setCompaniesTree([])
      }
      setLoading(false)
    }
    fetchCompanies()
  }, [])

  // ---- Tree utility: flatten company->user->subCompanies into Table treeData
  const buildChildren = (node) => {
    let children = []
    // 1. Users as leaf rows
    if (Array.isArray(node.users)) {
      children = [
        ...children,
        ...node.users.map((u) => ({
          key: u.tenantId,
          ...u,
          rowType: "USER",
          children: [], // users have no children
        })),
      ]
    }
    // 2. Sub-companies (recursive)
    if (Array.isArray(node.subCompanies)) {
      children = [
        ...children,
        ...node.subCompanies.map((sc) => ({
          key: sc.company.tenantId,
          ...sc.company,
          rowType: "COMPANY",
          children: buildChildren(sc), // recursion
        })),
      ]
    }
    return children
  }

  // ---- Format treeData for Antd Table
  const getTreeData = () =>
    companiesTree.map((node) => ({
      key: node.company.tenantId,
      ...node.company,
      rowType: "COMPANY",
      children: buildChildren(node),
    }))

  // ---- Table columns ----
  const columns = [
    {
      title: "",
      dataIndex: "typeIcon",
      width: 36,
      align: "center",
      render: (_, record) =>
        record.rowType === "COMPANY" ? (
          <Tooltip title="Company">
            <ApartmentOutlined style={{ color: "#1E90FF", fontSize: 20 }} />
          </Tooltip>
        ) : (
          <Tooltip title="User">
            <UserOutlined style={{ color: "#52c41a", fontSize: 18 }} />
          </Tooltip>
        ),
    },
    {
      title: "Title",
      dataIndex: "tenantName",
      key: "tenantName",
      render: (text, record) =>
        record.rowType === "COMPANY" ? (
          <Button
            type="link"
            onClick={() => handleCustomerClick(record)}
            style={{ fontWeight: 600, padding: 0 }}
            icon={<TeamOutlined style={{ color: "#1890ff" }} />}
          >
            {text}
          </Button>
        ) : (
          <span style={{ paddingLeft: 10 }}>
            <Button
              type="link"
              onClick={() => handleCustomerClick(record)}
              style={{ color: "#52c41a", fontWeight: 500, padding: 0 }}
              icon={<UserOutlined />}
            >
              {text}
            </Button>
          </span>
        ),
    },
    {
      title: "Type",
      dataIndex: "tenantType",
      key: "tenantType",
      render: (value) =>
        value ? (
          <Tag color={typeColor(value)} style={{ minWidth: 92, textAlign: "center" }}>
            {value.charAt(0) + value.slice(1).toLowerCase()}
          </Tag>
        ) : null,
    },
    {
      title: "Access",
      dataIndex: "accessLevel",
      key: "accessLevel",
      render: (v) =>
        v ? <Tag color={v === "SUPER" ? "red" : v === "ADMIN" ? "blue" : "green"}>{v}</Tag> : "",
    },
    {
      title: "Plan",
      dataIndex: "subscriptionPlan",
      key: "subscriptionPlan",
      render: (p) => (p ? <Tag color="gold">{p}</Tag> : null),
    },
    {
      title: "",
      key: "actions",
      render: (_, record) =>
        record.rowType === "COMPANY" ? (
          <Space>
            <Tooltip title="Manage users">
              <Button type="text" icon={<UserOutlined />} />
            </Tooltip>
            <Tooltip title="Manage assets">
              <Button type="text" icon={<AppstoreOutlined />} />
            </Tooltip>
            <Tooltip title="Manage dashboards">
              <Button type="text" icon={<DashboardOutlined />} />
            </Tooltip>
            <Tooltip title="Manage edge instances">
              <Button type="text" icon={<CloudServerOutlined />} />
            </Tooltip>
            <Tooltip title="Delete company">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                onClick={() => showDeleteConfirm(record)}
              />
            </Tooltip>
          </Space>
        ) : null,
    },
  ]

  // ---- Row events/handlers
  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer)
    setIsDetailsDrawerVisible(true)
  }

  const showAddModal = () => setIsAddModalVisible(true)
  const handleAddCancel = () => {
    setIsAddModalVisible(false)
    form.resetFields()
  }

  const handleAddSubmit = (values) => {
    setIsAddModalVisible(false)
    form.resetFields()
  }

  const handleDetailsDrawerClose = () => {
    setIsDetailsDrawerVisible(false)
    setSelectedCustomer(null)
  }

  const showDeleteConfirm = (customer) => {
    Modal.confirm({
      title: "Are you sure you want to delete this company?",
      content: `Company "${customer.tenantName}" will be deleted.`,
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        // Backend delete logic here if needed
      },
    })
  }

  const onSelectChange = (newSelectedRowKeys) => setSelectedRowKeys(newSelectedRowKeys)
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    getCheckboxProps: (record) => ({
      disabled: record.rowType !== "COMPANY",
    }),
  }

  return (
    <>
      <Card
        title={
          <Space>
            <TeamOutlined style={{ fontSize: 22, color: "#004aad" }} />
            <Title level={4} style={{ margin: 0 }}>
              Customers / Companies Explorer
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<PlusOutlined />} type="primary" onClick={showAddModal}>
              Add customer
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()} />
            <Button icon={<SearchOutlined />} />
          </Space>
        }
        style={{ marginBottom: 24, boxShadow: "0 2px 12px #0001" }}
        bodyStyle={{ padding: 0 }}
      >
        <Spin spinning={loading}>
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={getTreeData()}
            pagination={{
              total: companiesTree.length,
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
            }}
            expandable={{
              defaultExpandAllRows: true,
              expandRowByClick: true,
              expandIconColumnIndex: 1,
            }}
            bordered
            size="middle"
            rowClassName={(record) =>
              record.rowType === "COMPANY"
                ? "company-row"
                : "user-row"
            }
            style={{ background: "#fff" }}
          />
        </Spin>
      </Card>

      <AddCustomerModal
        visible={isAddModalVisible}
        onCancel={handleAddCancel}
        onAdd={handleAddSubmit}
      />

      <CustomerDetailsDrawer
        visible={isDetailsDrawerVisible}
        onClose={handleDetailsDrawerClose}
        customer={selectedCustomer}
      />

      {/* ---- Style improvements for rows ---- */}
      <style jsx="true">{`
        .company-row {
          background: #f7fbff;
        }
        .user-row {
          background: #fff;
        }
        .ant-table-tbody > tr.ant-table-row:hover > td {
          background: #e6f7ff !important;
        }
      `}</style>
    </>
  )
}

export default CustomersPage

// "use client"

// import { useEffect, useState } from "react"
// import { Card, Table, Button, Space, Typography, Modal, Form, Spin, message } from "antd"
// import {
//   PlusOutlined,
//   ReloadOutlined,
//   SearchOutlined,
//   UserOutlined,
//   DashboardOutlined,
//   AppstoreOutlined,
//   CloudServerOutlined,
//   DeleteOutlined,
// } from "@ant-design/icons"
// import axios from "axios"
// import CustomerDetailsDrawer from "../components/customer/CustomerDetailsDrawer"
// import AddCustomerModal from "../components/customer/AddCustomerModal"
// import { getTenantId, getToken } from "../utils/tokenUtils"

// const { Title } = Typography

// const CustomersPage = () => {
//   const [selectedRowKeys, setSelectedRowKeys] = useState([])
//   const [isAddModalVisible, setIsAddModalVisible] = useState(false)
//   const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false)
//   const [selectedCustomer, setSelectedCustomer] = useState(null)
//   const [form] = Form.useForm()
//   const [loading, setLoading] = useState(false)
//   const [companiesTree, setCompaniesTree] = useState([])

//   // ---- API Fetch on Mount ----
//   useEffect(() => {
//     const fetchCompanies = async () => {
//       setLoading(true)
//       try {
//         const tenantId = "4f428fcd-f4f4-408e-b2e3-e5002b8950ff"; //getTenantId()
//         if (!tenantId) {
//           message.error("No tenantId found in token")
//           setLoading(false)
//           return
//         }
//         const token = getToken()
//         const { data } = await axios.get(
//           `http://localhost:8096/api/v1/super-admin/tenant-companies-users-details`,
//           {
//             params: { tenantId },
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         )
//         setCompaniesTree(data.companies || [])
//       } catch (err) {
//         message.error("Failed to load customers/companies")
//         setCompaniesTree([])
//       }
//       setLoading(false)
//     }
//     fetchCompanies()
//   }, [])

//   // ---- Expand: Return users and sub-companies as children for Table row ----
//   const buildChildren = (node) => {
//     let children = []
//     // Add users first (as children rows)
//     if (Array.isArray(node.users)) {
//       children = [
//         ...children,
//         ...node.users.map((u) => ({
//           key: u.tenantId,
//           title: u.tenantName,
//           tenantType: u.tenantType,
//           accessLevel: u.accessLevel,
//           parentId: u.parentId,
//           subscriptionPlan: u.subscriptionPlan,
//           rowType: "USER",
//           // Other fields...
//         })),
//       ]
//     }
//     // Add sub-companies recursively
//     if (Array.isArray(node.subCompanies)) {
//       children = [
//         ...children,
//         ...node.subCompanies.map((sc) => ({
//           key: sc.company.tenantId,
//           ...sc.company,
//           rowType: "COMPANY",
//           children: buildChildren(sc), // recursion
//         })),
//       ]
//     }
//     return children
//   }

//   // ---- Map your JSON tree to AntD Table treeData format ----
//   const getTreeData = () =>
//     companiesTree.map((node) => ({
//       key: node.company.tenantId,
//       ...node.company,
//       rowType: "COMPANY",
//       children: buildChildren(node),
//     }))

//   // ---- Table columns ----
//   const columns = [
//     {
//       title: "",
//       dataIndex: "select",
//       width: 50,
//       render: (_, record) =>
//         record.rowType === "COMPANY" ? (
//           <input type="checkbox" />
//         ) : null,
//     },
//     {
//       title: "Title",
//       dataIndex: "tenantName",
//       key: "tenantName",
//       render: (text, record) => (
//         <a onClick={() => handleCustomerClick(record)}>{text}</a>
//       ),
//     },
//     {
//       title: "Type",
//       dataIndex: "tenantType",
//       key: "tenantType",
//       render: (value) =>
//         value
//           ? value.charAt(0).toUpperCase() +
//             value.slice(1).toLowerCase().replace("_", " ")
//           : "",
//     },
//     {
//       title: "Access Level",
//       dataIndex: "accessLevel",
//       key: "accessLevel",
//     },
//     {
//       title: "Subscription Plan",
//       dataIndex: "subscriptionPlan",
//       key: "subscriptionPlan",
//     },
//     {
//       title: "",
//       key: "actions",
//       render: (_, record) =>
//         record.rowType === "COMPANY" ? (
//           <Space>
//             <Button type="text" icon={<UserOutlined />} title="Manage users" />
//             <Button type="text" icon={<AppstoreOutlined />} title="Manage assets" />
//             <Button type="text" icon={<DashboardOutlined />} title="Manage dashboards" />
//             <Button type="text" icon={<CloudServerOutlined />} title="Manage edge instances" />
//             <Button
//               type="text"
//               icon={<DeleteOutlined />}
//               title="Delete company"
//               onClick={() => showDeleteConfirm(record)}
//             />
//           </Space>
//         ) : null,
//     },
//   ]

//   // ---- Handlers ----
//   const handleCustomerClick = (customer) => {
//     setSelectedCustomer(customer)
//     setIsDetailsDrawerVisible(true)
//   }

//   const showAddModal = () => setIsAddModalVisible(true)
//   const handleAddCancel = () => {
//     setIsAddModalVisible(false)
//     form.resetFields()
//   }

//   const handleAddSubmit = (values) => {
//     // Backend add logic (not shown)
//     setIsAddModalVisible(false)
//     form.resetFields()
//   }

//   const handleDetailsDrawerClose = () => {
//     setIsDetailsDrawerVisible(false)
//     setSelectedCustomer(null)
//   }

//   const showDeleteConfirm = (customer) => {
//     Modal.confirm({
//       title: "Are you sure you want to delete this customer?",
//       content: `Customer "${customer.tenantName}" will be deleted.`,
//       okText: "Yes",
//       okType: "danger",
//       cancelText: "No",
//       onOk() {
//         // Backend delete logic (not shown)
//       },
//     })
//   }

//   const onSelectChange = (newSelectedRowKeys) => setSelectedRowKeys(newSelectedRowKeys)

//   const rowSelection = {
//     selectedRowKeys,
//     onChange: onSelectChange,
//     // Only allow selection of company rows
//     getCheckboxProps: (record) => ({
//       disabled: record.rowType !== "COMPANY",
//     }),
//   }

//   return (
//     <>
//       <Card
//         title={<Title level={4}>Customers</Title>}
//         extra={
//           <Space>
//             <Button icon={<PlusOutlined />} type="primary" onClick={showAddModal}>
//               Add customer
//             </Button>
//             <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()} />
//             <Button icon={<SearchOutlined />} />
//           </Space>
//         }
//       >
//         <Spin spinning={loading}>
//           <Table
//             rowSelection={rowSelection}
//             columns={columns}
//             dataSource={getTreeData()}
//             pagination={{
//               total: companiesTree.length,
//               pageSize: 10,
//               showSizeChanger: true,
//               showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
//             }}
//             expandable={{
//               defaultExpandAllRows: true,
//             }}
//           />
//         </Spin>
//       </Card>

//       <AddCustomerModal
//         visible={isAddModalVisible}
//         onCancel={handleAddCancel}
//         onAdd={handleAddSubmit}
//       />

//       <CustomerDetailsDrawer
//         visible={isDetailsDrawerVisible}
//         onClose={handleDetailsDrawerClose}
//         customer={selectedCustomer}
//       />
//     </>
//   )
// }

// export default CustomersPage


// // "use client"

// // import { useState } from "react"
// // import { Card, Table, Button, Space, Typography, Modal, Form, Tabs } from "antd"
// // import {
// //   PlusOutlined,
// //   ReloadOutlined,
// //   SearchOutlined,
// //   UserOutlined,
// //   DashboardOutlined,
// //   AppstoreOutlined,
// //   CloudServerOutlined,
// //   DeleteOutlined,
// // } from "@ant-design/icons"
// // import CustomerDetailsDrawer from "../components/customer/CustomerDetailsDrawer"
// // import AddCustomerModal from "../components/customer/AddCustomerModal"

// // const { Title } = Typography
// // const { TabPane } = Tabs

// // const CustomersPage = () => {
// //   const [selectedRowKeys, setSelectedRowKeys] = useState([])
// //   const [isAddModalVisible, setIsAddModalVisible] = useState(false)
// //   const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false)
// //   const [selectedCustomer, setSelectedCustomer] = useState(null)
// //   const [form] = Form.useForm()

// //   const [customers, setCustomers] = useState([
// //     {
// //       key: "1",
// //       createdTime: "2025-03-05 13:18:42",
// //       title: "Public",
// //       email: "",
// //       country: "",
// //       city: "",
// //     },
// //     {
// //       key: "2",
// //       createdTime: "2025-01-27 15:01:20",
// //       title: "Device Claiming Customer",
// //       email: "",
// //       country: "Germany",
// //       city: "Berlin",
// //     },
// //     {
// //       key: "3",
// //       createdTime: "2025-01-27 15:01:20",
// //       title: "Demo Customer",
// //       email: "",
// //       country: "Germany",
// //       city: "Berlin",
// //     },
// //     {
// //       key: "4",
// //       createdTime: "2025-01-27 15:01:18",
// //       title: "Customer C",
// //       email: "",
// //       country: "",
// //       city: "",
// //     },
// //     {
// //       key: "5",
// //       createdTime: "2025-01-27 15:01:18",
// //       title: "Customer B",
// //       email: "",
// //       country: "",
// //       city: "",
// //     },
// //     {
// //       key: "6",
// //       createdTime: "2025-01-27 15:01:18",
// //       title: "Customer A",
// //       email: "",
// //       country: "",
// //       city: "",
// //     },
// //   ])

// //   const columns = [
// //     {
// //       title: "",
// //       dataIndex: "select",
// //       width: 50,
// //       render: () => <input type="checkbox" />,
// //     },
// //     {
// //       title: "Created time",
// //       dataIndex: "createdTime",
// //       key: "createdTime",
// //       sorter: (a, b) => a.createdTime.localeCompare(b.createdTime),
// //     },
// //     {
// //       title: "Title",
// //       dataIndex: "title",
// //       key: "title",
// //       render: (text, record) => <a onClick={() => handleCustomerClick(record)}>{text}</a>,
// //     },
// //     {
// //       title: "Email",
// //       dataIndex: "email",
// //       key: "email",
// //     },
// //     {
// //       title: "Country",
// //       dataIndex: "country",
// //       key: "country",
// //     },
// //     {
// //       title: "City",
// //       dataIndex: "city",
// //       key: "city",
// //     },
// //     {
// //       title: "",
// //       key: "actions",
// //       render: (_, record) => (
// //         <Space>
// //           <Button type="text" icon={<UserOutlined />} title="Manage users" />
// //           <Button type="text" icon={<AppstoreOutlined />} title="Manage assets" />
// //           <Button type="text" icon={<DashboardOutlined />} title="Manage dashboards" />
// //           <Button type="text" icon={<CloudServerOutlined />} title="Manage edge instances" />
// //           <Button
// //             type="text"
// //             icon={<DeleteOutlined />}
// //             title="Delete customer"
// //             onClick={() => showDeleteConfirm(record)}
// //           />
// //         </Space>
// //       ),
// //     },
// //   ]

// //   const handleCustomerClick = (customer) => {
// //     setSelectedCustomer(customer)
// //     setIsDetailsDrawerVisible(true)
// //   }

// //   const showAddModal = () => {
// //     setIsAddModalVisible(true)
// //   }

// //   const handleAddCancel = () => {
// //     setIsAddModalVisible(false)
// //     form.resetFields()
// //   }

// //   const handleAddSubmit = (values) => {
// //     const newCustomer = {
// //       key: String(customers.length + 1),
// //       createdTime: new Date().toISOString().replace("T", " ").substring(0, 19),
// //       title: values.title,
// //       email: values.email || "",
// //       country: values.country || "",
// //       city: values.city || "",
// //     }

// //     setCustomers([...customers, newCustomer])
// //     setIsAddModalVisible(false)
// //     form.resetFields()
// //   }

// //   const handleDetailsDrawerClose = () => {
// //     setIsDetailsDrawerVisible(false)
// //     setSelectedCustomer(null)
// //   }

// //   const showDeleteConfirm = (customer) => {
// //     Modal.confirm({
// //       title: "Are you sure you want to delete this customer?",
// //       content: `Customer "${customer.title}" will be deleted.`,
// //       okText: "Yes",
// //       okType: "danger",
// //       cancelText: "No",
// //       onOk() {
// //         setCustomers(customers.filter((c) => c.key !== customer.key))
// //       },
// //     })
// //   }

// //   const onSelectChange = (newSelectedRowKeys) => {
// //     setSelectedRowKeys(newSelectedRowKeys)
// //   }

// //   const rowSelection = {
// //     selectedRowKeys,
// //     onChange: onSelectChange,
// //   }

// //   return (
// //     <>
// //       <Card
// //         title={<Title level={4}>Customers</Title>}
// //         extra={
// //           <Space>
// //             <Button icon={<PlusOutlined />} type="primary" onClick={showAddModal}>
// //               Add customer
// //             </Button>
// //             <Button icon={<ReloadOutlined />} />
// //             <Button icon={<SearchOutlined />} />
// //           </Space>
// //         }
// //       >
// //         <Table
// //           rowSelection={rowSelection}
// //           columns={columns}
// //           dataSource={customers}
// //           pagination={{
// //             total: customers.length,
// //             pageSize: 10,
// //             showSizeChanger: true,
// //             showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
// //           }}
// //         />
// //       </Card>

// //       <AddCustomerModal visible={isAddModalVisible} onCancel={handleAddCancel} onAdd={handleAddSubmit} />

// //       <CustomerDetailsDrawer
// //         visible={isDetailsDrawerVisible}
// //         onClose={handleDetailsDrawerClose}
// //         customer={selectedCustomer}
// //       />
// //     </>
// //   )
// // }

// // export default CustomersPage

