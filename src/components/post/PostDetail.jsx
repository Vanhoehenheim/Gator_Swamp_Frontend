import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import CommentSection from '../comment/CommentSection';
import { postService } from '../../services/postService';
import { useVotePostMutation } from '../../hooks/usePostData';

const formatDisplayDate = (dateString) => {
  if (!dateString) return "Unknown date";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return new Intl.DateTimeFormat('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', 
        hour: 'numeric', minute: '2-digit', hour12: true
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Error formatting date";
  }
};

const PostDetail = () => {
  const { postId } = useParams();
  const { currentUser, authFetch } = useAuth();

  const isQueryEnabled = !!postId;

  const { 
      data: post, 
      isLoading, 
      isError, 
      error 
  } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => {
        if (!postId) {
            console.error("[PostDetail QueryFn] Attempted to run queryFn with undefined postId!");
            return Promise.resolve(null);
        }
        return postService.getPost(postId, authFetch);
    },
    enabled: isQueryEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const voteMutation = useVotePostMutation();

  const voteState = useMemo(() => {
    if (!currentUser?.id || post?.currentUserVote === undefined || post?.currentUserVote === null) return null;
    // Normalize potential boolean from server fetch or string from cache update
    const currentVote = post.currentUserVote;
    // Calculate vote state
    const calculatedVoteState = (currentVote === true || currentVote === 'up') ? 'up' : ((currentVote === false || currentVote === 'down') ? 'down' : null);
    return calculatedVoteState;
  }, [post?.currentUserVote, currentUser?.id]);

  const handleVoteClick = (isUpvote) => {
    if (!currentUser?.id) {
        console.error('Please login to vote');
        return;
    }
    const currentVote = voteState;
    const isRemovingVote = (isUpvote && currentVote === 'up') || (!isUpvote && currentVote === 'down');
    voteMutation.mutate({ postId, isUpvote, isRemovingVote });
  };

  if (isLoading) return <div className="text-center mt-8 pt-20 dark:text-gray-300">Loading...</div>;
  if (isError) return <div className="text-center mt-8 pt-20 text-red-600">{error?.message || 'Failed to load post'}</div>;
  if (!post) return <div className="text-center mt-8 pt-20 dark:text-gray-400">Post not found</div>;

  return (
    <div className="dark:bg-dark-slate-900 max-w-3xl mx-auto rounded-lg px-4 lowercase pt-20 pb-8 min-h-screen">
      <article className="bg-stone-50 dark:bg-dark-slate-800 rounded-lg p-6 shadow-sm">
        <header className="mb-4">
          <h1 className="text-3xl font-bold dark:text-white text-gray-900 mb-2">
            {post.title}
          </h1>
          <div className="text-xs text-gray-600 dark:text-stone-400">
            <span>By {post.authorUsername || 'unknown'}</span>
            <span className="mx-2">•</span>
            <span>{formatDisplayDate(post.createdAt)}</span>
          </div>
        </header>

        <div className="text-sm text-gray-800 dark:text-stone-300 mb-6 whitespace-pre-wrap">
          {post.content}
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <button 
            onClick={() => handleVoteClick(true)}
            disabled={voteMutation.isPending || !currentUser?.id}
            className={`flex items-center space-x-1 hover:text-green-500 disabled:opacity-50 ${voteState === 'up' ? 'text-green-500' : ''}`}
            aria-label={voteState === 'up' ? 'Remove upvote' : 'Upvote'}
          >
            <ThumbsUp 
              size={15} 
              className={`transition-all ${voteState === 'up' ? 'fill-current' : ''}`} 
            />
            <span>{post.upvotes || 0}</span>
          </button>
          <button 
            onClick={() => handleVoteClick(false)}
            disabled={voteMutation.isPending || !currentUser?.id}
            className={`flex items-center space-x-1 hover:text-red-500 disabled:opacity-50 ${voteState === 'down' ? 'text-red-500' : ''}`}
            aria-label={voteState === 'down' ? 'Remove downvote' : 'Downvote'}
          >
            <ThumbsDown 
              size={15}
              className={`transition-all ${voteState === 'down' ? 'fill-current' : ''}`}
            />
            <span>{post.downvotes || 0}</span>
          </button>
          <div className="text-xs text-gray-500 dark:text-gray-400">
              Karma: {post.karma !== undefined ? post.karma : (post.upvotes || 0) - (post.downvotes || 0)}
          </div>
        </div>

        <CommentSection postId={postId} />
      </article>
    </div>
  );
};

export default PostDetail;