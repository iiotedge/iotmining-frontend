// components/support/GitHubIssueModal.jsx
"use client"

import { useState, useEffect } from "react"
import { Modal, Form, Input, Select, Button, Space, Typography, Tag, Alert, Card, message } from "antd"
import { GithubOutlined, BugOutlined, BulbOutlined, ToolOutlined, ExclamationCircleOutlined } from "@ant-design/icons"
import { GitHubService } from "../../services/GitHubService"

const { TextArea } = Input
const { Option } = Select
const { Text, Title } = Typography

const GitHubIssueModal = ({ visible, onCancel, onSuccess, ticket, userRole }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [repositories, setRepositories] = useState([])
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [issueType, setIssueType] = useState("bug")
  const [previewMode, setPreviewMode] = useState(false)
  const [issuePreview, setIssuePreview] = useState("")

  useEffect(() => {
    if (visible) {
      loadRepositories()
      generateIssueContent()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, ticket, issueType])

  const loadRepositories = async () => {
    try {
      const repos = await GitHubService.getRepositories()
      setRepositories(repos)
      if (repos.length > 0 && !form.getFieldValue("repository")) {
        form.setFieldsValue({ repository: repos[0].full_name })
        setSelectedRepo(repos[0])
      }
    } catch (error) {
      message.error(error.message || "Failed to load repositories. Please check your GitHub settings.")
    }
  }

  const generateIssueContent = () => {
    if (!ticket) return

    const templates = {
      bug: {
        title: `[BUG] ${ticket.title}`,
        body: `## Bug Report

**Support Ticket:** #${ticket.id}
**Priority:** ${ticket.priority.toUpperCase()}
**Category:** ${ticket.category.replace("-", " ")}

### Description
${ticket.description}

### Environment
- **Tenant:** ${ticket.tenant}
- **Reporter:** ${ticket.reporter}
- **Created:** ${ticket.createdAt}

### Steps to Reproduce
1. [Please add steps to reproduce the issue]
2. 
3. 

### Expected Behavior
[Describe what should happen]

### Actual Behavior
[Describe what actually happens]

### Additional Information
- **Tags:** ${ticket.tags ? ticket.tags.join(", ") : "None"}
- **Attachments:** ${ticket.attachments ? ticket.attachments.join(", ") : "None"}

### Support Context
This issue was escalated from our support system. Original ticket: #${ticket.id}
Reporter: ${ticket.reporter} (${ticket.reporterEmail})`,
        labels: ["bug", "support-escalation", `priority-${ticket.priority}`, `category-${ticket.category}`],
      },
      feature: {
        title: `[FEATURE] ${ticket.title}`,
        body: `## Feature Request

**Support Ticket:** #${ticket.id}
**Priority:** ${ticket.priority.toUpperCase()}
**Category:** ${ticket.category.replace("-", " ")}

### Description
${ticket.description}

### Use Case
**Tenant:** ${ticket.tenant}
**Requested by:** ${ticket.reporter}

### Proposed Solution
[Describe the proposed solution]

### Alternative Solutions
[Describe any alternative solutions considered]

### Additional Context
- **Tags:** ${ticket.tags ? ticket.tags.join(", ") : "None"}
- **Created:** ${ticket.createdAt}

### Support Context
This feature was requested through our support system. Original ticket: #${ticket.id}
Reporter: ${ticket.reporter} (${ticket.reporterEmail})`,
        labels: ["enhancement", "support-escalation", `priority-${ticket.priority}`, `category-${ticket.category}`],
      },
      enhancement: {
        title: `[ENHANCEMENT] ${ticket.title}`,
        body: `## Enhancement Request

**Support Ticket:** #${ticket.id}
**Priority:** ${ticket.priority.toUpperCase()}
**Category:** ${ticket.category.replace("-", " ")}

### Current Behavior
${ticket.description}

### Proposed Enhancement
[Describe the enhancement]

### Benefits
[Describe the benefits of this enhancement]

### Implementation Details
[Add any implementation details if known]

### Environment
- **Tenant:** ${ticket.tenant}
- **Reporter:** ${ticket.reporter}
- **Created:** ${ticket.createdAt}

### Additional Information
- **Tags:** ${ticket.tags ? ticket.tags.join(", ") : "None"}
- **Attachments:** ${ticket.attachments ? ticket.attachments.join(", ") : "None"}

### Support Context
This enhancement was requested through our support system. Original ticket: #${ticket.id}
Reporter: ${ticket.reporter} (${ticket.reporterEmail})`,
        labels: ["enhancement", "support-escalation", `priority-${ticket.priority}`, `category-${ticket.category}`],
      },
    }

    const template = templates[issueType] || templates.bug
    form.setFieldsValue({
      title: template.title,
      body: template.body,
      labels: template.labels,
    })
    setIssuePreview(template.body)
  }

  const handleIssueTypeChange = (type) => {
    setIssueType(type)
    generateIssueContent()
  }

  const handleRepositoryChange = (repoFullName) => {
    form.setFieldsValue({ repository: repoFullName })
    const repo = repositories.find((r) => r.full_name === repoFullName) || null
    setSelectedRepo(repo)
  }

  const handlePreview = () => {
    const values = form.getFieldsValue()
    setIssuePreview(values.body || "")
    setPreviewMode(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const repoFullName = selectedRepo?.full_name || (values.repository || "").trim()

      const issueData = {
        title: values.title,
        body: values.body,
        labels: values.labels || [],
        assignees: values.assignees ? [values.assignees] : [],
      }

      const createdIssue = await GitHubService.createIssue(repoFullName, issueData)

      onSuccess?.({
        number: createdIssue.number,
        url: createdIssue.html_url,
        title: createdIssue.title,
        status: createdIssue.state,
        repository: repoFullName,
      })

      form.resetFields()
      setPreviewMode(false)
      setSelectedRepo(null)
      message.success(`Issue #${createdIssue.number} created in ${repoFullName}`)
    } catch (error) {
      message.error(error.message || "Failed to create GitHub issue.")
    } finally {
      setLoading(false)
    }
  }

  const getIssueTypeIcon = (type) => {
    switch (type) {
      case "bug":
        return <BugOutlined />
      case "feature":
        return <BulbOutlined />
      case "enhancement":
        return <ToolOutlined />
      default:
        return <ExclamationCircleOutlined />
    }
  }

  const getIssueTypeColor = (type) => {
    switch (type) {
      case "bug":
        return "red"
      case "feature":
        return "blue"
      case "enhancement":
        return "green"
      default:
        return "default"
    }
  }

  const repoHelp =
    "Pick from the list or type the full name like owner/repo (e.g., S-8506/iiotedge). You must have access and Issues must be enabled."

  return (
    <Modal
      title={
        <Space>
          <GithubOutlined />
          Create GitHub Issue
        </Space>
      }
      open={visible}
      onCancel={() => {
        onCancel?.()
        form.resetFields()
        setPreviewMode(false)
        setSelectedRepo(null)
      }}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="preview" onClick={handlePreview} disabled={previewMode}>
          Preview
        </Button>,
        <Button key="back" onClick={() => setPreviewMode(false)} disabled={!previewMode}>
          Edit
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit} icon={<GithubOutlined />}>
          Create Issue
        </Button>,
      ]}
    >
      {!GitHubService.isConfigured() && (
        <Alert
          message="GitHub Not Configured"
          description="Please configure your GitHub token first (private repos require the 'repo' scope or a fine-grained token with Issues: Read & write)."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Text strong>Support Ticket: #{ticket?.id}</Text>
            <br />
            <Text type="secondary">{ticket?.title}</Text>
          </div>
          <Space>
            <Tag color="blue">{ticket?.category?.replace("-", " ")}</Tag>
            <Tag color={ticket?.priority === "critical" ? "red" : ticket?.priority === "high" ? "orange" : "blue"}>
              {ticket?.priority?.toUpperCase()}
            </Tag>
          </Space>
        </div>
      </Card>

      {!previewMode ? (
        <Form form={form} layout="vertical" disabled={!GitHubService.isConfigured()}>
          <Form.Item
            name="repository"
            label="Repository"
            rules={[
              { required: true, message: "Please select or type a repository full name (owner/repo)" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve()
                  return value.includes("/")
                    ? Promise.resolve()
                    : Promise.reject(new Error("Repository must be in the format owner/repo"))
                },
              },
            ]}
            extra={repoHelp}
          >
            <Select
              showSearch
              placeholder="Select or type repository (owner/repo)"
              onChange={handleRepositoryChange}
              onSearch={(val) => form.setFieldsValue({ repository: val })}
              filterOption={(input, option) =>
                (option?.value ?? "").toLowerCase().includes(input.toLowerCase()) ||
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={[
                ...repositories.map((repo) => ({
                  value: repo.full_name,
                  label: repo.full_name + (repo.private ? " (private)" : ""),
                })),
              ]}
            />
          </Form.Item>

          <Form.Item label="Issue Type">
            <Select value={issueType} onChange={handleIssueTypeChange}>
              <Option value="bug">
                <Space>
                  <BugOutlined />
                  Bug Report
                </Space>
              </Option>
              <Option value="feature">
                <Space>
                  <BulbOutlined />
                  Feature Request
                </Space>
              </Option>
              <Option value="enhancement">
                <Space>
                  <ToolOutlined />
                  Enhancement
                </Space>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="Issue Title"
            rules={[{ required: true, message: "Please enter issue title" }]}
          >
            <Input placeholder="Enter issue title" />
          </Form.Item>

          <Form.Item
            name="body"
            label="Issue Description"
            rules={[{ required: true, message: "Please enter issue description" }]}
          >
            <TextArea rows={12} placeholder="Enter detailed issue description" style={{ fontFamily: "monospace" }} />
          </Form.Item>

          <Form.Item name="labels" label="Labels">
            <Select mode="tags" placeholder="Add labels" style={{ width: "100%" }}>
              <Option value="bug">bug</Option>
              <Option value="enhancement">enhancement</Option>
              <Option value="feature">feature</Option>
              <Option value="support-escalation">support-escalation</Option>
              <Option value="high-priority">high-priority</Option>
              <Option value="critical">critical</Option>
            </Select>
          </Form.Item>

          {form.getFieldValue("repository") && (
            <Form.Item name="assignees" label="Assignee">
              <Select placeholder="Assign to user (optional)" allowClear>
                <Option value="self">Assign to me</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      ) : (
        <div>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Title level={4} style={{ margin: 0 }}>
              Issue Preview
            </Title>
            <Tag color={getIssueTypeColor(issueType)} icon={getIssueTypeIcon(issueType)}>
              {issueType.toUpperCase()}
            </Tag>
          </div>
          <Card>
            <div style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 12 }}>{issuePreview}</div>
          </Card>
        </div>
      )}

      {form.getFieldValue("repository") && (
        <Alert
          message={`Creating issue in: ${form.getFieldValue("repository")}`}
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Modal>
  )
}

export default GitHubIssueModal