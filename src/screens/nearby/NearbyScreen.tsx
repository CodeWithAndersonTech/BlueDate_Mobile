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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FootprintGroup,
  getFootprints,
  getUserProfile,
} from '../../api';
import { resolveMediaUrl } from '../../api/photos';
import {
  BridgeNearbyItem,
  DirectNearbyItem,
} from '../../api/proximity';
import { images } from '../../assets';
import {
  EmptyState,
  Icon,
  NearbyCard,
  NearbyUser,
  TabScreenScrollView,
  Typography,
} from '../../components';
import { useBlePresence } from '../../hooks/useBlePresence';
import { useHideTabBar } from '../../navigation/useHideTabBar';
import { getCurrentCoordinates } from '../../services/location/currentPosition';
import { StoryViewer } from '../home/StoryViewer';
import { FootprintsSection, FootprintsStatus } from './FootprintsSection';
import { useLocale } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { NearbyStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { NearbyScanOverlay } from './NearbyScanOverlay';
import { NearbySkeleton } from './NearbySkeleton';

type Props = NativeStackScreenProps<NearbyStackParamList, 'NearbyMain'>;

const H_PAD = 20;
const LOAD_MS = 400;
/** Keep the “searching” Meerk overlay up long enough to feel like a real scan. */
const SEARCH_UI_MS = 15_000;
/** Footprints are re-fetched on focus at most this often. */
const FOOTPRINTS_STALE_MS = 60_000;

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
    premium: item.IsFeatured,
    hasStory: item.HasStory,
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
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [scanTipOpen, setScanTipOpen] = useState(false);
  const [searchUiActive, setSearchUiActive] = useState(false);
  const mappingRef = useRef(0);
  const mappedSigRef = useRef('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [footprints, setFootprints] = useState<FootprintGroup[]>([]);
  const [footprintsStatus, setFootprintsStatus] = useState<FootprintsStatus>('loading');
  const [footprintsHours, setFootprintsHours] = useState(6);
  const [canOpenFootprintProfile, setCanOpenFootprintProfile] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const footprintsFetchedAt = useRef(0);
  useHideTabBar(viewerIndex !== null);

  const loadFootprints = useCallback(async (force = false) => {
    if (!force && Date.now() - footprintsFetchedAt.current < FOOTPRINTS_STALE_MS) return;
    footprintsFetchedAt.current = Date.now();
    const coords = await getCurrentCoordinates();
    if (!coords) {
      footprintsFetchedAt.current = 0;
      setFootprintsStatus(prev => (prev === 'ready' ? prev : 'no_location'));
      return;
    }
    try {
      const res = await getFootprints(coords.latitude, coords.longitude);
      setFootprints(res.items);
      setCanOpenFootprintProfile(res.canOpenProfile);
      setFootprintsHours(res.windowHours);
      setFootprintsStatus('ready');
    } catch {
      footprintsFetchedAt.current = 0;
      setFootprintsStatus(prev => (prev === 'loading' ? 'ready' : prev));
    }
  }, []);

  const openFootprintProfile = useCallback(
    (targetUserId: number) => {
      setViewerIndex(null);
      if (canOpenFootprintProfile) {
        navigation.navigate('UserProfile', { userId: String(targetUserId) });
        return;
      }
      Alert.alert(t('nearby.footprints_premium_title'), t('nearby.footprints_premium_body'), [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('notif.upgrade_cta'),
          onPress: () => rootNav.navigate('Premium' as never),
        },
      ]);
    },
    [canOpenFootprintProfile, navigation, rootNav, t],
  );

  const closeScanTip = () => setScanTipOpen(false);

  const endSearchUi = useCallback(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    setSearchUiActive(false);
  }, []);

  const beginSearchUi = useCallback(() => {
    setSearchUiActive(true);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      searchTimerRef.current = null;
      setSearchUiActive(false);
    }, SEARCH_UI_MS);
  }, []);

  useEffect(
    () => () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    },
    [],
  );

  // Found someone — drop the searching overlay immediately.
  useEffect(() => {
    if (users.length > 0) {
      endSearchUi();
    }
  }, [users.length, endSearchUi]);

  // Permission / hard errors shouldn't keep the fake “searching” chrome up.
  useEffect(() => {
    if (
      state.status === 'permission_denied' ||
      state.status === 'error' ||
      state.status === 'idle'
    ) {
      endSearchUi();
    }
  }, [state.status, endSearchUi]);

  const showScanOverlay =
    verified === true &&
    users.length === 0 &&
    (searchUiActive ||
      state.status === 'starting' ||
      state.refreshing);

  const kickOffScan = useCallback(() => {
    beginSearchUi();
    if (state.status === 'idle' || state.status === 'error') {
      start();
    } else {
      void refresh();
    }
  }, [beginSearchUi, refresh, start, state.status]);

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
            beginSearchUi();
            start();
            void loadFootprints();
          } else {
            endSearchUi();
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
    }, [
      isSignedIn,
      userId,
      accessToken,
      start,
      stop,
      rootNav,
      beginSearchUi,
      endSearchUi,
      loadFootprints,
    ]),
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
      const sig = mapped.map(u => `${u.id}:${u.photo ?? ''}:${u.hasStory ? 1 : 0}`).join('|');
      if (sig === mappedSigRef.current) return;
      mappedSigRef.current = sig;
      setUsers(mapped);
    })();
  }, [state.direct, state.bridge, verified]);

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

  const onRefresh = () => {
    if (verified !== true) return;
    if (users.length === 0) {
      beginSearchUi();
    }
    void refresh();
    void loadFootprints(true);
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

          <View
            style={[
              styles.pinChip,
              { backgroundColor: theme.colors.premiumSoft },
            ]}>
            <Icon name="map-pin" size={18} color={theme.colors.premium} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('nearby.title')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              {t('nearby.subtitle')}
            </Text>
          </View>

          <View style={styles.scanBtnWrap}>
            <Pressable
              onPress={() => {
                setScanTipOpen(false);
                kickOffScan();
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

        <TabScreenScrollView
          contentContainerStyle={[styles.scroll, { gap: theme.space.xl }]}
          onScrollBeginDrag={closeScanTip}
          refreshControl={
            <RefreshControl
              refreshing={state.refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }>
          {footprints.length > 0 ? (
            <View style={styles.section}>
              <FootprintsSection
                items={footprints}
                status={footprintsStatus}
                windowHours={footprintsHours}
                onOpen={setViewerIndex}
              />
            </View>
          ) : null}

          <View style={[styles.section, { gap: theme.space.sm }]}>
            <View style={styles.liveHeader}>
              <View style={[styles.liveDot, { backgroundColor: theme.colors.online }]} />
              <Typography variant="title">{t('nearby.live_title')}</Typography>
            </View>
            {users.length === 0 ? (
              <EmptyState
                image={images.appLogo}
                onImagePress={kickOffScan}
                imageAccessibilityLabel={t('nearby.scan_action')}
                title={t('nearby.empty_title')}
                description={emptyDesc}
              />
            ) : (
              <View style={styles.liveGrid}>
                {users.map(user => (
                  <NearbyCard
                    key={user.id}
                    user={user}
                    variant="rail"
                    onPress={() =>
                      navigation.navigate('UserProfile', { userId: user.id })
                    }
                  />
                ))}
              </View>
            )}
          </View>
        </TabScreenScrollView>
      </View>

      <NearbyScanOverlay
        visible={showScanOverlay}
        onCancel={endSearchUi}
      />

      <StoryViewer
        visible={viewerIndex !== null}
        groups={footprints}
        startGroupIndex={viewerIndex ?? 0}
        viewerUserId={userId ?? 0}
        onClose={() => setViewerIndex(null)}
        onOpenProfile={openFootprintProfile}
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
  pinChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerText: { flex: 1, gap: 4, minWidth: 0 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
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
  scroll: { flexGrow: 1, paddingTop: 8 },
  section: { paddingHorizontal: H_PAD },
  liveHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});

export default NearbyScreen;
