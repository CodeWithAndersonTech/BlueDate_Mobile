import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
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
  Avatar,
  EmptyState,
  Icon,
  IconButton,
  Typography,
} from '../../components';
import { useLocale } from '../../i18n';
import { useLockTabSwipe } from '../../navigation/useLockTabSwipe';
import { HomeStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import {
  ChatMessage,
  getConversationById,
  getMessagesForConversation,
} from '../../utils';

type Props = NativeStackScreenProps<HomeStackParamList, 'ChatThread'>;

export function ChatThreadScreen({ navigation, route }: Props) {
  useLockTabSwipe();
  const theme = useTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const swipeableRefs = useRef(new Map<string, SwipeableMethods>());

  const conversation = useMemo(
    () => getConversationById(route.params.conversationId),
    [route.params.conversationId],
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    getMessagesForConversation(route.params.conversationId),
  );
  const [draft, setDraft] = useState('');

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

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
            onPress: () => removeMessage(id),
          },
        ],
      );
    },
    [removeMessage, t],
  );

  if (!conversation) {
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

  const statusLabel =
    conversation.statusKey === 'typing'
      ? t('messages.status_typing')
      : conversation.online
        ? t('messages.status_online')
        : t('messages.status_offline');

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const now = new Date();
    const next: ChatMessage = {
      id: `local-${now.getTime()}`,
      conversationId: conversation.id,
      senderId: 'me',
      text,
      sentAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sentAtIso: now.toISOString(),
      read: true,
    };
    setMessages(prev => [...prev, next]);
    setDraft('');
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

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
          onPress={() =>
            navigation.navigate('UserProfile', { userId: conversation.userId })
          }>
          <Avatar
            uri={conversation.avatar}
            name={conversation.name}
            size="sm"
            online={conversation.online}
            premium={conversation.premium}
          />
          <View style={styles.peerText}>
            <Typography variant="bodyStrong" numberOfLines={1}>
              {conversation.name}
            </Typography>
            <Typography
              variant="caption"
              tint={
                conversation.online || conversation.statusKey === 'typing'
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

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <GestureHandlerRootView style={styles.body}>
          <FlatList
            ref={listRef}
            style={styles.list}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.thread}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
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
                  renderLeftActions={(_progress, _translation, methods) => (
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
                          mine ? theme.colors.onPrimary : theme.colors.text
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
                paddingBottom: Math.max(insets.bottom, 12),
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
              disabled={!draft.trim()}
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
                  draft.trim() ? theme.colors.onPrimary : theme.colors.textMuted
                }
              />
            </Pressable>
          </View>
        </GestureHandlerRootView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  /** minHeight:0 lets the chat column shrink inside Material Top Tabs. */
  body: { flex: 1, minHeight: 0 },
  list: { flex: 1, minHeight: 0 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
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
    paddingBottom: 12,
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
    flexShrink: 0,
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
