import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Header,
  Icon,
  ListRow,
  Screen,
  SegmentedControl,
  SettingsGroup,
  SettingsSep,
  Switch,
  Typography,
} from '../../components';
import { useAuth } from '../../navigation/AuthContext';
import { useLockTabSwipe } from '../../navigation/useLockTabSwipe';
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
  useLockTabSwipe();

  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { preference, setPreference, accentKey, setAccent } =
    useThemeController();
  const { signOut } = useAuth();

  const [notif, setNotif] = useState({
    push: true,
    matches: true,
    messages: true,
    marketing: false,
  });
  const setNotifKey = (key: keyof typeof notif) => (value: boolean) =>
    setNotif(prev => ({ ...prev, [key]: value }));

  const modeItems = [
    { key: 'light', label: 'Açık' },
    { key: 'dark', label: 'Koyu' },
    { key: 'system', label: 'Sistem' },
  ];

  const handleSignOut = () => {
    Alert.alert('Çıkış Yap', 'Hesabından çıkmak istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  return (
    <Screen edges={['top']}>
      <Header onBack={() => navigation.goBack()} title="Ayarlar" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 12) + 32 },
        ]}>
        <SectionLabel label="Görünüm" />
        <SettingsGroup>
          <View style={styles.block}>
            <Typography variant="bodyStrong">Tema</Typography>
            <SegmentedControl
              items={modeItems}
              value={preference}
              onChange={key => setPreference(key as ThemePreference)}
            />
          </View>
          <SettingsSep />
          <View style={styles.block}>
            <View style={styles.rowBetween}>
              <Typography variant="bodyStrong">Renk</Typography>
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
          </View>
        </SettingsGroup>

        <SectionLabel label="Keşfet" />
        <SettingsGroup>
          <ListRow
            icon="sliders"
            title="Filtreleme"
            subtitle="Yaş, görünürlük"
            onPress={() => navigation.navigate('Filter')}
          />
        </SettingsGroup>

        <SectionLabel label="Hesap" />
        <SettingsGroup>
          <ListRow icon="user" title="Hesap bilgileri" onPress={() => {}} />
          <SettingsSep />
          <ListRow icon="lock" title="Şifre ve güvenlik" onPress={() => {}} />
          <SettingsSep />
          <ListRow
            icon="crown"
            iconColor={theme.colors.warning}
            title="Premium"
            value="Aktif"
            onPress={() => {}}
          />
        </SettingsGroup>

        <SectionLabel label="Bildirimler" />
        <SettingsGroup>
          <ListRow
            icon="bell"
            title="Anlık bildirimler"
            showChevron={false}
            right={
              <Switch value={notif.push} onValueChange={setNotifKey('push')} />
            }
          />
          <SettingsSep />
          <ListRow
            icon="sparkles"
            title="Eşleşmeler"
            showChevron={false}
            right={
              <Switch
                value={notif.matches}
                onValueChange={setNotifKey('matches')}
              />
            }
          />
          <SettingsSep />
          <ListRow
            icon="message"
            title="Mesajlar"
            showChevron={false}
            right={
              <Switch
                value={notif.messages}
                onValueChange={setNotifKey('messages')}
              />
            }
          />
          <SettingsSep />
          <ListRow
            icon="zap"
            title="Kampanyalar"
            showChevron={false}
            right={
              <Switch
                value={notif.marketing}
                onValueChange={setNotifKey('marketing')}
              />
            }
          />
        </SettingsGroup>

        <SectionLabel label="Gizlilik & Destek" />
        <SettingsGroup>
          <ListRow icon="shield" title="Gizlilik" onPress={() => {}} />
          <SettingsSep />
          <ListRow icon="help" title="Yardım" onPress={() => {}} />
          <SettingsSep />
          <ListRow
            icon="globe"
            title="Dil"
            value="Türkçe"
            onPress={() => {}}
          />
        </SettingsGroup>

        <View style={styles.logoutWrap}>
          <SettingsGroup>
            <ListRow
              icon="logout"
              iconColor={theme.colors.danger}
              title="Çıkış Yap"
              destructive
              showChevron={false}
              onPress={handleSignOut}
            />
          </SettingsGroup>
        </View>

        <Typography variant="caption" color="textMuted" align="center">
          Meerk · v0.1.0
        </Typography>
      </ScrollView>
    </Screen>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Typography
      variant="overline"
      color="textMuted"
      style={styles.sectionLabel}>
      {label}
    </Typography>
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
          { borderColor: selected ? theme.colors.text : 'transparent' },
        ]}>
        {selected && (
          <Icon
            name="check"
            size={18}
            color={accent.onPrimary}
            strokeWidth={3}
          />
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 8,
    paddingTop: 4,
  },
  sectionLabel: {
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
  },
  block: { padding: 16, gap: 12 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  swatches: { flexDirection: 'row', gap: 12 },
  swatchItem: { flex: 1, alignItems: 'center' },
  swatch: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutWrap: { marginTop: 24, marginBottom: 8 },
});

export default SettingsScreen;
