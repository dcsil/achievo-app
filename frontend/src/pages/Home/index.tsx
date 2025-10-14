import React from 'react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import TaskComplete from '../../components/task-complete';
import SkinnyContainer from '../../components/skinny-container';
import CourseContainer from '../../components/course-container';

const Home: React.FC = () => {

  const tasks = [
    { id: 1, title: 'longlonglonglonglonglonglonglonglonglong', dueDate: '2023-10-01', description: 'Complete project proposal', course: 'Course 1', colour: 'blue' },
    { id: 2, title: 'Task 2', dueDate: '2023-10-02', description: 'Description for Task 2', course: 'Course 2', colour: 'red' },
    { id: 3, title: 'Task 3', dueDate: '2023-10-03', description: 'Description for Task 3', course: 'Course 3', colour: 'yellow' }
  ];

  const course = {name: 'Course 1', courseId: 1, colour: 'blue'};

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
              <CourseContainer name={course.name} courseId={course.courseId} colour={course.colour} />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;