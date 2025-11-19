// Basic service worker for Achievo extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Achievo extension installed successfully!');
});

// Handle extension icon clicks to open side panel
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
    console.log('Side panel opened');
    
    // Mark that user is actively using the extension
    chrome.storage.local.set({
      lastActiveTime: Date.now(),
      isExtensionActive: true
    });

  } catch (error) {
    console.error('Error opening side panel:', error);
  }
});

// Track when user closes/minimizes extension
chrome.runtime.onSuspend.addListener(() => {
  chrome.storage.local.set({
    isExtensionActive: false,
    lastActiveTime: Date.now()
  });
});

// Variables to track extension state
let isExtensionActive = false;
let lastActiveTime = Date.now();

// Listen for messages from the frontend to track user activity
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateUserActivity') {
    chrome.storage.local.set({
      isExtensionActive: true,
      lastActiveTime: Date.now()
    });
    sendResponse({ status: 'activity_updated' });
  } else if (request.action === 'setUserId') {
    chrome.storage.local.set({
      user_id: request.userId
    });
    sendResponse({ status: 'user_id_set' });
  } else if (request.action === 'getRemainingTasks') {
    getTodaysRemainingTasks().then(count => {
      sendResponse({ remainingTasks: count });
    });
    return true; // Keep the message channel open for async response
  }
});

// Optional: Handle side panel setup
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started');
  // Initialize extension state
  chrome.storage.local.set({
    isExtensionActive: false,
    lastActiveTime: Date.now()
  });
});

// Function to fetch remaining tasks for today
async function getTodaysRemainingTasks() {
  try {
    // Get user_id from storage (you'll need to store this when user logs in)
    const result = await chrome.storage.local.get(['user_id']);
    const userId = result.user_id;
    
    if (!userId) {
      console.log('No user_id found in storage');
      return 0;
    }

    // Calculate today's date range
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    // Format dates for API
    const startDate = todayStart.toISOString();
    const endDate = todayEnd.toISOString();

    // Fetch tasks from your backend API
    const response = await fetch(`http://localhost:5000/db/tasks?user_id=${userId}&scheduled_start_at=${startDate}&scheduled_end_at=${endDate}&is_completed=false`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const tasks = await response.json();
    return Array.isArray(tasks) ? tasks.length : 0;
    
  } catch (error) {
    console.error('Error fetching today\'s tasks:', error);
    return 0;
  }
}

// Function to check if user is actively using the extension
async function isUserActive() {
  try {
    const result = await chrome.storage.local.get(['isExtensionActive', 'lastActiveTime']);
    const { isExtensionActive, lastActiveTime } = result;

    // Consider user inactive if extension hasn't been used for 10 minutes
    const inactiveThreshold = 10 * 60 * 1000; // 10 minutes in milliseconds
    const isRecentlyActive = (Date.now() - (lastActiveTime || 0)) < inactiveThreshold;
    
    return isExtensionActive && isRecentlyActive;
  } catch (error) {
    console.error('Error checking user activity:', error);
    return false;
  }
}

// general alarms to remind users to check Achievo at the top of every hour (except at active hours)
const activeHours = [9, 11, 13, 15, 17, 19]; // 9am, 11am, 1pm, 3pm, 5pm, 7pm
for (let i = 0; i < 24; i++) {
  if (!activeHours.includes(i)) { // Skip active hours
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
  periodInMinutes: 1440 }); // Daily task reminder every 24 hours

// Create periodic task count reminders (every 2 hours during active hours)
activeHours.forEach(hour => {
  const reminderTime = new Date();
  reminderTime.setHours(hour, 0, 0, 0);
  
  // If the time has already passed today, set it for tomorrow
  if (reminderTime.getTime() <= Date.now()) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }
  
  chrome.alarms.create(`task-count-reminder-${hour}`, {
    when: reminderTime.getTime(),
    periodInMinutes: 1440 // Repeat daily
  });
});

// Handle all alarms (both task reminders and daily reminders)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('Alarm triggered:', alarm.name);
  
  // Handle task-specific reminders
  if (alarm.name.startsWith('exercise-')) {
    const taskId = alarm.name.replace('exercise-', '');
    chrome.notifications.create(`notification-${taskId}`, {
      type: 'basic',
      iconUrl: 'achievo-clap-transparent.png',
      title: 'Workout Reminder',
      message: 'Time to go work out 💪!',
      priority: 2,
    });
    return;
  }

  if (alarm.name.startsWith('break-')) {
    const taskId = alarm.name.replace('break-', '');
    chrome.notifications.create(`notification-${taskId}`, {
      type: 'basic',
      iconUrl: 'achievo-clap-transparent.png',
      title: 'Take a Break Reminder',
      message: 'Time to take a break!',
      priority: 2,
    });
    return;
  }

  // Handle periodic task count reminders
  if (alarm.name.startsWith('task-count-reminder-')) {
    const userActive = await isUserActive();
    
    // Only show notification if user is not actively using the extension
    if (!userActive) {
      const remainingTasks = await getTodaysRemainingTasks();
      
      if (remainingTasks > 0) {
        const message = remainingTasks === 1 
          ? 'You have 1 task remaining for today! 📋'
          : `You have ${remainingTasks} tasks remaining for today! 📋`;
          
        chrome.notifications.create(`task-count-${Date.now()}`, {
          type: 'basic',
          iconUrl: 'achievo-clap-transparent.png',
          title: 'Tasks Remaining',
          message: message,
          priority: 2,
        });
      }
    } else {
      console.log('User is active, skipping task count notification');
    }
    return;
  }

  // Handle daily task reminders
  if (alarm.name === 'task-reminder') {
    chrome.notifications.create(`task-reminder-${Date.now()}`, {
      type: 'basic',
      iconUrl: 'achievo-clap-transparent.png',
      title: 'Daily Task Reminder',
      message: 'Time to tackle your work/study tasks! Stay focused and earn those points! 🎯📚',
      priority: 2,
    });
    return;
  }

  // Handle general alarms
  if (alarm.name.startsWith('general-reminder-')) {
    const userActive = await isUserActive();
    
    // Only show general reminder if user is not active
    if (!userActive) {
      chrome.notifications.create('general', {
        type: 'basic',
        iconUrl: 'achievo-clap-transparent.png',
        title: 'Achievo Reminder',
        message: 'Time to check your Achievo tasks!',
        priority: 2,
      });
    }
  }
});