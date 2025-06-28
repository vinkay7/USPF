import React, { useState } from 'react';
import { 
    Settings as SettingsIcon, 
    User, 
    Shield, 
    Bell, 
    Database,
    Download,
    Upload,
    Save,
    Building,
    Camera,
    X
} from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from './Layout';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Settings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);

    const tabs = [
        { id: 'profile', name: 'Profile', icon: User },
        { id: 'system', name: 'System', icon: SettingsIcon },
        { id: 'notifications', name: 'Notifications', icon: Bell },
        { id: 'data', name: 'Data Management', icon: Database }
    ];

    return (
        <Layout currentPage="settings">
            <div className="space-y-6 h-full overflow-hidden flex flex-col">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold gradient-text mb-2">Settings</h1>
                    <p className="text-slate-600 dark:text-slate-300">Manage your account and system preferences</p>
                </div>

                {/* Settings Navigation */}
                <div className="floating-card flex-1 overflow-hidden">
                    <div className="border-b border-slate-200 dark:border-slate-700">
                        <nav className="flex space-x-8 px-6" aria-label="Settings">
                            {tabs.map((tab) => {
                                const IconComponent = tab.icon;
                                return (
                                    <motion.button
                                        key={tab.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                            activeTab === tab.id
                                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        <IconComponent className="w-4 h-4" />
                                        <span>{tab.name}</span>
                                    </motion.button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Settings Content */}
                    <div className="p-6 h-full overflow-auto">
                        {activeTab === 'profile' && <ProfileSettings user={user} />}
                        {activeTab === 'system' && <SystemSettings />}
                        {activeTab === 'notifications' && <NotificationSettings />}
                        {activeTab === 'data' && <DataManagementSettings />}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

// Profile Settings Component
const ProfileSettings = ({ user }) => {
    const [formData, setFormData] = useState({
        fullName: user?.full_name || '',
        username: user?.username || '',
        email: user?.email || '',
        department: user?.department || '',
        role: user?.role || ''
    });
    const [profileImage, setProfileImage] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error('Image size should be less than 5MB');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                setProfileImage(e.target.result);
                toast.success('Profile picture uploaded successfully');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        toast.success('Profile updated successfully');
    };

    const exportProfileData = () => {
        const csvData = [
            ['Field', 'Value'],
            ['Full Name', formData.fullName],
            ['Username', formData.username],
            ['Email', formData.email],
            ['Department', formData.department],
            ['Role', formData.role],
            ['Last Updated', new Date().toISOString()]
        ];
        
        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `profile-data-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        toast.success('Profile data exported successfully');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Profile Information</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Update your personal information and account details</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={exportProfileData}
                    className="neumorphic-button px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg flex items-center space-x-2"
                >
                    <Download className="w-4 h-4" />
                    <span>Export Profile</span>
                </motion.button>
            </div>

            {/* Profile Picture */}
            <div className="neumorphic-inset p-6 rounded-xl bg-slate-50/50 dark:bg-slate-700/50">
                <div className="flex items-center space-x-6">
                    <div className="relative">
                        <div className="w-20 h-20 neumorphic bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center overflow-hidden">
                            {profileImage ? (
                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-slate-600 dark:text-slate-300" />
                            )}
                        </div>
                        <button
                            onClick={() => setShowImageModal(true)}
                            className="absolute -bottom-1 -right-1 w-8 h-8 neumorphic bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>
                    <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">Profile Picture</h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">Upload a new avatar for your account</p>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="profile-image-upload"
                        />
                        <label
                            htmlFor="profile-image-upload"
                            className="neumorphic-button cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Photo
                        </label>
                    </div>
                </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Username</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none opacity-60"
                        disabled
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Department</label>
                    <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none"
                    >
                        <option value="secretariat">Secretariat</option>
                        <option value="corporate-services">Corporate Services</option>
                        <option value="funding-subsidy">Funding & Subsidy</option>
                        <option value="infrastructure-projects">Infrastructure Projects</option>
                        <option value="procurement">Procurement</option>
                        <option value="internal-audit">Internal Audit</option>
                        <option value="strategy-monitoring">Strategy Corporate Performance Monitoring</option>
                        <option value="it-project">Information Technology Project</option>
                        <option value="legal-secretarial">Legal & Secretarial Affairs</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Role</label>
                    <input
                        type="text"
                        name="role"
                        value={formData.role}
                        className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none opacity-60"
                        disabled
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    className="neumorphic-button px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl flex items-center space-x-2"
                >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                </motion.button>
            </div>

            {/* Image Upload Modal */}
            {showImageModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="floating-card p-6 w-full max-w-md"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Upload Profile Picture</h3>
                            <button
                                onClick={() => setShowImageModal(false)}
                                className="neumorphic p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                            Upload a new profile picture. Supported formats: JPG, PNG, GIF. Max size: 5MB.
                        </p>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                handleImageUpload(e);
                                setShowImageModal(false);
                            }}
                            className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none"
                        />
                    </motion.div>
                </div>
            )}
        </div>
    );
};

// System Settings Component
const SystemSettings = () => {
    const [settings, setSettings] = useState({
        autoBackup: true,
        lowStockThreshold: 10,
        requireApproval: true,
        enableQRScanning: true
    });

    const handleChange = (e) => {
        const { name, type, checked, value } = e.target;
        setSettings({
            ...settings,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSave = () => {
        toast.success('System settings updated');
    };

    const exportSystemSettings = () => {
        const csvData = [
            ['Setting', 'Value'],
            ['Auto Backup', settings.autoBackup ? 'Enabled' : 'Disabled'],
            ['Low Stock Threshold', settings.lowStockThreshold],
            ['Require Approval', settings.requireApproval ? 'Enabled' : 'Disabled'],
            ['Enable QR Scanning', settings.enableQRScanning ? 'Enabled' : 'Disabled'],
            ['Last Updated', new Date().toISOString()]
        ];
        
        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `system-settings-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        toast.success('System settings exported successfully');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">System Configuration</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Configure system-wide settings and preferences</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={exportSystemSettings}
                    className="neumorphic-button px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg flex items-center space-x-2"
                >
                    <Download className="w-4 h-4" />
                    <span>Export Settings</span>
                </motion.button>
            </div>

            <div className="space-y-6">
                {/* General Settings */}
                <div className="neumorphic-inset border border-slate-200 dark:border-slate-600 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-700/50">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-4">General Settings</h4>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="font-medium text-slate-900 dark:text-white">Auto Backup</label>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Automatically backup data daily</p>
                            </div>
                            <input
                                type="checkbox"
                                name="autoBackup"
                                checked={settings.autoBackup}
                                onChange={handleChange}
                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="font-medium text-slate-900 dark:text-white">Require Approval for Requisitions</label>
                                <p className="text-sm text-slate-600 dark:text-slate-400">All requisitions need admin approval</p>
                            </div>
                            <input
                                type="checkbox"
                                name="requireApproval"
                                checked={settings.requireApproval}
                                onChange={handleChange}
                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="font-medium text-slate-900 dark:text-white">Enable QR Scanning</label>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Allow QR code scanning for items</p>
                            </div>
                            <input
                                type="checkbox"
                                name="enableQRScanning"
                                checked={settings.enableQRScanning}
                                onChange={handleChange}
                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block font-medium text-slate-900 dark:text-white mb-2">Low Stock Threshold</label>
                            <input
                                type="number"
                                name="lowStockThreshold"
                                value={settings.lowStockThreshold}
                                onChange={handleChange}
                                className="w-32 px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none"
                                min="1"
                            />
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Alert when stock falls below this number</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    className="neumorphic-button px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl flex items-center space-x-2"
                >
                    <Save className="w-4 h-4" />
                    <span>Save Settings</span>
                </motion.button>
            </div>
        </div>
    );
};

// Notification Settings Component
const NotificationSettings = () => {
    const [notifications, setNotifications] = useState({
        lowStock: true,
        newRequisition: true,
        requisitionApproved: true,
        systemUpdates: false,
        weeklyReport: true
    });

    const handleChange = (e) => {
        setNotifications({
            ...notifications,
            [e.target.name]: e.target.checked
        });
    };

    const handleSave = () => {
        toast.success('Notification preferences updated');
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Notification Preferences</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Choose what notifications you want to receive</p>
            </div>

            <div className="space-y-4">
                {[
                    { key: 'lowStock', label: 'Low Stock Alerts', desc: 'Get notified when items are running low' },
                    { key: 'newRequisition', label: 'New Requisitions', desc: 'Notify when new requisitions are submitted' },
                    { key: 'requisitionApproved', label: 'Requisition Updates', desc: 'Updates on your requisition status' },
                    { key: 'systemUpdates', label: 'System Updates', desc: 'Notifications about system maintenance and updates' },
                    { key: 'weeklyReport', label: 'Weekly Reports', desc: 'Receive weekly inventory summary reports' }
                ].map((item) => (
                    <div key={item.key} className="neumorphic-inset flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50/50 dark:bg-slate-700/50">
                        <div>
                            <label className="font-medium text-slate-900 dark:text-white">{item.label}</label>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
                        </div>
                        <input
                            type="checkbox"
                            name={item.key}
                            checked={notifications[item.key]}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                    </div>
                ))}
            </div>

            <div className="flex justify-end">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    className="neumorphic-button px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl flex items-center space-x-2"
                >
                    <Save className="w-4 h-4" />
                    <span>Save Preferences</span>
                </motion.button>
            </div>
        </div>
    );
};

// Data Management Settings Component
const DataManagementSettings = () => {
    const handleExport = (type) => {
        // Mock CSV data for demonstration
        const csvData = [
            ['Export Type', 'Date', 'Status'],
            [type, new Date().toISOString(), 'Completed']
        ];
        
        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${type.toLowerCase().replace(' ', '-')}-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        toast.success(`${type} export completed successfully`);
    };

    const handleImport = () => {
        toast.success('Import functionality coming soon');
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Data Management</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Import, export, and manage your inventory data</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Data */}
                <div className="neumorphic-inset border border-slate-200 dark:border-slate-600 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-700/50">
                    <div className="flex items-center space-x-3 mb-4">
                        <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <h4 className="font-medium text-slate-900 dark:text-white">Export Data</h4>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">Download your inventory data in various formats</p>
                    
                    <div className="space-y-3">
                        <button
                            onClick={() => handleExport('Inventory CSV')}
                            className="w-full neumorphic-button px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                            Export Inventory (CSV)
                        </button>
                        <button
                            onClick={() => handleExport('Requisitions CSV')}
                            className="w-full neumorphic-button px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                            Export Requisitions (CSV)
                        </button>
                        <button
                            onClick={() => handleExport('Full Backup')}
                            className="w-full neumorphic-button px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
                        >
                            Full System Backup
                        </button>
                    </div>
                </div>

                {/* Import Data */}
                <div className="neumorphic-inset border border-slate-200 dark:border-slate-600 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-700/50">
                    <div className="flex items-center space-x-3 mb-4">
                        <Upload className="w-6 h-6 text-green-600 dark:text-green-400" />
                        <h4 className="font-medium text-slate-900 dark:text-white">Import Data</h4>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">Upload inventory data from external sources</p>
                    
                    <div className="space-y-3">
                        <button
                            onClick={handleImport}
                            className="w-full neumorphic-button px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm"
                        >
                            Import Inventory CSV
                        </button>
                        <button
                            onClick={handleImport}
                            className="w-full neumorphic-button px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm"
                        >
                            Import from Excel
                        </button>
                    </div>
                </div>

                {/* Data Statistics */}
                <div className="neumorphic-inset border border-slate-200 dark:border-slate-600 rounded-xl p-6 md:col-span-2 bg-slate-50/50 dark:bg-slate-700/50">
                    <div className="flex items-center space-x-3 mb-4">
                        <Database className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                        <h4 className="font-medium text-slate-900 dark:text-white">Data Statistics</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">150</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Total Items</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">45</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Categories</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">1,250</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Transactions</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">95%</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Data Health</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;