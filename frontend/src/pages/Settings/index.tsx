import React, { useState, useEffect } from 'react';
import { User, apiService } from '../../api-contexts/user-context';

interface SettingsProps {
  user?: User | null;
  updateUserPoints?: (points: number) => void;
  updateUserProfile?: (updates: Partial<User>) => void;
  userId?: string;
}

const Settings: React.FC<SettingsProps> = ({ user, updateUserPoints, updateUserProfile, userId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false); // Separate editing state for Preferences
  const [isLoading, setSaving] = useState(false);
  
  const [notifications, setNotifications] = useState({
    enabled: true,
    permission: 'default' as 'default' | 'granted' | 'denied',
  });

  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'English',
    startOfWeek: 'Monday',
    timeFormat: '12-hour',
    defaultView: 'dashboard',
    breakActivity: 'Run', // Default break activity preference
  });

  // Initialize profile state with user data
  const [profile, setProfile] = useState({
    profilePicture: user?.profile_picture || '/default-profile.png',
    canvasUsername: user?.canvas_username || '',
    canvasDomain: user?.canvas_domain || '',
    canvasApiKey: '', // Don't show existing API key for security
    email: 'paul.paw@example.com', // Placeholder - not stored in User model yet
    bio: 'Computer Science student passionate about productivity and achievements!', // Placeholder
  });

  const [originalProfile, setOriginalProfile] = useState(profile);

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    progressVisible: false,
    allowDataCollection: true,
  });

  // Update profile state when user prop changes
  useEffect(() => {
    if (user) {
      const newProfile = {
        profilePicture: user.profile_picture || '/default-profile.png',
        canvasUsername: user.canvas_username || '',
        canvasDomain: user.canvas_domain || '',
        canvasApiKey: '',
        email: 'paul.paw@example.com', // Placeholder
        bio: 'Computer Science student passionate about productivity and achievements!', // Placeholder
      };
      setProfile(newProfile);
      setOriginalProfile(newProfile);
    }
  }, [user]);

  // Check Chrome notification permission and load saved settings on component mount
  useEffect(() => {
    const initializeSettings = async () => {
      // Check if we're in a Chrome extension environment
      if (typeof chrome !== 'undefined') {
        try {
          // First check current Chrome permission status
          let currentPermission: 'default' | 'granted' | 'denied' = 'default';
          if (chrome.permissions) {
            const hasPermission = await chrome.permissions.contains({
              permissions: ['notifications']
            });
            currentPermission = hasPermission ? 'granted' : 'default';
          }

          // Load saved settings from Chrome storage
          if (chrome.storage) {
            const result = await chrome.storage.local.get([
              'notificationSettings',
              'appPreferences',
              'privacySettings'
            ]);
            
            // Handle notification settings with permission synchronization
            if (result.notificationSettings) {
              const savedNotificationSettings = result.notificationSettings;
              
              // Sync with actual Chrome permission status
              const syncedNotificationSettings = {
                ...savedNotificationSettings,
                permission: currentPermission,
                // Only keep enabled if both saved as enabled AND Chrome permission is granted
                enabled: savedNotificationSettings.enabled && (currentPermission === 'granted')
              };
              
              setNotifications(syncedNotificationSettings);
              
              // Save the synced state back to storage if it changed
              if (syncedNotificationSettings.enabled !== savedNotificationSettings.enabled || 
                  syncedNotificationSettings.permission !== savedNotificationSettings.permission) {
                await chrome.storage.local.set({
                  notificationSettings: syncedNotificationSettings
                });
              }
            } else {
              // No saved settings, initialize with Chrome permission status
              const initialNotificationSettings = {
                enabled: currentPermission === 'granted',
                permission: currentPermission
              };
              setNotifications(initialNotificationSettings);
              
              // Save initial settings
              await chrome.storage.local.set({
                notificationSettings: initialNotificationSettings
              });
            }
            
            if (result.appPreferences) {
              setPreferences(result.appPreferences);
            }
            if (result.privacySettings) {
              setPrivacy(result.privacySettings);
            }
          } else {
            // No Chrome storage available, just set permission status
            setNotifications(prev => ({
              ...prev,
              permission: currentPermission,
              enabled: prev.enabled && (currentPermission === 'granted')
            }));
          }
        } catch (error) {
          console.error('Error initializing settings:', error);
        }
      }
    };

    initializeSettings();
  }, []);

  // Listen for permission changes (when user changes settings in Chrome)
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.permissions) {
      const handlePermissionChange = (permissions: chrome.permissions.Permissions) => {
        if (permissions.permissions?.includes('notifications')) {
          setNotifications(prev => ({
            ...prev,
            permission: 'granted',
            enabled: true
          }));
        } else {
          setNotifications(prev => ({
            ...prev,
            permission: 'denied',
            enabled: false
          }));
        }
      };

      // Listen for permission changes
      chrome.permissions.onAdded.addListener(handlePermissionChange);
      chrome.permissions.onRemoved.addListener(handlePermissionChange);

      // Cleanup listeners
      return () => {
        chrome.permissions.onAdded.removeListener(handlePermissionChange);
        chrome.permissions.onRemoved.removeListener(handlePermissionChange);
      };
    }
  }, []);

  const handleNotificationChange = async () => {
    const newEnabled = !notifications.enabled;
    
    if (newEnabled) {
      // User wants to enable notifications - request Chrome permission
      if (typeof chrome !== 'undefined' && chrome.permissions) {
        try {
          // Request notification permission
          const granted = await chrome.permissions.request({
            permissions: ['notifications']
          });
          
          if (granted) {
            const newNotificationState = {
              ...notifications,
              enabled: true,
              permission: 'granted' as const
            };
            setNotifications(newNotificationState);
            
            // Immediately save to Chrome storage
            if (chrome.storage) {
              await chrome.storage.local.set({
                notificationSettings: newNotificationState
              });
            }
            
            // Show a test notification to confirm it's working
            if (chrome.notifications) {
              chrome.notifications.create({
                type: 'basic',
                iconUrl: '/achievo-clap-transparent.png',
                title: 'Notifications Enabled!',
                message: 'You will now receive Achievo task reminders.',
                priority: 2
              });
            }
          } else {
            // Permission denied
            const newNotificationState = {
              ...notifications,
              enabled: false,
              permission: 'denied' as const
            };
            setNotifications(newNotificationState);
            
            // Save denied state to Chrome storage
            if (chrome.storage) {
              await chrome.storage.local.set({
                notificationSettings: newNotificationState
              });
            }
            alert('Notification permission was denied. You can enable it later in Chrome settings or by clicking the toggle again.');
          }
        } catch (error) {
          console.error('Error requesting notification permission:', error);
          alert('Error requesting notification permission. Please try again.');
        }
      } else {
        // Fallback for non-extension environment
        const newNotificationState = {
          ...notifications,
          enabled: newEnabled
        };
        setNotifications(newNotificationState);
      }
    } else {
      // User wants to disable notifications
      if (typeof chrome !== 'undefined' && chrome.permissions) {
        try {
          // Update state first to show immediate feedback
          const newNotificationState = {
            ...notifications,
            enabled: false,
            permission: notifications.permission // Keep current permission status
          };
          setNotifications(newNotificationState);
          
          // Immediately save to Chrome storage
          if (chrome.storage) {
            await chrome.storage.local.set({
              notificationSettings: newNotificationState
            });
          }
          
          // Optionally remove Chrome permission (user can choose to keep permission but disable notifications)
          // For now, we'll keep the permission but just disable notifications in the app
          console.log('Notifications disabled - permission kept for easy re-enabling');
          
        } catch (error) {
          console.error('Error disabling notifications:', error);
          // Still update the UI even if storage fails
          setNotifications(prev => ({
            ...prev,
            enabled: false
          }));
        }
      } else {
        // Fallback for non-extension environment
        const newNotificationState = {
          ...notifications,
          enabled: newEnabled
        };
        setNotifications(newNotificationState);
      }
    }
  };

  const handlePreferenceChange = (key: keyof typeof preferences, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleProfileChange = (key: keyof typeof profile, value: string | File) => {
    if (key === 'profilePicture' && value instanceof File) {
      // Handle file upload - in a real app, you'd upload to a server
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfile(prev => ({
          ...prev,
          [key]: result
        }));
      };
      reader.readAsDataURL(value);
    } else {
      setProfile(prev => ({
        ...prev,
        [key]: value as string
      }));
    }
  };

  const handlePrivacyChange = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    if (!user?.user_id) {
      alert('Error: User ID not available');
      return;
    }

    setSaving(true);
    try {
      // Only save profile changes if we're editing profile
      if (isEditing) {
        const updates: any = {};
        
        // Only include fields that have changed
        if (profile.canvasUsername !== originalProfile.canvasUsername) {
          updates.canvas_username = profile.canvasUsername;
        }
        if (profile.canvasDomain !== originalProfile.canvasDomain) {
          updates.canvas_domain = profile.canvasDomain;
        }
        if (profile.canvasApiKey) {
          updates.canvas_api_key = profile.canvasApiKey;
        }
        if (profile.profilePicture !== originalProfile.profilePicture) {
          updates.profile_picture = profile.profilePicture;
        }

        if (Object.keys(updates).length > 0) {
          await apiService.updateUser(user.user_id, updates);
          setOriginalProfile(profile);
          
          // Update the user state in parent component to refresh header
          if (updateUserProfile) {
            updateUserProfile(updates);
          }
        }
      }
      
      // Save notification settings to Chrome storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        try {
          await chrome.storage.local.set({
            notificationSettings: notifications,
            appPreferences: preferences,
            privacySettings: privacy
          });
        } catch (error) {
          console.error('Error saving settings to Chrome storage:', error);
        }
      }
      
      console.log('Saving settings...', { notifications, preferences, privacy });
      
      setIsEditing(false);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset profile changes if cancelled
    setProfile(originalProfile);
    setIsEditing(false);
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
        {/* Account Information & Profile */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">👤 Account & Profile</h2>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                {isEditing ? (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleProfileChange('profilePicture', file);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                    {profile.profilePicture && profile.profilePicture !== '/default-profile.png' ? (
                      <img 
                        src={profile.profilePicture} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-lg" 
                      />
                    ) : (
                      <span className="text-gray-400">No image</span>
                    )}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Username</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.canvasUsername}
                    onChange={(e) => handleProfileChange('canvasUsername', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your Canvas username"
                  />
                ) : (
                  <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-gray-700">
                    {profile.canvasUsername || 'Not set'}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Canvas Domain</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.canvasDomain}
                    onChange={(e) => handleProfileChange('canvasDomain', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    placeholder="e.g., myschool.instructure.com"
                  />
                ) : (
                  <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-gray-700">
                    {profile.canvasDomain || 'Not set'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Canvas API Key</label>
                {isEditing ? (
                  <input
                    type="password"
                    value={profile.canvasApiKey}
                    onChange={(e) => handleProfileChange('canvasApiKey', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your Canvas API key (optional)"
                  />
                ) : (
                  <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-gray-700">
                    {profile.canvasApiKey ? '••••••••••••••••' : 'Not set'}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  API key is securely encrypted and used to sync with Canvas
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email (placeholder)</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your email for notifications"
                    disabled
                  />
                ) : (
                  <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-gray-700">{profile.email}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Email functionality coming soon
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio (placeholder)</label>
                {isEditing ? (
                  <textarea
                    value={profile.bio}
                    onChange={(e) => handleProfileChange('bio', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    rows={3}
                    placeholder="Tell us about yourself..."
                    disabled
                  />
                ) : (
                  <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-gray-700 min-h-[80px]">{profile.bio}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Bio functionality coming soon
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🎯 Habits and Preferences (dummy)</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What do you like to do during a break?
              </label>
              <div className="w-full px-3 py-2 bg-gray-50 rounded-lg text-gray-700">
                {preferences.breakActivity === 'Run' && '🏃‍♂️ Run'}
                {preferences.breakActivity === 'Read' && '📚 Read'}
                {preferences.breakActivity === 'Walk' && '🚶‍♂️ Walk'}
                {preferences.breakActivity === 'Grab Food' && '🍕 Grab Food'}
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <button
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300 font-medium"
                onClick={() => alert('Preferences quiz feature coming soon!')}
              >
                📝 Retake Preferences Quiz
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Take our quiz again to update your preferences and get better recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🔔 Notifications</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Enable Notifications</p>
                <p className="text-sm text-gray-500">
                  Receive notifications for tasks reminders
                  {notifications.permission === 'denied' && (
                    <span className="block text-red-500 text-xs mt-1">
                      Permission denied. Enable in Chrome settings or click toggle to try again.
                    </span>
                  )}
                  {notifications.permission === 'granted' && notifications.enabled && (
                    <span className="block text-green-500 text-xs mt-1">
                      ✓ Chrome notifications enabled
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={handleNotificationChange}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.enabled ? 'bg-orange-500' : 'bg-gray-200'
                } ${notifications.permission === 'denied' ? 'opacity-75' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {notifications.permission === 'denied' && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">
                  <strong>Notifications Blocked:</strong> To enable notifications, you can:
                </p>
                <ul className="text-xs text-red-600 mt-1 ml-4 list-disc">
                  <li>Click the toggle above to request permission again</li>
                  <li>Go to Chrome Settings → Privacy & Security → Site Settings → Notifications</li>
                  <li>Look for this extension and set it to "Allow"</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* App Preferences */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🎨 Personalization (dummy)</h2>
          
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
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🔧 Account Management (dummy)</h2>
          
          <div className="space-y-4">
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

        {/* Save Settings Button - Only show when not editing profile */}
        {!isEditing && (
          <div className="flex justify-center">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;