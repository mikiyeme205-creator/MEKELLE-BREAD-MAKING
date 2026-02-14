// frontend/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ YOUR LIVE BACKEND URL
export const API_BASE_URL = 'https://mekelle-bread-making.onrender.com';
export const API_URL = `${API_BASE_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds (handles Render free tier spin-down)
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 🚀 Request interceptor - Adds auth token to every request
api.interceptors.request.use(
  async (config) => {
    // Get token from storage
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error getting token:', error);
    }

    // Log request in development
    if (__DEV__) {
      console.log('🚀 API Request:', {
        url: config.url,
        method: config.method,
        data: config.data,
        headers: config.headers,
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 📥 Response interceptor - Handles errors globally
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (__DEV__) {
      console.log('✅ API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  async (error) => {
    // Log error in development
    if (__DEV__) {
      console.log('❌ API Error:', {
        url: error.config?.url,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    }

    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 401: // Unauthorized
          // Clear invalid token
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userData');
          // You can emit an event here to redirect to login
          break;
          
        case 403: // Forbidden
          console.log('Access forbidden');
          break;
          
        case 404: // Not found
          console.log('Resource not found');
          break;
          
        case 500: // Server error
          console.log('Server error');
          break;
          
        case 503: // Service unavailable (server waking up)
          console.log('Server is waking up, retrying...');
          // Wait 2 seconds and retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          return api(error.config);
      }
    } else if (error.request) {
      // Request made but no response (server down or network issue)
      console.log('No response from server - may be waking up');
      
      // Check if it's the first request (server might be spinning up)
      if (error.config && !error.config._retry) {
        error.config._retry = true;
        // Wait 3 seconds for server to wake up
        await new Promise(resolve => setTimeout(resolve, 3000));
        return api(error.config);
      }
    }

    return Promise.reject(error);
  }
);

// 🛒 Product APIs
export const productAPI = {
  // Get all products
  getAll: () => api.get('/products'),
  
  // Get single product
  getById: (id) => api.get(`/products/${id}`),
  
  // Get products by category
  getByCategory: (category) => api.get(`/products/category/${category}`),
  
  // Search products
  search: (query) => api.get(`/products/search?q=${query}`),
};

// 👤 Auth APIs
export const authAPI = {
  // Login
  login: (phone, password) => api.post('/auth/login', { phone, password }),
  
  // Register
  register: (userData) => api.post('/auth/register', userData),
  
  // Logout
  logout: async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  },
  
  // Get current user
  getCurrentUser: () => api.get('/auth/me'),
  
  // Update profile
  updateProfile: (data) => api.put('/auth/profile', data),
  
  // Change password
  changePassword: (oldPassword, newPassword) => 
    api.post('/auth/change-password', { oldPassword, newPassword }),
};

// 📦 Order APIs
export const orderAPI = {
  // Create new order
  create: (orderData) => api.post('/orders', orderData),
  
  // Get user orders
  getMyOrders: () => api.get('/orders/my-orders'),
  
  // Get order by ID
  getById: (orderId) => api.get(`/orders/${orderId}`),
  
  // Track order
  trackOrder: (orderId) => api.get(`/orders/${orderId}/track`),
  
  // Cancel order
  cancel: (orderId) => api.put(`/orders/${orderId}/cancel`),
  
  // Reorder previous order
  reorder: (orderId) => api.post(`/orders/${orderId}/reorder`),
};

// 💳 Payment APIs
export const paymentAPI = {
  // Get all payment methods
  getMethods: () => api.get('/payments/methods'),
  
  // Process payment
  process: (paymentData) => api.post('/payments/process', paymentData),
  
  // Verify payment
  verify: (orderId) => api.get(`/payments/verify/${orderId}`),
  
  // Get payment status
  getStatus: (orderId) => api.get(`/payments/status/${orderId}`),
};

// 📍 Address APIs
export const addressAPI = {
  // Get user addresses
  getAll: () => api.get('/addresses'),
  
  // Add new address
  add: (addressData) => api.post('/addresses', addressData),
  
  // Update address
  update: (id, addressData) => api.put(`/addresses/${id}`, addressData),
  
  // Delete address
  delete: (id) => api.delete(`/addresses/${id}`),
  
  // Set default address
  setDefault: (id) => api.put(`/addresses/${id}/default`),
};

// 🔔 Notification APIs
export const notificationAPI = {
  // Get notifications
  getAll: () => api.get('/notifications'),
  
  // Mark as read
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  
  // Mark all as read
  markAllAsRead: () => api.put('/notifications/read-all'),
  
  // Get unread count
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

// 📊 Dashboard/Stats APIs (for admin)
export const statsAPI = {
  // Get order stats
  getOrderStats: () => api.get('/stats/orders'),
  
  // Get revenue stats
  getRevenueStats: (period) => api.get(`/stats/revenue?period=${period}`),
  
  // Get popular products
  getPopularProducts: () => api.get('/stats/popular-products'),
};

// 🚀 Server health check
export const healthAPI = {
  // Check server status
  check: () => api.get('/health'),
  
  // Wake up server (for free tier)
  wakeUp: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  },
};

// 📱 Helper function to handle server wake-up
export const wakeUpServer = async () => {
  try {
    console.log('🌐 Waking up server...');
    const start = Date.now();
    const response = await fetch(`${API_BASE_URL}/health`);
    const time = Date.now() - start;
    
    if (response.ok) {
      console.log(`✅ Server awake! (${time}ms)`);
      return true;
    }
    return false;
  } catch (error) {
    console.log('⚠️ Server starting...');
    return false;
  }
};

// 🎯 API response wrapper
export const handleResponse = async (promise, showLoading = true) => {
  try {
    const response = await promise;
    return {
      success: true,
      data: response.data,
      message: response.data.message || 'Success',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status,
    };
  }
};

export default api;
