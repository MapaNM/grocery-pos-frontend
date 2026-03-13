import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import store from './redux/store';
import Navbar from './components/Navbar';
import OfflineStatus from './components/OfflineStatus';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import ProductManagement from './pages/ProductManagement';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, userInfo } = useSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (userInfo?.role !== 'admin') {
    toast.error('Admin access required');
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <OfflineStatus />
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/pos" 
              element={
                <ProtectedRoute>
                  <POS />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/products" 
              element={
                <AdminRoute>
                  <ProductManagement />
                </AdminRoute>
              } 
            />
            
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
          
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
          />
        </div>
      </Router>
    </Provider>
  );
}

export default App;