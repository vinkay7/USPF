import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Search, 
    Filter, 
    FileText, 
    Clock, 
    CheckCircle, 
    XCircle,
    AlertCircle,
    User,
    Calendar,
    Package,
    Eye,
    Check,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from './Layout';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Requisitions = () => {
    const { token, user } = useAuth();
    const [requisitions, setRequisitions] = useState([]);
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedRequisition, setSelectedRequisition] = useState(null);

    const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

    const statusOptions = ['all', 'pending', 'approved', 'rejected', 'fulfilled'];

    useEffect(() => {
        fetchRequisitions();
        fetchInventoryItems();
    }, []);

    const fetchRequisitions = async () => {
        try {
            const response = await axios.get(`${API_BASE}/requisitions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequisitions(response.data);
        } catch (error) {
            toast.error('Failed to fetch requisitions');
            console.error('Requisitions fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInventoryItems = async () => {
        try {
            const response = await axios.get(`${API_BASE}/inventory`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setItems(response.data);
        } catch (error) {
            console.error('Items fetch error:', error);
        }
    };

    const handleCreateRequisition = async (formData) => {
        try {
            const response = await axios.post(`${API_BASE}/requisitions`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequisitions([response.data, ...requisitions]);
            setShowCreateModal(false);
            toast.success('Requisition created successfully');
        } catch (error) {
            toast.error('Failed to create requisition');
            console.error('Create requisition error:', error);
        }
    };

    const handleUpdateStatus = async (requisitionId, status, approvedBy = null, fulfilledBy = null) => {
        try {
            const updateData = { status };
            if (approvedBy) updateData.approved_by = approvedBy;
            if (fulfilledBy) updateData.fulfilled_by = fulfilledBy;

            const response = await axios.put(`${API_BASE}/requisitions/${requisitionId}`, updateData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setRequisitions(requisitions.map(req => 
                req.id === requisitionId ? response.data : req
            ));
            
            toast.success(`Requisition ${status} successfully`);
        } catch (error) {
            toast.error(`Failed to ${status} requisition`);
            console.error('Update status error:', error);
        }
    };

    const filteredRequisitions = requisitions.filter(req => {
        const matchesSearch = req.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            req.requested_by?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'approved': return <CheckCircle className="w-4 h-4" />;
            case 'rejected': return <XCircle className="w-4 h-4" />;
            case 'fulfilled': return <Package className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
            case 'approved': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
            case 'rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
            case 'fulfilled': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
            default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
        }
    };

    const canApprove = user?.role === 'admin' || user?.role === 'store_officer';
    const canFulfill = user?.role === 'admin' || user?.role === 'store_officer';

    if (isLoading) {
        return (
            <Layout currentPage="requisitions">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="relative mx-auto w-16 h-16 mb-4">
                            <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 font-medium">Loading requisitions...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout currentPage="requisitions">
            <div className="space-y-6 h-full overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold gradient-text mb-2">Requisition Management</h1>
                        <p className="text-slate-600 dark:text-slate-300">Create and manage inventory requisition requests</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowCreateModal(true)}
                        className="neumorphic-button px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl flex items-center space-x-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create Requisition</span>
                    </motion.button>
                </div>

                {/* Search and Filter Bar */}
                <div className="floating-card p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search requisitions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-12 pr-8 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none appearance-none cursor-pointer"
                            >
                                {statusOptions.map(status => (
                                    <option key={status} value={status}>
                                        {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Requisition Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {statusOptions.slice(1).map((status) => {
                        const count = requisitions.filter(req => req.status === status).length;
                        return (
                            <div key={status} className="floating-card p-4">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-12 h-12 neumorphic rounded-xl flex items-center justify-center ${getStatusColor(status)}`}>
                                        {getStatusIcon(status)}
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">{status}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Requisitions List */}
                <div className="floating-card flex-1 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Requisition Requests</h2>
                    </div>
                    <div className="overflow-auto h-full">
                        <div className="space-y-4 p-6">
                            {filteredRequisitions.map((requisition, index) => (
                                <motion.div
                                    key={requisition.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="neumorphic-inset p-6 rounded-xl bg-slate-50/50 dark:bg-slate-700/50 hover:shadow-lg transition-all group"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                                                        {requisition.purpose}
                                                    </h3>
                                                    <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                                                        <div className="flex items-center space-x-1">
                                                            <User className="w-4 h-4" />
                                                            <span>{requisition.requested_by}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>{new Date(requisition.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <Package className="w-4 h-4" />
                                                            <span>{requisition.requested_quantity} units</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`inline-flex items-center space-x-1 px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(requisition.status)}`}>
                                                    {getStatusIcon(requisition.status)}
                                                    <span className="capitalize">{requisition.status}</span>
                                                </div>
                                            </div>
                                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                                <span className="font-medium">Department:</span> {requisition.department}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    setSelectedRequisition(requisition);
                                                    setShowViewModal(true);
                                                }}
                                                className="neumorphic p-2 rounded-lg text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </motion.button>
                                            
                                            {canApprove && requisition.status === 'pending' && (
                                                <>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleUpdateStatus(requisition.id, 'approved', user.username)}
                                                        className="neumorphic p-2 rounded-lg text-green-600 hover:text-green-800 dark:text-green-400"
                                                        title="Approve"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleUpdateStatus(requisition.id, 'rejected', user.username)}
                                                        className="neumorphic p-2 rounded-lg text-red-600 hover:text-red-800 dark:text-red-400"
                                                        title="Reject"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </motion.button>
                                                </>
                                            )}
                                            
                                            {canFulfill && requisition.status === 'approved' && (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleUpdateStatus(requisition.id, 'fulfilled', null, user.username)}
                                                    className="neumorphic p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                                    title="Mark as Fulfilled"
                                                >
                                                    <Package className="w-4 h-4" />
                                                </motion.button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            
                            {filteredRequisitions.length === 0 && (
                                <div className="text-center py-12">
                                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                    <p className="text-slate-500 dark:text-slate-400">No requisitions found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CreateRequisitionModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateRequisition}
                items={items}
                currentUser={user}
            />

            <ViewRequisitionModal
                isOpen={showViewModal}
                onClose={() => {
                    setShowViewModal(false);
                    setSelectedRequisition(null);
                }}
                requisition={selectedRequisition}
                items={items}
            />
        </Layout>
    );
};

// Create Requisition Modal Component
const CreateRequisitionModal = ({ isOpen, onClose, onSubmit, items, currentUser }) => {
    const [formData, setFormData] = useState({
        item_id: '',
        requested_quantity: 1,
        purpose: '',
        requested_by: currentUser?.full_name || currentUser?.username || ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        setFormData({
            item_id: '',
            requested_quantity: 1,
            purpose: '',
            requested_by: currentUser?.full_name || currentUser?.username || ''
        });
    };

    const selectedItem = items.find(item => item.id === formData.item_id);

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
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Create Requisition</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Item</label>
                                <select
                                    required
                                    value={formData.item_id}
                                    onChange={(e) => setFormData({...formData, item_id: e.target.value})}
                                    className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none"
                                >
                                    <option value="">Select Item</option>
                                    {items.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} (Available: {item.quantity})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedItem && (
                                <div className="neumorphic-inset p-4 rounded-xl bg-slate-50/50 dark:bg-slate-700/50">
                                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Item Details</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                        <strong>Description:</strong> {selectedItem.description}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                        <strong>Category:</strong> {selectedItem.category}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        <strong>Available Quantity:</strong> {selectedItem.quantity}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Requested Quantity</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max={selectedItem?.quantity || 999}
                                    value={formData.requested_quantity}
                                    onChange={(e) => setFormData({...formData, requested_quantity: parseInt(e.target.value)})}
                                    className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Purpose</label>
                                <textarea
                                    required
                                    value={formData.purpose}
                                    onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                                    placeholder="Explain the purpose of this requisition..."
                                    className="w-full px-4 py-3 neumorphic-inset bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border-0 text-slate-800 dark:text-white focus:outline-none resize-none"
                                    rows="3"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Requested By</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.requested_by}
                                    onChange={(e) => setFormData({...formData, requested_by: e.target.value})}
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
                                    Create Requisition
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// View Requisition Modal Component
const ViewRequisitionModal = ({ isOpen, onClose, requisition, items }) => {
    if (!requisition) return null;

    const item = items.find(i => i.id === requisition.item_id);

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
                        className="floating-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Requisition Details</h2>
                            <button
                                onClick={onClose}
                                className="neumorphic p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Status and Basic Info */}
                            <div className="neumorphic-inset p-4 rounded-xl bg-slate-50/50 dark:bg-slate-700/50">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        {requisition.purpose}
                                    </h3>
                                    <div className={`inline-flex items-center space-x-1 px-3 py-1 text-sm font-medium rounded-full ${
                                        requisition.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                                        requisition.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                        requisition.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                    }`}>
                                        <span className="capitalize">{requisition.status}</span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-600 dark:text-slate-400">Requested By:</span>
                                        <p className="font-medium text-slate-900 dark:text-white">{requisition.requested_by}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600 dark:text-slate-400">Department:</span>
                                        <p className="font-medium text-slate-900 dark:text-white">{requisition.department}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600 dark:text-slate-400">Date Requested:</span>
                                        <p className="font-medium text-slate-900 dark:text-white">
                                            {new Date(requisition.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600 dark:text-slate-400">Quantity:</span>
                                        <p className="font-medium text-slate-900 dark:text-white">{requisition.requested_quantity} units</p>
                                    </div>
                                </div>
                            </div>

                            {/* Item Details */}
                            {item && (
                                <div className="neumorphic-inset p-4 rounded-xl bg-slate-50/50 dark:bg-slate-700/50">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Item Details</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-600 dark:text-slate-400">Item Name:</span>
                                            <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-600 dark:text-slate-400">Category:</span>
                                            <p className="font-medium text-slate-900 dark:text-white">{item.category}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-600 dark:text-slate-400">Available Quantity:</span>
                                            <p className="font-medium text-slate-900 dark:text-white">{item.quantity}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-600 dark:text-slate-400">Unit Cost:</span>
                                            <p className="font-medium text-slate-900 dark:text-white">₦{item.unit_cost.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <span className="text-slate-600 dark:text-slate-400">Description:</span>
                                        <p className="font-medium text-slate-900 dark:text-white">{item.description}</p>
                                    </div>
                                </div>
                            )}

                            {/* Approval/Fulfillment Info */}
                            {(requisition.approved_by || requisition.fulfilled_by) && (
                                <div className="neumorphic-inset p-4 rounded-xl bg-slate-50/50 dark:bg-slate-700/50">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Processing History</h3>
                                    <div className="space-y-3">
                                        {requisition.approved_by && (
                                            <div className="flex items-center space-x-3">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                        Approved by {requisition.approved_by}
                                                    </p>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                                        {new Date(requisition.updated_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {requisition.fulfilled_by && (
                                            <div className="flex items-center space-x-3">
                                                <Package className="w-5 h-5 text-blue-600" />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                        Fulfilled by {requisition.fulfilled_by}
                                                    </p>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                                        {new Date(requisition.updated_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Requisitions;