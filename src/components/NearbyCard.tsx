import React from 'react';
import {
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
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

  const pressIn = () => {
    scale.value = withSpring(0.97, { damping: 16, stiffness: 320 });
  };
  const pressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 260 });
  };

  if (variant === 'rail') {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={style}>
        <Animated.View style={[styles.rail, animated]}>
          <View
            style={[
              styles.railAvatar,
              {
                borderColor: user.online
                  ? theme.colors.primary
                  : theme.colors.borderStrong,
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
            {user.online ? (
              <View
                style={[
                  styles.railOnline,
                  {
                    backgroundColor: theme.colors.online,
                    borderColor: theme.colors.background,
                  },
                ]}
              />
            ) : null}
          </View>
          <Text
            style={[styles.railName, { color: theme.colors.text }]}
            numberOfLines={1}>
            {user.name.split(' ')[0]}
          </Text>
          <View
            style={[
              styles.railDist,
              { backgroundColor: theme.colors.surfaceAlt },
            ]}>
            <Text style={[styles.railDistText, { color: theme.colors.textMuted }]}>
              {formatDistance(user.distanceKm)}
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={style}
      accessibilityRole="button"
      accessibilityLabel={`${user.name}, ${user.age}`}>
      <Animated.View
        style={[
          styles.gridCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
          theme.shadows.sm,
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
            colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.72)']}
            locations={[0.35, 0.65, 1]}
            style={styles.photoFade}
          />

          <View style={styles.topRow}>
            <View style={styles.distBadge}>
              <Icon name="map-pin" size={10} color="#fff" />
              <Text style={styles.distText}>{formatDistance(user.distanceKm)}</Text>
            </View>
            <View style={styles.topRight}>
              {user.premium ? (
                <View style={styles.crown}>
                  <Icon name="crown" size={11} color="#3A2A00" filled />
                </View>
              ) : null}
              {user.online ? (
                <View
                  style={[
                    styles.online,
                    {
                      backgroundColor: theme.colors.online,
                      borderColor: '#fff',
                    },
                  ]}
                />
              ) : null}
            </View>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.nameBlock}>
              <Text style={styles.name} numberOfLines={1}>
                {user.name}
                {user.age > 0 ? (
                  <Text style={styles.age}>  {user.age}</Text>
                ) : null}
              </Text>
            </View>

            {onAdd ? (
              <Pressable
                onPress={onAdd}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={added ? 'Added' : 'Add'}
                style={[
                  styles.addFab,
                  {
                    backgroundColor: added
                      ? theme.colors.success
                      : 'rgba(255,255,255,0.95)',
                  },
                ]}>
                <Icon
                  name={added ? 'user-check' : 'user-plus'}
                  size={15}
                  color={added ? '#fff' : theme.colors.primary}
                />
              </Pressable>
            ) : null}
          </View>
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
    borderWidth: 2.5,
    overflow: 'hidden',
    position: 'relative',
  },
  railOnline: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
  },
  railName: { fontSize: 12, fontWeight: '600', maxWidth: 72 },
  railDist: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  railDistText: { fontSize: 10, fontWeight: '600' },
  gridCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  photoWrap: {
    width: '100%',
    aspectRatio: 0.72,
    position: 'relative',
  },
  fill: { width: '100%', height: '100%' },
  photoFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  distText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  online: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  crown: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5D76E',
  },
  bottomRow: {
    position: 'absolute',
    left: 12,
    right: 10,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  nameBlock: { flex: 1, gap: 2 },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  age: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    fontWeight: '600',
  },
  addFab: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NearbyCard;
