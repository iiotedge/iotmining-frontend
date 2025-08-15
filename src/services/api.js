// // services/api.js
// import axios from "axios"

// const api = axios.create({
//   baseURL: "http://localhost:8084", // adjust as needed "http://192.168.0.104:8090" ||
  
// })
// const DASHBORD_BASE_URL = "http://localhost:8091/api/dashboards"


// export const getDashboard = async (id) => {
//   const res = await fetch(`${DASHBORD_BASE_URL}/${id}`)
//   if (!res.ok) throw new Error("Failed to load dashboard")
//   return await res.json()
// }

// export const createDashboard = async (data) => {
//   const res = await fetch(DASHBORD_BASE_URL, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(data),
//   })
//   if (!res.ok) throw new Error("Failed to create dashboard")
//   return await res.json()
// }

// export const updateDashboard = async (id, data) => {
//   const res = await fetch(`${DASHBORD_BASE_URL}/${id}`, {
//     method: "PUT",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(data),
//   })
//   if (!res.ok) throw new Error("Failed to update dashboard")
//   return await res.json()
// }

// export default api
