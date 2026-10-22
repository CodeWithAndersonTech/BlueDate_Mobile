import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  EmptyState,
  FigmaButton,
  FigmaIcon,
  FigmaSpinner,
  Screen,
  SectionHeader,
  Typography,
  UserListItem,
} from '../../components';
import {
  displayName,
  FriendshipRelation,
  getFriendshipStatus,
  searchUsers,
  sendFriendRequest,
  SocialUser,
  withResolvedAvatar,
} from '../../api';
import { useLocale, userFacingError } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { useScreenBottomPad } from '../../navigation/tabBarLayout';
import { useLockTabSwipe } from '../../navigation/useLockTabSwipe';
import { FriendsStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { openFriendProfile } from '../../services/profile/visitCache';

type Props = NativeStackScreenProps<FriendsStackParamList, 'SearchUsers'>;

type RowState = {
  relation: number;
  friendshipId?: number | null;
  busy?: boolean;
};

export function SearchUsersScreen({ navigation }: Props) {
  const { t } = useLocale();
  const theme = useTheme();
  useLockTabSwipe();
  const bottomPad = useScreenBottomPad(24);
  const { userId, accessToken } = useAuth();
  const [query, setQuery] = useState('');
  const searchRef = useRef<TextInput>(null);
  const [directory, setDirectory] = useState<SocialUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [rowState, setRowState] = useState<Record<number, RowState>>({});

  const loadDirectory = useCallback(
    async (q: string) => {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await searchUsers(userId, q.trim(), 30, accessToken);
        const items = res.Items ?? res.items ?? [];
        setDirectory(await Promise.all(items.map(withResolvedAvatar)));

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
        userFacingError(error, t, 'user_profile.action_error'),
      );
    }
  };

  const renderRight = (user: SocialUser) => {
    const state = rowState[user.UserId];
    const relation = state?.relation ?? FriendshipRelation.None;
    const busy = state?.busy;

    if (relation === FriendshipRelation.Friends) {
      return <FigmaButton label={t('friends.added')} tone="soft" />;
    }
    if (relation === FriendshipRelation.PendingOutgoing) {
      return <FigmaButton label={t('friends.pending')} tone="soft" />;
    }
    if (relation === FriendshipRelation.PendingIncoming) {
      return (
        <FigmaButton
          label={t('user_profile.accept_request')}
          onPress={() =>
            navigation.navigate('UserProfile', {
              userId: String(user.UserId),
            })
          }
        />
      );
    }

    return (
      <FigmaButton
        label={t('friends.add')}
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
      onPress={() => {
        openFriendProfile(u, accessToken, FriendshipRelation.None);
        navigation.navigate('UserProfile', { userId: String(u.UserId) });
      }}
      right={renderRight(u)}
    />
  );

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}>
          <View style={styles.backIcon}>
            <FigmaIcon name="arrowRight" size={15} color={theme.colors.text} />
          </View>
        </Pressable>
        <Typography variant="title" style={styles.headerTitle}>
          {t('friends.search_title')}
        </Typography>
        <Pressable
          onPress={() => searchRef.current?.focus()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('friends.search_placeholder')}>
          <FigmaIcon name="searchNormal" size={24} />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <View
          style={[styles.search, { backgroundColor: theme.colors.surfaceAlt }]}>
          <TextInput
            ref={searchRef}
            placeholder={t('friends.search_placeholder')}
            placeholderTextColor={theme.colors.textMuted}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            value={query}
            onChangeText={setQuery}
            style={[
              styles.searchInput,
              theme.typography.variants.callout,
              { color: theme.colors.text },
            ]}
          />
          <FigmaIcon name="searchNormal" size={24} />
        </View>
      </View>

      {loading ? (
        <FigmaSpinner fill />
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
                figmaIcon="searchNormal"
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
              figmaIcon="searchNormal"
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  backIcon: {
    transform: [{ rotate: '180deg' }],
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: { paddingHorizontal: 10, paddingVertical: 8 },
  search: {
    height: 46,
    borderRadius: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    padding: 0,
  },
  content: { paddingHorizontal: 10, gap: 4 },
  suggest: { gap: 8 },
});

export default SearchUsersScreen;
