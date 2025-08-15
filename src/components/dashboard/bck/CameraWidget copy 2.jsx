// import React, { useState, useEffect, useRef } from 'react';
// import { Card, CardContent, CardHeader, IconButton, Menu, MenuItem, Typography, Box, CircularProgress, Tabs, Tab, Divider, Button, TextField, Switch, FormControlLabel, Slider, Select, FormControl, InputLabel } from '@mui/material';
// import { MoreVert, Videocam, Pause, PlayArrow, Settings, Fullscreen, FullscreenExit, Save, Cancel, Notifications, NotificationsOff, CalendarToday, AccessTime, MotionPhotosAuto, Visibility, VisibilityOff, Delete, Add, Edit } from '@mui/icons-material';
// import Hls from 'hls.js';
// import '../../../styles/camera-widget.css';
// import CameraEventSidebar from "./CameraEventSidebar"

// const CameraWidget = ({ config, onConfigChange }) => {
//   const [anchorEl, setAnchorEl] = useState(null);
//   const [activeTab, setActiveTab] = useState(0);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [isSettingsVisible, setIsSettingsVisible] = useState(false);
//   const [isPlaying, setIsPlaying] = useState(true);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isConnected, setIsConnected] = useState(false);
//   const [isLive, setIsLive] = useState(true);
//   const [currentTime, setCurrentTime] = useState(new Date());
//   const [alerts, setAlerts] = useState([]);
//   const [motionDetected, setMotionDetected] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [editedConfig, setEditedConfig] = useState({ ...config });
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [timeRange, setTimeRange] = useState([0, 24]);
//   const [isSidebarVisible, setIsSidebarVisible] = useState(false);

//   const videoRef = useRef(null);
//   const hlsRef = useRef(null);
//   const containerRef = useRef(null);
  
//   // Default configuration if none is provided
//   const defaultConfig = {
//     title: 'Camera Feed',
//     streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', // Default test HLS stream
//     username: '',
//     password: '',
//     refreshInterval: 30,
//     motionDetection: false,
//     motionSensitivity: 50,
//     notifications: true,
//     recordingEnabled: false,
//     storageRetention: 7,
//     ptz: false
//   };
  
//   // Merge provided config with defaults
//   const mergedConfig = { ...defaultConfig, ...config };
  
//   useEffect(() => {
//     setEditedConfig(mergedConfig);
//   }, [config]);
  
//   useEffect(() => {
//     if (isLive) {
//       initializeStream();
//     } else {
//       // Handle playback mode
//       loadRecordingForDate(selectedDate, timeRange);
//     }
    
//     // Update current time every second
//     const timeInterval = setInterval(() => {
//       setCurrentTime(new Date());
//     }, 1000);
    
//     // Simulate motion detection for demo purposes
//     const motionInterval = setInterval(() => {
//       if (mergedConfig.motionDetection) {
//         const detected = Math.random() > 0.7;
//         setMotionDetected(detected);
        
//         if (detected && mergedConfig.notifications) {
//           addAlert('Motion detected');
//         }
//       }
//     }, 10000);
    
//     return () => {
//       destroyStream();
//       clearInterval(timeInterval);
//       clearInterval(motionInterval);
//     };
//   }, [isLive, selectedDate, timeRange, mergedConfig.motionDetection, mergedConfig.notifications]);
  
//   const initializeStream = () => {
//     setIsLoading(true);
//     setIsConnected(false);
    
//     if (Hls.isSupported() && videoRef.current) {
//       if (hlsRef.current) {
//         hlsRef.current.destroy();
//       }
      
//       const hls = new Hls({
//         debug: false,
//         enableWorker: true,
//       });
      
//       hls.loadSource(mergedConfig.streamUrl);
//       hls.attachMedia(videoRef.current);
      
//       hls.on(Hls.Events.MANIFEST_PARSED, () => {
//         if (isPlaying) {
//           videoRef.current.play().catch(error => {
//             console.error('Error playing video:', error);
//           });
//         }
//         setIsLoading(false);
//         setIsConnected(true);
//       });
      
//       hls.on(Hls.Events.ERROR, (event, data) => {
//         if (data.fatal) {
//           switch (data.type) {
//             case Hls.ErrorTypes.NETWORK_ERROR:
//               console.error('Network error:', data);
//               hls.startLoad();
//               break;
//             case Hls.ErrorTypes.MEDIA_ERROR:
//               console.error('Media error:', data);
//               hls.recoverMediaError();
//               break;
//             default:
//               destroyStream();
//               break;
//           }
//           setIsConnected(false);
//         }
//       });
      
