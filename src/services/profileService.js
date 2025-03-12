import config from '../config';

export const profileService = {
    getUserProfile: async (userId, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/user/profile?userId=${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch profile data');
        }
        return response.json();
    },

    getAllUsers: async (authFetch) => {
        const response = await authFetch(`${config.apiUrl}/users`);
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        return response.json();
    },

    getUserFeed: async (userId, limit = 10, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/user/feed?userId=${userId}&limit=${limit}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user feed');
        }
        return response.json();
    }
};