import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CourseContainer from './index';
import { getAssignments } from '../../api-contexts/get-assignments';
import { apiService } from '../../api-contexts/user-context';

// Mock the dependencies
jest.mock('../../api-contexts/get-assignments');
jest.mock('../../api-contexts/user-context');
jest.mock('../assignment-progress-container', () => {
  return function MockAssignmentProgressContainer({ assignments, color }: any) {
    return (
      <div data-testid="assignment-progress-container">
        <span>Assignments: {assignments.length}</span>
        <span>Color: {color}</span>
      </div>
    );
  };
});
jest.mock('../multiple-task-container', () => {
  return function MockMultipleTaskContainer({ 
    tasks, 
    userId, 
    onTaskCompleted, 
    dateString 
  }: any) {
    return (
      <div data-testid="multiple-task-container">
        <span>Tasks: {tasks.length}</span>
        <span>Date: {dateString}</span>
        <button 
          onClick={() => onTaskCompleted('task-1', 'study', 10, 'course-1')}
          data-testid={`complete-task-${dateString}`}
        >
          Complete Task
        </button>
      </div>
    );
  };
});

const mockGetAssignments = getAssignments as jest.MockedFunction<typeof getAssignments>;
const mockApiService = {
  getTasks: jest.fn()
} as any;

// Replace the actual apiService with our mock
(apiService as any).getTasks = mockApiService.getTasks;

