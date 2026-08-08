import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '80vh',
          gap: '24px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <div style={{
            background: 'rgba(244, 67, 54, 0.08)',
            border: '1px solid rgba(244, 67, 54, 0.25)',
            borderRadius: '20px',
            padding: '40px 48px',
            maxWidth: '520px',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{
              color: '#ff8a80',
              fontSize: '22px',
              fontWeight: 800,
              marginBottom: '12px',
            }}>
              Something went wrong
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '14px',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}>
              {this.state.error?.message || 'An unexpected error occurred in the dashboard.'}
            </p>
            <button
              onClick={this.handleReload}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
            >
              🔄 Reload Dashboard
            </button>
            {this.state.errorInfo && (
              <details style={{ marginTop: '20px', textAlign: 'left' }}>
                <summary style={{ color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>
                  Technical details
                </summary>
                <pre style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  overflow: 'auto',
                  marginTop: '8px',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '10px',
                  borderRadius: '6px',
                  maxHeight: '150px',
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
