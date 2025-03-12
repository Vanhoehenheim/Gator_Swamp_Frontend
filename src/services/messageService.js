import config from '../config';

export const messageService = {
    getUserMessages: async (userId, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/messages?userId=${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch messages');
        }
        return response.json();
    },

    getConversation: async (userId, otherUserId, authFetch) => {
        const response = await authFetch(
            `${config.apiUrl}/messages/conversation?userId=${userId}&otherUserId=${otherUserId}`
        );
        if (!response.ok) {
            throw new Error('Failed to fetch conversation');
        }
        return response.json();
    },

    sendMessage: async (messageData, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messageData),
        });
        if (!response.ok) {
            throw new Error('Failed to send message');
        }
        return response.json();
    },

    markMessagesAsRead: async (messageData, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/messages/read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messageData),
        });
        if (!response.ok) {
            throw new Error('Failed to mark messages as read');
        }
        return response.json();
    }
};