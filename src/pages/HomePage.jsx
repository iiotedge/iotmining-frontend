// src/pages/HomePage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Row,
  Col,
  Typography,
  Space,
  Button,
  Spin,
  Divider,
  Tag,
  Grid,
  theme as antdTheme,
  Tooltip,
} from 'antd';
import {
  ApiOutlined,
  DashboardOutlined,
  BellOutlined,
  TeamOutlined,
  ApartmentOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  WarningTwoTone,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  ExclamationCircleTwoTone,
} from '@ant-design/icons';

import { ThemeContext } from '../components/theme/ThemeProvider';
import LineChartWidget from '../components/dashboard/widgets/LineChartWidget';
import PieChartWidget from '../components/dashboard/widgets/PieChartWidget';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

/** Reusable panel (no title) */
const Panel = ({ children, minHeight }) => {
  const { token } = antdTheme.useToken();
  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadiusLG,
        boxShadow: token.boxShadowTertiary,
        padding: 16,
        minHeight: minHeight || 'auto',
        overflow: 'hidden',
        transition: 'box-shadow .2s, transform .2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = token.boxShadowSecondary;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = token.boxShadowTertiary;
        e.currentTarget.style.transform = 'none';
      }}
    >
      {children}
    </div>
  );
};

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentAlarms, setRecentAlarms] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const { theme } = useContext(ThemeContext);
  const screens = useBreakpoint();
  const { token } = antdTheme.useToken();

  const isMobile = !screens.md;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await new Promise((r) => setTimeout(r, 800));

        setStats({
          devices: 128,
          active: 112,
          inactive: 16,
          alarms: 7,
          customers: 24,
          rules: 15,
          dashboards: 8,
        });

        setRecentAlarms([
          { id: 1, severity: 'critical', type: 'High Temperature', originator: 'Device A', time: '10 min ago', status: 'active' },
          { id: 2, severity: 'major', type: 'Connection Lost', originator: 'Gateway B', time: '25 min ago', status: 'acknowledged' },
          { id: 3, severity: 'minor', type: 'Low Battery', originator: 'Sensor C', time: '1 hour ago', status: 'cleared' },
          { id: 4, severity: 'warning', type: 'Humidity Warning', originator: 'Device D', time: '2 hours ago', status: 'active' },
        ]);

        setRecentActivity([
          { id: 1, type: 'device', action: 'created', entity: 'Temperature Sensor', user: 'admin', time: '15 min ago' },
          { id: 2, type: 'rule', action: 'updated', entity: 'Alert Rule', user: 'john.doe', time: '45 min ago' },
          { id: 3, type: 'dashboard', action: 'shared', entity: 'Operations Dashboard', user: 'admin', time: '1 hour ago' },
          { id: 4, type: 'customer', action: 'created', entity: 'ACME Corp', user: 'admin', time: '3 hours ago' },
        ]);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error fetching home data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 700);
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <CloseCircleTwoTone twoToneColor="#ff4d4f" />;
      case 'major':
        return <WarningTwoTone twoToneColor="#fa8c16" />;
      case 'minor':
        return <ExclamationCircleTwoTone twoToneColor="#faad14" />;
      case 'warning':
        return <WarningTwoTone twoToneColor="#8BC34A" />;
      default:
        return <CheckCircleTwoTone twoToneColor="#52c41a" />;
    }
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'active':
        return <Tag color="error">active</Tag>;
      case 'acknowledged':
        return <Tag color="orange">acknowledged</Tag>;
      case 'cleared':
        return <Tag color="green">cleared</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  if (loading) {
    return (
      <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  // layout helpers to ensure no overlap and equal heights
  const colFlex = { display: 'flex' };

  return (
    <div className={`home-page ${theme === 'dark' ? 'dark-theme' : ''}`} style={{ padding: isMobile ? 12 : 24 }}>
      <Space align="center" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Dashboard Overview</Title>
        <Button icon={<ReloadOutlined />} onClick={refreshData} size="middle">Refresh</Button>
      </Space>

      {/* Top Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} md={4} style={colFlex}>
          <Panel minHeight={120}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space size={8} align="center" wrap>
                <ApiOutlined style={{ color: token.colorPrimary }} />
                <Text type="secondary">Devices</Text>
              </Space>
              <Title level={3} style={{ margin: 0 }}>{stats.devices}</Title>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{stats.active} active</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{stats.inactive} inactive</Text>
              </Space>
            </Space>
          </Panel>
        </Col>

        <Col xs={12} sm={8} md={4} style={colFlex}>
          <Panel minHeight={120}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space size={8} align="center" wrap>
                <WarningTwoTone twoToneColor={token.colorError} />
                <Text type="secondary">Alarms</Text>
              </Space>
              <Title level={3} style={{ margin: 0 }}>{stats.alarms}</Title>
              <Text type={stats.alarms > 0 ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
                {stats.alarms > 0 ? `${stats.alarms} active` : 'No active alarms'}
              </Text>
            </Space>
          </Panel>
        </Col>

        <Col xs={12} sm={8} md={4} style={colFlex}>
          <Panel minHeight={120}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space size={8} align="center" wrap>
                <TeamOutlined style={{ color: token.colorPrimary }} />
                <Text type="secondary">Customers</Text>
              </Space>
              <Title level={3} style={{ margin: 0 }}>{stats.customers}</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Total customers</Text>
            </Space>
          </Panel>
        </Col>

        <Col xs={12} sm={8} md={4} style={colFlex}>
          <Panel minHeight={120}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space size={8} align="center" wrap>
                <ApartmentOutlined style={{ color: token.colorPrimary }} />
                <Text type="secondary">Rule Chains</Text>
              </Space>
              <Title level={3} style={{ margin: 0 }}>{stats.rules}</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Active rule chains</Text>
            </Space>
          </Panel>
        </Col>

        <Col xs={12} sm={8} md={4} style={colFlex}>
          <Panel minHeight={120}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space size={8} align="center" wrap>
                <DashboardOutlined style={{ color: token.colorPrimary }} />
                <Text type="secondary">Dashboards</Text>
              </Space>
              <Title level={3} style={{ margin: 0 }}>{stats.dashboards}</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Total dashboards</Text>
            </Space>
          </Panel>
        </Col>

        <Col xs={12} sm={8} md={4} style={colFlex}>
          <Panel minHeight={120}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space size={8} align="center" wrap>
                <BellOutlined style={{ color: token.colorPrimary }} />
                <Text type="secondary">Notifications</Text>
              </Space>
              <Title level={3} style={{ margin: 0 }}>12</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>3 unread</Text>
            </Space>
          </Panel>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} md={16} style={colFlex}>
          <Panel minHeight={320}>
            <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong>Device Activity</Text>
              <Button type="link" size="small">
                <Link to="/devices">View All <ArrowRightOutlined /></Link>
              </Button>
            </Space>
            <div style={{ minHeight: 300, width: '100%', overflow: 'hidden' }}>
              <LineChartWidget
                data={[
                  { name: 'Temperature', data: [28, 29, 33, 36, 32, 32, 33] },
                  { name: 'Humidity', data: [12, 11, 14, 18, 17, 13, 13] },
                ]}
                labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                colors={['#52c41a', '#1677ff']}
              />
            </div>
          </Panel>
        </Col>

        <Col xs={24} md={8} style={colFlex}>
          <Panel minHeight={320}>
            <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong>Device Status</Text>
              <Tooltip title="Refresh">
                <Button type="text" size="small" icon={<ReloadOutlined />} onClick={refreshData} />
              </Tooltip>
            </Space>
            <div
              // style={{
              //   // minHeight: 300,
              //   // width: '100%',
              //   // display: 'flex',
              //   alignItems: 'center',
              //   justifyContent: 'center',
              //   overflow: 'hidden',
              // }}
            >
              <PieChartWidget
                data={[
                  { name: 'Active', value: stats.active },
                  { name: 'Inactive', value: stats.inactive },
                ]}
                colors={['#52c41a', '#ff4d4f']}
              />
            </div>
          </Panel>
        </Col>
      </Row>

      {/* Lists */}
      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} md={12} style={colFlex}>
          <Panel>
            <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong>Recent Alarms</Text>
              <Button type="link" size="small">
                <Link to="/alarms">View All <ArrowRightOutlined /></Link>
              </Button>
            </Space>

            {recentAlarms.length === 0 ? (
              <div style={{ padding: 16 }}>
                <Text type="secondary">No recent alarms</Text>
              </div>
            ) : (
              <div>
                {recentAlarms.map((alarm, idx) => (
                  <div key={alarm.id}>
                    <div style={{ display: 'flex', gap: 12, padding: 12, alignItems: 'center' }}>
                      <div style={{ fontSize: 18 }}>{getSeverityIcon(alarm.severity)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong ellipsis={{ tooltip: alarm.type }}>{alarm.type}</Text>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: alarm.originator }}>
                            {alarm.originator}
                          </Text>
                          <span style={{ marginLeft: 'auto' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>{alarm.time}</Text>
                          </span>
                        </div>
                      </div>
                      {getStatusTag(alarm.status)}
                    </div>
                    {idx < recentAlarms.length - 1 && <Divider style={{ margin: 0 }} />}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </Col>

        <Col xs={24} md={12} style={colFlex}>
          <Panel>
            <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong>Recent Activity</Text>
              <Button type="link" size="small">
                <Link to="/audit-logs">View All <ArrowRightOutlined /></Link>
              </Button>
            </Space>

            {recentActivity.length === 0 ? (
              <div style={{ padding: 16 }}>
                <Text type="secondary">No recent activity</Text>
              </div>
            ) : (
              <div>
                {recentActivity.map((activity, idx) => (
                  <div key={activity.id}>
                    <div style={{ display: 'flex', gap: 12, padding: 12, alignItems: 'center' }}>
                      <div style={{ color: token.colorPrimary, flexShrink: 0 }}>
                        {activity.type === 'device' && <ApiOutlined />}
                        {activity.type === 'rule' && <ApartmentOutlined />}
                        {activity.type === 'dashboard' && <DashboardOutlined />}
                        {activity.type === 'customer' && <TeamOutlined />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong ellipsis={{ tooltip: `${activity.entity} ${activity.action}` }}>
                          {activity.entity} {activity.action}
                        </Text>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: activity.user }}>
                            by {activity.user}
                          </Text>
                          <span style={{ marginLeft: 'auto' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>{activity.time}</Text>
                          </span>
                        </div>
                      </div>
                    </div>
                    {idx < recentActivity.length - 1 && <Divider style={{ margin: 0 }} />}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </Col>
      </Row>
    </div>
  );
};

export default HomePage;

// // src/pages/HomePage.jsx
// import React, { useState, useEffect, useContext } from 'react';
// import { Link } from 'react-router-dom';
// import {
//   Row,
//   Col,
//   Card,
//   Typography,
//   Space,
//   Button,
//   Spin,
//   Divider,
//   Tag,
//   Grid,
//   theme as antdTheme,
//   Tooltip,
// } from 'antd';
// import {
//   ApiOutlined,
//   DashboardOutlined,
//   BellOutlined,
//   TeamOutlined,
//   ApartmentOutlined,
//   ReloadOutlined,
//   ArrowRightOutlined,
//   WarningTwoTone,
//   CheckCircleTwoTone,
//   CloseCircleTwoTone,
//   ExclamationCircleTwoTone,
// } from '@ant-design/icons';

// import { ThemeContext } from '../components/theme/ThemeProvider';
// import LineChartWidget from '../components/dashboard/widgets/LineChartWidget';
// import PieChartWidget from '../components/dashboard/widgets/PieChartWidget';
// // Keeping your custom widgets importable in case you use them elsewhere:
// // import ValueCardWidget from '../components/dashboard/widgets/ValueCardWidget';
// // import AlarmCountWidget from '../components/dashboard/widgets/AlarmCountWidget';

// const { Title, Text } = Typography;
// const { useBreakpoint } = Grid;

// const HomePage = () => {
//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState(null);
//   const [recentAlarms, setRecentAlarms] = useState([]);
//   const [recentActivity, setRecentActivity] = useState([]);
//   const { theme } = useContext(ThemeContext);
//   const screens = useBreakpoint();
//   const { token } = antdTheme.useToken();

//   const isMobile = !screens.md;
//   const isTablet = screens.md && !screens.lg;

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         await new Promise((r) => setTimeout(r, 800));

//         setStats({
//           devices: 128,
//           active: 112,
//           inactive: 16,
//           alarms: 7,
//           customers: 24,
//           rules: 15,
//           dashboards: 8,
//         });

//         setRecentAlarms([
//           { id: 1, severity: 'critical', type: 'High Temperature', originator: 'Device A', time: '10 min ago', status: 'active' },
//           { id: 2, severity: 'major', type: 'Connection Lost', originator: 'Gateway B', time: '25 min ago', status: 'acknowledged' },
//           { id: 3, severity: 'minor', type: 'Low Battery', originator: 'Sensor C', time: '1 hour ago', status: 'cleared' },
//           { id: 4, severity: 'warning', type: 'Humidity Warning', originator: 'Device D', time: '2 hours ago', status: 'active' },
//         ]);

//         setRecentActivity([
//           { id: 1, type: 'device', action: 'created', entity: 'Temperature Sensor', user: 'admin', time: '15 min ago' },
//           { id: 2, type: 'rule', action: 'updated', entity: 'Alert Rule', user: 'john.doe', time: '45 min ago' },
//           { id: 3, type: 'dashboard', action: 'shared', entity: 'Operations Dashboard', user: 'admin', time: '1 hour ago' },
//           { id: 4, type: 'customer', action: 'created', entity: 'ACME Corp', user: 'admin', time: '3 hours ago' },
//         ]);
//       } catch (e) {
//         // eslint-disable-next-line no-console
//         console.error('Error fetching home data:', e);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   const refreshData = () => {
//     setLoading(true);
//     setTimeout(() => setLoading(false), 700);
//   };

//   const getSeverityIcon = (severity) => {
//     switch (severity) {
//       case 'critical':
//         return <CloseCircleTwoTone twoToneColor="#ff4d4f" />;
//       case 'major':
//         return <WarningTwoTone twoToneColor="#fa8c16" />;
//       case 'minor':
//         return <ExclamationCircleTwoTone twoToneColor="#faad14" />;
//       case 'warning':
//         return <WarningTwoTone twoToneColor="#8BC34A" />;
//       default:
//         return <CheckCircleTwoTone twoToneColor="#52c41a" />;
//     }
//   };

//   const getStatusTag = (status) => {
//     switch (status) {
//       case 'active':
//         return <Tag color="error">active</Tag>;
//       case 'acknowledged':
//         return <Tag color="orange">acknowledged</Tag>;
//       case 'cleared':
//         return <Tag color="green">cleared</Tag>;
//       default:
//         return <Tag>{status}</Tag>;
//     }
//   };

//   if (loading) {
//     return (
//       <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//         <Spin size="large" />
//       </div>
//     );
//   }

//   return (
//     <div className={`home-page ${theme === 'dark' ? 'dark-theme' : ''}`} style={{ padding: isMobile ? 12 : 24 }}>
//       <Space align="center" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
//         <Title level={4} style={{ margin: 0 }}>Dashboard Overview</Title>
//         <Button icon={<ReloadOutlined />} onClick={refreshData} size="middle">
//           Refresh
//         </Button>
//       </Space>

//       {/* Top Stats */}
//       <Row gutter={[16, 16]}>
//         <Col xs={12} sm={8} md={4}>
//           <Card
//             hoverable
//             bodyStyle={{ padding: 16 }}
//             styles={{ body: { minHeight: 120 } }}
//           >
//             <Space direction="vertical" size={8} style={{ width: '100%' }}>
//               <Space size={8} align="center">
//                 <ApiOutlined style={{ color: token.colorPrimary }} />
//                 <Text type="secondary">Devices</Text>
//               </Space>
//               <Title level={3} style={{ margin: 0 }}>{stats.devices}</Title>
//               <Space style={{ justifyContent: 'space-between', width: '100%' }}>
//                 <Text type="secondary" style={{ fontSize: 12 }}>{stats.active} active</Text>
//                 <Text type="secondary" style={{ fontSize: 12 }}>{stats.inactive} inactive</Text>
//               </Space>
//             </Space>
//           </Card>
//         </Col>

//         <Col xs={12} sm={8} md={4}>
//           <Card hoverable bodyStyle={{ padding: 16 }} styles={{ body: { minHeight: 120 } }}>
//             <Space direction="vertical" size={8} style={{ width: '100%' }}>
//               <Space size={8} align="center">
//                 <WarningTwoTone twoToneColor={token.colorError} />
//                 <Text type="secondary">Alarms</Text>
//               </Space>
//               <Title level={3} style={{ margin: 0 }}>{stats.alarms}</Title>
//               <Text type={stats.alarms > 0 ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
//                 {stats.alarms > 0 ? `${stats.alarms} active` : 'No active alarms'}
//               </Text>
//             </Space>
//           </Card>
//         </Col>

//         <Col xs={12} sm={8} md={4}>
//           <Card hoverable bodyStyle={{ padding: 16 }} styles={{ body: { minHeight: 120 } }}>
//             <Space direction="vertical" size={8} style={{ width: '100%' }}>
//               <Space size={8} align="center">
//                 <TeamOutlined style={{ color: token.colorPrimary }} />
//                 <Text type="secondary">Customers</Text>
//               </Space>
//               <Title level={3} style={{ margin: 0 }}>{stats.customers}</Title>
//               <Text type="secondary" style={{ fontSize: 12 }}>Total customers</Text>
//             </Space>
//           </Card>
//         </Col>

//         <Col xs={12} sm={8} md={4}>
//           <Card hoverable bodyStyle={{ padding: 16 }} styles={{ body: { minHeight: 120 } }}>
//             <Space direction="vertical" size={8} style={{ width: '100%' }}>
//               <Space size={8} align="center">
//                 <ApartmentOutlined style={{ color: token.colorPrimary }} />
//                 <Text type="secondary">Rule Chains</Text>
//               </Space>
//               <Title level={3} style={{ margin: 0 }}>{stats.rules}</Title>
//               <Text type="secondary" style={{ fontSize: 12 }}>Active rule chains</Text>
//             </Space>
//           </Card>
//         </Col>

//         <Col xs={12} sm={8} md={4}>
//           <Card hoverable bodyStyle={{ padding: 16 }} styles={{ body: { minHeight: 120 } }}>
//             <Space direction="vertical" size={8} style={{ width: '100%' }}>
//               <Space size={8} align="center">
//                 <DashboardOutlined style={{ color: token.colorPrimary }} />
//                 <Text type="secondary">Dashboards</Text>
//               </Space>
//               <Title level={3} style={{ margin: 0 }}>{stats.dashboards}</Title>
//               <Text type="secondary" style={{ fontSize: 12 }}>Total dashboards</Text>
//             </Space>
//           </Card>
//         </Col>

//         <Col xs={12} sm={8} md={4}>
//           <Card hoverable bodyStyle={{ padding: 16 }} styles={{ body: { minHeight: 120 } }}>
//             <Space direction="vertical" size={8} style={{ width: '100%' }}>
//               <Space size={8} align="center">
//                 <BellOutlined style={{ color: token.colorPrimary }} />
//                 <Text type="secondary">Notifications</Text>
//               </Space>
//               <Title level={3} style={{ margin: 0 }}>12</Title>
//               <Text type="secondary" style={{ fontSize: 12 }}>3 unread</Text>
//             </Space>
//           </Card>
//         </Col>
//       </Row>

//       {/* Charts */}
//       <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
//         <Col xs={24} md={16}>
//           <Card
//             hoverable
//             title={<Space style={{ width: '100%', justifyContent: 'space-between' }}>
//               <span>Device Activity</span>
//               <Button type="link" size="small">
//                 <Link to="/devices">View All <ArrowRightOutlined /></Link>
//               </Button>
//             </Space>}
//             bodyStyle={{ padding: 16 }}
//           >
//             <div style={{ height: 300 }}>
//               <LineChartWidget
//                 data={[
//                   { name: 'Temperature', data: [28, 29, 33, 36, 32, 32, 33] },
//                   { name: 'Humidity', data: [12, 11, 14, 18, 17, 13, 13] },
//                 ]}
//                 labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
//                 colors={['#52c41a', '#1677ff']}
//               />
//             </div>
//           </Card>
//         </Col>

//         <Col xs={24} md={8}>
//           <Card
//             // hoverable
//             // title={<Space style={{ width: '100%', justifyContent: 'space-between' }}>
//             //   <span>Device Status</span>
//             //   <Tooltip title="Refresh">
//             //     <Button type="text" size="small" icon={<ReloadOutlined />} onClick={refreshData} />
//             //   </Tooltip>
//             // </Space>}
//             // bodyStyle={{ padding: 16 }}
//           >
//             <div style={{ height: 300, alignItems: 'center', justifyContent: 'center' }}>
//               <PieChartWidget
//                 data={[
//                   { name: 'Active', value: stats.active },
//                   { name: 'Inactive', value: stats.inactive },
//                 ]}
//                 colors={['#52c41a', '#ff4d4f']}
//               />
//             </div>
//           </Card>
//         </Col>
//       </Row>

//       {/* Lists */}
//       <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
//         <Col xs={24} md={12}>
//           <Card
//             hoverable
//             title={<Space style={{ width: '100%', justifyContent: 'space-between' }}>
//               <span>Recent Alarms</span>
//               <Button type="link" size="small">
//                 <Link to="/alarms">View All <ArrowRightOutlined /></Link>
//               </Button>
//             </Space>}
//             bodyStyle={{ padding: 0 }}
//           >
//             {recentAlarms.length === 0 ? (
//               <div style={{ padding: 16 }}>
//                 <Text type="secondary">No recent alarms</Text>
//               </div>
//             ) : (
//               <div>
//                 {recentAlarms.map((alarm, idx) => (
//                   <div key={alarm.id}>
//                     <div style={{ display: 'flex', gap: 12, padding: 12, alignItems: 'center' }}>
//                       <div style={{ fontSize: 18 }}>{getSeverityIcon(alarm.severity)}</div>
//                       <div style={{ flex: 1 }}>
//                         <Text strong>{alarm.type}</Text>
//                         <div style={{ display: 'flex', gap: 8 }}>
//                           <Text type="secondary" style={{ fontSize: 12 }}>{alarm.originator}</Text>
//                           <span style={{ marginLeft: 'auto' }}>
//                             <Text type="secondary" style={{ fontSize: 12 }}>{alarm.time}</Text>
//                           </span>
//                         </div>
//                       </div>
//                       {getStatusTag(alarm.status)}
//                     </div>
//                     {idx < recentAlarms.length - 1 && <Divider style={{ margin: 0 }} />}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </Card>
//         </Col>

//         <Col xs={24} md={12}>
//           <Card
//             hoverable
//             title={<Space style={{ width: '100%', justifyContent: 'space-between' }}>
//               <span>Recent Activity</span>
//               <Button type="link" size="small">
//                 <Link to="/audit-logs">View All <ArrowRightOutlined /></Link>
//               </Button>
//             </Space>}
//             bodyStyle={{ padding: 0 }}
//           >
//             {recentActivity.length === 0 ? (
//               <div style={{ padding: 16 }}>
//                 <Text type="secondary">No recent activity</Text>
//               </div>
//             ) : (
//               <div>
//                 {recentActivity.map((activity, idx) => (
//                   <div key={activity.id}>
//                     <div style={{ display: 'flex', gap: 12, padding: 12, alignItems: 'center' }}>
//                       <div style={{ color: token.colorPrimary }}>
//                         {activity.type === 'device' && <ApiOutlined />}
//                         {activity.type === 'rule' && <ApartmentOutlined />}
//                         {activity.type === 'dashboard' && <DashboardOutlined />}
//                         {activity.type === 'customer' && <TeamOutlined />}
//                       </div>
//                       <div style={{ flex: 1 }}>
//                         <Text strong>
//                           {activity.entity} {activity.action}
//                         </Text>
//                         <div style={{ display: 'flex', gap: 8 }}>
//                           <Text type="secondary" style={{ fontSize: 12 }}>by {activity.user}</Text>
//                           <span style={{ marginLeft: 'auto' }}>
//                             <Text type="secondary" style={{ fontSize: 12 }}>{activity.time}</Text>
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                     {idx < recentActivity.length - 1 && <Divider style={{ margin: 0 }} />}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </Card>
//         </Col>
//       </Row>
//     </div>
//   );
// };

// export default HomePage;


// // import React, { useState, useEffect, useContext } from 'react';
// // import { 
// //   Grid, 
// //   Card, 
// //   CardContent, 
// //   Typography, 
// //   Box, 
// //   Button, 
// //   CircularProgress,
// //   Paper,
// //   Divider,
// //   IconButton,
// //   useMediaQuery,
// //   useTheme
// // } from '@mui/material';
// // import { 
// //   DevicesOther, 
// //   Storage, 
// //   Rule, 
// //   Dashboard, 
// //   Notifications, 
// //   People,
// //   Refresh,
// //   ArrowForward,
// //   TrendingUp,
// //   Warning,
// //   CheckCircle,
// //   Error
// // } from '@mui/icons-material';
// // import { Link } from 'react-router-dom';
// // import { ThemeContext } from '../components/theme/ThemeProvider';
// // import LineChartWidget from '../components/dashboard/widgets/LineChartWidget';
// // import PieChartWidget from '../components/dashboard/widgets/PieChartWidget';
// // import ValueCardWidget from '../components/dashboard/widgets/ValueCardWidget';
// // import AlarmCountWidget from '../components/dashboard/widgets/AlarmCountWidget';

// // const HomePage = () => {
// //   const [loading, setLoading] = useState(true);
// //   const [stats, setStats] = useState(null);
// //   const [recentAlarms, setRecentAlarms] = useState([]);
// //   const [recentActivity, setRecentActivity] = useState([]);
// //   const { theme } = useContext(ThemeContext);
// //   const muiTheme = useTheme();
// //   const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
// //   const isTablet = useMediaQuery(muiTheme.breakpoints.down('md'));

// //   useEffect(() => {
// //     // Simulate loading data
// //     const fetchData = async () => {
// //       setLoading(true);
// //       try {
// //         // Simulate API call
// //         await new Promise(resolve => setTimeout(resolve, 1000));
        
// //         // Mock data
// //         setStats({
// //           devices: 128,
// //           active: 112,
// //           inactive: 16,
// //           alarms: 7,
// //           customers: 24,
// //           rules: 15,
// //           dashboards: 8
// //         });
        
// //         setRecentAlarms([
// //           { id: 1, severity: 'critical', type: 'High Temperature', originator: 'Device A', time: '10 min ago', status: 'active' },
// //           { id: 2, severity: 'major', type: 'Connection Lost', originator: 'Gateway B', time: '25 min ago', status: 'acknowledged' },
// //           { id: 3, severity: 'minor', type: 'Low Battery', originator: 'Sensor C', time: '1 hour ago', status: 'cleared' },
// //           { id: 4, severity: 'warning', type: 'Humidity Warning', originator: 'Device D', time: '2 hours ago', status: 'active' }
// //         ]);
        
// //         setRecentActivity([
// //           { id: 1, type: 'device', action: 'created', entity: 'Temperature Sensor', user: 'admin', time: '15 min ago' },
// //           { id: 2, type: 'rule', action: 'updated', entity: 'Alert Rule', user: 'john.doe', time: '45 min ago' },
// //           { id: 3, type: 'dashboard', action: 'shared', entity: 'Operations Dashboard', user: 'admin', time: '1 hour ago' },
// //           { id: 4, type: 'customer', action: 'created', entity: 'ACME Corp', user: 'admin', time: '3 hours ago' }
// //         ]);
        
// //         setLoading(false);
// //       } catch (error) {
// //         console.error('Error fetching home data:', error);
// //         setLoading(false);
// //       }
// //     };
    
// //     fetchData();
// //   }, []);

// //   const refreshData = () => {
// //     // Reload data
// //     setLoading(true);
// //     setTimeout(() => {
// //       setLoading(false);
// //     }, 1000);
// //   };

// //   const getSeverityIcon = (severity) => {
// //     switch (severity) {
// //       case 'critical':
// //         return <Error color="error" />;
// //       case 'major':
// //         return <Warning sx={{ color: 'orange' }} />;
// //       case 'minor':
// //         return <Warning sx={{ color: 'gold' }} />;
// //       case 'warning':
// //         return <Warning sx={{ color: '#8BC34A' }} />;
// //       default:
// //         return <CheckCircle color="success" />;
// //     }
// //   };

// //   const getStatusColor = (status) => {
// //     switch (status) {
// //       case 'active':
// //         return '#f44336';
// //       case 'acknowledged':
// //         return '#ff9800';
// //       case 'cleared':
// //         return '#4caf50';
// //       default:
// //         return '#9e9e9e';
// //     }
// //   };

// //   if (loading) {
// //     return (
// //       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
// //         <CircularProgress />
// //       </Box>
// //     );
// //   }

// //   return (
// //     <Box className={`home-page ${theme === 'dark' ? 'dark-theme' : ''}`} sx={{ p: 3 }}>
// //       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
// //         <Typography variant="h5" component="h1">
// //           Dashboard Overview
// //         </Typography>
// //         <Button 
// //           startIcon={<Refresh />} 
// //           onClick={refreshData}
// //           variant="outlined"
// //           size="small"
// //         >
// //           Refresh
// //         </Button>
// //       </Box>
      
// //       <Grid container spacing={3}>
// //         {/* Stats Cards */}
// //         <Grid item xs={6} sm={4} md={2}>
// //           <Card 
// //             sx={{ 
// //               height: '100%',
// //               backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
// //               color: theme === 'dark' ? '#e0e0e0' : 'inherit',
// //               transition: 'transform 0.2s',
// //               '&:hover': {
// //                 transform: 'translateY(-4px)',
// //                 boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
// //               }
// //             }}
// //           >
// //             <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
// //               <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
// //                 <DevicesOther color="primary" />
// //                 <Typography variant="subtitle2" sx={{ ml: 1 }}>
// //                   Devices
// //                 </Typography>
// //               </Box>
// //               <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
// //                 {stats.devices}
// //               </Typography>
// //               <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
// //                 <Typography variant="caption" color="text.secondary">
// //                   {stats.active} active
// //                 </Typography>
// //                 <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
// //                   {stats.inactive} inactive
// //                 </Typography>
// //               </Box>
// //             </CardContent>
// //           </Card>
// //         </Grid>
        
// //         <Grid item xs={6} sm={4} md={2}>
// //           <Card 
// //             sx={{ 
// //               height: '100%',
// //               backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
// //               color: theme === 'dark' ? '#e0e0e0' : 'inherit',
// //               transition: 'transform 0.2s',
// //               '&:hover': {
// //                 transform: 'translateY(-4px)',
// //                 boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
// //               }
// //             }}
// //           >
// //             <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
// //               <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
// //                 <Warning color="error" />
// //                 <Typography variant="subtitle2" sx={{ ml: 1 }}>
// //                   Alarms
// //                 </Typography>
// //               </Box>
// //               <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
// //                 {stats.alarms}
// //               </Typography>
// //               <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
// //                 <Typography variant="caption" color="error">
// //                   {stats.alarms > 0 ? `${stats.alarms} active` : 'No active alarms'}
// //                 </Typography>
// //               </Box>
// //             </CardContent>
// //           </Card>
// //         </Grid>
        
// //         <Grid item xs={6} sm={4} md={2}>
// //           <Card 
// //             sx={{ 
// //               height: '100%',
// //               backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
// //               color: theme === 'dark' ? '#e0e0e0' : 'inherit',
// //               transition: 'transform 0.2s',
// //               '&:hover': {
// //                 transform: 'translateY(-4px)',
// //                 boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
// //               }
// //             }}
// //           >
// //             <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
// //               <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
// //                 <People color="primary" />
// //                 <Typography variant="subtitle2" sx={{ ml: 1 }}>
// //                   Customers
// //                 </Typography>
// //               </Box>
// //               <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
// //                 {stats.customers}
// //               </Typography>
// //               <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
// //                 <Typography variant="caption" color="text.secondary">
// //                   Total customers
// //                 </Typography>
// //               </Box>
// //             </CardContent>
// //           </Card>
// //         </Grid>
        
// //         <Grid item xs={6} sm={4} md={2}>
// //           <Card 
// //             sx={{ 
// //               height: '100%',
// //               backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
// //               color: theme === 'dark' ? '#e0e0e0' : 'inherit',
// //               transition: 'transform 0.2s',
// //               '&:hover': {
// //                 transform: 'translateY(-4px)',
// //                 boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
// //               }
// //             }}
// //           >
// //             <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
// //               <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
// //                 <Rule color="primary" />
// //                 <Typography variant="subtitle2" sx={{ ml: 1 }}>
// //                   Rule Chains
// //                 </Typography>
// //               </Box>
// //               <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
// //                 {stats.rules}
// //               </Typography>
// //               <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
// //                 <Typography variant="caption" color="text.secondary">
// //                   Active rule chains
// //                 </Typography>
// //               </Box>
// //             </CardContent>
// //           </Card>
// //         </Grid>
        
// //         <Grid item xs={6} sm={4} md={2}>
// //           <Card 
// //             sx={{ 
// //               height: '100%',
// //               backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
// //               color: theme === 'dark' ? '#e0e0e0' : 'inherit',
// //               transition: 'transform 0.2s',
// //               '&:hover': {
// //                 transform: 'translateY(-4px)',
// //                 boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
// //               }
// //             }}
// //           >
// //             <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
// //               <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
// //                 <Dashboard color="primary" />
// //                 <Typography variant="subtitle2" sx={{ ml: 1 }}>
// //                   Dashboards
// //                 </Typography>
// //               </Box>
// //               <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
// //                 {stats.dashboards}
// //               </Typography>
// //               <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
// //                 <Typography variant="caption" color="text.secondary">
// //                   Total dashboards
// //                 </Typography>
// //               </Box>
// //             </CardContent>
// //           </Card>
// //         </Grid>
        
// //         <Grid item xs={6} sm={4} md={2}>
// //           <Card 
// //             sx={{ 
// //               height: '100%',
// //               backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
// //               color: theme === 'dark' ? '#e0e0e0' : 'inherit',
// //               transition: 'transform 0.2s',
// //               '&:hover': {
// //                 transform: 'translateY(-4px)',
// //                 boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
// //               }
// //             }}
// //           >
// //             <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
// //               <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
// //                 <Notifications color="primary" />
// //                 <Typography variant="subtitle2" sx={{ ml: 1 }}>
// //                   Notifications
// //                 </Typography>
// //               </Box>
// //               <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
// //                 12
// //               </Typography>
// //               <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
// //                 <Typography variant="caption" color="text.secondary">
// //                   3 unread
// //                 </Typography>
// //               </Box>
// //             </CardContent>
// //           </Card>
// //         </Grid>
        
// //         {/* Charts */}
// //         <Grid item xs={12} md={8}>
// //           <Card 
// //             sx={{ 
// //               height: '100%',
// //               backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
// //               color: theme === 'dark' ? '#e0e0e0' : 'inherit'
// //             }}
// //           >
// //             <CardContent>
// //               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
// //                 <Typography variant="h6" component="div">
// //                   Device Activity
// //                 </Typography>
// //                 <Button 
// //                   endIcon={<ArrowForward />} 
// //                   component={Link} 
// //                   to="/devices"
// //                   size="small"
// //                 >
// //                   View All
// //                 </Button>
// //               </Box>
// //               <Box sx={{ height: 300 }}>
// //                 <LineChartWidget 
// //                   data={[
// //                     { name: 'Temperature', data: [28, 29, 33, 36, 32, 32, 33] },
// //                     { name: 'Humidity', data: [12, 11, 14, 18, 17, 13, 13] }
// //                   ]}
// //                   labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
// //                   colors={['#4caf50', '#2196f3']}
// //                 />
// //               </Box>
// //             </CardContent>
// //           </Card>
// //         </Grid>
        
// //         <Grid item xs={12} md={4}>
// //           <Card 
// //             sx={{ 
// //               height: '100%',
// //               backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
// //               color: theme === 'dark' ? '#e0e0e0' : 'inherit'
// //             }}
// //           >
// //             <CardContent>
// //               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
// //                 <Typography variant="h6" component="div">
// //                   Device Status
// //                 </Typography>
// //                 <IconButton size="small">
// //                   <Refresh fontSize="small" />
// //                 </IconButton>
// //               </Box>
// //               <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
// //                 <PieChartWidget 
// //                   data={[
// //                     { name: 'Active', value: stats.active },
// //                     { name: 'Inactive', value: stats.inactive }
// //                   ]}
// //                   colors={['#4caf50', '#f44336']}
// //                 />
// //               </Box>
// //             </CardContent>
// //           </Card>
// //         </Grid>
        
// //         {/* Recent Alarms */}
// //         <Grid item xs={12} md={6}>
// //           <Card 
// //             sx={{ 
// //               backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
// //               color: theme === 'dark' ? '#e0e0e0' : 'inherit'
// //             }}
// //           >
// //             <CardContent>
// //               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
// //                 <Typography variant="h6" component="div">
// //                   Recent Alarms
// //                 </Typography>
// //                 <Button 
// //                   endIcon={<ArrowForward />} 
// //                   component={Link} 
// //                   to="/alarms"
// //                   size="small"
// //                 >
// //                   View All
// //                 </Button>
// //               </Box>
              
// //               {recentAlarms.length === 0 ? (
// //                 <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
// //                   No recent alarms
// //                 </Typography>
// //               ) : (
// //                 <Box>
// //                   {recentAlarms.map((alarm, index) => (
// //                     <React.Fragment key={alarm.id}>
// //                       <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
// //                         <Box sx={{ mr: 1 }}>
// //                           {getSeverityIcon(alarm.severity)}
// //                         </Box>
// //                         <Box sx={{ flex: 1 }}>
// //                           <Typography variant="body2" sx={{ fontWeight: 500 }}>
// //                             {alarm.type}
// //                           </Typography>
// //                           <Box sx={{ display: 'flex', alignItems: 'center' }}>
// //                             <Typography variant="caption" color="text.secondary">
// //                               {alarm.originator}
// //                             </Typography>
// //                             <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
// //                               {alarm.time}
// //                             </Typography>
// //                           </Box>
// //                         </Box>
// //                         <Box 
// //                           sx={{ 
// //                             ml: 2, 
// //                             px: 1, 
// //                             py: 0.5, 
// //                             borderRadius: 1, 
// //                             fontSize: '0.75rem',
// //                             backgroundColor: getStatusColor(alarm.status),
// //                             color: '#fff'
// //                           }}
// //                         >
// //                           {alarm.status}
// //                         </Box>
// //                       </Box>
// //                       {index < recentAlarms.length - 1 && <Divider />}
// //                     </React.Fragment>
// //                   ))}
// //                 </Box>
// //               )}
// //             </CardContent>
// //           </Card>
// //         </Grid>
        
// //         {/* Recent Activity */}
// //         <Grid item xs={12} md={6}>
// //           <Card 
// //             sx={{ 
// //               backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
// //               color: theme === 'dark' ? '#e0e0e0' : 'inherit'
// //             }}
// //           >
// //             <CardContent>
// //               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
// //                 <Typography variant="h6" component="div">
// //                   Recent Activity
// //                 </Typography>
// //                 <Button 
// //                   endIcon={<ArrowForward />} 
// //                   component={Link} 
// //                   to="/audit-logs"
// //                   size="small"
// //                 >
// //                   View All
// //                 </Button>
// //               </Box>
              
// //               {recentActivity.length === 0 ? (
// //                 <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
// //                   No recent activity
// //                 </Typography>
// //               ) : (
// //                 <Box>
// //                   {recentActivity.map((activity, index) => (
// //                     <React.Fragment key={activity.id}>
// //                       <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
// //                         <Box sx={{ mr: 1 }}>
// //                           {activity.type === 'device' && <DevicesOther color="primary" />}
// //                           {activity.type === 'rule' && <Rule color="primary" />}
// //                           {activity.type === 'dashboard' && <Dashboard color="primary" />}
// //                           {activity.type === 'customer' && <People color="primary" />}
// //                         </Box>
// //                         <Box sx={{ flex: 1 }}>
// //                           <Typography variant="body2" sx={{ fontWeight: 500 }}>
// //                             {activity.entity} {activity.action}
// //                           </Typography>
// //                           <Box sx={{ display: 'flex', alignItems: 'center' }}>
// //                             <Typography variant="caption" color="text.secondary">
// //                               by {activity.user}
// //                             </Typography>
// //                             <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
// //                               {activity.time}
// //                             </Typography>
// //                           </Box>
// //                         </Box>
// //                       </Box>
// //                       {index < recentActivity.length - 1 && <Divider />}
// //                     </React.Fragment>
// //                   ))}
// //                 </Box>
// //               )}
// //             </CardContent>
// //           </Card>
// //         </Grid>
// //       </Grid>
// //     </Box>
// //   );
// // };

// // export default HomePage;
