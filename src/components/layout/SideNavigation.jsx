"use client"

import { useState, useEffect, useMemo } from "react"
import { Layout, Menu, Button, Drawer, Tooltip } from "antd"
import { Link, useLocation } from "react-router-dom"
import {
  HomeOutlined,
  AlertOutlined,
  FileTextOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  SettingOutlined,
  TeamOutlined,
  NodeIndexOutlined,
  NotificationOutlined,
  ProfileOutlined,
  CloseOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SafetyCertificateOutlined,
  CustomerServiceOutlined,
  RobotOutlined
} from "@ant-design/icons"
import logo from "../../assets/iotmining-logo.png"
import full_logo from "../../assets/iotmining-logo-full.png"
import { useMediaQuery } from "../../hooks/useMediaQuery"
import { jwtDecode } from "jwt-decode"
import { useTheme } from "../theme/ThemeProvider"

const { Sider } = Layout

// Accept mobileOpen + setMobileOpen from Header/AppLayout
const SideNavigation = ({ mobileOpen, setMobileOpen }) => {
  const { isDarkMode, semantic } = useTheme()
  const themeColors = semantic || {
    elevated: isDarkMode ? "#171717" : "#fafbfc",
    surface: isDarkMode ? "#101010" : "#ffffff",
    text: isDarkMode ? "#ffffff" : "#1d1d1d",
    border: isDarkMode ? "#23232a" : "#eeeeee",
    mask: isDarkMode ? "rgba(0,0,0,0.78)" : "rgba(0,0,0,0.10)",
  }

  const [collapsed, setCollapsed] = useState(true)
  const [roles, setRoles] = useState([])
  const location = useLocation()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isTablet = useMediaQuery("(max-width: 992px)")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      try {
        const decoded = jwtDecode(token)
        const userRoles = decoded.role || decoded.roles || []
        setRoles(Array.isArray(userRoles) ? userRoles : [userRoles])
      } catch (err) {
        console.error("Failed to decode token", err)
      }
    }
  }, [])

  const hasRole = (allowedRoles = []) => roles.some(r => allowedRoles.includes(r))

  useEffect(() => {
    // keep collapsed by default on non‑mobile (your original behavior)
    setCollapsed(true)
  }, [isTablet, isMobile])

  // Colors synced with theme
  const sidebarBg = themeColors.surface
  const menuTheme = isDarkMode ? "dark" : "light"
  const menuBg = themeColors.surface
  const menuTextColor = themeColors.text
  const borderColor = themeColors.border

  // Selected key from path
  const selectedKey = location.pathname.split("/")[1] || "home"

  const menuItems = useMemo(
    () =>
      [
        { key: "home", icon: <HomeOutlined />, label: <Link to="/">Home</Link> },
        { key: "alarms", icon: <AlertOutlined />, label: <Link to="/alarms">Alarms</Link> },
        { key: "reports", icon: <FileTextOutlined />, label: <Link to="/reports">Reports</Link> }, //FileTextOutlined
        hasRole(["ROLE_ADMIN", "ROLE_MANAGER"]) && {
          key: "dashboards",
          icon: <DashboardOutlined />,
          label: <Link to="/dashboards">Dashboards</Link>,
        },
        hasRole(["ROLE_ADMIN", "ROLE_SUPPORT"]) && {
          key: "notification",
          icon: <NotificationOutlined />,
          label: <Link to="/notification-center">Notification</Link>,
        },
        {
          key: "entities",
          icon: <AppstoreOutlined />,
          label: "Entities",
          children: [{ key: "devices", label: <Link to="/devices">Devices</Link> }],
        },
        {
          key: "profiles",
          icon: <ProfileOutlined />,
          label: "Profiles",
          children: [
            { key: "device-profiles", label: <Link to="/device-profiles">Device profiles</Link> },
            { key: "asset-profiles", label: <Link to="/asset-profiles">Asset profiles</Link> },
          ],
        },
        { key: "system-logs-monitoring", icon: <SafetyCertificateOutlined />, label: <Link to="/system-logs-monitoring">System Logs & Monitoring</Link> }, //FileTextOutlined
        hasRole(["ROLE_ADMIN"]) && {
          key: "customers",
          icon: <TeamOutlined />,
          label: <Link to="/customers">Customers</Link>,
        },
        { key: "ai-query", icon: <RobotOutlined />, label: <Link to="/ai-query">AI Query</Link> },
        { key: "rule-chains", icon: <NodeIndexOutlined />, label: <Link to="/rule-chains">Rule chains</Link> },
        { key: "support", icon: <CustomerServiceOutlined />, label: <Link to="/support">Support</Link> },
        { key: "settings", icon: <SettingOutlined />, label: <Link to="/settings">Settings</Link> },
      ].filter(Boolean),
    [roles]
  )

  // MOBILE: only the Drawer (hamburger lives in Header, so nothing else here)
  if (isMobile) {
    return (
      <Drawer
        placement="left"
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        width={280}
        bodyStyle={{ padding: 0, background: menuBg }}
        headerStyle={{
          padding: "12px 16px",
          borderBottom: "none", // no harsh line
          background: menuBg,
        }}
        styles={{
          mask: { background: themeColors.mask },
          body: { background: menuBg },
          header: { background: menuBg },
        }}
        zIndex={2001}       // above header (header zIndex ~1100)
        closable={false}    // <-- IMPORTANT: avoid double close icon
        title={
          <div style={{ display: "flex", alignItems: "center", lineHeight: 0 }}>
            <img src={logo} alt="IoT Edge" style={{ width: 24, height: 24 }} />
            <span style={{ color: menuTextColor, marginLeft: 8, fontWeight: 600 }}>IoT Edge</span>
            <Button
              icon={<CloseOutlined />}
              onClick={() => setMobileOpen(false)}
              type="text"
              style={{ marginLeft: "auto", color: menuTextColor }}
              aria-label="Close menu"
            />
          </div>
        }
      >
        <Menu
          theme={menuTheme}
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={["entities", "profiles"]}
          items={menuItems}
          onClick={() => setMobileOpen(false)}
          style={{
            background: menuBg,
            color: menuTextColor,
            borderRight: 0,
            minHeight: "100%",
          }}
        />
      </Drawer>
    )
  }

  // DESKTOP: full sidebar, collapser pinned bottom
  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={220}
      collapsedWidth={80}
      className={`desktop-sidebar${isDarkMode ? " dark-theme" : ""}`}
      theme={menuTheme}
      trigger={null} // custom collapser at bottom
      style={{
        position: "sticky",
        top: 0,
        left: 0,
        height: "100dvh",
        background: sidebarBg,
        
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo/Header — clean (no border), no stray SVG */}
      <div
        className="logo-container"
        style={{
          display: "flex",
          alignItems: "center",
          background: sidebarBg,
          padding: "12px",
          minHeight: 56,
          lineHeight: 0,
        }}
      >
        {collapsed ? (
          <img src={logo} alt="IoT Edge" style={{ width: 28, height: 28 }} />
        ) : (
          <img src={full_logo} alt="IoT Edge" style={{ height: 26 }} />
        )}
      </div>

      {/* Menu pushes collapser down */}
      <Menu
        theme={menuTheme}
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={["entities", "profiles"]}
        items={menuItems}
        style={{
          background: menuBg,
          color: menuTextColor,
          borderRight: 0,
          padding: "8px 0",
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          borderRight: `1px solid ${borderColor}`,
        }}
      />

      {/* Bottom collapser */}
      <div
        style={{
          background: sidebarBg,
          padding: collapsed ? "8px 8px" : "8px 12px",
          borderTop: `1px solid ${borderColor}`,
        }}
      >
        <Tooltip title={collapsed ? "Expand" : "Collapse"} placement="right">
          <Button
            type="text"
            onClick={() => setCollapsed(!collapsed)}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            style={{
              color: menuTextColor,
              width: "100%",
              textAlign: "left",
              height: 40,
            }}
          >
            {!collapsed && "Collapse"}
          </Button>
        </Tooltip>
      </div>
    </Sider>
  )
}

