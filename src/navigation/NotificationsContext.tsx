import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  AppNotification,
  clearAllNotifications,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationList,
} from '../api/notifications';
import { resolveMediaUrl } from '../api/photos';
import {
  onNotificationReceived,
  onNotificationsChanged,
} from '../services/chat/chatHub';
import { getActiveConversationId } from '../services/notifications/activeConversation';
import { appStorage } from '../utils/appStorage';
import { useAuth } from './AuthContext';

type NotificationsContextValue = {
  unreadCount: number;
  items: AppNotification[];
  visitorsThisWeek: number;
  canSeeVisitors: boolean;
  /** True only before the first successful load; later refreshes keep showing cached rows. */
  initialLoading: boolean;
  toast: AppNotification | null;
  dismissToast: () => void;
  refresh: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
};

const EMPTY: NotificationList = {
  items: [],
  unreadCount: 0,
  visitorsThisWeek: 0,
  canSeeVisitors: false,
};

const CACHE_KEY = '@meerk/notifications';
const POLL_MS = 20_000;

const NotificationsContext = createContext<NotificationsContextValue | undefined>(
  undefined,
);

function shouldToast(item: AppNotification) {
  if (item.type === 'message' && item.entityId) {
    return getActiveConversationId() !== item.entityId;
  }
  return true;
}

function upsertItem(
  items: AppNotification[],
  incoming: AppNotification,
): AppNotification[] {
  const without = items.filter(n => n.id !== incoming.id);
  return [incoming, ...without].slice(0, 50);
}

async function readCache(): Promise<NotificationList | null> {
  try {
    const raw = await appStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NotificationList;
    if (!Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data: NotificationList) {
  void appStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { userId, isSignedIn } = useAuth();
  const [data, setData] = useState<NotificationList>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  const lastAt = useRef(0);
  const knownIds = useRef(new Set<number>());

  const applyList = useCallback((next: NotificationList, announceNew: boolean) => {
    const previous = knownIds.current;
    const newest = next.items.find(n => !previous.has(n.id) && !n.isRead);
    knownIds.current = new Set(next.items.map(n => n.id));
    setData(next);
    writeCache(next);
    if (announceNew && newest && shouldToast(newest)) {
      setToast(newest);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!isSignedIn || !userId) return;
    if (lastAt.current > 0 && Date.now() - lastAt.current < 15_000) return;
    if (inFlight.current) return inFlight.current;
    inFlight.current = (async () => {
      try {
        const next = await fetchNotifications();
        const announce = knownIds.current.size > 0;
        applyList(next, announce);
        lastAt.current = Date.now();
        setLoaded(true);
      } catch (e) {
        console.warn('[Notifications] load failed', e);
      } finally {
        inFlight.current = null;
      }
    })();
    return inFlight.current;
  }, [isSignedIn, userId, applyList]);

  useEffect(() => {
    if (!isSignedIn || !userId) {
      lastAt.current = 0;
      setData(EMPTY);
      setLoaded(false);
      setToast(null);
      knownIds.current = new Set();
      void appStorage.removeItem(CACHE_KEY);
      return;
    }
    let cancelled = false;
    void readCache().then(cached => {
      if (cancelled || !cached) return;
      knownIds.current = new Set(cached.items.map(n => n.id));
      setData(cached);
      setLoaded(true);
    });
    void refresh();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, userId, refresh]);

  useEffect(
    () =>
      onNotificationsChanged(count => {
        setData(prev => ({ ...prev, unreadCount: count }));
        if (knownIds.current.size === 0) {
          void refresh();
        }
      }),
    [refresh],
  );

  useEffect(
    () =>
      onNotificationReceived((incoming, unreadCount) => {
        void (async () => {
          let item = incoming;
          if (item.actor?.profileImage) {
            const uri = await resolveMediaUrl(item.actor.profileImage);
            if (uri) {
              item = { ...item, actor: { ...item.actor, profileImage: uri } };
            }
          }
          setData(prev => {
            const next = {
              ...prev,
              unreadCount,
              items: upsertItem(prev.items, item),
            };
            writeCache(next);
            knownIds.current.add(item.id);
            return next;
          });
          if (shouldToast(item)) {
            setToast(item);
          }
        })();
      }),
    [],
  );

  useEffect(() => {
    if (!isSignedIn || !userId) return undefined;
    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        void refresh();
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') {
        void refresh();
      }
    }, POLL_MS);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, [isSignedIn, userId, refresh]);

  const markAllRead = useCallback(async () => {
    setData(prev => {
      const next = {
        ...prev,
        unreadCount: 0,
        items: prev.items.map(n => (n.isRead ? n : { ...n, isRead: true })),
      };
      writeCache(next);
      return next;
    });
    setToast(null);
    try {
      await markAllNotificationsRead();
    } catch {
      void refresh();
    }
  }, [refresh]);

  const clearAll = useCallback(async () => {
    const previous = data;
    setData(prev => {
      const next = {
        ...prev,
        unreadCount: 0,
        items: [],
      };
      writeCache(next);
      return next;
    });
    knownIds.current = new Set();
    setToast(null);
    try {
      await clearAllNotifications();
    } catch (error) {
      setData(previous);
      writeCache(previous);
      knownIds.current = new Set(previous.items.map(n => n.id));
      throw error;
    }
  }, [data]);

  const markRead = useCallback(async (id: number) => {
    setData(prev => {
      const target = prev.items.find(n => n.id === id);
      if (!target || target.isRead) return prev;
      const next = {
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1),
        items: prev.items.map(n => (n.id === id ? { ...n, isRead: true } : n)),
      };
      writeCache(next);
      return next;
    });
    setToast(current => (current?.id === id ? null : current));
    try {
      const count = await markNotificationRead(id);
      setData(prev => {
        const next = { ...prev, unreadCount: count };
        writeCache(next);
        return next;
      });
    } catch {
      /* best effort */
    }
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const value = useMemo(
    () => ({
      unreadCount: data.unreadCount,
      items: data.items,
      visitorsThisWeek: data.visitorsThisWeek,
      canSeeVisitors: data.canSeeVisitors,
      initialLoading: !loaded,
      toast,
      dismissToast,
      refresh,
      markAllRead,
      markRead,
      clearAll,
    }),
    [data, loaded, toast, dismissToast, refresh, markAllRead, markRead, clearAll],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used inside NotificationsProvider');
  }
  return ctx;
}
