import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Auth() {
  const { login, signup, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isRightPanelActive, setRightPanelActive] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      const from = location.state?.from?.pathname || '/profile';
      navigate(from, { replace: true });
    }
  }, [isLoggedIn, navigate, location]);

  const togglePanel = () => {
    setRightPanelActive(!isRightPanelActive);
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!loginEmail || !loginPassword) return setError('Please fill in all fields.');

    setLoading(true);
    setTimeout(() => {
      const result = login(loginEmail, loginPassword);
      if (result.success) {
        navigate('/profile');
      } else {
        setError(result.error);
      }
      setLoading(false);
    }, 600);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    const { name, email, password, confirm } = signupForm;
    
    if (!name || !email || !password) return setError('Name, email, and password are required.');
    if (password.length < 4) return setError('Password must be at least 4 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    setTimeout(() => {
      const result = signup(name, email, signupForm.phone, password);
      if (result.success) {
        navigate('/profile');
      } else {
        setError(result.error);
      }
      setLoading(false);
    }, 600);
  };

  const updateSignup = (field) => (e) => {
    setSignupForm({ ...signupForm, [field]: e.target.value });
  };

  return (
    <div className="auth-page">
      {/* Decorative Stickers */}
      <div className="auth-bg-deco sticker-1">🍕</div>
      <div className="auth-bg-deco sticker-2">🍔</div>
      <div className="auth-bg-deco sticker-3">🍟</div>
      <div className="auth-bg-deco sticker-4">🍩</div>

      <div className={`auth-container ${isRightPanelActive ? 'right-panel-active' : ''}`} id="auth-container">
        
        {/* Sign Up Container */}
        <div className="auth-form-container signup-container">
          <div className="auth-form-inner">
            <form onSubmit={handleSignup}>
              <h2>CREATE ACCOUNT</h2>
              <div className="auth-sql-banner">SQL: <code>INSERT INTO Customers ...</code></div>
              
              {isRightPanelActive && error && <div className="auth-error">{error}</div>}
              
              <div className="form-group">
                <input 
                  className="brutal-input" 
                  type="text" 
                  placeholder="FULL NAME" 
                  value={signupForm.name} 
                  onChange={updateSignup('name')}
                />
              </div>
              <div className="form-group">
                <input 
                  className="brutal-input" 
                  type="email" 
                  placeholder="EMAIL" 
                  value={signupForm.email} 
                  onChange={updateSignup('email')}
                />
              </div>
              <div className="form-group">
                <input 
                  className="brutal-input" 
                  type="tel" 
                  placeholder="PHONE" 
                  value={signupForm.phone} 
                  onChange={updateSignup('phone')}
                />
              </div>
              <div className="form-group">
                <input 
                  className="brutal-input" 
                  type="password" 
                  placeholder="PASSWORD" 
                  value={signupForm.password} 
                  onChange={updateSignup('password')}
                />
              </div>
              <div className="form-group">
                <input 
                  className="brutal-input" 
                  type="password" 
                  placeholder="CONFIRM PASSWORD" 
                  value={signupForm.confirm} 
                  onChange={updateSignup('confirm')}
                />
              </div>
              <button className="brutal-btn pink auth-submit" disabled={loading}>
                {loading ? 'CREATING...' : 'SIGN UP →'}
              </button>
            </form>
          </div>
        </div>

        {/* Log In Container */}
        <div className="auth-form-container login-container">
          <div className="auth-form-inner">
            <form onSubmit={handleLogin}>
              <h2>WELCOME BACK</h2>
              <div className="auth-sql-banner">SQL: <code>SELECT * FROM Customers ...</code></div>
              
              {!isRightPanelActive && error && <div className="auth-error">{error}</div>}
              
              <div className="form-group">
                <input 
                  className="brutal-input" 
                  type="text" 
                  placeholder="EMAIL OR USERNAME" 
                  value={loginEmail} 
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <input 
                  className="brutal-input" 
                  type="password" 
                  placeholder="PASSWORD" 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              <button className="brutal-btn green auth-submit" disabled={loading}>
                {loading ? 'VERIFYING...' : 'LOG IN →'}
              </button>
              
              <div className="demo-credentials">
                <div><strong>USER:</strong> teesha@grababyte / teesha123</div>
                <div><strong>ADMIN:</strong> TeeshaAdmin / teesha123</div>
              </div>
            </form>
          </div>
        </div>

        {/* Overlay Container */}
        <div className="auth-overlay-container">
          <div className="auth-overlay">
            <div className="auth-overlay-panel auth-overlay-left">
              <h1>HELLO, FRIEND!</h1>
              <p>JOIN OUR COMMUNITY OF DATA-DRIVEN FOODIES.</p>
              <button className="ghost-btn" id="signIn" onClick={togglePanel}>
                ← LOG IN
              </button>
            </div>
            <div className="auth-overlay-panel auth-overlay-right">
              <h1>WELCOME BACK!</h1>
              <p>STAY CONNECTED WITH OUR SECURE DBMS ENGINE.</p>
              <button className="ghost-btn" id="signUp" onClick={togglePanel}>
                SIGN UP →
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
