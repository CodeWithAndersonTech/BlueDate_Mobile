import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import {
  FALLBACK_LANGUAGES,
  FigmaIcon,
  Header,
  Screen,
} from '../../components';
import { useLocale } from '../../i18n';
import { useLockTabSwipe } from '../../navigation/useLockTabSwipe';
import { useScreenBottomPad } from '../../navigation/tabBarLayout';
import { useTheme } from '../../theme';
import { afterUiSettled } from '../../utils/afterUiSettled';
import { SettingsRow, SettingsSection } from './SettingsChrome';

export function SettingsLanguageScreen() {
  useLockTabSwipe();
  const navigation = useNavigation();
  const theme = useTheme();
  const bottomPad = useScreenBottomPad(24);
  const { t, languageCode, languages, setLanguage } = useLocale();
  const options = languages.length ? languages : FALLBACK_LANGUAGES;

  return (
    <Screen padded={false} edges={['top']}>
      <Header
        title={t('settings.language')}
        onBack={() => navigation.goBack()}
        backAccessibilityLabel={t('common.back')}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}>
        <SettingsSection>
          {options.map(lang => {
            const selected =
              lang.Code.toLowerCase() === languageCode.toLowerCase();
            return (
              <SettingsRow
                key={lang.Code}
                title={lang.Name}
                showChevron={false}
                onPress={() => {
                  afterUiSettled(() => {
                    void setLanguage(lang.Code);
                  });
                }}
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

export default SettingsLanguageScreen;
