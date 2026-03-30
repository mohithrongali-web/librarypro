// Generic API fetch wrapper to handle JWT tokens and standard error responses

const API_URL = '/api';

const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            // Handle unauthorized (token expired, etc)
            if (response.status === 401 || response.status === 403) {
                // If not already on index.html
                if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/index.html';
                }
            }
            throw new Error(data?.message || 'Something went wrong');
        }

        return data;
    } catch (error) {
        throw error;
    }
};
