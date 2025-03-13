import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Users, Mail, Plus, Clock, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import ProfileButton from "./ProfileButton";
import { profileService } from "../services/profileService";

const Profile = () => {
  const { currentUser, authFetch } = useAuth();
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
        console.log("Fetching profile data for user:", currentUser);
        
        // Fetch profile data
        const profileData = await profileService.getProfile(currentUser.id, authFetch);
        console.log("Profile data received:", profileData);
        setProfileData(profileData);

        // Fetch all subreddits
        const subredditsData = await profileService.getAllSubreddits(authFetch);
        setAllSubreddits(subredditsData);

        // Fetch all users
        const usersData = await profileService.getAllUsers(authFetch);
        setAllUsers(usersData.filter((user) => user.id !== currentUser.id));
      } catch (err) {
        setError("Failed to load data");
        console.error("Data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && currentUser.id) {
      fetchAllData();
    } else {
      console.error("No current user found");
      setError("No user information available");
      setLoading(false);
    }
  }, [currentUser, authFetch]);

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Not available";

      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 1) {
        return "Today";
      } else if (diffDays === 1) {
        return "Yesterday";
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Not available";
    }
  };

  const navigateToMessages = (userId) => {
    navigate("/messages", { state: { initialSelectedUser: userId } });
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
      <ProfileButton />
      {/* Profile Header Card */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              {profileData?.username}
            </h1>
            <div
              className={`px-3 py-1 rounded-full ${
                profileData?.isConnected
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {profileData?.isConnected ? "Online" : "Offline"}
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

            <Link
              to="/messages"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mt-4"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              <span>View Messages</span>
            </Link>
          </div>
        </div>
      </div>

      {/* User's Subreddit Memberships */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          your subreddit memberships
        </h2>
        <div className="flex flex-wrap gap-2">
          {profileData?.subredditID &&
          profileData.subredditID.length > 0 ? (
            profileData.subredditID.map((id, index) => (
              <Link
                key={id}
                to={`/r/${id}`}
                className="bg-gray-100 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                r/{profileData.subredditName[index]}
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
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">browse all subreddits</h2>
            <button
              onClick={() => navigate('/create-subreddit')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              create new
            </button>
          </div>
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
                key={subreddit.ID}
                to={`/r/${subreddit.ID}`}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium text-lg">
                  {subreddit.Name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {subreddit.Description}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  {subreddit.Members || 0} members •
                  Created {formatDate(subreddit.CreatedAt)}
                </div>
              </Link>
            ))}

            {/* This section should be rendered if there are no subreddits */}
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
                    <h3 className="font-medium">
                      {user.Username || user.username}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Karma: {user.Karma || user.karma || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      Joined {formatDate(user.JoinedAt || user.joinedAt)}
                    </p>
                  </div>
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
