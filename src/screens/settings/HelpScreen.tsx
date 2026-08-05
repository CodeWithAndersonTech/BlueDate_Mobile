import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Card,
  Header,
  Icon,
  Screen,
  Typography,
} from '../../components';
import { useLocale } from '../../i18n';
import { useLockTabSwipe } from '../../navigation/useLockTabSwipe';
import {
  HomeStackParamList,
  ProfileStackParamList,
} from '../../navigation/types';
import { useTheme } from '../../theme';

type Props =
  | NativeStackScreenProps<ProfileStackParamList, 'Help'>
  | NativeStackScreenProps<HomeStackParamList, 'Help'>;

const FAQ_KEYS = [
  { q: 'help.faq_nearby_q', a: 'help.faq_nearby_a' },
  { q: 'help.faq_filters_q', a: 'help.faq_filters_a' },
  { q: 'help.faq_friends_q', a: 'help.faq_friends_a' },
  { q: 'help.faq_messages_q', a: 'help.faq_messages_a' },
  { q: 'help.faq_password_q', a: 'help.faq_password_a' },
] as const;

export function HelpScreen(_props: Props) {
  useLockTabSwipe();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const [openKey, setOpenKey] = useState<string | null>(FAQ_KEYS[0].q);

  return (
    <Screen edges={['top']}>
      <Header title={t('help.title')} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}>
        <Typography variant="body" color="textMuted" style={styles.intro}>
          {t('help.intro')}
        </Typography>

        <Card variant="surface" style={styles.tipsCard}>
          <View style={styles.cardHead}>
            <View
              style={[
                styles.iconChip,
                { backgroundColor: theme.colors.primarySoft },
              ]}>
              <Icon name="sparkles" size={18} color={theme.colors.primary} />
            </View>
            <Typography variant="bodyStrong">{t('help.tips_title')}</Typography>
          </View>
          <Typography variant="callout" color="textMuted" style={styles.body}>
            {t('help.tips_body')}
          </Typography>
        </Card>

        <Typography variant="caption" color="textMuted" style={styles.faqLabel}>
          {t('help.faq_label')}
        </Typography>

        {FAQ_KEYS.map(item => {
          const open = openKey === item.q;
          return (
            <Pressable
              key={item.q}
              onPress={() => setOpenKey(open ? null : item.q)}
              style={[
                styles.faqItem,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}>
              <View style={styles.faqHead}>
                <Typography variant="bodyStrong" style={styles.faqQ}>
                  {t(item.q)}
                </Typography>
                <View style={open ? styles.chevronOpen : undefined}>
                  <Icon
                    name="chevron-down"
                    size={18}
                    color={theme.colors.textMuted}
                  />
                </View>
              </View>
              {open ? (
                <Typography
                  variant="callout"
                  color="textMuted"
                  style={styles.faqA}>
                  {t(item.a)}
                </Typography>
              ) : null}
            </Pressable>
          );
        })}

        <Card variant="surface" style={styles.contactCard}>
          <View style={styles.cardHead}>
            <View
              style={[
                styles.iconChip,
                { backgroundColor: theme.colors.primarySoft },
              ]}>
              <Icon name="mail" size={18} color={theme.colors.primary} />
            </View>
            <Typography variant="bodyStrong">
              {t('help.contact_title')}
            </Typography>
          </View>
          <Typography variant="callout" color="textMuted" style={styles.body}>
            {t('help.contact_body')}
          </Typography>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 10,
    paddingTop: 4,
  },
  intro: { lineHeight: 22, marginBottom: 4 },
  tipsCard: { gap: 10, padding: 16, marginBottom: 6 },
  contactCard: { gap: 10, padding: 16, marginTop: 6 },
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
  body: { lineHeight: 21 },
  faqLabel: {
    marginTop: 8,
    marginBottom: 2,
    marginLeft: 4,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  faqItem: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  faqHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  faqQ: { flex: 1 },
  faqA: { lineHeight: 21 },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
});

export default HelpScreen;
