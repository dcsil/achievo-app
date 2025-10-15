import React, { useState, useEffect } from 'react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import TaskComplete from '../../components/task-complete';
import TaskContainer from '../../components/task-container';
import CourseContainer from '../../components/course-container';
import { getCourses, CourseForUI } from '../../api-contexts/get-courses';

const Home: React.FC = () => {
  const [courses, setCourses] = useState<CourseForUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tasks = [
    { id: 1, title: 'longlonglonglonglonglonglonglonglonglong', dueDate: '2023-10-01', description: 'Complete project proposal', course: 'Course 1', color: 'blue' },
    { id: 2, title: 'Task 2', dueDate: '2023-10-02', description: 'Description for Task 2', course: 'Course 2', color: 'red' },
    { id: 3, title: 'Task 3', dueDate: '2023-10-03', description: 'Description for Task 3', course: 'Course 3', color: 'yellow' }
  ];

  // Fetch courses when component mounts
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedCourses = await getCourses("paul_paw_test");
        console.log('Fetched courses:', fetchedCourses);
        setCourses(fetchedCourses);
      } catch (err) {
        setError('Failed to fetch courses. Please try again later.');
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      {/* Main content area */}
      <main className="flex-1 p-2 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* skinny container component for today's tasks */}
          <div className="max-w-md mx-auto p-2">
              <h2 className="text-xl font-semibold text-left mb-2">Today's Tasks</h2>
              <TaskContainer tasks={tasks} />
          </div>

          {/* skinny container component for upcoming tasks */}
          <div className="max-w-md mx-auto p-2">
              <h2 className="text-xl font-semibold text-left mb-2">Upcoming Tasks</h2>
              <TaskContainer tasks={tasks} />
          </div>

          {/* wide container component for tasks by courses */}
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
                <div key={course.course_id} className="mb-4">
                  <CourseContainer 
                    name={course.name} 
                    courseId={course.course_id} 
                    color={course.color} 
                  />
                </div>
              ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;