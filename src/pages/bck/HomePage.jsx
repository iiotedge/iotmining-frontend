import React, { useState, useEffect, useContext } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  DevicesOther,
  Storage,
  Rule,
  Dashboard,
  Notifications,
  People,
  Refresh,
  ArrowForward,
  Warning,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../components/theme/ThemeProvider';
import LineChartWidget from '../components/dashboard/widgets/LineChartWidget';
import PieChartWidget from '../components/dashboard/widgets/PieChartWidget';

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentAlarms, setRecentAlarms] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const { theme } = useContext(ThemeContext);
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStats({
        devices: 128,
        active: 112,
        inactive: 16,
        alarms: 7,
        customers: 24,
        rules: 15,
        dashboards: 8
      });
      setRecentAlarms([
        { id: 1, severity: 'critical', type: 'High Temperature', originator: 'Device A', time: '10 min ago', status: 'active' },
        { id: 2, severity: 'major', type: 'Connection Lost', originator: 'Gateway B', time: '25 min ago', status: 'acknowledged' },
        { id: 3, severity: 'minor', type: 'Low Battery', originator: 'Sensor C', time: '1 hour ago', status: 'cleared' }
      ]);
      setRecentActivity([
        { id: 1, type: 'device', action: 'created', entity: 'Temperature Sensor', user: 'admin', time: '15 min ago' },
        { id: 2, type: 'rule', action: 'updated', entity: 'Alert Rule', user: 'john.doe', time: '45 min ago' }
      ]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <Error color="error" />;
      case 'major':
        return <Warning sx={{ color: 'orange' }} />;
      case 'minor':
        return <Warning sx={{ color: 'gold' }} />;
      default:
        return <CheckCircle color="success" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#f44336';
      case 'acknowledged': return '#ff9800';
      case 'cleared': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const StatCard = ({ title, icon, value, subtextLeft, subtextRight }) => (
    <Card
      sx={{
        minHeight: 140,
        backgroundColor: isDark ? '#2d2d2d' : '#fff',
        color: isDark ? '#e0e0e0' : 'inherit',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
        }
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {icon}
          <Typography variant="subtitle2" sx={{ ml: 1 }}>{title}</Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{value}</Typography>
        {(subtextLeft || subtextRight) && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption">{subtextLeft}</Typography>
            <Typography variant="caption">{subtextRight}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  if (loading || !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Dashboard Overview</Typography>
        <Button startIcon={<Refresh />} onClick={refreshData} variant="outlined" size="small">Refresh</Button>
      </Box>

      <Grid container spacing={3}>
        {/* Stat Cards */}
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard title="Devices" icon={<DevicesOther color="primary" />} value={stats.devices} subtextLeft={`${stats.active} active`} subtextRight={`${stats.inactive} inactive`} /></Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard title="Alarms" icon={<Warning color="error" />} value={stats.alarms} subtextLeft={`${stats.alarms} active`} /></Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard title="Customers" icon={<People color="primary" />} value={stats.customers} subtextLeft="Total customers" /></Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard title="Rule Chains" icon={<Rule color="primary" />} value={stats.rules} subtextLeft="Active rules" /></Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard title="Dashboards" icon={<Dashboard color="primary" />} value={stats.dashboards} subtextLeft="Total dashboards" /></Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard title="Notifications" icon={<Notifications color="primary" />} value={12} subtextLeft="3 unread" /></Grid>

        {/* Charts */}
        <Grid item xs={12} md={8}>
          <Card sx={{ backgroundColor: isDark ? '#2d2d2d' : '#fff', color: isDark ? '#e0e0e0' : 'inherit' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Device Activity</Typography>
                <Button endIcon={<ArrowForward />} component={Link} to="/devices" size="small">View All</Button>
              </Box>
              <Box sx={{ height: 300 }}>
                <LineChartWidget
                  data={[
                    { name: 'Temperature', data: [28, 29, 33, 36, 32, 32, 33] },
                    { name: 'Humidity', data: [12, 11, 14, 18, 17, 13, 13] }
                  ]}
                  labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                  colors={['#4caf50', '#2196f3']}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: isDark ? '#2d2d2d' : '#fff', color: isDark ? '#e0e0e0' : 'inherit' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Device Status</Typography>
                <IconButton><Refresh fontSize="small" /></IconButton>
              </Box>
              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <PieChartWidget
                  data={[
                    { name: 'Active', value: stats.active },
                    { name: 'Inactive', value: stats.inactive }
                  ]}
                  colors={['#4caf50', '#f44336']}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Alarms */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: isDark ? '#2d2d2d' : '#fff', color: isDark ? '#e0e0e0' : 'inherit' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Recent Alarms</Typography>
                <Button endIcon={<ArrowForward />} to="/alarms" component={Link} size="small">View All</Button>
              </Box>
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {recentAlarms.map(alarm => (
                  <Box key={alarm.id} sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                    {getSeverityIcon(alarm.severity)}
                    <Box sx={{ ml: 1, flex: 1 }}>
                      <Typography variant="body2" fontWeight="500">{alarm.type}</Typography>
                      <Typography variant="caption" color="text.secondary">{alarm.originator} · {alarm.time}</Typography>
                    </Box>
                    <Box
                      sx={{
                        ml: 2,
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: getStatusColor(alarm.status),
                        color: '#fff',
                        fontSize: '0.75rem'
                      }}
                    >
                      {alarm.status}
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: isDark ? '#2d2d2d' : '#fff', color: isDark ? '#e0e0e0' : 'inherit' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Recent Activity</Typography>
                <Button endIcon={<ArrowForward />} to="/audit-logs" component={Link} size="small">View All</Button>
              </Box>
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {recentActivity.map(activity => (
                  <Box key={activity.id} sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                    <Box sx={{ mr: 1 }}>
                      {activity.type === 'device' && <DevicesOther color="primary" />}
                      {activity.type === 'rule' && <Rule color="primary" />}
                      {activity.type === 'dashboard' && <Dashboard color="primary" />}
                      {activity.type === 'customer' && <People color="primary" />}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="500">{activity.entity} {activity.action}</Typography>
                      <Typography variant="caption" color="text.secondary">by {activity.user} · {activity.time}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HomePage;
