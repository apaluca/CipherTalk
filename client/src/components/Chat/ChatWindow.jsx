import { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import Message from './Message';

const ChatWindow = () => {
  const { activeConversation, messages, sendMessage, usersTyping, setTypingStatus } = useChat();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    sendMessage(newMessage.trim());
    setNewMessage('');
    // Clear typing indicator when sending a message
    setTypingStatus(false);
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Set typing status
    setTypingStatus(true);
    
    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to clear typing status after 1 second
    const timeout = setTimeout(() => {
      setTypingStatus(false);
    }, 1000);
    
    setTypingTimeout(timeout);
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Select a conversation to start chatting</p>
      </div>
    );
  }

  // Check if anyone is typing
  const isAnyoneTyping = Object.entries(usersTyping).some(
    ([userId, isTyping]) => userId !== user.id && isTyping
  );

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center">
        <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium text-sm">
          {activeConversation.participants[0]?.username.charAt(0).toUpperCase()}
        </div>
        <div className="ml-3">
          <h2 className="text-lg font-medium">
            {activeConversation.participants[0]?.username}
          </h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((message) => (
            <Message
              key={message._id}
              message={message}
              isOwnMessage={message.sender.toString() === user.id.toString()}
            />
          ))
        )}
        {isAnyoneTyping && (
          <div className="text-gray-500 text-sm italic">
            {activeConversation.participants[0]?.username} is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-l-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleInputChange}
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white py-2 px-4 rounded-r-md hover:bg-indigo-700 transition-colors"
            disabled={!newMessage.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;