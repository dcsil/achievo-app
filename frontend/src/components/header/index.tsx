import React, { useState } from 'react';
import { User } from '../../api-contexts/user-context';
import paul from '../../assets/paul_paw.png';

interface HeaderProps {
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const hasUnreadNotifications = true; // Will be pulled from database
  const motivationalQuote = "Success is the sum of small efforts repeated day in and day out."; // Will be pulled from database
  
  // Dummy notifications - will be pulled from database
  const notifications = [
    {
      id: 1,
      type: 'reward',
      title: '100 coins awarded',
      description: 'Task "Complete project proposal" finished!',
      timestamp: '2h ago',
      isRead: false
    },
    {
      id: 2,
      type: 'achievement',
      title: '🏆 Achievement Unlocked!',
      description: 'Completed 10 tasks in a row',
      timestamp: '5h ago',
      isRead: false
    },
    {
      id: 3,
      type: 'reminder',
      title: '⏰ Task Due Soon',
      description: 'Review client feedback - Due in 2 hours',
      timestamp: '1d ago',
      isRead: true
    }
  ];

  // Show loading state when user is null
  if (!user) {
    return (
      <header className="w-full bg-gradient-to-br from-rose-100 via-amber-50 to-amber-100 py-4 px-5 shadow-sm rounded-2xl relative">
        <div className="flex items-center gap-4 max-w-6xl mx-auto">
          <div className="text-gray-600">Loading...</div>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full bg-gradient-to-br from-rose-100 via-amber-50 to-amber-100 py-4 px-5 shadow-sm rounded-2xl relative">
      <div className="flex items-center gap-4 max-w-6xl mx-auto relative z-10">
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md bg-white">
            <img 
              src={paul}
              alt="User Profile" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* Welcome Message and Quote */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-800 mb-0.5">
            Welcome back, <span className="text-orange-600">{user.canvas_username}</span>!
          </h1>
          <p className="text-gray-600 text-xs italic font-light leading-snug">
            {motivationalQuote}
          </p>
        </div>

        {/* Coin Counter */}
        <div className="flex items-center gap-2 bg-white bg-opacity-70 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-yellow-200">
          <span className="text-xl">🪙</span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-orange-600">{user.total_points.toLocaleString()}</span>
            <span className="text-xs text-gray-500">coins</span>
          </div>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex-shrink-0 w-9 h-9 flex items-center justify-center bg-white bg-opacity-70 backdrop-blur-sm rounded-full shadow-sm border border-yellow-200 hover:bg-opacity-90 transition-all duration-200"
            aria-label="Notifications"
          >
            <span className="text-lg">🔔</span>
            {hasUnreadNotifications && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-yellow-500 px-4 py-3">
                <h3 className="text-white font-bold text-sm">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notif.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-800 mb-1">
                          {notif.title}
                        </h4>
                        <p className="text-xs text-gray-600 mb-1">
                          {notif.description}
                        </p>
                        <span className="text-xs text-gray-400">{notif.timestamp}</span>
                      </div>
                      {!notif.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 bg-gray-50 text-center">
                <button className="text-xs text-orange-600 font-medium hover:underline">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;