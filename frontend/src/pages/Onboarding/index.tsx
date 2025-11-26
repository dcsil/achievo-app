import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WelcomeStep from './steps/WelcomeStep';
import InterestsStep from './steps/InterestsStep';
import CanvasStep from './steps/CanvasStep';
import SyllabusStep from './steps/SyllabusStep';

export interface OnboardingStepProps {
  onNext: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
}

const ONBOARDING_STEPS = [
  { component: WelcomeStep, title: 'Welcome', skippable: false },
  { component: InterestsStep, title: 'Interests', skippable: false },
  { component: CanvasStep, title: 'Canvas', skippable: false },
  { component: SyllabusStep, title: 'Syllabi', skippable: false }
];

interface OnboardingProps {
  userId?: string;
  fromSettings?: boolean;
}

const Onboarding: React.FC<OnboardingProps> = ({ 
  userId = 'paul_paw_test',
  fromSettings = false 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    // Load completed steps from localStorage if revisiting
    const savedProgress = localStorage.getItem('onboarding-progress');
    if (savedProgress && fromSettings) {
      const progress = JSON.parse(savedProgress);
      setCompletedSteps(new Set(progress.completedSteps || []));
    }
  }, [fromSettings]);

  const handleNext = () => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStep);
    setCompletedSteps(newCompleted);
    
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = () => {
    const progress = {
      completed: true,
      completedSteps: Array.from(completedSteps),
      completedAt: new Date().toISOString()
    };
    localStorage.setItem('onboarding-progress', JSON.stringify(progress));
    
    if (fromSettings) {
      navigate('/settings');
    } else {
      navigate('/home');
    }
  };

  const CurrentStepComponent = ONBOARDING_STEPS[currentStep].component;
  const currentStepInfo = ONBOARDING_STEPS[currentStep];

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Progress Dots */}
      <div className="px-6 pt-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center space-x-2 mb-12">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep
                    ? 'bg-blue-600'
                    : completedSteps.has(index)
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Current Step */}
      <div className="px-6 pb-6">
        <CurrentStepComponent
          onNext={handleNext}
          onBack={currentStep > 0 ? handleBack : undefined}
          isFirstStep={currentStep === 0}
          isLastStep={currentStep === ONBOARDING_STEPS.length - 1}
        />
      </div>
    </div>
  );
};

export default Onboarding;
