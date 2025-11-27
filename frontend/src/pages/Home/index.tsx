import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<{ [key: string]: any[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseForUI[]>([]);
  const [globalRefreshKey, setGlobalRefreshKey] = useState(0);
  const [daysToShow, setDaysToShow] = useState(3);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const initialDaysToShow = 3;
  const daysPerIncrement = 3;

  // Helper function to group tasks by date
  const groupTasksByDate = (tasks: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    
    tasks.forEach((task: any) => {
      const taskDate = new Date(task.scheduled_end_at);
      const dateKey = taskDate.toDateString();
      
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

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  // Fetch all data when component mounts
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const tasksData = await apiService.getTasks(userId);
      
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
      setDaysToShow(initialDaysToShow);

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
    }
  };

  // Function to refresh task data from backend
  const refreshTaskData = async () => {
    try {
      console.log('🔄 Home: Refreshing task data from backend');
      const tasksData = await apiService.getTasks(userId);
      
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
      
      // Trigger course container refresh by updating the global refresh key
      setGlobalRefreshKey(prev => prev + 1);
      
      console.log('✅ Home: Refreshed task data and triggered course refresh');
    } catch (err) {
      console.error('Failed to refresh task data:', err);
    }
  };

  // Simplified handleTaskCompleted - DELAY refresh to allow modal to show
  const handleTaskCompleted = async (taskId: string, taskType: string, pointsEarned: number, courseId?: string) => {
    console.log('🎯 Home handleTaskCompleted called:', { taskId, taskType, pointsEarned, courseId });
    
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

    // Clear notifications
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
          } else {
            console.log(`ℹ️ No alarm found for task ${taskId} - already cleared or not set`);
          }
        });
      }
    } catch (notifError) {
      console.warn('Failed to clear task notification in Home component:', notifError);
    }
    
    // Clear any existing refresh timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    
    // DELAY refresh to allow modal to show and user to close it
    console.log('⏳ Home: Scheduling refresh in 3 seconds to allow modal display');
    refreshTimerRef.current = setTimeout(() => {
      console.log('⏰ Home: Timer fired - refreshing all data');
      refreshTaskData();
    }, 3000); // 3 seconds for user to see and close modal
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
      <div className="max-w-4xl mx-auto pb-4">
        {/* Today's Tasks */}
        <div className="max-w-2xl mx-auto p-2">
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
            onRefreshData={refreshTaskData}
            showCompleteButton={true}
          />
        </div>

        {/* Upcoming Tasks */}
        <div className="max-w-2xl mx-auto p-2">
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
                    onRefreshData={refreshTaskData}
                    showCompleteButton={true}
                    dateString={dateString}
                  />
                </div>
              ))}
              
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
        <div className="max-w-2xl mx-auto p-2">
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
            <div key={`${course.course_id}-${globalRefreshKey}`} className="mb-4">
              <CourseContainer 
                name={course.name} 
                courseId={course.course_id} 
                color={course.color}
                refreshKey={globalRefreshKey}
                onTaskCompleted={handleTaskCompleted}
                onRefreshData={refreshTaskData}
                userId={userId}
              />
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="max-w-2xl mx-auto p-2 mb-6 pb-8">
          <h2 className="text-xl font-semibold text-left mb-3">Quick Actions</h2>
          <div className="flex gap-3">
            <button
              onClick={() => {
                console.log('Navigating to upload-timetable...');
                navigate('/upload-timetable');
              }}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-4 hover:scale-105 transition-transform shadow-lg"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📅</div>
                <div className="font-bold text-sm">Upload Timetable</div>
                <div className="text-xs opacity-90 mt-1">Import your class schedule</div>
              </div>
            </button>
            
            <button
              onClick={() => {
                console.log('Navigating to upload-syllabi...');
                navigate('/upload-syllabi');
              }}
              className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl p-4 hover:scale-105 transition-transform shadow-lg"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">➕</div>
                <div className="font-bold text-sm">Upload Syllabi</div>
                <div className="text-xs opacity-90 mt-1">Create a new task</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;