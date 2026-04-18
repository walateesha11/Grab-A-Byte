# GrabAByte — MySQL Connection Guide

This guide will help you connect the GrabAByte frontend to your local MySQL database.

## 1. Local Database Setup

Ensure you have MySQL installed and running on your laptop.

1.  **Open MySQL Workbench** (or your preferred SQL client).
2.  **Create a new database**:
    ```sql
    CREATE DATABASE grababyte_db;
    USE grababyte_db;
    ```
3.  **Run the Schema Scripts**:
    - Open and execute [schema.sql](./database/schema.sql) to create the tables.
    - Open and execute [procedures.sql](./database/procedures.sql) to create the stored procedures.

---

## 2. Connecting the Backend (Node.js)

The current application uses a **Mock Auth Layer** (LocalStorage) for demonstration. To connect it to your real MySQL database, you need a backend API.

### Recommended Steps:
1.  **Create a `server/` directory** in your project root.
2.  **Initialize a Node.js project**:
    ```bash
    npm init -y
    npm install express mysql2 dotenv cors
    ```
3.  **Configure Connection**:
    Create a `.env` file:
    ```env
    DB_HOST=localhost
    DB_USER=your_username
    DB_PASSWORD=your_password
    DB_NAME=grababyte_db
    ```

4.  **Backend Logic**:
    Implement endpoints in `index.js` that call your MySQL procedures:
    ```javascript
    const mysql = require('mysql2/promise');
    const pool = mysql.createPool({ ... });

    app.get('/api/orders', async (req, res) => {
      const [rows] = await pool.query('SELECT * FROM Orders');
      res.json(rows);
    });
    ```

---

## 3. Deployment Ready

### Cleanup
- I have already removed static placeholder metrics from the Admin Dashboard.
- The **AuthContext** has been hardened to ensure that deleted users stay deleted.
- The **Navbar** has been redesigned to be minimalist and mobile-responsive.

### Building for Production
When you are ready to deploy:
1.  Run `npm run build`.
2.  The resulting `dist/` folder contains your production-ready files.

---

**Admin Access**:
- **User**: `teesha@grababyte`
- **Pass**: `teesha123`
- **Superadmin ID**: `TeeshaAdmin`
