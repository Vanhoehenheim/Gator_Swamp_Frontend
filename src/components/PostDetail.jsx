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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [postId, authFetch]);

  const handleVote = async (isUpvote) => {
    if (!currentUser?.id) {
      setError('Please login to vote');
      return;
    }
    
    try {
      const updatedPost = await postService.votePost(postId, currentUser.id, isUpvote, authFetch);
      setPost(updatedPost);
      
      // Update the vote state for visual feedback
      if ((isUpvote && voteState === 'up') || (!isUpvote && voteState === 'down')) {
        setVoteState(null);
      } else {
        setVoteState(isUpvote ? 'up' : 'down');
      }
    } catch (err) {
      console.error('Voting error:', err);
      setError(err.message);
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
    <div className=" pt-20 max-w-3xl mx-auto px-4 py-8 lowercase">
      <article className="bg-stone-50 rounded-lg p-6 shadow-sm border border-gray-100">
        <header className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {post.Title}
          </h1>
          <div className="text-xs text-stone-300">
            <span>By {post.AuthorUsername}</span>
            <span className="mx-2">•</span>
            <span>{formatDate(post.CreatedAt)}</span>
          </div>
        </header>

        <div className="text-sm text-gray-800 mb-6 whitespace-pre-wrap">
          {post.Content}
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <button 
            onClick={() => handleVote(true)}
            className={`flex items-center space-x-2 ${
              voteState === 'up' 
                ? 'text-blue-600 font-medium' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <ThumbsUp 
              size={15} 
              className={voteState === 'up' ? 'fill-current' : ''} 
            />
            <span>{post.Upvotes}</span>
          </button>
          <button 
            onClick={() => handleVote(false)}
            className={`flex items-center space-x-2 ${
              voteState === 'down' 
                ? 'text-red-600 font-medium' 
                : 'text-gray-600 hover:text-red-600'
            }`}
          >
            <ThumbsDown 
              size={15} 
              className={voteState === 'down' ? 'fill-current' : ''} 
            />
            <span>{post.Downvotes}</span>
          </button>
        </div>

        <CommentSection postId={postId} />
      </article>
    </div>
  );
};

export default PostDetail;