const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? (import.meta.env.VITE_API_BASE_URL.endsWith('/api') ? import.meta.env.VITE_API_BASE_URL : `${import.meta.env.VITE_API_BASE_URL}/api`)
  : (isLocalhost ? 'http://localhost:8005/api' : 'https://eaiser-backend-rf95.onrender.com/api');

export const AUTH_BASE_URL = (import.meta.env.VITE_REACT_APP_API_URL || import.meta.env.VITE_API_BASE_URL)
  ? (import.meta.env.VITE_REACT_APP_API_URL || import.meta.env.VITE_API_BASE_URL)
  : (isLocalhost ? 'http://localhost:8005/api/auth' : 'https://eaiser-backend-rf95.onrender.com/api/auth');

export { API_BASE_URL };
export default API_BASE_URL;
