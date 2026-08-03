import React from 'react';
import {
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../theme';
import { Icon } from './Icon';
import { Typography } from './Typography';

export interface NearbyUser {
  id: string;
  name: string;
  age: number;
  distanceKm: number;
  online: boolean;
  premium?: boolean;
  bio?: string;
  photo?: string;
  accentColors?: [string, string, ...string[]];
}

export interface NearbyCardProps {
  user: NearbyUser;
  onPress?: () => void;
  onAdd?: () => void;
  added?: boolean;
  /** 'grid' = photo card, 'rail' = compact circle rail */
  variant?: 'grid' | 'rail';
  style?: StyleProp<ViewStyle>;
}

function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

export function NearbyCard({
  user,
  onPress,
  onAdd,
  added = false,
  variant = 'grid',
  style,
}: NearbyCardProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (variant === 'rail') {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 16, stiffness: 320 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 260 });
        }}
        style={style}>
        <Animated.View style={[styles.rail, animated]}>
          <View
            style={[
              styles.railAvatar,
              {
                borderColor: user.online
                  ? theme.colors.primary
                  : theme.colors.border,
              },
            ]}>
            {user.photo ? (
              <Image source={{ uri: user.photo }} style={styles.fill} />
            ) : (
              <LinearGradient
                colors={user.accentColors ?? theme.gradients.primary}
                style={styles.fill}
              />
            )}
          </View>
          <Typography variant="caption" weight="600" numberOfLines={1} align="center">
            {user.name.split(' ')[0]}
          </Typography>
          <View
            style={[
              styles.distBadge,
              { backgroundColor: theme.colors.surfaceAlt },
            ]}>
            <Typography variant="overline" color="textMuted">
              {formatDistance(user.distanceKm)}
            </Typography>
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 16, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 260 });
      }}
      style={style}>
      <Animated.View
        style={[
          styles.gridCard,
          {
            backgroundColor: theme.colors.card,
            ...theme.shadows.sm,
          },
          animated,
        ]}>
        <View style={styles.photoWrap}>
          {user.photo ? (
            <Image source={{ uri: user.photo }} style={styles.fill} />
          ) : (
            <LinearGradient
              colors={user.accentColors ?? theme.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fill}
            />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={styles.photoFade}
          />

          <View
            style={[
              styles.badge,
              { backgroundColor: 'rgba(0,0,0,0.45)' },
            ]}>
            <Icon name="map-pin" size={11} color="#fff" />
            <Typography variant="overline" tint="#fff">
              {formatDistance(user.distanceKm)}
            </Typography>
          </View>

          {user.online && (
            <View
              style={[
                styles.online,
                {
                  backgroundColor: theme.colors.online,
                  borderColor: theme.colors.card,
                },
              ]}
            />
          )}

          {user.premium && (
            <View style={[styles.crown, { backgroundColor: '#F5D76E' }]}>
              <Icon name="crown" size={11} color="#3A2A00" filled />
            </View>
          )}

          <Pressable
            onPress={onAdd}
            hitSlop={8}
            style={[
              styles.addFab,
              { backgroundColor: theme.colors.card },
            ]}>
            <Icon
              name={added ? 'user-check' : 'user-plus'}
              size={16}
              color={added ? theme.colors.success : theme.colors.primary}
            />
          </Pressable>
        </View>

        <View style={styles.meta}>
          <Typography variant="bodyStrong" numberOfLines={1}>
            {user.name}
          </Typography>
          <Typography variant="caption" color="textMuted">
            {user.age} yaş
          </Typography>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rail: { width: 76, alignItems: 'center', gap: 6 },
  railAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    overflow: 'hidden',
    padding: 2,
  },
  distBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  gridCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  photoWrap: {
    width: '100%',
    aspectRatio: 0.82,
    position: 'relative',
  },
  fill: { width: '100%', height: '100%' },
  photoFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  online: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  crown: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFab: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 2,
  },
});

export default NearbyCard;
