"use client"

import React, { useState, useEffect } from "react"
import { Card, Spin, theme as antdTheme } from "antd"

const MapWidget = ({ title = "Map", data = null, theme = "light", height = "300px" }) => {
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapContainerId = `map-${Math.random().toString(36).substring(2, 9)}`

  const locations = data || [
    { lat: 37.7749, lng: -122.4194, title: "San Francisco" },
    { lat: 40.7128, lng: -74.006, title: "New York" },
    { lat: 34.0522, lng: -118.2437, title: "Los Angeles" },
    { lat: 41.8781, lng: -87.6298, title: "Chicago" },
  ]

  const {
    token: { colorText, colorBgContainer },
  } = antdTheme.useToken()

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyC5N3el2tz1VuBW3Q_YkLwIUptfJXue-4k&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => {
        setMapLoaded(true)
      }
      document.head.appendChild(script)
    } else {
      setMapLoaded(true)
    }

    return () => {
      // Cleanup if needed
    }
  }, [])

  useEffect(() => {
    if (mapLoaded && window.google) {
      const map = new window.google.maps.Map(document.getElementById(mapContainerId), {
        center: { lat: 37.7749, lng: -122.4194 },
        zoom: 4,
        styles: theme === "dark" ? darkMapStyle : [],
      })

      locations.forEach((location) => {
        const marker = new window.google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map,
          title: location.title,
        })

        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div><strong>${location.title}</strong></div>`,
        })

        marker.addListener("click", () => {
          infoWindow.open(map, marker)
        })
      })
    }
  }, [mapLoaded, locations, mapContainerId, theme])

  // Dark mode Google Map style (optional)
  const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }],
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ]

  // Safe fallback map in case Google Maps fails or is loading
  const renderFallbackMap = () => (
    <div
      style={{
        height,
        background: theme === "dark" ? "#141414" : "#f0f2f5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        color: theme === "dark" ? "#ddd" : "#333",
        fontSize: 14,
      }}
    >
      <Spin tip="Loading map..." />
      <div style={{ marginTop: 12, textAlign: "center" }}>
        {locations.map((loc, i) => {
          let latStr = "N/A"
          let lngStr = "N/A"
          try {
            latStr = typeof loc.lat === "number" ? loc.lat.toFixed(2) : loc.lat || "N/A"
            lngStr = typeof loc.lng === "number" ? loc.lng.toFixed(2) : loc.lng || "N/A"
          } catch {
            // Ignore error
          }
          return (
            <div key={i}>
              {loc.title || "Unknown Location"} ({latStr}, {lngStr})
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <Card
      title={title}
      bordered={true}
      style={{
        height: "100%",
        backgroundColor: theme === "dark" ? "#1f1f1f" : colorBgContainer,
      }}
      bodyStyle={{ padding: 0, height: height }}
      className={theme === "dark" ? "widget-theme-dark" : ""}
    >
      <div id={mapContainerId} style={{ height: "100%", width: "100%" }}>
        {!mapLoaded && renderFallbackMap()}
      </div>
    </Card>
  )
}

export default MapWidget



// "use client"

// import { useState, useEffect } from "react"
// import { Card, Typography } from "antd"

// const { Title } = Typography

// const MapWidget = ({ title = "Map", data = null }) => {
//   const [mapLoaded, setMapLoaded] = useState(false)
//   const mapContainerId = `map-${Math.random().toString(36).substring(2, 9)}`

//   // Sample data points
//   const locations = data || [
//     { lat: 37.7749, lng: -122.4194, title: "San Francisco" },
//     { lat: 40.7128, lng: -74.006, title: "New York" },
//     { lat: 34.0522, lng: -118.2437, title: "Los Angeles" },
//     { lat: 41.8781, lng: -87.6298, title: "Chicago" },
//   ]

//   useEffect(() => {
//     // Load Google Maps API script
//     if (!window.google) {
//       const script = document.createElement("script")
//       script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places`
//       script.async = true
//       script.defer = true
//       script.onload = () => {
//         setMapLoaded(true)
//       }
//       document.head.appendChild(script)
//     } else {
//       setMapLoaded(true)
//     }

//     return () => {
//       // Clean up if needed
//     }
//   }, [])

//   useEffect(() => {
//     if (mapLoaded && window.google) {
//       // Initialize the map
//       const map = new window.google.maps.Map(document.getElementById(mapContainerId), {
//         center: { lat: 37.7749, lng: -122.4194 },
//         zoom: 4,
//       })

//       // Add markers for each location
//       locations.forEach((location) => {
//         const marker = new window.google.maps.Marker({
//           position: { lat: location.lat, lng: location.lng },
//           map,
//           title: location.title,
//         })

//         // Add info window
//         const infoWindow = new window.google.maps.InfoWindow({
//           content: `<div><strong>${location.title}</strong></div>`,
//         })

//         marker.addListener("click", () => {
//           infoWindow.open(map, marker)
//         })
//       })
//     }
//   }, [mapLoaded, locations, mapContainerId])

//   // Fallback to a simple map representation if Google Maps API is not loaded
//   const renderFallbackMap = () => {
//     return (
//       <div
//         style={{
//           height: "100%",
//           minHeight: "300px",
//           background: "#f0f2f5",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           flexDirection: "column",
//           padding: "20px",
//         }}
//       >
//         <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗺️</div>
//         <div>Map loading...</div>
//         <div style={{ marginTop: "10px", fontSize: "12px" }}>
//           {locations.map((loc, idx) => (
//             <div key={idx}>
//               {loc.title} ({loc.lat.toFixed(2)}, {loc.lng.toFixed(2)})
//             </div>
//           ))}
//         </div>
//       </div>
//     )
//   }

//   return (
//     <Card title={title} bordered={true} style={{ height: "100%" }}>
//       <div id={mapContainerId} style={{ height: "300px", width: "100%" }}>
//         {!mapLoaded && renderFallbackMap()}
//       </div>
//     </Card>
//   )
// }

// export default MapWidget
