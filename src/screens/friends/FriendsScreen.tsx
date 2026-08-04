import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  EmptyState,
  Header,
  IconButton,
  Screen,
  SegmentedControl,
  TabScreenScrollView,
  UserListItem,
} from '../../components';
import { useLocale } from '../../i18n';
import { FriendsStackParamList } from '../../navigation/types';
import { Friend, FriendRequest } from '../../utils';

type Props = NativeStackScreenProps<FriendsStackParamList, 'FriendsMain'>;

type Tab = 'friends' | 'incoming' | 'sent';

export function FriendsScreen({ navigation }: Props) {
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>('friends');
  // Real friends API will populate these — no mock feed.
  const [friends] = useState<Friend[]>([]);
  const [incomingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests] = useState<FriendRequest[]>([]);

  const segments = [
    {
      key: 'friends',
      label: t('friends.tab.friends'),
      badge: friends.length,
    },
    {
      key: 'incoming',
      label: t('friends.tab.incoming'),
      badge: incomingRequests.length,
    },
    {
      key: 'sent',
      label: t('friends.tab.sent'),
      badge: sentRequests.length,
    },
  ];

  return (
    <Screen edges={['top']}>
      <Header
        large
        subtitle={t('friends.subtitle').replace(
          '{count}',
          String(friends.length),
        )}
        title={t('friends.title')}
        actions={[
          { icon: 'search', onPress: () => navigation.navigate('SearchUsers') },
        ]}
      />

      <View style={styles.segmentWrap}>
        <SegmentedControl
          items={segments}
          value={tab}
          onChange={key => setTab(key as Tab)}
        />
      </View>

      <TabScreenScrollView contentContainerStyle={styles.content}>
        {tab === 'friends' &&
          (friends.length === 0 ? (
            <EmptyState
              icon="users"
              title={t('friends.empty_title')}
              description={t('friends.empty_desc')}
            />
          ) : (
            friends.map(f => (
              <UserListItem
                key={f.id}
                name={f.name}
                subtitle={
                  f.online
                    ? t('friends.online')
                    : t('friends.offline_meta')
                        .replace(
                          '{lastActive}',
                          f.lastActive ?? t('friends.offline'),
                        )
                        .replace('{mutual}', String(f.mutualFriends ?? 0))
                }
                avatarUri={f.avatar}
                online={f.online}
                premium={f.premium}
                onPress={() =>
                  navigation.navigate('UserProfile', { userId: f.id })
                }
                right={
                  <View style={styles.rowActions}>
                    <IconButton name="message" size={18} onPress={() => {}} />
                    <IconButton
                      name="more"
                      size={18}
                      variant="plain"
                      onPress={() => {}}
                    />
                  </View>
                }
              />
            ))
          ))}

        {tab === 'incoming' &&
          (incomingRequests.length === 0 ? (
            <EmptyState
              icon="bell"
              title={t('friends.incoming_empty_title')}
              description={t('friends.incoming_empty_desc')}
            />
          ) : (
            incomingRequests.map(r => (
              <UserListItem
                key={r.id}
                name={r.name}
                subtitle={t('friends.incoming_meta')
                  .replace('{count}', String(r.mutualFriends))
                  .replace('{time}', r.sentAt)}
                avatarUri={r.avatar}
                premium={r.premium}
                onPress={() =>
                  navigation.navigate('UserProfile', { userId: r.id })
                }
                right={
                  <View style={styles.rowActions}>
                    <Button
                      label={t('friends.accept')}
                      size="sm"
                      minWidth={108}
                      fullWidth={false}
                      onPress={() => {}}
                    />
                    <IconButton
                      name="close"
                      size={18}
                      variant="surface"
                      onPress={() => {}}
                    />
                  </View>
                }
              />
            ))
          ))}

        {tab === 'sent' &&
          (sentRequests.length === 0 ? (
            <EmptyState
              icon="send"
              title={t('friends.sent_empty_title')}
              description={t('friends.sent_empty_desc')}
            />
          ) : (
            sentRequests.map(r => (
              <UserListItem
                key={r.id}
                name={r.name}
                subtitle={t('friends.sent_meta').replace('{time}', r.sentAt)}
                avatarUri={r.avatar}
                onPress={() =>
                  navigation.navigate('UserProfile', { userId: r.id })
                }
                right={
                  <Button
                    label={t('friends.cancel')}
                    size="sm"
                    variant="outline"
                    fullWidth={false}
                    onPress={() => {}}
                  />
                }
              />
            ))
          ))}
      </TabScreenScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmentWrap: { paddingHorizontal: 20, marginBottom: 8 },
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 4 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});

export default FriendsScreen;
