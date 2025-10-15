import React, { useState, useEffect } from 'react';
import AssignmentProgressContainer from '../assignment-progress-container';
import { getAssignments, Assignment } from '../../api-contexts/get-assignments';

function CourseContainer ({ name, courseId, colour }: { name: string, courseId: number, colour: string }) {
    const [assignList, setAssignList] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch assignments when component mounts or courseId changes
    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                setLoading(true);
                setError(null);
                const fetchedAssignments = await getAssignments(courseId.toString());
                setAssignList(fetchedAssignments);
            } catch (err) {
                setError('Failed to fetch assignments');
                console.error('Error fetching assignments:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignments();
    }, [courseId, name]);

    // Convert Assignment objects to the format expected by AssignmentProgressContainer
    const formattedAssignments = assignList.map((assignment, index) => ({
        id: index + 1,
        title: assignment.title,
        dueDate: assignment.due_date,
        course: name
    }));

    return (
        <div className={`flex flex-col rounded-lg bg-gradient-to-bl from-${colour}-100 to-${colour}-200 p-3 pt-5`}>
            <div className="mb-4">
                <span className={`inline-block rounded-full text-sm font-medium text-white bg-${colour}-400 py-1 px-3 truncate max-w-full`}>{name}</span>
            </div>
            <div>
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
                
                {!loading && (
                    <div className="w-full">
                        <AssignmentProgressContainer tasks={formattedAssignments} colour={colour} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseContainer;