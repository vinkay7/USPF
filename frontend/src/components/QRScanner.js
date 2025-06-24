import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, QrCode, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

const QRScanner = ({ onScan, onClose }) => {
    const scannerRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let scanner = null;

        const initScanner = () => {
            try {
                scanner = new Html5QrcodeScanner(
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

                scanner.render(onScanSuccess, onScanFailure);
                setIsScanning(true);
            } catch (err) {
                setError('Failed to initialize camera. Please check permissions.');
                console.error('Scanner initialization error:', err);
            }
        };

        const onScanSuccess = (decodedText, decodedResult) => {
            console.log('QR Code scanned:', decodedText);
            onScan(decodedText);
            if (scanner) {
                scanner.clear();
            }
        };

        const onScanFailure = (error) => {
            // This gets called for every failed scan attempt, so we don't log it
            // console.warn('QR scan failed:', error);
        };

        // Small delay to ensure DOM is ready
        const timer = setTimeout(initScanner, 100);

        return () => {
            clearTimeout(timer);
            if (scanner) {
                try {
                    scanner.clear();
                } catch (err) {
                    console.warn('Error clearing scanner:', err);
                }
            }
        };
    }, [onScan]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <QrCode className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">QR Code Scanner</h2>
                            <p className="text-sm text-slate-600">Scan item QR code to view details</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scanner Content */}
                <div className="p-6">
                    {error ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Camera className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 mb-2">Camera Error</h3>
                            <p className="text-slate-600 mb-4">{error}</p>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <div>
                            {/* Scanner Area */}
                            <div 
                                id="qr-reader" 
                                ref={scannerRef}
                                className="w-full"
                                style={{ 
                                    border: 'none',
                                    borderRadius: '8px',
                                    overflow: 'hidden'
                                }}
                            />

                            {/* Instructions */}
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <QrCode className="w-5 h-5 text-blue-600 mt-0.5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-blue-900 mb-1">Instructions</h4>
                                        <ul className="text-sm text-blue-700 space-y-1">
                                            <li>• Hold your device steady</li>
                                            <li>• Position the QR code within the frame</li>
                                            <li>• Ensure good lighting</li>
                                            <li>• Scanner will automatically detect the code</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Cancel Button */}
                            <div className="mt-4">
                                <button
                                    onClick={onClose}
                                    className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default QRScanner;