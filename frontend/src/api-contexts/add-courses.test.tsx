import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  AddCoursesProvider,
  useAddCourses,
  addCoursesApiService,
  Course,
} from './add-courses';

// Mock fetch globally
global.fetch = jest.fn();

describe('AddCoursesApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCourse', () => {
    it('should successfully create a course', async () => {
      const mockCourse: Omit<Course, 'date_imported_at'> = {
        course_id: '123',
        user_id: 'user1',
        course_name: 'Introduction to Testing',
        course_code: 'TEST101',
        term: 'Fall 2024',
        color: '#FF5733',
        meeting_days: ['Monday', 'Wednesday'],
        meeting_times: ['10:00 AM', '11:30 AM'],
      };

      const mockResponse = {
        status: 'success',
        course_id: '123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await addCoursesApiService.createCourse(mockCourse);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/db/courses',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockCourse),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw an error when API returns an error', async () => {
      const mockCourse: Omit<Course, 'date_imported_at'> = {
        course_id: '123',
        user_id: 'user1',
        course_name: 'Test Course',
        course_code: 'TEST101',
        term: 'Fall 2024',
        color: '#FF5733',
        meeting_days: ['Monday'],
        meeting_times: ['10:00 AM'],
      };

      const mockError = { error: 'Database connection failed' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      await expect(
        addCoursesApiService.createCourse(mockCourse)
      ).rejects.toThrow('Database connection failed');
    });

    it('should throw a generic error when no error message is provided', async () => {
      const mockCourse: Omit<Course, 'date_imported_at'> = {
        course_id: '123',
        user_id: 'user1',
        course_name: 'Test Course',
        course_code: 'TEST101',
        term: 'Fall 2024',
        color: '#FF5733',
        meeting_days: ['Monday'],
        meeting_times: ['10:00 AM'],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(
        addCoursesApiService.createCourse(mockCourse)
      ).rejects.toThrow('Failed to create course');
    });
  });

  describe('bulkCreateCourses', () => {
    it('should successfully create multiple courses', async () => {
      const mockCourses: Course[] = [
        {
          course_id: '1',
          user_id: 'user1',
          course_name: 'Course 1',
          course_code: 'C1',
          term: 'Fall 2024',
          color: '#FF5733',
          meeting_days: ['Monday'],
          meeting_times: ['10:00 AM'],
        },
        {
          course_id: '2',
          user_id: 'user1',
          course_name: 'Course 2',
          course_code: 'C2',
          term: 'Fall 2024',
          color: '#33FF57',
          meeting_days: ['Tuesday'],
          meeting_times: ['2:00 PM'],
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', course_id: '123' }),
      });

      const result = await addCoursesApiService.bulkCreateCourses(mockCourses);

      expect(result.created).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in bulk create', async () => {
      const mockCourses: Course[] = [
        {
          course_id: '1',
          user_id: 'user1',
          course_name: 'Course 1',
          course_code: 'C1',
          term: 'Fall 2024',
          color: '#FF5733',
          meeting_days: ['Monday'],
          meeting_times: ['10:00 AM'],
        },
        {
          course_id: '2',
          user_id: 'user1',
          course_name: 'Course 2',
          course_code: 'C2',
          term: 'Fall 2024',
          color: '#33FF57',
          meeting_days: ['Tuesday'],
          meeting_times: ['2:00 PM'],
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success', course_id: '1' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Duplicate course code' }),
        });

      const result = await addCoursesApiService.bulkCreateCourses(mockCourses);

      expect(result.created).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Course 2');
      expect(result.errors[0]).toContain('Duplicate course code');
    });

    it('should handle all failures in bulk create', async () => {
      const mockCourses: Course[] = [
        {
          course_id: '1',
          user_id: 'user1',
          course_name: 'Course 1',
          course_code: 'C1',
          term: 'Fall 2024',
          color: '#FF5733',
          meeting_days: ['Monday'],
          meeting_times: ['10:00 AM'],
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      });

      const result = await addCoursesApiService.bulkCreateCourses(mockCourses);

      expect(result.created).toBe(0);
      expect(result.errors).toHaveLength(1);
    });
  });
});

describe('AddCoursesProvider and useAddCourses', () => {
  it('should provide API service through context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AddCoursesProvider>{children}</AddCoursesProvider>
    );

    const { result } = renderHook(() => useAddCourses(), { wrapper });

    expect(result.current.addCoursesApi).toBeDefined();
    expect(typeof result.current.addCoursesApi.createCourse).toBe('function');
    expect(typeof result.current.addCoursesApi.bulkCreateCourses).toBe('function');
  });

  it('should throw error when useAddCourses is used outside provider', () => {
    // Suppress console.error for this test
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAddCourses());
    }).toThrow('useAddCourses must be used within an AddCoursesProvider');

    consoleError.mockRestore();
  });

  it('should allow multiple components to access the same API service', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AddCoursesProvider>{children}</AddCoursesProvider>
    );

    const { result: result1 } = renderHook(() => useAddCourses(), { wrapper });
    const { result: result2 } = renderHook(() => useAddCourses(), { wrapper });

    // Both hooks should return API service instances
    expect(result1.current.addCoursesApi).toBeDefined();
    expect(result2.current.addCoursesApi).toBeDefined();
  });

  it('should render children correctly', () => {
    const TestComponent = () => <div>Test Child</div>;

    const { getByText } = render(
      <AddCoursesProvider>
        <TestComponent />
      </AddCoursesProvider>
    );

    expect(getByText('Test Child')).toBeInTheDocument();
  });
});

describe('Integration tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow creating courses through context hook', async () => {
    const mockCourse: Omit<Course, 'date_imported_at'> = {
      course_id: '123',
      user_id: 'user1',
      course_name: 'Integration Test Course',
      course_code: 'INT101',
      term: 'Fall 2024',
      color: '#FF5733',
      meeting_days: ['Monday'],
      meeting_times: ['10:00 AM'],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', course_id: '123' }),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AddCoursesProvider>{children}</AddCoursesProvider>
    );

    const { result } = renderHook(() => useAddCourses(), { wrapper });

    await waitFor(async () => {
      const response = await result.current.addCoursesApi.createCourse(mockCourse);
      expect(response.course_id).toBe('123');
    });
  });
});