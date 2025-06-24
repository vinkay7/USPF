import React, { useState, useEffect } from 'react';
import { 
    FileText, 
    Plus, 
    Clock, 
    CheckCircle, 
    XCircle,
    AlertCircle,
    Filter,
    Search,
    ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from './Layout';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Requisitions = () => {
    const { token, user } = useAuth();
    const [requisitions, setRequisitions] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [reqResponse, invResponse] = await Promise.all([
                axios.get(`${API_BASE}/requisitions`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_BASE}/inventory`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setRequisitions(reqResponse.data);
            setInventory(invResponse.data);
        } catch (error) {
            toast.error('Failed to fetch data');
            console.error('Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredRequisitions = requisitions.filter(req => {
        const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
        const matchesSearch = searchTerm === '' || 
            req.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.requested_by.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4 text-orange-600" />;
            case 'approved':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'rejected':
                return <XCircle className="w-4 h-4 text-red-600" />;
            case 'fulfilled':
                return <CheckCircle className="w-4 h-4 text-blue-600" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-600" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'approved':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'rejected':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'fulfilled':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const handleUpdateStatus = async (requisitionId, newStatus) => {
        try {
            await axios.put(`${API_BASE}/requisitions/${requisitionId}`, {
                status: newStatus,
                approved_by: user?.username,
                fulfilled_by: newStatus === 'fulfilled' ? user?.username : null
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Requisition ${newStatus} successfully`);
            fetchData();
        } catch (error) {
            toast.error(`Failed to ${newStatus} requisition`);
            console.error('Update error:', error);
        }
    };

    if (isLoading) {
        return (
            <Layout currentPage="requisitions">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout currentPage="requisitions">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Requisitions</h1>
                        <p className="text-slate-600">{requisitions.length} total requests</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Requisition</span>
                    </motion.button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search requisitions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="fulfilled">Fulfilled</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Requisitions List */}
                <div className="space-y-4">
                    {filteredRequisitions.map((req, index) => {
                        const item = inventory.find(i => i.id === req.item_id);
                        return (
                            <motion.div
                                key={req.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    {/* Left side - Request Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-semibold text-slate-900 text-lg mb-1">
                                                    {item?.name || 'Unknown Item'}
                                                </h3>
                                                <p className="text-slate-600 text-sm">
                                                    Requested by: <span className="font-medium">{req.requested_by}</span>
                                                </p>
                                            </div>
                                            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(req.status)}`}>
                                                {getStatusIcon(req.status)}
                                                <span className="capitalize">{req.status}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="text-slate-500">Department:</span>
                                                <p className="font-medium text-slate-900">{req.department}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">Quantity:</span>
                                                <p className="font-medium text-slate-900">{req.requested_quantity}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">Requested:</span>
                                                <p className="font-medium text-slate-900">
                                                    {new Date(req.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <span className="text-slate-500 text-sm">Purpose:</span>
                                            <p className="text-slate-900 mt-1">{req.purpose}</p>
                                        </div>

                                        {/* Approval/Fulfillment info */}
                                        {(req.approved_by || req.fulfilled_by) && (
                                            <div className="mt-3 pt-3 border-t border-slate-100">
                                                <div className="flex flex-wrap gap-4 text-sm">
                                                    {req.approved_by && (
                                                        <div>
                                                            <span className="text-slate-500">Approved by:</span>
                                                            <span className="ml-1 font-medium text-slate-900">{req.approved_by}</span>
                                                        </div>
                                                    )}
                                                    {req.fulfilled_by && (
                                                        <div>
                                                            <span className="text-slate-500">Fulfilled by:</span>
                                                            <span className="ml-1 font-medium text-slate-900">{req.fulfilled_by}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right side - Actions */}
                                    {user?.role === 'admin' && req.status === 'pending' && (
                                        <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:w-40">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleUpdateStatus(req.id, 'approved')}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                            >
                                                Approve
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleUpdateStatus(req.id, 'rejected')}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                            >
                                                Reject
                                            </motion.button>
                                        </div>
                                    )}

                                    {user?.role === 'admin' && req.status === 'approved' && (
                                        <div className="lg:w-40">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleUpdateStatus(req.id, 'fulfilled')}
                                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                            >
                                                Mark Fulfilled
                                            </motion.button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {filteredRequisitions.length === 0 && (
                    <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No requisitions found</h3>
                        <p className="text-slate-600 mb-4">
                            {searchTerm || statusFilter !== 'all' 
                                ? 'Try adjusting your search or filters' 
                                : 'Get started by creating your first requisition'}
                        </p>
                        {!searchTerm && statusFilter === 'all' && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Create First Requisition
                            </motion.button>
                        )}
                    </div>
                )}
            </div>

            {/* Create Requisition Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateRequisitionModal
                        onClose={() => setShowCreateModal(false)}
                        onRequisitionCreated={fetchData}
                        inventory={inventory}
                        token={token}
                        user={user}
                    />
                )}
            </AnimatePresence>
        </Layout>
    );
};

// Create Requisition Modal
const CreateRequisitionModal = ({ onClose, onRequisitionCreated, inventory, token, user }) => {
    const [formData, setFormData] = useState({
        item_id: '',
        requested_quantity: 1,
        purpose: '',
        requested_by: user?.full_name || user?.username || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await axios.post(`${API_BASE}/requisitions`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Requisition created successfully!');
            onRequisitionCreated();
            onClose();
        } catch (error) {
            toast.error('Failed to create requisition');
            console.error('Create requisition error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    const selectedItem = inventory.find(item => item.id === formData.item_id);

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
                    <h2 className="text-2xl font-bold text-slate-900">Create Requisition</h2>
                    <p className="text-slate-600 mt-1">Request items from inventory</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Item</label>
                        <select
                            name="item_id"
                            value={formData.item_id}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Choose an item...</option>
                            {inventory.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.name} (Stock: {item.quantity})
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedItem && (
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <h4 className="font-medium text-slate-900 mb-2">{selectedItem.name}</h4>
                            <p className="text-sm text-slate-600 mb-2">{selectedItem.description}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-500">Available:</span>
                                    <span className="ml-1 font-medium text-slate-900">{selectedItem.quantity}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Category:</span>
                                    <span className="ml-1 font-medium text-slate-900">{selectedItem.category}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Requested Quantity</label>
                        <input
                            type="number"
                            name="requested_quantity"
                            value={formData.requested_quantity}
                            onChange={handleChange}
                            min="1"
                            max={selectedItem?.quantity || 1}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Purpose</label>
                        <textarea
                            name="purpose"
                            value={formData.purpose}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Describe why you need these items..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Requested By</label>
                        <input
                            type="text"
                            name="requested_by"
                            value={formData.requested_by}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
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
                            disabled={isSubmitting || !formData.item_id}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Requisition'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default Requisitions;