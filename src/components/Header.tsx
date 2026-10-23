import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { FigmaIcon } from './FigmaIcon';
import { Icon, IconName } from './Icon';
import { Typography } from './Typography';

export interface HeaderAction {
  icon: IconName;
  onPress: () => void;
  /** Screen-reader description for this icon-only action. */
  accessibilityLabel?: string;
  color?: string;
  filled?: boolean;
}

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  /** Screen-reader description for the back affordance. */
  backAccessibilityLabel?: string;
  actions?: HeaderAction[];
  /** Large screen title style (left-aligned, bold). */
  large?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Header({
  title,
  subtitle,
  onBack,
  backAccessibilityLabel,
  actions = [],
  large = false,
  style,
}: HeaderProps) {
  const theme = useTheme();

  if (large) {
    return (
      <View style={[styles.largeContainer, style]}>
        <View style={styles.largeText}>
          {subtitle && (
            <Typography variant="overline" color="textMuted">
              {subtitle}
            </Typography>
          )}
          <Typography variant="h1">{title}</Typography>
        </View>
        <View style={styles.actions}>
          {actions.map((a, i) => (
            <Pressable
              key={`${a.icon}-${i}`}
              onPress={a.onPress}
              hitSlop={6}
              style={styles.actionBtn}
              accessibilityRole="button"
              accessibilityLabel={a.accessibilityLabel}>
              <Icon name={a.icon} size={22} color={a.color ?? theme.colors.text} />
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={backAccessibilityLabel}>
            <View style={styles.backIcon}>
              <FigmaIcon name="arrowRight" size={15} color={theme.colors.text} />
            </View>
          </Pressable>
        ) : (
          <View style={styles.sideSlot} />
        )}
      </View>
      <View style={styles.center}>
        {title && (
          <Typography variant="title" align="center" numberOfLines={1}>
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography variant="caption" color="textMuted" align="center">
            {subtitle}
          </Typography>
        )}
      </View>
      <View style={[styles.side, styles.right]}>
        {actions.length === 0 ? (
          <View style={styles.sideSlot} />
        ) : (
          <View style={styles.actions}>
            {actions.map((a, i) => (
              <Pressable
                key={`${a.icon}-${i}`}
                onPress={a.onPress}
                hitSlop={6}
                style={styles.actionBtn}
                accessibilityRole="button"
                accessibilityLabel={a.accessibilityLabel}>
                <Icon
                  name={a.icon}
                  size={22}
                  color={a.color ?? theme.colors.text}
                />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    minHeight: 44,
  },
  side: {
    minWidth: 24,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sideSlot: { width: 24, height: 24 },
  right: { justifyContent: 'flex-end' },
  center: { flex: 1, paddingHorizontal: 8 },
  backIcon: {
    transform: [{ rotate: '180deg' }],
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 12,
  },
  largeText: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Header;
