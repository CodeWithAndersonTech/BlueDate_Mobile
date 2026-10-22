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
import { FigmaButton } from './FigmaUi';
import { FigmaIcon, FigmaSvgName } from './FigmaIcon';
import { Icon, IconName } from './Icon';
import { Typography } from './Typography';

export interface EmptyStateProps {
  icon?: IconName;
  /** Meerk Figma glyph — preferred over the legacy `icon` set. */
  figmaIcon?: FigmaSvgName;
  /** App logo / illustration — takes priority over `icon` when set. */
  image?: ImageSourcePropType;
  /** Makes the logo/icon tappable (e.g. restart nearby scan). */
  onImagePress?: () => void;
  imageAccessibilityLabel?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Grow to fill the parent and vertically center (needs parent flexGrow). */
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon = 'sparkles',
  figmaIcon,
  image,
  onImagePress,
  imageAccessibilityLabel,
  title,
  description,
  actionLabel,
  onAction,
  fill = false,
  style,
}: EmptyStateProps) {
  const theme = useTheme();
  const media = image ? (
    <View
      style={[
        styles.iconWrap,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderRadius: 28,
          borderColor: theme.colors.border,
          borderWidth: StyleSheet.hairlineWidth,
          overflow: 'hidden',
        },
      ]}>
      <Image source={image} style={styles.logo} />
    </View>
  ) : figmaIcon ? (
    <FigmaIcon name={figmaIcon} size={48} color={theme.colors.plusCta} />
  ) : (
    <Icon name={icon} size={48} color={theme.colors.plusCta} />
  );

  return (
    <View style={[styles.container, fill && styles.fill, style]}>
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
        <FigmaButton
          label={actionLabel}
          onPress={onAction}
          size="cta"
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
  fill: {
    flex: 1,
    minHeight: 280,
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
  // Button's intrinsic style uses alignSelf: 'flex-start' — override so CTAs
  // stay centered with the title/description block.
  action: { marginTop: 8, alignSelf: 'center' },
});

export default EmptyState;
