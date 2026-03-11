import React, { useState, useEffect } from 'react';
import { getDailyReport, getProducts } from '../services/api';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = () => {
  const [report, setReport] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const { data: reportData } = await getDailyReport();
      setReport(reportData);

      const { data: productsData } = await getProducts();
      const lowStock = productsData.filter(p => p.quantity <= 10);
      setLowStockProducts(lowStock);
      
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <p>Today's Overview</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>${report?.totalSales?.toFixed(2) || '0.00'}</h3>
            <p>Total Sales</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>{report?.totalTransactions || 0}</h3>
            <p>Transactions</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <h3>{lowStockProducts.length}</h3>
            <p>Low Stock Items</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <h3>Low Stock Alert</h3>
          <div className="low-stock-list">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((product) => (
                <div key={product._id} className="stock-item">
                  <div className="stock-info">
                    <strong>{product.name}</strong>
                    <span className="stock-barcode">{product.barcode}</span>
                  </div>
                  <div className="stock-quantity">
                    <span className="quantity-badge">
                      {product.quantity} {product.unit}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">All products are well stocked</p>
            )}
          </div>
        </div>

        <div className="section">
          <h3>Recent Transactions</h3>
          <div className="transactions-list">
            {report?.sales && report.sales.length > 0 ? (
              report.sales.slice(0, 5).map((sale) => (
                <div key={sale._id} className="transaction-item">
                  <div className="transaction-info">
                    <strong>Sale #{sale._id.slice(-6)}</strong>
                    <span>{new Date(sale.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="transaction-amount">
                    ${sale.total.toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No transactions today</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;