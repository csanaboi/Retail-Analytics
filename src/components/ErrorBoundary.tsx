import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-xl p-5 border border-amber-200 shadow-xs flex flex-col items-center justify-center text-center space-y-3 min-h-[220px]">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-full">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              {this.props.fallbackTitle || 'Component Rendering Notice'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              An unexpected render issue occurred with this section. Raw data and table views remain fully operational.
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
