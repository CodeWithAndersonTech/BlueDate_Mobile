import React from 'react';
import { Image, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { Badge } from './Badge';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
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
  style?: StyleProp<ViewStyle>;
}

export function NearbyCard({ user, onPress, onAdd, added = false, style }: NearbyCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          borderRadius: theme.radii.xl,
          backgroundColor: theme.colors.card,
          ...theme.shadows.md,
        },
        style,
      ]}>
      <View style={styles.media}>
        {user.photo ? (
          <Image source={{ uri: user.photo }} style={StyleSheet.absoluteFill} />
        ) : (
          <LinearGradient
            colors={user.accentColors ?? theme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.8)']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.topRow}>
          {user.online && (
            <Badge label="Çevrimiçi" tone="success" icon="globe" />
          )}
          {user.premium && <Badge label="Premium" tone="premium" />}
        </View>

        <View style={styles.distanceChip}>
          <Icon name="map-pin" size={12} color="#FFFFFF" />
          <Typography variant="overline" tint="#FFFFFF">
            {user.distanceKm < 1
              ? `${Math.round(user.distanceKm * 1000)} m`
              : `${user.distanceKm.toFixed(1)} km`}
          </Typography>
        </View>

        <View style={styles.bottom}>
          <Typography variant="title" tint="#FFFFFF" numberOfLines={1}>
            {user.name}, {user.age}
          </Typography>
          {user.bio && (
            <Typography variant="caption" tint="rgba(255,255,255,0.85)" numberOfLines={1}>
              {user.bio}
            </Typography>
          )}
        </View>
      </View>

      <View style={[styles.footer, { padding: theme.spacing.md }]}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: user.online ? theme.colors.online : theme.colors.offline },
            ]}
          />
          <Typography variant="caption" color="textMuted">
            {user.online ? 'Şimdi aktif' : 'Son görülme yakın'}
          </Typography>
        </View>
        <IconButton
          name={added ? 'user-check' : 'user-plus'}
          variant="surface"
          size={18}
          color={added ? theme.colors.success : theme.colors.primary}
          onPress={onAdd}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  media: {
    height: 200,
    justifyContent: 'space-between',
    padding: 12,
  },
  topRow: { flexDirection: 'row', gap: 6 },
  distanceChip: {
    position: 'absolute',
    bottom: 56,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  bottom: { gap: 2 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
});

export default NearbyCard;
