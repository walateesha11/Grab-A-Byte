import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ORDER_STATUSES } from '../data';
import './TrackOrder.css';

export default function TrackOrder() {
  const { orders, updateOrderStatus } = useAuth();
  const [activeOrder, setActiveOrder] = useState(null);

  // Find the latest non-delivered order
  useEffect(() => {
    const active = [...orders]
      .reverse()
      .find((o) => o.status !== 'Delivered' && o.status !== 'Cancelled');
    setActiveOrder(active || orders[orders.length - 1] || null);
  }, [orders]);

  // Auto-progress simulation
  useEffect(() => {
    if (!activeOrder || activeOrder.status === 'Delivered') return;

    const currentIdx = ORDER_STATUSES.indexOf(activeOrder.status);
    if (currentIdx < 0 || currentIdx >= ORDER_STATUSES.length - 1) return;

    const timer = setTimeout(() => {
      updateOrderStatus(activeOrder.id, ORDER_STATUSES[currentIdx + 1]);
    }, 5000); // Auto-advance every 5 seconds

    return () => clearTimeout(timer);
  }, [activeOrder?.status]);

  if (!activeOrder) {
    return (
      <div className="track-page">
        <div className="track-hero"><h1>TRACK ORDER</h1></div>
        <div className="track-empty">
          <h2>NO ACTIVE ORDERS</h2>
          <p>Place an order to start tracking!</p>
          <Link to="/menu" className="brutal-btn green">ORDER FOOD →</Link>
        </div>
      </div>
    );
  }

  const currentIdx = ORDER_STATUSES.indexOf(activeOrder.status);

  return (
    <div className="track-page">
      <div className="track-hero">
        <h1>TRACKING ORDER #{activeOrder.id}</h1>
        <p>DRIVER: {activeOrder.driverName?.toUpperCase() || 'ASSIGNING...'}</p>
      </div>

      <div className="track-content">
        {/* ── Progress Stepper ── */}
        <div className="track-stepper">
          {ORDER_STATUSES.map((status, i) => (
            <div key={status} className={`step ${i <= currentIdx ? 'complete' : ''} ${i === currentIdx ? 'current' : ''}`}>
              <div className="step-dot">
                {i < currentIdx ? '✓' : i === currentIdx ? '●' : '○'}
              </div>
              <div className="step-label">{status.toUpperCase()}</div>
              {i < ORDER_STATUSES.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        {/* SQL Visualization */}
        <div className="track-sql-box">
          <h3>⚙ LIVE SQL</h3>
          <code>
            UPDATE Orders SET Status = '{activeOrder.status}' WHERE OrderID = {activeOrder.id};
          </code>
        </div>

        {/* ── Order Details ── */}
        <div className="track-details">
          <h3>ORDER ITEMS</h3>
          <div className="track-items">
            {activeOrder.items.map((item) => (
              <div key={item.id} className="track-item">
                <span className="track-item-icon">
                  {item.image ? '🍽️' : (item.emoji || '🍽️')}
                </span>
                <span className="track-item-name">{item.name}</span>
                <span className="track-item-qty">×{item.quantity}</span>
                <span className="track-item-price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
          <div className="track-total">
            <span>TOTAL</span>
            <span>₹{activeOrder.total.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {activeOrder.status === 'Delivered' && (
          <div className="delivered-box">
            <h2>🎉 DELIVERED!</h2>
            <p>Your order has been delivered successfully.</p>
            <Link to="/menu" className="brutal-btn green">ORDER AGAIN →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
