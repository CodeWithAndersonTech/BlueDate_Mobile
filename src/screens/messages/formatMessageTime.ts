export function formatMessageTime(
  iso: string | null | undefined,
  fallback: string,
  t: (key: string) => string,
): string {
  if (fallback === 'now') return t('messages.time_now');
  if (!iso) return fallback;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return fallback;
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t('messages.time_now');
  if (mins < 60) {
    return t('messages.time_minutes').replace('{n}', String(mins));
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return t('messages.time_hours').replace('{n}', String(hours));
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return t('messages.time_days').replace('{n}', String(days));
  }
  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return t('messages.time_weeks').replace('{n}', String(weeks));
  }
  const months = Math.max(1, Math.floor(days / 30));
  return t('messages.time_months').replace('{n}', String(months));
}
