import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CourseContainer from './index';
import * as getAssignmentsModule from '../../api-contexts/get-assignments';

// Mock the getAssignments API call
jest.mock('../../api-contexts/get-assignments');
const mockGetAssignments = getAssignmentsModule.getAssignments as jest.MockedFunction<typeof getAssignmentsModule.getAssignments>;

// Mock the AssignmentProgressContainer component
jest.mock('../assignment-progress-container', () => {
  return function MockAssignmentProgressContainer({ assignments, color }: { assignments: any[], color: string }) {
    return (
      <div data-testid="assignment-progress-container">
        <div data-testid="assignments-count">{assignments.length}</div>
        <div data-testid="assignments-color">{color}</div>
        {assignments.map((assignment, index) => (
          <div key={assignment.assignment_id || index} data-testid="assignment-item">
            {assignment.title}
          </div>
        ))}
      </div>
    );
  };
});

// Mock assignment data
const mockAssignments = [
  {
    assignment_id: '1',
    course_id: 'course1',
    title: 'Math Assignment 1',
    due_date: '2025-12-01',
    completion_points: 100,
    is_complete: false,
    task_count: 5,
    completed_task_count: 3
  },
  {
    assignment_id: '2',
    course_id: 'course1',
    title: 'Math Quiz 1',
    due_date: '2025-11-30',
    completion_points: 50,
    is_complete: true,
    task_count: 2,
    completed_task_count: 2
  }
];

