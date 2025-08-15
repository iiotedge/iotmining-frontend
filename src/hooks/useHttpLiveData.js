import { useEffect, useState, useRef } from "react"

/**
 * useHttpLiveData
 * @param {string} url - API endpoint
 * @param {Array} telemetryKeys - Keys to extract from the response
 * @param {number} pollInterval - ms between fetches (0 = once)
 * @returns {Array} [{...}] - Array of latest data objects
 */
export function useHttpLiveData({ url, telemetryKeys = [], pollInterval = 0 }) {
  const [data, setData] = useState([])
  const intervalRef = useRef()

  useEffect(() => {
    if (!url || !telemetryKeys.length) {
      setData([])
      return
    }

    let active = true

    const fetchData = async () => {
      try {
        const resp = await fetch(url)
        const json = await resp.json()
        // Support: single object or array of objects
        const row = Array.isArray(json) ? json[json.length - 1] : json
        const entry = {}
        telemetryKeys.forEach((k) => {
          entry[k] = row[k]
        })
        if (active) setData([entry])
      } catch (e) {
        console.error("[useHttpLiveData] Error fetching:", e)
        if (active) setData([])
      }
    }

    fetchData()
    if (pollInterval > 0) {
      intervalRef.current = setInterval(fetchData, pollInterval)
    }
    return () => {
      active = false
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [url, JSON.stringify(telemetryKeys), pollInterval])

  return data
}
