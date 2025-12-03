import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from './index';
import { User } from '../../api-contexts/user-context';

jest.mock('../../assets/paul_paw.png', () => 'paul_paw.png');
jest.mock('../../assets/canvas-sync.png', () => 'canvas-sync.png');

const mockUser: User = {
  user_id: 'test-user-123',
  canvas_username: 'TestUser',
  total_points: 1500,
  current_level: 5,
  profile_picture: 'https://example.com/profile.jpg',
};

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    const mockMainContent = {
      scrollTop: 0,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    jest.spyOn(document, 'getElementById').mockReturnValue(mockMainContent as unknown as HTMLElement);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderHeader = (user: User | null = mockUser) => {
    return render(<Header user={user} />);
  };

  describe('Loading State', () => {
    it('displays loading message when user is null', () => {
      renderHeader(null);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('does not display user information when loading', () => {
      renderHeader(null);

      expect(screen.queryByText('TestUser')).not.toBeInTheDocument();
    });
  });

  describe('User Information Display', () => {
    it('displays welcome message with username', () => {
      renderHeader();

      expect(screen.getByText('Welcome')).toBeInTheDocument();
      expect(screen.getAllByText('TestUser').length).toBeGreaterThan(0);
    });

    it('displays user total points', () => {
      renderHeader();

      expect(screen.getByText('1,500')).toBeInTheDocument();
    });

    it('displays coins label', () => {
      renderHeader();

      expect(screen.getByText('coins')).toBeInTheDocument();
    });

    it('displays coin emoji', () => {
      renderHeader();

      expect(screen.getByText('🪙')).toBeInTheDocument();
    });

    it('displays user profile picture', () => {
      renderHeader();

      const profileImg = screen.getByAltText('User Profile');
      expect(profileImg).toBeInTheDocument();
      expect(profileImg).toHaveAttribute('src', 'https://example.com/profile.jpg');
    });

    it('displays default profile picture when user has no profile picture', () => {
      const userWithoutPicture = { ...mockUser, profile_picture: '' };
      renderHeader(userWithoutPicture);

      const profileImg = screen.getByAltText('User Profile');
      expect(profileImg).toBeInTheDocument();
      expect(profileImg).toHaveAttribute('src', 'paul_paw.png');
    });

    it('displays motivational quote', () => {
      renderHeader();

      expect(screen.getByText('Success is the sum of small efforts repeated day in and day out.')).toBeInTheDocument();
    });
  });

  describe('Canvas Sync Status', () => {
    it('displays canvas sync icon', () => {
      renderHeader();

      const syncIcon = screen.getByAltText('Canvas Sync');
      expect(syncIcon).toBeInTheDocument();
    });

    it('shows tooltip on hover', () => {
      renderHeader();

      const syncContainer = screen.getByAltText('Canvas Sync').parentElement?.parentElement;
      
      if (syncContainer) {
        fireEvent.mouseEnter(syncContainer);
        expect(screen.getByText('Canvas synced successfully')).toBeInTheDocument();
      }
    });

    it('hides tooltip on mouse leave', () => {
      renderHeader();

      const syncContainer = screen.getByAltText('Canvas Sync').parentElement?.parentElement;
      
      if (syncContainer) {
        fireEvent.mouseEnter(syncContainer);
        expect(screen.getByText('Canvas synced successfully')).toBeInTheDocument();
        
        fireEvent.mouseLeave(syncContainer);
        expect(screen.queryByText('Canvas synced successfully')).not.toBeInTheDocument();
      }
    });
  });

  describe('Notifications', () => {
    it('displays notification bell button', () => {
      renderHeader();

      const bellButton = screen.getByLabelText('Notifications');
      expect(bellButton).toBeInTheDocument();
    });

    it('displays bell emoji', () => {
      renderHeader();

      expect(screen.getByText('🔔')).toBeInTheDocument();
    });

    it('displays unread notification indicator', () => {
      const { container } = renderHeader();

      const unreadIndicator = container.querySelector('.bg-red-500.rounded-full');
      expect(unreadIndicator).toBeInTheDocument();
    });

    it('opens notification dropdown when bell is clicked', () => {
      renderHeader();

      const bellButton = screen.getByLabelText('Notifications');
      fireEvent.click(bellButton);

      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('displays notification items when dropdown is open', () => {
      renderHeader();

      const bellButton = screen.getByLabelText('Notifications');
      fireEvent.click(bellButton);

      expect(screen.getByText('✅ Assignment Completed')).toBeInTheDocument();
      expect(screen.getByText('📝 New Assignment Added')).toBeInTheDocument();
      expect(screen.getByText('⏰ Deadline Updated')).toBeInTheDocument();
    });

    it('displays notification descriptions', () => {
      renderHeader();

      const bellButton = screen.getByLabelText('Notifications');
      fireEvent.click(bellButton);

      expect(screen.getByText('Canvas marked Assignment 0 for HPS246 as complete! Reward: 30 points')).toBeInTheDocument();
      expect(screen.getByText('Assignment 1 has been added for HPS246')).toBeInTheDocument();
    });

    it('displays notification timestamps', () => {
      renderHeader();

      const bellButton = screen.getByLabelText('Notifications');
      fireEvent.click(bellButton);

      expect(screen.getByText('0 min ago')).toBeInTheDocument();
      expect(screen.getByText('1 min ago')).toBeInTheDocument();
      expect(screen.getByText('2 min ago')).toBeInTheDocument();
    });

    it('displays view all notifications button', () => {
      renderHeader();

      const bellButton = screen.getByLabelText('Notifications');
      fireEvent.click(bellButton);

      expect(screen.getByText('View all notifications')).toBeInTheDocument();
    });

    it('closes notification dropdown when clicked again', () => {
      renderHeader();

      const bellButton = screen.getByLabelText('Notifications');
      
      fireEvent.click(bellButton);
      expect(screen.getByText('✅ Assignment Completed')).toBeInTheDocument();
      
      fireEvent.click(bellButton);
      expect(screen.queryByText('✅ Assignment Completed')).not.toBeInTheDocument();
    });
  });

  describe('Header Structure', () => {
    it('renders header element', () => {
      const { container } = renderHeader();

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('header has correct background classes', () => {
      const { container } = renderHeader();

      const header = container.querySelector('header');
      expect(header).toHaveClass('bg-gradient-to-br');
    });
  });

  describe('Points Formatting', () => {
    it('formats points with comma separators', () => {
      renderHeader();

      expect(screen.getByText('1,500')).toBeInTheDocument();
    });

    it('formats large point values correctly', () => {
      const userWithManyPoints = { ...mockUser, total_points: 1000000 };
      renderHeader(userWithManyPoints);

      expect(screen.getByText('1,000,000')).toBeInTheDocument();
    });

    it('displays zero points correctly', () => {
      const userWithZeroPoints = { ...mockUser, total_points: 0 };
      renderHeader(userWithZeroPoints);

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Scroll Behavior', () => {
    it('adds scroll event listener on mount', () => {
      const mockAddEventListener = jest.fn();
      const mockMainContent = {
        scrollTop: 0,
        addEventListener: mockAddEventListener,
        removeEventListener: jest.fn(),
      };
      jest.spyOn(document, 'getElementById').mockReturnValue(mockMainContent as unknown as HTMLElement);

      renderHeader();

      expect(mockAddEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    });

    it('removes scroll event listener on unmount', () => {
      const mockRemoveEventListener = jest.fn();
      const mockMainContent = {
        scrollTop: 0,
        addEventListener: jest.fn(),
        removeEventListener: mockRemoveEventListener,
      };
      jest.spyOn(document, 'getElementById').mockReturnValue(mockMainContent as unknown as HTMLElement);

      const { unmount } = renderHeader();
      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    });

    it('handles missing main-content element gracefully', () => {
      jest.spyOn(document, 'getElementById').mockReturnValue(null);

      expect(() => renderHeader()).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('notification button has aria-label', () => {
      renderHeader();

      const bellButton = screen.getByLabelText('Notifications');
      expect(bellButton).toHaveAttribute('aria-label', 'Notifications');
    });

    it('profile image has alt text', () => {
      renderHeader();

      const profileImg = screen.getByAltText('User Profile');
      expect(profileImg).toBeInTheDocument();
    });

    it('canvas sync icon has alt text', () => {
      renderHeader();

      const syncIcon = screen.getByAltText('Canvas Sync');
      expect(syncIcon).toBeInTheDocument();
    });
  });
});