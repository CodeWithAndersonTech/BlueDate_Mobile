import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import {
  FALLBACK_LANGUAGES,
  Header,
  Screen,
  Switch,
} from '../../components';
import { getUserPreference, updateUserPreference, UserPreference } from '../../api';
import { usePremium } from '../../hooks/usePremium';
import { useLocale, userFacingError } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { useLockTabSwipe } from '../../navigation/useLockTabSwipe';
import { useScreenBottomPad } from '../../navigation/tabBarLayout';
import { ProfileStackParamList } from '../../navigation/types';
import { SettingsRow, SettingsSection } from './SettingsChrome';

export function SettingsScreen() {
  useLockTabSwipe();

  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const bottomPad = useScreenBottomPad(24);
  const { t, languageCode, languages } = useLocale();
  const { signOut } = useAuth();
  const { isPlus } = usePremium();
  const [pref, setPref] = useState<UserPreference | null>(null);
  const lastPrefAt = useRef(0);

  useFocusEffect(
    useCallback(() => {
      if (Date.now() - lastPrefAt.current < 30_000) {
        return;
      }
      lastPrefAt.current = Date.now();
      getUserPreference()
        .then(setPref)
        .catch(() => undefined);
    }, []),
  );

  const savePref = async (
    patch: Partial<Pick<UserPreference, 'ghostMode'>>,
  ) => {
    const prev = pref;
    if (prev) {
      setPref({ ...prev, ...patch });
    }
    try {
      setPref(await updateUserPreference(patch));
    } catch (error) {
      setPref(prev);
      Alert.alert(
        t('settings.title'),
        userFacingError(error, t, 'settings.pref_error'),
      );
    }
  };

  const onGhostChange = (value: boolean) => {
    if (value && !isPlus) {
      Alert.alert(t('settings.ghost'), t('settings.ghost_requires_plus'), [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('notif.upgrade_cta'),
          onPress: () => openPremium(),
        },
      ]);
      return;
    }
    void savePref({ ghostMode: value });
  };

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

  function openPremium() {
    navigation.navigate('Premium' as never);
  }

  const languageOptions = languages.length ? languages : FALLBACK_LANGUAGES;
  const currentLanguage =
    languageOptions.find(
      lang => lang.Code.toLowerCase() === languageCode.toLowerCase(),
    )?.Name ?? languageCode;

  return (
    <Screen padded={false} edges={['top']}>
      <Header
        title={t('settings.title')}
        onBack={() => navigation.goBack()}
        backAccessibilityLabel={t('common.back')}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}>
        <SettingsSection label={t('settings.appearance')}>
          <SettingsRow
            icon="colorfilter"
            title={t('settings.theme')}
            onPress={() => navigation.navigate('SettingsTheme')}
          />
        </SettingsSection>

        <SettingsSection label={t('settings.preferences')}>
          <SettingsRow
            icon="filter"
            title={t('settings.filter')}
            onPress={() => navigation.navigate('Filter')}
          />
        </SettingsSection>

        <SettingsSection label={t('settings.account')}>
          <SettingsRow
            icon="lock"
            title={t('settings.password')}
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <SettingsRow
            icon="crown"
            title={t('settings.premium')}
            onPress={openPremium}
          />
          <SettingsRow
            icon="ghost"
            title={t('settings.ghost')}
            right={
              <Switch
                value={Boolean(pref?.ghostMode && isPlus)}
                onValueChange={onGhostChange}
              />
            }
          />
        </SettingsSection>

        <SettingsSection label={t('settings.app_section')}>
          <SettingsRow
            icon="bell"
            title={t('settings.notifications')}
            onPress={() => navigation.navigate('SettingsNotifications')}
          />
          <SettingsRow
            icon="global"
            title={t('settings.language')}
            value={currentLanguage}
            onPress={() => navigation.navigate('SettingsLanguage')}
          />
        </SettingsSection>

        <SettingsSection label={t('settings.privacy_support')}>
          <SettingsRow
            icon="profile2user"
            title={t('settings.blocked')}
            onPress={() => navigation.navigate('BlockedUsers')}
          />
          <SettingsRow
            icon="sort"
            title={t('settings.privacy')}
            onPress={() => navigation.navigate('Privacy')}
          />
          <SettingsRow
            icon="helpCircle"
            title={t('settings.help')}
            onPress={() => navigation.navigate('Help')}
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            icon="logout"
            title={t('settings.sign_out')}
            destructive
            onPress={handleSignOut}
          />
        </SettingsSection>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 10,
    paddingTop: 7,
    gap: 7,
  },
});

export default SettingsScreen;
