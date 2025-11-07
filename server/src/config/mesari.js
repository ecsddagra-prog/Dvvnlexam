import axios from 'axios';

const MESARI_CONFIG = {
  baseURL: 'https://api.mesari.com/v1',
  apiKey: process.env.MESARI_API_KEY,
  timeout: 30000
};

export const mesariAPI = axios.create({
  baseURL: MESARI_CONFIG.baseURL,
  timeout: MESARI_CONFIG.timeout,
  headers: {
    'Authorization': `Bearer ${MESARI_CONFIG.apiKey}`,
    'Content-Type': 'application/json'
  }
});

mesariAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Mesari API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default mesariAPI;