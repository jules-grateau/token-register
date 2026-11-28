import { normalizeUsername, usernameKey, validateUsername } from '../username';

describe('usernames (D-063, answer 5 a)', () => {
  it('trims the spaces at both ends', () => {
    expect(normalizeUsername('  marie  ')).toBe('marie');
    expect(normalizeUsername(undefined)).toBe('');
    expect(normalizeUsername(42)).toBe('');
  });

  it('accepts 3 to 32 letters, digits, ".", "_" and "-"', () => {
    for (const name of ['abc', 'Marie.D', 'caisse_2', 'bar-1', 'a'.repeat(32)]) {
      expect(validateUsername(name)).toBeNull();
    }
    for (const name of ['ab', 'a'.repeat(33), 'marie d', 'marie@x', '', 'caisse/1']) {
      expect(validateUsername(name)).toMatch('3 to 32 characters');
    }
  });

  it('ignores the case for the limiter key', () => {
    expect(usernameKey(' Marie ')).toBe(usernameKey('marie'));
  });
});
