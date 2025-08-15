"use client"

import { createContext, useContext, useState, useEffect, useMemo } from "react"
import { ConfigProvider, theme as antdTheme } from "antd"

/* ---------------------------
   Defaults & storage keys
----------------------------*/
const DEFAULT_PRIMARY = "#1667ff"
const DEFAULT_THEME = "light"
const THEME_STORAGE_KEY = "iotmining-theme"
const PRIMARY_COLOR_KEY = "iotmining-primary-color"

/* ---------------------------
   AntD core tokens (yours)
----------------------------*/
const THEME_TOKENS = {
  light: {
    colorPrimary: DEFAULT_PRIMARY,
    colorBgContainer: "#fff",
    colorBgElevated: "#fafbfc",
    colorBgLayout: "#f0f2f5",
    colorText: "#1d1d1d",
    colorTextSecondary: "#6d6d6d",
    colorBorder: "#e0e0e0",
    colorSplit: "#ececec",
    colorBgMask: "rgba(0,0,0,0.10)",
    boxShadow:
      "0 1px 2px 0 rgba(0,0,0,0.03),0 1px 6px -1px rgba(0,0,0,0.02),0 2px 4px 0 rgba(0,0,0,0.02)",
    accent: DEFAULT_PRIMARY,
    ok: "#4caf50",
    warn: "#ff9800",
    err: "#f44336",
    gray: "#888",
    disabledBg: "#f5f5f5",
    disabledText: "#bdbdbd",
  },
  dark: {
    colorPrimary: DEFAULT_PRIMARY,
    colorBgContainer: "#101010",
    colorBgElevated: "#171717",
    colorBgLayout: "#000",
    colorText: "#fff",
    colorTextSecondary: "#bdbdbd",
    colorBorder: "#181818",
    colorSplit: "#181818",
    colorBgMask: "rgba(0,0,0,0.78)",
    boxShadow: "0 2px 8px 0 rgba(0,0,0,0.68)",
    accent: "var(--primary-color, #1667ff)",
    ok: "#539150",
    warn: "#bb9500",
    err: "#bc3d3d",
    gray: "#888",
    disabledBg: "#191919",
    disabledText: "#7c7c7c",
  },
}

/* ---------------------------
   AntD component overrides
----------------------------*/
const darkOverrides = {
  Card: {
    colorBgContainer: "#101010",
    colorBorderSecondary: "#181818",
    boxShadow: "0 2px 8px 0 rgba(0,0,0,0.68)",
  },
  Layout: {
    colorBgHeader: "#101010",
    colorBgBody: "#000",
    colorBgTrigger: "#171717",
  },
  Menu: {
    colorItemBg: "#101010",
    colorSubItemBg: "#181818",
    colorItemText: "#fff",
    colorItemTextSelected: "var(--primary-color, #1667ff)",
    colorItemBgSelected: "#232a3a",
  },
  Button: {
    colorPrimary: "var(--primary-color, #1667ff)",
    colorPrimaryHover: "#1847b9",
    colorPrimaryActive: "#102b57",
    colorText: "#fff",
    colorBorder: "#363636",
    colorBgDisabled: "#191919",
    colorTextDisabled: "#7c7c7c",
    colorBorderDisabled: "#363636",
    opacity: 0.65,
  },
  Input: {
    colorBgContainer: "#101010",
    colorBorder: "#181818",
    colorText: "#fff",
    colorTextPlaceholder: "#666",
  },
  Select: {
    colorBgContainer: "#101010",
    colorBorder: "#181818",
    colorText: "#fff",
  },
  Table: {
    colorBgContainer: "#101010",
    colorText: "#fff",
    colorBorderSecondary: "#181818",
    colorHeaderBg: "#181818",
  },
  Tabs: {
    colorBgContainer: "#101010",
    colorText: "#fff",
    colorBorder: "#181818",
  },
  Modal: { colorBgElevated: "#171717", colorText: "#fff" },
  Drawer: { colorBgElevated: "#171717", colorText: "#fff" },
  Tooltip: { colorBgDefault: "#1b1b1b", colorText: "#fff" },
}
const lightOverrides = {
  // add light-specific overrides if needed
}

