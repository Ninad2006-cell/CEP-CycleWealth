import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SharedNavbar from '../components/SharedNavbar';
import supabaseClient from '../supabase-config';
import {
    Briefcase,
    MapPin,
    Recycle,
    Factory,
    BadgeCheck,
    IndianRupee,
    ArrowRight,
    Building2,
    User,
    ExternalLink,
    MapPinOff,
    Landmark,
    Navigation,
    Home,
    LocateFixed,
    Package,
    CheckCircle,
    Clock,
    DollarSign
} from 'lucide-react';
import './scrapDealer.css';
import Navbar2 from '../components/Navbar2';
import { getPendingEnterpriseOrders, acceptEnterpriseOrder } from '../services/notificationService';
import Footer from '../components/Footer';

function ScrapDealer() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [activeTab, setActiveTab] = useState('companies');
    const [profile, setProfile] = useState({
        businessName: '',
        firstName: '',
        lastName: '',
        email: '',
        contact_number: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        description: '',
        services: [],
        workingHours: '',
        establishedYear: '',
        website: '',
        socialMedia: {
            facebook: '',
            instagram: '',
            twitter: '',
            linkedin: ''
        },
        certifications: [],
        specialties: '',
        pickupRadius: '',
        minimumWeight: '',
        paymentMethods: [],
        latitude: null,
        longitude: null,
        stats: {
            connections: 0,
            experience: 0,
            annualVolume: 0,
            partners: 0
        },
        partners: {
            companies: [],
            artisans: [],
            suppliers: []
        },
        experience: [],
        materials: [],
        recommendations: []
    });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [enterpriseOrders, setEnterpriseOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [acceptingOrder, setAcceptingOrder] = useState(null);

    // Available services and payment methods
    const availableServices = [
        'Metal Scrap Collection',
        'Plastic Recycling',
        'Paper Recycling',
        'E-Waste Collection',
        'Battery Recycling',
        'Wood Recycling',
        'Glass Recycling',
        'Textile Recycling',
        'Industrial Waste',
        'Construction Debris'
    ];



    const certificationOptions = [
        'ISO 14001',
        'ISO 9001',
        'R2 Certification',
        'e-Stewards',
        'WEEE Compliance',
        'RoHS Compliance',
        'Local Municipal License',
        'Environmental Clearance'
    ];

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

        fetchProfile(user.user_id);
    }, [navigate]);

    const fetchProfile = async (userId) => {
        try {
            setLoading(true);

            // Get basic user info
            const { data: userData, error: userError } = await supabaseClient
                .from('users')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (userError) throw userError;

            // Get extended profile info (optional - table may not exist)
            let profileData = {};
            try {
                const { data: pd, error: profileError } = await supabaseClient
                    .from('scrapdealer_profile')
                .select('*')
                    .eq('dealer_id', userId)
                .single();
                if (!profileError && pd) profileData = pd;
            } catch (e) {
                // Table doesn't exist, use empty object
                console.log('Profile table not found, using user data only');
            }

            // Get actual connections count
            let connectionsCount = 0;
            try {
                const { data: connectionsData, error: connError } = await supabaseClient
                    .from('connections')
                    .select('*', { count: 'exact' })
                    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
                    .eq('status', 'accepted');
                if (!connError && connectionsData) {
                    connectionsCount = connectionsData.length;
                }
            } catch (e) {
                console.log('Could not fetch connections:', e.message);
            }

            // Get total recycled products from scrap_inventory
            let totalRecycled = 0;
            try {
                const { data: inventoryData, error: invError } = await supabaseClient
                    .from('scrap_inventory')
                    .select('weight')
                    .eq('owner_id', userId)
                    .eq('status', 'recycled');
                if (!invError && inventoryData) {
                    totalRecycled = inventoryData.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
                }
            } catch (e) {
                console.log('Could not fetch inventory:', e.message);
            }

            // Calculate experience years from established year
            const currentYear = new Date().getFullYear();
            const experienceYears = profileData.established_year 
                ? currentYear - parseInt(profileData.established_year) 
                : 0;

            const combinedProfile = {
                firstName: userData["First name"] || '',
                lastName: userData["Last_Name"] || '',
                email: userData.email_address || '',
                latitude: userData.latitude,
                longitude: userData.longitude,
                businessName: profileData.business_name || userData["First name"] + " " + userData["Last_Name"],
                contact_number: profileData.contact_number || '',
                address: profileData.Area || '',
                city: profileData.City || '',
                state: profileData.State || '',
                zipCode: profileData.pincode || '',
                description: profileData.business_description || '',
                establishedYear: profileData.established_year || '',
                workingHours: profileData.working_hours || '',
                licence: profileData.licence || '',
                socialMedia: {
                    facebook: profileData.facebook || '',
                    instagram: profileData.instagram || '',
                    twitter: profileData.twitter || ''
                },
                stats: {
                    connections: connectionsCount,
                    experience: experienceYears,
                    annualVolume: totalRecycled.toFixed(1),
                    partners: connectionsCount
                }
            };

            setProfile(combinedProfile);
        } catch (error) {
            console.error('Error fetching profile:', error);
            setError('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setProfile(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setProfile(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleServiceToggle = (service) => {
        setProfile(prev => ({
            ...prev,
            services: prev.services.includes(service)
                ? prev.services.filter(s => s !== service)
                : [...prev.services, service]
        }));
    };

    const handlePaymentMethodToggle = (method) => {
        setProfile(prev => ({
            ...prev,
            paymentMethods: prev.paymentMethods.includes(method)
                ? prev.paymentMethods.filter(m => m !== method)
                : [...prev.paymentMethods, method]
        }));
    };

    const handleCertificationToggle = (certification) => {
        setProfile(prev => ({
            ...prev,
            certifications: prev.certifications.includes(certification)
                ? prev.certifications.filter(c => c !== certification)
                : [...prev.certifications, certification]
        }));
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccess('');

            // Save to scrapdealer_profile table
            const profileData = {
                    dealer_id: currentUser.user_id,
                business_name: profile.businessName,
                    contact_number: profile.contact_number,
                    Area: profile.address,
                    City: profile.city,
                    State: profile.state,
                    pincode: profile.zipCode,
                    business_description: profile.description,
                established_year: profile.establishedYear,
                    working_hours: profile.workingHours,
                    facebook: profile.socialMedia?.facebook,
                    instagram: profile.socialMedia?.instagram,
                    twitter: profile.socialMedia?.twitter,
                    licence: profile.licence
                };
            try{
                await supabaseClient
                    .from('scrapdealer_profile')
                    .upsert(profileData, {
                    onConflict: 'dealer_id'
                });
            } catch (e) {
                console.log('Could not save to profile table:', e.message);
                setError('Failed to save profile: ' + e.message);
                return;
            }

            setSuccess('Profile updated successfully!');
            setIsEditing(false);
        }catch (error) {
            console.error('Error saving profile:', error);
            setError('Failed to save profile: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        fetchProfile(currentUser.user_id);
        setIsEditing(false);
        setError('');
        setSuccess('');
    };

    const fetchEnterpriseOrders = async () => {
        setOrdersLoading(true);
        try {
            const { data, error } = await getPendingEnterpriseOrders();
            if (error) throw new Error(error);
            // Filter to show only pending orders or orders assigned to this dealer
            const dealerId = currentUser?.user_id;
            const relevantOrders = data.filter(order =>
                order.status === 'pending' || order.assigned_dealer_id === dealerId
            );
            setEnterpriseOrders(relevantOrders);
        } catch (err) {
            console.error('Error fetching enterprise orders:', err);
            setError('Failed to load enterprise orders');
        } finally {
            setOrdersLoading(false);
        }
    };

    const handleAcceptOrder = async (orderId) => {
        setAcceptingOrder(orderId);
        try {
            const result = await acceptEnterpriseOrder(orderId, currentUser.user_id);
            if (result.success) {
                setSuccess('Order accepted successfully! The enterprise has been notified.');
                // Refresh orders list
                await fetchEnterpriseOrders();
            } else {
                setError(result.error || 'Failed to accept order');
            }
        } catch (err) {
            console.error('Error accepting order:', err);
            setError('Failed to accept order. Please try again.');
        } finally {
            setAcceptingOrder(null);
        }
    };

    if (loading) {
        return (
            <div className="profile-page">
                <SharedNavbar activeLink="profile" user={currentUser}/>
                <div className="profile-loading">
                    <div className="spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <Navbar2 activeLink="profile" user={currentUser}/>
            <div className="profile-container">
                
                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <div className="profile-content">
                    {/* Profile Header Card */}
                    <div className="profile-header-card">
                        <div className="profile-cover">
                            <div className="profile-avatar-large">
                                {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                            </div>
                        </div>
                        <div className="profile-info-section">
                            <div className="profile-main-info">
                                <div>
                                    <h1 className="profile-name">{profile.firstName} {profile.lastName}</h1>
                                    <p className="profile-title">
                                        <Briefcase size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                        Founder & Proprietor - {profile.businessName}
                                    </p>
                                    <p className="profile-location">
                                        <MapPin size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                        {profile.address}, {profile.city}, {profile.state}
                                    </p>
                                    <div className="profile-badges">
                                        <span className="badge badge-green">
                                            <Recycle size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                            Metal Recycler
                                        </span>
                                        <span className="badge badge-blue">
                                            <Factory size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                            Industrial Scrap
                                        </span>
                                        <span className="badge badge-yellow">
                                            <BadgeCheck size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                            Verified Dealer
                                        </span>
                                    </div>
                                </div>
                                <div className="profile-actions">
                                    {!isEditing ? (
                                        <div className="action-buttons">
                                            <button 
                                                className="btn btn-primary"
                                                onClick={() => setIsEditing(true)}
                                            >
                                                Edit Profile
                                            </button>
                                            <button 
                                                className="btn btn-secondary"
                                                onClick={() => navigate('/add-scrap')}
                                            >
                                                + Add Collection
                                            </button>
                                            <button 
                                                className="btn btn-secondary"
                                                onClick={() => navigate('/view-inventory')}
                                            >
                                                View Inventory
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="edit-actions">
                                            <button 
                                                className="btn btn-success"
                                                onClick={handleSaveProfile}
                                                disabled={saving}
                                            >
                                                {saving ? 'Saving...' : 'Save'}
                                            </button>
                                            <button 
                                                className="btn btn-secondary"
                                                onClick={handleCancel}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* About Section */}
                    <div className="card">
                        <p className="section-title">About</p>
                        {isEditing ? (
                            <textarea
                                name="description"
                                value={profile.description || ''}
                                onChange={handleInputChange}
                                className="form-textarea"
                                rows="4"
                                placeholder="Describe your business, services, and what makes you unique..."
                            />
                        ) : (
                            <>
                                <p className="about-text">
                                    {profile.description || 'No description provided yet. Add details about your business, services, and expertise.'}
                                </p>
                                {profile.establishedYear && (
                                    <p className="about-text">
                                        Member of <strong>Maharashtra Recyclers Association</strong> since {profile.establishedYear}.
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    {/* Partners Section */}
                    <div className="card">
                        <div className="tabs-container">
                            <div
                                className={`tab ${activeTab === 'companies' ? 'active' : ''}`}
                                onClick={() => setActiveTab('companies')}
                            >
                                Corporate partners
                            </div>
                            <div
                                className={`tab ${activeTab === 'artisans' ? 'active' : ''}`}
                                onClick={() => setActiveTab('artisans')}
                            >
                                Skilled artisans
                            </div>
                            <div
                                className={`tab ${activeTab === 'suppliers' ? 'active' : ''}`}
                                onClick={() => setActiveTab('suppliers')}
                            >
                                Suppliers
                            </div>
                            <div
                                className={`tab ${activeTab === 'enterpriseOrders' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab('enterpriseOrders');
                                    fetchEnterpriseOrders();
                                }}
                            >
                                Enterprise Orders
                            </div>
                        </div>

                        {activeTab === 'companies' && (
                            <div className="connections-list">
                                {profile.partners?.companies?.length > 0 ? (
                                    profile.partners.companies.map((partner, index) => (
                                        <div key={index} className="connection-card">
                                            <div className="avatar-small">
                                                {partner.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="connection-info">
                                                <p className="connection-name">{partner.name}</p>
                                                <p className="connection-desc">{partner.description}</p>
                                            </div>
                                            <span className={`badge ${partner.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                                                {partner.status}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-connections">No corporate partners added yet.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'artisans' && (
                            <div className="connections-list">
                                {profile.partners?.artisans?.length > 0 ? (
                                    profile.partners.artisans.map((partner, index) => (
                                        <div key={index} className="connection-card">
                                            <div className="avatar-small">
                                                {partner.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="connection-info">
                                                <p className="connection-name">{partner.name}</p>
                                                <p className="connection-desc">{partner.description}</p>
                                            </div>
                                            <span className={`badge ${partner.status === 'Regular buyer' ? 'badge-success' : 'badge-warning'}`}>
                                                {partner.status}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-connections">No artisan partners added yet.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'suppliers' && (
                            <div className="connections-list">
                                {profile.partners?.suppliers?.length > 0 ? (
                                    profile.partners.suppliers.map((partner, index) => (
                                        <div key={index} className="connection-card">
                                            <div className="avatar-small">
                                                {partner.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="connection-info">
                                                <p className="connection-name">{partner.name}</p>
                                                <p className="connection-desc">{partner.description}</p>
                                            </div>
                                            <span className={`badge ${partner.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                                                {partner.status}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-connections">No suppliers added yet.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'enterpriseOrders' && (
                            <div className="enterprise-orders-section">
                                {ordersLoading ? (
                                    <div className="orders-loading" style={{ textAlign: 'center', padding: '2rem' }}>
                                        <div className="spinner"></div>
                                        <p>Loading enterprise orders...</p>
                                    </div>
                                ) : enterpriseOrders.length === 0 ? (
                                    <div className="no-orders" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                        <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                        <p>No pending enterprise orders at the moment.</p>
                                        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                            When enterprises place scrap orders, they will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="orders-list">
                                        {enterpriseOrders.map((order) => (
                                            <div key={order.order_id} className="order-card" style={{
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '12px',
                                                padding: '1.5rem',
                                                marginBottom: '1rem',
                                                background: order.assigned_dealer_id === currentUser?.user_id ? '#f0fdf4' : '#ffffff'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                    <div>
                                                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>
                                                            {order.industry_profile?.company_name || 'Unknown Company'}
                                                        </h4>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            fontSize: '0.875rem',
                                                            color: '#6b7280'
                                                        }}>
                                                            <Factory size={14} />
                                                            {order.industry_profile?.industry_type || 'Enterprise'}
                                                        </span>
                                                    </div>
                                                    <span className={`badge ${order.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>
                                                        {order.status === 'pending' ? (
                                                            <><Clock size={12} style={{ marginRight: '4px' }} /> Pending</>
                                                        ) : (
                                                            <><CheckCircle size={12} style={{ marginRight: '4px' }} /> Accepted</>
                                                        )}
                                                    </span>
                                                </div>

                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                                    gap: '1rem',
                                                    marginBottom: '1rem',
                                                    padding: '1rem',
                                                    background: '#f9fafb',
                                                    borderRadius: '8px'
                                                }}>
                                                    <div>
                                                        <small style={{ color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
                                                            <Recycle size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                                            Material
                                                        </small>
                                                        <strong style={{ color: '#1f2937' }}>{order.material_type}</strong>
                                                    </div>
                                                    <div>
                                                        <small style={{ color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
                                                            <Package size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                                            Quantity
                                                        </small>
                                                        <strong style={{ color: '#1f2937' }}>{order.quantity}</strong>
                                                    </div>
                                                    <div>
                                                        <small style={{ color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
                                                            <DollarSign size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                                            Price
                                                        </small>
                                                        <strong style={{ color: '#1f2937' }}>
                                                            {order.price ? `₹${order.price}` : 'Negotiable'}
                                                        </strong>
                                                    </div>
                                                </div>

                                                <div style={{ marginBottom: '1rem' }}>
                                                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#374151' }}>
                                                        <MapPin size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                                        <strong>Delivery:</strong> {order.delivery_details}, {order['City']} - {order['PIN_code']}
                                                    </p>
                                                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#374151' }}>
                                                        <User size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                                        <strong>Contact:</strong> {order['Person_name']} ({order.phone_no})
                                                    </p>
                                                    <p style={{ margin: '0', fontSize: '0.875rem', color: '#374151' }}>
                                                        <Clock size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                                        <strong>Preferred Delivery:</strong> {order['Prefered_Delivery_Date']}
                                                    </p>
                                                </div>

                                                {order.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleAcceptOrder(order.order_id)}
                                                        disabled={acceptingOrder === order.order_id}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.75rem',
                                                            background: '#0f9d58',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            fontSize: '0.875rem',
                                                            fontWeight: '600',
                                                            cursor: acceptingOrder === order.order_id ? 'not-allowed' : 'pointer',
                                                            opacity: acceptingOrder === order.order_id ? 0.7 : 1
                                                        }}
                                                    >
                                                        {acceptingOrder === order.order_id ? (
                                                            <>Accepting...</>
                                                        ) : (
                                                            <><CheckCircle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Accept Order</>
                                                        )}
                                                    </button>
                                                )}

                                                {order.assigned_dealer_id === currentUser?.user_id && (
                                                    <div style={{
                                                        padding: '0.75rem',
                                                        background: '#dcfce7',
                                                        borderRadius: '8px',
                                                        textAlign: 'center',
                                                        color: '#166534',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '500'
                                                    }}>
                                                        <CheckCircle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                                        You have accepted this order. Fulfill by {order['Prefered_Delivery_Date']}.
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <button className="view-all-btn" onClick={() => navigate('/connections')}>
                            View all connections <ArrowRight size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                        </button>
                    </div>

                    {/* Experience Section */}
                    <div className="card">
                        <p className="section-title">Experience</p>
                        <div className="experience-list">
                            {profile.experience?.length > 0 ? (
                                profile.experience.map((exp, index) => (
                                    <div key={index} className="experience-row">
                                        <div className="exp-icon">
                                            <Building2 size={20} />
                                        </div>
                                        <div className="exp-details">
                                            <p className="exp-title">{exp.title}</p>
                                            <p className="exp-company">{exp.company} - {exp.period}</p>
                                            <p className="exp-description">{exp.description}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="experience-row">
                                    <div className="exp-icon">
                                        <Building2 size={20} />
                                    </div>
                                    <div className="exp-details">
                                        <p className="exp-title">Founder & Proprietor</p>
                                        <p className="exp-company">{profile.businessName} - {profile.establishedYear || 'Present'} - present</p>
                                        <p className="exp-description">
                                            Managing end-to-end scrap operations - sourcing, sorting, weighing, and reselling ferrous, non-ferrous, and e-waste materials.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Materials Section */}
                    <div className="card">
                        <p className="section-title">Materials dealt in</p>
                        <div className="materials-grid">
                            {profile.materials?.length > 0 ? (
                                profile.materials.map((material, index) => (
                                    <span key={index} className="pill">{material}</span>
                                ))
                            ) : (
                                <>
                                    <span className="pill">Steel & Iron</span>
                                    <span className="pill">Copper</span>
                                    <span className="pill">Brass</span>
                                    <span className="pill">Aluminium</span>
                                    <span className="pill">Stainless Steel</span>
                                    <span className="pill">E-waste / PCBs</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Business Address */}
                    <div className="card">
                        <div className="address-header">
                            <p className="section-title">
                                <MapPin size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                Business Address
                            </p>
                            {!isEditing && (profile.address || profile.city) && (
                                <button className="view-all-btn" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(`${profile.address}, ${profile.city}, ${profile.state}`)}`, '_blank')}>
                                    View on Map <ExternalLink size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                                </button>
                            )}
                        </div>
                        
                        {isEditing ? (
                            <div className="address-form">
                                <div className="address-input-group">
                                    <div className="input-icon"><Home size={20} /></div>
                                    <input
                                        type="text"
                                        name="address"
                                        value={profile.address}
                                        onChange={handleInputChange}
                                        className="form-input address-input"
                                        placeholder="Street Address"
                                    />
                                </div>
                                <div className="address-row">
                                    <div className="address-input-group">
                                        <div className="input-icon"><Building2 size={20} /></div>
                                        <input
                                            type="text"
                                            name="city"
                                            value={profile.city}
                                            onChange={handleInputChange}
                                            className="form-input address-input"
                                            placeholder="City"
                                        />
                                    </div>
                                    <div className="address-input-group">
                                        <div className="input-icon"><Landmark size={20} /></div>
                                        <input
                                            type="text"
                                            name="state"
                                            value={profile.state}
                                            onChange={handleInputChange}
                                            className="form-input address-input"
                                            placeholder="State"
                                        />
                                    </div>
                                </div>
                                <div className="address-input-group">
                                    <div className="input-icon"><LocateFixed size={20} /></div>
                                    <input
                                        type="text"
                                        name="zipCode"
                                        value={profile.zipCode}
                                        onChange={handleInputChange}
                                        className="form-input address-input"
                                        placeholder="ZIP Code"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="address-display">
                                {profile.address && (
                                    <div className="address-item">
                                        <div className="address-icon"><Home size={20} /></div>
                                        <p className="address-text">{profile.address}</p>
                                    </div>
                                )}
                                {(profile.city || profile.state || profile.zipCode) && (
                                    <div className="address-item">
                                        <div className="address-icon"><MapPin size={20} /></div>
                                        <p className="address-text">
                                            {[profile.city, profile.state, profile.zipCode].filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                )}
                                {!profile.address && !profile.city && !profile.state && !profile.zipCode && (
                                    <div className="address-empty">
                                        <div className="empty-icon"><MapPinOff size={28} /></div>
                                        <p className="empty-text">No business address provided yet</p>
                                        <p className="empty-subtext">Add your address to help customers find you</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Business Details */}
                    <div className="profile-section">
                        <h2 className="section-title">Business Details</h2>
                        <div className="info-grid">
                            <div className="info-group">
                                <label>Contact Number</label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        name="contact_number"
                                        value={profile.contact_number || ''}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="Enter phone number"
                                    />
                                ) : (
                                    <p>{profile.contact_number || 'Not provided'}</p>
                                )}
                            </div>
                            <div className="info-group">
                                <label>Licence</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="licence"
                                        value={profile.licence || ''}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="Enter licence number"
                                    />
                                ) : (
                                    <p>{profile.licence || 'Not provided'}</p>
                                )}
                            </div>
                            <div className="info-group full-width">
                                <label>Business Description</label>
                                {isEditing ? (
                                    <textarea
                                        name="description"
                                        value={profile.description}
                                        onChange={handleInputChange}
                                        className="form-textarea"
                                        rows="4"
                                        placeholder="Describe your business, services, and what makes you unique..."
                                    />
                                ) : (
                                    <p>{profile.description || 'No description provided'}</p>
                                )}
                            </div>
                            <div className="info-group">
                                <label>Established Year</label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        name="establishedYear"
                                        value={profile.establishedYear}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        min="1900"
                                        max={new Date().getFullYear()}
                                    />
                                ) : (
                                    <p>{profile.establishedYear || 'Not provided'}</p>
                                )}
                            </div>
                            <div className="info-group">
                                <label>Working Hours</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="workingHours"
                                        value={profile.workingHours}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="e.g., Mon-Fri: 9AM-6PM, Sat: 9AM-1PM"
                                    />
                                ) : (
                                    <p>{profile.workingHours || 'Not provided'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Social Media */}
                    <div className="profile-section">
                        <h2 className="section-title">Social Media</h2>
                        {isEditing ? (
                            <div className="info-grid">
                                <div className="info-group">
                                    <label>Facebook</label>
                                    <input
                                        type="url"
                                        name="socialMedia.facebook"
                                        value={profile.socialMedia?.facebook || ''}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="https://facebook.com/yourpage"
                                    />
                                </div>
                                <div className="info-group">
                                    <label>Instagram</label>
                                    <input
                                        type="url"
                                        name="socialMedia.instagram"
                                        value={profile.socialMedia?.instagram || ''}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="https://instagram.com/yourprofile"
                                    />
                                </div>
                                <div className="info-group">
                                    <label>Twitter</label>
                                    <input
                                        type="url"
                                        name="socialMedia.twitter"
                                        value={profile.socialMedia?.twitter || ''}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="https://twitter.com/yourhandle"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="social-media-icons">
                                {profile.socialMedia?.facebook && (
                                    <a href={profile.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="social-icon-link facebook">
                                        <svg className="social-icon-svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                        </svg>
                                    </a>
                                )}
                                {profile.socialMedia?.instagram && (
                                    <a href={profile.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="social-icon-link instagram">
                                        <svg className="social-icon-svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                        </svg>
                                    </a>
                                )}
                                {profile.socialMedia?.twitter && (
                                    <a href={profile.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="social-icon-link twitter">
                                        <svg className="social-icon-svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 00-2.163-2.723c-.951-.538-2.17-.837-3.471-.837-2.346 0-4.263 1.603-4.42 3.658a10.008 10.008 0 01-2.187-2.44 4.898 4.898 0 00-.685 2.437 5.015 5.015 0 00.849 2.779 4.945 4.945 0 01-2.238-.613v.07a5.014 5.014 0 003.987 4.916c-.587.16-1.2.245-1.833.245-.464 0-.914-.045-1.35-.13a5.021 5.021 0 004.708 3.48 10.035 10.035 0 01-6.198 2.13c-.403 0-.8-.024-1.19-.068a14.18 14.18 0 007.547 2.212c9.056 0 14.01-7.502 14.01-14.01 0-.213-.005-.426-.014-.637a10.03 10.03 0 002.46-2.548l-.047-.02z"/>
                                        </svg>
                                    </a>
                                )}
                                {!profile.socialMedia?.facebook && !profile.socialMedia?.instagram && !profile.socialMedia?.twitter && (
                                    <p className="no-social-text">No social media links provided</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default ScrapDealer;