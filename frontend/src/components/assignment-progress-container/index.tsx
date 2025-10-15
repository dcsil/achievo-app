import React, {useState } from 'react';

function AssignmentProgressContainer ({ tasks, colour }: { tasks: any[], colour: string }) {

    const [assignList, setAssignList] = useState(tasks);

    // Calculate progress percentage for each task (placeholder logic)
    const getTaskProgress = (taskId: number) => {
        // TODO: Replace with actual progress calculation from API
        // For now, return random progress values for demonstration
        const progressValues = [95, 0, 60, 25, 80]; // Example progress values
        return progressValues[taskId % progressValues.length] || 0;
    };

    return (
        <div className="flex flex-col space-y-2">
            {assignList.map((assign) => (
                <div key={assign.id} className="p-4 bg-white rounded-lg w-full shadow-sm">
                    <p className="text-gray-500 text-left text-sm mb-1">DUE BY: {assign.dueDate}</p>
                    <p className="font-semibold text-left text-base mb-3 truncate">{assign.title}</p>

                    {/* Progress bar */}
                    <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                                className={`bg-${colour}-400 h-2 rounded-full`} 
                                style={{ width: `${getTaskProgress(assign.id)}%` }}
                            ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700 text-right">
                            {getTaskProgress(assign.id)}%
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );

};

export default AssignmentProgressContainer;