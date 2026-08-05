import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Header, Icon, IconName, Screen, Typography } from '../../components';
import { useLocale } from '../../i18n';
import { useLockTabSwipe } from '../../navigation/useLockTabSwipe';
import {
  HomeStackParamList,
  ProfileStackParamList,
} from '../../navigation/types';
import { useTheme } from '../../theme';

type Props =
  | NativeStackScreenProps<ProfileStackParamList, 'Privacy'>
  | NativeStackScreenProps<HomeStackParamList, 'Privacy'>;

type Section = {
  icon: IconName;
  titleKey: string;
  bodyKey: string;
};

const SECTIONS: Section[] = [
  {
    icon: 'eye',
    titleKey: 'privacy.section_visibility_title',
    bodyKey: 'privacy.section_visibility_body',
  },
  {
    icon: 'sliders',
    titleKey: 'privacy.section_filters_title',
    bodyKey: 'privacy.section_filters_body',
  },
  {
    icon: 'lock',
    titleKey: 'privacy.section_data_title',
    bodyKey: 'privacy.section_data_body',
  },
  {
    icon: 'map-pin',
    titleKey: 'privacy.section_ble_title',
    bodyKey: 'privacy.section_ble_body',
  },
];

export function PrivacyScreen({ navigation }: Props) {
  useLockTabSwipe();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useLocale();

  return (
    <Screen edges={['top']}>
      <Header
        title={t('privacy.title')}
        onBack={() => navigation.goBack()}
        backAccessibilityLabel={t('common.back')}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}>
        <Typography variant="body" color="textMuted" style={styles.intro}>
          {t('privacy.intro')}
        </Typography>

        {SECTIONS.map(section => (
          <Card key={section.titleKey} variant="surface" style={styles.card}>
            <View style={styles.cardHead}>
              <View
                style={[
                  styles.iconChip,
                  { backgroundColor: theme.colors.primarySoft },
                ]}>
                <Icon
                  name={section.icon}
                  size={18}
                  color={theme.colors.primary}
                />
              </View>
              <Typography variant="bodyStrong" style={styles.cardTitle}>
                {t(section.titleKey)}
              </Typography>
            </View>
            <Typography variant="callout" color="textMuted" style={styles.body}>
              {t(section.bodyKey)}
            </Typography>
          </Card>
        ))}

        <Typography
          variant="caption"
          color="textMuted"
          align="center"
          style={styles.footer}>
          {t('privacy.footer')}
        </Typography>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 12,
    paddingTop: 4,
  },
  intro: { lineHeight: 22, marginBottom: 4 },
  card: { gap: 10, padding: 16 },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { flex: 1 },
  body: { lineHeight: 21 },
  footer: { marginTop: 8, lineHeight: 18 },
});

export default PrivacyScreen;
