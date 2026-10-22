import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FigmaSpinner } from '../../components/FigmaUi';
import { SafeOverlay } from '../../components/SafeOverlay';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
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
import { resolveMediaUrl } from '../../api/photos';
import { useLocale } from '../../i18n';
import { useTheme } from '../../theme';
import type { ProfilePhoto } from '../../services/photos/photoStore';

const WIN = Dimensions.get('window');
const SCREEN_H = WIN.height;
const DISMISS_Y = 140;
const FRAME_PAD = 20;
const FRAME_RADIUS = 22;
const FRAME_W = WIN.width - FRAME_PAD * 2;
const FRAME_H = Math.min(FRAME_W * (4 / 3), SCREEN_H * 0.62);
/** Reserved space under the photo frame for the action row + labels. */
const ACTION_AREA_HEIGHT = 110;

type Props = {
  photos: ProfilePhoto[];
  index: number;
  editable?: boolean;
  busy?: boolean;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  onDelete?: (photo: ProfilePhoto) => void;
};

function ViewerImage({
  uri,
  onReadyChange,
}: {
  uri: string;
  onReadyChange?: (ready: boolean) => void;
}) {
  const theme = useTheme();
  const [src, setSrc] = useState(uri);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    onReadyChange?.(false);
    setReady(false);
    if (!uri) {
      onReadyChange?.(true);
      setReady(true);
      return;
    }
    void resolveMediaUrl(uri)
      .then(resolved => {
        if (cancelled) {
          return;
        }
        if (resolved) {
          setSrc(resolved);
          return;
        }
        onReadyChange?.(true);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          onReadyChange?.(true);
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [uri, onReadyChange]);

  const markReady = () => {
    setReady(true);
    onReadyChange?.(true);
  };

  return (
    <View style={styles.image}>
      {src ? (
        <Image
          source={{ uri: src }}
          style={styles.imageFill}
          resizeMode="cover"
          fadeDuration={0}
          onLoad={markReady}
          onLoadEnd={markReady}
          onError={markReady}
        />
      ) : null}
      {!ready ? (
        <View
          style={[
            styles.imageGate,
            { backgroundColor: theme.colors.black, opacity: 0.45 },
          ]}
          pointerEvents="none">
          <FigmaSpinner size={40} />
        </View>
      ) : null}
    </View>
  );
}

class ViewerBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return null;
    }
    return this.props.children;
  }
}

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
  const [imageReady, setImageReady] = useState(false);
  const pageRef = useRef(page);
  pageRef.current = page;

  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const backdrop = useSharedValue(0);
  const scaleIn = useSharedValue(0.94);

  // Keep page in sync while open (e.g. parent index from swipe).
  useEffect(() => {
    if (!visible || photos.length === 0) {
      return;
    }
    const next = Math.min(Math.max(0, index), photos.length - 1);
    if (next !== pageRef.current) {
      setImageReady(false);
    }
    setPage(next);
    photos.forEach(photo => {
      if (photo.uri) {
        void Image.prefetch(photo.uri).catch(() => undefined);
      }
    });
  }, [visible, index, photos]);

  // Open / hide animation — only tied to `visible` so swipe index updates
  // don't replay the enter animation.
  useEffect(() => {
    if (visible) {
      translateY.value = 0;
      scaleIn.value = 0.94;
      backdrop.value = withTiming(1, { duration: 220 });
      scaleIn.value = withSpring(1, { damping: 18, stiffness: 220 });
    } else {
      backdrop.value = 0;
      // Do NOT reset translateY/scaleIn here. Dismiss already moved the
      // photo off-screen; snapping back to 0 flashes it for a frame
      // before the Modal finishes hiding.
    }
  }, [visible, backdrop, scaleIn, translateY]);

  const close = useCallback(() => {
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
  }, [backdrop, onClose, translateY]);

  const current = photos[page] ?? null;

  const goPage = useCallback(
    (next: number) => {
      if (photos.length <= 1) {
        return;
      }
      const clamped = Math.min(Math.max(0, next), photos.length - 1);
      if (clamped === pageRef.current) {
        return;
      }
      translateX.value = 0;
      setImageReady(false);
      setPage(clamped);
      onIndexChange?.(clamped);
    },
    [onIndexChange, photos.length, translateX],
  );

  const goBy = useCallback(
    (delta: number) => {
      goPage(pageRef.current + delta);
    },
    [goPage],
  );

  const hint = useMemo(() => {
    if (photos.length > 1) {
      return t('profile.photo_viewer_hint_swipe');
    }
    return t('profile.photo_viewer_hint');
  }, [photos.length, t]);

  const dismissPan = Gesture.Pan()
    .enabled(imageReady)
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

  const pagePan = Gesture.Pan()
    .enabled(imageReady && photos.length > 1)
    .activeOffsetX([-16, 16])
    .failOffsetY([-24, 24])
    .onUpdate(e => {
      translateX.value = e.translationX;
    })
    .onEnd(e => {
      const goNext = e.translationX < -56 || e.velocityX < -650;
      const goPrev = e.translationX > 56 || e.velocityX > 650;
      translateX.value = withTiming(0, { duration: 160 });
      if (goNext) {
        runOnJS(goBy)(1);
      } else if (goPrev) {
        runOnJS(goBy)(-1);
      }
    });

  const pan = Gesture.Race(pagePan, dismissPan);

  const rootStyle = useAnimatedStyle(() => ({
    opacity:
      0.72 *
      backdrop.value *
      interpolate(
        translateY.value,
        [0, DISMISS_Y * 1.6],
        [1, 0.35],
        Extrapolation.CLAMP,
      ),
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
        { translateX: translateX.value * 0.35 },
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
    <ViewerBoundary>
    <SafeOverlay visible={visible} onRequestClose={close}>
      <GestureHandlerRootView style={styles.flex}>
        <View style={styles.root}>
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: theme.colors.black },
              rootStyle,
            ]}
          />
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            disabled={!imageReady}
          />

          <GestureDetector gesture={pan}>
            <Animated.View
              style={[
                styles.frameWrap,
                {
                  paddingTop: insets.top + 28,
                  paddingBottom: insets.bottom + ACTION_AREA_HEIGHT,
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
                {current ? (
                  <ViewerImage
                    uri={current.uri}
                    onReadyChange={setImageReady}
                  />
                ) : (
                  <View style={styles.imageGate}>
                    <FigmaSpinner size={28} />
                  </View>
                )}
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
                              ? theme.colors.plusCta
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
                disabled={busy || !imageReady}
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
              disabled={!imageReady}
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

          {!imageReady ? (
            <View style={styles.loadLock} pointerEvents="auto" />
          ) : null}
        </View>
      </GestureHandlerRootView>
    </SafeOverlay>
    </ViewerBoundary>
  );
}

const styles = StyleSheet.create({
  flex: {
    width: WIN.width,
    height: WIN.height,
  },
  root: {
    width: WIN.width,
    height: WIN.height,
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
    width: FRAME_W,
    height: FRAME_H,
    borderRadius: FRAME_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFill: {
    width: '100%',
    height: '100%',
  },
  imageGate: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadLock: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  pageHitLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '28%',
  },
  pageHitRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '28%',
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
