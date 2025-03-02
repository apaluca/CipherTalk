import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { conversationService, messageService } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usersTyping, setUsersTyping] = useState({});

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

      // New message received
      socket.on('newMessage', (message) => {
        // Add message to messages if from active conversation
        if (activeConversation && message.conversationId === activeConversation.id) {
          setMessages((prev) => [...prev, message]);
          
          // Mark message as read
          messageService.markAsRead(message._id);
        }

        // Update conversation last message and move to top
        setConversations((prev) => {
          const updatedConversations = prev.map((conv) => {
            if (conv.id === message.conversationId) {
              return {
                ...conv,
                lastMessage: {
                  id: message._id,
                  content: message.content,
                  sender: message.sender,
                  createdAt: message.createdAt,
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
        socket.off('newMessage');
        socket.off('userTyping');
      };
    } catch (error) {
      console.error('Socket error:', error);
    }
  }, [isAuthenticated, user, activeConversation]);

  // Set active conversation and load messages
  const selectConversation = async (conversation) => {
    setActiveConversation(conversation);
    setLoading(true);
    try {
      const messagesData = await conversationService.getMessages(conversation.id);
      setMessages(messagesData);
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

  // Send message through socket
  const sendMessage = useCallback(
    (content) => {
      if (!activeConversation) return;
      
      try {
        const socket = getSocket();
        
        socket.emit('sendMessage', {
          conversationId: activeConversation.id,
          content,
        });
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    [activeConversation]
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