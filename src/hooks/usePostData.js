import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { feedService } from '../services/feedService';
import { postService } from '../services/postService';
import config from '../config'; // Needed for direct fetch in createPost

// Hook to fetch feed posts (personalized or recent)
export function useFeedPosts () {
  const { currentUser, authFetch } = useAuth();
  const userId = currentUser?.id;

  const queryFn = async () => {
    if (!userId) {
      const recentPosts = await feedService.getRecentPosts(authFetch);
      return recentPosts || [];
    }
    
    try {
      const feedData = await feedService.getUserFeed(userId, authFetch);
      if (!feedData || feedData.length === 0) {
        console.log("Personalized feed empty, fetching recent posts as fallback.");
        const recentPosts = await feedService.getRecentPosts(authFetch);
        return recentPosts || [];
      } else {
        return feedData;
      }
    } catch (error) {
      console.error("Error fetching personalized feed, falling back to recent posts:", error);
      try {
        const recentPosts = await feedService.getRecentPosts(authFetch);
        return recentPosts || [];
      } catch (fallbackError) {
        console.error("Error fetching recent posts as fallback:", fallbackError);
        throw new Error('Failed to load any posts.');
      }
    }
  };

  return useQuery({
    queryKey: ['feedPosts', userId], // Key depends on user
    queryFn: queryFn,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook to fetch details for a single post
export function usePost (postId) {
  const { authFetch } = useAuth();
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => postService.getPost(postId, authFetch),
    enabled: !!postId,
    staleTime: 5 * 60 * 1000, // 5 mins
  });
}

// Hook for the mutation to vote on a post
export function useVotePostMutation (options = {}) {
    const { currentUser, authFetch } = useAuth();
    const queryClient = useQueryClient();
    const userId = currentUser?.id;

    return useMutation({
        mutationFn: ({ postId, isUpvote, isRemovingVote }) => {
            if (!userId) throw new Error("User must be logged in to vote.");
            return postService.votePost(postId, userId, isUpvote, isRemovingVote, authFetch);
        },
        
        // Optimistic update for both feed and single post views
        onMutate: async ({ postId, isUpvote, isRemovingVote }) => {

            // Cancel ongoing queries
            await queryClient.cancelQueries({ queryKey: ['feedPosts', userId] });
            await queryClient.cancelQueries({ queryKey: ['post', postId] });

            // Get previous data
            const previousFeedData = queryClient.getQueryData(['feedPosts', userId]);
            const previousPostData = queryClient.getQueryData(['post', postId]);

            // Optimistic update function
            const updatePostVotes = (post) => {
                if (!post) return undefined;

                // Read previous optimistic state, normalizing potential boolean from server
                let previousVote = post.currentUserVote;
                if (previousVote === true) {
                    previousVote = 'up';
                } else if (previousVote === false) {
                    previousVote = 'down';
                } else if (previousVote !== 'up' && previousVote !== 'down') {
                    previousVote = null; // Normalize other values (like undefined) to null
                }

                let newKarma = post.karma || 0;
                let newUpvotes = post.upvotes || 0;
                let newDownvotes = post.downvotes || 0;
                let newCurrentUserVote = null; // Will be set to 'up', 'down', or null

                // Logic to determine changes based on action and normalized previous state
                if (isRemovingVote) {
                    if (isUpvote && previousVote === 'up') { // Removing an upvote
                        newKarma -= 1;
                        newUpvotes -= 1;
                        newCurrentUserVote = null;
                    } else if (!isUpvote && previousVote === 'down') { // Removing a downvote
                        newKarma += 1;
                        newDownvotes -= 1;
                        newCurrentUserVote = null;
                    }
                    // If previousVote is null, removing does nothing
                } else { // Adding or changing a vote
                    if (isUpvote) { // Voting up
                        if (previousVote === 'down') { // Was downvoted, changing to upvote
                            newKarma += 2;
                            newUpvotes += 1;
                            newDownvotes -= 1;
                        } else if (previousVote === null) { // Was not voted, adding upvote
                            newKarma += 1;
                            newUpvotes += 1;
                        }
                        // If previousVote was 'up', karma/votes don't change (already upvoted)
                        newCurrentUserVote = 'up';
                    } else { // Voting down
                        if (previousVote === 'up') { // Was upvoted, changing to downvote
                            newKarma -= 2;
                            newDownvotes += 1;
                            newUpvotes -= 1;
                        } else if (previousVote === null) { // Was not voted, adding downvote
                            newKarma -= 1;
                            newDownvotes += 1;
                        }
                         // If previousVote was 'down', karma/votes don't change (already downvoted)
                        newCurrentUserVote = 'down';
                    }
                }

                // Ensure counts don't go below zero (edge case safeguard)
                newUpvotes = Math.max(0, newUpvotes);
                newDownvotes = Math.max(0, newDownvotes);

                // Log the result of the update function
                const updatedPost = { 
                    ...post, // Keep all existing fields
                    karma: newKarma, 
                    upvotes: newUpvotes, // Include updated upvotes
                    downvotes: newDownvotes, // Include updated downvotes
                    currentUserVote: newCurrentUserVote 
                };
                return updatedPost;
            };

            // Apply optimistic update to feed cache
            queryClient.setQueryData(['feedPosts', userId], (oldData = []) => 
                oldData.map(p => {
                    if ((p.ID || p.id) === postId) {
                        return updatePostVotes(p);
                    }
                    return p;
                })
            );

            // Apply optimistic update to single post cache
            queryClient.setQueryData(['post', postId], (oldPostData) => {
                 const newPostData = updatePostVotes(oldPostData);
                 return newPostData;
            });


            return { previousFeedData, previousPostData };
        },
        onSuccess: (data, variables, context) => {
             // The optimistic update in onMutate handled the UI change.
             // We don't need to call setQueryData here again.
             // onSettled will invalidate the queries to fetch the true state.
            options.onSuccess?.(data, variables, context);
        },
        onError: (err, variables, context) => {
            console.error("Post vote error:", err);
            // Rollback optimistic updates
            if (context?.previousFeedData) {
                queryClient.setQueryData(['feedPosts', userId], context.previousFeedData);
            }
            if (context?.previousPostData) {
                queryClient.setQueryData(['post', variables.postId], context.previousPostData);
            }
            options.onError?.(err, variables, context);
        },
        onSettled: (data, error, variables) => {
            // Temporarily comment out invalidation to test optimistic update stability
            // queryClient.invalidateQueries({ queryKey: ['feedPosts', userId] });
            // queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
            options.onSettled?.(data, error, variables);
        },
        ...options,
    });
}

// Hook for the mutation to create a post
export function useCreatePostMutation (options = {}) {
    const { currentUser, authFetch } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const userId = currentUser?.id;

    return useMutation({
        mutationFn: async (newPostData) => {
            if (!userId) throw new Error("User must be logged in to create a post.");
            const dataToSend = {
                ...newPostData,
                authorId: userId,
                // subredditId should be included in newPostData from component
            };
            if (!dataToSend.subredditId) throw new Error("Subreddit ID is required.");

            // Using authFetch directly as per original component logic
            // Consider moving this fetch logic into postService.createPost if preferred
            const response = await authFetch(`${config.apiUrl}/post`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create post');
            }
            return data;
        },
        onSuccess: (data, variables, context) => {
            // Invalidate the posts query for the specific subreddit
            queryClient.invalidateQueries({ queryKey: ['posts', variables.subredditId] });
             // Optionally invalidate feed if new posts should appear there immediately
             // queryClient.invalidateQueries({ queryKey: ['feedPosts', userId] });
            navigate(`/r/${variables.subredditId}`); // Navigate back
            options.onSuccess?.(data, variables, context);
        },
        onError: (error, variables, context) => {
            console.error('Error creating post:', error);
            options.onError?.(error, variables, context);
        },
        ...options,
    });
} 