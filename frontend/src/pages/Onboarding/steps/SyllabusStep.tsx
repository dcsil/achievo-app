import React, { useState, useEffect } from 'react';
import { OnboardingStepProps } from '../index';
import { processSyllabus, validatePdfFile, SyllabiResult } from '../../../api-contexts/syllabi-api';
import { getCourses, CourseForUI } from '../../../api-contexts/get-courses';
import { assignmentsApiService } from '../../../api-contexts/add-assignments';
import { tasksApiService } from '../../../api-contexts/add-tasks';
import PdfUploadForm from '../../../components/pdf-upload';
import MultipleTaskContainer from '../../../components/multiple-task-container';
import AssignmentProgressContainer from '../../../components/assignment-progress-container';
import Button from '../../../components/skip-button';

const SyllabusStep: React.FC<OnboardingStepProps> = ({ onNext, onBack }) => {
  const [courses, setCourses] = useState<CourseForUI[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<SyllabiResult | null>(null);
  const [error, setError] = useState<string>('');
  const [busyIntervals, setBusyIntervals] = useState<Array<{start: string, end: string}>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showUploadAnother, setShowUploadAnother] = useState(false);
  const [hasEverSaved, setHasEverSaved] = useState(false);

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
  
  const userId = getUserId();

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
      const validation = validatePdfFile(file);
      if (validation.valid) {
        setSelectedFile(file);
        setError('');
      } else {
        setError(validation.error || 'Invalid file');
      }
    }
  };

  const generateRandomId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCourseId) {
      setError('Please select both a course and a PDF file');
      return;
    }

    setIsUploading(true);
    setError('');
    setResult(null);

    try {
      // Generate random IDs for this upload
      const assignmentId = generateRandomId();
      const taskId1 = generateRandomId();
      const taskId2 = generateRandomId();
      const taskId3 = generateRandomId();
      const examTaskId = generateRandomId();

      // Mock result for testing instead of actual API call
      const mockResult = {
        "assignments": [
          {
            "assignment_id": assignmentId,
            "completion_points": 200,
            "course_id": selectedCourseId,
            "due_date": "2025-09-30T23:59:00",
            "is_complete": false,
            "title": "Essay",
            "micro_tasks": [
              {
                "assignment_id": assignmentId,
                "course_id": selectedCourseId,
                "description": "Research and outline Essay",
                "is_completed": false,
                "reward_points": 30,
                "scheduled_end_at": "2025-09-05T12:00:00",
                "scheduled_start_at": "2025-09-05T09:00:00",
                "task_id": taskId1,
                "type": "assignment",
                "user_id": userId
              },
              {
                "assignment_id": assignmentId,
                "course_id": selectedCourseId,
                "description": "First draft of Essay",
                "is_completed": false,
                "reward_points": 30,
                "scheduled_end_at": "2025-09-12T12:00:00",
                "scheduled_start_at": "2025-09-12T09:00:00",
                "task_id": taskId2,
                "type": "assignment",
                "user_id": userId
              },
              {
                "assignment_id": assignmentId,
                "course_id": selectedCourseId,
                "description": "Finalize and Submit Essay",
                "is_completed": false,
                "reward_points": 30,
                "scheduled_end_at": "2025-09-26T12:00:00",
                "scheduled_start_at": "2025-09-26T09:00:00",
                "task_id": taskId3,
                "type": "assignment",
                "user_id": userId
              }
            ]
          }
        ],
        "assignments_found": 1,
        "course_id": selectedCourseId,
        "status": "success",
        "tasks": [
          {
            "course_id": selectedCourseId,
            "description": "Midterm Exam",
            "is_completed": false,
            "reward_points": 25,
            "scheduled_end_at": "2025-10-17T20:00:00",
            "scheduled_start_at": "2025-10-17T18:00:00",
            "task_id": examTaskId,
            "type": "exam",
            "user_id": userId
          }
        ],
        "tasks_found": 1,
        "total_micro_tasks": 3
      } as SyllabiResult;

      await new Promise(resolve => setTimeout(resolve, 2000));
      setResult(mockResult);

      // Original API call (commented out for testing)
      // const formData = new FormData();
      // formData.append('file', selectedFile);
      // formData.append('course_id', selectedCourseId);
      // formData.append('user_id', userId);
      // formData.append('busy_intervals', JSON.stringify(busyIntervals));
      // const response = await fetch('http://127.0.0.1:5000/api/syllabi/process', {
      //   method: 'POST',
      //   body: formData,
      // });
      // const syllabusResult = await response.json();
      // setResult(syllabusResult);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process syllabus');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveToDashboard = async () => {
    if (!result) return;

    setIsSaving(true);
    setError('');

    try {
      // Save assignments to backend
      for (const assignment of result.assignments) {
        await assignmentsApiService.createAssignment({
          assignment_id: assignment.assignment_id,
          course_id: assignment.course_id,
          title: assignment.title,
          due_date: assignment.due_date,
          completion_points: assignment.completion_points
        });

        // Save micro-tasks for each assignment
        for (const microTask of assignment.micro_tasks) {
          await tasksApiService.createTask({
            task_id: microTask.task_id,
            user_id: microTask.user_id,
            description: microTask.description,
            type: microTask.type,
            assignment_id: microTask.assignment_id,
            course_id: microTask.course_id,
            scheduled_start_at: microTask.scheduled_start_at || undefined,
            scheduled_end_at: microTask.scheduled_end_at || undefined,
            reward_points: microTask.reward_points
          });
        }
      }

      // Save standalone tasks (exams, quizzes)
      for (const task of result.tasks) {
        await tasksApiService.createTask({
          task_id: task.task_id,
          user_id: task.user_id,
          description: task.description,
          type: task.type,
          course_id: task.course_id,
          scheduled_start_at: task.scheduled_start_at || undefined,
          scheduled_end_at: task.scheduled_end_at || undefined,
          reward_points: task.reward_points
        });
      }
      
      setSaveSuccess(true);
      setHasEverSaved(true);

      console.log('Syllabi data saved to backend:', result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save syllabi data');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForNewUpload = () => {
    setSelectedFile(null);
    setSelectedCourseId(''); // Reset course selection
    setResult(null);
    setSaveSuccess(false);
    setShowUploadAnother(false);
    setError('');
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleUploadAnother = () => {
    setShowUploadAnother(true);
    resetForNewUpload();
  };

  const handleNext = () => {
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Great! Now let's upload your syllabi
        </h2>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        {courses.length === 0 ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <span className="text-6xl">📚</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              No courses found
            </h3>
            <p className="text-gray-600 mb-4">
              Please upload your timetable first to create courses, then come back to upload your syllabi.
            </p>
            
          </div>
        ) : (
          <PdfUploadForm
            courses={courses}
            selectedCourseId={selectedCourseId}
            onCourseChange={setSelectedCourseId}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onUpload={handleUpload}
            isUploading={isUploading}
            error={error}
            uploadButtonText="📄 Process Syllabus"
            title="Select Course & Upload Syllabus"
            subtitle="Choose your course and upload the syllabus PDF to extract assignments and tasks"
          />
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-2">✅ Processing Complete!</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{result.assignments_found}</p>
                <p className="text-sm text-blue-700">Assignments</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{result.tasks_found}</p>
                <p className="text-sm text-green-700">Exams/Quizzes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{result.total_micro_tasks}</p>
                <p className="text-sm text-purple-700">Micro-tasks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {result.assignments_found + result.tasks_found + result.total_micro_tasks}
                </p>
                <p className="text-sm text-orange-700">Total Items</p>
              </div>
            </div>
          </div>

          {/* Extracted Tasks Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              📝 Extracted Tasks
            </h3>
            <p className="text-gray-600 mb-6">
              Review the tasks extracted from your syllabus. These will be saved to your dashboard.
            </p>

            {/* Standalone Tasks Section */}
            {result.tasks.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-4">🕐 tests ({result.tasks.length} total)</h4>
                <MultipleTaskContainer 
                  tasks={result.tasks}
                  userId={userId}
                  onTaskCompleted={() => {}}
                  onRefreshData={() => {}}
                  timeAdjustment={false}
                  showCompleteButton={false}
                />
              </div>
            )}

            {/* Assignments Section */}
            {result.assignments.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-4">📚 Assignments</h4>
                <div className="space-y-6">
                  {result.assignments.map((assignment) => {
                    const assignmentTasks = assignment.micro_tasks || [];
                    
                    return (
                      <div key={assignment.assignment_id} className="border border-gray-200 rounded-lg p-4">
                        {/* Assignment Header - Use proper AssignmentProgressContainer */}
                        <div className="mb-4">
                          <AssignmentProgressContainer
                            assignments={[assignment]}
                            color="blue"
                          />
                        </div>
                        
                        {/* Assignment Micro-tasks - Use proper MultipleTaskContainer */}
                        <div>
                          <h5 className="text-md font-semibold text-gray-700 mb-3 text-center">
                            Micro-tasks ({assignmentTasks.length} total)
                          </h5>
                          
                          {assignmentTasks.length > 0 ? (
                            <div className="space-y-2">
                              <MultipleTaskContainer 
                                tasks={assignmentTasks}
                                userId={userId}
                                onTaskCompleted={() => {}}
                                onRefreshData={() => {}}
                                timeAdjustment={false}
                                showCompleteButton={false}
                              />
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm text-center">No micro-tasks generated for this assignment</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="text-center mt-8">
        <div className="flex gap-4 justify-center mb-12">
          {result && !saveSuccess && (
            <Button
              onClick={handleSaveToDashboard}
              disabled={isSaving}
              variant="primary"
              className="px-8 py-3"
            >
              {isSaving ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Saving to Dashboard...
                </>
              ) : (
                '💾 Save to Dashboard'
              )}
            </Button>
          )}

         
          {result && saveSuccess && (
            <Button
              onClick={handleUploadAnother}
              variant="primary"
              className="px-8 py-3"
            >
              📤 Upload Another Syllabus
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            variant={hasEverSaved ? "primary" : "secondary"}
            className="px-8 py-3"
          >
            {hasEverSaved ? 'Continue' : 'Skip'}
          </Button>
        </div>

        {saveSuccess && (
            <div className="bg-green-100 p-3 rounded-lg mb-4">
              <p className="text-green-800 font-medium">✅ Syllabus saved successfully!</p>
              <p className="text-green-600 text-sm">Assignments and tasks are now available in your dashboard</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default SyllabusStep;