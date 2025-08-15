"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import { Card, Button } from "antd"
import { MapContainer, TileLayer, Polyline, Polygon, Circle, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster" // must be after L import
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import "leaflet.markercluster/dist/MarkerCluster.css"

// ---- Marker icon config ----
const defaultIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [28, 46],
  iconAnchor: [14, 46],
  popupAnchor: [0, -40],
  shadowSize: [45, 45],
})

// ---- Tile layers (light/dark) ----
const TILE_LAYERS = {
  light: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  dark: "https://tiles.stadiamaps.com/tiles/alidade_dark/{z}/{x}/{y}{r}.png",
}

// ---- India bounding box ----
const INDIA_BOUNDS = [
  [6.5546079, 68.1113787],    // Southwest
  [35.6745457, 97.395561]     // Northeast
]

// ---- Utility: Strip all non-serializable props ----
export function getSafeWidgetConfig(config) {
  const safe = {}
  if (Array.isArray(config.markers)) {
    safe.markers = config.markers.map(({ id, lat, lng, name, status, type, lastSeen }) =>
      ({ id, lat, lng, name, status, type, lastSeen })
    )
  }
  if (Array.isArray(config.polylines)) safe.polylines = config.polylines
  if (Array.isArray(config.polygons)) safe.polygons = config.polygons
  if (Array.isArray(config.circles)) safe.circles = config.circles
  if (typeof config.title === "string") safe.title = config.title
  if (typeof config.theme === "string") safe.theme = config.theme
  if (typeof config.height === "string") safe.height = config.height
  if (
    Array.isArray(config.countryBounds) &&
    config.countryBounds.length === 2 &&
    config.countryBounds[0].length === 2 &&
    config.countryBounds[1].length === 2
  ) {
    safe.countryBounds = config.countryBounds
  }
  return safe
}

// ---- Auto-fit helper ----
function AutoFit({ bounds, triggerKey }) {
  const map = useMap()
  useEffect(() => {
    if (
      bounds &&
      Array.isArray(bounds) &&
      bounds.length === 2 &&
      bounds[0].length === 2 &&
      bounds[1].length === 2 &&
      bounds[0][0] !== bounds[1][0] &&
      bounds[0][1] !== bounds[1][1]
    ) {
      map.fitBounds(bounds, { padding: [20, 20], animate: true, maxZoom: 12 })
    }
  }, [triggerKey, bounds, map])
  return null
}

// ---- MarkerCluster JSX Layer (robust cleanup) ----
function MarkerClusterLayer({ markers }) {
  const map = useMap()
  const clusterGroupRef = useRef(null)

  useEffect(() => {
    if (!map) return
    if (clusterGroupRef.current && map.hasLayer(clusterGroupRef.current)) {
      try {
        clusterGroupRef.current.clearLayers()
        map.removeLayer(clusterGroupRef.current)
      } catch (e) {}
    }
    if (!Array.isArray(markers) || markers.length === 0) return
    const cluster = L.markerClusterGroup()
    markers.forEach(marker => {
      if (
        marker &&
        typeof marker.lat === "number" &&
        typeof marker.lng === "number" &&
        !isNaN(marker.lat) &&
        !isNaN(marker.lng)
      ) {
        const m = L.marker([marker.lat, marker.lng], { icon: defaultIcon })
          .bindPopup(
            `<b>${marker.name || "Device"}</b><br/>Type: ${marker.type || "-"}<br/>Status: ${marker.status || "-"}<br/>Last seen: ${marker.lastSeen ? new Date(marker.lastSeen).toLocaleString() : "-"}`
          )
        cluster.addLayer(m)
      }
    })
    cluster.addTo(map)
    clusterGroupRef.current = cluster
    return () => {
      if (clusterGroupRef.current && map.hasLayer(clusterGroupRef.current)) {
        try {
          clusterGroupRef.current.clearLayers()
          map.removeLayer(clusterGroupRef.current)
        } catch (e) {}
      }
    }
  }, [markers, map])
  return null
}

