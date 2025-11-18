import React, { useState, useEffect } from 'react';
import { tasksApiService } from '../../api-contexts/add-tasks';
import { User } from '../../api-contexts/user-context';
import { v4 as uuidv4 } from 'uuid';

interface AddTaskProps {
  user?: User | null;
  userId?: string;
}

// Mock courses data - you can replace this with actual API call
const MOCK_COURSES = [
  { course_id: 'csc491', name: 'CSC 491', color: 'blue' },
  { course_id: 'math205', name: 'Math 205', color: 'green' },
  { course_id: 'eng101', name: 'English 101', color: 'purple' },
  { course_id: 'personal', name: 'Personal', color: 'orange' },
];

const TASK_TYPES = [
  { value: 'assignment', label: '📝 Assignment', description: 'Academic assignment or homework', defaultPoints: 25 },
  { value: 'study', label: '📚 Study Session', description: 'Study time for exams or review', defaultPoints: 15 },
  { value: 'project', label: '🚀 Project Work', description: 'Work on a larger project', defaultPoints: 50 },
  { value: 'reading', label: '📖 Reading', description: 'Required or supplemental reading', defaultPoints: 10 },
  { value: 'exercise', label: '💪 Exercise', description: 'Physical activity or workout', defaultPoints: 20 },
  { value: 'personal', label: '🏠 Personal Task', description: 'Personal or household task', defaultPoints: 5 },
  { value: 'other', label: '📌 Other', description: 'Any other type of task', defaultPoints: 10 },
];

// Quick task templates
const QUICK_TEMPLATES = [
  { name: '📚 Study for Exam', type: 'study', description: 'Review materials and practice problems for upcoming exam', points: 30, duration: 2 },
  { name: '📝 Complete Assignment', type: 'assignment', description: 'Work on and submit class assignment', points: 25, duration: 3 },
  { name: '📖 Read Chapter', type: 'reading', description: 'Read assigned chapter and take notes', points: 15, duration: 1 },
  { name: '💪 Workout', type: 'exercise', description: '30-minute workout session', points: 20, duration: 0.5 },
];

