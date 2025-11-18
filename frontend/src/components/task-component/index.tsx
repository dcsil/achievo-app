import React, { useState } from 'react';

interface TaskComponentProps {
  task: any;
  onCompleteTask: (task: any) => void;
  showCompleteButton?: boolean;
  isCompleting?: boolean;
  timeAdjustment?: boolean;
}

function TaskComponent({ task, onCompleteTask, showCompleteButton = true, isCompleting = false, timeAdjustment = true }: TaskComponentProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleCompleteClick = () => {
    onCompleteTask(task);
  };

  return (
    <li 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`w-full border-2 border-${task.course_color}-200 bg-white rounded-xl transition-all duration-300 ease-in-out hover:shadow-lg border-${task.course_color}-300 scale-[1.01]`}>
        {/* Task header - always visible */}
        <div className="flex items-center justify-between p-4">
          <div className="flex-1 min-w-0 mr-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-1 leading-tight">
              {task.description}
            </h3>
            <span className={`inline-block rounded-full text-sm mt-1 font-medium text-white py-1 px-3 truncate max-w-full ${
              task.course_color ? `bg-${task.course_color}-400` : 'bg-gray-400'
            }`}>
              {task.course_name || 'Personal'}
            </span>
          </div>
          
          <div className="text-right flex-shrink-0">
            <p className="text-lg text-gray-900">{new Date(new Date(task.scheduled_start_at).getTime() + (timeAdjustment ? 5 : 0) * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: "numeric", minute: "numeric", hour12: true })}</p>
            <p className="text-lg text-gray-500">{new Date(new Date(task.scheduled_end_at).getTime() + (timeAdjustment ? 5 : 0) * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: "numeric", minute: "numeric", hour12: true })}</p>
          </div>
        </div>

        {/* Task actions - shown on hover */}
        {showCompleteButton && (
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isHovered 
              ? 'max-h-24 opacity-100' 
              : 'max-h-0 opacity-0'
          }`}>
            <div className="px-4 pb-4 pt-0 border-t border-orange-100">
              <div className="flex items-center justify-between gap-4 mt-3">
                {/* Task points display */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">🪙</span>
                  <span className="text-sm font-semibold text-gray-700">
                    Complete task to earn points!
                  </span>
                </div>

                {/* Complete button */}
                <button
                  onClick={handleCompleteClick}
                  disabled={isCompleting}
                  className={`px-5 py-2 text-white font-semibold text-sm bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 ${
                    isCompleting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isCompleting ? 'Completing...' : '✓ Complete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

export default TaskComponent;
