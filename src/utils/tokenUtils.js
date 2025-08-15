// src/utils/tokenUtils.js

import { jwtDecode } from "jwt-decode"
import axios from "axios"

export const getTenantTypeLabel = () => {
  const type = getTenantType()
  switch (type) {
    case "ORGANIZATION": return "Organization"
    case "COMPANY": return "Company"
    case "USER": return "User"
    default: return type || ""
  }
}

// Save token and important claims to localStorage
export const saveToken = (token) => {
  localStorage.setItem("token", token)
  try {
    const decoded = jwtDecode(token)
    localStorage.setItem("userInfo", JSON.stringify(decoded))
    if (decoded.tenantId) localStorage.setItem("tenantId", decoded.tenantId)
    if (decoded.role) localStorage.setItem("role", decoded.role)
    if (decoded.accessLevel) localStorage.setItem("accessLevel", decoded.accessLevel)
    if (decoded.tenantType) localStorage.setItem("tenantType", getTenantTypeLabel(decoded.tenantType))
    if (decoded.userFullName) localStorage.setItem("userFullName", decoded.userFullName)
    if (decoded.username) localStorage.setItem("username", decoded.username)
      
    // Add more fields as needed!
  } catch (err) {
    localStorage.removeItem("userInfo")
  }
}

// Get token from localStorage
export const getToken = () => localStorage.getItem("token")

// Remove all relevant auth info from localStorage
export const removeToken = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("userInfo")
  localStorage.removeItem("tenantId")
  localStorage.removeItem("tenantName")
  localStorage.removeItem("role")
  localStorage.removeItem("accessLevel")
  localStorage.removeItem("tenantType")
  localStorage.removeItem("userFullName")
  localStorage.removeItem("username")
}

// Get user info decoded from JWT
export const getUserInfo = () => {
  const info = localStorage.getItem("userInfo")
  return info ? JSON.parse(info) : null
}


// Fetch tenantName from backend and save in localStorage
export const fetchAndSaveTenantName = async () => {
  const tenantId = getTenantId()
  console.log("fetchAndSaveTenantName: tenantId=", tenantId)
  if (!tenantId) return null
  try {
    const token = getToken()
    console.log("Calling API for tenantName with token:", token)
    const { data } = await axios.get(
      `http://localhost:8083/api/v1/tenants/${tenantId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    console.log("Tenant name API response:", data)
    if (data?.tenantName) {
      localStorage.setItem("tenantName", data.tenantName)
      if (data.tenantType) {
        localStorage.setItem("tenantType", getTenantTypeLabel(data.tenantType))
      }
      return data.tenantName
    }
    return null
  } catch (err) {
    console.error("Error fetching tenant name", err)
    localStorage.removeItem("tenantName")
    return null
  }
}

// Utility getters for client
export const getTenantName = () => localStorage.getItem("tenantName") || ""
export const getTenantId = () => localStorage.getItem("tenantId") || getUserInfo()?.tenantId || null
export const getUsername = () => localStorage.getItem("username") || getUserInfo()?.username || null
export const getUserFullName = () => localStorage.getItem("userFullName") || getUserInfo()?.userFullName || null
export const getRole = () => localStorage.getItem("role") || getUserInfo()?.role || null
export const getTenantType = () => localStorage.getItem("tenantType") || getUserInfo()?.tenantType || null
export const getAccessLevel = () => localStorage.getItem("accessLevel") || getUserInfo()?.accessLevel || null
export const getUserId = () => getUserInfo()?.userId || null

// // src/utils/tokenUtils.js

// import { jwtDecode } from "jwt-decode"
// import axios from "axios"

// export const saveToken = (token) => {
//   localStorage.setItem("token", token)
//   try {
//     const decoded = jwtDecode(token)
//     localStorage.setItem("userInfo", JSON.stringify(decoded))
//     // Optionally, save specific claims individually:
//     if (decoded.tenantId) localStorage.setItem("tenantId", decoded.tenantId)
//     if (decoded.role) localStorage.setItem("role", decoded.role)
//     if (decoded.accessLevel) localStorage.setItem("accessLevel", decoded.accessLevel)
//     if (decoded.tenantType) localStorage.setItem("tenantType", decoded.tenantType)
//     // Add more if needed
//   } catch (err) {
//     localStorage.removeItem("userInfo")
//   }
// }

// export const getToken = () => {
//   return localStorage.getItem("token")
// }

// export const removeToken = () => {
//   localStorage.removeItem("token")
//   localStorage.removeItem("userInfo")
// }

// // Utility getters
// export const getUserInfo = () => {
//   const info = localStorage.getItem("userInfo")
//   return info ? JSON.parse(info) : null
// }

// export const fetchAndSaveTenantName = async () => {
//   const tenantId = getTenantId()
//   if (!tenantId) return null
//   try {
//     const token = getToken()
//     const { data } = await axios.get(
//       `http://localhost:8083/api/v1/tenants/${tenantId}`,
//       { headers: { Authorization: `Bearer ${token}` } }
//     )
//     if (data?.tenantName) {
//       localStorage.setItem("tenantName", data.tenantName)
//       return data.tenantName
//     }
//     return null
//   } catch (err) {
//     // Optionally handle error (e.g. logout if 401)
//     localStorage.removeItem("tenantName")
//     return null
//   }
// }

// export const getTenantName = () => localStorage.getItem("tenantName") || ""
// export const getTenantId = () => getUserInfo()?.tenantId || null
// export const getRole = () => getUserInfo()?.role || null
// export const getTenantType = () => getUserInfo()?.tenantType || null
// export const getAccessLevel = () => getUserInfo()?.accessLevel || null
// export const getUserId = () => getUserInfo()?.userId || null

// // Add more as needed (email, username, etc)

// // export const saveToken = (token) => {
// //     localStorage.setItem("authToken", token);
// //   };
  
// //   export const getToken = () => {
// //     return localStorage.getItem("authToken");
// //   };
  
// //   export const removeToken = () => {
// //     localStorage.removeItem("authToken");
// //   };
  