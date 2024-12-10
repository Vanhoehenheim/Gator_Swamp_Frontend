import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CommentSection from './Comments/CommentSection';

const PostDetail = () => {
  const { postId } = useParams();
  const { userId, token } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voteState, setVoteState] = useState(null);

  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        // Fetch post details
        console.log(postId);
        const postResponse = await fetch(`http://localhost:8080/post?id=${postId}`);
        if (!postResponse.ok) throw new Error('Failed to load post');
        const postData = await postResponse.json();
        setPost(postData);

        // Fetch comments
        const commentsResponse = await fetch(`http://localhost:8080/comment/post?postId=${postId}`);
        if (!commentsResponse.ok) throw new Error('Failed to load comments');
        const commentsData = await commentsResponse.json();
        setComments(commentsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [postId]);

  const handleVote = async (isUpvote) => {
    try {
      const response = await fetch(`http://localhost:8080/post/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          userId,
          isUpvote
        }),
      });

      if (!response.ok) throw new Error('Failed to vote');
      
      const updatedPost = await response.json();
      setPost(updatedPost);
      // Update the vote state for visual feedback
      if ((isUpvote && voteState === 'up') || (!isUpvote && voteState === 'down')) {
        setVoteState(null);
      } else {
        setVoteState(isUpvote ? 'up' : 'down');
      }
    } catch (err) {
      console.error('Voting error:', err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`http://localhost:8080/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          content: newComment
        }),
      });

      if (!response.ok) throw new Error('Failed to post comment');
      
      const comment = await response.json();
      setComments([...comments, comment]);
      setNewComment('');
    } catch (err) {
      console.error('Comment error:', err);
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <article className="bg-stone-50 rounded-lg p-6 shadow-sm border border-gray-100">
        <header className="mb-4">
          <h1 className="text-3xl font-doto font-bold text-gray-900 mb-2">
            {post.Title}
          </h1>
          <div className="text-sm text-gray-600">
            <span>By {post.AuthorUsername}</span>
            <span className="mx-2">•</span>
            <span>{formatDate(post.CreatedAt)}</span>
          </div>
        </header>

        <div className="prose font-doto text-gray-800 mb-6 whitespace-pre-wrap">
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
          size={20} 
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
          size={20} 
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