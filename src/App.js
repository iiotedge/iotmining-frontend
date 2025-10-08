import { ConfigProvider, Layout } from "antd"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import SideNavigation from "./components/layout/SideNavigation"
import HeaderComponent from "./components/layout/HeaderComponent"
import DevicesPage from "./pages/DevicesPage"
import StaticHomePage from "./pages/HomePage"
import ReportsPage from "./pages/ReportsPage"
import SuperAdminPage from "./pages/SuperAdminPage"
import SupportPage from "./pages/SupportPage"
import SupportChatPage from "./pages/SupportChatPage"
import AIQueryPage from "./pages/AIQueryPage"
import HomePage from "./pages/DynamicHomePage"
import HomePage2 from "./pages/DynamicHomePage2"
import RuleChainPage from "./pages/RuleChainPage"
import CustomerDashboardPage from "./pages/CustomerDashboardPage"
import CustomersPage from "./pages/CustomersPage"
import RuleChainEditor from "./components/rule-chain/RuleChainEditor"
import DashboardsPage from "./pages/DashboardsPage"
import DashboardEditor from "./pages/DashboardEditor"
import DeviceProfilesPage from "./pages/DeviceProfilesPage"
import NotificationCenterPage from "./pages/NotificationCenterPage"
import SettingsPage from "./pages/SettingsPage"
import "./styles/global.css"
import "./styles/rule-chain.css"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"



// import "./styles/dashboard.css"
// import "./styles/global-dashboard.css"
import AuthPage from "./pages/AuthPage"
import { useMediaQuery } from "./hooks/useMediaQuery"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import RoleProtectedRoute from "./components/auth/RoleProtectedRoute"
import UnauthorizedPage from "./pages/UnauthorizedPage"
import ThemeProvider from "./components/theme/ThemeProvider"
import { MqttProvider } from "./services/MqttProvider"
import { useState } from "react"

const AppLayout = ({ children }) => {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar (drawer on mobile, full on desktop) */}
      <SideNavigation mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <Layout>
        {/* Header with hamburger inside (mobile only) */}
        <HeaderComponent onMobileMenuOpen={() => setMobileOpen(true)} />
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
        <MqttProvider>
          <Router>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              <Route
                path="*"
                element={
                  // <ProtectedRoute>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<StaticHomePage />} />
                        <Route path="/alarms" element={<HomePage2 />} />
                        <Route path="/devices" element={<DevicesPage />} />
                        <Route path="/device-profiles" element={<DeviceProfilesPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/customer-dashboard/:id" element={<CustomerDashboardPage />} />

                        <Route path="/system-logs-monitoring" element={<SuperAdminPage />} />
                        <Route element={<RoleProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_SUPER_ADMIN"]} />}>
                          <Route path="/dashboards" element={<DashboardsPage />} />
                          <Route path="/dashboards/:id" element={
                            <DashboardEditor />
                          } />
                        </Route>

                        <Route element={<RoleProtectedRoute allowedRoles={["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]} />}>
                          <Route path="/rule-chains" element={<RuleChainPage />} />
                          <Route path="/rule-chains/:id" element={<RuleChainEditor />} />
                          <Route path="/customers" element={<CustomersPage />} />
                        </Route>

                        <Route path="/notification-center" element={<NotificationCenterPage />} />
                        <Route path="*" element={<HomePage />} />
                        <Route path="/ai-query" element={<AIQueryPage />} />
                        <Route path="/support" element={<SupportPage />} />
                                  {/* Support chat page without sidebar */}
                        <Route path="/support/ticket/:ticketId" element={<SupportChatPage />} />

                        <Route path="/settings" element={<SettingsPage />} />
                      </Routes>
                    </AppLayout>
                  // </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </MqttProvider>
      </ThemeProvider>
    </ConfigProvider>
  )
}

export default App

