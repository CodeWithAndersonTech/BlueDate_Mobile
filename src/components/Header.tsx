import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { IconButton } from './IconButton';
import { IconName } from './Icon';
import { Typography } from './Typography';

export interface HeaderAction {
  icon: IconName;
  onPress: () => void;
}

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: HeaderAction[];
  /** Large screen title style (left-aligned, bold). */
  large?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Header({
  title,
  subtitle,
  onBack,
  actions = [],
  large = false,
  style,
}: HeaderProps) {
  const theme = useTheme();

  if (large) {
    return (
      <View style={[styles.largeContainer, { paddingHorizontal: theme.spacing.lg }, style]}>
        <View style={styles.largeText}>
          {subtitle && (
            <Typography variant="overline" color="primary">
              {subtitle}
            </Typography>
          )}
          <Typography variant="h1">{title}</Typography>
        </View>
        <View style={styles.actions}>
          {actions.map((a, i) => (
            <IconButton key={`${a.icon}-${i}`} name={a.icon} onPress={a.onPress} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingHorizontal: theme.spacing.base }, style]}>
      <View style={styles.side}>
        {onBack && <IconButton name="arrow-left" variant="surface" onPress={onBack} />}
      </View>
      <View style={styles.center}>
        {title && (
          <Typography variant="title" align="center" numberOfLines={1}>
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography variant="caption" color="textMuted" align="center">
            {subtitle}
          </Typography>
        )}
      </View>
      <View style={[styles.side, styles.right]}>
        {actions.map((a, i) => (
          <IconButton key={`${a.icon}-${i}`} name={a.icon} onPress={a.onPress} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    gap: 8,
  },
  side: { minWidth: 44, justifyContent: 'center', flexDirection: 'row' },
  right: { justifyContent: 'flex-end' },
  center: { flex: 1 },
  largeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 12,
  },
  largeText: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', gap: 8 },
});

export default Header;
