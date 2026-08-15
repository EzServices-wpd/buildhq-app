"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

/** Catches WebGL / R3F runtime failures so the rest of the app stays usable */
export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-100 p-6">
          <div className="max-w-md text-center text-sm text-slate-700">
            <p className="font-semibold text-slate-900 mb-2">
              3D view could not start
            </p>
            <p className="text-xs text-slate-500 mb-3">
              {this.state.message ||
                "Your browser may block WebGL, or GPU acceleration is unavailable."}
            </p>
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded bg-sky-600 text-white"
              onClick={() => this.setState({ hasError: false })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