export default SideNavigation



// "use client"

// import { useState, useEffect } from "react"
// import { Layout, Menu, Button, Drawer } from "antd"
// import { Link, useLocation } from "react-router-dom"
// import {
//   HomeOutlined,
//   AlertOutlined,
//   DashboardOutlined,
//   AppstoreOutlined,
//   ApiOutlined,
//   SettingOutlined,
//   TeamOutlined,
//   NodeIndexOutlined,
//   CloudServerOutlined,
//   ToolOutlined,
//   FolderOutlined,
//   AppstoreAddOutlined,
//   PictureOutlined,
//   CodeOutlined,
//   CodeSandboxOutlined,
//   MenuOutlined,
//   CloseOutlined,
//   NotificationOutlined,
//   ProfileOutlined,
// } from "@ant-design/icons"
// import logo from "../../assets/iotmining-logo.png"
// import full_logo from "../../assets/iotmining-logo-full.png"
// import { useMediaQuery } from "../../hooks/useMediaQuery"
// import { jwtDecode } from "jwt-decode"
// import { useTheme } from "../theme/ThemeProvider" // ← Add this!

// const { Sider } = Layout

// const SideNavigation = () => {
//   const { isDarkMode } = useTheme() // ← Get current theme
//   const [collapsed, setCollapsed] = useState(true)
//   const [mobileOpen, setMobileOpen] = useState(false)
//   const [roles, setRoles] = useState([])
//   const location = useLocation()
//   const isMobile = useMediaQuery("(max-width: 768px)")
//   const isTablet = useMediaQuery("(max-width: 992px)")

