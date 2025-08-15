import { ConfigProvider, Layout } from "antd"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import SideNavigation from "./components/layout/SideNavigation"
import HeaderComponent from "./components/layout/HeaderComponent"
import DevicesPage from "./pages/DevicesPage"
import HomePage from "./pages/DynamicHomePage"
import RuleChainPage from "./pages/RuleChainPage"
import CustomerDashboardPage from "./pages/CustomerDashboardPage"
import CustomersPage from "./pages/CustomersPage"
import RuleChainEditor from "./components/rule-chain/RuleChainEditor"
import DashboardsPage from "./pages/DashboardsPage"
import DashboardEditor from "./pages/DashboardEditor"
import DeviceProfilesPage from "./pages/DeviceProfilesPage"
import NotificationCenterPage from "./pages/NotificationCenterPage"
import SettingsPage from "./pages/SettingsPage"
// import "./styles/global.css"
import "./styles/rule-chain.css"
// import "./styles/dashboard.css"
import AuthPage from "./pages/AuthPage"
import { useMediaQuery } from "./hooks/useMediaQuery"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import RoleProtectedRoute from "./components/auth/RoleProtectedRoute"
import UnauthorizedPage from "./pages/UnauthorizedPage"
import ThemeProvider from "./components/theme/ThemeProvider"
import { MqttProvider } from "./services/MqttProvider"


const AppLayout = ({ children }) => {
  const isMobile = useMediaQuery("(max-width: 768px)")

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <SideNavigation />
      <Layout>
        <HeaderComponent />
        <Layout.Content className="site-content">{children}</Layout.Content>
      </Layout>
    </Layout>
  )
}

const App = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#304269",
          borderRadius: 4,
        },
        breakpoints: {
          xs: "480px",
          sm: "576px",
          md: "768px",
          lg: "992px",
          xl: "1200px",
          xxl: "1600px",
        },
      }}
    >
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/devices" element={<DevicesPage />} />
                      <Route path="/device-profiles" element={<DeviceProfilesPage />} />
                      <Route path="/customer-dashboard/:id" element={<CustomerDashboardPage />} />

                      <Route element={<RoleProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_SUPER_ADMIN"]} />}>
                        <Route path="/dashboards" element={<MqttProvider> <DashboardsPage /> </MqttProvider>} />
                        <Route path="/dashboards/:id" element={
                          <MqttProvider>
                             <DashboardsPage />
                        </MqttProvider>} />
                      </Route>

                      <Route element={<RoleProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_SUPER_ADMIN"]} />}>
                        <Route path="/rule-chains" element={<RuleChainPage />} />
                        <Route path="/rule-chains/:id" element={<RuleChainEditor />} />
                        <Route path="/customers" element={<CustomersPage />} />
                      </Route>

                      <Route path="/notification-center" element={<NotificationCenterPage />} />
                      <Route path="*" element={<HomePage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </ConfigProvider>
  )
}

export default App



// import { ConfigProvider, Layout } from "antd"
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
// import SideNavigation from "./components/layout/SideNavigation"
// import HeaderComponent from "./components/layout/HeaderComponent"
// import DevicesPage from "./pages/DevicesPage"
// import HomePage from "./pages/HomePage"
// import RuleChainPage from "./pages/RuleChainPage"
// import RuleChainEditor from "./components/rule-chain/RuleChainEditor"
// import DashboardsPage from "./pages/DashboardsPage"
// import DashboardEditor from "./pages/DashboardEditor"
// import DeviceProfilesPage from "./pages/DeviceProfilesPage"
// import CustomersPage from "./pages/CustomersPage"
// import NotificationCenterPage from "./pages/NotificationCenterPage"
// import AuthPage from "./pages/AuthPage"
// import "./styles/global.css"
// import "./styles/rule-chain.css"
// import "./styles/dashboard.css"
// import "./styles/auth.css"
// import "./styles/responsive.css"
// import "./styles/settings.css"
// import { useMediaQuery } from "./hooks/useMediaQuery"

// const AppLayout = ({ children }) => {
//   const isMobile = useMediaQuery("(max-width: 768px)")

//   return (
//     <Layout style={{ minHeight: "100vh" }}>
//       <SideNavigation />
//       <Layout>
//         <HeaderComponent />
//         <Layout.Content className="site-content">{children}</Layout.Content>
//       </Layout>
//     </Layout>
//   )
// }

// const App = () => {
//   return (
//     <ConfigProvider
//       theme={{
//         token: {
//           colorPrimary: "#304269",
//           borderRadius: 4,
//         },
//         // Add responsive breakpoints
//         breakpoints: {
//           xs: "480px",
//           sm: "576px",
//           md: "768px",
//           lg: "992px",
//           xl: "1200px",
//           xxl: "1600px",
//         },
//       }}
//     >
//       <Router>
//         <Routes>
//           <Route path="/auth" element={<AuthPage />} />
//           <Route
//             path="*"
//             element={
//               <AppLayout>
//                 <Routes>
//                   <Route path="/" element={<HomePage />} />
//                   <Route path="/devices" element={<DevicesPage />} />
//                   <Route path="/dashboards" element={<DashboardsPage />} />
//                   <Route path="/dashboards/:id" element={<DashboardEditor />} />
//                   <Route path="/device-profiles" element={<DeviceProfilesPage />} />
//                   <Route path="/rule-chains" element={<RuleChainPage />} />
//                   <Route path="/rule-chains/:id" element={<RuleChainEditor />} />
//                   <Route path="/customers" element={<CustomersPage />} />
//                   <Route path="/notification-center" element={<NotificationCenterPage />} />
//                   <Route path="*" element={<HomePage />} />
//                 </Routes>
//               </AppLayout>
//             }
//           />
//         </Routes>
//       </Router>
//     </ConfigProvider>
//   )
// }

// export default App