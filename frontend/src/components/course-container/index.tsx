import React, {useState } from 'react';
import WideContainer from '../wide-container';

function CourseContainer ({ name, courseId, colour }: { name: string, courseId: number, colour: string }) {

    // grab tasks from API based on course name
    // for now, use dummy data
    const [tasks, setTasks] = useState([
        { id: 1, title: 'longlonglonglonglonglonglonglonglonglonglong', dueDate: '2023-10-01', course: name },
        { id: 2, title: 'Task 2', dueDate: '2023-10-02', course: name },
        { id: 3, title: 'Task 3', dueDate: '2023-10-03', course: name }
    ]);
    
    return (
        <div className={`flex flex-col rounded-lg bg-gradient-to-bl from-${colour}-100 to-${colour}-200 p-3 pt-5` }>
            <div className="mb-4">
                <p className={`rounded-full text-sm text-center w-24 text-white bg-${colour}-400 px-2`}>{name}</p>
            </div>
            <div>
                <div className="w-full">
                    <WideContainer tasks={tasks} colour={colour} />
                </div>
            </div>
        </div>
    );
};

export default CourseContainer;