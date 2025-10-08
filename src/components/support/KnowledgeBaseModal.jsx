"use client"

import { useState, useEffect } from "react"
import {
  Modal,
  Input,
  Card,
  List,
  Typography,
  Space,
  Button,
  Tag,
  Divider,
  Row,
  Col,
  Badge,
  Tabs,
  Empty,
  Collapse,
  Image,
} from "antd"
import {
  SearchOutlined,
  BookOutlined,
  LikeOutlined,
  DislikeOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined,
  StarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons"

const { Search } = Input
const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs
const { Panel } = Collapse

const KnowledgeBaseModal = ({ visible, onCancel }) => {
  const [searchText, setSearchText] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [articles, setArticles] = useState([])
  const [faqs, setFaqs] = useState([])
  const [tutorials, setTutorials] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible) {
      loadKnowledgeBase()
    }
  }, [visible])

  const loadKnowledgeBase = () => {
    setLoading(true)

    // Mock articles data
    const mockArticles = [
      {
        id: 1,
        title: "How to Connect IoT Devices to ThingsBoard",
        category: "connectivity",
        content: "Step-by-step guide to connect your IoT devices to the ThingsBoard platform...",
        author: "Technical Team",
        createdAt: "2024-01-10",
        views: 1250,
        rating: 4.8,
        helpful: 45,
        notHelpful: 3,
        tags: ["connectivity", "devices", "setup"],
        readTime: "5 min read",
      },
      {
        id: 2,
        title: "Troubleshooting Device Connectivity Issues",
        category: "connectivity",
        content: "Common connectivity problems and their solutions...",
        author: "Support Team",
        createdAt: "2024-01-08",
        views: 890,
        rating: 4.6,
        helpful: 32,
        notHelpful: 2,
        tags: ["troubleshooting", "connectivity", "devices"],
        readTime: "8 min read",
      },
      {
        id: 3,
        title: "Creating Custom Dashboards",
        category: "dashboards",
        content: "Learn how to create and customize dashboards for your IoT data...",
        author: "Product Team",
        createdAt: "2024-01-05",
        views: 2100,
        rating: 4.9,
        helpful: 78,
        notHelpful: 1,
        tags: ["dashboards", "visualization", "widgets"],
        readTime: "12 min read",
      },
      {
        id: 4,
        title: "Security Best Practices for IoT Deployments",
        category: "security",
        content: "Essential security measures to protect your IoT infrastructure...",
        author: "Security Team",
        createdAt: "2024-01-03",
        views: 1560,
        rating: 4.7,
        helpful: 56,
        notHelpful: 4,
        tags: ["security", "best-practices", "certificates"],
        readTime: "15 min read",
      },
      {
        id: 5,
        title: "Rule Chain Configuration Guide",
        category: "rule-chains",
        content: "Complete guide to setting up and configuring rule chains...",
        author: "Technical Team",
        createdAt: "2024-01-01",
        views: 980,
        rating: 4.5,
        helpful: 28,
        notHelpful: 5,
        tags: ["rule-chains", "automation", "configuration"],
        readTime: "10 min read",
      },
    ]

    // Mock FAQs data
    const mockFaqs = [
      {
        id: 1,
        question: "How do I reset my device password?",
        answer:
          "To reset your device password, go to Device Management > Select your device > Security tab > Reset Password. You'll receive a new password via email.",
        category: "account",
        helpful: 23,
        notHelpful: 1,
      },
      {
        id: 2,
        question: "Why is my device showing as offline?",
        answer:
          "Devices may appear offline due to network connectivity issues, power problems, or incorrect configuration. Check your network connection and device power status first.",
        category: "connectivity",
        helpful: 45,
        notHelpful: 3,
      },
      {
        id: 3,
        question: "How can I export my dashboard data?",
        answer:
          "You can export dashboard data by clicking the Export button in the dashboard toolbar. Choose from CSV, JSON, or PDF formats.",
        category: "dashboards",
        helpful: 18,
        notHelpful: 0,
      },
      {
        id: 4,
        question: "What are the system requirements for device connectivity?",
        answer:
          "Devices need internet connectivity (WiFi, Ethernet, or cellular), support for MQTT or HTTP protocols, and proper authentication certificates.",
        category: "connectivity",
        helpful: 67,
        notHelpful: 2,
      },
      {
        id: 5,
        question: "How do I set up email notifications?",
        answer:
          "Go to Settings > Notifications > Email Configuration. Enter your SMTP settings and test the connection. Then create notification rules in Rule Chains.",
        category: "notifications",
        helpful: 34,
        notHelpful: 1,
      },
    ]

    // Mock tutorials data
    const mockTutorials = [
      {
        id: 1,
        title: "Getting Started with ThingsBoard",
        description: "Complete beginner's guide to ThingsBoard platform",
        thumbnail: "/thingsboard-tutorial-video.jpg",
        duration: "15:30",
        views: 5200,
        rating: 4.9,
        category: "getting-started",
        level: "Beginner",
      },
      {
        id: 2,
        title: "IoT Device Connection Tutorial",
        description: "Step-by-step tutorial on connecting various IoT devices",
        thumbnail: "/iot-device-connection-tutorial.jpg",
        duration: "22:45",
        views: 3800,
        rating: 4.7,
        category: "connectivity",
        level: "Intermediate",
      },
      {
        id: 3,
        title: "Advanced Dashboard Creation",
        description: "Learn to create professional IoT dashboards",
        thumbnail: "/dashboard-creation-tutorial.png",
        duration: "18:20",
        views: 2900,
        rating: 4.8,
        category: "dashboards",
        level: "Advanced",
      },
    ]

    setArticles(mockArticles)
    setFaqs(mockFaqs)
    setTutorials(mockTutorials)
    setLoading(false)
  }

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchText.toLowerCase()) ||
      article.content.toLowerCase().includes(searchText.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchText.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchText.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchText.toLowerCase())
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredTutorials = tutorials.filter((tutorial) => {
    const matchesSearch =
      tutorial.title.toLowerCase().includes(searchText.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchText.toLowerCase())
    const matchesCategory = selectedCategory === "all" || tutorial.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = [
    { key: "all", label: "All Categories" },
    { key: "connectivity", label: "Connectivity" },
    { key: "dashboards", label: "Dashboards" },
    { key: "security", label: "Security" },
    { key: "rule-chains", label: "Rule Chains" },
    { key: "notifications", label: "Notifications" },
    { key: "getting-started", label: "Getting Started" },
  ]

  const handleHelpful = (type, id, isHelpful) => {
    // In real app, this would make an API call
    console.log(`Marked ${type} ${id} as ${isHelpful ? "helpful" : "not helpful"}`)
  }

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BookOutlined />
          <span>Knowledge Base</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="Search articles, FAQs, and tutorials..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="large"
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col>
            <Space wrap>
              {categories.map((category) => (
                <Button
                  key={category.key}
                  type={selectedCategory === category.key ? "primary" : "default"}
                  size="small"
                  onClick={() => setSelectedCategory(category.key)}
                >
                  {category.label}
                </Button>
              ))}
            </Space>
          </Col>
        </Row>
      </div>

      <Tabs defaultActiveKey="articles">
        <TabPane tab={`Articles (${filteredArticles.length})`} key="articles">
          <List
            loading={loading}
            dataSource={filteredArticles}
            renderItem={(article) => (
              <List.Item key={article.id}>
                <Card hoverable style={{ width: "100%" }}>
                  <Row gutter={16}>
                    <Col flex="auto">
                      <div style={{ marginBottom: 8 }}>
                        <Title level={5} style={{ margin: 0 }}>
                          {article.title}
                        </Title>
                        <Space size="small" style={{ marginTop: 4 }}>
                          <Text type="secondary">by {article.author}</Text>
                          <Text type="secondary">•</Text>
                          <Text type="secondary">{article.createdAt}</Text>
                          <Text type="secondary">•</Text>
                          <Text type="secondary">
                            <ClockCircleOutlined /> {article.readTime}
                          </Text>
                        </Space>
                      </div>
                      <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
                        {article.content}
                      </Paragraph>
                      <div style={{ marginBottom: 8 }}>
                        {article.tags.map((tag) => (
                          <Tag key={tag} size="small">
                            {tag}
                          </Tag>
                        ))}
                      </div>
                      <Space size="middle">
                        <Space size="small">
                          <EyeOutlined />
                          <Text type="secondary">{article.views} views</Text>
                        </Space>
                        <Space size="small">
                          <StarOutlined />
                          <Text type="secondary">{article.rating}</Text>
                        </Space>
                        <Space size="small">
                          <Button
                            type="text"
                            size="small"
                            icon={<LikeOutlined />}
                            onClick={() => handleHelpful("article", article.id, true)}
                          >
                            {article.helpful}
                          </Button>
                          <Button
                            type="text"
                            size="small"
                            icon={<DislikeOutlined />}
                            onClick={() => handleHelpful("article", article.id, false)}
                          >
                            {article.notHelpful}
                          </Button>
                        </Space>
                      </Space>
                    </Col>
                    <Col>
                      <Button type="primary">Read Article</Button>
                    </Col>
                  </Row>
                </Card>
              </List.Item>
            )}
            locale={{
              emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No articles found" />,
            }}
          />
        </TabPane>

        <TabPane tab={`FAQs (${filteredFaqs.length})`} key="faqs">
          <Collapse>
            {filteredFaqs.map((faq) => (
              <Panel
                header={
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <QuestionCircleOutlined />
                    <Text strong>{faq.question}</Text>
                  </div>
                }
                key={faq.id}
                extra={<Badge count={faq.helpful} showZero={false} color="green" />}
              >
                <Paragraph>{faq.answer}</Paragraph>
                <Divider style={{ margin: "12px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary">Was this helpful?</Text>
                  <Space>
                    <Button
                      type="text"
                      size="small"
                      icon={<LikeOutlined />}
                      onClick={() => handleHelpful("faq", faq.id, true)}
                    >
                      Yes ({faq.helpful})
                    </Button>
                    <Button
                      type="text"
                      size="small"
                      icon={<DislikeOutlined />}
                      onClick={() => handleHelpful("faq", faq.id, false)}
                    >
                      No ({faq.notHelpful})
                    </Button>
                  </Space>
                </div>
              </Panel>
            ))}
          </Collapse>
          {filteredFaqs.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No FAQs found" />}
        </TabPane>

        <TabPane tab={`Video Tutorials (${filteredTutorials.length})`} key="tutorials">
          <Row gutter={[16, 16]}>
            {filteredTutorials.map((tutorial) => (
              <Col xs={24} sm={12} md={8} key={tutorial.id}>
                <Card
                  hoverable
                  cover={
                    <div style={{ position: "relative" }}>
                      <Image
                        alt={tutorial.title}
                        src={tutorial.thumbnail || "/placeholder.svg"}
                        height={160}
                        style={{ objectFit: "cover" }}
                        preview={false}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          fontSize: 32,
                          color: "white",
                          textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                        }}
                      >
                        <PlayCircleOutlined />
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          bottom: 8,
                          right: 8,
                          background: "rgba(0,0,0,0.7)",
                          color: "white",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontSize: 12,
                        }}
                      >
                        {tutorial.duration}
                      </div>
                    </div>
                  }
                  actions={[
                    <Button key="watch-now" type="primary" icon={<PlayCircleOutlined />}>
                      Watch Now
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={tutorial.title}
                    description={
                      <div>
                        <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
                          {tutorial.description}
                        </Paragraph>
                        <Space size="small" wrap>
                          <Tag color="blue">{tutorial.level}</Tag>
                          <Space size="small">
                            <EyeOutlined />
                            <Text type="secondary">{tutorial.views}</Text>
                          </Space>
                          <Space size="small">
                            <StarOutlined />
                            <Text type="secondary">{tutorial.rating}</Text>
                          </Space>
                        </Space>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
          {filteredTutorials.length === 0 && (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No tutorials found" />
          )}
        </TabPane>
      </Tabs>
    </Modal>
  )
}

export default KnowledgeBaseModal