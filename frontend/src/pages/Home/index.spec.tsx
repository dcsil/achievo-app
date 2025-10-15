import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from './index';
import { apiService } from '../../api-contexts/user-context';
import { getCourses } from '../../api-contexts/get-courses';

// Mock the API modules
jest.mock('../../api-contexts/user-context', () => ({
  apiService: {
    getUser: jest.fn(),
    getTasks: jest.fn(),
  },
}));

jest.mock('../../api-contexts/get-courses', () => ({
  getCourses: jest.fn(),
}));

// Mock the child components
jest.mock('../../components/header', () => {
  return function MockHeader({ user }: { user: any }) {
    return <div data-testid="header">Header - User: {user?.canvas_username || 'No user'}</div>;
  };
});

jest.mock('../../components/footer', () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});

jest.mock('../../components/task-container', () => {
  return function MockTaskContainer({ 
    tasks, 
    onTaskCompleted, 
    onTasksUpdate 
  }: { 
    tasks: any[], 
    onTaskCompleted: (taskId: string, points: number, courseId?: string) => void,
    onTasksUpdate: (tasks: any[], section: string) => void
  }) {
    return (
      <div data-testid="task-container">
        <div>Tasks: {tasks.length}</div>
        {tasks.map((task, index) => (
          <div key={index} data-testid={`task-${task.task_id}`}>
            {task.description}
            <button
              onClick={() => onTaskCompleted(task.task_id, task.points || 10, task.course_id)}
              data-testid={`complete-task-${task.task_id}`}
            >
              Complete Task
            </button>
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../../components/course-container', () => {
  return function MockCourseContainer({ 
    name, 
    courseId, 
    color, 
    refreshKey 
  }: { 
    name: string, 
    courseId: string, 
    color: string, 
    refreshKey?: number 
  }) {
    return (
      <div data-testid={`course-container-${courseId}`}>
        Course: {name} (ID: {courseId}, Color: {color}, Refresh: {refreshKey || 0})
      </div>
    );
  };
});

const mockApiService = apiService as jest.Mocked<typeof apiService>;
const mockGetCourses = getCourses as jest.MockedFunction<typeof getCourses>;

describe('Home Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockUser = {
    user_id: 'paul_paw_test',
    canvas_username: 'paul_paw',
    total_points: 100,
    current_level: 5,
  };

  const mockTasks = [
    {
      task_id: 'task1',
      description: 'Today task',
      scheduled_end_at: new Date().toISOString(),
      course_id: 'course1',
      points: 10,
    },
    {
      task_id: 'task2', 
      description: 'Tomorrow task',
      scheduled_end_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      course_id: 'course2',
      points: 15,
    },
  ];

  const mockCourses = [
    {
      course_id: 'course1',
      name: 'Math 101',
      color: '#FF5733',
    },
    {
      course_id: 'course2', 
      name: 'Science 202',
      color: '#33C3FF',
    },
  ];

  describe('Loading State', () => {
    it('should display loading state initially', async () => {
      // Make API calls hang to test loading state
      mockApiService.getUser.mockImplementation(() => new Promise(() => {}));
      mockApiService.getTasks.mockImplementation(() => new Promise(() => {}));
      mockGetCourses.mockImplementation(() => new Promise(() => {}));

      await act(async () => {
        render(<Home />);
      });

      expect(screen.getByText('Loading your tasks...')).toBeInTheDocument();
      expect(screen.getByText('⏳')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error state when API fails', async () => {
      mockApiService.getUser.mockRejectedValue(new Error('API Error'));
      mockApiService.getTasks.mockRejectedValue(new Error('API Error'));
      mockGetCourses.mockRejectedValue(new Error('API Error'));

      await act(async () => {
        render(<Home />);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to load tasks. Please try again later.')).toBeInTheDocument();
      });

      expect(screen.getByText('⚠️')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should retry fetching data when Try Again button is clicked', async () => {
      // First call fails, second call succeeds
      mockApiService.getUser
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(mockUser);
      mockApiService.getTasks
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(mockTasks);
      mockGetCourses
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(mockCourses);

      await act(async () => {
        render(<Home />);
      });

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Click retry button
      await act(async () => {
        fireEvent.click(screen.getByText('Try Again'));
      });

      await waitFor(() => {
        expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
      });

      // Verify API was called again
      expect(mockApiService.getUser).toHaveBeenCalledTimes(2);
      expect(mockApiService.getTasks).toHaveBeenCalledTimes(2);
    });
  });

  describe('Successful Data Loading', () => {
    beforeEach(() => {
      mockApiService.getUser.mockResolvedValue(mockUser);
      mockApiService.getTasks.mockResolvedValue(mockTasks);
      mockGetCourses.mockResolvedValue(mockCourses);
    });

    it('should render all sections when data loads successfully', async () => {
      await act(async () => {
        render(<Home />);
      });

      await waitFor(() => {
        expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
      });

      // Check all main sections are rendered
      expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
      expect(screen.getByText("Upcoming Tasks")).toBeInTheDocument();
      expect(screen.getByText("Courses")).toBeInTheDocument();
      
      // Check components are rendered
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getAllByTestId('task-container')).toHaveLength(2);
    });

    it('should display user information in header', async () => {
      await act(async () => {
        render(<Home />);
      });

      await waitFor(() => {
        expect(screen.getByText('Header - User: paul_paw')).toBeInTheDocument();
      });
    });

    it('should display task counts in section headers', async () => {
      await act(async () => {
        render(<Home />);
      });

      await waitFor(() => {
        expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
      });

      // Today's tasks (1 task for today)
      expect(screen.getByText('(1)')).toBeInTheDocument();
      // Upcoming tasks (1 task for tomorrow) 
      expect(screen.getByText('(1)')).toBeInTheDocument();
    });

    it('should render courses correctly', async () => {
      await act(async () => {
        render(<Home />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('course-container-course1')).toBeInTheDocument();
      });

      expect(screen.getByTestId('course-container-course1')).toBeInTheDocument();
      expect(screen.getByTestId('course-container-course2')).toBeInTheDocument();
      
      expect(screen.getByText(/Course: Math 101/)).toBeInTheDocument();
      expect(screen.getByText(/Course: Science 202/)).toBeInTheDocument();
    });

    it('should display message when no courses are available', async () => {
      mockGetCourses.mockResolvedValue([]);

      await act(async () => {
        render(<Home />);
      });

      await waitFor(() => {
        expect(screen.getByText('No courses found.')).toBeInTheDocument();
      });
    });
  });

  describe('Task Completion Handling', () => {
    beforeEach(() => {
      mockApiService.getUser.mockResolvedValue(mockUser);
      mockApiService.getTasks.mockResolvedValue(mockTasks);
      mockGetCourses.mockResolvedValue(mockCourses);
    });

    it('should handle task completion and update user points', async () => {
      const updatedUser = { ...mockUser, total_points: 125 };
      mockApiService.getUser.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(updatedUser);

      await act(async () => {
        render(<Home />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('complete-task-task1')).toBeInTheDocument();
      });

      // Complete a task
      await act(async () => {
        fireEvent.click(screen.getByTestId('complete-task-task1'));
      });

      // Verify API was called to get updated user
      await waitFor(() => {
        expect(mockApiService.getUser).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle task completion error gracefully', async () => {
      mockApiService.getUser
        .mockResolvedValueOnce(mockUser)
        .mockRejectedValueOnce(new Error('Update failed'));

      await act(async () => {
        render(<Home />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('complete-task-task1')).toBeInTheDocument();
      });

      // Complete a task
      await act(async () => {
        fireEvent.click(screen.getByTestId('complete-task-task1'));
      });

      // Should handle error gracefully (console.error should be called)
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Failed to refresh data after task completion:',
          expect.any(Error)
        );
      });
    });
  });

  describe('API Calls', () => {
    it('should call all required APIs on component mount', async () => {
      mockApiService.getUser.mockResolvedValue(mockUser);
      mockApiService.getTasks.mockResolvedValue(mockTasks);
      mockGetCourses.mockResolvedValue(mockCourses);

      await act(async () => {
        render(<Home />);
      });

      await waitFor(() => {
        expect(mockApiService.getUser).toHaveBeenCalledWith('paul_paw_test');
      });

      expect(mockApiService.getTasks).toHaveBeenCalledWith('paul_paw_test');
      expect(mockGetCourses).toHaveBeenCalledWith('paul_paw_test');
    });

    it('should handle course fetching error separately from main error', async () => {
      mockApiService.getUser.mockResolvedValue(mockUser);
      mockApiService.getTasks.mockResolvedValue(mockTasks);
      mockGetCourses.mockRejectedValue(new Error('Course API Error'));

      await act(async () => {
        render(<Home />);
      });

      await waitFor(() => {
        expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
      });

      // Main content should still render even if courses fail
      expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
      expect(screen.getByText("Upcoming Tasks")).toBeInTheDocument();
      
      // Course error should be logged but not break the page
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching courses:',
        expect.any(Error)
      );
    });
  });
});
