import config from '../config';

export const messageService = {
    getMessages: async (userId, authFetch) => {
        try {
            const response = await authFetch(`${config.apiUrl}/messages?userId=${userId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch messages: ${response.status}`);
            }

            const text = await response.text();
            try {
                const data = JSON.parse(text);
                return Array.isArray(data) ? data : [];
            } catch (e) {
                console.error('Failed to parse messages response:', text);
                return [];
            }
        } catch (error) {
            console.error('Error in getMessages:', error);
            throw error;
        }
    },

    sendMessage: async (messageData, authFetch) => {
        try {
            const response = await authFetch(`${config.apiUrl}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Convert to PascalCase for backend
                body: JSON.stringify({
                    fromId: messageData.fromId,
                    toId: messageData.toId,
                    content: messageData.content
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse send message response:', text);
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Error in sendMessage:', error);
            throw error;
        }
    },

    markAsRead: async (partnerId, userId, messageIds, authFetch) => {
        try {
            const response = await authFetch(`${config.apiUrl}/messages/read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messageIds, // Send all message IDs as an array
                    userId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to mark messages as read');
            }

            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse mark as read response:', text);
                return null;
            }
        } catch (error) {
            console.error('Error in markAsRead:', error);
            throw error;
        }
    },
    
    getUserProfile: async (userId, authFetch) => {
        try {
            if (!userId) {
                console.warn('Attempted to fetch profile with undefined userId');
                return { username: 'Unknown User' };
            }
            
            const response = await authFetch(`${config.apiUrl}/user/profile?userId=${userId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch user profile: ${response.status}`);
            }

            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse user profile response:', text);
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Error in getUserProfile:', error);
            return { username: 'Unknown User' };
        }
    }
};