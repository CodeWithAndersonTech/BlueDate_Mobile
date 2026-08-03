import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Icon, IconName } from './Icon';
import { Typography } from './Typography';

export interface ReadOnlyRowProps {
  label: string;
  value: string;
  icon?: IconName;
  /** Trailing state icon — defaults to a lock for non-editable data. */
  trailingIcon?: IconName;
  style?: StyleProp<ViewStyle>;
}

/**
 * Label + value row for data the user cannot edit. Deliberately not an input:
 * read-only content should never look interactive. Horizontal rhythm matches
 * `SettingsSep` so grouped rows line up inside a `SettingsGroup`.
 */
export function ReadOnlyRow({
  label,
  value,
  icon,
  trailingIcon = 'lock',
  style,
}: ReadOnlyRowProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.row, style]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}`}>
      {icon ? (
        <View
          style={[
            styles.iconChip,
            { backgroundColor: theme.colors.surfaceAlt },
          ]}>
          <Icon name={icon} size={16} color={theme.colors.primary} />
        </View>
      ) : null}
      <View style={styles.texts}>
        <Typography variant="caption" color="textMuted">
          {label}
        </Typography>
        <Typography variant="bodyStrong" numberOfLines={1}>
          {value}
        </Typography>
      </View>
      {trailingIcon ? (
        <Icon name={trailingIcon} size={14} color={theme.colors.textMuted} />
      ) : null}
    </View>
  );
}

const ICON_CHIP = 34;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    // 16 + 34 + 12 = 62 — keeps text aligned with SettingsSep's inset.
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconChip: {
    width: ICON_CHIP,
    height: ICON_CHIP,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 2 },
});

export default ReadOnlyRow;
