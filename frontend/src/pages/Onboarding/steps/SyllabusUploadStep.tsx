import React, { useState, useEffect } from 'react';
import { OnboardingStepProps } from '../index';
import { getCourses, CourseForUI } from '../../../api-contexts/get-courses';
import PdfUploadForm from '../../../components/pdf-upload';

const SyllabusUploadStep: React.FC<OnboardingStepProps> = ({ 
  onNext, 
  onSkip, 
  onBack 
}) => {
  const [courses, setCourses] = useState<CourseForUI[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const userId = 'paul_paw_test';

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const coursesData = await getCourses(userId);
      setCourses(coursesData);
    } catch (err) {
      setError('Failed to load courses');
      console.error('Error loading courses:', err);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError('');
      } else {
        setError('Please select a PDF file');
      }
    }
  };

  const handleUploadClick = () => {
    if (courses.length === 0) {
      setError('Please add at least one course before uploading syllabi');
      return;
    }
    // Open upload syllabi page in new tab
    window.open('/upload-syllabi', '_blank');
  };

  const handleAddCoursesClick = () => {
    window.open('/add-courses', '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
          <span className="text-4xl">📄</span>
          Upload Your Syllabi
        </h2>
        <p className="text-gray-600 text-lg">
          Upload your course syllabi and let Achievo automatically extract assignments, due dates, and create micro-tasks.
        </p>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        {/* Benefits Section */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-green-800 mb-2 flex items-center gap-2">
            <span>🎯</span> What happens when you upload?
          </h3>
          <div className="text-green-700 text-sm space-y-1">
            <p>• Assignments are automatically detected and extracted</p>
            <p>• Due dates are parsed and scheduled in your calendar</p>
            <p>• Micro-tasks are generated to break down large assignments</p>
            <p>• Everything is organized in your dashboard for easy tracking</p>
          </div>
        </div>

        {/* Course Check */}
        {courses.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-yellow-800 mb-2 flex items-center gap-2">
              <span>⚠️</span> Add Courses First
            </h3>
            <p className="text-yellow-700 text-sm mb-4">
              You need to add at least one course before uploading syllabi. This helps us organize your assignments properly.
            </p>
            <button
              onClick={handleAddCoursesClick}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition-colors"
            >
              Add Courses Now
            </button>
          </div>
        ) : (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📚 Ready to Upload ({courses.length} course{courses.length !== 1 ? 's' : ''} available)
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 text-sm">
                Great! You have {courses.length} course{courses.length !== 1 ? 's' : ''} set up. 
                You can now upload syllabi to extract assignments and generate micro-tasks.
              </p>
            </div>
          </div>
        )}

        {/* Demo Upload Form (Non-functional for onboarding) */}
        <div className="mb-6">
          <PdfUploadForm
            courses={courses}
            selectedCourseId={selectedCourseId}
            onCourseChange={setSelectedCourseId}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onUpload={handleUploadClick}
            isUploading={false}
            error={error}
            uploadButtonText="📄 Go to Upload Syllabi"
            title="Try It Out"
            subtitle="Select a course and upload a syllabus PDF to extract assignments automatically"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleUploadClick}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <span>📄</span>
            Upload Syllabi Now
          </button>
          
          <button
            onClick={onSkip}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-colors"
          >
            Skip for Now
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium flex items-center gap-1"
          >
            <span>←</span> Back
          </button>
        )}
        <button
          onClick={onNext}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium ml-auto flex items-center gap-1"
        >
          Continue <span>→</span>
        </button>
      </div>
    </div>
  );
};

export default SyllabusUploadStep;
