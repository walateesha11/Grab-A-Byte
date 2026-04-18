import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar({ cartCount }) {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  // ── Mouse Proximity Visibility Logic ──
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (mobileOpen) {
        setVisible(true);
        return;
      }
      
      const inTopMiddle = e.clientY <= 90 && e.clientX >= window.innerWidth * 0.25 && e.clientX <= window.innerWidth * 0.75;
      
      setVisible(prevVisible => {
        if (inTopMiddle) return true;
        if (prevVisible) {
          // Add a larger buffer "keep alive" zone when the menu is already visible
          // allowing the user to move to the edges or bottom of the navbar without it vanishing.
          const isHoveringNav = e.clientY <= 150 && e.clientX >= window.innerWidth * 0.15 && e.clientX <= window.innerWidth * 0.85;
          return isHoveringNav;
        }
        return false;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const closeMenu = () => setMobileOpen(false);

  return (
    <nav 
      className={`navbar ${visible ? 'nav-visible' : 'nav-hidden'} ${mobileOpen ? 'nav-expanded' : ''}`} 
      id="main-navbar"
    >
      <Link to="/" className="nav-brand" onClick={closeMenu}>
        GRAB<span className="brand-accent">A</span>BYTE
      </Link>

      {/* Mobile hamburger */}
      <button
        className="mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      <div className={`nav-links ${mobileOpen ? 'open' : ''}`}>
        <Link to="/" className="nav-link" onClick={closeMenu}>HOME</Link>
        <Link to="/menu" className="nav-link" onClick={closeMenu}>MENU</Link>
        <Link to="/about" className="nav-link" onClick={closeMenu}>ABOUT</Link>
        <Link to="/schema" className="nav-link" onClick={closeMenu}>SCHEMA</Link>
        
        {isAdmin && (
          <Link to="/dashboard" className="nav-link dash-link" onClick={closeMenu}>DASHBOARD</Link>
        )}

        {isLoggedIn ? (
          <>
            <Link to="/checkout" className="nav-link cart-link" onClick={closeMenu}>
              CART
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </Link>
            <Link to="/profile" className="nav-link profile-link" onClick={closeMenu}>
              {user?.name?.split(' ')[0]?.toUpperCase() || 'PROFILE'}
            </Link>
            <button className="nav-link logout-link" onClick={handleLogout}>
              LOGOUT
            </button>
          </>
        ) : (
          <Link to="/login" className="nav-link login-link auth-btn" onClick={closeMenu}>
            LOGIN / SIGNUP
          </Link>
        )}
      </div>
    </nav>
  );
}
