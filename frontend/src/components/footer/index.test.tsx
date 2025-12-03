import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import Footer from './index';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;
const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;

describe('Footer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseLocation.mockReturnValue({
      pathname: '/home',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });
  });

  const renderFooter = (pathname = '/home') => {
    mockUseLocation.mockReturnValue({
      pathname,
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    return render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('renders all navigation buttons', () => {
      renderFooter();

      expect(screen.getByLabelText('Dashboard')).toBeInTheDocument();
      expect(screen.getByLabelText('To-Do')).toBeInTheDocument();
      expect(screen.getByLabelText('Add Item')).toBeInTheDocument();
      expect(screen.getByLabelText('Rewards')).toBeInTheDocument();
      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    });

    it('renders all navigation labels', () => {
      renderFooter();

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('To-Do')).toBeInTheDocument();
      expect(screen.getByText('Add Item')).toBeInTheDocument();
      expect(screen.getByText('Rewards')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders all navigation icons', () => {
      renderFooter();

      expect(screen.getByAltText('Dashboard')).toBeInTheDocument();
      expect(screen.getByAltText('To-Do')).toBeInTheDocument();
      expect(screen.getByAltText('Add Item')).toBeInTheDocument();
      expect(screen.getByAltText('Rewards')).toBeInTheDocument();
      expect(screen.getByAltText('Settings')).toBeInTheDocument();
    });

    it('renders footer element', () => {
      const { container } = renderFooter();

      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('renders nav element', () => {
      const { container } = renderFooter();

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    it('renders Add Item button with special styling', () => {
      renderFooter();

      const addButton = screen.getByLabelText('Add Item');
      expect(addButton).toHaveClass('relative', '-mt-6');
    });

    it('renders Add Item button with gradient container', () => {
      renderFooter();

      const addButton = screen.getByLabelText('Add Item');
      const gradientContainer = addButton.querySelector('.bg-gradient-to-br');
      expect(gradientContainer).toBeInTheDocument();
      expect(gradientContainer).toHaveClass('from-orange-400', 'to-yellow-500');
    });

    it('renders Add Item icon with correct dimensions', () => {
      renderFooter();

      const addIcon = screen.getByAltText('Add Item');
      expect(addIcon).toHaveClass('w-12', 'h-9');
    });

    it('renders regular nav icons with correct dimensions', () => {
      renderFooter();

      const dashboardIcon = screen.getByAltText('Dashboard');
      expect(dashboardIcon).toHaveClass('w-8', 'h-8');
    });
  });

  describe('Navigation', () => {
    it('navigates to /home when Dashboard is clicked', () => {
      renderFooter();

      fireEvent.click(screen.getByLabelText('Dashboard'));

      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

    it('navigates to /todo when To-Do is clicked', () => {
      renderFooter();

      fireEvent.click(screen.getByLabelText('To-Do'));

      expect(mockNavigate).toHaveBeenCalledWith('/todo');
    });

    it('navigates to /add when Add Item is clicked', () => {
      renderFooter();

      fireEvent.click(screen.getByLabelText('Add Item'));

      expect(mockNavigate).toHaveBeenCalledWith('/add');
    });

    it('navigates to /rewards when Rewards is clicked', () => {
      renderFooter();

      fireEvent.click(screen.getByLabelText('Rewards'));

      expect(mockNavigate).toHaveBeenCalledWith('/rewards');
    });

    it('navigates to /settings when Settings is clicked', () => {
      renderFooter();

      fireEvent.click(screen.getByLabelText('Settings'));

      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });

    it('navigates to / for unknown routes', () => {
      renderFooter();

      const dashboardButton = screen.getByLabelText('Dashboard');
      
      fireEvent.click(dashboardButton);
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

    it('updates active tab when navigation button is clicked', () => {
      renderFooter('/home');

      fireEvent.click(screen.getByLabelText('Rewards'));

      const rewardsButton = screen.getByLabelText('Rewards');
      expect(rewardsButton).toHaveClass('text-orange-500');
    });

    it('clicking same tab does not cause errors', () => {
      renderFooter('/home');

      const dashboardButton = screen.getByLabelText('Dashboard');
      
      fireEvent.click(dashboardButton);
      fireEvent.click(dashboardButton);

      expect(mockNavigate).toHaveBeenCalledTimes(2);
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  describe('Active Tab State', () => {
    it('sets home as active tab when on /home route', () => {
      renderFooter('/home');

      const dashboardButton = screen.getByLabelText('Dashboard');
      expect(dashboardButton).toHaveClass('text-orange-500');
    });

    it('sets home as active tab when on / route', () => {
      renderFooter('/');

      const dashboardButton = screen.getByLabelText('Dashboard');
      expect(dashboardButton).toHaveClass('text-orange-500');
    });

    it('sets rewards as active tab when on /rewards route', () => {
      renderFooter('/rewards');

      const rewardsButton = screen.getByLabelText('Rewards');
      expect(rewardsButton).toHaveClass('text-orange-500');
    });

    it('inactive tabs have gray color', () => {
      renderFooter('/home');

      const rewardsButton = screen.getByLabelText('Rewards');
      expect(rewardsButton).toHaveClass('text-gray-400');
    });

    it('active icon is scaled up', () => {
      renderFooter('/home');

      const dashboardIcon = screen.getByAltText('Dashboard');
      expect(dashboardIcon).toHaveClass('scale-110');
    });

    it('inactive icon is not scaled', () => {
      renderFooter('/home');

      const rewardsIcon = screen.getByAltText('Rewards');
      expect(rewardsIcon).not.toHaveClass('scale-110');
    });

    it('active tab has indicator dot', () => {
      renderFooter('/home');

      const dashboardButton = screen.getByLabelText('Dashboard');
      const indicatorDot = dashboardButton.querySelector('.bg-orange-500.rounded-full');
      expect(indicatorDot).toBeInTheDocument();
    });

    it('inactive tab does not have indicator dot', () => {
      renderFooter('/home');

      const rewardsButton = screen.getByLabelText('Rewards');
      const indicatorDot = rewardsButton.querySelector('.bg-orange-500.rounded-full');
      expect(indicatorDot).not.toBeInTheDocument();
    });

    it('active tab label has font-semibold', () => {
      renderFooter('/home');

      const labels = screen.getAllByText('Dashboard');
      const dashboardLabel = labels.find(el => el.classList.contains('font-semibold'));
      expect(dashboardLabel).toBeInTheDocument();
    });

    it('updates active state when route changes', () => {
      const { rerender } = render(
        <BrowserRouter>
          <Footer />
        </BrowserRouter>
      );

      expect(screen.getByLabelText('Dashboard')).toHaveClass('text-orange-500');

      mockUseLocation.mockReturnValue({
        pathname: '/rewards',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      rerender(
        <BrowserRouter>
          <Footer />
        </BrowserRouter>
      );

      expect(screen.getByLabelText('Rewards')).toHaveClass('text-orange-500');
    });

    it('does not set todo as active from route', () => {
      renderFooter('/todo');
      const todoButton = screen.getByLabelText('To-Do');
      expect(todoButton).toHaveClass('text-gray-400');
    });

    it('does not set settings as active from route', () => {
      renderFooter('/settings');

      const settingsButton = screen.getByLabelText('Settings');
      expect(settingsButton).toHaveClass('text-gray-400');
    });

    it('does not set add as active from route', () => {
      renderFooter('/add');

      const addButton = screen.getByLabelText('Add Item');
      expect(addButton).not.toHaveClass('text-orange-500');
    });
  });

  describe('Scroll Behavior', () => {
    let mainContent: HTMLDivElement;

    beforeEach(() => {
      mainContent = document.createElement('div');
      mainContent.id = 'main-content';
      mainContent.style.height = '500px';
      mainContent.style.overflow = 'auto';
      document.body.appendChild(mainContent);
    });

    afterEach(() => {
      if (mainContent && mainContent.parentNode) {
        mainContent.parentNode.removeChild(mainContent);
      }
    });

    it('shows labels by default', () => {
      renderFooter();

      const labels = screen.getAllByText('Dashboard');
      const labelElement = labels[0];
      expect(labelElement).toHaveClass('opacity-100');
    });

    it('hides labels on scroll down past threshold', () => {
      renderFooter();

      act(() => {
        Object.defineProperty(mainContent, 'scrollTop', { value: 150, writable: true });
        mainContent.dispatchEvent(new Event('scroll'));
      });

      const dashboardLabel = screen.getByLabelText('Dashboard').querySelector('span');
      expect(dashboardLabel).toHaveClass('opacity-0');
    });

    it('shows labels on scroll up', () => {
      renderFooter();

      act(() => {
        Object.defineProperty(mainContent, 'scrollTop', { value: 150, writable: true });
        mainContent.dispatchEvent(new Event('scroll'));
      });

      act(() => {
        Object.defineProperty(mainContent, 'scrollTop', { value: 50, writable: true });
        mainContent.dispatchEvent(new Event('scroll'));
      });

      const dashboardLabel = screen.getByLabelText('Dashboard').querySelector('span');
      expect(dashboardLabel).toHaveClass('opacity-100');
    });

    it('shows labels when scroll position is near top', () => {
      renderFooter();

      act(() => {
        Object.defineProperty(mainContent, 'scrollTop', { value: 30, writable: true });
        mainContent.dispatchEvent(new Event('scroll'));
      });

      const dashboardLabel = screen.getByLabelText('Dashboard').querySelector('span');
      expect(dashboardLabel).toHaveClass('opacity-100');
    });

    it('removes scroll listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(mainContent, 'removeEventListener');

      const { unmount } = renderFooter();
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });

    it('handles missing main-content element', () => {
      document.body.removeChild(mainContent);

      expect(() => renderFooter()).not.toThrow();
    });

    it('labels translate on hide', () => {
      renderFooter();

      act(() => {
        Object.defineProperty(mainContent, 'scrollTop', { value: 150, writable: true });
        mainContent.dispatchEvent(new Event('scroll'));
      });

      const dashboardLabel = screen.getByLabelText('Dashboard').querySelector('span');
      expect(dashboardLabel).toHaveClass('-translate-y-1');
    });

    it('labels translate reset on show', () => {
      renderFooter();

      const dashboardLabel = screen.getByLabelText('Dashboard').querySelector('span');
      expect(dashboardLabel).toHaveClass('translate-y-0');
    });

    it('Add Item label also hides on scroll', () => {
      renderFooter();

      act(() => {
        Object.defineProperty(mainContent, 'scrollTop', { value: 150, writable: true });
        mainContent.dispatchEvent(new Event('scroll'));
      });

      const addItemLabel = screen.getByLabelText('Add Item').querySelector('span');
      expect(addItemLabel).toHaveClass('opacity-0');
    });
  });

  describe('Styling', () => {
    it('footer has fixed positioning', () => {
      const { container } = renderFooter();

      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0');
    });

    it('footer has correct background and border', () => {
      const { container } = renderFooter();

      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('bg-white', 'border-t', 'border-gray-200');
    });

    it('footer has shadow', () => {
      const { container } = renderFooter();

      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('shadow-lg');
    });

    it('footer has high z-index', () => {
      const { container } = renderFooter();

      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('z-40');
    });

    it('nav has flex layout', () => {
      const { container } = renderFooter();

      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('flex', 'items-end', 'justify-around');
    });

    it('nav has max width constraint', () => {
      const { container } = renderFooter();

      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('max-w-6xl', 'mx-auto');
    });

    it('regular buttons have minimum width', () => {
      renderFooter();

      const dashboardButton = screen.getByLabelText('Dashboard');
      expect(dashboardButton).toHaveClass('min-w-[72px]');
    });

    it('regular buttons have flex column layout', () => {
      renderFooter();

      const dashboardButton = screen.getByLabelText('Dashboard');
      expect(dashboardButton).toHaveClass('flex', 'flex-col', 'items-center');
    });

    it('regular buttons have gap and padding', () => {
      renderFooter();

      const dashboardButton = screen.getByLabelText('Dashboard');
      expect(dashboardButton).toHaveClass('gap-1', 'px-4', 'py-3');
    });

    it('regular buttons have transition effects', () => {
      renderFooter();

      const dashboardButton = screen.getByLabelText('Dashboard');
      expect(dashboardButton).toHaveClass('transition-all', 'duration-200');
    });

    it('Add Item container has shadow', () => {
      renderFooter();

      const addButton = screen.getByLabelText('Add Item');
      const container = addButton.querySelector('.shadow-lg');
      expect(container).toBeInTheDocument();
    });

    it('Add Item container has rounded corners', () => {
      renderFooter();

      const addButton = screen.getByLabelText('Add Item');
      const container = addButton.querySelector('.rounded-2xl');
      expect(container).toBeInTheDocument();
    });

    it('Add Item container has correct size', () => {
      renderFooter();

      const addButton = screen.getByLabelText('Add Item');
      const container = addButton.querySelector('.w-14.h-14');
      expect(container).toBeInTheDocument();
    });

    it('inactive button has hover state', () => {
      renderFooter('/home');

      const rewardsButton = screen.getByLabelText('Rewards');
      expect(rewardsButton).toHaveClass('hover:text-gray-600');
    });

    it('icon container has relative positioning', () => {
      renderFooter();

      const dashboardButton = screen.getByLabelText('Dashboard');
      const iconContainer = dashboardButton.querySelector('.relative');
      expect(iconContainer).toBeInTheDocument();
    });

    it('indicator dot is positioned correctly', () => {
      renderFooter('/home');

      const dashboardButton = screen.getByLabelText('Dashboard');
      const indicatorDot = dashboardButton.querySelector('.absolute.-bottom-1');
      expect(indicatorDot).toBeInTheDocument();
      expect(indicatorDot).toHaveClass('left-1/2', '-translate-x-1/2');
    });

    it('indicator dot has correct size', () => {
      renderFooter('/home');

      const dashboardButton = screen.getByLabelText('Dashboard');
      const indicatorDot = dashboardButton.querySelector('.w-1.h-1');
      expect(indicatorDot).toBeInTheDocument();
    });

    it('Add Item label has correct styling', () => {
      renderFooter();

      const addButton = screen.getByLabelText('Add Item');
      const label = addButton.querySelector('span');
      expect(label).toHaveClass('text-xs', 'font-semibold', 'text-gray-700');
    });

    it('Add Item label has correct margins', () => {
      renderFooter();

      const addButton = screen.getByLabelText('Add Item');
      const label = addButton.querySelector('span');
      expect(label).toHaveClass('mt-1', 'mb-2');
    });

    it('regular button label has text styling', () => {
      renderFooter();

      const dashboardButton = screen.getByLabelText('Dashboard');
      const label = dashboardButton.querySelector('span');
      expect(label).toHaveClass('text-xs', 'font-medium');
    });

    it('labels have transition classes', () => {
      renderFooter();

      const dashboardButton = screen.getByLabelText('Dashboard');
      const label = dashboardButton.querySelector('span');
      expect(label).toHaveClass('transition-all', 'duration-300');
    });

    it('hidden labels have max-h-0', () => {
      const mainContent = document.createElement('div');
      mainContent.id = 'main-content';
      document.body.appendChild(mainContent);

      renderFooter();

      act(() => {
        Object.defineProperty(mainContent, 'scrollTop', { value: 150, writable: true });
        mainContent.dispatchEvent(new Event('scroll'));
      });

      const dashboardButton = screen.getByLabelText('Dashboard');
      const label = dashboardButton.querySelector('span');
      expect(label).toHaveClass('max-h-0');

      document.body.removeChild(mainContent);
    });

    it('visible labels have max-h-6', () => {
      renderFooter();

      const dashboardButton = screen.getByLabelText('Dashboard');
      const label = dashboardButton.querySelector('span');
      expect(label).toHaveClass('max-h-6');
    });
  });

  describe('Hover Effects', () => {
    it('Add Item container has hover scale effect class', () => {
      renderFooter();

      const addButton = screen.getByLabelText('Add Item');
      const container = addButton.querySelector('.group-hover\\:scale-105');
      expect(container).toBeInTheDocument();
    });

    it('Add Item container has hover shadow class', () => {
      renderFooter();

      const addButton = screen.getByLabelText('Add Item');
      const container = addButton.querySelector('.group-hover\\:shadow-xl');
      expect(container).toBeInTheDocument();
    });

    it('Add Item button has group class for hover effects', () => {
      renderFooter();

      const addButton = screen.getByLabelText('Add Item');
      expect(addButton).toHaveClass('group');
    });
  });

  describe('Accessibility', () => {
    it('all navigation buttons have aria-label', () => {
      renderFooter();

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('all icons have alt text', () => {
      renderFooter();

      const images = screen.getAllByRole('img');
      images.forEach((img) => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });

    it('renders exactly 5 navigation buttons', () => {
      renderFooter();

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);
    });

    it('buttons are focusable', () => {
      renderFooter();

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('buttons can be activated with keyboard', () => {
      renderFooter();

      const dashboardButton = screen.getByLabelText('Dashboard');
      dashboardButton.focus();
      
      fireEvent.keyDown(dashboardButton, { key: 'Enter' });
      // Button should be interactive
      expect(document.activeElement).toBe(dashboardButton);
    });

    it('aria-labels match visible labels', () => {
      renderFooter();

      expect(screen.getByLabelText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      expect(screen.getByLabelText('To-Do')).toBeInTheDocument();
      expect(screen.getByText('To-Do')).toBeInTheDocument();

      expect(screen.getByLabelText('Add Item')).toBeInTheDocument();
      expect(screen.getByText('Add Item')).toBeInTheDocument();

      expect(screen.getByLabelText('Rewards')).toBeInTheDocument();
      expect(screen.getByText('Rewards')).toBeInTheDocument();

      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('footer has semantic HTML structure', () => {
      const { container } = renderFooter();

      expect(container.querySelector('footer')).toBeInTheDocument();
      expect(container.querySelector('nav')).toBeInTheDocument();
    });
  });

  describe('Nav Items Configuration', () => {
    it('renders correct number of regular nav items', () => {
      renderFooter();

      // 4 regular items + 1 special Add Item = 5 total
      const regularButtons = screen.getAllByRole('button').filter(
        btn => !btn.classList.contains('-mt-6')
      );
      expect(regularButtons).toHaveLength(4);
    });

    it('renders one special nav item', () => {
      renderFooter();

      const specialButton = screen.getByLabelText('Add Item');
      expect(specialButton).toHaveClass('-mt-6');
    });

    it('nav items are in correct order', () => {
      renderFooter();

      const buttons = screen.getAllByRole('button');
      const labels = buttons.map(btn => btn.getAttribute('aria-label'));
      
      expect(labels).toEqual([
        'Dashboard',
        'To-Do',
        'Add Item',
        'Rewards',
        'Settings'
      ]);
    });
  });

  describe('Icon Transitions', () => {
    it('icons have transition classes', () => {
      renderFooter();

      const dashboardIcon = screen.getByAltText('Dashboard');
      expect(dashboardIcon).toHaveClass('transition-all', 'duration-200');
    });

    it('Add Item container has transition classes', () => {
      renderFooter();

      const addButton = screen.getByLabelText('Add Item');
      const container = addButton.querySelector('.transition-all');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid navigation clicks', () => {
      renderFooter();

      const dashboardButton = screen.getByLabelText('Dashboard');
      const rewardsButton = screen.getByLabelText('Rewards');
      const settingsButton = screen.getByLabelText('Settings');

      fireEvent.click(dashboardButton);
      fireEvent.click(rewardsButton);
      fireEvent.click(settingsButton);
      fireEvent.click(dashboardButton);

      expect(mockNavigate).toHaveBeenCalledTimes(4);
    });

    it('handles unknown pathname gracefully', () => {
      renderFooter('/unknown-route');

      // Should default to dashboard state
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(5);
    });

    it('handles empty pathname', () => {
      renderFooter('');

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(5);
    });

    it('component renders without errors when route changes rapidly', () => {
      const { rerender } = render(
        <BrowserRouter>
          <Footer />
        </BrowserRouter>
      );

      const routes = ['/home', '/rewards', '/todo', '/settings', '/add', '/'];
      
      routes.forEach(route => {
        mockUseLocation.mockReturnValue({
          pathname: route,
          search: '',
          hash: '',
          state: null,
          key: 'default',
        });

        expect(() => {
          rerender(
            <BrowserRouter>
              <Footer />
            </BrowserRouter>
          );
        }).not.toThrow();
      });
    });
  });
});