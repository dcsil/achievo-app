import React, { useState, useEffect } from 'react';
import { apiService, User } from '../../api-contexts/user-context';
import MultipleTaskContainer from '../../components/multiple-task-container';

// Task types from AddTask page
const TASK_TYPES = [
  { value: 'assignment', label: '📝 Assignment/Tutorial/Quiz' },
  { value: 'study', label: '📚 Study/Review Session' },
  { value: 'reading', label: '📖 Required Reading' },
  { value: 'exercise', label: '💪 Exercise' },
  { value: 'break', label: '☕ Break' },
  { value: 'exam', label: '📋 Exam/Test' },
  { value: 'class', label: '🏫 Class' },
  { value: 'personal', label: '🏠 Personal' },
  { value: 'other', label: '📌 Other' }
];

interface TasksProps {
  user?: User | null;
  updateUserPoints?: (points: number) => void;
  userId?: string;
}

const ToDo: React.FC<TasksProps> = ({ user, updateUserPoints, userId = 'paul_paw_test' }) => {
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('all');
  
  // Additional filter states
  const [courseFilter, setCourseFilter] = useState<string>(''); // Empty string means all courses
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>(''); // Empty string means all types
  const [startDateFilter, setStartDateFilter] = useState<string>(''); // Start date filter
  const [endDateFilter, setEndDateFilter] = useState<string>(''); // End date filter
  
  // Available options for filters
  const [availableCourses, setAvailableCourses] = useState<{value: string, label: string}[]>([]);
  const [availableTaskTypes, setAvailableTaskTypes] = useState<{value: string, label: string}[]>([]);
  
  // Dropdown states for searchable filters
  const [courseSearch, setCourseSearch] = useState<string>('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<{value: string, label: string} | null>(null);
  
  const [taskTypeSearch, setTaskTypeSearch] = useState<string>('');
  const [showTaskTypeDropdown, setShowTaskTypeDropdown] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState<{value: string, label: string} | null>(null);
  
  // Collapsible filters state
  const [showAdditionalFilters, setShowAdditionalFilters] = useState(false);
  
  // Applied filters state (what's actually being used for filtering)
  const [appliedCourseFilter, setAppliedCourseFilter] = useState<string>('');
  const [appliedTaskTypeFilter, setAppliedTaskTypeFilter] = useState<string>('');
  const [appliedStartDateFilter, setAppliedStartDateFilter] = useState<string>('');
  const [appliedEndDateFilter, setAppliedEndDateFilter] = useState<string>('');

  // Helper function to group tasks by date
  const groupTasksByDate = (tasks: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    
    tasks.forEach((task: any) => {
      const taskDate = new Date(task.scheduled_end_at);
      const dateKey = taskDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      })
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    });
    
    return grouped;
  };

  // Helper function to calculate days overdue
  const getDaysOverdue = (scheduledEndAt: string) => {
    const now = new Date();
    now.setHours(23, 59, 59, 999); // Set to end of today for accurate calculation
    const taskDate = new Date(scheduledEndAt);
    taskDate.setHours(23, 59, 59, 999); // Set to end of task date
    
    const diffTime = now.getTime() - taskDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch incomplete tasks
      const tasksData = await apiService.getTasks(userId, undefined, undefined, false);
      setAllTasks(tasksData);
      
      // Fetch completed tasks  
      const completedTasksData = await apiService.getTasks(userId, undefined, undefined, true);
      setCompletedTasks(completedTasksData);
      
      // Extract available courses and task types from all tasks
      const allTasksCombined = [...tasksData, ...completedTasksData];
      
      // Extract unique courses
      const courseOptions = Array.from(
        new Set(allTasksCombined
          .filter(task => task.course_name)
          .map(task => JSON.stringify({ value: task.course_id, label: task.course_name }))
        )
      ).map(str => JSON.parse(str));
      setAvailableCourses(courseOptions);
      
      // Extract unique task types
      const taskTypeOptions = Array.from(
        new Set(allTasksCombined.map(task => task.type))
      )
      .filter(type => type)
      .map(type => {
        const taskTypeInfo = TASK_TYPES.find(t => t.value === type);
        return {
          value: type,
          label: taskTypeInfo ? taskTypeInfo.label : type
        };
      });
      setAvailableTaskTypes(taskTypeOptions);
      
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('Failed to load tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh task data from backend without loading state
  const refreshTaskData = async () => {
    try {
      // Fetch fresh incomplete tasks
      const tasksData = await apiService.getTasks(userId, undefined, undefined, false);
      setAllTasks(tasksData);
      
      // Fetch fresh completed tasks  
      const completedTasksData = await apiService.getTasks(userId, undefined, undefined, true);
      setCompletedTasks(completedTasksData);
      console.log('✅ Refreshed task data from backend');
    } catch (err) {
      console.error('Failed to refresh task data:', err);
    }
  };

  const handleTaskCompleted = async (taskId: string, taskType: string, pointsEarned: number, courseId?: string) => {
    // Find the completed task from all tasks
    const completedTask = allTasks.find(task => task.task_id === taskId);
    
    // Remove completed task from all tasks and add to completed tasks
    setAllTasks(prev => prev.filter(task => task.task_id !== taskId));
    if (completedTask) {
      setCompletedTasks(prev => [{ ...completedTask, is_completed: true }, ...prev]);
    }
    
    // Update user points
    if (user && updateUserPoints) {
      updateUserPoints(user.total_points + pointsEarned);
    }
    
    // Refresh user data from backend
    try {
      const updatedUser = await apiService.getUser(userId);
      if (updateUserPoints) {
        updateUserPoints(updatedUser.total_points);
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err);
    }

    // Clear any scheduled notifications for this completed task
    try {

      // if exercise or break notification alarm exists, clear it
      if (taskType === 'exercise' || taskType === 'break') {

        const alarmId = `${taskType}-${taskId}`;

        // Check if alarm exists before trying to clear it
        chrome.alarms.get(alarmId, (alarm) => {
          if (alarm) {
            chrome.alarms.clear(alarmId, (wasCleared) => {
              if (wasCleared) {
                console.log(`✅ Cleared notification alarm for task ${taskId}`);
              } else {
                console.warn(`⚠️ Failed to clear alarm for task ${taskId}`);
              }
            });
          } else {
            console.log(`ℹ️ No alarm found for task ${taskId} - already cleared or not set`);
          }
        });
      }

    } catch (notifError) {
      // Don't let notification errors break the completion flow
      console.warn('Failed to clear task notification in Home component:', notifError);
    }

  };

  const handleTasksUpdate = (updatedTasks: any[]) => {
    setAllTasks(updatedTasks);
  };

  // Course dropdown handlers
  const handleCourseSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCourseSearch(value);
    setShowCourseDropdown(true);
    
    // Clear selected course if user is typing
    if (selectedCourse && value !== selectedCourse.label) {
      setSelectedCourse(null);
      setCourseFilter('');
    }
  };

  const handleCourseSelect = (course: {value: string, label: string}) => {
    setSelectedCourse(course);
    setCourseSearch(course.label);
    setShowCourseDropdown(false);
    setCourseFilter(course.value);
  };

  // Task type dropdown handlers
  const handleTaskTypeSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTaskTypeSearch(value);
    setShowTaskTypeDropdown(true);
    
    // Clear selected task type if user is typing
    if (selectedTaskType && value !== selectedTaskType.label) {
      setSelectedTaskType(null);
      setTaskTypeFilter('');
    }
  };

  const handleTaskTypeSelect = (taskType: {value: string, label: string}) => {
    setSelectedTaskType(taskType);
    setTaskTypeSearch(taskType.label);
    setShowTaskTypeDropdown(false);
    setTaskTypeFilter(taskType.value);
  };

  // Filter courses and task types based on search
  const filteredCourses = availableCourses.filter(course =>
    course.label.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const filteredTaskTypes = availableTaskTypes.filter(taskType =>
    taskType.label.toLowerCase().includes(taskTypeSearch.toLowerCase())
  );

  // Apply filters handler
  const handleApplyFilters = () => {
    setAppliedCourseFilter(courseFilter);
    setAppliedTaskTypeFilter(taskTypeFilter);
    setAppliedStartDateFilter(startDateFilter);
    setAppliedEndDateFilter(endDateFilter);
  };

  // Clear filters handler
  const handleClearFilters = () => {
    // Clear filter values
    setCourseFilter('');
    setTaskTypeFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    
    // Clear applied filters
    setAppliedCourseFilter('');
    setAppliedTaskTypeFilter('');
    setAppliedStartDateFilter('');
    setAppliedEndDateFilter('');
    
    // Clear search states
    setCourseSearch('');
    setTaskTypeSearch('');
    setSelectedCourse(null);
    setSelectedTaskType(null);
    setShowCourseDropdown(false);
    setShowTaskTypeDropdown(false);
  };

  const applyAdditionalFilters = (tasks: any[]) => {
    let filtered = tasks;

    // Apply course filter
    if (appliedCourseFilter) {
      filtered = filtered.filter(task => task.course_id === appliedCourseFilter);
    }

    // Apply task type filter
    if (appliedTaskTypeFilter) {
      filtered = filtered.filter(task => task.type === appliedTaskTypeFilter);
    }

    // Apply date range filters
    if (appliedStartDateFilter) {
      const startDate = new Date(appliedStartDateFilter);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(task => {
        if (!task.scheduled_end_at) return true; // Include tasks without dates
        const taskDate = new Date(task.scheduled_end_at);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate >= startDate;
      });
    }

    if (appliedEndDateFilter) {
      const endDate = new Date(appliedEndDateFilter);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(task => {
        if (!task.scheduled_end_at) return true; // Include tasks without dates
        const taskDate = new Date(task.scheduled_end_at);
        return taskDate <= endDate;
      });
    }

    return filtered;
  };

  const getFilteredTasks = () => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let tasksToFilter: any[];

    switch (filter) {
      case 'completed':
        tasksToFilter = completedTasks;
        break;
        
      case 'today':
        tasksToFilter = allTasks.filter(task => {
          const taskDate = new Date(task.scheduled_end_at);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime();
        });
        break;
      
      case 'upcoming':
        tasksToFilter = allTasks.filter(task => {
          const taskDate = new Date(task.scheduled_end_at);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() > today.getTime();
        });
        break;
      
      case 'overdue':
        tasksToFilter = allTasks.filter(task => {
          const taskDate = new Date(task.scheduled_end_at);
          return taskDate < now;
        });
        break;
      
      default:
        // For 'all' filter
        tasksToFilter = allTasks;
    }

    // Apply additional filters
    const filteredTasks = applyAdditionalFilters(tasksToFilter);

    // Group by date for certain filters
    if (filter === 'all' || filter === 'upcoming' || filter === 'overdue') {
      return groupTasksByDate(filteredTasks);
    } else {
      return filteredTasks;
    }
  };

  const getFilterCount = (filterType: typeof filter) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let tasksToCount: any[];

    switch (filterType) {
      case 'completed':
        tasksToCount = completedTasks;
        break;
        
      case 'today':
        tasksToCount = allTasks.filter(task => {
          const taskDate = new Date(task.scheduled_end_at);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime();
        });
        break;
      
      case 'upcoming':
        tasksToCount = allTasks.filter(task => {
          const taskDate = new Date(task.scheduled_end_at);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() > today.getTime();
        });
        break;
      
      case 'overdue':
        tasksToCount = allTasks.filter(task => {
          const taskDate = new Date(task.scheduled_end_at);
          return taskDate < now;
        });
        break;
      
      default:
        tasksToCount = allTasks;
    }

    // Apply additional filters to the count
    return applyAdditionalFilters(tasksToCount).length;
  };

  const filteredTasks = getFilteredTasks();
  const isGroupedData = (filter === 'all' || filter === 'upcoming' || filter === 'overdue') && !Array.isArray(filteredTasks);

  if (loading) {
    return (
      <div className="px-6 py-6 max-w-4xl mx-auto pb-20">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-6 max-w-4xl mx-auto pb-20">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchTasks}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📋 All Tasks</h1>
        <p className="text-gray-600">View and manage all your tasks with filters</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({getFilterCount('all')})
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'today'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Today ({getFilterCount('today')})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'upcoming'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upcoming ({getFilterCount('upcoming')})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'overdue'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Overdue ({getFilterCount('overdue')})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed ({getFilterCount('completed')})
          </button>
        </div>
      </div>

      {/* Additional Filters */}
      <div className="mb-6 bg-gray-50 rounded-lg">
        {/* Collapsible Header */}
        <button
          onClick={() => setShowAdditionalFilters(!showAdditionalFilters)}
          className={`flex bg-gray-100 gap-3 items-center justify-between py-2 px-3 hover:bg-gray-200 ${!showAdditionalFilters ? 'rounded-lg' : 'rounded-t-lg'} transition-colors cursor-pointer`}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-700">🔍 Additional Filters</h3>
            {(appliedCourseFilter || appliedTaskTypeFilter || appliedStartDateFilter || appliedEndDateFilter) && (
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>
          <span className="text-gray-500 text-sm">
            {showAdditionalFilters ? '▲ Hide' : '▼ Show'}
          </span>
        </button>
        
        {/* Collapsible Content */}
        {showAdditionalFilters && (
          <div className="bg-white px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Course Filter */}
              <div className="relative">
                <label htmlFor="course-filter" className="block text-xs font-medium text-gray-600 mb-1">
                  Course
                </label>
                <input
                  type="text"
                  id="course-filter"
                  value={courseSearch}
                  onChange={handleCourseSearchChange}
                  onFocus={() => setShowCourseDropdown(true)}
                  onBlur={() => {
                    // Delay hiding dropdown to allow for selection
                    setTimeout(() => setShowCourseDropdown(false), 200);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder={
                    availableCourses.length > 0 
                      ? "All courses or search..." 
                      : "No courses available"
                  }
                />
                
                {/* Course Dropdown */}
                {showCourseDropdown && availableCourses.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {/* "All Courses" option */}
                    <button
                      onClick={() => {
                        setSelectedCourse(null);
                        setCourseSearch('');
                        setShowCourseDropdown(false);
                        setCourseFilter('');
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 border-b border-gray-100"
                    >
                      All Courses
                    </button>
                    
                    {filteredCourses.length > 0 ? (
                      filteredCourses.map((course) => (
                        <button
                          key={course.value}
                          onClick={() => handleCourseSelect(course)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                        >
                          {course.label}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        No courses match "{courseSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Task Type Filter */}
              <div className="relative">
                <label htmlFor="type-filter" className="block text-xs font-medium text-gray-600 mb-1">
                  Task Type
                </label>
                <input
                  type="text"
                  id="type-filter"
                  value={taskTypeSearch}
                  onChange={handleTaskTypeSearchChange}
                  onFocus={() => setShowTaskTypeDropdown(true)}
                  onBlur={() => {
                    // Delay hiding dropdown to allow for selection
                    setTimeout(() => setShowTaskTypeDropdown(false), 200);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder={
                    availableTaskTypes.length > 0 
                      ? "All types or search..." 
                      : "No task types available"
                  }
                />
                
                {/* Task Type Dropdown */}
                {showTaskTypeDropdown && availableTaskTypes.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {/* "All Types" option */}
                    <button
                      onClick={() => {
                        setSelectedTaskType(null);
                        setTaskTypeSearch('');
                        setShowTaskTypeDropdown(false);
                        setTaskTypeFilter('');
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 border-b border-gray-100"
                    >
                      All Types
                    </button>
                    
                    {filteredTaskTypes.length > 0 ? (
                      filteredTaskTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => handleTaskTypeSelect(type)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                        >
                          {type.label}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        No types match "{taskTypeSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Start Date Filter */}
              <div>
                <label htmlFor="start-date-filter" className="block text-xs font-medium text-gray-600 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  id="start-date-filter"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* End Date Filter */}
              <div>
                <label htmlFor="end-date-filter" className="block text-xs font-medium text-gray-600 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  id="end-date-filter"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Action Buttons */}
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={handleApplyFilters}
                className="px-5 py-2 text-white font-semibold text-sm bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
              >
                🔍 Filter
              </button>
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>



      {/* TaskContainer - handle both grouped and ungrouped tasks */}
      {isGroupedData ? (
        // Render grouped tasks by date for 'all' and 'upcoming' filters
        Object.keys(filteredTasks as { [key: string]: any[] }).length === 0 ? (
          <MultipleTaskContainer
            tasks={[]}
            userId={userId}
            onTaskCompleted={handleTaskCompleted}
            onTasksUpdate={handleTasksUpdate}
            onRefreshData={refreshTaskData}
            showCompleteButton={true}
          />
        ) : (
          Object.entries(filteredTasks as { [key: string]: any[] })
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .map(([dateString, tasks]) => {
              // For overdue tasks, enhance the dateString with days overdue info
              let displayDateString = dateString;
              if (filter === 'overdue' && tasks.length > 0) {
                const daysOverdue = getDaysOverdue(tasks[0].scheduled_end_at);
                const dayText = daysOverdue === 1 ? 'day' : 'days';
                displayDateString = `${dateString} (${daysOverdue} ${dayText} overdue)`;
              }
              
              return (
                <div key={dateString} className="mb-6">
                  <MultipleTaskContainer
                    tasks={tasks}
                    userId={userId}
                    onTaskCompleted={handleTaskCompleted}
                    onTasksUpdate={handleTasksUpdate}
                    onRefreshData={refreshTaskData}
                    showCompleteButton={true}
                    dateString={displayDateString}
                  />
                </div>
              );
            })
        )
      ) : (
        // Render ungrouped tasks for other filters
        <MultipleTaskContainer
          tasks={filteredTasks as any[]}
          userId={userId}
          onTaskCompleted={handleTaskCompleted}
          onTasksUpdate={handleTasksUpdate}
          onRefreshData={refreshTaskData}
          showCompleteButton={filter !== 'completed'}
        />
      )}
    </div>
  );
};

export default ToDo;