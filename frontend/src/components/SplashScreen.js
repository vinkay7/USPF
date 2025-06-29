import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
  const [showContent, setShowContent] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  useEffect(() => {
    // Show content after initial mount
    const timer1 = setTimeout(() => {
      setShowContent(true);
    }, 100);

    // Auto complete after 3 seconds + 1 second fade out
    const timer2 = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  // Floating circles animation variants
  const circleVariants = {
    animate: {
      y: [0, -30, 0],
      x: [0, 15, -10, 0],
      rotate: [0, 180, 360],
      scale: [1, 1.1, 0.9, 1],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Letter stagger animation for "USPF"
  const letterVariants = {
    hidden: { 
      y: 50, 
      opacity: 0,
      rotate: -10 
    },
    visible: (i) => ({
      y: 0,
      opacity: 1,
      rotate: 0,
      transition: {
        delay: 2 + i * 0.1,
        duration: 0.6,
        ease: "easeOut"
      }
    })
  };

  // Loading dots animation
  const dotVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: showContent ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center z-50 overflow-hidden"
    >
      {/* Enhanced Floating Background Circles with USPF Colors */}
      <div className="absolute inset-0">
        {[...Array(12)].map((_, i) => (
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
              width: `${Math.random() * 60 + 40}px`,
              height: `${Math.random() * 60 + 40}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.3}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center">
        {/* Enhanced Logo Container - Decorative Only */}
        <motion.div
          initial={{ scale: 0.3, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="relative mx-auto w-32 h-32 mb-6">
            {/* Enhanced glow effect with USPF blue and green colors */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-green-600/30 rounded-full blur-xl scale-150 -z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-full blur-2xl scale-200 -z-20 animate-pulse"></div>
            
            {/* Decorative container without logo */}
            <div className="relative w-32 h-32 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-blue-100/50">
              {/* Empty decorative circle */}
            </div>

            {/* Additional decorative rings */}
            <div className="absolute inset-0 rounded-full border-2 border-blue-200/40 animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="absolute inset-0 rounded-full border border-green-200/30 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
          </div>
        </motion.div>

        {/* Enhanced Animated Title */}
        <div className="mb-4">
          <div className="text-6xl font-bold mb-2 tracking-wider">
            {['U', 'S', 'P', 'F'].map((letter, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={letterVariants}
                initial="hidden"
                animate="visible"
                className="inline-block bg-gradient-to-r from-blue-600 via-blue-700 to-green-600 bg-clip-text text-transparent mr-1"
                style={{
                  textShadow: '0 4px 8px rgba(59, 130, 246, 0.3)'
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 0.8 }}
            className="space-y-1"
          >
            <p className="text-lg text-slate-700 font-semibold">
              Universal Service Provision Fund
            </p>
            <p className="text-sm text-slate-600 font-medium">
              Inventory Management System
            </p>
          </motion.div>
        </div>

        {/* Enhanced Loading Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 0.5 }}
          className="flex items-center justify-center space-x-2 mt-8"
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              variants={dotVariants}
              animate="animate"
              className="w-3 h-3 bg-gradient-to-r from-blue-600 to-green-600 rounded-full shadow-lg"
              style={{ 
                animationDelay: `${i * 0.2}s`,
                boxShadow: '0 4px 8px rgba(59, 130, 246, 0.4)'
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;