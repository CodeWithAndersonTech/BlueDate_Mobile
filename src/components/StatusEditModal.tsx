import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocale } from '../i18n';
import { useTheme } from '../theme';
import { Button } from './Button';
import { Typography } from './Typography';

const MAX_LEN = 40;

type Props = {
  visible: boolean;
  initialStatus?: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (status: string) => void;
  onClear?: () => void;
};

export function StatusEditModal({
  visible,
  initialStatus = '',
  saving = false,
  onClose,
  onSave,
  onClear,
}: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const [text, setText] = useState(initialStatus);
  const hasExisting = initialStatus.trim().length > 0;

  useEffect(() => {
    if (visible) {
      setText(initialStatus);
    }
  }, [visible, initialStatus]);

  const trimmed = text.trim();
  const canSave = trimmed.length > 0 && trimmed.length <= MAX_LEN && !saving;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Stay in the same window as the app — avoids some VC hierarchy issues
      // when nested under Material Top Tabs.
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}>
            <Typography variant="h3">
              {hasExisting
                ? t('profile.status_edit')
                : t('profile.status_add')}
            </Typography>
            <Typography variant="caption" color="textMuted">
              {t('profile.status_hint').replace('{count}', String(MAX_LEN))}
            </Typography>

            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t('profile.status_placeholder')}
              placeholderTextColor={theme.colors.textMuted}
              maxLength={MAX_LEN}
              autoFocus
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceAlt,
                },
              ]}
            />

            <Typography variant="caption" color="textMuted" align="right">
              {trimmed.length}/{MAX_LEN}
            </Typography>

            <View style={styles.actions}>
              <View style={styles.actionSlot}>
                <Button
                  label={t('profile.status_cancel')}
                  variant="secondary"
                  size="md"
                  disabled={saving}
                  onPress={onClose}
                />
              </View>
              <View style={styles.actionSlot}>
                <Button
                  label={t('profile.status_save')}
                  variant="primary"
                  size="md"
                  disabled={!canSave}
                  loading={saving}
                  onPress={() => onSave(trimmed)}
                />
              </View>
            </View>

            {hasExisting && onClear ? (
              <Pressable
                onPress={onClear}
                disabled={saving}
                hitSlop={8}
                accessibilityRole="button"
                style={styles.clearBtn}>
                {saving ? (
                  <ActivityIndicator size="small" color={theme.colors.danger} />
                ) : (
                  <Text
                    style={[styles.clearLabel, { color: theme.colors.danger }]}>
                    {t('profile.status_clear')}
                  </Text>
                )}
              </Pressable>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  sheet: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    overflow: 'hidden',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    marginTop: 8,
  },
  actionSlot: {
    flex: 1,
  },
  clearBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
    minHeight: 28,
    justifyContent: 'center',
  },
  clearLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default StatusEditModal;
