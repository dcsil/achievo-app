import React from 'react';
import { render, renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  TimetableProvider,
  useTimetable,
  timetableApiService,
  TimetableProcessResult,
  Course,
  GeneratedTask
} from './timetable-context';

// Mock fetch globally
global.fetch = jest.fn();

describe('timetable-context', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    (fetch as jest.MockedFunction<typeof fetch>).mockReset();
  });

  describe('TimetableApiService', () => {
    const mockFile = new File(['test content'], 'timetable.pdf', {
      type: 'application/pdf'
    });

    const mockCourse: Course = {
      course_id: 'COMP-101',
      user_id: 'paul_paw_test',
      course_name: 'Introduction to Computer Science',
      course_code: 'COMP-101',
      canvas_course_id: 'canvas-123',
      term: '2025 Fall',
      color: 'blue',
      meeting_days: ['Monday', 'Wednesday', 'Friday'],
      meeting_times: ['10:00-11:30'],
      date_imported_at: '2025-01-20T10:00:00Z'
    };

    const mockTask: GeneratedTask = {
      task_id: 'task-1',
      user_id: 'paul_paw_test',
      assignment_id: 'assign-1',
      course_id: 'COMP-101',
      description: 'Attend COMP-101 lecture',
      type: 'class',
      scheduled_start_at: '2025-01-20T10:00:00Z',
      scheduled_end_at: '2025-01-20T11:30:00Z',
      is_completed: false,
      reward_points: 10
    };

    const mockProcessResult: TimetableProcessResult = {
      status: 'success',
      courses_found: 1,
      tasks_generated: 3,
      courses: [mockCourse],
      tasks: [mockTask],
      config: {
        user_id: 'paul_paw_test',
        term: '2025 Fall',
        assignment_id: 'assign-1',
        start_date: '2025-01-20',
        end_date: '2025-05-15',
        breaks: ['2025-03-15', '2025-03-22'],
        holidays: ['2025-02-17']
      }
    };

    describe('processTimetable', () => {
      it('should process timetable successfully with all parameters', async () => {
        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockProcessResult
        } as Response);

        const result = await timetableApiService.processTimetable(mockFile, 'paul_paw_test', '2025 Fall');

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(
          'http://127.0.0.1:5000/api/timetable/process',
          {
            method: 'POST',
            body: expect.any(FormData)
          }
        );

        // Verify FormData contents
        const callArgs = (fetch as jest.MockedFunction<typeof fetch>).mock.calls[0];
        const formData = callArgs[1]?.body as FormData;
        expect(formData.get('file')).toBe(mockFile);
        expect(formData.get('user_id')).toBe('paul_paw_test');
        expect(formData.get('term')).toBe('2025 Fall');

        expect(result).toEqual(mockProcessResult);
      });

      it('should process timetable successfully without optional parameters', async () => {
        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockProcessResult
        } as Response);

        const result = await timetableApiService.processTimetable(mockFile);

        const callArgs = (fetch as jest.MockedFunction<typeof fetch>).mock.calls[0];
        const formData = callArgs[1]?.body as FormData;
        expect(formData.get('file')).toBe(mockFile);
        expect(formData.get('user_id')).toBeNull();
        expect(formData.get('term')).toBeNull();

        expect(result).toEqual(mockProcessResult);
      });

      it('should process timetable successfully with only userId', async () => {
        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockProcessResult
        } as Response);

        await timetableApiService.processTimetable(mockFile, 'paul_paw_test');

        const callArgs = (fetch as jest.MockedFunction<typeof fetch>).mock.calls[0];
        const formData = callArgs[1]?.body as FormData;
        expect(formData.get('user_id')).toBe('paul_paw_test');
        expect(formData.get('term')).toBeNull();
      });

      it('should process timetable successfully with only term', async () => {
        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockProcessResult
        } as Response);

        await timetableApiService.processTimetable(mockFile, undefined, '2025 Fall');

        const callArgs = (fetch as jest.MockedFunction<typeof fetch>).mock.calls[0];
        const formData = callArgs[1]?.body as FormData;
        expect(formData.get('user_id')).toBeNull();
        expect(formData.get('term')).toBe('2025 Fall');
      });

      it('should handle HTTP error responses', async () => {
        const errorResponse = { error: 'Failed to process timetable' };

        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: false,
          json: async () => errorResponse
        } as Response);

        await expect(timetableApiService.processTimetable(mockFile, 'paul_paw_test', '2025 Fall'))
          .rejects.toThrow('Failed to process timetable');
      });

      it('should handle HTTP error without error message', async () => {
        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: false,
          json: async () => ({})
        } as Response);

        await expect(timetableApiService.processTimetable(mockFile, 'paul_paw_test', '2025 Fall'))
          .rejects.toThrow('Failed to process timetable');
      });

      it('should handle network errors', async () => {
        (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('Network error'));

        await expect(timetableApiService.processTimetable(mockFile, 'paul_paw_test', '2025 Fall'))
          .rejects.toThrow('Network error');
      });
    });

    describe('getCourses', () => {
      const mockCourses: Course[] = [mockCourse];

      it('should fetch courses successfully with userId', async () => {
        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockCourses
        } as Response);

        const result = await timetableApiService.getCourses('paul_paw_test');

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(
          'http://127.0.0.1:5000/db/courses?user_id=paul_paw_test'
        );

        expect(result).toEqual(mockCourses);
      });

      it('should fetch courses successfully without userId', async () => {
        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockCourses
        } as Response);

        const result = await timetableApiService.getCourses();

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(
          'http://127.0.0.1:5000/db/courses'
        );

        expect(result).toEqual(mockCourses);
      });

      it('should handle fetch courses error', async () => {
        const errorResponse = { error: 'Database connection failed' };

        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: false,
          json: async () => errorResponse
        } as Response);

        await expect(timetableApiService.getCourses('paul_paw_test'))
          .rejects.toThrow('Database connection failed');
      });

      it('should handle fetch courses error without error message', async () => {
        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: false,
          json: async () => ({})
        } as Response);

        await expect(timetableApiService.getCourses('paul_paw_test'))
          .rejects.toThrow('Failed to fetch courses');
      });
    });

    describe('createCourse', () => {
      const courseData = {
        course_id: 'COMP-101',
        user_id: 'paul_paw_test',
        course_name: 'Introduction to Computer Science',
        course_code: 'COMP-101',
        canvas_course_id: 'canvas-123',
        term: '2025 Fall',
        color: 'blue',
        meeting_days: ['Monday', 'Wednesday', 'Friday'],
        meeting_times: ['10:00-11:30'],
        date_imported_at: '2025-01-20T10:00:00Z'
      };

      const mockCreateResponse = {
        status: 'success',
        course_id: 'COMP-101'
      };

      it('should create course successfully', async () => {
        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockCreateResponse
        } as Response);

        const result = await timetableApiService.createCourse(courseData);

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(
          'http://127.0.0.1:5000/db/courses',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(courseData)
          }
        );

        expect(result).toEqual(mockCreateResponse);
      });

      it('should handle create course error', async () => {
        const errorResponse = { error: 'Course already exists' };

        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: false,
          json: async () => errorResponse
        } as Response);

        await expect(timetableApiService.createCourse(courseData))
          .rejects.toThrow('Course already exists');
      });

      it('should handle create course error without error message', async () => {
        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: false,
          json: async () => ({})
        } as Response);

        await expect(timetableApiService.createCourse(courseData))
          .rejects.toThrow('Failed to create course');
      });
    });

    describe('bulkCreateCourses', () => {
      const coursesData = [
        {
          course_id: 'COMP-101',
          user_id: 'paul_paw_test',
          course_name: 'Introduction to Computer Science',
          course_code: 'COMP-101',
          canvas_course_id: 'canvas-123',
          term: '2025 Fall',
          color: 'blue',
          meeting_days: ['Monday', 'Wednesday', 'Friday'],
          meeting_times: ['10:00-11:30'],
          date_imported_at: '2025-01-20T10:00:00Z'
        },
        {
          course_id: 'MATH-200',
          user_id: 'paul_paw_test',
          course_name: 'Calculus I',
          course_code: 'MATH-200',
          canvas_course_id: 'canvas-456',
          term: '2025 Fall',
          color: 'red',
          meeting_days: ['Tuesday', 'Thursday'],
          meeting_times: ['14:00-15:30'],
          date_imported_at: '2025-01-20T10:00:00Z'
        }
      ];

      it('should create all courses successfully', async () => {
        const mockCreateResponse = { status: 'success', course_id: 'test-id' };

        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
          ok: true,
          json: async () => mockCreateResponse
        } as Response);

        const result = await timetableApiService.bulkCreateCourses(coursesData);

        expect(fetch).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
          created: 2,
          errors: []
        });
      });

      it('should handle partial failures in bulk create', async () => {
        const mockSuccessResponse = { status: 'success', course_id: 'test-id' };
        const mockErrorResponse = { error: 'Course already exists' };

        (fetch as jest.MockedFunction<typeof fetch>)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockSuccessResponse
          } as Response)
          .mockResolvedValueOnce({
            ok: false,
            json: async () => mockErrorResponse
          } as Response);

        const result = await timetableApiService.bulkCreateCourses(coursesData);

        expect(fetch).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
          created: 1,
          errors: ['Failed to create Calculus I: Course already exists']
        });
      });

      it('should handle all failures in bulk create', async () => {
        const mockErrorResponse = { error: 'Database error' };

        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
          ok: false,
          json: async () => mockErrorResponse
        } as Response);

        const result = await timetableApiService.bulkCreateCourses(coursesData);

        expect(fetch).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
          created: 0,
          errors: [
            'Failed to create Introduction to Computer Science: Database error',
            'Failed to create Calculus I: Database error'
          ]
        });
      });

      it('should handle empty courses array', async () => {
        const result = await timetableApiService.bulkCreateCourses([]);

        expect(fetch).not.toHaveBeenCalled();
        expect(result).toEqual({
          created: 0,
          errors: []
        });
      });

      it('should handle network errors in bulk create', async () => {
        (fetch as jest.MockedFunction<typeof fetch>)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ status: 'success', course_id: 'test-id' })
          } as Response)
          .mockRejectedValueOnce(new Error('Network error'));

        const result = await timetableApiService.bulkCreateCourses(coursesData);

        expect(result).toEqual({
          created: 1,
          errors: ['Failed to create Calculus I: Network error']
        });
      });
    });
  });

  describe('TimetableProvider and useTimetable hook', () => {
    it('should provide timetable API service through context', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimetableProvider>{children}</TimetableProvider>
      );

      const { result } = renderHook(() => useTimetable(), { wrapper });

      expect(result.current.timetableApi).toBeInstanceOf(Object);
      expect(typeof result.current.timetableApi.processTimetable).toBe('function');
      expect(typeof result.current.timetableApi.getCourses).toBe('function');
      expect(typeof result.current.timetableApi.createCourse).toBe('function');
      expect(typeof result.current.timetableApi.bulkCreateCourses).toBe('function');
    });

    it('should throw error when useTimetable is used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useTimetable());
      }).toThrow('useTimetable must be used within a TimetableProvider');

      // Restore console.error
      console.error = originalError;
    });

    it('should render children correctly', () => {
      const TestComponent = () => <div data-testid="test-child">Test Child</div>;

      const { getByTestId } = render(
        <TimetableProvider>
          <TestComponent />
        </TimetableProvider>
      );

      expect(getByTestId('test-child')).toBeInTheDocument();
    });

    it('should provide the same API service instance to multiple children', () => {
      let firstApiRef: any;
      let secondApiRef: any;

      const FirstChild = () => {
        const { timetableApi } = useTimetable();
        firstApiRef = timetableApi;
        return <div>First</div>;
      };

      const SecondChild = () => {
        const { timetableApi } = useTimetable();
        secondApiRef = timetableApi;
        return <div>Second</div>;
      };

      render(
        <TimetableProvider>
          <FirstChild />
          <SecondChild />
        </TimetableProvider>
      );

      expect(firstApiRef).toBe(secondApiRef);
    });
  });

  describe('exported timetableApiService instance', () => {
    it('should be an instance of TimetableApiService with all methods', () => {
      expect(typeof timetableApiService.processTimetable).toBe('function');
      expect(typeof timetableApiService.getCourses).toBe('function');
      expect(typeof timetableApiService.createCourse).toBe('function');
      expect(typeof timetableApiService.bulkCreateCourses).toBe('function');
    });
  });
});
