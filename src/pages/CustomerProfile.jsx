import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SharedNavbar from '../components/SharedNavbar';
import { getCustomerProfile, saveCustomerProfile } from '../services/orderService';
import { User, MapPin, Phone, Save, ArrowLeft, Loader } from 'lucide-react';
import './CustomerProfile.css';

function CustomerProfile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [currentUser, setCurrentUser] = useState(null);

    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        phone_no: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
    });

    useEffect(() => {
        const init = async () => {
            const sessionUser = sessionStorage.getItem('user');
            if (!sessionUser) {
                navigate('/login');
                return;
            }

            const user = JSON.parse(sessionUser);
            setCurrentUser(user);

            // Try to fetch existing customer profile
            try {
                const customerData = await getCustomerProfile(user.user_id);
                if (customerData) {
                    setProfile({
                        first_name: customerData.first_name || user["First name"] || '',
                        last_name: customerData.last_name || user["Last_Name"] || '',
                        phone_no: customerData.phone_no || user.phone || '',
                        address: customerData.address || '',
                        city: customerData.city || '',
                        state: customerData.state || '',
                        pincode: customerData.pincode || ''
                    });
                } else {
                    // Pre-fill from user session if no customer profile exists
                    setProfile(prev => ({
                        ...prev,
                        first_name: user["First name"] || '',
                        last_name: user["Last_Name"] || '',
                        phone_no: user.phone || ''
                    }));
                }
            } catch (error) {
                console.error('Error loading profile:', error);
                // Pre-fill from user session on error
                setProfile(prev => ({
                    ...prev,
                    first_name: user["First name"] || '',
                    last_name: user["Last_Name"] || '',
                    phone_no: user.phone || ''
                }));
            }

            setLoading(false);
        };

        init();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        // Validation
        if (!profile.first_name || !profile.phone_no || !profile.address || !profile.city || !profile.state || !profile.pincode) {
            setMessage({ type: 'error', text: 'Please fill in all required fields' });
            setSaving(false);
            return;
        }

        if (profile.phone_no.length < 10) {
            setMessage({ type: 'error', text: 'Please enter a valid 10-digit phone number' });
            setSaving(false);
            return;
        }

        if (profile.pincode.length < 6) {
            setMessage({ type: 'error', text: 'Please enter a valid 6-digit PIN code' });
            setSaving(false);
            return;
        }

        try {
            await saveCustomerProfile(profile);
            setMessage({ type: 'success', text: 'Profile saved successfully!' });
        } catch (error) {
            console.error('Error saving profile:', error);
            setMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="customer-profile-page">
                <SharedNavbar userRole="consumer" />
                <div className="profile-loading">
                    <Loader className="spin" size={32} />
                    <p>Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="customer-profile-page">
            <SharedNavbar userRole="consumer" />

            <div className="profile-container">
                <div className="profile-header">
                    <button className="back-btn" onClick={() => navigate('/consumer')}>
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </button>
                    <h1>
                        <User size={24} style={{ marginRight: '10px' }} />
                        My Profile
                    </h1>
                    <p className="subtitle">Manage your personal details and delivery address</p>
                </div>

                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-section">
                        <h2>
                            <User size={18} style={{ marginRight: '8px' }} />
                            Personal Information
                        </h2>

                        <div className="form-row">
                            <div className="form-group">
                                <label>First Name *</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={profile.first_name}
                                    onChange={handleChange}
                                    placeholder="Enter first name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={profile.last_name}
                                    onChange={handleChange}
                                    placeholder="Enter last name"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>
                                <Phone size={14} style={{ marginRight: '6px' }} />
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                name="phone_no"
                                value={profile.phone_no}
                                onChange={handleChange}
                                placeholder="10-digit mobile number"
                                maxLength="10"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>
                            <MapPin size={18} style={{ marginRight: '8px' }} />
                            Delivery Address
                        </h2>

                        <div className="form-group full-width">
                            <label>Street Address *</label>
                            <textarea
                                name="address"
                                value={profile.address}
                                onChange={handleChange}
                                placeholder="House number, building name, street, area"
                                rows="3"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>City *</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={profile.city}
                                    onChange={handleChange}
                                    placeholder="Enter city"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>State *</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={profile.state}
                                    onChange={handleChange}
                                    placeholder="Enter state"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>PIN Code *</label>
                                <input
                                    type="text"
                                    name="pincode"
                                    value={profile.pincode}
                                    onChange={handleChange}
                                    placeholder="6-digit PIN"
                                    maxLength="6"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="save-btn"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <Loader size={18} className="spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Profile
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CustomerProfile;
