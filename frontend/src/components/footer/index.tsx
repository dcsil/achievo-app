import React, { useState } from 'react';

const Footer: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navItems = [
    {
      id: 'dashboard',
      icon: '📊',
      label: 'Dashboard'
    },
    {
      id: 'todo',
      icon: '✓',
      label: 'To-Do'
    },
    {
      id: 'add',
      icon: '➕',
      label: 'Add Task',
      isSpecial: true
    },
    {
      id: 'rewards',
      icon: '🎁',
      label: 'Rewards'
    },
    {
      id: 'settings',
      icon: '⚙️',
      label: 'Settings'
    }
  ];

  return (
    <footer className="w-full bg-white border-t border-gray-200 shadow-lg">
      <nav className="flex items-center justify-around max-w-6xl mx-auto px-2 py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
              item.isSpecial
                ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white scale-110 shadow-md hover:shadow-lg'
                : activeTab === item.id
                ? 'text-orange-600 bg-orange-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className={`text-xl ${item.isSpecial ? 'text-2xl' : ''}`}>
              {item.icon}
            </span>
            <span className={`text-xs font-medium ${item.isSpecial ? 'font-bold' : ''}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </footer>
  );
};

export default Footer;