import React, { useState, useEffect } from 'react';
import { apiService, User } from '../../api-contexts/user-context';
import MultipleTaskContainer from '../../components/multiple-task-container';
import CourseContainer from '../../components/course-container';
import { getCourses, CourseForUI } from '../../api-contexts/get-courses';

interface HomeProps {
  user?: User | null;
  updateUserPoints?: (points: number) => void;
  userId?: string;
}

const Home: React.FC<HomeProps> = ({ user, updateUserPoints, userId = 'paul_paw_test' }) => {
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<{ [key: string]: any[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseForUI[]>([]);
  const [courseRefreshKey, setCourseRefreshKey] = useState<{ [key: string]: number }>({});
  const [daysToShow, setDaysToShow] = useState(3);
  const initialDaysToShow = 3;
  const daysPerIncrement = 3;

  // Helper function to group tasks by date
  const groupTasksByDate = (tasks: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    
    tasks.forEach((task: any) => {
      const taskDate = new Date(task.scheduled_end_at);
      const dateKey = taskDate.toDateString(); // Format: "Mon Nov 18 2025"
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    });
    
    return grouped;
  };

  // Helper function to get total count of upcoming tasks
  const getTotalUpcomingTasksCount = (groupedTasks: { [key: string]: any[] }) => {
    return Object.values(groupedTasks).reduce((total, tasks) => total + tasks.length, 0);
  };

  // Helper function to get displayed upcoming days
  const getDisplayedUpcomingDays = () => {
    const sortedDays = Object.entries(upcomingTasks)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime());
    
    return sortedDays.slice(0, daysToShow);
  };

  // Helper function to check if there are more days to show
  const hasMoreUpcomingDays = () => {
    return Object.keys(upcomingTasks).length > daysToShow;
  };

  // Helper function to check if we can collapse days view
  const canCollapseDays = () => {
    return daysToShow > initialDaysToShow;
  };

  // Function to show more days
  const handleShowMoreDays = () => {
    setDaysToShow(prev => Math.min(prev + daysPerIncrement, Object.keys(upcomingTasks).length));
  };

  // Function to collapse days view
  const handleCollapseDays = () => {
    setDaysToShow(initialDaysToShow);
  };

  // Fetch all data when component mounts
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // User data comes from Layout now, so we don't fetch it here
      // Fetch only incomplete tasks (backend filters by is_completed=false)
      const tasksData = await apiService.getTasks(userId);
      
      // Split tasks into today and upcoming
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayTasksList = tasksData.filter((task: any) => {
        const taskDate = new Date(task.scheduled_end_at);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      });

      const upcomingTasksList = tasksData.filter((task: any) => {
        const taskDate = new Date(task.scheduled_end_at);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() > today.getTime();
      });

      setTodayTasks(todayTasksList);
      setUpcomingTasks(groupTasksByDate(upcomingTasksList));
      // Reset upcoming days view when data changes
      setDaysToShow(initialDaysToShow);

      // Fetch courses data
      await fetchCourses();

    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Separate function to refresh courses data
  const fetchCourses = async () => {
    try {
      const fetchedCourses = await getCourses(userId);
      console.log('Fetched courses:', fetchedCourses);
      setCourses(fetchedCourses);
    } catch (err) {
      console.error('Error fetching courses:', err);
      // Don't set global error for course fetching to avoid disrupting other data
    }
  };

  // Function to refresh task data from backend
  const refreshTaskData = async () => {
    try {
      // Fetch fresh task data from backend
      const tasksData = await apiService.getTasks(userId);
      
      // Split tasks into today and upcoming
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayTasksList = tasksData.filter((task: any) => {
        const taskDate = new Date(task.scheduled_end_at);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      });

      const upcomingTasksList = tasksData.filter((task: any) => {
        const taskDate = new Date(task.scheduled_end_at);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() > today.getTime();
      });

      setTodayTasks(todayTasksList);
      setUpcomingTasks(groupTasksByDate(upcomingTasksList));
      // Reset upcoming days view when refreshing data
      setDaysToShow(initialDaysToShow);
      console.log('✅ Refreshed task data from backend');
    } catch (err) {
      console.error('Failed to refresh task data:', err);
    }
  };

  const handleTaskCompleted = async (taskId: string, taskType: string, pointsEarned: number, courseId?: string) => {
  // Remove the completed task from both lists immediately for better UX
  setTodayTasks(prev => prev.filter(task => task.task_id !== taskId));
  setUpcomingTasks(prev => {
    const updated = { ...prev };
    Object.keys(updated).forEach(dateKey => {
      updated[dateKey] = updated[dateKey].filter(task => task.task_id !== taskId);
      // Remove empty date groups
      if (updated[dateKey].length === 0) {
        delete updated[dateKey];
      }
    });
    return updated;
  });
  
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
  
  // Update Layout's user points optimistically for better UX
  if (user && updateUserPoints) {
    updateUserPoints(user.total_points + pointsEarned);
  }
  
  // Refresh user data and courses from backend
  try {
    // Fetch updated user data from backend to confirm points
    const updatedUser = await apiService.getUser(userId);
    if (updateUserPoints) {
      updateUserPoints(updatedUser.total_points);
    }
    
    // Update the refresh key for the specific course if courseId is provided
    if (courseId) {
      setCourseRefreshKey(prev => ({
        ...prev,
        [courseId]: Date.now()
      }));
      console.log(`🔄 Refreshed course ${courseId} after task completion`);
    } else {
      // Fallback to refresh all courses if courseId is not provided
      await fetchCourses();
      const newKey = Date.now();
      setCourseRefreshKey(prev => {
        const newRefreshKey: { [key: string]: number } = {};
        courses.forEach(course => {
          newRefreshKey[course.course_id] = newKey;
        });
        return newRefreshKey;
      });
      console.log('🔄 Refreshed all courses after task completion (no courseId provided)');
    }
    
  } catch (err) {
    console.error('Failed to refresh data after task completion:', err);
  }
};

  const handleTasksUpdate = (updatedTasks: any[], section: 'today' | 'upcoming') => {
    if (section === 'today') {
      setTodayTasks(updatedTasks);
    } else {
      setUpcomingTasks(groupTasksByDate(updatedTasks));
    }
  };

  if (loading) {
    return (
      <div className="px-2 py-4 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-2 py-4 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 py-4">
      <div className="max-w-6xl mx-auto pb-4">
        {/* Today's Tasks */}
        <div className="max-w-md mx-auto p-2">
          <h2 className="text-xl font-semibold text-left mb-2">
            Today's Tasks
            {todayTasks.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({todayTasks.length})
              </span>
            )}
          </h2>
          <MultipleTaskContainer 
            tasks={todayTasks}
            userId={userId}
            onTaskCompleted={handleTaskCompleted}
            onTasksUpdate={(tasks) => handleTasksUpdate(tasks, 'today')}
            onRefreshData={refreshTaskData}
            showCompleteButton={true}
          />
        </div>

        {/* Upcoming Tasks */}
        <div className="max-w-md mx-auto p-2">
          <h2 className="text-xl font-semibold text-left mb-2">
            Upcoming Tasks
            {getTotalUpcomingTasksCount(upcomingTasks) > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({getTotalUpcomingTasksCount(upcomingTasks)})
              </span>
            )}
          </h2>
          {Object.keys(upcomingTasks).length === 0 ? (
            <MultipleTaskContainer 
              tasks={[]}
              userId={userId}
              onTaskCompleted={handleTaskCompleted}
              onTasksUpdate={(tasks) => {
                // For empty upcoming tasks, just set empty grouped object
                setUpcomingTasks({});
              }}
              onRefreshData={refreshTaskData}
              showCompleteButton={true}
            />
          ) : (
            <>
              {getDisplayedUpcomingDays().map(([dateString, tasks]) => (
                <div key={dateString} className="mb-6">
                  <MultipleTaskContainer 
                    tasks={tasks}
                    userId={userId}
                    onTaskCompleted={handleTaskCompleted}
                    onTasksUpdate={(updatedTasks) => {
                      // Update only this specific date group
                      setUpcomingTasks(prev => {
                        const newState = { ...prev };
                        if (updatedTasks.length === 0) {
                          // If no tasks left for this date, remove the date group
                          delete newState[dateString];
                        } else {
                          // Update the tasks for this date
                          newState[dateString] = updatedTasks;
                        }
                        return newState;
                      });
                    }}
                    onRefreshData={refreshTaskData}
                    showCompleteButton={true}
                    dateString={dateString}
                  />
                </div>
              ))}
              
              {/* Show More / Collapse Controls for Days */}
              {(hasMoreUpcomingDays() || canCollapseDays()) && (
                <div className="flex justify-center mt-4 mb-6 gap-2">
                  {canCollapseDays() && (
                    <button
                      onClick={handleCollapseDays}
                      className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center gap-2"
                    >
                      <span>▲</span>
                      Collapse
                    </button>
                  )}
                  {hasMoreUpcomingDays() && (
                    <button
                      onClick={handleShowMoreDays}
                      className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center gap-2"
                    >
                      <span>▼</span>
                      Show {Math.min(daysPerIncrement, Object.keys(upcomingTasks).length - daysToShow)} More Days
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Courses Section */}
        <div className="max-w-md mx-auto p-2">
            <h2 className="text-xl font-semibold text-left mb-2">Courses</h2>
            
            {loading && (
              <div className="text-center py-4">
                <p className="text-gray-500">Loading courses...</p>
              </div>
            )}
            
            {error && (
              <div className="text-center py-4">
                <p className="text-red-500">{error}</p>
              </div>
            )}
            
            {!loading && !error && courses.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500">No courses found.</p>
              </div>
            )}
            
            {!loading && !error && courses.map((course, index) => (
              <div key={`${course.course_id}-${courseRefreshKey[course.course_id] || 0}`} className="mb-4">
                <CourseContainer 
                  name={course.name} 
                  courseId={course.course_id} 
                  color={course.color}
                  refreshKey={courseRefreshKey[course.course_id] || 0}
                />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Home;