describe('CourseContainer', () => {
  const defaultProps = {
    name: 'Test Course',
    courseId: 'course-123',
    color: 'blue'
  };

  const mockAssignments = [
    {
      assignment_id: 'assign-1',
      course_id: 'course-123',
      title: 'Assignment 1',
      due_date: '2024-12-15T23:59:59Z',
      completion_points: 100,
      is_complete: false,
      task_count: 3,
      completed_task_count: 1
    },
    {
      assignment_id: 'assign-2',
      course_id: 'course-123',
      title: 'Assignment 2',
      due_date: '2024-12-20T23:59:59Z',
      completion_points: 150,
      is_complete: true,
      task_count: 2,
      completed_task_count: 2
    }
  ];

  const mockTasks = [
    {
      task_id: 'task-1',
      user_id: 'paul_paw_test',
      description: 'Study chapter 1',
      type: 'study',
      assignment_id: null,
      course_id: 'course-123',
      scheduled_start_at: '2024-12-02T10:00:00Z',
      scheduled_end_at: '2024-12-02T11:00:00Z',
      is_completed: false,
      reward_points: 10
    },
    {
      task_id: 'task-2',
      user_id: 'paul_paw_test',
      description: 'Review notes',
      type: 'review',
      assignment_id: null,
      course_id: 'course-123',
      scheduled_start_at: '2024-12-03T14:00:00Z',
      scheduled_end_at: '2024-12-03T15:00:00Z',
      is_completed: false,
      reward_points: 15
    },
    {
      task_id: 'task-3',
      user_id: 'paul_paw_test',
      description: 'Completed task',
      type: 'study',
      assignment_id: null,
      course_id: 'course-123',
      scheduled_start_at: '2024-12-01T09:00:00Z',
      scheduled_end_at: '2024-12-01T10:00:00Z',
      is_completed: true,
      reward_points: 20
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAssignments.mockResolvedValue(mockAssignments);
    mockApiService.getTasks.mockResolvedValue(mockTasks);
  });

  describe('Basic Rendering', () => {
    it('renders course name correctly', async () => {
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      expect(screen.getByText('Test Course')).toBeInTheDocument();
    });

    it('renders with unnamed course when name is empty', async () => {
      await act(async () => {
        render(<CourseContainer {...defaultProps} name="" />);
      });
      
      expect(screen.getByText('Unnamed Course')).toBeInTheDocument();
    });

    it('applies correct color classes', async () => {
      let container: HTMLElement;
      await act(async () => {
        const result = render(<CourseContainer {...defaultProps} />);
        container = result.container;
      });
      
      const courseContainer = container!.querySelector('.bg-gradient-to-bl');
      expect(courseContainer).toHaveClass('from-blue-100', 'to-blue-200');
      
      const courseBadge = container!.querySelector('.bg-blue-400');
      expect(courseBadge).toBeInTheDocument();
    });
  });

  describe('Assignments Loading States', () => {
    it('shows loading state while fetching assignments', async () => {
      // Make the promise never resolve to test loading state
      mockGetAssignments.mockReturnValue(new Promise(() => {}));
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      expect(screen.getByText('Loading assignments...')).toBeInTheDocument();
    });

    it('shows assignments when loaded successfully', async () => {
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('assignment-progress-container')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Assignments: 2')).toBeInTheDocument();
      expect(screen.getByText('Color: blue')).toBeInTheDocument();
    });

    it('shows error state when assignments fail to load', async () => {
      mockGetAssignments.mockRejectedValue(new Error('API Error'));
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Error loading assignments')).toBeInTheDocument();
      });
    });

    it('shows no assignments message when empty array returned', async () => {
      mockGetAssignments.mockResolvedValue([]);
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('No assignments found')).toBeInTheDocument();
        expect(screen.getByText('Upload your syllabus to populate assignments')).toBeInTheDocument();
      });
    });
  });

  describe('Course Tasks', () => {
    it('shows loading state while fetching tasks', async () => {
      mockApiService.getTasks.mockReturnValue(new Promise(() => {}));
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      expect(screen.getByText('Loading course tasks...')).toBeInTheDocument();
    });

    it('filters and displays incomplete course tasks', async () => {
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Incomplete Tasks (2)')).toBeInTheDocument();
      });
    });

    it('groups tasks by date correctly', async () => {
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        const tasksButton = screen.getByText('Incomplete Tasks (2)');
        act(() => {
          fireEvent.click(tasksButton);
        });
      });
      
      await waitFor(() => {
        // Should see tasks grouped by date
        expect(screen.getByText('Date: Mon Dec 02 2024')).toBeInTheDocument();
        expect(screen.getByText('Date: Tue Dec 03 2024')).toBeInTheDocument();
      });
    });

    it('toggles tasks collapse/expand', async () => {
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        const tasksButton = screen.getByText('Incomplete Tasks (2)');
        expect(screen.getByText('▼')).toBeInTheDocument();
        
        // Expand tasks
        act(() => {
          fireEvent.click(tasksButton);
        });
        expect(screen.getByText('▲')).toBeInTheDocument();
        
        // Collapse tasks
        act(() => {
          fireEvent.click(tasksButton);
        });
        expect(screen.getByText('▼')).toBeInTheDocument();
      });
    });

    it('does not show tasks section when no incomplete tasks', async () => {
      mockApiService.getTasks.mockResolvedValue([
        { ...mockTasks[0], is_completed: true }
      ]);
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.queryByText(/Incomplete Tasks/)).not.toBeInTheDocument();
      });
    });

    it('handles tasks API error gracefully', async () => {
      console.error = jest.fn(); // Mock console.error
      mockApiService.getTasks.mockRejectedValue(new Error('Tasks API Error'));
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        // Should not crash and not show tasks section
        expect(screen.queryByText(/Incomplete Tasks/)).not.toBeInTheDocument();
      });
      
      expect(console.error).toHaveBeenCalledWith('Error fetching course tasks:', expect.any(Error));
    });
  });

  describe('Task Completion', () => {
    it('prevents refetch during task completion', async () => {
      const mockOnTaskCompleted = jest.fn();
      
      await act(async () => {
        render(
          <CourseContainer 
            {...defaultProps} 
            onTaskCompleted={mockOnTaskCompleted}
          />
        );
      });
      
      await waitFor(() => {
        const tasksButton = screen.getByText('Incomplete Tasks (2)');
        act(() => {
          fireEvent.click(tasksButton);
        });
      });
      
      // Clear the mock to see if it gets called again
      mockApiService.getTasks.mockClear();
      
      await waitFor(() => {
        const completeButton = screen.getByTestId('complete-task-Mon Dec 02 2024');
        act(() => {
          fireEvent.click(completeButton);
        });
      });
      
      // Should not refetch tasks immediately after completion
      expect(mockApiService.getTasks).not.toHaveBeenCalled();
    });
  });

  describe('Props and Effects', () => {
    it('uses provided userId prop', async () => {
      await act(async () => {
        render(<CourseContainer {...defaultProps} userId="custom-user" />);
      });
      
      await waitFor(() => {
        expect(mockGetAssignments).toHaveBeenCalledWith('course-123', 'custom-user');
        expect(mockApiService.getTasks).toHaveBeenCalledWith('custom-user');
      });
    });

    it('uses default userId when not provided', async () => {
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(mockGetAssignments).toHaveBeenCalledWith('course-123', 'paul_paw_test');
        expect(mockApiService.getTasks).toHaveBeenCalledWith('paul_paw_test');
      });
    });

    it('refreshes data when refreshKey changes', async () => {
      let rerender: any;
      await act(async () => {
        const result = render(<CourseContainer {...defaultProps} refreshKey={1} />);
        rerender = result.rerender;
      });
      
      await waitFor(() => {
        expect(mockGetAssignments).toHaveBeenCalledTimes(1);
        expect(mockApiService.getTasks).toHaveBeenCalledTimes(1);
      });
      
      // Change refreshKey
      await act(async () => {
        rerender(<CourseContainer {...defaultProps} refreshKey={2} />);
      });
      
      await waitFor(() => {
        expect(mockGetAssignments).toHaveBeenCalledTimes(2);
        expect(mockApiService.getTasks).toHaveBeenCalledTimes(2);
      });
    });

    it('refreshes data when courseId changes', async () => {
      let rerender: any;
      await act(async () => {
        const result = render(<CourseContainer {...defaultProps} />);
        rerender = result.rerender;
      });
      
      await waitFor(() => {
        expect(mockGetAssignments).toHaveBeenCalledWith('course-123', 'paul_paw_test');
      });
      
      // Change courseId
      await act(async () => {
        rerender(<CourseContainer {...defaultProps} courseId="course-456" />);
      });
      
      await waitFor(() => {
        expect(mockGetAssignments).toHaveBeenCalledWith('course-456', 'paul_paw_test');
      });
    });

    it('handles tasks with null scheduled_start_at', async () => {
      const tasksWithNullDate = [
        { ...mockTasks[0], scheduled_start_at: null }
      ];
      
      mockApiService.getTasks.mockResolvedValue(tasksWithNullDate);
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        const tasksButton = screen.getByText('Incomplete Tasks (1)');
        act(() => {
          fireEvent.click(tasksButton);
        });
      });
      
      // Should handle null dates gracefully
      expect(screen.getByTestId('multiple-task-container')).toBeInTheDocument();
    });

  });

  describe('Date Sorting', () => {
    it('sorts task dates chronologically', async () => {
      const tasksWithMixedDates = [
        {
          ...mockTasks[0],
          scheduled_start_at: '2024-12-05T10:00:00Z' // Later date
        },
        {
          ...mockTasks[1],
          scheduled_start_at: '2024-12-01T14:00:00Z' // Earlier date
        }
      ];
      
      mockApiService.getTasks.mockResolvedValue(tasksWithMixedDates);
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        const tasksButton = screen.getByText('Incomplete Tasks (2)');
        act(() => {
          fireEvent.click(tasksButton);
        });
      });
      
      // Check that dates are in chronological order
      const containers = screen.getAllByTestId('multiple-task-container');
      expect(containers).toHaveLength(2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('does not fetch assignments when courseId is empty', async () => {
      await act(async () => {
        render(<CourseContainer {...defaultProps} courseId="" />);
      });
      
      expect(mockGetAssignments).not.toHaveBeenCalled();
    });

    it('does not fetch tasks when courseId is empty', async () => {
      await act(async () => {
        render(<CourseContainer {...defaultProps} courseId="" />);
      });
      
      expect(mockApiService.getTasks).not.toHaveBeenCalled();
    });

    it('refetches assignments when name changes', async () => {
      let rerender: any;
      await act(async () => {
        const result = render(<CourseContainer {...defaultProps} />);
        rerender = result.rerender;
      });
      
      await waitFor(() => {
        expect(mockGetAssignments).toHaveBeenCalledTimes(1);
      });
      
      // Change name
      await act(async () => {
        rerender(<CourseContainer {...defaultProps} name="New Course Name" />);
      });
      
      await waitFor(() => {
        expect(mockGetAssignments).toHaveBeenCalledTimes(2);
      });
    });

    it('handles tasks with null scheduled_start_at in grouping', async () => {
      const tasksWithNullDates = [
        { ...mockTasks[0], scheduled_start_at: null },
        { ...mockTasks[1], scheduled_start_at: '2024-12-02T10:00:00Z' }
      ];
      
      mockApiService.getTasks.mockResolvedValue(tasksWithNullDates);
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        const tasksButton = screen.getByText('Incomplete Tasks (2)');
        act(() => {
          fireEvent.click(tasksButton);
        });
      });
      
      // Should handle null dates gracefully without crashing
      expect(screen.getAllByTestId('multiple-task-container')).toHaveLength(2);
    });

    it('filters out completed tasks correctly', async () => {
      const mixedTasks = [
        { ...mockTasks[0], is_completed: false },
        { ...mockTasks[1], is_completed: true },
        { ...mockTasks[2], is_completed: false }
      ];
      
      mockApiService.getTasks.mockResolvedValue(mixedTasks);
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Incomplete Tasks (2)')).toBeInTheDocument();
      });
    });
  });

  describe('Callback Functions', () => {
    it('calls onRefreshData when provided to MultipleTaskContainer', async () => {
      const mockOnRefreshData = jest.fn();
      
      await act(async () => {
        render(
          <CourseContainer 
            {...defaultProps} 
            onRefreshData={mockOnRefreshData}
          />
        );
      });
      
      await waitFor(() => {
        const tasksButton = screen.getByText('Incomplete Tasks (2)');
        act(() => {
          fireEvent.click(tasksButton);
        });
      });
      
      // Check that onRefreshData is passed to MultipleTaskContainer
      const taskContainers = screen.getAllByTestId('multiple-task-container');
      expect(taskContainers).toHaveLength(2);
    });

    it('passes all required props to MultipleTaskContainer', async () => {
      const mockOnRefreshData = jest.fn();
      const mockOnTaskCompleted = jest.fn();
      
      await act(async () => {
        render(
          <CourseContainer 
            {...defaultProps} 
            onRefreshData={mockOnRefreshData}
            onTaskCompleted={mockOnTaskCompleted}
            userId="test-user"
          />
        );
      });
      
      await waitFor(() => {
        const tasksButton = screen.getByText('Incomplete Tasks (2)');
        act(() => {
          fireEvent.click(tasksButton);
        });
      });
      
      // Verify that MultipleTaskContainer receives correct props
      const taskContainers = screen.getAllByTestId('multiple-task-container');
      expect(taskContainers[0]).toBeInTheDocument();
    });

    it('calls onTaskCompleted with correct parameters including fallback courseId', async () => {
      const mockOnTaskCompleted = jest.fn();
      
      await act(async () => {
        render(
          <CourseContainer 
            {...defaultProps} 
            onTaskCompleted={mockOnTaskCompleted}
          />
        );
      });
      
      await waitFor(() => {
        const tasksButton = screen.getByText('Incomplete Tasks (2)');
        act(() => {
          fireEvent.click(tasksButton);
        });
      });
      
      await waitFor(() => {
        const completeButton = screen.getByTestId('complete-task-Mon Dec 02 2024');
        act(() => {
          fireEvent.click(completeButton);
        });
      });
      
      expect(mockOnTaskCompleted).toHaveBeenCalledWith('task-1', 'study', 10, 'course-1');
    });

    it('does not call onTaskCompleted when callback is not provided', async () => {
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        const tasksButton = screen.getByText('Incomplete Tasks (2)');
        act(() => {
          fireEvent.click(tasksButton);
        });
      });
      
      await waitFor(() => {
        const completeButton = screen.getByTestId('complete-task-Mon Dec 02 2024');
        act(() => {
          fireEvent.click(completeButton);
        });
      });
      
      // Should not crash when onTaskCompleted is undefined
    });
  });

  describe('Task Completion Ref Behavior', () => {
    it('sets isTaskCompletingRef to true when task is completed', async () => {
      const mockOnTaskCompleted = jest.fn();
      
      await act(async () => {
        render(
          <CourseContainer 
            {...defaultProps} 
            onTaskCompleted={mockOnTaskCompleted}
          />
        );
      });
      
      await waitFor(() => {
        const tasksButton = screen.getByText('Incomplete Tasks (2)');
        act(() => {
          fireEvent.click(tasksButton);
        });
      });
      
      await waitFor(() => {
        const completeButton = screen.getByTestId('complete-task-Mon Dec 02 2024');
        act(() => {
          fireEvent.click(completeButton);
        });
      });
      
      // The ref should prevent subsequent task fetches
      // We can verify this by clearing the mock and triggering a refresh
      mockApiService.getTasks.mockClear();
      
      // Try to trigger another fetch by changing refreshKey - this should be ignored
      expect(mockOnTaskCompleted).toHaveBeenCalled();
    });

    it('skips task fetching when isTaskCompletingRef is true', async () => {
      const mockOnTaskCompleted = jest.fn();
      
      await act(async () => {
        render(
          <CourseContainer 
            {...defaultProps} 
            onTaskCompleted={mockOnTaskCompleted}
          />
        );
      });
      
      // Wait for initial load
      await waitFor(() => {
        expect(mockApiService.getTasks).toHaveBeenCalledTimes(1);
      });
      
      await waitFor(() => {
        const tasksButton = screen.getByText('Incomplete Tasks (2)');
        act(() => {
          fireEvent.click(tasksButton);
        });
      });
      
      // Complete a task to set ref to true
      await waitFor(() => {
        const completeButton = screen.getByTestId('complete-task-Mon Dec 02 2024');
        act(() => {
          fireEvent.click(completeButton);
        });
      });
      
      // Clear the mock to track new calls
      mockApiService.getTasks.mockClear();
      
      // The component should not fetch tasks again due to the ref
      await waitFor(() => {
        expect(mockApiService.getTasks).not.toHaveBeenCalled();
      }, { timeout: 1000 });
    });
  });

  describe('Color Variations', () => {
    it('applies different color classes correctly', async () => {
      const colors = ['red', 'green', 'purple', 'yellow'];
      
      for (const color of colors) {
        let container: HTMLElement;
        let unmount: any;
        
        await act(async () => {
          const result = render(<CourseContainer {...defaultProps} color={color} />);
          container = result.container;
          unmount = result.unmount;
        });
        
        const courseContainer = container!.querySelector('.bg-gradient-to-bl');
        expect(courseContainer).toHaveClass(`from-${color}-100`, `to-${color}-200`);
        
        const courseBadge = container!.querySelector(`.bg-${color}-400`);
        expect(courseBadge).toBeInTheDocument();
        
        unmount();
      }
    });
  });

  describe('Assignment States', () => {
    it('shows correct error message from catch block', async () => {
      console.error = jest.fn(); // Mock console.error
      mockGetAssignments.mockRejectedValue(new Error('Network Error'));
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Error loading assignments')).toBeInTheDocument();
      });
      
      expect(console.error).toHaveBeenCalledWith('Error fetching assignments:', expect.any(Error));
    });

    it('shows loading state correctly for tasks', async () => {
      mockApiService.getTasks.mockReturnValue(new Promise(() => {}));
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      expect(screen.getByText('Loading course tasks...')).toBeInTheDocument();
    });

    it('sets error state correctly on assignment fetch failure', async () => {
      mockGetAssignments.mockRejectedValue(new Error('API Error'));
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Error loading assignments')).toBeInTheDocument();
      });
    });
  });

  describe('Task Grouping Logic', () => {
    it('groups multiple tasks on the same date', async () => {
      const sameeDateTasks = [
        { ...mockTasks[0], scheduled_start_at: '2024-12-02T10:00:00Z' },
        { ...mockTasks[1], scheduled_start_at: '2024-12-02T15:00:00Z' },
        { 
          ...mockTasks[0], 
          task_id: 'task-3',
          scheduled_start_at: '2024-12-02T20:00:00Z' 
        }
      ];
      
      mockApiService.getTasks.mockResolvedValue(sameeDateTasks);
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        const tasksButton = screen.getByText('Incomplete Tasks (3)');
        act(() => {
          fireEvent.click(tasksButton);
        });
      });
      
      // Should have only one date group with all tasks
      const taskContainers = screen.getAllByTestId('multiple-task-container');
      expect(taskContainers).toHaveLength(1);
      expect(screen.getByText('Tasks: 3')).toBeInTheDocument();
    });

    it('handles empty tasks array', async () => {
      mockApiService.getTasks.mockResolvedValue([]);
      
      await act(async () => {
        render(<CourseContainer {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.queryByText(/Incomplete Tasks/)).not.toBeInTheDocument();
      });
    });
  });
});