const OSMMapWidget = ({
  title = "India - Industry OSM Map",
  theme = "dark",
  height = "500px",
  markers: markersProp,
  polylines: polylinesProp,
  polygons: polygonsProp,
  circles: circlesProp,
  style = {},
  countryBounds = INDIA_BOUNDS,
}) => {
  // Demo: Animated marker state for demo if no markers prop is provided
  const [trackedMarkers, setTrackedMarkers] = useState([
    { id: 1, lat: 28.7041, lng: 77.1025, name: "Delhi Node", status: "online", type: "gateway", lastSeen: Date.now() },
    { id: 2, lat: 19.076, lng: 72.8777, name: "Mumbai Device", status: "offline", type: "sensor", lastSeen: Date.now() - 3600000 },
    { id: 3, lat: 13.0827, lng: 80.2707, name: "Chennai Asset", status: "online", type: "asset", lastSeen: Date.now() }
  ])

  // Use props or demo data, and sanitize all features for edge cases
  const markers = useMemo(
    () => (Array.isArray(markersProp) && markersProp.length > 0 ? markersProp : trackedMarkers),
    [markersProp, trackedMarkers]
  )
  const polylines = useMemo(
    () => (Array.isArray(polylinesProp) && polylinesProp.length > 0 ? polylinesProp : [
      [
        [28.7041, 77.1025],
        [26.9124, 75.7873],
        [23.0225, 72.5714],
        [19.076, 72.8777]
      ]
    ]),
    [polylinesProp]
  )
  const polygons = useMemo(
    () => (Array.isArray(polygonsProp) && polygonsProp.length > 0 ? polygonsProp : [
      [
        [19.08, 72.87],
        [19.15, 72.80],
        [19.12, 73.00]
      ]
    ]),
    [polygonsProp]
  )
  const circles = useMemo(
    () => (Array.isArray(circlesProp) && circlesProp.length > 0 ? circlesProp : [
      { center: [13.0827, 80.2707], radius: 20000 }
    ]),
    [circlesProp]
  )

  // All coords for bounds (if needed)
  const bounds = countryBounds
  // shapeHash only includes primitive/array values!
  const shapeHash = useMemo(() => {
    return JSON.stringify({
      markerIds: Array.isArray(markers) ? markers.map(m => m.id).sort() : [],
      markerCount: Array.isArray(markers) ? markers.length : 0,
      polylineCount: Array.isArray(polylines) ? polylines.length : 0,
      polygonCount: Array.isArray(polygons) ? polygons.length : 0,
      circleCount: Array.isArray(circles) ? circles.length : 0
    })
  }, [markers, polylines, polygons, circles])

  // Center on the country's bounds center
  const mapCenter = useMemo(
    () => [
      (bounds[0][0] + bounds[1][0]) / 2,
      (bounds[0][1] + bounds[1][1]) / 2
    ],
    [bounds]
  )

  // Live tracking: animate marker 1 every 2s
  useEffect(() => {
    const timer = setInterval(() => {
      setTrackedMarkers(prev =>
        prev.map(m =>
          m.id === 1
            ? {
                ...m,
                lat: m.lat + (Math.random() - 0.5) * 0.008,
                lng: m.lng + (Math.random() - 0.5) * 0.008,
                lastSeen: Date.now()
              }
            : m
        )
      )
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <Card
      title={title}
      style={{
        height,
        ...style,
        background: theme === "dark" ? "#181f2b" : "#fff"
      }}
      bodyStyle={{ padding: 0, height: "100%" }}
      bordered
      extra={
        <Button size="small" onClick={() => setTrackedMarkers(markers)}>
          Reset
        </Button>
      }
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: 240,
          background: "#dbeafe"
        }}
      >
        <MapContainer
          center={mapCenter}
          bounds={bounds}
          style={{ width: "100%", height: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            url={theme === "dark" ? TILE_LAYERS.dark : TILE_LAYERS.light}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {/* AutoFit to country bounds on data shape change */}
          {bounds && <AutoFit bounds={bounds} triggerKey={shapeHash} />}

          {/* --- Polylines --- */}
          {polylines.map(
            (poly, i) =>
              Array.isArray(poly) && poly.length > 1 && (
                <Polyline
                  key={i}
                  positions={poly}
                  color="#ff9800"
                  weight={4}
                  dashArray="8 8"
                />
              )
          )}
          {/* --- Polygons --- */}
          {polygons.map(
            (polygon, i) =>
              Array.isArray(polygon) && polygon.length > 2 && (
                <Polygon
                  key={i}
                  positions={polygon}
                  color="#13c2c2"
                  fillOpacity={0.12}
                  weight={3}
                />
              )
          )}
          {/* --- Circles --- */}
          {circles.map(
            (circle, i) =>
              circle &&
              Array.isArray(circle.center) &&
              circle.center.length === 2 && (
                <Circle
                  key={i}
                  center={circle.center}
                  radius={circle.radius}
                  pathOptions={{ color: "#ffa39e", fillOpacity: 0.08 }}
                />
              )
          )}

          {/* --- Clusters (markers only, via side effect) --- */}
          <MarkerClusterLayer markers={markers} />
        </MapContainer>
      </div>
    </Card>
  )
}

export default OSMMapWidget
