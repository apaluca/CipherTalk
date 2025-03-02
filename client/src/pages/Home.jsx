import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ChatList from '../components/Chat/ChatList';
import ChatWindow from '../components/Chat/ChatWindow';

const Home = () => {
  const { user, logout } = useAuth();
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showChatList, setShowChatList] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowChatList(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleView = () => {
    setShowChatList(!showChatList);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">CipherTalk</h1>
        
        {isMobileView && (
          <button
            onClick={toggleView}
            className="md:hidden bg-indigo-500 hover:bg-indigo-400 py-1 px-3 rounded"
          >
            {showChatList ? 'View Chat' : 'View Conversations'}
          </button>
        )}
        
        <div className="flex items-center">
          <div className="mr-4">
            <span className="font-medium">{user?.username}</span>
          </div>
          <button
            onClick={logout}
            className="bg-indigo-500 hover:bg-indigo-400 py-1 px-3 rounded"
          >
            Logout
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {(!isMobileView || showChatList) && <ChatList />}
        {(!isMobileView || !showChatList) && <ChatWindow />}
      </main>
    </div>
  );
};

export default Home;