"use client"

import { useState, useEffect } from "react"
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Alert,
  Card,
  Avatar,
  List,
  Tag,
  message,
  Steps,
  Collapse,
} from "antd"
import {
  GithubOutlined,
  CheckCircleOutlined,
  UserOutlined,
  BookOutlined,
  KeyOutlined,
  LinkOutlined,
  BugOutlined,
} from "@ant-design/icons"
import { GitHubService } from "../../services/GitHubService"

const { Text, Title, Paragraph } = Typography
const { Panel } = Collapse

const GitHubSettingsModal = ({ visible, onCancel, onSuccess, userRole }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [repositories, setRepositories] = useState([])
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (visible) {
      checkExistingConnection()
    }
  }, [visible])

  const checkExistingConnection = async () => {
    if (GitHubService.isConfigured()) {
      setTesting(true)
      const result = await GitHubService.testConnection()
      if (result.success) {
        setConnectionStatus("success")
        setUserInfo(result.user)
        setCurrentStep(2)
        loadRepositories()
      } else {
        setConnectionStatus("error")
        setCurrentStep(1)
      }
      setTesting(false)
    } else {
      setCurrentStep(0)
    }
  }

  const loadRepositories = async () => {
    try {
      const repos = await GitHubService.getRepositories()
      setRepositories(repos.slice(0, 10)) // Show first 10 repos
    } catch (error) {
      message.error("Failed to load repositories")
    }
  }

  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields(["token"])
      setTesting(true)

      // Temporarily set token for testing
      const originalToken = GitHubService.token
      GitHubService.setToken(values.token)

      const result = await GitHubService.testConnection()

      if (result.success) {
        setConnectionStatus("success")
        setUserInfo(result.user)
        setCurrentStep(2)
        message.success("GitHub connection successful!")
        loadRepositories()
      } else {
        setConnectionStatus("error")
        setCurrentStep(1)
        message.error("Connection failed: " + result.error)
        // Restore original token on failure
        if (originalToken) {
          GitHubService.setToken(originalToken)
        } else {
          GitHubService.removeToken()
        }
      }
    } catch (error) {
      setConnectionStatus("error")
      message.error("Please enter a valid token")
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      // Token is already set during testing
      onSuccess()
      message.success("GitHub settings saved successfully!")
    } catch (error) {
      message.error("Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = () => {
    GitHubService.removeToken()
    setConnectionStatus(null)
    setUserInfo(null)
    setRepositories([])
    setCurrentStep(0)
    form.resetFields()
    message.success("GitHub disconnected successfully")
  }

  const steps = [
    {
      title: "Setup Token",
      description: "Create and configure GitHub Personal Access Token",
    },
    {
      title: "Test Connection",
      description: "Verify token and test GitHub API access",
    },
    {
      title: "Ready to Use",
      description: "GitHub integration is configured and ready",
    },
  ]

  return (
    <Modal
      title={
        <Space>
          <GithubOutlined />
          GitHub Integration Settings
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        ...(connectionStatus === "success"
          ? [
              <Button key="disconnect" danger onClick={handleDisconnect}>
                Disconnect
              </Button>,
              <Button key="save" type="primary" loading={loading} onClick={handleSave}>
                Save Settings
              </Button>,
            ]
          : [
              <Button
                key="test"
                type="primary"
                loading={testing}
                onClick={handleTestConnection}
                icon={<LinkOutlined />}
              >
                Test Connection
              </Button>,
            ]),
      ]}
    >
      <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />

      {currentStep === 0 && (
        <div>
          <Alert
            message="GitHub Integration Setup"
            description="Configure GitHub integration to create issues directly from support tickets. This feature is available for admins and super admins only."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Collapse defaultActiveKey={["1"]} style={{ marginBottom: 16 }}>
            <Panel header="📋 Setup Instructions" key="1">
              <div>
                <Title level={5}>Step 1: Create Personal Access Token</Title>
                <Paragraph>
                  1. Go to{" "}
                  <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">
                    GitHub Settings → Developer settings → Personal access tokens
                  </a>
                </Paragraph>
                <Paragraph>2. Click "Generate new token (classic)"</Paragraph>
                <Paragraph>3. Give it a descriptive name like "IoT Platform Support Integration"</Paragraph>
                <Paragraph>4. Select the following scopes:</Paragraph>
                <ul>
                  <li>
                    <code>repo</code> - Full control of private repositories
                  </li>
                  <li>
                    <code>read:user</code> - Read user profile data
                  </li>
                </ul>
                <Paragraph>5. Click "Generate token" and copy the token immediately</Paragraph>

                <Alert
                  message="Security Note"
                  description="Keep your token secure and never share it. The token will only be stored locally in your browser."
                  type="warning"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              </div>
            </Panel>
          </Collapse>

          <Form form={form} layout="vertical">
            <Form.Item
              name="token"
              label="GitHub Personal Access Token"
              rules={[
                { required: true, message: "Please enter your GitHub token" },
                { min: 40, message: "Token should be at least 40 characters" },
              ]}
            >
              <Input.Password placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" prefix={<KeyOutlined />} />
            </Form.Item>
          </Form>
        </div>
      )}

      {currentStep === 1 && (
        <div>
          <Alert
            message="Testing Connection"
            description="Click 'Test Connection' to verify your GitHub token and API access."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {connectionStatus === "error" && (
            <Alert
              message="Connection Failed"
              description="Please check your token and try again. Make sure the token has the required permissions."
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form form={form} layout="vertical">
            <Form.Item
              name="token"
              label="GitHub Personal Access Token"
              rules={[
                { required: true, message: "Please enter your GitHub token" },
                { min: 40, message: "Token should be at least 40 characters" },
              ]}
            >
              <Input.Password placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" prefix={<KeyOutlined />} />
            </Form.Item>
          </Form>
        </div>
      )}

      {currentStep === 2 && connectionStatus === "success" && (
        <div>
          <Alert
            message="GitHub Connected Successfully"
            description="Your GitHub integration is configured and ready to use."
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {userInfo && (
            <Card title="Connected Account" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Avatar size={64} src={userInfo.avatar_url} icon={<UserOutlined />} />
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {userInfo.name || userInfo.login}
                  </Title>
                  <Text type="secondary">@{userInfo.login}</Text>
                  <br />
                  <Text type="secondary">{userInfo.email}</Text>
                  <br />
                  <Space style={{ marginTop: 8 }}>
                    <Tag icon={<BookOutlined />}>{userInfo.public_repos} repos</Tag>
                    <Tag>{userInfo.followers} followers</Tag>
                  </Space>
                </div>
              </div>
            </Card>
          )}

          {repositories.length > 0 && (
            <Card title="Available Repositories" style={{ marginBottom: 16 }}>
              <List
                dataSource={repositories}
                renderItem={(repo) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<GithubOutlined />}
                      title={
                        <Space>
                          <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                            {repo.full_name}
                          </a>
                          {repo.private && <Tag size="small">Private</Tag>}
                        </Space>
                      }
                      description={repo.description}
                    />
                    <div>
                      <Text type="secondary">{repo.language}</Text>
                    </div>
                  </List.Item>
                )}
              />
              {repositories.length === 10 && (
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <Text type="secondary">Showing first 10 repositories</Text>
                </div>
              )}
            </Card>
          )}

          <Card title="Integration Features">
            <List
              dataSource={[
                {
                  title: "Create GitHub Issues",
                  description: "Create issues directly from support tickets with pre-filled templates",
                  icon: <BugOutlined />,
                },
                {
                  title: "Issue Templates",
                  description: "Automatic templates for bugs, features, and enhancements",
                  icon: <BookOutlined />,
                },
                {
                  title: "Ticket Linking",
                  description: "Automatic linking between support tickets and GitHub issues",
                  icon: <LinkOutlined />,
                },
                {
                  title: "Status Tracking",
                  description: "Track GitHub issue status within the support system",
                  icon: <CheckCircleOutlined />,
                },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta avatar={item.icon} title={item.title} description={item.description} />
                </List.Item>
              )}
            />
          </Card>
        </div>
      )}
    </Modal>
  )
}

export default GitHubSettingsModal
