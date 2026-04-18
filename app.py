"""
GrabAByte Flask Backend
=======================
Production-ready REST API for the GrabAByte food delivery platform.

Connects to a MySQL database via MYSQL_URL, initialises the schema on
first boot, and exposes endpoints consumed by the React frontend.

Environment variables
---------------------
MYSQL_URL   : mysql://user:password@host:port/dbname
              (Railway injects this automatically for linked MySQL services)
SECRET_KEY  : Flask session secret (defaults to a random value in dev)
PORT        : Port to bind (defaults to 5000)
"""

import os
import re
import json
import uuid
import logging
from datetime import datetime, timedelta
from urllib.parse import urlparse

import bcrypt
import mysql.connector
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from dotenv import load_dotenv

# ── Load .env in development ──────────────────────────────────────────────────
load_dotenv()

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Flask app ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", os.urandom(32).hex())

# Allow requests from any origin so the Vite dev server and the deployed
# React frontend can both reach the API without CORS errors.
CORS(app, resources={r"/api/*": {"origins": "*"}})


# ══════════════════════════════════════════════════════════════════════════════
# DATABASE HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _parse_mysql_url(url: str) -> dict:
    """
    Parse a mysql:// connection URL into a dict accepted by
    mysql.connector.connect().

    Supports both the plain ``mysql://`` scheme and the
    ``mysql+mysqlconnector://`` SQLAlchemy variant that Railway sometimes
    emits.
    """
    # Normalise scheme so urlparse handles it correctly
    url = re.sub(r"^mysql\+[^:]+://", "mysql://", url)
    parsed = urlparse(url)

    config = {
        "host":     parsed.hostname or "127.0.0.1",
        "port":     parsed.port or 3306,
        "user":     parsed.username,
        "password": parsed.password or "",
        # Connect without a default database first so we can run
        # CREATE DATABASE IF NOT EXISTS in the schema file.
        "database": parsed.path.lstrip("/") or None,
        "autocommit": False,
        "connection_timeout": 10,
        "charset": "utf8mb4",
    }
    return config


def get_db_config() -> dict:
    """Return the MySQL connection config derived from MYSQL_URL."""
    url = os.getenv("MYSQL_URL")
    if not url:
        raise RuntimeError(
            "MYSQL_URL environment variable is not set. "
            "Link a MySQL service in Railway or add it to your .env file."
        )
    return _parse_mysql_url(url)


def get_db():
    """
    Return a per-request MySQL connection stored on Flask's ``g`` object.
    The connection is closed automatically at the end of each request via
    ``teardown_appcontext``.
    """
    if "db" not in g:
        config = get_db_config()
        g.db = mysql.connector.connect(**config)
    return g.db


@app.teardown_appcontext
def close_db(exc=None):
    """Close the database connection at the end of every request."""
    db = g.pop("db", None)
    if db is not None and db.is_connected():
        db.close()


