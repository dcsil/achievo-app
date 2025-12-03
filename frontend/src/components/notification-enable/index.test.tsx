import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationEnable from './index';

// Mock chrome API
const mockChrome = {
  permissions: {
    contains: jest.fn(),
    request: jest.fn(),
    onAdded: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onRemoved: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  notifications: {
    create: jest.fn(),
  },
};

describe('NotificationEnable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).chrome = mockChrome;
    jest.spyOn(console, 'error').mockImplementation(() => {});
    global.alert = jest.fn();
  });

  afterEach(() => {
    delete (window as any).chrome;
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default permission when no saved settings exist', async () => {
      mockChrome.permissions.contains.mockResolvedValue(false);
      mockChrome.storage.local.get.mockResolvedValue({});

      render(<NotificationEnable />);

      await waitFor(() => {
        expect(mockChrome.permissions.contains).toHaveBeenCalledWith({
          permissions: ['notifications'],
        });
      });

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        notificationSettings: { enabled: false, permission: 'default' },
      });
    });

    it('should initialize with granted permission when chrome permissions are granted', async () => {
      mockChrome.permissions.contains.mockResolvedValue(true);
      mockChrome.storage.local.get.mockResolvedValue({});

      render(<NotificationEnable />);

      await waitFor(() => {
        expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
          notificationSettings: { enabled: true, permission: 'granted' },
        });
      });

      expect(screen.getByText('✓ Chrome notifications enabled')).toBeInTheDocument();
    });

    it('should sync saved settings with current permission state', async () => {
      mockChrome.permissions.contains.mockResolvedValue(true);
      mockChrome.storage.local.get.mockResolvedValue({
        notificationSettings: { enabled: false, permission: 'default' },
      });

      render(<NotificationEnable />);

      await waitFor(() => {
        expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
          notificationSettings: { enabled: false, permission: 'granted' },
        });
      });
    });

    it('should not update storage if synced state matches saved state', async () => {
      mockChrome.permissions.contains.mockResolvedValue(true);
      mockChrome.storage.local.get.mockResolvedValue({
        notificationSettings: { enabled: true, permission: 'granted' },
      });

      render(<NotificationEnable />);

      await waitFor(() => {
        expect(mockChrome.permissions.contains).toHaveBeenCalled();
      });

      // Should only be called once for the initial check, not for syncing
      expect(mockChrome.storage.local.set).not.toHaveBeenCalled();
    });

    it('should handle initialization when chrome.storage is not available', async () => {
      const chromeWithoutStorage = {
        ...mockChrome,
        storage: undefined,
      };
      (window as any).chrome = chromeWithoutStorage;
      chromeWithoutStorage.permissions.contains.mockResolvedValue(true);

      render(<NotificationEnable />);

      await waitFor(() => {
        expect(chromeWithoutStorage.permissions.contains).toHaveBeenCalled();
      });

      expect(screen.getByText('✓ Chrome notifications enabled')).toBeInTheDocument();
    });

    it('should handle initialization when chrome.permissions is not available', async () => {
      const chromeWithoutPermissions = {
        ...mockChrome,
        permissions: undefined,
      };
      (window as any).chrome = chromeWithoutPermissions;

      render(<NotificationEnable />);

      // Should render without errors
      expect(screen.getByText('Enable Notifications')).toBeInTheDocument();
    });

    it('should handle initialization errors gracefully', async () => {
      mockChrome.permissions.contains.mockRejectedValue(new Error('Permission error'));

      render(<NotificationEnable />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Notification init error', expect.any(Error));
      });

      expect(screen.getByText('Enable Notifications')).toBeInTheDocument();
    });

    it('should initialize correctly when chrome is not defined', () => {
      delete (window as any).chrome;

      render(<NotificationEnable />);

      expect(screen.getByText('Enable Notifications')).toBeInTheDocument();
    });
  });

  describe('Permission Change Listeners', () => {
    it('should add permission change listeners on mount', async () => {
      mockChrome.permissions.contains.mockResolvedValue(false);
      mockChrome.storage.local.get.mockResolvedValue({});

      render(<NotificationEnable />);

      await waitFor(() => {
        expect(mockChrome.permissions.onAdded.addListener).toHaveBeenCalled();
        expect(mockChrome.permissions.onRemoved.addListener).toHaveBeenCalled();
      });
    });

    it('should handle permission added event', async () => {
      mockChrome.permissions.contains.mockResolvedValue(false);
      mockChrome.storage.local.get.mockResolvedValue({});

      let addedListener: any;
      mockChrome.permissions.onAdded.addListener.mockImplementation((fn) => {
        addedListener = fn;
      });

      render(<NotificationEnable />);

      await waitFor(() => {
        expect(addedListener).toBeDefined();
      });

      // Simulate permission added
      addedListener({ permissions: ['notifications'] });

      await waitFor(() => {
        expect(screen.getByText('✓ Chrome notifications enabled')).toBeInTheDocument();
      });
    });

    // it('should handle permission removed event', async () => {
    //   mockChrome.permissions.contains.mockResolvedValue(true);
    //   mockChrome.storage.local.get.mockResolvedValue({
    //     notificationSettings: { enabled: true, permission: 'granted' },
    //   });

    //   let removedListener: any;
    //   mockChrome.permissions.onRemoved.addListener.mockImplementation((fn) => {
    //     removedListener = fn;
    //   });

    //   render(<NotificationEnable />);

    //   await waitFor(() => {
    //     expect(removedListener).toBeDefined();
    //     expect(screen.getByText('✓ Chrome notifications enabled')).toBeInTheDocument();
    //   });

    //   // Simulate permission removed - this triggers the listener
    //   // The listener checks if 'notifications' is in the permissions array
    //   removedListener({ permissions: ['notifications'] });

    //   // The listener sets permission to 'denied' and enabled to false
    //   // Wait for the UI to reflect the change
    //   await waitFor(() => {
    //     const toggle = screen.getByRole('button');
    //     expect(toggle).toHaveClass('bg-gray-200');
    //   });
    // });

    it('should remove listeners on unmount', async () => {
      mockChrome.permissions.contains.mockResolvedValue(false);
      mockChrome.storage.local.get.mockResolvedValue({});

      const { unmount } = render(<NotificationEnable />);

      await waitFor(() => {
        expect(mockChrome.permissions.onAdded.addListener).toHaveBeenCalled();
      });

      unmount();

      expect(mockChrome.permissions.onAdded.removeListener).toHaveBeenCalled();
      expect(mockChrome.permissions.onRemoved.removeListener).toHaveBeenCalled();
    });

    it('should handle errors when removing listeners on unmount', async () => {
      mockChrome.permissions.contains.mockResolvedValue(false);
      mockChrome.storage.local.get.mockResolvedValue({});
      mockChrome.permissions.onAdded.removeListener.mockImplementation(() => {
        throw new Error('Remove error');
      });

      const { unmount } = render(<NotificationEnable />);

      await waitFor(() => {
        expect(mockChrome.permissions.onAdded.addListener).toHaveBeenCalled();
      });

      // Should not throw
      expect(() => unmount()).not.toThrow();
    });

    it('should not set up listeners when chrome.permissions is not available', () => {
      const chromeWithoutPermissions = {
        storage: mockChrome.storage,
      };
      (window as any).chrome = chromeWithoutPermissions;

      const { unmount } = render(<NotificationEnable />);

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Enabling Notifications', () => {
    it('should request permission and enable notifications when toggle is clicked', async () => {
      mockChrome.permissions.contains.mockResolvedValue(false);
      mockChrome.storage.local.get.mockResolvedValue({});
      mockChrome.permissions.request.mockResolvedValue(true);

      render(<NotificationEnable />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const toggle = screen.getByRole('button');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockChrome.permissions.request).toHaveBeenCalledWith({
          permissions: ['notifications'],
        });
      });

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        notificationSettings: { enabled: true, permission: 'granted' },
      });

      expect(mockChrome.notifications.create).toHaveBeenCalledWith({
        type: 'basic',
        iconUrl: '/achievo-clap-transparent.png',
        title: 'Notifications Enabled!',
        message: 'You will now receive Achievo task reminders.',
        priority: 2,
      });
    });

    it('should handle denied permission request', async () => {
      mockChrome.permissions.contains.mockResolvedValue(false);
      mockChrome.storage.local.get.mockResolvedValue({});
      mockChrome.permissions.request.mockResolvedValue(false);

      render(<NotificationEnable />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const toggle = screen.getByRole('button');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Notification permission was denied. You can enable it later in Chrome settings or by clicking the toggle again.'
        );
      });

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        notificationSettings: { enabled: false, permission: 'denied' },
      });
    });

    it('should handle permission request errors', async () => {
      mockChrome.permissions.contains.mockResolvedValue(false);
      mockChrome.storage.local.get.mockResolvedValue({});
      mockChrome.permissions.request.mockRejectedValue(new Error('Permission error'));

      render(<NotificationEnable />);

      await waitFor(() => {
        expect(mockChrome.storage.local.get).toHaveBeenCalled();
      });

      const toggle = screen.getByRole('button');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockChrome.permissions.request).toHaveBeenCalledWith({
          permissions: ['notifications'],
        });
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error requesting notification permission:',
          expect.any(Error)
        );
        expect(global.alert).toHaveBeenCalledWith(
          'Error requesting notification permission. Please try again.'
        );
      }, { timeout: 3000 });
    });

    // it('should enable notifications without chrome.storage', async () => {
    //   const chromeWithoutStorage = {
    //     permissions: {
    //       contains: jest.fn().mockResolvedValue(false),
    //       request: jest.fn().mockResolvedValue(true),
    //       onAdded: { addListener: jest.fn(), removeListener: jest.fn() },
    //       onRemoved: { addListener: jest.fn(), removeListener: jest.fn() },
    //     },
    //     notifications: {
    //       create: jest.fn(),
    //     },
    //   };
    //   (window as any).chrome = chromeWithoutStorage;

    //   render(<NotificationEnable />);

    //   await waitFor(() => {
    //     expect(chromeWithoutStorage.permissions.contains).toHaveBeenCalled();
    //   });

    //   const toggle = screen.getByRole('button');
    //   fireEvent.click(toggle);

    //   await waitFor(() => {
    //     expect(chromeWithoutStorage.permissions.request).toHaveBeenCalledWith({
    //       permissions: ['notifications'],
    //     });
    //   });
    // });

    it('should enable notifications without chrome.notifications', async () => {
      const chromeWithoutNotifications = {
        permissions: {
          contains: jest.fn().mockResolvedValue(false),
          request: jest.fn().mockResolvedValue(true),
          onAdded: { addListener: jest.fn(), removeListener: jest.fn() },
          onRemoved: { addListener: jest.fn(), removeListener: jest.fn() },
        },
        storage: {
          local: {
            get: jest.fn().mockResolvedValue({}),
            set: jest.fn().mockResolvedValue(undefined),
          },
        },
      };
      (window as any).chrome = chromeWithoutNotifications;

      render(<NotificationEnable />);

      await waitFor(() => {
        expect(chromeWithoutNotifications.permissions.contains).toHaveBeenCalled();
        expect(chromeWithoutNotifications.storage.local.get).toHaveBeenCalled();
      });

      const toggle = screen.getByRole('button');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(chromeWithoutNotifications.permissions.request).toHaveBeenCalledWith({
          permissions: ['notifications'],
        });
      });

      await waitFor(() => {
        expect(chromeWithoutNotifications.storage.local.set).toHaveBeenCalledWith({
          notificationSettings: { enabled: true, permission: 'granted' },
        });
      });
    });

    it('should toggle enabled state when chrome is not available', async () => {
      delete (window as any).chrome;

      render(<NotificationEnable />);

      const toggle = screen.getByRole('button');
      
      // Initial state should be enabled
      expect(toggle).toHaveClass('bg-orange-500');

      fireEvent.click(toggle);

      await waitFor(() => {
        expect(toggle).toHaveClass('bg-gray-200');
      });
    });
  });

  describe('Disabling Notifications', () => {
    it('should disable notifications when toggle is clicked', async () => {
      mockChrome.permissions.contains.mockResolvedValue(true);
      mockChrome.storage.local.get.mockResolvedValue({
        notificationSettings: { enabled: true, permission: 'granted' },
      });

      render(<NotificationEnable />);

      await waitFor(() => {
        expect(screen.getByText('✓ Chrome notifications enabled')).toBeInTheDocument();
      });

      const toggle = screen.getByRole('button');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
          notificationSettings: { enabled: false, permission: 'granted' },
        });
      });
    });

    it('should handle errors when disabling notifications', async () => {
      mockChrome.permissions.contains.mockResolvedValue(true);
      mockChrome.storage.local.get.mockResolvedValue({
        notificationSettings: { enabled: true, permission: 'granted' },
      });
      mockChrome.storage.local.set.mockRejectedValueOnce(new Error('Storage error'));

      render(<NotificationEnable />);

      await waitFor(() => {
        expect(screen.getByText('✓ Chrome notifications enabled')).toBeInTheDocument();
      });

      const toggle = screen.getByRole('button');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error disabling notifications:',
          expect.any(Error)
        );
      });
    });

    it('should disable notifications when chrome.permissions is not available', async () => {
      const chromeWithoutPermissions = {
        storage: {
          local: {
            get: jest.fn().mockResolvedValue({
              notificationSettings: { enabled: true, permission: 'default' }
            }),
            set: jest.fn().mockResolvedValue(undefined),
          },
        },
      };
      (window as any).chrome = chromeWithoutPermissions;

      render(<NotificationEnable />);

      await waitFor(() => {
        expect(chromeWithoutPermissions.storage.local.get).toHaveBeenCalled();
      });

      const toggle = screen.getByRole('button');
      
      // Should start enabled based on saved settings
      expect(toggle).toHaveClass('bg-orange-500');

      // Click to disable
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(toggle).toHaveClass('bg-gray-200');
      });

      // Click to enable again
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(toggle).toHaveClass('bg-orange-500');
      });
    });
  });

  describe('UI Rendering', () => {
    it('should display denied permission message', async () => {
      // Mock the contains to return false, indicating no permission
      mockChrome.permissions.contains.mockResolvedValue(false);
      // Return saved state with permission denied
      mockChrome.storage.local.get.mockResolvedValue({
        notificationSettings: { enabled: false, permission: 'denied' },
      });

      render(<NotificationEnable />);

      // The component needs to finish initialization first
      await waitFor(() => {
        expect(mockChrome.storage.local.get).toHaveBeenCalled();
        expect(mockChrome.permissions.contains).toHaveBeenCalled();
      });

      // After initialization, the component should apply the saved 'denied' state
      // However, looking at the code, the syncing logic changes permission to match current
      // So if contains returns false, permission becomes 'default', not 'denied'
      // We need to set this state after initialization by triggering a permission denial
      
      // Let's trigger the denied state by requesting and denying
      mockChrome.permissions.request.mockResolvedValue(false);
      
      const toggle = screen.getByRole('button');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockChrome.permissions.request).toHaveBeenCalled();
      });

      // Now the state should be denied
      await waitFor(() => {
        expect(toggle).toHaveClass('opacity-75');
        expect(screen.getByText('Notifications Blocked:')).toBeInTheDocument();
      });
      
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === 'Permission denied. Enable in Chrome settings or click toggle to try again.';
        })
      ).toBeInTheDocument();
      
      expect(screen.getByText(/Click the toggle above to request permission again/)).toBeInTheDocument();
    });

    it('should apply correct CSS classes when enabled', async () => {
      mockChrome.permissions.contains.mockResolvedValue(true);
      mockChrome.storage.local.get.mockResolvedValue({
        notificationSettings: { enabled: true, permission: 'granted' },
      });

      render(<NotificationEnable />);

      await waitFor(() => {
        const toggle = screen.getByRole('button');
        expect(toggle).toHaveClass('bg-orange-500');
      });
    });

    it('should apply correct CSS classes when disabled', async () => {
      mockChrome.permissions.contains.mockResolvedValue(false);
      mockChrome.storage.local.get.mockResolvedValue({});

      render(<NotificationEnable />);

      await waitFor(() => {
        const toggle = screen.getByRole('button');
        expect(toggle).toHaveClass('bg-gray-200');
      });
    });

    it('should apply opacity class when permission is denied', async () => {
      mockChrome.permissions.contains.mockResolvedValue(false);
      mockChrome.storage.local.get.mockResolvedValue({});
      // Mock request to return false (denied)
      mockChrome.permissions.request.mockResolvedValue(false);

      render(<NotificationEnable />);

      await waitFor(() => {
        expect(mockChrome.storage.local.get).toHaveBeenCalled();
      });

      // Click to request permission, which will be denied
      const toggle = screen.getByRole('button');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockChrome.permissions.request).toHaveBeenCalled();
      });

      // Now check for denied state
      await waitFor(() => {
        expect(toggle).toHaveClass('opacity-75');
        expect(screen.getByText('Notifications Blocked:')).toBeInTheDocument();
      });
    });
  });
});