//       hlsRef.current = hls;
//     } else if (videoRef.current && videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
//       // For Safari
//       videoRef.current.src = mergedConfig.streamUrl;
//       videoRef.current.addEventListener('loadedmetadata', () => {
//         if (isPlaying) {
//           videoRef.current.play().catch(error => {
//             console.error('Error playing video:', error);
//           });
//         }
//         setIsLoading(false);
//         setIsConnected(true);
//       });
      
//       videoRef.current.addEventListener('error', () => {
//         setIsConnected(false);
//         setIsLoading(false);
//         addAlert('Error connecting to camera stream');
//       });
//     } else {
//       setIsLoading(false);
//       setIsConnected(false);
//       addAlert('HLS is not supported in this browser');
//     }
//   };
  
//   const destroyStream = () => {
//     if (hlsRef.current) {
//       hlsRef.current.destroy();
//       hlsRef.current = null;
//     }
    
//     if (videoRef.current) {
//       videoRef.current.removeAttribute('src');
//       videoRef.current.load();
//     }
//   };
  
//   const togglePlayPause = () => {
//     if (videoRef.current) {
//       if (isPlaying) {
//         videoRef.current.pause();
//       } else {
//         videoRef.current.play().catch(error => {
//           console.error('Error playing video:', error);
//         });
//       }
//       setIsPlaying(!isPlaying);
//     }
//   };
  
//   const toggleFullscreen = () => {
//     if (!document.fullscreenElement) {
//       containerRef.current.requestFullscreen().catch(err => {
//         addAlert(`Error attempting to enable fullscreen: ${err.message}`);
//       });
//       setIsFullscreen(true);
//     } else {
//       document.exitFullscreen();
//       setIsFullscreen(false);
//     }
//   };
  
//   const handleMenuOpen = (event) => {
//     setAnchorEl(event.currentTarget);
//   };
  
//   const handleMenuClose = () => {
//     setAnchorEl(null);
//   };
  
//   const handleTabChange = (event, newValue) => {
//     setActiveTab(newValue);
//   };
  
//   const toggleSettings = () => {
//     setIsSettingsVisible(!isSettingsVisible);
//     handleMenuClose();
//   };
  
//   const handleConfigChange = (field, value) => {
//     setEditedConfig(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   };
  
//   const saveSettings = () => {
//     onConfigChange(editedConfig);
//     setIsSettingsVisible(false);
//     // Reinitialize stream with new settings
//     destroyStream();
//     initializeStream();
//   };
  
//   const cancelSettings = () => {
//     setEditedConfig({ ...mergedConfig });
//     setIsSettingsVisible(false);
//   };
  
//   const addAlert = (message) => {
//     const newAlert = {
//       id: Date.now(),
//       message,
//       timestamp: new Date(),
//     };
//     setAlerts(prev => [newAlert, ...prev].slice(0, 50)); // Keep only the last 50 alerts
//   };
  
//   const deleteAlert = (alertId) => {
//     setAlerts(prev => prev.filter(alert => alert.id !== alertId));
//   };
  
//   const clearAllAlerts = () => {
//     setAlerts([]);
//   };
  
//   const loadRecordingForDate = (date, timeRange) => {
//     setIsLoading(true);
//     // Simulate loading recording data
//     setTimeout(() => {
//       // In a real implementation, this would fetch the recording URL for the selected date and time
//       setIsLoading(false);
//       setIsConnected(true);
//       addAlert(`Loaded recording for ${date.toLocaleDateString()} from ${timeRange[0]}:00 to ${timeRange[1]}:00`);
//     }, 1500);
//   };
  
//   const toggleLiveMode = () => {
//     setIsLive(!isLive);
//     if (!isLive) {
//       destroyStream();
//       initializeStream();
//     }
//   };
  
//   const handleDateChange = (date) => {
//     setSelectedDate(date);
//   };
  
//   const handleTimeRangeChange = (event, newValue) => {
//     setTimeRange(newValue);
//   };
  
//   const formatTimeRange = (range) => {
//     return `${range[0]}:00 - ${range[1]}:00`;
//   };
  
//   // PTZ Controls (simulated)
//   const handlePtzControl = (direction) => {
//     if (mergedConfig.ptz) {
//       addAlert(`PTZ Command: ${direction}`);
//       // In a real implementation, this would send commands to the camera
//     }
//   };
  
