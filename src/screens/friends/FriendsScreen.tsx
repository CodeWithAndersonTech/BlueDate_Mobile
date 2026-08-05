import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  EmptyState,
  Header,
  Icon,
  IconButton,
  Screen,
  SegmentedControl,
  TabScreenScrollView,
  Typography,
  UserListItem,
} from '../../components';
import {
  acceptFriendRequest,
  cancelFriendRequest,
  displayName,
  formatRelativeTime,
  FriendshipListItem,
  getFriends,
  getIncomingFriendRequests,
  getSentFriendRequests,
  rejectFriendRequest,
} from '../../api';
import { useLocale } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { FriendsStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import {
  FriendRequest,
  friends as mockFriends,
  incomingRequests as mockIncoming,
  sentRequests as mockSent,
} from '../../utils/mockData';

type Props = NativeStackScreenProps<FriendsStackParamList, 'FriendsMain'>;

type Tab = 'friends' | 'incoming' | 'sent';

type MockPerson = Pick<
  FriendRequest,
  'userId' | 'name' | 'username' | 'avatar' | 'premium'
>;

/** Negative friendship ids mark local UI mocks — skip API on accept/reject/cancel. */
function toMockFriendshipItem(
  person: MockPerson,
  friendshipId: number,
  statusCode: string,
): FriendshipListItem {
  const parts = person.name.trim().split(/\s+/);
  const firstName = parts[0] ?? person.name;
  const lastName = parts.slice(1).join(' ');
  return {
    FriendshipId: friendshipId,
    StatusId: 0,
    StatusCode: statusCode,
    StatusName: statusCode,
    CreatedDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    User: {
      UserId: person.userId,
      FirstName: firstName,
      LastName: lastName,
      Username: person.username.replace(/^@/, ''),
      ProfileImage: person.avatar ?? null,
      IsVerified: Boolean(person.premium),
    },
  };
}

const MOCK_FRIENDS: FriendshipListItem[] = mockFriends.map((f, i) =>
  toMockFriendshipItem(f, -(3000 + i), 'friends'),
);
const MOCK_INCOMING: FriendshipListItem[] = mockIncoming.map((r, i) =>
  toMockFriendshipItem(r, -(1000 + i), 'pending'),
);
const MOCK_SENT: FriendshipListItem[] = mockSent.map((r, i) =>
  toMockFriendshipItem(r, -(2000 + i), 'pending'),
);

export function FriendsScreen({ navigation }: Props) {
  const { t } = useLocale();
  const theme = useTheme();
  const { userId, accessToken } = useAuth();
  const [tab, setTab] = useState<Tab>('friends');
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<FriendshipListItem[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<
    FriendshipListItem[]
  >([]);
  const [sentRequests, setSentRequests] = useState<FriendshipListItem[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setFriends(MOCK_FRIENDS);
      setIncomingRequests(MOCK_INCOMING);
      setSentRequests(MOCK_SENT);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [friendsRes, incomingRes, sentRes] = await Promise.all([
        getFriends(userId, accessToken),
        getIncomingFriendRequests(userId, accessToken),
        getSentFriendRequests(userId, accessToken),
      ]);
      const nextFriends = friendsRes.Items ?? [];
      const incoming = incomingRes.Items ?? [];
      const sent = sentRes.Items ?? [];
      setFriends(nextFriends.length ? nextFriends : MOCK_FRIENDS);
      setIncomingRequests(incoming.length ? incoming : MOCK_INCOMING);
      setSentRequests(sent.length ? sent : MOCK_SENT);
    } catch (error) {
      // Keep UI reviewable even when API fails.
      setFriends(MOCK_FRIENDS);
      setIncomingRequests(MOCK_INCOMING);
      setSentRequests(MOCK_SENT);
      Alert.alert(
        t('friends.title'),
        error instanceof Error ? error.message : t('user_profile.action_error'),
      );
    } finally {
      setLoading(false);
    }
  }, [userId, accessToken, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const segments = [
    {
      key: 'friends',
      label: t('friends.tab.friends'),
      badge: friends.length,
    },
    {
      key: 'incoming',
      label: t('friends.tab.incoming'),
      badge: incomingRequests.length,
    },
    {
      key: 'sent',
      label: t('friends.tab.sent'),
      badge: sentRequests.length,
    },
  ];

  const openProfile = (id: number) =>
    navigation.navigate('UserProfile', { userId: String(id) });

  const onAccept = async (item: FriendshipListItem) => {
    if (!userId) return;
    setBusyId(item.FriendshipId);
    try {
      if (item.FriendshipId < 0) {
        setIncomingRequests(prev =>
          prev.filter(r => r.FriendshipId !== item.FriendshipId),
        );
        setTab('friends');
        return;
      }
      await acceptFriendRequest(userId, item.FriendshipId, accessToken);
      await load();
      setTab('friends');
    } catch (error) {
      Alert.alert(
        t('friends.accept'),
        error instanceof Error ? error.message : t('user_profile.action_error'),
      );
    } finally {
      setBusyId(null);
    }
  };

  const onReject = async (item: FriendshipListItem) => {
    if (!userId) return;
    setBusyId(item.FriendshipId);
    try {
      if (item.FriendshipId < 0) {
        setIncomingRequests(prev =>
          prev.filter(r => r.FriendshipId !== item.FriendshipId),
        );
        return;
      }
      await rejectFriendRequest(userId, item.FriendshipId, accessToken);
      await load();
    } catch (error) {
      Alert.alert(
        t('friends.reject'),
        error instanceof Error ? error.message : t('user_profile.action_error'),
      );
    } finally {
      setBusyId(null);
    }
  };

  const onCancel = async (item: FriendshipListItem) => {
    if (!userId) return;
    setBusyId(item.FriendshipId);
    try {
      if (item.FriendshipId < 0) {
        setSentRequests(prev =>
          prev.filter(r => r.FriendshipId !== item.FriendshipId),
        );
        return;
      }
      await cancelFriendRequest(userId, item.FriendshipId, accessToken);
      await load();
    } catch (error) {
      Alert.alert(
        t('friends.cancel'),
        error instanceof Error ? error.message : t('user_profile.action_error'),
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Screen edges={['top']}>
      <Header
        large
        subtitle={t('friends.subtitle').replace(
          '{count}',
          String(friends.length),
        )}
        title={t('friends.title')}
        actions={[
          { icon: 'search', onPress: () => navigation.navigate('SearchUsers') },
        ]}
      />

      <View style={styles.segmentWrap}>
        <SegmentedControl
          items={segments}
          value={tab}
          onChange={key => setTab(key as Tab)}
        />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <TabScreenScrollView contentContainerStyle={styles.content}>
          {tab === 'friends' &&
            (friends.length === 0 ? (
              <EmptyState
                icon="users"
                title={t('friends.empty_title')}
                description={t('friends.empty_desc')}
              />
            ) : (
              friends.map(f => {
                const name = displayName(f.User);
                return (
                  <UserListItem
                    key={f.FriendshipId}
                    name={name}
                    subtitle={`@${f.User.Username}`}
                    avatarUri={f.User.ProfileImage ?? undefined}
                    premium={f.User.IsVerified}
                    onPress={() => openProfile(f.User.UserId)}
                    right={
                      <View style={styles.rowActions}>
                        <IconButton
                          name="message"
                          size={18}
                          onPress={() => {}}
                        />
                      </View>
                    }
                  />
                );
              })
            ))}

          {tab === 'incoming' &&
            (incomingRequests.length === 0 ? (
              <EmptyState
                icon="bell"
                title={t('friends.incoming_empty_title')}
                description={t('friends.incoming_empty_desc')}
              />
            ) : (
              incomingRequests.map(r => {
                const name = displayName(r.User);
                const busy = busyId === r.FriendshipId;
                return (
                  <UserListItem
                    key={r.FriendshipId}
                    name={name}
                    subtitle={t('friends.incoming_meta')
                      .replace('{count}', '0')
                      .replace('{time}', formatRelativeTime(r.CreatedDate))}
                    avatarUri={r.User.ProfileImage ?? undefined}
                    premium={r.User.IsVerified}
                    onPress={() => openProfile(r.User.UserId)}
                    right={
                      <View style={styles.rowActions}>
                        <Button
                          label={t('friends.accept')}
                          size="sm"
                          minWidth={108}
                          fullWidth={false}
                          disabled={busy}
                          onPress={() => onAccept(r)}
                        />
                        <IconButton
                          name="close"
                          size={18}
                          variant="surface"
                          disabled={busy}
                          onPress={() => onReject(r)}
                        />
                      </View>
                    }
                  />
                );
              })
            ))}

          {tab === 'sent' &&
            (sentRequests.length === 0 ? (
              <EmptyState
                icon="send"
                title={t('friends.sent_empty_title')}
                description={t('friends.sent_empty_desc')}
              />
            ) : (
              sentRequests.map(r => {
                const name = displayName(r.User);
                const busy = busyId === r.FriendshipId;
                return (
                  <UserListItem
                    key={r.FriendshipId}
                    name={name}
                    subtitle={t('friends.sent_meta').replace(
                      '{time}',
                      formatRelativeTime(r.CreatedDate),
                    )}
                    avatarUri={r.User.ProfileImage ?? undefined}
                    onPress={() => openProfile(r.User.UserId)}
                    right={
                      <Pressable
                        onPress={() => onCancel(r)}
                        disabled={busy}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel={t('friends.cancel')}
                        style={({ pressed }) => [
                          styles.cancelChip,
                          {
                            backgroundColor: theme.colors.surfaceAlt,
                            borderColor: theme.colors.border,
                            opacity: busy ? 0.45 : pressed ? 0.82 : 1,
                          },
                        ]}>
                        <Icon
                          name="close"
                          size={14}
                          color={theme.colors.textMuted}
                        />
                        <Typography variant="caption" color="textSecondary">
                          {t('friends.cancel')}
                        </Typography>
                      </Pressable>
                    }
                  />
                );
              })
            ))}
        </TabScreenScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmentWrap: { paddingHorizontal: 20, marginBottom: 8 },
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 4 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cancelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default FriendsScreen;
