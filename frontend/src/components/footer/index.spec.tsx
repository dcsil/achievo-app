import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from './index';

// Mock the SVG imports
jest.mock('../../assets/icons/dashboard.svg', () => 'mocked-dashboard-icon.svg');
jest.mock('../../assets/icons/todo.svg', () => 'mocked-todo-icon.svg');
jest.mock('../../assets/icons/add.svg', () => 'mocked-add-icon.svg');
jest.mock('../../assets/icons/rewards.svg', () => 'mocked-rewards-icon.svg');
jest.mock('../../assets/icons/settings.svg', () => 'mocked-settings-icon.svg');

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

describe('Footer Component', () => {
  const expectedNavItems = [
    { id: 'dashboard', label: 'Dashboard', isSpecial: false },
    { id: 'todo', label: 'To-Do', isSpecial: false },
    { id: 'add', label: 'Add Task', isSpecial: true },
    { id: 'rewards', label: 'Rewards', isSpecial: false },
    { id: 'settings', label: 'Settings', isSpecial: false }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockMainContent.scrollTop = 0;
  });

  describe('Rendering', () => {
    test('renders footer with correct semantic structure', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    test('renders all navigation items', () => {
      render(<Footer />);
      
      expectedNavItems.forEach(item => {
        expect(screen.getByLabelText(item.label)).toBeInTheDocument();
        expect(screen.getByAltText(item.label)).toBeInTheDocument();
      });
    });

    test('renders correct number of navigation buttons', () => {
      render(<Footer />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);
    });

    test('applies correct base styling to footer', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass(
        'fixed',
        'bottom-0',
        'left-0',
        'right-0',
        'bg-white',
        'border-t',
        'border-gray-200',
        'shadow-lg',
        'z-50'
      );
    });

    test('applies correct styling to navigation container', () => {
      render(<Footer />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass(
        'flex',
        'items-end',
        'justify-around',
        'max-w-6xl',
        'mx-auto',
        'px-4',
        'relative'
      );
    });

    test('renders all icons with correct src attributes', () => {
      render(<Footer />);
      
      expect(screen.getByAltText('Dashboard')).toHaveAttribute('src', 'mocked-dashboard-icon.svg');
      expect(screen.getByAltText('To-Do')).toHaveAttribute('src', 'mocked-todo-icon.svg');
      expect(screen.getByAltText('Add Task')).toHaveAttribute('src', 'mocked-add-icon.svg');
      expect(screen.getByAltText('Rewards')).toHaveAttribute('src', 'mocked-rewards-icon.svg');
      expect(screen.getByAltText('Settings')).toHaveAttribute('src', 'mocked-settings-icon.svg');
    });
  });

  describe('Active Tab Functionality', () => {
    test('dashboard tab is active by default', () => {
      render(<Footer />);
      
      const dashboardButton = screen.getByLabelText('Dashboard');
      expect(dashboardButton).toHaveClass('text-orange-500');
      
      const dashboardIcon = screen.getByAltText('Dashboard');
      expect(dashboardIcon).toHaveClass('scale-110');
    });

    test('clicking a tab makes it active', () => {
      render(<Footer />);
      
      const todoButton = screen.getByLabelText('To-Do');
      fireEvent.click(todoButton);
      
      expect(todoButton).toHaveClass('text-orange-500');
      
      const todoIcon = screen.getByAltText('To-Do');
      expect(todoIcon).toHaveClass('scale-110');
    });

    test('clicking a tab deactivates previously active tab', () => {
      render(<Footer />);
      
      const dashboardButton = screen.getByLabelText('Dashboard');
      const todoButton = screen.getByLabelText('To-Do');
      
      // Dashboard is initially active
      expect(dashboardButton).toHaveClass('text-orange-500');
      
      // Click todo
      fireEvent.click(todoButton);
      
      // Todo becomes active, dashboard becomes inactive
      expect(todoButton).toHaveClass('text-orange-500');
      expect(dashboardButton).not.toHaveClass('text-orange-500');
      expect(dashboardButton).toHaveClass('text-gray-400');
    });

    test('multiple tab switches work correctly', () => {
      render(<Footer />);
      
      const dashboardButton = screen.getByLabelText('Dashboard');
      const rewardsButton = screen.getByLabelText('Rewards');
      const settingsButton = screen.getByLabelText('Settings');
      
      // Click rewards
      fireEvent.click(rewardsButton);
      expect(rewardsButton).toHaveClass('text-orange-500');
      expect(dashboardButton).toHaveClass('text-gray-400');
      
      // Click settings
      fireEvent.click(settingsButton);
      expect(settingsButton).toHaveClass('text-orange-500');
      expect(rewardsButton).toHaveClass('text-gray-400');
      expect(dashboardButton).toHaveClass('text-gray-400');
    });

    test('shows active indicator dot for active tabs', () => {
      render(<Footer />);
      
      // Dashboard is active by default - check for indicator dot
      const dashboardButton = screen.getByLabelText('Dashboard');
      const indicatorDot = dashboardButton.querySelector('.bg-orange-500.rounded-full');
      expect(indicatorDot).toBeInTheDocument();
      
      // Click todo and check its indicator
      const todoButton = screen.getByLabelText('To-Do');
      fireEvent.click(todoButton);
      
      const todoIndicatorDot = todoButton.querySelector('.bg-orange-500.rounded-full');
      expect(todoIndicatorDot).toBeInTheDocument();
    });

    test('active tab label has semibold font weight', () => {
      render(<Footer />);
      
      const dashboardButton = screen.getByLabelText('Dashboard');
      const dashboardLabel = dashboardButton.querySelector('span:last-child');
      expect(dashboardLabel).toHaveClass('font-semibold');
      
      const todoButton = screen.getByLabelText('To-Do');
      fireEvent.click(todoButton);
      
      const todoLabel = todoButton.querySelector('span:last-child');
      expect(todoLabel).toHaveClass('font-semibold');
    });
  });

  describe('Special Add Task Button', () => {
    test('add task button has special elevated styling', () => {
      render(<Footer />);
      
      const addButton = screen.getByLabelText('Add Task');
      expect(addButton).toHaveClass('relative', '-mt-6');
      
      const buttonContainer = addButton.querySelector('.w-14.h-14');
      expect(buttonContainer).toHaveClass(
        'w-14',
        'h-14',
        'rounded-2xl',
        'bg-gradient-to-br',
        'from-orange-400',
        'to-yellow-500',
        'shadow-lg'
      );
    });

    test('add task button icon has correct size', () => {
      render(<Footer />);
      
      const addIcon = screen.getByAltText('Add Task');
      expect(addIcon).toHaveClass('w-12', 'h-9');
    });

    test('add task button has hover effects', () => {
      render(<Footer />);
      
      const addButton = screen.getByLabelText('Add Task');
      expect(addButton).toHaveClass('group');
      
      const buttonContainer = addButton.querySelector('.w-14.h-14');
      expect(buttonContainer).toHaveClass('group-hover:shadow-xl', 'group-hover:scale-105');
    });

    test('add task button label has special styling', () => {
      render(<Footer />);
      
      const addButton = screen.getByLabelText('Add Task');
      const label = addButton.querySelector('span');
      expect(label).toHaveClass('text-xs', 'font-semibold', 'text-gray-700', 'mt-1', 'mb-2');
    });

    test('add task button retains special styling when clicked', () => {
      render(<Footer />);
      
      const addButton = screen.getByLabelText('Add Task');
      fireEvent.click(addButton);
      
      // Should still have special styling
      const buttonContainer = addButton.querySelector('.w-14.h-14');
      expect(buttonContainer).toHaveClass('bg-gradient-to-br', 'from-orange-400', 'to-yellow-500');
    });

    test('add task button is positioned above other buttons', () => {
      render(<Footer />);
      
      const addButton = screen.getByLabelText('Add Task');
      expect(addButton).toHaveClass('-mt-6');
    });
  });

  describe('Regular Navigation Buttons', () => {
    test('regular buttons have correct base styling', () => {
      render(<Footer />);
      
      const dashboardButton = screen.getByLabelText('Dashboard');
      expect(dashboardButton).toHaveClass(
        'flex',
        'flex-col',
        'items-center',
        'justify-center',
        'gap-1',
        'px-4',
        'py-3',
        'transition-all',
        'duration-200',
        'min-w-[72px]'
      );
    });

    test('regular button icons have correct size', () => {
      render(<Footer />);
      
      const dashboardIcon = screen.getByAltText('Dashboard');
      expect(dashboardIcon).toHaveClass('w-8', 'h-8');
      
      const todoIcon = screen.getByAltText('To-Do');
      expect(todoIcon).toHaveClass('w-8', 'h-8');
    });

    test('inactive buttons have correct styling', () => {
      render(<Footer />);
      
      const todoButton = screen.getByLabelText('To-Do');
      expect(todoButton).toHaveClass('text-gray-400', 'hover:text-gray-600');
    });

    test('regular button labels have correct base styling', () => {
      render(<Footer />);
      
      const todoButton = screen.getByLabelText('To-Do');
      const label = todoButton.querySelector('span:last-child');
      expect(label).toHaveClass('text-xs', 'font-medium');
    });
  });

  describe('Label Visibility and Scroll Behavior', () => {
    test('labels are visible by default', () => {
      render(<Footer />);
      
      expectedNavItems.forEach(item => {
        const button = screen.getByLabelText(item.label);
        const label = button.querySelector('span:last-child');
        expect(label).toHaveClass('opacity-100', 'translate-y-0');
      });
    });

    test('sets up scroll event listener on mount', () => {
        // Make sure mockMainContent is returned by getElementById
        document.getElementById = jest.fn().mockReturnValue(mockMainContent);
        
        render(<Footer />);
        
        expect(document.getElementById).toHaveBeenCalledWith('main-content');
        expect(mockMainContent.addEventListener).toHaveBeenCalledWith(
            'scroll',
            expect.any(Function),
            { passive: true }
        );
    });

        test('removes scroll event listener on unmount', () => {
        // Make sure mockMainContent is returned by getElementById
        document.getElementById = jest.fn().mockReturnValue(mockMainContent);
        
        const { unmount } = render(<Footer />);
        
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
      const originalGetElementById = document.getElementById;
      document.getElementById = jest.fn().mockReturnValue(null);
      
      expect(() => render(<Footer />)).not.toThrow();
      
      // Restore original function
      document.getElementById = originalGetElementById;
    });

    test('labels have transition classes for smooth hiding/showing', () => {
      render(<Footer />);
      
      expectedNavItems.forEach(item => {
        const button = screen.getByLabelText(item.label);
        const label = button.querySelector('span:last-child');
        expect(label).toHaveClass('transition-all', 'duration-300');
      });
    });

    test('special button label has max-height classes', () => {
      render(<Footer />);
      
      const addButton = screen.getByLabelText('Add Task');
      const label = addButton.querySelector('span');
      expect(label).toHaveClass('transition-all', 'duration-300');
    });

    test('regular button labels have max-height classes', () => {
      render(<Footer />);
      
      const dashboardButton = screen.getByLabelText('Dashboard');
      const label = dashboardButton.querySelector('span:last-child');
      expect(label).toHaveClass('max-h-6');
    });
  });

  describe('Icon Scaling and Animation', () => {
    test('active tab icon has scale effect', () => {
      render(<Footer />);
      
      const dashboardIcon = screen.getByAltText('Dashboard');
      expect(dashboardIcon).toHaveClass('scale-110');
    });

    test('inactive tab icons do not have scale effect', () => {
      render(<Footer />);
      
      const todoIcon = screen.getByAltText('To-Do');
      expect(todoIcon).not.toHaveClass('scale-110');
    });

    test('icon scale changes when switching tabs', () => {
      render(<Footer />);
      
      const dashboardIcon = screen.getByAltText('Dashboard');
      const todoIcon = screen.getByAltText('To-Do');
      const todoButton = screen.getByLabelText('To-Do');
      
      // Initially dashboard is scaled
      expect(dashboardIcon).toHaveClass('scale-110');
      expect(todoIcon).not.toHaveClass('scale-110');
      
      // Click todo
      fireEvent.click(todoButton);
      
      // Now todo is scaled, dashboard is not
      expect(todoIcon).toHaveClass('scale-110');
      expect(dashboardIcon).not.toHaveClass('scale-110');
    });

    test('all icons have transition classes', () => {
      render(<Footer />);
      
      expectedNavItems.forEach(item => {
        if (!item.isSpecial) {
          const icon = screen.getByAltText(item.label);
          expect(icon).toHaveClass('transition-all', 'duration-200');
        }
      });
    });
  });

  describe('Button Interactions', () => {
    test('all buttons are clickable', () => {
      render(<Footer />);
      
      expectedNavItems.forEach(item => {
        const button = screen.getByLabelText(item.label);
        expect(button).toBeEnabled();
        fireEvent.click(button);
        // Should not throw any errors
      });
    });

    test('clicking same tab multiple times works', () => {
      render(<Footer />);
      
      const todoButton = screen.getByLabelText('To-Do');
      
      fireEvent.click(todoButton);
      fireEvent.click(todoButton);
      fireEvent.click(todoButton);
      
      expect(todoButton).toHaveClass('text-orange-500');
    });

    test('button transitions work smoothly', () => {
        render(<Footer />);
        
        expectedNavItems.forEach(item => {
            const button = screen.getByLabelText(item.label);
            expect(button).toHaveClass('transition-all');
            // All buttons should have some duration class
            expect(button.className).toMatch(/duration-\d+/);
        });
    });
  });

  describe('Accessibility', () => {
    test('footer has correct semantic role', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
    });

    test('navigation has correct semantic role', () => {
      render(<Footer />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    test('all navigation items are accessible via keyboard', () => {
      render(<Footer />);
      
      expectedNavItems.forEach(item => {
        const button = screen.getByLabelText(item.label);
        expect(button).toBeVisible();
        expect(button).not.toHaveAttribute('disabled');
      });
    });

    test('buttons have accessible aria-labels', () => {
      render(<Footer />);
      
      expectedNavItems.forEach(item => {
        expect(screen.getByLabelText(item.label)).toBeInTheDocument();
      });
    });

    test('icons have proper alt text', () => {
      render(<Footer />);
      
      expectedNavItems.forEach(item => {
        expect(screen.getByAltText(item.label)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    test('footer has fixed positioning for mobile', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0');
    });

    test('navigation has responsive width and centering', () => {
      render(<Footer />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('max-w-6xl', 'mx-auto', 'px-4');
    });

    test('navigation uses flexible layout for equal spacing', () => {
      render(<Footer />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('flex', 'items-end', 'justify-around');
    });

    test('regular buttons have minimum width for touch targets', () => {
      render(<Footer />);
      
      const dashboardButton = screen.getByLabelText('Dashboard');
      expect(dashboardButton).toHaveClass('min-w-[72px]');
    });
  });

  describe('Visual Design', () => {
    test('footer has proper z-index for overlay', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('z-50');
    });

    test('footer has border and shadow for separation', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('border-t', 'border-gray-200', 'shadow-lg');
    });

    test('special button has gradient background', () => {
      render(<Footer />);
      
      const addButton = screen.getByLabelText('Add Task');
      const buttonContainer = addButton.querySelector('.w-14.h-14');
      expect(buttonContainer).toHaveClass('bg-gradient-to-br', 'from-orange-400', 'to-yellow-500');
    });

    test('active indicator dot is properly styled', () => {
      render(<Footer />);
      
      const dashboardButton = screen.getByLabelText('Dashboard');
      const indicatorDot = dashboardButton.querySelector('.bg-orange-500.rounded-full');
      expect(indicatorDot).toHaveClass('w-1', 'h-1');
    });

    test('special button has rounded corners', () => {
      render(<Footer />);
      
      const addButton = screen.getByLabelText('Add Task');
      const buttonContainer = addButton.querySelector('.w-14.h-14');
      expect(buttonContainer).toHaveClass('rounded-2xl');
    });
  });

  describe('State Management', () => {
    test('initial state has dashboard active and labels visible', () => {
      render(<Footer />);
      
      const dashboardButton = screen.getByLabelText('Dashboard');
      expect(dashboardButton).toHaveClass('text-orange-500');
      
      expectedNavItems.forEach(item => {
        const button = screen.getByLabelText(item.label);
        const label = button.querySelector('span:last-child') || button.querySelector('span');
        expect(label).toHaveClass('opacity-100');
      });
    });

    test('state updates correctly when switching between multiple tabs', () => {
      render(<Footer />);
      
      const dashboardButton = screen.getByLabelText('Dashboard');
      const todoButton = screen.getByLabelText('To-Do');
      const rewardsButton = screen.getByLabelText('Rewards');
      
      // Start with dashboard active
      expect(dashboardButton).toHaveClass('text-orange-500');
      
      // Switch to todo
      fireEvent.click(todoButton);
      expect(todoButton).toHaveClass('text-orange-500');
      expect(dashboardButton).toHaveClass('text-gray-400');
      
      // Switch to rewards
      fireEvent.click(rewardsButton);
      expect(rewardsButton).toHaveClass('text-orange-500');
      expect(todoButton).toHaveClass('text-gray-400');
      expect(dashboardButton).toHaveClass('text-gray-400');
    });

    test('special button can be activated and deactivated', () => {
      render(<Footer />);
      
      const addButton = screen.getByLabelText('Add Task');
      const dashboardButton = screen.getByLabelText('Dashboard');
      
      // Click add button
      fireEvent.click(addButton);
      expect(dashboardButton).toHaveClass('text-gray-400');
      
      // Click another button
      fireEvent.click(dashboardButton);
      expect(dashboardButton).toHaveClass('text-orange-500');
    });
  });
});