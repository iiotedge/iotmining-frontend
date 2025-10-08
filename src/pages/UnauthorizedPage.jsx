"use client"

import React from "react"
import { Result, Button, Typography, Card, theme } from "antd"
import {
  LockOutlined,
  ReloadOutlined,
  CustomerServiceOutlined,
  LoginOutlined,
} from "@ant-design/icons"
import { useNavigate } from "react-router-dom"

const UnauthorizedPage = () => {
  const { token } = theme.useToken()
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: token.colorBgLayout, // adapts to dark/light theme
      }}
    >
      <Card
        bordered={false}
        style={{
          maxWidth: 640,
          width: "100%",
          background: token.colorBgContainer, // adapts to dark/light theme
          boxShadow: token.boxShadowSecondary,
          // borderRadius: 1,
        }}
      >
        <Result
          status="403"
          icon={<LockOutlined style={{ fontSize: 48, color: token.colorPrimary }} />}
          title="You’re not authorized to view this page"
          subTitle="Your session may have expired or we couldn’t detect your tenant. Please log in again or contact support."
          extra={[
            <Button
              key="login"
              type="primary"
              icon={<LoginOutlined />}
              onClick={() => navigate("/login", { replace: true })}
            >
              Log in again
            </Button>,
            <Button
              key="retry"
              icon={<ReloadOutlined />}
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>,
            <Button
              key="support"
              icon={<CustomerServiceOutlined />}
              href="mailto:support@iiotedge.in?subject=Access%20issue%20(TENANT_MISSING)"
            >
              Contact support
            </Button>,
          ]}
        />
        <Typography.Paragraph
          type="secondary"
          style={{ textAlign: "center", marginTop: -12 }}
        >
          Error code: <Typography.Text code>TENANT_MISSING</Typography.Text>
        </Typography.Paragraph>
      </Card>
    </div>
  )
}

export default UnauthorizedPage

// const UnauthorizedPage = () => (
//     <div style={{ padding: 40, textAlign: "center" }}>
//       <h1>403 - Access Denied</h1>
//       <p>You do not have permission to view this page.</p>
//     </div>
//   )
  
//   export default UnauthorizedPage
  