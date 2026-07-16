import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Path,
  Rect,
} from 'react-native-svg';
import { useTheme } from '../theme';
import { Typography } from './Typography';

type Props = {
  /** ISO-ish language/country code, e.g. "tr", "en". */
  code: string;
  /** Rendered width in px. Height follows a 3:2 flag ratio. */
  size?: number;
};

const RATIO = 2 / 3;

/** Build a 5-point star path centred at (cx, cy). */
function starPath(cx: number, cy: number, outer: number, inner: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M${points.join(' L')} Z`;
}

function TurkeyFlag() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 60 40">
      <Rect width="60" height="40" fill="#E30A17" />
      <Circle cx="25" cy="20" r="12" fill="#FFFFFF" />
      <Circle cx="29" cy="20" r="9.6" fill="#E30A17" />
      <Path d={starPath(41, 20, 6, 2.6)} fill="#FFFFFF" />
    </Svg>
  );
}

function UnionJackFlag() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 60 40">
      <Defs>
        <ClipPath id="uk-saltire">
          <Path d="M30,20 h30 v20 z v20 h-30 z h-30 v-20 z v-20 h30 z" />
        </ClipPath>
      </Defs>
      <Rect width="60" height="40" fill="#012169" />
      <Path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFFFFF" strokeWidth="9" />
      <Path
        d="M0,0 L60,40 M60,0 L0,40"
        stroke="#C8102E"
        strokeWidth="4"
        clipPath="url(#uk-saltire)"
      />
      <Path d="M30,0 V40 M0,20 H60" stroke="#FFFFFF" strokeWidth="12" />
      <Path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="7" />
    </Svg>
  );
}

const FLAG_BY_CODE: Record<string, () => React.ReactElement> = {
  tr: TurkeyFlag,
  en: UnionJackFlag,
  gb: UnionJackFlag,
};

export function CountryFlag({ code, size = 30 }: Props) {
  const theme = useTheme();
  const width = size;
  const height = Math.round(size * RATIO);
  const Flag = FLAG_BY_CODE[code.toLowerCase()];

  return (
    <View
      style={[
        styles.frame,
        {
          width,
          height,
          borderRadius: Math.max(3, size * 0.14),
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceAlt,
        },
      ]}>
      {Flag ? (
        <Flag />
      ) : (
        <View style={styles.fallback}>
          <Typography
            variant="caption"
            tint={theme.colors.textSecondary}
            style={{ fontSize: height * 0.5 }}>
            {code.toUpperCase().slice(0, 2)}
          </Typography>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CountryFlag;
