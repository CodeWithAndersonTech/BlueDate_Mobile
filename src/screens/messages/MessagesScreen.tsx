import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  Avatar,
  EmptyState,
  Header,
  Input,
  Screen,
  Typography,
} from '../../components';
import { useLocale } from '../../i18n';
import { useLockTabSwipe } from '../../navigation/useLockTabSwipe';
import { HomeStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { ChatConversation, chatConversations } from '../../utils';

type Props = NativeStackScreenProps<HomeStackParamList, 'Messages'>;

export function MessagesScreen({ navigation }: Props) {
  useLockTabSwipe();
  const theme = useTheme();
  const { t } = useLocale();
  const [query, setQuery] = useState('');
  const [conversations] = useState<ChatConversation[]>(chatConversations);

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

  const unreadTotal = conversations.reduce((n, c) => n + c.unreadCount, 0);

  return (
    <Screen edges={['top']}>
      <Header
        large
        title={t('messages.title')}
        subtitle={
          unreadTotal > 0
            ? t('messages.subtitle_unread').replace(
                '{count}',
                String(unreadTotal),
              )
            : t('messages.subtitle')
        }
      />

      <View style={styles.searchWrap}>
        <Input
          placeholder={t('messages.search_placeholder')}
          leftIcon="search"
          autoCapitalize="none"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        {filtered.length === 0 ? (
          <EmptyState
            icon="message"
            title={
              query.trim()
                ? t('messages.no_results_title')
                : t('messages.empty_title')
            }
            description={
              query.trim()
                ? t('messages.no_results_desc').replace('{query}', query)
                : t('messages.empty_desc')
            }
          />
        ) : (
          filtered.map(item => {
            const unread = item.unreadCount > 0;
            return (
              <Pressable
                key={item.id}
                onPress={() =>
                  navigation.navigate('ChatThread', {
                    conversationId: item.id,
                  })
                }
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: pressed
                      ? theme.colors.surfaceAlt
                      : 'transparent',
                  },
                ]}>
                <Avatar
                  uri={item.avatar}
                  name={item.name}
                  size="md"
                  online={item.online}
                  premium={item.premium}
                />
                <View style={styles.texts}>
                  <View style={styles.topLine}>
                    <Typography
                      variant="bodyStrong"
                      numberOfLines={1}
                      style={styles.name}>
                      {item.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={unread ? 'primary' : 'textMuted'}>
                      {item.lastMessageAt}
                    </Typography>
                  </View>
                  <View style={styles.bottomLine}>
                    <Typography
                      variant="caption"
                      color={unread ? 'text' : 'textMuted'}
                      numberOfLines={1}
                      style={[styles.preview, unread && styles.previewUnread]}>
                      {item.lastMessage}
                    </Typography>
                    {unread ? (
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: theme.colors.primary },
                        ]}>
                        <Typography
                          variant="overline"
                          tint={theme.colors.onPrimary}>
                          {item.unreadCount > 9 ? '9+' : String(item.unreadCount)}
                        </Typography>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: 20, paddingBottom: 8 },
  content: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  texts: { flex: 1, gap: 4, minWidth: 0 },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: { flex: 1 },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preview: { flex: 1 },
  previewUnread: { fontWeight: '600' },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
});

export default MessagesScreen;
