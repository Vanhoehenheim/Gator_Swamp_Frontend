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
        const response = await authFetch(`${config.apiUrl}/comment/post?postId=${postId}`, {
             bypassCache: true 
        });
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

    voteComment: async (commentId, userId, voteDirection, authFetch) => {
        let apiPayload = {
            commentId,
            userId,
            isUpvote: false, // Default
            removeVote: false // Default
        };

        if (voteDirection === 'up') {
            apiPayload.isUpvote = true;
            apiPayload.removeVote = false;
        } else if (voteDirection === 'down') {
            apiPayload.isUpvote = false;
            apiPayload.removeVote = false;
        } else if (voteDirection === 'none') {
            // When removing a vote, the backend actor determines the original vote type.
            // Setting isUpvote to false here is a neutral choice; removeVote:true is the key.
            apiPayload.isUpvote = false; 
            apiPayload.removeVote = true;
        }

        const response = await authFetch(`${config.apiUrl}/comment/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiPayload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Failed to vote on comment - Response:', response.status, errorBody);
            throw new Error(`Failed to vote on comment: ${response.status} ${errorBody}`);
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