import { jwtDecode } from "jwt-decode"

export const getRedirectPathFromRole = (token) => {
  const decoded = jwtDecode(token)
  const roles = decoded.role || decoded.role || []
  const userRoles = Array.isArray(roles) ? roles : [roles]

  console.log(userRoles);
  if (userRoles.includes("ROLE_ADMIN")) return "/dashboards"
  if (userRoles.includes("ROLE_USER")) return "/devices"
  return "/"
}