//   useEffect(() => {
//     const token = localStorage.getItem("token")
//     if (token) {
//       try {
//         const decoded = jwtDecode(token)
//         const userRoles = decoded.role || decoded.roles || []
//         setRoles(Array.isArray(userRoles) ? userRoles : [userRoles])
//       } catch (err) {
//         console.error("Failed to decode token", err)
//       }
//     }
//   }, [])

//   const hasRole = (allowedRoles) => roles.some((r) => allowedRoles.includes(r))

//   useEffect(() => {
//     if (isTablet && !isMobile) {
//       setCollapsed(true)
//     } else if (!isTablet) {
//       setCollapsed(true) // keep it closed always unless mobile
//     }
//   }, [isTablet, isMobile])

//   const menuItems = [
//     {
//       key: "home",
//       icon: <HomeOutlined />,
//       label: <Link to="/">Home</Link>,
//     },
//     {
//       key: "alarms",
//       icon: <AlertOutlined />,
//       label: <Link to="/alarms">Alarms</Link>,
//     },
//     hasRole(["ROLE_ADMIN", "ROLE_MANAGER"]) && {
//       key: "dashboards",
//       icon: <DashboardOutlined />,
//       label: <Link to="/dashboards">Dashboards</Link>,
//     },
//     hasRole(["ROLE_ADMIN", "ROLE_SUPPORT"]) && {
//       key: "notification",
//       icon: <NotificationOutlined />,
//       label: <Link to="/notification-center">Notification</Link>,
//     },
//     {
//       key: "entities",
//       icon: <AppstoreOutlined />,
//       label: "Entities",
//       children: [
//         {
//           key: "devices",
//           label: <Link to="/devices">Devices</Link>,
//         },
//       ],
//     },
//     {
//       key: "profiles",
//       icon: <ProfileOutlined />,
//       label: "Profiles",
//       children: [
//         {
//           key: "device-profiles",
//           label: <Link to="/device-profiles">Device profiles</Link>,
//         },
//         {
//           key: "asset-profiles",
//           label: <Link to="/asset-profiles">Asset profiles</Link>,
//         },
//       ],
//     },
//     hasRole(["ROLE_ADMIN"]) && {
//       key: "customers",
//       icon: <TeamOutlined />,
//       label: <Link to="/customers">Customers</Link>,
//     },
//     {
//       key: "rule-chains",
//       icon: <NodeIndexOutlined />,
//       label: <Link to="/rule-chains">Rule chains</Link>,
//     },
//     {
//       key: "settings",
//       icon: <SettingOutlined />,
//       label: <Link to="/settings">Settings</Link>,
//     },
//   ].filter(Boolean)

//   // Pick colors for theme
//   const sidebarBg = isDarkMode ? "#18181c" : "#fff"
//   const menuTheme = isDarkMode ? "dark" : "light"
//   const menuBg = isDarkMode ? "#18181c" : "#fff"
//   const menuTextColor = isDarkMode ? "#f0f0f0" : "#222"

