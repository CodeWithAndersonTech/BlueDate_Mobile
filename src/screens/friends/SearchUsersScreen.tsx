import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  EmptyState,
  Header,
  Input,
  SectionHeader,
  UserListItem,
} from '../../components';
import { Screen } from '../../components';
import { FriendsStackParamList } from '../../navigation/types';
import { friends, nearbyUsers } from '../../utils';

type Props = NativeStackScreenProps<FriendsStackParamList, 'SearchUsers'>;

const DIRECTORY = [
  ...friends.map(f => ({ id: f.id, name: f.name, username: f.username, avatar: f.avatar, premium: f.premium, online: f.online })),
  ...nearbyUsers.map(n => ({ id: n.id, name: n.name, username: `@${n.name.toLowerCase()}`, avatar: n.photo, premium: n.premium, online: n.online })),
];

export function SearchUsersScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return DIRECTORY.filter(
      u => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <Screen edges={['top']}>
      <Header onBack={() => navigation.goBack()} title="Kullanıcı Ara" />

      <View style={styles.searchWrap}>
        <Input
          placeholder="İsim veya kullanıcı adı"
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
          <View style={styles.suggest}>
            <SectionHeader title="Önerilenler" />
            {DIRECTORY.slice(0, 5).map(u => (
              <UserListItem
                key={u.id}
                name={u.name}
                subtitle={u.username}
                avatarUri={u.avatar}
                online={u.online}
                premium={u.premium}
                right={<Button label="Ekle" size="sm" fullWidth={false} leftIcon="user-plus" onPress={() => {}} />}
              />
            ))}
          </View>
        ) : results.length === 0 ? (
          <EmptyState
            icon="search"
            title="Sonuç bulunamadı"
            description={`"${query}" için eşleşen kullanıcı yok.`}
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
              right={<Button label="Ekle" size="sm" fullWidth={false} leftIcon="user-plus" onPress={() => {}} />}
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
