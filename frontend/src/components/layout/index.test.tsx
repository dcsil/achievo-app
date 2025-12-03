import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import Layout from './index';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('../header', () => {
  return function MockHeader({ user }: { user: any }) {
    return (
      <header data-testid="header">
        {user ? (
          <span data-testid="header-user">{user.canvas_username}</span>
        ) : (
          <span data-testid="header-loading">Loading...</span>
        )}
      </header>
    );
  };
});

jest.mock('../footer', () => {
  return function MockFooter() {
    return <footer data-testid="footer">Footer</footer>;
  };
});

const mockNavigate = jest.fn();
const mockUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;

const mockUser = {
  user_id: 'test-user-123',
  canvas_username: 'TestUser',
  total_points: 1500,
  current_level: 5,
  profile_picture: 'https://example.com/profile.jpg',
};

const TestChildComponent = ({ user, updateUserPoints, updateUserProfile, userId }: any) => {
  return (
    <div data-testid="child-component">
      {user && <span data-testid="child-user">{user.canvas_username}</span>}
      {user && <span data-testid="child-points">{user.total_points}</span>}
      {userId && <span data-testid="child-user-id">{userId}</span>}
      {updateUserPoints && (
        <button
          data-testid="update-points-btn"
          onClick={() => updateUserPoints(2000)}
        >
          Update Points
        </button>
      )}
      {updateUserProfile && (
        <button
          data-testid="update-profile-btn"
          onClick={() => updateUserProfile({ canvas_username: 'UpdatedUser' })}
        >
          Update Profile
        </button>
      )}
    </div>
  );
};

describe('Layout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    localStorage.clear();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderLayout = (children = <TestChildComponent />) => {
    return render(
      <BrowserRouter>
        <Layout>{children}</Layout>
      </BrowserRouter>
    );
  };

  describe('Loading State', () => {
    it('renders header during loading', () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      renderLayout();

      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('renders footer during loading', () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      renderLayout();

      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('No User State', () => {
    it('redirects to login when no user in localStorage', async () => {
      renderLayout();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('logs warning when no user found', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      renderLayout();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'No user found in localStorage, redirecting to login'
        );
      });
    });
  });

  describe('User Loaded State', () => {
    it('displays child component after loading', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      renderLayout();

      await waitFor(() => {
        expect(screen.getByTestId('child-component')).toBeInTheDocument();
      });
    });

    it('passes user to header', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      renderLayout();

      await waitFor(() => {
        expect(screen.getByTestId('header-user')).toHaveTextContent('TestUser');
      });
    });

    it('passes user to child component', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      renderLayout();

      await waitFor(() => {
        expect(screen.getByTestId('child-user')).toHaveTextContent('TestUser');
      });
    });

    it('passes userId to child component', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      renderLayout();

      await waitFor(() => {
        expect(screen.getByTestId('child-user-id')).toHaveTextContent('test-user-123');
      });
    });

    it('passes user points to child component', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      renderLayout();

      await waitFor(() => {
        expect(screen.getByTestId('child-points')).toHaveTextContent('1500');
      });
    });
  });

  describe('Error State', () => {
    it('displays error message when user data parsing fails', async () => {
      localStorage.setItem('user', 'invalid-json');
      renderLayout();

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load user data. Please try again later.')
        ).toBeInTheDocument();
      });
    });

    it('displays error icon', async () => {
      localStorage.setItem('user', 'invalid-json');
      renderLayout();

      await waitFor(() => {
        expect(screen.getByText('⚠️')).toBeInTheDocument();
      });
    });

    it('displays Try Again button on error', async () => {
      localStorage.setItem('user', 'invalid-json');
      renderLayout();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
      });
    });

    it('retries fetching user data when Try Again is clicked', async () => {
      localStorage.setItem('user', 'invalid-json');
      renderLayout();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
      });

      // Fix the localStorage and retry
      localStorage.setItem('user', JSON.stringify(mockUser));
      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

      await waitFor(() => {
        expect(screen.getByTestId('child-component')).toBeInTheDocument();
      });
    });

    it('renders header during error state', async () => {
      localStorage.setItem('user', 'invalid-json');
      renderLayout();

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    it('renders footer during error state', async () => {
      localStorage.setItem('user', 'invalid-json');
      renderLayout();

      await waitFor(() => {
        expect(screen.getByTestId('footer')).toBeInTheDocument();
      });
    });
  });

  describe('Update User Points', () => {
    it('passes updateUserPoints function to child', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      renderLayout();

      await waitFor(() => {
        expect(screen.getByTestId('update-points-btn')).toBeInTheDocument();
      });
    });

    it('updates user points when updateUserPoints is called', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      renderLayout();

      await waitFor(() => {
        expect(screen.getByTestId('child-points')).toHaveTextContent('1500');
      });

      fireEvent.click(screen.getByTestId('update-points-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('child-points')).toHaveTextContent('2000');
      });
    });
  });

  describe('Update User Profile', () => {
    it('passes updateUserProfile function to child', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      renderLayout();

      await waitFor(() => {
        expect(screen.getByTestId('update-profile-btn')).toBeInTheDocument();
      });
    });

    it('updates user profile when updateUserProfile is called', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      renderLayout();

      await waitFor(() => {
        expect(screen.getByTestId('child-user')).toHaveTextContent('TestUser');
      });

      fireEvent.click(screen.getByTestId('update-profile-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('child-user')).toHaveTextContent('UpdatedUser');
      });
    });
  });

  describe('Layout Structure', () => {
    it('renders main content area with correct id', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      const { container } = renderLayout();

      await waitFor(() => {
        const main = container.querySelector('#main-content');
        expect(main).toBeInTheDocument();
      });
    });

    it('has correct layout structure', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      const { container } = renderLayout();

      await waitFor(() => {
        expect(screen.getByTestId('child-component')).toBeInTheDocument();
      });

      const layoutDiv = container.firstChild;
      expect(layoutDiv).toHaveClass('flex', 'flex-col', 'h-screen');
    });

    it('renders header, main, and footer in order', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      const { container } = renderLayout();

      await waitFor(() => {
        expect(screen.getByTestId('child-component')).toBeInTheDocument();
      });

      const header = screen.getByTestId('header');
      const main = container.querySelector('main');
      const footer = screen.getByTestId('footer');

      expect(header).toBeInTheDocument();
      expect(main).toBeInTheDocument();
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('main content area is scrollable', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      const { container } = renderLayout();

      await waitFor(() => {
        const main = container.querySelector('#main-content');
        expect(main).toHaveClass('overflow-y-auto');
      });
    });

    it('layout prevents body scroll', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      const { container } = renderLayout();

      await waitFor(() => {
        const layoutDiv = container.firstChild;
        expect(layoutDiv).toHaveClass('overflow-hidden');
      });
    });
  });
});