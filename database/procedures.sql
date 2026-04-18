-- =====================================================
-- GrabAByte Food Delivery DBMS — Stored Procedures
-- Demonstrates: ACID Compliance & Concurrency Control
-- =====================================================
-- This file contains the core transaction logic that
-- safely handles concurrent order placement.
-- =====================================================

USE grababyte_db;

DELIMITER //

-- =====================================================
-- PROCEDURE: PlaceSecureOrder
-- =====================================================
-- PURPOSE:
--   Securely place a food delivery order while
--   maintaining data integrity across 6 tables.
--
-- ─────────────────────────────────────────────────────
-- ACID PROPERTIES DEMONSTRATED:
-- ─────────────────────────────────────────────────────
--
--   A (Atomicity):
--     All operations succeed OR all fail together.
--     If stock check fails after wallet deduction,
--     the wallet deduction is ROLLED BACK too.
--     No partial orders are ever created.
--
--   C (Consistency):
--     CHECK constraints (Price > 0, Stock >= 0),
--     FOREIGN KEY constraints, and explicit IF
--     validations ensure the database always moves
--     from one valid state to another.
--
--   I (Isolation):
--     SELECT ... FOR UPDATE provides row-level
--     exclusive locks. While Transaction A is
--     processing a burger order, Transaction B
--     trying to order the same burger WAITS until
--     Transaction A commits or rolls back.
--
--   D (Durability):
--     After COMMIT, changes are written to the
--     InnoDB redo log. Even if the database server
--     crashes immediately after, the order data
--     survives and is recoverable.
--
-- ─────────────────────────────────────────────────────
-- CONCURRENCY CONTROL MECHANISM:
-- ─────────────────────────────────────────────────────
--
--   SELECT ... FOR UPDATE acquires an EXCLUSIVE
--   row-level lock on each selected row.
--
--   SCENARIO (without locking — RACE CONDITION):
--     Time T1: User A reads StockQuantity = 1
--     Time T2: User B reads StockQuantity = 1
--     Time T3: User A sets StockQuantity = 0 ✓
--     Time T4: User B sets StockQuantity = -1 ✗ BUG!
--
--   SCENARIO (with FOR UPDATE — SAFE):
--     Time T1: User A locks row, reads Stock = 1
--     Time T2: User B tries to read → BLOCKED (waits)
--     Time T3: User A sets Stock = 0, COMMITs
--     Time T4: User B reads Stock = 0 → REJECTED ✓
--
-- =====================================================

