import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import supabaseClient from '../supabase-config';
import SharedNavbar from '../components/SharedNavbar';
import './Connections.css';
import Navbar2 from '../components/Navbar2';
import {
    sendConnectionRequestNotification,
    sendConnectionAcceptedNotification,
    sendConnectionRejectedNotification
} from '../services/notificationService';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (km) => {
    if (km === Infinity) return null;
    return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;
};

const AVATAR_COLORS = [
    { bg: '#E6F1FB', color: '#0C447C' },
    { bg: '#E1F5EE', color: '#085041' },
    { bg: '#EEEDFE', color: '#3C3489' },
    { bg: '#FAECE7', color: '#712B13' },
    { bg: '#FBEAF0', color: '#72243E' },
    { bg: '#FAEEDA', color: '#633806' },
];

const getAvatarColor = (str = '') => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const Avatar = ({ firstName = '', lastName = '', size = 44 }) => {
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
    const { bg, color } = getAvatarColor(firstName + lastName);
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: bg, color, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.32, fontWeight: 500, flexShrink: 0,
        }}>
            {initials}
        </div>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────
function Connections() {
    const [allUsers, setAllUsers]           = useState([]);
    const [connections, setConnections]     = useState([]);
    const [currentUser, setCurrentUser]     = useState(null);
    const [loading, setLoading]             = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // connection_id or target_user_id
    const [error, setError]                 = useState('');
    const [industries, setIndustries]       = useState([]);
    const [laborProfiles, setLaborProfiles] = useState([]);
    const navigate = useNavigate();

    // ── Auth guard ────────────────────────────────────────────────────────────
    useEffect(() => {
        const raw = sessionStorage.getItem('user');
        if (!raw) { navigate('/login'); return; }
        const user = JSON.parse(raw);
        setCurrentUser(user);
        fetchAllData(user);
    }, [navigate]);

    const fetchAllData = useCallback(async (user) => {
        setLoading(true);
        setError('');
        try {
            const [{ data: usersData, error: uErr }, { data: connData, error: cErr }] =
                await Promise.all([
                    supabaseClient
                        .from('users')
                        .select('user_id, "First name", Last_Name, role, email_address, latitude, longitude')
                        .neq('user_id', user.user_id),
                    supabaseClient
                        .from('connections')
                        .select('*')
                        .or(`requester_id.eq.${user.user_id},receiver_id.eq.${user.user_id}`),
                ]);

            if (uErr) throw uErr;
            if (cErr) throw cErr;

            // Sort by proximity
            const sorted = [...(usersData || [])].sort((a, b) =>
                calculateDistance(user.latitude, user.longitude, a.latitude, a.longitude) -
                calculateDistance(user.latitude, user.longitude, b.latitude, b.longitude)
            );

            console.log('=== DEBUG: Sorted Users ===');
            console.log('Sorted users:', sorted);

            setAllUsers(sorted);
            setConnections(connData || []);

            // Fetch industry and labor profiles
            const [{ data: indData, error: indErr }, { data: labData, error: labErr }] =
                await Promise.all([
                    supabaseClient.from('industry_profile').select('company_id, company_name, industry_type, "Contact_person", company_size, "Budget"'),
                    supabaseClient.from('skilledlabor_profile').select('labor_id, first_name, last_name, city, state, skills'),
                ]);
            if (!indErr && indData) setIndustries(indData);
            if (!labErr && labData) setLaborProfiles(labData);
        } catch (e) {
            setError('Failed to load data: ' + e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const getConnectionStatus = (targetId) => {
        const conn = connections.find(
            c => (c.requester_id === currentUser?.user_id && c.receiver_id === targetId) ||
                 (c.receiver_id === currentUser?.user_id && c.requester_id === targetId)
        );
        if (!conn) return null;
        return { ...conn, isSent: conn.requester_id === currentUser?.user_id };
    };

    const getUserById = (id) => allUsers.find(u => u.user_id === id);

    const receivedRequests  = connections.filter(c => c.receiver_id  === currentUser?.user_id && c.status === 'pending');
    const sentRequests      = connections.filter(c => c.requester_id === currentUser?.user_id && c.status === 'pending');
    const myNetwork         = connections.filter(c => c.status === 'accepted');

    console.log('=== DEBUG: Pending Requests Analysis ===');
    console.log('Received requests count:', receivedRequests.length);
    console.log('Sent requests count:', sentRequests.length);
    console.log('Total pending requests:', receivedRequests.length + sentRequests.length);
    console.log('Received requests:', receivedRequests);
    console.log('Sent requests:', sentRequests);

    const discoveryList = allUsers.filter(u =>
        !getConnectionStatus(u.user_id) &&
        u.role !== 'ScrapDealer'
    );

    console.log('=== DEBUG: Discovery List ===');
    console.log('All users count:', allUsers.length);
    console.log('Discovery list count:', discoveryList.length);
    console.log('Discovery list:', discoveryList);
    console.log('Connection statuses for all users:', allUsers.map(u => ({
        id: u.user_id,
        name: `${u['First name']} ${u['Last_Name']}`,
        role: u.role,
        status: getConnectionStatus(u.user_id)
    })));

    // Count mutual connections (users both are connected to)
    const getMutualCount = (targetId) => {
        const myNetworkIds = myNetwork.map(c =>
            c.requester_id === currentUser?.user_id ? c.receiver_id : c.requester_id
        );
        const targetConnIds = connections
            .filter(c => (c.requester_id === targetId || c.receiver_id === targetId) && c.status === 'accepted')
            .map(c => c.requester_id === targetId ? c.receiver_id : c.requester_id);
        return myNetworkIds.filter(id => targetConnIds.includes(id)).length;
    };

    // ── Actions ───────────────────────────────────────────────────────────────
    const handleConnect = async (targetUserId) => {
        setActionLoading(targetUserId);
        try {
            const { error } = await supabaseClient
                .from('connections')
                .insert([{ requester_id: currentUser.user_id, receiver_id: targetUserId, status: 'pending' }]);
            if (error) {
                setError(error.code === '23505' ? 'Request already sent.' : error.message);
            } else {
                // Send notification to the target user
                const targetUser = getUserById(targetUserId);
                if (targetUser) {
                    await sendConnectionRequestNotification(
                        targetUserId,
                        `${currentUser['First name']} ${currentUser['Last_Name']}`,
                        currentUser.role
                    );
                }
                await fetchAllData(currentUser);
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleConnectionResponse = async (connectionId, status) => {
        setActionLoading(connectionId);
        try {
            // Get the connection details first
            const connection = connections.find(c => c.connection_id === connectionId);
            const { error } = await supabaseClient
                .from('connections')
                .update({ status })
                .eq('connection_id', connectionId);
            if (error) {
                setError(error.message);
            } else {
                // Send notification to the requester about the response
                if (connection) {
                    const requesterId = connection.requester_id;
                    if (status === 'accepted') {
                        await sendConnectionAcceptedNotification(
                            requesterId,
                            `${currentUser['First name']} ${currentUser['Last_Name']}`,
                            currentUser.role
                        );
                    } else if (status === 'rejected') {
                        await sendConnectionRejectedNotification(
                            requesterId,
                            `${currentUser['First name']} ${currentUser['Last_Name']}`,
                            currentUser.role
                        );
                    }
                }
                await fetchAllData(currentUser);
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleWithdraw = async (connectionId) => {
        setActionLoading(connectionId);
        try {
            console.log('=== DEBUG: Withdrawing Connection ===');
            console.log('Connection ID to withdraw:', connectionId);
            
            const { error } = await supabaseClient
                .from('connections')
                .delete()
                .eq('connection_id', connectionId);
                
            if (error) {
                console.error('Error withdrawing connection:', error);
                setError('Failed to withdraw request: ' + error.message);
            } else {
                console.log('Connection successfully withdrawn');
                await fetchAllData(currentUser);
            }
        } catch (e) {
            console.error('Exception in withdraw:', e);
            setError('Failed to withdraw request: ' + e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogout = async () => {
        await supabaseClient.auth.signOut();
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    // ── Render helpers ────────────────────────────────────────────────────────
    const ConnectButton = ({ userId }) => {
        const conn = getConnectionStatus(userId);
        const busy = actionLoading === userId || (conn && actionLoading === conn.connection_id);

        if (!conn) return (
            <button
                className="conn-btn conn-btn--primary"
                onClick={() => handleConnect(userId)}
                disabled={busy}
            >
                {busy ? '…' : '+ Connect'}
            </button>
        );

        if (conn.status === 'pending' && conn.isSent) return (
            <button
                className="conn-btn conn-btn--pending"
                onClick={() => handleWithdraw(conn.connection_id)}
                disabled={busy}
                title="Click to withdraw"
            >
                {busy ? '…' : 'Pending'}
            </button>
        );

        if (conn.status === 'pending' && !conn.isSent) return (
            <div style={{ display: 'flex', gap: 6 }}>
                <button className="conn-btn conn-btn--accept" disabled={busy}
                    onClick={() => handleConnectionResponse(conn.connection_id, 'accepted')}>
                    {busy ? '…' : 'Accept'}
                </button>
                <button className="conn-btn conn-btn--ghost" disabled={busy}
                    onClick={() => handleConnectionResponse(conn.connection_id, 'rejected')}>
                    Decline
                </button>
            </div>
        );

        if (conn.status === 'accepted') return (
            <button className="conn-btn conn-btn--connected" disabled>Connected</button>
        );

        return null;
    };

    // ── Loading / error states ────────────────────────────────────────────────
    if (loading) return (
        <div className="connections-page">
            <div className="conn-loading">
                <div className="conn-spinner" />
                <p>Loading your network…</p>
            </div>
        </div>
    );

    // ── JSX ───────────────────────────────────────────────────────────────────
    return (
        <div className="connections-page">
            {/* ── Shared Navbar ── */}
            <Navbar2 activeLink="connections" badgeCount={receivedRequests.length} user={currentUser} />

            {/* ── Main layout ── */}
            <div className="conn-layout">

                {/* Left sidebar – user card */}
                <aside className="conn-sidebar">
                    <div className="conn-profile-card">
                        <div className="conn-profile-card__banner" />
                        <div className="conn-profile-card__body">
                            <Avatar
                                firstName={currentUser?.['First name']}
                                lastName={currentUser?.['Last_Name']}
                                size={52}
                            />
                            <h3 className="conn-profile-card__name">
                                {currentUser?.['First name']} {currentUser?.['Last_Name']}
                            </h3>
                            <p className="conn-profile-card__role">{currentUser?.role}</p>
                        </div>
                        <div className="conn-profile-card__stats">
                            <div className="conn-stat">
                                <span className="conn-stat__val">{myNetwork.length}</span>
                                <span className="conn-stat__label">Connections</span>
                            </div>
                            <div className="conn-stat">
                                <span className="conn-stat__val">{receivedRequests.length + sentRequests.length}</span>
                                <span className="conn-stat__label">Pending</span>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="conn-main">
                    {error && (
                        <div className="conn-alert" onClick={() => setError('')}>
                            {error} <span style={{ float: 'right', cursor: 'pointer' }}>×</span>
                        </div>
                    )}

                    {/* Section: Received requests */}
                    {receivedRequests.length > 0 && (
                        <section className="conn-section">
                            <h2 className="conn-section__title">
                                Connection requests
                                <span className="conn-badge">{receivedRequests.length}</span>
                            </h2>
                            <div className="dealers-list">
                                {receivedRequests.map(req => {
                                    const sender = getUserById(req.requester_id);
                                    const mutual = getMutualCount(req.requester_id);
                                    return (
                                        <div key={req.connection_id} className="dealer-item">
                                            <div className="dealer-main-info">
                                                <div className="dealer-name-row">
                                                    <h3 className="dealer-name">
                                                        {sender ? `${sender['First name']} ${sender['Last_Name']}` : `User #${req.requester_id}`}
                                                    </h3>
                                                    <span className="verified-badge">{sender?.role || 'User'}</span>
                                                </div>
                                                <div className="dealer-address">
                                                    <span className="location-icon">📅</span>
                                                    <p>{new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                                </div>
                                                {mutual > 0 && (
                                                    <div className="dealer-materials">
                                                        <span className="material-tag">{mutual} mutual connection{mutual !== 1 ? 's' : ''}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="dealer-actions">
                                                <button
                                                    className="get-contact-btn"
                                                    disabled={actionLoading === req.connection_id}
                                                    onClick={() => handleConnectionResponse(req.connection_id, 'accepted')}
                                                >
                                                    {actionLoading === req.connection_id ? '…' : 'Accept'}
                                                </button>
                                                <button
                                                    className="view-location-btn"
                                                    disabled={actionLoading === req.connection_id}
                                                    onClick={() => handleConnectionResponse(req.connection_id, 'rejected')}
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Section: People near you */}
                    <section className="conn-section">
                        <h2 className="conn-section__title">People near you</h2>
                        {discoveryList.length === 0 ? (
                            <p className="conn-empty">No new people to discover.</p>
                        ) : (
                            <div className="dealers-list">
                                {discoveryList.map(user => {
                                    const dist = calculateDistance(
                                        currentUser?.latitude, currentUser?.longitude,
                                        user.latitude, user.longitude
                                    );
                                    const mutual = getMutualCount(user.user_id);
                                    return (
                                        <div key={user.user_id} className="dealer-item">
                                            <div className="dealer-main-info">
                                                <div className="dealer-name-row">
                                                    <h3 className="dealer-name">{user['First name']} {user['Last_Name']}</h3>
                                                    <span className="verified-badge">{user.role}</span>
                                                </div>
                                                <div className="dealer-address">
                                                    <span className="location-icon">📍</span>
                                                    <p>{formatDistance(dist) || 'Location not available'}</p>
                                                </div>
                                                {mutual > 0 && (
                                                    <div className="dealer-materials">
                                                        <span className="material-tag">{mutual} mutual connection{mutual !== 1 ? 's' : ''}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="dealer-actions">
                                                <ConnectButton userId={user.user_id} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Section: Industries */}
                    <section className="conn-section">
                        <h2 className="conn-section__title">Industries</h2>
                        {industries.length === 0 ? (
                            <p className="conn-empty">No industries found.</p>
                        ) : (
                            <div className="dealers-list">
                                {industries.map(industry => {
                                    const connStatus = getConnectionStatus(industry.company_id);
                                    return (
                                        <div key={industry.company_id} className="dealer-item">
                                            <div className="dealer-main-info">
                                                <div className="dealer-name-row">
                                                    <h3 className="dealer-name">{industry.company_name}</h3>
                                                    <span className="verified-badge">Industry</span>
                                                </div>
                                                <div className="dealer-address">
                                                    <span className="location-icon">🏭</span>
                                                    <p>{industry.industry_type}</p>
                                                </div>
                                                {industry["Contact_person"] && (
                                                    <div className="dealer-address">
                                                        <span className="location-icon">👤</span>
                                                        <p>Contact: {industry["Contact_person"]}</p>
                                                    </div>
                                                )}
                                                {industry.company_size && (
                                                    <div className="dealer-address">
                                                        <span className="location-icon">🏢</span>
                                                        <p>Size: {industry.company_size}</p>
                                                    </div>
                                                )}
                                                {industry["Budget"] && (
                                                    <div className="dealer-materials">
                                                        <span className="material-tag">Budget: ₹{industry["Budget"]?.toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="dealer-actions">
                                                {connStatus ? (
                                                    <button className="get-contact-btn" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>Connected</button>
                                                ) : (
                                                    <button
                                                        className="get-contact-btn"
                                                        onClick={() => handleConnect(industry.company_id)}
                                                    >
                                                        Connect
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Section: Skilled Labor */}
                    <section className="conn-section">
                        <h2 className="conn-section__title">Skilled Labor</h2>
                        {laborProfiles.length === 0 ? (
                            <p className="conn-empty">No skilled labor profiles found.</p>
                        ) : (
                            <div className="dealers-list">
                                {laborProfiles.map(labor => {
                                    const connStatus = getConnectionStatus(labor.labor_id);
                                    const skills = labor.skills ? labor.skills.split(',').map(s => s.trim()) : [];
                                    return (
                                        <div key={labor.labor_id} className="dealer-item">
                                            <div className="dealer-main-info">
                                                <div className="dealer-name-row">
                                                    <h3 className="dealer-name">{labor.first_name} {labor.last_name}</h3>
                                                    <span className="verified-badge">Skilled Labor</span>
                                                </div>
                                                {(labor.city || labor.state) && (
                                                    <div className="dealer-address">
                                                        <span className="location-icon">📍</span>
                                                        <p>{[labor.city, labor.state].filter(Boolean).join(', ')}</p>
                                                    </div>
                                                )}
                                                {skills.length > 0 && (
                                                    <div className="dealer-materials">
                                                        {skills.slice(0, 4).map((skill, idx) => (
                                                            <span key={idx} className="material-tag">{skill}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="dealer-actions">
                                                {connStatus ? (
                                                    <button className="get-contact-btn" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>Connected</button>
                                                ) : (
                                                    <button
                                                        className="get-contact-btn"
                                                        onClick={() => handleConnect(labor.labor_id)}
                                                    >
                                                        Connect
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Section: Sent requests */}
                    {sentRequests.length > 0 && (
                        <section className="conn-section">
                            <h2 className="conn-section__title">Sent requests</h2>
                            <div className="dealers-list">
                                {sentRequests.map(req => {
                                    const receiver = getUserById(req.receiver_id);
                                    return (
                                        <div key={req.connection_id} className="dealer-item">
                                            <div className="dealer-main-info">
                                                <div className="dealer-name-row">
                                                    <h3 className="dealer-name">
                                                        {receiver ? `${receiver['First name']} ${receiver['Last_Name']}` : `User #${req.receiver_id}`}
                                                    </h3>
                                                    <span className="verified-badge">{receiver?.role || 'User'}</span>
                                                </div>
                                                <div className="dealer-address">
                                                    <span className="location-icon">📅</span>
                                                    <p>Sent {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                                </div>
                                                <div className="dealer-materials">
                                                    <span className="material-tag">Pending</span>
                                                </div>
                                            </div>
                                            <div className="dealer-actions">
                                                <button
                                                    className="view-location-btn"
                                                    disabled={actionLoading === req.connection_id}
                                                    onClick={() => handleWithdraw(req.connection_id)}
                                                >
                                                    {actionLoading === req.connection_id ? '…' : 'Withdraw'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </main>

                {/* Right sidebar – network */}
                <aside className="conn-sidebar">
                    <div className="conn-sidebar-card">
                        <h4 className="conn-sidebar-card__title">My network</h4>
                        {myNetwork.length === 0 ? (
                            <p className="conn-empty" style={{ padding: '0 14px 14px' }}>No connections yet.</p>
                        ) : (
                            <div className="dealers-list" style={{ padding: '0 14px 14px' }}>
                                {myNetwork.map(conn => {
                                    const otherId = conn.requester_id === currentUser?.user_id
                                        ? conn.receiver_id
                                        : conn.requester_id;
                                    const other = getUserById(otherId);
                                    return (
                                        <div key={conn.connection_id} className="dealer-item" style={{ padding: '12px', marginBottom: '10px' }}>
                                            <div className="dealer-main-info" style={{ paddingRight: '0' }}>
                                                <div className="dealer-name-row" style={{ marginBottom: '4px' }}>
                                                    <h3 className="dealer-name" style={{ fontSize: '14px' }}>
                                                        {other ? `${other['First name']} ${other['Last_Name']}` : `User #${otherId}`}
                                                    </h3>
                                                </div>
                                                <span className="verified-badge" style={{ fontSize: '10px', padding: '2px 6px' }}>
                                                    {other?.role || 'User'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </aside>

            </div>
        </div>
    );
}

export default Connections;