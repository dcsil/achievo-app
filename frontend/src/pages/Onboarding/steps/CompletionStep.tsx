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
        {/* Next Steps */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">🚀 Recommended Next Steps</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <button
                onClick={() => handleQuickAction('courses')}
                className="w-full p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📚</span>
                  <div>
                    <p className="font-medium text-blue-800">Add Your Courses</p>
                    <p className="text-xs text-blue-600">Set up your semester courses</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => handleQuickAction('syllabi')}
                className="w-full p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  <div>
                    <p className="font-medium text-green-800">Upload Syllabi</p>
                    <p className="text-xs text-green-600">Extract assignments automatically</p>
                  </div>
                </div>
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleQuickAction('timetable')}
                className="w-full p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📅</span>
                  <div>
                    <p className="font-medium text-purple-800">Upload Timetable</p>
                    <p className="text-xs text-purple-600">Schedule around your classes</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => handleQuickAction('tasks')}
                className="w-full p-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">✏️</span>
                  <div>
                    <p className="font-medium text-orange-800">Add Tasks Manually</p>
                    <p className="text-xs text-orange-600">Create custom tasks and assignments</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

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
          <Button
            onClick={onNext}
            variant="primary"
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 text-lg flex items-center justify-center gap-2 mx-auto mb-4"
          >
            Go to Dashboard <span>🏠</span>
          </Button>
          
          <p className="text-sm text-gray-500">
            You can always revisit this onboarding from your settings page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompletionStep;

