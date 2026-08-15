import axios from 'axios';

// Dynamically determine the backend API base URL
// In development: defaults to localhost (e.g. http://localhost:5004/api or http://localhost:5000/api)
// In production (Vercel): uses VITE_API_URL environment variable
const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL) {
        const url = import.meta.env.VITE_API_URL.trim().replace(/\/$/, '');
        return url.endsWith('/api') ? url : `${url}/api`;
    }
    return 'http://localhost:5004/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 403 && error.response?.data?.isBlocked) {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login?blocked=true';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
