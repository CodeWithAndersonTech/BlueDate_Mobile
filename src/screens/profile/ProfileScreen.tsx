import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Icon,
  IconButton,
  SectionHeader,
  StatItem,
  Typography,
  UserListItem,
} from '../../components';
import { Screen } from '../../components';
import { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { TAB_BAR_SPACE, currentUser, friends } from '../../utils';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>;

export function ProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const onlineFriends = friends.filter(f => f.online).slice(0, 4);

  return (
    <Screen edges={['top']}>
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
          <View style={styles.coverActions}>
            <IconButton
              name="settings"
              color="#fff"
              variant="plain"
              onPress={() => navigation.navigate('Settings')}
            />
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.avatarRow}>
            <Avatar
              uri={currentUser.avatar}
              name={currentUser.name}
              size="xxl"
              premium={currentUser.premium}
              style={styles.avatar}
            />
            <View style={styles.editBtn}>
              <Button
                label="Profili Düzenle"
                size="sm"
                variant="secondary"
                leftIcon="edit"
                fullWidth={false}
                onPress={() => navigation.navigate('EditProfile')}
              />
            </View>
          </View>

          <View style={styles.nameRow}>
            <Typography variant="h2">
              {currentUser.name}, {currentUser.age}
            </Typography>
            {currentUser.verified && (
              <Icon name="check" size={18} color={theme.colors.info} strokeWidth={3} />
            )}
          </View>
          <View style={styles.metaRow}>
            <Typography variant="callout" color="textMuted">
              {currentUser.username}
            </Typography>
            {currentUser.premium && <Badge label="Premium" tone="premium" />}
          </View>

          <View style={styles.locationRow}>
            <Icon name="map-pin" size={15} color={theme.colors.textMuted} />
            <Typography variant="callout" color="textMuted">
              {currentUser.location}
            </Typography>
          </View>

          <Typography variant="body" color="textSecondary" style={styles.bio}>
            {currentUser.bio}
          </Typography>

          <Card variant="surface" style={styles.statsCard}>
            <StatItem value={currentUser.stats.friends} label="Arkadaş" />
            <View style={[styles.statSep, { backgroundColor: theme.colors.border }]} />
            <StatItem value={currentUser.stats.likes.toLocaleString('tr-TR')} label="Beğeni" />
            <View style={[styles.statSep, { backgroundColor: theme.colors.border }]} />
            <StatItem value={`${(currentUser.stats.visits / 1000).toFixed(1)}K`} label="Ziyaret" />
          </Card>

          <View style={styles.section}>
            <SectionHeader title="İlgi alanları" />
            <View style={styles.interests}>
              {currentUser.interests.map(i => (
                <Chip key={i} label={i} />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Arkadaşlar"
              actionLabel="Tümünü gör"
              onAction={() => navigation.navigate('FriendsList')}
            />
            <Card variant="surface" padding="sm">
              {onlineFriends.map((f, i) => (
                <View key={f.id}>
                  <UserListItem
                    name={f.name}
                    subtitle={f.online ? 'Çevrimiçi' : (f.lastActive ?? 'çevrimdışı')}
                    avatarUri={f.avatar}
                    online={f.online}
                    premium={f.premium}
                    right={<Icon name="chevron-right" size={20} color={theme.colors.textMuted} />}
                    onPress={() => {}}
                  />
                  {i < onlineFriends.length - 1 && (
                    <View style={[styles.sep, { backgroundColor: theme.colors.border }]} />
                  )}
                </View>
              ))}
            </Card>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  coverWrap: { height: 160 },
  cover: { flex: 1 },
  coverActions: {
    position: 'absolute',
    top: 8,
    right: 16,
    flexDirection: 'row',
  },
  body: { paddingHorizontal: 20, marginTop: -52 },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  avatar: {},
  editBtn: { marginBottom: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  bio: { marginTop: 12, lineHeight: 22 },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 18,
  },
  statSep: { width: 1, height: 32 },
  section: { marginTop: 24, gap: 14 },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sep: { height: 1, marginLeft: 52 },
});

export default ProfileScreen;
