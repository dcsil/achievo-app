import React, { useState, useEffect } from 'react';
import { tasksApiService } from '../../api-contexts/add-tasks';
import { User } from '../../api-contexts/user-context';
import { getCourses, CourseForUI } from '../../api-contexts/get-courses';
import { getAssignments, getAllAssignments, Assignment } from '../../api-contexts/get-assignments';
import { v4 as uuidv4 } from 'uuid';

interface AddTaskProps {
  user?: User | null;
  userId?: string;
}

const TASK_TYPES = [
  { value: 'assignment', label: '📝 Assignment/Tutorial/Quiz', description: 'Academic assignment or homework', defaultPoints: 20 },
  { value: 'study', label: '📚 Study/Review Session', description: 'Study time for exams or review', defaultPoints: 15 },
  { value: 'reading', label: '📖 Required Reading', description: 'Required or supplemental reading', defaultPoints: 10 },
  { value: 'exercise', label: '💪 Exercise', description: 'Physical activity or workout', defaultPoints: 10 },
  { value: 'break', label: '⏸️ Break', description: 'Short break or relaxation time', defaultPoints: 5 },
  { value: 'personal', label: '🏠 Personal', description: 'Personal or household task', defaultPoints: 5 },
  { value: 'class', label: '🏫 Class', description: 'Class-related task', defaultPoints: 10 },
  { value: 'other', label: '📌 Other', description: 'Any other type of task', defaultPoints: 5 },
];

