export const dashboards = [
{
  "id": "10",
  "title": "Rack Management System",
  "widgets": [
    {
      "title": "Rack Fan System",
      "icon": "*",
      "type": "fan-control",
      "id": "d63594f9-4266-41f2-95a2-57c8cc415175",
      "config": {
        "title": "Rack Fan System",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "isJsonObject": true,
          "jsonObjectPath": "fans",
          "jsonObjectValue": {
            "fan_fail_alarm": false,
            "fans_status": {
              "FAN1": {
                "fail": false,
                "speed": 80,
                "status": "off"
              },
              "FAN2": {
                "fail": false,
                "speed": 80,
                "status": "off"
              },
              "FAN3": {
                "fail": false,
                "speed": 80,
                "status": "off"
              },
              "FAN4": {
                "fail": false,
                "speed": 80,
                "status": "off"
              },
              "FAN5": {
                "fail": false,
                "speed": 80,
                "status": "off"
              },
              "FAN6": {
                "fail": false,
                "speed": 80,
                "status": "off"
              }
            },
            "mode": "manual",
            "operating_fans": 0,
            "standby_fan_on": false,
            "total_fans": 6
          },
          "telemetryOut": [
            "level"
          ]
        },
        "fans": [
          {
            "id": "FAN1",
            "name": "Fan 1",
            "speedUnit": "%",
            "tempUnit": "°C",
            "maintenanceHours": 8760,
            "runtime": 0
          },
          {
            "id": "FAN2",
            "name": "Fan 2",
            "speedUnit": "%",
            "tempUnit": "°C",
            "maintenanceHours": 8760,
            "runtime": 0
          },
          {
            "id": "FAN3",
            "name": "Fan 3",
            "speedUnit": "%",
            "tempUnit": "°C",
            "maintenanceHours": 8760,
            "runtime": 0
          },
          {
            "id": "FAN4",
            "name": "Fan 4",
            "speedUnit": "%",
            "tempUnit": "°C",
            "maintenanceHours": 8760,
            "runtime": 0
          },
          {
            "id": "FAN5",
            "name": "Fan 5",
            "speedUnit": "%",
            "tempUnit": "°C",
            "maintenanceHours": 8760,
            "runtime": 0
          },
          {
            "id": "FAN6",
            "name": "Fan 6",
            "speedUnit": "%",
            "tempUnit": "°C",
            "maintenanceHours": 8760,
            "runtime": 0
          }
        ],
        "numFans": 6,
        "showStats": true,
        "showAlarms": false,
        "showAddFan": false,
        "showDeleteFan": false,
        "showEditFan": false,
        "showFanConfigDialog": false,
        "showAddFanDialog": true,
        "showStartStop": false,
        "showAllControl": false,
        "showSpeedSet": false,
        "showReset": false,
        "showAutoMode": false,
        "enableImportantFan": false,
        "importantFans": [],
        "minSpeed": 0,
        "maxSpeedPercent": 100,
        "maxSpeedRpm": 1800,
        "speedUnit": "%",
        "tempUnit": "°C",
        "maintenanceHours": 8760,
        "runtime": 0,
        "speedUnits": [
          {
            "value": "%",
            "label": "Percentage (%)"
          },
          {
            "value": "RPM",
            "label": "Rotation (RPM)"
          }
        ],
        "tempUnits": [
          {
            "value": "°C",
            "label": "Celsius (°C)"
          },
          {
            "value": "°F",
            "label": "Fahrenheit (°F)"
          },
          {
            "value": "K",
            "label": "Kelvin (K)"
          }
        ],
        "theme": "light",
        "showTemperature": false,
        "showPower": false,
        "showRuntime": false,
        "showMaintenance": false
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Rack Inside Temperature",
      "icon": "⭕",
      "type": "radial-gauge",
      "id": "7700941d-7ff3-46f7-b129-bd34c38d9e85",
      "config": {
        "title": "Rack Inside Temperature",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "environment.sensors.RMS-TEMPERATURE-IN-1.temperature"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.sensors.RMS-TEMPERATURE-IN-1.temperature",
          "isJsonObject": false
        },
        "timeWindow": {
          "displayValue": "Last 15 minutes",
          "value": "15_minutes",
          "type": "REALTIME"
        },
        "min": 0,
        "max": 100,
        "precision": 1,
        "thresholds": [
          0.35,
          0.5
        ],
        "colors": [
          "#52c41a",
          "#faad14",
          "#f5222d"
        ],
        "unit": "°C",
        "customUnit": ""
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Output Voltage",
      "icon": "📝",
      "type": "value-card",
      "id": "03c6c6f9-87fb-4305-80cc-e5f9908ac4f0",
      "config": {
        "title": "Output Voltage",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "environment.output_voltage"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.output_voltage",
          "isJsonObject": false
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Input Voltage",
      "icon": "📝",
      "type": "value-card",
      "id": "569696f4-f842-4471-8487-0d60085fedf8",
      "config": {
        "title": "Input Voltage",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "environment.input_voltage"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.input_voltage",
          "isJsonObject": false
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Door Lock Status",
      "icon": "✅",
      "type": "status-card",
      "id": "431ef4e8-7ca0-4642-8f07-d12a1f132b4f",
      "config": {
        "title": "Door Lock Status",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "access.door_status"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "access.door_status",
          "isJsonObject": false
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Rack Outside Temperature",
      "icon": "⭕",
      "type": "radial-gauge",
      "id": "5e96688d-a782-4135-a796-f0a4659c7fe5",
      "config": {
        "title": "Rack Outside Temperature",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "environment.sensors.RMS-TEMPERATURE-IN-2.temperature"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.sensors.RMS-TEMPERATURE-IN-2.temperature",
          "isJsonObject": false
        },
        "timeWindow": {
          "displayValue": "Last 15 minutes",
          "value": "15_minutes",
          "type": "REALTIME"
        },
        "min": 0,
        "max": 100,
        "precision": 1,
        "thresholds": [
          0.35,
          0.5
        ],
        "colors": [
          "#52c41a",
          "#faad14",
          "#f5222d"
        ],
        "unit": "°C",
        "customUnit": ""
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "System Health",
      "icon": "✅",
      "type": "status-card",
      "id": "801b35b6-3484-46fe-8116-f9757cb7d5f9",
      "config": {
        "title": "System Health",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "health"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "health",
          "isJsonObject": false
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Input & Output Voltage",
      "icon": "📈",
      "type": "line-chart",
      "id": "36e2869d-635c-4985-b320-893c763f4022",
      "config": {
        "title": "Input & Output Voltage",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "environment.input_voltage",
            "environment.output_voltage"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.input_voltage",
          "isJsonObject": false
        },
        "height": 300,
        "showLegend": true,
        "showPoints": true
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Battery Backup Time",
      "icon": "📝",
      "type": "value-card",
      "id": "90a0aa5d-0e80-4212-9df9-c3f93d0ce6c5",
      "config": {
        "title": "Battery Backup Time",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "environment.battery_backup_time"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.battery_backup_time",
          "isJsonObject": false
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Door Lock System",
      "icon": "🎦",
      "type": "door-lock",
      "id": "531ae74b-f9ce-44cd-b560-d6456600ff6c",
      "config": {
        "title": "Door Lock System",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "isJsonObject": true,
          "jsonObjectPath": "access",
          "jsonObjectValue": {
            "door_locked": true,
            "door_status": "closed",
            "failed_attempts": 0,
            "last_access": {
              "method": "",
              "result": "",
              "timestamp": "",
              "user": ""
            },
            "unauthorized_access": false
          },
          "telemetry": []
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Water Logging Detection",
      "icon": "🚨",
      "type": "water-logging",
      "id": "ad4b23a3-417a-4ca1-bd64-747b276099d6",
      "config": {
        "title": "Water Logging Detection",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "environment.water_logging"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.water_logging",
          "isJsonObject": false
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Fire Detection",
      "icon": "🚨",
      "type": "fire-detection",
      "id": "e23809c2-bdfb-4f31-ae7b-5c79e639e676",
      "config": {
        "title": "Fire Detection",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "environment.fire_detected"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.fire_detected",
          "isJsonObject": false
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Door Hidden Camera",
      "icon": "🎦",
      "type": "image-card",
      "id": "57b0476d-e990-455f-adba-b62d67b273e5",
      "config": {
        "title": "Door Hidden Camera",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "isJsonObject": true,
          "jsonObjectPath": "hidden_camera",
          "jsonObjectValue": {
            "door_event_snapshot": "success",
            "filename": "",
            "snap_id": "650",
            "snapshots_stored": 0,
            "timestamp": "2025-07-21T17:35:15.086533257",
            "url": "http://localhost:9000/iotmining-rms/0782f4a1-ddc6-4718-b277-5b8191ba7713/1c59b850-035a-4f6a-8e4d-74d5b34197e9/CAMERA/snapshot/2025/07/21/snap_20250721_173511.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin%2F20250721%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250721T120515Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=a60f6cbf6708680d0d9af7aece2c3c1769ec6e6247f6ca83c0839e7185310805"
          },
          "telemetry": []
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Device Control Command",
      "icon": "*",
      "type": "device-command-control",
      "id": "c88b0a99-bad6-4350-b807-b04f82bbd064",
      "config": {
        "title": "Device Control Command",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "health"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "health",
          "isJsonObject": false
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Humidity",
      "icon": "⭕",
      "type": "radial-gauge",
      "id": "324f35dd-1390-451b-8455-895f56f61b81",
      "config": {
        "title": "Humidity",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "environment.sensors.RMS-TEMPERATURE-IN-1.humidity"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.sensors.RMS-TEMPERATURE-IN-1.humidity",
          "isJsonObject": false
        },
        "timeWindow": {
          "displayValue": "Last 15 minutes",
          "value": "15_minutes",
          "type": "REALTIME"
        },
        "min": 0,
        "max": 100,
        "precision": 1,
        "thresholds": [
          0.3,
          0.7
        ],
        "colors": [
          "#69ccec",
          "#2e9fe5",
          "#4155ec"
        ],
        "unit": "%",
        "customUnit": ""
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    }
  ],
  "layouts": {
    "lg": [
      {
        "w": 6,
        "h": 16,
        "x": 6,
        "y": 0,
        "i": "d63594f9-4266-41f2-95a2-57c8cc415175",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 6,
        "x": 4,
        "y": 0,
        "i": "7700941d-7ff3-46f7-b129-bd34c38d9e85",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 6,
        "y": 24,
        "i": "03c6c6f9-87fb-4305-80cc-e5f9908ac4f0",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 7,
        "x": 4,
        "y": 21,
        "i": "569696f4-f842-4471-8487-0d60085fedf8",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 6,
        "x": 2,
        "y": 6,
        "i": "431ef4e8-7ca0-4642-8f07-d12a1f132b4f",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 6,
        "x": 2,
        "y": 0,
        "i": "5e96688d-a782-4135-a796-f0a4659c7fe5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 6,
        "x": 0,
        "y": 0,
        "i": "801b35b6-3484-46fe-8116-f9757cb7d5f9",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 3,
        "h": 8,
        "x": 6,
        "y": 16,
        "i": "36e2869d-635c-4985-b320-893c763f4022",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 6,
        "x": 0,
        "y": 15,
        "i": "90a0aa5d-0e80-4212-9df9-c3f93d0ce6c5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 9,
        "x": 0,
        "y": 6,
        "i": "531ae74b-f9ce-44cd-b560-d6456600ff6c",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 7,
        "x": 2,
        "y": 21,
        "i": "ad4b23a3-417a-4ca1-bd64-747b276099d6",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 7,
        "x": 0,
        "y": 21,
        "i": "e23809c2-bdfb-4f31-ae7b-5c79e639e676",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 9,
        "x": 2,
        "y": 12,
        "i": "57b0476d-e990-455f-adba-b62d67b273e5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 3,
        "h": 8,
        "x": 9,
        "y": 16,
        "i": "c88b0a99-bad6-4350-b807-b04f82bbd064",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 6,
        "x": 4,
        "y": 6,
        "i": "324f35dd-1390-451b-8455-895f56f61b81",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      }
    ],
    "md": [
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 0,
        "i": "d63594f9-4266-41f2-95a2-57c8cc415175",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 4,
        "i": "7700941d-7ff3-46f7-b129-bd34c38d9e85",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 16,
        "i": "03c6c6f9-87fb-4305-80cc-e5f9908ac4f0",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 20,
        "i": "569696f4-f842-4471-8487-0d60085fedf8",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 24,
        "i": "431ef4e8-7ca0-4642-8f07-d12a1f132b4f",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 8,
        "x": 1,
        "y": 8,
        "i": "5e96688d-a782-4135-a796-f0a4659c7fe5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 5,
        "x": 3,
        "y": 8,
        "i": "801b35b6-3484-46fe-8116-f9757cb7d5f9",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 28,
        "i": "36e2869d-635c-4985-b320-893c763f4022",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 32,
        "i": "90a0aa5d-0e80-4212-9df9-c3f93d0ce6c5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 36,
        "i": "531ae74b-f9ce-44cd-b560-d6456600ff6c",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 40,
        "i": "ad4b23a3-417a-4ca1-bd64-747b276099d6",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 44,
        "i": "e23809c2-bdfb-4f31-ae7b-5c79e639e676",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 48,
        "i": "57b0476d-e990-455f-adba-b62d67b273e5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "i": "c88b0a99-bad6-4350-b807-b04f82bbd064",
        "x": 0,
        "y": 26,
        "w": 4,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "324f35dd-1390-451b-8455-895f56f61b81",
        "x": 6,
        "y": 0,
        "w": 4,
        "h": 4,
        "minW": 2,
        "minH": 2
      }
    ],
    "sm": [
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 0,
        "i": "d63594f9-4266-41f2-95a2-57c8cc415175",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 4,
        "i": "7700941d-7ff3-46f7-b129-bd34c38d9e85",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 16,
        "i": "03c6c6f9-87fb-4305-80cc-e5f9908ac4f0",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 20,
        "i": "569696f4-f842-4471-8487-0d60085fedf8",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 24,
        "i": "431ef4e8-7ca0-4642-8f07-d12a1f132b4f",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 8,
        "x": 0,
        "y": 8,
        "i": "5e96688d-a782-4135-a796-f0a4659c7fe5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 5,
        "x": 0,
        "y": 28,
        "i": "801b35b6-3484-46fe-8116-f9757cb7d5f9",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 33,
        "i": "36e2869d-635c-4985-b320-893c763f4022",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 37,
        "i": "90a0aa5d-0e80-4212-9df9-c3f93d0ce6c5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 41,
        "i": "531ae74b-f9ce-44cd-b560-d6456600ff6c",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 45,
        "i": "ad4b23a3-417a-4ca1-bd64-747b276099d6",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 49,
        "i": "e23809c2-bdfb-4f31-ae7b-5c79e639e676",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 53,
        "i": "57b0476d-e990-455f-adba-b62d67b273e5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "i": "c88b0a99-bad6-4350-b807-b04f82bbd064",
        "x": 0,
        "y": 26,
        "w": 8,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "324f35dd-1390-451b-8455-895f56f61b81",
        "x": 0,
        "y": 0,
        "w": 8,
        "h": 4,
        "minW": 2,
        "minH": 2
      }
    ],
    "xs": [
      {
        "w": 2,
        "h": 14,
        "x": 0,
        "y": 0,
        "i": "d63594f9-4266-41f2-95a2-57c8cc415175",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "i": "7700941d-7ff3-46f7-b129-bd34c38d9e85",
        "x": 0,
        "y": 0,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "03c6c6f9-87fb-4305-80cc-e5f9908ac4f0",
        "x": 0,
        "y": 16,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "569696f4-f842-4471-8487-0d60085fedf8",
        "x": 0,
        "y": 20,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "431ef4e8-7ca0-4642-8f07-d12a1f132b4f",
        "x": 0,
        "y": 20,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "w": 12,
        "h": 8,
        "x": 0,
        "y": 1,
        "i": "5e96688d-a782-4135-a796-f0a4659c7fe5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 12,
        "h": 5,
        "x": 0,
        "y": 1,
        "i": "801b35b6-3484-46fe-8116-f9757cb7d5f9",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "i": "36e2869d-635c-4985-b320-893c763f4022",
        "x": 0,
        "y": 16,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "90a0aa5d-0e80-4212-9df9-c3f93d0ce6c5",
        "x": 0,
        "y": 21,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "531ae74b-f9ce-44cd-b560-d6456600ff6c",
        "x": 0,
        "y": 0,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "ad4b23a3-417a-4ca1-bd64-747b276099d6",
        "x": 0,
        "y": 26,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "e23809c2-bdfb-4f31-ae7b-5c79e639e676",
        "x": 0,
        "y": 27,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "57b0476d-e990-455f-adba-b62d67b273e5",
        "x": 0,
        "y": 25,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "c88b0a99-bad6-4350-b807-b04f82bbd064",
        "x": 0,
        "y": 26,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "324f35dd-1390-451b-8455-895f56f61b81",
        "x": 0,
        "y": 0,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      }
    ]
  },
  "settings": {
    "timewindow": {
      "realtime": {
        "timewindowMs": 60000
      },
      "aggregation": {
        "type": "AVG",
        "limit": 200
      }
    },
    "gridSettings": {
      "backgroundColor": "#ffffff",
      "columns": 24,
      "margin": [
        10,
        10
      ],
      "backgroundImage": null
    }
  },
  "assignedCustomers": [],
  "timeWindow": {
    "displayValue": "Last 15 minutes",
    "value": "15_minutes",
    "type": "REALTIME"
  },
  "version": "1.0.0",
  "createdTime": "2025-07-26T13:50:59.935Z"
},
{
  "id": "11",
  "title": "Rack Management System - with JSON",
  "widgets": [
    {
      "title": "Rack Fan System",
      "icon": "*",
      "type": "fan-control",
      "id": "d63594f9-4266-41f2-95a2-57c8cc415175",
      "config": {
        "title": "Rack Fan System",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "isJsonObject": true,
          "jsonObjectPath": "fans",
          "jsonObjectValue": {
            "fan_fail_alarm": false,
            "fans_status": {
              "FAN1": {
                "fail": false,
                "speed": 80,
                "status": "off"
              },
              "FAN2": {
                "fail": false,
                "speed": 80,
                "status": "off"
              },
              "FAN3": {
                "fail": false,
                "speed": 80,
                "status": "off"
              },
              "FAN4": {
                "fail": false,
                "speed": 80,
                "status": "off"
              },
              "FAN5": {
                "fail": false,
                "speed": 80,
                "status": "off"
              },
              "FAN6": {
                "fail": false,
                "speed": 80,
                "status": "off"
              }
            },
            "mode": "manual",
            "operating_fans": 0,
            "standby_fan_on": false,
            "total_fans": 6
          },
          "telemetryOut": [
            "level"
          ],
          "telemetry": []
        },
        "fans": [
          {
            "id": "FAN1",
            "name": "Fan 1",
            "speedUnit": "%",
            "tempUnit": "°C",
            "maintenanceHours": 8760,
            "runtime": 0
          },
          {
            "id": "FAN2",
            "name": "Fan 2",
            "speedUnit": "%",
            "tempUnit": "°C",
            "maintenanceHours": 8760,
            "runtime": 0
          },
          {
            "id": "FAN3",
            "name": "Fan 3",
            "speedUnit": "%",
            "tempUnit": "°C",
            "maintenanceHours": 8760,
            "runtime": 0
          },
          {
            "id": "FAN4",
            "name": "Fan 4",
            "speedUnit": "%",
            "tempUnit": "°C",
            "maintenanceHours": 8760,
            "runtime": 0
          },
          {
            "id": "FAN5",
            "name": "Fan 5",
            "speedUnit": "%",
            "tempUnit": "°C",
            "maintenanceHours": 8760,
            "runtime": 0
          },
          {
            "id": "FAN6",
            "name": "Fan 6",
            "speedUnit": "%",
            "tempUnit": "°C",
            "maintenanceHours": 8760,
            "runtime": 0
          }
        ],
        "numFans": 6,
        "showStats": true,
        "showAlarms": false,
        "showAddFan": false,
        "showDeleteFan": false,
        "showEditFan": false,
        "showFanConfigDialog": false,
        "showAddFanDialog": true,
        "showStartStop": false,
        "showAllControl": false,
        "showSpeedSet": false,
        "showReset": false,
        "showAutoMode": false,
        "enableImportantFan": false,
        "importantFans": [],
        "minSpeed": 0,
        "maxSpeedPercent": 100,
        "maxSpeedRpm": 1800,
        "speedUnit": "%",
        "tempUnit": "°C",
        "maintenanceHours": 8760,
        "runtime": 0,
        "speedUnits": [
          {
            "value": "%",
            "label": "Percentage (%)"
          },
          {
            "value": "RPM",
            "label": "Rotation (RPM)"
          }
        ],
        "tempUnits": [
          {
            "value": "°C",
            "label": "Celsius (°C)"
          },
          {
            "value": "°F",
            "label": "Fahrenheit (°F)"
          },
          {
            "value": "K",
            "label": "Kelvin (K)"
          }
        ],
        "theme": "light",
        "showTemperature": false,
        "showPower": false,
        "showRuntime": false,
        "showMaintenance": false
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Rack Inside Temperature",
      "icon": "⭕",
      "type": "radial-gauge",
      "id": "7700941d-7ff3-46f7-b129-bd34c38d9e85",
      "config": {
        "title": "Rack Inside Temperature",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "environment.sensors.RMS-TEMPERATURE-IN-1.temperature"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.sensors.RMS-TEMPERATURE-IN-1.temperature",
          "isJsonObject": false
        },
        "timeWindow": {
          "displayValue": "Last 15 minutes",
          "value": "15_minutes",
          "type": "REALTIME"
        },
        "min": 0,
        "max": 100,
        "precision": 1,
        "thresholds": [
          0.35,
          0.5
        ],
        "colors": [
          "#52c41a",
          "#faad14",
          "#f5222d"
        ],
        "unit": "°C",
        "customUnit": ""
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Output Voltage",
      "icon": "📝",
      "type": "value-card",
      "id": "03c6c6f9-87fb-4305-80cc-e5f9908ac4f0",
      "config": {
        "title": "Output Voltage",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "environment.output_voltage"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.output_voltage",
          "isJsonObject": false
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Input Voltage",
      "icon": "📝",
      "type": "value-card",
      "id": "569696f4-f842-4471-8487-0d60085fedf8",
      "config": {
        "title": "Input Voltage",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "environment.input_voltage"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.input_voltage",
          "isJsonObject": false
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Door Lock Status",
      "icon": "✅",
      "type": "status-card",
      "id": "431ef4e8-7ca0-4642-8f07-d12a1f132b4f",
      "config": {
        "title": "Door Lock Status",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "access.door_status"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "access.door_status",
          "isJsonObject": false
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Rack Outside Temperature",
      "icon": "⭕",
      "type": "radial-gauge",
      "id": "5e96688d-a782-4135-a796-f0a4659c7fe5",
      "config": {
        "title": "Rack Outside Temperature",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "environment.sensors.RMS-TEMPERATURE-IN-2.temperature"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.sensors.RMS-TEMPERATURE-IN-2.temperature",
          "isJsonObject": false
        },
        "timeWindow": {
          "displayValue": "Last 15 minutes",
          "value": "15_minutes",
          "type": "REALTIME"
        },
        "min": 0,
        "max": 100,
        "precision": 1,
        "thresholds": [
          0.35,
          0.5
        ],
        "colors": [
          "#52c41a",
          "#faad14",
          "#f5222d"
        ],
        "unit": "°C",
        "customUnit": ""
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "System Health",
      "icon": "✅",
      "type": "status-card",
      "id": "801b35b6-3484-46fe-8116-f9757cb7d5f9",
      "config": {
        "title": "System Health",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "health"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "health",
          "isJsonObject": false
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Input & Output Voltage",
      "icon": "📈",
      "type": "line-chart",
      "id": "36e2869d-635c-4985-b320-893c763f4022",
      "config": {
        "title": "Input & Output Voltage",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "environment.input_voltage",
            "environment.output_voltage"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.input_voltage",
          "isJsonObject": false
        },
        "height": 300,
        "showLegend": true,
        "showPoints": true
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Battery Backup Time",
      "icon": "📝",
      "type": "value-card",
      "id": "90a0aa5d-0e80-4212-9df9-c3f93d0ce6c5",
      "config": {
        "title": "Battery Backup Time",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "environment.battery_backup_time"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.battery_backup_time",
          "isJsonObject": false
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Door Lock System",
      "icon": "🎦",
      "type": "door-lock",
      "id": "531ae74b-f9ce-44cd-b560-d6456600ff6c",
      "config": {
        "title": "Door Lock System",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "isJsonObject": true,
          "jsonObjectPath": "access",
          "jsonObjectValue": {
            "door_locked": true,
            "door_status": "closed",
            "failed_attempts": 0,
            "last_access": {
              "method": "",
              "result": "",
              "timestamp": "",
              "user": ""
            },
            "unauthorized_access": false
          },
          "telemetry": []
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Water Logging Detection",
      "icon": "🚨",
      "type": "water-logging",
      "id": "ad4b23a3-417a-4ca1-bd64-747b276099d6",
      "config": {
        "title": "Water Logging Detection",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "environment.water_logging"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.water_logging",
          "isJsonObject": false
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Fire Detection",
      "icon": "🚨",
      "type": "fire-detection",
      "id": "e23809c2-bdfb-4f31-ae7b-5c79e639e676",
      "config": {
        "title": "Fire Detection",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "environment.fire_detected"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.fire_detected",
          "isJsonObject": false
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Door Hidden Camera",
      "icon": "🎦",
      "type": "image-card",
      "id": "57b0476d-e990-455f-adba-b62d67b273e5",
      "config": {
        "title": "Door Hidden Camera",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "isJsonObject": true,
          "jsonObjectPath": "hidden_camera",
          "jsonObjectValue": {
            "door_event_snapshot": "success",
            "filename": "",
            "snap_id": "650",
            "snapshots_stored": 0,
            "timestamp": "2025-07-21T17:35:15.086533257",
            "url": "http://localhost:9000/iotmining-rms/0782f4a1-ddc6-4718-b277-5b8191ba7713/1c59b850-035a-4f6a-8e4d-74d5b34197e9/CAMERA/snapshot/2025/07/21/snap_20250721_173511.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin%2F20250721%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250721T120515Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=a60f6cbf6708680d0d9af7aece2c3c1769ec6e6247f6ca83c0839e7185310805"
          },
          "telemetry": []
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Device Control Command",
      "icon": "*",
      "type": "device-command-control",
      "id": "c88b0a99-bad6-4350-b807-b04f82bbd064",
      "config": {
        "title": "Device Control Command",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "health"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "health",
          "isJsonObject": false
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Humidity",
      "icon": "⭕",
      "type": "radial-gauge",
      "id": "324f35dd-1390-451b-8455-895f56f61b81",
      "config": {
        "title": "Humidity",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "telemetry": [
            "environment.sensors.RMS-TEMPERATURE-IN-1.humidity"
          ],
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.sensors.RMS-TEMPERATURE-IN-1.humidity",
          "isJsonObject": false
        },
        "timeWindow": {
          "displayValue": "Last 15 minutes",
          "value": "15_minutes",
          "type": "REALTIME"
        },
        "min": 0,
        "max": 100,
        "precision": 1,
        "thresholds": [
          0.3,
          0.7
        ],
        "colors": [
          "#69ccec",
          "#2e9fe5",
          "#4155ec"
        ],
        "unit": "%",
        "customUnit": ""
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Rack System Raw Data (JSON)",
      "icon": "📊",
      "type": "json-table",
      "id": "82b25a97-57a0-4a9a-8db3-9f3732a66e18",
      "config": {
        "title": "Rack System Raw Data (JSON)",
        "dataSource": {
          "type": "device",
          "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
          "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "isJsonObject": true,
          "jsonObjectPath": "ROOT",
          "jsonObjectValue": {
            "access": {
              "door_locked": true,
              "door_status": "closed",
              "failed_attempts": 0,
              "last_access": {
                "method": "",
                "result": "success",
                "timestamp": "2025-07-26T19:58:29+0530",
                "user": ""
              },
              "unauthorized_access": false
            },
            "alarms": [],
            "environment": {
              "battery_backup_time": 10,
              "fire_detected": false,
              "input_voltage": 120,
              "output_voltage": 12,
              "sensors": {
                "RMS-TEMPERATURE-IN-1": {
                  "humidity": 95,
                  "id": "",
                  "temperature": 31,
                  "timestamp": 0
                },
                "RMS-TEMPERATURE-IN-2": {
                  "id": "",
                  "temperature": 33,
                  "timestamp": 0
                }
              },
              "temperature": 33,
              "water_logging": false
            },
            "fans": {
              "fan_fail_alarm": false,
              "fans_status": {
                "FAN1": {
                  "fail": false,
                  "speed": 80,
                  "status": "on"
                },
                "FAN2": {
                  "fail": false,
                  "speed": 80,
                  "status": "on"
                },
                "FAN3": {
                  "fail": false,
                  "speed": 80,
                  "status": "on"
                },
                "FAN4": {
                  "fail": false,
                  "speed": 80,
                  "status": "off"
                },
                "FAN5": {
                  "fail": false,
                  "speed": 80,
                  "status": "off"
                },
                "FAN6": {
                  "fail": false,
                  "speed": 80,
                  "status": "off"
                }
              },
              "mode": "auto",
              "operating_fans": 3,
              "standby_fan_on": false,
              "total_fans": 6
            },
            "health": "Not Healthy",
            "hidden_camera": {
              "door_event_snapshot": "door_closed",
              "filename": "",
              "snap_id": "",
              "snapshots_stored": 0,
              "timestamp": "2025-07-26T19:15:50.386984051",
              "url": ""
            },
            "location": "DLI",
            "rack_id": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
            "timestamp": "2025-07-26T19:58:31+0530"
          }
        }
      },
      "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
      "deviceName": "SENSOR-003"
    }
  ],
  "layouts": {
    "lg": [
      {
        "w": 6,
        "h": 16,
        "x": 6,
        "y": 0,
        "i": "d63594f9-4266-41f2-95a2-57c8cc415175",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 6,
        "x": 4,
        "y": 0,
        "i": "7700941d-7ff3-46f7-b129-bd34c38d9e85",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 6,
        "y": 24,
        "i": "03c6c6f9-87fb-4305-80cc-e5f9908ac4f0",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 7,
        "x": 4,
        "y": 21,
        "i": "569696f4-f842-4471-8487-0d60085fedf8",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 6,
        "x": 2,
        "y": 6,
        "i": "431ef4e8-7ca0-4642-8f07-d12a1f132b4f",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 6,
        "x": 2,
        "y": 0,
        "i": "5e96688d-a782-4135-a796-f0a4659c7fe5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 6,
        "x": 0,
        "y": 0,
        "i": "801b35b6-3484-46fe-8116-f9757cb7d5f9",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 3,
        "h": 8,
        "x": 6,
        "y": 16,
        "i": "36e2869d-635c-4985-b320-893c763f4022",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 6,
        "x": 0,
        "y": 15,
        "i": "90a0aa5d-0e80-4212-9df9-c3f93d0ce6c5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 9,
        "x": 0,
        "y": 6,
        "i": "531ae74b-f9ce-44cd-b560-d6456600ff6c",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 7,
        "x": 2,
        "y": 21,
        "i": "ad4b23a3-417a-4ca1-bd64-747b276099d6",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 7,
        "x": 0,
        "y": 21,
        "i": "e23809c2-bdfb-4f31-ae7b-5c79e639e676",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 9,
        "x": 2,
        "y": 12,
        "i": "57b0476d-e990-455f-adba-b62d67b273e5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 3,
        "h": 8,
        "x": 9,
        "y": 16,
        "i": "c88b0a99-bad6-4350-b807-b04f82bbd064",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 6,
        "x": 4,
        "y": 6,
        "i": "324f35dd-1390-451b-8455-895f56f61b81",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 12,
        "h": 10,
        "x": 0,
        "y": 28,
        "i": "82b25a97-57a0-4a9a-8db3-9f3732a66e18",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      }
    ],
    "md": [
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 0,
        "i": "d63594f9-4266-41f2-95a2-57c8cc415175",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 4,
        "i": "7700941d-7ff3-46f7-b129-bd34c38d9e85",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 16,
        "i": "03c6c6f9-87fb-4305-80cc-e5f9908ac4f0",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 20,
        "i": "569696f4-f842-4471-8487-0d60085fedf8",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 24,
        "i": "431ef4e8-7ca0-4642-8f07-d12a1f132b4f",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 8,
        "x": 1,
        "y": 8,
        "i": "5e96688d-a782-4135-a796-f0a4659c7fe5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 5,
        "x": 3,
        "y": 8,
        "i": "801b35b6-3484-46fe-8116-f9757cb7d5f9",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 28,
        "i": "36e2869d-635c-4985-b320-893c763f4022",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 32,
        "i": "90a0aa5d-0e80-4212-9df9-c3f93d0ce6c5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 36,
        "i": "531ae74b-f9ce-44cd-b560-d6456600ff6c",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 40,
        "i": "ad4b23a3-417a-4ca1-bd64-747b276099d6",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 44,
        "i": "e23809c2-bdfb-4f31-ae7b-5c79e639e676",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 48,
        "i": "57b0476d-e990-455f-adba-b62d67b273e5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "i": "c88b0a99-bad6-4350-b807-b04f82bbd064",
        "x": 0,
        "y": 26,
        "w": 4,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "324f35dd-1390-451b-8455-895f56f61b81",
        "x": 6,
        "y": 0,
        "w": 4,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "82b25a97-57a0-4a9a-8db3-9f3732a66e18",
        "x": 0,
        "y": 28,
        "w": 4,
        "h": 4,
        "minW": 2,
        "minH": 2
      }
    ],
    "sm": [
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 0,
        "i": "d63594f9-4266-41f2-95a2-57c8cc415175",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 4,
        "i": "7700941d-7ff3-46f7-b129-bd34c38d9e85",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 16,
        "i": "03c6c6f9-87fb-4305-80cc-e5f9908ac4f0",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 20,
        "i": "569696f4-f842-4471-8487-0d60085fedf8",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 24,
        "i": "431ef4e8-7ca0-4642-8f07-d12a1f132b4f",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 8,
        "x": 0,
        "y": 8,
        "i": "5e96688d-a782-4135-a796-f0a4659c7fe5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 5,
        "x": 0,
        "y": 28,
        "i": "801b35b6-3484-46fe-8116-f9757cb7d5f9",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 33,
        "i": "36e2869d-635c-4985-b320-893c763f4022",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 37,
        "i": "90a0aa5d-0e80-4212-9df9-c3f93d0ce6c5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 41,
        "i": "531ae74b-f9ce-44cd-b560-d6456600ff6c",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 45,
        "i": "ad4b23a3-417a-4ca1-bd64-747b276099d6",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 49,
        "i": "e23809c2-bdfb-4f31-ae7b-5c79e639e676",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 53,
        "i": "57b0476d-e990-455f-adba-b62d67b273e5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "i": "c88b0a99-bad6-4350-b807-b04f82bbd064",
        "x": 0,
        "y": 26,
        "w": 8,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "324f35dd-1390-451b-8455-895f56f61b81",
        "x": 0,
        "y": 0,
        "w": 8,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "82b25a97-57a0-4a9a-8db3-9f3732a66e18",
        "x": 0,
        "y": 28,
        "w": 8,
        "h": 4,
        "minW": 2,
        "minH": 2
      }
    ],
    "xs": [
      {
        "w": 2,
        "h": 14,
        "x": 0,
        "y": 0,
        "i": "d63594f9-4266-41f2-95a2-57c8cc415175",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "i": "7700941d-7ff3-46f7-b129-bd34c38d9e85",
        "x": 0,
        "y": 0,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "03c6c6f9-87fb-4305-80cc-e5f9908ac4f0",
        "x": 0,
        "y": 16,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "569696f4-f842-4471-8487-0d60085fedf8",
        "x": 0,
        "y": 20,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "431ef4e8-7ca0-4642-8f07-d12a1f132b4f",
        "x": 0,
        "y": 20,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "w": 12,
        "h": 8,
        "x": 0,
        "y": 1,
        "i": "5e96688d-a782-4135-a796-f0a4659c7fe5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 12,
        "h": 5,
        "x": 0,
        "y": 1,
        "i": "801b35b6-3484-46fe-8116-f9757cb7d5f9",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "i": "36e2869d-635c-4985-b320-893c763f4022",
        "x": 0,
        "y": 16,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "90a0aa5d-0e80-4212-9df9-c3f93d0ce6c5",
        "x": 0,
        "y": 21,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "531ae74b-f9ce-44cd-b560-d6456600ff6c",
        "x": 0,
        "y": 0,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "ad4b23a3-417a-4ca1-bd64-747b276099d6",
        "x": 0,
        "y": 26,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "e23809c2-bdfb-4f31-ae7b-5c79e639e676",
        "x": 0,
        "y": 27,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "57b0476d-e990-455f-adba-b62d67b273e5",
        "x": 0,
        "y": 25,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "c88b0a99-bad6-4350-b807-b04f82bbd064",
        "x": 0,
        "y": 26,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "324f35dd-1390-451b-8455-895f56f61b81",
        "x": 0,
        "y": 0,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "82b25a97-57a0-4a9a-8db3-9f3732a66e18",
        "x": 0,
        "y": 28,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      }
    ]
  },
  "settings": {
    "timewindow": {
      "realtime": {
        "timewindowMs": 60000
      },
      "aggregation": {
        "type": "AVG",
        "limit": 200
      }
    },
    "gridSettings": {
      "backgroundColor": "#ffffff",
      "columns": 24,
      "margin": [
        10,
        10
      ],
      "backgroundImage": null
    }
  },
  "assignedCustomers": [],
  "timeWindow": {
    "displayValue": "Last 15 minutes",
    "value": "15_minutes",
    "type": "REALTIME"
  },
  "version": "1.0.0",
  "createdTime": "2025-07-26T14:28:46.151Z"
},
// {
//   "id": "5",
//   "title": "Rack Management System",
//   "widgets": [
//     {
//       "title": "Rack Fan System",
//       "icon": "*",
//       "type": "fan-control",
//       "id": "d63594f9-4266-41f2-95a2-57c8cc415175",
//       "config": {
//         "title": "Rack Fan System",
//         "dataSource": {
//           "type": "device",
//           "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//           "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
//           "protocol": "MQTT",
//           "streamUrl": "",
//           "isJsonObject": true,
//           "jsonObjectPath": "fans",
//           "jsonObjectValue": {
//             "fan_fail_alarm": false,
//             "fans_status": {
//               "FAN1": {
//                 "fail": false,
//                 "speed": 100,
//                 "status": "on"
//               },
//               "FAN2": {
//                 "fail": false,
//                 "speed": 100,
//                 "status": "on"
//               },
//               "FAN3": {
//                 "fail": false,
//                 "speed": 100,
//                 "status": "on"
//               },
//               "FAN4": {
//                 "fail": false,
//                 "speed": 100,
//                 "status": "off"
//               },
//               "FAN5": {
//                 "fail": false,
//                 "speed": 100,
//                 "status": "off"
//               },
//               "FAN6": {
//                 "fail": false,
//                 "speed": 100,
//                 "status": "off"
//               }
//             },
//             "mode": "auto",
//             "operating_fans": 3,
//             "standby_fan_on": false,
//             "total_fans": 6
//           },
//           "telemetryOut": [
//             "level"
//           ],
//           "telemetry": []
//         },
//         "fans": [
//           {
//             "id": "FAN1",
//             "name": "Fan 1",
//             "speedUnit": "%",
//             "tempUnit": "°C",
//             "maintenanceHours": 8760,
//             "runtime": 0
//           },
//           {
//             "id": "FAN2",
//             "name": "Fan 2",
//             "speedUnit": "%",
//             "tempUnit": "°C",
//             "maintenanceHours": 8760,
//             "runtime": 0
//           },
//           {
//             "id": "FAN3",
//             "name": "Fan 3",
//             "speedUnit": "%",
//             "tempUnit": "°C",
//             "maintenanceHours": 8760,
//             "runtime": 0
//           },
//           {
//             "id": "FAN4",
//             "name": "Fan 4",
//             "speedUnit": "%",
//             "tempUnit": "°C",
//             "maintenanceHours": 8760,
//             "runtime": 0
//           },
//           {
//             "id": "FAN5",
//             "name": "Fan 5",
//             "speedUnit": "%",
//             "tempUnit": "°C",
//             "maintenanceHours": 8760,
//             "runtime": 0
//           },
//           {
//             "id": "FAN6",
//             "name": "Fan 6",
//             "speedUnit": "%",
//             "tempUnit": "°C",
//             "maintenanceHours": 8760,
//             "runtime": 0
//           }
//         ],
//         "numFans": 6,
//         "showStats": true,
//         "showAlarms": true,
//         "showAddFan": false,
//         "showDeleteFan": false,
//         "showEditFan": false,
//         "showFanConfigDialog": false,
//         "showAddFanDialog": true,
//         "showStartStop": false,
//         "showAllControl": true,
//         "showSpeedSet": false,
//         "showReset": false,
//         "showAutoMode": true,
//         "enableImportantFan": false,
//         "importantFans": [],
//         "minSpeed": 0,
//         "maxSpeedPercent": 100,
//         "maxSpeedRpm": 1800,
//         "speedUnit": "%",
//         "tempUnit": "°C",
//         "maintenanceHours": 8760,
//         "runtime": 0,
//         "speedUnits": [
//           {
//             "value": "%",
//             "label": "Percentage (%)"
//           },
//           {
//             "value": "RPM",
//             "label": "Rotation (RPM)"
//           }
//         ],
//         "tempUnits": [
//           {
//             "value": "°C",
//             "label": "Celsius (°C)"
//           },
//           {
//             "value": "°F",
//             "label": "Fahrenheit (°F)"
//           },
//           {
//             "value": "K",
//             "label": "Kelvin (K)"
//           }
//         ],
//         "theme": "light",
//         "showTemperature": true,
//         "showPower": false,
//         "showRuntime": false,
//         "showMaintenance": false
//       },
//       "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//       "deviceName": "SENSOR-003"
//     },
//     {
//       "title": "Rack Inside Temperature",
//       "icon": "⭕",
//       "type": "radial-gauge",
//       "id": "7700941d-7ff3-46f7-b129-bd34c38d9e85",
//       "config": {
//         "title": "Rack Inside Temperature",
//         "dataSource": {
//           "type": "device",
//           "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//           "telemetry": [
//             "environment.sensors.RMS-TEMPERATURE-IN-1.temperature"
//           ],
//           "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
//           "protocol": "MQTT",
//           "streamUrl": "",
//           "displayKey": "environment.sensors.RMS-TEMPERATURE-IN-1.temperature",
//           "isJsonObject": false
//         }
//       },
//       "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//       "deviceName": "SENSOR-003"
//     },
//     {
//       "title": "Output Voltage",
//       "icon": "📝",
//       "type": "value-card",
//       "id": "03c6c6f9-87fb-4305-80cc-e5f9908ac4f0",
//       "config": {
//         "title": "Output Voltage",
//         "dataSource": {
//           "type": "device",
//           "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//           "telemetry": [
//             "environment.output_voltage"
//           ],
//           "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
//           "protocol": "MQTT",
//           "streamUrl": "",
//           "displayKey": "environment.output_voltage",
//           "isJsonObject": false
//         }
//       },
//       "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//       "deviceName": "SENSOR-003"
//     },
//     {
//       "title": "Input Voltage",
//       "icon": "📝",
//       "type": "value-card",
//       "id": "569696f4-f842-4471-8487-0d60085fedf8",
//       "config": {
//         "title": "Input Voltage",
//         "dataSource": {
//           "type": "device",
//           "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//           "telemetry": [
//             "environment.input_voltage"
//           ],
//           "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
//           "protocol": "MQTT",
//           "streamUrl": "",
//           "displayKey": "environment.input_voltage",
//           "isJsonObject": false
//         }
//       },
//       "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//       "deviceName": "SENSOR-003"
//     },
//     {
//       "title": "Door Lock Status",
//       "icon": "✅",
//       "type": "status-card",
//       "id": "431ef4e8-7ca0-4642-8f07-d12a1f132b4f",
//       "config": {
//         "title": "Door Lock Status",
//         "dataSource": {
//           "type": "device",
//           "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//           "telemetry": [
//             "access.door_status"
//           ],
//           "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
//           "protocol": "MQTT",
//           "streamUrl": "",
//           "displayKey": "access.door_status",
//           "isJsonObject": false
//         }
//       },
//       "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//       "deviceName": "SENSOR-003"
//     },
//     {
//       "title": "Rack Outside Temperature",
//       "icon": "⭕",
//       "type": "radial-gauge",
//       "id": "5e96688d-a782-4135-a796-f0a4659c7fe5",
//       "config": {
//         "title": "Rack Outside Temperature",
//         "dataSource": {
//           "type": "device",
//           "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//           "telemetry": [
//             "environment.sensors.RMS-TEMPERATURE-IN-2.temperature"
//           ],
//           "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
//           "protocol": "MQTT",
//           "streamUrl": "",
//           "displayKey": "environment.sensors.RMS-TEMPERATURE-IN-2.temperature",
//           "isJsonObject": false
//         }
//       },
//       "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//       "deviceName": "SENSOR-003"
//     },
//     {
//       "title": "System Health",
//       "icon": "✅",
//       "type": "status-card",
//       "id": "801b35b6-3484-46fe-8116-f9757cb7d5f9",
//       "config": {
//         "title": "System Health",
//         "dataSource": {
//           "type": "device",
//           "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//           "telemetry": [
//             "health"
//           ],
//           "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
//           "protocol": "MQTT",
//           "streamUrl": "",
//           "displayKey": "health",
//           "isJsonObject": false
//         }
//       },
//       "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//       "deviceName": "SENSOR-003"
//     },
//     {
//       "title": "Input & Output Voltage",
//       "icon": "📈",
//       "type": "line-chart",
//       "id": "36e2869d-635c-4985-b320-893c763f4022",
//       "config": {
//         "title": "Input & Output Voltage",
//         "dataSource": {
//           "type": "device",
//           "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//           "telemetry": [
//             "environment.input_voltage",
//             "environment.output_voltage"
//           ],
//           "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
//           "protocol": "MQTT",
//           "streamUrl": "",
//           "displayKey": "environment.input_voltage",
//           "isJsonObject": false
//         },
//         "height": 300,
//         "showLegend": true,
//         "showPoints": true
//       },
//       "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//       "deviceName": "SENSOR-003"
//     },
//     {
//       "title": "Battery Backup Time",
//       "icon": "📝",
//       "type": "value-card",
//       "id": "90a0aa5d-0e80-4212-9df9-c3f93d0ce6c5",
//       "config": {
//         "title": "Battery Backup Time",
//         "dataSource": {
//           "type": "device",
//           "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//           "telemetry": [
//             "environment.battery_backup_time"
//           ],
//           "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
//           "protocol": "MQTT",
//           "streamUrl": "",
//           "displayKey": "environment.battery_backup_time",
//           "isJsonObject": false
//         }
//       },
//       "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//       "deviceName": "SENSOR-003"
//     },
//     {
//       "title": "Door Lock System",
//       "icon": "🎦",
//       "type": "door-lock",
//       "id": "531ae74b-f9ce-44cd-b560-d6456600ff6c",
//       "config": {
//         "title": "Door Lock System",
//         "dataSource": {
//           "type": "device",
//           "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//           "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
//           "protocol": "MQTT",
//           "streamUrl": "",
//           "isJsonObject": true,
//           "jsonObjectPath": "access",
//           "jsonObjectValue": {
//             "door_locked": true,
//             "door_status": "closed",
//             "failed_attempts": 0,
//             "last_access": {
//               "method": "",
//               "result": "",
//               "timestamp": "",
//               "user": ""
//             },
//             "unauthorized_access": false
//           },
//           "telemetry": []
//         }
//       },
//       "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//       "deviceName": "SENSOR-003"
//     },
//     {
//       "title": "Water Logging Detection",
//       "icon": "🚨",
//       "type": "water-logging",
//       "id": "ad4b23a3-417a-4ca1-bd64-747b276099d6",
//       "config": {
//         "title": "Water Logging Detection",
//         "dataSource": {
//           "type": "device",
//           "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//           "telemetry": [
//             "environment.water_logging"
//           ],
//           "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
//           "protocol": "MQTT",
//           "streamUrl": "",
//           "displayKey": "environment.water_logging",
//           "isJsonObject": false
//         }
//       },
//       "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//       "deviceName": "SENSOR-003"
//     },
//     {
//       "title": "Fire Detection",
//       "icon": "🚨",
//       "type": "fire-detection",
//       "id": "e23809c2-bdfb-4f31-ae7b-5c79e639e676",
//       "config": {
//         "title": "Fire Detection",
//         "dataSource": {
//           "type": "device",
//           "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//           "telemetry": [
//             "environment.fire_detected"
//           ],
//           "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
//           "protocol": "MQTT",
//           "streamUrl": "",
//           "displayKey": "environment.fire_detected",
//           "isJsonObject": false
//         }
//       },
//       "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//       "deviceName": "SENSOR-003"
//     },
//     {
//       "title": "Door Hidden Camera",
//       "icon": "🎦",
//       "type": "image-card",
//       "id": "57b0476d-e990-455f-adba-b62d67b273e5",
//       "config": {
//         "title": "Door Hidden Camera",
//         "dataSource": {
//           "type": "device",
//           "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//           "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
//           "protocol": "MQTT",
//           "streamUrl": "",
//           "isJsonObject": true,
//           "jsonObjectPath": "hidden_camera",
//           "jsonObjectValue": {
//             "door_event_snapshot": "success",
//             "filename": "",
//             "snap_id": "650",
//             "snapshots_stored": 0,
//             "timestamp": "2025-07-21T17:35:15.086533257",
//             "url": "http://localhost:9000/iotmining-rms/0782f4a1-ddc6-4718-b277-5b8191ba7713/1c59b850-035a-4f6a-8e4d-74d5b34197e9/CAMERA/snapshot/2025/07/21/snap_20250721_173511.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin%2F20250721%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250721T120515Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=a60f6cbf6708680d0d9af7aece2c3c1769ec6e6247f6ca83c0839e7185310805"
//           },
//           "telemetry": []
//         }
//       },
//       "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//       "deviceName": "SENSOR-003"
//     },
//     {
//       "title": "Device Control Command",
//       "icon": "*",
//       "type": "device-command-control",
//       "id": "c88b0a99-bad6-4350-b807-b04f82bbd064",
//       "config": {
//         "title": "Device Control Command",
//         "dataSource": {
//           "type": "device",
//           "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//           "telemetry": [
//             "health"
//           ],
//           "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
//           "protocol": "MQTT",
//           "streamUrl": "",
//           "displayKey": "health",
//           "isJsonObject": false
//         }
//       },
//       "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
//       "deviceName": "SENSOR-003"
//     }
//   ],
//   "layouts": {
//     "lg": [
//       {
//         "w": 6,
//         "h": 17,
//         "x": 6,
//         "y": 0,
//         "i": "d63594f9-4266-41f2-95a2-57c8cc415175",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 2,
//         "h": 6,
//         "x": 4,
//         "y": 0,
//         "i": "7700941d-7ff3-46f7-b129-bd34c38d9e85",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 2,
//         "h": 5,
//         "x": 2,
//         "y": 21,
//         "i": "03c6c6f9-87fb-4305-80cc-e5f9908ac4f0",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 2,
//         "h": 5,
//         "x": 0,
//         "y": 21,
//         "i": "569696f4-f842-4471-8487-0d60085fedf8",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 2,
//         "h": 6,
//         "x": 0,
//         "y": 15,
//         "i": "431ef4e8-7ca0-4642-8f07-d12a1f132b4f",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 2,
//         "h": 6,
//         "x": 2,
//         "y": 0,
//         "i": "5e96688d-a782-4135-a796-f0a4659c7fe5",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 2,
//         "h": 6,
//         "x": 0,
//         "y": 0,
//         "i": "801b35b6-3484-46fe-8116-f9757cb7d5f9",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 3,
//         "h": 9,
//         "x": 6,
//         "y": 17,
//         "i": "36e2869d-635c-4985-b320-893c763f4022",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 2,
//         "h": 5,
//         "x": 4,
//         "y": 21,
//         "i": "90a0aa5d-0e80-4212-9df9-c3f93d0ce6c5",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 2,
//         "h": 9,
//         "x": 0,
//         "y": 6,
//         "i": "531ae74b-f9ce-44cd-b560-d6456600ff6c",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 2,
//         "h": 6,
//         "x": 2,
//         "y": 15,
//         "i": "ad4b23a3-417a-4ca1-bd64-747b276099d6",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 2,
//         "h": 6,
//         "x": 4,
//         "y": 15,
//         "i": "e23809c2-bdfb-4f31-ae7b-5c79e639e676",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 4,
//         "h": 9,
//         "x": 2,
//         "y": 6,
//         "i": "57b0476d-e990-455f-adba-b62d67b273e5",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 3,
//         "h": 9,
//         "x": 9,
//         "y": 17,
//         "i": "c88b0a99-bad6-4350-b807-b04f82bbd064",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       }
//     ],
//     "md": [
//       {
//         "w": 4,
//         "h": 4,
//         "x": 0,
//         "y": 0,
//         "i": "d63594f9-4266-41f2-95a2-57c8cc415175",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 4,
//         "h": 4,
//         "x": 0,
//         "y": 4,
//         "i": "7700941d-7ff3-46f7-b129-bd34c38d9e85",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 4,
//         "h": 4,
//         "x": 0,
//         "y": 16,
//         "i": "03c6c6f9-87fb-4305-80cc-e5f9908ac4f0",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 4,
//         "h": 4,
//         "x": 0,
//         "y": 20,
//         "i": "569696f4-f842-4471-8487-0d60085fedf8",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 4,
//         "h": 4,
//         "x": 0,
//         "y": 24,
//         "i": "431ef4e8-7ca0-4642-8f07-d12a1f132b4f",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 2,
//         "h": 8,
//         "x": 1,
//         "y": 8,
//         "i": "5e96688d-a782-4135-a796-f0a4659c7fe5",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 2,
//         "h": 5,
//         "x": 3,
//         "y": 8,
//         "i": "801b35b6-3484-46fe-8116-f9757cb7d5f9",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 4,
//         "h": 4,
//         "x": 0,
//         "y": 28,
//         "i": "36e2869d-635c-4985-b320-893c763f4022",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 4,
//         "h": 4,
//         "x": 0,
//         "y": 32,
//         "i": "90a0aa5d-0e80-4212-9df9-c3f93d0ce6c5",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 4,
//         "h": 4,
//         "x": 0,
//         "y": 36,
//         "i": "531ae74b-f9ce-44cd-b560-d6456600ff6c",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 4,
//         "h": 4,
//         "x": 0,
//         "y": 40,
//         "i": "ad4b23a3-417a-4ca1-bd64-747b276099d6",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 4,
//         "h": 4,
//         "x": 0,
//         "y": 44,
//         "i": "e23809c2-bdfb-4f31-ae7b-5c79e639e676",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 4,
//         "h": 4,
//         "x": 0,
//         "y": 48,
//         "i": "57b0476d-e990-455f-adba-b62d67b273e5",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "i": "c88b0a99-bad6-4350-b807-b04f82bbd064",
//         "x": 0,
//         "y": 26,
//         "w": 4,
//         "h": 4,
//         "minW": 2,
//         "minH": 2
//       }
//     ],
//     "sm": [
//       {
//         "w": 6,
//         "h": 4,
//         "x": 0,
//         "y": 0,
//         "i": "d63594f9-4266-41f2-95a2-57c8cc415175",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 6,
//         "h": 4,
//         "x": 0,
//         "y": 4,
//         "i": "7700941d-7ff3-46f7-b129-bd34c38d9e85",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 6,
//         "h": 4,
//         "x": 0,
//         "y": 16,
//         "i": "03c6c6f9-87fb-4305-80cc-e5f9908ac4f0",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 6,
//         "h": 4,
//         "x": 0,
//         "y": 20,
//         "i": "569696f4-f842-4471-8487-0d60085fedf8",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 6,
//         "h": 4,
//         "x": 0,
//         "y": 24,
//         "i": "431ef4e8-7ca0-4642-8f07-d12a1f132b4f",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 4,
//         "h": 8,
//         "x": 0,
//         "y": 8,
//         "i": "5e96688d-a782-4135-a796-f0a4659c7fe5",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 4,
//         "h": 5,
//         "x": 0,
//         "y": 28,
//         "i": "801b35b6-3484-46fe-8116-f9757cb7d5f9",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 6,
//         "h": 4,
//         "x": 0,
//         "y": 33,
//         "i": "36e2869d-635c-4985-b320-893c763f4022",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 6,
//         "h": 4,
//         "x": 0,
//         "y": 37,
//         "i": "90a0aa5d-0e80-4212-9df9-c3f93d0ce6c5",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 6,
//         "h": 4,
//         "x": 0,
//         "y": 41,
//         "i": "531ae74b-f9ce-44cd-b560-d6456600ff6c",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 6,
//         "h": 4,
//         "x": 0,
//         "y": 45,
//         "i": "ad4b23a3-417a-4ca1-bd64-747b276099d6",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 6,
//         "h": 4,
//         "x": 0,
//         "y": 49,
//         "i": "e23809c2-bdfb-4f31-ae7b-5c79e639e676",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 6,
//         "h": 4,
//         "x": 0,
//         "y": 53,
//         "i": "57b0476d-e990-455f-adba-b62d67b273e5",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "i": "c88b0a99-bad6-4350-b807-b04f82bbd064",
//         "x": 0,
//         "y": 26,
//         "w": 8,
//         "h": 4,
//         "minW": 2,
//         "minH": 2
//       }
//     ],
//     "xs": [
//       {
//         "w": 2,
//         "h": 14,
//         "x": 0,
//         "y": 0,
//         "i": "d63594f9-4266-41f2-95a2-57c8cc415175",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "i": "7700941d-7ff3-46f7-b129-bd34c38d9e85",
//         "x": 0,
//         "y": 0,
//         "w": 12,
//         "h": 4,
//         "minW": 2,
//         "minH": 2
//       },
//       {
//         "i": "03c6c6f9-87fb-4305-80cc-e5f9908ac4f0",
//         "x": 0,
//         "y": 16,
//         "w": 12,
//         "h": 4,
//         "minW": 2,
//         "minH": 2
//       },
//       {
//         "i": "569696f4-f842-4471-8487-0d60085fedf8",
//         "x": 0,
//         "y": 20,
//         "w": 12,
//         "h": 4,
//         "minW": 2,
//         "minH": 2
//       },
//       {
//         "i": "431ef4e8-7ca0-4642-8f07-d12a1f132b4f",
//         "x": 0,
//         "y": 20,
//         "w": 12,
//         "h": 4,
//         "minW": 2,
//         "minH": 2
//       },
//       {
//         "w": 12,
//         "h": 8,
//         "x": 0,
//         "y": 1,
//         "i": "5e96688d-a782-4135-a796-f0a4659c7fe5",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "w": 12,
//         "h": 5,
//         "x": 0,
//         "y": 1,
//         "i": "801b35b6-3484-46fe-8116-f9757cb7d5f9",
//         "minW": 2,
//         "minH": 2,
//         "moved": false,
//         "static": false
//       },
//       {
//         "i": "36e2869d-635c-4985-b320-893c763f4022",
//         "x": 0,
//         "y": 16,
//         "w": 12,
//         "h": 4,
//         "minW": 2,
//         "minH": 2
//       },
//       {
//         "i": "90a0aa5d-0e80-4212-9df9-c3f93d0ce6c5",
//         "x": 0,
//         "y": 21,
//         "w": 12,
//         "h": 4,
//         "minW": 2,
//         "minH": 2
//       },
//       {
//         "i": "531ae74b-f9ce-44cd-b560-d6456600ff6c",
//         "x": 0,
//         "y": 0,
//         "w": 12,
//         "h": 4,
//         "minW": 2,
//         "minH": 2
//       },
//       {
//         "i": "ad4b23a3-417a-4ca1-bd64-747b276099d6",
//         "x": 0,
//         "y": 26,
//         "w": 12,
//         "h": 4,
//         "minW": 2,
//         "minH": 2
//       },
//       {
//         "i": "e23809c2-bdfb-4f31-ae7b-5c79e639e676",
//         "x": 0,
//         "y": 27,
//         "w": 12,
//         "h": 4,
//         "minW": 2,
//         "minH": 2
//       },
//       {
//         "i": "57b0476d-e990-455f-adba-b62d67b273e5",
//         "x": 0,
//         "y": 25,
//         "w": 12,
//         "h": 4,
//         "minW": 2,
//         "minH": 2
//       },
//       {
//         "i": "c88b0a99-bad6-4350-b807-b04f82bbd064",
//         "x": 0,
//         "y": 26,
//         "w": 12,
//         "h": 4,
//         "minW": 2,
//         "minH": 2
//       }
//     ]
//   },
//   "settings": {
//     "timewindow": {
//       "realtime": {
//         "timewindowMs": 60000
//       },
//       "aggregation": {
//         "type": "AVG",
//         "limit": 200
//       }
//     },
//     "gridSettings": {
//       "backgroundColor": "#ffffff",
//       "columns": 24,
//       "margin": [
//         10,
//         10
//       ],
//       "backgroundImage": null
//     }
//   },
//   "assignedCustomers": [],
//   "timeWindow": {
//     "displayValue": "Last 15 minutes",
//     "value": "15_minutes",
//     "type": "REALTIME"
//   },
//   "version": "1.0.0",
//   "createdTime": "2025-07-22T18:30:15.896Z"
// },
    {
  "id": "2",
  "title": "Rack Management System-002",
  "widgets": [
    {
      "title": "Rack Fan System",
      "icon": "*",
      "type": "fan-control",
      "id": "d63594f9-4266-41f2-95a2-57c8cc415175",
      "config": {
        "title": "Rack Fan System",
        "dataSource": {
          "type": "device",
          "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
          "topic": "kepler/prod/delhi/rms-device/41f426e1-e575-4c60-975f-a8611f72cff6/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "isJsonObject": true,
          "jsonObjectPath": "fans",
          "jsonObjectValue": {
            "fan_fail_alarm": false,
            "fans_status": {
              "FAN1": {
                "fail": false,
                "speed": 100,
                "status": "on"
              },
              "FAN2": {
                "fail": false,
                "speed": 100,
                "status": "on"
              },
              "FAN3": {
                "fail": false,
                "speed": 100,
                "status": "on"
              },
              "FAN4": {
                "fail": false,
                "speed": 100,
                "status": "off"
              },
              "FAN5": {
                "fail": false,
                "speed": 100,
                "status": "off"
              },
              "FAN6": {
                "fail": false,
                "speed": 100,
                "status": "off"
              }
            },
            "mode": "auto",
            "operating_fans": 3,
            "standby_fan_on": false,
            "total_fans": 6
          },
          "telemetryOut": [
            "level"
          ],
          "telemetry": []
        },
        "fans": [
          {
            "id": "FAN1",
            "name": "Fan 1",
            "speedUnit": "%",
            "tempUnit": "°C",
            "maintenanceHours": 8760,
            "runtime": 0
          },
          {
            "id": "FAN2",
            "name": "Fan 2",
            "speedUnit": "%",
            "tempUnit": "°C",
            "maintenanceHours": 8760,
            "runtime": 0
          },
          {
            "id": "FAN3",
            "name": "Fan 3",
            "speedUnit": "%",
            "tempUnit": "°C",
            "maintenanceHours": 8760,
            "runtime": 0
          },
          {
            "id": "FAN4",
            "name": "Fan 4",
            "speedUnit": "%",
            "tempUnit": "°C",
            "maintenanceHours": 8760,
            "runtime": 0
          },
          {
            "id": "FAN5",
            "name": "Fan 5",
            "speedUnit": "%",
            "tempUnit": "°C",
            "maintenanceHours": 8760,
            "runtime": 0
          },
          {
            "id": "FAN6",
            "name": "Fan 6",
            "speedUnit": "%",
            "tempUnit": "°C",
            "maintenanceHours": 8760,
            "runtime": 0
          }
        ],
        "numFans": 6,
        "showStats": true,
        "showAlarms": true,
        "showAddFan": false,
        "showDeleteFan": false,
        "showEditFan": false,
        "showFanConfigDialog": false,
        "showAddFanDialog": true,
        "showStartStop": false,
        "showAllControl": true,
        "showSpeedSet": false,
        "showReset": false,
        "showAutoMode": true,
        "enableImportantFan": false,
        "importantFans": [],
        "minSpeed": 0,
        "maxSpeedPercent": 100,
        "maxSpeedRpm": 1800,
        "speedUnit": "%",
        "tempUnit": "°C",
        "maintenanceHours": 8760,
        "runtime": 0,
        "speedUnits": [
          {
            "value": "%",
            "label": "Percentage (%)"
          },
          {
            "value": "RPM",
            "label": "Rotation (RPM)"
          }
        ],
        "tempUnits": [
          {
            "value": "°C",
            "label": "Celsius (°C)"
          },
          {
            "value": "°F",
            "label": "Fahrenheit (°F)"
          },
          {
            "value": "K",
            "label": "Kelvin (K)"
          }
        ],
        "theme": "light",
        "showTemperature": true,
        "showPower": false,
        "showRuntime": false,
        "showMaintenance": false
      },
      "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Rack Inside Temperature",
      "icon": "⭕",
      "type": "radial-gauge",
      "id": "7700941d-7ff3-46f7-b129-bd34c38d9e85",
      "config": {
        "title": "Rack Inside Temperature",
        "dataSource": {
          "type": "device",
          "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
          "telemetry": [
            "environment.sensors.RMS-TEMPERATURE-IN-1.temperature"
          ],
          "topic": "kepler/prod/delhi/rms-device/41f426e1-e575-4c60-975f-a8611f72cff6/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.sensors.RMS-TEMPERATURE-IN-1.temperature",
          "isJsonObject": false
        }
      },
      "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Output Voltage",
      "icon": "📝",
      "type": "value-card",
      "id": "03c6c6f9-87fb-4305-80cc-e5f9908ac4f0",
      "config": {
        "title": "Output Voltage",
        "dataSource": {
          "type": "device",
          "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
          "telemetry": [
            "environment.output_voltage"
          ],
          "topic": "kepler/prod/delhi/rms-device/41f426e1-e575-4c60-975f-a8611f72cff6/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.output_voltage",
          "isJsonObject": false
        }
      },
      "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Input Voltage",
      "icon": "📝",
      "type": "value-card",
      "id": "569696f4-f842-4471-8487-0d60085fedf8",
      "config": {
        "title": "Input Voltage",
        "dataSource": {
          "type": "device",
          "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
          "telemetry": [
            "environment.input_voltage"
          ],
          "topic": "kepler/prod/delhi/rms-device/41f426e1-e575-4c60-975f-a8611f72cff6/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.input_voltage",
          "isJsonObject": false
        }
      },
      "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Door Lock Status",
      "icon": "✅",
      "type": "status-card",
      "id": "431ef4e8-7ca0-4642-8f07-d12a1f132b4f",
      "config": {
        "title": "Door Lock Status",
        "dataSource": {
          "type": "device",
          "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
          "telemetry": [
            "access.door_status"
          ],
          "topic": "kepler/prod/delhi/rms-device/41f426e1-e575-4c60-975f-a8611f72cff6/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "access.door_status",
          "isJsonObject": false
        }
      },
      "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Rack Outside Temperature",
      "icon": "⭕",
      "type": "radial-gauge",
      "id": "5e96688d-a782-4135-a796-f0a4659c7fe5",
      "config": {
        "title": "Rack Outside Temperature",
        "dataSource": {
          "type": "device",
          "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
          "telemetry": [
            "environment.sensors.RMS-TEMPERATURE-IN-2.temperature"
          ],
          "topic": "kepler/prod/delhi/rms-device/41f426e1-e575-4c60-975f-a8611f72cff6/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.sensors.RMS-TEMPERATURE-IN-2.temperature",
          "isJsonObject": false
        }
      },
      "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "System Health",
      "icon": "✅",
      "type": "status-card",
      "id": "801b35b6-3484-46fe-8116-f9757cb7d5f9",
      "config": {
        "title": "System Health",
        "dataSource": {
          "type": "device",
          "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
          "telemetry": [
            "health"
          ],
          "topic": "kepler/prod/delhi/rms-device/41f426e1-e575-4c60-975f-a8611f72cff6/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "health",
          "isJsonObject": false
        }
      },
      "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Input & Output Voltage",
      "icon": "📈",
      "type": "line-chart",
      "id": "36e2869d-635c-4985-b320-893c763f4022",
      "config": {
        "title": "Input & Output Voltage",
        "dataSource": {
          "type": "device",
          "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
          "telemetry": [
            "environment.input_voltage",
            "environment.output_voltage"
          ],
          "topic": "kepler/prod/delhi/rms-device/41f426e1-e575-4c60-975f-a8611f72cff6/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.input_voltage",
          "isJsonObject": false
        },
        "height": 300,
        "showLegend": true,
        "showPoints": true
      },
      "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Battery Backup Time",
      "icon": "📝",
      "type": "value-card",
      "id": "90a0aa5d-0e80-4212-9df9-c3f93d0ce6c5",
      "config": {
        "title": "Battery Backup Time",
        "dataSource": {
          "type": "device",
          "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
          "telemetry": [
            "environment.battery_backup_time"
          ],
          "topic": "kepler/prod/delhi/rms-device/41f426e1-e575-4c60-975f-a8611f72cff6/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.battery_backup_time",
          "isJsonObject": false
        }
      },
      "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Door Lock System",
      "icon": "🎦",
      "type": "door-lock",
      "id": "531ae74b-f9ce-44cd-b560-d6456600ff6c",
      "config": {
        "title": "Door Lock System",
        "dataSource": {
          "type": "device",
          "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
          "topic": "kepler/prod/delhi/rms-device/41f426e1-e575-4c60-975f-a8611f72cff6/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "isJsonObject": true,
          "jsonObjectPath": "access",
          "jsonObjectValue": {
            "door_locked": true,
            "door_status": "closed",
            "failed_attempts": 0,
            "last_access": {
              "method": "",
              "result": "",
              "timestamp": "",
              "user": ""
            },
            "unauthorized_access": false
          },
          "telemetry": []
        }
      },
      "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Water Logging Detection",
      "icon": "🚨",
      "type": "water-logging",
      "id": "ad4b23a3-417a-4ca1-bd64-747b276099d6",
      "config": {
        "title": "Water Logging Detection",
        "dataSource": {
          "type": "device",
          "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
          "telemetry": [
            "environment.water_logging"
          ],
          "topic": "kepler/prod/delhi/rms-device/41f426e1-e575-4c60-975f-a8611f72cff6/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.water_logging",
          "isJsonObject": false
        }
      },
      "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Fire Detection",
      "icon": "🚨",
      "type": "fire-detection",
      "id": "e23809c2-bdfb-4f31-ae7b-5c79e639e676",
      "config": {
        "title": "Fire Detection",
        "dataSource": {
          "type": "device",
          "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
          "telemetry": [
            "environment.fire_detected"
          ],
          "topic": "kepler/prod/delhi/rms-device/41f426e1-e575-4c60-975f-a8611f72cff6/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "environment.fire_detected",
          "isJsonObject": false
        }
      },
      "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Door Hidden Camera",
      "icon": "🎦",
      "type": "image-card",
      "id": "57b0476d-e990-455f-adba-b62d67b273e5",
      "config": {
        "title": "Door Hidden Camera",
        "dataSource": {
          "type": "device",
          "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
          "topic": "kepler/prod/delhi/rms-device/41f426e1-e575-4c60-975f-a8611f72cff6/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "isJsonObject": true,
          "jsonObjectPath": "hidden_camera",
          "jsonObjectValue": {
            "door_event_snapshot": "success",
            "filename": "",
            "snap_id": "650",
            "snapshots_stored": 0,
            "timestamp": "2025-07-21T17:35:15.086533257",
            "url": "http://localhost:9000/iotmining-rms/0782f4a1-ddc6-4718-b277-5b8191ba7713/41f426e1-e575-4c60-975f-a8611f72cff6/CAMERA/snapshot/2025/07/21/snap_20250721_173511.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin%2F20250721%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250721T120515Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=a60f6cbf6708680d0d9af7aece2c3c1769ec6e6247f6ca83c0839e7185310805"
          },
          "telemetry": []
        }
      },
      "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
      "deviceName": "SENSOR-003"
    },
    {
      "title": "Device Control Command",
      "icon": "*",
      "type": "device-command-control",
      "id": "c88b0a99-bad6-4350-b807-b04f82bbd064",
      "config": {
        "title": "Device Control Command",
        "dataSource": {
          "type": "device",
          "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
          "telemetry": [
            "health"
          ],
          "topic": "kepler/prod/delhi/rms-device/41f426e1-e575-4c60-975f-a8611f72cff6/up/data",
          "protocol": "MQTT",
          "streamUrl": "",
          "displayKey": "health",
          "isJsonObject": false
        }
      },
      "deviceId": "41f426e1-e575-4c60-975f-a8611f72cff6",
      "deviceName": "SENSOR-003"
    }
  ],
  "layouts": {
    "lg": [
      {
        "w": 6,
        "h": 17,
        "x": 6,
        "y": 0,
        "i": "d63594f9-4266-41f2-95a2-57c8cc415175",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 6,
        "x": 4,
        "y": 0,
        "i": "7700941d-7ff3-46f7-b129-bd34c38d9e85",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 5,
        "x": 2,
        "y": 21,
        "i": "03c6c6f9-87fb-4305-80cc-e5f9908ac4f0",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 5,
        "x": 0,
        "y": 21,
        "i": "569696f4-f842-4471-8487-0d60085fedf8",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 6,
        "x": 0,
        "y": 15,
        "i": "431ef4e8-7ca0-4642-8f07-d12a1f132b4f",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 6,
        "x": 2,
        "y": 0,
        "i": "5e96688d-a782-4135-a796-f0a4659c7fe5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 6,
        "x": 0,
        "y": 0,
        "i": "801b35b6-3484-46fe-8116-f9757cb7d5f9",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 3,
        "h": 9,
        "x": 6,
        "y": 17,
        "i": "36e2869d-635c-4985-b320-893c763f4022",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 5,
        "x": 4,
        "y": 21,
        "i": "90a0aa5d-0e80-4212-9df9-c3f93d0ce6c5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 9,
        "x": 0,
        "y": 6,
        "i": "531ae74b-f9ce-44cd-b560-d6456600ff6c",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 6,
        "x": 2,
        "y": 15,
        "i": "ad4b23a3-417a-4ca1-bd64-747b276099d6",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 6,
        "x": 4,
        "y": 15,
        "i": "e23809c2-bdfb-4f31-ae7b-5c79e639e676",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 9,
        "x": 2,
        "y": 6,
        "i": "57b0476d-e990-455f-adba-b62d67b273e5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 3,
        "h": 9,
        "x": 9,
        "y": 17,
        "i": "c88b0a99-bad6-4350-b807-b04f82bbd064",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      }
    ],
    "md": [
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 0,
        "i": "d63594f9-4266-41f2-95a2-57c8cc415175",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 4,
        "i": "7700941d-7ff3-46f7-b129-bd34c38d9e85",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 16,
        "i": "03c6c6f9-87fb-4305-80cc-e5f9908ac4f0",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 20,
        "i": "569696f4-f842-4471-8487-0d60085fedf8",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 24,
        "i": "431ef4e8-7ca0-4642-8f07-d12a1f132b4f",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 8,
        "x": 1,
        "y": 8,
        "i": "5e96688d-a782-4135-a796-f0a4659c7fe5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 2,
        "h": 5,
        "x": 3,
        "y": 8,
        "i": "801b35b6-3484-46fe-8116-f9757cb7d5f9",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 28,
        "i": "36e2869d-635c-4985-b320-893c763f4022",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 32,
        "i": "90a0aa5d-0e80-4212-9df9-c3f93d0ce6c5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 36,
        "i": "531ae74b-f9ce-44cd-b560-d6456600ff6c",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 40,
        "i": "ad4b23a3-417a-4ca1-bd64-747b276099d6",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 44,
        "i": "e23809c2-bdfb-4f31-ae7b-5c79e639e676",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 4,
        "x": 0,
        "y": 48,
        "i": "57b0476d-e990-455f-adba-b62d67b273e5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "i": "c88b0a99-bad6-4350-b807-b04f82bbd064",
        "x": 0,
        "y": 26,
        "w": 4,
        "h": 4,
        "minW": 2,
        "minH": 2
      }
    ],
    "sm": [
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 0,
        "i": "d63594f9-4266-41f2-95a2-57c8cc415175",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 4,
        "i": "7700941d-7ff3-46f7-b129-bd34c38d9e85",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 16,
        "i": "03c6c6f9-87fb-4305-80cc-e5f9908ac4f0",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 20,
        "i": "569696f4-f842-4471-8487-0d60085fedf8",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 24,
        "i": "431ef4e8-7ca0-4642-8f07-d12a1f132b4f",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 8,
        "x": 0,
        "y": 8,
        "i": "5e96688d-a782-4135-a796-f0a4659c7fe5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 4,
        "h": 5,
        "x": 0,
        "y": 28,
        "i": "801b35b6-3484-46fe-8116-f9757cb7d5f9",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 33,
        "i": "36e2869d-635c-4985-b320-893c763f4022",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 37,
        "i": "90a0aa5d-0e80-4212-9df9-c3f93d0ce6c5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 41,
        "i": "531ae74b-f9ce-44cd-b560-d6456600ff6c",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 45,
        "i": "ad4b23a3-417a-4ca1-bd64-747b276099d6",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 49,
        "i": "e23809c2-bdfb-4f31-ae7b-5c79e639e676",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 6,
        "h": 4,
        "x": 0,
        "y": 53,
        "i": "57b0476d-e990-455f-adba-b62d67b273e5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "i": "c88b0a99-bad6-4350-b807-b04f82bbd064",
        "x": 0,
        "y": 26,
        "w": 8,
        "h": 4,
        "minW": 2,
        "minH": 2
      }
    ],
    "xs": [
      {
        "w": 2,
        "h": 14,
        "x": 0,
        "y": 0,
        "i": "d63594f9-4266-41f2-95a2-57c8cc415175",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "i": "7700941d-7ff3-46f7-b129-bd34c38d9e85",
        "x": 0,
        "y": 0,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "03c6c6f9-87fb-4305-80cc-e5f9908ac4f0",
        "x": 0,
        "y": 16,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "569696f4-f842-4471-8487-0d60085fedf8",
        "x": 0,
        "y": 20,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "431ef4e8-7ca0-4642-8f07-d12a1f132b4f",
        "x": 0,
        "y": 20,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "w": 12,
        "h": 8,
        "x": 0,
        "y": 1,
        "i": "5e96688d-a782-4135-a796-f0a4659c7fe5",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "w": 12,
        "h": 5,
        "x": 0,
        "y": 1,
        "i": "801b35b6-3484-46fe-8116-f9757cb7d5f9",
        "minW": 2,
        "minH": 2,
        "moved": false,
        "static": false
      },
      {
        "i": "36e2869d-635c-4985-b320-893c763f4022",
        "x": 0,
        "y": 16,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "90a0aa5d-0e80-4212-9df9-c3f93d0ce6c5",
        "x": 0,
        "y": 21,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "531ae74b-f9ce-44cd-b560-d6456600ff6c",
        "x": 0,
        "y": 0,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "ad4b23a3-417a-4ca1-bd64-747b276099d6",
        "x": 0,
        "y": 26,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "e23809c2-bdfb-4f31-ae7b-5c79e639e676",
        "x": 0,
        "y": 27,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "57b0476d-e990-455f-adba-b62d67b273e5",
        "x": 0,
        "y": 25,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      },
      {
        "i": "c88b0a99-bad6-4350-b807-b04f82bbd064",
        "x": 0,
        "y": 26,
        "w": 12,
        "h": 4,
        "minW": 2,
        "minH": 2
      }
    ]
  },
  "settings": {
    "timewindow": {
      "realtime": {
        "timewindowMs": 60000
      },
      "aggregation": {
        "type": "AVG",
        "limit": 200
      }
    },
    "gridSettings": {
      "backgroundColor": "#ffffff",
      "columns": 24,
      "margin": [
        10,
        10
      ],
      "backgroundImage": null
    }
  },
  "assignedCustomers": [],
  "timeWindow": {
    "displayValue": "Last 15 minutes",
    "value": "15_minutes",
    "type": "REALTIME"
  },
  "version": "1.0.0",
  "createdTime": "2025-07-22T18:30:15.896Z"
},
  {
    "id": "1",
    "title": "Warehouse 1",
    "widgets": [
      {
        "title": "Temperature",
        "icon": "⭕",
        "type": "radial-gauge",
        "id": "bce198e3-7837-4cd0-848c-1b19a7ef3a3f",
        "config": {
          "title": "Temperature",
          "dataSource": {
            "type": "device",
            "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
            "telemetry": [
              "temperature"
            ],
            "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
            "protocol": "JSON",
            "streamUrl": "http://report-service/sensors"
          }
        },
        "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
        "deviceName": "SENSOR-003"
      },
      {
        "title": "Machine 1 - Temp & Humidity",
        "icon": "📈",
        "type": "line-chart",
        "id": "f25d5637-2022-4ca8-9e97-2213611f2980",
        "config": {
          "title": "Machine 1 - Temp & Humidity",
          "dataSource": {
            "type": "device",
            "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
            "telemetry": [
              "environment.sensors.RMS-TEMPERATURE-IN-2.humidity",
              "environment.sensors.RMS-TEMPERATURE-IN-2.temperature"
            ],
            "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
            "protocol": "JSON",
            "streamUrl": "http://report-service/sensors"
          },
          "height": 300,
          "showLegend": true,
          "showPoints": true
        },
        "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
        "deviceName": "SENSOR-003"
      },
      {
        "title": "Temperature Card",
        "icon": "📝",
        "type": "value-card",
        "id": "50502903-f507-4f4b-a73e-2314362af04d",
        "config": {
          "title": "Temperature Card",
          "dataSource": {
            "type": "device",
            "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
            "telemetry": [
              "temperature"
            ],
            "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
            "protocol": "JSON",
            "streamUrl": "http://report-service/sensors"
          }
        },
        "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
        "deviceName": "SENSOR-003"
      },
      {
        "title": "Humidity Card",
        "icon": "📝",
        "type": "value-card",
        "id": "22006596-037c-495d-ac50-1ec337ad2cc1",
        "config": {
          "title": "Humidity Card",
          "dataSource": {
            "type": "device",
            "deviceId": "0707216a-5613-4d00-81aa-efbe34f2a839",
            "telemetry": [
              "humidity"
            ],
            "topic": "kepler/prod/delhi/rms-device/0707216a-5613-4d00-81aa-efbe34f2a839/up/data",
            "protocol": "JSON",
            "streamUrl": "http://report-service/sensors"
          }
        },
        "deviceId": "0707216a-5613-4d00-81aa-efbe34f2a839",
        "deviceName": "SENSOR-001"
      },
      {
        "title": "Radial gauge",
        "icon": "⭕",
        "type": "radial-gauge",
        "id": "a8c23f79-a406-444f-80a0-8ace011358f0",
        "config": {
          "title": "Radial gauge",
          "dataSource": {
            "type": "device",
            "deviceId": "0707216a-5613-4d00-81aa-efbe34f2a839",
            "telemetry": [
              "environment.sensors.RMS-TEMPERATURE-IN-2.temperature"
            ],
            "topic": "kepler/prod/delhi/rms-device/0707216a-5613-4d00-81aa-efbe34f2a839/up/data",
            "protocol": "JSON",
            "streamUrl": "http://report-service/sensors"
          }
        },
        "deviceId": "0707216a-5613-4d00-81aa-efbe34f2a839",
        "deviceName": "SENSOR-001"
      }
    ],
    "layouts": {
      "lg": [
        {
          "w": 3,
          "h": 6,
          "x": 0,
          "y": 0,
          "i": "bce198e3-7837-4cd0-848c-1b19a7ef3a3f",
          "minW": 2,
          "minH": 2,
          "moved": false,
          "static": false
        },
        {
          "w": 5,
          "h": 11,
          "x": 3,
          "y": 0,
          "i": "f25d5637-2022-4ca8-9e97-2213611f2980",
          "minW": 2,
          "minH": 2,
          "moved": false,
          "static": false
        },
        {
          "w": 3,
          "h": 5,
          "x": 0,
          "y": 6,
          "i": "50502903-f507-4f4b-a73e-2314362af04d",
          "minW": 2,
          "minH": 2,
          "moved": false,
          "static": false
        },
        {
          "w": 4,
          "h": 4,
          "x": 8,
          "y": 0,
          "i": "22006596-037c-495d-ac50-1ec337ad2cc1",
          "minW": 2,
          "minH": 2,
          "moved": false,
          "static": false
        },
        {
          "w": 4,
          "h": 7,
          "x": 8,
          "y": 4,
          "i": "a8c23f79-a406-444f-80a0-8ace011358f0",
          "minW": 2,
          "minH": 2,
          "moved": false,
          "static": false
        }
      ],
      "md": [
        {
          "i": "bce198e3-7837-4cd0-848c-1b19a7ef3a3f",
          "x": 0,
          "y": 0,
          "w": 4,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "f25d5637-2022-4ca8-9e97-2213611f2980",
          "x": 2,
          "y": 0,
          "w": 4,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "50502903-f507-4f4b-a73e-2314362af04d",
          "x": 2,
          "y": 0,
          "w": 4,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "22006596-037c-495d-ac50-1ec337ad2cc1",
          "x": 0,
          "y": 11,
          "w": 4,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "a8c23f79-a406-444f-80a0-8ace011358f0",
          "x": 0,
          "y": 11,
          "w": 4,
          "h": 4,
          "minW": 2,
          "minH": 2
        }
      ],
      "sm": [
        {
          "i": "bce198e3-7837-4cd0-848c-1b19a7ef3a3f",
          "x": 0,
          "y": 0,
          "w": 8,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "f25d5637-2022-4ca8-9e97-2213611f2980",
          "x": 0,
          "y": 0,
          "w": 8,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "50502903-f507-4f4b-a73e-2314362af04d",
          "x": 0,
          "y": 0,
          "w": 8,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "22006596-037c-495d-ac50-1ec337ad2cc1",
          "x": 0,
          "y": 11,
          "w": 8,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "a8c23f79-a406-444f-80a0-8ace011358f0",
          "x": 0,
          "y": 11,
          "w": 8,
          "h": 4,
          "minW": 2,
          "minH": 2
        }
      ],
      "xs": [
        {
          "i": "bce198e3-7837-4cd0-848c-1b19a7ef3a3f",
          "x": 0,
          "y": 0,
          "w": 12,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "f25d5637-2022-4ca8-9e97-2213611f2980",
          "x": 0,
          "y": 0,
          "w": 12,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "50502903-f507-4f4b-a73e-2314362af04d",
          "x": 0,
          "y": 0,
          "w": 12,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "22006596-037c-495d-ac50-1ec337ad2cc1",
          "x": 0,
          "y": 11,
          "w": 12,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "a8c23f79-a406-444f-80a0-8ace011358f0",
          "x": 0,
          "y": 11,
          "w": 12,
          "h": 4,
          "minW": 2,
          "minH": 2
        }
      ]
    },
    "settings": {
      "timewindow": {
        "realtime": {
          "timewindowMs": 60000
        },
        "aggregation": {
          "type": "AVG",
          "limit": 200
        }
      },
      "gridSettings": {
        "backgroundColor": "#ffffff",
        "columns": 24,
        "margin": [
          10,
          10
        ],
        "backgroundImage": null
      }
    },
    "assignedCustomers": [],
    "timeWindow": {
      "displayValue": "Last 15 minutes",
      "value": "15_minutes",
      "type": "REALTIME"
    },
    "version": "1.0.0",
    "createdTime": "2025-07-06T14:36:52.119Z"
  },
  {
    "id": "6",
    "title": "New Dashboard",
    "widgets": [
      {
        "title": "Live camera",
        "icon": "📹",
        "type": "camera",
        "id": "ae6a07a8-3fdb-410b-b7d7-fa2414acfdb1",
        "config": {
          "title": "Live camera",
          "dataSource": {
            "type": "device",
            "deviceId": "fdaba49a-672f-4f41-a120-1d7e6ee04476",
            "telemetry": [
              "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
            ],
            "topic": "",
            "protocol": "HLS",
            "streamUrl": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
          }
        },
        "deviceId": "fdaba49a-672f-4f41-a120-1d7e6ee04476",
        "deviceName": "RMS-101"
      },
      {
        "title": "Live camera",
        "icon": "📹",
        "type": "camera",
        "id": "3fdd9d18-e9a0-42fc-8866-fe8bd844cc2d",
        "config": {
          "title": "Live camera",
          "dataSource": {
            "type": "device",
            "deviceId": "a1e2d86d-ef78-45a4-a5b2-b0a23d9b08e2",
            "telemetry": [
              "https://test-streams.mux.dev/test_001/stream.m3u8"
            ],
            "topic": "",
            "protocol": "HLS",
            "streamUrl": "https://test-streams.mux.dev/test_001/stream.m3u8"
          }
        },
        "deviceId": "a1e2d86d-ef78-45a4-a5b2-b0a23d9b08e2",
        "deviceName": "RMS-003"
      },
      {
        "title": "Line chart",
        "icon": "📈",
        "type": "line-chart",
        "id": "7b043db4-3215-4cf1-a19b-ae4a6e0f63af",
        "config": {
          "title": "Line chart",
          "dataSource": {
            "type": "device",
            "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
            "telemetry": [
              "environment.sensors.RMS-TEMPERATURE-IN-2.humidity",
              "environment.sensors.RMS-TEMPERATURE-IN-2.temperature"
            ],
            "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
            "protocol": "JSON",
            "streamUrl": "http://report-service/sensors"
          },
          "height": 300,
          "showLegend": true,
          "showPoints": true
        },
        "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
        "deviceName": "SENSOR-003",
        "displayKey": "environment.sensors.RMS-TEMPERATURE-IN-2.humidity",
      },
      {
        "title": "Temperature",
        "icon": "⭕",
        "type": "radial-gauge",
        "id": "0d894ab1-7800-4959-9278-cf0bc18b087a",
        "config": {
          "title": "Temperature",
          "dataSource": {
            "type": "device",
            "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
            "telemetry": [
              "environment.sensors.RMS-TEMPERATURE-IN-2.temperature"
            ],
            "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
            "protocol": "JSON",
            "streamUrl": "http://report-service/sensors"
          }
        },
        "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
        "deviceName": "SENSOR-003"
      },
      {
        "title": "Humidity",
        "icon": "📝",
        "type": "value-card",
        "id": "8975103b-fb93-42ec-ada2-920fde6e7e9b",
        "config": {
          "title": "Humidity",
          "dataSource": {
            "type": "device",
            "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
            "telemetry": [
              "environment.sensors.RMS-TEMPERATURE-IN-2.humidity"
            ],
            "topic": "kepler/prod/delhi/rms-device/1c59b850-035a-4f6a-8e4d-74d5b34197e9/up/data",
            "protocol": "JSON",
            "streamUrl": "http://report-service/sensors"
          }
        },
        "deviceId": "1c59b850-035a-4f6a-8e4d-74d5b34197e9",
        "deviceName": "SENSOR-003"
      },
      {
        "title": "Humidity",
        "icon": "⭕",
        "type": "radial-gauge",
        "id": "a7847030-437b-4f73-801e-d2f0600bc730",
        "config": {
          "title": "Humidity",
          "dataSource": {
            "type": "device",
            "deviceId": "0707216a-5613-4d00-81aa-efbe34f2a839",
            "telemetry": [
              "environment.sensors.RMS-TEMPERATURE-IN-2.humidity"
            ],
            "topic": "kepler/prod/delhi/rms-device/0707216a-5613-4d00-81aa-efbe34f2a839/up/data",
            "protocol": "JSON",
            "streamUrl": "http://report-service/sensors"
          }
        },
        "deviceId": "0707216a-5613-4d00-81aa-efbe34f2a839",
        "deviceName": "SENSOR-001"
      }
    ],
    "layouts": {
      "lg": [
        {
          "w": 3,
          "h": 8,
          "x": 0,
          "y": 0,
          "i": "ae6a07a8-3fdb-410b-b7d7-fa2414acfdb1",
          "minW": 2,
          "minH": 2,
          "moved": false,
          "static": false
        },
        {
          "w": 4,
          "h": 8,
          "x": 7,
          "y": 0,
          "i": "3fdd9d18-e9a0-42fc-8866-fe8bd844cc2d",
          "minW": 2,
          "minH": 2,
          "moved": false,
          "static": false
        },
        {
          "w": 4,
          "h": 8,
          "x": 3,
          "y": 0,
          "i": "7b043db4-3215-4cf1-a19b-ae4a6e0f63af",
          "minW": 2,
          "minH": 2,
          "moved": false,
          "static": false
        },
        {
          "w": 4,
          "h": 5,
          "x": 0,
          "y": 8,
          "i": "0d894ab1-7800-4959-9278-cf0bc18b087a",
          "minW": 2,
          "minH": 2,
          "moved": false,
          "static": false
        },
        {
          "w": 4,
          "h": 5,
          "x": 4,
          "y": 8,
          "i": "8975103b-fb93-42ec-ada2-920fde6e7e9b",
          "minW": 2,
          "minH": 2,
          "moved": false,
          "static": false
        },
        {
          "w": 4,
          "h": 5,
          "x": 8,
          "y": 8,
          "i": "a7847030-437b-4f73-801e-d2f0600bc730",
          "minW": 2,
          "minH": 2,
          "moved": false,
          "static": false
        }
      ],
      "md": [
        {
          "i": "ae6a07a8-3fdb-410b-b7d7-fa2414acfdb1",
          "x": 0,
          "y": 0,
          "w": 4,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "3fdd9d18-e9a0-42fc-8866-fe8bd844cc2d",
          "x": 3,
          "y": 0,
          "w": 4,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "7b043db4-3215-4cf1-a19b-ae4a6e0f63af",
          "x": 3,
          "y": 0,
          "w": 4,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "0d894ab1-7800-4959-9278-cf0bc18b087a",
          "x": 7,
          "y": 0,
          "w": 4,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "8975103b-fb93-42ec-ada2-920fde6e7e9b",
          "x": 0,
          "y": 13,
          "w": 4,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "a7847030-437b-4f73-801e-d2f0600bc730",
          "x": 0,
          "y": 13,
          "w": 4,
          "h": 4,
          "minW": 2,
          "minH": 2
        }
      ],
      "sm": [
        {
          "i": "ae6a07a8-3fdb-410b-b7d7-fa2414acfdb1",
          "x": 0,
          "y": 0,
          "w": 8,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "3fdd9d18-e9a0-42fc-8866-fe8bd844cc2d",
          "x": 0,
          "y": 0,
          "w": 8,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "7b043db4-3215-4cf1-a19b-ae4a6e0f63af",
          "x": 0,
          "y": 0,
          "w": 8,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "0d894ab1-7800-4959-9278-cf0bc18b087a",
          "x": 0,
          "y": 0,
          "w": 8,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "8975103b-fb93-42ec-ada2-920fde6e7e9b",
          "x": 0,
          "y": 13,
          "w": 8,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "a7847030-437b-4f73-801e-d2f0600bc730",
          "x": 0,
          "y": 13,
          "w": 8,
          "h": 4,
          "minW": 2,
          "minH": 2
        }
      ],
      "xs": [
        {
          "i": "ae6a07a8-3fdb-410b-b7d7-fa2414acfdb1",
          "x": 0,
          "y": 0,
          "w": 12,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "3fdd9d18-e9a0-42fc-8866-fe8bd844cc2d",
          "x": 0,
          "y": 0,
          "w": 12,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "7b043db4-3215-4cf1-a19b-ae4a6e0f63af",
          "x": 0,
          "y": 0,
          "w": 12,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "0d894ab1-7800-4959-9278-cf0bc18b087a",
          "x": 0,
          "y": 0,
          "w": 12,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "8975103b-fb93-42ec-ada2-920fde6e7e9b",
          "x": 0,
          "y": 13,
          "w": 12,
          "h": 4,
          "minW": 2,
          "minH": 2
        },
        {
          "i": "a7847030-437b-4f73-801e-d2f0600bc730",
          "x": 0,
          "y": 13,
          "w": 12,
          "h": 4,
          "minW": 2,
          "minH": 2
        }
      ]
    },
    "settings": {
      "timewindow": {
        "realtime": {
          "timewindowMs": 60000
        },
        "aggregation": {
          "type": "AVG",
          "limit": 200
        }
      },
      "gridSettings": {
        "backgroundColor": "#ffffff",
        "columns": 24,
        "margin": [
          10,
          10
        ],
        "backgroundImage": null
      }
    },
    "assignedCustomers": [],
    "timeWindow": {
      "displayValue": "Last 15 minutes",
      "value": "15_minutes",
      "type": "REALTIME"
    },
    "version": "1.0.0",
    "createdTime": "2025-07-06T18:30:49.669Z"
  }
]