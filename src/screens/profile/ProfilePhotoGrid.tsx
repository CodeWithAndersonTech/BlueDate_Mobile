import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useLocale } from '../../i18n';
import { useTheme } from '../../theme';
import {
  pickAndAddGalleryPhoto,
  ProfilePhoto,
  removeGalleryPhoto,
} from '../../services/photos/photoStore';

const GAP = 2;
const COLS = 3;

type Props = {
  userId?: number;
  token?: string | null;
  photos: ProfilePhoto[];
  editable?: boolean;
  onPhotosChange?: (photos: ProfilePhoto[]) => void;
};

export function ProfilePhotoGrid({
  userId,
  token,
  photos,
  editable = false,
  onPhotosChange,
}: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const [viewer, setViewer] = useState<ProfilePhoto | null>(null);

  const cell = useMemo(() => {
    const width = Dimensions.get('window').width;
    return (width - GAP * (COLS - 1)) / COLS;
  }, []);

  const pickAsset = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
    });
    if (result.didCancel) return null;
    if (result.errorCode === 'permission') {
      Alert.alert(t('profile.photos'), t('profile.photo_permission'));
      return null;
    }
    const asset = result.assets?.[0];
    if (!asset?.uri) {
      Alert.alert(t('profile.photos'), t('profile.photo_error'));
      return null;
    }
    return {
      uri: asset.uri,
      fileName: asset.fileName ?? undefined,
      type: asset.type ?? undefined,
    };
  };

  const onAdd = async () => {
    if (!editable || busy || !userId || !onPhotosChange) return;
    const asset = await pickAsset();
    if (!asset) return;
    setBusy(true);
    try {
      const photo = await pickAndAddGalleryPhoto(userId, asset, token);
      onPhotosChange([...photos, photo]);
    } catch {
      Alert.alert(t('profile.photos'), t('profile.photo_error'));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (photo: ProfilePhoto) => {
    if (!editable || busy || !userId || !onPhotosChange) return;
    Alert.alert(t('profile.delete_photo'), undefined, [
      { text: t('common.close'), style: 'cancel' },
      {
        text: t('profile.delete_photo'),
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await removeGalleryPhoto(userId, photo, token);
            onPhotosChange(photos.filter(p => p.id !== photo.id));
            setViewer(null);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const cells: Array<ProfilePhoto | 'add'> = [...photos];
  if (editable) {
    cells.push('add');
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('profile.photos')}
        </Text>
        {busy ? <ActivityIndicator color={theme.colors.primary} /> : null}
      </View>

      {photos.length === 0 && !editable ? null : photos.length === 0 ? (
        <Pressable
          onPress={onAdd}
          style={[
            styles.empty,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: theme.colors.borderStrong,
            },
          ]}>
          <Text style={[styles.emptyPlus, { color: theme.colors.primary }]}>＋</Text>
          <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
            {t('profile.photos_empty')}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.grid}>
          {cells.map((item, index) => {
            if (item === 'add') {
              return (
                <Pressable
                  key="add"
                  onPress={onAdd}
                  style={[
                    styles.cell,
                    {
                      width: cell,
                      height: cell,
                      backgroundColor: theme.colors.surfaceAlt,
                      borderColor: theme.colors.border,
                    },
                  ]}>
                  <Text style={[styles.addGlyph, { color: theme.colors.primary }]}>
                    ＋
                  </Text>
                  <Text
                    style={[styles.addLabel, { color: theme.colors.textMuted }]}>
                    {t('profile.add_photo')}
                  </Text>
                </Pressable>
              );
            }

            return (
              <Pressable
                key={item.id}
                onPress={() => setViewer(item)}
                style={[
                  styles.cell,
                  {
                    width: cell,
                    height: cell,
                    marginRight: (index + 1) % COLS === 0 ? 0 : GAP,
                    marginBottom: GAP,
                  },
                ]}>
                <Image source={{ uri: item.uri }} style={styles.image} />
                {item.localOnly ? (
                  <View style={styles.localBadge}>
                    <Text style={styles.localBadgeText}>•</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}

      <Modal
        visible={!!viewer}
        transparent
        animationType="fade"
        onRequestClose={() => setViewer(null)}>
        <View style={styles.viewerRoot}>
          <Pressable style={styles.viewerBackdrop} onPress={() => setViewer(null)} />
          {viewer ? (
            <Image
              source={{ uri: viewer.uri }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          ) : null}
          <View style={styles.viewerActions}>
            {editable && viewer ? (
              <Pressable
                onPress={() => onDelete(viewer)}
                style={[styles.viewerBtn, { backgroundColor: theme.colors.danger }]}>
                <Text style={styles.viewerBtnText}>{t('profile.delete_photo')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => setViewer(null)}
              style={[styles.viewerBtn, { backgroundColor: '#FFFFFF' }]}>
              <Text style={[styles.viewerBtnText, { color: '#111' }]}>
                {t('common.close')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 22, gap: 12 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  title: { fontSize: 18, fontWeight: '700' },
  empty: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyPlus: { fontSize: 28, fontWeight: '300' },
  emptyText: { fontSize: 13 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  image: { width: '100%', height: '100%' },
  addGlyph: { fontSize: 28, fontWeight: '300', lineHeight: 30 },
  addLabel: { fontSize: 11, marginTop: 2 },
  localBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F5D76E',
  },
  localBadgeText: { fontSize: 1, color: 'transparent' },
  viewerRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
  },
  viewerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  viewerImage: {
    width: '100%',
    height: '70%',
  },
  viewerActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 40,
    gap: 10,
  },
  viewerBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});

export default ProfilePhotoGrid;
