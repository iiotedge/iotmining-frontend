"use client"

import React, { useEffect, useState } from "react"
import { Form, Input, Button, Checkbox, Space, Typography, message} from "antd"
import { UserOutlined, LockOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import { getRedirectPathFromRole } from "../../utils/roleRedirect"
import { saveToken, fetchAndSaveTenantName } from "../../utils/tokenUtils"
import { login } from "../../api/auth"
import { useTheme } from "../theme/ThemeProvider"

const { Text } = Typography

const LoginForm = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [isMobile, setIsMobile] = useState(false)
  const navigate = useNavigate()
  const { tokens } = useTheme()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 575)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    // restore remembered email
    const remembered = localStorage.getItem("im_auth_email")
    if (remembered) form.setFieldsValue({ email: remembered, remember: true })
  }, [form])

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      const response = await login(values.email, values.password)
      const token = response?.data?.accessToken || response?.token
      if (!token) throw new Error("No token returned from server")

      // remember email
      if (values.remember) localStorage.setItem("im_auth_email", values.email)
      else localStorage.removeItem("im_auth_email")

      saveToken(token)
      await fetchAndSaveTenantName()

      // role‑aware redirect
      navigate(getRedirectPathFromRole(token))
      onSuccess?.()
    } catch (error) {
      const msg = error?.response?.data?.message || "Login failed. Check credentials."
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form
      form={form}
      name="login"
      onFinish={handleLogin}
      layout="vertical"
      size={isMobile ? "middle" : "large"}
      style={{ width: "100%" }}
      initialValues={{ remember: true }}
    >
      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: "Please enter your email" },
          { type: "text", message: "Enter a valid email" },
        ]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="you@example.com"
          autoComplete="username"
          className="auth-input"
          aria-label="Email"
        />
      </Form.Item>

      <Form.Item
        name="password"
        label="Password"
        rules={[{ required: true, message: "Please enter your password" }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Your password"
          autoComplete="current-password"
          className="auth-input"
          aria-label="Password"
        />
      </Form.Item>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: -8 }}>
        <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: 0 }}>
          <Checkbox>Remember me</Checkbox>
        </Form.Item>
        <Button type="link" style={{ paddingRight: 0 }} onClick={() => navigate("/forgot-password")}>
          Forgot password?
        </Button>
      </div>

      <Form.Item style={{ marginTop: 8 }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          style={{ borderRadius: 8 }}
        >
          Log In
        </Button>
      </Form.Item>

      <Space direction="vertical" size={4} style={{ width: "100%", textAlign: "center" }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          By continuing, you agree to our{" "}
          <a href="/terms" style={{ color: tokens.colorPrimary }}>Terms</a> &{" "}
          <a href="/privacy" style={{ color: tokens.colorPrimary }}>Privacy Policy</a>.
        </Text>
      </Space>
    </Form>
  )
}

export default LoginForm

// "use client"

// import React, { useState, useEffect } from "react"
// import { Form, Input, Button, message } from "antd"
// import { UserOutlined, LockOutlined } from "@ant-design/icons"
// import { useNavigate } from "react-router-dom"
// import { getRedirectPathFromRole } from "../../utils/roleRedirect"
// import { saveToken, fetchAndSaveTenantName} from "../../utils/tokenUtils"
// import { login } from "../../api/auth"

// const LoginForm = ({ onSuccess }) => {
//   const [loading, setLoading] = useState(false)
//   const [form] = Form.useForm()
//   const [isMobile, setIsMobile] = useState(false)
//   const navigate = useNavigate()

//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth <= 575)
//     }
//     checkMobile()
//     window.addEventListener("resize", checkMobile)
//     return () => {
//       window.removeEventListener("resize", checkMobile)
//     }
//   }, [])

//   const handleLogin = async (values) => {
//     setLoading(true)
//     try {
//       // Use your API wrapper
//       const response = await login(values.email, values.password)
//       // Some APIs nest token, some flat; adjust as needed:
//       const token = response?.data?.accessToken || response?.token
//       if (!token) throw new Error("No token returned from server")

//       // Save token & decoded user info to localStorage
//       saveToken(token)
//       await fetchAndSaveTenantName()

//       message.success("Login successful!")

