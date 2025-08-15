"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { ConfigProvider, theme as antdTheme } from "antd"

// Create context
const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  isDarkMode: false,
  primaryColor: "#304269",
  setPrimaryColor: () => {},
  resetTheme: () => {},
})

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext)

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Check if user has a theme preference in localStorage or prefers dark mode
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("thingsboard-theme")
      if (savedTheme) {
        return savedTheme
      }

      // Check if user prefers dark mode
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark"
      }
    }
    return "light"
  })

  // Primary color state
  const [primaryColor, setPrimaryColor] = useState(() => {
    if (typeof window !== "undefined") {
      const savedColor = localStorage.getItem("thingsboard-primary-color")
      if (savedColor) {
        return savedColor
      }
    }
    return "#304269" // Default ThingsBoard blue
  })

  // Update localStorage when theme changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("thingsboard-theme", theme)

      // Add or remove dark class from body
      if (theme === "dark") {
        document.body.classList.add("dark-theme")
      } else {
        document.body.classList.remove("dark-theme")
      }
    }
  }, [theme])

  // Update localStorage when primary color changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("thingsboard-primary-color", primaryColor)
      
      // Update CSS variable for primary color
      document.documentElement.style.setProperty('--primary-color', primaryColor)
    }
  }, [primaryColor])

  // Reset theme to defaults
  const resetTheme = () => {
    setTheme("light")
    setPrimaryColor("#304269")
    localStorage.removeItem("thingsboard-theme")
    localStorage.removeItem("thingsboard-primary-color")
    localStorage.removeItem("thingsboard-theme-auto-detect")
  }

  // Determine if dark mode is active
  const isDarkMode = theme === "dark"

  // Define theme colors
  const themeColors = {
    light: {
      colorPrimary: primaryColor,
      colorBgContainer: "#ffffff",
      colorBgElevated: "#ffffff",
      colorBgLayout: "#f0f2f5",
      colorText: "rgba(0, 0, 0, 0.85)",
      colorTextSecondary: "rgba(0, 0, 0, 0.45)",
      colorBorder: "#d9d9d9",
      colorSplit: "#f0f0f0",
      colorBgMask: "rgba(0, 0, 0, 0.45)",
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
    },
    dark: {
      colorPrimary: primaryColor,
      colorBgContainer: "#141414",
      colorBgElevated: "#1f1f1f",
      colorBgLayout: "#000000",
      colorText: "rgba(255, 255, 255, 0.85)",
      colorTextSecondary: "rgba(255, 255, 255, 0.45)",
      colorBorder: "#303030",
      colorSplit: "#1f1f1f",
      colorBgMask: "rgba(0, 0, 0, 0.75)",
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px 0 rgba(0, 0, 0, 0.2)",
    },
  }

  // Create value object for context
  const contextValue = {
    theme,
    setTheme,
    isDarkMode,
    primaryColor,
    setPrimaryColor,
    resetTheme,
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider
        theme={{
          algorithm: isDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: themeColors[theme],
          components: {
            Card: {
              colorBgContainer: isDarkMode ? "#1f1f1f" : "#ffffff",
            },
            Layout: {
              colorBgHeader: isDarkMode ? "#141414" : "#ffffff",
              colorBgBody: isDarkMode ? "#000000" : "#f0f2f5",
              colorBgTrigger: isDarkMode ? "#1f1f1f" : "#ffffff",
            },
            Menu: {
              colorItemBg: isDarkMode ? "#141414" : "#ffffff",
              colorSubItemBg: isDarkMode ? "#000000" : "#ffffff",
              colorItemText: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.85)",
              colorItemTextSelected: isDarkMode ? primaryColor : primaryColor,
            },
            Button: {
              colorPrimary: primaryColor,
              colorPrimaryHover: isDarkMode ? 
                `${primaryColor}E6` : // 90% opacity
                `${primaryColor}D9`, // 85% opacity
              colorPrimaryActive: isDarkMode ? 
                `${primaryColor}CC` : // 80% opacity
                `${primaryColor}BF`, // 75% opacity
            },
            Input: {
              colorBgContainer: isDarkMode ? "#141414" : "#ffffff",
              colorBorder: isDarkMode ? "#434343" : "#d9d9d9",
            },
            Select: {
              colorBgContainer: isDarkMode ? "#141414" : "#ffffff",
              colorBorder: isDarkMode ? "#434343" : "#d9d9d9",
            },
            Table: {
              colorBgContainer: isDarkMode ? "#1f1f1f" : "#ffffff",
              colorText: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.85)",
              colorBorderSecondary: isDarkMode ? "#303030" : "#f0f0f0",
            },
            Tabs: {
              colorBgContainer: isDarkMode ? "#1f1f1f" : "#ffffff",
            },
            Modal: {
              colorBgElevated: isDarkMode ? "#1f1f1f" : "#ffffff",
            },
            Drawer: {
              colorBgElevated: isDarkMode ? "#1f1f1f" : "#ffffff",
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
