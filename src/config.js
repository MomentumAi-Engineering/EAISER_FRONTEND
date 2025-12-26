const API_BASE_URL = import.meta.env.MODE === 'development'
  ? 'http://localhost:8000/api'
  : 'https://eaiser-backend-rf95.onrender.com/api';

export const AUTH_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL
  ?? (import.meta.env.MODE === 'development'
    ? 'http://localhost:5000/api/auth'
    : 'https://eaiser-backend-rf95.onrender.com/api/auth');

export { API_BASE_URL };
export default API_BASE_URL;
