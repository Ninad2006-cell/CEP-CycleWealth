import { useState } from 'react';
import './scrapDealer.css';

function ScrapDealer() {
    // Mock data for the scrap dealer profile
    const [profile] = useState({
        businessName: "Green Scrap Collectors",
        ownerName: "Rahul Sharma",
        age: 42,
        phone: "+91 98765 43210",
        email: "rahul@greenscrap.com",
        address: "123 Industrial Area, Mumbai, Maharashtra",
        experience: "15 years"
    });

    // Mock data for stats
    const [stats] = useState({
        totalCollected: 12500, // in kg
        sentToRecycling: 9800, // in kg
        remaining: 2700 // in kg
    });

    return (
        <div className="scrap-dealer-page">
            {/* Navigation Bar */}
            <div className="navbar">
                <h2 className="logo">♻️ CycleWealth</h2>
                <div className="nav-links">
                    <a href="/">Home</a>
                    <a href="#">Transactions</a>
                    <a href="#">Connections</a>
                </div>
                <div className="auth-buttons">
                    <button className="login">View Profile</button>
                    <button className="sign-up">Logout</button>
                </div>
            </div>

            {/* Main Content */}
            <div className="scrap-dealer-main">
                {/* Profile Section */}
                <div className="dealer-profile-card">
                    <div className="dealer-header">
                        <div className="dealer-avatar">
                            {profile.ownerName.charAt(0)}
                        </div>
                        <div className="dealer-title">
                            <h2>{profile.businessName}</h2>
                            <p>Scrap Dealer</p>
                        </div>
                    </div>

                    <div className="dealer-info-grid">
                        <div className="profile-info-item">
                            <span>Owner Name</span>
                            <p>{profile.ownerName}</p>
                        </div>

                        <div className="profile-info-item">
                            <span>Age</span>
                            <p>{profile.age} years</p>
                        </div>

                        <div className="profile-info-item">
                            <span>Experience</span>
                            <p>{profile.experience}</p>
                        </div>

                        <div className="profile-info-item">
                            <span>Phone</span>
                            <p>{profile.phone}</p>
                        </div>

                        <div className="profile-info-item">
                            <span>Email</span>
                            <p>{profile.email}</p>
                        </div>

                        <div className="profile-info-item">
                            <span>Address</span>
                            <p>{profile.address}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="dealer-stats-section">
                    <h2>📊 Scrap Collection Statistics</h2>

                    <div className="stats-grid">
                        {/* Total Collected */}
                        <div className="stat-card collected">
                            <div className="stat-value">{stats.totalCollected.toLocaleString()}</div>
                            <div className="stat-label">kg Total Collected</div>
                        </div>

                        {/* Sent to Recycling */}
                        <div className="stat-card recycling">
                            <div className="stat-value">{stats.sentToRecycling.toLocaleString()}</div>
                            <div className="stat-label">kg Sent to Recycling</div>
                        </div>

                        {/* Remaining */}
                        <div className="stat-card remaining">
                            <div className="stat-value">{stats.remaining.toLocaleString()}</div>
                            <div className="stat-label">kg Remaining</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="progress-container">
                        <p className="progress-label">
                            Recycling Progress: {Math.round((stats.sentToRecycling / stats.totalCollected) * 100)}%
                        </p>
                        <div className="progress-bar-bg">
                            <div 
                                className="progress-bar-fill"
                                style={{ width: `${(stats.sentToRecycling / stats.totalCollected) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ScrapDealer;