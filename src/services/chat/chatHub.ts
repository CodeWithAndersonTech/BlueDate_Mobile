import * as SignalR from '@microsoft/signalr';
import { getApiBaseUrl } from '../../config/api';
import { ChatMessageDto, normalizeMessageDto } from '../../api/chat';
import { isJwtExpired } from '../../utils/jwt';

export type ChatHubHandlers = {
  onReceiveMessage?: (message: ChatMessageDto) => void;
  onMessagesRead?: (
    conversationId: number,
    userId: number,
    lastReadMessageId: number,
  ) => void;
  onUnreadCountChanged?: (unreadCount: number) => void;
};

let connection: SignalR.HubConnection | null = null;
let handlers: ChatHubHandlers = {};

export function setChatHubHandlers(next: ChatHubHandlers) {
  handlers = next;
}

export async function connectChatHub(accessToken: string): Promise<boolean> {
  if (!accessToken || accessToken.startsWith('demo-token-')) {
    return false;
  }

  if (isJwtExpired(accessToken)) {
    console.warn('[ChatHub] access token expired — re-login required');
    return false;
  }

  if (
    connection &&
    (connection.state === SignalR.HubConnectionState.Connected ||
      connection.state === SignalR.HubConnectionState.Connecting)
  ) {
    return connection.state === SignalR.HubConnectionState.Connected;
  }

  const baseUrl = await getApiBaseUrl();
  const hubUrl = `${baseUrl.replace(/\/$/, '')}/hubs/chat`;

  connection = new SignalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => accessToken,
      // RN WebSockets accept Authorization headers; also keep factory for negotiate.
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      // React Native / some proxies prefer long polling fallback.
      transport:
        SignalR.HttpTransportType.WebSockets |
        SignalR.HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    // Information logs Error-level negotiate failures as console.error → LogBox.
    .configureLogging(SignalR.LogLevel.Warning)
    .build();

  connection.on('ReceiveMessage', (raw: unknown) => {
    try {
      const dto = normalizeMessageDto(raw as never);
      handlers.onReceiveMessage?.(dto);
    } catch (e) {
      console.warn('[ChatHub] ReceiveMessage parse error', e);
    }
  });

  connection.on(
    'MessagesRead',
    (conversationId: number, userId: number, lastReadMessageId: number) => {
      handlers.onMessagesRead?.(conversationId, userId, lastReadMessageId);
    },
  );

  connection.on('UnreadCountChanged', (unreadCount: number) => {
    handlers.onUnreadCountChanged?.(unreadCount);
  });

  try {
    await connection.start();
    return true;
  } catch (e) {
    console.warn('[ChatHub] connect failed', e);
    connection = null;
    return false;
  }
}

export async function disconnectChatHub() {
  if (!connection) return;
  try {
    await connection.stop();
  } catch {
    // ignore
  }
  connection = null;
}

export function isChatHubConnected() {
  return connection?.state === SignalR.HubConnectionState.Connected;
}

export async function hubJoinConversation(conversationId: number) {
  if (!isChatHubConnected()) return;
  await connection!.invoke('JoinConversation', conversationId);
}

export async function hubLeaveConversation(conversationId: number) {
  if (!isChatHubConnected()) return;
  try {
    await connection!.invoke('LeaveConversation', conversationId);
  } catch {
    // ignore
  }
}

export async function hubSendMessage(
  conversationId: number,
  body: string,
  clientMessageId?: string,
) {
  if (!isChatHubConnected()) {
    throw new Error('Chat hub not connected');
  }
  await connection!.invoke(
    'SendMessage',
    conversationId,
    body,
    clientMessageId ?? null,
  );
}

export async function hubMarkRead(
  conversationId: number,
  lastReadMessageId?: number | null,
) {
  if (!isChatHubConnected()) return false;
  await connection!.invoke(
    'MarkRead',
    conversationId,
    lastReadMessageId ?? null,
  );
  return true;
}
