import axios from 'axios';

// Centralized API Client with default configuration
export const apiClient = axios.create({
    timeout: 15000, // 15 seconds timeout to prevent hanging requests
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor for global error handling and logging
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Extract context for debugging
        const url = error.config?.url;
        const method = error.config?.method?.toUpperCase();

        // Log localized error warning
        console.warn(`Checking API Error [${method} ${url}]:`, error.message);

        // Handle Timeouts specifically
        if (error.code === 'ECONNABORTED') {
            console.error(`❌ API Request Timed Out (${error.config?.timeout}ms):`, url);
            // You could optionally trigger a global toast here if you had access to the store/UI context
        }

        // Pass the error through for local components to handle (e.g., showing retry buttons)
        return Promise.reject(error);
    }
);