//   const renderMobileMenu = () => (
//     <>
//       <Button
//         icon={<MenuOutlined />}
//         onClick={() => setMobileOpen(true)}
//         className="mobile-menu-trigger"
//         type="text"
//         size="large"
//         style={{
//           color: isDarkMode ? "#eee" : "#111",
//         }}
//       />

//       <Drawer
//         title={
//           <div className="mobile-logo-container" style={{ display: "flex", alignItems: "center" }}>
//             <img src={logo || "/iotmining-logo.png"} alt="IoT Edge" className="logo" />
//             <span className="logo-text" style={{ color: menuTextColor, marginLeft: 8 }}>IoT Edge</span>
//             <Button
//               icon={<CloseOutlined />}
//               onClick={() => setMobileOpen(false)}
//               className="mobile-menu-close"
//               type="text"
//               style={{ marginLeft: "auto", color: menuTextColor }}
//             />
//           </div>
//         }
//         placement="left"
//         onClose={() => setMobileOpen(false)}
//         open={mobileOpen}
//         width={280}
//         bodyStyle={{ padding: 0, background: menuBg }}
//         headerStyle={{
//           padding: "12px 16px",
//           borderBottom: isDarkMode ? "1px solid #222" : "1px solid rgba(0,0,0,0.06)",
//           background: menuBg,
//         }}
//         className={`mobile-menu-drawer${isDarkMode ? " dark-theme" : ""}`}
//       >
//         <Menu
//           theme={menuTheme}
//           mode="inline"
//           selectedKeys={[location.pathname.split("/")[1] || "home"]}
//           defaultOpenKeys={["entities", "profiles", "resources"]}
//           items={menuItems}
//           onClick={() => setMobileOpen(false)}
//           style={{
//             background: menuBg,
//             color: menuTextColor,
//             borderRight: 0,
//             minHeight: "100vh",
//           }}
//         />
//       </Drawer>
//     </>
//   )

//   const renderDesktopSidebar = () => (
//     <Sider
//       collapsible
//       collapsed={collapsed}
//       onCollapse={setCollapsed}
//       style={{
//         overflow: "auto",
//         // height: "100vh",
//         position: "sticky",
//         top: 0,
//         left: 0,
//         background: sidebarBg,
//         transition: "background 0.2s",
//         borderRight: isDarkMode ? "1px solid #23232a" : "1px solid #eee",
//       }}
//       width={220}
//       collapsedWidth={80}
//       className={`desktop-sidebar${isDarkMode ? " dark-theme" : ""}`}
//     >
//       <div className="logo-container" style={{
//         display: "flex",
//         alignItems: "center",
//         // padding: isDarkMode ? "16px 16px 12px 16px" : "16px 16px 12px 16px",
//         background: sidebarBg,
//         borderBottom: isDarkMode ? "1px solid #23232a" : "1px solid #eee"
//       }}>
//         {collapsed && <span> <img src={logo || "/iotmining-logo.png"} alt="IoT Edge" className="logo" /></span> }
//         {!collapsed && <span> <img src={full_logo || "/iotmining-logo.png"} alt="IoT Edge" className="logo" /></span> }
//         {/* {!collapsed && <span className="logo-text" style={{ color: menuTextColor, marginLeft: 8 }}>IoTMining</span>} */}
//       </div>
//       <Menu
//         theme={menuTheme}
//         mode="inline"
//         selectedKeys={[location.pathname.split("/")[1] || "home"]}
//         defaultOpenKeys={["entities", "profiles", "resources"]}
//         style={{
//           background: menuBg,
//           color: menuTextColor,
//           borderRight: 0,
//           minHeight: "100vh",
//         }}
//         items={menuItems}
//       />
//     </Sider>
//   )

//   return <>{isMobile ? renderMobileMenu() : renderDesktopSidebar()}</>
// }

// export default SideNavigation


// // "use client"

