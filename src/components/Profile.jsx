import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Mail, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const Profile = () => {
  const { userId, getUserProfile } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [allSubreddits, setAllSubreddits] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllSubreddits, setShowAllSubreddits] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        // Fetch profile data
        const data = await getUserProfile();
        setProfileData(data);

        // Fetch all subreddits
        const subredditsResponse = await fetch('http://localhost:8080/subreddit', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (!subredditsResponse.ok) throw new Error('Failed to fetch subreddits');
        const subredditsData = await subredditsResponse.json();
        setAllSubreddits(subredditsData);

        // Fetch all users
        const usersResponse = await fetch('http://localhost:8080/users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (!usersResponse.ok) throw new Error('Failed to fetch users');
        const usersData = await usersResponse.json();
        setAllUsers(usersData.filter(user => user.id !== userId));

      } catch (err) {
        setError('Failed to load data');
        console.error('Data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchAllData();
    }
  }, [userId, getUserProfile]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Not available';
      
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 1) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Not available';
    }
  };

  const navigateToMessages = (userId) => {
    navigate('/messages', { state: { initialSelectedUser: userId } });
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

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              {profileData?.username}
            </h1>
            <div className={`px-3 py-1 rounded-full ${
              profileData?.isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {profileData?.isConnected ? 'Online' : 'Offline'}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              <span>{profileData?.karma} karma</span>
            </div>
            
            <div className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              <span>{profileData?.email}</span>
            </div>
            
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              <span>Last active: {formatDate(profileData?.lastActive)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* User's Subreddit Memberships */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">your subreddit memberships</h2>
        <div className="flex flex-wrap gap-2">
          {profileData?.subredditName && profileData.subredditName.length > 0 ? (
            profileData.subredditName.map((name, index) => (
              <Link
                key={profileData.subredditID[index]}
                to={`/r/${profileData.subredditID[index]}`}
                className="bg-gray-100 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                r/{name}
              </Link>
            ))
          ) : (
            <p className="text-gray-500">no subreddit memberships yet</p>
          )}
        </div>
      </div>

      {/* Browse All Subreddits Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">browse all subreddits</h2>
          <button
            onClick={() => setShowAllSubreddits(!showAllSubreddits)}
            className="text-gray-500 hover:text-gray-700"
          >
            {showAllSubreddits ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        
        {showAllSubreddits && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allSubreddits.map((subreddit) => (
              <Link
                key={subreddit.ID || subreddit.id}
                to={`/r/${subreddit.ID || subreddit.id}`}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium text-lg">{subreddit.Name || subreddit.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {subreddit.Description || subreddit.description}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  {subreddit.Members || subreddit.members || 0} members • Created {formatDate(subreddit.CreatedAt || subreddit.createdAt)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Browse Users Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">start a conversation</h2>
          <button
            onClick={() => setShowAllUsers(!showAllUsers)}
            className="text-gray-500 hover:text-gray-700"
          >
            {showAllUsers ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        
        {showAllUsers && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allUsers.map((user) => (
              <button
                key={user.ID || user.id}
                onClick={() => navigateToMessages(user.ID || user.id)}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left w-full"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{user.Username || user.username}</h3>
                    <p className="text-sm text-gray-600">Karma: {user.Karma || user.karma || 0}</p>
                    <p className="text-xs text-gray-500">Joined {formatDate(user.JoinedAt || user.joinedAt)}</p>
                  </div>
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">recent activity</h2>
        {profileData?.recentPosts?.length > 0 ? (
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
          <p className="text-gray-500">no recent activity!</p>
        )}
      </div>
    </div>
  );
};

export default Profile;