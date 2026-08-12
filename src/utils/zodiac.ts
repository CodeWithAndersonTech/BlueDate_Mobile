/** Tropical zodiac — symbol only (no display name required in UI). */
export type ZodiacSign = {
  id: string;
  /** Unicode astrology glyph, e.g. ♐ */
  symbol: string;
};

/**
 * Resolve tropical zodiac from calendar month (1–12) and day.
 * Example: 15 Dec → Sagittarius ♐
 */
export function zodiacFromMonthDay(month: number, day: number): ZodiacSign {
  const md = month * 100 + day;

  if (md >= 1222 || md <= 119) {
    return { id: 'capricorn', symbol: '♑' };
  }
  if (md <= 218) {
    return { id: 'aquarius', symbol: '♒' };
  }
  if (md <= 320) {
    return { id: 'pisces', symbol: '♓' };
  }
  if (md <= 419) {
    return { id: 'aries', symbol: '♈' };
  }
  if (md <= 520) {
    return { id: 'taurus', symbol: '♉' };
  }
  if (md <= 620) {
    return { id: 'gemini', symbol: '♊' };
  }
  if (md <= 722) {
    return { id: 'cancer', symbol: '♋' };
  }
  if (md <= 822) {
    return { id: 'leo', symbol: '♌' };
  }
  if (md <= 922) {
    return { id: 'virgo', symbol: '♍' };
  }
  if (md <= 1022) {
    return { id: 'libra', symbol: '♎' };
  }
  if (md <= 1121) {
    return { id: 'scorpio', symbol: '♏' };
  }
  return { id: 'sagittarius', symbol: '♐' };
}

export function zodiacFromDate(date: Date): ZodiacSign {
  return zodiacFromMonthDay(date.getMonth() + 1, date.getDate());
}
