import React from "react"

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
    // log error if needed
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: "red", padding: 16 }}>
          <b>Widget crashed</b>
          <div style={{ fontSize: 12 }}>This widget could not be displayed.</div>
        </div>
      )
    }
    return this.props.children
  }
}
