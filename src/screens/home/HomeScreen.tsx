import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Icon,
  IconButton,
  IconName,
  SectionHeader,
  Typography,
} from '../../components';
import { HomeStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import {
  TAB_BAR_SPACE,
  currentUser,
  recentActivity,
  suggestedUsers,
} from '../../utils';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeFeed'>;

const QUICK_ACTIONS: { icon: IconName; label: string; tab: string }[] = [
  { icon: 'map-pin', label: 'Keşfet', tab: 'Nearby' },
  { icon: 'users', label: 'Arkadaşlar', tab: 'Friends' },
  { icon: 'crown', label: 'Premium', tab: 'Premium' },
  { icon: 'heart', label: 'Beğeniler', tab: 'Premium' },
];

const ACTIVITY_META: Record<string, { icon: IconName; label: string; color: (t: any) => string }> = {
  match: { icon: 'sparkles', label: 'ile eşleştin', color: t => t.colors.primary },
  like: { icon: 'heart', label: 'seni beğendi', color: t => t.colors.danger },
  visit: { icon: 'eye', label: 'profiline baktı', color: t => t.colors.info },
  request: { icon: 'user-plus', label: 'istek gönderdi', color: t => t.colors.warning },
};

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme();

  const goToTab = (tab: string) => navigation.getParent()?.navigate(tab as never);

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_SPACE }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.greeting}
            onPress={() => goToTab('Profile')}>
            <Avatar uri={currentUser.avatar} name={currentUser.name} size="md" premium online />
            <View>
              <Typography variant="caption" color="textMuted">
                Hoş geldin 👋
              </Typography>
              <Typography variant="title">{currentUser.name.split(' ')[0]}</Typography>
            </View>
          </Pressable>
          <View style={styles.topActions}>
            <IconButton name="bell" onPress={() => {}} />
            <IconButton name="settings" onPress={() => navigation.navigate('Settings')} />
          </View>
        </View>

        <Card variant="surface" padding="none" style={styles.hero}>
          <LinearGradient
            colors={theme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}>
            <View style={styles.heroText}>
              <Badge label="Premium" tone="premium" />
              <Typography variant="h2" tint={theme.colors.onPrimary}>
                Bugün 12 yeni{'\n'}kişi seni beğendi
              </Typography>
              <Button
                label="Kim olduğunu gör"
                variant="secondary"
                size="sm"
                fullWidth={false}
                rightIcon="chevron-right"
                onPress={() => goToTab('Premium')}
              />
            </View>
            <Icon name="zap" size={120} color="rgba(255,255,255,0.18)" filled />
          </LinearGradient>
        </Card>

        <View style={styles.quickRow}>
          {QUICK_ACTIONS.map(a => (
            <Pressable key={a.label} style={styles.quickItem} onPress={() => goToTab(a.tab)}>
              <View
                style={[
                  styles.quickIcon,
                  { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radii.lg },
                ]}>
                <Icon name={a.icon} size={24} color={theme.colors.primary} />
              </View>
              <Typography variant="caption" color="textSecondary">
                {a.label}
              </Typography>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Yakındaki kişiler"
            actionLabel="Tümünü gör"
            onAction={() => goToTab('Nearby')}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestRow}>
            {suggestedUsers.map(u => (
              <Pressable key={u.id} onPress={() => goToTab('Nearby')}>
                <Card variant="elevated" padding="none" style={styles.suggestCard}>
                  <Image source={{ uri: u.photo }} style={styles.suggestImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.75)']}
                    style={styles.suggestOverlay}
                  />
                  {u.online && (
                    <View style={styles.suggestBadge}>
                      <Badge label="Aktif" tone="success" size="sm" />
                    </View>
                  )}
                  <View style={styles.suggestInfo}>
                    <Typography variant="bodyStrong" tint="#fff" numberOfLines={1}>
                      {u.name}, {u.age}
                    </Typography>
                    <View style={styles.suggestMeta}>
                      <Icon name="map-pin" size={12} color="rgba(255,255,255,0.8)" />
                      <Typography variant="caption" tint="rgba(255,255,255,0.8)">
                        {u.distanceKm.toFixed(1)} km
                      </Typography>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Son aktiviteler" />
          <Card variant="surface" padding="sm">
            {recentActivity.map((item, i) => {
              const meta = ACTIVITY_META[item.type];
              return (
                <View key={item.id}>
                  <View style={styles.activityRow}>
                    <Avatar uri={item.avatar} name={item.name} size="sm" />
                    <View style={styles.activityText}>
                      <Typography variant="body">
                        <Typography variant="bodyStrong">{item.name} </Typography>
                        {meta.label}
                      </Typography>
                      <Typography variant="caption" color="textMuted">
                        {item.time}
                      </Typography>
                    </View>
                    <View
                      style={[
                        styles.activityIcon,
                        { backgroundColor: theme.colors.surfaceAlt },
                      ]}>
                      <Icon name={meta.icon} size={16} color={meta.color(theme)} filled />
                    </View>
                  </View>
                  {i < recentActivity.length - 1 && (
                    <View style={[styles.sep, { backgroundColor: theme.colors.border }]} />
                  )}
                </View>
              );
            })}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 60, gap: 22 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topActions: { flexDirection: 'row', gap: 8 },
  hero: { overflow: 'hidden' },
  heroGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    overflow: 'hidden',
  },
  heroText: { flex: 1, gap: 12, alignItems: 'flex-start' },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickItem: { alignItems: 'center', gap: 8, flex: 1 },
  quickIcon: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { gap: 14 },
  suggestRow: { gap: 14, paddingRight: 8 },
  suggestCard: { width: 150, height: 200, overflow: 'hidden' },
  suggestImage: { width: '100%', height: '100%' },
  suggestOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },
  suggestBadge: { position: 'absolute', top: 10, left: 10 },
  suggestInfo: { position: 'absolute', bottom: 12, left: 12, right: 12, gap: 2 },
  suggestMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  activityText: { flex: 1, gap: 2 },
  activityIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sep: { height: 1, marginLeft: 52 },
});

export default HomeScreen;
