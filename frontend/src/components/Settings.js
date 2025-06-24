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
    Building
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
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
                    <p className="text-slate-600">Manage your account and system preferences</p>
                </div>

                {/* Settings Navigation */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="border-b border-slate-200">
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
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
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
                    <div className="p-6">
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

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSave = () => {
        toast.success('Profile updated successfully');
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">Profile Information</h3>
                <p className="text-slate-600 text-sm">Update your personal information and account details</p>
            </div>

            {/* Profile Picture */}
            <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-slate-600" />
                </div>
                <div>
                    <h4 className="font-medium text-slate-900">Profile Picture</h4>
                    <p className="text-slate-600 text-sm mb-2">Upload a new avatar for your account</p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        Upload Photo
                    </button>
                </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                    <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                    <input
                        type="text"
                        name="role"
                        value={formData.role}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                        disabled
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                </motion.button>
            </div>
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

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">System Configuration</h3>
                <p className="text-slate-600 text-sm">Configure system-wide settings and preferences</p>
            </div>

            <div className="space-y-6">
                {/* General Settings */}
                <div className="border border-slate-200 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-4">General Settings</h4>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="font-medium text-slate-900">Auto Backup</label>
                                <p className="text-sm text-slate-600">Automatically backup data daily</p>
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
                                <label className="font-medium text-slate-900">Require Approval for Requisitions</label>
                                <p className="text-sm text-slate-600">All requisitions need admin approval</p>
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
                                <label className="font-medium text-slate-900">Enable QR Scanning</label>
                                <p className="text-sm text-slate-600">Allow QR code scanning for items</p>
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
                            <label className="block font-medium text-slate-900 mb-2">Low Stock Threshold</label>
                            <input
                                type="number"
                                name="lowStockThreshold"
                                value={settings.lowStockThreshold}
                                onChange={handleChange}
                                className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="1"
                            />
                            <p className="text-sm text-slate-600 mt-1">Alert when stock falls below this number</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                <h3 className="text-lg font-medium text-slate-900 mb-1">Notification Preferences</h3>
                <p className="text-slate-600 text-sm">Choose what notifications you want to receive</p>
            </div>

            <div className="space-y-4">
                {[
                    { key: 'lowStock', label: 'Low Stock Alerts', desc: 'Get notified when items are running low' },
                    { key: 'newRequisition', label: 'New Requisitions', desc: 'Notify when new requisitions are submitted' },
                    { key: 'requisitionApproved', label: 'Requisition Updates', desc: 'Updates on your requisition status' },
                    { key: 'systemUpdates', label: 'System Updates', desc: 'Notifications about system maintenance and updates' },
                    { key: 'weeklyReport', label: 'Weekly Reports', desc: 'Receive weekly inventory summary reports' }
                ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div>
                            <label className="font-medium text-slate-900">{item.label}</label>
                            <p className="text-sm text-slate-600">{item.desc}</p>
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
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        toast.success(`${type} export started`);
    };

    const handleImport = () => {
        toast.success('Import functionality coming soon');
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">Data Management</h3>
                <p className="text-slate-600 text-sm">Import, export, and manage your inventory data</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Data */}
                <div className="border border-slate-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Download className="w-6 h-6 text-blue-600" />
                        <h4 className="font-medium text-slate-900">Export Data</h4>
                    </div>
                    <p className="text-slate-600 text-sm mb-4">Download your inventory data in various formats</p>
                    
                    <div className="space-y-3">
                        <button
                            onClick={() => handleExport('Inventory CSV')}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                            Export Inventory (CSV)
                        </button>
                        <button
                            onClick={() => handleExport('Requisitions CSV')}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                            Export Requisitions (CSV)
                        </button>
                        <button
                            onClick={() => handleExport('Full Backup')}
                            className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
                        >
                            Full System Backup
                        </button>
                    </div>
                </div>

                {/* Import Data */}
                <div className="border border-slate-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Upload className="w-6 h-6 text-green-600" />
                        <h4 className="font-medium text-slate-900">Import Data</h4>
                    </div>
                    <p className="text-slate-600 text-sm mb-4">Upload inventory data from external sources</p>
                    
                    <div className="space-y-3">
                        <button
                            onClick={handleImport}
                            className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                        >
                            Import Inventory CSV
                        </button>
                        <button
                            onClick={handleImport}
                            className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                        >
                            Import from Excel
                        </button>
                    </div>
                </div>

                {/* Data Statistics */}
                <div className="border border-slate-200 rounded-lg p-6 md:col-span-2">
                    <div className="flex items-center space-x-3 mb-4">
                        <Database className="w-6 h-6 text-slate-600" />
                        <h4 className="font-medium text-slate-900">Data Statistics</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-slate-900">150</p>
                            <p className="text-sm text-slate-600">Total Items</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-slate-900">45</p>
                            <p className="text-sm text-slate-600">Categories</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-slate-900">1,250</p>
                            <p className="text-sm text-slate-600">Transactions</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-slate-900">95%</p>
                            <p className="text-sm text-slate-600">Data Health</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;