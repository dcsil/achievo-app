import React, { useState, useEffect } from 'react';
import { tasksApiService, Task } from '../../api-contexts/add-tasks';
import { apiService, User } from '../../api-contexts/user-context';
import { getCourses, CourseForUI } from '../../api-contexts/get-courses';
import { getAssignments, Assignment } from '../../api-contexts/get-assignments';

// Updated task types with proper categories
const TASK_TYPES = [
  { value: 'assignment', label: '📝 Assignment/Tutorial/Quiz', description: 'Academic assignment or homework', defaultPoints: 30 },
  { value: 'study', label: '📚 Study/Review Session', description: 'Study time for exams or review', defaultPoints: 30 },
  { value: 'reading', label: '📖 Required Reading', description: 'Required or supplemental reading', defaultPoints: 30 },
  { value: 'exercise', label: '💪 Exercise', description: 'Physical activity or workout', defaultPoints: 30 },
  { value: 'break', label: '⏸️ Break', description: 'Short break or relaxation time', defaultPoints: 10 },
  { value: 'personal', label: '🏠 Personal', description: 'Personal or household task', defaultPoints: 10 },
  { value: 'class', label: '🏫 Class', description: 'Class-related task', defaultPoints: 30 },
  { value: 'other', label: '📌 Other', description: 'Any other type of task', defaultPoints: 10 },
];

type TaskType = 'assignment' | 'study' | 'reading' | 'exercise' | 'break' | 'personal' | 'class' | 'other';

