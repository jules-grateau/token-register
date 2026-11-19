import {
  buildVersionInfo,
  formatVersionForClipboard,
  getAppVersionInfo,
  toReleaseChannel,
} from '../version';

describe('toReleaseChannel', () => {
  it('keeps known channels', () => {
    expect(toReleaseChannel('production')).toBe('production');
    expect(toReleaseChannel('demo')).toBe('demo');
    expect(toReleaseChannel('development')).toBe('development');
  });

  it('falls back to development for unknown or missing values', () => {
    expect(toReleaseChannel('staging')).toBe('development');
    expect(toReleaseChannel('')).toBe('development');
    expect(toReleaseChannel(undefined)).toBe('development');
  });
});

describe('buildVersionInfo', () => {
  it('hides the commit in production', () => {
    expect(buildVersionInfo('1.2.0', 'abc1234', 'production')).toEqual({
      version: '1.2.0',
      channel: 'production',
    });
  });

  it('exposes the commit in demo', () => {
    expect(buildVersionInfo('1.2.0', 'abc1234', 'demo')).toEqual({
      version: '1.2.0',
      commit: 'abc1234',
      channel: 'demo',
    });
  });

  it('omits an empty commit', () => {
    expect(buildVersionInfo('1.2.0', '', 'development')).not.toHaveProperty('commit');
  });

  it('never returns an undefined version', () => {
    expect(buildVersionInfo(undefined, undefined, undefined).version).toBe('0.0.0');
  });
});

describe('formatVersionForClipboard', () => {
  it('formats production as the version only', () => {
    expect(formatVersionForClipboard({ version: '1.0.0', channel: 'production' })).toBe(
      'Token Register v1.0.0'
    );
  });

  it('formats demo with commit and environment', () => {
    expect(
      formatVersionForClipboard({ version: '1.0.0', commit: 'abc1234', channel: 'demo' })
    ).toBe('Token Register v1.0.0 (abc1234) – demo');
  });

  it('skips a missing commit', () => {
    expect(formatVersionForClipboard({ version: '1.0.0', channel: 'development' })).toBe(
      'Token Register v1.0.0 – development'
    );
  });
});

describe('getAppVersionInfo', () => {
  it('works without build-time injection (Jest)', () => {
    expect(getAppVersionInfo()).toEqual({ version: '0.0.0', channel: 'development' });
  });
});