/* ---------------------------
   Semantic tokens (for widgets, charts, css vars)
----------------------------*/
function buildSemanticTokens(mode, primary) {
  if (mode === "dark") {
    return {
      primary,
      text: "#ffffff",
      textSecondary: "#bdbdbd",
      surface: "#101010",    // cards/containers
      elevated: "#171717",   // modals/drawers
      layout: "#000000",     // page background
      border: "#181818",
      split: "#181818",
      shadow: "0 2px 8px 0 rgba(0,0,0,0.68)",
      mask: "rgba(0,0,0,0.78)",
      success: "#539150",
      warning: "#bb9500",
      error: "#bc3d3d",
      disabledBg: "#191919",
      disabledText: "#7c7c7c",
      gridline: "#222",
      tooltipBg: "#1b1b1b",
      tooltipText: "#fff",
      series: [
        primary, "#4cc9f0", "#f0386b", "#ffd166", "#06d6a0",
        "#b794f4", "#ff7f50", "#7bdff2", "#f4a261", "#90be6d",
      ],
      animationDurationMs: 240,
      animationEasing: "cubic-bezier(.2,.8,.2,1)",
    }
  }
  return {
    primary,
    text: "#1d1d1d",
    textSecondary: "#6d6d6d",
    surface: "#ffffff",
    elevated: "#fafbfc",
    layout: "#f0f2f5",
    border: "#e0e0e0",
    split: "#ececec",
    shadow: "0 1px 2px rgba(0,0,0,0.06)",
    mask: "rgba(0,0,0,0.10)",
    success: "#4caf50",
    warning: "#ff9800",
    error: "#f44336",
    disabledBg: "#f5f5f5",
    disabledText: "#bdbdbd",
    gridline: "#eee",
    tooltipBg: "#111827",
    tooltipText: "#fff",
    series: [
      primary, "#0ea5e9", "#ef4444", "#f59e0b", "#10b981",
      "#8b5cf6", "#f97316", "#22d3ee", "#f4a261", "#84cc16",
    ],
    animationDurationMs: 220,
    animationEasing: "cubic-bezier(.2,.8,.2,1)",
  }
}

/* Push semantic tokens to CSS vars for global consumption */
function injectCssVars(tokens) {
  const root = document.documentElement
  const set = (k, v) => root.style.setProperty(`--${k}`, String(v))
  set("primary", tokens.primary)
  set("text", tokens.text)
  set("text-secondary", tokens.textSecondary)
  set("surface", tokens.surface)
  set("elevated", tokens.elevated)
  set("layout", tokens.layout)
  set("border", tokens.border)
  set("split", tokens.split)
  set("shadow", tokens.shadow)
  set("mask", tokens.mask)
  set("success", tokens.success)
  set("warning", tokens.warning)
  set("error", tokens.error)
  set("disabled-bg", tokens.disabledBg)
  set("disabled-text", tokens.disabledText)
  set("gridline", tokens.gridline)
  set("tooltip-bg", tokens.tooltipBg)
  set("tooltip-text", tokens.tooltipText)
  set("anim-duration", tokens.animationDurationMs)
  set("anim-easing", tokens.animationEasing)
  tokens.series.forEach((c, i) => set(`series-${i + 1}`, c))
}

/* ---------------------------
   Context
----------------------------*/
const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  isDarkMode: false,
  primaryColor: DEFAULT_PRIMARY,
  setPrimaryColor: () => {},
  resetTheme: () => {},
  toggleTheme: () => {},
  tokens: THEME_TOKENS[DEFAULT_THEME],
  // safe default semantic to avoid undefined access on first render
  semantic: buildSemanticTokens(DEFAULT_THEME, DEFAULT_PRIMARY),
})

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider")
  return ctx
}

