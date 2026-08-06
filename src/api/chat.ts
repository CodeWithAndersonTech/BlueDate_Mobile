import { API_PATHS } from '../config/api';
import { apiRequest, ApiEnvelope } from './client';
import { resolveMediaUrl } from './photos';
import { formatRelativeTime } from './social';

export type InboxItemDto = {
  ConversationId: number;
  OtherUserId: number;
  OtherFullName: string;
  OtherUsername: string;
  OtherProfileImage?: string | null;
  LastMessagePreview?: string | null;
  LastMessageAt?: string | null;
  UnreadCount: number;
};

export type ChatMessageDto = {
  Id: number;
  ConversationId: number;
  SenderId: number;
  Body: string;
  ClientMessageId?: string | null;
  CreatedDate: string;
  IsMine?: boolean;
};

export type ChatConversationUi = {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatar?: string;
  online: boolean;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

export type ChatMessageUi = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  sentAt: string;
  sentAtIso: string;
  read?: boolean;
  clientMessageId?: string;
};

type RawInboxItem = {
  ConversationId?: number;
  conversationId?: number;
  OtherUserId?: number;
  otherUserId?: number;
  OtherFullName?: string;
  otherFullName?: string;
  OtherUsername?: string;
  otherUsername?: string;
  OtherProfileImage?: string | null;
  otherProfileImage?: string | null;
  LastMessagePreview?: string | null;
  lastMessagePreview?: string | null;
  LastMessageAt?: string | null;
  lastMessageAt?: string | null;
  UnreadCount?: number;
  unreadCount?: number;
};

type RawMessage = {
  Id?: number;
  id?: number;
  ConversationId?: number;
  conversationId?: number;
  SenderId?: number;
  senderId?: number;
  Body?: string;
  body?: string;
  ClientMessageId?: string | null;
  clientMessageId?: string | null;
  CreatedDate?: string;
  createdDate?: string;
  IsMine?: boolean;
  isMine?: boolean;
};

