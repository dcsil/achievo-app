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

// general alarms to remind users to check Achievo at the top of every hour (except at 10:00am)
for (let i = 0; i < 24; i++) {
  if (i !== 10) { // Skip 10:00 AM
    const alarmTime = new Date();
    alarmTime.setHours(i, 0, 0, 0); // Set to the top of the hour
    // If the time has already passed today, set it for tomorrow
    if (alarmTime.getTime() <= Date.now()) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }

    chrome.alarms.create(`general-reminder-${i}`, {
      when: alarmTime.getTime(),
      periodInMinutes: 1440 // Repeat every 24 hours
    });
  }
}

// daily task reminder alarm (at around first time user is likely to open chrome -- set to 10:00am)
const taskTime = new Date();
taskTime.setHours(10, 0, 0, 0); // 10:00 AM daily 

// If the time has already passed today, set it for tomorrow
if (taskTime.getTime() <= Date.now()) {
  taskTime.setDate(taskTime.getDate() + 1);
}

chrome.alarms.create('task-reminder', { 
  when: taskTime.getTime(),
  periodInMinutes: 1440 }); // Daily task reminder every  hours

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
    chrome.notifications.create('general', {
      type: 'basic',
      iconUrl: 'achievo-clap-transparent.png',
      title: 'Achievo Reminder',
      message: 'Time to check your Achievo tasks!',
      priority: 2,
    });
  }
});