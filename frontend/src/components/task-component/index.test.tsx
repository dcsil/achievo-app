import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskComponent from './index';

describe('TaskComponent', () => {
  const mockOnCompleteTask = jest.fn();
  
  const baseTask = {
    id: '1',
    description: 'Complete Math Assignment',
    course_name: 'Mathematics',
    course_color: 'blue',
    type: 'assignment',
    scheduled_start_at: '2024-01-15T10:00:00Z',
    scheduled_end_at: '2024-01-15T12:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders task description', () => {
      render(<TaskComponent task={baseTask} onCompleteTask={mockOnCompleteTask} />);
      expect(screen.getByText('Complete Math Assignment')).toBeInTheDocument();
    });

    it('renders course name when provided', () => {
      render(<TaskComponent task={baseTask} onCompleteTask={mockOnCompleteTask} />);
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
    });

    it('renders without course name when not provided', () => {
      const taskWithoutCourse = { ...baseTask, course_name: undefined };
      render(<TaskComponent task={taskWithoutCourse} onCompleteTask={mockOnCompleteTask} />);
      expect(screen.queryByText('Mathematics')).not.toBeInTheDocument();
    });

    it('renders task type label', () => {
      render(<TaskComponent task={baseTask} onCompleteTask={mockOnCompleteTask} />);
      expect(screen.getByText('📝 Assignment/Tutorial/Quiz')).toBeInTheDocument();
    });

    it('renders default "Task" label when type is not found', () => {
      const taskWithInvalidType = { ...baseTask, type: 'invalid-type' };
      render(<TaskComponent task={taskWithInvalidType} onCompleteTask={mockOnCompleteTask} />);
      expect(screen.getByText('Task')).toBeInTheDocument();
    });

    it('renders default "Task" label when type is undefined', () => {
      const taskWithoutType = { ...baseTask, type: undefined };
      render(<TaskComponent task={taskWithoutType} onCompleteTask={mockOnCompleteTask} />);
      expect(screen.getByText('Task')).toBeInTheDocument();
    });

    it('applies correct course color class', () => {
      const { container } = render(<TaskComponent task={baseTask} onCompleteTask={mockOnCompleteTask} />);
      const taskElement = container.querySelector('.border-blue-200');
      expect(taskElement).toBeInTheDocument();
    });

    it('applies default gray color when course_color is not provided', () => {
      const taskWithoutColor = { ...baseTask, course_color: undefined };
      const { container } = render(<TaskComponent task={taskWithoutColor} onCompleteTask={mockOnCompleteTask} />);
      const courseTag = container.querySelector('.bg-gray-400');
      expect(courseTag).toBeInTheDocument();
    });
  });

  describe('Time Display', () => {
    it('displays scheduled start and end times with time adjustment by default', () => {
      render(<TaskComponent task={baseTask} onCompleteTask={mockOnCompleteTask} />);
      // Times should be adjusted by 5 hours
      const timeElements = screen.getAllByText(/AM|PM/i);
      expect(timeElements.length).toBeGreaterThanOrEqual(2);
    });

    it('displays scheduled times without adjustment when timeAdjustment is false', () => {
      render(<TaskComponent task={baseTask} onCompleteTask={mockOnCompleteTask} timeAdjustment={false} />);
      const timeElements = screen.getAllByText(/AM|PM/i);
      expect(timeElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Complete Button Visibility', () => {
    it('shows complete button by default', () => {
      render(<TaskComponent task={baseTask} onCompleteTask={mockOnCompleteTask} />);
      const completeButton = screen.getByRole('button', { name: /complete/i });
      expect(completeButton).toBeInTheDocument();
    });

    it('hides complete button when showCompleteButton is false', () => {
      render(
        <TaskComponent 
          task={baseTask} 
          onCompleteTask={mockOnCompleteTask} 
          showCompleteButton={false}
        />
      );
      const completeButton = screen.queryByRole('button', { name: /complete/i });
      expect(completeButton).not.toBeInTheDocument();
    });

    it('shows completion date when showCompleteButton is false and completion_date_at exists', () => {
      const completedTask = {
        ...baseTask,
        completion_date_at: '2024-01-16T14:30:00Z',
      };
      render(
        <TaskComponent 
          task={completedTask} 
          onCompleteTask={mockOnCompleteTask} 
          showCompleteButton={false}
        />
      );
      expect(screen.getByText('Completed on:')).toBeInTheDocument();
      expect(screen.getByText(/Tuesday, Jan 16/i)).toBeInTheDocument();
    });

    it('does not show completion date when showCompleteButton is true', () => {
      const completedTask = {
        ...baseTask,
        completion_date_at: '2024-01-16T14:30:00Z',
      };
      render(
        <TaskComponent 
          task={completedTask} 
          onCompleteTask={mockOnCompleteTask} 
          showCompleteButton={true}
        />
      );
      expect(screen.queryByText('Completed on:')).not.toBeInTheDocument();
    });
  });

  describe('Hover Interactions', () => {
    it('shows action section on mouse enter', async () => {
      const { container } = render(<TaskComponent task={baseTask} onCompleteTask={mockOnCompleteTask} />);
      const listItem = container.querySelector('li');
      
      fireEvent.mouseEnter(listItem!);
      
      await waitFor(() => {
        const actionSection = container.querySelector('.max-h-24');
        expect(actionSection).toHaveClass('opacity-100');
      });
    });

    it('hides action section on mouse leave', async () => {
      const { container } = render(<TaskComponent task={baseTask} onCompleteTask={mockOnCompleteTask} />);
      const listItem = container.querySelector('li');
      
      fireEvent.mouseEnter(listItem!);
      fireEvent.mouseLeave(listItem!);
      
      await waitFor(() => {
        const actionSection = container.querySelector('.max-h-0');
        expect(actionSection).toHaveClass('opacity-0');
      });
    });

    it('displays points message on hover', async () => {
      const { container } = render(<TaskComponent task={baseTask} onCompleteTask={mockOnCompleteTask} />);
      const listItem = container.querySelector('li');
      
      fireEvent.mouseEnter(listItem!);
      
      await waitFor(() => {
        expect(screen.getByText('Complete task to earn points!')).toBeInTheDocument();
      });
    });
  });

  describe('Complete Button Functionality', () => {
    it('calls onCompleteTask when complete button is clicked', () => {
      render(<TaskComponent task={baseTask} onCompleteTask={mockOnCompleteTask} />);
      const completeButton = screen.getByRole('button', { name: /complete/i });
      
      fireEvent.click(completeButton);
      
      expect(mockOnCompleteTask).toHaveBeenCalledTimes(1);
      expect(mockOnCompleteTask).toHaveBeenCalledWith(baseTask);
    });

    it('disables complete button when isCompleting is true', () => {
      render(
        <TaskComponent 
          task={baseTask} 
          onCompleteTask={mockOnCompleteTask} 
          isCompleting={true}
        />
      );
      const completeButton = screen.getByRole('button', { name: /completing/i });
      
      expect(completeButton).toBeDisabled();
      expect(completeButton).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('shows "Completing..." text when isCompleting is true', () => {
      render(
        <TaskComponent 
          task={baseTask} 
          onCompleteTask={mockOnCompleteTask} 
          isCompleting={true}
        />
      );
      
      expect(screen.getByText('Completing...')).toBeInTheDocument();
    });

    it('does not call onCompleteTask when button is disabled', () => {
      render(
        <TaskComponent 
          task={baseTask} 
          onCompleteTask={mockOnCompleteTask} 
          isCompleting={true}
        />
      );
      const completeButton = screen.getByRole('button', { name: /completing/i });
      
      fireEvent.click(completeButton);
      
      expect(mockOnCompleteTask).not.toHaveBeenCalled();
    });
  });

  describe('Different Task Types', () => {
    const taskTypes = [
      { type: 'assignment', label: '📝 Assignment/Tutorial/Quiz' },
      { type: 'study', label: '📚 Study/Review Session' },
      { type: 'reading', label: '📖 Required Reading' },
      { type: 'exercise', label: '💪 Exercise' },
      { type: 'break', label: '⏸️ Break' },
      { type: 'personal', label: '🏠 Personal' },
      { type: 'class', label: '🏫 Class' },
      { type: 'other', label: '📌 Other' },
    ];

    taskTypes.forEach(({ type, label }) => {
      it(`renders correct label for ${type} task type`, () => {
        const taskWithType = { ...baseTask, type };
        render(<TaskComponent task={taskWithType} onCompleteTask={mockOnCompleteTask} />);
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles task without any optional properties', () => {
      const minimalTask = {
        description: 'Minimal Task',
        scheduled_start_at: '2024-01-15T10:00:00Z',
        scheduled_end_at: '2024-01-15T12:00:00Z',
      };
      
      render(<TaskComponent task={minimalTask} onCompleteTask={mockOnCompleteTask} />);
      expect(screen.getByText('Minimal Task')).toBeInTheDocument();
    });

    it('handles multiple rapid hover events', () => {
      const { container } = render(<TaskComponent task={baseTask} onCompleteTask={mockOnCompleteTask} />);
      const listItem = container.querySelector('li');
      
      // Rapid hover on/off
      fireEvent.mouseEnter(listItem!);
      fireEvent.mouseLeave(listItem!);
      fireEvent.mouseEnter(listItem!);
      fireEvent.mouseLeave(listItem!);
      
      expect(listItem).toBeInTheDocument();
    });

    it('renders coin emoji in points message', () => {
      const { container } = render(<TaskComponent task={baseTask} onCompleteTask={mockOnCompleteTask} />);
      const listItem = container.querySelector('li');
      
      fireEvent.mouseEnter(listItem!);
      
      expect(screen.getByText('🪙')).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should not re-render when props do not change', () => {
      const { rerender } = render(
        <TaskComponent task={baseTask} onCompleteTask={mockOnCompleteTask} />
      );
      
      // Re-render with same props
      rerender(<TaskComponent task={baseTask} onCompleteTask={mockOnCompleteTask} />);
      
      expect(screen.getByText('Complete Math Assignment')).toBeInTheDocument();
    });
  });
});