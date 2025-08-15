"use client"

import { useState, useContext, useEffect } from "react"
import { ThemeContext } from "../theme/ThemeProvider"
import { Save, Search, Check, Home } from "lucide-react"
import { message, Switch, Tooltip } from "antd"

const CustomerDefaultDashboard = () => {
  const { theme } = useContext(ThemeContext)
  const [customers, setCustomers] = useState([])
  const [dashboards, setDashboards] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [defaultHomePage, setDefaultHomePage] = useState({})

  useEffect(() => {
    const mockCustomers = [
      { id: "c1", name: "Acme Corporation", defaultDashboardId: "d2", isDefaultHomePage: true },
      { id: "c2", name: "TechSolutions Inc.", defaultDashboardId: "d1", isDefaultHomePage: false },
      { id: "c3", name: "Global Industries", defaultDashboardId: null, isDefaultHomePage: false },
      { id: "c4", name: "Smart Systems", defaultDashboardId: "d3", isDefaultHomePage: false },
      { id: "c5", name: "Connected Devices Ltd.", defaultDashboardId: null, isDefaultHomePage: false },
    ]

    const mockDashboards = [
      { id: "d1", title: "Operations Overview" },
      { id: "d2", title: "Device Monitoring" },
      { id: "d3", title: "Energy Consumption" },
      { id: "d4", title: "Security Dashboard" },
      { id: "d5", title: "Maintenance Tracker" },
    ]

    setCustomers(mockCustomers)
    setDashboards(mockDashboards)

    // Initialize default home page settings
    const initialDefaultHomePage = {}
    mockCustomers.forEach((customer) => {
      initialDefaultHomePage[customer.id] = customer.isDefaultHomePage
    })
    setDefaultHomePage(initialDefaultHomePage)

    setLoading(false)
  }, [])

  const assignDashboard = (customerId, dashboardId) => {
    setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...c, defaultDashboardId: dashboardId } : c)))
  }

  const toggleDefaultHomePage = (customerId) => {
    // Only one customer can have default home page set to true
    if (!defaultHomePage[customerId]) {
      const newDefaultHomePage = {}
      Object.keys(defaultHomePage).forEach((id) => {
        newDefaultHomePage[id] = id === customerId
      })
      setDefaultHomePage(newDefaultHomePage)

      // Update customers list to reflect the change
      setCustomers((prev) =>
        prev.map((c) => ({
          ...c,
          isDefaultHomePage: c.id === customerId,
        })),
      )
    }
  }

  const saveChanges = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSuccessMessage("Default dashboards updated successfully")
      message.success("Default dashboards updated successfully")
      setTimeout(() => setSuccessMessage(""), 3000)
    }, 1000)
  }

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className={`customer-default-dashboard ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Customer Default Dashboards</h2>
        <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
          Assign default dashboards to customers. These dashboards will be shown when customers log in. You can also set
          one customer's dashboard as the default home page for all users.
        </p>
      </div>

      {successMessage && (
        <div
          className={`mb-4 p-3 rounded-md ${
            theme === "dark" ? "bg-green-900/30 text-green-300" : "bg-green-50 text-green-600"
          }`}
        >
          <Check size={16} className="inline-block mr-2" />
          {successMessage}
        </div>
      )}

      <div className="mb-4">
        <div className="relative">
          <Search
            size={18}
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-md border ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                : "bg-white border-gray-300 focus:border-blue-500"
            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
          />
        </div>
      </div>

      <div className={`border rounded-md overflow-hidden ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={theme === "dark" ? "bg-gray-700" : "bg-gray-50"}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Default Dashboard</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Default Home Page</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-200"}`}>
            {filteredCustomers.map((customer) => (
              <tr
                key={customer.id}
                className={theme === "dark" ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-50"}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm">{customer.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <select
                    value={customer.defaultDashboardId || ""}
                    onChange={(e) => assignDashboard(customer.id, e.target.value || null)}
                    className={`w-full p-2 rounded-md border ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                        : "bg-white border-gray-300 focus:border-blue-500"
                    } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  >
                    <option value="">No Default Dashboard</option>
                    {dashboards.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <Tooltip
                    title={
                      defaultHomePage[customer.id]
                        ? "This dashboard is set as the default home page for all users"
                        : "Set as default home page for all users"
                    }
                  >
                    <Switch
                      checked={defaultHomePage[customer.id]}
                      onChange={() => toggleDefaultHomePage(customer.id)}
                      checkedChildren={<Home size={12} />}
                      unCheckedChildren={<Home size={12} />}
                      disabled={!customer.defaultDashboardId}
                    />
                  </Tooltip>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={saveChanges}
                    disabled={saving}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      theme === "dark"
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    <Save size={16} className="mr-1" />
                    {saving ? "Saving..." : "Save"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CustomerDefaultDashboard