// Quick task templates
const QUICK_TEMPLATES = [
  { name: '📚 Study for Exam', type: 'study', description: 'Review materials and practice problems for upcoming exam', points: 15, duration: 2 },
  { name: '📝 Complete Assignment', type: 'assignment', description: 'Work on and submit class assignment', points: 20, duration: 3 },
  { name: '📖 Read Chapter', type: 'reading', description: 'Read assigned chapter and take notes', points: 10, duration: 1 },
  { name: '💪 Workout', type: 'exercise', description: '30-minute workout session', points: 10, duration: 0.5 },
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
  const [userCourses, setUserCourses] = useState<CourseForUI[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [showAssignmentDropdown, setShowAssignmentDropdown] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [courseSearch, setCourseSearch] = useState('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseForUI | null>(null);
  const [taskTypeSearch, setTaskTypeSearch] = useState('');
  const [showTaskTypeDropdown, setShowTaskTypeDropdown] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState<typeof TASK_TYPES[0] | null>(null);

  // Fetch user's courses for course selection
  useEffect(() => {
    const loadCourses = async () => {
      if (user?.user_id) {
        try {
          const courses = await getCourses(user.user_id);
          setUserCourses(courses);
        } catch (error) {
          console.error('Failed to load courses:', error);
          setUserCourses([]);
        }
      }
    };
    loadCourses();
  }, [user?.user_id]);

  // Fetch assignments based on selected course
  useEffect(() => {
    const loadAssignments = async () => {
      if (!user?.user_id) return;
      
      try {
        let fetchedAssignments: Assignment[];
        if (formData.course_id) {
          // Fetch assignments for the selected course
          fetchedAssignments = await getAssignments(formData.course_id, user.user_id);
        } else {
          // Fetch all assignments if no course is selected
          fetchedAssignments = await getAllAssignments(user.user_id);
        }
        setAssignments(fetchedAssignments);
      } catch (error) {
        console.error('Failed to load assignments:', error);
        setAssignments([]);
      }
    };
    
    loadAssignments();
  }, [formData.course_id, user?.user_id]);

  // Set default dates (today and tomorrow) in EST
  useEffect(() => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Convert to EST (UTC-5) by subtracting 5 hours
    const nowEST = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    const tomorrowEST = new Date(tomorrow.getTime() - 5 * 60 * 60 * 1000);

    setFormData(prev => ({
      ...prev,
      scheduled_start_at: nowEST.toISOString().slice(0, 16),
      scheduled_end_at: tomorrowEST.toISOString().slice(0, 16),
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
      newErrors.description = 'Task name is required';
    } else if (formData.description.length < 1) {
      newErrors.description = 'Name must be at least 1 character';
    }

    if (!formData.type) {
      newErrors.type = 'Task type is required';
    }

    if (formData.reward_points < 0) {
      newErrors.reward_points = 'Points cannot be negative';
    } else if (formData.reward_points > 20) {
      newErrors.reward_points = 'Points cannot exceed 20';
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

    // Real-time validation for reward points
    if (name === 'reward_points') {
      const points = parseInt(value) || 0;
      if (points > 20) {
        setErrors(prev => ({
          ...prev,
          reward_points: 'Too many coins! Maximum is 20 points.',
        }));
      } else if (points < 0) {
        setErrors(prev => ({
          ...prev,
          reward_points: 'Points cannot be negative',
        }));
      } else {
        // Clear error if value is valid
        setErrors(prev => ({
          ...prev,
          reward_points: '',
        }));
      }
    } else {
      // Clear errors as user types for other fields
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: '',
        }));
      }
    }
  };

  // Handle assignment search input
  const handleAssignmentSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAssignmentSearch(value);
    setShowAssignmentDropdown(true);
    
    // Clear selected assignment if user is typing
    if (selectedAssignment && value !== selectedAssignment.title) {
      setSelectedAssignment(null);
      setFormData(prev => ({
        ...prev,
        assignment_id: '',
      }));
    }
  };

  // Handle assignment selection
  const handleAssignmentSelect = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setAssignmentSearch(assignment.title);
    setShowAssignmentDropdown(false);
    setFormData(prev => ({
      ...prev,
      assignment_id: assignment.assignment_id,
    }));
  };

  // Filter assignments based on search
  const filteredAssignments = assignments.filter(assignment =>
    assignment.title.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
    assignment.assignment_id.toLowerCase().includes(assignmentSearch.toLowerCase())
  );

  // Handle course search input
  const handleCourseSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCourseSearch(value);
    setShowCourseDropdown(true);
    
    // Clear selected course if user is typing
    if (selectedCourse && value !== selectedCourse.name) {
      setSelectedCourse(null);
      setFormData(prev => ({
        ...prev,
        course_id: '',
      }));
      // Also clear assignment selection when course changes
      setSelectedAssignment(null);
      setAssignmentSearch('');
      setFormData(prev => ({
        ...prev,
        assignment_id: '',
      }));
    }
  };

  // Handle course selection
  const handleCourseSelect = (course: CourseForUI) => {
    setSelectedCourse(course);
    setCourseSearch(course.name);
    setShowCourseDropdown(false);
    setFormData(prev => ({
      ...prev,
      course_id: course.course_id,
    }));
    // Clear assignment selection when course changes
    setSelectedAssignment(null);
    setAssignmentSearch('');
    setFormData(prev => ({
      ...prev,
      assignment_id: '',
    }));
  };

  // Filter courses based on search
  const filteredCourses = userCourses.filter(course =>
    course.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
    course.course_id.toLowerCase().includes(courseSearch.toLowerCase())
  );

  // Handle task type search input
  const handleTaskTypeSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTaskTypeSearch(value);
    setShowTaskTypeDropdown(true);
    
    // Clear selected task type if user is typing
    if (selectedTaskType && value !== selectedTaskType.label) {
      setSelectedTaskType(null);
      setFormData(prev => ({
        ...prev,
        type: '',
      }));
    }
  };

  // Handle task type selection
  const handleTaskTypeSelect = (taskType: typeof TASK_TYPES[0]) => {
    setSelectedTaskType(taskType);
    setTaskTypeSearch(taskType.label);
    setShowTaskTypeDropdown(false);
    setFormData(prev => ({
      ...prev,
      type: taskType.value,
      reward_points: taskType.defaultPoints,
    }));
  };

  // Filter task types based on search
  const filteredTaskTypes = TASK_TYPES.filter(taskType =>
    taskType.label.toLowerCase().includes(taskTypeSearch.toLowerCase()) ||
    taskType.description.toLowerCase().includes(taskTypeSearch.toLowerCase())
  );

  const handleTemplateSelect = (template: typeof QUICK_TEMPLATES[0]) => {
    const now = new Date();
    const endTime = new Date(now.getTime() + template.duration * 60 * 60 * 1000);

    // Convert to EST (UTC-5) by subtracting 5 hours
    const nowEST = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    const endTimeEST = new Date(endTime.getTime() - 5 * 60 * 60 * 1000);

    setFormData(prev => ({
      ...prev,
      description: template.description,
      type: template.type,
      reward_points: template.points,
      scheduled_start_at: nowEST.toISOString().slice(0, 16),
      scheduled_end_at: endTimeEST.toISOString().slice(0, 16),
    }));

    // Clear assignment and course selection when using templates
    setSelectedAssignment(null);
    setAssignmentSearch('');
    setShowAssignmentDropdown(false);
    setSelectedCourse(null);
    setCourseSearch('');
    setShowCourseDropdown(false);
    
    // Set task type for templates
    const taskType = TASK_TYPES.find(t => t.value === template.type);
    if (taskType) {
      setSelectedTaskType(taskType);
      setTaskTypeSearch(taskType.label);
    }

    setShowTemplates(false);
    setMessage({ type: 'success', text: `Template "${template.name}" applied! 📋` });
  };

  const resetForm = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Convert to EST (UTC-5) by subtracting 5 hours
    const nowEST = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    const tomorrowEST = new Date(tomorrow.getTime() - 5 * 60 * 60 * 1000);

    setFormData({
      description: '',
      type: '',
      course_id: '',
      assignment_id: '',
      scheduled_start_at: nowEST.toISOString().slice(0, 16),
      scheduled_end_at: tomorrowEST.toISOString().slice(0, 16),
      reward_points: 10,
    });
    setErrors({});
    setSelectedAssignment(null);
    setAssignmentSearch('');
    setShowAssignmentDropdown(false);
    setSelectedCourse(null);
    setCourseSearch('');
    setShowCourseDropdown(false);
    setSelectedTaskType(null);
    setTaskTypeSearch('');
    setShowTaskTypeDropdown(false);
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
      // // Convert EST times back to UTC for database storage
      // let scheduledStartUTC = undefined;
      // let scheduledEndUTC = undefined;
      
      // if (formData.scheduled_start_at) {
      //   const startEST = new Date(formData.scheduled_start_at);
      //   scheduledStartUTC = new Date(startEST.getTime() + 5 * 60 * 60 * 1000).toISOString();
      // }
      
      // if (formData.scheduled_end_at) {
      //   const endEST = new Date(formData.scheduled_end_at);
      //   scheduledEndUTC = new Date(endEST.getTime() + 5 * 60 * 60 * 1000).toISOString();
      // }

      const taskData = {
        task_id: uuidv4(),
        user_id: userId,
        description: formData.description.trim(),
        type: formData.type,
        course_id: formData.course_id || undefined,
        assignment_id: formData.assignment_id || undefined,
        // scheduled_start_at: scheduledStartUTC,
        // scheduled_end_at: scheduledEndUTC,
        scheduled_start_at: formData.scheduled_start_at || undefined,
        scheduled_end_at: formData.scheduled_end_at || undefined,
        reward_points: formData.reward_points,
      };

      const response = await tasksApiService.createTask(taskData);

      // create notification for reminder at scheduled at time
      // if task is exercise or break, add notification for scheduled start time
      if ((formData.type === 'exercise' || formData.type === 'break') && formData.scheduled_start_at) {
        const notifId = `${formData.type}-${response.task_id}`;
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
          text: `Task created successfully! 🎉`
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

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Task Name *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg ${
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
          <div className="relative">
            <label htmlFor="task_type_search" className="block text-sm font-medium text-gray-700 mb-2">
              Task Type *
            </label>
            <input
              type="text"
              id="task_type_search"
              value={taskTypeSearch}
              onChange={handleTaskTypeSearchChange}
              onFocus={() => setShowTaskTypeDropdown(true)}
              onBlur={() => {
                // Delay hiding dropdown to allow for selection
                setTimeout(() => setShowTaskTypeDropdown(false), 200);
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 ${
                errors.type ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Start typing to search task types..."
              required
            />
            
            {/* Task Type Dropdown */}
            {showTaskTypeDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredTaskTypes.length > 0 ? (
                  filteredTaskTypes.map((taskType) => (
                    <div
                      key={taskType.value}
                      onClick={() => handleTaskTypeSelect(taskType)}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{taskType.label}</div>
                      <div className="text-sm text-gray-600">{taskType.description}</div>
                      {/* <div className="text-xs text-gray-500 mt-1">
                        🪙 {taskType.defaultPoints} points (default)
                      </div> */}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-sm">
                    No task types match "{taskTypeSearch}"
                  </div>
                )}
              </div>
            )}

            {/* {selectedTaskType && (
              <p className="text-sm text-gray-500 mt-1">
                {selectedTaskType.description}
              </p>
            )} */}
            {errors.type && (
              <p className="text-red-600 text-sm mt-1">{errors.type}</p>
            )}
          </div>

          {/* Course Selection */}
          <div className="relative">
            <label htmlFor="course_search" className="block text-sm font-medium text-gray-700 mb-2">
              Course (Optional)
            </label>
            <input
              type="text"
              id="course_search"
              value={courseSearch}
              onChange={handleCourseSearchChange}
              onFocus={() => setShowCourseDropdown(true)}
              onBlur={() => {
                // Delay hiding dropdown to allow for selection
                setTimeout(() => setShowCourseDropdown(false), 200);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              placeholder={
                userCourses.length > 0 
                  ? "Start typing to search courses..." 
                  : "No courses available"
              }
            />
            
            {/* Course Dropdown */}
            {showCourseDropdown && userCourses.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course) => (
                    <div
                      key={course.course_id}
                      onClick={() => handleCourseSelect(course)}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{course.name}</div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-sm">
                    No courses match "{courseSearch}"
                  </div>
                )}
              </div>
            )}

            {/* Selected Course Display */}
            {/* {selectedCourse && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium text-white bg-${selectedCourse.color}-500`}>
                      {selectedCourse.name}
                    </span>
                      <div className="text-sm text-blue-600">
                        ID: {selectedCourse.course_id}
                      </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourse(null);
                      setCourseSearch('');
                      setFormData(prev => ({ ...prev, course_id: '' }));
                      // Clear assignment selection when course is cleared
                      setSelectedAssignment(null);
                      setAssignmentSearch('');
                      setFormData(prev => ({ ...prev, assignment_id: '' }));
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )} */}
          </div>

          {/* Assignment Selection */}
          <div className="relative">
            <label htmlFor="assignment_search" className="block text-sm font-medium text-gray-700 mb-2">
              Assignment (Optional)
            </label>
            <input
              type="text"
              id="assignment_search"
              value={assignmentSearch}
              onChange={handleAssignmentSearchChange}
              onFocus={() => setShowAssignmentDropdown(true)}
              onBlur={() => {
                // Delay hiding dropdown to allow for selection
                setTimeout(() => setShowAssignmentDropdown(false), 200);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              placeholder={
                assignments.length > 0 
                  ? "Start typing to search assignments..." 
                  : formData.course_id 
                    ? "No assignments found for this course"
                    : "Select a course first or search all assignments"
              }
            />
            
            {/* Assignment Dropdown */}
            {showAssignmentDropdown && assignments.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredAssignments.length > 0 ? (
                  filteredAssignments.map((assignment) => (
                    <div
                      key={assignment.assignment_id}
                      onClick={() => handleAssignmentSelect(assignment)}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{assignment.title}</div>
                      <div className="text-sm text-gray-600">
                        {assignment.due_date && (
                          <span>
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        🪙 {assignment.completion_points} points
                        {assignment.task_count !== undefined && (
                          <span className="ml-2">
                            • Tasks: {assignment.completed_task_count || 0}/{assignment.task_count}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-sm">
                    No assignments match "{assignmentSearch}"
                  </div>
                )}
              </div>
            )}

            {/* Selected Assignment Display */}
            {/* {selectedAssignment && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-green-800">{selectedAssignment.title}</div>
                    <div className="text-sm text-green-600">
                      {selectedAssignment.due_date && (
                        <span>
                        Due: {new Date(selectedAssignment.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAssignment(null);
                      setAssignmentSearch('');
                      setFormData(prev => ({ ...prev, assignment_id: '' }));
                    }}
                    className="text-green-600 hover:text-green-800"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )} */}

            {/* <p className="text-sm text-gray-500 mt-2">
              🔗 Link this task to a specific assignment for automatic completion tracking
              {formData.course_id ? 
                ` (showing assignments for selected course)` : 
                ` (showing all assignments - select a course to filter)`
              }
            </p> */}
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
                max="20"
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 ${
                  errors.reward_points ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              <div className="flex gap-2">
                {[5, 10, 15, 20].map(points => (
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
              🪙 Points you'll earn when completing this task (0-20)
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

        {/* Message Display */}
        {message && (
          <div className={`mt-6 mb-6 p-4 rounded-lg flex items-center justify-between ${
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
      </div>

      {/* Help Section */}
      {/* <div className="mt-6 bg-blue-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Tips for Creating Tasks</h3>
        <ul className="space-y-2 text-blue-700">
          <li>• Use quick templates for common tasks to save time</li>
          <li>• Be specific in your task description to make it easier to complete</li>
          <li>• Choose appropriate reward points based on task difficulty and time</li>
          <li>• Search and select courses and assignments by typing for quick selection</li>
          <li>• Set realistic due dates to maintain motivation</li>
          <li>• Different task types help organize your work and suggest point values</li>
        </ul>
      </div> */}
    </div>
  );
};

export default AddTask;