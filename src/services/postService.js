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

    votePost: async (postId, userId, isUpvote, isRemovingVote = false, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/post/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId.toString(), // Ensure userId is a string
                postId: postId.toString(), // Ensure postId is a string
                isUpvote,
                removeVote: isRemovingVote // New parameter to handle vote toggling
            }),
        });

        if (!response.ok) {
            // Handle 409 conflict specially for "Already voted" messages
            if (response.status === 409) {
                const text = await response.text();
                throw new Error(text);
            }
            
            try {
                const data = await response.json();
                throw new Error(data.error || 'Failed to vote');
            } catch (jsonError) {
                // If response is not valid JSON, use status text
                throw new Error(`Failed to vote: ${response.statusText}`);
            }
        }
        return response.json();
    }
};