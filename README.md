# 🍔 Grab A Byte - Food Delivery System

Grab A Byte is not just a DBMS project, It's a full-fledged, enterprise-grade food delivery application architecture designed with a **Retro Brutalist UI** on the frontend and an **ACID-compliant MySQL** database backend. 

The project heavily emphasizes concurrency control, row-level locking, and transactional integrity seamlessly visualized through a React/Vite web interface.

---

## 💻 Tech Stack & Architecture

### **Frontend Interface**
- **Framework:** React + Vite
- **Routing:** React Router DOM (v6+)
- **State Management:** React Context API (`AuthContext`)
- **Styling:** Custom Vanilla CSS featuring Brutalist Design System elements:
  - High-contrast neon accents (Lime Green, Hot Pink, Bright Orange).
  - Thick stark borders (`var(--border-brutal)`).
  - Hard angular shadows (`var(--shadow-brutal)`).
  - High-impact Typography (`Anton`, `Shrikhand`, `Inter`).

### **Backend Data Constraints & Storage**
- **Relational DB:** MySQL
- **Integrity Principles Showcased:**
  1. **ACID Compliance** - Uses atomic multi-query setups (`START TRANSACTION; COMMIT; ROLLBACK;`).
  2. **Row-level Locking** - Showcases the use of `SELECT ... FOR UPDATE;` to prevent race conditions during ordering.
  3. **Concurrency Control** - Ensures multiple drivers, customers, and inventory adjustments can occur safely without phantom reads.
  4. **Stored Procedures** - Houses logic internally in the database rather than the host server.

---

## 📂 Project Structure

```bash
/grababyte
├── /database
│   ├── schema.sql        # Table creations, Constraints, Triggers, Views
│   ├── procedures.sql    # Transactional stored procedures & locks
├── /src
│   ├── /components       # Reusable UI (Navbar, Marquee)
│   ├── /context          # Global Auth/Data State management
│   ├── /pages            # Modular web views (Home, Menu, Profile, Admin)
│   ├── App.jsx           # Main Router Hub
│   ├── index.css         # Global Brutalist CSS Variables & base styling
│   └── main.jsx          # React DOM entry
```

---

## 🛠️ Local Development Setup

### 1. Frontend Client
First, clone the repository and navigate into the workspace.
```bash
npm install
npm run dev
```

### 2. Database Integration
Open your local MySQL client (like MySQL Workbench) and initialize the instance:
```sql
CREATE DATABASE grababyte_db;
USE grababyte_db;
```
Then, execute the bundled SQL files to build your testing environment:
1. Run `database/schema.sql`.
2. Run `database/procedures.sql`.

*Note: Out-of-the-box, the React UI uses mocked `localStorage` mirroring the DB structure. To connect directly to the MySQL instance, you must build an intermediary Express/Node.js REST API layer that implements the `mysql2/promise` pool and hook it into the `AuthContext` fetch calls.*

---

## 🔐 Default Testing Credentials

| Role | Username / Email | Password |
|------|-----------------|----------|
| **Admin** | `teeshaAdmin` | `teesha123` |
| **Customer** | `teesha@grababyte.com` | `teesha123` |
