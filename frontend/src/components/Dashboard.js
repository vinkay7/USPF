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
    Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from './Layout';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
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
            trend: 'up'
        },
        {
            title: 'Total Value',
            value: `₦${(stats?.total_value || 0).toLocaleString()}`,
            icon: TrendingUp,
            color: 'green',
            change: '+8.2%',
            trend: 'up'
        },
        {
            title: 'Low Stock Alerts',
            value: stats?.low_stock_count || 0,
            icon: AlertTriangle,
            color: 'red',
            change: '-3',
            trend: 'down'
        },
        {
            title: 'Pending Requisitions',
            value: stats?.pending_requisitions || 0,
            icon: FileText,
            color: 'orange',
            change: '+5',
            trend: 'up'
        }
    ];

    const quickActions = [
        { name: 'Add New Item', icon: Plus, color: 'blue', action: () => console.log('Add item') },
        { name: 'Scan QR Code', icon: QrCode, color: 'green', action: () => console.log('Scan QR') },
        { name: 'Create Requisition', icon: FileText, color: 'orange', action: () => console.log('Create requisition') },
    ];

    if (isLoading) {
        return (
            <Layout currentPage="dashboard">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout currentPage="dashboard">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-bold text-slate-900 mb-2"
                    >
                        Dashboard Overview
                    </motion.h1>
                    <p className="text-slate-600">Welcome to USPF Inventory Management System</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat, index) => {
                        const IconComponent = stat.icon;
                        const colorClasses = {
                            blue: 'bg-blue-500 text-blue-600 bg-blue-50',
                            green: 'bg-green-500 text-green-600 bg-green-50',
                            red: 'bg-red-500 text-red-600 bg-red-50',
                            orange: 'bg-orange-500 text-orange-600 bg-orange-50'
                        };

                        return (
                            <motion.div
                                key={stat.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-2 rounded-lg ${colorClasses[stat.color].split(' ')[2]}`}>
                                        <IconComponent className={`w-6 h-6 ${colorClasses[stat.color].split(' ')[1]}`} />
                                    </div>
                                    <div className={`flex items-center text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                        {stat.trend === 'up' ? (
                                            <ArrowUpRight className="w-4 h-4 mr-1" />
                                        ) : (
                                            <ArrowDownRight className="w-4 h-4 mr-1" />
                                        )}
                                        {stat.change}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</p>
                                    <p className="text-sm text-slate-600">{stat.title}</p>
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
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
                >
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {quickActions.map((action, index) => {
                            const IconComponent = action.icon;
                            const colorClasses = {
                                blue: 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200',
                                green: 'hover:bg-green-50 hover:text-green-700 hover:border-green-200',
                                orange: 'hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200'
                            };

                            return (
                                <motion.button
                                    key={action.name}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={action.action}
                                    className={`flex items-center space-x-3 p-4 border border-slate-200 rounded-lg transition-all ${colorClasses[action.color]}`}
                                >
                                    <IconComponent className="w-5 h-5" />
                                    <span className="font-medium">{action.name}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Recent Activities */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-slate-900">Recent Activities</h2>
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            View All
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {stats?.recent_activities?.map((activity, index) => (
                            <div key={index} className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg">
                                <div className={`p-2 rounded-full ${
                                    activity.type === 'issue' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                }`}>
                                    {activity.type === 'issue' ? (
                                        <ArrowUpRight className="w-4 h-4 rotate-45" />
                                    ) : (
                                        <ArrowDownRight className="w-4 h-4 -rotate-45" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">
                                        {activity.type === 'issue' ? 'Issued' : 'Received'} {activity.quantity}x {activity.item}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {activity.department} • {activity.time}
                                    </p>
                                </div>
                            </div>
                        )) || (
                            <div className="flex items-center justify-center py-8 text-slate-500">
                                <Clock className="w-5 h-5 mr-2" />
                                No recent activities
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </Layout>
    );
};

export default Dashboard;