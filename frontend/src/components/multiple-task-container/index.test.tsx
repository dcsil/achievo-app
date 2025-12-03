import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import MultipleTaskContainer from './index';
import { apiService } from '../../api-contexts/user-context';
import { getAssignment } from '../../api-contexts/get-assignments';

// Mock the dependencies
jest.mock('../../api-contexts/user-context');
jest.mock('../../api-contexts/get-assignments');
jest.mock('../task-complete', () => {
  return function MockTaskComplete({ 
    isOpen, 
    task, 
    assignment, 
    onClose, 
    onRefreshData, 
    coinsEarned, 
    userId 
  }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="task-complete-overlay">
        <div>Task: {task.title}</div>
        <div>Assignment: {assignment || 'None'}</div>
        <div>Coins: {coinsEarned}</div>
        <div>User: {userId}</div>
        <button onClick={onClose} data-testid="close-overlay">Close</button>
        <button onClick={onRefreshData} data-testid="refresh-data">Refresh</button>
      </div>
    );
  };
});

jest.mock('../task-component', () => {
  return function MockTaskComponent({ 
    task, 
    onCompleteTask, 
    showCompleteButton, 
    isCompleting,
    timeAdjustment
  }: any) {
    return (
      <div data-testid={`task-component-${task.task_id}`}>
        <div>Task: {task.description}</div>
        <div>Type: {task.type}</div>
        <div>Course: {task.course_id}</div>
        <div>Completing: {isCompleting ? 'true' : 'false'}</div>
        <div>ShowComplete: {showCompleteButton ? 'true' : 'false'}</div>
        <div>TimeAdjustment: {timeAdjustment ? 'true' : 'false'}</div>
        {showCompleteButton && (
          <button 
            onClick={() => onCompleteTask(task)}
            data-testid={`complete-task-${task.task_id}`}
            disabled={isCompleting}
          >
            Complete Task
          </button>
        )}
      </div>
    );
  };
});

// Mock ReactDOM.createPortal to render in place
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: any) => node,
}));

const mockApiService = {
  completeTask: jest.fn()
};
const mockGetAssignment = getAssignment as jest.MockedFunction<typeof getAssignment>;

// Replace the actual services with our mocks
Object.defineProperty(require('../../api-contexts/user-context'), 'apiService', {
  value: mockApiService,
  writable: true
});

