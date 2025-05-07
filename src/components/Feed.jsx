import { useState,  useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import GatorRelax from '../assets/GatorRelax.svg';
import { ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { useFeedPosts, useVotePostMutation } from '../hooks/usePostData';
import PropTypes from 'prop-types';
// Note: The Navbar component should be imported and used at the App level,
// not removed or replaced by this component

// Helper for safe date formatting (similar to Post.jsx fix)
const formatDisplayDate = (dateString) => {
  if (!dateString) return "Unknown date";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date"; // Check if date is valid
    // Use your preferred formatting
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Error formatting date";
  }
};

const Home = () => {
  const { currentUser } = useAuth();

  const { 
      data: posts = [], 
      isLoading, 
      isError, 
      error, 
      isFetching // Use isFetching for refresh indicators if needed
  } = useFeedPosts();

  if (isLoading) { // Use isLoading from useFeedPosts
    return (
      <div className="flex justify-center items-center min-h-screen dark:bg-dark-slate-900 transition-colors pt-20">
        <div className="text-xl text-gray-600 dark:text-gray-300 font-doto">Loading posts...</div>
      </div>
    );
  }

  if (isError) { // Use isError from useFeedPosts
    return (
      <div className="flex justify-center items-center min-h-screen dark:bg-dark-slate-900 transition-colors pt-20">
        <div className="text-xl text-red-600 font-doto">{error?.message || 'Failed to load feed'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 dark:bg-dark-slate-900 transition-colors">
      {/* Using pt-20 to account for navbar space - navbar should be rendered at the App level */}
      
      <div className="w-full mx-auto px-4 pb-16 max-w-4xl">
        <div className="flex items-center gap-3 justify-center w-full mb-6">
        <img 
            src={GatorRelax} 
            alt="Gator Logo" 
            className="h-12 w-12" 
          />
          <h1 className="text-2xl font-doto text-gray-900 dark:text-white font-bold">
            {currentUser?.id ? 'your feed' : 'recent posts'} {/* Dynamic title */}
          </h1>
          
        </div>
        
        <div className="space-y-4">
          {/* Use posts from useFeedPosts */}
          {posts.map(post => (
            <PostCard key={post.ID || post.id} post={post} /> // Remove authFetch/currentUser props if mutation handles context
          ))}

          {posts.length === 0 && !isLoading && ( // Ensure loading is false before showing no posts
            <div className="text-center py-6 bg-white dark:bg-dark-slate-800 rounded shadow-sm">
              <p className="text-gray-500 dark:text-gray-400 font-doto">No posts available</p>
            </div>
          )}
        </div>
        {isFetching && (
            <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">Refreshing feed...</div>
        )}
      </div>
    </div>
  );
};

// PostCard component - Refactored for useVotePostMutation and safe date formatting
const PostCard = ({ post }) => { // Removed authFetch, currentUser - get from context within mutation
  const [expanded, setExpanded] = useState(false);
  const { currentUser } = useAuth(); // Only need currentUser
  const navigate = useNavigate();

  // Use the custom vote mutation hook
  const { mutate: votePost, isPending: isVoting } = useVotePostMutation();

  // --- Event Handlers ---
  const handleVoteClick = (isUpvote, e) => {
    e.stopPropagation(); // Prevent triggering navigation
    if (!currentUser?.id) {
        // TODO: Show login prompt/toast
        return;
    }
    
    const postId = post.ID || post.id;
    // Use voteState (which is already normalized to 'up', 'down', or null) instead of post.userVotes
    const isRemovingVote = (isUpvote && voteState === 'up') || (!isUpvote && voteState === 'down');

    // Call mutate from the hook
    votePost({ postId, isUpvote, isRemovingVote });
  };

  const handlePostClick = () => {
    navigate(`/posts/${post.ID || post.id}`);
  };

  // --- Render Logic ---
  const previewContent = post.Content?.length > 100 
    ? `${post.Content.substring(0, 100)}...` 
    : post.Content;
  
  // Use safe date formatter
  const formattedDate = formatDisplayDate(post.createdAt);
  
  // Determine vote state directly from post data (updated by RQ cache)
  const voteState = useMemo(() => {
      if (!currentUser?.id) return null;
      // Use the currentUserVote field added by the optimistic update
      // Log calculated voteState
      const calculatedVoteState = post.currentUserVote || null; // 'up', 'down', or null
      return calculatedVoteState;
  }, [post?.currentUserVote, currentUser?.id]);

  return (
    <div 
      className="bg-white dark:bg-dark-slate-800 rounded p-4 shadow-sm cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-dark-slate-700"
      onClick={handlePostClick}
    >
      <h2 className="text-xl text-gray-900 dark:text-white mb-1">
        {post.title}
      </h2>
      
      <div className="text-xs text-gray-300 dark:text-gray-600 mb-3">
        {post.subredditName && (
          <>
            <span className="font-semibold text-blue-600 dark:text-blue-400 hover:underline" onClick={(e) => {
                e.stopPropagation(); // Prevent card click
                navigate(`/r/${post.subredditId}`); // Navigate using subreddit ID
            }}>
              r/{post.subredditName}
            </span>
            <span className="mx-1">•</span>
          </>
        )}
        by {post.authorUsername || 'unknown'} • {formattedDate} {/* Use safe formatter */}
      </div>
      
      <div className="text-sm text-gray-800 dark:text-gray-200 mb-4 break-words">
        {expanded ? post.Content : previewContent}
        {!expanded && post.Content?.length > 100 && (
          <button 
            className="text-blue-500 hover:underline ml-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(true);
            }}
          >
            read more
          </button>
        )}
      </div>

      {/* Vote buttons */}
      <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
        <button 
          onClick={(e) => handleVoteClick(true, e)} 
          disabled={isVoting} 
          className={`flex items-center space-x-1 hover:text-green-500 disabled:opacity-50 ${voteState === 'up' ? 'text-green-500' : ''}`}
        >
          <ThumbsUp size={16} /> 
          {/* Display Karma instead of upvotes */}
          <span className="text-xs">{post.upvotes || 0}</span>
        </button>
        <button 
          onClick={(e) => handleVoteClick(false, e)} 
          disabled={isVoting} 
          className={`flex items-center space-x-1 hover:text-red-500 disabled:opacity-50 ${voteState === 'down' ? 'text-red-500' : ''}`}
        >
          <ThumbsDown size={16} />
          <span className="text-xs">{post.downvotes || 0}</span>
        </button>
        <div className="flex items-center space-x-1">
            <MessageCircle size={16} /> 
            <span className="text-xs">{post.commentCount || 0} comments</span>
        </div>
        {/* Display Karma */}
        <div className="flex items-center space-x-1 text-xs font-semibold">
            <span>Karma:</span> 
            <span>{post.karma != null ? post.karma : 0}</span> {/* Display karma, default to 0 if null/undefined */}
        </div>
      </div>
    </div>
  );
};

// Add PropTypes validation
PostCard.propTypes = {
  post: PropTypes.shape({
    ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    Content: PropTypes.string,
    createdAt: PropTypes.string,
    authorUsername: PropTypes.string,
    userVotes: PropTypes.object,
    currentUserVote: PropTypes.string,
    upvotes: PropTypes.number,
    downvotes: PropTypes.number,
    commentCount: PropTypes.number,
    karma: PropTypes.number,
    subredditName: PropTypes.string,
    subredditId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired
};

export default Home;