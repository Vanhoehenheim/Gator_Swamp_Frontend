// API configuration for different environments
const config = {
  // Development API URL (local)
  development: {
    apiUrl: 'http://localhost:8080',
  },
  // Production API URL - update this when you have a production backend
  production: {
    apiUrl: import.meta.env.VITE_API_URL || 'https://your-backend-url.com',
  },
};

// Use the appropriate configuration based on the environment
const env = import.meta.env.MODE || 'development';
export default config[env];