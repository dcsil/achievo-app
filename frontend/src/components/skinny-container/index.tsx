// skinny task container component
// takes in tasks as props and displays them in a skinny container
import React, {useState } from 'react';
// TODO: Import TaskCompletionOverlay component when implemented
// import TaskCompletionOverlay from '../task-completion-overlay';

function SkinnyContainer({ tasks }: { tasks: any[] }) {
    // feed in tasks from API call into component
    // for now, use dummy data
    const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null);
    const [showOverlay, setShowOverlay] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [taskList, setTaskList] = useState(tasks);

    // Placeholder API call to remove task from database
    const removeTaskFromDatabase = async (taskId: number) => {
        try {
            // TODO: Replace with actual API call
            // const response = await fetch(`/api/tasks/${taskId}`, {
            //     method: 'DELETE',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            // });
            // 
            // if (!response.ok) {
            //     throw new Error('Failed to delete task');
            // }
            
            console.log(`Placeholder API call: Removing task ${taskId} from database`);
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return { success: true };
        } catch (error) {
            console.error('Error removing task from database:', error);
            throw error;
        }
    };

    const handleCompleteTask = async (task: any) => {
        setSelectedTask(task);
        setShowOverlay(true);
        
        try {
            // Remove task from database (placeholder API call)
            await removeTaskFromDatabase(task.id);
            
            // Remove task from local state
            setTaskList(prevTasks => prevTasks.filter(t => t.id !== task.id));
            
            console.log(`Task "${task.title}" completed and removed from list`);
        } catch (error) {
            console.error('Failed to complete task:', error);
            // You could show an error message to the user here
        }
    };

	return (
        <div>
            {taskList.length === 0 ? (
                <p className="text-gray-500">No tasks for today! Enjoy your free time!</p>
            ) : (
                <ul className="space-y-1">
                    {taskList.map((task) => (
                        <li 
                            key={task.id} 
                            className="flex flex-row items-center space-x-4 w-full"
                            onMouseEnter={() => setHoveredTaskId(task.id)}
                            onMouseLeave={() => setHoveredTaskId(null)}
                        >
                            {hoveredTaskId === task.id ? (
                                <div className="flex flex-row items-center space-x-1 w-full">
                                    <div className="flex flex-row w-full items-center p-2 border border-gray-200 rounded-lg min-w-0 h-12">
                                        <p className="font-semibold text-lg w-full text-left truncate">{task.title}</p>
                                        {/* <p className="text-gray-600 w-48 text-sm text-right">{task.dueDate}</p> */}
                                    </div>
                                    <div className="flex-shrink-0 w-24 h-12"> 
                                        <button
                                            onClick={() => handleCompleteTask(task)}
                                            className="text-white font-semibold text-sm bg-gradient-to-bl from-orange-300 to-orange-500 rounded-lg w-full h-full hover:shadow-lg"
                                        >
                                            COMPLETE
                                        </button>    
                                    </div>                                    
                                </div>
                            ) : (
                                <div className="flex flex-row content-start items-center space-x-2 w-full p-2 border border-gray-200 rounded-lg h-12">
                                    <p className="font-semibold text-lg w-full text-left truncate">{task.title}</p>
                                    <p className="text-gray-600 w-48 text-sm text-right">{task.dueDate}</p>
                                    <p className={`text-gray-600 w-40 bg-${task.colour}-400 text-sm rounded-full`}>{task.course}</p>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            
            {/* TODO: Replace with TaskCompletionOverlay component */}
            {showOverlay && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Placeholder Overlay</h3>
                        <p className="text-gray-600 mb-4">
                            This will be replaced with the TaskCompletionOverlay component.
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Selected task: {selectedTask?.title || 'Unknown'}
                        </p>
                        <button
                            onClick={() => setShowOverlay(false)}
                            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors duration-200"
                        >
                            Close Placeholder
                        </button>
                    </div>
                </div>
            )}
            {/* 
            Future implementation:
            <TaskCompletionOverlay 
                isOpen={showOverlay}
                task={selectedTask}
                onClose={() => setShowOverlay(false)}
                onComplete={(task) => {
                    // Handle task completion logic
                    setShowOverlay(false);
                }}
            />
            */}
        </div>
    );
}

export default SkinnyContainer;