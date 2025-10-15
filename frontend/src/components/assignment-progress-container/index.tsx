import React, {useState } from 'react';

interface Assignment {
  assignment_id: string;
  course_id: string;
  title: string;
  due_date: string;
  completion_points: number;
  is_complete: boolean;
  task_count?: number;
  completed_task_count?: number;
}

function AssignmentProgressContainer ({ assignments, color }: { assignments: Assignment[], color: string }) {

    const [assignList, setAssignList] = useState(assignments);

    // Calculate progress percentage for each assignment based on task completion
    const getAssignmentProgress = (assignment: Assignment) => {
        // If assignment has tasks, calculate based on completed vs total tasks
        if (assignment.task_count && assignment.task_count > 0) {
            const completedCount = assignment.completed_task_count || 0;
            return Math.round((completedCount / assignment.task_count) * 100);
        }
        
        // For assignments with no tasks, use assignment completion status
        return assignment.is_complete ? 100 : 0;
    };

    return (
        <div className="flex flex-col space-y-2">
            {assignList.map((assign) => (
                <div key={assign.assignment_id} className="p-4 bg-white rounded-lg w-full shadow-sm">
                    <p className="text-gray-500 text-left text-sm mb-1">DUE BY: {assign.due_date}</p>
                    <p className="font-semibold text-left text-base mb-3 truncate">{assign.title}</p>

                    {/* Progress bar */}
                    <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                                className={`bg-${color}-400 h-2 rounded-full`} 
                                style={{ width: `${getAssignmentProgress(assign)}%` }}
                            ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700 text-right">
                            {getAssignmentProgress(assign)}%
                        </span>
                    </div>
                    
                    {/* Task count info */}
                    {assign.task_count && assign.task_count > 0 ? (
                        <p className="text-xs text-gray-500 mt-1">
                            {assign.completed_task_count || 0} of {assign.task_count} tasks completed
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500 mt-1">
                            {assign.is_complete ? 1 : 0} of 1 task completed
                        </p>
                    )}
                </div>
            ))}
        </div>
    );

};

export default AssignmentProgressContainer;