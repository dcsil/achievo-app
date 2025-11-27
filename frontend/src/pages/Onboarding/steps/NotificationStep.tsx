import React, { useState } from 'react';
import { OnboardingStepProps } from '../index';
import Button from '../../../components/skip-button';

const NotificationStep: React.FC<OnboardingStepProps> = ({ onNext, onBack, onSkip }) => {
  const [notificationChoice, setNotificationChoice] = useState<'enabled' | 'disabled' | null>(null);

  const handleEnableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationChoice(permission === 'granted' ? 'enabled' : 'disabled');
      localStorage.setItem('notification-preference', permission);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setNotificationChoice('disabled');
    }
  };

  const handleSkipNotifications = () => {
    setNotificationChoice('disabled');
    localStorage.setItem('notification-preference', 'denied');
  };

  const handleNext = () => {
    onNext();
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold text-center mb-4">Stay on Track</h2>
      <p className="text-gray-600 text-center mb-8">
        Get gentle reminders to take breaks and stay productive throughout your day.
      </p>
      
      <div className="space-y-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">🔔 Break Reminders</h3>
          <p className="text-sm text-gray-600">We'll notify you when it's time for a healthy break</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">🎯 Goal Updates</h3>
          <p className="text-sm text-gray-600">Celebrate your achievements and track progress</p>
        </div>
      </div>

      {notificationChoice === null ? (
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleEnableNotifications}
            variant="primary"
            className="w-full px-8 py-3"
          >
            Enable Notifications
          </Button>
          <Button 
            onClick={handleSkipNotifications}
            variant="secondary"
            className="w-full px-8 py-3"
          >
            Maybe Later
          </Button>
        </div>
      ) : (
        <div className="text-center">
          {notificationChoice === 'enabled' ? (
            <div className="bg-green-100 p-4 rounded-lg mb-4">
              <p className="text-green-800 font-medium">✅ Notifications enabled!</p>
              <p className="text-green-600 text-sm">You'll receive helpful reminders</p>
            </div>
          ) : (
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <p className="text-gray-800 font-medium">Notifications disabled</p>
              <p className="text-gray-600 text-sm">You can enable them later in settings</p>
            </div>
          )}
          
          <Button
            onClick={handleNext}
            variant="primary"
            className="w-full px-8 py-3"
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotificationStep;



