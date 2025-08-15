"use client"

import { useState, useEffect } from "react"
import {
  Layout, Typography, Space, Avatar, Dropdown, Menu, Button, Tooltip, message,
} from "antd"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { UserOutlined, SettingOutlined, LogoutOutlined, QuestionCircleOutlined, MenuOutlined } from "@ant-design/icons"
import NotificationBell from "../notification/NotificationBell"
import ThemeToggle from "../theme/ThemeToggle"
import { useTheme } from "../theme/ThemeProvider"
import { logout } from "../../api/auth"
import { getTenantName, getTenantType, getUsername, fetchAndSaveTenantName } from "../../utils/tokenUtils"
import { useMediaQuery } from "../../hooks/useMediaQuery"

const { Header } = Layout
const { Title } = Typography

const HeaderComponent = ({ onMobileMenuOpen }) => {
  const [tenantName, setTenantName] = useState(getTenantName())
  const location = useLocation()
  const navigate = useNavigate()
  const { isDarkMode, semantic, theme } = useTheme()
  const token = localStorage.getItem("token")
  const isMobile = useMediaQuery("(max-width: 768px)")

  const bg = (semantic && semantic.surface) || (isDarkMode ? "#11131a" : "#fff")
  const border = (semantic && semantic.border) || (isDarkMode ? "#22232a" : "#e6e8ea")
  const titleColor = (semantic && semantic.text) || (isDarkMode ? "#fff" : "#1a233a")

  const handleLogout = () => {
    logout()
    message.success("Logged out successfully")
    navigate("/login")
    setTimeout(() => window.location.reload(), 100)
  }

  useEffect(() => {
    if (!tenantName) {
      fetchAndSaveTenantName().then((name) => name && setTenantName(name))
    }
    const onStorage = (e) => {
      if (e.key === "tenantName") setTenantName(getTenantName())
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [tenantName])

  const getPageTitle = () => {
    const path = location.pathname
    if (path === "/") return "Home"
    if (path === "/devices") return "Devices"
    if (path === "/dashboards") return "Dashboards"
    if (path.startsWith("/dashboards/")) return "Dashboard Editor"
    if (path.startsWith("/customer-dashboard/")) return "Customer Dashboard"
    if (path === "/rule-chains") return "Rule Chains"
    if (path.startsWith("/rule-chains/")) return "Rule Chain Editor"
    if (path === "/customers") return "Customers"
    if (path === "/notification-center") return "Notification Center"
    if (path === "/settings") return "Settings"
    return "IoTMining"
  }

  const userMenu = (
    <Menu
      onClick={({ key }) => key === "logout" && handleLogout()}
      items={[
        { key: "profile", icon: <UserOutlined />, label: <Link to="/settings?tab=user">Profile</Link> },
        { key: "settings", icon: <SettingOutlined />, label: <Link to="/settings">Settings</Link> },
        { type: "divider" },
        { key: "help", icon: <QuestionCircleOutlined />, label: "Help Center" },
        { key: "logout", icon: <LogoutOutlined />, danger: true, label: "Logout" },
      ]}
    />
  )

  return (
    <Header
      className="site-header"
      style={{
        background: bg,
        padding: "0 16px",
        minHeight: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        // borderBottom: `1px solid ${border}`,
        zIndex: 1100,
        position: "sticky",
        top: 0,
      }}
    >
      {/* Left: mobile burger + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {isMobile && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={onMobileMenuOpen}
            aria-label="Open menu"
            style={{ fontSize: 20, color: titleColor }}
          />
        )}
        <Title level={4} style={{ margin: 0, color: titleColor }}>
          {getPageTitle()}
        </Title>
      </div>

      {/* Right: actions */}
      <div className="header-actions">
        <Space size="middle">
          <ThemeToggle />
          <NotificationBell token={token} />
          <Tooltip title="Settings">
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => navigate("/settings")}
              className="header-icon-button"
              style={{ fontSize: 20, color: titleColor }}
            />
          </Tooltip>
          <Dropdown overlay={userMenu} placement="bottomRight" arrow getPopupContainer={() => document.body}>
            <div className="user-dropdown" style={{ cursor: "pointer" }}>
              <Space align="center" size={10}>
                <Avatar icon={<UserOutlined />} size={40} />
                <div style={{ display: "flex", flexDirection: "column", minWidth: 80 }}>
                  <span
                    style={{
                      fontWeight: 500, fontSize: 15, color: titleColor, lineHeight: 1.2,
                      maxWidth: 140, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden",
                    }}
                  >
                    {tenantName || "Tenant"}
                  </span>
                  <span
                    style={{
                      fontSize: 12, color: isDarkMode ? "#c2cbe2" : "#888", lineHeight: 1.2,
                      maxWidth: 160, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden",
                    }}
                  >
                    {getUsername()} &nbsp;|&nbsp; {getTenantType()}
                  </span>
                </div>
              </Space>
            </div>
          </Dropdown>
        </Space>
      </div>
    </Header>
  )
}

export default HeaderComponent


// "use client"

// import { useState, useEffect } from "react"
// import {
//   Layout,
//   Typography,
//   Space,
//   Avatar,
//   Dropdown,
//   Menu,
//   Button,
//   Tooltip,
//   message,
// } from "antd"
// import { Link, useLocation, useNavigate } from "react-router-dom"
// import {
//   UserOutlined,
//   SettingOutlined,
//   LogoutOutlined,
//   QuestionCircleOutlined,
// } from "@ant-design/icons"
// import NotificationBell from "../notification/NotificationBell"
// import ThemeToggle from "../theme/ThemeToggle"
// import { useTheme } from "../theme/ThemeProvider"
// import { logout } from "../../api/auth"

// import { getTenantName, getTenantType , getUsername} from "../../utils/tokenUtils"
// import { fetchAndSaveTenantName } from "../../utils/tokenUtils";

// const { Header } = Layout
// const { Title } = Typography

// const HeaderComponent = () => {
//   const [tenantName, setTenantName] = useState(getTenantName())
//   const location = useLocation()
//   const navigate = useNavigate()
//   const { theme } = useTheme()
//   const token = localStorage.getItem("token")

//   const handleLogout = () => {
//     logout()
//     message.success("Logged out successfully")
//     navigate("/login")
//     setTimeout(() => window.location.reload(), 100)
//   }

//   useEffect(() => {
//     // Fetch and refresh tenantName if not set
//     if (!tenantName) {
//       fetchAndSaveTenantName().then(name => {
//         if (name) setTenantName(name)
//       })
//     }
//     // Listen to storage changes (optional, for multi-tab sync)
//     const onStorage = (e) => {
//       if (e.key === "tenantName") setTenantName(getTenantName())
//     }
//     window.addEventListener("storage", onStorage)
//     return () => window.removeEventListener("storage", onStorage)
//   }, [tenantName])

//   const getPageTitle = () => {
//     const path = location.pathname
//     if (path === "/") return "Home"
//     if (path === "/devices") return "Devices"
//     if (path === "/dashboards") return "Dashboards"
//     if (path.startsWith("/dashboards/")) return "Dashboard Editor"
//     if (path.startsWith("/customer-dashboard/")) return "Customer Dashboard"
//     if (path === "/rule-chains") return "Rule Chains"
//     if (path.startsWith("/rule-chains/")) return "Rule Chain Editor"
//     if (path === "/customers") return "Customers"
//     if (path === "/notification-center") return "Notification Center"
//     if (path === "/settings") return "Settings"
//     return "IoTMining"
//   }

//   const userMenu = (
//     <Menu
//       onClick={({ key }) => {
//         if (key === "logout") handleLogout()
//       }}
//       items={[
//         {
//           key: "profile",
//           icon: <UserOutlined />,
//           label: <Link to="/settings?tab=user">Profile</Link>,
//         },
//         {
//           key: "settings",
//           icon: <SettingOutlined />,
//           label: <Link to="/settings">Settings</Link>,
//         },
//         {
//           type: "divider",
//         },
//         {
//           key: "help",
//           icon: <QuestionCircleOutlined />,
//           label: "Help Center",
//         },
//         {
//           key: "logout",
//           icon: <LogoutOutlined />,
//           danger: true,
//           label: "Logout",
//         },
//       ]}
//     />
//   )

//   return (
//     <Header className="site-header" style={{
//       background: theme === "dark" ? "#11131a" : "#fff",
//       padding: "0 32px",
//       minHeight: 64,
//       display: "flex",
//       alignItems: "center",
//       justifyContent: "space-between",
//       borderBottom: theme === "dark" ? "1px solid #22232a" : "1px solid #e6e8ea",
//       zIndex: 1100, // push zIndex a bit more if you want
//       position: "sticky",
//       top: 0
//     }}>
//       <div className="header-title" style={{ display: "flex", alignItems: "center" }}>
//         <Title level={4} className="header-page-title" style={{ margin: 0, color: theme === "dark" ? "#fff" : "#1a233a" }}>
//           {getPageTitle()}
//         </Title>
//       </div>
//       <div className="header-actions">
//         <Space size="middle">
//           <ThemeToggle />
//           <NotificationBell token={token} />
//           <Tooltip title="Settings">
//             <Button
//               type="text"
//               icon={<SettingOutlined />}
//               onClick={() => navigate("/settings")}
//               className="header-icon-button"
//               style={{ fontSize: 20 }}
//             />
//           </Tooltip>
//           {/* <Dropdown
//             overlay={userMenu} // <-- Use overlay, NOT menu (older/newer AntD both support overlay)
//             placement="bottomRight"
//             arrow
//             getPopupContainer={() => document.body} // <-- this is what keeps it on top
//           >
//             <div className="user-dropdown" style={{ cursor: "pointer" }}>
//               <Space align="center" size={10}>
//                 <Avatar icon={<UserOutlined />} size={40} />
//                 <div className="user-info-text" style={{
//                   display: "flex", flexDirection: "column", minWidth: 80
//                 }}>
//                   <span className="user-name" style={{
//                     fontWeight: 500,
//                     fontSize: 15,
//                     color: theme === "dark" ? "#fff" : "#222",
//                     lineHeight: 1.2,
//                     maxWidth: 120,
//                     whiteSpace: "nowrap",
//                     textOverflow: "ellipsis",
//                     overflow: "hidden"
//                   }}>
//                     Admin User
//                   </span>
//                   <span className="user-role" style={{
//                     fontSize: 12,
//                     color: theme === "dark" ? "#c2cbe2" : "#888",
//                     lineHeight: 1.2,
//                     maxWidth: 120,
//                     whiteSpace: "nowrap",
//                     textOverflow: "ellipsis",
//                     overflow: "hidden"
//                   }}>
//                     Administrator
//                   </span>
//                 </div>
//               </Space>
//             </div>
//           </Dropdown> */}
//           <Dropdown
//           overlay={userMenu}
//           placement="bottomRight"
//           arrow
//           getPopupContainer={() => document.body}
//         >
//           <div className="user-dropdown" style={{ cursor: "pointer" }}>
//             <Space align="center" size={10}>
//               <Avatar icon={<UserOutlined />} size={40} />
//               <div className="user-info-text" style={{
//                 display: "flex", flexDirection: "column", minWidth: 80
//               }}>
//                 <span className="user-name" style={{
//                   fontWeight: 500,
//                   fontSize: 15,
//                   color: theme === "dark" ? "#fff" : "#222",
//                   lineHeight: 1.2,
//                   maxWidth: 140,
//                   whiteSpace: "nowrap",
//                   textOverflow: "ellipsis",
//                   overflow: "hidden"
//                 }}>
//                   {getTenantName()}
//                 </span>
//                 <span className="user-role" style={{
//                   fontSize: 12,
//                   color: theme === "dark" ? "#c2cbe2" : "#888",
//                   lineHeight: 1.2,
//                   maxWidth: 160,
//                   whiteSpace: "nowrap",
//                   textOverflow: "ellipsis",
//                   overflow: "hidden"
//                 }}>
//                   {getUsername()} &nbsp;|&nbsp; {getTenantType()}
//                 </span>
//               </div>
//             </Space>
//           </div>
//         </Dropdown>

//         </Space>
//       </div>
//     </Header>
//   )
// }

// export default HeaderComponent


// // "use client"

// // import { useState } from "react"
// // import {
// //   Layout,
// //   Typography,
// //   Space,
// //   Avatar,
// //   Dropdown,
// //   Menu,
// //   Button,
// //   Tooltip,
// //   message,
// // } from "antd"
// // import { Link, useLocation, useNavigate } from "react-router-dom"
// // import {
// //   UserOutlined,
// //   SettingOutlined,
// //   LogoutOutlined,
// //   QuestionCircleOutlined,
// // } from "@ant-design/icons"
// // import NotificationBell from "../notification/NotificationBell"
// // import ThemeToggle from "../theme/ThemeToggle"
// // import { useTheme } from "../theme/ThemeProvider"
// // import { logout } from "../../api/auth"

// // const { Header } = Layout
// // const { Title } = Typography

// // const HeaderComponent = () => {
// //   const location = useLocation()
// //   const navigate = useNavigate()
// //   const { theme } = useTheme()
// //   const [userMenuVisible, setUserMenuVisible] = useState(false)

// //   const token = localStorage.getItem("token")

// //   // const handleLogout = () => {
// //   //   AuthService.logout()
// //   //   message.success("Logged out successfully")
// //   //   navigate("/login")
// //   // }
// //   // const handleLogout = () => {
// //   //   AuthService.logout()
// //   //   message.success("Logged out successfully")
// //   //   navigate("/login")     // Or "/login", whichever is your login route!
// //   //   setTimeout(() => window.location.reload(), 100)  // Sometimes needed for full state reset
// //   // }
// //   const handleLogout = () => {
// //     logout()
// //     message.success("Logged out successfully")
// //     navigate("/login")
// //     setTimeout(() => window.location.reload(), 100)
// //   }

// //   const getPageTitle = () => {
// //     const path = location.pathname
// //     if (path === "/") return "Home"
// //     if (path === "/devices") return "Devices"
// //     if (path === "/dashboards") return "Dashboards"
// //     if (path.startsWith("/dashboards/")) return "Dashboard Editor"
// //     if (path.startsWith("/customer-dashboard/")) return "Customer Dashboard"
// //     if (path === "/rule-chains") return "Rule Chains"
// //     if (path.startsWith("/rule-chains/")) return "Rule Chain Editor"
// //     if (path === "/customers") return "Customers"
// //     if (path === "/notification-center") return "Notification Center"
// //     if (path === "/settings") return "Settings"
// //     return "IoTMining"
// //   }

// //   const userMenu = (
// //     <Menu
// //       onClick={({ key }) => {
// //         if (key === "logout") {
// //           handleLogout()
// //         }
// //       }}
// //       items={[
// //         {
// //           key: "profile",
// //           icon: <UserOutlined />,
// //           label: <Link to="/settings?tab=user">Profile</Link>,
// //         },
// //         {
// //           key: "settings",
// //           icon: <SettingOutlined />,
// //           label: <Link to="/settings">Settings</Link>,
// //         },
// //         {
// //           type: "divider",
// //         },
// //         {
// //           key: "help",
// //           icon: <QuestionCircleOutlined />,
// //           label: "Help Center",
// //         },
// //         {
// //           key: "logout",
// //           icon: <LogoutOutlined />,
// //           danger: true,
// //           label: "Logout",
// //         },
// //       ]}
// //     />
// //   )

// //   return (
// //     <Header className="site-header">
// //       <div className="header-title">
// //         <Title level={4} className="header-page-title" style={{ margin: 0 }}>
// //           {getPageTitle()}
// //         </Title>
// //       </div>
// //       <div className="header-actions">
// //         <Space size="middle">
// //           <ThemeToggle />
// //           <NotificationBell token={token} /> {/* ✅ Pass token here */}
// //           <Tooltip title="Settings">
// //             <Button
// //               type="text"
// //               icon={<SettingOutlined />}
// //               onClick={() => navigate("/settings")}
// //               className="header-icon-button"
// //             />
// //           </Tooltip>
// //           <Dropdown
// //             overlay={userMenu}
// //             trigger={["click"]}
// //             open={userMenuVisible}
// //             onOpenChange={setUserMenuVisible}
// //           >
// //             <div className="user-dropdown">
// //               <Space align="center">
// //                 <Avatar icon={<UserOutlined />} />
// //                 <div className="user-info">
// //                   <div className="user-name">Admin User</div>
// //                   <div className="user-role">Administrator</div>
// //                 </div>
// //               </Space>
// //             </div>
// //           </Dropdown>
// //         </Space>
// //       </div>
// //     </Header>
// //   )
// // }

// // export default HeaderComponent
