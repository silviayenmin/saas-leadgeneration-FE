import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mapflow_token') || sessionStorage.getItem('mapflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const isUnauthorized = error.response.status === 401;
      const isSuspended = error.response.status === 403 && 
        (error.response.data?.detail || '').toLowerCase().includes('suspended');
        
      if (isUnauthorized || isSuspended) {
        localStorage.removeItem('mapflow_token');
        localStorage.removeItem('mapflow_user');
        sessionStorage.removeItem('mapflow_token');
        sessionStorage.removeItem('mapflow_user');
        
        if (isSuspended) {
          window.location.reload();
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