function pickNum(...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

function normalizeInboxItem(raw: RawInboxItem): InboxItemDto {
  return {
    ConversationId: pickNum(raw.ConversationId, raw.conversationId),
    OtherUserId: pickNum(raw.OtherUserId, raw.otherUserId),
    OtherFullName: raw.OtherFullName ?? raw.otherFullName ?? '',
    OtherUsername: raw.OtherUsername ?? raw.otherUsername ?? '',
    OtherProfileImage: raw.OtherProfileImage ?? raw.otherProfileImage ?? null,
    LastMessagePreview: raw.LastMessagePreview ?? raw.lastMessagePreview ?? null,
    LastMessageAt: raw.LastMessageAt ?? raw.lastMessageAt ?? null,
    UnreadCount: pickNum(raw.UnreadCount, raw.unreadCount),
  };
}

export function normalizeMessageDto(raw: RawMessage): ChatMessageDto {
  return {
    Id: pickNum(raw.Id, raw.id),
    ConversationId: pickNum(raw.ConversationId, raw.conversationId),
    SenderId: pickNum(raw.SenderId, raw.senderId),
    Body: raw.Body ?? raw.body ?? '',
    ClientMessageId: raw.ClientMessageId ?? raw.clientMessageId ?? null,
    CreatedDate: raw.CreatedDate ?? raw.createdDate ?? new Date().toISOString(),
    IsMine: raw.IsMine ?? raw.isMine,
  };
}

function formatClock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export async function toConversationUi(
  item: InboxItemDto,
): Promise<ChatConversationUi> {
  const avatar = await resolveMediaUrl(item.OtherProfileImage);
  return {
    id: String(item.ConversationId),
    userId: String(item.OtherUserId),
    name: item.OtherFullName || item.OtherUsername || 'User',
    username: item.OtherUsername
      ? item.OtherUsername.startsWith('@')
        ? item.OtherUsername
        : `@${item.OtherUsername}`
      : '',
    avatar,
    online: false,
    lastMessage: item.LastMessagePreview?.trim() || '',
    lastMessageAt: formatRelativeTime(item.LastMessageAt),
    unreadCount: item.UnreadCount ?? 0,
  };
}

export function toMessageUi(
  dto: ChatMessageDto,
  myUserId: number,
): ChatMessageUi {
  // Prefer SenderId: SignalR / broadcast payloads force IsMine=false and
  // expect clients to decide ownership via SenderId === current user.
  const mine =
    (myUserId > 0 && dto.SenderId === myUserId) || dto.IsMine === true;
  return {
    id: String(dto.Id),
    conversationId: String(dto.ConversationId),
    senderId: mine ? 'me' : String(dto.SenderId),
    text: dto.Body,
    sentAt: formatClock(dto.CreatedDate),
    sentAtIso: dto.CreatedDate,
    clientMessageId: dto.ClientMessageId ?? undefined,
  };
}

export async function fetchInbox(userId: number, token?: string | null) {
  const raw = await apiRequest<
    ApiEnvelope & {
      Items?: RawInboxItem[];
      items?: RawInboxItem[];
      isSuccess?: boolean;
    }
  >(API_PATHS.conversations, {
    query: { userId },
    token,
  });

  const items = (raw.Items ?? raw.items ?? []).map(normalizeInboxItem);
  const ui = await Promise.all(items.map(toConversationUi));
  return ui;
}

export async function fetchUnreadCount(userId: number, token?: string | null) {
  const raw = await apiRequest<
    ApiEnvelope & { UnreadCount?: number; unreadCount?: number; isSuccess?: boolean }
  >(API_PATHS.conversationUnreadCount, {
    query: { userId },
    token,
  });
  return raw.UnreadCount ?? raw.unreadCount ?? 0;
}

export async function getOrCreateDirectConversation(
  userId: number,
  otherUserId: number,
  token?: string | null,
) {
  const raw = await apiRequest<
    ApiEnvelope & {
      ConversationId?: number;
      conversationId?: number;
      OtherUserId?: number;
      otherUserId?: number;
      isSuccess?: boolean;
    }
  >(API_PATHS.conversationDirect, {
    method: 'POST',
    token,
    body: { UserId: userId, OtherUserId: otherUserId },
  });

  return {
    conversationId: raw.ConversationId ?? raw.conversationId ?? 0,
    otherUserId: raw.OtherUserId ?? raw.otherUserId ?? otherUserId,
  };
}

export async function fetchMessages(
  conversationId: number,
  userId: number,
  options?: { beforeId?: number; take?: number; token?: string | null },
) {
  const raw = await apiRequest<
    ApiEnvelope & {
      Messages?: RawMessage[];
      messages?: RawMessage[];
      isSuccess?: boolean;
    }
  >(API_PATHS.conversationMessages(conversationId), {
    query: {
      userId,
      beforeId: options?.beforeId,
      take: options?.take ?? 50,
    },
    token: options?.token,
  });

  return (raw.Messages ?? raw.messages ?? []).map(normalizeMessageDto);
}

export async function sendMessageRest(
  conversationId: number,
  userId: number,
  body: string,
  clientMessageId?: string,
  token?: string | null,
) {
  const raw = await apiRequest<
    ApiEnvelope & {
      Message?: RawMessage;
      message?: RawMessage;
      PeerUserId?: number;
      peerUserId?: number;
      isSuccess?: boolean;
    }
  >(API_PATHS.conversationMessages(conversationId), {
    method: 'POST',
    token,
    body: {
      UserId: userId,
      Body: body,
      ClientMessageId: clientMessageId ?? null,
    },
  });

  const msg = raw.Message ?? raw.message;
  return msg ? normalizeMessageDto(msg) : null;
}

export async function markConversationRead(
  conversationId: number,
  userId: number,
  lastReadMessageId?: number | null,
  token?: string | null,
) {
  const raw = await apiRequest<
    ApiEnvelope & { UnreadCount?: number; unreadCount?: number; isSuccess?: boolean }
  >(API_PATHS.conversationRead(conversationId), {
    method: 'POST',
    token,
    body: {
      UserId: userId,
      LastReadMessageId: lastReadMessageId ?? null,
    },
  });
  return raw.UnreadCount ?? raw.unreadCount ?? 0;
}

export async function deleteMessage(
  messageId: number,
  userId: number,
  token?: string | null,
) {
  return apiRequest<ApiEnvelope>(API_PATHS.messageDelete(messageId), {
    method: 'DELETE',
    query: { userId },
    token,
  });
}
