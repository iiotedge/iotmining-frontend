import React, { useState } from 'react'
import { Card, CardContent, Typography, Box, IconButton } from '@mui/material'
import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import '../../../../styles/widget/control/control-widgets.css'

const ValueStepperWidget = ({ widget, onConfigChange }) => {
  const [value, setValue] = useState(27.5)

  const config = widget?.config || {}
  const { 
    min = 0,
    max = 50,
    step = 0.5,
    unit = '°C',
    precision = 1,
    apiEndpoint
  } = config

  const handleIncrement = async () => {
    const newValue = Math.min(value + step, max)
    await updateValue(newValue)
  }

  const handleDecrement = async () => {
    const newValue = Math.max(value - step, min)
    await updateValue(newValue)
  }

  const updateValue = async (newValue) => {
    try {
      if (apiEndpoint) {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command: 'set_value',
            value: newValue
          })
        })
        
        if (response.ok) {
          setValue(newValue)
        }
      } else {
        setValue(newValue)
      }
    } catch (error) {
      console.error('Value update failed:', error)
    }
  }

  return (
    <Card className="control-widget value-stepper-widget">
      <CardContent>
        <Box className="widget-header">
          <Typography variant="caption" color="textSecondary">
            control
          </Typography>
          <Box className="widget-badge">1</Box>
        </Box>
        
        <Box className="stepper-container">
          <IconButton 
            onClick={handleDecrement}
            disabled={value <= min}
            sx={{ 
              border: '2px solid #1976d2',
              borderRadius: '8px',
              color: '#1976d2'
            }}
          >
            <ChevronLeft />
          </IconButton>
          
          <Box className="value-display">
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {value.toFixed(precision)} {unit}
            </Typography>
          </Box>
          
          <IconButton 
            onClick={handleIncrement}
            disabled={value >= max}
            sx={{ 
              border: '2px solid #1976d2',
              borderRadius: '8px',
              color: '#1976d2'
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  )
}

export default ValueStepperWidget
