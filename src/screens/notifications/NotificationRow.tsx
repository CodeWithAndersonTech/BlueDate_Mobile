import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { images } from '../../assets';
import { formatRelativeTime } from '../../api';
import { AppNotification, notificationActorName } from '../../api/notifications';
import { Avatar, Icon, Typography } from '../../components';
import { useLocale } from '../../i18n';
import { useTheme } from '../../theme';
import { notificationMeta } from './notificationMeta';

type Props = {
  item: AppNotification;
  onPress: (item: AppNotification) => void;
  /** Home preview hides the unread tint. */
  compact?: boolean;
};

function NotificationRowInner({ item, onPress, compact = false }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const meta = notificationMeta(item.type);
  const name = notificationActorName(item.actor);
  const avatarSize = theme.components.avatar.sizes.md;

  const text = item.locked
    ? t('notif.visit_locked')
    : t(meta.labelKey)
        .replace('{name}', name)
        .replace('{item}', item.body ?? '');
  const preview = item.type === 'message' && item.body ? item.body : null;
  const highlight = item.locked || item.type === 'treat_request';

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed
            ? theme.colors.surfaceAlt
            : highlight
              ? theme.colors.premiumSoft
              : !compact && !item.isRead
                ? theme.colors.primarySoft
                : 'transparent',
        },
      ]}>
      <View style={styles.avatarWrap}>
        {item.locked ? (
          <View
            style={[
              styles.lockedAvatar,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                backgroundColor: theme.colors.surfaceAlt,
              },
            ]}>
            <Image
              source={images.appLogo}
              blurRadius={14}
              fadeDuration={0}
              style={styles.lockedImage}
            />
          </View>
        ) : (
          <Avatar uri={item.actor?.profileImage ?? undefined} name={name || '?'} size="md" />
        )}
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}>
          <Icon name={meta.icon} size={12} color={theme.colors[meta.color]} />
        </View>
      </View>

      <View style={styles.texts}>
        <Typography
          variant={item.isRead ? 'body' : 'bodyStrong'}
          numberOfLines={2}
          style={styles.body}>
          {text}
        </Typography>
        {preview ? (
          <Typography variant="caption" color="textSecondary" numberOfLines={1}>
            {preview}
          </Typography>
        ) : null}
        {item.locked ? (
          <View style={styles.premiumLink}>
            <Icon name="crown" size={12} color={theme.colors.premium} filled />
            <Typography variant="caption" color="premium">
              {t('notif.upgrade_to_see')}
            </Typography>
          </View>
        ) : (
          <Typography variant="caption" color="textMuted">
            {formatRelativeTime(item.createdDate)}
          </Typography>
        )}
      </View>

      {!compact && !item.isRead ? (
        <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
      ) : (
        <View style={styles.unreadSpacer} />
      )}
    </Pressable>
  );
}

export const NotificationRow = React.memo(NotificationRowInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  avatarWrap: { position: 'relative' },
  lockedAvatar: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  lockedImage: { width: '100%', height: '100%' },
  typeBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 3, minWidth: 0 },
  body: { flexShrink: 1 },
  premiumLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  unreadSpacer: { width: 8, height: 8 },
});
