import config from '../config';

export const profileService = {
    getProfile: async (userId, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/user/profile?userId=${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch profile data');
        }
        return response.json();
    },

    getAllSubreddits: async (authFetch) => {
        const response = await authFetch(`${config.apiUrl}/subreddit`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch subreddits');
        }
        return response.json();
    },

    getAllUsers: async (authFetch) => {
        const response = await authFetch(`${config.apiUrl}/users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        return response.json();
    }
};