// src/components/Profile.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Cake, MessageCircle, Users } from 'lucide-react';

const Profile = () => {
  const { userId, getUserProfile } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        setProfileData(data);
      } catch (err) {
        setError('Failed to load profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId, getUserProfile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Loading profile...</div>
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

  if (!profileData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{profileData.username}</h1>
            <div className="mt-2 flex items-center space-x-4 text-gray-600">
              <div className="flex items-center">
                <Cake className="w-5 h-5 mr-2" />
                <span>Joined {new Date(profileData.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span>{profileData.karma} karma</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Subreddits</h2>
          <div className="flex flex-wrap gap-2">
            {profileData.subreddits?.map(subreddit => (
              <Link
                key={subreddit.id}
                to={`/r/${subreddit.name}`}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-sm"
              >
                r/{subreddit.name}
              </Link>
            ))}
            {(!profileData.subreddits || profileData.subreddits.length === 0) && (
              <span className="text-gray-500">No subreddit memberships yet</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {profileData.recentPosts?.length > 0 ? (
          <div className="space-y-4">
            {profileData.recentPosts.map(post => (
              <div key={post.id} className="border-b pb-4">
                <Link to={`/posts/${post.id}`} className="block hover:bg-gray-50">
                  <h3 className="font-medium">{post.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{post.content}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    Posted to r/{post.subredditName} • {post.karma} karma
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No recent activity</p>
        )}
      </div>
    </div>
  );
};

export default Profile;