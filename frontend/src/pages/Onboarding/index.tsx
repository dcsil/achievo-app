import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WelcomeStep from './steps/WelcomeStep';
import InterestsStep from './steps/InterestsStep';
import CanvasStep from './steps/CanvasStep';
import SyllabusStep from './steps/SyllabusStep';
import NotificationStep from './steps/NotificationStep';
import CompletionStep from './steps/CompletionStep';

export interface OnboardingStepProps {
  onNext: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
}

const ONBOARDING_STEPS = [
  { component: WelcomeStep, title: 'Welcome', skippable: true },
  { component: InterestsStep, title: 'Interests', skippable: true },
  { component: CanvasStep, title: 'Canvas', skippable: true },
  { component: SyllabusStep, title: 'Syllabi', skippable: true },
  { component: NotificationStep, title: 'Notifications', skippable: true },
  { component: CompletionStep, title: 'Complete', skippable: false }
];

interface OnboardingProps {
  userId?: string;
  fromSettings?: boolean;
  targetStep?: number;
}

const Onboarding: React.FC<OnboardingProps> = ({ 
  fromSettings = false,
  targetStep
}) => {
  // Get user ID from localStorage
  const getUserId = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.user_id || 'paul_paw_test'; // fallback
      }
    } catch (error) {
      console.error('Error getting user from localStorage:', error);
    }
    return 'paul_paw_test'; // fallback
  };

  const [currentStep, setCurrentStep] = useState(targetStep ?? 0);
  const navigate = useNavigate();

  // Parse URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromSettingsParam = urlParams.get('fromSettings') === 'true';
    const targetStepParam = parseInt(urlParams.get('targetStep') || '0');
    
    if (fromSettingsParam && !isNaN(targetStepParam)) {
      setCurrentStep(targetStepParam);
    }
  }, []);

  const handleNext = () => {
    // Check if this is standalone mode
    const urlParams = new URLSearchParams(window.location.search);
    const standaloneParam = urlParams.get('standalone') === 'true';
    const fromSettingsParam = urlParams.get('fromSettings') === 'true';
    
    if (standaloneParam && fromSettingsParam) {
      // Return to settings after completing standalone step
      navigate('/settings');
      return;
    }
    
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
    navigate('/home');
    }
  };

  const handleSkip = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const standaloneParam = urlParams.get('standalone') === 'true';
    const fromSettingsParam = urlParams.get('fromSettings') === 'true';
    
    if (standaloneParam && fromSettingsParam) {
      navigate('/settings');
      return;
    }
    
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

  const handleStepClick = (stepIndex: number) => {
    // Only allow step jumping when revisiting from settings
    const urlParams = new URLSearchParams(window.location.search);
    const fromSettingsParam = urlParams.get('fromSettings') === 'true';
    
    if (fromSettingsParam) {
      setCurrentStep(stepIndex);
    }
  };

  const completeOnboarding = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromSettingsParam = urlParams.get('fromSettings') === 'true';
    
    if (fromSettingsParam) {
      navigate('/settings');
    } else {
      navigate('/home');
    }
  };

  const CurrentStepComponent = ONBOARDING_STEPS[currentStep].component;
  const currentStepInfo = ONBOARDING_STEPS[currentStep];

  // Get URL params for rendering logic
  const urlParams = new URLSearchParams(window.location.search);
  const fromSettingsParam = urlParams.get('fromSettings') === 'true';
  const standaloneParam = urlParams.get('standalone') === 'true';

  return (
    <div className="min-h-screen bg-white">
      {/* Progress Dots */}
      <div className="px-6 pt-8">
        <div className="max-w-2xl mx-auto">
          {fromSettingsParam && !standaloneParam && (
            <div className="text-center mb-4">
              <button 
                onClick={() => navigate('/settings')}
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                ← Back to Settings
              </button>
            </div>
          )}
          
          {!standaloneParam && (
            <div className="flex items-center justify-center space-x-2 mb-12">
              {ONBOARDING_STEPS.map((step, index) => (
                <div
                  key={index}
                  className={`relative group ${fromSettingsParam ? 'cursor-pointer' : ''}`}
                  onClick={() => fromSettingsParam && !standaloneParam ? handleStepClick(index) : undefined}
                >
                  <div
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentStep
                        ? 'bg-blue-600 scale-125'
                        : 'bg-gray-300'
                    } ${fromSettingsParam ? 'hover:scale-110' : ''}`}
                  />
                  {fromSettingsParam && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {step.title}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Current Step */}
      <div className="px-6 pb-6">
        <CurrentStepComponent
          onNext={handleNext}
          onSkip={standaloneParam ? handleSkip : (currentStepInfo.skippable ? handleSkip : undefined)}
          onBack={fromSettingsParam || currentStep > 0 ? handleBack : undefined}
          isFirstStep={currentStep === 0}
          isLastStep={currentStep === ONBOARDING_STEPS.length - 1}
        />
      </div>
    </div>
  );
};

export default Onboarding;