//   return (
//     <Card ref={containerRef} className="camera-widget">
//       <CardHeader
//         title={mergedConfig.title}
//         action={
//           <>
//             <IconButton onClick={handleMenuOpen}>
//               <MoreVert />
//             </IconButton>
//             <Menu
//               anchorEl={anchorEl}
//               open={Boolean(anchorEl)}
//               onClose={handleMenuClose}
//             >
//               <MenuItem onClick={toggleSettings}>
//                 <Settings fontSize="small" style={{ marginRight: 8 }} />
//                 Settings
//               </MenuItem>
//               <MenuItem onClick={toggleFullscreen}>
//                 {isFullscreen ? (
//                   <>
//                     <FullscreenExit fontSize="small" style={{ marginRight: 8 }} />
//                     Exit Fullscreen
//                   </>
//                 ) : (
//                   <>
//                     <Fullscreen fontSize="small" style={{ marginRight: 8 }} />
//                     Fullscreen
//                   </>
//                 )}
//               </MenuItem>
//               <MenuItem onClick={toggleLiveMode}>
//                 {isLive ? (
//                   <>
//                     <CalendarToday fontSize="small" style={{ marginRight: 8 }} />
//                     View Recordings
//                   </>
//                 ) : (
//                   <>
//                     <Videocam fontSize="small" style={{ marginRight: 8 }} />
//                     Live View
//                   </>
//                 )}
//               </MenuItem>
//               <MenuItem onClick={() => addAlert('Screenshot taken')}>
//                 <Videocam fontSize="small" style={{ marginRight: 8 }} />
//                 Take Screenshot
//               </MenuItem>
//             </Menu>
//           </>
//         }
//       />
      
//       <CardContent className="camera-content" >
//         {isSettingsVisible ? (
//           <div className="camera-settings">
//             <Typography variant="h6">Camera Settings</Typography>
//             <TextField
//               label="Camera Name"
//               value={editedConfig.title}
//               onChange={(e) => handleConfigChange('title', e.target.value)}
//               fullWidth
//               margin="normal"
//             />
//             <TextField
//               label="Stream URL"
//               value={editedConfig.streamUrl}
//               onChange={(e) => handleConfigChange('streamUrl', e.target.value)}
//               fullWidth
//               margin="normal"
//             />
//             <TextField
//               label="Username"
//               value={editedConfig.username}
//               onChange={(e) => handleConfigChange('username', e.target.value)}
//               fullWidth
//               margin="normal"
//             />
//             <TextField
//               label="Password"
//               type={showPassword ? 'text' : 'password'}
//               value={editedConfig.password}
//               onChange={(e) => handleConfigChange('password', e.target.value)}
//               fullWidth
//               margin="normal"
//               InputProps={{
//                 endAdornment: (
//                   <IconButton onClick={() => setShowPassword(!showPassword)}>
//                     {showPassword ? <VisibilityOff /> : <Visibility />}
//                   </IconButton>
//                 ),
//               }}
//             />
//             <TextField
//               label="Refresh Interval (seconds)"
//               type="number"
//               value={editedConfig.refreshInterval}
//               onChange={(e) => handleConfigChange('refreshInterval', parseInt(e.target.value))}
//               fullWidth
//               margin="normal"
//             />
//             <FormControlLabel
//               control={
//                 <Switch
//                   checked={editedConfig.motionDetection}
//                   onChange={(e) => handleConfigChange('motionDetection', e.target.checked)}
//                 />
//               }
//               label="Motion Detection"
//             />
//             {editedConfig.motionDetection && (
//               <div className="setting-group">
//                 <Typography id="motion-sensitivity-slider">
//                   Motion Sensitivity: {editedConfig.motionSensitivity}%
//                 </Typography>
//                 <Slider
//                   value={editedConfig.motionSensitivity}
//                   onChange={(e, value) => handleConfigChange('motionSensitivity', value)}
//                   aria-labelledby="motion-sensitivity-slider"
//                   min={0}
//                   max={100}
//                 />
//               </div>
//             )}
//             <FormControlLabel
//               control={
//                 <Switch
//                   checked={editedConfig.notifications}
//                   onChange={(e) => handleConfigChange('notifications', e.target.checked)}
//                 />
//               }
//               label="Enable Notifications"
//             />
//             <FormControlLabel
//               control={
//                 <Switch
//                   checked={editedConfig.recordingEnabled}
//                   onChange={(e) => handleConfigChange('recordingEnabled', e.target.checked)}
//                 />
//               }
//               label="Enable Recording"
//             />
//             {editedConfig.recordingEnabled && (
//               <TextField
//                 label="Storage Retention (days)"
//                 type="number"
//                 value={editedConfig.storageRetention}
//                 onChange={(e) => handleConfigChange('storageRetention', parseInt(e.target.value))}
//                 fullWidth
//                 margin="normal"
//               />
//             )}
//             <FormControlLabel
//               control={
//                 <Switch
//                   checked={editedConfig.ptz}
//                   onChange={(e) => handleConfigChange('ptz', e.target.checked)}
//                 />
//               }
//               label="PTZ Controls"
//             />
//             <Box mt={2} display="flex" justifyContent="flex-end">
//               <Button
//                 variant="outlined"
//                 color="secondary"
//                 startIcon={<Cancel />}
//                 onClick={cancelSettings}
//                 style={{ marginRight: 8 }}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 variant="contained"
//                 color="primary"
//                 startIcon={<Save />}
//                 onClick={saveSettings}
//               >
//                 Save
//               </Button>
//             </Box>
//           </div>
//         ) : (
//           <>
//           {!isSidebarVisible && (
//                 <div
//                   style={{
//                     position: 'absolute',
//                     top: 18,
//                     right: 52,
//                     zIndex: 1000,
//                   }}
//                 >
//                   <Button
//                     size="small"
//                     variant="contained"
//                     color="primary"
//                     onClick={() => setIsSidebarVisible(true)}
//                     startIcon={<Visibility />}
//                   >
//                     Show Events
//                   </Button>
//                 </div>
//               )}
//               {isSidebarVisible && (
//                 <div
//                   style={{
//                     position: 'absolute',
//                     top: 18,
//                     right: 52,
//                     zIndex: 1000,
//                   }}
//                 >
//                   <Button
//                     size="small"
//                     variant="contained"
//                     color="primary"
//                     onClick={() => setIsSidebarVisible(false)}
//                     startIcon={<Visibility />}
//                   >
//                     Hide Events
//                   </Button>
//                 </div>
//               )}
//             <div className="camera-left-panel" style={{ display: "flex", flexDirection: "row", padding: 0, position: 'relative' }}>
//                   <div className="video-container"   style={{ display: 'flex', flexDirection: 'row', padding: 0, position: 'relative', overflow: 'hidden' }}>
//                     {isLoading && (
//                       <div className="loading-overlay">
//                         <CircularProgress />
//                         <Typography variant="body2" style={{ marginTop: 8 }}>
//                           Connecting to camera...
//                         </Typography>
//                       </div>
//                     )}
                    
