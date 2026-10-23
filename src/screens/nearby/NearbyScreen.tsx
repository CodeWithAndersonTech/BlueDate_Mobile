import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  FootprintGroup,
  getFootprints,
  getInterestTypes,
  getUserProfile,
  isProfileReadyForNearby,
  parseInterestTypes,
} from '../../api';
import { resolveMediaUrl } from '../../api/photos';
import {
  BridgeNearbyItem,
  DirectNearbyItem,
} from '../../api/proximity';
import {
  EmptyState,
  FigmaButton,
  FigmaIcon,
  NearbyCard,
  NearbyUser,
  SheetModal,
  TabScreenScrollView,
  Typography,
  useScreenTopPad,
} from '../../components';
import { useBlePresenceContext } from '../../navigation/BlePresenceContext';
import { useHideTabBar } from '../../navigation/useHideTabBar';
import { getCurrentCoordinates } from '../../services/location/currentPosition';
import { StoryViewer } from '../home/StoryViewer';
import { FootprintsSection, FootprintsStatus } from './FootprintsSection';
import { useLocale, userFacingError } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { usePremium } from '../../hooks/usePremium';
import { MainTabParamList, NearbyStackParamList } from '../../navigation/types';
import { FOOTPRINTS_ENABLED } from '../../config/nearby';
import { useTheme } from '../../theme';
import { afterUiSettled } from '../../utils/afterUiSettled';
import { NearbyEmpty } from './NearbyEmpty';
import { NearbyScanOverlay } from './NearbyScanOverlay';

type Props = NativeStackScreenProps<NearbyStackParamList, 'NearbyMain'>;

