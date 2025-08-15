import axios from "axios"

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8084"

// export async function getDeviceList({ tenantId, page = 0, size = 20 }) {
  
//   const res = await axios.get(`${API_URL}/api/v1/devices`, {
//     params: { tenantId, page, size },
//   })
//   // Response: { content, totalElements, ... }
//   return res.data
// }
export async function getDeviceList({ tenantId, page = 0, size = 20, withProfile = false }) {
  const res = await axios.get(`${API_URL}/api/v1/devices`, {
    params: { tenantId, page, size, withProfile },
  })
  return res.data
}

export async function getDeviceById(id, { withProfile = false } = {}) {
  const res = await axios.get(`${API_URL}/api/v1/devices/${id}`, {
    params: { withProfile },
  })
  return res.data
}

export async function addDevice(device) {
  console.log(device)
  const res = await axios.post(`${API_URL}/api/v1/devices`, device)
  return res.data
}

export async function listLabels() {
  const res = await axios.get(`${API_URL}/api/v1/labels`)
  return res.data
}

export async function listCustomers() {
  const res = await axios.get(`${API_URL}/api/v1/customers`)
  return res.data
}

// export async function getDeviceProfileInputs(deviceId) {
//   const res = await axios.get(`${API_URL}/api/v1/devices/${deviceId}`, {
//     params: { withProfile: true }
//   })
//   return res.data?.profile?.inputs || []
// }

// // List devices (paged, adjust as needed)
// export async function listDevices({ tenantId, page = 0, size = 100 }) {
//   tenantId = "e63e1c4a-5b4c-42e9-91f2-1d682b0a5d02"
//   // You must provide a valid tenantId
//   const res = await axios.get(`${API_URL}/api/v1/devices`, {
//     params: { tenantId, page, size }
//   })
//   return res.data
// }


export async function listDevices({ tenantId, page = 0, size = 100 }) {
  if (!tenantId) throw new Error("No tenantId provided")
  const resp = await axios.get(
    `${API_URL}/api/v1/devices`,
    { params: { tenantId, page, size } }
  )
  return resp.data
}

export async function getDeviceProfileInputs(deviceId) {
  if (!deviceId) return []
  const deviceResp = await axios.get(`${API_URL}/api/v1/devices/${deviceId}`)
  const device = deviceResp.data
  const profileId = device.deviceProfileId
  if (!profileId) return []
  const profileResp = await axios.get(`${API_URL}/api/device-profiles/${profileId}`)
  const profile = profileResp.data
  return Array.isArray(profile.inputs) ? profile.inputs : []
}
