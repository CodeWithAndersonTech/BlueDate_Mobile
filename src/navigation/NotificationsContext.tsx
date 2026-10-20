import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AppNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationList,
} from '../api/notifications';
import { onNotificationsChanged } from '../services/chat/chatHub';
import { useAuth } from './AuthContext';

type NotificationsContextValue = {
  unreadCount: number;
  items: AppNotification[];
  visitorsThisWeek: number;
  canSeeVisitors: boolean;
  /** True only before the first successful load; later refreshes keep showing cached rows. */
  initialLoading: boolean;
  refresh: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
};

const EMPTY: NotificationList = {
  items: [],
  unreadCount: 0,
  visitorsThisWeek: 0,
  canSeeVisitors: false,
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { userId, isSignedIn } = useAuth();
  const [data, setData] = useState<NotificationList>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const inFlight = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async () => {
    if (!isSignedIn || !userId) return;
    if (inFlight.current) return inFlight.current;
    inFlight.current = (async () => {
      try {
        setData(await fetchNotifications());
        setLoaded(true);
      } catch (e) {
        console.warn('[Notifications] load failed', e);
      } finally {
        inFlight.current = null;
      }
    })();
    return inFlight.current;
  }, [isSignedIn, userId]);

  useEffect(() => {
    if (!isSignedIn || !userId) {
      setData(EMPTY);
      setLoaded(false);
      return;
    }
    void refresh();
  }, [isSignedIn, userId, refresh]);

  useEffect(
    () =>
      onNotificationsChanged(count => {
        setData(prev => ({ ...prev, unreadCount: count }));
        void refresh();
      }),
    [refresh],
  );

  const markAllRead = useCallback(async () => {
    setData(prev => ({
      ...prev,
      unreadCount: 0,
      items: prev.items.map(n => (n.isRead ? n : { ...n, isRead: true })),
    }));
    try {
      await markAllNotificationsRead();
    } catch {
      void refresh();
    }
  }, [refresh]);

  const markRead = useCallback(async (id: number) => {
    setData(prev => {
      const target = prev.items.find(n => n.id === id);
      if (!target || target.isRead) return prev;
      return {
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1),
        items: prev.items.map(n => (n.id === id ? { ...n, isRead: true } : n)),
      };
    });
    try {
      const count = await markNotificationRead(id);
      setData(prev => ({ ...prev, unreadCount: count }));
    } catch {
      /* best effort */
    }
  }, []);

  const value = useMemo(
    () => ({
      unreadCount: data.unreadCount,
      items: data.items,
      visitorsThisWeek: data.visitorsThisWeek,
      canSeeVisitors: data.canSeeVisitors,
      initialLoading: !loaded,
      refresh,
      markAllRead,
      markRead,
    }),
    [data, loaded, refresh, markAllRead, markRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used inside NotificationsProvider');
  }
  return ctx;
}
