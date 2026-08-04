import React, { useEffect, useMemo, useState } from 'react';
import {
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, IconName, TabScreenScrollView } from '../../components';
import { useLocale } from '../../i18n';
import { useFloatingTabOffset } from '../../navigation/tabBarLayout';
import { useTheme } from '../../theme';
import { premiumPerks, premiumPlans } from '../../utils';
import { PremiumSkeleton } from './PremiumSkeleton';

const GOLD: [string, string] = ['#F5D76E', '#E8A838'];
const ON_GOLD = '#2C2100';
const LOAD_MS = 650;
// Approximate rendered height of the sticky footer card, used to pad the
// scroll content so the last perk clears the footer.
const FOOTER_HEIGHT = 132;
const FOOTER_GAP = 70;

export function PremiumScreen() {
  const theme = useTheme();
  const { t } = useLocale();
  // Sticky footer docks right above the floating tab pill.
  const tabBarOffset = useFloatingTabOffset(FOOTER_GAP);
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

  const visiblePerks = useMemo(() => {
    const ids = new Set(active.perkIds);
    return premiumPerks.filter(perk => ids.has(perk.id));
  }, [active.perkIds]);

  if (loading) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          barStyle={theme.isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <PremiumSkeleton />
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

      <Animated.View style={[styles.flex, contentFadeStyle]}>
        <TabScreenScrollView
          style={styles.flex}
          bottomSpacing={FOOTER_HEIGHT + FOOTER_GAP + 12}
          contentContainerStyle={styles.content}>
          <View style={[styles.hero, theme.shadows.md]}>
            <LinearGradient colors={GOLD} style={StyleSheet.absoluteFill} />
            <View style={styles.heroInner}>
              <View style={styles.crownWrap}>
                <Icon name="crown" size={28} color={ON_GOLD} filled />
              </View>
              <Text style={[styles.heroTitle, { color: ON_GOLD }]}>
                {t('premium.title')}
              </Text>
              <Text style={styles.heroDesc}>{t('premium.subtitle')}</Text>
              <View style={styles.trialPill}>
                <Icon name="sparkles" size={12} color={ON_GOLD} />
                <Text style={[styles.trialText, { color: ON_GOLD }]}>
                  {t('premium.trial')}
                </Text>
              </View>
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
                          ? theme.colors.primary
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
                              ? theme.colors.primary
                              : theme.colors.borderStrong,
                            backgroundColor: selected
                              ? theme.colors.primary
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
                            {p.name}
                          </Text>
                          {p.tagline ? (
                            <View
                              style={[
                                styles.tag,
                                {
                                  backgroundColor: selected
                                    ? theme.colors.primarySoft
                                    : theme.colors.surfaceAlt,
                                },
                              ]}>
                              <Text
                                style={[
                                  styles.tagText,
                                  {
                                    color: selected
                                      ? theme.colors.primary
                                      : theme.colors.textMuted,
                                  },
                                ]}>
                                {p.tagline}
                              </Text>
                            </View>
                          ) : null}
                          {p.popular ? (
                            <View
                              style={[
                                styles.pop,
                                { backgroundColor: theme.colors.primarySoft },
                              ]}>
                              <Text
                                style={[
                                  styles.popText,
                                  { color: theme.colors.primary },
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
                          {p.perMonth ?? p.highlight ?? t('premium.renews')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.planRight}>
                      <Text
                        style={[styles.planPrice, { color: theme.colors.text }]}>
                        {p.price}
                      </Text>
                      <Text
                        style={[
                          styles.planPeriod,
                          { color: theme.colors.textMuted },
                        ]}>
                        {p.period}
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
                          ? 'rgba(245, 215, 110, 0.28)'
                          : theme.colors.primarySoft,
                      },
                    ]}>
                    <Icon
                      name={perk.icon as IconName}
                      size={18}
                      color={perk.plusOnly ? ON_GOLD : theme.colors.primary}
                      filled={perk.icon !== 'eye-off'}
                    />
                  </View>
                  <View style={styles.perkBody}>
                    <View style={styles.perkTitleRow}>
                      <Text
                        style={[
                          styles.perkTitle,
                          { color: theme.colors.text },
                        ]}>
                        {perk.title}
                      </Text>
                      {perk.plusOnly ? (
                        <View style={styles.plusBadge}>
                          <Text style={styles.plusBadgeText}>Plus</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.perkDesc,
                        { color: theme.colors.textMuted },
                      ]}>
                      {perk.description}
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
                {active.name}
                {active.tagline ? ` · ${active.tagline}` : ''}
              </Text>
              <Text style={[styles.footerPrice, { color: theme.colors.text }]}>
                {active.price}
                <Text
                  style={[
                    styles.footerPeriod,
                    { color: theme.colors.textMuted },
                  ]}>
                  {' '}
                  {active.period}
                </Text>
              </Text>
            </View>
            <Pressable
              onPressIn={() => {
                scale.value = withSpring(0.97, { damping: 16, stiffness: 320 });
              }}
              onPressOut={() => {
                scale.value = withSpring(1, { damping: 14, stiffness: 260 });
              }}
              onPress={() => {}}>
              <Animated.View style={[ctaStyle, theme.shadows.md]}>
                <LinearGradient colors={GOLD} style={styles.cta}>
                  <Icon name="crown" size={18} color={ON_GOLD} filled />
                  <Text style={[styles.ctaLabel, { color: ON_GOLD }]}>
                    {active.id === 'plus'
                      ? t('premium.cta_plus')
                      : t('premium.cta')}
                  </Text>
                </LinearGradient>
              </Animated.View>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
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
    backgroundColor: 'rgba(245, 215, 110, 0.45)',
  },
  plusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: ON_GOLD,
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
});

export default PremiumScreen;
