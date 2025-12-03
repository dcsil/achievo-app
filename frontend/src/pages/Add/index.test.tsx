import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddPage } from './index';
import { apiService } from '../../api-contexts/user-context';

jest.mock('../../components/task-add', () => ({
  AddTaskComponent: ({ userId, onSuccess }: { userId: string; onSuccess: () => void }) => (
    <div data-testid="add-task-component">
      <span>AddTaskComponent - userId: {userId}</span>
      <button onClick={onSuccess}>Trigger Task Success</button>
    </div>
  ),
}));

jest.mock('../../components/assignment-add', () => ({
  AddAssignmentComponent: ({ userId, onSuccess }: { userId: string; onSuccess: () => void }) => (
    <div data-testid="add-assignment-component">
      <span>AddAssignmentComponent - userId: {userId}</span>
      <button onClick={onSuccess}>Trigger Assignment Success</button>
    </div>
  ),
}));

jest.mock('../../api-contexts/user-context', () => ({
  apiService: {
    getUser: jest.fn(),
  },
}));

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockUser = {
  user_id: 'test-user-123',
  canvas_username: 'TestUser',
  total_points: 1500,
  current_level: 5,
  profile_picture: 'https://example.com/profile.jpg',
};

describe('AddPage', () => {
  const defaultProps = {
    userId: 'test-user-123',
    user: mockUser,
    updateUserPoints: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (apiService.getUser as jest.Mock).mockResolvedValue(mockUser);
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderComponent = (props = {}) => {
    return render(<AddPage {...defaultProps} {...props} />);
  };

  describe('Rendering', () => {
    it('renders page title', () => {
      renderComponent();

      expect(screen.getByText(/Add Item/)).toBeInTheDocument();
    });

    it('renders page description', () => {
      renderComponent();

      expect(screen.getByText('Create a New Task or Assignment!')).toBeInTheDocument();
    });

    it('renders Add Task toggle button', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: 'Add Task' })).toBeInTheDocument();
    });

    it('renders Add Assignment toggle button', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: 'Add Assignment' })).toBeInTheDocument();
    });

    it('renders AddTaskComponent by default', () => {
      renderComponent();

      expect(screen.getByTestId('add-task-component')).toBeInTheDocument();
    });

    it('does not render AddAssignmentComponent by default', () => {
      renderComponent();

      expect(screen.queryByTestId('add-assignment-component')).not.toBeInTheDocument();
    });

    it('passes userId to AddTaskComponent', () => {
      renderComponent();

      expect(screen.getByText('AddTaskComponent - userId: test-user-123')).toBeInTheDocument();
    });
  });

  describe('View Mode Toggle', () => {
    it('switches to assignment view when Add Assignment button is clicked', () => {
      renderComponent();

      const assignmentButton = screen.getByRole('button', { name: 'Add Assignment' });
      fireEvent.click(assignmentButton);

      expect(screen.getByTestId('add-assignment-component')).toBeInTheDocument();
      expect(screen.queryByTestId('add-task-component')).not.toBeInTheDocument();
    });

    it('switches back to task view when Add Task button is clicked', () => {
      renderComponent();

      // Switch to assignment view
      const assignmentButton = screen.getByRole('button', { name: 'Add Assignment' });
      fireEvent.click(assignmentButton);

      // Switch back to task view
      const taskButton = screen.getByRole('button', { name: 'Add Task' });
      fireEvent.click(taskButton);

      expect(screen.getByTestId('add-task-component')).toBeInTheDocument();
      expect(screen.queryByTestId('add-assignment-component')).not.toBeInTheDocument();
    });

    it('passes userId to AddAssignmentComponent', () => {
      renderComponent();

      const assignmentButton = screen.getByRole('button', { name: 'Add Assignment' });
      fireEvent.click(assignmentButton);

      expect(screen.getByText('AddAssignmentComponent - userId: test-user-123')).toBeInTheDocument();
    });
  });

  describe('Toggle Button Styling', () => {
    it('Add Task button has active styling when task view is selected', () => {
      renderComponent();

      const taskButton = screen.getByRole('button', { name: 'Add Task' });
      expect(taskButton).toHaveClass('bg-orange-500', 'text-white');
    });

    it('Add Assignment button has inactive styling when task view is selected', () => {
      renderComponent();

      const assignmentButton = screen.getByRole('button', { name: 'Add Assignment' });
      expect(assignmentButton).toHaveClass('text-gray-700');
      expect(assignmentButton).not.toHaveClass('bg-orange-500');
    });

    it('Add Assignment button has active styling when assignment view is selected', () => {
      renderComponent();

      const assignmentButton = screen.getByRole('button', { name: 'Add Assignment' });
      fireEvent.click(assignmentButton);

      expect(assignmentButton).toHaveClass('bg-orange-500', 'text-white');
    });

    it('Add Task button has inactive styling when assignment view is selected', () => {
      renderComponent();

      const assignmentButton = screen.getByRole('button', { name: 'Add Assignment' });
      fireEvent.click(assignmentButton);

      const taskButton = screen.getByRole('button', { name: 'Add Task' });
      expect(taskButton).toHaveClass('text-gray-700');
      expect(taskButton).not.toHaveClass('bg-orange-500');
    });
  });

  describe('Success Message', () => {
    it('shows success message for task when onSuccess is called', () => {
      renderComponent();

      const successButton = screen.getByRole('button', { name: 'Trigger Task Success' });
      fireEvent.click(successButton);

      expect(screen.getByText('Task created successfully!')).toBeInTheDocument();
    });

    it('shows success message for assignment when onSuccess is called', () => {
      renderComponent();

      // Switch to assignment view
      const assignmentButton = screen.getByRole('button', { name: 'Add Assignment' });
      fireEvent.click(assignmentButton);

      const successButton = screen.getByRole('button', { name: 'Trigger Assignment Success' });
      fireEvent.click(successButton);

      expect(screen.getByText('Assignment created successfully!')).toBeInTheDocument();
    });

    it('success message disappears after 3 seconds', async () => {
      renderComponent();

      const successButton = screen.getByRole('button', { name: 'Trigger Task Success' });
      fireEvent.click(successButton);

      expect(screen.getByText('Task created successfully!')).toBeInTheDocument();

      // Fast-forward 3 seconds
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.queryByText('Task created successfully!')).not.toBeInTheDocument();
      });
    });

    it('success message has correct styling', () => {
      renderComponent();

      const successButton = screen.getByRole('button', { name: 'Trigger Task Success' });
      fireEvent.click(successButton);

      const successMessage = screen.getByText('Task created successfully!').closest('div')?.parentElement;
      expect(successMessage).toHaveClass('bg-green-100', 'text-green-800', 'border-green-300');
    });

    it('success message contains check icon', () => {
      renderComponent();

      const successButton = screen.getByRole('button', { name: 'Trigger Task Success' });
      fireEvent.click(successButton);

      const svg = screen.getByText('Task created successfully!').closest('div')?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('User Not Found State', () => {
    it('shows user not found message when userId is not provided', () => {
      renderComponent({ userId: undefined });

      expect(screen.getByText('User Not Found')).toBeInTheDocument();
      expect(screen.getByText('Please log in to continue')).toBeInTheDocument();
    });

    it('does not render toggle buttons when userId is not provided', () => {
      renderComponent({ userId: undefined });

      expect(screen.queryByRole('button', { name: 'Add Task' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Add Assignment' })).not.toBeInTheDocument();
    });

    it('does not render AddTaskComponent when userId is not provided', () => {
      renderComponent({ userId: undefined });

      expect(screen.queryByTestId('add-task-component')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading state when fetching user without props', async () => {
      localStorageMock.getItem.mockReturnValue('stored-user-id');
      (apiService.getUser as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockUser), 100))
      );

      render(<AddPage userId={undefined} user={undefined} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('User State Management', () => {
    it('updates local user state when propUser changes', () => {
      const { rerender } = render(<AddPage {...defaultProps} />);

      const updatedUser = { ...mockUser, total_points: 2000 };
      rerender(<AddPage {...defaultProps} user={updatedUser} />);

      // Component should accept the new user without errors
      expect(screen.getByTestId('add-task-component')).toBeInTheDocument();
    });

    it('fetches user from localStorage when no props provided', async () => {
      localStorageMock.getItem.mockReturnValue('stored-user-id');

      render(<AddPage userId={undefined} user={undefined} />);

      await waitFor(() => {
        expect(apiService.getUser).toHaveBeenCalledWith('stored-user-id');
      });
    });

    it('does not fetch user when userId prop is provided', () => {
      renderComponent();

      expect(apiService.getUser).not.toHaveBeenCalled();
    });

    it('does not fetch user when user prop is provided', () => {
      renderComponent({ userId: undefined, user: mockUser });

      expect(apiService.getUser).not.toHaveBeenCalled();
    });

    it('handles user fetch error gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('stored-user-id');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (apiService.getUser as jest.Mock).mockRejectedValue(new Error('Failed to fetch user'));

      render(<AddPage userId={undefined} user={undefined} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Page Styling', () => {
    it('page has correct background', () => {
      const { container } = renderComponent();

      const pageContainer = container.firstChild;
      expect(pageContainer).toHaveClass('min-h-screen', 'bg-gray-50', 'py-8');
    });

    it('content container has correct max width', () => {
      const { container } = renderComponent();

      const contentContainer = container.querySelector('.max-w-4xl');
      expect(contentContainer).toBeInTheDocument();
    });

    it('toggle buttons container has correct styling', () => {
      const { container } = renderComponent();

      const toggleContainer = container.querySelector('.inline-flex.rounded-lg.border');
      expect(toggleContainer).toHaveClass('border-gray-300', 'bg-white', 'shadow-sm');
    });

    it('header has correct styling', () => {
      renderComponent();

      const header = screen.getByText(/Add Item/);
      expect(header).toHaveClass('text-3xl', 'font-bold', 'text-gray-800');
    });

    it('description has correct styling', () => {
      renderComponent();

      const description = screen.getByText('Create a New Task or Assignment!');
      expect(description).toHaveClass('text-gray-600');
    });
  });

  describe('Component Integration', () => {
    it('AddTaskComponent receives onSuccess callback', () => {
      renderComponent();

      // Verify the success button from mock component exists
      expect(screen.getByRole('button', { name: 'Trigger Task Success' })).toBeInTheDocument();
    });

    it('AddAssignmentComponent receives onSuccess callback', () => {
      renderComponent();

      const assignmentButton = screen.getByRole('button', { name: 'Add Assignment' });
      fireEvent.click(assignmentButton);

      expect(screen.getByRole('button', { name: 'Trigger Assignment Success' })).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('renders header section', () => {
      const { container } = renderComponent();

      const headerSection = container.querySelector('.max-w-2xl.mx-auto.mb-6');
      expect(headerSection).toBeInTheDocument();
    });

    it('renders toggle section', () => {
      renderComponent();

      const toggleButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent === 'Add Task' || btn.textContent === 'Add Assignment'
      );
      expect(toggleButtons.length).toBe(2);
    });

    it('renders component section', () => {
      const { container } = renderComponent();

      const componentSection = container.querySelectorAll('.max-w-2xl.mx-auto');
      expect(componentSection.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Accessibility', () => {
    it('toggle buttons are accessible', () => {
      renderComponent();

      const taskButton = screen.getByRole('button', { name: 'Add Task' });
      const assignmentButton = screen.getByRole('button', { name: 'Add Assignment' });

      expect(taskButton).toBeEnabled();
      expect(assignmentButton).toBeEnabled();
    });

    it('page has proper heading hierarchy', () => {
      renderComponent();

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/Add Item/);
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid toggle switching', () => {
      renderComponent();

      const taskButton = screen.getByRole('button', { name: 'Add Task' });
      const assignmentButton = screen.getByRole('button', { name: 'Add Assignment' });

      // Rapidly switch between views
      fireEvent.click(assignmentButton);
      fireEvent.click(taskButton);
      fireEvent.click(assignmentButton);
      fireEvent.click(taskButton);

      expect(screen.getByTestId('add-task-component')).toBeInTheDocument();
    });

    it('handles multiple success triggers', () => {
      renderComponent();

      const successButton = screen.getByRole('button', { name: 'Trigger Task Success' });
      
      fireEvent.click(successButton);
      fireEvent.click(successButton);
      fireEvent.click(successButton);

      // Should still show success message
      expect(screen.getByText('Task created successfully!')).toBeInTheDocument();
    });

    it('handles empty userId string', () => {
      renderComponent({ userId: '' });

      expect(screen.getByText('User Not Found')).toBeInTheDocument();
    });
  });

  describe('User Not Found Styling', () => {
    it('user not found container has correct styling', () => {
      const { container } = renderComponent({ userId: undefined });

      const notFoundContainer = container.firstChild;
      expect(notFoundContainer).toHaveClass('min-h-screen', 'bg-gray-50', 'flex', 'items-center', 'justify-center');
    });

    it('user not found heading has correct styling', () => {
      renderComponent({ userId: undefined });

      const heading = screen.getByText('User Not Found');
      expect(heading).toHaveClass('text-xl', 'font-semibold', 'text-gray-900');
    });

    it('user not found message has correct styling', () => {
      renderComponent({ userId: undefined });

      const message = screen.getByText('Please log in to continue');
      expect(message).toHaveClass('text-gray-600');
    });
  });

  describe('Loading State Styling', () => {
    it('loading container has correct styling', async () => {
      localStorageMock.getItem.mockReturnValue('stored-user-id');
      (apiService.getUser as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockUser), 100))
      );

      const { container } = render(<AddPage userId={undefined} user={undefined} />);

      const loadingContainer = container.firstChild;
      expect(loadingContainer).toHaveClass('min-h-screen', 'bg-gray-50', 'flex', 'items-center', 'justify-center');
    });

    it('loading text has correct styling', async () => {
      localStorageMock.getItem.mockReturnValue('stored-user-id');
      (apiService.getUser as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockUser), 100))
      );

      render(<AddPage userId={undefined} user={undefined} />);

      const loadingText = screen.getByText('Loading...');
      expect(loadingText).toHaveClass('text-gray-600');
    });
  });
});