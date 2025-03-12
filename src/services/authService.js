import config from '../config';

export const authService = {
    register: async (username, email, password) => {
        const response = await fetch(`${config.apiUrl}/user/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                email,
                password,
                karma: 0,
            }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }
        
        if (data && data.ID) {
            return { success: true, userId: data.ID };
        } else {
            throw new Error('Invalid response from server');
        }
    },

    login: async (email, password) => {
        const response = await fetch(`${config.apiUrl}/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
            }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        return {
            success: true,
            userId: data.userId,
            token: data.token
        };
    },

    getUserProfile: async (userId, token) => {
        const response = await fetch(`${config.apiUrl}/user/profile?userId=${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch profile');
        }
        
        return data;
    }
};