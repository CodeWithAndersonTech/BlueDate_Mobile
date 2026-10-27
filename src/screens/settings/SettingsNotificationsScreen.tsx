import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Header, Screen, Switch } from '../../components';
import { getUserPreference, updateUserPreference, UserPreference } from '../../api';
import { useLocale, userFacingError } from '../../i18n';
import { useLockTabSwipe } from '../../navigation/useLockTabSwipe';
import { useScreenBottomPad } from '../../navigation/tabBarLayout';
import {
  disablePushNotifications,
  enablePushNotifications,
  getNotificationPrefs,
  patchNotificationPref,
} from '../../services/push';
import { SettingsRow, SettingsSection } from './SettingsChrome';

export function SettingsNotificationsScreen() {
  useLockTabSwipe();
  const navigation = useNavigation();
  const bottomPad = useScreenBottomPad(24);
  const { t } = useLocale();
  const [pref, setPref] = useState<UserPreference | null>(null);
  const [notif, setNotif] = useState({
    push: true,
    matches: true,
    messages: true,
    marketing: false,
  });
  const lastPrefAt = useRef(0);

  useFocusEffect(
    useCallback(() => {
      void getNotificationPrefs().then(setNotif);
      if (Date.now() - lastPrefAt.current < 30_000) {
        return;
      }
      lastPrefAt.current = Date.now();
      getUserPreference()
        .then(setPref)
        .catch(() => undefined);
    }, []),
  );

  const setNotifKey = (key: keyof typeof notif) => (value: boolean) => {
    setNotif(prev => ({ ...prev, [key]: value }));
    void patchNotificationPref(key, value);
  };

  const onPushChange = (value: boolean) => {
    setNotif(prev => ({ ...prev, push: value }));
    void (async () => {
      await patchNotificationPref('push', value);
      if (value) {
        await enablePushNotifications();
        return;
      }
      await disablePushNotifications();
    })();
  };

  const savePref = async (
    patch: Partial<Pick<UserPreference, 'notifyNearby'>>,
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
        t('settings.notifications'),
        userFacingError(error, t, 'settings.pref_error'),
      );
    }
  };

  return (
    <Screen padded={false} edges={['top']}>
      <Header
        title={t('settings.notifications')}
        onBack={() => navigation.goBack()}
        backAccessibilityLabel={t('common.back')}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}>
        <SettingsSection>
          <SettingsRow
            icon="bell"
            title={t('settings.notif_push')}
            right={<Switch value={notif.push} onValueChange={onPushChange} />}
          />
          <SettingsRow
            icon="location"
            title={t('settings.notif_nearby')}
            subtitle={t('settings.notif_nearby_desc')}
            right={
              <Switch
                value={pref?.notifyNearby ?? true}
                onValueChange={value => {
                  void savePref({ notifyNearby: value });
                }}
              />
            }
          />
          <SettingsRow
            icon="messageNotif"
            title={t('settings.notif_messages')}
            right={
              <Switch
                value={notif.messages}
                onValueChange={setNotifKey('messages')}
              />
            }
          />
          <SettingsRow
            icon="medalStar"
            title={t('settings.notif_marketing')}
            right={
              <Switch
                value={notif.marketing}
                onValueChange={setNotifKey('marketing')}
              />
            }
          />
        </SettingsSection>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 10, paddingTop: 8, gap: 7 },
});

export default SettingsNotificationsScreen;
