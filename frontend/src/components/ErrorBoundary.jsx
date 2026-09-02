import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ERROR BOUNDARY]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, fontFamily: 'monospace', background: '#fee2e2', color: '#991b1b', minHeight: '100vh', whiteSpace: 'pre-wrap' }}>
          <h1 style={{ color: '#7f1d1d', fontSize: 18 }}>React Error Caught</h1>
          <p><strong>Error:</strong> {this.state.error?.message}</p>
          <p><strong>Stack:</strong></p>
          <pre style={{ fontSize: 11, overflow: 'auto', maxHeight: 400, background: '#fecaca', padding: 10, borderRadius: 4 }}>{this.state.error?.stack}</pre>
          {this.state.errorInfo && (
            <>
              <p><strong>Component Stack:</strong></p>
              <pre style={{ fontSize: 11, overflow: 'auto', maxHeight: 300, background: '#fecaca', padding: 10, borderRadius: 4 }}>{this.state.errorInfo.componentStack}</pre>
            </>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
