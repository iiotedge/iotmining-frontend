import axios from "axios"

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8101"

export async function getDeviceObjectHistory({
  tenantId,
  deviceId,
  category = "CAMERA",
  objectType = "snapshot",
  page = 0,
  size = 10,
}) {
  // Returns: { data: { ... } }
  const res = await axios.get(`${API_URL}/api/objects/history`, {
    params: { tenantId, deviceId, category, objectType, page, size },
  });
  // -- BEGIN: Fix for double "data" --
  // So res.data = { data: [...], ... }
  // You want to return just that inner .data object (not the whole axios response)
  if (res.data && Array.isArray(res.data.data)) {
    return res.data;
  } else if (res.data && res.data.data && Array.isArray(res.data.data.data)) {
    // In case you had triple nesting (rare but possible if wrapped), unwrap more
    return res.data.data;
  }
  // fallback (bad data)
  return { data: [] }
}
