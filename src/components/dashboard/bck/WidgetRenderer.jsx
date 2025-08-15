import LineChartWidget from "./widgets/LineChartWidget"
import BarChartWidget from "./widgets/BarChartWidget"
import PieChartWidget from "./widgets/PieChartWidget"
import DoughnutChartWidget from "./widgets/DoughnutChartWidget"
import TimeSeriesChartWidget from "./widgets/TimeSeriesChartWidget"
import MapWidget from "./widgets/MapWidget"
import GaugeWidget from "./widgets/GaugeWidget"
import ValueCardWidget from "./widgets/ValueCardWidget"
import StatusCardWidget from "./widgets/StatusCardWidget"
import AlarmTableWidget from "./widgets/AlarmTableWidget"
import AlarmCountWidget from "./widgets/AlarmCountWidget"
import BatteryLevelWidget from "./widgets/BatteryLevelWidget"
import SignalStrengthWidget from "./widgets/SignalStrengthWidget"
import ProgressBarWidget from "./widgets/ProgressBarWidget"

const WidgetRenderer = ({ widget, config = {} }) => {
  if (!widget) return null

  const { type, title } = widget

  // Render the appropriate widget based on type
  switch (type) {
    case "line-chart":
      return <LineChartWidget title={title || "Line Chart"} {...config} />
    case "bar-chart":
      return <BarChartWidget title={title || "Bar Chart"} {...config} />
    case "pie-chart":
      return <PieChartWidget title={title || "Pie Chart"} {...config} />
    case "doughnut-chart":
      return <DoughnutChartWidget title={title || "Doughnut Chart"} {...config} />
    case "time-series-chart":
      return <TimeSeriesChartWidget title={title || "Time Series Chart"} {...config} />
    case "google-map":
    case "openstreet-map":
      return <MapWidget title={title || "Map"} {...config} />
    case "radial-gauge":
      return <GaugeWidget title={title || "Gauge"} {...config} />
    case "value-card":
      return <ValueCardWidget title={title || "Value Card"} {...config} />
    case "status-card":
      return <StatusCardWidget title={title || "Status Card"} {...config} />
    case "alarm-table":
      return <AlarmTableWidget title={title || "Alarm Table"} {...config} />
    case "alarm-count":
      return <AlarmCountWidget title={title || "Alarm Count"} {...config} />
    case "battery-level":
      return <BatteryLevelWidget title={title || "Battery Level"} {...config} />
    case "signal-strength":
      return <SignalStrengthWidget title={title || "Signal Strength"} {...config} />
    case "progress-bar":
      return <ProgressBarWidget title={title || "Progress Bar"} {...config} />
    default:
      return (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            border: "1px dashed #ccc",
            borderRadius: "4px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>{widget.icon || "📊"}</div>
          <div>{title || "Widget"}</div>
          <div style={{ color: "#999", marginTop: "8px" }}>Type: {type || "Unknown"}</div>
        </div>
      )
  }
}

export default WidgetRenderer
