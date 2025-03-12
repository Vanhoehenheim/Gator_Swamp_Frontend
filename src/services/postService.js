import config from '../config';

export const postService = {
    createPost: async (postData, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/post`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to create post');
        }
        return response.json();
    },

    getPost: async (postId, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/post?id=${postId}`);
        if (!response.ok) {
            throw new Error('Failed to load post');
        }
        return response.json();
    },

    getRecentPosts: async (authFetch) => {
        const response = await authFetch(`${config.apiUrl}/posts/recent`);
        if (!response.ok) {
            throw new Error('Failed to load recent posts');
        }
        return response.json();
    },

    votePost: async (postId, userId, isUpvote, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/post/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId.toString(), // Ensure userId is a string
                postId: postId.toString(), // Ensure postId is a string
                isUpvote
            }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to vote');
        }
        return response.json();
    }
};