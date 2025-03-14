import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Post from './Post';
import GatorRelax from '../assets/GatorRelax.svg';
import { feedService } from '../services/feedService';

const Home = () => {
  const { currentUser, authFetch } = useAuth();
  const { darkMode } = useTheme();
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
      <div className="flex justify-center items-center min-h-screen bg-stone-100 dark:bg-dark-slate-900 transition-colors">
        <div className="text-xl text-gray-800 dark:text-gray-300 font-doto">Loading posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-stone-100 dark:bg-navy-800 transition-colors">
        <div className="text-xl text-red-600 font-doto">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 sm:pt-20 bg-stone-100 dark:bg-dark-slate-900 transition-colors">
      <div className="max-w-3xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between w-full mb-4 sm:mb-6">
          <div className="flex-1" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-doto font-bold text-gray-900 dark:text-white text-center transition-colors">
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
            <div className="text-center py-8 sm:py-12 bg-white dark:bg-dark-slate-800 rounded-lg shadow-sm border border-stone-200 dark:border-dark-slate-700 transition-colors">
              <p className="text-gray-600 dark:text-gray-400 font-doto">No posts available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;