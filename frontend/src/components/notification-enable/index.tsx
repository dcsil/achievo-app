import React, { useEffect, useState } from 'react';

type PermissionState = 'default' | 'granted' | 'denied';

const NotificationEnable: React.FC = () => {
  const [notifications, setNotifications] = useState({
    enabled: true,
    permission: 'default' as PermissionState,
  });

  useEffect(() => {
    const initialize = async () => {
      const chromeAny = (window as any).chrome;
      if (typeof chromeAny !== 'undefined') {
        try {
          let currentPermission: PermissionState = 'default';
          if (chromeAny.permissions) {
            const hasPermission = await chromeAny.permissions.contains({ permissions: ['notifications'] });
            currentPermission = hasPermission ? 'granted' : 'default';
          }

          if (chromeAny.storage) {
            const result = await chromeAny.storage.local.get(['notificationSettings']);
            if (result.notificationSettings) {
              const saved = result.notificationSettings;
              const synced = {
                ...saved,
                permission: currentPermission,
                enabled: saved.enabled && currentPermission === 'granted'
              };
              setNotifications(synced);

              if (chromeAny.storage && (synced.enabled !== saved.enabled || synced.permission !== saved.permission)) {
                await chromeAny.storage.local.set({ notificationSettings: synced });
              }
            } else {
              const initial = { enabled: currentPermission === 'granted', permission: currentPermission };
              setNotifications(initial);
              await chromeAny.storage.local.set({ notificationSettings: initial });
            }
          } else {
            setNotifications(prev => ({ ...prev, permission: currentPermission, enabled: prev.enabled && currentPermission === 'granted' }));
          }
        } catch (err) {
          // swallow but log
          // eslint-disable-next-line no-console
          console.error('Notification init error', err);
        }
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    const chromeAny = (window as any).chrome;
    if (typeof chromeAny !== 'undefined' && chromeAny.permissions) {
      const handlePermissionChange = (permissions: any) => {
        if (permissions.permissions?.includes('notifications')) {
          setNotifications(prev => ({ ...prev, permission: 'granted', enabled: true }));
        } else {
          setNotifications(prev => ({ ...prev, permission: 'denied', enabled: false }));
        }
      };

      chromeAny.permissions.onAdded.addListener(handlePermissionChange);
      chromeAny.permissions.onRemoved.addListener(handlePermissionChange);

      return () => {
        try {
          chromeAny.permissions.onAdded.removeListener(handlePermissionChange);
          chromeAny.permissions.onRemoved.removeListener(handlePermissionChange);
        } catch (e) {
          // ignore remove errors
        }
      };
    }
    return undefined;
  }, []);

  const handleNotificationChange = async () => {
    const chromeAny = (window as any).chrome;
    const newEnabled = !notifications.enabled;

    if (newEnabled) {
      if (typeof chromeAny !== 'undefined' && chromeAny.permissions) {
        try {
          const granted = await chromeAny.permissions.request({ permissions: ['notifications'] });
          if (granted) {
            const newState = { ...notifications, enabled: true, permission: 'granted' as PermissionState };
            setNotifications(newState);
            if (chromeAny.storage) await chromeAny.storage.local.set({ notificationSettings: newState });
            if (chromeAny.notifications) {
              chromeAny.notifications.create({
                type: 'basic',
                iconUrl: '/achievo-clap-transparent.png',
                title: 'Notifications Enabled!',
                message: 'You will now receive Achievo task reminders.',
                priority: 2
              });
            }
          } else {
            const newState = { ...notifications, enabled: false, permission: 'denied' as PermissionState };
            setNotifications(newState);
            if (chromeAny.storage) await chromeAny.storage.local.set({ notificationSettings: newState });
            alert('Notification permission was denied. You can enable it later in Chrome settings or by clicking the toggle again.');
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error requesting notification permission:', error);
          alert('Error requesting notification permission. Please try again.');
        }
      } else {
        setNotifications(prev => ({ ...prev, enabled: newEnabled }));
      }
    } else {
      if (typeof chromeAny !== 'undefined' && chromeAny.permissions) {
        try {
          const newState = { ...notifications, enabled: false, permission: notifications.permission };
          setNotifications(newState);
          if (chromeAny.storage) await chromeAny.storage.local.set({ notificationSettings: newState });
          // keep permission; user can re-enable quickly
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error disabling notifications:', error);
          setNotifications(prev => ({ ...prev, enabled: false }));
        }
      } else {
        setNotifications(prev => ({ ...prev, enabled: newEnabled }));
      }
    }
  };

  return (
    <div className="space-y-4">
    <div className="flex items-center justify-between">
        <div>
        <p className="font-medium text-gray-700">Enable Notifications</p>
        <p className="text-sm text-gray-500">
            Receive notifications for tasks reminders
            {notifications.permission === 'denied' && (
            <span className="block text-red-500 text-xs mt-1">
                Permission denied. Enable in Chrome settings or click toggle to try again.
            </span>
            )}
            {notifications.permission === 'granted' && notifications.enabled && (
            <span className="block text-green-500 text-xs mt-1">✓ Chrome notifications enabled</span>
            )}
        </p>
        </div>
        <button
        onClick={handleNotificationChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            notifications.enabled ? 'bg-orange-500' : 'bg-gray-200'
        } ${notifications.permission === 'denied' ? 'opacity-75' : ''}`}
        >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            notifications.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
        </button>
    </div>

    {notifications.permission === 'denied' && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
        <p className="text-sm text-red-700">
            <strong>Notifications Blocked:</strong> To enable notifications, you can:
        </p>
        <ul className="text-xs text-red-600 mt-1 ml-4 list-disc">
            <li>Click the toggle above to request permission again</li>
            <li>Go to Chrome Settings → Privacy & Security → Site Settings → Notifications</li>
            <li>Look for this extension and set it to "Allow"</li>
        </ul>
        </div>
    )}
    </div>
  );
};

export default NotificationEnable;
