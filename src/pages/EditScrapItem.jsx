import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './EditScrapItem.css';
import SharedNavbar from '../components/SharedNavbar';
import supabaseClient from '../supabase-config';

const STATUS_OPTIONS = [
    { value: 'collected', label: 'Collected', color: '#4CAF50' },
    { value: 'send_for_recycling', label: 'Send for Recycling', color: '#FF9800' },
    { value: 'recycled', label: 'Recycled', color: '#2196F3' },
    { value: 'upcycled', label: 'Upcycled', color: '#9C27B0' }
];

function EditScrapItem() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [currentUser, setCurrentUser] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        category_id: '',
        weight: '',
        status: 'collected'
    });

    const [originalData, setOriginalData] = useState(null);

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

        fetchCategories();
        fetchItemData(id, user.user_id);
    }, [navigate, id]);

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

    const fetchItemData = async (itemId, userId) => {
        try {
            setLoading(true);
            const { data, error } = await supabaseClient
                .from('scrap_inventory')
                .select(`
                    inventory_id,
                    weight,
                    status,
                    last_updated,
                    owner_id,
                    scrap_categories (category_id, scrap_type, description)
                `)
                .eq('inventory_id', itemId)
                .single();

            if (error) throw error;

            if (data.owner_id !== userId) {
                setMessage({ type: 'error', text: 'You are not authorized to edit this item.' });
                setTimeout(() => navigate('/view-inventory'), 2000);
                return;
            }

            setOriginalData(data);
            setFormData({
                category_id: data.scrap_categories?.category_id || '',
                weight: data.weight || '',
                status: data.status || 'collected'
            });
        } catch (error) {
            console.error('Error fetching item:', error);
            setMessage({ type: 'error', text: 'Failed to load item data.' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.category_id || !formData.weight) {
            setMessage({ type: 'error', text: 'Please fill in all required fields.' });
            return;
        }

        if (parseFloat(formData.weight) <= 0) {
            setMessage({ type: 'error', text: 'Weight must be greater than 0.' });
            return;
        }

        try {
            setSubmitting(true);
            setMessage({ type: '', text: '' });

            const { error } = await supabaseClient
                .from('scrap_inventory')
                .update({
                    category_id: formData.category_id,
                    weight: parseFloat(formData.weight),
                    status: formData.status,
                    last_updated: new Date().toISOString()
                })
                .eq('inventory_id', id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Scrap item updated successfully!' });

            setTimeout(() => {
                navigate('/view-inventory');
            }, 1500);

        } catch (error) {
            console.error('Error updating scrap item:', error);
            setMessage({ type: 'error', text: 'Failed to update scrap item. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/view-inventory');
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
            return;
        }

        try {
            setSubmitting(true);
            const { error } = await supabaseClient
                .from('scrap_inventory')
                .delete()
                .eq('inventory_id', id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Item deleted successfully!' });
            setTimeout(() => {
                navigate('/view-inventory');
            }, 1500);
        } catch (error) {
            console.error('Error deleting item:', error);
            setMessage({ type: 'error', text: 'Failed to delete item.' });
            setSubmitting(false);
        }
    };

    const hasChanges = () => {
        if (!originalData) return false;
        return (
            formData.category_id !== (originalData.scrap_categories?.category_id || '') ||
            parseFloat(formData.weight) !== parseFloat(originalData.weight) ||
            formData.status !== originalData.status
        );
    };

    const getSelectedCategory = () => {
        return categories.find(c => c.category_id === formData.category_id);
    };

    const getSelectedStatus = () => {
        return STATUS_OPTIONS.find(s => s.value === formData.status);
    };

    return (
        <div className="edit-scrap-page">
            <SharedNavbar user={currentUser} />
            <div className="edit-scrap-main">
                <div className="edit-scrap-container">
                    <div className="page-header">
                        <button className="back-btn" onClick={handleCancel}>
                            ← Back to Inventory
                        </button>
                        <h1 className="page-title">Edit Scrap Item</h1>
                        <p className="page-subtitle">Update the details of your scrap collection</p>
                    </div>

                    {message.text && (
                        <div className={`message-alert ${message.type}`}>
                            <span className="message-icon">
                                {message.type === 'success' ? '✅' : '⚠️'}
                            </span>
                            <p>{message.text}</p>
                        </div>
                    )}

                    <div className="form-card">
                        {loading ? (
                            <div className="form-loading">
                                <div className="spinner-small"></div>
                                <p>Loading item data...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="scrap-form">
                                <div className="form-section">
                                    <h3 className="form-section-title">♻️ Item Details</h3>

                                    <div className="form-group">
                                        <label htmlFor="category_id">
                                            Material Category <span className="required">*</span>
                                        </label>
                                        <select
                                            id="category_id"
                                            name="category_id"
                                            value={formData.category_id}
                                            onChange={handleInputChange}
                                            className="form-select"
                                            required
                                        >
                                            <option value="">Select a category</option>
                                            {categories.map(category => (
                                                <option key={category.category_id} value={category.category_id}>
                                                    {category.scrap_type}
                                                </option>
                                            ))}
                                        </select>
                                        {getSelectedCategory() && (
                                            <p className="help-text">
                                                {getSelectedCategory().description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="weight">
                                            Weight (kg) <span className="required">*</span>
                                        </label>
                                        <div className="input-with-unit">
                                            <input
                                                type="number"
                                                id="weight"
                                                name="weight"
                                                value={formData.weight}
                                                onChange={handleInputChange}
                                                placeholder="Enter weight in kilograms"
                                                min="0.01"
                                                step="0.01"
                                                className="form-input"
                                                required
                                            />
                                            <span className="unit-label">kg</span>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="status">
                                            Collection Status <span className="required">*</span>
                                        </label>
                                        <div className="status-options">
                                            {STATUS_OPTIONS.map(status => (
                                                <button
                                                    key={status.value}
                                                    type="button"
                                                    className={`status-btn ${formData.status === status.value ? 'active' : ''}`}
                                                    onClick={() => setFormData(prev => ({ ...prev, status: status.value }))}
                                                    style={{
                                                        '--status-color': status.color,
                                                        borderColor: formData.status === status.value ? status.color : 'transparent'
                                                    }}
                                                >
                                                    <span 
                                                        className="status-dot"
                                                        style={{ backgroundColor: status.color }}
                                                    ></span>
                                                    {status.label}
                                                </button>
                                            ))}
                                        </div>
                                        <input type="hidden" name="status" value={formData.status} />
                                    </div>
                                </div>

                                {originalData && (
                                    <div className="original-info">
                                        <p>
                                            <strong>Last Updated:</strong>{' '}
                                            {new Date(originalData.last_updated).toLocaleString()}
                                        </p>
                                    </div>
                                )}

                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="btn-danger"
                                        onClick={handleDelete}
                                        disabled={submitting}
                                    >
                                        🗑️ Delete Item
                                    </button>
                                    <div className="action-group">
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={handleCancel}
                                            disabled={submitting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn-submit"
                                            disabled={submitting || !hasChanges()}
                                        >
                                            {submitting ? (
                                                <>
                                                    <span className="btn-spinner"></span>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <span>💾</span>
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>

                    {hasChanges() && (
                        <div className="changes-preview">
                            <h3>Changes Summary</h3>
                            <div className="change-list">
                                {formData.category_id !== (originalData?.scrap_categories?.category_id || '') && (
                                    <div className="change-item">
                                        <span className="change-label">Category:</span>
                                        <span className="change-old">{originalData?.scrap_categories?.scrap_type}</span>
                                        <span className="change-arrow">→</span>
                                        <span className="change-new">{getSelectedCategory()?.scrap_type}</span>
                                    </div>
                                )}
                                {parseFloat(formData.weight) !== parseFloat(originalData?.weight) && (
                                    <div className="change-item">
                                        <span className="change-label">Weight:</span>
                                        <span className="change-old">{originalData?.weight} kg</span>
                                        <span className="change-arrow">→</span>
                                        <span className="change-new">{formData.weight} kg</span>
                                    </div>
                                )}
                                {formData.status !== originalData?.status && (
                                    <div className="change-item">
                                        <span className="change-label">Status:</span>
                                        <span className="change-old">{originalData?.status}</span>
                                        <span className="change-arrow">→</span>
                                        <span className="change-new">{getSelectedStatus()?.label}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EditScrapItem;
