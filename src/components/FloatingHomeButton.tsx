import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';

const FloatingHomeButton: React.FC = () => {
  const location = useLocation();
  
  // ホームページでは表示しない
  if (location.pathname === '/') {
    return null;
  }

  return (
    <Link
      to="/"
      className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-50 group"
      title="ホームに戻る"
    >
      <Home size={24} />
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        ホームに戻る
      </span>
    </Link>
  );
};

export default FloatingHomeButton;