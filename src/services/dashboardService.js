// services/dashboardService.js

import axios from "axios"

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080/api"

// Fetch dashboards assigned to this tenant/user
export async function listAssignedDashboards(tenantId) {
  try {
    const res = await axios.get(`${API_BASE}/dashboards/assigned`, {
      params: { tenantId }
    })
    // Response should be an array of dashboard objects
    return res.data
  } catch (err) {
    // For dev: log error
    console.error("Error fetching assigned dashboards:", err)
    return []
  }
}


export async function fetchDevices() {
  // Example: Simulate fetch from API
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        { id: "dev-1", name: "Main Controller", status: "online" },
        { id: "dev-2", name: "Sensor Node 1", status: "offline" },
        { id: "dev-3", name: "Fan Tray Controller", status: "online" },
        // ...add more
      ])
    }, 300)
  })
}
