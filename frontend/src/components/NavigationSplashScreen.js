import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const NavigationSplashScreen = ({ onComplete, currentPage }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content after initial mount
    const timer1 = setTimeout(() => {
      setShowContent(true);
    }, 100);

    // Auto complete after 2 seconds (shorter for navigation)
    const timer2 = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  // Floating circles animation variants
  const circleVariants = {
    animate: {
      y: [0, -20, 0],
      x: [0, 10, -5, 0],
      rotate: [0, 180, 360],
      scale: [1, 1.1, 0.9, 1],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Get page title based on current page
  const getPageTitle = (page) => {
    const pageTitles = {
      dashboard: "Dashboard",
      inventory: "Inventory Management",
      requisitions: "Requisition System",
      reports: "Reports & Analytics",
      settings: "System Settings"
    };
    return pageTitles[page] || "Loading...";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: showContent ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center z-50 overflow-hidden"
    >
      {/* Enhanced Floating Background Circles with USPF Colors */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            variants={circleVariants}
            animate="animate"
            className={`absolute rounded-full ${
              i % 3 === 0 
                ? 'bg-gradient-to-br from-blue-400/20 to-blue-600/30' 
                : i % 3 === 1 
                ? 'bg-gradient-to-br from-green-400/20 to-green-600/30'
                : 'bg-gradient-to-br from-blue-300/15 to-green-300/25'
            }`}
            style={{
              width: `${Math.random() * 40 + 20}px`,
              height: `${Math.random() * 40 + 20}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center">
        {/* Enhanced Logo Container */}
        <motion.div
          initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6"
        >
          <div className="relative mx-auto w-20 h-20 mb-4">
            {/* Enhanced glow effect with USPF blue and green colors */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-green-600/30 rounded-full blur-xl scale-150 -z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-full blur-2xl scale-200 -z-20 animate-pulse"></div>
            
            {/* Main logo container with enhanced neumorphic design */}
            <div className="relative w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-blue-100/50">
              <img 
                src="/uspf-logo.svg" 
                alt="USPF Logo" 
                className="w-20 h-20 object-contain"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              {/* Enhanced fallback text logo */}
              <div className="hidden w-16 h-16 bg-gradient-to-br from-blue-600 via-blue-700 to-green-600 rounded-full items-center justify-center shadow-inner">
                <span className="text-white font-bold text-lg tracking-wider">USPF</span>
              </div>
            </div>

            {/* Additional decorative rings */}
            <div className="absolute inset-0 rounded-full border-2 border-blue-200/40 animate-ping" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-0 rounded-full border border-green-200/30 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
          </div>
        </motion.div>

        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mb-4"
        >
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-green-600 bg-clip-text text-transparent mb-1">
            {getPageTitle(currentPage)}
          </h2>
          <p className="text-sm text-slate-600 font-medium">
            Universal Service Provision Fund
          </p>
        </motion.div>

        {/* Loading Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="flex items-center justify-center space-x-2"
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2
              }}
              className="w-2 h-2 bg-gradient-to-r from-blue-600 to-green-600 rounded-full shadow-lg"
              style={{ 
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.4)'
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NavigationSplashScreen;