import React, { useState } from 'react';
import { TimetableProcessResult, timetableApiService } from '../../api-contexts/timetable-context';
import { tasksApiService } from '../../api-contexts/add-tasks';
import { addCoursesApiService } from '../../api-contexts/add-courses';
import { User } from '../../api-contexts/user-context';
import TaskContainer from '../../components/task-container';
import CourseContainer from '../../components/course-container';
import PdfUploadForm from '../../components/pdf-upload';

interface UploadTimetableProps {
  user?: User | null;
  userId?: string;
}

const UploadTimetable: React.FC<UploadTimetableProps> = ({ user, userId = 'paul_paw_test' }) => {
  // Use the exported service instead of context
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<TimetableProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);
    setSaveSuccess(false);

    try {
      // Use the exported service directly
      const response = await timetableApiService.processTimetable(file);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process timetable');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveToDashboard = async () => {
    if (!result) return;

    setIsSaving(true);
    setError(null);

    try {
      // Save courses first using the add courses API service
      const courseResults = await addCoursesApiService.bulkCreateCourses(result.courses);
      
      // Save tasks using the tasks API service
      let tasksCreated = 0;
      const taskErrors: string[] = [];
      
      for (const task of result.tasks) {
        try {
          await tasksApiService.createTask({
            task_id: task.task_id,
            user_id: task.user_id,
            description: task.description,
            type: task.type,
            assignment_id: task.assignment_id,
            course_id: task.course_id,
            scheduled_start_at: task.scheduled_start_at,
            scheduled_end_at: task.scheduled_end_at,
            reward_points: task.reward_points
          });
          tasksCreated++;
        } catch (taskError) {
          const errorMessage = taskError instanceof Error ? taskError.message : 'Unknown error';
          taskErrors.push(`Task creation failed: ${errorMessage}`);
          console.warn('Failed to create task:', taskError);
        }
      }

      setSaveSuccess(true);
      
      // Log any errors for debugging
      if (courseResults.errors.length > 0) {
        console.warn('Course creation errors:', courseResults.errors);
      }
      if (taskErrors.length > 0) {
        console.warn('Task creation errors:', taskErrors);
      }

      // Show success message with summary
      console.log(`✅ Save completed: ${courseResults.created} courses, ${tasksCreated} tasks created`);

    } catch (saveError) {
      setError(`Failed to save to dashboard: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📅 Upload Timetable</h1>
        <p className="text-gray-600">Upload your PDF timetable to automatically extract courses and generate class session tasks</p>
      </div>

      {/* Upload Section */}
      <div className="mb-6">
        <PdfUploadForm
          courses={[]} // Timetable doesn't need course selection
          selectedCourseId=""
          onCourseChange={() => {}} // No-op since no course selection needed
          selectedFile={file}
          onFileSelect={handleFileChange}
          onUpload={handleUpload}
          isUploading={isUploading}
          error={error || ''}
          uploadButtonText="🚀 Process Timetable"
          title="Upload PDF Timetable"
          subtitle="Upload your PDF timetable to automatically extract courses and generate class session tasks"
        />
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Success Summary */}
          <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-2">✅ Processing Complete!</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{result.courses_found}</div>
                <div className="text-sm">Courses Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{result.tasks_generated}</div>
                <div className="text-sm">Tasks Generated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{result.config?.term || 'N/A'}</div>
                <div className="text-sm">Term</div>
              </div>
            </div>
          </div>

          {/* Save Confirmation */}
          {!saveSuccess && (
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-blue-800 mb-3">📋 Review & Confirm</h3>
              <p className="text-blue-700 mb-4">
                Please review the extracted courses and generated tasks below. When you're ready, click "Save to Dashboard" to add them to your account.
              </p>
              <button
                onClick={handleSaveToDashboard}
                disabled={isSaving}
                className={`px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold transition-colors ${
                  isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
              >
                {isSaving ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Saving to Dashboard...
                  </>
                ) : (
                  '💾 Save to Dashboard'
                )}
              </button>
            </div>
          )}

          {/* Save Success */}
          {saveSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-2xl">
              <h3 className="text-lg font-bold mb-2">🎉 Successfully Saved!</h3>
              <p>All courses and tasks have been saved to your dashboard. You can now view them in your home page.</p>
            </div>
          )}

          {/* Courses with Tasks Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📚 Courses & Generated Tasks</h3>
            <div className="space-y-6">
              {result.courses.map((course) => {
                const courseTasks = result.tasks.filter(task => task.course_id === course.course_id);
                const displayTasks = courseTasks.slice(0, 5); // Show first 5 tasks per course
                
                return (
                  <div key={course.course_id} className="border border-gray-200 rounded-lg p-4">
                    {/* Course Header */}
                    <div className="mb-4">
                      <CourseContainer
                        name={course.course_name}
                        courseId={course.course_id}
                        color="blue"
                        refreshKey={0}
                      />
                    </div>
                    
                    {/* Course Tasks */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-700 mb-3 text-center">
                        Generated Tasks ({courseTasks.length} total)
                      </h4>
                      
                      {displayTasks.length > 0 ? (
                        <div className="space-y-2">
                          <TaskContainer 
                            tasks={displayTasks}
                            userId={userId}
                            onTaskCompleted={() => {}}
                            onTasksUpdate={() => {}}
                          />
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm text-center">No tasks generated for this course</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default UploadTimetable;
          