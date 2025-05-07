import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { commentService } from '../services/commentService';

// Hook to fetch comments for a specific post
export function useComments (postId) {
  const { authFetch } = useAuth();
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const comments = await commentService.getPostComments(postId, authFetch);
      
      // Sort comments by created date, newest first, immediately after fetching
      return comments.sort((a, b) => {
        // Handle potential different field naming (createdAt vs CreatedAt)
        const dateA = new Date(a.createdAt || a.CreatedAt);
        const dateB = new Date(b.createdAt || b.CreatedAt);
        return dateB - dateA;
      });
    },
    enabled: !!postId, // Only run if postId is available
    staleTime: 1 * 60 * 1000, // 1 minute stale time
  });
}

// Hook for the mutation to create a new comment
export function useCreateCommentMutation (options = {}) {
    const { currentUser, authFetch } = useAuth();
    const queryClient = useQueryClient();
    const userId = currentUser?.id;

    return useMutation({
        mutationFn: async (newCommentData) => {
            // newCommentData should include { PostID, ParentCommentID (optional), Content }
            if (!userId) throw new Error("User must be logged in to comment.");
            if (!newCommentData.PostID) throw new Error("Post ID is required to create a comment.");
            
            // Explicitly map keys to match expected backend casing (camelCase)
            const dataToSend = { 
                postId: newCommentData.PostID,
                content: newCommentData.Content,
                AuthorID: userId, // Assuming backend expects AuthorID (PascalCase) - verify if needed
            };
            
            // Add parentCommentId only if it exists
            if (newCommentData.ParentCommentID) {
                dataToSend.parentId = newCommentData.ParentCommentID;
            }
            
            return commentService.createComment(dataToSend, authFetch);
        },
        onSuccess: (data, variables, context) => {
            // Invalidate the comments query for the specific post to refetch
            queryClient.invalidateQueries({ queryKey: ['comments', variables.PostID] });
            // Optionally, call onSuccess from options
            options.onSuccess?.(data, variables, context);
        },
        onError: (error, variables, context) => {
            // Optionally, call onError from options
            options.onError?.(error, variables, context);
        },
        ...options, // Spread any additional options like onMutate, onSettled
    });
}

// Hook for the mutation to vote on a comment
export function useVoteCommentMutation(options = {}) {
    const { currentUser, authFetch } = useAuth();
    const queryClient = useQueryClient();
    const userId = currentUser?.id;

    return useMutation({
        mutationFn: ({ commentId, postId, voteDirection }) => { // voteDirection: 'up', 'down', or 'none'
            if (!userId) throw new Error("User must be logged in to vote on comments.");
            if (!commentId || !postId) throw new Error("Comment ID and Post ID are required to vote.");
            
            // Pass voteDirection directly to the service call
            return commentService.voteComment(commentId, userId, voteDirection, authFetch);
        },
        onMutate: async ({ commentId, postId, voteDirection }) => {


            await queryClient.cancelQueries({ queryKey: ['comments', postId] });
            const previousComments = queryClient.getQueryData(['comments', postId]);

            queryClient.setQueryData(['comments', postId], (oldData = []) => {
                return oldData.map(comment => {
                    if ((comment.id || comment.ID) === commentId) {
                        const newComment = { ...comment };
                        let currentVoteString = newComment.currentUserVote;


                        newComment.upvotes = newComment.upvotes || 0;
                        newComment.downvotes = newComment.downvotes || 0;

                        let upvoteChange = 0;
                        let downvoteChange = 0;

                        // Reverting previous vote
                        if (currentVoteString === 'up') {
                            upvoteChange -= 1;
                        } else if (currentVoteString === 'down') {
                            downvoteChange -= 1;
                        }

                        // Applying new vote
                        if (voteDirection === 'up') {
                            if (currentVoteString !== 'up') {
                                upvoteChange += 1;
                                newComment.currentUserVote = 'up';
                            } else {
                                newComment.currentUserVote = null;
                            }
                        } else if (voteDirection === 'down') {
                            if (currentVoteString !== 'down') {
                                downvoteChange += 1;
                                newComment.currentUserVote = 'down';
                            } else {
                                newComment.currentUserVote = null;
                            }
                        } else if (voteDirection === 'none') {
                            newComment.currentUserVote = null;
                        }
                        
                        newComment.upvotes = Math.max(0, newComment.upvotes + upvoteChange);
                        newComment.downvotes = Math.max(0, newComment.downvotes + downvoteChange);
                        newComment.karma = (newComment.upvotes) - (newComment.downvotes);
                        return newComment;
                    }
                    return comment;
                });
            });
            return { previousComments };
        },
        onSuccess: (data, variables, context) => {
             // Invalidate the comments for the post to show the updated vote count from server
             // queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] }); // Done in onSettled
             options.onSuccess?.(data, variables, context);
        },
        onError: (error, variables, context) => {
            if (context?.previousComments) {
                queryClient.setQueryData(['comments', variables.postId], context.previousComments);
            }
            options.onError?.(error, variables, context);
        },
         onSettled: (data, error, variables) => {
            // Re-enable invalidation now that the payload matches the backend.
            queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] }); 
            options.onSettled?.(data, error, variables);
        },
        ...options,
    });
} 