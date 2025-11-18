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
    // chrome.alarms.create({ delayInMinutes: 1 });

  } catch (error) {
    console.error('Error opening side panel:', error);
  }
});

// Optional: Handle side panel setup
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started');
});

// Handle all alarms (both task reminders and daily reminders)
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('Alarm triggered:', alarm.name);
  
  // Handle task-specific reminders
  if (alarm.name.startsWith('personal-')) {
    const taskId = alarm.name.replace('personal-', '');
    chrome.notifications.create(`notification-${taskId}`, {
      type: 'basic',
      iconUrl: 'achievo-clap-transparent.png',
      title: 'Task Reminder',
      message: 'Time to take a break!',
      priority: 2,
    });
  }
  // Handle daily task reminders
  else if (alarm.name === 'task-reminder') {
    chrome.notifications.create(`task-reminder-${Date.now()}`, {
      type: 'basic',
      iconUrl: 'achievo-clap-transparent.png',
      title: 'Daily Task Reminder',
      message: 'Time to tackle your work/study tasks! Stay focused and earn those points! 🎯📚',
      priority: 2,
    });
  }
  // Handle general alarms
  else {
    chrome.notifications.create(`general-${Date.now()}`, {
      type: 'basic',
      iconUrl: 'achievo-clap-transparent.png',
      title: 'Achievo Reminder',
      message: 'Time to check your Achievo tasks!',
      priority: 2,
    });
  }
});