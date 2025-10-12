import React from 'react';

const Landing: React.FC = () => {
  return (
    <div className="p-5 text-center font-sans">
      <h1 className="text-2xl font-bold mb-4">Achievo</h1>
      {/* Test Tailwind */}
      <div className="bg-yellow-500 text-white p-4 mb-4">
        <p>Your cheerful companion for a more productive and happier day</p>
      </div>
    </div>
  );
};

export default Landing;