const AddTask: React.FC<AddTaskProps> = ({ user, userId = 'paul_paw_test' }) => {
  const [formData, setFormData] = useState({
    description: '',
    type: '',
    course_id: '',
    assignment_id: '',
    scheduled_start_at: '',
    scheduled_end_at: '',
    reward_points: 10,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Set default dates (today and tomorrow)
  useEffect(() => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    setFormData(prev => ({
      ...prev,
      scheduled_start_at: now.toISOString().slice(0, 16),
      scheduled_end_at: tomorrow.toISOString().slice(0, 16),
    }));
  }, []);

  // Auto-dismiss success messages
  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Task description is required';
    } else if (formData.description.length < 5) {
      newErrors.description = 'Description must be at least 5 characters';
    }

    if (!formData.type) {
      newErrors.type = 'Task type is required';
    }

    if (formData.reward_points < 0) {
      newErrors.reward_points = 'Points cannot be negative';
    } else if (formData.reward_points > 1000) {
      newErrors.reward_points = 'Points cannot exceed 1000';
    }

    if (formData.scheduled_start_at && formData.scheduled_end_at) {
      const startDate = new Date(formData.scheduled_start_at);
      const endDate = new Date(formData.scheduled_end_at);
      
      if (startDate >= endDate) {
        newErrors.scheduled_end_at = 'Due date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'reward_points' ? parseInt(value) || 0 : value,
    }));

    // Auto-set points based on task type
    if (name === 'type' && value) {
      const taskType = TASK_TYPES.find(t => t.value === value);
      if (taskType) {
        setFormData(prev => ({
          ...prev,
          reward_points: taskType.defaultPoints,
        }));
      }
    }

    // Clear errors as user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleTemplateSelect = (template: typeof QUICK_TEMPLATES[0]) => {
    const now = new Date();
    const endTime = new Date(now.getTime() + template.duration * 60 * 60 * 1000);

    setFormData(prev => ({
      ...prev,
      description: template.description,
      type: template.type,
      reward_points: template.points,
      scheduled_start_at: now.toISOString().slice(0, 16),
      scheduled_end_at: endTime.toISOString().slice(0, 16),
    }));

    setShowTemplates(false);
    setMessage({ type: 'success', text: `Template "${template.name}" applied! 📋` });
  };

  const resetForm = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    setFormData({
      description: '',
      type: '',
      course_id: '',
      assignment_id: '',
      scheduled_start_at: now.toISOString().slice(0, 16),
      scheduled_end_at: tomorrow.toISOString().slice(0, 16),
      reward_points: 10,
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please fix the errors below.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const taskData = {
        task_id: uuidv4(),
        user_id: userId,
        description: formData.description.trim(),
        type: formData.type,
        course_id: formData.course_id || undefined,
        assignment_id: formData.assignment_id || undefined,
        scheduled_start_at: formData.scheduled_start_at || undefined,
        scheduled_end_at: formData.scheduled_end_at || undefined,
        reward_points: formData.reward_points,
      };

      const response = await tasksApiService.createTask(taskData);

      // create notification for reminder at scheduled at time
      // if task is personal, add notification for scheduled start time
      if (formData.type === 'personal' && formData.scheduled_start_at) {
        const notifId = `personal-${response.task_id}`;
        const startTime = new Date(formData.scheduled_start_at).getTime();
        const now = Date.now();
        
        // Only create alarm if the scheduled time is in the future
        if (startTime > now) {
          try {
            chrome.alarms.create(notifId, { when: startTime });
            console.log(`Alarm created for task ${response.task_id} at ${new Date(startTime)}`);
            
            // Show confirmation that reminder is set
            setMessage({
              type: 'success',
              text: `Task created successfully! 🎉 Reminder set for ${new Date(startTime).toLocaleString()}`
            });
          } catch (error) {
            console.error('Failed to create alarm:', error);
            setMessage({
              type: 'success',
              text: `Task created successfully! ⚠️ Could not set reminder - please check extension permissions.`
            });
          }
        } else {
          // If scheduled time is in the past, show warning
          setMessage({
            type: 'success',
            text: `Task created successfully! ⚠️ Note: Scheduled time is in the past, no reminder set.`
          });
        }
      } else {
        // For non-personal tasks, show standard success message
        setMessage({
          type: 'success',
          text: `Task created successfully! 🎉 Task ID: ${response.task_id.slice(0, 8)}...`
        });
      }
      
      resetForm();

    } catch (error) {
      console.error('Failed to create task:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to create task. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedCourse = () => {
    return MOCK_COURSES.find(c => c.course_id === formData.course_id);
  };

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">➕ Add New Task</h1>
        <p className="text-gray-600">Create a new task to stay organized and earn points</p>
      </div>

      {/* Quick Templates Toggle */}
      <div className="mb-6 flex justify-between items-center">
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
        >
          <span>⚡</span>
          {showTemplates ? 'Hide Templates' : 'Quick Templates'}
        </button>
        
        {formData.description && (
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            🔄 Reset Form
          </button>
        )}
      </div>

      {/* Quick Templates */}
      {showTemplates && (
        <div className="mb-6 bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">⚡ Quick Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {QUICK_TEMPLATES.map((template, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleTemplateSelect(template)}
                className="p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 hover:shadow-sm transition-all text-left"
              >
                <div className="font-medium text-blue-800">{template.name}</div>
                <div className="text-sm text-blue-600 mt-1">{template.description}</div>
                <div className="text-xs text-blue-500 mt-2">
                  🪙 {template.points} points • ⏱️ {template.duration}h
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-2 text-current opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Task Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 ${
                errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              rows={3}
              placeholder="Describe what you need to do..."
              required
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {formData.description.length}/200 characters
            </p>
          </div>

          {/* Task Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Task Type *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 ${
                errors.type ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select a task type...</option>
              {TASK_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {formData.type && (
              <p className="text-sm text-gray-500 mt-1">
                {TASK_TYPES.find(t => t.value === formData.type)?.description}
              </p>
            )}
            {errors.type && (
              <p className="text-red-600 text-sm mt-1">{errors.type}</p>
            )}
          </div>

          {/* Course Selection */}
          <div>
            <label htmlFor="course_id" className="block text-sm font-medium text-gray-700 mb-2">
              Course (Optional)
            </label>
            <select
              id="course_id"
              name="course_id"
              value={formData.course_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">No course selected</option>
              {MOCK_COURSES.map((course) => (
                <option key={course.course_id} value={course.course_id}>
                  {course.name}
                </option>
              ))}
            </select>
            {getSelectedCourse() && (
              <div className="mt-2">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium text-white bg-${getSelectedCourse()?.color}-500`}>
                  {getSelectedCourse()?.name}
                </span>
              </div>
            )}
          </div>

          {/* Assignment ID */}
          <div>
            <label htmlFor="assignment_id" className="block text-sm font-medium text-gray-700 mb-2">
              Assignment ID (Optional)
            </label>
            <input
              type="text"
              id="assignment_id"
              name="assignment_id"
              value={formData.assignment_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              placeholder="e.g., assignment_123"
            />
            <p className="text-sm text-gray-500 mt-1">
              🔗 Link this task to a specific assignment for automatic completion tracking
            </p>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="scheduled_start_at" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                id="scheduled_start_at"
                name="scheduled_start_at"
                value={formData.scheduled_start_at}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="scheduled_end_at" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date & Time
              </label>
              <input
                type="datetime-local"
                id="scheduled_end_at"
                name="scheduled_end_at"
                value={formData.scheduled_end_at}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 ${
                  errors.scheduled_end_at ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.scheduled_end_at && (
                <p className="text-red-600 text-sm mt-1">{errors.scheduled_end_at}</p>
              )}
            </div>
          </div>

          {/* Reward Points */}
          <div>
            <label htmlFor="reward_points" className="block text-sm font-medium text-gray-700 mb-2">
              Reward Points
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                id="reward_points"
                name="reward_points"
                value={formData.reward_points}
                onChange={handleInputChange}
                min="0"
                max="1000"
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 ${
                  errors.reward_points ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              <div className="flex gap-2">
                {[5, 10, 25, 50].map(points => (
                  <button
                    key={points}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, reward_points: points }))}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      formData.reward_points === points
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {points}
                  </button>
                ))}
              </div>
            </div>
            {errors.reward_points && (
              <p className="text-red-600 text-sm mt-1">{errors.reward_points}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              🪙 Points you'll earn when completing this task (0-1000)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold shadow-lg transition-transform ${
                isSubmitting 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:scale-105'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Creating Task...
                </>
              ) : (
                '✨ Create Task'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="mt-6 bg-blue-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Tips for Creating Tasks</h3>
        <ul className="space-y-2 text-blue-700">
          <li>• Use quick templates for common tasks to save time</li>
          <li>• Be specific in your task description to make it easier to complete</li>
          <li>• Choose appropriate reward points based on task difficulty and time</li>
          <li>• Link tasks to assignments for automatic completion tracking</li>
          <li>• Set realistic due dates to maintain motivation</li>
          <li>• Different task types help organize your work and suggest point values</li>
        </ul>
      </div>
    </div>
  );
};

export default AddTask;