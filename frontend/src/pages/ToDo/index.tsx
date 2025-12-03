import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { apiService, User } from '../../api-contexts/user-context';
import MultipleTaskContainer from '../../components/multiple-task-container';

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
  
  const [availableCourses, setAvailableCourses] = useState<{value: string, label: string}[]>([]);
  const [availableTaskTypes, setAvailableTaskTypes] = useState<{value: string, label: string}[]>([]);
  
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const getDaysOverdue = (scheduledEndAt: string) => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const taskDate = new Date(scheduledEndAt);
    taskDate.setHours(23, 59, 59, 999);
    
    const diffTime = now.getTime() - taskDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const combinedData = await apiService.getCombinedTasks(userId);
      
      setAllTasks(combinedData.incomplete_tasks);
      setCompletedTasks(combinedData.completed_tasks);
      setAvailableCourses(combinedData.available_courses);
      setAvailableTaskTypes(combinedData.available_task_types);
      
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('Failed to load tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const refreshTaskData = async () => {
    try {
      const combinedData = await apiService.getCombinedTasks(userId);
      setAllTasks(combinedData.incomplete_tasks);
      setCompletedTasks(combinedData.completed_tasks);
      setAvailableCourses(combinedData.available_courses);
      setAvailableTaskTypes(combinedData.available_task_types);
    } catch (err) {
      console.error('Failed to refresh task data:', err);
    }
  };

  const handleTaskCompleted = async (taskId: string, taskType: string, pointsEarned: number, courseId?: string) => {
    
    if (user && updateUserPoints) {
      updateUserPoints(user.total_points + pointsEarned);
    }
    
    try {
      const updatedUser = await apiService.getUser(userId);
      if (updateUserPoints) {
        updateUserPoints(updatedUser.total_points);
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err);
    }

    try {
      if (taskType === 'exercise' || taskType === 'break') {
        const alarmId = `${taskType}-${taskId}`;
        chrome.alarms.get(alarmId, (alarm) => {
          if (alarm) {
            chrome.alarms.clear(alarmId, (wasCleared) => {
              if (wasCleared) {
                console.log(`✅ Cleared notification alarm for task ${taskId}`);
              } else {
                console.warn(`⚠️ Failed to clear alarm for task ${taskId}`);
              }
            });
          }
        });
      }
    } catch (notifError) {
      console.warn('Failed to clear task notification:', notifError);
    }

    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(() => {
      refreshTaskData();
    }, 3000);
  };

  const getFilteredTasks = useCallback((): Record<string, any[]> | any[] => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
        tasksToFilter = allTasks;
    }

    const filteredTasks: any[] = tasksToFilter;

    if (filter === 'all' || filter === 'upcoming' || filter === 'overdue') {
      return groupTasksByDate(filteredTasks);
    } else {
      return filteredTasks;
    }
  }, [filter, allTasks, completedTasks]);

  const getFilterCount = useCallback((filterType: typeof filter) => {
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

    return tasksToCount.length;
  }, [allTasks, completedTasks]);

  const filteredTasks = useMemo(() => getFilteredTasks(), [getFilteredTasks]);
  const isGroupedData = useMemo(() => (filter === 'all' || filter === 'upcoming' || filter === 'overdue') && !Array.isArray(filteredTasks), [filter, filteredTasks]);

  if (loading) {
    return (
      <div className="px-6 py-6 max-w-4xl mx-auto pb-20 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⏳</div>
          <p className="text-gray-600">Loading tasks...</p>
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

      {/* TaskContainer - handle both grouped and ungrouped tasks */}
      {isGroupedData ? (
        // Render grouped tasks by date
        Object.keys(filteredTasks as { [key: string]: any[] }).length === 0 ? (
          <MultipleTaskContainer
            tasks={[]}
            userId={userId}
            onTaskCompleted={handleTaskCompleted}
            onRefreshData={refreshTaskData}
            showCompleteButton={true}
          />
        ) : (
          Object.entries(filteredTasks as { [key: string]: any[] })
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .map(([dateString, tasks]) => {
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
                    onRefreshData={refreshTaskData}
                    showCompleteButton={true}
                    dateString={displayDateString}
                  />
                </div>
              );
            })
        )
      ) : (
        // Render ungrouped tasks
        <MultipleTaskContainer
          tasks={filteredTasks as any[]}
          userId={userId}
          onTaskCompleted={handleTaskCompleted}
          onRefreshData={refreshTaskData}
          showCompleteButton={filter !== 'completed'}
        />
      )}
    </div>
  );
};

export default ToDo;