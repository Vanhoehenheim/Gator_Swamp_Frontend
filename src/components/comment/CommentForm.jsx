import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PropTypes from 'prop-types'; // Import PropTypes
// Remove commentService import
// import { commentService } from '../services/commentService';
// Import the custom mutation hook
import { useCreateCommentMutation } from '../../hooks/useCommentData';

const CommentForm = ({ postId, parentCommentId = null, onCommentPosted, onCancelReply }) => {
  const [content, setContent] = useState('');
  // Remove local error/loading state, use hook's state
  // const [error, setError] = useState(null);
  // const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth(); // Keep currentUser check

  // Use the custom mutation hook
  const { mutate: createComment, isPending, error } = useCreateCommentMutation({
    // Add onSuccess callback to clear form and call parent handler
    onSuccess: () => {
      setContent('');
      onCommentPosted?.(); // Call the callback passed from PostDetail/Comment
      if (onCancelReply) onCancelReply(); // Close reply form if it exists
    },
    // onError is handled by the hook (logs to console), but we can add more here if needed
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    // setError(null); // No longer needed
    // setIsSubmitting(true); // Use isPending from hook

    if (!content.trim()) {
      // setError('Comment cannot be empty.'); // Can keep local validation error if preferred
      // setIsSubmitting(false);
      console.error('Comment cannot be empty.');
      return;
    }

    // Check 2: Is user logged in?
    console.log('Current User in handleSubmit:', currentUser); // Added log
    if (!currentUser) {
       // setError('You must be logged in to comment.');
       // setIsSubmitting(false);
       console.error('You must be logged in to comment.');
       return; // <--- Possible early exit
    }

    // Call mutate from the hook
    createComment({
      PostID: postId,
      ParentCommentID: parentCommentId,
      Content: content,
      // AuthorID is added inside the hook
    });

    // Remove manual submit logic, error handling, state setting
    /*
    try {
      await commentService.createComment({ ... }, authFetch);
      setContent('');
      onCommentPosted?.();
      if (onCancelReply) onCancelReply(); // Close reply form
    } catch (err) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
    */
  };

  return (
    <form onSubmit={handleSubmit} className={`mt-4 ${parentCommentId ? 'ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}`}>
      <textarea
        className="w-full p-2 border rounded dark:bg-dark-slate-700 dark:text-gray-200 dark:border-dark-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        rows="3"
        placeholder={parentCommentId ? "Write a reply..." : "Add a comment..."}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isPending}
      />
      {/* Display error from hook */}
      {error && (
          <p className="text-red-500 text-sm mt-1">Error: {error.message}</p>
      )}
      <div className="flex justify-end items-center mt-2 space-x-2">
        {onCancelReply && (
            <button 
              type="button" 
              onClick={onCancelReply}
              disabled={isPending}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-dark-slate-600 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
        )}
        <button 
          type="submit" 
          disabled={isPending || !content.trim()} // Disable if pending or no content
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Submitting...' : (parentCommentId ? 'Reply' : 'Comment')} 
        </button>
      </div>
    </form>
  );
};

// Add PropTypes validation
CommentForm.propTypes = {
  postId: PropTypes.string.isRequired,
  parentCommentId: PropTypes.string, // Optional
  onCommentPosted: PropTypes.func, // Optional, but should be provided if needed
  onCancelReply: PropTypes.func // Optional, only needed for replies
};

export default CommentForm; 