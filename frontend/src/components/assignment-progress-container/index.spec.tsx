import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AssignmentProgressContainer from './index';

// Mock assignment data for testing
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
    title: 'Science Lab Report',
    due_date: '2025-11-30',
    completion_points: 75,
    is_complete: true,
    task_count: 4,
    completed_task_count: 4
  },
  {
    assignment_id: '3',
    course_id: 'course1',
    title: 'History Essay',
    due_date: '2025-12-05',
    completion_points: 50,
    is_complete: false,
    task_count: 0, // No tasks
    completed_task_count: 0
  },
  {
    assignment_id: '4',
    course_id: 'course1',
    title: 'English Paper',
    due_date: '2025-12-10',
    completion_points: 80,
    is_complete: true,
    task_count: undefined, // No task count provided
    completed_task_count: undefined
  }
];

describe('AssignmentProgressContainer', () => {
  const defaultProps = {
    assignments: mockAssignments,
    color: 'blue'
  };

  beforeEach(() => {
    // Clean up DOM between tests
    document.body.innerHTML = '';
  });

  describe('Rendering', () => {
    it('renders all assignments', () => {
      render(<AssignmentProgressContainer {...defaultProps} />);
      
      expect(screen.getByText('Math Assignment 1')).toBeInTheDocument();
      expect(screen.getByText('Science Lab Report')).toBeInTheDocument();
      expect(screen.getByText('History Essay')).toBeInTheDocument();
      expect(screen.getByText('English Paper')).toBeInTheDocument();
    });

    it('displays due dates correctly', () => {
      render(<AssignmentProgressContainer {...defaultProps} />);
      
      expect(screen.getByText('DUE BY: 2025-12-01')).toBeInTheDocument();
      expect(screen.getByText('DUE BY: 2025-11-30')).toBeInTheDocument();
      expect(screen.getByText('DUE BY: 2025-12-05')).toBeInTheDocument();
      expect(screen.getByText('DUE BY: 2025-12-10')).toBeInTheDocument();
    });
  });

  describe('Progress Calculation', () => {
    it('calculates progress correctly for assignments with tasks', () => {
      render(<AssignmentProgressContainer {...defaultProps} />);
      
      // First, check that all assignments are rendered
      expect(screen.getByText('Math Assignment 1')).toBeInTheDocument();
      expect(screen.getByText('Science Lab Report')).toBeInTheDocument();
      expect(screen.getByText('History Essay')).toBeInTheDocument();
      expect(screen.getByText('English Paper')).toBeInTheDocument();
      
      // Math Assignment: 3/5 tasks = 60%
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('3 of 5 tasks completed')).toBeInTheDocument();
      
      // Science Lab Report: 4/4 tasks = 100%
      expect(screen.getByText('4 of 4 tasks completed')).toBeInTheDocument();
      
      // History Essay: 0% (incomplete, no tasks)
      expect(screen.getByText('0 of 1 task completed')).toBeInTheDocument();
      
      // English Paper: 100% (complete, no task count)
      expect(screen.getByText('1 of 1 task completed')).toBeInTheDocument();
      
      // Check for all percentage values
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
      
      // There should be exactly 2 elements with 100%
      const hundredPercentElements = screen.getAllByText('100%');
      expect(hundredPercentElements).toHaveLength(2);
    });

    it('shows 0% progress for incomplete assignments without tasks', () => {
      render(<AssignmentProgressContainer {...defaultProps} />);
      
      // History Essay: incomplete, no tasks = 0%
      const progressElements = screen.getAllByText('0%');
      expect(progressElements).toHaveLength(1);
      expect(screen.getByText('0 of 1 task completed')).toBeInTheDocument();
    });

    it('shows 100% progress for complete assignments without task count', () => {
      render(<AssignmentProgressContainer {...defaultProps} />);
      
      // English Paper: complete, no task count = 100%
      const progressElements = screen.getAllByText('100%');
      expect(progressElements).toHaveLength(2); // Science Lab Report and English Paper
      expect(screen.getByText('1 of 1 task completed')).toBeInTheDocument();
    });

    it('handles edge cases with zero task count', () => {
      const assignmentWithZeroTasks = [{
        assignment_id: '5',
        course_id: 'course1',
        title: 'Zero Tasks Assignment',
        due_date: '2025-12-15',
        completion_points: 25,
        is_complete: false,
        task_count: 0,
        completed_task_count: 0
      }];

      render(<AssignmentProgressContainer assignments={assignmentWithZeroTasks} color="green" />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('0 of 1 task completed')).toBeInTheDocument();
    });

    it('handles missing completed_task_count', () => {
      const assignmentWithMissingCompletedCount = [{
        assignment_id: '6',
        course_id: 'course1',
        title: 'Missing Completed Count',
        due_date: '2025-12-20',
        completion_points: 30,
        is_complete: false,
        task_count: 3
        // completed_task_count is undefined
      }];

      render(<AssignmentProgressContainer assignments={assignmentWithMissingCompletedCount} color="purple" />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('0 of 3 tasks completed')).toBeInTheDocument();
    });

    it('calculates partial progress correctly', () => {
      const partialProgressAssignment = [{
        assignment_id: '7',
        course_id: 'course1',
        title: 'Partial Progress Assignment',
        due_date: '2025-12-25',
        completion_points: 75,
        is_complete: false,
        task_count: 3,
        completed_task_count: 1
      }];

      render(<AssignmentProgressContainer assignments={partialProgressAssignment} color="green" />);
      
      // 1/3 tasks = 33% (rounded)
      expect(screen.getByText('33%')).toBeInTheDocument();
      expect(screen.getByText('1 of 3 tasks completed')).toBeInTheDocument();
    });

    it('handles assignments with undefined task_count but has completed_task_count', () => {
      const undefinedTaskCountAssignment = [{
        assignment_id: '8',
        course_id: 'course1',
        title: 'Undefined Task Count',
        due_date: '2025-12-28',
        completion_points: 40,
        is_complete: true,
        // task_count is undefined
        completed_task_count: 2
      }];

      render(<AssignmentProgressContainer assignments={undefinedTaskCountAssignment} color="orange" />);
      
      // Should use completion status since task_count is undefined
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('1 of 1 task completed')).toBeInTheDocument();
    });

    it('handles assignments with null task_count', () => {
      const nullTaskCountAssignment = [{
        assignment_id: '9',
        course_id: 'course1',
        title: 'Null Task Count',
        due_date: '2025-12-29',
        completion_points: 60,
        is_complete: false,
        task_count: null as any,
        completed_task_count: 0
      }];

      render(<AssignmentProgressContainer assignments={nullTaskCountAssignment} color="pink" />);
      
      // Should use completion status since task_count is null
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('0 of 1 task completed')).toBeInTheDocument();
    });

    it('handles assignments with negative task counts gracefully', () => {
      const negativeTaskCountAssignment = [{
        assignment_id: '10',
        course_id: 'course1',
        title: 'Negative Task Count',
        due_date: '2025-12-30',
        completion_points: 50,
        is_complete: true,
        task_count: -1,
        completed_task_count: 0
      }];

      render(<AssignmentProgressContainer assignments={negativeTaskCountAssignment} color="indigo" />);
      
      // Should use completion status since task_count is negative
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('1 of 1 task completed')).toBeInTheDocument();
    });
  });

  describe('Progress Bar Styling', () => {
    it('applies correct color class to progress bars', () => {
      const { container } = render(<AssignmentProgressContainer {...defaultProps} />);
      
      // Check if progress bars have the blue color class
      const progressBars = container.querySelectorAll('.bg-blue-400');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('uses different color when specified', () => {
      const { container } = render(
        <AssignmentProgressContainer assignments={[mockAssignments[0]]} color="red" />
      );
      
      const progressBars = container.querySelectorAll('.bg-red-400');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('sets correct width style for progress bars', () => {
      const { container } = render(<AssignmentProgressContainer {...defaultProps} />);
      
      const progressBars = container.querySelectorAll('[style*="width"]');
      expect(progressBars.length).toBe(4); // One for each assignment
      
      // Check specific widths
      expect(progressBars[0]).toHaveStyle('width: 60%'); // Math Assignment
      expect(progressBars[1]).toHaveStyle('width: 100%'); // Science Lab Report
      expect(progressBars[2]).toHaveStyle('width: 0%'); // History Essay
      expect(progressBars[3]).toHaveStyle('width: 100%'); // English Paper
    });

    it('renders progress bars with 0% width for incomplete assignments', () => {
      const incompleteAssignment = [{
        assignment_id: '11',
        course_id: 'course1',
        title: 'Incomplete Assignment',
        due_date: '2025-12-31',
        completion_points: 25,
        is_complete: false,
        task_count: 5,
        completed_task_count: 0
      }];

      const { container } = render(<AssignmentProgressContainer assignments={incompleteAssignment} color="gray" />);
      
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toHaveStyle('width: 0%');
    });

    it('renders progress bars with 100% width for fully completed assignments', () => {
      const completeAssignment = [{
        assignment_id: '12',
        course_id: 'course1',
        title: 'Complete Assignment',
        due_date: '2025-12-31',
        completion_points: 100,
        is_complete: true,
        task_count: 3,
        completed_task_count: 3
      }];

      const { container } = render(<AssignmentProgressContainer assignments={completeAssignment} color="green" />);
      
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toHaveStyle('width: 100%');
    });

    it('handles fractional progress calculations with proper rounding', () => {
      const fractionalProgressAssignment = [{
        assignment_id: '13',
        course_id: 'course1',
        title: 'Fractional Progress',
        due_date: '2025-12-31',
        completion_points: 30,
        is_complete: false,
        task_count: 7,
        completed_task_count: 2
      }];

      render(<AssignmentProgressContainer assignments={fractionalProgressAssignment} color="teal" />);
      
      // 2/7 = 0.2857... = 29% when rounded
      expect(screen.getByText('29%')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('has correct CSS classes for layout', () => {
      const { container } = render(<AssignmentProgressContainer {...defaultProps} />);
      
      // Main container
      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('flex', 'flex-col', 'space-y-2');
      
      // Individual assignment containers
      const assignmentContainers = container.querySelectorAll('.p-4.bg-white.rounded-lg');
      expect(assignmentContainers).toHaveLength(4);
    });

    it('truncates long assignment titles', () => {
      const longTitleAssignment = [{
        assignment_id: '7',
        course_id: 'course1',
        title: 'This is a very long assignment title that should be truncated to prevent layout issues',
        due_date: '2025-12-25',
        completion_points: 40,
        is_complete: false,
        task_count: 2,
        completed_task_count: 1
      }];

      const { container } = render(
        <AssignmentProgressContainer assignments={longTitleAssignment} color="orange" />
      );
      
      const titleElement = container.querySelector('.truncate');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveClass('truncate');
    });
  });

  describe('Accessibility', () => {
    it('provides meaningful text content for screen readers', () => {
      render(<AssignmentProgressContainer {...defaultProps} />);
      
      // Check that progress information is readable
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('3 of 5 tasks completed')).toBeInTheDocument();
    });

    it('maintains proper heading hierarchy', () => {
      render(<AssignmentProgressContainer {...defaultProps} />);
      
      // Assignment titles should be readable by screen readers
      expect(screen.getByText('Math Assignment 1')).toBeInTheDocument();
      expect(screen.getByText('Science Lab Report')).toBeInTheDocument();
    });
  });

  describe('Data Handling', () => {
    it('handles assignments with all required fields', () => {
      const completeAssignment = [{
        assignment_id: '8',
        course_id: 'course2',
        title: 'Complete Assignment',
        due_date: '2025-12-30',
        completion_points: 60,
        is_complete: true,
        task_count: 3,
        completed_task_count: 3
      }];

      render(<AssignmentProgressContainer assignments={completeAssignment} color="green" />);
      
      expect(screen.getByText('Complete Assignment')).toBeInTheDocument();
      expect(screen.getByText('DUE BY: 2025-12-30')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('3 of 3 tasks completed')).toBeInTheDocument();
    });

    it('preserves assignment order', () => {
      render(<AssignmentProgressContainer {...defaultProps} />);
      
      const titles = screen.getAllByText(/Assignment|Report|Essay|Paper/);
      expect(titles[0]).toHaveTextContent('Math Assignment 1');
      expect(titles[1]).toHaveTextContent('Science Lab Report');
      expect(titles[2]).toHaveTextContent('History Essay');
      expect(titles[3]).toHaveTextContent('English Paper');
    });
  });
});
