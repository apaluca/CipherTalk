import { useState, useEffect } from 'react';
import { userService } from '../../services/api';
import { useChat } from '../../context/ChatContext';

const UserSearch = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const { createConversation, selectConversation } = useChat();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setError('');
        const data = await userService.getUsers();
        console.log('Fetched users:', data);
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleStartConversation = async (userId) => {
    try {
      const conversation = await createConversation(userId);
      selectConversation({
        id: conversation.id,
        participants: [conversation.participant],
      });
      onClose();
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setError('Failed to start conversation. Please try again.');
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="absolute inset-0 bg-white z-10 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium">New Conversation</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
      
      <div className="p-4">
        <input
          type="text"
          className="w-full border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Show error message if any */}
      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleStartConversation(user._id)}
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      {user.username}
                    </h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch;