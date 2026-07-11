"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-[var(--color-f1-red)]/10 border border-[var(--color-f1-red)]/20 rounded-xl">
          <AlertTriangle className="w-8 h-8 text-[var(--color-f1-red)] mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">Something went wrong in this component</h3>
          <p className="text-sm text-gray-400 text-center max-w-md mb-6">
            {this.state.error?.message || "An unexpected error occurred while rendering this component."}
            <br />
            Other parts of the page are still usable.
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-2)] hover:bg-[var(--color-border-strong)] text-white rounded-md transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
