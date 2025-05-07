// src/hooks/useSubredditData.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { subredditService } from '../services/subredditService';
import { useNavigate } from 'react-router-dom';

// Hook to fetch details for a single subreddit
export function useSubreddit (subredditId) {
  const { authFetch } = useAuth();
  return useQuery({
    queryKey: ['subreddit', subredditId],
    queryFn: () => subredditService.getSubreddit(subredditId, authFetch),
    enabled: !!subredditId,
    staleTime: 5 * 60 * 1000, // 5 mins
  });
}

// Hook to fetch member IDs for a subreddit
export function useSubredditMembers (subredditId) {
  const { currentUser, authFetch } = useAuth();
  return useQuery({
    queryKey: ['subredditMembers', subredditId],
    queryFn: () => subredditService.getMembers(subredditId, authFetch),
    enabled: !!subredditId && !!currentUser?.id,
    staleTime: 5 * 60 * 1000, // 5 mins
  });
}

// Hook to fetch posts for a subreddit
export function useSubredditPosts (subredditId) {
  const { authFetch } = useAuth();
  return useQuery({
    queryKey: ['posts', subredditId],
    queryFn: () => subredditService.getPosts(subredditId, authFetch),
    enabled: !!subredditId,
    staleTime: 5 * 60 * 1000, // 5 mins
  });
}

// Hook for the mutation to join a subreddit
export function useJoinSubredditMutation (options = {}) {
    const { currentUser, authFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (subredditId) => {
            if (!currentUser?.id) throw new Error("User must be logged in to join.");
            return subredditService.joinSubreddit(subredditId, currentUser.id, authFetch);
        },
        onSuccess: (data, subredditId, context) => {
            console.log('Successfully joined subreddit', subredditId);
            // Manually update the members list cache
            if (currentUser?.id) {
                queryClient.setQueryData(['subredditMembers', subredditId], (oldData) => {
                    const oldMembers = Array.isArray(oldData) ? oldData : [];
                    if (oldMembers.includes(currentUser.id)) {
                        return oldMembers; // Already includes user, no change
                    }
                    return [...oldMembers, currentUser.id]; // Add current user ID
                });
            }
            // Still invalidate subreddit details to update member count
            queryClient.invalidateQueries({ queryKey: ['subreddit', subredditId] });
            // Invalidate user's profile to update their list of memberships
            if (currentUser?.id) {
                queryClient.invalidateQueries({ queryKey: ['userProfile', currentUser.id] });
            }
            
            options.onSuccess?.(data, subredditId, context);
        },
        onError: (error, subredditId, context) => {
            console.error("Error joining subreddit:", error);
            options.onError?.(error, subredditId, context);
        },
        ...options,
    });
}

// Hook for the mutation to create a subreddit
export function useCreateSubredditMutation (options = {}) {
    const { currentUser, authFetch } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (newSubredditData) => {
            if (!currentUser?.id) throw new Error("User must be logged in to create.");
            // Ensure creatorId is included
            const dataToSend = { ...newSubredditData, creatorId: currentUser.id };
            return subredditService.createSubreddit(dataToSend, authFetch);
        },
        onSuccess: (data, variables, context) => {
            console.log('Subreddit created successfully:', data);
            // Invalidate the query that lists all subreddits (e.g., on Profile page)
            queryClient.invalidateQueries({ queryKey: ['subreddits'] }); 
            // Invalidate user's profile to update their list of memberships as they are auto-added
            if (currentUser?.id) {
                queryClient.invalidateQueries({ queryKey: ['userProfile', currentUser.id] });
            }
            // Navigate to the newly created subreddit
            navigate(`/r/${data.id}`);
            options.onSuccess?.(data, variables, context);
        },
        onError: (error, variables, context) => {
            console.error('Error creating subreddit:', error);
            options.onError?.(error, variables, context);
        },
        ...options,
    });
} 