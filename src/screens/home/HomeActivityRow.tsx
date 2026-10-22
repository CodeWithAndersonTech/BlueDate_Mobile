import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { formatRelativeTime } from '../../api';
import {
  AppNotification,
  notificationActorName,
} from '../../api/notifications';
import { FigmaIcon, FigmaSvgName, Typography } from '../../components';
import { useLocale } from '../../i18n';
import { useTheme } from '../../theme';
import { notificationMeta } from '../notifications/notificationMeta';

type Props = {
  item: AppNotification;
  onPress: (item: AppNotification) => void;
};

function activityVisual(type: string): {
  icon: FigmaSvgName;
  bg?: string;
  full?: boolean;
} {
  if (type.startsWith('treat')) {
    return { icon: 'gift', bg: 'plusCta' };
  }
  if (type.startsWith('friend')) {
    return { icon: 'activityFriends', bg: 'info' };
  }
  if (type === 'like' || type === 'match') {
    return { icon: 'activityLike', full: true };
  }
  return { icon: 'bell', bg: 'plusCta' };
}

export function HomeActivityRow({ item, onPress }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const meta = notificationMeta(item.type);
  const name = notificationActorName(item.actor);
  const title = item.locked
    ? t('notif.visit_locked').replace('{cta}', t('notif.upgrade_cta'))
    : t(meta.labelKey)
        .replace('{name}', name)
        .replace('{item}', item.body ?? '');
  const visual = activityVisual(item.type);
  const bg =
    visual.bg === 'info' ? theme.colors.info : theme.colors.plusCta;

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={styles.row}
      accessibilityRole="button">
      {visual.full ? (
        <FigmaIcon name={visual.icon} size={40} />
      ) : (
        <View style={[styles.iconWrap, { backgroundColor: bg }]}>
          <FigmaIcon name={visual.icon} size={20} color={theme.colors.white} />
        </View>
      )}
      <View style={styles.texts}>
        <Typography variant="callout" numberOfLines={2}>
          {title}
        </Typography>
        <Typography variant="caption" color="textMuted">
          {formatRelativeTime(item.createdDate)}
        </Typography>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
});
