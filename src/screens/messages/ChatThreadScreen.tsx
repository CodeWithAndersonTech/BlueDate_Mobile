import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  ChatMessageUi,
  deleteMessage,
  fetchMessages,
  toMessageUi,
} from '../../api/chat';
import {
  Avatar,
  EmptyState,
  Icon,
  IconButton,
  Typography,
} from '../../components';
import { useLocale } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { useChat } from '../../navigation/ChatContext';
import { AppStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'ChatThread'>;

export function ChatThreadScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { userId, accessToken } = useAuth();
  const {
    conversations,
    joinConversation,
    leaveConversation,
    sendChatMessage,
    markRead,
    subscribeMessages,
  } = useChat();

  const conversationId = Number(route.params.conversationId);
  const listRef = useRef<FlatList<ChatMessageUi>>(null);
  const swipeableRefs = useRef(new Map<string, SwipeableMethods>());

  const conversation = useMemo(
    () => conversations.find(c => c.id === String(conversationId)),
    [conversations, conversationId],
  );

  const [messages, setMessages] = useState<ChatMessageUi[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!userId || !conversationId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        await joinConversation(conversationId);
        const rows = await fetchMessages(conversationId, userId, {
          token: accessToken,
        });
        if (cancelled) return;
        const ui = rows.map(m => toMessageUi(m, userId));
        setMessages(ui);

        const lastId = rows.length ? rows[rows.length - 1].Id : null;
        await markRead(conversationId, lastId);
      } catch (e) {
        console.warn('[ChatThread] load failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const unsub = subscribeMessages(conversationId, dto => {
      if (!userId) return;
      const ui = toMessageUi(dto, userId);
      setMessages(prev => {
        if (prev.some(m => m.id === ui.id)) return prev;
        if (
          ui.clientMessageId &&
          prev.some(m => m.clientMessageId === ui.clientMessageId)
        ) {
          return prev.map(m =>
            m.clientMessageId === ui.clientMessageId ? ui : m,
          );
        }
        return [...prev, ui];
      });

      if (dto.SenderId !== userId) {
        markRead(conversationId, dto.Id);
      }
    });

    return () => {
      cancelled = true;
      unsub();
      leaveConversation(conversationId);
    };
  }, [
    userId,
    accessToken,
    conversationId,
    joinConversation,
    leaveConversation,
    markRead,
    subscribeMessages,
  ]);

  const removeMessage = useCallback(
    async (id: string) => {
      if (!userId) return;
      const numericId = Number(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      if (!Number.isFinite(numericId) || numericId <= 0) return;
      try {
        await deleteMessage(numericId, userId, accessToken);
      } catch (e) {
        console.warn('[ChatThread] delete failed', e);
      }
    },
    [userId, accessToken],
  );

  const confirmDelete = useCallback(
    (id: string) => {
      Alert.alert(
        t('messages.delete_confirm_title'),
        t('messages.delete_confirm_desc'),
        [
          { text: t('common.close'), style: 'cancel' },
          {
            text: t('messages.delete'),
            style: 'destructive',
            onPress: () => {
              removeMessage(id);
            },
          },
        ],
      );
    },
    [removeMessage, t],
  );

  const send = async () => {
    const text = draft.trim();
    if (!text || !userId || sending) return;

    const clientMessageId = `c-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const now = new Date();
    const optimistic: ChatMessageUi = {
      id: clientMessageId,
      conversationId: String(conversationId),
      senderId: 'me',
      text,
      sentAt: now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      sentAtIso: now.toISOString(),
      clientMessageId,
    };

    setMessages(prev => [...prev, optimistic]);
    setDraft('');
    setSending(true);

    try {
      const dto = await sendChatMessage(
        conversationId,
        text,
        clientMessageId,
      );
      if (dto) {
        const ui = toMessageUi(dto, userId);
        setMessages(prev => {
          const withoutTemp = prev.filter(
            m => m.clientMessageId !== clientMessageId && m.id !== ui.id,
          );
          return [...withoutTemp, ui];
        });
      }
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    } catch (e) {
      console.warn('[ChatThread] send failed', e);
      setMessages(prev => prev.filter(m => m.clientMessageId !== clientMessageId));
      Alert.alert(t('messages.send_failed_title'), t('messages.send_failed_desc'));
    } finally {
      setSending(false);
    }
  };

  if (!conversationId || Number.isNaN(conversationId)) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          icon="message"
          title={t('messages.thread_not_found_title')}
          description={t('messages.thread_not_found_desc')}
        />
      </SafeAreaView>
    );
  }

  const peerName = conversation?.name || t('messages.title');
  const statusLabel = conversation?.online
    ? t('messages.status_online')
    : t('messages.status_offline');
  const composerPad = Math.max(insets.bottom, 10);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <SafeAreaView edges={['top']} style={styles.root}>
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}>
          <View
            style={[
              styles.topBar,
              {
                borderBottomColor: theme.colors.border,
                backgroundColor: theme.colors.background,
              },
            ]}>
            <Pressable
              style={styles.peer}
              onPress={() => {
                if (conversation?.userId) {
                  navigation.navigate('UserProfile', {
                    userId: conversation.userId,
                  });
                }
              }}>
              <Avatar
                uri={conversation?.avatar}
                name={peerName}
                size="sm"
                online={conversation?.online}
              />
              <View style={styles.peerText}>
                <Typography variant="bodyStrong" numberOfLines={1}>
                  {peerName}
                </Typography>
                <Typography
                  variant="caption"
                  tint={
                    conversation?.online
                      ? theme.colors.online
                      : theme.colors.textMuted
                  }>
                  {statusLabel}
                </Typography>
              </View>
            </Pressable>
            <IconButton
              name="more"
              variant="plain"
              onPress={() => {}}
              accessibilityLabel={t('messages.more')}
            />
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : (
            <GestureHandlerRootView style={styles.flexFill}>
              <FlatList
                ref={listRef}
                style={styles.flexFill}
                data={messages}
                keyExtractor={item => item.id}
                contentContainerStyle={[
                  styles.thread,
                  { paddingBottom: 12, flexGrow: 1 },
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                ListEmptyComponent={
                  <EmptyState
                    fill
                    icon="message"
                    title={t('messages.empty_thread_title')}
                    description={t('messages.empty_thread_desc')}
                  />
                }
                onContentSizeChange={() =>
                  listRef.current?.scrollToEnd({ animated: false })
                }
                renderItem={({ item, index }) => {
                  const mine = item.senderId === 'me';
                  const prev = messages[index - 1];
                  const showTime =
                    !prev ||
                    prev.senderId !== item.senderId ||
                    prev.sentAt !== item.sentAt;

                  return (
                    <Swipeable
                      ref={methods => {
                        if (methods) {
                          swipeableRefs.current.set(item.id, methods);
                        } else {
                          swipeableRefs.current.delete(item.id);
                        }
                      }}
                      friction={2}
                      overshootLeft={false}
                      overshootRight={false}
                      leftThreshold={40}
                      onSwipeableOpenStartDrag={() => {
                        swipeableRefs.current.forEach((methods, id) => {
                          if (id !== item.id) {
                            methods.close();
                          }
                        });
                      }}
                      renderLeftActions={(_progress, _translation, methods) =>
                        mine ? (
                          <Pressable
                            onPress={() => {
                              methods.close();
                              confirmDelete(item.id);
                            }}
                            style={[
                              styles.deleteAction,
                              { backgroundColor: theme.colors.danger },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={t('messages.delete')}>
                            <Text style={styles.deleteActionText}>
                              {t('messages.delete')}
                            </Text>
                          </Pressable>
                        ) : (
                          <View />
                        )
                      }>
                      <View
                        style={[
                          styles.bubbleRow,
                          mine ? styles.bubbleRowMine : styles.bubbleRowTheirs,
                          { backgroundColor: theme.colors.background },
                        ]}>
                        <View
                          style={[
                            styles.bubble,
                            mine
                              ? {
                                  backgroundColor: theme.colors.primary,
                                  borderBottomRightRadius: 6,
                                }
                              : {
                                  backgroundColor: theme.colors.surfaceAlt,
                                  borderBottomLeftRadius: 6,
                                },
                          ]}>
                          <Typography
                            variant="body"
                            tint={
                              mine
                                ? theme.colors.onPrimary
                                : theme.colors.text
                            }>
                            {item.text}
                          </Typography>
                          {showTime ? (
                            <Typography
                              variant="overline"
                              tint={
                                mine
                                  ? 'rgba(255,255,255,0.72)'
                                  : theme.colors.textMuted
                              }
                              style={styles.time}>
                              {item.sentAt}
                            </Typography>
                          ) : null}
                        </View>
                      </View>
                    </Swipeable>
                  );
                }}
              />

              <View
                style={[
                  styles.composer,
                  {
                    paddingBottom: composerPad,
                    borderTopColor: theme.colors.border,
                    backgroundColor: theme.colors.background,
                  },
                ]}>
                <View
                  style={[
                    styles.inputWrap,
                    {
                      backgroundColor: theme.colors.surfaceAlt,
                      borderColor: theme.colors.border,
                    },
                  ]}>
                  <TextInput
                    value={draft}
                    onChangeText={setDraft}
                    placeholder={t('messages.composer_placeholder')}
                    placeholderTextColor={theme.colors.textMuted}
                    style={[styles.input, { color: theme.colors.text }]}
                    multiline
                    maxLength={1000}
                  />
                </View>
                <Pressable
                  onPress={send}
                  disabled={!draft.trim() || sending}
                  style={({ pressed }) => [
                    styles.sendBtn,
                    {
                      backgroundColor: draft.trim()
                        ? theme.colors.primary
                        : theme.colors.surfaceAlt,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}>
                  <Icon
                    name="send"
                    size={18}
                    color={
                      draft.trim()
                        ? theme.colors.onPrimary
                        : theme.colors.textMuted
                    }
                  />
                </Pressable>
              </View>
            </GestureHandlerRootView>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flexFill: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  peer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    paddingVertical: 2,
  },
  peerText: { flex: 1, gap: 1, minWidth: 0 },
  thread: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexGrow: 1,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingVertical: 2,
  },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  time: { alignSelf: 'flex-end' },
  deleteAction: {
    width: 84,
    marginBottom: 2,
    marginVertical: 2,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrap: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    lineHeight: 20,
    padding: 0,
    margin: 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatThreadScreen;
