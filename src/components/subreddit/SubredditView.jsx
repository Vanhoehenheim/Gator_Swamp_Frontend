import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Post from '../Post';

const SubredditView = () => {
  const { subredditId } = useParams();
  const [subreddit, setSubreddit] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubredditData = async () => {
      try {
        setLoading(true);
        // Fetch subreddit details
        const subredditResponse = await fetch(`http://localhost:8080/subreddit?id=${subredditId}`);
        if (!subredditResponse.ok) throw new Error('Failed to load subreddit');
        const subredditData = await subredditResponse.json();
        setSubreddit(subredditData);

        // Fetch subreddit posts
        const postsResponse = await fetch(`http://localhost:8080/post?subredditId=${subredditId}`);
        if (!postsResponse.ok) throw new Error('Failed to load posts');
        const postsData = await postsResponse.json();
        setPosts(postsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (subredditId) {
      fetchSubredditData();
    }
  }, [subredditId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Loading subreddit...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  if (!subreddit) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Subreddit not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2 font-doto">{subreddit.Name}</h1>
          <p className="text-gray-600">{subreddit.Description}</p>
        </div>

        <div className="space-y-6">
          {posts.length > 0 ? (
            posts.map(post => (
              <Post key={post.ID} post={post} />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <p className="text-gray-600 font-doto">No posts in this subreddit yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubredditView;