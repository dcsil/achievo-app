import React from 'react';
import { OnboardingStepProps } from '../index';
import Button from '../../../components/skip-button';

const CompletionStep: React.FC<OnboardingStepProps> = ({ onNext, onBack }) => {
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'courses':
        window.open('/add-courses', '_blank');
        break;
      case 'syllabi':
        window.open('/upload-syllabi', '_blank');
        break;
      case 'timetable':
        window.open('/upload-timetable', '_blank');
        break;
      case 'tasks':
        window.open('/add-task', '_blank');
        break;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
          <span className="text-4xl">🎉</span>
          You're All Set!
        </h2>
        <p className="text-gray-600 text-lg">
          Welcome to Achievo! You're ready to start managing your academic tasks more effectively.
        </p>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">

        {/* Key Features Reminder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <span className="text-2xl block mb-2">🎯</span>
            <h4 className="font-semibold text-blue-800 text-sm">Track Progress</h4>
            <p className="text-xs text-blue-600">Monitor your academic progress</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <span className="text-2xl block mb-2">⭐</span>
            <h4 className="font-semibold text-green-800 text-sm">Earn Points</h4>
            <p className="text-xs text-green-600">Get rewards for completed tasks</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <span className="text-2xl block mb-2">📊</span>
            <h4 className="font-semibold text-purple-800 text-sm">View Insights</h4>
            <p className="text-xs text-purple-600">Analyze your productivity</p>
          </div>
        </div>

        {/* Main Action */}
        <div className="text-center">
          <div className="flex justify-center">
            <Button
              onClick={onNext}
              variant="primary"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg flex items-center justify-center gap-2 mb-4"
            >
              Go to Dashboard <span>🏠</span>
            </Button>
          </div>
          
          <p className="text-sm text-gray-500">
            You can always revisit this onboarding from your settings page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompletionStep;

