import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ViewScrapInventory.css';
import Navbar2 from '../components/Navbar2';
import supabaseClient from '../supabase-config';

const STATUS_CONFIG = {
    collected: { label: 'Collected', color: '#4CAF50', bgColor: '#e8f5e9', icon: '📦' },
    send_for_recycling: { label: 'Send for Recycling', color: '#FF9800', bgColor: '#fff3e0', icon: '🚚' },
    recycled: { label: 'Recycled', color: '#2196F3', bgColor: '#e3f2fd', icon: '♻️' },
    upcycled: { label: 'Upcycled', color: '#9C27B0', bgColor: '#f3e5f5', icon: '✨' }
};

function ViewScrapInventory() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date_desc');
    const [showReceiverModal, setShowReceiverModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [selectedReceiver, setSelectedReceiver] = useState('');
    const [transactionAmount, setTransactionAmount] = useState('');
    const [transferQuantity, setTransferQuantity] = useState('');

    useEffect(() => {
        const sessionUser = sessionStorage.getItem('user');
        if (!sessionUser) {
            navigate('/login');
            return;
        }

        const user = JSON.parse(sessionUser);
        setCurrentUser(user);

        if (user.role !== 'ScrapDealer') {
            navigate('/dashboard');
            return;
        }

        fetchInventory(user.user_id);
        fetchCategories();
    }, [navigate]);

    const fetchInventory = async (userId) => {
        try {
            setLoading(true);
            const { data, error } = await supabaseClient
                .from('scrap_inventory')
                .select(`
                    inventory_id,
                    weight,
                    status,
                    last_updated,
                    scrap_categories (category_id, scrap_type, description, quantity)
                `)
                .eq('owner_id', userId)
                .order('last_updated', { ascending: false });

            if (error) throw error;
            setInventory(data || []);
        } catch (error) {
            console.error('Error fetching inventory:', error);
            setError('Failed to load inventory data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabaseClient
                .from('scrap_categories')
                .select('*')
                .order('scrap_type', { ascending: true });

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleDelete = async (inventoryId) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;

        try {
            const { error } = await supabaseClient
                .from('scrap_inventory')
                .delete()
                .eq('inventory_id', inventoryId);

            if (error) throw error;

            setInventory(prev => prev.filter(item => item.inventory_id !== inventoryId));
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item.');
        }
    };

    const fetchConnectedUsers = async () => {
        try {
            const { data: connections, error } = await supabaseClient
                .from('connections')
                .select('requester_id, receiver_id')
                .or(`requester_id.eq.${currentUser.user_id},receiver_id.eq.${currentUser.user_id}`)
                .eq('status', 'accepted');

            if (error) throw error;

            const connectedUserIds = connections.map(conn =>
                conn.requester_id === currentUser.user_id ? conn.receiver_id : conn.requester_id
            );

            if (connectedUserIds.length === 0) {
                setConnectedUsers([]);
                return;
            }

            const { data: users, error: userError } = await supabaseClient
                .from('users')
                .select('user_id, "First name", "Last_Name", role')
                .in('user_id', connectedUserIds);

            if (userError) throw userError;
            setConnectedUsers(users || []);
        } catch (error) {
            console.error('Error fetching connected users:', error);
            setConnectedUsers([]);
        }
    };

    const handleStatusChange = async (inventoryId, newStatus) => {
        // For upcycled and send_for_recycling, show receiver selection modal
        if (newStatus === 'upcycled' || newStatus === 'send_for_recycling') {
            const item = inventory.find(i => i.inventory_id === inventoryId);
            setSelectedItem(item);
            setSelectedStatus(newStatus);
            setSelectedReceiver('');
            setTransactionAmount('');
            setTransferQuantity(item.weight || '');
            fetchConnectedUsers();
            setShowReceiverModal(true);
            return;
        }

        // For other statuses, update directly
        try {
            const { error } = await supabaseClient
                .from('scrap_inventory')
                .update({ status: newStatus, last_updated: new Date().toISOString() })
                .eq('inventory_id', inventoryId);

            if (error) throw error;

            setInventory(prev => prev.map(item =>
                item.inventory_id === inventoryId
                    ? { ...item, status: newStatus, last_updated: new Date().toISOString() }
                    : item
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status.');
        }
    };

    const handleTransferSubmit = async () => {
        if (!selectedReceiver) {
            alert('Please select a receiver');
            return;
        }

        const transferQty = parseFloat(transferQuantity) || 0;
        const currentWeight = parseFloat(selectedItem.weight) || 0;

        if (transferQty <= 0) {
            alert('Please enter a valid quantity to transfer');
            return;
        }

        if (transferQty > currentWeight) {
            alert(`Cannot transfer more than available weight (${currentWeight} kg)`);
            return;
        }

        try {
            const remainingWeight = currentWeight - transferQty;

            // 1. Update scrap inventory - reduce by transferred quantity
            const { error: updateError } = await supabaseClient
                .from('scrap_inventory')
                .update({
                    status: remainingWeight > 0 ? 'collected' : selectedStatus,
                    weight: remainingWeight,
                    last_updated: new Date().toISOString()
                })
                .eq('inventory_id', selectedItem.inventory_id);

            if (updateError) throw updateError;

            // 2. Create transaction record with sender, receiver and amount
            const transactionData = {
                transaction_id: crypto.randomUUID(),
                sender_id: currentUser.user_id,
                receiver_id: selectedReceiver,
                scrap_inventory_id: selectedItem.inventory_id,
                transaction_type: selectedStatus === 'send_for_recycling' ? 'recycled' : selectedStatus,
                weight_transferred: transferQty,
                amount_paid: parseFloat(transactionAmount) || 0,
                created_at: new Date().toISOString()
            };

            const { error: transError } = await supabaseClient
                .from('transactions')
                .insert([transactionData]);

            if (transError) {
                console.error('Transaction insert error:', transError);
                throw transError;
            }
            console.log('Transaction recorded successfully:', transactionData);

            // 3. Update local state - reduce by transferred quantity
            setInventory(prev => prev.map(item =>
                item.inventory_id === selectedItem.inventory_id
                    ? { ...item, status: remainingWeight > 0 ? 'collected' : selectedStatus, weight: remainingWeight, last_updated: new Date().toISOString() }
                    : item
            ));

            setShowReceiverModal(false);
            setSelectedItem(null);
            setSelectedReceiver('');
            setTransactionAmount('');
            setTransferQuantity('');
        } catch (error) {
            console.error('Error transferring scrap:', error);
            alert('Failed to transfer scrap: ' + error.message);
        }
    };

    const closeReceiverModal = () => {
        setShowReceiverModal(false);
        setSelectedItem(null);
        setSelectedReceiver('');
        setTransactionAmount('');
        setTransferQuantity('');
    };

    const getFilteredAndSortedInventory = () => {
        let filtered = inventory;

        // Apply status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(item => item.status === filterStatus);
        }

        // Apply category filter
        if (filterCategory !== 'all') {
            filtered = filtered.filter(item => item.scrap_categories?.category_id === filterCategory);
        }

        // Apply search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.scrap_categories?.scrap_type?.toLowerCase().includes(term) ||
                item.status.toLowerCase().includes(term)
            );
        }

        // Apply sorting
        const sorted = [...filtered];
        switch (sortBy) {
            case 'date_desc':
                sorted.sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated));
                break;
            case 'date_asc':
                sorted.sort((a, b) => new Date(a.last_updated) - new Date(b.last_updated));
                break;
            case 'weight_desc':
                sorted.sort((a, b) => parseFloat(b.weight) - parseFloat(a.weight));
                break;
            case 'weight_asc':
                sorted.sort((a, b) => parseFloat(a.weight) - parseFloat(b.weight));
                break;
            default:
                break;
        }

        return sorted;
    };

    const calculateTotals = () => {
        const totalWeight = inventory.reduce((sum, item) => sum + parseFloat(item.weight || 0), 0);
        const totalItems = inventory.length;
        const statusCounts = inventory.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
        }, {});
        return { totalWeight, totalItems, statusCounts };
    };

    const filteredInventory = getFilteredAndSortedInventory();
    const totals = calculateTotals();

    return (
        <div className="view-inventory-page">
            <Navbar2 user={currentUser} />
            <div className="view-inventory-main">
                <div className="view-inventory-container">
                    {/* Header */}
                    <div className="page-header">
                        <button className="back-btn" onClick={() => navigate('/scrapdealer')}>
                            ← Back to Dashboard
                        </button>
                        <h1 className="page-title">📦 Scrap Inventory</h1>
                        <p className="page-subtitle">View and manage all your scrap collections</p>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Loading inventory...</p>
                        </div>
                    ) : error ? (
                        <div className="error-card">
                            <span className="error-icon">⚠️</span>
                            <p>{error}</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="summary-cards">
                                <div className="summary-card total-items">
                                    <span className="summary-icon">📦</span>
                                    <div className="summary-info">
                                        <h3>{totals.totalItems}</h3>
                                        <p>Total Items</p>
                                    </div>
                                </div>
                                <div className="summary-card total-weight">
                                    <span className="summary-icon">⚖️</span>
                                    <div className="summary-info">
                                        <h3>{totals.totalWeight.toFixed(2)} kg</h3>
                                        <p>Total Weight</p>
                                    </div>
                                </div>
                                <div className="summary-card collected">
                                    <span className="summary-icon">📥</span>
                                    <div className="summary-info">
                                        <h3>{totals.statusCounts.collected || 0}</h3>
                                        <p>Collected</p>
                                    </div>
                                </div>
                                <div className="summary-card recycled">
                                    <span className="summary-icon">♻️</span>
                                    <div className="summary-info">
                                        <h3>{(totals.statusCounts.recycled || 0) + (totals.statusCounts.send_for_recycling || 0)}</h3>
                                        <p>Recycling</p>
                                    </div>
                                </div>
                            </div>

                            {/* Filters & Search */}
                            <div className="filters-section">
                                <div className="search-box">
                                    <span className="search-icon">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Search by material or status..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                                <div className="filter-group">
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="collected">Collected</option>
                                        <option value="send_for_recycling">Send for Recycling</option>
                                        <option value="recycled">Recycled</option>
                                        <option value="upcycled">Upcycled</option>
                                    </select>
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map(cat => (
                                            <option key={cat.category_id} value={cat.category_id}>
                                                {cat.scrap_type}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="date_desc">Newest First</option>
                                        <option value="date_asc">Oldest First</option>
                                        <option value="weight_desc">Heaviest First</option>
                                        <option value="weight_asc">Lightest First</option>
                                    </select>
                                </div>
                            </div>

                            {/* Inventory Grid */}
                            {filteredInventory.length > 0 ? (
                                <div className="inventory-grid">
                                    {filteredInventory.map((item) => {
                                        const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.collected;
                                        return (
                                            <div key={item.inventory_id} className="inventory-card">
                                                <div className="inventory-header">
                                                    <span
                                                        className="status-badge"
                                                        style={{
                                                            backgroundColor: statusConfig.bgColor,
                                                            color: statusConfig.color
                                                        }}
                                                    >
                                                        {statusConfig.icon} {statusConfig.label}
                                                    </span>
                                                    <div className="inventory-actions">
                                                        <button
                                                            className="action-btn edit"
                                                            onClick={() => navigate(`/edit-scrap/${item.inventory_id}`)}
                                                            title="Edit"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            className="action-btn delete"
                                                            onClick={() => handleDelete(item.inventory_id)}
                                                            title="Delete"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="inventory-body">
                                                    <h3 className="material-name">
                                                        {item.scrap_categories?.scrap_type || 'Unknown Material'}
                                                    </h3>
                                                    <p className="material-description">
                                                        {item.scrap_categories?.description || 'No description available'}
                                                    </p>

                                                    <div className="inventory-stats">
                                                        <div className="stat">
                                                            <span className="stat-label">Weight</span>
                                                            <span className="stat-value">{parseFloat(item.weight).toFixed(2)} kg</span>
                                                        </div>
                                                        <div className="stat">
                                                            <span className="stat-label">Date Added</span>
                                                            <span className="stat-value">
                                                                {new Date(item.last_updated).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="inventory-footer">
                                                    <select
                                                        value={item.status}
                                                        onChange={(e) => handleStatusChange(item.inventory_id, e.target.value)}
                                                        className="status-select"
                                                        style={{ borderColor: statusConfig.color }}
                                                    >
                                                        <option value="collected">📦 Collected</option>
                                                        <option value="send_for_recycling">🚚 Send for Recycling</option>
                                                        <option value="recycled">♻️ Recycled</option>
                                                        <option value="upcycled">✨ Upcycled</option>
                                                    </select>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <span className="empty-icon">📭</span>
                                    <h3>No Items Found</h3>
                                    <p>
                                        {inventory.length === 0
                                            ? "You haven't added any scrap collections yet."
                                            : "No items match your current filters."
                                        }
                                    </p>
                                    {inventory.length === 0 && (
                                        <button
                                            className="btn-primary"
                                            onClick={() => navigate('/add-scrap')}
                                        >
                                            Add Your First Collection
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Results Count */}
                            {filteredInventory.length > 0 && (
                                <div className="results-footer">
                                    <p>
                                        Showing {filteredInventory.length} of {inventory.length} items
                                        {filterStatus !== 'all' && ` • Status: ${STATUS_CONFIG[filterStatus]?.label || filterStatus}`}
                                        {filterCategory !== 'all' && ` • Category: ${categories.find(c => c.category_id === filterCategory)?.scrap_type}`}
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Receiver Selection Modal */}
                    {showReceiverModal && (
                        <div className="receiver-modal-overlay" onClick={closeReceiverModal}>
                            <div className="receiver-modal" onClick={(e) => e.stopPropagation()}>
                                <div className="receiver-modal-header">
                                    <h3>
                                        {selectedStatus === 'upcycled' ? '✨ Transfer for Upcycling' : '🚚 Send for Recycling'}
                                    </h3>
                                    <button className="close-btn" onClick={closeReceiverModal}>×</button>
                                </div>
                                <div className="receiver-modal-content">
                                    <div className="item-info">
                                        <p><strong>Material:</strong> {selectedItem?.scrap_categories?.scrap_type}</p>
                                        <p><strong>Weight:</strong> {selectedItem?.weight} kg</p>
                                    </div>

                                    <div className="form-group">
                                        <label>Select Receiver (Connected User):</label>
                                        <select
                                            value={selectedReceiver}
                                            onChange={(e) => setSelectedReceiver(e.target.value)}
                                            className="receiver-select"
                                        >
                                            <option value="">-- Select a user --</option>
                                            {connectedUsers.map(user => (
                                                <option key={user.user_id} value={user.user_id}>
                                                    {user['First name']} {user['Last_Name']} ({user.role})
                                                </option>
                                            ))}
                                        </select>
                                        {connectedUsers.length === 0 && (
                                            <p className="no-users-msg">No connected users found. Please connect with users first.</p>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Amount Paid (Optional):</label>
                                        <input
                                            type="number"
                                            value={transactionAmount}
                                            onChange={(e) => setTransactionAmount(e.target.value)}
                                            placeholder="Enter amount in ₹"
                                            className="amount-input"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>

                                    <div className="modal-actions">
                                        <button className="btn-cancel" onClick={closeReceiverModal}>
                                            Cancel
                                        </button>
                                        <button
                                            className="btn-submit"
                                            onClick={handleTransferSubmit}
                                            disabled={!selectedReceiver}
                                        >
                                            Confirm Transfer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ViewScrapInventory;
