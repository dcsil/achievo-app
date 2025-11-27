
import React, { useState, useEffect } from 'react';
import { OnboardingStepProps } from '../index';
import Button from '../../../components/skip-button';
import NotificationEnable from '../../../notification-enable';

// Extend props to accept user context from Layout
interface NotificationStepProps extends OnboardingStepProps {
  user?: any;
  userId?: string;
  updateUserProfile?: (updates: any) => void;
  updateUserPoints?: (points: number) => void;
}

const NotificationStep: React.FC<NotificationStepProps> = ({ onNext, onBack, onSkip, user, userId, updateUserProfile, updateUserPoints }) => {
  const [notifications, setNotifications] = useState({
    enabled: false,
    permission: 'default' as 'default' | 'granted' | 'denied',
  });
  const [error, setError] = useState<string | null>(null);

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

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <NotificationEnable />
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          onClick={handleNext}
          variant="primary"
          className="px-8 py-3"
        >
          Continue
        </Button>
      </div>
    
    </div>
  );
};

export default NotificationStep;



