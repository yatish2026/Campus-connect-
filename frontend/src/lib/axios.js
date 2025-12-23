import axios from 'axios';
import toast from 'react-hot-toast';

const resolveBaseURL = () => {
  // Allow explicit override at build time
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // During local dev (Vite) requests originate from port 5173. Backend runs on 5000 by default.
  if (import.meta.env.DEV) return 'http://localhost:5000/api';
  // In production use a relative API path so local development and
  // production that serves the frontend from the same origin both work.
  return '/api';
};

const instance = axios.create({
  baseURL: resolveBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// internal flags used by the app to avoid repeated auth redirects/requests
instance.__hasRedirectedToLogin = false;
instance.__authFailed = false;

// allow sending cookies to backend (needed for cookie-based auth)
instance.defaults.withCredentials = true;

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// Add response interceptor for error handling
instance.interceptors.response.use(
  response => response,
  error => {
    if (error.message === 'Network Error') {
      console.error('Backend connection failed:', error);
      toast.error('Unable to connect to the server. Please try again later.');
    } else if (error.response?.status === 401) {
      // Handle unauthorized access. Don't perform a hard redirect here because
      // interceptors can run while React is rendering and cause route flashes.
      // Instead, mark the instance as having an auth failure; App-level logic
      // should read this flag and perform navigation (or show a login UI).
      try {
        localStorage.removeItem('token');
      } catch (e) { }
      instance.__authFailed = true;
      // Keep a separate flag so we avoid multiple attempts to handle the same failure
      if (!instance.__hasRedirectedToLogin) {
        instance.__hasRedirectedToLogin = true;
        console.warn('Auth failed: marked instance.__authFailed. App should handle navigation.');
      }
    } else if (error.response?.status === 404) {
      // Handle not found
      console.error('Resource not found:', error);
    } else {
      // Handle other errors
      console.error('API Error Full:', error);
      console.error('API Error Response:', error.response);
      console.error('API Error Message:', error.message);
    }
    return Promise.reject(error);
  }
);

export const axiosInstance = instance;
export default instance;
