import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyOrders.css';
import { getMyOrders } from '../services/orderService';
import { Package, Truck, CheckCircle, Clock, CreditCard, AlertCircle, Loader } from 'lucide-react';

function MyOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const sessionUser = sessionStorage.getItem('user');
        if (!sessionUser) {
            navigate('/login');
            return;
        }

        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await getMyOrders();
                console.log('Orders received in component:', data);
                setOrders(data);
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError(err.message || 'Failed to load orders. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [navigate]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'ordered':
                return <Clock size={18} />;
            case 'packed':
                return <Package size={18} />;
            case 'shipped':
                return <Truck size={18} />;
            case 'delivered':
                return <CheckCircle size={18} />;
            default:
                return <Clock size={18} />;
        }
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            ordered: 'status-ordered',
            packed: 'status-packed',
            shipped: 'status-shipped',
            delivered: 'status-delivered'
        };
        return (
            <span className={`status-badge ${statusClasses[status] || ''}`}>
                {getStatusIcon(status)}
                {status}
            </span>
        );
    };

    const getPaymentBadge = (paymentStatus) => {
        const isPaid = paymentStatus === 'paid';
        return (
            <span className={`payment-badge ${isPaid ? 'paid' : 'pending'}`}>
                {isPaid ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {paymentStatus}
            </span>
        );
    };

    const getStatusProgress = (status) => {
        const stages = ['ordered', 'packed', 'shipped', 'delivered'];
        const currentIndex = stages.indexOf(status);
        return stages.map((stage, index) => (
            <div key={stage} className={`progress-step ${index <= currentIndex ? 'active' : ''} ${index < currentIndex ? 'completed' : ''}`}>
                <div className="step-dot"></div>
                <span className="step-label">{stage}</span>
            </div>
        ));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="my-orders-page">
                <div className="loading-container">
                    <Loader className="spin" size={32} />
                    <p>Loading your orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="my-orders-page">
            <header className="orders-header">
                <h1>My Orders</h1>
                <button className="back-btn" onClick={() => navigate('/consumer')}>
                    ← Back to Shop
                </button>
            </header>

            {error && (
                <div className="error-message">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <div className="orders-container">
                {orders.length === 0 ? (
                    <div className="no-orders">
                        <Package size={64} style={{ color: '#ccc', marginBottom: '16px' }} />
                        <p>No orders yet</p>
                        <p className="no-orders-sub">Start shopping to see your orders here</p>
                        <button className="shop-btn" onClick={() => navigate('/ecom')}>
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map((order) => (
                            <div key={order.order_id} className="order-card">
                                <div className="order-header">
                                    <div className="order-info">
                                        <span className="order-id">Order #{order.order_id?.slice(-8).toUpperCase()}</span>
                                        <span className="order-product">{order.product_name}</span>
                                    </div>
                                    <div className="order-badges">
                                        {getStatusBadge(order.currentstatus)}
                                        {getPaymentBadge(order.payment_status)}
                                    </div>
                                </div>

                                <div className="order-progress">
                                    <div className="progress-track">
                                        {getStatusProgress(order.currentstatus)}
                                    </div>
                                </div>

                                <div className="order-details">
                                    <div className="detail-row">
                                        <span className="detail-label">Quantity:</span>
                                        <span className="detail-value">{order.amount_bought} items</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">
                                            <CreditCard size={14} style={{ marginRight: '4px' }} />
                                            Expected Delivery:
                                        </span>
                                        <span className="detail-value highlight">
                                            {formatDate(order.shipping_date)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyOrders;
