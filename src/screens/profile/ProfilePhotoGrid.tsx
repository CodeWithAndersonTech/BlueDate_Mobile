import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocale } from '../../i18n';
import { useTheme } from '../../theme';
import {
  assetFromPickerResponse,
  pickPhotoFromLibrary,
} from '../../services/photos/pickImage';
import {
  MAX_GALLERY_PHOTOS,
  PhotoLimitError,
  pickAndAddGalleryPhoto,
  ProfilePhoto,
  removeGalleryPhoto,
} from '../../services/photos/photoStore';
import { PhotoViewerModal } from './PhotoViewerModal';

const GAP = 2;
const COLS = 3;
/** Match profile body inset so the grid isn't edge-to-edge. */
const H_INSET = 16;

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
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const atLimit = photos.length >= MAX_GALLERY_PHOTOS;
  const canAdd = editable && !atLimit;

  const cell = useMemo(() => {
    const width = Dimensions.get('window').width - H_INSET * 2;
    return (width - GAP * (COLS - 1)) / COLS;
  }, []);

  const pickAsset = async () => {
    const result = await pickPhotoFromLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
    });
    if (result.didCancel) return null;
    if (result.errorCode === 'permission') {
      Alert.alert(t('profile.photos'), t('profile.photo_permission'));
      return null;
    }
    if (result.errorMessage === 'NATIVE_MODULE_MISSING') {
      Alert.alert(t('profile.photos'), t('profile.photo_native_missing'));
      return null;
    }
    if (result.errorCode) {
      Alert.alert(t('profile.photos'), t('profile.photo_error'));
      return null;
    }
    const asset = assetFromPickerResponse(result);
    if (!asset) {
      Alert.alert(t('profile.photos'), t('profile.photo_error'));
      return null;
    }
    return asset;
  };

  const onAdd = async () => {
    if (!canAdd || busy || !userId || !onPhotosChange) return;
    if (atLimit) {
      Alert.alert(
        t('profile.photos'),
        t('profile.photos_max').replace('{count}', String(MAX_GALLERY_PHOTOS)),
      );
      return;
    }
    const asset = await pickAsset();
    if (!asset) return;
    setBusy(true);
    try {
      const photo = await pickAndAddGalleryPhoto(userId, asset, token);
      onPhotosChange([...photos, photo]);
    } catch (error) {
      if (error instanceof PhotoLimitError) {
        Alert.alert(
          t('profile.photos'),
          t('profile.photos_max').replace('{count}', String(MAX_GALLERY_PHOTOS)),
        );
      } else {
        Alert.alert(t('profile.photos'), t('profile.photo_error'));
      }
    } finally {
      setBusy(false);
    }
  };

  const onDelete = (photo: ProfilePhoto) => {
    if (!editable || busy || !userId || !onPhotosChange) return;
    Alert.alert(
      t('profile.delete_photo'),
      t('profile.delete_photo_confirm'),
      [
        { text: t('common.close'), style: 'cancel' },
        {
          text: t('profile.delete_photo'),
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await removeGalleryPhoto(userId, photo, token);
              const next = photos.filter(p => p.id !== photo.id);
              onPhotosChange(next);
              if (next.length === 0) {
                setViewerIndex(null);
              } else {
                setViewerIndex(i =>
                  i == null ? null : Math.min(i, next.length - 1),
                );
              }
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const cells: Array<ProfilePhoto | 'add'> = [...photos];
  if (canAdd) {
    cells.push('add');
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('profile.photos')}
        </Text>
        <View style={styles.headerRight}>
          <Text style={[styles.count, { color: theme.colors.textMuted }]}>
            {photos.length}/{MAX_GALLERY_PHOTOS}
          </Text>
          {busy ? <ActivityIndicator color={theme.colors.primary} /> : null}
        </View>
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
                onPress={() => setViewerIndex(index)}
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

      <PhotoViewerModal
        photos={photos}
        index={viewerIndex ?? -1}
        editable={editable}
        busy={busy}
        onClose={() => setViewerIndex(null)}
        onIndexChange={setViewerIndex}
        onDelete={onDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 22, gap: 12, paddingHorizontal: H_INSET },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: '700' },
  count: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  empty: {
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
    borderRadius: 12,
    overflow: 'hidden',
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
});

export default ProfilePhotoGrid;