interface AddTaskComponentProps {
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AddTaskComponent: React.FC<AddTaskComponentProps> = ({ userId, onSuccess, onCancel }) => {
  const [courses, setCourses] = useState<CourseForUI[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  const [formData, setFormData] = useState({
    description: '',
    type: 'study' as TaskType,
    course_id: '',
    assignment_id: '',
    scheduled_start_date: '',
    scheduled_start_time: '',
    scheduled_end_date: '',
    scheduled_end_time: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadCourses();
    }
  }, [userId]);

  // Load assignments when a course is selected
  useEffect(() => {
    if (formData.course_id) {
      loadAssignments(formData.course_id);
    } else {
      setAssignments([]);
      setFormData(prev => ({ ...prev, assignment_id: '' }));
    }
  }, [formData.course_id]);

  const loadCourses = async () => {
    try {
      const coursesData = await getCourses(userId);
      setCourses(coursesData);
    } catch (err) {
      console.error('Error loading courses:', err);
    }
  };

  const loadAssignments = async (courseId: string) => {
    try {
      const assignmentsData = await getAssignments(courseId, userId);
      setAssignments(assignmentsData);
    } catch (err) {
      console.error('Error loading assignments:', err);
      setAssignments([]); // Set empty array on error
    }
  };

  const handleQuickTemplate = (template: 'pomodoro' | 'reading' | 'workout' | 'deep-work') => {
    const now = new Date();
    // Add 10 minutes buffer and round up to nearest 5 minutes
    now.setMinutes(now.getMinutes() + 10);
    const minutes = Math.ceil(now.getMinutes() / 5) * 5;
    now.setMinutes(minutes);
    now.setSeconds(0);
    
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    switch (template) {
      case 'pomodoro':
        setFormData(prev => ({
          ...prev,
          type: 'study',
          description: 'Pomodoro Study Session (25 min work + 5 min break)',
          scheduled_start_date: dateStr,
          scheduled_start_time: timeStr,
          scheduled_end_date: dateStr,
          scheduled_end_time: addMinutes(timeStr, 30),
        }));
        break;
      case 'reading':
        setFormData(prev => ({
          ...prev,
          type: 'reading',
          description: '1-hour reading session',
          scheduled_start_date: dateStr,
          scheduled_start_time: timeStr,
          scheduled_end_date: dateStr,
          scheduled_end_time: addHours(timeStr, 1),
        }));
        break;
      case 'workout':
        setFormData(prev => ({
          ...prev,
          type: 'exercise',
          description: '30-minute workout',
          scheduled_start_date: dateStr,
          scheduled_start_time: timeStr,
          scheduled_end_date: dateStr,
          scheduled_end_time: addMinutes(timeStr, 30),
        }));
        break;
      case 'deep-work':
        setFormData(prev => ({
          ...prev,
          type: 'study',
          description: '2-hour deep work session',
          scheduled_start_date: dateStr,
          scheduled_start_time: timeStr,
          scheduled_end_date: dateStr,
          scheduled_end_time: addHours(timeStr, 2),
        }));
        break;
    }
  };

  const getTodayDate = (): string => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const getCurrentTime = (): string => {
    const now = new Date();
    // Add 10 minute buffer and round up to nearest 5 minutes
    now.setMinutes(now.getMinutes() + 10);
    const minutes = Math.ceil(now.getMinutes() / 5) * 5;
    now.setMinutes(minutes);
    now.setSeconds(0);
    return now.toTimeString().split(' ')[0].substring(0, 5);
  };

  const getMinStartTime = (): string => {
    // If start date is today, minimum time is current time + buffer
    const today = getTodayDate();
    if (formData.scheduled_start_date === today) {
      return getCurrentTime();
    }
    return ''; // No minimum for future dates
  };

  const addHours = (time: string, hours: number): string => {
    const [h, m] = time.split(':').map(Number);
    const newHours = (h + hours) % 24;
    return `${String(newHours).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const addMinutes = (time: string, minutes: number): string => {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  };

  const getMinEndTime = (): string => {
    if (formData.scheduled_start_date && formData.scheduled_start_time) {
      if (formData.scheduled_start_date === formData.scheduled_end_date) {
        return formData.scheduled_start_time;
      }
    }
    return '';
  };

  const validateEndTime = (): boolean => {
    if (!formData.scheduled_start_date || !formData.scheduled_start_time || 
        !formData.scheduled_end_date || !formData.scheduled_end_time) {
      return true;
    }

    const startDateTime = new Date(`${formData.scheduled_start_date}T${formData.scheduled_start_time}`);
    const endDateTime = new Date(`${formData.scheduled_end_date}T${formData.scheduled_end_time}`);
    const now = new Date();
    // Add 5 minute grace period for validation
    now.setMinutes(now.getMinutes() + 5);

    // Check if start time is in the past (with grace period)
    if (startDateTime < now) {
      setError('Start time must be at least 5 minutes in the future');
      return false;
    }

    if (endDateTime <= startDateTime) {
      setError('End time must be after start time');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEndTime()) {
      return;
    }

    setLoading(true);

    try {
    
      const taskData: Omit<Task, 'is_completed'> = {
        task_id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        description: formData.description,
        type: formData.type,
        reward_points: selectedTaskType?.defaultPoints || 10,
        scheduled_start_at: formData.scheduled_start_date && formData.scheduled_start_time
          ? `${formData.scheduled_start_date}T${formData.scheduled_start_time}:00`
          : undefined,
        scheduled_end_at: formData.scheduled_end_date && formData.scheduled_end_time
          ? `${formData.scheduled_end_date}T${formData.scheduled_end_time}:00`
          : undefined,
      };

      // Add course if selected
      if (formData.course_id) {
        taskData.course_id = formData.course_id;
      }

      // Add assignment if selected
      if (formData.assignment_id) {
        taskData.assignment_id = formData.assignment_id;
      }

      await tasksApiService.createTask(taskData);
      
      // Reset form
      setFormData({
        description: '',
        type: 'study',
        course_id: '',
        assignment_id: '',
        scheduled_start_date: '',
        scheduled_start_time: '',
        scheduled_end_date: '',
        scheduled_end_time: '',
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const selectedTaskType = TASK_TYPES.find(t => t.value === formData.type);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Add New Task</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Quick Templates */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3 text-gray-700">Quick Templates</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickTemplate('pomodoro')}
            className="px-4 py-3 bg-gradient-to-br from-red-50 to-red-100 text-red-700 rounded-lg hover:from-red-100 hover:to-red-200 transition-all text-left border border-red-200"
          >
            <div className="font-semibold">🍅 Pomodoro</div>
            <div className="text-xs opacity-75">25 min + 5 min break</div>
          </button>
          <button
            type="button"
            onClick={() => handleQuickTemplate('deep-work')}
            className="px-4 py-3 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all text-left border border-blue-200"
          >
            <div className="font-semibold">🎯 Deep Work</div>
            <div className="text-xs opacity-75">2-hour focus session</div>
          </button>
          <button
            type="button"
            onClick={() => handleQuickTemplate('reading')}
            className="px-4 py-3 bg-gradient-to-br from-green-50 to-green-100 text-green-700 rounded-lg hover:from-green-100 hover:to-green-200 transition-all text-left border border-green-200"
          >
            <div className="font-semibold">📖 Reading</div>
            <div className="text-xs opacity-75">1-hour reading session</div>
          </button>
          <button
            type="button"
            onClick={() => handleQuickTemplate('workout')}
            className="px-4 py-3 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all text-left border border-purple-200"
          >
            <div className="font-semibold">💪 Workout</div>
            <div className="text-xs opacity-75">30-minute exercise</div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Task Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Task Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as TaskType })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            {TASK_TYPES.map((taskType) => (
              <option key={taskType.value} value={taskType.value}>
                {taskType.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter task description"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Course Selection (Optional) */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Course <span className="text-gray-400 text-xs">(Optional)</span>
          </label>
          <select
            value={formData.course_id}
            onChange={(e) => setFormData({ ...formData, course_id: e.target.value, assignment_id: '' })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">No course</option>
            {courses.map((course) => (
              <option key={course.course_id} value={course.course_id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assignment Selection (Shows when course is selected) */}
        {formData.course_id && (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Link to Assignment <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            {assignments.length > 0 ? (
              <>
                <select
                  value={formData.assignment_id}
                  onChange={(e) => setFormData({ ...formData, assignment_id: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No assignment</option>
                  {assignments.map((assignment) => (
                    <option key={assignment.assignment_id} value={assignment.assignment_id}>
                      {assignment.title}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  This task will be linked to the selected assignment
                </p>
              </>
            ) : (
              <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                No assignments found for this course
              </div>
            )}
          </div>
        )}

        {/* Start Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Start Date</label>
            <input
              type="date"
              value={formData.scheduled_start_date}
              onChange={(e) => setFormData({ ...formData, scheduled_start_date: e.target.value })}
              min={getTodayDate()}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Start Time</label>
            <input
              type="time"
              value={formData.scheduled_start_time}
              onChange={(e) => setFormData({ ...formData, scheduled_start_time: e.target.value })}
              min={getMinStartTime()}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* End Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">End Date</label>
            <input
              type="date"
              value={formData.scheduled_end_date}
              onChange={(e) => setFormData({ ...formData, scheduled_end_date: e.target.value })}
              min={formData.scheduled_start_date}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">End Time</label>
            <input
              type="time"
              value={formData.scheduled_end_time}
              onChange={(e) => setFormData({ ...formData, scheduled_end_time: e.target.value })}
              min={getMinEndTime()}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};