// // import { useState, useEffect } from "react"
// // import { Layout, Menu, Button, Drawer } from "antd"
// // import { Link, useLocation } from "react-router-dom"
// // import {
// //   HomeOutlined,
// //   AlertOutlined,
// //   DashboardOutlined,
// //   AppstoreOutlined,
// //   ApiOutlined,
// //   SettingOutlined,
// //   TeamOutlined,
// //   NodeIndexOutlined,
// //   CloudServerOutlined,
// //   ToolOutlined,
// //   FolderOutlined,
// //   AppstoreAddOutlined,
// //   PictureOutlined,
// //   CodeOutlined,
// //   CodeSandboxOutlined,
// //   MenuOutlined,
// //   CloseOutlined,
// //   NotificationOutlined,
// //   ProfileOutlined,
// // } from "@ant-design/icons"
// // import logo from "../../assets/iotmining-logo.svg"
// // import { useMediaQuery } from "../../hooks/useMediaQuery"
// // import { jwtDecode } from "jwt-decode"

// // const { Sider } = Layout

// // const SideNavigation = () => {
// //   const [collapsed, setCollapsed] = useState(false)
// //   const [mobileOpen, setMobileOpen] = useState(false)
// //   const [roles, setRoles] = useState([])
// //   const location = useLocation()
// //   const isMobile = useMediaQuery("(max-width: 768px)")
// //   const isTablet = useMediaQuery("(max-width: 992px)")

// //   useEffect(() => {
// //     const token = localStorage.getItem("token")
// //     if (token) {
// //       try {
// //         const decoded = jwtDecode(token)
// //         const userRoles = decoded.role || decoded.roles || []
// //         setRoles(Array.isArray(userRoles) ? userRoles : [userRoles])
// //       } catch (err) {
// //         console.error("Failed to decode token", err)
// //       }
// //     }
// //   }, [])

// //   const hasRole = (allowedRoles) => roles.some((r) => allowedRoles.includes(r))

// //   useEffect(() => {
// //     if (isTablet && !isMobile) {
// //       setCollapsed(true)
// //     } else if (!isTablet) {
// //       setCollapsed(false)
// //     }
// //   }, [isTablet, isMobile])

// //   const menuItems = [
// //     {
// //       key: "home",
// //       icon: <HomeOutlined />,
// //       label: <Link to="/">Home</Link>,
// //     },
// //     {
// //       key: "alarms",
// //       icon: <AlertOutlined />,
// //       label: <Link to="/alarms">Alarms</Link>,
// //     },
// //     hasRole(["ROLE_ADMIN", "ROLE_MANAGER"]) && {
// //       key: "dashboards",
// //       icon: <DashboardOutlined />,
// //       label: <Link to="/dashboards">Dashboards</Link>,
// //     },
// //     hasRole(["ROLE_ADMIN", "ROLE_SUPPORT"]) && {
// //       key: "notification",
// //       icon: <NotificationOutlined />,
// //       label: <Link to="/notification-center">Notification</Link>,
// //     },
// //     {
// //       key: "entities",
// //       icon: <AppstoreOutlined />,
// //       label: "Entities",
// //       children: [
// //         {
// //           key: "devices",
// //           label: <Link to="/devices">Devices</Link>,
// //         },
// //       ],
// //     },
// //     // {
// //     //   key: "assets",
// //     //   icon: <ApiOutlined />,
// //     //   label: <Link to="/assets">Assets</Link>,
// //     // },
// //     // {
// //     //   key: "entity-views",
// //     //   icon: <AppstoreOutlined />,
// //     //   label: <Link to="/entity-views">Entity views</Link>,
// //     // },
// //     // {
// //     //   key: "gateways",
// //     //   icon: <CloudServerOutlined />,
// //     //   label: <Link to="/gateways">Gateways</Link>,
// //     // },
// //     {
// //       key: "profiles",
// //       icon: <ProfileOutlined />,
// //       label: "Profiles",
// //       children: [
// //         {
// //           key: "device-profiles",
// //           label: <Link to="/device-profiles">Device profiles</Link>,
// //         },
// //         {
// //           key: "asset-profiles",
// //           label: <Link to="/asset-profiles">Asset profiles</Link>,
// //         },
// //       ],
// //     },
// //     hasRole(["ROLE_ADMIN"]) && {
// //       key: "customers",
// //       icon: <TeamOutlined />,
// //       label: <Link to="/customers">Customers</Link>,
// //     },
// //     {
// //       key: "rule-chains",
// //       icon: <NodeIndexOutlined />,
// //       label: <Link to="/rule-chains">Rule chains</Link>,
// //     },
// //     // {
// //     //   key: "edge-management",
// //     //   icon: <CloudServerOutlined />,
// //     //   label: "Edge management",
// //     // },
// //     // {
// //     //   key: "advanced-features",
// //     //   icon: <ToolOutlined />,
// //     //   label: "Advanced features",
// //     // },
// //     // {
// //     //   key: "resources",
// //     //   icon: <FolderOutlined />,
// //     //   label: "Resources",
// //     //   children: [
// //     //     {
// //     //       key: "widgets-library",
// //     //       icon: <AppstoreAddOutlined />,
// //     //       label: <Link to="/widgets-library">Widgets library</Link>,
// //     //     },
// //     //     {
// //     //       key: "image-gallery",
// //     //       icon: <PictureOutlined />,
// //     //       label: <Link to="/image-gallery">Image gallery</Link>,
// //     //     },
// //     //     {
// //     //       key: "scada-symbols",
// //     //       icon: <CodeSandboxOutlined />,
// //     //       label: <Link to="/scada-symbols">SCADA symbols</Link>,
// //     //     },
// //     //     {
// //     //       key: "javascript-library",
// //     //       icon: <CodeOutlined />,
// //     //       label: <Link to="/javascript-library">JavaScript library</Link>,
// //     //     },
// //     //   ],
// //     // },
// //     {
// //       key: "settings",
// //       icon: <SettingOutlined />,
// //       label: <Link to="/settings">Settings</Link>,
// //     },
// //   ].filter(Boolean)