//                     {!isConnected && !isLoading && (
//                       <div className="error-overlay">
//                         <Typography variant="body1" color="error">
//                           Could not connect to camera
//                         </Typography>
//                         <Button
//                           variant="contained"
//                           color="primary"
//                           onClick={initializeStream}
//                           style={{ marginTop: 16 }}
//                         >
//                           Retry
//                         </Button>
//                       </div>
//                     )}
                    
//                     <video
//                       ref={videoRef}
//                       className="camera-video"
//                       playsInline
//                       muted
//                       controls={false}
//                     />
                    
//                     {motionDetected && mergedConfig.motionDetection && (
//                       <div className="motion-indicator">
//                         <MotionPhotosAuto color="error" />
//                         <Typography variant="body2" color="error">
//                           Motion Detected
//                         </Typography>
//                       </div>
//                     )}
                    
//                     <div className="video-controls">
//                       <IconButton onClick={togglePlayPause}>
//                         {isPlaying ? <Pause /> : <PlayArrow />}
//                       </IconButton>
                      
//                       {mergedConfig.ptz && (
//                         <div className="ptz-controls">
//                           <div className="ptz-row">
//                             <IconButton onClick={() => handlePtzControl('up')}>
//                               <span className="material-icons">arrow_upward</span>
//                             </IconButton>
//                           </div>
//                           <div className="ptz-row">
//                             <IconButton onClick={() => handlePtzControl('left')}>
//                               <span className="material-icons">arrow_back</span>
//                             </IconButton>
//                             <IconButton onClick={() => handlePtzControl('home')}>
//                               <span className="material-icons">home</span>
//                             </IconButton>
//                             <IconButton onClick={() => handlePtzControl('right')}>
//                               <span className="material-icons">arrow_forward</span>
//                             </IconButton>
//                           </div>
//                           <div className="ptz-row">
//                             <IconButton onClick={() => handlePtzControl('down')}>
//                               <span className="material-icons">arrow_downward</span>
//                             </IconButton>
//                           </div>
//                           <div className="ptz-row">
//                             <IconButton onClick={() => handlePtzControl('zoom_in')}>
//                               <span className="material-icons">zoom_in</span>
//                             </IconButton>
//                             <IconButton onClick={() => handlePtzControl('zoom_out')}>
//                               <span className="material-icons">zoom_out</span>
//                             </IconButton>
//                           </div>
//                         </div>
//                       )}
                      
