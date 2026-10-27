import axios from 'axios';

/**
 * Dynamically resolves the API base URL based on environment or deployment mode.
 * In production/deployment, VITE_API_URL can point to the remote backend service
 * (e.g. https://imovies-backend.onrender.com).
 * In development or monolithic deployments, defaults to '/api'.
 */
export const getApiBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (
    envUrl &&
    typeof envUrl === 'string' &&
    envUrl.trim() &&
    !envUrl.includes('your-backend') &&
    !envUrl.includes('example.com')
  ) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
  return '/api';
};

export const getBackendURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (
    envUrl &&
    typeof envUrl === 'string' &&
    envUrl.trim() &&
    !envUrl.includes('your-backend') &&
    !envUrl.includes('example.com')
  ) {
    return envUrl.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
  return window.location.origin;
};

const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization header & target endpoint header for serverless routing
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('imovies_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['x-auth-token'] = token;
    }
    if (config.url) {
      config.headers['x-imovies-endpoint'] = config.url;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If expired token, clear storage
      if (localStorage.getItem('imovies_token')) {
        localStorage.removeItem('imovies_token');
        localStorage.removeItem('imovies_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
