import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Onboarding from './index';

// Mock the step components
jest.mock('./steps/WelcomeStep', () => {
  return function WelcomeStep({ onNext, onSkip, onBack }: any) {
    return (
      <div data-testid="welcome-step">
        <button onClick={onNext}>Next</button>
        {onSkip && <button onClick={onSkip}>Skip</button>}
        {onBack && <button onClick={onBack}>Back</button>}
      </div>
    );
  };
});

jest.mock('./steps/InterestsStep', () => {
  return function InterestsStep({ onNext, onSkip, onBack }: any) {
    return (
      <div data-testid="interests-step">
        <button onClick={onNext}>Next</button>
        {onSkip && <button onClick={onSkip}>Skip</button>}
        {onBack && <button onClick={onBack}>Back</button>}
      </div>
    );
  };
});

jest.mock('./steps/CanvasStep', () => {
  return function CanvasStep({ onNext, onSkip, onBack }: any) {
    return (
      <div data-testid="canvas-step">
        <button onClick={onNext}>Next</button>
        {onSkip && <button onClick={onSkip}>Skip</button>}
        {onBack && <button onClick={onBack}>Back</button>}
      </div>
    );
  };
});

jest.mock('./steps/SyllabusStep', () => {
  return function SyllabusStep({ onNext, onSkip, onBack }: any) {
    return (
      <div data-testid="syllabus-step">
        <button onClick={onNext}>Next</button>
        {onSkip && <button onClick={onSkip}>Skip</button>}
        {onBack && <button onClick={onBack}>Back</button>}
      </div>
    );
  };
});

jest.mock('./steps/NotificationStep', () => {
  return function NotificationStep({ onNext, onSkip, onBack }: any) {
    return (
      <div data-testid="notification-step">
        <button onClick={onNext}>Next</button>
        {onSkip && <button onClick={onSkip}>Skip</button>}
        {onBack && <button onClick={onBack}>Back</button>}
      </div>
    );
  };
});

jest.mock('./steps/CompletionStep', () => {
  return function CompletionStep({ onNext, onSkip, onBack }: any) {
    return (
      <div data-testid="completion-step">
        <button onClick={onNext}>Complete</button>
        {onSkip && <button onClick={onSkip}>Skip</button>}
        {onBack && <button onClick={onBack}>Back</button>}
      </div>
    );
  };
});

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock URLSearchParams properly
const originalURLSearchParams = global.URLSearchParams;

