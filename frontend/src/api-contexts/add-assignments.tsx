import React, { createContext, useContext, ReactNode } from 'react';

// Assignment interface based on your backend structure
export interface Assignment {
  assignment_id: string;
  course_id: string;
  title: string;
  due_date: string;
  completion_points: number;
  is_complete: boolean;
  actual_completion_date?: string;
}

// API service for assignments
class AssignmentsApiService {
  private baseUrl = 'http://127.0.0.1:5000';

  async createAssignment(
    assignmentData: Omit<Assignment, 'is_complete' | 'completion_points'> & { 
      is_complete?: boolean;
      completion_points?: number;
    }
  ): Promise<{ status: string; assignment_id: string }> {
    const response = await fetch(`${this.baseUrl}/db/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...assignmentData,
        is_complete: assignmentData.is_complete || false,
        completion_points: assignmentData.completion_points || 30, // Default 30 points for assignments
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create assignment');
    }

    return response.json();
  }

  async updateAssignment(
    assignmentId: string,
    updates: {
      title?: string;
      due_date?: string;
    }
  ): Promise<{ status: string; assignment_id: string }> {
    const response = await fetch(`${this.baseUrl}/db/assignments/${assignmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update assignment');
    }

    return response.json();
  }
}

// Context
interface AssignmentsContextType {
  assignmentsApi: AssignmentsApiService;
}

const AssignmentsContext = createContext<AssignmentsContextType | undefined>(undefined);

// Provider component
interface AssignmentsProviderProps {
  children: ReactNode;
}

export const AssignmentsProvider: React.FC<AssignmentsProviderProps> = ({ children }) => {
  const assignmentsApi = new AssignmentsApiService();

  return (
    <AssignmentsContext.Provider value={{ assignmentsApi }}>
      {children}
    </AssignmentsContext.Provider>
  );
};

// Hook to use the context
export const useAssignments = (): AssignmentsContextType => {
  const context = useContext(AssignmentsContext);
  if (!context) {
    throw new Error('useAssignments must be used within an AssignmentsProvider');
  }
  return context;
};

// Export the API service instance for direct use
export const assignmentsApiService = new AssignmentsApiService();