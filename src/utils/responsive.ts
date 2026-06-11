import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

/** Reference dimensions (iPhone 13 / standard mid-size device). */
const GUIDELINE_BASE_WIDTH = 390;
const GUIDELINE_BASE_HEIGHT = 844;

export const screen = {
  width,
  height,
  isSmall: width < 360,
  isTablet: Math.min(width, height) >= 600,
};

/** Scale a size horizontally relative to the reference width. */
export function scale(size: number): number {
  return Math.round(
    PixelRatio.roundToNearestPixel((width / GUIDELINE_BASE_WIDTH) * size),
  );
}

/** Scale a size vertically relative to the reference height. */
export function verticalScale(size: number): number {
  return Math.round(
    PixelRatio.roundToNearestPixel((height / GUIDELINE_BASE_HEIGHT) * size),
  );
}

/**
 * Moderate scaling keeps proportions closer to the original on large screens
 * (good for fonts / spacing). `factor` controls how aggressive the scaling is.
 */
export function moderateScale(size: number, factor = 0.5): number {
  return Math.round(size + (scale(size) - size) * factor);
}
