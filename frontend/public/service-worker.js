// Basic service worker for Achievo extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Achievo extension installed successfully!');
});

// Handle extension icon clicks to open side panel
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
    console.log('Side panel opened');
  } catch (error) {
    console.error('Error opening side panel:', error);
  }
});

// Optional: Handle side panel setup
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started');
});