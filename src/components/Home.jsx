import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const Home = () => {
  const { userId, getUserFeed } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        // First try to get user's personalized feed
        const feedData = await getUserFeed();
        
        // If feed is empty or doesn't exist, fetch recent posts
        if (!feedData || feedData.length === 0) {
          const recentResponse = await fetch('http://localhost:8080/posts/recent', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!recentResponse.ok) {
            throw new Error('Failed to load recent posts');
          }
          
          const recentPosts = await recentResponse.json();
          if (!recentPosts || recentPosts.length === 0) {
            setError('No posts available');
            setPosts([]);
          } else {
            setPosts(recentPosts);
          }
        } else {
          setPosts(feedData);
        }
      } catch (err) {
        setError('Failed to load posts');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
  
    if (userId) {
      fetchPosts();
    }
  }, [userId, getUserFeed]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy • h:mm a');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-xl text-gray-800 font-doto">Loading posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-xl text-red-600 font-doto">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="mx-auto">
        <h1 className="text-4xl font-doto font-bold text-gray-900 mb-8 text-center">
          {posts.length > 0 ? "Today's Feed" : "Recent Posts"}
        </h1>

        <div className="space-y-6">
          {posts.map(post => (
            <article 
              key={post.ID} 
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-100"
            >
              <header className="mb-4">
                <h2 className="text-2xl font-doto font-bold text-gray-900 mb-2">
                  {post.Title}
                </h2>
                <div className="text-sm text-gray-600 font-doto">
                  <span>Author : {post.AuthorUsername}</span>
                  <span className="mx-2">•</span>
                  <span>{formatDate(post.CreatedAt)}</span>
                </div>
              </header>

              <div className="font-doto font-semibold text-black mb-4 whitespace-pre-wrap">
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
                  <div className="flex items-center space-x-2">
                    <span>Subreddit: {post.SubredditName}</span>
                  </div>
                </div>
              </footer>
            </article>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <p className="text-gray-600 font-doto">No posts available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;