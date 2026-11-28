import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/api/notification.api';

const isNotificationSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window;

export const useBrowserNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [permission, setPermission] = useState(() =>
    isNotificationSupported() ? Notification.permission : 'unsupported'
  );

  // Track already-seen notification IDs so old notifications don't spam on page load
  const seenIdsRef = useRef(new Set());
  const isInitializedRef = useRef(false);

  const requestPermission = useCallback(async () => {
    if (!isNotificationSupported()) return 'unsupported';
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      return 'denied';
    }
  }, []);

  const showOsNotification = useCallback(
    (notif) => {
      if (!isNotificationSupported() || Notification.permission !== 'granted') return;

      try {
        const title = notif.title || 'Oshud Wala Update';
        const body = notif.desc || notif.body || notif.message || 'You have a new notification.';

        const osNotif = new Notification(title, {
          body,
          icon: '/logo-light.png',
          badge: '/logo-light.png',
          tag: String(notif.id || Date.now()),
          renotify: false,
        });

        osNotif.onclick = () => {
          window.focus();
          if (notif.link) {
            navigate(notif.link);
          }
          osNotif.close();
        };
      } catch (err) {
        console.warn('Browser notification error:', err);
      }
    },
    [navigate]
  );

  const checkNewNotifications = useCallback(async () => {
    if (!user || !isAuthenticated) return;

    try {
      const data = await notificationApi.getNotifications({}, user);
      const items = data?.items || [];
      const unread =
        typeof data?.unreadCount === 'number'
          ? data.unreadCount
          : items.filter((n) => !n.isRead && !n.readAt).length;

      // Keep Header Bell badge in sync
      window.dispatchEvent(
        new CustomEvent('oshud_unread_count_updated', {
          detail: { count: unread, userId: user?.id || user?.userId },
        })
      );

      // First load: just record existing IDs without firing popups
      if (!isInitializedRef.current) {
        items.forEach((n) => seenIdsRef.current.add(n.id));
        isInitializedRef.current = true;
        return;
      }

      // Subsequent polls: fire OS notification for any brand-new unread item
      items.forEach((n) => {
        const isUnread = !n.isRead && !n.readAt;
        if (!seenIdsRef.current.has(n.id)) {
          seenIdsRef.current.add(n.id);
          if (isUnread) {
            showOsNotification(n);
          }
        }
      });
    } catch {
      // Silent fallback
    }
  }, [user, isAuthenticated, showOsNotification]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      seenIdsRef.current.clear();
      isInitializedRef.current = false;
      return;
    }

    checkNewNotifications();

    // Poll every 20 seconds for live alerts
    const interval = setInterval(checkNewNotifications, 20000);

    const handleInstantSync = () => checkNewNotifications();
    window.addEventListener('oshud_order_created', handleInstantSync);
    window.addEventListener('oshud_order_status_updated', handleInstantSync);
    window.addEventListener('oshud_prescription_created', handleInstantSync);
    window.addEventListener('oshud_prescription_verified', handleInstantSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('oshud_order_created', handleInstantSync);
      window.removeEventListener('oshud_order_status_updated', handleInstantSync);
      window.removeEventListener('oshud_prescription_created', handleInstantSync);
      window.removeEventListener('oshud_prescription_verified', handleInstantSync);
    };
  }, [isAuthenticated, user, checkNewNotifications]);

  return {
    permission,
    requestPermission,
    isSupported: isNotificationSupported(),
  };
};

export default useBrowserNotifications;