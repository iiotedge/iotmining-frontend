import axios from "axios"

const API_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8096/api/v1"

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
})

// LOGIN
export const login = async (email, password) => {
  const response = await apiClient.post("/auth/login", { username: email, password })
  return response.data
}

// SIGNUP
export const signup = async (data) => {
  const response = await apiClient.post("/auth/register", data)
  return response.data
}

// LOGOUT (clear all auth data)
export const logout = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("userInfo")
  localStorage.clear()
}

// Optionally, export the axios instance for advanced use
export default {
  login,
  signup,
  logout
}

// import axios from "axios"

// const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api/v1"

// const apiClient = axios.create({
//   baseURL: BASE_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
// })

// apiClient.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token")
//   if (token) config.headers.Authorization = `Bearer ${token}`
//   return config
// })

// // ✅ Response interceptor to handle token expiry
// apiClient.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response && error.response.status === 401) {
//       localStorage.removeItem("token")
//       window.location.href = "/auth" // 🔁 redirect to login
//     }
//     return Promise.reject(error)
//   }
// )

// export default apiClient
