// Basic service worker for Achievo extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Achievo extension installed successfully!');
});

// Handle extension icon clicks to open side panel
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
    console.log('Side panel opened');

    // example notification that pops up after 1 minute of opening the side panel
    chrome.alarms.create({ delayInMinutes: 2 });

  } catch (error) {
    console.error('Error opening side panel:', error);
  }
});

// Optional: Handle side panel setup
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started');
});

chrome.alarms.onAlarm.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'achievo-clap-transparent.png',
    title: 'Achievo Reminder',
    message: 'Time to check your Achievo tasks!',
    priority: 2,
  });
});