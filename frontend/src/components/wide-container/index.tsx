import React, {useState } from 'react';

function WideContainer ({ tasks, colour }: { tasks: any[], colour: string }) {

    const [taskList, setTaskList] = useState(tasks);

    // Calculate progress percentage for each task (placeholder logic)
    const getTaskProgress = (taskId: number) => {
        // TODO: Replace with actual progress calculation from API
        // For now, return random progress values for demonstration
        const progressValues = [95, 0, 60, 25, 80]; // Example progress values
        return progressValues[taskId % progressValues.length] || 0;
    };

    return (
        <div className="flex flex-col space-y-4">
            {taskList.map((task) => (
                <div key={task.id} className="p-4 bg-white rounded-lg w-full shadow-sm">
                    <p className="text-gray-500 text-left text-sm mb-1">DUE BY: {task.dueDate}</p>
                    <p className="font-bold text-left text-lg mb-3 truncate">{task.title}</p>
                    
                    {/* Progress bar */}
                    <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                                className={`bg-${colour}-400 h-2 rounded-full`} 
                                style={{ width: `${getTaskProgress(task.id)}%` }}
                            ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-700 text-right">
                            {getTaskProgress(task.id)}%
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );

};

export default WideContainer;