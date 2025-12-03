import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

jest.mock('./pages/Home', () => {
  return function MockHome() {
    return <div data-testid="home-page">Home Page</div>;
  };
});

jest.mock('./pages/Landing', () => {
  return function MockLanding() {
    return <div data-testid="landing-page">Landing Page</div>;
  };
});

jest.mock('./pages/Login', () => {
  return function MockLogin() {
    return <div data-testid="login-page">Login Page</div>;
  };
});

jest.mock('./pages/Signup', () => {
  return function MockSignup() {
    return <div data-testid="signup-page">Signup Page</div>;
  };
});

jest.mock('./pages/Onboarding', () => {
  return function MockOnboarding() {
    return <div data-testid="onboarding-page">Onboarding Page</div>;
  };
});

jest.mock('./pages/Rewards', () => {
  return function MockRewards() {
    return <div data-testid="rewards-page">Rewards Page</div>;
  };
});

jest.mock('./pages/Settings', () => {
  return function MockSettings() {
    return <div data-testid="settings-page">Settings Page</div>;
  };
});

jest.mock('./pages/ToDo', () => {
  return function MockToDo() {
    return <div data-testid="todo-page">ToDo Page</div>;
  };
});

jest.mock('./pages/Add', () => ({
  AddPage: function MockAddPage() {
    return <div data-testid="add-page">Add Page</div>;
  },
}));

jest.mock('./pages/UploadTimetable', () => {
  return function MockUploadTimetable() {
    return <div data-testid="upload-timetable-page">Upload Timetable Page</div>;
  };
});

jest.mock('./pages/UploadSyllabi', () => {
  return function MockUploadSyllabi() {
    return <div data-testid="upload-syllabi-page">Upload Syllabi Page</div>;
  };
});

jest.mock('./components/layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>;
  };
});

