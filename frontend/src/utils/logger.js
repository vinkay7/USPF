/**
 * Frontend logging system for USPF Inventory Management System
 * Provides structured logging, performance monitoring, and error tracking
 */

import React from 'react';

class FrontendLogger {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.backendUrl = process.env.REACT_APP_BACKEND_URL;
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.logQueue = [];
    this.maxQueueSize = 100;
    this.flushInterval = 5000; // 5 seconds
    
    // Start log flushing interval
    if (this.backendUrl) {
      setInterval(() => this.flushLogs(), this.flushInterval);
    }
    
    // Listen for page unload to flush remaining logs
    window.addEventListener('beforeunload', () => this.flushLogs(true));
  }
  
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  setUserId(userId) {
    this.userId = userId;
  }
  
  createLogEntry(level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
      pathname: window.location.pathname,
      userAgent: navigator.userAgent,
      data,
      performance: this.getPerformanceMetrics()
    };
    
    // Console logging for development
    if (!this.isProduction) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${level.toUpperCase()}]`, message, data);
    }
    
    return logEntry;
  }
  
  getPerformanceMetrics() {
    if (typeof performance !== 'undefined') {
      return {
        navigation: performance.timing ? {
          domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
          loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
        } : null,
        memory: performance.memory ? {
          usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024), // MB
          totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024), // MB
          jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) // MB
        } : null
      };
    }
    return null;
  }
  
  addToQueue(logEntry) {
    this.logQueue.push(logEntry);
    
    // Prevent queue from growing too large
    if (this.logQueue.length > this.maxQueueSize) {
      this.logQueue.shift(); // Remove oldest entry
    }
    
    // Flush immediately for errors in production
    if (logEntry.level === 'error' && this.isProduction) {
      this.flushLogs();
    }
  }
  
  async flushLogs(immediate = false) {
    if (this.logQueue.length === 0 || !this.backendUrl) return;
    
    const logsToSend = [...this.logQueue];
    this.logQueue = [];
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), immediate ? 1000 : 5000);
      
      await fetch(`${this.backendUrl}/api/logs/frontend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToSend }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
    } catch (error) {
      // If sending fails, put logs back in queue (but don't let it grow infinitely)
      if (this.logQueue.length < this.maxQueueSize / 2) {
        this.logQueue.unshift(...logsToSend.slice(-10)); // Keep only last 10 if failed
      }
      
      if (!this.isProduction) {
        console.warn('Failed to send logs to backend:', error);
      }
    }
  }
  
  // Public logging methods
  info(message, data = {}) {
    const logEntry = this.createLogEntry('info', message, data);
    this.addToQueue(logEntry);
  }
  
  warn(message, data = {}) {
    const logEntry = this.createLogEntry('warn', message, data);
    this.addToQueue(logEntry);
  }
  
  error(message, error = null, data = {}) {
    const errorData = {
      ...data,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : null
    };
    
    const logEntry = this.createLogEntry('error', message, errorData);
    this.addToQueue(logEntry);
  }
  
  debug(message, data = {}) {
    if (!this.isProduction) {
      const logEntry = this.createLogEntry('debug', message, data);
      this.addToQueue(logEntry);
    }
  }
  
  // Performance tracking
  startTimer(operationName) {
    const startTime = performance.now();
    return {
      end: (data = {}) => {
        const duration = performance.now() - startTime;
        this.info(`Operation completed: ${operationName}`, {
          operation: operationName,
          duration_ms: Math.round(duration),
          ...data
        });
        return duration;
      }
    };
  }
  
  // User interaction tracking
  trackUserAction(action, target, data = {}) {
    this.info(`User action: ${action}`, {
      action_type: 'user_interaction',
      action,
      target,
      ...data
    });
  }
  
  // API call logging
  trackApiCall(method, url, status, duration, data = {}) {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    this.createLogEntry(level, `API ${method} ${url}`, {
      api_call: {
        method,
        url,
        status,
        duration_ms: Math.round(duration),
        ...data
      }
    });
  }
  
  // Page navigation tracking
  trackPageView(pathname, data = {}) {
    this.info(`Page view: ${pathname}`, {
      page_view: {
        pathname,
        referrer: document.referrer,
        ...data
      }
    });
  }
}

// Global logger instance
const logger = new FrontendLogger();

// Performance monitoring decorator for React components
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return React.forwardRef((props, ref) => {
    const renderTimer = React.useRef(null);
    
    React.useEffect(() => {
      // Component mounted
      if (renderTimer.current) {
        renderTimer.current.end({ component: componentName, lifecycle: 'mount' });
      }
      
      logger.debug(`Component mounted: ${componentName}`);
      
      return () => {
        // Component unmounted
        logger.debug(`Component unmounted: ${componentName}`);
      };
    }, []);
    
    // Start render timer
    if (!renderTimer.current) {
      renderTimer.current = logger.startTimer(`render_${componentName}`);
    }
    
    return <WrappedComponent ref={ref} {...props} />;
  });
};

// React hook for logging
export const useLogger = () => {
  const trackAction = React.useCallback((action, data = {}) => {
    logger.trackUserAction(action, 'hook', data);
  }, []);
  
  const logError = React.useCallback((message, error, data = {}) => {
    logger.error(message, error, data);
  }, []);
  
  const logInfo = React.useCallback((message, data = {}) => {
    logger.info(message, data);
  }, []);
  
  return {
    trackAction,
    logError,
    logInfo,
    startTimer: logger.startTimer.bind(logger),
    trackPageView: logger.trackPageView.bind(logger)
  };
};

// API interceptor for automatic logging
export const createApiInterceptor = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async function(url, options = {}) {
    const startTime = performance.now();
    const method = options.method || 'GET';
    
    try {
      const response = await originalFetch(url, options);
      const duration = performance.now() - startTime;
      
      logger.trackApiCall(method, url, response.status, duration, {
        success: response.ok
      });
      
      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      logger.trackApiCall(method, url, 0, duration, {
        success: false,
        error: error.message
      });
      
      throw error;
    }
  };
};

// Global error handler
window.addEventListener('error', (event) => {
  logger.error('Global JavaScript error', event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', event.reason, {
    promise: event.promise
  });
});

export default logger;