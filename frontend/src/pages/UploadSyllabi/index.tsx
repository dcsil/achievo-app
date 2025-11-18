import React, { useState, useEffect } from 'react';
import { processSyllabus, validatePdfFile, SyllabiResult } from '../../api-contexts/syllabi-api';
import { getCourses, CourseForUI } from '../../api-contexts/get-courses';
import TaskContainer from '../../components/task-container';
import AssignmentProgressContainer from '../../components/assignment-progress-container';
import PdfUploadForm from '../../components/pdf-upload';

interface UploadSyllabiProps {
  userId?: string;
}

const UploadSyllabi: React.FC<UploadSyllabiProps> = ({ userId = 'paul_paw_test' }) => {
  const [courses, setCourses] = useState<CourseForUI[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<SyllabiResult | null>(null);
  const [error, setError] = useState<string>('');
  const [busyIntervals, setBusyIntervals] = useState<Array<{start: string, end: string}>>([]);

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

  const handleUpload = async () => {
    if (!selectedFile || !selectedCourseId) {
      setError('Please select both a course and a PDF file');
      return;
    }

    setIsUploading(true);
    setError('');
    setResult(null);

    try {
      // Mock result for testing instead of actual API call
      const mockResult = {
        "assignments": [
          {
            "assignment_id": "5ae91363-a9cc-4d67-a3d2-52def8772ade",
            "completion_points": 200,
            "course_id": "CSC067",
            "due_date": "2025-09-30T23:59:00",
            "is_complete": false,
            "title": "Assignment 1",
            "micro_tasks": [
              {
                "assignment_id": "5ae91363-a9cc-4d67-a3d2-52def8772ade",
                "course_id": "CSC067",
                "description": "Research and outline Assignment 1",
                "is_completed": false,
                "reward_points": 10,
                "scheduled_end_at": "2025-09-05T12:00:00",
                "scheduled_start_at": "2025-09-05T09:00:00",
                "task_id": "27b4aff0-2003-4620-a202-f12e2dfa7e9b",
                "type": "assignment",
                "user_id": "paul_paw_test"
              },
              {
                "assignment_id": "5ae91363-a9cc-4d67-a3d2-52def8772ade",
                "course_id": "CSC067",
                "description": "Draft main content for Assignment 1",
                "is_completed": false,
                "reward_points": 10,
                "scheduled_end_at": "2025-09-15T15:00:00",
                "scheduled_start_at": "2025-09-15T09:00:00",
                "task_id": "ef75a0a8-a9d3-4054-9db6-70869b1fa07b",
                "type": "assignment",
                "user_id": "paul_paw_test"
              },
              {
                "assignment_id": "5ae91363-a9cc-4d67-a3d2-52def8772ade",
                "course_id": "CSC067",
                "description": "Review, edit, and finalize Assignment 1",
                "is_completed": false,
                "reward_points": 10,
                "scheduled_end_at": "2025-09-28T16:00:00",
                "scheduled_start_at": "2025-09-28T13:00:00",
                "task_id": "66962790-6f69-4141-8d5e-3158aaf6f9a2",
                "type": "assignment",
                "user_id": "paul_paw_test"
              }
            ]
          },
          {
            "assignment_id": "4bf2f2d0-419d-4734-b1e9-c453d1cf622f",
            "completion_points": 200,
            "course_id": "CSC067",
            "due_date": "2025-11-10T23:59:00",
            "is_complete": false,
            "title": "Assignment 2",
            "micro_tasks": [
              {
                "assignment_id": "4bf2f2d0-419d-4734-b1e9-c453d1cf622f",
                "course_id": "CSC067",
                "description": "Review Assignment 2 Requirements and Outline",
                "is_completed": false,
                "reward_points": 10,
                "scheduled_end_at": "2025-10-05T12:00:00",
                "scheduled_start_at": "2025-10-05T10:00:00",
                "task_id": "78dd39ef-dd08-49ab-9def-1d8ef791a48d",
                "type": "assignment",
                "user_id": "paul_paw_test"
              },
              {
                "assignment_id": "4bf2f2d0-419d-4734-b1e9-c453d1cf622f",
                "course_id": "CSC067",
                "description": "Draft Core Content for Assignment 2",
                "is_completed": false,
                "reward_points": 10,
                "scheduled_end_at": "2025-10-20T14:00:00",
                "scheduled_start_at": "2025-10-20T09:00:00",
                "task_id": "a6edd896-a716-46bd-a21f-b1a9b5cf3737",
                "type": "assignment",
                "user_id": "paul_paw_test"
              },
              {
                "assignment_id": "4bf2f2d0-419d-4734-b1e9-c453d1cf622f",
                "course_id": "CSC067",
                "description": "Final Review and Submission Preparation for Assignment 2",
                "is_completed": false,
                "reward_points": 10,
                "scheduled_end_at": "2025-11-05T17:00:00",
                "scheduled_start_at": "2025-11-05T15:00:00",
                "task_id": "afefa60f-e49f-4765-9519-16eb33c2a329",
                "type": "assignment",
                "user_id": "paul_paw_test"
              }
            ]
          }
        ],
        "assignments_found": 2,
        "course_id": "CSC067",
        "status": "success",
        "tasks": [
          {
            "course_id": "CSC067",
            "description": "Midterm Exam",
            "is_completed": false,
            "reward_points": 25,
            "scheduled_end_at": "2025-10-17T20:00:00",
            "scheduled_start_at": "2025-10-17T18:00:00",
            "task_id": "46645429-8a28-4d2c-bfa1-32390b220c5e",
            "type": "exam",
            "user_id": "paul_paw_test"
          },
          {
            "course_id": "CSC067",
            "description": "Final Exam",
            "is_completed": false,
            "reward_points": 35,
            "scheduled_end_at": "2025-12-19T17:00:00",
            "scheduled_start_at": "2025-12-19T14:00:00",
            "task_id": "26277304-92a5-4872-9875-d6bfc4d20a54",
            "type": "exam",
            "user_id": "paul_paw_test"
          }
        ],
        "tasks_found": 3,
        "total_micro_tasks": 6
      } as SyllabiResult;

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setResult(mockResult);

      // Original API call (commented out for testing)
      // const result = await processSyllabus(selectedFile, selectedCourseId, busyIntervals);
      // setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process syllabus');
    } finally {
      setIsUploading(false);
    }
  };

  const selectedCourse = courses.find(c => c.course_id === selectedCourseId);

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <span className="text-4xl">📄</span>
          Upload Syllabus
        </h1>
        <p className="text-gray-600 text-lg">
          Upload a course syllabus PDF to automatically extract assignments and generate micro-tasks.
        </p>
      </div>

      {/* Upload Form */}
      <div className="mb-8">
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
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{result.assignments_found}</p>
              <p className="text-sm text-blue-700">Assignments</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{result.tasks_found}</p>
              <p className="text-sm text-green-700">Exams/Quizzes</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-purple-600">{result.total_micro_tasks}</p>
              <p className="text-sm text-purple-700">Micro-tasks</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-orange-600">
                {result.assignments_found + result.tasks_found + result.total_micro_tasks}
              </p>
              <p className="text-sm text-orange-700">Total Items</p>
            </div>
          </div>

          <hr className="my-6" />

          {/* Extracted Tasks Section - Combined */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              📝 Extracted Tasks
            </h3>
            <p className="text-gray-600 mb-6">
              Review the tasks extracted from your syllabus. You can manually create these tasks using the Add Task page.
            </p>

            {/* Standalone Tasks Section */}
            {result.tasks.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-4">🕐 tests ({result.tasks.length} total)</h4>
                <TaskContainer 
                  tasks={result.tasks}
                  userId={userId}
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
                        {/* Assignment Header */}
                        <div className="mb-4">
                          <AssignmentProgressContainer
                            assignments={[assignment]}
                            color="blue"
                          />
                        </div>
                        
                        {/* Assignment Micro-tasks */}
                        <div>
                          <h5 className="text-md font-semibold text-gray-700 mb-3 text-center">
                            Micro-tasks ({assignmentTasks.length} total)
                          </h5>
                          
                          {assignmentTasks.length > 0 ? (
                            <div className="space-y-2">
                              <TaskContainer 
                                tasks={assignmentTasks}
                                userId={userId}
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

            {/* Help text */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6"> 
              <p className="text-blue-700 text-sm">
                💡 To add these tasks to your schedule, visit the <strong>Add Task</strong> page and create them manually with the details shown above.
              </p>
            </div>

            {/* Actions */}
            <div className="text-center pt-4 border-t">
              <button 
                onClick={() => {setResult(null); setSelectedFile(null); setSelectedCourseId('');}}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-colors"
              >
                Process Another Syllabus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadSyllabi;
                     