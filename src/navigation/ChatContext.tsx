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
import { useAuth } from './AuthContext';

type ChatContextValue = {
  unreadCount: number;
  conversations: ChatConversationUi[];
  loadingInbox: boolean;
  refreshInbox: () => Promise<void>;
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

  const refreshInbox = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      return;
    }
    setLoadingInbox(true);
    try {
      const items = await fetchInbox(userId, accessToken);
      setConversations(items);
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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!isSignedIn || !accessToken || !userId) {
        await disconnectChatHub();
        setUnreadCount(0);
        setConversations([]);
        return;
      }

      await connectChatHub(accessToken);
      if (cancelled) return;
      await refreshUnread();
      await refreshInbox();
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, accessToken, userId, refreshUnread, refreshInbox]);

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

      if (isChatHubConnected()) {
        try {
          await hubSendMessage(conversationId, body, clientMessageId);
          // Hub broadcasts to group including sender; listener will append.
          // Also optimistically return a stub so UI can wait on echo or use REST fallback path.
          return null;
        } catch (e) {
          console.warn('[Chat] hub send failed, falling back to REST', e);
        }
      }

      const dto = await sendMessageRest(
        conversationId,
        userId,
        body,
        clientMessageId,
        accessToken,
      );
      return dto;
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
