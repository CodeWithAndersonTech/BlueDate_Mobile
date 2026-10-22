import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { AppNotification, notificationActorName } from '../../api/notifications';
import { FigmaIcon, Typography } from '../../components';
import { useLocale } from '../../i18n';
import { useTheme } from '../../theme';
import { notificationMeta } from './notificationMeta';

type RowProps = {
  item: AppNotification;
  onPress: (item: AppNotification) => void;
  highlighted?: boolean;
};

function CtaCopy({ template, cta }: { template: string; cta: string }) {
  const parts = template.split('{cta}');
  return (
    <Typography variant="caption">
      {parts[0]}
      <Typography variant="caption" weight="600" color="plusCta">
        {cta}
      </Typography>
      {parts[1] ?? ''}
    </Typography>
  );
}

function ActorCopy({ name, rest }: { name: string; rest: string }) {
  if (!name) {
    return (
      <Typography variant="caption" numberOfLines={2}>
        {rest}
      </Typography>
    );
  }
  return (
    <Typography variant="caption" numberOfLines={2}>
      <Typography variant="caption" weight="600">
        {name}
      </Typography>
      {rest ? ` ${rest}` : ''}
    </Typography>
  );
}

function Face({ uri, name }: { uri?: string | null; name: string }) {
  const theme = useTheme();
  const letter = name.trim().charAt(0).toLocaleUpperCase('tr-TR') || '?';
  return (
    <View
      style={[
        styles.peopleWrap,
        { backgroundColor: theme.colors.surfaceAlt, overflow: 'hidden' },
      ]}>
      {uri ? (
        <Image
          source={{ uri }}
          fadeDuration={0}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <Typography variant="caption" weight="600">
          {letter}
        </Typography>
      )}
    </View>
  );
}

function Chevron({ size }: { size: number }) {
  const theme = useTheme();
  return (
    <FigmaIcon name="arrowRight" size={size} color={theme.colors.textMuted} />
  );
}

function NotificationRowInner({ item, onPress, highlighted = false }: RowProps) {
  const theme = useTheme();
  const { t } = useLocale();
  const meta = notificationMeta(item.type);
  const name = notificationActorName(item.actor);
  const labelKey =
    item.type === 'treat_request' && item.body
      ? 'notif.type.treat_request_item'
      : meta.labelKey;
  const rest = t(labelKey)
    .replace('{name}', '')
    .replace('{item}', item.body ?? '')
    .trim();

  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        highlighted ? { backgroundColor: theme.colors.plusSoft } : null,
        pressed ? { opacity: 0.92 } : null,
      ]}>
      <Face uri={item.actor?.profileImage} name={name || '?'} />
      <View style={styles.texts}>
        <ActorCopy name={name} rest={rest} />
      </View>
      <Chevron size={highlighted ? 24 : 20} />
    </Pressable>
  );
}

export const NotificationRow = React.memo(NotificationRowInner);

type TeaserProps = {
  count: number;
  faces: string[];
  onPress: () => void;
};

function VisitorsTeaserInner({ count, faces, onPress }: TeaserProps) {
  const theme = useTheme();
  const { t } = useLocale();
  const shown = faces.slice(0, 3);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('notif.upgrade_cta')}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.colors.plusSoft, opacity: pressed ? 0.92 : 1 },
      ]}>
      <View style={styles.stack}>
        {shown.length > 0 ? (
          shown.map((uri, i) => (
            <Image
              key={`${uri}-${i}`}
              source={{ uri }}
              fadeDuration={0}
              blurRadius={i === shown.length - 1 ? 2 : 0}
              style={[
                styles.stackFace,
                {
                  marginLeft: i === 0 ? 0 : -30,
                  borderColor: theme.colors.background,
                  zIndex: shown.length - i,
                },
              ]}
            />
          ))
        ) : (
          <View
            style={[
              styles.peopleWrap,
              { backgroundColor: theme.colors.plusIconSoft },
            ]}>
            <FigmaIcon name="people" size={22} />
          </View>
        )}
      </View>
      <View style={styles.texts}>
        <CtaCopy
          template={t('notif.visitors_week').replace('{count}', String(count))}
          cta={t('notif.upgrade_cta')}
        />
      </View>
      <Chevron size={24} />
    </Pressable>
  );
}

export const VisitorsTeaser = React.memo(VisitorsTeaserInner);

function PremiumVisitCtaInner({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  const { t } = useLocale();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('notif.upgrade_cta')}
      style={({ pressed }) => [styles.row, pressed ? { opacity: 0.92 } : null]}>
      <View
        style={[
          styles.peopleWrap,
          { backgroundColor: theme.colors.plusIconSoft },
        ]}>
        <FigmaIcon name="people" size={22} />
      </View>
      <View style={styles.texts}>
        <CtaCopy template={t('notif.visit_locked')} cta={t('notif.upgrade_cta')} />
      </View>
      <Chevron size={20} />
    </Pressable>
  );
}

export const PremiumVisitCta = React.memo(PremiumVisitCtaInner);

export const notifRowStyles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
    paddingHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 15,
    width: '100%',
  },
  texts: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  stack: {
    width: 44,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  stackFace: {
    width: 35,
    height: 35,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  peopleWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
