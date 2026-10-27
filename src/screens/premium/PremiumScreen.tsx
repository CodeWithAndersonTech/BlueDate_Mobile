import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { purchasePremium } from '../../api';
import {
  BottomActionDock,
  FigmaButton,
  FigmaIcon,
  Screen,
  Typography,
} from '../../components';
import { FigmaSvgName } from '../../assets/figma/svgXml';
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
import { premiumPlans } from '../../utils';

const PRODUCT_FOR_PLAN: Record<string, string> = {
  standard: IAP_PRODUCTS.standard,
  plus: IAP_PRODUCTS.plus,
};

const TABLE_ROWS: {
  id: string;
  icon: FigmaSvgName;
  titleKey: string;
  shortKey: string;
  inPlus: boolean;
}[] = [
  {
    id: 'visitors',
    icon: 'people',
    titleKey: 'premium.perk.visitors.title',
    shortKey: 'premium.perk.visitors.short',
    inPlus: true,
  },
  {
    id: 'treats',
    icon: 'gift',
    titleKey: 'premium.perk.treats.title',
    shortKey: 'premium.perk.treats.short',
    inPlus: true,
  },
  {
    id: 'featured',
    icon: 'heart',
    titleKey: 'premium.perk.featured.title',
    shortKey: 'premium.perk.featured.short',
    inPlus: true,
  },
  {
    id: 'ghost',
    icon: 'eyeSlash',
    titleKey: 'premium.perk.ghost.title',
    shortKey: 'premium.perk.ghost.short',
    inPlus: false,
  },
];

type Props = NativeStackScreenProps<AppStackParamList, 'Premium'>;

