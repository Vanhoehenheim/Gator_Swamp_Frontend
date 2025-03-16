import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Comment from "./Comment";
import { commentService } from "../../services/commentService";

const CommentSection = ({ postId }) => {
  const { currentUser, authFetch } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchComments();
    } else {
      setLoading(false);
      setError("Invalid post ID");
    }
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await commentService.getPostComments(postId, authFetch);
      
      // If response is null or undefined, set comments to empty array
      if (!data) {
        setComments([]);
        return;
      }
  
      // If we have comments, then filter for top-level ones
      const topLevelComments = data.filter(comment => !("parentId" in comment));
      setComments(topLevelComments);
  
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) {
      setError("Comment cannot be empty");
      return;
    }
    
    if (!currentUser || !currentUser.id) {
      setError("You must be logged in to comment");
      return;
    }
    
    if (!postId) {
      setError("Invalid post ID");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      await commentService.createComment({
        Content: newComment.trim(),
        PostID: postId.toString(),
        AuthorID: currentUser.id.toString(),
      }, authFetch);

      setNewComment("");
      await fetchComments(); // Refresh all comments
    } catch (err) {
      console.error("Comment error:", err);
      setError("Failed to post comment: " + (err.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentCommentId, content) => {
    if (!currentUser || !currentUser.id) {
      setError("You must be logged in to reply");
      return;
    }
    
    if (!postId) {
      setError("Invalid post ID");
      return;
    }
    
    if (!parentCommentId) {
      setError("Invalid parent comment ID");
      return;
    }
    
    try {
      setError(null);
      
      await commentService.createComment({
        Content: content.trim(),
        PostID: postId.toString(),
        AuthorID: currentUser.id.toString(),
        ParentID: parentCommentId.toString(),
      }, authFetch);

      await fetchComments(); // Refresh all comments
    } catch (err) {
      console.error("Reply error:", err);
      setError("Failed to post reply: " + (err.message || "Unknown error"));
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-600">loading comments...</div>
    );
  }

  if (error && !comments.length) {
    return <div className="text-center py-4 text-red-600">{error}</div>;
  }

  // Handle Enter key press in textarea while allowing shift+enter for new lines
  const handleKeyDown = (e) => {
    // Submit on Ctrl+Enter
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleComment();
    }
  };

  return (
    <div className="border-t pt-6 lowercase">
      <h2 className="text-lg mb-4">comments</h2>

      <div className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full p-3 border rounded-lg resize-none text-sm"
          rows="3"
          placeholder="add a comment..."
        />
        {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
        <button
          type="button" 
          onClick={handleComment}
          disabled={isSubmitting || !currentUser}
          className={`mt-2 px-4 font-semibold py-2 ${
            isSubmitting || !currentUser ? "bg-gray-400" : "bg-stone-800 hover:bg-stone-600"
          } text-white rounded-lg`}
        >
          {isSubmitting ? "posting..." : currentUser ? "post comment" : "login to comment"}
        </button>
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <Comment
            key={comment.id}
            comment={comment}
            onReply={handleReply}
            postId={postId}
          />
        ))}

        {comments.length === 0 && (
          <div className="text-center py-4 text-gray-600">
            no comments yet. be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
