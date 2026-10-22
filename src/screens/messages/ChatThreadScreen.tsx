import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChatMessageUi,
  deleteMessage,
  fetchMessages,
  toMessageUi,
} from '../../api/chat';
import {
  FigmaButton,
  FigmaIcon,
  FigmaSpinner,
  SheetModal,
  StoryAvatar,
  Typography,
  useScreenTopPad,
} from '../../components';
import { useLocale, userFacingError } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { useChat } from '../../navigation/ChatContext';
import { AppStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { setActiveConversationId } from '../../services/notifications/activeConversation';
import { afterUiSettled } from '../../utils/afterUiSettled';
import { openFriendProfile } from '../../services/profile/visitCache';
import { BlockSheet } from '../profile/BlockSheet';
import { formatMessageTime } from './formatMessageTime';

type Props = NativeStackScreenProps<AppStackParamList, 'ChatThread'>;

export function ChatThreadScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const topPad = useScreenTopPad();
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
  const [moreOpen, setMoreOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  useEffect(() => {
    if (!userId || !conversationId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        void joinConversation(conversationId).catch(() => undefined);
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

    setActiveConversationId(conversationId);
    return () => {
      cancelled = true;
      unsub();
      setActiveConversationId(null);
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
      Alert.alert(
        t('messages.send_failed_title'),
        userFacingError(e, t, 'messages.send_failed_desc'),
      );
    } finally {
      setSending(false);
    }
  };

  if (!conversationId || Number.isNaN(conversationId)) {
    return (
      <View
        style={[
          styles.root,
          {
            backgroundColor: theme.colors.background,
            paddingTop: topPad,
            paddingBottom: insets.bottom,
          },
        ]}>
        <View style={styles.empty}>
          <FigmaIcon
            name="tabMessages"
            size={48}
            color={theme.colors.plusCta}
          />
          <Typography variant="callout" weight="600" align="center">
            {t('messages.thread_not_found_title')}
          </Typography>
          <Typography variant="caption" color="textMuted" align="center">
            {t('messages.thread_not_found_desc')}
          </Typography>
        </View>
      </View>
    );
  }

  const peerName = conversation?.name || t('messages.title');
  const peerUserId = Number(conversation?.userId);
  const hasPeer = Number.isFinite(peerUserId) && peerUserId > 0;
  const composerPad = Math.max(insets.bottom, 10);
  const openPeer = () => {
    setMoreOpen(false);
    if (!hasPeer) return;
    const [firstName, ...rest] = (conversation?.name ?? '').trim().split(/\s+/);
    openFriendProfile(
      {
        UserId: peerUserId,
        FirstName: firstName || conversation?.name || '',
        LastName: rest.join(' '),
        Username: conversation?.username ?? '',
        ProfileImage: conversation?.avatar ?? null,
        IsVerified: false,
      },
      accessToken,
    );
    afterUiSettled(() => {
      navigation.navigate('UserProfile', { userId: String(peerUserId) });
    });
  };
  const openTreat = () => {
    setMoreOpen(false);
    if (!hasPeer) return;
    afterUiSettled(() => {
      navigation.navigate('UserProfile', {
        userId: String(peerUserId),
        openTreat: true,
      });
    });
  };
  const openBlock = () => {
    setMoreOpen(false);
    if (!hasPeer) return;
    afterUiSettled(() => setBlockOpen(true));
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <View style={[styles.root, { paddingTop: topPad }]}>
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}>
          <View style={styles.topBar}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}>
              <View style={styles.backIcon}>
                <FigmaIcon name="arrowRight" size={15} color={theme.colors.text} />
              </View>
            </Pressable>
            <Pressable style={styles.peer} onPress={openPeer} accessibilityRole="button">
              <View
                style={[
                  styles.face,
                  { backgroundColor: theme.colors.surfaceAlt },
                ]}>
                {conversation?.avatar ? (
                  <Image
                    source={{ uri: conversation.avatar }}
                    fadeDuration={0}
                    style={styles.fill}
                  />
                ) : (
                  <Typography variant="caption" weight="600">
                    {peerName.trim().charAt(0).toLocaleUpperCase('tr-TR') || '?'}
                  </Typography>
                )}
              </View>
              <View style={styles.peerText}>
                <Typography variant="callout" weight="600" numberOfLines={1}>
                  {peerName}
                </Typography>
                <Typography variant="caption" color="textMuted" numberOfLines={1}>
                  {t('messages.tap_profile')}
                </Typography>
              </View>
            </Pressable>
            <Pressable
              onPress={() => setMoreOpen(true)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('messages.more')}
              style={styles.moreBtn}>
              <FigmaIcon name="moreDots" size={24} color={theme.colors.text} />
            </Pressable>
          </View>

          {loading ? (
            <FigmaSpinner fill />
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
                  <View style={styles.empty}>
                    <FigmaIcon
                      name="tabMessages"
                      size={48}
                      color={theme.colors.plusCta}
                    />
                    <Typography variant="callout" weight="600" align="center">
                      {t('messages.empty_thread_title')}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="textMuted"
                      align="center">
                      {t('messages.empty_thread_desc')}
                    </Typography>
                  </View>
                }
                onContentSizeChange={() =>
                  listRef.current?.scrollToEnd({ animated: false })
                }
                renderItem={({ item, index }) => {
                  const mine = item.senderId === 'me';
                  const prev = messages[index - 1];
                  const showDay =
                    !prev ||
                    prev.sentAtIso.slice(0, 10) !== item.sentAtIso.slice(0, 10);
                  const peerLetter =
                    peerName.trim().charAt(0).toLocaleUpperCase('tr-TR') || '?';

                  const row = (
                    <View
                      style={[
                        styles.bubbleRow,
                        mine ? styles.bubbleRowMine : styles.bubbleRowTheirs,
                        { backgroundColor: theme.colors.background },
                      ]}>
                      {!mine ? (
                        <View style={styles.threadFaceSlot}>
                          <StoryAvatar
                            uri={conversation?.avatar}
                            size={41}
                            hasStory={false}
                            fallback={peerLetter}
                          />
                        </View>
                      ) : null}
                      <View
                        style={[
                          styles.bubble,
                          mine
                            ? { backgroundColor: theme.colors.plusCta }
                            : { backgroundColor: theme.colors.surfaceAlt },
                        ]}>
                        <Typography
                          variant="callout"
                          tint={mine ? theme.colors.white : theme.colors.text}>
                          {item.text}
                        </Typography>
                      </View>
                    </View>
                  );

                  return (
                    <View>
                      {showDay ? (
                        <Typography
                          variant="caption"
                          color="textMuted"
                          align="center"
                          style={styles.dayChip}>
                          {formatMessageTime(item.sentAtIso, item.sentAt, t)}
                        </Typography>
                      ) : null}
                      {mine ? (
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
                          renderLeftActions={(
                            _progress,
                            _translation,
                            methods,
                          ) => (
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
                          )}>
                          {row}
                        </Swipeable>
                      ) : (
                        row
                      )}
                    </View>
                  );
                }}
              />

              <View
                style={[
                  styles.composer,
                  { paddingBottom: composerPad },
                ]}>
                <View
                  style={[
                    styles.inputWrap,
                    { backgroundColor: theme.colors.surfaceAlt },
                  ]}>
                  <TextInput
                    value={draft}
                    onChangeText={setDraft}
                    placeholder={t('messages.composer_placeholder')}
                    placeholderTextColor={theme.colors.textMuted}
                    style={[
                      styles.input,
                      theme.typography.variants.callout,
                      { color: theme.colors.text },
                    ]}
                    multiline
                    maxLength={1000}
                  />
                  <Pressable
                    onPress={send}
                    disabled={!draft.trim() || sending}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t('messages.send')}>
                    <FigmaIcon
                      name="directRight"
                      size={24}
                      color={
                        draft.trim()
                          ? theme.colors.plusCta
                          : theme.colors.textMuted
                      }
                    />
                  </Pressable>
                </View>
              </View>
            </GestureHandlerRootView>
          )}
        </KeyboardAvoidingView>
      </View>
      <SheetModal
        visible={moreOpen}
        title={peerName}
        onClose={() => setMoreOpen(false)}>
        <FigmaButton
          label={t('user_profile.title')}
          tone="ghost"
          size="md"
          fullWidth
          onPress={openPeer}
        />
        <FigmaButton
          label={t('treat.cta')}
          tone="soft"
          size="md"
          fullWidth
          onPress={openTreat}
        />
        <FigmaButton
          label={t('safety.block')}
          tone="danger"
          size="md"
          fullWidth
          onPress={openBlock}
        />
      </SheetModal>
      {hasPeer ? (
        <BlockSheet
          visible={blockOpen}
          targetUserId={peerUserId}
          targetName={peerName}
          onClose={() => setBlockOpen(false)}
          onBlocked={() => {
            setBlockOpen(false);
            navigation.goBack();
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flexFill: { flex: 1 },
  fill: { width: '100%', height: '100%' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 0,
    paddingBottom: 8,
    gap: 8,
    minHeight: 56,
  },
  backIcon: {
    transform: [{ rotate: '180deg' }],
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  face: {
    width: 35,
    height: 35,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  peerText: { flex: 1, minWidth: 0 },
  thread: {
    paddingHorizontal: 10,
    paddingTop: 8,
    flexGrow: 1,
  },
  dayChip: {
    marginVertical: 8,
  },
  empty: {
    flex: 1,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 5,
  },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  threadFaceSlot: {
    width: 41,
    height: 41,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '72%',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  deleteAction: {
    width: 84,
    marginBottom: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  composer: {
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  inputWrap: {
    minHeight: 46,
    maxHeight: 120,
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  moreBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatThreadScreen;
