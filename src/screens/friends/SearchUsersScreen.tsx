import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  EmptyState,
  Header,
  Input,
  Screen,
  SectionHeader,
  UserListItem,
} from '../../components';
import {
  displayName,
  FriendshipRelation,
  getFriendshipStatus,
  searchUsers,
  sendFriendRequest,
  SocialUser,
} from '../../api';
import { useLocale } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { useScreenBottomPad } from '../../navigation/tabBarLayout';
import { FriendsStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<FriendsStackParamList, 'SearchUsers'>;

type RowState = {
  relation: number;
  friendshipId?: number | null;
  busy?: boolean;
};

export function SearchUsersScreen({ navigation }: Props) {
  const { t } = useLocale();
  const theme = useTheme();
  const bottomPad = useScreenBottomPad(24);
  const { userId, accessToken } = useAuth();
  const [query, setQuery] = useState('');
  const [directory, setDirectory] = useState<SocialUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [rowState, setRowState] = useState<Record<number, RowState>>({});

  const loadDirectory = useCallback(
    async (q: string) => {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await searchUsers(userId, q.trim(), 30, accessToken);
        const items = res.Items ?? [];
        setDirectory(items);

        const statuses = await Promise.all(
          items.map(async u => {
            try {
              const status = await getFriendshipStatus(
                userId,
                u.UserId,
                accessToken,
              );
              return [
                u.UserId,
                {
                  relation: status.Relation ?? FriendshipRelation.None,
                  friendshipId: status.FriendshipId,
                } satisfies RowState,
              ] as const;
            } catch {
              return [
                u.UserId,
                { relation: FriendshipRelation.None },
              ] as const;
            }
          }),
        );
        setRowState(Object.fromEntries(statuses));
      } catch (error) {
        Alert.alert(
          t('friends.search_title'),
          error instanceof Error
            ? error.message
            : t('user_profile.action_error'),
        );
      } finally {
        setLoading(false);
      }
    },
    [userId, accessToken, t],
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      loadDirectory(query);
    }, query.trim() ? 280 : 0);
    return () => clearTimeout(handle);
  }, [query, loadDirectory]);

  const results = useMemo(() => directory, [directory]);

  const onAdd = async (user: SocialUser) => {
    if (!userId) return;
    setRowState(prev => ({
      ...prev,
      [user.UserId]: { ...prev[user.UserId], busy: true },
    }));
    try {
      await sendFriendRequest(userId, user.UserId, accessToken);
      setRowState(prev => ({
        ...prev,
        [user.UserId]: {
          relation: FriendshipRelation.PendingOutgoing,
          busy: false,
        },
      }));
    } catch (error) {
      setRowState(prev => ({
        ...prev,
        [user.UserId]: { ...prev[user.UserId], busy: false },
      }));
      Alert.alert(
        t('friends.add'),
        error instanceof Error ? error.message : t('user_profile.action_error'),
      );
    }
  };

  const renderRight = (user: SocialUser) => {
    const state = rowState[user.UserId];
    const relation = state?.relation ?? FriendshipRelation.None;
    const busy = state?.busy;

    if (relation === FriendshipRelation.Friends) {
      return (
        <Button
          label={t('friends.added')}
          size="sm"
          variant="outline"
          fullWidth={false}
          disabled
        />
      );
    }
    if (relation === FriendshipRelation.PendingOutgoing) {
      return (
        <Button
          label={t('friends.pending')}
          size="sm"
          variant="outline"
          fullWidth={false}
          disabled
        />
      );
    }
    if (relation === FriendshipRelation.PendingIncoming) {
      return (
        <Button
          label={t('user_profile.accept_request')}
          size="sm"
          fullWidth={false}
          onPress={() =>
            navigation.navigate('UserProfile', {
              userId: String(user.UserId),
            })
          }
        />
      );
    }

    return (
      <Button
        label={t('friends.add')}
        size="sm"
        fullWidth={false}
        leftIcon="user-plus"
        disabled={busy}
        onPress={() => onAdd(user)}
      />
    );
  };

  const renderRow = (u: SocialUser) => (
    <UserListItem
      key={u.UserId}
      name={displayName(u)}
      subtitle={`@${u.Username}`}
      avatarUri={u.ProfileImage ?? undefined}
      premium={u.IsVerified}
      onPress={() =>
        navigation.navigate('UserProfile', { userId: String(u.UserId) })
      }
      right={renderRight(u)}
    />
  );

  return (
    <Screen edges={['top']}>
      <Header
        onBack={() => navigation.goBack()}
        backAccessibilityLabel={t('common.back')}
        title={t('friends.search_title')}
      />

      <View style={styles.searchWrap}>
        <Input
          placeholder={t('friends.search_placeholder')}
          leftIcon="search"
          autoFocus
          autoCapitalize="none"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomPad, flexGrow: 1 },
          ]}>
          {query.trim() === '' ? (
            directory.length === 0 ? (
              <EmptyState
                fill
                icon="search"
                title={t('friends.search_title')}
                description={t('friends.search_placeholder')}
              />
            ) : (
              <View style={styles.suggest}>
                <SectionHeader title={t('friends.suggested')} />
                {directory.slice(0, 8).map(renderRow)}
              </View>
            )
          ) : results.length === 0 ? (
            <EmptyState
              fill
              icon="search"
              title={t('friends.no_results_title')}
              description={t('friends.no_results_desc').replace(
                '{query}',
                query,
              )}
            />
          ) : (
            results.map(renderRow)
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: 20, paddingVertical: 8 },
  content: { paddingHorizontal: 20, gap: 4 },
  suggest: { gap: 8 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default SearchUsersScreen;