def query(sql: str, params: tuple = (), *, fetchone: bool = False,
          fetchall: bool = False, commit: bool = False):
    """
    Thin wrapper around mysql.connector that handles cursor lifecycle.

    Parameters
    ----------
    sql       : SQL statement to execute
    params    : Tuple of bind parameters (use %s placeholders)
    fetchone  : Return a single row dict (or None)
    fetchall  : Return a list of row dicts
    commit    : Commit the transaction after execution

    Returns
    -------
    dict | list[dict] | int | None
        - fetchone  → dict or None
        - fetchall  → list of dicts
        - commit    → lastrowid (int)
        - otherwise → None
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(sql, params)
        if fetchone:
            return cursor.fetchone()
        if fetchall:
            return cursor.fetchall()
        if commit:
            db.commit()
            return cursor.lastrowid
        return None
    except Exception:
        db.rollback()
        raise
    finally:
        cursor.close()


# ══════════════════════════════════════════════════════════════════════════════
# SCHEMA INITIALISATION
# ══════════════════════════════════════════════════════════════════════════════

def init_db():
    """
    Run database/schema.sql against the connected MySQL server.

    The schema file uses ``CREATE TABLE IF NOT EXISTS`` and
    ``INSERT IGNORE`` semantics so it is safe to execute on every
    startup — existing data is never overwritten.

    Multi-statement SQL (separated by ``;``) is split and executed one
    statement at a time because mysql-connector-python does not support
    ``multi=True`` in all configurations.
    """
    schema_path = os.path.join(os.path.dirname(__file__), "database", "schema.sql")
    if not os.path.exists(schema_path):
        logger.warning("Schema file not found at %s — skipping init.", schema_path)
        return

    logger.info("Initialising database schema from %s …", schema_path)

    with open(schema_path, "r", encoding="utf-8") as fh:
        raw_sql = fh.read()

    # Connect without specifying a database so we can run CREATE DATABASE
    config = get_db_config()
    init_config = {**config, "database": None}
    conn = mysql.connector.connect(**init_config)
    cursor = conn.cursor()

    try:
        # Split on semicolons, skip blank / comment-only chunks
        statements = [s.strip() for s in raw_sql.split(";") if s.strip()]
        for stmt in statements:
            # Skip pure comment blocks
            if stmt.startswith("--") and "\n" not in stmt:
                continue
            try:
                cursor.execute(stmt)
                conn.commit()
            except mysql.connector.errors.ProgrammingError as exc:
                # Ignore "table already exists" and similar idempotency errors
                if exc.errno in (1007, 1050, 1304, 1060, 1061):
                    logger.debug("Skipping (already exists): %s", exc.msg)
                else:
                    logger.warning("Schema statement warning: %s", exc)
            except Exception as exc:
                logger.warning("Schema statement skipped: %s", exc)

        logger.info("Database schema initialisation complete.")
    finally:
        cursor.close()
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# UTILITY HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def ok(data=None, status: int = 200, **kwargs):
    """Return a JSON success response."""
    payload = {"success": True}
    if data is not None:
        payload["data"] = data
    payload.update(kwargs)
    return jsonify(payload), status


def err(message: str, status: int = 400):
    """Return a JSON error response."""
    return jsonify({"success": False, "error": message}), status


def hash_password(plain: str) -> str:
    """Return a bcrypt hash of *plain*."""
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def check_password(plain: str, hashed: str) -> bool:
    """Return True if *plain* matches the bcrypt *hashed* value."""
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


def require_json(*fields):
    """
    Decorator factory that validates the request body contains JSON with
    the specified required fields.  Injects the parsed body as the first
    positional argument to the wrapped view function.
    """
    def decorator(fn):
        from functools import wraps

        @wraps(fn)
        def wrapper(*args, **kwargs):
            body = request.get_json(silent=True)
            if body is None:
                return err("Request body must be valid JSON.", 400)
            missing = [f for f in fields if f not in body or body[f] in (None, "")]
            if missing:
                return err(f"Missing required fields: {', '.join(missing)}", 400)
            return fn(body, *args, **kwargs)

        return wrapper
    return decorator


# ══════════════════════════════════════════════════════════════════════════════
# ROUTES — HEALTH
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/health")
def health():
    """
    Health-check endpoint used by Railway's deployment checks.

    Verifies the Flask process is alive and the MySQL connection is
    reachable.  Returns HTTP 200 on success, 503 on database failure.
    """
    try:
        row = query("SELECT 1 AS ok", fetchone=True)
        db_ok = row is not None
    except Exception as exc:
        logger.error("Health check DB error: %s", exc)
        return jsonify({"status": "unhealthy", "db": False}), 503

    return jsonify({
        "status": "healthy",
        "db": db_ok,
        "service": "grababyte-api",
        "version": "1.0.0",
    }), 200


# ══════════════════════════════════════════════════════════════════════════════
# ROUTES — RESTAURANTS
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/restaurants", methods=["GET"])
def get_restaurants():
    """
    GET /api/restaurants

    Returns all active restaurants.

    Response 200
    ------------
    {
      "success": true,
      "data": [
        { "RestaurantID": 1, "Name": "GrabAByte Kitchen",
          "CuisineType": "Multi-Cuisine", "IsActive": true, ... }
      ]
    }
    """
    rows = query(
        "SELECT RestaurantID, Name, CuisineType, IsActive, CreatedAt "
        "FROM Restaurants WHERE IsActive = TRUE ORDER BY RestaurantID",
        fetchall=True,
    )
    # Serialise datetime objects for JSON
    for row in rows:
        if isinstance(row.get("CreatedAt"), datetime):
            row["CreatedAt"] = row["CreatedAt"].isoformat()
    return ok(rows)


@app.route("/api/restaurants/<int:restaurant_id>/menu", methods=["GET"])
def get_restaurant_menu(restaurant_id: int):
    """
    GET /api/restaurants/<id>/menu

    Returns all menu items for a specific restaurant.

    Response 200
    ------------
    {
      "success": true,
      "data": [
        { "MenuItemID": 1, "Name": "Double Smash Burger",
          "Price": "249.00", "StockQuantity": 50, "Category": "burgers" }
      ]
    }
    """
    # Verify the restaurant exists
    restaurant = query(
        "SELECT RestaurantID, Name FROM Restaurants WHERE RestaurantID = %s",
        (restaurant_id,),
        fetchone=True,
    )
    if not restaurant:
        return err("Restaurant not found.", 404)

    items = query(
        "SELECT MenuItemID, Name, Price, StockQuantity, Category "
        "FROM MenuItems WHERE RestaurantID = %s ORDER BY Category, Name",
        (restaurant_id,),
        fetchall=True,
    )
    # Convert Decimal to float for JSON serialisation
    for item in items:
        item["Price"] = float(item["Price"])

    return ok(items, restaurant=restaurant["Name"])


# ══════════════════════════════════════════════════════════════════════════════
# ROUTES — CUSTOMERS (AUTH)
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/customers/register", methods=["POST"])
@require_json("name", "email", "password")
def register_customer(body: dict):
    """
    POST /api/customers/register

    Create a new customer account.  Passwords are hashed with bcrypt
    before storage — plain-text passwords are never persisted.

    Request body
    ------------
    {
      "name":     "Raj Patel",
      "email":    "raj@example.com",
      "phone":    "+91-9876543210",   // optional
      "password": "secret"
    }

    Response 201
    ------------
    {
      "success": true,
      "data": { "CustomerID": 5, "Name": "Raj Patel",
                "Email": "raj@example.com", "WalletBalance": 5000.00 }
    }
    """
    name     = body["name"].strip()
    email    = body["email"].strip().lower()
    password = body["password"]
    phone    = body.get("phone", "").strip() or None

    # Validate password length
    if len(password) < 4:
        return err("Password must be at least 4 characters.", 400)

    # Check for duplicate email
    existing = query(
        "SELECT CustomerID FROM Customers WHERE Email = %s",
        (email,),
        fetchone=True,
    )
    if existing:
        return err("An account with this email already exists.", 409)

    password_hash = hash_password(password)

    customer_id = query(
        "INSERT INTO Customers (Name, Email, PasswordHash, Phone) "
        "VALUES (%s, %s, %s, %s)",
        (name, email, password_hash, phone),
        commit=True,
    )

    logger.info("New customer registered: %s (ID %s)", email, customer_id)

    return ok({
        "CustomerID":     customer_id,
        "Name":           name,
        "Email":          email,
        "WalletBalance":  5000.00,
    }, status=201)


@app.route("/api/customers/login", methods=["POST"])
@require_json("email", "password")
def login_customer(body: dict):
    """
    POST /api/customers/login

    Authenticate a customer and return a session token.

    The session token is stored in the ``AuthSessions`` table and must
    be passed as ``Authorization: Bearer <token>`` on subsequent
    authenticated requests.

    Request body
    ------------
    { "email": "raj@example.com", "password": "secret" }

    Response 200
    ------------
    {
      "success": true,
      "data": {
        "token": "uuid-session-token",
        "customer": { "CustomerID": 1, "Name": "Raj Patel",
                      "Email": "...", "WalletBalance": 4750.00 }
      }
    }
    """
    email    = body["email"].strip().lower()
    password = body["password"]

    customer = query(
        "SELECT CustomerID, Name, Email, PasswordHash, Phone, WalletBalance "
        "FROM Customers WHERE Email = %s",
        (email,),
        fetchone=True,
    )

    if not customer or not check_password(password, customer["PasswordHash"]):
        return err("Invalid email or password.", 401)

    # Create a server-side session (expires in 7 days)
    token      = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(days=7)

    query(
        "INSERT INTO AuthSessions (SessionID, CustomerID, ExpiresAt) "
        "VALUES (%s, %s, %s)",
        (token, customer["CustomerID"], expires_at),
        commit=True,
    )

    logger.info("Customer logged in: %s (ID %s)", email, customer["CustomerID"])

    return ok({
        "token": token,
        "customer": {
            "CustomerID":    customer["CustomerID"],
            "Name":          customer["Name"],
            "Email":         customer["Email"],
            "Phone":         customer["Phone"],
            "WalletBalance": float(customer["WalletBalance"]),
        },
    })


@app.route("/api/customers/<int:customer_id>", methods=["GET"])
def get_customer(customer_id: int):
    """
    GET /api/customers/<id>

    Fetch a customer's public profile (no password hash returned).

    Response 200
    ------------
    {
      "success": true,
      "data": { "CustomerID": 1, "Name": "Raj Patel",
                "Email": "...", "Phone": "...",
                "WalletBalance": 4750.00, "CreatedAt": "..." }
    }
    """
    customer = query(
        "SELECT CustomerID, Name, Email, Phone, WalletBalance, CreatedAt "
        "FROM Customers WHERE CustomerID = %s",
        (customer_id,),
        fetchone=True,
    )
    if not customer:
        return err("Customer not found.", 404)

    if isinstance(customer.get("CreatedAt"), datetime):
        customer["CreatedAt"] = customer["CreatedAt"].isoformat()
    customer["WalletBalance"] = float(customer["WalletBalance"])

    return ok(customer)


# ══════════════════════════════════════════════════════════════════════════════
# ROUTES — ORDERS
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/orders", methods=["POST"])
@require_json("customer_id", "restaurant_id", "items")
def create_order(body: dict):
    """
    POST /api/orders

    Place a new order by calling the ``PlaceSecureOrder`` stored
    procedure.  The procedure handles stock validation, wallet deduction,
    driver assignment, and all OrderDetails inserts inside a single
    ACID-compliant transaction.

    Request body
    ------------
    {
      "customer_id":   1,
      "restaurant_id": 1,
      "items": [
        { "menuItemId": 1, "quantity": 2 },
        { "menuItemId": 3, "quantity": 1 }
      ]
    }

    Response 201
    ------------
    {
      "success": true,
      "data": {
        "OrderID": 7, "TotalAmount": 647.00,
        "AssignedDriverID": 2, "TransactionStatus": "SUCCESS"
      }
    }
    """
    customer_id   = body["customer_id"]
    restaurant_id = body["restaurant_id"]
    items         = body["items"]

    if not isinstance(items, list) or len(items) == 0:
        return err("items must be a non-empty array.", 400)

    # Validate each item has the required keys
    for item in items:
        if "menuItemId" not in item or "quantity" not in item:
            return err("Each item must have 'menuItemId' and 'quantity'.", 400)
        if not isinstance(item["quantity"], int) or item["quantity"] < 1:
            return err("Item quantity must be a positive integer.", 400)

    items_json = json.dumps(items)

    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.callproc("PlaceSecureOrder", [customer_id, restaurant_id, items_json])
        # Fetch the result set returned by the stored procedure
        result = None
        for result_set in cursor.stored_results():
            result = result_set.fetchone()
        db.commit()
    except mysql.connector.errors.DatabaseError as exc:
        db.rollback()
        msg = exc.msg if hasattr(exc, "msg") else str(exc)
        # Surface user-friendly messages from the procedure's SIGNAL statements
        if "INSUFFICIENT_STOCK" in msg:
            return err("One or more items are out of stock.", 409)
        if "INSUFFICIENT_FUNDS" in msg:
            return err("Insufficient wallet balance for this order.", 402)
        if "NO_DRIVER" in msg:
            return err("No delivery drivers are currently available.", 503)
        logger.error("PlaceSecureOrder error: %s", exc)
        return err("Order could not be placed. Please try again.", 500)
    finally:
        cursor.close()

    if not result:
        return err("Order placement returned no result.", 500)

    logger.info(
        "Order placed: ID %s, customer %s, total ₹%s",
        result.get("OrderID"), customer_id, result.get("TotalAmount"),
    )

    return ok({
        "OrderID":           result["OrderID"],
        "TotalAmount":       float(result["TotalAmount"]),
        "AssignedDriverID":  result["AssignedDriverID"],
        "TransactionStatus": result["TransactionStatus"],
        "Message":           result["Message"],
    }, status=201)


@app.route("/api/orders/<int:order_id>", methods=["GET"])
def get_order(order_id: int):
    """
    GET /api/orders/<id>

    Fetch full order details including all line items, restaurant name,
    and assigned driver name.

    Response 200
    ------------
    {
      "success": true,
      "data": {
        "OrderID": 7, "Status": "Confirmed", "TotalAmount": 647.00,
        "CreatedAt": "2025-01-01T12:00:00",
        "RestaurantName": "GrabAByte Kitchen",
        "DriverName": "Vikram Singh",
        "Items": [
          { "MenuItemID": 1, "Name": "Double Smash Burger",
            "Quantity": 2, "Subtotal": 498.00 }
        ]
      }
    }
    """
    order = query(
        """
        SELECT
            o.OrderID, o.Status, o.TotalAmount, o.CreatedAt,
            r.Name  AS RestaurantName,
            d.Name  AS DriverName
        FROM Orders o
        JOIN Restaurants r ON o.RestaurantID = r.RestaurantID
        LEFT JOIN Drivers d ON o.DriverID = d.DriverID
        WHERE o.OrderID = %s
        """,
        (order_id,),
        fetchone=True,
    )
    if not order:
        return err("Order not found.", 404)

    items = query(
        """
        SELECT
            od.MenuItemID, mi.Name, od.Quantity, od.Subtotal
        FROM OrderDetails od
        JOIN MenuItems mi ON od.MenuItemID = mi.MenuItemID
        WHERE od.OrderID = %s
        """,
        (order_id,),
        fetchall=True,
    )

    if isinstance(order.get("CreatedAt"), datetime):
        order["CreatedAt"] = order["CreatedAt"].isoformat()
    order["TotalAmount"] = float(order["TotalAmount"])
    for item in items:
        item["Subtotal"] = float(item["Subtotal"])

    order["Items"] = items
    return ok(order)


# ══════════════════════════════════════════════════════════════════════════════
# ROUTES — FEEDBACK
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/feedback", methods=["POST"])
@require_json("name", "rating")
def submit_feedback(body: dict):
    """
    POST /api/feedback

    Submit customer feedback.  ``customer_id`` is optional (guests can
    also leave feedback).

    Request body
    ------------
    {
      "customer_id": 1,       // optional
      "name":    "Raj Patel",
      "email":   "raj@example.com",  // optional
      "rating":  5,           // 1–5
      "comment": "Great food!"
    }

    Response 201
    ------------
    { "success": true, "data": { "FeedbackID": 3 } }
    """
    name        = body["name"].strip()
    rating      = body["rating"]
    email       = body.get("email", "").strip() or None
    comment     = body.get("comment", "").strip() or None
    customer_id = body.get("customer_id") or None

    # Validate rating range
    try:
        rating = int(rating)
        if not (1 <= rating <= 5):
            raise ValueError
    except (ValueError, TypeError):
        return err("Rating must be an integer between 1 and 5.", 400)

    # If customer_id provided, verify it exists
    if customer_id is not None:
        exists = query(
            "SELECT CustomerID FROM Customers WHERE CustomerID = %s",
            (customer_id,),
            fetchone=True,
        )
        if not exists:
            customer_id = None  # Gracefully degrade — don't reject the feedback

    feedback_id = query(
        "INSERT INTO Feedback (CustomerID, Name, Email, Rating, Comment) "
        "VALUES (%s, %s, %s, %s, %s)",
        (customer_id, name, email, rating, comment),
        commit=True,
    )

    logger.info("Feedback submitted: ID %s, rating %s/5 from %s", feedback_id, rating, name)

    return ok({"FeedbackID": feedback_id}, status=201)


# ══════════════════════════════════════════════════════════════════════════════
# ERROR HANDLERS
# ══════════════════════════════════════════════════════════════════════════════

@app.errorhandler(404)
def not_found(exc):
    return err("The requested endpoint does not exist.", 404)


@app.errorhandler(405)
def method_not_allowed(exc):
    return err("HTTP method not allowed for this endpoint.", 405)


@app.errorhandler(500)
def internal_error(exc):
    logger.exception("Unhandled server error")
    return err("An unexpected server error occurred.", 500)


# ══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # Initialise the database schema before accepting requests
    try:
        init_db()
    except Exception as exc:
        logger.error("Database initialisation failed: %s", exc)
        # Don't crash — the DB might not be ready yet on first deploy;
        # Railway will restart the container and retry.

    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV", "production") == "development"

    logger.info("Starting GrabAByte API on port %s (debug=%s)", port, debug)
    app.run(host="0.0.0.0", port=port, debug=debug)
