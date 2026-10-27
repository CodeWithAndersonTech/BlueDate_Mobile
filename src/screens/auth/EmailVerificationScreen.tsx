import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { sendEmailOtp, verifyEmailOtp } from '../../api/auth';
import {
  AuthFlowBar,
  AuthFlowHero,
  AuthInlineError,
  AuthPrimaryButton,
  FigmaIcon,
  Screen,
  Typography,
} from '../../components';
import { useLocale, userFacingError } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'EmailVerification'>;

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

export function EmailVerificationScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { t, languages, languageCode, setLanguage } = useLocale();
  const { completeEmailVerification } = useAuth();
  const { email, password, userId, purpose } = route.params;
  const isReset = purpose === 'reset';

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

  const timerLabel = useMemo(() => {
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
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
    if (value.length !== CODE_LENGTH) {
      setError(t('auth.verify_invalid_code'));
      return;
    }

    try {
      setSubmitting(true);
      await verifyEmailOtp({
        Email: email,
        Purpose: purpose,
        Code: value,
      });

      if (purpose === 'reset') {
        navigation.replace('ResetPassword', { email, code: value });
        return;
      }

      if (!password || !userId) {
        throw new Error(t('auth.verify_invalid_code'));
      }

      await completeEmailVerification({ email, password, userId });
    } catch (err) {
      setError(userFacingError(err, t, 'auth.verify_invalid_code'));
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (secondsLeft > 0) {
      return;
    }
    try {
      await sendEmailOtp({ Email: email, Purpose: purpose });
      setSecondsLeft(RESEND_SECONDS);
      setDigits(Array.from({ length: CODE_LENGTH }, () => ''));
      setError(null);
      focusIndex(0);
    } catch (err) {
      Alert.alert(t('auth.verify_title'), userFacingError(err, t));
    }
  };

  return (
    <Screen padded={false} edges={['top']}>
      <AuthFlowBar
        title={isReset ? t('auth.reset_nav') : undefined}
        onBack={() => navigation.goBack()}
        languages={languages}
        languageCode={languageCode}
        onSelectLanguage={code => {
          setLanguage(code).catch(() => undefined);
        }}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets>
        <AuthFlowHero
          glyph="sms"
          large={!isReset}
          title={
            isReset ? t('auth.verify_heading') : t('auth.hero_verify_line1')
          }
          accent={isReset ? undefined : t('auth.hero_verify_accent')}
          subtitle={
            isReset ? t('auth.verify_code_sub') : t('auth.hero_verify_sub')
          }
        />

        <View style={styles.codeRow}>
          {digits.map((digit, index) => (
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
              autoComplete="one-time-code"
              maxLength={index === 0 ? CODE_LENGTH : 1}
              selectTextOnFocus
              style={[
                styles.box,
                theme.typography.variants.h3,
                {
                  backgroundColor: theme.colors.authField,
                  borderColor: error
                    ? theme.colors.danger
                    : theme.colors.authFieldBorder,
                  color: theme.colors.text,
                },
              ]}
            />
          ))}
        </View>

        {error ? <AuthInlineError message={error} /> : null}

        <Pressable
          style={styles.timerRow}
          hitSlop={8}
          disabled={secondsLeft > 0}
          onPress={() => {
            void onResend();
          }}>
          <FigmaIcon
            name="rotateRight"
            size={18}
            color={
              secondsLeft > 0 ? theme.colors.textMuted : theme.colors.plusCta
            }
          />
          {secondsLeft > 0 ? (
            <Typography variant="callout" color="textMuted">
              {timerLabel}
            </Typography>
          ) : (
            <Typography variant="callout" weight="600" tint={theme.colors.plusCta}>
              {t('auth.verify_resend')}
            </Typography>
          )}
        </Pressable>

        <AuthPrimaryButton
          label={t('auth.verify_action')}
          loading={submitting}
          onPress={() => {
            void verify(code);
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  box: {
    flex: 1,
    maxWidth: 42,
    height: 58,
    borderWidth: 1,
    borderRadius: 15,
    textAlign: 'center',
    paddingVertical: 0,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 24,
  },
});

export default EmailVerificationScreen;
