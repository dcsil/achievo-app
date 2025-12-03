import React, { useState } from 'react';
import { OnboardingStepProps } from '../index';
import { TimetableProcessResult, timetableApiService } from '../../../api-contexts/timetable-context';
import { tasksApiService } from '../../../api-contexts/add-tasks';
import { addCoursesApiService } from '../../../api-contexts/add-courses';
import PdfUploadForm from '../../../components/pdf-upload';
import MultipleTaskContainer from '../../../components/multiple-task-container';
import CourseContainer from '../../../components/course-container';
import Button from '../../../components/skip-button';

const WelcomeStep: React.FC<OnboardingStepProps> = ({ onNext }) => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>('2025 Fall');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<TimetableProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
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

    if (!selectedTerm) {
      setError('Please select a term');
      return;
    }

    setIsUploading(true);
    setError('');
    setResult(null);
    setSaveSuccess(false);

    try {
      const response = await timetableApiService.processTimetable(file, userId, selectedTerm);
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
      await addCoursesApiService.bulkCreateCourses(result.courses);
      
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
        } catch (taskError) {
          console.warn('Failed to create task:', taskError);
        }
      }

      setSaveSuccess(true);

    } catch (saveError) {
      setError(`Failed to save to dashboard: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to group tasks by date
  const groupTasksByDate = (tasks: any[]) => {
    const grouped: { [date: string]: any[] } = {};
    
    tasks.forEach(task => {
      const dateKey = new Date(task.scheduled_start_at).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    });
    
    const sortedDates = Object.keys(grouped).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
    
    return sortedDates.map(date => ({
      date,
      tasks: grouped[date]
    }));
  };

  const handleNext = () => {
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Welcome to Achievo! Let's get started by uploading timetable
        </h1>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        {/* Term Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Academic Term
          </label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="2025 Fall">Fall 2025</option>
            <option value="2026 Winter">Winter 2026</option>
          </select>
        </div>

        <PdfUploadForm
          courses={[]}
          selectedCourseId=""
          onCourseChange={() => {}}
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

          {/* Courses with Tasks Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📚 Courses & Generated Tasks</h3>
            <div className="space-y-6">
              {result.courses.map((course) => {
                const courseTasks = result.tasks.filter(task => task.course_id === course.course_id);
                const groupedTasks = groupTasksByDate(courseTasks);
                
                return (
                  <div key={course.course_id} className="border border-gray-200 rounded-lg p-4">
                    {/* Course Header - Use proper CourseContainer */}
                    <div className="mb-4">
                      <CourseContainer
                        name={course.course_name}
                        courseId={course.course_id}
                        color={course.color}
                        refreshKey={0}
                      />
                    </div>
                    
                    {/* Course Tasks by Date - Use proper MultipleTaskContainer */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-700 mb-3 text-center">
                        Generated Tasks ({courseTasks.length} total)
                      </h4>
                      
                      {groupedTasks.length > 0 ? (
                        <div className="space-y-4">
                          {groupedTasks.map(({ date, tasks: dateTasks }) => {
                            const displayTasks = dateTasks.slice(0, 5);
                            
                            return (
                              <div key={`${course.course_id}-${date}`} className="space-y-2">
                                <MultipleTaskContainer 
                                  tasks={displayTasks}
                                  userId={userId}
                                  onTaskCompleted={() => {}}
                                  onRefreshData={() => {}}
                                  showCompleteButton={false}
                                  dateString={date}
                                  timeAdjustment={false}

                                />
                              </div>
                            );
                          })}
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

      {/* Navigation */}
      <div className="text-center mt-8">
        
        <div className="flex gap-4 justify-center mb-8">
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

          <Button
            onClick={handleNext}
            variant={saveSuccess ? "primary" : "secondary"}
            className="px-8 py-3"
          >
            {saveSuccess ? 'Continue' : 'Skip'}
          </Button>
        </div>
        
        {saveSuccess && (
            <div className="bg-green-100 p-3 rounded-lg mb-4">
                <p className="text-green-800 font-medium">✅ Timetable saved successfully!</p>
                <p className="text-green-600 text-sm">Your courses and tasks are now available in your dashboard</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeStep;