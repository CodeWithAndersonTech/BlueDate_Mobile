import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { getTreat, Treat, treatUserName } from '../../api';
import { EmptyState, FigmaButton, FigmaSpinner, Header, Screen } from '../../components';
import { useLocale } from '../../i18n';
import { useScreenBottomPad } from '../../navigation/tabBarLayout';
import { AppStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { TreatHero } from './TreatHero';

type Props = NativeStackScreenProps<AppStackParamList, 'TreatResult'>;

/** Sender side: "Teklifini Kabul Etti!" / "Teklifini Reddetti!". */
export function TreatResultScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const bottomPad = useScreenBottomPad(24);
  const { treatId } = route.params;
  const [treat, setTreat] = useState<Treat | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTreat(treatId)
      .then(next => {
        if (!cancelled) setTreat(next);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [treatId]);

  const goHome = () =>
    navigation.navigate('MainTabs', { screen: 'Home', params: { screen: 'HomeFeed' } });

  const receiverName = treat ? treatUserName(treat.receiver) : '';
  const title =
    treat?.status === 'accepted'
      ? t('treat.result_accepted')
      : treat?.status === 'rejected'
        ? t('treat.result_rejected')
        : t('treat.sent_title');
  const subtitle =
    treat?.status === 'accepted'
      ? t('treat.result_accepted_body')
      : treat?.status === 'rejected'
        ? t('treat.result_rejected_body').replace('{name}', receiverName)
        : `${t('treat.sent_to').replace('{name}', receiverName)}\n${t('treat.sent_wait')}`;

  return (
    <Screen edges={['top']}>
      <Header
        title={t('treat.title')}
        onBack={() => navigation.goBack()}
        backAccessibilityLabel={t('common.back')}
      />
      {failed ? (
        <EmptyState fill figmaIcon="gift" title={t('treat.not_found')} />
      ) : !treat ? (
        <FigmaSpinner fill />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { padding: theme.space.xl, gap: theme.space.xl, paddingBottom: bottomPad },
          ]}>
          <TreatHero
            treat={treat}
            title={title}
            subtitle={subtitle}
            subject={treat.receiver}
          />

          <View style={{ gap: theme.space.md }}>
            {treat.status === 'accepted' && treat.conversationId ? (
              <FigmaButton
                label={t('treat.go_chat')}
                size="md"
                fullWidth
                onPress={() =>
                  navigation.replace('ChatThread', {
                    conversationId: String(treat.conversationId),
                  })
                }
              />
            ) : null}
            {treat.status === 'rejected' ? (
              <FigmaButton
                label={t('treat.send_again')}
                size="md"
                fullWidth
                onPress={() =>
                  navigation.replace('UserProfile', {
                    userId: String(treat.receiver.UserId),
                    openTreat: true,
                  })
                }
              />
            ) : null}
            <FigmaButton
              label={t('treat.back_home')}
              tone="text"
              size="md"
              fullWidth
              onPress={goHome}
            />
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center' },
});

export default TreatResultScreen;