//       // Redirect user based on decoded token roles
//       navigate(getRedirectPathFromRole(token))
//       onSuccess?.()
//     } catch (error) {
//       console.error("Login error:", error)
//       const msg = error?.response?.data?.message || "Login failed. Check credentials."
//       message.error(msg)
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <Form
//       form={form}
//       name="login"
//       onFinish={handleLogin}
//       layout="vertical"
//       size={isMobile ? "middle" : "large"}
//       className="auth-form"
//     >
//       <Form.Item name="email" rules={[{ required: true, message: "Please enter your email" }]}>
//         <Input prefix={<UserOutlined />} placeholder="Email" className="auth-input" />
//       </Form.Item>
//       <Form.Item name="password" rules={[{ required: true, message: "Please enter your password" }]}>
//         <Input.Password prefix={<LockOutlined />} placeholder="Password" className="auth-input" />
//       </Form.Item>
//       <Form.Item>
//         <Button type="primary" htmlType="submit" className="auth-button" loading={loading} block>
//           Log In
//         </Button>
//       </Form.Item>
//     </Form>
//   )
// }

// export default LoginForm

// // "use client"

// // import React, { useState, useEffect } from "react"
// // import { Form, Input, Button, message } from "antd"
// // import { UserOutlined, LockOutlined } from "@ant-design/icons"
// // import { useNavigate } from "react-router-dom"
// // import { jwtDecode } from "jwt-decode"
// // import axios from "axios"
// // import { getRedirectPathFromRole } from "../../utils/roleRedirect"

// // const LoginForm = ({ onSuccess }) => {
// //   const [loading, setLoading] = useState(false)
// //   const [form] = Form.useForm()
// //   const [isMobile, setIsMobile] = useState(false)
// //   const navigate = useNavigate()

// //   const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8096/api/v1"

// //   useEffect(() => {
// //     const checkMobile = () => {
// //       setIsMobile(window.innerWidth <= 575)
// //     }
// //     checkMobile()
// //     window.addEventListener("resize", checkMobile)
// //     return () => {
// //       window.removeEventListener("resize", checkMobile)
// //     }
// //   }, [])

// //   // const handleLogin = async (values) => {
// //   //   setLoading(true)
// //   //   try {
// //   //     const response = await axios.post(`${BASE_URL}/auth/login`, {
// //   //       username: values.email,
// //   //       password: values.password,
// //   //     })

// //   //     const token = response.data?.data?.accessToken
// //   //     if (!token) throw new Error("No token returned from server")

// //   //     localStorage.setItem("token", token)
      
// //   //     message.success("Login successful!")

// //   //     // Redirect user based on decoded token roles
// //   //     navigate(getRedirectPathFromRole(token))

// //   //     onSuccess?.()

// //   //   } catch (error) {
// //   //     console.error("Login error:", error)
// //   //     const msg = error?.response?.data?.message || "Login failed. Check credentials."
// //   //     message.error(msg)
// //   //   } finally {
// //   //     setLoading(false)
// //   //   }
// //   // }
// //   const handleLogin = async (values) => {
// //     setLoading(true)
// //     try {
// //       const response = await axios.post(`${BASE_URL}/auth/login`, {
// //         username: values.email,
// //         password: values.password,
// //       })

// //       const token = response.data?.data?.accessToken
// //       if (!token) throw new Error("No token returned from server")

// //       localStorage.setItem("token", token)

// //       // Decode the token and store tenantId
// //       const decoded = jwtDecode(token)
// //       const tenantId = decoded.tenantId || decoded.tenantID || decoded["tenant_id"] // support for different casings

// //       if (tenantId) {
// //         localStorage.setItem("tenantId", tenantId)
// //       } else {
// //         console.warn("No tenantId found in JWT token.")
// //       }

// //       message.success("Login successful!")

// //       // Redirect user based on decoded token roles
// //       navigate(getRedirectPathFromRole(token))
// //       onSuccess?.()
// //     } catch (error) {
// //       console.error("Login error:", error)
// //       const msg = error?.response?.data?.message || "Login failed. Check credentials."
// //       message.error(msg)
// //     } finally {
// //       setLoading(false)
// //     }
// //   }

// //   return (
// //     <Form
// //       form={form}
// //       name="login"
// //       onFinish={handleLogin}
// //       layout="vertical"
// //       size={isMobile ? "middle" : "large"}
// //       className="auth-form"
// //     >
// //       <Form.Item name="email" rules={[{ required: true, message: "Please enter your email" }]}>
// //         <Input prefix={<UserOutlined />} placeholder="Email" className="auth-input" />
// //       </Form.Item>
// //       <Form.Item name="password" rules={[{ required: true, message: "Please enter your password" }]}>
// //         <Input.Password prefix={<LockOutlined />} placeholder="Password" className="auth-input" />
// //       </Form.Item>
// //       <Form.Item>
// //         <Button type="primary" htmlType="submit" className="auth-button" loading={loading} block>
// //           Log In
// //         </Button>
// //       </Form.Item>
// //     </Form>
// //   )
// // }

// // export default LoginForm
