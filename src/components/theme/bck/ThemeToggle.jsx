"use client"
import { Button, Tooltip } from "antd"
import { SunOutlined, MoonOutlined } from "@ant-design/icons"
import { useTheme } from "./ThemeProvider"

const ThemeToggle = ({ className, style }) => {
  const { theme, toggleTheme } = useTheme()

  return (
    <Tooltip title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}>
      <Button
        type="text"
        icon={theme === "light" ? <MoonOutlined /> : <SunOutlined />}
        onClick={toggleTheme}
        className={className}
        style={style}
        aria-label="Toggle theme"
      />
    </Tooltip>
  )
}

export default ThemeToggle
