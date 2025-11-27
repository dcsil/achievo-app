import React, { useState, useEffect, useRef } from 'react';
import AssignmentProgressContainer from '../assignment-progress-container';
import MultipleTaskContainer from '../multiple-task-container';
import { getAssignments, Assignment } from '../../api-contexts/get-assignments';
import { apiService } from '../../api-contexts/user-context';

function CourseContainer ({ 
    name, 
    courseId, 
    color, 
    refreshKey,
    onTaskCompleted,
    onRefreshData,
    userId: propUserId
}: { 
    name: string;
    courseId: string;
    color: string;
    refreshKey?: number;
    onTaskCompleted?: (taskId: string, taskType: string, pointsEarned: number, courseId?: string) => void;
    onRefreshData?: () => void;
    userId?: string;
}) {
    const [assignList, setAssignList] = useState<Assignment[]>([]);
    const [courseTasks, setCourseTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isTasksCollapsed, setIsTasksCollapsed] = useState(true);
    const userId = propUserId || "paul_paw_test";
    
    // Track if a task completion is in progress
    const isTaskCompletingRef = useRef(false);

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
            // Don't fetch if we're in the middle of a task completion FROM THIS COMPONENT
            if (isTaskCompletingRef.current) {
                console.log('⏸️ CourseContainer: Skipping fetch - task completion in progress');
                return;
            }
            
            try {
                setTasksLoading(true);
                console.log('🔄 CourseContainer: Fetching course tasks for', courseId);
                // Get all tasks for the user
                const allTasks = await apiService.getTasks(userId);
                
                // Filter tasks that belong to this course and are not completed
                const courseSpecificTasks = allTasks.filter((task: any) => 
                    task.course_id === courseId && 
                    !task.is_completed
                );
                
                console.log(`✅ CourseContainer: Found ${courseSpecificTasks.length} incomplete tasks for course ${courseId}`);
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
    }, [courseId, refreshKey, userId]);


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

    const handleTaskCompleted = (taskId: string, taskType: string, pointsEarned: number, taskCourseId?: string) => {
        console.log('🎯 CourseContainer: Task completed:', taskId);
        
        // Mark that task completion is in progress to prevent premature refetch
        isTaskCompletingRef.current = true;
        
        // Pass to parent component - parent will handle the refresh
        if (onTaskCompleted) {
            onTaskCompleted(taskId, taskType, pointsEarned, taskCourseId || courseId);
        }
        
        // Parent (Home) will refresh after modal closes, which will update refreshKey
        // and trigger our useEffect to re-fetch tasks
    };

    // REMOVED handleTasksUpdate - don't update local state immediately
    // Let the modal show first, then refresh from server after modal closes

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
                        <button
                            onClick={() => setIsTasksCollapsed(!isTasksCollapsed)}
                            className="flex items-center justify-between w-full mb-2 p-2 rounded-md hover:bg-white/50 transition-colors cursor-pointer"
                        >
                            <h4 className="text-sm font-medium text-gray-700">
                                Incomplete Tasks ({courseTasks.length})
                            </h4>
                            <span className="text-gray-500 text-sm">
                                {isTasksCollapsed ? '▼' : '▲'}
                            </span>
                        </button>
                        
                        {!isTasksCollapsed && (
                            <div>
                                {groupTasksByDate(courseTasks).map(({ date, tasks: dateTasks }) => (
                                    <div key={`${courseId}-${date}`} className="mb-3">
                                        <MultipleTaskContainer 
                                            tasks={dateTasks}
                                            userId={userId}
                                            onTaskCompleted={handleTaskCompleted}
                                            onRefreshData={onRefreshData}
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