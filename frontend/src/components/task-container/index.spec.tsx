import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskContainer from './index';
import { apiService } from '../../api-contexts/user-context';

// Mock the API service
jest.mock('../../api-contexts/user-context', () => ({
  apiService: {
    completeTask: jest.fn(),
  },
}));

// Mock TaskComplete component
jest.mock('../task-complete', () => {
  return function MockTaskComplete({ isOpen, task, onClose, coinsEarned, userId }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="task-complete-overlay">
        <div>Task: {task?.title}</div>
        <div>Coins: {coinsEarned}</div>
        <div>User: {userId}</div>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

const mockApiService = apiService as jest.Mocked<typeof apiService>;

describe('TaskContainer Component', () => {
  const mockTasks = [
    {
      task_id: 'task-1',
      description: 'Complete assignment 1',
      course_name: 'Math 101',
      course_color: 'blue',
      course_id: 'course-1',
      scheduled_end_at: '2024-12-25T10:00:00Z'
    },
    {
      task_id: 'task-2',
      description: 'Study for exam',
      course_name: 'Physics 201',
      course_color: 'green',
      course_id: 'course-2',
      scheduled_end_at: '2024-12-26T15:30:00Z'
    }
  ];

  const defaultProps = {
    tasks: mockTasks,
    userId: 'user-123',
    onTaskCompleted: jest.fn(),
    onTasksUpdate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    mockApiService.completeTask.mockResolvedValue({
        status: 'success',
        task_id: 'task-1',
        points_earned: 150,
        assignment_completed: false,
        assignment_id: undefined  // Change from null to undefined
    });
  });

  afterEach(() => {
    // Restore console.log after each test
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    test('renders tasks when tasks array is not empty', () => {
      render(<TaskContainer {...defaultProps} />);
      
      expect(screen.getByText('Complete assignment 1')).toBeInTheDocument();
      expect(screen.getByText('Study for exam')).toBeInTheDocument();
      expect(screen.getByText('Math 101')).toBeInTheDocument();
      expect(screen.getByText('Physics 201')).toBeInTheDocument();
    });

    test('renders empty state when no tasks', () => {
      render(<TaskContainer {...defaultProps} tasks={[]} />);
      
      expect(screen.getByText('No tasks yet!')).toBeInTheDocument();
      expect(screen.getByText("You're all caught up")).toBeInTheDocument();
      expect(screen.getByText('🎉')).toBeInTheDocument();
    });

    test('displays due dates correctly', () => {
      render(<TaskContainer {...defaultProps} />);
      
      expect(screen.getByText('12/25')).toBeInTheDocument();
      expect(screen.getByText('12/26')).toBeInTheDocument();
      expect(screen.getAllByText('due')).toHaveLength(2);
    });

    test('renders tasks with course colors', () => {
      const { container } = render(<TaskContainer {...defaultProps} />);
      
      const mathCourse = screen.getByText('Math 101');
      const physicsCourse = screen.getByText('Physics 201');
      
      expect(mathCourse).toHaveClass('bg-blue-400');
      expect(physicsCourse).toHaveClass('bg-green-400');
    });

    test('handles tasks without course color', () => {
      const tasksWithoutColor = [
        {
          ...mockTasks[0],
          course_color: null
        }
      ];
      
      render(<TaskContainer {...defaultProps} tasks={tasksWithoutColor} />);
      
      const courseElement = screen.getByText('Math 101');
      expect(courseElement).toHaveClass('bg-gray-400');
    });

    test('handles tasks without course name', () => {
      const tasksWithoutCourseName = [
        {
          ...mockTasks[0],
          course_name: null
        }
      ];
      
      render(<TaskContainer {...defaultProps} tasks={tasksWithoutCourseName} />);
      
      expect(screen.getByText('Personal')).toBeInTheDocument();
    });

    test('renders task headings with correct styling', () => {
      render(<TaskContainer {...defaultProps} />);
      
      const taskHeadings = screen.getAllByRole('heading', { level: 3 });
      
      expect(taskHeadings).toHaveLength(2);
      expect(taskHeadings[0]).toHaveTextContent('Complete assignment 1');
      expect(taskHeadings[1]).toHaveTextContent('Study for exam');
      expect(taskHeadings[0]).toHaveClass('font-semibold', 'text-lg', 'text-gray-900');
    });

    test('renders coin emoji and completion text', () => {
        render(<TaskContainer {...defaultProps} />);
        
        const firstTask = screen.getByText('Complete assignment 1').closest('li');
        
        fireEvent.mouseEnter(firstTask!);
        
        expect(within(firstTask as HTMLElement).getByText('🪙')).toBeInTheDocument();
        expect(within(firstTask as HTMLElement).getByText('Complete task to earn points!')).toBeInTheDocument();
    });
  });

  describe('Hover Interactions', () => {
    test('shows complete button on hover', () => {
        render(<TaskContainer {...defaultProps} />);
        
        const firstTask = screen.getByText('Complete assignment 1').closest('li');
        
        // Initially, the actions container should be hidden (max-h-0 opacity-0)
        const actionsContainer = firstTask!.querySelector('.overflow-hidden');
        expect(actionsContainer).toHaveClass('max-h-0', 'opacity-0');
        
        // Hover over task
        fireEvent.mouseEnter(firstTask!);
        
        // After hover, the actions container should be visible (max-h-24 opacity-100)
        expect(actionsContainer).toHaveClass('max-h-24', 'opacity-100');
        expect(within(firstTask as HTMLElement).getByText('✓ Complete')).toBeInTheDocument();
        expect(within(firstTask as HTMLElement).getByText('Complete task to earn points!')).toBeInTheDocument();
    });

    test('hides complete button when mouse leaves', () => {
        render(<TaskContainer {...defaultProps} />);
        
        const firstTask = screen.getByText('Complete assignment 1').closest('li');
        
        // Hover over task
        fireEvent.mouseEnter(firstTask!);
        
        // Check that the actions container is visible within this specific task
        const actionsContainer = firstTask!.querySelector('.overflow-hidden');
        expect(actionsContainer).toHaveClass('max-h-24', 'opacity-100');
        
        // Mouse leave
        fireEvent.mouseLeave(firstTask!);
        
        // Complete section should be hidden (max-h-0 opacity-0)
        expect(actionsContainer).toHaveClass('max-h-0', 'opacity-0');
    });

    test('applies hover styles to task card', () => {
      render(<TaskContainer {...defaultProps} />);
      
      const firstTask = screen.getByText('Complete assignment 1').closest('li');
      const taskCard = firstTask?.querySelector('div');
      
      // Initial state
      expect(taskCard).toHaveClass('shadow-sm');
      
      // Hover
      fireEvent.mouseEnter(firstTask!);
      
      expect(taskCard).toHaveClass('shadow-lg', 'border-orange-300', 'scale-[1.01]');
    });

    test('can hover different tasks independently', () => {
        render(<TaskContainer {...defaultProps} />);
        
        const firstTask = screen.getByText('Complete assignment 1').closest('li');
        const secondTask = screen.getByText('Study for exam').closest('li');
        
        // Hover first task
        fireEvent.mouseEnter(firstTask!);
        expect(within(firstTask as HTMLElement).getByText('✓ Complete')).toBeInTheDocument();
        
        // Hover second task
        fireEvent.mouseLeave(firstTask!);
        fireEvent.mouseEnter(secondTask!);
        
        expect(within(secondTask as HTMLElement).getByText('✓ Complete')).toBeInTheDocument();
    });
  });

  describe('Task Completion', () => {
    test('completes task successfully', async () => {
      const mockOnTaskCompleted = jest.fn();
      const mockOnTasksUpdate = jest.fn();
      
      render(
        <TaskContainer 
          {...defaultProps} 
          onTaskCompleted={mockOnTaskCompleted}
          onTasksUpdate={mockOnTasksUpdate}
        />
      );
      
      const firstTask = screen.getByText('Complete assignment 1').closest('li');
      fireEvent.mouseEnter(firstTask!);
      
      const completeButton = firstTask!.querySelector('button');
  
      // Add null check
      expect(completeButton).not.toBeNull();

      await act(async () => {
          fireEvent.click(completeButton!);
      });
      
      await waitFor(() => {
        expect(mockApiService.completeTask).toHaveBeenCalledWith('task-1');
        expect(mockOnTaskCompleted).toHaveBeenCalledWith('task-1', 150, 'course-1');
        expect(mockOnTasksUpdate).toHaveBeenCalled();
      });
    });

    test('shows completion overlay after task completion', async () => {
      render(<TaskContainer {...defaultProps} />);
      
      const firstTask = screen.getByText('Complete assignment 1').closest('li');
      fireEvent.mouseEnter(firstTask!);
      
      const completeButton = firstTask!.querySelector('button');
  
      // Add null check
      expect(completeButton).not.toBeNull();

      await act(async () => {
          fireEvent.click(completeButton!);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('task-complete-overlay')).toBeInTheDocument();
        expect(screen.getByText('Task: Complete assignment 1')).toBeInTheDocument();
        expect(screen.getByText('Coins: 150')).toBeInTheDocument();
        expect(screen.getByText('User: user-123')).toBeInTheDocument();
      });
    });

    test('removes completed task from list', async () => {
      render(<TaskContainer {...defaultProps} />);
      
      expect(screen.getByText('Complete assignment 1')).toBeInTheDocument();
      expect(screen.getByText('Study for exam')).toBeInTheDocument();
      
      const firstTask = screen.getByText('Complete assignment 1').closest('li');
      fireEvent.mouseEnter(firstTask!);
      
      const completeButton = firstTask!.querySelector('button');
  
      // Add null check
      expect(completeButton).not.toBeNull();

      await act(async () => {
          fireEvent.click(completeButton!);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Complete assignment 1')).not.toBeInTheDocument();
        expect(screen.getByText('Study for exam')).toBeInTheDocument();
      });
    });

    
    test('disables button and shows loading text during completion', async () => {
        // Mock a delayed API response
        mockApiService.completeTask.mockImplementation(() => 
            new Promise(resolve => setTimeout(() => resolve({
            status: 'success',
            task_id: 'task-1',
            points_earned: 150,
            assignment_completed: false,
            assignment_id: undefined
            }), 100))
        );

        render(<TaskContainer {...defaultProps} />);
        
        const firstTask = screen.getByText('Complete assignment 1').closest('li');
        fireEvent.mouseEnter(firstTask!);
        
        const completeButton = firstTask!.querySelector('button');
        expect(completeButton).not.toBeNull();

        await act(async () => {
            fireEvent.click(completeButton!);
        });
        
        // Wait for the loading state to appear within the specific task
        await waitFor(() => {
            expect(within(firstTask as HTMLElement).getByText('Completing...')).toBeInTheDocument();
        });
        
        const completingButton = within(firstTask as HTMLElement).getByText('Completing...');
        expect(completingButton).toBeDisabled();
        expect(completingButton).toHaveClass('opacity-50', 'cursor-not-allowed');
        
        // Wait for the loading state to disappear
        await waitFor(() => {
            expect(within(firstTask as HTMLElement).queryByText('Completing...')).not.toBeInTheDocument();
        });
    });

    test('prevents multiple completion attempts', async () => {
        render(<TaskContainer {...defaultProps} />);
        
        const firstTask = screen.getByText('Complete assignment 1').closest('li');
        fireEvent.mouseEnter(firstTask!);
        
        const completeButton = firstTask!.querySelector('button');

        // Add null check
        expect(completeButton).not.toBeNull();

        // Click once
        await act(async () => {
            fireEvent.click(completeButton!);
        });

        // Try to click again - should be disabled or show "Completing..."
        await act(async () => {
            fireEvent.click(completeButton!);
        });
        
        await waitFor(() => {
            expect(mockApiService.completeTask).toHaveBeenCalledTimes(1);
        });
    });

    test('handles API error gracefully', async () => {
      mockApiService.completeTask.mockRejectedValue(new Error('API Error'));
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<TaskContainer {...defaultProps} />);
      
      const firstTask = screen.getByText('Complete assignment 1').closest('li');
      fireEvent.mouseEnter(firstTask!);
      
      const completeButton = firstTask!.querySelector('button');
  
      // Add null check
      expect(completeButton).not.toBeNull();

      await act(async () => {
          fireEvent.click(completeButton!);
      });
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to complete task:', expect.any(Error));
        expect(alertSpy).toHaveBeenCalledWith('Failed to complete task. Please try again.');
        expect(screen.getByText('Complete assignment 1')).toBeInTheDocument(); // Task still visible
      });
      
      alertSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    test('logs assignment completion when assignment is also completed', async () => {
        mockApiService.completeTask.mockResolvedValue({
            status: 'success',
            task_id: 'task-1',
            points_earned: 200,
            assignment_completed: true,
            assignment_id: 'assignment-123'  // This is fine as a string
        });
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<TaskContainer {...defaultProps} />);
      
      const firstTask = screen.getByText('Complete assignment 1').closest('li');
      fireEvent.mouseEnter(firstTask!);
      
      const completeButton = firstTask!.querySelector('button');
  
      // Add null check
      expect(completeButton).not.toBeNull();

      await act(async () => {
          fireEvent.click(completeButton!);
      });
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Task completed. Points earned: 200');
        expect(consoleSpy).toHaveBeenCalledWith('🎉 Assignment assignment-123 also completed!');
      });
      
      consoleSpy.mockRestore();
    });

    test('calls onTasksUpdate with correct remaining tasks', async () => {
      const mockOnTasksUpdate = jest.fn();
      
      render(<TaskContainer {...defaultProps} onTasksUpdate={mockOnTasksUpdate} />);
      
      const firstTask = screen.getByText('Complete assignment 1').closest('li');
      fireEvent.mouseEnter(firstTask!);
      
      const completeButton = firstTask!.querySelector('button');
  
      // Add null check
      expect(completeButton).not.toBeNull();

      await act(async () => {
          fireEvent.click(completeButton!);
      });
      
      await waitFor(() => {
        expect(mockOnTasksUpdate).toHaveBeenCalledWith([mockTasks[1]]); // Only second task remains
      });
    });
  });

  describe('Task Completion Overlay', () => {
    test('closes overlay when close button is clicked', async () => {
      render(<TaskContainer {...defaultProps} />);
      
      const firstTask = screen.getByText('Complete assignment 1').closest('li');
      fireEvent.mouseEnter(firstTask!);
      
      const completeButton = firstTask!.querySelector('button');
  
      // Add null check
      expect(completeButton).not.toBeNull();

      await act(async () => {
          fireEvent.click(completeButton!);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('task-complete-overlay')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);
      
      expect(screen.queryByTestId('task-complete-overlay')).not.toBeInTheDocument();
    });

    test('resets completion state when overlay is closed', async () => {
      render(<TaskContainer {...defaultProps} />);
      
      const firstTask = screen.getByText('Complete assignment 1').closest('li');
      fireEvent.mouseEnter(firstTask!);
      
      const completeButton = firstTask!.querySelector('button');
  
      // Add null check
      expect(completeButton).not.toBeNull();

      await act(async () => {
          fireEvent.click(completeButton!);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('task-complete-overlay')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);
      
      // State should be reset - can complete another task
      const secondTask = screen.getByText('Study for exam').closest('li');
      fireEvent.mouseEnter(secondTask!);
      
      const newCompleteButton = screen.getByText('✓ Complete');
      expect(newCompleteButton).not.toBeDisabled();
    });

    test('passes correct data to TaskComplete component', async () => {
      render(<TaskContainer {...defaultProps} />);
      
      const firstTask = screen.getByText('Complete assignment 1').closest('li');
      fireEvent.mouseEnter(firstTask!);
      
      const completeButton = firstTask!.querySelector('button');
  
      // Add null check
      expect(completeButton).not.toBeNull();

      await act(async () => {
          fireEvent.click(completeButton!);
      });
      
      await waitFor(() => {
        const overlay = screen.getByTestId('task-complete-overlay');
        expect(overlay).toBeInTheDocument();
        
        // Check that correct data is passed
        expect(screen.getByText('Task: Complete assignment 1')).toBeInTheDocument();
        expect(screen.getByText('Coins: 150')).toBeInTheDocument();
        expect(screen.getByText('User: user-123')).toBeInTheDocument();
      });
    });
  });

  describe('Props and State Management', () => {
    test('updates task list when tasks prop changes', () => {
      const { rerender } = render(<TaskContainer {...defaultProps} />);
      
      expect(screen.getByText('Complete assignment 1')).toBeInTheDocument();
      expect(screen.getByText('Study for exam')).toBeInTheDocument();
      
      const newTasks = [
        {
          task_id: 'task-3',
          description: 'New task',
          course_name: 'New Course',
          course_color: 'red',
          course_id: 'course-3',
          scheduled_end_at: '2024-12-27T12:00:00Z'
        }
      ];
      
      rerender(<TaskContainer {...defaultProps} tasks={newTasks} />);
      
      expect(screen.queryByText('Complete assignment 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Study for exam')).not.toBeInTheDocument();
      expect(screen.getByText('New task')).toBeInTheDocument();
    });

    test('works without optional callback props', async () => {
      render(<TaskContainer tasks={mockTasks} userId="user-123" />);
      
      const firstTask = screen.getByText('Complete assignment 1').closest('li');
      fireEvent.mouseEnter(firstTask!);
      
      const completeButton = firstTask!.querySelector('button');
  
      // Add null check
      expect(completeButton).not.toBeNull();

      await act(async () => {
          fireEvent.click(completeButton!);
      });
      
      await waitFor(() => {
        expect(mockApiService.completeTask).toHaveBeenCalledWith('task-1');
        expect(screen.getByTestId('task-complete-overlay')).toBeInTheDocument();
      });
    });

    test('maintains internal state correctly after task completion', async () => {
      render(<TaskContainer {...defaultProps} />);
      
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
      
      const firstTask = screen.getByText('Complete assignment 1').closest('li');
      fireEvent.mouseEnter(firstTask!);
      
      const completeButton = firstTask!.querySelector('button');
      expect(completeButton).not.toBeNull();

      await act(async () => {
        fireEvent.click(completeButton!);
      });
      
      await waitFor(() => {
        expect(screen.getAllByRole('listitem')).toHaveLength(1);
      });
    });
  });

  describe('Styling and CSS Classes', () => {
    test('applies correct border colors based on course color', () => {
      const { container } = render(<TaskContainer {...defaultProps} />);
      
      const taskCards = container.querySelectorAll('.border-blue-200, .border-green-200');
      expect(taskCards).toHaveLength(2);
    });

    test('applies transition classes correctly', () => {
      const { container } = render(<TaskContainer {...defaultProps} />);
      
      const taskCards = container.querySelectorAll('.transition-all.duration-300');
      expect(taskCards.length).toBeGreaterThan(0);
    });

    test('empty state has correct styling classes', () => {
      const { container } = render(<TaskContainer {...defaultProps} tasks={[]} />);
      
      const emptyState = container.querySelector('.bg-orange-50.rounded-xl.border-2.border-dashed.border-orange-200');
      expect(emptyState).toBeInTheDocument();
    });

    test('complete button has correct gradient styling', () => {
        render(<TaskContainer {...defaultProps} />);
        
        const firstTask = screen.getByText('Complete assignment 1').closest('li');
        fireEvent.mouseEnter(firstTask!);
        
        // Be more specific - get the button within the first task
        const completeButton = firstTask!.querySelector('button');
        
        expect(completeButton).toHaveClass(
            'bg-gradient-to-r',
            'from-orange-400',
            'to-orange-500',
            'rounded-lg',
            'shadow-sm'
        );
        });
  });

  describe('Edge Cases', () => {
    test('handles tasks with missing properties gracefully', () => {
      const incompleteTask = [{
        task_id: 'incomplete-task',
        description: 'Incomplete task',
        scheduled_end_at: '2024-12-27T12:00:00Z'
        // Missing course_name, course_color, course_id
      }];
      
      render(<TaskContainer {...defaultProps} tasks={incompleteTask} />);
      
      expect(screen.getByText('Incomplete task')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument(); // Fallback course name
      
      const courseElement = screen.getByText('Personal');
      expect(courseElement).toHaveClass('bg-gray-400'); // Fallback color
    });

    test('handles invalid date format gracefully', () => {
      const taskWithInvalidDate = [{
        ...mockTasks[0],
        scheduled_end_at: 'invalid-date'
      }];
      
      expect(() => {
        render(<TaskContainer {...defaultProps} tasks={taskWithInvalidDate} />);
      }).not.toThrow();
    });


    test('handles very long task descriptions', () => {
      const taskWithLongDescription = [{
        ...mockTasks[0],
        description: 'This is a very long task description that might overflow the container and cause layout issues if not handled properly in the component design and styling'
      }];
      
      render(<TaskContainer {...defaultProps} tasks={taskWithLongDescription} />);
      
      expect(screen.getByText(/This is a very long task description/)).toBeInTheDocument();
    });

    test('handles special characters in task descriptions', () => {
      const taskWithSpecialChars = [{
        ...mockTasks[0],
        description: 'Task with special chars: @#$%^&*()[]{}|;:,.<>?'
      }];
      
      render(<TaskContainer {...defaultProps} tasks={taskWithSpecialChars} />);
      
      expect(screen.getByText('Task with special chars: @#$%^&*()[]{}|;:,.<>?')).toBeInTheDocument();
    });

    test('handles rapid hover interactions without errors', () => {
      render(<TaskContainer {...defaultProps} />);
      
      const firstTask = screen.getByText('Complete assignment 1').closest('li');
      const secondTask = screen.getByText('Study for exam').closest('li');
      
      // Rapid hover between tasks
      fireEvent.mouseEnter(firstTask!);
      fireEvent.mouseLeave(firstTask!);
      fireEvent.mouseEnter(secondTask!);
      fireEvent.mouseLeave(secondTask!);
      fireEvent.mouseEnter(firstTask!);
      
      // Should not cause any errors
      expect(firstTask).toBeInTheDocument();
      expect(secondTask).toBeInTheDocument();
    });

    test('handles completing all tasks showing empty state', async () => {
      const { rerender } = render(<TaskContainer {...defaultProps} tasks={[mockTasks[0]]} />);
      
      expect(screen.getByText('Complete assignment 1')).toBeInTheDocument();
      
      const firstTask = screen.getByText('Complete assignment 1').closest('li');
      fireEvent.mouseEnter(firstTask!);
      
      const completeButton = firstTask!.querySelector('button');
  
      // Add null check
      expect(completeButton).not.toBeNull();

      await act(async () => {
          fireEvent.click(completeButton!);
      });
      
      await waitFor(() => {
        expect(screen.getByText('No tasks yet!')).toBeInTheDocument();
        expect(screen.getByText("You're all caught up")).toBeInTheDocument();
      });
    });
  });
});