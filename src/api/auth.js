// src/api/auth.js

// Robust frontend auth helper — uses import.meta.env (Vite), process.env (CRA), window.__env (runtime) and falls back to http://localhost:5000 during local development

const getApiBase = () => {
  // runtime-injectable env (optional)
  if (typeof window !== 'undefined' && window.__env && window.__env.REACT_APP_API_BASE_URL) {
    return String(window.__env.REACT_APP_API_BASE_URL).replace(/\/$/, '');
  }

  // Vite (import.meta.env) — accessed safely
  try {
    // import.meta exists in module context; guard with try/catch for safety
    // eslint-disable-next-line no-undef
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
      return String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, '');
    }
  } catch (e) {
    // ignore
  }

  // CRA / other bundlers that replace process.env
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE_URL) {
    return String(process.env.REACT_APP_API_BASE_URL).replace(/\/$/, '');
  }

  // default to backend on localhost during development
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000';
    }
  }

  // fallback to same origin
  return '';
};

const API_BASE = getApiBase();

async function request(path, body) {
  const url = API_BASE ? `${API_BASE}${path}` : path;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || 'Request failed');
    err.response = data;
    throw err;
  }
  return data;
}

// dob removed from signup params and payload
export async function signup({ fullName, email, password }) {
  return request('/api/auth/signup', { fullName, email, password });
}

export async function login({ email, password }) {
  return request('/api/auth/login', { email, password });
}