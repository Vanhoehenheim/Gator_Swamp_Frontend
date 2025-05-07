import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, Send, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import ProfileButton from './ProfileButton';
import { messageService } from '../services/messageService';
import config from '../config'; // Import config for WebSocket URL

// Safe Date Formatter - Accepts lowercase 'createdAt'
const formatMessageDate = (dateString) => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
        }
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
    } catch (error) {
        console.error("Error formatting message date:", dateString, error);
        return "Error Date";
    }
};

// Debounce function to limit frequent calls
const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
};

const Messages = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, token, authFetch } = useAuth();
  const { darkMode } = useTheme();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(location.state?.initialSelectedUser || null);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState(null);
  const [userProfiles, setUserProfiles] = useState({});
  const userId = currentUser?.id;
  const messagesEndRef = useRef(null);
  const ws = useRef(null); // Ref to store the WebSocket connection
  const [isConnected, setIsConnected] = useState(false); // Track WebSocket connection status
  const reconnectAttempts = useRef(0); // Track reconnection attempts
  const markedMessageIds = useRef(new Set()); // Track already marked message IDs
  const lastMarkReadTime = useRef(Date.now()); // Track when we last made a mark-read call

  // --- WebSocket Connection Effect ---
  useEffect(() => {
    // Only proceed if we have a user ID and token
    if (!userId || !token) {
      // If there's an existing connection in the ref, close it (e.g., user logged out)
      if (ws.current) {
          console.log("[WebSocket] Closing connection ref due to missing userId or token.");
          ws.current.close(); 
          ws.current = null; 
          setIsConnected(false);
      }
      return; 
    }

    // --- Connection Creation Guard ---
    // Only create a new connection if the ref is currently null
    if (ws.current !== null) {
      console.log("[WebSocket] Connection ref already exists. Skipping new connection.");
      return; 
    }

    console.log("[WebSocket] Ref is null, attempting to create new connection.");

    // Construct WebSocket URL
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${config.apiUrl.replace(/^http(s?):\/\//, '')}/ws?token=${token}`;
    console.log("[WebSocket] Connecting to:", wsUrl);

    // Implement exponential backoff for reconnection
    const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Cap at 30s
    const timeoutId = setTimeout(() => {
      // Create a new WebSocket instance
      const socket = new WebSocket(wsUrl);
      // Immediately store it in the ref
      ws.current = socket; 
      setIsConnected(false); // Assume disconnected until onopen fires

      // --- Event Handlers ---
      socket.onopen = () => {
        // Check if this socket is still the one in the ref (could have been replaced)
        if (ws.current === socket) {
          console.log("[WebSocket] Connected (socket matched ref)");
          setIsConnected(true);
          reconnectAttempts.current = 0; // Reset reconnect counter on success
        } else {
          console.log("[WebSocket] Connected (socket mismatch - likely closed/replaced), closing this one.");
          socket.close(); // Close the orphaned socket
        }
      };

      socket.onclose = (event) => {
        console.log("[WebSocket] Disconnected:", event.reason, event.code);
        // Only clear the ref and state if the closed socket is the one currently in the ref
        if (ws.current === socket) {
            console.log("[WebSocket] Closed socket matched ref. Setting disconnected.");
            setIsConnected(false);
            // Don't immediately clear ref to prevent too many reconnection attempts
            reconnectAttempts.current += 1;
            // Allow reconnection attempt on next cycle
            setTimeout(() => {
              if (ws.current === socket) {
                ws.current = null;
              }
            }, backoffTime);
        } else {
            console.log("[WebSocket] Closed socket did not match ref. Ignoring state update.");
        }
      };

      socket.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
        if (ws.current === socket) {
            console.log("[WebSocket] Error on socket matching ref. Setting disconnected.");
            setIsConnected(false);
            // Don't immediately nullify to prevent rapid reconnect attempts
        }
      };

      socket.onmessage = (event) => {
         // Only process messages if the receiving socket is the current one in the ref
         if (ws.current !== socket) {
            console.log("[WebSocket] Message received on old/closed socket. Ignoring.");
            return;
         }
        // ... (Keep the detailed logging from the previous step inside onmessage)
        console.log("[WebSocket] Raw message received:", event.data);
        try {
          const messageData = JSON.parse(event.data);
          console.log("[WebSocket] Parsed message data:", messageData);

          const queryKey = ['messages', userId];

          // Check message type (new field added in backend)
          if (messageData.type === 'messageRead') {
            // Handle Read Status Update
            if (!messageData.messageId || !messageData.readAt) {
                console.warn("[WebSocket] Received incomplete messageRead data:", messageData);
                return;
            }
            console.log(`[WebSocket] Received read confirmation for message: ${messageData.messageId}`);

            queryClient.setQueryData(queryKey, (oldData = []) => {
              return oldData.map(msg =>
                msg.id === messageData.messageId
                  ? { ...msg, isRead: true, readAt: messageData.readAt } // Update status and timestamp
                  : msg
              );
            });
            console.log(`[WebSocket] Updated cache for message ${messageData.messageId} read status.`);

          } else {
            // Handle New Incoming Message (existing logic)
            // Assume messages without a 'type' field are new messages for backward compatibility or direct pushes
            if (!messageData.id || !messageData.fromId || !messageData.toId || !messageData.content || !messageData.createdAt) {
              console.warn("[WebSocket] Received incomplete new message data:", messageData);
              return;
            }
            console.log(`[WebSocket] Received new message: ${messageData.id}`);
            const previousData = queryClient.getQueryData(queryKey) || [];
            console.log("[WebSocket] Cache before new message update:", previousData);

            queryClient.setQueryData(queryKey, (oldData = []) => {
              const idx = oldData.findIndex(msg => msg.id === messageData.id)
              if (idx !== -1) {
                // Replace the existing message with the new one (in case of updates)
                console.log(`[WebSocket] Replacing existing message ${messageData.id} in cache.`);
                const newArr = [...oldData]
                newArr[idx] = messageData
                return newArr
              }
              // Add new message
              console.log(`[WebSocket] Adding new message ${messageData.id} to cache.`);
              return [...oldData, messageData]
            });

            // REINSTATE invalidateQueries (with refetchType: 'none') AFTER setQueryData
            // This marks the query as stale and helps ensure component updates, 
            // especially when using selectors or memoization like useMemo for conversations.
            console.log("[WebSocket] Invalidating messages query (no refetch) to ensure UI update.");
            queryClient.invalidateQueries({ queryKey: ['messages', userId], refetchType: 'none' });

            // Trigger mark read if the new message is for the currently selected chat
            if (messageData.fromId === selectedUser && messageData.toId === userId) {
               console.log("[WebSocket] New message received for current chat, will trigger mark read check.");
               // The useEffect watching `messages` will handle the actual markReadMutation call
            }
          }

        } catch (e) {
          console.error("[WebSocket] Failed to parse or process message:", event.data, e);
        }
      };
    }, reconnectAttempts.current > 0 ? backoffTime : 0);

    // --- Cleanup Function ---
    return () => {
      clearTimeout(timeoutId);
      // Only close if we have a socket and clear timeouts
      if (ws.current) {
        console.log("[WebSocket] Cleanup: Closing socket instance from this effect run.");
        // Always close the socket created in *this specific effect run*
        const socket = ws.current;
        socket.close(); 
        
        // Don't immediately nullify the ref to prevent rapid reconnection attempts
        // We'll let the onclose handler manage this with backoff
      }
    };
  // Dependencies: Re-run effect ONLY if token or userId changes.
  }, [token, userId]); 

  // --- React Query Hooks ---

  // Query for all messages involving the current user
  const { 
      data: messages = [],
      isLoading: isLoadingMessages, 
      isError: isErrorMessages, 
      error: errorLoadingMessages 
  } = useQuery({
      queryKey: ['messages', userId],
      queryFn: async () => {
          if (!userId) return [];
          console.log("Fetching initial messages...");
          // Assume messageService.getMessages returns data with lowercase keys
          return await messageService.getMessages(userId, authFetch);
      },
      enabled: !!userId,
      // REMOVE POLLING - WebSocket handles updates now
      // refetchInterval: 3000,
      // refetchIntervalInBackground: true,
      staleTime: 5 * 60 * 1000, // Keep messages fresh for 5 mins if tab is backgrounded then focused
      refetchOnWindowFocus: true, // Refetch on focus to ensure sync after potential disconnect
  });

  // Derive conversations from fetched messages (using lowercase keys)
  const conversations = useMemo(() => {
      console.log("[Memo] Calculating conversations. Input messages:", messages);
      if (!Array.isArray(messages) || messages.length === 0) {
          console.log("[Memo] No messages or not an array, returning [].");
          return [];
      }
      const conversationsMap = new Map();
      messages.forEach(msg => {
          // Use lowercase 'fromId' and 'toId'
          const partnerId = msg.fromId === userId ? msg.toId : msg.fromId;
          if (!partnerId) { // Add a check for safety
            console.warn("Message missing fromId/toId:", msg);
            return; 
          }
          if (!conversationsMap.has(partnerId)) {
              conversationsMap.set(partnerId, []);
          }
          conversationsMap.get(partnerId).push(msg);
      });

      const calculatedConversations = Array.from(conversationsMap.entries())
          .map(([partnerId, userMessages]) => {
              // Sort using lowercase 'createdAt'
              const sortedMessages = [...userMessages].sort(
                  (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
              );
              return {
                  partnerId,
                  messages: sortedMessages,
                  latestMessage: sortedMessages[0]
              };
          })
          // Sort conversations using lowercase 'createdAt'
          .sort((a, b) => new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt));

      console.log("[Memo] Calculated conversations:", calculatedConversations);
      return calculatedConversations;
  }, [messages, userId]);

  // Fetch user profiles based on derived conversation partners
  useEffect(() => {
      const fetchProfiles = async () => {
          const partnerIds = conversations.map(c => c.partnerId).filter(id => !!id && !userProfiles[id]);
          if (selectedUser && !partnerIds.includes(selectedUser) && !userProfiles[selectedUser]) {
            partnerIds.push(selectedUser);
          }

          if (partnerIds.length === 0) return;

          console.log("Fetching profiles for IDs:", partnerIds);
          const newProfiles = { ...userProfiles };
          await Promise.all(partnerIds.map(async (id) => {
              try {
                  const profile = await messageService.getUserProfile(id, authFetch);
                  newProfiles[id] = profile;
              } catch (err) {
                  console.error(`Failed to fetch profile for user ${id}:`, err);
                  newProfiles[id] = { username: 'Unknown User', id: id };
              }
          }));
          setUserProfiles(newProfiles);
      };

      if (conversations.length > 0 || selectedUser) {
          fetchProfiles();
      }
  }, [conversations, selectedUser, authFetch, userProfiles]);

  // Send Message Mutation
  const sendMessageMutation = useMutation({
      mutationFn: (messageData) => messageService.sendMessage(messageData, authFetch),
      onSuccess: (sentMessage) => {
          console.log("[Mutation Success] Message sent via HTTP:", sentMessage);
          
          // Validate sentMessage format (basic check)
          if (!sentMessage || !sentMessage.id || !sentMessage.fromId || !sentMessage.toId || !sentMessage.content || !sentMessage.createdAt) {
            console.warn("[Mutation Success] Received incomplete sentMessage data:", sentMessage);
            // Still clear input, but maybe don't update cache if data is bad
            setNewMessage('');
            return;
          }

          setNewMessage('');

          const queryKey = ['messages', userId];
          const previousData = queryClient.getQueryData(queryKey) || [];
          console.log("[Mutation Success] Cache before update:", previousData);

          // Update cache using lowercase 'id'
          queryClient.setQueryData(queryKey, (oldData = []) => {
              if (oldData.some(msg => msg.id === sentMessage.id)) {
                  console.log("[Mutation Success] Message already in cache (likely from WS), skipping update.", sentMessage.id);
                  return oldData;
              }
              console.log("[Mutation Success] Adding sent message to cache:", sentMessage);
              return [...oldData, sentMessage];
          });

          const updatedData = queryClient.getQueryData(queryKey);
          console.log("[Mutation Success] Cache after update:", updatedData);

          // Scroll to bottom
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      },
      onError: (err) => {
          console.error('[Mutation Error] Error sending message:', err);
          setError(err.message || 'Failed to send message');
      }
  });

  // Mark as Read Mutation
  const markReadMutation = useMutation({
      // Assume messageService.markAsRead expects/uses lowercase keys
      mutationFn: ({ partnerId, messageIds }) => 
          messageService.markAsRead(partnerId, userId, messageIds, authFetch),
      
      onMutate: async ({ partnerId }) => {
          await queryClient.cancelQueries({ queryKey: ['messages', userId] });
          const previousMessages = queryClient.getQueryData(['messages', userId]);

          // Optimistic update using lowercase keys ('fromId', 'toId', 'isRead')
          queryClient.setQueryData(['messages', userId], (oldData = []) => 
              oldData.map(msg => 
                  (msg.fromId === partnerId && msg.toId === userId && !msg.isRead)
                      ? { ...msg, isRead: true } // Optimistically mark as read
                      : msg
              )
          );
          return { previousMessages };
      },
      onError: (err, variables, context) => {
          console.error("Error marking messages as read:", err);
          // Rollback optimistic update on error
          if (context?.previousMessages) {
              queryClient.setQueryData(['messages', userId], context.previousMessages);
          }
          // Optionally show an error, but maybe not needed for background task
      },
  });

  // Effect to trigger Mark as Read Mutation (using lowercase keys) - with tracking
  useEffect(() => {
    if (selectedUser && userId) {
      // Find unread messages that haven't been marked yet
      const unreadMessages = messages.filter(
        msg => msg.fromId === selectedUser &&
              msg.toId === userId &&
              !msg.isRead &&
              !markedMessageIds.current.has(msg.id)
      );
      if (unreadMessages.length > 0) {
        console.log(`Found ${unreadMessages.length} new unread messages from ${selectedUser} to mark as read.`);
        const messageIdsToMark = unreadMessages.map(msg => msg.id);
        markReadMutation.mutate({
          partnerId: selectedUser,
          messageIds: messageIdsToMark
        });
        // Add to tracking set immediately to prevent duplicate calls even before API call
        messageIdsToMark.forEach(id => markedMessageIds.current.add(id));
      }
    }
  }, [selectedUser, messages, userId, markReadMutation]);

  // Reset marked messages when selected user changes
  useEffect(() => {
    // Clear the marked messages set when user changes conversations
    markedMessageIds.current.clear();
  }, [selectedUser]);

  // Effect to scroll to bottom of messages when new messages arrive or user changes
  useEffect(() => {
      if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
  }, [messages, selectedUser]);

  // Event Handler for Form Submission (sending lowercase keys)
  const handleSendMessage = (e) => {
      e.preventDefault();
      if (!newMessage.trim() || !selectedUser || !userId) return;
      setError(null);
      sendMessageMutation.mutate({
          // Use lowercase keys consistent with backend expectation
          fromId: userId,
          toId: selectedUser,
          content: newMessage.trim()
      });
  };

  // --- Render Logic ---

  if (!userId) {
      return <div className="flex justify-center items-center min-h-screen">Redirecting to login...</div>;
  }

  if (isLoadingMessages && conversations.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-stone-100 dark:bg-dark-slate-900">
        <div className="text-xl text-gray-600 dark:text-gray-400 font-doto">loading messages...</div>
      </div>
    );
  }

  if (isErrorMessages) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-stone-100 dark:bg-dark-slate-900">
        <div className="text-xl text-red-600 font-doto">{errorLoadingMessages?.message || 'Failed to load messages'}</div>
      </div>
    );
  }

  // Access lowercase 'partnerId' from conversations array
  const currentConversationMessages = conversations.find(c => c.partnerId === selectedUser)?.messages || [];

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-dark-slate-900 pt-16 sm:pt-20 pb-6 transition-colors duration-200">
      {/* Optional: Add connection status indicator */}
      {/* <div className="fixed top-16 left-0 right-0 p-1 text-center text-xs text-white z-50 " + (isConnected ? 'bg-green-600' : 'bg-red-600')}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </div> */}
      
      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        <div className="bg-stone-50 dark:bg-dark-slate-800 rounded-lg shadow-sm overflow-hidden border border-stone-200 dark:border-dark-slate-700 h-[calc(100vh-8rem)] transition-colors duration-200">
          <div className="flex h-full">
            {/* Sidebar - Conversations List (using lowercase keys) */}
            <div className={`w-full md:w-1/3 border-r border-stone-200 dark:border-dark-slate-700 overflow-y-auto ${selectedUser ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}>
              <div className="p-4 border-b border-stone-200 dark:border-dark-slate-700 sticky top-0 bg-stone-50 dark:bg-dark-slate-800 z-10">
                <h1 className="text-xl font-bold font-doto text-stone-900 dark:text-white">messages</h1>
              </div>
              <div className="flex-grow overflow-y-auto">
                {conversations.length > 0 ? (
                  conversations.map(({ partnerId, messages: convoMessages }) => {
                    const latestMessage = convoMessages[0];
                    const partnerProfile = userProfiles[partnerId] || { username: 'Loading...', id: partnerId };
                    // Check unread count using lowercase 'toId', 'isRead'
                    const unreadCount = convoMessages.filter(msg => msg.toId === userId && !msg.isRead).length;
                    const isSelected = partnerId === selectedUser;

                    return (
                      <div
                        key={partnerId} // Key remains partnerId
                        onClick={() => {
                            // Only set the selected user state here
                            // The useEffect watching selectedUser will trigger the mark read mutation
                            setSelectedUser(partnerId);
                        }}
                        className={`p-3 flex items-center space-x-3 cursor-pointer hover:bg-stone-100 dark:hover:bg-dark-slate-700 border-b border-stone-200 dark:border-dark-slate-700 ${isSelected ? 'bg-stone-100 dark:bg-dark-slate-700' : ''}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-stone-300 dark:bg-dark-slate-600 flex items-center justify-center text-stone-600 dark:text-dark-slate-300 font-semibold">
                          {partnerProfile.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex justify-between items-center">
                            <h3 className={`font-semibold text-sm truncate ${isSelected ? 'text-stone-900 dark:text-white' : 'text-stone-700 dark:text-stone-300'}`}>
                              {partnerProfile.username}
                            </h3>
                            <span className="text-xs text-stone-400 dark:text-stone-500">
                              {/* Format date using lowercase 'createdAt' */}
                              {formatMessageDate(latestMessage.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center"> {/* Wrap text and icon */}
                            {/* Show read status icon only if the user sent the last message */}
                            {latestMessage.fromId === userId && (
                              <span className="mr-1 flex-shrink-0"> {/* Added margin */}
                                {latestMessage.isRead ? (
                                  <CheckCheck size={14} className={` ${unreadCount > 0 ? 'text-stone-800 dark:text-white' : 'text-stone-500 dark:text-stone-400'}`} />
                                ) : (
                                  <Check size={14} className={` ${unreadCount > 0 ? 'text-stone-800 dark:text-white' : 'text-stone-500 dark:text-stone-400 opacity-70'}`} />
                                )}
                              </span>
                            )}
                            <p className={`text-xs truncate ${unreadCount > 0 ? 'text-stone-800 dark:text-white font-medium' : 'text-stone-500 dark:text-stone-400'}`}>
                              {/* Check sender using lowercase 'fromId', display content using lowercase 'content' */}
                              {latestMessage.fromId === userId ? 'You: ' : ''}{latestMessage.content}
                            </p>
                          </div>
                        </div>
                        {unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ml-auto">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-sm text-stone-500 dark:text-stone-400">
                    {/* Check if still loading vs actually no conversations */}
                    {isLoadingMessages ? 'loading conversations...' : 'no conversations yet.'}
                  </div>
                )}
              </div>
            </div>

            {/* Main Chat Area (using lowercase keys) */}
            <div className={`flex-1 flex-col h-full ${selectedUser ? 'flex' : 'hidden md:flex'}`}>
              {selectedUser && userProfiles[selectedUser] ? (
                <>
                  <div className="p-3 border-b border-stone-200 dark:border-dark-slate-700 flex items-center space-x-3 sticky top-0 bg-stone-50 dark:bg-dark-slate-800 z-10">
                    <button onClick={() => setSelectedUser(null)} className="md:hidden text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white">
                      <ArrowLeft size={20} />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-stone-300 dark:bg-dark-slate-600 flex items-center justify-center text-stone-600 dark:text-dark-slate-300 font-semibold">
                      {userProfiles[selectedUser].username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <h2 className="font-semibold text-stone-900 dark:text-white">
                      {userProfiles[selectedUser].username}
                    </h2>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-100 dark:bg-dark-slate-900">
                    {currentConversationMessages.slice().reverse().map((msg) => {
                      // Key prioritizes lowercase 'id', 'createdAt'
                      const key = msg.id || msg.createdAt || `temp-${Math.random()}`;
                      if (!msg.id) {
                        console.warn("Message object missing 'id' property:", msg);
                      }
                      return (
                        // Check sender using lowercase 'fromId'
                        <div key={key} className={`flex ${msg.fromId === userId ? 'justify-end' : 'justify-start'}`}>
                          {/* Check sender using lowercase 'fromId' for styling */}
                          <div className={`p-2 rounded-lg max-w-[70%] text-sm ${msg.fromId === userId ? 'bg-blue-500 text-white' : 'bg-stone-200 dark:bg-dark-slate-600 text-stone-900 dark:text-white'}`}>
                            {/* Display content using lowercase 'content' */}
                            <p className="break-words">{msg.content}</p>
                            <div className={`text-xs mt-1 flex items-center ${msg.fromId === userId ? 'text-blue-100 justify-end' : 'text-stone-400 dark:text-stone-500 justify-start'}`}>
                              {/* Format date using lowercase 'createdAt' */}
                              <span>{formatMessageDate(msg.createdAt)}</span>
                              {/* Check sender/read status using lowercase 'fromId', 'isRead' */}
                              {msg.fromId === userId && (
                                  msg.isRead ? <CheckCheck size={14} className="ml-1 text-blue-200" /> : <Check size={14} className="ml-1 text-blue-200 opacity-70" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="p-3 border-t border-stone-200 dark:border-dark-slate-700 flex items-center space-x-2 bg-stone-50 dark:bg-dark-slate-800">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="type a message..."
                      className="flex-1 p-2 border border-stone-300 dark:border-dark-slate-600 rounded-full text-sm dark:bg-dark-slate-700 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent disabled:opacity-70"
                      disabled={sendMessageMutation.isPending}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendMessageMutation.isPending ? (
                          <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                          <Send size={18} />
                      )}
                    </button>
                  </form>
                  {error && <div className="p-2 text-xs text-center text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200">{error}</div>}
                </>
              ) : (
                <div className="flex-1 hidden md:flex items-center justify-center text-stone-500 dark:text-stone-400">
                  select a conversation to start messaging.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;