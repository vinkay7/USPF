import React, { useState } from 'react';
import { QrCode, Download, Printer, Copy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

const QRCodeDisplay = ({ isOpen, onClose, data, title = "QR Code", qrCodeImage: existingQRCode }) => {
    const [qrCodeImage, setQrCodeImage] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Generate QR code when modal opens
    React.useEffect(() => {
        if (isOpen) {
            if (existingQRCode) {
                // Use existing QR code from backend
                console.log('Using existing QR code from backend');
                setQrCodeImage(existingQRCode);
                setIsGenerating(false);
            } else if (data) {
                // Generate new QR code
                console.log('Modal opened with data:', data);
                generateQRCode();
            }
        } else {
            // Reset state when modal closes
            setQrCodeImage(null);
            setIsGenerating(false);
        }
    }, [isOpen, data, existingQRCode]);

    const generateQRCode = async () => {
        setIsGenerating(true);
        try {
            console.log('Generating QR code for data:', data);
            
            // Check if data exists
            if (!data) {
                throw new Error('No data provided for QR code generation');
            }
            
            // Generate QR code using imported QRCode library
            const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data), {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            });
            
            console.log('QR code generated successfully');
            setQrCodeImage(qrCodeDataURL);
        } catch (error) {
            console.error('Error generating QR code:', error);
            toast.error(`Failed to generate QR code: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (qrCodeImage) {
            const link = document.createElement('a');
            link.href = qrCodeImage;
            link.download = `qr-code-${Date.now()}.png`;
            link.click();
            toast.success('QR code downloaded');
        }
    };

    const handlePrint = () => {
        if (qrCodeImage) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>QR Code - ${title}</title>
                        <style>
                            body { 
                                text-align: center; 
                                padding: 20px; 
                                font-family: Arial, sans-serif; 
                            }
                            .qr-container {
                                display: inline-block;
                                padding: 20px;
                                border: 2px solid #333;
                                border-radius: 10px;
                                margin: 20px;
                            }
                            .title {
                                font-size: 24px;
                                font-weight: bold;
                                margin-bottom: 20px;
                                color: #333;
                            }
                            .data-info {
                                margin-top: 20px;
                                font-size: 14px;
                                color: #666;
                                max-width: 400px;
                                word-wrap: break-word;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="qr-container">
                            <div class="title">${title}</div>
                            <img src="${qrCodeImage}" style="max-width: 300px;" alt="QR Code" />
                            <div class="data-info">
                                Data: ${typeof data === 'object' ? JSON.stringify(data, null, 2) : data}
                            </div>
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
            toast.success('QR code sent to printer');
        }
    };

    const handleCopyData = () => {
        const textData = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
        navigator.clipboard.writeText(textData).then(() => {
            toast.success('QR code data copied to clipboard');
        }).catch(() => {
            toast.error('Failed to copy data');
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={onClose}
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
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
                                <p className="text-slate-600 dark:text-slate-400">Scan this QR code for quick access</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="neumorphic p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* QR Code Display */}
                        <div className="text-center mb-6">
                            <div className="neumorphic-inset p-6 rounded-xl bg-white dark:bg-slate-800 inline-block mb-4">
                                {isGenerating ? (
                                    <div className="w-72 h-72 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="relative mx-auto w-16 h-16 mb-4">
                                                <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
                                                <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300">Generating QR code...</p>
                                        </div>
                                    </div>
                                ) : qrCodeImage ? (
                                    <img 
                                        src={qrCodeImage} 
                                        alt="Generated QR Code"
                                        className="w-72 h-72 object-contain mx-auto"
                                    />
                                ) : (
                                    <div className="w-72 h-72 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg">
                                        <div className="text-center">
                                            <QrCode className="w-16 h-16 text-slate-400 mx-auto mb-2" />
                                            <p className="text-slate-500 dark:text-slate-400 text-sm">Failed to generate QR code</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Scan this QR code with your device camera
                            </p>
                        </div>

                        {/* Data Preview */}
                        <div className="neumorphic-inset p-4 rounded-xl bg-slate-50/50 dark:bg-slate-700/50 mb-6">
                            <h4 className="font-medium text-slate-900 dark:text-white mb-2">QR Code Data:</h4>
                            <div className="text-sm text-slate-600 dark:text-slate-400 max-h-32 overflow-y-auto">
                                <pre className="whitespace-pre-wrap break-all">
                                    {typeof data === 'object' ? JSON.stringify(data, null, 2) : data}
                                </pre>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleDownload}
                                className="neumorphic-button px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex flex-col items-center justify-center space-y-1"
                                disabled={!qrCodeImage}
                            >
                                <Download className="w-4 h-4" />
                                <span className="text-xs">Download</span>
                            </motion.button>
                            
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handlePrint}
                                className="neumorphic-button px-4 py-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl flex flex-col items-center justify-center space-y-1"
                                disabled={!qrCodeImage}
                            >
                                <Printer className="w-4 h-4" />
                                <span className="text-xs">Print</span>
                            </motion.button>
                            
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleCopyData}
                                className="neumorphic-button px-4 py-3 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl flex flex-col items-center justify-center space-y-1"
                            >
                                <Copy className="w-4 h-4" />
                                <span className="text-xs">Copy</span>
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default QRCodeDisplay;