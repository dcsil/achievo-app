import React, { useState, useEffect } from 'react';
import AssignmentProgressContainer from '../assignment-progress-container';
import MultipleTaskContainer from '../multiple-task-container';
import { getAssignments, Assignment } from '../../api-contexts/get-assignments';
import { apiService } from '../../api-contexts/user-context';

function CourseContainer ({ name, courseId, color, refreshKey }: { name: string, courseId: string, color: string, refreshKey?: number }) {
    const [assignList, setAssignList] = useState<Assignment[]>([]);
    const [courseTasks, setCourseTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isTasksCollapsed, setIsTasksCollapsed] = useState(true);
    const userId = "paul_paw_test";

    // Fetch assignments when component mounts or courseId changes
    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                setLoading(true);
                setError(null);
                const fetchedAssignments = await getAssignments(courseId.toString(), userId);
                setAssignList(fetchedAssignments);
            } catch (err) {
                setError('Failed to fetch assignments');
                console.error('Error fetching assignments:', err);
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            fetchAssignments();
        }
    }, [courseId, name, refreshKey]);

    // Fetch course tasks that are not in any assignment
    useEffect(() => {
        const fetchCourseTasks = async () => {
            try {
                setTasksLoading(true);
                // Get all tasks for the user
                const allTasks = await apiService.getTasks(userId);
                
                // Filter tasks that belong to this course and have no assignment_id
                const courseSpecificTasks = allTasks.filter((task: any) => 
                    task.course_id === courseId && !task.assignment_id
                );
                
                setCourseTasks(courseSpecificTasks);
            } catch (err) {
                console.error('Error fetching course tasks:', err);
                // Don't set error for tasks to avoid disrupting assignments display
            } finally {
                setTasksLoading(false);
            }
        };

        if (courseId) {
            fetchCourseTasks();
        }
    }, [courseId, refreshKey]);

    // Helper function to group tasks by date
    const groupTasksByDate = (tasks: any[]) => {
        const grouped: { [date: string]: any[] } = {};
        
        tasks.forEach(task => {
            const dateKey = new Date(task.scheduled_start_at).toDateString();
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(task);
        });
        
        // Sort dates
        const sortedDates = Object.keys(grouped).sort((a, b) => 
            new Date(a).getTime() - new Date(b).getTime()
        );
        
        return sortedDates.map(date => ({
            date,
            tasks: grouped[date]
        }));
    };

    const handleTaskCompleted = (taskId: string, taskType: string, pointsEarned: number) => {
        // Remove completed task from local state
        setCourseTasks(prev => prev.filter(task => task.task_id !== taskId));
    };

    const handleTasksUpdate = (updatedTasks: any[]) => {
        setCourseTasks(updatedTasks);
    };

    return (
        <div className={`flex flex-col rounded-lg bg-gradient-to-bl from-${color}-100 to-${color}-200 p-3 pt-5`}>
            <div className="mb-4">
                <span className={`inline-block rounded-full text-sm font-medium text-white bg-${color}-400 py-1 px-3 truncate max-w-full`}>
                    {name || 'Unnamed Course'}
                </span>
            </div>
            
            {/* Assignments Section */}
            <div className="mb-4">
                {loading && (
                    <div className="text-center py-2">
                        <p className="text-gray-500 text-sm">Loading assignments...</p>
                    </div>
                )}
                
                {error && (
                    <div className="text-center py-2">
                        <p className="text-red-500 text-sm">Error loading assignments</p>
                    </div>
                )}
                
                {!loading && !error && assignList.length === 0 && (
                    <div className="text-center py-3">
                        <p className="text-gray-500 text-sm">No assignments found</p>
                        <p className="text-gray-400 text-xs mt-1">Upload your syllabus to populate assignments</p>
                    </div>
                )}
                
                {!loading && !error && assignList.length > 0 && (
                    <div className="w-full">
                        <AssignmentProgressContainer assignments={assignList} color={color} />
                    </div>
                )}
            </div>

            {/* Course Tasks Section */}
            <div>
                {tasksLoading && (
                    <div className="text-center py-2">
                        <p className="text-gray-500 text-sm">Loading course tasks...</p>
                    </div>
                )}
                
                {!tasksLoading && courseTasks.length > 0 && (
                    <div className="w-full">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-700">
                                Other Tasks ({courseTasks.length})
                            </h4>
                            <button
                                onClick={() => setIsTasksCollapsed(!isTasksCollapsed)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <span className="text-xs">
                                    {isTasksCollapsed ? '▼' : '▲'}
                                </span>
                            </button>
                        </div>
                        
                        {!isTasksCollapsed && (
                            <div>
                                {groupTasksByDate(courseTasks).map(({ date, tasks: dateTasks }) => (
                                    <div key={`${courseId}-${date}`} className="mb-3">
                                        <MultipleTaskContainer 
                                            tasks={dateTasks}
                                            userId={userId}
                                            onTaskCompleted={handleTaskCompleted}
                                            onTasksUpdate={(updatedTasks) => {
                                                // Update the specific date group in the course tasks
                                                setCourseTasks(prev => {
                                                    // Remove tasks from this date and add updated ones
                                                    const otherDateTasks = prev.filter(task => 
                                                        new Date(task.scheduled_start_at).toDateString() !== date
                                                    );
                                                    return [...otherDateTasks, ...updatedTasks];
                                                });
                                            }}
                                            showCompleteButton={true}
                                            timeAdjustment={true}
                                            dateString={date}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseContainer;