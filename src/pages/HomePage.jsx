import React, { useState, useEffect, useContext } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Button, 
  CircularProgress,
  Paper,
  Divider,
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
  TrendingUp,
  Warning,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../components/theme/ThemeProvider';
import LineChartWidget from '../components/dashboard/widgets/LineChartWidget';
import PieChartWidget from '../components/dashboard/widgets/PieChartWidget';
import ValueCardWidget from '../components/dashboard/widgets/ValueCardWidget';
import AlarmCountWidget from '../components/dashboard/widgets/AlarmCountWidget';

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentAlarms, setRecentAlarms] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const { theme } = useContext(ThemeContext);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(muiTheme.breakpoints.down('md'));

  useEffect(() => {
    // Simulate loading data
    const fetchData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
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
          { id: 3, severity: 'minor', type: 'Low Battery', originator: 'Sensor C', time: '1 hour ago', status: 'cleared' },
          { id: 4, severity: 'warning', type: 'Humidity Warning', originator: 'Device D', time: '2 hours ago', status: 'active' }
        ]);
        
        setRecentActivity([
          { id: 1, type: 'device', action: 'created', entity: 'Temperature Sensor', user: 'admin', time: '15 min ago' },
          { id: 2, type: 'rule', action: 'updated', entity: 'Alert Rule', user: 'john.doe', time: '45 min ago' },
          { id: 3, type: 'dashboard', action: 'shared', entity: 'Operations Dashboard', user: 'admin', time: '1 hour ago' },
          { id: 4, type: 'customer', action: 'created', entity: 'ACME Corp', user: 'admin', time: '3 hours ago' }
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching home data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const refreshData = () => {
    // Reload data
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <Error color="error" />;
      case 'major':
        return <Warning sx={{ color: 'orange' }} />;
      case 'minor':
        return <Warning sx={{ color: 'gold' }} />;
      case 'warning':
        return <Warning sx={{ color: '#8BC34A' }} />;
      default:
        return <CheckCircle color="success" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#f44336';
      case 'acknowledged':
        return '#ff9800';
      case 'cleared':
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className={`home-page ${theme === 'dark' ? 'dark-theme' : ''}`} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Dashboard Overview
        </Typography>
        <Button 
          startIcon={<Refresh />} 
          onClick={refreshData}
          variant="outlined"
          size="small"
        >
          Refresh
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={6} sm={4} md={2}>
          <Card 
            sx={{ 
              height: '100%',
              backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
              color: theme === 'dark' ? '#e0e0e0' : 'inherit',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DevicesOther color="primary" />
                <Typography variant="subtitle2" sx={{ ml: 1 }}>
                  Devices
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {stats.devices}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {stats.active} active
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                  {stats.inactive} inactive
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={4} md={2}>
          <Card 
            sx={{ 
              height: '100%',
              backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
              color: theme === 'dark' ? '#e0e0e0' : 'inherit',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Warning color="error" />
                <Typography variant="subtitle2" sx={{ ml: 1 }}>
                  Alarms
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {stats.alarms}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="caption" color="error">
                  {stats.alarms > 0 ? `${stats.alarms} active` : 'No active alarms'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={4} md={2}>
          <Card 
            sx={{ 
              height: '100%',
              backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
              color: theme === 'dark' ? '#e0e0e0' : 'inherit',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People color="primary" />
                <Typography variant="subtitle2" sx={{ ml: 1 }}>
                  Customers
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {stats.customers}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Total customers
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={4} md={2}>
          <Card 
            sx={{ 
              height: '100%',
              backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
              color: theme === 'dark' ? '#e0e0e0' : 'inherit',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Rule color="primary" />
                <Typography variant="subtitle2" sx={{ ml: 1 }}>
                  Rule Chains
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {stats.rules}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Active rule chains
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={4} md={2}>
          <Card 
            sx={{ 
              height: '100%',
              backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
              color: theme === 'dark' ? '#e0e0e0' : 'inherit',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Dashboard color="primary" />
                <Typography variant="subtitle2" sx={{ ml: 1 }}>
                  Dashboards
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {stats.dashboards}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Total dashboards
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={4} md={2}>
          <Card 
            sx={{ 
              height: '100%',
              backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
              color: theme === 'dark' ? '#e0e0e0' : 'inherit',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Notifications color="primary" />
                <Typography variant="subtitle2" sx={{ ml: 1 }}>
                  Notifications
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                12
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  3 unread
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Charts */}
        <Grid item xs={12} md={8}>
          <Card 
            sx={{ 
              height: '100%',
              backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
              color: theme === 'dark' ? '#e0e0e0' : 'inherit'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div">
                  Device Activity
                </Typography>
                <Button 
                  endIcon={<ArrowForward />} 
                  component={Link} 
                  to="/devices"
                  size="small"
                >
                  View All
                </Button>
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
          <Card 
            sx={{ 
              height: '100%',
              backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
              color: theme === 'dark' ? '#e0e0e0' : 'inherit'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div">
                  Device Status
                </Typography>
                <IconButton size="small">
                  <Refresh fontSize="small" />
                </IconButton>
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
          <Card 
            sx={{ 
              backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
              color: theme === 'dark' ? '#e0e0e0' : 'inherit'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div">
                  Recent Alarms
                </Typography>
                <Button 
                  endIcon={<ArrowForward />} 
                  component={Link} 
                  to="/alarms"
                  size="small"
                >
                  View All
                </Button>
              </Box>
              
              {recentAlarms.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No recent alarms
                </Typography>
              ) : (
                <Box>
                  {recentAlarms.map((alarm, index) => (
                    <React.Fragment key={alarm.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                        <Box sx={{ mr: 1 }}>
                          {getSeverityIcon(alarm.severity)}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {alarm.type}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              {alarm.originator}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                              {alarm.time}
                            </Typography>
                          </Box>
                        </Box>
                        <Box 
                          sx={{ 
                            ml: 2, 
                            px: 1, 
                            py: 0.5, 
                            borderRadius: 1, 
                            fontSize: '0.75rem',
                            backgroundColor: getStatusColor(alarm.status),
                            color: '#fff'
                          }}
                        >
                          {alarm.status}
                        </Box>
                      </Box>
                      {index < recentAlarms.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
              color: theme === 'dark' ? '#e0e0e0' : 'inherit'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div">
                  Recent Activity
                </Typography>
                <Button 
                  endIcon={<ArrowForward />} 
                  component={Link} 
                  to="/audit-logs"
                  size="small"
                >
                  View All
                </Button>
              </Box>
              
              {recentActivity.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No recent activity
                </Typography>
              ) : (
                <Box>
                  {recentActivity.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                        <Box sx={{ mr: 1 }}>
                          {activity.type === 'device' && <DevicesOther color="primary" />}
                          {activity.type === 'rule' && <Rule color="primary" />}
                          {activity.type === 'dashboard' && <Dashboard color="primary" />}
                          {activity.type === 'customer' && <People color="primary" />}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {activity.entity} {activity.action}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              by {activity.user}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                              {activity.time}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      {index < recentActivity.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HomePage;
