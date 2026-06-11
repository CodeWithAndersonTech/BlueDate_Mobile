import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';
import { TextVariant, useTheme } from '../theme';
import { ThemeColors } from '../theme/themes';

type ColorToken = keyof ThemeColors;

export interface TypographyProps extends TextProps {
  variant?: TextVariant;
  /** Semantic color token from the theme, e.g. "text", "textMuted", "primary". */
  color?: ColorToken;
  /** Raw color override (wins over `color`). */
  tint?: string;
  align?: TextStyle['textAlign'];
  weight?: TextStyle['fontWeight'];
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

/**
 * Theme-aware text primitive. Centralizes all font sizing/weights via the
 * typography scale so screens never hard-code font styles.
 */
export function Typography({
  variant = 'body',
  color = 'text',
  tint,
  align,
  weight,
  style,
  children,
  ...rest
}: TypographyProps) {
  const theme = useTheme();
  const variantStyle = theme.typography.variants[variant];

  return (
    <Text
      allowFontScaling
      style={[
        variantStyle,
        { color: tint ?? theme.colors[color] },
        align ? { textAlign: align } : null,
        weight ? { fontWeight: weight } : null,
        style,
      ]}
      {...rest}>
      {children}
    </Text>
  );
}

export default Typography;
