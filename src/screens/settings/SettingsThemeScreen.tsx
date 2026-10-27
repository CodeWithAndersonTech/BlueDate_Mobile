import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import {
  FigmaIcon,
  Header,
  Screen,
} from '../../components';
import { useLocale } from '../../i18n';
import { useLockTabSwipe } from '../../navigation/useLockTabSwipe';
import { useScreenBottomPad } from '../../navigation/tabBarLayout';
import { ThemePreference, useTheme, useThemeController } from '../../theme';
import { SettingsRow, SettingsSection } from './SettingsChrome';

const OPTIONS: { key: ThemePreference; labelKey: string }[] = [
  { key: 'light', labelKey: 'settings.theme_light' },
  { key: 'dark', labelKey: 'settings.theme_dark' },
  { key: 'system', labelKey: 'settings.theme_system' },
];

export function SettingsThemeScreen() {
  useLockTabSwipe();
  const navigation = useNavigation();
  const theme = useTheme();
  const bottomPad = useScreenBottomPad(24);
  const { t } = useLocale();
  const { preference, setPreference } = useThemeController();

  return (
    <Screen padded={false} edges={['top']}>
      <Header
        title={t('settings.theme')}
        onBack={() => navigation.goBack()}
        backAccessibilityLabel={t('common.back')}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}>
        <SettingsSection>
          {OPTIONS.map(option => {
            const selected = preference === option.key;
            return (
              <SettingsRow
                key={option.key}
                icon="colorfilter"
                title={t(option.labelKey)}
                showChevron={false}
                onPress={() => setPreference(option.key)}
                right={
                  selected ? (
                    <FigmaIcon
                      name="tickCircle"
                      size={20}
                      color={theme.colors.plusCta}
                    />
                  ) : undefined
                }
              />
            );
          })}
        </SettingsSection>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 10, paddingTop: 8, gap: 7 },
});

export default SettingsThemeScreen;
