import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskComplete from './index';
import { apiService } from '../../api-contexts/user-context';

// Mock the apiService
jest.mock('../../api-contexts/user-context', () => ({
  apiService: {
    getUser: jest.fn(),
  },
}));

// Mock CSS import
jest.mock('./index.css', () => ({}));

describe('TaskComplete', () => {
  const mockTask = {
    title: 'Complete homework',
    course_color: 'blue',
    id: 'task-123',
  };

  const defaultProps = {
    isOpen: true,
    task: mockTask,
    assignment: null,
    onClose: jest.fn(),
    userId: 'user-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <TaskComplete {...defaultProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(<TaskComplete {...defaultProps} />);
      expect(screen.getByText('CONGRATS!!!')).toBeInTheDocument();
    });

    it('should display the task title', () => {
      render(<TaskComplete {...defaultProps} />);
      expect(screen.getByText(`"${mockTask.title}"`)).toBeInTheDocument();
    });

    it('should display default coins earned (100)', () => {
      render(<TaskComplete {...defaultProps} />);
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should display custom coins earned', () => {
      render(<TaskComplete {...defaultProps} coinsEarned={250} />);
      expect(screen.getByText('250')).toBeInTheDocument();
    });
  });

  describe('Assignment handling', () => {
    it('should not display assignment section when assignment is null', () => {
      render(<TaskComplete {...defaultProps} assignment={null} />);
      expect(screen.queryByText('🎉 Assignment Completed!')).not.toBeInTheDocument();
    });

    it('should not display assignment section when assignment is empty string', () => {
      render(<TaskComplete {...defaultProps} assignment="" />);
      expect(screen.queryByText('🎉 Assignment Completed!')).not.toBeInTheDocument();
    });

    it('should not display assignment section when assignment is whitespace', () => {
      render(<TaskComplete {...defaultProps} assignment="   " />);
      expect(screen.queryByText('🎉 Assignment Completed!')).not.toBeInTheDocument();
    });

    it('should display assignment section when assignment exists', () => {
      render(<TaskComplete {...defaultProps} assignment="Math Problem Set 5" />);
      expect(screen.getByText('🎉 Assignment Completed!')).toBeInTheDocument();
      expect(screen.getByText('"Math Problem Set 5"')).toBeInTheDocument();
    });

    it('should use course color in assignment section styling', () => {
      const { container } = render(
        <TaskComplete {...defaultProps} assignment="Test Assignment" />
      );
      const assignmentSection = screen.getByText('🎉 Assignment Completed!').parentElement;
      expect(assignmentSection).toHaveClass(`bg-${mockTask.course_color}-50`);
    });
  });

  describe('User data fetching', () => {
    it('should fetch user data when overlay opens', async () => {
      const mockUser = { total_points: 1500 };
      (apiService.getUser as jest.Mock).mockResolvedValue(mockUser);

      render(<TaskComplete {...defaultProps} />);

      await waitFor(() => {
        expect(apiService.getUser).toHaveBeenCalledWith('user-123');
      });
    });

    it('should display loading state while fetching', async () => {
      (apiService.getUser as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ total_points: 1500 }), 100))
      );

      render(<TaskComplete {...defaultProps} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should display new total after successful fetch', async () => {
      const mockUser = { total_points: 2500 };
      (apiService.getUser as jest.Mock).mockResolvedValue(mockUser);

      render(<TaskComplete {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('2,500')).toBeInTheDocument();
      });
    });

    it('should format large numbers with commas', async () => {
      const mockUser = { total_points: 1234567 };
      (apiService.getUser as jest.Mock).mockResolvedValue(mockUser);

      render(<TaskComplete {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('1,234,567')).toBeInTheDocument();
      });
    });

    it('should handle fetch error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (apiService.getUser as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<TaskComplete {...defaultProps} />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to fetch updated total:',
          expect.any(Error)
        );
      });

      // Should display placeholder when fetch fails
      expect(screen.getByText('---')).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('should not fetch data when isOpen is false', () => {
      render(<TaskComplete {...defaultProps} isOpen={false} />);
      expect(apiService.getUser).not.toHaveBeenCalled();
    });

    it('should refetch data when overlay reopens', async () => {
      const mockUser = { total_points: 1000 };
      (apiService.getUser as jest.Mock).mockResolvedValue(mockUser);

      const { rerender } = render(<TaskComplete {...defaultProps} isOpen={false} />);
      expect(apiService.getUser).not.toHaveBeenCalled();

      rerender(<TaskComplete {...defaultProps} isOpen={true} />);
      
      await waitFor(() => {
        expect(apiService.getUser).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('User interactions', () => {
    it('should call onClose when Finish button is clicked', async () => {
      const mockOnClose = jest.fn();
      (apiService.getUser as jest.Mock).mockResolvedValue({ total_points: 1000 });

      render(<TaskComplete {...defaultProps} onClose={mockOnClose} />);

      const finishButton = screen.getByText('Finish');
      fireEvent.click(finishButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onRefreshData when provided and Finish is clicked', async () => {
      const mockOnRefreshData = jest.fn();
      const mockOnClose = jest.fn();
      (apiService.getUser as jest.Mock).mockResolvedValue({ total_points: 1000 });

      render(
        <TaskComplete
          {...defaultProps}
          onClose={mockOnClose}
          onRefreshData={mockOnRefreshData}
        />
      );

      const finishButton = screen.getByText('Finish');
      fireEvent.click(finishButton);

      expect(mockOnRefreshData).toHaveBeenCalledTimes(1);
    });

    it('should not crash when onRefreshData is not provided', async () => {
      const mockOnClose = jest.fn();
      (apiService.getUser as jest.Mock).mockResolvedValue({ total_points: 1000 });

      render(<TaskComplete {...defaultProps} onClose={mockOnClose} />);

      const finishButton = screen.getByText('Finish');
      fireEvent.click(finishButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should reset newTotal state when closed', async () => {
      const mockUser = { total_points: 1500 };
      (apiService.getUser as jest.Mock).mockResolvedValue(mockUser);

      const { rerender } = render(<TaskComplete {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('1,500')).toBeInTheDocument();
      });

      const finishButton = screen.getByText('Finish');
      fireEvent.click(finishButton);

      // Reopen the modal
      rerender(<TaskComplete {...defaultProps} isOpen={false} />);
      rerender(<TaskComplete {...defaultProps} isOpen={true} />);

      // Should show loading initially since state was reset
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Visual elements', () => {
    it('should render celebration emojis', () => {
      render(<TaskComplete {...defaultProps} />);
      expect(screen.getByText('🐱')).toBeInTheDocument();
      expect(screen.getByText('🐼')).toBeInTheDocument();
    });

    it('should render coin emojis', () => {
      const { container } = render(<TaskComplete {...defaultProps} />);
      const coinEmojis = container.querySelectorAll('.text-3xl, .text-xl');
      expect(coinEmojis.length).toBeGreaterThan(0);
    });

    it('should display "You earned:" text', () => {
      render(<TaskComplete {...defaultProps} />);
      expect(screen.getByText('You earned:')).toBeInTheDocument();
    });

    it('should display "From completing task:" text', () => {
      render(<TaskComplete {...defaultProps} />);
      expect(screen.getByText('From completing task:')).toBeInTheDocument();
    });

    it('should display "New Total:" text', () => {
      render(<TaskComplete {...defaultProps} />);
      expect(screen.getByText('New Total:')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle task with empty title', () => {
      const emptyTask = { ...mockTask, title: '' };
      render(<TaskComplete {...defaultProps} task={emptyTask} />);
      expect(screen.getByText('""')).toBeInTheDocument();
    });

    it('should handle zero coins earned', () => {
      render(<TaskComplete {...defaultProps} coinsEarned={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle total_points as zero', async () => {
      (apiService.getUser as jest.Mock).mockResolvedValue({ total_points: 0 });

      render(<TaskComplete {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('should display placeholder when newTotal is null initially', () => {
      (apiService.getUser as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<TaskComplete {...defaultProps} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
});