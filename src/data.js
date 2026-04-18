// =====================================================
// GrabAByte — Application Data (INR ₹ Pricing)
// =====================================================

export const MENU_ITEMS = [
  // ── Western Favourites ──
  {
    id: 1,
    name: 'Double Smash Burger',
    description: 'Two 100% beef patties, cheddar, house sauce on a brioche bun.',
    price: 249,
    image: '/images/burger-cute.png',
    category: 'burgers',
    stock: 50,
  },
  {
    id: 2,
    name: 'Spicy Chicken Sandwich',
    description: 'Crispy fried chicken, spicy mayo, pickles, and lettuce.',
    price: 199,
    image: '/images/sandwich-cute.png',
    category: 'sandwiches',
    stock: 40,
  },
  {
    id: 3,
    name: 'Truffle Fries',
    description: 'Crispy golden fries tossed in truffle oil and parmesan.',
    price: 149,
    image: '/images/fries-cute.png',
    category: 'sides',
    stock: 100,
  },
  {
    id: 4,
    name: 'Neapolitan Pizza',
    description: 'Wood-fired crust, San Marzano tomato, fresh mozzarella.',
    price: 349,
    image: '/images/pizza-cute.png',
    category: 'pizza',
    stock: 30,
  },
  {
    id: 5,
    name: 'Organic Kale Salad',
    description: 'Fresh kale, quinoa, avocado, lemon vinaigrette dressing.',
    price: 199,
    image: '/images/salad-cute.png',
    category: 'salads',
    stock: 25,
  },
  {
    id: 6,
    name: 'Death by Chocolate Cake',
    description: 'Rich triple-layer chocolate ganache cake with cream.',
    price: 179,
    image: '/images/cake-cute.png',
    category: 'desserts',
    stock: 35,
  },
  // ── Indian Specials ──
  {
    id: 7,
    name: 'Mumbai Vada Pav',
    description: 'Spiced potato fritter in a soft pav with chutneys.',
    price: 49,
    emoji: '🥔',
    category: 'indian',
    stock: 200,
  },
  {
    id: 8,
    name: 'Butter Chicken',
    description: 'Creamy tomato-butter gravy with tender tandoori chicken.',
    price: 299,
    emoji: '🍗',
    category: 'indian',
    stock: 40,
  },
  {
    id: 9,
    name: 'Paneer Tikka',
    description: 'Chargrilled cottage cheese marinated in spiced yogurt.',
    price: 249,
    emoji: '🧀',
    category: 'indian',
    stock: 35,
  },
  {
    id: 10,
    name: 'Masala Dosa',
    description: 'Crispy rice crepe stuffed with spiced potato filling.',
    price: 129,
    emoji: '🫓',
    category: 'indian',
    stock: 60,
  },
  {
    id: 11,
    name: 'Hyderabadi Biryani',
    description: 'Fragrant basmati rice layered with spiced lamb and saffron.',
    price: 219,
    emoji: '🍚',
    category: 'indian',
    stock: 50,
  },
  {
    id: 12,
    name: 'Samosa Plate (4pc)',
    description: 'Crispy golden pastries filled with spiced potatoes and peas.',
    price: 59,
    emoji: '🥟',
    category: 'indian',
    stock: 150,
  },
];

export const CATEGORIES = [
  { name: 'Burgers',    emoji: '🍔', color: '#FF6B35' },
  { name: 'Pizza',      emoji: '🍕', color: '#3CCF4E' },
  { name: 'Indian',     emoji: '🍛', color: '#FF2D7B' },
  { name: 'Sides',      emoji: '🍟', color: '#FFE156' },
  { name: 'Salads',     emoji: '🥗', color: '#3CCF4E' },
  { name: 'Desserts',   emoji: '🍰', color: '#FF6B35' },
  { name: 'Sandwiches', emoji: '🥪', color: '#FF2D7B' },
];

// SQL Transaction steps shown in the checkout visualizer
export const TRANSACTION_STEPS = [
  { step: 1, label: 'START TRANSACTION',    sql: 'START TRANSACTION;',                                                     icon: '🔒', description: 'Begin atomic operation — all changes succeed or all fail.' },
  { step: 2, label: 'Lock Menu Items',      sql: 'SELECT * FROM MenuItems WHERE ... FOR UPDATE;',                          icon: '🔍', description: 'Row-level exclusive lock acquired. Other transactions must WAIT.' },
  { step: 3, label: 'Validate Stock',       sql: 'IF StockQuantity < Quantity → SIGNAL ROLLBACK',                          icon: '📦', description: 'Checking if items are still in stock (under lock).' },
  { step: 4, label: 'Check Wallet Balance', sql: 'SELECT WalletBalance FROM Customers FOR UPDATE;',                        icon: '💰', description: 'Locking customer row to prevent wallet overdraft.' },
  { step: 5, label: 'Assign Driver',        sql: "SELECT DriverID FROM Drivers WHERE Status='Available' LIMIT 1 FOR UPDATE;", icon: '🚗', description: 'Locking driver row — prevents double-assignment.' },
  { step: 6, label: 'Execute Writes',       sql: 'UPDATE Customers, Drivers; INSERT Orders, OrderDetails; UPDATE MenuItems;', icon: '✍️', description: 'All state changes applied atomically within the transaction.' },
  { step: 7, label: 'COMMIT',               sql: 'COMMIT;',                                                                icon: '✅', description: 'All changes are now permanent & durable. Locks released!' },
];

// Order status progression for track-order page
export const ORDER_STATUSES = [
  'Confirmed',
  'Preparing',
  'Out for Delivery',
  'Delivered',
];