CREATE PROCEDURE PlaceSecureOrder(
    IN p_CustomerID    INT,
    IN p_RestaurantID  INT,
    IN p_Items         JSON
    -- p_Items format: '[{"menuItemId": 1, "quantity": 2}, {"menuItemId": 3, "quantity": 1}]'
)
BEGIN
    -- Declare variables for order processing
    DECLARE v_TotalAmount       DECIMAL(10, 2) DEFAULT 0.00;
    DECLARE v_WalletBalance     DECIMAL(10, 2);
    DECLARE v_DriverID          INT DEFAULT NULL;
    DECLARE v_OrderID           INT;
    DECLARE v_InsufficientCount INT DEFAULT 0;

    -- ============================================================
    -- EXCEPTION HANDLER (ACID → Atomicity)
    -- If ANY SQL error occurs anywhere in this procedure,
    -- the EXIT HANDLER fires, ROLLBACK undoes ALL changes,
    -- and RESIGNAL sends the error back to the caller.
    -- This guarantees: either EVERYTHING succeeds, or
    -- NOTHING changes. No half-processed orders exist.
    -- ============================================================
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;  -- Re-raise the original error
    END;

    -- ============================================================
    -- START TRANSACTION (ACID → Atomicity begins)
    -- ============================================================
    -- From this point forward, ALL reads and writes are part
    -- of a single atomic unit. Nothing is visible to other
    -- transactions until we explicitly COMMIT.
    -- ============================================================
    START TRANSACTION;

    -- ============================================================
    -- STEP 1: LOCK & VALIDATE MENU ITEM STOCK
    -- ============================================================
    -- CONCURRENCY CONTROL: The FOR UPDATE clause acquires
    -- an EXCLUSIVE row-level lock on every MenuItems row
    -- that matches our order. Other transactions trying to
    -- read these rows with FOR UPDATE will BLOCK and WAIT.
    --
    -- This is how we prevent the "double-selling" race
    -- condition described above.
    -- ============================================================

    -- Check if any requested items have insufficient stock
    -- The FOR UPDATE lock is acquired on ALL matching rows
    SELECT COUNT(*) INTO v_InsufficientCount
    FROM MenuItems mi
    INNER JOIN JSON_TABLE(
        p_Items, '$[*]' COLUMNS(
            menuItemId INT PATH '$.menuItemId',
            quantity   INT PATH '$.quantity'
        )
    ) AS requested ON mi.MenuItemID = requested.menuItemId
    WHERE mi.RestaurantID = p_RestaurantID
      AND mi.StockQuantity < requested.quantity
    FOR UPDATE;
    -- ^^^ FOR UPDATE: Rows are now LOCKED for this transaction

    -- If any item has insufficient stock → ROLLBACK and abort
    IF v_InsufficientCount > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'INSUFFICIENT_STOCK: One or more items are out of stock.';
        -- The EXIT HANDLER catches this, executes ROLLBACK
    END IF;

    -- Calculate the total order amount from the locked rows
    SELECT COALESCE(SUM(mi.Price * requested.quantity), 0)
    INTO v_TotalAmount
    FROM MenuItems mi
    INNER JOIN JSON_TABLE(
        p_Items, '$[*]' COLUMNS(
            menuItemId INT PATH '$.menuItemId',
            quantity   INT PATH '$.quantity'
        )
    ) AS requested ON mi.MenuItemID = requested.menuItemId
    WHERE mi.RestaurantID = p_RestaurantID;

    -- ============================================================
    -- STEP 2: LOCK & VALIDATE CUSTOMER WALLET BALANCE
    -- ============================================================
    -- We lock the Customer row to prevent a concurrent
    -- transaction from spending the same wallet balance.
    -- Without this lock, two simultaneous orders could
    -- both read $500 and both spend $300, leaving -$100.
    -- ============================================================

    SELECT WalletBalance INTO v_WalletBalance
    FROM Customers
    WHERE CustomerID = p_CustomerID
    FOR UPDATE;
    -- ^^^ Customer row is now LOCKED

    IF v_WalletBalance < v_TotalAmount THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'INSUFFICIENT_FUNDS: Wallet balance is too low for this order.';
    END IF;

    -- ============================================================
    -- STEP 3: LOCK & ASSIGN AN AVAILABLE DRIVER
    -- ============================================================
    -- We lock the first available driver's row.
    -- This prevents two concurrent orders from being
    -- assigned to the SAME driver simultaneously.
    -- LIMIT 1 ensures we only pick one driver.
    -- ============================================================

    SELECT DriverID INTO v_DriverID
    FROM Drivers
    WHERE Status = 'Available'
    LIMIT 1
    FOR UPDATE;
    -- ^^^ Driver row is now LOCKED

    IF v_DriverID IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'NO_DRIVER: No delivery drivers are currently available.';
    END IF;

    -- ============================================================
    -- STEP 4: EXECUTE ALL STATE CHANGES
    -- ============================================================
    -- All validations have passed. All critical rows are
    -- locked. We can now safely modify the data knowing
    -- no other transaction can interfere.
    -- ============================================================

    -- 4a. Deduct total amount from customer's wallet
    UPDATE Customers
    SET WalletBalance = WalletBalance - v_TotalAmount
    WHERE CustomerID = p_CustomerID;

    -- 4b. Mark the assigned driver as 'Busy'
    UPDATE Drivers
    SET Status = 'Busy'
    WHERE DriverID = v_DriverID;

    -- 4c. Insert the main order record
    INSERT INTO Orders (CustomerID, RestaurantID, DriverID, TotalAmount, Status)
    VALUES (p_CustomerID, p_RestaurantID, v_DriverID, v_TotalAmount, 'Confirmed');

    -- Capture the auto-generated OrderID
    SET v_OrderID = LAST_INSERT_ID();

    -- 4d. Insert individual order line items (OrderDetails)
    INSERT INTO OrderDetails (OrderID, MenuItemID, Quantity, Subtotal)
    SELECT
        v_OrderID,
        requested.menuItemId,
        requested.quantity,
        (requested.quantity * mi.Price)
    FROM JSON_TABLE(
        p_Items, '$[*]' COLUMNS(
            menuItemId INT PATH '$.menuItemId',
            quantity   INT PATH '$.quantity'
        )
    ) AS requested
    INNER JOIN MenuItems mi ON mi.MenuItemID = requested.menuItemId;

    -- 4e. Deduct purchased quantities from inventory stock
    UPDATE MenuItems mi
    INNER JOIN JSON_TABLE(
        p_Items, '$[*]' COLUMNS(
            menuItemId INT PATH '$.menuItemId',
            quantity   INT PATH '$.quantity'
        )
    ) AS requested ON mi.MenuItemID = requested.menuItemId
    SET mi.StockQuantity = mi.StockQuantity - requested.quantity;

    -- ============================================================
    -- COMMIT (ACID → Durability)
    -- ============================================================
    -- All changes are now PERMANENTLY saved to disk via
    -- the InnoDB redo log. Even a server crash after this
    -- point will not lose the data.
    --
    -- All row-level locks acquired by FOR UPDATE are
    -- now RELEASED, allowing other waiting transactions
    -- to proceed with updated data.
    -- ============================================================
    COMMIT;

    -- Return success result to the application
    SELECT
        v_OrderID     AS OrderID,
        v_TotalAmount AS TotalAmount,
        v_DriverID    AS AssignedDriverID,
        'SUCCESS'     AS TransactionStatus,
        'Order placed securely with full ACID compliance!' AS Message;

END //

DELIMITER ;


-- =====================================================
-- EXAMPLE USAGE:
-- =====================================================
-- Place an order for 2 burgers and 1 fries:
--
-- CALL PlaceSecureOrder(
--     1,    -- CustomerID: Raj Patel
--     1,    -- RestaurantID: GrabAByte Kitchen
--     '[
--         {"menuItemId": 1, "quantity": 2},
--         {"menuItemId": 3, "quantity": 1}
--     ]'
-- );
--
-- Expected result on success:
-- +─────────+─────────────+─────────────────+───────────────────+──────────────────────────────────────────+
-- | OrderID | TotalAmount | AssignedDriverID| TransactionStatus | Message                                  |
-- +─────────+─────────────+─────────────────+───────────────────+──────────────────────────────────────────+
-- |       1 |       32.97 |               1 | SUCCESS           | Order placed securely with full ACID...   |
-- +─────────+─────────────+─────────────────+───────────────────+──────────────────────────────────────────+
-- =====================================================
