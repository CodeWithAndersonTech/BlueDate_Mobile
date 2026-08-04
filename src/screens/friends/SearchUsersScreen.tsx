import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  EmptyState,
  Header,
  Input,
  Screen,
  SectionHeader,
  UserListItem,
} from '../../components';
import { useLocale } from '../../i18n';
import { FriendsStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FriendsStackParamList, 'SearchUsers'>;

type DirectoryUser = {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  premium?: boolean;
  online?: boolean;
};

export function SearchUsersScreen({ navigation }: Props) {
  const { t } = useLocale();
  const [query, setQuery] = useState('');
  // Real search API will populate this — no mock directory.
  const [directory] = useState<DirectoryUser[]>([]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return directory.filter(
      u =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q),
    );
  }, [directory, query]);

  return (
    <Screen edges={['top']}>
      <Header
        onBack={() => navigation.goBack()}
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        {query.trim() === '' ? (
          directory.length === 0 ? (
            <EmptyState
              icon="search"
              title={t('friends.search_title')}
              description={t('friends.search_placeholder')}
            />
          ) : (
            <View style={styles.suggest}>
              <SectionHeader title={t('friends.suggested')} />
              {directory.slice(0, 5).map(u => (
                <UserListItem
                  key={u.id}
                  name={u.name}
                  subtitle={u.username}
                  avatarUri={u.avatar}
                  online={u.online}
                  premium={u.premium}
                  onPress={() =>
                    navigation.navigate('UserProfile', { userId: u.id })
                  }
                  right={
                    <Button
                      label={t('friends.add')}
                      size="sm"
                      fullWidth={false}
                      leftIcon="user-plus"
                      onPress={() => {}}
                    />
                  }
                />
              ))}
            </View>
          )
        ) : results.length === 0 ? (
          <EmptyState
            icon="search"
            title={t('friends.no_results_title')}
            description={t('friends.no_results_desc').replace(
              '{query}',
              query,
            )}
          />
        ) : (
          results.map(u => (
            <UserListItem
              key={u.id}
              name={u.name}
              subtitle={u.username}
              avatarUri={u.avatar}
              online={u.online}
              premium={u.premium}
              onPress={() =>
                navigation.navigate('UserProfile', { userId: u.id })
              }
              right={
                <Button
                  label={t('friends.add')}
                  size="sm"
                  fullWidth={false}
                  leftIcon="user-plus"
                  onPress={() => {}}
                />
              }
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: 20, paddingVertical: 8 },
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 4 },
  suggest: { gap: 8 },
});

export default SearchUsersScreen;
