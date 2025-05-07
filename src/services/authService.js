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
                karma: 300,
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
        try {
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
            
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse response:', text);
                throw new Error('Invalid response from server: ' + text);
            }
            
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }
            
            if (!data.userId || !data.token) {
                console.error('Invalid response structure:', data);
                throw new Error('Invalid response structure from server');
            }

            return {
                success: true,
                userId: data.userId,
                token: data.token
            };
        } catch (error) {
            console.error('Login request failed:', error);
            throw error;
        }
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