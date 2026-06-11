import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Icon, IconName } from './Icon';
import { Typography } from './Typography';

export interface ListRowProps {
  icon?: IconName;
  /** Tint for the leading icon chip. */
  iconColor?: string;
  iconBackground?: string;
  title: string;
  subtitle?: string;
  /** Text shown on the right (e.g. current value). */
  value?: string;
  /** Show a chevron affordance on the right. */
  showChevron?: boolean;
  right?: React.ReactNode;
  destructive?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ListRow({
  icon,
  iconColor,
  iconBackground,
  title,
  subtitle,
  value,
  showChevron = true,
  right,
  destructive = false,
  onPress,
  style,
}: ListRowProps) {
  const theme = useTheme();
  const titleColor = destructive ? theme.colors.danger : theme.colors.text;

  const content = (
    <View style={[styles.row, { paddingVertical: theme.spacing.md }, style]}>
      {icon && (
        <View
          style={[
            styles.iconChip,
            {
              backgroundColor: iconBackground ?? theme.colors.surfaceAlt,
              borderRadius: theme.radii.md,
            },
          ]}>
          <Icon name={icon} size={20} color={iconColor ?? theme.colors.primary} />
        </View>
      )}
      <View style={styles.texts}>
        <Typography variant="bodyStrong" tint={titleColor}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="textMuted">
            {subtitle}
          </Typography>
        )}
      </View>
      {value && (
        <Typography variant="callout" color="textMuted">
          {value}
        </Typography>
      )}
      {right}
      {showChevron && onPress && !right && (
        <Icon name="chevron-right" size={20} color={theme.colors.textMuted} />
      )}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: theme.colors.surfaceAlt }}
      accessibilityRole="button">
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconChip: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 2 },
});

export default ListRow;
