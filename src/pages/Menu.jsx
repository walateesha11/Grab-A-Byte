import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MENU_ITEMS } from '../data';
import Marquee from '../components/Marquee';
import './Menu.css';

export default function Menu({ addToCart }) {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [addedIds, setAddedIds] = useState(new Set());

  const handleAdd = (item) => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: { pathname: '/menu' } } });
      return;
    }
    addToCart(item);
    setAddedIds((prev) => new Set([...prev, item.id]));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 700);
  };

  const cardColors = [
    'var(--pastel-yellow)', 'var(--kelly-green)', 'var(--hot-pink)',
    'var(--bright-orange)', 'var(--cream)', 'var(--pastel-yellow)',
    'var(--kelly-green)', 'var(--hot-pink)', 'var(--bright-orange)',
    'var(--cream)', 'var(--pastel-yellow)', 'var(--kelly-green)',
  ];

  return (
    <div className="menu-page">
      <div className="menu-hero">
        <h1 id="menu-title">THE MENU</h1>
        <p>EVERY ITEM. EVERY BYTE. EVERY TIME.</p>
      </div>

      <Marquee />

      <div className="menu-grid-container">
        <div className="menu-grid">
          {MENU_ITEMS.map((item, i) => (
            <div
              key={item.id}
              className={`menu-card ${addedIds.has(item.id) ? 'added' : ''}`}
              style={{ backgroundColor: cardColors[i % cardColors.length] }}
              id={`menu-item-${item.id}`}
            >
              {/* Image or Emoji */}
              <div className="card-img-wrap">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={`${item.name} illustration`}
                    className="card-img"
                    width="180"
                    height="180"
                    loading="lazy"
                  />
                ) : (
                  <span className="card-emoji">{item.emoji}</span>
                )}
              </div>

              {/* Info */}
              <div className="card-info">
                <h3>{item.name}</h3>
                <p className="card-desc">{item.description}</p>

                <div className="card-bottom">
                  <span className="card-price">₹{item.price}</span>
                  <button
                    className={`brutal-btn black card-btn ${addedIds.has(item.id) ? 'btn-added' : ''}`}
                    onClick={() => handleAdd(item)}
                    id={`add-btn-${item.id}`}
                  >
                    {addedIds.has(item.id) ? '✓ ADDED' : '+ ADD'}
                  </button>
                </div>

                <div className="stock-tag">
                  <span className="stock-dot" />
                  IN STOCK: {item.stock}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
