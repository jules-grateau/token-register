/**
 * Usernames (D-063, answer 5 a): 3 to 32 characters, letters, digits, ".", "_" and "-", spaces
 * at both ends removed. Unique without case: `Marie` = `marie` (users.username is
 * COLLATE NOCASE). The name is kept as typed; comparisons ignore the case.
 */
export const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,32}$/;

export function normalizeUsername(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Error message when the (normalized) username breaks the rules, or null when it is valid. */
export function validateUsername(username: string): string | null {
  return USERNAME_PATTERN.test(username)
    ? null
    : 'The username must be 3 to 32 characters: letters, digits, ".", "_" or "-".';
}

/** Key used where the case must not matter (login attempts limiter). */
export function usernameKey(value: unknown): string {
  return normalizeUsername(value).toLowerCase();
}
