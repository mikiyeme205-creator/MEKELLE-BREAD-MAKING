// frontend/config/api.js
export const API_BASE_URL = 'https://mekelle-bread-making.onrender.com';
export const API_URL = `${API_BASE_URL}/api`;

// Cache for server status
let serverAwake = false;
let lastWakeCall = 0;

// Wake up server function with cache
export const wakeUpServer = async (force = false) => {
  // If server was awake in last 5 minutes, don't wake again
  const now = Date.now();
  if (!force && serverAwake && (now - lastWakeCall) < 300000) {
    console.log('✅ Server already awake');
    return true;
  }

  try {
    console.log('🌐 Waking up server...');
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
    });
    
    if (response.ok) {
      serverAwake = true;
      lastWakeCall = now;
      console.log('✅ Server is awake!');
      return true;
    }
    return false;
  } catch (error) {
    console.log('⚠️ Server waking...', error.message);
    return false;
  }
};

// API request wrapper with auto-wake
export const apiRequest = async (endpoint, options = {}) => {
  // Try to wake server if needed
  await wakeUpServer();
  
  const url = `${API_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  return response;
};
