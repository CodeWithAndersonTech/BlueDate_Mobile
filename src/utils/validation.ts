const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  if (!email || email.length > 254) {
    return false;
  }
  return EMAIL_REGEX.test(email);
}

/** Login accepts email or phone; validate accordingly. */
export function isValidLoginIdentifier(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  if (trimmed.includes('@')) {
    return isValidEmail(trimmed);
  }
  // Simple international phone: optional +, 10–15 digits
  return /^\+?[0-9]{10,15}$/.test(trimmed.replace(/[\s-]/g, ''));
}
