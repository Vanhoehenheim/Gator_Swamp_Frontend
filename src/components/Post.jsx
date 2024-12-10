import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
const Post = ({ post }) => {
    const navigate = useNavigate();
    const handlePostClick = () => {
        navigate(`/posts/${post.ID}`);
    }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy • h:mm a');
  };

  return (
    <article onClick={handlePostClick} className="bg-stone-50 rounded-lg p-6 shadow-sm border border-stone-300">
      <header className="mb-4">
        <h2 className="text-xl font-doto font-bold text-stone-900 mb-2">
          {post.Title}
        </h2>
        <div className="text-sm text-gray-600 font-doto">
          <span>By Author {post.AuthorID}</span>
          <span className="mx-2">•</span>
          <span>{formatDate(post.CreatedAt)}</span>
        </div>
      </header>

      <div className="prose font-doto font-semibold text-stone-900 mb-4 whitespace-pre-wrap">
        {post.Content}
      </div>

      <footer className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-6 text-sm text-gray-600 font-doto">
          <div className="flex items-center space-x-2">
            <span>Upvotes: {post.Upvotes}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Downvotes: {post.Downvotes}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Karma: {post.Karma}</span>
          </div>
        </div>
      </footer>
    </article>
  );
};

export default Post;