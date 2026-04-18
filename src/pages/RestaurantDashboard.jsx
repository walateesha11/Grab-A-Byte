import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ORDER_STATUSES } from '../data';
import './RestaurantDashboard.css';

export default function RestaurantDashboard() {
  const { 
    orders, 
    allUsers, 
    updateOrderStatus, 
    cancelOrder, 
    deleteOrder, 
    deleteUser 
  } = useAuth();

  const [activeTab, setActiveTab] = useState('OVERVIEW');

  const allOrdersReversed = [...orders].reverse();
  const activeOrders = allOrdersReversed.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const completedOrders = allOrdersReversed.filter((o) => o.status === 'Delivered' || o.status === 'Cancelled');
  const totalRevenue = orders.reduce((sum, o) => o.status === 'Delivered' ? sum + o.total : sum, 0);

  const getNextStatus = (currentStatus) => {
    if (currentStatus === 'Cancelled') return null;
    const idx = ORDER_STATUSES.indexOf(currentStatus);
    if (idx < 0 || idx >= ORDER_STATUSES.length - 1) return null;
    return ORDER_STATUSES[idx + 1];
  };

  return (
    <div className="dash-container">
      {/* ── Left Sidebar ── */}
      <aside className="dash-sidebar">
        <div className="sidebar-brand">
          <span className="brand-dot"></span>
          ADMIN OPS
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'OVERVIEW' ? 'active' : ''}`}
            onClick={() => setActiveTab('OVERVIEW')}
          >
            📊 OVERVIEW
          </button>
          <button 
            className={`nav-item ${activeTab === 'ORDERS' ? 'active' : ''}`}
            onClick={() => setActiveTab('ORDERS')}
          >
            🍔 ACTIVE ORDERS
          </button>
          <button 
            className={`nav-item ${activeTab === 'HISTORY' ? 'active' : ''}`}
            onClick={() => setActiveTab('HISTORY')}
          >
            🕒 HISTORY
          </button>
          <button 
            className={`nav-item ${activeTab === 'USERS' ? 'active' : ''}`}
            onClick={() => setActiveTab('USERS')}
          >
            👥 USER DATABASE
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="connection-status">
            <span className="pulse-green"></span>
            MYSQL CONNECTED
          </div>
        </div>
      </aside>

      {/* ── Right Workspace ── */}
      <main className="dash-workspace">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'OVERVIEW' && (
          <div className="workspace-tab fade-in">
            <header className="tab-header">
              <h1>DASHBOARD OVERVIEW</h1>
              <p>COMMAND CENTER: SYSTEM-WIDE METRICS AND LIVE FEED.</p>
            </header>
            
            <div className="dash-stats">
              <div className="dash-stat color-orange">
                <span className="dash-stat-label">TOTAL ORDERS</span>
                <span className="dash-stat-num">{orders.length}</span>
              </div>
              <div className="dash-stat color-pink">
                <span className="dash-stat-label">ACTIVE NOW</span>
                <span className="dash-stat-num">{activeOrders.length}</span>
              </div>
              <div className="dash-stat color-green">
                <span className="dash-stat-label">CUSTOMERS</span>
                <span className="dash-stat-num">{allUsers.length}</span>
              </div>
              <div className="dash-stat color-yellow">
                <span className="dash-stat-label">GROSS REVENUE</span>
                <span className="dash-stat-num">₹{totalRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>

          </div>
        )}

        {/* ACTIVE ORDERS TAB */}
        {activeTab === 'ORDERS' && (
          <div className="workspace-tab fade-in">
            <header className="tab-header">
              <div className="header-left">
                <h1>ACTIVE ORDERS</h1>
              </div>
            </header>

            {activeOrders.length === 0 ? (
              <div className="dash-empty">NO ACTIVE ORDERS AT THE MOMENT.</div>
            ) : (
              <div className="dash-orders-grid">
                {activeOrders.map((order) => {
                  const nextStatus = getNextStatus(order.status);
                  return (
                    <div key={order.id} className="dash-card order-card">
                      <div className="card-top">
                        <span className="order-id">#ID_{order.id}</span>
                        <span className={`status-pill status-${order.status.toLowerCase().replace(/\s/g, '-')}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="card-middle">
                        <div className="order-items-list">
                          {order.items.map((it, idx) => (
                            <span key={idx} className="item-chip">{it.name} x{it.quantity}</span>
                          ))}
                        </div>
                        <div className="order-amount">₹{order.total}</div>
                      </div>
                      <div className="card-ops">
                        {nextStatus && (
                          <button 
                            className="op-btn next-btn" 
                            onClick={() => updateOrderStatus(order.id, nextStatus)}
                          >
                            ADVANCE TO {nextStatus.toUpperCase()}
                          </button>
                        )}
                        <div className="op-danger-row">
                          <button 
                            className="op-btn cancel-btn" 
                            onClick={() => cancelOrder(order.id)}
                          >
                            CANCEL
                          </button>
                          <button 
                            className="op-btn delete-btn" 
                            onClick={() => deleteOrder(order.id)}
                          >
                            DELETE
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'HISTORY' && (
          <div className="workspace-tab fade-in">
            <header className="tab-header">
              <h1>ORDER HISTORY</h1>
              <p>ARCHIVE OF ALL COMPLETED AND TERMINATED TRANSACTIONS.</p>
            </header>

            <div className="history-table-container">
              <table className="brutal-table">
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>STATUS</th>
                    <th>TOTAL</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {completedOrders.map(o => (
                    <tr key={o.id}>
                      <td className="font-mono">#ID_{o.id}</td>
                      <td>
                        <span className={`status-pill status-${o.status.toLowerCase()}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="font-mono">₹{o.total}</td>
                      <td>
                        <button className="icon-btn-delete" onClick={() => deleteOrder(o.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'USERS' && (
          <div className="workspace-tab fade-in">
            <header className="tab-header">
              <h1>USER DATABASE</h1>
            </header>

            <div className="users-list-grid">
              {allUsers.map((u) => (
                <div key={u.id} className="dash-card user-admin-card">
                  <div className="user-info-box">
                    <div className="user-avatar">{u.name.charAt(0)}</div>
                    <div className="user-meta">
                      <strong>{u.name}</strong>
                      <small>{u.email}</small>
                    </div>
                  </div>
                  <div className="user-wallet-info">
                    <span>BALANCE</span>
                    <strong>₹{u.walletBalance}</strong>
                  </div>
                  {u.id !== 99 && (
                    <button 
                      className="brutal-btn pink sm-btn" 
                      onClick={() => {
                        if (window.confirm(`Delete user ${u.name}?`)) {
                          deleteUser(u.id);
                        }
                      }}
                    >
                      DELETE USER
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

