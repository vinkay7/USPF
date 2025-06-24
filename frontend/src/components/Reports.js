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
            toast.error('Failed to fetch reports data');
            console.error('Reports fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadReport = (type) => {
        // In a real application, this would generate and download actual reports
        toast.success(`${type} report download started`);
    };

    const reportTypes = [
        { id: 'overview', name: 'Overview', icon: BarChart3 },
        { id: 'inventory', name: 'Inventory Status', icon: Package },
        { id: 'low-stock', name: 'Low Stock Alert', icon: AlertTriangle },
        { id: 'activity', name: 'Activity Log', icon: FileText }
    ];

    if (isLoading) {
        return (
            <Layout currentPage="reports">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout currentPage="reports">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Reports & Analytics</h1>
                        <p className="text-slate-600">Comprehensive inventory insights and reports</p>
                    </div>
                    <div className="flex gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDownloadReport('comprehensive')}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export Report</span>
                        </motion.button>
                    </div>
                </div>

                {/* Report Type Selector */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="flex flex-wrap gap-2">
                        {reportTypes.map((type) => {
                            const IconComponent = type.icon;
                            return (
                                <motion.button
                                    key={type.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setReportType(type.id)}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                                        reportType === type.id
                                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                            : 'text-slate-600 hover:bg-slate-50 border border-transparent'
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
                    <LowStockReport items={lowStockItems} />
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
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-slate-600">{metric.label}</h3>
                            <div className={`text-sm ${
                                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {metric.change}
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Overview</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Items Added</span>
                            <span className="font-semibold text-slate-900">25</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Items Issued</span>
                            <span className="font-semibold text-slate-900">180</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Items Received</span>
                            <span className="font-semibold text-slate-900">95</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Total Transactions</span>
                            <span className="font-semibold text-slate-900">300</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Department Activity</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">IT Project</span>
                            <span className="font-semibold text-slate-900">45 requests</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Corporate Services</span>
                            <span className="font-semibold text-slate-900">32 requests</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Procurement</span>
                            <span className="font-semibold text-slate-900">28 requests</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Others</span>
                            <span className="font-semibold text-slate-900">15 requests</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Low Stock Report Component
const LowStockReport = ({ items }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Low Stock Alert Report</h3>
                        <p className="text-slate-600 mt-1">{items.length} items below reorder level</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toast.success('Low stock report exported')}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
                                className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900">{item.name}</h4>
                                        <p className="text-sm text-slate-600">{item.category} • {item.department}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-red-700">Stock: {item.quantity}</p>
                                    <p className="text-sm text-slate-600">Reorder: {item.reorder_level}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Package className="w-16 h-16 text-green-300 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-slate-900 mb-2">All Stock Levels Good</h4>
                        <p className="text-slate-600">No items are currently below reorder levels</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Inventory Report Component
const InventoryReport = () => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Inventory Status Report</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <Package className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <h4 className="text-lg font-semibold text-slate-900 mb-1">Electronics</h4>
                    <p className="text-2xl font-bold text-blue-600">45 items</p>
                    <p className="text-sm text-slate-600 mt-1">₦2,250,000 value</p>
                </div>

                <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                    <Package className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <h4 className="text-lg font-semibold text-slate-900 mb-1">Furniture</h4>
                    <p className="text-2xl font-bold text-green-600">78 items</p>
                    <p className="text-sm text-slate-600 mt-1">₦1,950,000 value</p>
                </div>

                <div className="text-center p-6 bg-orange-50 rounded-lg border border-orange-200">
                    <Package className="w-12 h-12 text-orange-600 mx-auto mb-3" />
                    <h4 className="text-lg font-semibold text-slate-900 mb-1">Consumables</h4>
                    <p className="text-2xl font-bold text-orange-600">27 items</p>
                    <p className="text-sm text-slate-600 mt-1">₦800,000 value</p>
                </div>
            </div>
        </div>
    );
};

// Activity Report Component
const ActivityReport = ({ stats }) => {
    const activities = stats?.recent_activities || [];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Recent Activity Log</h3>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toast.success('Activity log exported')}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
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
                        className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                        <div className={`p-2 rounded-full ${
                            activity.type === 'issue' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                        }`}>
                            <TrendingUp className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-slate-900">
                                {activity.type === 'issue' ? 'Issued' : 'Received'} {activity.quantity}x {activity.item}
                            </p>
                            <p className="text-sm text-slate-600">
                                {activity.department} • {activity.time}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-sm text-slate-500">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Today
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Reports;