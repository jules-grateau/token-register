import type {
  AuthResponseType,
  AuthUserType,
  ChangePasswordRequestType,
  LoginRequestType,
} from 'shared-ts';
import { BASE_API_URL } from '../config';

const API_URL = BASE_API_URL + '/auth';

/** Outcome of a login attempt (D-063, answer 6 a: one message for every refusal). */
export type LoginResult =
  | { ok: true; user: AuthUserType }
  | { ok: false; reason: 'invalid' }
  | { ok: false; reason: 'too_many'; retryAfterSeconds: number }
  | { ok: false; reason: 'error' };

/**
 * The session lives in an httpOnly cookie (D-063): the page never sees the token, the browser
 * sends it (`credentials: 'include'`). Plain fetch, outside RTK Query: these calls must never
 * trigger the "session expired" handling of the other APIs (services/baseQuery.ts).
 */
export async function fetchCurrentUser(): Promise<AuthUserType | null> {
  const res = await fetch(`${API_URL}/me`, { credentials: 'include' });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`GET /auth/me -> ${res.status}`);
  return ((await res.json()) as AuthResponseType).user;
}

export async function login(credentials: LoginRequestType): Promise<LoginResult> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
  } catch {
    return { ok: false, reason: 'error' };
  }
  if (res.ok) return { ok: true, user: ((await res.json()) as AuthResponseType).user };
  if (res.status === 401) return { ok: false, reason: 'invalid' };
  if (res.status === 429) {
    const body = (await res.json().catch(() => null)) as { retryAfterSeconds?: unknown } | null;
    const seconds = Number(body?.retryAfterSeconds);
    return { ok: false, reason: 'too_many', retryAfterSeconds: seconds > 0 ? seconds : 60 };
  }
  return { ok: false, reason: 'error' };
}

/** Outcome of POST /auth/password (D-064). */
export type ChangePasswordResult =
  | { ok: true; user: AuthUserType }
  | { ok: false; reason: 'wrong_current' | 'same' | 'invalid' | 'expired' | 'error' }
  | { ok: false; reason: 'too_many'; retryAfterSeconds: number };

/**
 * One's own password, also the way out of a temporary one. Plain fetch like the login: a
 * wrong current password must never look like an expired session.
 */
export async function changePassword(
  body: ChangePasswordRequestType
): Promise<ChangePasswordResult> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/password`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, reason: 'error' };
  }
  if (res.ok) return { ok: true, user: ((await res.json()) as AuthResponseType).user };
  if (res.status === 401) return { ok: false, reason: 'expired' };
  const data = (await res.json().catch(() => null)) as {
    code?: unknown;
    retryAfterSeconds?: unknown;
  } | null;
  if (res.status === 429) {
    const seconds = Number(data?.retryAfterSeconds);
    return { ok: false, reason: 'too_many', retryAfterSeconds: seconds > 0 ? seconds : 60 };
  }
  if (data?.code === 'WRONG_PASSWORD') return { ok: false, reason: 'wrong_current' };
  if (data?.code === 'SAME_PASSWORD') return { ok: false, reason: 'same' };
  if (data?.code === 'PASSWORD_INVALID') return { ok: false, reason: 'invalid' };
  return { ok: false, reason: 'error' };
}

/** Closes the session. An error (network, already expired) changes nothing for the user. */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_URL}/logout`, { method: 'POST', credentials: 'include' });
  } catch {
    // The local state is cleared anyway; the session expires on its own.
  }
}
