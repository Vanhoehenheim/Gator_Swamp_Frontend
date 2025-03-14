import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, Send, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import ProfileButton from './ProfileButton';
import { messageService } from '../services/messageService';

const Messages = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, authFetch } = useAuth();
  const { darkMode } = useTheme();
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
    // If no user is authenticated, redirect to login
    if (!currentUser || !userId) {
      navigate('/login');
      return;
    }

    if (location.state?.initialSelectedUser) {
      setSelectedUser(location.state.initialSelectedUser);
    }
  }, [location.state, currentUser, userId, navigate]);

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
      if (!partnerId || !userId) return;
      
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
      
      // Ensure allMessages is an array even if the response is null or undefined
      const safeMessages = Array.isArray(allMessages) ? allMessages : [];
      const conversationsMap = new Map();

      safeMessages.forEach(msg => {
        const partnerId = msg.fromId === userId ? msg.toId : msg.fromId;
        // Skip messages with undefined partner IDs
        if (!partnerId) return;
        
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
      setMessages(safeMessages);

      if (selectedUser) {
        markMessagesAsRead(selectedUser);
      }

      return conversationsArray;
    } catch (err) {
      console.error('Error in fetchMessages:', err);
      setError('Failed to load messages. Please try again later.');
      return [];
    }
  }, [userId, selectedUser, authFetch]);

  useEffect(() => {
    if (userId) {
      fetchMessages().then(async (conversations) => {
        try {
          // Filter out any undefined IDs first
          const uniqueUserIds = [...new Set(
            conversations
              .map(c => c.partnerId)
              .filter(id => id !== undefined && id !== null)
          )];
          
          if (location.state?.initialSelectedUser) {
            const initialUser = location.state.initialSelectedUser;
            if (initialUser && !uniqueUserIds.includes(initialUser)) {
              uniqueUserIds.push(initialUser);
            }
          }
          
          const profiles = {};
          for (const id of uniqueUserIds) {
            try {
              const profile = await messageService.getUserProfile(id, authFetch);
              profiles[id] = profile;
            } catch (err) {
              console.error(`Failed to fetch profile for user ${id}:`, err);
              // Provide a fallback so UI doesn't break
              profiles[id] = { username: 'Unknown User' };
            }
          }
          setUserProfiles(profiles);
        } catch (err) {
          console.error('Error processing conversations:', err);
        } finally {
          setLoading(false);
        }
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
      <div className="flex justify-center items-center min-h-screen bg-stone-100 dark:bg-dark-slate-900">
        <div className="text-xl text-gray-600 dark:text-gray-400 font-doto">loading messages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-stone-100 dark:bg-navy-800">
        <div className="text-xl text-red-600 font-doto">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-dark-slate-900 pt-16 sm:pt-20 pb-6 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        <div className="bg-stone-50 dark:bg-dark-slate-800 rounded-lg shadow-sm overflow-hidden border border-stone-200 dark:border-dark-slate-700 h-[calc(100vh-8rem)] transition-colors duration-200">
          <div className="flex h-full">
            {/* Sidebar - Conversations List */}
            <div className={`w-full md:w-1/3 border-r border-stone-200 dark:border-dark-slate-700 ${selectedUser ? 'hidden md:block' : 'block'}`}>
              <div className="p-4 border-b border-stone-200 dark:border-dark-slate-700">
                <h1 className="text-xl font-bold font-doto text-stone-900 dark:text-white">messages</h1>
              </div>
              <div className="overflow-y-auto h-[calc(100%-4rem)]">
                {conversations.length > 0 ? (
                  conversations.map(({ partnerId, messages: convoMessages }) => {
                    const latestMessage = convoMessages[convoMessages.length - 1];
                    const partnerProfile = userProfiles[partnerId] || { username: 'Unknown User' };
                    const unreadCount = convoMessages.filter(
                      msg => msg.toId === userId && !msg.isRead
                    ).length;

                    return (
                      <div
                        key={partnerId}
                        onClick={() => setSelectedUser(partnerId)}
                        className={`p-4 border-b border-stone-200 dark:border-dark-slate-700 cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-dark-slate-700 ${
                          selectedUser === partnerId ? 'bg-stone-100 dark:bg-dark-slate-700' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-mono font-medium text-stone-900 dark:text-white">
                              {partnerProfile?.username || 'unknown user'}
                            </h3>
                            <p className="text-sm text-stone-600 dark:text-gray-300 truncate">
                              {latestMessage.content}
                            </p>
                          </div>
                          <div className="text-xs text-stone-500 dark:text-gray-400 font-mono">
                            {formatMessageDate(latestMessage.createdAt)}
                          </div>
                        </div>
                        {unreadCount > 0 && (
                          <div className="mt-2">
                            <span className="bg-black text-white dark:bg-white dark:text-navy-900 px-2 py-1 rounded-full text-xs font-mono">
                              {unreadCount} new
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-stone-500 dark:text-gray-400 font-mono">
                    no conversations yet
                  </div>
                )}
              </div>
            </div>

            {/* Main Chat Area */}
            {selectedUser ? (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-stone-200 dark:border-dark-slate-700 flex items-center">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="md:hidden mr-4 text-stone-700 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-lg font-bold font-mono text-stone-900 dark:text-white">
                    {userProfiles[selectedUser]?.username || 'unknown user'}
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50 dark:bg-dark-slate-800">
                  {messages
                    .filter(msg => 
                      (msg.fromId === userId && msg.toId === selectedUser) ||
                      (msg.fromId === selectedUser && msg.toId === userId)
                    )
                    .map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.fromId === userId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.fromId === userId
                              ? 'bg-black text-white'
                              : 'bg-stone-100 text-stone-900 dark:bg-dark-slate-700 dark:text-white'
                          }`}
                        >
                          <p className="font-mono">{message.content}</p>
                          <div className="flex items-center justify-end mt-1 space-x-1">
                            <span className="text-xs opacity-75 font-mono">
                              {formatMessageDate(message.createdAt)}
                            </span>
                            {message.fromId === userId && (
                              <span className="text-xs">
                                {message.isRead ? 
                                  <CheckCheck className="w-3 h-3" /> : 
                                  <Check className="w-3 h-3" />}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                <form onSubmit={sendMessage} className="p-4 border-t border-stone-200 dark:border-dark-slate-700 bg-stone-50 dark:bg-dark-slate-800">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="type a message..."
                      className="flex-1 p-2 border-2 border-stone-200 dark:border-dark-slate-700 rounded-full bg-white dark:bg-dark-slate-700 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white text-stone-900 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-black dark:bg-white text-white dark:text-navy-900 p-2 rounded-full hover:bg-stone-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Send message"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="hidden md:flex flex-1 items-center justify-center bg-stone-50 dark:bg-dark-slate-800">
                <div className="text-center text-stone-500 dark:text-gray-400">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-stone-400 dark:text-gray-500" />
                  <p className="font-doto">select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;