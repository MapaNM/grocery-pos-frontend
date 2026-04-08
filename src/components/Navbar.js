import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import './Navbar.css';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h1>🛒 Mini Mart POS</h1>
      </div>

      <div className="nav-links">
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/pos" className="nav-link">POS</Link>
        {userInfo?.role === 'admin' && (
          <Link to="/products" className="nav-link">Products</Link>
        )}
      </div>

      <div className="nav-user">
        <span className="user-name">{userInfo?.name}</span>
        <span className="user-role">({userInfo?.role})</span>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;