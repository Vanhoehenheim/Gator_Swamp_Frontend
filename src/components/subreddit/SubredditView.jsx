import { useState, useEffect, useMemo, useRef } from "react";
// Remove RQ hook imports if using custom hooks exclusively
import { useQueryClient } from '@tanstack/react-query'; 
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
// Remove service import if no longer used directly
// import { subredditService } from "../../services/subredditService";
import Post from "../post/Post";
import { Users, PenSquare, ArrowLeft } from "lucide-react";
// Import the new custom hooks
import { 
    useSubreddit, 
    useSubredditMembers, 
    useSubredditPosts, 
    useJoinSubredditMutation 
} from "../../hooks/useSubredditData";

const SubredditView = () => {
  const navigate = useNavigate();
  const { subredditId } = useParams();
  const { currentUser } = useAuth(); // Only need currentUser
  const queryClient = useQueryClient(); // Get query client instance

  // --- Use Custom Hooks ---

  // Use custom hook for Subreddit Details
  const { 
    data: subreddit, 
    isLoading: isLoadingSubreddit, 
    isError: isErrorSubreddit, 
    error: errorSubreddit 
  } = useSubreddit(subredditId);

  // Use custom hook for Subreddit Members
  const { data: members = [], isError: isErrorMembers, error: errorMembers } = useSubredditMembers(subredditId);

  // Derive isMember state (remains the same)
  const isMember = useMemo(() => members.includes(currentUser?.id), [members, currentUser?.id]);

  // Use custom hook for Subreddit Posts
  const { 
    data: posts = [], 
    isLoading: isLoadingPosts, 
    isFetching: isFetchingPosts, 
    isError: isErrorPosts, 
    error: errorPosts 
  } = useSubredditPosts(subredditId);

  // Use custom hook for Joining Subreddit mutation
  // We can pass onError here if we want specific UI feedback in this component
  const { mutate: joinSubreddit, isPending: isJoining, error: joinError } = useJoinSubredditMutation(); 

  // --- Remove direct RQ hook usage & old logic ---
  /* ... (already removed/commented) ... */

  // --- Render Logic ---

  // Handle initial loading state (remains the same)
  if (isLoadingSubreddit) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-16">
        <div className="text-lg sm:text-xl text-gray-600 dark:text-gray-300">Loading subreddit...</div>
      </div>
    );
  }

  // Handle error fetching subreddit details (remains the same)
  if (isErrorSubreddit) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-16">
        <div className="text-lg sm:text-xl text-red-600">{errorSubreddit?.message || "Failed to load subreddit details"}</div>
      </div>
    );
  }

  // Handle case where subreddit doesn't exist (remains the same)
  if (!subreddit) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-16">
        <div className="text-lg sm:text-xl text-gray-600 dark:text-gray-300">subreddit not found</div>
      </div>
    );
  }
  
  // Handle missing user message (remains the same)
  const userRequiredMessage = !currentUser?.id 
     ? <p className="text-sm text-orange-500 mb-2">Please log in to join or post.</p>
     : null;

  return (
    <div className="min-h-screen pt-20 md:pt-28 dark:bg-dark-slate-900 bg-stone-100 pb-8">
      <div className="max-w-3xl mx-auto px-3 sm:px-4">
        
        <div className="bg-white dark:bg-dark-slate-800 lowercase rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
            <div className="mb-3 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold font-doto">{subreddit.Name}</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">{subreddit.Description}</p>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 text-gray-600 text-sm sm:text-base">
              <Users className="size-4 sm:size-5" />
              <span>{subreddit.Members || 0} members</span>
            </div>
          </div>

          {userRequiredMessage}

          {joinError && (
            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {joinError?.message || "Failed to join subreddit. Please try again."} 
            </div>
          )}

          {isMember ? (
            <button
              onClick={() => navigate(`/r/${subredditId}/post/create`)}
              className="flex items-center space-x-1 sm:space-x-2 bg-black text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm sm:text-base disabled:opacity-50"
              disabled={!currentUser?.id} 
            >
              <PenSquare className="size-4 sm:size-5" />
              <span>create post</span>
            </button>
          ) : (
            <button
              className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto"
              onClick={() => {
                if (!currentUser?.id) return;
                // Pass only subredditId. Rely on hook's onSuccess for invalidation.
                joinSubreddit(subredditId);
              }}
              disabled={isJoining || !currentUser?.id} 
            >
              {isJoining ? "Joining..." : "Join Subreddit"}
            </button>
          )}
          
          {isFetchingPosts && !isLoadingPosts && (
            <div className="mt-2 text-xs text-gray-500">Refreshing posts...</div>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6">
          {isLoadingPosts ? (
             <div className="text-center py-8 sm:py-12 bg-white dark:bg-dark-slate-800 rounded-lg shadow-sm">
               <p className="text-gray-600 dark:text-gray-300">Loading posts...</p>
             </div>
          ) : isErrorPosts ? (
             <div className="text-center py-8 sm:py-12 bg-white dark:bg-dark-slate-800 rounded-lg shadow-sm">
                <p className="text-red-600">{errorPosts?.message || "Failed to load posts."}</p>
             </div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <Post 
                key={post.id || post.ID || `post-${Math.random().toString(36).substr(2, 9)}`} 
                post={post} 
              />
            ))
          ) : (
            <div className="text-center py-8 sm:py-12 bg-white dark:bg-dark-slate-800 rounded-lg shadow-sm">
              <p className="text-gray-600 dark:text-gray-300 font-doto">
                no posts in this subreddit yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubredditView;