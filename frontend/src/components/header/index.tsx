import React, { useState, useEffect } from 'react';
import { User } from '../../api-contexts/user-context';
import paul from '../../assets/paul_paw.png';

interface HeaderProps {
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

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

  // Handle scroll to show/hide compact mode - name ALWAYS shows when scrolled
  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    const handleScroll = () => {
      const scrollTop = mainContent.scrollTop;
      
      // Show compact mode (name only) when scrolling down past 300px
      // with hysteresis to prevent flickering
      if (scrollTop > 300) {
        setIsCompact(true);
      } else if (scrollTop < 250) {
        setIsCompact(false);
      }
    };

    // Initial check
    handleScroll();

    mainContent.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      mainContent.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Show loading state when user is null
  if (!user) {
    return (
      <header className="w-full bg-gradient-to-br from-rose-100 via-amber-50 to-amber-100 py-4 px-5 shadow-md z-40 transition-all duration-300 flex-shrink-0">
        <div className="flex items-center gap-4 max-w-6xl mx-auto">
          <div className="text-gray-600">Loading...</div>
        </div>
      </header>
    );
  }

  return (
    <header 
      className={`w-full bg-gradient-to-br from-rose-100 via-amber-50 to-amber-100 shadow-md z-40 transition-all duration-300 flex-shrink-0 ${
        isCompact ? 'py-2 px-3' : 'py-4 px-4'
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3 max-w-6xl mx-auto relative z-10">
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          <div 
            className={`rounded-full overflow-hidden border-2 border-white shadow-md bg-white transition-all duration-300 ${
              isCompact ? 'w-9 h-9 sm:w-10 sm:h-10' : 'w-12 h-12 sm:w-14 sm:h-14'
            }`}
          >
            <img 
              src={paul}
              alt="User Profile" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* User Name - Shows when compact (ALWAYS when scrolled) */}
        <div 
          className={`flex-1 min-w-0 transition-all duration-300 overflow-hidden ${
            isCompact ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'
          }`}
        >
          <h2 className="text-base sm:text-lg font-bold text-gray-800 whitespace-nowrap truncate">
            <span className="text-orange-600">{user.canvas_username}</span>
          </h2>
        </div>

        {/* Welcome Message - Shows when NOT compact */}
        <div 
          className={`flex-1 min-w-0 overflow-hidden transition-all duration-300 ${
            isCompact ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'
          }`}
        >
          <h1 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-0.5 truncate">
            Welcome back, <span className="text-orange-600">{user.canvas_username}</span>!
          </h1>
          <p className="hidden min-[400px]:block text-gray-600 text-xs italic font-light leading-snug line-clamp-2">
            {motivationalQuote}
          </p>
        </div>

        {/* Right side: Coin Counter and Notification - Responsive stacking */}
        <div className="flex flex-col min-[400px]:flex-row items-end min-[400px]:items-center gap-1.5 min-[400px]:gap-3 ml-auto flex-shrink-0">
          {/* Coin Counter */}
          <div 
            className={`flex items-center gap-1.5 sm:gap-2 bg-white bg-opacity-70 backdrop-blur-sm rounded-full shadow-sm border border-yellow-200 transition-all duration-300 ${
              isCompact ? 'px-2 py-0.5 sm:px-2.5 sm:py-1' : 'px-2.5 py-1 sm:px-3 sm:py-1.5'
            }`}
          >
            <span className={`transition-all duration-300 ${isCompact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'}`}>🪙</span>
            <div className="flex items-baseline gap-0.5 sm:gap-1">
              <span className={`font-bold text-orange-600 transition-all duration-300 ${
                isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
              }`}>
                {user.total_points.toLocaleString()}
              </span>
              <span className={`text-gray-500 transition-all duration-300 text-xs hidden sm:inline`}>
                coins
              </span>
            </div>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative flex-shrink-0 flex items-center justify-center bg-white bg-opacity-70 backdrop-blur-sm rounded-full shadow-sm border border-yellow-200 hover:bg-opacity-90 transition-all duration-300 ${
                isCompact ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-8 h-8 sm:w-9 sm:h-9'
              }`}
              aria-label="Notifications"
            >
              <span className={`transition-all duration-300 ${isCompact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'}`}>🔔</span>
              {hasUnreadNotifications && (
                <span className="absolute top-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full border border-white"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-10 sm:top-12 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
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
      </div>
    </header>
  );
};

export default Header;