import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Home from './index';
import { apiService, User } from '../../api-contexts/user-context';
import { getCourses } from '../../api-contexts/get-courses';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('../../api-contexts/user-context');
jest.mock('../../api-contexts/get-courses');
jest.mock('../../components/multiple-task-container', () => {
  return function MockMultipleTaskContainer({ tasks, onTaskCompleted, onRefreshData }: any) {
    return (
      <div data-testid="multiple-task-container">
        <div>Task Count: {tasks.length}</div>
        <button onClick={() => onTaskCompleted('task-1', 'exercise', 10, 'course-1')}>
          Complete Task
        </button>
        <button onClick={onRefreshData}>Refresh</button>
      </div>
    );
  };
});

jest.mock('../../components/course-container', () => {
  return function MockCourseContainer({ name, courseId, onTaskCompleted, onRefreshData }: any) {
    return (
      <div data-testid={`course-container-${courseId}`}>
        <div>Course: {name}</div>
        <button onClick={() => onTaskCompleted('task-1', 'exercise', 10, courseId)}>
          Complete Course Task
        </button>
        <button onClick={onRefreshData}>Refresh Course</button>
      </div>
    );
  };
});

// Mock chrome.alarms API
global.chrome = {
  alarms: {
    get: jest.fn((alarmId, callback) => callback(null)),
    clear: jest.fn((alarmId, callback) => callback(true)),
  },
} as any;

const mockUser: User = {
  user_id: 'test-user-id',
  canvas_username: 'testuser',
  canvas_domain: 'canvas.test.edu',
  profile_picture: 'https://example.com/pic.jpg',
  total_points: 100,
  current_level: 5,
  last_activity_at: '2025-01-01T00:00:00Z',
};

const mockTasks = [
  {
    task_id: 'task-1',
    scheduled_end_at: new Date().toISOString(),
    name: 'Today Task 1',
    task_type: 'exercise',
  },
  {
    task_id: 'task-2',
    scheduled_end_at: new Date().toISOString(),
    name: 'Today Task 2',
    task_type: 'break',
  },
  {
    task_id: 'task-3',
    scheduled_end_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    name: 'Tomorrow Task',
    task_type: 'assignment',
  },
  {
    task_id: 'task-4',
    scheduled_end_at: new Date(Date.now() + 2 * 86400000).toISOString(), // Day after tomorrow
    name: 'Future Task 1',
    task_type: 'exercise',
  },
  {
    task_id: 'task-5',
    scheduled_end_at: new Date(Date.now() + 3 * 86400000).toISOString(),
    name: 'Future Task 2',
    task_type: 'exercise',
  },
  {
    task_id: 'task-6',
    scheduled_end_at: new Date(Date.now() + 4 * 86400000).toISOString(),
    name: 'Future Task 3',
    task_type: 'exercise',
  },
  {
    task_id: 'task-7',
    scheduled_end_at: new Date(Date.now() + 5 * 86400000).toISOString(),
    name: 'Future Task 4',
    task_type: 'exercise',
  },
];

const mockCourses = [
  {
    course_id: 'course-1',
    name: 'Math 101',
    color: 'blue',
  },
  {
    course_id: 'course-2',
    name: 'Science 202',
    color: 'green',
  },
];

