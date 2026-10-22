import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FigmaButton, FigmaIcon, Typography } from '../../components';
import { useLocale } from '../../i18n';
import { useTabBarClearance } from '../../navigation/tabBarLayout';

type Props = {
  description: string;
  onRetry: () => void;
  /** Tighter block when this sits under footprints in a scroll view. */
  compact?: boolean;
};

export function NearbyEmpty({ description, onRetry, compact = false }: Props) {
  const { t } = useLocale();
  const tabClearance = useTabBarClearance(12);

  return (
    <View
      style={[
        styles.wrap,
        compact ? styles.compact : { paddingBottom: tabClearance },
      ]}>
      <View style={styles.cluster}>
        <FigmaIcon name="locationSlash" size={88} />
        <View style={styles.copy}>
          <Typography variant="h3" align="center" weight="700">
            {t('nearby.empty_title')}
          </Typography>
          <Typography
            variant="caption"
            color="textMuted"
            align="center"
            style={styles.desc}>
            {description}
          </Typography>
        </View>
        <FigmaButton
          label={t('nearby.retry')}
          size="cta"
          onPress={onRetry}
          accessibilityLabel={t('nearby.retry')}
          style={styles.cta}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  compact: {
    flex: 0,
    flexGrow: 0,
    paddingTop: 28,
    paddingBottom: 12,
  },
  cluster: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  copy: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  desc: {
    maxWidth: 280,
  },
  cta: {
    alignSelf: 'center',
    minWidth: 168,
    height: 42,
    paddingHorizontal: 28,
  },
});