describe('MultipleTaskContainer', () => {
  const mockTasks = [
    {
      task_id: 'task-1',
      user_id: 'user-1',
      description: 'Complete homework',
      type: 'assignment',
      assignment_id: 'assignment-1',
      course_id: 'course-1',
      course_color: '#3B82F6',
      scheduled_start_at: '2024-01-01T10:00:00Z',
      scheduled_end_at: '2024-01-01T11:00:00Z',
      is_completed: false,
      reward_points: 20
    },
    {
      task_id: 'task-2',
      user_id: 'user-1',
      description: 'Study for exam',
      type: 'study',
      assignment_id: 'assignment-2',
      course_id: 'course-2',
      course_color: '#EF4444',
      scheduled_start_at: '2024-01-02T14:00:00Z',
      scheduled_end_at: '2024-01-02T15:00:00Z',
      is_completed: false,
      reward_points: 15
    }
  ];

  const mockCompletedTasks = [
    {
      task_id: 'completed-task-1',
      user_id: 'user-1',
      description: 'Completed homework',
      type: 'assignment',
      assignment_id: 'assignment-1',
      course_id: 'course-1',
      course_color: '#3B82F6',
      completion_date_at: '2024-01-01T12:00:00Z',
      is_completed: true,
      reward_points: 20
    }
  ];

  const defaultProps = {
    tasks: mockTasks,
    userId: 'user-1',
    onTaskCompleted: jest.fn(),
    onTasksUpdate: jest.fn(),
    onRefreshData: jest.fn(),
    showCompleteButton: true,
    dateString: '2024-01-01',
    timeAdjustment: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering and Initial State', () => {
    it('renders without crashing with valid tasks', () => {
      render(<MultipleTaskContainer {...defaultProps} />);
      expect(screen.getByTestId('task-component-task-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-component-task-2')).toBeInTheDocument();
    });

    it('renders empty state when no tasks are provided', () => {
      render(<MultipleTaskContainer {...defaultProps} tasks={[]} />);
      expect(screen.getByText('No tasks yet!')).toBeInTheDocument();
      expect(screen.getByText("You're all caught up")).toBeInTheDocument();
    });

    it('renders empty state for completed tasks when no completed tasks', () => {
      render(<MultipleTaskContainer {...defaultProps} tasks={[]} showCompleteButton={false} />);
      expect(screen.getByText('No completed tasks yet!')).toBeInTheDocument();
      expect(screen.getByText('Complete some tasks to see them here')).toBeInTheDocument();
    });

    it('renders date string with task count', () => {
      render(<MultipleTaskContainer {...defaultProps} dateString="2024-01-01" />);
      expect(screen.getByText('Sunday, Dec 31')).toBeInTheDocument();
      expect(screen.getByText('(2 tasks)')).toBeInTheDocument();
    });

    it('handles non-array tasks gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      render(<MultipleTaskContainer {...defaultProps} tasks={null as any} />);
      expect(screen.getByText('No tasks yet!')).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith('MultipleTaskContainer received non-array tasks:', null);
    });

    it('renders with minimal props', () => {
      render(<MultipleTaskContainer tasks={mockTasks} userId="user-1" />);
      expect(screen.getByTestId('task-component-task-1')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats "Today" correctly', () => {
      const today = new Date().toISOString().split('T')[0];
      render(<MultipleTaskContainer {...defaultProps} dateString={today} />);
      expect(screen.getByText('Tuesday, Dec 2')).toBeInTheDocument();
    });

    it('formats "Tomorrow" correctly', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split('T')[0];
      render(<MultipleTaskContainer {...defaultProps} dateString={tomorrowString} />);
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('handles overdue date strings', () => {
      render(<MultipleTaskContainer {...defaultProps} dateString="2024-01-01 (5 days overdue)" />);
      expect(screen.getByText('2024-01-01 (5 days overdue)')).toBeInTheDocument();
    });

    it('formats other dates with weekday and month', () => {
      render(<MultipleTaskContainer {...defaultProps} dateString="2024-03-15" />);
      expect(screen.getByText('Thursday, Mar 14')).toBeInTheDocument();
    });
  });

  describe('Task Sorting', () => {
    it('sorts incomplete tasks by scheduled_start_at (earliest first)', () => {
      const unsortedTasks = [
        { ...mockTasks[1], scheduled_start_at: '2024-01-03T14:00:00Z' },
        { ...mockTasks[0], scheduled_start_at: '2024-01-01T10:00:00Z' }
      ];
      render(<MultipleTaskContainer {...defaultProps} tasks={unsortedTasks} />);
      
      // First task should be the one with earlier date
      const taskComponents = screen.getAllByTestId(/task-component-/);
      expect(taskComponents[0]).toHaveAttribute('data-testid', 'task-component-task-1');
      expect(taskComponents[1]).toHaveAttribute('data-testid', 'task-component-task-2');
    });

    it('sorts completed tasks by completion_date_at (most recent first)', () => {
      const completedTasks = [
        { ...mockCompletedTasks[0], completion_date_at: '2024-01-01T12:00:00Z', task_id: 'old-task' },
        { ...mockCompletedTasks[0], completion_date_at: '2024-01-02T12:00:00Z', task_id: 'new-task' }
      ];
      render(<MultipleTaskContainer {...defaultProps} tasks={completedTasks} showCompleteButton={false} />);
      
      const taskComponents = screen.getAllByTestId(/task-component-/);
      expect(taskComponents[0]).toHaveAttribute('data-testid', 'task-component-new-task');
      expect(taskComponents[1]).toHaveAttribute('data-testid', 'task-component-old-task');
    });
  });

  describe('Show More/Collapse Functionality', () => {
    const manyTasks = Array.from({ length: 10 }, (_, i) => ({
      ...mockTasks[0],
      task_id: `task-${i + 1}`,
      description: `Task ${i + 1}`,
      scheduled_start_at: `2024-01-0${(i % 9) + 1}T10:00:00Z`
    }));

    it('shows only initial tasks when there are many tasks', () => {
      render(<MultipleTaskContainer {...defaultProps} tasks={manyTasks} />);
      
      // Should show 5 tasks initially
      expect(screen.getAllByTestId(/task-component-/).length).toBe(5);
      expect(screen.getByText(/Show 3 More Tasks/)).toBeInTheDocument();
    });

    it('expands to show more tasks when "Show More" is clicked', async () => {
      render(<MultipleTaskContainer {...defaultProps} tasks={manyTasks} />);
      
      fireEvent.click(screen.getByText(/Show 3 More Tasks/));
      await waitFor(() => {
        expect(screen.getAllByTestId(/task-component-/).length).toBe(8);
      });
    });

    it('shows all tasks when expanded beyond the increment', async () => {
      render(<MultipleTaskContainer {...defaultProps} tasks={manyTasks} />);
      
      // Click show more once (shows 8)
      fireEvent.click(screen.getByText(/Show 3 More Tasks/));
      await waitFor(() => {
        expect(screen.getAllByTestId(/task-component-/).length).toBe(8);
      });
      
      // Click show more again (shows all 10)
      fireEvent.click(screen.getByText(/Show 2 More Tasks/));
      await waitFor(() => {
        expect(screen.getAllByTestId(/task-component-/).length).toBe(10);
      });
    });

    it('collapses back to initial view when "Collapse" is clicked', async () => {
      render(<MultipleTaskContainer {...defaultProps} tasks={manyTasks} />);
      
      // Expand first
      fireEvent.click(screen.getByText(/Show 3 More Tasks/));
      await waitFor(() => {
        expect(screen.getAllByTestId(/task-component-/).length).toBe(8);
      });
      
      // Then collapse
      fireEvent.click(screen.getByText('Collapse'));
      await waitFor(() => {
        expect(screen.getAllByTestId(/task-component-/).length).toBe(5);
      });
    });

    it('handles tasks list shorter than initial page size', () => {
      const fewTasks = manyTasks.slice(0, 3);
      render(<MultipleTaskContainer {...defaultProps} tasks={fewTasks} />);
      
      expect(screen.getAllByTestId(/task-component-/).length).toBe(3);
      expect(screen.queryByText(/Show More/)).not.toBeInTheDocument();
      expect(screen.queryByText('Collapse')).not.toBeInTheDocument();
    });
  });

  describe('Task Completion', () => {
    beforeEach(() => {
      mockApiService.completeTask.mockClear();
      mockGetAssignment.mockClear();
    });

    it('completes a task successfully without assignment completion', async () => {
      mockApiService.completeTask.mockResolvedValue({
        points_earned: 20,
        assignment_completed: false
      });

      render(<MultipleTaskContainer {...defaultProps} />);
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('complete-task-task-1'));
      });

      await waitFor(() => {
        expect(mockApiService.completeTask).toHaveBeenCalledWith('task-1');
        expect(screen.getByTestId('task-complete-overlay')).toBeInTheDocument();
        expect(screen.getByText('Coins: 20')).toBeInTheDocument();
      });

      expect(defaultProps.onTaskCompleted).toHaveBeenCalledWith('task-1', 'assignment', 20, 'course-1');
    });

    it('completes a task with assignment completion', async () => {
      mockApiService.completeTask.mockResolvedValue({
        points_earned: 20,
        assignment_completed: true
      });
      mockGetAssignment.mockResolvedValue({
        assignment_id: 'assignment-1',
        course_id: 'course-1',
        title: 'Math Homework',
        due_date: '2024-01-01',
        completion_points: 50,
        is_complete: true
      });

      render(<MultipleTaskContainer {...defaultProps} />);
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('complete-task-task-1'));
      });

      await waitFor(() => {
        expect(mockGetAssignment).toHaveBeenCalledWith('assignment-1');
        expect(screen.getByText('Coins: 70')).toBeInTheDocument(); // 20 + 50
        expect(screen.getByText('Assignment: Math Homework')).toBeInTheDocument();
      });
    });

    it('removes completed task from the list', async () => {
      mockApiService.completeTask.mockResolvedValue({
        points_earned: 20,
        assignment_completed: false
      });

      render(<MultipleTaskContainer {...defaultProps} />);
      
      expect(screen.getByTestId('task-component-task-1')).toBeInTheDocument();
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('complete-task-task-1'));
      });

      await waitFor(() => {
        expect(screen.queryByTestId('task-component-task-1')).not.toBeInTheDocument();
        expect(screen.getByTestId('task-component-task-2')).toBeInTheDocument();
      });

      expect(defaultProps.onTasksUpdate).toHaveBeenCalledWith([mockTasks[1]]);
    });

    it('adjusts tasksToShow when removing task from expanded view', async () => {
      const manyTasks = Array.from({ length: 10 }, (_, i) => ({
        ...mockTasks[0],
        task_id: `task-${i + 1}`,
        description: `Task ${i + 1}`,
        scheduled_start_at: `2024-01-0${(i % 9) + 1}T10:00:00Z`
      }));

      mockApiService.completeTask.mockResolvedValue({
        points_earned: 20,
        assignment_completed: false
      });

      render(<MultipleTaskContainer {...defaultProps} tasks={manyTasks} />);
      
      // Expand to show more tasks
      fireEvent.click(screen.getByText(/Show 3 More Tasks/));
      await waitFor(() => {
        expect(screen.getAllByTestId(/task-component-/).length).toBe(8);
      });
      
      // Complete a task
      await act(async () => {
        fireEvent.click(screen.getByTestId('complete-task-task-1'));
      });

      await waitFor(() => {
        // Should still show 8 tasks (9 remaining tasks, showing up to 8 as it was expanded)
        expect(screen.getAllByTestId(/task-component-/).length).toBe(8);
      });
    });

    it('prevents multiple simultaneous task completions', async () => {
      mockApiService.completeTask.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ points_earned: 20, assignment_completed: false }), 100))
      );

      render(<MultipleTaskContainer {...defaultProps} />);
      
      // Click multiple times rapidly
      fireEvent.click(screen.getByTestId('complete-task-task-1'));
      fireEvent.click(screen.getByTestId('complete-task-task-1'));
      fireEvent.click(screen.getByTestId('complete-task-task-1'));

      await waitFor(() => {
        expect(mockApiService.completeTask).toHaveBeenCalledTimes(1);
      });
    });

    it('handles task completion errors gracefully', async () => {
      mockApiService.completeTask.mockRejectedValue(new Error('Network error'));
      window.alert = jest.fn();

      render(<MultipleTaskContainer {...defaultProps} />);
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('complete-task-task-1'));
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to complete task. Please try again.');
        expect(screen.getByTestId('task-component-task-1')).toBeInTheDocument(); // Task should still be there
      });
    });

    it('closes overlay correctly', async () => {
      mockApiService.completeTask.mockResolvedValue({
        points_earned: 20,
        assignment_completed: false
      });

      render(<MultipleTaskContainer {...defaultProps} />);
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('complete-task-task-1'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('task-complete-overlay')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('close-overlay'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('task-complete-overlay')).not.toBeInTheDocument();
      });
    });

    it('calls onRefreshData when refresh button is clicked in overlay', async () => {
      mockApiService.completeTask.mockResolvedValue({
        points_earned: 20,
        assignment_completed: false
      });

      render(<MultipleTaskContainer {...defaultProps} />);
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('complete-task-task-1'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('task-complete-overlay')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('refresh-data'));
      
      expect(defaultProps.onRefreshData).toHaveBeenCalled();
    });
  });

  describe('Props Variations', () => {
    it('renders without showCompleteButton', () => {
      render(<MultipleTaskContainer {...defaultProps} showCompleteButton={false} />);
      
      expect(screen.getAllByText('ShowComplete: false')).toHaveLength(2); // Two tasks rendered
    });

    it('renders without timeAdjustment', () => {
      render(<MultipleTaskContainer {...defaultProps} timeAdjustment={false} />);
      
      expect(screen.getAllByText('TimeAdjustment: false')).toHaveLength(2); // Two tasks rendered
    });

    it('renders without dateString', () => {
      render(<MultipleTaskContainer {...defaultProps} dateString={undefined} />);
      
      expect(screen.queryByText(/Monday, Jan 1/)).not.toBeInTheDocument();
    });

    it('handles singular task count in date string', () => {
      render(<MultipleTaskContainer {...defaultProps} tasks={[mockTasks[0]]} dateString="2024-01-01" />);
      expect(screen.getByText('(1 task)')).toBeInTheDocument();
    });
  });

  describe('Error Cases and Edge Cases', () => {
    it('resets tasksToShow when tasks prop changes', async () => {
      const manyTasks = Array.from({ length: 10 }, (_, i) => ({
        ...mockTasks[0],
        task_id: `task-${i + 1}`,
        description: `Task ${i + 1}`
      }));

      const { rerender } = render(<MultipleTaskContainer {...defaultProps} tasks={manyTasks} />);
      
      // Expand view
      fireEvent.click(screen.getByText(/Show 3 More Tasks/));
      await waitFor(() => {
        expect(screen.getAllByTestId(/task-component-/).length).toBe(8);
      });
      
      // Change tasks prop
      rerender(<MultipleTaskContainer {...defaultProps} tasks={mockTasks} />);
      
      // Should reset to showing 2 tasks (all available)
      expect(screen.getAllByTestId(/task-component-/).length).toBe(2);
    });

    it('handles tasks becoming empty after removal', async () => {
      mockApiService.completeTask.mockResolvedValue({
        points_earned: 20,
        assignment_completed: false
      });

      const singleTask = [mockTasks[0]];
      render(<MultipleTaskContainer {...defaultProps} tasks={singleTask} />);
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('complete-task-task-1'));
      });

      await waitFor(() => {
        expect(screen.getByText('No tasks yet!')).toBeInTheDocument();
      });
    });
  });

  describe('Console Logging', () => {
    it('logs task completion message', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      mockApiService.completeTask.mockResolvedValue({
        points_earned: 20,
        assignment_completed: false
      });

      render(<MultipleTaskContainer {...defaultProps} />);
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('complete-task-task-1'));
      });

      expect(consoleSpy).toHaveBeenCalledWith('Task completed. Points earned: 20');
    });

    it('logs assignment completion message', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      mockApiService.completeTask.mockResolvedValue({
        points_earned: 20,
        assignment_completed: true
      });
      mockGetAssignment.mockResolvedValue({
        assignment_id: 'assignment-1',
        course_id: 'course-1',
        title: 'Math Homework',
        due_date: '2024-01-01',
        completion_points: 50,
        is_complete: true
      });

      render(<MultipleTaskContainer {...defaultProps} />);
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('complete-task-task-1'));
      });

      expect(consoleSpy).toHaveBeenCalledWith('Task completed. Points earned: 20\nAssignment completed! Additional points earned: 50');
    });
  });
});
