import React from 'react';
import Marquee from '../components/Marquee';
import './Schema.css';

const TABLES = [
  {
    name: 'CUSTOMERS',
    color: 'var(--kelly-green)',
    textColor: '#fff',
    fields: [
      { name: 'CustomerID', type: 'INT', key: 'PK', auto: true },
      { name: 'Name', type: 'VARCHAR(100)', constraint: 'NOT NULL' },
      { name: 'Email', type: 'VARCHAR(150)', constraint: 'UNIQUE' },
      { name: 'PasswordHash', type: 'VARCHAR(255)', constraint: 'NOT NULL' },
      { name: 'Phone', type: 'VARCHAR(20)' },
      { name: 'WalletBalance', type: 'DECIMAL(10,2)', constraint: 'CHECK ≥ 0', def: '₹5000' },
      { name: 'CreatedAt', type: 'TIMESTAMP', def: 'NOW()' },
    ],
  },
  {
    name: 'RESTAURANTS',
    color: 'var(--hot-pink)',
    textColor: '#fff',
    fields: [
      { name: 'RestaurantID', type: 'INT', key: 'PK', auto: true },
      { name: 'Name', type: 'VARCHAR(150)', constraint: 'NOT NULL' },
      { name: 'CuisineType', type: 'VARCHAR(50)' },
      { name: 'IsActive', type: 'BOOLEAN', def: 'TRUE' },
      { name: 'CreatedAt', type: 'TIMESTAMP', def: 'NOW()' },
    ],
  },
  {
    name: 'MENU_ITEMS',
    color: 'var(--pastel-yellow)',
    textColor: '#000',
    fields: [
      { name: 'MenuItemID', type: 'INT', key: 'PK', auto: true },
      { name: 'RestaurantID', type: 'INT', key: 'FK', constraint: 'NOT NULL' },
      { name: 'Name', type: 'VARCHAR(100)', constraint: 'NOT NULL' },
      { name: 'Price', type: 'DECIMAL(10,2)', constraint: 'CHECK > 0' },
      { name: 'StockQuantity', type: 'INT', constraint: 'CHECK ≥ 0', def: '50' },
      { name: 'Category', type: 'VARCHAR(50)', def: "'general'" },
    ],
  },
  {
    name: 'ORDERS',
    color: 'var(--bright-orange)',
    textColor: '#fff',
    fields: [
      { name: 'OrderID', type: 'INT', key: 'PK', auto: true },
      { name: 'CustomerID', type: 'INT', key: 'FK', constraint: 'NOT NULL' },
      { name: 'RestaurantID', type: 'INT', key: 'FK', constraint: 'NOT NULL' },
      { name: 'DriverID', type: 'INT', key: 'FK' },
      { name: 'TotalAmount', type: 'DECIMAL(10,2)', constraint: 'NOT NULL' },
      { name: 'Status', type: 'ENUM(...)', def: "'Pending'" },
      { name: 'CreatedAt', type: 'TIMESTAMP', def: 'NOW()' },
    ],
  },
  {
    name: 'ORDER_DETAILS',
    color: '#1a1a1a',
    textColor: 'var(--pastel-yellow)',
    fields: [
      { name: 'OrderDetailID', type: 'INT', key: 'PK', auto: true },
      { name: 'OrderID', type: 'INT', key: 'FK', constraint: 'NOT NULL' },
      { name: 'MenuItemID', type: 'INT', key: 'FK', constraint: 'NOT NULL' },
      { name: 'Quantity', type: 'INT', constraint: 'CHECK > 0' },
      { name: 'Subtotal', type: 'DECIMAL(10,2)', constraint: 'NOT NULL' },
    ],
  },
  {
    name: 'DRIVERS',
    color: 'var(--kelly-green)',
    textColor: '#fff',
    fields: [
      { name: 'DriverID', type: 'INT', key: 'PK', auto: true },
      { name: 'Name', type: 'VARCHAR(100)', constraint: 'NOT NULL' },
      { name: 'Phone', type: 'VARCHAR(20)' },
      { name: 'Status', type: "ENUM('Available','Busy','Offline')", def: "'Available'" },
    ],
  },
  {
    name: 'AUTH_SESSIONS',
    color: 'var(--hot-pink)',
    textColor: '#fff',
    fields: [
      { name: 'SessionID', type: 'VARCHAR(255)', key: 'PK' },
      { name: 'CustomerID', type: 'INT', key: 'FK', constraint: 'NOT NULL' },
      { name: 'ExpiresAt', type: 'DATETIME', constraint: 'NOT NULL' },
      { name: 'CreatedAt', type: 'TIMESTAMP', def: 'NOW()' },
    ],
  },
  {
    name: 'FEEDBACK',
    color: 'var(--pastel-yellow)',
    textColor: '#000',
    fields: [
      { name: 'FeedbackID', type: 'INT', key: 'PK', auto: true },
      { name: 'CustomerID', type: 'INT', key: 'FK' },
      { name: 'Name', type: 'VARCHAR(100)', constraint: 'NOT NULL' },
      { name: 'Email', type: 'VARCHAR(150)' },
      { name: 'Rating', type: 'INT', constraint: 'CHECK 1-5' },
      { name: 'Comment', type: 'TEXT' },
      { name: 'CreatedAt', type: 'TIMESTAMP', def: 'NOW()' },
    ],
  },
];

