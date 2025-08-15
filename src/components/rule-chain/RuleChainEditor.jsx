"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  MarkerType,
  Handle,
} from "reactflow"
import "reactflow/dist/style.css"
import {
  Input,
  Button,
  Typography,
  Space,
  Modal,
  Form,
  Checkbox,
  Collapse,
  Upload,
  message,
  Tooltip,
  Dropdown,
  theme,
} from "antd"
import {
  SearchOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
  CloseOutlined,
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  DownloadOutlined,
  UploadOutlined,
  DeleteOutlined,
  CopyOutlined,
} from "@ant-design/icons"
import { useParams } from "react-router-dom"
import EdgeLabelModal from "./EdgeLabelModal"

const { Panel: CollapsePanel } = Collapse
const { Dragger } = Upload
const { useToken } = theme

// Node colors based on type
const getNodeColors = (isDarkMode) => ({
  input: isDarkMode ? "#0f2337" : "#e6f7ff",
  filter: isDarkMode ? "#2b2111" : "#fff7e6",
  switch: isDarkMode ? "#2b2111" : "#fff7e6",
  transformation: isDarkMode ? "#162312" : "#f6ffed",
  action: isDarkMode ? "#2a1215" : "#fff1f0",
  external: isDarkMode ? "#120338" : "#f9f0ff",
})

// Node border colors
const getNodeBorderColors = (isDarkMode) => ({
  input: isDarkMode ? "#177ddc" : "#91d5ff",
  filter: isDarkMode ? "#d89614" : "#ffd591",
  switch: isDarkMode ? "#d89614" : "#ffd591",
  transformation: isDarkMode ? "#49aa19" : "#b7eb8f",
  action: isDarkMode ? "#d32029" : "#ffa39e",
  external: isDarkMode ? "#642ab5" : "#d3adf7",
})

// Custom Node Component
const CustomNode = ({ data, id, selected }) => {
  const { token } = useToken()
  const isDarkMode = token.colorBgContainer === "#141414" || token.colorBgContainer === "#1f1f1f"

  const nodeColors = getNodeColors(isDarkMode)
  const nodeBorderColors = getNodeBorderColors(isDarkMode)

  const bgColor = nodeColors[data.category] || (isDarkMode ? "#141414" : "#f0f0f0")
  const borderColor = nodeBorderColors[data.category] || (isDarkMode ? "#303030" : "#d9d9d9")

  return (
    <div
      className={`custom-node ${selected ? "selected" : ""}`}
      style={{
        backgroundColor: bgColor,
        borderColor: selected ? token.colorPrimary : borderColor,
        boxShadow: selected ? `0 0 0 2px ${token.colorPrimaryBg}` : "none",
        color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.85)",
      }}
    >
      {/* Input handle at the top */}
      <Handle type="target" position="top" style={{ background: "#555", width: 10, height: 10 }} isConnectable={true} />

      <div className="custom-node-header" style={{ borderBottom: `1px solid ${borderColor}` }}>
        {data.icon && <span className="node-icon">{data.icon}</span>}
        <span className="node-type">{data.type}</span>
      </div>
      <div className="custom-node-content">{data.label}</div>

      {/* Output handles at the bottom */}
      <Handle
        type="source"
        position="bottom"
        id="success"
        style={{ background: "#52c41a", left: "30%", width: 10, height: 10 }}
        isConnectable={true}
      />
      <Handle
        type="source"
        position="bottom"
        id="failure"
        style={{ background: "#f5222d", left: "70%", width: 10, height: 10 }}
        isConnectable={true}
      />
    </div>
  )
}

// Node types mapping
const nodeTypes = {
  customNode: CustomNode,
}

