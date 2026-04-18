-- =====================================================
-- GrabAByte Food Delivery DBMS — Complete Schema v2
-- InnoDB Engine | INR Currency | Auth & Feedback
-- =====================================================

CREATE DATABASE IF NOT EXISTS grababyte_db;
USE grababyte_db;

-- =====================================================
-- TABLE: Customers (with Authentication)
-- =====================================================
CREATE TABLE Customers (
    CustomerID    INT AUTO_INCREMENT PRIMARY KEY,
    Name          VARCHAR(100) NOT NULL,
    Email         VARCHAR(150) NOT NULL UNIQUE,
    PasswordHash  VARCHAR(255) NOT NULL,           -- Stores bcrypt hash, NEVER plain text
    Phone         VARCHAR(20),
    WalletBalance DECIMAL(10, 2) DEFAULT 5000.00   -- Starting balance in INR (₹)
        CHECK (WalletBalance >= 0),
    CreatedAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: AuthSessions (Server-side session management)
-- Alternative to JWT for session tracking
-- =====================================================
CREATE TABLE AuthSessions (
    SessionID   VARCHAR(255) PRIMARY KEY,
    CustomerID  INT NOT NULL,
    ExpiresAt   DATETIME NOT NULL,
    CreatedAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_session_customer
        FOREIGN KEY (CustomerID)
        REFERENCES Customers(CustomerID)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: Restaurants
-- =====================================================
CREATE TABLE Restaurants (
    RestaurantID  INT AUTO_INCREMENT PRIMARY KEY,
    Name          VARCHAR(150) NOT NULL,
    CuisineType   VARCHAR(50),
    IsActive      BOOLEAN DEFAULT TRUE,
    CreatedAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: MenuItems (Prices in INR ₹)
-- =====================================================
CREATE TABLE MenuItems (
    MenuItemID    INT AUTO_INCREMENT PRIMARY KEY,
    RestaurantID  INT NOT NULL,
    Name          VARCHAR(100) NOT NULL,
    Price         DECIMAL(10, 2) NOT NULL CHECK (Price > 0),
    StockQuantity INT NOT NULL DEFAULT 50 CHECK (StockQuantity >= 0),
    Category      VARCHAR(50) DEFAULT 'general',
    CONSTRAINT fk_menu_restaurant
        FOREIGN KEY (RestaurantID)
        REFERENCES Restaurants(RestaurantID)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: Drivers
-- =====================================================
CREATE TABLE Drivers (
    DriverID INT AUTO_INCREMENT PRIMARY KEY,
    Name     VARCHAR(100) NOT NULL,
    Phone    VARCHAR(20),
    Status   ENUM('Available', 'Busy', 'Offline') DEFAULT 'Available'
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: Orders
-- =====================================================
CREATE TABLE Orders (
    OrderID       INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID    INT NOT NULL,
    RestaurantID  INT NOT NULL,
    DriverID      INT,
    TotalAmount   DECIMAL(10, 2) NOT NULL,
    Status        ENUM('Pending', 'Confirmed', 'Preparing',
                       'Out for Delivery', 'Delivered', 'Cancelled')
                  DEFAULT 'Pending',
    CreatedAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_customer
        FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
    CONSTRAINT fk_order_restaurant
        FOREIGN KEY (RestaurantID) REFERENCES Restaurants(RestaurantID),
    CONSTRAINT fk_order_driver
        FOREIGN KEY (DriverID) REFERENCES Drivers(DriverID)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: OrderDetails
-- =====================================================
CREATE TABLE OrderDetails (
    OrderDetailID INT AUTO_INCREMENT PRIMARY KEY,
    OrderID       INT NOT NULL,
    MenuItemID    INT NOT NULL,
    Quantity      INT NOT NULL CHECK (Quantity > 0),
    Subtotal      DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_detail_order
        FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
    CONSTRAINT fk_detail_menuitem
        FOREIGN KEY (MenuItemID) REFERENCES MenuItems(MenuItemID)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: Feedback (Connected to frontend form)
-- =====================================================
CREATE TABLE Feedback (
    FeedbackID  INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID  INT,
    Name        VARCHAR(100) NOT NULL,
    Email       VARCHAR(150),
    Rating      INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
    Comment     TEXT,
    CreatedAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feedback_customer
        FOREIGN KEY (CustomerID)
        REFERENCES Customers(CustomerID)
        ON DELETE SET NULL
) ENGINE=InnoDB;


-- =====================================================
-- SAMPLE DATA (INR ₹ Pricing)
-- =====================================================

-- Passwords shown here for reference only.
-- In production, use: INSERT ... VALUES (..., '$2b$10$hashedvalue...')
INSERT INTO Customers (Name, Email, PasswordHash, Phone, WalletBalance) VALUES
('Raj Patel',    'raj@grababyte.com',    '$2b$10$demoHashRaj',    '+91-9876543210', 5000.00),
('Priya Sharma', 'priya@grababyte.com',  '$2b$10$demoHashPriya',  '+91-9876543211', 3500.00),
('Amit Verma',   'amit@grababyte.com',   '$2b$10$demoHashAmit',   '+91-9876543212', 2000.00),
('Sneha Reddy',  'sneha@grababyte.com',  '$2b$10$demoHashSneha',  '+91-9876543213', 7500.00);

INSERT INTO Restaurants (Name, CuisineType, IsActive) VALUES
('GrabAByte Kitchen', 'Multi-Cuisine', TRUE),
('Byte Street Diner', 'American',      TRUE),
('Spice Terminal',    'Indian',         TRUE);

-- Menu Items in INR (₹)
INSERT INTO MenuItems (RestaurantID, Name, Price, StockQuantity, Category) VALUES
(1, 'Double Smash Burger',      249.00,  50, 'burgers'),
(1, 'Spicy Chicken Sandwich',   199.00,  40, 'sandwiches'),
(1, 'Truffle Fries',            149.00, 100, 'sides'),
(1, 'Neapolitan Pizza',         349.00,  30, 'pizza'),
(1, 'Organic Kale Salad',       199.00,  25, 'salads'),
(1, 'Death by Chocolate Cake',  179.00,  35, 'desserts'),
(3, 'Vada Pav',                  49.00, 200, 'indian'),
(3, 'Butter Chicken',           299.00,  40, 'indian'),
(3, 'Paneer Tikka',             249.00,  35, 'indian'),
(3, 'Masala Dosa',              129.00,  60, 'indian'),
(3, 'Hyderabadi Biryani',       219.00,  50, 'indian'),
(3, 'Samosa Plate (4pc)',        59.00, 150, 'indian');

INSERT INTO Drivers (Name, Phone, Status) VALUES
('Vikram Singh', '+91-8765432100', 'Available'),
('Neha Gupta',   '+91-8765432101', 'Available'),
('Rohan Das',    '+91-8765432102', 'Busy'),
('Kavya Iyer',   '+91-8765432103', 'Available');


-- =====================================================
-- USEFUL QUERIES FOR DASHBOARD & PROFILE
-- =====================================================

-- Fetch user's complete order history with item details:
-- SELECT o.OrderID, o.TotalAmount, o.Status, o.CreatedAt,
--        mi.Name AS ItemName, od.Quantity, od.Subtotal,
--        r.Name AS RestaurantName
-- FROM Orders o
-- JOIN OrderDetails od ON o.OrderID = od.OrderID
-- JOIN MenuItems mi ON od.MenuItemID = mi.MenuItemID
-- JOIN Restaurants r ON o.RestaurantID = r.RestaurantID
-- WHERE o.CustomerID = ?
-- ORDER BY o.CreatedAt DESC;

-- Authenticate user login:
-- SELECT CustomerID, Name, Email, PasswordHash, WalletBalance
-- FROM Customers WHERE Email = ?;
-- Then verify: bcrypt.compare(inputPassword, PasswordHash)

-- Insert feedback:
-- INSERT INTO Feedback (CustomerID, Name, Email, Rating, Comment)
-- VALUES (?, ?, ?, ?, ?);
