import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    const errorDetails = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      component: this.props.name || 'Unknown Component'
    };

    // Store error details in state
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log to console for development
    console.error('ErrorBoundary caught an error:', errorDetails);

    // Send error to backend logging service
    this.logErrorToService(errorDetails);
  }

  logErrorToService = async (errorDetails) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      if (!backendUrl) return;

      await fetch(`${backendUrl}/api/errors/frontend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorDetails)
      });
    } catch (err) {
      console.error('Failed to log error to service:', err);
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportError = () => {
    const errorReport = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      component: this.props.name,
      timestamp: new Date().toISOString()
    };

    // Copy error details to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error details copied to clipboard. Please share this with support.');
      })
      .catch(() => {
        alert(`Error ID: ${this.state.errorId}\nPlease share this ID with support.`);
      });
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                We're sorry, but an unexpected error occurred in the {this.props.name || 'application'}.
              </p>
            </div>

            {/* Error Details */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-3">
                <Bug className="w-5 h-5 text-gray-600 dark:text-gray-300 mr-2" />
                <span className="font-medium text-gray-900 dark:text-white">Error Details</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Error ID:</span>
                  <span className="ml-2 font-mono text-gray-600 dark:text-gray-400">{this.state.errorId}</span>
                </div>
                
                {this.state.error && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Message:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{this.state.error.message}</span>
                  </div>
                )}
                
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Component:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{this.props.name || 'Unknown'}</span>
                </div>
                
                {this.state.retryCount > 0 && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Retry Attempts:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{this.state.retryCount}</span>
                  </div>
                )}
              </div>

              {/* Development Mode Details */}
              {isDevelopment && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                    Technical Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-600 rounded text-xs overflow-auto max-h-40">
                    <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
                disabled={this.state.retryCount >= 3}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {this.state.retryCount >= 3 ? 'Max Retries Reached' : 'Try Again'}
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </button>
              
              <button
                onClick={this.handleReportError}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <Bug className="w-4 h-4 mr-2" />
                Report Error
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">Need help?</span> Try refreshing the page, or contact support with the Error ID above.
                {isDevelopment && ' Check the browser console for more details.'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Higher-order component for wrapping components with error boundaries
export const withErrorBoundary = (Component, componentName) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary name={componentName}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${componentName})`;
  return WrappedComponent;
};

// Hook for manual error reporting
export const useErrorHandler = () => {
  const reportError = (error, context = {}) => {
    const errorDetails = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      errorId: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    console.error('Manual error report:', errorDetails);

    // Send to backend
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    if (backendUrl) {
      fetch(`${backendUrl}/api/errors/frontend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorDetails)
      }).catch(err => {
        console.error('Failed to send error report:', err);
      });
    }

    return errorDetails.errorId;
  };

  return { reportError };
};