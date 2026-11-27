import {
  hashPassword,
  PASSWORD_MIN_LENGTH,
  validatePassword,
  verifyAgainstDummy,
  verifyPassword,
} from '../password';

describe('passwords (D-063, point 8)', () => {
  it('accepts 6 characters or more, with no complexity rule', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(6);
    expect(validatePassword('abcdef')).toBeNull();
    expect(validatePassword('      ')).toBeNull();
    expect(validatePassword('abcde')).toMatch('at least 6');
    expect(validatePassword(undefined)).toMatch('at least 6');
    expect(validatePassword(123456)).toMatch('at least 6');
    expect(validatePassword('a'.repeat(256))).toBeNull();
    expect(validatePassword('a'.repeat(257))).toMatch('at most 256');
  });

  it('hashes with scrypt and a random salt, never the password itself', async () => {
    const password = 'fake-secret-1';
    const first = await hashPassword(password);
    const second = await hashPassword(password);
    expect(first).toMatch(/^scrypt\$16384\$8\$1\$[^$]+\$[^$]+$/);
    expect(first).not.toContain(password);
    expect(first).not.toBe(second);
    expect(await verifyPassword(password, first)).toBe(true);
    expect(await verifyPassword(password, second)).toBe(true);
    expect(await verifyPassword('fake-secret-2', first)).toBe(false);
  });

  it('never matches a malformed stored hash', async () => {
    for (const stored of [
      '',
      'x',
      'scrypt$1$2$3$aa$bb',
      'bcrypt$16384$8$1$aa$bb',
      'scrypt$a$b$c$d$e',
    ]) {
      expect(await verifyPassword('whatever', stored)).toBe(false);
    }
  });

  it('does the same work for an unknown account, and always refuses', async () => {
    expect(await verifyAgainstDummy('anything')).toBe(false);
  });
});
