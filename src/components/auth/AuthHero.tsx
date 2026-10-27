import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { images } from '../../assets';
import { useTheme } from '../../theme';
import { StoryAvatar } from '../StoryAvatar';
import { Typography } from '../Typography';

type Props = {
  line1: string;
  line2: string;
  accent: string;
  subtitle: string;
};

const FACES = images.authHero;

/**
 * Figma login/register hero — photo cluster + two-line title (accent last word).
 */
export function AuthHero({ line1, line2, accent, subtitle }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.cluster}>
        <View style={[styles.dot, styles.dotTL, { backgroundColor: theme.colors.plusCta }]} />
        <View style={[styles.dot, styles.dotTR, { backgroundColor: theme.colors.plusCta }]} />
        <View style={[styles.dot, styles.dotBR, { backgroundColor: theme.colors.plusCta }]} />
        <View style={[styles.dot, styles.dotBL, { backgroundColor: theme.colors.plusCta }]} />

        <View style={[styles.face, { top: 14, left: 42 }]}>
          <StoryAvatar uri={Image.resolveAssetSource(FACES[0]).uri} size={121} hasStory />
        </View>
        <View style={[styles.face, { top: 28, left: 186 }]}>
          <StoryAvatar uri={Image.resolveAssetSource(FACES[3]).uri} size={111} hasStory />
        </View>
        <View style={[styles.face, { top: 94, left: 0 }]}>
          <StoryAvatar uri={Image.resolveAssetSource(FACES[4]).uri} size={103} hasStory />
        </View>
        <View style={[styles.face, { top: 114, left: 86 }]}>
          <StoryAvatar uri={Image.resolveAssetSource(FACES[5]).uri} size={169} hasStory />
        </View>
        <View style={[styles.face, { top: 162, left: 238 }]}>
          <StoryAvatar uri={Image.resolveAssetSource(FACES[1]).uri} size={115} hasStory />
        </View>
        <View style={[styles.face, { top: 4, left: 196, opacity: 0.55 }]}>
          <StoryAvatar uri={Image.resolveAssetSource(FACES[2]).uri} size={46} hasStory />
        </View>
      </View>

      <View style={styles.titles}>
        <Typography variant="h1" align="center" weight="600">
          {line1}
        </Typography>
        <Typography variant="h1" align="center" weight="600">
          {line2}{' '}
          <Typography variant="h1" weight="600" tint={theme.colors.plusCta}>
            {accent}
          </Typography>
        </Typography>
        <Typography variant="callout" align="center" color="text">
          {subtitle}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8, width: '100%' },
  cluster: {
    width: 353,
    height: 280,
    alignSelf: 'center',
  },
  face: { position: 'absolute' },
  dot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dotTL: { top: 0, left: 25 },
  dotTR: { top: 75, right: 5 },
  dotBR: { bottom: 8, right: 0 },
  dotBL: { bottom: 18, left: 28, width: 17, height: 17, borderRadius: 9 },
  titles: { alignItems: 'center', gap: 2, paddingHorizontal: 8 },
});
