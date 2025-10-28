import axios from 'axios';
import toast from 'react-hot-toast';

const resolveBaseURL = () => {
  // Allow explicit override at build time
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // During local dev (Vite) requests originate from port 5173. Backend runs on 5000.
  if (import.meta.env.DEV) return 'http://localhost:5000/api';
  // In production when frontend is served by backend, use relative '/api'.
  return '/api';
};

const instance = axios.create({
  baseURL: resolveBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

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
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status === 404) {
      // Handle not found
      console.error('Resource not found:', error);
    } else {
      // Handle other errors
      console.error('API Error:', error);
    }
    return Promise.reject(error);
  }
);

export const axiosInstance = instance;
export default instance;
