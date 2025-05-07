import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import PropTypes from 'prop-types';
import CommentForm from './CommentForm';
// Remove direct service or RQ imports if vote handled by hook

// Import the vote hook
import { useVoteCommentMutation } from '../../hooks/useCommentData';

// Helper function to build the comment tree (moved outside component)
const buildCommentTree = (commentList, parentId = null) => {
  return commentList
    .filter(comment => (comment.parentId || null) === parentId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort by creation time, newest first
    .map(comment => ({
      ...comment,
      children: buildCommentTree(commentList, comment.id || comment.ID)
    }));
};

// Safe Date Formatter
const formatDisplayDate = (/* dateString */) => { /* TODO: Implement */ return 'Formatted Date' };

const CommentList = ({ comments, postId }) => {
  // Remove function definition from inside component

  const commentTree = useMemo(() => buildCommentTree(comments || []), [comments]);

  return (
    <div className="space-y-4 mt-6">
      {commentTree.map(comment => (
        <Comment 
            key={comment.ID || comment.id} 
            comment={comment} 
            postId={postId} // Pass postId down for voting mutation
        />
      ))}
    </div>
  );
};

// Add PropTypes for CommentList
CommentList.propTypes = {
  comments: PropTypes.array.isRequired,
  postId: PropTypes.string.isRequired,
};

const Comment = ({ comment, postId }) => {
  const [isReplying, setIsReplying] = useState(false);
  const { currentUser } = useAuth();
  const commentId = comment.ID || comment.id;

  // Use the custom hook for voting on this comment
  const { mutate: voteComment, isPending: isVoting } = useVoteCommentMutation({
      // onSuccess/onError handled by hook (invalidation)
  });

  // --- Vote Handler ---
  const handleVoteClick = (isUpvote) => {
    if (!currentUser?.id || !commentId) {
        console.error('User not logged in or comment ID missing');
        return;
    }
    
    const currentVote = comment.userVotes?.[currentUser.id];
    const isRemovingVote = (isUpvote && currentVote === true) || (!isUpvote && currentVote === false);

    // Call mutate from the hook
    voteComment({ commentId, postId, isUpvote, isRemovingVote });
  };

  const voteState = useMemo(() => {
      if (!currentUser?.id || !comment.userVotes) return null;
      const vote = comment.userVotes[currentUser.id];
      return vote === true ? 'up' : vote === false ? 'down' : null;
  }, [comment.userVotes, currentUser?.id]);

  const formattedDate = formatDisplayDate(comment.createdAt);

  return (
    <div className="p-3 bg-gray-50 dark:bg-dark-slate-700/50 rounded">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{comment.authorUsername || 'Unknown User'}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
      </div>
      <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">{comment.content}</p>
      <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
        {/* Vote Buttons - Use isVoting from hook */}
        <button 
          onClick={() => handleVoteClick(true)} 
          disabled={!currentUser || isVoting} 
          className={`flex items-center space-x-1 hover:text-green-500 disabled:opacity-50 ${voteState === 'up' ? 'text-green-500' : ''}`}
        >
          <ThumbsUp size={14} />
          <span>{comment.upvotes || 0}</span>
        </button>
        <button 
          onClick={() => handleVoteClick(false)} 
          disabled={!currentUser || isVoting} 
          className={`flex items-center space-x-1 hover:text-red-500 disabled:opacity-50 ${voteState === 'down' ? 'text-red-500' : ''}`}
        >
          <ThumbsDown size={14} />
          <span>{comment.downvotes || 0}</span>
        </button>
        {currentUser && (
            <button onClick={() => setIsReplying(!isReplying)} className="hover:underline">
                Reply
            </button>
        )}
      </div>

      {/* Reply Form */} 
      {isReplying && (
        <CommentForm 
          postId={postId} 
          parentCommentId={commentId} 
          onCommentPosted={() => {
            setIsReplying(false); // Close reply form
          }}
          onCancelReply={() => setIsReplying(false)} // Add cancel handler
        />
      )}

      {/* Nested Comments */}
      {comment.children && comment.children.length > 0 && (
        <div className="ml-6 mt-3 space-y-3 border-l-2 border-gray-200 dark:border-gray-600 pl-3">
          {comment.children.map(childComment => (
            <Comment 
                key={childComment.ID || childComment.id} 
                comment={childComment} 
                postId={postId} // Pass postId down
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Add PropTypes for Comment
Comment.propTypes = {
  comment: PropTypes.shape({
    ID: PropTypes.string,
    id: PropTypes.string, // Allow fallback if ID is missing
    ParentCommentID: PropTypes.string,
    createdAt: PropTypes.string,
    authorUsername: PropTypes.string,
    content: PropTypes.string,
    upvotes: PropTypes.number,
    downvotes: PropTypes.number,
    userVotes: PropTypes.object, // More specific shape could be added
    children: PropTypes.array
  }).isRequired,
  postId: PropTypes.string.isRequired,
};

export default CommentList;
