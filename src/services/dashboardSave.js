// src/services/dashboardSave.js

import { message } from "antd"
import { getTenantId, getToken } from "../utils/tokenUtils"

const DASHBOARD_API_BASE = /* process.env.REACT_APP_DASHBOARD_API_BASE || */ "http://localhost:8102/api/dashboards"

/**
 * Create a new dashboard entry (metadata only, no dashboard JSON uploaded yet).
 * @param {Object} params
 * @param {string} params.title
 * @param {string} [params.description]
 * @param {Array<string>} [params.assignedCustomers]
 * @returns {Promise<Object>} - Response with dashboardId, objectUrl, etc.
 */
export async function createDashboardEntry({
  title,
  description,
  assignedCustomers,
  isPublic,
  createdTime,
  version,
}) {
  const tenantId = getTenantId()
  if (!tenantId) {
    message.error("No tenant ID found in local storage. Please login again.")
    throw new Error("No tenant ID found")
  }
  const payload = {
    title,
    description,
    assignedCustomers: assignedCustomers || [],
    isPublic: !!isPublic,
    createdTime: createdTime || new Date().toISOString(),
    version: version || "v1.0",
  }

  try {
    const res = await fetch(
      `${DASHBOARD_API_BASE}/create?tenantId=${encodeURIComponent(tenantId)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      }
    )
    if (!res.ok) {
      const err = await res.text()
      throw new Error(err || "Create failed")
    }
    const data = await res.json()
    message.success("Dashboard created! (ID: " + data.dashboardId + ")")
    return data // { dashboardId, objectUrl, ... }
  } catch (err) {
    message.error(`Create failed: ${err.message}`)
    throw err
  }
}

/**
 * Save a dashboard to backend (Minio via API).
 * If dashboardId is not provided, backend will generate one and return it.
 * @param {Object} params
 * @param {string?} params.dashboardId - Existing dashboard ID (if updating)
 * @param {string} params.dashboardJson - JSON string for dashboard
 * @returns {Promise<Object>} - Response with at least dashboardId property
 */
export async function saveDashboardToBackend({
  dashboardId,
  dashboardJson
}) {
  const tenantId = getTenantId()
  if (!tenantId) {
    message.error("No tenant ID found in local storage. Please login again.")
    throw new Error("No tenant ID found")
  }

  // Build query string
  const params = new URLSearchParams({ tenantId })
  if (dashboardId) params.append("dashboardId", dashboardId)

  try {
    const res = await fetch(
      `${DASHBOARD_API_BASE}/save?${params.toString()}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
        body: dashboardJson,
      }
    )
    if (!res.ok) {
      const err = await res.text()
      throw new Error(err || "Save failed")
    }
    const data = await res.json()
    if (!data.dashboardId) {
      message.warning("Saved, but no dashboardId returned!")
    } else {
      message.success("Dashboard saved! (ID: " + data.dashboardId + ")")
    }
    return data
  } catch (err) {
    message.error(`Save failed: ${err.message}`)
    throw err
  }
}

export async function fetchDashboards(dashboardId) {
  const tenantId = getTenantId()
  let url = `${DASHBOARD_API_BASE}/list?tenantId=${encodeURIComponent(tenantId)}`
  if (dashboardId) url += `&dashboardId=${encodeURIComponent(dashboardId)}`

  let res
  try {
    res = await fetch(url)
  } catch (err) {
    // Network error (DNS, connection, etc)
    throw new Error("Network error: Unable to connect to Dashboard service. " + (err?.message || ""))
  }
  if (!res.ok) {
    // API returned error code
    let errorDetail = ""
    try {
      // Try to get error response body if any
      const data = await res.json()
      if (data && data.message) errorDetail = `: ${data.message}`
    } catch { /* not JSON, skip */ }
    throw new Error(`Failed to fetch dashboards [${res.status}]${errorDetail}`)
  }

  // Validate JSON response
  let json
  try {
    json = await res.json()
  } catch (err) {
    throw new Error("Failed to parse dashboard response as JSON.")
  }
  // Optional: validate structure
  if (!json || (typeof json !== "object")) {
    throw new Error("Dashboard response format is invalid.")
  }
  return json
}

/**
 * Fetch a single dashboard JSON by ID.
 * @param {string} dashboardId - The dashboard's unique ID.
 * @returns {Promise<Object>} - The parsed dashboard JSON.
 */
export async function fetchDashboardById(dashboardId) {
  const tenantId = getTenantId()
  if (!tenantId) throw new Error("No tenant ID found")
  if (!dashboardId) throw new Error("No dashboard ID provided")

  let url = `${DASHBOARD_API_BASE}/get?tenantId=${encodeURIComponent(tenantId)}&dashboardId=${encodeURIComponent(dashboardId)}`
  let res
  try {
    res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${getToken()}`,
        "Accept": "application/json",
      }
    })
  } catch (err) {
    throw new Error("Network error: Unable to connect to Dashboard service. " + (err?.message || ""))
  }

  if (!res.ok) {
    let errorDetail = ""
    try {
      const data = await res.json()
      if (data && data.error) errorDetail = `: ${data.error}`
    } catch { /* not JSON, skip */ }
    throw new Error(`Failed to fetch dashboard [${res.status}]${errorDetail}`)
  }

  // Dashboard JSON might be returned as string (if stored as text), so try parse
  let dashboardJson
  try {
    const raw = await res.text()
    dashboardJson = typeof raw === "string" ? JSON.parse(raw) : raw
  } catch (err) {
    throw new Error("Failed to parse dashboard JSON from backend.")
  }
  if (!dashboardJson || typeof dashboardJson !== "object") {
    throw new Error("Dashboard response format is invalid.")
  }
  return dashboardJson
}



// // src/services/dashboardSave.js

// import { message } from "antd"
// import { getTenantId, getToken } from "../utils/tokenUtils"

// const DASHBOARD_API_BASE = process.env.REACT_APP_DASHBOARD_API_BASE || "http://localhost:8102/api/dashboards"

// export async function saveDashboardToBackend({
//   dashboardId,
//   dashboardJson,
//   deviceId = "device1",    // You can parameterize or pick from UI/context as needed
// }) {
//   const tenantId = getTenantId()
//   if (!tenantId) {
//     message.error("No tenant ID found in local storage. Please login again.")
//     throw new Error("No tenant ID found")
//   }

//   try {
//     const res = await fetch(
//       `${DASHBOARD_API_BASE}/save?tenantId=${encodeURIComponent(tenantId)}&deviceId=${encodeURIComponent(deviceId)}&dashboardId=${encodeURIComponent(dashboardId)}`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${getToken()}`,
//         },
//         body: dashboardJson,
//       }
//     )
//     if (!res.ok) {
//       const err = await res.text()
//       throw new Error(err || "Save failed")
//     }
//     const data = await res.json()
//     message.success("Dashboard saved to backend!")
//     return data
//   } catch (err) {
//     message.error(`Save failed: ${err.message}`)
//     throw err
//   }
// }
