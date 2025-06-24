import React, { useState, useEffect } from 'react';
import { 
    Package, 
    Plus, 
    Search, 
    Filter, 
    QrCode, 
    Edit, 
    Eye,
    AlertTriangle,
    ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from './Layout';
import QRScanner from './QRScanner';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Inventory = () => {
    const { token } = useAuth();
    const [inventory, setInventory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showItemModal, setShowItemModal] = useState(false);

    const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const response = await axios.get(`${API_BASE}/inventory`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInventory(response.data);
        } catch (error) {
            toast.error('Failed to fetch inventory');
            console.error('Inventory fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories = [...new Set(inventory.map(item => item.category))];

    const handleAddItem = () => {
        setShowAddModal(true);
    };

    const handleViewItem = (item) => {
        setSelectedItem(item);
        setShowItemModal(true);
    };

    const handleEditItem = (item) => {
        setSelectedItem(item);
        // TODO: Implement edit functionality - could open edit modal
        toast.info('Edit functionality - Click "View" to see item details');
    };

    const handleEditItem = (item) => {
        setSelectedItem(item);
        // TODO: Implement edit functionality
        toast.info('Edit functionality coming soon!');
    };

    const handleQRScan = (result) => {
        try {
            const data = JSON.parse(result);
            if (data.id) {
                const item = inventory.find(i => i.id === data.id);
                if (item) {
                    handleViewItem(item);
                    toast.success('Item found via QR scan!');
                } else {
                    toast.error('Item not found in inventory');
                }
            }
        } catch (e) {
            toast.error('Invalid QR code format');
        }
        setShowQRScanner(false);
    };

    const getStockStatus = (item) => {
        if (item.quantity === 0) return { status: 'out', color: 'red' };
        if (item.quantity <= item.reorder_level) return { status: 'low', color: 'orange' };
        return { status: 'good', color: 'green' };
    };

    if (isLoading) {
        return (
            <Layout currentPage="inventory">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout currentPage="inventory">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Inventory Management</h1>
                        <p className="text-slate-600">{inventory.length} items in stock</p>
                    </div>
                    <div className="flex gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowQRScanner(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <QrCode className="w-4 h-4" />
                            <span>Scan QR</span>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAddItem}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Item</span>
                        </motion.button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search inventory..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="relative">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Inventory Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredInventory.map((item, index) => {
                        const stockStatus = getStockStatus(item);
                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Item Header */}
                                <div className="p-6 pb-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-900 text-lg mb-1">{item.name}</h3>
                                            <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            stockStatus.color === 'green' ? 'bg-green-100 text-green-700' :
                                            stockStatus.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {stockStatus.status === 'good' ? 'In Stock' :
                                             stockStatus.status === 'low' ? 'Low Stock' : 'Out of Stock'}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
                                        <span>Category: {item.category}</span>
                                        <span>Qty: {item.quantity}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-slate-900">
                                            ₦{item.unit_cost.toLocaleString()}
                                        </span>
                                        <span className="text-slate-600">{item.department}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                                    <div className="flex gap-2">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleViewItem(item)}
                                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span className="text-sm">View</span>
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleEditItem(item)}
                                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                            <span className="text-sm">Edit</span>
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {filteredInventory.length === 0 && (
                    <div className="text-center py-12">
                        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No items found</h3>
                        <p className="text-slate-600 mb-4">
                            {searchTerm || categoryFilter !== 'all' 
                                ? 'Try adjusting your search or filters' 
                                : 'Get started by adding your first inventory item'}
                        </p>
                        {!searchTerm && categoryFilter === 'all' && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleAddItem}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Add First Item
                            </motion.button>
                        )}
                    </div>
                )}
            </div>

            {/* QR Scanner Modal */}
            {showQRScanner && (
                <QRScanner
                    onScan={handleQRScan}
                    onClose={() => setShowQRScanner(false)}
                />
            )}

            {/* Item Detail Modal */}
            <AnimatePresence>
                {showItemModal && selectedItem && (
                    <ItemDetailModal
                        item={selectedItem}
                        onClose={() => setShowItemModal(false)}
                        token={token}
                    />
                )}
            </AnimatePresence>

            {/* Add Item Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <AddItemModal
                        onClose={() => setShowAddModal(false)}
                        onItemAdded={fetchInventory}
                        token={token}
                    />
                )}
            </AnimatePresence>
        </Layout>
    );
};

// Item Detail Modal Component
const ItemDetailModal = ({ item, onClose, token }) => {
    const [binCardHistory, setBinCardHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

    useEffect(() => {
        fetchBinCardHistory();
    }, []);

    const fetchBinCardHistory = async () => {
        try {
            const response = await axios.get(`${API_BASE}/inventory/${item.id}/bin-card`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBinCardHistory(response.data);
        } catch (error) {
            toast.error('Failed to fetch item history');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-900">{item.name}</h2>
                    <p className="text-slate-600 mt-1">{item.description}</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Item Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <p className="text-slate-900">{item.category}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                            <p className="text-slate-900">{item.department}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Current Stock</label>
                            <p className="text-slate-900 font-semibold">{item.quantity}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Unit Cost</label>
                            <p className="text-slate-900">₦{item.unit_cost.toLocaleString()}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level</label>
                            <p className="text-slate-900">{item.reorder_level}</p>
                        </div>
                    </div>

                    {/* QR Code */}
                    {item.qr_code && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">QR Code</label>
                            <img src={item.qr_code} alt="QR Code" className="w-32 h-32 border border-slate-200 rounded-lg" />
                        </div>
                    )}

                    {/* BIN Card History */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Transaction History</h3>
                        {isLoading ? (
                            <div className="flex justify-center py-4">
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {binCardHistory.map((entry, index) => (
                                    <div key={entry.id || index} className="p-3 bg-slate-50 rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {entry.transaction_type.charAt(0).toUpperCase() + entry.transaction_type.slice(1)}
                                                </p>
                                                <p className="text-sm text-slate-600">{entry.remarks}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-slate-900">
                                                    {entry.transaction_type === 'issue' ? '-' : '+'}{entry.quantity}
                                                </p>
                                                <p className="text-sm text-slate-600">Balance: {entry.balance}</p>
                                            </div>
                                        </div>
                                        {entry.reference_number && (
                                            <p className="text-xs text-slate-500 mt-1">Ref: {entry.reference_number}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Add Item Modal Component
const AddItemModal = ({ onClose, onItemAdded, token }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        quantity: 0,
        unit_cost: 0,
        reorder_level: 10,
        department: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await axios.post(`${API_BASE}/inventory`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Item added successfully!');
            onItemAdded();
            onClose();
        } catch (error) {
            toast.error('Failed to add item');
            console.error('Add item error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-900">Add New Item</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                            <input
                                type="text"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                            <input
                                type="number"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Unit Cost (₦)</label>
                            <input
                                type="number"
                                name="unit_cost"
                                value={formData.unit_cost}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level</label>
                            <input
                                type="number"
                                name="reorder_level"
                                value={formData.reorder_level}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Item'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default Inventory;