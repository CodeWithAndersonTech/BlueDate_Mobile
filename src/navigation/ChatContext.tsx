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
  ChatConversationUi,
  ChatMessageDto,
  fetchInbox,
  fetchUnreadCount,
  markConversationRead,
} from '../api/chat';
import {
  connectChatHub,
  disconnectChatHub,
  hubJoinConversation,
  hubLeaveConversation,
  hubMarkRead,
  hubSendMessage,
  isChatHubConnected,
  setChatHubHandlers,
} from '../services/chat/chatHub';
import { sendMessageRest } from '../api/chat';
import { prefetchMediaUris } from '../services/photos/prefetchMedia';
import { ApiError } from '../api/client';
import { useAuth } from './AuthContext';

type ChatContextValue = {
  unreadCount: number;
  conversations: ChatConversationUi[];
  loadingInbox: boolean;
  refreshInbox: (opts?: { force?: boolean }) => Promise<void>;
  refreshUnread: () => Promise<void>;
  joinConversation: (conversationId: number) => Promise<void>;
  leaveConversation: (conversationId: number) => Promise<void>;
  sendChatMessage: (
    conversationId: number,
    body: string,
    clientMessageId?: string,
  ) => Promise<ChatMessageDto | null>;
  markRead: (
    conversationId: number,
    lastReadMessageId?: number | null,
  ) => Promise<void>;
  /** Live message listener registration for the open thread. */
  subscribeMessages: (
    conversationId: number,
    listener: (message: ChatMessageDto) => void,
  ) => () => void;
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { userId, accessToken, isSignedIn } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState<ChatConversationUi[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const inboxHydrated = useRef(false);
  const lastInboxAt = useRef(0);

  const threadListeners = useRef(
    new Map<number, Set<(message: ChatMessageDto) => void>>(),
  );

  const refreshUnread = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await fetchUnreadCount(userId, accessToken);
      setUnreadCount(count);
    } catch (e) {
      console.warn('[Chat] unread failed', e);
    }
  }, [userId, accessToken]);

  const refreshInbox = useCallback(async (opts?: { force?: boolean }) => {
    if (!userId) {
      setConversations([]);
      inboxHydrated.current = false;
      lastInboxAt.current = 0;
      return;
    }
    if (
      !opts?.force &&
      inboxHydrated.current &&
      Date.now() - lastInboxAt.current < 12_000
    ) {
      return;
    }
    lastInboxAt.current = Date.now();
    if (!inboxHydrated.current) {
      setLoadingInbox(true);
    }
    try {
      const items = await fetchInbox(userId, accessToken);
      inboxHydrated.current = true;
      setConversations(items);
      void prefetchMediaUris(
        items.map(c => c.avatar).filter(Boolean).slice(0, 12),
        1500,
      );
      const total = items.reduce((n, c) => n + (c.unreadCount || 0), 0);
      setUnreadCount(total);
    } catch (e) {
      console.warn('[Chat] inbox failed', e);
    } finally {
      setLoadingInbox(false);
    }
  }, [userId, accessToken]);

  useEffect(() => {
    setChatHubHandlers({
      onReceiveMessage: message => {
        const listeners = threadListeners.current.get(message.ConversationId);
        listeners?.forEach(fn => fn(message));

        // Bump inbox preview / unread locally.
        setConversations(prev => {
          const id = String(message.ConversationId);
          const idx = prev.findIndex(c => c.id === id);
          if (idx < 0) {
            // Unknown conversation — refresh inbox.
            refreshInbox();
            return prev;
          }
          const mine = userId != null && message.SenderId === userId;
          const next = [...prev];
          const row = { ...next[idx] };
          row.lastMessage = message.Body;
          row.lastMessageAt = 'now';
          row.lastMessageAtIso = new Date().toISOString();
          if (!mine) {
            row.unreadCount = (row.unreadCount || 0) + 1;
          }
          next.splice(idx, 1);
          next.unshift(row);
          return next;
        });

        if (userId != null && message.SenderId !== userId) {
          setUnreadCount(n => n + 1);
        }
      },
      onUnreadCountChanged: count => setUnreadCount(count),
      onMessagesRead: () => {
        // Peer read our messages — optional UI tick later.
      },
    });
  }, [userId, refreshInbox]);

  const tokenRef = useRef(accessToken);
  tokenRef.current = accessToken;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!isSignedIn || !userId) {
        await disconnectChatHub();
        setUnreadCount(0);
        setConversations([]);
        return;
      }

      const token = tokenRef.current;
      if (!token) {
        return;
      }

      await connectChatHub(token);
      if (cancelled) return;
      await refreshUnread();
      await refreshInbox();
    })();

    return () => {
      cancelled = true;
    };
    // Token rotation must not reconnect or full-refetch — that flashes the app.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- session identity only
  }, [isSignedIn, userId]);

  useEffect(() => {
    return () => {
      disconnectChatHub();
    };
  }, []);

  const joinConversation = useCallback(async (conversationId: number) => {
    await hubJoinConversation(conversationId);
  }, []);

  const leaveConversation = useCallback(async (conversationId: number) => {
    await hubLeaveConversation(conversationId);
  }, []);

  const sendChatMessage = useCallback(
    async (
      conversationId: number,
      body: string,
      clientMessageId?: string,
    ): Promise<ChatMessageDto | null> => {
      if (!userId) return null;

      // Persist via REST first. Hub invoke on IIS/RN often 411/times out and
      // the thread then shows a generic “check your connection” alert even
      // when the API is reachable. Server still broadcasts ReceiveMessage.
      try {
        return await sendMessageRest(
          conversationId,
          userId,
          body,
          clientMessageId,
          accessToken,
        );
      } catch (e) {
        const business = e instanceof ApiError && e.status !== 0;
        if (business || !isChatHubConnected()) {
          throw e;
        }
        try {
          await hubSendMessage(conversationId, body, clientMessageId);
          return null;
        } catch (hubErr) {
          console.warn('[Chat] hub send failed after REST', hubErr);
          throw e;
        }
      }
    },
    [userId, accessToken],
  );

  const markRead = useCallback(
    async (conversationId: number, lastReadMessageId?: number | null) => {
      if (!userId) return;

      const viaHub = await hubMarkRead(conversationId, lastReadMessageId).catch(
        () => false,
      );
      if (!viaHub) {
        const count = await markConversationRead(
          conversationId,
          userId,
          lastReadMessageId,
          accessToken,
        );
        setUnreadCount(count);
      }

      setConversations(prev =>
        prev.map(c =>
          c.id === String(conversationId) ? { ...c, unreadCount: 0 } : c,
        ),
      );
    },
    [userId, accessToken],
  );

  const subscribeMessages = useCallback(
    (conversationId: number, listener: (message: ChatMessageDto) => void) => {
      let set = threadListeners.current.get(conversationId);
      if (!set) {
        set = new Set();
        threadListeners.current.set(conversationId, set);
      }
      set.add(listener);
      return () => {
        set?.delete(listener);
        if (set && set.size === 0) {
          threadListeners.current.delete(conversationId);
        }
      };
    },
    [],
  );

  const value = useMemo(
    () => ({
      unreadCount,
      conversations,
      loadingInbox,
      refreshInbox,
      refreshUnread,
      joinConversation,
      leaveConversation,
      sendChatMessage,
      markRead,
      subscribeMessages,
    }),
    [
      unreadCount,
      conversations,
      loadingInbox,
      refreshInbox,
      refreshUnread,
      joinConversation,
      leaveConversation,
      sendChatMessage,
      markRead,
      subscribeMessages,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChat must be used inside ChatProvider');
  }
  return ctx;
}
