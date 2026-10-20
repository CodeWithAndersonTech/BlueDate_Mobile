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
  const recipe = theme.components.badge;
  const dims = recipe.sizes[size];

  const containerBase: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: recipe.gap,
    paddingVertical: dims.paddingV,
    paddingHorizontal: dims.paddingH,
    borderRadius: recipe.radius,
    alignSelf: 'flex-start',
  };

  if (tone === 'premium') {
    return (
      <View style={[containerBase, styles.premiumWrap, style]}>
        <LinearGradient
          colors={theme.gradients.premium}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <Icon name={icon ?? 'crown'} size={dims.icon} color={recipe.premiumFg} filled />
        <Typography variant="overline" tint={recipe.premiumFg} style={styles.text}>
          {label}
        </Typography>
      </View>
    );
  }

  const c = recipe.tones[tone];
  return (
    <View style={[containerBase, { backgroundColor: c.bg }, style]}>
      {icon && <Icon name={icon} size={dims.icon} color={c.fg} />}
      <Typography variant="overline" tint={c.fg} style={styles.text}>
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  text: { letterSpacing: 0.6, flexShrink: 0 },
  premiumWrap: { overflow: 'hidden', position: 'relative' },
});

export default Badge;
