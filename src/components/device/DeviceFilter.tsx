import React from "react"
import { Button, Dropdown } from "antd"
import { FilterOutlined } from "@ant-design/icons"

const DeviceFilter = ({ onFilterChange }) => {
  const items = [
    {
      key: "profile",
      label: "Device Profile",
      children: [
        { key: "default", label: "Default" },
        { key: "iotm", label: "IoTM" },
        { key: "valve", label: "Valve" },
        { key: "water-sensor", label: "Water sensor" },
      ],
    },
    {
      key: "state",
      label: "State",
      children: [
        { key: "active", label: "Active" },
        { key: "inactive", label: "Inactive" },
      ],
    },
    {
      key: "gateway",
      label: "Gateway",
      children: [
        { key: "gateway-yes", label: "Yes" },
        { key: "gateway-no", label: "No" },
      ],
    },
  ]

  return (
    <Dropdown
      trigger={["click"]}
      menu={{
        items,
        onClick: ({ key }) => onFilterChange({ key }),
      }}
    >
      <Button icon={<FilterOutlined />}>Device Filter</Button>
    </Dropdown>
  )
}

export default DeviceFilter
