import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://startev-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('employee_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/login')) {
      localStorage.removeItem('employee_token');
      localStorage.removeItem('employee_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
