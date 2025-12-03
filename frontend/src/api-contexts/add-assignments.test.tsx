import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { AssignmentsProvider, useAssignments, assignmentsApiService } from './add-assignments';

global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('AssignmentsProvider', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AssignmentsProvider>{children}</AssignmentsProvider>
  );

  describe('useAssignments hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        renderHook(() => useAssignments());
      }).toThrow('useAssignments must be used within an AssignmentsProvider');
      
      consoleSpy.mockRestore();
    });

    it('should provide assignmentsApi instance', () => {
      const { result } = renderHook(() => useAssignments(), { wrapper });

      expect(result.current.assignmentsApi).toBeDefined();
      expect(typeof result.current.assignmentsApi.createAssignment).toBe('function');
      expect(typeof result.current.assignmentsApi.updateAssignment).toBe('function');
    });
  });

  describe('createAssignment', () => {
    const mockAssignmentData = {
      assignment_id: 'assign-123',
      course_id: 'course-456',
      title: 'Math Homework',
      due_date: '2024-12-15T23:59:59Z',
    };

    const mockResponse = {
      status: 'success',
      assignment_id: 'assign-123',
    };

    it('should create assignment successfully with default values', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useAssignments(), { wrapper });

      const response = await result.current.assignmentsApi.createAssignment(mockAssignmentData);

      expect(response).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:5000/db/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...mockAssignmentData,
          is_complete: false,
          completion_points: 30,
        }),
      });
    });

    it('should create assignment with custom completion_points', async () => {
        mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        } as Response);

        const { result } = renderHook(() => useAssignments(), { wrapper });

        const customData = {
            ...mockAssignmentData,
            completion_points: 50,
        };

        await result.current.assignmentsApi.createAssignment(customData);

        expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:5000/db/assignments', 
            expect.objectContaining({
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            })
        );

        const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
        expect(callBody).toMatchObject({
            ...mockAssignmentData,
            is_complete: false,
            completion_points: 50,
        });
    });

    it('should create assignment with custom is_complete', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useAssignments(), { wrapper });

      const customData = {
        ...mockAssignmentData,
        is_complete: true,
      };

      await result.current.assignmentsApi.createAssignment(customData);

      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:5000/db/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...mockAssignmentData,
          is_complete: true,
          completion_points: 30,
        }),
      });
    });

    it('should create assignment with both custom values', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useAssignments(), { wrapper });

      const customData = {
        ...mockAssignmentData,
        is_complete: true,
        completion_points: 100,
      };

      await result.current.assignmentsApi.createAssignment(customData);

      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:5000/db/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...mockAssignmentData,
          is_complete: true,
          completion_points: 100,
        }),
      });
    });

    it('should handle create error with error message', async () => {
      const errorMessage = 'Course not found';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      } as Response);

      const { result } = renderHook(() => useAssignments(), { wrapper });

      await expect(
        result.current.assignmentsApi.createAssignment(mockAssignmentData)
      ).rejects.toThrow(errorMessage);
    });

    it('should handle create error without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useAssignments(), { wrapper });

      await expect(
        result.current.assignmentsApi.createAssignment(mockAssignmentData)
      ).rejects.toThrow('Failed to create assignment');
    });

    it('should handle network error during create', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAssignments(), { wrapper });

      await expect(
        result.current.assignmentsApi.createAssignment(mockAssignmentData)
      ).rejects.toThrow('Network error');
    });

    it('should handle assignment with actual_completion_date', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useAssignments(), { wrapper });

      const dataWithCompletion = {
        ...mockAssignmentData,
        actual_completion_date: '2024-12-10T10:30:00Z',
      };

      await result.current.assignmentsApi.createAssignment(dataWithCompletion);

      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:5000/db/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...dataWithCompletion,
          is_complete: false,
          completion_points: 30,
        }),
      });
    });
  });

  describe('updateAssignment', () => {
    const assignmentId = 'assign-123';
    const mockResponse = {
      status: 'success',
      assignment_id: assignmentId,
    };

    it('should update assignment title successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useAssignments(), { wrapper });

      const updates = { title: 'Updated Title' };
      const response = await result.current.assignmentsApi.updateAssignment(assignmentId, updates);

      expect(response).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(`http://127.0.0.1:5000/db/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
    });

    it('should update assignment due_date successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useAssignments(), { wrapper });

      const updates = { due_date: '2024-12-20T23:59:59Z' };
      await result.current.assignmentsApi.updateAssignment(assignmentId, updates);

      expect(mockFetch).toHaveBeenCalledWith(`http://127.0.0.1:5000/db/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
    });

    it('should update both title and due_date', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useAssignments(), { wrapper });

      const updates = {
        title: 'Updated Title',
        due_date: '2024-12-20T23:59:59Z',
      };
      await result.current.assignmentsApi.updateAssignment(assignmentId, updates);

      expect(mockFetch).toHaveBeenCalledWith(`http://127.0.0.1:5000/db/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
    });

    it('should handle empty updates object', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useAssignments(), { wrapper });

      await result.current.assignmentsApi.updateAssignment(assignmentId, {});

      expect(mockFetch).toHaveBeenCalledWith(`http://127.0.0.1:5000/db/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
    });

    it('should handle update error with error message', async () => {
      const errorMessage = 'Assignment not found';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      } as Response);

      const { result } = renderHook(() => useAssignments(), { wrapper });

      await expect(
        result.current.assignmentsApi.updateAssignment(assignmentId, { title: 'New Title' })
      ).rejects.toThrow(errorMessage);
    });

    it('should handle update error without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useAssignments(), { wrapper });

      await expect(
        result.current.assignmentsApi.updateAssignment(assignmentId, { title: 'New Title' })
      ).rejects.toThrow('Failed to update assignment');
    });

    it('should handle network error during update', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAssignments(), { wrapper });

      await expect(
        result.current.assignmentsApi.updateAssignment(assignmentId, { title: 'New Title' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('assignmentsApiService export', () => {
    it('should export a working API service instance', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'success', assignment_id: 'test-123' }),
      } as Response);

      const result = await assignmentsApiService.createAssignment({
        assignment_id: 'test-123',
        course_id: 'course-456',
        title: 'Test Assignment',
        due_date: '2024-12-15T23:59:59Z',
      });

      expect(result.status).toBe('success');
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should be usable without provider context', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'success', assignment_id: 'direct-123' }),
      } as Response);

      const result = await assignmentsApiService.updateAssignment('direct-123', {
        title: 'Direct Update',
      });

      expect(result.status).toBe('success');
    });
  });

  describe('edge cases', () => {
    it('should handle assignment with all optional fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'success', assignment_id: 'full-123' }),
      } as Response);

      const { result } = renderHook(() => useAssignments(), { wrapper });

      const fullData = {
        assignment_id: 'full-123',
        course_id: 'course-456',
        title: 'Complete Assignment',
        due_date: '2024-12-15T23:59:59Z',
        is_complete: true,
        completion_points: 75,
        actual_completion_date: '2024-12-10T10:00:00Z',
      };

      await result.current.assignmentsApi.createAssignment(fullData);

      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:5000/db/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullData),
      });
    });

    it('should handle special characters in assignment title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'success', assignment_id: 'special-123' }),
      } as Response);

      const { result } = renderHook(() => useAssignments(), { wrapper });

      const data = {
        assignment_id: 'special-123',
        course_id: 'course-456',
        title: 'Assignment #1: "Introduction" & <Setup>',
        due_date: '2024-12-15T23:59:59Z',
      };

      await result.current.assignmentsApi.createAssignment(data);

      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      expect(callBody.title).toBe('Assignment #1: "Introduction" & <Setup>');
    });

    it('should default zero completion_points to 30', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ status: 'success', assignment_id: 'zero-123' }),
        } as Response);

        const { result } = renderHook(() => useAssignments(), { wrapper });

        const data = {
            assignment_id: 'zero-123',
            course_id: 'course-456',
            title: 'Zero Points Assignment',
            due_date: '2024-12-15T23:59:59Z',
            completion_points: 0,
        };

        await result.current.assignmentsApi.createAssignment(data);

        const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
        expect(callBody.completion_points).toBe(30); 
        });
  });
});