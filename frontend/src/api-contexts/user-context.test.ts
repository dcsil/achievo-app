import { apiService } from './user-context';

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiService', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('signup', () => {
    it('should successfully sign up and login a user', async () => {
      const mockUser = {
        user_id: '123',
        total_points: 0,
        current_level: 1,
      };

      // Mock signup response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'success' }),
      } as Response);

      // Mock login response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      } as Response);

      const result = await apiService.signup('test@example.com', 'password123', 'Test User');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(1, 'http://127.0.0.1:5000/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          display_name: 'Test User',
        }),
      });
      expect(result).toEqual({ user: mockUser });
    });

    it('should handle signup errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Email already exists' }),
      } as Response);

      await expect(
        apiService.signup('test@example.com', 'password123', 'Test User')
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const mockUser = {
        user_id: '123',
        canvas_username: 'testuser',
        total_points: 100,
        current_level: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      } as Response);

      const result = await apiService.login('test@example.com', 'password123');

      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });
      expect(result).toEqual({ user: mockUser });
    });

    it('should handle login errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' }),
      } as Response);

      await expect(
        apiService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('getUser', () => {
    it('should fetch user by ID', async () => {
      const mockUser = {
        user_id: '123',
        canvas_username: 'testuser',
        total_points: 150,
        current_level: 3,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      } as Response);

      const result = await apiService.getUser('123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/db/users?user_id=123',
        undefined
      );
      expect(result).toEqual(mockUser);
    });

    it('should handle user not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'User not found' }),
      } as Response);

      await expect(apiService.getUser('999')).rejects.toThrow('User not found');
    });
  });

  describe('updateUser', () => {
    it('should update user information', async () => {
      const mockResponse = {
        status: 'success',
        user_id: '123',
        user: {
          user_id: '123',
          canvas_username: 'newusername',
          canvas_domain: 'example.instructure.com',
          total_points: 100,
          current_level: 2,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.updateUser('123', {
        canvas_username: 'newusername',
        canvas_domain: 'example.instructure.com',
      });

      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:5000/db/users/123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvas_username: 'newusername',
          canvas_domain: 'example.instructure.com',
        }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getTasks', () => {
    it('should fetch tasks with default parameters', async () => {
      const mockTasks = [
        { task_id: '1', title: 'Task 1', is_completed: false },
        { task_id: '2', title: 'Task 2', is_completed: false },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      } as Response);

      const result = await apiService.getTasks('123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/db/tasks?user_id=123&is_completed=false',
        undefined
      );
      expect(result).toEqual(mockTasks);
    });

    it('should fetch tasks with all parameters', async () => {
      const mockTasks = [{ task_id: '1', title: 'Task 1', is_completed: true }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      } as Response);

      const result = await apiService.getTasks(
        '123',
        '2024-01-01',
        '2024-12-31',
        true
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/db/tasks?user_id=123&scheduled_start_at=2024-01-01&scheduled_end_at=2024-12-31&is_completed=true',
        undefined
      );
      expect(result).toEqual(mockTasks);
    });
  });

  describe('getCombinedTasks', () => {
    it('should fetch combined tasks data', async () => {
      const mockResponse = {
        incomplete_tasks: [{ task_id: '1', title: 'Task 1' }],
        completed_tasks: [{ task_id: '2', title: 'Task 2' }],
        available_courses: [{ value: 'course1', label: 'Course 1' }],
        available_task_types: [{ value: 'assignment', label: 'Assignment' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.getCombinedTasks('123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/db/tasks/combined?user_id=123',
        undefined
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('completeTask', () => {
    it('should complete a task successfully', async () => {
      const mockResponse = {
        status: 'success',
        task_id: '456',
        assignment_completed: true,
        points_earned: 50,
        assignment_id: 'assignment123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.completeTask('456');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/db/tasks/456/complete',
        { method: 'POST' }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiService.getUser('123')).rejects.toThrow('Network error');
    });

    it('should log errors to console', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      await expect(apiService.getUser('123')).rejects.toThrow('Test error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('API Error:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });
});