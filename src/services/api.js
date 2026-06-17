import axios from 'axios';

// Membuat instance Axios dengan base URL produksi
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://sewaki-production.up.railway.app',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Menambahkan Request Interceptor untuk menyisipkan token Authorization secara otomatis
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
