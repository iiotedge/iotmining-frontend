"use client"

import { useState, useEffect } from "react"
import {
  Modal, Button, Form, Input, Select, Checkbox, Tabs, Typography, Space, Row, Col, message
} from "antd"
import { CopyOutlined, PlusOutlined } from "@ant-design/icons"
import { listDeviceProfiles } from "../../api/deviceProfileApi"
import { mockLabels } from "../../api/mockLabels"
import { mockCustomers } from "../../api/mockCustomers"
import { mockTenants } from "../../api/mockTenants"
import { getTenantType, getTenantId } from "../../utils/tokenUtils"
import { addDevice } from "../../api/deviceApi"

const DEVICE_TYPE_OPTIONS = [
  { value: "CAMERA", label: "Camera" },
  { value: "SENSOR", label: "Sensor" },
  { value: "THERMOSTAT", label: "Thermostat" },
  { value: "ACTUATOR", label: "Actuator" },
]
const CATEGORY_OPTIONS = [
  { value: "SECURITY", label: "Security" },
  { value: "ENVIRONMENT", label: "Environment" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "HVAC", label: "HVAC" },
]
const PROTOCOL_OPTIONS = [
  { value: "MQTT", label: "MQTT" },
  { value: "HTTP", label: "HTTP" },
  { value: "COAP", label: "CoAP" },
]

function generateRandomToken() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let token = ""
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

