import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  FigmaIcon,
  FigmaSpinner,
  StoryAvatar,
  TabScreenScrollView,
  Typography,
  useScreenTopPad,
} from '../../components';
import { ChatConversationUi, getStoryFeed, StoryUserGroup } from '../../api';
import { useStorySeen } from '../../hooks/useStorySeen';
import { useAuth } from '../../navigation/AuthContext';
import { useLocale } from '../../i18n';
import { useChat } from '../../navigation/ChatContext';
import { AppStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { formatMessageTime } from './formatMessageTime';

const RAIL_OUTER = 75;
const LIST_FACE = 50;

function handleOf(item: ChatConversationUi): string {
  const raw = item.username.replace(/^@/, '').trim();
  return raw || item.name;
}

function FaceRail({
  items,
  storyUserIds,
  seenUserIds,
  onOpen,
}: {
  items: ChatConversationUi[];
  storyUserIds: Set<number>;
  seenUserIds: Set<number>;
  onOpen: (item: ChatConversationUi) => void;
}) {
  if (items.length === 0) return null;

  return (
    <View style={styles.railWrap}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.railScroll}
      contentContainerStyle={styles.rail}>
      {items.map(item => {
        const label = handleOf(item);
        const hasStory = storyUserIds.has(Number(item.userId));
        return (
          <Pressable
            key={item.id}
            onPress={() => onOpen(item)}
            style={styles.railItem}
            accessibilityRole="button"
            accessibilityLabel={label}>
            <StoryAvatar
              uri={item.avatar}
              size={RAIL_OUTER}
              hasStory={hasStory}
              seen={hasStory && seenUserIds.has(Number(item.userId))}
              fallback={label.charAt(0).toLocaleUpperCase('tr-TR')}
            />
            <Typography
              variant="caption"
              color="textMuted"
              numberOfLines={1}
              align="center"
              style={styles.railLabel}>
              {label}
            </Typography>
          </Pressable>
        );
      })}
    </ScrollView>
    </View>
  );
}

