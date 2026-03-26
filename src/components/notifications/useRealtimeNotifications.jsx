import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNotificationToast } from './NotificationToast';

/**
 * Consolidated notification polling with visibility-based pausing.
 *
 * Previous setup had 4 competing intervals:
 *   - useRealtimeNotifications: 10s polling
 *   - NotificationService unread query: 60s polling
 *   - Walk reminders: 5min polling
 *   - Review reminders: 30min polling
 *
 * New setup: single interval that polls every 30s when tab is visible,
 * pauses completely when tab is hidden. Reduces API calls from ~10/min to ~2/min.
 */
const POLL_INTERVAL_VISIBLE = 30_000;  // 30s when tab is active
const POLL_INTERVAL_HIDDEN = 0;        // Pause when tab is hidden

export function useRealtimeNotifications(user) {
  const queryClient = useQueryClient();
  const toast = useNotificationToast();
  const lastCheckRef = useRef(Date.now());
  const intervalRef = useRef(null);
  const isVisibleRef = useRef(!document.hidden);

  const checkNotifications = useCallback(async () => {
    if (!user?.email || !isVisibleRef.current) return;

    try {
      const notifications = await base44.entities.Notification.filter({
        recipient_email: user.email,
        is_read: false
      }, '-created_date', 10);

      const newNotifications = notifications.filter(n =>
        new Date(n.created_date).getTime() > lastCheckRef.current
      );

      if (newNotifications.length > 0) {
        queryClient.invalidateQueries(['unreadNotifications']);

        const latest = newNotifications[0];
        const toastType = latest.type === 'emergency' ? 'warning' :
                          latest.type === 'payment' ? 'success' : 'info';

        toast[toastType](latest.title, latest.message, latest.action_url ? {
          label: 'Ver',
          onClick: () => window.location.href = latest.action_url
        } : undefined);

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(latest.title, {
            body: latest.message,
            icon: '/logo.png',
            badge: '/favicon.png',
            tag: latest.id,
            requireInteraction: latest.priority === 'high'
          });
        }

        lastCheckRef.current = Date.now();
      }
    } catch (error) {
      console.error('Notification check failed:', error);
    }
  }, [user?.email, queryClient, toast]);

  useEffect(() => {
    if (!user?.email) return;

    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (isVisibleRef.current) {
        intervalRef.current = setInterval(checkNotifications, POLL_INTERVAL_VISIBLE);
      }
    };

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      if (isVisibleRef.current) {
        checkNotifications(); // Immediate check when tab becomes visible
        startPolling();
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial check + start polling
    checkNotifications();
    startPolling();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user?.email, checkNotifications]);
}