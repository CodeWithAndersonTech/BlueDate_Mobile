import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { Typography } from './Typography';

type Props = {
  uri?: string;
  size: number;
  hasStory: boolean;
  fallback?: string;
};

/**
 * Circular avatar. When `hasStory`, an RGB ring wraps the photo.
 * Gradient is clipped to a circle so corners never leak behind the face.
 */
export function StoryAvatar({ uri, size, hasStory, fallback }: Props) {
  const theme = useTheme();
  const [stickyUri, setStickyUri] = useState(uri);
  useEffect(() => {
    if (uri) {
      setStickyUri(uri);
    }
  }, [uri]);
  const shownUri = uri || stickyUri;
  const ring = Math.max(2.5, Math.round(size * 0.06));
  const gap = Math.max(2, Math.round(size * 0.035));
  const photo = size - ring * 2 - gap * 2;

  return (
    <View
      style={[
        styles.clip,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: hasStory ? undefined : theme.colors.borderStrong,
        },
      ]}>
      {hasStory ? (
        <LinearGradient
          colors={theme.gradients.storyRing}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View
        style={[
          styles.inset,
          {
            margin: ring,
            borderRadius: (size - ring * 2) / 2,
            backgroundColor: theme.colors.background,
            padding: gap,
          },
        ]}>
        <View
          style={[
            styles.photo,
            {
              width: photo,
              height: photo,
              borderRadius: photo / 2,
              backgroundColor: theme.colors.surfaceAlt,
            },
          ]}>
          {shownUri ? (
            <Image
              source={{ uri: shownUri }}
              style={{ width: photo, height: photo, borderRadius: photo / 2 }}
              fadeDuration={0}
              resizeMode="cover"
            />
          ) : fallback ? (
            <Typography variant="callout" weight="600">
              {fallback}
            </Typography>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  inset: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
