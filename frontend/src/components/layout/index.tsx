import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../api-contexts/user-context';
import Header from '../header';
import Footer from '../footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        console.warn('No user found in localStorage, redirecting to login');
        navigate('/login');
        return;
      }
      
      const userData = JSON.parse(storedUser);
      setUser(userData);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      setError('Failed to load user data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const updateUserPoints = (newPoints: number) => {
    if (user) {
      setUser({
        ...user,
        total_points: newPoints
      });
    }
  };

  const updateUserProfile = (updates: Partial<User>) => {
    if (user) {
      setUser({
        ...user,
        ...updates
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
        <Header user={null} />
        <main id="main-content" className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-spin">⏳</div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
        <Header user={null} />
        <main id="main-content" className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchUserData}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <Header user={user} />
      <main id="main-content" className="flex-1 overflow-y-auto pb-10">
        {React.cloneElement(children as React.ReactElement, { 
            user: user, 
            updateUserPoints: updateUserPoints,
            updateUserProfile: updateUserProfile,
            userId: user?.user_id 
        } as any)}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;