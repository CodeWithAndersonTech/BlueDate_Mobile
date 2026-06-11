import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { Icon, IconName } from './Icon';
import { Typography } from './Typography';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'premium';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: BadgeSize;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, tone = 'neutral', size = 'sm', icon, style }: BadgeProps) {
  const theme = useTheme();

  const paddingV = size === 'sm' ? 4 : 6;
  const paddingH = size === 'sm' ? 10 : 14;
  const iconSize = size === 'sm' ? 12 : 14;

  const toneColors: Record<Exclude<BadgeTone, 'premium'>, { bg: string; fg: string }> = {
    neutral: { bg: theme.colors.surfaceAlt, fg: theme.colors.textSecondary },
    primary: { bg: theme.colors.primarySoft, fg: theme.colors.primary },
    success: { bg: 'rgba(34,197,94,0.16)', fg: theme.colors.success },
    warning: { bg: 'rgba(244,183,64,0.16)', fg: theme.colors.warning },
    danger: { bg: 'rgba(255,77,109,0.16)', fg: theme.colors.danger },
  };

  const containerBase: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: paddingV,
    paddingHorizontal: paddingH,
    borderRadius: theme.radii.pill,
    alignSelf: 'flex-start',
  };

  if (tone === 'premium') {
    return (
      <LinearGradient
        colors={theme.gradients.premium}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[containerBase, style]}>
        <Icon name={icon ?? 'crown'} size={iconSize} color="#3A2A00" filled />
        <Typography variant="overline" tint="#3A2A00" style={styles.text}>
          {label}
        </Typography>
      </LinearGradient>
    );
  }

  const c = toneColors[tone];
  return (
    <View style={[containerBase, { backgroundColor: c.bg }, style]}>
      {icon && <Icon name={icon} size={iconSize} color={c.fg} />}
      <Typography variant="overline" tint={c.fg} style={styles.text}>
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  text: { letterSpacing: 0.6 },
});

export default Badge;
