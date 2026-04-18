import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

export default function Profile() {
  const { user, orders, addFunds } = useAuth();
  const [fundAmount, setFundAmount] = useState('');
  const [showFundSuccess, setShowFundSuccess] = useState(false);

  const handleAddFunds = (e) => {
    e.preventDefault();
    const amount = parseFloat(fundAmount);
    if (!amount || amount <= 0) return;
    addFunds(amount);
    setFundAmount('');
    setShowFundSuccess(true);
    setTimeout(() => setShowFundSuccess(false), 2000);
  };

  const userOrders = orders.filter((o) => o.customerId === user?.id).reverse();

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <h1>HELLO, {user?.name?.split(' ')[0]?.toUpperCase() || 'USER'}.</h1>
        <p>YOUR PERSONAL DASHBOARD</p>
      </div>

      <div className="profile-content">
        {/* ── User Info + Wallet Row ── */}
        <div className="profile-top-grid">
          {/* User Card */}
          <div className="profile-card profile-account-card">
            <h2>ACCOUNT</h2>
            <div className="user-detail"><span className="detail-label">NAME</span><span>{user?.name}</span></div>
            <div className="user-detail"><span className="detail-label">EMAIL</span><span>{user?.email}</span></div>
            <div className="user-detail"><span className="detail-label">PHONE</span><span>{user?.phone || 'Not set'}</span></div>
            <div className="user-detail"><span className="detail-label">MEMBER SINCE</span><span>2026</span></div>
          </div>

          {/* Wallet Card */}
          <div className="profile-card wallet-card">
            <h2>WALLET</h2>
            <div className="wallet-balance">
              <span className="balance-symbol">₹</span>
              <span className="balance-amount">{user?.walletBalance?.toLocaleString('en-IN')}</span>
            </div>
            <form className="fund-form" onSubmit={handleAddFunds}>
              <input
                className="brutal-input fund-input"
                type="number"
                min="1"
                placeholder="Amount (₹)"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
              />
              <button type="submit" className="brutal-btn black fund-btn">+ ADD</button>
            </form>
            {showFundSuccess && <div className="fund-success">✓ Funds added!</div>}
          </div>
        </div>

        {/* ── Order History ── */}
        <div className="profile-card orders-card">
          <h2>ORDER HISTORY</h2>

          {userOrders.length === 0 ? (
            <div className="no-orders">
              <p>No orders yet. Your first ACID-compliant meal awaits!</p>
              <Link to="/menu" className="brutal-btn orange">ORDER NOW →</Link>
            </div>
          ) : (
            <div className="orders-list">
              {userOrders.map((order) => (
                <div key={order.id} className="order-row">
                  <div className="order-row-left">
                    <div className="order-id">#{order.id}</div>
                    <div className="order-items-summary">
                      {order.items.map((item) => (
                        <span key={item.id} className="order-item-chip">
                          {item.image ? '🍽️' : (item.emoji || '🍽️')} {item.name} ×{item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="order-row-right">
                    <span className={`status-badge status-${order.status.toLowerCase().replace(/\s/g, '-')}`}>
                      {order.status}
                    </span>
                    <span className="order-total">₹{order.total.toLocaleString('en-IN')}</span>
                    <span className="order-date">{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                    {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                      <Link to="/track-order" className="brutal-btn black" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>
                        TRACK
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
