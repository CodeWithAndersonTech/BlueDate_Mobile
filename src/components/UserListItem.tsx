import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Avatar } from './Avatar';
import { Typography } from './Typography';

export interface UserListItemProps {
  name: string;
  subtitle?: string;
  avatarUri?: string;
  online?: boolean;
  premium?: boolean;
  /** Right-side action (button, badge, etc.). */
  right?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function UserListItem({
  name,
  subtitle,
  avatarUri,
  online,
  premium,
  right,
  onPress,
  style,
}: UserListItemProps) {
  const theme = useTheme();

  const content = (
    <View style={[styles.row, style]}>
      <Avatar uri={avatarUri} name={name} size="md" online={online} premium={premium} />
      <View style={styles.texts}>
        <View style={styles.nameRow}>
          <Typography variant="bodyStrong" numberOfLines={1}>
            {name}
          </Typography>
        </View>
        {subtitle && (
          <Typography variant="caption" color="textMuted" numberOfLines={1}>
            {subtitle}
          </Typography>
        )}
      </View>
      {right}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} android_ripple={{ color: theme.colors.surfaceAlt }}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  texts: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});

export default UserListItem;
