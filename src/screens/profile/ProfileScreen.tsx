import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import {
  Avatar,
  BioEditModal,
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
import {
  getInterestTypes,
  getUserProfile,
  updateUserBio,
  UserProfileResponse,
} from '../../api';
import { useAuth } from '../../navigation/AuthContext';
import { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { TAB_BAR_SPACE, friends } from '../../utils';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>;

export function ProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const { userId, accessToken } = useAuth();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [interestTypeCount, setInterestTypeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bioModalOpen, setBioModalOpen] = useState(false);
  const [savingBio, setSavingBio] = useState(false);

  const onlineFriends = friends.filter(f => f.online).slice(0, 4);

  const loadProfile = useCallback(
    async (isRefresh = false) => {
      if (!userId) {
        setError('Oturum bilgisi bulunamadı.');
        setLoading(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const [profileResponse, interestTypesResponse] = await Promise.all([
          getUserProfile(userId, accessToken),
          getInterestTypes(accessToken).catch(() => null),
        ]);

        setProfile(profileResponse);
        setInterestTypeCount(
          interestTypesResponse?.GetAllInterestTypeQueryCommonObject?.length ?? 0,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Profil yüklenemedi.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId, accessToken],
  );

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const fullName = profile
    ? `${profile.FirstName} ${profile.LastName}`.trim()
    : '';
  const bio = profile?.Bio?.trim() ?? '';
  const hasBio = bio.length > 0;
  const interests = profile?.Interests ?? [];
  const hasInterests = interests.length > 0;

  const onSaveBio = async (nextBio: string) => {
    if (!userId) {
      Alert.alert('Biyografi', 'Oturum bilgisi bulunamadı.');
      return;
    }

    setSavingBio(true);
    try {
      const response = await updateUserBio(
        { UserId: userId, Bio: nextBio },
        accessToken,
      );
      setProfile(prev =>
        prev
          ? {
              ...prev,
              Bio: response.Bio,
            }
          : prev,
      );
      setBioModalOpen(false);
    } catch (err) {
      Alert.alert(
        'Biyografi',
        err instanceof Error ? err.message : 'Biyografi kaydedilemedi.',
      );
    } finally {
      setSavingBio(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProfile(true)}
            tintColor={theme.colors.primary}
          />
        }>
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
          {loading && !profile ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : error && !profile ? (
            <View style={styles.centerState}>
              <Typography variant="body" color="danger" align="center">
                {error}
              </Typography>
              <Button
                label="Tekrar dene"
                size="sm"
                fullWidth={false}
                onPress={() => loadProfile()}
              />
            </View>
          ) : profile ? (
            <>
              <View style={styles.avatarRow}>
                <Avatar
                  uri={profile.ProfileImage ?? undefined}
                  name={fullName}
                  size="xxl"
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
                <Typography variant="h2">{fullName}</Typography>
                {profile.IsEmailVerified && (
                  <Icon name="check" size={18} color={theme.colors.info} strokeWidth={3} />
                )}
              </View>
              <View style={styles.metaRow}>
                <Typography variant="callout" color="textMuted">
                  @{profile.Username}
                </Typography>
              </View>

              {hasBio ? (
                <Pressable onPress={() => setBioModalOpen(true)} style={styles.bioWrap}>
                  <Typography variant="body" color="textSecondary" style={styles.bio}>
                    {bio}
                  </Typography>
                  <View style={styles.bioEditRow}>
                    <Icon name="edit" size={14} color={theme.colors.primary} />
                    <Typography variant="caption" tint={theme.colors.primary}>
                      Düzenle
                    </Typography>
                  </View>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => setBioModalOpen(true)}
                  style={[
                    styles.promptCard,
                    {
                      backgroundColor: theme.colors.primarySoft,
                      borderColor: theme.colors.primary,
                    },
                  ]}>
                  <Icon name="edit" size={18} color={theme.colors.primary} />
                  <View style={styles.promptText}>
                    <Typography variant="bodyStrong" tint={theme.colors.primary}>
                      Biyografi ekle
                    </Typography>
                    <Typography variant="caption" color="textMuted">
                      Kendini kısaca tanıt, profilin daha dikkat çeksin.
                    </Typography>
                  </View>
                  <Icon name="chevron-right" size={18} color={theme.colors.primary} />
                </Pressable>
              )}

              <Card variant="surface" style={styles.statsCard}>
                <StatItem value={0} label="Arkadaş" />
                <View style={[styles.statSep, { backgroundColor: theme.colors.border }]} />
                <StatItem value={0} label="Beğeni" />
                <View style={[styles.statSep, { backgroundColor: theme.colors.border }]} />
                <StatItem value={0} label="Ziyaret" />
              </Card>

              <View style={styles.section}>
                <SectionHeader
                  title="İlgi alanları"
                  actionLabel={hasInterests ? 'Düzenle' : undefined}
                  onAction={
                    hasInterests ? () => navigation.navigate('EditProfile') : undefined
                  }
                />
                {hasInterests ? (
                  <View style={styles.interests}>
                    {interests.map(item => (
                      <Chip
                        key={item.Id}
                        label={
                          item.InterestTypeName
                            ? `${item.InterestTypeName}: ${item.Value}`
                            : item.Value
                        }
                      />
                    ))}
                  </View>
                ) : (
                  <Pressable
                    onPress={() => navigation.navigate('EditProfile')}
                    style={[
                      styles.promptCard,
                      {
                        backgroundColor: theme.colors.surfaceAlt,
                        borderColor: theme.colors.borderStrong,
                      },
                    ]}>
                    <Icon name="sparkles" size={18} color={theme.colors.primary} />
                    <View style={styles.promptText}>
                      <Typography variant="bodyStrong">
                        İlgi alanlarını ekle
                      </Typography>
                      <Typography variant="caption" color="textMuted">
                        {interestTypeCount > 0
                          ? `${interestTypeCount} kategori hazır. Favorilerini yaz.`
                          : 'Favorilerini yazarak profilini tamamla.'}
                      </Typography>
                    </View>
                    <Icon name="chevron-right" size={18} color={theme.colors.textMuted} />
                  </Pressable>
                )}
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
                        right={
                          <Icon name="chevron-right" size={20} color={theme.colors.textMuted} />
                        }
                        onPress={() => {}}
                      />
                      {i < onlineFriends.length - 1 && (
                        <View style={[styles.sep, { backgroundColor: theme.colors.border }]} />
                      )}
                    </View>
                  ))}
                </Card>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>

      <BioEditModal
        visible={bioModalOpen}
        initialBio={bio}
        saving={savingBio}
        onClose={() => {
          if (!savingBio) {
            setBioModalOpen(false);
          }
        }}
        onSave={onSaveBio}
      />
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
  bioWrap: { marginTop: 12, gap: 8 },
  bio: { lineHeight: 22 },
  bioEditRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  promptCard: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  promptText: { flex: 1, gap: 2 },
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
  centerState: {
    marginTop: 48,
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
  },
});

export default ProfileScreen;
