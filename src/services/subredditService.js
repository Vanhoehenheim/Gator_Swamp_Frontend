import config from '../config';

export const subredditService = {
    getSubreddit: async (subredditId, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/subreddit?id=${subredditId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to load subreddit");
        }
        return response.json();
    },

    getMembers: async (subredditId, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/subreddit/members?id=${subredditId}`);
        if (!response.ok) {
            throw new Error("Failed to get membership status");
        }
        return response.json();
    },

    getPosts: async (subredditId, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/post?subredditId=${subredditId}`);
        if (!response.ok) {
            throw new Error("Failed to load posts");
        }
        return response.json();
    },

    joinSubreddit: async (subredditId, userId, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/subreddit/members`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                subredditId,
                userId,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw {
                code: data.Code,
                message: data.Message || "Failed to join subreddit"
            };
        }
        return data;
    },

    createSubreddit: async (subredditData, authFetch) => {
        const response = await authFetch(`${config.apiUrl}/subreddit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(subredditData)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create subreddit');
        }
        return data;
    }
};