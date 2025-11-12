import React, { createContext, useContext, ReactNode } from 'react';

// Task interface based on your backend structure
export interface Task {
  task_id: string;
  user_id: string;
  description: string;
  type: string;
  assignment_id?: string;
  course_id?: string;
  scheduled_start_at?: string;
  scheduled_end_at?: string;
  is_completed: boolean;
  reward_points: number;
}

// API service for tasks
class TasksApiService {
  private baseUrl = 'http://127.0.0.1:5000';

  async createTask(taskData: Omit<Task, 'is_completed'> & { is_completed?: boolean }): Promise<{ status: string; task_id: string }> {
    const response = await fetch(`${this.baseUrl}/db/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...taskData,
        is_completed: taskData.is_completed || false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create task');
    }

    return response.json();
  }

  async getTasks(
    userId: string,
    filters?: {
      scheduled_start_at?: string;
      scheduled_end_at?: string;
      assignment_id?: string;
      is_completed?: string;
    }
  ): Promise<Task[]> {
    const params = new URLSearchParams({
      user_id: userId,
      ...filters,
    });

    const response = await fetch(`${this.baseUrl}/db/tasks?${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch tasks');
    }

    return response.json();
  }

  async updateTask(
    taskId: string,
    updates: {
      description?: string;
      scheduled_start_at?: string;
      scheduled_end_at?: string;
    }
  ): Promise<{ status: string; task_id: string }> {
    const response = await fetch(`${this.baseUrl}/db/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update task');
    }

    return response.json();
  }

  async completeTask(taskId: string): Promise<{
    status: string;
    task_id: string;
    assignment_completed: boolean;
    assignment_id?: string;
    points_earned: number;
  }> {
    const response = await fetch(`${this.baseUrl}/db/tasks/${taskId}/complete`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete task');
    }

    return response.json();
  }

  async deleteTask(taskId: string): Promise<{ status: string; task_id: string }> {
    const response = await fetch(`${this.baseUrl}/db/tasks/${taskId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete task');
    }

    return response.json();
  }
}

// Context
interface TasksContextType {
  tasksApi: TasksApiService;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

// Provider component
interface TasksProviderProps {
  children: ReactNode;
}

export const TasksProvider: React.FC<TasksProviderProps> = ({ children }) => {
  const tasksApi = new TasksApiService();

  return (
    <TasksContext.Provider value={{ tasksApi }}>
      {children}
    </TasksContext.Provider>
  );
};

// Hook to use the context
export const useTasks = (): TasksContextType => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};

// Export the API service instance for direct use
export const tasksApiService = new TasksApiService();