/** Same limits as the API (D-063 point 8, TL-2 of PR #97). */
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 256;

/** i18n key of the length error of a new password, or null (D-064: written, never colored only). */
export function passwordLengthError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return 'auth.change_password.too_short';
  if (password.length > PASSWORD_MAX_LENGTH) return 'auth.change_password.too_long';
  return null;
}
