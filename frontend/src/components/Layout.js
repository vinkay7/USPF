import React, { useState, useEffect } from 'react';
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
    Sun,
    Moon,
    ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children, currentPage = 'dashboard' }) => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.notification-dropdown')) {
                setNotificationOpen(false);
            }
            if (!event.target.closest('.profile-dropdown')) {
                setProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Dark mode persistence
    useEffect(() => {
        const saved = localStorage.getItem('uspf_dark_mode');
        if (saved) {
            const isDark = JSON.parse(saved);
            setDarkMode(isDark);
            if (isDark) {
                document.documentElement.classList.add('dark');
            }
        }
    }, []);

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('uspf_dark_mode', JSON.stringify(newDarkMode));
        if (newDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Role-based navigation
    const getNavigationForRole = (userRole) => {
        const baseNavigation = [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, id: 'dashboard' },
            { name: 'Inventory', href: '/inventory', icon: Package, id: 'inventory' },
        ];

        if (userRole === 'admin') {
            return [
                ...baseNavigation,
                { name: 'Requisitions', href: '/requisitions', icon: FileText, id: 'requisitions' },
                { name: 'Reports', href: '/reports', icon: BarChart3, id: 'reports' },
                { name: 'Settings', href: '/settings', icon: Settings, id: 'settings' },
            ];
        } else if (userRole === 'store_officer') {
            return [
                ...baseNavigation,
                { name: 'Requisitions', href: '/requisitions', icon: FileText, id: 'requisitions' },
                { name: 'Reports', href: '/reports', icon: BarChart3, id: 'reports' },
            ];
        } else {
            // Department users
            return [
                ...baseNavigation,
                { name: 'Requisitions', href: '/requisitions', icon: FileText, id: 'requisitions' },
            ];
        }
    };

    const navigation = getNavigationForRole(user?.role || 'admin');

    const handleNavigation = (id) => {
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

    const notifications = [
        { id: 1, message: 'Low stock alert: Office Chairs (5 remaining)', type: 'warning', time: '2h ago' },
        { id: 2, message: 'New requisition request from IT Project', type: 'info', time: '4h ago' },
        { id: 3, message: 'Inventory update completed successfully', type: 'success', time: '1d ago' },
    ];

    // Sidebar Component (Shared)
    const SidebarContent = ({ isMobile = false }) => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 neumorphic bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <img 
                            src="/src/assets/uspf-logo.png" 
                            alt="USPF Logo" 
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <div className="hidden w-8 h-8 bg-gradient-to-br from-blue-600 to-green-600 rounded-full items-center justify-center">
                            <span className="text-white font-bold text-xs">USPF</span>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-800 dark:text-white">USPF</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Inventory</p>
                    </div>
                </div>
                {isMobile && (
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navigation.map((item) => {
                    const isActive = currentPage === item.id;
                    return (
                        <motion.button
                            key={item.name}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleNavigation(item.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-xl transition-all ${
                                isActive
                                    ? 'neumorphic-inset bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg'
                                    : 'neumorphic text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white/50 dark:bg-slate-800/30'
                            }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                            <span className="font-medium">{item.name}</span>
                        </motion.button>
                    );
                })}
            </nav>

            {/* User Profile Card */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="floating-card p-4 mb-4">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 neumorphic bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {user?.full_name || user?.username}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {user?.role} • {user?.department}
                            </p>
                        </div>
                    </div>
                </div>
                
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={logout}
                    className="w-full neumorphic bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl px-4 py-3 flex items-center space-x-2 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Sign Out</span>
                </motion.button>
            </div>
        </div>
    );

    return (
        <div className={`h-screen ${darkMode ? 'dark' : ''}`}>
            <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-900 dark:to-slate-800 flex overflow-hidden transition-all duration-500">
                
                {/* Mobile sidebar overlay */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden backdrop-blur-sm"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Desktop Sidebar */}
                <div className="hidden lg:flex lg:flex-shrink-0">
                    <div className="w-64 floating-card m-4 mr-0">
                        <SidebarContent />
                    </div>
                </div>

                {/* Mobile Sidebar */}
                <motion.div
                    initial={false}
                    animate={{
                        x: sidebarOpen ? 0 : '-100%'
                    }}
                    className="fixed inset-y-0 left-0 z-30 w-64 transform lg:hidden"
                >
                    <div className="floating-card h-full m-4">
                        <SidebarContent isMobile={true} />
                    </div>
                </motion.div>

                {/* Main content */}
                <div className="flex-1 flex flex-col overflow-hidden lg:ml-4">
                    {/* Top Header */}
                    <header className="floating-card h-16 flex items-center justify-between px-6 m-4 mb-0">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden neumorphic p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white/50 dark:bg-slate-800/30"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            
                            {/* Search bar - Hidden on mobile */}
                            <div className="hidden md:flex relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search inventory..."
                                    className="pl-12 pr-4 py-3 w-80 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Dark Mode Toggle */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleDarkMode}
                                className="neumorphic p-3 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white/50 dark:bg-slate-800/30 transition-all"
                            >
                                {darkMode ? (
                                    <Sun className="w-5 h-5 text-yellow-500" />
                                ) : (
                                    <Moon className="w-5 h-5" />
                                )}
                            </motion.button>

                            {/* Notifications Dropdown */}
                            <div className="relative">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setNotificationOpen(!notificationOpen)}
                                    className="neumorphic p-3 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white/50 dark:bg-slate-800/30 transition-all relative"
                                >
                                    <Bell className="w-5 h-5" />
                                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                                </motion.button>

                                <AnimatePresence>
                                    {notificationOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-2 w-80 floating-card p-4 z-50"
                                        >
                                            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Notifications</h3>
                                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                                {notifications.map((notification) => (
                                                    <div key={notification.id} className="neumorphic-inset p-3 rounded-lg bg-slate-50/50 dark:bg-slate-700/50">
                                                        <p className="text-sm text-slate-800 dark:text-slate-200 mb-1">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            {notification.time}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Profile Avatar Dropdown */}
                            <div className="relative">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className="neumorphic p-2 rounded-xl bg-white/50 dark:bg-slate-800/30 flex items-center space-x-2 transition-all"
                                >
                                    <div className="w-8 h-8 neumorphic bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                </motion.button>

                                <AnimatePresence>
                                    {profileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-2 w-64 floating-card p-4 z-50"
                                        >
                                            <div className="text-center mb-4">
                                                <div className="w-16 h-16 neumorphic bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-2">
                                                    <User className="w-8 h-8 text-slate-600 dark:text-slate-300" />
                                                </div>
                                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                                    {user?.full_name || user?.username}
                                                </h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {user?.role} • {user?.department}
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <button 
                                                    onClick={() => handleNavigation('settings')}
                                                    className="w-full neumorphic text-left px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all"
                                                >
                                                    <Settings className="w-4 h-4 inline mr-2" />
                                                    Settings
                                                </button>
                                                <button 
                                                    onClick={logout}
                                                    className="w-full neumorphic text-left px-4 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                >
                                                    <LogOut className="w-4 h-4 inline mr-2" />
                                                    Sign Out
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </header>

                    {/* Page content */}
                    <main className="flex-1 overflow-auto p-4 pt-0">
                        <div className="floating-card p-6 h-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Layout;