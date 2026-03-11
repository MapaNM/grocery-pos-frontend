# 🛒 Grocery POS System - Frontend

React-based frontend for the Grocery POS system with Redux state management.

## 🚀 Features

- Beautiful, modern UI design
- User authentication with protected routes
- Real-time dashboard with statistics
- Point of Sale interface (coming soon)
- Product search and barcode scanning
- Shopping cart management
- Receipt generation
- Customer lookup
- Responsive design

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API running on http://localhost:5001

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure API URL

The app is configured to connect to backend at `http://localhost:5001`

If your backend runs on a different port, update `src/services/api.js`:
```javascript
const API = axios.create({
  baseURL: 'http://localhost:YOUR_PORT/api',
});
```

### 4. Start the development server
```bash
npm start
```

App will run on `http://localhost:3000`

## 🔐 Default Login Credentials

**Admin:**
- Email: `admin@grocery.com`
- Password: `admin123`

**Cashier:**
- Email: `cashier@grocery.com`
- Password: `cashier123`

## 📁 Project Structure
```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/        # Reusable components
│   │   ├── Navbar.js
│   │   └── Navbar.css
│   ├── pages/             # Page components
│   │   ├── Login.js
│   │   ├── Login.css
│   │   ├── Dashboard.js
│   │   └── Dashboard.css
│   ├── redux/             # State management
│   │   ├── slices/
│   │   │   ├── authSlice.js
│   │   │   └── cartSlice.js
│   │   └── store.js
│   ├── services/          # API calls
│   │   └── api.js
│   ├── App.js             # Main component
│   ├── App.css            # Global styles
│   └── index.js           # Entry point
└── package.json
```

## 🎨 Pages

### Login Page
- Beautiful gradient background
- Email/password authentication
- Demo credentials displayed
- Form validation
- Success/error notifications

### Dashboard
- Today's sales statistics
- Total sales, transactions, items sold
- Low stock alerts
- Recent transactions
- Payment method breakdown

### POS (Coming Soon)
- Product search and barcode scanning
- Shopping cart
- Payment processing
- Receipt generation

## 🎨 Technologies Used

- **React** - UI library
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Toastify** - Notifications
- **CSS3** - Styling

## 🔒 Protected Routes

Routes like `/dashboard` and `/pos` are protected and require authentication.

Users are automatically redirected to `/login` if not authenticated.

## 🎨 UI Features

- Gradient purple design theme
- Responsive layout
- Modern card-based interface
- Real-time data updates
- Toast notifications
- Loading states
- Error handling

## 🔗 Backend Repository

[Link to Backend Repository]

## 📝 Available Scripts
```bash
npm start       # Run development server
npm build       # Build for production
npm test        # Run tests
```

## 📝 License

MIT

## 👨‍💻 Author

Your Name
