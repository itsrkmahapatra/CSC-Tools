'use client'
import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="py-20 text-center text-red-600 bg-red-50 border rounded-xl m-4">
          <h2 className="text-xl font-bold">Tool Error</h2>
          <p>The AI tool encountered a problem. Please ensure the required model file is available or your browser supports WebGPU/WebGL.</p>
        </div>
      )
    }
    return this.props.children
  }
}
