"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an exception:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <Alert variant="destructive" className="border-2 border-destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-lg font-bold">GUI Environment Exception</AlertTitle>
            <AlertDescription className="mt-2 text-sm">
              <p className="font-semibold">The production interface has encountered a runtime error:</p>
              <code className="mt-2 block p-2 bg-destructive/10 rounded font-mono text-xs">
                {this.state.error?.message || "Unknown Terminal Exception"}
              </code>
              <p className="mt-4 text-xs">
                Please attempt to refresh the page or contact your Global Administrator if the issue persists.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;