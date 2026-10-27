import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FigmaIcon, FigmaSvgName, Typography } from '../../components';
import { useTheme } from '../../theme';

export function SettingsSection({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      {label ? (
        <Typography variant="caption" color="textMuted">
          {label}
        </Typography>
      ) : null}
      <View style={styles.rows}>{children}</View>
    </View>
  );
}

export function SettingsRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  right,
  destructive,
  showChevron = true,
}: {
  icon?: FigmaSvgName;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
  showChevron?: boolean;
}) {
  const theme = useTheme();
  const tall = Boolean(subtitle);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.row,
        tall ? styles.rowTall : null,
        {
          backgroundColor: theme.colors.authField,
          borderColor: theme.colors.authFieldBorder,
        },
      ]}>
      {icon ? (
        <FigmaIcon
          name={icon}
          size={20}
          color={destructive ? theme.colors.danger : theme.colors.text}
        />
      ) : null}
      <View style={styles.copy}>
        <Typography
          variant="callout"
          weight="500"
          tint={destructive ? theme.colors.danger : theme.colors.text}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" color="textMuted" numberOfLines={2}>
            {subtitle}
          </Typography>
        ) : null}
      </View>
      {value ? (
        <Typography variant="callout" color="textMuted">
          {value}
        </Typography>
      ) : null}
      {right}
      {onPress && !right && showChevron ? (
        <FigmaIcon name="arrowRight" size={15} color={theme.colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: 5 },
  rows: { gap: 5 },
  row: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowTall: { minHeight: 58, paddingVertical: 11 },
  copy: { flex: 1, gap: 1 },
});
