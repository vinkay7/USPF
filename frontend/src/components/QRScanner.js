import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, CameraOff, Scan } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ isOpen, onClose, onScan }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [hasPermission, setHasPermission] = useState(null);
    const [error, setError] = useState('');
    const scannerRef = useRef(null);
    const html5QrcodeScannerRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            initializeScanner();
        } else {
            cleanupScanner();
        }

        return () => {
            cleanupScanner();
        };
    }, [isOpen]);

    const initializeScanner = () => {
        if (!scannerRef.current) return;

        try {
            // Clear any existing scanner
            cleanupScanner();

            const html5QrcodeScanner = new Html5QrcodeScanner(
                "qr-reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true,
                    showZoomSliderIfSupported: true,
                    defaultZoomValueIfSupported: 2,
                },
                false
            );

            html5QrcodeScannerRef.current = html5QrcodeScanner;

            html5QrcodeScanner.render(
                (decodedText, decodedResult) => {
                    // Success callback
                    setIsScanning(false);
                    setError('');
                    onScan(decodedText);
                    cleanupScanner();
                },
                (error) => {
                    // Error callback - usually just means no QR code detected
                    // We don't want to show these as errors to the user
                }
            );

            setIsScanning(true);
            setHasPermission(true);
            setError('');
        } catch (err) {
            console.error('Error initializing QR scanner:', err);
            setError('Failed to initialize camera. Please check permissions.');
            setHasPermission(false);
            setIsScanning(false);
        }
    };

    const cleanupScanner = () => {
        if (html5QrcodeScannerRef.current) {
            try {
                html5QrcodeScannerRef.current.clear();
            } catch (err) {
                console.warn('Error cleaning up scanner:', err);
            }
            html5QrcodeScannerRef.current = null;
        }
        setIsScanning(false);
    };

    const handleClose = () => {
        cleanupScanner();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="floating-card p-6 w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">QR Code Scanner</h2>
                                <p className="text-slate-600 dark:text-slate-400">Point camera at QR code</p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="neumorphic p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scanner Container */}
                        <div className="relative">
                            {/* Camera Permission/Error States */}
                            {hasPermission === false && (
                                <div className="text-center py-12">
                                    <CameraOff className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                        Camera Access Required
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                                        Please allow camera access to scan QR codes
                                    </p>
                                    <button
                                        onClick={initializeScanner}
                                        className="neumorphic-button px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}

                            {error && (
                                <div className="text-center py-12">
                                    <CameraOff className="w-16 h-16 text-red-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                        Scanner Error
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                                        {error}
                                    </p>
                                    <button
                                        onClick={initializeScanner}
                                        className="neumorphic-button px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}

                            {/* Loading State */}
                            {hasPermission === null && !error && (
                                <div className="text-center py-12">
                                    <div className="relative mx-auto w-16 h-16 mb-4">
                                        <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300">Initializing camera...</p>
                                </div>
                            )}

                            {/* QR Scanner */}
                            {hasPermission && !error && (
                                <div className="neumorphic-inset rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800">
                                    <div id="qr-reader" ref={scannerRef} className="w-full"></div>
                                    
                                    {/* Overlay with scanning animation */}
                                    {isScanning && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="relative">
                                                {/* Scanning corners */}
                                                <div className="absolute -top-4 -left-4 w-8 h-8 border-l-4 border-t-4 border-green-500"></div>
                                                <div className="absolute -top-4 -right-4 w-8 h-8 border-r-4 border-t-4 border-green-500"></div>
                                                <div className="absolute -bottom-4 -left-4 w-8 h-8 border-l-4 border-b-4 border-green-500"></div>
                                                <div className="absolute -bottom-4 -right-4 w-8 h-8 border-r-4 border-b-4 border-green-500"></div>
                                                
                                                {/* Scanning line animation */}
                                                <motion.div
                                                    initial={{ y: -100 }}
                                                    animate={{ y: 100 }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        ease: "linear"
                                                    }}
                                                    className="w-64 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-75"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Instructions */}
                        {isScanning && (
                            <div className="mt-6 text-center">
                                <div className="flex items-center justify-center space-x-2 mb-2">
                                    <Scan className="w-5 h-5 text-green-600" />
                                    <span className="text-green-600 font-medium">Scanning...</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Position the QR code within the frame to scan
                                </p>
                            </div>
                        )}

                        {/* Manual Input Option */}
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                Having trouble? Enter QR code manually:
                            </p>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="Enter QR code data"
                                    className="flex-1 px-3 py-2 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-lg border-0 text-slate-800 dark:text-white text-sm focus:outline-none"
                                />
                                <button
                                    onClick={() => {
                                        // Handle manual input
                                        const input = document.querySelector('input[placeholder="Enter QR code data"]');
                                        if (input && input.value.trim()) {
                                            onScan(input.value.trim());
                                            handleClose();
                                        }
                                    }}
                                    className="neumorphic-button px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default QRScanner;