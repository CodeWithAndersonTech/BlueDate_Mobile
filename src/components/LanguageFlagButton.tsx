import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { LanguageDto } from '../api';
import { useTheme } from '../theme';
import { CountryFlag } from './CountryFlag';
import { Typography } from './Typography';

export const FALLBACK_LANGUAGES: LanguageDto[] = [
  {
    Id: 1,
    Name: 'Türkçe',
    Code: 'tr',
    CultureCode: 'tr-TR',
    IsDefault: 0,
    IsActive: 1,
  },
  {
    Id: 2,
    Name: 'English',
    Code: 'en',
    CultureCode: 'en-US',
    IsDefault: 1,
    IsActive: 1,
  },
];

type Props = {
  languages?: LanguageDto[];
  selectedCode: string;
  onSelect: (code: string) => void;
};

export function LanguageFlagButton({
  languages,
  selectedCode,
  onSelect,
}: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const options = languages?.length ? languages : FALLBACK_LANGUAGES;

  const selected = useMemo(
    () =>
      options.find(
        language => language.Code.toLowerCase() === selectedCode.toLowerCase(),
      ) ?? options[0],
    [options, selectedCode],
  );

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={selected.Name}
        hitSlop={12}
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: theme.colors.surfaceAlt,
            borderColor: theme.colors.primary,
          },
        ]}>
        <CountryFlag code={selected.Code} size={30} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.menu,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.lg,
              },
              theme.shadows.sm,
            ]}>
            {options.map(language => {
              const isSelected =
                language.Code.toLowerCase() === selected.Code.toLowerCase();
              return (
                <Pressable
                  key={language.Id}
                  onPress={() => {
                    setOpen(false);
                    onSelect(language.Code);
                  }}
                  style={[
                    styles.option,
                    isSelected && {
                      backgroundColor: theme.colors.primarySoft,
                    },
                  ]}>
                  <CountryFlag code={language.Code} size={28} />
                  <Typography
                    variant="bodyStrong"
                    tint={isSelected ? theme.colors.primary : theme.colors.text}>
                    {language.Name}
                  </Typography>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 72,
    paddingRight: 20,
  },
  menu: {
    minWidth: 180,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});

export default LanguageFlagButton;
