import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ToDo from './index';
import { apiService } from '../../api-contexts/user-context';

// Mock the apiService
jest.mock('../../api-contexts/user-context', () => ({
  apiService: {
    getCombinedTasks: jest.fn(),
    getUser: jest.fn(),
  },
}));

// Mock the MultipleTaskContainer component
jest.mock('../../components/multiple-task-container', () => {
  return function MockMultipleTaskContainer({ 
    tasks, 
    dateString, 
    onTaskCompleted,
    onRefreshData 
  }: any) {
    return (
      <div data-testid="task-container">
        {dateString && <div data-testid="date-string">{dateString}</div>}
        <div data-testid="task-count">{tasks.length}</div>
        {tasks.map((task: any) => (
          <div key={task.id} data-testid={`task-${task.id}`}>
            {task.title}
            <button 
              onClick={() => onTaskCompleted(task.id, task.task_type, task.points_value, task.course_id)}
              data-testid={`complete-${task.id}`}
            >
              Complete
            </button>
          </div>
        ))}
        <button onClick={onRefreshData} data-testid="refresh-data">Refresh</button>
      </div>
    );
  };
});

// Mock chrome API
global.chrome = {
  alarms: {
    get: jest.fn((alarmId, callback) => callback({ name: alarmId })),
    clear: jest.fn((alarmId, callback) => callback(true)),
  },
} as any;

