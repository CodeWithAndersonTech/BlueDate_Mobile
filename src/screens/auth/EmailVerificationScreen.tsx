import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Button, Header, Screen, Typography } from '../../components';
import { useLocale } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'EmailVerification'>;

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;
const DEMO_SUCCESS_CODE = '111111';

export function EmailVerificationScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const { completeEmailVerification } = useAuth();
  const { email, password, userId } = route.params;

  const [digits, setDigits] = useState<string[]>(
    Array.from({ length: CODE_LENGTH }, () => ''),
  );
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputsRef = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const id = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const code = useMemo(() => digits.join(''), [digits]);
  const canVerify = code.length === CODE_LENGTH && !submitting;

  const timerLabel = useMemo(() => {
    const mm = String(Math.floor(secondsLeft / 60)).padStart(1, '0');
    const ss = String(secondsLeft % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }, [secondsLeft]);

  const focusIndex = (index: number) => {
    inputsRef.current[index]?.focus();
  };

  const applyCode = (next: string[]) => {
    setDigits(next);
    setError(null);
    if (next.every(d => d.length === 1)) {
      void verify(next.join(''));
    }
  };

  const onChangeDigit = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length === 0) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      setError(null);
      return;
    }

    // Paste / autofill support for multiple digits.
    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, CODE_LENGTH).split('');
      const next = Array.from({ length: CODE_LENGTH }, (_, i) => chars[i] ?? '');
      applyCode(next);
      const lastFilled = Math.min(chars.length, CODE_LENGTH) - 1;
      if (lastFilled >= 0) {
        focusIndex(lastFilled);
      }
      return;
    }

    const next = [...digits];
    next[index] = cleaned;
    applyCode(next);

    if (index < CODE_LENGTH - 1) {
      focusIndex(index + 1);
    }
  };

  const onKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      focusIndex(index - 1);
    }
  };

  const verify = async (value: string) => {
    if (submitting) {
      return;
    }

    if (value !== DEMO_SUCCESS_CODE) {
      setError(t('auth.verify_invalid_code'));
      return;
    }

    try {
      setSubmitting(true);
      await completeEmailVerification({ email, password, userId });
    } catch (err) {
      Alert.alert(
        t('auth.verify_title'),
        err instanceof Error ? err.message : 'Verification failed',
      );
      setSubmitting(false);
    }
  };

  const onResend = () => {
    if (secondsLeft > 0) {
      return;
    }
    setSecondsLeft(RESEND_SECONDS);
    setDigits(Array.from({ length: CODE_LENGTH }, () => ''));
    setError(null);
    focusIndex(0);
  };

  return (
    <Screen edges={['top']} padded>
      <Header
        onBack={() => navigation.goBack()}
        title={t('auth.verify_title')}
      />

      <View style={styles.content}>
        <View style={styles.intro}>
          <Typography variant="h2">{t('auth.verify_heading')}</Typography>
          <Typography variant="body" color="textMuted" style={styles.subtitle}>
            {t('auth.verify_subtitle')}
          </Typography>
          <Typography variant="bodyStrong" tint={theme.colors.primary}>
            {email}
          </Typography>
        </View>

        <View style={styles.codeRow}>
          {digits.map((digit, index) => {
            const focusedBorder =
              digit.length > 0 ? theme.colors.primary : theme.colors.border;
            return (
              <TextInput
                key={`otp-${index}`}
                ref={ref => {
                  inputsRef.current[index] = ref;
                }}
                value={digit}
                onChangeText={text => onChangeDigit(index, text)}
                onKeyPress={({ nativeEvent }) =>
                  onKeyPress(index, nativeEvent.key)
                }
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                maxLength={index === 0 ? CODE_LENGTH : 1}
                selectTextOnFocus
                style={[
                  styles.box,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderColor: error ? theme.colors.danger : focusedBorder,
                    color: theme.colors.text,
                    borderRadius: theme.radii.md,
                  },
                ]}
              />
            );
          })}
        </View>

        {error ? (
          <Typography variant="caption" tint={theme.colors.danger} align="center">
            {error}
          </Typography>
        ) : null}

        <View style={styles.timerBlock}>
          {secondsLeft > 0 ? (
            <Typography variant="body" color="textMuted" align="center">
              {t('auth.verify_resend_in')}{' '}
              <Typography variant="bodyStrong" tint={theme.colors.primary}>
                {timerLabel}
              </Typography>
            </Typography>
          ) : (
            <Pressable hitSlop={8} onPress={onResend}>
              <Typography
                variant="bodyStrong"
                tint={theme.colors.primary}
                align="center">
                {t('auth.verify_resend')}
              </Typography>
            </Pressable>
          )}
        </View>

        <Button
          label={t('auth.verify_action')}
          size="lg"
          loading={submitting}
          disabled={!canVerify}
          onPress={() => verify(code)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 16,
    gap: 24,
  },
  intro: {
    gap: 8,
  },
  subtitle: {
    lineHeight: 22,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  box: {
    flex: 1,
    height: 58,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    paddingVertical: 0,
  },
  timerBlock: {
    minHeight: 28,
    justifyContent: 'center',
  },
});

export default EmailVerificationScreen;
