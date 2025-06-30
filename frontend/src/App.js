import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import Login from './components/Login';
import AppRouter from './components/Router';
import SplashScreen from './components/SplashScreen';
import NavigationSplashScreen from './components/NavigationSplashScreen';
import ErrorBoundary from './components/ErrorBoundary';
import logger, { createApiInterceptor, useLogger } from './utils/logger';
import './App.css';

// Initialize API interceptor for automatic logging
createApiInterceptor();

const AppContent = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { showNavigationSplash, pendingNavigation } = useNavigation();
  const { trackPageView } = useLogger();
  const [showSplash, setShowSplash] = useState(true);
  const [showPostLoginSplash, setShowPostLoginSplash] = useState(false);
  const [wasLoggedIn, setWasLoggedIn] = useState(false);

  // Set user ID in logger when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      logger.setUserId(user.id);
      logger.info('User authenticated', {
        user_id: user.id,
        username: user.username,
        role: user.role,
        department: user.department
      });
    } else if (!isAuthenticated) {
      logger.setUserId(null);
    }
  }, [isAuthenticated, user]);

  // Track page views
  useEffect(() => {
    trackPageView(window.location.pathname, {
      authenticated: isAuthenticated,
      loading: isLoading
    });
  }, [isAuthenticated, isLoading, trackPageView]);

  useEffect(() => {
    // Hide initial splash screen after it completes
    const timer = setTimeout(() => {
      setShowSplash(false);
      logger.info('Initial splash screen completed');
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  // Show splash screen after login
  useEffect(() => {
    if (isAuthenticated && !wasLoggedIn && !showSplash) {
      setShowPostLoginSplash(true);
      logger.info('Post-login splash screen triggered');
      setWasLoggedIn(true);
      
      // Hide post-login splash after 2 seconds
      const timer = setTimeout(() => {
        setShowPostLoginSplash(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    } else if (!isAuthenticated) {
      setWasLoggedIn(false);
    }
  }, [isAuthenticated, wasLoggedIn, showSplash]);

  // Show initial splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Show post-login splash screen
  if (showPostLoginSplash) {
    return <NavigationSplashScreen onComplete={() => setShowPostLoginSplash(false)} currentPage="dashboard" />;
  }

  // Show navigation splash screen
  if (showNavigationSplash) {
    return <NavigationSplashScreen onComplete={() => {}} currentPage={pendingNavigation?.path?.replace('/', '') || 'dashboard'} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">Loading USPF Inventory System...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <AppRouter /> : <Login />;
};

function App() {
  // Log application startup
  useEffect(() => {
    logger.info('USPF Inventory Management System started', {
      version: '2.0.0',
      environment: process.env.NODE_ENV,
      backend_url: process.env.REACT_APP_BACKEND_URL,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    // Log performance metrics
    if (typeof performance !== 'undefined' && performance.timing) {
      const timing = performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
      
      logger.info('Application performance metrics', {
        load_time_ms: loadTime,
        dom_content_loaded_ms: domContentLoaded,
        navigation_type: performance.navigation ? performance.navigation.type : 'unknown'
      });
    }
  }, []);

  return (
    <ErrorBoundary name="App">
      <AuthProvider>
        <NavigationProvider>
          <ErrorBoundary name="AppContent">
            <div className="App">
              <AppContent />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  className: 'neumorphic',
                  style: {
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#1f2937',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    boxShadow: '8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.8)',
                  },
                  success: {
                    style: {
                      background: 'rgba(16, 185, 129, 0.9)',
                      color: '#ffffff',
                    },
                  },
                  error: {
                    style: {
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: '#ffffff',
                    },
                  },
                }}
              />
            </div>
          </ErrorBoundary>
        </NavigationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;