import React, { useState } from 'react';
import { OnboardingStepProps } from '../index';
import Button from '../../../components/skip-button';

const CanvasStep: React.FC<OnboardingStepProps> = ({ onNext, onBack, onSkip }) => {
  const [token, setToken] = useState('');
  const [showCourses, setShowCourses] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  // Dummy courses data
  const detectedCourses = [
    { id: 'HPS246', name: 'Data and Society: Whats Behind the Numbers?' },
    { id: 'LIN200', name: 'Introduction to Language' },
    { id: 'CSC318', name: 'The Design of Interactive Computational Media' },
    { id: 'CSC413', name: 'Neural Networks and Deep Learning' },
    { id: 'STA414', name: 'Statistical Methods for Machine Learning II' }
  ];

  const handlePermission = () => {
    setShowCourses(true);
    setSelectedCourses(detectedCourses.map(course => course.id));
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleNext = () => {
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">
        Canvas Integration
      </h2>

      {!showCourses ? (
        <>
          <p className="text-lg text-gray-600 mb-6">
            Permission to sync with Canvas?
          </p>
          
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <p className="text-sm text-gray-600 mb-4">
              Here's how you get your token:
            </p>
            <p className="text-sm text-gray-500">
              Go to Canvas → Account → Settings → New Access Token
            </p>
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Enter your Canvas token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={handlePermission}
              disabled={!token.trim()}
              variant="primary"
              className="px-8 py-3"
            >
              Connect Canvas
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
        </>
      ) : (
        <>
          <p className="text-lg text-gray-600 mb-6">
            Canvas detected the following courses:
          </p>
          
          <p className="text-base font-medium text-gray-700 mb-8">
            Confirm these are the courses for this semester.
          </p>

          <div className="space-y-3 mb-12">
            {detectedCourses.map((course) => (
              <div
                key={course.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedCourses.includes(course.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => toggleCourse(course.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{course.name}</div>
                    <div className="text-sm text-gray-500">{course.id}</div>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedCourses.includes(course.id)
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300'
                  }`}>
                    {selectedCourses.includes(course.id) && '✓'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <Button 
              onClick={handleNext} 
              variant="primary"
              className="px-8 py-3"
            >
              Confirm Courses
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
        </>
      )}
    </div>
  );
};

export default CanvasStep;