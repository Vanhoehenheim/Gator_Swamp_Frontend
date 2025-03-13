import config from '../config';

export const feedService = {
    getUserFeed: async (userId, authFetch) => {
        try {
            const response = await authFetch(`${config.apiUrl}/user/feed?userId=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch user feed');
            }
            
            return response.json();
        } catch (err) {
            console.error('Error fetching user feed:', err);
            return [];
        }
    },

    getRecentPosts: async (authFetch) => {
        const response = await authFetch(`${config.apiUrl}/posts/recent`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load recent posts');
        }
        
        return response.json();
    }
};