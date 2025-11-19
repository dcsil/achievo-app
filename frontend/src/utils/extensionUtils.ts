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

  // Update activity when the window gains focus
  window.addEventListener('focus', updateActivity);

  // Set up periodic activity updates while user is active (every 5 minutes)
  setInterval(() => {
    // Only update if the document is visible and has focus
    if (document.visibilityState === 'visible' && document.hasFocus()) {
      updateActivity();
    }
  }, 5 * 60 * 1000); // 5 minutes
};

/**
 * Check if the code is running in a Chrome extension environment
 */
export const isExtensionEnvironment = (): boolean => {
  return typeof chrome !== 'undefined' && 
         chrome.runtime && 
         chrome.runtime.id !== undefined;
};