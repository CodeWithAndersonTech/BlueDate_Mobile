import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import type { Purchase } from 'react-native-iap';
import {
  createTreat,
  getTreatQuote,
  StorePayment,
  Treat,
  TreatQuote,
  UserProfileInterest,
} from '../../api';
import { FigmaButton, FigmaIcon, SheetModal, Typography } from '../../components';
import { useLocale, userFacingError } from '../../i18n';
import {
  buyProduct,
  completePurchase,
  getDisplayPrices,
  IapCancelledError,
  IapUnavailableError,
} from '../../services/iap';
import { useTheme } from '../../theme';

type Props = {
  visible: boolean;
  receiverUserId: number;
  receiverName: string;
  favorites: UserProfileInterest[];
  onClose: () => void;
  onSent: (treat: Treat) => void;
};

/** "Favori Seç" — pick one of the receiver's favorites and treat them. */
export function TreatSheet({
  visible,
  receiverUserId,
  receiverName,
  favorites,
  onClose,
  onSent,
}: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [quote, setQuote] = useState<TreatQuote | null>(null);
  const [price, setPrice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // A paid-but-unsent store transaction is reused on retry instead of charging again.
  const pending = useRef<{ payment: StorePayment; purchase: Purchase } | null>(null);

  const maxLen = quote?.messageMaxLength ?? 60;

  const emojiFor = (code?: string | null) => {
    const key = (code ?? '').toLowerCase();
    if (key === 'food') return '🍕';
    if (key === 'dessert') return '🍰';
    if (key === 'coffee') return '☕';
    if (key === 'beverage') return '🍸';
    return '✨';
  };

  useEffect(() => {
    if (!visible) return;
    setSelectedId(favorites.length === 1 ? favorites[0].Id : null);
    setMessage('');
    let cancelled = false;
    getTreatQuote()
      .then(async q => {
        if (cancelled) return;
        setQuote(q);
        if (q.requiresPayment && q.productId) {
          const prices = await getDisplayPrices([q.productId], 'in-app');
          if (!cancelled) setPrice(prices[q.productId] ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setQuote(null);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, favorites]);

  const send = async () => {
    if (!selectedId || sending) return;
    setSending(true);
    try {
      const q = quote ?? (await getTreatQuote());
      let paid = pending.current;
      if (q.requiresPayment && !paid) {
        paid = await buyProduct(q.productId, 'in-app');
        pending.current = paid;
      }

      const next = await createTreat({
        receiverUserId,
        userInterestId: selectedId,
        message,
        payment: q.requiresPayment ? paid?.payment : undefined,
      });

      if (paid) {
        await completePurchase(paid.purchase, true);
        pending.current = null;
      }
      onSent(next);
    } catch (error) {
      if (error instanceof IapCancelledError) return;
      Alert.alert(
        t('treat.title'),
        error instanceof IapUnavailableError
          ? t('iap.unavailable')
          : userFacingError(error, t, 'treat.send_error'),
      );
    } finally {
      setSending(false);
    }
  };

  const cta = quote?.requiresPayment
    ? price
      ? t('treat.send_paid').replace('{price}', price)
      : t('treat.send_paid_noprice')
    : t('treat.send');

  return (
    <SheetModal
      visible={visible}
      title={t('treat.pick_title')}
      onClose={onClose}
      dismissable={!sending}>
      <Typography variant="caption" color="textMuted">
        {t('treat.pick_subtitle').replace('{name}', receiverName)}
      </Typography>

      {favorites.length === 0 ? (
        <View
          style={[
            styles.empty,
            {
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.md,
              padding: theme.space.lg,
            },
          ]}>
          <Typography variant="callout" color="textMuted" align="center">
            {t('treat.no_favorites')}
          </Typography>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={{ gap: theme.space.sm }}>
          {favorites.map(fav => {
            const selected = fav.Id === selectedId;
            return (
              <Pressable
                key={fav.Id}
                onPress={() => setSelectedId(fav.Id)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[
                  styles.option,
                  {
                    borderRadius: theme.radius.md,
                    padding: theme.space.md,
                    gap: theme.space.md,
                    borderColor: selected ? theme.colors.plusCta : theme.colors.border,
                    backgroundColor: selected ? theme.colors.plusSoft : theme.colors.surfaceAlt,
                  },
                ]}>
                <Typography variant="title">{emojiFor(fav.InterestTypeCode)}</Typography>
                <View style={styles.optionTexts}>
                  <Typography variant="caption" color="textMuted" numberOfLines={1}>
                    {fav.InterestTypeName || fav.InterestTypeCode}
                  </Typography>
                  <Typography variant="bodyStrong" numberOfLines={1}>
                    {fav.Value}
                  </Typography>
                </View>
                <View
                  style={[
                    styles.radio,
                    { borderColor: selected ? theme.colors.plusCta : theme.colors.borderStrong },
                  ]}>
                  {selected ? (
                    <View style={[styles.radioDot, { backgroundColor: theme.colors.plusCta }]} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={{ gap: theme.space.xs }}>
        <Typography variant="caption" color="textMuted">
          {t('treat.message_label')}
        </Typography>
        <TextInput
          value={message}
          onChangeText={setMessage}
          maxLength={maxLen}
          placeholder={t('treat.message_placeholder')}
          placeholderTextColor={theme.colors.textMuted}
          multiline
          style={[
            theme.typography.variants.body,
            styles.input,
            {
              color: theme.colors.text,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surfaceAlt,
              borderRadius: theme.radius.md,
              paddingHorizontal: theme.space.md,
              paddingVertical: theme.space.sm,
            },
          ]}
        />
        <Typography variant="caption" color="textMuted" align="right">
          {message.length}/{maxLen}
        </Typography>
      </View>

      {quote?.requiresPayment ? (
        <View style={styles.note}>
          <FigmaIcon name="crown" size={theme.iconSize.xs} color={theme.colors.premium} />
          <Typography variant="caption" color="textMuted" style={styles.noteText}>
            {t('treat.premium_free_hint')}
          </Typography>
        </View>
      ) : null}

      <FigmaButton
        label={cta}
        size="md"
        fullWidth
        disabled={!selectedId || favorites.length === 0}
        loading={sending}
        onPress={() => {
          void send();
        }}
      />
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  empty: { borderWidth: 1, borderStyle: 'dashed' },
  list: { maxHeight: 280 },
  option: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  optionTexts: { flex: 1, minWidth: 0 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  input: { minHeight: 72, borderWidth: 1, textAlignVertical: 'top' },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  noteText: { flex: 1 },
});

export default TreatSheet;
