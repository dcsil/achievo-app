import React from 'react';
import './index.css'; 

interface TaskCompleteProps {
  isOpen: boolean;
  task?: {
    title: string;
    id: number;
    course?: string;
  };
  onClose: () => void;
  coinsEarned?: number;
  totalGold?: number;
}

const TaskComplete: React.FC<TaskCompleteProps> = ({ 
  isOpen, 
  task, 
  onClose,
  coinsEarned = 100,
  totalGold = 1347 
}) => {
  const taskCompleted = task?.title || "Complete project proposal"; 

  return (
    <>
      {/* Congratulations Popup Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-yellow-400 max-w-sm w-full relative overflow-hidden animate-bounce-in">
            {/* Decorative top border */}
            <div className="h-3 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400"></div>
            
            {/* Confetti background effect */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
              <div className="absolute top-4 left-4 text-2xl">🎉</div>
              <div className="absolute top-8 right-6 text-xl">✨</div>
              <div className="absolute top-16 left-12 text-lg">⭐</div>
              <div className="absolute top-20 right-12 text-2xl">🎊</div>
              <div className="absolute bottom-20 left-8 text-xl">💫</div>
              <div className="absolute bottom-24 right-10 text-lg">🌟</div>
            </div>

            <div className="p-8 text-center relative z-10">
              {/* Celebration mascots */}
              <div className="flex justify-center gap-4 mb-6">
                <div className="text-6xl animate-wiggle">🐱</div>
                <div className="text-6xl animate-wiggle-delayed">🐼</div>
              </div>

              {/* Congrats text */}
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                CONGRATS!!!
              </h2>

              {/* Coins earned */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 mb-4">
                <p className="text-gray-700 font-semibold mb-2">You earned:</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl font-bold text-orange-600">{coinsEarned}</span>
                  <span className="text-3xl">🪙</span>
                </div>
              </div>

              {/* Task completed */}
              <div className="mb-4">
                <p className="text-gray-600 text-sm mb-1">From completing:</p>
                <p className="text-gray-800 font-semibold">"{taskCompleted}"</p>
              </div>

              {/* Total gold */}
              <div className="bg-gray-100 rounded-lg p-3 mb-6">
                <p className="text-gray-600 text-sm mb-1">Total Gold:</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold text-gray-800">{totalGold}</span>
                  <span className="text-xl">🪙</span>
                </div>
              </div>

              {/* Finish button */}
              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-800 font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Finish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskComplete;