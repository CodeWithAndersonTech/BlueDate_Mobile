import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import {
  Button,
  EmptyState,
  Header,
  IconButton,
  Screen,
  SegmentedControl,
  TabScreenScrollView,
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

type Props = NativeStackScreenProps<FriendsStackParamList, 'FriendsMain'>;

type Tab = 'friends' | 'incoming' | 'sent';

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
      setFriends(friendsRes.Items ?? []);
      setIncomingRequests(incomingRes.Items ?? []);
      setSentRequests(sentRes.Items ?? []);
    } catch (error) {
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
                      <Button
                        label={t('friends.cancel')}
                        size="sm"
                        variant="outline"
                        fullWidth={false}
                        disabled={busy}
                        onPress={() => onCancel(r)}
                      />
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
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default FriendsScreen;