//                       <div className="camera-info">
//                         <Typography variant="caption" className="timestamp">
//                           {currentTime.toLocaleTimeString()}
//                         </Typography>
//                         {isLive && (
//                           <div className="live-indicator">
//                             <span className="live-dot"></span>
//                             <Typography variant="caption">LIVE</Typography>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                   {isSidebarVisible && (
//                     <div style={{ width: '280px', borderLeft: '1px solid #ddd', position: 'relative' }}>
//                       <CameraEventSidebar isLive={isLive} currentTime={videoRef.current?.currentTime || 0} />
//                     </div>
//                   )}

//               </div>

            
//             <Tabs
//               value={activeTab}
//               onChange={handleTabChange}
//               variant="fullWidth"
//               className="camera-tabs"
//             >
//               <Tab label="Live" disabled={!isLive} />
//               <Tab label="Playback" />
//               <Tab label="Alerts" />
//             </Tabs>
            
//             <div className="tab-content">
//               {activeTab === 0 && isLive && (
//                 <div className="live-tab">
//                   <Typography variant="body2">
//                     Stream Status: {isConnected ? 'Connected' : 'Disconnected'}
//                   </Typography>
//                   <Typography variant="body2">
//                     Motion Detection: {mergedConfig.motionDetection ? 'Enabled' : 'Disabled'}
//                   </Typography>
//                   <Typography variant="body2">
//                     Notifications: {mergedConfig.notifications ? 'Enabled' : 'Disabled'}
//                   </Typography>
//                 </div>
//               )}
              
//               {activeTab === 1 && (
//                 <div className="playback-tab">
//                   <div className="date-selector">
//                     <Typography variant="body2">Select Date:</Typography>
//                     <input
//                       type="date"
//                       value={selectedDate.toISOString().split('T')[0]}
//                       onChange={(e) => handleDateChange(new Date(e.target.value))}
//                       className="date-input"
//                     />
//                   </div>
                  
//                   <div className="time-selector">
//                     <Typography variant="body2">
//                       Time Range: {formatTimeRange(timeRange)}
//                     </Typography>
//                     <Slider
//                       value={timeRange}
//                       onChange={handleTimeRangeChange}
//                       valueLabelDisplay="auto"
//                       min={0}
//                       max={24}
//                       step={1}
//                     />
//                   </div>
                  
//                   <Button
//                     variant="contained"
//                     color="primary"
//                     onClick={() => loadRecordingForDate(selectedDate, timeRange)}
//                     fullWidth
//                   >
//                     Load Recording
//                   </Button>
                  
//                   <Button
//                     variant="outlined"
//                     color="primary"
//                     onClick={toggleLiveMode}
//                     fullWidth
//                     style={{ marginTop: 8 }}
//                   >
//                     {isLive ? 'Switch to Playback' : 'Switch to Live'}
//                   </Button>
//                 </div>
//               )}
              
//               {activeTab === 2 && (
//                 <div className="alerts-tab">
//                   <div className="alerts-header">
//                     <Typography variant="subtitle1">
//                       Recent Alerts ({alerts.length})
//                     </Typography>
//                     <Button
//                       variant="outlined"
//                       size="small"
//                       onClick={clearAllAlerts}
//                       disabled={alerts.length === 0}
//                     >
//                       Clear All
//                     </Button>
//                   </div>
                  
//                   <div className="alerts-list">
//                     {alerts.length === 0 ? (
//                       <Typography variant="body2" className="no-alerts">
//                         No alerts to display
//                       </Typography>
//                     ) : (
//                       alerts.map(alert => (
//                         <div key={alert.id} className="alert-item">
//                           <div className="alert-content">
//                             <Typography variant="body2">{alert.message}</Typography>
//                             <Typography variant="caption" color="textSecondary">
//                               {alert.timestamp.toLocaleTimeString()}
//                             </Typography>
//                           </div>
//                           <IconButton
//                             size="small"
//                             onClick={() => deleteAlert(alert.id)}
//                           >
//                             <Delete fontSize="small" />
//                           </IconButton>
//                         </div>
//                       ))
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </>
//         )}
//       </CardContent>
//     </Card>
//   );
// };

// export default CameraWidget;
