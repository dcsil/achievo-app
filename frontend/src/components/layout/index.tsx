import React, { useState, useEffect } from 'react';
import { apiService, User } from '../../api-contexts/user-context';
import Header from '../header';
import Footer from '../footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = 'paul_paw_test';

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await apiService.getUser(userId);
      setUser(userData);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      setError('Failed to load user data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to update user points (can be called by child components)
  const updateUserPoints = (newPoints: number) => {
    if (user) {
      setUser({
        ...user,
        total_points: newPoints
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
        <Header user={null} />
        <main id="main-content" className="flex-1 overflow-y-auto pb-20 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
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
        <main id="main-content" className="flex-1 overflow-y-auto pb-20 flex items-center justify-center">
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
      <main id="main-content" className="flex-1 overflow-y-auto pb-20">
        {/* Pass user data and update function to children via React.cloneElement */}
        {React.cloneElement(children as React.ReactElement, { 
            user: user, 
            updateUserPoints: updateUserPoints,
            userId: userId 
        } as any)}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;