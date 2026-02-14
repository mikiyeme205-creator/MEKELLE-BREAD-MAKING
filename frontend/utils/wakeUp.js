// frontend/utils/wakeUp.js
import api from '../services/api';

export const wakeUpServer = async () => {
  try {
    console.log('🌐 Waking up server...');
    const start = Date.now();
    await api.get('/health');
    const time = Date.now() - start;
    console.log(`✅ Server awake! Response time: ${time}ms`);
    return true;
  } catch (error) {
    console.log('❌ Failed to wake server:', error.message);
    return false;
  }
};
