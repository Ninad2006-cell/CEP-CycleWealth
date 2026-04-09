import React from "react";
import { useNavigate } from "react-router-dom";
import "./Hero.css";

function Hero() {
  const navigate = useNavigate();

  return (
    <div className="hero">
      {/* Eco Doodle Background Pattern */}
      <div className="hero-doodle-bg">
        <svg className="doodle-svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          {/* Recycling Arrows */}
          <g className="doodle-item" style={{transform: 'translate(100px, 100px)'}}>
            <path d="M30 10 L40 30 L25 30 L35 50 L20 50" fill="none" stroke="#2ecc71" strokeWidth="2" opacity="0.6"/>
            <path d="M50 20 L60 10 L55 25" fill="#2ecc71" opacity="0.6"/>
          </g>
          <g className="doodle-item" style={{transform: 'translate(900px, 150px) rotate(45deg)'}}>
            <path d="M25 15 A15 15 0 1 1 25 45" fill="none" stroke="#27ae60" strokeWidth="2" opacity="0.5"/>
            <path d="M20 40 L25 50 L30 40" fill="#27ae60" opacity="0.5"/>
          </g>
          
          {/* Leaf/Plant */}
          <g className="doodle-item" style={{transform: 'translate(200px, 200px)'}}>
            <path d="M20 40 Q10 20 20 10 Q30 20 20 40" fill="none" stroke="#2ecc71" strokeWidth="2" opacity="0.4"/>
            <path d="M20 40 L20 50" stroke="#2ecc71" strokeWidth="2" opacity="0.4"/>
          </g>
          <g className="doodle-item" style={{transform: 'translate(800px, 300px) scale(1.2)'}}>
            <circle cx="25" cy="25" r="15" fill="none" stroke="#27ae60" strokeWidth="2" opacity="0.3"/>
            <path d="M25 15 L25 35 M15 25 L35 25" stroke="#27ae60" strokeWidth="2" opacity="0.3"/>
          </g>
          
          {/* Bicycle */}
          <g className="doodle-item" style={{transform: 'translate(300px, 400px) rotate(-10deg)'}}>
            <circle cx="15" cy="35" r="12" fill="none" stroke="#2ecc71" strokeWidth="2" opacity="0.5"/>
            <circle cx="55" cy="35" r="12" fill="none" stroke="#2ecc71" strokeWidth="2" opacity="0.5"/>
            <path d="M15 35 L30 20 L45 35 L30 35 Z" fill="none" stroke="#2ecc71" strokeWidth="2" opacity="0.5"/>
            <path d="M30 20 L35 15" stroke="#2ecc71" strokeWidth="2" opacity="0.5"/>
          </g>
          
          {/* Tree */}
          <g className="doodle-item" style={{transform: 'translate(600px, 100px)'}}>
            <path d="M25 50 L25 35" stroke="#27ae60" strokeWidth="3" opacity="0.4"/>
            <circle cx="25" cy="25" r="15" fill="none" stroke="#2ecc71" strokeWidth="2" opacity="0.4"/>
            <circle cx="18" cy="30" r="10" fill="none" stroke="#2ecc71" strokeWidth="1.5" opacity="0.3"/>
            <circle cx="32" cy="30" r="10" fill="none" stroke="#2ecc71" strokeWidth="1.5" opacity="0.3"/>
          </g>
          
          {/* House with leaf */}
          <g className="doodle-item" style={{transform: 'translate(1000px, 400px) rotate(15deg)'}}>
            <path d="M20 40 L20 25 L35 15 L50 25 L50 40 Z" fill="none" stroke="#2ecc71" strokeWidth="2" opacity="0.5"/>
            <path d="M30 40 L30 30 L40 30 L40 40" fill="none" stroke="#2ecc71" strokeWidth="2" opacity="0.5"/>
            <circle cx="45" cy="20" r="5" fill="none" stroke="#27ae60" strokeWidth="1.5" opacity="0.6"/>
          </g>
          
          {/* Sun with solar */}
          <g className="doodle-item" style={{transform: 'translate(150px, 500px)'}}>
            <circle cx="25" cy="25" r="10" fill="none" stroke="#2ecc71" strokeWidth="2" opacity="0.5"/>
            <path d="M25 5 L25 12 M25 38 L25 45 M5 25 L12 25 M38 25 L45 25 M12 12 L17 17 M33 33 L38 38 M12 38 L17 33 M33 17 L38 12" stroke="#2ecc71" strokeWidth="2" opacity="0.5"/>
          </g>
          
          {/* Water drop */}
          <g className="doodle-item" style={{transform: 'translate(700px, 500px)'}}>
            <path d="M25 10 Q35 25 25 40 Q15 25 25 10" fill="none" stroke="#27ae60" strokeWidth="2" opacity="0.4"/>
          </g>
          
          {/* Earth/Globe */}
          <g className="doodle-item" style={{transform: 'translate(400px, 150px)'}}>
            <circle cx="25" cy="25" r="18" fill="none" stroke="#2ecc71" strokeWidth="2" opacity="0.4"/>
            <path d="M10 25 Q25 15 40 25" fill="none" stroke="#2ecc71" strokeWidth="1.5" opacity="0.4"/>
            <path d="M10 25 Q25 35 40 25" fill="none" stroke="#2ecc71" strokeWidth="1.5" opacity="0.4"/>
            <path d="M25 7 L25 43" stroke="#2ecc71" strokeWidth="1.5" opacity="0.4"/>
          </g>
          
          {/* Trash bin */}
          <g className="doodle-item" style={{transform: 'translate(1100px, 250px) rotate(-5deg)'}}>
            <path d="M15 20 L15 45 L35 45 L35 20" fill="none" stroke="#27ae60" strokeWidth="2" opacity="0.5"/>
            <path d="M12 20 L38 20 L35 15 L15 15 Z" fill="none" stroke="#27ae60" strokeWidth="2" opacity="0.5"/>
            <path d="M20 28 L20 38 M25 28 L25 38 M30 28 L30 38" stroke="#2ecc71" strokeWidth="2" opacity="0.5"/>
          </g>
          
          {/* Bottle */}
          <g className="doodle-item" style={{transform: 'translate(50px, 300px) rotate(10deg)'}}>
            <path d="M20 10 L20 5 L30 5 L30 10" fill="none" stroke="#2ecc71" strokeWidth="2" opacity="0.5"/>
            <path d="M17 10 L17 45 Q25 50 33 45 L33 10" fill="none" stroke="#2ecc71" strokeWidth="2" opacity="0.5"/>
          </g>
          
          {/* Light bulb */}
          <g className="doodle-item" style={{transform: 'translate(500px, 350px)'}}>
            <path d="M20 15 Q10 25 20 35 Q30 25 20 15" fill="none" stroke="#2ecc71" strokeWidth="2" opacity="0.5"/>
            <path d="M17 35 L17 40 L23 40 L23 35" fill="none" stroke="#2ecc71" strokeWidth="2" opacity="0.5"/>
            <path d="M18 40 L18 42 L22 42 L22 40" fill="none" stroke="#2ecc71" strokeWidth="2" opacity="0.5"/>
          </g>
          
          {/* Paper/Document with recycle */}
          <g className="doodle-item" style={{transform: 'translate(850px, 50px)'}}>
            <rect x="15" y="10" width="20" height="30" fill="none" stroke="#27ae60" strokeWidth="2" opacity="0.4"/>
            <path d="M20 20 L30 20 M20 25 L30 25 M20 30 L25 30" stroke="#2ecc71" strokeWidth="1.5" opacity="0.4"/>
            <path d="M22 5 L20 10 L24 10" fill="#2ecc71" opacity="0.5"/>
          </g>
          
          {/* Additional scattered elements */}
          <g className="doodle-item" style={{transform: 'translate(250px, 600px)'}}>
            <path d="M10 30 Q20 10 30 30 Q40 50 30 70" fill="none" stroke="#2ecc71" strokeWidth="2" opacity="0.3"/>
          </g>
          
          <g className="doodle-item" style={{transform: 'translate(550px, 600px) rotate(30deg)'}}>
            <rect x="20" y="20" width="15" height="15" fill="none" stroke="#27ae60" strokeWidth="2" opacity="0.4" transform="rotate(45 27.5 27.5)"/>
          </g>
          
          <g className="doodle-item" style={{transform: 'translate(950px, 600px)'}}>
            <path d="M15 25 L25 15 L35 25 L25 35 Z" fill="none" stroke="#2ecc71" strokeWidth="2" opacity="0.4"/>
          </g>
        </svg>
      </div>
      
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
