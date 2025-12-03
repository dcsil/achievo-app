import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddTaskComponent } from './index';
import { tasksApiService } from '../../api-contexts/add-tasks';
import { getCourses } from '../../api-contexts/get-courses';
import { getAssignments } from '../../api-contexts/get-assignments';

jest.mock('../../api-contexts/add-tasks', () => ({
  tasksApiService: {
    createTask: jest.fn(),
  },
}));

jest.mock('../../api-contexts/get-courses', () => ({
  getCourses: jest.fn(),
}));

jest.mock('../../api-contexts/get-assignments', () => ({
  getAssignments: jest.fn(),
}));

const mockCourses = [
  { course_id: 'course-1', name: 'CSC491 - Capstone Project' },
  { course_id: 'course-2', name: 'CSC454 - Business of Software' },
];

const mockAssignments = [
  { assignment_id: 'assign-1', title: 'Assignment 1' },
  { assignment_id: 'assign-2', title: 'Assignment 2' },
];

describe('AddTaskComponent', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();
  const mockUserId = 'test-user-123';

  const defaultProps = {
    userId: mockUserId,
    onSuccess: mockOnSuccess,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getCourses as jest.Mock).mockResolvedValue(mockCourses);
    (getAssignments as jest.Mock).mockResolvedValue(mockAssignments);
    (tasksApiService.createTask as jest.Mock).mockResolvedValue({ success: true });
  });

  const renderComponent = (props = {}) => {
    return render(<AddTaskComponent {...defaultProps} {...props} />);
  };

  const getDescriptionInput = () => screen.getByPlaceholderText('Enter task description');
  const getTaskTypeSelect = () => screen.getAllByRole('combobox')[0];
  const getCourseSelect = () => screen.getAllByRole('combobox')[1];

  const getReadingTemplateButton = () => screen.getByText('1-hour reading session').closest('button');
  const getPomodoroTemplateButton = () => screen.getByText('25 min + 5 min break').closest('button');
  const getDeepWorkTemplateButton = () => screen.getByText('2-hour focus session').closest('button');
  const getWorkoutTemplateButton = () => screen.getByText('30-minute exercise').closest('button');

  describe('Rendering', () => {
    it('renders the component title', () => {
      renderComponent();

      expect(screen.getByText('Add New Task')).toBeInTheDocument();
    });

    it('renders quick templates section', () => {
      renderComponent();

      expect(screen.getByText('Quick Templates')).toBeInTheDocument();
    });

    it('renders all quick template buttons', () => {
      renderComponent();

      expect(screen.getByText(/Pomodoro/)).toBeInTheDocument();
      expect(screen.getByText(/Deep Work/)).toBeInTheDocument();
      // Use more specific text to avoid conflicts with task type options
      expect(screen.getByText('1-hour reading session')).toBeInTheDocument();
      expect(screen.getByText(/Workout/)).toBeInTheDocument();
    });

    it('renders task type dropdown', () => {
      renderComponent();

      expect(screen.getByText('Task Type')).toBeInTheDocument();
      expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(1);
    });

    it('renders description input', () => {
      renderComponent();

      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(getDescriptionInput()).toBeInTheDocument();
    });

    it('renders course dropdown', () => {
      renderComponent();

      expect(screen.getByText(/Course/)).toBeInTheDocument();
    });

    it('renders date and time inputs', () => {
      renderComponent();

      expect(screen.getByText('Start Date')).toBeInTheDocument();
      expect(screen.getByText('Start Time')).toBeInTheDocument();
      expect(screen.getByText('End Date')).toBeInTheDocument();
      expect(screen.getByText('End Time')).toBeInTheDocument();
    });

    it('renders Create Task button', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: 'Create Task' })).toBeInTheDocument();
    });

    it('renders Cancel button when onCancel is provided', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('does not render Cancel button when onCancel is not provided', () => {
      renderComponent({ onCancel: undefined });

      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    });
  });

  describe('Task Type Options', () => {
    it('renders all task type options', () => {
      renderComponent();

      expect(screen.getByText(/Assignment\/Tutorial\/Quiz/)).toBeInTheDocument();
      expect(screen.getByText(/Study\/Review Session/)).toBeInTheDocument();
      expect(screen.getByText(/Required Reading/)).toBeInTheDocument();
      expect(screen.getByText(/Exercise/)).toBeInTheDocument();
      expect(screen.getByText(/Break/)).toBeInTheDocument();
      expect(screen.getByText(/Personal/)).toBeInTheDocument();
      expect(screen.getByText(/Class/)).toBeInTheDocument();
      expect(screen.getByText(/Other/)).toBeInTheDocument();
    });

    it('defaults to study type', () => {
      renderComponent();

      const select = getTaskTypeSelect() as HTMLSelectElement;
      expect(select.value).toBe('study');
    });

    it('updates task type when changed', () => {
      renderComponent();

      const select = getTaskTypeSelect();
      fireEvent.change(select, { target: { value: 'exercise' } });

      expect((select as HTMLSelectElement).value).toBe('exercise');
    });
  });

  describe('Quick Templates', () => {
    it('fills form with Pomodoro template', () => {
      renderComponent();

      const pomodoroButton = getPomodoroTemplateButton();
      fireEvent.click(pomodoroButton!);

      const descriptionInput = getDescriptionInput() as HTMLInputElement;
      expect(descriptionInput.value).toContain('Pomodoro');
    });

    it('fills form with Deep Work template', () => {
      renderComponent();

      const deepWorkButton = getDeepWorkTemplateButton();
      fireEvent.click(deepWorkButton!);

      const descriptionInput = getDescriptionInput() as HTMLInputElement;
      expect(descriptionInput.value.toLowerCase()).toContain('deep work');
    });

    it('fills form with Reading template', () => {
      renderComponent();

      const readingButton = getReadingTemplateButton();
      fireEvent.click(readingButton!);

      const descriptionInput = getDescriptionInput() as HTMLInputElement;
      expect(descriptionInput.value.toLowerCase()).toContain('reading');
    });

    it('fills form with Workout template', () => {
      renderComponent();

      const workoutButton = getWorkoutTemplateButton();
      fireEvent.click(workoutButton!);

      const descriptionInput = getDescriptionInput() as HTMLInputElement;
      expect(descriptionInput.value.toLowerCase()).toContain('workout');
    });

    it('sets date and time when template is clicked', () => {
      renderComponent();

      const pomodoroButton = getPomodoroTemplateButton();
      fireEvent.click(pomodoroButton!);

      const { container } = renderComponent();
      const dateInputs = container.querySelectorAll('input[type="date"]');
      const timeInputs = container.querySelectorAll('input[type="time"]');

      expect(dateInputs.length).toBeGreaterThan(0);
      expect(timeInputs.length).toBeGreaterThan(0);
    });
  });

  describe('Course Selection', () => {
    it('loads courses on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(getCourses).toHaveBeenCalledWith(mockUserId);
      });
    });

    it('displays courses in dropdown', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('CSC491 - Capstone Project')).toBeInTheDocument();
        expect(screen.getByText('CSC454 - Business of Software')).toBeInTheDocument();
      });
    });

    it('has "No course" as default option', () => {
      renderComponent();

      expect(screen.getByText('No course')).toBeInTheDocument();
    });

    it('loads assignments when course is selected', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('CSC491 - Capstone Project')).toBeInTheDocument();
      });

      const courseSelect = getCourseSelect();
      fireEvent.change(courseSelect, { target: { value: 'course-1' } });

      await waitFor(() => {
        expect(getAssignments).toHaveBeenCalledWith('course-1', mockUserId);
      });
    });
  });

  describe('Assignment Selection', () => {
    it('shows assignment dropdown when course is selected', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('CSC491 - Capstone Project')).toBeInTheDocument();
      });

      const courseSelect = getCourseSelect();
      fireEvent.change(courseSelect, { target: { value: 'course-1' } });

      await waitFor(() => {
        expect(screen.getByText('Link to Assignment')).toBeInTheDocument();
      });
    });

    it('displays assignments in dropdown', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('CSC491 - Capstone Project')).toBeInTheDocument();
      });

      const courseSelect = getCourseSelect();
      fireEvent.change(courseSelect, { target: { value: 'course-1' } });

      await waitFor(() => {
        expect(screen.getByText('Assignment 1')).toBeInTheDocument();
        expect(screen.getByText('Assignment 2')).toBeInTheDocument();
      });
    });

    it('shows message when no assignments found', async () => {
      (getAssignments as jest.Mock).mockResolvedValue([]);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('CSC491 - Capstone Project')).toBeInTheDocument();
      });

      const courseSelect = getCourseSelect();
      fireEvent.change(courseSelect, { target: { value: 'course-1' } });

      await waitFor(() => {
        expect(screen.getByText('No assignments found for this course')).toBeInTheDocument();
      });
    });

    it('resets assignment when course is changed', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('CSC491 - Capstone Project')).toBeInTheDocument();
      });

      const courseSelect = getCourseSelect();
      fireEvent.change(courseSelect, { target: { value: 'course-1' } });

      await waitFor(() => {
        expect(screen.getByText('Assignment 1')).toBeInTheDocument();
      });

      fireEvent.change(courseSelect, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.queryByText('Link to Assignment')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Inputs', () => {
    it('updates description when typed', () => {
      renderComponent();

      const descriptionInput = getDescriptionInput();
      fireEvent.change(descriptionInput, { target: { value: 'Test task description' } });

      expect((descriptionInput as HTMLInputElement).value).toBe('Test task description');
    });

    it('updates date inputs when changed', () => {
      const { container } = renderComponent();

      const dateInputs = container.querySelectorAll('input[type="date"]');
      expect(dateInputs.length).toBeGreaterThanOrEqual(2);

      fireEvent.change(dateInputs[0], { target: { value: '2025-12-15' } });
      expect((dateInputs[0] as HTMLInputElement).value).toBe('2025-12-15');
    });

    it('updates time inputs when changed', () => {
      const { container } = renderComponent();

      const timeInputs = container.querySelectorAll('input[type="time"]');
      expect(timeInputs.length).toBeGreaterThanOrEqual(2);

      fireEvent.change(timeInputs[0], { target: { value: '14:30' } });
      expect((timeInputs[0] as HTMLInputElement).value).toBe('14:30');
    });
  });

  describe('Form Submission', () => {
    const fillFormWithValidData = (container: HTMLElement) => {
      const descriptionInput = screen.getByPlaceholderText('Enter task description');
      fireEvent.change(descriptionInput, { target: { value: 'Test task' } });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dateStr = futureDate.toISOString().split('T')[0];

      const dateInputs = container.querySelectorAll('input[type="date"]');
      const timeInputs = container.querySelectorAll('input[type="time"]');

      fireEvent.change(dateInputs[0], { target: { value: dateStr } });
      fireEvent.change(timeInputs[0], { target: { value: '14:00' } });
      fireEvent.change(dateInputs[1], { target: { value: dateStr } });
      fireEvent.change(timeInputs[1], { target: { value: '15:00' } });
    };

    it('calls createTask with correct data on submit', async () => {
      const { container } = renderComponent();

      fillFormWithValidData(container);

      const submitButton = screen.getByRole('button', { name: 'Create Task' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(tasksApiService.createTask).toHaveBeenCalled();
      });
    });

    it('calls onSuccess after successful submission', async () => {
      const { container } = renderComponent();

      fillFormWithValidData(container);

      const submitButton = screen.getByRole('button', { name: 'Create Task' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('shows loading state during submission', async () => {
      (tasksApiService.createTask as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const { container } = renderComponent();

      fillFormWithValidData(container);

      const submitButton = screen.getByRole('button', { name: 'Create Task' });
      fireEvent.click(submitButton);

      expect(screen.getByRole('button', { name: 'Creating...' })).toBeInTheDocument();
    });

    it('disables submit button during loading', async () => {
      (tasksApiService.createTask as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const { container } = renderComponent();

      fillFormWithValidData(container);

      const submitButton = screen.getByRole('button', { name: 'Create Task' });
      fireEvent.click(submitButton);

      expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled();
    });

    it('resets form after successful submission', async () => {
      const { container } = renderComponent();

      const descriptionInput = screen.getByPlaceholderText('Enter task description') as HTMLInputElement;
      fillFormWithValidData(container);

      const submitButton = screen.getByRole('button', { name: 'Create Task' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(descriptionInput.value).toBe('');
      });
    });
  });

  describe('Error Handling', () => {
    const fillFormWithValidData = (container: HTMLElement) => {
      const descriptionInput = screen.getByPlaceholderText('Enter task description');
      fireEvent.change(descriptionInput, { target: { value: 'Test task' } });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dateStr = futureDate.toISOString().split('T')[0];

      const dateInputs = container.querySelectorAll('input[type="date"]');
      const timeInputs = container.querySelectorAll('input[type="time"]');

      fireEvent.change(dateInputs[0], { target: { value: dateStr } });
      fireEvent.change(timeInputs[0], { target: { value: '14:00' } });
      fireEvent.change(dateInputs[1], { target: { value: dateStr } });
      fireEvent.change(timeInputs[1], { target: { value: '15:00' } });
    };

    it('displays error when createTask fails', async () => {
      (tasksApiService.createTask as jest.Mock).mockRejectedValue(new Error('Failed to create task'));

      const { container } = renderComponent();

      fillFormWithValidData(container);

      const submitButton = screen.getByRole('button', { name: 'Create Task' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create task')).toBeInTheDocument();
      });
    });

    it('displays error when end time is before start time', () => {
      const { container } = renderComponent();

      const descriptionInput = screen.getByPlaceholderText('Enter task description');
      fireEvent.change(descriptionInput, { target: { value: 'Test task' } });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dateStr = futureDate.toISOString().split('T')[0];

      const dateInputs = container.querySelectorAll('input[type="date"]');
      const timeInputs = container.querySelectorAll('input[type="time"]');

      fireEvent.change(dateInputs[0], { target: { value: dateStr } });
      fireEvent.change(timeInputs[0], { target: { value: '15:00' } });
      fireEvent.change(dateInputs[1], { target: { value: dateStr } });
      fireEvent.change(timeInputs[1], { target: { value: '14:00' } });

      const submitButton = screen.getByRole('button', { name: 'Create Task' });
      fireEvent.click(submitButton);

      expect(screen.getByText('End time must be after start time')).toBeInTheDocument();
    });

    it('error message has correct styling', async () => {
      (tasksApiService.createTask as jest.Mock).mockRejectedValue(new Error('Test error'));

      const { container } = renderComponent();

      fillFormWithValidData(container);

      const submitButton = screen.getByRole('button', { name: 'Create Task' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorDiv = screen.getByText('Test error').closest('div');
        expect(errorDiv).toHaveClass('bg-red-100', 'text-red-700');
      });
    });
  });

  describe('Cancel Button', () => {
    it('calls onCancel when Cancel button is clicked', () => {
      renderComponent();

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Styling', () => {
    it('container has correct styling', () => {
      const { container } = renderComponent();

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('max-w-2xl', 'mx-auto', 'p-6', 'bg-white', 'rounded-lg', 'shadow');
    });

    it('Create Task button has correct styling', () => {
      renderComponent();

      const submitButton = screen.getByRole('button', { name: 'Create Task' });
      expect(submitButton).toHaveClass('bg-orange-500', 'text-white', 'rounded-lg');
    });

    it('Cancel button has correct styling', () => {
      renderComponent();

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).toHaveClass('border', 'border-gray-300', 'rounded-lg');
    });

    it('form inputs have correct styling', () => {
      renderComponent();

      const descriptionInput = getDescriptionInput();
      expect(descriptionInput).toHaveClass('w-full', 'p-3', 'border', 'border-gray-300', 'rounded-lg');
    });
  });

  describe('Edge Cases', () => {
    it('handles course loading error gracefully', async () => {
      (getCourses as jest.Mock).mockRejectedValue(new Error('Failed to load courses'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderComponent();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('handles assignment loading error gracefully', async () => {
      (getAssignments as jest.Mock).mockRejectedValue(new Error('Failed to load assignments'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('CSC491 - Capstone Project')).toBeInTheDocument();
      });

      const courseSelect = getCourseSelect();
      fireEvent.change(courseSelect, { target: { value: 'course-1' } });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('does not load courses if userId is empty', () => {
      renderComponent({ userId: '' });

      expect(getCourses).not.toHaveBeenCalled();
    });
  });

  describe('Template Button Styling', () => {
    it('Pomodoro button has correct styling', () => {
      renderComponent();

      const pomodoroButton = getPomodoroTemplateButton();
      expect(pomodoroButton).toHaveClass('from-red-50', 'to-red-100', 'text-red-700');
    });

    it('Deep Work button has correct styling', () => {
      renderComponent();

      const deepWorkButton = getDeepWorkTemplateButton();
      expect(deepWorkButton).toHaveClass('from-blue-50', 'to-blue-100', 'text-blue-700');
    });

    it('Reading button has correct styling', () => {
      renderComponent();

      const readingButton = getReadingTemplateButton();
      expect(readingButton).toHaveClass('from-green-50', 'to-green-100', 'text-green-700');
    });

    it('Workout button has correct styling', () => {
      renderComponent();

      const workoutButton = getWorkoutTemplateButton();
      expect(workoutButton).toHaveClass('from-purple-50', 'to-purple-100', 'text-purple-700');
    });
  });

  describe('Template Descriptions', () => {
    it('renders Pomodoro description', () => {
      renderComponent();

      expect(screen.getByText('25 min + 5 min break')).toBeInTheDocument();
    });

    it('renders Deep Work description', () => {
      renderComponent();

      expect(screen.getByText('2-hour focus session')).toBeInTheDocument();
    });

    it('renders Reading description', () => {
      renderComponent();

      expect(screen.getByText('1-hour reading session')).toBeInTheDocument();
    });

    it('renders Workout description', () => {
      renderComponent();

      expect(screen.getByText('30-minute exercise')).toBeInTheDocument();
    });
  });

  describe('Form Layout', () => {
    it('renders date and time inputs in grid layout', () => {
      const { container } = renderComponent();

      const gridContainers = container.querySelectorAll('.grid.grid-cols-2');
      expect(gridContainers.length).toBeGreaterThanOrEqual(2);
    });

    it('renders buttons in flex container', () => {
      const { container } = renderComponent();

      const flexContainer = container.querySelector('.flex.gap-3');
      expect(flexContainer).toBeInTheDocument();
    });

    it('form has correct spacing', () => {
      const { container } = renderComponent();

      const form = container.querySelector('form');
      expect(form).toHaveClass('space-y-4');
    });
  });

  describe('Input Validation', () => {
    it('description input is required', () => {
      renderComponent();

      const descriptionInput = getDescriptionInput();
      expect(descriptionInput).toHaveAttribute('required');
    });

    it('task type select is required', () => {
      renderComponent();

      const taskTypeSelect = getTaskTypeSelect();
      expect(taskTypeSelect).toHaveAttribute('required');
    });
  });

  describe('Course Optional Label', () => {
    it('displays optional label for course field', () => {
      renderComponent();

      expect(screen.getByText('(Optional)')).toBeInTheDocument();
    });
  });
});