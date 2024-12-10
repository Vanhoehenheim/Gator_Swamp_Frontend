import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Post from './Post';

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-stone-100">
        <div className="text-xl text-gray-800 font-doto">Loading posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-stone-100">
        <div className="text-xl text-red-600 font-doto">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl font-doto font-bold text-gray-900 mb-8 text-center">
          {posts.length > 0 ? "Today's Feed" : "Recent Posts"}
        </h1>

        <div className="space-y-6">
          {posts.map(post => (
            <Post key={post.ID} post={post} />
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