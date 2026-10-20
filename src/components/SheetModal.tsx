import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocale } from '../i18n';
import { useTheme } from '../theme';
import { Icon } from './Icon';
import { Typography } from './Typography';

type Props = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  /** Blocks backdrop/close while a request is in flight. */
  dismissable?: boolean;
  children: React.ReactNode;
};

/** Bottom sheet over the whole app; keyboard-aware. */
export function SheetModal({ visible, title, onClose, dismissable = true, children }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const close = () => {
    if (dismissable) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.backdrop, { backgroundColor: theme.colors.backdrop }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderTopLeftRadius: theme.radius.xl,
                borderTopRightRadius: theme.radius.xl,
                padding: theme.space.xl,
                paddingBottom: Math.max(insets.bottom, theme.space.lg) + theme.space.sm,
                gap: theme.space.md,
              },
            ]}>
            <View style={[styles.grabber, { backgroundColor: theme.colors.borderStrong }]} />
            {title ? (
              <View style={styles.titleRow}>
                <Typography variant="title" style={styles.title}>
                  {title}
                </Typography>
                <Pressable
                  onPress={close}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.close')}>
                  <Icon name="close" size={theme.iconSize.md} color={theme.colors.textMuted} />
                </Pressable>
              </View>
            ) : null}
            {children}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderWidth: StyleSheet.hairlineWidth, borderBottomWidth: 0 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginTop: -8 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1 },
});

export default SheetModal;
