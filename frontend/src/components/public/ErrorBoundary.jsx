import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="text-center max-w-md">
            <h1 className="font-heading font-bold text-3xl text-foreground mb-4">
              Something went wrong
            </h1>
            <p className="text-muted-foreground mb-6">
              An unexpected error occurred. Please refresh or contact us directly.
            </p>
            <a aria-label="Call Enix Exteriors" href="tel:+18656853649" className="text-navy-500 font-semibold underline">
              (865) 685-ENIX
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
