import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FriendshipRelation,
  getFriendshipStatus,
  getUserProfile,
  sendFriendRequest,
} from '../../api';
import { resolveMediaUrl } from '../../api/photos';
import {
  BridgeNearbyItem,
  DirectNearbyItem,
} from '../../api/proximity';
import { images } from '../../assets';
import {
  EmptyState,
  NearbyCard,
  NearbyUser,
  TabScreenScrollView,
} from '../../components';
import { useBlePresence } from '../../hooks/useBlePresence';
import { useLocale } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { NearbyStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { NearbyScanOverlay } from './NearbyScanOverlay';
import { NearbySkeleton } from './NearbySkeleton';

type Props = NativeStackScreenProps<NearbyStackParamList, 'NearbyMain'>;

const H_PAD = 20;
const GAP = 12;
const LOAD_MS = 400;

function estimateDistanceKm(
  item: DirectNearbyItem | BridgeNearbyItem,
): number {
  if (
    'DistanceKm' in item &&
    typeof item.DistanceKm === 'number' &&
    item.DistanceKm > 0
  ) {
    return item.DistanceKm;
  }
  if ('Rssi' in item && typeof item.Rssi === 'number') {
    const meters = Math.pow(10, (-59 - item.Rssi) / 20);
    return Math.max(0.001, meters / 1000);
  }
  const score = item.StrengthScore ?? 0;
  return Math.max(0.005, (100 - score) / 1000);
}

async function mapNearbyItem(
  item: DirectNearbyItem | BridgeNearbyItem,
): Promise<NearbyUser> {
  const photo = await resolveMediaUrl(item.ProfilePhotoUrl);
  return {
    id: String(item.UserId),
    name: item.FullName || 'User',
    age: item.Age ?? 0,
    distanceKm: estimateDistanceKm(item),
    online: true,
    photo,
    bio:
      'ViaUserId' in item && item.ViaFullName
        ? `via ${item.ViaFullName}`
        : undefined,
  };
}

export function NearbyScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t, device } = useLocale();
  const { userId, accessToken, isSignedIn } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const rootNav = useNavigation();

  const session = useMemo(
    () =>
      userId
        ? {
            userId,
            accessToken,
            knownDeviceId: device?.id ?? null,
            knownUniqueId: device?.uniqueId ?? null,
          }
        : null,
    [userId, accessToken, device?.id, device?.uniqueId],
  );

  const { state, start, stop, refresh, pollNearby } = useBlePresence(session);

  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [scanTipOpen, setScanTipOpen] = useState(false);
  const mappingRef = useRef(0);
  const addingRef = useRef<Record<string, boolean>>({});

  const closeScanTip = () => setScanTipOpen(false);
  const cardW = (windowWidth - H_PAD * 2 - GAP) / 2;

  const showScanOverlay =
    verified === true &&
    (state.status === 'starting' ||
      (state.refreshing && users.length === 0));

  const goToProfileTab = useCallback(() => {
    rootNav.getParent()?.navigate('Profile' as never);
  }, [rootNav]);

  useFocusEffect(
    useCallback(() => {
      if (!isSignedIn || !userId) {
        setVerified(false);
        return undefined;
      }

      let cancelled = false;

      (async () => {
        try {
          const me = await getUserProfile(userId, accessToken);
          if (cancelled) return;
          const ok = Boolean(me.IsVerified);
          setVerified(ok);
          if (ok) {
            start();
          } else {
            stop();
            // Unverified users cannot use Nearby — send them to Profile.
            rootNav.getParent()?.navigate('Profile' as never);
          }
        } catch {
          if (!cancelled) {
            setVerified(false);
            stop();
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [isSignedIn, userId, accessToken, start, stop, rootNav]),
  );

  useEffect(() => {
    if (!isSignedIn) {
      stop();
    }
  }, [isSignedIn, stop]);

  useEffect(() => {
    const boot = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(boot);
  }, []);

  useEffect(() => {
    if (verified !== true) return;

    const seq = ++mappingRef.current;
    const combined = [...state.direct, ...state.bridge];
    const byId = new Map<number, DirectNearbyItem | BridgeNearbyItem>();
    for (const item of combined) {
      if (!byId.has(item.UserId) || item.HopCount === 1) {
        byId.set(item.UserId, item);
      }
    }

    (async () => {
      const mapped = await Promise.all(
        Array.from(byId.values()).map(mapNearbyItem),
      );
      if (seq !== mappingRef.current) return;
      setUsers(mapped);

      // Prefill added state from friendship status (friends / pending out).
      if (userId && mapped.length > 0) {
        const statuses = await Promise.all(
          mapped.map(async u => {
            try {
              const res = await getFriendshipStatus(
                userId,
                Number(u.id),
                accessToken,
              );
              return {
                id: u.id,
                added:
                  res.Relation === FriendshipRelation.Friends ||
                  res.Relation === FriendshipRelation.PendingOutgoing,
              };
            } catch {
              return { id: u.id, added: false };
            }
          }),
        );
        if (seq !== mappingRef.current) return;
        setAdded(prev => {
          const next = { ...prev };
          for (const row of statuses) {
            if (row.added) next[row.id] = true;
          }
          return next;
        });
      }
    })();
  }, [state.direct, state.bridge, verified, userId, accessToken]);

  useEffect(() => {
    const parent = rootNav.getParent();
    if (!parent) return;

    const unsub = parent.addListener('tabPress' as never, () => {
      if (
        navigation.isFocused() &&
        verified === true &&
        state.status === 'running'
      ) {
        void pollNearby();
      }
    });

    return unsub;
  }, [rootNav, navigation, state.status, pollNearby, verified]);

  const onAddFriend = async (id: string) => {
    if (!userId || added[id] || addingRef.current[id]) return;
    addingRef.current[id] = true;
    try {
      await sendFriendRequest(userId, Number(id), accessToken);
      setAdded(prev => ({ ...prev, [id]: true }));
    } catch (error) {
      Alert.alert(
        t('user_profile.add_friend'),
        error instanceof Error ? error.message : t('nearby.add_friend_error'),
      );
    } finally {
      addingRef.current[id] = false;
    }
  };

  const onRefresh = () => {
    if (verified === true) refresh();
  };

  const emptyDesc =
    state.status === 'permission_denied'
      ? t('nearby.ble_permission_denied')
      : state.status === 'error'
        ? state.errorMessage || t('nearby.empty_desc')
        : t('nearby.empty_desc');

  if (loading || verified === null) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <NearbySkeleton />
      </SafeAreaView>
    );
  }

  if (verified === false) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          barStyle={theme.isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <EmptyState
          fill
          icon="shield"
          title={t('nearby.verified_required_title')}
          description={t('nearby.verified_required_desc')}
          actionLabel={t('nearby.verified_required_action')}
          onAction={goToProfileTab}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <View style={styles.flex}>
        <View style={styles.header}>
          {scanTipOpen ? (
            <Pressable
              style={styles.scanTipDismiss}
              onPress={closeScanTip}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            />
          ) : null}

          <View style={styles.headerText}>
            <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>
              {t('nearby.eyebrow')}
            </Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('nearby.title')}
            </Text>
          </View>

          <View style={styles.scanBtnWrap}>
            <Pressable
              onPress={() => {
                setScanTipOpen(false);
                if (state.status === 'idle' || state.status === 'error') {
                  start();
                } else {
                  refresh();
                }
              }}
              onLongPress={() => setScanTipOpen(open => !open)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('nearby.scan_action')}
              accessibilityState={{ expanded: scanTipOpen }}
              style={[
                styles.scanBtn,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                },
              ]}>
              <Image source={images.appLogo} style={styles.scanBtnLogo} />
            </Pressable>

            {scanTipOpen ? (
              <View
                style={[
                  styles.scanTip,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                  theme.shadows.sm,
                ]}>
                <View
                  style={[
                    styles.scanTipCaret,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}
                />
                <Text
                  style={[styles.scanTipTitle, { color: theme.colors.text }]}>
                  {t('nearby.scan_action')}
                </Text>
                <Text
                  style={[
                    styles.scanTipText,
                    { color: theme.colors.textMuted },
                  ]}>
                  {t('nearby.scan_banner')}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {users.length === 0 ? (
          <TabScreenScrollView
            contentContainerStyle={styles.emptyScroll}
            onScrollBeginDrag={closeScanTip}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }>
            <EmptyState
              image={images.appLogo}
              onImagePress={() => {
                if (state.status === 'idle') start();
                else refresh();
              }}
              imageAccessibilityLabel={t('nearby.scan_action')}
              title={t('nearby.empty_title')}
              description={emptyDesc}
            />
          </TabScreenScrollView>
        ) : (
          <TabScreenScrollView
            contentContainerStyle={styles.grid}
            onScrollBeginDrag={closeScanTip}
            refreshControl={
              <RefreshControl
                refreshing={state.refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }>
            {users.map(user => (
              <NearbyCard
                key={user.id}
                user={user}
                variant="grid"
                style={{ width: cardW }}
                added={!!added[user.id]}
                onAdd={() => {
                  void onAddFriend(user.id);
                }}
                onPress={() =>
                  navigation.navigate('UserProfile', { userId: user.id })
                }
              />
            ))}
          </TabScreenScrollView>
        )}
      </View>

      <NearbyScanOverlay
        visible={showScanOverlay}
        onCancel={() => {
          /* scanning is continuous while BLE runs */
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    position: 'relative',
    paddingHorizontal: H_PAD,
    paddingTop: 4,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 4,
    overflow: 'visible',
  },
  headerText: { flex: 1, gap: 2 },
  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  scanBtnWrap: {
    position: 'relative',
    zIndex: 5,
  },
  scanBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  scanTipDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  scanTip: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 10,
    width: 220,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 4,
    zIndex: 6,
    elevation: 12,
  },
  scanTipCaret: {
    position: 'absolute',
    top: -5,
    right: 16,
    width: 10,
    height: 10,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    transform: [{ rotate: '45deg' }],
    zIndex: 2,
  },
  scanTipTitle: { fontSize: 13, fontWeight: '700' },
  scanTipText: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
  emptyScroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 18,
    paddingHorizontal: H_PAD,
    paddingTop: 8,
  },
});

export default NearbyScreen;
