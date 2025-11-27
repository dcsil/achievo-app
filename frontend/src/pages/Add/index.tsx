import React, { useState, useEffect } from 'react';
import { AddTaskComponent } from '../../components/task-add';
import { AddAssignmentComponent } from '../../components/assignment-add';
import { apiService, User } from '../../api-contexts/user-context';

type ViewMode = 'task' | 'assignment';

interface AddPageProps {
  userId?: string; // Passed from Layout
  user?: User | null; // Passed from Layout
  updateUserPoints?: (newPoints: number) => void; // Passed from Layout
}

export const AddPage: React.FC<AddPageProps> = ({ 
  userId: propUserId, 
  user: propUser,
  updateUserPoints 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('task');
  const [showSuccess, setShowSuccess] = useState(false);
  const [user, setUser] = useState<User | null>(propUser || null);
  const [loading, setLoading] = useState(false);

  // Update local user state when prop changes
  useEffect(() => {
    if (propUser) {
      setUser(propUser);
    }
  }, [propUser]);

  // Only fetch user if not provided by Layout
  useEffect(() => {
    if (!propUserId && !propUser) {
      setLoading(true);
      const storedUserId = localStorage.getItem('user_id');
      if (storedUserId) {
        loadUser(storedUserId);
      } else {
        setLoading(false);
      }
    }
  }, [propUserId, propUser]);

  const loadUser = async (uid: string) => {
    try {
      const userData = await apiService.getUser(uid);
      setUser(userData);
    } catch (err) {
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    
    // If updateUserPoints function is available, you can call it here
    // after a task/assignment is created to update the points in real-time
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!propUserId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600">Please log in to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header - Constrained to same width as components */}
        <div className="max-w-2xl mx-auto mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">➕ Add Item </h1>
          <p className="text-gray-600">Create a New Task or Assignment!</p>
        </div>
        
        {/* Toggle Buttons - Constrained to same width as components */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1 shadow-sm">
            <button
              onClick={() => setViewMode('task')}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                viewMode === 'task'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Add Task
            </button>
            <button
              onClick={() => setViewMode('assignment')}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                viewMode === 'assignment'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Add Assignment
            </button>
          </div>
        </div>

        {/* Success Message - Constrained to same width as components */}
        {showSuccess && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-green-100 text-green-800 rounded-lg border border-green-300 animate-fade-in">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">
                {viewMode === 'task' ? 'Task' : 'Assignment'} created successfully!
              </span>
            </div>
          </div>
        )}

        {/* Component Display - Components should handle their own max-width internally */}
        <div className="max-w-2xl mx-auto">
          {viewMode === 'task' ? (
            <AddTaskComponent userId={propUserId} onSuccess={handleSuccess} />
          ) : (
            <AddAssignmentComponent userId={propUserId} onSuccess={handleSuccess} />
          )}
        </div>
      </div>
    </div>
  );
};