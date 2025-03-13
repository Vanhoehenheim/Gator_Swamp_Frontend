import config from '../config';

export const commentService = {
    createComment: async (commentData, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(commentData),
        });

        if (!response.ok) {
            throw new Error('Failed to post comment');
        }
        return response.json();
    },

    getPostComments: async (postId, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/comment/post?postId=${postId}`);
        if (!response.ok) {
            throw new Error('Failed to load comments');
        }
        return response.json();
    },

    getComment: async (commentId, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/comment?commentId=${commentId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch comment');
        }
        return response.json();
    },

    editComment: async (commentData, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/comment`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(commentData),
        });

        if (!response.ok) {
            throw new Error('Failed to edit comment');
        }
        return response.json();
    },

    voteComment: async (commentId, userId, isUpvote, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/comment/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                commentId,
                userId,
                isUpvote
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to vote on comment');
        }
        return response.json();
    },

    getChildComments: async (commentId, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/comment?commentId=${commentId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch child comment');
        }
        return response.json();
    },

    markCommentsAsRead: async (partnerId, userId, messageIds, authFetch) => {
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
    }
};