import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LanguageDto } from '../api';
import { useTheme } from '../theme';
import { Typography } from './Typography';

type Props = {
  label: string;
  languages: LanguageDto[];
  selectedCode: string;
  onSelect: (code: string) => void;
};

export function LanguagePicker({
  label,
  languages,
  selectedCode,
  onSelect,
}: Props) {
  const theme = useTheme();

  if (!languages.length) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Typography variant="caption" color="textSecondary" style={styles.label}>
        {label}
      </Typography>
      <View style={styles.row}>
        {languages.map(language => {
          const selected =
            language.Code.toLowerCase() === selectedCode.toLowerCase();
          return (
            <Pressable
              key={language.Id}
              onPress={() => onSelect(language.Code)}
              style={[
                styles.chip,
                {
                  borderColor: selected
                    ? theme.colors.primary
                    : theme.colors.border,
                  backgroundColor: selected
                    ? theme.colors.primarySoft ?? theme.colors.surfaceAlt
                    : theme.colors.surfaceAlt,
                  borderRadius: theme.radii.md,
                },
              ]}>
              <Typography
                variant="callout"
                tint={selected ? theme.colors.primary : theme.colors.text}>
                {language.Name}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { marginLeft: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    minWidth: 96,
    height: 40,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LanguagePicker;
