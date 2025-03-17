import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CommentSection from './Comments/CommentSection';
import { postService } from '../services/postService';

const PostDetail = () => {
  const { postId } = useParams();
  const { currentUser, authFetch } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voteState, setVoteState] = useState(null);

  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        const postData = await postService.getPost(postId, authFetch);
        setPost(postData);
        
        // Check if the user has already voted on this post
        if (currentUser?.id && postData.UserVotes) {
          const userVote = postData.UserVotes[currentUser.id];
          if (userVote !== undefined) {
            setVoteState(userVote ? 'up' : 'down');
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [postId, authFetch, currentUser]);

  const handleVote = async (isUpvote) => {
    if (!currentUser?.id) {
      setError('Please login to vote');
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
      const updatedPost = { ...post };
      
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
      
      setPost(updatedPost);
      
      // Send request to server
      const serverUpdatedPost = await postService.votePost(
        postId, 
        currentUser.id, 
        isUpvote,
        isRemovingVote, // New param to indicate if removing vote
        authFetch
      );
      
      // Update with actual server data
      setPost(serverUpdatedPost);
      
    } catch (err) {
      console.error('Voting error:', err);
      // Revert to original post data on error by refetching
      try {
        const refreshedPost = await postService.getPost(postId, authFetch);
        setPost(refreshedPost);
        
        // Reset vote state based on refreshed data
        if (currentUser?.id && refreshedPost.UserVotes) {
          const userVote = refreshedPost.UserVotes[currentUser.id];
          setVoteState(userVote !== undefined ? (userVote ? 'up' : 'down') : null);
        }
      } catch (refreshErr) {
        console.error('Failed to refresh post data:', refreshErr);
      }
      
      // Only show error to user if it's not an "Already voted" error
      if (!err.message.includes('Already voted')) {
        setError(err.message);
      }
    }
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error) return <div className="text-center mt-8 text-red-600">{error}</div>;
  if (!post) return <div className="text-center mt-8">Post not found</div>;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy • h:mm a');
  };

  return (
    <div className="dark:bg-dark-slate-900 max-w-3xl mx-auto rounded-lg px-4 lowercase">
      <article className="bg-stone-50 dark:bg-dark-slate-800 rounded-lg p-6 mt-20 shadow-sm">
        <header className="mb-4">
          <h1 className="text-3xl font-bold dark:text-white text-gray-900 mb-2">
            {post.Title}
          </h1>
          <div className="text-xs text-stone-300 dark:text-stone-300">
            <span>By {post.AuthorUsername}</span>
            <span className="mx-2">•</span>
            <span>{formatDate(post.CreatedAt)}</span>
          </div>
        </header>

        <div className="text-sm text-gray-800 dark:text-stone-300 mb-6 whitespace-pre-wrap">
          {post.Content}
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <button 
            onClick={() => handleVote(true)}
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
            <span>{post.Upvotes || 0}</span>
          </button>
          <button 
            onClick={() => handleVote(false)}
            className={`flex items-center space-x-2 transition-colors ${
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
            <span>{post.Downvotes || 0}</span>
          </button>
        </div>

        <CommentSection postId={postId} />
      </article>
    </div>
  );
};

export default PostDetail;