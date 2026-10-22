import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { purchasePremium } from '../../api';
import {
  FigmaButton,
  FigmaIcon,
  Icon,
  IconName,
  TabScreenScrollView,
  useScreenTopPad,
} from '../../components';
import { publishPremium, usePremium } from '../../hooks/usePremium';
import { useLocale, userFacingError } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { AppStackParamList } from '../../navigation/types';
import {
  buyProduct,
  completePurchase,
  getDisplayPrices,
  getOwnedSubscriptions,
  IAP_PRODUCTS,
  IapCancelledError,
  IapUnavailableError,
} from '../../services/iap';
import { useTheme } from '../../theme';
import { premiumPerks, premiumPlans } from '../../utils';
import { PremiumSkeleton } from './PremiumSkeleton';

const LOAD_MS = 650;
// Approximate rendered height of the sticky footer card, used to pad the
// scroll content so the last perk clears the footer.
const FOOTER_HEIGHT = 160;
const FOOTER_GAP = 12;

const PRODUCT_FOR_PLAN: Record<string, string> = {
  standard: IAP_PRODUCTS.standard,
  plus: IAP_PRODUCTS.plus,
};

type Props = NativeStackScreenProps<AppStackParamList, 'Premium'>;

export function PremiumScreen({ navigation }: Props) {
  const theme = useTheme();
  const gold = theme.gradients.premium;
  const onGold = theme.colors.onPremium;
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const topPad = useScreenTopPad();
  const tabBarOffset = Math.max(insets.bottom, 12) + FOOTER_GAP;
  const { userId } = useAuth();
  const { premium, isPremium, planCode } = usePremium();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [buying, setBuying] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(
    premiumPlans.find(p => p.popular)?.id ?? premiumPlans[0].id,
  );
  const active = premiumPlans.find(p => p.id === plan) ?? premiumPlans[0];
  const contentOpacity = useSharedValue(0);

  const scale = useSharedValue(1);
  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const contentFadeStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      contentOpacity.value = withTiming(1, {
        duration: 280,
        easing: Easing.out(Easing.quad),
      });
    }, LOAD_MS);
    return () => clearTimeout(timer);
  }, [contentOpacity]);

  useEffect(() => {
    let cancelled = false;
    getDisplayPrices([IAP_PRODUCTS.standard, IAP_PRODUCTS.plus], 'subs').then(map => {
      if (!cancelled) setPrices(map);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const priceFor = (planId: string, fallback: string) =>
    prices[PRODUCT_FOR_PLAN[planId]] ?? fallback;

  const currentPlan = isPremium ? (planCode ?? 'standard').toLowerCase() : null;
  const ownsActive = currentPlan === active.id || (currentPlan === 'plus' && active.id === 'standard');

  const onBuy = useCallback(async () => {
    if (!userId || buying) return;
    setBuying(true);
    try {
      const { payment, purchase } = await buyProduct(PRODUCT_FOR_PLAN[active.id], 'subs');
      const next = await purchasePremium(userId, payment);
      await completePurchase(purchase, false);
      publishPremium(next);
      Alert.alert(t('premium.title'), t('premium.activated'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      if (error instanceof IapCancelledError) return;
      Alert.alert(
        t('premium.title'),
        error instanceof IapUnavailableError
          ? t('iap.unavailable')
          : userFacingError(error, t, 'premium.purchase_error'),
      );
    } finally {
      setBuying(false);
    }
  }, [userId, buying, active.id, navigation, t]);

  const onRestore = useCallback(async () => {
    if (!userId || restoring) return;
    setRestoring(true);
    try {
      const owned = await getOwnedSubscriptions();
      // Plus first so a stacked Standard receipt never downgrades.
      owned.sort((a, b) => (a.ProductId === IAP_PRODUCTS.plus ? -1 : b.ProductId === IAP_PRODUCTS.plus ? 1 : 0));
      let restored = false;
      for (const payment of owned) {
        try {
          publishPremium(await purchasePremium(userId, payment));
          restored = true;
          break;
        } catch {
          /* try the next receipt */
        }
      }
      Alert.alert(t('premium.title'), restored ? t('premium.restored') : t('premium.restore_none'));
    } finally {
      setRestoring(false);
    }
  }, [userId, restoring, t]);

  const visiblePerks = useMemo(() => {
    const ids = new Set(active.perkIds);
    return premiumPerks.filter(perk => ids.has(perk.id));
  }, [active.perkIds]);

  if (loading) {
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
        <PremiumSkeleton />
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

      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}>
          <View style={styles.backIcon}>
            <FigmaIcon name="arrowRight" size={15} color={theme.colors.text} />
          </View>
        </Pressable>
        <View style={styles.topBarSpacer} />
        <Pressable
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('premium.title')}>
          <FigmaIcon name="moreDots" size={20} color={theme.colors.text} />
        </Pressable>
      </View>
      <Animated.View style={[styles.flex, contentFadeStyle]}>
        <TabScreenScrollView
          style={styles.flex}
          bottomSpacing={FOOTER_HEIGHT + FOOTER_GAP + 12}
          contentContainerStyle={styles.content}>
          <View style={[styles.hero, theme.shadows.md]}>
            <LinearGradient colors={gold} style={StyleSheet.absoluteFill} />
            <View style={styles.heroInner}>
              <View style={styles.crownWrap}>
                <FigmaIcon name="crown" size={28} color={onGold} />
              </View>
              <Text style={[styles.heroTitle, { color: onGold }]}>
                {t('premium.hero_title')}
              </Text>
              <Text style={[styles.heroTitle, { color: onGold }]}>
                {t('premium.hero_subtitle')}
              </Text>
              <Text style={styles.heroDesc}>{t('premium.subtitle')}</Text>
              {premium?.isPremium ? (
                <View style={styles.trialPill}>
                  <FigmaIcon name="tickCircle" size={12} color={onGold} />
                  <Text style={[styles.trialText, { color: onGold }]}>
                    {(currentPlan === 'plus'
                      ? t('premium.current_plus')
                      : t('premium.current_standard')
                    ).replace('{days}', String(premium.daysRemaining ?? 0))}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('premium.choose_plan')}
            </Text>
            <View style={styles.plans}>
              {premiumPlans.map(p => {
                const selected = p.id === plan;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setPlan(p.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      styles.plan,
                      {
                        backgroundColor: theme.colors.card,
                        borderColor: selected
                          ? theme.colors.plusCta
                          : theme.colors.border,
                        borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
                      },
                      selected ? theme.shadows.sm : null,
                    ]}>
                    <View style={styles.planLeft}>
                      <View
                        style={[
                          styles.radio,
                          {
                            borderColor: selected
                              ? theme.colors.plusCta
                              : theme.colors.borderStrong,
                            backgroundColor: selected
                              ? theme.colors.plusCta
                              : 'transparent',
                          },
                        ]}>
                        {selected ? (
                          <Icon
                            name="check"
                            size={12}
                            color={theme.colors.onPrimary}
                            strokeWidth={3}
                          />
                        ) : null}
                      </View>
                      <View style={styles.planCopy}>
                        <View style={styles.planNameRow}>
                          <Text
                            style={[
                              styles.planName,
                              { color: theme.colors.text },
                            ]}>
                            {t(p.nameKey)}
                          </Text>
                          {p.taglineKey ? (
                            <View
                              style={[
                                styles.tag,
                                {
                                  backgroundColor: selected
                                    ? theme.colors.plusSoft
                                    : theme.colors.surfaceAlt,
                                },
                              ]}>
                              <Text
                                style={[
                                  styles.tagText,
                                  {
                                    color: selected
                                      ? theme.colors.plusCta
                                      : theme.colors.textMuted,
                                  },
                                ]}>
                                {t(p.taglineKey)}
                              </Text>
                            </View>
                          ) : null}
                          {p.popular ? (
                            <View
                              style={[
                                styles.pop,
                                { backgroundColor: theme.colors.plusSoft },
                              ]}>
                              <Text
                                style={[
                                  styles.popText,
                                  { color: theme.colors.plusCta },
                                ]}>
                                {t('premium.popular')}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text
                          style={[
                            styles.planMeta,
                            { color: theme.colors.textMuted },
                          ]}>
                          {p.perMonthKey
                            ? t(p.perMonthKey)
                            : p.highlightKey
                              ? t(p.highlightKey)
                              : t('premium.renews')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.planRight}>
                      <Text
                        style={[styles.planPrice, { color: theme.colors.text }]}>
                        {priceFor(p.id, p.price)}
                      </Text>
                      <Text
                        style={[
                          styles.planPeriod,
                          { color: theme.colors.textMuted },
                        ]}>
                        {t(p.periodKey)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {active.id === 'plus'
                ? t('premium.features_plus')
                : t('premium.features_standard')}
            </Text>
            <View style={styles.perks}>
              {visiblePerks.map(perk => (
                <View
                  key={perk.id}
                  style={[
                    styles.perk,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                    theme.shadows.sm,
                  ]}>
                  <View
                    style={[
                      styles.perkIcon,
                      {
                        backgroundColor: perk.plusOnly
                          ? theme.colors.premiumSoft
                          : theme.colors.plusSoft,
                      },
                    ]}>
                    <Icon
                      name={perk.icon as IconName}
                      size={18}
                      color={perk.plusOnly ? onGold : theme.colors.plusCta}
                    />
                  </View>
                  <View style={styles.perkBody}>
                    <View style={styles.perkTitleRow}>
                      <Text
                        style={[
                          styles.perkTitle,
                          { color: theme.colors.text },
                        ]}>
                        {t(perk.titleKey)}
                      </Text>
                      {perk.plusOnly ? (
                        <View
                          style={[
                            styles.plusBadge,
                            { backgroundColor: theme.colors.premiumSoft },
                          ]}>
                          <Text
                            style={[
                              styles.plusBadgeText,
                              { color: onGold },
                            ]}>
                            {t('premium.plus_badge')}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.perkDesc,
                        { color: theme.colors.textMuted },
                      ]}>
                      {t(perk.descriptionKey)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </TabScreenScrollView>

        <View
          pointerEvents="box-none"
          style={[
            styles.footerDock,
            {
              bottom: tabBarOffset,
            },
          ]}>
          <View
            style={[
              styles.footer,
              theme.shadows.md,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}>
            <View style={styles.footerSummary}>
              <Text
                style={[styles.footerLabel, { color: theme.colors.textMuted }]}>
                {t(active.nameKey)}
                {active.taglineKey ? ` · ${t(active.taglineKey)}` : ''}
              </Text>
              <Text style={[styles.footerPrice, { color: theme.colors.text }]}>
                {priceFor(active.id, active.price)}
                <Text
                  style={[
                    styles.footerPeriod,
                    { color: theme.colors.textMuted },
                  ]}>
                  {' '}
                  {t(active.periodKey)}
                </Text>
              </Text>
            </View>
            <FigmaButton
              label={
                ownsActive
                  ? t('premium.cta_owned')
                  : active.id === 'plus'
                    ? t('premium.cta_plus')
                    : t('premium.cta')
              }
              size="md"
              fullWidth
              loading={buying}
              disabled={ownsActive}
              onPress={() => {
                void onBuy();
              }}
            />
            <FigmaButton
              label={restoring ? t('premium.restoring') : t('premium.restore')}
              tone="muted"
              fullWidth
              disabled={restoring}
              onPress={() => {
                void onRestore();
              }}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 0,
    paddingBottom: 8,
    minHeight: 30,
  },
  topBarSpacer: { flex: 1 },
  backIcon: {
    transform: [{ rotate: '180deg' }],
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 28,
  },
  hero: { borderRadius: 24, overflow: 'hidden' },
  heroInner: { padding: 24, gap: 10 },
  crownWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroDesc: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: 'rgba(44,33,0,0.72)',
  },
  trialPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  trialText: { fontSize: 12, fontWeight: '700' },
  section: { gap: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  plans: { gap: 10 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    gap: 12,
  },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCopy: { flex: 1, gap: 4 },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  planName: { fontSize: 15, fontWeight: '700' },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  pop: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  popText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  planMeta: { fontSize: 12, fontWeight: '500' },
  planRight: { alignItems: 'flex-end', gap: 2 },
  planPrice: { fontSize: 20, fontWeight: '700' },
  planPeriod: { fontSize: 12, fontWeight: '500' },
  perks: { gap: 10 },
  perk: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  perkIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkBody: { flex: 1, gap: 4 },
  perkTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  perkTitle: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
  plusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  plusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  perkDesc: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
  footerDock: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 20,
    elevation: 20,
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  footerSummary: { gap: 2 },
  footerLabel: { fontSize: 12, fontWeight: '500' },
  footerPrice: { fontSize: 18, fontWeight: '700' },
  footerPeriod: { fontSize: 12, fontWeight: '500' },
  cta: {
    height: 54,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaLabel: { fontSize: 16, fontWeight: '700' },
  ctaOwned: { opacity: 0.6 },
  restore: { alignSelf: 'center', paddingVertical: 2 },
});

export default PremiumScreen;
