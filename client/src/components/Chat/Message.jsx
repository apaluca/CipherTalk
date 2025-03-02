import { formatDistanceToNow } from 'date-fns';

const Message = ({ message, isOwnMessage }) => {
  const formatTime = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
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
        <p
          className={`text-xs mt-1 ${
            isOwnMessage ? 'text-indigo-200' : 'text-gray-500'
          }`}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
};

export default Message;