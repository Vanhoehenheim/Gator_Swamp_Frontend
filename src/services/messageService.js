import config from '../config';

export const messageService = {
    getMessages: async (userId, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/messages?userId=${userId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch messages: ${response.status}`);
        }
        return response.json();
    },

    sendMessage: async (messageData, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messageData)
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }
        return response.json();
    },

    markAsRead: async (partnerId, userId, messageIds, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/messages/read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fromId: partnerId,
                toId: userId,
                messageIds
            })
        });

        if (!response.ok) {
            throw new Error('Failed to mark messages as read');
        }
        return response.json();
    },
    
    getUserProfile: async (userId, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/user/profile?userId=${userId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch user profile: ${response.status}`);
        }
        return response.json();
    }
};