import React from "react";
import { useNavigate } from "react-router-dom";
import "./Hero.css";

function Hero() {
  const navigate = useNavigate();

  return (
    <div className="hero">
      {/* Eco Doodle Background Image */}
      <div className="hero-doodle-bg"></div>

      {/* Dark Overlay */}
      <div className="hero-overlay"></div>

      {/* Content */}
      <div className="hero-content">
        <h1>Sell Scrap & E-Waste<br />in Your City</h1>
        <p className="hero-subtitle">
          Connect with verified scrap dealers, recycle materials,<br />
          and transform waste into wealth
        </p>

        <div className="hero-buttons">
          <button className="hero-btn-primary" onClick={() => navigate('/signup')}>
            ♻️ Sell Your Scrap
          </button>
          <button className="hero-btn-secondary" onClick={() => navigate('/ecom')}>
            🛒 Browse Products
          </button>
        </div>

        <p className="hero-trust">
          🌱 Eco-friendly Recycling Platform
        </p>

        {/* Stats */}
        <div className="hero-stats">
          <div className="stat-item">
            <h2>50,000+</h2>
            <p>kg Scrap Recycled</p>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <h2>1,000+</h2>
            <p>Active Users</p>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <h2>500+</h2>
            <p>Eco Products Sold</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;