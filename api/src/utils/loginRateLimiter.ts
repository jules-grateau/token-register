/**
 * Failed logins (D-063, point 7): after 5 failures for the same username and IP, that pair
 * waits 1 minute. A success, or the end of the wait, starts the count again.
 *
 * Kept in memory: a restart of the API resets every count (documented in deploy/README.md).
 * The table is bounded: entries without a failure for IDLE_MS are dropped, and past
 * MAX_ENTRIES the oldest ones go first.
 */
export const MAX_FAILURES = 5;
export const BLOCK_MS = 60_000;
const IDLE_MS = 15 * 60_000;
const MAX_ENTRIES = 10_000;

type Entry = { failures: number; lastFailureAt: number; blockedUntil: number };

export type LimiterState = { blocked: false } | { blocked: true; retryAfterSeconds: number };

export class LoginRateLimiter {
  private readonly entries = new Map<string, Entry>();

  constructor(private readonly now: () => number = Date.now) {}

  static key(usernameKey: string, ip: string | undefined): string {
    return `${usernameKey}\n${ip ?? ''}`;
  }

  private live(key: string): Entry | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    const now = this.now();
    const blockOver = entry.blockedUntil !== 0 && entry.blockedUntil <= now;
    if (blockOver || now - entry.lastFailureAt > IDLE_MS) {
      this.entries.delete(key);
      return undefined;
    }
    return entry;
  }

  private stateOf(entry: Entry | undefined): LimiterState {
    const now = this.now();
    if (entry && entry.blockedUntil > now) {
      return { blocked: true, retryAfterSeconds: Math.ceil((entry.blockedUntil - now) / 1000) };
    }
    return { blocked: false };
  }

  /** Whether this pair must wait, before checking the password. */
  check(key: string): LimiterState {
    return this.stateOf(this.live(key));
  }

  /** Records a failure; the 5th one starts the wait (returned as blocked). */
  recordFailure(key: string): LimiterState {
    const now = this.now();
    const entry = this.live(key) ?? { failures: 0, lastFailureAt: now, blockedUntil: 0 };
    entry.failures += 1;
    entry.lastFailureAt = now;
    if (entry.failures >= MAX_FAILURES) entry.blockedUntil = now + BLOCK_MS;
    // Re-inserted last: the Map order is the order of the last failure.
    this.entries.delete(key);
    this.entries.set(key, entry);
    this.prune();
    return this.stateOf(entry);
  }

  reset(key: string): void {
    this.entries.delete(key);
  }

  get size(): number {
    return this.entries.size;
  }

  private prune(): void {
    if (this.entries.size <= MAX_ENTRIES) return;
    for (const key of [...this.entries.keys()]) this.live(key);
    for (const key of this.entries.keys()) {
      if (this.entries.size <= MAX_ENTRIES) break;
      this.entries.delete(key);
    }
  }
}
