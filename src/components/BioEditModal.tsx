import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../theme';
import { Button } from './Button';
import { Typography } from './Typography';

type Props = {
  visible: boolean;
  initialBio?: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (bio: string) => void;
};

export function BioEditModal({
  visible,
  initialBio = '',
  saving = false,
  onClose,
  onSave,
}: Props) {
  const theme = useTheme();
  const [bio, setBio] = useState(initialBio);
  const isEdit = initialBio.trim().length > 0;

  useEffect(() => {
    if (visible) {
      setBio(initialBio);
    }
  }, [visible, initialBio]);

  const trimmed = bio.trim();
  const canSave = trimmed.length > 0 && trimmed.length <= 500 && !saving;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable
            onPress={e => e.stopPropagation()}
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}>
            <Typography variant="h3">
              {isEdit ? 'Biyografi düzenle' : 'Biyografi ekle'}
            </Typography>
            <Typography variant="caption" color="textMuted">
              Kendini kısaca tanıt. En fazla 500 karakter.
            </Typography>

            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Örn: Kahve, gezi ve iyi sohbet..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              maxLength={500}
              textAlignVertical="top"
              autoFocus
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                },
              ]}
            />

            <Typography variant="caption" color="textMuted" align="right">
              {trimmed.length}/500
            </Typography>

            <View style={styles.actions}>
              <View style={styles.actionSlot}>
                <Button
                  label="İptal"
                  variant="secondary"
                  size="md"
                  disabled={saving}
                  onPress={onClose}
                />
              </View>
              <View style={styles.actionSlot}>
                <Button
                  label={saving ? 'Kaydet...' : isEdit ? 'Güncelle' : 'Kaydet'}
                  size="md"
                  loading={saving}
                  disabled={!canSave}
                  onPress={() => onSave(trimmed)}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
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
    minHeight: 120,
    maxHeight: 180,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 22,
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
});

export default BioEditModal;