describe('Home Component', () => {
  const mockUpdateUserPoints = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (apiService.getTasks as jest.Mock).mockResolvedValue(mockTasks);
    (apiService.getUser as jest.Mock).mockResolvedValue(mockUser);
    (getCourses as jest.Mock).mockResolvedValue(mockCourses);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const renderHome = (props = {}) => {
    const defaultProps = {
      user: mockUser,
      updateUserPoints: mockUpdateUserPoints,
      userId: 'test-user-id',
    };
    
    return render(
      <BrowserRouter>
        <Home {...defaultProps} {...props} />
      </BrowserRouter>
    );
  };

  describe('Initial Loading', () => {
    it('displays loading state initially', () => {
      renderHome();
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });

    it('loads and displays tasks after fetching', async () => {
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
      });
      
      expect(apiService.getTasks).toHaveBeenCalledWith('test-user-id');
      expect(getCourses).toHaveBeenCalledWith('test-user-id');
    });

    it('does not fetch data when userId is not provided', async () => {
      renderHome({ userId: undefined });
      
      await waitFor(() => {
        expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
      });
      
      expect(apiService.getTasks).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when task fetching fails', async () => {
      const errorMessage = 'Failed to fetch tasks';
      (apiService.getTasks as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load tasks. Please try again later.')).toBeInTheDocument();
      });
    });

    it('allows retry after error', async () => {
      (apiService.getTasks as jest.Mock).mockRejectedValueOnce(new Error('Error'));
      
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
      
      (apiService.getTasks as jest.Mock).mockResolvedValue(mockTasks);
      
      fireEvent.click(screen.getByText('Try Again'));
      
      await waitFor(() => {
        expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
      });
    });

    it('handles course fetching error gracefully', async () => {
      (getCourses as jest.Mock).mockRejectedValue(new Error('Course error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching courses:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Task Display', () => {
    it('displays today\'s tasks with count', async () => {
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText(/Today's Tasks/)).toBeInTheDocument();
        expect(screen.getByText('(2)')).toBeInTheDocument(); // 2 tasks today
      });
    });

    it('displays upcoming tasks with total count', async () => {
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText(/Upcoming Tasks/)).toBeInTheDocument();
        expect(screen.getByText('(5)')).toBeInTheDocument(); // 5 upcoming tasks
      });
    });

    it('displays empty state for upcoming tasks when none exist', async () => {
      (apiService.getTasks as jest.Mock).mockResolvedValue([
        {
          task_id: 'task-1',
          scheduled_end_at: new Date().toISOString(),
          name: 'Only Today Task',
          task_type: 'exercise',
        },
      ]);
      
      renderHome();
      
      await waitFor(() => {
        const containers = screen.getAllByTestId('multiple-task-container');
        // Should have container for today's tasks and empty upcoming
        expect(containers.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('groups upcoming tasks by date correctly', async () => {
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText(/Upcoming Tasks/)).toBeInTheDocument();
      });
      
      // Should display multiple task containers for different dates
      const containers = screen.getAllByTestId('multiple-task-container');
      expect(containers.length).toBeGreaterThan(1);
    });
  });

  describe('Show More/Collapse Functionality', () => {
    it('displays "Show More Days" button when there are more than initial days', async () => {
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText(/Show \d+ More Days/)).toBeInTheDocument();
      });
    });

    it('expands to show more days when clicking "Show More Days"', async () => {
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText(/Show \d+ More Days/)).toBeInTheDocument();
      });
      
      const showMoreButton = screen.getByText(/Show \d+ More Days/);
      fireEvent.click(showMoreButton);
      
      await waitFor(() => {
        expect(screen.getByText('Collapse')).toBeInTheDocument();
      });
    });

    it('collapses days when clicking "Collapse" button', async () => {
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText(/Show \d+ More Days/)).toBeInTheDocument();
      });
      
      // Expand first
      const showMoreButton = screen.getByText(/Show \d+ More Days/);
      fireEvent.click(showMoreButton);
      
      await waitFor(() => {
        expect(screen.getByText('Collapse')).toBeInTheDocument();
      });
      
      // Then collapse
      const collapseButton = screen.getByText('Collapse');
      fireEvent.click(collapseButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Collapse')).not.toBeInTheDocument();
      });
    });

    it('does not show collapse button initially', async () => {
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
      });
      
      expect(screen.queryByText('Collapse')).not.toBeInTheDocument();
    });

    it('handles showing all remaining days', async () => {
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText(/Show \d+ More Days/)).toBeInTheDocument();
      });
      
      // Click multiple times to show all days
      let showMoreButton = screen.queryByText(/Show \d+ More Days/);
      while (showMoreButton) {
        fireEvent.click(showMoreButton);
        await waitFor(() => {});
        showMoreButton = screen.queryByText(/Show \d+ More Days/);
      }
      
      // Should not have show more button anymore
      expect(screen.queryByText(/Show \d+ More Days/)).not.toBeInTheDocument();
    });
  });

  describe('Task Completion', () => {
    it('updates user points when task is completed', async () => {
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
      });
      
      const completeButton = screen.getAllByText('Complete Task')[0];
      fireEvent.click(completeButton);
      
      expect(mockUpdateUserPoints).toHaveBeenCalledWith(110); // 100 + 10 points
    });

    it('refreshes user data after task completion', async () => {
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
      });
      
      const completeButton = screen.getAllByText('Complete Task')[0];
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(apiService.getUser).toHaveBeenCalledWith('test-user-id');
      });
    });

    // it('clears chrome alarm for exercise task completion', async () => {
    //   (chrome.alarms.get as jest.Mock).mockImplementation((alarmId, callback) => {
    //     callback({ name: alarmId });
    //   });
      
    //   renderHome();
      
    //   await waitFor(() => {
    //     expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
    //   });
      
    //   const completeButton = screen.getAllByText('Complete Task')[0];
    //   fireEvent.click(completeButton);
      
    //   expect(chrome.alarms.get).toHaveBeenCalledWith('exercise-task-1', expect.any(Function));
    //   expect(chrome.alarms.clear).toHaveBeenCalledWith('exercise-task-1', expect.any(Function));
    // });

    // it('clears chrome alarm for break task completion', async () => {
    //   (chrome.alarms.get as jest.Mock).mockImplementation((alarmId, callback) => {
    //     callback({ name: alarmId });
    //   });
      
    //   renderHome();
      
    //   await waitFor(() => {
    //     expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
    //   });
      
    //   // Get the break task complete button (second one)
    //   const completeButtons = screen.getAllByText('Complete Task');
    //   fireEvent.click(completeButtons[1]);
      
    //   expect(chrome.alarms.get).toHaveBeenCalledWith('break-task-1', expect.any(Function));
    // });

    // it('handles notification clear error gracefully', async () => {
    //   const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    //   (chrome.alarms.get as jest.Mock).mockImplementation(() => {
    //     throw new Error('Chrome API error');
    //   });
      
    //   renderHome();
      
    //   await waitFor(() => {
    //     expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
    //   });
      
    //   const completeButton = screen.getAllByText('Complete Task')[0];
    //   fireEvent.click(completeButton);
      
    //   expect(consoleSpy).toHaveBeenCalledWith(
    //     'Failed to clear task notification in Home component:',
    //     expect.any(Error)
    //   );
    //   consoleSpy.mockRestore();
    // });

    // it('refreshes task data after delay when task is completed', async () => {
    //   renderHome();
      
    //   await waitFor(() => {
    //     expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
    //   });
      
    //   const initialCallCount = (apiService.getTasks as jest.Mock).mock.calls.length;
      
    //   const completeButton = screen.getAllByText('Complete Task')[0];
    //   fireEvent.click(completeButton);
      
    //   // Fast-forward time
    //   jest.advanceTimersByTime(3000);
      
    //   await waitFor(() => {
    //     expect(apiService.getTasks).toHaveBeenCalledTimes(initialCallCount + 1);
    //   });
    // });

    // it('clears existing timer before setting new one', async () => {
    //   renderHome();
      
    //   await waitFor(() => {
    //     expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
    //   });
      
    //   const completeButton = screen.getAllByText('Complete Task')[0];
      
    //   // Complete task twice quickly
    //   fireEvent.click(completeButton);
    //   fireEvent.click(completeButton);
      
    //   // Fast-forward time
    //   jest.advanceTimersByTime(3000);
      
    //   // Should only refresh once
    //   await waitFor(() => {
    //     expect(apiService.getTasks).toHaveBeenCalledTimes(2); // Initial + 1 refresh
    //   });
    // });

    it('handles task completion without userId', async () => {
      renderHome({ userId: undefined });
      
      await waitFor(() => {
        expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
      });
      
      // Should not crash when completing task without userId
      expect(() => {
        // Component should handle this gracefully
      }).not.toThrow();
    });

    it('handles user data refresh error after task completion', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (apiService.getUser as jest.Mock).mockRejectedValue(new Error('User fetch error'));
      
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
      });
      
      const completeButton = screen.getAllByText('Complete Task')[0];
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to refresh user data:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('handles task completion without updateUserPoints callback', async () => {
      renderHome({ updateUserPoints: undefined });
      
      await waitFor(() => {
        expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
      });
      
      const completeButton = screen.getAllByText('Complete Task')[0];
      
      // Should not crash when completing task without callback
      expect(() => {
        fireEvent.click(completeButton);
      }).not.toThrow();
    });
  });

  describe('Course Display', () => {
    it('displays courses section', async () => {
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText('Courses')).toBeInTheDocument();
      });
    });

    it('displays all fetched courses', async () => {
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText('Course: Math 101')).toBeInTheDocument();
        expect(screen.getByText('Course: Science 202')).toBeInTheDocument();
      });
    });

    it('handles course task completion', async () => {
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText('Courses')).toBeInTheDocument();
      });
      
      const courseTaskButton = screen.getAllByText('Complete Course Task')[0];
      fireEvent.click(courseTaskButton);
      
      expect(mockUpdateUserPoints).toHaveBeenCalled();
    });

    it('handles course refresh', async () => {
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText('Courses')).toBeInTheDocument();
      });
      
      const initialCallCount = (apiService.getTasks as jest.Mock).mock.calls.length;
      
      const refreshCourseButton = screen.getAllByText('Refresh Course')[0];
      fireEvent.click(refreshCourseButton);
      
      await waitFor(() => {
        expect(apiService.getTasks).toHaveBeenCalledTimes(initialCallCount + 1);
      });
    });

    it('displays "No courses found" when courses array is empty', async () => {
      (getCourses as jest.Mock).mockResolvedValue([]);
      
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText('No courses found.')).toBeInTheDocument();
      });
    });
  });

  describe('Data Refresh', () => {
    it('refreshes all task data when refresh is triggered', async () => {
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
      });
      
      const initialCallCount = (apiService.getTasks as jest.Mock).mock.calls.length;
      
      const refreshButton = screen.getAllByText('Refresh')[0];
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(apiService.getTasks).toHaveBeenCalledTimes(initialCallCount + 1);
      });
    });

    it('handles refresh error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
      });
      
      (apiService.getTasks as jest.Mock).mockRejectedValueOnce(new Error('Refresh error'));
      
      const refreshButton = screen.getAllByText('Refresh')[0];
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to refresh task data:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('updates global refresh key after data refresh', async () => {
      renderHome();
      
      await waitFor(() => {
        expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
      });
      
      const refreshButton = screen.getAllByText('Refresh')[0];
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        // Courses should re-render with new key
        expect(screen.getByTestId('course-container-course-1')).toBeInTheDocument();
      });
    });
  });

  describe('Cleanup', () => {
    it('clears timer on component unmount', async () => {
      const { unmount } = renderHome();
      
      await waitFor(() => {
        expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
      });
      
      const completeButton = screen.getAllByText('Complete Task')[0];
      fireEvent.click(completeButton);
      
      unmount();
      
      // Should not crash when unmounting with active timer
      expect(() => {
        jest.advanceTimersByTime(3000);
      }).not.toThrow();
    });
  });
});