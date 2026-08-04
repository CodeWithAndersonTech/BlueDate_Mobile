import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  if ('DistanceKm' in item && typeof item.DistanceKm === 'number' && item.DistanceKm > 0) {
    return item.DistanceKm;
  }
  if ('Rssi' in item && typeof item.Rssi === 'number') {
    const meters = Math.pow(10, (-59 - item.Rssi) / 20);
    return Math.max(0.001, meters / 1000);
  }
  // Bridge / unknown: soften by strength (0-100 → ~5m-80m)
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

  const { state, start, stop, refresh } = useBlePresence(session);

  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [scanTipOpen, setScanTipOpen] = useState(false);
  const contentOpacity = useSharedValue(0);
  const mappingRef = useRef(0);

  const closeScanTip = () => setScanTipOpen(false);
  const cardW = (windowWidth - H_PAD * 2 - GAP) / 2;

  const scanning =
    state.status === 'starting' ||
    (state.refreshing && users.length === 0);

  useFocusEffect(
    useCallback(() => {
      if (!isSignedIn || !session) return undefined;
      start();
      return () => {
        // Keep advertising while tab stack stays mounted; stop only on sign-out.
      };
    }, [isSignedIn, session, start]),
  );

  useEffect(() => {
    if (!isSignedIn) {
      stop();
    }
  }, [isSignedIn, stop]);

  useEffect(() => {
    const boot = setTimeout(() => {
      setLoading(false);
      contentOpacity.value = withTiming(1, {
        duration: 280,
        easing: Easing.out(Easing.quad),
      });
    }, LOAD_MS);
    return () => clearTimeout(boot);
  }, [contentOpacity]);

  useEffect(() => {
    const seq = ++mappingRef.current;
    const combined = [...state.direct, ...state.bridge];
    // Dedupe by userId — prefer direct over bridge
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
      if (mapped.length > 0) {
        contentOpacity.value = withTiming(1, { duration: 280 });
      }
    })();
  }, [state.direct, state.bridge, contentOpacity]);

  useEffect(() => {
    const parent = rootNav.getParent();
    if (!parent) return;

    const unsub = parent.addListener('tabPress' as never, () => {
      if (navigation.isFocused() && state.status === 'running') {
        refresh();
      }
    });

    return unsub;
  }, [rootNav, navigation, state.status, refresh]);

  const contentFadeStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const toggleAdd = (id: string) =>
    setAdded(prev => ({ ...prev, [id]: !prev[id] }));

  const onRefresh = () => {
    refresh();
  };

  const emptyDesc =
    state.status === 'permission_denied'
      ? t('nearby.ble_permission_denied')
      : state.status === 'error'
        ? state.errorMessage || t('nearby.empty_desc')
        : t('nearby.empty_desc');

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {loading ? (
        <NearbySkeleton />
      ) : (
        <Animated.View style={[styles.flex, contentFadeStyle]}>
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
              <Text
                style={[styles.eyebrow, { color: theme.colors.textMuted }]}>
                {t('nearby.eyebrow')}
              </Text>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {t('nearby.title')}
              </Text>
            </View>

            <View style={styles.scanBtnWrap}>
              <Pressable
                onPress={() => setScanTipOpen(open => !open)}
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
                  refreshing={state.refreshing}
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
                  onAdd={() => toggleAdd(user.id)}
                  onPress={() =>
                    navigation.navigate('UserProfile', { userId: user.id })
                  }
                />
              ))}
            </TabScreenScrollView>
          )}
        </Animated.View>
      )}

      <NearbyScanOverlay
        visible={scanning && !state.refreshing}
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
    marginTop: 10,
    zIndex: 5,
  },
  scanBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scanBtnLogo: {
    width: 32,
    height: 32,
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
    rowGap: 12,
    paddingHorizontal: H_PAD,
    paddingTop: 4,
  },
});

export default NearbyScreen;
