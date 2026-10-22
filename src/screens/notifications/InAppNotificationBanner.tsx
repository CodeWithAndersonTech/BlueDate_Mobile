import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppNotification,
  notificationActorName,
} from '../../api/notifications';
import { FigmaIcon, Typography } from '../../components';
import { useLocale } from '../../i18n';
import { useNotifications } from '../../navigation/NotificationsContext';
import { useTheme } from '../../theme';
import { afterUiSettled } from '../../utils/afterUiSettled';
import { notificationMeta, useOpenNotification } from './notificationMeta';

const SHOW_MS = 4200;
const HIDE_Y = -180;

function BannerCard({ item }: { item: AppNotification }) {
  const theme = useTheme();
  const { t } = useLocale();
  const meta = notificationMeta(item.type);
  const name = notificationActorName(item.actor);
  const labelKey =
    item.type === 'treat_request' && item.body
      ? 'notif.type.treat_request_item'
      : meta.labelKey;
  const title = item.locked
    ? t('notif.visit_locked').replace('{cta}', t('notif.upgrade_cta'))
    : t(labelKey)
        .replace('{name}', name)
        .replace('{item}', item.body ?? '');
  const letter = name.trim().charAt(0).toLocaleUpperCase('tr-TR');

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.black,
        },
      ]}>
      <View
        style={[
          styles.face,
          { backgroundColor: theme.colors.surfaceAlt, overflow: 'hidden' },
        ]}>
        {item.actor?.profileImage ? (
          <Image
            source={{ uri: item.actor.profileImage }}
            fadeDuration={0}
            style={StyleSheet.absoluteFill}
          />
        ) : letter ? (
          <Typography variant="caption" weight="600">
            {letter}
          </Typography>
        ) : (
          <FigmaIcon name="bell" size={18} color={theme.colors.plusCta} />
        )}
      </View>
      <View style={styles.copy}>
        <Typography variant="caption" color="textMuted" numberOfLines={1}>
          {t('notifications.title')}
        </Typography>
        <Typography variant="callout" weight="600" numberOfLines={2}>
          {title}
        </Typography>
      </View>
    </View>
  );
}

export function InAppNotificationBanner() {
  const insets = useSafeAreaInsets();
  const { toast, dismissToast } = useNotifications();
  const openNotification = useOpenNotification();
  const translateY = useSharedValue(HIDE_Y);
  const dragStart = useSharedValue(0);
  const [item, setItem] = useState<AppNotification | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closing = useRef(false);

  const clearTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const finishClose = useCallback(() => {
    closing.current = false;
    dismissToast();
    setItem(null);
  }, [dismissToast]);

  const animateClosed = useCallback(() => {
    if (closing.current) {
      return;
    }
    closing.current = true;
    clearTimer();
    translateY.value = withTiming(HIDE_Y, { duration: 160 }, finished => {
      if (finished) {
        runOnJS(finishClose)();
      } else {
        closing.current = false;
      }
    });
  }, [clearTimer, finishClose, translateY]);

  const restartTimer = useCallback(() => {
    clearTimer();
    hideTimer.current = setTimeout(() => {
      animateClosed();
    }, SHOW_MS);
  }, [animateClosed, clearTimer]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    closing.current = false;
    setItem(toast);
    translateY.value = withTiming(0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
    restartTimer();
    return clearTimer;
  }, [toast, restartTimer, clearTimer, translateY]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-10, 28])
        .failOffsetX([-28, 28])
        .onStart(() => {
          dragStart.value = translateY.value;
          runOnJS(clearTimer)();
        })
        .onUpdate(event => {
          const next = dragStart.value + event.translationY;
          translateY.value = next > 12 ? 12 : next;
        })
        .onEnd(event => {
          if (event.translationY < -36 || event.velocityY < -700) {
            translateY.value = withTiming(HIDE_Y, { duration: 160 }, finished => {
              if (finished) {
                runOnJS(finishClose)();
              }
            });
            return;
          }
          translateY.value = withTiming(0, {
            duration: 180,
            easing: Easing.out(Easing.cubic),
          });
          runOnJS(restartTimer)();
        }),
    [clearTimer, dragStart, finishClose, restartTimer, translateY],
  );

  const slide = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!item) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.anchor,
            { paddingTop: Math.max(insets.top, 8) + 6 },
            slide,
          ]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              const opened = item;
              animateClosed();
              afterUiSettled(() => {
                openNotification(opened);
              });
            }}>
            <BannerCard item={item} />
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
    zIndex: 50,
    elevation: 50,
  },
  anchor: {
    paddingHorizontal: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  face: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
