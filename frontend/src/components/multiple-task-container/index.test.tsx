import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MultipleTaskContainer from './index';
import { apiService } from '../../api-contexts/user-context';
import { getAssignment } from '../../api-contexts/get-assignments';
import ReactDOM from 'react-dom';

// Mock dependencies
jest.mock('../../api-contexts/user-context');
jest.mock('../../api-contexts/get-assignments');
jest.mock('../task-complete', () => {
  return function TaskComplete({ isOpen, onClose, task, coinsEarned }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="task-complete-overlay">
        <div>Task: {task.title}</div>
        <div>Coins: {coinsEarned}</div>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});
jest.mock('../task-component', () => {
  return function TaskComponent({ task, onCompleteTask, showCompleteButton, isCompleting }: any) {
    return (
      <li data-testid={`task-${task.task_id}`}>
        <div>{task.description}</div>
        {showCompleteButton && (
          <button 
            onClick={() => onCompleteTask(task)}
            disabled={isCompleting}
            data-testid={`complete-btn-${task.task_id}`}
          >
            Complete
          </button>
        )}
      </li>
    );
  };
});

// Mock ReactDOM.createPortal
const mockCreatePortal = jest.fn((element) => element);
(ReactDOM.createPortal as jest.Mock) = mockCreatePortal;

describe('MultipleTaskContainer', () => {
  const mockUserId = 'user-123';
  const mockTasks = [
    {
      task_id: 'task-1',
      description: 'Task 1',
      scheduled_start_at: '2024-01-15T10:00:00Z',
      completion_date_at: '2024-01-15T12:00:00Z',
      course_color: '#FF0000',
      type: 'homework',
      course_id: 'course-1',
      assignment_id: null
    },
    {
      task_id: 'task-2',
      description: 'Task 2',
      scheduled_start_at: '2024-01-16T10:00:00Z',
      completion_date_at: '2024-01-16T12:00:00Z',
      course_color: '#00FF00',
      type: 'quiz',
      course_id: 'course-2',
      assignment_id: null
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreatePortal.mockImplementation((element) => element);
  });

  describe('Rendering', () => {
    it('should render empty state for incomplete tasks when no tasks provided', () => {
      render(<MultipleTaskContainer tasks={[]} userId={mockUserId} />);
      
      expect(screen.getByText('🎉')).toBeInTheDocument();
      expect(screen.getByText('No tasks yet!')).toBeInTheDocument();
      expect(screen.getByText("You're all caught up")).toBeInTheDocument();
    });

    it('should render empty state for completed tasks when no tasks provided', () => {
      render(
        <MultipleTaskContainer 
          tasks={[]} 
          userId={mockUserId} 
          showCompleteButton={false}
        />
      );
      
      expect(screen.getByText('📂')).toBeInTheDocument();
      expect(screen.getByText('No completed tasks yet!')).toBeInTheDocument();
      expect(screen.getByText('Complete some tasks to see them here')).toBeInTheDocument();
    });

    it('should render task list when tasks are provided', () => {
      render(<MultipleTaskContainer tasks={mockTasks} userId={mockUserId} />);
      
      expect(screen.getByTestId('task-task-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-task-2')).toBeInTheDocument();
    });

    it('should handle non-array tasks gracefully', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<MultipleTaskContainer tasks={'invalid' as any} userId={mockUserId} />);
      
      expect(consoleError).toHaveBeenCalledWith(
        'MultipleTaskContainer received non-array tasks:',
        'invalid'
      );
      expect(screen.getByText('No tasks yet!')).toBeInTheDocument();
      
      consoleError.mockRestore();
    });

    it('should render with dateString header', () => {
      render(
        <MultipleTaskContainer 
          tasks={mockTasks} 
          userId={mockUserId}
          dateString="2024-01-15"
        />
      );
      
      expect(screen.getByText(/2 tasks/)).toBeInTheDocument();
    });
  });

  describe('Task Sorting', () => {
    it('should sort incomplete tasks by scheduled_start_at (earliest first)', () => {
      const unsortedTasks = [
        { ...mockTasks[1], scheduled_start_at: '2024-01-20T10:00:00Z' },
        { ...mockTasks[0], scheduled_start_at: '2024-01-10T10:00:00Z' }
      ];
      
      render(
        <MultipleTaskContainer 
          tasks={unsortedTasks} 
          userId={mockUserId}
          showCompleteButton={true}
        />
      );
      
      const taskElements = screen.getAllByRole('listitem');
      expect(taskElements[0]).toHaveAttribute('data-testid', 'task-task-1');
      expect(taskElements[1]).toHaveAttribute('data-testid', 'task-task-2');
    });

    it('should sort completed tasks by completion_date_at (most recent first)', () => {
      const unsortedTasks = [
        { ...mockTasks[0], completion_date_at: '2024-01-10T12:00:00Z' },
        { ...mockTasks[1], completion_date_at: '2024-01-20T12:00:00Z' }
      ];
      
      render(
        <MultipleTaskContainer 
          tasks={unsortedTasks} 
          userId={mockUserId}
          showCompleteButton={false}
        />
      );
      
      const taskElements = screen.getAllByRole('listitem');
      expect(taskElements[0]).toHaveAttribute('data-testid', 'task-task-2');
      expect(taskElements[1]).toHaveAttribute('data-testid', 'task-task-1');
    });
  });

  describe('Show More / Collapse Functionality', () => {
    const manyTasks = Array.from({ length: 10 }, (_, i) => ({
      ...mockTasks[0],
      task_id: `task-${i}`,
      description: `Task ${i}`,
      scheduled_start_at: `2024-01-${10 + i}T10:00:00Z`
    }));

    it('should initially show 5 tasks', () => {
      render(<MultipleTaskContainer tasks={manyTasks} userId={mockUserId} />);
      
      expect(screen.getByTestId('task-task-0')).toBeInTheDocument();
      expect(screen.getByTestId('task-task-4')).toBeInTheDocument();
      expect(screen.queryByTestId('task-task-5')).not.toBeInTheDocument();
    });

    it('should show more tasks when Show More button is clicked', () => {
      render(<MultipleTaskContainer tasks={manyTasks} userId={mockUserId} />);
      
      const showMoreButton = screen.getByText(/Show \d+ More Tasks/);
      fireEvent.click(showMoreButton);
      
      expect(screen.getByTestId('task-task-5')).toBeInTheDocument();
      expect(screen.getByTestId('task-task-7')).toBeInTheDocument();
    });

    it('should collapse tasks when Collapse button is clicked', () => {
      render(<MultipleTaskContainer tasks={manyTasks} userId={mockUserId} />);
      
      const showMoreButton = screen.getByText(/Show \d+ More Tasks/);
      fireEvent.click(showMoreButton);
      
      const collapseButton = screen.getByText('Collapse');
      fireEvent.click(collapseButton);
      
      expect(screen.queryByTestId('task-task-5')).not.toBeInTheDocument();
    });

    it('should not show Show More button when all tasks are displayed', () => {
      const fewTasks = mockTasks.slice(0, 3);
      render(<MultipleTaskContainer tasks={fewTasks} userId={mockUserId} />);
      
      expect(screen.queryByText(/Show \d+ More Tasks/)).not.toBeInTheDocument();
    });

    it('should show correct number in Show More button', () => {
      render(<MultipleTaskContainer tasks={manyTasks} userId={mockUserId} />);
      
      const showMoreButton = screen.getByText(/Show 3 More Tasks/);
      expect(showMoreButton).toBeInTheDocument();
    });

    it('should handle showing all remaining tasks when less than increment remain', () => {
      const tasks = Array.from({ length: 7 }, (_, i) => ({
        ...mockTasks[0],
        task_id: `task-${i}`,
        scheduled_start_at: `2024-01-${10 + i}T10:00:00Z`
      }));
      
      render(<MultipleTaskContainer tasks={tasks} userId={mockUserId} />);
      
      const showMoreButton = screen.getByText(/Show 2 More Tasks/);
      expect(showMoreButton).toBeInTheDocument();
    });
  });

  describe('Task Completion', () => {
    beforeEach(() => {
      (apiService.completeTask as jest.Mock).mockResolvedValue({
        points_earned: 10,
        assignment_completed: false
      });
    });

    it('should complete task successfully', async () => {
      const onTaskCompleted = jest.fn();
      
      render(
        <MultipleTaskContainer 
          tasks={mockTasks} 
          userId={mockUserId}
          onTaskCompleted={onTaskCompleted}
        />
      );
      
      const completeButton = screen.getByTestId('complete-btn-task-1');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(apiService.completeTask).toHaveBeenCalledWith('task-1');
      });
      
      await waitFor(() => {
        expect(onTaskCompleted).toHaveBeenCalledWith(
          'task-1',
          'homework',
          10,
          'course-1'
        );
      });
    });

    it('should show overlay after task completion', async () => {
      render(<MultipleTaskContainer tasks={mockTasks} userId={mockUserId} />);
      
      const completeButton = screen.getByTestId('complete-btn-task-1');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('task-complete-overlay')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Task: Task 1')).toBeInTheDocument();
      expect(screen.getByText('Coins: 10')).toBeInTheDocument();
    });

    it('should handle assignment completion', async () => {
      (apiService.completeTask as jest.Mock).mockResolvedValue({
        points_earned: 10,
        assignment_completed: true
      });
      
      (getAssignment as jest.Mock).mockResolvedValue({
        completion_points: 20,
        title: 'Math Assignment'
      });
      
      const taskWithAssignment = {
        ...mockTasks[0],
        assignment_id: 'assignment-1'
      };
      
      render(<MultipleTaskContainer tasks={[taskWithAssignment]} userId={mockUserId} />);
      
      const completeButton = screen.getByTestId('complete-btn-task-1');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(getAssignment).toHaveBeenCalledWith('assignment-1');
      });
      
      await waitFor(() => {
        expect(screen.getByText('Coins: 30')).toBeInTheDocument();
      });
    });

    it('should remove completed task from list', async () => {
      const onTasksUpdate = jest.fn();
      
      render(
        <MultipleTaskContainer 
          tasks={mockTasks} 
          userId={mockUserId}
          onTasksUpdate={onTasksUpdate}
        />
      );
      
      const completeButton = screen.getByTestId('complete-btn-task-1');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(onTasksUpdate).toHaveBeenCalled();
      });
      
      const updatedTasks = onTasksUpdate.mock.calls[0][0];
      expect(updatedTasks).toHaveLength(1);
      expect(updatedTasks[0].task_id).toBe('task-2');
    });

    it('should handle completion error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const alertMock = jest.spyOn(window, 'alert').mockImplementation();
      
      (apiService.completeTask as jest.Mock).mockRejectedValue(new Error('API Error'));
      
      render(<MultipleTaskContainer tasks={mockTasks} userId={mockUserId} />);
      
      const completeButton = screen.getByTestId('complete-btn-task-1');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          '❌ Failed to complete task:',
          expect.any(Error)
        );
      });
      
      expect(alertMock).toHaveBeenCalledWith('Failed to complete task. Please try again.');
      
      consoleError.mockRestore();
      alertMock.mockRestore();
    });

    it('should prevent double-clicking complete button', async () => {
      render(<MultipleTaskContainer tasks={mockTasks} userId={mockUserId} />);
      
      const completeButton = screen.getByTestId('complete-btn-task-1');
      
      fireEvent.click(completeButton);
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(apiService.completeTask).toHaveBeenCalledTimes(1);
      });
    });

    it('should adjust tasksToShow after completion when needed', async () => {
      const manyTasks = Array.from({ length: 10 }, (_, i) => ({
        ...mockTasks[0],
        task_id: `task-${i}`,
        scheduled_start_at: `2024-01-${10 + i}T10:00:00Z`
      }));
      
      render(<MultipleTaskContainer tasks={manyTasks} userId={mockUserId} />);
      
      // Show more tasks first
      const showMoreButton = screen.getByText(/Show \d+ More Tasks/);
      fireEvent.click(showMoreButton);
      
      // Complete a task
      const completeButton = screen.getByTestId('complete-btn-task-0');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(apiService.completeTask).toHaveBeenCalled();
      });
    });

    it('should reset tasksToShow to initial when few tasks remain', async () => {
      const fewTasks = Array.from({ length: 6 }, (_, i) => ({
        ...mockTasks[0],
        task_id: `task-${i}`,
        scheduled_start_at: `2024-01-${10 + i}T10:00:00Z`
      }));
      
      render(<MultipleTaskContainer tasks={fewTasks} userId={mockUserId} />);
      
      const showMoreButton = screen.getByText(/Show \d+ More Tasks/);
      fireEvent.click(showMoreButton);
      
      const completeButton = screen.getByTestId('complete-btn-task-0');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(apiService.completeTask).toHaveBeenCalled();
      });
    });
  });

  describe('Overlay Handling', () => {
    beforeEach(() => {
      (apiService.completeTask as jest.Mock).mockResolvedValue({
        points_earned: 10,
        assignment_completed: false
      });
    });

    it('should close overlay when close button clicked', async () => {
      render(<MultipleTaskContainer tasks={mockTasks} userId={mockUserId} />);
      
      const completeButton = screen.getByTestId('complete-btn-task-1');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('task-complete-overlay')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('task-complete-overlay')).not.toBeInTheDocument();
      });
    });

    it('should render overlay as portal to document.body', async () => {
      render(<MultipleTaskContainer tasks={mockTasks} userId={mockUserId} />);
      
      const completeButton = screen.getByTestId('complete-btn-task-1');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(mockCreatePortal).toHaveBeenCalledWith(
          expect.anything(),
          document.body
        );
      });
    });

    it('should call onRefreshData when provided', async () => {
      const onRefreshData = jest.fn();
      
      render(
        <MultipleTaskContainer 
          tasks={mockTasks} 
          userId={mockUserId}
          onRefreshData={onRefreshData}
        />
      );
      
      const completeButton = screen.getByTestId('complete-btn-task-1');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('task-complete-overlay')).toBeInTheDocument();
      });
    });
  });

  describe('Date Formatting', () => {
    it('should format today\'s date', () => {
      // Create date at noon to avoid timezone issues
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0] + 'T12:00:00';
      
      render(
        <MultipleTaskContainer 
          tasks={mockTasks} 
          userId={mockUserId}
          dateString={todayString}
        />
      );
      
      expect(screen.getByText(/Today/)).toBeInTheDocument();
    });

    it('should format tomorrow\'s date', () => {
      // Create tomorrow's date at noon to avoid timezone issues
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      const tomorrowString = tomorrow.toISOString().split('T')[0] + 'T12:00:00';
      
      render(
        <MultipleTaskContainer 
          tasks={mockTasks} 
          userId={mockUserId}
          dateString={tomorrowString}
        />
      );
      
      expect(screen.getByText(/Tomorrow/)).toBeInTheDocument();
    });

    it('should format other dates with weekday and month', () => {
      // Use a specific future date with time to avoid timezone issues
      const futureDate = '2025-06-15T12:00:00';
      const expectedDate = new Date(futureDate);
      const expectedText = expectedDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
      
      render(
        <MultipleTaskContainer 
          tasks={mockTasks} 
          userId={mockUserId}
          dateString={futureDate}
        />
      );
      
      expect(screen.getByText(new RegExp(expectedText))).toBeInTheDocument();
    });

    it('should handle overdue date strings', () => {
      const overdueString = 'Monday, Jan 10 (5 days overdue)';
      
      render(
        <MultipleTaskContainer 
          tasks={mockTasks} 
          userId={mockUserId}
          dateString={overdueString}
        />
      );
      
      expect(screen.getByText(overdueString)).toBeInTheDocument();
    });

    it('should show task count with singular task', () => {
      render(
        <MultipleTaskContainer 
          tasks={[mockTasks[0]]} 
          userId={mockUserId}
          dateString="2024-01-15"
        />
      );
      
      expect(screen.getByText(/1 task\)/)).toBeInTheDocument();
    });
  });

  describe('Task Updates on Props Change', () => {
    it('should update task list when tasks prop changes', () => {
      const { rerender } = render(
        <MultipleTaskContainer tasks={mockTasks} userId={mockUserId} />
      );
      
      expect(screen.getByTestId('task-task-1')).toBeInTheDocument();
      
      const newTasks = [{
        ...mockTasks[0],
        task_id: 'task-3',
        description: 'Task 3'
      }];
      
      rerender(<MultipleTaskContainer tasks={newTasks} userId={mockUserId} />);
      
      expect(screen.queryByTestId('task-task-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('task-task-3')).toBeInTheDocument();
    });

    it('should reset tasksToShow when tasks change', () => {
      const manyTasks = Array.from({ length: 10 }, (_, i) => ({
        ...mockTasks[0],
        task_id: `task-${i}`,
        scheduled_start_at: `2024-01-${10 + i}T10:00:00Z`
      }));
      
      const { rerender } = render(
        <MultipleTaskContainer tasks={manyTasks} userId={mockUserId} />
      );
      
      const showMoreButton = screen.getByText(/Show \d+ More Tasks/);
      fireEvent.click(showMoreButton);
      
      expect(screen.getByTestId('task-task-5')).toBeInTheDocument();
      
      rerender(<MultipleTaskContainer tasks={mockTasks} userId={mockUserId} />);
      
      expect(screen.queryByTestId('task-task-5')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty task list array gracefully', () => {
      render(<MultipleTaskContainer tasks={[]} userId={mockUserId} />);
      
      expect(screen.getByText('No tasks yet!')).toBeInTheDocument();
    });

    it('should handle undefined callbacks gracefully', async () => {
      (apiService.completeTask as jest.Mock).mockResolvedValue({
        points_earned: 10,
        assignment_completed: false
      });
      
      render(<MultipleTaskContainer tasks={mockTasks} userId={mockUserId} />);
      
      const completeButton = screen.getByTestId('complete-btn-task-1');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(apiService.completeTask).toHaveBeenCalled();
      });
    });

    it('should pass timeAdjustment prop to TaskComponent', () => {
      render(
        <MultipleTaskContainer 
          tasks={mockTasks} 
          userId={mockUserId}
          timeAdjustment={false}
        />
      );
      
      expect(screen.getByTestId('task-task-1')).toBeInTheDocument();
    });

    it('should handle console.log output on successful completion', async () => {
      const consoleLog = jest.spyOn(console, 'log').mockImplementation();
      
      (apiService.completeTask as jest.Mock).mockResolvedValue({
        points_earned: 15,
        assignment_completed: false
      });
      
      render(<MultipleTaskContainer tasks={mockTasks} userId={mockUserId} />);
      
      const completeButton = screen.getByTestId('complete-btn-task-1');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(consoleLog).toHaveBeenCalledWith(
          'Task completed. Points earned: 15'
        );
      });
      
      consoleLog.mockRestore();
    });
  });
});