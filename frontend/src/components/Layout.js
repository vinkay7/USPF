import React, { useState } from 'react';
import { 
    LayoutDashboard, 
    Package, 
    FileText, 
    BarChart3, 
    Settings, 
    LogOut,
    Bell,
    Search,
    Menu,
    X,
    User,
    Building,
    Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children, currentPage = 'dashboard' }) => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, id: 'dashboard' },
        { name: 'Inventory', href: '/inventory', icon: Package, id: 'inventory' },
        { name: 'Requisitions', href: '/requisitions', icon: FileText, id: 'requisitions' },
        { name: 'Reports', href: '/reports', icon: BarChart3, id: 'reports' },
        { name: 'Settings', href: '/settings', icon: Settings, id: 'settings' },
    ];

    const handleNavigation = (id) => {
        // Use window.location for navigation to ensure proper routing
        const routes = {
            dashboard: '/dashboard',
            inventory: '/inventory',
            requisitions: '/requisitions',
            reports: '/reports',
            settings: '/settings'
        };
        
        if (routes[id]) {
            window.location.href = routes[id];
        }
        setSidebarOpen(false);
    };

    return (
        <div className="h-screen bg-slate-50 flex overflow-hidden">
            {/* Mobile sidebar overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                initial={false}
                animate={{
                    x: sidebarOpen || window.innerWidth >= 1024 ? 0 : '-100%'
                }}
                className="fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform lg:translate-x-0 lg:static lg:inset-0 border-r border-slate-200"
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                                    <Building className="w-4 h-4 text-white" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                    <Shield className="w-2 h-2 text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-slate-800">USPF</h1>
                                <p className="text-xs text-slate-500">Inventory</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {navigation.map((item) => {
                            const isActive = currentPage === item.id;
                            return (
                                <motion.button
                                    key={item.name}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleNavigation(item.id)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-all ${
                                        isActive
                                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
                                    <span className="font-medium">{item.name}</span>
                                </motion.button>
                            );
                        })}
                    </nav>

                    {/* User info and logout */}
                    <div className="p-4 border-t border-slate-200">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-slate-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                    {user?.full_name || user?.username}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {user?.role} • {user?.department}
                                </p>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={logout}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar */}
                <header className="bg-white shadow-sm border-b border-slate-200 h-16 flex items-center justify-between px-6">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        
                        {/* Search bar */}
                        <div className="hidden md:flex relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search inventory..."
                                className="pl-10 pr-4 py-2 w-64 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Notifications */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                        </motion.button>

                        {/* User avatar */}
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-600" />
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;