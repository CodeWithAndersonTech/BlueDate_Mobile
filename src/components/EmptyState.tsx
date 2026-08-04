import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../theme';
import { Button } from './Button';
import { Icon, IconName } from './Icon';
import { Typography } from './Typography';

export interface EmptyStateProps {
  icon?: IconName;
  /** App logo / illustration — takes priority over `icon` when set. */
  image?: ImageSourcePropType;
  /** Makes the logo/icon tappable (e.g. restart nearby scan). */
  onImagePress?: () => void;
  imageAccessibilityLabel?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon = 'sparkles',
  image,
  onImagePress,
  imageAccessibilityLabel,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const theme = useTheme();
  const media = (
    <View
      style={[
        styles.iconWrap,
        {
          backgroundColor: image
            ? theme.colors.surfaceAlt
            : theme.colors.primarySoft,
          borderRadius: 28,
          borderColor: theme.colors.border,
          borderWidth: image ? StyleSheet.hairlineWidth : 0,
          overflow: 'hidden',
        },
      ]}>
      {image ? (
        <Image source={image} style={styles.logo} />
      ) : (
        <Icon name={icon} size={34} color={theme.colors.primary} />
      )}
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {onImagePress ? (
        <Pressable
          onPress={onImagePress}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={imageAccessibilityLabel}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          {media}
        </Pressable>
      ) : (
        media
      )}
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
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
  },
  desc: { maxWidth: 300 },
  action: { marginTop: 8 },
});

export default EmptyState;
