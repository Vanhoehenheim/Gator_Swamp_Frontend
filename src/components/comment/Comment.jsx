// src/components/Comments/Comment.jsx
import { useState, useMemo } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Reply,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import VoteConfetti from "../animations/VoteConfetti";
import { commentService } from "../../services/commentService";
import { useVoteCommentMutation } from "../../hooks/useCommentData";
import PropTypes from "prop-types";
import CommentForm from "./CommentForm";

const formatDisplayDate = (dateString) => {
  if (!dateString) return "Unknown date";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    // Use your preferred formatting
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Error formatting date";
  }
};

const Comment = ({ comment, allComments, postId, level = 0, onReply }) => {
  const { currentUser, authFetch } = useAuth();
  const queryClient = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showChildren, setShowChildren] = useState(true);
  // Temporarily disabled wasEdited state - will be re-enabled when backend is fixed
  // const [wasEdited, setWasEdited] = useState(() => {
  //   // Only consider a comment edited if:
  //   // 1. Both timestamps exist
  //   // 2. The difference is more than 1 minute (to avoid cases where backend updates timestamps on create)
  //   if (!comment.updatedAt || !comment.createdAt) return false;
  //   
  //   const createdTime = new Date(comment.createdAt).getTime();
  //   const updatedTime = new Date(comment.updatedAt).getTime();
  //   const timeDiffInSeconds = Math.abs(updatedTime - createdTime) / 1000;
  //   
  //   return timeDiffInSeconds > 60; // Only show "edited" if more than 1 minute difference
  // });
  const [editError, setEditError] = useState("");

  const commentId = comment.id || comment.ID;
  const authorId = comment.authorId;
  const canEdit = currentUser && currentUser.id === authorId;

  const childComments = useMemo(() => {
    // Sort child comments with newest first, matching the parent comment sort
    const filtered = allComments.filter((c) => (c.parentId || c.parentID || c.ParentID) === commentId);
    
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.CreatedAt || 0);
      const dateB = new Date(b.createdAt || b.CreatedAt || 0);
      return dateB - dateA; // Newest first
    });
  }, [allComments, commentId]);

  const voteCommentMutation = useVoteCommentMutation();

  const editCommentMutation = useMutation({
    mutationFn: (newContent) =>
      commentService.editComment(commentId, authorId, newContent, authFetch),
    onSuccess: (updatedComment) => {
      console.log("Comment edited:", updatedComment);
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      setIsEditing(false);
      // Temporarily disabled - setWasEdited(true);
      setEditError("");
    },
    onError: (err) => {
      console.error("Comment edit error:", err);
      setEditError(err.message || "Failed to save edit.");
    },
  });

  const handleVoteClick = (isUpvoteIntent) => {
    if (!currentUser?.id) return;
    const currentVote = comment.currentUserVote;
    let voteDirection;

    if (isUpvoteIntent) {
      if (currentVote === 'up') {
        voteDirection = 'none';
      } else {
        voteDirection = 'up';
      }
    } else {
      if (currentVote === 'down') {
        voteDirection = 'none';
      } else {
        voteDirection = 'down';
      }
    }
    voteCommentMutation.mutate({ commentId, postId, voteDirection });
  };

  const handleEditSubmit = () => {
    const trimmedContent = editContent.trim();
    if (!trimmedContent || trimmedContent === comment.content) {
      setIsEditing(false);
      setEditError("");
      return;
    }
    if (!canEdit) return;
    setEditError("");
    editCommentMutation.mutate(trimmedContent);
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
    setEditError("");
  };

  const voteState = comment.currentUserVote;

  const marginLeft = level > 0 ? `${level * 1.5}rem` : "0";
  const formattedDate = formatDisplayDate(
    comment.createdAt || comment.createdAt
  );

  // Handle reply posted
  const handleReplyPosted = () => {
    setIsReplying(false);
    // Call the parent's onReply callback which invalidates the query
    if (onReply) {
      onReply();
    } else {
      // Fallback in case onReply is not provided
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    }
  };

  return (
    <div style={{ marginLeft }} className="my-2">
      <div className="bg-stone-50 dark:bg-dark-slate-700 p-3 rounded-lg text-sm shadow-sm">
        <div className="flex items-center mb-2">
          <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">
            {comment.authorUsername || "anonymous"}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formattedDate}
            {/* Temporarily disabled edited tag until backend updatedAt behavior is fixed 
            {wasEdited && formattedUpdateDate && (
              <span title={`Edited: ${formattedUpdateDate}`}> (edited)</span>
            )}
            */}
          </span>
        </div>

        {isEditing ? (
          <div className="mt-2 mb-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-dark-slate-600 rounded-lg dark:bg-dark-slate-800 dark:text-gray-200 resize-none text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              disabled={editCommentMutation.isPending}
            />
            {editError && (
              <p className="text-xs text-red-500 mt-1">{editError}</p>
            )}
            <div className="flex gap-2 mt-2 text-xs justify-end">
              <button
                onClick={handleCancelEdit}
                disabled={editCommentMutation.isPending}
                className="flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-dark-slate-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-dark-slate-500 disabled:opacity-50"
              >
                <X size={14} /> Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={
                  editCommentMutation.isPending ||
                  !editContent.trim() ||
                  editContent.trim() === comment.content
                }
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <Check size={14} />{" "}
                {editCommentMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words mb-2">
            {comment.content || comment.content}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <VotingSection
            comment={comment}
            voteState={voteState}
            onVote={handleVoteClick}
            isVoting={voteCommentMutation.isPending}
          />
          {currentUser && (
            <button
              onClick={() => setIsReplying(!isReplying)}
              className={"flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"}
            >
              <Reply size={14} /> Reply
            </button>
          )}
          {canEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 hover:text-green-600 dark:hover:text-green-400"
            >
              <Edit2 size={14} /> Edit
            </button>
          )}
        </div>

        {isReplying && (
          <div className="mt-3 ml-4 pl-4 border-l border-gray-300 dark:border-dark-slate-600">
            <CommentForm
              postId={postId}
              parentCommentId={commentId}
              onCommentPosted={handleReplyPosted}
              onCancelReply={() => setIsReplying(false)}
            />
          </div>
        )}
      </div>

      {childComments.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowChildren(!showChildren)}
            className="text-xs text-blue-500 hover:underline flex items-center gap-1 mb-1 ml-1"
          >
            {showChildren ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showChildren ? "hide" : "show"} {childComments.length}{" "}
            {childComments.length === 1 ? "reply" : "replies"}
          </button>
          {showChildren && (
            <div className="border-l border-gray-300 dark:border-dark-slate-600 pl-1">
              {childComments.map((child) => (
                <Comment
                  key={child.ID || child.id}
                  comment={child}
                  allComments={allComments}
                  postId={postId}
                  level={level + 1}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const VotingSection = ({ comment, voteState, onVote, isVoting }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  const handleVoteWithConfetti = (isUpvoteIntent) => {
    const previousVoteState = voteState;
    onVote(isUpvoteIntent);

    if (isUpvoteIntent && previousVoteState !== 'up') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2 relative">
      {showConfetti && <VoteConfetti />}
      <button
        onClick={() => handleVoteWithConfetti(true)}
        disabled={isVoting}
        className={`flex items-center space-x-1 hover:text-green-500 disabled:opacity-50 ${voteState === 'up' ? 'text-green-500' : ''}`}
        aria-label="Upvote comment"
      >
        <ThumbsUp size={14} />
        <span className="font-medium">{comment.upvotes || 0}</span>
      </button>
      <button
        onClick={() => handleVoteWithConfetti(false)}
        disabled={isVoting}
        className={`flex items-center space-x-1 hover:text-red-500 disabled:opacity-50 ${voteState === 'down' ? 'text-red-500' : ''}`}
        aria-label="Downvote comment"
      >
        <ThumbsDown size={14} />
        <span className="font-medium">{comment.downvotes || 0}</span>
      </button>
      <div className="flex items-center text-xs font-semibold">
        <span className="mr-1">Karma:</span>
        <span>{comment.karma !== undefined ? comment.karma : '-'}</span>
      </div>
    </div>
  );
};

Comment.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.string,
    ID: PropTypes.string,
    authorId: PropTypes.string,
    content: PropTypes.string,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
    authorUsername: PropTypes.string,
    upvotes: PropTypes.number,
    downvotes: PropTypes.number,
    karma: PropTypes.number,
    currentUserVote: PropTypes.oneOf(["up", "down", null]),
    parentId: PropTypes.string,
    parentID: PropTypes.string,
  }).isRequired,
  allComments: PropTypes.array.isRequired,
  postId: PropTypes.string.isRequired,
  level: PropTypes.number,
  onReply: PropTypes.func,
};

VotingSection.propTypes = {
  comment: PropTypes.shape({
    upvotes: PropTypes.number,
    downvotes: PropTypes.number,
    karma: PropTypes.number,
    currentUserVote: PropTypes.oneOf(["up", "down", null]),
  }).isRequired,
  voteState: PropTypes.oneOf(["up", "down", null]),
  onVote: PropTypes.func.isRequired,
  isVoting: PropTypes.bool.isRequired,
};

export default Comment;