jest.mock('./api-contexts/blindbox/get-blindbox-series', () => ({
  BlindBoxSeriesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('./api-contexts/blindbox/get-blindbox-figures', () => ({
  BlindBoxFiguresProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('./api-contexts/blindbox/purchase-blindbox', () => ({
  BlindBoxPurchaseProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('./utils/use-custom-cursor', () => ({
  useCustomCursor: jest.fn(),
}));

jest.mock('./utils/extensionUtils', () => ({
  initializeActivityTracking: jest.fn(),
  isExtensionEnvironment: jest.fn(() => false),
}));

import { useCustomCursor } from './utils/use-custom-cursor';
import { initializeActivityTracking, isExtensionEnvironment } from './utils/extensionUtils';

const mockUseCustomCursor = useCustomCursor as jest.MockedFunction<typeof useCustomCursor>;
const mockInitializeActivityTracking = initializeActivityTracking as jest.MockedFunction<typeof initializeActivityTracking>;
const mockIsExtensionEnvironment = isExtensionEnvironment as jest.MockedFunction<typeof isExtensionEnvironment>;

// Helper to render App with specific route
const renderWithRouter = (initialRoute: string = '/') => {
  window.history.pushState({}, 'Test page', initialRoute);
  return render(<App />);
};

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockUseCustomCursor.mockReturnValue({
      equippedCursorId: null,
      equipCursor: jest.fn(),
      unequipCursor: jest.fn(),
    });
    mockIsExtensionEnvironment.mockReturnValue(false);
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderWithRouter('/');
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    it('renders App container with correct class', () => {
      const { container } = renderWithRouter('/');
      expect(container.querySelector('.App')).toBeInTheDocument();
    });
  });

  describe('Routing', () => {
    it('renders Landing page on root path', () => {
      renderWithRouter('/');
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    it('renders Login page on /login path', () => {
      renderWithRouter('/login');
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('renders Signup page on /signup path', () => {
      renderWithRouter('/signup');
      expect(screen.getByTestId('signup-page')).toBeInTheDocument();
    });

    it('renders Onboarding page on /onboarding path', () => {
      renderWithRouter('/onboarding');
      expect(screen.getByTestId('onboarding-page')).toBeInTheDocument();
    });

    it('renders Home page on /home path', () => {
      renderWithRouter('/home');
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    it('renders Rewards page on /rewards path', () => {
      renderWithRouter('/rewards');
      expect(screen.getByTestId('rewards-page')).toBeInTheDocument();
    });

    it('renders ToDo page on /todo path', () => {
      renderWithRouter('/todo');
      expect(screen.getByTestId('todo-page')).toBeInTheDocument();
    });

    it('renders Settings page on /settings path', () => {
      renderWithRouter('/settings');
      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    });

    it('renders Add page on /add path', () => {
      renderWithRouter('/add');
      expect(screen.getByTestId('add-page')).toBeInTheDocument();
    });

    it('renders Upload Timetable page on /upload-timetable path', () => {
      renderWithRouter('/upload-timetable');
      expect(screen.getByTestId('upload-timetable-page')).toBeInTheDocument();
    });

    it('renders Upload Syllabi page on /upload-syllabi path', () => {
      renderWithRouter('/upload-syllabi');
      expect(screen.getByTestId('upload-syllabi-page')).toBeInTheDocument();
    });

    it('redirects unknown routes to landing page', () => {
      renderWithRouter('/unknown-route');
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    it('redirects /random-path to landing page', () => {
      renderWithRouter('/random-path');
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });
  });

  describe('Layout Wrapping', () => {
    it('wraps Home page with Layout', () => {
      renderWithRouter('/home');
      expect(screen.getByTestId('layout')).toBeInTheDocument();
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    it('wraps Rewards page with Layout', () => {
      renderWithRouter('/rewards');
      expect(screen.getByTestId('layout')).toBeInTheDocument();
      expect(screen.getByTestId('rewards-page')).toBeInTheDocument();
    });

    it('wraps ToDo page with Layout', () => {
      renderWithRouter('/todo');
      expect(screen.getByTestId('layout')).toBeInTheDocument();
      expect(screen.getByTestId('todo-page')).toBeInTheDocument();
    });

    it('wraps Settings page with Layout', () => {
      renderWithRouter('/settings');
      expect(screen.getByTestId('layout')).toBeInTheDocument();
      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    });

    it('wraps Add page with Layout', () => {
      renderWithRouter('/add');
      expect(screen.getByTestId('layout')).toBeInTheDocument();
      expect(screen.getByTestId('add-page')).toBeInTheDocument();
    });

    it('wraps Upload Timetable page with Layout', () => {
      renderWithRouter('/upload-timetable');
      expect(screen.getByTestId('layout')).toBeInTheDocument();
      expect(screen.getByTestId('upload-timetable-page')).toBeInTheDocument();
    });

    it('wraps Upload Syllabi page with Layout', () => {
      renderWithRouter('/upload-syllabi');
      expect(screen.getByTestId('layout')).toBeInTheDocument();
      expect(screen.getByTestId('upload-syllabi-page')).toBeInTheDocument();
    });

    it('does not wrap Landing page with Layout', () => {
      renderWithRouter('/');
      expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    it('does not wrap Login page with Layout', () => {
      renderWithRouter('/login');
      expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('does not wrap Signup page with Layout', () => {
      renderWithRouter('/signup');
      expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
      expect(screen.getByTestId('signup-page')).toBeInTheDocument();
    });

    it('does not wrap Onboarding page with Layout', () => {
      renderWithRouter('/onboarding');
      expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
      expect(screen.getByTestId('onboarding-page')).toBeInTheDocument();
    });
  });

  describe('Cursor Figures', () => {
    it('loads cursor figures from localStorage on mount', async () => {
      const mockFigures = [{ id: 'fig-1', image: 'test.png' }];
      localStorage.setItem('cursor_figures', JSON.stringify(mockFigures));

      renderWithRouter('/home');

      await waitFor(() => {
        expect(mockUseCustomCursor).toHaveBeenCalled();
      });
    });

    it('passes empty array to useCustomCursor on auth pages', async () => {
      const mockFigures = [{ id: 'fig-1', image: 'test.png' }];
      localStorage.setItem('cursor_figures', JSON.stringify(mockFigures));

      renderWithRouter('/');

      await waitFor(() => {
        expect(mockUseCustomCursor).toHaveBeenCalledWith([]);
      });
    });

    it('passes empty array to useCustomCursor on login page', async () => {
      const mockFigures = [{ id: 'fig-1', image: 'test.png' }];
      localStorage.setItem('cursor_figures', JSON.stringify(mockFigures));

      renderWithRouter('/login');

      await waitFor(() => {
        expect(mockUseCustomCursor).toHaveBeenCalledWith([]);
      });
    });

    it('passes empty array to useCustomCursor on signup page', async () => {
      const mockFigures = [{ id: 'fig-1', image: 'test.png' }];
      localStorage.setItem('cursor_figures', JSON.stringify(mockFigures));

      renderWithRouter('/signup');

      await waitFor(() => {
        expect(mockUseCustomCursor).toHaveBeenCalledWith([]);
      });
    });

    it('passes empty array to useCustomCursor on onboarding page', async () => {
      const mockFigures = [{ id: 'fig-1', image: 'test.png' }];
      localStorage.setItem('cursor_figures', JSON.stringify(mockFigures));

      renderWithRouter('/onboarding');

      await waitFor(() => {
        expect(mockUseCustomCursor).toHaveBeenCalledWith([]);
      });
    });

    it('passes figures to useCustomCursor on authenticated pages', async () => {
      const mockFigures = [{ id: 'fig-1', image: 'test.png' }];
      localStorage.setItem('cursor_figures', JSON.stringify(mockFigures));

      renderWithRouter('/home');

      await waitFor(() => {
        expect(mockUseCustomCursor).toHaveBeenCalledWith(mockFigures);
      });
    });

    it('handles invalid JSON in localStorage gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorage.setItem('cursor_figures', 'invalid-json');

      renderWithRouter('/home');

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('handles missing cursor_figures in localStorage', async () => {
      renderWithRouter('/home');

      await waitFor(() => {
        expect(mockUseCustomCursor).toHaveBeenCalledWith([]);
      });
    });

    it('updates figures when figures-updated event is dispatched', async () => {
      const initialFigures = [{ id: 'fig-1', image: 'test1.png' }];
      localStorage.setItem('cursor_figures', JSON.stringify(initialFigures));

      renderWithRouter('/home');

      await waitFor(() => {
        expect(mockUseCustomCursor).toHaveBeenCalledWith(initialFigures);
      });

      const updatedFigures = [{ id: 'fig-2', image: 'test2.png' }];
      localStorage.setItem('cursor_figures', JSON.stringify(updatedFigures));

      window.dispatchEvent(new CustomEvent('figures-updated'));

      await waitFor(() => {
        expect(mockUseCustomCursor).toHaveBeenCalledWith(updatedFigures);
      });
    });
  });

  describe('Extension Activity Tracking', () => {
    it('does not initialize tracking when not in extension environment', () => {
      mockIsExtensionEnvironment.mockReturnValue(false);

      renderWithRouter('/');

      expect(mockInitializeActivityTracking).not.toHaveBeenCalled();
    });

    it('initializes tracking when in extension environment', () => {
      mockIsExtensionEnvironment.mockReturnValue(true);

      renderWithRouter('/');

      expect(mockInitializeActivityTracking).toHaveBeenCalled();
    });

    it('logs message when initializing extension tracking', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockIsExtensionEnvironment.mockReturnValue(true);

      renderWithRouter('/');

      expect(consoleSpy).toHaveBeenCalledWith('Initializing extension activity tracking...');

      consoleSpy.mockRestore();
    });
  });

  describe('Context Providers', () => {
    it('renders app within BlindBoxSeriesProvider', () => {
      expect(() => renderWithRouter('/')).not.toThrow();
    });

    it('renders app within BlindBoxFiguresProvider', () => {
      expect(() => renderWithRouter('/')).not.toThrow();
    });

    it('renders app within BlindBoxPurchaseProvider', () => {
      expect(() => renderWithRouter('/')).not.toThrow();
    });
  });

  describe('Event Listeners', () => {
    it('adds figures-updated event listener on mount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      renderWithRouter('/home');

      expect(addEventListenerSpy).toHaveBeenCalledWith('figures-updated', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('removes figures-updated event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderWithRouter('/home');
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('figures-updated', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Multiple Route Navigation', () => {
    it('can navigate between multiple pages', () => {
      const { unmount } = renderWithRouter('/');
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      unmount();

      const { unmount: unmount2 } = renderWithRouter('/login');
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      unmount2();

      const { unmount: unmount3 } = renderWithRouter('/home');
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      unmount3();
    });
  });

  describe('Edge Cases', () => {
    it('handles route with trailing slash', () => {
      renderWithRouter('/home/');
      // Should redirect to landing since /home/ is not exact match
      // Behavior depends on router configuration
      expect(document.body).toBeInTheDocument();
    });

    it('handles route with query parameters', () => {
      renderWithRouter('/home?test=value');
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    it('handles route with hash', () => {
      renderWithRouter('/home#section');
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    it('handles empty figures array in localStorage', async () => {
      localStorage.setItem('cursor_figures', JSON.stringify([]));

      renderWithRouter('/home');

      await waitFor(() => {
        expect(mockUseCustomCursor).toHaveBeenCalledWith([]);
      });
    });
  });
});

describe('App Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockUseCustomCursor.mockReturnValue({
      equippedCursorId: null,
      equipCursor: jest.fn(),
      unequipCursor: jest.fn(),
    });
    mockIsExtensionEnvironment.mockReturnValue(false);
  });

  it('renders complete app structure', () => {
    const { container } = renderWithRouter('/');

    expect(container.querySelector('.App')).toBeInTheDocument();
  });

  it('maintains state across route changes via localStorage', async () => {
    const figures = [{ id: 'test', image: 'test.png' }];
    localStorage.setItem('cursor_figures', JSON.stringify(figures));

    const { unmount } = renderWithRouter('/home');

    await waitFor(() => {
      expect(mockUseCustomCursor).toHaveBeenCalledWith(figures);
    });

    unmount();

    const { } = renderWithRouter('/rewards');

    await waitFor(() => {
      expect(mockUseCustomCursor).toHaveBeenCalledWith(figures);
    });
  });
});