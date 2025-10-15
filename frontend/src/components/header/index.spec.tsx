import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './index';
import { User } from '../../api-contexts/user-context';

// Mock the image imports
jest.mock('../../assets/paul_paw.png', () => 'mocked-paul-image.png');

// Mock getElementById to simulate main-content element
const mockMainContent = {
  scrollTop: 0,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

Object.defineProperty(document, 'getElementById', {
  value: jest.fn().mockReturnValue(mockMainContent),
  writable: true
});

describe('Header Component', () => {
  // Mock user data
  const mockUser: User = {
    user_id: 'test-user-1',
    canvas_username: 'TestUser',
    total_points: 1250,
    current_level: 5
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMainContent.scrollTop = 0;
  });

  describe('Loading State', () => {
    test('renders loading state when user is null', () => {
      render(<Header user={null} />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText(/Welcome back/)).not.toBeInTheDocument();
    });

    test('applies correct styling for loading state', () => {
      render(<Header user={null} />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('bg-gradient-to-br', 'from-rose-100', 'via-amber-50', 'to-amber-100');
    });
  });

  describe('User Data Display', () => {
    test('renders welcome message with username when not compact', () => {
      render(<Header user={mockUser} />);
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome back, TestUser!');
    });

    test('displays motivational quote', () => {
      render(<Header user={mockUser} />);
      
      expect(screen.getByText(/Success is the sum of small efforts/)).toBeInTheDocument();
    });

    test('shows formatted coin count', () => {
      render(<Header user={mockUser} />);
      
      expect(screen.getByText('🪙')).toBeInTheDocument();
      expect(screen.getByText('1,250')).toBeInTheDocument();
      expect(screen.getByText('coins')).toBeInTheDocument();
    });

    test('displays large coin count with proper formatting', () => {
      const userWithLargePoints: User = {
        ...mockUser,
        total_points: 1234567
      };
      
      render(<Header user={userWithLargePoints} />);
      
      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });

    test('handles zero points correctly', () => {
      const userWithZeroPoints: User = {
        ...mockUser,
        total_points: 0
      };
      
      render(<Header user={userWithZeroPoints} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    test('shows username in compact mode container initially hidden', () => {
      render(<Header user={mockUser} />);
      
      // Get the compact mode heading (h2) specifically
      const compactHeading = screen.getByRole('heading', { level: 2 });
      expect(compactHeading).toHaveTextContent('TestUser');
      
      // Check that the compact mode container is initially hidden
      const compactContainer = compactHeading.closest('div');
      expect(compactContainer).toHaveClass('opacity-0', 'max-w-0');
    });
  });

  describe('Profile Image', () => {
    test('renders profile image with correct attributes', () => {
      render(<Header user={mockUser} />);
      
      const profileImage = screen.getByAltText('User Profile');
      expect(profileImage).toBeInTheDocument();
      expect(profileImage).toHaveClass('w-full', 'h-full', 'object-cover');
      expect(profileImage).toHaveAttribute('src', 'mocked-paul-image.png');
    });

    test('profile image container has correct initial styling', () => {
      render(<Header user={mockUser} />);
      
      const imageContainer = screen.getByAltText('User Profile').parentElement;
      expect(imageContainer).toHaveClass('rounded-full', 'overflow-hidden', 'border-2', 'border-white');
      expect(imageContainer).toHaveClass('w-12', 'h-12', 'sm:w-14', 'sm:h-14'); // Normal size initially
    });
  });

  describe('Compact Mode Behavior', () => {
    test('applies correct styling classes in normal mode', () => {
      render(<Header user={mockUser} />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('py-4', 'px-4'); // Normal padding
    });

    test('welcome message is visible in normal mode', () => {
      render(<Header user={mockUser} />);
      
      const welcomeContainer = screen.getByText(/Welcome back/).closest('div');
      expect(welcomeContainer).toHaveClass('max-h-20', 'opacity-100');
    });

    test('compact name container is hidden in normal mode', () => {
      render(<Header user={mockUser} />);
      
      const compactHeading = screen.getByRole('heading', { level: 2 });
      const compactContainer = compactHeading.closest('div');
      expect(compactContainer).toHaveClass('opacity-0', 'max-w-0');
    });

    test('motivational quote hides on small screens', () => {
      render(<Header user={mockUser} />);
      
      const quote = screen.getByText(/Success is the sum of small efforts/);
      expect(quote).toHaveClass('hidden', 'min-[400px]:block');
    });
  });

  describe('Notification Functionality', () => {
    test('renders notification bell button', () => {
      render(<Header user={mockUser} />);
      
      const notificationButton = screen.getByLabelText('Notifications');
      expect(notificationButton).toBeInTheDocument();
      expect(screen.getByText('🔔')).toBeInTheDocument();
    });

    test('shows unread notification indicator', () => {
      render(<Header user={mockUser} />);
      
      const unreadIndicator = document.querySelector('.bg-red-500');
      expect(unreadIndicator).toBeInTheDocument();
      expect(unreadIndicator).toHaveClass('rounded-full', 'border', 'border-white');
    });

    test('initially hides notification dropdown', () => {
      render(<Header user={mockUser} />);
      
      expect(screen.queryByText('100 coins awarded')).not.toBeInTheDocument();
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    });

    test('shows notification dropdown when bell is clicked', () => {
      render(<Header user={mockUser} />);
      
      const notificationButton = screen.getByLabelText('Notifications');
      fireEvent.click(notificationButton);
      
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('100 coins awarded')).toBeInTheDocument();
      expect(screen.getByText('🏆 Achievement Unlocked!')).toBeInTheDocument();
      expect(screen.getByText('⏰ Task Due Soon')).toBeInTheDocument();
    });

    test('hides notification dropdown when bell is clicked again', () => {
      render(<Header user={mockUser} />);
      
      const notificationButton = screen.getByLabelText('Notifications');
      
      // Open dropdown
      fireEvent.click(notificationButton);
      expect(screen.getByText('100 coins awarded')).toBeInTheDocument();
      
      // Close dropdown
      fireEvent.click(notificationButton);
      expect(screen.queryByText('100 coins awarded')).not.toBeInTheDocument();
    });

    test('renders all notification items with correct content', () => {
      render(<Header user={mockUser} />);
      
      fireEvent.click(screen.getByLabelText('Notifications'));
      
      // Check all notifications
      expect(screen.getByText('100 coins awarded')).toBeInTheDocument();
      expect(screen.getByText('Task "Complete project proposal" finished!')).toBeInTheDocument();
      expect(screen.getByText('2h ago')).toBeInTheDocument();
      
      expect(screen.getByText('🏆 Achievement Unlocked!')).toBeInTheDocument();
      expect(screen.getByText('Completed 10 tasks in a row')).toBeInTheDocument();
      expect(screen.getByText('5h ago')).toBeInTheDocument();
      
      expect(screen.getByText('⏰ Task Due Soon')).toBeInTheDocument();
      expect(screen.getByText('Review client feedback - Due in 2 hours')).toBeInTheDocument();
      expect(screen.getByText('1d ago')).toBeInTheDocument();
    });

    test('applies correct styling for unread notifications', () => {
      render(<Header user={mockUser} />);
      
      fireEvent.click(screen.getByLabelText('Notifications'));
      
      // Find the first notification (unread)
      const firstNotificationTitle = screen.getByText('100 coins awarded');
      const firstNotification = firstNotificationTitle.closest('[class*="px-4"][class*="py-3"]');
      expect(firstNotification).toHaveClass('bg-blue-50');
      
      // Third notification should not have blue background (read)
      const thirdNotificationTitle = screen.getByText('⏰ Task Due Soon');
      const thirdNotification = thirdNotificationTitle.closest('[class*="px-4"][class*="py-3"]');
      expect(thirdNotification).not.toHaveClass('bg-blue-50');
    });

    test('shows unread indicators for unread notifications', () => {
        render(<Header user={mockUser} />);
        
        fireEvent.click(screen.getByLabelText('Notifications'));
        
        // Should have unread indicators (blue dots) - only in notification items
        const unreadIndicators = document.querySelectorAll('.bg-blue-500.rounded-full');
        expect(unreadIndicators.length).toBe(2); // Two unread notifications only
    });

    test('renders "View all notifications" button', () => {
      render(<Header user={mockUser} />);
      
      fireEvent.click(screen.getByLabelText('Notifications'));
      
      const viewAllButton = screen.getByText('View all notifications');
      expect(viewAllButton).toBeInTheDocument();
      expect(viewAllButton).toHaveClass('text-orange-600');
    });

    test('notification dropdown has correct styling', () => {
      render(<Header user={mockUser} />);
      
      fireEvent.click(screen.getByLabelText('Notifications'));
      
      const dropdown = screen.getByText('Notifications').closest('.absolute');
      expect(dropdown).toHaveClass('right-0', 'w-72', 'sm:w-80', 'bg-white', 'rounded-xl', 'shadow-xl');
      
      // Check header styling
      const header = screen.getByText('Notifications').closest('.bg-gradient-to-r');
      expect(header).toHaveClass('from-orange-500', 'to-yellow-500');
    });
  });

  describe('Responsive Design', () => {
    test('applies responsive classes for layout', () => {
      render(<Header user={mockUser} />);
      
      // Check responsive classes on right side container
      const rightContainer = screen.getByText('🪙').closest('.flex-col');
      expect(rightContainer).toHaveClass('min-[400px]:flex-row');
    });

    test('coin counter hides "coins" text on small screens', () => {
      render(<Header user={mockUser} />);
      
      const coinsText = screen.getByText('coins');
      expect(coinsText).toHaveClass('hidden', 'sm:inline');
    });

    test('notification dropdown has responsive width', () => {
      render(<Header user={mockUser} />);
      
      fireEvent.click(screen.getByLabelText('Notifications'));
      
      const dropdown = screen.getByText('Notifications').closest('.absolute');
      expect(dropdown).toHaveClass('w-72', 'sm:w-80');
    });

    test('profile image has responsive sizing', () => {
      render(<Header user={mockUser} />);
      
      const imageContainer = screen.getByAltText('User Profile').parentElement;
      expect(imageContainer).toHaveClass('w-12', 'h-12', 'sm:w-14', 'sm:h-14');
    });
  });

  describe('Scroll Behavior', () => {
  beforeEach(() => {
    // Ensure the mock is properly set up for each test
    document.getElementById = jest.fn().mockReturnValue(mockMainContent);
    mockMainContent.addEventListener.mockClear();
    mockMainContent.removeEventListener.mockClear();
  });

  test('sets up scroll event listener on mount', () => {
    render(<Header user={mockUser} />);
    
    expect(document.getElementById).toHaveBeenCalledWith('main-content');
    expect(mockMainContent.addEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      { passive: true }
    );
  });

  test('removes scroll event listener on unmount', () => {
    const { unmount } = render(<Header user={mockUser} />);
    
    // Verify addEventListener was called first
    expect(mockMainContent.addEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      { passive: true }
    );
    
    unmount();
    
    expect(mockMainContent.removeEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    );
  });

  test('handles case when main-content element is not found', () => {
    // Mock getElementById to return null
    document.getElementById = jest.fn().mockReturnValue(null);
    
    expect(() => render(<Header user={mockUser} />)).not.toThrow();
    
    // Should not call addEventListener if element not found
    expect(mockMainContent.addEventListener).not.toHaveBeenCalled();
  });

  test('calls handleScroll on initial render', () => {
    render(<Header user={mockUser} />);
    
    // The component calls handleScroll() initially, so addEventListener should be called
    expect(mockMainContent.addEventListener).toHaveBeenCalled();
  });
});

  describe('Accessibility', () => {
    test('has proper heading structure', () => {
      render(<Header user={mockUser} />);
      
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      expect(h1).toHaveTextContent(/Welcome back.*TestUser/);
      
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toBeInTheDocument();
      expect(h2).toHaveTextContent('TestUser');
    });

    test('notification button has proper aria-label', () => {
      render(<Header user={mockUser} />);
      
      const button = screen.getByLabelText('Notifications');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Notifications');
    });

    test('profile image has proper alt text', () => {
      render(<Header user={mockUser} />);
      
      const image = screen.getByAltText('User Profile');
      expect(image).toBeInTheDocument();
    });

    test('header has proper semantic role', () => {
      render(<Header user={mockUser} />);
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Interactive Elements', () => {
    test('notification button has hover effect classes', () => {
      render(<Header user={mockUser} />);
      
      const button = screen.getByLabelText('Notifications');
      expect(button).toHaveClass('hover:bg-opacity-90', 'transition-all', 'duration-300');
    });

    test('notification items have hover effect classes', () => {
      render(<Header user={mockUser} />);
      
      fireEvent.click(screen.getByLabelText('Notifications'));
      
      const notificationTitle = screen.getByText('100 coins awarded');
      const notificationItem = notificationTitle.closest('[class*="px-4"][class*="py-3"]');
      expect(notificationItem).toHaveClass('hover:bg-gray-50', 'transition-colors');
    });

    test('view all notifications button has hover effect', () => {
      render(<Header user={mockUser} />);
      
      fireEvent.click(screen.getByLabelText('Notifications'));
      
      const viewAllButton = screen.getByText('View all notifications');
      expect(viewAllButton).toHaveClass('hover:underline');
    });
  });

  describe('Styling and Layout', () => {
    test('applies correct header background gradient', () => {
      render(<Header user={mockUser} />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass(
        'bg-gradient-to-br',
        'from-rose-100',
        'via-amber-50',
        'to-amber-100'
      );
    });

    test('coin counter has correct styling', () => {
      render(<Header user={mockUser} />);
      
      const coinContainer = screen.getByText('🪙').closest('.flex');
      expect(coinContainer).toHaveClass(
        'bg-white',
        'bg-opacity-70',
        'backdrop-blur-sm',
        'rounded-full',
        'shadow-sm',
        'border',
        'border-yellow-200'
      );
    });

    test('profile image container has border and shadow', () => {
      render(<Header user={mockUser} />);
      
      const imageContainer = screen.getByAltText('User Profile').parentElement;
      expect(imageContainer).toHaveClass('border-2', 'border-white', 'shadow-md');
    });

    test('applies transition classes for smooth animations', () => {
      render(<Header user={mockUser} />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('transition-all', 'duration-300');
    });
  });

  describe('Username Highlighting', () => {
    test('username has orange color styling in welcome message', () => {
      render(<Header user={mockUser} />);
      
      const welcomeMessage = screen.getByRole('heading', { level: 1 });
      const usernameSpan = welcomeMessage.querySelector('.text-orange-600');
      expect(usernameSpan).toHaveTextContent('TestUser');
    });

    test('username has orange color styling in compact mode', () => {
      render(<Header user={mockUser} />);
      
      const compactHeading = screen.getByRole('heading', { level: 2 });
      const usernameSpan = compactHeading.querySelector('.text-orange-600');
      expect(usernameSpan).toHaveTextContent('TestUser');
    });

    test('handles long usernames without breaking layout', () => {
      const userWithLongName: User = {
        ...mockUser,
        canvas_username: 'VeryLongUsernameThatsReallyLong'
      };
      
      render(<Header user={userWithLongName} />);
      
      const longUsernames = screen.getAllByText('VeryLongUsernameThatsReallyLong');
      longUsernames.forEach(element => {
        expect(element).toHaveClass('text-orange-600');
      });
      
      // Check truncation classes
      const welcomeHeading = screen.getByRole('heading', { level: 1 });
      expect(welcomeHeading).toHaveClass('truncate');
      
      const compactHeading = screen.getByRole('heading', { level: 2 });
      expect(compactHeading).toHaveClass('truncate');
    });
  });

  describe('Size Responsiveness', () => {
    test('applies correct responsive size classes', () => {
      render(<Header user={mockUser} />);
      
      // Check coin counter responsive sizing
      const coinContainer = screen.getByText('🪙').closest('.flex');
      expect(coinContainer).toHaveClass('px-2.5', 'py-1', 'sm:px-3', 'sm:py-1.5');
      
      // Check notification bell responsive sizing
      const notificationButton = screen.getByLabelText('Notifications');
      expect(notificationButton).toHaveClass('w-8', 'h-8', 'sm:w-9', 'sm:h-9');
    });

    test('coin emoji has responsive sizing', () => {
      render(<Header user={mockUser} />);
      
      const coinEmoji = screen.getByText('🪙');
      expect(coinEmoji).toHaveClass('text-lg', 'sm:text-xl');
    });

    test('notification bell emoji has responsive sizing', () => {
      render(<Header user={mockUser} />);
      
      const bellEmoji = screen.getByText('🔔');
      expect(bellEmoji).toHaveClass('text-base', 'sm:text-lg');
    });
  });
});