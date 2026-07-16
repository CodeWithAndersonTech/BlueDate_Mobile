import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Header,
  IconButton,
  Input,
  Screen,
  UserListItem,
} from '../../components';
import { useLocale } from '../../i18n';
import { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { friends } from '../../utils';

type Props = NativeStackScreenProps<ProfileStackParamList, 'FriendsList'>;

export function FriendsListScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(
      f => f.name.toLowerCase().includes(q) || f.username.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <Screen edges={['top']}>
      <Header
        onBack={() => navigation.goBack()}
        title={t('profile.friends')}
        subtitle={`${friends.length} ${t('friends.people')}`}
      />
      <View style={styles.searchWrap}>
        <Input
          placeholder={t('friends.search')}
          leftIcon="search"
          autoCapitalize="none"
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        {list.map(f => (
          <UserListItem
            key={f.id}
            name={f.name}
            subtitle={
              f.online
                ? t('profile.online')
                : `${f.lastActive ?? t('profile.offline')} · ${f.mutualFriends ?? 0} ${t('friends.mutual')}`
            }
            avatarUri={f.avatar}
            online={f.online}
            premium={f.premium}
            onPress={() => {}}
            right={<IconButton name="message" size={18} color={theme.colors.primary} onPress={() => {}} />}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: 20, paddingVertical: 8 },
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 4 },
});

export default FriendsListScreen;
