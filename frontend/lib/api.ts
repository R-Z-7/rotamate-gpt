import axios from 'axios';

// Force relative path to use Next.js proxy (bypasses CORS)
const baseURL = '/api/v1';
console.log('API Base URL:', baseURL);

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    // Ensure trailing slash for GET requests to avoid 307 redirects that drop auth
    if (config.method?.toLowerCase() === 'get' && config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
        config.url += '/';
    }
    return config;
});

export default api;
