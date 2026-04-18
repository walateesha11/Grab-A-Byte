import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// Default users — mirrors the Customers table sample data
const DEFAULT_USERS = [
  { id: 1, name: 'Teesha',  email: 'teesha@grababyte.com', phone: '+91-9876543210', password: 'teesha123', walletBalance: 5000 },
  { id: 2, name: 'Priya Sharma', email: 'priya@grababyte.com', phone: '+91-9876543211', password: 'priya123', walletBalance: 3500 },
  { id: 99, name: 'Admin', email: 'teeshaAdmin',         phone: '+91-0000000000', password: 'teesha123', walletBalance: 99999, isAdmin: true },
];

const DRIVER_NAMES = ['Vikram Singh', 'Neha Gupta', 'Kavya Iyer', 'Rohan Das'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    // ── Database Initialization Logic ──
    const initDB = () => {
      const stored = localStorage.getItem('gab_users');
      let users = [];
      
      if (!stored) {
        // First time initialization ONLY
        localStorage.setItem('gab_users', JSON.stringify(DEFAULT_USERS));
        users = [...DEFAULT_USERS];
      } else {
        try {
          users = JSON.parse(stored);
        } catch (e) {
          users = [...DEFAULT_USERS];
        }
      }
      setAllUsers(users);
    };


    initDB();

    const session = localStorage.getItem('gab_session');
    if (session) {
      try { setUser(JSON.parse(session)); } catch { /* invalid session */ }
    }
    try { setOrders(JSON.parse(localStorage.getItem('gab_orders') || '[]')); } catch { /* */ }
    try { setFeedbacks(JSON.parse(localStorage.getItem('gab_feedbacks') || '[]')); } catch { /* */ }
  }, []);

  // ── Persist state helpers ──
  const persistUser = (u) => {
    setUser(u);
    const users = JSON.parse(localStorage.getItem('gab_users') || '[]');
    setAllUsers(users);
    
    if (u) {
      localStorage.setItem('gab_session', JSON.stringify(u));
      // Also update in users DB
      const idx = users.findIndex((x) => x.id === u.id);
      if (idx !== -1) { 
        users[idx] = { ...users[idx], ...u }; 
        localStorage.setItem('gab_users', JSON.stringify(users)); 
        setAllUsers([...users]);
      }
    } else {
      localStorage.removeItem('gab_session');
    }
  };

  const persistOrders = (o) => { setOrders(o); localStorage.setItem('gab_orders', JSON.stringify(o)); };
  const persistFeedbacks = (f) => { setFeedbacks(f); localStorage.setItem('gab_feedbacks', JSON.stringify(f)); };

  // ══════════════════════════════════════════════
  // SIGNUP
  // ══════════════════════════════════════════════
  const signup = useCallback((name, email, phone, password) => {
    const users = JSON.parse(localStorage.getItem('gab_users') || '[]');
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Email already registered.' };
    }
    const newUser = {
      id: Date.now(),
      name,
      email,
      phone,
      password,
      walletBalance: 5000,
    };
    const updatedUsers = [...users, newUser];
    localStorage.setItem('gab_users', JSON.stringify(updatedUsers));
    setAllUsers(updatedUsers);
    
    const sessionData = { ...newUser };
    delete sessionData.password;
    persistUser(sessionData);
    return { success: true };
  }, []);

  // ══════════════════════════════════════════════
  // LOGIN
  // ══════════════════════════════════════════════
  const login = useCallback((email, password) => {
    const users = JSON.parse(localStorage.getItem('gab_users') || '[]');
    const found = users.find(
      (u) => 
        (u.email.toLowerCase() === email.toLowerCase() || (u.isAdmin && email.toLowerCase() === 'teeshaadmin')) && 
        u.password === password
    );
    
    // Backup admin login just in case localStorage has old data
    if (!found && email.toLowerCase() === 'teeshaadmin' && password === 'teesha123') {
        const adminUser = { id: 99, name: 'Admin', email: 'teeshaAdmin', phone: '+91-0000000000', password: 'teesha123', walletBalance: 99999, isAdmin: true };
        const sessionData = { ...adminUser };
        delete sessionData.password;
        persistUser(sessionData);
        return { success: true };
    }

    if (!found && email.toLowerCase() === 'teesha@grababyte.com' && password === 'teesha123') {
        const standardUser = { id: 1, name: 'Teesha', email: 'teesha@grababyte.com', phone: '+91-9876543210', password: 'teesha123', walletBalance: 5000 };
        const sessionData = { ...standardUser };
        delete sessionData.password;
        persistUser(sessionData);
        return { success: true };
    }

    if (!found) return { success: false, error: 'Invalid email or password.' };
    const sessionData = { ...found };
    delete sessionData.password;
    persistUser(sessionData);
    return { success: true };
  }, []);

  // ══════════════════════════════════════════════
  // LOGOUT
  // ══════════════════════════════════════════════
  const logout = useCallback(() => { persistUser(null); }, []);

  // ── Wallet / Order Logic ──
  const addFunds = useCallback((amount) => {
    if (!user || amount <= 0) return;
    persistUser({ ...user, walletBalance: user.walletBalance + amount });
  }, [user]);

  const placeOrder = useCallback((cart, totalAmount) => {
    if (!user) return { success: false, error: 'Not logged in.' };
    if (user.walletBalance < totalAmount) return { success: false, error: 'Insufficient wallet balance.' };

    const newOrder = {
      id: Math.floor(1000 + Math.random() * 9000), // Shorter ID for demo
      customerId: user.id,
      items: cart.map((item) => ({ ...item })),
      total: totalAmount,
      status: 'Confirmed',
      driverName: DRIVER_NAMES[Math.floor(Math.random() * DRIVER_NAMES.length)],
      createdAt: new Date().toISOString(),
    };

    const updatedOrders = [...orders, newOrder];
    persistOrders(updatedOrders);
    persistUser({ ...user, walletBalance: user.walletBalance - totalAmount });

    return { success: true, orderId: newOrder.id };
  }, [user, orders]);

  // ══════════════════════════════════════════════
  // ADMIN OPERATIONS
  // ══════════════════════════════════════════════
  const updateOrderStatus = useCallback((orderId, newStatus) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
    persistOrders(updated);
  }, [orders]);

  const cancelOrder = useCallback((orderId) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: 'Cancelled' } : o));
    persistOrders(updated);
  }, [orders]);

  const deleteOrder = useCallback((orderId) => {
    const updated = orders.filter((o) => o.id !== orderId);
    persistOrders(updated);
  }, [orders]);

  const deleteUser = useCallback((userId) => {
    // Delete user
    const users = JSON.parse(localStorage.getItem('gab_users') || '[]');
    const updatedUsers = users.filter((u) => String(u.id) !== String(userId));
    localStorage.setItem('gab_users', JSON.stringify(updatedUsers));
    setAllUsers(updatedUsers);
    
    // Delete their orders too for consistency
    const updatedOrders = orders.filter((o) => String(o.customerId) !== String(userId));
    persistOrders(updatedOrders);
    
    // If deleted user is current user, logout
    if (String(user?.id) === String(userId)) logout();
  }, [orders, user, logout]);

  // ══════════════════════════════════════════════
  // SUBMIT FEEDBACK
  // SQL: INSERT INTO Feedback (CustomerID, Name, Email, Rating, Comment)
  //      VALUES (?, ?, ?, ?, ?);
  // ══════════════════════════════════════════════
  const submitFeedback = useCallback((name, email, rating, comment) => {
    const fb = {
      id: Date.now(),
      customerId: user?.id || null,
      name,
      email,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };
    const updated = [...feedbacks, fb];
    persistFeedbacks(updated);
    return { success: true };
  }, [user, feedbacks]);

  return (
    <AuthContext.Provider
      value={{
        user,
        allUsers,
        orders,
        feedbacks,
        isLoggedIn: !!user,
        isAdmin: !!user?.isAdmin,
        signup,
        login,
        logout,
        addFunds,
        placeOrder,
        updateOrderStatus,
        cancelOrder,
        deleteOrder,
        deleteUser,
        submitFeedback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
