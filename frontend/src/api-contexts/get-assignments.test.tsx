import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getAssignment, getAssignments, getAllAssignments, Assignment, Task } from './get-assignments';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Context', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getAssignment', () => {
    const mockAssignment: Assignment = {
      assignment_id: 'assignment_1',
      course_id: 'course_1',
      title: 'Test Assignment',
      due_date: '2024-12-31',
      completion_points: 100,
      is_complete: false,
    };

    it('should fetch a single assignment successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAssignment,
      });

      const result = await getAssignment('assignment_1');

      expect(fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/db/assignments/assignment_1',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockAssignment);
    });

    it('should throw error when response is not ok', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(getAssignment('invalid_id')).rejects.toThrow('HTTP error! status: 404');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(getAssignment('assignment_1')).rejects.toThrow('Network error');
    });
  });

  describe('getAssignments', () => {
    const mockAssignments: Assignment[] = [
      {
        assignment_id: 'assignment_1',
        course_id: 'course_1',
        title: 'Assignment 1',
        due_date: '2024-12-31',
        completion_points: 100,
        is_complete: false,
      },
      {
        assignment_id: 'assignment_2',
        course_id: 'course_1',
        title: 'Assignment 2',
        due_date: '2024-12-25',
        completion_points: 50,
        is_complete: true,
      },
    ];

    const mockTasks: Task[] = [
      {
        task_id: 'task_1',
        user_id: 'paul_paw_test',
        description: 'Task 1',
        type: 'study',
        assignment_id: 'assignment_1',
        course_id: 'course_1',
        scheduled_start_at: null,
        scheduled_end_at: null,
        is_completed: true,
        reward_points: 10,
      },
      {
        task_id: 'task_2',
        user_id: 'paul_paw_test',
        description: 'Task 2',
        type: 'homework',
        assignment_id: 'assignment_1',
        course_id: 'course_1',
        scheduled_start_at: null,
        scheduled_end_at: null,
        is_completed: false,
        reward_points: 20,
      },
    ];

    it('should fetch assignments with task counts', async () => {
      // Mock assignments fetch
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAssignments,
      });

      // Mock tasks fetch for assignment_1
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      });

      // Mock tasks fetch for assignment_2
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await getAssignments('course_1');

      expect(fetch).toHaveBeenCalledTimes(3); // 1 for assignments, 2 for tasks
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        ...mockAssignments[0],
        task_count: 2,
        completed_task_count: 1,
      });
      expect(result[1]).toEqual({
        ...mockAssignments[1],
        task_count: 0,
        completed_task_count: 0,
      });
    });

    it('should handle custom userId', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockAssignments[0]],
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await getAssignments('course_1', 'custom_user');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('user_id=custom_user'),
        expect.anything()
      );
    });

    it('should handle task fetch errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockAssignments[0]],
      });

      // Mock task fetch error
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Task fetch failed'));

      const result = await getAssignments('course_1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockAssignments[0],
        task_count: 0,
        completed_task_count: 0,
      });
    });

    it('should throw error when assignments fetch fails', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(getAssignments('course_1')).rejects.toThrow('HTTP error! status: 500');
    });
  });

  describe('getAllAssignments', () => {
    const mockAssignments: Assignment[] = [
      {
        assignment_id: 'assignment_1',
        course_id: 'course_1',
        title: 'Assignment 1',
        due_date: '2024-12-31',
        completion_points: 100,
        is_complete: false,
      },
      {
        assignment_id: 'assignment_2',
        course_id: 'course_2',
        title: 'Assignment 2',
        due_date: '2024-12-25',
        completion_points: 50,
        is_complete: true,
      },
    ];

    it('should fetch all assignments without course filter', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAssignments,
      });

      // Mock task fetches
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await getAllAssignments();

      expect(fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/db/assignments',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toHaveLength(2);
    });

    it('should include task counts for all assignments', async () => {
      const mockTasks: Task[] = [
        {
          task_id: 'task_1',
          user_id: 'paul_paw_test',
          description: 'Task 1',
          type: 'study',
          assignment_id: 'assignment_1',
          course_id: 'course_1',
          scheduled_start_at: null,
          scheduled_end_at: null,
          is_completed: true,
          reward_points: 10,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockAssignments[0]],
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      });

      const result = await getAllAssignments();

      expect(result[0]).toEqual({
        ...mockAssignments[0],
        task_count: 1,
        completed_task_count: 1,
      });
    });

    it('should handle empty assignments list', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await getAllAssignments();

      expect(result).toEqual([]);
    });

    it('should handle custom userId parameter', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockAssignments[0]],
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await getAllAssignments('custom_user');

      // Check that the tasks fetch uses the custom userId
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('user_id=custom_user'),
        expect.anything()
      );
    });
  });
});