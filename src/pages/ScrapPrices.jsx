import React from 'react';
import HomeNavbar from '../components/HomeNavbar';
import Footer from '../components/Footer';
import './ScrapPrices.css';

function ScrapPrices() {
    const scrapPrices = [
        {
            category: 'Metals',
            items: [
                { name: 'Iron (Heavy)', price: '₹25 - ₹35', unit: 'per kg' },
                { name: 'Iron (Light)', price: '₹18 - ₹25', unit: 'per kg' },
                { name: 'Aluminum', price: '₹120 - ₹150', unit: 'per kg' },
                { name: 'Copper', price: '₹450 - ₹550', unit: 'per kg' },
                { name: 'Brass', price: '₹350 - ₹420', unit: 'per kg' },
                { name: 'Stainless Steel', price: '₹60 - ₹80', unit: 'per kg' },
                { name: 'Tin', price: '₹80 - ₹100', unit: 'per kg' },
                { name: 'Lead', price: '₹100 - ₹130', unit: 'per kg' }
            ]
        },
        {
            category: 'Paper & Cardboard',
            items: [
                { name: 'Newspaper', price: '₹12 - ₹16', unit: 'per kg' },
                { name: 'Office Paper (White)', price: '₹15 - ₹20', unit: 'per kg' },
                { name: 'Mixed Paper', price: '₹8 - ₹12', unit: 'per kg' },
                { name: 'Cardboard Box', price: '₹10 - ₹14', unit: 'per kg' },
                { name: 'Carton (Beverage)', price: '₹5 - ₹8', unit: 'per kg' }
            ]
        },
        {
            category: 'Plastics',
            items: [
                { name: 'PET Bottles (Clear)', price: '₹25 - ₹35', unit: 'per kg' },
                { name: 'PET Bottles (Colored)', price: '₹15 - ₹22', unit: 'per kg' },
                { name: 'HDPE (Milk Jugs)', price: '₹30 - ₹40', unit: 'per kg' },
                { name: 'PVC Pipes', price: '₹20 - ₹30', unit: 'per kg' },
                { name: 'Mixed Plastic', price: '₹10 - ₹18', unit: 'per kg' },
                { name: 'Plastic Bags', price: '₹8 - ₹12', unit: 'per kg' }
            ]
        },
        {
            category: 'Glass',
            items: [
                { name: 'Clear Glass Bottles', price: '₹2 - ₹3', unit: 'per kg' },
                { name: 'Colored Glass', price: '₹1 - ₹2', unit: 'per kg' },
                { name: 'Broken Glass', price: '₹0.50 - ₹1', unit: 'per kg' }
            ]
        },
        {
            category: 'Electronics (E-Waste)',
            items: [
                { name: 'Old Mobile Phones', price: '₹50 - ₹200', unit: 'per piece' },
                { name: 'Computer CPU', price: '₹150 - ₹400', unit: 'per piece' },
                { name: 'Laptop', price: '₹200 - ₹800', unit: 'per piece' },
                { name: 'CRT Monitor/TV', price: '₹50 - ₹150', unit: 'per piece' },
                { name: 'LED/LCD Monitor', price: '₹100 - ₹300', unit: 'per piece' },
                { name: 'Refrigerator', price: '₹500 - ₹1500', unit: 'per piece' },
                { name: 'AC (Window/Split)', price: '₹800 - ₹2500', unit: 'per piece' },
                { name: 'Washing Machine', price: '₹400 - ₹1200', unit: 'per piece' }
            ]
        },
        {
            category: 'Other Materials',
            items: [
                { name: 'Battery (Car)', price: '₹80 - ₹150', unit: 'per piece' },
                { name: 'Battery (Inverter)', price: '₹40 - ₹80', unit: 'per kg' },
                { name: 'Tyres', price: '₹15 - ₹30', unit: 'per kg' },
                { name: 'Rubber', price: '₹20 - ₹35', unit: 'per kg' },
                { name: 'Wood', price: '₹5 - ₹12', unit: 'per kg' },
                { name: 'Textile/Fabric', price: '₹8 - ₹15', unit: 'per kg' }
            ]
        }
    ];

    return (
        <div className="scrap-prices-page">
            <HomeNavbar />

            <div className="scrap-prices-container">
                <div className="scrap-prices-hero">
                    <h1>Scrap Prices</h1>
                    <p className="scrap-prices-tagline">Know the value of your waste - Transparent pricing for all materials</p>
                </div>

                <div className="prices-info">
                    <p className="prices-note">
                        Prices are indicative and may vary based on market conditions, location, and quality of materials.
                        Contact verified dealers on our platform for exact quotes.
                    </p>
                    <p className="prices-updated">Last updated: April 2025</p>
                </div>

                <div className="prices-grid">
                    {scrapPrices.map((category, index) => (
                        <div key={index} className="price-category-card">
                            <h2>{category.category}</h2>
                            <table className="price-table">
                                <thead>
                                    <tr>
                                        <th>Material</th>
                                        <th>Price Range</th>
                                        <th>Unit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {category.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.name}</td>
                                            <td className="price-value">{item.price}</td>
                                            <td>{item.unit}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>

                <div className="prices-tips">
                    <h2>Tips to Get Better Prices</h2>
                    <div className="tips-grid">
                        <div className="tip-card">
                            <span className="tip-icon">🧹</span>
                            <h3>Clean Your Scrap</h3>
                            <p>Remove dirt, food residue, and non-recyclable parts to get premium rates</p>
                        </div>
                        <div className="tip-card">
                            <span className="tip-icon">📦</span>
                            <h3>Segregate Properly</h3>
                            <p>Separate materials by type - mixed scrap gets lower prices</p>
                        </div>
                        <div className="tip-card">
                            <span className="tip-icon">⚖️</span>
                            <h3>Bulk Selling</h3>
                            <p>Sell in larger quantities to negotiate better per-kg rates</p>
                        </div>
                        <div className="tip-card">
                            <span className="tip-icon">📊</span>
                            <h3>Check Market Rates</h3>
                            <p>Metal prices fluctuate - sell when rates are high</p>
                        </div>
                    </div>
                </div>

                <div className="prices-cta">
                    <h2>Ready to Sell Your Scrap?</h2>
                    <p>Connect with verified scrap dealers in your area and get the best prices</p>
                    <a href="/signup" className="cta-button">Get Started</a>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default ScrapPrices;
