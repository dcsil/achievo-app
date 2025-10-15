// TaskContainer component - updated with backend integration
import React, { useState, useEffect } from 'react';
import { apiService } from '../../api-contexts/user-context';
import TaskComplete from '../task-complete';

interface TaskContainerProps {
  tasks: any[];
  userId: string;
  onTaskCompleted?: (taskId: string, pointsEarned: number, courseId?: string) => void;
  onTasksUpdate?: (tasks: any[]) => void;
}

function TaskContainer({ tasks, userId, onTaskCompleted, onTasksUpdate }: TaskContainerProps) {
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskList, setTaskList] = useState(tasks);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  // Sync local state with parent's tasks prop
  useEffect(() => {
    setTaskList(tasks);
  }, [tasks]);

  const handleCompleteTask = async (task: any) => {
    if (isCompleting) return;
    
    try {
      setIsCompleting(true);
      setSelectedTask(task);
      
      // Call backend to complete the task
      const response = await apiService.completeTask(task.task_id);
      
      // Set the points earned for the overlay
      setPointsEarned(response.points_earned);
      
      // Show the completion overlay
      setShowOverlay(true);
      
      // Remove task from local state
      const updatedTasks = taskList.filter(t => t.task_id !== task.task_id);
      setTaskList(updatedTasks);
      
      // Notify parent component
      if (onTaskCompleted) {
        onTaskCompleted(task.task_id, response.points_earned, task.course_id);
      }
      
      if (onTasksUpdate) {
        onTasksUpdate(updatedTasks);
      }
      
      console.log(`Task completed. Points earned: ${response.points_earned}`);
      
      if (response.assignment_completed) {
        console.log(`🎉 Assignment ${response.assignment_id} also completed!`);
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
      setIsCompleting(false);
      alert('Failed to complete task. Please try again.');
    }
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
    setSelectedTask(null);
    setIsCompleting(false);
  };

  return (
    <div>
      {taskList.length === 0 ? (
        <div className="text-center py-6 px-4 bg-orange-50 rounded-xl border-2 border-dashed border-orange-200">
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-gray-700 font-semibold text-sm">No tasks yet!</p>
          <p className="text-gray-500 text-xs mt-1">You're all caught up</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {taskList.map((task) => (
            <li 
              key={task.task_id} 
              onMouseEnter={() => setHoveredTaskId(task.task_id)}
              onMouseLeave={() => setHoveredTaskId(null)}
            >
              <div className={`w-full border-2 border-${task.course_color}-200 bg-white rounded-xl transition-all duration-300 ease-in-out ${
                hoveredTaskId === task.task_id ? 'shadow-lg border-orange-300 scale-[1.01]' : 'shadow-sm'
              }`}>
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
                    <p className="text-lg font-bold text-gray-900">
                      {new Date(task.scheduled_end_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">due</p>
                  </div>
                </div>

                {/* Task actions - shown on hover */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  hoveredTaskId === task.task_id 
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
                        onClick={() => handleCompleteTask(task)}
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
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {/* Task Completion Overlay */}
      {selectedTask && (
        <TaskComplete 
          isOpen={showOverlay}
          task={{
            title: selectedTask.description,
            id: selectedTask.task_id
          }}
          onClose={handleCloseOverlay}
          coinsEarned={pointsEarned}
          userId={userId}
        />
      )}
    </div>
  );
}

export default TaskContainer;