// //   const renderMobileMenu = () => (
// //     <>
// //       <Button
// //         icon={<MenuOutlined />}
// //         onClick={() => setMobileOpen(true)}
// //         className="mobile-menu-trigger"
// //         type="text"
// //         size="large"
// //       />

// //       <Drawer
// //         title={
// //           <div className="mobile-logo-container">
// //             <img src={logo || "/iotmining-logo.svg"} alt="IoT Edge" className="logo" />
// //             <span className="logo-text">IoT Edge</span>
// //             <Button
// //               icon={<CloseOutlined />}
// //               onClick={() => setMobileOpen(false)}
// //               className="mobile-menu-close"
// //               type="text"
// //             />
// //           </div>
// //         }
// //         placement="left"
// //         onClose={() => setMobileOpen(false)}
// //         open={mobileOpen}
// //         width={280}
// //         bodyStyle={{ padding: 0 }}
// //         headerStyle={{ padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
// //         className="mobile-menu-drawer"
// //       >
// //         <Menu
// //           theme="light"
// //           mode="inline"
// //           selectedKeys={[location.pathname.split("/")[1] || "home"]}
// //           defaultOpenKeys={["entities", "profiles", "resources"]}
// //           items={menuItems}
// //           onClick={() => setMobileOpen(false)}
// //         />
// //       </Drawer>
// //     </>
// //   )

// //   const renderDesktopSidebar = () => (
// //     <Sider
// //       collapsible
// //       collapsed={collapsed}
// //       onCollapse={setCollapsed}
// //       style={{
// //         overflow: "auto",
// //         height: "100vh",
// //         position: "sticky",
// //         top: 0,
// //         left: 0,
// //         backgroundColor: "black",
// //       }}
// //       width={220}
// //       collapsedWidth={80}
// //       className="desktop-sidebar"
// //     >
// //       <div className="logo-container">
// //         <img src={logo || "/iotmining-logo.svg"} alt="IoT Edge" className="logo" />
// //         {!collapsed && <span className="logo-text">IoTMining</span>}
// //       </div>
// //       <Menu
// //         theme="dark"
// //         mode="inline"
// //         selectedKeys={[location.pathname.split("/")[1] || "home"]}
// //         defaultOpenKeys={["entities", "profiles", "resources"]}
// //         style={{ backgroundColor: "black" }}
// //         items={menuItems}
// //       />
// //     </Sider>
// //   )

// //   return <>{isMobile ? renderMobileMenu() : renderDesktopSidebar()}</>
// // }

// // export default SideNavigation