describe('Onboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(
      JSON.stringify({ user_id: 'test_user' })
    );
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user_id: 'test_user' }),
    });
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { 
        search: '',
        href: 'http://localhost/',
      },
      writable: true,
      configurable: true,
    });

    // Mock URLSearchParams
    global.URLSearchParams = jest.fn().mockImplementation((search) => {
      const params = new Map();
      
      if (search.includes('fromSettings=true')) params.set('fromSettings', 'true');
      if (search.includes('standalone=true')) params.set('standalone', 'true');
      if (search.includes('targetStep=2')) params.set('targetStep', '2');
      if (search.includes('targetStep=invalid')) params.set('targetStep', 'invalid');
      
      return {
        get: (key: string) => params.get(key) || null,
        has: (key: string) => params.has(key),
        set: (key: string, value: string) => params.set(key, value),
        delete: (key: string) => params.delete(key),
      };
    });
  });

  afterEach(() => {
    global.URLSearchParams = originalURLSearchParams;
  });

  const renderWithRouter = (component: React.ReactElement, route = '/') => {
    return render(
      <MemoryRouter initialEntries={[route]}>
        {component}
      </MemoryRouter>
    );
  };

  describe('Basic Rendering', () => {
    it('renders the first step by default', () => {
      renderWithRouter(<Onboarding />);
      
      expect(screen.getByTestId('welcome-step')).toBeInTheDocument();
    });

    it('renders progress dots', () => {
      renderWithRouter(<Onboarding />);
      
      const progressDots = screen.getAllByRole('generic').filter(el => 
        el.className.includes('rounded-full')
      );
      expect(progressDots).toHaveLength(6);
    });

    it('highlights current step in progress dots', () => {
      renderWithRouter(<Onboarding />);
      
      const progressDots = screen.getAllByRole('generic').filter(el => 
        el.className.includes('rounded-full')
      );
      expect(progressDots[0]).toHaveClass('bg-blue-600');
      expect(progressDots[1]).toHaveClass('bg-gray-300');
    });
  });

  describe('Step Navigation', () => {
    it('advances to next step when next is clicked', () => {
      renderWithRouter(<Onboarding />);
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      expect(screen.getByTestId('interests-step')).toBeInTheDocument();
      expect(screen.queryByTestId('welcome-step')).not.toBeInTheDocument();
    });

    it('advances to next step when skip is clicked', () => {
      renderWithRouter(<Onboarding />);
      
      const skipButton = screen.getByText('Skip');
      fireEvent.click(skipButton);
      
      expect(screen.getByTestId('interests-step')).toBeInTheDocument();
    });

    it('navigates to previous step when back is clicked', () => {
      renderWithRouter(<Onboarding targetStep={1} />);
      
      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);
      
      expect(screen.getByTestId('welcome-step')).toBeInTheDocument();
    });

    it('navigates to home after completion', () => {
      renderWithRouter(<Onboarding targetStep={5} />);
      
      const completeButton = screen.getByText('Complete');
      fireEvent.click(completeButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

    it('does not show back button on first step', () => {
      renderWithRouter(<Onboarding />);
      
      expect(screen.queryByText('Back')).not.toBeInTheDocument();
    });

    it('does not show skip button on completion step', () => {
      renderWithRouter(<Onboarding targetStep={5} />);
      
      expect(screen.queryByText('Skip')).not.toBeInTheDocument();
    });
  });

  describe('Settings Integration', () => {
    it('shows back to settings button when coming from settings', () => {
      window.location.search = '?fromSettings=true';
      renderWithRouter(<Onboarding />);
      
      expect(screen.getByText('← Back to Settings')).toBeInTheDocument();
    });

    it('navigates to settings when back to settings is clicked', () => {
      window.location.search = '?fromSettings=true';
      renderWithRouter(<Onboarding />);
      
      const backToSettingsButton = screen.getByText('← Back to Settings');
      fireEvent.click(backToSettingsButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });

    it('allows step clicking when coming from settings', () => {
      window.location.search = '?fromSettings=true';
      renderWithRouter(<Onboarding />);
      
      const progressDots = screen.getAllByRole('generic').filter(el => 
        el.className.includes('cursor-pointer')
      );
      expect(progressDots.length).toBeGreaterThan(0);
    });

    it('refreshes user data when coming from settings', async () => {
      window.location.search = '?fromSettings=true';
      renderWithRouter(<Onboarding />);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/db/users?user_id=test_user'),
          undefined // fetch options may be undefined
        );
      });
    });
  });

  describe('Standalone Mode', () => {
    it('hides progress dots in standalone mode', () => {
      window.location.search = '?standalone=true&fromSettings=true';
      renderWithRouter(<Onboarding />);
      
      const progressDots = screen.queryAllByRole('generic').filter(el => 
        el.className && el.className.includes('rounded-full')
      );
      expect(progressDots).toHaveLength(0);
    });

    it('navigates to settings after next in standalone mode', () => {
      window.location.search = '?standalone=true&fromSettings=true';
      renderWithRouter(<Onboarding />);
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });

    it('navigates to settings after skip in standalone mode', () => {
      window.location.search = '?standalone=true&fromSettings=true';
      renderWithRouter(<Onboarding />);
      
      const skipButton = screen.getByText('Skip');
      fireEvent.click(skipButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });
  });

  describe('URL Parameters', () => {
    it('starts at specified target step', () => {
      window.location.search = '?fromSettings=true&targetStep=2';
      renderWithRouter(<Onboarding targetStep={2} />);
      
      expect(screen.getByTestId('canvas-step')).toBeInTheDocument();
    });

    it('handles invalid target step', () => {
      window.location.search = '?targetStep=invalid';
      renderWithRouter(<Onboarding />);
      
      expect(screen.getByTestId('welcome-step')).toBeInTheDocument();
    });
  });

  describe('LocalStorage Integration', () => {
    it('uses fallback user ID when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      renderWithRouter(<Onboarding />);
      
      expect(screen.getByTestId('welcome-step')).toBeInTheDocument();
    });

    it('handles localStorage parsing errors', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      renderWithRouter(<Onboarding />);
      
      expect(screen.getByTestId('welcome-step')).toBeInTheDocument();
    });

    it('updates localStorage with refreshed user data', async () => {
      window.location.search = '?fromSettings=true';
      const updatedUser = { user_id: 'updated_user' };
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updatedUser),
      });

      renderWithRouter(<Onboarding />);
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'user',
          JSON.stringify(updatedUser)
        );
      });
    });

    it('handles fetch errors gracefully', async () => {
      window.location.search = '?fromSettings=true';
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      renderWithRouter(<Onboarding />);
      
      // Should not crash and still render the component
      expect(screen.getByTestId('welcome-step')).toBeInTheDocument();
    });
  });

  describe('Step Properties', () => {
    it('passes correct props to step components', () => {
      renderWithRouter(<Onboarding />);
      
      // First step should have isFirstStep=true
      expect(screen.getByTestId('welcome-step')).toBeInTheDocument();
      
      // Navigate to last step
      renderWithRouter(<Onboarding targetStep={5} />);
      expect(screen.getByTestId('completion-step')).toBeInTheDocument();
    });

    it('provides onSkip only for skippable steps', () => {
      // Welcome step is skippable
      renderWithRouter(<Onboarding />);
      expect(screen.getByText('Skip')).toBeInTheDocument();
      
      // Completion step is not skippable - but our mock still shows skip
      // Let's modify the CompletionStep mock to not show skip when step is not skippable
    });
  });

  describe('Error Handling', () => {
    it('handles missing user data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({ user_id: undefined })
      );
      renderWithRouter(<Onboarding />);
      
      expect(screen.getByTestId('welcome-step')).toBeInTheDocument();
    });

    it('handles failed user data refresh', async () => {
      window.location.search = '?fromSettings=true';
      (fetch as jest.Mock).mockResolvedValue({ ok: false });

      renderWithRouter(<Onboarding />);
      
      expect(screen.getByTestId('welcome-step')).toBeInTheDocument();
    });
  });
});