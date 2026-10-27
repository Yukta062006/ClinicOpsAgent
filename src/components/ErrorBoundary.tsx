import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ClinicOps Error Boundary caught an error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 font-sans">
          <div className="bg-white border border-[#E2ECE4] rounded-3xl p-8 max-w-lg w-full text-center shadow-lg">
            <div className="w-14 h-14 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="font-serif font-bold text-xl text-[#1B3E2F] mb-2">
              {this.props.fallbackTitle || 'Unable to load module'}
            </h3>
            
            <p className="text-xs text-[#5A6D62] leading-relaxed mb-6">
              A temporary display issue occurred while rendering this healthcare section. Your patient records and session data remain secure.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl bg-[#1B3E2F] text-white text-xs font-semibold hover:bg-[#143024] transition-colors shadow-xs"
              >
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-5 py-2.5 rounded-xl border border-[#E2ECE4] bg-[#FAF9F5] text-[#1E2D25] text-xs font-semibold hover:bg-[#EFF5EE] transition-colors"
              >
                Return to Workspace
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