const AddDeviceModal = ({ visible, onCancel, onAdd, isMobile }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [form] = Form.useForm()
  const [credentialType, setCredentialType] = useState("accessToken")
  const [deviceProfiles, setDeviceProfiles] = useState([])
  const [labels, setLabels] = useState([])
  const [customers, setCustomers] = useState([])
  const [tenantType, setTenantType] = useState(null)
  const [tenants, setTenants] = useState([])
  const [attributes, setAttributes] = useState([
    { key: "manufacturer", value: "" },
    { key: "model", value: "" },
    { key: "firmware", value: "" }
  ])

  useEffect(() => {
    if (!visible) return

    setCurrentStep(1)
    setAttributes([
      { key: "manufacturer", value: "" },
      { key: "model", value: "" },
      { key: "firmware", value: "" }
    ])
    form.resetFields()

    const _tenantType = getTenantType()
    setTenantType(_tenantType)
    if (_tenantType === "ORGANIZATION") {
      setTenants(mockTenants)
      form.setFieldsValue({ tenantId: undefined })
    } else {
      const tenantId = getTenantId()
      form.setFieldsValue({ tenantId })
    }

    listDeviceProfiles().then(data => {
      let arr = []
      if (Array.isArray(data)) arr = data
      else if (data && Array.isArray(data.content)) arr = data.content
      setDeviceProfiles(arr)
    })
    setLabels(mockLabels)
    setCustomers(mockCustomers)
  }, [visible, form])

  const handleAttrChange = (idx, field, val) => {
    const newAttrs = [...attributes]
    newAttrs[idx][field] = val
    setAttributes(newAttrs)
  }
  const addAttr = () => setAttributes([...attributes, { key: "", value: "" }])
  const removeAttr = (idx) => setAttributes(attributes.filter((_, i) => i !== idx))

  const handleNext = () => form.validateFields().then(() => setCurrentStep(2))

  const handleAdd = () => {
    form.validateFields().then(async (values) => {
      const attrObj = {}
      attributes.forEach(attr => {
        if (attr.key) attrObj[attr.key] = attr.value
      })

      const deviceToSave = {
        tenantId: values.tenantId,
        deviceName: values.deviceName,
        category: values.category,
        deviceType: values.deviceType,
        state: "IDLE",
        protocol: values.protocol,
        deviceToken: values.deviceToken || undefined,
        location: values.location,
        attributes: attrObj,
        accessToken: credentialType === "accessToken"
          ? (values.accessToken || generateRandomToken())
          : undefined,
        isPublic: !!values.isPublic,
        deviceProfileId: values.deviceProfileId,
        firmwareId: values.firmwareId,
        softwareId: values.softwareId,
        customerId: values.customerId,
        labelIds: values.labelIds || []
      }

      try {
        const savedDevice = await addDevice(deviceToSave)
        if (onAdd) onAdd(savedDevice) // Only this line, parent will close modal!
      } catch (error) {
        message.error("Failed to create device. " + (error?.response?.data?.message || ""))
      }
    })
  }

  const handleCancel = () => {
    if (onCancel) onCancel()
    setCurrentStep(1)
    setAttributes([
      { key: "manufacturer", value: "" },
      { key: "model", value: "" },
      { key: "firmware", value: "" }
    ])
    form.resetFields()
  }

  return (
    <Modal
      title="Add new device"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>Cancel</Button>,
        currentStep === 1
          ? <Button key="next" type="primary" onClick={handleNext}>Next: Credentials</Button>
          : <Button key="add" type="primary" onClick={handleAdd}>Add</Button>
      ]}
      width={800}
      destroyOnClose
    >
      <Tabs
        activeKey={currentStep.toString()}
        items={[
          {
            key: "1",
            label: (<span><span className="step-number">1</span> Device details</span>),
            disabled: true,
          },
          {
            key: "2",
            label: (<span><span className="step-number">2</span> Credentials</span>),
            disabled: true,
          }
        ]}
      />
      <Form form={form} layout="vertical" className="add-device-form" preserve>
        {currentStep === 1 ? (
          <>
            <Row gutter={16}>
              <Col span={12}>
                {tenantType === "ORGANIZATION" && (
                  <Form.Item
                    name="tenantId"
                    label="Tenant"
                    rules={[{ required: true, message: "Please select tenant" }]}
                  >
                    <Select
                      placeholder="Select tenant"
                      options={tenants.map(t => ({ value: t.id, label: t.name }))}
                      showSearch
                      optionFilterProp="label"
                    />
                  </Form.Item>
                )}
                {tenantType !== "ORGANIZATION" && (
                  <Form.Item name="tenantId" hidden>
                    <Input type="hidden" />
                  </Form.Item>
                )}
                <Form.Item name="deviceName" label="Device Name" rules={[{ required: true, message: "Please input device name!" }]}>
                  <Input placeholder="Enter device name" />
                </Form.Item>
                <Form.Item name="deviceToken" label="Device Token">
                  <Input placeholder="Enter device token (optional)" />
                </Form.Item>
                <Form.Item name="category" label="Category">
                  <Select options={CATEGORY_OPTIONS} allowClear showSearch optionFilterProp="label" placeholder="Select category" />
                </Form.Item>
                <Form.Item name="deviceType" label="Device Type">
                  <Select options={DEVICE_TYPE_OPTIONS} allowClear showSearch optionFilterProp="label" placeholder="Select device type" />
                </Form.Item>
                <Form.Item name="protocol" label="Protocol">
                  <Select options={PROTOCOL_OPTIONS} allowClear placeholder="Select protocol" />
                </Form.Item>
                <Form.Item name="location" label="Location">
                  <Input placeholder="Enter location" />
                </Form.Item>
                <Form.Item name="isGateway" valuePropName="checked" initialValue={false}>
                  <Checkbox>Is gateway</Checkbox>
                </Form.Item>
                <Form.Item name="isPublic" valuePropName="checked" initialValue={false}>
                  <Checkbox>Is public</Checkbox>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="deviceProfileId" label="Device Profile">
                  <Select
                    showSearch
                    placeholder="Select device profile"
                    optionFilterProp="label"
                    options={
                      Array.isArray(deviceProfiles)
                        ? deviceProfiles.map(dp => ({
                            value: dp.id,
                            label: dp.name || dp.label
                          }))
                        : []
                    }
                  />
                </Form.Item>
                <Form.Item name="firmwareId" label="Firmware ID">
                  <Input placeholder="Enter firmware ID" />
                </Form.Item>
                <Form.Item name="softwareId" label="Software ID">
                  <Input placeholder="Enter software ID" />
                </Form.Item>
                <Form.Item name="customerId" label="Assign to Customer">
                  <Select
                    showSearch
                    placeholder="Select customer"
                    options={
                      Array.isArray(customers)
                        ? customers.map(c => ({ value: c.id, label: c.name }))
                        : []
                    }
                  />
                </Form.Item>
                <Form.Item name="labelIds" label="Labels">
                  <Select
                    mode="multiple"
                    showSearch
                    placeholder="Select labels"
                    options={
                      Array.isArray(labels)
                        ? labels.map(l => ({ value: l.id, label: l.name }))
                        : []
                    }
                    allowClear
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Attributes">
              <Row gutter={8}>
                <Col span={24}>
                  {attributes.map((attr, idx) => (
                    <Row gutter={8} key={idx} style={{ marginBottom: 4 }}>
                      <Col span={9}>
                        <Input
                          placeholder="Key"
                          value={attr.key}
                          onChange={e => handleAttrChange(idx, "key", e.target.value)}
                        />
                      </Col>
                      <Col span={9}>
                        <Input
                          placeholder="Value"
                          value={attr.value}
                          onChange={e => handleAttrChange(idx, "value", e.target.value)}
                        />
                      </Col>
                      <Col span={4}>
                        <Button icon="-" onClick={() => removeAttr(idx)} disabled={attributes.length <= 1} />
                      </Col>
                    </Row>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={addAttr} block>
                    Add Attribute
                  </Button>
                </Col>
              </Row>
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} placeholder="Enter description" />
            </Form.Item>
          </>
        ) : (
          <>
            <Typography.Paragraph>
              Device credentials are used to connect devices to the platform.
            </Typography.Paragraph>
            <Form.Item name="credentialType" label="Credential Type">
              <Tabs
                activeKey={credentialType}
                onChange={setCredentialType}
                type="card"
                items={[
                  { key: "accessToken", label: "Access token" },
                  { key: "x509", label: "X.509" },
                  { key: "mqttBasic", label: "MQTT Basic" }
                ]}
              />
            </Form.Item>
            {credentialType === "accessToken" && (
              <Form.Item
                name="accessToken"
                label="Access Token"
                initialValue={generateRandomToken()}
                extra={
                  <Space>
                    <Button
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={() => navigator.clipboard.writeText(form.getFieldValue("accessToken"))}
                    >
                      Copy
                    </Button>
                  </Space>
                }
              >
                <Input.Password />
              </Form.Item>
            )}
            {credentialType === "mqttBasic" && (
              <>
                <Form.Item name="clientId" label="Client ID" rules={[{ required: true, message: "Client ID is required" }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="userName" label="User Name">
                  <Input />
                </Form.Item>
                <Form.Item name="password" label="Password">
                  <Input.Password />
                </Form.Item>
                <Typography.Text type="danger">Client ID and/or User Name are necessary</Typography.Text>
              </>
            )}
            {credentialType === "x509" && (
              <Form.Item>
                <Typography.Paragraph>
                  X.509 Certificate authentication is used to authenticate devices connecting to the platform using TLS/SSL certificates.
                </Typography.Paragraph>
              </Form.Item>
            )}
          </>
        )}
      </Form>
    </Modal>
  )
}

export default AddDeviceModal



// "use client"

// import { useState, useEffect } from "react"
// import {
//   Modal, Button, Form, Input, Select, Checkbox, Tabs, Typography, Space, Row, Col, message
// } from "antd"
// import { CopyOutlined, PlusOutlined } from "@ant-design/icons"
// import DeviceCreationSuccess from "./DeviceCreationSuccess"
// import { listDeviceProfiles } from "../../api/deviceProfileApi"
// import { mockLabels } from "../../api/mockLabels"
// import { mockCustomers } from "../../api/mockCustomers"
// import { mockTenants } from "../../api/mockTenants"
// import { getTenantType, getTenantId } from "../../utils/tokenUtils"
// import { addDevice } from "../../api/deviceApi"

// const DEVICE_TYPE_OPTIONS = [
//   { value: "CAMERA", label: "Camera" },
//   { value: "SENSOR", label: "Sensor" },
//   { value: "THERMOSTAT", label: "Thermostat" },
//   { value: "ACTUATOR", label: "Actuator" },
// ]
// const CATEGORY_OPTIONS = [
//   { value: "SECURITY", label: "Security" },
//   { value: "ENVIRONMENT", label: "Environment" },
//   { value: "ELECTRICAL", label: "Electrical" },
//   { value: "HVAC", label: "HVAC" },
// ]
// const PROTOCOL_OPTIONS = [
//   { value: "MQTT", label: "MQTT" },
//   { value: "HTTP", label: "HTTP" },
//   { value: "COAP", label: "CoAP" },
// ]

// function generateRandomToken() {
//   const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
//   let token = ""
//   for (let i = 0; i < 16; i++) {
//     token += chars.charAt(Math.floor(Math.random() * chars.length))
//   }
//   return token
// }

// const AddDeviceModal = ({ visible, onCancel, onAdd }) => {
//   const [currentStep, setCurrentStep] = useState(1)
//   const [form] = Form.useForm()
//   const [credentialType, setCredentialType] = useState("accessToken")
//   const [showSuccessModal, setShowSuccessModal] = useState(false)
//   const [createdDevice, setCreatedDevice] = useState(null)

//   // Async dropdown data
//   const [deviceProfiles, setDeviceProfiles] = useState([])
//   const [labels, setLabels] = useState([])
//   const [customers, setCustomers] = useState([])

//   // Tenant logic
//   const [tenantType, setTenantType] = useState(null)
//   const [tenants, setTenants] = useState([])

//   // Dynamic attributes state
//   const [attributes, setAttributes] = useState([
//     { key: "manufacturer", value: "" },
//     { key: "model", value: "" },
//     { key: "firmware", value: "" }
//   ])

//   // Prefill logic on modal open
//   useEffect(() => {
//     if (!visible) return

//     // Fetch role/tenant context
//     const _tenantType = getTenantType()
//     setTenantType(_tenantType)

//     // ORG: show tenant dropdown; else: prefill tenantId and hide
//     if (_tenantType === "ORGANIZATION") {
//       setTenants(mockTenants)
//       form.setFieldsValue({ tenantId: undefined })
//     } else {
//       const tenantId = getTenantId()
//       form.setFieldsValue({ tenantId })
//     }

//     listDeviceProfiles().then(data => {
//       let arr = []
//       if (Array.isArray(data)) arr = data
//       else if (data && Array.isArray(data.content)) arr = data.content
//       setDeviceProfiles(arr)
//     })
//     setLabels(mockLabels)
//     setCustomers(mockCustomers)
//   }, [visible, form])

//   // Attribute key-value handlers
//   const handleAttrChange = (idx, field, val) => {
//     const newAttrs = [...attributes]
//     newAttrs[idx][field] = val
//     setAttributes(newAttrs)
//   }
//   const addAttr = () => setAttributes([...attributes, { key: "", value: "" }])
//   const removeAttr = (idx) => {
//     const newAttrs = attributes.filter((_, i) => i !== idx)
//     setAttributes(newAttrs)
//   }

//   // Strict mapping for backend
//   const handleAdd = () => {
//     form.validateFields().then(async (values) => {
//       // Compose attributes as { key: value, ... }
//       const attrObj = {}
//       attributes.forEach(attr => {
//         if (attr.key) attrObj[attr.key] = attr.value
//       })

//       // Build strictly the correct structure for backend
//       const deviceToSave = {
//         tenantId: values.tenantId,
//         deviceName: values.deviceName,
//         category: values.category,
//         deviceType: values.deviceType,
//         state: "IDLE",
//         protocol: values.protocol,
//         deviceToken: values.deviceToken || undefined,
//         location: values.location,
//         attributes: attrObj,
//         accessToken: credentialType === "accessToken"
//           ? (values.accessToken || generateRandomToken())
//           : undefined,
//         isPublic: !!values.isPublic,
//         deviceProfileId: values.deviceProfileId,
//         firmwareId: values.firmwareId,
//         softwareId: values.softwareId,
//         customerId: values.customerId,
//         labelIds: values.labelIds || []
//       }

//       try {
//         const savedDevice = await addDevice(deviceToSave)
//         setCreatedDevice(savedDevice)
//         setShowSuccessModal(true)
//         // onAdd(savedDevice) // ❌ Don't notify parent here! Only after success modal is closed
//         setCurrentStep(1)
//         form.resetFields()
//         setAttributes([
//           { key: "manufacturer", value: "" },
//           { key: "model", value: "" },
//           { key: "firmware", value: "" }
//         ])
//       } catch (error) {
//         message.error("Failed to create device. " + (error?.response?.data?.message || ""))
//       }
//     })
//   }

//   const handleNext = () => form.validateFields().then(() => setCurrentStep(2))

//   const handleCancel = () => {
//     onCancel()
//     setCurrentStep(1)
//     form.resetFields()
//     setAttributes([
//       { key: "manufacturer", value: "" },
//       { key: "model", value: "" },
//       { key: "firmware", value: "" }
//     ])
//   }
  
//   const handleSuccessModalClose = () => {
//     // setShowSuccessModal(false)
//     if (onAdd) onAdd(createdDevice)
//   }


//   return (
//     <>
//       <Modal
//         title="Add new device"
//         open={visible}
//         onCancel={handleCancel}
//         footer={[
//           <Button key="cancel" onClick={handleCancel}>Cancel</Button>,
//           currentStep === 1
//             ? <Button key="next" type="primary" onClick={handleNext}>Next: Credentials</Button>
//             : <Button key="add" type="primary" onClick={handleAdd}>Add</Button>
//         ]}
//         width={800}
//         destroyOnClose
//       >
//         <Tabs
//           activeKey={currentStep.toString()}
//           items={[
//             {
//               key: "1",
//               label: (<span><span className="step-number">1</span> Device details</span>),
//               disabled: true,
//             },
//             {
//               key: "2",
//               label: (<span><span className="step-number">2</span> Credentials</span>),
//               disabled: true,
//             }
//           ]}
//         />
//         <Form form={form} layout="vertical" className="add-device-form" preserve>
//           {/* Step 1: Device Details */}
//           <div style={{ display: currentStep === 1 ? "block" : "none" }}>
//             <Row gutter={16}>
//               <Col span={12}>
//                 {/* Tenant ID: Dropdown for ORG, hidden for others */}
//                 {tenantType === "ORGANIZATION" && (
//                   <Form.Item
//                     name="tenantId"
//                     label="Tenant"
//                     rules={[{ required: true, message: "Please select tenant" }]}
//                   >
//                     <Select
//                       placeholder="Select tenant"
//                       options={tenants.map(t => ({ value: t.id, label: t.name }))}
//                       showSearch
//                       optionFilterProp="label"
//                     />
//                   </Form.Item>
//                 )}
//                 {tenantType !== "ORGANIZATION" && (
//                   <Form.Item name="tenantId" hidden>
//                     <Input type="hidden" />
//                   </Form.Item>
//                 )}
//                 <Form.Item name="deviceName" label="Device Name" rules={[{ required: true, message: "Please input device name!" }]}>
//                   <Input placeholder="Enter device name" />
//                 </Form.Item>
//                 <Form.Item name="deviceToken" label="Device Token">
//                   <Input placeholder="Enter device token (optional)" />
//                 </Form.Item>
//                 <Form.Item name="category" label="Category">
//                   <Select options={CATEGORY_OPTIONS} allowClear showSearch optionFilterProp="label" placeholder="Select category" />
//                 </Form.Item>
//                 <Form.Item name="deviceType" label="Device Type">
//                   <Select options={DEVICE_TYPE_OPTIONS} allowClear showSearch optionFilterProp="label" placeholder="Select device type" />
//                 </Form.Item>
//                 <Form.Item name="protocol" label="Protocol">
//                   <Select options={PROTOCOL_OPTIONS} allowClear placeholder="Select protocol" />
//                 </Form.Item>
//                 <Form.Item name="location" label="Location">
//                   <Input placeholder="Enter location" />
//                 </Form.Item>
//                 <Form.Item name="isGateway" valuePropName="checked" initialValue={false}>
//                   <Checkbox>Is gateway</Checkbox>
//                 </Form.Item>
//                 <Form.Item name="isPublic" valuePropName="checked" initialValue={false}>
//                   <Checkbox>Is public</Checkbox>
//                 </Form.Item>
//               </Col>
//               <Col span={12}>
//                 <Form.Item name="deviceProfileId" label="Device Profile">
//                   <Select
//                     showSearch
//                     placeholder="Select device profile"
//                     optionFilterProp="label"
//                     options={
//                       Array.isArray(deviceProfiles)
//                         ? deviceProfiles.map(dp => ({
//                             value: dp.id,
//                             label: dp.name || dp.label
//                           }))
//                         : []
//                     }
//                   />
//                 </Form.Item>
//                 <Form.Item name="firmwareId" label="Firmware ID">
//                   <Input placeholder="Enter firmware ID" />
//                 </Form.Item>
//                 <Form.Item name="softwareId" label="Software ID">
//                   <Input placeholder="Enter software ID" />
//                 </Form.Item>
//                 <Form.Item name="customerId" label="Assign to Customer">
//                   <Select
//                     showSearch
//                     placeholder="Select customer"
//                     options={
//                       Array.isArray(customers)
//                         ? customers.map(c => ({ value: c.id, label: c.name }))
//                         : []
//                     }
//                   />
//                 </Form.Item>
//                 <Form.Item name="labelIds" label="Labels">
//                   <Select
//                     mode="multiple"
//                     showSearch
//                     placeholder="Select labels"
//                     options={
//                       Array.isArray(labels)
//                         ? labels.map(l => ({ value: l.id, label: l.name }))
//                         : []
//                     }
//                     allowClear
//                   />
//                 </Form.Item>
//               </Col>
//             </Row>
//             {/* Dynamic attributes */}
//             <Form.Item label="Attributes">
//               <Row gutter={8}>
//                 <Col span={24}>
//                   {attributes.map((attr, idx) => (
//                     <Row gutter={8} key={idx} style={{ marginBottom: 4 }}>
//                       <Col span={9}>
//                         <Input
//                           placeholder="Key"
//                           value={attr.key}
//                           onChange={e => handleAttrChange(idx, "key", e.target.value)}
//                         />
//                       </Col>
//                       <Col span={9}>
//                         <Input
//                           placeholder="Value"
//                           value={attr.value}
//                           onChange={e => handleAttrChange(idx, "value", e.target.value)}
//                         />
//                       </Col>
//                       <Col span={4}>
//                         <Button icon="-" onClick={() => removeAttr(idx)} disabled={attributes.length <= 1} />
//                       </Col>
//                     </Row>
//                   ))}
//                   <Button type="dashed" icon={<PlusOutlined />} onClick={addAttr} block>
//                     Add Attribute
//                   </Button>
//                 </Col>
//               </Row>
//             </Form.Item>
//             <Form.Item name="description" label="Description">
//               <Input.TextArea rows={3} placeholder="Enter description" />
//             </Form.Item>
//           </div>
//           {/* Step 2: Credentials */}
//           <div style={{ display: currentStep === 2 ? "block" : "none" }}>
//             <Typography.Paragraph>
//               Device credentials are used to connect devices to the platform.
//             </Typography.Paragraph>
//             <Form.Item name="credentialType" label="Credential Type">
//               <Tabs
//                 activeKey={credentialType}
//                 onChange={setCredentialType}
//                 type="card"
//                 items={[
//                   { key: "accessToken", label: "Access token" },
//                   { key: "x509", label: "X.509" },
//                   { key: "mqttBasic", label: "MQTT Basic" }
//                 ]}
//               />
//             </Form.Item>
//             {credentialType === "accessToken" && (
//               <Form.Item
//                 name="accessToken"
//                 label="Access Token"
//                 initialValue={generateRandomToken()}
//                 extra={
//                   <Space>
//                     <Button
//                       type="text"
//                       icon={<CopyOutlined />}
//                       onClick={() => navigator.clipboard.writeText(form.getFieldValue("accessToken"))}
//                     >
//                       Copy
//                     </Button>
//                   </Space>
//                 }
//               >
//                 <Input.Password />
//               </Form.Item>
//             )}
//             {credentialType === "mqttBasic" && (
//               <>
//                 <Form.Item name="clientId" label="Client ID" rules={[{ required: true, message: "Client ID is required" }]}>
//                   <Input />
//                 </Form.Item>
//                 <Form.Item name="userName" label="User Name">
//                   <Input />
//                 </Form.Item>
//                 <Form.Item name="password" label="Password">
//                   <Input.Password />
//                 </Form.Item>
//                 <Typography.Text type="danger">Client ID and/or User Name are necessary</Typography.Text>
//               </>
//             )}
//             {credentialType === "x509" && (
//               <Form.Item>
//                 <Typography.Paragraph>
//                   X.509 Certificate authentication is used to authenticate devices connecting to the platform using TLS/SSL certificates.
//                 </Typography.Paragraph>
//               </Form.Item>
//             )}
//           </div>
//         </Form>
//       </Modal>
//       <DeviceCreationSuccess visible={showSuccessModal} onClose={handleSuccessModalClose} device={createdDevice} />
//     </>
//   )
// }

// export default AddDeviceModal







// // "use client"

// // import { useState } from "react"
// // import { Modal, Button, Form, Input, Select, Checkbox, Tabs, Typography, Space } from "antd"
// // import { CopyOutlined } from "@ant-design/icons"
// // import DeviceCreationSuccess from "./DeviceCreationSuccess"

// // const AddDeviceModal = ({ visible, onCancel, onAdd }) => {
// //   const [currentStep, setCurrentStep] = useState(1)
// //   const [form] = Form.useForm()
// //   const [credentialType, setCredentialType] = useState("accessToken")
// //   const [showSuccessModal, setShowSuccessModal] = useState(false)
// //   const [createdDevice, setCreatedDevice] = useState(null)

// //   const handleNext = () => {
// //     form.validateFields().then(() => {
// //       setCurrentStep(2)
// //     })
// //   }

// //   const handleAdd = () => {
// //     form.validateFields().then((values) => {
// //       // Create the device
// //       const newDevice = {
// //         ...values,
// //         createdTime: new Date().toISOString(),
// //         state: "Inactive",
// //         key: Date.now().toString(),
// //       }

// //       setCreatedDevice(newDevice)
// //       setShowSuccessModal(true)
// //       onAdd(newDevice)

// //       // Reset form for next time
// //       setCurrentStep(1)
// //       form.resetFields()
// //     })
// //   }

// //   const handleCancel = () => {
// //     onCancel()
// //     setCurrentStep(1)
// //     form.resetFields()
// //   }

// //   const handleSuccessModalClose = () => {
// //     setShowSuccessModal(false)
// //   }

// //   const generateRandomToken = () => {
// //     const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
// //     let token = ""
// //     for (let i = 0; i < 16; i++) {
// //       token += chars.charAt(Math.floor(Math.random() * chars.length))
// //     }
// //     return token
// //   }

// //   return (
// //     <>
// //       <Modal
// //         title="Add new device"
// //         open={visible}
// //         onCancel={handleCancel}
// //         footer={[
// //           <Button key="cancel" onClick={handleCancel}>
// //             Cancel
// //           </Button>,
// //           currentStep === 1 ? (
// //             <Button key="next" type="primary" onClick={handleNext}>
// //               Next: Credentials
// //             </Button>
// //           ) : (
// //             <Button key="add" type="primary" onClick={handleAdd}>
// //               Add
// //             </Button>
// //           ),
// //         ]}
// //         width={700}
// //       >
// //         <Tabs
// //           activeKey={currentStep.toString()}
// //           items={[
// //             {
// //               key: "1",
// //               label: (
// //                 <span>
// //                   <span className="step-number">1</span> Device details
// //                 </span>
// //               ),
// //               disabled: true,
// //             },
// //             {
// //               key: "2",
// //               label: (
// //                 <span>
// //                   <span className="step-number">2</span> Credentials
// //                 </span>
// //               ),
// //               disabled: true,
// //             },
// //           ]}
// //         />

// //         <Form form={form} layout="vertical" className="add-device-form">
// //           {currentStep === 1 ? (
// //             <>
// //               <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please input device name!" }]}>
// //                 <Input placeholder="Enter device name" />
// //               </Form.Item>
// //               <Form.Item name="label" label="Label">
// //                 <Input placeholder="Enter label" />
// //               </Form.Item>
// //               <Form.Item name="deviceProfile" label="Device profile">
// //                 <Select defaultValue="default">
// //                   <Select.Option value="default">default</Select.Option>
// //                   <Select.Option value="iotm">IoTM</Select.Option>
// //                   <Select.Option value="valve">Valve</Select.Option>
// //                   <Select.Option value="water-sensor">Water sensor</Select.Option>
// //                 </Select>
// //               </Form.Item>
// //               <Form.Item name="isGateway" valuePropName="checked">
// //                 <Checkbox>Is gateway</Checkbox>
// //               </Form.Item>
// //               <Form.Item name="customer" label="Assign to customer">
// //                 <Select placeholder="Select customer">
// //                   <Select.Option value="customer1">Customer 1</Select.Option>
// //                   <Select.Option value="customer2">Customer 2</Select.Option>
// //                 </Select>
// //               </Form.Item>
// //               <Form.Item name="description" label="Description">
// //                 <Input.TextArea rows={4} placeholder="Enter description" />
// //               </Form.Item>
// //             </>
// //           ) : (
// //             <>
// //               <Typography.Paragraph>
// //                 Device credentials are used to connect devices to ThingsBoard.
// //               </Typography.Paragraph>

// //               <Form.Item name="credentialType" label="Credential type">
// //                 <Tabs
// //                   activeKey={credentialType}
// //                   onChange={setCredentialType}
// //                   type="card"
// //                   items={[
// //                     {
// //                       key: "accessToken",
// //                       label: "Access token",
// //                     },
// //                     {
// //                       key: "x509",
// //                       label: "X.509",
// //                     },
// //                     {
// //                       key: "mqttBasic",
// //                       label: "MQTT Basic",
// //                     },
// //                   ]}
// //                 />
// //               </Form.Item>

// //               {credentialType === "accessToken" && (
// //                 <Form.Item
// //                   name="accessToken"
// //                   label="Access token"
// //                   initialValue={generateRandomToken()}
// //                   extra={
// //                     <Space>
// //                       <Button
// //                         type="text"
// //                         icon={<CopyOutlined />}
// //                         onClick={() => navigator.clipboard.writeText(form.getFieldValue("accessToken"))}
// //                       >
// //                         Copy
// //                       </Button>
// //                     </Space>
// //                   }
// //                 >
// //                   <Input.Password />
// //                 </Form.Item>
// //               )}

// //               {credentialType === "mqttBasic" && (
// //                 <>
// //                   <Form.Item
// //                     name="clientId"
// //                     label="Client ID"
// //                     rules={[{ required: true, message: "Client ID is required" }]}
// //                   >
// //                     <Input />
// //                   </Form.Item>
// //                   <Form.Item name="userName" label="User Name">
// //                     <Input />
// //                   </Form.Item>
// //                   <Form.Item name="password" label="Password">
// //                     <Input.Password />
// //                   </Form.Item>
// //                   <Typography.Text type="danger">Client ID and/or User Name are necessary</Typography.Text>
// //                 </>
// //               )}

// //               {credentialType === "x509" && (
// //                 <Form.Item>
// //                   <Typography.Paragraph>
// //                     X.509 Certificate authentication is used to authenticate devices connecting to ThingsBoard using
// //                     TLS/SSL certificates.
// //                   </Typography.Paragraph>
// //                 </Form.Item>
// //               )}
// //             </>
// //           )}
// //         </Form>
// //       </Modal>

// //       <DeviceCreationSuccess visible={showSuccessModal} onClose={handleSuccessModalClose} device={createdDevice} />
// //     </>
// //   )
// // }

// // export default AddDeviceModal
