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
  /** 'grid' = circular photo tile, 'rail' = compact circle rail */
  variant?: 'grid' | 'rail';
  style?: StyleProp<ViewStyle>;
}

const CIRCLE = 132;

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

  const firstName = user.name.split(' ')[0] || user.name;

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
            {firstName}
          </Text>
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
      <Animated.View style={[styles.gridCard, animated]}>
        <View style={styles.circleWrap}>
          <View
            style={[
              styles.circle,
              {
                borderColor: user.online
                  ? theme.colors.primary
                  : theme.colors.borderStrong,
                backgroundColor: theme.colors.surfaceAlt,
              },
            ]}>
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
          </View>

          {user.online ? (
            <View
              style={[
                styles.online,
                {
                  backgroundColor: theme.colors.online,
                  borderColor: theme.colors.background,
                },
              ]}
            />
          ) : null}

          {user.premium ? (
            <View style={styles.crown}>
              <Icon name="crown" size={11} color="#3A2A00" filled />
            </View>
          ) : null}

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
                    : theme.colors.card,
                  borderColor: theme.colors.border,
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

        <Text
          style={[styles.name, { color: theme.colors.text }]}
          numberOfLines={1}>
          {firstName}
          {user.age > 0 ? (
            <Text style={{ color: theme.colors.textMuted }}>  {user.age}</Text>
          ) : null}
        </Text>
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
  gridCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  circleWrap: {
    width: CIRCLE,
    height: CIRCLE,
    position: 'relative',
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    borderWidth: 2.5,
    overflow: 'hidden',
  },
  fill: { width: '100%', height: '100%' },
  online: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
  },
  crown: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5D76E',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    maxWidth: CIRCLE + 8,
    textAlign: 'center',
  },
  addFab: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});

export default NearbyCard;
