import React, { useState, useEffect } from 'react';
import { assignmentsApiService, Assignment } from '../../api-contexts/add-assignments';
import { getCourses, CourseForUI } from '../../api-contexts/get-courses';

interface AddAssignmentComponentProps {
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AddAssignmentComponent: React.FC<AddAssignmentComponentProps> = ({ userId, onSuccess, onCancel }) => {
  const [courses, setCourses] = useState<CourseForUI[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    course_id: '',
    due_date: '',
    due_time: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadCourses();
    }
  }, [userId]);

  const loadCourses = async () => {
    try {
      const coursesData = await getCourses(userId);
      setCourses(coursesData);
    } catch (err) {
      console.error('Error loading courses:', err);
    }
  };

  const handleQuickDueDate = (daysFromNow: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    const dateStr = date.toISOString().split('T')[0];
    
    // Set time to end of day (11:59 PM) for future dates
    setFormData(prev => ({
      ...prev,
      due_date: dateStr,
      due_time: '23:59',
    }));
  };

  const getTodayDate = (): string => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const getCurrentTime = (): string => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);
    const minutes = Math.ceil(now.getMinutes() / 5) * 5;
    now.setMinutes(minutes);
    now.setSeconds(0);
    return now.toTimeString().split(' ')[0].substring(0, 5);
  };

  const getMinDueTime = (): string => {
    const today = getTodayDate();
    if (formData.due_date === today) {
      return getCurrentTime();
    }
    return '';
  };

  const validateDueDate = (): boolean => {
    if (!formData.due_date || !formData.due_time) {
      return true;
    }

    const dueDateTime = new Date(`${formData.due_date}T${formData.due_time}`);
    const now = new Date();
    // Add 5 minute grace period for validation - gives users time to fill out the form
    now.setMinutes(now.getMinutes() + 5);

    if (dueDateTime < now) {
      setError('Due date and time must be at least 5 minutes in the future');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateDueDate()) {
      return;
    }

    setLoading(true);

    try {
      const assignmentData: Omit<Assignment, 'is_complete' | 'completion_points'> = {
        assignment_id: `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        course_id: formData.course_id,
        title: formData.title,
        due_date: formData.due_time 
          ? `${formData.due_date}T${formData.due_time}:00`
          : `${formData.due_date}T23:59:00`,
      };

      await assignmentsApiService.createAssignment(assignmentData);
      
      // Reset form
      setFormData({
        title: '',
        course_id: '',
        due_date: '',
        due_time: '',
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Add New Assignment</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Quick Due Date Templates */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3 text-gray-700">Quick Due Dates</h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDueDate(7)}
            className="px-4 py-3 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all border border-blue-200"
          >
            <div className="font-semibold">📅 1 Week</div>
            <div className="text-xs opacity-75 mt-1">7 days</div>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDueDate(14)}
            className="px-4 py-3 bg-gradient-to-br from-green-50 to-green-100 text-green-700 rounded-lg hover:from-green-100 hover:to-green-200 transition-all border border-green-200"
          >
            <div className="font-semibold">📅 2 Weeks</div>
            <div className="text-xs opacity-75 mt-1">14 days</div>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDueDate(30)}
            className="px-4 py-3 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all border border-purple-200"
          >
            <div className="font-semibold">📅 1 Month</div>
            <div className="text-xs opacity-75 mt-1">30 days</div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Assignment Title */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Assignment Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Essay on Climate Change"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Course Selection */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Course</label>
          <select
            value={formData.course_id}
            onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.course_id} value={course.course_id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* Due Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              min={getTodayDate()}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Due Time</label>
            <input
              type="time"
              value={formData.due_time}
              onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
              min={getMinDueTime()}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Default: 11:59 PM</p>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Creating...' : 'Create Assignment'}
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