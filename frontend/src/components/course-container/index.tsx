import React, { useState, useEffect } from 'react';
import AssignmentProgressContainer from '../assignment-progress-container';
import { getAssignments, Assignment } from '../../api-contexts/get-assignments';

function CourseContainer ({ name, courseId, color, refreshKey }: { name: string, courseId: string, color: string, refreshKey?: number }) {
    const [assignList, setAssignList] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch assignments when component mounts or courseId changes
    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                setLoading(true);
                setError(null);
                const fetchedAssignments = await getAssignments(courseId.toString(), "paul_paw_test");
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

    return (
        <div className={`flex flex-col rounded-lg bg-gradient-to-bl from-${color}-100 to-${color}-200 p-3 pt-5`}>
            <div className="mb-4">
                <span className={`inline-block rounded-full text-sm font-medium text-white bg-${color}-400 py-1 px-3 truncate max-w-full`}>
                    {name || 'Unnamed Course'}
                </span>
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
                
                {!loading && !error && assignList.length === 0 && (
                    <div className="text-center py-3">
                        <p className="text-gray-500 text-sm">No assignments found</p>
                        <p className="text-gray-400 text-xs mt-1">Upload your timetable or syllabus to populate assignments</p>
                    </div>
                )}
                
                {!loading && !error && assignList.length > 0 && (
                    <div className="w-full">
                        <AssignmentProgressContainer assignments={assignList} color={color} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseContainer;