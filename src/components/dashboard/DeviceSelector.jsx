"use client"

import { useState, useEffect } from "react"
import { 
  Form, 
  Select, 
  Input, 
  Button, 
  Checkbox, 
  Radio, 
  Divider, 
  List, 
  Tag, 
  Space, 
  Typography, 
  Empty,
  Alert
} from "antd"
import { 
  SearchOutlined, 
  FilterOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ReloadOutlined,
  SettingOutlined, InfoCircleOutlined
} from "@ant-design/icons"
import { useMediaQuery } from "../../hooks/useMediaQuery"

const { Option } = Select
const { Text } = Typography

const DeviceSelector = ({ 
  devices = [], 
  selectedDevices = [], 
  onDeviceChange, 
  aggregationMode = "none",
  onAggregationChange,
  className,
  style,
}) => {
  const [searchText, setSearchText] = useState("")
  const [deviceProfiles, setDeviceProfiles] = useState([])
  const [selectedProfile, setSelectedProfile] = useState("all")
  const [selectedState, setSelectedState] = useState("all")
  const [filteredDevices, setFilteredDevices] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [deviceGroups, setDeviceGroups] = useState({})
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Extract unique device profiles
  useEffect(() => {
    const profiles = [...new Set(devices.map(device => device.deviceProfile))]
    setDeviceProfiles(profiles)
  }, [devices])

  // Group devices by profile
  useEffect(() => {
    const groups = {}
    devices.forEach((device) => {
      const profile = device.deviceProfile || "Default"
      if (!groups[profile]) {
        groups[profile] = []
      }
      groups[profile].push(device)
    })
    setDeviceGroups(groups)
  }, [devices])

  // Filter devices based on search and filters
  useEffect(() => {
    let filtered = [...devices]
    
    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase()
      filtered = filtered.filter(device => 
        device.name.toLowerCase().includes(searchLower) || 
        device.id.toLowerCase().includes(searchLower)
      )
    }
    
    // Apply profile filter
    if (selectedProfile !== "all") {
      filtered = filtered.filter(device => device.deviceProfile === selectedProfile)
    }
    
    // Apply state filter
    if (selectedState !== "all") {
      filtered = filtered.filter(device => device.state === selectedState)
    }
    
    setFilteredDevices(filtered)
    
    // Update selectAll state based on filtered devices
    if (filtered.length > 0) {
      const allSelected = filtered.every(device => selectedDevices.includes(device.id))
      setSelectAll(allSelected)
    } else {
      setSelectAll(false)
    }
  }, [devices, searchText, selectedProfile, selectedState, selectedDevices])

  const handleDeviceChange = (value) => {
    onDeviceChange(value)
  }

  const handleAggregationChange = (mode) => {
    onAggregationChange(mode)
  }

  const handleDeviceSelect = (deviceId) => {
    let newSelectedDevices
    
    if (selectedDevices.includes(deviceId)) {
      // Remove device if already selected
      newSelectedDevices = selectedDevices.filter(id => id !== deviceId)
    } else {
      // Add device if not selected
      newSelectedDevices = [...selectedDevices, deviceId]
    }
    
    onDeviceChange(newSelectedDevices)
  }

  const handleSelectAll = (e) => {
    const checked = e.target.checked
    setSelectAll(checked)
    
    if (checked) {
      // Select all filtered devices
      const allDeviceIds = filteredDevices.map(device => device.id)
      onDeviceChange(allDeviceIds)
    } else {
      // Deselect all
      onDeviceChange([])
    }
  }

  const handleClearFilters = () => {
    setSearchText("")
    setSelectedProfile("all")
    setSelectedState("all")
  }

  const handleAggregationModeChange = (e) => {
    onAggregationChange(e.target.value)
  }

  const renderDeviceOption = (device) => (
    <Option key={device.id} value={device.id} label={device.name}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Text strong>{device.name}</Text>
          {device.label && (
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {device.label}
            </Tag>
          )}
        </div>
        {/* <Badge status={device.state === "Active" ? "success" : "default"} text={device.state} /> */}
      </div>
    </Option>
  )

  const aggregationOptions = [
    { value: "none", label: "No Aggregation" },
    { value: "mean", label: "Mean (Average)" },
    { value: "median", label: "Median" },
    { value: "min", label: "Minimum" },
    { value: "max", label: "Maximum" },
    { value: "sum", label: "Sum" },
    { value: "count", label: "Count" },
    { value: "last", label: "Last Value" },
  ]

  return (
    <div className={className} style={style}>
      <div className="device-selector">
      <div className="device-selector-header">
        <Input
          placeholder="Search devices..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
          allowClear
        />
        
        <div className="device-filters" style={{ marginTop: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select
              placeholder="Filter by profile"
              value={selectedProfile}
              onChange={setSelectedProfile}
              style={{ width: '100%' }}
            >
              <Option value="all">All Profiles</Option>
              {deviceProfiles.map(profile => (
                <Option key={profile} value={profile}>{profile}</Option>
              ))}
            </Select>
            
            <Select
              placeholder="Filter by state"
              value={selectedState}
              onChange={setSelectedState}
              style={{ width: '100%' }}
            >
              <Option value="all">All States</Option>
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </Space>
          
          {(searchText || selectedProfile !== "all" || selectedState !== "all") && (
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleClearFilters}
              style={{ marginTop: 8 }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>
      
      <Divider orientation="left">Data Aggregation</Divider>
      
      <div className="aggregation-options">
        <Radio.Group onChange={handleAggregationModeChange} value={aggregationMode}>
          <Space direction="vertical">
            <Radio value="none">No Aggregation (Show data per device)</Radio>
            <Radio value="mean">Mean (Average)</Radio>
            <Radio value="median">Median</Radio>
            <Radio value="min">Minimum</Radio>
            <Radio value="max">Maximum</Radio>
            <Radio value="sum">Sum</Radio>
            <Radio value="count">Count</Radio>
            <Radio value="last">Last Value</Radio>
          </Space>
        </Radio.Group>
      </div>
      
      <Divider orientation="left">Devices ({filteredDevices.length})</Divider>
      
      {filteredDevices.length > 0 ? (
        <>
          <div className="select-all-container" style={{ marginBottom: 16 }}>
            <Checkbox checked={selectAll} onChange={handleSelectAll}>
              Select All
            </Checkbox>
            
            {selectedDevices.length > 0 && (
              <Text type="secondary">
                {selectedDevices.length} device(s) selected
              </Text>
            )}
          </div>
          
          <List
            dataSource={filteredDevices}
            renderItem={device => (
              <List.Item
                key={device.id}
                actions={[
                  <Checkbox
                    key={device.id}
                    checked={selectedDevices.includes(device.id)}
                    onChange={() => handleDeviceSelect(device.id)}
                  />
                ]}
              >
                <List.Item.Meta
                  title={device.name}
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">{device.id}</Text>
                      <Space size="small">
                        <Tag color="blue">{device.deviceProfile}</Tag>
                        <Tag color={device.state === "Active" ? "green" : "orange"}>
                          {device.state === "Active" ? (
                            <><CheckCircleOutlined /> Active</>
                          ) : (
                            <><CloseCircleOutlined /> Inactive</>
                          )}
                        </Tag>
                      </Space>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </>
      ) : (
        <Empty 
          description="No devices match your filters" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      )}
      
      {selectedDevices.length === 0 && (
        <Alert
          message="No devices selected"
          description="Please select at least one device to view data."
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </div>
      {/* <Space direction="vertical" style={{ width: "100%" }}>
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}
        >
          <Text strong>Device Selection</Text>
          <Space wrap>
            <Tooltip title="Aggregation Mode">
              <Select
                value={aggregationMode}
                onChange={handleAggregationChange}
                style={{ width: isMobile ? 120 : 150 }}
                size={isMobile ? "small" : "middle"}
                dropdownMatchSelectWidth={false}
              >
                {aggregationOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Tooltip>
            <Tooltip title="Refresh Devices">
              <Button
                icon={<ReloadOutlined />}
                size={isMobile ? "small" : "middle"}
                onClick={() => {
                  // This would typically refresh the device list from the server
                  // For now, we'll just simulate a refresh
                  onDeviceChange(selectedDevices)
                }}
              />
            </Tooltip>
          </Space>
        </div>

        <Select
          mode="multiple"
          style={{ width: "100%" }}
          placeholder="Select devices to display data"
          value={selectedDevices}
          onChange={handleDeviceChange}
          optionFilterProp="label"
          showSearch
          searchValue={searchValue}
          onSearch={setSearchValue}
          filterOption={(input, option) => option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0}
          maxTagCount={isMobile ? 1 : 3}
          maxTagTextLength={15}
          allowClear
          showArrow
          tagRender={(props) => {
            const { label, value, closable, onClose } = props
            const device = devices.find((d) => d.id === value)
            return (
              <Tag
                color={device?.state === "Active" ? "green" : "default"}
                closable={closable}
                onClose={onClose}
                style={{ marginRight: 3 }}
              >
                {label}
              </Tag>
            )
          }}
          dropdownRender={(menu) => (
            <div>
              {menu}
              <Divider style={{ margin: "8px 0" }} />
              <div style={{ display: "flex", flexWrap: "nowrap", padding: "8px" }}>
                <Button
                  type="text"
                  icon={<FilterOutlined />}
                  size="small"
                  onClick={() => {
                    // Select all active devices
                    const activeDevices = devices
                      .filter((device) => device.state === "Active")
                      .map((device) => device.id)
                    onDeviceChange(activeDevices)
                  }}
                >
                  Active Only
                </Button>
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  size="small"
                  onClick={() => {
                    // Select all devices
                    onDeviceChange(devices.map((device) => device.id))
                  }}
                >
                  Select All
                </Button>
              </div>
            </div>
          )}
        >
          {Object.entries(deviceGroups).map(([profile, profileDevices]) => (
            <OptGroup key={profile} label={profile}>
              {profileDevices.map((device) => renderDeviceOption(device))}
            </OptGroup>
          ))}
        </Select>

        {selectedDevices.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <InfoCircleOutlined />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {selectedDevices.length === 1
                ? "Showing data for 1 device"
                : `Showing ${aggregationMode !== "none" ? `${aggregationMode} of ` : ""}data for ${selectedDevices.length} devices`}
            </Text>
          </div>
        )}
      </Space> */}
    </div>
  )
}

export default DeviceSelector
