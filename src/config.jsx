const config = {
    apiUrl: process.env.NODE_ENV === 'production'
        ? 'gatorswampbackend-production.up.railway.app'
        : 'http://localhost:8080',
    getBaseUrl: () => {
        return process.env.NODE_ENV === 'production'
            ? 'gatorswampbackend-production.up.railway.app'
            : 'http://localhost:8080';
    }
};

export default config;