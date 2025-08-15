import React, { useState, useEffect } from 'react'
import { Card, CardContent, Typography, Box } from '@mui/material'
import '../../../../styles/widget/control/control-widgets.css'

const LedIndicatorWidget = ({ widget, onConfigChange }) => {
  const [isActive, setIsActive] = useState(true)
  const [blinking, setBlinking] = useState(true)

  const config = widget?.config || {}
  const { 
    title = 'Led indicator',
    activeColor = '#4caf50',
    inactiveColor = '#e0e0e0',
    size = 50,
    blinkInterval = 100,
    dataSource
  } = config

  useEffect(() => {
    let interval
    if (blinking) {
      interval = setInterval(() => {
        setIsActive(prev => !prev)
      }, blinkInterval)
    }
    return () => clearInterval(interval)
  }, [blinking, blinkInterval])

  return (
    <Card className="control-widget led-indicator-widget">
      <CardContent>
        <Box className="widget-header">
          <Typography variant="caption" color="textSecondary">
            control
          </Typography>
          <Box className="widget-badge">1</Box>
        </Box>
        
        <Box className="led-indicator-container">
          <Typography variant="h6" sx={{ textAlign: 'center', mb: 2, color: '#9e9e9e' }}>
            {title}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box
              sx={{
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: isActive ? activeColor : inactiveColor,
                boxShadow: isActive ? `0 0 20px ${activeColor}` : 'none',
                transition: 'all 0.3s ease',
                border: '2px solid #fff',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '15%',
                  left: '25%',
                  width: '30%',
                  height: '30%',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  filter: 'blur(2px)'
                }
              }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default LedIndicatorWidget
