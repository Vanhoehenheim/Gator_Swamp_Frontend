const config = {
    apiUrl: process.env.NODE_ENV === 'production'
        ? 'https://gatorswampbackend-production.up.railway.app'
        : 'http://localhost:8080',
    getBaseUrl: () => {
        return process.env.NODE_ENV === 'production'
            ? 'https://gatorswampbackend-production.up.railway.app'
            : 'http://localhost:8080';
    }
};

export default config;