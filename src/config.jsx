const config = {
    apiUrl: process.env.NODE_ENV === 'production'
        ? 'https://gator-swamp-frontend.vercel.app'
        : 'http://localhost:8080',
    getBaseUrl: () => {
        return process.env.NODE_ENV === 'production'
            ? 'https://gator-swamp-frontend.vercel.app'
            : 'http://localhost:8080';
    }
};

export default config;