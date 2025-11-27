// TaskContainer component - updated with backend integration
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { apiService } from '../../api-contexts/user-context';
import TaskComplete from '../task-complete';
import TaskComponent from '../task-component';
import { getAssignment } from '../../api-contexts/get-assignments';

interface MultipleTaskContainerProps {
  tasks: any[];
  userId: string;
  onTaskCompleted?: (taskId: string, taskType: string, pointsEarned: number, courseId?: string) => void;
  onTasksUpdate?: (tasks: any[]) => void;
  onRefreshData?: () => void;
  showCompleteButton?: boolean;
  dateString?: string;
  timeAdjustment?: boolean;  // UTC to EST?
}

function MultipleTaskContainer({ tasks, userId, onTaskCompleted, onTasksUpdate, onRefreshData, showCompleteButton = true, dateString, timeAdjustment = true }: MultipleTaskContainerProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [taskList, setTaskList] = useState(Array.isArray(tasks) ? tasks : []);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [selectedTaskWithAssignment, setSelectedTaskWithAssignment] = useState<any>(null);
  const [tasksToShow, setTasksToShow] = useState(5);
  const initialTasksPerPage = 5;
  const tasksPerIncrement = 3;
  
  // Use ref to track overlay state independently of React's render cycle
  const overlayDataRef = useRef<{
    show: boolean;
    task: any;
    points: number;
  } | null>(null);

  // Sync local state with parent's tasks prop
  useEffect(() => {
    // Ensure tasks is always an array
    if (Array.isArray(tasks)) {
      setTaskList(tasks);
      // Reset to initial view when tasks change
      setTasksToShow(initialTasksPerPage);
    } else {
      console.error('MultipleTaskContainer received non-array tasks:', tasks);
      setTaskList([]);
      setTasksToShow(initialTasksPerPage);
    }
  }, [tasks]);

  // Show more/collapse logic
  const displayedTasks = taskList.slice(0, tasksToShow);
  const hasMoreTasks = taskList.length > tasksToShow;
  const canShowMore = tasksToShow < taskList.length;
  const canCollapse = tasksToShow > initialTasksPerPage;

  const handleShowMore = () => {
    setTasksToShow(prev => Math.min(prev + tasksPerIncrement, taskList.length));
  };

  const handleCollapse = () => {
    setTasksToShow(initialTasksPerPage);
  };

  const handleCompleteTask = async (task: any) => {
    if (isCompleting) {
      console.log('⚠️ Already completing a task, ignoring click');
      return;
    }
    
    console.log('🎯 Starting task completion:', task.task_id);
    
    try {
      setIsCompleting(true);
      
      // Call backend to complete the task
      const response = await apiService.completeTask(task.task_id);
      let totalPointsEarned = response.points_earned;
      let endMessage = `Task completed. Points earned: ${response.points_earned}`;
      let completedAssignmentTitle: string | null = null;

      // check if assignment was completed
      if (response.assignment_completed && task.assignment_id) {
        
        // grab assignment points from backend
        const assignmentResponse = await getAssignment(task.assignment_id);

        totalPointsEarned += assignmentResponse.completion_points;
        endMessage += `\nAssignment completed! Additional points earned: ${assignmentResponse.completion_points}`;
        console.log(`Assignment completed. Additional points earned: ${assignmentResponse.completion_points}`);
        completedAssignmentTitle = assignmentResponse.title;
        console.log(`Assignment: ${assignmentResponse.title}`);
      }

      console.log(`About to set assignment title: ${completedAssignmentTitle}`);

      // Store overlay data in ref FIRST - this persists across renders
      overlayDataRef.current = {
        show: true,
        task: {
          ...task,
          completedAssignmentTitle: completedAssignmentTitle
        },
        points: totalPointsEarned
      };

      // Remove task from local state
      const updatedTasks = taskList.filter(t => t.task_id !== task.task_id);
      
      // Adjust tasksToShow if needed after removing task
      let newTasksToShow = tasksToShow;
      if (updatedTasks.length <= initialTasksPerPage) {
        newTasksToShow = initialTasksPerPage;
      } else if (tasksToShow > updatedTasks.length) {
        newTasksToShow = updatedTasks.length;
      }
      
      // Update task list
      setTaskList(updatedTasks);
      setTasksToShow(newTasksToShow);
      
      // Now trigger overlay with state
      setPointsEarned(totalPointsEarned);
      setSelectedTaskWithAssignment({
        ...task,
        completedAssignmentTitle: completedAssignmentTitle
      });
      setShowOverlay(true);
      
      console.log('🎉 Overlay data stored and state updated');
      
      // Notify parent component
      if (onTaskCompleted) {
        onTaskCompleted(task.task_id, task.type, response.points_earned, task.course_id);
      }
      
      if (onTasksUpdate) {
        onTasksUpdate(updatedTasks);
      }

      console.log(endMessage);

    } catch (error) {
      console.error('❌ Failed to complete task:', error);
      setIsCompleting(false);
      overlayDataRef.current = null;
      alert('Failed to complete task. Please try again.');
    }
  };

  const handleCloseOverlay = () => {
    console.log('🔒 Closing overlay - called by:', new Error().stack);
    setShowOverlay(false);
    setIsCompleting(false);
    setSelectedTaskWithAssignment(null);
    overlayDataRef.current = null;
  };

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Render overlay using portal to ensure it's always on top
  const renderOverlay = () => {
    // Use ref data as source of truth
    const overlayData = overlayDataRef.current;
    
    if (!overlayData || !overlayData.show) {
      console.log('🚫 Overlay not rendering - ref check:', overlayData);
      return null;
    }

    // Also check state as fallback
    if (!selectedTaskWithAssignment || !showOverlay) {
      console.log('🚫 Overlay not rendering - state check:', { 
        hasTask: !!selectedTaskWithAssignment, 
        showOverlay 
      });
      return null;
    }

    console.log('✅ Rendering overlay with portal:', {
      taskId: overlayData.task.task_id,
      assignmentTitle: overlayData.task.completedAssignmentTitle,
      points: overlayData.points
    });

    const overlayContent = (
      <TaskComplete 
        isOpen={true}
        task={{
          title: overlayData.task.description,
          course_color: overlayData.task.course_color,
          id: overlayData.task.task_id
        }}
        assignment={overlayData.task.completedAssignmentTitle}
        onClose={handleCloseOverlay}
        onRefreshData={onRefreshData}
        coinsEarned={overlayData.points}
        userId={userId}
      />
    );

    // Use portal to render at document body level
    return ReactDOM.createPortal(
      overlayContent,
      document.body
    );
  };

  return (
    <div>
      {taskList.length === 0 ? (
        <div className={`text-center py-6 px-4 rounded-xl border-2 border-dashed ${
          showCompleteButton 
            ? 'bg-orange-50 border-orange-200' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="text-3xl mb-2">{showCompleteButton ? '🎉' : '📂'}</div>
          <p className="text-gray-700 font-semibold text-sm">
            {showCompleteButton ? 'No tasks yet!' : 'No completed tasks yet!'}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {showCompleteButton ? 'You\'re all caught up' : 'Complete some tasks to see them here'}
          </p>
        </div>
      ) : (
        <div>
          {dateString && (
            <h3 className="text-lg font-medium text-gray-700 mb-2 border-b border-gray-200 pb-1">
              {formatDateForDisplay(dateString)}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({tasks.length} task{tasks.length !== 1 ? 's' : ''})
              </span>
            </h3>
          )}
          
          <ul className="space-y-2">
            {Array.isArray(displayedTasks) ? displayedTasks.map((task) => (
              <TaskComponent
                key={task.task_id}
                task={task}
                onCompleteTask={handleCompleteTask}
                showCompleteButton={showCompleteButton}
                isCompleting={isCompleting}
                timeAdjustment={timeAdjustment}
              />
            )) : (
              <li>
                <div className="text-center py-4 text-red-500">
                  Error: Invalid task data received
                </div>
              </li>
            )}
          </ul>
          
          {/* Show More / Collapse Controls */}
          {(hasMoreTasks || canCollapse) && (
            <div className="flex justify-center mt-4 gap-2">
              {canCollapse && (
                <button
                  onClick={handleCollapse}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center gap-2"
                >
                  <span>▲</span>
                  Collapse
                </button>
              )}
              {canShowMore && (
                <button
                  onClick={handleShowMore}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center gap-2"
                >
                  <span>▼</span>
                  Show {Math.min(tasksPerIncrement, taskList.length - tasksToShow)} More Tasks
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Task Completion Overlay - Rendered via Portal */}
      {renderOverlay()}
    </div>
  );
}

export default MultipleTaskContainer;