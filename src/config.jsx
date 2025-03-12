// API configuration for different environments
const config = {
  // Development API URL (local)
  development: {
    apiUrl: 'http://localhost:8080',
  },
  // Production API URL
  production: {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080', // Fallback to local during build
  },
};

// Use the appropriate configuration based on the environment
const env = import.meta.env.MODE || 'development';
export default config[env];