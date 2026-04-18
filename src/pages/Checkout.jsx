import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext';
import { TRANSACTION_STEPS } from '../data';
import './Checkout.css';

export default function Checkout({ cart, removeFromCart, updateQuantity, clearCart }) {
  const { user, placeOrder } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderError, setOrderError] = useState('');
  const stepsRef = useRef(null);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const delivery = cart.length > 0 ? 40 : 0;
  const total = subtotal + delivery;

  const handlePlaceOrder = () => {
    if (cart.length === 0 || isProcessing) return;
    setOrderError('');

    // Check wallet balance
    if (user.walletBalance < total) {
      setOrderError(`Insufficient wallet balance (₹${user.walletBalance.toLocaleString('en-IN')}). Add funds in Profile.`);
      return;
    }

    setIsProcessing(true);
    setCurrentStep(-1);

    // Step through transaction phases
    TRANSACTION_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setCurrentStep(i);
        if (i === TRANSACTION_STEPS.length - 1) {
          setTimeout(() => {
            // Execute PlaceSecureOrder simulation
            const result = placeOrder(cart, total);
            if (result.success) {
              setOrderComplete(true);
              clearCart();
            } else {
              setOrderError(result.error || 'Transaction failed.');
            }
            setIsProcessing(false);
          }, 900);
        }
      }, (i + 1) * 650);
    });
  };

  // Animate transaction steps
  useEffect(() => {
    if (currentStep >= 0 && stepsRef.current) {
      const stepEls = stepsRef.current.querySelectorAll('.tx-step');
      if (stepEls[currentStep]) {
        gsap.fromTo(stepEls[currentStep],
          { x: -20, opacity: 0, scale: 0.95 },
          { x: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.7)' }
        );
      }
    }
  }, [currentStep]);

  // ── Order Success ──
  if (orderComplete) {
    return (
      <div className="checkout-page">
        <div className="checkout-success" id="order-success">
          <div className="success-icon">✅</div>
          <h1>ORDER CONFIRMED</h1>
          <p className="success-msg">
            Your order was processed using a fully <strong>ACID-compliant</strong> MySQL
            transaction. ₹{total.toLocaleString('en-IN')} has been deducted from your wallet.
          </p>
          <div className="success-sql-box">
            <code>COMMIT; -- ₹{total.toLocaleString('en-IN')} deducted. Order saved to InnoDB.</code>
          </div>
          <div className="success-details">
            <div className="detail-chip"><span>🔒</span> Atomicity</div>
            <div className="detail-chip"><span>✓</span> Consistency</div>
            <div className="detail-chip"><span>⚡</span> Isolation</div>
            <div className="detail-chip"><span>💾</span> Durability</div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/track-order" className="brutal-btn orange">TRACK ORDER →</Link>
            <Link to="/menu" className="brutal-btn green">ORDER MORE →</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Checkout Page ──
  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h1 id="checkout-title">YOUR CART</h1>
        <p>{cart.length} ITEM{cart.length !== 1 ? 'S' : ''} • WALLET: ₹{user?.walletBalance?.toLocaleString('en-IN') || '0'}</p>
      </div>

      {cart.length === 0 ? (
        <div className="checkout-empty" id="empty-cart">
          <h2>NOTHING HERE YET.</h2>
          <p>Add some food to begin your ACID-compliant transaction!</p>
          <Link to="/menu" className="brutal-btn orange">VIEW MENU →</Link>
        </div>
      ) : (
        <div className="checkout-layout">
          {/* Cart Items */}
          <div className="cart-items-col">
            {cart.map((item) => (
              <div key={item.id} className="cart-item" id={`cart-item-${item.id}`}>
                <div className="cart-item-img">
                  {item.image ? (
                    <img src={item.image} alt={item.name} width="56" height="56" />
                  ) : (
                    <span style={{ fontSize: '2rem' }}>{item.emoji || '🍽️'}</span>
                  )}
                </div>
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <span className="cart-item-unit">₹{item.price} each</span>
                </div>
                <div className="cart-item-controls">
                  <div className="qty-controls">
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)} aria-label="Decrease">−</button>
                    <span className="qty-value">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)} aria-label="Increase">+</button>
                  </div>
                  <span className="cart-item-subtotal">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  <button className="remove-btn" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}>✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary + Transaction Visualizer */}
          <div className="summary-col">
            <div className="summary-box" id="order-summary">
              <h2>ORDER SUMMARY</h2>
              <div className="summary-row"><span>SUBTOTAL</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="summary-row"><span>DELIVERY</span><span>₹{delivery}</span></div>
              <div className="summary-row total-row"><span>TOTAL</span><span>₹{total.toLocaleString('en-IN')}</span></div>

              {orderError && <div className="auth-error" style={{ marginTop: '1rem' }}>{orderError}</div>}

              <button
                className={`brutal-btn green place-order-btn ${isProcessing ? 'processing' : ''}`}
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                id="place-order-btn"
              >
                {isProcessing ? 'PROCESSING...' : 'PLACE ORDER →'}
              </button>
              <div className="sql-note">* Executes <code>CALL PlaceSecureOrder()</code></div>
            </div>

            {/* Transaction Visualizer */}
            {(isProcessing || currentStep >= 0) && (
              <div className="tx-visualizer" ref={stepsRef} id="tx-visualizer">
                <h3>⚙ DBMS TRANSACTION LOG</h3>
                {TRANSACTION_STEPS.map((step, i) => (
                  <div key={i} className={`tx-step ${i <= currentStep ? 'active' : ''} ${i === currentStep ? 'current' : ''}`}>
                    <div className="tx-icon">{step.icon}</div>
                    <div className="tx-content">
                      <div className="tx-label">{step.label}</div>
                      <code className="tx-sql">{step.sql}</code>
                      {i <= currentStep && <div className="tx-desc">{step.description}</div>}
                    </div>
                    <div className="tx-status">{i < currentStep ? '✓' : i === currentStep ? '⏳' : '○'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
