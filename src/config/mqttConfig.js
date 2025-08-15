const MQTT_CONFIG = {
  // Use public Mosquitto broker over WebSocket (unsecured). For secured, use "wss://test.mosquitto.org:8081"
  brokerUrl: process.env.REACT_APP_MQTT_BROKER_URL || "ws://broker.emqx.io:8083/mqtt" || "ws://test.mosquitto.org:8080",   //broker.emqx.io
  options: {
    keepalive: 30,
    clean: true,
    reconnectPeriod: 1000, // auto-reconnect every second
    // clientId: 'your-app-' + Math.random().toString(16).substr(2, 8),
    // protocolVersion: 4, // MQTT v3.1.1; set 5 for MQTT 5 if needed
    // username: undefined, // Not required for public broker
    // password: undefined,
  },
  defaultTopicPrefix: "", // Set if you want a prefix for all topics
}

export default MQTT_CONFIG


// const MQTT_CONFIG = {
//   // Use public EMQX broker over WebSocket (unsecured). For secured, use "wss://broker.emqx.io:8084/mqtt"
//   brokerUrl: process.env.REACT_APP_MQTT_BROKER_URL || "ws://broker.emqx.io:8083/mqtt",
//   options: {
//     keepalive: 30,
//     // username: "your-username", // Uncomment if needed
//     // password: "your-password",
//     clean: true,
//     reconnectPeriod: 1000, // auto-reconnect every second
//     // clientId: 'your-app-' + Math.random().toString(16).substr(2, 8),
//     // protocolVersion: 4, // MQTT v3.1.1; set 5 for MQTT 5 if needed
//   },
//   defaultTopicPrefix: "", // For example, "kepler/prod/"
// }

// export default MQTT_CONFIG
