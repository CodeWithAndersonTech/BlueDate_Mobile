import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FigmaSvgName } from '../assets/figma/svgXml';
import { useTheme } from '../theme';
import { FigmaIcon } from './FigmaIcon';

/**
 * App icons render the Meerk Figma / Vuesax set. `IconName` is kept so older
 * call sites keep compiling; each name maps to a Figma glyph.
 */
export type IconName =
  | 'home'
  | 'map-pin'
  | 'users'
  | 'user'
  | 'crown'
  | 'search'
  | 'settings'
  | 'bell'
  | 'heart'
  | 'message'
  | 'plus'
  | 'check'
  | 'close'
  | 'eye'
  | 'eye-off'
  | 'mail'
  | 'phone'
  | 'lock'
  | 'edit'
  | 'camera'
  | 'logout'
  | 'moon'
  | 'sun'
  | 'shield'
  | 'help'
  | 'star'
  | 'sparkles'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'arrow-left'
  | 'sliders'
  | 'filter'
  | 'more'
  | 'user-plus'
  | 'user-check'
  | 'clock'
  | 'send'
  | 'zap'
  | 'palette'
  | 'bookmark'
  | 'globe'
  | 'trash'
  | 'play'
  | 'gift'
  | 'flag'
  | 'footprints';

type Glyph = { name: FigmaSvgName; rotate?: `${number}deg` };

const FIGMA_FOR_ICON: Record<IconName, Glyph> = {
  home: { name: 'tabHome' },
  'map-pin': { name: 'location' },
  users: { name: 'tabFriends' },
  user: { name: 'tabProfile' },
  crown: { name: 'crown' },
  search: { name: 'searchNormal' },
  settings: { name: 'setting2' },
  bell: { name: 'bell' },
  heart: { name: 'heart' },
  message: { name: 'tabMessages' },
  plus: { name: 'profileAdd' },
  check: { name: 'tickCircle' },
  close: { name: 'closeCircle' },
  eye: { name: 'eye' },
  'eye-off': { name: 'eyeSlash' },
  mail: { name: 'sms' },
  phone: { name: 'sms' },
  lock: { name: 'lock' },
  edit: { name: 'gallery' },
  camera: { name: 'gallery' },
  logout: { name: 'logout' },
  moon: { name: 'setting2' },
  sun: { name: 'star' },
  shield: { name: 'shield' },
  help: { name: 'infoCircle' },
  star: { name: 'star' },
  sparkles: { name: 'star' },
  'chevron-left': { name: 'arrowRight', rotate: '180deg' },
  'chevron-right': { name: 'arrowRight' },
  'chevron-down': { name: 'arrowRight', rotate: '90deg' },
  'arrow-left': { name: 'arrowRight', rotate: '180deg' },
  sliders: { name: 'setting2' },
  filter: { name: 'setting2' },
  more: { name: 'moreDots' },
  'user-plus': { name: 'profileAdd' },
  'user-check': { name: 'tickCircle' },
  clock: { name: 'rotateRight' },
  send: { name: 'directRight' },
  zap: { name: 'star' },
  palette: { name: 'setting2' },
  bookmark: { name: 'star' },
  globe: { name: 'people' },
  trash: { name: 'trash' },
  play: { name: 'videoPlay' },
  gift: { name: 'gift' },
  flag: { name: 'infoCircle' },
  footprints: { name: 'footprints' },
};

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Ignored — Figma glyphs carry their own fill/stroke. */
  filled?: boolean;
}

export function Icon({ name, size = 24, color }: IconProps) {
  const theme = useTheme();
  const glyph = FIGMA_FOR_ICON[name];
  const tint = color ?? theme.colors.plusCta;
  const icon = <FigmaIcon name={glyph.name} size={size} color={tint} />;
  if (!glyph.rotate) {
    return icon;
  }
  return (
    <View style={[styles.rotate, { width: size, height: size, transform: [{ rotate: glyph.rotate }] }]}>
      {icon}
    </View>
  );
}

const styles = StyleSheet.create({
  rotate: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Icon;
