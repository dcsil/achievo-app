// skinny task container component
// takes in tasks as props and displays them in a skinny container
import React, {useState } from 'react';
import TaskComplete from '../task-complete';

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
                <p className="text-gray-500">No more tasks! Enjoy your free time!</p>
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
                                    <div className="flex flex-col w-20 items-end">
                                        <p className="text-gray-600 w-20 text-sm text-right">{task.dueDate}</p>
                                        <p className="text-gray-600 w-20 text-sm text-right">time due</p>
                                    </div>
                                    <p className={`text-gray-600 w-32 bg-${task.colour}-400 text-sm text-center rounded-full`}>{task.course}</p>
                                </div>
                            )}
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

export default SkinnyContainer;