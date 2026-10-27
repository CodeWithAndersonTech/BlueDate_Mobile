import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LanguageDto } from '../../api';
import { FigmaSvgName } from '../../assets/figma/svgXml';
import { useTheme } from '../../theme';
import { FigmaIcon } from '../FigmaIcon';
import { Header } from '../Header';
import { LanguageFlagButton } from '../LanguageFlagButton';
import { Typography } from '../Typography';

type HeroProps = {
  glyph?: FigmaSvgName;
  title: string;
  accent?: string;
  subtitle?: string;
  /** Register OTP uses the larger Figma title. */
  large?: boolean;
  children?: React.ReactNode;
};

type BarProps = {
  title?: string;
  onBack: () => void;
  languages?: LanguageDto[];
  languageCode: string;
  onSelectLanguage: (code: string) => void;
};

/** Figma reset / OTP header: back + centered title + language flag. */
export function AuthFlowBar({
  title,
  onBack,
  languages,
  languageCode,
  onSelectLanguage,
}: BarProps) {
  return (
    <View style={styles.topBar}>
      <View style={styles.headerWrap}>
        <Header onBack={onBack} title={title} />
      </View>
      <LanguageFlagButton
        languages={languages}
        selectedCode={languageCode}
        onSelect={onSelectLanguage}
      />
    </View>
  );
}

/** Figma reset / OTP body: blob icon + centered title + subtitle. */
export function AuthFlowHero({
  glyph = 'sms',
  title,
  accent,
  subtitle,
  large = false,
  children,
}: HeroProps) {
  const theme = useTheme();
  const heading = large ? 'h1' : 'h2';
  return (
    <View style={styles.wrap}>
      <View style={[styles.blob, { backgroundColor: theme.colors.plusSoft }]}>
        <FigmaIcon name={glyph} size={96} color={theme.colors.plusCta} />
      </View>
      <View style={styles.titles}>
        <Typography variant={heading} align="center" weight="600">
          {title}
        </Typography>
        {accent ? (
          <Typography
            variant={heading}
            align="center"
            weight="600"
            tint={theme.colors.plusCta}>
            {accent}
          </Typography>
        ) : null}
        {subtitle ? (
          <Typography variant="callout" align="center" color="textMuted">
            {subtitle}
          </Typography>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function AuthInlineError({ message }: { message: string }) {
  const theme = useTheme();
  return (
    <View style={styles.errorRow}>
      <FigmaIcon name="infoCircle" size={18} color={theme.colors.danger} />
      <Typography variant="caption" tint={theme.colors.danger} style={styles.errorText}>
        {message}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  headerWrap: { flex: 1 },
  wrap: { alignItems: 'center', gap: 10, width: '100%' },
  blob: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  titles: { alignItems: 'center', gap: 4, paddingHorizontal: 8 },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  errorText: { flex: 1 },
});
