import React, { useEffect, useState } from 'react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import TaskComplete from '../../components/task-complete';
import SkinnyContainer from '../../components/skinny-container';
import CourseContainer from '../../components/course-container';

const Home: React.FC = () => {

  const tasks = [
    { id: 1, title: 'longlonglonglonglonglonglonglonglonglong', dueDate: '2023-10-01', course: 'Course 1', colour: 'blue' },
    { id: 2, title: 'Task 2', dueDate: '2023-10-02', course: 'Course 2', colour: 'red' },
    { id: 3, title: 'Task 3', dueDate: '2023-10-03', course: 'Course 3', colour: 'yellow' }
  ];


  const [courses, setCourses] = useState<{ name: string; colour: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/db/courses');
        if (!res.ok) throw new Error('Failed to fetch courses');
        const data = await res.json();
        // Map backend data to expected format for CourseContainer
        // Use a default colour if not present
        setCourses(
          data.map((c: any, idx: number) => ({
            name: c.course_name || c.name || `Course ${idx + 1}`,
            colour: c.colour || 'blue',
          }))
        );
      } catch (err: any) {
        setError(err.message || 'Unknown error');
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
      <main className="flex-1 p-5 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* skinny container component for today's tasks */}
          <div className="max-w-md mx-auto p-3">
              <h2 className="text-xl font-semibold text-left mb-2">Today's Tasks</h2>
              <SkinnyContainer tasks={tasks} />
          </div>

          {/* skinny container component for upcoming tasks */}
          <div className="max-w-md mx-auto p-3">
              <h2 className="text-xl font-semibold text-left mb-2">Upcoming Tasks</h2>
              <SkinnyContainer tasks={tasks} />
          </div>

          {/* wide container component for tasks by courses */}
          <div className="max-w-md mx-auto p-3">
              <h2 className="text-xl font-semibold text-left mb-2">Courses</h2>
              {loading && <div>Loading courses...</div>}
              {error && <div className="text-red-500">{error}</div>}
              {!loading && !error && courses.length === 0 && <div>No courses found.</div>}
              {!loading && !error && courses.map((course, idx) => (
                <CourseContainer key={idx} name={course.name} colour={course.colour} />
              ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;