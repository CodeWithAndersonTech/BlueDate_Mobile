import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  EmptyState,
  FigmaButton,
  FigmaSpinner,
  Header,
  SheetModal,
  Typography,
  useScreenTopPad,
} from '../../components';
import { useLocale, userFacingError } from '../../i18n';
import { useNotifications } from '../../navigation/NotificationsContext';
import { useScreenBottomPad } from '../../navigation/tabBarLayout';
import { AppStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import {
  NotificationRow,
  PremiumVisitCta,
  VisitorsTeaser,
  notifRowStyles,
} from './NotificationRow';
import { useOpenNotification } from './notificationMeta';

type Props = NativeStackScreenProps<AppStackParamList, 'Notifications'>;

export function NotificationsScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const topPad = useScreenTopPad();
  const bottomPad = useScreenBottomPad(24);
  const {
    items,
    visitorsThisWeek,
    canSeeVisitors,
    unreadCount,
    initialLoading,
    refresh,
    markAllRead,
    clearAll,
  } = useNotifications();
  const openNotification = useOpenNotification();
  const [refreshing, setRefreshing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const visibleItems = useMemo(
    () => (canSeeVisitors ? items : items.filter(item => !item.locked)),
    [items, canSeeVisitors],
  );
  const firstTreatId = useMemo(
    () => visibleItems.find(item => item.type === 'treat_request')?.id,
    [visibleItems],
  );
  const visitorFaces = useMemo(() => {
    const seen = new Set<string>();
    const uris: string[] = [];
    for (const item of items) {
      const uri = item.actor?.profileImage;
      if (!uri || seen.has(uri)) continue;
      seen.add(uri);
      uris.push(uri);
      if (uris.length >= 3) break;
    }
    return uris;
  }, [items]);
  const showVisitorTeaser = visitorsThisWeek > 0 && !canSeeVisitors;
  const showPeopleCta = !canSeeVisitors;
  const empty =
    visibleItems.length === 0 && !showVisitorTeaser && !showPeopleCta;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const goPremium = () => navigation.navigate('Premium');

  const onClearAll = () => {
    setClearError(null);
    setConfirmClear(true);
  };

  const runClearAll = async () => {
    setClearing(true);
    setClearError(null);
    try {
      await clearAll();
      setConfirmClear(false);
    } catch (error) {
      setClearError(userFacingError(error, t, 'notifications.clear_all_error'));
    } finally {
      setClearing(false);
    }
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.colors.background, paddingTop: topPad },
      ]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <Header
        title={t('notifications.title')}
        onBack={() => navigation.goBack()}
        backAccessibilityLabel={t('common.back')}
        actions={[
          ...(unreadCount > 0
            ? [
                {
                  icon: 'check' as const,
                  onPress: () => {
                    void markAllRead();
                  },
                  accessibilityLabel: t('notifications.mark_all_read'),
                },
              ]
            : []),
          ...(items.length > 0
            ? [
                {
                  icon: 'trash' as const,
                  onPress: onClearAll,
                  accessibilityLabel: t('notifications.clear_all'),
                  color: theme.colors.danger,
                },
              ]
            : []),
        ]}
      />

      {initialLoading && items.length === 0 ? (
        <FigmaSpinner fill />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            empty ? styles.emptyContent : null,
            { paddingBottom: bottomPad },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.plusCta}
            />
          }>
          {showVisitorTeaser ? (
            <>
              <VisitorsTeaser
                count={visitorsThisWeek}
                faces={visitorFaces}
                onPress={goPremium}
              />
              <View
                style={[
                  notifRowStyles.divider,
                  { backgroundColor: theme.colors.border },
                ]}
              />
            </>
          ) : null}

          {empty ? (
            <EmptyState
              figmaIcon="bell"
              title={t('notifications.empty_title')}
              description={t('notifications.empty_desc')}
              style={styles.empty}
            />
          ) : (
            visibleItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <NotificationRow
                  item={item}
                  onPress={openNotification}
                  highlighted={item.id === firstTreatId}
                />
                <View
                  style={[
                    notifRowStyles.divider,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
                {showPeopleCta &&
                index === Math.min(2, visibleItems.length - 1) ? (
                  <>
                    <PremiumVisitCta onPress={goPremium} />
                    <View
                      style={[
                        notifRowStyles.divider,
                        { backgroundColor: theme.colors.border },
                      ]}
                    />
                  </>
                ) : null}
              </React.Fragment>
            ))
          )}

          {showPeopleCta && visibleItems.length === 0 ? (
            <>
              <PremiumVisitCta onPress={goPremium} />
              <View
                style={[
                  notifRowStyles.divider,
                  { backgroundColor: theme.colors.border },
                ]}
              />
            </>
          ) : null}
        </ScrollView>
      )}

      <SheetModal
        visible={confirmClear}
        title={t('notifications.clear_all_title')}
        onClose={() => {
          if (!clearing) {
            setConfirmClear(false);
            setClearError(null);
          }
        }}
        dismissable={!clearing}>
        <Typography variant="callout" color="textMuted">
          {t('notifications.clear_all_desc')}
        </Typography>
        {clearError ? (
          <Typography variant="caption" tint={theme.colors.danger}>
            {clearError}
          </Typography>
        ) : null}
        <FigmaButton
          label={t('notifications.clear_all')}
          tone="danger"
          size="md"
          fullWidth
          loading={clearing}
          onPress={() => {
            void runClearAll();
          }}
        />
        <FigmaButton
          label={t('common.close')}
          tone="ghost"
          size="md"
          fullWidth
          disabled={clearing}
          onPress={() => {
            setConfirmClear(false);
            setClearError(null);
          }}
        />
      </SheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 10,
    paddingTop: 8,
    gap: 4,
  },
  emptyContent: {
    flexGrow: 1,
    paddingTop: 40,
  },
  empty: {
    paddingHorizontal: 24,
  },
});

export default NotificationsScreen;
