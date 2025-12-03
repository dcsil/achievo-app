import {
  processSyllabus,
  validatePdfFile,
  saveAssignmentsToDatabase,
  saveTasksToDatabase,
  saveSyllabiDataToDatabase,
  SyllabiResult,
  BusyInterval
} from './syllabi-api';
import { Task, Assignment } from './get-assignments';

// Mock fetch globally
global.fetch = jest.fn();

describe('syllabi-api', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    (fetch as jest.MockedFunction<typeof fetch>).mockReset();
  });

  describe('processSyllabus', () => {
    const mockFile = new File(['test content'], 'syllabus.pdf', {
      type: 'application/pdf'
    });

    const mockSuccessResponse: SyllabiResult = {
      status: 'success',
      course_id: 'COMP-101',
      assignments_found: 2,
      tasks_found: 3,
      total_micro_tasks: 5,
      assignments: [
        {
          assignment_id: 'assign-1',
          course_id: 'COMP-101',
          title: 'Assignment 1',
          due_date: '2025-02-01T23:59:59Z',
          completion_points: 100,
          is_complete: false,
          micro_tasks: []
        }
      ],
      tasks: [
        {
          task_id: 'task-1',
          user_id: 'paul_paw_test',
          description: 'Study for exam',
          type: 'exam',
          assignment_id: '',
          course_id: 'COMP-101',
          scheduled_start_at: '2025-01-20T10:00:00Z',
          scheduled_end_at: '2025-01-20T12:00:00Z',
          reward_points: 20,
          is_completed: false
        }
      ]
    };

    it('should process syllabus successfully with course ID and busy intervals', async () => {
      const busyIntervals: BusyInterval[] = [
        { start: '09:00', end: '10:00' },
        { start: '14:00', end: '15:00' }
      ];

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse
      } as Response);

      const result = await processSyllabus(mockFile, 'COMP-101', busyIntervals);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/api/syllabi/process',
        {
          method: 'POST',
          body: expect.any(FormData)
        }
      );

      // Verify FormData contents
      const callArgs = (fetch as jest.MockedFunction<typeof fetch>).mock.calls[0];
      const formData = callArgs[1]?.body as FormData;
      expect(formData.get('file')).toBe(mockFile);
      expect(formData.get('course_id')).toBe('COMP-101');
      expect(formData.get('busy_intervals')).toBe(JSON.stringify(busyIntervals));

      expect(result).toEqual(mockSuccessResponse);
    });

    it('should process syllabus successfully without course ID', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse
      } as Response);

      const result = await processSyllabus(mockFile);

      const callArgs = (fetch as jest.MockedFunction<typeof fetch>).mock.calls[0];
      const formData = callArgs[1]?.body as FormData;
      expect(formData.get('file')).toBe(mockFile);
      expect(formData.get('course_id')).toBeNull();
      expect(formData.get('busy_intervals')).toBeNull();

      expect(result).toEqual(mockSuccessResponse);
    });

    it('should process syllabus successfully without busy intervals', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse
      } as Response);

      const result = await processSyllabus(mockFile, 'COMP-101');

      const callArgs = (fetch as jest.MockedFunction<typeof fetch>).mock.calls[0];
      const formData = callArgs[1]?.body as FormData;
      expect(formData.get('busy_intervals')).toBeNull();

      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle HTTP error responses', async () => {
      const errorResponse = { error: 'Failed to process syllabus' };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse
      } as Response);

      await expect(processSyllabus(mockFile, 'COMP-101')).rejects.toThrow('Failed to process syllabus');
    });

    it('should handle HTTP error without error message', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({})
      } as Response);

      await expect(processSyllabus(mockFile, 'COMP-101')).rejects.toThrow('HTTP error! status: 500');
    });

    it('should handle network errors', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('Network error'));

      await expect(processSyllabus(mockFile, 'COMP-101')).rejects.toThrow('Network error');
    });
  });

  describe('validatePdfFile', () => {
    it('should validate valid PDF file', () => {
      const validFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf'
      });

      const result = validatePdfFile(validFile);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject null/undefined file', () => {
      const result = validatePdfFile(null as any);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No file selected');
    });

    it('should reject non-PDF file', () => {
      const invalidFile = new File(['test content'], 'test.txt', {
        type: 'text/plain'
      });

      const result = validatePdfFile(invalidFile);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('File must be a PDF');
    });

    it('should reject oversized file', () => {
      // Create a file larger than 10MB
      const oversizedContent = new Array(11 * 1024 * 1024).join('a');
      const oversizedFile = new File([oversizedContent], 'large.pdf', {
        type: 'application/pdf'
      });

      const result = validatePdfFile(oversizedFile);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('File size must be less than 10MB');
    });
  });

  describe('saveAssignmentsToDatabase', () => {
    const mockAssignments: Assignment[] = [
      {
        assignment_id: 'assign-1',
        course_id: 'COMP-101',
        title: 'Assignment 1',
        due_date: '2025-02-01T23:59:59Z',
        completion_points: 100,
        is_complete: false
      },
      {
        assignment_id: 'assign-2',
        course_id: 'COMP-101',
        title: 'Assignment 2',
        due_date: '2025-02-15T23:59:59Z',
        completion_points: 150,
        is_complete: false
      }
    ];

    it('should save assignments successfully', async () => {
      const mockResponse = { success: true };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await saveAssignmentsToDatabase(mockAssignments);

      expect(fetch).toHaveBeenCalledTimes(2);
      
      // Check first call
      expect(fetch).toHaveBeenNthCalledWith(1,
        'http://127.0.0.1:5000/db/assignments',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockAssignments[0])
        }
      );
      
      // Check second call
      expect(fetch).toHaveBeenNthCalledWith(2,
        'http://127.0.0.1:5000/db/assignments',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockAssignments[1])
        }
      );
    });

    it('should handle save errors', async () => {
      const errorResponse = { error: 'Database connection failed' };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        json: async () => errorResponse
      } as Response);

      await expect(saveAssignmentsToDatabase(mockAssignments))
        .rejects.toThrow('Failed to save assignment Assignment 1: Database connection failed');
    });

    it('should save empty array without errors', async () => {
      await saveAssignmentsToDatabase([]);

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('saveTasksToDatabase', () => {
    const mockTasks: Task[] = [
      {
        task_id: 'task-1',
        user_id: 'paul_paw_test',
        description: 'Study for exam',
        type: 'exam',
        assignment_id: '',
        course_id: 'COMP-101',
        scheduled_start_at: '2025-01-20T10:00:00Z',
        scheduled_end_at: '2025-01-20T12:00:00Z',
        reward_points: 20,
        is_completed: false
      }
    ];

    it('should save tasks successfully', async () => {
      const mockResponse = { success: true };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await saveTasksToDatabase(mockTasks);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/db/tasks',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockTasks[0])
        }
      );
    });

    it('should handle task save errors', async () => {
      const errorResponse = { error: 'Invalid task data' };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        json: async () => errorResponse
      } as Response);

      await expect(saveTasksToDatabase(mockTasks))
        .rejects.toThrow('Failed to save task Study for exam: Invalid task data');
    });
  });

  describe('saveSyllabiDataToDatabase', () => {
    const mockSyllabiResult: SyllabiResult = {
      status: 'success',
      course_id: 'COMP-101',
      assignments_found: 1,
      tasks_found: 1,
      total_micro_tasks: 2,
      assignments: [
        {
          assignment_id: 'assign-1',
          course_id: 'COMP-101',
          title: 'Assignment 1',
          due_date: '2025-02-01T23:59:59Z',
          completion_points: 100,
          is_complete: false,
          micro_tasks: [
            {
              task_id: 'micro-1',
              user_id: 'paul_paw_test',
              description: 'Research phase',
              type: 'micro',
              assignment_id: 'assign-1',
              course_id: 'COMP-101',
              scheduled_start_at: '2025-01-20T10:00:00Z',
              scheduled_end_at: '2025-01-20T12:00:00Z',
              reward_points: 5,
              is_completed: false
            },
            {
              task_id: 'micro-2',
              user_id: 'paul_paw_test',
              description: 'Writing phase',
              type: 'micro',
              assignment_id: 'assign-1',
              course_id: 'COMP-101',
              scheduled_start_at: '2025-01-21T10:00:00Z',
              scheduled_end_at: '2025-01-21T12:00:00Z',
              reward_points: 5,
              is_completed: false
            }
          ]
        }
      ],
      tasks: [
        {
          task_id: 'task-1',
          user_id: 'paul_paw_test',
          description: 'Study for exam',
          type: 'exam',
          assignment_id: '',
          course_id: 'COMP-101',
          scheduled_start_at: '2025-01-20T10:00:00Z',
          scheduled_end_at: '2025-01-20T12:00:00Z',
          reward_points: 20,
          is_completed: false
        }
      ]
    };

    it('should save complete syllabi data successfully', async () => {
      const mockResponse = { success: true };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await saveSyllabiDataToDatabase(mockSyllabiResult);

      // Should save: 1 standalone task + 1 assignment + 2 micro-tasks = 4 calls
      expect(fetch).toHaveBeenCalledTimes(4);

      expect(result).toEqual({
        assignmentsSaved: 1,
        tasksSaved: 1,
        microTasksSaved: 2
      });
    });

    it('should handle syllabi data with no tasks', async () => {
      const noTasksResult: SyllabiResult = {
        ...mockSyllabiResult,
        tasks: [],
        assignments: [
          {
            ...mockSyllabiResult.assignments[0],
            micro_tasks: []
          }
        ]
      };

      const mockResponse = { success: true };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await saveSyllabiDataToDatabase(noTasksResult);

      // Should only save 1 assignment
      expect(fetch).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        assignmentsSaved: 1,
        tasksSaved: 0,
        microTasksSaved: 0
      });
    });

    it('should handle syllabi data with no assignments', async () => {
      const noAssignmentsResult: SyllabiResult = {
        ...mockSyllabiResult,
        assignments: []
      };

      const mockResponse = { success: true };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await saveSyllabiDataToDatabase(noAssignmentsResult);

      // Should only save 1 standalone task
      expect(fetch).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        assignmentsSaved: 0,
        tasksSaved: 1,
        microTasksSaved: 0
      });
    });

    it('should handle save errors in syllabi data', async () => {
      const errorResponse = { error: 'Database error' };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        json: async () => errorResponse
      } as Response);

      await expect(saveSyllabiDataToDatabase(mockSyllabiResult))
        .rejects.toThrow('Failed to save task Study for exam: Database error');
    });
  });

  describe('edge cases and integration', () => {
    it('should handle empty busy intervals array', async () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const mockResponse = { status: 'success' };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await processSyllabus(mockFile, 'COMP-101', []);

      const callArgs = (fetch as jest.MockedFunction<typeof fetch>).mock.calls[0];
      const formData = callArgs[1]?.body as FormData;
      expect(formData.get('busy_intervals')).toBeNull();
    });

    it('should validate file size at exactly 10MB limit', () => {
      // Create a file exactly at 10MB
      const exactContent = new Array(10 * 1024 * 1024).join('a');
      const exactFile = new File([exactContent], 'exact.pdf', {
        type: 'application/pdf'
      });

      const result = validatePdfFile(exactFile);

      expect(result.valid).toBe(true);
    });
  });
});