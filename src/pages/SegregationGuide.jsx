import React from 'react';
import HomeNavbar from '../components/HomeNavbar';
import Footer from '../components/Footer';
import './SegregationGuide.css';

function SegregationGuide() {
    const segregationSteps = [
        {
            step: 1,
            title: 'Set Up Separate Bins',
            description: 'Have at least 3 different bins or bags for: Wet Waste (Green), Dry Waste (Blue), and Hazardous Waste (Red).',
            icon: '🗑️'
        },
        {
            step: 2,
            title: 'Wet Waste - Green Bin',
            description: 'Collect all biodegradable waste: food scraps, vegetable peels, fruit waste, tea leaves, coffee grounds, garden waste.',
            icon: '🥬'
        },
        {
            step: 3,
            title: 'Dry Waste - Blue Bin',
            description: 'Collect recyclable materials: paper, cardboard, plastic bottles, metal cans, glass containers, packaging materials.',
            icon: '📦'
        },
        {
            step: 4,
            title: 'Hazardous Waste - Red Bin',
            description: 'Collect harmful materials: batteries, e-waste, medical waste, sanitary waste, broken glass, razors, light bulbs.',
            icon: '⚠️'
        },
        {
            step: 5,
            title: 'Further Segregate Dry Waste',
            description: 'Separate dry waste into: Paper & Cardboard, Plastics (by type), Metals, Glass, and Electronics.',
            icon: '🔄'
        },
        {
            step: 6,
            title: 'Clean Before Storing',
            description: 'Rinse food containers, remove labels when possible, and ensure items are dry to prevent odor and pests.',
            icon: '💧'
        }
    ];

    const materialGuidelines = [
        {
            category: 'Paper & Cardboard',
            color: '#3498db',
            items: [
                { name: 'Newspapers', instruction: 'Keep dry, remove plastic wrappers' },
                { name: 'Office Paper', instruction: 'Remove staples and clips' },
                { name: 'Cardboard Boxes', instruction: 'Flatten to save space' },
                { name: 'Paper Bags', instruction: 'Remove handles if plastic' },
                { name: 'Books', instruction: 'Remove hard covers' }
            ]
        },
        {
            category: 'Plastics',
            color: '#e74c3c',
            items: [
                { name: 'PET Bottles', instruction: 'Crush bottles, keep caps separate' },
                { name: 'HDPE Containers', instruction: 'Rinse thoroughly, remove labels' },
                { name: 'Plastic Bags', instruction: 'Clean and bundle together' },
                { name: 'Food Containers', instruction: 'Wash to remove food residue' },
                { name: 'PVC Pipes', instruction: 'Remove fittings and joints' }
            ]
        },
        {
            category: 'Metals',
            color: '#f39c12',
            items: [
                { name: 'Aluminum Cans', instruction: 'Rinse, crush to save space' },
                { name: 'Steel/Tin Cans', instruction: 'Remove labels, rinse' },
                { name: 'Copper Wire', instruction: 'Remove plastic coating' },
                { name: 'Brass Items', instruction: 'Keep separate for better price' },
                { name: 'Iron Scrap', instruction: 'Separate heavy and light' }
            ]
        },
        {
            category: 'Glass',
            color: '#2ecc71',
            items: [
                { name: 'Glass Bottles', instruction: 'Rinse, remove caps and lids' },
                { name: 'Broken Glass', instruction: 'Wrap in paper, label as sharp' },
                { name: 'Mirrors', instruction: 'Keep separate from bottle glass' },
                { name: 'Window Glass', instruction: 'Remove frames completely' },
                { name: 'Ceramics', instruction: 'Not recyclable - dispose separately' }
            ]
        },
        {
            category: 'E-Waste',
            color: '#9b59b6',
            items: [
                { name: 'Mobile Phones', instruction: 'Remove batteries if possible' },
                { name: 'Laptops/Computers', instruction: 'Keep intact, do not dismantle' },
                { name: 'Cables/Wires', instruction: 'Bundle separately' },
                { name: 'Batteries', instruction: 'Store in cool, dry place' },
                { name: 'Appliances', instruction: 'Keep whole, mention working condition' }
            ]
        }
    ];

    const commonMistakes = [
        {
            mistake: 'Mixing wet and dry waste',
            solution: 'Always keep food waste separate from recyclables. Contaminated recyclables lose value.'
        },
        {
            mistake: 'Leaving food in containers',
            solution: 'Rinse all containers before storing. Food residue attracts pests and makes recycling harder.'
        },
        {
            mistake: 'Including soiled paper',
            solution: 'Greasy pizza boxes, used tissues, and food-soiled paper go in wet/organic waste, not recycling.'
        },
        {
            mistake: 'Throwing broken glass in dry waste',
            solution: 'Wrap broken glass properly and label it. It can injure waste handlers.'
        },
        {
            mistake: 'Mixing different plastics',
            solution: 'PET, HDPE, and other plastics have different values. Separate by type for better pricing.'
        },
        {
            mistake: 'Including non-recyclables',
            solution: 'Toothpaste tubes, chip packets, and styrofoam are not recyclable. Check before tossing.'
        }
    ];

    return (
        <div className="segregation-guide-page">
            <HomeNavbar />

            <div className="segregation-container">
                <div className="segregation-hero">
                    <h1>Waste Segregation Guide</h1>
                    <p className="segregation-tagline">Learn to segregate waste properly - Turn trash into cash while saving the planet</p>
                </div>

                <div className="segregation-intro">
                    <p>
                        Proper waste segregation is the first step toward effective recycling. 
                        When you separate waste at the source, you make recycling more efficient, 
                        reduce landfill burden, and get better prices for your scrap materials.
                    </p>
                </div>

                <div className="steps-section">
                    <h2>6 Simple Steps to Segregate Waste</h2>
                    <div className="steps-timeline">
                        {segregationSteps.map((step, index) => (
                            <div key={index} className="step-card">
                                <div className="step-number">{step.step}</div>
                                <div className="step-icon">{step.icon}</div>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="materials-section">
                    <h2>Material-Specific Guidelines</h2>
                    <div className="materials-grid">
                        {materialGuidelines.map((material, index) => (
                            <div key={index} className="material-card" style={{ borderColor: material.color }}>
                                <h3 style={{ color: material.color }}>{material.category}</h3>
                                <ul className="guidelines-list">
                                    {material.items.map((item, idx) => (
                                        <li key={idx}>
                                            <strong>{item.name}</strong>
                                            <span>{item.instruction}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mistakes-section">
                    <h2>Common Mistakes to Avoid</h2>
                    <div className="mistakes-grid">
                        {commonMistakes.map((item, index) => (
                            <div key={index} className="mistake-card">
                                <div className="mistake-header">
                                    <span className="mistake-icon">❌</span>
                                    <h3>{item.mistake}</h3>
                                </div>
                                <div className="solution">
                                    <span className="solution-icon">✅</span>
                                    <p>{item.solution}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="benefits-section">
                    <h2>Benefits of Proper Segregation</h2>
                    <div className="benefits-grid">
                        <div className="benefit-card">
                            <span className="benefit-icon">💰</span>
                            <h3>Better Prices</h3>
                            <p>Clean, segregated materials fetch 20-40% higher rates from scrap dealers</p>
                        </div>
                        <div className="benefit-card">
                            <span className="benefit-icon">🌱</span>
                            <h3>Environmental Impact</h3>
                            <p>Reduces landfill waste and lowers carbon footprint from recycling</p>
                        </div>
                        <div className="benefit-card">
                            <span className="benefit-icon">🏠</span>
                            <h3>Cleaner Home</h3>
                            <p>Proper segregation prevents odor, pests, and keeps your space hygienic</p>
                        </div>
                        <div className="benefit-card">
                            <span className="benefit-icon">👷</span>
                            <h3>Worker Safety</h3>
                            <p>Segregated waste is safer for waste handlers and recyclers</p>
                        </div>
                    </div>
                </div>

                <div className="segregation-cta">
                    <h2>Ready to Start Segregating?</h2>
                    <p>Join CycleWealth and turn your segregated waste into wealth</p>
                    <a href="/scrap-prices" className="cta-button secondary">Check Scrap Prices</a>
                    <a href="/signup" className="cta-button">Get Started</a>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default SegregationGuide;
