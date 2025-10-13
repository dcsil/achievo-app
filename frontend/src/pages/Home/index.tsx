import React from 'react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import TaskComplete from '../../components/task-complete';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      {/* Main content area */}
      <main className="flex-1 p-5 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Center the button for demo */}
          <div className="flex items-center justify-center py-20">
            <TaskComplete />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;