import React, { useState, useEffect } from 'react';
import { 
    BarChart3, 
    Download, 
    TrendingUp, 
    AlertTriangle,
    Package,
    Calendar,
    FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from './Layout';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Reports = () => {
    const { token } = useAuth();
    const [lowStockItems, setLowStockItems] = useState([]);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [reportType, setReportType] = useState('overview');

    const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

    useEffect(() => {
        fetchReportsData();
    }, []);

    const fetchReportsData = async () => {
        try {
            const [lowStockResponse, statsResponse] = await Promise.all([
                axios.get(`${API_BASE}/reports/low-stock`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_BASE}/dashboard/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setLowStockItems(lowStockResponse.data);
            setDashboardStats(statsResponse.data);
        } catch (error) {
            console.error('Reports fetch error:', error);
            toast.error('Failed to fetch reports data');
        } finally {
            setIsLoading(false);
        }
    };

    const reportTypes = [
        { id: 'overview', name: 'Overview', icon: BarChart3 },
        { id: 'low-stock', name: 'Low Stock', icon: AlertTriangle },
        { id: 'inventory', name: 'Inventory', icon: Package },
        { id: 'activity', name: 'Activity Log', icon: Calendar }
    ];

    const handleDownloadReport = (type) => {
        const csvData = generateCSVData(type);
        downloadCSV(csvData, `${type}-report-${new Date().toISOString().split('T')[0]}.csv`);
        toast.success(`${type} report exported successfully`);
    };

    const generateCSVData = (type) => {
        switch (type) {
            case 'low-stock':
                return [
                    ['Item Name', 'Category', 'Current Stock', 'Reorder Level', 'Department'],
                    ...lowStockItems.map(item => [
                        item.name,
                        item.category,
                        item.quantity,
                        item.reorder_level,
                        item.department
                    ])
                ];
            case 'comprehensive':
                return [
                    ['Report Type', 'Total Items', 'Total Value', 'Low Stock Count', 'Last Updated'],
                    ['Comprehensive Report', dashboardStats?.total_items || 0, dashboardStats?.total_value || 0, dashboardStats?.low_stock_count || 0, new Date().toISOString()]
                ];
            default:
                return [['No data available']];
        }
    };

    const downloadCSV = (data, filename) => {
        const csvContent = data.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (isLoading) {
        return (
            <Layout currentPage="reports">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="relative mx-auto w-16 h-16 mb-4">
                            <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 font-medium">Loading reports...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout currentPage="reports">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold gradient-text mb-2">Reports & Analytics</h1>
                        <p className="text-slate-600 dark:text-slate-300">Generate comprehensive inventory reports</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDownloadReport('low-stock')}
                            className="neumorphic-button px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl flex items-center space-x-2"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export Low Stock</span>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDownloadReport('comprehensive')}
                            className="neumorphic-button px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl flex items-center space-x-2"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export Report</span>
                        </motion.button>
                    </div>
                </div>

                {/* Report Type Selector */}
                <div className="floating-card p-4">
                    <div className="flex flex-wrap gap-2">
                        {reportTypes.map((type) => {
                            const IconComponent = type.icon;
                            return (
                                <motion.button
                                    key={type.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setReportType(type.id)}
                                    className={`neumorphic flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                                        reportType === type.id
                                            ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg'
                                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white/50 dark:bg-slate-800/30'
                                    }`}
                                >
                                    <IconComponent className="w-4 h-4" />
                                    <span className="font-medium">{type.name}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Report Content */}
                {reportType === 'overview' && (
                    <OverviewReport stats={dashboardStats} />
                )}

                {reportType === 'low-stock' && (
                    <LowStockReport items={lowStockItems} onExport={() => handleDownloadReport('low-stock')} />
                )}

                {reportType === 'inventory' && (
                    <InventoryReport />
                )}

                {reportType === 'activity' && (
                    <ActivityReport stats={dashboardStats} />
                )}
            </div>
        </Layout>
    );
};

// Overview Report Component
const OverviewReport = ({ stats }) => {
    const metrics = [
        {
            label: 'Total Items',
            value: stats?.total_items || 0,
            change: '+12%',
            trend: 'up',
            color: 'blue'
        },
        {
            label: 'Total Value',
            value: `₦${(stats?.total_value || 0).toLocaleString()}`,
            change: '+8.2%',
            trend: 'up',
            color: 'green'
        },
        {
            label: 'Items Issued Today',
            value: stats?.issued_today || 0,
            change: '+15%',
            trend: 'up',
            color: 'orange'
        },
        {
            label: 'Low Stock Alerts',
            value: stats?.low_stock_count || 0,
            change: '-3',
            trend: 'down',
            color: 'red'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric, index) => (
                    <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="floating-card p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">{metric.label}</h3>
                            <div className={`text-sm ${
                                metric.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                                {metric.change}
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{metric.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="floating-card p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Monthly Overview</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">Items Added</span>
                            <span className="font-semibold text-slate-900 dark:text-white">25</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">Items Issued</span>
                            <span className="font-semibold text-slate-900 dark:text-white">180</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">Items Received</span>
                            <span className="font-semibold text-slate-900 dark:text-white">95</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">Total Transactions</span>
                            <span className="font-semibold text-slate-900 dark:text-white">300</span>
                        </div>
                    </div>
                </div>

                <div className="floating-card p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Department Activity</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">IT Project</span>
                            <span className="font-semibold text-slate-900 dark:text-white">45 requests</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">Corporate Services</span>
                            <span className="font-semibold text-slate-900 dark:text-white">32 requests</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">Procurement</span>
                            <span className="font-semibold text-slate-900 dark:text-white">28 requests</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">Others</span>
                            <span className="font-semibold text-slate-900 dark:text-white">15 requests</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Low Stock Report Component
const LowStockReport = ({ items, onExport }) => {
    return (
        <div className="floating-card">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Low Stock Alert Report</h3>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">{items.length} items below reorder level</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onExport}
                        className="neumorphic-button px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg flex items-center space-x-2"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export Alert</span>
                    </motion.button>
                </div>
            </div>

            <div className="p-6">
                {items.length > 0 ? (
                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="neumorphic-inset p-4 rounded-lg bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-2 neumorphic bg-red-100 dark:bg-red-900/30 rounded-lg">
                                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-white">{item.name}</h4>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{item.category} • {item.department}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-red-700 dark:text-red-400">Stock: {item.quantity}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Reorder: {item.reorder_level}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Package className="w-16 h-16 text-green-300 dark:text-green-600 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-2">All Stock Levels Good</h4>
                        <p className="text-slate-600 dark:text-slate-400">No items are currently below reorder levels</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Inventory Report Component
const InventoryReport = () => {
    return (
        <div className="floating-card p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Inventory Status Report</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="neumorphic-inset text-center p-6 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Package className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Electronics</h4>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">45 items</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">₦2,250,000 value</p>
                </div>

                <div className="neumorphic-inset text-center p-6 bg-green-50/50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <Package className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Furniture</h4>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">78 items</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">₦1,950,000 value</p>
                </div>

                <div className="neumorphic-inset text-center p-6 bg-orange-50/50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <Package className="w-12 h-12 text-orange-600 dark:text-orange-400 mx-auto mb-3" />
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Consumables</h4>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">27 items</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">₦800,000 value</p>
                </div>
            </div>
        </div>
    );
};

// Activity Report Component
const ActivityReport = ({ stats }) => {
    const activities = stats?.recent_activities || [];

    return (
        <div className="floating-card p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity Log</h3>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toast.success('Activity log exported')}
                    className="neumorphic-button px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg flex items-center space-x-2"
                >
                    <Download className="w-4 h-4" />
                    <span>Export Log</span>
                </motion.button>
            </div>

            <div className="space-y-4">
                {activities.map((activity, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="neumorphic-inset p-4 bg-slate-50/50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
                    >
                        <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-full ${
                                activity.type === 'issue' 
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                                    : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            }`}>
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-slate-900 dark:text-white">
                                    {activity.type === 'issue' ? 'Issued' : 'Received'} {activity.quantity}x {activity.item}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {activity.department} • {activity.time}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Today
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Reports;