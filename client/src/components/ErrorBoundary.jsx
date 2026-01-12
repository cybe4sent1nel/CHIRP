import React from 'react';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ [ERROR BOUNDARY] ERROR CAUGHT:', error);
    console.error('❌ [ERROR BOUNDARY] Error message:', error?.message);
    console.error('❌ [ERROR BOUNDARY] Error stack:', error?.stack);
    console.error('❌ [ERROR BOUNDARY] Component stack:', errorInfo?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // TEMPORARY: Show error instead of redirecting
      console.error('🔴 [ERROR BOUNDARY] Rendering error page (not redirecting)');
      return (
        <div style={{
          padding: '40px 20px',
          backgroundColor: '#fff3cd',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ maxWidth: '900px', width: '100%' }}>
            <div style={{
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h1 style={{ color: '#721c24', marginTop: 0, marginBottom: '10px' }}>
                ⚠️ Application Error (Caught by ErrorBoundary)
              </h1>
            </div>

            <div style={{
              backgroundColor: 'white',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginTop: 0, color: '#333' }}>Error Details</h3>
              <p><strong>Error Type:</strong> {this.state.error?.name || 'Unknown'}</p>
              <p><strong>Error Message:</strong></p>
              <pre style={{
                background: '#f5f5f5',
                padding: '15px',
                borderRadius: '4px',
                overflow: 'auto',
                color: '#d32f2f',
                wordBreak: 'break-word'
              }}>
                {this.state.error?.message || 'No message'}
              </pre>
              
              <h4>Stack Trace:</h4>
              <pre style={{
                background: '#f5f5f5',
                padding: '15px',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
                maxHeight: '400px',
                color: '#333',
                border: '1px solid #ddd'
              }}>
                {this.state.error?.stack || 'No stack trace'}
              </pre>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 30px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                🔄 Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;