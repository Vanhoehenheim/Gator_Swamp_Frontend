import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import Post from './Post';
import GatorRelax from '../assets/GatorRelax.svg';
import { feedService } from '../services/feedService';
import { ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { postService } from '../services/postService';
// Note: The Navbar component should be imported and used at the App level,
// not removed or replaced by this component

const Home = () => {
  const { currentUser, authFetch } = useAuth();
  const { darkMode } = useTheme();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        console.log("Fetching posts for user:", currentUser);
        
        const feedData = await feedService.getUserFeed(currentUser.id, authFetch);
        
        if (!feedData || feedData.length === 0) {
          const recentPosts = await feedService.getRecentPosts(authFetch);
          if (!recentPosts || recentPosts.length === 0) {
            setError('No posts available');
            setPosts([]);
          } else {
            setPosts(recentPosts);
          }
        } else {
          setPosts(feedData);
        }
      } catch (err) {
        setError('Failed to load posts');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
  
    if (currentUser && currentUser.id) {
      fetchPosts();
    } else {
      setError('No user information available');
      setLoading(false);
    }
  }, [currentUser, authFetch]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-dark-slate-900 transition-colors">
        <div className="text-xl text-gray-300 font-doto">Loading posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-dark-slate-900 transition-colors">
        <div className="text-xl text-red-600 font-doto">{error}</div>
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
            today's feed
          </h1>
          
        </div>
        
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard key={post.ID} post={post} authFetch={authFetch} currentUser={currentUser} />
          ))}

          {posts.length === 0 && (
            <div className="text-center py-6 bg-dark-slate-800 rounded">
              <p className="text-gray-400 font-doto">No posts available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// PostCard component that preserves your original styling but adds mobile improvements
const PostCard = ({ post, authFetch, currentUser }) => {
  const [expanded, setExpanded] = useState(false);
  const [voteState, setVoteState] = useState(null);
  const [currentPost, setCurrentPost] = useState(post);
  const navigate = useNavigate();
  
  // Truncate content for preview with your original styling
  const previewContent = post.Content?.length > 100 
    ? `${post.Content.substring(0, 100)}...` 
    : post.Content;
  
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric', 
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(post.CreatedAt));

  // Check for existing vote when component mounts
  useEffect(() => {
    if (currentUser?.id && post.UserVotes) {
      const userVote = post.UserVotes[currentUser.id];
      if (userVote !== undefined) {
        setVoteState(userVote ? 'up' : 'down');
      }
    }
  }, [post, currentUser]);

  const handlePostClick = () => {
    navigate(`/posts/${post.ID}`);
  };

  const handleVote = async (isUpvote, e) => {
    // Stop the click from bubbling up to the post card
    e.stopPropagation();
    
    if (!currentUser?.id) {
      console.error('Please login to vote');
      return;
    }
    
    // Determine the voting action based on current state
    const isRemovingVote = (isUpvote && voteState === 'up') || (!isUpvote && voteState === 'down');
    const isChangingVote = (isUpvote && voteState === 'down') || (!isUpvote && voteState === 'up');
    
    try {
      // Current vote state for optimistic UI update
      let newVoteState;
      
      if (isRemovingVote) {
        // Toggle vote off
        newVoteState = null;
      } else {
        // Either setting a new vote or changing an existing vote
        newVoteState = isUpvote ? 'up' : 'down';
      }
      
      // Update UI optimistically
      setVoteState(newVoteState);
      
      // Optimistically update vote counts
      const updatedPost = { ...currentPost };
      
      // First, reverse any previous vote if there was one
      if (voteState === 'up') {
        updatedPost.Upvotes = Math.max(0, updatedPost.Upvotes - 1);
      } else if (voteState === 'down') {
        updatedPost.Downvotes = Math.max(0, updatedPost.Downvotes - 1);
      }
      
      // Then add the new vote if not removing
      if (newVoteState === 'up') {
        updatedPost.Upvotes += 1;
      } else if (newVoteState === 'down') {
        updatedPost.Downvotes += 1;
      }
      
      updatedPost.Karma = updatedPost.Upvotes - updatedPost.Downvotes;
      setCurrentPost(updatedPost);
      
      // Send request to server
      const serverUpdatedPost = await postService.votePost(
        post.ID, 
        currentUser.id, 
        isUpvote,
        isRemovingVote, // Pass flag to indicate if we're removing a vote
        authFetch
      );
      
      // Update with actual server data
      setCurrentPost(serverUpdatedPost);
      
    } catch (err) {
      console.error('Voting error:', err);
      // Revert to original post data on error by refetching
      try {
        const refreshedPost = await postService.getPost(post.ID, authFetch);
        setCurrentPost(refreshedPost);
        
        // Reset vote state based on refreshed data
        if (currentUser?.id && refreshedPost.UserVotes) {
          const userVote = refreshedPost.UserVotes[currentUser.id];
          setVoteState(userVote !== undefined ? (userVote ? 'up' : 'down') : null);
        }
      } catch (refreshErr) {
        console.error('Failed to refresh post data:', refreshErr);
      }
      
      // Only show error to user if it's not an "Already voted" error
      if (!err.message?.includes('Already voted')) {
        console.error(err.message);
      }
    }
  };

  return (
    <div 
      className="bg-white dark:bg-dark-slate-800 rounded p-4 shadow-sm cursor-pointer transition-opacity hover:opacity-95 active:opacity-90"
      onClick={handlePostClick}
    >
      {/* Post title - preserving your original font */}
      <h2 className="text-xl te text-gray-900 dark:text-white mb-1">
        {currentPost.Title}
      </h2>
      
      {/* Post metadata */}
      <div className="text-xs text-gray-900 dark:text-white font-doto mb-3">
        by {currentPost.AuthorUsername || 'unknown'} • {formattedDate}
      </div>
      
      {/* Post content with expand/collapse */}
      <div className="text-gray-900 dark:text-white mb-4 test-xs">
        {expanded ? currentPost.Content : previewContent}
        {!expanded && currentPost.Content?.length > 100 && (
          <button 
            className="text-gray-400 hover:text-white ml-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(true);
            }}
          >
            read more
          </button>
        )}
      </div>
      
      {/* Interactive footer with vote buttons matching PostDetail.jsx styling */}
      <div className="flex items-center border-t border-dark-slate-700 pt-2 text-sm">
        <button 
          onClick={(e) => handleVote(true, e)}
          className={`flex items-center space-x-2 transition-colors ${
            voteState === 'up' 
              ? 'text-blue-600 font-medium' 
              : 'text-gray-600 hover:text-blue-600 dark:text-stone-300'
          }`}
          aria-label={voteState === 'up' ? 'Remove upvote' : 'Upvote'}
        >
          <ThumbsUp 
            size={15} 
            className={`transition-all ${voteState === 'up' ? 'fill-current' : ''}`} 
          />
          <span className="ml-1">{currentPost.Upvotes || 0}</span>
        </button>
        
        <button 
          onClick={(e) => handleVote(false, e)}
          className={`flex items-center space-x-2 ml-4 transition-colors ${
            voteState === 'down' 
              ? 'text-red-600 font-medium' 
              : 'text-gray-600 hover:text-red-600 dark:text-stone-300'
          }`}
          aria-label={voteState === 'down' ? 'Remove downvote' : 'Downvote'}
        >
          <ThumbsDown 
            size={15}
            className={`transition-all ${voteState === 'down' ? 'fill-current' : ''}`}
          />
          <span className="ml-1">{currentPost.Downvotes || 0}</span>
        </button>
        
        <div className="flex items-center ml-4 text-gray-400">
          <MessageCircle size={15} />
          <span className="ml-1">{currentPost.CommentCount || 0}</span>
        </div>
        
        <div className="flex items-center ml-auto">
          <span className={currentPost.Karma >= 0 ? 'text-green-500' : 'text-red-500'}>
            karma: {currentPost.Karma || 0}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Home;