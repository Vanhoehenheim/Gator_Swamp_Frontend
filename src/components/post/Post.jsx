import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

const Post = ({ post }) => {
    const navigate = useNavigate();
    const { darkMode } = useTheme();
    
    const handlePostClick = () => {
        const postId = post.id || post.ID; // Get the ID regardless of case
        if (postId) { // Only navigate if we found an ID
            navigate(`/posts/${postId}`);
        } else {
            console.error("Could not navigate to post, ID is missing:", post);
            // Optionally, show an error message to the user
        }
    }

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Unknown date';
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Unknown date';
      return format(date, 'MMMM d, yyyy • h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  return (
    <article 
      onClick={handlePostClick} 
      className="bg-stone-50 dark:bg-dark-slate-800 rounded-lg p-6 lowercase shadow-sm border border-stone-300 dark:border-dark-slate-700 transition-colors cursor-pointer hover:shadow-md"
    >
      <header className="mb-4">
        <h2 className="text-lg text-stone-900 dark:text-white mb-2">
          {post.title}
        </h2>
        <div className="text-xs text-gray-400 dark:text-gray-500">
          <span>by {post.authorUsername}</span>
          <span className="mx-2">•</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>
      </header>

      <div className="prose text-sm text-stone-900 dark:text-gray-300 mb-4 whitespace-pre-wrap">
        {post.content}
      </div>

      <footer className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-slate-700">
        <div className="flex items-center space-x-6 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <span>upvotes: {post.upvotes}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>downvotes: {post.downvotes}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>karma: {post.karma}</span>
          </div>
        </div>
      </footer>
    </article>
  );
};

export default Post;