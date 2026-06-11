import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  EmptyState,
  Header,
  IconButton,
  Screen,
  SegmentedControl,
  UserListItem,
} from '../../components';
import { FriendsStackParamList } from '../../navigation/types';
import {
  TAB_BAR_SPACE,
  friends,
  incomingRequests,
  sentRequests,
} from '../../utils';

type Props = NativeStackScreenProps<FriendsStackParamList, 'FriendsMain'>;

type Tab = 'friends' | 'incoming' | 'sent';

export function FriendsScreen({ navigation }: Props) {
  const [tab, setTab] = useState<Tab>('friends');

  const segments = [
    { key: 'friends', label: 'Arkadaşlar', badge: friends.length },
    { key: 'incoming', label: 'Gelen', badge: incomingRequests.length },
    { key: 'sent', label: 'Gönderilen', badge: sentRequests.length },
  ];

  return (
    <Screen edges={['top']}>
      <Header
        large
        subtitle={`${friends.length} bağlantı`}
        title="Arkadaşlar"
        actions={[{ icon: 'search', onPress: () => navigation.navigate('SearchUsers') }]}
      />

      <View style={styles.segmentWrap}>
        <SegmentedControl
          items={segments}
          value={tab}
          onChange={key => setTab(key as Tab)}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_SPACE }]}>
        {tab === 'friends' &&
          (friends.length === 0 ? (
            <EmptyState
              icon="users"
              title="Henüz arkadaşın yok"
              description="Yakındaki kişilerden arkadaş ekleyerek başla."
            />
          ) : (
            friends.map(f => (
              <UserListItem
                key={f.id}
                name={f.name}
                subtitle={
                  f.online
                    ? 'Çevrimiçi'
                    : `${f.lastActive ?? 'çevrimdışı'} · ${f.mutualFriends ?? 0} ortak`
                }
                avatarUri={f.avatar}
                online={f.online}
                premium={f.premium}
                onPress={() => {}}
                right={
                  <View style={styles.rowActions}>
                    <IconButton name="message" size={18} onPress={() => {}} />
                    <IconButton name="more" size={18} variant="plain" onPress={() => {}} />
                  </View>
                }
              />
            ))
          ))}

        {tab === 'incoming' &&
          (incomingRequests.length === 0 ? (
            <EmptyState icon="bell" title="Yeni istek yok" description="Gelen arkadaşlık istekleri burada görünür." />
          ) : (
            incomingRequests.map(r => (
              <UserListItem
                key={r.id}
                name={r.name}
                subtitle={`${r.mutualFriends} ortak arkadaş · ${r.sentAt}`}
                avatarUri={r.avatar}
                premium={r.premium}
                right={
                  <View style={styles.rowActions}>
                    <Button label="Kabul" size="sm" fullWidth={false} onPress={() => {}} />
                    <IconButton name="close" size={18} variant="surface" onPress={() => {}} />
                  </View>
                }
              />
            ))
          ))}

        {tab === 'sent' &&
          (sentRequests.length === 0 ? (
            <EmptyState icon="send" title="Bekleyen istek yok" description="Gönderdiğin istekler burada listelenir." />
          ) : (
            sentRequests.map(r => (
              <UserListItem
                key={r.id}
                name={r.name}
                subtitle={`Gönderildi · ${r.sentAt}`}
                avatarUri={r.avatar}
                right={
                  <Button
                    label="İptal"
                    size="sm"
                    variant="outline"
                    fullWidth={false}
                    onPress={() => {}}
                  />
                }
              />
            ))
          ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmentWrap: { paddingHorizontal: 20, marginBottom: 8 },
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 4 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});

export default FriendsScreen;
