import { useMemo } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from "../../contexts/AuthContext";
import Comment from "./Comment";
import { useComments } from "../../hooks/useCommentData";
import CommentForm from "./CommentForm";
import PropTypes from 'prop-types';

const CommentSection = ({ postId }) => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const {
      data: allComments = [],
      isLoading: isLoadingComments,
      isError: isErrorComments,
      error: errorLoadingComments,
  } = useComments(postId);

  const topLevelComments = useMemo(() => {
    return allComments
        .filter(comment => !comment.parentId && !comment.ParentID && !comment.parentID)
        .sort((a, b) => new Date(b.CreatedAt || b.createdAt) - new Date(a.CreatedAt || a.createdAt));
  }, [allComments]);

  const handleCommentPosted = () => {
    console.log('Comment posted, invalidating query...');
    queryClient.invalidateQueries({ queryKey: ['comments', postId] });
  };

  if (isLoadingComments) {
    return (
      <div className="text-center py-4 text-gray-600 dark:text-gray-400">loading comments...</div>
    );
  }

  if (isErrorComments && topLevelComments.length === 0) {
    return <div className="text-center py-4 text-red-600">{errorLoadingComments?.message || "Failed to load comments"}</div>;
  }

  return (
    <div className="border-t border-gray-200 dark:border-dark-slate-700 pt-6 lowercase">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">comments ({allComments.length})</h2>

      {currentUser ? (
         <div className="mb-6">
            <CommentForm
                postId={postId}
                onCommentPosted={handleCommentPosted}
            />
         </div>
      ) : (
         <div className="mb-6 p-3 text-sm text-center bg-gray-100 dark:bg-dark-slate-700 rounded text-gray-600 dark:text-gray-400">
            login to comment...
         </div>
      )}

      <div className="space-y-4">
        {topLevelComments.map((comment) => (
          <Comment
            key={comment.ID || comment.id}
            comment={comment}
            allComments={allComments}
            onReply={handleCommentPosted}
            postId={postId}
          />
        ))}

        {!isLoadingComments && topLevelComments.length === 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            no comments yet. be the first to comment!
          </div>
        )}
         {isErrorComments && <div className="text-center py-4 text-red-500 text-sm">Error loading comments. Some may be missing.</div>}
      </div>
    </div>
  );
};

CommentSection.propTypes = {
  postId: PropTypes.string.isRequired,
};

export default CommentSection;
