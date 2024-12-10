import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { MessageCircle, Users, Mail, Clock } from 'lucide-react';

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
        console.log('Profile data:', data);
        setProfileData(data);
      } catch (err) {
        setError('Failed to load profile');
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId, getUserProfile]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Not available';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Not available';
    }
  };

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
    <div className="max-w-4xl mx-auto p-4">
      {/* Profile Header Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              {profileData.username}
            </h1>
            <div className={`px-3 py-1 rounded-full ${
              profileData.isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {profileData.isConnected ? 'Online' : 'Offline'}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              <span>{profileData.karma} karma</span>
            </div>
            
            <div className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              <span>{profileData.email}</span>
            </div>
            
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              <span>Last active: {formatDate(profileData.lastActive)}</span>
            </div>
          </div>

          <Link 
            to="/messages" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mt-4"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            <span>View Messages</span>
          </Link>
        </div>
      </div>

      {/* Subreddits Card */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Subreddit Memberships</h2>
        <div className="flex flex-wrap gap-2">
          {profileData.subredditName && profileData.subredditName.length > 0 ? (
            profileData.subredditName.map((name, index) => (
              <Link
                key={profileData.subredditID[index]}
                to={`/r/${name.toLowerCase()}`}
                className="bg-gray-100 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                r/{name}
              </Link>
            ))
          ) : (
            <p className="text-gray-500">No subreddit memberships yet</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {profileData.recentPosts?.length > 0 ? (
          <div className="space-y-4">
            {profileData.recentPosts.map(post => (
              <div key={post.id} className="border-b pb-4">
                <Link to={`/posts/${post.id}`} className="block hover:bg-stone-100">
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