import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Card,
  Header,
  Icon,
  ListRow,
  Screen,
  SectionHeader,
  SegmentedControl,
  Switch,
  Typography,
} from '../../components';
import { useAuth } from '../../navigation/AuthContext';
import { ProfileStackParamList } from '../../navigation/types';
import {
  AccentKey,
  ThemePreference,
  accentOrder,
  accents,
  useTheme,
  useThemeController,
} from '../../theme';

export function SettingsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const theme = useTheme();
  const { preference, setPreference, accentKey, setAccent } = useThemeController();
  const { signOut } = useAuth();

  const [notif, setNotif] = useState({ push: true, matches: true, messages: true, marketing: false });
  const setNotifKey = (key: keyof typeof notif) => (value: boolean) =>
    setNotif(prev => ({ ...prev, [key]: value }));

  const modeItems = [
    { key: 'light', label: 'Açık' },
    { key: 'dark', label: 'Koyu' },
    { key: 'system', label: 'Sistem' },
  ];

  return (
    <Screen edges={['top']}>
      <Header onBack={() => navigation.goBack()} title="Ayarlar" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Theme */}
        <View style={styles.section}>
          <SectionHeader title="Görünüm" />
          <Card variant="surface">
            <View style={styles.blockRow}>
              <View style={styles.blockLabel}>
                <Icon name="moon" size={18} color={theme.colors.primary} />
                <Typography variant="bodyStrong">Tema modu</Typography>
              </View>
            </View>
            <SegmentedControl
              items={modeItems}
              value={preference}
              onChange={key => setPreference(key as ThemePreference)}
              style={styles.modeControl}
            />

            <View style={[styles.blockRow, styles.accentHeader]}>
              <View style={styles.blockLabel}>
                <Icon name="palette" size={18} color={theme.colors.primary} />
                <Typography variant="bodyStrong">Renk teması</Typography>
              </View>
              <Typography variant="caption" color="textMuted">
                {accents[accentKey].label}
              </Typography>
            </View>
            <View style={styles.swatches}>
              {accentOrder.map(key => (
                <AccentSwatch
                  key={key}
                  accentKey={key}
                  selected={key === accentKey}
                  onPress={() => setAccent(key)}
                />
              ))}
            </View>
          </Card>
        </View>

        {/* Discovery / Filters */}
        <View style={styles.section}>
          <SectionHeader title="Keşfet" />
          <Card variant="surface" padding="sm">
            <ListRow
              icon="sliders"
              title="Filtreleme"
              subtitle="Yaş aralığı, kimleri görmek istediğin ve görünürlük"
              onPress={() => navigation.navigate('Filter')}
            />
          </Card>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <SectionHeader title="Hesap" />
          <Card variant="surface" padding="sm">
            <ListRow icon="user" title="Hesap bilgileri" subtitle="Ad, kullanıcı adı, e-posta" onPress={() => {}} />
            <Sep />
            <ListRow icon="lock" title="Şifre ve güvenlik" onPress={() => {}} />
            <Sep />
            <ListRow icon="crown" iconColor={theme.colors.warning} title="Premium üyelik" value="Aktif" onPress={() => {}} />
          </Card>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <SectionHeader title="Bildirimler" />
          <Card variant="surface" padding="sm">
            <ListRow
              icon="bell"
              title="Anlık bildirimler"
              showChevron={false}
              right={<Switch value={notif.push} onValueChange={setNotifKey('push')} />}
            />
            <Sep />
            <ListRow
              icon="sparkles"
              title="Yeni eşleşmeler"
              showChevron={false}
              right={<Switch value={notif.matches} onValueChange={setNotifKey('matches')} />}
            />
            <Sep />
            <ListRow
              icon="message"
              title="Mesajlar"
              showChevron={false}
              right={<Switch value={notif.messages} onValueChange={setNotifKey('messages')} />}
            />
            <Sep />
            <ListRow
              icon="zap"
              title="Kampanya ve duyurular"
              showChevron={false}
              right={<Switch value={notif.marketing} onValueChange={setNotifKey('marketing')} />}
            />
          </Card>
        </View>

        {/* Privacy & Help */}
        <View style={styles.section}>
          <SectionHeader title="Gizlilik & Destek" />
          <Card variant="surface" padding="sm">
            <ListRow icon="shield" title="Gizlilik" subtitle="Konum, görünürlük, engellenenler" onPress={() => {}} />
            <Sep />
            <ListRow icon="eye" title="Hesabı gizle" onPress={() => {}} />
            <Sep />
            <ListRow icon="help" title="Yardım & destek" onPress={() => {}} />
            <Sep />
            <ListRow icon="globe" title="Dil" value="Türkçe" onPress={() => {}} />
          </Card>
        </View>

        {/* Logout */}
        <Card variant="surface" padding="sm">
          <ListRow icon="logout" iconColor={theme.colors.danger} title="Çıkış Yap" destructive showChevron={false} onPress={signOut} />
        </Card>

        <Typography variant="caption" color="textMuted" align="center" style={styles.version}>
          BlueDate v0.1.0 (UI Önizleme)
        </Typography>
      </ScrollView>
    </Screen>
  );
}

function AccentSwatch({
  accentKey,
  selected,
  onPress,
}: {
  accentKey: AccentKey;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const accent = accents[accentKey];
  return (
    <Pressable style={styles.swatchItem} onPress={onPress}>
      <LinearGradient
        colors={accent.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.swatch,
          {
            borderColor: selected ? theme.colors.text : 'transparent',
          },
          selected && theme.shadows.glow,
        ]}>
        {selected && <Icon name="check" size={22} color={accent.onPrimary} strokeWidth={3} />}
      </LinearGradient>
      <Typography variant="caption" color={selected ? 'text' : 'textMuted'}>
        {accent.label}
      </Typography>
    </Pressable>
  );
}

function Sep() {
  const theme = useTheme();
  return <View style={[styles.sep, { backgroundColor: theme.colors.border }]} />;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 24, paddingTop: 8 },
  section: { gap: 14 },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modeControl: { marginTop: 14 },
  accentHeader: { marginTop: 22 },
  swatches: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  swatchItem: { alignItems: 'center', gap: 8, flex: 1 },
  swatch: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sep: { height: 1, marginLeft: 54 },
  version: { marginTop: 8 },
});

export default SettingsScreen;
