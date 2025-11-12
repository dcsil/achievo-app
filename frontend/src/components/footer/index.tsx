import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Import your custom icons here
import dashboardIcon from '../../assets/icons/dashboard.svg';
import todoIcon from '../../assets/icons/todo.svg';
import addIcon from '../../assets/icons/add.svg';
import rewardsIcon from '../../assets/icons/rewards.svg';
import settingsIcon from '../../assets/icons/settings.svg';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLabels, setShowLabels] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Update active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '/home') {
      setActiveTab('home');
    } else if (path === '/rewards') {
      setActiveTab('rewards');
    }
  }, [location.pathname]);

  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    const handleScroll = () => {
      const currentScrollY = mainContent.scrollTop;
      
      setLastScrollY(prevScrollY => {
        if (currentScrollY < prevScrollY || currentScrollY < 50) {
          setShowLabels(true);
        } else if (currentScrollY > prevScrollY && currentScrollY > 100) {
          setShowLabels(false);
        }
        
        return currentScrollY;
      });
    };

    mainContent.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainContent.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (id: string) => {
    setActiveTab(id);
    
    switch (id) {
      case 'home':
        navigate('/home');
        break;
      case 'rewards':
        navigate('/rewards');
        break;
      case 'todo':
        navigate('/todo');
        break;
      case 'settings':
      navigate('/settings');
      break;
      case 'add-task':
      navigate('/add-task');
      break;
      default:
        navigate('/');
    }
  };

  const navItems = [
    {
      id: 'home',
      icon: dashboardIcon,
      label: 'Dashboard'
    },
    {
      id: 'todo',
      icon: todoIcon,
      label: 'To-Do'
    },
    {
      id: 'add-task',
      icon: addIcon,
      label: 'Add Task',
      isSpecial: true
    },
    {
      id: 'rewards',
      icon: rewardsIcon,
      label: 'Rewards'
    },
    {
      id: 'settings',
      icon: settingsIcon,
      label: 'Settings'
    }
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <nav className="flex items-end justify-around max-w-6xl mx-auto px-4 relative">
        {navItems.map((item) => {
          if (item.isSpecial) {
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className="relative -mt-6 flex flex-col items-center justify-center transition-all duration-300 group"
                aria-label={item.label}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-yellow-500 shadow-lg flex items-center justify-center group-hover:shadow-xl group-hover:scale-105 transition-all duration-200">
                  <img src={item.icon} alt={item.label} className="w-12 h-9" />
                </div>
                <span 
                  className={`text-xs font-semibold text-gray-700 mt-1 mb-2 transition-all duration-300 ${
                    showLabels ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-3 transition-all duration-200 min-w-[72px] ${
                activeTab === item.id
                  ? 'text-orange-500'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-label={item.label}
            >
              <div className="relative">
                <img 
                  src={item.icon} 
                  alt={item.label} 
                  className={`w-8 h-8 transition-all duration-200 ${
                    activeTab === item.id ? 'scale-110' : ''
                  }`}
                />
                {activeTab === item.id && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full" />
                )}
              </div>
              <span 
                className={`text-xs font-medium transition-all duration-300 ${
                  activeTab === item.id ? 'font-semibold' : ''
                } ${
                  showLabels ? 'opacity-100 translate-y-0 max-h-6' : 'opacity-0 -translate-y-1 max-h-0'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </footer>
  );
};

export default Footer;