import { BLOCK_MS, IP_LIMITS, LoginRateLimiter, MAX_FAILURES } from '../loginRateLimiter';

describe('LoginRateLimiter (D-063, point 7)', () => {
  let now = 1_000_000;
  const limiter = () => new LoginRateLimiter(() => now);
  const key = LoginRateLimiter.key('marie', '10.0.0.1');

  beforeEach(() => {
    now = 1_000_000;
  });

  it('blocks the 5th failure for 1 minute, then starts the count again', () => {
    const l = limiter();
    for (let i = 1; i < MAX_FAILURES; i++) expect(l.recordFailure(key)).toEqual({ blocked: false });
    expect(l.recordFailure(key)).toEqual({ blocked: true, retryAfterSeconds: 60 });
    expect(l.check(key)).toEqual({ blocked: true, retryAfterSeconds: 60 });

    now += 30_000;
    expect(l.check(key)).toEqual({ blocked: true, retryAfterSeconds: 30 });

    now += BLOCK_MS;
    expect(l.check(key)).toEqual({ blocked: false });
    expect(l.recordFailure(key)).toEqual({ blocked: false });
  });

  it('counts per username and IP', () => {
    const l = limiter();
    for (let i = 0; i < MAX_FAILURES; i++) l.recordFailure(key);
    expect(l.check(LoginRateLimiter.key('marie', '10.0.0.2'))).toEqual({ blocked: false });
    expect(l.check(LoginRateLimiter.key('paul', '10.0.0.1'))).toEqual({ blocked: false });
  });

  it('per IP alone: 50 failures without a 1-minute pause wait 1 minute (TL-1)', () => {
    const l = new LoginRateLimiter(() => now, IP_LIMITS);
    for (let i = 1; i < 50; i++) {
      now += 1000;
      expect(l.recordFailure('10.0.0.1')).toEqual({ blocked: false });
    }
    expect(l.recordFailure('10.0.0.1')).toEqual({ blocked: true, retryAfterSeconds: 60 });
    now += 60_000;
    expect(l.check('10.0.0.1')).toEqual({ blocked: false });

    // A pause of more than 1 minute forgets the failures.
    for (let i = 1; i < 50; i++) l.recordFailure('10.0.0.2');
    now += 61_000;
    expect(l.recordFailure('10.0.0.2')).toEqual({ blocked: false });
  });

  it('starts again after a success', () => {
    const l = limiter();
    for (let i = 1; i < MAX_FAILURES; i++) l.recordFailure(key);
    l.reset(key);
    expect(l.recordFailure(key)).toEqual({ blocked: false });
  });

  it('forgets the failures after 15 minutes without any, and stays bounded', () => {
    const l = limiter();
    l.recordFailure(key);
    now += 16 * 60_000;
    expect(l.check(key)).toEqual({ blocked: false });
    expect(l.size).toBe(0);

    for (let i = 0; i < 10_050; i++) l.recordFailure(LoginRateLimiter.key(`user${i}`, 'ip'));
    expect(l.size).toBeLessThanOrEqual(10_000);
  });
});
