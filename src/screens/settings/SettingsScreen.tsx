import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  Icon,
  FALLBACK_LANGUAGES,
  ListRow,
  SegmentedControl,
  SettingsGroup,
  SettingsSep,
  Switch,
} from '../../components';
import { useLocale } from '../../i18n';
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
  const { t, languageCode, languages, setLanguage } = useLocale();
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
    { key: 'light', label: t('settings.theme_light') },
    { key: 'dark', label: t('settings.theme_dark') },
    { key: 'system', label: t('settings.theme_system') },
  ];

  const handleSignOut = () => {
    Alert.alert(t('settings.sign_out'), t('settings.sign_out_confirm'), [
      { text: t('settings.cancel'), style: 'cancel' },
      {
        text: t('settings.sign_out'),
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  const openPremium = () => {
    navigation.getParent()?.navigate('Premium' as never);
  };

  const languageOptions = languages.length ? languages : FALLBACK_LANGUAGES;
  const activeLanguage =
    languageOptions.find(
      lang => lang.Code.toLowerCase() === languageCode.toLowerCase(),
    ) ?? languageOptions[0];

  const cycleLanguage = () => {
    const index = languageOptions.findIndex(
      lang => lang.Code.toLowerCase() === activeLanguage.Code.toLowerCase(),
    );
    const next = languageOptions[(index + 1) % languageOptions.length];
    if (next) {
      void setLanguage(next.Code);
    }
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <View style={styles.header}>
        <Text
          style={[styles.headerTitle, { color: theme.colors.text }]}
          numberOfLines={1}>
          {t('settings.title')}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 12) + 28 },
        ]}>
        <SectionLabel label={t('settings.appearance')} />
        <SettingsGroup>
          <View style={styles.block}>
            <Text style={[styles.blockTitle, { color: theme.colors.text }]}>
              {t('settings.theme')}
            </Text>
            <SegmentedControl
              items={modeItems}
              value={preference}
              onChange={key => setPreference(key as ThemePreference)}
            />
          </View>
          <SettingsSep />
          <View style={styles.block}>
            <View style={styles.rowBetween}>
              <Text style={[styles.blockTitle, { color: theme.colors.text }]}>
                {t('settings.color')}
              </Text>
              <Text
                style={[styles.blockMeta, { color: theme.colors.textMuted }]}>
                {accents[accentKey].label}
              </Text>
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

        <SectionLabel label={t('settings.discover')} />
        <SettingsGroup>
          <ListRow
            icon="sliders"
            title={t('settings.filter')}
            subtitle={t('settings.filter_desc')}
            onPress={() => navigation.navigate('Filter')}
            style={styles.rowPad}
          />
        </SettingsGroup>

        <SectionLabel label={t('settings.account')} />
        <SettingsGroup>
          <ListRow
            icon="user"
            title={t('settings.account_info')}
            onPress={() => navigation.navigate('EditProfile')}
            style={styles.rowPad}
          />
          <SettingsSep />
          <ListRow
            icon="lock"
            title={t('settings.password')}
            onPress={() => {}}
            style={styles.rowPad}
          />
          <SettingsSep />
          <ListRow
            icon="crown"
            iconColor={theme.colors.warning}
            title={t('settings.premium')}
            value={t('settings.premium_active')}
            onPress={openPremium}
            style={styles.rowPad}
          />
        </SettingsGroup>

        <SectionLabel label={t('settings.notifications')} />
        <SettingsGroup>
          <ListRow
            icon="bell"
            title={t('settings.notif_push')}
            showChevron={false}
            right={
              <Switch value={notif.push} onValueChange={setNotifKey('push')} />
            }
            style={styles.rowPad}
          />
          <SettingsSep />
          <ListRow
            icon="sparkles"
            title={t('settings.notif_matches')}
            showChevron={false}
            right={
              <Switch
                value={notif.matches}
                onValueChange={setNotifKey('matches')}
              />
            }
            style={styles.rowPad}
          />
          <SettingsSep />
          <ListRow
            icon="message"
            title={t('settings.notif_messages')}
            showChevron={false}
            right={
              <Switch
                value={notif.messages}
                onValueChange={setNotifKey('messages')}
              />
            }
            style={styles.rowPad}
          />
          <SettingsSep />
          <ListRow
            icon="zap"
            title={t('settings.notif_marketing')}
            showChevron={false}
            right={
              <Switch
                value={notif.marketing}
                onValueChange={setNotifKey('marketing')}
              />
            }
            style={styles.rowPad}
          />
        </SettingsGroup>

        <SectionLabel label={t('settings.privacy_support')} />
        <SettingsGroup>
          <ListRow
            icon="shield"
            title={t('settings.privacy')}
            onPress={() => {}}
            style={styles.rowPad}
          />
          <SettingsSep />
          <ListRow
            icon="help"
            title={t('settings.help')}
            onPress={() => {}}
            style={styles.rowPad}
          />
          <SettingsSep />
          <ListRow
            icon="globe"
            title={t('settings.language')}
            value={activeLanguage?.Name}
            onPress={cycleLanguage}
            style={styles.rowPad}
          />
        </SettingsGroup>

        <View style={styles.logoutWrap}>
          <SettingsGroup>
            <ListRow
              icon="logout"
              iconColor={theme.colors.danger}
              title={t('settings.sign_out')}
              destructive
              showChevron={false}
              onPress={handleSignOut}
              style={styles.rowPad}
            />
          </SettingsGroup>
        </View>

        <Text
          style={[styles.version, { color: theme.colors.textMuted }]}>
          {t('settings.version')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
      {label}
    </Text>
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
    <Pressable
      style={styles.swatchItem}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accent.label}>
      <LinearGradient
        colors={accent.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.swatch,
          {
            borderColor: selected ? theme.colors.text : 'transparent',
          },
        ]}>
        {selected ? (
          <Icon
            name="check"
            size={18}
            color={accent.onPrimary}
            strokeWidth={3}
          />
        ) : null}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 4,
    minHeight: 36,
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    gap: 8,
    paddingTop: 8,
  },
  sectionLabel: {
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  block: { paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  blockTitle: { fontSize: 15, fontWeight: '600' },
  blockMeta: { fontSize: 13, fontWeight: '500' },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowPad: { paddingHorizontal: 16 },
  swatches: { flexDirection: 'row', gap: 10 },
  swatchItem: { flex: 1, alignItems: 'center' },
  swatch: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutWrap: { marginTop: 20, marginBottom: 4 },
  version: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SettingsScreen;
