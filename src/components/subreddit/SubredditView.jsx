import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Post from "../Post";
import { Users, PenSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SubredditView = () => {
  const navigate = useNavigate();
  const { subredditId } = useParams();
  const { userId, user, getUserProfile } = useAuth();
  const [subreddit, setSubreddit] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  // Check initial membership status from user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUserProfile();
        if (userData && userData.subredditID) {
          setIsMember(userData.subredditID.includes(subredditId));
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    fetchUserData();
  }, [subredditId, getUserProfile]);

  // Check membership status from context user data as backup
  useEffect(() => {
    if (user && user.subredditID) {
      setIsMember(user.subredditID.includes(subredditId));
    }
  }, [user, subredditId]);

  // Fetch subreddit data and posts
  useEffect(() => {
    const fetchSubredditData = async () => {
      try {
        setLoading(true);
        // Fetch subreddit details
        const subredditResponse = await fetch(
          `http://localhost:8080/subreddit?id=${subredditId}`
        );
        if (!subredditResponse.ok) throw new Error("Failed to load subreddit");
        const subredditData = await subredditResponse.json();
        setSubreddit(subredditData);

        // Fetch subreddit posts
        const postsResponse = await fetch(
          `http://localhost:8080/post?subredditId=${subredditId}`
        );
        if (!postsResponse.ok) throw new Error("Failed to load posts");
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

  const handleJoinSubreddit = async () => {
    setJoinError("");
    try {
      setIsJoining(true);
      const response = await fetch("http://localhost:8080/subreddit/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subredditId: subredditId,
          userId: userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.Code === "DUPLICATE") {
          setJoinError("You are already a member of this subreddit");
        } else {
          setJoinError(data.Message || "Failed to join subreddit");
        }
        return;
      }

      // Fetch fresh user data to update membership status
      const userData = await getUserProfile();
      if (userData && userData.subredditID) {
        setIsMember(userData.subredditID.includes(subredditId));
      }
    } catch (err) {
      setJoinError("An error occurred while joining the subreddit");
    } finally {
      setIsJoining(false);
    }
  };

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
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold font-doto">{subreddit.Name}</h1>
              <p className="text-gray-600 mt-2">{subreddit.Description}</p>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Users className="w-5 h-5" />
              <span>{subreddit.Members || 0} members</span>
            </div>
          </div>

          {joinError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {joinError}
            </div>
          )}

          {isMember ? (
            <button
              onClick={() => navigate(`/r/${subredditId}/post/create`)}
              className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <PenSquare className="w-5 h-5" />
              <span>create post</span>
            </button>
          ) : (
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              onClick={handleJoinSubreddit}
              disabled={isJoining}
            >
              {isJoining ? "Joining..." : "Join Subreddit"}
            </button>
          )}
        </div>

        <div className="space-y-6">
          {posts.length > 0 ? (
            posts.map((post) => <Post key={post.ID} post={post} />)
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
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
