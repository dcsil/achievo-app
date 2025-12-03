import { getCourses, Course, CourseForUI } from './get-courses';

// Mock fetch globally
global.fetch = jest.fn();

describe('getCourses', () => {
  const mockUserId = 'user-123';
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should fetch and filter courses for a specific user', async () => {
    const mockCourses: Course[] = [
      {
        course_id: '1',
        course_name: 'Mathematics 101',
        course_code: 'MATH101',
        canvas_course_id: 'canvas-1',
        color: 'blue',
        date_imported_at: '2024-01-01',
        user_id: 'user-123'
      },
      {
        course_id: '2',
        course_name: 'Physics 201',
        course_code: 'PHYS201',
        canvas_course_id: 'canvas-2',
        color: 'red',
        date_imported_at: '2024-01-02',
        user_id: 'user-456'
      },
      {
        course_id: '3',
        course_name: 'Chemistry 101',
        course_code: 'CHEM101',
        canvas_course_id: 'canvas-3',
        color: 'green',
        date_imported_at: '2024-01-03',
        user_id: 'user-123'
      }
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCourses
    });

    const result = await getCourses(mockUserId);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:5000/db/courses');
    expect(result).toHaveLength(2);
    expect(result).toEqual([
      {
        course_id: '1',
        name: 'Mathematics 101',
        color: 'blue'
      },
      {
        course_id: '3',
        name: 'Chemistry 101',
        color: 'green'
      }
    ]);
  });

  it('should use course_code as fallback when course_name is missing', async () => {
    const mockCourses: Course[] = [
      {
        course_id: '1',
        course_name: '',
        course_code: 'MATH101',
        canvas_course_id: 'canvas-1',
        color: 'blue',
        date_imported_at: '2024-01-01',
        user_id: 'user-123'
      }
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCourses
    });

    const result = await getCourses(mockUserId);

    expect(result[0].name).toBe('MATH101');
  });

  it('should use "Unnamed Course" when both course_name and course_code are missing', async () => {
    const mockCourses: Course[] = [
      {
        course_id: '1',
        course_name: '',
        course_code: '',
        canvas_course_id: 'canvas-1',
        color: 'blue',
        date_imported_at: '2024-01-01',
        user_id: 'user-123'
      }
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCourses
    });

    const result = await getCourses(mockUserId);

    expect(result[0].name).toBe('Unnamed Course');
  });

  it('should use "blue" as default color when color is missing', async () => {
    const mockCourses: Course[] = [
      {
        course_id: '1',
        course_name: 'Math',
        course_code: 'MATH101',
        canvas_course_id: 'canvas-1',
        color: '',
        date_imported_at: '2024-01-01',
        user_id: 'user-123'
      }
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCourses
    });

    const result = await getCourses(mockUserId);

    expect(result[0].color).toBe('blue');
  });

  it('should return empty array when no courses match the user', async () => {
    const mockCourses: Course[] = [
      {
        course_id: '1',
        course_name: 'Mathematics 101',
        course_code: 'MATH101',
        canvas_course_id: 'canvas-1',
        color: 'blue',
        date_imported_at: '2024-01-01',
        user_id: 'different-user'
      }
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCourses
    });

    const result = await getCourses(mockUserId);

    expect(result).toEqual([]);
  });

  it('should return empty array when API returns empty array', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    const result = await getCourses(mockUserId);

    expect(result).toEqual([]);
  });

  it('should throw error when fetch fails with non-ok status', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    await expect(getCourses(mockUserId)).rejects.toThrow('HTTP error! status: 404');
  });

  it('should throw error when fetch fails with 500 status', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    await expect(getCourses(mockUserId)).rejects.toThrow('HTTP error! status: 500');
  });

  it('should throw error when network request fails', async () => {
    const networkError = new Error('Network error');
    (fetch as jest.Mock).mockRejectedValueOnce(networkError);

    await expect(getCourses(mockUserId)).rejects.toThrow('Network error');
  });

  it('should log error to console when request fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const networkError = new Error('Network error');
    (fetch as jest.Mock).mockRejectedValueOnce(networkError);

    try {
      await getCourses(mockUserId);
    } catch (error) {
      // Expected to throw
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching courses:', networkError);
    consoleErrorSpy.mockRestore();
  });

  it('should handle courses with missing course_id', async () => {
    const mockCourses: Course[] = [
      {
        course_id: '',
        course_name: 'Math',
        course_code: 'MATH101',
        canvas_course_id: 'canvas-1',
        color: 'blue',
        date_imported_at: '2024-01-01',
        user_id: 'user-123'
      }
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCourses
    });

    const result = await getCourses(mockUserId);

    expect(result[0].course_id).toBe('');
  });

  it('should correctly map all fields from Course to CourseForUI', async () => {
    const mockCourses: Course[] = [
      {
        course_id: 'course-xyz',
        course_name: 'Advanced JavaScript',
        course_code: 'JS401',
        canvas_course_id: 'canvas-999',
        color: 'purple',
        date_imported_at: '2024-06-15',
        user_id: 'user-123'
      }
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCourses
    });

    const result = await getCourses(mockUserId);

    expect(result).toEqual([
      {
        course_id: 'course-xyz',
        name: 'Advanced JavaScript',
        color: 'purple'
      }
    ]);
  });
});