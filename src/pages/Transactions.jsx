import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Transactions.css';

function Transactions() {
    const navigate = useNavigate();

    return (
        <div className="transactions-page">
            <div className="transactions-container">
                <div className="coming-soon-icon">🚧</div>
                <h1>Transactions</h1>
                <p className="coming-soon-text">the feature coming soon!</p>
                <button 
                    className="back-btn"
                    onClick={() => navigate('/enterprise')}
                >
                    ← Back to Dashboard
                </button>
            </div>
        </div>
    );
}

export default Transactions;
