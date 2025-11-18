import React, { useState, useEffect } from 'react';
import { apiService, User } from '../../api-contexts/user-context';
import TaskContainer from '../../components/task-container';

interface TasksProps {
  user?: User | null;
  updateUserPoints?: (points: number) => void;
  userId?: string;
}

const ToDo: React.FC<TasksProps> = ({ user, updateUserPoints, userId = 'paul_paw_test' }) => {
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue'>('all');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const tasksData = await apiService.getTasks(userId);
      setAllTasks(tasksData);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('Failed to load tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCompleted = async (taskId: string, taskType: string, pointsEarned: number, courseId?: string) => {
    // Remove completed task from all tasks
    setAllTasks(prev => prev.filter(task => task.task_id !== taskId));
    
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

      // if personal notification alarm exists, clear it
      if (taskType === 'personal') {

        const alarmId = `personal-${taskId}`;
        
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

  const getFilteredTasks = () => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (filter) {
      case 'today':
        return allTasks.filter(task => {
          const taskDate = new Date(task.scheduled_end_at);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime();
        });
      
      case 'upcoming':
        return allTasks.filter(task => {
          const taskDate = new Date(task.scheduled_end_at);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() > today.getTime();
        });
      
      case 'overdue':
        return allTasks.filter(task => {
          const taskDate = new Date(task.scheduled_end_at);
          return taskDate < now;
        });
      
      default:
        return allTasks;
    }
  };

  const getFilterCount = (filterType: typeof filter) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filterType) {
      case 'today':
        return allTasks.filter(task => {
          const taskDate = new Date(task.scheduled_end_at);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime();
        }).length;
      
      case 'upcoming':
        return allTasks.filter(task => {
          const taskDate = new Date(task.scheduled_end_at);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() > today.getTime();
        }).length;
      
      case 'overdue':
        return allTasks.filter(task => {
          const taskDate = new Date(task.scheduled_end_at);
          return taskDate < now;
        }).length;
      
      default:
        return allTasks.length;
    }
  };

  const filteredTasks = getFilteredTasks();

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
        </div>
      </div>

      {/* Your existing TaskContainer - just pass filtered tasks */}
      <TaskContainer
        tasks={filteredTasks}
        userId={userId}
        onTaskCompleted={handleTaskCompleted}
        onTasksUpdate={handleTasksUpdate}
      />
    </div>
  );
};

export default ToDo;