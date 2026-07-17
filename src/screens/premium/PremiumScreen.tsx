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
  SectionHeader,
  Typography,
} from '../../components';
import { useTheme } from '../../theme';
import { TAB_BAR_SPACE, premiumPerks, premiumPlans } from '../../utils';

const GOLD: [string, string] = ['#FFD200', '#F7971E'];
const ON_GOLD = '#3A2A00';

const HERO_HIGHLIGHTS: { icon: IconName; label: string }[] = [
  { icon: 'zap', label: 'Sınırsız\nbeğeni' },
  { icon: 'eye', label: 'Seni kim\ngördü' },
  { icon: 'sparkles', label: 'Reklamsız\ndeneyim' },
];

export function PremiumScreen() {
  const theme = useTheme();
  const [plan, setPlan] = useState(
    premiumPlans.find(p => p.popular)?.id ?? premiumPlans[0].id,
  );

  const activePlan = premiumPlans.find(p => p.id === plan) ?? premiumPlans[0];

  const ctaScale = useSharedValue(1);
  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  const goldGlow = {
    shadowColor: '#F7971E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: theme.isDark ? 0.4 : 0.28,
    shadowRadius: 14,
    elevation: 8,
  };

  return (
    <Screen edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_SPACE + 210 },
        ]}>
        {/* ---------------------------------------------------------------- HERO */}
        <View style={[styles.heroWrap, goldGlow]}>
          <View style={styles.hero}>
            <LinearGradient
              colors={GOLD}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* decorative translucent blobs */}
            <View style={[styles.blob, styles.blobOne]} />
            <View style={[styles.blob, styles.blobTwo]} />

            <View style={styles.crown}>
              <Icon name="crown" size={26} color={ON_GOLD} filled />
            </View>

            <Typography variant="h1" tint={ON_GOLD} style={styles.heroTitle}>
              BlueDate{'\n'}Premium
            </Typography>
            <Typography variant="callout" tint={ON_GOLD} style={styles.heroDesc}>
              Sınırları kaldır, seni kimlerin beğendiğini gör ve
              yakındakilerde öne çık.
            </Typography>

            <View style={styles.freePill}>
              <Icon name="sparkles" size={13} color={ON_GOLD} />
              <Typography variant="caption" tint={ON_GOLD} weight="700">
                İlk 7 gün ücretsiz dene
              </Typography>
            </View>
          </View>
        </View>

        {/* -------------------------------------------------------- HIGHLIGHTS */}
        <View style={styles.highlights}>
          {HERO_HIGHLIGHTS.map(h => (
            <View
              key={h.label}
              style={[
                styles.highlightChip,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radii.lg,
                },
              ]}>
              <View style={styles.highlightIcon}>
                <Icon name={h.icon} size={16} color="#F7971E" filled />
              </View>
              <Typography variant="caption" weight="600" align="center">
                {h.label}
              </Typography>
            </View>
          ))}
        </View>

        {/* --------------------------------------------------------------- PLANS */}
        <View style={styles.section}>
          <SectionHeader title="Paketini seç" />
          <View style={styles.plans}>
            {premiumPlans.map(p => {
              const selected = p.id === plan;
              const inner = (
                <View
                  style={[
                    styles.planInner,
                    {
                      backgroundColor: selected
                        ? theme.colors.cardElevated
                        : theme.colors.card,
                      borderRadius: theme.radii.xl - (selected ? 2 : 0),
                    },
                  ]}>
                  <View style={styles.planLeft}>
                    <View
                      style={[
                        styles.radio,
                        {
                          borderColor: selected
                            ? '#F7971E'
                            : theme.colors.borderStrong,
                          backgroundColor: selected ? '#F7971E' : 'transparent',
                        },
                      ]}>
                      {selected && (
                        <Icon
                          name="check"
                          size={13}
                          color={ON_GOLD}
                          strokeWidth={3}
                        />
                      )}
                    </View>
                    <View style={styles.planMeta}>
                      <View style={styles.planNameRow}>
                        <Typography variant="title">{p.name}</Typography>
                        {p.popular && (
                          <View style={styles.popularPill}>
                            <Icon name="star" size={10} color={ON_GOLD} filled />
                            <Typography variant="overline" tint={ON_GOLD}>
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
                    <View style={styles.priceRow}>
                      <Typography variant="h3">{p.price}</Typography>
                      <Typography variant="caption" color="textMuted">
                        {p.period}
                      </Typography>
                    </View>
                    {p.highlight && (
                      <View
                        style={[
                          styles.savePill,
                          { backgroundColor: 'rgba(34,197,94,0.16)' },
                        ]}>
                        <Typography variant="overline" tint={theme.colors.success}>
                          {p.highlight}
                        </Typography>
                      </View>
                    )}
                  </View>
                </View>
              );

              return (
                <Pressable key={p.id} onPress={() => setPlan(p.id)}>
                  {selected ? (
                    <LinearGradient
                      colors={GOLD}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.planBorder,
                        { borderRadius: theme.radii.xl },
                        goldGlow,
                      ]}>
                      {inner}
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        styles.planOutline,
                        {
                          borderRadius: theme.radii.xl,
                          borderColor: theme.colors.border,
                        },
                      ]}>
                      {inner}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* --------------------------------------------------------------- PERKS */}
        <View style={styles.section}>
          <SectionHeader title="Premium avantajları" />
          <View style={styles.perks}>
            {premiumPerks.map(perk => (
              <View
                key={perk.id}
                style={[
                  styles.perkCard,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radii.xl,
                  },
                ]}>
                <LinearGradient
                  colors={GOLD}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.perkIcon}>
                  <Icon
                    name={perk.icon as IconName}
                    size={19}
                    color={ON_GOLD}
                    filled
                  />
                </LinearGradient>
                <Typography variant="bodyStrong">{perk.title}</Typography>
                <Typography variant="caption" color="textMuted">
                  {perk.description}
                </Typography>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ------------------------------------------------------------- STICKY CTA */}
      <View
        style={[
          styles.purchaseBar,
          {
            bottom: TAB_BAR_SPACE - 26,
            paddingBottom: 28,
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
          },
        ]}>
        <View style={styles.summaryRow}>
          <View>
            <Typography variant="caption" color="textMuted">
              {activePlan.name} plan
            </Typography>
            <View style={styles.summaryPriceRow}>
              <Typography variant="h3">{activePlan.price}</Typography>
              <Typography variant="caption" color="textMuted">
                {activePlan.period}
              </Typography>
            </View>
          </View>
          {activePlan.perMonth && (
            <View
              style={[
                styles.summaryBadge,
                { backgroundColor: theme.colors.surfaceAlt },
              ]}>
              <Typography variant="overline" tint={theme.colors.textSecondary}>
                {activePlan.perMonth}
              </Typography>
            </View>
          )}
        </View>

        <Pressable
          onPressIn={() =>
            (ctaScale.value = withSpring(0.97, { damping: 16, stiffness: 320 }))
          }
          onPressOut={() =>
            (ctaScale.value = withSpring(1, { damping: 12, stiffness: 260 }))
          }
          onPress={() => {}}>
          <Animated.View style={[ctaStyle, goldGlow]}>
            <LinearGradient
              colors={GOLD}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.cta}>
              <Icon name="crown" size={20} color={ON_GOLD} filled />
              <Typography variant="button" tint={ON_GOLD}>
                Premium’a Yükselt
              </Typography>
            </LinearGradient>
          </Animated.View>
        </Pressable>

        <Typography
          variant="caption"
          color="textMuted"
          align="center"
          style={styles.cancelNote}>
          İstediğin zaman iptal et · Otomatik yenilenir
        </Typography>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },

  /* hero */
  heroWrap: { borderRadius: 28 },
  hero: {
    borderRadius: 28,
    padding: 22,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  blobOne: { width: 160, height: 160, top: -60, right: -40 },
  blobTwo: { width: 110, height: 110, bottom: -40, left: -20 },
  crown: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginBottom: 18,
  },
  freePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  heroTitle: { letterSpacing: 0.3 },
  heroDesc: { marginTop: 8, opacity: 0.82, maxWidth: 300 },

  /* highlights */
  highlights: { flexDirection: 'row', gap: 10 },
  highlightChip: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  highlightIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(247,151,30,0.14)',
  },

  /* sections */
  section: { gap: 14 },

  /* plans */
  plans: { gap: 12 },
  planBorder: { padding: 2 },
  planOutline: { borderWidth: 1 },
  planInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  planMeta: { gap: 3, flex: 1 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  popularPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: '#FFD200',
  },
  planRight: { alignItems: 'flex-end', gap: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  savePill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },

  /* perks */
  perks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  perkCard: {
    width: '48.5%',
    gap: 7,
    minHeight: 138,
    padding: 16,
    borderWidth: 1,
  },
  perkIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  /* sticky cta */
  purchaseBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryPriceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  summaryBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  cta: {
    height: 56,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelNote: {
    marginBottom: 6,
  },
});

export default PremiumScreen;
