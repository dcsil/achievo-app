import React, { useState } from 'react';
import { User } from '../../api-contexts/user-context';

interface SettingsProps {
  user?: User | null;
  updateUserPoints?: (points: number) => void;
  userId?: string;
}

const Settings: React.FC<SettingsProps> = ({ user, updateUserPoints, userId }) => {
  const [notifications, setNotifications] = useState({
    taskReminders: true,
    assignmentDeadlines: true,
    pointsEarned: true,
    weeklyProgress: false,
    emailNotifications: true,
  });

  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'English',
    startOfWeek: 'Monday',
    timeFormat: '12-hour',
    defaultView: 'dashboard',
  });

  const [profile, setProfile] = useState({
    displayName: 'Paul Paw', // Hardcoded since we don't have this in User
    email: 'paul.paw@example.com', // Hardcoded
    bio: 'Computer Science student passionate about productivity and achievements!', // Hardcoded
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    progressVisible: false,
    allowDataCollection: true,
  });

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePreferenceChange = (key: keyof typeof preferences, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleProfileChange = (key: keyof typeof profile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePrivacyChange = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    // Here you would typically save to backend
    console.log('Saving settings...', { notifications, preferences, profile, privacy });
    alert('Settings saved successfully!');
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all your progress? This action cannot be undone.')) {
      // Reset user data logic here
      console.log('Resetting user data...');
      alert('Data reset successfully!');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Delete account logic here
      console.log('Deleting account...');
      alert('Account deletion initiated. You will be contacted via email.');
    }
  };

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">⚙️ Settings</h1>
        <p className="text-gray-600">Customize your Achievo experience</p>
      </div>

      <div className="space-y-6">
        {/* Account Info Display (Read-only) */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">👤 Account Information</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-700">Username</p>
                <p className="text-sm text-gray-500">{user?.canvas_username || 'Loading...'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">From Canvas</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-700">User ID</p>
                <p className="text-sm text-gray-500">{user?.user_id || 'Loading...'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">System ID</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div>
                <p className="font-medium text-gray-700">Total Points</p>
                <p className="text-sm text-gray-500">🪙 {user?.total_points?.toLocaleString() || '0'} coins earned</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-orange-600 font-semibold">Level {user?.current_level || 1}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Customization */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">✏️ Profile Customization</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) => handleProfileChange('displayName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter your display name"
              />
              <p className="text-xs text-gray-500 mt-1">This is how you'll appear in the app</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter your email for notifications"
              />
              <p className="text-xs text-gray-500 mt-1">Used for notifications and account recovery</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => handleProfileChange('bio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                rows={3}
                placeholder="Tell us about yourself..."
              />
              <p className="text-xs text-gray-500 mt-1">Share a bit about your academic goals</p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🔔 Notifications</h2>
          
          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">
                    {key === 'taskReminders' && 'Task Reminders'}
                    {key === 'assignmentDeadlines' && 'Assignment Deadlines'}
                    {key === 'pointsEarned' && 'Points Earned'}
                    {key === 'weeklyProgress' && 'Weekly Progress Report'}
                    {key === 'emailNotifications' && 'Email Notifications'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {key === 'taskReminders' && 'Get notified about upcoming tasks'}
                    {key === 'assignmentDeadlines' && 'Get notified about assignment due dates'}
                    {key === 'pointsEarned' && 'Get notified when you earn points'}
                    {key === 'weeklyProgress' && 'Receive weekly summary of your progress'}
                    {key === 'emailNotifications' && 'Receive notifications via email'}
                  </p>
                </div>
                <button
                  onClick={() => handleNotificationChange(key as keyof typeof notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* App Preferences */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🎨 Preferences</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <select
                value={preferences.theme}
                onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark (Coming Soon)</option>
                <option value="auto">Auto (Coming Soon)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={preferences.language}
                onChange={(e) => handlePreferenceChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish (Coming Soon)</option>
                <option value="French">French (Coming Soon)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start of Week</label>
              <select
                value={preferences.startOfWeek}
                onChange={(e) => handlePreferenceChange('startOfWeek', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
              <select
                value={preferences.timeFormat}
                onChange={(e) => handlePreferenceChange('timeFormat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="12-hour">12-hour (AM/PM)</option>
                <option value="24-hour">24-hour</option>
              </select>
            </div>
          </div>
        </div>

        {/* Account Management */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🔧 Account Management</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-700">Export Data</p>
                <p className="text-sm text-gray-500">Download all your progress and achievements</p>
              </div>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Export
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div>
                <p className="font-medium text-gray-700">Reset Progress</p>
                <p className="text-sm text-gray-500">Clear all tasks, points, and achievements</p>
              </div>
              <button 
                onClick={handleResetData}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Reset
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div>
                <p className="font-medium text-gray-700">Delete Account</p>
                <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
              </div>
              <button 
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;