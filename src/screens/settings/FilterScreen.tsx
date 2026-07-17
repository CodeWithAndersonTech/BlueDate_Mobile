import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Chip,
  Header,
  IconName,
  RangeSlider,
  Screen,
  SectionHeader,
  Typography,
} from '../../components';
import { useTheme } from '../../theme';
import { TAB_BAR_SPACE } from '../../utils';

const AGE_MIN = 18;
const AGE_MAX = 65;

type VisibilityOption = { key: string; label: string; icon: IconName };

const VISIBILITY: VisibilityOption[] = [
  { key: 'women', label: 'Kadınlar', icon: 'user' },
  { key: 'men', label: 'Erkekler', icon: 'user' },
  { key: 'lgbt', label: 'LGBTQ+', icon: 'heart' },
  { key: 'everyone', label: 'Herkes', icon: 'globe' },
];

const SHOW_ME: VisibilityOption[] = [
  { key: 'women', label: 'Kadınlar', icon: 'user' },
  { key: 'men', label: 'Erkekler', icon: 'user' },
  { key: 'lgbt', label: 'LGBTQ+', icon: 'heart' },
  { key: 'everyone', label: 'Herkes', icon: 'globe' },
];

export function FilterScreen() {
  const navigation = useNavigation();
  const theme = useTheme();

  const [age, setAge] = useState({ low: 20, high: 40 });
  const [showMe, setShowMe] = useState<string[]>(['women']);
  const [visibleTo, setVisibleTo] = useState<string[]>(['everyone']);

  const toggle = (
    list: string[],
    setList: (next: string[]) => void,
    key: string,
  ) => {
    if (key === 'everyone') {
      setList(['everyone']);
      return;
    }
    const withoutEveryone = list.filter(k => k !== 'everyone');
    const next = withoutEveryone.includes(key)
      ? withoutEveryone.filter(k => k !== key)
      : [...withoutEveryone, key];
    setList(next.length ? next : ['everyone']);
  };

  const resetAll = () => {
    setAge({ low: 20, high: 40 });
    setShowMe(['women']);
    setVisibleTo(['everyone']);
  };

  return (
    <Screen edges={['top']}>
      <Header
        onBack={() => navigation.goBack()}
        title="Filtreleme"
        actions={[{ icon: 'sliders', onPress: resetAll }]}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {/* Age range */}
        <View style={styles.section}>
          <SectionHeader title="Yaş aralığı" />
          <Card variant="surface">
            <View style={styles.rowBetween}>
              <Typography variant="bodyStrong">Gösterilecek yaş</Typography>
              <Typography variant="bodyStrong" tint={theme.colors.primary}>
                {age.low} - {age.high === AGE_MAX ? `${AGE_MAX}+` : age.high}
              </Typography>
            </View>
            <Typography variant="caption" color="textMuted" style={styles.hint}>
              Sana yalnızca bu yaş aralığındaki kişiler gösterilir ve sen de
              yalnızca bu aralıktaki kişilere görünürsün.
            </Typography>
            <RangeSlider
              min={AGE_MIN}
              max={AGE_MAX}
              low={age.low}
              high={age.high}
              onChange={(low, high) => setAge({ low, high })}
              style={styles.slider}
            />
            <View style={styles.rowBetween}>
              <Typography variant="caption" color="textMuted">
                {AGE_MIN}
              </Typography>
              <Typography variant="caption" color="textMuted">
                {AGE_MAX}+
              </Typography>
            </View>
          </Card>
        </View>

        {/* Who I want to see */}
        <View style={styles.section}>
          <SectionHeader title="Kimleri görmek istiyorum" />
          <Card variant="surface">
            <Typography variant="caption" color="textMuted" style={styles.hint}>
              Keşfet ve yakındakiler ekranında karşına çıkacak kişileri seç.
            </Typography>
            <View style={styles.chips}>
              {SHOW_ME.map(o => (
                <Chip
                  key={o.key}
                  label={o.label}
                  icon={o.icon}
                  selected={showMe.includes(o.key)}
                  onPress={() => toggle(showMe, setShowMe, o.key)}
                />
              ))}
            </View>
          </Card>
        </View>

        {/* Who can see me */}
        <View style={styles.section}>
          <SectionHeader title="Beni kimler görebilsin" />
          <Card variant="surface">
            <Typography variant="caption" color="textMuted" style={styles.hint}>
              Profilinin kimlere gösterileceğini belirle. Birden fazla seçenek
              işaretleyebilirsin.
            </Typography>
            <View style={styles.chips}>
              {VISIBILITY.map(o => (
                <Chip
                  key={o.key}
                  label={o.label}
                  icon={o.icon}
                  selected={visibleTo.includes(o.key)}
                  onPress={() => toggle(visibleTo, setVisibleTo, o.key)}
                />
              ))}
            </View>
          </Card>
        </View>

        <Button
          label="Filtreleri uygula"
          leftIcon="check"
          onPress={() => navigation.goBack()}
          style={styles.apply}
        />
        <Typography
          variant="caption"
          color="textMuted"
          align="center"
          style={styles.note}>
          Bu ekran şimdilik yalnızca tasarım önizlemesidir.
        </Typography>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: TAB_BAR_SPACE + 24,
    gap: 24,
    paddingTop: 8,
  },
  section: { gap: 14 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hint: { marginTop: 6, marginBottom: 4, lineHeight: 18 },
  slider: { marginTop: 18, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  apply: { marginTop: 4 },
  note: { marginTop: 4 },
});

export default FilterScreen;
