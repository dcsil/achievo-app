import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, apiService } from '../../api-contexts/user-context';
import NotificationEnable from '../../notification-enable';
import ImageUploadForm from '../../components/image-upload';

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
  
  const navigate = useNavigate();

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
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const onboardingSteps = [
    { id: 0, name: 'Timetable', description: 'Upload timetable', icon: ':calendar_spiral:' },
    { id: 1, name: 'Interests', description: 'Set your break activity preferences', icon: ':dart:' },
    { id: 2, name: 'Canvas', description: 'Connect your Canvas account', icon: ':link:' },
    { id: 3, name: 'Syllabi', description: 'Upload course syllabi', icon: ':books:' }  ];

  const handleRedoStep = (stepIndex: number) => {
    navigate(`/onboarding?fromSettings=true&targetStep=${stepIndex}&standalone=true`);
  };

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

  const handleProfileChange = (key: keyof typeof profile, value: string | File) => {
    if (key === 'profilePicture' && value instanceof File) {
      // Do not automatically read here when called by form - prefer explicit upload action
      // This function keeps legacy behavior, but Settings now triggers the upload flow explicitly.
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.type.startsWith('image/')) {
      // Immediately read and set preview so user sees the uploaded photo without clicking Upload
      setIsUploadingImage(true);
      readFileAsDataUrl(file).then((dataUrl) => {
        setProfile(prev => ({ ...prev, profilePicture: dataUrl }));
        // clear temporary selection - preview is stored in profile
        setSelectedImageFile(null);
      }).catch((err) => {
        console.error('Failed to read selected image:', err);
        alert('Failed to read image. Please try again.');
      }).finally(() => setIsUploadingImage(false));
    } else if (file) {
      alert('Please select an image file (PNG, JPG, GIF)');
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) resolve(result);
        else reject(new Error('Failed to read file'));
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleUploadImage = async () => {
    // Make upload local-only: convert selected file to data URL and set as profile preview.
    if (!selectedImageFile) return;

    setIsUploadingImage(true);
    try {
      const dataUrl = await readFileAsDataUrl(selectedImageFile);

      // Do NOT persist to backend yet. Persist will happen on Save.
      setProfile(prev => ({ ...prev, profilePicture: dataUrl }));

      // Clear temporary file selection but keep preview until Save or Cancel
      setSelectedImageFile(null);
    } catch (err) {
      console.error('Failed to read profile image:', err);
      alert('Failed to read image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
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

          // After successful save, update localStorage with new user data
          try {
            const response = await fetch(`http://127.0.0.1:5000/db/users?user_id=${userId}`);
            if (response.ok) {
              const updatedUser = await response.json();
              localStorage.setItem('user', JSON.stringify(updatedUser));
              console.log('Profile updated and localStorage refreshed');
            }
          } catch (error) {
            console.error('Failed to refresh user data after profile update:', error);
          }
        }
      }
          
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
    setSelectedImageFile(null);
    setIsUploadingImage(false);
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
                  <ImageUploadForm
                    selectedFile={selectedImageFile}
                    onFileSelect={handleImageSelect}
                    onUpload={handleUploadImage}
                    isUploading={isUploadingImage}
                    error={''}
                    uploadButtonText={'Upload Image'}
                    previewUrl={profile.profilePicture}
                  />
                ) : (
                    <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                    {profile.profilePicture && profile.profilePicture !== '/default-profile.png' ? (
                      <img 
                        src={profile.profilePicture} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-lg" 
                         decoding="async"
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

        {/* Onboarding Setup */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🚀 Guide (dummy)</h2>
          <p className="text-gray-600 mb-4">
            Revisit any step from your initial setup to update your preferences or reconnect accounts.
          </p>
          
          <div className="space-y-3 mb-6">
            {onboardingSteps.map((step) => (
              <div 
                key={step.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="font-medium text-gray-700">{step.name}</p>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRedoStep(step.id)}
                  className="px-3 py-1 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Settings (moved to its own component) */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🔔 Notifications</h2>
          <NotificationEnable />
        </div>

        {/* App Preferences */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🎨 Personalization (dummy)</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <select
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="12-hour">12-hour (AM/PM)</option>
                <option value="24-hour">24-hour (coming soon)</option>
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