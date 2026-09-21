import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Chart render error caught by ChartErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="w-full h-72 flex flex-col items-center justify-center bg-slate-50 rounded-lg p-4 text-center">
            <span className="text-xs font-semibold text-slate-600">Visual chart summary fallback</span>
            <span className="text-[11px] text-slate-400 mt-1">Metrics rendered numerically in leaderboard & data tables</span>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
