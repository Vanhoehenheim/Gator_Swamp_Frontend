import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { subredditService } from "../../services/subredditService";
import Post from "../Post";
import { Users, PenSquare, ArrowLeft } from "lucide-react";

const SubredditView = () => {
  const navigate = useNavigate();
  const { subredditId } = useParams();
  const { currentUser, token, authFetch } = useAuth();
  const [subreddit, setSubreddit] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!subredditId || !currentUser?.id || !token) {
        setError("Please login to view this subreddit");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const subredditData = await subredditService.getSubreddit(
          subredditId, authFetch
        );
        setSubreddit(subredditData);

        // Check membership status
        const membershipData = await subredditService.getMembers(subredditId, authFetch);
        setIsMember(membershipData.includes(currentUser.id));

        // Fetch posts
        const postsData = await subredditService.getPosts(subredditId, authFetch);
        setPosts(postsData);
      } catch (err) {
        console.error("Error loading subreddit:", err);
        setError(err.message || "Failed to load subreddit");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subredditId, currentUser, token, authFetch]);

  const handleJoinSubreddit = useMemo(() => async () => {
    if (!subredditId || !currentUser?.id) return;

    setJoinError("");
    try {
      setIsJoining(true);
      await subredditService.joinSubreddit(subredditId, currentUser.id, authFetch);
      setIsMember(true);
    } catch (err) {
      console.error("Error joining subreddit:", err);
      if (err.code === "DUPLICATE") {
        setJoinError("You are already a member of this subreddit");
      } else {
        setJoinError(err.message || "An error occurred while joining the subreddit");
      }
    } finally {
      setIsJoining(false);
    }
  }, [subredditId, currentUser, authFetch]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-16">
        <div className="text-lg sm:text-xl text-gray-600">Loading subreddit...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-16">
        <div className="text-lg sm:text-xl text-red-600">{error}</div>
      </div>
    );
  }

  if (!subreddit) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-16">
        <div className="text-lg sm:text-xl text-gray-600">subreddit not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-dark-slate-900 bg-stone-100 pt-16 sm:pt-20 pb-8">
      <div className="max-w-3xl mx-auto px-3 sm:px-4">
        
        <div className="bg-white dark:bg-dark-slate-800 lowercase rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
            <div className="mb-3 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold font-doto">{subreddit.Name}</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">{subreddit.Description}</p>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 text-gray-600 text-sm sm:text-base">
              <Users className="size-4 sm:size-5" />
              <span>{subreddit.Members || 0} members</span>
            </div>
          </div>

          {joinError && (
            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {joinError}
            </div>
          )}

          {isMember ? (
            <button
              onClick={() => navigate(`/r/${subredditId}/post/create`)}
              className="flex items-center space-x-1 sm:space-x-2 bg-black text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm sm:text-base"
            >
              <PenSquare className="size-4 sm:size-5" />
              <span>create post</span>
            </button>
          ) : (
            <button
              className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto"
              onClick={handleJoinSubreddit}
              disabled={isJoining}
            >
              {isJoining ? "Joining..." : "Join Subreddit"}
            </button>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6">
          {posts.length > 0 ? (
            posts.map((post) => <Post key={post.ID} post={post} />)
          ) : (
            <div className="text-center py-8 sm:py-12 bg-white rounded-lg shadow-sm">
              <p className="text-gray-600 font-doto">
                no posts in this subreddit yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubredditView;