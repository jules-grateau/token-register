import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'crypto';

/** Point 8 of D-063: 6 characters minimum, no complexity rule. */
export const PASSWORD_MIN_LENGTH = 6;
/** TL-2 of PR #97: longer is refused before scrypt (no useless hashing of huge inputs). */
export const PASSWORD_MAX_LENGTH = 256;

// scrypt cost (N, r, p): the Node defaults, ~50 ms and 16 MB per hash. Stored with each hash,
// so that they can be raised later without invalidating the existing passwords.
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const PREFIX = 'scrypt';

function derive(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, { ...options, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key)
    );
  });
}

/** Error message when the password breaks the rules, or null when it is valid. */
export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    return `The password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `The password must be at most ${PASSWORD_MAX_LENGTH} characters long.`;
  }
  return null;
}

/** `scrypt$N$r$p$<salt base64>$<key base64>`. Never logged nor returned by the API. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, SCRYPT_PARAMS);
  const { N, r, p } = SCRYPT_PARAMS;
  return [PREFIX, N, r, p, salt.toString('base64'), key.toString('base64')].join('$');
}

/** Constant-time comparison. A malformed stored hash never matches. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== PREFIX) return false;
  const [N, r, p] = parts.slice(1, 4).map(Number);
  if (![N, r, p].every((n) => Number.isInteger(n) && n > 0)) return false;
  const salt = Buffer.from(parts[4], 'base64');
  const expected = Buffer.from(parts[5], 'base64');
  if (expected.length !== KEY_LENGTH) return false;
  try {
    const key = await derive(password, salt, { N, r, p });
    return timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | null = null;

/**
 * Same work as a real check, for an unknown or disabled account: the response time does not
 * tell which usernames exist. Always false.
 */
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHash ??= hashPassword(randomBytes(16).toString('hex'));
  await verifyPassword(password, await dummyHash);
  return false;
}
