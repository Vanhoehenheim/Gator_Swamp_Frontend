import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Send, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

const Messages = () => {
  const { userId, getUserProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfiles, setUserProfiles] = useState({});

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'h:mm a');
    }
    return format(date, 'MMM d, h:mm a');
  };

  const fetchMessages = useCallback(async () => {
    try {
      console.log('Attempting to fetch messages for userId:', userId);
      
      const response = await fetch(`http://localhost:8080/messages?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('response not ok:', response.status, errorText);
        throw new Error(`failed to fetch messages: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('fetched response data:', responseData);
      
      // Extract messages from the response
      const allMessages = Array.isArray(responseData) ? responseData : [];
      console.log('extracted messages:', allMessages);

      setMessages(allMessages);

      // Group messages by conversation partner
      const conversationsMap = allMessages.reduce((acc, message) => {
        const partnerId = message.FromID === userId ? message.ToID : message.FromID;
        if (!acc[partnerId]) {
          acc[partnerId] = [];
        }
        acc[partnerId].push(message);
        return acc;
      }, {});

      // Sort messages within each conversation by date
      Object.keys(conversationsMap).forEach(partnerId => {
        conversationsMap[partnerId].sort((a, b) => 
          new Date(a.CreatedAt) - new Date(b.CreatedAt)
        );
      });

      const conversationsArray = Object.entries(conversationsMap)
        .map(([partnerId, messages]) => ({
          partnerId,
          messages,
          latestMessage: messages[messages.length - 1]
        }))
        .sort((a, b) => 
          new Date(b.latestMessage.CreatedAt) - new Date(a.latestMessage.CreatedAt)
        );

      console.log('processed conversations:', conversationsArray);
      setConversations(conversationsArray);

      // Fetch user profiles for all conversation partners
      const uniqueUserIds = [...new Set(conversationsArray.map(c => c.partnerId))];
      const profiles = {};
      for (const id of uniqueUserIds) {
        try {
          const profile = await fetch(`http://localhost:8080/user/profile?userId=${id}`, {
            headers: {
              'Content-Type': 'application/json',
            }
          });
          if (profile.ok) {
            profiles[id] = await profile.json();
          }
        } catch (err) {
          console.error(`failed to fetch profile for user ${id}:`, err);
        }
      }
      setUserProfiles(profiles);
    } catch (err) {
      console.error('error in fetchMessages:', err);
      setError('failed to load messages: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, getUserProfile]);

  useEffect(() => {
    if (userId) {
      fetchMessages();
    }
  }, [userId, fetchMessages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const response = await fetch('http://localhost:8080/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          FromID: userId,
          ToID: selectedUser,
          Content: newMessage
        })
      });

      if (!response.ok) {
        throw new Error('failed to send message');
      }

      const sentMessage = await response.json();
      setMessages([...messages, sentMessage]);
      setNewMessage('');
      await fetchMessages();
    } catch (err) {
      setError('failed to send message');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600 font-doto">Loading messages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-600 font-doto">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 h-screen">
      <div className="bg-white rounded-lg shadow-lg h-[calc(100vh-2rem)]">
        <div className="flex h-full">
          {/* Conversations List */}
          <div className={`w-1/3 border-r ${selectedUser ? 'hidden md:block' : 'w-full'}`}>
            <div className="p-4 border-b">
              <h1 className="text-2xl font-bold font-doto">Messages</h1>
            </div>
            <div className="overflow-y-auto h-[calc(100%-4rem)]">
              {conversations.length > 0 ? (
                conversations.map(({ partnerId, messages: convoMessages }) => {
                  const latestMessage = convoMessages[convoMessages.length - 1];
                  const partnerProfile = userProfiles[partnerId];
                  const unreadCount = convoMessages.filter(
                    msg => msg.ToID === userId && !msg.IsRead
                  ).length;

                  return (
                    <div
                      key={partnerId}
                      onClick={() => setSelectedUser(partnerId)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedUser === partnerId ? 'bg-gray-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold font-doto">
                            {partnerProfile?.username || 'Loading...'}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {latestMessage.Content}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatMessageDate(latestMessage.CreatedAt)}
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <div className="mt-2">
                          <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                            {unreadCount} new
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No conversations yet
                </div>
              )}
            </div>
          </div>

          {/* Message Thread or Empty State */}
          {selectedUser ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b flex items-center">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="md:hidden mr-4"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold font-doto">
                  {userProfiles[selectedUser]?.username || 'Loading...'}
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages
                  .filter(msg => 
                    (msg.FromID === userId && msg.ToID === selectedUser) ||
                    (msg.FromID === selectedUser && msg.ToID === userId)
                  )
                  .map(message => (
                    <div
                      key={message.ID}
                      className={`flex ${
                        message.FromID === userId ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.FromID === userId
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="font-doto">{message.Content}</p>
                        <div className="flex items-center justify-end mt-1 space-x-1">
                          <span className="text-xs opacity-75">
                            {formatMessageDate(message.CreatedAt)}
                          </span>
                          {message.FromID === userId && (
                            message.IsRead ? <CheckCheck className="w-4 h-4" /> : <Check className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-doto"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageCircle className="w-16 h-16 mx-auto mb-4" />
                <p className="font-doto">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;