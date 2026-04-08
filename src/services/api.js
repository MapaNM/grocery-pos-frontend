import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Add token to every request
API.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const { token } = JSON.parse(userInfo);
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API calls
export const login = (credentials) => API.post('/auth/login', credentials);
export const register = (userData) => API.post('/auth/register', userData);
export const getMe = () => API.get('/auth/me');
export const getUsers = () => API.get('/auth/users');

// Products API calls
export const getProducts = (params) => API.get('/products', { params });
export const getProduct = (id) => API.get(`/products/${id}`);
export const getProductByBarcode = (barcode) => API.get(`/products/barcode/${barcode}`);
export const createProduct = (data) => API.post('/products', data);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);
export const deleteProduct = (id) => API.delete(`/products/${id}`);
export const updateStock = (id, data) => API.put(`/products/${id}/stock`, data);

// Sales API calls
export const createSale = (data) => API.post('/sales', data);
export const getSales = (params) => API.get('/sales', { params });
export const getSale = (id) => API.get(`/sales/${id}`);
export const getDailyReport = (date) => API.get('/sales/reports/daily', { params: { date } });
export const getSalesSummary = (params) => API.get('/sales/reports/summary', { params });

// Customers API calls
export const getCustomers = (params) => API.get('/customers', { params });
export const getCustomer = (id) => API.get(`/customers/${id}`);
export const getCustomerByPhone = (phone) => API.get(`/customers/phone/${phone}`);
export const createCustomer = (data) => API.post('/customers', data);
export const updateCustomer = (id, data) => API.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => API.delete(`/customers/${id}`);

export default API;