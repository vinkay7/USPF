import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const { login, isLoading } = useAuth();

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(formData.username, formData.password);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Floating circles for hero section animation
  const FloatingCircle = ({ size, position, delay }) => (
    <motion.div
      className={`absolute ${size} bg-gradient-to-br from-blue-200/20 to-green-200/20 rounded-full`}
      style={{ ...position }}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, -10, 0],
        rotate: [0, 180, 360],
        scale: [1, 1.1, 0.9, 1],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay
      }}
    />
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-900 dark:to-slate-800 transition-all duration-500">
        
        {/* Dark Mode Toggle - Top Right */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          onClick={toggleDarkMode}
          className="fixed top-6 right-6 z-50 w-12 h-12 neumorphic bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600" />
          )}
        </motion.button>

        <div className="flex min-h-screen">
          {/* Left Hero Section - Hidden on Mobile */}
          <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
            <div className="relative w-full h-full flex flex-col justify-center items-center p-12">
              
              {/* Floating Background Elements */}
              <FloatingCircle 
                size="w-20 h-20" 
                position={{ top: '10%', left: '10%' }} 
                delay={0} 
              />
              <FloatingCircle 
                size="w-32 h-32" 
                position={{ top: '60%', left: '5%' }} 
                delay={2} 
              />
              <FloatingCircle 
                size="w-16 h-16" 
                position={{ top: '20%', right: '15%' }} 
                delay={1} 
              />
              <FloatingCircle 
                size="w-24 h-24" 
                position={{ bottom: '20%', right: '10%' }} 
                delay={3} 
              />
              <FloatingCircle 
                size="w-12 h-12" 
                position={{ top: '45%', left: '20%' }} 
                delay={1.5} 
              />
              <FloatingCircle 
                size="w-28 h-28" 
                position={{ bottom: '40%', left: '25%' }} 
                delay={2.5} 
              />

              {/* Welcome Content */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 text-center"
              >
                <h1 className="text-5xl font-bold gradient-text mb-6 leading-tight">
                  Welcome to<br />
                  <span className="text-6xl">USPF Inventory</span>
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-md">
                  Universal Service Provision Fund - Streamlining inventory management with modern technology
                </p>
                <div className="space-y-4 text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 neumorphic bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">Real-time inventory tracking</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 neumorphic bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">QR Code scanning system</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 neumorphic bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">Advanced reporting & analytics</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right Form Section */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-md"
            >
              
              {/* Logo */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-center mb-8"
              >
                <div className="mx-auto w-20 h-20 neumorphic bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-full flex items-center justify-center mb-6">
                  <img 
                    src="/uspf-logo.png" 
                    alt="USPF Logo" 
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-16 h-16 bg-gradient-to-br from-blue-600 to-green-600 rounded-full items-center justify-center">
                    <span className="text-white font-bold text-lg">USPF</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                  USPF
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Inventory System
                </p>
              </motion.div>

              {/* Login Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="floating-card p-8"
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Username Field */}
                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileFocus={{ scale: 1.02 }}
                      className="relative"
                    >
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('username')}
                        onBlur={() => setFocusedField('')}
                        className="w-full px-12 py-4 neumorphic-input bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white placeholder-transparent focus:outline-none peer"
                        placeholder="Username"
                        required
                      />
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <motion.label
                        initial={false}
                        animate={{
                          y: formData.username || focusedField === 'username' ? -25 : 0,
                          scale: formData.username || focusedField === 'username' ? 0.85 : 1,
                          color: focusedField === 'username' ? '#3b82f6' : '#64748b'
                        }}
                        className="absolute left-12 top-1/2 transform -translate-y-1/2 text-slate-500 transition-all duration-200 pointer-events-none font-medium"
                      >
                        Username
                      </motion.label>
                    </motion.div>
                  </div>

                  {/* Password Field */}
                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileFocus={{ scale: 1.02 }}
                      className="relative"
                    >
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField('')}
                        className="w-full px-12 py-4 pr-16 neumorphic-input bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white placeholder-transparent focus:outline-none peer"
                        placeholder="Password"
                        required
                      />
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <motion.label
                        initial={false}
                        animate={{
                          y: formData.password || focusedField === 'password' ? -25 : 0,
                          scale: formData.password || focusedField === 'password' ? 0.85 : 1,
                          color: focusedField === 'password' ? '#3b82f6' : '#64748b'
                        }}
                        className="absolute left-12 top-1/2 transform -translate-y-1/2 text-slate-500 transition-all duration-200 pointer-events-none font-medium"
                      >
                        Password
                      </motion.label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </motion.div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center justify-between">
                    <motion.label
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 neumorphic-inset rounded ${rememberMe ? 'bg-gradient-to-r from-blue-600 to-green-600' : 'bg-slate-200 dark:bg-slate-600'} transition-all duration-200 flex items-center justify-center`}>
                        {rememberMe && (
                          <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </motion.svg>
                        )}
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">Remember me</span>
                    </motion.label>
                  </div>

                  {/* Login Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-4 px-6 rounded-xl font-semibold neumorphic hover:shadow-floating focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Signing In...
                      </div>
                    ) : (
                      'USPF Inventory System'
                    )}
                  </motion.button>
                </form>
              </motion.div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="text-center mt-8"
              >
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  © 2025 Universal Service Provision Fund. All rights reserved.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;