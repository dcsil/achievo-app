import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskComplete from './index';
import { apiService } from '../../api-contexts/user-context';

// Mock the API service
jest.mock('../../api-contexts/user-context', () => ({
  apiService: {
    getUser: jest.fn(),
  },
}));

// Mock CSS import
jest.mock('./index.css', () => ({}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;

describe('TaskComplete Component', () => {
  const defaultProps = {
    isOpen: true,
    task: {
      title: 'Complete project proposal',
      id: 'task-123'
    },
    onClose: jest.fn(),
    coinsEarned: 150,
    userId: 'user-123'
  };

  const mockUser = {
    user_id: 'user-123',
    canvas_username: 'TestUser',
    total_points: 1500,
    current_level: 5
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiService.getUser.mockResolvedValue(mockUser);
  });

  describe('Rendering', () => {
    test('does not render when isOpen is false', () => {
      render(<TaskComplete {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('CONGRATS!!!')).not.toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('renders overlay when isOpen is true', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      expect(screen.getByText('CONGRATS!!!')).toBeInTheDocument();
      expect(screen.getByText('Finish')).toBeInTheDocument();
    });

    test('renders with default task title when no task provided', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} task={undefined} />);
      });
      
      expect(screen.getByText('"Complete project proposal"')).toBeInTheDocument();
    });

    test('renders with provided task title', async () => {
      const customTask = {
        title: 'Custom task title',
        id: 'custom-task'
      };
      
      await act(async () => {
        render(<TaskComplete {...defaultProps} task={customTask} />);
      });
      
      expect(screen.getByText('"Custom task title"')).toBeInTheDocument();
    });

    test('renders with default coins earned when not provided', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} coinsEarned={undefined} />);
      });
      
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    test('renders with provided coins earned', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} coinsEarned={250} />);
      });
      
      expect(screen.getByText('250')).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    test('renders celebration mascots', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      expect(screen.getByText('🐱')).toBeInTheDocument();
      expect(screen.getByText('🐼')).toBeInTheDocument();
    });

    test('renders confetti decorations', async () => {
      const { container } = await act(async () => {
        return render(<TaskComplete {...defaultProps} />);
      });
      
      expect(screen.getByText('🎉')).toBeInTheDocument();
      expect(screen.getByText('✨')).toBeInTheDocument();
      expect(screen.getByText('⭐')).toBeInTheDocument();
      expect(screen.getByText('🎊')).toBeInTheDocument();
      expect(screen.getByText('💫')).toBeInTheDocument();
      expect(screen.getByText('🌟')).toBeInTheDocument();
    });

    test('renders coin emojis', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      // Wait for the component to fully render including the total
      await waitFor(() => {
        expect(screen.getByText('1,500')).toBeInTheDocument();
      });
      
      const coinEmojis = screen.getAllByText('🪙');
      expect(coinEmojis).toHaveLength(2); // One for earned coins, one for total
    });

    test('renders congratulations heading', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('CONGRATS!!!');
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'text-gray-800');
    });
  });

  describe('Content Display', () => {
    test('displays "You earned:" label', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      expect(screen.getByText('You earned:')).toBeInTheDocument();
    });

    test('displays "From completing:" label', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      expect(screen.getByText('From completing:')).toBeInTheDocument();
    });

    test('displays "New Total:" label', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      expect(screen.getByText('New Total:')).toBeInTheDocument();
    });

    test('displays coins earned with correct styling', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      const coinsDisplay = screen.getByText('150');
      expect(coinsDisplay).toHaveClass('text-4xl', 'font-bold', 'text-orange-600');
    });

    test('displays task title with quotes', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      expect(screen.getByText('"Complete project proposal"')).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    test('fetches user data when overlay opens', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(mockApiService.getUser).toHaveBeenCalledWith('user-123');
      });
    });

    test('does not fetch user data when isOpen is false', () => {
      render(<TaskComplete {...defaultProps} isOpen={false} />);
      
      expect(mockApiService.getUser).not.toHaveBeenCalled();
    });

    test('does not fetch user data when userId is not provided', () => {
      render(<TaskComplete {...defaultProps} userId="" />);
      
      expect(mockApiService.getUser).not.toHaveBeenCalled();
    });

    test('displays loading state while fetching user data', async () => {
      // Mock a delayed API response
      mockApiService.getUser.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockUser), 100))
      );
      
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    test('displays new total when API call succeeds', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('1,500')).toBeInTheDocument();
      });
    });

    test('displays fallback when API call fails', async () => {
      mockApiService.getUser.mockRejectedValue(new Error('API Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('---')).toBeInTheDocument();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch updated total:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    test('formats large numbers correctly', async () => {
      const userWithLargePoints = {
        ...mockUser,
        total_points: 1234567
      };
      mockApiService.getUser.mockResolvedValue(userWithLargePoints);
      
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('1,234,567')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    test('calls onClose when finish button is clicked', async () => {
      const mockOnClose = jest.fn();
      
      await act(async () => {
        render(<TaskComplete {...defaultProps} onClose={mockOnClose} />);
      });
      
      const finishButton = screen.getByRole('button', { name: 'Finish' });
      
      await act(async () => {
        fireEvent.click(finishButton);
      });
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('resets state when closed', async () => {
      const mockOnClose = jest.fn();
      
      await act(async () => {
        render(<TaskComplete {...defaultProps} onClose={mockOnClose} />);
      });
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('1,500')).toBeInTheDocument();
      });
      
      // Click finish button to close and reset state
      const finishButton = screen.getByRole('button', { name: 'Finish' });
      
      await act(async () => {
        fireEvent.click(finishButton);
      });
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('finish button has correct styling', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      const finishButton = screen.getByRole('button', { name: 'Finish' });
      expect(finishButton).toHaveClass(
        'w-full',
        'bg-gradient-to-r',
        'from-yellow-400',
        'to-yellow-500',
        'text-gray-800',
        'font-bold',
        'py-3',
        'px-6',
        'rounded-lg',
        'shadow-md'
      );
    });

    test('finish button has hover effects', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      const finishButton = screen.getByRole('button', { name: 'Finish' });
      expect(finishButton).toHaveClass(
        'hover:shadow-lg',
        'transform',
        'hover:scale-105',
        'transition-all',
        'duration-200'
      );
    });
  });

  describe('Styling and Layout', () => {
    test('overlay has correct backdrop styling', async () => {
      let container!: HTMLElement;
        await act(async () => {
        const result = render(<TaskComplete {...defaultProps} />);
        container = result.container;
    });
      
      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toHaveClass(
        'bg-black',
        'bg-opacity-50',
        'flex',
        'items-center',
        'justify-center',
        'z-50',
        'p-4'
      );
    });

    test('modal has correct styling', async () => {
      let container!: HTMLElement;
      await act(async () => {
        const result = render(<TaskComplete {...defaultProps} />);
        container = result.container;
      });
      
      const modal = container.querySelector('.bg-white.rounded-2xl');
      expect(modal).toHaveClass(
        'shadow-2xl',
        'border-4',
        'border-yellow-400',
        'max-w-sm',
        'w-full',
        'relative',
        'overflow-hidden',
        'animate-bounce-in'
      );
    });

    test('decorative top border has correct styling', async () => {
      let container!: HTMLElement;
      await act(async () => {
        const result = render(<TaskComplete {...defaultProps} />);
        container = result.container;
      });
      
      const topBorder = container.querySelector('.h-3.bg-gradient-to-r');
      expect(topBorder).toHaveClass(
        'from-orange-400',
        'via-yellow-400',
        'to-orange-400'
      );
    });

    test('mascots have animation classes', async () => {
      let container!: HTMLElement;
      await act(async () => {
        const result = render(<TaskComplete {...defaultProps} />);
        container = result.container;
      });
      
      const mascots = container.querySelectorAll('.animate-wiggle, .animate-wiggle-delayed');
      expect(mascots).toHaveLength(2);
    });

    test('confetti elements have correct positioning', async () => {
      let container!: HTMLElement;
      await act(async () => {
        const result = render(<TaskComplete {...defaultProps} />);
        container = result.container;
      });
      
      const confettiContainer = container.querySelector('.absolute.top-0.left-0.w-full.h-full');
      expect(confettiContainer).toHaveClass('pointer-events-none', 'opacity-20');
      
      const confettiElements = container.querySelectorAll('.absolute[class*="top-"], .absolute[class*="bottom-"]');
      expect(confettiElements.length).toBeGreaterThan(0);
    });

    test('earned coins section has correct styling', async () => {
      let container!: HTMLElement;
      await act(async () => {
        const result = render(<TaskComplete {...defaultProps} />);
        container = result.container;
      });
      
      const earnedSection = container.querySelector('.bg-gradient-to-r.from-yellow-50.to-orange-50');
      expect(earnedSection).toHaveClass('rounded-lg', 'p-4', 'mb-4');
    });

    test('new total section has correct styling', async () => {
      let container!: HTMLElement;
      await act(async () => {
        const result = render(<TaskComplete {...defaultProps} />);
        container = result.container;
      });
      
      const totalSection = container.querySelector('.bg-gray-100');
      expect(totalSection).toHaveClass('rounded-lg', 'p-3', 'mb-6');
    });
  });

  describe('Accessibility', () => {
    test('modal has proper focus management', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      const finishButton = screen.getByRole('button', { name: 'Finish' });
      expect(finishButton).toBeInTheDocument();
      expect(finishButton).toBeVisible();
    });

    test('has proper heading structure', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });

    test('text content is accessible', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      expect(screen.getByText('You earned:')).toBeVisible();
      expect(screen.getByText('From completing:')).toBeVisible();
      expect(screen.getByText('New Total:')).toBeVisible();
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined task gracefully', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} task={undefined} />);
      });
      
      expect(screen.getByText('"Complete project proposal"')).toBeInTheDocument();
    });

    test('handles zero coins earned', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} coinsEarned={0} />);
      });
      
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    test('handles empty userId', () => {
      render(<TaskComplete {...defaultProps} userId="" />);
      
      expect(screen.getByText('---')).toBeInTheDocument();
      expect(mockApiService.getUser).not.toHaveBeenCalled();
    });

    test('handles component re-opening after close', async () => {
      let rerender!: (ui: React.ReactElement) => void;
      
      await act(async () => {
        const result = render(<TaskComplete {...defaultProps} />);
        rerender = result.rerender;
      });
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('1,500')).toBeInTheDocument();
      });
      
      // Close the modal
      await act(async () => {
        rerender(<TaskComplete {...defaultProps} isOpen={false} />);
      });
      expect(screen.queryByText('CONGRATS!!!')).not.toBeInTheDocument();
      
      // Reopen the modal
      await act(async () => {
        rerender(<TaskComplete {...defaultProps} isOpen={true} />);
      });
      expect(screen.getByText('CONGRATS!!!')).toBeInTheDocument();
    });

    test('handles negative coins earned', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} coinsEarned={-50} />);
      });
      
      expect(screen.getByText('-50')).toBeInTheDocument();
    });

    test('handles very large coins earned', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} coinsEarned={999999} />);
      });
      
      expect(screen.getByText('999999')).toBeInTheDocument();
    });

    test('handles task with very long title', async () => {
      const longTask = { 
        title: 'This is a very long task title that might overflow the container', 
        id: 'long-task' 
      };
      
      await act(async () => {
        render(<TaskComplete {...defaultProps} task={longTask} />);
      });
      
      expect(screen.getByText(`"${longTask.title}"`)).toBeInTheDocument();
    });

    test('handles special characters in task title', async () => {
      const specialTask = { 
        title: 'Task with special chars: @#$%^&*()', 
        id: 'special-task' 
      };
      
      await act(async () => {
        render(<TaskComplete {...defaultProps} task={specialTask} />);
      });
      
      expect(screen.getByText(`"${specialTask.title}"`)).toBeInTheDocument();
    });

    test('handles API timeout', async () => {
      mockApiService.getUser.mockImplementation(() => 
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('---')).toBeInTheDocument();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch updated total:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    test('handles multiple rapid open/close cycles', async () => {
      let rerender!: (ui: React.ReactElement) => void;
      
      await act(async () => {
        const result = render(<TaskComplete {...defaultProps} isOpen={false} />);
        rerender = result.rerender;
      });
      
      // Rapidly open and close
      await act(async () => {
        rerender(<TaskComplete {...defaultProps} isOpen={true} />);
      });
      
      await act(async () => {
        rerender(<TaskComplete {...defaultProps} isOpen={false} />);
      });
      
      await act(async () => {
        rerender(<TaskComplete {...defaultProps} isOpen={true} />);
      });
      
      expect(screen.getByText('CONGRATS!!!')).toBeInTheDocument();
    });

    test('handles onClose being called multiple times', async () => {
      const mockOnClose = jest.fn();
      
      await act(async () => {
        render(<TaskComplete {...defaultProps} onClose={mockOnClose} />);
      });
      
      const finishButton = screen.getByRole('button', { name: 'Finish' });
      
      await act(async () => {
        fireEvent.click(finishButton);
        fireEvent.click(finishButton);
        fireEvent.click(finishButton);
      });
      
      expect(mockOnClose).toHaveBeenCalledTimes(3);
    });

    test('maintains component state during prop changes', async () => {
      let rerender!: (ui: React.ReactElement) => void;
      
      await act(async () => {
        const result = render(<TaskComplete {...defaultProps} />);
        rerender = result.rerender;
      });
      
      await waitFor(() => {
        expect(screen.getByText('1,500')).toBeInTheDocument();
      });
      
      // Change coins earned while keeping modal open
      await act(async () => {
        rerender(<TaskComplete {...defaultProps} coinsEarned={300} />);
      });
      
      expect(screen.getByText('300')).toBeInTheDocument();
      expect(screen.getByText('1,500')).toBeInTheDocument(); // Total should remain
    });

    test('handles component unmounting during API call', async () => {
      let resolvePromise: (value: any) => void;
      mockApiService.getUser.mockImplementation(() => 
        new Promise(resolve => { resolvePromise = resolve; })
      );
      
      let unmount!: () => void;
      
      await act(async () => {
        const result = render(<TaskComplete {...defaultProps} />);
        unmount = result.unmount;
      });
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      unmount();
      
      // Resolving after unmount should not cause issues
      if (resolvePromise!) {
        await act(async () => {
          resolvePromise(mockUser);
        });
      }
    });
  });

  describe('Performance and Memory', () => {
    test('cleans up properly when component unmounts', async () => {
      let unmount!: () => void;
      
      await act(async () => {
        const result = render(<TaskComplete {...defaultProps} />);
        unmount = result.unmount;
      });
      
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Keyboard Navigation', () => {
    test('finish button is focusable', async () => {
      await act(async () => {
        render(<TaskComplete {...defaultProps} />);
      });
      
      const finishButton = screen.getByRole('button', { name: 'Finish' });
      finishButton.focus();
      
      expect(finishButton).toHaveFocus();
    });
  });

  describe('Animation and Styling Integration', () => {
    test('applies correct animation classes on mount', async () => {
      let container!: HTMLElement;
      await act(async () => {
        const result = render(<TaskComplete {...defaultProps} />);
        container = result.container;
      });
      
      const modal = container.querySelector('.animate-bounce-in');
      expect(modal).toBeInTheDocument();
    });

    test('mascot animations are applied correctly', async () => {
      let container!: HTMLElement;
      await act(async () => {
        const result = render(<TaskComplete {...defaultProps} />);
        container = result.container;
      });
      
      const wiggleElement = container.querySelector('.animate-wiggle');
      const wiggleDelayedElement = container.querySelector('.animate-wiggle-delayed');
      
      expect(wiggleElement).toBeInTheDocument();
      expect(wiggleDelayedElement).toBeInTheDocument();
    });

    test('gradient backgrounds are applied correctly', async () => {
      let container!: HTMLElement;
      await act(async () => {
        const result = render(<TaskComplete {...defaultProps} />);
        container = result.container;
      });
      
      const earnedSection = container.querySelector('.bg-gradient-to-r.from-yellow-50');
      const topBorder = container.querySelector('.bg-gradient-to-r.from-orange-400');
      const button = container.querySelector('.bg-gradient-to-r.from-yellow-400');
      
      expect(earnedSection).toBeInTheDocument();
      expect(topBorder).toBeInTheDocument();
      expect(button).toBeInTheDocument();
    });
  });
});