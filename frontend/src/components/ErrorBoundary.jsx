import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
          <p className="text-gray-600 text-sm max-w-sm text-center">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-navy-500 text-white rounded"
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
