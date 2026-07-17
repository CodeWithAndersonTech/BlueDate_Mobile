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
  IconName,
  Screen,
  SectionHeader,
  StatItem,
  Typography,
} from '../../components';
import { useTheme } from '../../theme';
import {
  PublicInterestKey,
  TAB_BAR_SPACE,
  findPublicUser,
} from '../../utils';

type UserProfileParams = { UserProfile: { userId: string } };
type Props = NativeStackScreenProps<UserProfileParams, 'UserProfile'>;

const INTEREST_ICONS: Record<PublicInterestKey, IconName> = {
  food: 'heart',
  dessert: 'sparkles',
  coffee: 'zap',
  beverage: 'star',
};

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

  const metaParts = [
    user.age ? `${user.age}` : null,
    user.distanceKm != null ? `${user.distanceKm.toFixed(1)} km` : null,
    user.online ? 'Çevrimiçi' : 'Çevrimdışı',
  ].filter(Boolean);

  return (
    <Screen edges={['top']}>
      <Header onBack={() => navigation.goBack()} title={user.name} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}>
        <View style={styles.coverWrap}>
          <LinearGradient
            colors={theme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cover}
          />
        </View>

        <View style={styles.body}>
          <View style={styles.avatarRow}>
            <Avatar
              uri={user.avatar}
              name={user.name}
              size="xxl"
              online={user.online}
              style={[styles.avatar, { borderColor: theme.colors.background }]}
            />
            <View style={styles.messageBtn}>
              <Button
                label="Mesaj gönder"
                size="sm"
                leftIcon="message"
                fullWidth={false}
                onPress={() => {}}
              />
            </View>
          </View>

          <View style={styles.nameBlock}>
            <Typography variant="h2">{user.name}</Typography>
            <Typography variant="callout" color="textMuted">
              {user.username}
            </Typography>
            {metaParts.length > 0 && (
              <Typography variant="caption" color="textSecondary" style={styles.meta}>
                {metaParts.join(' · ')}
              </Typography>
            )}
          </View>

          <View style={styles.bioWrap}>
            <Typography variant="caption" color="textMuted">
              Biyografi
            </Typography>
            <Typography variant="body" color="textSecondary" style={styles.bio}>
              {user.bio}
            </Typography>
          </View>

          <Card variant="surface" style={styles.statsCard}>
            <StatItem value={user.mutualFriends ?? 0} label="Ortak" />
            <View style={[styles.statSep, { backgroundColor: theme.colors.border }]} />
            <StatItem
              value={
                user.distanceKm != null ? `${user.distanceKm.toFixed(1)}` : '—'
              }
              label="km"
            />
            <View style={[styles.statSep, { backgroundColor: theme.colors.border }]} />
            <StatItem value={user.age ?? '—'} label="Yaş" />
          </Card>

          <View style={styles.section}>
            <SectionHeader title="İlgi alanları" />
            <View style={styles.interestList}>
              {user.interests.map(item => (
                <Card key={item.key} variant="surface" style={styles.interestCard}>
                  <View
                    style={[
                      styles.interestIcon,
                      { backgroundColor: theme.colors.primarySoft },
                    ]}>
                    <Icon
                      name={INTEREST_ICONS[item.key]}
                      size={16}
                      color={theme.colors.primary}
                      filled
                    />
                  </View>
                  <View style={styles.interestText}>
                    <Typography variant="caption" color="textMuted">
                      {item.label}
                    </Typography>
                    <Typography variant="bodyStrong">{item.value}</Typography>
                  </View>
                </Card>
              ))}
            </View>
          </View>

          <Button
            label={added ? 'İstek gönderildi' : 'Arkadaş ekle'}
            leftIcon={added ? 'check' : 'user-plus'}
            variant={added ? 'secondary' : 'outline'}
            onPress={() => setAdded(prev => !prev)}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  coverWrap: { height: 140 },
  cover: { flex: 1 },
  body: {
    paddingHorizontal: 20,
    marginTop: -52,
    gap: 18,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  avatar: {
    borderWidth: 4,
  },
  messageBtn: {
    marginBottom: 8,
    maxWidth: '58%',
  },
  nameBlock: { gap: 4 },
  meta: { marginTop: 2 },
  bioWrap: { gap: 6 },
  bio: { lineHeight: 22 },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statSep: { width: 1, height: 36 },
  section: { gap: 12 },
  interestList: { gap: 10 },
  interestCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  interestIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  interestText: { flex: 1, gap: 2 },
});

export default UserProfileScreen;
