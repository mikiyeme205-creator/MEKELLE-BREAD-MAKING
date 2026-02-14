// frontend/services/api.js
import axios from 'axios';

// ✅ USE YOUR LIVE BACKEND URL
const API_URL = 'https://mekelle-bread-making.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds (free tier spins down)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
  console.log('Starting Request:', request.url);
  return request;
});

api.interceptors.response.use(response => {
  console.log('Response:', response.data);
  return response;
}, error => {
  console.log('API Error:', error.message);
  return Promise.reject(error);
});

export default api;