const H_PAD = 20;
const LOAD_MS = 400;
/** Keep the “searching” Meerk overlay up long enough to feel like a real scan. */
const SEARCH_UI_MS = 6_000;
/** Footprints are re-fetched on focus at most this often. */
const FOOTPRINTS_STALE_MS = 60_000;
const VERIFY_STALE_MS = 25_000;

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
    handle: item.Username || undefined,
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
  const topPad = useScreenTopPad();
  const { t } = useLocale();
  const { userId, accessToken, isSignedIn } = useAuth();
  const rootNav = useNavigation();
  const { state, start, refresh, pollNearby } = useBlePresenceContext();
  const { isPremium } = usePremium();

  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState<boolean | null>(null);
  const verifiedRef = useRef<boolean | null>(null);
  verifiedRef.current = verified;
  const lastVerifyAt = useRef(0);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [searchUiActive, setSearchUiActive] = useState(false);
  const mappingRef = useRef(0);
  const mappedSigRef = useRef('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [footprints, setFootprints] = useState<FootprintGroup[]>([]);
  const [footprintsStatus, setFootprintsStatus] = useState<FootprintsStatus>('loading');
  const [footprintsHours, setFootprintsHours] = useState(6);
  const [canOpenFootprintProfile, setCanOpenFootprintProfile] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [premiumGateOpen, setPremiumGateOpen] = useState(false);
  const footprintsFetchedAt = useRef(0);
  const canOpenFootprint = canOpenFootprintProfile || isPremium;
  useHideTabBar(viewerIndex !== null);

  const loadFootprints = useCallback(async (force = false) => {
    if (!FOOTPRINTS_ENABLED) return;
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
      if (canOpenFootprint) {
        navigation.navigate('UserProfile', { userId: String(targetUserId) });
        return;
      }
      afterUiSettled(() => setPremiumGateOpen(true), 40);
    },
    [canOpenFootprint, navigation],
  );

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

  const showList = !showScanOverlay && users.length > 0;
  const showEmpty = !showScanOverlay && users.length === 0;

  const goToCompleteProfile = useCallback(() => {
    afterUiSettled(() => {
      let nav:
        | {
            getState?: () => { routeNames?: string[] };
            navigate: (name: string, params?: object) => void;
            getParent?: () => unknown;
          }
        | undefined = navigation;
      while (nav) {
        const names = nav.getState?.()?.routeNames ?? [];
        if (names.includes('Profile') && names.includes('Nearby')) {
          // Stay on ProfileMain — pushing EditProfile during a tab
          // change trips iOS 26 Material Top Tabs.
          nav.navigate('Profile' as keyof MainTabParamList, {
            screen: 'ProfileMain',
          });
          return;
        }
        nav = nav.getParent?.() as typeof nav;
      }
    });
  }, [navigation]);

  const checkVerified = useCallback(async () => {
    if (!isSignedIn || !userId) {
      setVerified(false);
      setProfileLoadError(null);
      return;
    }

    if (
      verifiedRef.current === true &&
      lastVerifyAt.current > 0 &&
      Date.now() - lastVerifyAt.current < VERIFY_STALE_MS
    ) {
      void start();
      return;
    }

    try {
      const [me, typesRes] = await Promise.all([
        getUserProfile(userId, accessToken),
        getInterestTypes(accessToken).catch(() => null),
      ]);
          const types = parseInterestTypes(typesRes);
      const ok = isProfileReadyForNearby(me, types);
      setProfileLoadError(null);
      setVerified(ok);
      lastVerifyAt.current = Date.now();
      if (ok) {
        void start();
        void refresh();
        void loadFootprints();
      } else {
        endSearchUi();
      }
    } catch (error) {
      setVerified(null);
      setProfileLoadError(userFacingError(error, t, 'nearby.profile_load_desc'));
      endSearchUi();
    }
  }, [
    isSignedIn,
    userId,
    accessToken,
    start,
    refresh,
    endSearchUi,
    loadFootprints,
    t,
  ]);

  useFocusEffect(
    useCallback(() => {
      void checkVerified();
      if (verified !== true) {
        return undefined;
      }
      void start();
      void pollNearby();
      return undefined;
    }, [checkVerified, verified, start, pollNearby]),
  );

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

  const liveUserIds = useMemo(() => {
    const ids = new Set<number>();
    for (const item of state.direct) ids.add(item.UserId);
    for (const item of state.bridge) ids.add(item.UserId);
    return ids;
  }, [state.direct, state.bridge]);

  const liveFootprintKey = [...liveUserIds].sort((a, b) => a - b).join(',');
  useEffect(() => {
    if (!FOOTPRINTS_ENABLED || !liveFootprintKey) return;
    void loadFootprints(true);
  }, [liveFootprintKey, loadFootprints]);

  const visibleFootprints = useMemo(
    () =>
      FOOTPRINTS_ENABLED
        ? footprints.filter(g => !liveUserIds.has(g.User.UserId))
        : [],
    [footprints, liveUserIds],
  );

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
    if (FOOTPRINTS_ENABLED) {
      void loadFootprints(true);
    }
  };

  const emptyDesc =
    state.status === 'permission_denied'
      ? t('nearby.ble_permission_denied')
      : state.status === 'error'
        ? state.errorMessage || t('nearby.empty_desc')
        : t('nearby.empty_desc');

  const searching =
    (((loading || verified === null) && !profileLoadError) || showScanOverlay);
  const headerOnly =
    searching ||
    showEmpty ||
    (FOOTPRINTS_ENABLED && visibleFootprints.length === 0 && users.length === 0);

  const nearbyHeader = (
    <View style={styles.header}>
      <FigmaIcon name="location" size={24} />
      <Typography variant="title" style={styles.headerTitle}>
        {t('nearby.title')}
      </Typography>
      <Pressable
        onPress={kickOffScan}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('nearby.scan_action')}>
        <FigmaIcon name="rotateRight" size={24} />
      </Pressable>
    </View>
  );

  if (profileLoadError) {
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
        <EmptyState
          fill
          figmaIcon="rotateRight"
          title={t('nearby.profile_load_title')}
          description={profileLoadError}
          actionLabel={t('nearby.retry')}
          onAction={() => {
            void checkVerified();
          }}
        />
      </View>
    );
  }

  if (verified === false) {
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
        <EmptyState
          fill
          figmaIcon="shield"
          title={t('nearby.verified_required_title')}
          description={t('nearby.verified_required_desc')}
          actionLabel={t('nearby.verified_required_action')}
          onAction={goToCompleteProfile}
        />
      </View>
    );
  }

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

      {searching ? <NearbyScanOverlay /> : null}

      <View style={styles.flex} pointerEvents="box-none">
        {nearbyHeader}
        {!headerOnly ? (
          <View style={styles.subtitleWrap}>
            <Typography variant="caption">{t('nearby.subtitle')}</Typography>
          </View>
        ) : null}

        {searching ? null : showEmpty ? (
          <NearbyEmpty description={emptyDesc} onRetry={kickOffScan} />
        ) : (
          <TabScreenScrollView
            contentContainerStyle={styles.scroll}
            refreshControl={
              <RefreshControl
                refreshing={state.refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.premium}
              />
            }>
            {FOOTPRINTS_ENABLED && visibleFootprints.length > 0 ? (
              <View style={styles.section}>
                <FootprintsSection
                  items={visibleFootprints}
                  status={footprintsStatus}
                  windowHours={footprintsHours}
                  hint={
                    canOpenFootprint
                      ? undefined
                      : t('nearby.footprints_premium_hint')
                  }
                  onOpen={setViewerIndex}
                />
              </View>
            ) : null}

            <View style={styles.section}>
              <View style={styles.liveHeader}>
                <FigmaIcon name="live" size={20} />
                <Typography variant="callout" weight="600">
                  {t('nearby.live_title')}
                </Typography>
              </View>
              <View style={styles.liveGrid}>
                {users.map(user => (
                  <NearbyCard
                    key={user.id}
                    user={user}
                    variant="rail"
                    onPress={() =>
                      navigation.navigate('UserProfile', {
                        userId: user.id,
                      })
                    }
                  />
                ))}
              </View>
            </View>
          </TabScreenScrollView>
        )}
      </View>

      {FOOTPRINTS_ENABLED ? (
        <>
          <StoryViewer
            visible={viewerIndex !== null}
            groups={visibleFootprints}
            startGroupIndex={viewerIndex ?? 0}
            viewerUserId={userId ?? 0}
            onClose={() => setViewerIndex(null)}
            onOpenProfile={openFootprintProfile}
          />

          <SheetModal
            visible={premiumGateOpen}
            title={t('nearby.footprints_premium_title')}
            onClose={() => setPremiumGateOpen(false)}>
            <Typography variant="callout" color="textMuted">
              {t('nearby.footprints_premium_body')}
            </Typography>
            <FigmaButton
              label={t('notif.upgrade_cta')}
              onPress={() => {
                setPremiumGateOpen(false);
                afterUiSettled(() => rootNav.navigate('Premium' as never), 40);
              }}
            />
            <FigmaButton
              label={t('settings.cancel')}
              tone="ghost"
              onPress={() => setPremiumGateOpen(false)}
            />
          </SheetModal>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 10,
    paddingTop: 0,
    paddingBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  subtitleWrap: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 40,
  },
  scroll: { flexGrow: 1, paddingBottom: 24 },
  section: { paddingHorizontal: H_PAD },
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 10,
  },
  liveGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});

export default NearbyScreen;