describe('ToDo Component', () => {
  const mockUser = {
    user_id: 'test-user',
    total_points: 100,
    current_level: 1,
  };

  const mockUpdateUserPoints = jest.fn();

  const mockTasks = [
    {
      id: '1',
      title: 'Task 1',
      scheduled_end_at: new Date().toISOString(),
      task_type: 'exercise',
      points_value: 10,
      course_id: 'course-1',
    },
    {
      id: '2',
      title: 'Task 2',
      scheduled_end_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      task_type: 'break',
      points_value: 5,
    },
    {
      id: '3',
      title: 'Task 3',
      scheduled_end_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      task_type: 'homework',
      points_value: 15,
    },
  ];

  const mockCompletedTasks = [
    {
      id: '4',
      title: 'Completed Task',
      scheduled_end_at: new Date().toISOString(),
      task_type: 'exercise',
      points_value: 20,
    },
  ];

  const mockCombinedData = {
    incomplete_tasks: mockTasks,
    completed_tasks: mockCompletedTasks,
    available_courses: [
      { value: 'course-1', label: 'Course 1' },
      { value: 'course-2', label: 'Course 2' },
    ],
    available_task_types: [
      { value: 'exercise', label: 'Exercise' },
      { value: 'break', label: 'Break' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (apiService.getCombinedTasks as jest.Mock).mockResolvedValue(mockCombinedData);
    (apiService.getUser as jest.Mock).mockResolvedValue(mockUser);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial Loading', () => {
    it('should show loading state initially', () => {
      render(<ToDo userId="test-user" />);
      expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
    });

    it('should fetch tasks on mount', async () => {
      render(<ToDo userId="test-user" />);
      
      await waitFor(() => {
        expect(apiService.getCombinedTasks).toHaveBeenCalledWith('test-user');
      });
    });

    it('should use default userId when not provided', async () => {
      render(<ToDo />);
      
      await waitFor(() => {
        expect(apiService.getCombinedTasks).toHaveBeenCalledWith('paul_paw_test');
      });
    });

    it('should display tasks after loading', async () => {
      render(<ToDo userId="test-user" />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
      });
      
      expect(screen.getByText('📋 All Tasks')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      (apiService.getCombinedTasks as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      render(<ToDo userId="test-user" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load tasks. Please try again later.')).toBeInTheDocument();
      });
    });

    it('should retry fetching tasks when Try Again button is clicked', async () => {
      (apiService.getCombinedTasks as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockCombinedData);

      render(<ToDo userId="test-user" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load tasks. Please try again later.')).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      await waitFor(() => {
        expect(screen.queryByText('Failed to load tasks. Please try again later.')).not.toBeInTheDocument();
        expect(screen.getByText('📋 All Tasks')).toBeInTheDocument();
      });
    });
  });

  describe('Filter Tabs', () => {
    it('should render all filter tabs with correct counts', async () => {
      render(<ToDo userId="test-user" />);

      await waitFor(() => {
        expect(screen.getByText(/All \(3\)/)).toBeInTheDocument();
        expect(screen.getByText(/Today \(1\)/)).toBeInTheDocument();
        expect(screen.getByText(/Upcoming \(1\)/)).toBeInTheDocument();
        expect(screen.getByText(/Overdue \(2\)/)).toBeInTheDocument();
        expect(screen.getByText(/Completed \(1\)/)).toBeInTheDocument();
      });
    });

    it('should filter tasks when Today tab is clicked', async () => {
      render(<ToDo userId="test-user" />);

      await waitFor(() => {
        expect(screen.getByText(/All \(3\)/)).toBeInTheDocument();
      });

      const todayButton = screen.getByText(/Today \(1\)/);
      fireEvent.click(todayButton);

      await waitFor(() => {
        expect(todayButton).toHaveClass('bg-orange-500');
      });
    });

    it('should filter tasks when Upcoming tab is clicked', async () => {
      render(<ToDo userId="test-user" />);

      await waitFor(() => {
        expect(screen.getByText(/All \(3\)/)).toBeInTheDocument();
      });

      const upcomingButton = screen.getByText(/Upcoming \(1\)/);
      fireEvent.click(upcomingButton);

      await waitFor(() => {
        expect(upcomingButton).toHaveClass('bg-orange-500');
      });
    });

    it('should filter tasks when Overdue tab is clicked', async () => {
      render(<ToDo userId="test-user" />);

      await waitFor(() => {
        expect(screen.getByText(/All \(3\)/)).toBeInTheDocument();
      });

      const overdueButton = screen.getByText(/Overdue \(2\)/);
      fireEvent.click(overdueButton);

      await waitFor(() => {
        expect(overdueButton).toHaveClass('bg-red-500');
      });
    });

    it('should filter tasks when Completed tab is clicked', async () => {
      render(<ToDo userId="test-user" />);

      await waitFor(() => {
        expect(screen.getByText(/All \(3\)/)).toBeInTheDocument();
      });

      const completedButton = screen.getByText(/Completed \(1\)/);
      fireEvent.click(completedButton);

      await waitFor(() => {
        expect(completedButton).toHaveClass('bg-green-500');
      });
    });
  });

  describe('Task Completion', () => {
    it('should handle task completion with user and updateUserPoints', async () => {
      render(
        <ToDo 
          user={mockUser} 
          updateUserPoints={mockUpdateUserPoints}
          userId="test-user" 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      const completeButton = screen.getByTestId('complete-1');
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockUpdateUserPoints).toHaveBeenCalledWith(110); // 100 + 10
      });

      await waitFor(() => {
        expect(apiService.getUser).toHaveBeenCalledWith('test-user');
      });
    });

    it('should handle task completion without user', async () => {
      render(<ToDo userId="test-user" />);

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      const completeButton = screen.getByTestId('complete-1');
      fireEvent.click(completeButton);

      // Should not call updateUserPoints
      expect(mockUpdateUserPoints).not.toHaveBeenCalled();
    });

    it('should clear chrome alarm for exercise task', async () => {
      render(<ToDo userId="test-user" />);

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      const completeButton = screen.getByTestId('complete-1');
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(global.chrome.alarms.get).toHaveBeenCalledWith(
          'exercise-1',
          expect.any(Function)
        );
      });
    });

    it('should clear chrome alarm for break task', async () => {
      render(<ToDo userId="test-user" />);

      await waitFor(() => {
        expect(screen.getByText('Task 2')).toBeInTheDocument();
      });

      const completeButton = screen.getByTestId('complete-2');
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(global.chrome.alarms.get).toHaveBeenCalledWith(
          'break-2',
          expect.any(Function)
        );
      });
    });

    // it('should not clear alarm for non-exercise/break tasks', async () => {
    //   render(<ToDo userId="test-user" />);

    //   await waitFor(() => {
    //     expect(screen.getByText('Task 3')).toBeInTheDocument();
    //   });

    //   const completeButton = screen.getByTestId('complete-3');
    //   fireEvent.click(completeButton);

    //   // Wait a bit to ensure alarm operations don't happen
    //   await new Promise(resolve => setTimeout(resolve, 100));
      
    //   expect(global.chrome.alarms.get).not.toHaveBeenCalled();
    // });

    // it('should handle alarm clear failure gracefully', async () => {
    //   (global.chrome.alarms.clear as jest.Mock).mockImplementation(
    //     (alarmId, callback) => callback(false)
    //   );

    //   const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    //   render(<ToDo userId="test-user" />);

    //   await waitFor(() => {
    //     expect(screen.getByText('Task 1')).toBeInTheDocument();
    //   });

    //   const completeButton = screen.getByTestId('complete-1');
    //   fireEvent.click(completeButton);

    //   await waitFor(() => {
    //     expect(consoleSpy).toHaveBeenCalledWith(
    //       expect.stringContaining('Failed to clear alarm')
    //     );
    //   });

    //   consoleSpy.mockRestore();
    // });

    it('should handle alarm not found scenario', async () => {
      (global.chrome.alarms.get as jest.Mock).mockImplementation(
        (alarmId, callback) => callback(null)
      );

      render(<ToDo userId="test-user" />);

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      const completeButton = screen.getByTestId('complete-1');
      fireEvent.click(completeButton);

      // Should not attempt to clear if alarm doesn't exist
      await waitFor(() => {
        expect(global.chrome.alarms.clear).not.toHaveBeenCalled();
      });
    });

    // it('should refresh task data after completion with delay', async () => {
    //   render(<ToDo userId="test-user" />);

    //   await waitFor(() => {
    //     expect(screen.getByText('Task 1')).toBeInTheDocument();
    //   });

    //   // Clear the initial call count
    //   jest.clearAllMocks();
    //   (apiService.getCombinedTasks as jest.Mock).mockResolvedValue(mockCombinedData);

    //   const completeButton = screen.getByTestId('complete-1');
    //   fireEvent.click(completeButton);

    //   // Verify no immediate call
    //   expect(apiService.getCombinedTasks).not.toHaveBeenCalled();

    //   // Fast-forward time by 3 seconds and flush promises
    //   jest.advanceTimersByTime(3000);
    //   await waitFor(() => {
    //     expect(apiService.getCombinedTasks).toHaveBeenCalledTimes(1);
    //   });
    // });

    // it('should clear previous refresh timer when task completed again', async () => {
    //   render(<ToDo userId="test-user" />);

    //   await waitFor(() => {
    //     expect(screen.getByText('Task 1')).toBeInTheDocument();
    //   });

    //   // Clear the initial call count
    //   jest.clearAllMocks();
    //   (apiService.getCombinedTasks as jest.Mock).mockResolvedValue(mockCombinedData);

    //   const completeButton = screen.getByTestId('complete-1');
      
    //   // Complete first time
    //   fireEvent.click(completeButton);
    //   jest.advanceTimersByTime(1000);
      
    //   // Complete second time before first timer fires
    //   fireEvent.click(completeButton);
    //   jest.advanceTimersByTime(3000);

    //   await waitFor(() => {
    //     // Should only refresh once (the second timer cleared the first)
    //     expect(apiService.getCombinedTasks).toHaveBeenCalledTimes(1);
    //   });
    // });

    it('should handle user fetch error after task completion', async () => {
      (apiService.getUser as jest.Mock).mockRejectedValue(
        new Error('User fetch failed')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <ToDo 
          user={mockUser} 
          updateUserPoints={mockUpdateUserPoints}
          userId="test-user" 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      const completeButton = screen.getByTestId('complete-1');
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to refresh user data:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    // it('should handle refresh data error', async () => {
    //   const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    //   render(<ToDo userId="test-user" />);

    //   await waitFor(() => {
    //     expect(screen.getByText('Task 1')).toBeInTheDocument();
    //   });

    //   // Clear initial mocks and set up error for refresh
    //   jest.clearAllMocks();
    //   (apiService.getCombinedTasks as jest.Mock).mockRejectedValueOnce(
    //     new Error('Refresh failed')
    //   );

    //   const completeButton = screen.getByTestId('complete-1');
    //   fireEvent.click(completeButton);

    //   // Advance timers and wait for the error
    //   jest.advanceTimersByTime(3000);

    //   await waitFor(() => {
    //     expect(consoleSpy).toHaveBeenCalledWith(
    //       'Failed to refresh task data:',
    //       expect.any(Error)
    //     );
    //   });

    //   consoleSpy.mockRestore();
    // });
  });

  describe('Grouped Tasks Display', () => {
    it('should display tasks grouped by date for "all" filter', async () => {
      render(<ToDo userId="test-user" />);

      await waitFor(() => {
        expect(screen.getAllByTestId('task-container').length).toBeGreaterThan(0);
      });
    });

    it('should display overdue days count for overdue filter', async () => {
      render(<ToDo userId="test-user" />);

      await waitFor(() => {
        expect(screen.getByText(/All \(3\)/)).toBeInTheDocument();
      });

      // Overdue count is 2 because both Task 1 (today) and Task 3 (yesterday) are overdue
      const overdueButton = screen.getByText(/Overdue \(2\)/);
      fireEvent.click(overdueButton);

      await waitFor(() => {
        const dateStrings = screen.getAllByTestId('date-string');
        const hasOverdueText = dateStrings.some(el => 
          el.textContent?.includes('overdue')
        );
        expect(hasOverdueText).toBe(true);
      });
    });

    it('should display "1 day overdue" for single day', async () => {
      const oneDayOldTask = {
        id: '5',
        title: 'One Day Old',
        scheduled_end_at: new Date(Date.now() - 86400000).toISOString(),
        task_type: 'homework',
        points_value: 10,
      };

      (apiService.getCombinedTasks as jest.Mock).mockResolvedValue({
        ...mockCombinedData,
        incomplete_tasks: [oneDayOldTask],
      });

      render(<ToDo userId="test-user" />);

      await waitFor(() => {
        expect(screen.getByText(/All \(1\)/)).toBeInTheDocument();
      });

      const overdueButton = screen.getByText(/Overdue \(1\)/);
      fireEvent.click(overdueButton);

      await waitFor(() => {
        const dateStrings = screen.getAllByTestId('date-string');
        const hasDayText = dateStrings.some(el => 
          el.textContent?.includes('1 day overdue')
        );
        expect(hasDayText).toBe(true);
      });
    });

    it('should render empty task container when no grouped tasks', async () => {
      (apiService.getCombinedTasks as jest.Mock).mockResolvedValue({
        ...mockCombinedData,
        incomplete_tasks: [],
      });

      render(<ToDo userId="test-user" />);

      await waitFor(() => {
        const taskCount = screen.getByTestId('task-count');
        expect(taskCount.textContent).toBe('0');
      });
    });
  });

//   describe('Cleanup', () => {
    // it('should clear refresh timer on unmount', async () => {
    //   const { unmount } = render(<ToDo userId="test-user" />);

    //   await waitFor(() => {
    //     expect(screen.getByText('Task 1')).toBeInTheDocument();
    //   });

    //   // Clear initial call count
    //   jest.clearAllMocks();
    //   (apiService.getCombinedTasks as jest.Mock).mockResolvedValue(mockCombinedData);

    //   const completeButton = screen.getByTestId('complete-1');
    //   fireEvent.click(completeButton);

    //   // Unmount before timer fires
    //   unmount();

    //   // Timer should be cleared, so advancing time shouldn't trigger refresh
    //   jest.advanceTimersByTime(3000);
      
    //   // Wait a bit to ensure no async operations happen
    //   await new Promise(resolve => setTimeout(resolve, 100));
      
    //   expect(apiService.getCombinedTasks).not.toHaveBeenCalled();
    // });
//   });

  describe('Edge Cases', () => {
    it('should handle tasks at exact midnight boundaries', async () => {
      const midnightTask = {
        id: '6',
        title: 'Midnight Task',
        scheduled_end_at: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        task_type: 'homework',
        points_value: 10,
      };

      (apiService.getCombinedTasks as jest.Mock).mockResolvedValue({
        ...mockCombinedData,
        incomplete_tasks: [midnightTask],
      });

      render(<ToDo userId="test-user" />);

      await waitFor(() => {
        expect(screen.getByText(/Today \(1\)/)).toBeInTheDocument();
      });
    });

    it('should handle notification error gracefully', async () => {
      (global.chrome.alarms.get as jest.Mock).mockImplementation(() => {
        throw new Error('Chrome API error');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(<ToDo userId="test-user" />);

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      const completeButton = screen.getByTestId('complete-1');
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to clear task notification:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });
});