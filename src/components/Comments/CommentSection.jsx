import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Comment from "./Comment";

const CommentSection = ({ postId }) => {
  const { userId } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8080/comment/post?postId=${postId}`
      );
      if (!response.ok) throw new Error("Failed to fetch comments");
  
      const data = await response.json();
      
      // If response is null or undefined, set comments to empty array
      if (!data) {
        setComments([]);
        return;
      }
  
      // If we have comments, then filter for top-level ones
      const topLevelComments = data.filter(
        (comment) => !("parentId" in comment)
      );
      setComments(topLevelComments);
  
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`http://localhost:8080/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Content: newComment.trim(),
          PostID: postId,
          AuthorID: userId,
        }),
      });

      if (!response.ok) throw new Error("Failed to post comment");

      await fetchComments(); // Refresh all comments
      setNewComment("");
    } catch (err) {
      console.error("Comment error:", err);
      setError("Failed to post comment");
    }
  };

  const handleReply = async (parentCommentId, content) => {
    try {
      const response = await fetch(`http://localhost:8080/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Content: content.trim(),
          PostID: postId,
          AuthorID: userId,
          ParentID: parentCommentId,
        }),
      });

      if (!response.ok) throw new Error("Failed to post reply");

      await fetchComments(); // Refresh all comments
    } catch (err) {
      console.error("Reply error:", err);
      setError("Failed to post reply");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-600">loading comments...</div>
    );
  }

  if (error) {
    return <div className="text-center py-4 text-red-600">{error}</div>;
  }

  return (
    <div className="border-t pt-6 lowercase">
      <h2 className="text-lg mb-4">comments</h2>

      <form onSubmit={handleComment} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="w-full p-3 border rounded-lg resize-none text-sm"
          rows="3"
          placeholder="add a comment..."
        />
        <button
          type="submit"
          className="mt-2 px-4 font-semibold py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-600"
        >
          post comment
        </button>
      </form>

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
