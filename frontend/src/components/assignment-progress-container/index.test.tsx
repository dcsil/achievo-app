import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AssignmentProgressContainer from './index';

interface Assignment {
  assignment_id: string;
  course_id: string;
  title: string;
  due_date: string;
  completion_points: number;
  is_complete: boolean;
  task_count?: number;
  completed_task_count?: number;
}

describe('AssignmentProgressContainer', () => {
  const mockAssignmentWithTasks: Assignment = {
    assignment_id: '1',
    course_id: 'CS101',
    title: 'Math Homework 1',
    due_date: '2025-12-15',
    completion_points: 10,
    is_complete: false,
    task_count: 5,
    completed_task_count: 3
  };

  const mockAssignmentWithoutTasks: Assignment = {
    assignment_id: '2',
    course_id: 'CS102',
    title: 'Essay Assignment',
    due_date: '2025-12-20',
    completion_points: 20,
    is_complete: true
  };

  const mockIncompleteAssignmentNoTasks: Assignment = {
    assignment_id: '3',
    course_id: 'CS103',
    title: 'Reading Assignment',
    due_date: '2025-12-25',
    completion_points: 5,
    is_complete: false
  };

  const mockAssignmentZeroTasks: Assignment = {
    assignment_id: '4',
    course_id: 'CS104',
    title: 'Zero Tasks Assignment',
    due_date: '2025-12-30',
    completion_points: 15,
    is_complete: false,
    task_count: 0,
    completed_task_count: 0
  };

  const mockAssignmentWithTasksComplete: Assignment = {
    assignment_id: '5',
    course_id: 'CS105',
    title: 'Complete Assignment',
    due_date: '2025-12-31',
    completion_points: 25,
    is_complete: true,
    task_count: 4,
    completed_task_count: 4
  };

  const mockAssignmentUndefinedCompletedCount: Assignment = {
    assignment_id: '6',
    course_id: 'CS106',
    title: 'Undefined Completed Count',
    due_date: '2026-01-01',
    completion_points: 30,
    is_complete: false,
    task_count: 3,
    completed_task_count: undefined
  };

  it('renders single assignment with tasks correctly', () => {
    render(<AssignmentProgressContainer assignments={[mockAssignmentWithTasks]} color="green" />);
    
    // Check if all elements are rendered
    expect(screen.getByText('DUE BY: 2025-12-15')).toBeInTheDocument();
    expect(screen.getByText('Math Homework 1')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('3 of 5 tasks completed')).toBeInTheDocument();
  });

  it('calculates progress correctly for assignment with tasks (60%)', () => {
    render(<AssignmentProgressContainer assignments={[mockAssignmentWithTasks]} color="blue" />);
    
    // 3 out of 5 tasks = 60%
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('3 of 5 tasks completed')).toBeInTheDocument();
  });

  it('shows 100% progress for complete assignment without tasks', () => {
    render(<AssignmentProgressContainer assignments={[mockAssignmentWithoutTasks]} color="red" />);
    
    // Complete assignment without tasks should show 100%
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('0 of 0 tasks completed')).toBeInTheDocument();
  });

  it('shows 0% progress for incomplete assignment without tasks', () => {
    render(<AssignmentProgressContainer assignments={[mockIncompleteAssignmentNoTasks]} color="purple" />);
    
    // Incomplete assignment without tasks should show 0%
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('0 of 0 tasks completed')).toBeInTheDocument();
  });

  it('handles assignment with zero task_count', () => {
    render(<AssignmentProgressContainer assignments={[mockAssignmentZeroTasks]} color="yellow" />);
    
    // Assignment with task_count = 0 should fall back to is_complete logic
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('0 of 0 tasks completed')).toBeInTheDocument();
  });

  it('shows 100% for assignment with all tasks completed', () => {
    render(<AssignmentProgressContainer assignments={[mockAssignmentWithTasksComplete]} color="indigo" />);
    
    // 4 out of 4 tasks = 100%
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('4 of 4 tasks completed')).toBeInTheDocument();
  });

  it('handles undefined completed_task_count', () => {
    render(<AssignmentProgressContainer assignments={[mockAssignmentUndefinedCompletedCount]} color="pink" />);
    
    // Undefined completed_task_count should default to 0
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('0 of 3 tasks completed')).toBeInTheDocument();
  });

  it('renders multiple assignments correctly', () => {
    const multipleAssignments = [mockAssignmentWithTasks, mockAssignmentWithoutTasks];
    render(<AssignmentProgressContainer assignments={multipleAssignments} color="teal" />);
    
    // Check both assignments are rendered
    expect(screen.getByText('Math Homework 1')).toBeInTheDocument();
    expect(screen.getByText('Essay Assignment')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays due dates correctly', () => {
    render(<AssignmentProgressContainer assignments={[mockAssignmentWithTasks]} color="blue" />);
    
    expect(screen.getByText('DUE BY: 2025-12-15')).toBeInTheDocument();
  });

  it('displays assignment titles correctly', () => {
    const longTitleAssignment: Assignment = {
      ...mockAssignmentWithTasks,
      title: 'This is a very long assignment title that might get truncated in the UI'
    };
    
    render(<AssignmentProgressContainer assignments={[longTitleAssignment]} color="orange" />);
    
    expect(screen.getByText('This is a very long assignment title that might get truncated in the UI')).toBeInTheDocument();
  });

  it('handles edge case with 1 task completed out of 1 total', () => {
    const oneTaskAssignment: Assignment = {
      assignment_id: '7',
      course_id: 'CS107',
      title: 'Single Task Assignment',
      due_date: '2026-01-05',
      completion_points: 5,
      is_complete: false,
      task_count: 1,
      completed_task_count: 1
    };
    
    render(<AssignmentProgressContainer assignments={[oneTaskAssignment]} color="cyan" />);
    
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('1 of 1 tasks completed')).toBeInTheDocument();
  });

  it('handles partial progress calculation correctly', () => {
    const partialProgressAssignment: Assignment = {
      assignment_id: '8',
      course_id: 'CS108',
      title: 'Partial Progress Assignment',
      due_date: '2026-01-10',
      completion_points: 15,
      is_complete: false,
      task_count: 7,
      completed_task_count: 2
    };
    
    render(<AssignmentProgressContainer assignments={[partialProgressAssignment]} color="lime" />);
    
    // 2 out of 7 tasks = 28.57... rounded to 29%
    expect(screen.getByText('29%')).toBeInTheDocument();
    expect(screen.getByText('2 of 7 tasks completed')).toBeInTheDocument();
  });

  it('handles assignment with no completed_task_count property', () => {
    const noCompletedCountAssignment: Assignment = {
      assignment_id: '9',
      course_id: 'CS109',
      title: 'No Completed Count',
      due_date: '2026-01-15',
      completion_points: 10,
      is_complete: false,
      task_count: 5
      // deliberately omitting completed_task_count
    };
    
    render(<AssignmentProgressContainer assignments={[noCompletedCountAssignment]} color="emerald" />);
    
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('0 of 5 tasks completed')).toBeInTheDocument();
  });

  it('progress bar styling includes correct color class', () => {
    const { container } = render(<AssignmentProgressContainer assignments={[mockAssignmentWithTasks]} color="green" />);
    
    // Check if the progress bar has the correct color class
    const progressBar = container.querySelector('.bg-green-400');
    expect(progressBar).toBeInTheDocument();
  });

  it('displays correct assignment structure for each assignment', () => {
    render(<AssignmentProgressContainer assignments={[mockAssignmentWithTasks]} color="blue" />);
    
    // Check all expected text elements are present
    expect(screen.getByText(/DUE BY:/)).toBeInTheDocument();
    expect(screen.getByText('Math Homework 1')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText(/tasks completed/)).toBeInTheDocument();
  });
});
