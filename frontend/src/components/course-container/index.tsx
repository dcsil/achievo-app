import React, {useState } from 'react';
import AssignmentProgressContainer from '../assignment-progress-container';

function CourseContainer ({ name, courseId, colour }: { name: string, courseId: number, colour: string }) {

    // grab tasks from API based on course name
    // for now, use dummy data
    const [assignList, setAssignList] = useState([
        { id: 1, title: 'longlonglonglonglonglonglonglonglonglonglong', dueDate: '2023-10-01', course: name },
        { id: 2, title: 'Assignment 2', dueDate: '2023-10-02', course: name },
        { id: 3, title: 'Assignment 3', dueDate: '2023-10-03', course: name }
    ]);

    return (
        <div className={`flex flex-col rounded-lg bg-gradient-to-bl from-${colour}-100 to-${colour}-200 p-3 pt-5`}>
            <div className="mb-4">
                <span className={`inline-block rounded-full text-sm font-medium text-white bg-${colour}-400 py-1 px-3 truncate max-w-full`}>{name}</span>
            </div>
            <div>
                <div className="w-full">
                    <AssignmentProgressContainer tasks={assignList} colour={colour} />
                </div>
            </div>
        </div>
    );
};

export default CourseContainer;