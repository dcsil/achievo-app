import React, { useState, useEffect } from 'react';
import { apiService, User } from '../../api-contexts/user-context';
import TaskContainer from '../../components/task-container';
import CourseContainer from '../../components/course-container';
import { getCourses, CourseForUI } from '../../api-contexts/get-courses';

interface HomeProps {
  user?: User | null;
  updateUserPoints?: (points: number) => void;
  userId?: string;
}

const Home: React.FC<HomeProps> = ({ user, updateUserPoints, userId = 'paul_paw_test' }) => {
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseForUI[]>([]);
  const [courseRefreshKey, setCourseRefreshKey] = useState<{ [key: string]: number }>({});

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
      setUpcomingTasks(upcomingTasksList);

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

  const handleTaskCompleted = async (taskId: string, pointsEarned: number, courseId?: string) => {
  // Remove the completed task from both lists immediately
  setTodayTasks(prev => prev.filter(task => task.task_id !== taskId));
  setUpcomingTasks(prev => prev.filter(task => task.task_id !== taskId));
  
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
      setUpcomingTasks(updatedTasks);
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
          <TaskContainer 
            tasks={todayTasks}
            userId={userId}
            onTaskCompleted={handleTaskCompleted}
            onTasksUpdate={(tasks) => handleTasksUpdate(tasks, 'today')}
          />
        </div>

        {/* Upcoming Tasks */}
        <div className="max-w-md mx-auto p-2">
          <h2 className="text-xl font-semibold text-left mb-2">
            Upcoming Tasks
            {upcomingTasks.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({upcomingTasks.length})
              </span>
            )}
          </h2>
          <TaskContainer 
            tasks={upcomingTasks}
            userId={userId}
            onTaskCompleted={handleTaskCompleted}
            onTasksUpdate={(tasks) => handleTasksUpdate(tasks, 'upcoming')}
          />
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