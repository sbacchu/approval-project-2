import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
});

api.interceptors.request.use((config) => {
    const user = localStorage.getItem('dev_user') || 'alice';
    config.headers['X-Dev-User'] = user;
    return config;
});

export default api;
