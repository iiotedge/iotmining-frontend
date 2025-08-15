import { Card, Typography } from "antd"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const { Title } = Typography

const BarChartWidget = ({ title = "Bar Chart", data = null }) => {
  // Generate sample data if none provided
  const chartData = data || [
    { name: "Jan", value: 38 },
    { name: "Feb", value: 52 },
    { name: "Mar", value: 61 },
    { name: "Apr", value: 45 },
    { name: "May", value: 48 },
    { name: "Jun", value: 38 },
    { name: "Jul", value: 38 },
    { name: "Aug", value: 55 },
  ]

  return (
    <Card title={title} bordered={true} style={{ height: "100%" }}>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#2c5ea8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default BarChartWidget
