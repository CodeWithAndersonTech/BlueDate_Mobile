import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Chip,
  EmptyState,
  NearbyCard,
  Screen,
  Typography,
} from '../../components';
import { NearbyStackParamList } from '../../navigation/types';
import { useTabBarClearance } from '../../navigation/CustomTabBar';
import { useTheme } from '../../theme';
import { nearbyUsers } from '../../utils';

type Props = NativeStackScreenProps<NearbyStackParamList, 'NearbyMain'>;

const FILTERS = [
  { key: 'all', label: 'Tümü' },
  { key: 'online', label: 'Çevrimiçi' },
  { key: 'near', label: '< 2 km' },
];

const GAP = 12;
const H_PAD = 20;
const CARD_W = (Dimensions.get('window').width - H_PAD * 2 - GAP) / 2;

export function NearbyScreen({ navigation }: Props) {
  const theme = useTheme();
  const tabClearance = useTabBarClearance(24);
  const [filter, setFilter] = useState('all');
  const [added, setAdded] = useState<Record<string, boolean>>({});

  const toggleAdd = (id: string) =>
    setAdded(prev => ({ ...prev, [id]: !prev[id] }));

  const filtered = nearbyUsers.filter(u => {
    if (filter === 'online') return u.online;
    if (filter === 'near') return u.distanceKm < 2;
    return true;
  });

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <View>
          <Typography variant="caption" color="textMuted">
            Konumuna göre
          </Typography>
          <Typography variant="h2">Yakındakiler</Typography>
        </View>
        <Pressable
          onPress={() => {}}
          style={[
            styles.filterBtn,
            { backgroundColor: theme.colors.surfaceAlt },
          ]}>
          <Typography variant="caption" weight="600" tint={theme.colors.primary}>
            Filtre
          </Typography>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filtersScroll}>
        {FILTERS.map(f => (
          <Chip
            key={f.key}
            label={f.label}
            selected={filter === f.key}
            onPress={() => setFilter(f.key)}
          />
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState
          icon="map-pin"
          title="Kimse bulunamadı"
          description="Filtreleri değiştirerek tekrar dene."
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: tabClearance },
          ]}>
          {filtered.map(user => (
            <NearbyCard
              key={user.id}
              user={user}
              variant="grid"
              style={{ width: CARD_W }}
              added={!!added[user.id]}
              onAdd={() => toggleAdd(user.id)}
              onPress={() =>
                navigation.navigate('UserProfile', { userId: user.id })
              }
            />
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: H_PAD,
    paddingTop: 4,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  filtersScroll: { maxHeight: 48, flexGrow: 0 },
  filters: {
    paddingHorizontal: H_PAD,
    gap: 8,
    alignItems: 'center',
    paddingBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    paddingHorizontal: H_PAD,
    paddingTop: 12,
  },
});

export default NearbyScreen;
