// src/components/Comments/Comment.jsx
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Reply, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Edit2, Check, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Comment = ({ comment, onReply, postId, level = 0 }) => {
  const { userId } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [editContent, setEditContent] = useState(comment.content);
  const [showChildren, setShowChildren] = useState(true);
  const [childComments, setChildComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentComment, setCurrentComment] = useState(comment);
  const [voteState, setVoteState] = useState(null); 

  const canEdit = userId === comment.authorId;

  useEffect(() => {
    const fetchChildComments = async () => {
      if (comment.children && comment.children.length > 0) {
        setIsLoading(true);
        try {
          const childrenData = await Promise.all(
            comment.children.map(async (childId) => {
              const response = await fetch(
                `http://localhost:8080/comment?commentId=${childId}`
              );
              if (!response.ok)
                throw new Error("Failed to fetch child comment");
              return response.json();
            })
          );
          setChildComments(childrenData);
        } catch (error) {
          console.error("Error fetching child comments:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchChildComments();
  }, [comment.children]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy • h:mm a");
  };

  const handleVote = async (isUpvote) => {
    // If trying to vote the same way again, ignore
    if ((isUpvote && voteState === 'up') || (!isUpvote && voteState === 'down')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/comment/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          commentId: comment.id,
          isUpvote
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.Code === 'DUPLICATE') {
          // If duplicate vote, we need to remove the previous vote first
          return;
        }
        throw new Error('Failed to vote');
      }
      
      // Update vote state and comment data
      setVoteState(isUpvote ? 'up' : 'down');
      setCurrentComment(data);

    } catch (err) {
      console.error('Voting error:', err);
    }
  };


  const handleEdit = async () => {
    if (editContent.trim() === comment.content) {
      setIsEditing(false);
      return;
    }

    if (!canEdit) {
      console.error('Unauthorized to edit this comment');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/comment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          CommentID: comment.id,
          AuthorID: comment.authorId,
          Content: editContent.trim()
        }),
      });

      if (!response.ok) throw new Error('Failed to edit comment');
      
      const updatedComment = await response.json();
      setCurrentComment(updatedComment);
      setIsEditing(false);
    } catch (err) {
      console.error('Edit error:', err);
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    await onReply(comment.id, replyContent);
    setReplyContent("");
    setIsReplying(false);
  };

  const marginLeft = level > 0 ? `${level * 2}rem` : "0";

  return (
    <div style={{ marginLeft }} className="my-4">
      <div className="bg-stone-100 p-4 rounded-lg">
        <div className="text-sm text-gray-600 mb-2 flex items-center justify-between">
          <div>
            <span>By {currentComment.authorId}</span>
            <span className="mx-2">•</span>
            <span>{formatDate(currentComment.createdAt)}</span>
            {currentComment.updatedAt !== currentComment.createdAt && (
              <span className="ml-2 text-gray-500">(edited)</span>
            )}
          </div>
          {currentComment.children?.length > 0 && (
            <button
              onClick={() => setShowChildren(!showChildren)}
              className="text-gray-500 hover:text-gray-700"
            >
              {showChildren ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border rounded-lg resize-none"
              rows="3"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleEdit}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Check size={16} />
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(currentComment.content);
                }}
                className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-800">{currentComment.content}</div>
        )}

        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleVote(true)}
              className={`flex items-center gap-1 text-sm ${
                voteState === 'up' 
                  ? 'text-blue-600 font-medium' 
                  : 'text-gray-500 hover:text-blue-600'
              }`}
              disabled={voteState === 'up'}
            >
              <ThumbsUp size={16} 
                className={voteState === 'up' ? 'fill-current' : ''} 
              />
              <span>{currentComment.upvotes}</span>
            </button>
            <button
              onClick={() => handleVote(false)}
              className={`flex items-center gap-1 text-sm ${
                voteState === 'down' 
                  ? 'text-red-600 font-medium' 
                  : 'text-gray-500 hover:text-red-600'
              }`}
              disabled={voteState === 'down'}
            >
              <ThumbsDown size={16} 
                className={voteState === 'down' ? 'fill-current' : ''} 
              />
              <span>{currentComment.downvotes}</span>
            </button>
            <span className="text-sm text-gray-500">
              Karma: {currentComment.karma}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Reply size={16} />
              Reply
            </button>
            {canEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Edit2 size={16} />
              Edit
            </button>)}
          </div>
        </div>

        {isReplying && (
          <form onSubmit={handleSubmitReply} className="mt-4">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full p-2 border rounded-lg resize-none"
              rows="2"
              placeholder="Write a reply..."
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Post Reply
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent("");
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {isLoading && (
        <div className="ml-8 mt-2 text-gray-500">Loading replies...</div>
      )}

      {showChildren && childComments.length > 0 && (
        <div className="ml-4 border-l-2 border-gray-200 pl-4">
          {childComments.map((childComment) => (
            <Comment
              key={childComment.id}
              comment={childComment}
              onReply={onReply}
              postId={postId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;
