"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  Form,
  Input,
  Button,
  Checkbox,
  DatePicker,
  Select,
  Typography,
  Space,
  message,
  Card,
  Steps,
  Alert,
  Progress,
  Tooltip,
  Row,
  Col,
  Tag,
  Statistic,
  notification,  // ✅ notifications
} from "antd"
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  GoogleOutlined,
  GithubOutlined,
  FacebookOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons"
import axios from "axios"
import { useTheme } from "../theme/ThemeProvider"

const { Option } = Select
const { Text, Title } = Typography
const { Countdown } = Statistic

// --- Compact layout settings ---
const MB = 10
const SECTION_GAP = 12
const GRID_GUTTER = 8

const COUNTRY_CODES = [
  { code: "+91", label: "India (+91)" },
  { code: "+1", label: "USA (+1)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+81", label: "Japan (+81)" },
]

// --- Helpers ---
const maskEmail = (email = "") => {
  const [name, domain] = email.split("@")
  if (!name || !domain) return email
  const maskedName =
    name.length <= 2 ? name[0] + "*" : name[0] + "*".repeat(Math.max(1, name.length - 2)) + name.slice(-1)
  return `${maskedName}@${domain}`
}
const maskPhone = (phone = "") => {
  const digits = phone.replace(/\D/g, "")
  if (digits.length <= 4) return phone
  return phone.slice(0, -4).replace(/\d/g, "•") + phone.slice(-4)
}
const passwordScore = (pwd = "") => {
  let s = 0
  if (pwd.length >= 8) s++
  if (/[A-Z]/.test(pwd)) s++
  if (/[a-z]/.test(pwd)) s++
  if (/\d/.test(pwd)) s++
  if (/[^\w\s]/.test(pwd)) s++
  return Math.min(s, 4)
}
const scoreToStatus = (s) => (s < 2 ? "exception" : s < 3 ? "normal" : "success")
const scoreToPercent = (s) => [0, 40, 60, 80, 100][s]

