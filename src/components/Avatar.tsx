import React from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { Typography } from './Typography';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface AvatarProps {
  uri?: string;
  name?: string;
  size?: AvatarSize;
  /** Online presence dot. */
  online?: boolean;
  /** Premium members get a gradient ring. */
  premium?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 32,
  sm: 40,
  md: 52,
  lg: 72,
  xl: 96,
  xxl: 128,
};

function initials(name?: string) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('');
}

export function Avatar({
  uri,
  name,
  size = 'md',
  online,
  premium,
  style,
}: AvatarProps) {
  const theme = useTheme();
  const dim = SIZE_MAP[size];
  const ring = Math.max(2, dim * 0.04);
  const dotSize = Math.max(10, dim * 0.26);

  const inner = (
    <View
      style={[
        styles.inner,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: theme.colors.surfaceAlt,
        },
      ]}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} />
      ) : (
        <Typography
          variant="title"
          tint={theme.colors.textSecondary}
          style={{ fontSize: dim * 0.36 }}>
          {initials(name)}
        </Typography>
      )}
    </View>
  );

  return (
    <View style={[{ width: dim, height: dim }, style]}>
      {premium ? (
        <LinearGradient
          colors={theme.gradients.premium}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.ring,
            { width: dim, height: dim, borderRadius: dim / 2, padding: ring },
          ]}>
          <View style={[styles.ringInner, { borderRadius: dim / 2, backgroundColor: theme.colors.background }]}>
            {inner}
          </View>
        </LinearGradient>
      ) : (
        inner
      )}

      {online && (
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: theme.colors.online,
              borderColor: theme.colors.background,
              borderWidth: Math.max(2, dotSize * 0.18),
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  ring: { alignItems: 'center', justifyContent: 'center' },
  ringInner: { padding: 2 },
  dot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
});

export default Avatar;
