import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import AppRouter from './components/Router';
import SplashScreen from './components/SplashScreen';
import './App.css';

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash screen after it completes
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
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
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;