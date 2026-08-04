import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { images } from '../../assets';
import {
  EmptyState,
  NearbyCard,
  NearbyUser,
  TabScreenScrollView,
} from '../../components';
import { useLocale } from '../../i18n';
import { NearbyStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { NearbyScanOverlay } from './NearbyScanOverlay';
import { NearbySkeleton } from './NearbySkeleton';

type Props = NativeStackScreenProps<NearbyStackParamList, 'NearbyMain'>;

const H_PAD = 20;
const GAP = 12;
const LOAD_MS = 500;
const SCAN_MS = 2800;

export function NearbyScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const { width: windowWidth } = useWindowDimensions();
  const rootNav = useNavigation();

  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanTipOpen, setScanTipOpen] = useState(false);
  const contentOpacity = useSharedValue(0);
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const booted = useRef(false);

  const closeScanTip = () => setScanTipOpen(false);

  const cardW = (windowWidth - H_PAD * 2 - GAP) / 2;

  const clearScanTimer = () => {
    if (scanTimer.current) {
      clearTimeout(scanTimer.current);
      scanTimer.current = null;
    }
  };

  const finishScan = useCallback(() => {
    clearScanTimer();
    // No mock feed — real BLE/API results will land in setUsers later.
    setUsers([]);
    setScanning(false);
    setHasScanned(true);
    setRefreshing(false);
    contentOpacity.value = withTiming(1, {
      duration: 320,
      easing: Easing.out(Easing.quad),
    });
  }, [contentOpacity]);

  // Content stays visible under the overlay's translucent scrim — the
  // overlay handles dimming, so no extra opacity drop while scanning.
  const startScan = useCallback(() => {
    if (scanning) return;
    closeScanTip();
    clearScanTimer();
    setScanning(true);
    scanTimer.current = setTimeout(finishScan, SCAN_MS);
  }, [scanning, finishScan]);

  const cancelScan = useCallback(() => {
    clearScanTimer();
    setScanning(false);
    setRefreshing(false);
    contentOpacity.value = withTiming(1, { duration: 220 });
  }, [contentOpacity]);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    const boot = setTimeout(() => {
      setLoading(false);
      setScanning(true);
      contentOpacity.value = withTiming(1, { duration: 280 });
      scanTimer.current = setTimeout(finishScan, SCAN_MS);
    }, LOAD_MS);

    return () => {
      clearTimeout(boot);
      clearScanTimer();
    };
  }, [finishScan, contentOpacity]);

  useEffect(() => {
    const parent = rootNav.getParent();
    if (!parent) return;

    const unsub = parent.addListener('tabPress' as never, () => {
      if (navigation.isFocused() && !scanning && !loading) {
        startScan();
      }
    });

    return unsub;
  }, [rootNav, navigation, scanning, loading, startScan]);

  const contentFadeStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const toggleAdd = (id: string) =>
    setAdded(prev => ({ ...prev, [id]: !prev[id] }));

  const onRefresh = () => {
    setRefreshing(true);
    startScan();
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

          {!hasScanned ? (
            <View style={styles.preScan}>
              <Text
                style={[styles.preScanText, { color: theme.colors.textMuted }]}>
                {t('nearby.scan_prompt')}
              </Text>
            </View>
          ) : users.length === 0 ? (
            <TabScreenScrollView
              contentContainerStyle={styles.emptyScroll}
              onScrollBeginDrag={closeScanTip}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.colors.primary}
                />
              }>
              <EmptyState
                image={images.appLogo}
                onImagePress={startScan}
                imageAccessibilityLabel={t('nearby.scan_action')}
                title={t('nearby.empty_title')}
                description={t('nearby.empty_desc')}
              />
            </TabScreenScrollView>
          ) : (
            <TabScreenScrollView
              contentContainerStyle={styles.grid}
              onScrollBeginDrag={closeScanTip}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
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

      <NearbyScanOverlay visible={scanning} onCancel={cancelScan} />
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
  preScan: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  preScanText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
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
