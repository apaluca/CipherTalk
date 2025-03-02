import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { conversationService, messageService } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid'; // We'll need to add this dependency

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usersTyping, setUsersTyping] = useState({});
  const [pendingMessages, setPendingMessages] = useState({}); // Track messages that are being sent

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (isAuthenticated) {
        try {
          setLoading(true);
          const data = await conversationService.getConversations();
          // Sort conversations by updatedAt date (newest first)
          const sortedConversations = data.sort((a, b) => 
            new Date(b.updatedAt) - new Date(a.updatedAt)
          );
          setConversations(sortedConversations);
        } catch (error) {
          console.error('Failed to load conversations:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadConversations();
  }, [isAuthenticated]);

  // Listen to socket events
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    try {
      const socket = getSocket();

      // Single event handler for all message updates
      socket.on('messageUpdate', (message) => {
        // If this is a message we sent optimistically, update its status
        if (message.tempId && pendingMessages[message.tempId]) {
          // Clear the pending message
          setPendingMessages(prev => {
            const updated = { ...prev };
            delete updated[message.tempId];
            return updated;
          });
        }

        // Add message to messages if from active conversation
        if (activeConversation && message.conversationId === activeConversation.id) {
          setMessages(prev => {
            // If this message was added optimistically, replace it
            if (message.tempId) {
              return prev.map(m => 
                m.tempId === message.tempId ? message : m
              );
            } 
            // Otherwise add it if not already in the list
            else {
              const exists = prev.some(m => m._id === message._id);
              if (!exists) {
                // Mark as read if from another user
                if (message.sender.toString() !== user.id.toString()) {
                  messageService.markAsRead(message._id);
                }
                return [...prev, message];
              }
              return prev;
            }
          });
        }

        // Update conversation last message and move to top
        updateConversationWithMessage(message);
      });

      // Handle message errors
      socket.on('messageError', ({ error, tempId, conversationId }) => {
        console.error('Message error:', error);
        
        // Update the message status to "error"
        if (activeConversation && activeConversation.id === conversationId) {
          setMessages(prev => 
            prev.map(m => 
              m.tempId === tempId 
                ? { ...m, status: 'error', error } 
                : m
            )
          );
        }
        
        // Clear from pending
        setPendingMessages(prev => {
          const updated = { ...prev };
          delete updated[tempId];
          return updated;
        });
      });

      // User typing status
      socket.on('userTyping', ({ userId, conversationId, isTyping }) => {
        if (activeConversation && activeConversation.id === conversationId) {
          setUsersTyping((prev) => ({
            ...prev,
            [userId]: isTyping,
          }));
        }
      });

      return () => {
        socket.off('messageUpdate');
        socket.off('messageError');
        socket.off('userTyping');
      };
    } catch (error) {
      console.error('Socket error:', error);
    }
  }, [isAuthenticated, user, activeConversation, pendingMessages]);

  // Helper function to update conversations with new messages
  const updateConversationWithMessage = (message) => {
    setConversations((prev) => {
      const updatedConversations = prev.map((conv) => {
        if (conv.id === message.conversationId) {
          return {
            ...conv,
            lastMessage: {
              id: message._id || message.tempId,
              content: message.content,
              sender: message.sender,
              createdAt: message.createdAt,
              status: message.status,
            },
            updatedAt: message.createdAt,
          };
        }
        return conv;
      });

      // Sort by updatedAt
      return updatedConversations.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
    });
  };

  // Set active conversation and load messages
  const selectConversation = async (conversation) => {
    setActiveConversation(conversation);
    setLoading(true);
    try {
      const messagesData = await conversationService.getMessages(conversation.id);
      
      // Merge optimistic messages with server messages
      const pendingForConversation = Object.values(pendingMessages)
        .filter(msg => msg.conversationId === conversation.id);
      
      // Add pending messages to the end
      setMessages([...messagesData, ...pendingForConversation]);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new conversation
  const createConversation = async (participantId) => {
    try {
      const newConversation = await conversationService.createConversation(
        participantId
      );
      
      // Add to conversations or update if exists
      setConversations((prev) => {
        const exists = prev.some((conv) => conv.id === newConversation.id);
        if (exists) {
          return prev;
        }
        return [
          {
            id: newConversation.id,
            participants: [newConversation.participant],
            lastMessage: null,
            updatedAt: new Date(),
          },
          ...prev,
        ];
      });
      
      return newConversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  };

  // Send message through socket with optimistic update
  const sendMessage = useCallback(
    (content) => {
      if (!activeConversation) return;
      
      try {
        const socket = getSocket();
        
        // Create a temporary ID to track this message
        const tempId = uuidv4();
        
        // Create optimistic message
        const optimisticMessage = {
          tempId,
          conversationId: activeConversation.id,
          sender: user.id,
          content,
          createdAt: new Date(),
          status: 'pending',
          _id: `temp-${tempId}` // Temporary ID for rendering
        };
        
        // Add to pending messages
        setPendingMessages(prev => ({
          ...prev,
          [tempId]: optimisticMessage
        }));
        
        // Add to current messages (optimistic update)
        setMessages(prev => [...prev, optimisticMessage]);
        
        // Update conversation immediately (optimistic)
        updateConversationWithMessage(optimisticMessage);
        
        // Send to server
        socket.emit('sendMessage', {
          conversationId: activeConversation.id,
          content,
          tempId // Send tempId to correlate response
        });
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    [activeConversation, user]
  );

  // Handle message retry
  const retryMessage = useCallback(
    (messageId) => {
      if (!activeConversation) return;
      
      // Find the failed message
      const failedMessage = messages.find(m => m._id === messageId);
      if (!failedMessage) return;
      
      // Update status to pending
      setMessages(prev => 
        prev.map(m => 
          m._id === messageId 
            ? { ...m, status: 'pending', error: undefined } 
            : m
        )
      );
      
      try {
        const socket = getSocket();
        
        // Generate new temp ID
        const tempId = uuidv4();
        
        // Update message with new tempId
        setMessages(prev => 
          prev.map(m => 
            m._id === messageId 
              ? { ...m, tempId, _id: `temp-${tempId}` } 
              : m
          )
        );
        
        // Add to pending messages
        setPendingMessages(prev => ({
          ...prev,
          [tempId]: {
            ...failedMessage,
            tempId,
            status: 'pending',
            _id: `temp-${tempId}`,
            error: undefined
          }
        }));
        
        // Send to server
        socket.emit('sendMessage', {
          conversationId: activeConversation.id,
          content: failedMessage.content,
          tempId
        });
      } catch (error) {
        console.error('Failed to retry message:', error);
      }
    },
    [activeConversation, messages]
  );

  // Update typing status
  const setTypingStatus = useCallback(
    (isTyping) => {
      if (!activeConversation) return;
      
      try {
        const socket = getSocket();
        
        socket.emit('typing', {
          conversationId: activeConversation.id,
          isTyping,
        });
      } catch (error) {
        console.error('Failed to update typing status:', error);
      }
    },
    [activeConversation]
  );

  const value = {
    conversations,
    activeConversation,
    messages,
    loading,
    usersTyping,
    selectConversation,
    createConversation,
    sendMessage,
    retryMessage,
    setTypingStatus,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
