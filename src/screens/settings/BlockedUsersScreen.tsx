import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  EmptyState,
  Header,
  Screen,
  UserListItem,
} from '../../components';
import {
  getBlockedUsers,
  unblockUser,
  normalizeBlockedUser,
} from '../../api/safety';
import { useLocale, userFacingError } from '../../i18n';
import { useScreenBottomPad } from '../../navigation/tabBarLayout';
import {
  HomeStackParamList,
  ProfileStackParamList,
} from '../../navigation/types';
import { useLockTabSwipe } from '../../navigation/useLockTabSwipe';

type Props =
  | NativeStackScreenProps<ProfileStackParamList, 'BlockedUsers'>
  | NativeStackScreenProps<HomeStackParamList, 'BlockedUsers'>;

export function BlockedUsersScreen({ navigation }: Props) {
  const openProfile = (userId: number) => {
    const nav = navigation as NativeStackScreenProps<
      ProfileStackParamList,
      'BlockedUsers'
    >['navigation'];
    nav.navigate('UserProfile', { userId: String(userId) });
  };
  useLockTabSwipe();
  const { t } = useLocale();
  const bottomPad = useScreenBottomPad(24);
  const [items, setItems] = useState<
    ReturnType<typeof normalizeBlockedUser>[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await getBlockedUsers();
      setItems(next);
    } catch (error) {
      Alert.alert(t('safety.blocked_title'), userFacingError(error, t, 'safety.load_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onUnblock = (userId: number) => {
    Alert.alert(t('safety.unblock'), t('safety.unblock_confirm'), [
      { text: t('settings.cancel'), style: 'cancel' },
      {
        text: t('safety.unblock'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusyId(userId);
            try {
              await unblockUser(userId);
              setItems(prev => prev.filter(item => item.UserId !== userId));
            } catch (error) {
              Alert.alert(
                t('safety.unblock'),
                userFacingError(error, t, 'safety.unblock_error'),
              );
            } finally {
              setBusyId(null);
            }
          })();
        },
      },
    ]);
  };

  return (
    <Screen edges={['top']}>
      <Header
        title={t('safety.blocked_title')}
        onBack={() => navigation.goBack()}
        backAccessibilityLabel={t('common.back')}
        subtitle={
          loading ? undefined : `${items.length} ${t('safety.blocked_count')}`
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPad, flexGrow: 1 },
        ]}>
        {!loading && items.length === 0 ? (
          <EmptyState
            fill
            icon="shield"
            title={t('safety.blocked_empty_title')}
            description={t('safety.blocked_empty_desc')}
          />
        ) : (
          items.map(item => {
            const name =
              `${item.FirstName} ${item.LastName}`.trim() || item.Username;
            return (
              <UserListItem
                key={item.UserId}
                name={name}
                subtitle={
                  item.Username
                    ? item.Username.startsWith('@')
                      ? item.Username
                      : `@${item.Username}`
                    : undefined
                }
                avatarUri={item.ProfileImage ?? undefined}
                onPress={() => openProfile(item.UserId)}
                right={
                  <View style={styles.right}>
                    <Button
                      label={t('safety.unblock')}
                      variant="ghost"
                      size="sm"
                      loading={busyId === item.UserId}
                      disabled={busyId === item.UserId}
                      onPress={() => onUnblock(item.UserId)}
                    />
                  </View>
                }
              />
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 4,
  },
  right: {
    marginLeft: 8,
  },
});
