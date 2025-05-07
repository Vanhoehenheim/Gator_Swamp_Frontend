import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import { Users, Mail, Plus, Clock, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { useUserProfile, useAllSubreddits, useAllUsers } from '../hooks/useProfileData';
import { Analytics } from "@vercel/analytics/react"

const Profile = () => {
  const { currentUser } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [showAllSubreddits, setShowAllSubreddits] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);

  const { 
      data: profileData, 
      isLoading: isLoadingProfile, 
      isError: isErrorProfile, 
      error: errorProfile 
  } = useUserProfile(currentUser?.id);

  const { 
      data: allSubreddits = [], 
      isLoading: isLoadingSubreddits, 
      isError: isErrorSubreddits, 
      error: errorSubreddits 
  } = useAllSubreddits();

  const { 
      data: allUsersData = [], 
      isLoading: isLoadingUsers, 
      isError: isErrorUsers, 
      error: errorUsers 
  } = useAllUsers();

  const isLoading = isLoadingProfile || isLoadingSubreddits || isLoadingUsers;
  const isError = isErrorProfile || isErrorSubreddits || isErrorUsers;
  const error = errorProfile || errorSubreddits || errorUsers;

  const allUsers = allUsersData.filter(user => user.id !== currentUser?.id);

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

  if (isLoading && !profileData) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4 bg-stone-100 dark:bg-dark-slate-900">
        <div className="text-lg md:text-xl text-gray-600 dark:text-gray-300">Loading profile...</div>
      </div>
    );
  }

  if (isError && !profileData) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4 bg-stone-100 dark:bg-navy-800">
        <div className="text-lg md:text-xl text-red-600">{error instanceof Error ? error.message : 'Failed to load profile data'}</div>
      </div>
    );
  }

  if (!currentUser?.id && !isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4 bg-stone-100 dark:bg-dark-slate-900">
        <div className="text-lg md:text-xl text-gray-600 dark:text-gray-300">Please log in to view your profile.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6 pt-20 md:pt-28 bg-stone-100 dark:bg-dark-slate-900 min-h-screen">
      <Analytics />
      <div className="bg-white dark:bg-dark-slate-800 rounded-lg shadow-lg p-4 sm:p-6 transition-colors">
        <div className="flex flex-col space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words">
              {profileData?.username}
            </h1>
            <div
              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
                profileData?.isConnected
                  ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              }`}
            >
              {profileData?.isConnected ? "Online" : "Offline"}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            <div className="flex items-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span>{profileData?.karma} karma</span>
            </div>

            <div className="flex items-center">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="break-all">{profileData?.email}</span>
            </div>

            <Link
              to="/messages"
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-2"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span>View Messages</span>
            </Link>
          </div>
        </div>
      </div>

      {profileData?.subredditID &&
      profileData.subredditID.length > 0 ? (
        <div className="bg-white dark:bg-dark-slate-800 rounded-lg shadow-lg p-4 sm:p-6 transition-colors">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">
            your subreddit memberships
          </h2>
          <div className="flex flex-wrap gap-2">
            {profileData.subredditID.map((id, index) => (
              <Link
                key={id}
                to={`/r/${id}`}
                className="bg-gray-100 dark:bg-dark-slate-700 px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-dark-slate-600 transition-colors"
              >
                r/{profileData.subredditName[index]}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">no subreddit memberships yet</p>
      )}

      <div className="bg-white dark:bg-dark-slate-800 rounded-lg shadow-lg p-4 sm:p-6 transition-colors">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">browse all subreddits</h2>
            <button
              onClick={() => navigate('/create-subreddit')}
              className="inline-flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-4 sm:py-2 bg-stone-800 dark:bg-stone-700 text-white rounded-lg hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors text-xs sm:text-sm font-medium"
            >
              <Plus size={14} className="sm:size-4" />
              <span className="hidden xs:inline">create new</span>
              <span className="xs:hidden">new</span>
            </button>
          </div>
          <button
            onClick={() => setShowAllSubreddits(!showAllSubreddits)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {showAllSubreddits ? <ChevronUp size={18} className="sm:size-20" /> : <ChevronDown size={18} className="sm:size-20" />}
          </button>
        </div>

        {showAllSubreddits && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {isLoadingSubreddits ? <p>Loading subreddits...</p> : isErrorSubreddits ? <p className="text-red-500">Error loading subreddits</p> :
             allSubreddits.length > 0 ? allSubreddits.map((subreddit) => (
              <Link
                key={subreddit.id}
                to={`/r/${subreddit.id}`}
                className="p-3 sm:p-4 border dark:border-dark-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-slate-700 transition-colors"
              >
                <h3 className="font-medium text-base sm:text-lg text-gray-900 dark:text-white">
                  {subreddit.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {subreddit.description}
                </p>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {subreddit.members || 0} members •
                  Created {formatDate(subreddit.createdAt)}
                </div>
              </Link>
            )) : <p>No subreddits found.</p>}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-dark-slate-800 rounded-lg shadow-lg p-4 sm:p-6 transition-colors">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">start a conversation</h2>
          <button
            onClick={() => setShowAllUsers(!showAllUsers)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {showAllUsers ? <ChevronUp size={18} className="sm:size-20" /> : <ChevronDown size={18} className="sm:size-20" />}
          </button>
        </div>

        {showAllUsers && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {isLoadingUsers ? <p>Loading users...</p> : isErrorUsers ? <p className="text-red-500">Error loading users</p> :
             allUsers.length > 0 ? allUsers.map((user) => (
              <button
                key={user.ID || user.id}
                onClick={() => navigateToMessages(user.ID || user.id)}
                className="p-3 sm:p-4 border dark:border-dark-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-slate-700 transition-colors text-left w-full"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">
                      {user.Username || user.username}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Karma: {user.Karma || user.karma || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Joined {formatDate(user.JoinedAt || user.joinedAt)}
                    </p>
                  </div>
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
                </div>
              </button>
            )) : <p>No other users found.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
