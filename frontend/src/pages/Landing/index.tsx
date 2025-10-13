import React from 'react';
import SkinnyContainer from '../../components/skinny-container';
import WideContainer from '../../components/wide-container';
import CourseContainer from '../../components/course-container';

const Landing: React.FC = () => {

  const tasks = [
    { id: 1, title: 'longlonglonglonglonglonglonglonglonglong', dueDate: '2023-10-01', course: 'Course 1', colour: 'blue' },
    { id: 2, title: 'Task 2', dueDate: '2023-10-02', course: 'Course 2', colour: 'red' },
    { id: 3, title: 'Task 3', dueDate: '2023-10-03', course: 'Course 3', colour: 'yellow' }
  ];

  const course = {name: 'Course 1', colour: 'blue'};

  return (
    <div className="p-5 text-center font-sans">
      <h1 className="text-2xl font-bold mb-4">Achievo</h1>
      {/* Test Tailwind */}
      <div className="bg-yellow-500 text-white p-4 mb-4">
        <p>Your cheerful companion for a more productive and happier day</p>
      </div>

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
          <CourseContainer name={course.name} colour={course.colour} />
      </div>

    </div>
  );
};

export default Landing;