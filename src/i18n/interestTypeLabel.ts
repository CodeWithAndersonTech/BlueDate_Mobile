type Translate = (key: string) => string;

type InterestLabelInput = {
  Code?: string | null;
  Name?: string | null;
  KeyName?: string | null;
  InterestTypeCode?: string | null;
  InterestTypeName?: string | null;
};

const TYPE_KEYS: Record<string, string> = {
  food: 'interest.type.food',
  dessert: 'interest.type.dessert',
  coffee: 'interest.type.coffee',
  beverage: 'interest.type.beverage',
  drink: 'interest.type.beverage',
};

function typeKeyFromHay(hay: string): string | undefined {
  if (/food|yemek|yeme/.test(hay)) return 'interest.type.food';
  if (/dessert|tatlı|tatl/.test(hay)) return 'interest.type.dessert';
  if (/coffee|kahve/.test(hay)) return 'interest.type.coffee';
  if (/drink|beverage|alcohol|alkol|içecek|icecek/.test(hay)) {
    return 'interest.type.beverage';
  }
  return undefined;
}

/** Category title (Yemek / Kahve / Tatlı) — never leave the API’s Turkish Name as-is. */
export function interestTypeLabel(t: Translate, input: InterestLabelInput): string {
  const code = (input.Code ?? input.InterestTypeCode ?? '').toLowerCase().trim();
  const fallback =
    input.Name ??
    input.InterestTypeName ??
    input.Code ??
    input.InterestTypeCode ??
    '';
  const key =
    TYPE_KEYS[code] ??
    typeKeyFromHay(
      `${code} ${input.Name ?? ''} ${input.InterestTypeName ?? ''} ${input.KeyName ?? ''}`,
    );
  if (!key) return fallback;
  const localized = t(key);
  return localized && localized !== key ? localized : fallback;
}
