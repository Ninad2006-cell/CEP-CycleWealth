import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
    const [showSellModal, setShowSellModal] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);

    return (
        <footer className="footer">
            <div className="footer-container">

                {/* Left Section */}
                <div className="footer-section">
                    <h2 className="footer-logo">♻️ CycleWealth</h2>
                    <p>Transforming waste into valuable resources for a sustainable future.</p>

                    <h4>Head Office</h4>
                    <p>Mumbai, Maharashtra, India</p>
                </div>

                {/* company  */}
                <div className="footer-section">
                    <h3>Company</h3>

                    <ul>
                        <li><Link to="/about">About Us</Link></li>
                        <li>Careers</li>
                        <li>FAQs</li>
                    </ul>
                </div>

                {/* Services */}
                <div className="footer-section">
                    <h3>Services</h3>

                    <ul>
                        <li onClick={() => setShowSellModal(true)}>Sell Scrap</li>
                        <li onClick={() => setShowBuyModal(true)}>Buy Products</li>
                        <li><Link to="/segregation-guide">Recycling Solutions</Link></li>
                    </ul>
                </div>

                {/* Contact */}
                <div className="footer-section">
                    <h3>Get Started</h3>
                    <Link to="/signup"><button className="footer-btn">Join Now</button></Link>
                    <Link to="/contact"><button className="footer-btn outline">Contact Us</button></Link>
                </div>

            </div>

            {/* Bottom Bar */}
            <div className="footer-bottom">
                <p> 2026 CycleWealth | All Rights Reserved</p>
            </div>

            {/* Sell Scrap Modal */}
            {showSellModal && (
                <div className="footer-modal-overlay" onClick={() => setShowSellModal(false)}>
                    <div className="footer-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowSellModal(false)}>×</button>
                        <h2>How to Sell Scrap on CycleWealth</h2>
                        <div className="modal-content">
                            <div className="step">
                                <span className="step-num">1</span>
                                <p><strong>Create Account</strong> - Sign up as a Consumer and verify your details</p>
                            </div>
                            <div className="step">
                                <span className="step-num">2</span>
                                <p><strong>Segregate Waste</strong> - Separate your scrap by material type (metal, paper, plastic, etc.)</p>
                            </div>
                            <div className="step">
                                <span className="step-num">3</span>
                                <p><strong>Schedule Pickup</strong> - Request a scrap dealer through our platform</p>
                            </div>
                            <div className="step">
                                <span className="step-num">4</span>
                                <p><strong>Get Paid</strong> - Verified dealers will weigh your scrap and pay fair market prices</p>
                            </div>
                        </div>
                        <Link to="/signup" className="modal-btn" onClick={() => setShowSellModal(false)}>Start Selling</Link>
                    </div>
                </div>
            )}

            {/* Buy Products Modal */}
            {showBuyModal && (
                <div className="footer-modal-overlay" onClick={() => setShowBuyModal(false)}>
                    <div className="footer-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowBuyModal(false)}>×</button>
                        <h2>How to Buy Products on CycleWealth</h2>
                        <div className="modal-content">
                            <div className="step">
                                <span className="step-num">1</span>
                                <p><strong>Browse E-Commerce</strong> - Visit our marketplace to explore upcycled products</p>
                            </div>
                            <div className="step">
                                <span className="step-num">2</span>
                                <p><strong>Select Items</strong> - Choose from handcrafted items made by skilled artisans</p>
                            </div>
                            <div className="step">
                                <span className="step-num">3</span>
                                <p><strong>Place Order</strong> - Add to cart and proceed with secure checkout</p>
                            </div>
                            <div className="step">
                                <span className="step-num">4</span>
                                <p><strong>Receive Delivery</strong> - Products delivered to your doorstep with quality assurance</p>
                            </div>
                        </div>
                        <Link to="/ecom" className="modal-btn" onClick={() => setShowBuyModal(false)}>Shop Now</Link>
                    </div>
                </div>
            )}
        </footer>
    );
}

export default Footer