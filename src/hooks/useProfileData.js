import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';

// Hook to fetch a specific user's profile
export function useUserProfile (userId) {
  const { authFetch } = useAuth();

  return useQuery({
    // Ensure query key reflects the specific user ID
    queryKey: ['profile', userId],
    queryFn: () => {
        if (!userId) throw new Error('User ID is required to fetch profile.');
        return profileService.getProfile(userId, authFetch);
    },
    enabled: !!userId, // Only run query if userId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Add other options like cacheTime, retry, etc. if needed
  });
}

// Hook to fetch the list of all subreddits
export function useAllSubreddits () {
  const { authFetch } = useAuth();

  return useQuery({
    queryKey: ['subreddits'], // Global key for all subreddits
    queryFn: () => profileService.getAllSubreddits(authFetch),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes, less likely to change frequently
  });
}

// Hook to fetch the list of all users
export function useAllUsers () {
  const { authFetch } = useAuth();

  return useQuery({
    queryKey: ['users'], // Global key for all users
    queryFn: () => profileService.getAllUsers(authFetch),
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Consider adding a select function here if filtering the current user
    // is always desired when calling this hook, though doing it in the component
    // might be more flexible.
    // select: (data) => data.filter(user => user.id !== currentUser?.id) 
  });
} 