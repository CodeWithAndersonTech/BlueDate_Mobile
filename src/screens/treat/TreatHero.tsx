import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { images } from '../../assets';
import type { Treat } from '../../api';
import { Avatar, Icon, Typography } from '../../components';
import { useLocale } from '../../i18n';
import { useTheme } from '../../theme';

type Props = {
  treat: Treat;
  title: string;
  subtitle?: string;
  /** Whose photo to show next to the treated item. */
  subject?: Treat['sender'] | Treat['receiver'];
};

const ITEM_EMOJI: Record<string, string> = {
  food: '🍕',
  dessert: '🍰',
  coffee: '☕',
  beverage: '🍸',
};

/** Meerkat illustration + treated item → person, shared by treat screens. */
export function TreatHero({ treat, title, subtitle, subject }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const who = subject ?? treat.receiver;
  const whoName = `${who.FirstName} ${who.LastName}`.trim() || who.Username;
  const emoji = ITEM_EMOJI[(treat.itemTypeCode ?? '').toLowerCase()] ?? '🎁';

  return (
    <View style={[styles.wrap, { gap: theme.space.lg }]}>
      <View
        style={[
          styles.art,
          { backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.xxl },
        ]}>
        <Image source={images.appLogo} style={styles.logo} resizeMode="contain" fadeDuration={0} />
      </View>
      <View style={[styles.texts, { gap: theme.space.xs }]}>
        <Typography variant="h2" align="center">
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="callout" color="textMuted" align="center">
            {subtitle}
          </Typography>
        ) : null}
      </View>
      <View style={[styles.flow, { gap: theme.space.md }]}>
        <View
          style={[
            styles.itemCircle,
            { borderColor: theme.colors.premium, backgroundColor: theme.colors.card },
          ]}>
          <Typography variant="h2">{emoji}</Typography>
        </View>
        <Icon name="chevron-right" size={18} color={theme.colors.premium} />
        <Avatar uri={who.ProfileImage ?? undefined} name={whoName} size="lg" />
      </View>
      <Typography variant="caption" color="textMuted" align="center">
        {t('treat.for_user').replace('{name}', whoName)}
      </Typography>
      <Typography variant="title" align="center">
        {treat.itemValue}
      </Typography>
      {treat.message ? (
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
              padding: theme.space.lg,
              gap: theme.space.sm,
            },
          ]}>
          <Typography variant="overline" color="textMuted">
            {t('treat.message_card')}
          </Typography>
          <Typography variant="body" color="textSecondary">
            “{treat.message}”
          </Typography>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  art: { width: 168, height: 168, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 120, height: 120 },
  texts: { alignItems: 'center', paddingHorizontal: 8 },
  flow: { flexDirection: 'row', alignItems: 'center' },
  itemCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { alignSelf: 'stretch', borderWidth: StyleSheet.hairlineWidth },
});
