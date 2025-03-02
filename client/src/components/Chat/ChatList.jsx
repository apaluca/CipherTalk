import { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import UserSearch from './UserSearch';

const ChatList = () => {
  const { conversations, activeConversation, selectConversation, loading } = useChat();
  const [showUserSearch, setShowUserSearch] = useState(false);

  const getLastMessagePreview = (lastMessage) => {
    if (!lastMessage) return 'No messages yet';
    if (lastMessage.content.length > 25) {
      return `${lastMessage.content.substring(0, 25)}...`;
    }
    return lastMessage.content;
  };

  const formatTime = (date) => {
    if (!date) return '';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div className="w-full md:w-80 flex flex-col h-full border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Messages</h2>
      </div>
      
      <div className="p-3">
        <button
          onClick={() => setShowUserSearch(true)}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
        >
          New Conversation
        </button>
      </div>
      
      {showUserSearch && (
        <UserSearch onClose={() => setShowUserSearch(false)} />
      )}
      
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No conversations yet</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
                activeConversation?.id === conversation.id ? 'bg-gray-100' : ''
              }`}
              onClick={() => selectConversation(conversation)}
            >
              <div className="flex items-start">
                <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium text-sm">
                  {conversation.participants[0]?.username.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-medium text-gray-900">
                      {conversation.participants[0]?.username}
                    </h3>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {getLastMessagePreview(conversation.lastMessage)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;