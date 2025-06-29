import React, { useState, useEffect } from 'react';
import { 
    Package, 
    TrendingUp, 
    AlertTriangle, 
    FileText,
    Plus,
    QrCode,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Activity,
    DollarSign,
    Users,
    ShoppingCart
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const response = await axios.get(`${API_BASE}/dashboard/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (error) {
            toast.error('Failed to fetch dashboard data');
            console.error('Dashboard error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Total Items',
            value: stats?.total_items || 0,
            icon: Package,
            color: 'blue',
            change: '+12%',
            trend: 'up',
            description: 'items in inventory'
        },
        {
            title: 'Total Value',
            value: `₦${(stats?.total_value || 0).toLocaleString()}`,
            icon: DollarSign,
            color: 'green',
            change: '+8.2%',
            trend: 'up',
            description: 'inventory value'
        },
        {
            title: 'Low Stock Alerts',
            value: stats?.low_stock_count || 0,
            icon: AlertTriangle,
            color: 'red',
            change: '-3',
            trend: 'down',
            description: 'items below reorder level'
        },
        {
            title: 'Pending Requisitions',
            value: stats?.pending_requisitions || 0,
            icon: FileText,
            color: 'orange',
            change: '+5',
            trend: 'up',
            description: 'awaiting approval'
        }
    ];

    const quickActions = [
        { 
            name: 'Add New Item', 
            icon: Plus, 
            color: 'blue', 
            action: () => window.location.href = '/inventory',
            description: 'Add inventory item'
        },
        { 
            name: 'Scan QR Code', 
            icon: QrCode, 
            color: 'green', 
            action: () => window.location.href = '/inventory',
            description: 'Quick item lookup'
        },
        { 
            name: 'Create Requisition', 
            icon: ShoppingCart, 
            color: 'orange', 
            action: () => window.location.href = '/requisitions',
            description: 'Request inventory'
        },
        { 
            name: 'View Reports', 
            icon: TrendingUp, 
            color: 'purple', 
            action: () => window.location.href = '/reports',
            description: 'Analytics & insights'
        },
    ];

    const getColorClasses = (color) => {
        const colorMap = {
            blue: {
                bg: 'bg-blue-500',
                text: 'text-blue-600',
                bgLight: 'bg-blue-50 dark:bg-blue-900/20',
                gradient: 'from-blue-500 to-blue-600'
            },
            green: {
                bg: 'bg-green-500',
                text: 'text-green-600',
                bgLight: 'bg-green-50 dark:bg-green-900/20',
                gradient: 'from-green-500 to-green-600'
            },
            red: {
                bg: 'bg-red-500',
                text: 'text-red-600',
                bgLight: 'bg-red-50 dark:bg-red-900/20',
                gradient: 'from-red-500 to-red-600'
            },
            orange: {
                bg: 'bg-orange-500',
                text: 'text-orange-600',
                bgLight: 'bg-orange-50 dark:bg-orange-900/20',
                gradient: 'from-orange-500 to-orange-600'
            },
            purple: {
                bg: 'bg-purple-500',
                text: 'text-purple-600',
                bgLight: 'bg-purple-50 dark:bg-purple-900/20',
                gradient: 'from-purple-500 to-purple-600'
            }
        };
        return colorMap[color] || colorMap.blue;
    };

    if (isLoading) {
        return (
            <Layout currentPage="dashboard">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="relative mx-auto w-16 h-16 mb-4">
                            <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 font-medium">Loading dashboard...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout currentPage="dashboard">
            <div className="space-y-6 h-full overflow-y-auto">
                {/* Header */}
                <div className="mb-8">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold gradient-text mb-2"
                    >
                        Dashboard Overview
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-600 dark:text-slate-300 text-lg"
                    >
                        Welcome to USPF Inventory Management System
                    </motion.p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat, index) => {
                        const IconComponent = stat.icon;
                        const colors = getColorClasses(stat.color);

                        return (
                            <motion.div
                                key={stat.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                className="floating-card p-6 group cursor-pointer"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 neumorphic ${colors.bgLight} rounded-xl group-hover:shadow-lg transition-all`}>
                                        <IconComponent className={`w-6 h-6 ${colors.text}`} />
                                    </div>
                                    <div className={`flex items-center text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                        {stat.trend === 'up' ? (
                                            <ArrowUpRight className="w-4 h-4 mr-1" />
                                        ) : (
                                            <ArrowDownRight className="w-4 h-4 mr-1" />
                                        )}
                                        {stat.change}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</p>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{stat.title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{stat.description}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="floating-card p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Quick Actions</h2>
                        <div className="w-8 h-8 neumorphic bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {quickActions.map((action, index) => {
                            const IconComponent = action.icon;
                            const colors = getColorClasses(action.color);

                            return (
                                <motion.button
                                    key={action.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 + index * 0.1 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={action.action}
                                    className="neumorphic-button p-6 text-left rounded-xl bg-white/50 dark:bg-slate-800/30 hover:shadow-floating transition-all group"
                                >
                                    <div className={`w-12 h-12 neumorphic bg-gradient-to-r ${colors.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:shadow-lg transition-all`}>
                                        <IconComponent className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{action.name}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{action.description}</p>
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Recent Activities */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="floating-card p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Recent Activities</h2>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="neumorphic px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 transition-all"
                        >
                            View All
                        </motion.button>
                    </div>
                    
                    <div className="space-y-4">
                        {stats?.recent_activities?.map((activity, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 + index * 0.1 }}
                                className="neumorphic-inset p-4 rounded-xl bg-slate-50/50 dark:bg-slate-700/50 flex items-center space-x-4 hover:shadow-lg transition-all group"
                            >
                                <div className={`p-3 neumorphic rounded-xl ${
                                    activity.type === 'issue' 
                                        ? 'bg-red-50 dark:bg-red-900/20' 
                                        : 'bg-green-50 dark:bg-green-900/20'
                                } group-hover:shadow-md transition-all`}>
                                    {activity.type === 'issue' ? (
                                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                                    ) : (
                                        <ArrowDownRight className="w-5 h-5 text-green-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                                        {activity.type === 'issue' ? 'Issued' : 'Received'} {activity.quantity}x {activity.item}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {activity.department} • {activity.time}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                        activity.type === 'issue'
                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    }`}>
                                        {activity.type === 'issue' ? 'Outbound' : 'Inbound'}
                                    </div>
                                </div>
                            </motion.div>
                        )) || (
                            <div className="flex items-center justify-center py-12 text-slate-500 dark:text-slate-400">
                                <Clock className="w-6 h-6 mr-3" />
                                <span className="text-lg">No recent activities</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </Layout>
    );
};

export default Dashboard;