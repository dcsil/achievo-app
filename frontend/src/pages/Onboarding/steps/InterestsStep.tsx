import React, { useState } from 'react';
import { OnboardingStepProps } from '../index';
import Button from '../../../components/skip-button';

const InterestsStep: React.FC<OnboardingStepProps> = ({ onNext, onBack, onSkip }) => {
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  const activities = [
    { id: 'run', label: 'Run' },
    { id: 'read', label: 'Read' },
    { id: 'walk', label: 'Walking' },
    { id: 'food', label: 'Go grab food/coffee' }
  ];

  const toggleActivity = (activityId: string) => {
    setSelectedActivities(prev => 
      prev.includes(activityId) 
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const handleNext = () => {
    // Save preferences to localStorage
    localStorage.setItem('break-activities', JSON.stringify(selectedActivities));
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Let's understand your interests
      </h2>
      
      <p className="text-lg text-gray-600 mb-6">
        Mental health is crucial, and taking breaks and pausing is key!
      </p>
      
      <p className="text-lg font-medium text-gray-700 mb-8">
        What do you like to do for break?
      </p>

      <div className="space-y-4 mb-12">
        {activities.map((activity) => (
          <button
            key={activity.id}
            onClick={() => toggleActivity(activity.id)}
            className={`w-full p-4 rounded-lg border-2 transition-colors ${
              selectedActivities.includes(activity.id)
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            {activity.label}
          </button>
        ))}
      </div>

      <div className="flex gap-4 justify-center">
        <Button
          onClick={handleNext}
          disabled={selectedActivities.length === 0}
          variant="primary"
          className="px-8 py-3"
        >
          Continue
        </Button>
        {onSkip && (
          <Button 
            onClick={onSkip} 
            variant="secondary"
            className="px-8 py-3"
          >
            Skip
          </Button>
        )}
      </div>
    </div>
  );
};

export default InterestsStep;
