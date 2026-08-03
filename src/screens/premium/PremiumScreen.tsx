import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  Icon,
  IconName,
  Screen,
  Typography,
} from '../../components';
import { useTabBarClearance } from '../../navigation/CustomTabBar';
import { useTheme } from '../../theme';
import { premiumPerks, premiumPlans } from '../../utils';

const GOLD: [string, string] = ['#F5D76E', '#E8A838'];
const ON_GOLD = '#2C2100';

export function PremiumScreen() {
  const theme = useTheme();
  const tabClearance = useTabBarClearance(24);
  const [plan, setPlan] = useState(
    premiumPlans.find(p => p.popular)?.id ?? premiumPlans[0].id,
  );
  const active = premiumPlans.find(p => p.id === plan) ?? premiumPlans[0];

  const scale = useSharedValue(1);
  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Screen edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabClearance + 88 },
        ]}>
        {/* Hero */}
        <View style={[styles.hero, theme.shadows.md]}>
          <LinearGradient colors={GOLD} style={StyleSheet.absoluteFill} />
          <View style={styles.heroInner}>
            <View style={styles.crownWrap}>
              <Icon name="crown" size={28} color={ON_GOLD} filled />
            </View>
            <Typography variant="h1" tint={ON_GOLD}>
              Meerk Premium
            </Typography>
            <Typography variant="callout" tint="rgba(44,33,0,0.72)">
              Sınırsız beğeni, kimler gördü ve öne çıkma.
            </Typography>
            <View style={styles.trialPill}>
              <Icon name="sparkles" size={12} color={ON_GOLD} />
              <Typography variant="caption" tint={ON_GOLD} weight="700">
                İlk 7 gün ücretsiz
              </Typography>
            </View>
          </View>
        </View>

        {/* Plans */}
        <View style={styles.section}>
          <Typography variant="title">Paketi seç</Typography>
          <View style={styles.plans}>
            {premiumPlans.map(p => {
              const selected = p.id === plan;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setPlan(p.id)}
                  style={[
                    styles.plan,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: selected
                        ? theme.colors.primary
                        : theme.colors.border,
                      borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
                    },
                    selected && theme.shadows.sm,
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
                      {selected && (
                        <Icon
                          name="check"
                          size={12}
                          color={theme.colors.onPrimary}
                          strokeWidth={3}
                        />
                      )}
                    </View>
                    <View>
                      <View style={styles.planNameRow}>
                        <Typography variant="bodyStrong">{p.name}</Typography>
                        {p.popular && (
                          <View
                            style={[
                              styles.pop,
                              { backgroundColor: theme.colors.primarySoft },
                            ]}>
                            <Typography
                              variant="overline"
                              tint={theme.colors.primary}>
                              Popüler
                            </Typography>
                          </View>
                        )}
                      </View>
                      <Typography variant="caption" color="textMuted">
                        {p.perMonth ?? 'Her ay yenilenir'}
                      </Typography>
                    </View>
                  </View>
                  <View style={styles.planRight}>
                    <Typography variant="h3">{p.price}</Typography>
                    <Typography variant="caption" color="textMuted">
                      {p.period}
                    </Typography>
                    {p.highlight ? (
                      <Typography variant="overline" tint={theme.colors.success}>
                        {p.highlight}
                      </Typography>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Perks */}
        <View style={styles.section}>
          <Typography variant="title">Neler dahil?</Typography>
          <View style={styles.perks}>
            {premiumPerks.map(perk => (
              <View
                key={perk.id}
                style={[
                  styles.perk,
                  { backgroundColor: theme.colors.card },
                  theme.shadows.sm,
                ]}>
                <View
                  style={[
                    styles.perkIcon,
                    { backgroundColor: theme.colors.primarySoft },
                  ]}>
                  <Icon
                    name={perk.icon as IconName}
                    size={18}
                    color={theme.colors.primary}
                    filled
                  />
                </View>
                <Typography variant="bodyStrong">{perk.title}</Typography>
                <Typography variant="caption" color="textMuted">
                  {perk.description}
                </Typography>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA above floating tab */}
      <View
        style={[
          styles.footer,
          {
            bottom: tabClearance - 8,
            paddingBottom: 12,
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
          },
        ]}>
        <View style={styles.footerSummary}>
          <Typography variant="caption" color="textMuted">
            {active.name}
          </Typography>
          <Typography variant="title">
            {active.price}
            <Typography variant="caption" color="textMuted">
              {' '}
              {active.period}
            </Typography>
          </Typography>
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
              <Typography variant="button" tint={ON_GOLD}>
                Premium’a yükselt
              </Typography>
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 28 },
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
  section: { gap: 14 },
  plans: { gap: 10 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
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
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pop: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  planRight: { alignItems: 'flex-end', gap: 2 },
  perks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  perk: {
    width: '48.5%',
    borderRadius: 20,
    padding: 16,
    gap: 8,
    minHeight: 140,
  },
  perkIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  footerSummary: { gap: 2 },
  cta: {
    height: 54,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

export default PremiumScreen;
