import React, { useState } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography, 
  Paper, 
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Palette,
  Security,
  Person,
  Dashboard,
  Notifications,
  Language,
  Storage,
  People
} from '@mui/icons-material';
import ThemeSettings from '../components/settings/ThemeSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import UserSettings from '../components/settings/UserSettings';
import DashboardSettings from '../components/settings/DashboardSettings';
import CustomerDefaultDashboard from '../components/settings/CustomerDefaultDashboard';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <UserSettings />;
      case 1:
        return <ThemeSettings />;
      case 2:
        return <SecuritySettings />;
      case 3:
        return <DashboardSettings />;
      case 4:
        return <CustomerDefaultDashboard />;
      default:
        return <UserSettings />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Settings
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 3 }}>
        {isMobile ? (
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="settings tabs"
            >
              <Tab icon={<Person />} label="Profile" />
              <Tab icon={<Palette />} label="Theme" />
              <Tab icon={<Security />} label="Security" />
              <Tab icon={<Dashboard />} label="Dashboard" />
              <Tab icon={<People />} label="Customer Defaults" />
            </Tabs>
          </Paper>
        ) : (
          <Paper sx={{ width: 240, height: 'fit-content' }}>
            <Tabs
              orientation="vertical"
              value={activeTab}
              onChange={handleTabChange}
              aria-label="settings tabs"
              sx={{ borderRight: 1, borderColor: 'divider' }}
            >
              <Tab 
                icon={<Person />} 
                label="Profile" 
                iconPosition="start" 
                sx={{ 
                  alignItems: 'flex-start', 
                  minHeight: 48,
                  justifyContent: 'flex-start'
                }} 
              />
              <Tab 
                icon={<Palette />} 
                label="Theme" 
                iconPosition="start" 
                sx={{ 
                  alignItems: 'flex-start', 
                  minHeight: 48,
                  justifyContent: 'flex-start'
                }} 
              />
              <Tab 
                icon={<Security />} 
                label="Security" 
                iconPosition="start" 
                sx={{ 
                  alignItems: 'flex-start', 
                  minHeight: 48,
                  justifyContent: 'flex-start'
                }} 
              />
              <Tab 
                icon={<Dashboard />} 
                label="Dashboard" 
                iconPosition="start" 
                sx={{ 
                  alignItems: 'flex-start', 
                  minHeight: 48,
                  justifyContent: 'flex-start'
                }} 
              />
              <Tab 
                icon={<People />} 
                label="Customer Defaults" 
                iconPosition="start" 
                sx={{ 
                  alignItems: 'flex-start', 
                  minHeight: 48,
                  justifyContent: 'flex-start'
                }} 
              />
              <Divider />
              <Box sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  More settings coming soon
                </Typography>
              </Box>
            </Tabs>
          </Paper>
        )}
        
        <Paper sx={{ flex: 1, p: 3 }}>
          {renderTabContent()}
        </Paper>
      </Box>
    </Box>
  );
};

export default SettingsPage;