/* ---------------------------
   Provider
----------------------------*/
export const ThemeProvider = ({ children }) => {
  // theme + primary state
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      if (savedTheme) return savedTheme
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark"
    }
    return DEFAULT_THEME
  })
  const [primaryColor, setPrimaryColor] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(PRIMARY_COLOR_KEY)
      if (saved) return saved
    }
    return DEFAULT_PRIMARY
  })
  const isDarkMode = theme === "dark"

  // persist theme + body class
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
      document.body.classList.toggle("dark-theme", isDarkMode)
    }
  }, [theme, isDarkMode])

  // persist primary + css var
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(PRIMARY_COLOR_KEY, primaryColor)
      document.documentElement.style.setProperty("--primary-color", primaryColor)
    }
  }, [primaryColor])

  // AntD tokens (yours), keep synced to CSS vars too if you like
  const tokens = useMemo(() => {
    const currentTokens = { ...THEME_TOKENS[theme], colorPrimary: primaryColor }
    if (typeof window !== "undefined") {
      Object.entries(currentTokens).forEach(([k, v]) => {
        document.documentElement.style.setProperty(
          `--${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}`,
          v
        )
      })
    }
    return currentTokens
  }, [theme, primaryColor])

  // semantic tokens (for widgets/sidebars/charts) + push to CSS vars
  const semantic = useMemo(
    () => buildSemanticTokens(isDarkMode ? "dark" : "light", primaryColor),
    [isDarkMode, primaryColor]
  )
  useEffect(() => {
    if (typeof window !== "undefined") injectCssVars(semantic)
  }, [semantic])

  // helpers
  const resetTheme = () => {
    setTheme(DEFAULT_THEME)
    setPrimaryColor(DEFAULT_PRIMARY)
    localStorage.removeItem(THEME_STORAGE_KEY)
    localStorage.removeItem(PRIMARY_COLOR_KEY)
  }
  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"))

  const contextValue = {
    theme,
    setTheme,
    isDarkMode,
    primaryColor,
    setPrimaryColor,
    resetTheme,
    toggleTheme,
    tokens,
    semantic, // ← expose semantic so components can read .elevated, .border, etc.
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider
        theme={{
          algorithm: isDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: tokens,
          components: isDarkMode ? darkOverrides : lightOverrides,
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}

export { ThemeContext }
export default ThemeProvider

// "use client"

// import { createContext, useContext, useState, useEffect, useMemo } from "react"
// import { ConfigProvider, theme as antdTheme } from "antd"

// const DEFAULT_PRIMARY = "#1667ff"
// const DEFAULT_THEME = "light"
// const THEME_STORAGE_KEY = "iotmining-theme"
// const PRIMARY_COLOR_KEY = "iotmining-primary-color"

// // Core theme color tokens for app-wide use (extend as needed)
// const THEME_TOKENS = {
//   light: {
//     colorPrimary: DEFAULT_PRIMARY,
//     colorBgContainer: "#fff",
//     colorBgElevated: "#fafbfc",
//     colorBgLayout: "#f0f2f5",
//     colorText: "#1d1d1d",
//     colorTextSecondary: "#6d6d6d",
//     colorBorder: "#e0e0e0",
//     colorSplit: "#ececec",
//     colorBgMask: "rgba(0,0,0,0.10)",
//     boxShadow: "0 1px 2px 0 rgba(0,0,0,0.03),0 1px 6px -1px rgba(0,0,0,0.02),0 2px 4px 0 rgba(0,0,0,0.02)",
//     accent: DEFAULT_PRIMARY,
//     ok: "#4caf50",
//     warn: "#ff9800",
//     err: "#f44336",
//     gray: "#888",
//     disabledBg: "#f5f5f5",
//     disabledText: "#bdbdbd",
//   },
//   dark: {
//     colorPrimary: DEFAULT_PRIMARY,
//     colorBgContainer: "#101010",     // Card/Widget/Container
//     colorBgElevated: "#171717",      // Modal/Popover/Drawer
//     colorBgLayout: "#000",           // Root layout, dashboard
//     colorText: "#fff",
//     colorTextSecondary: "#bdbdbd",
//     colorBorder: "#181818",
//     colorSplit: "#181818",
//     colorBgMask: "rgba(0,0,0,0.78)",
//     boxShadow: "0 2px 8px 0 rgba(0,0,0,0.68)",
//     accent: "var(--primary-color, #1667ff)",
//     ok: "#539150",
//     warn: "#bb9500",
//     err: "#bc3d3d",
//     gray: "#888",
//     disabledBg: "#191919",
//     disabledText: "#7c7c7c",
//   }
// }

// // Ant Design component overrides for a clean, accessible industry feel
// const darkOverrides = {
//   Card: {
//     colorBgContainer: "#101010",
//     colorBorderSecondary: "#181818",
//     boxShadow: "0 2px 8px 0 rgba(0,0,0,0.68)",
//   },
//   Layout: {
//     colorBgHeader: "#101010",
//     colorBgBody: "#000",
//     colorBgTrigger: "#171717",
//   },
//   Menu: {
//     colorItemBg: "#101010",
//     colorSubItemBg: "#181818",
//     colorItemText: "#fff",
//     colorItemTextSelected: "var(--primary-color, #1667ff)",
//     colorItemBgSelected: "#232a3a",
//   },
//   Button: {
//     colorPrimary: "var(--primary-color, #1667ff)",
//     colorPrimaryHover: "#1847b9",
//     colorPrimaryActive: "#102b57",
//     colorText: "#fff",
//     colorBorder: "#363636",
//     // Disabled button color fix for industry contrast:
//     colorBgDisabled: "#191919",
//     colorTextDisabled: "#7c7c7c",
//     colorBorderDisabled: "#363636",
//     opacity: 0.65,
//   },
//   Input: {
//     colorBgContainer: "#101010",
//     colorBorder: "#181818",
//     colorText: "#fff",
//     colorTextPlaceholder: "#666",
//   },
//   Select: {
//     colorBgContainer: "#101010",
//     colorBorder: "#181818",
//     colorText: "#fff",
//   },
//   Table: {
//     colorBgContainer: "#101010",
//     colorText: "#fff",
//     colorBorderSecondary: "#181818",
//     colorHeaderBg: "#181818",
//   },
//   Tabs: {
//     colorBgContainer: "#101010",
//     colorText: "#fff",
//     colorBorder: "#181818",
//   },
//   Modal: {
//     colorBgElevated: "#171717",
//     colorText: "#fff",
//   },
//   Drawer: {
//     colorBgElevated: "#171717",
//     colorText: "#fff",
//   },
//   Tooltip: {
//     colorBgDefault: "#1b1b1b",
//     colorText: "#fff",
//   },
// }

// const lightOverrides = {
//   // Add light-specific overrides here if needed.
// }

// // --- CONTEXT CREATION ---
// const ThemeContext = createContext({
//   theme: DEFAULT_THEME,
//   setTheme: () => {},
//   isDarkMode: false,
//   primaryColor: DEFAULT_PRIMARY,
//   setPrimaryColor: () => {},
//   resetTheme: () => {},
//   toggleTheme: () => {},
//   tokens: THEME_TOKENS[DEFAULT_THEME],
// })

// // --- CUSTOM HOOK ---
// export const useTheme = () => {
//   const context = useContext(ThemeContext)
//   if (!context) throw new Error("useTheme must be used within a ThemeProvider")
//   return context
// }

// // --- PROVIDER COMPONENT ---
// export const ThemeProvider = ({ children }) => {
//   // --- Theme State Management
//   const [theme, setTheme] = useState(() => {
//     if (typeof window !== "undefined") {
//       const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
//       if (savedTheme) return savedTheme
//       if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark"
//     }
//     return DEFAULT_THEME
//   })
//   const [primaryColor, setPrimaryColor] = useState(() => {
//     if (typeof window !== "undefined") {
//       const saved = localStorage.getItem(PRIMARY_COLOR_KEY)
//       if (saved) return saved
//     }
//     return DEFAULT_PRIMARY
//   })

//   // --- Sync to localStorage and update CSS variable
//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       localStorage.setItem(THEME_STORAGE_KEY, theme)
//       document.body.classList.toggle("dark-theme", theme === "dark")
//     }
//   }, [theme])

//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       localStorage.setItem(PRIMARY_COLOR_KEY, primaryColor)
//       document.documentElement.style.setProperty("--primary-color", primaryColor)
//     }
//   }, [primaryColor])

//   // --- Theme Reset & Toggler ---
//   const resetTheme = () => {
//     setTheme(DEFAULT_THEME)
//     setPrimaryColor(DEFAULT_PRIMARY)
//     localStorage.removeItem(THEME_STORAGE_KEY)
//     localStorage.removeItem(PRIMARY_COLOR_KEY)
//   }
//   const toggleTheme = () => setTheme(prev => (prev === "light" ? "dark" : "light"))
//   const isDarkMode = theme === "dark"

//   // --- Memoize tokens for performance & CSS variable sync
//   const tokens = useMemo(() => {
//     const currentTokens = { ...THEME_TOKENS[theme], colorPrimary: primaryColor }
//     // Optional: set all tokens as CSS variables (for global CSS usage)
//     if (typeof window !== "undefined") {
//       Object.entries(currentTokens).forEach(([k, v]) => {
//         document.documentElement.style.setProperty(`--${k.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}`, v)
//       })
//     }
//     return currentTokens
//   }, [theme, primaryColor])

//   // --- Context Value
//   const contextValue = {
//     theme,
//     setTheme,
//     isDarkMode,
//     primaryColor,
//     setPrimaryColor,
//     resetTheme,
//     toggleTheme,
//     tokens,
//   }

//   return (
//     <ThemeContext.Provider value={contextValue}>
//       <ConfigProvider
//         theme={{
//           algorithm: isDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
//           token: tokens,
//           components: isDarkMode ? darkOverrides : lightOverrides,
//         }}
//       >
//         {children}
//       </ConfigProvider>
//     </ThemeContext.Provider>
//   )
// }

// export { ThemeContext }
// export default ThemeProvider

// // "use client"

// // import { createContext, useContext, useState, useEffect } from "react"
// // import { ConfigProvider, theme as antdTheme } from "antd"

// // // Create context
// // const ThemeContext = createContext({
// //   theme: "light",
// //   setTheme: () => {},
// //   isDarkMode: false,
// //   primaryColor: "#1667ff",
// //   setPrimaryColor: () => {},
// //   resetTheme: () => {},
// //   toggleTheme: () => {},
// // })

// // // Custom hook to use the theme context
// // export const useTheme = () => {
// //   const context = useContext(ThemeContext)
// //   if (!context) throw new Error("useTheme must be used within a ThemeProvider")
// //   return context
// // }

// // export const ThemeProvider = ({ children }) => {
// //   // --- Theme State
// //   const [theme, setTheme] = useState(() => {
// //     if (typeof window !== "undefined") {
// //       const savedTheme = localStorage.getItem("iotmining-theme")
// //       if (savedTheme) return savedTheme
// //       if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
// //         return "dark"
// //       }
// //     }
// //     return "light"
// //   })
// //   // --- Primary Color State
// //   const [primaryColor, setPrimaryColor] = useState(() => {
// //     if (typeof window !== "undefined") {
// //       const savedColor = localStorage.getItem("iotmining-primary-color")
// //       if (savedColor) return savedColor
// //     }
// //     return "#1667ff" // Default primary blue, change as needed
// //   })

// //   // --- Sync with localStorage and body class
// //   useEffect(() => {
// //     if (typeof window !== "undefined") {
// //       localStorage.setItem("iotmining-theme", theme)
// //       document.body.classList.toggle("dark-theme", theme === "dark")
// //     }
// //   }, [theme])

// //   useEffect(() => {
// //     if (typeof window !== "undefined") {
// //       localStorage.setItem("iotmining-primary-color", primaryColor)
// //       document.documentElement.style.setProperty("--primary-color", primaryColor)
// //     }
// //   }, [primaryColor])

// //   // --- Theme Reset
// //   const resetTheme = () => {
// //     setTheme("light")
// //     setPrimaryColor("#1667ff")
// //     localStorage.removeItem("iotmining-theme")
// //     localStorage.removeItem("iotmining-primary-color")
// //     localStorage.removeItem("iotmining-theme-auto-detect")
// //   }

// //   const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"))
// //   const isDarkMode = theme === "dark"

// //   // --- Color Tokens for True Dark Mode
// //   const themeColors = {
// //     light: {
// //       colorPrimary: primaryColor,
// //       colorBgContainer: "#fff",
// //       colorBgElevated: "#fff",
// //       colorBgLayout: "#f0f2f5",
// //       colorText: "#1d1d1d",
// //       colorTextSecondary: "rgba(0,0,0,0.45)",
// //       colorBorder: "#d9d9d9",
// //       colorSplit: "#eaeaea",
// //       colorBgMask: "rgba(0,0,0,0.45)",
// //       boxShadow: "0 1px 2px 0 rgba(0,0,0,0.03),0 1px 6px -1px rgba(0,0,0,0.02),0 2px 4px 0 rgba(0,0,0,0.02)",
// //     },
// //     dark: {
// //       colorPrimary: primaryColor,
// //       colorBgContainer: "#101010",          // Widget/Card/Container backgrounds
// //       colorBgElevated: "#171717",           // Modal/Popover/Drawer
// //       colorBgLayout: "#000",                // Outer layout, dashboard, body
// //       colorText: "#fff",                    // Full white for main text
// //       colorTextSecondary: "rgba(255,255,255,0.65)",
// //       colorBorder: "#222",                  // Minimal but visible border
// //       colorSplit: "#181818",
// //       colorBgMask: "rgba(0,0,0,0.78)",      // For overlays
// //       boxShadow: "0 2px 8px 0 rgba(0,0,0,0.68)", // Softer shadow
// //     }
// //   }

// //   // --- Ant Design component overrides for true dark
// //   const darkOverrides = {
// //     Card: {
// //       colorBgContainer: "#101010",
// //       boxShadow: "0 2px 8px 0 rgba(0,0,0,0.68)",
// //       colorBorderSecondary: "#222",
// //     },
// //     Layout: {
// //       colorBgHeader: "#000",
// //       colorBgBody: "#000",
// //       colorBgTrigger: "#171717",
// //     },
// //     Menu: {
// //       colorItemBg: "#000",
// //       colorSubItemBg: "#101010",
// //       colorItemText: "#fff",
// //       colorItemTextSelected: primaryColor,
// //       colorItemBgSelected: "#111a2f",
// //     },
// //     Button: {
// //       colorPrimary: primaryColor,
// //       colorPrimaryHover: "#1847b9",
// //       colorPrimaryActive: "#102b57",
// //       colorText: "#fff",
// //       colorBorder: "#333",
// //     },
// //     Input: {
// //       colorBgContainer: "#101010",
// //       colorBorder: "#222",
// //       colorText: "#fff",
// //       colorTextPlaceholder: "rgba(255,255,255,0.40)",
// //     },
// //     Select: {
// //       colorBgContainer: "#101010",
// //       colorBorder: "#222",
// //       colorText: "#fff",
// //     },
// //     Table: {
// //       colorBgContainer: "#101010",
// //       colorText: "#fff",
// //       colorBorderSecondary: "#181818",
// //       colorHeaderBg: "#181818",
// //     },
// //     Tabs: {
// //       colorBgContainer: "#101010",
// //       colorText: "#fff",
// //       colorBorder: "#222",
// //     },
// //     Modal: {
// //       colorBgElevated: "#171717",
// //       colorText: "#fff",
// //     },
// //     Drawer: {
// //       colorBgElevated: "#171717",
// //       colorText: "#fff",
// //     },
// //     Tooltip: {
// //       colorBgDefault: "#1b1b1b",
// //       colorText: "#fff",
// //     },
// //   }

// //   const lightOverrides = {}

// //   // --- Final Context
// //   const contextValue = {
// //     theme,
// //     setTheme,
// //     isDarkMode,
// //     primaryColor,
// //     setPrimaryColor,
// //     resetTheme,
// //     toggleTheme,
// //   }

// //   return (
// //     <ThemeContext.Provider value={contextValue}>
// //       <ConfigProvider
// //         theme={{
// //           algorithm: isDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
// //           token: themeColors[theme],
// //           components: isDarkMode ? darkOverrides : lightOverrides,
// //         }}
// //       >
// //         {children}
// //       </ConfigProvider>
// //     </ThemeContext.Provider>
// //   )
// // }

// // export { ThemeContext }
// // export default ThemeProvider

// // // "use client"

// // // import { createContext, useContext, useState, useEffect } from "react"
// // // import { ConfigProvider, theme as antdTheme } from "antd"

// // // // Create context
// // // const ThemeContext = createContext({
// // //   theme: "light",
// // //   setTheme: () => {},
// // //   isDarkMode: false,
// // //   primaryColor: "#304269",
// // //   setPrimaryColor: () => {},
// // //   resetTheme: () => {},
// // //   toggleTheme: () => {},
// // // })

// // // // Custom hook to use the theme context
// // // export const useTheme = () => {
// // //   const context = useContext(ThemeContext)
// // //   if (!context) {
// // //     throw new Error("useTheme must be used within a ThemeProvider")
// // //   }
// // //   return context
// // // }

// // // // Theme provider component
// // // export const ThemeProvider = ({ children }) => {
// // //   // Check if user has a theme preference in localStorage or prefers dark mode
// // //   const [theme, setTheme] = useState(() => {
// // //     if (typeof window !== "undefined") {
// // //       const savedTheme = localStorage.getItem("thingsboard-theme")
// // //       if (savedTheme) {
// // //         return savedTheme
// // //       }

// // //       // Check if user prefers dark mode
// // //       if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
// // //         return "dark"
// // //       }
// // //     }
// // //     return "light"
// // //   })

// // //   // Primary color state
// // //   const [primaryColor, setPrimaryColor] = useState(() => {
// // //     if (typeof window !== "undefined") {
// // //       const savedColor = localStorage.getItem("thingsboard-primary-color")
// // //       if (savedColor) {
// // //         return savedColor
// // //       }
// // //     }
// // //     return "#304269" // Default ThingsBoard blue
// // //   })

// // //   // Update localStorage when theme changes
// // //   useEffect(() => {
// // //     if (typeof window !== "undefined") {
// // //       localStorage.setItem("thingsboard-theme", theme)

// // //       // Add or remove dark class from body
// // //       if (theme === "dark") {
// // //         document.body.classList.add("dark-theme")
// // //       } else {
// // //         document.body.classList.remove("dark-theme")
// // //       }
// // //     }
// // //   }, [theme])

// // //   // Update localStorage when primary color changes
// // //   useEffect(() => {
// // //     if (typeof window !== "undefined") {
// // //       localStorage.setItem("thingsboard-primary-color", primaryColor)

// // //       // Update CSS variable for primary color
// // //       document.documentElement.style.setProperty("--primary-color", primaryColor)
// // //     }
// // //   }, [primaryColor])

// // //   // Reset theme to defaults
// // //   const resetTheme = () => {
// // //     setTheme("light")
// // //     setPrimaryColor("#304269")
// // //     localStorage.removeItem("thingsboard-theme")
// // //     localStorage.removeItem("thingsboard-primary-color")
// // //     localStorage.removeItem("thingsboard-theme-auto-detect")
// // //   }

// // //   // Toggle between light and dark themes
// // //   const toggleTheme = () => {
// // //     setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"))
// // //   }

// // //   // Determine if dark mode is active
// // //   const isDarkMode = theme === "dark"

// // //   // Define theme colors
// // //   const themeColors = {
// // //     light: {
// // //       colorPrimary: primaryColor,
// // //       colorBgContainer: "#ffffff",
// // //       colorBgElevated: "#ffffff",
// // //       colorBgLayout: "#f0f2f5",
// // //       colorText: "rgba(0, 0, 0, 0.85)",
// // //       colorTextSecondary: "rgba(0, 0, 0, 0.45)",
// // //       colorBorder: "#d9d9d9",
// // //       colorSplit: "#f0f0f0",
// // //       colorBgMask: "rgba(0, 0, 0, 0.45)",
// // //       boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
// // //     },
// // //     dark: {
// // //       colorPrimary: primaryColor,
// // //       colorBgContainer: "#141414",
// // //       colorBgElevated: "#1f1f1f",
// // //       colorBgLayout: "#000000",
// // //       colorText: "rgba(255, 255, 255, 0.85)",
// // //       colorTextSecondary: "rgba(255, 255, 255, 0.45)",
// // //       colorBorder: "#303030",
// // //       colorSplit: "#1f1f1f",
// // //       colorBgMask: "rgba(0, 0, 0, 0.75)",
// // //       boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px 0 rgba(0, 0, 0, 0.2)",
// // //     },
// // //   }

// // //   // Create value object for context
// // //   const contextValue = {
// // //     theme,
// // //     setTheme,
// // //     isDarkMode,
// // //     primaryColor,
// // //     setPrimaryColor,
// // //     resetTheme,
// // //     toggleTheme,
// // //   }

// // //   return (
// // //     <ThemeContext.Provider value={contextValue}>
// // //       <ConfigProvider
// // //         theme={{
// // //           algorithm: isDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
// // //           token: themeColors[theme],
// // //           components: {
// // //             Card: {
// // //               colorBgContainer: isDarkMode ? "#1f1f1f" : "#ffffff",
// // //             },
// // //             Layout: {
// // //               colorBgHeader: isDarkMode ? "#141414" : "#ffffff",
// // //               colorBgBody: isDarkMode ? "#000000" : "#f0f2f5",
// // //               colorBgTrigger: isDarkMode ? "#1f1f1f" : "#ffffff",
// // //             },
// // //             Menu: {
// // //               colorItemBg: isDarkMode ? "#141414" : "#ffffff",
// // //               colorSubItemBg: isDarkMode ? "#000000" : "#ffffff",
// // //               colorItemText: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.85)",
// // //               colorItemTextSelected: isDarkMode ? primaryColor : primaryColor,
// // //             },
// // //             Button: {
// // //               colorPrimary: primaryColor,
// // //               colorPrimaryHover: isDarkMode
// // //                 ? `${primaryColor}E6`
// // //                 : // 90% opacity
// // //                   `${primaryColor}D9`, // 85% opacity
// // //               colorPrimaryActive: isDarkMode
// // //                 ? `${primaryColor}CC`
// // //                 : // 80% opacity
// // //                   `${primaryColor}BF`, // 75% opacity
// // //             },
// // //             Input: {
// // //               colorBgContainer: isDarkMode ? "#141414" : "#ffffff",
// // //               colorBorder: isDarkMode ? "#434343" : "#d9d9d9",
// // //             },
// // //             Select: {
// // //               colorBgContainer: isDarkMode ? "#141414" : "#ffffff",
// // //               colorBorder: isDarkMode ? "#434343" : "#d9d9d9",
// // //             },
// // //             Table: {
// // //               colorBgContainer: isDarkMode ? "#1f1f1f" : "#ffffff",
// // //               colorText: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.85)",
// // //               colorBorderSecondary: isDarkMode ? "#303030" : "#f0f0f0",
// // //             },
// // //             Tabs: {
// // //               colorBgContainer: isDarkMode ? "#1f1f1f" : "#ffffff",
// // //             },
// // //             Modal: {
// // //               colorBgElevated: isDarkMode ? "#1f1f1f" : "#ffffff",
// // //             },
// // //             Drawer: {
// // //               colorBgElevated: isDarkMode ? "#1f1f1f" : "#ffffff",
// // //             },
// // //           },
// // //         }}
// // //       >
// // //         {children}
// // //       </ConfigProvider>
// // //     </ThemeContext.Provider>
// // //   )
// // // }

// // // export { ThemeContext }
// // // export default ThemeProvider
