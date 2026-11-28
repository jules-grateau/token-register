import { extractApiErrorCode, extractApiErrorText } from '../../utils/extractApiError';

/** API codes of the accounts routes with a translated message (D-064). */
const KNOWN_CODES = [
  'USERNAME_TAKEN',
  'USERNAME_INVALID',
  'PASSWORD_INVALID',
  'ROLE_INVALID',
  'SELF_ACCOUNT_CHANGE',
  'SELF_PASSWORD_RESET',
  'LAST_ACTIVE_ADMIN',
  'ACCOUNT_DISABLED',
] as const;

/** Translated message of a refused account action; the API text, or a generic one, otherwise. */
export function accountErrorMessage(error: unknown, t: (key: string) => string): string {
  const code = extractApiErrorCode(error);
  if (code && (KNOWN_CODES as readonly string[]).includes(code)) {
    return t(`accounts.errors.${code}`);
  }
  return extractApiErrorText(error) ?? t('accounts.errors.generic');
}

/** Username rule of D-063 (answer 5 a), checked before sending: same as the API. */
export const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,32}$/;
