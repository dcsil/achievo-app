import {
  updateUserActivity,
  setUserId,
  getRemainingTasksCount,
  initializeActivityTracking,
  isExtensionEnvironment,
  debugActivityStatus,
} from './extensionUtils';

// Mock chrome API
const mockChrome = {
  runtime: {
    id: 'test-extension-id',
    sendMessage: jest.fn(),
  },
  storage: {
    local: {
      get: jest.fn(),
    },
  },
  windows: {
    getCurrent: jest.fn(),
  },
};

describe('Extension Utils', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Setup chrome mock
    (global as any).chrome = mockChrome;
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Spy on console.error
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.useRealTimers();
    
    // Clean up event listeners
    document.removeEventListener('click', jest.fn());
    document.removeEventListener('keypress', jest.fn());
    document.removeEventListener('scroll', jest.fn());
    document.removeEventListener('mousemove', jest.fn());
    document.removeEventListener('visibilitychange', jest.fn());
    window.removeEventListener('focus', jest.fn());
  });

  describe('updateUserActivity', () => {
    it('should send updateUserActivity message to chrome runtime', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue(undefined);

      await updateUserActivity();

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'updateUserActivity',
      });
    });

    it('should handle errors and log to console', async () => {
      const error = new Error('Runtime error');
      mockChrome.runtime.sendMessage.mockRejectedValue(error);

      await updateUserActivity();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating user activity:',
        error
      );
    });

    it('should not send message if chrome is undefined', async () => {
      (global as any).chrome = undefined;

      await updateUserActivity();

      expect(mockChrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('should not send message if chrome.runtime is undefined', async () => {
      (global as any).chrome = { runtime: undefined };

      await updateUserActivity();

      expect(mockChrome.runtime.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('setUserId', () => {
    it('should send setUserId message with userId', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue(undefined);
      const userId = 'user-123';

      await setUserId(userId);

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'setUserId',
        userId: userId,
      });
    });

    it('should handle errors and log to console', async () => {
      const error = new Error('Set user ID error');
      mockChrome.runtime.sendMessage.mockRejectedValue(error);

      await setUserId('user-123');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error setting user ID:',
        error
      );
    });

    it('should not send message if chrome is undefined', async () => {
      (global as any).chrome = undefined;

      await setUserId('user-123');

      expect(mockChrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('should not send message if chrome.runtime is undefined', async () => {
      (global as any).chrome = { runtime: undefined };

      await setUserId('user-123');

      expect(mockChrome.runtime.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('getRemainingTasksCount', () => {
    it('should return remaining tasks count from response', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue({
        remainingTasks: 5,
      });

      const result = await getRemainingTasksCount();

      expect(result).toBe(5);
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'getRemainingTasks',
      });
    });

    it('should return 0 if response is undefined', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue(undefined);

      const result = await getRemainingTasksCount();

      expect(result).toBe(0);
    });

    it('should return 0 if remainingTasks is missing in response', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue({});

      const result = await getRemainingTasksCount();

      expect(result).toBe(0);
    });

    it('should handle errors and return 0', async () => {
      const error = new Error('Get tasks error');
      mockChrome.runtime.sendMessage.mockRejectedValue(error);

      const result = await getRemainingTasksCount();

      expect(result).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error getting remaining tasks:',
        error
      );
    });

    it('should return 0 if chrome is undefined', async () => {
      (global as any).chrome = undefined;

      const result = await getRemainingTasksCount();

      expect(result).toBe(0);
    });

    it('should return 0 if chrome.runtime is undefined', async () => {
      (global as any).chrome = { runtime: undefined };

      const result = await getRemainingTasksCount();

      expect(result).toBe(0);
    });
  });

  describe('initializeActivityTracking', () => {
    it('should call updateUserActivity on initialization', () => {
      mockChrome.runtime.sendMessage.mockResolvedValue(undefined);

      initializeActivityTracking();

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'updateUserActivity',
      });
    });

    it('should update activity on click events', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue(undefined);
      
      initializeActivityTracking();
      mockChrome.runtime.sendMessage.mockClear();

      document.dispatchEvent(new Event('click'));
      await Promise.resolve();

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'updateUserActivity',
      });
    });

    it('should update activity on keypress events', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue(undefined);
      
      initializeActivityTracking();
      mockChrome.runtime.sendMessage.mockClear();

      document.dispatchEvent(new Event('keypress'));
      await Promise.resolve();

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'updateUserActivity',
      });
    });

    it('should update activity on scroll events', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue(undefined);
      
      initializeActivityTracking();
      mockChrome.runtime.sendMessage.mockClear();

      document.dispatchEvent(new Event('scroll'));
      await Promise.resolve();

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'updateUserActivity',
      });
    });

    it('should update activity on mousemove events', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue(undefined);
      
      initializeActivityTracking();
      mockChrome.runtime.sendMessage.mockClear();

      document.dispatchEvent(new Event('mousemove'));
      await Promise.resolve();

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'updateUserActivity',
      });
    });

    it('should update activity on window focus', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue(undefined);
      
      initializeActivityTracking();
      mockChrome.runtime.sendMessage.mockClear();

      window.dispatchEvent(new Event('focus'));
      await Promise.resolve();

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'updateUserActivity',
      });
    });

    it('should update activity on visibilitychange when visible', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue(undefined);
      
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        configurable: true,
        value: 'visible',
      });

      initializeActivityTracking();
      mockChrome.runtime.sendMessage.mockClear();

      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'updateUserActivity',
      });
    });

    it('should not update activity on visibilitychange when hidden', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue(undefined);
      
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        configurable: true,
        value: 'hidden',
      });

      initializeActivityTracking();
      mockChrome.runtime.sendMessage.mockClear();

      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();

      expect(mockChrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('should update activity periodically when visible and focused', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue(undefined);
      
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        configurable: true,
        value: 'visible',
      });
      
      Object.defineProperty(document, 'hasFocus', {
        writable: true,
        configurable: true,
        value: () => true,
      });

      initializeActivityTracking();
      mockChrome.runtime.sendMessage.mockClear();

      // Fast-forward 2 minutes
      jest.advanceTimersByTime(2 * 60 * 1000);
      await Promise.resolve();

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'updateUserActivity',
      });
    });

    it('should not update activity periodically when hidden', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue(undefined);
      
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        configurable: true,
        value: 'hidden',
      });

      initializeActivityTracking();
      mockChrome.runtime.sendMessage.mockClear();

      jest.advanceTimersByTime(2 * 60 * 1000);
      await Promise.resolve();

      expect(mockChrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('should not update activity periodically when not focused', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue(undefined);
      
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        configurable: true,
        value: 'visible',
      });
      
      Object.defineProperty(document, 'hasFocus', {
        writable: true,
        configurable: true,
        value: () => false,
      });

      initializeActivityTracking();
      mockChrome.runtime.sendMessage.mockClear();

      jest.advanceTimersByTime(2 * 60 * 1000);
      await Promise.resolve();

      expect(mockChrome.runtime.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('isExtensionEnvironment', () => {
    it('should return true when chrome runtime is available', () => {
      const result = isExtensionEnvironment();

      expect(result).toBe(true);
    });

    it('should return false when chrome is undefined', () => {
      (global as any).chrome = undefined;

      const result = isExtensionEnvironment();

      expect(result).toBe(false);
    });

    it('should return false when chrome.runtime.id is undefined', () => {
      (global as any).chrome = {
        runtime: { id: undefined },
      };

      const result = isExtensionEnvironment();

      expect(result).toBe(false);
    });
  });

  describe('debugActivityStatus', () => {
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('should log debug information with all data available', async () => {
      const mockStorage = {
        isExtensionActive: true,
        lastActiveTime: Date.now() - 30000, // 30 seconds ago
        user_id: 'user-123',
      };

      mockChrome.storage.local.get.mockResolvedValue(mockStorage);
      mockChrome.windows.getCurrent.mockResolvedValue({
        id: 1,
        focused: true,
      });

      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        configurable: true,
        value: 'visible',
      });

      Object.defineProperty(document, 'hasFocus', {
        writable: true,
        configurable: true,
        value: () => true,
      });

      await debugActivityStatus();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '🔍 Extension Activity Debug:',
        expect.objectContaining({
          isExtensionActive: true,
          userId: 'user-123',
          documentVisible: true,
          documentFocused: true,
          focusedWindow: 'Window 1, focused: true',
        })
      );
    });

    it('should handle missing storage values', async () => {
      mockChrome.storage.local.get.mockResolvedValue({});
      mockChrome.windows.getCurrent.mockResolvedValue({
        id: 1,
        focused: false,
      });

      await debugActivityStatus();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '🔍 Extension Activity Debug:',
        expect.objectContaining({
          isExtensionActive: undefined,
          userId: undefined,
        })
      );
    });

    it('should handle window API errors', async () => {
      mockChrome.storage.local.get.mockResolvedValue({});
      mockChrome.windows.getCurrent.mockRejectedValue(
        new Error('Window error')
      );

      await debugActivityStatus();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '🔍 Extension Activity Debug:',
        expect.objectContaining({
          focusedWindow: 'Error checking window',
        })
      );
    });

    it('should handle errors and log to console.error', async () => {
      const error = new Error('Debug error');
      mockChrome.storage.local.get.mockRejectedValue(error);

      await debugActivityStatus();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error debugging activity status:',
        error
      );
    });

    it('should not log if chrome is undefined', async () => {
      (global as any).chrome = undefined;

      await debugActivityStatus();

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should not log if chrome.runtime is undefined', async () => {
      (global as any).chrome = { runtime: undefined };

      await debugActivityStatus();

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});