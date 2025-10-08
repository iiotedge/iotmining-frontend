"use client";

import { useState, useEffect, useRef } from "react";
import {
  Layout,
  Card,
  Input,
  Button,
  Typography,
  Space,
  Avatar,
  Tag,
  Select,
  Switch,
  Row,
  Col,
  Statistic,
  Timeline,
  Alert,
  Spin,
  Drawer,
  Tabs,
  List,
  DatePicker,
  message as antdMessage,
  Checkbox,
  theme as antdTheme,
} from "antd";
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FireOutlined,
  DropboxOutlined,
  BulbOutlined,
  SettingOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTheme } from "../components/theme/ThemeProvider";

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const API_BASE = process.env.NEXT_PUBLIC_AI_API_BASE || "http://localhost:8096";

// helpers
const toIsoOrNull = (d) => (d ? dayjs(d).toISOString() : null);

// Structured device alert list (kept)
const DeviceAlertList = ({ items }) => {
  if (!items || items.length === 0) {
    return <Alert type="info" showIcon message="No devices with alerts in the requested window." />;
  }
  return (
    <List
      dataSource={items}
      renderItem={(it) => (
        <List.Item>
          <Card size="small" style={{ width: "100%" }}>
            <Row gutter={12} align="middle">
              <Col xs={24} md={18}>
                <Space direction="vertical" size="small">
                  <Space wrap>
                    <Text strong>{it.deviceId}</Text>
                    {it.deviceType && <Tag color="geekblue">{it.deviceType}</Tag>}
                    {it.location && (
                      <Tag icon={<EnvironmentOutlined />} color="green">
                        {it.location}
                      </Tag>
                    )}
                    {it.severity && (
                      <Tag
                        color={
                          it.severity === "CRITICAL"
                            ? "red"
                            : it.severity === "HIGH"
                            ? "volcano"
                            : it.severity === "MEDIUM"
                            ? "gold"
                            : "blue"
                        }
                      >
                        {it.severity}
                      </Tag>
                    )}
                  </Space>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    <ClockCircleOutlined /> Latest:{" "}
                    {it.latestTs ? dayjs(it.latestTs).format("YYYY-MM-DD HH:mm:ss") : "n/a"}
                    {typeof it.count === "number" ? ` • Count: ${it.count}` : ""}
                  </Text>
                  {it.sampleReasons?.length > 0 && (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Reasons: {it.sampleReasons.join("; ")}
                    </Text>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>
        </List.Item>
      )}
    />
  );
};

const StructuredBlock = ({ data }) => {
  if (!data) return null;
  if (data.type === "device_alert_list") {
    return (
      <>
        <Title level={5} style={{ marginTop: 12 }}>
          Devices that triggered alerts
        </Title>
        <DeviceAlertList items={data.items || []} />
      </>
    );
  }
  return (
    <Card size="small" style={{ marginTop: 12 }}>
      <pre style={{ margin: 0 }}>{JSON.stringify(data, null, 2)}</pre>
    </Card>
  );
};

export default function AIQueryPage() {
  const { token } = antdTheme.useToken();
  const { theme } = useTheme();

  // Main tabs
  const [activeMainTab, setActiveMainTab] = useState("live");

  // Chat
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Drawer (kept)
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Filters
  const [tenantHeader, setTenantHeader] = useState("tenant1");
  const [deviceId, setDeviceId] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [contextMode, setContextMode] = useState("smart");
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const [location, setLocation] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [topK, setTopK] = useState(10);
  const [liveAnalysis, setLiveAnalysis] = useState(true);

  // Live demo counters
  const [liveData, setLiveData] = useState({
    totalDevices: 1247,
    activeDevices: 1198,
    anomalies: 23,
    alerts: 7,
    events: 156,
    dataPoints: 45672,
  });

  // AI Ops KPIs (demo)
  const [aiOps, setAiOps] = useState({
    tps: 42, // inferences/sec
    latencyMs: 128, // avg model latency
    errorPct: 0.7, // %
    ingestionLagSec: 3,
    pipelineUptimePct: 99.97,
  });

  // Live events stream (demo)
  const [liveEvents, setLiveEvents] = useState([
    {
      id: 1,
      severity: "CRITICAL",
      message: "Fire detected in Building A, Floor 3",
      device: "Fire-Sensor-A3-01",
      location: "Building A - Floor 3",
      ts: new Date(),
      tags: ["computer-vision", "smoke", "temperature-spike"],
      icon: <FireOutlined />,
    },
    {
      id: 2,
      severity: "HIGH",
      message: "Water leak detected near Pump Station 2",
      device: "Water-Leak-PS2-07",
      location: "Plant West - Pump Station 2",
      ts: new Date(Date.now() - 2 * 60 * 1000),
      tags: ["acoustic-sensor", "pressure-drop"],
      icon: <DropboxOutlined />,
    },
    {
      id: 3,
      severity: "MEDIUM",
      message: "Door access anomaly outside business hours",
      device: "Door-Access-G1",
      location: "Gate 1",
      ts: new Date(Date.now() - 6 * 60 * 1000),
      tags: ["rfid", "behavioral"],
      icon: <BulbOutlined />,
    },
  ]);

  // Simulate new live event periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveEvents((prev) => {
        const id = prev.length ? prev[0].id + 1 : 1;
        const newEvent = {
          id,
          severity: Math.random() > 0.8 ? "HIGH" : "MEDIUM",
          message: Math.random() > 0.5 ? "Temperature anomaly in Compressor Room" : "Vibration spike on Motor #12",
          device: Math.random() > 0.5 ? "Temp-Sensor-C2" : "Vibe-Motor-12",
          location: Math.random() > 0.5 ? "Compressor Room" : "Line 3 - Motor 12",
          ts: new Date(),
          tags: ["ai-detector", "timeseries"],
          icon: <ThunderboltOutlined />,
        };
        return [newEvent, ...prev].slice(0, 20);
      });
      setAiOps((p) => ({
        ...p,
        tps: Math.max(20, Math.min(120, Math.round(p.tps + (Math.random() * 10 - 5)))),
        latencyMs: Math.max(60, Math.min(250, Math.round(p.latencyMs + (Math.random() * 20 - 10)))),
        errorPct: Math.max(0, Math.min(3, +(p.errorPct + (Math.random() * 0.4 - 0.2)).toFixed(2))),
        ingestionLagSec: Math.max(0, Math.min(10, Math.round(p.ingestionLagSec + (Math.random() * 2 - 1)))),
      }));
      setLiveData((prev) => ({
        ...prev,
        events: prev.events + 1,
        dataPoints: prev.dataPoints + Math.floor(Math.random() * 80),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Backend call (kept)
  const callBackend = async (naturalLanguageQuery) => {
    setIsLoading(true);
    setIsTyping(true);
    try {
      const body = {
        query: naturalLanguageQuery,
        deviceId: deviceId?.trim() || undefined,
        deviceType: deviceType?.trim() || undefined,
        fromTs: dateRange?.[0] ? dayjs(dateRange[0]).valueOf() : undefined,
        toTs: dateRange?.[1] ? dayjs(dateRange[1]).valueOf() : undefined,
        topK,
        contextMode,
        location: location?.trim() || undefined,
        onlyAlerts: onlyAlerts || undefined,
      };
      const res = await fetch(`${API_BASE}/api/ai/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Id": tenantHeader || "default-tenant",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          timestamp: new Date(),
          content: data.content || "",
          data: data.data || null,
          charts: data.charts || null,
          provider: data.provider || "unknown",
        },
      ]);
    } catch (e) {
      antdMessage.error("Query failed. Check server logs / network.");
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          timestamp: new Date(),
          content: "Sorry—something went wrong while fetching the answer. Please try again.",
          data: null,
          charts: null,
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    const q = inputValue.trim();
    if (!q) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), type: "user", content: q, timestamp: new Date() },
    ]);
    setInputValue("");
    await callBackend(q);
  };

  // Chat message renderer (dark-mode safe)
  const renderMessage = (m) => {
    const isUser = m.type === "user";
    return (
      <div key={m.id} className="chat-bubble" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <Avatar
            icon={isUser ? <UserOutlined /> : <RobotOutlined />}
            style={isUser ? {} : { backgroundColor: token.colorPrimary, color: token.colorTextLightSolid }}
          />
          <span style={{ marginLeft: 8, fontSize: 12, color: token.colorTextSecondary }}>
            {new Date(m.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div
          style={{
            color: token.colorText,
            backgroundColor: isUser ? token.colorPrimaryBg : token.colorFillSecondary,
            padding: 12,
            borderRadius: 8,
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          <Text style={{ color: token.colorText }}>{m.content}</Text>
          {!isUser && m.data && <StructuredBlock data={m.data} />}
          {!isUser && m.charts?.type === "temperature_trend" && (
            <div style={{ marginTop: 12 }}>
              <Title level={5}>Temperature Trend (24h)</Title>
            </div>
          )}
          {!isUser && m.provider && (
            <div style={{ marginTop: 6 }}>
              <Tag icon={<ExclamationCircleOutlined />}>provider: {m.provider}</Tag>
            </div>
          )}
        </div>
      </div>
    );
  };

  const quickQuestions = [
    "Hi",
    "What changed in my devices today?",
    "Show me device list that triggered alerts in the last 24 hours.",
    "Any fire alerts in the last hour?",
    "Temperature anomalies in server room",
  ];

  return (
    <Layout>
      <Content style={{ padding: 24, height: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Title level={2} style={{ margin: 0 }}>
              <RobotOutlined style={{ marginRight: 8, color: token.colorPrimary }} />
              AI Query Assistant
            </Title>
            <Text type="secondary">Ask about your IoT devices, events, anomalies—or just chat.</Text>
          </Col>
          <Col>
            <Space>
              <Button icon={<BarChartOutlined />} onClick={() => setSidebarVisible(true)}>
                Live Analysis
              </Button>
              <Button icon={<SettingOutlined />}>Settings</Button>
            </Space>
          </Col>
        </Row>

        {/* Tabs */}
        <Tabs activeKey={activeMainTab} onChange={setActiveMainTab}>
          {/* ============ LIVE (AI-centric) ============ */}
          <TabPane tab="Live Analysis" key="live">
            {/* Filters (unchanged) */}
            <Card style={{ marginBottom: 16 }} bodyStyle={{ paddingBottom: 8 }}>
              <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
                <Col xs={24} md={6}>
                  <Input value={tenantHeader} onChange={(e) => setTenantHeader(e.target.value)} placeholder="X-Tenant-Id (header)" />
                </Col>
                <Col xs={24} md={6}>
                  <Input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="Device ID (optional)" />
                </Col>
                <Col xs={24} md={6}>
                  <Input value={deviceType} onChange={(e) => setDeviceType(e.target.value)} placeholder="Device Type (optional)" />
                </Col>
                <Col xs={24} md={6}>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (optional)" />
                </Col>
              </Row>

              <Row gutter={[12, 12]} style={{ marginBottom: 8 }}>
                <Col xs={24} md={10}>
                  <RangePicker
                    style={{ width: "100%" }}
                    showTime
                    value={dateRange}
                    onChange={(v) => setDateRange(v)}
                    allowClear
                  />
                </Col>
                <Col xs={24} md={4}>
                  <Select value={contextMode} onChange={setContextMode} style={{ width: "100%" }} placeholder="Context Mode">
                    <Option value="smart">Smart Context</Option>
                    <Option value="detailed">Detailed Analysis</Option>
                    <Option value="summary">Summary Only</Option>
                  </Select>
                </Col>
                <Col xs={24} md={4}>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={topK}
                    onChange={(e) => setTopK(Number(e.target.value || 10))}
                    placeholder="topK"
                  />
                </Col>
                <Col xs={12} md={3}>
                  <Checkbox checked={onlyAlerts} onChange={(e) => setOnlyAlerts(e.target.checked)}>
                    Only Alerts
                  </Checkbox>
                </Col>
                <Col xs={12} md={3}>
                  <Space>
                    <Text>Live:</Text>
                    <Switch checked={liveAnalysis} onChange={setLiveAnalysis} checkedChildren="ON" unCheckedChildren="OFF" />
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* 1) AI Ops KPIs (above events) */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={12} md={6}>
                <Card>
                  <Statistic title="Model TPS (infer/sec)" value={aiOps.tps} valueStyle={{ color: token.colorPrimary }} />
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card>
                  <Statistic title="Avg Latency (ms)" value={aiOps.latencyMs} valueStyle={{ color: "#faad14" }} />
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card>
                  <Statistic title="Error Rate (%)" value={aiOps.errorPct} precision={2} valueStyle={{ color: "#ff4d4f" }} />
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card>
                  <Space direction="vertical" size={0}>
                    <Statistic title="Ingestion Lag (sec)" value={aiOps.ingestionLagSec} />
                    <Text type="secondary">Pipeline Uptime: {aiOps.pipelineUptimePct}%</Text>
                  </Space>
                </Card>
              </Col>
            </Row>

            {/* 2) Device/Alerts counters + AI Rule Engine (also above events) */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} lg={14}>
                <Row gutter={[16, 16]}>
                  <Col xs={12} md={12}>
                    <Card>
                      <Statistic
                        title="Active Devices"
                        value={liveData.activeDevices}
                        suffix={`/ ${liveData.totalDevices}`}
                        valueStyle={{ color: "#52c41a" }}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} md={12}>
                    <Card>
                      <Statistic title="Live Events" value={liveData.events} valueStyle={{ color: token.colorPrimary }} />
                    </Card>
                  </Col>
                  <Col xs={12} md={12}>
                    <Card>
                      <Statistic title="Anomalies" value={liveData.anomalies} valueStyle={{ color: "#faad14" }} />
                    </Card>
                  </Col>
                  <Col xs={12} md={12}>
                    <Card>
                      <Statistic title="Critical Alerts" value={liveData.alerts} valueStyle={{ color: "#ff4d4f" }} />
                    </Card>
                  </Col>
                </Row>
              </Col>
              <Col xs={24} lg={10}>
                <Card title="AI Rule Engine (Running Rules)" size="small">
                  <List
                    dataSource={[
                      { id: 1, rule: "Temperature > 50°C for 2m → Alert: HIGH", status: "active", lastRun: "1m ago" },
                      { id: 2, rule: "Humidity < 20% for 5m → Alert: MEDIUM", status: "inactive", lastRun: "—" },
                      { id: 3, rule: "Motion at night (22:00–06:00) → Notify Security", status: "active", lastRun: "12m ago" },
                    ]}
                    renderItem={(r) => (
                      <List.Item key={r.id}>
                        <Space direction="vertical" size={0} style={{ width: "100%" }}>
                          <Space>
                            {r.status === "active" ? (
                              <CheckCircleTwoTone twoToneColor="#52c41a" />
                            ) : (
                              <CloseCircleTwoTone twoToneColor="#ff4d4f" />
                            )}
                            <Text strong>{r.rule}</Text>
                          </Space>
                          <Text type="secondary" style={{ fontSize: 12 }}>Last run: {r.lastRun}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>

            {/* 3) Live Events (SCROLLABLE, fixed height, after the cards) */}
            <Row>
              <Col span={24}>
                <Card
                  title="Live Events"
                  size="small"
                  bodyStyle={{
                    paddingTop: 8,
                    background: token.colorBgContainer,
                    height: "40vh",          // fixed height
                    overflowY: "auto",       // scroll inside
                  }}
                >
                  <List
                    dataSource={liveEvents}
                    renderItem={(ev) => (
                      <List.Item key={ev.id} style={{ alignItems: "flex-start" }}>
                        <Space align="start">
                          <Avatar
                            style={{ backgroundColor: ev.severity === "CRITICAL" ? "#ff4d4f" : ev.severity === "HIGH" ? "#fa541c" : "#faad14" }}
                            icon={ev.icon}
                          />
                          <Space direction="vertical" size={2}>
                            <Space wrap>
                              <Text strong>{ev.message}</Text>
                              <Tag color={ev.severity === "CRITICAL" ? "red" : ev.severity === "HIGH" ? "volcano" : "gold"}>
                                {ev.severity}
                              </Tag>
                            </Space>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <EnvironmentOutlined /> {ev.location} • Device: {ev.device} •{" "}
                              {dayjs(ev.ts).format("YYYY-MM-DD HH:mm:ss")}
                            </Text>
                            <Space size={[4, 4]} wrap>
                              {ev.tags.map((t, i) => (
                                <Tag key={i} color="geekblue">
                                  {t}
                                </Tag>
                              ))}
                            </Space>
                          </Space>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* ============ CHAT (unchanged aside from earlier fixes) ============ */}
          <TabPane tab="Chat" key="chat">
            <div
              className="ai-chat-container"
              style={{
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                height: "60vh", // fixed to prevent page growth
              }}
            >
              <div
                className="messages-container"
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: 16,
                  backgroundColor: token.colorBgContainer,
                  borderRadius: 8,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                {messages.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <RobotOutlined style={{ fontSize: 48, color: token.colorPrimary, marginBottom: 16 }} />
                    <Title level={3}>Welcome to AI Query Assistant</Title>
                    <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 24 }}>
                      Ask me anything about your IoT devices—or just say “Hi”.
                    </Paragraph>
                    <Row gutter={[8, 8]} justify="center">
                      {quickQuestions.map((q, i) => (
                        <Col key={i}>
                          <Button type="dashed" onClick={() => setInputValue(q)}>
                            {q}
                          </Button>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ) : (
                  <>
                    {messages.map(renderMessage)}
                    {isTyping && (
                      <div
                        className="chat-bubble typing-bubble"
                        style={{
                          marginTop: 8,
                          backgroundColor: token.colorFillSecondary,
                          borderRadius: 8,
                          padding: 12,
                          color: token.colorText,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                          <Avatar
                            icon={<RobotOutlined />}
                            style={{ backgroundColor: token.colorPrimary, color: token.colorTextLightSolid }}
                          />
                          <span style={{ marginLeft: 8, color: token.colorTextSecondary }}>Thinking...</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Spin size="small" />
                          <Text style={{ color: token.colorTextSecondary }}>AI is analyzing your query…</Text>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Composer */}
              <div
                style={{
                  padding: 16,
                  borderTop: `1px solid ${token.colorBorderSecondary}`,
                  backgroundColor: token.colorBgContainer,
                  borderRadius: "0 0 8px 8px",
                }}
              >
                <Space.Compact style={{ width: "100%" }}>
                  <TextArea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask anything (e.g., 'Show me device list that triggered alerts in the last 24 hours')"
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    loading={isLoading}
                    disabled={!inputValue.trim()}
                  >
                    Send
                  </Button>
                </Space.Compact>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Content>

      {/* Drawer (kept) */}
      <Drawer
        title="Live Analysis Dashboard"
        placement="right"
        width={600}
        onClose={() => setSidebarVisible(false)}
        open={sidebarVisible}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Overview" key="overview">
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              <Card title="Model KPIs" size="small">
                <Row gutter={16}>
                  <Col span={8}><Statistic title="TPS" value={aiOps.tps} /></Col>
                  <Col span={8}><Statistic title="Latency (ms)" value={aiOps.latencyMs} /></Col>
                  <Col span={8}><Statistic title="Errors (%)" value={aiOps.errorPct} precision={2} /></Col>
                </Row>
              </Card>
            </Space>
          </TabPane>

          <TabPane tab="Recent Events" key="events">
            <Timeline>
              {liveEvents.slice(0, 6).map((ev) => (
                <Timeline.Item
                  key={ev.id}
                  dot={ev.icon}
                  color={ev.severity === "CRITICAL" ? "red" : ev.severity === "HIGH" ? "orange" : "gold"}
                >
                  <Card size="small">
                    <Space direction="vertical" size={2}>
                      <Text strong>{ev.message}</Text>
                      <Text type="secondary">
                        <EnvironmentOutlined /> {ev.location} • Device: {ev.device} • {dayjs(ev.ts).format("YYYY-MM-DD HH:mm:ss")}
                      </Text>
                      <Space size={[4, 4]} wrap>
                        <Tag color={ev.severity === "CRITICAL" ? "red" : ev.severity === "HIGH" ? "volcano" : "gold"}>
                          {ev.severity}
                        </Tag>
                        {ev.tags.map((t, i) => (
                          <Tag key={i} color="geekblue">
                            {t}
                          </Tag>
                        ))}
                      </Space>
                    </Space>
                  </Card>
                </Timeline.Item>
              ))}
            </Timeline>
          </TabPane>
        </Tabs>
      </Drawer>

      {/* Subtle animations */}
      <style>{`
        @keyframes slideUpFade {
          from { transform: translateY(6px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .chat-bubble { animation: slideUpFade .22s ease-out both; }
        @keyframes pulseSoft {
          0% { opacity: .85; }
          50% { opacity: 1; }
          100% { opacity: .85; }
        }
        .typing-bubble { animation: pulseSoft 1.2s ease-in-out infinite; }
      `}</style>
    </Layout>
  );
}

// "use client";

// import { useState, useEffect, useRef } from "react";
// import {
//   Layout,
//   Card,
//   Input,
//   Button,
//   Typography,
//   Space,
//   Avatar,
//   Tag,
//   Select,
//   Switch,
//   Row,
//   Col,
//   Statistic,
//   Progress,
//   Timeline,
//   Alert,
//   Spin,
//   Drawer,
//   Tabs,
//   List,
//   DatePicker,
//   message as antdMessage,
//   Checkbox,
//   theme as antdTheme,
// } from "antd";
// import {
//   SendOutlined,
//   RobotOutlined,
//   UserOutlined,
//   ThunderboltOutlined,
//   ClockCircleOutlined,
//   EnvironmentOutlined,
//   CarOutlined,
//   FireOutlined,
//   DropboxOutlined,
//   BulbOutlined,
//   SettingOutlined,
//   BarChartOutlined,
//   ExclamationCircleOutlined,
//   CheckCircleTwoTone,
//   CloseCircleTwoTone,
// } from "@ant-design/icons";
// import { Line, Bar, Pie } from "@ant-design/plots";
// import dayjs from "dayjs";
// import { useTheme } from "../components/theme/ThemeProvider";

// const { Content } = Layout;
// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;
// const { TabPane } = Tabs;
// const { RangePicker } = DatePicker;

// const API_BASE = process.env.NEXT_PUBLIC_AI_API_BASE || "http://localhost:8096";

// /** Utility */
// const toIsoOrNull = (d) => (d ? dayjs(d).toISOString() : null);

// /** Device Alerts list (from server structured data) */
// const DeviceAlertList = ({ items }) => {
//   if (!items || items.length === 0) {
//     return <Alert type="info" showIcon message="No devices with alerts in the requested window." />;
//   }
//   return (
//     <List
//       dataSource={items}
//       renderItem={(it) => (
//         <List.Item>
//           <Card size="small" style={{ width: "100%" }}>
//             <Row gutter={12} align="middle">
//               <Col xs={24} md={18}>
//                 <Space direction="vertical" size="small">
//                   <Space wrap>
//                     <Text strong>{it.deviceId}</Text>
//                     {it.deviceType && <Tag color="geekblue">{it.deviceType}</Tag>}
//                     {it.location && (
//                       <Tag icon={<EnvironmentOutlined />} color="green">
//                         {it.location}
//                       </Tag>
//                     )}
//                     {it.severity && (
//                       <Tag
//                         color={
//                           it.severity === "CRITICAL"
//                             ? "red"
//                             : it.severity === "HIGH"
//                             ? "volcano"
//                             : it.severity === "MEDIUM"
//                             ? "gold"
//                             : "blue"
//                         }
//                       >
//                         {it.severity}
//                       </Tag>
//                     )}
//                   </Space>
//                   <Text type="secondary" style={{ fontSize: 13 }}>
//                     <ClockCircleOutlined /> Latest:{" "}
//                     {it.latestTs ? dayjs(it.latestTs).format("YYYY-MM-DD HH:mm:ss") : "n/a"}
//                     {typeof it.count === "number" ? ` • Count: ${it.count}` : ""}
//                   </Text>
//                   {it.sampleReasons?.length > 0 && (
//                     <Text type="secondary" style={{ fontSize: 13 }}>
//                       Reasons: {it.sampleReasons.join("; ")}
//                     </Text>
//                   )}
//                 </Space>
//               </Col>
//             </Row>
//           </Card>
//         </List.Item>
//       )}
//     />
//   );
// };

// const StructuredBlock = ({ data }) => {
//   if (!data) return null;
//   if (data.type === "device_alert_list") {
//     return (
//       <>
//         <Title level={5} style={{ marginTop: 12 }}>
//           Devices that triggered alerts
//         </Title>
//         <DeviceAlertList items={data.items || []} />
//       </>
//     );
//   }
//   return (
//     <Card size="small" style={{ marginTop: 12 }}>
//       <pre style={{ margin: 0 }}>{JSON.stringify(data, null, 2)}</pre>
//     </Card>
//   );
// };

// export default function AIQueryPage() {
//   const { token } = antdTheme.useToken();
//   const { theme } = useTheme();

//   // Main tabs: live / chat
//   const [activeMainTab, setActiveMainTab] = useState("live");

//   // Chat state
//   const [messages, setMessages] = useState([]);
//   const [inputValue, setInputValue] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const messagesEndRef = useRef(null);
//   const inputRef = useRef(null);

//   // Drawer state (kept)
//   const [sidebarVisible, setSidebarVisible] = useState(false);
//   const [activeTab, setActiveTab] = useState("overview");

//   // Filters / controls
//   const [tenantHeader, setTenantHeader] = useState("tenant1");
//   const [deviceId, setDeviceId] = useState("");
//   const [deviceType, setDeviceType] = useState("");
//   const [contextMode, setContextMode] = useState("smart");
//   const [onlyAlerts, setOnlyAlerts] = useState(false);
//   const [location, setLocation] = useState("");
//   const [dateRange, setDateRange] = useState(null);
//   const [topK, setTopK] = useState(10);
//   const [liveAnalysis, setLiveAnalysis] = useState(true);

//   // Live demo tiles
//   const [liveData, setLiveData] = useState({
//     totalDevices: 1247,
//     activeDevices: 1198,
//     anomalies: 23,
//     alerts: 7,
//     events: 156,
//     dataPoints: 45672,
//   });

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setLiveData((prev) => ({
//         ...prev,
//         events: prev.events + Math.floor(Math.random() * 3),
//         dataPoints: prev.dataPoints + Math.floor(Math.random() * 50),
//       }));
//     }, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // Charts demo data
//   const deviceStatusData = [
//     { type: "Online", value: 1198, color: "#52c41a" },
//     { type: "Offline", value: 49, color: "#ff4d4f" },
//   ];
//   const eventTrendData = [
//     { time: "00:00", events: 12 },
//     { time: "04:00", events: 8 },
//     { time: "08:00", events: 25 },
//     { time: "12:00", events: 45 },
//     { time: "16:00", events: 38 },
//     { time: "20:00", events: 28 },
//   ];
//   const anomalyTrendData = [
//     { category: "Temperature", count: 8 },
//     { category: "Humidity", count: 5 },
//     { category: "Vibration", count: 4 },
//     { category: "Pressure", count: 3 },
//     { category: "Motion", count: 3 },
//   ];

//   const aiRuleEngineData = [
//     { id: 1, rule: "Temperature > 50°C for 2m → Alert: HIGH", status: "active", lastRun: "2m ago" },
//     { id: 2, rule: "Humidity < 20% for 5m → Alert: MEDIUM", status: "inactive", lastRun: "—" },
//     { id: 3, rule: "Motion at night (22:00–06:00) → Notify Security", status: "active", lastRun: "15m ago" },
//   ];

//   const getSeverityColor = (severity) => {
//     switch (severity) {
//       case "critical":
//         return "#ff4d4f";
//       case "high":
//         return "#ff7a45";
//       case "warning":
//       case "medium":
//         return "#faad14";
//       case "info":
//         return "#1890ff";
//       case "low":
//         return "#52c41a";
//       default:
//         return "#d9d9d9";
//     }
//   };

//   const getEventIcon = (type) => {
//     switch (type) {
//       case "license_plate":
//         return <CarOutlined />;
//       case "fire_detection":
//         return <FireOutlined />;
//       case "water_leak":
//         return <DropboxOutlined />;
//       case "door_access":
//         return <BulbOutlined />;
//       default:
//         return <ThunderboltOutlined />;
//     }
//   };

//   /** Backend call — preserves your filters */
//   const callBackend = async (naturalLanguageQuery) => {
//     setIsLoading(true);
//     setIsTyping(true);

//     try {
//       const body = {
//         query: naturalLanguageQuery,
//         deviceId: deviceId?.trim() || undefined,
//         deviceType: deviceType?.trim() || undefined,
//         fromTs: dateRange?.[0] ? dayjs(dateRange[0]).valueOf() : undefined,
//         toTs: dateRange?.[1] ? dayjs(dateRange[1]).valueOf() : undefined,
//         topK,
//         contextMode,
//         location: location?.trim() || undefined,
//         onlyAlerts: onlyAlerts || undefined,
//       };

//       const res = await fetch(`${API_BASE}/api/ai/query`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "X-Tenant-Id": tenantHeader || "default-tenant",
//         },
//         body: JSON.stringify(body),
//       });

//       if (!res.ok) {
//         const errText = await res.text();
//         throw new Error(errText || `HTTP ${res.status}`);
//       }

//       const data = await res.json();
//       const aiMessage = {
//         id: Date.now() + 1,
//         type: "ai",
//         timestamp: new Date(),
//         content: data.content || "",
//         data: data.data || null,
//         charts: data.charts || null,
//         provider: data.provider || "unknown",
//       };

//       setMessages((prev) => [...prev, aiMessage]);
//     } catch (e) {
//       console.error(e);
//       antdMessage.error("Query failed. Check server logs / network.");
//       setMessages((prev) => [
//         ...prev,
//         {
//           id: Date.now() + 1,
//           type: "ai",
//           timestamp: new Date(),
//           content: "Sorry—something went wrong while fetching the answer. Please try again.",
//           data: null,
//           charts: null,
//         },
//       ]);
//     } finally {
//       setIsLoading(false);
//       setIsTyping(false);
//     }
//   };

//   const handleSendMessage = async () => {
//     const q = inputValue.trim();
//     if (!q) return;

//     const userMessage = {
//       id: Date.now(),
//       type: "user",
//       content: q,
//       timestamp: new Date(),
//     };
//     setMessages((prev) => [...prev, userMessage]);
//     setInputValue("");

//     await callBackend(q);
//   };

//   const renderMessage = (message) => {
//     const isUser = message.type === "user";
//     return (
//       <div key={message.id} className={`ai-message ${isUser ? "user-message" : "ai-response"}`} style={{ marginBottom: 16 }}>
//         <div className="message-header" style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
//           <Avatar
//             icon={isUser ? <UserOutlined /> : <RobotOutlined />}
//             style={isUser ? {} : { backgroundColor: token.colorPrimary, color: token.colorTextLightSolid }}
//           />
//           <span className="message-time" style={{ marginLeft: 8, fontSize: 12, color: token.colorTextSecondary }}>
//             {new Date(message.timestamp).toLocaleTimeString()}
//           </span>
//         </div>

//         <div
//           className="message-content"
//           style={{
//             color: token.colorText,            // ✅ dark mode text fixed
//             backgroundColor: isUser ? token.colorPrimaryBg : token.colorFillSecondary,
//             padding: 12,
//             borderRadius: 8,
//             fontSize: 15,
//             lineHeight: 1.6,
//           }}
//         >
//           <Text style={{ color: token.colorText }}>{message.content}</Text>

//           {/* structured block from server */}
//           {!isUser && message.data && <StructuredBlock data={message.data} />}

//           {/* simple chart hook; if backend returns charts */}
//           {!isUser && message.charts?.type === "temperature_trend" && (
//             <div style={{ marginTop: 12 }}>
//               <Title level={5}>Temperature Trend (24h)</Title>
//               <Line data={message.charts.data || []} xField="time" yField="temperature" smooth height={200} />
//             </div>
//           )}

//           {/* provider footer */}
//           {!isUser && message.provider && (
//             <div style={{ marginTop: 6 }}>
//               <Tag icon={<ExclamationCircleOutlined />}>provider: {message.provider}</Tag>
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   };

//   const quickQuestions = [
//     "Hi",
//     "What changed in my devices today?",
//     "Show me device list that triggered alerts in the last 24 hours.",
//     "Any fire alerts in the last hour?",
//     "Temperature anomalies in server room",
//   ];

//   return (
//     <Layout className="ai-query-page">
//       <Content style={{ padding: 24, height: "100vh", display: "flex", flexDirection: "column" }}>
//         {/* Header */}
//         <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
//           <Col flex="auto">
//             <Title level={2} style={{ margin: 0 }}>
//               <RobotOutlined style={{ marginRight: 8, color: token.colorPrimary }} />
//               AI Query Assistant
//             </Title>
//             <Text type="secondary">Ask about your IoT devices, events, anomalies—or just chat.</Text>
//           </Col>
//           <Col>
//             <Space>
//               <Button icon={<BarChartOutlined />} onClick={() => setSidebarVisible(true)}>
//                 Live Analysis
//               </Button>
//               <Button icon={<SettingOutlined />}>Settings</Button>
//             </Space>
//           </Col>
//         </Row>

//         {/* Main Tabs */}
//         <Tabs activeKey={activeMainTab} onChange={setActiveMainTab}>
//           {/* LIVE ANALYSIS TAB */}
//           <TabPane tab="Live Analysis" key="live">
//             {/* Filters / Controls (responsive) */}
//             <Card style={{ marginBottom: 16 }} bodyStyle={{ paddingBottom: 8 }}>
//               <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
//                 <Col xs={24} md={6}>
//                   <Input value={tenantHeader} onChange={(e) => setTenantHeader(e.target.value)} placeholder="X-Tenant-Id (header)" />
//                 </Col>
//                 <Col xs={24} md={6}>
//                   <Input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="Device ID (optional)" />
//                 </Col>
//                 <Col xs={24} md={6}>
//                   <Input value={deviceType} onChange={(e) => setDeviceType(e.target.value)} placeholder="Device Type (optional)" />
//                 </Col>
//                 <Col xs={24} md={6}>
//                   <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (optional)" />
//                 </Col>
//               </Row>

//               <Row gutter={[12, 12]} style={{ marginBottom: 8 }}>
//                 <Col xs={24} md={10}>
//                   <RangePicker
//                     style={{ width: "100%" }}
//                     showTime
//                     value={dateRange}
//                     onChange={(v) => setDateRange(v)}
//                     allowClear
//                   />
//                 </Col>
//                 <Col xs={24} md={4}>
//                   <Select value={contextMode} onChange={setContextMode} style={{ width: "100%" }} placeholder="Context Mode">
//                     <Option value="smart">Smart Context</Option>
//                     <Option value="detailed">Detailed Analysis</Option>
//                     <Option value="summary">Summary Only</Option>
//                   </Select>
//                 </Col>
//                 <Col xs={24} md={4}>
//                   <Input
//                     type="number"
//                     min={1}
//                     max={50}
//                     value={topK}
//                     onChange={(e) => setTopK(Number(e.target.value || 10))}
//                     placeholder="topK"
//                   />
//                 </Col>
//                 <Col xs={12} md={3}>
//                   <Checkbox checked={onlyAlerts} onChange={(e) => setOnlyAlerts(e.target.checked)}>
//                     Only Alerts
//                   </Checkbox>
//                 </Col>
//                 <Col xs={12} md={3}>
//                   <Space>
//                     <Text>Live:</Text>
//                     <Switch checked={liveAnalysis} onChange={setLiveAnalysis} checkedChildren="ON" unCheckedChildren="OFF" />
//                   </Space>
//                 </Col>
//               </Row>
//             </Card>

//             {/* KPIs */}
//             {liveAnalysis && (
//               <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
//                 <Col xs={12} md={6}>
//                   <Card>
//                     <Statistic
//                       title="Active Devices"
//                       value={liveData.activeDevices}
//                       suffix={`/ ${liveData.totalDevices}`}
//                       valueStyle={{ color: "#52c41a" }}
//                     />
//                   </Card>
//                 </Col>
//                 <Col xs={12} md={6}>
//                   <Card>
//                     <Statistic title="Live Events" value={liveData.events} valueStyle={{ color: "#1890ff" }} />
//                   </Card>
//                 </Col>
//                 <Col xs={12} md={6}>
//                   <Card>
//                     <Statistic title="Anomalies" value={liveData.anomalies} valueStyle={{ color: "#faad14" }} />
//                   </Card>
//                 </Col>
//                 <Col xs={12} md={6}>
//                   <Card>
//                     <Statistic title="Critical Alerts" value={liveData.alerts} valueStyle={{ color: "#ff4d4f" }} />
//                   </Card>
//                 </Col>
//               </Row>
//             )}

//             {/* Charts + AI Rule Engine (responsive) */}
//             <Row gutter={[16, 16]}>
//               <Col xs={24} lg={12}>
//                 <Card title="Device Status Distribution" size="small" bodyStyle={{ paddingTop: 8 }}>
//                   <Pie
//                     data={deviceStatusData}
//                     angleField="value"
//                     colorField="type"
//                     radius={0.8}
//                     height={220}
//                     legend={{ position: "bottom" }}
//                   />
//                 </Card>
//               </Col>
//               <Col xs={24} lg={12}>
//                 <Card title="Event Trend (24h)" size="small" bodyStyle={{ paddingTop: 8 }}>
//                   <Line data={eventTrendData} xField="time" yField="events" smooth height={220} />
//                 </Card>
//               </Col>
//             </Row>

//             <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
//               <Col xs={24} lg={12}>
//                 <Card title="Anomaly Categories" size="small" bodyStyle={{ paddingTop: 8 }}>
//                   <Bar data={anomalyTrendData} xField="category" yField="count" height={220} />
//                 </Card>
//               </Col>
//               <Col xs={24} lg={12}>
//                 <Card title="AI Rule Engine (Running Rules)" size="small">
//                   <List
//                     dataSource={aiRuleEngineData}
//                     renderItem={(r) => (
//                       <List.Item key={r.id}>
//                         <Space size="small" direction="vertical" style={{ width: "100%" }}>
//                           <Space>
//                             {r.status === "active" ? (
//                               <CheckCircleTwoTone twoToneColor="#52c41a" />
//                             ) : (
//                               <CloseCircleTwoTone twoToneColor="#ff4d4f" />
//                             )}
//                             <Text strong>{r.rule}</Text>
//                           </Space>
//                           <Text type="secondary" style={{ fontSize: 12 }}>
//                             Last run: {r.lastRun}
//                           </Text>
//                         </Space>
//                       </List.Item>
//                     )}
//                   />
//                 </Card>
//               </Col>
//             </Row>
//           </TabPane>

//           {/* CHAT TAB */}
//           <TabPane tab="Chat" key="chat">
//             <div className="ai-chat-container" style={{ display: "flex", flexDirection: "column", minHeight: 0, height: "60vh" }}>
//               <div
//                 className="messages-container"
//                 style={{
//                   flex: 1,
//                   overflowY: "auto",
//                   padding: 16,
//                   backgroundColor: token.colorBgContainer, // ✅ dark/light token
//                   borderRadius: 8,
//                   border: `1px solid ${token.colorBorderSecondary}`,
//                 }}
//               >
//                 {messages.length === 0 ? (
//                   <div className="welcome-message" style={{ textAlign: "center", padding: "40px 20px" }}>
//                     <RobotOutlined style={{ fontSize: 48, color: token.colorPrimary, marginBottom: 16 }} />
//                     <Title level={3}>Welcome to AI Query Assistant</Title>
//                     <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 24 }}>
//                       Ask me anything about your IoT devices—or just say “Hi”.
//                       Use the filters in Live Analysis to scope results.
//                     </Paragraph>

//                     <div className="quick-questions">
//                       <Title level={4}>Try asking:</Title>
//                       <Row gutter={[8, 8]} justify="center">
//                         {["Hi", "What changed in my devices today?", "Any fire alerts in the last hour?"].map((q, i) => (
//                           <Col key={i}>
//                             <Button type="dashed" onClick={() => setInputValue(q)} style={{ textAlign: "left" }}>
//                               {q}
//                             </Button>
//                           </Col>
//                         ))}
//                       </Row>
//                     </div>
//                   </div>
//                 ) : (
//                   <>
//                     {messages.map(renderMessage)}
//                     {isTyping && (
//                       <div className="ai-message ai-response typing" style={{ color: token.colorTextSecondary }}>
//                         <div className="message-header" style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
//                           <Avatar icon={<RobotOutlined />} style={{ backgroundColor: token.colorPrimary, color: token.colorTextLightSolid }} />
//                           <span className="message-time" style={{ marginLeft: 8 }}>Thinking...</span>
//                         </div>
//                         <div className="message-content">
//                           <Spin size="small" /> <Text type="secondary">AI is analyzing your query...</Text>
//                         </div>
//                       </div>
//                     )}
//                     <div ref={messagesEndRef} />
//                   </>
//                 )}
//               </div>

//               {/* Composer */}
//               <div
//                 className="input-container"
//                 style={{
//                   padding: 16,
//                   borderTop: `1px solid ${token.colorBorderSecondary}`,
//                   backgroundColor: token.colorBgContainer,
//                   borderRadius: "0 0 8px 8px",
//                 }}
//               >
//                 <Space.Compact style={{ width: "100%" }}>
//                   <TextArea
//                     ref={inputRef}
//                     value={inputValue}
//                     onChange={(e) => setInputValue(e.target.value)}
//                     placeholder="Ask anything (e.g., 'Show me device list that triggered alerts in the last 24 hours')"
//                     autoSize={{ minRows: 1, maxRows: 4 }}
//                     onPressEnter={(e) => {
//                       if (!e.shiftKey) {
//                         e.preventDefault();
//                         handleSendMessage();
//                       }
//                     }}
//                     style={{ flex: 1 }}
//                   />
//                   <Button
//                     type="primary"
//                     icon={<SendOutlined />}
//                     onClick={handleSendMessage}
//                     loading={isLoading}
//                     disabled={!inputValue.trim()}
//                   >
//                     Send
//                   </Button>
//                 </Space.Compact>
//               </div>
//             </div>
//           </TabPane>
//         </Tabs>
//       </Content>

//       {/* Drawer: Live Analysis (kept) */}
//       <Drawer
//         title="Live Analysis Dashboard"
//         placement="right"
//         width={600}
//         onClose={() => setSidebarVisible(false)}
//         open={sidebarVisible}
//       >
//         <Tabs activeKey={activeTab} onChange={setActiveTab}>
//           <TabPane tab="Overview" key="overview">
//             <Space direction="vertical" style={{ width: "100%" }} size="large">
//               <Card title="Device Status Distribution" size="small">
//                 <Pie data={deviceStatusData} angleField="value" colorField="type" radius={0.8} height={200} legend={{ position: "bottom" }} />
//               </Card>
//               <Card title="Event Trend (24h)" size="small">
//                 <Line data={eventTrendData} xField="time" yField="events" smooth height={200} />
//               </Card>
//               <Card title="Anomaly Categories" size="small">
//                 <Bar data={anomalyTrendData} xField="category" yField="count" height={200} />
//               </Card>
//             </Space>
//           </TabPane>

//           <TabPane tab="Recent Events" key="events">
//             <Timeline>
//               {[{
//                 id: 1, type: "fire_detection", message: "Fire detected in Building A, Floor 3", location: "Building A - Floor 3",
//                 timestamp: new Date(), severity: "critical", device: "Fire-Sensor-A3-01"
//               }].map((event) => (
//                 <Timeline.Item key={event.id} dot={getEventIcon(event.type)} color={getSeverityColor(event.severity)}>
//                   <Card size="small">
//                     <Space direction="vertical" size="small">
//                       <Text strong>{event.message}</Text>
//                       <Text type="secondary"><EnvironmentOutlined /> {event.location}</Text>
//                       <Text type="secondary">Device: {event.device}</Text>
//                       <Text type="secondary">{new Date(event.timestamp).toLocaleString()}</Text>
//                       <Tag color={getSeverityColor(event.severity)}>{String(event.severity).toUpperCase()}</Tag>
//                     </Space>
//                   </Card>
//                 </Timeline.Item>
//               ))}
//             </Timeline>
//           </TabPane>
//         </Tabs>
//       </Drawer>
//     </Layout>
//   );
// }

// // "use client";

// // import { useState, useEffect, useRef } from "react";
// // import {
// //   Layout,
// //   Card,
// //   Input,
// //   Button,
// //   Typography,
// //   Space,
// //   Avatar,
// //   Tag,
// //   Select,
// //   Switch,
// //   Badge,
// //   Row,
// //   Col,
// //   Statistic,
// //   Progress,
// //   Timeline,
// //   Alert,
// //   Spin,
// //   Drawer,
// //   Tabs,
// //   List,
// //   DatePicker,
// //   message as antdMessage,
// //   Checkbox,
// //   theme as antdTheme, // ✅ tokens for dark/light fixes
// // } from "antd";
// // import {
// //   SendOutlined,
// //   RobotOutlined,
// //   UserOutlined,
// //   ThunderboltOutlined,
// //   ClockCircleOutlined,
// //   EnvironmentOutlined,
// //   CarOutlined,
// //   FireOutlined,
// //   DropboxOutlined,
// //   BulbOutlined,
// //   SettingOutlined,
// //   BarChartOutlined,
// //   ExclamationCircleOutlined,
// // } from "@ant-design/icons";
// // import { Line, Bar, Pie } from "@ant-design/plots";
// // import dayjs from "dayjs";
// // import { useTheme } from "../components/theme/ThemeProvider";

// // const { Content } = Layout;
// // const { Title, Text, Paragraph } = Typography;
// // const { TextArea } = Input;
// // const { Option } = Select;
// // const { TabPane } = Tabs;
// // const { RangePicker } = DatePicker;

// // const API_BASE = process.env.NEXT_PUBLIC_AI_API_BASE || "http://localhost:8096";

// // /**
// //  * Utility: format ISO safely
// //  */
// // const toIsoOrNull = (d) => (d ? dayjs(d).toISOString() : null);

// // /**
// //  * Maps server `data.type` => UI renderers
// //  * Currently handles `device_alert_list`, easy to extend for others.
// //  */
// // const DeviceAlertList = ({ items }) => {
// //   if (!items || items.length === 0) {
// //     return (
// //       <Alert
// //         type="info"
// //         showIcon
// //         message="No devices with alerts in the requested window."
// //       />
// //     );
// //   }
// //   return (
// //     <List
// //       dataSource={items}
// //       renderItem={(it) => (
// //         <List.Item>
// //           <Card size="small" style={{ width: "100%" }}>
// //             <Row gutter={12} align="middle">
// //               <Col xs={24} md={18}>
// //                 <Space direction="vertical" size="small">
// //                   <Space wrap>
// //                     <Text strong>{it.deviceId}</Text>
// //                     {it.deviceType && <Tag color="geekblue">{it.deviceType}</Tag>}
// //                     {it.location && (
// //                       <Tag icon={<EnvironmentOutlined />} color="green">
// //                         {it.location}
// //                       </Tag>
// //                     )}
// //                     {it.severity && (
// //                       <Tag color={
// //                         it.severity === "CRITICAL" ? "red" :
// //                         it.severity === "HIGH" ? "volcano" :
// //                         it.severity === "MEDIUM" ? "gold" : "blue"
// //                       }>
// //                         {it.severity}
// //                       </Tag>
// //                     )}
// //                   </Space>
// //                   <Text type="secondary">
// //                     <ClockCircleOutlined /> Latest:{" "}
// //                     {it.latestTs
// //                       ? dayjs(it.latestTs).format("YYYY-MM-DD HH:mm:ss")
// //                       : "n/a"}
// //                     {typeof it.count === "number" ? ` • Count: ${it.count}` : ""}
// //                   </Text>
// //                   {it.sampleReasons && it.sampleReasons.length > 0 && (
// //                     <Text type="secondary">
// //                       Reasons: {it.sampleReasons.join("; ")}
// //                     </Text>
// //                   )}
// //                 </Space>
// //               </Col>
// //             </Row>
// //           </Card>
// //         </List.Item>
// //       )}
// //     />
// //   );
// // };

// // const StructuredBlock = ({ data }) => {
// //   if (!data) return null;
// //   if (data.type === "device_alert_list") {
// //     return (
// //       <>
// //         <Title level={5} style={{ marginTop: 12 }}>
// //           Devices that triggered alerts
// //         </Title>
// //         <DeviceAlertList items={data.items || []} />
// //       </>
// //     );
// //   }
// //   // fallback generic renderer if you add more types later
// //   return (
// //     <Card size="small" style={{ marginTop: 12 }}>
// //       <pre style={{ margin: 0 }}>{JSON.stringify(data, null, 2)}</pre>
// //     </Card>
// //   );
// // };

// // /**
// //  * Main page
// //  */
// // export default function AIQueryPage() {
// //   const { theme } = useTheme();
// //   const { token } = antdTheme.useToken(); // ✅ theme tokens
// //   const [activeMainTab, setActiveMainTab] = useState("live"); // ✅ main tabs: live / chat

// //   const [messages, setMessages] = useState([]);
// //   const [inputValue, setInputValue] = useState("");
// //   const [isLoading, setIsLoading] = useState(false);
// //   const [isTyping, setIsTyping] = useState(false);
// //   const [sidebarVisible, setSidebarVisible] = useState(false);
// //   const [activeTab, setActiveTab] = useState("overview");
// //   const messagesEndRef = useRef(null);
// //   const inputRef = useRef(null);

// //   // Filters / controls
// //   const [tenantHeader, setTenantHeader] = useState("tenant1"); // your app can set this from auth
// //   const [deviceId, setDeviceId] = useState("");
// //   const [deviceType, setDeviceType] = useState("");
// //   const [contextMode, setContextMode] = useState("smart");
// //   const [onlyAlerts, setOnlyAlerts] = useState(false);
// //   const [location, setLocation] = useState("");
// //   const [dateRange, setDateRange] = useState(null); // [start, end] dayjs[]
// //   const [topK, setTopK] = useState(10);
// //   const [liveAnalysis, setLiveAnalysis] = useState(true);

// //   // Live cards (demo)
// //   const [liveData, setLiveData] = useState({
// //     totalDevices: 1247,
// //     activeDevices: 1198,
// //     anomalies: 23,
// //     alerts: 7,
// //     events: 156,
// //     dataPoints: 45672,
// //   });

// //   useEffect(() => {
// //     const interval = setInterval(() => {
// //       setLiveData((prev) => ({
// //         ...prev,
// //         events: prev.events + Math.floor(Math.random() * 3),
// //         dataPoints: prev.dataPoints + Math.floor(Math.random() * 50),
// //       }));
// //     }, 5000);
// //     return () => clearInterval(interval);
// //   }, []);

// //   useEffect(() => {
// //     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
// //   }, [messages]);

// //   // Simple live charts data (static demo)
// //   const deviceStatusData = [
// //     { type: "Online", value: 1198, color: "#52c41a" },
// //     { type: "Offline", value: 49, color: "#ff4d4f" },
// //   ];
// //   const eventTrendData = [
// //     { time: "00:00", events: 12 },
// //     { time: "04:00", events: 8 },
// //     { time: "08:00", events: 25 },
// //     { time: "12:00", events: 45 },
// //     { time: "16:00", events: 38 },
// //     { time: "20:00", events: 28 },
// //   ];
// //   const anomalyTrendData = [
// //     { category: "Temperature", count: 8 },
// //     { category: "Humidity", count: 5 },
// //     { category: "Vibration", count: 4 },
// //     { category: "Pressure", count: 3 },
// //     { category: "Motion", count: 3 },
// //   ];

// //   const getSeverityColor = (severity) => {
// //     switch (severity) {
// //       case "critical":
// //         return "#ff4d4f";
// //       case "high":
// //         return "#ff7a45";
// //       case "warning":
// //         return "#faad14";
// //       case "medium":
// //         return "#faad14";
// //       case "info":
// //         return "#1890ff";
// //       case "low":
// //         return "#52c41a";
// //       default:
// //         return "#d9d9d9";
// //     }
// //   };

// //   const getEventIcon = (type) => {
// //     switch (type) {
// //       case "license_plate":
// //         return <CarOutlined />;
// //       case "fire_detection":
// //         return <FireOutlined />;
// //       case "water_leak":
// //         return <DropboxOutlined />;
// //       case "door_access":
// //         return <BulbOutlined />;
// //       default:
// //         return <ThunderboltOutlined />;
// //     }
// //   };

// //   /**
// //    * Core: send query to backend
// //    * - Sends **exactly** what your AiQueryController expects
// //    * - General chit-chat is supported (no filters required)
// //    * - If filters are set, we include them
// //    */
// //   const callBackend = async (naturalLanguageQuery) => {
// //     setIsLoading(true);
// //     setIsTyping(true);

// //     try {
// //       // Build request body (AiQueryRequest)
// //       const body = {
// //         query: naturalLanguageQuery,
// //         // include filters only if present
// //         deviceId: deviceId?.trim() || undefined,
// //         deviceType: deviceType?.trim() || undefined,
// //         fromTs: dateRange?.[0] ? dayjs(dateRange[0]).valueOf() : undefined,
// //         toTs: dateRange?.[1] ? dayjs(dateRange[1]).valueOf() : undefined,
// //         topK,
// //         contextMode,
// //         // extended (supported by your updated services)
// //         location: location?.trim() || undefined,
// //         onlyAlerts: onlyAlerts || undefined,
// //       };

// //       const res = await fetch(`${API_BASE}/api/ai/query`, {
// //         method: "POST",
// //         headers: {
// //           "Content-Type": "application/json",
// //           "X-Tenant-Id": tenantHeader || "default-tenant",
// //         },
// //         body: JSON.stringify(body),
// //       });

// //       if (!res.ok) {
// //         const errText = await res.text();
// //         throw new Error(errText || `HTTP ${res.status}`);
// //       }

// //       const data = await res.json();
// //       // Expected shape: { content, data?, charts?, provider, sessionId }
// //       const aiMessage = {
// //         id: Date.now() + 1,
// //         type: "ai",
// //         timestamp: new Date(),
// //         content: data.content || "",
// //         data: data.data || null,
// //         charts: data.charts || null,
// //         provider: data.provider || "unknown",
// //       };

// //       setMessages((prev) => [...prev, aiMessage]);
// //     } catch (e) {
// //       console.error(e);
// //       antdMessage.error("Query failed. Check server logs / network.");
// //       setMessages((prev) => [
// //         ...prev,
// //         {
// //           id: Date.now() + 1,
// //           type: "ai",
// //           timestamp: new Date(),
// //           content:
// //             "Sorry—something went wrong while fetching the answer. Please try again.",
// //           data: null,
// //           charts: null,
// //         },
// //       ]);
// //     } finally {
// //       setIsLoading(false);
// //       setIsTyping(false);
// //     }
// //   };

// //   const handleSendMessage = async () => {
// //     const q = inputValue.trim();
// //     if (!q) return;

// //     const userMessage = {
// //       id: Date.now(),
// //       type: "user",
// //       content: q,
// //       timestamp: new Date(),
// //     };
// //     setMessages((prev) => [...prev, userMessage]);
// //     setInputValue("");

// //     // Call real backend (no mock branching)
// //     await callBackend(q);
// //   };

// //   const renderMessage = (message) => {
// //     const isUser = message.type === "user";
// //     return (
// //       <div key={message.id} className={`ai-message ${isUser ? "user-message" : "ai-response"}`}>
// //         <div className="message-header" style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
// //           <Avatar
// //             icon={isUser ? <UserOutlined /> : <RobotOutlined />}
// //             style={isUser ? {} : { backgroundColor: token.colorPrimary }} // ✅ token
// //           />
// //           <span className="message-time" style={{ marginLeft: 8, fontSize: 12, color: token.colorTextSecondary }}>
// //             {new Date(message.timestamp).toLocaleTimeString()}
// //           </span>
// //         </div>

// //         <div
// //           className="message-content"
// //           style={{
// //             color: token.colorText, // ✅ dark mode text fix
// //             fontSize: 15,
// //             lineHeight: 1.6,
// //           }}
// //         >
// //           <Text style={{ color: token.colorText }}>{message.content}</Text>

// //           {/* structured block from server */}
// //           {!isUser && message.data && <StructuredBlock data={message.data} />}

// //           {/* simple chart hook (reserved for future); if backend returns charts */}
// //           {!isUser && message.charts && message.charts.type === "temperature_trend" && (
// //             <div style={{ marginTop: 12 }}>
// //               <Title level={5}>Temperature Trend (24h)</Title>
// //               <Line data={message.charts.data || []} xField="time" yField="temperature" smooth height={200} />
// //             </div>
// //           )}

// //           {/* provider footer */}
// //           {!isUser && message.provider && (
// //             <div style={{ marginTop: 6 }}>
// //               <Tag icon={<ExclamationCircleOutlined />}>provider: {message.provider}</Tag>
// //             </div>
// //           )}
// //         </div>
// //       </div>
// //     );
// //   };

// //   const quickQuestions = [
// //     "Hi",
// //     "What changed in my devices today?",
// //     "Show me device list that triggered alerts in the last 24 hours.",
// //     "Any fire alerts in the last hour?",
// //     "Temperature anomalies in server room",
// //   ];

// //   return (
// //     <Layout className="ai-query-page">
// //       <Content style={{ padding: "24px", height: "100vh", display: "flex", flexDirection: "column" }}>
// //         {/* Header */}
// //         <div className="ai-query-header">
// //           <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
// //             <Col flex="auto">
// //               <Title level={2} style={{ margin: 0 }}>
// //                 <RobotOutlined style={{ marginRight: 8, color: token.colorPrimary }} />
// //                 AI Query Assistant
// //               </Title>
// //               <Text type="secondary">Ask about your IoT devices, events, anomalies—or just chat.</Text>
// //             </Col>
// //             <Col>
// //               <Space>
// //                 <Button icon={<BarChartOutlined />} onClick={() => setSidebarVisible(true)}>
// //                   Live Analysis
// //                 </Button>
// //                 <Button icon={<SettingOutlined />}>Settings</Button>
// //               </Space>
// //             </Col>
// //           </Row>

// //           {/* ✅ Main Tabs: Live Analysis | Chat (margins kept same) */}
// //           <Tabs activeKey={activeMainTab} onChange={setActiveMainTab}>
// //             <TabPane tab="Live Analysis" key="live">
// //               {/* Filters / Controls (unchanged layout & margins) */}
// //               <Row gutter={12} style={{ marginBottom: 12 }}>
// //                 <Col xs={24} md={6}>
// //                   <Input
// //                     value={tenantHeader}
// //                     onChange={(e) => setTenantHeader(e.target.value)}
// //                     placeholder="X-Tenant-Id (header)"
// //                   />
// //                 </Col>
// //                 <Col xs={24} md={6}>
// //                   <Input
// //                     value={deviceId}
// //                     onChange={(e) => setDeviceId(e.target.value)}
// //                     placeholder="Device ID (optional)"
// //                   />
// //                 </Col>
// //                 <Col xs={24} md={6}>
// //                   <Input
// //                     value={deviceType}
// //                     onChange={(e) => setDeviceType(e.target.value)}
// //                     placeholder="Device Type (optional)"
// //                   />
// //                 </Col>
// //                 <Col xs={24} md={6}>
// //                   <Input
// //                     value={location}
// //                     onChange={(e) => setLocation(e.target.value)}
// //                     placeholder="Location (optional)"
// //                   />
// //                 </Col>
// //               </Row>

// //               <Row gutter={12} style={{ marginBottom: 16 }}>
// //                 <Col xs={24} md={10}>
// //                   <RangePicker
// //                     style={{ width: "100%" }}
// //                     showTime
// //                     value={dateRange}
// //                     onChange={(v) => setDateRange(v)}
// //                     allowClear
// //                   />
// //                 </Col>
// //                 <Col xs={24} md={4}>
// //                   <Select
// //                     value={contextMode}
// //                     onChange={setContextMode}
// //                     style={{ width: "100%" }}
// //                     placeholder="Context Mode"
// //                   >
// //                     <Option value="smart">Smart Context</Option>
// //                     <Option value="detailed">Detailed Analysis</Option>
// //                     <Option value="summary">Summary Only</Option>
// //                   </Select>
// //                 </Col>
// //                 <Col xs={24} md={4}>
// //                   <Input
// //                     type="number"
// //                     min={1}
// //                     max={50}
// //                     value={topK}
// //                     onChange={(e) => setTopK(Number(e.target.value || 10))}
// //                     placeholder="topK"
// //                   />
// //                 </Col>
// //                 <Col xs={24} md={3}>
// //                   <Checkbox checked={onlyAlerts} onChange={(e) => setOnlyAlerts(e.target.checked)}>
// //                     Only Alerts
// //                   </Checkbox>
// //                 </Col>
// //                 <Col xs={24} md={3}>
// //                   <Space>
// //                     <Text>Live:</Text>
// //                     <Switch
// //                       checked={liveAnalysis}
// //                       onChange={setLiveAnalysis}
// //                       checkedChildren="ON"
// //                       unCheckedChildren="OFF"
// //                     />
// //                   </Space>
// //                 </Col>
// //               </Row>

// //               {/* Live tiles (unchanged) */}
// //               {liveAnalysis && (
// //                 <Row gutter={16} style={{ marginBottom: 16 }}>
// //                   <Col span={4}>
// //                     <Statistic
// //                       title="Active Devices"
// //                       value={liveData.activeDevices}
// //                       suffix={`/ ${liveData.totalDevices}`}
// //                       valueStyle={{ color: "#52c41a" }}
// //                     />
// //                   </Col>
// //                   <Col span={4}>
// //                     <Statistic title="Live Events" value={liveData.events} valueStyle={{ color: "#1890ff" }} />
// //                   </Col>
// //                   <Col span={4}>
// //                     <Statistic title="Anomalies" value={liveData.anomalies} valueStyle={{ color: "#faad14" }} />
// //                   </Col>
// //                   <Col span={4}>
// //                     <Statistic title="Critical Alerts" value={liveData.alerts} valueStyle={{ color: "#ff4d4f" }} />
// //                   </Col>
// //                   <Col span={4}>
// //                     <Statistic title="Data Points" value={liveData.dataPoints} valueStyle={{ color: "#722ed1" }} />
// //                   </Col>
// //                   <Col span={4}>
// //                     <Progress
// //                       type="circle"
// //                       percent={Math.round((liveData.activeDevices / liveData.totalDevices) * 100)}
// //                       size={60}
// //                       format={() => "Health"}
// //                     />
// //                   </Col>
// //                 </Row>
// //               )}
// //             </TabPane>

// //             <TabPane tab="Chat" key="chat">
// //               {/* Chat window (scroll + dark-mode fixed) */}
// //               <div className="ai-chat-container" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
// //                 <div
// //                   className="messages-container"
// //                   style={{
// //                     flex: 1,
// //                     overflowY: "auto",
// //                     padding: "16px",
// //                     backgroundColor: token.colorBgContainer, // ✅ token-based bg
// //                     borderRadius: 8,
// //                     border: `1px solid ${token.colorBorderSecondary}`,
// //                   }}
// //                 >
// //                   {messages.length === 0 ? (
// //                     <div className="welcome-message" style={{ textAlign: "center", padding: "40px 20px" }}>
// //                       <RobotOutlined style={{ fontSize: 48, color: token.colorPrimary, marginBottom: 16 }} />
// //                       <Title level={3}>Welcome to AI Query Assistant</Title>
// //                       <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 24 }}>
// //                         Ask me anything about your IoT devices—or just say “Hi”.
// //                         Use the filters above to scope results by device, type, time window, and more.
// //                       </Paragraph>

// //                       <div className="quick-questions">
// //                         <Title level={4}>Try asking:</Title>
// //                         <Row gutter={[8, 8]} justify="center">
// //                           {quickQuestions.map((question, index) => (
// //                             <Col key={index}>
// //                               <Button
// //                                 type="dashed"
// //                                 onClick={() => setInputValue(question)}
// //                                 style={{ textAlign: "left" }}
// //                               >
// //                                 {question}
// //                               </Button>
// //                             </Col>
// //                           ))}
// //                         </Row>
// //                       </div>
// //                     </div>
// //                   ) : (
// //                     <>
// //                       {messages.map(renderMessage)}
// //                       {isTyping && (
// //                         <div className="ai-message ai-response typing">
// //                           <div className="message-header" style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
// //                             <Avatar icon={<RobotOutlined />} style={{ backgroundColor: token.colorPrimary }} />
// //                             <span className="message-time" style={{ marginLeft: 8, color: token.colorTextSecondary }}>
// //                               Thinking...
// //                             </span>
// //                           </div>
// //                           <div className="message-content" style={{ color: token.colorText }}>
// //                             <Spin size="small" /> <Text type="secondary">AI is analyzing your query...</Text>
// //                           </div>
// //                         </div>
// //                       )}
// //                       <div ref={messagesEndRef} />
// //                     </>
// //                   )}
// //                 </div>

// //                 {/* Composer */}
// //                 <div
// //                   className="input-container"
// //                   style={{
// //                     padding: "16px",
// //                     borderTop: `1px solid ${token.colorBorderSecondary}`,
// //                     backgroundColor: token.colorBgContainer,
// //                     borderRadius: "0 0 8px 8px",
// //                   }}
// //                 >
// //                   <Space.Compact style={{ width: "100%" }}>
// //                     <TextArea
// //                       ref={inputRef}
// //                       value={inputValue}
// //                       onChange={(e) => setInputValue(e.target.value)}
// //                       placeholder="Ask anything (e.g., 'Hi', 'Show me device list that triggered alerts in the last 24 hours')"
// //                       autoSize={{ minRows: 1, maxRows: 4 }}
// //                       onPressEnter={(e) => {
// //                         if (!e.shiftKey) {
// //                           e.preventDefault();
// //                           handleSendMessage();
// //                         }
// //                       }}
// //                       style={{ flex: 1 }}
// //                     />
// //                     <Button
// //                       type="primary"
// //                       icon={<SendOutlined />}
// //                       onClick={handleSendMessage}
// //                       loading={isLoading}
// //                       disabled={!inputValue.trim()}
// //                     >
// //                       Send
// //                     </Button>
// //                   </Space.Compact>
// //                 </div>
// //               </div>
// //             </TabPane>
// //           </Tabs>
// //         </div>
// //       </Content>

// //       {/* Drawer: Live Analysis (demo visuals) */}
// //       <Drawer
// //         title="Live Analysis Dashboard"
// //         placement="right"
// //         width={600}
// //         onClose={() => setSidebarVisible(false)}
// //         open={sidebarVisible}
// //       >
// //         <Tabs activeKey={activeTab} onChange={setActiveTab}>
// //           <TabPane tab="Overview" key="overview">
// //             <Space direction="vertical" style={{ width: "100%" }} size="large">
// //               <Card title="Device Status Distribution" size="small">
// //                 <Pie
// //                   data={deviceStatusData}
// //                   angleField="value"
// //                   colorField="type"
// //                   radius={0.8}
// //                   height={200}
// //                   legend={{ position: "bottom" }}
// //                 />
// //               </Card>

// //               <Card title="Event Trend (24h)" size="small">
// //                 <Line data={eventTrendData} xField="time" yField="events" smooth height={200} />
// //               </Card>

// //               <Card title="Anomaly Categories" size="small">
// //                 <Bar data={anomalyTrendData} xField="category" yField="count" height={200} />
// //               </Card>
// //             </Space>
// //           </TabPane>

// //           <TabPane tab="Recent Events" key="events">
// //             <Timeline>
// //               {/* demo static */}
// //               {[{
// //                 id: 1, type: "fire_detection", message: "Fire detected in Building A, Floor 3", location: "Building A - Floor 3",
// //                 timestamp: new Date(), severity: "critical", device: "Fire-Sensor-A3-01"
// //               }].map((event) => (
// //                 <Timeline.Item key={event.id} dot={getEventIcon(event.type)} color={getSeverityColor(event.severity)}>
// //                   <Card size="small">
// //                     <Space direction="vertical" size="small">
// //                       <Text strong>{event.message}</Text>
// //                       <Text type="secondary">
// //                         <EnvironmentOutlined /> {event.location}
// //                       </Text>
// //                       <Text type="secondary">Device: {event.device}</Text>
// //                       <Text type="secondary">{new Date(event.timestamp).toLocaleString()}</Text>
// //                       <Tag color={getSeverityColor(event.severity)}>{String(event.severity).toUpperCase()}</Tag>
// //                     </Space>
// //                   </Card>
// //                 </Timeline.Item>
// //               ))}
// //             </Timeline>
// //           </TabPane>
// //         </Tabs>
// //       </Drawer>
// //     </Layout>
// //   );
// // }

// // // "use client";

// // // import { useState, useEffect, useRef } from "react";
// // // import {
// // //   Layout,
// // //   Card,
// // //   Input,
// // //   Button,
// // //   Typography,
// // //   Space,
// // //   Avatar,
// // //   Tag,
// // //   Select,
// // //   Switch,
// // //   Badge,
// // //   Row,
// // //   Col,
// // //   Statistic,
// // //   Progress,
// // //   Timeline,
// // //   Alert,
// // //   Spin,
// // //   Drawer,
// // //   Tabs,
// // //   List,
// // //   DatePicker,
// // //   message as antdMessage,
// // //   Checkbox,
// // // } from "antd";
// // // import {
// // //   SendOutlined,
// // //   RobotOutlined,
// // //   UserOutlined,
// // //   ThunderboltOutlined,
// // //   ClockCircleOutlined,
// // //   EnvironmentOutlined,
// // //   CarOutlined,
// // //   FireOutlined,
// // //   DropboxOutlined,
// // //   BulbOutlined,
// // //   SettingOutlined,
// // //   BarChartOutlined,
// // //   ExclamationCircleOutlined,
// // // } from "@ant-design/icons";
// // // import { Line, Bar, Pie } from "@ant-design/plots";
// // // import dayjs from "dayjs";
// // // import { useTheme } from "../components/theme/ThemeProvider";

// // // const { Content } = Layout;
// // // const { Title, Text, Paragraph } = Typography;
// // // const { TextArea } = Input;
// // // const { Option } = Select;
// // // const { TabPane } = Tabs;
// // // const { RangePicker } = DatePicker;

// // // const API_BASE = process.env.NEXT_PUBLIC_AI_API_BASE || "http://localhost:8096";

// // // /**
// // //  * Utility: format ISO safely
// // //  */
// // // const toIsoOrNull = (d) => (d ? dayjs(d).toISOString() : null);

// // // /**
// // //  * Maps server `data.type` => UI renderers
// // //  * Currently handles `device_alert_list`, easy to extend for others.
// // //  */
// // // const DeviceAlertList = ({ items }) => {
// // //   if (!items || items.length === 0) {
// // //     return (
// // //       <Alert
// // //         type="info"
// // //         showIcon
// // //         message="No devices with alerts in the requested window."
// // //       />
// // //     );
// // //   }
// // //   return (
// // //     <List
// // //       dataSource={items}
// // //       renderItem={(it) => (
// // //         <List.Item>
// // //           <Card size="small" style={{ width: "100%" }}>
// // //             <Row gutter={12} align="middle">
// // //               <Col xs={24} md={18}>
// // //                 <Space direction="vertical" size="small">
// // //                   <Space wrap>
// // //                     <Text strong>{it.deviceId}</Text>
// // //                     {it.deviceType && <Tag color="geekblue">{it.deviceType}</Tag>}
// // //                     {it.location && (
// // //                       <Tag icon={<EnvironmentOutlined />} color="green">
// // //                         {it.location}
// // //                       </Tag>
// // //                     )}
// // //                     {it.severity && (
// // //                       <Tag color={
// // //                         it.severity === "CRITICAL" ? "red" :
// // //                         it.severity === "HIGH" ? "volcano" :
// // //                         it.severity === "MEDIUM" ? "gold" : "blue"
// // //                       }>
// // //                         {it.severity}
// // //                       </Tag>
// // //                     )}
// // //                   </Space>
// // //                   <Text type="secondary">
// // //                     <ClockCircleOutlined /> Latest:{" "}
// // //                     {it.latestTs
// // //                       ? dayjs(it.latestTs).format("YYYY-MM-DD HH:mm:ss")
// // //                       : "n/a"}
// // //                     {typeof it.count === "number" ? ` • Count: ${it.count}` : ""}
// // //                   </Text>
// // //                   {it.sampleReasons && it.sampleReasons.length > 0 && (
// // //                     <Text type="secondary">
// // //                       Reasons: {it.sampleReasons.join("; ")}
// // //                     </Text>
// // //                   )}
// // //                 </Space>
// // //               </Col>
// // //             </Row>
// // //           </Card>
// // //         </List.Item>
// // //       )}
// // //     />
// // //   );
// // // };

// // // const StructuredBlock = ({ data }) => {
// // //   if (!data) return null;
// // //   if (data.type === "device_alert_list") {
// // //     return (
// // //       <>
// // //         <Title level={5} style={{ marginTop: 12 }}>
// // //           Devices that triggered alerts
// // //         </Title>
// // //         <DeviceAlertList items={data.items || []} />
// // //       </>
// // //     );
// // //   }
// // //   // fallback generic renderer if you add more types later
// // //   return (
// // //     <Card size="small" style={{ marginTop: 12 }}>
// // //       <pre style={{ margin: 0 }}>{JSON.stringify(data, null, 2)}</pre>
// // //     </Card>
// // //   );
// // // };

// // // /**
// // //  * Main page
// // //  */
// // // export default function AIQueryPage() {
// // //   const { theme } = useTheme();
// // //   const [messages, setMessages] = useState([]);
// // //   const [inputValue, setInputValue] = useState("");
// // //   const [isLoading, setIsLoading] = useState(false);
// // //   const [isTyping, setIsTyping] = useState(false);
// // //   const [sidebarVisible, setSidebarVisible] = useState(false);
// // //   const [activeTab, setActiveTab] = useState("overview");
// // //   const messagesEndRef = useRef(null);
// // //   const inputRef = useRef(null);

// // //   // Filters / controls
// // //   const [tenantHeader, setTenantHeader] = useState("tenant1"); // your app can set this from auth
// // //   const [deviceId, setDeviceId] = useState("");
// // //   const [deviceType, setDeviceType] = useState("");
// // //   const [contextMode, setContextMode] = useState("smart");
// // //   const [onlyAlerts, setOnlyAlerts] = useState(false);
// // //   const [location, setLocation] = useState("");
// // //   const [dateRange, setDateRange] = useState(null); // [start, end] dayjs[]
// // //   const [topK, setTopK] = useState(10);
// // //   const [liveAnalysis, setLiveAnalysis] = useState(true);

// // //   // Live cards (demo)
// // //   const [liveData, setLiveData] = useState({
// // //     totalDevices: 1247,
// // //     activeDevices: 1198,
// // //     anomalies: 23,
// // //     alerts: 7,
// // //     events: 156,
// // //     dataPoints: 45672,
// // //   });

// // //   useEffect(() => {
// // //     const interval = setInterval(() => {
// // //       setLiveData((prev) => ({
// // //         ...prev,
// // //         events: prev.events + Math.floor(Math.random() * 3),
// // //         dataPoints: prev.dataPoints + Math.floor(Math.random() * 50),
// // //       }));
// // //     }, 5000);
// // //     return () => clearInterval(interval);
// // //   }, []);

// // //   useEffect(() => {
// // //     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
// // //   }, [messages]);

// // //   // Simple live charts data (static demo)
// // //   const deviceStatusData = [
// // //     { type: "Online", value: 1198, color: "#52c41a" },
// // //     { type: "Offline", value: 49, color: "#ff4d4f" },
// // //   ];
// // //   const eventTrendData = [
// // //     { time: "00:00", events: 12 },
// // //     { time: "04:00", events: 8 },
// // //     { time: "08:00", events: 25 },
// // //     { time: "12:00", events: 45 },
// // //     { time: "16:00", events: 38 },
// // //     { time: "20:00", events: 28 },
// // //   ];
// // //   const anomalyTrendData = [
// // //     { category: "Temperature", count: 8 },
// // //     { category: "Humidity", count: 5 },
// // //     { category: "Vibration", count: 4 },
// // //     { category: "Pressure", count: 3 },
// // //     { category: "Motion", count: 3 },
// // //   ];

// // //   const getSeverityColor = (severity) => {
// // //     switch (severity) {
// // //       case "critical":
// // //         return "#ff4d4f";
// // //       case "high":
// // //         return "#ff7a45";
// // //       case "warning":
// // //         return "#faad14";
// // //       case "medium":
// // //         return "#faad14";
// // //       case "info":
// // //         return "#1890ff";
// // //       case "low":
// // //         return "#52c41a";
// // //       default:
// // //         return "#d9d9d9";
// // //     }
// // //   };

// // //   const getEventIcon = (type) => {
// // //     switch (type) {
// // //       case "license_plate":
// // //         return <CarOutlined />;
// // //       case "fire_detection":
// // //         return <FireOutlined />;
// // //       case "water_leak":
// // //         return <DropboxOutlined />;
// // //       case "door_access":
// // //         return <BulbOutlined />;
// // //       default:
// // //         return <ThunderboltOutlined />;
// // //     }
// // //   };

// // //   /**
// // //    * Core: send query to backend
// // //    * - Sends **exactly** what your AiQueryController expects
// // //    * - General chit-chat is supported (no filters required)
// // //    * - If filters are set, we include them
// // //    */
// // //   const callBackend = async (naturalLanguageQuery) => {
// // //     setIsLoading(true);
// // //     setIsTyping(true);

// // //     try {
// // //       // Build request body (AiQueryRequest)
// // //       const body = {
// // //         query: naturalLanguageQuery,
// // //         // include filters only if present
// // //         deviceId: deviceId?.trim() || undefined,
// // //         deviceType: deviceType?.trim() || undefined,
// // //         fromTs: dateRange?.[0] ? dayjs(dateRange[0]).valueOf() : undefined,
// // //         toTs: dateRange?.[1] ? dayjs(dateRange[1]).valueOf() : undefined,
// // //         topK,
// // //         contextMode,
// // //         // extended (supported by your updated services)
// // //         location: location?.trim() || undefined,
// // //         onlyAlerts: onlyAlerts || undefined,
// // //       };

// // //       const res = await fetch(`${API_BASE}/api/ai/query`, {
// // //         method: "POST",
// // //         headers: {
// // //           "Content-Type": "application/json",
// // //           "X-Tenant-Id": tenantHeader || "default-tenant",
// // //         },
// // //         body: JSON.stringify(body),
// // //       });

// // //       if (!res.ok) {
// // //         const errText = await res.text();
// // //         throw new Error(errText || `HTTP ${res.status}`);
// // //       }

// // //       const data = await res.json();
// // //       // Expected shape: { content, data?, charts?, provider, sessionId }
// // //       const aiMessage = {
// // //         id: Date.now() + 1,
// // //         type: "ai",
// // //         timestamp: new Date(),
// // //         content: data.content || "",
// // //         data: data.data || null,
// // //         charts: data.charts || null,
// // //         provider: data.provider || "unknown",
// // //       };

// // //       setMessages((prev) => [...prev, aiMessage]);
// // //     } catch (e) {
// // //       console.error(e);
// // //       antdMessage.error("Query failed. Check server logs / network.");
// // //       setMessages((prev) => [
// // //         ...prev,
// // //         {
// // //           id: Date.now() + 1,
// // //           type: "ai",
// // //           timestamp: new Date(),
// // //           content:
// // //             "Sorry—something went wrong while fetching the answer. Please try again.",
// // //           data: null,
// // //           charts: null,
// // //         },
// // //       ]);
// // //     } finally {
// // //       setIsLoading(false);
// // //       setIsTyping(false);
// // //     }
// // //   };

// // //   const handleSendMessage = async () => {
// // //     const q = inputValue.trim();
// // //     if (!q) return;

// // //     const userMessage = {
// // //       id: Date.now(),
// // //       type: "user",
// // //       content: q,
// // //       timestamp: new Date(),
// // //     };
// // //     setMessages((prev) => [...prev, userMessage]);
// // //     setInputValue("");

// // //     // Call real backend (no mock branching)
// // //     await callBackend(q);
// // //   };

// // //   const renderMessage = (message) => {
// // //     const isUser = message.type === "user";
// // //     return (
// // //       <div key={message.id} className={`ai-message ${isUser ? "user-message" : "ai-response"}`}>
// // //         <div className="message-header">
// // //           <Avatar
// // //             icon={isUser ? <UserOutlined /> : <RobotOutlined />}
// // //             style={isUser ? {} : { backgroundColor: "#1890ff" }}
// // //           />
// // //           <span className="message-time">
// // //             {new Date(message.timestamp).toLocaleTimeString()}
// // //           </span>
// // //         </div>

// // //         <div className="message-content">
// // //           <Text>{message.content}</Text>

// // //           {/* structured block from server */}
// // //           {!isUser && message.data && <StructuredBlock data={message.data} />}

// // //           {/* simple chart hook (reserved for future); if backend returns charts */}
// // //           {!isUser && message.charts && message.charts.type === "temperature_trend" && (
// // //             <div style={{ marginTop: 12 }}>
// // //               <Title level={5}>Temperature Trend (24h)</Title>
// // //               <Line data={message.charts.data || []} xField="time" yField="temperature" smooth height={200} />
// // //             </div>
// // //           )}

// // //           {/* provider footer */}
// // //           {!isUser && message.provider && (
// // //             <div style={{ marginTop: 6 }}>
// // //               <Tag icon={<ExclamationCircleOutlined />}>provider: {message.provider}</Tag>
// // //             </div>
// // //           )}
// // //         </div>
// // //       </div>
// // //     );
// // //   };

// // //   const quickQuestions = [
// // //     "Hi",
// // //     "What changed in my devices today?",
// // //     "Show me device list that triggered alerts in the last 24 hours.",
// // //     "Any fire alerts in the last hour?",
// // //     "Temperature anomalies in server room",
// // //   ];

// // //   return (
// // //     <Layout className="ai-query-page">
// // //       <Content style={{ padding: "24px", height: "100vh", display: "flex", flexDirection: "column" }}>
// // //         {/* Header */}
// // //         <div className="ai-query-header">
// // //           <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
// // //             <Col flex="auto">
// // //               <Title level={2} style={{ margin: 0 }}>
// // //                 <RobotOutlined style={{ marginRight: 8, color: "#1890ff" }} />
// // //                 AI Query Assistant
// // //               </Title>
// // //               <Text type="secondary">Ask about your IoT devices, events, anomalies—or just chat.</Text>
// // //             </Col>
// // //             <Col>
// // //               <Space>
// // //                 <Button icon={<BarChartOutlined />} onClick={() => setSidebarVisible(true)}>
// // //                   Live Analysis
// // //                 </Button>
// // //                 <Button icon={<SettingOutlined />}>Settings</Button>
// // //               </Space>
// // //             </Col>
// // //           </Row>

// // //           {/* Filters / Controls */}
// // //           <Row gutter={12} style={{ marginBottom: 12 }}>
// // //             <Col xs={24} md={6}>
// // //               <Input
// // //                 value={tenantHeader}
// // //                 onChange={(e) => setTenantHeader(e.target.value)}
// // //                 placeholder="X-Tenant-Id (header)"
// // //               />
// // //             </Col>
// // //             <Col xs={24} md={6}>
// // //               <Input
// // //                 value={deviceId}
// // //                 onChange={(e) => setDeviceId(e.target.value)}
// // //                 placeholder="Device ID (optional)"
// // //               />
// // //             </Col>
// // //             <Col xs={24} md={6}>
// // //               <Input
// // //                 value={deviceType}
// // //                 onChange={(e) => setDeviceType(e.target.value)}
// // //                 placeholder="Device Type (optional)"
// // //               />
// // //             </Col>
// // //             <Col xs={24} md={6}>
// // //               <Input
// // //                 value={location}
// // //                 onChange={(e) => setLocation(e.target.value)}
// // //                 placeholder="Location (optional)"
// // //               />
// // //             </Col>
// // //           </Row>

// // //           <Row gutter={12} style={{ marginBottom: 16 }}>
// // //             <Col xs={24} md={10}>
// // //               <RangePicker
// // //                 style={{ width: "100%" }}
// // //                 showTime
// // //                 value={dateRange}
// // //                 onChange={(v) => setDateRange(v)}
// // //                 allowClear
// // //               />
// // //             </Col>
// // //             <Col xs={24} md={4}>
// // //               <Select
// // //                 value={contextMode}
// // //                 onChange={setContextMode}
// // //                 style={{ width: "100%" }}
// // //                 placeholder="Context Mode"
// // //               >
// // //                 <Option value="smart">Smart Context</Option>
// // //                 <Option value="detailed">Detailed Analysis</Option>
// // //                 <Option value="summary">Summary Only</Option>
// // //               </Select>
// // //             </Col>
// // //             <Col xs={24} md={4}>
// // //               <Input
// // //                 type="number"
// // //                 min={1}
// // //                 max={50}
// // //                 value={topK}
// // //                 onChange={(e) => setTopK(Number(e.target.value || 10))}
// // //                 placeholder="topK"
// // //               />
// // //             </Col>
// // //             <Col xs={24} md={3}>
// // //               <Checkbox checked={onlyAlerts} onChange={(e) => setOnlyAlerts(e.target.checked)}>
// // //                 Only Alerts
// // //               </Checkbox>
// // //             </Col>
// // //             <Col xs={24} md={3}>
// // //               <Space>
// // //                 <Text>Live:</Text>
// // //                 <Switch
// // //                   checked={liveAnalysis}
// // //                   onChange={setLiveAnalysis}
// // //                   checkedChildren="ON"
// // //                   unCheckedChildren="OFF"
// // //                 />
// // //               </Space>
// // //             </Col>
// // //           </Row>

// // //           {/* Live tiles */}
// // //           {liveAnalysis && (
// // //             <Row gutter={16} style={{ marginBottom: 16 }}>
// // //               <Col span={4}>
// // //                 <Statistic
// // //                   title="Active Devices"
// // //                   value={liveData.activeDevices}
// // //                   suffix={`/ ${liveData.totalDevices}`}
// // //                   valueStyle={{ color: "#52c41a" }}
// // //                 />
// // //               </Col>
// // //               <Col span={4}>
// // //                 <Statistic title="Live Events" value={liveData.events} valueStyle={{ color: "#1890ff" }} />
// // //               </Col>
// // //               <Col span={4}>
// // //                 <Statistic title="Anomalies" value={liveData.anomalies} valueStyle={{ color: "#faad14" }} />
// // //               </Col>
// // //               <Col span={4}>
// // //                 <Statistic title="Critical Alerts" value={liveData.alerts} valueStyle={{ color: "#ff4d4f" }} />
// // //               </Col>
// // //               <Col span={4}>
// // //                 <Statistic title="Data Points" value={liveData.dataPoints} valueStyle={{ color: "#722ed1" }} />
// // //               </Col>
// // //               <Col span={4}>
// // //                 <Progress
// // //                   type="circle"
// // //                   percent={Math.round((liveData.activeDevices / liveData.totalDevices) * 100)}
// // //                   size={60}
// // //                   format={() => "Health"}
// // //                 />
// // //               </Col>
// // //             </Row>
// // //           )}
// // //         </div>

// // //         {/* Chat window */}
// // //         <div className="ai-chat-container" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
// // //           <div
// // //             className="messages-container"
// // //             style={{
// // //               flex: 1,
// // //               overflowY: "auto",
// // //               padding: "16px",
// // //               backgroundColor: theme === "dark" ? "#141414" : "#fafafa",
// // //               borderRadius: 8,
// // //             }}
// // //           >
// // //             {messages.length === 0 ? (
// // //               <div className="welcome-message" style={{ textAlign: "center", padding: "40px 20px" }}>
// // //                 <RobotOutlined style={{ fontSize: 48, color: "#1890ff", marginBottom: 16 }} />
// // //                 <Title level={3}>Welcome to AI Query Assistant</Title>
// // //                 <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 24 }}>
// // //                   Ask me anything about your IoT devices—or just say “Hi”.
// // //                   Use the filters above to scope results by device, type, time window, and more.
// // //                 </Paragraph>

// // //                 <div className="quick-questions">
// // //                   <Title level={4}>Try asking:</Title>
// // //                   <Row gutter={[8, 8]} justify="center">
// // //                     {quickQuestions.map((question, index) => (
// // //                       <Col key={index}>
// // //                         <Button
// // //                           type="dashed"
// // //                           onClick={() => setInputValue(question)}
// // //                           style={{ textAlign: "left" }}
// // //                         >
// // //                           {question}
// // //                         </Button>
// // //                       </Col>
// // //                     ))}
// // //                   </Row>
// // //                 </div>
// // //               </div>
// // //             ) : (
// // //               <>
// // //                 {messages.map(renderMessage)}
// // //                 {isTyping && (
// // //                   <div className="ai-message ai-response typing">
// // //                     <div className="message-header">
// // //                       <Avatar icon={<RobotOutlined />} style={{ backgroundColor: "#1890ff" }} />
// // //                       <span className="message-time">Thinking...</span>
// // //                     </div>
// // //                     <div className="message-content">
// // //                       <Spin size="small" /> <Text type="secondary">AI is analyzing your query...</Text>
// // //                     </div>
// // //                   </div>
// // //                 )}
// // //                 <div ref={messagesEndRef} />
// // //               </>
// // //             )}
// // //           </div>

// // //           {/* Composer */}
// // //           <div
// // //             className="input-container"
// // //             style={{ padding: "16px", borderTop: `1px solid ${theme === "dark" ? "#303030" : "#f0f0f0"}` }}
// // //           >
// // //             <Space.Compact style={{ width: "100%" }}>
// // //               <TextArea
// // //                 ref={inputRef}
// // //                 value={inputValue}
// // //                 onChange={(e) => setInputValue(e.target.value)}
// // //                 placeholder="Ask anything (e.g., 'Hi', 'Show me device list that triggered alerts in the last 24 hours')"
// // //                 autoSize={{ minRows: 1, maxRows: 4 }}
// // //                 onPressEnter={(e) => {
// // //                   if (!e.shiftKey) {
// // //                     e.preventDefault();
// // //                     handleSendMessage();
// // //                   }
// // //                 }}
// // //                 style={{ flex: 1 }}
// // //               />
// // //               <Button
// // //                 type="primary"
// // //                 icon={<SendOutlined />}
// // //                 onClick={handleSendMessage}
// // //                 loading={isLoading}
// // //                 disabled={!inputValue.trim()}
// // //               >
// // //                 Send
// // //               </Button>
// // //             </Space.Compact>
// // //           </div>
// // //         </div>
// // //       </Content>

// // //       {/* Drawer: Live Analysis (demo visuals) */}
// // //       <Drawer
// // //         title="Live Analysis Dashboard"
// // //         placement="right"
// // //         width={600}
// // //         onClose={() => setSidebarVisible(false)}
// // //         open={sidebarVisible}
// // //       >
// // //         <Tabs activeKey={activeTab} onChange={setActiveTab}>
// // //           <TabPane tab="Overview" key="overview">
// // //             <Space direction="vertical" style={{ width: "100%" }} size="large">
// // //               <Card title="Device Status Distribution" size="small">
// // //                 <Pie
// // //                   data={deviceStatusData}
// // //                   angleField="value"
// // //                   colorField="type"
// // //                   radius={0.8}
// // //                   height={200}
// // //                   legend={{ position: "bottom" }}
// // //                 />
// // //               </Card>

// // //               <Card title="Event Trend (24h)" size="small">
// // //                 <Line data={eventTrendData} xField="time" yField="events" smooth height={200} />
// // //               </Card>

// // //               <Card title="Anomaly Categories" size="small">
// // //                 <Bar data={anomalyTrendData} xField="category" yField="count" height={200} />
// // //               </Card>
// // //             </Space>
// // //           </TabPane>

// // //           <TabPane tab="Recent Events" key="events">
// // //             <Timeline>
// // //               {/* demo static */}
// // //               {[{
// // //                 id: 1, type: "fire_detection", message: "Fire detected in Building A, Floor 3", location: "Building A - Floor 3",
// // //                 timestamp: new Date(), severity: "critical", device: "Fire-Sensor-A3-01"
// // //               }].map((event) => (
// // //                 <Timeline.Item key={event.id} dot={getEventIcon(event.type)} color={getSeverityColor(event.severity)}>
// // //                   <Card size="small">
// // //                     <Space direction="vertical" size="small">
// // //                       <Text strong>{event.message}</Text>
// // //                       <Text type="secondary">
// // //                         <EnvironmentOutlined /> {event.location}
// // //                       </Text>
// // //                       <Text type="secondary">Device: {event.device}</Text>
// // //                       <Text type="secondary">{new Date(event.timestamp).toLocaleString()}</Text>
// // //                       <Tag color={getSeverityColor(event.severity)}>{String(event.severity).toUpperCase()}</Tag>
// // //                     </Space>
// // //                   </Card>
// // //                 </Timeline.Item>
// // //               ))}
// // //             </Timeline>
// // //           </TabPane>
// // //         </Tabs>
// // //       </Drawer>
// // //     </Layout>
// // //   );
// // // }

// // // // "use client"

// // // // import { useState, useEffect, useRef } from "react"
// // // // import {
// // // //   Layout,
// // // //   Card,
// // // //   Input,
// // // //   Button,
// // // //   Typography,
// // // //   Space,
// // // //   Avatar,
// // // //   Tag,
// // // //   Select,
// // // //   Switch,
// // // //   Badge,
// // // //   Row,
// // // //   Col,
// // // //   Statistic,
// // // //   Progress,
// // // //   Timeline,
// // // //   Alert,
// // // //   Spin,
// // // //   Drawer,
// // // //   Tabs,
// // // //   List,
// // // //   DatePicker,
// // // // } from "antd"
// // // // import {
// // // //   SendOutlined,
// // // //   RobotOutlined,
// // // //   UserOutlined,
// // // //   ThunderboltOutlined,
// // // //   ClockCircleOutlined,
// // // //   EnvironmentOutlined,
// // // //   CarOutlined,
// // // //   FireOutlined,
// // // //   DropboxOutlined,
// // // //   BulbOutlined,
// // // //   SettingOutlined,
// // // //   BarChartOutlined,
// // // // } from "@ant-design/icons"
// // // // import { Line, Bar, Pie } from "@ant-design/plots"
// // // // import { useTheme } from "../components/theme/ThemeProvider"

// // // // const { Content } = Layout
// // // // const { Title, Text, Paragraph } = Typography
// // // // const { TextArea } = Input
// // // // const { Option } = Select
// // // // const { TabPane } = Tabs
// // // // const { RangePicker } = DatePicker

// // // // const AIQueryPage = () => {
// // // //   const { theme } = useTheme()
// // // //   const [messages, setMessages] = useState([])
// // // //   const [inputValue, setInputValue] = useState("")
// // // //   const [isLoading, setIsLoading] = useState(false)
// // // //   const [isTyping, setIsTyping] = useState(false)
// // // //   const [selectedTenant, setSelectedTenant] = useState("all")
// // // //   const [selectedDeviceType, setSelectedDeviceType] = useState("all")
// // // //   const [liveAnalysis, setLiveAnalysis] = useState(true)
// // // //   const [contextMode, setContextMode] = useState("smart")
// // // //   const [sidebarVisible, setSidebarVisible] = useState(false)
// // // //   const [activeTab, setActiveTab] = useState("overview")
// // // //   const messagesEndRef = useRef(null)
// // // //   const inputRef = useRef(null)

// // // //   // Mock data for live analysis
// // // //   const [liveData, setLiveData] = useState({
// // // //     totalDevices: 1247,
// // // //     activeDevices: 1198,
// // // //     anomalies: 23,
// // // //     alerts: 7,
// // // //     events: 156,
// // // //     dataPoints: 45672,
// // // //   })

// // // //   const [recentEvents, setRecentEvents] = useState([
// // // //     {
// // // //       id: 1,
// // // //       type: "license_plate",
// // // //       message: "License plate ABC-123 detected at Gate 1",
// // // //       location: "Main Entrance",
// // // //       timestamp: new Date(Date.now() - 2 * 60 * 1000),
// // // //       severity: "info",
// // // //       device: "Camera-001",
// // // //     },
// // // //     {
// // // //       id: 2,
// // // //       type: "fire_detection",
// // // //       message: "Fire detected in Building A, Floor 3",
// // // //       location: "Building A - Floor 3",
// // // //       timestamp: new Date(Date.now() - 5 * 60 * 1000),
// // // //       severity: "critical",
// // // //       device: "Fire-Sensor-A3-01",
// // // //     },
// // // //     {
// // // //       id: 3,
// // // //       type: "water_leak",
// // // //       message: "Water leak detected in Basement",
// // // //       location: "Basement - Utility Room",
// // // //       timestamp: new Date(Date.now() - 8 * 60 * 1000),
// // // //       severity: "warning",
// // // //       device: "Water-Sensor-B1-05",
// // // //     },
// // // //     {
// // // //       id: 4,
// // // //       type: "door_access",
// // // //       message: "Unauthorized access attempt at Server Room",
// // // //       location: "Server Room - Floor 2",
// // // //       timestamp: new Date(Date.now() - 12 * 60 * 1000),
// // // //       severity: "warning",
// // // //       device: "Access-Control-002",
// // // //     },
// // // //   ])

// // // //   const [anomalies, setAnomalies] = useState([
// // // //     {
// // // //       id: 1,
// // // //       device: "Temperature Sensor 01",
// // // //       type: "Temperature Spike",
// // // //       value: "85°C",
// // // //       threshold: "75°C",
// // // //       location: "Server Room",
// // // //       timestamp: new Date(Date.now() - 10 * 60 * 1000),
// // // //       severity: "high",
// // // //     },
// // // //     {
// // // //       id: 2,
// // // //       device: "Humidity Sensor 03",
// // // //       type: "Humidity Drop",
// // // //       value: "25%",
// // // //       threshold: "40%",
// // // //       location: "Storage Area",
// // // //       timestamp: new Date(Date.now() - 15 * 60 * 1000),
// // // //       severity: "medium",
// // // //     },
// // // //     {
// // // //       id: 3,
// // // //       device: "Vibration Sensor 02",
// // // //       type: "Unusual Vibration",
// // // //       value: "8.5 Hz",
// // // //       threshold: "5.0 Hz",
// // // //       location: "Machine Room",
// // // //       timestamp: new Date(Date.now() - 20 * 60 * 1000),
// // // //       severity: "high",
// // // //     },
// // // //   ])

// // // //   // Chart data
// // // //   const deviceStatusData = [
// // // //     { type: "Online", value: 1198, color: "#52c41a" },
// // // //     { type: "Offline", value: 49, color: "#ff4d4f" },
// // // //   ]

// // // //   const eventTrendData = [
// // // //     { time: "00:00", events: 12 },
// // // //     { time: "04:00", events: 8 },
// // // //     { time: "08:00", events: 25 },
// // // //     { time: "12:00", events: 45 },
// // // //     { time: "16:00", events: 38 },
// // // //     { time: "20:00", events: 28 },
// // // //   ]

// // // //   const anomalyTrendData = [
// // // //     { category: "Temperature", count: 8 },
// // // //     { category: "Humidity", count: 5 },
// // // //     { category: "Vibration", count: 4 },
// // // //     { category: "Pressure", count: 3 },
// // // //     { category: "Motion", count: 3 },
// // // //   ]

// // // //   useEffect(() => {
// // // //     scrollToBottom()
// // // //   }, [messages])

// // // //   useEffect(() => {
// // // //     // Simulate live data updates
// // // //     const interval = setInterval(() => {
// // // //       setLiveData((prev) => ({
// // // //         ...prev,
// // // //         events: prev.events + Math.floor(Math.random() * 3),
// // // //         dataPoints: prev.dataPoints + Math.floor(Math.random() * 50),
// // // //       }))
// // // //     }, 5000)

// // // //     return () => clearInterval(interval)
// // // //   }, [])

// // // //   const scrollToBottom = () => {
// // // //     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
// // // //   }

// // // //   const handleSendMessage = async () => {
// // // //     if (!inputValue.trim()) return

// // // //     const userMessage = {
// // // //       id: Date.now(),
// // // //       type: "user",
// // // //       content: inputValue,
// // // //       timestamp: new Date(),
// // // //     }

// // // //     setMessages((prev) => [...prev, userMessage])
// // // //     setInputValue("")
// // // //     setIsLoading(true)
// // // //     setIsTyping(true)

// // // //     // Simulate AI processing
// // // //     setTimeout(() => {
// // // //       const aiResponse = generateAIResponse(inputValue)
// // // //       setMessages((prev) => [...prev, aiResponse])
// // // //       setIsLoading(false)
// // // //       setIsTyping(false)
// // // //     }, 2000)
// // // //   }

// // // //   const generateAIResponse = (query) => {
// // // //     const lowerQuery = query.toLowerCase()
// // // //     const response = {
// // // //       id: Date.now() + 1,
// // // //       type: "ai",
// // // //       timestamp: new Date(),
// // // //       content: "",
// // // //       data: null,
// // // //       charts: null,
// // // //     }

// // // //     if (lowerQuery.includes("license plate") || lowerQuery.includes("number plate")) {
// // // //       response.content = "I found recent license plate detections. Here's what I discovered:"
// // // //       response.data = {
// // // //         type: "license_plates",
// // // //         results: [
// // // //           {
// // // //             plate: "ABC-123",
// // // //             location: "Gate 1 - Main Entrance",
// // // //             timestamp: new Date(Date.now() - 2 * 60 * 1000),
// // // //             confidence: 98.5,
// // // //             vehicle_type: "Sedan",
// // // //             image_url: "/placeholder.svg?height=100&width=150&text=ABC-123",
// // // //           },
// // // //           {
// // // //             plate: "XYZ-789",
// // // //             location: "Gate 2 - Service Entrance",
// // // //             timestamp: new Date(Date.now() - 15 * 60 * 1000),
// // // //             confidence: 95.2,
// // // //             vehicle_type: "SUV",
// // // //             image_url: "/placeholder.svg?height=100&width=150&text=XYZ-789",
// // // //           },
// // // //         ],
// // // //       }
// // // //     } else if (lowerQuery.includes("fire") || lowerQuery.includes("smoke")) {
// // // //       response.content = "Fire detection analysis shows recent alerts. Here's the current status:"
// // // //       response.data = {
// // // //         type: "fire_detection",
// // // //         results: [
// // // //           {
// // // //             location: "Building A - Floor 3",
// // // //             status: "CRITICAL",
// // // //             timestamp: new Date(Date.now() - 5 * 60 * 1000),
// // // //             sensor: "Fire-Sensor-A3-01",
// // // //             temperature: "85°C",
// // // //             smoke_level: "High",
// // // //           },
// // // //         ],
// // // //       }
// // // //     } else if (lowerQuery.includes("water") || lowerQuery.includes("leak")) {
// // // //       response.content = "Water leak detection results:"
// // // //       response.data = {
// // // //         type: "water_detection",
// // // //         results: [
// // // //           {
// // // //             location: "Basement - Utility Room",
// // // //             status: "WARNING",
// // // //             timestamp: new Date(Date.now() - 8 * 60 * 1000),
// // // //             sensor: "Water-Sensor-B1-05",
// // // //             moisture_level: "75%",
// // // //           },
// // // //         ],
// // // //       }
// // // //     } else if (lowerQuery.includes("temperature") || lowerQuery.includes("temp")) {
// // // //       response.content = "Temperature analysis across your devices:"
// // // //       response.charts = {
// // // //         type: "temperature_trend",
// // // //         data: [
// // // //           { time: "00:00", temperature: 22.5 },
// // // //           { time: "04:00", temperature: 21.8 },
// // // //           { time: "08:00", temperature: 24.2 },
// // // //           { time: "12:00", temperature: 26.8 },
// // // //           { time: "16:00", temperature: 28.5 },
// // // //           { time: "20:00", temperature: 25.3 },
// // // //         ],
// // // //       }
// // // //     } else if (lowerQuery.includes("anomaly") || lowerQuery.includes("anomalies")) {
// // // //       response.content = "Current anomalies detected in your system:"
// // // //       response.data = {
// // // //         type: "anomalies",
// // // //         results: anomalies,
// // // //       }
// // // //     } else {
// // // //       response.content = `I understand you're asking about "${query}". Based on your tenant data, I can help you analyze device events, detect anomalies, and provide insights. Try asking about specific events like "show me license plates detected today" or "any fire alerts in building A".`
// // // //     }

// // // //     return response
// // // //   }

// // // //   const getSeverityColor = (severity) => {
// // // //     switch (severity) {
// // // //       case "critical":
// // // //         return "#ff4d4f"
// // // //       case "high":
// // // //         return "#ff7a45"
// // // //       case "warning":
// // // //         return "#faad14"
// // // //       case "medium":
// // // //         return "#faad14"
// // // //       case "info":
// // // //         return "#1890ff"
// // // //       case "low":
// // // //         return "#52c41a"
// // // //       default:
// // // //         return "#d9d9d9"
// // // //     }
// // // //   }

// // // //   const getEventIcon = (type) => {
// // // //     switch (type) {
// // // //       case "license_plate":
// // // //         return <CarOutlined />
// // // //       case "fire_detection":
// // // //         return <FireOutlined />
// // // //       case "water_leak":
// // // //         return <DropboxOutlined />
// // // //       case "door_access":
// // // //         return <BulbOutlined />
// // // //       default:
// // // //         return <ThunderboltOutlined />
// // // //     }
// // // //   }

// // // //   const renderMessage = (message) => {
// // // //     if (message.type === "user") {
// // // //       return (
// // // //         <div key={message.id} className="ai-message user-message">
// // // //           <div className="message-header">
// // // //             <Avatar icon={<UserOutlined />} />
// // // //             <span className="message-time">{message.timestamp.toLocaleTimeString()}</span>
// // // //           </div>
// // // //           <div className="message-content">
// // // //             <Text>{message.content}</Text>
// // // //           </div>
// // // //         </div>
// // // //       )
// // // //     } else {
// // // //       return (
// // // //         <div key={message.id} className="ai-message ai-response">
// // // //           <div className="message-header">
// // // //             <Avatar icon={<RobotOutlined />} style={{ backgroundColor: "#1890ff" }} />
// // // //             <span className="message-time">{message.timestamp.toLocaleTimeString()}</span>
// // // //           </div>
// // // //           <div className="message-content">
// // // //             <Text>{message.content}</Text>

// // // //             {message.data && (
// // // //               <div className="message-data">
// // // //                 {message.data.type === "license_plates" && (
// // // //                   <div className="license-plate-results">
// // // //                     <Title level={5}>License Plate Detections</Title>
// // // //                     {message.data.results.map((result, index) => (
// // // //                       <Card key={index} size="small" style={{ marginBottom: 8 }}>
// // // //                         <Row gutter={16} align="middle">
// // // //                           <Col span={6}>
// // // //                             <img
// // // //                               src={result.image_url || "/placeholder.svg"}
// // // //                               alt={result.plate}
// // // //                               style={{ width: "100%", borderRadius: 4 }}
// // // //                             />
// // // //                           </Col>
// // // //                           <Col span={18}>
// // // //                             <Space direction="vertical" size="small">
// // // //                               <Text strong>{result.plate}</Text>
// // // //                               <Text type="secondary">
// // // //                                 <EnvironmentOutlined /> {result.location}
// // // //                               </Text>
// // // //                               <Text type="secondary">
// // // //                                 <ClockCircleOutlined /> {result.timestamp.toLocaleString()}
// // // //                               </Text>
// // // //                               <Space>
// // // //                                 <Tag color="blue">{result.vehicle_type}</Tag>
// // // //                                 <Tag color="green">{result.confidence}% confidence</Tag>
// // // //                               </Space>
// // // //                             </Space>
// // // //                           </Col>
// // // //                         </Row>
// // // //                       </Card>
// // // //                     ))}
// // // //                   </div>
// // // //                 )}

// // // //                 {message.data.type === "fire_detection" && (
// // // //                   <div className="fire-detection-results">
// // // //                     <Title level={5}>Fire Detection Alerts</Title>
// // // //                     {message.data.results.map((result, index) => (
// // // //                       <Alert
// // // //                         key={index}
// // // //                         type="error"
// // // //                         showIcon
// // // //                         message={`Fire Alert - ${result.location}`}
// // // //                         description={
// // // //                           <Space direction="vertical">
// // // //                             <Text>Sensor: {result.sensor}</Text>
// // // //                             <Text>Temperature: {result.temperature}</Text>
// // // //                             <Text>Smoke Level: {result.smoke_level}</Text>
// // // //                             <Text>Time: {result.timestamp.toLocaleString()}</Text>
// // // //                           </Space>
// // // //                         }
// // // //                         style={{ marginBottom: 8 }}
// // // //                       />
// // // //                     ))}
// // // //                   </div>
// // // //                 )}

// // // //                 {message.data.type === "anomalies" && (
// // // //                   <div className="anomalies-results">
// // // //                     <Title level={5}>Detected Anomalies</Title>
// // // //                     <List
// // // //                       dataSource={message.data.results}
// // // //                       renderItem={(anomaly) => (
// // // //                         <List.Item>
// // // //                           <Card size="small" style={{ width: "100%" }}>
// // // //                             <Row gutter={16} align="middle">
// // // //                               <Col span={2}>
// // // //                                 <Badge color={getSeverityColor(anomaly.severity)} status="processing" />
// // // //                               </Col>
// // // //                               <Col span={22}>
// // // //                                 <Space direction="vertical" size="small">
// // // //                                   <Text strong>{anomaly.device}</Text>
// // // //                                   <Text>
// // // //                                     {anomaly.type}: {anomaly.value} (Threshold: {anomaly.threshold})
// // // //                                   </Text>
// // // //                                   <Text type="secondary">
// // // //                                     <EnvironmentOutlined /> {anomaly.location} •
// // // //                                     <ClockCircleOutlined /> {anomaly.timestamp.toLocaleString()}
// // // //                                   </Text>
// // // //                                 </Space>
// // // //                               </Col>
// // // //                             </Row>
// // // //                           </Card>
// // // //                         </List.Item>
// // // //                       )}
// // // //                     />
// // // //                   </div>
// // // //                 )}
// // // //               </div>
// // // //             )}

// // // //             {message.charts && (
// // // //               <div className="message-charts">
// // // //                 {message.charts.type === "temperature_trend" && (
// // // //                   <div>
// // // //                     <Title level={5}>Temperature Trend (24h)</Title>
// // // //                     <Line
// // // //                       data={message.charts.data}
// // // //                       xField="time"
// // // //                       yField="temperature"
// // // //                       smooth={true}
// // // //                       color="#1890ff"
// // // //                       height={200}
// // // //                     />
// // // //                   </div>
// // // //                 )}
// // // //               </div>
// // // //             )}
// // // //           </div>
// // // //         </div>
// // // //       )
// // // //     }
// // // //   }

// // // //   const quickQuestions = [
// // // //     "Show me license plates detected today",
// // // //     "Any fire alerts in the last hour?",
// // // //     "Temperature anomalies in server room",
// // // //     "Water leak detections this week",
// // // //     "Door access events at gate 1",
// // // //     "Show device status overview",
// // // //   ]

// // // //   return (
// // // //     <Layout className="ai-query-page">
// // // //       <Content style={{ padding: "24px", height: "100vh", display: "flex", flexDirection: "column" }}>
// // // //         <div className="ai-query-header">
// // // //           <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
// // // //             <Col flex="auto">
// // // //               <Title level={2} style={{ margin: 0 }}>
// // // //                 <RobotOutlined style={{ marginRight: 8, color: "#1890ff" }} />
// // // //                 AI Query Assistant
// // // //               </Title>
// // // //               <Text type="secondary">Ask questions about your IoT devices, events, and anomalies</Text>
// // // //             </Col>
// // // //             <Col>
// // // //               <Space>
// // // //                 <Button icon={<BarChartOutlined />} onClick={() => setSidebarVisible(true)}>
// // // //                   Live Analysis
// // // //                 </Button>
// // // //                 <Button icon={<SettingOutlined />}>Settings</Button>
// // // //               </Space>
// // // //             </Col>
// // // //           </Row>

// // // //           <Row gutter={16} style={{ marginBottom: 16 }}>
// // // //             <Col span={6}>
// // // //               <Select
// // // //                 value={selectedTenant}
// // // //                 onChange={setSelectedTenant}
// // // //                 style={{ width: "100%" }}
// // // //                 placeholder="Select Tenant"
// // // //               >
// // // //                 <Option value="all">All Tenants</Option>
// // // //                 <Option value="tenant1">Building Management</Option>
// // // //                 <Option value="tenant2">Security Systems</Option>
// // // //                 <Option value="tenant3">Environmental Monitoring</Option>
// // // //               </Select>
// // // //             </Col>
// // // //             <Col span={6}>
// // // //               <Select
// // // //                 value={selectedDeviceType}
// // // //                 onChange={setSelectedDeviceType}
// // // //                 style={{ width: "100%" }}
// // // //                 placeholder="Device Type"
// // // //               >
// // // //                 <Option value="all">All Devices</Option>
// // // //                 <Option value="camera">Cameras</Option>
// // // //                 <Option value="sensor">Sensors</Option>
// // // //                 <Option value="controller">Controllers</Option>
// // // //               </Select>
// // // //             </Col>
// // // //             <Col span={6}>
// // // //               <Select
// // // //                 value={contextMode}
// // // //                 onChange={setContextMode}
// // // //                 style={{ width: "100%" }}
// // // //                 placeholder="Context Mode"
// // // //               >
// // // //                 <Option value="smart">Smart Context</Option>
// // // //                 <Option value="detailed">Detailed Analysis</Option>
// // // //                 <Option value="summary">Summary Only</Option>
// // // //               </Select>
// // // //             </Col>
// // // //             <Col span={6}>
// // // //               <Space>
// // // //                 <Text>Live Analysis:</Text>
// // // //                 <Switch
// // // //                   checked={liveAnalysis}
// // // //                   onChange={setLiveAnalysis}
// // // //                   checkedChildren="ON"
// // // //                   unCheckedChildren="OFF"
// // // //                 />
// // // //               </Space>
// // // //             </Col>
// // // //           </Row>

// // // //           {liveAnalysis && (
// // // //             <Row gutter={16} style={{ marginBottom: 16 }}>
// // // //               <Col span={4}>
// // // //                 <Statistic
// // // //                   title="Active Devices"
// // // //                   value={liveData.activeDevices}
// // // //                   suffix={`/ ${liveData.totalDevices}`}
// // // //                   valueStyle={{ color: "#52c41a" }}
// // // //                 />
// // // //               </Col>
// // // //               <Col span={4}>
// // // //                 <Statistic title="Live Events" value={liveData.events} valueStyle={{ color: "#1890ff" }} />
// // // //               </Col>
// // // //               <Col span={4}>
// // // //                 <Statistic title="Anomalies" value={liveData.anomalies} valueStyle={{ color: "#faad14" }} />
// // // //               </Col>
// // // //               <Col span={4}>
// // // //                 <Statistic title="Critical Alerts" value={liveData.alerts} valueStyle={{ color: "#ff4d4f" }} />
// // // //               </Col>
// // // //               <Col span={4}>
// // // //                 <Statistic title="Data Points" value={liveData.dataPoints} valueStyle={{ color: "#722ed1" }} />
// // // //               </Col>
// // // //               <Col span={4}>
// // // //                 <Progress
// // // //                   type="circle"
// // // //                   percent={Math.round((liveData.activeDevices / liveData.totalDevices) * 100)}
// // // //                   size={60}
// // // //                   format={() => "Health"}
// // // //                 />
// // // //               </Col>
// // // //             </Row>
// // // //           )}
// // // //         </div>

// // // //         <div className="ai-chat-container" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
// // // //           <div
// // // //             className="messages-container"
// // // //             style={{
// // // //               flex: 1,
// // // //               overflowY: "auto",
// // // //               padding: "16px",
// // // //               backgroundColor: theme === "dark" ? "#141414" : "#fafafa",
// // // //               borderRadius: 8,
// // // //             }}
// // // //           >
// // // //             {messages.length === 0 ? (
// // // //               <div className="welcome-message" style={{ textAlign: "center", padding: "40px 20px" }}>
// // // //                 <RobotOutlined style={{ fontSize: 48, color: "#1890ff", marginBottom: 16 }} />
// // // //                 <Title level={3}>Welcome to AI Query Assistant</Title>
// // // //                 <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 24 }}>
// // // //                   Ask me anything about your IoT devices, events, anomalies, and system status. I can help you analyze
// // // //                   data, detect patterns, and provide insights.
// // // //                 </Paragraph>

// // // //                 <div className="quick-questions">
// // // //                   <Title level={4}>Try asking:</Title>
// // // //                   <Row gutter={[8, 8]} justify="center">
// // // //                     {quickQuestions.map((question, index) => (
// // // //                       <Col key={index}>
// // // //                         <Button type="dashed" onClick={() => setInputValue(question)} style={{ textAlign: "left" }}>
// // // //                           {question}
// // // //                         </Button>
// // // //                       </Col>
// // // //                     ))}
// // // //                   </Row>
// // // //                 </div>
// // // //               </div>
// // // //             ) : (
// // // //               <>
// // // //                 {messages.map(renderMessage)}
// // // //                 {isTyping && (
// // // //                   <div className="ai-message ai-response typing">
// // // //                     <div className="message-header">
// // // //                       <Avatar icon={<RobotOutlined />} style={{ backgroundColor: "#1890ff" }} />
// // // //                       <span className="message-time">Thinking...</span>
// // // //                     </div>
// // // //                     <div className="message-content">
// // // //                       <Spin size="small" /> <Text type="secondary">AI is analyzing your query...</Text>
// // // //                     </div>
// // // //                   </div>
// // // //                 )}
// // // //                 <div ref={messagesEndRef} />
// // // //               </>
// // // //             )}
// // // //           </div>

// // // //           <div
// // // //             className="input-container"
// // // //             style={{ padding: "16px", borderTop: `1px solid ${theme === "dark" ? "#303030" : "#f0f0f0"}` }}
// // // //           >
// // // //             <Space.Compact style={{ width: "100%" }}>
// // // //               <TextArea
// // // //                 ref={inputRef}
// // // //                 value={inputValue}
// // // //                 onChange={(e) => setInputValue(e.target.value)}
// // // //                 placeholder="Ask about your devices, events, anomalies... (e.g., 'Show me license plates detected at gate 1 today')"
// // // //                 autoSize={{ minRows: 1, maxRows: 4 }}
// // // //                 onPressEnter={(e) => {
// // // //                   if (!e.shiftKey) {
// // // //                     e.preventDefault()
// // // //                     handleSendMessage()
// // // //                   }
// // // //                 }}
// // // //                 style={{ flex: 1 }}
// // // //               />
// // // //               <Button
// // // //                 type="primary"
// // // //                 icon={<SendOutlined />}
// // // //                 onClick={handleSendMessage}
// // // //                 loading={isLoading}
// // // //                 disabled={!inputValue.trim()}
// // // //               >
// // // //                 Send
// // // //               </Button>
// // // //             </Space.Compact>
// // // //           </div>
// // // //         </div>
// // // //       </Content>

// // // //       <Drawer
// // // //         title="Live Analysis Dashboard"
// // // //         placement="right"
// // // //         width={600}
// // // //         onClose={() => setSidebarVisible(false)}
// // // //         open={sidebarVisible}
// // // //       >
// // // //         <Tabs activeKey={activeTab} onChange={setActiveTab}>
// // // //           <TabPane tab="Overview" key="overview">
// // // //             <Space direction="vertical" style={{ width: "100%" }} size="large">
// // // //               <Card title="Device Status Distribution" size="small">
// // // //                 <Pie
// // // //                   data={deviceStatusData}
// // // //                   angleField="value"
// // // //                   colorField="type"
// // // //                   radius={0.8}
// // // //                   height={200}
// // // //                   legend={{
// // // //                     position: "bottom",
// // // //                   }}
// // // //                 />
// // // //               </Card>

// // // //               <Card title="Event Trend (24h)" size="small">
// // // //                 <Line data={eventTrendData} xField="time" yField="events" smooth={true} color="#1890ff" height={200} />
// // // //               </Card>

// // // //               <Card title="Anomaly Categories" size="small">
// // // //                 <Bar data={anomalyTrendData} xField="category" yField="count" color="#faad14" height={200} />
// // // //               </Card>
// // // //             </Space>
// // // //           </TabPane>

// // // //           <TabPane tab="Recent Events" key="events">
// // // //             <Timeline>
// // // //               {recentEvents.map((event) => (
// // // //                 <Timeline.Item key={event.id} dot={getEventIcon(event.type)} color={getSeverityColor(event.severity)}>
// // // //                   <Card size="small">
// // // //                     <Space direction="vertical" size="small">
// // // //                       <Text strong>{event.message}</Text>
// // // //                       <Text type="secondary">
// // // //                         <EnvironmentOutlined /> {event.location}
// // // //                       </Text>
// // // //                       <Text type="secondary">Device: {event.device}</Text>
// // // //                       <Text type="secondary">{event.timestamp.toLocaleString()}</Text>
// // // //                       <Tag color={getSeverityColor(event.severity)}>{event.severity.toUpperCase()}</Tag>
// // // //                     </Space>
// // // //                   </Card>
// // // //                 </Timeline.Item>
// // // //               ))}
// // // //             </Timeline>
// // // //           </TabPane>

// // // //           <TabPane tab="Anomalies" key="anomalies">
// // // //             <List
// // // //               dataSource={anomalies}
// // // //               renderItem={(anomaly) => (
// // // //                 <List.Item>
// // // //                   <Card size="small" style={{ width: "100%" }}>
// // // //                     <Row gutter={16} align="middle">
// // // //                       <Col span={4}>
// // // //                         <Badge color={getSeverityColor(anomaly.severity)} status="processing" />
// // // //                       </Col>
// // // //                       <Col span={20}>
// // // //                         <Space direction="vertical" size="small">
// // // //                           <Text strong>{anomaly.device}</Text>
// // // //                           <Text>{anomaly.type}</Text>
// // // //                           <Text>
// // // //                             Current: <Text code>{anomaly.value}</Text> | Threshold:{" "}
// // // //                             <Text code>{anomaly.threshold}</Text>
// // // //                           </Text>
// // // //                           <Text type="secondary">
// // // //                             <EnvironmentOutlined /> {anomaly.location}
// // // //                           </Text>
// // // //                           <Text type="secondary">{anomaly.timestamp.toLocaleString()}</Text>
// // // //                         </Space>
// // // //                       </Col>
// // // //                     </Row>
// // // //                   </Card>
// // // //                 </List.Item>
// // // //               )}
// // // //             />
// // // //           </TabPane>
// // // //         </Tabs>
// // // //       </Drawer>
// // // //     </Layout>
// // // //   )
// // // // }

// // // // export default AIQueryPage