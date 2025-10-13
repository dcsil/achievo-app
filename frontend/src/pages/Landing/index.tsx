import React from 'react';
import SkinnyContainer from '../../components/skinny-container';

const Landing: React.FC = () => {

  const tasks = [
    { id: 1, title: 'longlonglonglonglonglonglonglonglonglong', dueDate: '2023-10-01', course: 'Course 1' },
    { id: 2, title: 'Task 2', dueDate: '2023-10-02', course: 'Course 2' },
    { id: 3, title: 'Task 3', dueDate: '2023-10-03', course: 'Course 3' },
  ];


  return (
    <div className="p-5 text-center font-sans">
      <h1 className="text-2xl font-bold mb-4">Achievo</h1>
      {/* Test Tailwind */}
      <div className="bg-yellow-500 text-white p-4 mb-4">
        <p>Your cheerful companion for a more productive and happier day</p>
      </div>

      {/* skinny container component for today's tasks */}
      <SkinnyContainer tasks={tasks}/>



    </div>
  );
};

export default Landing;