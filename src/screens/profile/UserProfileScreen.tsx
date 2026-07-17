import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Header,
  Icon,
  Screen,
  StatItem,
  Typography,
} from '../../components';
import { useTheme } from '../../theme';
import { TAB_BAR_SPACE, findPublicUser } from '../../utils';

type UserProfileParams = { UserProfile: { userId: string } };

type Props = NativeStackScreenProps<UserProfileParams, 'UserProfile'>;

export function UserProfileScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const user = useMemo(
    () => findPublicUser(route.params.userId),
    [route.params.userId],
  );
  const [added, setAdded] = useState(false);

  if (!user) {
    return (
      <Screen edges={['top']}>
        <Header onBack={() => navigation.goBack()} title="Profil" />
        <EmptyState
          icon="user"
          title="Kullanıcı bulunamadı"
          description="Bu profil artık mevcut değil."
        />
      </Screen>
    );
  }

  const subtitleParts = [
    user.age ? `${user.age}` : null,
    user.distanceKm != null ? `${user.distanceKm.toFixed(1)} km` : null,
    user.online ? 'Çevrimiçi' : null,
  ].filter(Boolean);

  return (
    <Screen edges={['top']}>
      <Header onBack={() => navigation.goBack()} title={user.name} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_SPACE }]}>
        <View style={[styles.hero, { borderRadius: theme.radii.xl }]}>
          <LinearGradient
            colors={theme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Avatar
            uri={user.avatar}
            name={user.name}
            size="xxl"
            online={user.online}
            premium={user.premium}
          />
          <Typography variant="h2" tint={theme.colors.onPrimary} style={styles.name}>
            {user.name}
          </Typography>
          <Typography variant="callout" tint={theme.colors.onPrimary}>
            {user.username}
          </Typography>
          {subtitleParts.length > 0 && (
            <Typography
              variant="caption"
              tint={theme.colors.onPrimary}
              style={styles.meta}>
              {subtitleParts.join(' · ')}
            </Typography>
          )}
        </View>

        {user.bio ? (
          <Card variant="surface">
            <Typography variant="caption" color="textMuted">
              Hakkında
            </Typography>
            <Typography variant="body" style={styles.bio}>
              {user.bio}
            </Typography>
          </Card>
        ) : null}

        <Card variant="surface" style={styles.statsCard}>
          <StatItem value={user.mutualFriends ?? 0} label="Ortak" />
          <View style={[styles.statSep, { backgroundColor: theme.colors.border }]} />
          <StatItem
            value={user.distanceKm != null ? Number(user.distanceKm.toFixed(1)) : '-'}
            label="Mesafe"
          />
          <View style={[styles.statSep, { backgroundColor: theme.colors.border }]} />
          <StatItem value={user.age ?? '-'} label="Yaş" />
        </Card>

        <View style={styles.actions}>
          <Button
            label={added ? 'İstek gönderildi' : 'Arkadaş ekle'}
            leftIcon={added ? 'check' : 'user-plus'}
            variant={added ? 'secondary' : 'primary'}
            onPress={() => setAdded(prev => !prev)}
          />
          <Button
            label="Mesaj gönder"
            leftIcon="message"
            variant="outline"
            onPress={() => {}}
          />
        </View>

        {user.premium && (
          <View
            style={[
              styles.premiumNote,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.border,
              },
            ]}>
            <Icon name="crown" size={18} color={theme.colors.warning} filled />
            <Typography variant="caption" color="textSecondary">
              Bu kullanıcı BlueDate Premium üyesi.
            </Typography>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 16 },
  hero: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    overflow: 'hidden',
    gap: 6,
  },
  name: { marginTop: 14 },
  meta: { marginTop: 4, opacity: 0.9 },
  bio: { marginTop: 6 },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statSep: { width: 1, height: 36 },
  actions: { gap: 12 },
  premiumNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});

export default UserProfileScreen;
