import axios from "axios"

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8090"

export async function listDeviceProfiles() {
  const res = await axios.get(`${API_URL}/api/device-profiles`)
  return res.data
}

export async function getDeviceProfileById(id) {
  const res = await axios.get(`${API_URL}/api/device-profiles/${id}`)
  return res.data
}

export async function createDeviceProfile(profile) {
  const res = await axios.post(`${API_URL}/api/device-profiles`, profile)
  return res.data
}

// add more as needed: update, delete...