export function MessagesScreen() {
  const theme = useTheme();
  const { t } = useLocale();
  const topPad = useScreenTopPad();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { conversations, loadingInbox, refreshInbox } = useChat();
  const { userId, accessToken } = useAuth();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [storyGroups, setStoryGroups] = useState<StoryUserGroup[]>([]);
  const { isGroupSeen } = useStorySeen(userId);
  const lastStoryAt = useRef(0);
  const storyUserIds = useMemo(
    () =>
      new Set(
        storyGroups
          .filter(g => (g.Stories?.length ?? 0) > 0)
          .map(g => g.User.UserId),
      ),
    [storyGroups],
  );
  const seenUserIds = useMemo(
    () =>
      new Set(
        storyGroups
          .filter(g => isGroupSeen(g))
          .map(g => g.User.UserId),
      ),
    [storyGroups, isGroupSeen],
  );

  const loadStoryIds = useCallback(async () => {
    if (!userId) return;
    if (lastStoryAt.current > 0 && Date.now() - lastStoryAt.current < 15_000) {
      return;
    }
    lastStoryAt.current = Date.now();
    try {
      const feed = await getStoryFeed(userId, accessToken);
      setStoryGroups(
        (feed.Items ?? []).filter(g => (g.Stories?.length ?? 0) > 0),
      );
    } catch {
      /* keep last rings */
    }
  }, [userId, accessToken]);

  useFocusEffect(
    useCallback(() => {
      void refreshInbox();
      void loadStoryIds();
    }, [refreshInbox, loadStoryIds]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q),
    );
  }, [conversations, query]);

  const openThread = (item: ChatConversationUi) => {
    navigation.navigate('ChatThread', { conversationId: item.id });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshInbox({ force: true });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.colors.background, paddingTop: topPad },
      ]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.header}>
        <Typography variant="title" style={styles.headerTitle}>
          {t('messages.title')}
        </Typography>
      </View>

      {loadingInbox && conversations.length === 0 ? (
        <FigmaSpinner fill />
      ) : (
        <>
          <FaceRail
            items={conversations}
            storyUserIds={storyUserIds}
            seenUserIds={seenUserIds}
            onOpen={openThread}
          />

          <View
            style={[
              styles.search,
              { backgroundColor: theme.colors.surfaceAlt },
            ]}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('messages.search_placeholder')}
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.searchInput,
                {
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSize.md,
                  fontWeight: theme.typography.fontWeight.medium,
                },
              ]}
            />
            <FigmaIcon name="searchNormal" size={24} />
          </View>

          <TabScreenScrollView
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.plusCta}
              />
            }
            contentContainerStyle={styles.content}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <FigmaIcon
                name="tabMessages"
                size={48}
                color={theme.colors.plusCta}
              />
              <Typography variant="callout" weight="600" align="center">
                {query.trim()
                  ? t('messages.no_results_title')
                  : t('messages.empty_title')}
              </Typography>
              <Typography variant="caption" color="textMuted" align="center">
                {query.trim()
                  ? t('messages.no_results_desc').replace('{query}', query)
                  : t('messages.empty_desc')}
              </Typography>
            </View>
          ) : (
            filtered.map(item => {
              const unread = item.unreadCount > 0;
              const preview = unread
                ? t('messages.unread_preview').replace(
                    '{count}',
                    String(item.unreadCount),
                  )
                : item.lastMessage || t('messages.no_messages_yet');
              return (
                <Pressable
                  key={item.id}
                  onPress={() => openThread(item)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.row,
                    pressed ? { opacity: 0.92 } : null,
                  ]}>
                  <View style={styles.dotSlot}>
                    {unread ? (
                      <View
                        style={[
                          styles.unreadDot,
                          { backgroundColor: theme.colors.plusCta },
                        ]}
                      />
                    ) : null}
                  </View>
                  <StoryAvatar
                    uri={item.avatar}
                    size={LIST_FACE}
                    hasStory={storyUserIds.has(Number(item.userId))}
                    seen={
                      storyUserIds.has(Number(item.userId)) &&
                      seenUserIds.has(Number(item.userId))
                    }
                    fallback={item.name.charAt(0).toLocaleUpperCase('tr-TR')}
                  />
                  <View style={styles.texts}>
                    <Typography variant="callout" weight="600" numberOfLines={1}>
                      {item.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={unread ? 'text' : 'textMuted'}
                      numberOfLines={1}>
                      {preview}
                    </Typography>
                  </View>
                  <Typography variant="caption" color="textMuted">
                    {formatMessageTime(
                      item.lastMessageAtIso,
                      item.lastMessageAt,
                      t,
                    )}
                  </Typography>
                </Pressable>
              );
            })
          )}
          </TabScreenScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingTop: 0,
    paddingBottom: 2,
  },
  headerTitle: {
    textAlign: 'center',
  },
  list: { flex: 1 },
  content: {
    paddingHorizontal: 10,
    paddingTop: 6,
    flexGrow: 1,
  },
  railWrap: {
    height: 95,
    flexGrow: 0,
    flexShrink: 0,
  },
  railScroll: {
    flexGrow: 0,
  },
  rail: {
    gap: 10,
    paddingHorizontal: 10,
    alignItems: 'flex-start',
  },
  railItem: {
    width: RAIL_OUTER,
    alignItems: 'center',
    gap: 5,
  },
  railLabel: { maxWidth: RAIL_OUTER },
  search: {
    height: 46,
    borderRadius: 15,
    marginHorizontal: 10,
    marginTop: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    margin: 0,
    // Tall variant lineHeight pushes the placeholder down inside 46px.
    lineHeight: Platform.OS === 'ios' ? 0 : 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 62,
    gap: 5,
  },
  dotSlot: {
    width: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
  empty: {
    flex: 1,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
});

export default MessagesScreen;