describe('CourseContainer', () => {
  const defaultProps = {
    name: 'Mathematics',
    courseId: 'course123',
    color: 'blue'
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset DOM
    document.body.innerHTML = '';
  });

  describe('Rendering', () => {
    it('renders course name correctly', async () => {
      mockGetAssignments.mockResolvedValue(mockAssignments);
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
    });

    it('renders with unnamed course fallback', async () => {
      mockGetAssignments.mockResolvedValue([]);
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} name="" />);
      });
      
      expect(screen.getByText('Unnamed Course')).toBeInTheDocument();
    });

    it('applies correct color classes for course badge', async () => {
      mockGetAssignments.mockResolvedValue([]);
      
      let container: HTMLElement;
      await act(async () => {
        const result = render(<CourseContainer {...defaultProps} />);
        container = result.container;
      });
      
      // Check for color classes in the course badge
      const courseBadge = container!.querySelector('.bg-blue-400');
      expect(courseBadge).toBeInTheDocument();
      expect(courseBadge).toHaveTextContent('Mathematics');
    });

    it('applies correct background gradient classes', async () => {
      mockGetAssignments.mockResolvedValue([]);
      
      let container: HTMLElement;
      await act(async () => {
        const result = render(<CourseContainer {...defaultProps} />);
        container = result.container;
      });
      
      // Check for gradient background classes
      const courseContainer = container!.querySelector('.from-blue-100.to-blue-200');
      expect(courseContainer).toBeInTheDocument();
    });

    it('uses different color when specified', async () => {
      mockGetAssignments.mockResolvedValue([]);
      
      let container: HTMLElement;
      await act(async () => {
        const result = render(
          <CourseContainer {...defaultProps} color="red" />
        );
        container = result.container;
      });
      
      // Check for red color classes
      const courseBadge = container!.querySelector('.bg-red-400');
      expect(courseBadge).toBeInTheDocument();
      
      const courseContainer = container!.querySelector('.from-red-100.to-red-200');
      expect(courseContainer).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading message initially', async () => {
      // Don't resolve the promise immediately
      mockGetAssignments.mockImplementation(() => new Promise(() => {}));
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      expect(screen.getByText('Loading assignments...')).toBeInTheDocument();
    });

    it('hides loading message after data loads', async () => {
      mockGetAssignments.mockResolvedValue(mockAssignments);
      
      // Render without act() to catch the loading state
      render(<CourseContainer {...defaultProps} />);
      
      // Loading should be visible initially
      expect(screen.getByText('Loading assignments...')).toBeInTheDocument();
      
      // Wait for loading to disappear
      await waitFor(() => {
        expect(screen.queryByText('Loading assignments...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message when API call fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetAssignments.mockRejectedValue(new Error('API Error'));
      
      render(<CourseContainer {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Error loading assignments')).toBeInTheDocument();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching assignments:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('does not show assignment container when there is an error', async () => {
      mockGetAssignments.mockRejectedValue(new Error('API Error'));
      
      render(<CourseContainer {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Error loading assignments')).toBeInTheDocument();
      });
      
      expect(screen.queryByTestId('assignment-progress-container')).not.toBeInTheDocument();
    });

    it('recovers from error state when API call succeeds on retry', async () => {
      // First call fails
      mockGetAssignments.mockRejectedValueOnce(new Error('Network Error'));
      
      let rerender: any;
      await act(async () => {
        const result = render(<CourseContainer {...defaultProps} />);
        rerender = result.rerender;
      });
      
      await waitFor(() => {
        expect(screen.getByText('Error loading assignments')).toBeInTheDocument();
      });
      
      // Second call succeeds
      mockGetAssignments.mockResolvedValue(mockAssignments);
      
      // Trigger re-fetch by changing refreshKey
      await act(async () => {
        rerender(<CourseContainer {...defaultProps} refreshKey={2} />);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Error loading assignments')).not.toBeInTheDocument();
        expect(screen.getByTestId('assignment-progress-container')).toBeInTheDocument();
      });
    });

    it('handles different types of errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Test with a string error
      mockGetAssignments.mockRejectedValue('String error');
      
      render(<CourseContainer {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Error loading assignments')).toBeInTheDocument();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching assignments:', 'String error');
      consoleSpy.mockRestore();
    });
  });

  describe('Empty State', () => {
    it('shows no assignments message when empty array returned', async () => {
      mockGetAssignments.mockResolvedValue([]);
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('No assignments!')).toBeInTheDocument();
      });
    });

    it('does not show assignment container when no assignments', async () => {
      mockGetAssignments.mockResolvedValue([]);
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('No assignments!')).toBeInTheDocument();
      });
      
      expect(screen.queryByTestId('assignment-progress-container')).not.toBeInTheDocument();
    });
  });

  describe('Successful Data Loading', () => {
    it('renders AssignmentProgressContainer with correct props when assignments load', async () => {
      mockGetAssignments.mockResolvedValue(mockAssignments);
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('assignment-progress-container')).toBeInTheDocument();
      });
      
      // Check that the correct number of assignments is passed
      expect(screen.getByTestId('assignments-count')).toHaveTextContent('2');
      
      // Check that the correct color is passed
      expect(screen.getByTestId('assignments-color')).toHaveTextContent('blue');
      
      // Check that assignment titles are rendered
      expect(screen.getByText('Math Assignment 1')).toBeInTheDocument();
      expect(screen.getByText('Math Quiz 1')).toBeInTheDocument();
    });

    it('hides loading and error messages when assignments load successfully', async () => {
      mockGetAssignments.mockResolvedValue(mockAssignments);
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('assignment-progress-container')).toBeInTheDocument();
      });
      
      expect(screen.queryByText('Loading assignments...')).not.toBeInTheDocument();
      expect(screen.queryByText('Error loading assignments')).not.toBeInTheDocument();
      expect(screen.queryByText('No assignments!')).not.toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('calls getAssignments with correct parameters', async () => {
      mockGetAssignments.mockResolvedValue(mockAssignments);
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      expect(mockGetAssignments).toHaveBeenCalledWith('course123', 'paul_paw_test');
      expect(mockGetAssignments).toHaveBeenCalledTimes(1);
    });

    it('calls getAssignments again when courseId changes', async () => {
      mockGetAssignments.mockResolvedValue(mockAssignments);
      
      let rerender: any;
      await act(async () => {
        const result = render(<CourseContainer {...defaultProps} />);
        rerender = result.rerender;
      });
      
      expect(mockGetAssignments).toHaveBeenCalledWith('course123', 'paul_paw_test');
      
      // Change courseId and rerender
      await act(async () => {
        rerender(<CourseContainer {...defaultProps} courseId="course456" />);
      });
      
      await waitFor(() => {
        expect(mockGetAssignments).toHaveBeenCalledWith('course456', 'paul_paw_test');
      });
      
      expect(mockGetAssignments).toHaveBeenCalledTimes(2);
    });

    it('calls getAssignments again when name changes', async () => {
      mockGetAssignments.mockResolvedValue(mockAssignments);
      
      let rerender: any;
      await act(async () => {
        const result = render(<CourseContainer {...defaultProps} />);
        rerender = result.rerender;
      });
      
      expect(mockGetAssignments).toHaveBeenCalledTimes(1);
      
      // Change name and rerender
      await act(async () => {
        rerender(<CourseContainer {...defaultProps} name="Physics" />);
      });
      
      await waitFor(() => {
        expect(mockGetAssignments).toHaveBeenCalledTimes(2);
      });
    });

    it('calls getAssignments again when refreshKey changes', async () => {
      mockGetAssignments.mockResolvedValue(mockAssignments);
      
      let rerender: any;
      await act(async () => {
        const result = render(<CourseContainer {...defaultProps} refreshKey={1} />);
        rerender = result.rerender;
      });
      
      expect(mockGetAssignments).toHaveBeenCalledTimes(1);
      
      // Change refreshKey and rerender
      await act(async () => {
        rerender(<CourseContainer {...defaultProps} refreshKey={2} />);
      });
      
      await waitFor(() => {
        expect(mockGetAssignments).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles assignment data with missing fields gracefully', async () => {
      const incompleteAssignments = [
        {
          assignment_id: '1',
          title: 'Incomplete Assignment',
          // Missing other fields
        }
      ];
      
      mockGetAssignments.mockResolvedValue(incompleteAssignments as any);
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('assignment-progress-container')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Incomplete Assignment')).toBeInTheDocument();
    });

    it('handles very long course names with truncation', async () => {
      mockGetAssignments.mockResolvedValue([]);
      
      const longName = 'This is a very long course name that should be truncated to prevent layout issues in the interface';
      
      let container: HTMLElement;
      await act(async () => {
        const result = render(
          <CourseContainer {...defaultProps} name={longName} />
        );
        container = result.container;
      });
      
      const courseBadge = container!.querySelector('.truncate');
      expect(courseBadge).toBeInTheDocument();
      expect(courseBadge).toHaveClass('truncate');
      expect(courseBadge).toHaveTextContent(longName);
    });

    it('handles multiple rapid refreshKey changes', async () => {
      mockGetAssignments.mockResolvedValue(mockAssignments);
      
      let rerender: any;
      await act(async () => {
        const result = render(<CourseContainer {...defaultProps} refreshKey={1} />);
        rerender = result.rerender;
      });
      
      // Wait for initial call to complete
      await waitFor(() => {
        expect(mockGetAssignments).toHaveBeenCalledTimes(1);
      });
      
      // Rapidly change refreshKey multiple times
      await act(async () => {
        rerender(<CourseContainer {...defaultProps} refreshKey={2} />);
      });
      
      await act(async () => {
        rerender(<CourseContainer {...defaultProps} refreshKey={3} />);
      });
      
      await act(async () => {
        rerender(<CourseContainer {...defaultProps} refreshKey={4} />);
      });
      
      await waitFor(() => {
        expect(mockGetAssignments).toHaveBeenCalledTimes(4);
      });
    });

    it('handles null and undefined props gracefully', async () => {
      mockGetAssignments.mockResolvedValue([]);
      
      await act(async () => {
        render(<CourseContainer 
          name={null as any} 
          courseId="" 
          color="blue" 
          refreshKey={undefined} 
        />);
      });
      
      expect(screen.getByText('Unnamed Course')).toBeInTheDocument();
      expect(mockGetAssignments).toHaveBeenCalledWith('', 'paul_paw_test');
    });

    it('handles empty string courseId', async () => {
      mockGetAssignments.mockResolvedValue([]);
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} courseId="" />);
      });
      
      expect(mockGetAssignments).toHaveBeenCalledWith('', 'paul_paw_test');
    });

    it('handles special characters in course name', async () => {
      mockGetAssignments.mockResolvedValue([]);
      
      const specialName = 'Cômpütér Scïéñcé & Mäth 101 (Advanced) - Fall 2025!';
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} name={specialName} />);
      });
      
      expect(screen.getByText(specialName)).toBeInTheDocument();
    });

    it('maintains state through multiple prop changes', async () => {
      mockGetAssignments.mockResolvedValue(mockAssignments);
      
      let rerender: any;
      await act(async () => {
        const result = render(<CourseContainer {...defaultProps} />);
        rerender = result.rerender;
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('assignment-progress-container')).toBeInTheDocument();
      });
      
      // Change only the color, should not trigger new API call
      await act(async () => {
        rerender(<CourseContainer {...defaultProps} color="red" />);
      });
      
      // Should still show assignments without new API call
      expect(screen.getByTestId('assignment-progress-container')).toBeInTheDocument();
      expect(mockGetAssignments).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Structure', () => {
    it('has correct CSS classes for layout', async () => {
      mockGetAssignments.mockResolvedValue([]);
      
      let container: HTMLElement;
      await act(async () => {
        const result = render(<CourseContainer {...defaultProps} />);
        container = result.container;
      });
      
      // Main container
      const mainContainer = container!.firstChild;
      expect(mainContainer).toHaveClass('flex', 'flex-col', 'rounded-lg', 'p-3', 'pt-5');
    });

    it('renders course badge with correct structure', async () => {
      mockGetAssignments.mockResolvedValue([]);
      
      let container: HTMLElement;
      await act(async () => {
        const result = render(<CourseContainer {...defaultProps} />);
        container = result.container;
      });
      
      const courseBadge = container!.querySelector('.rounded-full.text-sm.font-medium.text-white');
      expect(courseBadge).toBeInTheDocument();
      expect(courseBadge).toHaveClass('py-1', 'px-3', 'truncate', 'max-w-full');
    });
  });

  describe('State Transitions', () => {
    it('transitions from loading to success state', async () => {
      mockGetAssignments.mockResolvedValue(mockAssignments);
      
      // Render without act() to catch the loading state
      render(<CourseContainer {...defaultProps} />);
      
      // Initially loading
      expect(screen.getByText('Loading assignments...')).toBeInTheDocument();
      expect(screen.queryByTestId('assignment-progress-container')).not.toBeInTheDocument();
      
      // After loading completes
      await waitFor(() => {
        expect(screen.queryByText('Loading assignments...')).not.toBeInTheDocument();
        expect(screen.getByTestId('assignment-progress-container')).toBeInTheDocument();
      });
    });

    it('transitions from loading to error state', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetAssignments.mockRejectedValue(new Error('Network Error'));
      
      // Render without act() to catch the loading state
      render(<CourseContainer {...defaultProps} />);
      
      // Initially loading
      expect(screen.getByText('Loading assignments...')).toBeInTheDocument();
      
      // After error
      await waitFor(() => {
        expect(screen.queryByText('Loading assignments...')).not.toBeInTheDocument();
        expect(screen.getByText('Error loading assignments')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    it('transitions from loading to empty state', async () => {
      mockGetAssignments.mockResolvedValue([]);
      
      // Render without act() to catch the loading state
      render(<CourseContainer {...defaultProps} />);
      
      // Initially loading
      expect(screen.getByText('Loading assignments...')).toBeInTheDocument();
      
      // After loading with empty data
      await waitFor(() => {
        expect(screen.queryByText('Loading assignments...')).not.toBeInTheDocument();
        expect(screen.getByText('No assignments!')).toBeInTheDocument();
      });
    });

    it('shows loading state during re-fetch', async () => {
      mockGetAssignments.mockResolvedValue(mockAssignments);
      
      let rerender: any;
      await act(async () => {
        const result = render(<CourseContainer {...defaultProps} />);
        rerender = result.rerender;
      });
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('assignment-progress-container')).toBeInTheDocument();
      });
      
      // Mock a slow response for the re-fetch
      mockGetAssignments.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve(mockAssignments), 100)
      ));
      
      // Trigger re-fetch
      await act(async () => {
        rerender(<CourseContainer {...defaultProps} courseId="new-course" />);
      });
      
      // Should show loading again
      expect(screen.getByText('Loading assignments...')).toBeInTheDocument();
    });

    it('clears error state when new successful request is made', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // First call fails
      mockGetAssignments.mockRejectedValueOnce(new Error('Initial Error'));
      
      let rerender: any;
      await act(async () => {
        const result = render(<CourseContainer {...defaultProps} />);
        rerender = result.rerender;
      });
      
      await waitFor(() => {
        expect(screen.getByText('Error loading assignments')).toBeInTheDocument();
      });
      
      // Second call succeeds
      mockGetAssignments.mockResolvedValue(mockAssignments);
      
      await act(async () => {
        rerender(<CourseContainer {...defaultProps} refreshKey={2} />);
      });
      
      // Should clear error and show loading, then success
      await waitFor(() => {
        expect(screen.queryByText('Error loading assignments')).not.toBeInTheDocument();
        expect(screen.getByTestId('assignment-progress-container')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });
  });
});
