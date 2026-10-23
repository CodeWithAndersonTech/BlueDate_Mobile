import React, { useCallback, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocale } from '../i18n';
import { useTheme } from '../theme';
import { afterUiSettled } from '../utils/afterUiSettled';
import { FigmaIcon } from './FigmaIcon';
import { SafeOverlay } from './SafeOverlay';
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
  const close = useCallback(() => {
    if (!dismissable) return;
    afterUiSettled(onClose, 16);
  }, [dismissable, onClose]);

  const translateY = useSharedValue(0);
  useEffect(() => {
    if (visible) {
      translateY.value = 0;
    }
  }, [visible, translateY]);

  const pan = Gesture.Pan()
    .enabled(dismissable)
    .activeOffsetY(12)
    .failOffsetX([-28, 28])
    .onUpdate(e => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd(e => {
      if (e.translationY > 72 || e.velocityY > 850) {
        translateY.value = withTiming(520, { duration: 180 }, finished => {
          if (finished) {
            runOnJS(close)();
          }
        });
        return;
      }
      translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <SafeOverlay visible={visible} onRequestClose={close}>
      <GestureHandlerRootView style={styles.flex}>
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
          <GestureDetector gesture={pan}>
          <Animated.View
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
              sheetStyle,
            ]}>
            <View style={styles.handle} hitSlop={12}>
            <View style={[styles.grabber, { backgroundColor: theme.colors.borderStrong }]} />
            </View>
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
                  <FigmaIcon
                    name="closeCircle"
                    size={theme.iconSize.md}
                    color={theme.colors.textMuted}
                  />
                </Pressable>
              </View>
            ) : null}
            {children}
          </Animated.View>
          </GestureDetector>
        </View>
      </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </SafeOverlay>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderWidth: StyleSheet.hairlineWidth, borderBottomWidth: 0 },
  handle: { alignItems: 'center', paddingTop: 4, paddingBottom: 10 },
  grabber: { width: 40, height: 4, borderRadius: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1 },
});

export default SheetModal;