const RELATIONSHIPS = [
  { from: 'CUSTOMERS', to: 'ORDERS', label: '1 : N', desc: 'CustomerID' },
  { from: 'RESTAURANTS', to: 'ORDERS', label: '1 : N', desc: 'RestaurantID' },
  { from: 'RESTAURANTS', to: 'MENU_ITEMS', label: '1 : N', desc: 'RestaurantID' },
  { from: 'DRIVERS', to: 'ORDERS', label: '1 : N', desc: 'DriverID' },
  { from: 'ORDERS', to: 'ORDER_DETAILS', label: '1 : N', desc: 'OrderID (CASCADE)' },
  { from: 'MENU_ITEMS', to: 'ORDER_DETAILS', label: '1 : N', desc: 'MenuItemID' },
  { from: 'CUSTOMERS', to: 'AUTH_SESSIONS', label: '1 : N', desc: 'CustomerID (CASCADE)' },
  { from: 'CUSTOMERS', to: 'FEEDBACK', label: '1 : N', desc: 'CustomerID (SET NULL)' },
];

export default function Schema() {
  return (
    <div className="schema-page">
      {/* ── Hero Header ── */}
      <header className="schema-hero">
        <div className="schema-hero-inner">
          <div className="schema-hero-left">
            <h1 className="schema-mega-title">
              GRAB<span className="schema-accent">A</span>BYTE<br />
              <span className="schema-subtitle">DB SCHEMATIC</span>
            </h1>
            <p className="schema-hero-desc">
              8 TABLES • INNODB ENGINE • ACID TRANSACTIONS • ROW-LEVEL LOCKING
            </p>
          </div>
          <div className="schema-hero-right">
            <div className="schema-terminal">
              <div className="st-bar">
                <span className="st-dot" style={{ background: '#ff5f57' }} />
                <span className="st-dot" style={{ background: '#febc2e' }} />
                <span className="st-dot" style={{ background: '#28c840' }} />
                <span className="st-label">grababyte_db</span>
              </div>
              <div className="st-body">
                <code><span className="sql-kw">USE</span> grababyte_db;</code>
                <code><span className="sql-kw">SHOW</span> TABLES;</code>
                <code className="sql-result">→ 8 tables found ✓</code>
                <code><span className="sql-kw">SELECT</span> ENGINE <span className="sql-kw">FROM</span> information_schema;</code>
                <code className="sql-result">→ InnoDB (ALL) ✓</code>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Marquee ── */}
      <div className="schema-marquee">
        <div className="schema-marquee-track">
          {[...Array(3)].map((_, i) => (
            <span key={i} className="schema-marquee-text">
              ORDER NOW • CONCURRENCY CONTROL • ACID COMPLIANCE • SECURE PAYMENTS •
              GrabAByte PROJECT • UNLIMITED SCHEMA OPTIMIZATION •
              ROW-LEVEL LOCKING • INNODB ENGINE • STORED PROCEDURES •&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ── Pop-Art Floating Food ── */}
      <div className="schema-food-decor" aria-hidden="true">
        <img src="/images/hotdog-cute.png" alt="" className="schema-food sf-hotdog" />
        <img src="/images/pizza-float.png" alt="" className="schema-food sf-pizza" />
        <img src="/images/taco-cute.png" alt="" className="schema-food sf-taco" />
        <img src="/images/donut-float.png" alt="" className="schema-food sf-donut" />
        <img src="/images/fries-float.png" alt="" className="schema-food sf-fries" />

        {/* Starburst price tags */}
        <div className="starburst sb-1">
          <span>₹249</span>
          <span>BURGER</span>
        </div>
        <div className="starburst sb-2">
          <span>₹49</span>
          <span>VADA PAV</span>
        </div>
        <div className="starburst sb-3">
          <span>₹349</span>
          <span>PIZZA</span>
        </div>
      </div>

      {/* ── Table Grid ── */}
      <section className="schema-grid-section">
        <div className="schema-grid">
          {TABLES.map((table) => (
            <div
              key={table.name}
              className="schema-table-card"
              style={{ '--card-bg': table.color, '--card-text': table.textColor }}
              id={`table-${table.name.toLowerCase().replace(/_/g, '-')}`}
            >
              <div className="stc-header" style={{ background: table.color, color: table.textColor }}>
                <h2>{table.name}</h2>
                <span className="stc-engine">InnoDB</span>
              </div>
              <div className="stc-body">
                {table.fields.map((field) => (
                  <div key={field.name} className={`stc-field ${field.key === 'PK' ? 'pk-field' : ''} ${field.key === 'FK' ? 'fk-field' : ''}`}>
                    <div className="stc-field-name">
                      {field.key && <span className={`key-badge key-${field.key.toLowerCase()}`}>{field.key}</span>}
                      <span>{field.name}</span>
                      {field.auto && <span className="auto-badge">AI</span>}
                    </div>
                    <div className="stc-field-type">
                      <code>{field.type}</code>
                    </div>
                    <div className="stc-field-meta">
                      {field.constraint && <span className="constraint-tag">{field.constraint}</span>}
                      {field.def && <span className="default-tag">= {field.def}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Relationships ── */}
      <section className="schema-relations-section">
        <h2 className="relations-title">FOREIGN KEY RELATIONSHIPS</h2>
        <p className="relations-subtitle">REFERENTIAL INTEGRITY ACROSS ALL 8 TABLES</p>
        <div className="relations-grid">
          {RELATIONSHIPS.map((rel, i) => (
            <div key={i} className="relation-card">
              <div className="rel-from">{rel.from}</div>
              <div className="rel-arrow">
                <span className="rel-line" />
                <span className="rel-label">{rel.label}</span>
                <span className="rel-line" />
              </div>
              <div className="rel-to">{rel.to}</div>
              <div className="rel-desc">{rel.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stored Procedure Highlight ── */}
      <section className="schema-proc-section">
        <div className="proc-inner">
          <h2>STORED PROCEDURE</h2>
          <h3>PlaceSecureOrder()</h3>
          <div className="proc-flow">
            <div className="proc-step" style={{ background: 'var(--pastel-yellow)', color: 'var(--black)' }}>
              <div className="ps-num">01</div>
              <div className="ps-title">START TRANSACTION</div>
              <div className="ps-desc">Begin atomic block</div>
            </div>
            <div className="proc-connector">→</div>
            <div className="proc-step" style={{ background: 'var(--hot-pink)' }}>
              <div className="ps-num">02</div>
              <div className="ps-title">SELECT ... FOR UPDATE</div>
              <div className="ps-desc">Lock rows exclusively</div>
            </div>
            <div className="proc-connector">→</div>
            <div className="proc-step" style={{ background: 'var(--bright-orange)' }}>
              <div className="ps-num">03</div>
              <div className="ps-title">VALIDATE & UPDATE</div>
              <div className="ps-desc">Check stock, deduct wallet</div>
            </div>
            <div className="proc-connector">→</div>
            <div className="proc-step" style={{ background: 'var(--kelly-green)' }}>
              <div className="ps-num">04</div>
              <div className="ps-title">COMMIT</div>
              <div className="ps-desc">Persist to InnoDB redo log</div>
            </div>
          </div>
        </div>
      </section>

      <Marquee />
    </div>
  );
}
