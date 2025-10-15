// skinny task container component
// takes in tasks as props and displays them in a skinny container
import React, {useState } from 'react';
import TaskComplete from '../task-complete';

function TaskContainer ({ tasks }: { tasks: any[] }) {
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

            // TODO: should also update course components task list if applicable
            
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
                <p className="text-gray-500">No more tasks! Enjoy your free time!</p>
            ) : (
                <ul className="space-y-1">
                    {taskList.map((task) => (
                        <li 
                            key={task.id} 
                            onMouseEnter={() => setHoveredTaskId(task.id)}
                            onMouseLeave={() => setHoveredTaskId(null)}
                        >
                            <div className={`w-full border border-gray-200 bg-white rounded-xl transition-all duration-300 ease-in-out ${
                                hoveredTaskId === task.id
                            }`}>
                                {/* Task header - always visible */}
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-base p-2 text-gray-900 truncate">{task.title}</h3>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2 pr-1">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600">{task.dueDate}</p>
                                            <p className="text-xs text-gray-500">due time</p>
                                        </div>
                                        <span className={`px-2 py-1 text-sm font-medium text-white rounded-full bg-${task.color}-400 whitespace-nowrap`}>
                                            {task.course}
                                        </span>
                                    </div>
                                </div>

                                {/* Task description and complete button - shown on hover */}
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                    hoveredTaskId === task.id 
                                        ? `max-h-32 opacity-100 transform translate-y-0` 
                                        : `max-h-0 opacity-0 transform -translate-y-2`
                                }`}>
                                    <div className={`p-3 rounded-b-lg bg-gradient-to-bl bg-${task.color}-100 to-${task.color}-200`}>
                                        <div className="flex flex-row w-full">
                                            {/* Task description */}
                                            <div className="flex-1 mr-4">
                                                <p className="text-sm text-gray-600 leading-relaxed">
                                                    {task.description || "[task description]"}
                                                </p>
                                            </div>

                                            {/* Complete button */}
                                            <div className="flex justify-end w-24 h-12">
                                                <button
                                                    onClick={() => handleCompleteTask(task)}
                                                    className="text-white font-semibold text-base bg-gradient-to-bl from-orange-300 to-orange-500 rounded-lg w-full h-full hover:shadow-lg transition-all duration-200"
                                                >
                                                    COMPLETE
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            
            {/* Task Completion Overlay */}
            <TaskComplete 
                isOpen={showOverlay}
                task={selectedTask}
                onClose={() => setShowOverlay(false)}
                coinsEarned={Math.floor(Math.random() * 200) + 50} // Random coins between 50-250
                totalGold={1347 + Math.floor(Math.random() * 500)} // Simulated total with some variation
            />
        </div>
    );
}

export default TaskContainer;