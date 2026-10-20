import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { acceptTreat, getTreat, rejectTreat, Treat, treatUserName } from '../../api';
import { Avatar, Button, EmptyState, Header, Screen, Typography } from '../../components';
import { useLocale, userFacingError } from '../../i18n';
import { useScreenBottomPad } from '../../navigation/tabBarLayout';
import { AppStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { TreatHero } from './TreatHero';

type Props = NativeStackScreenProps<AppStackParamList, 'TreatRequest'>;

/** Receiver side: accept (opens chat) or reject an incoming treat. */
export function TreatRequestScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const bottomPad = useScreenBottomPad(24);
  const { treatId } = route.params;
  const [treat, setTreat] = useState<Treat | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTreat(treatId)
      .then(next => {
        if (cancelled) return;
        if (next.isMine) {
          navigation.replace('TreatResult', { treatId });
          return;
        }
        setTreat(next);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [treatId, navigation]);

  const onAccept = useCallback(async () => {
    setBusy('accept');
    try {
      const next = await acceptTreat(treatId);
      if (next.conversationId) {
        navigation.replace('ChatThread', { conversationId: String(next.conversationId) });
      } else {
        setTreat(next);
      }
    } catch (error) {
      Alert.alert(t('treat.title'), userFacingError(error, t, 'treat.respond_error'));
    } finally {
      setBusy(null);
    }
  }, [treatId, navigation, t]);

  const onReject = useCallback(async () => {
    setBusy('reject');
    try {
      await rejectTreat(treatId);
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('treat.title'), userFacingError(error, t, 'treat.respond_error'));
    } finally {
      setBusy(null);
    }
  }, [treatId, navigation, t]);

  const sender = treat?.sender;
  const senderName = sender ? treatUserName(sender) : '';

  return (
    <Screen edges={['top']}>
      <Header
        title={t('treat.title')}
        onBack={() => navigation.goBack()}
        backAccessibilityLabel={t('common.back')}
      />
      {failed ? (
        <EmptyState fill icon="gift" title={t('treat.not_found')} />
      ) : !treat || !sender ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { padding: theme.space.xl, gap: theme.space.xl, paddingBottom: bottomPad },
          ]}>
          <View style={[styles.senderRow, { gap: theme.space.md }]}>
            <Avatar uri={sender.ProfileImage ?? undefined} name={senderName} size="md" />
            <Typography variant="bodyStrong" style={styles.flex} numberOfLines={2}>
              {t('treat.incoming').replace('{name}', senderName)}
            </Typography>
          </View>

          <TreatHero
            treat={treat}
            title={t('treat.incoming_title')}
            subject={treat.sender}
          />

          {treat.status === 'pending' ? (
            <View style={{ gap: theme.space.md }}>
              <Button
                label={t('treat.accept')}
                leftIcon="check"
                loading={busy === 'accept'}
                disabled={busy !== null}
                onPress={() => {
                  void onAccept();
                }}
              />
              <Button
                label={t('treat.reject')}
                variant="secondary"
                loading={busy === 'reject'}
                disabled={busy !== null}
                onPress={() => {
                  void onReject();
                }}
              />
            </View>
          ) : (
            <View style={{ gap: theme.space.md }}>
              <Typography variant="callout" color="textMuted" align="center">
                {treat.status === 'accepted' ? t('treat.already_accepted') : t('treat.already_rejected')}
              </Typography>
              {treat.status === 'accepted' && treat.conversationId ? (
                <Button
                  label={t('treat.go_chat')}
                  leftIcon="message"
                  onPress={() =>
                    navigation.replace('ChatThread', {
                      conversationId: String(treat.conversationId),
                    })
                  }
                />
              ) : null}
            </View>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1 },
  senderRow: { flexDirection: 'row', alignItems: 'center' },
});

export default TreatRequestScreen;
