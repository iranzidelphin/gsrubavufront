const fallbackApiBaseUrl =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://gsrubavuback.onrender.com/api'
    : 'http://localhost:3002/api';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || fallbackApiBaseUrl;
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export function getStoredToken() {
  return localStorage.getItem('authToken') || '';
}

export function getStoredUser() {
  const savedUser = localStorage.getItem('user');
  return savedUser ? JSON.parse(savedUser) : null;
}

export function saveAuthSession(token, user) {
  localStorage.setItem('authToken', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
}

export function getDashboardRoute(role) {
  return `/portal/${role || 'student'}`;
}

export function buildFileUrl(fileUrl) {
  if (!fileUrl) {
    return '';
  }

  return `${SERVER_BASE_URL}${fileUrl}`;
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Authorization') && getStoredToken()) {
    headers.set('Authorization', `Bearer ${getStoredToken()}`);
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      `Could not reach the server at ${API_BASE_URL}. Check Vercel VITE_API_BASE_URL and Render CORS settings.`
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export async function apiJson(path, method = 'GET', body) {
  const headers = { 'Content-Type': 'application/json' };

  return apiRequest(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}
