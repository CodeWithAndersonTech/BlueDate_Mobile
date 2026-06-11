import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Button } from './Button';
import { Icon, IconName } from './Icon';
import { Typography } from './Typography';

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon = 'sparkles',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: theme.colors.primarySoft, borderRadius: theme.radii.xxl },
        ]}>
        <Icon name={icon} size={34} color={theme.colors.primary} />
      </View>
      <Typography variant="h3" align="center">
        {title}
      </Typography>
      {description && (
        <Typography variant="body" color="textMuted" align="center" style={styles.desc}>
          {description}
        </Typography>
      )}
      {actionLabel && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="primary"
          fullWidth={false}
          style={styles.action}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  iconWrap: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  desc: { maxWidth: 300 },
  action: { marginTop: 8 },
});

export default EmptyState;
