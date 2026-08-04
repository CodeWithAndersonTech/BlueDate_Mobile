import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import PagerView from 'react-native-pager-view';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocale } from '../../i18n';
import { useTheme } from '../../theme';
import type { ProfilePhoto } from '../../services/photos/photoStore';

const { height: SCREEN_H } = Dimensions.get('window');
const DISMISS_Y = 140;
const FRAME_PAD = 20;
const FRAME_RADIUS = 22;

type Props = {
  photos: ProfilePhoto[];
  index: number;
  editable?: boolean;
  busy?: boolean;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  onDelete?: (photo: ProfilePhoto) => void;
};

export function PhotoViewerModal({
  photos,
  index,
  editable = false,
  busy = false,
  onClose,
  onIndexChange,
  onDelete,
}: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const visible = photos.length > 0 && index >= 0;
  const [page, setPage] = useState(Math.max(0, index));

  const translateY = useSharedValue(0);
  const backdrop = useSharedValue(0);
  const scaleIn = useSharedValue(0.94);

  useEffect(() => {
    if (visible) {
      setPage(Math.min(Math.max(0, index), photos.length - 1));
      translateY.value = 0;
      backdrop.value = withTiming(1, { duration: 220 });
      scaleIn.value = withSpring(1, { damping: 18, stiffness: 220 });
    } else {
      backdrop.value = 0;
      scaleIn.value = 0.94;
      translateY.value = 0;
    }
  }, [visible, index, photos.length, backdrop, scaleIn, translateY]);

  const close = useCallback(() => {
    backdrop.value = withTiming(0, { duration: 180 });
    translateY.value = withTiming(
      SCREEN_H * 0.35,
      { duration: 200, easing: Easing.out(Easing.cubic) },
      finished => {
        if (finished) {
          runOnJS(onClose)();
        }
      },
    );
  }, [backdrop, onClose, translateY]);

  const current = photos[page] ?? null;

  const hint = useMemo(() => {
    if (photos.length > 1) {
      return t('profile.photo_viewer_hint_swipe');
    }
    return t('profile.photo_viewer_hint');
  }, [photos.length, t]);

  const pan = Gesture.Pan()
    .activeOffsetY(16)
    .failOffsetX([-28, 28])
    .onUpdate(e => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd(e => {
      const shouldDismiss =
        translateY.value > DISMISS_Y || e.velocityY > 1100;
      if (shouldDismiss) {
        backdrop.value = withTiming(0, { duration: 180 });
        translateY.value = withTiming(
          SCREEN_H,
          { duration: 220, easing: Easing.out(Easing.cubic) },
          finished => {
            if (finished) {
              runOnJS(onClose)();
            }
          },
        );
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 260 });
      }
    });

  const rootStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(8, 10, 16, ${0.72 * backdrop.value * interpolate(
      translateY.value,
      [0, DISMISS_Y * 1.6],
      [1, 0.35],
      Extrapolation.CLAMP,
    )})`,
  }));

  const frameStyle = useAnimatedStyle(() => {
    const dragProgress = interpolate(
      translateY.value,
      [0, DISMISS_Y * 1.8],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scaleIn.value * interpolate(dragProgress, [0, 1], [1, 0.9]) },
      ],
      opacity: interpolate(dragProgress, [0, 1], [1, 0.55]),
    };
  });

  const actionsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, DISMISS_Y * 0.7],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}>
      <GestureHandlerRootView style={styles.flex}>
        <Animated.View style={[styles.root, rootStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />

          <GestureDetector gesture={pan}>
            <Animated.View
              style={[
                styles.frameWrap,
                {
                  paddingTop: insets.top + 28,
                  paddingBottom: insets.bottom + 110,
                },
                frameStyle,
              ]}>
              <View style={styles.handleTrack}>
                <View style={styles.handle} />
              </View>

              <View
                style={[
                  styles.frame,
                  {
                    backgroundColor: theme.isDark ? '#14161E' : '#F7F8FA',
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.12)'
                      : 'rgba(0,0,0,0.06)',
                    ...theme.shadows.md,
                  },
                ]}>
                <PagerView
                  style={styles.pager}
                  initialPage={Math.max(0, index)}
                  key={`pager-${photos.map(p => p.id).join('-')}`}
                  onPageSelected={e => {
                    const next = e.nativeEvent.position;
                    setPage(next);
                    onIndexChange?.(next);
                  }}>
                  {photos.map(photo => (
                    <View key={photo.id} style={styles.page}>
                      <Image
                        source={{ uri: photo.uri }}
                        style={styles.image}
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                </PagerView>
              </View>

              {photos.length > 1 ? (
                <View style={styles.dots}>
                  {photos.map((photo, i) => (
                    <View
                      key={photo.id}
                      style={[
                        styles.dot,
                        {
                          backgroundColor:
                            i === page
                              ? theme.colors.primary
                              : 'rgba(255,255,255,0.35)',
                          width: i === page ? 18 : 7,
                        },
                      ]}
                    />
                  ))}
                </View>
              ) : null}

              <Text style={styles.counter}>
                {photos.length > 0 ? `${page + 1}/${photos.length}` : ''}
              </Text>
              <Text style={styles.hint}>{hint}</Text>
            </Animated.View>
          </GestureDetector>

          <Animated.View
            style={[
              styles.actions,
              { paddingBottom: Math.max(insets.bottom, 16) },
              actionsStyle,
            ]}>
            {editable && current ? (
              <Pressable
                onPress={() => onDelete?.(current)}
                disabled={busy}
                style={({ pressed }) => [
                  styles.btn,
                  {
                    backgroundColor: theme.colors.danger,
                    opacity: pressed || busy ? 0.85 : 1,
                  },
                ]}>
                <Text style={styles.btnGlyph}>⌫</Text>
                <Text style={styles.btnLabel}>{t('profile.delete_photo')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={close}
              style={({ pressed }) => [
                styles.btn,
                styles.btnGhost,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(255,255,255,0.92)',
                  borderColor: theme.isDark
                    ? 'rgba(255,255,255,0.18)'
                    : 'rgba(0,0,0,0.08)',
                  opacity: pressed ? 0.88 : 1,
                },
              ]}>
              <Text
                style={[
                  styles.btnLabel,
                  { color: theme.isDark ? '#FFF' : '#111' },
                ]}>
                {t('common.close')}
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: {
    flex: 1,
    justifyContent: 'center',
  },
  frameWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: FRAME_PAD,
    gap: 10,
  },
  handleTrack: {
    alignItems: 'center',
    marginBottom: 4,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  frame: {
    width: '100%',
    aspectRatio: 3 / 4,
    maxHeight: SCREEN_H * 0.62,
    borderRadius: FRAME_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 10,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
  counter: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  hint: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
  },
  btnGhost: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  btnGlyph: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 1,
  },
  btnLabel: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default PhotoViewerModal;
