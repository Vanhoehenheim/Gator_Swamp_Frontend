import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const Post = ({ post }) => {
    const navigate = useNavigate();
    const { darkMode } = useTheme();
    
    const handlePostClick = () => {
        navigate(`/posts/${post.ID}`);
    }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy • h:mm a');
  };

  return (
    <article 
      onClick={handlePostClick} 
      className="bg-stone-50 dark:bg-dark-slate-800 rounded-lg p-6 lowercase shadow-sm border border-stone-300 dark:border-dark-slate-700 transition-colors cursor-pointer hover:shadow-md"
    >
      <header className="mb-4">
        <h2 className="text-lg text-stone-900 dark:text-white mb-2">
          {post.Title}
        </h2>
        <div className="text-xs text-gray-400 dark:text-gray-500">
          <span>by {post.AuthorUsername}</span>
          <span className="mx-2">•</span>
          <span>{formatDate(post.CreatedAt)}</span>
        </div>
      </header>

      <div className="prose text-sm text-stone-900 dark:text-gray-300 mb-4 whitespace-pre-wrap">
        {post.Content}
      </div>

      <footer className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-slate-700">
        <div className="flex items-center space-x-6 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <span>upvotes: {post.Upvotes}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>downvotes: {post.Downvotes}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>karma: {post.Karma}</span>
          </div>
        </div>
      </footer>
    </article>
  );
};

export default Post;