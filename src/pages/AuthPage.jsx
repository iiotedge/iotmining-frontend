"use client"

import React, { useEffect, useRef, useState } from "react"
import { Layout, Typography, Tabs, Card, Space, Button } from "antd"
import { useNavigate } from "react-router-dom"
import { useTheme } from "../components/theme/ThemeProvider"
import LoginForm from "../components/auth/LoginForm"
import SignupForm from "../components/auth/SignupForm"
import { MoonOutlined, SunOutlined } from "@ant-design/icons"

const { Content } = Layout
const { Title, Text } = Typography

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState("login")
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 920 : true)
  const navigate = useNavigate()
  const { toggleTheme, isDarkMode, tokens } = useTheme()

  const leftRef = useRef(null)
  const rightRef = useRef(null)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 920)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  useEffect(() => {
    // Simple mount transitions via WAAPI
    const timing = { duration: 700, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" }
    if (leftRef.current?.animate) {
      leftRef.current.animate(
        [
          { opacity: 0, transform: "translateY(-8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        timing
      )
    } else if (leftRef.current) {
      leftRef.current.style.opacity = 1
      leftRef.current.style.transform = "none"
    }

    if (rightRef.current?.animate) {
      rightRef.current.animate(
        [
          { opacity: 0, transform: "translateY(10px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { ...timing, duration: 650, delay: 120 }
      )
    } else if (rightRef.current) {
      rightRef.current.style.opacity = 1
      rightRef.current.style.transform = "none"
    }
  }, [])

  const handleSuccessfulAuth = () => navigate("/")

  // Theme-aware colors for the left brand panel
  const brandBg = isDarkMode
    ? `linear-gradient(135deg, #0a1020 0%, #0e1428 45%, #0d1b3a 100%)`
    : `linear-gradient(135deg, #eef3ff 0%, #e8f0ff 60%, #e2ecff 100%)`

  // Text & overlay colors adapt to theme
  const brandText = isDarkMode ? "#ffffff" : "#0b1a3a"
  const brandTextMuted = isDarkMode ? "rgba(255,255,255,0.85)" : "#1b2a4d"
  const brandOverlayBg = isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
  const brandIconColor = brandText

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${tokens.colorBgLayout}, ${tokens.colorBgElevated})`,
      }}
    >
      <Content style={{ display: "grid", placeItems: "center", padding: 16 }}>
        <div
          style={{
            width: "100%",
            maxWidth: 1140,
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
            gap: isMobile ? 16 : 28,
            alignItems: "stretch",
          }}
        >
          {/* Brand / pitch side */}
          <div
            ref={leftRef}
            style={{
              background: brandBg,
              borderRadius: 16,
              position: "relative",
              padding: isMobile ? 24 : 40,
              overflow: "hidden",
              boxShadow: tokens.boxShadow,
              minHeight: isMobile ? 160 : 520,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              opacity: 0,                 // initial for WAAPI
              transform: "translateY(-8px)",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <Title level={isMobile ? 3 : 2} style={{ color: brandText, margin: 0 }}>
                  IoTMining Technology
                </Title>

                <Button
                  size="large"
                  shape="circle"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  style={{
                    background: brandOverlayBg,
                    border: "none",
                    color: brandIconColor,
                    backdropFilter: "blur(4px)",
                  }}
                  icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
                />
              </div>

              <Text style={{ color: brandTextMuted }}>
                Secure, scalable edge & IoT dashboards. Real‑time telemetry, alerts, and OTA—designed for
                industrial workloads.
              </Text>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 12,
                  marginTop: 20,
                }}
              >
                <Card
                  bordered={false}
                  style={{
                    background: brandOverlayBg,
                    borderRadius: 12,
                    color: brandText,
                    backdropFilter: "blur(6px)",
                  }}
                  bodyStyle={{ padding: 14 }}
                >
                  <Text style={{ color: brandText }}>
                    • MFA/OTP verification<br />• Role‑aware routing<br />• Dark mode by default
                  </Text>
                </Card>
                <Card
                  bordered={false}
                  style={{
                    background: brandOverlayBg,
                    borderRadius: 12,
                    color: brandText,
                    backdropFilter: "blur(6px)",
                  }}
                  bodyStyle={{ padding: 14 }}
                >
                  <Text style={{ color: brandText }}>
                    • Production‑grade UX<br />• Accessible inputs<br />• Mobile‑first layout
                  </Text>
                </Card>
              </div>
            </div>

            <Space size="small" style={{ color: isDarkMode ? "rgba(255,255,255,0.7)" : brandTextMuted, marginTop: 12 }}>
              <Text style={{ color: "inherit" }}>© {new Date().getFullYear()} IoTMining</Text>
              <Text style={{ color: "inherit" }}>•</Text>
              <Text style={{ color: "inherit" }}>All rights reserved</Text>
            </Space>
          </div>

          {/* Auth card */}
          <div
            ref={rightRef}
            style={{
              opacity: 0,                // initial for WAAPI
              transform: "translateY(10px)",
            }}
          >
            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                boxShadow: tokens.boxShadow,
                background: tokens.colorBgContainer,
              }}
              bodyStyle={{ padding: isMobile ? 18 : 28 }}
            >
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                centered
                items={[
                  { key: "login", label: "Login", children: <LoginForm onSuccess={handleSuccessfulAuth} /> },
                  { key: "signup", label: "Sign Up", children: <SignupForm onSuccess={() => setActiveTab("login")} /> },
                ]}
              />
            </Card>
          </div>
        </div>
      </Content>
    </Layout>
  )
}

export default AuthPage



// "use client"

// import React, { useState, useEffect } from "react"
// import { Card, Tabs, Typography, Layout } from "antd"
// import { useNavigate } from "react-router-dom"
// import LoginForm from "../components/auth/LoginForm"
// import SignupForm from "../components/auth/SignupForm"
// import "../styles/auth.css"
// import logo from "../assets/iotmining-logo.svg"

// const { Title } = Typography
// const { Content } = Layout
// const { TabPane } = Tabs

// const AuthPage = () => {
//   const [activeTab, setActiveTab] = useState("login")
//   const [windowWidth, setWindowWidth] = useState(window.innerWidth)
//   const navigate = useNavigate()

//   useEffect(() => {
//     const handleResize = () => {
//       setWindowWidth(window.innerWidth)
//     }

//     window.addEventListener("resize", handleResize)
//     return () => {
//       window.removeEventListener("resize", handleResize)
//     }
//   }, [])

//   const handleSuccessfulAuth = () => {
//     navigate("/")
//   }

//   return (
//     <Layout className="auth-layout">
//       <Content className="auth-content">
//         <div className="auth-container">
//           <div className="auth-logo-container">
//           {/* <img src={logo || "/iotmining-logo.svg"} alt="IoT Edge" className="auth-logo" /> */}
//             <Title level={windowWidth <= 575 ? 3 : 2} className="auth-title">
//               IoTMining Technology
//             </Title>
//           </div>

//           <Card className="auth-card" bordered={false}>
//             <Tabs activeKey={activeTab} onChange={setActiveTab} centered className="auth-tabs">
//               <TabPane tab="Login" key="login">
//                 <LoginForm onSuccess={handleSuccessfulAuth} />
//               </TabPane>
//               <TabPane tab="Sign Up" key="signup">
//                 <SignupForm onSuccess={() => setActiveTab("login")} />
//               </TabPane>
//             </Tabs>
//           </Card>

//           <div className="auth-footer">
//             <Typography.Text type="secondary">
//               © {new Date().getFullYear()} IoTMining. All rights reserved.
//             </Typography.Text>
//           </div>
//         </div>
//       </Content>
//     </Layout>
//   )
// }

// export default AuthPage
