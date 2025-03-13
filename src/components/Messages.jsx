import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { MessageCircle, Send, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import ProfileButton from './ProfileButton';
import { messageService } from '../services/messageService';

const Messages = () => {
  const location = useLocation();
  const { currentUser, authFetch } = useAuth();
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfiles, setUserProfiles] = useState({});
  const pollingInterval = useRef(null);
  const userId = currentUser?.id;

  useEffect(() => {
    if (location.state?.initialSelectedUser) {
      setSelectedUser(location.state.initialSelectedUser);
    }
  }, [location.state]);

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'h:mm a');
    }
    return format(date, 'MMM d, h:mm a');
  };

  const markMessagesAsRead = async (partnerId) => {
    try {
      const unreadMessages = messages.filter(
        msg => msg.fromId === partnerId && 
              msg.toId === userId && 
              !msg.isRead
      );

      if (unreadMessages.length === 0) return;

      await messageService.markAsRead(
        partnerId,
        userId,
        unreadMessages.map(msg => msg.id),
        authFetch
      );

      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.fromId === partnerId && msg.toId === userId
            ? { ...msg, isRead: true }
            : msg
        )
      );
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const fetchMessages = useCallback(async () => {
    if (!userId) return [];
    
    try {
      const allMessages = await messageService.getMessages(userId, authFetch);
      const conversationsMap = new Map();

      allMessages.forEach(msg => {
        const partnerId = msg.fromId === userId ? msg.toId : msg.fromId;
        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, []);
        }
        conversationsMap.get(partnerId).push(msg);
      });

      const conversationsArray = Array.from(conversationsMap.entries())
        .map(([partnerId, messages]) => ({
          partnerId,
          messages,
          latestMessage: messages[messages.length - 1]
        }))
        .sort((a, b) =>
          new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt)
        );

      setConversations(conversationsArray);
      setMessages(allMessages);

      if (selectedUser) {
        markMessagesAsRead(selectedUser);
      }

      return conversationsArray;
    } catch (err) {
      console.error('Error in fetchMessages:', err);
      setError('Failed to load messages: ' + err.message);
      return [];
    }
  }, [userId, selectedUser, authFetch]);

  useEffect(() => {
    if (userId) {
      fetchMessages().then(async (conversations) => {
        const uniqueUserIds = [...new Set(conversations.map(c => c.partnerId))];
        
        if (location.state?.initialSelectedUser) {
          uniqueUserIds.push(location.state.initialSelectedUser);
        }
        
        const profiles = {};
        for (const id of uniqueUserIds) {
          try {
            const profile = await messageService.getUserProfile(id, authFetch);
            profiles[id] = profile;
          } catch (err) {
            console.error(`Failed to fetch profile for user ${id}:`, err);
          }
        }
        setUserProfiles(profiles);
        setLoading(false);
      });

      pollingInterval.current = setInterval(fetchMessages, 3000);

      return () => {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
        }
      };
    } else {
      setLoading(false);
      setError('No user information available');
    }
  }, [userId, fetchMessages, location.state, authFetch]);

  useEffect(() => {
    if (selectedUser) {
      markMessagesAsRead(selectedUser);
    }
  }, [selectedUser]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !userId) return;

    try {
      await messageService.sendMessage({
        fromId: userId,
        toId: selectedUser,
        content: newMessage
      }, authFetch);

      setNewMessage('');
      await fetchMessages();
    } catch (err) {
      setError('Failed to send message');
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
    <div className="max-w-6xl mx-auto p-4 h-screen py-12">
      <ProfileButton />
      <div className="bg-white rounded-lg shadow-lg h-[calc(100vh-2rem)]">
        <div className="flex h-full">
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
                    msg => msg.toId === userId && !msg.isRead
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
                          <h3 className="font-bold">
                            {partnerProfile?.username || 'Loading...'}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {latestMessage.content}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatMessageDate(latestMessage.createdAt)}
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

          {selectedUser ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b flex items-center">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="md:hidden mr-4"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold">
                  {userProfiles[selectedUser]?.username || 'Loading...'}
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages
                  .filter(msg => 
                    (msg.fromId === userId && msg.toId === selectedUser) ||
                    (msg.fromId === selectedUser && msg.toId === userId)
                  )
                  .map(message => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.fromId === userId ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.fromId === userId
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="">{message.content}</p>
                        <div className="flex items-center justify-end mt-1 space-x-1">
                          <span className="text-xs opacity-75">
                            {formatMessageDate(message.createdAt)}
                          </span>
                          {message.fromId === userId && (
                            message.isRead ? <CheckCheck className="w-4 h-4" /> : <Check className="w-4 h-4" />
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
                    placeholder="type a message..."
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <p className="">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;