const RuleChainEditor = () => {
  const { id } = useParams()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [nodeConfigVisible, setNodeConfigVisible] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [form] = Form.useForm()
  const reactFlowWrapper = useRef(null)
  const [reactFlowInstance, setReactFlowInstance] = useState(null)
  const [isImportModalVisible, setIsImportModalVisible] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [connectionType, setConnectionType] = useState("success")
  const [selectedEdge, setSelectedEdge] = useState(null)
  const [isEdgeLabelModalVisible, setIsEdgeLabelModalVisible] = useState(false)
  const { token } = useToken()
  const isDarkMode = token.colorBgContainer === "#141414" || token.colorBgContainer === "#1f1f1f"

  // Initial nodes for demo
  useEffect(() => {
    if (id === "root") {
      // Root rule chain has some initial nodes
      const initialNodes = [
        {
          id: "input-1",
          type: "customNode",
          position: { x: 100, y: 100 },
          data: {
            label: "Input",
            type: "Input",
            category: "input",
            icon: "📥",
          },
        },
        {
          id: "switch-1",
          type: "customNode",
          position: { x: 300, y: 250 },
          data: {
            label: "Message Type Switch",
            type: "message type switch",
            category: "switch",
            icon: "🔀",
          },
        },
        {
          id: "action-1",
          type: "customNode",
          position: { x: 500, y: 400 },
          data: {
            label: "Save Timeseries",
            type: "save timeseries",
            category: "action",
            icon: "💾",
          },
        },
      ]

      const initialEdges = [
        {
          id: "e1-2",
          source: "input-1",
          target: "switch-1",
          sourceHandle: "success",
          animated: true,
          label: "Success",
          labelBgStyle: { fill: isDarkMode ? "#162312" : "#f6ffed" },
          labelStyle: { fill: "#52c41a" },
          style: { stroke: "#52c41a" },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#52c41a",
          },
        },
        {
          id: "e2-3",
          source: "switch-1",
          target: "action-1",
          sourceHandle: "success",
          animated: true,
          label: "Post telemetry",
          labelBgStyle: { fill: isDarkMode ? "#162312" : "#f6ffed" },
          labelStyle: { fill: "#52c41a" },
          style: { stroke: "#52c41a" },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#52c41a",
          },
        },
      ]

      setNodes(initialNodes)
      setEdges(initialEdges)
    }
  }, [id, setNodes, setEdges, isDarkMode])

  const onConnect = useCallback(
    (params) => {
      // Determine connection type (success or failure)
      const isSuccess = params.sourceHandle === "success"

      // Create a new edge with appropriate styling
      const newEdge = {
        ...params,
        animated: true,
        label: isSuccess ? "Success" : "Failure",
        labelBgStyle: { fill: isSuccess ? (isDarkMode ? "#162312" : "#f6ffed") : isDarkMode ? "#2a1215" : "#fff1f0" },
        labelStyle: { fill: isSuccess ? "#52c41a" : "#f5222d" },
        style: { stroke: isSuccess ? "#52c41a" : "#f5222d" },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isSuccess ? "#52c41a" : "#f5222d",
        },
      }

      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges, isDarkMode],
  )

  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event) => {
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const type = event.dataTransfer.getData("application/reactflow/type")
      const nodeCategory = event.dataTransfer.getData("application/reactflow/category")
      const nodeLabel = event.dataTransfer.getData("application/reactflow/label")
      const nodeIcon = event.dataTransfer.getData("application/reactflow/icon")

      if (!type || !reactFlowInstance) {
        return
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNode = {
        id: `${type.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
        type: "customNode",
        position,
        data: {
          label: nodeLabel,
          type: type,
          category: nodeCategory,
          icon: nodeIcon,
        },
      }

      setNodes((nds) => nds.concat(newNode))

      // Open the node configuration modal for the new node
      setSelectedNode(newNode)
      setNodeConfigVisible(true)
    },
    [reactFlowInstance, setNodes],
  )

  const onNodeClick = (event, node) => {
    setSelectedNode(node)
    setNodeConfigVisible(true)

    // Pre-fill the form with node data
    form.setFieldsValue({
      name: node.data.label,
      description: node.data.description || "",
    })
  }

  const onEdgeClick = (event, edge) => {
    setSelectedEdge(edge)
    setIsEdgeLabelModalVisible(true)
  }

  const handleEdgeLabelUpdate = (values) => {
    setEdges(
      edges.map((edge) => {
        if (edge.id === selectedEdge.id) {
          return {
            ...edge,
            label: values.label,
            sourceHandle: values.type,
            labelBgStyle: {
              fill:
                values.type === "success" ? (isDarkMode ? "#162312" : "#f6ffed") : isDarkMode ? "#2a1215" : "#fff1f0",
            },
            labelStyle: { fill: values.type === "success" ? "#52c41a" : "#f5222d" },
            style: { stroke: values.type === "success" ? "#52c41a" : "#f5222d" },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: values.type === "success" ? "#52c41a" : "#f5222d",
            },
          }
        }
        return edge
      }),
    )

    setIsEdgeLabelModalVisible(false)
    setSelectedEdge(null)
  }

  const onDragStart = (event, nodeType, nodeCategory, nodeLabel, nodeIcon) => {
    event.dataTransfer.setData("application/reactflow/type", nodeType)
    event.dataTransfer.setData("application/reactflow/category", nodeCategory)
    event.dataTransfer.setData("application/reactflow/label", nodeLabel)
    event.dataTransfer.setData("application/reactflow/icon", nodeIcon)
    event.dataTransfer.effectAllowed = "move"
  }

  const handleNodeConfigSubmit = () => {
    form.validateFields().then((values) => {
      // Update the node with new values
      setNodes(
        nodes.map((node) => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                label: values.name,
                description: values.description,
                // Add any other configuration values here
              },
            }
          }
          return node
        }),
      )

      setNodeConfigVisible(false)
    })
  }

  const handleNodeConfigCancel = () => {
    setNodeConfigVisible(false)
  }

  const filteredNodes = (category) => {
    const nodesByCategory = {
      filter: [
        { type: "alarm status filter", icon: "🔔" },
        { type: "asset profile switch", icon: "🔀" },
        { type: "check fields presence", icon: "✓" },
        { type: "check relation presence", icon: "🔗" },
        { type: "device profile switch", icon: "🔀" },
        { type: "entity type filter", icon: "🔍" },
        { type: "entity type switch", icon: "🔀" },
        { type: "gps geofencing filter", icon: "🌍" },
        { type: "message type filter", icon: "📨" },
        { type: "message type switch", icon: "🔀" },
        { type: "script", icon: "📜" },
        { type: "switch", icon: "🔀" },
      ],
      enrichment: [
        { type: "customer attributes", icon: "👥" },
        { type: "device attributes", icon: "📱" },
        { type: "related attributes", icon: "🔗" },
        { type: "tenant attributes", icon: "🏢" },
      ],
      transformation: [
        { type: "change originator", icon: "🔄" },
        { type: "script transformation", icon: "📜" },
        { type: "to email", icon: "📧" },
      ],
      action: [
        { type: "create alarm", icon: "🚨" },
        { type: "clear alarm", icon: "✓" },
        { type: "delay", icon: "⏱️" },
        { type: "log", icon: "📝" },
        { type: "rpc call request", icon: "📞" },
        { type: "save attributes", icon: "💾" },
        { type: "save timeseries", icon: "📊" },
      ],
    }

    const nodes = nodesByCategory[category] || []

    if (!searchTerm) return nodes

    return nodes.filter((node) => node.type.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  // Export rule chain as JSON
  const exportRuleChain = () => {
    if (!nodes.length) {
      message.warning("No rule chain to export")
      return
    }

    // Create the rule chain object
    const ruleChain = {
      name: id || "Rule Chain",
      firstRuleNodeId: nodes[0]?.id || null,
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        name: node.data.label,
        configuration: {
          description: node.data.description || "",
          // Add other configuration properties here
        },
        position: node.position,
        category: node.data.category,
        icon: node.data.icon,
      })),
      connections: edges.map((edge) => ({
        fromId: edge.source,
        toId: edge.target,
        type: edge.sourceHandle || "success",
        label: edge.label || "",
      })),
      createdTime: new Date().toISOString(),
      additionalInfo: {
        description: "",
      },
    }

    // Convert to JSON and download
    const dataStr = JSON.stringify(ruleChain, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `${id || "rule-chain"}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  // Show import modal
  const showImportModal = () => {
    setIsImportModalVisible(true)
  }

  // Handle import file change
  const handleImportFileChange = (info) => {
    const { status, originFileObj } = info.file
    if (status !== "uploading") {
      setImportFile(originFileObj)
    }
    if (status === "done") {
      message.success(`${info.file.name} file uploaded successfully.`)
    } else if (status === "error") {
      message.error(`${info.file.name} file upload failed.`)
    }
  }

  // Import rule chain from JSON
  const importRuleChain = () => {
    if (!importFile) {
      message.warning("Please select a file to import")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const ruleChain = JSON.parse(e.target.result)

        // Convert imported data to nodes and edges
        const importedNodes = ruleChain.nodes.map((node) => ({
          id: node.id,
          type: "customNode",
          position: node.position,
          data: {
            label: node.name,
            type: node.type,
            category: node.category,
            icon: node.icon,
            description: node.configuration?.description || "",
          },
        }))

        const importedEdges = ruleChain.connections.map((conn, index) => ({
          id: `e${index}`,
          source: conn.fromId,
          target: conn.toId,
          sourceHandle: conn.type,
          animated: true,
          label: conn.label,
          labelBgStyle: {
            fill: conn.type === "success" ? (isDarkMode ? "#162312" : "#f6ffed") : isDarkMode ? "#2a1215" : "#fff1f0",
          },
          labelStyle: { fill: conn.type === "success" ? "#52c41a" : "#f5222d" },
          style: { stroke: conn.type === "success" ? "#52c41a" : "#f5222d" },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: conn.type === "success" ? "#52c41a" : "#f5222d",
          },
        }))

        // Update the rule chain editor
        setNodes(importedNodes)
        setEdges(importedEdges)

        message.success("Rule chain imported successfully")
        setIsImportModalVisible(false)

        // Fit the view to show all nodes
        if (reactFlowInstance) {
          setTimeout(() => {
            reactFlowInstance.fitView({ padding: 0.2 })
          }, 100)
        }
      } catch (error) {
        console.error("Error importing rule chain:", error)
        message.error("Failed to import rule chain. Invalid file format.")
      }
    }
    reader.readAsText(importFile)
  }

  // Delete selected node
  const deleteSelectedNode = () => {
    if (!selectedNode) return

    // Remove the node
    setNodes(nodes.filter((node) => node.id !== selectedNode.id))

    // Remove any connected edges
    setEdges(edges.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id))

    setSelectedNode(null)
    setNodeConfigVisible(false)
  }

  // Duplicate selected node
  const duplicateSelectedNode = () => {
    if (!selectedNode) return

    const newNode = {
      ...selectedNode,
      id: `${selectedNode.data.type.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      position: {
        x: selectedNode.position.x + 50,
        y: selectedNode.position.y + 50,
      },
    }

    setNodes(nodes.concat(newNode))
  }

  // Connection type menu for edge creation
  const connectionTypeMenu = {
    items: [
      {
        key: "success",
        label: "Success",
        icon: <span style={{ color: "#52c41a" }}>✓</span>,
      },
      {
        key: "failure",
        label: "Failure",
        icon: <span style={{ color: "#f5222d" }}>✗</span>,
      },
    ],
    onClick: ({ key }) => setConnectionType(key),
  }

  return (
    <div className="rule-chain-editor">
      <div
        className="rule-chain-sidebar"
        style={{ backgroundColor: token.colorBgContainer, borderRight: `1px solid ${token.colorBorderSecondary}` }}
      >
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search nodes"
          className="search-nodes"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <Collapse defaultActiveKey={["filter"]} className="nodes-collapse">
          <CollapsePanel key="filter" header="Filter" forceRender>
            <div className="node-list">
              {filteredNodes("filter").map((node) => (
                <div
                  key={node.type}
                  className="draggable-node"
                  draggable
                  onDragStart={(e) => onDragStart(e, node.type, "filter", node.type, node.icon)}
                  style={{ backgroundColor: isDarkMode ? "#2b2111" : "#fff7e6" }}
                >
                  <span className="node-icon">{node.icon}</span>
                  <span className="node-label">{node.type}</span>
                </div>
              ))}
            </div>
          </CollapsePanel>

          <CollapsePanel key="enrichment" header="Enrichment" forceRender>
            <div className="node-list">
              {filteredNodes("enrichment").map((node) => (
                <div
                  key={node.type}
                  className="draggable-node"
                  draggable
                  onDragStart={(e) => onDragStart(e, node.type, "transformation", node.type, node.icon)}
                  style={{ backgroundColor: isDarkMode ? "#162312" : "#f6ffed" }}
                >
                  <span className="node-icon">{node.icon}</span>
                  <span className="node-label">{node.type}</span>
                </div>
              ))}
            </div>
          </CollapsePanel>

          <CollapsePanel key="transformation" header="Transformation" forceRender>
            <div className="node-list">
              {filteredNodes("transformation").map((node) => (
                <div
                  key={node.type}
                  className="draggable-node"
                  draggable
                  onDragStart={(e) => onDragStart(e, node.type, "transformation", node.type, node.icon)}
                  style={{ backgroundColor: isDarkMode ? "#162312" : "#f6ffed" }}
                >
                  <span className="node-icon">{node.icon}</span>
                  <span className="node-label">{node.type}</span>
                </div>
              ))}
            </div>
          </CollapsePanel>

          <CollapsePanel key="action" header="Action" forceRender>
            <div className="node-list">
              {filteredNodes("action").map((node) => (
                <div
                  key={node.type}
                  className="draggable-node"
                  draggable
                  onDragStart={(e) => onDragStart(e, node.type, "action", node.type, node.icon)}
                  style={{ backgroundColor: isDarkMode ? "#2a1215" : "#fff1f0" }}
                >
                  <span className="node-icon">{node.icon}</span>
                  <span className="node-label">{node.type}</span>
                </div>
              ))}
            </div>
          </CollapsePanel>
        </Collapse>
      </div>

      <div className="rule-chain-content">
        <div
          className="rule-chain-header"
          style={{ backgroundColor: token.colorBgContainer, borderBottom: `1px solid ${token.colorBorderSecondary}` }}
        >
          <Typography.Title level={4}>{id === "root" ? "Root Rule Chain" : id}</Typography.Title>
          <Space>
            <Tooltip title="Import Rule Chain">
              <Button icon={<UploadOutlined />} onClick={showImportModal} />
            </Tooltip>
            <Tooltip title="Export Rule Chain">
              <Button icon={<DownloadOutlined />} onClick={exportRuleChain} />
            </Tooltip>
            <Button icon={<SaveOutlined />}>Save</Button>
            <Button icon={<UndoOutlined />} />
            <Button icon={<RedoOutlined />} />
            <Button icon={<ZoomInOutlined />} onClick={() => reactFlowInstance?.zoomIn()} />
            <Button icon={<ZoomOutOutlined />} onClick={() => reactFlowInstance?.zoomOut()} />
            <Button icon={<FullscreenOutlined />} onClick={() => reactFlowInstance?.fitView()} />
          </Space>
        </div>

        <div
          className="rule-chain-canvas"
          ref={reactFlowWrapper}
          style={{ backgroundColor: isDarkMode ? "#000000" : "#f0f2f5" }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            deleteKeyCode="Delete"
            multiSelectionKeyCode="Control"
            selectionKeyCode="Shift"
            connectionLineStyle={{ stroke: connectionType === "success" ? "#52c41a" : "#f5222d" }}
            connectionLineType="smoothstep"
            onEdgeClick={onEdgeClick}
          >
            <Controls />
            <MiniMap
              nodeStrokeColor={(n) => {
                const nodeBorderColors = getNodeBorderColors(isDarkMode)
                return n.selected
                  ? token.colorPrimary
                  : nodeBorderColors[n.data?.category] || (isDarkMode ? "#303030" : "#eee")
              }}
              nodeColor={(n) => {
                const nodeColors = getNodeColors(isDarkMode)
                return nodeColors[n.data?.category] || (isDarkMode ? "#141414" : "#fff")
              }}
              maskColor={isDarkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(240, 242, 245, 0.7)"}
            />
            <Background
              variant="dots"
              gap={12}
              size={1}
              color={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
            />

            <Panel position="top-right">
              <Space>
                <Dropdown menu={connectionTypeMenu} trigger={["click"]}>
                  <Button>
                    Connection: {connectionType === "success" ? "Success" : "Failure"}
                    <span style={{ marginLeft: 8, color: connectionType === "success" ? "#52c41a" : "#f5222d" }}>
                      {connectionType === "success" ? "✓" : "✗"}
                    </span>
                  </Button>
                </Dropdown>
                <Button icon={<ReloadOutlined />} onClick={() => reactFlowInstance?.fitView()} />
              </Space>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Node Configuration Modal */}
      <Modal
        title={
          <div className="node-config-header">
            <span>Configure rule node: {selectedNode?.data?.type}</span>
            <Button type="text" icon={<QuestionCircleOutlined />} className="help-button" />
            <Button type="text" icon={<CloseOutlined />} onClick={handleNodeConfigCancel} className="close-button" />
          </div>
        }
        open={nodeConfigVisible}
        onCancel={handleNodeConfigCancel}
        width={700}
        footer={[
          <Space key="actions">
            <Button danger icon={<DeleteOutlined />} onClick={deleteSelectedNode}>
              Delete
            </Button>
            <Button icon={<CopyOutlined />} onClick={duplicateSelectedNode}>
              Duplicate
            </Button>
          </Space>,
          <Space key="footer">
            <Button key="cancel" onClick={handleNodeConfigCancel}>
              Cancel
            </Button>
            <Button key="submit" type="primary" onClick={handleNodeConfigSubmit}>
              Save
            </Button>
          </Space>,
        ]}
        closable={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please input the node name!" }]}>
            <Input />
          </Form.Item>

          {selectedNode?.data?.type === "alarm status filter" && (
            <Form.Item name="alarmStatus" label="Alarm status">
              <Checkbox.Group>
                <div className="alarm-status-options">
                  <Checkbox value="activeUnacknowledged">Active Unacknowledged</Checkbox>
                  <Checkbox value="activeAcknowledged">Active Acknowledged</Checkbox>
                  <Checkbox value="clearedUnacknowledged">Cleared Unacknowledged</Checkbox>
                  <Checkbox value="clearedAcknowledged">Cleared Acknowledged</Checkbox>
                </div>
              </Checkbox.Group>
            </Form.Item>
          )}

          <Form.Item name="description" label="Rule node description">
            <Input.TextArea rows={4} />
          </Form.Item>

          {selectedNode?.data?.type === "message type switch" && (
            <div className="connection-types">
              <Typography.Title level={5}>Connection Types</Typography.Title>
              <div className="connection-type">
                <span className="connection-label">Post attributes</span>
                <span className="connection-description">Post attributes message type</span>
              </div>
              <div className="connection-type">
                <span className="connection-label">Post telemetry</span>
                <span className="connection-description">Post telemetry message type</span>
              </div>
              <div className="connection-type">
                <span className="connection-label">RPC Request from Device</span>
                <span className="connection-description">RPC Request from device message type</span>
              </div>
              <div className="connection-type">
                <span className="connection-label">RPC Request to Device</span>
                <span className="connection-description">RPC Request to device message type</span>
              </div>
              <div className="connection-type">
                <span className="connection-label">Other</span>
                <span className="connection-description">Other message types</span>
              </div>
            </div>
          )}

          {selectedNode?.data?.type === "save timeseries" && (
            <div className="timeseries-config">
              <Form.Item name="timestampPattern" label="Timestamp pattern">
                <Input placeholder="yyyy-MM-dd HH:mm:ss" />
              </Form.Item>

              <Form.Item name="defaultTTL" label="Default TTL (days)">
                <Input type="number" min={0} />
              </Form.Item>

              <Form.Item name="skipLatestPersistence" valuePropName="checked">
                <Checkbox>Skip latest persistence</Checkbox>
              </Form.Item>
            </div>
          )}
        </Form>
      </Modal>

      {/* Import Rule Chain Modal */}
      <Modal
        title="Import Rule Chain"
        open={isImportModalVisible}
        onCancel={() => setIsImportModalVisible(false)}
        onOk={importRuleChain}
        okText="Import"
      >
        <Dragger
          name="file"
          multiple={false}
          accept=".json"
          showUploadList={true}
          beforeUpload={() => false}
          onChange={handleImportFileChange}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for a single JSON file upload. The file should contain a valid rule chain configuration.
          </p>
        </Dragger>
        <div className="import-instructions" style={{ marginTop: 16 }}>
          <Typography.Text type="secondary">
            The imported rule chain will replace the current one. Make sure to export your current work if needed.
          </Typography.Text>
        </div>
      </Modal>
      <EdgeLabelModal
        visible={isEdgeLabelModalVisible}
        onCancel={() => setIsEdgeLabelModalVisible(false)}
        onSave={handleEdgeLabelUpdate}
        edge={selectedEdge}
      />
    </div>
  )
}

export default RuleChainEditor
