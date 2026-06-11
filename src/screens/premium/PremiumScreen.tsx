import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Badge,
  Button,
  Card,
  Icon,
  IconName,
  Screen,
  Typography,
} from '../../components';
import { useTheme } from '../../theme';
import { TAB_BAR_SPACE, premiumPerks, premiumPlans } from '../../utils';

export function PremiumScreen() {
  const theme = useTheme();
  const [plan, setPlan] = useState(premiumPlans.find(p => p.popular)?.id ?? premiumPlans[0].id);

  return (
    <Screen edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_SPACE + 60 }]}>
        <View style={styles.hero}>
          <LinearGradient
            colors={theme.gradients.premium}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.crown, theme.shadows.glow]}>
            <Icon name="crown" size={40} color="#3A2A00" filled />
          </LinearGradient>
          <Typography variant="h1" align="center">
            BlueDate Premium
          </Typography>
          <Typography variant="body" color="textMuted" align="center" style={styles.heroDesc}>
            Sınırları kaldır, seni kimlerin beğendiğini gör ve öne çık.
          </Typography>
        </View>

        <View style={styles.perks}>
          {premiumPerks.map(perk => (
            <Card key={perk.id} variant="surface" padding="sm" style={styles.perkCard}>
              <View
                style={[
                  styles.perkIcon,
                  { backgroundColor: theme.colors.primarySoft, borderRadius: theme.radii.md },
                ]}>
                <Icon name={perk.icon as IconName} size={20} color={theme.colors.primary} filled />
              </View>
              <Typography variant="bodyStrong">{perk.title}</Typography>
              <Typography variant="caption" color="textMuted">
                {perk.description}
              </Typography>
            </Card>
          ))}
        </View>

        <View style={styles.plans}>
          <Typography variant="h3">Paket seç</Typography>
          {premiumPlans.map(p => {
            const selected = p.id === plan;
            return (
              <Pressable key={p.id} onPress={() => setPlan(p.id)}>
                <Card
                  variant={selected ? 'glass' : 'outline'}
                  glow={selected}
                  style={[
                    styles.planCard,
                    selected && { borderColor: theme.colors.primary, borderWidth: 1.5 },
                  ]}>
                  <View style={styles.planLeft}>
                    <View
                      style={[
                        styles.radio,
                        {
                          borderColor: selected ? theme.colors.primary : theme.colors.borderStrong,
                          backgroundColor: selected ? theme.colors.primary : 'transparent',
                        },
                      ]}>
                      {selected && <Icon name="check" size={14} color={theme.colors.onPrimary} strokeWidth={3} />}
                    </View>
                    <View>
                      <View style={styles.planNameRow}>
                        <Typography variant="title">{p.name}</Typography>
                        {p.popular && <Badge label="Popüler" tone="premium" />}
                      </View>
                      {p.perMonth && (
                        <Typography variant="caption" color="textMuted">
                          {p.perMonth}
                        </Typography>
                      )}
                    </View>
                  </View>
                  <View style={styles.planRight}>
                    <Typography variant="h3">{p.price}</Typography>
                    <Typography variant="caption" color="textMuted">
                      {p.period}
                    </Typography>
                    {p.highlight && (
                      <Typography variant="overline" tint={theme.colors.success}>
                        {p.highlight}
                      </Typography>
                    )}
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={[
          styles.purchaseBar,
          {
            paddingBottom: TAB_BAR_SPACE - 24,
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
          },
        ]}>
        <Button label="Premium’a Yükselt" leftIcon="crown" onPress={() => {}} />
        <Typography variant="caption" color="textMuted" align="center" style={styles.terms}>
          İstediğin zaman iptal et · Otomatik yenilenir
        </Typography>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, gap: 24 },
  hero: { alignItems: 'center', gap: 8 },
  crown: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroDesc: { maxWidth: 320 },
  perks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  perkCard: { width: '48.5%', gap: 6, minHeight: 130 },
  perkIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  plans: { gap: 12 },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planRight: { alignItems: 'flex-end', gap: 2 },
  purchaseBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 8,
  },
  terms: {},
});

export default PremiumScreen;
