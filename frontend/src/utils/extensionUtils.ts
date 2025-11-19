// Utility functions for communicating with the Chrome extension service worker

/**
 * Update user activity to prevent notifications when user is actively using the extension
 */
export const updateUserActivity = async (): Promise<void> => {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      await chrome.runtime.sendMessage({ action: 'updateUserActivity' });
    }
  } catch (error) {
    console.error('Error updating user activity:', error);
  }
};

/**
 * Set the user ID in extension storage for task fetching
 */
export const setUserId = async (userId: string): Promise<void> => {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      await chrome.runtime.sendMessage({ 
        action: 'setUserId', 
        userId: userId 
      });
    }
  } catch (error) {
    console.error('Error setting user ID:', error);
  }
};

/**
 * Get the current count of remaining tasks for today
 */
export const getRemainingTasksCount = async (): Promise<number> => {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const response = await chrome.runtime.sendMessage({ action: 'getRemainingTasks' });
      return response?.remainingTasks || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error getting remaining tasks:', error);
    return 0;
  }
};

/**
 * Initialize activity tracking for the extension
 * Call this when your app loads and on user interactions
 */
export const initializeActivityTracking = (): void => {
  // Track user activity on various events
  const updateActivity = () => updateUserActivity();

  // Update activity on page load
  updateActivity();

  // Track mouse/keyboard activity
  document.addEventListener('click', updateActivity);
  document.addEventListener('keypress', updateActivity);
  document.addEventListener('scroll', updateActivity);
  document.addEventListener('mousemove', updateActivity);

  // Update activity when the window gains focus
  window.addEventListener('focus', updateActivity);
  
  // Track when extension becomes visible (even if not focused)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      updateActivity();
    }
  });

  // Set up periodic activity updates while extension is actively being used (every 2 minutes)
  setInterval(() => {
    // Only update if document is visible AND the window has focus
    // This ensures we only consider the extension "active" when user is actually looking at it
    if (document.visibilityState === 'visible' && document.hasFocus()) {
      updateActivity();
    }
  }, 2 * 60 * 1000); // 2 minutes - more frequent updates
};

/**
 * Check if the code is running in a Chrome extension environment
 */
export const isExtensionEnvironment = (): boolean => {
  return typeof chrome !== 'undefined' && 
         chrome.runtime && 
         chrome.runtime.id !== undefined;
};

/**
 * Debug function to check current activity status
 * Useful for testing the notification system
 */
export const debugActivityStatus = async (): Promise<void> => {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const storage = await chrome.storage.local.get(['isExtensionActive', 'lastActiveTime', 'user_id']);
      const timeSinceActive = Date.now() - (storage.lastActiveTime || 0);
      
      // Check focused window status
      let focusedWindowInfo = 'Unable to check';
      try {
        const focusedWindow = await chrome.windows.getCurrent();
        focusedWindowInfo = `Window ${focusedWindow.id}, focused: ${focusedWindow.focused}`;
      } catch (e) {
        focusedWindowInfo = 'Error checking window';
      }
      
      console.log('🔍 Extension Activity Debug:', {
        isExtensionActive: storage.isExtensionActive,
        lastActiveTime: new Date(storage.lastActiveTime).toLocaleTimeString(),
        timeSinceActive: `${Math.round(timeSinceActive / 1000)} seconds ago`,
        userId: storage.user_id,
        documentVisible: document.visibilityState === 'visible',
        documentFocused: document.hasFocus(),
        focusedWindow: focusedWindowInfo,
        willShowNotification: !storage.isExtensionActive || timeSinceActive > (1 * 60 * 1000)
      });
    }
  } catch (error) {
    console.error('Error debugging activity status:', error);
  }
};