export function PremiumScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const { userId } = useAuth();
  const { premium, isPremium, planCode } = usePremium();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [buying, setBuying] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [plan, setPlan] = useState(
    premiumPlans.find(p => p.popular)?.id ?? premiumPlans[0].id,
  );
  const active = premiumPlans.find(p => p.id === plan) ?? premiumPlans[0];
  const highlightPlus = plan === 'plus';

  useEffect(() => {
    let cancelled = false;
    getDisplayPrices([IAP_PRODUCTS.standard, IAP_PRODUCTS.plus], 'subs').then(
      map => {
        if (!cancelled) {
          setPrices(map);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const priceFor = (planId: string, fallback: string) =>
    prices[PRODUCT_FOR_PLAN[planId]] ?? fallback;

  const currentPlan = isPremium
    ? (planCode ?? 'standard').toLowerCase()
    : null;
  const ownsActive =
    currentPlan === active.id ||
    (currentPlan === 'plus' && active.id === 'standard');

  const onBuy = useCallback(async () => {
    if (!userId || buying) {
      return;
    }
    setBuying(true);
    try {
      const { payment, purchase } = await buyProduct(
        PRODUCT_FOR_PLAN[active.id],
        'subs',
      );
      const next = await purchasePremium(userId, payment);
      await completePurchase(purchase, false);
      publishPremium(next);
      Alert.alert(t('premium.title'), t('premium.activated'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      if (error instanceof IapCancelledError) {
        return;
      }
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
    if (!userId || restoring) {
      return;
    }
    setRestoring(true);
    try {
      const owned = await getOwnedSubscriptions();
      owned.sort((a, b) =>
        a.ProductId === IAP_PRODUCTS.plus
          ? -1
          : b.ProductId === IAP_PRODUCTS.plus
            ? 1
            : 0,
      );
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
      Alert.alert(
        t('premium.title'),
        restored ? t('premium.restored') : t('premium.restore_none'),
      );
    } finally {
      setRestoring(false);
    }
  }, [userId, restoring, t]);

  const openLegal = (titleKey: string, bodyKey: string) => {
    Alert.alert(t(titleKey), t(bodyKey));
  };

  return (
    <Screen padded={false} edges={['top']}>
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
        <View style={styles.dots}>
          <FigmaIcon name="moreDots" size={20} color={theme.colors.text} />
        </View>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.heroArt}>
          <View
            style={[styles.blob, { backgroundColor: theme.colors.plusSoft }]}>
            <FigmaIcon name="crown" size={72} color={theme.colors.plusCta} />
          </View>
          <View style={[styles.star, styles.starTL]}>
            <FigmaIcon name="star" size={16} color={theme.colors.plusCta} />
          </View>
          <View style={[styles.star, styles.starTR]}>
            <FigmaIcon name="star" size={16} color={theme.colors.plusCta} />
          </View>
          <View style={[styles.star, styles.starBR]}>
            <FigmaIcon name="star" size={16} color={theme.colors.plusCta} />
          </View>
        </View>

        <View style={styles.titles}>
          <Typography variant="h2" align="center" weight="600">
            {t('premium.hero_title')}
          </Typography>
          <Typography
            variant="h2"
            align="center"
            weight="600"
            tint={theme.colors.plusCta}>
            {t('premium.hero_subtitle')}
          </Typography>
          <Typography variant="callout" align="center" color="textMuted">
            {t('premium.hero_body')}
          </Typography>
          {premium?.isPremium ? (
            <Typography variant="caption" align="center" tint={theme.colors.plusCta}>
              {(currentPlan === 'plus'
                ? t('premium.current_plus')
                : t('premium.current_standard')
              ).replace('{days}', String(premium.daysRemaining ?? 0))}
            </Typography>
          ) : null}
        </View>

        <View
          style={[
            styles.table,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}>
          <View style={styles.tableHead}>
            <View style={styles.featCol}>
              <Typography variant="caption" color="textMuted">
                {t('premium.features')}
              </Typography>
            </View>
            <View style={styles.checkCol}>
              <Typography
                variant="caption"
                weight="600"
                align="center"
                color={highlightPlus ? 'textMuted' : undefined}
                tint={highlightPlus ? undefined : theme.colors.plusCta}>
                {t('premium.col_plus')}
              </Typography>
            </View>
            <View style={styles.checkCol}>
              <Typography
                variant="caption"
                weight="600"
                align="center"
                tint={highlightPlus ? theme.colors.plusCta : undefined}
                color={highlightPlus ? undefined : 'textMuted'}>
                {t('premium.col_premium')}
              </Typography>
            </View>
          </View>

          {TABLE_ROWS.map((row, index) => (
            <View
              key={row.id}
              style={[
                styles.tableRow,
                index < TABLE_ROWS.length - 1
                  ? { borderBottomColor: theme.colors.border, borderBottomWidth: StyleSheet.hairlineWidth }
                  : null,
              ]}>
              <View style={[styles.featCol, styles.featRow]}>
                <FigmaIcon
                  name={row.icon}
                  size={18}
                  color={theme.colors.plusCta}
                />
                <View style={styles.featCopy}>
                  <Typography variant="caption" weight="600">
                    {t(row.titleKey)}
                  </Typography>
                  <Typography variant="caption" color="textMuted">
                    {t(row.shortKey)}
                  </Typography>
                </View>
              </View>
              <View style={styles.checkCol}>
                {row.inPlus ? (
                  <FigmaIcon
                    name="tickCircle"
                    size={22}
                    color={theme.colors.plusCta}
                  />
                ) : (
                  <View
                    style={[
                      styles.dash,
                      { backgroundColor: theme.colors.borderStrong },
                    ]}
                  />
                )}
              </View>
              <View
                style={[
                  styles.checkCol,
                  highlightPlus
                    ? { backgroundColor: theme.colors.plusSoft }
                    : null,
                ]}>
                <FigmaIcon
                  name="tickCircle"
                  size={22}
                  color={theme.colors.plusCta}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.planRow}>
          {premiumPlans.map(p => {
            const selected = p.id === plan;
            return (
              <Pressable
                key={p.id}
                onPress={() => setPlan(p.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: selected
                      ? theme.colors.plusCta
                      : theme.colors.border,
                  },
                ]}>
                {p.popular ? (
                  <View
                    style={[
                      styles.popular,
                      { backgroundColor: theme.colors.plusCta },
                    ]}>
                    <Typography
                      variant="caption"
                      weight="700"
                      tint={theme.colors.white}
                      align="center">
                      {t('premium.popular_short')}
                    </Typography>
                  </View>
                ) : null}
                <View
                  style={[
                    styles.planRadio,
                    {
                      borderColor: selected
                        ? theme.colors.plusCta
                        : theme.colors.borderStrong,
                      backgroundColor: selected
                        ? theme.colors.plusCta
                        : 'transparent',
                    },
                  ]}
                />
                <Typography variant="title" align="center" weight="600">
                  {t(p.nameKey)}
                </Typography>
                {p.taglineKey ? (
                  <Typography variant="caption" align="center" color="textMuted">
                    {t(p.taglineKey)}
                  </Typography>
                ) : null}
                <Typography variant="h2" align="center" weight="700">
                  {priceFor(p.id, p.price)}
                </Typography>
                <Typography variant="caption" align="center" color="textMuted">
                  {t(p.periodKey)}
                </Typography>
                {p.blurbKey ? (
                  <Typography variant="caption" align="center" color="textMuted">
                    {t(p.blurbKey)}
                  </Typography>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <BottomActionDock direction="column">
        <FigmaButton
          label={
            ownsActive
              ? t('premium.cta_owned')
              : active.id === 'plus'
                ? t('premium.cta_plus')
                : t('premium.cta')
          }
          size="cta"
          tone="solid"
          fullWidth
          loading={buying}
          disabled={ownsActive}
          onPress={() => {
            void onBuy();
          }}
        />
        <View style={styles.policy}>
          <Pressable
            hitSlop={6}
            disabled={restoring}
            onPress={() => {
              void onRestore();
            }}>
            <Typography variant="caption" color="textMuted">
              {restoring ? t('premium.restoring') : t('premium.restore')}
            </Typography>
          </Pressable>
          <Pressable
            hitSlop={6}
            onPress={() => openLegal('premium.legal_kvkk', 'privacy.intro')}>
            <Typography variant="caption" color="textMuted">
              {t('premium.legal_kvkk')}
            </Typography>
          </Pressable>
          <Pressable
            hitSlop={6}
            onPress={() => openLegal('auth.privacy_policy', 'privacy.intro')}>
            <Typography variant="caption" color="textMuted">
              {t('auth.privacy_policy')}
            </Typography>
          </Pressable>
        </View>
      </BottomActionDock>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    minHeight: 30,
    paddingBottom: 8,
  },
  topBarSpacer: { flex: 1 },
  backIcon: {
    transform: [{ rotate: '180deg' }],
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 20,
    gap: 16,
  },
  heroArt: {
    alignSelf: 'center',
    width: 200,
    height: 166,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blob: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: { position: 'absolute' },
  starTL: { top: 18, left: 28 },
  starTR: { top: 8, right: 18 },
  starBR: { bottom: 18, right: 28 },
  titles: { alignItems: 'center', gap: 4, paddingHorizontal: 8 },
  table: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingVertical: 8,
  },
  tableHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 8 },
  tableRow: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  featCol: { flex: 1.5, paddingHorizontal: 10 },
  featRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featCopy: { flex: 1, gap: 1 },
  checkCol: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    paddingVertical: 8,
  },
  dash: { width: 16, height: 2, borderRadius: 1 },
  planRow: { flexDirection: 'row', gap: 10 },
  planCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 4,
    alignItems: 'center',
    overflow: 'visible',
  },
  planRadio: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    marginBottom: 4,
  },
  popular: {
    position: 'absolute',
    top: -8,
    right: -4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 2,
  },
  policy: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
});

export default PremiumScreen;
