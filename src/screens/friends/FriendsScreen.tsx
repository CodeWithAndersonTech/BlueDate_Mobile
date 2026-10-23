import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  EmptyState,
  FigmaButton,
  FigmaIcon,
  FigmaSpinner,
  Screen,
  TabScreenScrollView,
  Typography,
} from '../../components';
import {
  acceptFriendRequest,
  cancelFriendRequest,
  displayName,
  FriendshipListItem,
  FriendshipRelation,
  getFriendshipSnapshot,
  getOrCreateDirectConversation,
  rejectFriendRequest,
  resolveFriendshipAvatars,
  unfriend,
} from '../../api';
import { useLocale, userFacingError } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { useChat } from '../../navigation/ChatContext';
import { FriendsStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { prefetchMediaUris } from '../../services/photos/prefetchMedia';
import { openFriendProfile } from '../../services/profile/visitCache';

type Props = NativeStackScreenProps<FriendsStackParamList, 'FriendsMain'>;

type Tab = 'friends' | 'incoming' | 'sent';

const FRIENDS_STALE_MS = 20_000;

function Face({ uri, name }: { uri?: string | null; name: string }) {
  const theme = useTheme();
  const letter = name.trim().charAt(0).toLocaleUpperCase('tr-TR') || '?';
  return (
    <View
      style={[
        styles.face,
        { backgroundColor: theme.colors.surfaceAlt, overflow: 'hidden' },
      ]}>
      {uri ? (
        <Image source={{ uri }} fadeDuration={0} style={StyleSheet.absoluteFill} />
      ) : (
        <Typography variant="callout" weight="600">
          {letter}
        </Typography>
      )}
    </View>
  );
}

export function FriendsScreen({ navigation }: Props) {
  const { t } = useLocale();
  const theme = useTheme();
  const { userId, accessToken } = useAuth();
  const { refreshInbox } = useChat();
  const [tab, setTab] = useState<Tab>('friends');
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [friends, setFriends] = useState<FriendshipListItem[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<
    FriendshipListItem[]
  >([]);
  const [sentRequests, setSentRequests] = useState<FriendshipListItem[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const inflight = useRef<Promise<void> | null>(null);
  const lastLoadAt = useRef(0);
  const readyRef = useRef(false);
  const friendsRef = useRef(friends);
  const incomingRef = useRef(incomingRequests);
  const sentRef = useRef(sentRequests);
  const tabRef = useRef(tab);
  friendsRef.current = friends;
  incomingRef.current = incomingRequests;
  sentRef.current = sentRequests;
  tabRef.current = tab;

  const load = useCallback(
    async (opts?: { tab?: Tab }) => {
      if (!userId) {
        setFriends([]);
        setIncomingRequests([]);
        setSentRequests([]);
        setLoading(false);
        readyRef.current = true;
        setReady(true);
        return;
      }
      if (inflight.current) {
        return inflight.current;
      }
      const which = opts?.tab ?? tabRef.current;
      const existing =
        which === 'friends'
          ? friendsRef.current
          : which === 'incoming'
            ? incomingRef.current
            : sentRef.current;
      const firstPaint = !readyRef.current;
      const silent = !firstPaint && existing.length > 0;
      if (!silent) {
        setLoading(true);
      }
      const task = (async () => {
        try {
          const snap = await getFriendshipSnapshot(userId, accessToken);
          const [nextFriends, nextIncoming, nextSent] = await Promise.all([
            resolveFriendshipAvatars(snap.friends).catch(() => []),
            resolveFriendshipAvatars(snap.incoming).catch(() => []),
            resolveFriendshipAvatars(snap.sent).catch(() => []),
          ]);
          const faces = [
            ...nextFriends.map(item => item.User.ProfileImage),
            ...nextIncoming.map(item => item.User.ProfileImage),
            ...nextSent.map(item => item.User.ProfileImage),
          ];
          setFriends(nextFriends);
          setIncomingRequests(nextIncoming);
          setSentRequests(nextSent);
          nextFriends.slice(0, 6).forEach(item => {
            openFriendProfile(item.User, accessToken, FriendshipRelation.Friends);
          });
          void prefetchMediaUris(faces, 2000);
          lastLoadAt.current = Date.now();
          readyRef.current = true;
          setReady(true);
        } catch {
          readyRef.current = true;
          setReady(true);
        } finally {
          setLoading(false);
          inflight.current = null;
        }
      })();
      inflight.current = task;
      return task;
    },
    [userId, accessToken, t],
  );

  useFocusEffect(
    useCallback(() => {
      if (
        readyRef.current &&
        lastLoadAt.current > 0 &&
        Date.now() - lastLoadAt.current < FRIENDS_STALE_MS
      ) {
        return;
      }
      void load();
    }, [load]),
  );

  const segments: { key: Tab; label: string }[] = [
    { key: 'friends', label: t('friends.tab.friends') },
    { key: 'incoming', label: t('friends.tab.incoming') },
    { key: 'sent', label: t('friends.tab.sent') },
  ];

  const openProfile = (item: FriendshipListItem) => {
    openFriendProfile(item.User, accessToken, FriendshipRelation.Friends);
    navigation.navigate('UserProfile', { userId: String(item.User.UserId) });
  };

  const openChat = async (otherUserId: number) => {
    if (!userId) return;
    setBusyId(otherUserId);
    try {
      const res = await getOrCreateDirectConversation(
        userId,
        otherUserId,
        accessToken,
      );
      if (!res.conversationId) {
        throw new Error(t('user_profile.action_error'));
      }
      await refreshInbox();
      const params = { conversationId: String(res.conversationId) };
      const tabs = navigation.getParent();
      const app = tabs?.getParent() ?? tabs ?? navigation;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (app as any).navigate('ChatThread', params);
    } catch (error) {
      Alert.alert(
        t('friends.message'),
        userFacingError(error, t, 'user_profile.action_error'),
      );
    } finally {
      setBusyId(null);
    }
  };

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
        userFacingError(error, t, 'user_profile.action_error'),
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
        userFacingError(error, t, 'user_profile.action_error'),
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
        userFacingError(error, t, 'user_profile.action_error'),
      );
    } finally {
      setBusyId(null);
    }
  };

  const onRemove = (item: FriendshipListItem) => {
    if (!userId) return;
    Alert.alert(t('user_profile.unfriend_title'), t('user_profile.unfriend_confirm'), [
      { text: t('profile.status_cancel'), style: 'cancel' },
      {
        text: t('friends.remove'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusyId(item.FriendshipId);
            try {
              await unfriend(userId, item.User.UserId, accessToken);
              await load();
            } catch (error) {
              Alert.alert(
                t('friends.remove'),
                userFacingError(error, t, 'user_profile.action_error'),
              );
            } finally {
              setBusyId(null);
            }
          })();
        },
      },
    ]);
  };

  const rows =
    tab === 'friends'
      ? friends
      : tab === 'incoming'
        ? incomingRequests
        : sentRequests;

  const emptyTitle =
    tab === 'friends'
      ? t('friends.empty_title')
      : tab === 'incoming'
        ? t('friends.incoming_empty_title')
        : t('friends.sent_empty_title');
  const emptyDesc =
    tab === 'friends'
      ? t('friends.empty_desc')
      : tab === 'incoming'
        ? t('friends.incoming_empty_desc')
        : t('friends.sent_empty_desc');

  const showSpinner = !ready || (loading && rows.length === 0);

  if (!ready) {
    return (
      <Screen edges={['top']}>
        <FigmaSpinner fill />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <FigmaIcon name="tabFriends" size={24} color={theme.colors.plusCta} />
        <Typography variant="title" style={styles.headerTitle}>
          {t('friends.title')}
        </Typography>
        <Pressable
          onPress={() => navigation.navigate('SearchUsers')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('friends.search_title')}>
          <FigmaIcon name="searchNormal" size={24} />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {segments.map(seg => {
          const active = seg.key === tab;
          return (
            <Pressable
              key={seg.key}
              onPress={() => {
                setTab(seg.key);
                void load({ tab: seg.key });
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={styles.tab}>
              <Typography
                variant="callout"
                weight={active ? '600' : '400'}
                tint={active ? theme.colors.plusCta : theme.colors.textMuted}>
                {seg.label}
              </Typography>
              <View
                style={[
                  styles.tabLine,
                  {
                    backgroundColor: active
                      ? theme.colors.plusCta
                      : theme.colors.transparent,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      {showSpinner ? (
        <FigmaSpinner fill />
      ) : (
        <TabScreenScrollView contentContainerStyle={styles.content}>
          {rows.length === 0 ? (
            <EmptyState
              figmaIcon="tabFriends"
              title={emptyTitle}
              description={emptyDesc}
            />
          ) : (
            rows.map(item => {
              const name = displayName(item.User);
              const busy = busyId === item.FriendshipId || busyId === item.User.UserId;
              return (
                <View key={item.FriendshipId}>
                  <View style={styles.row}>
                    <Pressable
                      onPress={() => openProfile(item)}
                      style={styles.identity}
                      accessibilityRole="button">
                      <Face uri={item.User.ProfileImage} name={name} />
                      <View style={styles.names}>
                        <Typography variant="callout" weight="600" numberOfLines={1}>
                          {name}
                        </Typography>
                        {item.User.Username ? (
                          <Typography variant="caption" color="textMuted" numberOfLines={1}>
                            {item.User.Username}
                          </Typography>
                        ) : null}
                      </View>
                    </Pressable>
                    <View style={styles.actions}>
                      {tab === 'friends' ? (
                        <>
                          <FigmaButton
                            label={t('friends.message')}
                            disabled={busy}
                            onPress={() => {
                              void openChat(item.User.UserId);
                            }}
                          />
                          <FigmaButton
                            label={t('friends.remove')}
                            tone="ghost"
                            disabled={busy}
                            onPress={() => onRemove(item)}
                          />
                        </>
                      ) : null}
                      {tab === 'incoming' ? (
                        <>
                          <FigmaButton
                            label={t('friends.accept')}
                            disabled={busy}
                            onPress={() => {
                              void onAccept(item);
                            }}
                          />
                          <FigmaButton
                            label={t('friends.reject')}
                            tone="ghost"
                            disabled={busy}
                            onPress={() => {
                              void onReject(item);
                            }}
                          />
                        </>
                      ) : null}
                      {tab === 'sent' ? (
                        <>
                          <FigmaButton label={t('friends.pending')} tone="soft" />
                          <FigmaButton
                            label={t('friends.cancel')}
                            tone="ghost"
                            disabled={busy}
                            onPress={() => {
                              void onCancel(item);
                            }}
                          />
                        </>
                      ) : null}
                    </View>
                  </View>
                  <View
                    style={[styles.divider, { backgroundColor: theme.colors.border }]}
                  />
                </View>
              );
            })
          )}
        </TabScreenScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 0,
    paddingBottom: 2,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    height: 43,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    height: 2,
    borderRadius: 1,
  },
  content: {
    paddingHorizontal: 10,
    paddingTop: 10,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
    paddingVertical: 5,
    gap: 8,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  names: {
    minWidth: 0,
    flexShrink: 1,
  },
  face: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});

export default FriendsScreen;
