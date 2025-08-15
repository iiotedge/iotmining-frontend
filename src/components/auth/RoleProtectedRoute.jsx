import React from "react"
import { Navigate, Outlet } from "react-router-dom"
import { jwtDecode } from "jwt-decode"

const RoleProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("token")

  if (!token) {
    return <Navigate to="/auth" replace />
  }

  try {
    const decoded = jwtDecode(token)
    const roles = decoded.role || decoded.roles || []

    const roleList = Array.isArray(roles) ? roles : [roles]
    const hasAccess = roleList.some((role) => allowedRoles.includes(role))

    return hasAccess ? <Outlet /> : <Navigate to="/unauthorized" replace />
  } catch (e) {
    console.error("Invalid token", e)
    localStorage.removeItem("token")
    return <Navigate to="/auth" replace />
  }
}

export default RoleProtectedRoute
