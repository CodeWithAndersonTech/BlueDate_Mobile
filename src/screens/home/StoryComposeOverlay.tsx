import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import { Button, Icon, Typography } from '../../components';
import { useLocale } from '../../i18n';
import type { PickedStoryAsset } from '../../services/stories/pickStoryMedia';

type Props = {
  visible: boolean;
  asset: PickedStoryAsset | null;
  uploading?: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

export function StoryComposeOverlay({
  visible,
  asset,
  uploading = false,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();

  if (!visible || !asset) {
    return null;
  }

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View
        style={[
          styles.panel,
          {
            backgroundColor: '#000',
            paddingTop: insets.top + 8,
            paddingBottom: Math.max(insets.bottom, 12) + 28,
          },
        ]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            disabled={uploading}
            accessibilityLabel={t('common.close')}>
            <Icon name="close" size={22} color="#fff" />
          </Pressable>
          <Typography variant="h3" tint="#fff">
            {t('stories.compose_title')}
          </Typography>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.previewWrap}>
          {asset.mediaType === 'video' ? (
            <Video
              key={asset.uri}
              source={{ uri: asset.uri }}
              style={styles.preview}
              resizeMode="cover"
              repeat
              muted={false}
              controls={false}
              paused={false}
              playInBackground={false}
              ignoreSilentSwitch="ignore"
            />
          ) : (
            <Image source={{ uri: asset.uri }} style={styles.preview} />
          )}
        </View>

        <View style={styles.shareBar}>
          <Button
            label={uploading ? t('stories.uploading') : t('stories.share')}
            onPress={onSubmit}
            disabled={uploading}
            loading={uploading}
            fullWidth
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 40,
  },
  panel: {
    flex: 1,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  previewWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#111',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  shareBar: {
    marginTop: 4,
    marginBottom: 16,
  },
});
