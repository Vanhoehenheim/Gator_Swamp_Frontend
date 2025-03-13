import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Post from './Post';
import GatorRelax from '../assets/GatorRelax.svg';
import { feedService } from '../services/feedService';

const Home = () => {
  const { currentUser, authFetch } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        console.log("Fetching posts for user:", currentUser);
        
        const feedData = await feedService.getUserFeed(currentUser.id, authFetch);
        
        if (!feedData || feedData.length === 0) {
          const recentPosts = await feedService.getRecentPosts(authFetch);
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
  
    if (currentUser && currentUser.id) {
      fetchPosts();
    } else {
      setError('No user information available');
      setLoading(false);
    }
  }, [currentUser, authFetch]);

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
    <div className="min-h-screen pt-16 sm:pt-20">
      <div className="max-w-3xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between w-full mb-4 sm:mb-6">
          <div className="flex-1" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-doto font-bold text-gray-900 text-center">
            {posts.length > 0 ? "today's feed" : "recent posts"}
          </h1>
          <div className="flex-1 flex justify-end">
            <img 
              src={GatorRelax} 
              alt="Gator Relaxing Logo" 
              className="size-16 sm:size-28 md:size-40"
            />
          </div>
        </div>
        <div className="space-y-4 sm:space-y-6">
          {posts.map(post => (
            <Post key={post.ID} post={post} />
          ))}

          {posts.length === 0 && (
            <div className="text-center py-8 sm:py-12 bg-white rounded-lg shadow-sm">
              <p className="text-gray-600 font-doto">No posts available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;