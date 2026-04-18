import React from 'react';
import { Link } from 'react-router-dom';
import Marquee from '../components/Marquee';
import './About.css';

export default function About() {
  return (
    <div className="about-page">
      <div className="about-hero">
        <h1>ABOUT<br />GRAB<span style={{ color: 'var(--hot-pink)' }}>A</span>BYTE</h1>
        <p>A FOOD DELIVERY DBMS THAT TAKES DATA INTEGRITY SERIOUSLY.</p>
      </div>

      <Marquee />

      <div className="about-content">
        {/* Our Story */}
        <section className="about-section story-section">
          <div className="about-section-inner">
            <h2>OUR STORY</h2>
            <div className="story-grid">
              <div className="story-text">
                <p>
                  GrabAByte was born as a <strong>DBMS microproject</strong> that proves food delivery
                  isn't just about delicious meals — it's about <strong>data integrity</strong>.
                </p>
                <p>
                  Every order you place triggers a real <strong>MySQL stored procedure</strong> that
                  demonstrates ACID compliance, row-level locking, and concurrency control. We don't
                  just deliver food. We deliver <strong>transactional safety</strong>.
                </p>
              </div>
              <div className="story-stats">
                <div className="stat-card" style={{ background: 'var(--kelly-green)' }}>
                  <span className="stat-num">12+</span>
                  <span className="stat-label">MENU ITEMS</span>
                </div>
                <div className="stat-card" style={{ background: 'var(--hot-pink)' }}>
                  <span className="stat-num">6</span>
                  <span className="stat-label">DB TABLES</span>
                </div>
                <div className="stat-card" style={{ background: 'var(--bright-orange)' }}>
                  <span className="stat-num">100%</span>
                  <span className="stat-label">ACID SAFE</span>
                </div>
                <div className="stat-card" style={{ background: 'var(--pastel-yellow)', color: 'var(--black)' }}>
                  <span className="stat-num">0</span>
                  <span className="stat-label">RACE CONDITIONS</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DBMS Architecture */}
        <section className="about-section dbms-section">
          <div className="about-section-inner">
            <h2 style={{ color: 'var(--pastel-yellow)' }}>DBMS ARCHITECTURE</h2>
            <div className="dbms-grid">
              <div className="dbms-card">
                <div className="dbms-icon">🏗️</div>
                <h3>InnoDB Engine</h3>
                <p>All tables use InnoDB for ACID transactions, foreign key support, and row-level locking.</p>
              </div>
              <div className="dbms-card">
                <div className="dbms-icon">🔒</div>
                <h3>SELECT ... FOR UPDATE</h3>
                <p>Exclusive row-level locks prevent race conditions when multiple users order the same item.</p>
              </div>
              <div className="dbms-card">
                <div className="dbms-icon">⚡</div>
                <h3>Stored Procedures</h3>
                <p>PlaceSecureOrder() handles order validation, payment, and driver assignment atomically.</p>
              </div>
              <div className="dbms-card">
                <div className="dbms-icon">🛡️</div>
                <h3>Referential Integrity</h3>
                <p>Foreign keys with ON DELETE CASCADE maintain data consistency across 6 related tables.</p>
              </div>
              <div className="dbms-card">
                <div className="dbms-icon">🔐</div>
                <h3>Password Hashing</h3>
                <p>User passwords stored as bcrypt hashes — never in plain text. PasswordHash column in Customers table.</p>
              </div>
              <div className="dbms-card">
                <div className="dbms-icon">📊</div>
                <h3>JOIN Queries</h3>
                <p>Order history uses multi-table JOINs across Orders, OrderDetails, MenuItems, and Restaurants.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Team / Tech Stack */}
        <section className="about-section tech-section">
          <div className="about-section-inner">
            <h2>TECH STACK</h2>
            <div className="tech-pills">
              <span className="tech-pill" style={{ background: 'var(--kelly-green)' }}>MySQL 8.0</span>
              <span className="tech-pill" style={{ background: 'var(--hot-pink)' }}>React 19</span>
              <span className="tech-pill" style={{ background: 'var(--bright-orange)' }}>Vite</span>
              <span className="tech-pill" style={{ background: 'var(--pastel-yellow)', color: 'var(--black)' }}>GSAP</span>
              <span className="tech-pill" style={{ background: 'var(--kelly-green)' }}>InnoDB</span>
              <span className="tech-pill" style={{ background: 'var(--hot-pink)' }}>React Router</span>
            </div>
            <div className="cta-box">
              <h3>HUNGRY FOR DATA INTEGRITY?</h3>
              <Link to="/menu" className="brutal-btn green">VIEW MENU →</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
