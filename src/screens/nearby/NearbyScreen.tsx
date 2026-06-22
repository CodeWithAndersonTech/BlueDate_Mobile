import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip, Header, NearbyCard, Screen } from '../../components';
import { TAB_BAR_SPACE, nearbyUsers, screen } from '../../utils';

const FILTERS = [
  { key: 'all', label: 'Tümü', icon: 'sliders' as const },
  { key: 'online', label: 'Çevrimiçi', icon: 'globe' as const },
  { key: 'near', label: '< 2 km', icon: 'map-pin' as const },
  { key: 'premium', label: 'Premium', icon: 'crown' as const },
];

const GAP = 14;
const H_PADDING = 20;
const CARD_WIDTH = (screen.width - H_PADDING * 2 - GAP) / 2;

export function NearbyScreen() {
  const [filter, setFilter] = useState('all');
  const [added, setAdded] = useState<Record<string, boolean>>({});

  const toggleAdd = (id: string) => setAdded(prev => ({ ...prev, [id]: !prev[id] }));

  const filtered = nearbyUsers.filter(u => {
    if (filter === 'online') return u.online;
    if (filter === 'near') return u.distanceKm < 2;
    if (filter === 'premium') return u.premium;
    return true;
  });

  return (
    <Screen edges={['top']}>
      <Header
        large
        subtitle="Konumuna göre"
        title="Yakındakiler"
        actions={[{ icon: 'sliders', onPress: () => {} }]}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        contentContainerStyle={styles.filtersContent}>
        {FILTERS.map(f => (
          <Chip
            key={f.key}
            label={f.label}
            icon={f.icon}
            selected={filter === f.key}
            onPress={() => setFilter(f.key)}
          />
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.grid, { paddingBottom: TAB_BAR_SPACE }]}>
        {filtered.map(user => (
          <NearbyCard
            key={user.id}
            user={user}
            style={{ width: CARD_WIDTH }}
            added={!!added[user.id]}
            onAdd={() => toggleAdd(user.id)}
            onPress={() => {}}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { maxHeight: 52, flexGrow: 0 },
  filtersContent: { paddingHorizontal: H_PADDING, gap: 10, alignItems: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: GAP,
    paddingHorizontal: H_PADDING,
    paddingTop: 12,
  },
});

export default NearbyScreen;
