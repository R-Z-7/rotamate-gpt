import axios from 'axios';

// Use environment variable for production, fallback to local proxy for development
let baseURL = process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || '';

// If baseURL is provided via env, ensure it has the /api/v1 prefix if not already present
if (baseURL && baseURL !== '/api/v1' && !baseURL.endsWith('/api/v1')) {
    baseURL = baseURL.replace(/\/$/, '') + '/api/v1';
} else if (!baseURL) {
    baseURL = '/api/v1';
}

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
    return config;
});

export default api;
