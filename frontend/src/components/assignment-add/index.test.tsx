import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddAssignmentComponent } from './index';
import { assignmentsApiService } from '../../api-contexts/add-assignments';
import { getCourses } from '../../api-contexts/get-courses';

jest.mock('../../api-contexts/add-assignments', () => ({
  assignmentsApiService: {
    createAssignment: jest.fn(),
  },
}));

jest.mock('../../api-contexts/get-courses', () => ({
  getCourses: jest.fn(),
}));

const mockAssignmentsApiService = assignmentsApiService as jest.Mocked<typeof assignmentsApiService>;
const mockGetCourses = getCourses as jest.MockedFunction<typeof getCourses>;

const mockCoursesForAssignment: Array<{ course_id: string; name: string; color: string }> = [
  { course_id: 'course-1', name: 'Mathematics 101', color: 'blue' },
  { course_id: 'course-2', name: 'Computer Science 202', color: 'green' },
];

describe('AddAssignmentComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCourses.mockResolvedValue(mockCoursesForAssignment);
    mockAssignmentsApiService.createAssignment.mockResolvedValue({
      status: 'success',
      assignment_id: 'test-assignment-id'
    });
  });

  const renderAddAssignment = (props = {}) => {
    const defaultProps = {
      userId: 'test-user-id',
    };
    return render(<AddAssignmentComponent {...defaultProps} {...props} />);
  };

  describe('Initial Rendering', () => {
    it('renders component with correct title', async () => {
      renderAddAssignment();
      
      expect(screen.getByText('Add New Assignment')).toBeInTheDocument();
    });

    it('displays all form fields', async () => {
      renderAddAssignment();
      
      expect(screen.getByText('Assignment Title')).toBeInTheDocument();
      expect(screen.getByText('Course')).toBeInTheDocument();
      expect(screen.getByText('Due Date')).toBeInTheDocument();
      expect(screen.getByText('Due Time')).toBeInTheDocument();
    });

    it('displays quick due date buttons', async () => {
      renderAddAssignment();
      
      expect(screen.getByText('📅 1 Week')).toBeInTheDocument();
      expect(screen.getByText('📅 2 Weeks')).toBeInTheDocument();
      expect(screen.getByText('📅 1 Month')).toBeInTheDocument();
    });

    it('displays create assignment button', async () => {
      renderAddAssignment();
      
      expect(screen.getByRole('button', { name: 'Create Assignment' })).toBeInTheDocument();
    });

    it('does not display cancel button when onCancel is not provided', async () => {
      renderAddAssignment();
      
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    });

    it('displays cancel button when onCancel is provided', async () => {
      const mockOnCancel = jest.fn();
      renderAddAssignment({ onCancel: mockOnCancel });
      
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
  });

  describe('Course Loading', () => {
    it('loads courses on mount when userId is provided', async () => {
      renderAddAssignment();
      
      await waitFor(() => {
        expect(getCourses).toHaveBeenCalledWith('test-user-id');
      });
    });

    it('does not load courses when userId is not provided', async () => {
      renderAddAssignment({ userId: '' });
      
      expect(getCourses).not.toHaveBeenCalled();
    });

    it('populates course dropdown with loaded courses', async () => {
      renderAddAssignment();
      
      await waitFor(() => {
        expect(screen.getByText('Mathematics 101')).toBeInTheDocument();
        expect(screen.getByText('Computer Science 202')).toBeInTheDocument();
      });
    });

    it('handles course loading error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (getCourses as jest.Mock).mockRejectedValue(new Error('Failed to load courses'));
      
      renderAddAssignment();
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading courses:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('displays default option in course dropdown', async () => {
      renderAddAssignment();
      
      expect(screen.getByText('Select a course')).toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    it('updates assignment title when input changes', async () => {
      renderAddAssignment();
      
      const titleInput = screen.getByPlaceholderText('e.g., Essay on Climate Change');
      fireEvent.change(titleInput, { target: { value: 'Test Assignment' } });
      
      expect(titleInput).toHaveValue('Test Assignment');
    });

    it('updates course selection when dropdown changes', async () => {
      renderAddAssignment();
      
      await waitFor(() => {
        expect(screen.getByText('Mathematics 101')).toBeInTheDocument();
      });
      
      const courseSelect = screen.getByRole('combobox');
      fireEvent.change(courseSelect, { target: { value: 'course-1' } });
      
      expect(courseSelect).toHaveValue('course-1');
    });
  });

  describe('Quick Due Date Buttons', () => {
    it('sets due date and time when 1 Week button is clicked', async () => {
      renderAddAssignment();
      
      const oneWeekButton = screen.getByText('📅 1 Week').closest('button');
      fireEvent.click(oneWeekButton!);
      
      const dueTimeInput = screen.getByDisplayValue('23:59');
      expect(dueTimeInput).toBeInTheDocument();
    });

    it('sets due date and time when 2 Weeks button is clicked', async () => {
      renderAddAssignment();
      
      const twoWeeksButton = screen.getByText('📅 2 Weeks').closest('button');
      fireEvent.click(twoWeeksButton!);
      
      const dueTimeInput = screen.getByDisplayValue('23:59');
      expect(dueTimeInput).toBeInTheDocument();
    });

    it('sets due date and time when 1 Month button is clicked', async () => {
      renderAddAssignment();
      
      const oneMonthButton = screen.getByText('📅 1 Month').closest('button');
      fireEvent.click(oneMonthButton!);
      
      const dueTimeInput = screen.getByDisplayValue('23:59');
      expect(dueTimeInput).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls createAssignment when form is submitted with valid data', async () => {
      renderAddAssignment();
      
      await waitFor(() => {
        expect(screen.getByText('Mathematics 101')).toBeInTheDocument();
      });
      
      const titleInput = screen.getByPlaceholderText('e.g., Essay on Climate Change');
      fireEvent.change(titleInput, { target: { value: 'Test Assignment' } });
      
      const courseSelect = screen.getByRole('combobox');
      fireEvent.change(courseSelect, { target: { value: 'course-1' } });
      
      const oneWeekButton = screen.getByText('📅 1 Week').closest('button');
      fireEvent.click(oneWeekButton!);
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: 'Create Assignment' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockAssignmentsApiService.createAssignment).toHaveBeenCalled();
      });
    });

    it('shows loading state during submission', async () => {
      mockAssignmentsApiService.createAssignment.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          status: 'success',
          assignment_id: 'test-assignment-id'
        }), 100))
      );
      
      renderAddAssignment();
      
      await waitFor(() => {
        expect(screen.getByText('Mathematics 101')).toBeInTheDocument();
      });
      
      const titleInput = screen.getByPlaceholderText('e.g., Essay on Climate Change');
      fireEvent.change(titleInput, { target: { value: 'Test Assignment' } });
      
      const courseSelect = screen.getByRole('combobox');
      fireEvent.change(courseSelect, { target: { value: 'course-1' } });
      
      const oneWeekButton = screen.getByText('📅 1 Week').closest('button');
      fireEvent.click(oneWeekButton!);
      
      const submitButton = screen.getByRole('button', { name: 'Create Assignment' });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });

    it('calls onSuccess callback after successful submission', async () => {
      const mockOnSuccess = jest.fn();
      renderAddAssignment({ onSuccess: mockOnSuccess });
      
      await waitFor(() => {
        expect(screen.getByText('Mathematics 101')).toBeInTheDocument();
      });
      
      const titleInput = screen.getByPlaceholderText('e.g., Essay on Climate Change');
      fireEvent.change(titleInput, { target: { value: 'Test Assignment' } });
      
      const courseSelect = screen.getByRole('combobox');
      fireEvent.change(courseSelect, { target: { value: 'course-1' } });
      
      const oneWeekButton = screen.getByText('📅 1 Week').closest('button');
      fireEvent.click(oneWeekButton!);
      
      const submitButton = screen.getByRole('button', { name: 'Create Assignment' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('resets form after successful submission', async () => {
      renderAddAssignment();
      
      await waitFor(() => {
        expect(screen.getByText('Mathematics 101')).toBeInTheDocument();
      });
      
      const titleInput = screen.getByPlaceholderText('e.g., Essay on Climate Change');
      fireEvent.change(titleInput, { target: { value: 'Test Assignment' } });
      
      const courseSelect = screen.getByRole('combobox');
      fireEvent.change(courseSelect, { target: { value: 'course-1' } });
      
      const oneWeekButton = screen.getByText('📅 1 Week').closest('button');
      fireEvent.click(oneWeekButton!);
      
      const submitButton = screen.getByRole('button', { name: 'Create Assignment' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(titleInput).toHaveValue('');
        expect(courseSelect).toHaveValue('');
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when assignment creation fails', async () => {
      mockAssignmentsApiService.createAssignment.mockRejectedValue(new Error('Server error'));
      
      renderAddAssignment();
      
      await waitFor(() => {
        expect(screen.getByText('Mathematics 101')).toBeInTheDocument();
      });
      
      const titleInput = screen.getByPlaceholderText('e.g., Essay on Climate Change');
      fireEvent.change(titleInput, { target: { value: 'Test Assignment' } });
      
      const courseSelect = screen.getByRole('combobox');
      fireEvent.change(courseSelect, { target: { value: 'course-1' } });
      
      const oneWeekButton = screen.getByText('📅 1 Week').closest('button');
      fireEvent.click(oneWeekButton!);
      
      const submitButton = screen.getByRole('button', { name: 'Create Assignment' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('displays generic error message for non-Error objects', async () => {
      mockAssignmentsApiService.createAssignment.mockRejectedValue('String error');
      
      renderAddAssignment();
      
      await waitFor(() => {
        expect(screen.getByText('Mathematics 101')).toBeInTheDocument();
      });
      
      const titleInput = screen.getByPlaceholderText('e.g., Essay on Climate Change');
      fireEvent.change(titleInput, { target: { value: 'Test Assignment' } });
      
      const courseSelect = screen.getByRole('combobox');
      fireEvent.change(courseSelect, { target: { value: 'course-1' } });
      
      const oneWeekButton = screen.getByText('📅 1 Week').closest('button');
      fireEvent.click(oneWeekButton!);
      
      const submitButton = screen.getByRole('button', { name: 'Create Assignment' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to create assignment')).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const mockOnCancel = jest.fn();
      renderAddAssignment({ onCancel: mockOnCancel });
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('does not submit form when cancel button is clicked', async () => {
      const mockOnCancel = jest.fn();
      renderAddAssignment({ onCancel: mockOnCancel });
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);
      
      expect(mockAssignmentsApiService.createAssignment).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has helpful placeholder text', async () => {
      renderAddAssignment();
      
      expect(screen.getByPlaceholderText('e.g., Essay on Climate Change')).toBeInTheDocument();
    });

    it('has helpful helper text for due time', async () => {
      renderAddAssignment();
      
      expect(screen.getByText('Default: 11:59 PM')).toBeInTheDocument();
    });

    it('displays error messages with appropriate styling', async () => {
      mockAssignmentsApiService.createAssignment.mockRejectedValue(new Error('Test error'));
      
      renderAddAssignment();
      
      await waitFor(() => {
        expect(screen.getByText('Mathematics 101')).toBeInTheDocument();
      });
      
      const titleInput = screen.getByPlaceholderText('e.g., Essay on Climate Change');
      fireEvent.change(titleInput, { target: { value: 'Test Assignment' } });
      
      const courseSelect = screen.getByRole('combobox');
      fireEvent.change(courseSelect, { target: { value: 'course-1' } });
      
      const oneWeekButton = screen.getByText('📅 1 Week').closest('button');
      fireEvent.click(oneWeekButton!);
      
      const submitButton = screen.getByRole('button', { name: 'Create Assignment' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const errorElement = screen.getByText('Test error');
        expect(errorElement).toBeInTheDocument();
      });
    });
  });
});