// --- OTP Inputs (local state + onInput) ---
const OtpSix = ({ value = "", onChange }) => {
  const inputsRef = useRef([])
  const [digits, setDigits] = useState(() => {
    const v = (value || "").replace(/\D/g, "").slice(0, 6)
    return Array.from({ length: 6 }, (_, i) => v[i] || "")
  })
  const prevValueRef = useRef(value)
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value
      const v = (value || "").replace(/\D/g, "").slice(0, 6)
      setDigits(Array.from({ length: 6 }, (_, i) => v[i] || ""))
    }
  }, [value])

  const commit = (arr) => {
    setDigits(arr)
    onChange?.(arr.join(""))
  }

  const handleInput = (i) => (e) => {
    const raw = e.currentTarget.value
    const d = (raw.match(/\d/g) || []).pop() || "" // last digit only
    const next = digits.slice()
    next[i] = d
    commit(next)
    if (d && i < 5) inputsRef.current[i + 1]?.focus()
  }

  const handleKeyDown = (i) => (e) => {
    if (e.key === "Backspace") {
      e.preventDefault()
      const next = digits.slice()
      if (next[i]) {
        next[i] = ""
        commit(next)
      } else if (i > 0) {
        inputsRef.current[i - 1]?.focus()
        next[i - 1] = ""
        commit(next)
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault()
      inputsRef.current[i - 1]?.focus()
    } else if (e.key === "ArrowRight" && i < 5) {
      e.preventDefault()
      inputsRef.current[i + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6)
    if (!text) return
    const arr = Array.from({ length: 6 }, (_, i) => text[i] || "")
    commit(arr)
    const nextIndex = Math.min(text.length, 5)
    setTimeout(() => inputsRef.current[nextIndex]?.focus(), 0)
  }

  return (
    <Space onPaste={handlePaste} aria-label="Enter the 6-digit OTP" size={8}>
      {digits.map((val, i) => (
        <Input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          value={val}
          onInput={handleInput(i)}
          onKeyDown={handleKeyDown(i)}
          type="tel"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          aria-label={`OTP digit ${i + 1}`}
          style={{ width: 40, textAlign: "center", paddingInline: 6 }}
        />
      ))}
    </Space>
  )
}

const SignupForm = ({ onSuccess }) => {
  const { tokens } = useTheme()
  const [notify, contextHolder] = notification.useNotification() // ✅ hook
  const [loading, setLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [form] = Form.useForm()
  const [otpForm] = Form.useForm()
  const [isMobile, setIsMobile] = useState(false)

  const [isOtpStep, setIsOtpStep] = useState(false)
  const [prospectId, setProspectId] = useState(null)
  const [otpChannel, setOtpChannel] = useState("SMS")
  const [resendUntil, setResendUntil] = useState(null)
  const [lastRegisterPayload, setLastRegisterPayload] = useState(null)

  const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8096/api/v1"

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 575)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const registerCall = async (payload) => {
    const { data } = await axios.post(`${BASE_URL}/auth/register`, payload)
    const pid = data?.data?.prospectId
    const channel = data?.data?.otpChannel || payload.otpChannel
    if (!pid) throw new Error("Prospect ID not returned from server")

    // ✅ Friendly “OTP sent” toast with masked destination
    const destination =
      (channel === "SMS" ? maskPhone(payload.phoneNumber || "") : maskEmail(payload.email || "")) || "your contact"
    notify.success({
      message: "OTP sent",
      description: `We sent a 6‑digit code to ${destination}. Use it here to verify.`,
      placement: "topRight",
      duration: 3,
    })

    setProspectId(pid)
    setOtpChannel(channel)
    setIsOtpStep(true)
    setResendUntil(Date.now() + 30_000)
    return { pid, channel }
  }

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        gender: String(values.gender || "").toUpperCase(),
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format("YYYY-MM-DD") : null,
        email: values.email,
        password: values.password,
        phoneNumber: `${values.countryCode}${values.phoneNumber}`,
        roles: values.roles,
        username: values.username,
        otpChannel: values.otpChannel || "SMS",
        parentTenantId: "2e83b3e2-eec3-4d8b-837c-935cb21f7290",
      }
      setLastRegisterPayload(payload)
      await registerCall(payload)
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.message || "Registration failed. Please try again."
      notify.error({
        message: "Couldn’t start verification",
        description: errorMsg,
        placement: "topRight",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async ({ otp }) => {
    if (!prospectId) {
      notify.error({
        message: "Missing verification session",
        description: "Please go back to Sign Up and try again.",
        placement: "topRight",
      })
      setIsOtpStep(false)
      return
    }
    setVerifyLoading(true)
    try {
      const payload = { identifier: prospectId, otp, type: otpChannel }
      const { data } = await axios.post(`${BASE_URL}/auth/register/verify`, payload)

      // ✅ Success toast with friendly copy
      const firstName = form.getFieldValue("firstName")
      const username = form.getFieldValue("username")
      notify.success({
        message: "Account created",
        description: `Welcome ${firstName || username || "there"}! You can now log in.`,
        placement: "topRight",
        duration: 3,
      })

      onSuccess?.() // e.g., switch to Login tab / navigate
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.message || "OTP verification failed."
      notify.error({
        message: "Invalid or expired OTP",
        description: `${errorMsg} • You can request a new code and try again.`,
        placement: "topRight",
      })
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleResend = async () => {
    if (!lastRegisterPayload) {
      notify.warning({
        message: "Can’t resend yet",
        description: "Missing signup details. Please go back and try again.",
        placement: "topRight",
      })
      return
    }
    try {
      await registerCall(lastRegisterPayload)
      otpForm.resetFields(["otp"])
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.message || "Could not resend OTP. Please try later."
      notify.error({
        message: "Resend failed",
        description: errorMsg,
        placement: "topRight",
      })
    }
  }

  const password = Form.useWatch("password", form)
  const pwdScore = passwordScore(password)
  const pwdTips = useMemo(() => {
    const tips = []
    if (!/[A-Z]/.test(password || "")) tips.push("uppercase")
    if (!/[a-z]/.test(password || "")) tips.push("lowercase")
    if (!/\d/.test(password || "")) tips.push("number")
    if (!/[^\w\s]/.test(password || "")) tips.push("symbol")
    return tips
  }, [password])

  const firstName = form.getFieldValue("firstName")
  const username = form.getFieldValue("username")
  const email = form.getFieldValue("email")
  const fullPhone = `${form.getFieldValue("countryCode") || ""}${form.getFieldValue("phoneNumber") || ""}`

  return (
    <div className="signup-form-container" style={{ maxWidth: 560, margin: "0 auto" }}>
      {/* notification portal */}
      {contextHolder}

      <Steps
        size="small"
        labelPlacement="vertical"
        current={isOtpStep ? 1 : 0}
        items={[{ title: "Account" }, { title: "OTP" }]}
        style={{ marginBottom: SECTION_GAP }}
      />

      {!isOtpStep ? (
        <Form
          form={form}
          name="signup"
          initialValues={{ agreement: false, otpChannel: "SMS", countryCode: "+91" }}
          onFinish={handleSubmit}
          layout="vertical"
          size={isMobile ? "middle" : "large"}
          className="auth-form"
          requiredMark={false}
          style={{ rowGap: 0 }}
        >
          <Row gutter={GRID_GUTTER}>
            <Col xs={24} md={12}>
              <Form.Item name="firstName" label="First name" rules={[{ required: true, message: "Enter your first name" }]} style={{ marginBottom: MB }}>
                <Input prefix={<UserOutlined />} placeholder="First Name" aria-label="First name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="lastName" label="Last name" rules={[{ required: true, message: "Enter your last name" }]} style={{ marginBottom: MB }}>
                <Input prefix={<UserOutlined />} placeholder="Last Name" aria-label="Last name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="username" label="Username" rules={[{ required: true, message: "Choose a username" }]} style={{ marginBottom: MB }}>
            <Input prefix={<UserOutlined />} placeholder="Username" aria-label="Username" />
          </Form.Item>

          <Row gutter={GRID_GUTTER}>
            <Col xs={24} md={12}>
              <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Select gender" }]} style={{ marginBottom: MB }}>
                <Select placeholder="Select">
                  <Option value="MALE">Male</Option>
                  <Option value="FEMALE">Female</Option>
                  <Option value="OTHER">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="dateOfBirth" label="Date of birth" rules={[{ required: true, message: "Select birth date" }]} style={{ marginBottom: MB }}>
                <DatePicker style={{ width: "100%" }} placeholder="Date of Birth" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={GRID_GUTTER}>
            <Col xs={24} md={12}>
              <Form.Item name="email" label="Email" rules={[{ required: true, message: "Enter your email" }, { type: "email", message: "Enter a valid email" }]} style={{ marginBottom: MB }}>
                <Input prefix={<MailOutlined />} placeholder="email@example.com" aria-label="Email" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Phone number" required style={{ marginBottom: MB }}>
                <Input.Group compact style={{ display: "flex" }}>
                  <Form.Item name="countryCode" noStyle rules={[{ required: true, message: "Code" }]}>
                    <Select style={{ width: "34%" }} showSearch optionFilterProp="children" aria-label="Country code">
                      {COUNTRY_CODES.map((c) => (
                        <Option key={c.code} value={c.code}>{c.label}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="phoneNumber"
                    noStyle
                    rules={[
                      { required: true, message: "Enter phone number" },
                      { pattern: /^\d{7,15}$/, message: "7–15 digits, numbers only" },
                    ]}
                  >
                    <Input style={{ width: "66%" }} prefix={<PhoneOutlined />} placeholder="9876543210" inputMode="numeric" aria-label="Phone number" />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="roles" label="Roles" rules={[{ required: true, message: "Select at least one role" }]} style={{ marginBottom: MB }}>
            <Select mode="multiple" placeholder="Select roles" maxTagCount="responsive">
              <Option value="ROLE_USER">User</Option>
              <Option value="ROLE_ADMIN">Admin</Option>
              <Option value="ROLE_SUPER_ADMIN">Manager</Option>
            </Select>
          </Form.Item>

          <Row gutter={GRID_GUTTER}>
            <Col xs={24} md={12}>
              <Form.Item
                name="password"
                label={<Space size={6}>Password <Tooltip title="Use 8+ chars with upper/lowercase, number, and symbol"><InfoCircleOutlined /></Tooltip></Space>}
                rules={[{ required: true, message: "Enter a password" }, { min: 8, message: "At least 8 characters" }]}
                hasFeedback
                style={{ marginBottom: MB }}
              >
                <Input.Password placeholder="Password" aria-label="Password" prefix={<LockOutlined />} />
              </Form.Item>

              {password ? (
                <div style={{ marginTop: -6, marginBottom: MB }}>
                  <Progress percent={scoreToPercent(pwdScore)} size="small" status={scoreToStatus(pwdScore)} showInfo={false} />
                  {pwdTips.length > 0 && (
                    <Text type="secondary" style={{ fontSize: 12 }}>Improve with: {pwdTips.join(", ")}</Text>
                  )}
                </div>
              ) : null}
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="confirmPassword"
                label="Confirm password"
                dependencies={["password"]}
                hasFeedback
                rules={[
                  { required: true, message: "Confirm your password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) return Promise.resolve()
                      return Promise.reject(new Error("Passwords do not match"))
                    },
                  }),
                ]}
                style={{ marginBottom: MB }}
              >
                <Input.Password placeholder="Confirm Password" aria-label="Confirm password" prefix={<LockOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={GRID_GUTTER}>
            <Col xs={24} md={12}>
              <Form.Item
                name="otpChannel"
                label="Verification"
                rules={[{ required: true, message: "Select method" }]}
                style={{ marginBottom: MB }}
              >
                <Select onChange={setOtpChannel} placeholder="Select">
                  <Option value="SMS">SMS</Option>
                  <Option value="EMAIL">Email</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="agreement"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value ? Promise.resolve() : Promise.reject(new Error("Accept terms to continue")),
                  },
                ]}
                style={{ marginBottom: MB }}
              >
                <Checkbox>
                  I agree to the <a href="/terms">Terms</a> & <a href="/privacy">Privacy</a>
                </Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Alert
            type="info"
            showIcon
            style={{ marginBottom: MB }}
            message={<span style={{ fontSize: 12 }}>We’ll send a one-time code to verify your account.</span>}
          />

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ borderRadius: 8 }}>
              Create account & send OTP
            </Button>
          </Form.Item>

          <div style={{ textAlign: "center", marginTop: 8 }}>
            <Space size="small">
              <Button icon={<GoogleOutlined />} shape="circle" />
              <Button icon={<GithubOutlined />} shape="circle" />
              <Button icon={<FacebookOutlined />} shape="circle" />
            </Space>
          </div>
        </Form>
      ) : (
        <Card bordered style={{ maxWidth: 560, margin: "0 auto", borderRadius: 12, boxShadow: tokens.boxShadow }}>
          <Space direction="vertical" size={SECTION_GAP} style={{ width: "100%" }}>
            <div>
              <Title level={5} style={{ marginBottom: 2 }}>
                Hi{firstName ? `, ${firstName}` : ""}! Verify your {otpChannel === "SMS" ? "mobile" : "email"}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Username: <Tag color="geekblue">{username}</Tag>
              </Text>
              <div style={{ marginTop: 6 }}>
                <Text style={{ fontSize: 13 }}>
                  Code sent to <b>{otpChannel === "SMS" ? maskPhone(fullPhone) : maskEmail(email)}</b>.
                </Text>
              </div>
            </div>

            <Form
              form={otpForm}
              layout="vertical"
              size={isMobile ? "middle" : "large"}
              onFinish={handleVerifyOtp}
              initialValues={{ otp: "" }}
              requiredMark={false}
              style={{ rowGap: 0 }}
            >
              <Form.Item
                name="otp"
                label="OTP Code"
                valuePropName="value"
                trigger="onChange"
                validateTrigger="onChange"
                rules={[
                  { required: true, message: "Enter the OTP" },
                  { pattern: /^\d{6}$/, message: "6 digits" },
                ]}
                style={{ marginBottom: MB }}
              >
                <OtpSix
                  value={otpForm.getFieldValue("otp") || ""}
                  onChange={(v) => {
                    otpForm.setFieldsValue({ otp: v })
                    if (/^\d{6}$/.test(v)) {
                      setTimeout(() => otpForm.submit(), 0)
                    }
                  }}
                />
              </Form.Item>

              <Row align="middle" justify="space-between" style={{ marginBottom: MB }}>
                <Col>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {resendUntil && Date.now() < resendUntil ? (
                      <Space size={4}>
                        Resend in
                        <Countdown value={resendUntil} format="s[s]" valueStyle={{ fontSize: 12 }} />
                      </Space>
                    ) : (
                      "Didn’t get the code?"
                    )}
                  </Text>
                </Col>
                <Col>
                  <Button
                    type="link"
                    icon={<ReloadOutlined />}
                    disabled={!!resendUntil && Date.now() < resendUntil}
                    onClick={handleResend}
                    style={{ paddingInline: 0 }}
                  >
                    Resend
                  </Button>
                </Col>
              </Row>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space direction={isMobile ? "vertical" : "horizontal"} style={{ width: "100%" }} size={8}>
                  <Button onClick={() => setIsOtpStep(false)} block>
                    Back
                  </Button>
                  <Button type="primary" htmlType="submit" loading={verifyLoading} icon={<SafetyCertificateOutlined />} block>
                    Verify & create
                  </Button>
                </Space>
              </Form.Item>
            </Form>

            <Alert
              type="info"
              showIcon
              message={<span style={{ fontSize: 12 }}>Tip</span>}
              description={<span style={{ fontSize: 12 }}>Check spam/junk (email) or ensure your number can receive SMS.</span>}
            />
          </Space>
        </Card>
      )}
    </div>
  )
}

export default SignupForm

// "use client"

// import React, { useEffect, useMemo, useRef, useState } from "react"
// import {
//   Form,
//   Input,
//   Button,
//   Checkbox,
//   DatePicker,
//   Select,
//   Typography,
//   Space,
//   message,
//   Card,
//   Steps,
//   Alert,
//   Progress,
//   Tooltip,
//   Row,
//   Col,
//   Tag,
//   Statistic,
// } from "antd"
// import {
//   UserOutlined,
//   LockOutlined,
//   MailOutlined,
//   PhoneOutlined,
//   GoogleOutlined,
//   GithubOutlined,
//   FacebookOutlined,
//   SafetyCertificateOutlined,
//   InfoCircleOutlined,
//   ReloadOutlined,
// } from "@ant-design/icons"
// import axios from "axios"
// import { useTheme } from "../theme/ThemeProvider"

// const { Option } = Select
// const { Text, Title } = Typography
// const { Countdown } = Statistic

// // --- Compact layout settings ---
// const MB = 10
// const SECTION_GAP = 12
// const GRID_GUTTER = 8

// const COUNTRY_CODES = [
//   { code: "+91", label: "India (+91)" },
//   { code: "+1", label: "USA (+1)" },
//   { code: "+44", label: "UK (+44)" },
//   { code: "+61", label: "Australia (+61)" },
//   { code: "+81", label: "Japan (+81)" },
// ]

// // --- Helpers ---
// const maskEmail = (email = "") => {
//   const [name, domain] = email.split("@")
//   if (!name || !domain) return email
//   const maskedName =
//     name.length <= 2 ? name[0] + "*" : name[0] + "*".repeat(Math.max(1, name.length - 2)) + name.slice(-1)
//   return `${maskedName}@${domain}`
// }
// const maskPhone = (phone = "") => {
//   const digits = phone.replace(/\D/g, "")
//   if (digits.length <= 4) return phone
//   return phone.slice(0, -4).replace(/\d/g, "•") + phone.slice(-4)
// }
// const passwordScore = (pwd = "") => {
//   let s = 0
//   if (pwd.length >= 8) s++
//   if (/[A-Z]/.test(pwd)) s++
//   if (/[a-z]/.test(pwd)) s++
//   if (/\d/.test(pwd)) s++
//   if (/[^\w\s]/.test(pwd)) s++
//   return Math.min(s, 4)
// }
// const scoreToStatus = (s) => (s < 2 ? "exception" : s < 3 ? "normal" : "success")
// const scoreToPercent = (s) => [0, 40, 60, 80, 100][s]

// const OtpSix = ({ value = "", onChange }) => {
//   const inputsRef = useRef([])
//   const [digits, setDigits] = useState(() => {
//     const v = (value || "").replace(/\D/g, "").slice(0, 6)
//     return Array.from({ length: 6 }, (_, i) => v[i] || "")
//   })

//   // sync from parent only when it actually changes (e.g. form reset)
//   const prevValueRef = useRef(value)
//   useEffect(() => {
//     if (value !== prevValueRef.current) {
//       prevValueRef.current = value
//       const v = (value || "").replace(/\D/g, "").slice(0, 6)
//       setDigits(Array.from({ length: 6 }, (_, i) => v[i] || ""))
//     }
//   }, [value])

//   const commit = (arr) => {
//     setDigits(arr)
//     onChange?.(arr.join(""))
//   }

//   const handleInput = (i) => (e) => {
//     const raw = e.currentTarget.value
//     const d = (raw.match(/\d/g) || []).pop() || "" // last digit only
//     const next = digits.slice()
//     next[i] = d
//     commit(next)
//     if (d && i < 5) inputsRef.current[i + 1]?.focus()
//   }

//   const handleKeyDown = (i) => (e) => {
//     if (e.key === "Backspace") {
//       e.preventDefault()
//       const next = digits.slice()
//       if (next[i]) {
//         next[i] = ""
//         commit(next)
//       } else if (i > 0) {
//         inputsRef.current[i - 1]?.focus()
//         next[i - 1] = ""
//         commit(next)
//       }
//     } else if (e.key === "ArrowLeft" && i > 0) {
//       e.preventDefault()
//       inputsRef.current[i - 1]?.focus()
//     } else if (e.key === "ArrowRight" && i < 5) {
//       e.preventDefault()
//       inputsRef.current[i + 1]?.focus()
//     }
//   }

//   const handlePaste = (e) => {
//     const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6)
//     if (!text) return
//     const arr = Array.from({ length: 6 }, (_, i) => text[i] || "")
//     commit(arr)
//     const nextIndex = Math.min(text.length, 5)
//     setTimeout(() => inputsRef.current[nextIndex]?.focus(), 0)
//   }

//   return (
//     <Space onPaste={handlePaste} aria-label="Enter the 6-digit OTP" size={8}>
//       {digits.map((val, i) => (
//         <Input
//           key={i}
//           ref={(el) => (inputsRef.current[i] = el)}
//           value={val}
//           onInput={handleInput(i)}      // immediate, reliable
//           onKeyDown={handleKeyDown(i)}
//           type="tel"
//           inputMode="numeric"
//           pattern="\d*"
//           maxLength={1}
//           aria-label={`OTP digit ${i + 1}`}
//           style={{ width: 40, textAlign: "center", paddingInline: 6 }}
//         />
//       ))}
//     </Space>
//   )
// }

// const SignupForm = ({ onSuccess }) => {
//   const { tokens } = useTheme()
//   const [loading, setLoading] = useState(false)
//   const [verifyLoading, setVerifyLoading] = useState(false)
//   const [form] = Form.useForm()
//   const [otpForm] = Form.useForm()
//   const [isMobile, setIsMobile] = useState(false)

//   const [isOtpStep, setIsOtpStep] = useState(false)
//   const [prospectId, setProspectId] = useState(null)
//   const [otpChannel, setOtpChannel] = useState("SMS")
//   const [resendUntil, setResendUntil] = useState(null)
//   const [lastRegisterPayload, setLastRegisterPayload] = useState(null)

//   const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8096/api/v1"

//   useEffect(() => {
//     const checkMobile = () => setIsMobile(window.innerWidth <= 575)
//     checkMobile()
//     window.addEventListener("resize", checkMobile)
//     return () => window.removeEventListener("resize", checkMobile)
//   }, [])

//   const registerCall = async (payload) => {
//     const { data } = await axios.post(`${BASE_URL}/auth/register`, payload)
//     const pid = data?.data?.prospectId
//     const channel = data?.data?.otpChannel || payload.otpChannel
//     if (!pid) throw new Error("Prospect ID not returned from server")
//     setProspectId(pid)
//     setOtpChannel(channel)
//     setIsOtpStep(true)
//     message.success(data?.message || "OTP sent")
//     setResendUntil(Date.now() + 30_000)
//     return { pid, channel }
//   }

//   const handleSubmit = async (values) => {
//     setLoading(true)
//     try {
//       const payload = {
//         firstName: values.firstName,
//         lastName: values.lastName,
//         gender: String(values.gender || "").toUpperCase(),
//         dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format("YYYY-MM-DD") : null,
//         email: values.email,
//         password: values.password,
//         phoneNumber: `${values.countryCode}${values.phoneNumber}`,
//         roles: values.roles,
//         username: values.username,
//         otpChannel: values.otpChannel || "SMS",
//         parentTenantId: "2e83b3e2-eec3-4d8b-837c-935cb21f7290",
//       }
//       setLastRegisterPayload(payload)
//       await registerCall(payload)
//     } catch (error) {
//       const errorMsg = error?.response?.data?.message || error?.message || "Registration failed. Please try again."
//       message.error(errorMsg)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleVerifyOtp = async ({ otp }) => {
//     if (!prospectId) {
//       message.error("Missing prospect identifier. Please retry signup.")
//       setIsOtpStep(false)
//       return
//     }
//     setVerifyLoading(true)
//     try {
//       const payload = { identifier: prospectId, otp, type: otpChannel }
//       const { data } = await axios.post(`${BASE_URL}/auth/register/verify`, payload)
//       message.success(data?.message || "User created")
//       onSuccess?.()
//     } catch (error) {
//       const errorMsg = error?.response?.data?.message || error?.message || "OTP verification failed. Please try again."
//       message.error(errorMsg)
//     } finally {
//       setVerifyLoading(false)
//     }
//   }

//   const handleResend = async () => {
//     if (!lastRegisterPayload) {
//       message.error("Missing signup details. Please go back and try again.")
//       return
//     }
//     try {
//       await registerCall(lastRegisterPayload)
//       otpForm.resetFields(["otp"])
//     } catch (error) {
//       const errorMsg = error?.response?.data?.message || error?.message || "Could not resend OTP. Please try later."
//       message.error(errorMsg)
//     }
//   }

//   const password = Form.useWatch("password", form)
//   const pwdScore = passwordScore(password)
//   const pwdTips = useMemo(() => {
//     const tips = []
//     if (!/[A-Z]/.test(password || "")) tips.push("uppercase")
//     if (!/[a-z]/.test(password || "")) tips.push("lowercase")
//     if (!/\d/.test(password || "")) tips.push("number")
//     if (!/[^\w\s]/.test(password || "")) tips.push("symbol")
//     return tips
//   }, [password])

//   const firstName = form.getFieldValue("firstName")
//   const username = form.getFieldValue("username")
//   const email = form.getFieldValue("email")
//   const fullPhone = `${form.getFieldValue("countryCode") || ""}${form.getFieldValue("phoneNumber") || ""}`

//   return (
//     <div className="signup-form-container" style={{ maxWidth: 560, margin: "0 auto" }}>
//       <Steps
//         size="small"
//         labelPlacement="vertical"
//         current={isOtpStep ? 1 : 0}
//         items={[{ title: "Account" }, { title: "OTP" }]}
//         style={{ marginBottom: SECTION_GAP }}
//       />

//       {!isOtpStep ? (
//         <Form
//           form={form}
//           name="signup"
//           initialValues={{ agreement: false, otpChannel: "SMS", countryCode: "+91" }}
//           onFinish={handleSubmit}
//           layout="vertical"
//           size={isMobile ? "middle" : "large"}
//           className="auth-form"
//           requiredMark={false}
//           style={{ rowGap: 0 }}
//         >
//           <Row gutter={GRID_GUTTER}>
//             <Col xs={24} md={12}>
//               <Form.Item name="firstName" label="First name" rules={[{ required: true, message: "Enter your first name" }]} style={{ marginBottom: MB }}>
//                 <Input prefix={<UserOutlined />} placeholder="First Name" aria-label="First name" />
//               </Form.Item>
//             </Col>
//             <Col xs={24} md={12}>
//               <Form.Item name="lastName" label="Last name" rules={[{ required: true, message: "Enter your last name" }]} style={{ marginBottom: MB }}>
//                 <Input prefix={<UserOutlined />} placeholder="Last Name" aria-label="Last name" />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Form.Item name="username" label="Username" rules={[{ required: true, message: "Choose a username" }]} style={{ marginBottom: MB }}>
//             <Input prefix={<UserOutlined />} placeholder="Username" aria-label="Username" />
//           </Form.Item>

//           <Row gutter={GRID_GUTTER}>
//             <Col xs={24} md={12}>
//               <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Select gender" }]} style={{ marginBottom: MB }}>
//                 <Select placeholder="Select">
//                   <Option value="MALE">Male</Option>
//                   <Option value="FEMALE">Female</Option>
//                   <Option value="OTHER">Other</Option>
//                 </Select>
//               </Form.Item>
//             </Col>
//             <Col xs={24} md={12}>
//               <Form.Item name="dateOfBirth" label="Date of birth" rules={[{ required: true, message: "Select birth date" }]} style={{ marginBottom: MB }}>
//                 <DatePicker style={{ width: "100%" }} placeholder="Date of Birth" />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Row gutter={GRID_GUTTER}>
//             <Col xs={24} md={12}>
//               <Form.Item name="email" label="Email" rules={[{ required: true, message: "Enter your email" }, { type: "email", message: "Enter a valid email" }]} style={{ marginBottom: MB }}>
//                 <Input prefix={<MailOutlined />} placeholder="email@example.com" aria-label="Email" />
//               </Form.Item>
//             </Col>
//             <Col xs={24} md={12}>
//               <Form.Item label="Phone number" required style={{ marginBottom: MB }}>
//                 <Input.Group compact style={{ display: "flex" }}>
//                   <Form.Item name="countryCode" noStyle rules={[{ required: true, message: "Code" }]}>
//                     <Select style={{ width: "34%" }} showSearch optionFilterProp="children" aria-label="Country code">
//                       {COUNTRY_CODES.map((c) => (
//                         <Option key={c.code} value={c.code}>{c.label}</Option>
//                       ))}
//                     </Select>
//                   </Form.Item>
//                   <Form.Item
//                     name="phoneNumber"
//                     noStyle
//                     rules={[
//                       { required: true, message: "Enter phone number" },
//                       { pattern: /^\d{7,15}$/, message: "7–15 digits, numbers only" },
//                     ]}
//                   >
//                     <Input style={{ width: "66%" }} prefix={<PhoneOutlined />} placeholder="9876543210" inputMode="numeric" aria-label="Phone number" />
//                   </Form.Item>
//                 </Input.Group>
//               </Form.Item>
//             </Col>
//           </Row>

//           <Form.Item name="roles" label="Roles" rules={[{ required: true, message: "Select at least one role" }]} style={{ marginBottom: MB }}>
//             <Select mode="multiple" placeholder="Select roles" maxTagCount="responsive">
//               <Option value="ROLE_USER">User</Option>
//               <Option value="ROLE_ADMIN">Admin</Option>
//               <Option value="ROLE_SUPER_ADMIN">Manager</Option>
//             </Select>
//           </Form.Item>

//           <Row gutter={GRID_GUTTER}>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="password"
//                 label={<Space size={6}>Password <Tooltip title="Use 8+ chars with upper/lowercase, number, and symbol"><InfoCircleOutlined /></Tooltip></Space>}
//                 rules={[{ required: true, message: "Enter a password" }, { min: 8, message: "At least 8 characters" }]}
//                 hasFeedback
//                 style={{ marginBottom: MB }}
//               >
//                 <Input.Password placeholder="Password" aria-label="Password" prefix={<LockOutlined />} />
//               </Form.Item>

//               {password ? (
//                 <div style={{ marginTop: -6, marginBottom: MB }}>
//                   <Progress percent={scoreToPercent(pwdScore)} size="small" status={scoreToStatus(pwdScore)} showInfo={false} />
//                   {pwdTips.length > 0 && (
//                     <Text type="secondary" style={{ fontSize: 12 }}>Improve with: {pwdTips.join(", ")}</Text>
//                   )}
//                 </div>
//               ) : null}
//             </Col>

//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="confirmPassword"
//                 label="Confirm password"
//                 dependencies={["password"]}
//                 hasFeedback
//                 rules={[
//                   { required: true, message: "Confirm your password" },
//                   ({ getFieldValue }) => ({
//                     validator(_, value) {
//                       if (!value || getFieldValue("password") === value) return Promise.resolve()
//                       return Promise.reject(new Error("Passwords do not match"))
//                     },
//                   }),
//                 ]}
//                 style={{ marginBottom: MB }}
//               >
//                 <Input.Password placeholder="Confirm Password" aria-label="Confirm password" prefix={<LockOutlined />} />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Row gutter={GRID_GUTTER}>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="otpChannel"
//                 label="Verification"
//                 rules={[{ required: true, message: "Select method" }]}
//                 style={{ marginBottom: MB }}
//               >
//                 <Select onChange={setOtpChannel} placeholder="Select">
//                   <Option value="SMS">SMS</Option>
//                   <Option value="EMAIL">Email</Option>
//                 </Select>
//               </Form.Item>
//             </Col>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="agreement"
//                 valuePropName="checked"
//                 rules={[
//                   {
//                     validator: (_, value) =>
//                       value ? Promise.resolve() : Promise.reject(new Error("Accept terms to continue")),
//                   },
//                 ]}
//                 style={{ marginBottom: MB }}
//               >
//                 <Checkbox>
//                   I agree to the <a href="/terms">Terms</a> & <a href="/privacy">Privacy</a>
//                 </Checkbox>
//               </Form.Item>
//             </Col>
//           </Row>

//           <Alert
//             type="info"
//             showIcon
//             style={{ marginBottom: MB }}
//             message={<span style={{ fontSize: 12 }}>We’ll send a one-time code to verify your account.</span>}
//           />

//           <Form.Item style={{ marginBottom: 0 }}>
//             <Button type="primary" htmlType="submit" loading={loading} block style={{ borderRadius: 8 }}>
//               Create account & send OTP
//             </Button>
//           </Form.Item>

//           <div style={{ textAlign: "center", marginTop: 8 }}>
//             <Space size="small">
//               <Button icon={<GoogleOutlined />} shape="circle" />
//               <Button icon={<GithubOutlined />} shape="circle" />
//               <Button icon={<FacebookOutlined />} shape="circle" />
//             </Space>
//           </div>
//         </Form>
//       ) : (
//         <Card bordered style={{ maxWidth: 560, margin: "0 auto", borderRadius: 12, boxShadow: tokens.boxShadow }}>
//           <Space direction="vertical" size={SECTION_GAP} style={{ width: "100%" }}>
//             <div>
//               <Title level={5} style={{ marginBottom: 2 }}>
//                 Hi{firstName ? `, ${firstName}` : ""}! Verify your {otpChannel === "SMS" ? "mobile" : "email"}
//               </Title>
//               <Text type="secondary" style={{ fontSize: 12 }}>
//                 Username: <Tag color="geekblue">{username}</Tag>
//               </Text>
//               <div style={{ marginTop: 6 }}>
//                 <Text style={{ fontSize: 13 }}>
//                   Code sent to <b>{otpChannel === "SMS" ? maskPhone(fullPhone) : maskEmail(email)}</b>.
//                 </Text>
//               </div>
//             </div>

//             <Form
//               form={otpForm}
//               layout="vertical"
//               size={isMobile ? "middle" : "large"}
//               onFinish={handleVerifyOtp}
//               initialValues={{ otp: "" }}
//               requiredMark={false}
//               style={{ rowGap: 0 }}
//             >
//               <Form.Item
//                 name="otp"
//                 label="OTP Code"
//                 valuePropName="value"
//                 trigger="onChange"
//                 validateTrigger="onChange"
//                 rules={[
//                   { required: true, message: "Enter the OTP" },
//                   { pattern: /^\d{6}$/, message: "6 digits" },
//                 ]}
//                 style={{ marginBottom: MB }}
//               >
//                 <OtpSix
//                   // bind directly to Form so it re-validates on change
//                   value={otpForm.getFieldValue("otp") || ""}
//                   onChange={(v) => {
//                     otpForm.setFieldsValue({ otp: v })
//                     // auto-submit when complete
//                     if (/^\d{6}$/.test(v)) {
//                       // slight delay so UI updates first
//                       setTimeout(() => otpForm.submit(), 0)
//                     }
//                   }}
//                 />
//               </Form.Item>

//               <Row align="middle" justify="space-between" style={{ marginBottom: MB }}>
//                 <Col>
//                   <Text type="secondary" style={{ fontSize: 12 }}>
//                     {resendUntil && Date.now() < resendUntil ? (
//                       <Space size={4}>
//                         Resend in
//                         <Countdown value={resendUntil} format="s[s]" valueStyle={{ fontSize: 12 }} />
//                       </Space>
//                     ) : (
//                       "Didn’t get the code?"
//                     )}
//                   </Text>
//                 </Col>
//                 <Col>
//                   <Button
//                     type="link"
//                     icon={<ReloadOutlined />}
//                     disabled={!!resendUntil && Date.now() < resendUntil}
//                     onClick={handleResend}
//                     style={{ paddingInline: 0 }}
//                   >
//                     Resend
//                   </Button>
//                 </Col>
//               </Row>

//               <Form.Item style={{ marginBottom: 0 }}>
//                 <Space direction={isMobile ? "vertical" : "horizontal"} style={{ width: "100%" }} size={8}>
//                   <Button onClick={() => setIsOtpStep(false)} block>
//                     Back
//                   </Button>
//                   <Button type="primary" htmlType="submit" loading={verifyLoading} icon={<SafetyCertificateOutlined />} block>
//                     Verify & create
//                   </Button>
//                 </Space>
//               </Form.Item>
//             </Form>

//             <Alert
//               type="info"
//               showIcon
//               message={<span style={{ fontSize: 12 }}>Tip</span>}
//               description={<span style={{ fontSize: 12 }}>Check spam/junk (email) or ensure your number can receive SMS.</span>}
//             />
//           </Space>
//         </Card>
//       )}
//     </div>
//   )
// }

// export default SignupForm



// // "use client"

// // import React, { useState, useEffect } from "react"
// // import {
// //   Form,
// //   Input,
// //   Button,
// //   Checkbox,
// //   DatePicker,
// //   Select,
// //   Divider,
// //   Typography,
// //   Space,
// //   message,
// // } from "antd"
// // import {
// //   UserOutlined,
// //   LockOutlined,
// //   MailOutlined,
// //   PhoneOutlined,
// //   GoogleOutlined,
// //   GithubOutlined,
// //   FacebookOutlined,
// // } from "@ant-design/icons"
// // import axios from "axios"
// // import dayjs from "dayjs"

// // const { Option } = Select

// // const SignupForm = ({ onSuccess }) => {
// //   const [loading, setLoading] = useState(false)
// //   const [form] = Form.useForm()
// //   const [isMobile, setIsMobile] = useState(false)

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

// //   const handleSubmit = async (values) => {
// //     setLoading(true)
// //     try {
// //       const payload = {
// //         firstName: values.firstName,
// //         lastName: values.lastName,
// //         gender: values.gender.toUpperCase(),
// //         dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format("YYYY-MM-DD") : null,
// //         email: values.email,
// //         password: values.password,
// //         phoneNumber: values.phoneNumber,
// //         roles: values.roles,
// //         username: values.username,
// //         parentTenantId: "2e83b3e2-eec3-4d8b-837c-935cb21f7290"
// //       }
// //       console.log(payload);
// //       await axios.post(`${BASE_URL}/auth/register`, payload)

// //       message.success("Account created successfully! Please log in.")
// //       onSuccess()
// //     } catch (error) {
// //       console.error("Signup error:", error)
// //       const errorMsg = error?.response?.data?.message || "Registration failed. Please try again."
// //       message.error(errorMsg)
// //     } finally {
// //       setLoading(false)
// //     }
// //   }

// //   return (
// //     <div className="signup-form-container">
// //       <Form
// //         form={form}
// //         name="signup"
// //         initialValues={{ agreement: false }}
// //         onFinish={handleSubmit}
// //         layout="vertical"
// //         size={isMobile ? "middle" : "large"}
// //         className="auth-form"
// //       >
// //         <Form.Item name="firstName" rules={[{ required: true, message: "Enter your first name" }]}>
// //           <Input prefix={<UserOutlined />} placeholder="First Name" />
// //         </Form.Item>

// //         <Form.Item name="lastName" rules={[{ required: true, message: "Enter your last name" }]}>
// //           <Input prefix={<UserOutlined />} placeholder="Last Name" />
// //         </Form.Item>

// //         <Form.Item name="username" rules={[{ required: true, message: "Choose a username" }]}>
// //           <Input prefix={<UserOutlined />} placeholder="Username" />
// //         </Form.Item>

// //         <Form.Item name="gender" rules={[{ required: true, message: "Select gender" }]}>
// //           <Select placeholder="Gender">
// //             <Option value="MALE">Male</Option>
// //             <Option value="FEMALE">Female</Option>
// //             <Option value="OTHER">Other</Option>
// //           </Select>
// //         </Form.Item>

// //         <Form.Item name="dateOfBirth" rules={[{ required: true, message: "Select birth date" }]}>
// //           <DatePicker style={{ width: "100%" }} placeholder="Date of Birth" />
// //         </Form.Item>

// //         <Form.Item
// //           name="email"
// //           rules={[
// //             { required: true, message: "Enter your email" },
// //             { type: "email", message: "Enter a valid email" },
// //           ]}
// //         >
// //           <Input prefix={<MailOutlined />} placeholder="Email" />
// //         </Form.Item>

// //         <Form.Item name="phoneNumber" rules={[{ required: true, message: "Enter phone number" }]}>
// //           <Input prefix={<PhoneOutlined />} placeholder="Phone Number" />
// //         </Form.Item>

// //         <Form.Item name="roles" rules={[{ required: true, message: "Select at least one role" }]}>
// //           <Select mode="multiple" placeholder="Select roles">
// //             <Option value="ROLE_USER">User</Option>
// //             <Option value="ROLE_ADMIN">Admin</Option>
// //             <Option value="ROLE_SUPER_ADMIN">Manager</Option>
// //           </Select>
// //         </Form.Item>

// //         <Form.Item
// //           name="password"
// //           rules={[
// //             { required: true, message: "Enter a password" },
// //             { min: 8, message: "Password must be at least 8 characters" },
// //           ]}
// //           hasFeedback
// //         >
// //           <Input.Password prefix={<LockOutlined />} placeholder="Password" />
// //         </Form.Item>

// //         <Form.Item
// //           name="confirmPassword"
// //           dependencies={["password"]}
// //           hasFeedback
// //           rules={[
// //             { required: true, message: "Confirm your password" },
// //             ({ getFieldValue }) => ({
// //               validator(_, value) {
// //                 if (!value || getFieldValue("password") === value) {
// //                   return Promise.resolve()
// //                 }
// //                 return Promise.reject(new Error("Passwords do not match"))
// //               },
// //             }),
// //           ]}
// //         >
// //           <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
// //         </Form.Item>

// //         <Form.Item
// //           name="agreement"
// //           valuePropName="checked"
// //           rules={[
// //             {
// //               validator: (_, value) =>
// //                 value ? Promise.resolve() : Promise.reject(new Error("Accept terms to continue")),
// //             },
// //           ]}
// //         >
// //           <Checkbox>
// //             I agree to the <a href="/terms">Terms of Service</a> and{" "}
// //             <a href="/privacy">Privacy Policy</a>
// //           </Checkbox>
// //         </Form.Item>

// //         <Form.Item>
// //           <Button type="primary" htmlType="submit" className="auth-button" loading={loading} block>
// //             Sign Up
// //           </Button>
// //         </Form.Item>

// //         <Divider plain>
// //           <Typography.Text type="secondary">Or sign up with</Typography.Text>
// //         </Divider>

// //         <div className="social-login">
// //           <Space size={isMobile ? "small" : "middle"}>
// //             <Button icon={<GoogleOutlined />} shape="circle" size="large" />
// //             <Button icon={<GithubOutlined />} shape="circle" size="large" />
// //             <Button icon={<FacebookOutlined />} shape="circle" size="large" />
// //           </Space>
// //         </div>
// //       </Form>
// //     </div>
// //   )
// // }

// // export default SignupForm
