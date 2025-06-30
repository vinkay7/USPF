import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Search, 
    Filter, 
    Edit, 
    Trash2, 
    QrCode, 
    Package, 
    AlertTriangle,
    TrendingUp,
    MoreVertical,
    Eye,
    Download,
    Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from './Layout';
import QRScanner from './QRScanner';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Inventory = () => {
    const { token } = useAuth();
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [showBinCard, setShowBinCard] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [binCardHistory, setBinCardHistory] = useState([]);

    const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

    const categories = ['all', 'Electronics', 'Furniture', 'Consumables', 'Equipment', 'Stationery'];

    useEffect(() => {
        fetchInventoryItems();
    }, []);

    const fetchInventoryItems = async () => {
        try {
            const response = await axios.get(`${API_BASE}/inventory`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setItems(response.data);
        } catch (error) {
            toast.error('Failed to fetch inventory items');
            console.error('Inventory fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBinCardHistory = async (itemId) => {
        try {
            const response = await axios.get(`${API_BASE}/inventory/${itemId}/bin-card`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBinCardHistory(response.data);
        } catch (error) {
            toast.error('Failed to fetch BIN card history');
            console.error('BIN card error:', error);
        }
    };

    const handleAddItem = async (formData) => {
        try {
            const response = await axios.post(`${API_BASE}/inventory`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setItems([...items, response.data]);
            setShowAddModal(false);
            toast.success('Item added successfully');
        } catch (error) {
            toast.error('Failed to add item');
            console.error('Add item error:', error);
        }
    };

    const handleEditItem = async (itemId, formData) => {
        try {
            const response = await axios.put(`${API_BASE}/inventory/${itemId}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setItems(items.map(item => item.id === itemId ? response.data : item));
            setShowEditModal(false);
            setSelectedItem(null);
            toast.success('Item updated successfully');
        } catch (error) {
            toast.error('Failed to update item');
            console.error('Update item error:', error);
        }
    };

    const handleViewBinCard = (item) => {
        setSelectedItem(item);
        fetchBinCardHistory(item.id);
        setShowBinCard(true);
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getStockStatus = (quantity, reorderLevel) => {
        if (quantity === 0) return { status: 'Out of Stock', color: 'red' };
        if (quantity <= reorderLevel) return { status: 'Low Stock', color: 'orange' };
        return { status: 'In Stock', color: 'green' };
    };

    if (isLoading) {
        return (
            <Layout currentPage="inventory">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="relative mx-auto w-16 h-16 mb-4">
                            <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 font-medium">Loading inventory...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout currentPage="inventory">
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold gradient-text mb-2">Inventory Management</h1>
                        <p className="text-slate-600 dark:text-slate-300">Track and manage your inventory items</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowQRScanner(true)}
                            className="neumorphic-button px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg flex items-center justify-center space-x-2"
                        >
                            <QrCode className="w-4 h-4" />
                            <span>Scan QR</span>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowAddModal(true)}
                            className="neumorphic-button px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg flex items-center justify-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Item</span>
                        </motion.button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="floating-card p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white placeholder-slate-500 focus:outline-none"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="pl-10 pr-8 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none appearance-none cursor-pointer min-w-[150px]"
                            >
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {category === 'all' ? 'All Categories' : category}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Inventory Table */}
                <div className="floating-card overflow-hidden">
                    {/* Mobile-friendly header */}
                    <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Inventory Items</h3>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                {filteredItems.length} items
                            </span>
                        </div>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">Item Details</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">Category</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">Quantity</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">Unit Cost</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">Status</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((item, index) => {
                                    const stockStatus = getStockStatus(item.quantity, item.reorder_level);
                                    return (
                                        <motion.tr
                                            key={item.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                        >
                                            <td className="py-4 px-6">
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{item.description}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="font-medium text-slate-900 dark:text-white">{item.quantity}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="font-medium text-slate-900 dark:text-white">₦{item.unit_cost.toLocaleString()}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                    stockStatus.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                                    stockStatus.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                                                    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                }`}>
                                                    {stockStatus.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center space-x-2">
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleViewBinCard(item)}
                                                        className="neumorphic p-2 rounded-lg text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                                        title="View BIN Card"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => {
                                                            setSelectedItem(item);
                                                            setShowEditModal(true);
                                                        }}
                                                        className="neumorphic p-2 rounded-lg text-green-600 hover:text-green-800 dark:text-green-400"
                                                        title="Edit Item"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => {
                                                            setSelectedItem(item);
                                                            setShowQRModal(true);
                                                        }}
                                                        className="neumorphic p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400"
                                                        title="Show QR Code"
                                                    >
                                                        <QrCode className="w-4 h-4" />
                                                    </motion.button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredItems.length === 0 && (
                            <div className="text-center py-12">
                                <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                <p className="text-slate-500 dark:text-slate-400">No inventory items found</p>
                            </div>
                        )}
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden">
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredItems.map((item, index) => {
                                const stockStatus = getStockStatus(item.quantity, item.reorder_level);
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-slate-900 dark:text-white truncate">{item.name}</h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{item.description}</p>
                                            </div>
                                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                stockStatus.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                                stockStatus.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                                                'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                            }`}>
                                                {stockStatus.status}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-4 mb-3">
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Category</p>
                                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                                    {item.category}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Quantity</p>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{item.quantity}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Unit Cost</p>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">₦{item.unit_cost.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleViewBinCard(item)}
                                                    className="neumorphic p-2 rounded-lg text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                                    title="View BIN Card"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="neumorphic p-2 rounded-lg text-green-600 hover:text-green-800 dark:text-green-400"
                                                    title="Edit Item"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        setShowQRModal(true);
                                                    }}
                                                    className="neumorphic p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400"
                                                    title="Show QR Code"
                                                >
                                                    <QrCode className="w-4 h-4" />
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                        {filteredItems.length === 0 && (
                            <div className="text-center py-12">
                                <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                <p className="text-slate-500 dark:text-slate-400">No inventory items found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AddItemModal 
                isOpen={showAddModal} 
                onClose={() => setShowAddModal(false)} 
                onSubmit={handleAddItem}
                categories={categories.filter(c => c !== 'all')}
            />
            
            <EditItemModal 
                isOpen={showEditModal} 
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                }} 
                onSubmit={handleEditItem}
                item={selectedItem}
                categories={categories.filter(c => c !== 'all')}
            />

            <BinCardModal
                isOpen={showBinCard}
                onClose={() => {
                    setShowBinCard(false);
                    setSelectedItem(null);
                    setBinCardHistory([]);
                }}
                item={selectedItem}
                history={binCardHistory}
            />

            <QRScanner
                isOpen={showQRScanner}
                onClose={() => setShowQRScanner(false)}
                onScan={(data) => {
                    // Handle QR scan result
                    console.log('QR Scan result:', data);
                    setShowQRScanner(false);
                }}
            />

            <QRCodeModal
                isOpen={showQRModal}
                onClose={() => {
                    setShowQRModal(false);
                    setSelectedItem(null);
                }}
                item={selectedItem}
            />
        </Layout>
    );
};

// Add Item Modal Component
const AddItemModal = ({ isOpen, onClose, onSubmit, categories }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        quantity: 0,
        unit_cost: 0,
        reorder_level: 10,
        department: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        setFormData({
            name: '',
            description: '',
            category: '',
            quantity: 0,
            unit_cost: 0,
            reorder_level: 10,
            department: ''
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
                        className="floating-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Add New Item</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Item Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none resize-none"
                                    rows="3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Quantity</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                                        className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Unit Cost (₦)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.unit_cost}
                                        onChange={(e) => setFormData({...formData, unit_cost: parseFloat(e.target.value)})}
                                        className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Reorder Level</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.reorder_level}
                                    onChange={(e) => setFormData({...formData, reorder_level: parseInt(e.target.value)})}
                                    className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Department</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.department}
                                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                                    className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none"
                                />
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 neumorphic-button py-3 text-slate-600 dark:text-slate-400 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 neumorphic-button py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl"
                                >
                                    Add Item
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Edit Item Modal Component
const EditItemModal = ({ isOpen, onClose, onSubmit, item, categories }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        quantity: 0,
        unit_cost: 0,
        reorder_level: 10
    });

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name || '',
                description: item.description || '',
                category: item.category || '',
                quantity: item.quantity || 0,
                unit_cost: item.unit_cost || 0,
                reorder_level: item.reorder_level || 10
            });
        }
    }, [item]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(item.id, formData);
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
                        className="floating-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Edit Item</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Item Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none resize-none"
                                    rows="3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Quantity</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                                        className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Unit Cost (₦)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.unit_cost}
                                        onChange={(e) => setFormData({...formData, unit_cost: parseFloat(e.target.value)})}
                                        className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Reorder Level</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.reorder_level}
                                    onChange={(e) => setFormData({...formData, reorder_level: parseInt(e.target.value)})}
                                    className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none"
                                />
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 neumorphic-button py-3 text-slate-600 dark:text-slate-400 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 neumorphic-button py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl"
                                >
                                    Update Item
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// BIN Card Modal Component
const BinCardModal = ({ isOpen, onClose, item, history }) => {
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
                        className="floating-card p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">BIN Card History</h2>
                                <p className="text-slate-600 dark:text-slate-400">{item?.name}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="neumorphic p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Date</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Type</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Quantity</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Balance</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Reference</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((entry, index) => (
                                        <tr key={entry.id} className="border-b border-slate-100 dark:border-slate-700/50">
                                            <td className="py-3 px-4 text-sm text-slate-900 dark:text-white">
                                                {new Date(entry.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                    entry.transaction_type === 'issue' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                                    entry.transaction_type === 'receive' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                }`}>
                                                    {entry.transaction_type}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-900 dark:text-white">{entry.quantity}</td>
                                            <td className="py-3 px-4 text-sm text-slate-900 dark:text-white">{entry.balance}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{entry.reference_number}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{entry.remarks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {history.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-slate-500 dark:text-slate-400">No transaction history available</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// QR Code Modal Component
const QRCodeModal = ({ isOpen, onClose, item }) => {
    if (!item) return null;

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
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">QR Code</h2>
                                <p className="text-slate-600 dark:text-slate-400">{item.name}</p>
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
                                {item.qr_code ? (
                                    <img 
                                        src={item.qr_code} 
                                        alt={`QR Code for ${item.name}`}
                                        className="w-48 h-48 object-contain mx-auto"
                                    />
                                ) : (
                                    <div className="w-48 h-48 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg">
                                        <div className="text-center">
                                            <QrCode className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                                            <p className="text-slate-500 dark:text-slate-400 text-sm">QR Code not available</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Scan this QR code to quickly access item information
                            </p>
                        </div>

                        {/* Item Info */}
                        <div className="neumorphic-inset p-4 rounded-xl bg-slate-50/50 dark:bg-slate-700/50 mb-6">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-slate-600 dark:text-slate-400">Item ID:</span>
                                    <p className="font-medium text-slate-900 dark:text-white">{item.id}</p>
                                </div>
                                <div>
                                    <span className="text-slate-600 dark:text-slate-400">Category:</span>
                                    <p className="font-medium text-slate-900 dark:text-white">{item.category}</p>
                                </div>
                                <div>
                                    <span className="text-slate-600 dark:text-slate-400">Quantity:</span>
                                    <p className="font-medium text-slate-900 dark:text-white">{item.quantity}</p>
                                </div>
                                <div>
                                    <span className="text-slate-600 dark:text-slate-400">Unit Cost:</span>
                                    <p className="font-medium text-slate-900 dark:text-white">₦{item.unit_cost?.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    // Download QR code functionality
                                    if (item.qr_code) {
                                        const link = document.createElement('a');
                                        link.href = item.qr_code;
                                        link.download = `qr-code-${item.name.replace(/\s+/g, '-').toLowerCase()}.png`;
                                        link.click();
                                    }
                                }}
                                className="flex-1 neumorphic-button py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl"
                                disabled={!item.qr_code}
                            >
                                Download QR
                            </button>
                            <button
                                onClick={() => {
                                    // Print QR code functionality
                                    if (item.qr_code) {
                                        const printWindow = window.open('', '_blank');
                                        printWindow.document.write(`
                                            <html>
                                                <head><title>QR Code - ${item.name}</title></head>
                                                <body style="text-align: center; padding: 20px;">
                                                    <h2>${item.name}</h2>
                                                    <img src="${item.qr_code}" style="max-width: 300px;" />
                                                    <p>Item ID: ${item.id}</p>
                                                </body>
                                            </html>
                                        `);
                                        printWindow.document.close();
                                        printWindow.print();
                                    }
                                }}
                                className="flex-1 neumorphic-button py-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl"
                                disabled={!item.qr_code}
                            >
                                Print QR
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Inventory;