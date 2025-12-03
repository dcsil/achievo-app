import React from 'react';
import { renderHook } from '@testing-library/react';
import { TasksProvider, useTasks, tasksApiService } from './add-tasks';

global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('TasksProvider', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TasksProvider>{children}</TasksProvider>
  );

  describe('useTasks hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        renderHook(() => useTasks());
      }).toThrow('useTasks must be used within a TasksProvider');
      
      consoleSpy.mockRestore();
    });

    it('should provide tasksApi instance', () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      expect(result.current.tasksApi).toBeDefined();
      expect(typeof result.current.tasksApi.createTask).toBe('function');
      expect(typeof result.current.tasksApi.getTasks).toBe('function');
      expect(typeof result.current.tasksApi.updateTask).toBe('function');
      expect(typeof result.current.tasksApi.completeTask).toBe('function');
      expect(typeof result.current.tasksApi.deleteTask).toBe('function');
    });
  });

  describe('createTask', () => {
    const mockTaskData = {
      task_id: 'task-123',
      user_id: 'user-456',
      description: 'Complete homework',
      type: 'assignment',
      reward_points: 10,
    };

    const mockResponse = {
      status: 'success',
      task_id: 'task-123',
    };

    it('should create task successfully with default is_completed', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      const response = await result.current.tasksApi.createTask(mockTaskData);

      expect(response).toEqual(mockResponse);
      
      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      expect(callBody).toMatchObject({
        ...mockTaskData,
        is_completed: false,
      });
    });

    it('should create task with custom is_completed', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      const customData = {
        ...mockTaskData,
        is_completed: true,
      };

      await result.current.tasksApi.createTask(customData);

      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      expect(callBody.is_completed).toBe(true);
    });

    it('should create task with optional assignment_id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      const dataWithAssignment = {
        ...mockTaskData,
        assignment_id: 'assign-789',
      };

      await result.current.tasksApi.createTask(dataWithAssignment);

      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      expect(callBody.assignment_id).toBe('assign-789');
    });

    it('should create task with optional course_id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      const dataWithCourse = {
        ...mockTaskData,
        course_id: 'course-999',
      };

      await result.current.tasksApi.createTask(dataWithCourse);

      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      expect(callBody.course_id).toBe('course-999');
    });

    it('should create task with scheduled times', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      const dataWithSchedule = {
        ...mockTaskData,
        scheduled_start_at: '2024-12-10T09:00:00Z',
        scheduled_end_at: '2024-12-10T10:00:00Z',
      };

      await result.current.tasksApi.createTask(dataWithSchedule);

      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      expect(callBody.scheduled_start_at).toBe('2024-12-10T09:00:00Z');
      expect(callBody.scheduled_end_at).toBe('2024-12-10T10:00:00Z');
    });

    it('should create task with all optional fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      const fullData = {
        ...mockTaskData,
        assignment_id: 'assign-789',
        course_id: 'course-999',
        scheduled_start_at: '2024-12-10T09:00:00Z',
        scheduled_end_at: '2024-12-10T10:00:00Z',
        is_completed: true,
      };

      await result.current.tasksApi.createTask(fullData);

      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      expect(callBody).toMatchObject(fullData);
    });

    it('should handle create error with error message', async () => {
      const errorMessage = 'User not found';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      await expect(
        result.current.tasksApi.createTask(mockTaskData)
      ).rejects.toThrow(errorMessage);
    });

    it('should handle create error without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      await expect(
        result.current.tasksApi.createTask(mockTaskData)
      ).rejects.toThrow('Failed to create task');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useTasks(), { wrapper });

      await expect(
        result.current.tasksApi.createTask(mockTaskData)
      ).rejects.toThrow('Network error');
    });
  });

  describe('getTasks', () => {
    const mockTasks = [
      {
        task_id: 'task-1',
        user_id: 'user-456',
        description: 'Task 1',
        type: 'assignment',
        is_completed: false,
        reward_points: 10,
      },
      {
        task_id: 'task-2',
        user_id: 'user-456',
        description: 'Task 2',
        type: 'study',
        is_completed: true,
        reward_points: 15,
      },
    ];

    it('should fetch tasks successfully without filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      const tasks = await result.current.tasksApi.getTasks('user-456');

      expect(tasks).toEqual(mockTasks);
      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:5000/db/tasks?user_id=user-456');
    });

    it('should fetch tasks with scheduled_start_at filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      await result.current.tasksApi.getTasks('user-456', {
        scheduled_start_at: '2024-12-10T00:00:00Z',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/db/tasks?user_id=user-456&scheduled_start_at=2024-12-10T00%3A00%3A00Z'
      );
    });

    it('should fetch tasks with scheduled_end_at filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      await result.current.tasksApi.getTasks('user-456', {
        scheduled_end_at: '2024-12-15T23:59:59Z',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/db/tasks?user_id=user-456&scheduled_end_at=2024-12-15T23%3A59%3A59Z'
      );
    });

    it('should fetch tasks with assignment_id filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      await result.current.tasksApi.getTasks('user-456', {
        assignment_id: 'assign-789',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/db/tasks?user_id=user-456&assignment_id=assign-789'
      );
    });

    it('should fetch tasks with is_completed filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      await result.current.tasksApi.getTasks('user-456', {
        is_completed: 'true',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/db/tasks?user_id=user-456&is_completed=true'
      );
    });

    it('should fetch tasks with multiple filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      await result.current.tasksApi.getTasks('user-456', {
        scheduled_start_at: '2024-12-10T00:00:00Z',
        scheduled_end_at: '2024-12-15T23:59:59Z',
        assignment_id: 'assign-789',
        is_completed: 'false',
      });

      const call = mockFetch.mock.calls[0][0] as string;
      expect(call).toContain('user_id=user-456');
      expect(call).toContain('scheduled_start_at=');
      expect(call).toContain('scheduled_end_at=');
      expect(call).toContain('assignment_id=assign-789');
      expect(call).toContain('is_completed=false');
    });

    it('should handle empty results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      const tasks = await result.current.tasksApi.getTasks('user-456');

      expect(tasks).toEqual([]);
    });

    it('should handle fetch error with error message', async () => {
      const errorMessage = 'Invalid user';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      await expect(
        result.current.tasksApi.getTasks('invalid-user')
      ).rejects.toThrow(errorMessage);
    });

    it('should handle fetch error without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      await expect(
        result.current.tasksApi.getTasks('user-456')
      ).rejects.toThrow('Failed to fetch tasks');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useTasks(), { wrapper });

      await expect(
        result.current.tasksApi.getTasks('user-456')
      ).rejects.toThrow('Network error');
    });
  });

  describe('updateTask', () => {
    const taskId = 'task-123';
    const mockResponse = {
      status: 'success',
      task_id: taskId,
    };

    it('should update task description', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      const updates = { description: 'Updated description' };
      const response = await result.current.tasksApi.updateTask(taskId, updates);

      expect(response).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(`http://127.0.0.1:5000/db/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
    });

    it('should update task scheduled_start_at', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      const updates = { scheduled_start_at: '2024-12-20T09:00:00Z' };
      await result.current.tasksApi.updateTask(taskId, updates);

      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      expect(callBody.scheduled_start_at).toBe('2024-12-20T09:00:00Z');
    });

    it('should update task scheduled_end_at', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      const updates = { scheduled_end_at: '2024-12-20T10:00:00Z' };
      await result.current.tasksApi.updateTask(taskId, updates);

      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      expect(callBody.scheduled_end_at).toBe('2024-12-20T10:00:00Z');
    });

    it('should update multiple fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      const updates = {
        description: 'New description',
        scheduled_start_at: '2024-12-20T09:00:00Z',
        scheduled_end_at: '2024-12-20T10:00:00Z',
      };
      await result.current.tasksApi.updateTask(taskId, updates);

      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      expect(callBody).toMatchObject(updates);
    });

    it('should handle empty updates object', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      await result.current.tasksApi.updateTask(taskId, {});

      expect(mockFetch).toHaveBeenCalledWith(`http://127.0.0.1:5000/db/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
    });

    it('should handle update error with error message', async () => {
      const errorMessage = 'Task not found';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      await expect(
        result.current.tasksApi.updateTask(taskId, { description: 'New' })
      ).rejects.toThrow(errorMessage);
    });

    it('should handle update error without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      await expect(
        result.current.tasksApi.updateTask(taskId, { description: 'New' })
      ).rejects.toThrow('Failed to update task');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useTasks(), { wrapper });

      await expect(
        result.current.tasksApi.updateTask(taskId, { description: 'New' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('completeTask', () => {
    const taskId = 'task-123';

    it('should complete task successfully without assignment completion', async () => {
      const mockResponse = {
        status: 'success',
        task_id: taskId,
        assignment_completed: false,
        points_earned: 10,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      const response = await result.current.tasksApi.completeTask(taskId);

      expect(response).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(`http://127.0.0.1:5000/db/tasks/${taskId}/complete`, {
        method: 'POST',
      });
    });

    it('should complete task with assignment completion', async () => {
      const mockResponse = {
        status: 'success',
        task_id: taskId,
        assignment_completed: true,
        assignment_id: 'assign-789',
        points_earned: 40,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      const response = await result.current.tasksApi.completeTask(taskId);

      expect(response.assignment_completed).toBe(true);
      expect(response.assignment_id).toBe('assign-789');
      expect(response.points_earned).toBe(40);
    });

    it('should handle complete error with error message', async () => {
      const errorMessage = 'Task already completed';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      await expect(
        result.current.tasksApi.completeTask(taskId)
      ).rejects.toThrow(errorMessage);
    });

    it('should handle complete error without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      await expect(
        result.current.tasksApi.completeTask(taskId)
      ).rejects.toThrow('Failed to complete task');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useTasks(), { wrapper });

      await expect(
        result.current.tasksApi.completeTask(taskId)
      ).rejects.toThrow('Network error');
    });
  });

  describe('deleteTask', () => {
    const taskId = 'task-123';
    const mockResponse = {
      status: 'success',
      task_id: taskId,
    };

    it('should delete task successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      const response = await result.current.tasksApi.deleteTask(taskId);

      expect(response).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(`http://127.0.0.1:5000/db/tasks/${taskId}`, {
        method: 'DELETE',
      });
    });

    it('should handle delete error with error message', async () => {
      const errorMessage = 'Task not found';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      await expect(
        result.current.tasksApi.deleteTask(taskId)
      ).rejects.toThrow(errorMessage);
    });

    it('should handle delete error without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      await expect(
        result.current.tasksApi.deleteTask(taskId)
      ).rejects.toThrow('Failed to delete task');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useTasks(), { wrapper });

      await expect(
        result.current.tasksApi.deleteTask(taskId)
      ).rejects.toThrow('Network error');
    });
  });

  describe('tasksApiService export', () => {
    it('should export a working API service instance', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'success', task_id: 'test-123' }),
      } as Response);

      const result = await tasksApiService.createTask({
        task_id: 'test-123',
        user_id: 'user-456',
        description: 'Test task',
        type: 'assignment',
        reward_points: 10,
      });

      expect(result.status).toBe('success');
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should be usable without provider context', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const tasks = await tasksApiService.getTasks('user-456');

      expect(Array.isArray(tasks)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in task description', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'success', task_id: 'special-123' }),
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      const data = {
        task_id: 'special-123',
        user_id: 'user-456',
        description: 'Task with "quotes" & <symbols>',
        type: 'other',
        reward_points: 5,
      };

      await result.current.tasksApi.createTask(data);

      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      expect(callBody.description).toBe('Task with "quotes" & <symbols>');
    });

    it('should handle zero reward_points', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'success', task_id: 'zero-123' }),
      } as Response);

      const { result } = renderHook(() => useTasks(), { wrapper });

      const data = {
        task_id: 'zero-123',
        user_id: 'user-456',
        description: 'Zero points task',
        type: 'other',
        reward_points: 0,
      };

      await result.current.tasksApi.createTask(data);

      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      expect(callBody.reward_points).toBe(0);
    });
  });
});