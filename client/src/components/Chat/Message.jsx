import { formatDistanceToNow } from 'date-fns';
import { useChat } from '../../context/ChatContext';

const Message = ({ message, isOwnMessage }) => {
  const { retryMessage } = useChat();
  
  const formatTime = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const getStatusText = () => {
    if (!isOwnMessage) return '';
    
    switch (message.status) {
      case 'pending':
        return 'Sending...';
      case 'error':
        return 'Failed to send';
      case 'sent':
        return 'Sent';
      default:
        return '';
    }
  };

  return (
    <div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${
          isOwnMessage
            ? 'bg-indigo-600 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-900 rounded-bl-none'
        }`}
      >
        <p>{message.content}</p>
        <div className="flex justify-between items-center mt-1">
          <p
            className={`text-xs ${
              isOwnMessage ? 'text-indigo-200' : 'text-gray-500'
            }`}
          >
            {formatTime(message.createdAt)}
          </p>
          
          {/* Status indicator */}
          {isOwnMessage && (
            <div className="flex items-center">
              <span 
                className={`text-xs mr-1 ${
                  message.status === 'error' 
                    ? 'text-red-300' 
                    : message.status === 'pending'
                    ? 'text-indigo-300'
                    : 'text-indigo-200'
                }`}
              >
                {getStatusText()}
              </span>
              
              {/* Retry button for failed messages */}
              {message.status === 'error' && (
                <button 
                  onClick={() => retryMessage(message._id)}
                  className="text-xs bg-indigo-500 hover:bg-indigo-400 rounded px-2 py-0.5 text-white ml-2"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;