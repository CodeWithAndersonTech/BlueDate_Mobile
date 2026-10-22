import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { blockUser, reportAndBlockUser } from '../../api';
import { FigmaButton, SheetModal, Typography } from '../../components';
import { useLocale, userFacingError } from '../../i18n';
import { useTheme } from '../../theme';

const MAX_DETAILS = 500;

type Props = {
  visible: boolean;
  targetUserId: number;
  targetName: string;
  onClose: () => void;
  onBlocked: () => void;
};

/** "Engelle" → Sadece Engelle | Report Et ve Engelle (message + Gönder). */
export function BlockSheet({ visible, targetUserId, targetName, onClose, onBlocked }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const [mode, setMode] = useState<'choose' | 'report'>('choose');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setMode('choose');
      setDetails('');
    }
  }, [visible]);

  const run = async (action: () => Promise<unknown>, doneKey: string) => {
    setBusy(true);
    try {
      await action();
      onBlocked();
      Alert.alert(t('safety.block'), t(doneKey));
    } catch (error) {
      Alert.alert(t('safety.block'), userFacingError(error, t, 'safety.block_error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SheetModal
      visible={visible}
      title={mode === 'choose' ? t('safety.block_sheet_title') : t('safety.report_and_block')}
      onClose={onClose}
      dismissable={!busy}>
      {mode === 'choose' ? (
        <>
          <Typography variant="callout" color="textMuted">
            {t('safety.block_sheet_body').replace('{name}', targetName)}
          </Typography>
          <FigmaButton
            label={t('safety.block_only')}
            tone="ghost"
            size="md"
            fullWidth
            loading={busy}
            onPress={() => {
              void run(() => blockUser(targetUserId), 'safety.blocked_done');
            }}
          />
          <FigmaButton
            label={t('safety.report_and_block')}
            tone="danger"
            size="md"
            fullWidth
            disabled={busy}
            onPress={() => setMode('report')}
          />
        </>
      ) : (
        <>
          <Typography variant="callout" color="textMuted">
            {t('safety.report_details_hint')}
          </Typography>
          <TextInput
            value={details}
            onChangeText={setDetails}
            maxLength={MAX_DETAILS}
            multiline
            autoFocus
            placeholder={t('safety.report_details_placeholder')}
            placeholderTextColor={theme.colors.textMuted}
            style={[
              theme.typography.variants.body,
              styles.input,
              {
                color: theme.colors.text,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: theme.radius.md,
                paddingHorizontal: theme.space.md,
                paddingVertical: theme.space.sm,
              },
            ]}
          />
          <View style={[styles.actions, { gap: theme.space.md }]}>
            <View style={styles.slot}>
              <FigmaButton
                label={t('common.back')}
                tone="ghost"
                size="md"
                fullWidth
                disabled={busy}
                onPress={() => setMode('choose')}
              />
            </View>
            <View style={styles.slot}>
              <FigmaButton
                label={t('safety.report_send')}
                tone="danger"
                size="md"
                fullWidth
                loading={busy}
                disabled={details.trim().length === 0}
                onPress={() => {
                  void run(
                    () => reportAndBlockUser(targetUserId, details),
                    'safety.reported_and_blocked',
                  );
                }}
              />
            </View>
          </View>
        </>
      )}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: 110, borderWidth: 1, textAlignVertical: 'top' },
  actions: { flexDirection: 'row' },
  slot: { flex: 1 },
});

export default BlockSheet;
