// import apiClient from "../api/auth"

// const login = async (email, password) => {
//   const response = await apiClient.post("/auth/login", { email, password })
//   localStorage.setItem("token", response.data.token)
//   return response.data
// }

// const signup = async (data) => {
//   return await apiClient.post("/auth/register", data)
// }

// const logout = () => {
//   localStorage.removeItem("token")
//   localStorage.removeItem("tenantId")
//   localStorage.clear()
// }

// const AuthService = { login, signup, logout }
// export default AuthService
